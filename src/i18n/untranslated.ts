/**
 * Finds English words written straight into Vue templates (not through t()), which would stay
 * in English whatever language the learner picks. Used by tests/i18n.test.ts.
 */
export function untranslatedText(vueSource: string): string[] {
  const m = vueSource.match(/<template>([\s\S]*)<\/template>/)
  if (!m) return []
  const tpl = m[1]
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ') // interpolations go through t()
    .replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, '\n') // tags and their attributes (quoted values may contain >)
  return tpl
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z]{3,}/.test(s)) // a real English word
    .filter((s) => !/^(XP|A1|A2|B1|B2)$/.test(s))
}
