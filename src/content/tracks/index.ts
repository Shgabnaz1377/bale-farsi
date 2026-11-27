import type { Unit } from '../types.ts'
import { APP } from '../../app.ts'
import { CULTURE } from './culture.ts'
import { COUPLES } from './couples.ts'

/**
 * Extra tracks next to the A1–B2 path. Their units are always open (adding one never locks anyone's
 * progress) and are not part of the level tests. PersianMeow only.
 */
export interface Track {
  id: 'culture' | 'couples'
  /** English UI string (translated with t()). */
  name: string
  blurb: string
  fa: string
  tr: string
  units: Unit[]
}

export const TRACKS: Track[] = APP.id === 'persianmeow'
  ? [
      { id: 'culture', name: 'Culture', fa: 'فرهنگ', tr: 'farhang', units: CULTURE,
        blurb: 'Nowruz and the haft-sin, tea and tahdig, ta\'ârof at the door and at the table, Yalda night.' },
      { id: 'couples', name: 'For couples', fa: 'برای زوج‌ها', tr: 'barâ-ye zowj-hâ', units: COUPLES,
        blurb: 'Meeting your partner\'s family: greeting elders, to or shomâ, compliments to the cook, saying goodbye.' },
    ]
  : []

export const TRACK_UNITS: Unit[] = TRACKS.flatMap((t) => t.units)
export const trackOf = (u: Unit) => TRACKS.find((t) => t.units.includes(u))
