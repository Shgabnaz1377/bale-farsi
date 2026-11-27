import { afterEach, describe, expect, it } from 'vitest'
import { VOWELS, VOWEL_PAIRS } from '../src/content/vowels.ts'
import { misreadings, vowelsLesson } from '../src/lib/vowelsLesson.ts'
import { marksWanted, withMarks } from '../src/lib/vowelMarks.ts'
import { stripVowels, vocalize } from '../src/lib/vocalize.ts'
import { P } from '../src/lib/store.ts'

describe('vowel data', () => {
  it('has three short and three long vowels', () => {
    expect(VOWELS.filter((v) => !v.long).map((v) => v.tr)).toEqual(['a', 'e', 'o'])
    expect(VOWELS.filter((v) => v.long).map((v) => v.tr)).toEqual(['â', 'u', 'i'])
  })

  it('writes every short-vowel example with exactly the marks its Finglish asks for', () => {
    for (const v of VOWELS.filter((x) => !x.long)) {
      for (const e of v.examples) expect(vocalize(stripVowels(e.fa), e.tr), e.tr).toBe(e.fa)
    }
  })

  it('pairs words that differ only in the vowel mark', () => {
    for (const [a, b] of VOWEL_PAIRS) {
      expect(stripVowels(a.fa)).toBe(stripVowels(b.fa))
      expect(a.fa).not.toBe(b.fa)
    }
  })
})

describe('vowels lesson', () => {
  it('starts with the explanation and has a correct answer in every choice', () => {
    for (const hasVoice of [true, false]) {
      const ex = vowelsLesson({ hasVoice })
      expect(ex[0].kind).toBe('card')
      expect(ex.length).toBeGreaterThan(8)
      for (const e of ex) if (e.kind === 'choice') expect(e.answer).toBeGreaterThanOrEqual(0)
    }
  })

  it('makes wrong readings by swapping one short vowel', () => {
    expect(misreadings('gol').sort()).toEqual(['gal', 'gel'])
    expect(misreadings('âb')).toEqual([])
  })
})

describe('vowel marks on screen', () => {
  afterEach(() => { P.settings.vowels = 'auto' })

  it('shows marks in A1, on single words in A2, and not from B1', () => {
    expect(marksWanted('A1', 'من آب می‌خواهم')).toBe(true)
    expect(marksWanted('A2', 'مبل')).toBe(true)
    expect(marksWanted('A2', 'یه مبل')).toBe(false)
    expect(marksWanted('B1', 'مبل')).toBe(false)
    expect(marksWanted(null, 'مبل')).toBe(false)
  })

  it('follows the setting when it is not "by level"', () => {
    P.settings.vowels = 'always'
    expect(marksWanted('B2', 'مبل')).toBe(true)
    P.settings.vowels = 'never'
    expect(marksWanted('A1', 'مبل')).toBe(false)
  })

  it('falls back to the plain text when the Finglish does not match', () => {
    expect(withMarks('مبل', 'mobl')).toBe('مُبل')
    expect(withMarks('مبل', 'ketâb')).toBe('مبل')
  })
})
