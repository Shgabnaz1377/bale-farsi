<script setup lang="ts">
import { APP } from '@/app.ts'
import { useMarkedText } from '@/lib/vowelMarks.ts'
/** Persian text with its transliteration underneath (or beside, when inline). */
const props = withDefaults(defineProps<{
  fa: string
  tr?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  inline?: boolean
  /** Always show the Persian, whatever the script setting (letters). */
  keepFa?: boolean
  /** Always show the transliteration (answers in feedback). */
  keepTr?: boolean
  hideTr?: boolean
}>(), { tr: '', size: 'md', inline: false, keepFa: false, keepTr: false, hideTr: false })
// Vowel marks for beginners; never when the Finglish is hidden, since the marks would give the answer away.
const shown = useMarkedText(() => props.fa, () => (props.hideTr ? '' : props.tr))
</script>

<template>
  <span class="fw" :class="[size, { inline }]">
    <span class="fa" :class="{ keep: keepFa || hideTr || !tr }" :lang="APP.target" :dir="APP.targetDir" :title="hideTr ? undefined : tr">{{ shown }}</span>
    <span v-if="tr && !hideTr" class="tr" :class="{ keep: keepTr }" :dir="APP.uiDir">{{ tr }}</span>
  </span>
</template>

<style scoped>
.fw { display: inline-flex; flex-direction: column; align-items: center; min-width: 0; max-width: 100% }
.fw.inline { flex-direction: row; align-items: baseline; gap: 0.5em; flex-wrap: wrap }
.fa { overflow-wrap: anywhere }
.tr { color: color-mix(in srgb, var(--ink) 78%, var(--bg)); overflow-wrap: anywhere; font-weight: 500 }
.sm .fa { font-size: 1.12rem; line-height: 1.55 } .sm .tr { font-size: 0.82rem }
.md .fa { font-size: 1.35rem; line-height: 1.6 } .md .tr { font-size: 0.95rem }
.lg .fa { font-size: 1.9rem; line-height: 1.6; font-weight: 600 } .lg .tr { font-size: 1.1rem }
.xl .fa { font-size: 2.8rem; line-height: 1.5; font-weight: 700 } .xl .tr { font-size: 1.3rem }
@media (max-width: 520px) { .xl .fa { font-size: 2.2rem } .lg .fa { font-size: 1.6rem } }
</style>

<style>
/* Finglish-only mode: the transliteration becomes the main text. Unscoped on purpose (needs the <html> class). */
html.mode-latin .fw .tr:not(.keep) { color: var(--ink); font-size: 1.05rem }
html.mode-latin .fw.xl .tr:not(.keep), html.mode-latin .fw.lg .tr:not(.keep) { font-size: 1.7rem; font-weight: 500 }
</style>
