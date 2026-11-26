<script setup lang="ts">
import { faVoice, speak } from '@/lib/speech.ts'
import AppIcon from './AppIcon.vue'

withDefaults(defineProps<{ text: string; big?: boolean; slow?: boolean }>(), { big: false, slow: false })
</script>

<template>
  <button
    v-if="faVoice"
    type="button"
    class="spk"
    :class="{ big }"
    :aria-label="slow ? 'Play slowly' : 'Play audio'"
    @click.stop="speak(text, slow)"
  >
    <AppIcon :name="slow ? 'slow' : 'speaker'" />
  </button>
</template>

<style scoped>
.spk { width: 46px; height: 46px; border-radius: 14px; border: 0; background: var(--lapis-soft); color: var(--lapis); display: grid; place-items: center; cursor: pointer; flex: none }
.spk:hover { filter: brightness(0.96) }
.spk .ico { width: 24px; height: 24px }
.spk.big { width: 96px; height: 96px; border-radius: 26px; background: var(--lapis); color: var(--lapis-ink) }
.spk.big .ico { width: 44px; height: 44px }
</style>
