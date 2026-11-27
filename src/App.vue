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
import { welcomeOpen } from '@/lib/welcome.ts'

const route = useRoute()

// Hash routing: a plain #main link would change the route, so the skip link moves focus itself.
function skipToMain() {
  const main = document.querySelector('main')
  if (!main) return
  main.setAttribute('tabindex', '-1')
  main.focus()
}
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

// Which tab a screen belongs to, so the tab stays lit on its sub-pages (a unit is part of Learn).
const SECTION: Record<string, string> = {
  home: 'learn', unit: 'learn',
  practice: 'practice', quick: 'practice', facts: 'practice', idioms: 'practice', alphabet: 'practice', 'not-arabic': 'practice',
  words: 'words', progress: 'progress', settings: 'settings', account: 'settings',
}
const section = computed(() => SECTION[String(route.name)] ?? '')
// The lesson player and the first-visit welcome take the whole screen.
const chrome = computed(() => !inLesson.value && !(route.name === 'home' && welcomeOpen.value))

const nav = computed(() => [
  { id: 'learn', to: '/', label: t('Learn'), icon: 'path' },
  { id: 'practice', to: '/practice', label: t('Practice'), icon: 'bolt' },
  { id: 'words', to: '/words', label: t('Words'), icon: 'book' },
  { id: 'progress', to: '/progress', label: t('Progress'), icon: 'chart' },
  { id: 'settings', to: '/settings', label: t('Settings'), icon: 'gear' },
])
</script>

<template>
  <a href="#" class="skip" @click.prevent="skipToMain">{{ t('Skip to content') }}</a>
  <header v-if="chrome" class="top">
    <div class="top-in">
      <RouterLink to="/" class="brand" :aria-label="t('{app}, home', { app: APP.fullName })">
        <MeowCat face :size="32" class="mark" />
        <span class="name" dir="ltr">{{ APP.name[0] }}<span class="name-2">{{ APP.name[1] }}</span></span>
        <span class="fa-brand brand-fa" lang="fa" dir="rtl">{{ APP.brandFa }}</span>
      </RouterLink>
      <nav class="tabs" :aria-label="t('Main')">
        <RouterLink v-for="n in nav" :key="n.to" v-slot="{ href, navigate }" :to="n.to" custom>
          <a :href="href" class="tab" :class="{ on: section === n.id }" :aria-current="section === n.id ? 'page' : undefined" @click="navigate">
            <span class="tab-ico"><AppIcon :name="n.icon" /></span><span class="tab-label">{{ n.label }}</span>
          </a>
        </RouterLink>
      </nav>
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
  </header>
  <RouterView :key="route.fullPath + P.settings.lang" />
</template>

<style scoped>
.top { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; height: var(--top-h); background: var(--bg); border-bottom: 1px solid var(--line) }
.top-in { height: 100%; max-width: 1120px; margin: 0 auto; display: flex; align-items: center; gap: 16px; padding-inline: max(16px, env(safe-area-inset-left, 0px)) max(16px, env(safe-area-inset-right, 0px)) }
.brand { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--ink); flex: none }
.mark { background: var(--accent); border-radius: 10px; padding: 1px }
.name-2 { color: var(--accent) }
.name { font-family: var(--f-display); font-size: 1.4rem; font-weight: 800; letter-spacing: -0.01em }
.brand-fa { font-family: var(--f-fa); font-size: 1.15rem; color: var(--accent); font-weight: 700 }
.stats { display: flex; gap: 6px; flex: none; margin-inline-start: auto }
.stat { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); font-weight: 600; font-size: 0.9rem; font-variant-numeric: tabular-nums }
.stat.streak .ico { color: var(--saffron) }
.stat.xp .ico { color: var(--accent) }
.stat.hearts .ico { color: var(--bad) }
.stat.off { opacity: 0.55 }
.acct { text-decoration: none; color: var(--lapis) }
.acct:hover { border-color: var(--lapis) }
.acct.on { padding: 2px; border-color: var(--lapis) }
.initial { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--lapis); color: var(--lapis-ink); font-size: 0.8rem; font-weight: 700 }

/* Wide screens: the tabs sit in the top bar. */
.tabs { display: flex; gap: 2px; min-width: 0 }
.tab { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 12px; color: var(--muted); text-decoration: none; font-weight: 500; font-size: 0.94rem; white-space: nowrap }
.tab-ico { display: inline-flex }
.tab:hover { background: var(--sunk); color: var(--ink) }
.tab.on { background: var(--accent-soft); color: var(--accent); font-weight: 600 }

@media (min-width: 721px) and (max-width: 980px) {
  .name, .brand-fa { display: none }
  .tabs { overflow-x: auto; scrollbar-width: none }
  .tab { padding: 8px 10px }
}

/* Phones: a slim top bar and a tab bar fixed to the bottom of the screen. */
@media (max-width: 720px) {
  .top-in { gap: 8px }
  .brand-fa { display: none }
  .name { font-size: 1.2rem }
  .stats { gap: 4px }
  .stat { padding: 3px 8px; font-size: 0.85rem }
  .acct-label { display: none }
  .tabs {
    position: fixed; inset: auto 0 0; z-index: 25; height: var(--tab-h); gap: 0;
    padding: 6px max(6px, env(safe-area-inset-right, 0px)) env(safe-area-inset-bottom, 0px) max(6px, env(safe-area-inset-left, 0px));
    background: var(--surface); border-top: 1px solid var(--line); box-shadow: 0 -8px 24px -18px rgba(19, 33, 58, 0.45);
  }
  .tab { flex: 1 1 0; min-width: 0; flex-direction: column; justify-content: center; gap: 3px; padding: 0 2px 6px; border-radius: 0; font-size: 0.7rem; font-weight: 600 }
  .tab:hover, .tab.on { background: none }
  .tab-ico { width: 52px; height: 30px; border-radius: 999px; display: grid; place-items: center; transition: background 0.2s }
  .tab-ico .ico { width: 22px; height: 22px }
  .tab.on .tab-ico { background: var(--accent-soft) }
  .tab-label { max-width: 100%; overflow: hidden; text-overflow: ellipsis }
}
@media (max-width: 360px) {
  .name { font-size: 1.05rem }
  .stat { padding: 3px 6px }
}
</style>
