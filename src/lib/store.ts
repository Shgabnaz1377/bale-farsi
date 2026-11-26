import { reactive, watch } from 'vue'
import type { Level, Unit } from '@/content/types.ts'
import { ALL_WORDS, LEVELS, lessonsOf, type WordRef } from '@/content/course.ts'
import { LETTER_GROUPS } from '@/content/alphabet.ts'
import { dayNumber, isDue, isLearned, review, type Card } from './srs.ts'

export type ScriptMode = 'both' | 'script' | 'latin'
export type Theme = 'system' | 'light' | 'dark'
export type { Lang } from '@/i18n/index.ts'
import { detectLang, type Lang } from '@/i18n/index.ts'
import { APP } from '@/app.ts'

export interface Settings {
  mode: ScriptMode
  sfx: boolean
  autoplay: boolean
  goal: number
  relaxed: boolean
  theme: Theme
  /** The learner's own language: meanings, explanations and buttons. */
  lang: Lang
}

export interface Progress {
  v: 1
  xp: number
  streak: number
  bestStreak: number
  /** Day number of the last day a lesson was finished. */
  lastDay: number
  hearts: number
  heartsDay: number
  /** XP earned per day number, for the activity calendar. */
  days: Record<number, number>
  /** Finished lessons, by lesson key ('a1-greetings/words-1', 'alphabet/0'). */
  done: Record<string, true>
  /** Level tests passed. */
  passed: Partial<Record<Level, true>>
  cards: Record<string, Card>
  settings: Settings
}

export const MAX_HEARTS = 5
// One storage key per app (PersianMeow keeps its first name, so progress saved before the renames is not lost).
const STORE_KEY = `${APP.storage}:v1`

export function freshProgress(): Progress {
  return {
    v: 1, xp: 0, streak: 0, bestStreak: 0, lastDay: 0, hearts: MAX_HEARTS, heartsDay: 0,
    days: {}, done: {}, passed: {}, cards: {},
    settings: { mode: 'both', sfx: true, autoplay: true, goal: 30, relaxed: false, theme: 'system', lang: detectLang() },
  }
}

/** Merge saved JSON onto a fresh progress object, ignoring anything malformed. */
export function parseProgress(raw: string | null): Progress {
  const base = freshProgress()
  if (!raw) return base
  try {
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object' || data.v !== 1) return base
    return { ...base, ...data, settings: { ...base.settings, ...(data.settings ?? {}) } }
  } catch {
    return base
  }
}

function load(): Progress {
  try {
    return parseProgress(localStorage.getItem(STORE_KEY))
  } catch {
    return freshProgress()
  }
}

export const P = reactive<Progress>(load())

watch(P, () => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(P))
  } catch {
    /* private mode or storage full: progress lives for this visit only */
  }
}, { deep: true })

export const today = () => dayNumber()

/** Refill hearts on a new day and break the streak if a day was missed. */
export function rollDay() {
  const t = today()
  if (P.heartsDay !== t) {
    P.hearts = MAX_HEARTS
    P.heartsDay = t
  }
  if (P.lastDay && t - P.lastDay > 1) P.streak = 0
}

export const xpToday = () => P.days[today()] ?? 0
export const streakActiveToday = () => P.lastDay === today()

export function addXp(n: number) {
  const t = today()
  P.xp += n
  P.days[t] = (P.days[t] ?? 0) + n
  if (P.lastDay !== t) {
    P.streak = P.lastDay === t - 1 ? P.streak + 1 : 1
    P.lastDay = t
    P.bestStreak = Math.max(P.bestStreak, P.streak)
    return true
  }
  return false
}

export function loseHeart() {
  if (!P.settings.relaxed) P.hearts = Math.max(0, P.hearts - 1)
}
export const outOfHearts = () => !P.settings.relaxed && P.hearts <= 0
export const gainHeart = () => { P.hearts = Math.min(MAX_HEARTS, P.hearts + 1) }

export function recordCard(key: string, correct: boolean) {
  P.cards[key] = review(P.cards[key], correct, today())
}
export const hasSeen = (key: string) => !!P.cards[key]

export function dueWords(limit = 12): WordRef[] {
  const t = today()
  return ALL_WORDS
    .filter((w) => P.cards[w.key] && isDue(P.cards[w.key], t))
    .sort((a, b) => P.cards[a.key].box - P.cards[b.key].box || P.cards[a.key].due - P.cards[b.key].due)
    .slice(0, limit)
}
export const dueCount = () => {
  const t = today()
  return ALL_WORDS.filter((w) => P.cards[w.key] && isDue(P.cards[w.key], t)).length
}
/** When nothing is due: the words missed most, then the least practised. */
export function weakWords(limit = 10): WordRef[] {
  return ALL_WORDS
    .filter((w) => P.cards[w.key])
    .sort((a, b) => (P.cards[b.key].missed - P.cards[a.key].missed) || (P.cards[a.key].box - P.cards[b.key].box))
    .slice(0, limit)
}
export const learnedCount = () => ALL_WORDS.filter((w) => P.cards[w.key] && isLearned(P.cards[w.key])).length
export const seenCount = () => Object.keys(P.cards).length

/* ---------- Unlocking ---------- */

export const unitDone = (u: Unit) => lessonsOf(u).every((l) => P.done[l.key])
export const unitProgress = (u: Unit) => {
  const ls = lessonsOf(u)
  return ls.filter((l) => P.done[l.key]).length / ls.length
}

export function levelUnlocked(level: Level): boolean {
  const i = LEVELS.findIndex((l) => l.level === level)
  if (i <= 0) return true
  const prev = LEVELS[i - 1]
  return !!P.passed[prev.level] || prev.units.every(unitDone)
}

export function unitUnlocked(u: Unit): boolean {
  if (!levelUnlocked(u.level)) return false
  if (P.passed[u.level]) return true
  const units = LEVELS.find((l) => l.level === u.level)!.units
  const i = units.indexOf(u)
  return i === 0 || unitDone(units[i - 1])
}

export function lessonUnlocked(u: Unit, key: string): boolean {
  if (!unitUnlocked(u)) return false
  const ls = lessonsOf(u)
  const i = ls.findIndex((l) => l.key === key)
  return i <= 0 || !!P.done[ls[i - 1].key]
}

/** The next lesson to do: first unlocked, unfinished lesson in course order. */
export function nextLesson(): { unit: Unit; key: string; name: string } | null {
  for (const lv of LEVELS) for (const u of lv.units) {
    if (!unitUnlocked(u)) continue
    for (const l of lessonsOf(u)) if (!P.done[l.key] && lessonUnlocked(u, l.key)) return { unit: u, key: l.key, name: l.name }
  }
  return null
}

export const alphabetDone = () => LETTER_GROUPS.every((_, i) => P.done[`alphabet/${i}`])
export const alphabetUnlocked = (i: number) => i === 0 || !!P.done[`alphabet/${i - 1}`]

/* ---------- Backup ---------- */

export const exportProgress = () => JSON.stringify(P)
export function importProgress(json: string): boolean {
  try {
    const data = JSON.parse(json)
    if (!data || data.v !== 1) return false
  } catch {
    return false
  }
  Object.assign(P, parseProgress(json))
  return true
}
export function resetProgress() {
  const keep = { ...P.settings }
  Object.assign(P, freshProgress(), { settings: keep })
}
