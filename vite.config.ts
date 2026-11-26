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
    title: 'PersianMeow · Learn Persian',
    short: 'PersianMeow',
    description: 'Learn Persian (Farsi) from A1 to B2, with Finglish and recorded audio for every word.',
    lang: 'en',
    dir: 'ltr',
    publicDir: 'public',
    outDir: 'dist',
  },
  begociao: {
    title: 'Bego Ciao · بگو چائو · یادگیری ایتالیایی',
    short: 'Bego Ciao',
    description: 'ایتالیایی را از A1 تا B2 با پیشی، گربهٔ ایرانی، یاد بگیر: تلفظ هر کلمه با حروف فارسی و صدای ضبط‌شده.',
    lang: 'fa',
    dir: 'rtl',
    publicDir: 'public-begociao',
    outDir: 'dist-begociao',
  },
} as const

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
            .replace(/<title>.*<\/title>/, `<title>${app.title}</title>`)
            .replace(/<html lang="en">/, `<html lang="${app.lang}" dir="${app.dir}">`)
            .replace(/content="PersianMeow"/g, `content="${app.short}"`)
            .replace(/(<meta name="description" content=")[^"]*"/, `$1${app.description}"`),
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
          navigateFallback: 'index.html',
          // Bego Ciao lives in a subfolder of PersianMeow's site; PersianMeow's worker must leave it alone.
          navigateFallbackDenylist: appId === 'persianmeow' ? [/\/begociao(\/|$)/] : [],
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
