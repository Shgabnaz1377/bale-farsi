<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { lessonsOf, levelOf, unitById } from '@/content/course.ts'
import { P, lessonUnlocked, unitDone, unitProgress, unitUnlocked } from '@/lib/store.ts'
import AppIcon from '@/components/AppIcon.vue'
import FaText from '@/components/FaText.vue'
import SpeakButton from '@/components/SpeakButton.vue'
import StarNode from '@/components/StarNode.vue'
import MeowCat from '@/components/MeowCat.vue'
import { t } from '@/i18n/index.ts'
import RichText from '@/components/RichText.vue'
import DialogueList from '@/components/DialogueList.vue'
import PassageText from '@/components/PassageText.vue'
import { provideFaLevel } from '@/lib/vowelMarks.ts'
import CastFace from '@/components/CastFace.vue'
import FoldSection from '@/components/FoldSection.vue'
import { sentenceSpeaker } from '@/content/sentenceSpeakers.ts'
import type { Phrase } from '@/content/types.ts'

const props = defineProps<{ id: string }>()
const router = useRouter()
const unit = computed(() => unitById.get(props.id))
provideFaLevel(computed(() => unit.value?.level))
// Who says each grammar example and sentence (the same speaker and voice as in the lessons).
const said = (p: Phrase) => (unit.value ? sentenceSpeaker(p, unit.value.id) : undefined)
const lessons = computed(() => (unit.value ? lessonsOf(unit.value) : []))
const faNum = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

const firstOpen = computed(() => lessons.value.find((l) => !P.done[l.key] && unit.value && lessonUnlocked(unit.value, l.key))?.key)
function state(key: string) {
  if (P.done[key]) return 'done' as const
  if (!unit.value || !lessonUnlocked(unit.value, key)) return 'locked' as const
  return key === firstOpen.value ? 'current' as const : 'open' as const
}
/** The sticky button: the first open lesson, or the first one again once the unit is done. */
const startKey = computed(() => firstOpen.value ?? (unit.value && unitDone(unit.value) ? lessons.value[0]?.key : undefined))
const startLabel = computed(() => {
  if (!unit.value) return ''
  if (unitDone(unit.value)) return t('Practise again')
  return unitProgress(unit.value) > 0 ? t('Continue') : t('Start')
})
function go(key: string) {
  const [u, k] = key.split('/')
  router.push({ name: 'lesson', query: { u, k } })
}
</script>

<template>
  <main v-if="unit" class="wrap page unit-page">
    <RouterLink to="/" class="back"><AppIcon name="arrow" /> {{ unit.level }} · {{ levelOf(unit).name }}</RouterLink>

    <section class="card head">
      <div class="head-row">
        <div class="head-text">
          <h1>{{ unit.title }} <FaText :fa="unit.fa" :tr="unit.tr" size="sm" inline keep-tr class="u-fa" /></h1>
          <p class="muted small">{{ unit.can }}</p>
        </div>
        <span class="head-side">
          <MeowCat :mood="unitDone(unit) ? 'cheer' : unitUnlocked(unit) ? 'wave' : 'sleep'" :size="56" />
        </span>
      </div>
      <p v-if="!unitUnlocked(unit)" class="tip"><b>{{ t('Locked.') }}</b> {{ t('Finish the unit before this one, or pass the {level} level test. You can still read everything below.', { level: unit.level }) }}</p>
      <ol class="nodes">
        <StarNode v-for="(l, i) in lessons" :key="l.key" :state="state(l.key)" :number="faNum(i + 1)" :label="P.done[l.key] ? t('{name}, finished', { name: l.name }) : l.name" @go="go(l.key)">{{ l.name }}</StarNode>
      </ol>
    </section>

    <FoldSection :title="t('Tip')" open>
      <RichText :html="unit.tip" class="tip-text" />
    </FoldSection>

    <FoldSection>
      <template #title>{{ t('Grammar') }}: {{ unit.grammar.title }}</template>
      <RichText :html="unit.grammar.body" />
      <ul class="list">
        <li v-for="(e, i) in unit.grammar.examples" :key="i">
          <CastFace v-if="said(e)" :name="said(e)!.name" kind="avatar" :text="e.fa" :voice="said(e)!.gender" />
          <SpeakButton :text="e.fa" :voice="said(e)?.gender" />
          <span class="col"><FaText :fa="e.fa" :tr="e.tr" inline keep-tr /><span class="muted small">{{ e.en }}</span></span>
        </li>
      </ul>
    </FoldSection>

    <FoldSection :title="t('Words')" :badge="unit.words.length">
      <ul class="words">
        <li v-for="w in unit.words" :key="w.fa">
          <span class="btns"><SpeakButton :text="w.fa" /><SpeakButton :text="w.fa" slow /></span>
          <span class="col">
            <FaText :fa="w.fa" :tr="w.tr" inline keep-tr size="sm" />
            <span class="small">{{ w.en }}<span v-if="w.digit" class="fa keep digit" lang="fa"> {{ w.digit }}</span></span>
          </span>
        </li>
      </ul>
    </FoldSection>

    <FoldSection :title="t('Sentences')" :badge="unit.sentences.length">
      <ul class="list">
        <li v-for="(s, i) in unit.sentences" :key="i">
          <CastFace v-if="said(s)" :name="said(s)!.name" kind="avatar" :text="s.fa" :voice="said(s)!.gender" />
          <SpeakButton :text="s.fa" :voice="said(s)?.gender" />
          <span class="col"><FaText :fa="s.fa" :tr="s.tr" inline keep-tr /><span class="muted small">{{ s.en }}</span></span>
        </li>
      </ul>
    </FoldSection>

    <FoldSection v-if="unit.dialogue?.length" :title="t('Dialogue')">
      <DialogueList :lines="unit.dialogue" :unit-id="unit.id" />
    </FoldSection>

    <FoldSection v-if="unit.reading">
      <template #title>{{ t('Reading') }}: {{ unit.reading.title }}</template>
      <PassageText :paragraphs="unit.reading.paragraphs" />
    </FoldSection>

    <div v-if="unitUnlocked(unit) && startKey" class="start-bar">
      <button type="button" class="btn primary start" @click="go(startKey)">{{ startLabel }} <span class="start-sub">{{ lessons.find((l) => l.key === startKey)?.name }}</span></button>
    </div>
  </main>
  <main v-else class="wrap page">
    <h1>{{ t('Unit not found') }}</h1>
    <RouterLink to="/">{{ t('Back to the course') }}</RouterLink>
  </main>
</template>

<style scoped>
.unit-page { gap: 10px; padding-top: 12px; padding-bottom: calc(var(--tab-h) + 16px) }
.back { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; font-weight: 500; font-size: 0.92rem }
.back:hover { color: var(--ink) }
.head { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px }
.head-row { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start }
.head-text { min-width: 0 }
.head h1 { font-size: 1.5rem; font-weight: 800; display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px }
.u-fa :deep(.fa) { color: var(--accent) }
.head-side { display: flex; align-items: center; gap: 8px; flex: none }
.nodes { list-style: none; margin: 0; padding: 4px 0 0; display: flex; justify-content: space-between; gap: 4px }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px }
.list li, .words li { display: flex; align-items: center; gap: 12px }
.col { display: flex; flex-direction: column; min-width: 0 }
.words { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px 16px }
.words :deep(.spk), .list :deep(.spk) { width: 36px; height: 36px; border-radius: 10px }
.digit { font-size: 1.05em }
.tip-text { font-size: 0.95rem; color: var(--muted) }
.tip-text :deep(i), .tip-text :deep(b) { color: var(--ink) }
.btns { display: flex; flex-direction: column; gap: 4px }
.btns :deep(.spk + .spk) { width: 36px; height: 26px; border-radius: 8px; opacity: 0.85 }
/* Start / Continue stays in reach at the bottom of the screen, above the tab bar. */
.start-bar { position: sticky; bottom: calc(var(--tab-h) + 10px); z-index: 5; margin-top: 4px; padding-top: 6px }
.start { width: 100%; box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.18), 0 10px 24px -10px rgba(10, 123, 122, 0.6) }
.start-sub { font-weight: 500; opacity: 0.85 }
.start-sub::before { content: '· ' }
@media (max-width: 520px) {
  .head h1 { font-size: 1.3rem }
}
</style>
