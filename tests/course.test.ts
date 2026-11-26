import { describe, expect, it, beforeAll } from 'vitest'
import { ALL_UNITS, ALL_WORDS, LEVELS, lessonsOf } from '@/content/course.ts'
import { LETTERS, LETTER_GROUPS } from '@/content/alphabet.ts'
import { validateUnits } from '@/content/validate.ts'
import { alphabetLesson, grade, levelTest, reviewLesson, unitLesson, type Ex } from '@/lib/exercises.ts'
import { mulberry32, setRng } from '@/lib/random.ts'

beforeAll(() => setRng(mulberry32(1377)))

/** The answer a perfect learner would give. */
function perfect(ex: Ex) {
  switch (ex.kind) {
    case 'choice': return ex.answer
    case 'type': return ex.accepted[0]
    case 'build': {
      const used = new Set<number>()
      return ex.target.map((t) => {
        const i = ex.tiles.findIndex((x, j) => !used.has(j) && x.key === t)
        used.add(i)
        return i
      })
    }
    default: return 'done' as const
  }
}

function checkSolvable(ex: Ex, where: string) {
  if (ex.kind === 'choice') {
    expect(ex.options.length, where).toBeGreaterThanOrEqual(2)
    expect(ex.answer, `${where}: answer index`).toBeGreaterThanOrEqual(0)
    expect(ex.answer).toBeLessThan(ex.options.length)
    const labels = ex.options.map((o) => o.en ?? o.fa)
    expect(new Set(labels).size, `${where}: duplicate options ${labels.join(' | ')}`).toBe(labels.length)
  }
  if (ex.kind === 'match') {
    expect(ex.pairs.length, where).toBeGreaterThanOrEqual(3)
    expect(new Set(ex.pairs.map((p) => p.en)).size).toBe(ex.pairs.length)
  }
  if (ex.kind === 'build') {
    expect((perfect(ex) as number[]).every((i) => i >= 0), `${where}: target tiles missing`).toBe(true)
  }
  expect(grade(ex, perfect(ex)).ok, `${where}: a perfect answer must pass`).toBe(true)
}

describe('course content', () => {
  for (const lv of LEVELS) {
    it(`${lv.level} passes the content rules`, () => {
      expect(validateUnits(lv.units, lv.level)).toEqual([])
    })
  }

  it('has unique unit ids and word keys', () => {
    expect(new Set(ALL_UNITS.map((u) => u.id)).size).toBe(ALL_UNITS.length)
    expect(new Set(ALL_WORDS.map((w) => w.key)).size).toBe(ALL_WORDS.length)
  })

  it('has every letter of the Persian alphabet exactly once', () => {
    expect(LETTERS).toHaveLength(32)
    expect(LETTER_GROUPS.flatMap((g) => g.letters).sort()).toEqual(LETTERS.map((l) => l.fa).sort())
  })
})

describe('every lesson can be finished', () => {
  for (const u of ALL_UNITS) {
    for (const l of lessonsOf(u)) {
      it(l.key, () => {
        for (const hasVoice of [false, true]) {
          const ex = unitLesson(u, l.kind, { hasVoice })
          expect(ex.length).toBeGreaterThan(3)
          ex.forEach((e, i) => checkSolvable(e, `${l.key}#${i} (${e.kind}: ${e.title})`))
        }
      })
    }
  }

  LETTER_GROUPS.forEach((g, i) => {
    it(`alphabet/${i} ${g.title}`, () => {
      const ex = alphabetLesson(i)
      expect(ex[0].kind).toBe('card')
      ex.forEach((e, j) => checkSolvable(e, `alphabet/${i}#${j} (${e.title})`))
    })
  })

  for (const lv of LEVELS.filter((l) => l.units.length)) {
    it(`${lv.level} level test`, () => {
      const ex = levelTest(lv.level)
      expect(ex.length).toBeGreaterThanOrEqual(12)
      ex.forEach((e, i) => checkSolvable(e, `${lv.level} test #${i}`))
    })
  }

  it('review rounds', () => {
    const ex = reviewLesson(ALL_WORDS.slice(0, 12), { hasVoice: true })
    expect(ex.length).toBe(13)
    ex.forEach((e, i) => checkSolvable(e, `review #${i}`))
  })
})

describe('wrong answers fail', () => {
  it('a wrong choice and an empty build are marked wrong', () => {
    const u = ALL_UNITS[0]
    const ex = unitLesson(u, 'words-1', { hasVoice: false })
    const choice = ex.find((e) => e.kind === 'choice')!
    if (choice.kind !== 'choice') throw new Error('expected a choice')
    expect(grade(choice, (choice.answer + 1) % choice.options.length).ok).toBe(false)
    const build = unitLesson(u, 'sentences', { hasVoice: false }).find((e) => e.kind === 'build')!
    expect(grade(build, []).ok).toBe(false)
  })
})
