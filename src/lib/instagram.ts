import { ref } from 'vue'
import { APP } from '@/app.ts'

/**
 * Visitors from PersianMeow's Instagram ("Comment MEOW for the free course link") land with
 * ?from=instagram, ?utm_source=instagram or #meow; they get a short welcome on the home page.
 */
const KEY = `${APP.storage}:instagram-welcome`

function detect(): boolean {
  try {
    const q = new URLSearchParams(location.search)
    const hit = q.get('from') === 'instagram' || /instagram|ig/i.test(q.get('utm_source') ?? '') || /(^|[#/])meow$/i.test(location.hash)
    if (hit) localStorage.setItem(KEY, 'show')
    return localStorage.getItem(KEY) === 'show'
  } catch {
    return false
  }
}

export const fromInstagram = ref(APP.id === 'persianmeow' && typeof location !== 'undefined' && detect())

export function dismissInstagram() {
  fromInstagram.value = false
  try { localStorage.setItem(KEY, 'hidden') } catch { /* storage blocked */ }
}
