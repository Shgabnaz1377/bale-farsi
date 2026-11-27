import type { Unit } from './types.ts'
import { CAST } from './cast.ts'

export type Gender = 'f' | 'm'

/**
 * Who speaks in the dialogues, so every line gets a voice of the right gender.
 * PersianMeow's speakers are the 21 people of the cast (src/content/cast.ts, from characters.json),
 * the track family included (mum Leila, dad Babak, the learners Aria and Venus).
 * Bego Ciao keeps its Italian names (and its Sara); a few role nouns with no gender (Cliente, Agente…) are set per unit.
 * scripts/check-voices.ts fails if a dialogue speaker is missing here, or a PersianMeow speaker is not in the cast.
 */
const NAMES: Record<string, Gender> = {
  // The PersianMeow cast
  ...Object.fromEntries(CAST.map((c) => [c.name, c.gender])),
  // Bego Ciao: the Iranian learners in Italy (Sara, Arash and Babak are cast names too)
  Nima: 'm', Omid: 'm', Reza: 'm',
  // Italian names (Bego Ciao)
  Davide: 'm', Luca: 'm', Paolo: 'm',
  Chiara: 'f', Elena: 'f', Francesca: 'f', Giulia: 'f', Marta: 'f',
  // Italian role nouns whose ending shows the gender
  Cameriere: 'm', Commesso: 'm', Fruttivendolo: 'm', Signore: 'm',
  Direttrice: 'f', Impiegata: 'f', Professoressa: 'f', Segretaria: 'f',
}

/**
 * Roles with no grammatical gender, chosen so each dialogue has two different voices.
 * TODO(Shabnaz): check these choices.
 */
const BY_UNIT: Record<string, Gender> = {
  'a2-home:Agente': 'm',
  'a2-shopping:Cliente': 'f',
  'a2-health:Farmacista': 'f',
  'a2-health:Cliente': 'm',
  'b1-italian-culture:Ospite': 'm',
}

/** The gender of a dialogue speaker, or undefined if nobody has said (the voice check then fails). */
export function genderOf(who: string, unitId?: string): Gender | undefined {
  if (unitId && BY_UNIT[`${unitId}:${who}`]) return BY_UNIT[`${unitId}:${who}`]
  if (NAMES[who]) return NAMES[who]
  if (/^(Mr|Mister|Agha|Signor)\b/i.test(who)) return 'm'
  if (/^(Mrs|Ms|Miss|Khanom|Signora)\b/i.test(who)) return 'f'
  return undefined
}

/**
 * Voice of each dialogue speaker: 'f' or 'm', and 'f2' / 'm2' for a second speaker of the same gender
 * in the same dialogue (the same voice at a different pitch, so two people still sound like two people).
 */
export type VoiceId = 'f' | 'm' | 'f2' | 'm2'

export function dialogueVoices(unit: Unit): Map<string, VoiceId> {
  const voices = new Map<string, VoiceId>()
  const used: Record<Gender, number> = { f: 0, m: 0 }
  for (const line of unit.dialogue ?? []) {
    if (voices.has(line.who)) continue
    const g = genderOf(line.who, unit.id) ?? 'f'
    voices.set(line.who, used[g]++ === 0 ? g : (`${g}2` as VoiceId))
  }
  return voices
}

export const genderOfVoice = (v: VoiceId): Gender => (v[0] as Gender)
