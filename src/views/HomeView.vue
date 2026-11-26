<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Level } from '@/content/types.ts'
import { ALL_WORDS, LEVELS } from '@/content/course.ts'
import { mulberry32 } from '@/lib/random.ts'
import { dayNumber } from '@/lib/srs.ts'
import {
  P, dueCount, levelUnlocked, nextLesson, seenCount, unitDone, unitProgress, unitUnlocked, xpToday, alphabetDone,
} from '@/lib/store.ts'
import { account } from '@/lib/account.ts'
import AppIcon from '@/components/AppIcon.vue'
import InstallCard from '@/components/InstallCard.vue'
import FaText from '@/components/FaText.vue'
import SpeakButton from '@/components/SpeakButton.vue'

const router = useRouter()
const firstLevelOpen = LEVELS.find((l) => levelUnlocked(l.level) && !l.units.every(unitDone))?.level ?? 'A1'
const tab = ref<Level>(firstLevelOpen)
const level = computed(() => LEVELS.find((l) => l.level === tab.value)!)
const goalPct = computed(() => Math.min(100, Math.round((xpToday() / P.settings.goal) * 100)))
const next = computed(() => nextLesson())
const due = computed(() => dueCount())
const fresh = computed(() => Object.keys(P.done).length === 0 && !Object.keys(P.passed).length)

const wotd = (() => {
  const r = mulberry32(dayNumber())
  return ALL_WORDS[Math.floor(r() * ALL_WORDS.length)]
})()

const levelPct = (lv: (typeof LEVELS)[number]) =>
  Math.round((lv.units.reduce((n, u) => n + unitProgress(u), 0) / Math.max(1, lv.units.length)) * 100)

function goNext() {
  if (next.value) {
    const [u, k] = next.value.key.split('/')
    router.push({ name: 'lesson', query: { u, k } })
  }
}
</script>

<template>
  <main class="wrap page">
    <section v-if="fresh" class="card hero">
      <div class="hero-text">
        <p class="eyebrow">Persian for English speakers · A1 to B2</p>
        <h1>Learn to read, speak and understand Persian.</h1>
        <p class="muted">You don't need to read the Persian alphabet: every word comes with Finglish, Persian in English letters (salâm = hello). Short lessons, grammar, dialogues, readings and spaced review. {{ account.enabled ? 'Sign in to keep your progress on every device.' : 'Your progress stays in this browser.' }}</p>
        <div class="row">
          <button type="button" class="btn primary" @click="goNext">Start at A1</button>
          <RouterLink class="btn ghost" :to="{ name: 'lesson', query: { test: 'A1' } }">I know some Persian: test out of A1</RouterLink>
        </div>
      </div>
      <div class="hero-fa fa keep" lang="fa" dir="rtl" aria-hidden="true">سلام</div>
    </section>

    <div class="today">
      <div class="card">
        <p class="eyebrow">Daily goal</p>
        <p class="goal-num">{{ xpToday() }}<small> / {{ P.settings.goal }} XP</small></p>
        <div class="meter" role="progressbar" aria-label="Daily goal" :aria-valuenow="goalPct" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: goalPct + '%' }"></i></div>
        <p class="small muted gap">{{ goalPct >= 100 ? 'Goal reached today. آفرین!' : 'One lesson is 10 to 15 XP.' }}</p>
      </div>
      <div class="card">
        <p class="eyebrow">Word of the day</p>
        <div class="wotd">
          <FaText :fa="wotd.word.fa" :tr="wotd.word.tr" size="lg" keep-tr />
          <SpeakButton :text="wotd.word.fa" />
        </div>
        <p class="en">{{ wotd.word.en }} <span class="muted small">· {{ wotd.unit.level }} {{ wotd.unit.title }}</span></p>
      </div>
    </div>

    <div class="actions-row">
      <button v-if="next && !fresh" type="button" class="card action" @click="goNext">
        <span class="a-ico lapis"><AppIcon name="arrow" class="flip" /></span>
        <span><b>Continue</b><span class="muted small block">{{ next.unit.title }} · {{ next.name }}</span></span>
      </button>
      <RouterLink v-if="seenCount() > 0" class="card action" :to="{ name: 'lesson', query: { review: '1' } }">
        <span class="a-ico saffron"><AppIcon name="review" /></span>
        <span><b>{{ due > 0 ? 'Review' : 'Practice' }}</b><span class="muted small block">{{ due > 0 ? `${due} word${due > 1 ? 's' : ''} due today` : 'Nothing due. Practise your weakest words.' }}</span></span>
      </RouterLink>
      <RouterLink v-if="!alphabetDone()" class="card action" to="/alphabet">
        <span class="a-ico accent fa keep" lang="fa">ب</span>
        <span><b>Alphabet</b><span class="muted small block">32 letters, six short lessons. Open any time.</span></span>
      </RouterLink>
    </div>

    <InstallCard dismissible />

    <nav class="levels" aria-label="Levels">
      <button
        v-for="lv in LEVELS" :key="lv.level" type="button" class="lv"
        :class="{ on: tab === lv.level, locked: !levelUnlocked(lv.level) }" :aria-pressed="tab === lv.level" @click="tab = lv.level"
      >
        <span class="lv-code">{{ lv.level }}</span>
        <span class="lv-name">{{ lv.name }}</span>
        <span class="lv-bar"><i :style="{ width: levelPct(lv) + '%' }"></i></span>
        <AppIcon v-if="P.passed[lv.level]" name="trophy" class="lv-trophy" />
      </button>
    </nav>

    <section class="level-head">
      <div>
        <h2>{{ level.level }} · {{ level.name }} <FaText :fa="level.fa" :tr="level.tr" inline size="sm" class="lvl-fa" /></h2>
        <p class="muted">{{ level.blurb }}</p>
      </div>
      <RouterLink v-if="levelUnlocked(level.level) && !P.passed[level.level]" class="btn ghost sm" :to="{ name: 'lesson', query: { test: level.level } }">
        Test out of {{ level.level }}
      </RouterLink>
      <span v-else-if="P.passed[level.level]" class="chip accent">Test passed</span>
    </section>

    <p v-if="!levelUnlocked(level.level)" class="tip">
      <b>Locked.</b> Finish every unit of the level before, or pass its level test, to open {{ level.level }}.
    </p>

    <ol class="units">
      <li v-for="(u, i) in level.units" :key="u.id">
        <RouterLink class="card unit" :class="{ locked: !unitUnlocked(u), done: unitDone(u) }" :to="{ name: 'unit', params: { id: u.id } }">
          <span class="u-num">
            <AppIcon v-if="unitDone(u)" name="check" />
            <AppIcon v-else-if="!unitUnlocked(u)" name="lock" />
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span class="u-body">
            <span class="u-title">{{ u.title }}</span>
            <span class="u-can muted small">{{ u.can }}</span>
            <span class="meter accent u-meter"><i :style="{ width: Math.round(unitProgress(u) * 100) + '%' }"></i></span>
          </span>
          <FaText :fa="u.fa" :tr="u.tr" size="md" class="u-fa" />
        </RouterLink>
      </li>
    </ol>
  </main>
</template>

<style scoped>
.hero { display: flex; gap: 20px; align-items: center; justify-content: space-between; padding: 22px; background: linear-gradient(135deg, var(--surface), var(--accent-soft)) }
.hero-text { display: flex; flex-direction: column; gap: 10px; max-width: 46ch }
.hero h1 { font-size: 1.9rem; font-weight: 800 }
.hero-fa { font-size: 5rem; font-weight: 700; color: var(--accent); line-height: 1; opacity: 0.9 }
.row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px }
.today { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
.goal-num { font-family: var(--f-display); font-size: 1.6rem; font-weight: 800; margin: 4px 0 8px; font-variant-numeric: tabular-nums }
.goal-num small { font-family: var(--f-body); font-size: 0.9rem; font-weight: 500; color: var(--muted) }
.gap { margin-top: 8px }
.wotd { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 4px }
.wotd :deep(.fw) { align-items: flex-start }
.en { font-weight: 600; margin-top: 4px }
.actions-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px }
.action { display: flex; gap: 12px; align-items: center; text-align: left; cursor: pointer; color: var(--ink); text-decoration: none; border: 1px solid var(--line); font: inherit }
.action:hover { border-color: var(--muted) }
.block { display: block }
.a-ico { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; flex: none; font-size: 1.4rem; font-weight: 700 }
.a-ico .ico { width: 22px; height: 22px }
.a-ico.lapis { background: var(--lapis); color: var(--lapis-ink) }
.a-ico.saffron { background: var(--saffron-soft); color: var(--saffron) }
.a-ico.accent { background: var(--accent-soft); color: var(--accent) }
.flip { transform: scaleX(-1) }
.levels { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px }
.lv { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 12px; border-radius: 14px; border: 2px solid var(--line); background: var(--surface); cursor: pointer; text-align: left; min-width: 0 }
.lv.on { border-color: var(--accent); background: var(--accent-soft) }
.lv.locked { opacity: 0.65 }
.lv-code { font-family: var(--f-display); font-weight: 800; font-size: 1.3rem }
.lv-name { font-size: 0.75rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100% }
.lv-bar { width: 100%; height: 5px; border-radius: 9px; background: var(--sunk); overflow: hidden; margin-top: 4px }
.lv-bar i { display: block; height: 100%; background: var(--accent) }
.lv-trophy { position: absolute; top: 9px; right: 9px; color: var(--saffron) }
.level-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap }
.level-head h2 { font-size: 1.4rem; font-weight: 800; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap }
.lvl-fa :deep(.fa) { color: var(--accent) }
.units { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px }
.unit { display: flex; align-items: center; gap: 14px; text-decoration: none; color: var(--ink) }
.unit:hover { border-color: var(--muted) }
.unit.locked { opacity: 0.6 }
.u-num { width: 44px; height: 44px; flex: none; display: grid; place-items: center; font-family: var(--f-display); font-weight: 800; font-size: 1.2rem; background: var(--lapis-soft); color: var(--lapis);
  clip-path: polygon(50% 0%,65.31% 13.04%,85.36% 14.64%,86.96% 34.69%,100% 50%,86.96% 65.31%,85.36% 85.36%,65.31% 86.96%,50% 100%,34.69% 86.96%,14.64% 85.36%,13.04% 65.31%,0% 50%,13.04% 34.69%,14.64% 14.64%,34.69% 13.04%) }
.unit.done .u-num { background: var(--accent); color: var(--accent-ink) }
.unit.locked .u-num { background: var(--sunk); color: var(--muted) }
.u-body { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0 }
.u-title { font-family: var(--f-display); font-weight: 800; font-size: 1.12rem }
.u-meter { height: 6px; margin-top: 4px; max-width: 260px }
.u-fa :deep(.fa) { color: var(--accent) }
@media (max-width: 560px) {
  .today { grid-template-columns: 1fr }
  .hero-fa { display: none }
  .hero h1 { font-size: 1.5rem }
  .u-fa { display: none }
  .levels { gap: 6px }
  .lv { padding: 8px }
}
</style>
