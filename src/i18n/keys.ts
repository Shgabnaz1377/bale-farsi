/** Finds every English UI string passed to t() / tn() in some source files (used by the i18n test). */
export function extractKeys(sources: string[]): string[] {
  const keys = new Set<string>()
  for (const s of sources) {
    for (const m of s.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(m[1].replace(/\\'/g, "'"))
    for (const m of s.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.add(m[1])
    for (const m of s.matchAll(/\btn\([^,]+,\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'/g)) {
      keys.add(m[1])
      keys.add(m[2])
    }
  }
  // Labels translated indirectly with t(variable).
  for (const k of ['alone', 'end', 'middle', 'start', 'learned', 'learning']) keys.add(k)
  return [...keys].sort()
}
