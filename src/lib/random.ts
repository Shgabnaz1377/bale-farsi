export type Rng = () => number

let rng: Rng = Math.random

/** Swap the random source (tests use a seeded one). */
export function setRng(next: Rng) {
  rng = next
}

/** Small deterministic generator for tests and the word of the day. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: readonly T[]): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const pick = <T>(items: readonly T[], n: number): T[] => shuffle(items).slice(0, n)
export const pickOne = <T>(items: readonly T[]): T => items[Math.floor(rng() * items.length)]
export const chance = (p: number) => rng() < p
