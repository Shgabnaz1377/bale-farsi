<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LETTERS, LETTER_GROUPS, letterForms } from '@/content/alphabet.ts'
import { P, alphabetUnlocked } from '@/lib/store.ts'
import { speak } from '@/lib/speech.ts'
import StarNode from '@/components/StarNode.vue'

const router = useRouter()
const faNum = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
function state(i: number) {
  if (P.done[`alphabet/${i}`]) return 'done' as const
  if (!alphabetUnlocked(i)) return 'locked' as const
  const first = LETTER_GROUPS.findIndex((_, j) => !P.done[`alphabet/${j}`])
  return first === i ? 'current' as const : 'open' as const
}
</script>

<template>
  <main class="wrap page">
    <section class="card head">
      <p class="eyebrow">The Persian alphabet · <span class="fa keep" lang="fa">الفبای فارسی</span></p>
      <h1>32 letters, right to left</h1>
      <p class="muted">
        Persian uses the Arabic script plus four letters of its own: <span class="fa keep" lang="fa">پ چ ژ گ</span>.
        Most letters join the next one and change shape with their position. Seven never join forward:
        <span class="fa keep" lang="fa">ا د ذ ر ز ژ و</span>. Short vowels (a, e, o) are usually not written.
      </p>
      <ol class="nodes">
        <StarNode v-for="(g, i) in LETTER_GROUPS" :key="i" :state="state(i)" :number="faNum(i + 1)" :label="`Letters ${g.title}`" @go="router.push({ name: 'lesson', query: { alpha: String(i) } })">
          <span class="fa keep" lang="fa">{{ g.title }}</span>
        </StarNode>
      </ol>
    </section>

    <ul class="grid" aria-label="All letters">
      <li v-for="l in LETTERS" :key="l.fa">
        <button type="button" class="card letter" :aria-label="`${l.name}, sounds ${l.sound}, as in ${l.example.tr}, ${l.example.en}`" @click="speak(l.example.fa)">
          <span class="big fa keep" lang="fa">{{ l.fa }}</span>
          <span class="name">{{ l.name }} <span class="muted">· {{ l.sound }}</span></span>
          <span class="forms" aria-hidden="true">
            <span v-for="f in letterForms(l)" :key="f.label" class="form"><span class="fa keep" lang="fa">{{ f.text }}</span><small>{{ f.label }}</small></span>
          </span>
          <span class="example"><span class="fa keep" lang="fa">{{ l.example.fa }}</span> <span class="muted small">{{ l.example.tr }}, {{ l.example.en }}</span></span>
          <span v-if="l.persian" class="chip saffron flag">Persian only</span>
        </button>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.head { display: flex; flex-direction: column; gap: 10px }
.head h1 { font-size: 1.7rem; font-weight: 800 }
.head .fa { font-size: 1.15em; color: var(--ink) }
.nodes { list-style: none; margin: 8px 0 0; padding: 0; display: flex; justify-content: space-between; gap: 4px }
.nodes :deep(.label) .fa { font-size: 0.95rem }
.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px }
.letter { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; text-align: center; padding: 12px 10px; font: inherit; color: var(--ink) }
.letter:hover { border-color: var(--muted) }
.big { font-size: 2.6rem; font-weight: 700; line-height: 1.4; color: var(--accent) }
.name { font-weight: 600; font-size: 0.9rem }
.forms { display: flex; gap: 8px; direction: rtl; flex-wrap: wrap; justify-content: center }
.form { display: flex; flex-direction: column; align-items: center; direction: ltr }
.form .fa { font-size: 1.3rem; line-height: 1.5 }
.form small { font-size: 0.62rem; color: var(--muted) }
.example .fa { font-size: 1.1rem }
.flag { position: absolute; top: 8px; right: 8px; font-size: 0.58rem; padding: 2px 6px }
</style>
