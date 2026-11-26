// Generates public/audio/<key>.mp3 for every Persian text in the course with Azure's Persian neural voices,
// and writes src/content/audio-index.json (the keys that have audio).
//
//   node scripts/gen-audio.ts            generate what is missing
//   node scripts/gen-audio.ts --dry      only count what would be generated
//
// Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in the environment or in .env.local (git-ignored).
// Files recorded by a person (public/audio/<key>.mp3 already present) are never overwritten.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { allSpeech, type Voice } from '../src/content/speech.ts'
import { audioKey, normSpeech } from '../src/lib/audioKey.ts'
import { APP } from '../src/app.ts'

// Run with APP=begociao for the Italian clips of Bego Ciao.
const VOICES: Record<Voice, string> = APP.target === 'it'
  ? { female: 'it-IT-ElsaNeural', male: 'it-IT-DiegoNeural' }
  : { female: 'fa-IR-DilaraNeural', male: 'fa-IR-FaridNeural' }
const OUT = APP.id === 'begociao' ? 'public-begociao/audio' : 'public/audio'
const INDEX = APP.id === 'begociao' ? 'src/courses/begociao/audio-index.json' : 'src/content/audio-index.json'
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

async function synth(text: string, voice: Voice, key: string, region: string): Promise<Buffer> {
  const ssml = `<speak version="1.0" xml:lang="${XML_LANG}"><voice name="${VOICES[voice]}"><prosody rate="-8%">${xml(normSpeech(text))}</prosody></voice></speak>`
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
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
    if ((res.status === 429 || res.status >= 500) && attempt < 8) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 4000 * attempt
      await sleep(wait)
      continue
    }
    throw new Error(`Azure TTS ${res.status}: ${await res.text().catch(() => '')}`)
  }
}

const items = allSpeech()
mkdirSync(OUT, { recursive: true })
const have = new Set(readdirSync(OUT).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)))
const todo = items.filter((i) => !have.has(audioKey(i.text)))
const chars = todo.reduce((n, i) => n + i.text.length, 0)
console.log(`${items.length} texts, ${have.size} already have audio, ${todo.length} to generate (${chars} characters)`)

if (!dry && todo.length) {
  const key = env('AZURE_SPEECH_KEY')
  const region = env('AZURE_SPEECH_REGION')
  if (!key || !region) {
    console.error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (environment or .env.local).')
    process.exitCode = 1
  } else {
    let done = 0
    for (const item of todo) {
      const k = audioKey(item.text)
      writeFileSync(`${OUT}/${k}.mp3`, await synth(item.text, item.voice, key, region))
      have.add(k)
      if (++done % 25 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`)
      await sleep(3100) // free tier: 20 requests per minute
    }
  }
}

// The index lists only keys the course still uses, so old clips are ignored by the app.
const used = items.map((i) => audioKey(i.text)).filter((k) => have.has(k))
writeFileSync(INDEX, JSON.stringify([...new Set(used)].sort()) + '\n')
console.log(`audio index: ${used.length} clips`)
