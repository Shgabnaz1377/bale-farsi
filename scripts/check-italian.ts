// Checks the Italian translation of the Persian course.  Usage: node scripts/check-italian.ts [a1|a2|b1|b2]
import { existsSync } from 'node:fs'
import { validateTranslation } from '../src/content/i18n/validate.ts'
import type { Unit } from '../src/content/types.ts'

const levels = process.argv[2] ? [process.argv[2].toLowerCase()] : ['a1', 'a2', 'b1', 'b2']
let bad = 0
for (const l of levels) {
  const file = new URL(`../src/content/i18n/it/${l}.ts`, import.meta.url)
  if (!existsSync(file)) { console.log(`it/${l}: not written yet`); bad++; continue }
  const units: Unit[] = (await import(new URL(`../src/content/${l}.ts`, import.meta.url).href))[l.toUpperCase()]
  const tr = (await import(file.href))[`IT_${l.toUpperCase()}`]
  if (!tr) { console.log(`it/${l}: file must export const IT_${l.toUpperCase()}: CourseTr`); bad++; continue }
  const errs = validateTranslation(units, tr)
  console.log(`it/${l}: ${units.length} units, ${errs.length} problems`)
  errs.forEach((e) => console.log('  - ' + e))
  bad += errs.length
}
process.exitCode = bad ? 1 : 0
