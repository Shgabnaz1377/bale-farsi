import type { Level, Unit, Word } from './types.ts'
import { A1 } from './a1.ts'
import { A2 } from './a2.ts'
import { B1 } from './b1.ts'
import { B2 } from './b2.ts'

export interface LevelInfo {
  level: Level
  name: string
  fa: string
  tr: string
  blurb: string
  units: Unit[]
}

export const LEVELS: LevelInfo[] = [
  { level: 'A1', name: 'Beginner', fa: 'مبتدی', tr: 'mobtadi', units: A1,
    blurb: 'Greet people, introduce yourself, count, talk about family, food and your day.' },
  { level: 'A2', name: 'Elementary', fa: 'مقدماتی', tr: 'moghaddamâti', units: A2,
    blurb: 'Shop, find your way, describe your home, talk about the past, the weather and your health.' },
  { level: 'B1', name: 'Intermediate', fa: 'متوسط', tr: 'motevasset', units: B1,
    blurb: 'Make plans, talk about work and study, give opinions, handle ta\'ârof and tell stories.' },
  { level: 'B2', name: 'Upper intermediate', fa: 'فوق متوسط', tr: 'fogh-e motevasset', units: B2,
    blurb: 'Read the news, switch between written and spoken Persian, meet poetry and argue a point.' },
]

export const ALL_UNITS: Unit[] = LEVELS.flatMap((l) => l.units)
export const unitById = new Map(ALL_UNITS.map((u) => [u.id, u]))
export const levelOf = (u: Unit) => LEVELS.find((l) => l.level === u.level)!

export interface WordRef {
  key: string
  word: Word
  unit: Unit
}

/** Every word in the course with a stable key for spaced review: '<unit id>:<persian>'. */
export const ALL_WORDS: WordRef[] = ALL_UNITS.flatMap((unit) =>
  unit.words.map((word) => ({ key: `${unit.id}:${word.fa}`, word, unit })),
)
export const wordByKey = new Map(ALL_WORDS.map((w) => [w.key, w]))

export type LessonKind = 'words-1' | 'words-2' | 'grammar' | 'sentences' | 'dialogue' | 'reading'

export interface LessonDef {
  kind: LessonKind
  name: string
  key: string
}

export const LESSON_NAMES: Record<LessonKind, string> = {
  'words-1': 'Words 1',
  'words-2': 'Words 2',
  grammar: 'Grammar',
  sentences: 'Sentences',
  dialogue: 'Dialogue',
  reading: 'Reading',
}

export function lessonsOf(u: Unit): LessonDef[] {
  const kinds: LessonKind[] = ['words-1', 'words-2', 'grammar', 'sentences']
  if (u.dialogue?.length) kinds.push('dialogue')
  if (u.reading) kinds.push('reading')
  return kinds.map((kind) => ({ kind, name: LESSON_NAMES[kind], key: `${u.id}/${kind}` }))
}

/** The two halves of a unit's word list. */
export function wordsFor(u: Unit, kind: LessonKind): Word[] {
  const half = Math.ceil(u.words.length / 2)
  if (kind === 'words-1') return u.words.slice(0, half)
  if (kind === 'words-2') return u.words.slice(half)
  return u.words
}
