<script setup lang="ts">
import { COGNATES, EXTRA_LETTERS, LOANWORDS, NO_GENDER } from '@/content/notArabic.ts'
import { lang, t } from '@/i18n/index.ts'
import AppIcon from '@/components/AppIcon.vue'
import FaText from '@/components/FaText.vue'
import MeowCat from '@/components/MeowCat.vue'
import SpeakButton from '@/components/SpeakButton.vue'

const mean = (x: { en: string; it: string }) => (lang() === 'it' ? x.it : x.en)
</script>

<template>
  <main class="wrap page na">
    <RouterLink to="/alphabet" class="back"><AppIcon name="arrow" /> {{ t('Alphabet') }}</RouterLink>
    <section class="card hero">
      <MeowCat mood="think" :size="96" />
      <div>
        <h1>{{ t('Persian is not Arabic') }}</h1>
        <p class="muted">{{ t('Persian borrowed the Arabic alphabet and many words, but it is an Indo-European language: a distant cousin of English and Italian. Its grammar is much closer to theirs than to Arabic.') }}</p>
      </div>
    </section>

    <section class="card block">
      <h2>{{ t('Family words you already know') }}</h2>
      <p class="muted small">{{ t('Same old roots, thousands of years apart.') }}</p>
      <ul class="grid">
        <li v-for="c in COGNATES" :key="c.fa" class="cell">
          <SpeakButton :text="c.fa" />
          <FaText :fa="c.fa" :tr="c.tr" size="md" keep-tr />
          <span class="rel"><b>{{ c.en }}</b> · <i lang="it">{{ c.it }}</i><template v-if="c.de"> · <i lang="de">{{ c.de }}</i></template></span>
        </li>
      </ul>
    </section>

    <section class="card block">
      <h2>{{ t('Four letters Arabic doesn’t have') }}</h2>
      <p class="muted small">{{ t('Persian added them for its own sounds: p, ch, zh and g.') }}</p>
      <ul class="letters">
        <li v-for="l in EXTRA_LETTERS" :key="l.fa">
          <span class="big fa-brand" lang="fa">{{ l.fa }}</span>
          <span class="tr">{{ l.tr }}</span>
          <span class="ex"><FaText :fa="l.word.fa" :tr="l.word.tr" size="sm" keep-tr inline /> {{ mean(l.word) }}</span>
        </li>
      </ul>
    </section>

    <section class="card block">
      <h2>{{ t('No “he” or “she”') }}</h2>
      <p class="muted small">{{ t('Persian has no grammatical gender: no masculine and feminine nouns, and one word, u, for both he and she.') }}</p>
      <ul class="rows">
        <li v-for="s in NO_GENDER" :key="s.fa"><SpeakButton :text="s.fa" /><FaText :fa="s.fa" :tr="s.tr" size="sm" keep-tr /><span>{{ mean(s) }}</span></li>
      </ul>
    </section>

    <section class="card block">
      <h2>{{ t('Borrowed, but said the Persian way') }}</h2>
      <p class="muted small">{{ t('Many everyday words come from Arabic (and some from French), but they follow Persian sounds and grammar.') }}</p>
      <ul class="rows">
        <li v-for="w in LOANWORDS" :key="w.fa"><SpeakButton :text="w.fa" /><FaText :fa="w.fa" :tr="w.tr" size="sm" keep-tr /><span>{{ mean(w) }}</span></li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.back { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; font-weight: 500 }
.hero { display: flex; gap: 16px; align-items: center }
.hero h1 { font-size: 1.7rem; font-weight: 800; margin-bottom: 6px }
.block { display: flex; flex-direction: column; gap: 10px }
.block h2 { font-size: 1.2rem; font-weight: 800 }
.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px }
.cell { display: flex; flex-direction: column; align-items: center; gap: 6px; background: var(--sunk); border-radius: 14px; padding: 10px; text-align: center }
.rel { font-size: 0.88rem }
.letters { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px }
.letters li { display: flex; flex-direction: column; align-items: center; gap: 4px; background: var(--accent-soft); border-radius: 14px; padding: 12px }
.big { font-size: 2.4rem; line-height: 1.2 }
.tr { font-weight: 700 }
.ex { font-size: 0.88rem; display: inline-flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center }
.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px }
.rows li { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; background: var(--sunk); border-radius: 14px; padding: 8px 12px }
</style>
