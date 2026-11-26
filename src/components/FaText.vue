<script setup lang="ts">
/** Persian text with its transliteration underneath (or beside, when inline). */
withDefaults(defineProps<{
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
</script>

<template>
  <span class="fw" :class="[size, { inline }]">
    <span class="fa" :class="{ keep: keepFa || hideTr || !tr }" lang="fa" dir="rtl" :title="hideTr ? undefined : tr">{{ fa }}</span>
    <span v-if="tr && !hideTr" class="tr" :class="{ keep: keepTr }">{{ tr }}</span>
  </span>
</template>

<style scoped>
.fw { display: inline-flex; flex-direction: column; align-items: center; min-width: 0; max-width: 100% }
.fw.inline { flex-direction: row; align-items: baseline; gap: 0.5em; flex-wrap: wrap }
.fa { overflow-wrap: anywhere }
.tr { color: var(--muted); overflow-wrap: anywhere }
.sm .fa { font-size: 1.12rem; line-height: 1.55 } .sm .tr { font-size: 0.75rem }
.md .fa { font-size: 1.35rem; line-height: 1.6 } .md .tr { font-size: 0.84rem }
.lg .fa { font-size: 1.9rem; line-height: 1.6; font-weight: 600 } .lg .tr { font-size: 0.95rem }
.xl .fa { font-size: 2.8rem; line-height: 1.5; font-weight: 700 } .xl .tr { font-size: 1rem }
:global(html.mode-latin) .fw .tr:not(.keep) { color: var(--ink); font-size: 1.05rem }
:global(html.mode-latin) .fw.xl .tr:not(.keep), :global(html.mode-latin) .fw.lg .tr:not(.keep) { font-size: 1.7rem; font-weight: 500 }
@media (max-width: 520px) { .xl .fa { font-size: 2.2rem } .lg .fa { font-size: 1.6rem } }
</style>
