<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { P, rollDay, streakActiveToday } from '@/lib/store.ts'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const inLesson = computed(() => route.name === 'lesson')

rollDay()

watchEffect(() => {
  const root = document.documentElement
  root.classList.remove('mode-both', 'mode-script', 'mode-latin')
  root.classList.add(`mode-${P.settings.mode}`)
  if (P.settings.theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', P.settings.theme)
})

const nav = [
  { to: '/', label: 'Learn', icon: 'path' },
  { to: '/alphabet', label: 'Alphabet', icon: 'letter' },
  { to: '/words', label: 'Words', icon: 'book' },
  { to: '/progress', label: 'Progress', icon: 'chart' },
  { to: '/settings', label: 'Settings', icon: 'gear' },
] as const
</script>

<template>
  <header v-if="!inLesson" class="top">
    <div class="wrap top-in">
      <RouterLink to="/" class="brand" aria-label="Bale, home">
        <span class="mark" aria-hidden="true"></span>
        <span class="name">Bale</span>
        <span class="fa keep brand-fa" lang="fa">بله</span>
      </RouterLink>
      <div class="stats" aria-label="Your stats">
        <span class="stat streak" :class="{ off: !streakActiveToday() }" :title="streakActiveToday() ? 'Day streak' : 'Finish a lesson today to keep your streak'">
          <AppIcon name="flame" /><span>{{ P.streak }}</span><span class="sr-only"> day streak</span>
        </span>
        <span class="stat xp" title="Total XP"><AppIcon name="star" /><span>{{ P.xp }}</span><span class="sr-only"> XP</span></span>
        <span class="stat hearts" :title="P.settings.relaxed ? 'Relaxed mode: no hearts' : 'Hearts left today'">
          <AppIcon name="heart" /><span>{{ P.settings.relaxed ? '∞' : P.hearts }}</span><span class="sr-only"> hearts</span>
        </span>
      </div>
    </div>
    <nav class="wrap tabs" aria-label="Main">
      <RouterLink v-for="n in nav" :key="n.to" :to="n.to" class="tab" :aria-label="n.label">
        <AppIcon :name="n.icon" /><span>{{ n.label }}</span>
      </RouterLink>
    </nav>
  </header>
  <RouterView :key="route.fullPath" />
</template>

<style scoped>
.top { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; background: var(--bg); border-bottom: 1px solid var(--line) }
.top-in { display: flex; align-items: center; gap: 12px; padding-block: 10px 6px }
.brand { display: flex; align-items: center; gap: 8px; margin-right: auto; text-decoration: none; color: var(--ink) }
.mark { width: 26px; height: 26px; background: var(--accent);
  clip-path: polygon(50% 0%,65.31% 13.04%,85.36% 14.64%,86.96% 34.69%,100% 50%,86.96% 65.31%,85.36% 85.36%,65.31% 86.96%,50% 100%,34.69% 86.96%,14.64% 85.36%,13.04% 65.31%,0% 50%,13.04% 34.69%,14.64% 14.64%,34.69% 13.04%) }
.name { font-family: var(--f-display); font-size: 1.45rem; font-weight: 800; letter-spacing: -0.01em }
.brand-fa { font-size: 1.2rem; color: var(--accent); font-weight: 700 }
.stats { display: flex; gap: 6px }
.stat { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); font-weight: 600; font-size: 0.9rem; font-variant-numeric: tabular-nums }
.stat.streak .ico { color: var(--saffron) }
.stat.xp .ico { color: var(--accent) }
.stat.hearts .ico { color: var(--bad) }
.stat.off { opacity: 0.55 }
.tabs { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; padding-bottom: 6px }
.tab { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; color: var(--muted); text-decoration: none; font-weight: 500; font-size: 0.92rem; white-space: nowrap }
.tab:hover { background: var(--sunk); color: var(--ink) }
.tab.router-link-exact-active { background: var(--accent-soft); color: var(--accent); font-weight: 600 }
@media (max-width: 520px) {
  .brand-fa { display: none }
  .name { font-size: 1.25rem }
  .stat { padding: 3px 8px; font-size: 0.85rem }
  .tabs { justify-content: space-between }
  .tab { flex-direction: column; gap: 2px; font-size: 0.72rem; padding: 6px 8px }
  .tab .ico { width: 20px; height: 20px }
}
</style>
