import { SPOKEN_A1 } from './a1.ts'
import { SPOKEN_A2 } from './a2.ts'
import { SPOKEN_B1 } from './b1.ts'
import { SPOKEN_B2 } from './b2.ts'
import { SPOKEN_TRACKS } from './tracks.ts'
import { SPOKEN_COUPLES } from './couples.ts'

/** Pishi's own lines, said the everyday way. */
const SPOKEN_OTHER: Record<string, string> = {
  'اشکالی ندارد': 'اشکالی نداره',
}

/**
 * Displayed Persian → how the recorded voice says it (everyday Tehran Persian).
 * Used only when generating audio (scripts/gen-audio.ts); the app always shows the written text.
 */
export const SPOKEN: Record<string, string> = { ...SPOKEN_OTHER, ...SPOKEN_A1, ...SPOKEN_A2, ...SPOKEN_B1, ...SPOKEN_B2, ...SPOKEN_TRACKS, ...SPOKEN_COUPLES }
