import type { Level, Unit } from './types.ts'

const PUNCT = /[،؟.!:«»؛,?"()]/g
export const stripPunct = (s: string) => s.replace(PUNCT, ' ').replace(/\s+/g, ' ').trim()
const PERSIAN = /^[؀-ۿ‌\s،؟.!:«»؛\-]+$/
/** Italian (Bego Ciao): Latin letters with Italian accents, digits and punctuation. */
const LATIN = /^[\p{Script=Latin}0-9\s'’.,!?:;«»"()\-]+$/u
const ALLOWED_HTML = /<(?!\/?(b|i)>|span class="fa">|\/span>)[^>]*>/

/** Returns a list of problems; an empty list means the units are valid. */
export function validateUnits(units: Unit[], level: Level, target: 'fa' | 'it' = 'fa'): string[] {
  const SCRIPT = target === 'it' ? LATIN : PERSIAN
  const scriptName = target === 'it' ? 'Italian' : 'Persian'
  const errs: string[] = []
  const ids = new Set<string>()
  for (const u of units) {
    const at = (m: string) => errs.push(`${u.id}: ${m}`)
    if (u.level !== level) at(`level is ${u.level}, expected ${level}`)
    if (!u.id.startsWith(level.toLowerCase() + '-')) at('id must start with the level prefix')
    if (ids.has(u.id)) at('duplicate id')
    ids.add(u.id)
    if (!SCRIPT.test(u.fa)) at(`unit fa has non-${scriptName} characters: ${u.fa}`)
    for (const f of ['title', 'tr', 'can', 'tip'] as const) if (!u[f]?.trim()) at(`missing ${f}`)
    for (const html of [u.tip, u.grammar.body]) if (ALLOWED_HTML.test(html)) at(`disallowed HTML in: ${html.slice(0, 60)}`)
    for (const html of [u.tip, u.grammar.body]) {
      const re = /<span class="fa">([^<]*)<\/span>(\s*.{0,4})/g
      let m: RegExpExecArray | null
      while ((m = re.exec(html))) {
        const digitsOnly = /^[۰-۹\s]+$/.test(m[1])
        if (!digitsOnly && !/^\s*(\(|<i>|\s*[,.;:]?\s*\()/.test(m[2])) at(`Persian without Finglish after it: ${m[1]}`)
      }
    }

    if (u.words.length < 10) at(`only ${u.words.length} words (want 12)`)
    const fas = new Set<string>(), ens = new Set<string>()
    for (const w of u.words) {
      if (!w.fa || !w.tr || !w.en) at(`incomplete word ${JSON.stringify(w)}`)
      if (!SCRIPT.test(w.fa)) at(`word fa has non-${scriptName} characters: ${w.fa}`)
      if (fas.has(w.fa)) at(`duplicate word fa ${w.fa}`)
      if (ens.has(w.en)) at(`duplicate word en ${w.en}`)
      fas.add(w.fa); ens.add(w.en)
    }

    if (u.sentences.length < 4) at(`only ${u.sentences.length} sentences (want 5)`)
    for (const s of u.sentences) {
      if (!SCRIPT.test(s.fa)) at(`sentence has non-${scriptName} characters: ${s.fa}`)
      if (s.tiles.join(' ') !== stripPunct(s.fa)) at(`tiles do not rebuild the sentence: "${s.tiles.join(' ')}" vs "${stripPunct(s.fa)}"`)
      if (s.tiles.length !== s.trTiles.length) at(`tiles/trTiles length differ in: ${s.fa}`)
      if (s.tiles.length < 2) at(`sentence needs at least 2 tiles: ${s.fa}`)
      if (!s.en.trim() || !s.tr.trim()) at(`sentence missing en/tr: ${s.fa}`)
    }

    const g = u.grammar
    if (!g.title || !g.body) at('grammar missing title/body')
    if (g.examples.length < 3) at('grammar needs 3+ examples')
    if (g.checks.length < 3) at('grammar needs 3 checks')
    for (const c of g.checks) {
      if (c.options.length < 3) at(`grammar check needs 3+ options: ${c.q}`)
      if (c.answer < 0 || c.answer >= c.options.length) at(`grammar check answer out of range: ${c.q}`)
      if (new Set(c.options).size !== c.options.length) at(`grammar check has duplicate options: ${c.q}`)
      if (!Array.isArray(c.optionsTr) || c.optionsTr.length !== c.options.length || c.optionsTr.some((t) => !t?.trim()))
        at(`grammar check needs optionsTr (Finglish for every option): ${c.q}`)
      else if (new Set(c.optionsTr).size !== c.optionsTr.length) at(`grammar check has duplicate Finglish options: ${c.q}`)
    }

    if ((level !== 'A1') && (!u.dialogue || u.dialogue.length < 6)) at('A2+ units need a dialogue of 6+ lines')
    for (const d of u.dialogue ?? []) if (!d.who || !d.fa || !d.tr || !d.en) at(`incomplete dialogue line ${d.fa}`)

    if (level === 'B1' || level === 'B2') {
      if (!u.reading) at('B1/B2 units need a reading')
      else {
        if (u.reading.paragraphs.length < 2) at('reading needs 2+ paragraphs')
        if (u.reading.questions.length < 3) at('reading needs 3 questions')
        for (const q of u.reading.questions) if (q.answer < 0 || q.answer >= q.options.length) at(`reading answer out of range: ${q.q}`)
      }
    }
  }
  return errs
}
