import { LEVELS } from './course.ts'
import { LETTERS } from './alphabet.ts'
import { VOWELS, VOWEL_PAIRS } from './vowels.ts'
import { APP } from '../app.ts'
import { DICTIONARY } from './dictionary/index.ts'

/**
 * The dictionary (src/content/dictionary/) has no recorded clips yet. Turn this on when they are to be
 * generated (node scripts/gen-audio.ts --dry first to count them); until then SpeakButton reads
 * dictionary words with the device's Persian voice, when there is one.
 */
export const INCLUDE_DICTIONARY_AUDIO = false

/** The app's main voice, and a second one for the other speaker in dialogues. */
export type Voice = 'main' | 'second'

export interface SpeechItem {
  text: string
  voice: Voice
  /** Where it comes from, for the recording page. */
  where: string
  tr?: string
  en?: string
}

/** Short lines Pishi says on screen, in the language being learned. */
export const PISHI_LINES = Object.values(APP.pishi).map((l) => ({ text: l.fa, tr: l.tr, en: '' }))

/**
 * Every Persian text the app can read aloud, once each.
 * Dialogue speakers alternate between the main and the second voice so conversations sound like two people.
 */
export function allSpeech(): SpeechItem[] {
  const out = new Map<string, SpeechItem>()
  const add = (text: string, where: string, extra: Partial<SpeechItem> = {}) => {
    const t = text.trim()
    if (!t || out.has(t)) return
    out.set(t, { text: t, voice: 'main', where, ...extra })
  }

  if (APP.alphabet) for (const l of LETTERS) {
    add(l.fa, 'Alphabet', { tr: l.name })
    add(l.example.fa, 'Alphabet', { tr: l.example.tr, en: l.example.en })
  }
  if (APP.alphabet) for (const v of VOWELS) {
    if (!v.long) add(v.fa, 'Vowels', { tr: `b${v.tr}` })
    for (const e of v.examples) add(e.fa, 'Vowels', { tr: e.tr, en: e.en })
  }
  if (APP.alphabet) for (const pair of VOWEL_PAIRS) for (const e of pair) add(e.fa, 'Vowels', { tr: e.tr, en: e.en })
  for (const p of PISHI_LINES) add(p.text, 'Pishi', { tr: p.tr, en: p.en })

  for (const lv of LEVELS) {
    for (const u of lv.units) {
      const at = `${lv.level} · ${u.title}`
      add(u.fa, at, { tr: u.tr })
      for (const w of u.words) add(w.fa, `${at} · words`, { tr: w.tr, en: w.en })
      for (const s of u.sentences) {
        add(s.fa, `${at} · sentences`, { tr: s.tr, en: s.en })
        s.tiles.forEach((t, i) => add(t, `${at} · sentence tiles`, { tr: s.trTiles[i] }))
      }
      for (const e of u.grammar.examples) add(e.fa, `${at} · grammar`, { tr: e.tr, en: e.en })
      const speakers = [...new Set((u.dialogue ?? []).map((d) => d.who))]
      for (const d of u.dialogue ?? []) {
        add(d.fa, `${at} · dialogue`, { tr: d.tr, en: d.en, voice: speakers.indexOf(d.who) % 2 ? 'second' : 'main' })
      }
      for (const p of u.reading?.paragraphs ?? []) add(p.fa, `${at} · reading`, { tr: p.tr, en: p.en })
    }
  }
  if (INCLUDE_DICTIONARY_AUDIO && APP.id === 'persianmeow') {
    for (const e of DICTIONARY) {
      add(e.fa, 'Dictionary', { tr: e.tr, en: e.en })
      if (e.ex) add(e.ex.fa, 'Dictionary · examples', { tr: e.ex.tr, en: e.ex.en })
    }
  }
  return [...out.values()]
}
