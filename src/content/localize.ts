import type { Lang } from '@/i18n/index.ts'
import { LESSON_NAMES, LEVELS } from './course.ts'
import { LETTERS } from './alphabet.ts'
import type { CourseTr, PhraseTr } from './i18n/types.ts'
import type { Phrase, Unit } from './types.ts'
import { IT_A1 } from './i18n/it/a1.ts'
import { IT_A2 } from './i18n/it/a2.ts'
import { IT_B1 } from './i18n/it/b1.ts'
import { IT_B2 } from './i18n/it/b2.ts'
import { IT_LESSON_NAMES, IT_LETTER_EXAMPLES, IT_LETTER_SOUNDS, IT_LEVELS } from './i18n/it/extra.ts'

/**
 * The course is written with English meanings. For another learner language the English-side fields are
 * swapped in place (so every module holding a unit, word or letter sees the change); Persian, Finglish
 * and audio are never touched. Switching back restores the original English.
 */
const IT: CourseTr = { ...IT_A1, ...IT_A2, ...IT_B1, ...IT_B2 }

const ORIGINAL = structuredClone({
  levels: LEVELS.map((l) => ({ name: l.name, blurb: l.blurb, units: l.units })),
  lessonNames: { ...LESSON_NAMES },
  letters: LETTERS.map((l) => ({ sound: l.sound, en: l.example.en })),
})

let applied: Lang | null = null

function copyPhrases(dst: (Phrase & { alt?: string[]; note?: string })[], src: (Phrase & { alt?: string[]; note?: string })[]) {
  dst.forEach((d, i) => {
    d.en = src[i].en
    if ('alt' in src[i] || 'alt' in d) d.alt = src[i].alt
    if ('note' in src[i] || 'note' in d) d.note = src[i].note
  })
}

function restore(u: Unit, o: Unit) {
  u.title = o.title
  u.can = o.can
  u.tip = o.tip
  copyPhrases(u.words, o.words)
  copyPhrases(u.sentences, o.sentences)
  u.grammar.title = o.grammar.title
  u.grammar.body = o.grammar.body
  copyPhrases(u.grammar.examples, o.grammar.examples)
  u.grammar.checks.forEach((c, i) => { c.q = o.grammar.checks[i].q; c.why = o.grammar.checks[i].why })
  if (u.dialogue && o.dialogue) u.dialogue.forEach((d, i) => { d.en = o.dialogue![i].en })
  if (u.reading && o.reading) {
    u.reading.title = o.reading.title
    u.reading.paragraphs.forEach((p, i) => { p.en = o.reading!.paragraphs[i].en })
    u.reading.questions.forEach((q, i) => { q.q = o.reading!.questions[i].q; q.options = [...o.reading!.questions[i].options] })
  }
}

function overlay(dst: (Phrase & { alt?: string[]; note?: string })[], tr: PhraseTr[] | undefined) {
  if (!tr) return
  dst.forEach((d, i) => {
    const x = tr[i]
    if (!x || x.fa !== d.fa) return
    d.en = x.it
    d.alt = x.alt
    d.note = x.note ?? (d.note ? undefined : d.note)
  })
}

function translate(u: Unit, tr: CourseTr[string] | undefined) {
  if (!tr) return
  u.title = tr.title
  u.can = tr.can
  u.tip = tr.tip
  overlay(u.words, tr.words)
  overlay(u.sentences, tr.sentences)
  u.grammar.title = tr.grammar.title
  u.grammar.body = tr.grammar.body
  overlay(u.grammar.examples, tr.grammar.examples)
  u.grammar.checks.forEach((c, i) => { if (tr.grammar.checks[i]) { c.q = tr.grammar.checks[i].q; c.why = tr.grammar.checks[i].why } })
  if (u.dialogue && tr.dialogue) u.dialogue.forEach((d, i) => { if (tr.dialogue![i]?.fa === d.fa) d.en = tr.dialogue![i].it })
  if (u.reading && tr.reading) {
    u.reading.title = tr.reading.title
    u.reading.paragraphs.forEach((p, i) => { if (tr.reading!.paragraphs[i]) p.en = tr.reading!.paragraphs[i].it })
    u.reading.questions.forEach((q, i) => {
      const x = tr.reading!.questions[i]
      if (x && x.options.length === q.options.length) { q.q = x.q; q.options = [...x.options] }
    })
  }
}

export function applyCourseLang(lang: Lang) {
  if (applied === lang) return
  LEVELS.forEach((lv, li) => {
    const o = ORIGINAL.levels[li]
    lv.name = lang === 'it' ? IT_LEVELS[lv.level]?.name ?? o.name : o.name
    lv.blurb = lang === 'it' ? IT_LEVELS[lv.level]?.blurb ?? o.blurb : o.blurb
    lv.units.forEach((u, ui) => {
      restore(u, o.units[ui])
      if (lang === 'it') translate(u, IT[u.id])
    })
  })
  for (const k of Object.keys(LESSON_NAMES) as (keyof typeof LESSON_NAMES)[]) {
    LESSON_NAMES[k] = lang === 'it' ? IT_LESSON_NAMES[k] ?? ORIGINAL.lessonNames[k] : ORIGINAL.lessonNames[k]
  }
  LETTERS.forEach((l, i) => {
    l.example.en = lang === 'it' ? IT_LETTER_EXAMPLES[l.example.fa] ?? ORIGINAL.letters[i].en : ORIGINAL.letters[i].en
    l.sound = lang === 'it' ? IT_LETTER_SOUNDS[l.fa] ?? ORIGINAL.letters[i].sound : ORIGINAL.letters[i].sound
  })
  applied = lang
}
