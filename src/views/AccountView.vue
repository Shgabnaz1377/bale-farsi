<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  account, deleteMyAccount, isAdmin, isReviewer, sendPasswordReset, setName, setPassword, signIn, signOut, signUp, syncNow,
} from '@/lib/account.ts'
import MeowCat from '@/components/MeowCat.vue'
import { flagOn } from '@/lib/pron.ts'
import { APP } from '@/app.ts'
import { LANGS, t } from '@/i18n/index.ts'
import { P } from '@/lib/store.ts'

const route = useRoute()
const router = useRouter()
/** Sent here by the guest limit: say why, and go back to the lesson after signing in. */
const gated = computed(() => route.query.gate === '1')
const back = computed(() => (typeof route.query.next === 'string' && route.query.next.startsWith('/') ? route.query.next : ''))

type Mode = 'signup' | 'signin' | 'forgot'
const mode = ref<Mode>(gated.value ? 'signup' : 'signin')
const name = ref('')
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const notice = ref('')
const confirmEmail = ref('')

function switchTo(m: Mode) { mode.value = m; error.value = ''; notice.value = '' }

const emailOk = () => /^\S+@\S+\.\S+$/.test(email.value.trim())

async function submit() {
  error.value = ''
  notice.value = ''
  if (mode.value === 'signup' && !name.value.trim()) { error.value = t('Tell us your name.'); return }
  if (!emailOk()) { error.value = t('Enter your email address, like name@example.com.'); return }
  if (mode.value !== 'forgot' && password.value.length < 8) { error.value = t('Choose a longer password: at least 8 characters.'); return }
  busy.value = true
  if (mode.value === 'signup') {
    const r = await signUp(name.value, email.value, password.value)
    if (r === 'confirm') confirmEmail.value = email.value.trim()
    else if (r) error.value = r
  } else if (mode.value === 'signin') {
    const r = await signIn(email.value, password.value)
    if (r) error.value = r
  } else {
    const r = await sendPasswordReset(email.value)
    if (r) error.value = r
    else notice.value = t('If there is an account for {email}, we sent it a link to choose a new password. Check spam too.', { email: email.value.trim() })
  }
  busy.value = false
}

// Back to the lesson the guest limit interrupted, once signed in.
watch(() => account.user, (u) => { if (u && back.value && !account.recovering) void router.replace(back.value) })

const newPassword = ref('')
async function saveNewPassword() {
  error.value = ''
  if (newPassword.value.length < 8) { error.value = t('Choose a longer password: at least 8 characters.'); return }
  busy.value = true
  const r = await setPassword(newPassword.value)
  busy.value = false
  if (r) error.value = r
  else { newPassword.value = ''; changing.value = false; notice.value = t('Your new password is saved.') }
}
const changing = ref(false)

const editName = ref('')
watch(() => account.profile?.name, (n) => { editName.value = n ?? '' }, { immediate: true })
async function saveName() {
  const r = await setName(editName.value)
  notice.value = r ?? t('Saved.')
}

const confirmDelete = ref(false)
async function removeAccount() {
  const r = await deleteMyAccount()
  confirmDelete.value = false
  notice.value = r ?? t('Your account and its saved progress were deleted.')
}

const statusText = computed(() => {
  switch (account.status) {
    case 'syncing': return t('Syncing…')
    case 'synced': return t('Synced {time}', { time: new Date(account.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
    case 'offline': return t('Offline. Your progress is saved here and will sync when you are back online.')
    case 'error': return t('Sync failed: {error}', { error: account.error })
    default: return ''
  }
})
</script>

<template>
  <main class="wrap page">
    <div v-if="LANGS.length > 1" class="langs" role="radiogroup" :aria-label="t('Language')">
      <button
        v-for="l in LANGS" :key="l.code" type="button" role="radio" class="chip-btn"
        :class="{ on: P.settings.lang === l.code }" :aria-checked="P.settings.lang === l.code" :lang="l.code" @click="P.settings.lang = l.code"
      >
        {{ l.name }}
      </button>
    </div>
    <div class="title-row">
      <h1>{{ account.user ? t('Your account') : mode === 'signup' ? t('Create your free account') : t('Sign in') }}</h1>
      <MeowCat :mood="account.user ? 'happy' : gated ? 'cheer' : 'wave'" :size="72" />
    </div>

    <section v-if="!account.enabled" class="card block">
      <p>{{ t('Accounts are not switched on for this copy of {app}. Your progress is saved in this browser.', { app: APP.fullName }) }}</p>
    </section>

    <section v-else-if="!account.ready" class="card block"><p class="muted">{{ t('Checking…') }}</p></section>

    <!-- Back from a "forgot password" email -->
    <section v-else-if="account.user && account.recovering" class="card block">
      <h2>{{ t('Choose a new password') }}</h2>
      <form class="form" @submit.prevent="saveNewPassword">
        <label for="newpw">{{ t('New password') }}</label>
        <input id="newpw" v-model="newPassword" type="password" autocomplete="new-password" minlength="8" required />
        <button type="submit" class="btn primary" :disabled="busy">{{ t('Save password') }}</button>
      </form>
      <p v-if="error" class="err small" role="alert">{{ error }}</p>
    </section>

    <template v-else-if="account.user">
      <section id="account" class="card block">
        <p class="eyebrow">{{ t('Signed in') }}</p>
        <p class="who">{{ account.profile?.name || account.user.email }}</p>
        <p v-if="account.profile?.name" class="muted small">{{ account.user.email }}</p>
        <p class="muted small" role="status">{{ statusText }}</p>
        <p class="muted small">{{ t('Your progress ({xp} XP, {n} lessons) is saved to your account: sign in on any device to carry on.', { xp: P.xp, n: Object.keys(P.done).length }) }}</p>
        <label class="check"><input v-model="flagOn" type="checkbox" /> {{ t('Help fix pronunciation: after a recording plays, offer “Sounds wrong?”') }}</label>
        <div class="row">
          <RouterLink v-if="isAdmin()" class="btn primary sm" :to="{ name: 'admin' }">{{ t('Owner page: learners') }}</RouterLink>
          <RouterLink v-if="isReviewer()" class="btn ghost sm" :to="{ name: 'review' }">{{ t('Pronunciation review') }}</RouterLink>
          <button type="button" class="btn ghost sm" :disabled="account.status === 'syncing'" @click="syncNow()">{{ t('Sync now') }}</button>
          <button type="button" class="btn ghost sm" @click="signOut()">{{ t('Sign out') }}</button>
        </div>
      </section>

      <details class="card block more">
        <summary>{{ t('Name, password and account') }}</summary>
        <form class="form" @submit.prevent="saveName">
          <label for="name">{{ t('Your name') }}</label>
          <span class="inline"><input id="name" v-model="editName" autocomplete="name" maxlength="80" /><button type="submit" class="btn ghost sm">{{ t('Save') }}</button></span>
        </form>
        <form v-if="changing" class="form" @submit.prevent="saveNewPassword">
          <label for="newpw2">{{ t('New password') }}</label>
          <span class="inline"><input id="newpw2" v-model="newPassword" type="password" autocomplete="new-password" minlength="8" /><button type="submit" class="btn ghost sm" :disabled="busy">{{ t('Save password') }}</button></span>
        </form>
        <button v-else type="button" class="btn ghost sm" @click="changing = true">{{ t('Change password') }}</button>
        <div class="row">
          <button v-if="!confirmDelete" type="button" class="btn ghost sm" @click="confirmDelete = true">{{ t('Delete my account') }}</button>
          <template v-else>
            <span class="small">{{ t('This deletes your account and your saved progress for good.') }}</span>
            <button type="button" class="btn danger sm" @click="removeAccount">{{ t('Delete it') }}</button>
            <button type="button" class="btn ghost sm" @click="confirmDelete = false">{{ t('Keep it') }}</button>
          </template>
        </div>
        <p v-if="error" class="err small" role="alert">{{ error }}</p>
      </details>
      <p v-if="notice" class="small" role="status">{{ notice }}</p>
    </template>

    <section v-else-if="confirmEmail" class="card block">
      <h2>{{ t('Check your inbox') }}</h2>
      <p>{{ t('We sent a link to {email}. Open it to confirm your account, then you are in. Check spam too.', { email: confirmEmail }) }}</p>
      <button type="button" class="btn ghost sm" @click="confirmEmail = ''; switchTo('signin')">{{ t('I confirmed it: sign in') }}</button>
    </section>

    <section v-else id="account" class="card block">
      <p v-if="gated" class="gate">{{ t('Nice work on your first lesson! Create a free account to keep going. Your progress comes with you.') }}</p>
      <p v-if="account.error" class="err small" role="alert">{{ account.error }}</p>

      <div v-if="mode !== 'forgot'" class="tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="mode === 'signup'" :class="{ on: mode === 'signup' }" @click="switchTo('signup')">{{ t('Create account') }}</button>
        <button type="button" role="tab" :aria-selected="mode === 'signin'" :class="{ on: mode === 'signin' }" @click="switchTo('signin')">{{ t('Sign in') }}</button>
      </div>
      <h2 v-else>{{ t('Forgot your password?') }}</h2>

      <form class="form" @submit.prevent="submit">
        <template v-if="mode === 'signup'">
          <label for="name">{{ t('Your name') }}</label>
          <input id="name" v-model="name" autocomplete="name" maxlength="80" required />
        </template>
        <label for="email">{{ t('Email address') }}</label>
        <input id="email" v-model="email" type="email" autocomplete="email" placeholder="name@example.com" required />
        <template v-if="mode !== 'forgot'">
          <label for="pw">{{ t('Password') }}</label>
          <input id="pw" v-model="password" type="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" minlength="8" required />
          <span v-if="mode === 'signup'" class="muted small">{{ t('At least 8 characters.') }}</span>
        </template>
        <button type="submit" class="btn primary" :disabled="busy">
          {{ busy ? t('Checking…') : mode === 'signup' ? t('Create account') : mode === 'signin' ? t('Sign in') : t('Email me a reset link') }}
        </button>
      </form>
      <p v-if="error" class="err small" role="alert">{{ error }}</p>
      <p v-if="notice" class="small" role="status">{{ notice }}</p>
      <button v-if="mode === 'signin'" type="button" class="linkish small" @click="switchTo('forgot')">{{ t('Forgot your password?') }}</button>
      <button v-if="mode === 'forgot'" type="button" class="linkish small" @click="switchTo('signin')">{{ t('Back to sign in') }}</button>
      <p v-if="mode === 'signup'" class="muted small">{{ t('Progress you already have on this device is added to your new account.') }}</p>
    </section>

    <p class="muted small">{{ t('We store your name, email and learning progress so you can carry on from any device. The course owner can see them to look after the course; nobody else can.') }}</p>
  </main>
</template>

<style scoped>
h1 { font-size: 1.7rem; font-weight: 800 }
.langs { display: flex; gap: 6px; justify-content: flex-end }
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px }
.block { display: flex; flex-direction: column; gap: 12px }
.block h2 { font-size: 1.15rem; font-weight: 800 }
.who { font-family: var(--f-display); font-size: 1.3rem; font-weight: 800; overflow-wrap: anywhere }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center }
.gate { background: var(--accent-soft); border-radius: 12px; padding: 10px 12px; font-weight: 600 }
.tabs { display: flex; gap: 4px; background: var(--sunk); border-radius: 12px; padding: 4px }
.tabs button { flex: 1; font: inherit; font-weight: 700; border: 0; border-radius: 9px; padding: 9px; background: transparent; color: var(--muted); cursor: pointer }
.tabs button.on { background: var(--surface); color: var(--ink); box-shadow: var(--shadow) }
.form { display: flex; flex-direction: column; gap: 6px }
.form label { font-weight: 600; font-size: 0.92rem; margin-top: 4px }
.form input { padding: 12px 14px; border-radius: 12px; border: 2px solid var(--line); background: var(--bg); color: var(--ink); font-size: 1rem }
.form input:focus { border-color: var(--lapis); outline: none }
.form .btn.primary { margin-top: 8px }
.inline { display: flex; gap: 8px }
.inline input { flex: 1; min-width: 0 }
.more summary { cursor: pointer; font-weight: 700 }
.linkish { font: inherit; background: none; border: 0; padding: 0; color: var(--accent); text-decoration: underline; cursor: pointer; align-self: flex-start }
.err { color: var(--bad) }
.check { display: inline-flex; gap: 8px; align-items: flex-start; font-size: 0.92rem; cursor: pointer }
.check input { accent-color: var(--accent); width: 17px; height: 17px; flex: none; margin-top: 2px }
</style>
