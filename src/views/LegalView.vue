<script setup lang="ts">
import { computed } from 'vue'
import { legalText, CONTACT_EMAIL, type LegalDoc } from '@/content/legal.ts'
import { APP } from '@/app.ts'
import { lang, t } from '@/i18n/index.ts'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps<{ doc: LegalDoc }>()
const text = computed(() => legalText(props.doc, lang(), APP.fullName))
</script>

<template>
  <main class="wrap page legal">
    <RouterLink to="/settings" class="back"><AppIcon name="arrow" /> {{ t('Settings') }}</RouterLink>
    <article class="card" :lang="lang() === 'it' ? 'it' : 'en'" dir="ltr">
      <h1>{{ text.title }}</h1>
      <p class="muted small">{{ text.updated }}</p>
      <p>{{ text.intro }}</p>
      <section v-for="s in text.sections" :key="s.h">
        <h2>{{ s.h }}</h2>
        <p v-for="(p, i) in s.p" :key="i">{{ p }}</p>
      </section>
      <p class="muted small"><a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a></p>
    </article>
    <nav class="other small">
      <RouterLink v-if="doc === 'terms'" to="/privacy">{{ t('Privacy policy') }}</RouterLink>
      <RouterLink v-else to="/terms">{{ t('Terms of use') }}</RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.legal article { display: flex; flex-direction: column; gap: 10px; line-height: 1.55 }
h1 { font-size: 1.6rem; font-weight: 800 }
h2 { font-size: 1.05rem; font-weight: 800; margin-top: 8px }
section { display: flex; flex-direction: column; gap: 6px }
.other { text-align: center; margin-top: 12px }
</style>
