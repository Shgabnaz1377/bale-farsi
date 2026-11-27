import type { Level } from '@/content/types.ts'
import type { DictEntry } from '@/content/dictionary/entry.ts'
import type { WordRef } from '@/content/course.ts'

/**
 * Search for the Words page: course words and the dictionary together.
 * A query can be English, Finglish with or without accents (ketab = ketâb), or Persian
 * (vowel marks, ZWNJ, spaces and Arabic letter forms are ignored: کتابها = کتاب\u200cها).
 */

/** Latin text: lowercase, accents removed (â → a), apostrophes dropped, hyphens as spaces. */
export const foldLatin = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/['’`ʼ]/g, '').replace(/[-‐]/g, ' ').replace(/\s+/g, ' ').trim()

/** Persian text: Arabic forms to Persian, vowel marks, tatweel, ZWNJ and spaces removed. */
export const foldFa = (s: string) =>
  s.normalize('NFC')
    .replace(/ي|ى/g, 'ی').replace(/ك/g, 'ک').replace(/ة/g, 'ه').replace(/[أإ]/g, 'ا').replace(/ۀ/g, 'ه')
    .replace(/[\u064b-\u065f\u0670\u0640\u200c\u200d\s؟?!.،,:؛«»]/g, '')

export const isPersianQuery = (s: string) => /[؀-ۿ]/.test(s)

export interface SearchRow {
  key: string
  fa: string
  tr: string
  en: string
  alt?: string[]
  /** Course words only. */
  level?: Level
  /** Course words only: the spaced-review card key. */
  cardKey?: string
  pos?: DictEntry['pos']
  stem?: DictEntry['stem']
  ex?: DictEntry['ex']
  /** In the dictionary but not in the course. */
  dict: boolean
}

export interface Indexed {
  row: SearchRow
  fa: string
  tr: string
  /** Meanings, folded, plus the verb without "to ". */
  en: string[]
  /**
   * Every field folded for a Latin-letter query and for a Persian-letter query. In PersianMeow the word is
   * Persian and the meaning English; in Bego Ciao the word is Italian and its pronunciation and meaning are
   * Persian. Comparing each query with all fields in its own script makes search work both ways in both apps.
   */
  latin: string[]
  persian: string[]
}

const enForms = (en: string[]) =>
  en.flatMap((m) => {
    const f = foldLatin(m)
    return f.startsWith('to ') ? [f, f.slice(3)] : [f]
  })

function index(row: SearchRow): Indexed {
  const meanings = [row.en, ...(row.alt ?? [])]
  const fa = foldFa(row.fa)
  const tr = foldLatin(row.tr)
  const en = enForms(meanings)
  const latin = [...en, tr, foldLatin(row.fa)].filter((f) => f && !isPersianQuery(f))
  const persian = [fa, foldFa(row.tr), ...meanings.map(foldFa)].filter((f) => f && isPersianQuery(f))
  return { row, fa, tr, en, latin, persian }
}

/**
 * Join course words and the dictionary. A dictionary entry with the same Persian and an overlapping
 * meaning as a course word is folded into it (the course row keeps its level and gains the example).
 */
export function buildIndex(course: WordRef[], dictionary: DictEntry[]): Indexed[] {
  const rows: Indexed[] = course.map((r) =>
    index({ key: r.key, fa: r.word.fa, tr: r.word.tr, en: r.word.en, alt: r.word.alt, level: r.unit.level, cardKey: r.key, dict: false }),
  )
  const byFa = new Map<string, Indexed[]>()
  for (const r of rows) byFa.set(r.fa, [...(byFa.get(r.fa) ?? []), r])
  dictionary.forEach((e, i) => {
    const d = index({ key: `dict:${i}`, fa: e.fa, tr: e.tr, en: e.en, alt: e.alt, pos: e.pos, stem: e.stem, ex: e.ex, dict: true })
    const same = (byFa.get(d.fa) ?? []).filter((c) => c.en.some((m) => d.en.includes(m)))
    if (same.length) {
      for (const c of same) {
        c.row.ex ??= e.ex
        c.row.stem ??= e.stem
        c.row.pos ??= e.pos
      }
      return
    }
    rows.push(d)
  })
  return rows
}

/** How well a field matches: 0 exact, 1 starts with, 2 a word starts with, 3 contains; null if not at all. */
function score(field: string, q: string): number | null {
  if (!field || !q) return null
  if (field === q) return 0
  if (field.startsWith(q)) return 1
  const at = field.indexOf(q)
  if (at < 0) return null
  return /[\s,;(/]/.test(field[at - 1]) ? 2 : 3
}

const best = (scores: (number | null)[]) => scores.reduce<number | null>((b, s) => (s !== null && (b === null || s < b) ? s : b), null)

/**
 * Rows matching the query, best matches first (exact, then prefix, then inside a word);
 * course words before dictionary words, then in the order given (most common first).
 */
export function searchRows(rows: Indexed[], query: string, keep: (r: SearchRow) => boolean = () => true): SearchRow[] {
  const q = query.trim()
  if (!q) return rows.filter((r) => keep(r.row)).map((r) => r.row)
  const fa = isPersianQuery(q)
  const qf = fa ? foldFa(q) : foldLatin(q)
  if (!qf) return []
  const hits: { row: SearchRow; s: number; i: number }[] = []
  rows.forEach((r, i) => {
    if (!keep(r.row)) return
    const s = best((fa ? r.persian : r.latin).map((f) => score(f, qf)))
    if (s !== null) hits.push({ row: r.row, s, i })
  })
  hits.sort((a, b) => a.s - b.s || Number(a.row.dict) - Number(b.row.dict) || a.i - b.i)
  return hits.map((h) => h.row)
}

/** Google Translate for a word the dictionary does not have (Persian ↔ English), opened in a new tab. */
export function translateUrl(query: string): string {
  const q = query.trim()
  const [sl, tl] = isPersianQuery(q) ? ['fa', 'en'] : ['en', 'fa']
  return `https://translate.google.com/?sl=${sl}&tl=${tl}&text=${encodeURIComponent(q)}&op=translate`
}
