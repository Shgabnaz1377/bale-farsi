import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Two apps from one codebase: `vite build` is PersianMeow, `vite build --mode begociao` is Bego Ciao.
 * Each gets its own name, icons and audio (publicDir), output folder and web app manifest.
 */
const APPS = {
  persianmeow: {
    title: 'PersianMeow · Learn Persian (Farsi) free, A1 to B2',
    short: 'PersianMeow',
    description: 'Learn Persian (Farsi) free, from A1 to B2: Finglish and a real Persian voice for every word, dialogues, culture and a track for couples. In English and Italian (impara il persiano).',
    lang: 'en',
    dir: 'ltr',
    publicDir: 'public',
    outDir: 'dist',
    url: 'https://shgabnaz1377.github.io/persianmeow/',
    ogTitle: 'PersianMeow · Learn Persian with Pishi the cat',
    keywords: 'learn Persian free, learn Persian, learn Farsi, Persian course, Farsi lessons, Persian alphabet, Finglish, Persian for beginners, Persian for couples, Nowruz, PersianMeow, impara il persiano, imparare il persiano, imparare il farsi, corso di persiano gratis',
    staticHtml: `<main style="max-width:680px;margin:0 auto;padding:24px 16px;font-family:system-ui,sans-serif;line-height:1.6">
<h1>PersianMeow: learn Persian (Farsi) with Pishi the cat</h1>
<p>A free course that teaches Persian to English and Italian speakers, from A1 to B2. Every word comes with Finglish (Persian in English letters) and recorded Persian audio, so you can start before you can read the alphabet.</p>
<ul><li>The Persian alphabet: all 32 letters and their shapes</li><li>24 units: greetings, numbers, family, food, shopping, travel, work, opinions, poetry, the news</li><li>Grammar, sentence building, real dialogues and readings</li><li>Spaced review, level tests, streaks and offline use</li></ul>
<p>Also available in Italian: <i>impara il persiano</i>. Made by Shabnaz Ghaffari.</p></main>`,
  },
  begociao: {
    title: 'Bego Ciao · بگو چائو · یادگیری ایتالیایی',
    short: 'Bego Ciao',
    description: 'ایتالیایی را از A1 تا B2 با پیشی، گربهٔ ایرانی، یاد بگیر: تلفظ هر کلمه با حروف فارسی و صدای ضبط‌شده.',
    lang: 'fa',
    dir: 'rtl',
    publicDir: 'public-begociao',
    outDir: 'dist-begociao',
    url: 'https://shgabnaz1377.github.io/persianmeow/begociao/',
    ogTitle: 'Bego Ciao · بگو چائو · یادگیری زبان ایتالیایی با پیشی',
    keywords: 'یادگیری ایتالیایی, آموزش زبان ایتالیایی, زبان ایتالیایی رایگان, ایتالیایی برای فارسی زبانان, learn Italian for Persian speakers, Bego Ciao, بگو چائو',
    staticHtml: `<main dir="rtl" style="max-width:680px;margin:0 auto;padding:24px 16px;font-family:Tahoma,system-ui,sans-serif;line-height:1.8">
<h1>بگو چائو: یادگیری زبان ایتالیایی با پیشی</h1>
<p>یک دورهٔ رایگان برای فارسی‌زبان‌ها که ایتالیایی را از سطح A1 تا B2 آموزش می‌دهد. تلفظ هر کلمهٔ ایتالیایی با حروف فارسی نوشته شده و صدای ضبط‌شده دارد.</p>
<ul><li>۲۴ درس: سلام و احوال‌پرسی، اعداد، خانواده، غذا، خرید، سفر، کار، فرهنگ ایتالیا، ادبیات</li><li>دستور زبان به فارسی، ساختن جمله، گفت‌وگو و متن خواندنی</li><li>مرور فاصله‌دار، آزمون سطح و استفاده بدون اینترنت</li></ul>
<p>ساختهٔ شبناز غفاری.</p></main>`,
  },
} as const

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Canonical address, sharing previews and structured data (a free educational web app). */
function seoHead(app: (typeof APPS)[keyof typeof APPS]): string {
  const image = `${app.url}og-image.png`
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: app.short,
    alternateName: app.title,
    url: app.url,
    description: app.description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web, Android, iOS',
    inLanguage: app.lang,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    image,
    author: { '@type': 'Person', name: 'Shabnaz Ghaffari', url: 'https://www.shabnazghaffari.com/' },
  }
  return [
    `<link rel="canonical" href="${app.url}" />`,
    `<meta name="keywords" content="${esc(app.keywords)}" />`,
    `<meta name="author" content="Shabnaz Ghaffari" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(app.short)}" />`,
    `<meta property="og:title" content="${esc(app.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(app.description)}" />`,
    `<meta property="og:url" content="${app.url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(app.ogTitle)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
  ].join('\n    ')
}

export default defineConfig(({ mode }) => {
  const appId = mode === 'begociao' ? 'begociao' : 'persianmeow'
  const app = APPS[appId]
  return {
    // Relative base + hash routing: the build runs from any path (GitHub Pages, a subfolder, or inside the native app).
    base: './',
    publicDir: app.publicDir,
    define: { __APP_ID__: JSON.stringify(appId) },
    plugins: [
      vue(),
      {
        name: 'app-html',
        transformIndexHtml: (html: string) =>
          html
            .replace('<!--app-seo-->', seoHead(app))
            .replace('<!--app-static-->', app.staticHtml)
            .replace(/<title>.*<\/title>/, `<title>${app.title}</title>`)
            .replace(/<html lang="en">/, `<html lang="${app.lang}" dir="${app.dir}">`)
            .replace(/content="PersianMeow"/g, `content="${app.short}"`)
            .replace(/(<meta name="description" content=")[^"]*"/, `$1${app.description}"`),
        // A sitemap so search engines find the app's address (hash routes are one page to them).
        generateBundle(this: { emitFile: (f: { type: 'asset'; fileName: string; source: string }) => void }) {
          this.emitFile({
            type: 'asset',
            fileName: 'sitemap.xml',
            source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${app.url}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>${appId === 'persianmeow' ? `<url><loc>${app.url}learn-persian/</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>` : ''}</urlset>\n`,
          })
        },
      },
      VitePWA({
        // Registered from main.ts, and only on the web: the native apps ship every file already.
        injectRegister: null,
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: './',
          name: app.title,
          short_name: app.short,
          description: app.description,
          lang: app.lang,
          dir: app.dir,
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#eef3f6',
          theme_color: '#0a7b7a',
          categories: ['education'],
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // The whole course is in the JS bundle, so precaching the build makes every lesson work offline.
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
          // The cast's faces used by the app (idle, talking, avatar) are precached; the other moods are not used yet.
          globIgnores: ['**/node_modules/**', 'characters/*_{happy,sad,confused,shock}*.svg'],
          navigateFallback: 'index.html',
          // Bego Ciao lives in a subfolder of PersianMeow's site; PersianMeow's worker must leave it alone.
          navigateFallbackDenylist: appId === 'persianmeow' ? [/\/begociao(\/|$)/, /\/learn-persian(\/|$)/] : [],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Pronunciation clips: cached as they are played, so words you have heard work offline.
              urlPattern: ({ url }) => url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3'),
              handler: 'CacheFirst',
              options: { cacheName: `${appId}-audio`, rangeRequests: true, expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-css' },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2022',
      outDir: app.outDir,
    },
  }
})
