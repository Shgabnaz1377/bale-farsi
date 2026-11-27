import { APP } from '../app.ts'
import { audioKey } from '../lib/audioKey.ts'
import type { Gender, VoiceId } from './speakers.ts'

/**
 * Which Azure voice says what. Each voice's real gender is written down here, and
 * scripts/check-voices.ts fails if a female speaker would get a male voice or the other way round.
 *
 * Persian: Farid (male) narrates, as chosen by ear by a native speaker; Dilara (female) speaks for women.
 * Italian: Elsa (female) narrates; Diego (male) speaks for men.
 * A second speaker of the same gender in one dialogue gets the same voice at a different pitch.
 */
export interface AzureVoice {
  name: string
  gender: Gender
  /** SSML prosody pitch, e.g. '+8%'. */
  pitch: string
}

const PERSIAN: Record<VoiceId, AzureVoice> = {
  m: { name: 'fa-IR-FaridNeural', gender: 'm', pitch: '0%' },
  m2: { name: 'fa-IR-FaridNeural', gender: 'm', pitch: '-12%' },
  f: { name: 'fa-IR-DilaraNeural', gender: 'f', pitch: '0%' },
  f2: { name: 'fa-IR-DilaraNeural', gender: 'f', pitch: '+10%' },
}
const ITALIAN: Record<VoiceId, AzureVoice> = {
  f: { name: 'it-IT-ElsaNeural', gender: 'f', pitch: '0%' },
  f2: { name: 'it-IT-ElsaNeural', gender: 'f', pitch: '+10%' },
  m: { name: 'it-IT-DiegoNeural', gender: 'm', pitch: '0%' },
  m2: { name: 'it-IT-DiegoNeural', gender: 'm', pitch: '-12%' },
}

/** The real gender of each Azure voice name used above (checked against the tables). */
export const AZURE_VOICE_GENDER: Record<string, Gender> = {
  'fa-IR-FaridNeural': 'm',
  'fa-IR-DilaraNeural': 'f',
  'it-IT-ElsaNeural': 'f',
  'it-IT-DiegoNeural': 'm',
}

export const VOICES: Record<VoiceId, AzureVoice> = APP.target === 'it' ? ITALIAN : PERSIAN

/** The voice that reads words, sentences and everything that is not a dialogue line. */
export const NARRATOR: VoiceId = APP.target === 'it' ? 'f' : 'm'

/**
 * The audio file name for a text in a voice. The narrator's clips keep the plain audioKey(text), so all
 * existing clips and lookups stay valid; other voices get their own file, so the same sentence said by a
 * woman and by a man are two different recordings.
 */
export const clipKey = (text: string, voice: VoiceId = NARRATOR) =>
  voice === NARRATOR ? audioKey(text) : audioKey(`${voice}|${text}`)
