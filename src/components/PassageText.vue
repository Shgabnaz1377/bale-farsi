<script setup lang="ts">
import { ref } from 'vue'
import type { Phrase } from '@/content/types.ts'
import SpeakButton from './SpeakButton.vue'

/** A Persian reading passage. Transliteration and translation open per paragraph. */
withDefaults(defineProps<{ paragraphs: Phrase[]; compact?: boolean }>(), { compact: false })
const openTr = ref<Record<number, boolean>>({})
const openEn = ref<Record<number, boolean>>({})
</script>

<template>
  <div class="passage" :class="{ compact }">
    <div v-for="(p, i) in paragraphs" :key="i" class="para">
      <p class="fa keep" lang="fa" dir="rtl">{{ p.fa }}</p>
      <div class="tools">
        <SpeakButton :text="p.fa" />
        <button type="button" class="btn ghost sm" :aria-expanded="!!openTr[i]" @click="openTr[i] = !openTr[i]">Latin letters</button>
        <button type="button" class="btn ghost sm" :aria-expanded="!!openEn[i]" @click="openEn[i] = !openEn[i]">English</button>
      </div>
      <p v-if="openTr[i]" class="tr-p">{{ p.tr }}</p>
      <p v-if="openEn[i]" class="en-p">{{ p.en }}</p>
    </div>
  </div>
</template>

<style scoped>
.passage { display: flex; flex-direction: column; gap: 18px }
.para { display: flex; flex-direction: column; gap: 8px }
.para .fa { font-size: 1.3rem; line-height: 2; text-align: right }
.compact .para .fa { font-size: 1.12rem; line-height: 1.9 }
.tools { display: flex; gap: 8px; align-items: center; flex-wrap: wrap }
.tools :deep(.spk) { width: 38px; height: 38px; border-radius: 11px }
.tr-p { color: var(--muted); font-size: 0.92rem }
.en-p { font-size: 0.95rem; border-left: 3px solid var(--accent); padding-left: 10px }
</style>
