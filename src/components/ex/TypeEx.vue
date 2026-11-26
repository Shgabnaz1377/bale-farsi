<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { TypeEx } from '@/lib/exercises.ts'
import { speak } from '@/lib/speech.ts'
import { P } from '@/lib/store.ts'
import PromptBox from './PromptBox.vue'

const props = defineProps<{ ex: TypeEx; locked: boolean }>()
const answer = defineModel<string | null>({ default: null })
const input = ref<HTMLTextAreaElement | null>(null)

onMounted(() => {
  input.value?.focus()
  if (props.ex.prompt.audio && P.settings.autoplay) speak(props.ex.prompt.audio)
})
</script>

<template>
  <PromptBox :prompt="ex.prompt" />
  <label class="sr-only" for="type-answer">Your answer in English</label>
  <textarea
    id="type-answer"
    ref="input"
    class="type-in"
    rows="2"
    placeholder="Type in English"
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    :readonly="locked"
    :value="answer ?? ''"
    @input="answer = ($event.target as HTMLTextAreaElement).value || null"
  ></textarea>
</template>

<style scoped>
.type-in { width: 100%; font-size: 1.15rem; padding: 16px; border-radius: 16px; border: 2px solid var(--line); background: var(--surface); color: var(--ink); min-height: 110px; resize: vertical }
.type-in:focus { border-color: var(--lapis); outline: none }
</style>
