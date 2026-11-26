export interface Letter {
  /** The letter, isolated form. */
  fa: string
  /** Its name in transliteration. */
  name: string
  /** The sound it usually makes. */
  sound: string
  /** True for the seven letters that never join to the letter after them. */
  nonJoining?: boolean
  /** Only in Persian, not in Arabic. */
  persian?: boolean
  example: { fa: string; tr: string; en: string }
}

export const LETTERS: Letter[] = [
  { fa: 'ا', name: 'alef', sound: 'â / a', nonJoining: true, example: { fa: 'اسب', tr: 'asb', en: 'horse' } },
  { fa: 'ب', name: 'be', sound: 'b', example: { fa: 'بابا', tr: 'bâbâ', en: 'dad' } },
  { fa: 'پ', name: 'pe', sound: 'p', persian: true, example: { fa: 'پدر', tr: 'pedar', en: 'father' } },
  { fa: 'ت', name: 'te', sound: 't', example: { fa: 'توت', tr: 'tut', en: 'mulberry' } },
  { fa: 'ث', name: 'se', sound: 's', example: { fa: 'ثانیه', tr: 'sâniye', en: 'second' } },
  { fa: 'ج', name: 'jim', sound: 'j', example: { fa: 'جوان', tr: 'javân', en: 'young' } },
  { fa: 'چ', name: 'che', sound: 'ch', persian: true, example: { fa: 'چای', tr: 'chây', en: 'tea' } },
  { fa: 'ح', name: 'he', sound: 'h', example: { fa: 'حال', tr: 'hâl', en: 'mood, state' } },
  { fa: 'خ', name: 'khe', sound: 'kh', example: { fa: 'خانه', tr: 'khâne', en: 'house' } },
  { fa: 'د', name: 'dâl', sound: 'd', nonJoining: true, example: { fa: 'در', tr: 'dar', en: 'door' } },
  { fa: 'ذ', name: 'zâl', sound: 'z', nonJoining: true, example: { fa: 'ذرت', tr: 'zorrat', en: 'corn' } },
  { fa: 'ر', name: 're', sound: 'r', nonJoining: true, example: { fa: 'روز', tr: 'ruz', en: 'day' } },
  { fa: 'ز', name: 'ze', sound: 'z', nonJoining: true, example: { fa: 'زن', tr: 'zan', en: 'woman' } },
  { fa: 'ژ', name: 'zhe', sound: 'zh', nonJoining: true, persian: true, example: { fa: 'ژاکت', tr: 'zhâket', en: 'jacket' } },
  { fa: 'س', name: 'sin', sound: 's', example: { fa: 'سیب', tr: 'sib', en: 'apple' } },
  { fa: 'ش', name: 'shin', sound: 'sh', example: { fa: 'شب', tr: 'shab', en: 'night' } },
  { fa: 'ص', name: 'sâd', sound: 's', example: { fa: 'صبح', tr: 'sobh', en: 'morning' } },
  { fa: 'ض', name: 'zâd', sound: 'z', example: { fa: 'ضعیف', tr: "za'if", en: 'weak' } },
  { fa: 'ط', name: 'tâ', sound: 't', example: { fa: 'طلا', tr: 'talâ', en: 'gold' } },
  { fa: 'ظ', name: 'zâ', sound: 'z', example: { fa: 'ظهر', tr: 'zohr', en: 'noon' } },
  { fa: 'ع', name: 'eyn', sound: "' (glottal stop)", example: { fa: 'عسل', tr: 'asal', en: 'honey' } },
  { fa: 'غ', name: 'gheyn', sound: 'gh', example: { fa: 'غذا', tr: 'ghazâ', en: 'food' } },
  { fa: 'ف', name: 'fe', sound: 'f', example: { fa: 'فیل', tr: 'fil', en: 'elephant' } },
  { fa: 'ق', name: 'ghâf', sound: 'gh', example: { fa: 'قند', tr: 'ghand', en: 'sugar cube' } },
  { fa: 'ک', name: 'kâf', sound: 'k', example: { fa: 'کتاب', tr: 'ketâb', en: 'book' } },
  { fa: 'گ', name: 'gâf', sound: 'g', persian: true, example: { fa: 'گل', tr: 'gol', en: 'flower' } },
  { fa: 'ل', name: 'lâm', sound: 'l', example: { fa: 'لب', tr: 'lab', en: 'lip' } },
  { fa: 'م', name: 'mim', sound: 'm', example: { fa: 'ماه', tr: 'mâh', en: 'moon' } },
  { fa: 'ن', name: 'nun', sound: 'n', example: { fa: 'نان', tr: 'nân', en: 'bread' } },
  { fa: 'و', name: 'vâv', sound: 'v / u / o', nonJoining: true, example: { fa: 'ورزش', tr: 'varzesh', en: 'sport' } },
  { fa: 'ه', name: 'he', sound: 'h / e', example: { fa: 'هوا', tr: 'havâ', en: 'air, weather' } },
  { fa: 'ی', name: 'ye', sound: 'y / i', example: { fa: 'یک', tr: 'yek', en: 'one' } },
]

/** Six alphabet lessons, in alphabet order. */
export const LETTER_GROUPS: { title: string; letters: string[] }[] = [
  { title: 'ا ب پ ت ث', letters: ['ا', 'ب', 'پ', 'ت', 'ث'] },
  { title: 'ج چ ح خ د ذ', letters: ['ج', 'چ', 'ح', 'خ', 'د', 'ذ'] },
  { title: 'ر ز ژ س ش', letters: ['ر', 'ز', 'ژ', 'س', 'ش'] },
  { title: 'ص ض ط ظ ع غ', letters: ['ص', 'ض', 'ط', 'ظ', 'ع', 'غ'] },
  { title: 'ف ق ک گ ل', letters: ['ف', 'ق', 'ک', 'گ', 'ل'] },
  { title: 'م ن و ه ی', letters: ['م', 'ن', 'و', 'ه', 'ی'] },
]

const ZWJ = '‍'

/** The four shapes of a letter, drawn by the font using zero-width joiners. */
export function letterForms(l: Letter): { label: string; text: string }[] {
  const forms = [
    { label: 'alone', text: l.fa },
    { label: 'end', text: ZWJ + l.fa },
  ]
  if (!l.nonJoining) {
    forms.push({ label: 'middle', text: ZWJ + l.fa + ZWJ }, { label: 'start', text: l.fa + ZWJ })
  }
  return forms
}

export const letterByFa = new Map(LETTERS.map((l) => [l.fa, l]))
