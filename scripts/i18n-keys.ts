// Prints every English UI string passed to t() / tn() in src/ (outside content/), one per line.
// Usage: node scripts/i18n-keys.ts
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { extractKeys } from '../src/i18n/keys.ts'

const files: string[] = []
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) {
      if (f !== 'content') walk(p)
    } else if (/\.(vue|ts)$/.test(f)) files.push(readFileSync(p, 'utf8'))
  }
}
walk('src')
console.log(extractKeys(files).join('\n'))
