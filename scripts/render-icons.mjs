// Renders assets/*.svg to the PNGs used by the web app manifest and by @capacitor/assets.
// Usage: node scripts/render-icons.mjs   (needs Playwright's Chromium: npx playwright install chromium)
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Vazirmatn:wght@700&display=block">'
const jobs = [
  ['assets/icon.svg', 1024, 'assets/icon-only.png'],
  ['assets/icon.svg', 1024, 'assets/icon-foreground.png'],
  ['assets/splash.svg', 2732, 'assets/splash.png'],
  ['assets/splash-dark.svg', 2732, 'assets/splash-dark.png'],
  ['assets/icon.svg', 512, 'public/icon-512.png'],
  ['assets/icon.svg', 192, 'public/icon-192.png'],
  ['assets/icon.svg', 180, 'public/apple-touch-icon.png'],
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
