import { computed, ref } from 'vue'
import { APP } from '@/app.ts'
import { P } from './store.ts'

/**
 * The first-visit welcome: a short full-screen intro shown once to a learner with no progress,
 * then the path. While it is open the app hides its top and tab bars (App.vue).
 */
const KEY = `${APP.storage}:welcome-seen`

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

const seen = ref(read())

/** No lesson finished and no level test passed yet. */
export const isFresh = () => Object.keys(P.done).length === 0 && !Object.keys(P.passed).length

export const welcomeOpen = computed(() => !seen.value && isFresh())

export function finishWelcome() {
  seen.value = true
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* storage blocked: the welcome shows again next visit */
  }
}
