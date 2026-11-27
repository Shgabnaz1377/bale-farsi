// Pronunciation feedback → one summary per clip, for fixing the content and re-recording.
//
// Usage (either):
//   node scripts/pull-reviews.ts --file pronunciation-feedback-2026-11-27.json   (downloaded on /#/admin)
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/pull-reviews.ts       (straight from the database)
// Writes reviews/pronunciation.json:
//   [{ key, fa, tr, voice, ok, wrong, suggested: [{ tr, n }], comments: [...], reports, open }]
// sorted with the clips most often called wrong first. The service-role key is secret: never commit it,
// never put it in the website; it is read from the environment only.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

interface Row {
  kind: 'report' | 'review'; clip_key: string; fa: string; tr: string; voice: string
  verdict: 'ok' | 'wrong'; suggested_tr: string; comment: string; status: string; who_role?: string
}

async function fromDatabase(): Promise<Row[]> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Give --file <downloaded json>, or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/pron_feedback?select=*&order=updated_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`Supabase said ${res.status}: ${await res.text()}`)
  return (await res.json()) as Row[]
}

const i = process.argv.indexOf('--file')
const rows: Row[] = i > 0 ? JSON.parse(readFileSync(process.argv[i + 1], 'utf8')) : await fromDatabase()

interface Summary {
  key: string; fa: string; tr: string; voice: string; ok: number; wrong: number
  suggested: { tr: string; n: number }[]; comments: string[]; reports: number; open: number
}
const by = new Map<string, Summary>()
for (const r of rows) {
  if (r.status === 'dismissed') continue
  const s = by.get(r.clip_key) ?? { key: r.clip_key, fa: r.fa, tr: r.tr, voice: r.voice, ok: 0, wrong: 0, suggested: [], comments: [], reports: 0, open: 0 }
  if (r.kind === 'report') s.reports++
  else if (r.verdict === 'ok') s.ok++
  else s.wrong++
  if (r.status === 'open' && (r.kind === 'report' || r.verdict === 'wrong')) s.open++
  const sug = r.suggested_tr?.trim()
  if (sug) {
    const hit = s.suggested.find((x) => x.tr === sug)
    if (hit) hit.n++
    else s.suggested.push({ tr: sug, n: 1 })
  }
  if (r.comment?.trim()) s.comments.push(r.comment.trim())
  by.set(r.clip_key, s)
}
const out = [...by.values()]
  .map((s) => ({ ...s, suggested: s.suggested.sort((a, b) => b.n - a.n) }))
  .sort((a, b) => b.wrong + b.reports - (a.wrong + a.reports) || a.ok - b.ok)

mkdirSync('reviews', { recursive: true })
writeFileSync('reviews/pronunciation.json', JSON.stringify(out, null, 2) + '\n')
const bad = out.filter((s) => s.wrong + s.reports > 0)
console.log(`${rows.length} feedback rows → ${out.length} clips; ${bad.length} called wrong at least once; wrote reviews/pronunciation.json`)
for (const s of bad.slice(0, 15)) console.log(`  ${s.fa}  (${s.tr})  ✗${s.wrong + s.reports} ✓${s.ok}${s.suggested[0] ? `  → ${s.suggested[0].tr}` : ''}`)
