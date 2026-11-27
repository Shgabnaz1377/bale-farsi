<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { t } from '@/i18n/index.ts'

/**
 * A sheet that slides up from the bottom of the screen (a centred card on wide screens).
 * A modal <dialog>: the page behind is inert, so focus stays inside; Esc or a tap outside closes it,
 * and focus goes back to whatever opened it.
 */
const props = defineProps<{ open: boolean; labelledby: string }>()
const emit = defineEmits<{ close: [] }>()
const dlg = ref<HTMLDialogElement>()
let opener: HTMLElement | null = null

watch(() => props.open, async (open) => {
  await nextTick()
  const d = dlg.value
  if (!d) return
  if (open && !d.open) {
    opener = document.activeElement as HTMLElement | null
    d.showModal()
  } else if (!open && d.open) d.close()
}, { immediate: true })

function onClose() {
  emit('close')
  opener?.focus?.()
  opener = null
}
function onClick(e: MouseEvent) {
  // The dialog box itself is only reachable outside the content: that is the backdrop.
  if (e.target === dlg.value) dlg.value?.close()
}
onBeforeUnmount(() => { if (dlg.value?.open) dlg.value.close() })
</script>

<template>
  <dialog ref="dlg" class="sheet" :aria-labelledby="labelledby" @close="onClose" @click="onClick">
    <div class="sheet-in">
      <span class="grip" aria-hidden="true"></span>
      <slot />
      <button type="button" class="icon-btn sheet-x" :aria-label="t('Close')" @click="dlg?.close()"><AppIcon name="x" /></button>
    </div>
  </dialog>
</template>

<style scoped>
.sheet { margin: auto auto 0; width: 100%; max-width: 560px; max-height: 88dvh; border: 0; padding: 0; border-radius: 26px 26px 0 0; background: var(--surface); color: var(--ink); box-shadow: 0 -12px 40px -20px rgba(0, 0, 0, 0.5); overflow: auto }
.sheet[open] { animation: up 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) }
.sheet::backdrop { background: rgba(12, 21, 36, 0.5) }
.sheet-in { position: relative; display: flex; flex-direction: column; gap: 14px; padding: 12px 20px calc(20px + env(safe-area-inset-bottom, 0px)) }
.grip { width: 44px; height: 5px; border-radius: 9px; background: var(--line); align-self: center }
.sheet-x { position: absolute; top: 10px; inset-inline-end: 10px }
@keyframes up { from { transform: translateY(40%); opacity: 0 } to { transform: none; opacity: 1 } }
@media (min-width: 721px) {
  .sheet { margin: auto; border-radius: 26px }
  .grip { display: none }
  .sheet-in { padding-top: 22px }
}
</style>
