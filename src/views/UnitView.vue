<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { lessonsOf, levelOf, unitById } from '@/content/course.ts'
import { P, lessonUnlocked, unitUnlocked } from '@/lib/store.ts'
import AppIcon from '@/components/AppIcon.vue'
import FaText from '@/components/FaText.vue'
import SpeakButton from '@/components/SpeakButton.vue'
import StarNode from '@/components/StarNode.vue'
import RichText from '@/components/RichText.vue'
import DialogueList from '@/components/DialogueList.vue'
import PassageText from '@/components/PassageText.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const unit = computed(() => unitById.get(props.id))
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
        <FaText :fa="unit.fa" :tr="unit.tr" size="lg" keep-tr class="u-fa" />
      </div>
      <RichText :html="'<b>Tip.</b> ' + unit.tip" class="tip" />
      <p v-if="!unitUnlocked(unit)" class="tip"><b>Locked.</b> Finish the unit before this one, or pass the {{ unit.level }} level test. You can still read everything below.</p>
      <ol class="nodes">
        <StarNode v-for="(l, i) in lessons" :key="l.key" :state="state(l.key)" :number="faNum(i + 1)" :label="`${l.name}${P.done[l.key] ? ', finished' : ''}`" @go="go(l.key)">{{ l.name }}</StarNode>
      </ol>
    </section>

    <section class="card block">
      <h2>Grammar: {{ unit.grammar.title }}</h2>
      <RichText :html="unit.grammar.body" />
      <ul class="list">
        <li v-for="(e, i) in unit.grammar.examples" :key="i">
          <SpeakButton :text="e.fa" />
          <span class="col"><FaText :fa="e.fa" :tr="e.tr" inline keep-tr /><span class="muted small">{{ e.en }}</span></span>
        </li>
      </ul>
    </section>

    <section class="card block">
      <h2>Words</h2>
      <ul class="words">
        <li v-for="w in unit.words" :key="w.fa">
          <SpeakButton :text="w.fa" />
          <span class="col">
            <FaText :fa="w.fa" :tr="w.tr" inline keep-tr size="sm" />
            <span class="small">{{ w.en }}<span v-if="w.digit" class="fa keep digit" lang="fa"> {{ w.digit }}</span></span>
          </span>
        </li>
      </ul>
    </section>

    <section class="card block">
      <h2>Sentences</h2>
      <ul class="list">
        <li v-for="(s, i) in unit.sentences" :key="i">
          <SpeakButton :text="s.fa" />
          <span class="col"><FaText :fa="s.fa" :tr="s.tr" inline keep-tr /><span class="muted small">{{ s.en }}</span></span>
        </li>
      </ul>
    </section>

    <section v-if="unit.dialogue?.length" class="card block">
      <h2>Dialogue</h2>
      <DialogueList :lines="unit.dialogue" />
    </section>

    <section v-if="unit.reading" class="card block">
      <h2>Reading: {{ unit.reading.title }}</h2>
      <PassageText :paragraphs="unit.reading.paragraphs" />
    </section>
  </main>
  <main v-else class="wrap page">
    <h1>Unit not found</h1>
    <RouterLink to="/">Back to the course</RouterLink>
  </main>
</template>

<style scoped>
.back { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; font-weight: 500; font-size: 0.92rem }
.back:hover { color: var(--ink) }
.head { display: flex; flex-direction: column; gap: 14px }
.head-row { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap }
.head h1 { font-size: 1.8rem; font-weight: 800 }
.u-fa :deep(.fa) { color: var(--accent) }
.nodes { list-style: none; margin: 0; padding: 6px 0 0; display: flex; justify-content: space-between; gap: 4px }
.block { display: flex; flex-direction: column; gap: 12px }
.block h2 { font-size: 1.15rem; font-weight: 800 }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px }
.list li, .words li { display: flex; align-items: center; gap: 12px }
.col { display: flex; flex-direction: column; min-width: 0 }
.words { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px 16px }
.words :deep(.spk), .list :deep(.spk) { width: 36px; height: 36px; border-radius: 10px }
.digit { font-size: 1.05em }
</style>
