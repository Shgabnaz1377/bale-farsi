/**
 * The PersianMeow dictionary: common Persian words for everyone, not tied to a course level.
 *
 * Each topic file (core.ts, verbs.ts, …) exports one block of text, one entry per line, most common first:
 *
 *   fa | tr | en | pos | stem | example fa | example tr | example en
 *
 * - fa: standard written Persian, ZWNJ written as \u200c (می\u200cروم, کتاب\u200cها).
 * - tr: Finglish following the rules in ../types.ts (â, kh, gh, sh, ch, zh, ', ezâfe -e / -ye).
 *   It must line up letter by letter with fa: vocalize(fa, tr) in src/lib/vocalize.ts must not return null.
 * - en: the English meaning. Extra accepted meanings follow after "; " (they become `alt`).
 * - pos: n, v, adj, adv, pron, prep, conj, num, det, int, phr (optional).
 * - stem: verbs only, the present stem as "fa/tr", e.g. رو/rav (optional).
 * - example: a short sentence in fa, tr and en (all three or none).
 * Empty fields are allowed ("آب | âb | water | n"); lines starting with # are comments.
 */

export type Pos = 'n' | 'v' | 'adj' | 'adv' | 'pron' | 'prep' | 'conj' | 'num' | 'det' | 'int' | 'phr'
export const POS: readonly Pos[] = ['n', 'v', 'adj', 'adv', 'pron', 'prep', 'conj', 'num', 'det', 'int', 'phr']

export interface DictText {
  fa: string
  tr: string
  en: string
}

export interface DictEntry extends DictText {
  /** Other English meanings, also found by search. */
  alt?: string[]
  pos?: Pos
  /** Present stem of a verb (رو / rav for رفتن). */
  stem?: { fa: string; tr: string }
  /** An example sentence. */
  ex?: DictText
}

export interface ParseResult {
  entries: DictEntry[]
  /** Lines that could not be read, as "file:line: problem". */
  errors: string[]
}

/** Read one topic file. Malformed lines are skipped and reported in errors (tests require none). */
export function parseDictionary(src: string, file = 'dictionary'): ParseResult {
  const entries: DictEntry[] = []
  const errors: string[] = []
  src.split('\n').forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('#')) return
    const where = `${file}:${i + 1}`
    const f = line.split('|').map((s) => s.trim())
    const [fa, tr, en, pos, stem, exFa, exTr, exEn] = f
    if (f.length > 8) return void errors.push(`${where}: too many fields`)
    if (!fa || !tr || !en) return void errors.push(`${where}: needs fa | tr | en`)
    const [first, ...alt] = en.split(';').map((s) => s.trim()).filter(Boolean)
    const e: DictEntry = { fa, tr, en: first }
    if (alt.length) e.alt = alt
    if (pos) {
      if (!(POS as readonly string[]).includes(pos)) errors.push(`${where}: unknown part of speech "${pos}"`)
      else e.pos = pos as Pos
    }
    if (stem) {
      const m = stem.match(/^(.+?)\s*\/\s*(.+)$/)
      if (!m) errors.push(`${where}: stem must be "fa/tr"`)
      else e.stem = { fa: m[1], tr: m[2] }
    }
    if (exFa || exTr || exEn) {
      if (!exFa || !exTr || !exEn) errors.push(`${where}: an example needs fa, tr and en`)
      else e.ex = { fa: exFa, tr: exTr, en: exEn }
    }
    entries.push(e)
  })
  return { entries, errors }
}
