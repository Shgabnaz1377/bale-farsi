<script setup lang="ts">
import { canSpeak, speak } from '@/lib/speech.ts'
import AppIcon from './AppIcon.vue'
import type { VoiceId } from '@/content/speakers.ts'
import { t } from '@/i18n/index.ts'

withDefaults(defineProps<{ text: string; big?: boolean; slow?: boolean; voice?: VoiceId }>(), { big: false, slow: false, voice: undefined })
</script>

<template>
  <button
    v-if="canSpeak(text, voice)"
    type="button"
    class="spk"
    :class="{ big }"
    :aria-label="slow ? t('Play slowly') : t('Play audio')"
    @click.stop="speak(text, slow, voice)"
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
