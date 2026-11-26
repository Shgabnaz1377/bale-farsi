// Checks the spoken-form maps: every key must be a real course text, every value Persian and different.
// Usage: node scripts/check-spoken.ts
import { existsSync } from 'node:fs'
import { allSpeech } from '../src/content/speech.ts'

const texts = new Set(allSpeech().map((i) => i.text))
const PERSIAN = /^[؀-ۿ‌\s،؟.!:«»؛\-]+$/
let bad = 0
for (const l of ['a1', 'a2', 'b1', 'b2']) {
  const file = new URL(`../src/content/spoken/${l}.ts`, import.meta.url)
  if (!existsSync(file)) { console.log(`spoken/${l}: not written yet`); continue }
  const map: Record<string, string> = (await import(file.href))[`SPOKEN_${l.toUpperCase()}`]
  const errs: string[] = []
  for (const [k, v] of Object.entries(map ?? {})) {
    if (!texts.has(k)) errs.push(`key is not a course text: ${k}`)
    if (!PERSIAN.test(v)) errs.push(`value is not Persian script: ${v}`)
    if (k === v) errs.push(`unchanged entry (leave it out): ${k}`)
  }
  console.log(`spoken/${l}: ${Object.keys(map ?? {}).length} spoken forms, ${errs.length} problems`)
  errs.forEach((e) => console.log('  - ' + e))
  bad += errs.length
}
process.exitCode = bad ? 1 : 0
