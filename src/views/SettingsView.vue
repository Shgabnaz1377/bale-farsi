<script setup lang="ts">
import { ref } from 'vue'
import { P, exportProgress, importProgress, resetProgress } from '@/lib/store.ts'
import { faVoice } from '@/lib/speech.ts'

const modes = [['both', 'Script + Latin'], ['script', 'Persian script only'], ['latin', 'Latin letters only']] as const
const themes = [['system', 'Match system'], ['light', 'Light'], ['dark', 'Dark']] as const
const goals = [10, 20, 30, 50] as const

const backup = ref('')
const backupMsg = ref('')
const confirmReset = ref(false)

async function copyBackup() {
  backup.value = exportProgress()
  try {
    await navigator.clipboard.writeText(backup.value)
    backupMsg.value = 'Copied. Paste it into the box on another device and press Restore.'
  } catch {
    backupMsg.value = 'Copy the text in the box below by hand.'
  }
}
function restore() {
  backupMsg.value = importProgress(backup.value) ? 'Progress restored.' : 'That text is not a Bale backup. Copy it again from the other device.'
}
</script>

<template>
  <main class="wrap page">
    <h1>Settings</h1>

    <section class="card block">
      <h2>Show Persian as</h2>
      <div class="seg" role="radiogroup" aria-label="Show Persian as">
        <template v-for="[v, label] in modes" :key="v">
          <input :id="'mode-' + v" v-model="P.settings.mode" type="radio" name="mode" :value="v" />
          <label :for="'mode-' + v">{{ label }}</label>
        </template>
      </div>
      <p class="muted small">Start with both. Switch to script only when you can read the letters, so you stop leaning on the Latin.</p>
    </section>

    <section class="card block">
      <h2>Lessons</h2>
      <p class="eyebrow">Daily goal</p>
      <div class="seg" role="radiogroup" aria-label="Daily goal">
        <template v-for="g in goals" :key="g">
          <input :id="'goal-' + g" v-model="P.settings.goal" type="radio" name="goal" :value="g" />
          <label :for="'goal-' + g">{{ g }} XP</label>
        </template>
      </div>
      <label class="check"><input id="relaxed" v-model="P.settings.relaxed" type="checkbox" /> Relaxed mode: no hearts, mistakes cost nothing</label>
      <label class="check"><input id="sfx" v-model="P.settings.sfx" type="checkbox" /> Sound effects</label>
      <label class="check"><input id="autoplay" v-model="P.settings.autoplay" type="checkbox" /> Read Persian aloud automatically</label>
      <p class="muted small">
        <template v-if="faVoice">Audio uses the voice “{{ faVoice.name }}”.</template>
        <template v-else>Audio needs a Persian (fa-IR) voice. Microsoft Edge has one built in. Elsewhere, add a Persian voice in your system's speech settings and reload.</template>
      </p>
    </section>

    <section class="card block">
      <h2>Appearance</h2>
      <div class="seg" role="radiogroup" aria-label="Theme">
        <template v-for="[v, label] in themes" :key="v">
          <input :id="'theme-' + v" v-model="P.settings.theme" type="radio" name="theme" :value="v" />
          <label :for="'theme-' + v">{{ label }}</label>
        </template>
      </div>
    </section>

    <section class="card block">
      <h2>Reading the Latin letters</h2>
      <dl class="key">
        <dt>â</dt><dd>long a, as in “father”</dd>
        <dt>a</dt><dd>short a, as in “cat”</dd>
        <dt>e</dt><dd>as in “bed”</dd>
        <dt>o</dt><dd>short o, as in “go” said quickly</dd>
        <dt>u / i</dt><dd>as in “food” / “see”</dd>
        <dt>kh</dt><dd>rough throat sound, as in Scottish “loch”</dd>
        <dt>gh</dt><dd>a gargled g, deep in the throat</dd>
        <dt>zh</dt><dd>the s in “measure”</dd>
        <dt>'</dt><dd>a short catch in the voice (glottal stop)</dd>
        <dt>-e / -ye</dt><dd>the ezâfe, linking words: ketâb-e man, “my book”</dd>
      </dl>
    </section>

    <section class="card block">
      <h2>Your progress</h2>
      <p class="muted small">Progress is saved in this browser only. To move it to another device, copy a backup here and restore it there.</p>
      <div class="row">
        <button type="button" class="btn ghost sm" @click="copyBackup">Copy backup</button>
        <button type="button" class="btn ghost sm" :disabled="!backup.trim()" @click="restore">Restore from box</button>
      </div>
      <label class="sr-only" for="backup">Backup text</label>
      <textarea id="backup" v-model="backup" rows="3" placeholder="Paste a backup here to restore it"></textarea>
      <p v-if="backupMsg" class="small" role="status">{{ backupMsg }}</p>
      <div class="row">
        <template v-if="!confirmReset">
          <button type="button" class="btn ghost sm" @click="confirmReset = true">Reset progress</button>
        </template>
        <template v-else>
          <span class="small">This erases XP, streak, finished lessons and review history.</span>
          <button type="button" class="btn danger sm" @click="resetProgress(); confirmReset = false">Erase progress</button>
          <button type="button" class="btn ghost sm" @click="confirmReset = false">Keep it</button>
        </template>
      </div>
    </section>

    <p class="muted small about">
      Bale is free and open source. The course content was written with AI help and is being reviewed by native speakers; if you spot a mistake,
      <a href="https://github.com/Shgabnaz1377/bale-farsi/issues" target="_blank" rel="noopener">open an issue on GitHub</a>.
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
