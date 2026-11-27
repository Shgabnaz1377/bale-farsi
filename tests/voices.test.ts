import { describe, expect, it } from 'vitest'
import { ALL_UNITS } from '@/content/course.ts'
import { dialogueVoices, genderOf, genderOfVoice } from '@/content/speakers.ts'
import { AZURE_VOICE_GENDER, VOICES, clipKey, NARRATOR } from '@/content/voices.ts'
import { audioKey } from '@/lib/audioKey.ts'
import { APP } from '@/app.ts'
import type { Unit } from '@/content/types.ts'
import { TRACK_UNITS } from '@/content/tracks/index.ts'
import { CAST } from '@/content/cast.ts'
import { sentenceSpeaker, sentenceVoice } from '@/content/sentenceSpeakers.ts'
import { allSpeech } from '@/content/speech.ts'
import CHARACTERS from '@/content/characters.json'

const unit = (id: string, lines: [string, string][]): Unit =>
  ({ id, dialogue: lines.map(([who, fa]) => ({ who, fa, tr: '', en: '' })) }) as unknown as Unit

describe('speaker genders', () => {
  it('knows names, titles and per-unit roles', () => {
    expect(genderOf('Artemis')).toBe('f')
    expect(genderOf('Ali')).toBe('m')
    expect(genderOf('Mr Rostami')).toBe('m')
    expect(genderOf('Mrs Sadri')).toBe('f')
    expect(genderOf('Kourosh')).toBe('m')
    expect(genderOf('Somebody')).toBeUndefined()
  })

  it('gives each speaker a voice of their own gender, and two same-gender speakers different voices', () => {
    // The bug Shabnaz found: a woman (then Neda, now Saba) answered Ali in a male voice.
    const past = dialogueVoices(unit('x', [['Ali', 'سلام صبا!'], ['Saba', 'سلام!']]))
    expect(past.get('Ali')).toBe('m')
    expect(past.get('Saba')).toBe('f')
    const twoWomen = dialogueVoices(unit('x', [['Artemis', 'a'], ['Sara', 'b']]))
    expect(twoWomen.get('Artemis')).toBe('f')
    expect(twoWomen.get('Sara')).toBe('f2')
  })

  it('every dialogue line in the course gets a voice of the speaker\'s gender', () => {
    for (const u of ALL_UNITS) {
      const voices = dialogueVoices(u)
      for (const d of u.dialogue ?? []) {
        const g = genderOf(d.who, u.id)
        expect(g, `${u.id}: ${d.who} has no gender`).toBeDefined()
        expect(genderOfVoice(voices.get(d.who)!), `${u.id}: ${d.who}`).toBe(g)
      }
    }
  })
})

describe('voice table', () => {
  it('uses Azure voices of the gender each id stands for', () => {
    for (const [id, v] of Object.entries(VOICES)) {
      expect(AZURE_VOICE_GENDER[v.name], `${id} → ${v.name}`).toBe(id[0])
    }
  })

  it('keeps the narrator\'s file names and gives other voices their own', () => {
    expect(clipKey('سلام')).toBe(audioKey('سلام'))
    const other = NARRATOR === 'm' ? 'f' : 'm'
    expect(clipKey('سلام', other)).not.toBe(audioKey('سلام'))
    expect(APP.id === 'persianmeow' ? NARRATOR : 'm').toBe('m') // Persian narration is Farid, by choice
  })
})

describe.runIf(APP.id === 'persianmeow')('the cast', () => {
  const sheet = new Map((CHARACTERS as { name: string; gender: string; voice: string }[]).map((c) => [c.name, c]))
  const g = (s: string) => (s === 'female' ? 'f' : 'm')

  it('matches characters.json', () => {
    expect(CAST.map((c) => c.name).sort()).toEqual([...sheet.keys()].sort())
    for (const c of CAST) expect(c.gender, c.name).toBe(g(sheet.get(c.name)!.gender))
  })

  it('speaks every dialogue, each speaker in the voice gender characters.json gives them', () => {
    for (const u of [...ALL_UNITS, ...TRACK_UNITS]) {
      const voices = dialogueVoices(u)
      for (const d of u.dialogue ?? []) {
        expect(sheet.has(d.who), `${u.id}: ${d.who} is not in the cast`).toBe(true)
        expect(genderOfVoice(voices.get(d.who)!), `${u.id}: ${d.who}`).toBe(g(sheet.get(d.who)!.voice))
      }
    }
  })

  it('says every lesson sentence in a voice of the speaker\'s gender', () => {
    let n = 0
    for (const u of [...ALL_UNITS, ...TRACK_UNITS]) {
      for (const p of [...u.sentences, ...u.grammar.examples]) {
        const c = sentenceSpeaker(p, u.id)
        if (!p.fa.trim().includes(' ')) { expect(c, p.fa).toBeUndefined(); continue }
        expect(c, `${u.id}: ${p.fa}`).toBeDefined()
        const v = sentenceVoice(p, u.id)
        expect(genderOfVoice(v), `${u.id}: ${p.fa} (${c!.name})`).toBe(c!.gender)
        expect(AZURE_VOICE_GENDER[VOICES[v].name], `${u.id}: ${p.fa}`).toBe(c!.gender)
        n++
      }
    }
    expect(n).toBeGreaterThan(500)
  })

  it('picks the speaker from the sentence and the theme, the same every time', () => {
    const p = (fa: string, tr: string) => ({ fa, tr })
    expect(sentenceSpeaker(p('من سارا هستم.', 'man Sârâ hastam.'), 'a1-me-and-you')?.name).toBe('Sara')
    expect(sentenceSpeaker(p('من مادرِ سارا هستم.', 'man mâdar-e Sârâ hastam.'), 'a1-family')?.gender).toBe('f')
    expect(sentenceSpeaker(p('من پدرِ علی هستم.', 'man pedar-e Ali hastam.'), 'a1-family')?.gender).toBe('m')
    expect(sentenceSpeaker(p('من آقای کریمی هستم.', 'man âghâ-ye Karimi hastam.'), 'a1-family')?.gender).toBe('m')
    expect(['Roya', 'Saba']).toContain(sentenceSpeaker(p('تابستان به شمال رفتیم.', 'tâbestân be shomâl raftim.'), 'a2-past')?.name)
    expect(sentenceSpeaker(p('بازار تبریز بزرگ است.', 'bâzâr-e Tabriz bozorg ast.'), 'a2-city')?.name).toBe('Sahel')
    expect(sentenceSpeaker(p('سفره را بچین.', 'sofre râ bechin.'), 'culture-haftsin')?.name).toBe('Kourosh')
    expect(['Hasti', 'Arshia', 'Aseman', 'Dariush']).toContain(sentenceSpeaker(p('این آهنگ خفنه.', 'in âhang khafane.'), 'b2-youth-slang')?.name)
    // A woman's line in a theme with only a man (Kourosh) goes to a woman of the general cast.
    expect(sentenceSpeaker(p('من مادربزرگ هستم.', 'man mâdarbozorg hastam.'), 'b2-history')?.gender).toBe('f')
    const a = sentenceSpeaker(p('هوا امروز خوب است.', 'havâ emruz khub ast.'), 'a2-weather')
    expect(sentenceSpeaker(p('هوا امروز خوب است.', 'havâ emruz khub ast.'), 'a2-weather')).toBe(a)
    expect(sentenceSpeaker(p('سلام', 'salâm'), 'a1-greetings')).toBeUndefined()
  })

  it('records women\'s sentences under the female key and men\'s under the narrator\'s', () => {
    const items = allSpeech()
    for (const u of [...ALL_UNITS, ...TRACK_UNITS]) {
      for (const s of u.sentences) {
        const v = sentenceVoice(s, u.id)
        expect(items.some((i) => i.key === clipKey(s.fa.trim(), v) && i.voice === v), `${u.id}: ${s.fa}`).toBe(true)
        if (v === 'm') expect(clipKey(s.fa, v)).toBe(audioKey(s.fa))
        else expect(clipKey(s.fa, v)).toBe(audioKey(`f|${s.fa}`))
      }
    }
  })
})
