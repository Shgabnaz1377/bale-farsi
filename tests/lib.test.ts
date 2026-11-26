import { describe, expect, it } from 'vitest'
import { acceptedForms, gradeTyped, lev, normEn } from '@/lib/grade.ts'
import { INTERVALS, isDue, review } from '@/lib/srs.ts'
import { freshProgress, parseProgress } from '@/lib/store.ts'

describe('typed answers', () => {
  it('ignores case, punctuation, articles and contractions', () => {
    expect(normEn('The Tea is delicious!')).toBe('tea is delicious')
    expect(normEn("I'm good, thanks")).toBe('i am good thanks')
  })
  it('accepts alternatives and slash/parenthesis forms', () => {
    const forms = acceptedForms('he / she', ['he'])
    expect(gradeTyped('she', forms).ok).toBe(true)
    expect(gradeTyped('you', acceptedForms('you (formal)')).ok).toBe(true)
  })
  it('forgives one typo in longer words, not in short ones', () => {
    expect(gradeTyped('goodbey', ['goodbye'])).toEqual({ ok: true, typo: 'goodbye' })
    expect(gradeTyped('ni', ['no']).ok).toBe(false)
    expect(gradeTyped('', ['no']).ok).toBe(false)
  })
  it('computes edit distance', () => {
    expect(lev('kitten', 'sitting')).toBe(3)
    expect(lev('', 'abc')).toBe(3)
  })
})

describe('spaced review', () => {
  it('climbs a box when right and falls to box 1 when wrong', () => {
    let c = review(undefined, true, 100)
    expect(c.box).toBe(1)
    expect(c.due).toBe(100 + INTERVALS[1])
    c = review(c, true, 101)
    expect(c.box).toBe(2)
    c = review(c, false, 103)
    expect(c).toMatchObject({ box: 1, missed: 1, due: 104 })
    expect(isDue(c, 103)).toBe(false)
    expect(isDue(c, 104)).toBe(true)
  })
})

describe('saved progress', () => {
  it('falls back to a fresh state on bad data', () => {
    expect(parseProgress(null)).toEqual(freshProgress())
    expect(parseProgress('{oops')).toEqual(freshProgress())
    expect(parseProgress('{"v":9}')).toEqual(freshProgress())
  })
  it('keeps saved values and fills in new settings', () => {
    const p = parseProgress(JSON.stringify({ v: 1, xp: 42, settings: { mode: 'latin' } }))
    expect(p.xp).toBe(42)
    expect(p.settings.mode).toBe('latin')
    expect(p.settings.goal).toBe(30)
  })
})
