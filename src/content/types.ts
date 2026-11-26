/**
 * Course content schema. Every unit file (a1.ts … b2.ts) exports an array of Unit.
 * tests/content.test.ts enforces the rules written in the comments below.
 */

export type Level = 'A1' | 'A2' | 'B1' | 'B2'

/** Persian text with its transliteration and English meaning. */
export interface Phrase {
  /** Persian script. Use U+200C (ZWNJ) where Persian needs it, e.g. 'می‌خواهم', 'کتاب‌ها'. */
  fa: string
  /**
   * Transliteration, lowercase except names:
   * â (long a, father), a (cat), e (bed), o (go, short), u (food), i (see),
   * kh (loch), gh (غ/ق), sh, ch, zh (measure), ' for a glottal stop where it matters.
   * Ezâfe is written as -e / -ye joined to the word: ketâb-e man, khâne-ye mâ.
   */
  tr: string
  /** English meaning, lowercase for single words (except I, names), sentence case for sentences. */
  en: string
}

export interface Word extends Phrase {
  /** Other English answers accepted when the learner types the meaning. */
  alt?: string[]
  /** Persian digit form, numbers only, e.g. '۲۵'. */
  digit?: string
  /** Optional one-line usage note shown after an exercise. */
  note?: string
}

export interface Sentence extends Phrase {
  /**
   * Word tiles for the build-a-sentence exercise.
   * RULE: tiles.join(' ') equals fa with punctuation (، ؟ . ! : « » ؛) removed and spaces collapsed.
   */
  tiles: string[]
  /** RULE: same length as tiles; transliteration of each tile in context (with ezâfe). */
  trTiles: string[]
  /** Other accepted English translations (used for the typed answer). */
  alt?: string[]
  /** Optional grammar or culture note shown after the exercise. */
  note?: string
}

export interface GrammarPoint {
  /** e.g. 'The ezâfe: linking words with -e'. */
  title: string
  /**
   * 2–5 short plain-English sentences. May use <b>, <i> and <span class="fa">…</span>. No other HTML.
   * Every <span class="fa"> must be followed by its Finglish: <i>…</i> or (…).
   */
  body: string
  /** 3–4 examples that show the point. */
  examples: Phrase[]
  /** 3 quick checks: pick the right Persian form. */
  checks: GrammarCheck[]
}

export interface GrammarCheck {
  /** Prompt in English, e.g. 'Which means "I went"?' */
  q: string
  /** 3–4 Persian options. */
  options: string[]
  /**
   * Finglish (transliteration) of each option, same order and length as options.
   * Learners who cannot read the script yet must be able to answer from these alone.
   */
  optionsTr: string[]
  /** Index into options of the correct one. */
  answer: number
  /** One-line explanation shown after answering. */
  why: string
}

export interface DialogueLine {
  /** Speaker name in English letters, e.g. 'Sara', 'Waiter'. */
  who: string
  fa: string
  tr: string
  en: string
}

export interface Reading {
  title: string
  /** Paragraphs of Persian. Each paragraph has fa, tr and en. */
  paragraphs: Phrase[]
  /** 3 comprehension questions in English. */
  questions: { q: string; options: string[]; answer: number }[]
}

export interface Unit {
  /** kebab-case, unique across the whole course, prefixed with the level: 'a1-greetings'. */
  id: string
  level: Level
  title: string
  /** Short Persian name of the unit, with transliteration. */
  fa: string
  tr: string
  /** CEFR-style can-do statement: 'You can greet people and say goodbye politely.' */
  can: string
  /** One culture or language tip, 1–2 sentences. Same HTML allowance as GrammarPoint.body. */
  tip: string
  /** 12 words; Persian and English each unique within the unit. */
  words: Word[]
  /** 5 sentences that use the unit's words and grammar. */
  sentences: Sentence[]
  grammar: GrammarPoint
  /** A2 and up: a short dialogue of 6–10 lines. */
  dialogue?: DialogueLine[]
  /** B1 and up: a reading passage. */
  reading?: Reading
}
