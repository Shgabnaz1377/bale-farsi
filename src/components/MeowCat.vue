<script setup lang="ts">
import { computed } from 'vue'
import { catSvg, type Mood } from '@/lib/cat.ts'

/** Pishi, the MeowFarsi cat. Decorative unless a label is given. */
const props = withDefaults(defineProps<{ mood?: Mood; size?: number | string; face?: boolean; label?: string; bubble?: string; bubbleFa?: string }>(), {
  mood: 'idle', size: 96, face: false, label: '', bubble: '', bubbleFa: '',
})
const svg = computed(() => catSvg(props.mood, { face: props.face, title: props.label || undefined }))
const px = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<template>
  <span class="meow" :class="[`m-${mood}`, { 'has-bubble': bubble }]">
    <!-- eslint-disable-next-line vue/no-v-html -- our own generated SVG, no user content -->
    <span class="art" :style="{ width: px, height: px }" v-html="svg"></span>
    <span v-if="bubble" class="bubble">
      <span v-if="bubbleFa" class="fa keep b-fa" lang="fa" dir="rtl">{{ bubbleFa }}</span>
      <span class="b-tr">{{ bubble }}</span>
    </span>
  </span>
</template>

<style scoped>
.meow { display: inline-flex; align-items: center; gap: 10px; flex: none }
.art { display: inline-block; flex: none }
.art :deep(svg) { width: 100%; height: 100%; overflow: visible }
.bubble { position: relative; background: var(--surface); border: 2px solid var(--line); border-radius: 16px; padding: 8px 12px; display: flex; flex-direction: column; line-height: 1.3; box-shadow: var(--shadow) }
.bubble::before { content: ''; position: absolute; left: -9px; top: 50%; width: 14px; height: 14px; background: var(--surface); border-left: 2px solid var(--line); border-bottom: 2px solid var(--line); transform: translateY(-50%) rotate(45deg) }
.b-fa { font-size: 1.15rem; font-weight: 700 }
.b-tr { font-weight: 600; font-size: 0.95rem }

/* Life: blink, sway the tail, bounce when cheering, wave the paw, breathe while asleep. */
.art :deep(.eye) { transform-box: fill-box; transform-origin: center; animation: blink 5s infinite }
.art :deep(.tail) { transform-box: fill-box; transform-origin: 0% 90%; animation: sway 3.2s ease-in-out infinite }
.m-cheer .art { animation: bounce 0.9s ease-in-out infinite }
.m-cheer .art :deep(.sparkles) { animation: twinkle 1.2s ease-in-out infinite }
.m-wave .art :deep(.wave-paw) { transform-box: fill-box; transform-origin: 30% 100%; animation: wave 1.1s ease-in-out infinite }
.m-sleep .art { animation: breathe 3.6s ease-in-out infinite }
.m-sad .art :deep(.tear) { animation: drip 2.4s ease-in infinite }
.m-happy .art { animation: hop 0.6s ease-out 1 }
@keyframes blink { 0%, 94%, 100% { transform: scaleY(1) } 97% { transform: scaleY(0.1) } }
@keyframes sway { 0%, 100% { transform: rotate(0) } 50% { transform: rotate(-7deg) } }
@keyframes bounce { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-8%) } }
@keyframes twinkle { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
@keyframes wave { 0%, 100% { transform: rotate(0) } 50% { transform: rotate(-22deg) } }
@keyframes breathe { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.03) } }
@keyframes drip { 0% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(12px); opacity: 0 } }
@keyframes hop { 0% { transform: translateY(0) } 40% { transform: translateY(-10%) } 100% { transform: translateY(0) } }
@media (prefers-reduced-motion: reduce) { .art, .art :deep(*) { animation: none !important } }
</style>
