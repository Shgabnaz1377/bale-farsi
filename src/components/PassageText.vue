<script setup lang="ts">
import { ref } from 'vue'
import type { Phrase } from '@/content/types.ts'
import SpeakButton from './SpeakButton.vue'
import { P } from '@/lib/store.ts'
import { APP } from '@/app.ts'
import { t } from '@/i18n/index.ts'

/** A Persian reading passage. Finglish shows by default (unless the learner chose script only); English opens per paragraph. */
const props = withDefaults(defineProps<{ paragraphs: Phrase[]; compact?: boolean }>(), { compact: false })
const openTr = ref<Record<number, boolean>>(Object.fromEntries(props.paragraphs.map((_, i) => [i, P.settings.mode !== 'script'])))
const openEn = ref<Record<number, boolean>>({})
</script>

<template>
  <div class="passage" :class="{ compact }">
    <div v-for="(p, i) in paragraphs" :key="i" class="para">
      <p class="fa keep" :lang="APP.target" :dir="APP.targetDir">{{ p.fa }}</p>
      <div class="tools">
        <SpeakButton :text="p.fa" />
        <button v-if="p.tr" type="button" class="btn ghost sm" :aria-expanded="!!openTr[i]" @click="openTr[i] = !openTr[i]">{{ openTr[i] ? t('Hide Finglish') : t('Finglish') }}</button>
        <button type="button" class="btn ghost sm" :aria-expanded="!!openEn[i]" @click="openEn[i] = !openEn[i]">{{ openEn[i] ? t('Hide English') : t('English') }}</button>
      </div>
      <p v-if="openTr[i] && p.tr" class="tr-p">{{ p.tr }}</p>
      <p v-if="openEn[i]" class="en-p">{{ p.en }}</p>
    </div>
  </div>
</template>

<style scoped>
.passage { display: flex; flex-direction: column; gap: 18px }
.para { display: flex; flex-direction: column; gap: 8px }
.para .fa { font-size: 1.3rem; line-height: 2; text-align: start }
.compact .para .fa { font-size: 1.12rem; line-height: 1.9 }
.tools { display: flex; gap: 8px; align-items: center; flex-wrap: wrap }
.tools :deep(.spk) { width: 38px; height: 38px; border-radius: 11px }
.tr-p { color: var(--ink); font-size: 0.98rem; line-height: 1.7 }
.en-p { font-size: 0.95rem; border-inline-start: 3px solid var(--accent); padding-inline-start: 10px }
</style>
