<script setup lang="ts">
import MeowCat from '@/components/MeowCat.vue'
</script>

<template>
  <main class="wrap page nf">
    <MeowCat mood="think" :size="140" />
    <p class="fa keep big" lang="fa" dir="rtl">پیدا نشد</p>
    <p class="muted">peydâ nashod, “not found”</p>
    <h1>This page does not exist</h1>
    <RouterLink class="btn primary" to="/">Back to the course</RouterLink>
  </main>
</template>

<style scoped>
.nf { align-items: center; text-align: center; padding-top: 64px }
.big { font-size: 3rem; font-weight: 700; color: var(--accent) }
h1 { font-size: 1.6rem; font-weight: 800 }
</style>
