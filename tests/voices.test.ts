import { describe, expect, it } from 'vitest'
import { ALL_UNITS } from '@/content/course.ts'
import { dialogueVoices, genderOf, genderOfVoice } from '@/content/speakers.ts'
import { AZURE_VOICE_GENDER, VOICES, clipKey, NARRATOR } from '@/content/voices.ts'
import { audioKey } from '@/lib/audioKey.ts'
import { APP } from '@/app.ts'
import type { Unit } from '@/content/types.ts'

const unit = (id: string, lines: [string, string][]): Unit =>
  ({ id, dialogue: lines.map(([who, fa]) => ({ who, fa, tr: '', en: '' })) }) as unknown as Unit

describe('speaker genders', () => {
  it('knows names, titles and per-unit roles', () => {
    expect(genderOf('Neda')).toBe('f')
    expect(genderOf('Ali')).toBe('m')
    expect(genderOf('Mr Rostami')).toBe('m')
    expect(genderOf('Mrs Sadri')).toBe('f')
    expect(genderOf('Dr Sohrabi')).toBe('f')
    expect(genderOf('Somebody')).toBeUndefined()
  })

  it('gives each speaker a voice of their own gender, and two same-gender speakers different voices', () => {
    // The bug Shabnaz found: Neda answered Ali in a male voice.
    const past = dialogueVoices(unit('x', [['Ali', 'سلام ندا!'], ['Neda', 'سلام!']]))
    expect(past.get('Ali')).toBe('m')
    expect(past.get('Neda')).toBe('f')
    const twoWomen = dialogueVoices(unit('x', [['Maryam', 'a'], ['Sara', 'b']]))
    expect(twoWomen.get('Maryam')).toBe('f')
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
