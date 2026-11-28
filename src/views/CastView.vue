<script setup lang="ts">
import { computed, ref } from 'vue'
import { CAST, avatarUrl, faceUrl, type CastMember, type Mood } from '@/content/cast.ts'
import { P } from '@/lib/store.ts'
import BottomSheet from '@/components/BottomSheet.vue'
import { t } from '@/i18n/index.ts'

/** Characters: everyone who speaks in the dialogues, with their name in Persian and their moods. */
const base = import.meta.env.BASE_URL

/** Who each character is, in a few words (the designer's notes, rewritten for learners). */
const ABOUT: Record<string, { en: string; it: string }> = {
  sara: { en: 'A young woman from Tehran.', it: 'Una giovane di Teheran.' },
  artemis: { en: 'A young woman with long wavy hair.', it: 'Una giovane con i capelli lunghi e mossi.' },
  hasti: { en: 'A trendy Tehrani: sunglasses, hoops, scarf pushed back.', it: 'Una teheranese alla moda: occhiali da sole, orecchini a cerchio, foulard all’indietro.' },
  aseman: { en: 'A metalhead with a purple streak.', it: 'Una metallara con una ciocca viola.' },
  khorshid: { en: 'Glamorous and elegant.', it: 'Glamour ed eleganza.' },
  roya: { en: 'From Gilan, in the green north by the Caspian Sea.', it: 'Del Gilan, nel nord verde sul Mar Caspio.' },
  saba: { en: 'From Mazandaran, in the north by the Caspian Sea.', it: 'Del Mazandaran, nel nord sul Mar Caspio.' },
  darya: { en: 'Kurdish, in traditional dress.', it: 'Curda, in abito tradizionale.' },
  sahel: { en: 'Azeri Turkish from Tabriz.', it: 'Turca azera di Tabriz.' },
  fara: { en: 'From the Persian Gulf coast (Bandari).', it: 'Della costa del Golfo Persico (bandari).' },
  venus: { en: 'An Italian learning Persian, like you.', it: 'Un’italiana che impara il persiano, come te.' },
  leila: { en: 'A mum, a host, a shopkeeper, a doctor: she plays many parts.', it: 'Mamma, padrona di casa, negoziante, dottoressa: fa tante parti.' },
  ziba: { en: 'Grandma.', it: 'La nonna.' },
  babak: { en: 'Dad.', it: 'Il papà.' },
  sasan: { en: 'A young man from Tehran.', it: 'Un giovane di Teheran.' },
  arash: { en: 'A young man with glasses.', it: 'Un giovane con gli occhiali.' },
  arshia: { en: 'A trendy Tehrani: fade haircut, hoodie, gold chain.', it: 'Un teheranese alla moda: sfumatura, felpa, catenina d’oro.' },
  dariush: { en: 'A metalhead in a leather jacket.', it: 'Un metallaro con il giubbotto di pelle.' },
  ali: { en: 'Kurdish, with a fringed head wrap.', it: 'Curdo, con il turbante a frange.' },
  kourosh: { en: 'Inspired by Cyrus the Great. He tells the history lessons.', it: 'Ispirato a Ciro il Grande. Racconta le lezioni di storia.' },
  aria: { en: 'A foreign learner and partner.', it: 'Uno straniero che impara, e partner.' },
}
const about = (c: CastMember) => {
  const a = ABOUT[c.id]
  return a ? (P.settings.lang === 'it' ? a.it : a.en) : ''
}

const MOODS: { mood: Mood; label: string }[] = [
  { mood: 'happy', label: 'Happy' },
  { mood: 'idle', label: 'Calm' },
  { mood: 'confused', label: 'Confused' },
  { mood: 'sad', label: 'Sad' },
  { mood: 'shock', label: 'Shocked' },
]

const women = CAST.filter((c) => c.gender === 'f')
const men = CAST.filter((c) => c.gender === 'm')

const sel = ref<CastMember>(CAST[0])
const mood = ref<Mood | 'wave'>('wave')
const open = ref(false)
function show(c: CastMember) {
  sel.value = c
  mood.value = 'wave'
  open.value = true
}
const big = computed(() => mood.value === 'wave'
  ? `${base}characters/${sel.value.id}_happy_wave.svg`
  : faceUrl(base, sel.value.id, mood.value))
</script>

<template>
  <main class="wrap page cast">
    <h1>{{ t('Characters') }}</h1>
    <p class="muted">{{ t('The people you meet in the dialogues. Tap one to say hello.') }}</p>

    <template v-for="group in [{ title: t('Women'), list: women }, { title: t('Men'), list: men }]" :key="group.title">
      <h2 class="eyebrow">{{ group.title }}</h2>
      <ul class="grid">
        <li v-for="c in group.list" :key="c.id">
          <button type="button" class="card who" @click="show(c)">
            <img :src="avatarUrl(base, c.id)" alt="" width="72" height="72" loading="lazy" />
            <b>{{ c.tr }}</b>
            <span class="fa keep" lang="fa">{{ c.fa }}</span>
          </button>
        </li>
      </ul>
    </template>

    <BottomSheet :open="open" labelledby="cast-title" @close="open = false">
      <div class="one">
        <img class="big" :src="big" alt="" width="220" height="220" />
        <h2 id="cast-title">{{ sel.tr }} · <span class="fa keep" lang="fa">{{ sel.fa }}</span></h2>
        <p>{{ about(sel) }}</p>
        <div class="moods" role="radiogroup" :aria-label="t('Moods')">
          <button type="button" class="chip-btn" role="radio" :aria-checked="mood === 'wave'" :class="{ on: mood === 'wave' }" @click="mood = 'wave'">{{ t('Hello') }}</button>
          <button
            v-for="m in MOODS" :key="m.mood" type="button" class="chip-btn" role="radio"
            :aria-checked="mood === m.mood" :class="{ on: mood === m.mood }" @click="mood = m.mood"
          >
            {{ t(m.label) }}
          </button>
        </div>
      </div>
    </BottomSheet>
  </main>
</template>

<style scoped>
.cast h1 { margin-bottom: 0.25rem; }
.cast h2.eyebrow { margin: 1.25rem 0 0.5rem; }
.grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 0.6rem; }
.who { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 0.2rem; padding: 0.7rem 0.4rem; cursor: pointer; font: inherit; color: inherit; }
.who img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; }
.who .fa { font-size: 0.95rem; opacity: 0.8; }
.one { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; }
.one .big { width: min(220px, 60vw); height: auto; }
.one h2 { margin: 0; }
.one p { margin: 0; }
.moods { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; margin-top: 0.25rem; }
</style>
