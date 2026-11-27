import { ref } from 'vue'
import { IT } from './it.ts'
import { FA_BEGO } from './fa-bego.ts'
import { APP_ID } from '@/app.ts'

/** Languages a learner can use the app in (the language of meanings, explanations and buttons). */
export type Lang = 'en' | 'it' | 'fa'
/** Interface languages offered by this app (Bego Ciao is in Persian only). */
export const LANGS: { code: Lang; name: string }[] = APP_ID === 'begociao'
  ? [{ code: 'fa', name: 'فارسی' }]
  : [{ code: 'en', name: 'English' }, { code: 'it', name: 'Italiano' }]

/** Reactive, so every template using t() re-renders when the learner switches language. */
const current = ref<Lang>(APP_ID === 'begociao' ? 'fa' : 'en')
export const setLang = (l: Lang) => { current.value = l }
export const lang = () => current.value

/**
 * Translate an English UI string. The English text is the key, so templates stay readable:
 * t('Daily goal') → 'Obiettivo giornaliero'. {name} placeholders are filled from params.
 * tests/i18n.test.ts fails if any t('…') in the code has no Italian entry.
 */
export function t(en: string, params?: Record<string, string | number>): string {
  const s = current.value === 'it' ? IT[en] ?? en : current.value === 'fa' ? FA_BEGO[en] ?? en : en
  return params ? s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)) : s
}

/** Plural helper: tn(n, '{n} word', '{n} words'). */
export const tn = (n: number, one: string, many: string) => t(n === 1 ? one : many, { n })

/** The browser's preferred language, for a learner's first visit. */
/**
 * The language a new visitor starts in: English, whatever the browser says (the owner's choice).
 * A link can ask for Italian with ?lang=it (for example from an Italian post); anyone can switch any time.
 */
export function detectLang(): Lang {
  if (APP_ID === 'begociao') return 'fa'
  try {
    return new URLSearchParams(location.search).get('lang') === 'it' ? 'it' : 'en'
  } catch {
    return 'en'
  }
}
