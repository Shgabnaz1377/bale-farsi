<script setup lang="ts">
import type { Prompt } from '@/lib/exercises.ts'
import FaText from '../FaText.vue'
import SpeakButton from '../SpeakButton.vue'
import PassageText from '../PassageText.vue'
import CastSays from '../CastSays.vue'

defineProps<{ prompt: Prompt }>()
</script>

<template>
  <div v-if="prompt.passage" class="passage-wrap">
    <PassageText :paragraphs="prompt.passage" compact />
  </div>
  <!-- A cast member says the sentence: their bust and a speech bubble. -->
  <div v-else-if="prompt.speaker && (prompt.audio || prompt.fa)" class="prompt cast">
    <CastSays :name="prompt.speaker" :text="prompt.audio" :voice="prompt.voice">
      <div v-if="prompt.listen && prompt.audio" class="listen">
        <SpeakButton :text="prompt.audio" :voice="prompt.voice" big />
        <SpeakButton :text="prompt.audio" :voice="prompt.voice" slow />
      </div>
      <template v-else>
        <span v-if="prompt.audio" class="btns"><SpeakButton :text="prompt.audio" :voice="prompt.voice" /><SpeakButton :text="prompt.audio" :voice="prompt.voice" slow /></span>
        <div class="texts">
          <FaText v-if="prompt.fa" :fa="prompt.fa" :tr="prompt.tr" :size="(prompt.fa.length > 18 ? 'lg' : 'xl')" :hide-tr="prompt.hideTr" :keep-fa="prompt.hideTr" />
          <p v-if="prompt.en" class="en">{{ prompt.en }}</p>
        </div>
      </template>
    </CastSays>
  </div>
  <div v-else-if="prompt.listen && prompt.audio" class="prompt">
    <div class="listen">
      <SpeakButton :text="prompt.audio" :voice="prompt.voice" big />
      <SpeakButton :text="prompt.audio" :voice="prompt.voice" slow />
    </div>
  </div>
  <div v-else-if="prompt.digit" class="prompt">
    <span class="digit fa keep" lang="fa">{{ prompt.digit }}</span>
  </div>
  <div v-else-if="prompt.fa || prompt.en" class="prompt" :class="{ long: (prompt.fa?.length ?? 0) > 18 }">
    <span v-if="prompt.who" class="who chip lapis">{{ prompt.who }}</span>
    <span v-if="prompt.audio" class="btns"><SpeakButton :text="prompt.audio" :voice="prompt.voice" /><SpeakButton :text="prompt.audio" :voice="prompt.voice" slow /></span>
    <div class="texts">
      <FaText v-if="prompt.fa" :fa="prompt.fa" :tr="prompt.tr" :size="(prompt.fa.length > 18 ? 'lg' : 'xl')" :hide-tr="prompt.hideTr" :keep-fa="prompt.hideTr" />
      <p v-if="prompt.en" class="en">{{ prompt.en }}</p>
    </div>
  </div>
</template>

<style scoped>
.prompt { position: relative; display: flex; align-items: center; justify-content: center; gap: 16px; padding: 26px 16px 22px; background: var(--surface); border: 1px solid var(--line); border-radius: 20px; min-height: 150px; flex-wrap: wrap; text-align: center }
.prompt.cast { padding: 14px 12px 0; align-items: flex-end }
.prompt.cast :deep(.bubble) { background: var(--sunk); border-color: var(--sunk) }
.prompt.cast :deep(.bubble)::before { background: var(--sunk); border-color: var(--sunk) }
.texts { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0 }
.en { color: var(--muted); font-size: 0.95rem }
.btns { display: flex; flex-direction: column; gap: 6px }
.btns :deep(.spk + .spk) { height: 32px }
.who { position: absolute; top: 10px; inset-inline-start: 12px }
.listen { display: flex; align-items: center; gap: 14px }
.digit { font-size: 4.5rem; font-weight: 700; line-height: 1.2 }
.passage-wrap { max-height: 38vh; overflow: auto; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); padding: 14px 16px }
</style>
