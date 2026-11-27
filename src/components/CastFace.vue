<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { castMember, faceUrl, avatarUrl } from '@/content/cast.ts'
import type { VoiceId } from '@/content/speakers.ts'
import { isSpeaking } from '@/lib/speech.ts'

/**
 * A cast member's face.
 * - kind 'avatar': the round picture next to a dialogue line.
 * - kind 'bust': the drawing that talks; while `text` is being said (in `voice`, when given) the mouth
 *   opens and closes about 7 times a second (idle ↔ _talk). With prefers-reduced-motion it stays still.
 * The drawings are static files in public/characters/ (see src/content/cast.ts).
 */
const props = withDefaults(defineProps<{
  name: string
  kind?: 'avatar' | 'bust'
  /** The line this face says: its mouth moves while that line plays. */
  text?: string
  voice?: VoiceId
  /** Force talking (e.g. for a line that is playing in a mode the face cannot see). */
  talking?: boolean
}>(), { kind: 'bust', text: undefined, voice: undefined, talking: false })

const c = computed(() => castMember(props.name))
const base = import.meta.env.BASE_URL

const reduced = ref(false)
let mq: MediaQueryList | null = null
const onMq = () => { reduced.value = !!mq?.matches }
if (typeof window !== 'undefined' && window.matchMedia) {
  mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  onMq()
  mq.addEventListener?.('change', onMq)
}

const speaking = computed(() => props.talking || (!!props.text && isSpeaking(props.text, props.voice)))
const open = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
function stopTimer() {
  if (timer) clearInterval(timer)
  timer = undefined
  open.value = false
}
watch([speaking, reduced, () => props.kind], ([s, r, k]) => {
  stopTimer()
  if (s && !r && k === 'bust') timer = setInterval(() => { open.value = !open.value }, 140)
}, { immediate: true })
onBeforeUnmount(() => {
  stopTimer()
  mq?.removeEventListener?.('change', onMq)
})
</script>

<template>
  <img
    v-if="c && kind === 'avatar'"
    class="cast-avatar"
    :class="{ speaking }"
    :src="avatarUrl(base, c.id)"
    :alt="c.name"
    loading="lazy"
    decoding="async"
    width="64"
    height="64"
  />
  <span v-else-if="c" class="cast-bust" :class="{ speaking }" role="img" :aria-label="c.name">
    <img :src="faceUrl(base, c.id)" alt="" loading="lazy" decoding="async" :class="{ off: open }" />
    <img :src="faceUrl(base, c.id, 'idle', true)" alt="" loading="lazy" decoding="async" class="talk" :class="{ off: !open }" />
  </span>
</template>

<style scoped>
.cast-avatar { display: block; width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: var(--sunk); flex: none; box-shadow: 0 0 0 2px var(--surface) }
.cast-avatar.speaking { box-shadow: 0 0 0 3px var(--saffron-bright) }
.cast-bust { position: relative; display: block; width: 100%; aspect-ratio: 400 / 540; flex: none }
.cast-bust img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain }
.cast-bust img.off { visibility: hidden }
</style>
