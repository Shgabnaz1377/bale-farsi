import { ref } from 'vue'

const synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

/** The Persian voice in use, if the browser or system has one. */
export const faVoice = ref<SpeechSynthesisVoice | null>(null)

function loadVoices() {
  try {
    const voices = synth?.getVoices() ?? []
    faVoice.value =
      voices.find((v) => /^fa[-_]IR/i.test(v.lang) && /natural|online/i.test(v.name)) ??
      voices.find((v) => /^fa([-_]|$)/i.test(v.lang)) ??
      null
  } catch {
    faVoice.value = null
  }
}

if (synth) {
  loadVoices()
  synth.addEventListener?.('voiceschanged', loadVoices)
}

export const hasVoice = () => !!faVoice.value

export function speak(text: string, slow = false) {
  const voice = faVoice.value
  if (!synth || !voice || !text) return
  try {
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    u.lang = voice.lang
    u.rate = slow ? 0.55 : 0.85
    synth.speak(u)
  } catch {
    /* speech is a nice-to-have */
  }
}

export const stopSpeech = () => {
  try {
    synth?.cancel()
  } catch {
    /* ignore */
  }
}
