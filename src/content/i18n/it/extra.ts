/** Italian for the parts of the course outside the units: levels, lesson names and the alphabet's example words. */
export const IT_LEVELS: Record<string, { name: string; blurb: string }> = {
  A1: { name: 'Principiante', blurb: 'Saluta, presentati, conta, parla di famiglia, cibo e della tua giornata.' },
  A2: { name: 'Elementare', blurb: 'Fai acquisti, chiedi la strada, descrivi la casa, racconta il passato, il tempo e la salute.' },
  B1: { name: 'Intermedio', blurb: 'Fai progetti, parla di lavoro e studio, dai opinioni, gestisci il ta\'ârof e racconta storie.' },
  B2: { name: 'Intermedio superiore', blurb: 'Leggi le notizie, passa dal persiano scritto a quello parlato, scopri la poesia e argomenta.' },
}

export const IT_LESSON_NAMES: Record<string, string> = {
  'words-1': 'Parole 1',
  'words-2': 'Parole 2',
  grammar: 'Grammatica',
  sentences: 'Frasi',
  dialogue: 'Dialogo',
  reading: 'Lettura',
}

/** Alphabet example words, keyed by the Persian word. */
export const IT_LETTER_EXAMPLES: Record<string, string> = {
  'اسب': 'cavallo', 'بابا': 'papà', 'پدر': 'padre', 'توت': 'gelso', 'ثانیه': 'secondo', 'جوان': 'giovane',
  'چای': 'tè', 'حال': 'umore, stato', 'خانه': 'casa', 'در': 'porta', 'ذرت': 'mais', 'روز': 'giorno',
  'زن': 'donna', 'ژاکت': 'giacca', 'سیب': 'mela', 'شب': 'notte', 'صبح': 'mattina', 'ضعیف': 'debole',
  'طلا': 'oro', 'ظهر': 'mezzogiorno', 'عسل': 'miele', 'غذا': 'cibo', 'فیل': 'elefante', 'قند': 'zolletta di zucchero',
  'کتاب': 'libro', 'گل': 'fiore', 'لب': 'labbro', 'ماه': 'luna', 'نان': 'pane', 'ورزش': 'sport',
  'هوا': 'aria, tempo', 'یک': 'uno',
}

/** Letter sounds explained for Italian speakers, keyed by the letter. Only where the Finglish needs help. */
export const IT_LETTER_SOUNDS: Record<string, string> = {
  'ا': 'â / a', 'چ': 'ch (c di "ciao")', 'خ': 'kh (j spagnola)', 'ژ': 'zh (j francese)', 'ش': 'sh (sc di "scena")',
  'ج': 'j (g di "gelato")', 'غ': 'gh (g gutturale)', 'ق': 'gh (g gutturale)', 'ع': "' (colpo di glottide)",
  'و': 'v / u / o', 'ه': 'h / e', 'ی': 'y / i',
}
