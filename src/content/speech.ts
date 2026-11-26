import { LEVELS } from './course.ts'
import { LETTERS } from './alphabet.ts'

export type Voice = 'female' | 'male'

export interface SpeechItem {
  text: string
  voice: Voice
  /** Where it comes from, for the recording page. */
  where: string
  tr?: string
  en?: string
}

/** Short lines Pishi says on screen. */
export const PISHI_LINES = [
  { text: 'سلام! من پیشی‌ام', tr: 'salâm! man Pishi-am.', en: 'Hello! I am Pishi.' },
  { text: 'آفرین!', tr: 'âfarin!', en: 'Well done!' },
  { text: 'مرور کنیم؟', tr: 'morur konim?', en: 'Shall we review?' },
  { text: 'دلم تنگ شد!', tr: 'delam tang shod!', en: 'I missed you!' },
  { text: 'بزن بریم!', tr: 'bezan berim!', en: "Let's go!" },
  { text: 'ای وای!', tr: 'ey vây!', en: 'Oh no!' },
  { text: 'اشکالی ندارد', tr: 'eshkâli nadârad', en: 'No problem' },
  { text: 'پیدا نشد', tr: 'peydâ nashod', en: 'Not found' },
]

/**
 * Every Persian text the app can read aloud, once each.
 * Dialogue speakers alternate between the female and male voice so conversations sound like two people.
 */
export function allSpeech(): SpeechItem[] {
  const out = new Map<string, SpeechItem>()
  const add = (text: string, where: string, extra: Partial<SpeechItem> = {}) => {
    const t = text.trim()
    if (!t || out.has(t)) return
    out.set(t, { text: t, voice: 'female', where, ...extra })
  }

  for (const l of LETTERS) {
    add(l.fa, 'Alphabet', { tr: l.name })
    add(l.example.fa, 'Alphabet', { tr: l.example.tr, en: l.example.en })
  }
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
        add(d.fa, `${at} · dialogue`, { tr: d.tr, en: d.en, voice: speakers.indexOf(d.who) % 2 ? 'male' : 'female' })
      }
      for (const p of u.reading?.paragraphs ?? []) add(p.fa, `${at} · reading`, { tr: p.tr, en: p.en })
    }
  }
  return [...out.values()]
}
