import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { extractKeys } from '@/i18n/keys.ts'
import { IT } from '@/i18n/it.ts'
import { setLang } from '@/i18n/index.ts'
import { ALL_UNITS, LEVELS, lessonsOf } from '@/content/course.ts'
import { LETTERS } from '@/content/alphabet.ts'
import { applyCourseLang } from '@/content/localize.ts'
import { validateTranslation } from '@/content/i18n/validate.ts'
import { IT_A1 } from '@/content/i18n/it/a1.ts'
import { IT_A2 } from '@/content/i18n/it/a2.ts'
import { IT_B1 } from '@/content/i18n/it/b1.ts'
import { IT_B2 } from '@/content/i18n/it/b2.ts'
import { grade, unitLesson } from '@/lib/exercises.ts'
import { gradeTyped } from '@/lib/grade.ts'
import { mulberry32, setRng } from '@/lib/random.ts'

const IT_COURSE = { A1: IT_A1, A2: IT_A2, B1: IT_B1, B2: IT_B2 }

// Every app source file outside the course content, as text.
const SOURCES = Object.entries(import.meta.glob(['/src/**/*.vue', '/src/**/*.ts', '!/src/content/**'], { query: '?raw', import: 'default', eager: true }))
  .map(([, s]) => s as string)
const uiKeys = () => extractKeys(SOURCES)

describe('Italian interface', () => {
  it('has an Italian string for every English string in the app', () => {
    const missing = uiKeys().filter((k) => !(k in IT))
    expect(missing).toEqual([])
  })
  it('keeps every {placeholder} in the translation', () => {
    const broken = Object.entries(IT).filter(([en, it]) => {
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join()
      return ph(en) !== ph(it)
    })
    expect(broken.map(([en]) => en)).toEqual([])
  })
})

describe('Italian course', () => {
  for (const lv of LEVELS) {
    it(`${lv.level} translation is complete and matches the course`, () => {
      expect(validateTranslation(lv.units, IT_COURSE[lv.level])).toEqual([])
    })
  }

  describe('switching language', () => {
    const englishSnapshot = JSON.stringify({ units: ALL_UNITS, letters: LETTERS, levels: LEVELS.map((l) => [l.name, l.blurb]) })
    beforeAll(() => { setLang('it'); applyCourseLang('it'); setRng(mulberry32(7)) })
    afterAll(() => { setLang('en'); applyCourseLang('en') })

    it('shows Italian meanings and keeps the Persian', () => {
      const u = ALL_UNITS.find((x) => x.id === 'a1-greetings')!
      expect(u.title).toBe(IT_A1['a1-greetings'].title)
      expect(u.words[0].fa).toBe(IT_A1['a1-greetings'].words[0].fa)
      expect(u.words[0].en).toBe(IT_A1['a1-greetings'].words[0].it)
    })

    it('every lesson can still be finished in Italian', () => {
      for (const u of ALL_UNITS) for (const l of lessonsOf(u)) {
        for (const ex of unitLesson(u, l.kind, { hasVoice: true })) {
          let answer: unknown = 'done'
          if (ex.kind === 'choice') answer = ex.answer
          if (ex.kind === 'type') answer = ex.accepted[0]
          if (ex.kind === 'build') {
            const used = new Set<number>()
            answer = ex.target.map((t) => { const i = ex.tiles.findIndex((x, j) => !used.has(j) && x.key === t); used.add(i); return i })
          }
          expect(grade(ex, answer as never).ok, `${l.key}: ${ex.title}`).toBe(true)
        }
      }
    })

    it('accepts Italian answers with or without the article and accents', () => {
      expect(gradeTyped("l'acqua", ['acqua']).ok).toBe(true)
      expect(gradeTyped('la mela', ['mela']).ok).toBe(true)
      expect(gradeTyped('perche', ['perché']).ok).toBe(true)
    })

    it('restores the original English exactly when switching back', () => {
      applyCourseLang('en')
      expect(JSON.stringify({ units: ALL_UNITS, letters: LETTERS, levels: LEVELS.map((l) => [l.name, l.blurb]) })).toBe(englishSnapshot)
      applyCourseLang('it')
    })
  })
})
