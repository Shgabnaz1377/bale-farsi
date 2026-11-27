<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { account, isAdmin, adminDeleteUser, adminSetBlocked, adminSetRole, adminUsers, type AdminUser } from '@/lib/account.ts'
import { dayNumber } from '@/lib/srs.ts'
import { t } from '@/i18n/index.ts'
import AppIcon from '@/components/AppIcon.vue'
import { exportJson, feedbackList, setStatus, type Feedback } from '@/lib/pron.ts'

/**
 * The owner's page: every learner, who is active, who stopped coming, and block / admin / delete.
 * The router only lets admins in; the server (supabase/schema.sql) refuses everyone else anyway.
 */
const users = ref<AdminUser[]>([])
const error = ref('')
const loading = ref(true)
async function load() {
  loading.value = true
  const r = await adminUsers()
  users.value = r.users
  error.value = r.error ?? ''
  loading.value = false
}
onMounted(load)

// Pronunciation feedback: open learner reports, clips reviewers marked wrong, and a download for the content fixes.
const fb = ref<Feedback[]>([])
async function loadFb() { fb.value = (await feedbackList()).rows }
onMounted(loadFb)
const openReports = computed(() => fb.value.filter((f) => f.kind === 'report' && f.status === 'open'))
const wrongClips = computed(() => fb.value.filter((f) => f.kind === 'review' && f.verdict === 'wrong' && f.status === 'open'))
const reviewedCount = computed(() => new Set(fb.value.filter((f) => f.kind === 'review').map((f) => f.clip_key)).size)
async function markFixed(f: Feedback) { await setStatus([f.id], 'done'); await loadFb() }
function download() {
  const url = URL.createObjectURL(new Blob([exportJson(fb.value)], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `pronunciation-feedback-${new Date().toISOString().slice(0, 10)}.json` })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const DAY = 864e5
const ago = (iso: string | null) => (iso ? (Date.now() - new Date(iso).getTime()) / DAY : Infinity)
const today = dayNumber()

const stats = computed(() => {
  const u = users.value
  return {
    total: u.length,
    today: u.filter((x) => ago(x.last_seen) < 1).length,
    week: u.filter((x) => ago(x.last_seen) < 7).length,
    fresh: u.filter((x) => ago(x.created_at) < 7).length,
    stopped: u.filter(stoppedComing).length,
  }
})
/** Came at least once, then nothing for two weeks. */
function stoppedComing(x: AdminUser) { return ago(x.last_seen) >= 14 && ago(x.last_seen) !== Infinity }

/** Learners and XP per day over the last 14 days, from each learner's XP calendar. */
const daily = computed(() => Array.from({ length: 14 }, (_, i) => {
  const d = today - i
  let learners = 0
  let xp = 0
  for (const u of users.value) {
    const v = Number(u.days?.[d] ?? 0)
    if (v > 0) { learners++; xp += v }
  }
  return { d, date: new Date(d * DAY).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }), learners, xp }
}))

type Filter = 'all' | 'week' | 'stopped' | 'blocked' | 'admins'
const filter = ref<Filter>('all')
const q = ref('')
const shown = computed(() => users.value.filter((x) => {
  if (filter.value === 'week' && ago(x.last_seen) >= 7) return false
  if (filter.value === 'stopped' && !stoppedComing(x)) return false
  if (filter.value === 'blocked' && !x.blocked) return false
  if (filter.value === 'admins' && x.role !== 'admin') return false
  const s = q.value.trim().toLowerCase()
  return !s || x.email.toLowerCase().includes(s) || x.name.toLowerCase().includes(s)
}))

const when = (iso: string | null) => {
  if (!iso) return t('never')
  const d = ago(iso)
  if (d < 1 / 24) return t('just now')
  if (d < 1) return t('today')
  if (d < 2) return t('yesterday')
  return t('{n} days ago', { n: Math.floor(d) })
}

const open = ref('')
const busy = ref('')
const confirmDel = ref('')
async function act(id: string, fn: () => Promise<string | null>) {
  busy.value = id
  const err = await fn()
  busy.value = ''
  confirmDel.value = ''
  if (err) error.value = err
  await load()
}
const me = computed(() => account.user?.id)
</script>

<template>
  <main class="wrap page admin">
    <div class="head">
      <h1>{{ t('Learners') }}</h1>
      <button type="button" class="btn ghost sm" :disabled="loading" @click="load">{{ t('Refresh') }}</button>
    </div>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-if="account.profile && !isAdmin()" class="card">{{ t('Only the course owner can see this page.') }}</p>

    <div class="tiles">
      <div class="tile"><b>{{ stats.total }}</b><span>{{ t('learners') }}</span></div>
      <div class="tile"><b>{{ stats.today }}</b><span>{{ t('active today') }}</span></div>
      <div class="tile"><b>{{ stats.week }}</b><span>{{ t('active this week') }}</span></div>
      <div class="tile"><b>{{ stats.fresh }}</b><span>{{ t('new this week') }}</span></div>
      <div class="tile warn"><b>{{ stats.stopped }}</b><span>{{ t('stopped coming (2+ weeks)') }}</span></div>
    </div>

    <details class="card days pron">
      <summary>{{ t('Pronunciation') }}: {{ t('{n} open reports', { n: openReports.length }) }} · {{ t('{n} marked wrong', { n: wrongClips.length }) }} · {{ t('{n} clips reviewed', { n: reviewedCount }) }}</summary>
      <div class="row">
        <RouterLink class="btn primary sm" :to="{ name: 'review' }">{{ t('Open the review page') }}</RouterLink>
        <button type="button" class="btn ghost sm" :disabled="!fb.length" @click="download">{{ t('Download all feedback (JSON)') }}</button>
      </div>
      <ul class="fb">
        <li v-for="f in [...wrongClips, ...openReports]" :key="f.id">
          <span><b class="fa" lang="fa">{{ f.fa }}</b> · {{ f.tr }}<template v-if="f.suggested_tr"> → <b>{{ f.suggested_tr }}</b></template></span>
          <span class="muted small">{{ f.kind === 'review' ? t('reviewer') : t('learner') }}: {{ f.who }}<template v-if="f.comment"> · {{ f.comment }}</template></span>
          <button type="button" class="btn ghost sm" @click="markFixed(f)">{{ t('Fixed') }}</button>
        </li>
      </ul>
    </details>

    <details class="card days">
      <summary>{{ t('Last 14 days') }}</summary>
      <table>
        <thead><tr><th scope="col">{{ t('Day') }}</th><th scope="col">{{ t('Learners') }}</th><th scope="col">XP</th></tr></thead>
        <tbody><tr v-for="r in daily" :key="r.d"><td>{{ r.date }}</td><td>{{ r.learners }}</td><td>{{ r.xp }}</td></tr></tbody>
      </table>
    </details>

    <div class="filters">
      <input v-model="q" type="search" :placeholder="t('Search name or email')" :aria-label="t('Search name or email')" />
      <div class="chips" role="radiogroup" :aria-label="t('Show')">
        <button
          v-for="f in (['all', 'week', 'stopped', 'blocked', 'admins'] as const)" :key="f" type="button" role="radio"
          class="chip-btn" :class="{ on: filter === f }" :aria-checked="filter === f" @click="filter = f"
        >
          {{ { all: t('All'), week: t('Active this week'), stopped: t('Stopped coming'), blocked: t('Blocked'), admins: t('Admins') }[f] }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="muted">{{ t('Checking…') }}</p>
    <p v-else-if="!shown.length" class="muted">{{ t('Nobody here yet.') }}</p>
    <ul class="list">
      <li v-for="u in shown" :key="u.id" class="card user" :class="{ blocked: u.blocked }">
        <button type="button" class="sum" :aria-expanded="open === u.id" @click="open = open === u.id ? '' : u.id">
          <span class="avatar" aria-hidden="true">{{ (u.name || u.email).charAt(0).toUpperCase() }}</span>
          <span class="who">
            <b>{{ u.name || u.email }}</b>
            <span class="muted small">{{ t('last active {when}', { when: when(u.last_seen) }) }} · {{ u.xp }} XP · {{ t('{n} lessons', { n: u.lessons }) }}</span>
          </span>
          <span v-if="u.role === 'admin'" class="tag">{{ t('admin') }}</span>
          <span v-else-if="u.role === 'reviewer'" class="tag">{{ t('reviewer') }}</span>
          <span v-if="u.blocked" class="tag bad">{{ t('blocked') }}</span>
          <AppIcon name="arrow" class="chev" :class="{ up: open === u.id }" />
        </button>
        <div v-if="open === u.id" class="detail">
          <dl>
            <dt>{{ t('Email') }}</dt><dd>{{ u.email }}</dd>
            <dt>{{ t('Joined') }}</dt><dd>{{ new Date(u.created_at).toLocaleDateString() }}</dd>
            <dt>{{ t('Streak') }}</dt><dd>{{ u.streak }}</dd>
          </dl>
          <div v-if="u.id !== me" class="row">
            <button type="button" class="btn ghost sm" :disabled="busy === u.id" @click="act(u.id, () => adminSetBlocked(u.id, !u.blocked))">{{ u.blocked ? t('Unblock') : t('Block') }}</button>
            <button v-if="u.role !== 'admin'" type="button" class="btn ghost sm" :disabled="busy === u.id" @click="act(u.id, () => adminSetRole(u.id, u.role === 'reviewer' ? 'learner' : 'reviewer'))">{{ u.role === 'reviewer' ? t('Remove reviewer') : t('Make reviewer') }}</button>
            <button type="button" class="btn ghost sm" :disabled="busy === u.id" @click="act(u.id, () => adminSetRole(u.id, u.role === 'admin' ? 'learner' : 'admin'))">{{ u.role === 'admin' ? t('Remove admin') : t('Make admin') }}</button>
            <button v-if="confirmDel !== u.id" type="button" class="btn ghost sm" @click="confirmDel = u.id">{{ t('Delete') }}</button>
            <template v-else>
              <span class="small">{{ t('Delete {name} and all their progress for good?', { name: u.name || u.email }) }}</span>
              <button type="button" class="btn danger sm" :disabled="busy === u.id" @click="act(u.id, () => adminDeleteUser(u.id))">{{ t('Delete it') }}</button>
              <button type="button" class="btn ghost sm" @click="confirmDel = ''">{{ t('Keep it') }}</button>
            </template>
          </div>
          <p v-else class="muted small">{{ t('This is you.') }}</p>
        </div>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; gap: 10px }
h1 { font-size: 1.7rem; font-weight: 800 }
.err { color: var(--bad) }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px }
.tile { background: var(--surface); border: 1.5px solid var(--line); border-radius: 14px; padding: 10px 12px; display: flex; flex-direction: column }
.tile b { font-family: var(--f-display); font-size: 1.6rem; font-weight: 800; line-height: 1.1 }
.tile span { font-size: 0.8rem; color: var(--muted) }
.tile.warn b { color: var(--bad) }
.days summary { cursor: pointer; font-weight: 700 }
.days table { width: 100%; border-collapse: collapse; margin-top: 8px; font-variant-numeric: tabular-nums; font-size: 0.9rem }
.days th, .days td { text-align: start; padding: 4px 6px; border-bottom: 1px solid var(--line) }
.filters { display: flex; flex-direction: column; gap: 8px }
.filters input { padding: 10px 12px; border-radius: 12px; border: 2px solid var(--line); background: var(--bg); color: var(--ink); font-size: 1rem }
.chips { display: flex; gap: 6px; flex-wrap: wrap }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px }
.user { padding: 0; overflow: hidden }
.user.blocked { opacity: 0.7 }
.sum { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: none; border: 0; font: inherit; color: inherit; text-align: start; cursor: pointer }
.avatar { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); font-weight: 800; flex: none }
.who { display: flex; flex-direction: column; min-width: 0; flex: 1 }
.who b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.tag { font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--sunk) }
.tag.bad { color: var(--bad) }
.chev { transform: rotate(-90deg); transition: transform 0.15s }
.chev.up { transform: rotate(90deg) }
.detail { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 10px }
dl { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; margin: 0; font-size: 0.9rem }
dt { color: var(--muted) }
dd { margin: 0; overflow-wrap: anywhere }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center }
@media (prefers-reduced-motion: reduce) { .chev { transition: none } }
.pron .row { margin-top: 8px }
.fb { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px }
.fb li { display: flex; flex-direction: column; gap: 2px; border-bottom: 1px solid var(--line); padding-bottom: 6px }
.fb li .btn { align-self: flex-start }
.fb .fa { font-family: var(--f-fa) }
</style>
