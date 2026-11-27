<script setup lang="ts">
import { onMounted } from 'vue'
import type { ChoiceEx } from '@/lib/exercises.ts'
import { speak } from '@/lib/speech.ts'
import { P } from '@/lib/store.ts'
import FaText from '../FaText.vue'
import PromptBox from './PromptBox.vue'
import { t } from '@/i18n/index.ts'

const props = defineProps<{ ex: ChoiceEx; locked: boolean }>()
const answer = defineModel<number | null>({ default: null })

onMounted(() => {
  const a = props.ex.prompt.audio
  if (a && (props.ex.prompt.listen || P.settings.autoplay)) speak(a, false, props.ex.prompt.voice)
})

function choose(i: number) {
  if (props.locked) return
  answer.value = i
  const o = props.ex.options[i]
  if (props.ex.faOptions && o.fa && !o.hideTr && P.settings.autoplay) speak(o.fa, false, o.voice)
}
defineExpose({ choose })
</script>

<template>
  <PromptBox :prompt="ex.prompt" />
  <div class="choices" :class="{ 'fa-opts': ex.faOptions }" role="group" :aria-label="t('Answers')">
    <button
      v-for="(o, i) in ex.options"
      :key="i"
      type="button"
      class="choice"
      :class="{ sel: answer === i, right: locked && i === ex.answer, wrong: locked && answer === i && i !== ex.answer }"
      :disabled="locked"
      :aria-pressed="answer === i"
      @click="choose(i)"
    >
      <span class="kbd" aria-hidden="true">{{ i + 1 }}</span>
      <FaText v-if="o.fa" :fa="o.fa" :tr="o.tr" :hide-tr="o.hideTr" :keep-fa="o.hideTr" :size="o.fa.length > 14 ? 'sm' : 'md'" />
      <span v-else class="en">{{ o.en }}</span>
    </button>
  </div>
</template>

<style scoped>
.choices { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px }
.choices.fa-opts { grid-template-columns: repeat(2, minmax(0, 1fr)) }
.choice { display: flex; align-items: center; gap: 12px; text-align: start; background: var(--surface); border: 2px solid var(--line); border-radius: 16px; padding: 12px 14px; cursor: pointer; min-height: 60px; min-width: 0 }
.fa-opts .choice { justify-content: center; position: relative; min-height: 84px; padding: 14px 10px }
.fa-opts .choice .kbd { position: absolute; top: 8px; inset-inline-start: 8px }
.choice:hover:not(:disabled) { border-color: var(--muted) }
.kbd { flex: none; width: 24px; height: 24px; border-radius: 7px; border: 1.5px solid var(--line); display: grid; place-items: center; font-size: 0.75rem; color: var(--muted); font-weight: 600 }
.en { font-weight: 500; min-width: 0; overflow-wrap: anywhere }
.choice.sel { border-color: var(--lapis); background: var(--lapis-soft) }
.choice.right { border-color: var(--good); background: var(--good-bg) }
.choice.wrong { border-color: var(--bad); background: var(--bad-bg) }
.choice:disabled { cursor: default }
@media (max-width: 520px) { .choices { grid-template-columns: 1fr } .choices.fa-opts { grid-template-columns: repeat(2, minmax(0, 1fr)) } }
</style>
