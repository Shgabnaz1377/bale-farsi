import { describe, expect, it } from 'vitest'
import { DICTIONARY, DICTIONARY_ALL, DICTIONARY_ERRORS } from '@/content/dictionary/index.ts'
import { parseDictionary } from '@/content/dictionary/entry.ts'
import { FA_ONLY, dictKey } from '@/content/dictionary/rules.ts'
import { ALL_WORDS } from '@/content/course.ts'
import { INCLUDE_DICTIONARY_AUDIO, allSpeech } from '@/content/speech.ts'
import { vocalize } from '@/lib/vocalize.ts'
import { APP } from '@/app.ts'
import { buildIndex, foldFa, foldLatin, searchRows, translateUrl } from '@/lib/wordSearch.ts'

const rate = (items: { fa: string; tr: string }[]) => items.filter((i) => vocalize(i.fa, i.tr) !== null).length / items.length

describe('dictionary content', () => {
  it('reads every line of every topic file', () => expect(DICTIONARY_ERRORS).toEqual([]))

  it('has at least 3,000 entries', () => expect(DICTIONARY.length).toBeGreaterThanOrEqual(3000))

  it('has no repeated Persian + English pair', () => {
    const seen = new Set<string>()
    const dup = DICTIONARY_ALL.map(dictKey).filter((k) => (seen.has(k) ? true : (seen.add(k), false)))
    expect(dup).toEqual([])
  })

  it('gives every entry Persian, Finglish and English', () => {
    expect(DICTIONARY.filter((e) => !e.fa.trim() || !e.tr.trim() || !e.en.trim())).toEqual([])
  })

  it('writes Persian in Persian letters only', () => {
    expect(DICTIONARY.filter((e) => !FA_ONLY.test(e.fa)).map((e) => e.fa)).toEqual([])
    expect(DICTIONARY.filter((e) => e.ex && !FA_ONLY.test(e.ex.fa)).map((e) => e.ex!.fa)).toEqual([])
  })

  it('gives an example sentence to at least 1,000 words', () => {
    expect(DICTIONARY.filter((e) => e.ex).length).toBeGreaterThanOrEqual(1000)
  })

  it('lines up the Finglish with the script for at least 97% of words and examples', () => {
    expect(rate(DICTIONARY)).toBeGreaterThanOrEqual(0.97)
    expect(rate(DICTIONARY.flatMap((e) => (e.ex ? [e.ex] : [])))).toBeGreaterThanOrEqual(0.97)
  })

  it('is recorded for PersianMeow (and never for Bego Ciao)', () => {
    const fromDict = allSpeech().filter((s) => s.where.startsWith('Dictionary')).length
    expect(fromDict > 0).toBe(INCLUDE_DICTIONARY_AUDIO && APP.id === 'persianmeow')
  })
})

describe('dictionary file format', () => {
  it('reads alternatives, part of speech, stem and example', () => {
    const { entries, errors } = parseDictionary('# c\nرفتن | raftan | to go; to leave | v | رو/rav | من می\u200cروم. | man miravam. | I go.\n')
    expect(errors).toEqual([])
    expect(entries).toEqual([{ fa: 'رفتن', tr: 'raftan', en: 'to go', alt: ['to leave'], pos: 'v', stem: { fa: 'رو', tr: 'rav' }, ex: { fa: 'من می\u200cروم.', tr: 'man miravam.', en: 'I go.' } }])
  })
  it('reports malformed lines', () => {
    expect(parseDictionary('آب | âb\nآب | âb | water | x\nآب | âb | water | n | | آب.').errors).toHaveLength(3)
  })
})

describe.runIf(APP.id === 'persianmeow')('word search', () => {
  const index = buildIndex(ALL_WORDS, DICTIONARY)
  const find = (q: string) => searchRows(index, q)

  it('folds accents, ZWNJ and vowel marks', () => {
    expect(foldLatin('Ketâb-e man')).toBe('ketab e man')
    expect(foldFa('کتاب\u200cها')).toBe(foldFa('کتابها'))
    expect(foldFa('ک\u0650تاب')).toBe('کتاب')
    expect(foldFa('كتاب')).toBe('کتاب')
  })

  it.each(['water', 'âb', 'ab', 'آب'])('finds water for "%s"', (q) => {
    expect(find(q).slice(0, 5).some((r) => r.fa === 'آب')).toBe(true)
  })

  it('finds a book by Finglish without accents and by Persian', () => {
    expect(find('ketab')[0].fa).toBe('کتاب')
    expect(find('کتاب')[0].fa).toBe('کتاب')
  })

  it('keeps course words with their level and marks dictionary-only words', () => {
    const rows = find('water')
    expect(rows.find((r) => r.fa === 'آب')?.level).toBeDefined()
    expect(index.some((r) => r.row.dict && !r.row.level)).toBe(true)
    expect(index.filter((r) => !r.row.dict).length).toBe(ALL_WORDS.length)
  })

  it('searches verbs without "to"', () => expect(find('go').slice(0, 3).some((r) => r.fa === 'رفتن')).toBe(true))

  it('finds nothing for nonsense and links to Google Translate', () => {
    expect(find('zzqxwv')).toEqual([])
    expect(translateUrl('zzqxwv')).toBe('https://translate.google.com/?sl=en&tl=fa&text=zzqxwv&op=translate')
    expect(translateUrl('آب')).toContain('sl=fa&tl=en&text=%D8%A2%D8%A8')
  })
})
