<script setup lang="ts">
import MeowCat from '@/components/MeowCat.vue'
import { APP } from '@/app.ts'
import { t } from '@/i18n/index.ts'
</script>

<template>
  <main class="wrap page nf">
    <MeowCat mood="think" :size="140" />
    <p class="fa keep big" :lang="APP.target" :dir="APP.targetDir">{{ APP.pishi.notFound.fa }}</p>
    <p class="muted">{{ APP.pishi.notFound.tr }} {{ t('(not found)') }}</p>
    <h1>{{ t('This page does not exist') }}</h1>
    <RouterLink class="btn primary" to="/">{{ t('Back to the course') }}</RouterLink>
  </main>
</template>

<style scoped>
.nf { align-items: center; text-align: center; padding-top: 64px }
.big { font-size: 3rem; font-weight: 700; color: var(--accent) }
h1 { font-size: 1.6rem; font-weight: 800 }
</style>
