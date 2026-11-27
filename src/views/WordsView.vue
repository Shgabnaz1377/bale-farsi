<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import type { Level } from '@/content/types.ts'
import { ALL_WORDS, LEVELS } from '@/content/course.ts'
import { APP } from '@/app.ts'
import { P } from '@/lib/store.ts'
import { isLearned } from '@/lib/srs.ts'
import { buildIndex, searchRows, translateUrl, type Indexed, type SearchRow } from '@/lib/wordSearch.ts'
import { t } from '@/i18n/index.ts'
import FaText from '@/components/FaText.vue'
import SpeakButton from '@/components/SpeakButton.vue'

/** Rows rendered at first, and added by each "Show more". */
const PAGE = 50

const query = ref('')
const level = ref<Level | 'all' | 'dict'>('all')
const onlyMine = ref(false)
const limit = ref(PAGE)

/** The dictionary (PersianMeow only) is a separate chunk, fetched when the page opens. */
const hasDictionary = APP.id === 'persianmeow'
const dictCount = ref(0)
const loading = ref(hasDictionary)
const loadFailed = ref(false)
const index = shallowRef<Indexed[]>(buildIndex(ALL_WORDS, []))

onMounted(async () => {
  if (!hasDictionary) return
  try {
    const { DICTIONARY } = await import('@/content/dictionary/index.ts')
    index.value = buildIndex(ALL_WORDS, DICTIONARY)
    dictCount.value = index.value.filter((r) => r.row.dict).length
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
})

const levels = computed(() => ['all', ...LEVELS.map((x) => x.level), ...(hasDictionary ? ['dict'] : [])] as const)
const levelLabel = (l: string) => (l === 'all' ? t('All') : l === 'dict' ? t('Dictionary') : l)

const keep = (r: SearchRow) =>
  (level.value === 'all' || (level.value === 'dict' ? r.dict : r.level === level.value)) &&
  (!onlyMine.value || (!!r.cardKey && !!P.cards[r.cardKey]))

const rows = computed(() => searchRows(index.value, query.value, keep))
const shown = computed(() => rows.value.slice(0, limit.value))
watch([query, level, onlyMine], () => { limit.value = PAGE })

const q = computed(() => query.value.trim())
const status = (r: SearchRow) => {
  const c = r.cardKey ? P.cards[r.cardKey] : undefined
  if (!c) return null
  return isLearned(c) ? 'learned' : 'learning'
}
</script>

<template>
  <main class="wrap page">
    <div>
      <h1>{{ t('Words') }}</h1>
      <p class="muted">{{ t('{n} words across A1 to B2. Search in English, Finglish or Persian.', { n: ALL_WORDS.length }) }}</p>
      <p v-if="dictCount" class="muted small">{{ t('The dictionary adds {n} common words, open to everyone.', { n: dictCount }) }}</p>
    </div>
    <div class="filters card">
      <label class="sr-only" for="word-search">{{ t('Search words') }}</label>
      <input id="word-search" v-model="query" type="search" :placeholder="t('Search: water, âb, آب')" autocomplete="off" />
      <div class="seg" role="radiogroup" :aria-label="t('Level')">
        <template v-for="l in levels" :key="l">
          <input :id="'lvl-' + l" v-model="level" type="radio" name="lvl" :value="l" />
          <label :for="'lvl-' + l">{{ levelLabel(l) }}</label>
        </template>
      </div>
      <label class="check"><input id="only-mine" v-model="onlyMine" type="checkbox" /> {{ t('Only words I have met') }}</label>
    </div>
    <p class="muted small" aria-live="polite">
      {{ t('{n} shown', { n: rows.length }) }}
      <template v-if="loading">· {{ t('Loading the dictionary…') }}</template>
      <template v-else-if="loadFailed">· {{ t('The dictionary could not be loaded.') }}</template>
    </p>
    <ul class="list">
      <li v-for="r in shown" :key="r.key" class="row" :data-dict="r.dict ? '' : undefined">
        <span class="w-spk"><SpeakButton :text="r.fa" /></span>
        <FaText :fa="r.fa" :tr="r.tr" size="sm" inline keep-tr class="w-fa" />
        <span class="w-en">{{ r.alt?.length ? `${r.en}; ${r.alt.join('; ')}` : r.en }}</span>
        <span class="w-meta">
          <span v-if="r.level" class="chip">{{ r.level }}</span>
          <span v-else class="chip lapis">{{ t('Dictionary') }}</span>
          <span v-if="status(r)" class="chip" :class="status(r) === 'learned' ? 'accent' : 'saffron'">{{ t(status(r)!) }}</span>
        </span>
        <div v-if="r.stem || r.ex" class="w-more">
          <p v-if="r.stem" class="small muted">{{ t('Present stem') }}: <FaText :fa="r.stem.fa" :tr="r.stem.tr" size="sm" inline keep-tr /></p>
          <p v-if="r.ex" class="w-ex small">
            <FaText :fa="r.ex.fa" :tr="r.ex.tr" size="sm" inline keep-tr />
            <span class="muted">{{ r.ex.en }}</span>
          </p>
        </div>
      </li>
    </ul>
    <button v-if="rows.length > shown.length" type="button" class="btn ghost sm more" @click="limit += PAGE">
      {{ t('Show more ({n} left)', { n: rows.length - shown.length }) }}
    </button>
    <p v-if="q" class="translate card" :class="{ empty: !rows.length }">
      <span v-if="!rows.length">{{ t('No words found for “{q}”.', { q }) }}</span>
      <a :href="translateUrl(q)" target="_blank" rel="noopener noreferrer" :title="t('Opens Google Translate in a new tab')">
        {{ t('Not in the dictionary? Translate it') }} ↗
      </a>
    </p>
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
.row { display: grid; grid-template-columns: auto minmax(0, 1.2fr) minmax(0, 1fr) auto; align-items: center; gap: 4px 12px; padding: 8px 0; border-bottom: 1px solid var(--line) }
.w-spk { width: 36px; min-height: 1px }
.row :deep(.spk) { width: 36px; height: 36px; border-radius: 10px }
.w-en { overflow-wrap: anywhere }
.w-meta { display: flex; gap: 6px }
.w-more { grid-column: 2 / -1; display: flex; flex-direction: column; gap: 2px }
.w-more p { margin: 0 }
.w-ex { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline }
.more { align-self: center }
.translate { display: flex; flex-direction: column; gap: 6px; margin: 0 }
.translate a { color: var(--lapis); font-weight: 600 }
@media (max-width: 520px) { .row { grid-template-columns: auto minmax(0, 1fr); } .w-en { grid-column: 2 } .w-meta { grid-column: 2 } .w-more { grid-column: 2 } }
</style>
