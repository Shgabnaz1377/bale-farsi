<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ALL_WORDS, LEVELS, type WordRef } from '@/content/course.ts'
import { P, addXp } from '@/lib/store.ts'
import { pick, shuffle } from '@/lib/random.ts'
import { speak, stopSpeech } from '@/lib/speech.ts'
import { meow } from '@/lib/sfx.ts'
import { t } from '@/i18n/index.ts'
import AppIcon from '@/components/AppIcon.vue'
import FaText from '@/components/FaText.vue'
import MeowCat from '@/components/MeowCat.vue'

/**
 * Quick formats from PersianMeow's Reels:
 * - guess:  a word appears and plays; pick its meaning before the 3-second ring runs out
 * - repeat: listen, say it aloud during a 3-second pause, then hear it again to compare
 */
type Mode = 'guess' | 'repeat'
const route = useRoute()
const router = useRouter()
const mode = ref<Mode>(route.query.mode === 'repeat' ? 'repeat' : 'guess')
const ROUNDS = 10
const SECONDS = 3

// Words the learner has met, else the first A1 units.
function pool(): WordRef[] {
  const met = ALL_WORDS.filter((w) => P.cards[w.key])
  if (met.length >= 12) return met
  const a1 = LEVELS[0].units.slice(0, 3)
  return ALL_WORDS.filter((w) => a1.includes(w.unit))
}
const words = shuffle(pool()).slice(0, ROUNDS)

const round = ref(0)
const score = ref(0)
const phase = ref<'ready' | 'run' | 'reveal' | 'your-turn' | 'again' | 'done'>('ready')
const picked = ref<number | null>(null)
const left = ref(SECONDS)
let timer: ReturnType<typeof setInterval> | undefined

const word = computed(() => words[round.value])
const options = ref<string[]>([])
const answer = computed(() => word.value?.word.en ?? '')

function clear() { clearInterval(timer); timer = undefined }
function countdown(then: () => void) {
  clear()
  left.value = SECONDS
  const start = Date.now()
  timer = setInterval(() => {
    left.value = Math.max(0, SECONDS - (Date.now() - start) / 1000)
    if (left.value <= 0) { clear(); then() }
  }, 50)
}

function startRound() {
  const w = word.value
  if (!w) { finish(); return }
  picked.value = null
  if (mode.value === 'guess') {
    const others = pick(ALL_WORDS.filter((x) => x.word.en !== w.word.en && x.unit.level === w.unit.level).map((x) => x.word.en), 2)
    options.value = shuffle([w.word.en, ...new Set(others)]).slice(0, 3)
    phase.value = 'run'
    void speak(w.word.fa)
    countdown(() => reveal(null))
  } else {
    phase.value = 'run'
    void speak(w.word.fa).then(() => {
      phase.value = 'your-turn'
      countdown(() => {
        phase.value = 'again'
        void speak(w.word.fa)
      })
    })
  }
}

function reveal(i: number | null) {
  if (phase.value !== 'run') return
  clear()
  picked.value = i
  const ok = i !== null && options.value[i] === answer.value
  if (ok) score.value++
  meow(ok ? 'happy' : 'sad')
  phase.value = 'reveal'
}

function rate(ok: boolean) {
  if (ok) score.value++
  meow(ok ? 'happy' : 'mew')
  next()
}

function next() {
  stopSpeech()
  round.value++
  if (round.value >= words.length) finish()
  else startRound()
}

function finish() {
  clear()
  phase.value = 'done'
  addXp(Math.max(2, score.value))
}

function restart(m: Mode) {
  router.replace({ name: 'quick', query: { mode: m } })
}

function onKey(e: KeyboardEvent) {
  if (phase.value === 'run' && mode.value === 'guess' && /^[1-3]$/.test(e.key)) reveal(Number(e.key) - 1)
  else if (e.key === 'Enter' && (phase.value === 'reveal')) next()
  else if (e.key === 'Enter' && phase.value === 'ready') { round.value = 0; startRound() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); clear(); stopSpeech() })

const ring = computed(() => `${(left.value / SECONDS) * 100}`)
</script>

<template>
  <main class="wrap page quick">
    <header class="q-head">
      <RouterLink to="/" class="back"><AppIcon name="arrow" /> {{ t('Learn') }}</RouterLink>
      <div class="modes" role="tablist" :aria-label="t('Quick play')">
        <button type="button" role="tab" class="chip-btn" :class="{ on: mode === 'guess' }" :aria-selected="mode === 'guess'" @click="restart('guess')">{{ t('3-second challenge') }}</button>
        <button type="button" role="tab" class="chip-btn" :class="{ on: mode === 'repeat' }" :aria-selected="mode === 'repeat'" @click="restart('repeat')">{{ t('Listen & repeat') }}</button>
      </div>
    </header>

    <section v-if="phase === 'ready'" class="card intro">
      <MeowCat mood="wave" :size="130" />
      <h1>{{ mode === 'guess' ? t('3-second challenge') : t('Listen & repeat') }}</h1>
      <p class="muted">
        {{ mode === 'guess'
          ? t('A Persian word appears and plays. You have 3 seconds to pick what it means. {n} words.', { n: words.length })
          : t('Listen, then say the word out loud while the ring counts down. Then hear it again and be honest: did you get it? {n} words.', { n: words.length }) }}
      </p>
      <button type="button" class="btn primary" @click="round = 0; startRound()">{{ t('Start') }}</button>
    </section>

    <section v-else-if="phase !== 'done' && word" class="stage" aria-live="polite">
      <p class="count muted small">{{ t('{n} of {total}', { n: round + 1, total: words.length }) }} · {{ t('Score') }} {{ score }}</p>
      <div class="ring-wrap">
        <svg class="ring" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="16" class="track" />
          <circle cx="18" cy="18" r="16" class="bar" :style="{ strokeDasharray: `${ring} 100` }" pathLength="100" />
        </svg>
        <span class="secs" aria-hidden="true">{{ Math.ceil(left) }}</span>
      </div>
      <div class="word card">
        <FaText :fa="word.word.fa" :tr="word.word.tr" size="xl" keep-tr />
      </div>

      <template v-if="mode === 'guess'">
        <div class="opts">
          <button
            v-for="(o, i) in options" :key="o" type="button" class="opt"
            :class="{ right: phase === 'reveal' && o === answer, wrong: phase === 'reveal' && picked === i && o !== answer }"
            :disabled="phase !== 'run'" @click="reveal(i)"
          >
            <span class="kbd" aria-hidden="true">{{ i + 1 }}</span>{{ o }}
          </button>
        </div>
        <div v-if="phase === 'reveal'" class="after">
          <MeowCat :mood="picked !== null && options[picked] === answer ? 'cheer' : 'sad'" :size="64" />
          <p><b>{{ picked === null ? t('Time is up!') : options[picked] === answer ? t('Correct.') : t('Not quite. The answer is:') }}</b> {{ answer }}</p>
          <button type="button" class="btn primary" @click="next">{{ t('Continue') }}</button>
        </div>
      </template>

      <template v-else>
        <p class="cue">
          <span v-if="phase === 'run'">{{ t('Listen…') }}</span>
          <span v-else-if="phase === 'your-turn'"><b>{{ t('Your turn: say it out loud!') }}</b></span>
          <span v-else>{{ t('Now compare. Did you say it like that?') }}</span>
        </p>
        <p class="muted">{{ word.word.en }}</p>
        <div v-if="phase === 'again'" class="after">
          <button type="button" class="btn ghost" @click="speak(word.word.fa, true)">{{ t('Play slowly') }}</button>
          <button type="button" class="btn ghost" @click="rate(false)">{{ t('Not yet') }}</button>
          <button type="button" class="btn primary" @click="rate(true)">{{ t('Got it') }}</button>
        </div>
      </template>
    </section>

    <section v-else class="card intro">
      <MeowCat :mood="score >= words.length * 0.7 ? 'cheer' : 'happy'" :size="140" />
      <h1>{{ t('{score} of {total}!', { score, total: words.length }) }}</h1>
      <p class="muted">{{ score >= words.length * 0.7 ? t('Pishi is impressed.') : t('Every round makes the next one easier.') }}</p>
      <div class="row">
        <button type="button" class="btn primary" @click="router.go(0)">{{ t('Play again') }}</button>
        <RouterLink class="btn ghost" to="/">{{ t('Back to the course') }}</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.quick { align-items: stretch }
.q-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap }
.back { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; font-weight: 500 }
.modes { display: flex; gap: 6px; flex-wrap: wrap }
.intro { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 28px 18px }
.intro h1 { font-size: 1.8rem; font-weight: 800 }
.intro p { max-width: 46ch }
.row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center }
.stage { display: flex; flex-direction: column; align-items: center; gap: 16px }
.count { align-self: flex-start }
.ring-wrap { position: relative; width: 84px; height: 84px }
.ring { width: 100%; height: 100%; transform: rotate(-90deg) }
.ring circle { fill: none; stroke-width: 3.2; stroke-linecap: round }
.ring .track { stroke: var(--sunk) }
.ring .bar { stroke: var(--saffron-bright); transition: stroke-dasharray 50ms linear }
.secs { position: absolute; inset: 0; display: grid; place-items: center; font-family: var(--f-display); font-size: 1.8rem; font-weight: 800 }
.word { width: 100%; display: grid; place-items: center; padding: 26px 16px; min-height: 160px }
.opts { width: 100%; display: grid; gap: 10px }
.opt { display: flex; align-items: center; gap: 12px; text-align: start; background: var(--surface); border: 2px solid var(--line); border-radius: 16px; padding: 14px; font: inherit; font-weight: 600; cursor: pointer; min-height: 58px }
.opt:hover:not(:disabled) { border-color: var(--muted) }
.opt.right { border-color: var(--good); background: var(--good-bg) }
.opt.wrong { border-color: var(--bad); background: var(--bad-bg) }
.kbd { width: 24px; height: 24px; border-radius: 7px; border: 1.5px solid var(--line); display: grid; place-items: center; font-size: 0.75rem; color: var(--muted) }
.after { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center }
.cue { font-size: 1.2rem; text-align: center }
@media (prefers-reduced-motion: reduce) { .ring .bar { transition: none } }
</style>
