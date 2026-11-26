<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Level } from '@/content/types.ts'
import { LESSON_NAMES, LEVELS, unitById, type LessonKind } from '@/content/course.ts'
import { LETTER_GROUPS } from '@/content/alphabet.ts'
import {
  alphabetLesson, grade, levelTest, reviewLesson, unitLesson, TEST_PASS, type Answer, type Ex, type Grade,
} from '@/lib/exercises.ts'
import {
  P, addXp, dueWords, gainHeart, hasSeen, loseHeart, outOfHearts, recordCard, rollDay, weakWords, MAX_HEARTS,
} from '@/lib/store.ts'
import { hasVoice, speak, stopSpeech } from '@/lib/speech.ts'
import { chime } from '@/lib/sfx.ts'
import AppIcon from '@/components/AppIcon.vue'
import FaText from '@/components/FaText.vue'
import RichText from '@/components/RichText.vue'
import ChoiceEx from '@/components/ex/ChoiceEx.vue'
import MatchEx from '@/components/ex/MatchEx.vue'
import BuildEx from '@/components/ex/BuildEx.vue'
import TypeEx from '@/components/ex/TypeEx.vue'
import CardEx from '@/components/ex/CardEx.vue'

type Mode = 'lesson' | 'review' | 'test'
const route = useRoute()
const router = useRouter()

rollDay()

/* ---------- What this session is ---------- */
const q = route.query
const unit = typeof q.u === 'string' ? unitById.get(q.u) : undefined
const kind = (typeof q.k === 'string' ? q.k : '') as LessonKind
const alpha = typeof q.alpha === 'string' ? Number(q.alpha) : NaN
const testLevel = (typeof q.test === 'string' ? q.test : '') as Level
const mode: Mode = q.review ? 'review' : testLevel ? 'test' : 'lesson'

let doneKey = ''
let title = ''
let queue: Ex[] = []
const opts = { hasVoice: hasVoice(), seen: hasSeen }

if (mode === 'review') {
  const due = dueWords(12)
  queue = reviewLesson(due.length ? due : weakWords(10), opts)
  title = due.length ? 'Review' : 'Practice'
} else if (mode === 'test') {
  queue = levelTest(testLevel)
  title = `${testLevel} level test`
} else if (unit && LESSON_NAMES[kind]) {
  queue = unitLesson(unit, kind, opts)
  doneKey = `${unit.id}/${kind}`
  title = `${unit.title} · ${LESSON_NAMES[kind]}`
} else if (!Number.isNaN(alpha) && LETTER_GROUPS[alpha]) {
  queue = alphabetLesson(alpha)
  doneKey = `alphabet/${alpha}`
  title = `Alphabet · ${LETTER_GROUPS[alpha].title}`
}
const usesHearts = mode === 'lesson'
const total = queue.length

/* ---------- Runner state ---------- */
type Phase = 'run' | 'done' | 'hearts' | 'empty'
const phase = ref<Phase>(!queue.length ? 'empty' : usesHearts && outOfHearts() ? 'hearts' : 'run')
const current = shallowRef<Ex | null>(null)
const answer = ref<Answer>(null)
const result = ref<Grade | null>(null)
const correct = ref(0)
const answered = ref(0)
const mistakes = ref(0)
const startedAt = Date.now()
const quitOpen = ref(false)
const choiceRef = ref<InstanceType<typeof ChoiceEx> | null>(null)
const primaryBtn = ref<HTMLButtonElement | null>(null)
const summary = ref({ xp: 0, acc: 0, time: '0:00', streakUp: false, heartBack: false, passed: false, score: 0 })
let exKey = 0
const renderKey = ref(0)

const progress = computed(() => Math.round(((mode === 'test' ? answered.value : correct.value) / Math.max(1, total)) * 100))
const ready = computed(() => {
  const ex = current.value
  if (!ex) return false
  if (ex.kind === 'card') return true
  if (ex.kind === 'match') return false
  if (ex.kind === 'type') return typeof answer.value === 'string' && answer.value.trim().length > 0
  if (ex.kind === 'build') return Array.isArray(answer.value) && answer.value.length > 0
  return typeof answer.value === 'number'
})

function next() {
  result.value = null
  answer.value = null
  const ex = queue.shift()
  if (!ex) return finish()
  current.value = ex
  renderKey.value = ++exKey
  window.scrollTo({ top: 0 })
}

function check() {
  const ex = current.value
  if (!ex || result.value) return
  if (ex.kind === 'card') { correct.value++; answered.value++; next(); return }
  const g = grade(ex, answer.value)
  result.value = g
  answered.value++
  if ('srs' in ex && ex.srs) recordCard(ex.srs, g.ok)
  if (g.ok) {
    correct.value++
    chime(true)
  } else {
    mistakes.value++
    chime(false)
    if (usesHearts) loseHeart()
    if (mode !== 'test') queue.push(ex)
    const fa = 'reveal' in ex && ex.reveal && !ex.reveal.hideTr ? ex.reveal.fa : undefined
    if (fa) speak(fa)
  }
  nextTick(() => primaryBtn.value?.focus({ preventScroll: true }))
}

function onMatchComplete() {
  answer.value = 'done'
  check()
}

function cont() {
  if (usesHearts && outOfHearts()) { phase.value = 'hearts'; return }
  next()
}

function primary() {
  if (phase.value !== 'run') return
  if (result.value) cont()
  else if (ready.value) check()
}

function finish() {
  const secs = Math.round((Date.now() - startedAt) / 1000)
  const acc = Math.round((correct.value / Math.max(1, correct.value + mistakes.value)) * 100)
  let xp = 0
  let passed = false
  const score = Math.round((correct.value / Math.max(1, total)) * 100)
  let heartBack = false
  if (mode === 'test') {
    passed = correct.value / Math.max(1, total) >= TEST_PASS
    if (passed) P.passed[testLevel] = true
    xp = passed ? 25 : 5
  } else if (mode === 'review') {
    xp = 8
    if (P.hearts < MAX_HEARTS) { gainHeart(); heartBack = true }
  } else {
    xp = 10 + (mistakes.value === 0 ? 5 : 0)
    if (doneKey) P.done[doneKey] = true
  }
  const streakUp = addXp(xp)
  summary.value = { xp, acc, time: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, streakUp, heartBack, passed, score }
  phase.value = 'done'
  chime(true)
}

function leave() {
  stopSpeech()
  quitOpen.value = false
  if (unit) router.replace({ name: 'unit', params: { id: unit.id } })
  else if (!Number.isNaN(alpha)) router.replace({ name: 'alphabet' })
  else router.replace({ name: 'home' })
}
function askQuit() {
  if (phase.value === 'run' && answered.value > 0) quitOpen.value = true
  else leave()
}

function onKey(e: KeyboardEvent) {
  if (quitOpen.value) { if (e.key === 'Escape') quitOpen.value = false; return }
  if (phase.value !== 'run') return
  const typing = (e.target as HTMLElement | null)?.id === 'type-answer'
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    primary()
  } else if (/^[1-9]$/.test(e.key) && !typing && !result.value && current.value?.kind === 'choice') {
    choiceRef.value?.choose(Number(e.key) - 1)
  } else if (e.key === 'Escape') {
    askQuit()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (phase.value === 'run') next()
})
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); stopSpeech() })

const praise = ['Correct.', 'Nice work.', 'Exactly right.', 'Well done.']
const praiseLine = computed(() => praise[renderKey.value % praise.length])
const showAnswer = computed(() => {
  const ex = current.value
  const g = result.value
  if (!ex || !g || ex.kind === 'match' || ex.kind === 'card') return false
  if (!g.ok) return true
  if (ex.kind === 'choice') return !!ex.prompt.listen || !!ex.prompt.digit || !ex.prompt.fa
  return ex.kind === 'build' && ex.to === 'en'
})
const reveal = computed(() => {
  const ex = current.value
  if (!ex) return null
  if (ex.kind === 'choice') return ex.reveal ?? (ex.options[ex.answer] ? { ...ex.options[ex.answer] } : null)
  if (ex.kind === 'type') return ex.reveal
  if (ex.kind === 'build') return ex.to === 'en' ? { en: ex.sentence.en } : { fa: ex.sentence.fa, tr: ex.sentence.tr, en: ex.sentence.en }
  return null
})
const notes = computed(() => {
  const ex = current.value
  const out: string[] = []
  if (result.value?.note) out.push(result.value.note)
  if (ex && 'note' in ex && ex.note) out.push(ex.note)
  return out
})
const endFa = computed(() => (mode === 'test' && !summary.value.passed ? 'اشکالی ندارد' : 'آفرین!'))
const endTr = computed(() => (mode === 'test' && !summary.value.passed ? 'eshkâli nadârad, “no problem”' : 'âfarin, “well done”'))
const testLevelName = LEVELS.find((l) => l.level === testLevel)?.name
</script>

<template>
  <div class="lesson">
    <header class="top">
      <div class="wrap bar-top">
        <button type="button" class="icon-btn" aria-label="Quit" @click="askQuit"><AppIcon name="x" /></button>
        <div class="progress" role="progressbar" :aria-label="`${title} progress`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="progress"><i :style="{ width: progress + '%' }"></i></div>
        <span v-if="usesHearts" class="stat hearts" title="Hearts left today"><AppIcon name="heart" />{{ P.settings.relaxed ? '∞' : P.hearts }}</span>
        <span v-else class="chip lapis">{{ mode === 'test' ? 'Test' : 'Review' }}</span>
      </div>
    </header>

    <main v-if="phase === 'run' && current" class="wrap stage">
      <p class="crumb">{{ title }}</p>
      <div class="ex" :class="{ locked: !!result }">
        <h1 class="kicker">
          {{ current.title }}
          <span v-if="current.kind === 'choice' && current.isNew" class="chip saffron">New word</span>
        </h1>
        <ChoiceEx v-if="current.kind === 'choice'" :key="'c' + renderKey" ref="choiceRef" v-model="(answer as number | null)" :ex="current" :locked="!!result" />
        <MatchEx v-else-if="current.kind === 'match'" :key="'m' + renderKey" :ex="current" :locked="!!result" @complete="onMatchComplete" />
        <BuildEx v-else-if="current.kind === 'build'" :key="'b' + renderKey" v-model="(answer as number[] | null)" :ex="current" :locked="!!result" />
        <TypeEx v-else-if="current.kind === 'type'" :key="'t' + renderKey" v-model="(answer as string | null)" :ex="current" :locked="!!result" />
        <CardEx v-else :key="'k' + renderKey" :ex="current" />
      </div>
    </main>

    <footer v-if="phase === 'run' && current" class="foot" :class="result ? (result.ok ? 'good' : 'bad') : ''">
      <div class="wrap foot-in">
        <div v-if="result" class="fb" aria-live="polite">
          <h2>
            <AppIcon :name="result.ok ? 'check' : 'x'" />
            {{ current.kind === 'match' ? 'All pairs matched.' : result.ok ? praiseLine : 'Not quite. The answer is:' }}
          </h2>
          <div v-if="showAnswer && reveal" class="ans">
            <FaText v-if="reveal.fa" :fa="reveal.fa" :tr="reveal.tr" inline keep-tr keep-fa />
            <b v-if="reveal.en">{{ reveal.en }}</b>
          </div>
          <RichText v-for="(n, i) in notes" :key="i" :html="n" class="note" />
        </div>
        <button
          v-if="current.kind !== 'match' || result"
          ref="primaryBtn"
          type="button"
          class="btn primary go"
          :disabled="!result && !ready"
          @click="primary"
        >
          {{ result || current.kind === 'card' ? 'Continue' : 'Check' }}
        </button>
      </div>
    </footer>

    <main v-if="phase === 'done'" class="wrap end">
      <div class="big-fa fa keep" lang="fa" dir="rtl" :class="{ bad: mode === 'test' && !summary.passed }">{{ endFa }}</div>
      <p class="muted">{{ endTr }}</p>
      <h1 v-if="mode === 'test'">{{ summary.passed ? `You passed ${testLevel}` : `${summary.score}%: not yet` }}</h1>
      <h1 v-else>{{ mode === 'review' ? `${title} complete` : 'Lesson complete' }}</h1>
      <div class="tiles3">
        <div class="t3 xp"><span>XP</span><b>+{{ summary.xp }}</b></div>
        <div class="t3 acc"><span>{{ mode === 'test' ? 'Score' : 'Accuracy' }}</span><b>{{ mode === 'test' ? summary.score : summary.acc }}%</b></div>
        <div class="t3 time"><span>Time</span><b>{{ summary.time }}</b></div>
      </div>
      <p class="muted msg">
        <template v-if="mode === 'test'">
          {{ summary.passed ? `Every ${testLevel} unit is open, and the next level is unlocked.` : `You need ${Math.round(TEST_PASS * 100)}% to pass. The ${testLevelName ?? ''} units will get you there.` }}
        </template>
        <template v-else>
          <span v-if="summary.streakUp">Streak: {{ P.streak }} day{{ P.streak > 1 ? 's' : '' }}. </span>
          <span v-if="summary.heartBack">You won back a heart. </span>
          <span v-if="mode === 'lesson' && mistakes === 0">No mistakes, so you earned 5 bonus XP.</span>
        </template>
      </p>
      <button type="button" class="btn primary" @click="leave">Continue</button>
    </main>

    <main v-if="phase === 'hearts'" class="wrap end">
      <div class="big-fa bad fa keep" lang="fa" dir="rtl">ای وای!</div>
      <p class="muted">ey vây, “oh no”</p>
      <h1>You are out of hearts</h1>
      <p class="muted msg">Hearts refill tomorrow. A review round uses no hearts and wins one back. You can also switch on relaxed mode in Settings.</p>
      <div class="actions">
        <button type="button" class="btn ghost" @click="leave">Back</button>
        <RouterLink class="btn primary" :to="{ name: 'lesson', query: { review: '1' } }" replace>Review to win a heart</RouterLink>
      </div>
    </main>

    <main v-if="phase === 'empty'" class="wrap end">
      <h1>Nothing to practise yet</h1>
      <p class="muted msg">Finish a lesson first. Words you learn come back here for review.</p>
      <RouterLink class="btn primary" to="/">Go to the course</RouterLink>
    </main>

    <div v-if="quitOpen" class="scrim" @click.self="quitOpen = false">
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="quit-title">
        <h2 id="quit-title">Quit this {{ mode === 'test' ? 'test' : 'lesson' }}?</h2>
        <p class="muted">Your progress in it will be lost. Hearts already lost stay lost.</p>
        <div class="actions end-row">
          <button type="button" class="btn ghost sm" @click="quitOpen = false">Keep going</button>
          <button type="button" class="btn danger sm" @click="leave">Quit</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; background: var(--bg); border-bottom: 1px solid var(--line) }
.bar-top { display: flex; align-items: center; gap: 14px; padding-block: 10px }
.progress { flex: 1; height: 14px; background: var(--sunk); border-radius: 999px; overflow: hidden }
.progress > i { display: block; height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.35s ease }
.stat { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); font-weight: 600; font-size: 0.9rem }
.stat .ico { color: var(--bad) }
.stage { padding-block: 18px 220px }
.crumb { font-size: 0.8rem; color: var(--muted); margin-bottom: 8px }
.ex { display: flex; flex-direction: column; gap: 18px }
.kicker { font-size: 1.45rem; font-weight: 800; display: flex; align-items: center; gap: 10px; flex-wrap: wrap }
.foot { position: fixed; left: 0; right: 0; bottom: 0; z-index: 25; background: var(--surface); border-top: 1px solid var(--line); padding-block: 14px calc(14px + env(safe-area-inset-bottom, 0px)) }
.foot-in { display: flex; align-items: center; gap: 16px; flex-wrap: wrap }
.go { margin-left: auto; min-width: 160px }
.fb { flex: 1 1 280px; min-width: 0; display: flex; flex-direction: column; gap: 4px }
.fb h2 { font-size: 1.2rem; display: flex; align-items: center; gap: 8px }
.fb h2 .ico { width: 22px; height: 22px }
.ans { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px }
.note { font-size: 0.9rem }
.foot.good { background: var(--good-bg); border-top-color: var(--good) }
.foot.good h2 { color: var(--good) }
.foot.good .btn.primary { background: var(--good); color: var(--good-ink) }
.foot.bad { background: var(--bad-bg); border-top-color: var(--bad) }
.foot.bad h2 { color: var(--bad) }
.foot.bad .btn.primary { background: var(--bad); color: var(--bad-ink) }
.end { padding-block: 48px 64px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px }
.big-fa { font-size: 3.4rem; font-weight: 700; color: var(--accent); line-height: 1.3 }
.big-fa.bad { color: var(--bad) }
.end h1 { font-size: 2rem; font-weight: 800 }
.msg { max-width: 46ch }
.tiles3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; width: 100%; max-width: 460px }
.t3 { border-radius: 16px; padding: 12px 8px; border: 2px solid; display: flex; flex-direction: column; gap: 2px }
.t3 b { font-family: var(--f-display); font-size: 1.5rem; font-weight: 800; font-variant-numeric: tabular-nums }
.t3 span { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600 }
.t3.xp { border-color: var(--saffron); color: var(--saffron); background: var(--saffron-soft) }
.t3.acc { border-color: var(--accent); color: var(--accent); background: var(--accent-soft) }
.t3.time { border-color: var(--lapis); color: var(--lapis); background: var(--lapis-soft) }
.actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center }
.end-row { justify-content: flex-end }
.scrim { position: fixed; inset: 0; background: var(--scrim); z-index: 40; display: grid; place-items: end center; padding: 16px max(16px, env(safe-area-inset-right, 0px)) calc(16px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)) }
.sheet { background: var(--surface); border-radius: 20px; padding: 22px; max-width: 440px; width: 100%; display: flex; flex-direction: column; gap: 12px; box-shadow: var(--shadow) }
@media (max-width: 520px) { .go { width: 100%; margin-left: 0 } .kicker { font-size: 1.22rem } }
</style>
