import { describe, expect, it } from 'vitest'
import { acceptedForms, gradeTyped, lev, normEn } from '@/lib/grade.ts'
import { INTERVALS, isDue, review } from '@/lib/srs.ts'
import { freshProgress, parseProgress } from '@/lib/store.ts'
import { mergeProgress, sameLearning } from '@/lib/merge.ts'

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

describe('merging this device with the cloud', () => {
  const base = () => freshProgress()
  it('keeps work from both sides', () => {
    const local = { ...base(), done: { 'a1-greetings/words-1': true as const }, days: { 100: 15 }, xp: 15, lastDay: 100, streak: 1 }
    const remote = { ...base(), done: { 'a1-family/words-1': true as const }, passed: { A1: true as const }, days: { 99: 10, 100: 5 }, xp: 15, lastDay: 99, streak: 3, bestStreak: 3 }
    const m = mergeProgress(local, remote)
    expect(Object.keys(m.done).sort()).toEqual(['a1-family/words-1', 'a1-greetings/words-1'])
    expect(m.passed.A1).toBe(true)
    expect(m.days).toEqual({ 99: 10, 100: 15 })
    expect(m.xp).toBe(25)
    expect(m.lastDay).toBe(100)
    expect(m.streak).toBe(1)
    expect(m.bestStreak).toBe(3)
  })
  it('keeps the more practised copy of each review card, and local settings', () => {
    const local = { ...base(), cards: { k: { box: 2, due: 10, seen: 4, missed: 1 } }, settings: { ...base().settings, mode: 'latin' as const } }
    const remote = { ...base(), cards: { k: { box: 3, due: 12, seen: 6, missed: 1 }, j: { box: 1, due: 5, seen: 1, missed: 0 } } }
    const m = mergeProgress(local, remote)
    expect(m.cards.k.seen).toBe(6)
    expect(m.cards.j).toBeDefined()
    expect(m.settings.mode).toBe('latin')
  })
  it('detects when nothing needs uploading', () => {
    const a = base()
    expect(sameLearning(a, { ...a, hearts: 2 })).toBe(true)
    expect(sameLearning(a, { ...a, xp: 1 })).toBe(false)
  })
})

describe('pronunciation audio', () => {
  it('gives every speakable text its own audio file name', async () => {
    const { allSpeech } = await import('@/content/speech.ts')
    const { audioKey } = await import('@/lib/audioKey.ts')
    const items = allSpeech()
    expect(items.length).toBeGreaterThan(900)
    const keys = new Set(items.map((i) => audioKey(i.text)))
    expect(keys.size).toBe(items.length)
  })
  it('ignores spacing differences when naming a clip', async () => {
    const { audioKey } = await import('@/lib/audioKey.ts')
    expect(audioKey(' سلام  خوبی؟ ')).toBe(audioKey('سلام خوبی؟'))
  })
})
