// Usage: node scripts/check-content.ts a1   (or a2, b1, b2; no argument checks every level that exists)
import { existsSync } from 'node:fs'
import { validateUnits } from '../src/content/validate.ts'
import type { Level, Unit } from '../src/content/types.ts'

const levels = (process.argv[2] ? [process.argv[2]] : ['a1', 'a2', 'b1', 'b2']).map((l) => l.toLowerCase())
let bad = 0
for (const l of levels) {
  const file = new URL(`../src/content/${l}.ts`, import.meta.url)
  if (!existsSync(file)) { console.log(`${l}: not written yet`); continue }
  const mod = await import(file.href)
  const units: Unit[] = mod[l.toUpperCase()]
  if (!Array.isArray(units)) { console.log(`${l}: file must export const ${l.toUpperCase()}: Unit[]`); bad++; continue }
  const errs = validateUnits(units, l.toUpperCase() as Level)
  const words = units.reduce((n, u) => n + u.words.length, 0)
  const sents = units.reduce((n, u) => n + u.sentences.length, 0)
  console.log(`${l}: ${units.length} units, ${words} words, ${sents} sentences, ${errs.length} problems`)
  errs.forEach((e) => console.log('  - ' + e))
  bad += errs.length
}
process.exitCode = bad ? 1 : 0
