// Retake the store screenshots from the live site: node scripts/store-screenshots.mjs
// Play: 1080×1920 (store/screenshots/play), App Store 6.7″: 1290×2796 (store/screenshots/appstore).
import { chromium } from '@playwright/test'
const base = 'https://shgabnaz1377.github.io/persianmeow/'
const out = (kind, name) => new URL(`../store/screenshots/${kind}/${name}.png`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1')
const pages = [['3-path', '#/'], ['4-unit', '#/unit/a1-greetings'], ['5-alphabet', '#/alphabet'], ['6-dictionary', '#/words'], ['7-characters', '#/characters'], ['8-idioms', '#/idioms']]
const sizes = { play: { width: 360, height: 640 }, appstore: { width: 430, height: 932 } }
const b = await chromium.launch()
for (const [kind, viewport] of Object.entries(sizes)) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  const p = await ctx.newPage()
  // 1: the first-visit welcome; 2: the first exercise
  await p.goto(base, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
  await p.screenshot({ path: out(kind, '1-welcome') })
  await p.evaluate(() => localStorage.setItem('bale-farsi:welcome-seen', '1'))
  await p.goto(base + '#/unit/a1-greetings', { waitUntil: 'networkidle' }); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  await p.locator('a[href*="lesson"], button:has-text("Start")').first().click(); await p.waitForTimeout(2000)
  await p.screenshot({ path: out(kind, '2-lesson') })
  for (const [name, hash] of pages) {
    await p.goto(base + hash, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
    await p.screenshot({ path: out(kind, name) })
  }
  await ctx.close()
}
await b.close()
