/**
 * Homographs: one written word, several words, told apart only by the short-vowel marks that
 * printed Persian leaves out. Context (and Finglish) is how a reader knows which one is meant.
 */
export interface HomographForm {
  /** With its vowel marks. */
  fa: string
  tr: string
  en: string
  it: string
  /** A short sentence where only this reading makes sense. */
  context: { fa: string; tr: string; en: string; it: string }
}

export interface Homograph {
  /** As it is usually printed, without marks. */
  bare: string
  forms: HomographForm[]
}

export const HOMOGRAPHS: Homograph[] = [
  {
    bare: 'کرم',
    forms: [
      { fa: 'کِرم', tr: 'kerm', en: 'worm', it: 'verme',
        context: { fa: 'یه کرم توی سیبه!', tr: 'ye kerm tu-ye sibe!', en: 'There\'s a worm in the apple!', it: 'C\'è un verme nella mela!' } }, // TODO(Shabnaz): check context
      { fa: 'کَرَم', tr: 'karam', en: 'generosity', it: 'generosità',
        context: { fa: 'خدا به شما کرم کنه.', tr: 'khodâ be shomâ karam kone.', en: 'May God be generous to you.', it: 'Che Dio sia generoso con te.' } }, // TODO(Shabnaz): check context
      { fa: 'کِرِم', tr: 'kerem', en: 'cream (for the skin)', it: 'crema (per la pelle)',
        context: { fa: 'این کرم برای دست خیلی خوبه.', tr: 'in kerem barâ-ye dast kheyli khube.', en: 'This cream is really good for your hands.', it: 'Questa crema è ottima per le mani.' } },
    ],
  },
  {
    bare: 'شکر',
    forms: [
      { fa: 'شِکَر', tr: 'shekar', en: 'sugar', it: 'zucchero',
        context: { fa: 'چای رو با شکر می‌خوری؟', tr: 'chây ro bâ shekar mikhori?', en: 'Do you take your tea with sugar?', it: 'Prendi il tè con lo zucchero?' } },
      { fa: 'شُکر', tr: 'shokr', en: 'thanks (to God)', it: 'grazie (a Dio)',
        context: { fa: 'خدا رو شکر، همه سالمن.', tr: 'khodâ ro shokr, hame sâleman.', en: 'Thank God, everyone is well.', it: 'Grazie a Dio, stanno tutti bene.' } },
    ],
  },
  {
    bare: 'کشتی',
    forms: [
      { fa: 'کَشتی', tr: 'kashti', en: 'ship', it: 'nave',
        context: { fa: 'با کشتی رفتیم کیش.', tr: 'bâ kashti raftim Kish.', en: 'We went to Kish by ship.', it: 'Siamo andati a Kish in nave.' } }, // TODO(Shabnaz): check context
      { fa: 'کُشتی', tr: 'koshti', en: 'wrestling', it: 'lotta',
        context: { fa: 'کشتی ورزش ملی ایرانه.', tr: 'koshti varzesh-e melli-ye irâne.', en: 'Wrestling is Iran\'s national sport.', it: 'La lotta è lo sport nazionale dell\'Iran.' } },
    ],
  },
]
