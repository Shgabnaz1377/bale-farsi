import { createApp } from 'vue'
import { App as NativeApp } from '@capacitor/app'
import App from './App.vue'
import { router } from './router.ts'
import { isNative } from './lib/platform.ts'
// Fonts are served from this site, not Google Fonts, so no visitor data goes to Google (GDPR).
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource/lexend/400.css'
import '@fontsource/lexend/500.css'
import '@fontsource/lexend/600.css'
import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/500.css'
import '@fontsource/vazirmatn/700.css'
import './styles/base.css'

createApp(App).use(router).mount('#app')

if (isNative) {
  // Android back button: go back inside the app, and leave it from the home screen.
  void NativeApp.addListener('backButton', ({ canGoBack }) => {
    if (router.currentRoute.value.name !== 'home' && canGoBack) router.back()
    else void NativeApp.exitApp()
  })
} else if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Web: cache the whole app so every lesson works offline, and update quietly in the background.
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}
