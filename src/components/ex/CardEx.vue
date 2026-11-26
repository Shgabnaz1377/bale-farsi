<script setup lang="ts">
import type { CardEx } from '@/lib/exercises.ts'
import FaText from '../FaText.vue'
import SpeakButton from '../SpeakButton.vue'
import PassageText from '../PassageText.vue'
import DialogueList from '../DialogueList.vue'
import RichText from '../RichText.vue'

defineProps<{ ex: CardEx }>()
</script>

<template>
  <div class="card body">
    <RichText v-if="ex.html" :html="ex.html" class="lead" />
    <ul v-if="ex.examples?.length" class="examples">
      <li v-for="(e, i) in ex.examples" :key="i">
        <SpeakButton v-if="e.fa.includes('·')" :text="e.fa.split('·')[0].trim()" />
        <SpeakButton :text="e.fa.split('·').pop()!.trim()" />
        <div class="ex-text">
          <FaText :fa="e.fa" :tr="e.tr" inline keep-tr />
          <span class="muted">{{ e.en }}</span>
        </div>
      </li>
    </ul>
    <PassageText v-if="ex.passage" :paragraphs="ex.passage" />
    <DialogueList v-if="ex.dialogue" :lines="ex.dialogue" />
  </div>
</template>

<style scoped>
.body { display: flex; flex-direction: column; gap: 16px }
.lead { font-size: 1.02rem }
.examples { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px }
.examples li { display: flex; gap: 12px; align-items: center }
.ex-text { display: flex; flex-direction: column; min-width: 0 }
</style>
