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
