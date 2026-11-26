/**
 * Translations of the Persian course's English side into another learner language (first: Italian).
 * The Persian, Finglish and audio never change; only meanings, explanations and questions do.
 * One file per level (it/a1.ts …), exporting Record<unit id, UnitTr>. Checked by validateTranslation().
 */

/** One Persian phrase and its meaning in the learner's language. `fa` must match the course exactly. */
export interface PhraseTr {
  fa: string
  /** The meaning, e.g. 'ciao' or 'Mi chiamo Sara'. Lowercase for single words (except names). */
  it: string
  /** Other accepted typed answers. */
  alt?: string[]
  /** The course's note, translated (only when the course has one). */
  note?: string
}

export interface UnitTr {
  title: string
  /** Can-do statement: 'Sai salutare le persone…' */
  can: string
  /** Same HTML allowance and Finglish rule as the course tip. */
  tip: string
  /** Same order as the unit's words. */
  words: PhraseTr[]
  /** Same order as the unit's sentences. */
  sentences: PhraseTr[]
  grammar: {
    title: string
    body: string
    /** Same order as grammar.examples. */
    examples: PhraseTr[]
    /** Same order as grammar.checks: question and explanation only (options are Persian and stay). */
    checks: { q: string; why: string }[]
  }
  /** Same order as the unit's dialogue lines (speaker names stay). */
  dialogue?: PhraseTr[]
  reading?: {
    title: string
    /** Same order as the reading's paragraphs. */
    paragraphs: { it: string }[]
    /** Same order as the reading's questions; options in the same order (the answer index is unchanged). */
    questions: { q: string; options: string[] }[]
  }
}

export type CourseTr = Record<string, UnitTr>
