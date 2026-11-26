import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.shabnazghaffari.bale',
  appName: 'Bale',
  // The same production build as the website; every lesson is bundled, so the apps work offline.
  webDir: 'dist',
  backgroundColor: '#eef3f6',
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'never',
  },
}

export default config
