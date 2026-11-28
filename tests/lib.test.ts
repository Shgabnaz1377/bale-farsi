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
  it('takes the account language on a device still on the starting language', () => {
    const local = { ...base(), settings: { ...base().settings, lang: 'en' as const } }
    const remote = { ...base(), settings: { ...base().settings, lang: 'it' as const } }
    expect(mergeProgress(local, remote, 'en').settings.lang).toBe('it')
    // A language picked on this device stays.
    expect(mergeProgress({ ...local, settings: { ...local.settings, lang: 'it' } }, { ...remote, settings: { ...remote.settings, lang: 'en' } }, 'en').settings.lang).toBe('it')
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
    const items = allSpeech()
    expect(items.length).toBeGreaterThan(500)
    const keys = new Set(items.map((i) => i.key))
    expect(keys.size).toBe(items.length)
  })
  it('ignores spacing differences when naming a clip', async () => {
    const { audioKey } = await import('@/lib/audioKey.ts')
    expect(audioKey(' سلام  خوبی؟ ')).toBe(audioKey('سلام خوبی؟'))
  })
})

describe('did you know? facts', () => {
  it('have unique ids and both languages', async () => {
    const { FACTS } = await import('@/content/facts.ts')
    expect(new Set(FACTS.map((f) => f.id)).size).toBe(FACTS.length)
    for (const f of FACTS) for (const s of [f.en.title, f.en.text, f.it.title, f.it.text, f.word.fa, f.word.tr]) expect(s.trim()).not.toBe('')
  })
  it('keep old saves working: progress without facts loads with none read', () => {
    const old = JSON.stringify({ v: 1, xp: 40, hearts: 2, cards: {} })
    const p = parseProgress(old)
    expect(p.facts).toEqual({})
    expect(p.xp).toBe(40)
  })
  it('a new fact earns a heart once', async () => {
    const { P, readFact } = await import('@/lib/store.ts')
    P.hearts = 3
    P.facts = {}
    expect(readFact('no-gender')).toBe('heart')
    expect(P.hearts).toBe(4)
    expect(readFact('no-gender')).toBe(null)
    expect(P.hearts).toBe(4)
  })
})

describe('idioms', () => {
  it('have unique ids, both languages and an example', async () => {
    const { IDIOMS } = await import('@/content/idioms.ts')
    expect(new Set(IDIOMS.map((d) => d.id)).size).toBe(IDIOMS.length)
    for (const d of IDIOMS) {
      for (const s of [d.fa, d.tr, d.literal.en, d.literal.it, d.meaning.en, d.meaning.it, d.example.fa, d.example.tr, d.example.en, d.example.it]) expect(s.trim()).not.toBe('')
    }
  })
  it('keep old saves working: progress without idioms loads with none learned', () => {
    expect(parseProgress(JSON.stringify({ v: 1, xp: 5, cards: {}, facts: { 'no-gender': true } })).idioms).toEqual({})
  })
  it('a new idiom earns a heart once, separately from facts', async () => {
    const { P, learnIdiom, readFact } = await import('@/lib/store.ts')
    P.hearts = 3
    P.idioms = {}
    P.facts = {}
    expect(learnIdiom('watermelon')).toBe('heart')
    expect(learnIdiom('watermelon')).toBe(null)
    expect(readFact('watermelon')).toBe('heart')
    expect(P.hearts).toBe(5)
  })
})

describe('accounts: guest limit', () => {
  it('lets guests do one lesson, then asks for an account (only when accounts are on)', async () => {
    const { account, needsAccount, GUEST_LESSONS } = await import('@/lib/account.ts')
    const { P } = await import('@/lib/store.ts')
    const was = { enabled: account.enabled, user: account.user, done: P.done }
    try {
      account.enabled = true
      account.user = null
      P.done = {}
      expect(needsAccount()).toBe(false)
      for (let i = 0; i < GUEST_LESSONS; i++) P.done[`a1-greetings/l${i}`] = true
      expect(needsAccount()).toBe(true)
      account.user = { id: 'x', email: 'x@example.com' }
      expect(needsAccount()).toBe(false)
      account.user = null
      account.enabled = false
      expect(needsAccount()).toBe(false)
    } finally {
      Object.assign(account, { enabled: was.enabled, user: was.user })
      P.done = was.done
    }
  })
})

describe('pronunciation review queue', () => {
  it('puts learner reports first, then listen-back flags, then unreviewed clips, and skips what I reviewed', async () => {
    const { reviewQueue, allClips } = await import('@/lib/pron.ts')
    const clips = await allClips()
    const [a, b, c, d] = clips
    const row = (over: object) => ({ id: 1, kind: 'report', clip_key: a.key, fa: a.text, tr: a.tr ?? '', voice: String(a.voice), verdict: 'wrong', suggested_tr: '', comment: '', status: 'open', created_at: '', updated_at: '', who: 'x', who_role: 'learner', mine: false, ...over })
    const realFetch = globalThis.fetch
    globalThis.fetch = (async () => new Response(JSON.stringify({ generated: '', checked: 1, flags: [{ key: b.key, fa: b.text, tr: b.tr, heard: 'something', score: 0.8 }] }))) as typeof fetch
    try {
      const q = await reviewQueue([
        row({ id: 1, suggested_tr: 'better' }) as never,
        row({ id: 2, kind: 'review', clip_key: c.key, fa: c.text, verdict: 'ok', mine: true }) as never,
      ], 10)
      expect(q[0]).toMatchObject({ key: a.key, why: 'reported', reportIds: [1] })
      expect(q[0].notes[0]).toContain('better')
      expect(q[1]).toMatchObject({ key: b.key, why: 'stt' })
      expect(q.slice(2).every((x) => x.why === 'sample')).toBe(true)
      expect(q.some((x) => x.key === c.key)).toBe(false)
      expect(q).toHaveLength(10)
      expect(d).toBeTruthy()
    } finally {
      globalThis.fetch = realFetch
    }
  })
})
