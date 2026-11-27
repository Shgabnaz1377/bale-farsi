import { VOWELS, VOWEL_PAIRS, type VowelWord } from '@/content/vowels.ts'
import { matchEx, type Ex, type Shown } from './exercises.ts'
import { pick, shuffle } from './random.ts'
import { t } from '@/i18n/index.ts'

const show = (w: VowelWord): Shown => ({ fa: w.fa, tr: w.tr, en: w.en })

/** Believable wrong readings of a Finglish word, by swapping one short vowel: gol → gal, gel. */
export function misreadings(tr: string): string[] {
  const swap: Record<string, string[]> = { a: ['e', 'o'], e: ['a', 'o'], o: ['a', 'e'] }
  const out = new Set<string>()
  ;[...tr].forEach((c, i) => {
    for (const r of swap[c] ?? []) out.add(tr.slice(0, i) + r + tr.slice(i + 1))
  })
  out.delete(tr)
  return [...out]
}

/** The vowels lesson: the three short-vowel marks, the three long vowels, and reading words by their marks. */
export function vowelsLesson(o: { hasVoice: boolean }): Ex[] {
  const intro: Ex = {
    kind: 'card', title: t('Vowels: a, e, o and â, u, i'),
    html: t('Persian has six vowels. The three long ones are letters: <span class="fa">ا و ی</span> (â, u, i). The three short ones are small marks above or below a letter: <b>zebar</b> <span class="fa">بَ</span> (ba), <b>zir</b> <span class="fa">بِ</span> (be) and <b>pish</b> <span class="fa">بُ</span> (bo). Printed Persian usually leaves the short marks out, so you learn words with them first. In A1 the app shows the marks, in A2 only on single words, and from B1 on they are gone, as in real Persian.'),
    examples: VOWELS.map((v) => ({
      fa: `${v.fa}  ·  ${v.examples.map((e) => e.fa).join('  ')}`,
      tr: `${v.name} (${v.tr}) · ${v.examples.map((e) => e.tr).join(', ')}`,
      en: `${v.tr}, ${v.sound}`,
    })),
  }
  const ex: Ex[] = []

  // What sound does each short mark give?
  const soundOpts = VOWELS.map((v) => ({ en: `${v.tr}, ${v.sound}` }))
  for (const v of VOWELS.filter((x) => !x.long)) {
    const opts = shuffle(soundOpts.slice())
    ex.push({
      kind: 'choice', title: t('Which sound does this mark give the letter?'), prompt: { fa: v.fa, hideTr: true, audio: v.fa },
      options: opts, answer: opts.findIndex((x) => x.en.startsWith(`${v.tr},`)), faOptions: false,
      reveal: { fa: v.fa, tr: `${v.name}: b${v.tr}`, en: v.sound },
    })
  }

  // Read words by their marks.
  const words = VOWELS.flatMap((v) => v.examples).filter((w) => misreadings(w.tr).length >= 2)
  for (const w of pick(words, 5)) {
    const opts = shuffle([w.tr, ...pick(misreadings(w.tr), 2)])
    ex.push({
      kind: 'choice', title: t('How do you read this word?'), prompt: { fa: w.fa, hideTr: true, audio: w.fa },
      options: opts.map((x) => ({ en: x })), answer: opts.indexOf(w.tr), faOptions: false, reveal: show(w),
    })
  }

  // Same letters, different vowel.
  const note = t('Same letters, different vowel: only the mark tells them apart.')
  for (const pair of VOWEL_PAIRS) {
    const w = pick(pair.slice(), 1)[0]
    const opts = shuffle(pair.slice())
    const options = opts.map((x) => ({ fa: x.fa, hideTr: true }))
    const answer = opts.indexOf(w)
    ex.push(o.hasVoice
      ? { kind: 'choice', title: t('Listen. Which word do you hear?'), prompt: { audio: w.fa, listen: true }, options, answer, faOptions: true, reveal: show(w), note }
      : { kind: 'choice', title: t('Which one is “{w}”?', { w: `${w.tr} (${w.en})` }), prompt: {}, options, answer, faOptions: true, reveal: show(w), note })
  }

  ex.push(matchEx(VOWELS.map((v) => ({ fa: v.fa, tr: v.name, en: v.tr })), { hideTr: true }))
  return [intro, ...shuffle(ex)]
}
