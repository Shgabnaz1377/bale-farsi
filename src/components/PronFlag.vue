<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { lastHeard } from '@/lib/speech.ts'
import { clipKey, NARRATOR } from '@/content/voices.ts'
import type { VoiceId } from '@/content/speakers.ts'
import { flagOn, findClip, report, type ClipRef } from '@/lib/pron.ts'
import { APP } from '@/app.ts'
import { t } from '@/i18n/index.ts'
import BottomSheet from './BottomSheet.vue'

/**
 * "Sounds wrong?": after a clip plays, a small bar offers to report it (only for signed-in people who
 * switched it on; reviewers and the owner have it on by default). Mounted once, in App.vue.
 */
const SHOW_MS = 7000
const clip = ref<ClipRef | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

watch(lastHeard, async (h) => {
  if (!h || !flagOn.value || open.value) return
  const item = await findClip(h.text, h.voice)
  const voice = (h.voice ?? item?.voice ?? NARRATOR) as VoiceId
  clip.value = { key: h.clip ?? item?.key ?? clipKey(h.text, voice), fa: h.text, tr: item?.tr ?? '', voice }
  clearTimeout(timer)
  timer = setTimeout(() => { if (!open.value) clip.value = null }, SHOW_MS)
})
onBeforeUnmount(() => clearTimeout(timer))

const open = ref(false)
const suggested = ref('')
const comment = ref('')
const busy = ref(false)
const msg = ref('')
function start() { clearTimeout(timer); suggested.value = ''; comment.value = ''; msg.value = ''; open.value = true }
function close() { open.value = false; clip.value = null }
async function send() {
  if (!clip.value) return
  busy.value = true
  const err = await report(clip.value, suggested.value, comment.value)
  busy.value = false
  msg.value = err ?? t('Thank you! A native speaker will check it.')
  if (!err) setTimeout(close, 1400)
}
</script>

<template>
  <div v-if="clip && !open" class="pron-bar" role="status">
    <span class="what"><b class="fa" :lang="APP.target" :dir="APP.targetDir">{{ clip.fa }}</b><span v-if="clip.tr" class="muted"> · {{ clip.tr }}</span></span>
    <button type="button" class="btn ghost sm" @click="start">{{ t('Sounds wrong?') }}</button>
    <button type="button" class="x" :aria-label="t('Hide this')" @click="clip = null">×</button>
  </div>
  <BottomSheet :open="open" labelledby="pron-title" @close="close">
    <h2 id="pron-title">{{ t('Does this sound wrong?') }}</h2>
    <p v-if="clip" class="said">
      <b class="fa" :lang="APP.target" :dir="APP.targetDir">{{ clip.fa }}</b>
      <span v-if="clip.tr" class="muted">{{ t('Written as: {tr}', { tr: clip.tr }) }}</span>
    </p>
    <form class="form" @submit.prevent="send">
      <label for="pron-tr">{{ t('How should it sound? (Finglish, optional)') }}</label>
      <input id="pron-tr" v-model="suggested" maxlength="500" autocomplete="off" :placeholder="clip?.tr" />
      <label for="pron-c">{{ t('What is wrong? (optional)') }}</label>
      <textarea id="pron-c" v-model="comment" maxlength="1000" rows="2"></textarea>
      <button type="submit" class="btn primary" :disabled="busy">{{ t('Send to the reviewers') }}</button>
    </form>
    <p v-if="msg" class="small" role="status">{{ msg }}</p>
  </BottomSheet>
</template>

<style scoped>
.pron-bar {
  position: fixed; z-index: 30; inset-inline: 12px; bottom: calc(var(--tab-h, 0px) + 12px + env(safe-area-inset-bottom, 0px));
  max-width: 520px; margin-inline: auto; display: flex; align-items: center; gap: 10px;
  background: var(--surface); border: 1.5px solid var(--line); border-radius: 14px; padding: 8px 10px 8px 14px; box-shadow: var(--shadow);
}
.what { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.x { font: inherit; font-size: 1.3rem; line-height: 1; background: none; border: 0; color: var(--muted); cursor: pointer; padding: 4px 6px }
h2 { font-size: 1.2rem; font-weight: 800 }
.said { display: flex; flex-direction: column; gap: 2px; margin: 8px 0 }
.said .fa { font-size: 1.5rem }
.form { display: flex; flex-direction: column; gap: 6px }
.form label { font-weight: 600; font-size: 0.92rem; margin-top: 4px }
.form input, .form textarea { padding: 10px 12px; border-radius: 12px; border: 2px solid var(--line); background: var(--bg); color: var(--ink); font: inherit }
.form .btn.primary { margin-top: 8px }
</style>
