/**
 * The dictionary: the common Persian words, open to every learner whatever their level.
 * It is big, so the Words page loads this module lazily (import('@/content/dictionary/index.ts')),
 * which keeps it out of the main bundle. Topic files are listed here most general first.
 *
 * Not yet spoken by recorded audio: src/content/speech.ts leaves these entries out until their clips
 * are generated (see INCLUDE_DICTIONARY_AUDIO there). Without a clip, SpeakButton uses the device voice.
 */
import { parseDictionary, type DictEntry } from './entry.ts'
import { dictKey } from './rules.ts'
import core from './core.ts'
import phrases from './phrases.ts'
import verbs from './verbs.ts'
import describe from './describe.ts'
import ideas from './ideas.ts'
import people from './people.ts'
import home from './home.ts'
import world from './world.ts'
import society from './society.ts'

export type { DictEntry } from './entry.ts'

export const DICTIONARY_FILES: Record<string, string> = { core, phrases, verbs, describe, ideas, people, home, world, society }

const parsed = Object.entries(DICTIONARY_FILES).map(([name, src]) => parseDictionary(src, `${name}.ts`))

/** Lines that could not be read (tests require none). */
export const DICTIONARY_ERRORS: string[] = parsed.flatMap((p) => p.errors)

/** Every entry as written, before removing repeats across topic files. */
export const DICTIONARY_ALL: DictEntry[] = parsed.flatMap((p) => p.entries)

/** The dictionary, each Persian + English pair once. */
export const DICTIONARY: DictEntry[] = (() => {
  const seen = new Set<string>()
  return DICTIONARY_ALL.filter((e) => {
    const k = dictKey(e)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
})()
