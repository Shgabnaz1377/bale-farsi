// Lists the smallest audio clips with their texts, to spot broken or empty recordings.
// Usage: node scripts/audio-report.ts [maxBytes]   (APP=begociao for Bego Ciao)
import { readdirSync, statSync } from 'node:fs'
import { allSpeech } from '../src/content/speech.ts'
import { audioKey } from '../src/lib/audioKey.ts'
import { APP } from '../src/app.ts'

const dir = APP.id === 'begociao' ? 'public-begociao/audio' : 'public/audio'
const max = Number(process.argv[2] ?? 6000)
const byKey = new Map(allSpeech().map((i) => [audioKey(i.text), i]))
const sizes = readdirSync(dir).map((f) => ({ f, size: statSync(`${dir}/${f}`).size }))
const counts = new Map<number, number>()
for (const s of sizes) counts.set(s.size, (counts.get(s.size) ?? 0) + 1)
console.log('most common sizes:', [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s, n]) => `${s}B×${n}`).join(', '))
for (const s of sizes.filter((x) => x.size < max).sort((a, b) => a.size - b.size)) {
  const item = byKey.get(s.f.replace('.mp3', ''))
  console.log(String(s.size).padStart(6), item ? JSON.stringify(item.text) + ' · ' + item.where : '(no text)')
}
