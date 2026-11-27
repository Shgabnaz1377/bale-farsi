<script lang="ts">
import { ref as moduleRef } from 'vue'
/** The level or track on screen, kept while the app is open so coming back from a unit returns to it. */
const picked = moduleRef<string | null>(null)
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Level, Unit } from '@/content/types.ts'
import { LEVELS, lessonsOf } from '@/content/course.ts'
import { TRACKS } from '@/content/tracks/index.ts'
import {
  P, dueCount, lessonUnlocked, levelUnlocked, nextLesson, unitDone, unitProgress, unitUnlocked, xpToday, streakActiveToday as streakToday,
} from '@/lib/store.ts'
import { account } from '@/lib/account.ts'
import { fromInstagram, dismissInstagram } from '@/lib/instagram.ts'
import { finishWelcome, welcomeOpen } from '@/lib/welcome.ts'
import { APP } from '@/app.ts'
import { LANGS, t } from '@/i18n/index.ts'
import AppIcon from '@/components/AppIcon.vue'
import MeowCat from '@/components/MeowCat.vue'
import FaText from '@/components/FaText.vue'
import BottomSheet from '@/components/BottomSheet.vue'

const router = useRouter()
const next = computed(() => nextLesson())
const rtl = APP.uiDir === 'rtl'
const faNum = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
const num = (n: number) => (rtl ? faNum(n) : String(n))

/* ---------- Levels and tracks ---------- */

interface Group { id: string; code: string; name: string; fa: string; tr: string; blurb: string; units: Unit[]; level?: Level }
const groups = computed<Group[]>(() => [
  ...LEVELS.map((l) => ({ id: l.level, code: l.level, name: l.name, fa: l.fa, tr: l.tr, blurb: l.blurb, units: l.units, level: l.level })),
  ...TRACKS.filter((x) => x.units.length).map((x) => ({ id: x.id, code: t(x.name), name: t(x.name), fa: x.fa, tr: x.tr, blurb: t(x.blurb), units: x.units })),
])
const firstLevelOpen = LEVELS.find((l) => levelUnlocked(l.level) && !l.units.every(unitDone))?.level ?? 'A1'
if (!picked.value || !groups.value.some((g) => g.id === picked.value)) picked.value = firstLevelOpen
const group = computed(() => groups.value.find((g) => g.id === picked.value) ?? groups.value[0])
const groupOpen = (g: Group) => !g.level || levelUnlocked(g.level)
const groupPct = (g: Group) => Math.round((g.units.reduce((n, u) => n + unitProgress(u), 0) / Math.max(1, g.units.length)) * 100)
const doneIn = (g: Group) => g.units.filter(unitDone).length

/** The unit to do next on this path: the one holding the next lesson, else the first open unfinished one. */
const curIdx = computed(() => {
  const us = group.value.units
  const i = next.value ? us.indexOf(next.value.unit) : -1
  return i >= 0 ? i : us.findIndex((u) => unitUnlocked(u) && !unitDone(u))
})
type NodeState = 'done' | 'current' | 'open' | 'locked'
function stateOf(u: Unit, i: number): NodeState {
  if (unitDone(u)) return 'done'
  if (!unitUnlocked(u)) return 'locked'
  return i === curIdx.value ? 'current' : 'open'
}
function nodeLabel(u: Unit, s: NodeState) {
  if (s === 'done') return t('{name}, finished', { name: u.title })
  if (s === 'locked') return t('{name}, locked', { name: u.title })
  return u.title
}

/* ---------- The winding path ---------- */

const W = 300 // path width in px; nodes wind left and right of its centre
const STEP = 118
const TOP = 58
const AMP = 82
const pos = (i: number) => {
  const x = W / 2 + Math.round(Math.sin((i * Math.PI) / 3) * AMP)
  return { x: rtl ? W - x : x, y: TOP + i * STEP }
}
const hasTest = computed(() => !!group.value.level)
const points = computed(() => Array.from({ length: group.value.units.length + (hasTest.value ? 1 : 0) }, (_, i) => pos(i)))
const pathHeight = computed(() => TOP + (points.value.length - 1) * STEP + 96)
function curve(pts: { x: number; y: number }[]) {
  if (!pts.length) return ''
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], m = (a.y + b.y) / 2
    d += ` C${a.x},${m} ${b.x},${m} ${b.x},${b.y}`
  }
  return d
}
const trail = computed(() => curve(points.value))
/** The stretch already walked: up to the current unit, or all of it once every unit is done. */
const walked = computed(() => {
  const us = group.value.units
  const last = curIdx.value >= 0 ? curIdx.value : us.every(unitDone) ? points.value.length - 1 : -1
  return last > 0 ? curve(points.value.slice(0, last + 1)) : ''
})
const testState = computed<NodeState>(() => {
  const lv = group.value.level
  if (!lv) return 'locked'
  if (P.passed[lv]) return 'done'
  return levelUnlocked(lv) ? 'open' : 'locked'
})

/** Pishi sits beside the current unit (asleep at the start of a locked level, cheering at the end of a finished one). */
const greetMood = computed(() => {
  if (xpToday() >= P.settings.goal) return 'cheer' as const
  if (dueCount() > 0) return 'think' as const
  if (P.streak > 0 && !streakToday()) return 'sad' as const
  return 'wave' as const
})
const pishi = computed(() => {
  const us = group.value.units
  let i = curIdx.value
  let mood: 'cheer' | 'think' | 'sad' | 'wave' | 'sleep' = greetMood.value
  if (i < 0) {
    const all = us.length > 0 && us.every(unitDone)
    i = all ? us.length - 1 : 0
    mood = all ? 'cheer' : 'sleep'
  }
  const p = pos(i)
  const side = p.x >= W / 2 ? -1 : 1
  return { x: p.x + side * 100, y: p.y, mood }
})

const scroller = ref<HTMLElement>()
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
function scrollToCurrent(smooth: boolean) {
  const el = scroller.value
  if (!el) return
  const i = curIdx.value >= 0 ? curIdx.value : group.value.units.every(unitDone) ? group.value.units.length - 1 : 0
  const top = Math.max(0, pos(i).y - el.clientHeight / 2 + 40)
  el.scrollTo({ top, behavior: smooth && !reduced() ? 'smooth' : 'auto' })
}
const switcher = ref<HTMLElement>()
function showPicked(smooth: boolean) {
  switcher.value?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: smooth && !reduced() ? 'smooth' : 'auto' })
}
onMounted(() => { void nextTick(() => { scrollToCurrent(false); showPicked(false) }) })
watch(picked, () => { void nextTick(() => { scrollToCurrent(true); showPicked(true) }) })
watch(welcomeOpen, (open) => { if (!open) void nextTick(() => scrollToCurrent(false)) })

/* ---------- The unit sheet ---------- */

// shallowRef: the unit object itself (not a reactive copy), so indexOf and the unlock checks find it.
const sel = shallowRef<Unit | null>(null)
const sheetOpen = ref(false)
function openUnit(u: Unit) {
  sel.value = u
  sheetOpen.value = true
}
const selLessons = computed(() => (sel.value ? lessonsOf(sel.value) : []))
const selDone = computed(() => selLessons.value.filter((l) => P.done[l.key]).length)
const selOpen = computed(() => !!sel.value && unitUnlocked(sel.value))
const selLevelTest = computed(() => {
  const u = sel.value
  return u && LEVELS.some((l) => l.units.includes(u)) && levelUnlocked(u.level) && !P.passed[u.level] ? u.level : null
})
/** Same as the unit page: the first unlocked, unfinished lesson (or the first one again once all are done). */
const selKey = computed(() => {
  const u = sel.value
  if (!u) return null
  return selLessons.value.find((l) => !P.done[l.key] && lessonUnlocked(u, l.key))?.key ?? (unitDone(u) ? selLessons.value[0]?.key : null)
})
const selAction = computed(() => {
  if (!sel.value) return ''
  if (unitDone(sel.value)) return t('Practise again')
  return selDone.value ? t('Continue') : t('Start')
})
function startSel() {
  if (!selKey.value) return
  const [u, k] = selKey.value.split('/')
  sheetOpen.value = false
  router.push({ name: 'lesson', query: { u, k } })
}

/* ---------- First visit ---------- */

const showWelcome = welcomeOpen
const step = ref(1)
function goNext() {
  finishWelcome()
  if (next.value) {
    const [u, k] = next.value.key.split('/')
    router.push({ name: 'lesson', query: { u, k } })
  }
}
function testA1() {
  finishWelcome()
  router.push({ name: 'lesson', query: { test: 'A1' } })
}
</script>

<template>
  <main v-if="showWelcome" class="welcome">
    <section v-if="fromInstagram" class="insta" aria-live="polite">
      <MeowCat mood="cheer" :size="40" />
      <span class="insta-text"><b>{{ t('“Comment MEOW” brought you here 🐱') }}</b>
        <RouterLink :to="{ name: 'quick', query: { mode: 'guess' } }">{{ t('3-second challenge') }}</RouterLink></span>
      <button type="button" class="icon-btn" :aria-label="t('Hide this')" @click="dismissInstagram"><AppIcon name="x" /></button>
    </section>

    <div v-if="step === 1" class="w-step">
      <MeowCat mood="wave" :size="150" class="w-cat hero-cat" :bubble="`${APP.pishi.hello.tr} ${t('(Hello! I am Pishi.)')}`" :bubble-fa="APP.pishi.hello.fa" />
      <p class="eyebrow">{{ t('Persian for English speakers · A1 to B2') }}</p>
      <h1>{{ t('Learn to read, speak and understand Persian.') }}</h1>
      <p class="muted">{{ t("You don't need to read the Persian alphabet: every word comes with Finglish, Persian in English letters (salâm = hello). Short lessons, grammar, dialogues, readings and spaced review.") }}</p>
      <div v-if="LANGS.length > 1" class="speak" role="radiogroup" :aria-label="t('I speak')">
        <span class="muted small">{{ t('I speak') }}</span>
        <button v-for="l in LANGS" :key="l.code" type="button" class="chip-btn" :class="{ on: P.settings.lang === l.code }" role="radio" :aria-checked="P.settings.lang === l.code" @click="P.settings.lang = l.code">{{ l.name }}</button>
      </div>
      <div class="w-foot">
        <span class="dots" aria-hidden="true"><i class="on"></i><i></i></span>
        <button type="button" class="btn primary w-go" @click="step = 2">{{ t('Next') }} <AppIcon name="arrow" class="fwd" /></button>
      </div>
    </div>

    <div v-else class="w-step">
      <MeowCat mood="happy" :size="110" class="w-cat" />
      <h1>{{ t('Where do you want to start?') }}</h1>
      <p class="muted">{{ account.enabled ? t('Sign in to keep your progress on every device.') : t('Your progress stays in this browser.') }}</p>
      <div class="w-choices">
        <button type="button" class="btn primary" @click="goNext">{{ t('Start at A1') }}</button>
        <button type="button" class="btn ghost" @click="testA1">{{ t('I know some Persian: test out of A1') }}</button>
        <button type="button" class="btn ghost" @click="finishWelcome">{{ t('Show me the path first') }}</button>
      </div>
      <div class="w-foot">
        <button type="button" class="btn ghost sm" @click="step = 1"><AppIcon name="arrow" class="back-ico" /> {{ t('Back') }}</button>
        <span class="dots" aria-hidden="true"><i></i><i class="on"></i></span>
      </div>
    </div>
  </main>

  <main v-else class="learn">
    <section v-if="fromInstagram" class="insta wrap-in" aria-live="polite">
      <MeowCat mood="cheer" :size="40" />
      <span class="insta-text"><b>{{ t('“Comment MEOW” brought you here 🐱') }}</b>
        <RouterLink :to="{ name: 'quick', query: { mode: 'guess' } }">{{ t('3-second challenge') }}</RouterLink></span>
      <button type="button" class="icon-btn" :aria-label="t('Hide this')" @click="dismissInstagram"><AppIcon name="x" /></button>
    </section>

    <nav ref="switcher" class="switch" :aria-label="t('Levels')">
      <button
        v-for="g in groups" :key="g.id" type="button" class="sw" :class="{ on: g.id === group.id, locked: !groupOpen(g), track: !g.level }"
        :aria-pressed="g.id === group.id" @click="picked = g.id"
      >
        <span class="sw-code">{{ g.code }}<AppIcon v-if="!groupOpen(g)" name="lock" class="sw-ico" /><AppIcon v-else-if="g.level && P.passed[g.level]" name="trophy" class="sw-ico" /></span>
        <span class="sw-bar"><i :style="{ width: groupPct(g) + '%' }"></i></span>
      </button>
    </nav>

    <header class="ghead wrap-in">
      <div class="ghead-text">
        <h1>
          <template v-if="group.level">{{ group.level }} · </template>{{ group.name }}
          <FaText :fa="group.fa" :tr="group.tr" inline size="sm" class="g-fa" />
        </h1>
        <p class="muted small g-blurb">
          <template v-if="!groupOpen(group)"><b>{{ t('Locked.') }}</b> {{ t('Finish every unit of the level before, or pass its level test, to open {level}.', { level: group.code }) }}</template>
          <template v-else>{{ group.blurb }}</template>
        </p>
      </div>
      <span class="chip" :class="doneIn(group) === group.units.length ? 'accent' : ''">{{ doneIn(group) }}/{{ group.units.length }}</span>
    </header>

    <div ref="scroller" class="path-scroll">
      <div class="path" :style="{ width: W + 'px', height: pathHeight + 'px' }">
        <svg class="trail" :width="W" :height="pathHeight" :viewBox="`0 0 ${W} ${pathHeight}`" aria-hidden="true" focusable="false">
          <path :d="trail" class="t-base" />
          <path v-if="walked" :d="walked" class="t-walked" />
        </svg>
        <ol class="nodes" :aria-label="t('Units')">
          <li v-for="(u, i) in group.units" :key="u.id" class="spot" :style="{ left: points[i].x + 'px', top: points[i].y + 'px' }">
            <button
              type="button" class="node" :class="stateOf(u, i)" aria-haspopup="dialog"
              :aria-label="nodeLabel(u, stateOf(u, i))" :aria-current="stateOf(u, i) === 'current' ? 'step' : undefined"
              :style="{ '--pct': Math.round(unitProgress(u) * 100) + '%' }" @click="openUnit(u)"
            >
              <span class="star">
                <AppIcon v-if="stateOf(u, i) === 'done'" name="check" />
                <AppIcon v-else-if="stateOf(u, i) === 'locked'" name="lock" />
                <span v-else class="n-num">{{ num(i + 1) }}</span>
              </span>
            </button>
            <span class="n-label" aria-hidden="true">{{ u.title }}</span>
          </li>
          <li v-if="group.level" class="spot" :style="{ left: points[group.units.length].x + 'px', top: points[group.units.length].y + 'px' }">
            <RouterLink v-if="testState === 'open'" class="node test open" :to="{ name: 'lesson', query: { test: group.level } }" :aria-label="t('Test out of {level}', { level: group.level })">
              <span class="star"><AppIcon name="trophy" /></span>
            </RouterLink>
            <span v-else class="node test" :class="testState" role="img" :aria-label="testState === 'done' ? t('Test passed') : t('{name}, locked', { name: t('Test out of {level}', { level: group.level }) })">
              <span class="star"><AppIcon :name="testState === 'done' ? 'trophy' : 'lock'" /></span>
            </span>
            <span class="n-label" aria-hidden="true">{{ testState === 'done' ? t('Test passed') : t('Test out of {level}', { level: group.level }) }}</span>
          </li>
        </ol>
        <MeowCat :mood="pishi.mood" :size="64" class="pishi" :style="{ left: pishi.x - 32 + 'px', top: pishi.y - 40 + 'px' }" />
      </div>
    </div>

    <BottomSheet :open="sheetOpen" labelledby="sheet-title" @close="sheetOpen = false">
      <template v-if="sel">
        <p class="eyebrow">{{ group.level ? `${group.level} · ${group.name}` : group.name }} · {{ t('Unit {n}', { n: num(group.units.indexOf(sel) + 1) }) }}</p>
        <div class="s-head">
          <h2 id="sheet-title">{{ sel.title }}</h2>
          <FaText :fa="sel.fa" :tr="sel.tr" size="md" keep-tr class="g-fa" />
        </div>
        <p class="muted">{{ sel.can }}</p>
        <div class="s-prog">
          <div class="meter accent" role="progressbar" :aria-label="t('Unit progress')" :aria-valuenow="Math.round(unitProgress(sel) * 100)" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: Math.round(unitProgress(sel) * 100) + '%' }"></i></div>
          <span class="small muted">{{ t('{n} of {total} lessons done', { n: selDone, total: selLessons.length }) }}</span>
        </div>
        <p v-if="!selOpen" class="tip"><b>{{ t('Locked.') }}</b> {{ t('Finish the unit before this one, or pass the {level} level test, to open it.', { level: sel.level }) }}</p>
        <div class="s-acts">
          <button v-if="selOpen && selKey" type="button" class="btn primary" autofocus @click="startSel">{{ selAction }}</button>
          <RouterLink class="btn ghost" :to="{ name: 'unit', params: { id: sel.id } }">{{ t('Read the unit') }}</RouterLink>
          <RouterLink v-if="selLevelTest" class="btn ghost" :to="{ name: 'lesson', query: { test: selLevelTest } }">{{ t('Test out of {level}', { level: selLevelTest }) }}</RouterLink>
        </div>
      </template>
    </BottomSheet>
  </main>
</template>

<style scoped>
/* ---------- Learn: a screen-sized column, the path scrolls on its own ---------- */
.learn { height: calc(100dvh - var(--top-h) - var(--tab-h) - env(safe-area-inset-top, 0px)); display: flex; flex-direction: column; max-width: 680px; margin: 0 auto; overflow: hidden }
.wrap-in { margin-inline: max(16px, env(safe-area-inset-left, 0px)) max(16px, env(safe-area-inset-right, 0px)) }

.switch { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 12px max(16px, env(safe-area-inset-left, 0px)) 4px; flex: none; scroll-snap-type: x proximity }
.switch::-webkit-scrollbar { display: none }
.sw { flex: none; scroll-snap-align: center; display: flex; flex-direction: column; align-items: stretch; gap: 5px; min-width: 64px; padding: 7px 12px 8px; border-radius: 14px; border: 2px solid var(--line); background: var(--surface); cursor: pointer; font: inherit; color: var(--ink) }
.sw.track { min-width: 0 }
.sw.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent) }
.sw.locked:not(.on) { color: var(--muted) }
.sw-code { display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-family: var(--f-display); font-weight: 800; font-size: 1.05rem; white-space: nowrap; line-height: 1.2 }
.sw.track .sw-code { font-size: 0.92rem }
.sw-ico { width: 15px; height: 15px }
.sw-bar { height: 4px; border-radius: 9px; background: var(--sunk); overflow: hidden }
.sw-bar i { display: block; height: 100%; background: var(--accent) }

.ghead { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-block: 8px 6px; flex: none }
.ghead-text { min-width: 0 }
.ghead h1 { font-size: 1.3rem; font-weight: 800; display: flex; align-items: baseline; gap: 4px 10px; flex-wrap: wrap }
.g-fa :deep(.fa) { color: var(--accent) }
.g-blurb { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 2px }

.path-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; position: relative;
  mask-image: linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%) }
.path { position: relative; margin: 0 auto }
.trail { position: absolute; inset: 0; overflow: visible }
.t-base { fill: none; stroke: var(--sunk); stroke-width: 16; stroke-linecap: round }
.t-walked { fill: none; stroke: var(--accent); stroke-width: 5; stroke-linecap: round; stroke-dasharray: 0.5 13; opacity: 0.85 }
.nodes { list-style: none; margin: 0; padding: 0 }
.spot { position: absolute; width: 0; height: 0 }

/* A unit: an eight-point star tile (the khatam of Persian tilework) set in a ring that fills with progress. */
.node { position: absolute; left: -36px; top: -36px; width: 72px; height: 72px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; display: grid; place-items: center; text-decoration: none; color: var(--ink);
  background: conic-gradient(var(--accent) var(--pct, 0%), var(--line) 0); box-shadow: 0 6px 14px -8px rgba(19, 33, 58, 0.5) }
.node::before { content: ''; position: absolute; inset: 5px; border-radius: 50%; background: var(--surface) }
.star { position: relative; width: 50px; height: 50px; display: grid; place-items: center; background: var(--lapis-soft); color: var(--lapis); transition: transform 0.25s ease;
  clip-path: polygon(50% 0%,65.31% 13.04%,85.36% 14.64%,86.96% 34.69%,100% 50%,86.96% 65.31%,85.36% 85.36%,65.31% 86.96%,50% 100%,34.69% 86.96%,14.64% 85.36%,13.04% 65.31%,0% 50%,13.04% 34.69%,14.64% 14.64%,34.69% 13.04%) }
.star .ico { width: 24px; height: 24px }
.n-num { font-family: var(--f-display); font-weight: 800; font-size: 1.25rem }
.node:hover .star { transform: rotate(22.5deg) }
.node:hover .star > * { transform: rotate(-22.5deg) }
.node.done { background: var(--accent) }
.node.done .star { background: var(--accent); color: var(--accent-ink) }
.node.done::before { background: var(--accent-soft) }
.node.current { width: 84px; height: 84px; left: -42px; top: -42px }
.node.current .star { width: 58px; height: 58px; background: var(--saffron-bright); color: #3a2600 }
.node.current::after { content: ''; position: absolute; inset: -8px; border-radius: 50%; border: 2px solid var(--saffron-bright); opacity: 0.6; animation: halo 2.2s ease-out infinite }
.node.locked { background: var(--line); box-shadow: none }
.node.locked .star { background: var(--sunk); color: var(--muted) }
.node.test .star { background: var(--saffron-soft); color: var(--saffron) }
.node.test.open { background: var(--saffron-bright) }
.node.test.done { background: var(--saffron-bright) }
.node.test.done .star { background: var(--saffron-bright); color: #3a2600 }
.node.test.locked .star { background: var(--sunk); color: var(--muted) }
.n-label { position: absolute; left: 0; top: 42px; transform: translateX(-50%); width: max-content; max-width: 136px; text-align: center; font-size: 0.78rem; font-weight: 600; line-height: 1.25; color: var(--muted);
  padding: 2px 8px; border-radius: 9px; background: var(--bg); box-shadow: 0 0 0 1px var(--sunk);
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; pointer-events: none }
.node.current + .n-label { top: 48px; color: var(--ink) }
.pishi { position: absolute; pointer-events: none }
@keyframes halo { 0% { transform: scale(0.92); opacity: 0.7 } 100% { transform: scale(1.18); opacity: 0 } }

/* ---------- The unit sheet ---------- */
.s-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-inline-end: 36px }
.s-head h2 { font-size: 1.45rem; font-weight: 800 }
.s-prog { display: flex; flex-direction: column; gap: 6px }
.s-acts { display: flex; flex-direction: column; gap: 10px; margin-top: 4px }
.s-acts .btn { width: 100% }

/* ---------- Instagram welcome: a compact banner ---------- */
.insta { display: flex; align-items: center; gap: 10px; padding: 6px 6px 6px 10px; margin-top: 10px; border-radius: 16px; background: linear-gradient(135deg, var(--saffron-soft), var(--surface)); border: 1px solid var(--line); flex: none }
.insta-text { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: 0.88rem; line-height: 1.3 }

/* ---------- First visit ---------- */
.welcome { min-height: 100dvh; max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; padding: max(20px, env(safe-area-inset-top, 0px)) max(20px, env(safe-area-inset-right, 0px)) max(20px, env(safe-area-inset-bottom, 0px)) max(20px, env(safe-area-inset-left, 0px)) }
.w-step { flex: 1; display: flex; flex-direction: column; gap: 14px; justify-content: center }
.w-step h1 { font-size: 1.85rem; font-weight: 800 }
.w-cat { flex-direction: column-reverse; align-items: center; gap: 4px; align-self: center }
.w-cat :deep(.bubble::before) { left: 50%; top: auto; bottom: -9px; transform: translateX(-50%) rotate(-45deg) }
.speak { display: flex; align-items: center; gap: 6px; flex-wrap: wrap }
.chip-btn { border: 1.5px solid var(--line); background: var(--surface); border-radius: 999px; padding: 4px 12px; font-size: 0.85rem; font-weight: 600; cursor: pointer }
.chip-btn.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent) }
.w-choices { display: flex; flex-direction: column; gap: 10px; margin-top: 4px }
.w-choices .btn { width: 100%; text-align: center }
.w-foot { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 16px }
.w-go { min-width: 140px }
.fwd { transform: scaleX(-1) }
[dir='rtl'] .fwd { transform: none }
[dir='rtl'] .back-ico { transform: scaleX(-1) }
.dots { display: flex; gap: 6px }
.dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--line) }
.dots i.on { width: 22px; border-radius: 9px; background: var(--accent) }

@media (min-width: 721px) {
  .learn { padding-top: 8px }
  .switch { justify-content: center }
}
@media (max-height: 640px) {
  .w-step h1 { font-size: 1.5rem }
}
</style>

