<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { lessonsOf, levelOf, unitById } from '@/content/course.ts'
import { P, lessonUnlocked, unitDone, unitUnlocked } from '@/lib/store.ts'
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
function go(key: string) {
  const [u, k] = key.split('/')
  router.push({ name: 'lesson', query: { u, k } })
}
</script>

<template>
  <main v-if="unit" class="wrap page">
    <RouterLink to="/" class="back"><AppIcon name="arrow" /> {{ unit.level }} · {{ levelOf(unit).name }}</RouterLink>

    <section class="card head">
      <div class="head-row">
        <div>
          <h1>{{ unit.title }}</h1>
          <p class="muted">{{ unit.can }}</p>
        </div>
        <span class="head-side">
          <FaText :fa="unit.fa" :tr="unit.tr" size="lg" keep-tr class="u-fa" />
          <MeowCat :mood="unitDone(unit) ? 'cheer' : unitUnlocked(unit) ? 'wave' : 'sleep'" :size="76" />
        </span>
      </div>
      <RichText :html="'<b>' + t('Tip.') + '</b> ' + unit.tip" class="tip" />
      <p v-if="!unitUnlocked(unit)" class="tip"><b>{{ t('Locked.') }}</b> {{ t('Finish the unit before this one, or pass the {level} level test. You can still read everything below.', { level: unit.level }) }}</p>
      <ol class="nodes">
        <StarNode v-for="(l, i) in lessons" :key="l.key" :state="state(l.key)" :number="faNum(i + 1)" :label="P.done[l.key] ? t('{name}, finished', { name: l.name }) : l.name" @go="go(l.key)">{{ l.name }}</StarNode>
      </ol>
    </section>

    <section class="card block">
      <h2>{{ t('Grammar') }}: {{ unit.grammar.title }}</h2>
      <RichText :html="unit.grammar.body" />
      <ul class="list">
        <li v-for="(e, i) in unit.grammar.examples" :key="i">
          <CastFace v-if="said(e)" :name="said(e)!.name" kind="avatar" :text="e.fa" :voice="said(e)!.gender" />
          <SpeakButton :text="e.fa" :voice="said(e)?.gender" />
          <span class="col"><FaText :fa="e.fa" :tr="e.tr" inline keep-tr /><span class="muted small">{{ e.en }}</span></span>
        </li>
      </ul>
    </section>

    <section class="card block">
      <h2>{{ t('Words') }}</h2>
      <ul class="words">
        <li v-for="w in unit.words" :key="w.fa">
          <span class="btns"><SpeakButton :text="w.fa" /><SpeakButton :text="w.fa" slow /></span>
          <span class="col">
            <FaText :fa="w.fa" :tr="w.tr" inline keep-tr size="sm" />
            <span class="small">{{ w.en }}<span v-if="w.digit" class="fa keep digit" lang="fa"> {{ w.digit }}</span></span>
          </span>
        </li>
      </ul>
    </section>

    <section class="card block">
      <h2>{{ t('Sentences') }}</h2>
      <ul class="list">
        <li v-for="(s, i) in unit.sentences" :key="i">
          <CastFace v-if="said(s)" :name="said(s)!.name" kind="avatar" :text="s.fa" :voice="said(s)!.gender" />
          <SpeakButton :text="s.fa" :voice="said(s)?.gender" />
          <span class="col"><FaText :fa="s.fa" :tr="s.tr" inline keep-tr /><span class="muted small">{{ s.en }}</span></span>
        </li>
      </ul>
    </section>

    <section v-if="unit.dialogue?.length" class="card block">
      <h2>{{ t('Dialogue') }}</h2>
      <DialogueList :lines="unit.dialogue" :unit-id="unit.id" />
    </section>

    <section v-if="unit.reading" class="card block">
      <h2>{{ t('Reading') }}: {{ unit.reading.title }}</h2>
      <PassageText :paragraphs="unit.reading.paragraphs" />
    </section>
  </main>
  <main v-else class="wrap page">
    <h1>{{ t('Unit not found') }}</h1>
    <RouterLink to="/">{{ t('Back to the course') }}</RouterLink>
  </main>
</template>

<style scoped>
.back { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; font-weight: 500; font-size: 0.92rem }
.back:hover { color: var(--ink) }
.head { display: flex; flex-direction: column; gap: 14px }
.head-row { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap }
.head h1 { font-size: 1.8rem; font-weight: 800 }
.u-fa :deep(.fa) { color: var(--accent) }
.head-side { display: flex; align-items: center; gap: 12px }
.nodes { list-style: none; margin: 0; padding: 6px 0 0; display: flex; justify-content: space-between; gap: 4px }
.block { display: flex; flex-direction: column; gap: 12px }
.block h2 { font-size: 1.15rem; font-weight: 800 }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px }
.list li, .words li { display: flex; align-items: center; gap: 12px }
.col { display: flex; flex-direction: column; min-width: 0 }
.words { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px 16px }
.words :deep(.spk), .list :deep(.spk) { width: 36px; height: 36px; border-radius: 10px }
.digit { font-size: 1.05em }
.btns { display: flex; flex-direction: column; gap: 4px }
.btns :deep(.spk + .spk) { width: 36px; height: 26px; border-radius: 8px; opacity: 0.85 }
</style>
