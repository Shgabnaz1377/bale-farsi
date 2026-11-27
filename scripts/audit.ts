// Course audit: content per unit, dialogue speakers and their voices, texts sharing one audio file, missing audio.
// Usage: node scripts/audit.ts
import { existsSync } from 'node:fs'
import { LEVELS } from '../src/content/course.ts'
import { allSpeech } from '../src/content/speech.ts'
import { audioKey } from '../src/lib/audioKey.ts'

console.log('== Content per unit (words / sentences / grammar examples / dialogue lines / reading paragraphs)')
for (const lv of LEVELS) for (const u of lv.units) {
  console.log(`${u.id.padEnd(22)} ${String(u.words.length).padStart(3)} ${String(u.sentences.length).padStart(3)} ${String(u.grammar.examples.length).padStart(3)} ${String(u.dialogue?.length ?? 0).padStart(3)} ${String(u.reading?.paragraphs.length ?? 0).padStart(3)}`)
}

console.log('\n== Dialogue speakers and the voice each currently gets (speaker order: 1st = main, 2nd = second)')
for (const lv of LEVELS) for (const u of lv.units) {
  if (!u.dialogue?.length) continue
  const speakers = [...new Set(u.dialogue.map((d) => d.who))]
  console.log(`${u.id}: ${speakers.map((s, i) => `${s} → ${i % 2 ? 'second' : 'main'}`).join(', ')}`)
}

console.log('\n== Different course items that share one audio file (same Persian text, different meaning)')
const byKey = new Map<string, { text: string; where: string; en?: string }[]>()
for (const lv of LEVELS) for (const u of lv.units) for (const w of u.words) {
  const k = audioKey(w.fa)
  byKey.set(k, [...(byKey.get(k) ?? []), { text: w.fa, where: u.id, en: w.en }])
}
for (const items of byKey.values()) {
  const meanings = new Set(items.map((i) => i.en))
  if (meanings.size > 1) console.log('  ' + items.map((i) => `${i.text} (${i.en}, ${i.where})`).join('  |  '))
}

const missing = allSpeech().filter((i) => !existsSync(`public/audio/${audioKey(i.text)}.mp3`))
console.log(`\n== Audio: ${allSpeech().length} texts, ${missing.length} without a clip on disk`)
