<script setup lang="ts">
import { computed } from 'vue'
import { ALL_WORDS, LEVELS } from '@/content/course.ts'
import { P, learnedCount, seenCount, today, unitDone } from '@/lib/store.ts'

const WEEKS = 12
const days = computed(() => {
  const t = today()
  // Start on the Saturday WEEKS weeks back: the Persian week starts on Saturday.
  const dow = (new Date().getDay() + 1) % 7
  const start = t - dow - (WEEKS - 1) * 7
  return Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = start + i
    const xp = P.days[d] ?? 0
    return { d, xp, future: d > t, level: xp === 0 ? 0 : xp < 15 ? 1 : xp < 30 ? 2 : 3 }
  })
})
const activeDays = computed(() => Object.values(P.days).filter((x) => x > 0).length)
const dateOf = (d: number) => new Date(d * 86400000).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'short', day: 'numeric' })
</script>

<template>
  <main class="wrap page">
    <h1>Progress</h1>
    <div class="tiles">
      <div class="card tile"><span class="eyebrow">Streak</span><b>{{ P.streak }}</b><span class="muted small">best {{ P.bestStreak }}</span></div>
      <div class="card tile"><span class="eyebrow">Total XP</span><b>{{ P.xp }}</b><span class="muted small">{{ activeDays }} active day{{ activeDays === 1 ? '' : 's' }}</span></div>
      <div class="card tile"><span class="eyebrow">Words learned</span><b>{{ learnedCount() }}</b><span class="muted small">{{ seenCount() }} met of {{ ALL_WORDS.length }}</span></div>
    </div>

    <section class="card">
      <h2>Last {{ WEEKS }} weeks</h2>
      <p class="muted small">Each square is a day, Saturday to Friday down each column.</p>
      <div class="cal-wrap">
        <div class="cal" role="img" :aria-label="`Activity over the last ${WEEKS} weeks: ${activeDays} active days`">
          <span v-for="x in days" :key="x.d" class="day" :class="['l' + x.level, { future: x.future }]" :title="`${dateOf(x.d)}: ${x.xp} XP`"></span>
        </div>
      </div>
      <div class="legend small muted">Less <span class="day l0"></span><span class="day l1"></span><span class="day l2"></span><span class="day l3"></span> More</div>
    </section>

    <section class="card">
      <h2>Levels</h2>
      <ul class="levels">
        <li v-for="lv in LEVELS" :key="lv.level">
          <span class="lv">{{ lv.level }}</span>
          <span class="meter accent"><i :style="{ width: Math.round((lv.units.filter(unitDone).length / lv.units.length) * 100) + '%' }"></i></span>
          <span class="small muted">{{ lv.units.filter(unitDone).length }}/{{ lv.units.length }} units<template v-if="P.passed[lv.level]"> · test passed</template></span>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
h1 { font-size: 1.7rem; font-weight: 800 }
h2 { font-size: 1.15rem; font-weight: 800; margin-bottom: 4px }
.tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px }
.tile { display: flex; flex-direction: column; gap: 2px }
.tile b { font-family: var(--f-display); font-size: 2rem; font-weight: 800; font-variant-numeric: tabular-nums }
.cal-wrap { overflow-x: auto; margin-top: 12px }
.cal { display: grid; grid-template-rows: repeat(7, 14px); grid-auto-flow: column; grid-auto-columns: 14px; gap: 4px; width: max-content }
.day { display: inline-block; width: 14px; height: 14px; border-radius: 4px; background: var(--sunk) }
.day.l1 { background: color-mix(in srgb, var(--accent) 35%, var(--sunk)) }
.day.l2 { background: color-mix(in srgb, var(--accent) 65%, var(--sunk)) }
.day.l3 { background: var(--accent) }
.day.future { opacity: 0.3 }
.legend { display: flex; align-items: center; gap: 4px; margin-top: 10px }
.levels { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px }
.levels li { display: grid; grid-template-columns: 36px 1fr auto; align-items: center; gap: 12px }
.lv { font-family: var(--f-display); font-weight: 800 }
@media (max-width: 520px) { .tiles { grid-template-columns: 1fr 1fr } .tile b { font-size: 1.6rem } .levels li { grid-template-columns: 36px 1fr } .levels li .small { grid-column: 2 } }
</style>
