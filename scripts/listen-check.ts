// Listen back to the recorded clips: Azure speech-to-text writes down what it hears in each clip, and
// clips where it hears different words from the text are flagged for a native speaker to check (on the
// app's review page). It cannot hear a wrong short vowel (written Persian has none), but it does catch a
// clip that says another word, swallows or adds a word, or reads a letter wrongly.
//
//   node scripts/listen-check.ts                 check the course clips not checked yet (or re-recorded since)
//   node scripts/listen-check.ts --dictionary    the dictionary clips too
//   node scripts/listen-check.ts --limit 200     stop after 200 clips (the free tier has 5 audio hours a month)
//   node scripts/listen-check.ts --report        only rebuild the report from what was already heard
//
// Writes tools/listen/heard.json (what was heard, per clip and recording, so nothing is sent twice) and
// public/review/stt-flags.json (the flagged clips, worst first). Needs AZURE_SPEECH_KEY / AZURE_SPEECH_REGION.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { allSpeech } from '../src/content/speech.ts'
import { SPOKEN } from '../src/content/spoken/index.ts'
import { stripVowels } from '../src/lib/vocalize.ts'

const OUT = 'public/audio'
const MANIFEST = 'src/content/audio-manifest.json'
const HEARD = 'tools/listen/heard.json'
const FLAGS = 'public/review/stt-flags.json'
const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined }
const limit = Number(arg('--limit') ?? Infinity)
const withDictionary = process.argv.includes('--dictionary')
const reportOnly = process.argv.includes('--report')

function env(name: string): string | undefined {
  if (process.env[name]) return process.env[name]
  if (!existsSync('.env.local')) return undefined
  const line = readFileSync('.env.local', 'utf8').replace(/^﻿/, '').split(/\r?\n/).find((l) => l.startsWith(name + '='))
  return line?.slice(name.length + 1).trim()
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const manifest: Record<string, string> = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
/** key → { rec: the manifest fingerprint of the recording that was heard, heard: the transcript } */
const heard: Record<string, { rec: string; heard: string }> = existsSync(HEARD) ? JSON.parse(readFileSync(HEARD, 'utf8')) : {}
function save() {
  mkdirSync('tools/listen', { recursive: true })
  const lines = Object.keys(heard).sort().map((k) => `${JSON.stringify(k)}:${JSON.stringify(heard[k])}`)
  writeFileSync(HEARD, `{\n${lines.join(',\n')}\n}\n`)
}

// One entry per clip. Only phrases and sentences: on a single word heard alone the recogniser guesses
// (it often answers in Latin letters, or with a similar word), so it would flag good clips.
const items = [...new Map(allSpeech().map((i) => [i.key, i])).values()]
  .filter((i) => i.text.trim().includes(' ') && existsSync(`${OUT}/${i.key}.mp3`))
  .filter((i) => withDictionary || !i.where.startsWith('Dictionary'))

/**
 * The consonant skeleton of a text, for comparing what was said with what was heard. The recogniser writes
 * what it hears in written Persian and its own spelling: نداره comes back as ندارد, رو as را, سردمه as سردم است,
 * and words are spaced its own way. So marks, the long-vowel letters (ا و ی ه), a final د, and the little words
 * را / رو / است are left out on both sides; what is left still shows a missing, extra or different word.
 */
const LITTLE = new Set(['را', 'رو', 'است', 'هست', 'و'])
function skeleton(s: string): string {
  return stripVowels(s.normalize('NFC'))
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه')
    .split(/[\s‌.,!?؟،؛:«»"()\-]+/).filter((w) => w && !LITTLE.has(w))
    .map((w) => (w.length > 2 ? w.replace(/د$/, '') : w))
    .join('')
    .replace(/[اویهعءئؤ]/g, '')
    .replace(/[^ء-يپچژکگی]/g, '')
}
function distance(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]
    d[0] = i
    for (let j = 1; j <= b.length; j++) {
      const t = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = t
    }
  }
  return d[b.length]
}
/** 0 = heard exactly the text (or its spoken form), 1 = nothing in common. */
function score(text: string, transcript: string): number {
  const h = skeleton(transcript)
  const targets = [text, SPOKEN[text]].filter(Boolean).map((t) => skeleton(t!))
  return Math.min(...targets.map((t) => (t.length ? distance(t, h) / Math.max(t.length, h.length) : 0)))
}

/**
 * Short-audio recognition (WAV, so ffmpeg converts the clip first) writes Persian reliably; the newer fast
 * transcription takes the mp3 as it is but on short clips sometimes switches to Latin letters, so it is only
 * the fallback when the first one hears nothing.
 */
async function shortAudio(key: string, region: string, file: string): Promise<string> {
  const wav = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-ar', '16000', '-ac', '1', '-f', 'wav', '-'], { maxBuffer: 64 << 20 })
  const res = await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=fa-IR`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000' },
    body: wav,
  })
  if (res.status === 429 || res.status >= 500) throw Object.assign(new Error(`STT ${res.status}`), { retry: true })
  if (!res.ok) throw new Error(`Azure STT ${res.status}: ${await res.text().catch(() => '')}`)
  const j = await res.json() as { DisplayText?: string }
  return j.DisplayText ?? ''
}
async function fastTranscription(key: string, region: string, file: string): Promise<string> {
  const form = new FormData()
  form.append('audio', new Blob([readFileSync(file)], { type: 'audio/mpeg' }), 'clip.mp3')
  form.append('definition', JSON.stringify({ locales: ['fa-IR'] }))
  const res = await fetch(`https://${region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15`, {
    method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key }, body: form,
  })
  if (res.status === 429 || res.status >= 500) throw Object.assign(new Error(`STT ${res.status}`), { retry: true })
  if (!res.ok) throw new Error(`Azure STT ${res.status}: ${await res.text().catch(() => '')}`)
  const j = await res.json() as { combinedPhrases?: { text: string }[] }
  return (j.combinedPhrases ?? []).map((x) => x.text).join(' ')
}
async function transcribe(key: string, region: string, file: string): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      const a = await shortAudio(key, region, file)
      if (a.trim()) return a
      await sleep(500)
      return await fastTranscription(key, region, file)
    } catch (err) {
      if (attempt >= 8) throw err
      await sleep(5000 * attempt)
    }
  }
}

if (!reportOnly) {
  const todo = items.filter((i) => heard[i.key]?.rec !== manifest[i.key]).slice(0, limit)
  console.log(`${items.length} clips, ${todo.length} to listen to`)
  const key = env('AZURE_SPEECH_KEY')
  const region = env('AZURE_SPEECH_REGION')
  if (todo.length && (!key || !region)) throw new Error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (environment or .env.local).')
  let n = 0
  for (const i of todo) {
    heard[i.key] = { rec: manifest[i.key] ?? '', heard: await transcribe(key!, region!, `${OUT}/${i.key}.mp3`) }
    if (++n % 50 === 0) { save(); console.log(`  ${n}/${todo.length}`) }
    await sleep(1000)
  }
  save()
}

// Digits: the recogniser writes numbers as figures (دو → ۲), which cannot be compared letter by letter.
const DIGITS = /[0-9۰-۹٠-٩]/
const checked = items.filter((i) => heard[i.key] && heard[i.key].rec === manifest[i.key])
const flags = checked
  .filter((i) => !DIGITS.test(heard[i.key].heard))
  .map((i) => ({ key: i.key, fa: i.text, tr: i.tr ?? '', voice: i.voice, where: i.where, heard: heard[i.key].heard, score: Math.round(score(i.text, heard[i.key].heard) * 100) / 100 }))
  // A single wrong letter in a long sentence is usually the recogniser, not the voice; in a word it matters.
  .filter((f) => f.score >= 0.25)
  .sort((a, b) => b.score - a.score)
mkdirSync('public/review', { recursive: true })
writeFileSync(FLAGS, JSON.stringify({ generated: new Date().toISOString(), checked: checked.length, flags }, null, 1) + '\n')
console.log(`${checked.length} clips checked, ${flags.length} flagged → ${FLAGS}`)
