import type { Card } from './srs.ts'
import type { Progress } from './store.ts'

/** The card that has seen more practice; on a tie, the one due later (the more advanced). */
function newerCard(a: Card | undefined, b: Card | undefined): Card | undefined {
  if (!a) return b
  if (!b) return a
  if (a.seen !== b.seen) return a.seen > b.seen ? a : b
  return a.due >= b.due ? a : b
}

/**
 * Combine two copies of a learner's progress (this device and the cloud) without losing work:
 * finished lessons and passed tests are united, each review card keeps its most-practised copy,
 * daily XP keeps the higher figure per day, and the streak comes from whichever copy was active last.
 * Settings and today's hearts stay as they are on this device, except the language: a device still
 * on the starting language takes the one saved with the account, so the learner's language follows
 * their login to every device.
 */
export function mergeProgress(local: Progress, remote: Progress, startLang?: Progress['settings']['lang']): Progress {
  const days: Progress['days'] = { ...remote.days }
  for (const [d, xp] of Object.entries(local.days)) days[Number(d)] = Math.max(xp, days[Number(d)] ?? 0)

  const cards: Progress['cards'] = {}
  for (const key of new Set([...Object.keys(local.cards), ...Object.keys(remote.cards)])) {
    const c = newerCard(local.cards[key], remote.cards[key])
    if (c) cards[key] = c
  }

  const latest = local.lastDay >= remote.lastDay ? local : remote
  const lang = local.settings.lang === startLang && remote.settings?.lang ? remote.settings.lang : local.settings.lang
  return {
    ...local,
    settings: { ...local.settings, lang },
    xp: Math.max(local.xp, remote.xp, Object.values(days).reduce((n, x) => n + x, 0)),
    streak: latest.streak,
    lastDay: latest.lastDay,
    bestStreak: Math.max(local.bestStreak, remote.bestStreak),
    days,
    done: { ...remote.done, ...local.done },
    passed: { ...remote.passed, ...local.passed },
    cards,
  }
}

/** True when two progress documents hold the same learning state (settings and hearts aside). */
export function sameLearning(a: Progress, b: Progress): boolean {
  const pick = (p: Progress) => JSON.stringify([p.xp, p.streak, p.lastDay, p.bestStreak, p.days, p.done, p.passed, p.cards])
  return pick(a) === pick(b)
}
