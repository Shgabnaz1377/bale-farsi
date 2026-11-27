import { computed, ref } from 'vue'
import { account, isReviewer, supabase } from './account.ts'
import { APP } from '@/app.ts'
import { t } from '@/i18n/index.ts'
import type { SpeechItem } from '@/content/speech.ts'

/**
 * Pronunciation feedback (supabase/schema.sql: pron_feedback).
 * - Learners who switch it on get a "sounds wrong?" bar after a clip plays and can report it.
 * - Reviewers (native speakers) and the owner go through clips on /review: ✓, ✗, or the right Finglish.
 * The owner downloads everything from /admin (or scripts/pull-reviews.ts) and the content is fixed from that.
 */

const FLAG_KEY = `${APP.storage}:pron-flag`
const stored = ref<string | null>((() => { try { return localStorage.getItem(FLAG_KEY) } catch { return null } })())

/** Show the "sounds wrong?" bar: on by default for reviewers and the owner, opt-in for learners. */
export const flagOn = computed({
  get: () => !!account.user && (stored.value === null ? isReviewer() : stored.value === '1'),
  set: (on: boolean) => {
    stored.value = on ? '1' : '0'
    try { localStorage.setItem(FLAG_KEY, stored.value) } catch { /* storage blocked */ }
  },
})

/** Every text the app reads aloud, with its Finglish and audio key (loaded on first use). */
let speech: Promise<SpeechItem[]> | null = null
export function allClips(): Promise<SpeechItem[]> {
  speech ??= import('@/content/speech.ts').then((m) => m.allSpeech())
  return speech
}
export async function findClip(text: string, voice?: string): Promise<SpeechItem | null> {
  const all = await allClips()
  return all.find((c) => c.text === text.trim() && (!voice || c.voice === voice)) ?? all.find((c) => c.text === text.trim()) ?? null
}

export interface ClipRef { key: string; fa: string; tr: string; voice: string }

async function upsert(kind: 'report' | 'review', c: ClipRef, verdict: 'ok' | 'wrong', suggested: string, comment: string): Promise<string | null> {
  const sb = supabase()
  if (!sb || !account.user) return t('Sign in first.')
  const { error } = await sb.from('pron_feedback').upsert({
    kind, clip_key: c.key, fa: c.fa, tr: c.tr, voice: c.voice, verdict,
    suggested_tr: suggested.trim().slice(0, 500), comment: comment.trim().slice(0, 1000),
    user_id: account.user.id, status: 'open', updated_at: new Date().toISOString(),
  }, { onConflict: 'kind,clip_key,user_id' })
  if (!error) return null
  if (/too many reports/i.test(error.message)) return t('That is a lot of reports for one day. Thank you! Try again tomorrow.')
  return error.message
}

/** A learner says this clip sounds wrong. */
export const report = (c: ClipRef, suggested: string, comment: string) => upsert('report', c, 'wrong', suggested, comment)
/** A reviewer's verdict on a clip. */
export const review = (c: ClipRef, verdict: 'ok' | 'wrong', suggested = '', comment = '') => upsert('review', c, verdict, suggested, comment)

export interface Feedback {
  id: number; kind: 'report' | 'review'; clip_key: string; fa: string; tr: string; voice: string
  verdict: 'ok' | 'wrong'; suggested_tr: string; comment: string; status: 'open' | 'done' | 'dismissed'
  created_at: string; updated_at: string; who: string; who_role: string
  /** Written by the person looking. */
  mine: boolean
}

export async function feedbackList(): Promise<{ rows: Feedback[]; error: string | null }> {
  const sb = supabase()
  if (!sb) return { rows: [], error: t('Accounts are not available right now.') }
  const { data, error } = await sb.rpc('pron_feedback_list')
  return { rows: (data ?? []) as Feedback[], error: error?.message ?? null }
}

export async function setStatus(ids: number[], status: Feedback['status']): Promise<string | null> {
  const sb = supabase()
  if (!sb || !ids.length) return null
  const { error } = await sb.from('pron_feedback').update({ status, updated_at: new Date().toISOString() }).in('id', ids)
  return error?.message ?? null
}

/**
 * Clips the automatic listen-back check heard as something else. The audio tooling writes
 * public/review/stt-flags.json as { generated, checked, flags: [{ key, fa, tr, voice, where, heard, score }] },
 * score 0–1 (1 = completely different), worst first. The file is optional.
 */
export interface SttFlag { key: string; fa: string; tr: string; voice?: string; where?: string; heard?: string; score?: number }
export async function sttFlags(): Promise<SttFlag[]> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}review/stt-flags.json`, { cache: 'no-cache' })
    if (!r.ok) return []
    const data = await r.json()
    const flags: unknown[] = Array.isArray(data) ? data : Array.isArray(data?.flags) ? data.flags : []
    return flags.filter((f): f is SttFlag => !!f && typeof (f as SttFlag).key === 'string' && typeof (f as SttFlag).fa === 'string')
  } catch {
    return []
  }
}

export interface QueueItem extends ClipRef {
  why: 'reported' | 'stt' | 'sample'
  /** Learner reports or what the recognizer heard, to show the reviewer. */
  notes: string[]
  /** Report rows this review settles. */
  reportIds: number[]
}

/**
 * What a reviewer sees next: learner reports first, then clips the listen-back check flagged, then clips
 * nobody has reviewed yet (in a stable shuffled order, so reviewers spread out over the course).
 */
export async function reviewQueue(fb: Feedback[], limit = 200): Promise<QueueItem[]> {
  const mine = new Set(fb.filter((f) => f.kind === 'review' && f.mine).map((f) => f.clip_key))
  const reviewed = new Set(fb.filter((f) => f.kind === 'review').map((f) => f.clip_key))
  const out = new Map<string, QueueItem>()

  for (const f of fb) {
    if (f.kind !== 'report' || f.status !== 'open' || mine.has(f.clip_key)) continue
    const item = out.get(f.clip_key) ?? { key: f.clip_key, fa: f.fa, tr: f.tr, voice: f.voice, why: 'reported' as const, notes: [], reportIds: [] }
    item.reportIds.push(f.id)
    const note = [f.suggested_tr && `→ ${f.suggested_tr}`, f.comment].filter(Boolean).join(' · ')
    if (note) item.notes.push(note)
    out.set(f.clip_key, item)
  }
  for (const s of await sttFlags()) {
    if (out.has(s.key) || mine.has(s.key)) continue
    out.set(s.key, { key: s.key, fa: s.fa, tr: s.tr, voice: s.voice ?? '', why: 'stt', notes: s.heard ? [t('Heard as: {text}', { text: s.heard }) + (s.score != null ? ` (${Math.round(s.score * 100)}%)` : '')] : [], reportIds: [] })
  }
  const rest = (await allClips()).filter((c) => !out.has(c.key) && !reviewed.has(c.key))
  const salt = [...(account.user?.id ?? 'x')].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
  const hash = (s: string) => [...s].reduce((h, ch) => (h * 33 + ch.charCodeAt(0)) >>> 0, salt)
  rest.sort((a, b) => hash(a.key) - hash(b.key))
  for (const c of rest) {
    if (out.size >= limit) break
    out.set(c.key, { key: c.key, fa: c.text, tr: c.tr ?? '', voice: String(c.voice), why: 'sample', notes: [], reportIds: [] })
  }
  return [...out.values()]
}

/** Everything as JSON, for the content fixes (scripts/pull-reviews.ts reads the same shape). */
export function exportJson(rows: Feedback[]): string {
  return JSON.stringify(rows.map(({ id, kind, clip_key, fa, tr, voice, verdict, suggested_tr, comment, status, updated_at, who_role }) =>
    ({ id, kind, clip_key, fa, tr, voice, verdict, suggested_tr, comment, status, updated_at, who_role })), null, 2)
}
