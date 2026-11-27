// Renders the 1200×630 sharing image (og:image) with Pishi for each app.
// Usage: node scripts/make-og.ts  (both apps; needs Playwright's Chromium)
// When the character cast lands, the family scene can join Pishi here; Pishi stays the mascot.
import { chromium } from '@playwright/test'
import { catSvg } from '../src/lib/cat.ts'

const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Vazirmatn:wght@500;800&display=block">'

const apps = [
  {
    out: 'public/og-image.png', collar: 'persian' as const, dir: 'ltr',
    kicker: 'Free · A1 to B2 · English & Italiano',
    title: 'Learn Persian<br>with Pishi the cat',
    sub: 'Finglish for every word, a real Persian voice, culture and dialogues.',
    fa: 'سلام! من پیشی‌ام', tr: 'salâm! man Pishi-am',
    brand: ['Persian', 'Meow'],
  },
  {
    out: 'public-begociao/og-image.png', collar: 'italian' as const, dir: 'rtl',
    kicker: 'رایگان · A1 تا B2',
    title: 'ایتالیایی یاد بگیر<br>با پیشی',
    sub: 'تلفظ هر کلمه با حروف فارسی و صدای واقعی ایتالیایی.',
    fa: 'Ciao! Sono Pishi.', tr: 'چائو! سونو پیشی',
    brand: ['Bego', 'Ciao'],
  },
]

const browser = await chromium.launch()
for (const a of apps) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.setContent(`<html dir="${a.dir}"><head>${fonts}<style>
    html,body{margin:0;width:1200px;height:630px;overflow:hidden}
    body{display:flex;align-items:center;gap:40px;padding:0 70px;box-sizing:border-box;
      background:linear-gradient(135deg,#eef3f6 0%,#d7efec 60%,#fbefd3 100%);color:#13213a;
      font-family:'Bricolage Grotesque','Vazirmatn',system-ui,sans-serif}
    .txt{flex:1;display:flex;flex-direction:column;gap:18px}
    .brand{font-size:40px;font-weight:800;align-self:flex-start}.brand span{color:#0a7b7a}
    .kicker{font:500 24px Vazirmatn,system-ui,sans-serif;color:#55667e;letter-spacing:.02em}
    h1{margin:0;font-size:72px;line-height:1.02;font-weight:800}
    p{margin:0;font:500 27px/1.4 Vazirmatn,system-ui,sans-serif;color:#2c3c55;max-width:620px}
    .cat{width:420px;display:flex;flex-direction:column;align-items:center;gap:6px}
    .bubble{background:#fff;border-radius:22px;padding:12px 22px;box-shadow:0 6px 18px rgba(19,33,58,.12);text-align:center}
    .bubble b{display:block;font:800 30px Vazirmatn,sans-serif}.bubble i{font:500 20px Vazirmatn,sans-serif;color:#55667e;font-style:normal}
    .cat svg{width:360px;height:360px}
  </style></head><body>
    <div class="txt">
      <div class="brand" dir="ltr">${a.brand[0]}<span>${a.brand[1]}</span></div>
      <div class="kicker">${a.kicker}</div>
      <h1>${a.title}</h1>
      <p>${a.sub}</p>
    </div>
    <div class="cat"><div class="bubble"><b dir="auto">${a.fa}</b><i>${a.tr}</i></div>${catSvg('wave', { collar: a.collar })}</div>
  </body></html>`)
  await page.evaluate('document.fonts.ready')
  await page.waitForTimeout(400)
  await page.screenshot({ path: a.out })
  await page.close()
  console.log('wrote', a.out)
}
await browser.close()
