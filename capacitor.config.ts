import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Two native apps from one codebase. Default: PersianMeow (android/, ios/).
 * APP=begociao: Bego Ciao, with its own native projects under native/begociao/ and its own build (dist-begociao).
 * Every lesson and audio clip is bundled, so both apps work offline.
 */
const bego = process.env.APP === 'begociao'

const config: CapacitorConfig = bego
  ? {
      appId: 'com.shabnazghaffari.begociao',
      appName: 'Bego Ciao',
      webDir: 'dist-begociao',
      backgroundColor: '#eef3f6',
      android: { path: 'native/begociao/android', allowMixedContent: false },
      ios: { path: 'native/begociao/ios', contentInset: 'never' },
    }
  : {
      appId: 'com.shabnazghaffari.persianmeow',
      appName: 'PersianMeow',
      webDir: 'dist',
      backgroundColor: '#eef3f6',
      android: { allowMixedContent: false },
      ios: { contentInset: 'never' },
    }

export default config
