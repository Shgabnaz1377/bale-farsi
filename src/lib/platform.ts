import { Capacitor } from '@capacitor/core'

/** True inside the Android or iPhone app (Capacitor), false on the web. */
export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() as 'web' | 'android' | 'ios'
