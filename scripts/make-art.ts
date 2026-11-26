// Draws the app icon, splash screens and favicon from Pishi (src/lib/cat.ts) into assets/ and public/.
// Then `node scripts/render-icons.mjs` turns them into PNGs. Usage: node scripts/make-art.ts
import { writeFileSync } from 'node:fs'
import { catSvg } from '../src/lib/cat.ts'

const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
const face = inner(catSvg('idle', { face: true }))
const full = inner(catSvg('wave'))

// Face fills the middle ~70% so Android's round/squircle masks never clip the ears.
const icon = (bg: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<rect width="1024" height="1024" fill="${bg}"/>
<svg x="152" y="140" width="720" height="720" viewBox="30 16 140 140">${face}</svg>
</svg>`
writeFileSync('assets/icon.svg', icon('#0a7b7a'))
writeFileSync('assets/icon-background.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><rect width="1024" height="1024" fill="#0a7b7a"/></svg>`)

const splash = (bg: string, ink: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732" width="2732" height="2732">
<rect width="2732" height="2732" fill="${bg}"/>
<svg x="1056" y="890" width="620" height="620" viewBox="-6 -6 212 212">${full}</svg>
<text x="1366" y="1690" font-family="Bricolage Grotesque, Segoe UI, sans-serif" font-size="150" font-weight="800" text-anchor="middle"><tspan fill="${ink}">Persian</tspan><tspan fill="#0a7b7a">Meow</tspan></text>
</svg>`
writeFileSync('assets/splash.svg', splash('#eef3f6', '#13213a'))
writeFileSync('assets/splash-dark.svg', splash('#0c1524', '#e6edf6').replace('fill="#0a7b7a">Meow', 'fill="#3ec3be">Meow'))

writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0a7b7a"/><svg x="2" y="2" width="60" height="60" viewBox="30 16 140 140">${face}</svg></svg>`)
console.log('art written')
