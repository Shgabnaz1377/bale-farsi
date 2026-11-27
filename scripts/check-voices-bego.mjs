// Runs the voice check for Bego Ciao (APP=begociao) in a way that works on every OS.
import { spawnSync } from 'node:child_process'
const r = spawnSync(process.execPath, ['scripts/check-voices.ts'], { stdio: 'inherit', env: { ...process.env, APP: 'begociao' } })
process.exitCode = r.status ?? 1
