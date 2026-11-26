<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { BuildEx } from '@/lib/exercises.ts'
import { speak } from '@/lib/speech.ts'
import { P } from '@/lib/store.ts'
import FaText from '../FaText.vue'
import SpeakButton from '../SpeakButton.vue'

const props = defineProps<{ ex: BuildEx; locked: boolean }>()
const answer = defineModel<number[] | null>({ default: null })
const chosen = computed(() => answer.value ?? [])
const rtl = computed(() => props.ex.to === 'fa')

onMounted(() => {
  if (props.ex.to === 'en' && P.settings.autoplay) speak(props.ex.sentence.fa)
})

function add(i: number) {
  if (props.locked || chosen.value.includes(i)) return
  answer.value = [...chosen.value, i]
  const t = props.ex.tiles[i]
  if (t.fa && P.settings.autoplay) speak(t.fa)
}
function remove(pos: number) {
  if (props.locked) return
  const next = chosen.value.slice()
  next.splice(pos, 1)
  answer.value = next.length ? next : null
}
</script>

<template>
  <div class="prompt">
    <template v-if="ex.to === 'en'">
      <SpeakButton :text="ex.sentence.fa" />
      <FaText :fa="ex.sentence.fa" :tr="ex.sentence.tr" size="lg" />
    </template>
    <p v-else class="en-s">{{ ex.sentence.en }}</p>
  </div>
  <div class="answer" :dir="rtl ? 'rtl' : 'ltr'" aria-label="Your answer" aria-live="polite">
    <button v-for="(i, pos) in chosen" :key="'a' + i" type="button" class="tile" :disabled="locked" @click="remove(pos)">
      <FaText v-if="ex.tiles[i].fa" :fa="ex.tiles[i].fa!" :tr="ex.tiles[i].tr" size="sm" />
      <span v-else>{{ ex.tiles[i].en }}</span>
    </button>
  </div>
  <div class="bank" :dir="rtl ? 'rtl' : 'ltr'" role="group" aria-label="Word tiles">
    <button v-for="(t, i) in ex.tiles" :key="'b' + i" type="button" class="tile" :class="{ used: chosen.includes(i) }" :disabled="locked || chosen.includes(i)" @click="add(i)">
      <FaText v-if="t.fa" :fa="t.fa" :tr="t.tr" size="sm" />
      <span v-else>{{ t.en }}</span>
    </button>
  </div>
</template>

<style scoped>
.prompt { display: flex; align-items: center; gap: 14px; padding: 18px 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 20px; flex-wrap: wrap }
.en-s { font-size: 1.35rem; font-weight: 500 }
.answer { display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; min-height: 132px; padding: 8px 0;
  background-image: repeating-linear-gradient(to bottom, transparent 0 63px, var(--line) 63px 65px) }
.bank { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center }
.tile { display: inline-flex; align-items: center; justify-content: center; border: 2px solid var(--line); background: var(--surface); border-radius: 12px; padding: 6px 14px; min-height: 54px; cursor: pointer; font-size: 1.02rem; box-shadow: inset 0 -2px 0 var(--line) }
.tile:hover:not(:disabled) { border-color: var(--muted) }
.tile:disabled { cursor: default }
.tile.used { background: var(--sunk); border-color: var(--sunk); box-shadow: none }
.tile.used > * { visibility: hidden }
</style>
