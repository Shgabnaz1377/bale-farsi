/**
 * Written words that are rightly read in more than one way, so scripts/check-readings.ts lets them
 * through. Homographs with their own page (کرم, شکر...) are in homographs.ts and need no entry here.
 * Everything else must have exactly one reading in the whole app: one Finglish spelling per word.
 *
 * Two kinds of difference are accepted without an entry, because they are how Persian works:
 * a doubled consonant heard only before a vowel (khat, khatt-e), and the everyday and written pronoun
 * endings (dastesh / dastash, khodet / khodat).
 *
 * Key: the word as printed, without vowel marks. Value: why it has more than one reading.
 */
export const READING_PAIRS: Record<string, string> = {
  'ب': 'the letter be, and the syllables ba, be, bo in the vowels lesson',
  'گل': 'gol "flower" / gel "mud" (vowels lesson pair)',
  'سر': 'sar "head" / ser "numb" (vowels lesson pair)',
  'مهر': 'mehr "kindness, the month Mehr" / mohr "stamp" (vowels lesson pair)',
  'به': 'be "to" / bah bah! "yum!"',
  'رو': 'ro (spoken râ, the object marker) / ru "on"',
  'نه': 'na "no" / noh "nine"',
  'و': 'va "and" / o, the everyday way to say "and" (mush-o gorbe)',
  'تو': 'tu "in" / to "you"',
  'منو': 'mano "me" (spoken man râ) / menu',
  'مرد': 'mard "man" / mord "died"',
  'جمعه': 'jom\'e "Friday" / jam\'e "it\'s plural" (spoken jam\' ast)',
  'کی': 'key "when?" / ki "who?"',
  'کیه': 'kiye "who is it?" / keye "when is it?"',
  'بدن': 'badan "body" / bedan "(they) give"',
  'می‌شویم': 'mishuyam "I wash" / mishavim "we become"',
  'دور': 'dur "far" / dowr "around"',
  'دوره': 'dure "it\'s far" / dowre "period"',
  'برید': 'berid "go! (plural)" / borid "cut"',
  'می‌کشد': 'mikeshad "pulls, lasts" / mikoshad "kills"',
  'کن': 'kon "do!" / Kan "Cannes"',
  'کردی': 'kardi "you did" / Kordi "Kurdish"',
  'بود': 'bud "was" / bovad, its old form in poetry (Ferdowsi)',
  'بگذرد': 'begozarad "may it pass" / bogzarad in the fixed saying in niz bogzarad',
  'کند': 'konad "does" / kond "slow"',
  'سبک': 'sabk "style" / sabok "light (not heavy)"',
  'آوردم': 'âvardam "I brought" / âvordam, how it is said in everyday speech',
  'جدا': 'jodâ "apart" / jeddan "really" (جداً)',
  'فوریه': 'Fevriye "February" / fowri-e "it\'s urgent"',
  'بده': 'bede / bedeh "give!" (spoken / written) / bade "is it bad?"',
  'نمونه': 'nemune "example" / namune "doesn\'t stay" (spoken namânad)',
  'بیان': 'bayân "expression" / biân "(they) come" (spoken)',
  'بره': 'bere "(it) goes" (spoken) / barre "lamb"',
  'پیرو': 'peyrow "following" / peyrov-e, the w heard as v before the ezâfe',
  'سمت': 'samt "side" / semat "position, job title"',
  'مه': 'Me "May" / meh "fog"',
  'نفس': 'nafas "breath" / nafs "self"',
  'گرد': 'gerd "round" / gard "dust"',
  'ببر': 'bebar "take!" / babr "tiger"',
  'کره': 'kare "butter" / Kore "Korea"',
}
