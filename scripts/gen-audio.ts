// Generates public/audio/<key>.mp3 for every Persian text in the course with Azure's Persian neural voices,
// and writes src/content/audio-index.json (the keys that have audio).
//
//   node scripts/gen-audio.ts            generate what is missing
//   node scripts/gen-audio.ts --dry      only count what would be generated
//   node scripts/gen-audio.ts --list     print the texts that would be generated (with their voice)
//   node scripts/gen-audio.ts --compare  20 sample words with and without vowel marks, in audio-compare/, to listen to
//   node scripts/gen-audio.ts --redo     regenerate every clip (after a pronunciation fix). This also replaces
//                                        clips a person recorded, so keep those elsewhere and copy them back.
//   node scripts/gen-audio.ts --seed     only write the manifest for the clips that exist (no recording)
//   --no-vowels                          read the plain script, as before vowel marks were added
//
// The manifest (src/content/audio-manifest.json) remembers what each clip was recorded from: the voice and
// the exact text handed to it, vowel marks included. When a reading changes (a Finglish fix, a better vowel
// rule) the clip no longer matches and is recorded again; clips whose reading did not change are left alone.
// A clip a person recorded is marked "person" there and is never replaced.
//
// Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in the environment or in .env.local (git-ignored).
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { allSpeech, type Voice } from '../src/content/speech.ts'
import { normSpeech } from '../src/lib/audioKey.ts'
import { VOICES } from '../src/content/voices.ts'
import { APP } from '../src/app.ts'
import { SPOKEN } from '../src/content/spoken/index.ts'
import { buildLexicon, vocalize, vocalizeWith } from '../src/lib/vocalize.ts'

// Persian is read the way people say it (everyday forms); the file is still named after the displayed text.
// Written Persian leaves out the short vowels (مبل: mobl or mabl?), so the voice reads a copy with the vowel
// marks added from the Finglish (mobl). Spoken forms have no Finglish of their own: their words are vocalised
// from the words the course already knows.
const ALL_ITEMS = allSpeech()
const LEXICON = buildLexicon(ALL_ITEMS.filter((i) => i.tr).map((i) => ({ fa: i.text, tr: i.tr! })))
const novowels = process.argv.includes('--no-vowels')
function sayable(text: string, tr?: string): string {
  // Single letters are read by their names (be, pe, jim): vowel marks would only change that.
  if (APP.target !== 'fa' || [...text].length === 1) return SPOKEN[text] ?? text
  const spoken = SPOKEN[text]
  if (novowels) return spoken ?? text
  if (spoken) return vocalizeWith(LEXICON, spoken)
  return (tr && vocalize(text, tr)) ?? vocalizeWith(LEXICON, text)
}

// Run with APP=begociao for the Italian clips of Bego Ciao.
// Voices (which Azure voice, its gender, and a pitch for a second same-gender speaker) are in
// src/content/voices.ts; every dialogue line uses its speaker's gender (src/content/speakers.ts).
// Check with: npm run check:voices
const OUT = APP.id === 'begociao' ? 'public-begociao/audio' : 'public/audio'
const INDEX = APP.id === 'begociao' ? 'src/courses/begociao/audio-index.json' : 'src/content/audio-index.json'
const MANIFEST = APP.id === 'begociao' ? 'src/courses/begociao/audio-manifest.json' : 'src/content/audio-manifest.json'
const XML_LANG = APP.target === 'it' ? 'it-IT' : 'fa-IR'
const dry = process.argv.includes('--dry')

function env(name: string): string | undefined {
  if (process.env[name]) return process.env[name]
  if (!existsSync('.env.local')) return undefined
  const line = readFileSync('.env.local', 'utf8').replace(/^﻿/, '').split(/\r?\n/).find((l) => l.startsWith(name + '='))
  return line?.slice(name.length + 1).trim()
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function synth(say: string, voice: Voice, key: string, region: string): Promise<Buffer> {
  const v = VOICES[voice]
  const ssml = `<speak version="1.0" xml:lang="${XML_LANG}"><voice name="${v.name}"><prosody rate="0%" pitch="${v.pitch}">${xml(normSpeech(say))}</prosody></voice></speak>`
  for (let attempt = 1; ; attempt++) {
    let res: Response
    try {
      res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
          'User-Agent': `${APP.id}-audio`,
        },
        body: ssml,
      })
      if (res.ok) return Buffer.from(await res.arrayBuffer())
    } catch (err) {
      // A dropped connection (ECONNRESET, timeout): wait and try again rather than stopping the whole run.
      if (attempt < 10) {
        console.log(`  network hiccup (${(err as Error).message}), retrying in ${5 * attempt}s`)
        await sleep(5000 * attempt)
        continue
      }
      throw err
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 8) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 4000 * attempt
      await sleep(wait)
      continue
    }
    throw new Error(`Azure TTS ${res.status}: ${await res.text().catch(() => '')}`)
  }
}

const items = ALL_ITEMS
mkdirSync(OUT, { recursive: true })
const redo = process.argv.includes('--redo')
const have = new Set(readdirSync(OUT).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)))

/** key → fingerprint of what the clip was recorded from, or "person" for a human recording. */
const manifest: Record<string, string> = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
const PERSON = 'person'
function fingerprint(item: { text: string; tr?: string; voice: Voice }): string {
  const v = VOICES[item.voice]
  const say = novowels ? (SPOKEN[item.text] ?? item.text) : sayable(item.text, item.tr)
  return createHash('sha1').update(`${v.name}|${v.pitch}|${normSpeech(say)}`).digest('base64url').slice(0, 12)
}
function saveManifest() {
  const lines = Object.keys(manifest).sort().map((k) => `${JSON.stringify(k)}:${JSON.stringify(manifest[k])}`)
  writeFileSync(MANIFEST, `{\n${lines.join(',\n')}\n}\n`)
}
const upToDate = (i: { key: string; text: string; tr?: string; voice: Voice }) =>
  have.has(i.key) && (manifest[i.key] === PERSON || manifest[i.key] === fingerprint(i))

if (process.argv.includes('--seed')) {
  // Record nothing: say that every clip on disk was made from what the course reads today.
  let n = 0
  for (const i of items) if (have.has(i.key) && manifest[i.key] !== PERSON) { manifest[i.key] = fingerprint(i); n++ }
  saveManifest()
  console.log(`manifest: ${n} clips fingerprinted`)
  process.exit(0)
}

if (process.argv.includes('--compare')) {
  // Words whose vowels a voice often guesses wrong, recorded both ways so a native speaker can choose.
  const key = env('AZURE_SPEECH_KEY')
  const region = env('AZURE_SPEECH_REGION')
  if (!key || !region) throw new Error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (environment or .env.local).')
  // Real words only (not letter names), starting with ones a voice is known to misread.
  const words = items.filter((i) => i.tr && [...i.text].length > 1 && !i.text.includes(' ') && vocalize(i.text, i.tr) !== i.text)
  const tricky = new Set(['مبل', 'چشم', 'کتاب', 'گل', 'کرم', 'مرد', 'شکر', 'پسر', 'دختر', 'خوب', 'سر', 'در'])
  const sample = [...words.filter((i) => tricky.has(i.text)), ...words.filter((i) => !tricky.has(i.text))].slice(0, 20)
  mkdirSync('audio-compare', { recursive: true })
  for (const [n, i] of sample.entries()) {
    const name = `audio-compare/${String(n + 1).padStart(2, '0')}-${i.tr!.replace(/[^a-z]/gi, '')}`
    writeFileSync(`${name}-plain.mp3`, await synth(SPOKEN[i.text] ?? i.text, i.voice, key, region))
    await sleep(3100)
    writeFileSync(`${name}-vowels.mp3`, await synth(sayable(i.text, i.tr), i.voice, key, region))
    await sleep(3100)
    console.log(`${name}: ${i.text} → ${sayable(i.text, i.tr)}`)
  }
  process.exit(0)
}
// One entry per clip: the same words with the same voice in two lessons are one recording.
const unique = [...new Map(items.map((i) => [i.key, i])).values()]
const todo = unique.filter((i) => (redo ? manifest[i.key] !== PERSON : !upToDate(i)))
const changed = todo.filter((i) => have.has(i.key)).length
const chars = todo.reduce((n, i) => n + i.text.length, 0)
console.log(`${unique.length} clips, ${todo.length} to generate: ${todo.length - changed} new, ${changed} whose reading changed (${chars} characters)`)
if (process.argv.includes('--list')) for (const i of todo) console.log(`  [${i.voice}] ${i.text}  · ${i.where}`)

if (!dry && todo.length) {
  const key = env('AZURE_SPEECH_KEY')
  const region = env('AZURE_SPEECH_REGION')
  if (!key || !region) {
    console.error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (environment or .env.local).')
    process.exitCode = 1
  } else {
    let done = 0
    for (const item of todo) {
      const k = item.key
      writeFileSync(`${OUT}/${k}.mp3`, await synth(sayable(item.text, item.tr), item.voice, key, region))
      have.add(k)
      manifest[k] = fingerprint(item)
      if (++done % 25 === 0 || done === todo.length) { console.log(`  ${done}/${todo.length}`); saveManifest() }
      await sleep(3100) // free tier: 20 requests per minute
    }
  }
}

// The index lists only keys the course still uses, so old clips are ignored by the app.
const used = items.map((i) => i.key).filter((k) => have.has(k))
// A dry run only reports: it never rewrites the index.
if (!dry) writeFileSync(INDEX, JSON.stringify([...new Set(used)].sort()) + '\n')
if (!dry) saveManifest()
console.log(`audio index: ${used.length} clips${dry ? ' (dry run: index not written)' : ''}`)
