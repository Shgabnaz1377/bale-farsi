// Checks the Bego Ciao course (Italian for Persian speakers).  Usage: node scripts/check-bego.ts [a1|a2|b1|b2]
import { existsSync } from 'node:fs'
import { validateUnits } from '../src/content/validate.ts'
import type { Level, Unit } from '../src/content/types.ts'

const levels = (process.argv[2] ? [process.argv[2]] : ['a1', 'a2', 'b1', 'b2']).map((l) => l.toLowerCase())
let bad = 0
for (const l of levels) {
  const file = new URL(`../src/courses/begociao/${l}.ts`, import.meta.url)
  if (!existsSync(file)) { console.log(`bego/${l}: not written yet`); bad++; continue }
  const units: Unit[] = (await import(file.href))[l.toUpperCase()]
  if (!Array.isArray(units)) { console.log(`bego/${l}: file must export const ${l.toUpperCase()}: Unit[]`); bad++; continue }
  const errs = validateUnits(units, l.toUpperCase() as Level, 'it')
  const words = units.reduce((n, u) => n + u.words.length, 0)
  const sents = units.reduce((n, u) => n + u.sentences.length, 0)
  console.log(`bego/${l}: ${units.length} units, ${words} words, ${sents} sentences, ${errs.length} problems`)
  errs.forEach((e) => console.log('  - ' + e))
  bad += errs.length
}
process.exitCode = bad ? 1 : 0
