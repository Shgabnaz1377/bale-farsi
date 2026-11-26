// Writes every speakable Persian text of PersianMeow, grouped by level, to JSON files for the spoken-form work.
// Usage: node scripts/export-speech.ts <outDir>
import { mkdirSync, writeFileSync } from 'node:fs'
import { allSpeech } from '../src/content/speech.ts'

const out = process.argv[2] ?? 'speech-export'
mkdirSync(out, { recursive: true })
const groups: Record<string, unknown[]> = {}
for (const item of allSpeech()) {
  const level = /^(A1|A2|B1|B2)\b/.exec(item.where)?.[1] ?? 'other'
  ;(groups[level] ??= []).push({ text: item.text, where: item.where, tr: item.tr, en: item.en })
}
for (const [level, items] of Object.entries(groups)) {
  writeFileSync(`${out}/${level}.json`, JSON.stringify(items, null, 1))
  console.log(level, items.length)
}
