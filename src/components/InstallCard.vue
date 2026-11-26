<script setup lang="ts">
import { ref } from 'vue'
import { canPrompt, installed, isIOS, promptInstall } from '@/lib/install.ts'
import AppIcon from './AppIcon.vue'
import { t } from '@/i18n/index.ts'

const props = withDefaults(defineProps<{ dismissible?: boolean }>(), { dismissible: false })
const KEY = 'bale-farsi:install-dismissed'
const iconUrl = import.meta.env.BASE_URL + 'icon-192.png'
function wasDismissed() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
const hidden = ref(props.dismissible && wasDismissed())
function dismiss() {
  hidden.value = true
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* storage blocked */
  }
}
</script>

<template>
  <section v-if="!installed && !hidden && (canPrompt || isIOS || !dismissible)" class="card install" :aria-label="t('Install the app')">
    <img :src="iconUrl" alt="" width="52" height="52" class="app-icon" />
    <div class="body">
      <b>{{ t('Install PersianMeow on your phone') }}</b>
      <p v-if="canPrompt" class="muted small">{{ t('It gets its own icon, and every lesson works offline.') }}</p>
      <p v-else-if="isIOS" class="muted small">{{ t('In Safari, tap Share, then Add to Home Screen. Every lesson then works offline.') }}</p>
      <p v-else class="muted small">{{ t('In your browser menu, choose Install app or Add to Home screen. Every lesson then works offline.') }}</p>
    </div>
    <div class="acts">
      <button v-if="canPrompt" type="button" class="btn primary sm" @click="promptInstall">{{ t('Install') }}</button>
      <button v-if="dismissible" type="button" class="icon-btn" :aria-label="t('Hide this')" @click="dismiss"><AppIcon name="x" /></button>
    </div>
  </section>
</template>

<style scoped>
.install { display: flex; align-items: center; gap: 14px }
.app-icon { border-radius: 14px; flex: none }
.body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px }
.acts { display: flex; align-items: center; gap: 4px }
</style>
