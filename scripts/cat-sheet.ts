// Writes a contact sheet of every mood: node scripts/cat-sheet.ts <out.html>
import { writeFileSync } from 'node:fs'
import { catSvg, type Mood } from '../src/lib/cat.ts'
const moods: Mood[] = ['idle', 'happy', 'cheer', 'sad', 'think', 'sleep', 'wave']
const cells = moods.map((m) => `<figure>${catSvg(m)}<figcaption>${m}</figcaption></figure>`).join('')
writeFileSync(process.argv[2], `<html><body style="margin:0;background:#eef3f6;font:14px sans-serif">
<div style="display:grid;grid-template-columns:repeat(4,220px);gap:10px;padding:10px">${cells}
<figure style="background:#0a7b7a;border-radius:40px;margin:0;width:200px;height:200px">${catSvg('idle', { face: true })}</figure></div>
<style>svg{width:200px;height:200px}figure{margin:0;text-align:center}</style></body></html>`)
