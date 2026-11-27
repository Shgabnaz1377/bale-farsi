// One written word, one reading: every Persian word in the app (lessons, dialogues, readings, tracks,
// idioms, facts, dictionary) must be read the same way wherever it appears, so the voice and the vowel
// marks never change from one screen to the next.
//
//   node scripts/check-readings.ts          fail if a word has two readings that are not allowed
//   node scripts/check-readings.ts --all    also list the allowed ones
//   node scripts/check-readings.ts --json   machine-readable report (for scripts and reviews)
//
// A reading is the word with its vowel marks, worked out from the Finglish (src/lib/vocalize.ts). Two
// readings of one written word are allowed only when they really are different words (homographs such as
// گُل gol / گِل gel, in src/content/homographs.ts) or the everyday and the formal form of a word (dastesh /
// dastash), listed in src/content/readings.ts with the reason. Anything else is a Finglish spelling that
// drifted (panjere / panjare): pick one and use it everywhere.
import { allSpeech } from '../src/content/speech.ts'
import { HOMOGRAPHS } from '../src/content/homographs.ts'
import { READING_PAIRS } from '../src/content/readings.ts'
import { stripVowels, vocalize, wordReadings } from '../src/lib/vocalize.ts'

const all = process.argv.includes('--all')
const json = process.argv.includes('--json')

const allowed = new Set<string>([...HOMOGRAPHS.map((h) => stripVowels(h.bare)), ...Object.keys(READING_PAIRS)])
const forms = new Map<string, Map<string, Set<string>>>()
let unaligned = 0
for (const it of allSpeech()) {
  if (!it.tr || [...it.text].length === 1) continue
  const v = vocalize(it.text, it.tr)
  if (!v) { unaligned++; continue }
  for (const [bare, reading] of wordReadings(it.text, v)) {
    if (!forms.has(bare)) forms.set(bare, new Map())
    const m = forms.get(bare)!
    if (!m.has(reading)) m.set(reading, new Set())
    m.get(reading)!.add(it.tr)
  }
}

// Two differences that are real Persian, not drift, so they are accepted without a list:
// - a doubled consonant at the end of a word is heard only before a vowel: khat, but khatt-e âber (خطّ);
// - the pronoun endings are -et / -esh / -em in everyday speech and -at / -ash / -am in writing
//   (dastesh in a dialogue, dastash in a letter), as the course teaches.
const SHADDA = '\u0651'
const FATHA = '\u064E'
const PRONOUN_END = /[\u064E\u0650]([تشم]|تان|شان|مان)$/
function sameWord(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(new RegExp(SHADDA + '$'), '').replace(PRONOUN_END, (_, end) => FATHA + end)
  return norm(a) === norm(b)
}
const conflicts = [...forms].filter(([, m]) => {
  const rs = [...m.keys()]
  return rs.some((r) => !sameWord(r, rs[0]))
})
const bad = conflicts.filter(([w]) => !allowed.has(w))
if (json) {
  console.log(JSON.stringify(conflicts.map(([w, m]) => ({
    word: w, allowed: allowed.has(w),
    readings: [...m].map(([r, ex]) => ({ reading: r, examples: [...ex].slice(0, 5), count: ex.size })),
  })), null, 1))
} else {
  for (const [w, m] of all ? conflicts : bad) {
    console.log(`${allowed.has(w) ? 'ok ' : '✗  '}${w}`)
    for (const [r, ex] of m) console.log(`     ${r}  (${ex.size}×)  e.g. ${[...ex].slice(0, 2).join(' / ')}`)
  }
  console.log(`\n${forms.size} words, ${conflicts.length} with more than one reading, ${bad.length} not allowed` +
    (unaligned ? `; ${unaligned} texts whose Finglish does not line up (npm run check:vowels)` : ''))
}
if (bad.length && !json) process.exit(1)
