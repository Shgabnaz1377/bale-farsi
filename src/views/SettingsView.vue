<script setup lang="ts">
import { computed, ref } from 'vue'
import { P, exportProgress, importProgress, resetProgress } from '@/lib/store.ts'
import { clipCount, faVoice } from '@/lib/speech.ts'
import { account } from '@/lib/account.ts'
import { LANGS, t } from '@/i18n/index.ts'
import InstallCard from '@/components/InstallCard.vue'
import { APP } from '@/app.ts'

const modes = computed(() => [['both', t('Persian script + Finglish')], ['latin', t('Finglish only')], ['script', t('Persian script only')]] as const)
const vowelModes = computed(() => [['auto', t('By level')], ['always', t('Always')], ['never', t('Never')]] as const)
const themes = computed(() => [['system', t('Match system')], ['light', t('Light')], ['dark', t('Dark')]] as const)
const goals = [10, 20, 30, 50] as const
const keyRows = computed(() => [
  ['â', t('long a, as in “father”')],
  ['a', t('short a, as in “cat”')],
  ['e', t('as in “bed”')],
  ['o', t('short o, as in “go” said quickly')],
  ['u / i', t('as in “food” / “see”')],
  ['sh / ch', t('as in “shop” / “church”')],
  ['kh', t('rough throat sound, as in Scottish “loch”')],
  ['gh', t('a gargled g, deep in the throat')],
  ['zh', t('the s in “measure”')],
  ["'", t('a short catch in the voice (glottal stop)')],
  ['-e / -ye', t('the ezâfe, linking words: ketâb-e man, “my book”')],
])

const backup = ref('')
const backupMsg = ref('')
const confirmReset = ref(false)

async function copyBackup() {
  backup.value = exportProgress()
  try {
    await navigator.clipboard.writeText(backup.value)
    backupMsg.value = t('Copied. Paste it into the box on another device and press Restore.')
  } catch {
    backupMsg.value = t('Copy the text in the box below by hand.')
  }
}
function restore() {
  backupMsg.value = importProgress(backup.value) ? t('Progress restored.') : t('That text is not a {app} backup. Copy it again from the other device.', { app: APP.fullName })
}
</script>

<template>
  <main class="wrap page">
    <h1>{{ t('Settings') }}</h1>
    <InstallCard />

    <section v-if="LANGS.length > 1" class="card block">
      <h2>{{ t('I speak') }}</h2>
      <div class="seg" role="radiogroup" :aria-label="t('I speak')">
        <template v-for="l in LANGS" :key="l.code">
          <input :id="'lang-' + l.code" v-model="P.settings.lang" type="radio" name="lang" :value="l.code" />
          <label :for="'lang-' + l.code">{{ l.name }}</label>
        </template>
      </div>
      <p class="muted small">{{ t('Meanings, explanations and buttons appear in this language. The Persian stays the same.') }}</p>
    </section>

    <section class="card block">
      <h2>{{ t('Show Persian as') }}</h2>
      <div class="seg" role="radiogroup" :aria-label="t('Show Persian as')">
        <template v-for="[v, label] in modes" :key="v">
          <input :id="'mode-' + v" v-model="P.settings.mode" type="radio" name="mode" :value="v" />
          <label :for="'mode-' + v">{{ label }}</label>
        </template>
      </div>
      <p class="muted small">{{ t('Finglish is Persian written in English letters, like salâm for hello. Keep it on while you learn the alphabet. Switch to script only once you can read, so you stop leaning on it.') }}</p>
      <template v-if="APP.target === 'fa'">
        <p class="eyebrow">{{ t('Vowel marks') }}</p>
        <div class="seg" role="radiogroup" :aria-label="t('Vowel marks')">
          <template v-for="[v, label] in vowelModes" :key="v">
            <input :id="'vowels-' + v" v-model="P.settings.vowels" type="radio" name="vowels" :value="v" />
            <label :for="'vowels-' + v">{{ label }}</label>
          </template>
        </div>
        <p class="muted small">{{ t('Marks for the short vowels, like مُبل (mobl). By level: on every word in A1, on single words in A2, and gone from B1, as in real Persian.') }}</p>
      </template>
    </section>

    <section class="card block">
      <h2>{{ t('Lessons') }}</h2>
      <p class="eyebrow">{{ t('Daily goal') }}</p>
      <div class="seg" role="radiogroup" :aria-label="t('Daily goal')">
        <template v-for="g in goals" :key="g">
          <input :id="'goal-' + g" v-model="P.settings.goal" type="radio" name="goal" :value="g" />
          <label :for="'goal-' + g">{{ g }} XP</label>
        </template>
      </div>
      <label class="check"><input id="relaxed" v-model="P.settings.relaxed" type="checkbox" /> {{ t('Relaxed mode: no hearts, mistakes cost nothing') }}</label>
      <label class="check"><input id="sfx" v-model="P.settings.sfx" type="checkbox" /> {{ t('Sound effects') }}</label>
      <label class="check"><input id="autoplay" v-model="P.settings.autoplay" type="checkbox" /> {{ t('Read Persian aloud automatically') }}</label>
      <p class="muted small">
        <template v-if="clipCount">{{ t('Every word, sentence, dialogue and reading has recorded Persian audio ({n} clips). Tap any speaker button to hear it; the smaller button next to it plays it slowly.', { n: clipCount }) }}</template>
        <template v-else-if="faVoice">{{ t('Audio uses the voice “{name}”.', { name: faVoice.name }) }}</template>
        <template v-else>{{ t("Audio needs a Persian (fa-IR) voice. Microsoft Edge has one built in. Elsewhere, add a Persian voice in your system's speech settings and reload.") }}</template>
      </p>
    </section>

    <section class="card block">
      <h2>{{ t('Appearance') }}</h2>
      <div class="seg" role="radiogroup" :aria-label="t('Theme')">
        <template v-for="[v, label] in themes" :key="v">
          <input :id="'theme-' + v" v-model="P.settings.theme" type="radio" name="theme" :value="v" />
          <label :for="'theme-' + v">{{ label }}</label>
        </template>
      </div>
    </section>

    <section v-if="APP.target === 'fa'" class="card block">
      <h2>{{ t('How to read Finglish') }}</h2>
      <dl class="key">
        <template v-for="[k, d] in keyRows" :key="k"><dt>{{ k }}</dt><dd>{{ d }}</dd></template>
      </dl>
    </section>

    <section class="card block">
      <h2>{{ t('Your progress') }}</h2>
      <p class="muted small">
        <template v-if="account.enabled"><RouterLink to="/account">{{ t('Sign in') }}</RouterLink> {{ t('to keep your progress in sync on every device. Without an account, progress stays in this browser; you can also move it by hand with a backup.') }}</template>
        <template v-else>{{ t('Progress is saved in this browser only. To move it to another device, copy a backup here and restore it there.') }}</template>
      </p>
      <div class="row">
        <button type="button" class="btn ghost sm" @click="copyBackup">{{ t('Copy backup') }}</button>
        <button type="button" class="btn ghost sm" :disabled="!backup.trim()" @click="restore">{{ t('Restore from box') }}</button>
      </div>
      <label class="sr-only" for="backup">{{ t('Backup text') }}</label>
      <textarea id="backup" v-model="backup" rows="3" :placeholder="t('Paste a backup here to restore it')"></textarea>
      <p v-if="backupMsg" class="small" role="status">{{ backupMsg }}</p>
      <div class="row">
        <template v-if="!confirmReset">
          <button type="button" class="btn ghost sm" @click="confirmReset = true">{{ t('Reset progress') }}</button>
        </template>
        <template v-else>
          <span class="small">{{ t('This erases XP, streak, finished lessons and review history.') }}</span>
          <button type="button" class="btn danger sm" @click="resetProgress(); confirmReset = false">{{ t('Erase progress') }}</button>
          <button type="button" class="btn ghost sm" @click="confirmReset = false">{{ t('Keep it') }}</button>
        </template>
      </div>
    </section>

    <p class="muted small about">
      {{ t('{app} is free and open source. The course content was written with AI help and is being reviewed by native speakers; if you spot a mistake,', { app: APP.fullName }) }}
      <a href="https://github.com/Shgabnaz1377/persianmeow/issues" target="_blank" rel="noopener">{{ t('open an issue on GitHub') }}</a>.
    </p>
  </main>
</template>

<style scoped>
h1 { font-size: 1.7rem; font-weight: 800 }
.block { display: flex; flex-direction: column; gap: 12px }
.block h2 { font-size: 1.1rem; font-weight: 800 }
.seg { display: flex; flex-wrap: wrap; gap: 6px }
.seg input { position: absolute; opacity: 0; pointer-events: none }
.seg label { padding: 7px 12px; border-radius: 10px; border: 1px solid var(--line); cursor: pointer; font-size: 0.92rem; background: var(--bg) }
.seg input:checked + label { background: var(--lapis-soft); border-color: var(--lapis); font-weight: 600 }
.seg input:focus-visible + label { outline: 3px solid var(--lapis); outline-offset: 2px }
.check { display: flex; align-items: center; gap: 10px; font-size: 0.95rem; cursor: pointer }
.check input { width: 18px; height: 18px; accent-color: var(--accent) }
.key { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; margin: 0; font-size: 0.92rem }
.key dt { font-weight: 600 }
.key dd { margin: 0; color: var(--muted) }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center }
textarea { width: 100%; padding: 10px 12px; border-radius: 12px; border: 2px solid var(--line); background: var(--bg); font-family: ui-monospace, monospace; font-size: 0.8rem }
.about { text-align: center }
</style>
