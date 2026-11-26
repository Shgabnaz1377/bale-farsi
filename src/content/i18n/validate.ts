import type { Unit } from '../types.ts'
import type { CourseTr, PhraseTr } from './types.ts'

const ALLOWED_HTML = /<(?!\/?(b|i)>|span class="fa">|\/span>)[^>]*>/

/** Problems with a translation of some units; an empty list means it is complete and consistent. */
export function validateTranslation(units: Unit[], tr: CourseTr): string[] {
  const errs: string[] = []
  for (const u of units) {
    const t = tr[u.id]
    const at = (m: string) => errs.push(`${u.id}: ${m}`)
    if (!t) { at('missing translation'); continue }
    for (const f of ['title', 'can', 'tip'] as const) if (!t[f]?.trim()) at(`missing ${f}`)
    for (const html of [t.tip, t.grammar?.body ?? '']) {
      if (ALLOWED_HTML.test(html)) at(`disallowed HTML in: ${html.slice(0, 60)}`)
      const re = /<span class="fa">([^<]*)<\/span>(\s*.{0,4})/g
      let m: RegExpExecArray | null
      while ((m = re.exec(html))) {
        if (!/^[۰-۹\s]+$/.test(m[1]) && !/^\s*(\(|<i>)/.test(m[2])) at(`Persian without Finglish after it: ${m[1]}`)
      }
    }
    const same = (what: string, src: { fa: string }[], dst: PhraseTr[] | undefined) => {
      if (!dst || dst.length !== src.length) return at(`${what}: ${dst?.length ?? 0} translated, course has ${src.length}`)
      src.forEach((s, i) => {
        if (dst[i].fa !== s.fa) at(`${what} #${i + 1}: fa "${dst[i].fa}" does not match the course "${s.fa}"`)
        if (!dst[i].it?.trim()) at(`${what} #${i + 1}: empty translation`)
      })
    }
    same('words', u.words, t.words)
    const its = new Set<string>()
    for (const w of t.words ?? []) {
      if (its.has(w.it)) at(`duplicate word meaning "${w.it}" (meanings must be unique within a unit)`)
      its.add(w.it)
    }
    same('sentences', u.sentences, t.sentences)
    if (!t.grammar?.title || !t.grammar.body) at('grammar title/body missing')
    same('grammar examples', u.grammar.examples, t.grammar?.examples)
    if (t.grammar?.checks?.length !== u.grammar.checks.length) at('grammar checks count differs')
    else t.grammar.checks.forEach((c, i) => { if (!c.q?.trim() || !c.why?.trim()) at(`grammar check #${i + 1} incomplete`) })
    if (u.dialogue?.length) same('dialogue', u.dialogue, t.dialogue)
    if (u.reading) {
      const r = t.reading
      if (!r) at('reading missing')
      else {
        if (!r.title) at('reading title missing')
        if (r.paragraphs.length !== u.reading.paragraphs.length || r.paragraphs.some((p) => !p.it?.trim())) at('reading paragraphs incomplete')
        if (r.questions.length !== u.reading.questions.length) at('reading questions count differs')
        else r.questions.forEach((q, i) => {
          if (!q.q?.trim() || q.options.length !== u.reading!.questions[i].options.length) at(`reading question #${i + 1} incomplete`)
        })
      }
    }
  }
  return errs
}
