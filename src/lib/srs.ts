/**
 * Leitner-style spaced repetition. A card climbs one box per correct answer
 * and drops to box 1 when missed; the box sets how many days until it is due again.
 */
export interface Card {
  box: number
  /** Day number (days since 1970-01-01, local time) when the card is next due. */
  due: number
  seen: number
  missed: number
}

export const INTERVALS = [0, 1, 2, 4, 8, 16, 32] as const
export const MAX_BOX = INTERVALS.length - 1

export function dayNumber(d = new Date()): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)
}

export function review(card: Card | undefined, correct: boolean, today: number): Card {
  const c: Card = card ? { ...card } : { box: 0, due: today, seen: 0, missed: 0 }
  c.seen++
  if (correct) {
    c.box = Math.min(MAX_BOX, c.box + 1)
  } else {
    c.missed++
    c.box = 1
  }
  c.due = today + INTERVALS[c.box]
  return c
}

export const isDue = (c: Card, today: number) => c.due <= today
/** A word counts as learned once it has been answered right on two separate reviews. */
export const isLearned = (c: Card) => c.box >= 2
