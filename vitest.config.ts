import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// `vitest run` tests PersianMeow; `vitest run --mode begociao` tests Bego Ciao (same config function, same app id).
export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  }),
)
