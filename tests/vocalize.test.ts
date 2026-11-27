import { describe, expect, it } from 'vitest'
import { buildLexicon, stripVowels, vocalize, vocalizeWith } from '../src/lib/vocalize.ts'

// Expected values use escapes: the vowel marks and the zero-width non-joiner are invisible.
const FA = 'َ' // a
const KA = 'ِ' // e
const DA = 'ُ' // o
const SH = 'ّ' // doubled
const ZW = '‌'

describe('vocalize', () => {
  it.each([
    ['مبل', 'mobl', `م${DA}بل`],
    ['چشم', 'cheshm', `چ${KA}شم`],
    ['کتاب من', 'ketâb-e man', `ک${KA}تاب${KA} م${FA}ن`],
    [`خواهش می${ZW}کنم`, 'khâhesh mikonam', `خواه${KA}ش می${ZW}ک${DA}ن${FA}م`],
    ['عمه', 'amme', `ع${FA}م${SH}ه`],
    ['اسم', 'esm', `ا${KA}سم`],
    ['تو', 'to', `ت${DA}و`],
    ['تو', 'tu', 'تو'],
    ['آب و هوا', 'âb o havâ', `آب و ه${FA}وا`],
  ])('%s (%s)', (fa, tr, want) => expect(vocalize(fa, tr)).toBe(want))

  it('keeps marks already written instead of adding a second one', () => {
    expect(vocalize(`ن${DA}ه`, 'noh')).toBe(`ن${DA}ه`)
    expect(vocalize(`م${DA}بل`, 'mobl')).toBe(`م${DA}بل`)
    expect(vocalize(`د${DA}خت${FA}ر`, 'dokhtar')).toBe(`د${DA}خت${FA}ر`)
  })

  it('returns null when Finglish and script do not match', () => expect(vocalize('مبل', 'ketâb')).toBeNull())

  it('keeps the plain letters unchanged', () => {
    const v = vocalize(`خواهش می${ZW}کنم`, 'khâhesh mikonam')!
    expect(stripVowels(v)).toBe(`خواهش می${ZW}کنم`)
  })
})

describe('vocalizeWith', () => {
  it('vocalises known words in a text without Finglish and leaves the rest', () => {
    const lex = buildLexicon([{ fa: 'مبل', tr: 'mobl' }, { fa: 'چشم', tr: 'cheshm' }])
    expect(vocalizeWith(lex, 'یه مبل')).toBe(`یه م${DA}بل`)
  })
})

describe('one mark per vowel', () => {
  it('does not let a final letter take the first vowel of the next word', () => {
    expect(vocalize('امروز در خانه استراحت می‌کنم.', 'emruz dar khâne esterâhat mikonam.')).toContain('خانه اِستِراحَت')
    expect(vocalize('هر دو امیدوارند', 'har do omidvârand')).not.toContain('ُُ')
    expect(vocalize('یک بلیت به اصفهان', 'yek belit be Esfahân')).toContain(' به اِصفَهان')
  })

  it('keeps an ezâfe mark that is already written, without adding a second one', () => {
    expect(vocalize('زیرِ بغلِ کسی', 'zir-e baghal-e kasi')).not.toMatch(/ِِ/)
  })
})

describe('ow and ZWNJ', () => {
  it('writes the diphthong ow with a fatha, as dictionaries do', () => {
    expect(vocalize('دولت', 'dowlat')).toBe('دَولَت')
    expect(vocalize('نو', 'now')).toBe('نَو')
  })

  it('puts the vowel after a ZWNJ on the alef', () => {
    expect(vocalize('پس‌انداز', 'pasandâz')).toBe('پَس‌اَنداز')
  })
})
