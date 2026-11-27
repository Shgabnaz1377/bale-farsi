<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { IDIOMS } from '@/content/idioms.ts'
import { P, MAX_HEARTS, learnIdiom } from '@/lib/store.ts'
import { lang, t } from '@/i18n/index.ts'
import { meow } from '@/lib/sfx.ts'
import { speak, stopSpeech } from '@/lib/speech.ts'
import AppIcon from '@/components/AppIcon.vue'
import FaText from '@/components/FaText.vue'
import MeowCat from '@/components/MeowCat.vue'
import SpeakButton from '@/components/SpeakButton.vue'

/**
 * Persian idioms, acted out by Pishi. Play runs the scene:
 *   1 say:     Pishi says the idiom (head bobbing while it talks)
 *   2 literal: Pishi shakes its head at what it says word for word
 *   3 meaning: Pishi nods at what it really means (a new idiom earns a heart here)
 *   4 example: an example sentence, said aloud
 * "Skip to the meaning" jumps straight to 4. Unlearned idioms come first; rude ones only on request.
 */
const showRude = ref(false)
// Sorted once on open, so learning one doesn't reshuffle the list under you.
const order = [...IDIOMS].sort((a, b) => Number(!!P.idioms[a.id]) - Number(!!P.idioms[b.id]))
const list = computed(() => order.filter((d) => showRude.value || !d.rude))
const i = ref(0)
const idiom = computed(() => list.value[i.value % list.value.length])
const L = <T,>(o: { en: T; it: T }) => (lang() === 'it' ? o.it : o.en)
const learned = computed(() => IDIOMS.filter((d) => P.idioms[d.id]).length)

type Step = 0 | 1 | 2 | 3 | 4
const step = ref<Step>(0)
const earned = ref<'heart' | 'xp' | null>(null)
let run = 0

const mood = computed(() => (step.value === 2 ? 'think' : step.value >= 3 ? 'happy' : 'idle'))
const act = computed(() => ['', 'talk', 'shake', 'nod', ''][step.value])

function pause(ms: number, id: number): Promise<boolean> {
  return new Promise((resolve) => setTimeout(() => resolve(id === run), ms))
}

function reward() {
  if (earned.value !== null || P.idioms[idiom.value.id]) return
  earned.value = learnIdiom(idiom.value.id)
  if (earned.value) meow('happy')
}

async function play() {
  const id = ++run
  stopSpeech()
  earned.value = null
  step.value = 1
  const start = Date.now()
  await speak(idiom.value.fa)
  // Without a recording or device voice, give the reader time to take the line in.
  if (!(await pause(Math.max(400, 1800 - (Date.now() - start)), id))) return
  step.value = 2
  if (!(await pause(3200, id))) return
  step.value = 3
  reward()
  if (!(await pause(3400, id))) return
  step.value = 4
  await speak(idiom.value.example.fa)
}

function skip() {
  run++
  stopSpeech()
  step.value = 4
  reward()
}

function reset() {
  run++
  stopSpeech()
  step.value = P.idioms[idiom.value.id] ? 4 : 0
  earned.value = null
}
watch([i, showRude], reset, { immediate: true })
onBeforeUnmount(() => { run++; stopSpeech() })

function next() { i.value = (i.value + 1) % list.value.length }
function prev() { i.value = (i.value - 1 + list.value.length) % list.value.length }
</script>

<template>
  <main class="wrap page idioms">
    <RouterLink to="/" class="back"><AppIcon name="arrow" /> {{ t('Learn') }}</RouterLink>

    <header>
      <h1>{{ t('Persian idioms') }}</h1>
      <p class="muted">{{ t('Pishi acts out Persian sayings: hear one, see what it says word for word, then what it really means. Each new one wins a heart.') }}</p>
      <p class="small muted">
        {{ t('{n} of {total} learned', { n: learned, total: IDIOMS.length }) }} ·
        <AppIcon name="heart" class="h" /> {{ P.settings.relaxed ? '∞' : `${P.hearts}/${MAX_HEARTS}` }}
      </p>
      <label class="check small"><input v-model="showRude" type="checkbox" /> {{ t('Show the rude ones too') }}</label>
    </header>

    <article :key="idiom.id" class="card idiom">
      <div class="scene" :class="act ? 'act-' + act : ''">
        <MeowCat :mood="mood" :size="120" />
        <div class="say">
          <span class="emoji" aria-hidden="true">{{ idiom.emoji }}</span>
          <FaText :fa="idiom.fa" :tr="idiom.tr" size="lg" keep-tr />
          <span v-if="idiom.rude" class="rude small">{{ t('Rude: only with close friends.') }}</span>
        </div>
      </div>

      <div class="controls">
        <button type="button" class="btn primary" @click="play">
          {{ step === 0 ? t('Play') : t('Play again') }}
        </button>
        <button v-if="step < 4" type="button" class="btn ghost" @click="skip">{{ t('Skip to the meaning') }}</button>
      </div>

      <div aria-live="polite" class="steps">
        <section v-if="step >= 2" class="panel literal">
          <h2>🙅 {{ t('Word for word') }}</h2>
          <p>“{{ L(idiom.literal) }}”</p>
        </section>
        <section v-if="step >= 3" class="panel meaning">
          <h2>✅ {{ t('What it really means') }}</h2>
          <p><b>{{ L(idiom.meaning) }}</b></p>
          <p v-if="idiom.like" class="small muted">{{ t('Like saying') }}: <i>{{ L(idiom.like) }}</i></p>
        </section>
        <section v-if="step >= 4" class="panel example">
          <h2>💬 {{ t('Example') }}</h2>
          <div class="ex">
            <SpeakButton :text="idiom.example.fa" />
            <div>
              <FaText :fa="idiom.example.fa" :tr="idiom.example.tr" keep-tr />
              <span class="muted">{{ lang() === 'it' ? idiom.example.it : idiom.example.en }}</span>
            </div>
          </div>
          <p v-if="idiom.note" class="small muted note">{{ L(idiom.note) }}</p>
        </section>
      </div>

      <div v-if="earned" class="reward" role="status">
        <template v-if="earned === 'heart'"><AppIcon name="heart" class="h" /> <b>{{ t('+1 heart! Thanks for reading.') }}</b></template>
        <b v-else>{{ t('Hearts are full, so you get +2 XP instead.') }}</b>
      </div>
    </article>

    <div class="nav">
      <button type="button" class="btn ghost" :aria-label="t('Previous idiom')" @click="prev"><AppIcon name="arrow" /></button>
      <button type="button" class="btn primary" @click="next">{{ t('Next idiom') }}</button>
    </div>
  </main>
</template>

<style scoped>
.back { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; font-weight: 500 }
header { display: flex; flex-direction: column; gap: 6px }
header h1 { font-size: 1.7rem; font-weight: 800 }
.h { color: var(--bad); vertical-align: -2px }
.check { display: inline-flex; gap: 8px; align-items: center; cursor: pointer }
.check input { accent-color: var(--accent); width: 17px; height: 17px }
.idiom { display: flex; flex-direction: column; gap: 14px; padding: 20px }
.scene { display: flex; gap: 14px; align-items: center }
.say { display: flex; flex-direction: column; gap: 4px; background: var(--accent-soft); border-radius: 16px; padding: 12px 14px; flex: 1; min-width: 0 }
.emoji { font-size: 1.8rem; line-height: 1 }
.rude { color: var(--bad); font-weight: 600 }
.controls, .nav { display: flex; gap: 10px; flex-wrap: wrap }
.nav { justify-content: space-between }
.nav .btn.ghost :deep(svg) { transform: none }
.steps { display: flex; flex-direction: column; gap: 10px }
.panel { border-radius: 14px; padding: 12px 14px; background: var(--sunk); animation: pop 0.25s ease-out }
.panel h2 { font-size: 0.95rem; font-weight: 700; margin-bottom: 4px }
.literal p { font-style: italic }
.meaning { background: var(--accent-soft) }
.ex { display: flex; gap: 12px; align-items: center }
.ex > div { display: flex; flex-direction: column; gap: 2px; min-width: 0 }
.note { margin-top: 8px }
.reward { display: flex; align-items: center; gap: 6px }

/* Pishi acts: bob while talking, shake the head at the literal meaning, nod at the real one. */
.scene :deep(.head) { transform-box: view-box; transform-origin: 100px 130px }
.act-talk :deep(.head) { animation: bob 0.32s ease-in-out infinite alternate }
.act-shake :deep(.head) { animation: shake 0.7s ease-in-out 3 }
.act-nod :deep(.head) { animation: nod 0.6s ease-in-out 3 }
@keyframes bob { from { transform: translateY(0) } to { transform: translateY(-3px) rotate(-2deg) } }
@keyframes shake { 0%, 100% { transform: rotate(0) } 25% { transform: rotate(-11deg) } 75% { transform: rotate(11deg) } }
@keyframes nod { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(7px) rotate(3deg) } }
@keyframes pop { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) {
  .scene :deep(.head) { animation: none !important }
  .panel { animation: none }
}
</style>
