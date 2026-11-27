/**
 * Who says each lesson sentence (sentence exercises, grammar examples, listen-and-pick, build-the-sentence),
 * the way Duolingo's characters do: a cast member, shown as a talking bust, in a voice of their gender.
 * Dialogue lines keep their own speakers (speakers.ts); single words, letters and the vowels lesson stay
 * with the narrator (Pishi).
 *
 * ONE function, used by the app (src/lib/exercises.ts, the unit page) and by scripts/gen-audio.ts through
 * allSpeech(), so the clip that is recorded is the clip that is played.
 *
 * The choice is deterministic: a stable hash of the Persian text picks from the cast, filtered by theme
 * (the same rules as the dialogues):
 *   north → Roya / Saba · south → Fara · Kurdistan → Darya / Ali · Tabriz → Sahel
 *   history and culture → Kourosh · youth, slang, music, cinema → Hasti / Arshia / Aseman / Dariush
 *   regions and dialects → the regional cast · otherwise the general cast.
 * When the sentence itself shows the speaker's gender («من سارا هستم», «من مادرِ … هستم», a man calling
 * himself «پدر» or «آقا»), the speaker has that gender. Only Persian and Finglish are read, never the
 * English: the meaning is translated into Italian at run time, the Persian never changes.
 */
import { APP } from '../app.ts'
import { CAST, castMember, type CastMember } from './cast.ts'
import type { Gender, VoiceId } from './speakers.ts'
import { NARRATOR } from './voices.ts'

type Theme = 'north' | 'south' | 'kurdistan' | 'tabriz' | 'history' | 'youth' | 'regions' | 'general'

const POOLS: Record<Theme, string[]> = {
  north: ['Roya', 'Saba'],
  south: ['Fara'],
  kurdistan: ['Darya', 'Ali'],
  tabriz: ['Sahel'],
  history: ['Kourosh'],
  youth: ['Hasti', 'Arshia', 'Aseman', 'Dariush'],
  regions: ['Roya', 'Saba', 'Fara', 'Darya', 'Ali', 'Sahel'],
  general: ['Sara', 'Artemis', 'Khorshid', 'Leila', 'Venus', 'Babak', 'Sasan', 'Arash', 'Aria'],
}

/** Units whose whole theme picks the speaker (the Culture track is all history and culture). */
const UNIT_THEME: Record<string, Theme> = {
  'a2-celebrations': 'history',
  'b1-places-history': 'history',
  'b1-persian-food-culture': 'history',
  'b2-history': 'history',
  'b2-literature': 'history',
  'b1-cinema-music': 'youth',
  'b1-tech-media': 'youth',
  'b2-youth-slang': 'youth',
  'b2-cinema': 'youth',
  'b2-regions-dialects': 'regions',
}
const themeOfUnit = (unitId: string): Theme => UNIT_THEME[unitId] ?? (unitId.startsWith('culture-') ? 'history' : 'general')

/**
 * Places and things in the sentence itself win over the unit's theme. Whole words only, with the endings
 * they can take (رشتی, but not رشته "field of study" or خورشت "stew").
 */
const words = (w: string) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${w})(?:ی|ها|\\u200cها|\\u200cی)?(?![\\p{L}\\p{M}])`, 'u')
const TEXT_THEMES: [Theme, RegExp][] = [
  ['north', words('شمال|گیلان|گیلکی|رشت|مازندران|مازنی|خزر|دریای خزر|لاهیجان|شالیزار')],
  ['south', words('بندرعباس|بندری|هرمز|هرمزگان|خلیج فارس|قشم|کیش|بوشهر')],
  ['kurdistan', words('کردستان|سنندج|کرمانشاه|مریوان')],
  ['tabriz', words('تبریز|آذربایجان|آذری|اردبیل')],
  ['history', words('تخت جمشید|هخامنشی|هخامنشیان|پاسارگاد|شاهنامه|فردوسی')],
]

// The speaker names themselves: «من سارا هستم», «اسم من علی است» (read from the Finglish, where names are capitalised).
const NAME_TR = /(?:^|[\s,.!?])(?:man|esm-e man|esmam)\s+([A-ZÂ][\p{L}']+)(?:\s+(?:hastam|ast|e)\b|am\b|\.|!|$)/u
// The couples track's learners were Tom and Sofia; they are now Aria and Venus.
const OTHER_NAMES: Record<string, string> = { Tom: 'Aria', Sofiyâ: 'Venus' }
// Self-descriptions that carry a gender: «من مادرِ سارا هستم», «من آقای کریمی هستم».
// «من» + the word (with or without its ezâfe vowel or ZWNJ), and the sentence ends in «I am» (هستم / ‌ام).
const SELF = (words: string) => new RegExp(`(?:^|\\s)من\\s+(?:${words})(?:[\\u064B-\\u065F\\u200c\\s]|$).*(?:هستم|\\u200cام)[.!؟?]?$`)
const FEMALE_FA = SELF('مادر|مامان|خواهر|دختر|مادربزرگ|خانم')
const MALE_FA = SELF('پدر|بابا|برادر|پسر|پدربزرگ|آقا|آقای')

/** The gender the sentence itself gives its speaker, or the cast member it names as the speaker. */
export function speakerCue(fa: string, tr: string): { gender?: Gender; name?: string } {
  const m = tr.match(NAME_TR)
  if (m) {
    const c = CAST.find((x) => x.tr === m[1])
    if (c) return { gender: c.gender, name: c.name }
    const other = OTHER_NAMES[m[1]] && castMember(OTHER_NAMES[m[1]])
    if (other) return { gender: other.gender, name: other.name }
  }
  if (FEMALE_FA.test(fa)) return { gender: 'f' }
  if (MALE_FA.test(fa)) return { gender: 'm' }
  return {}
}

/** FNV-1a: the same text always gives the same number, on every machine. */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (const ch of s) {
    h ^= ch.codePointAt(0)!
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

/**
 * The cast member who says a lesson sentence, or undefined when the narrator reads it
 * (single words, and the Italian course Bego Ciao, which has no cast).
 */
export function sentenceSpeaker(p: { fa: string; tr: string }, unitId: string): CastMember | undefined {
  if (APP.id !== 'persianmeow') return undefined
  const fa = p.fa.trim()
  if (!fa.includes(' ')) return undefined
  const cue = speakerCue(fa, p.tr)
  if (cue.name) return castMember(cue.name)
  const theme = TEXT_THEMES.find(([, re]) => re.test(fa))?.[0] ?? themeOfUnit(unitId)
  const byGender = (names: string[]) => names.map((n) => castMember(n)!).filter((c) => !cue.gender || c.gender === cue.gender)
  let pool = byGender(POOLS[theme])
  if (!pool.length) pool = byGender(POOLS.general)
  return pool[hash(fa) % pool.length]
}

/**
 * The voice of a lesson sentence: the speaker's gender. Men keep the main voice (Farid, the narrator,
 * so their clips are the existing audioKey(text) ones); women get the female voice ('f', clip key 'f|text').
 */
export function sentenceVoice(p: { fa: string; tr: string }, unitId: string): VoiceId {
  const c = sentenceSpeaker(p, unitId)
  return c ? c.gender : NARRATOR
}
