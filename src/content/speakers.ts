import type { Unit } from './types.ts'

export type Gender = 'f' | 'm'

/**
 * Who speaks in the dialogues, so every line gets a voice of the right gender.
 * Names keep their gender everywhere; a few role nouns that carry no gender (Cliente, Agente…) are set per unit.
 * scripts/check-voices.ts fails if a dialogue speaker is missing here.
 */
const NAMES: Record<string, Gender> = {
  // Persian names
  Ali: 'm', Arash: 'm', Babak: 'm', Kaveh: 'm', Nima: 'm', Omid: 'm', Pouya: 'm', Reza: 'm', Sina: 'm',
  Arezoo: 'f', Atoosa: 'f', Bahar: 'f', Ladan: 'f', Leila: 'f', Mahsa: 'f', Maryam: 'f', Mina: 'f', Nasrin: 'f',
  Neda: 'f', Niloufar: 'f', Parisa: 'f', Parvin: 'f', Sara: 'f', Shirin: 'f',
  // Italian names (Bego Ciao)
  Davide: 'm', Luca: 'm', Paolo: 'm',
  Chiara: 'f', Elena: 'f', Francesca: 'f', Giulia: 'f', Marta: 'f',
  // Italian role nouns whose ending shows the gender
  Cameriere: 'm', Commesso: 'm', Fruttivendolo: 'm', Signore: 'm',
  Direttrice: 'f', Impiegata: 'f', Professoressa: 'f', Segretaria: 'f',
  // Dr Sohrabi is addressed «خانم دکتر» in a2-health.
  'Dr Sohrabi': 'f',
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
