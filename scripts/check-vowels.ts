// Lines up every Persian text in the course with its Finglish and adds the short-vowel marks.
// Lists the texts that cannot be lined up: usually a Finglish typo or a missing/extra letter.
//   node scripts/check-vowels.ts           summary + problems
//   node scripts/check-vowels.ts --all     also print every vocalised text
import { allSpeech } from '../src/content/speech.ts'
import { vocalize } from '../src/lib/vocalize.ts'

const all = process.argv.includes('--all')
const items = allSpeech().filter((i) => i.tr)
let bad = 0
for (const it of items) {
  const v = vocalize(it.text, it.tr!)
  if (v === null) {
    bad++
    console.log(`✗ ${it.where}\n    ${it.text}\n    ${it.tr}`)
  } else if (all) console.log(`${v}\t${it.tr}`)
}
console.log(`${items.length - bad}/${items.length} texts vocalised, ${bad} could not be lined up`)
