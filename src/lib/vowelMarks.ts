import { computed, inject, provide, unref, type ComputedRef, type InjectionKey } from 'vue'
import type { Level } from '@/content/types.ts'
import { vocalize } from './vocalize.ts'
import { P } from './store.ts'
import { APP } from '@/app.ts'

/**
 * Short-vowel marks (اِعراب) on displayed Persian.
 * Written Persian leaves out a, e and o, which is hard for beginners, so by default the marks are shown in A1,
 * on single words in A2, and not at all from B1 on, like real Persian. Settings can force them on or off.
 * The marks come from the Finglish (src/lib/vocalize.ts); only the display changes, never the data.
 */
type LevelSource = Level | null | ComputedRef<Level | null | undefined>
const FA_LEVEL: InjectionKey<LevelSource> = Symbol('fa-level')

/** Call in a view that shows one level's Persian (a unit, a lesson, a level test). */
export const provideFaLevel = (level: LevelSource) => provide(FA_LEVEL, level)

const cache = new Map<string, string>()
/** The text with vowel marks, or the plain text when the Finglish does not line up with it. */
export function withMarks(fa: string, tr: string): string {
  const key = fa + '\u0000' + tr
  let out = cache.get(key)
  if (out === undefined) {
    out = vocalize(fa, tr) ?? fa
    cache.set(key, out)
  }
  return out
}

/** Should this text show its vowel marks here? */
export function marksWanted(level: Level | null | undefined, fa: string): boolean {
  if (APP.target !== 'fa') return false
  const s = P.settings.vowels ?? 'auto'
  if (s !== 'auto') return s === 'always'
  if (level === 'A1') return true
  if (level === 'A2') return !/\s/.test(fa.trim())
  return false
}

/** For FaText: the Persian to display, with or without marks. */
export function useMarkedText(fa: () => string, tr: () => string) {
  const level = inject(FA_LEVEL, null)
  return computed(() => {
    const text = fa()
    const t = tr()
    return t && marksWanted(unref(level) ?? null, text) ? withMarks(text, t) : text
  })
}
