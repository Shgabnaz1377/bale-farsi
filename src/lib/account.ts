import { reactive, watch } from 'vue'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { P, freshProgress, parseProgress, type Progress } from './store.ts'
import { mergeProgress, sameLearning } from './merge.ts'
import { isNative } from './platform.ts'
import { APP } from '@/app.ts'
import { t } from '@/i18n/index.ts'

/** Where email links land when sent from inside the phone apps. */
const WEB_URL = APP.webUrl

/**
 * Accounts: sign up with name, email and password; progress syncs to Supabase
 * (table public.progress, one row per learner, protected by row level security; see supabase/schema.sql).
 * Each account has a profile (name, role, blocked, last seen). The owner (role 'admin') sees every learner
 * on the admin page. Guests may finish GUEST_LESSONS lessons, then need an account to go on (needsAccount).
 * Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY the app works exactly as before: offline-only, no gate.
 */
const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const OWNER_KEY = `${APP.storage}:owner`

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
export type Role = 'learner' | 'reviewer' | 'admin'
export interface Profile { name: string; role: Role; blocked: boolean }

export const account = reactive({
  enabled: !!(URL_ && KEY),
  ready: false,
  user: null as null | { id: string; email: string },
  profile: null as null | Profile,
  /** The learner came back from a "forgot password" email and must choose a new password. */
  recovering: false,
  status: 'idle' as SyncStatus,
  lastSync: 0,
  error: '',
})

let sb: SupabaseClient | null = null
let applying = false
let pushTimer: ReturnType<typeof setTimeout> | undefined
let lastPull = 0
let lastSeenAt = 0
const readyWaiters: (() => void)[] = []

function markReady() {
  account.ready = true
  readyWaiters.splice(0).forEach((r) => r())
}

/** Resolves once we know whether someone is signed in (at once when accounts are off). */
export function accountReady(): Promise<void> {
  if (account.ready || !account.enabled) return Promise.resolve()
  return new Promise((resolve) => readyWaiters.push(resolve))
}

export const isAdmin = () => account.profile?.role === 'admin' && !account.profile.blocked
/** Reviewers (native speakers) and the owner can review pronunciation. */
export const isReviewer = () => (account.profile?.role === 'reviewer' || account.profile?.role === 'admin') && !account.profile.blocked

/** The Supabase client, once accounts are on (for features built on top, like pronunciation feedback). */
export const supabase = () => sb

/** Lessons a guest may finish before signing up. */
export const GUEST_LESSONS = 1

/** A guest who has used up the free lesson(s) must sign up before the next one. */
export const needsAccount = () => account.enabled && !account.user && Object.keys(P.done).length >= GUEST_LESSONS

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

/** Read this learner's profile; a blocked learner is signed out. Returns false when blocked. */
async function loadProfile(): Promise<boolean> {
  if (!sb || !account.user) return false
  const { data } = await sb.from('profiles').select('name, role, blocked').eq('id', account.user.id).maybeSingle()
  account.profile = data ? { name: data.name ?? '', role: data.role === 'admin' || data.role === 'reviewer' ? data.role : 'learner', blocked: !!data.blocked } : null
  if (account.profile?.blocked) {
    await sb.auth.signOut()
    writeOwner(null)
    account.error = t('This account has been blocked. Contact the course owner if you think this is a mistake.')
    return false
  }
  void touch()
  return true
}

/** Record when the learner was last here (at most every 5 minutes), for the owner's activity view. */
async function touch() {
  if (!sb || !account.user || Date.now() - lastSeenAt < 5 * 60_000) return
  lastSeenAt = Date.now()
  await sb.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', account.user.id)
}

const loadAndPull = () => void loadProfile().then((ok) => { if (ok) void pull() })

function setSession(session: Session | null) {
  const u = session?.user
  account.user = u ? { id: u.id, email: u.email ?? '' } : null
  if (!u) account.profile = null
  markReady()
  if (u) setTimeout(loadAndPull, 0)
  else account.status = 'idle'
}

export function initAccount() {
  if (!account.enabled || sb) { markReady(); return }
  sb = createClient(URL_!, KEY!, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: `${APP.storage}:auth` },
  })
  // Supabase may call back synchronously; defer work out of the callback.
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') return
    if (event === 'PASSWORD_RECOVERY') account.recovering = true
    setTimeout(() => setSession(session), 0)
  })
  // After an email link (confirm sign-up, reset password) the URL carries ?code=…; drop it once the session is set.
  if (new URLSearchParams(location.search).has('code')) {
    void sb.auth.getSession().then(() => history.replaceState(null, '', location.pathname + location.hash))
  }

  watch(P, () => {
    if (applying || !account.user) return
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => void push(), 1500)
  }, { deep: true })

  const refresh = () => { if (account.user && Date.now() - lastPull > 30_000) loadAndPull() }
  window.addEventListener('focus', refresh)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh() })
  window.addEventListener('online', refresh)
  window.addEventListener('pagehide', () => { if (account.user && pushTimer) void push() })
}

const redirect = () => (isNative ? WEB_URL : location.origin + location.pathname)

/** Create an account. Returns an error message, 'confirm' when the email must be confirmed first, or null when signed in. */
export async function signUp(name: string, email: string, password: string): Promise<string | null> {
  if (!sb) return t('Accounts are not available right now.')
  account.error = ''
  const { data, error } = await sb.auth.signUp({
    email: email.trim(), password,
    options: { data: { name: name.trim().slice(0, 80) }, emailRedirectTo: redirect() },
  })
  if (error) return friendly(error.message)
  return data.session ? null : 'confirm'
}

/** Sign in with email and password. Returns an error message, or null on success. */
export async function signIn(email: string, password: string): Promise<string | null> {
  if (!sb) return t('Accounts are not available right now.')
  account.error = ''
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
  return error ? friendly(error.message) : null
}

/** Email a link to choose a new password. */
export async function sendPasswordReset(email: string): Promise<string | null> {
  if (!sb) return t('Accounts are not available right now.')
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect() + '#/account' })
  return error ? friendly(error.message) : null
}

/** Set a new password (after the reset email, or from the account page). */
export async function setPassword(password: string): Promise<string | null> {
  if (!sb) return t('Accounts are not available right now.')
  const { error } = await sb.auth.updateUser({ password })
  if (error) return friendly(error.message)
  account.recovering = false
  return null
}

/** Change the name the course owner sees. */
export async function setName(name: string): Promise<string | null> {
  if (!sb || !account.user) return t('You are not signed in.')
  const clean = name.trim().slice(0, 80)
  const { error } = await sb.from('profiles').update({ name: clean }).eq('id', account.user.id)
  if (error) return friendly(error.message)
  if (account.profile) account.profile.name = clean
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

/** Delete this account, its profile and its saved progress, then start this device clean. */
export async function deleteMyAccount(): Promise<string | null> {
  if (!sb || !account.user) return t('You are not signed in.')
  const { error } = await sb.rpc('delete_my_account')
  if (error) return friendly(error.message)
  await sb.auth.signOut()
  writeOwner(null)
  apply({ ...freshProgress(), settings: { ...P.settings } })
  return null
}

export const syncNow = () => pull()

/** One learner as the owner sees them (supabase/schema.sql: admin_users). */
export interface AdminUser {
  id: string; email: string; name: string; role: Role; blocked: boolean
  created_at: string; last_seen: string | null; xp: number; streak: number; lessons: number
  /** XP per day number (days since 1970, local time of the learner). */
  days: Record<string, number>
}

export async function adminUsers(): Promise<{ users: AdminUser[]; error: string | null }> {
  if (!sb) return { users: [], error: t('Accounts are not available right now.') }
  const { data, error } = await sb.rpc('admin_users')
  return { users: (data ?? []) as AdminUser[], error: error ? friendly(error.message) : null }
}
async function adminCall(fn: string, args: Record<string, unknown>): Promise<string | null> {
  if (!sb) return t('Accounts are not available right now.')
  const { error } = await sb.rpc(fn, args)
  return error ? friendly(error.message) : null
}
export const adminSetBlocked = (id: string, value: boolean) => adminCall('admin_set_blocked', { target: id, value })
export const adminSetRole = (id: string, value: Role) => adminCall('admin_set_role', { target: id, value })
export const adminDeleteUser = (id: string) => adminCall('admin_delete_user', { target: id })

function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return t('Wrong email or password.')
  if (/email not confirmed/i.test(msg)) return t('Confirm your email first: open the link we sent you.')
  if (/already registered|already exists/i.test(msg)) return t('There is already an account with this email. Sign in instead.')
  if (/password/i.test(msg) && /least|short|characters|weak/i.test(msg)) return t('Choose a longer password: at least 8 characters.')
  if (/rate limit|too many/i.test(msg)) return t('Too many emails were sent. Wait a few minutes and try again.')
  if (/invalid.*email|email.*invalid/i.test(msg)) return t('That email address does not look right. Check it and try again.')
  if (/fetch|network/i.test(msg)) return t('Could not reach the server. Check your connection and try again.')
  if (/not allowed/i.test(msg)) return t('Only the course owner can do this.')
  if (/too many reports/i.test(msg)) return t('That is a lot of reports for one day. Thank you! Try again tomorrow.')
  return msg
}
