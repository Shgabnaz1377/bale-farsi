<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { DialogueLine, Unit } from '@/content/types.ts'
import { dialogueVoices, genderOf } from '@/content/speakers.ts'
import { hasVoice, isSpeaking, speak, stopSpeech } from '@/lib/speech.ts'
import { castMember } from '@/content/cast.ts'
import SpeakButton from './SpeakButton.vue'
import CastFace from './CastFace.vue'
import FaText from './FaText.vue'
import { t } from '@/i18n/index.ts'
import { APP } from '@/app.ts'

// Bego Ciao's lines are Italian with a Persian-script pronunciation guide.
const trLabel = APP.target === 'it' ? t('Pronunciation') : t('Finglish')
const faLabel = APP.target === 'it' ? t('Italian') : t('Persian script')

/**
 * The dialogue player: each line in its speaker's voice, the playing line highlighted, Finglish /
 * script / translation toggles, and three ways through it:
 * - listen:  play the whole conversation
 * - repeat:  after each line, a pause to say it yourself
 * - role:    you take one speaker's part; on your lines you speak first, then hear the model
 * Every line has its speaker's round avatar, and a larger bust shows who is speaking now: its mouth moves
 * while that line's audio plays (the cast, src/content/cast.ts). Speakers outside the cast (Bego Ciao's
 * Italian names) get their initial.
 */
const props = defineProps<{ lines: DialogueLine[]; unitId?: string }>()
const voices = computed(() => dialogueVoices({ id: props.unitId ?? '', dialogue: props.lines } as Unit))
const speakers = computed(() => [...new Set(props.lines.map((l) => l.who))])

const showTr = ref(true)
const showFa = ref(true)
const showEn = ref(false)

type Mode = 'listen' | 'repeat' | 'role'
const mode = ref<Mode | null>(null)
const me = ref<string>('')
const current = ref(-1)
/** 0–1 while a "your turn" pause runs, else -1. */
const pause = ref(-1)
let stop = false

const gender = (who: string) => genderOf(who, props.unitId) ?? 'x'
const initial = (who: string) => who.replace(/^(Mr|Mrs|Ms|Dr|Agha|Khanom|Signor|Signora)\.?\s+/i, '').charAt(0).toUpperCase()
const inCast = (who: string) => !!castMember(who)

/** The line being said right now (by any button or mode), else the current line of a mode. */
const playing = computed(() => {
  const i = props.lines.findIndex((l) => isSpeaking(l.fa, voices.value.get(l.who)))
  return i >= 0 ? i : current.value
})
/** Whose bust is on stage: the speaker of the playing line, else the last line tapped, else the first speaker. */
const lastTapped = ref(-1)
const onStage = computed(() => {
  const i = playing.value >= 0 ? playing.value : lastTapped.value
  return props.lines[i]?.who ?? props.lines[0]?.who ?? ''
})
const stageTalking = computed(() => {
  const i = props.lines.findIndex((l) => isSpeaking(l.fa, voices.value.get(l.who)))
  return i >= 0 && props.lines[i].who === onStage.value
})

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      const p = (Date.now() - start) / ms
      if (stop || p >= 1) { pause.value = -1; resolve(); return }
      pause.value = p
      requestAnimationFrame(tick)
    }
    tick()
  })
}

/** Time to say a line yourself: as long as the recording took, plus a little, or an estimate from its length. */
const sayTime = (l: DialogueLine, heard: number) => Math.max(1800, heard ? heard * 1.3 + 600 : l.tr.length * 95 + 1200)

async function run(m: Mode) {
  if (mode.value) { halt(); return }
  if (m === 'role' && !me.value) me.value = speakers.value[speakers.value.length - 1]
  mode.value = m
  stop = false
  for (let i = 0; i < props.lines.length && !stop; i++) {
    const l = props.lines[i]
    current.value = i
    if (m === 'role' && l.who === me.value) {
      await wait(sayTime(l, 0))
      if (!stop) await speak(l.fa, false, voices.value.get(l.who))
      continue
    }
    const start = Date.now()
    await speak(l.fa, false, voices.value.get(l.who))
    if (m === 'repeat' && !stop) await wait(sayTime(l, Date.now() - start))
  }
  mode.value = null
  current.value = -1
}

function halt() {
  stop = true
  stopSpeech()
  mode.value = null
  current.value = -1
  pause.value = -1
}
onBeforeUnmount(halt)

const yourLine = (i: number) => mode.value === 'role' && props.lines[i].who === me.value
</script>

<template>
  <div class="dlg">
    <div class="tools">
      <template v-if="hasVoice()">
        <button type="button" class="btn sm" :class="mode === 'listen' ? 'primary' : 'ghost'" :disabled="!!mode && mode !== 'listen'" @click="run('listen')">
          {{ mode === 'listen' ? t('Stop') : t('Play the whole conversation') }}
        </button>
        <button type="button" class="btn sm" :class="mode === 'repeat' ? 'primary' : 'ghost'" :disabled="!!mode && mode !== 'repeat'" @click="run('repeat')">
          {{ mode === 'repeat' ? t('Stop') : t('Repeat after me') }}
        </button>
        <span class="role">
          <button type="button" class="btn sm" :class="mode === 'role' ? 'primary' : 'ghost'" :disabled="!!mode && mode !== 'role'" @click="run('role')">
            {{ mode === 'role' ? t('Stop') : t('Your turn: play a part') }}
          </button>
          <label v-if="speakers.length > 1" class="sel">
            <select v-model="me" :disabled="!!mode" :aria-label="t('Your part')">
              <option value="">{{ t('Your part') }}…</option>
              <option v-for="s in speakers" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
        </span>
      </template>
    </div>
    <div class="toggles" role="group" :aria-label="t('Show')">
      <label class="check"><input v-model="showTr" type="checkbox" /> {{ trLabel }}</label>
      <label class="check"><input v-model="showFa" type="checkbox" /> {{ faLabel }}</label>
      <label class="check"><input v-model="showEn" type="checkbox" /> {{ t('Show English') }}</label>
    </div>
    <div v-if="inCast(onStage)" class="stage" :aria-label="t('Now speaking')" role="group">
      <div v-for="s in speakers.filter(inCast)" :key="s" class="actor" :class="{ on: s === onStage }">
        <CastFace :name="s" :talking="s === onStage && stageTalking" />
        <span class="actor-name">{{ s }}</span>
      </div>
    </div>
    <ol class="lines">
      <li
        v-for="(l, i) in lines" :key="i"
        :class="[speakers.indexOf(l.who) % 2 ? 'b' : 'a', { now: current === i || playing === i, mine: yourLine(i) }]"
        :aria-current="current === i ? 'step' : undefined"
      >
        <span class="who">
          <CastFace v-if="inCast(l.who)" :name="l.who" kind="avatar" :talking="playing === i" />
          <span v-else class="avatar" :class="'g-' + gender(l.who)" aria-hidden="true">{{ initial(l.who) }}</span>
          {{ l.who }}<span v-if="yourLine(i)" class="you"> · {{ t('you') }}</span>
        </span>
        <div class="bubble" @click.capture="lastTapped = i">
          <SpeakButton :text="l.fa" :voice="voices.get(l.who)" />
          <div class="t">
            <FaText v-if="showFa" :fa="l.fa" :tr="l.tr" size="sm" :hide-tr="!showTr" keep-fa />
            <span v-else-if="showTr" class="tr-only">{{ l.tr }}</span>
            <span v-if="showEn || (!showFa && !showTr)" class="en">{{ l.en }}</span>
          </div>
        </div>
        <div v-if="current === i && pause >= 0" class="turn" role="status">
          <b>{{ yourLine(i) ? t('Your line: say it now!') : t('Now you: repeat it.') }}</b>
          <span class="bar"><i :style="{ width: pause * 100 + '%' }"></i></span>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.dlg { display: flex; flex-direction: column; gap: 12px }
.tools, .toggles { display: flex; gap: 10px; align-items: center; flex-wrap: wrap }
.role { display: inline-flex; gap: 6px; align-items: center }
.sel select { font: inherit; font-size: 0.88rem; border: 1.5px solid var(--line); border-radius: 10px; padding: 5px 8px; background: var(--surface); color: var(--ink) }
.check { display: inline-flex; gap: 8px; align-items: center; font-size: 0.92rem; cursor: pointer }
.check input { accent-color: var(--accent); width: 17px; height: 17px }
/* The stage: everyone in the conversation; whoever is speaking steps forward and talks. */
.stage { display: flex; justify-content: center; align-items: flex-end; gap: 4px; padding: 10px 8px 0; background: var(--sunk); border-radius: 18px; overflow: hidden }
.actor { display: flex; flex-direction: column; align-items: center; width: 64px; opacity: 0.6; transform: scale(0.86); transform-origin: bottom center; transition: transform 0.2s, opacity 0.2s }
.actor.on { width: 112px; opacity: 1; transform: none }
.actor-name { font-size: 0.72rem; font-weight: 700; color: var(--muted); padding: 2px 0 6px }
.actor.on .actor-name { color: var(--ink) }
@media (min-width: 640px) {
  .actor { width: 92px }
  .actor.on { width: 150px }
}
.lines { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px }
.lines li { display: flex; flex-direction: column; gap: 4px; max-width: 88% }
.lines li.b { align-self: flex-end; align-items: flex-end }
.who { display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 600; color: var(--muted); letter-spacing: 0.04em }
.you { color: var(--accent) }
.avatar { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 0.72rem; font-weight: 800; color: #fff; background: var(--muted) }
.avatar.g-f { background: #c2477a }
.avatar.g-m { background: #2f6fb3 }
.bubble { display: flex; gap: 10px; align-items: center; background: var(--sunk); border-radius: 16px; padding: 8px 12px; border: 2px solid transparent; transition: border-color 0.15s, transform 0.15s }
.b .bubble { background: var(--accent-soft) }
.now .bubble { border-color: var(--saffron-bright); transform: scale(1.02) }
.now .avatar { box-shadow: 0 0 0 3px var(--saffron-bright); animation: talk 0.5s ease-in-out infinite alternate }
.mine .bubble { border-style: dashed }
.bubble :deep(.spk) { width: 36px; height: 36px; border-radius: 10px }
.t { display: flex; flex-direction: column; align-items: flex-end; min-width: 0 }
.t :deep(.fw) { align-items: flex-end }
.tr-only { font-weight: 600 }
.en { font-size: 0.85rem; color: var(--muted) }
.turn { display: flex; flex-direction: column; gap: 4px; font-size: 0.88rem; min-width: 180px }
.turn .bar { height: 6px; border-radius: 3px; background: var(--sunk); overflow: hidden }
.turn .bar i { display: block; height: 100%; background: var(--saffron-bright) }
@keyframes talk { from { transform: scale(1) } to { transform: scale(1.12) } }
@media (prefers-reduced-motion: reduce) {
  .bubble { transition: none }
  .now .bubble { transform: none }
  .now .avatar { animation: none }
  .actor { transition: none }
}
</style>
