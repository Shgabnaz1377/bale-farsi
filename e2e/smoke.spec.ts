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

test('home shows the course and starts a lesson', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Learn to read, speak and understand Persian/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /A1/ }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Start at A1' }).click()
  await expect(page).toHaveURL(/#\/lesson\?u=a1-greetings&k=words-1/)
  await expect(page.getByRole('button', { name: 'Check' })).toBeDisabled()
  await page.locator('.choice').first().click()
  await page.getByRole('button', { name: 'Check' }).click()
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
  expect(ignoreFonts(problems)).toEqual([])
})

for (const path of ['/alphabet', '/words', '/progress', '/settings', '/unit/a1-family', '/unit/b1-travel', '/nope']) {
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
  const dlg = page.locator('.dlg').first()
  await expect(dlg.locator('.avatar').first()).toBeVisible()
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
  await page.goto('/#/')
  await expect(page.getByRole('heading', { name: /Culture/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /For couples/ })).toBeVisible()
  await page.getByRole('link', { name: /Meeting your partner's family/ }).click()
  await expect(page).toHaveURL(/#\/unit\/couples-meet-family/)
  await expect(page.locator('.dlg .avatar').first()).toBeVisible()
  await page.goto('/#/persian-not-arabic')
  await expect(page.getByRole('heading', { name: 'Persian is not Arabic' })).toBeVisible()
  expect(ignoreFonts(problems)).toEqual([])
})
