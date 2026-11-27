import type { DictEntry } from './entry.ts'

/**
 * Persian script only: Arabic-block letters used by Persian, vowel marks, Persian digits, ZWNJ, spaces
 * and Persian punctuation. Arabic ي and ك are not allowed (Persian uses ی and ک).
 */
export const FA_ONLY = /^(?![^]*[يك])[ء-غف-\u0655\u0670پچژکگی۰-۹\u200c ،؛؟.!:«»()\-]+$/

/** Two entries are the same when Persian (ignoring vowel marks and ZWNJ) and English match. */
export const dictKey = (e: Pick<DictEntry, 'fa' | 'en'>) =>
  `${e.fa.replace(/[\u064b-\u065f\u0670\u200c ]/g, '')}=${e.en.toLowerCase().trim()}`
