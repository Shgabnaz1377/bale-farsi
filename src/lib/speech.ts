import { ref } from 'vue'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { isNative } from './platform.ts'

/**
 * Persian text-to-speech.
 * Web: the browser's speech synthesis, if it has a Persian (fa) voice (Edge ships one).
 * Native apps: the phone's own speech engine through Capacitor, if it supports Persian.
 */
export const faVoice = ref<{ name: string } | null>(null)

const synth: SpeechSynthesis | null = !isNative && typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
let webVoice: SpeechSynthesisVoice | null = null

function loadWebVoices() {
  try {
    const voices = synth?.getVoices() ?? []
    webVoice =
      voices.find((v) => /^fa[-_]IR/i.test(v.lang) && /natural|online/i.test(v.name)) ??
      voices.find((v) => /^fa([-_]|$)/i.test(v.lang)) ??
      null
  } catch {
    webVoice = null
  }
  faVoice.value = webVoice ? { name: webVoice.name } : null
}

async function loadNativeVoice() {
  try {
    const { languages } = await TextToSpeech.getSupportedLanguages()
    if (languages.some((l) => /^fa([-_]|$)/i.test(l))) faVoice.value = { name: 'your phone’s Persian voice' }
  } catch {
    faVoice.value = null
  }
}

if (isNative) void loadNativeVoice()
else if (synth) {
  loadWebVoices()
  synth.addEventListener?.('voiceschanged', loadWebVoices)
}

export const hasVoice = () => !!faVoice.value

/** Speak Persian text. Resolves when it finishes (or straight away if there is no voice). */
export function speak(text: string, slow = false): Promise<void> {
  if (!text || !faVoice.value) return Promise.resolve()
  if (isNative) {
    return TextToSpeech.stop()
      .catch(() => undefined)
      .then(() => TextToSpeech.speak({ text, lang: 'fa-IR', rate: slow ? 0.6 : 0.9, category: 'playback' }))
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
    if (isNative) void TextToSpeech.stop()
    else synth?.cancel()
  } catch {
    /* ignore */
  }
}
