<script setup lang="ts">
import AppIcon from './AppIcon.vue'

/** A lesson as an eight-point star tile (the khatam motif of Persian tilework). */
defineProps<{ state: 'done' | 'current' | 'open' | 'locked'; label: string; number: string }>()
defineEmits<{ go: [] }>()
</script>

<template>
  <li class="item">
    <button type="button" class="node" :class="state" :aria-label="label" :aria-disabled="state === 'locked' ? 'true' : undefined" @click="state !== 'locked' && $emit('go')">
      <AppIcon v-if="state === 'done'" name="check" />
      <AppIcon v-else-if="state === 'locked'" name="lock" />
      <span v-else class="num fa keep" lang="fa">{{ number }}</span>
    </button>
    <span class="label"><slot /></span>
  </li>
</template>

<style scoped>
.item { display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; min-width: 0; flex: 1 1 0 }
.node { position: relative; width: 68px; height: 68px; border: 0; background: none; padding: 0; display: grid; place-items: center; border-radius: 50%; cursor: pointer; color: var(--muted) }
.node::before { content: ''; position: absolute; inset: 0; background: var(--sunk); transition: transform 0.25s ease;
  clip-path: polygon(50% 0%,65.31% 13.04%,85.36% 14.64%,86.96% 34.69%,100% 50%,86.96% 65.31%,85.36% 85.36%,65.31% 86.96%,50% 100%,34.69% 86.96%,14.64% 85.36%,13.04% 65.31%,0% 50%,13.04% 34.69%,14.64% 14.64%,34.69% 13.04%) }
.node > * { position: relative }
.node .ico { width: 28px; height: 28px }
.node.locked .ico { width: 22px; height: 22px }
.num { font-size: 1.45rem; font-weight: 700 }
.node.open { color: var(--ink) }
.node.done { color: var(--accent-ink) }
.node.done::before { background: var(--accent) }
.node.current { color: var(--lapis-ink) }
.node.current::before { background: var(--lapis) }
.node.current::after { content: ''; position: absolute; inset: -7px; border: 2px dashed var(--lapis); border-radius: 50%; animation: spin 14s linear infinite }
.node:not(.locked):hover::before { transform: rotate(22.5deg) scale(1.04) }
.node.locked { cursor: not-allowed }
.label { font-size: 0.78rem; color: var(--muted); font-weight: 500; text-align: center; line-height: 1.25 }
.node.current + .label { color: var(--ink); font-weight: 600 }
@keyframes spin { to { transform: rotate(360deg) } }
@media (max-width: 520px) { .node { width: 56px; height: 56px } .num { font-size: 1.2rem } .label { font-size: 0.7rem } }
</style>
