/** Italian for the parts of the course outside the units: levels, lesson names and the alphabet's example words. */
export const IT_LEVELS: Record<string, { name: string; blurb: string }> = {
  A1: { name: 'Principiante', blurb: 'Saluta, presentati, conta, di\' l\'ora, descrivi le persone e parla di famiglia, scuola, cibo, lavoro e hobby. Impara i verbi chiave e la differenza tra persiano parlato e scritto.' },
  A2: { name: 'Elementare', blurb: 'Fai acquisti, mangia fuori, viaggia, cucina, telefona e invita, parla della giornata, dei sentimenti, del passato e dei tuoi piani, e festeggia le feste persiane.' },
  B1: { name: 'Intermedio', blurb: 'Dai opinioni e consigli, gestisci il ta\'ârof, i colloqui, l\'affitto e i servizi, racconta storie, collega le idee con il congiuntivo e parla come gli iraniani.' },
  B2: { name: 'Intermedio superiore', blurb: 'Argomenta, leggi notizie e lettere formali, usa modi di dire e slang, parla di scienza, economia e storia, e scopri poesia, cinema e dialetti persiani.' },
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
