<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { account, isReviewer } from '@/lib/account.ts'
import { feedbackList, review, reviewQueue, setStatus, type QueueItem } from '@/lib/pron.ts'
import type { VoiceId } from '@/content/speakers.ts'
import { APP } from '@/app.ts'
import { t } from '@/i18n/index.ts'
import MeowCat from '@/components/MeowCat.vue'
import SpeakButton from '@/components/SpeakButton.vue'

/**
 * Pronunciation review for native speakers: one clip at a time. Listen, then ✓ sounds right, or ✗ and
 * (optionally) the right Finglish. Learner reports come first, then clips the listen-back check flagged,
 * then clips nobody has reviewed yet.
 */
const queue = ref<QueueItem[]>([])
const i = ref(0)
const loading = ref(true)
const error = ref('')
const done = ref(0)

async function load() {
  loading.value = true
  const r = await feedbackList()
  error.value = r.error ?? ''
  queue.value = r.error ? [] : await reviewQueue(r.rows)
  i.value = 0
  loading.value = false
}
onMounted(() => { if (isReviewer()) void load() })

const item = computed(() => queue.value[i.value] ?? null)
const voice = computed(() => (item.value?.voice || undefined) as VoiceId | undefined)
const why = computed(() => (item.value ? { reported: t('A learner reported it'), stt: t('The listen-back check heard something else'), sample: t('Not reviewed yet') }[item.value.why] : ''))

const wrong = ref(false)
const fix = ref('')
const comment = ref('')
const busy = ref(false)

function next() {
  wrong.value = false
  fix.value = ''
  comment.value = ''
  i.value++
}
async function verdict(v: 'ok' | 'wrong') {
  const it = item.value
  if (!it) return
  busy.value = true
  const err = await review(it, v, v === 'wrong' ? fix.value : '', v === 'wrong' ? comment.value : '')
  if (!err && it.reportIds.length) await setStatus(it.reportIds, 'done')
  busy.value = false
  if (err) { error.value = err; return }
  error.value = ''
  done.value++
  next()
}
</script>

<template>
  <main class="wrap page review">
    <div class="head">
      <h1>{{ t('Pronunciation review') }}</h1>
      <span v-if="queue.length" class="muted small">{{ t('{n} reviewed', { n: done }) }} · {{ Math.min(i + 1, queue.length) }}/{{ queue.length }}</span>
    </div>

    <p v-if="!account.user" class="card">
      {{ t('Sign in with a reviewer account to review pronunciation.') }} <RouterLink to="/account">{{ t('Sign in') }}</RouterLink>
    </p>
    <p v-else-if="account.profile && !isReviewer()" class="card">{{ t('This page is for native-speaker reviewers. Ask the course owner to make you a reviewer.') }}</p>
    <p v-else-if="loading" class="muted">{{ t('Checking…') }}</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <template v-if="isReviewer() && !loading">
      <section v-if="item" :key="item.key" class="card clip">
        <span class="why" :class="item.why">{{ why }}</span>
        <div class="say">
          <SpeakButton :text="item.fa" :voice="voice" big />
          <div>
            <p class="fa" :lang="APP.target" :dir="APP.targetDir">{{ item.fa }}</p>
            <p class="tr">{{ item.tr }}</p>
          </div>
        </div>
        <ul v-if="item.notes.length" class="notes">
          <li v-for="(n, k) in item.notes" :key="k">{{ n }}</li>
        </ul>
        <p class="muted small">{{ t('Does the recording match the Finglish exactly, with no extra or missing vowel?') }}</p>

        <form v-if="wrong" class="form" @submit.prevent="verdict('wrong')">
          <label for="fix">{{ t('The right Finglish (optional)') }}</label>
          <input id="fix" v-model="fix" maxlength="500" autocomplete="off" :placeholder="item.tr" />
          <label for="why">{{ t('What is wrong? (optional)') }}</label>
          <input id="why" v-model="comment" maxlength="1000" autocomplete="off" />
          <div class="row">
            <button type="submit" class="btn danger" :disabled="busy">{{ t('Save: sounds wrong') }}</button>
            <button type="button" class="btn ghost" @click="wrong = false">{{ t('Back') }}</button>
          </div>
        </form>
        <div v-else class="row big">
          <button type="button" class="btn primary" :disabled="busy" @click="verdict('ok')">✓ {{ t('Sounds right') }}</button>
          <button type="button" class="btn ghost" :disabled="busy" @click="wrong = true">✗ {{ t('Sounds wrong') }}</button>
        </div>
        <button type="button" class="linkish small" @click="next">{{ t('Skip') }}</button>
      </section>
      <section v-else class="card empty">
        <MeowCat mood="cheer" :size="90" />
        <p>{{ t('All done for now. Thank you!') }}</p>
        <button type="button" class="btn ghost sm" @click="load">{{ t('Load more') }}</button>
      </section>
    </template>
  </main>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px }
h1 { font-size: 1.6rem; font-weight: 800 }
.err { color: var(--bad) }
.clip { display: flex; flex-direction: column; gap: 12px; padding: 18px }
.why { align-self: flex-start; font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: var(--sunk) }
.why.reported { background: var(--accent-soft) }
.why.stt { color: var(--bad) }
.say { display: flex; gap: 14px; align-items: center }
.fa { font-family: var(--f-fa); font-size: 2rem; font-weight: 700; line-height: 1.3 }
.tr { font-size: 1.2rem; font-weight: 600 }
.notes { margin: 0; padding-inline-start: 18px; font-size: 0.92rem }
.row { display: flex; gap: 8px; flex-wrap: wrap }
.row.big .btn { flex: 1 }
.form { display: flex; flex-direction: column; gap: 6px }
.form label { font-weight: 600; font-size: 0.92rem }
.form input { padding: 10px 12px; border-radius: 12px; border: 2px solid var(--line); background: var(--bg); color: var(--ink); font: inherit }
.linkish { font: inherit; background: none; border: 0; padding: 0; color: var(--accent); text-decoration: underline; cursor: pointer; align-self: center }
.empty { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center }
</style>
