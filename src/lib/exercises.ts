import type { DialogueLine, Level, Phrase, Sentence, Unit, Word } from '@/content/types.ts'
import { ALL_UNITS, ALL_WORDS, LEVELS, type LessonKind, type WordRef, wordsFor } from '@/content/course.ts'
import { LETTERS, LETTER_GROUPS, letterByFa, letterForms, type Letter } from '@/content/alphabet.ts'
import { stripPunct } from '@/content/validate.ts'
import { acceptedForms, gradeTyped } from './grade.ts'
import { chance, pick, pickOne, shuffle } from './random.ts'
import { t } from '@/i18n/index.ts'
import { dialogueVoices, type VoiceId } from '@/content/speakers.ts'

/** Something shown on screen: Persian with transliteration, English, or both. */
export interface Shown {
  fa?: string
  tr?: string
  en?: string
  /** Hide the transliteration (letters, where it would give the answer away). */
  hideTr?: boolean
  /** Dialogue lines: the speaker's voice (right gender). Everything else uses the narrator. */
  voice?: VoiceId
}

export interface Prompt extends Shown {
  digit?: string
  /** Persian text to read aloud; a listening prompt shows only the play buttons. */
  audio?: string
  listen?: boolean
  who?: string
  passage?: Phrase[]
}

export interface ChoiceEx {
  kind: 'choice'
  title: string
  prompt: Prompt
  options: Shown[]
  answer: number
  /** Options are Persian (laid out as cards). */
  faOptions: boolean
  /** Shown in the feedback bar after answering. */
  reveal?: Shown
  note?: string
  /** Spaced-review card this exercise updates. */
  srs?: string
  isNew?: boolean
}

export interface MatchEx {
  kind: 'match'
  title: string
  pairs: { fa: string; tr: string; en: string }[]
  hideTr?: boolean
}

export interface BuildTile {
  key: string
  fa?: string
  tr?: string
  en?: string
}

export interface BuildEx {
  kind: 'build'
  title: string
  to: 'en' | 'fa'
  sentence: Sentence
  tiles: BuildTile[]
  target: string[]
  note?: string
}

export interface TypeEx {
  kind: 'type'
  title: string
  prompt: Prompt
  accepted: string[]
  reveal: Shown
  note?: string
  srs?: string
}

export interface CardEx {
  kind: 'card'
  title: string
  html?: string
  examples?: Phrase[]
  passage?: Phrase[]
  dialogue?: DialogueLine[]
  /** The unit the dialogue belongs to, so each speaker gets their own voice. */
  unitId?: string
}

export type Ex = ChoiceEx | MatchEx | BuildEx | TypeEx | CardEx
export type Answer = number | number[] | string | 'done' | null

export interface Grade {
  ok: boolean
  note?: string
}

export function grade(ex: Ex, answer: Answer): Grade {
  switch (ex.kind) {
    case 'choice':
      return { ok: answer === ex.answer }
    case 'match':
    case 'card':
      return { ok: true }
    case 'type': {
      const r = gradeTyped(typeof answer === 'string' ? answer : '', ex.accepted)
      return r.typo ? { ok: true, note: t('Watch the spelling: “{w}”.', { w: r.typo }) } : { ok: r.ok }
    }
    case 'build': {
      const picked = Array.isArray(answer) ? answer.map((i) => ex.tiles[i]?.key ?? '') : []
      const norm = (xs: string[]) => xs.join(' ').toLowerCase()
      return { ok: norm(picked) === norm(ex.target) }
    }
  }
}

/* ---------- Option helpers ---------- */

const uniqBy = <T>(items: T[], key: (t: T) => string) => {
  const seen = new Set<string>()
  return items.filter((t) => {
    const k = key(t)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** Four options with distinct Persian and English: the item plus three from the pool (topped up from the whole course). */
export function optionsFor<T extends Phrase>(item: T, pool: readonly T[], fallback: readonly Phrase[] = ALL_WORDS.map((w) => w.word)): Phrase[] {
  const out: Phrase[] = [item]
  for (const cand of [...shuffle(pool), ...shuffle(fallback)]) {
    if (out.length >= 4) break
    if (!out.some((o) => o.en === cand.en || o.fa === cand.fa)) out.push(cand)
  }
  return shuffle(out)
}

const show = (p: Phrase): Shown => ({ fa: p.fa, tr: p.tr, en: p.en })
const srsKey = (u: Unit, w: Word) => `${u.id}:${w.fa}`

/* ---------- Word exercises ---------- */

export function faToEn(w: Word, pool: readonly Word[], opts: { srs?: string; isNew?: boolean } = {}): ChoiceEx {
  const options = optionsFor(w, pool)
  return {
    kind: 'choice', title: t('What does this mean?'), prompt: { fa: w.fa, tr: w.tr, audio: w.fa },
    options: options.map((o) => ({ en: o.en })), answer: options.indexOf(w), faOptions: false,
    reveal: show(w), note: w.note, ...opts,
  }
}

export function enToFa(w: Word, pool: readonly Word[], opts: { srs?: string } = {}): ChoiceEx {
  const options = optionsFor(w, pool)
  return {
    kind: 'choice', title: t('Which one means “{w}”?', { w: w.en }), prompt: {},
    options: options.map((o) => ({ fa: o.fa, tr: o.tr })), answer: options.indexOf(w), faOptions: true,
    reveal: show(w), note: w.note, ...opts,
  }
}

export function listenEx(w: Word, pool: readonly Word[], opts: { srs?: string } = {}): ChoiceEx {
  const options = optionsFor(w, pool)
  return {
    kind: 'choice', title: t('Listen, then pick the meaning'), prompt: { audio: w.fa, listen: true },
    options: options.map((o) => ({ en: o.en })), answer: options.indexOf(w), faOptions: false,
    reveal: show(w), ...opts,
  }
}

export function digitEx(w: Word, pool: readonly Word[]): ChoiceEx {
  const numbers = pool.filter((p) => p.digit)
  const options = optionsFor(w, numbers.length >= 4 ? numbers : pool)
  return {
    kind: 'choice', title: t('Which number is this?'), prompt: { digit: w.digit },
    options: options.map((o) => ({ en: o.en })), answer: options.indexOf(w), faOptions: false, reveal: show(w),
  }
}

export function typeEx(w: Word, opts: { srs?: string } = {}): TypeEx {
  return {
    kind: 'type', title: t('Write this in English'), prompt: { fa: w.fa, tr: w.tr, audio: w.fa },
    accepted: acceptedForms(w.en, w.alt), reveal: show(w), note: w.note, ...opts,
  }
}

export function matchEx(items: readonly Phrase[], opts: { hideTr?: boolean } = {}): MatchEx {
  const pairs = uniqBy(uniqBy(shuffle(items), (p) => p.fa), (p) => p.en).slice(0, 5)
  return { kind: 'match', title: t('Tap the matching pairs'), pairs: pairs.map(show) as MatchEx['pairs'], ...opts }
}

/* ---------- Sentence exercises ---------- */

// Words of a meaning sentence (English, Italian or Persian; ZWNJ keeps Persian words like می‌خواهم whole).
const enWords = (en: string) => en.replace(/[^\p{L}\p{M}\p{N}‌'’ -]/gu, ' ').split(/\s+/).filter(Boolean)

export function buildToEn(s: Sentence, pool: readonly Phrase[]): BuildEx {
  const target = enWords(s.en)
  const inTarget = new Set(target.map((w) => w.toLowerCase()))
  const extras = uniqBy(
    shuffle(pool.flatMap((p) => enWords(p.en))).filter((w) => !inTarget.has(w.toLowerCase()) && /^[\p{L}\p{M}‌'’]+$/u.test(w)),
    (w) => w.toLowerCase(),
  ).slice(0, Math.min(4, Math.max(2, Math.ceil(target.length / 2))))
  return {
    kind: 'build', title: t('Translate this sentence'), to: 'en', sentence: s,
    tiles: shuffle([...target, ...extras].map((w) => ({ key: w, en: w }))), target, note: s.note,
  }
}

export function buildToFa(s: Sentence, pool: readonly Word[]): BuildEx {
  const real = s.tiles.map((fa, i) => ({ key: fa, fa, tr: s.trTiles[i] }))
  const extras = shuffle(pool.filter((w) => !s.tiles.includes(w.fa) && !w.fa.includes(' ')))
    .slice(0, Math.min(3, Math.max(2, Math.ceil(s.tiles.length / 2))))
    .map((w) => ({ key: w.fa, fa: w.fa, tr: w.tr }))
  return {
    kind: 'build', title: t('Write this in Persian'), to: 'fa', sentence: s,
    tiles: shuffle([...real, ...extras]), target: s.tiles, note: s.note,
  }
}

export function sentenceMeaning(s: Phrase, pool: readonly Phrase[], title = t('What does this mean?')): ChoiceEx {
  const options = optionsFor(s, pool, pool)
  return {
    kind: 'choice', title, prompt: { fa: s.fa, tr: s.tr, audio: s.fa },
    options: options.map((o) => ({ en: o.en })), answer: options.indexOf(s), faOptions: false, reveal: show(s),
  }
}

/* ---------- Lessons ---------- */

export interface LessonOptions {
  hasVoice: boolean
  /** Spaced-review keys already seen, to flag new words. */
  seen?: (key: string) => boolean
}

export function unitLesson(u: Unit, kind: LessonKind, o: LessonOptions): Ex[] {
  switch (kind) {
    case 'words-1':
    case 'words-2':
      return wordsLesson(u, kind, o)
    case 'grammar':
      return grammarLesson(u)
    case 'sentences':
      return sentencesLesson(u, o)
    case 'dialogue':
      return dialogueLesson(u, o)
    case 'reading':
      return readingLesson(u)
  }
}

function wordsLesson(u: Unit, kind: LessonKind, o: LessonOptions): Ex[] {
  const words = wordsFor(u, kind)
  const pool = u.words
  const intro = words.map((w) => faToEn(w, pool, { srs: srsKey(u, w), isNew: o.seen ? !o.seen(srsKey(u, w)) : false }))
  const rest: Ex[] = [
    ...pick(words, 2).map((w) => enToFa(w, pool, { srs: srsKey(u, w) })),
    matchEx(words.length >= 4 ? words : pool),
    typeEx(pickOne(words), {}),
  ]
  const lw = pickOne(words)
  rest.push(o.hasVoice ? listenEx(lw, pool, { srs: srsKey(u, lw) }) : enToFa(lw, pool, { srs: srsKey(u, lw) }))
  const digits = words.filter((w) => w.digit)
  if (digits.length) pick(digits, 2).forEach((w) => rest.push(digitEx(w, pool)))
  return [...intro, ...shuffle(rest)]
}

function grammarLesson(u: Unit): Ex[] {
  const g = u.grammar
  const checks: ChoiceEx[] = g.checks.map((c) => ({
    kind: 'choice', title: c.q, prompt: {}, options: c.options.map((fa, i) => ({ fa, tr: c.optionsTr[i] })),
    answer: c.answer, faOptions: true, note: c.why,
  }))
  const pool: Phrase[] = [...g.examples, ...u.sentences]
  const examples = g.examples.map((e) => sentenceMeaning(e, pool))
  return [{ kind: 'card', title: g.title, html: g.body, examples: g.examples }, ...shuffle([...checks, ...examples])]
}

function sentencesLesson(u: Unit, o: LessonOptions): Ex[] {
  const ex: Ex[] = []
  u.sentences.forEach((s, i) => ex.push(i % 2 === 0 ? buildToEn(s, u.sentences) : buildToFa(s, u.words)))
  pick(u.sentences, 3).forEach((s) => ex.push(chance(0.5) ? buildToFa(s, u.words) : buildToEn(s, u.sentences)))
  ex.push(matchEx(u.words))
  if (o.hasVoice) {
    const s = pickOne(u.sentences)
    const options = optionsFor(s, u.sentences, ALL_UNITS.flatMap((x) => x.sentences))
    ex.push({
      kind: 'choice', title: t('Listen, then pick the meaning'), prompt: { audio: s.fa, listen: true },
      options: options.map((x) => ({ en: x.en })), answer: options.indexOf(s), faOptions: false, reveal: show(s),
    })
  }
  return shuffle(ex)
}

function dialogueLesson(u: Unit, o: LessonOptions): Ex[] {
  const d = u.dialogue ?? []
  const voices = dialogueVoices(u)
  const voiceOf = (line: DialogueLine) => voices.get(line.who)
  const ex: Ex[] = [{ kind: 'card', title: t('Read the conversation'), dialogue: d, unitId: u.id }]
  const lines: Phrase[] = d
  pick(d, Math.min(4, d.length)).forEach((line) => {
    const e = sentenceMeaning(line, lines, t('What does {who} say?', { who: line.who }))
    e.prompt.who = line.who
    e.prompt.voice = voiceOf(line)
    if (e.reveal) e.reveal.voice = voiceOf(line)
    ex.push(e)
  })
  const replies = d.slice(0, -1).map((line, i) => ({ line, next: d[i + 1] }))
  pick(replies, Math.min(3, replies.length)).forEach(({ line, next }) => {
    const options = optionsFor(next, lines, lines)
    ex.push({
      kind: 'choice', title: t('What does {who} answer?', { who: next.who }), prompt: { fa: line.fa, tr: line.tr, en: line.en, who: line.who, audio: line.fa, voice: voiceOf(line) },
      // Every option is read in the voice of the person who would answer.
      options: options.map((x) => ({ fa: x.fa, tr: x.tr, voice: voiceOf(next) })), answer: options.indexOf(next), faOptions: true, reveal: { ...show(next), voice: voiceOf(next) },
    })
  })
  if (o.hasVoice && d.length) {
    const line = pickOne(d)
    const options = optionsFor(line, lines, lines)
    ex.push({
      kind: 'choice', title: t('Listen, then pick the meaning'), prompt: { audio: line.fa, listen: true, voice: voiceOf(line) },
      options: options.map((x) => ({ en: x.en })), answer: options.indexOf(line), faOptions: false, reveal: { ...show(line), voice: voiceOf(line) },
    })
  }
  return ex
}

function readingLesson(u: Unit): Ex[] {
  const r = u.reading
  if (!r) return []
  const ex: Ex[] = [{ kind: 'card', title: r.title, passage: r.paragraphs }]
  r.questions.forEach((q) => ex.push({
    kind: 'choice', title: q.q, prompt: { passage: r.paragraphs }, options: q.options.map((en) => ({ en })),
    answer: q.answer, faOptions: false,
  }))
  ex.push(matchEx(u.words))
  return ex
}

/* ---------- Review, practice and level tests ---------- */

/** A review round over the given words (due cards first, chosen by the caller). */
export function reviewLesson(refs: WordRef[], o: LessonOptions): Ex[] {
  if (!refs.length) return []
  const pool = refs.map((r) => r.word)
  const ex: Ex[] = refs.map((r, i) => {
    const w = r.word
    const others = r.unit.words.length >= 4 ? r.unit.words : pool
    const kind = i % 4
    if (kind === 0) return faToEn(w, others, { srs: r.key })
    if (kind === 1) return enToFa(w, others, { srs: r.key })
    if (kind === 2) return o.hasVoice ? listenEx(w, others, { srs: r.key }) : typeEx(w, { srs: r.key })
    return typeEx(w, { srs: r.key })
  })
  if (refs.length >= 4) ex.push(matchEx(pool))
  return shuffle(ex)
}

/** A level test: words, grammar and sentences from every unit of the level. No retries. */
export function levelTest(level: Level): Ex[] {
  const info = LEVELS.find((l) => l.level === level)
  if (!info) return []
  const ex: Ex[] = []
  for (const u of info.units) {
    const w1 = pick(u.words, 2)
    ex.push(faToEn(w1[0], u.words), enToFa(w1[1], u.words))
    const c = pickOne(u.grammar.checks)
    ex.push({ kind: 'choice', title: c.q, prompt: {}, options: c.options.map((fa, i) => ({ fa, tr: c.optionsTr[i] })), answer: c.answer, faOptions: true, note: c.why })
    const s = pickOne(u.sentences)
    ex.push(chance(0.5) ? buildToEn(s, u.sentences) : buildToFa(s, u.words))
  }
  return shuffle(ex).slice(0, 20)
}

export const TEST_PASS = 0.8

/* ---------- Alphabet ---------- */

const letterShown = (l: Letter): Shown => ({ fa: l.fa, tr: l.name, en: l.sound })

export function alphabetLesson(groupIndex: number): Ex[] {
  const group = LETTER_GROUPS[groupIndex]
  if (!group) return []
  const letters = group.letters.map((f) => letterByFa.get(f)!)
  const soundPool = uniqBy(shuffle(LETTERS), (l) => l.sound)
  const soundOptions = (l: Letter) => {
    const out = [l, ...shuffle(letters), ...soundPool].filter((x, i, a) => a.findIndex((y) => y.sound === x.sound) === i).slice(0, 4)
    return shuffle(out)
  }
  const ex: Ex[] = [{
    kind: 'card', title: t('Letters {letters}', { letters: group.title }),
    html: t('Tap a letter to hear its example word. Each letter changes shape depending on where it sits in a word. Persian is read from right to left.'),
    examples: letters.map((l) => ({ fa: `${l.fa}  ·  ${l.example.fa}`, tr: `${l.name} (${l.sound}) · ${l.example.tr}`, en: l.example.en })),
  }]
  letters.forEach((l) => {
    const opts = soundOptions(l)
    ex.push({
      kind: 'choice', title: t('What sound does this letter make?'), prompt: { fa: l.fa, hideTr: true },
      options: opts.map((o) => ({ en: o.sound })), answer: opts.indexOf(l), faOptions: false, reveal: letterShown(l),
      note: sameSoundNote(l),
    })
  })
  pick(letters, 3).forEach((l) => {
    const opts = soundOptions(l)
    ex.push({
      kind: 'choice', title: t('Which letter makes the sound “{s}”?', { s: l.sound }), prompt: {},
      options: opts.map((o) => ({ fa: o.fa, hideTr: true })), answer: opts.indexOf(l), faOptions: true, reveal: letterShown(l),
    })
  })
  pick(letters.filter((l) => !l.nonJoining), 2).forEach((l) => {
    const form = pickOne(letterForms(l).slice(1))
    const opts = shuffle([l, ...pick(LETTERS.filter((x) => x.fa !== l.fa), 3)])
    ex.push({
      kind: 'choice', title: t('This is a letter in its “{shape}” shape. Which letter is it?', { shape: t(form.label) }), prompt: { fa: form.text, hideTr: true },
      options: opts.map((o) => ({ fa: o.fa, hideTr: true })), answer: opts.indexOf(l), faOptions: true, reveal: letterShown(l),
    })
  })
  const words = letters.map((l) => l.example)
  words.slice(0, 3).forEach((w) => {
    const opts = optionsFor(w, words, LETTERS.map((l) => l.example))
    ex.push({
      kind: 'choice', title: t('How do you read this word?'), prompt: { fa: w.fa, hideTr: true, audio: w.fa },
      options: opts.map((o) => ({ en: `${o.tr} (${o.en})` })), answer: opts.indexOf(w), faOptions: false, reveal: show(w),
    })
  })
  ex.push(matchEx(letters.map((l) => ({ fa: l.fa, tr: l.name, en: l.sound })), { hideTr: true }))
  const [card, ...restEx] = ex
  return [card, ...shuffle(restEx)]
}

function sameSoundNote(l: Letter): string | undefined {
  const same = LETTERS.filter((x) => x.sound === l.sound && x.fa !== l.fa)
  if (!same.length) return undefined
  return t('{letters} all sound “{s}”. You learn which one a word uses by reading it.', { letters: [l, ...same].map((x) => x.fa).join(' '), s: l.sound })
}

/* ---------- Misc ---------- */

/** The Persian sentence without punctuation, as the tiles spell it. */
export const tilesText = (s: Sentence) => stripPunct(s.fa)
