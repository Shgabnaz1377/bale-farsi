import { reactive, watch } from 'vue'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { P, freshProgress, parseProgress, type Progress } from './store.ts'
import { mergeProgress, sameLearning } from './merge.ts'
import { isNative } from './platform.ts'

/** Where email links land when sent from inside the phone apps. */
const WEB_URL = 'https://shgabnaz1377.github.io/bale-farsi/'

/**
 * Optional accounts: sign in by email link, and progress syncs to Supabase
 * (table public.progress, one row per learner, protected by row level security).
 * Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY the app works exactly as before, offline-only.
 */
const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const OWNER_KEY = 'bale-farsi:owner'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

export const account = reactive({
  enabled: !!(URL_ && KEY),
  ready: false,
  user: null as null | { id: string; email: string },
  status: 'idle' as SyncStatus,
  lastSync: 0,
  error: '',
})

let sb: SupabaseClient | null = null
let applying = false
let pushTimer: ReturnType<typeof setTimeout> | undefined
let lastPull = 0

const readOwner = () => { try { return localStorage.getItem(OWNER_KEY) } catch { return null } }
const writeOwner = (id: string | null) => {
  try { if (id) localStorage.setItem(OWNER_KEY, id); else localStorage.removeItem(OWNER_KEY) } catch { /* storage blocked */ }
}

/** Replace the in-memory progress without triggering an upload of what we just downloaded. */
function apply(next: Progress) {
  applying = true
  Object.assign(P, next)
  queueMicrotask(() => { applying = false })
}

function snapshot(): Progress {
  return JSON.parse(JSON.stringify(P)) as Progress
}

async function pull() {
  if (!sb || !account.user) return
  const user = account.user
  account.status = 'syncing'
  const { data, error } = await sb.from('progress').select('data').eq('user_id', user.id).maybeSingle()
  if (error) return fail(error.message)
  lastPull = Date.now()

  // Progress on this device that belongs to someone else (or nobody) is handled differently:
  // anonymous progress joins the account; another learner's progress is never mixed in.
  const owner = readOwner()
  let local = snapshot()
  if (owner && owner !== user.id) local = { ...freshProgress(), settings: local.settings }

  const remote = data ? parseProgress(JSON.stringify(data.data)) : null
  const merged = remote ? mergeProgress(local, remote) : local
  apply(merged)
  writeOwner(user.id)
  if (!remote || !sameLearning(merged, remote)) await push()
  else done()
}

async function push() {
  if (!sb || !account.user) return
  clearTimeout(pushTimer)
  account.status = 'syncing'
  const { error } = await sb.from('progress').upsert({ user_id: account.user.id, data: snapshot(), updated_at: new Date().toISOString() })
  if (error) return fail(error.message)
  done()
}

function done() {
  account.status = 'synced'
  account.lastSync = Date.now()
  account.error = ''
}
function fail(message: string) {
  account.status = navigator.onLine === false ? 'offline' : 'error'
  account.error = message
}

function setSession(session: Session | null) {
  const u = session?.user
  account.user = u ? { id: u.id, email: u.email ?? '' } : null
  account.ready = true
  if (u) setTimeout(() => void pull(), 0)
  else account.status = 'idle'
}

export function initAccount() {
  if (!account.enabled || sb) { account.ready = true; return }
  sb = createClient(URL_!, KEY!, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'bale-farsi:auth' },
  })
  // Supabase may call back synchronously; defer work out of the callback.
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') return
    setTimeout(() => setSession(session), 0)
  })
  // After the email link, the URL carries ?code=…; drop it once the session is set.
  if (new URLSearchParams(location.search).has('code')) {
    void sb.auth.getSession().then(() => history.replaceState(null, '', location.pathname + location.hash))
  }

  watch(P, () => {
    if (applying || !account.user) return
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => void push(), 1500)
  }, { deep: true })

  const refresh = () => { if (account.user && Date.now() - lastPull > 30_000) void pull() }
  window.addEventListener('focus', refresh)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh() })
  window.addEventListener('online', refresh)
  window.addEventListener('pagehide', () => { if (account.user && pushTimer) void push() })
}

/** Send a one-time sign-in link. Returns an error message, or null on success. */
export async function sendSignInLink(email: string): Promise<string | null> {
  if (!sb) return 'Accounts are not available right now.'
  const { error } = await sb.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: isNative ? WEB_URL : location.origin + location.pathname, shouldCreateUser: true },
  })
  return error ? friendly(error.message) : null
}

/** Sign in with the code from the email (works inside the phone apps too, where the link opens the browser). */
export async function verifyCode(email: string, code: string): Promise<string | null> {
  if (!sb) return 'Accounts are not available right now.'
  const { error } = await sb.auth.verifyOtp({ email: email.trim(), token: code.replace(/\s/g, ''), type: 'email' })
  if (error) return /expired|invalid/i.test(error.message) ? 'That code is wrong or has expired. Check the email, or send a new one.' : friendly(error.message)
  return null
}

export async function signOut() {
  if (!sb) return
  if (account.user) await push()
  await sb.auth.signOut()
  writeOwner(null)
  // The next person on this device starts clean; this learner's progress is safe in the cloud.
  apply({ ...freshProgress(), settings: { ...P.settings } })
}

/** Delete this learner's saved progress from the cloud (the account itself stays). */
export async function deleteCloudProgress(): Promise<string | null> {
  if (!sb || !account.user) return 'You are not signed in.'
  const { error } = await sb.from('progress').delete().eq('user_id', account.user.id)
  return error ? friendly(error.message) : null
}

export const syncNow = () => pull()

function friendly(msg: string) {
  if (/rate limit|too many/i.test(msg)) return 'Too many sign-in emails were sent. Wait a few minutes and try again.'
  if (/invalid.*email|email.*invalid/i.test(msg)) return 'That email address does not look right. Check it and try again.'
  if (/fetch|network/i.test(msg)) return 'Could not reach the server. Check your connection and try again.'
  return msg
}
