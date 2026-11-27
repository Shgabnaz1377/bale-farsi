// Fails when a dialogue line would be spoken in a voice of the wrong gender.
// Usage: node scripts/check-voices.ts   (PersianMeow)   ·   APP=begociao node scripts/check-voices.ts
import { LEVELS } from '../src/content/course.ts'
import { TRACKS } from '../src/content/tracks/index.ts'
import { dialogueVoices, genderOf, genderOfVoice, type VoiceId } from '../src/content/speakers.ts'
import { AZURE_VOICE_GENDER, VOICES } from '../src/content/voices.ts'
import { APP } from '../src/app.ts'

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

console.log(`${APP.fullName}: ${lines} dialogue lines in ${units.filter((u) => u.dialogue?.length).length} dialogues, ${errs.length} voice problems`)
errs.forEach((e) => console.log('  - ' + e))
process.exitCode = errs.length ? 1 : 0
