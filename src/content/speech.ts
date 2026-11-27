import { LEVELS } from './course.ts'
import { LETTERS } from './alphabet.ts'
import { VOWELS, VOWEL_PAIRS } from './vowels.ts'
import { HOMOGRAPHS } from './homographs.ts'
import { COGNATES, EXTRA_LETTERS, LOANWORDS, NO_GENDER } from './notArabic.ts'
import { APP } from '../app.ts'
import { dialogueVoices, type VoiceId } from './speakers.ts'
import { NARRATOR, clipKey } from './voices.ts'
import { TRACKS } from './tracks/index.ts'

/** A voice id: the narrator, or a dialogue speaker's voice (see speakers.ts and voices.ts). */
export type Voice = VoiceId

export interface SpeechItem {
  text: string
  voice: Voice
  /** The audio file name: public/audio/<key>.mp3 (see clipKey). */
  key: string
  /** Where it comes from, for the recording page. */
  where: string
  tr?: string
  en?: string
}

/** Short lines Pishi says on screen, in the language being learned. */
export const PISHI_LINES = Object.values(APP.pishi).map((l) => ({ text: l.fa, tr: l.tr, en: '' }))

/**
 * Every text the app can read aloud, once per voice.
 * Words, sentences and readings use the narrator; each dialogue line uses its speaker's voice
 * (the right gender, from speakers.ts), so the same sentence said by a woman and a man are two clips.
 */
export function allSpeech(): SpeechItem[] {
  const out = new Map<string, SpeechItem>()
  const add = (text: string, where: string, extra: Partial<SpeechItem> = {}) => {
    const t = text.trim()
    const voice = extra.voice ?? NARRATOR
    const key = clipKey(t, voice)
    if (!t || out.has(key)) return
    out.set(key, { text: t, where, ...extra, voice, key })
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
  // The homograph game: each vowelled reading and its context sentence.
  if (APP.alphabet) for (const h of HOMOGRAPHS) for (const f of h.forms) {
    add(f.fa, 'Vowels · homographs', { tr: f.tr, en: f.en })
    add(f.context.fa, 'Vowels · homographs', { tr: f.context.tr, en: f.context.en })
  }
  // The "Persian is not Arabic" page.
  if (APP.alphabet) for (const w of [...COGNATES, ...EXTRA_LETTERS.map((l) => l.word), ...NO_GENDER, ...LOANWORDS]) add(w.fa, 'Persian is not Arabic', { tr: w.tr, en: w.en })
  for (const p of PISHI_LINES) add(p.text, 'Pishi', { tr: p.tr, en: p.en })

  const groups = [...LEVELS.map((lv) => ({ label: lv.level, units: lv.units })), ...TRACKS.map((t) => ({ label: t.name, units: t.units }))]
  for (const g of groups) {
    for (const u of g.units) {
      const at = `${g.label} · ${u.title}`
      add(u.fa, at, { tr: u.tr })
      for (const w of u.words) add(w.fa, `${at} · words`, { tr: w.tr, en: w.en })
      for (const s of u.sentences) {
        add(s.fa, `${at} · sentences`, { tr: s.tr, en: s.en })
        s.tiles.forEach((t, i) => add(t, `${at} · sentence tiles`, { tr: s.trTiles[i] }))
      }
      for (const e of u.grammar.examples) add(e.fa, `${at} · grammar`, { tr: e.tr, en: e.en })
      const voices = dialogueVoices(u)
      for (const d of u.dialogue ?? []) {
        add(d.fa, `${at} · dialogue · ${d.who}`, { tr: d.tr, en: d.en, voice: voices.get(d.who) })
      }
      for (const p of u.reading?.paragraphs ?? []) add(p.fa, `${at} · reading`, { tr: p.tr, en: p.en })
    }
  }
  return [...out.values()]
}
