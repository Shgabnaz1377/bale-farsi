import { HOMOGRAPHS, type HomographForm } from '@/content/homographs.ts'
import type { Ex } from './exercises.ts'
import { pick, shuffle } from './random.ts'
import { lang, t } from '@/i18n/index.ts'

const meaning = (f: HomographForm) => (lang() === 'it' ? f.it : f.en)

/**
 * The homograph game (کرم: kerm worm, karam generosity, kerem cream): the same printed word, told apart
 * by its vowel marks or by context. Shows why printed Persian needs context and how Finglish helps.
 */
export function homographExercises(count = 4): Ex[] {
  const intro: Ex = {
    kind: 'card',
    title: t('One word, three words'),
    html: t('Printed Persian leaves out the short vowels, so <span class="fa">کرم</span> <i>(k-r-m)</i> can be <b>kerm</b> (worm), <b>karam</b> (generosity) or <b>kerem</b> (cream). Iranians know which from the sentence; the vowel marks and Finglish tell you straight away.'),
    examples: HOMOGRAPHS[0].forms.map((f) => ({ fa: f.fa, tr: f.tr, en: meaning(f) })),
  }
  const ex: Ex[] = []
  for (const h of pick(HOMOGRAPHS, Math.min(count, HOMOGRAPHS.length))) {
    const f = pick(h.forms, 1)[0]
    // Context decides: which reading does this sentence need?
    const opts = shuffle(h.forms.slice())
    ex.push({
      kind: 'choice',
      title: t('Which “{w}” is this sentence about?', { w: h.bare }),
      prompt: { fa: f.context.fa, tr: f.context.tr, en: lang() === 'it' ? f.context.it : f.context.en, audio: f.context.fa },
      options: opts.map((o) => ({ fa: o.fa, tr: `${o.tr} · ${meaning(o)}` })),
      answer: opts.indexOf(f),
      faOptions: true,
      reveal: { fa: f.fa, tr: f.tr, en: meaning(f) },
      note: t('Same letters, different vowel: only the mark tells them apart.'),
    })
  }
  // The marks decide: read the vowelled word.
  const all = HOMOGRAPHS[0].forms
  const target = pick(all, 1)[0]
  const meanings = shuffle(all.slice())
  ex.push({
    kind: 'choice',
    title: t('What does this word mean?'),
    prompt: { fa: target.fa, hideTr: true, audio: target.fa },
    options: meanings.map((o) => ({ en: meaning(o) })),
    answer: meanings.indexOf(target),
    faOptions: false,
    reveal: { fa: target.fa, tr: target.tr, en: meaning(target) },
  })
  return [intro, ...ex]
}
