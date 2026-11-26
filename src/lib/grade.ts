import { lang } from '@/i18n/index.ts'

/** Normalise a typed Italian answer: case, accents, punctuation and articles (il, lo, la, l', un, una…). */
export function normIt(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b(l|un|dell|all|dall|nell|sull)'/g, ' ')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\b(il|lo|la|i|gli|le|un|uno|una)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalise a typed Persian answer: Arabic letter variants, diacritics, ZWNJ, tatweel, punctuation and را. */
export function normFa(s: string): string {
  return String(s ?? '')
    .replace(/ي/g, 'ی').replace(/ى/g, 'ی').replace(/ك/g, 'ک').replace(/ة/g, 'ه').replace(/[أإ]/g, 'ا')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[\u200C\u200D]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/(^|\s)را(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalise a typed answer in the learner's language. */
export const normAnswer = (s: string) => (lang() === 'it' ? normIt(s) : lang() === 'fa' ? normFa(s) : normEn(s))

/** Normalise a typed English answer: case, accents, punctuation, articles and contractions. */
export function normEn(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/\(.*?\)/g, ' ')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\bthey're\b/g, 'they are')
    .replace(/\bwhat's\b/g, 'what is')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bdidn't\b/g, 'did not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bisn't\b/g, 'is not')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\b(the|a|an|to)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Edit distance where swapping two neighbouring letters counts as one typo (optimal string alignment). */
export function lev(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array<number>(n).fill(0)])
  for (let j = 1; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[m][n]
}

export interface TypedResult {
  ok: boolean
  /** Set when the answer was accepted with a typo. */
  typo?: string
}

/** Grade a typed English answer against every accepted form. */
export function gradeTyped(answer: string, accepted: string[]): TypedResult {
  const a = normAnswer(answer)
  if (!a) return { ok: false }
  const forms = accepted.map(normAnswer).filter(Boolean)
  if (forms.includes(a)) return { ok: true }
  const allowed = (s: string) => (s.length >= 12 ? 2 : s.length >= 4 ? 1 : 0)
  const close = forms.find((f) => lev(f, a) <= allowed(f))
  if (close !== undefined) return { ok: true, typo: accepted[forms.indexOf(close)] }
  return { ok: false }
}

/** Accepted English answers for a word or sentence: its meaning, alternatives, and slash/parenthesis variants. */
export function acceptedForms(en: string, alt: string[] = []): string[] {
  const out = new Set<string>([en, ...alt])
  for (const f of [en, ...alt]) {
    if (f.includes('/')) f.split('/').forEach((p) => out.add(p.trim()))
    const noParens = f.replace(/\(.*?\)/g, '').trim()
    if (noParens) out.add(noParens)
  }
  return [...out]
}
