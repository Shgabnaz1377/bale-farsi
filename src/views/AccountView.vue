<script setup lang="ts">
import { computed, ref } from 'vue'
import { account, deleteCloudProgress, sendSignInLink, signOut, syncNow } from '@/lib/account.ts'
import { P } from '@/lib/store.ts'

const email = ref('')
const sending = ref(false)
const sentTo = ref('')
const error = ref('')
const confirmDelete = ref(false)
const notice = ref('')

const statusText = computed(() => {
  switch (account.status) {
    case 'syncing': return 'Syncing…'
    case 'synced': return `Synced ${new Date(account.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    case 'offline': return 'Offline. Your progress is saved here and will sync when you are back online.'
    case 'error': return `Sync failed: ${account.error}`
    default: return ''
  }
})

async function send() {
  error.value = ''
  if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) { error.value = 'Enter your email address, like name@example.com.'; return }
  sending.value = true
  const err = await sendSignInLink(email.value)
  sending.value = false
  if (err) error.value = err
  else sentTo.value = email.value.trim()
}
async function removeCloud() {
  const err = await deleteCloudProgress()
  confirmDelete.value = false
  notice.value = err ?? 'Your saved progress was deleted from the cloud. It is still on this device until you sign out.'
}
</script>

<template>
  <main class="wrap page">
    <h1>Your account</h1>

    <section v-if="!account.enabled" class="card block">
      <p>Accounts are not switched on for this copy of Bale. Your progress is saved in this browser.</p>
    </section>

    <section v-else-if="!account.ready" class="card block"><p class="muted">Checking…</p></section>

    <section v-else-if="account.user" id="account" class="card block">
      <p class="eyebrow">Signed in</p>
      <p class="who">{{ account.user.email }}</p>
      <p class="muted small" role="status">{{ statusText }}</p>
      <p class="muted small">Your progress ({{ P.xp }} XP, {{ Object.keys(P.done).length }} lessons) syncs to your account, so you can carry on from any device by signing in with this email.</p>
      <div class="row">
        <button type="button" class="btn ghost sm" :disabled="account.status === 'syncing'" @click="syncNow()">Sync now</button>
        <button type="button" class="btn ghost sm" @click="signOut()">Sign out</button>
      </div>
      <div class="row">
        <template v-if="!confirmDelete">
          <button type="button" class="btn ghost sm" @click="confirmDelete = true">Delete my saved progress from the cloud</button>
        </template>
        <template v-else>
          <span class="small">This removes your progress from the server. Other devices will start over.</span>
          <button type="button" class="btn danger sm" @click="removeCloud">Delete it</button>
          <button type="button" class="btn ghost sm" @click="confirmDelete = false">Keep it</button>
        </template>
      </div>
      <p v-if="notice" class="small" role="status">{{ notice }}</p>
    </section>

    <section v-else id="account" class="card block">
      <template v-if="!sentTo">
        <h2>Save your progress to an account</h2>
        <p class="muted">Sign in with your email and your progress follows you to every device. No password: we email you a sign-in link. Progress you already have on this device is kept and added to your account.</p>
        <form class="signin" @submit.prevent="send">
          <label for="email" class="sr-only">Email address</label>
          <input id="email" v-model="email" type="email" autocomplete="email" placeholder="name@example.com" required />
          <button type="submit" class="btn primary" :disabled="sending">{{ sending ? 'Sending…' : 'Email me a sign-in link' }}</button>
        </form>
        <p v-if="error" class="err small" role="alert">{{ error }}</p>
      </template>
      <template v-else>
        <h2>Check your inbox</h2>
        <p>We sent a sign-in link to <b>{{ sentTo }}</b>. Open it <b>in this browser</b> and you are signed in. It can take a minute; check spam too.</p>
        <button type="button" class="btn ghost sm" @click="sentTo = ''">Use a different email</button>
      </template>
    </section>

    <p class="muted small">Only your email and your learning progress are stored. Nobody else can read your progress.</p>
  </main>
</template>

<style scoped>
h1 { font-size: 1.7rem; font-weight: 800 }
.block { display: flex; flex-direction: column; gap: 12px }
.block h2 { font-size: 1.15rem; font-weight: 800 }
.who { font-family: var(--f-display); font-size: 1.3rem; font-weight: 800; overflow-wrap: anywhere }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center }
.signin { display: flex; gap: 8px; flex-wrap: wrap }
.signin input { flex: 1 1 240px; padding: 12px 14px; border-radius: 12px; border: 2px solid var(--line); background: var(--bg); font-size: 1rem }
.signin input:focus { border-color: var(--lapis); outline: none }
.err { color: var(--bad) }
</style>
