// Checks the Culture and For-couples tracks: content rules, Italian translation, speaker voices.
// Usage: node scripts/check-tracks.ts
import { validateUnits } from '../src/content/validate.ts'
import { validateTranslation } from '../src/content/i18n/validate.ts'
import { TRACKS } from '../src/content/tracks/index.ts'
import { IT_CULTURE } from '../src/content/i18n/it/culture.ts'
import { IT_COUPLES } from '../src/content/i18n/it/couples.ts'
import { genderOf } from '../src/content/speakers.ts'

const IT = { culture: IT_CULTURE, couples: IT_COUPLES }
let bad = 0
for (const t of TRACKS) {
  const errs: string[] = []
  for (const u of t.units) {
    errs.push(...validateUnits([u], u.level))
    for (const d of u.dialogue ?? []) if (!genderOf(d.who, u.id)) errs.push(`${u.id}: speaker "${d.who}" has no gender (use a name from src/content/speakers.ts or Mr/Mrs + surname)`)
  }
  errs.push(...validateTranslation(t.units, IT[t.id]).map((e) => 'italian: ' + e))
  const words = t.units.reduce((n, u) => n + u.words.length, 0)
  console.log(`${t.id}: ${t.units.length} units, ${words} words, ${errs.length} problems`)
  errs.forEach((e) => console.log('  - ' + e))
  bad += errs.length
}
process.exitCode = bad ? 1 : 0
