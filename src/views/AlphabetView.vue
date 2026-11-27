<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LETTERS, LETTER_GROUPS, letterForms } from '@/content/alphabet.ts'
import { VOWELS, VOWELS_KEY } from '@/content/vowels.ts'
import { P, alphabetUnlocked } from '@/lib/store.ts'
import { speak } from '@/lib/speech.ts'
import StarNode from '@/components/StarNode.vue'
import AppIcon from '@/components/AppIcon.vue'
import MeowCat from '@/components/MeowCat.vue'
import BottomSheet from '@/components/BottomSheet.vue'
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

/* Tabs under the path: the letters chart, the vowels, and how the script works. Arrow keys move between them. */
const TABS = ['letters', 'vowels', 'about'] as const
type Tab = (typeof TABS)[number]
const tab = ref<Tab>('letters')
const tabLabel = (x: Tab) => (x === 'letters' ? t('Letters') : x === 'vowels' ? t('Vowels') : t('How it works'))
const tabBtns = ref<HTMLButtonElement[]>([])
function onTabKey(e: KeyboardEvent, i: number) {
  const rtl = getComputedStyle(e.currentTarget as Element).direction === 'rtl'
  const fwd = rtl ? 'ArrowLeft' : 'ArrowRight'
  const back = rtl ? 'ArrowRight' : 'ArrowLeft'
  const n = TABS.length
  const j = e.key === fwd ? (i + 1) % n : e.key === back ? (i + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
  if (j < 0) return
  e.preventDefault()
  tab.value = TABS[j]
  nextTick(() => tabBtns.value[j]?.focus())
}

/* A letter's details open in a sheet; the arrows walk through the alphabet without closing it. */
const selIdx = ref(0)
const sel = computed(() => LETTERS[selIdx.value])
const sheetOpen = ref(false)
function openLetter(i: number) {
  selIdx.value = i
  sheetOpen.value = true
}
const near = (d: number) => (selIdx.value + d + LETTERS.length) % LETTERS.length
</script>

<template>
  <main class="wrap page alpha">
    <section class="card head">
      <div class="title-row">
        <div>
          <p class="eyebrow">{{ t('The Persian alphabet') }} · <span class="fa keep" lang="fa">الفبای فارسی</span></p>
          <h1>{{ t('32 letters, right to left') }}</h1>
        </div>
        <MeowCat mood="think" :size="56" />
      </div>
      <ol class="nodes">
        <StarNode v-for="(g, i) in LETTER_GROUPS" :key="i" :state="state(i)" :number="faNum(i + 1)" :label="t('Letters {letters}', { letters: g.title })" @go="router.push({ name: 'lesson', query: { alpha: String(i) } })">
          <span class="fa keep" lang="fa">{{ g.title }}</span>
        </StarNode>
      </ol>
    </section>

    <div class="tabs" role="tablist" :aria-label="t('The Persian alphabet')">
      <button
        v-for="(x, i) in TABS" :id="'atab-' + x" :key="x" ref="tabBtns" type="button" role="tab" class="tab"
        :aria-selected="tab === x" :aria-controls="'apanel-' + x" :tabindex="tab === x ? 0 : -1"
        @click="tab = x" @keydown="onTabKey($event, i)"
      >
        {{ tabLabel(x) }}
      </button>
    </div>

    <section v-show="tab === 'letters'" id="apanel-letters" class="card panel" role="tabpanel" aria-labelledby="atab-letters">
      <ul class="chart" :aria-label="t('All letters')">
        <li v-for="(l, i) in LETTERS" :key="l.fa">
          <button type="button" class="glyph" :class="{ persian: l.persian }" aria-haspopup="dialog" :aria-label="`${l.name}, ${l.sound}`" @click="openLetter(i)">
            <span class="fa keep" lang="fa">{{ l.fa }}</span>
            <small>{{ l.name }}</small>
          </button>
        </li>
      </ul>
      <p class="muted legend"><span class="dot" aria-hidden="true"></span> {{ t('Persian only') }} · {{ t('Tap a letter to see its shapes and hear it.') }}</p>
    </section>

    <section v-show="tab === 'vowels'" id="apanel-vowels" class="card panel vowels" role="tabpanel" aria-labelledby="atab-vowels">
      <div class="title-row">
        <div>
          <p class="eyebrow">{{ t('Vowels') }} · <span class="fa keep" lang="fa">مصوت‌ها</span></p>
          <h2>{{ t('Three short vowels, three long ones') }}</h2>
        </div>
        <ol class="nodes one">
          <StarNode :state="vowelsState()" number="۷" :label="t('Vowels lesson')" @go="router.push({ name: 'lesson', query: { vowels: '1' } })">
            <span class="fa keep" lang="fa">بَ بِ بُ</span>
          </StarNode>
        </ol>
      </div>
      <p class="muted small">{{ t('The short vowels a, e and o are small marks that printed Persian usually leaves out. Words in A1 show them; from B1 on they disappear, like in real Persian. Tap a word to hear it.') }}</p>
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

    <section v-show="tab === 'about'" id="apanel-about" class="card panel" role="tabpanel" aria-labelledby="atab-about">
      <p class="muted">
        {{ t('Persian uses the Arabic script plus four letters of its own:') }} <span class="fa keep" lang="fa">پ چ ژ گ</span>.
        {{ t('Most letters join the next one and change shape with their position. Seven never join forward:') }}
        <span class="fa keep" lang="fa">ا د ذ ر ز ژ و</span>. {{ t('Short vowels (a, e, o) are usually not written.') }}
      </p>
      <RouterLink class="more" :to="{ name: 'not-arabic' }">{{ t('Persian is not Arabic: why you already know some words') }} →</RouterLink>
    </section>

    <BottomSheet :open="sheetOpen" labelledby="letter-title" @close="sheetOpen = false">
      <div class="ls-head">
        <button type="button" class="hear-letter" :aria-label="t('Hear the letter {name}', { name: sel.name })" @click="speak(sel.fa)">
          <span class="big ls-big fa keep" lang="fa">{{ sel.fa }}</span>
          <AppIcon name="speaker" class="hear-ico" />
        </button>
        <div class="ls-name">
          <h2 id="letter-title">{{ sel.name }}</h2>
          <p class="muted">{{ sel.sound }}</p>
          <span v-if="sel.persian" class="chip saffron">{{ t('Persian only') }}</span>
        </div>
      </div>
      <span class="forms" aria-hidden="true">
        <span v-for="f in letterForms(sel)" :key="f.label" class="form"><span class="fa keep" lang="fa">{{ f.text }}</span><small>{{ t(f.label) }}</small></span>
      </span>
      <button type="button" class="example ls-ex" :aria-label="t('{name}, sounds {sound}, as in {word}, {meaning}', { name: sel.name, sound: sel.sound, word: sel.example.tr, meaning: sel.example.en })" @click="speak(sel.example.fa)">
        <AppIcon name="speaker" class="hear-ico small-ico" />
        <span class="fa keep" lang="fa">{{ sel.example.fa }}</span> <span class="muted small">{{ sel.example.tr }}, {{ sel.example.en }}</span>
      </button>
      <div class="ls-nav">
        <button type="button" class="btn ghost sm" :aria-label="t('Previous letter')" @click="selIdx = near(-1)">
          <AppIcon name="arrow" class="to-prev" /> {{ LETTERS[near(-1)].name }}
        </button>
        <button type="button" class="btn ghost sm" :aria-label="t('Next letter')" @click="selIdx = near(1)">
          {{ LETTERS[near(1)].name }} <AppIcon name="arrow" class="to-next" />
        </button>
      </div>
    </BottomSheet>
  </main>
</template>

<style scoped>
/* One screen: the lesson path stays in view; the letters, the vowels and the notes are tabs below it,
   and a letter's details open in a sheet. */
.alpha { gap: 10px; padding-top: 12px; padding-bottom: calc(var(--tab-h) + 16px) }
.more { font-weight: 600; color: var(--accent) }
.head { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px }
.head h1 { font-size: 1.45rem; font-weight: 800 }
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px }
.head .fa, .panel .muted .fa { font-size: 1.15em; color: var(--ink) }
.nodes { list-style: none; margin: 2px 0 0; padding: 0; display: flex; justify-content: space-between; gap: 4px }
.nodes :deep(.label) .fa { font-size: 0.95rem }

.tabs { display: flex; gap: 4px; padding: 4px; background: var(--sunk); border-radius: 14px }
.tab { flex: 1; border: 0; background: none; font: inherit; font-size: 0.92rem; font-weight: 600; color: var(--muted); padding: 8px 6px; border-radius: 10px; cursor: pointer }
.tab[aria-selected='true'] { background: var(--surface); color: var(--ink); box-shadow: var(--shadow) }
.tab:focus-visible { outline: 3px solid var(--lapis); outline-offset: 1px }
.panel { display: flex; flex-direction: column; gap: 10px; padding: 12px 14px }

.chart { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px }
.glyph { position: relative; width: 100%; border: 0; border-radius: 10px; background: var(--sunk); color: var(--ink); font: inherit; cursor: pointer; padding: 3px 0 4px; display: flex; flex-direction: column; align-items: center; line-height: 1 }
.glyph .fa { font-size: 1.45rem; line-height: 1.5; color: var(--accent); font-weight: 700 }
.glyph small { font-size: 0.6rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100% }
.glyph:hover { background: var(--accent-soft) }
.glyph:focus-visible { outline: 3px solid var(--lapis); outline-offset: 1px }
.glyph.persian::after { content: ''; position: absolute; top: 4px; inset-inline-end: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--saffron) }
.dot { display: inline-block; vertical-align: middle; width: 6px; height: 6px; border-radius: 50%; background: var(--saffron) }
.legend { font-size: 0.8rem }

.hear-letter, .example { border: 0; background: none; font: inherit; color: inherit; cursor: pointer; border-radius: 12px; padding: 2px 8px; display: inline-flex; align-items: center; gap: 6px }
.hear-letter:hover, .example:hover { background: var(--sunk) }
.hear-ico { color: var(--lapis); width: 18px; height: 18px }
.small-ico { width: 15px; height: 15px }
.big { font-size: 2.6rem; font-weight: 700; line-height: 1.4; color: var(--accent) }
.name { font-weight: 600; font-size: 0.9rem }
.example .fa { font-size: 1.1rem }

.vowels h2 { font-size: 1.15rem; font-weight: 800 }
.nodes.one { margin: 0; flex: 0 0 auto }
.vgrid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px }
.vcard { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; padding: 10px; border-radius: 14px; background: var(--sunk) }
.vex { display: flex; flex-direction: column; align-items: center }

/* The letter sheet */
.ls-head { display: flex; align-items: center; gap: 12px; padding-inline-end: 40px }
.ls-name { display: flex; flex-direction: column; align-items: flex-start; gap: 2px }
.ls-name h2 { font-size: 1.4rem; font-weight: 800 }
.ls-big { font-size: 3.4rem }
.forms { display: flex; gap: 16px; direction: rtl; flex-wrap: wrap; justify-content: center; background: var(--sunk); border-radius: 14px; padding: 8px }
.form { display: flex; flex-direction: column; align-items: center; direction: ltr }
.form .fa { font-size: 1.8rem; line-height: 1.5 }
.form small { font-size: 0.7rem; color: var(--muted) }
.ls-ex { align-self: center }
.ls-nav { display: flex; justify-content: space-between; gap: 8px }
/* The arrow icon points back; turn it for "next", and mirror both in a right-to-left interface. */
.to-next { transform: scaleX(-1) }
[dir='rtl'] .to-prev { transform: scaleX(-1) }
[dir='rtl'] .to-next { transform: none }
</style>
