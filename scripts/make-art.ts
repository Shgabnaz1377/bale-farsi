// Draws the app icon, splash screens and favicon from Pishi (src/lib/cat.ts).
// PersianMeow → assets/ and public/; with APP=begociao → assets-begociao/ and public-begociao/.
// Then `node scripts/render-icons.mjs` (same APP) turns them into PNGs.
import { mkdirSync, writeFileSync } from 'node:fs'
import { catSvg } from '../src/lib/cat.ts'
import { APP } from '../src/app.ts'

const bego = APP.id === 'begociao'
const ASSETS = bego ? 'assets-begociao' : 'assets'
const PUBLIC = bego ? 'public-begociao' : 'public'
const BG = bego ? '#1e7a4b' : '#0a7b7a' // Italian green for Bego Ciao, turquoise tile for PersianMeow
const ACCENT_DARK = bego ? '#4cc985' : '#3ec3be'
mkdirSync(ASSETS, { recursive: true })
mkdirSync(PUBLIC, { recursive: true })

const collar = bego ? 'italian' : 'persian'
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
const face = inner(catSvg('idle', { face: true, collar }))
const full = inner(catSvg('wave', { collar }))
const [n1, n2] = APP.name

// Face fills the middle ~70% so Android's round/squircle masks never clip the ears.
const icon = (bg: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<rect width="1024" height="1024" fill="${bg}"/>
<svg x="152" y="140" width="720" height="720" viewBox="30 16 140 140">${face}</svg>
</svg>`
writeFileSync(`${ASSETS}/icon.svg`, icon(BG))
writeFileSync(`${ASSETS}/icon-background.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><rect width="1024" height="1024" fill="${BG}"/></svg>`)

const splash = (bg: string, ink: string, accent: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732" width="2732" height="2732">
<rect width="2732" height="2732" fill="${bg}"/>
<svg x="1056" y="890" width="620" height="620" viewBox="-6 -6 212 212">${full}</svg>
<text x="1366" y="1690" font-family="Bricolage Grotesque, Segoe UI, sans-serif" font-size="150" font-weight="800" text-anchor="middle"><tspan fill="${ink}">${n1}</tspan><tspan fill="${accent}">${bego ? ' ' : ''}${n2}</tspan></text>
${bego ? `<text x="1366" y="1880" font-family="Vazirmatn, Tahoma, sans-serif" font-size="110" font-weight="700" text-anchor="middle" fill="${accent}">${APP.brandFa}</text>` : ''}
</svg>`
writeFileSync(`${ASSETS}/splash.svg`, splash('#eef3f6', '#13213a', BG))
writeFileSync(`${ASSETS}/splash-dark.svg`, splash('#0c1524', '#e6edf6', ACCENT_DARK))

writeFileSync(`${PUBLIC}/favicon.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${BG}"/><svg x="2" y="2" width="60" height="60" viewBox="30 16 140 140">${face}</svg></svg>`)
console.log(`art written for ${APP.fullName}`)
