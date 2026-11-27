/**
 * Adds the short-vowel marks (اِعراب) to Persian script, using the course's Finglish as the guide.
 *
 *   vocalize('مبل', 'mobl')         → 'مُبل'
 *   vocalize('چشم', 'cheshm')       → 'چِشم'
 *   vocalize('کتاب من', 'ketâb-e man') → 'کِتابِ مَن'
 *
 * Written Persian leaves out a, e and o, so a speech engine has to guess them and sometimes guesses wrong
 * (mabl for mobl). The Finglish says exactly which vowel is meant, so the audio generator reads the
 * vocalised text instead, and the app can show the marks to beginners.
 *
 * Returns null when the Finglish and the script cannot be lined up (a typo in either, or a spoken form);
 * scripts/check-vowels.ts lists those so they can be fixed.
 */

// Written as escapes on purpose: these characters are invisible or combining, and get lost in copy-paste.
const FATHA = 'َ'
const KASRA = 'ِ'
const DAMMA = 'ُ'
const SHADDA = 'ّ'
const TANVIN_AN = 'ً'
const ZWNJ = '‌'
const MARK: Record<string, string> = { a: FATHA, e: KASRA, o: DAMMA }

/** Finglish spellings of each consonant letter. */
const CONS: Record<string, string[]> = {
  'ب': ['b'], 'پ': ['p'], 'ت': ['t'], 'ث': ['s'], 'ج': ['j'], 'چ': ['ch'], 'ح': ['h'], 'خ': ['kh'],
  'د': ['d'], 'ذ': ['z'], 'ر': ['r'], 'ز': ['z'], 'ژ': ['zh'], 'س': ['s'], 'ش': ['sh'], 'ص': ['s'],
  'ض': ['z'], 'ط': ['t'], 'ظ': ['z'], 'غ': ['gh'], 'ف': ['f'], 'ق': ['gh', 'q'], 'ک': ['k'], 'ك': ['k'],
  'گ': ['g'], 'ل': ['l'], 'م': ['m'], 'ن': ['n'],
  // Glottal letters: often silent in Finglish, or written as '.
  'ع': ["'", ''], 'ء': ["'", ''], 'ئ': ["'", 'y', ''], 'أ': ["'", ''], 'ؤ': ["'", ''],
}
const PERSIAN_LETTER = /[ء-يپچژکگی]/
const HARAKAT = /[ً-ْٰ]/
const HARAKAT_ALL = /[ً-ْٰ]/g
/** Characters in Finglish that carry no sound of their own. */
const TR_SKIP = /[\s\-,.?!:;"«»()…/]/

interface Step { len: number; out: string; cost: number; mark?: boolean }
interface Best { cost: number; out: string }

/** The ways one letter (at fa[i]) can be read from tr starting at j. */
function readings(fa: string, i: number, tr: string, j: number): Step[] {
  const ch = fa[i]
  const prev = fa[i - 1]
  const next = fa[i + 1]
  const wordStart = i === 0 || !PERSIAN_LETTER.test(prev ?? '')
  const wordEnd = !next || !PERSIAN_LETTER.test(next)
  const at = (s: string) => tr.startsWith(s, j)
  const out: Step[] = []
  const consonant = (spellings: string[]) => {
    for (const s of spellings) {
      if (!at(s)) continue
      out.push({ len: s.length, out: ch, cost: s === '' ? 1 : 0, mark: true })
      // Doubled consonant (tashdid): amme, bachche.
      if (s && tr.startsWith(s, j + s.length)) out.push({ len: 2 * s.length, out: ch + SHADDA, cost: 0.5, mark: true })
    }
  }
  switch (ch) {
    case 'آ':
      if (at('â')) out.push({ len: 1, out: ch, cost: 0 })
      if (at("'â")) out.push({ len: 2, out: ch, cost: 0 })
      break
    case 'ا':
      if (wordStart) {
        // Word-initial alef carries the vowel: esm → اِسم, ab → اَب, omid → اُمید.
        out.push({ len: 0, out: ch, cost: 0, mark: true })
        if (at('â')) out.push({ len: 1, out: ch, cost: 0.5 })
        if (at('i')) out.push({ len: 1, out: ch, cost: 1 })
        if (at('u')) out.push({ len: 1, out: ch, cost: 1 })
      } else {
        if (at('â')) out.push({ len: 1, out: ch, cost: 0 })
        if (at('a')) out.push({ len: 1, out: ch, cost: 1 }) // Arabic loans, -an endings
        if (at("'â")) out.push({ len: 2, out: ch, cost: 0.5 })
      }
      break
    case 'و':
      if (at('v')) out.push({ len: 1, out: ch, cost: 0, mark: true })
      if (at('vv')) out.push({ len: 2, out: ch + SHADDA, cost: 0.5, mark: true }) // avval
      if (at('uv')) out.push({ len: 2, out: ch, cost: 0.2, mark: true })
      if (at('w')) out.push({ len: 1, out: ch, cost: 0.5, mark: true })
      // The diphthong ow (now, dowlat, towzih) is written with a fatha before the و, as dictionaries do
      // (نَو, دَولَت): without it the voice has to guess between u, o and ow.
      if (at('ow') && !wordStart) out.push({ len: 2, out: FATHA + ch, cost: 0.5 })
      if (at('ow') && wordStart) out.push({ len: 2, out: ch, cost: 0.5 })
      if (at('u')) out.push({ len: 1, out: ch, cost: 0 })
      // to, do, cho: the o is written with و; a damma on the letter before makes it unmistakable (تُو, not tu).
      if (at('o') && !wordStart) out.push({ len: 1, out: DAMMA + ch, cost: 0.5 })
      if (wordStart && wordEnd && at('o')) out.push({ len: 1, out: ch, cost: 0 }) // "and" said o: âb o havâ
      if (wordStart && wordEnd && at('va')) out.push({ len: 2, out: ch, cost: 0 }) // "and"
      if (prev === 'خ' && next === 'ا') out.push({ len: 0, out: ch, cost: 0 }) // silent: khâhar, khâb
      if (prev === 'خ' && next === 'د') out.push({ len: 0, out: ch, cost: 0.5 }) // khod (خود)
      break
    case 'ی':
    case 'ي':
    case 'ى':
      if (at('y')) out.push({ len: 1, out: ch, cost: 0, mark: true })
      if (at('yy')) out.push({ len: 2, out: ch + SHADDA, cost: 0.5, mark: true }) // niyyat
      if (at('iyy')) out.push({ len: 3, out: ch + SHADDA, cost: 0.5, mark: true })
      if (at('i')) out.push({ len: 1, out: ch, cost: 0 })
      if (at('iy')) out.push({ len: 2, out: ch, cost: 0.1, mark: true }) // chiye, khiyâbân, riyâl
      if (at('ey')) out.push({ len: 2, out: ch, cost: 0.2 })
      if (at('ay')) out.push({ len: 2, out: ch, cost: 0.2 })
      if (wordEnd && at('â')) out.push({ len: 1, out: ch, cost: 1 }) // Mustafâ-like loans
      if (wordEnd && at('a')) out.push({ len: 1, out: ch, cost: 1 }) // hattâ-like loans
      if (wordEnd && at('e')) out.push({ len: 1, out: ch, cost: 0.5 })
      break
    case 'ه':
    case 'ة':
      if (at('h')) out.push({ len: 1, out: ch, cost: 0, mark: true })
      if (wordEnd || next === ZWNJ) {
        // Silent final he after a vowel: khâne, na, che.
        if (at('e')) out.push({ len: 1, out: ch, cost: 0 })
        if (at('a')) out.push({ len: 1, out: ch, cost: 0.2 })
        if (at('eh')) out.push({ len: 2, out: ch, cost: 0.2 })
        if (at('at')) out.push({ len: 2, out: ch, cost: 1 }) // ta marbuta
      }
      break
    default:
      if (CONS[ch]) consonant(CONS[ch])
  }
  return out
}

/** Vocalise Persian text with the help of its Finglish. Existing marks are kept. */
export function vocalize(fa: string, tr: string): string | null {
  const F = fa.normalize('NFC')
  const T = tr.normalize('NFC').toLowerCase().replace(/[’`]/g, "'")
  const memo = new Map<string, Best | null>()

  // i: position in F, j: position in T, m: may the letter just written take a short-vowel mark?
  const go = (i: number, j: number, m: boolean): Best | null => {
    const id = `${i},${j},${m ? 1 : 0}`
    if (memo.has(id)) return memo.get(id)!
    memo.set(id, null) // guard against loops
    let best: Best | null = null
    const take = (r: Best | null, add: string, cost: number) => {
      if (r && (!best || r.cost + cost < best.cost)) best = { cost: r.cost + cost, out: add + r.out }
    }

    if (i === F.length) {
      // Only silent characters, or a final ezâfe / short vowel, may remain.
      const rest = T.slice(j).replace(/[\s,.?!:;"«»()…]+$/, '')
      if (!rest.replace(/[\s\-,.?!:;"«»()…]/g, '')) best = { cost: 0, out: '' }
      // A final ezâfe on a word tile: ketâb-e, khâne-ye.
      else if ((rest === '-e' || rest === 'e') && m) best = { cost: 0, out: KASRA }
      else if ((rest === 'a' || rest === 'o') && m) best = { cost: 0, out: MARK[rest] }
      else if (rest === '-ye' || rest === '-e') best = { cost: 0.5, out: '' }
      memo.set(id, best)
      return best
    }

    // Finglish characters with no sound (spaces, punctuation, hyphens).
    if (j < T.length && TR_SKIP.test(T[j])) {
      // Ezâfe written as -e: the kasra goes on the last letter, which has already been written.
      if (T[j] === '-' && T[j + 1] === 'e' && (j + 2 === T.length || TR_SKIP.test(T[j + 2])) && m && F[i] !== KASRA) {
        take(go(i, j + 2, false), KASRA, 0)
      }
      // A space or hyphen ends the syllable: a vowel after it belongs to the next word.
      // A space in the Finglish in the middle of a written word is almost always a misalignment: the
      // last letter of one word taking the first vowel of the next (khâne esterâhat read as خانِه + استراحت).
      const midWord = /\s/.test(T[j]) && i > 0 && PERSIAN_LETTER.test(F[i]) && PERSIAN_LETTER.test(F[i - 1])
      take(go(i, j + 1, false), '', midWord ? 3 : 0)
    }
    // A short vowel in Finglish after a markable letter becomes a mark.
    // (Not when the script already carries a mark there: that mark stands for the vowel, see below.)
    if (m && j < T.length && MARK[T[j]] && !HARAKAT.test(F[i] ?? '') && !(T[j] === 'o' && T[j + 1] === 'w')) {
      // pas-andâz (پس‌انداز): a vowel just before a ZWNJ and an alef belongs to the alef, not to the letter before.
      const beforeAlef = F[i] === ZWNJ && (F[i + 1] === 'ا' || F[i + 1] === 'آ')
      take(go(i, j + 1, false), MARK[T[j]], beforeAlef ? 0.3 : 0)
    }
    // "-ye" ezâfe with no ی in the script: nothing to write.
    if (T.startsWith('-ye', j)) take(go(i, j + 3, false), '', 0.5)

    const ch = F[i]
    if (HARAKAT.test(ch)) {
      // A mark already present: keep it; a tanvin (لطفاً) also accounts for "n".
      if (ch === TANVIN_AN && T.startsWith('an', j)) take(go(i + 1, j + 2, false), ch, 0)
      else if (ch === TANVIN_AN && T.startsWith('n', j)) take(go(i + 1, j + 1, false), ch, 0)
      // A short-vowel mark already written (نُه) stands for its vowel in the Finglish (noh).
      else if (MARK[T[j]] === ch) take(go(i + 1, j + 1, false), ch, 0)
      else take(go(i + 1, j, false), ch, 0)
    } else if (!PERSIAN_LETTER.test(ch)) {
      // Spaces, ZWNJ, punctuation, digits: copy them.
      take(go(i + 1, j, false), ch, 0)
    } else {
      for (const r of readings(F, i, T, j)) take(go(i + 1, j + r.len, !!r.mark), r.out, r.cost)
    }
    memo.set(id, best)
    return best
  }

  const r = go(0, 0, false)
  return r ? r.out : null
}

/** Remove short-vowel marks, e.g. to compare a vocalised text with the plain one. */
export const stripVowels = (s: string) => s.replace(HARAKAT_ALL, '')

const WORD = /[ء-ٟپچژکگی‌]+/g
const WORD_SPLIT = /[\s،؟.!:«»؛,]+/

/**
 * Vocalise text that has no Finglish of its own (the spoken forms used for audio), word by word,
 * from words the course has already vocalised. Words it does not know are left as they are.
 */
export function vocalizeWith(lexicon: Map<string, string>, fa: string): string {
  return fa.replace(WORD, (w) => lexicon.get(stripVowels(w)) ?? w)
}

/**
 * The words of a text paired with their readings: [plain word, word with its marks]. The ezâfe (the -e
 * that links ketâb-e man) belongs to the phrase, not the word, so a final kasra is left out.
 */
export function wordReadings(fa: string, vocalized: string): [string, string][] {
  const plain = fa.normalize('NFC').split(WORD_SPLIT).filter(Boolean)
  const voc = vocalized.split(WORD_SPLIT).filter(Boolean)
  if (plain.length !== voc.length) return []
  return plain.map((w, i) => [stripVowels(w), voc[i].replace(/ِ$/, '')])
}

/** Build word → vocalised word from pairs of (Persian, Finglish); words read two ways are left out. */
export function buildLexicon(pairs: { fa: string; tr: string }[]): Map<string, string> {
  const seen = new Map<string, Set<string>>()
  for (const p of pairs) {
    const v = vocalize(p.fa, p.tr)
    if (!v) continue
    for (const [k, vw] of wordReadings(p.fa, v)) {
      if (!seen.has(k)) seen.set(k, new Set())
      seen.get(k)!.add(vw)
    }
  }
  const lex = new Map<string, string>()
  for (const [w, forms] of seen) if (forms.size === 1) lex.set(w, [...forms][0])
  return lex
}
