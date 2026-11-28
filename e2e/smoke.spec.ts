import { expect, test, type Page } from '@playwright/test'

/** Collect console errors/warnings and uncaught exceptions for the lifetime of the page. */
function watchConsole(page: Page): string[] {
  const problems: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`${msg.type()}: ${msg.text()}`)
  })
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`))
  return problems
}

const ignoreFonts = (p: string[]) => p.filter((x) => !/fonts\.(googleapis|gstatic)/.test(x))

test('the first-visit welcome starts a lesson', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Learn to read, speak and understand Persian/ })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'English' })).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Start at A1' }).click()
  await expect(page).toHaveURL(/#\/lesson\?u=a1-greetings&k=words-1/)
  await expect(page.getByRole('button', { name: 'Check' })).toBeDisabled()
  await page.locator('.choice').first().click()
  await page.getByRole('button', { name: 'Check' }).click()
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
  expect(ignoreFonts(problems)).toEqual([])
})

/** Get past the first-visit welcome to the path. */
async function toPath(page: Page) {
  await page.goto('/#/')
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Show me the path first' }).click()
}

test('the path map opens a unit sheet and starts the current unit', async ({ page }) => {
  const problems = watchConsole(page)
  await toPath(page)
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Practice' })).toBeVisible()
  await expect(page.getByRole('button', { name: /A1/ }).first()).toHaveAttribute('aria-pressed', 'true')
  const current = page.locator('.node[aria-current="step"]')
  await expect(current).toHaveCount(1)
  await current.click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading', { name: 'Greetings and politeness' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(current).toBeFocused()
  await current.click()
  await expect(sheet.getByRole('link', { name: 'Test out of A1' })).toBeVisible()
  await sheet.getByRole('button', { name: 'Start' }).click()
  await expect(page).toHaveURL(/#\/lesson\?u=a1-greetings&k=words-1/)
  expect(ignoreFonts(problems)).toEqual([])
})

test('a locked unit can still be read from its sheet', async ({ page }) => {
  await toPath(page)
  await page.getByRole('button', { name: /Me and you, locked/ }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText(/Finish the unit before this one/)).toBeVisible()
  await expect(sheet.getByRole('button', { name: /Start|Continue/ })).toHaveCount(0)
  await sheet.getByRole('link', { name: 'Read the unit' }).click()
  await expect(page).toHaveURL(/#\/unit\/a1-me-and-you/)
})

test('the unit page folds its sections and keeps Start in reach', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('/#/unit/a1-greetings')
  const words = page.getByRole('button', { name: /^Words/, expanded: false })
  await expect(words).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tip', expanded: true })).toBeVisible()
  await words.click()
  await expect(page.getByRole('button', { name: /^Words/, expanded: true })).toBeVisible()
  await page.getByRole('button', { name: /^Start/ }).click()
  await expect(page).toHaveURL(/#\/lesson\?u=a1-greetings&k=words-1/)
  expect(ignoreFonts(problems)).toEqual([])
})

test('the Practice tab gathers review, games and extras on one screen', async ({ page }) => {
  const problems = watchConsole(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/practice')
  for (const name of [/Quick play/, /Did you know\?/, /Persian idioms/, /Alphabet/, /Persian is not Arabic/]) {
    await expect(page.getByRole('link', { name })).toBeVisible()
  }
  await expect(page.getByText('Word of the day')).toBeVisible()
  // No scrolling on a 390×844 phone (a string: the e2e tsconfig has no DOM types).
  expect(await page.evaluate('document.documentElement.scrollHeight <= innerHeight + 1')).toBe(true)
  await page.getByRole('link', { name: /Quick play/ }).click()
  await expect(page).toHaveURL(/#\/quick\?mode=guess/)
  expect(ignoreFonts(problems)).toEqual([])
})

for (const path of ['/practice', '/alphabet', '/words', '/progress', '/settings', '/unit/a1-family', '/unit/b1-travel', '/nope']) {
  test(`${path} renders without console errors`, async ({ page }) => {
    const problems = watchConsole(page)
    await page.goto('/#' + path)
    await expect(page.locator('main h1, main h2').first()).toBeVisible()
    expect(ignoreFonts(problems)).toEqual([])
  })
}

test('alphabet lists all 32 letters', async ({ page }) => {
  await page.goto('/#/alphabet')
  await expect(page.getByRole('list', { name: 'All letters' }).getByRole('listitem')).toHaveCount(32)
})

test('a full lesson can be completed', async ({ page }) => {
  test.setTimeout(120_000)
  const problems = watchConsole(page)
  await page.goto('/#/settings')
  await page.getByRole('button', { name: 'Lessons', expanded: false }).click()
  await page.getByLabel(/Relaxed mode/).check()
  await page.goto('/#/lesson?alpha=0')
  // Learn from mistakes: after a wrong answer the right option is highlighted, so remember it.
  const known = new Map<string, string>()
  const keyOf = async () => {
    const prompt = page.locator('.ex .prompt, .ex .passage-wrap')
    return (await page.locator('.kicker').innerText()) + '|' + ((await prompt.count()) ? await prompt.first().innerText() : '')
  }
  for (let step = 0; step < 300; step++) {
    if (await page.getByRole('heading', { name: 'Lesson complete' }).isVisible()) break
    const cont = page.getByRole('button', { name: 'Continue' })
    if (await cont.isVisible()) {
      const right = page.locator('.choice.right')
      if (await right.count()) known.set(await keyOf(), (await right.innerText()).replace(/^\d+\s*/, ''))
      await cont.click()
      continue
    }
    const choices = page.locator('.choice:not([disabled])')
    if (await choices.count()) {
      const want = known.get(await keyOf())
      const target = want ? choices.filter({ hasText: want }).first() : choices.first()
      await ((await target.count()) ? target : choices.first()).click()
      await page.getByRole('button', { name: 'Check' }).click()
      continue
    }
    const tiles = page.locator('.mt:not([disabled])')
    if (await tiles.count()) {
      // Brute-force the matching pairs: try each left tile against each right tile.
      const left = page.locator('.match .col').first().locator('.mt:not([disabled])')
      const right = page.locator('.match .col').nth(1).locator('.mt:not([disabled])')
      outer: for (let i = 0; i < (await left.count()); i++) {
        for (let j = 0; j < (await right.count()); j++) {
          const before = await right.count()
          await left.nth(i).click()
          await right.nth(j).click()
          await page.waitForTimeout(80)
          if ((await right.count()) < before) break outer
        }
      }
      continue
    }
  }
  await expect(page.getByRole('heading', { name: 'Lesson complete' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page).toHaveURL(/#\/alphabet/)
  expect(ignoreFonts(problems)).toEqual([])
})

/** The browser's service worker container (typed here because the e2e tsconfig has no DOM lib). */
type SW = { serviceWorker: { ready: Promise<unknown>; controller: unknown } }

test('works offline after the first visit', async ({ page, context }) => {
  const problems = watchConsole(page)
  await page.goto('/')
  await page.evaluate(async () => { await (navigator as unknown as SW).serviceWorker.ready })
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!(navigator as unknown as SW).serviceWorker.controller)).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: /Learn to read, speak and understand Persian/ })).toBeVisible()
  await page.goto('/#/unit/b2-news')
  await expect(page.locator('main h1').first()).toBeVisible()
  await page.goto('/#/lesson?u=a1-food&k=words-1')
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible()
  await context.setOffline(false)
  expect(ignoreFonts(problems).filter((p) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(p))).toEqual([])
})

test('has a valid web app manifest', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest')
  expect(res.ok()).toBe(true)
  const m = await res.json()
  expect(m.name).toContain('PersianMeow')
  expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
})

test('the 3-second challenge runs out and reveals the answer', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('/#/quick?mode=guess')
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.locator('.opt')).toHaveCount(3)
  await expect(page.getByText('Time is up!')).toBeVisible({ timeout: 6000 })
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText(/^2 of 10/)).toBeVisible()
  expect(ignoreFonts(problems)).toEqual([])
})

test('visitors from Instagram get the "Comment MEOW" welcome, once dismissed it stays hidden', async ({ page }) => {
  await page.goto('/?from=instagram#/')
  await expect(page.getByText('“Comment MEOW” brought you here 🐱')).toBeVisible()
  await page.getByRole('button', { name: 'Hide this' }).click()
  await page.goto('/#/')
  await expect(page.getByText('“Comment MEOW” brought you here 🐱')).toHaveCount(0)
})

test('the dialogue player toggles the script and lets you take a part', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('/#/unit/a2-home')
  await page.getByRole('button', { name: 'Dialogue', expanded: false }).click()
  const dlg = page.locator('.dlg').first()
  await expect(dlg.locator('.cast-avatar, .avatar').first()).toBeVisible()
  await dlg.getByLabel('Persian script').uncheck()
  await expect(dlg.locator('.tr-only').first()).toBeVisible()
  await dlg.getByLabel('Persian script').check()
  const part = dlg.getByLabel('Your part')
  if (await part.count()) await expect(part.locator('option')).not.toHaveCount(1)
  expect(ignoreFonts(problems)).toEqual([])
})

test('the skip link moves focus to the page content', async ({ page }) => {
  await page.goto('/#/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await expect(page).toHaveURL(/#\/$/)
})

test('the Culture and For-couples tracks are open from the start', async ({ page }) => {
  const problems = watchConsole(page)
  await toPath(page)
  await page.getByRole('button', { name: 'Culture' }).click()
  await expect(page.getByRole('heading', { name: /Culture/ })).toBeVisible()
  await expect(page.locator('.node[aria-current="step"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'For couples' }).click()
  await expect(page.getByRole('heading', { name: /For couples/ })).toBeVisible()
  await page.getByRole('button', { name: /Meeting your partner's family/ }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Read the unit' }).click()
  await expect(page).toHaveURL(/#\/unit\/couples-meet-family/)
  await page.getByRole('button', { name: 'Dialogue', expanded: false }).click()
  await expect(page.locator('.dlg .cast-avatar, .dlg .avatar').first()).toBeVisible()
  await page.goto('/#/persian-not-arabic')
  await expect(page.getByRole('heading', { name: 'Persian is not Arabic' })).toBeVisible()
  expect(ignoreFonts(problems)).toEqual([])
})

test('reading a new "Did you know?" fact earns a heart', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('/#/')
  await page.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.endsWith(':v1'))
    const p = k ? JSON.parse(localStorage.getItem(k)!) : null
    if (p) { p.hearts = 2; p.heartsDay = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5); localStorage.setItem(k!, JSON.stringify(p)) }
  })
  await page.goto('/#/practice')
  await page.getByRole('link', { name: /Did you know\?/ }).click()
  await expect(page).toHaveURL(/#\/did-you-know/)
  await expect(page.getByRole('heading', { name: 'Did you know?' })).toBeVisible()
  await expect(page.getByText(/\+1 heart!|Hearts are full/)).toBeVisible({ timeout: 8000 })
  await page.getByRole('button', { name: 'Next fact' }).click()
  await expect(page.getByText(/1 of \d+ read/)).toBeVisible()
  expect(ignoreFonts(problems)).toEqual([])
})

test('Pishi acts out an idiom and learning it earns a heart', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('/#/')
  await page.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.endsWith(':v1'))
    const p = k ? JSON.parse(localStorage.getItem(k)!) : null
    if (p) { p.hearts = 2; p.heartsDay = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5); localStorage.setItem(k!, JSON.stringify(p)) }
  })
  await page.goto('/#/practice')
  await page.getByRole('link', { name: /Persian idioms/ }).click()
  await expect(page.getByRole('heading', { name: 'Persian idioms' })).toBeVisible()
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('heading', { name: /Word for word/ })).toBeVisible({ timeout: 8000 })
  await page.getByRole('button', { name: 'Skip to the meaning' }).click()
  await expect(page.getByRole('heading', { name: /What it really means/ })).toBeVisible()
  await expect(page.getByText(/\+1 heart!|Hearts are full/)).toBeVisible()
  await expect(page.getByText(/1 of \d+ learned/)).toBeVisible()
  await expect(page.getByText('Rude: only with close friends.')).toHaveCount(0)
  expect(ignoreFonts(problems)).toEqual([])
})

/** True when the page needs no scrolling on the current viewport (a string: the e2e tsconfig has no DOM types). */
const fitsScreen = (page: Page) => page.evaluate('document.documentElement.scrollHeight <= innerHeight + 1')

test('Words fits one phone screen: search and levels stay put, the list scrolls inside', async ({ page }) => {
  const problems = watchConsole(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/words')
  await expect(page.getByText(/The dictionary adds \d+ common words/)).toBeVisible()
  expect(await fitsScreen(page)).toBe(true)
  const list = page.getByRole('region', { name: 'Word list' })
  await expect(list).toBeVisible()
  expect(await page.evaluate('(() => { const el = document.querySelector(".scroller"); return el.scrollHeight > el.clientHeight + 100 })()')).toBe(true)
  await page.getByLabel('Search words').fill('water')
  await expect(list.getByText(/^water\b/).first()).toBeVisible()
  await page.locator('label[for="lvl-A1"]').click()
  await expect(page.getByRole('radio', { name: 'A1' })).toBeChecked()
  await expect(page.getByLabel('Search words')).toBeInViewport()
  expect(await fitsScreen(page)).toBe(true)
  expect(ignoreFonts(problems)).toEqual([])
})

test('Progress fits one phone screen with its sections folding', async ({ page }) => {
  const problems = watchConsole(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/progress')
  await expect(page.getByRole('button', { name: /^Levels/, expanded: true })).toBeVisible()
  expect(await fitsScreen(page)).toBe(true)
  await page.getByRole('button', { name: /^Last 12 weeks/ }).click()
  await expect(page.getByRole('button', { name: /^Last 12 weeks/, expanded: false })).toBeVisible()
  expect(ignoreFonts(problems)).toEqual([])
})

test('Alphabet fits one phone screen: the path, letter tabs, and a sheet for each letter', async ({ page }) => {
  const problems = watchConsole(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/alphabet')
  await expect(page.getByRole('button', { name: /^Letters ا ب پ ت ث/ })).toBeVisible()
  expect(await fitsScreen(page)).toBe(true)
  await page.getByRole('button', { name: 'be, b' }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading', { name: 'be' })).toBeVisible()
  await sheet.getByRole('button', { name: 'Next letter' }).click()
  await expect(sheet.getByRole('heading', { name: 'pe' })).toBeVisible()
  await expect(sheet.getByText('Persian only')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(page.getByRole('button', { name: 'be, b' })).toBeFocused()
  // The tabs follow the arrow keys.
  await page.getByRole('tab', { name: 'Letters' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Vowels' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: 'Vowels' })).toBeFocused()
  await expect(page.getByRole('button', { name: 'Vowels lesson' })).toBeVisible()
  await page.getByRole('tab', { name: 'How it works' }).click()
  await expect(page.getByRole('link', { name: /Persian is not Arabic/ })).toBeVisible()
  expect(ignoreFonts(problems)).toEqual([])
})

test('Persian is not Arabic fits one phone screen and opens one section at a time', async ({ page }) => {
  const problems = watchConsole(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/persian-not-arabic')
  await expect(page.getByRole('heading', { name: 'Persian is not Arabic' })).toBeVisible()
  expect(await fitsScreen(page)).toBe(true)
  const family = page.getByRole('button', { name: /^Family words you already know/ })
  await expect(family).toHaveAttribute('aria-expanded', 'false')
  await family.click()
  await expect(family).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Same old roots, thousands of years apart.')).toBeVisible()
  expect(ignoreFonts(problems)).toEqual([])
})
