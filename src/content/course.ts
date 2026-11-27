import type { Level, Unit, Word } from './types.ts'
import { A1 } from './a1.ts'
import { A2 } from './a2.ts'
import { B1 } from './b1.ts'
import { B2 } from './b2.ts'
import { A1 as IT_A1 } from '../courses/begociao/a1.ts'
import { A2 as IT_A2 } from '../courses/begociao/a2.ts'
import { B1 as IT_B1 } from '../courses/begociao/b1.ts'
import { B2 as IT_B2 } from '../courses/begociao/b2.ts'
import { APP_ID } from '../app.ts'

export interface LevelInfo {
  level: Level
  name: string
  fa: string
  tr: string
  blurb: string
  units: Unit[]
}

const PERSIAN_COURSE: LevelInfo[] = [
  { level: 'A1', name: 'Beginner', fa: 'مبتدی', tr: 'mobtadi', units: A1,
    blurb: 'Greet people, introduce yourself, count, tell the time, describe people, and talk about family, school, food, jobs and hobbies. Learn the key verbs and how spoken Persian differs from written.' },
  { level: 'A2', name: 'Elementary', fa: 'مقدماتی', tr: 'moghaddamâti', units: A2,
    blurb: 'Shop, eat out, travel, cook, make calls and invitations, talk about your day, feelings, the past and your plans, and celebrate Persian festivals.' },
  { level: 'B1', name: 'Intermediate', fa: 'متوسط', tr: 'motevasset', units: B1,
    blurb: 'Give opinions and advice, handle ta\'ârof, interviews, renting and services, tell stories, link ideas with the subjunctive, and speak like Iranians do.' },
  { level: 'B2', name: 'Upper intermediate', fa: 'فوق متوسط', tr: 'fogh-e motevasset', units: B2,
    blurb: 'Argue a point, read the news and formal letters, use idioms and slang, discuss science, money and history, and meet Persian poetry, cinema and dialects.' },
]

/** Bego Ciao: Italian for Persian speakers. `fa`/`tr` hold the Italian level name and its Persian-letter pronunciation. */
const ITALIAN_COURSE: LevelInfo[] = [
  { level: 'A1', name: 'مبتدی', fa: 'Principiante', tr: 'پرینچیپیانته', units: IT_A1,
    blurb: 'سلام و احوال‌پرسی، معرفی خودت، اعداد، خانواده، غذا و برنامهٔ روزانه.' },
  { level: 'A2', name: 'مقدماتی', fa: 'Elementare', tr: 'اِلِمِنتاره', units: IT_A2,
    blurb: 'خرید، پیدا کردن راه، خانه، گذشته، آب‌وهوا و سلامتی.' },
  { level: 'B1', name: 'متوسط', fa: 'Intermedio', tr: 'اینتِرمِدیو', units: IT_B1,
    blurb: 'سفر، کار و تحصیل، بیان نظر، فرهنگ ایتالیا و تعریف کردن ماجرا.' },
  { level: 'B2', name: 'فوق متوسط', fa: 'Intermedio superiore', tr: 'اینتِرمِدیو سوپِریوره', units: IT_B2,
    blurb: 'محیط زیست، زبان رسمی و محاوره، ادبیات، جمله‌های شرطی و خواندن اخبار.' },
]

export const LEVELS: LevelInfo[] = APP_ID === 'begociao' ? ITALIAN_COURSE : PERSIAN_COURSE

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
