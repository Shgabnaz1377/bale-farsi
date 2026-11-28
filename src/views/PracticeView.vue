<script setup lang="ts">
import { computed } from 'vue'
import { ALL_WORDS } from '@/content/course.ts'
import { mulberry32 } from '@/lib/random.ts'
import { dayNumber } from '@/lib/srs.ts'
import { P, alphabetDone, dueCount, seenCount, xpToday } from '@/lib/store.ts'
import { APP } from '@/app.ts'
import { t, tn } from '@/i18n/index.ts'
import AppIcon from '@/components/AppIcon.vue'
import FaText from '@/components/FaText.vue'
import InstallCard from '@/components/InstallCard.vue'
import SpeakButton from '@/components/SpeakButton.vue'

/** Practice: everything besides the path, on one screen of tiles. */
const goalPct = computed(() => Math.min(100, Math.round((xpToday() / P.settings.goal) * 100)))
const due = computed(() => dueCount())
const wotd = (() => {
  const r = mulberry32(dayNumber())
  return ALL_WORDS[Math.floor(r() * ALL_WORDS.length)]
})()
const persian = APP.id === 'persianmeow'
</script>

<template>
  <main class="wrap page practice">
    <h1 class="sr-only">{{ t('Practice') }}</h1>

    <div class="today">
      <section class="card tile goal" :aria-label="t('Daily goal')">
        <p class="eyebrow">{{ t('Daily goal') }}</p>
        <p class="goal-num">{{ xpToday() }}<small> / {{ P.settings.goal }} XP</small></p>
        <div class="meter" role="progressbar" :aria-label="t('Daily goal')" :aria-valuenow="goalPct" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: goalPct + '%' }"></i></div>
        <p class="small muted">{{ goalPct >= 100 ? t('Goal reached today.') : t('One lesson is 10 to 15 XP.') }}</p>
      </section>
      <section class="card tile wotd" :aria-label="t('Word of the day')">
        <p class="eyebrow">{{ t('Word of the day') }}</p>
        <div class="wotd-row">
          <FaText :fa="wotd.word.fa" :tr="wotd.word.tr" size="lg" keep-tr />
          <SpeakButton :text="wotd.word.fa" />
        </div>
        <p class="en">{{ wotd.word.en }}</p>
      </section>
    </div>

    <nav class="tiles" :aria-label="t('Practice')">
      <RouterLink v-if="seenCount() > 0" class="card tile act" :to="{ name: 'lesson', query: { review: '1' } }">
        <span class="a-ico lapis"><AppIcon name="review" /></span>
        <b>{{ due > 0 ? t('Review') : t('Practice') }}</b>
        <span class="muted small">{{ due > 0 ? tn(due, '{n} word due today', '{n} words due today') : t('Nothing due. Practise your weakest words.') }}</span>
      </RouterLink>
      <RouterLink class="card tile act" :to="{ name: 'quick', query: { mode: 'guess' } }">
        <span class="a-ico saffron"><AppIcon name="star" /></span>
        <b>{{ t('Quick play') }}</b>
        <span class="muted small">{{ t('3-second challenge, or listen & repeat.') }}</span>
      </RouterLink>
      <RouterLink v-if="persian" class="card tile act" :to="{ name: 'facts' }">
        <span class="a-ico accent" aria-hidden="true">💡</span>
        <b>{{ t('Did you know?') }}</b>
        <span class="muted small">{{ t('Fun facts and words. Read one, win a heart.') }}</span>
      </RouterLink>
      <RouterLink v-if="persian" class="card tile act" :to="{ name: 'idioms' }">
        <span class="a-ico saffron" aria-hidden="true">😼</span>
        <b>{{ t('Persian idioms') }}</b>
        <span class="muted small">{{ t('Pishi acts out sayings. Learn one, win a heart.') }}</span>
      </RouterLink>
      <RouterLink v-if="persian" class="card tile act" :to="{ name: 'cast' }">
        <span class="a-ico lapis-soft" aria-hidden="true">👥</span>
        <b>{{ t('Characters') }}</b>
        <span class="muted small">{{ t('Meet everyone who speaks in the dialogues.') }}</span>
      </RouterLink>
      <RouterLink v-if="APP.alphabet" class="card tile act" :to="{ name: 'alphabet' }">
        <span class="a-ico accent fa-brand" lang="fa" aria-hidden="true">ب</span>
        <b>{{ t('Alphabet') }}</b>
        <span class="muted small">{{ alphabetDone() ? t('All letters done. Open any time to look one up.') : t('32 letters, six short lessons. Open any time.') }}</span>
      </RouterLink>
      <RouterLink v-if="APP.target === 'fa'" class="card tile act" :to="{ name: 'not-arabic' }">
        <span class="a-ico lapis-soft fa-brand" lang="fa" aria-hidden="true">پ</span>
        <b>{{ t('Persian is not Arabic') }}</b>
        <span class="muted small">{{ t('Why you already know some words.') }}</span>
      </RouterLink>
    </nav>

    <InstallCard dismissible class="install" />
  </main>
</template>

<style scoped>
.practice { gap: 12px; padding-top: 14px }
.today { display: grid; grid-template-columns: 1fr 1fr; gap: 10px }
.tile { padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; min-width: 0 }
.goal-num { font-family: var(--f-display); font-size: 1.45rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.2 }
.goal-num small { font-family: var(--f-body); font-size: 0.85rem; font-weight: 500; color: var(--muted) }
.goal .meter { margin: 4px 0 2px }
.wotd-row { display: flex; align-items: center; justify-content: space-between; gap: 8px }
.wotd-row :deep(.fw) { align-items: flex-start; min-width: 0 }
.wotd-row :deep(.spk) { width: 38px; height: 38px; flex: none }
.en { font-weight: 600; font-size: 0.92rem; line-height: 1.3 }
.tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px }
.act { text-decoration: none; color: var(--ink); text-align: start }
.act:hover { border-color: var(--muted) }
.act b { font-family: var(--f-display); font-size: 1.02rem; line-height: 1.2; margin-top: 4px }
.act .small { line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden }
.a-ico { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; flex: none; font-size: 1.2rem; font-weight: 700 }
.a-ico .ico { width: 20px; height: 20px }
.a-ico.lapis { background: var(--lapis); color: var(--lapis-ink) }
.a-ico.lapis-soft { background: var(--lapis-soft); color: var(--lapis) }
.a-ico.saffron { background: var(--saffron-soft); color: var(--saffron) }
.a-ico.accent { background: var(--accent-soft); color: var(--accent) }
.install { padding: 12px 14px }
@media (min-width: 721px) {
  .tiles { grid-template-columns: repeat(3, minmax(0, 1fr)) }
}
</style>
