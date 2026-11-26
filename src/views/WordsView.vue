<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Level } from '@/content/types.ts'
import { ALL_WORDS, LEVELS } from '@/content/course.ts'
import { P } from '@/lib/store.ts'
import { isLearned } from '@/lib/srs.ts'
import FaText from '@/components/FaText.vue'
import SpeakButton from '@/components/SpeakButton.vue'

const query = ref('')
const level = ref<Level | 'all'>('all')
const onlyMine = ref(false)

const fold = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
const rows = computed(() => {
  const q = fold(query.value.trim())
  return ALL_WORDS.filter((r) =>
    (level.value === 'all' || r.unit.level === level.value) &&
    (!onlyMine.value || P.cards[r.key]) &&
    (!q || fold(r.word.en).includes(q) || fold(r.word.tr).includes(q) || r.word.fa.includes(query.value.trim())),
  )
})
const status = (key: string) => {
  const c = P.cards[key]
  if (!c) return null
  return isLearned(c) ? 'learned' : 'learning'
}
</script>

<template>
  <main class="wrap page">
    <div>
      <h1>Words</h1>
      <p class="muted">{{ ALL_WORDS.length }} words across A1 to B2. Search in English, Latin letters or Persian.</p>
    </div>
    <div class="filters card">
      <label class="sr-only" for="word-search">Search words</label>
      <input id="word-search" v-model="query" type="search" placeholder="Search: water, âb, آب" autocomplete="off" />
      <div class="seg" role="radiogroup" aria-label="Level">
        <template v-for="l in ['all', ...LEVELS.map((x) => x.level)]" :key="l">
          <input :id="'lvl-' + l" v-model="level" type="radio" name="lvl" :value="l" />
          <label :for="'lvl-' + l">{{ l === 'all' ? 'All' : l }}</label>
        </template>
      </div>
      <label class="check"><input id="only-mine" v-model="onlyMine" type="checkbox" /> Only words I have met</label>
    </div>
    <p class="muted small">{{ rows.length }} shown</p>
    <ul class="list">
      <li v-for="r in rows" :key="r.key" class="row">
        <SpeakButton :text="r.word.fa" />
        <FaText :fa="r.word.fa" :tr="r.word.tr" size="sm" inline keep-tr class="w-fa" />
        <span class="w-en">{{ r.word.en }}</span>
        <span class="w-meta">
          <span class="chip">{{ r.unit.level }}</span>
          <span v-if="status(r.key)" class="chip" :class="status(r.key) === 'learned' ? 'accent' : 'saffron'">{{ status(r.key) }}</span>
        </span>
      </li>
    </ul>
  </main>
</template>

<style scoped>
h1 { font-size: 1.7rem; font-weight: 800 }
.filters { display: flex; flex-direction: column; gap: 12px }
input[type='search'] { width: 100%; padding: 12px 14px; border-radius: 12px; border: 2px solid var(--line); background: var(--bg); font-size: 1rem }
input[type='search']:focus { border-color: var(--lapis); outline: none }
.seg { display: flex; flex-wrap: wrap; gap: 6px }
.seg input { position: absolute; opacity: 0; pointer-events: none }
.seg label { padding: 6px 12px; border-radius: 10px; border: 1px solid var(--line); cursor: pointer; font-size: 0.9rem; background: var(--bg) }
.seg input:checked + label { background: var(--lapis-soft); border-color: var(--lapis); font-weight: 600 }
.seg input:focus-visible + label { outline: 3px solid var(--lapis); outline-offset: 2px }
.check { display: inline-flex; gap: 8px; align-items: center; font-size: 0.92rem; cursor: pointer }
.check input { accent-color: var(--accent); width: 17px; height: 17px }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column }
.row { display: grid; grid-template-columns: auto minmax(0, 1.2fr) minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line) }
.row :deep(.spk) { width: 36px; height: 36px; border-radius: 10px }
.w-en { overflow-wrap: anywhere }
.w-meta { display: flex; gap: 6px }
@media (max-width: 520px) { .row { grid-template-columns: auto minmax(0, 1fr); } .w-en { grid-column: 2 } .w-meta { grid-column: 2 } }
</style>
