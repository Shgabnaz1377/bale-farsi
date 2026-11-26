<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { P, rollDay, streakActiveToday } from '@/lib/store.ts'
import { account, initAccount } from '@/lib/account.ts'
import AppIcon from '@/components/AppIcon.vue'
import MeowCat from '@/components/MeowCat.vue'
import { setLang, t } from '@/i18n/index.ts'
import { applyCourseLang } from '@/content/localize.ts'
import { APP } from '@/app.ts'

const route = useRoute()
const inLesson = computed(() => route.name === 'lesson')

rollDay()
initAccount()

watchEffect(() => {
  setLang(P.settings.lang)
  applyCourseLang(P.settings.lang)
  document.documentElement.lang = P.settings.lang
  document.documentElement.dir = APP.uiDir
  document.documentElement.classList.add(`app-${APP.id}`)
})

watchEffect(() => {
  const root = document.documentElement
  root.classList.remove('mode-both', 'mode-script', 'mode-latin')
  root.classList.add(`mode-${P.settings.mode}`)
  if (P.settings.theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', P.settings.theme)
})

const nav = computed(() => [
  { to: '/', label: t('Learn'), icon: 'path' },
  ...(APP.alphabet ? [{ to: '/alphabet', label: t('Alphabet'), icon: 'letter' }] : []),
  { to: '/words', label: t('Words'), icon: 'book' },
  { to: '/progress', label: t('Progress'), icon: 'chart' },
  { to: '/settings', label: t('Settings'), icon: 'gear' },
])
</script>

<template>
  <header v-if="!inLesson" class="top">
    <div class="wrap top-in">
      <RouterLink to="/" class="brand" :aria-label="t('{app}, home', { app: APP.fullName })">
        <MeowCat face :size="34" class="mark" />
        <span class="name" dir="ltr">{{ APP.name[0] }}<span class="name-2">{{ APP.name[1] }}</span></span>
        <span class="fa-brand brand-fa" lang="fa" dir="rtl">{{ APP.brandFa }}</span>
      </RouterLink>
      <div class="stats" :aria-label="t('Your stats')">
        <span class="stat streak" :class="{ off: !streakActiveToday() }" :title="streakActiveToday() ? t('Day streak') : t('Finish a lesson today to keep your streak')">
          <AppIcon name="flame" /><span>{{ P.streak }}</span><span class="sr-only"> {{ t('day streak') }}</span>
        </span>
        <span class="stat xp" :title="t('Total XP')"><AppIcon name="star" /><span>{{ P.xp }}</span><span class="sr-only"> XP</span></span>
        <span class="stat hearts" :title="P.settings.relaxed ? t('Relaxed mode: no hearts') : t('Hearts left today')">
          <AppIcon name="heart" /><span>{{ P.settings.relaxed ? '∞' : P.hearts }}</span><span class="sr-only"> {{ t('hearts') }}</span>
        </span>
        <RouterLink v-if="account.enabled" to="/account" class="stat acct" :class="{ on: account.user }" :aria-label="account.user ? t('Account: {email}', { email: account.user.email }) : t('Sign in to save your progress')" :title="account.user ? t('Signed in as {email}', { email: account.user.email }) : t('Sign in to save your progress')">
          <span v-if="account.user" class="initial" aria-hidden="true">{{ account.user.email.charAt(0).toUpperCase() }}</span>
          <AppIcon v-else name="user" /><span v-if="!account.user" class="acct-label">{{ t('Sign in') }}</span>
        </RouterLink>
      </div>
    </div>
    <nav class="wrap tabs" :aria-label="t('Main')">
      <RouterLink v-for="n in nav" :key="n.to" :to="n.to" class="tab" :aria-label="n.label">
        <AppIcon :name="n.icon" /><span>{{ n.label }}</span>
      </RouterLink>
    </nav>
  </header>
  <RouterView :key="route.fullPath + P.settings.lang" />
</template>

<style scoped>
.top { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; background: var(--bg); border-bottom: 1px solid var(--line) }
.top-in { display: flex; align-items: center; gap: 12px; padding-block: 10px 6px }
.brand { display: flex; align-items: center; gap: 8px; margin-right: auto; text-decoration: none; color: var(--ink) }
.mark { background: var(--accent); border-radius: 11px; padding: 1px }
.name-2 { color: var(--accent) }
.name { font-family: var(--f-display); font-size: 1.45rem; font-weight: 800; letter-spacing: -0.01em }
.brand-fa { font-family: var(--f-fa); font-size: 1.2rem; color: var(--accent); font-weight: 700 }
.stats { display: flex; gap: 6px }
.stat { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); font-weight: 600; font-size: 0.9rem; font-variant-numeric: tabular-nums }
.stat.streak .ico { color: var(--saffron) }
.stat.xp .ico { color: var(--accent) }
.stat.hearts .ico { color: var(--bad) }
.stat.off { opacity: 0.55 }
.acct { text-decoration: none; color: var(--lapis) }
.acct:hover { border-color: var(--lapis) }
.acct.on { padding: 2px; border-color: var(--lapis) }
.initial { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--lapis); color: var(--lapis-ink); font-size: 0.8rem; font-weight: 700 }
.tabs { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; padding-bottom: 6px }
.tab { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; color: var(--muted); text-decoration: none; font-weight: 500; font-size: 0.92rem; white-space: nowrap }
.tab:hover { background: var(--sunk); color: var(--ink) }
.tab.router-link-exact-active { background: var(--accent-soft); color: var(--accent); font-weight: 600 }
@media (max-width: 520px) {
  .brand-fa { display: none }
  .name { font-size: 1.25rem }
  .stat { padding: 3px 8px; font-size: 0.85rem }
  .acct-label { display: none }
  .tabs { justify-content: space-between }
  .tab { flex-direction: column; gap: 2px; font-size: 0.72rem; padding: 6px 8px }
  .tab .ico { width: 20px; height: 20px }
}
</style>
