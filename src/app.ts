/**
 * One codebase, two apps. VITE_APP (or APP in Node scripts) picks which one this build is:
 * - persianmeow: Persian for English (and Italian) speakers
 * - begociao:    Italian for Persian speakers (بگو چائو)
 * Everything that differs between them lives here.
 */
export type AppId = 'persianmeow' | 'begociao'

// In the app and tests, Vite replaces __APP_ID__ with the build's app id (vite.config.ts `define`);
// Node scripts, where it does not exist, use the APP environment variable instead.
declare const __APP_ID__: string | undefined
const nodeEnv = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env
const chosen = typeof __APP_ID__ !== 'undefined' ? __APP_ID__ : nodeEnv?.APP
export const APP_ID: AppId = chosen === 'begociao' ? 'begociao' : 'persianmeow'

export interface AppProfile {
  id: AppId
  /** Brand split in two for the two-colour wordmark. */
  name: [string, string]
  fullName: string
  /** Small Persian word next to the logo. */
  brandFa: string
  /** Language being learned, and how its text runs. */
  target: 'fa' | 'it'
  targetDir: 'rtl' | 'ltr'
  /** Language of meanings and of the interface. */
  uiDir: 'rtl' | 'ltr'
  /** Prefix for everything saved in the browser, so the two apps never share progress. */
  storage: string
  /** Text-to-speech fallback language when a clip is missing. */
  ttsLang: string
  /** Has a script/alphabet section (the Persian alphabet). */
  alphabet: boolean
  webUrl: string
  /** Pishi's lines: text in the target language, pronunciation, and meaning key for t(). */
  pishi: {
    hello: { fa: string; tr: string }
    cheer: { fa: string; tr: string }
    review: { fa: string; tr: string }
    missed: { fa: string; tr: string }
    go: { fa: string; tr: string }
    oops: { fa: string; tr: string }
    noProblem: { fa: string; tr: string }
    notFound: { fa: string; tr: string }
  }
}

const PROFILES: Record<AppId, AppProfile> = {
  persianmeow: {
    id: 'persianmeow',
    name: ['Persian', 'Meow'],
    fullName: 'PersianMeow',
    brandFa: 'میو',
    target: 'fa',
    targetDir: 'rtl',
    uiDir: 'ltr',
    storage: 'bale-farsi', // first name of the app; kept so saved progress is never lost
    ttsLang: 'fa-IR',
    alphabet: true,
    webUrl: 'https://shgabnaz1377.github.io/persianmeow/',
    pishi: {
      hello: { fa: 'سلام! من پیشی‌ام', tr: 'salâm! man Pishi-am.' },
      cheer: { fa: 'آفرین!', tr: 'âfarin!' },
      review: { fa: 'مرور کنیم؟', tr: 'morur konim?' },
      missed: { fa: 'دلم تنگ شد!', tr: 'delam tang shod!' },
      go: { fa: 'بزن بریم!', tr: 'bezan berim!' },
      oops: { fa: 'ای وای!', tr: 'ey vây!' },
      noProblem: { fa: 'اشکالی ندارد', tr: 'eshkâli nadârad' },
      notFound: { fa: 'پیدا نشد', tr: 'peydâ nashod' },
    },
  },
  begociao: {
    id: 'begociao',
    name: ['Bego', 'Ciao'],
    fullName: 'Bego Ciao',
    brandFa: 'بگو چائو',
    target: 'it',
    targetDir: 'ltr',
    uiDir: 'rtl',
    storage: 'bego-ciao',
    ttsLang: 'it-IT',
    alphabet: false,
    webUrl: 'https://shgabnaz1377.github.io/persianmeow/begociao/',
    pishi: {
      hello: { fa: 'Ciao! Sono Pishi.', tr: 'چائو! سُنو پیشی.' },
      cheer: { fa: 'Bravo!', tr: 'براوو!' },
      review: { fa: 'Ripassiamo?', tr: 'ریپاسیامو؟' },
      missed: { fa: 'Mi sei mancato!', tr: 'می سِی مانکاتو!' },
      go: { fa: 'Andiamo!', tr: 'آندیامو!' },
      oops: { fa: 'Oh no!', tr: 'اُ نُ!' },
      noProblem: { fa: 'Non fa niente', tr: 'نُن فا نیِنته' },
      notFound: { fa: 'Non trovato', tr: 'نُن تروواتو' },
    },
  },
}

export const APP = PROFILES[APP_ID]
