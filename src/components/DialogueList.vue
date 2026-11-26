<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DialogueLine } from '@/content/types.ts'
import { hasVoice, speak, stopSpeech } from '@/lib/speech.ts'
import SpeakButton from './SpeakButton.vue'
import FaText from './FaText.vue'
import { t } from '@/i18n/index.ts'

const props = defineProps<{ lines: DialogueLine[] }>()
const showEn = ref(false)
const speakers = computed(() => [...new Set(props.lines.map((l) => l.who))])

let stop = false
const playing = ref(false)
async function playAll() {
  if (playing.value) { stop = true; stopSpeech(); return }
  playing.value = true
  stop = false
  for (const l of props.lines) {
    if (stop) break
    await speak(l.fa)
  }
  playing.value = false
}
</script>

<template>
  <div class="dlg">
    <div class="tools">
      <button v-if="hasVoice()" type="button" class="btn ghost sm" @click="playAll">{{ playing ? t('Stop') : t('Play the whole conversation') }}</button>
      <label class="check"><input v-model="showEn" type="checkbox" /> {{ t('Show English') }}</label>
    </div>
    <ol class="lines">
      <li v-for="(l, i) in lines" :key="i" :class="speakers.indexOf(l.who) % 2 ? 'b' : 'a'">
        <span class="who">{{ l.who }}</span>
        <div class="bubble">
          <SpeakButton :text="l.fa" />
          <div class="t">
            <FaText :fa="l.fa" :tr="l.tr" size="sm" />
            <span v-if="showEn" class="en">{{ l.en }}</span>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.dlg { display: flex; flex-direction: column; gap: 12px }
.tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap }
.check { display: inline-flex; gap: 8px; align-items: center; font-size: 0.92rem; cursor: pointer }
.check input { accent-color: var(--accent); width: 17px; height: 17px }
.lines { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px }
.lines li { display: flex; flex-direction: column; gap: 3px; max-width: 88% }
.lines li.b { align-self: flex-end; align-items: flex-end }
.who { font-size: 0.75rem; font-weight: 600; color: var(--muted); letter-spacing: 0.04em }
.bubble { display: flex; gap: 10px; align-items: center; background: var(--sunk); border-radius: 16px; padding: 8px 12px }
.b .bubble { background: var(--accent-soft) }
.bubble :deep(.spk) { width: 36px; height: 36px; border-radius: 10px }
.t { display: flex; flex-direction: column; align-items: flex-end; min-width: 0 }
.t :deep(.fw) { align-items: flex-end }
.en { font-size: 0.85rem; color: var(--muted) }
</style>
