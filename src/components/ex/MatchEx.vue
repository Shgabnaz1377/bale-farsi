<script setup lang="ts">
import { ref } from 'vue'
import type { MatchEx } from '@/lib/exercises.ts'
import { shuffle } from '@/lib/random.ts'
import { speak } from '@/lib/speech.ts'
import { meow } from '@/lib/sfx.ts'
import FaText from '../FaText.vue'
import { t } from '@/i18n/index.ts'

const props = defineProps<{ ex: MatchEx; locked: boolean }>()
const emit = defineEmits<{ complete: [misses: number] }>()

const left = shuffle(props.ex.pairs.map((_, i) => i))
const right = shuffle(props.ex.pairs.map((_, i) => i))
const sel = ref<{ side: 'L' | 'R'; i: number } | null>(null)
const matched = ref(new Set<number>())
const wrong = ref<{ L: number; R: number } | null>(null)
let misses = 0
/** Read out by screen readers: what was picked and whether it matched. */
const said = ref('')
// With Finglish hidden (reading practice) the Persian is what the learner sees, so that is what is read out.
const label = (i: number) => (props.ex.hideTr ? props.ex.pairs[i].fa : props.ex.pairs[i].tr || props.ex.pairs[i].fa)

function tap(side: 'L' | 'R', i: number) {
  if (props.locked || matched.value.has(i)) return
  if (side === 'L' && !props.ex.hideTr) speak(props.ex.pairs[i].fa)
  if (!sel.value || sel.value.side === side) {
    sel.value = { side, i }
    said.value = t('Selected: {x}', { x: side === 'L' ? label(i) : props.ex.pairs[i].en })
    return
  }
  const other = sel.value
  sel.value = null
  if (other.i === i) {
    matched.value = new Set([...matched.value, i])
    said.value = t('Match: {a} = {b}', { a: label(i), b: props.ex.pairs[i].en })
    if (matched.value.size === props.ex.pairs.length) emit('complete', misses)
    else meow('mew')
  } else {
    misses++
    said.value = t('Not a pair. Try again.')
    meow('sad')
    wrong.value = side === 'L' ? { L: i, R: other.i } : { L: other.i, R: i }
    setTimeout(() => (wrong.value = null), 450)
  }
}
const cls = (side: 'L' | 'R', i: number) => ({
  sel: sel.value?.side === side && sel.value.i === i,
  ok: matched.value.has(i),
  no: wrong.value?.[side] === i,
})
</script>

<template>
  <div class="match">
    <p class="sr-only" role="status" aria-live="polite">{{ said }}</p>
    <div class="col">
      <button v-for="i in left" :key="'l' + i" type="button" class="mt" :class="cls('L', i)" :aria-pressed="sel?.side === 'L' && sel.i === i" :disabled="matched.has(i) || locked" @click="tap('L', i)">
        <FaText :fa="ex.pairs[i].fa" :tr="ex.pairs[i].tr" size="sm" :hide-tr="ex.hideTr" :keep-fa="ex.hideTr" />
      </button>
    </div>
    <div class="col">
      <button v-for="i in right" :key="'r' + i" type="button" class="mt" :class="cls('R', i)" :aria-pressed="sel?.side === 'R' && sel.i === i" :disabled="matched.has(i) || locked" @click="tap('R', i)">
        <span class="en">{{ ex.pairs[i].en }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.match { display: grid; grid-template-columns: 1fr 1fr; gap: 10px }
.col { display: flex; flex-direction: column; gap: 10px; min-width: 0 }
.mt { min-height: 64px; border: 2px solid var(--line); background: var(--surface); border-radius: 14px; cursor: pointer; padding: 6px 10px; display: grid; place-items: center; min-width: 0 }
.mt:hover:not(:disabled) { border-color: var(--muted) }
.en { font-weight: 500; overflow-wrap: anywhere }
.mt.sel { border-color: var(--lapis); background: var(--lapis-soft) }
.mt.ok { border-color: var(--good); background: var(--good-bg); opacity: 0.55; cursor: default }
.mt.no { border-color: var(--bad); background: var(--bad-bg); animation: shake 0.4s }
@keyframes shake { 25% { transform: translateX(-4px) } 75% { transform: translateX(4px) } }
</style>
