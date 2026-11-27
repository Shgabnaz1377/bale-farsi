// Checks the dictionary topic files in src/content/dictionary/: format, Persian-only script,
// duplicates, and that every Persian text lines up with its Finglish (vocalize).
//   node scripts/check-dictionary.ts            every topic file
//   node scripts/check-dictionary.ts verbs      only verbs.ts (duplicates are still checked against all files)
import { readdirSync } from 'node:fs'
import { parseDictionary, type DictEntry } from '../src/content/dictionary/entry.ts'
import { FA_ONLY, dictKey } from '../src/content/dictionary/rules.ts'
import { vocalize } from '../src/lib/vocalize.ts'

const dir = new URL('../src/content/dictionary/', import.meta.url)
const topics = readdirSync(dir).filter((f) => f.endsWith('.ts') && !['entry.ts', 'index.ts', 'rules.ts'].includes(f))
const only = process.argv.slice(2).map((a) => a.replace(/\.ts$/, ''))

const all: { file: string; e: DictEntry }[] = []
let problems = 0
const report = (msg: string) => { problems++; console.log('  ✗ ' + msg) }

for (const f of topics) {
  const name = f.replace(/\.ts$/, '')
  const mine = !only.length || only.includes(name)
  let mod: { default: string }
  try {
    mod = await import(new URL(f, dir).href)
  } catch (err) {
    if (mine) report(`${f} cannot be loaded: ${(err as Error).message}`)
    continue
  }
  const { entries, errors } = parseDictionary(mod.default, f)
  for (const e of entries) all.push({ file: f, e })
  if (!mine) continue
  let voc = 0, ex = 0, exVoc = 0
  console.log(`${f}: ${entries.length} entries`)
  errors.forEach(report)
  for (const e of entries) {
    if (!FA_ONLY.test(e.fa)) report(`${e.fa}: non-Persian characters in fa`)
    if (vocalize(e.fa, e.tr)) voc++
    else report(`does not line up: ${e.fa} | ${e.tr}`)
    if (e.stem && !vocalize(e.stem.fa, e.stem.tr)) report(`stem does not line up: ${e.stem.fa} | ${e.stem.tr}`)
    if (e.ex) {
      ex++
      if (!FA_ONLY.test(e.ex.fa)) report(`${e.ex.fa}: non-Persian characters in example`)
      if (vocalize(e.ex.fa, e.ex.tr)) exVoc++
      else report(`example does not line up: ${e.ex.fa} | ${e.ex.tr}`)
    }
  }
  console.log(`  ${voc}/${entries.length} words line up; ${ex} examples, ${exVoc} line up`)
}

const seen = new Map<string, string>()
for (const { file, e } of all) {
  const k = dictKey(e)
  const name = file.replace(/\.ts$/, '')
  const other = seen.get(k)?.replace(/\.ts$/, '')
  if (other !== undefined && (!only.length || (only.includes(name) && only.includes(other)))) {
    report(`duplicate ${e.fa} = ${e.en} (${seen.get(k)} and ${file})`)
  } else seen.set(k, file)
}
console.log(`total: ${all.length} entries, ${all.filter((x) => x.e.ex).length} with examples, ${problems} problems`)
process.exitCode = problems ? 1 : 0
