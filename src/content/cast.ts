/**
 * The PersianMeow cast: the 21 people who speak the dialogues and the lesson sentences.
 * Generated from the designer's characters.json (name, id, gender, role); the Persian spelling and
 * Finglish follow the course's own conventions (Leylâ, Ârash, Bâbak, Sârâ, Kurosh…).
 * Their drawings are static files in public/characters/:
 *   <id>_<mood>.svg and <id>_<mood>_talk.svg (mouth open), moods idle | happy | sad | confused | shock,
 *   plus <id>_happy_wave.svg, <id>_happy_scratch.svg and the round <id>_avatar.png.
 * Pishi stays the mascot and is not part of the cast.
 * scripts/check-voices.ts fails if a dialogue speaker is not in this list or gets a voice of the other gender.
 */
import type { Gender } from './speakers.ts'

export interface CastMember {
  name: string
  id: string
  gender: Gender
  /** The designer's description of the character. */
  role: string
  /** The name in Persian script. */
  fa: string
  /** The name in Finglish, as the course writes it. */
  tr: string
}

export const CAST: readonly CastMember[] = [
  { name: 'Sara', id: 'sara', gender: 'f', fa: 'سارا', tr: 'Sârâ', role: 'young Persian woman (bun, teal top)' },
  { name: 'Artemis', id: 'artemis', gender: 'f', fa: 'آرتمیس', tr: 'Ârtemis', role: 'young Persian woman (long brown wavy hair, saffron top)' },
  { name: 'Hasti', id: 'hasti', gender: 'f', fa: 'هستی', tr: 'Hasti', role: 'trendy Tehrani (pink scarf pushed back, sunglasses, hoops, beige blazer)' },
  { name: 'Aseman', id: 'aseman', gender: 'f', fa: 'آسمان', tr: 'Âsemân', role: 'metalhead (black tee, purple streak, dark lipstick, piercings)' },
  { name: 'Khorshid', id: 'khorshid', gender: 'f', fa: 'خورشید', tr: 'Khorshid', role: 'glam / elegant (red lipstick, gold necklace)' },
  { name: 'Roya', id: 'roya', gender: 'f', fa: 'رویا', tr: 'Royâ', role: 'Shomali (Gilan): side braid with flowers, embroidered red vest, no headscarf' },
  { name: 'Saba', id: 'saba', gender: 'f', fa: 'صبا', tr: 'Sabâ', role: 'Shomali (Mazandaran): red flowered headband, green embroidered vest, no headscarf' },
  { name: 'Darya', id: 'darya', gender: 'f', fa: 'دریا', tr: 'Daryâ', role: 'Kurdish (braids, gold coin headband, traditional dress)' },
  { name: 'Sahel', id: 'sahel', gender: 'f', fa: 'ساحل', tr: 'Sâhel', role: 'Azeri Turkish from Tabriz (kelaghayi silk headscarf)' },
  { name: 'Fara', id: 'fara', gender: 'f', fa: 'فرا', tr: 'Farâ', role: 'Bandari (Persian Gulf): colourful light scarf, bright dress, gold nose ring' },
  { name: 'Venus', id: 'venus', gender: 'f', fa: 'ونوس', tr: 'Venus', role: 'Italian learner (blonde, red top)' },
  { name: 'Leila', id: 'leila', gender: 'f', fa: 'لیلا', tr: 'Leylâ', role: 'Persian mother / host / shopkeeper / doctor (cute bob haircut)' },
  { name: 'Ziba', id: 'ziba', gender: 'f', fa: 'زیبا', tr: 'Zibâ', role: 'grandmother (grey hair, glasses, teal scarf)' },
  { name: 'Babak', id: 'babak', gender: 'm', fa: 'بابک', tr: 'Bâbak', role: 'Persian dad (grey hair, moustache, glasses)' },
  { name: 'Sasan', id: 'sasan', gender: 'm', fa: 'ساسان', tr: 'Sâsân', role: 'young Persian man (styled hair, light stubble, green shirt)' },
  { name: 'Arash', id: 'arash', gender: 'm', fa: 'آرش', tr: 'Ârash', role: 'young Persian man (dark hair, glasses, purple jumper)' },
  { name: 'Arshia', id: 'arshia', gender: 'm', fa: 'آرشیا', tr: 'Ârshiyâ', role: 'trendy Tehrani (fade haircut, hoodie, gold chain)' },
  { name: 'Dariush', id: 'dariush', gender: 'm', fa: 'داریوش', tr: 'Dâriush', role: 'metalhead (long hair, leather jacket, goatee)' },
  { name: 'Ali', id: 'ali', gender: 'm', fa: 'علی', tr: 'Ali', role: 'Kurdish (black-and-white fringed head wrap, sash, moustache)' },
  { name: 'Kourosh', id: 'kourosh', gender: 'm', fa: 'کوروش', tr: 'Kurosh', role: 'inspired by Kourosh the Great / Cyrus: Achaemenid crown, curled beard, royal purple (history & culture lessons)' },
  { name: 'Aria', id: 'aria', gender: 'm', fa: 'آریا', tr: 'Âriyâ', role: 'foreign learner / partner (blond, blue jumper)' },
]

export const CAST_BY_NAME: ReadonlyMap<string, CastMember> = new Map(CAST.map((c) => [c.name, c]))
export const castMember = (name: string): CastMember | undefined => CAST_BY_NAME.get(name)

export type Mood = 'idle' | 'happy' | 'sad' | 'confused' | 'shock'

/** URLs of a character's drawings, relative to the app's base (pass import.meta.env.BASE_URL). */
export const faceUrl = (base: string, id: string, mood: Mood = 'idle', talking = false) =>
  `${base}characters/${id}_${mood}${talking ? '_talk' : ''}.svg`
export const avatarUrl = (base: string, id: string) => `${base}characters/${id}_avatar.png`
