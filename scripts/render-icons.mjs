// Renders assets*/ SVGs to the PNGs used by the web app manifest and by @capacitor/assets.
// Usage: node scripts/render-icons.mjs  (PersianMeow)  ·  APP=begociao node scripts/render-icons.mjs  (Bego Ciao)
// Needs Playwright's Chromium: npx playwright install chromium
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const bego = process.env.APP === 'begociao'
const A = bego ? 'assets-begociao' : 'assets'
const P = bego ? 'public-begociao' : 'public'
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Vazirmatn:wght@700&display=block">'
const jobs = [
  [`${A}/icon.svg`, 1024, `${A}/icon-only.png`],
  [`${A}/icon.svg`, 1024, `${A}/icon-foreground.png`],
  [`${A}/icon-background.svg`, 1024, `${A}/icon-background.png`],
  [`${A}/splash.svg`, 2732, `${A}/splash.png`],
  [`${A}/splash-dark.svg`, 2732, `${A}/splash-dark.png`],
  [`${A}/icon.svg`, 512, `${P}/icon-512.png`],
  [`${A}/icon.svg`, 192, `${P}/icon-192.png`],
  [`${A}/icon.svg`, 180, `${P}/apple-touch-icon.png`],
]
const browser = await chromium.launch()
for (const [src, size, out] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  const svg = readFileSync(src, 'utf8').replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`)
  await page.setContent(`<html><head>${fonts}<style>html,body{margin:0}</style></head><body>${svg}</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: size, height: size } })
  await page.close()
  console.log('wrote', out)
}
await browser.close()
