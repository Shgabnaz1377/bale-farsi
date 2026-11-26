<script setup lang="ts">
import type { Prompt } from '@/lib/exercises.ts'
import FaText from '../FaText.vue'
import SpeakButton from '../SpeakButton.vue'
import PassageText from '../PassageText.vue'

defineProps<{ prompt: Prompt }>()
</script>

<template>
  <div v-if="prompt.passage" class="passage-wrap">
    <PassageText :paragraphs="prompt.passage" compact />
  </div>
  <div v-else-if="prompt.listen && prompt.audio" class="prompt">
    <div class="listen">
      <SpeakButton :text="prompt.audio" big />
      <SpeakButton :text="prompt.audio" slow />
    </div>
  </div>
  <div v-else-if="prompt.digit" class="prompt">
    <span class="digit fa keep" lang="fa">{{ prompt.digit }}</span>
  </div>
  <div v-else-if="prompt.fa || prompt.en" class="prompt" :class="{ long: (prompt.fa?.length ?? 0) > 18 }">
    <span v-if="prompt.who" class="who chip lapis">{{ prompt.who }}</span>
    <SpeakButton v-if="prompt.audio" :text="prompt.audio" />
    <div class="texts">
      <FaText v-if="prompt.fa" :fa="prompt.fa" :tr="prompt.tr" :size="(prompt.fa.length > 18 ? 'lg' : 'xl')" :hide-tr="prompt.hideTr" :keep-fa="prompt.hideTr" />
      <p v-if="prompt.en" class="en">{{ prompt.en }}</p>
    </div>
  </div>
</template>

<style scoped>
.prompt { position: relative; display: flex; align-items: center; justify-content: center; gap: 16px; padding: 26px 16px 22px; background: var(--surface); border: 1px solid var(--line); border-radius: 20px; min-height: 150px; flex-wrap: wrap; text-align: center }
.texts { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0 }
.en { color: var(--muted); font-size: 0.95rem }
.who { position: absolute; top: 10px; left: 12px }
.listen { display: flex; align-items: center; gap: 14px }
.digit { font-size: 4.5rem; font-weight: 700; line-height: 1.2 }
.passage-wrap { max-height: 38vh; overflow: auto; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); padding: 14px 16px }
</style>
