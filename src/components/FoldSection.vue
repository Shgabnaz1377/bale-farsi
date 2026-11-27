<script setup lang="ts">
import { ref, useId } from 'vue'
import AppIcon from './AppIcon.vue'

/** A card that opens and closes: the heading is a button (aria-expanded), the body slides open. */
const props = withDefaults(defineProps<{ title?: string; open?: boolean; badge?: string | number }>(), { title: '', open: false, badge: '' })
const isOpen = ref(props.open)
const id = useId()
</script>

<template>
  <section class="card fold" :class="{ open: isOpen }">
    <h2 class="fold-h">
      <button :id="id + '-b'" type="button" class="fold-btn" :aria-expanded="isOpen" :aria-controls="id + '-p'" @click="isOpen = !isOpen">
        <span class="fold-title"><slot name="title">{{ title }}</slot></span>
        <span v-if="badge !== ''" class="chip">{{ badge }}</span>
        <AppIcon name="chev" class="fold-chev" />
      </button>
    </h2>
    <div :id="id + '-p'" class="fold-body" role="region" :aria-labelledby="id + '-b'">
      <div class="fold-clip">
        <div class="fold-in"><slot /></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fold { padding: 0 }
.fold-h { font-size: 1.08rem; font-weight: 800 }
.fold-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 14px 18px; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; text-align: start; border-radius: var(--radius) }
.fold-btn:hover .fold-chev { color: var(--ink) }
.fold-title { flex: 1; min-width: 0; font-family: var(--f-display) }
.fold-chev { color: var(--muted); width: 22px; height: 22px; transition: transform 0.25s ease }
.open .fold-chev { transform: rotate(180deg) }
/* Animate the height with grid rows; hidden content leaves the tab order and the accessibility tree. */
.fold-body { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows 0.28s ease, visibility 0s linear 0.28s }
.open .fold-body { grid-template-rows: 1fr; visibility: visible; transition: grid-template-rows 0.28s ease, visibility 0s }
.fold-clip { overflow: hidden; min-height: 0 }
.fold-in { padding: 0 18px 18px; display: flex; flex-direction: column; gap: 12px }
</style>
