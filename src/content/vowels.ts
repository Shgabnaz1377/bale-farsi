/**
 * The six Persian vowels, for the vowels lesson on the alphabet page.
 * Vowel marks are written as escapes: they are invisible on their own and easy to lose in copy-paste.
 */
const ZEBAR = 'َ' // a
const ZIR = 'ِ' // e
const PISH = 'ُ' // o

export interface VowelWord { fa: string; tr: string; en: string }

export interface Vowel {
  /** The mark on a carrier letter (بَ) for short vowels; the letter itself for long ones. */
  fa: string
  /** Its Persian name in Finglish: zebar, zir, pish, or the letter's name. */
  name: string
  /** How it sounds, in English terms. */
  sound: string
  /** The Finglish letter for it. */
  tr: string
  long: boolean
  /** Example words, written with their marks so every vowel is visible. */
  examples: VowelWord[]
}

export const VOWELS: Vowel[] = [
  { fa: 'ب' + ZEBAR, name: 'zebar', sound: 'as in cat', tr: 'a', long: false, examples: [
    { fa: 'س' + ZEBAR + 'ر', tr: 'sar', en: 'head' },
    { fa: 'د' + ZEBAR + 'ر', tr: 'dar', en: 'door' },
    { fa: 'ش' + ZEBAR + 'ب', tr: 'shab', en: 'night' },
  ] },
  { fa: 'ب' + ZIR, name: 'zir', sound: 'as in bed', tr: 'e', long: false, examples: [
    { fa: 'د' + ZIR + 'ل', tr: 'del', en: 'heart' },
    { fa: 'ا' + ZIR + 'سم', tr: 'esm', en: 'name' },
    { fa: 'چ' + ZIR + 'شم', tr: 'cheshm', en: 'eye' },
  ] },
  { fa: 'ب' + PISH, name: 'pish', sound: 'as in go, but short', tr: 'o', long: false, examples: [
    { fa: 'گ' + PISH + 'ل', tr: 'gol', en: 'flower' },
    { fa: 'م' + PISH + 'بل', tr: 'mobl', en: 'sofa' },
    { fa: 'د' + PISH + 'خت' + ZEBAR + 'ر', tr: 'dokhtar', en: 'girl' },
  ] },
  { fa: 'ا', name: 'alef', sound: 'as in father', tr: 'â', long: true, examples: [
    { fa: 'آب', tr: 'âb', en: 'water' },
    { fa: 'بابا', tr: 'bâbâ', en: 'dad' },
    { fa: 'نان', tr: 'nân', en: 'bread' },
  ] },
  { fa: 'و', name: 'vâv', sound: 'as in food', tr: 'u', long: true, examples: [
    { fa: 'روز', tr: 'ruz', en: 'day' },
    { fa: 'توت', tr: 'tut', en: 'mulberry' },
    { fa: 'دوست', tr: 'dust', en: 'friend' },
  ] },
  { fa: 'ی', name: 'ye', sound: 'as in see', tr: 'i', long: true, examples: [
    { fa: 'سیب', tr: 'sib', en: 'apple' },
    { fa: 'فیل', tr: 'fil', en: 'elephant' },
    { fa: 'ایران', tr: 'Irân', en: 'Iran' },
  ] },
]

/** Words that differ only in a short vowel: on paper, only the mark tells them apart. */
export const VOWEL_PAIRS: [VowelWord, VowelWord][] = [
  [{ fa: 'گ' + PISH + 'ل', tr: 'gol', en: 'flower' }, { fa: 'گ' + ZIR + 'ل', tr: 'gel', en: 'mud' }],
  [{ fa: 'م' + ZIR + 'هر', tr: 'mehr', en: 'kindness' }, { fa: 'م' + PISH + 'هر', tr: 'mohr', en: 'stamp' }],
  [{ fa: 'س' + ZEBAR + 'ر', tr: 'sar', en: 'head' }, { fa: 'س' + ZIR + 'ر', tr: 'ser', en: 'numb' }],
]

/** Lesson key of the vowels lesson (in Progress.done). */
export const VOWELS_KEY = 'alphabet/vowels'
