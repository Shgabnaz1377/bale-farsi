<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LETTERS, LETTER_GROUPS, letterForms } from '@/content/alphabet.ts'
import { VOWELS, VOWELS_KEY } from '@/content/vowels.ts'
import { P, alphabetUnlocked } from '@/lib/store.ts'
import { speak } from '@/lib/speech.ts'
import StarNode from '@/components/StarNode.vue'
import AppIcon from '@/components/AppIcon.vue'
import MeowCat from '@/components/MeowCat.vue'
import { t } from '@/i18n/index.ts'

const router = useRouter()
const faNum = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
function state(i: number) {
  if (P.done[`alphabet/${i}`]) return 'done' as const
  if (!alphabetUnlocked(i)) return 'locked' as const
  const first = LETTER_GROUPS.findIndex((_, j) => !P.done[`alphabet/${j}`])
  return first === i ? 'current' as const : 'open' as const
}
const vowelsState = () => (P.done[VOWELS_KEY] ? 'done' as const : 'current' as const)
</script>

<template>
  <main class="wrap page">
    <section class="card head">
      <p class="eyebrow">{{ t('The Persian alphabet') }} · <span class="fa keep" lang="fa">الفبای فارسی</span></p>
      <div class="title-row">
        <h1>{{ t('32 letters, right to left') }}</h1>
        <MeowCat mood="think" :size="64" />
      </div>
      <p class="muted">
        {{ t('Persian uses the Arabic script plus four letters of its own:') }} <span class="fa keep" lang="fa">پ چ ژ گ</span>.
        {{ t('Most letters join the next one and change shape with their position. Seven never join forward:') }}
        <span class="fa keep" lang="fa">ا د ذ ر ز ژ و</span>. {{ t('Short vowels (a, e, o) are usually not written.') }}
      </p>
      <RouterLink class="more" :to="{ name: 'not-arabic' }">{{ t('Persian is not Arabic: why you already know some words') }} →</RouterLink>
      <ol class="nodes">
        <StarNode v-for="(g, i) in LETTER_GROUPS" :key="i" :state="state(i)" :number="faNum(i + 1)" :label="t('Letters {letters}', { letters: g.title })" @go="router.push({ name: 'lesson', query: { alpha: String(i) } })">
          <span class="fa keep" lang="fa">{{ g.title }}</span>
        </StarNode>
      </ol>
    </section>

    <section class="card vowels" aria-labelledby="vowels-h">
      <div class="title-row">
        <div>
          <p class="eyebrow">{{ t('Vowels') }} · <span class="fa keep" lang="fa">مصوت‌ها</span></p>
          <h2 id="vowels-h">{{ t('Three short vowels, three long ones') }}</h2>
        </div>
        <ol class="nodes one">
          <StarNode :state="vowelsState()" number="۷" :label="t('Vowels lesson')" @go="router.push({ name: 'lesson', query: { vowels: '1' } })">
            <span class="fa keep" lang="fa">بَ بِ بُ</span>
          </StarNode>
        </ol>
      </div>
      <p class="muted">{{ t('The short vowels a, e and o are small marks that printed Persian usually leaves out. Words in A1 show them; from B1 on they disappear, like in real Persian. Tap a word to hear it.') }}</p>
      <ul class="vgrid">
        <li v-for="v in VOWELS" :key="v.name" class="vcard">
          <button type="button" class="hear-letter" :aria-label="t('Hear {name}', { name: v.name })" @click="speak(v.fa)">
            <span class="big fa keep" lang="fa">{{ v.fa }}</span>
          </button>
          <span class="name">{{ v.name }} <span class="muted">· {{ v.tr }}, {{ t(v.sound) }}</span></span>
          <span class="vex">
            <button v-for="e in v.examples" :key="e.tr" type="button" class="example" :aria-label="t('{word}, {meaning}', { word: e.tr, meaning: e.en })" @click="speak(e.fa)">
              <span class="fa keep" lang="fa">{{ e.fa }}</span> <span class="muted small">{{ e.tr }}</span>
            </button>
          </span>
        </li>
      </ul>
    </section>

    <ul class="grid" :aria-label="t('All letters')">
      <li v-for="l in LETTERS" :key="l.fa">
        <div class="card letter">
          <button type="button" class="hear-letter" :aria-label="t('Hear the letter {name}', { name: l.name })" @click="speak(l.fa)">
            <span class="big fa keep" lang="fa">{{ l.fa }}</span>
            <AppIcon name="speaker" class="hear-ico" />
          </button>
          <span class="name">{{ l.name }} <span class="muted">· {{ l.sound }}</span></span>
          <span class="forms" aria-hidden="true">
            <span v-for="f in letterForms(l)" :key="f.label" class="form"><span class="fa keep" lang="fa">{{ f.text }}</span><small>{{ t(f.label) }}</small></span>
          </span>
          <button type="button" class="example" :aria-label="t('{name}, sounds {sound}, as in {word}, {meaning}', { name: l.name, sound: l.sound, word: l.example.tr, meaning: l.example.en })" @click="speak(l.example.fa)">
            <AppIcon name="speaker" class="hear-ico small-ico" />
            <span class="fa keep" lang="fa">{{ l.example.fa }}</span> <span class="muted small">{{ l.example.tr }}, {{ l.example.en }}</span>
          </button>
          <span v-if="l.persian" class="chip saffron flag">{{ t('Persian only') }}</span>
        </div>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.more { font-weight: 600; color: var(--accent) }
.head { display: flex; flex-direction: column; gap: 10px }
.head h1 { font-size: 1.7rem; font-weight: 800 }
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px }
.head .fa { font-size: 1.15em; color: var(--ink) }
.nodes { list-style: none; margin: 8px 0 0; padding: 0; display: flex; justify-content: space-between; gap: 4px }
.nodes :deep(.label) .fa { font-size: 0.95rem }
.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px }
.letter { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; padding: 12px 10px; color: var(--ink) }
.hear-letter, .example { border: 0; background: none; font: inherit; color: inherit; cursor: pointer; border-radius: 12px; padding: 2px 8px; display: inline-flex; align-items: center; gap: 6px }
.hear-letter:hover, .example:hover { background: var(--sunk) }
.hear-ico { color: var(--lapis); width: 18px; height: 18px }
.small-ico { width: 15px; height: 15px }
.big { font-size: 2.6rem; font-weight: 700; line-height: 1.4; color: var(--accent) }
.name { font-weight: 600; font-size: 0.9rem }
.forms { display: flex; gap: 8px; direction: rtl; flex-wrap: wrap; justify-content: center }
.form { display: flex; flex-direction: column; align-items: center; direction: ltr }
.form .fa { font-size: 1.3rem; line-height: 1.5 }
.form small { font-size: 0.62rem; color: var(--muted) }
.example .fa { font-size: 1.1rem }
.vowels { display: flex; flex-direction: column; gap: 10px }
.vowels h2 { font-size: 1.25rem; font-weight: 800 }
.nodes.one { margin: 0; flex: 0 0 auto }
.vgrid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px }
.vcard { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; padding: 10px; border-radius: 14px; background: var(--sunk) }
.vex { display: flex; flex-direction: column; align-items: center }
.flag { position: absolute; top: 8px; inset-inline-end: 8px; font-size: 0.58rem; padding: 2px 6px }
</style>
