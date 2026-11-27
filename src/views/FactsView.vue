<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { FACTS } from '@/content/facts.ts'
import { P, MAX_HEARTS, readFact } from '@/lib/store.ts'
import { lang, t } from '@/i18n/index.ts'
import { meow } from '@/lib/sfx.ts'
import { speak } from '@/lib/speech.ts'
import AppIcon from '@/components/AppIcon.vue'
import FaText from '@/components/FaText.vue'
import MeowCat from '@/components/MeowCat.vue'
import SpeakButton from '@/components/SpeakButton.vue'

/**
 * "Did you know?": one fun fact at a time, each with a word. Staying on a new fact for a few
 * seconds earns a heart (once per fact); unread facts come first.
 */
const READ_MS = 5000
const order = [...FACTS].sort((a, b) => Number(!!P.facts[a.id]) - Number(!!P.facts[b.id]))
const i = ref(0)
const fact = computed(() => order[i.value % order.length])
const body = computed(() => (lang() === 'it' ? fact.value.it : fact.value.en))
const meaning = computed(() => (lang() === 'it' ? fact.value.word.it : fact.value.word.en))
const readCount = computed(() => FACTS.filter((f) => P.facts[f.id]).length)

const progress = ref(0)
const earned = ref<'heart' | 'xp' | null>(null)
let raf = 0
function startTimer() {
  cancelAnimationFrame(raf)
  earned.value = null
  progress.value = P.facts[fact.value.id] ? 1 : 0
  if (progress.value) return
  const start = performance.now()
  const tick = (now: number) => {
    progress.value = Math.min(1, (now - start) / READ_MS)
    if (progress.value < 1) { raf = requestAnimationFrame(tick); return }
    earned.value = readFact(fact.value.id)
    if (earned.value) meow('happy')
  }
  raf = requestAnimationFrame(tick)
}
watch(i, startTimer)
onMounted(startTimer)
onBeforeUnmount(() => cancelAnimationFrame(raf))

const isNew = computed(() => !P.facts[fact.value.id] || earned.value !== null)
function next() {
  i.value++
  if (P.settings.autoplay) void speak(fact.value.word.fa)
}
function prev() { i.value = (i.value - 1 + order.length) % order.length }
</script>

<template>
  <main class="wrap page facts">
    <RouterLink to="/" class="back"><AppIcon name="arrow" /> {{ t('Learn') }}</RouterLink>

    <header class="f-head">
      <MeowCat mood="think" :size="84" />
      <div>
        <h1>{{ t('Did you know?') }}</h1>
        <p class="muted">{{ t('Fun facts about Persian and Iran, each with a word. Read a new one to earn a heart.') }}</p>
        <p class="small muted">{{ t('{n} of {total} read', { n: readCount, total: FACTS.length }) }} · <AppIcon name="heart" class="h" /> {{ P.settings.relaxed ? '∞' : `${P.hearts}/${MAX_HEARTS}` }}</p>
      </div>
    </header>

    <article :key="fact.id" class="card fact" aria-live="polite">
      <span class="emoji" aria-hidden="true">{{ fact.emoji }}</span>
      <h2>{{ body.title }}</h2>
      <p class="text">{{ body.text }}</p>
      <div class="word">
        <SpeakButton :text="fact.word.fa" big />
        <div>
          <FaText :fa="fact.word.fa" :tr="fact.word.tr" size="lg" keep-tr />
          <span class="muted">{{ meaning }}</span>
        </div>
      </div>

      <div v-if="isNew" class="reward" role="status">
        <template v-if="earned === 'heart'"><AppIcon name="heart" class="h" /> <b>{{ t('+1 heart! Thanks for reading.') }}</b></template>
        <template v-else-if="earned === 'xp'"><b>{{ t('Hearts are full, so you get +2 XP instead.') }}</b></template>
        <template v-else>
          <span class="small muted">{{ t('Keep reading… a heart is on its way') }}</span>
          <span class="bar" aria-hidden="true"><i :style="{ width: progress * 100 + '%' }"></i></span>
        </template>
      </div>
      <p v-else class="small muted">{{ t('Already read: no heart this time, but it’s still true!') }}</p>
    </article>

    <div class="nav">
      <button type="button" class="btn ghost" :aria-label="t('Previous fact')" @click="prev"><AppIcon name="arrow" /></button>
      <button type="button" class="btn primary" @click="next">{{ t('Next fact') }}</button>
    </div>
  </main>
</template>

<style scoped>
.back { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; font-weight: 500 }
.f-head { display: flex; gap: 14px; align-items: center }
.f-head h1 { font-size: 1.7rem; font-weight: 800 }
.h { color: var(--bad); vertical-align: -2px }
.fact { display: flex; flex-direction: column; gap: 12px; padding: 22px; animation: pop 0.25s ease-out }
.emoji { font-size: 2.6rem; line-height: 1 }
.fact h2 { font-size: 1.35rem; font-weight: 800 }
.text { font-size: 1.05rem; line-height: 1.6 }
.word { display: flex; gap: 14px; align-items: center; background: var(--accent-soft); border-radius: 16px; padding: 12px 14px }
.word > div { display: flex; flex-direction: column; gap: 2px }
.reward { display: flex; flex-direction: column; gap: 6px }
.bar { height: 8px; border-radius: 4px; background: var(--sunk); overflow: hidden }
.bar i { display: block; height: 100%; background: var(--bad) }
.nav { display: flex; justify-content: space-between; gap: 10px }
.nav .btn.ghost :deep(svg) { transform: none }
@keyframes pop { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .fact { animation: none } }
</style>
