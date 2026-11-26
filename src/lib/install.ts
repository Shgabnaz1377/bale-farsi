import { ref } from 'vue'
import { isNative } from './platform.ts'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const standalone = () =>
  isNative ||
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/** Already running as an installed app (home-screen web app or the native app). */
export const installed = ref(standalone())
/** Chrome/Edge/Android: the browser offered an install prompt we can show on a button. */
export const canPrompt = ref(false)
/** iPhone/iPad Safari has no prompt: people use Share → Add to Home Screen. */
export const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

let deferred: BeforeInstallPromptEvent | null = null
if (!isNative) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    canPrompt.value = true
  })
  window.addEventListener('appinstalled', () => {
    installed.value = true
    canPrompt.value = false
  })
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  await deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  canPrompt.value = false
  if (outcome === 'accepted') installed.value = true
  return outcome === 'accepted'
}
