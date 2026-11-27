<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Level } from '@/content/types.ts'
import { ALL_WORDS, LEVELS } from '@/content/course.ts'
import { mulberry32 } from '@/lib/random.ts'
import { dayNumber } from '@/lib/srs.ts'
import {
  P, dueCount, levelUnlocked, nextLesson, seenCount, unitDone, unitProgress, unitUnlocked, xpToday, alphabetDone, streakActiveToday as streakToday,
} from '@/lib/store.ts'
import { account } from '@/lib/account.ts'
import { TRACKS } from '@/content/tracks/index.ts'
import { fromInstagram, dismissInstagram } from '@/lib/instagram.ts'
import { APP } from '@/app.ts'
import { LANGS, t, tn } from '@/i18n/index.ts'
import AppIcon from '@/components/AppIcon.vue'
import InstallCard from '@/components/InstallCard.vue'
import MeowCat from '@/components/MeowCat.vue'
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

/** What Pishi says on the home screen, from today's state. */
const greet = computed(() => {
  const say = (line: { fa: string; tr: string }, msg: string) => ({ fa: line.fa, tr: `${line.tr} ${msg}` })
  if (xpToday() >= P.settings.goal) return { mood: 'cheer' as const, ...say(APP.pishi.cheer, t('Daily goal done.')) }
  if (due.value > 0) return { mood: 'think' as const, ...say(APP.pishi.review, tn(due.value, '{n} word to review.', '{n} words to review.')) }
  if (P.streak > 0 && !streakToday()) return { mood: 'sad' as const, ...say(APP.pishi.missed, t('Keep your {n}-day streak.', { n: P.streak })) }
  return { mood: 'wave' as const, ...say(APP.pishi.go, t("Let's go.")) }
})

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
        <div v-if="LANGS.length > 1" class="speak" role="radiogroup" :aria-label="t('I speak')">
          <span class="muted small">{{ t('I speak') }}</span>
          <button v-for="l in LANGS" :key="l.code" type="button" class="chip-btn" :class="{ on: P.settings.lang === l.code }" role="radio" :aria-checked="P.settings.lang === l.code" @click="P.settings.lang = l.code">{{ l.name }}</button>
        </div>
        <p class="eyebrow">{{ t('Persian for English speakers · A1 to B2') }}</p>
        <h1>{{ t('Learn to read, speak and understand Persian.') }}</h1>
        <p class="muted">{{ t("You don't need to read the Persian alphabet: every word comes with Finglish, Persian in English letters (salâm = hello). Short lessons, grammar, dialogues, readings and spaced review.") }} {{ account.enabled ? t('Sign in to keep your progress on every device.') : t('Your progress stays in this browser.') }}</p>
        <div class="row">
          <button type="button" class="btn primary" @click="goNext">{{ t('Start at A1') }}</button>
          <RouterLink class="btn ghost" :to="{ name: 'lesson', query: { test: 'A1' } }">{{ t('I know some Persian: test out of A1') }}</RouterLink>
        </div>
      </div>
      <MeowCat mood="wave" :size="170" class="hero-cat" :bubble="`${APP.pishi.hello.tr} ${t('(Hello! I am Pishi.)')}`" :bubble-fa="APP.pishi.hello.fa" />
    </section>

    <div v-if="!fresh" class="greet">
      <MeowCat :mood="greet.mood" :size="88" :bubble="greet.tr" :bubble-fa="greet.fa" />
    </div>

    <div class="today">
      <div class="card">
        <p class="eyebrow">{{ t('Daily goal') }}</p>
        <p class="goal-num">{{ xpToday() }}<small> / {{ P.settings.goal }} XP</small></p>
        <div class="meter" role="progressbar" :aria-label="t('Daily goal')" :aria-valuenow="goalPct" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: goalPct + '%' }"></i></div>
        <p class="small muted gap">{{ goalPct >= 100 ? t('Goal reached today.') + ' ' + APP.pishi.cheer.fa : t('One lesson is 10 to 15 XP.') }}</p>
      </div>
      <div class="card">
        <p class="eyebrow">{{ t('Word of the day') }}</p>
        <div class="wotd">
          <FaText :fa="wotd.word.fa" :tr="wotd.word.tr" size="lg" keep-tr />
          <SpeakButton :text="wotd.word.fa" />
        </div>
        <p class="en">{{ wotd.word.en }} <span class="muted small">· {{ wotd.unit.level }} {{ wotd.unit.title }}</span></p>
      </div>
    </div>

    <section v-if="fromInstagram" class="card insta" aria-live="polite">
      <MeowCat mood="cheer" :size="72" />
      <div class="insta-text">
        <b>{{ t('“Comment MEOW” brought you here 🐱') }}</b>
        <span class="muted small">{{ t('Welcome! This is the free course from the Reels: start with A1, or try the 3-second challenge you just watched.') }}</span>
        <span class="row">
          <button type="button" class="btn primary sm" @click="goNext">{{ t('Start at A1') }}</button>
          <RouterLink class="btn ghost sm" :to="{ name: 'quick', query: { mode: 'guess' } }">{{ t('3-second challenge') }}</RouterLink>
        </span>
      </div>
      <button type="button" class="icon-btn" :aria-label="t('Hide this')" @click="dismissInstagram"><AppIcon name="x" /></button>
    </section>

    <div class="actions-row">
      <button v-if="next && !fresh" type="button" class="card action" @click="goNext">
        <span class="a-ico lapis"><AppIcon name="arrow" class="flip" /></span>
        <span><b>{{ t('Continue') }}</b><span class="muted small block">{{ next.unit.title }} · {{ next.name }}</span></span>
      </button>
      <RouterLink v-if="seenCount() > 0" class="card action" :to="{ name: 'lesson', query: { review: '1' } }">
        <span class="a-ico saffron"><AppIcon name="review" /></span>
        <span><b>{{ due > 0 ? t('Review') : t('Practice') }}</b><span class="muted small block">{{ due > 0 ? tn(due, '{n} word due today', '{n} words due today') : t('Nothing due. Practise your weakest words.') }}</span></span>
      </RouterLink>
      <RouterLink class="card action" :to="{ name: 'quick', query: { mode: 'guess' } }">
        <span class="a-ico saffron"><AppIcon name="star" /></span>
        <span><b>{{ t('Quick play') }}</b><span class="muted small block">{{ t('3-second challenge, or listen & repeat.') }}</span></span>
      </RouterLink>
      <RouterLink v-if="APP.alphabet && !alphabetDone()" class="card action" to="/alphabet">
        <span class="a-ico accent fa-brand" lang="fa">ب</span>
        <span><b>{{ t('Alphabet') }}</b><span class="muted small block">{{ t('32 letters, six short lessons. Open any time.') }}</span></span>
      </RouterLink>
    </div>

    <InstallCard dismissible />

    <nav class="levels" :aria-label="t('Levels')">
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
        {{ t('Test out of {level}', { level: level.level }) }}
      </RouterLink>
      <span v-else-if="P.passed[level.level]" class="chip accent">{{ t('Test passed') }}</span>
    </section>

    <p v-if="!levelUnlocked(level.level)" class="tip">
      <b>{{ t('Locked.') }}</b> {{ t('Finish every unit of the level before, or pass its level test, to open {level}.', { level: level.level }) }}
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

    <section v-for="tr in TRACKS.filter((x) => x.units.length)" :key="tr.id" class="track" :aria-label="t(tr.name)">
      <div class="level-head">
        <div>
          <h2>{{ t(tr.name) }} <FaText :fa="tr.fa" :tr="tr.tr" inline size="sm" class="lvl-fa" /></h2>
          <p class="muted">{{ t(tr.blurb) }}</p>
        </div>
        <span class="chip accent">{{ t('Always open') }}</span>
      </div>
      <ol class="units">
        <li v-for="(u, i) in tr.units" :key="u.id">
          <RouterLink class="card unit" :class="{ done: unitDone(u) }" :to="{ name: 'unit', params: { id: u.id } }">
            <span class="u-num">
              <AppIcon v-if="unitDone(u)" name="check" />
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
    </section>
  </main>
</template>

<style scoped>
.hero { display: flex; gap: 20px; align-items: center; justify-content: space-between; padding: 22px; background: linear-gradient(135deg, var(--surface), var(--accent-soft)) }
.hero-text { display: flex; flex-direction: column; gap: 10px; max-width: 46ch }
.hero h1 { font-size: 1.9rem; font-weight: 800 }
.hero-cat { flex-direction: column-reverse; align-items: center; gap: 4px }
.hero-cat :deep(.bubble::before) { left: 50%; top: auto; bottom: -9px; transform: translateX(-50%) rotate(-45deg) }
.greet { display: flex }
.speak { display: flex; align-items: center; gap: 6px; flex-wrap: wrap }
.chip-btn { border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 4px 12px; font-size: 0.85rem; font-weight: 600; cursor: pointer }
.chip-btn.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent) }
.row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px }
.today { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
.goal-num { font-family: var(--f-display); font-size: 1.6rem; font-weight: 800; margin: 4px 0 8px; font-variant-numeric: tabular-nums }
.goal-num small { font-family: var(--f-body); font-size: 0.9rem; font-weight: 500; color: var(--muted) }
.gap { margin-top: 8px }
.wotd { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 4px }
.wotd :deep(.fw) { align-items: flex-start }
.en { font-weight: 600; margin-top: 4px }
.insta { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg, var(--saffron-soft), var(--surface)) }
.insta-text { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0 }
.track { display: flex; flex-direction: column; gap: 12px; margin-top: 8px }
.actions-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px }
.action { display: flex; gap: 12px; align-items: center; text-align: start; cursor: pointer; color: var(--ink); text-decoration: none; border: 1px solid var(--line); font: inherit }
.action:hover { border-color: var(--muted) }
.block { display: block }
.a-ico { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; flex: none; font-size: 1.4rem; font-weight: 700 }
.a-ico .ico { width: 22px; height: 22px }
.a-ico.lapis { background: var(--lapis); color: var(--lapis-ink) }
.a-ico.saffron { background: var(--saffron-soft); color: var(--saffron) }
.a-ico.accent { background: var(--accent-soft); color: var(--accent) }
.flip { transform: scaleX(-1) }
.levels { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px }
.lv { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 12px; border-radius: 14px; border: 2px solid var(--line); background: var(--surface); cursor: pointer; text-align: start; min-width: 0 }
.lv.on { border-color: var(--accent); background: var(--accent-soft) }
.lv.locked { opacity: 0.65 }
.lv-code { font-family: var(--f-display); font-weight: 800; font-size: 1.3rem }
.lv-name { font-size: 0.75rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100% }
.lv-bar { width: 100%; height: 5px; border-radius: 9px; background: var(--sunk); overflow: hidden; margin-top: 4px }
.lv-bar i { display: block; height: 100%; background: var(--accent) }
.lv-trophy { position: absolute; top: 9px; inset-inline-end: 9px; color: var(--saffron) }
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
  .hero { flex-direction: column-reverse; align-items: flex-start }
  .hero-cat { align-self: center }
  .hero h1 { font-size: 1.5rem }
  .u-fa { display: none }
  .levels { gap: 6px }
  .lv { padding: 8px }
}
</style>
