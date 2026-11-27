// Fails when a dialogue line would be spoken in a voice of the wrong gender.
// PersianMeow also: every dialogue speaker is in the cast with the gender of characters.json, and every
// lesson sentence is said by a cast member in a voice of their gender (src/content/sentenceSpeakers.ts).
// Usage: node scripts/check-voices.ts   (PersianMeow)   ·   APP=begociao node scripts/check-voices.ts
import { LEVELS } from '../src/content/course.ts'
import { TRACKS } from '../src/content/tracks/index.ts'
import { dialogueVoices, genderOf, genderOfVoice, type VoiceId } from '../src/content/speakers.ts'
import { AZURE_VOICE_GENDER, VOICES } from '../src/content/voices.ts'
import { APP } from '../src/app.ts'
import { CAST, castMember } from '../src/content/cast.ts'
import { sentenceSpeaker, sentenceVoice } from '../src/content/sentenceSpeakers.ts'
import { existsSync, readFileSync } from 'node:fs'

const errs: string[] = []

// 1. The voice table: every voice id uses an Azure voice of the gender it stands for.
for (const [id, v] of Object.entries(VOICES) as [VoiceId, (typeof VOICES)[VoiceId]][]) {
  const real = AZURE_VOICE_GENDER[v.name]
  if (!real) errs.push(`voice ${id}: unknown Azure voice ${v.name} (add its real gender to AZURE_VOICE_GENDER)`)
  else if (real !== genderOfVoice(id) || real !== v.gender) errs.push(`voice ${id} uses ${v.name}, which is ${real === 'f' ? 'female' : 'male'}`)
}

// 2. Every dialogue speaker has a gender, every line gets a voice of that gender, and the two people differ.
const units = [...LEVELS.flatMap((l) => l.units), ...TRACKS.flatMap((t) => t.units)]
let lines = 0
for (const u of units) {
  if (!u.dialogue?.length) continue
  const voices = dialogueVoices(u)
  for (const d of u.dialogue) {
    lines++
    const g = genderOf(d.who, u.id)
    if (!g) { errs.push(`${u.id}: speaker "${d.who}" has no gender (add it to src/content/speakers.ts)`); continue }
    const v = voices.get(d.who)!
    if (genderOfVoice(v) !== g) errs.push(`${u.id}: ${d.who} is ${g === 'f' ? 'a woman' : 'a man'} but gets voice ${v}`)
  }
  const ids = [...voices.values()]
  if (new Set(ids).size !== ids.length) errs.push(`${u.id}: two speakers share the same voice (${[...voices].map(([w, v]) => `${w}=${v}`).join(', ')})`)
}

// 3. PersianMeow: every speaker is one of the cast, with the gender characters.json gives them, and every
//    lesson sentence is said by a cast member in a voice of their gender.
if (APP.id === 'persianmeow') {
  const designer = JSON.parse(readFileSync('src/content/characters.json', 'utf8')) as { name: string; id: string; gender: 'female' | 'male'; voice: string }[]
  const sheet = new Map(designer.map((c) => [c.name, c]))
  const g = (s: string) => (s === 'female' ? 'f' : 'm')
  if (designer.length !== CAST.length) errs.push(`cast.ts has ${CAST.length} people, characters.json ${designer.length}`)
  for (const c of CAST) {
    const d = sheet.get(c.name)
    if (!d) { errs.push(`cast.ts: ${c.name} is not in characters.json`); continue }
    if (d.id !== c.id || g(d.gender) !== c.gender || g(d.voice) !== c.gender) errs.push(`cast.ts: ${c.name} differs from characters.json (id ${d.id}, gender ${d.gender}, voice ${d.voice})`)
    for (const f of [`${c.id}_idle.svg`, `${c.id}_idle_talk.svg`, `${c.id}_avatar.png`]) {
      if (!existsSync(`public/characters/${f}`)) errs.push(`public/characters/${f} is missing`)
    }
  }
  for (const u of units) {
    if (!u.dialogue?.length) continue
    const voices = dialogueVoices(u)
    for (const who of new Set(u.dialogue.map((d) => d.who))) {
      const d = sheet.get(who)
      if (!castMember(who) || !d) { errs.push(`${u.id}: speaker "${who}" is not in the cast (src/content/cast.ts)`); continue }
      if (genderOfVoice(voices.get(who)!) !== g(d.voice)) errs.push(`${u.id}: ${who} speaks in voice ${voices.get(who)}, but characters.json says ${d.voice}`)
    }
  }
  let said = 0
  for (const u of units) {
    for (const p of [...u.sentences, ...u.grammar.examples]) {
      const c = sentenceSpeaker(p, u.id)
      if (!c) continue
      said++
      const v = sentenceVoice(p, u.id)
      if (genderOfVoice(v) !== c.gender || AZURE_VOICE_GENDER[VOICES[v].name] !== c.gender) errs.push(`${u.id}: "${p.fa}" is said by ${c.name} in voice ${v}`)
    }
  }
  console.log(`${said} lesson sentences said by the cast`)
}

console.log(`${APP.fullName}: ${lines} dialogue lines in ${units.filter((u) => u.dialogue?.length).length} dialogues, ${errs.length} voice problems`)
errs.forEach((e) => console.log('  - ' + e))
process.exitCode = errs.length ? 1 : 0
