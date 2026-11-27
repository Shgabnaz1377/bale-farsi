/**
 * "Persian is not Arabic": a short page for learners who assume it is. Persian is Indo-European
 * (a cousin of English and Italian); it borrowed many words and its script from Arabic, but not its grammar.
 */
export interface Cognate { fa: string; tr: string; en: string; it: string; de?: string }

/** Persian words with relatives in English and Italian (shared Indo-European roots). */
export const COGNATES: Cognate[] = [
  { fa: 'پدر', tr: 'pedar', en: 'father', it: 'padre', de: 'Vater' },
  { fa: 'مادر', tr: 'mâdar', en: 'mother', it: 'madre', de: 'Mutter' },
  { fa: 'برادر', tr: 'barâdar', en: 'brother', it: 'fratello', de: 'Bruder' },
  { fa: 'دختر', tr: 'dokhtar', en: 'daughter', it: 'figlia', de: 'Tochter' },
  { fa: 'نام', tr: 'nâm', en: 'name', it: 'nome', de: 'Name' },
  { fa: 'ستاره', tr: 'setâre', en: 'star', it: 'stella', de: 'Stern' },
  { fa: 'نو', tr: 'now', en: 'new', it: 'nuovo', de: 'neu' },
  { fa: 'دندان', tr: 'dandân', en: 'tooth (dental)', it: 'dente', de: 'Zahn' },
  { fa: 'دو', tr: 'do', en: 'two', it: 'due', de: 'zwei' },
  { fa: 'سه', tr: 'se', en: 'three', it: 'tre', de: 'drei' },
  { fa: 'است', tr: 'ast', en: 'is', it: 'è', de: 'ist' },
]

/** The four letters Persian added to the Arabic alphabet for its own sounds. */
export const EXTRA_LETTERS = [
  { fa: 'پ', tr: 'p', word: { fa: 'پدر', tr: 'pedar', en: 'father', it: 'padre' } },
  { fa: 'چ', tr: 'ch', word: { fa: 'چای', tr: 'chây', en: 'tea', it: 'tè' } },
  { fa: 'ژ', tr: 'zh', word: { fa: 'ژاله', tr: 'zhâle', en: 'dew', it: 'rugiada' } },
  { fa: 'گ', tr: 'g', word: { fa: 'گربه', tr: 'gorbe', en: 'cat', it: 'gatto' } },
]

/** One word for "he" and "she": Persian has no grammatical gender. */
export const NO_GENDER = [
  { fa: 'او دکتر است.', tr: 'u doktor ast.', en: 'He / she is a doctor.', it: 'Lui / lei è medico.' },
  { fa: 'دوستم آمد.', tr: 'dustam âmad.', en: 'My friend (man or woman) came.', it: 'Il mio amico / la mia amica è venuto/a.' },
]

/** Arabic loanwords Persian uses every day, said the Persian way. */
export const LOANWORDS = [
  { fa: 'کتاب', tr: 'ketâb', en: 'book', it: 'libro' },
  { fa: 'وقت', tr: 'vaght', en: 'time', it: 'tempo' },
  { fa: 'مرسی', tr: 'mersi', en: 'thanks (from French!)', it: 'grazie (dal francese!)' },
]
