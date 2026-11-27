import { ref } from 'vue'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import FA_INDEX from '@/content/audio-index.json'
import IT_INDEX from '@/courses/begociao/audio-index.json'
import { APP } from '@/app.ts'
import { audioKey } from './audioKey.ts'
import { clipKey } from '@/content/voices.ts'
import type { VoiceId } from '@/content/speakers.ts'
import { isNative } from './platform.ts'

/**
 * Persian pronunciation.
 * 1. Recorded clips (public/audio/<key>.mp3): every word, sentence, dialogue line and reading in the course.
 *    They play on every browser and phone, and inside the apps they are bundled, so they work offline.
 * 2. Fallback for anything without a clip: the browser's Persian voice (web) or the phone's speech engine (apps).
 */
const CLIPS = new Set<string>((APP.id === 'begociao' ? IT_INDEX : FA_INDEX) as string[])
/** Fallback voices must speak the language being learned (Persian or Italian). */
const VOICE_LANG = APP.ttsLang.split('-')[0]
const VOICE_RE = new RegExp(`^${VOICE_LANG}([-_]|$)`, 'i')
const clipUrl = (key: string) => `${import.meta.env.BASE_URL}audio/${key}.mp3`

/** The fallback voice in use, if any (shown in Settings). */
export const faVoice = ref<{ name: string } | null>(null)

const synth: SpeechSynthesis | null = !isNative && typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
let webVoice: SpeechSynthesisVoice | null = null

function loadWebVoices() {
  try {
    const voices = synth?.getVoices() ?? []
    webVoice =
      voices.find((v) => VOICE_RE.test(v.lang) && /natural|online/i.test(v.name)) ??
      voices.find((v) => VOICE_RE.test(v.lang)) ??
      null
  } catch {
    webVoice = null
  }
  faVoice.value = webVoice ? { name: webVoice.name } : null
}

async function loadNativeVoice() {
  try {
    const { languages } = await TextToSpeech.getSupportedLanguages()
    if (languages.some((l) => VOICE_RE.test(l))) faVoice.value = { name: APP.ttsLang }
  } catch {
    faVoice.value = null
  }
}

if (isNative) void loadNativeVoice()
else if (synth) {
  loadWebVoices()
  synth.addEventListener?.('voiceschanged', loadWebVoices)
}

/** Number of recorded clips in this build. */
export const clipCount = CLIPS.size
/** The clip for a text in a voice: the speaker's own recording, else the narrator's while it is being recorded. */
function clipFor(text: string, voice?: VoiceId): string | null {
  const own = clipKey(text, voice)
  if (CLIPS.has(own)) return own
  const narrator = audioKey(text)
  return CLIPS.has(narrator) ? narrator : null
}
export const hasClip = (text: string, voice?: VoiceId) => clipFor(text, voice) !== null
/** Can this exact text be read aloud? */
export const canSpeak = (text: string, voice?: VoiceId) => !!text && (hasClip(text, voice) || !!faVoice.value)
/** Can the app read Persian aloud at all (used to include listening exercises)? */
export const hasVoice = () => CLIPS.size > 0 || !!faVoice.value

let current: HTMLAudioElement | null = null

function playClip(key: string, slow: boolean): Promise<void> {
  return new Promise((resolve) => {
    try {
      current?.pause()
      const a = new Audio(clipUrl(key))
      current = a
      a.playbackRate = slow ? 0.7 : 1
      a.preservesPitch = true
      a.onended = () => resolve()
      a.onerror = () => resolve()
      a.play().catch(() => resolve())
    } catch {
      resolve()
    }
  })
}

/** Speak Persian text. Resolves when it finishes (or straight away if nothing can say it). */
/** Speak text: in a dialogue speaker's voice when given, otherwise the narrator's. */
export function speak(text: string, slow = false, voice?: VoiceId): Promise<void> {
  if (!text) return Promise.resolve()
  const key = clipFor(text, voice)
  if (key) {
    stopSpeech()
    return playClip(key, slow)
  }
  if (!faVoice.value) return Promise.resolve()
  if (isNative) {
    return TextToSpeech.stop()
      .catch(() => undefined)
      .then(() => TextToSpeech.speak({ text, lang: APP.ttsLang, rate: slow ? 0.6 : 0.9, category: 'playback' }))
      .catch(() => undefined)
  }
  return new Promise((resolve) => {
    try {
      synth!.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.voice = webVoice
      u.lang = webVoice!.lang
      u.rate = slow ? 0.55 : 0.85
      u.onend = () => resolve()
      u.onerror = () => resolve()
      synth!.speak(u)
    } catch {
      resolve()
    }
  })
}

export function stopSpeech() {
  try {
    current?.pause()
    current = null
    if (isNative) void TextToSpeech.stop()
    else synth?.cancel()
  } catch {
    /* ignore */
  }
}
