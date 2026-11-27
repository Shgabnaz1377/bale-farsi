<script setup lang="ts">
import type { VoiceId } from '@/content/speakers.ts'
import CastFace from './CastFace.vue'

/**
 * A cast member saying something, Duolingo-style: their bust (mouth moving while `text` plays) next to a
 * speech bubble holding the line. Used by lesson sentences, grammar examples and listening prompts.
 */
withDefaults(defineProps<{ name: string; text?: string; voice?: VoiceId; size?: 'md' | 'sm' }>(), { text: undefined, voice: undefined, size: 'md' })
</script>

<template>
  <div class="says" :class="size">
    <div class="face">
      <CastFace :name="name" :text="text" :voice="voice" />
      <span class="name">{{ name }}</span>
    </div>
    <div class="bubble"><slot /></div>
  </div>
</template>

<style scoped>
.says { display: flex; align-items: flex-end; gap: 10px; width: 100%; min-width: 0 }
.face { width: 92px; flex: none; display: flex; flex-direction: column; align-items: center; gap: 2px }
.sm .face { width: 52px }
.name { font-size: 0.72rem; font-weight: 700; color: var(--muted); letter-spacing: 0.03em }
.bubble {
  position: relative; flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;
  background: var(--surface); border: 2px solid var(--line); border-radius: 18px; padding: 14px 14px; margin-bottom: 26px;
}
.sm .bubble { padding: 8px 12px; border-radius: 14px; margin-bottom: 16px; justify-content: flex-start }
/* The tail, pointing at the speaker. */
.bubble::before { content: ''; position: absolute; bottom: 18px; left: -9px; width: 14px; height: 14px; background: var(--surface); border-left: 2px solid var(--line); border-bottom: 2px solid var(--line); transform: rotate(45deg) }
.sm .bubble::before { bottom: 12px }
@media (min-width: 640px) {
  .face { width: 120px }
  .sm .face { width: 60px }
}
</style>
