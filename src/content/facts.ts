/**
 * "Did you know?": short fun facts about Persian and Iran, each with one word to learn.
 * Reading a new fact earns a heart (see FactsView). Facts are history and language trivia, kept
 * to what is well established; where sources disagree the text says so.
 */
export interface Fact {
  /** Stable id: progress stores which facts were read, so never rename one. */
  id: string
  emoji: string
  en: { title: string; text: string }
  it: { title: string; text: string }
  word: { fa: string; tr: string; en: string; it: string }
}

export const FACTS: Fact[] = [
  {
    id: 'no-gender', emoji: '👫',
    en: { title: 'Persian has no “he” or “she”', text: 'One word, u, means both he and she, and nouns have no masculine or feminine. No der/die/das, no il/la: one less thing to learn!' },
    it: { title: 'Il persiano non ha “lui” o “lei”', text: 'Una sola parola, u, vuol dire sia lui che lei, e i nomi non sono né maschili né femminili. Niente il/la: una cosa in meno da imparare!' },
    word: { fa: 'او', tr: 'u', en: 'he / she', it: 'lui / lei' },
  },
  {
    id: 'cyrus-cylinder', emoji: '📜',
    en: { title: 'The Cyrus Cylinder', text: 'In 539 BC Cyrus the Great (Kurosh) had a clay cylinder written that let deported peoples go home and rebuild their temples. It is often called the first charter of human rights; historians debate the title, but a copy stands at the United Nations in New York.' },
    it: { title: 'Il Cilindro di Ciro', text: 'Nel 539 a.C. Ciro il Grande (Kurosh) fece scrivere un cilindro d’argilla che permetteva ai popoli deportati di tornare a casa e ricostruire i loro templi. Spesso è chiamato la prima carta dei diritti umani; gli storici ne discutono, ma una copia si trova alle Nazioni Unite a New York.' },
    word: { fa: 'کوروش', tr: 'Kurosh', en: 'Cyrus', it: 'Ciro' },
  },
  {
    id: 'paradise', emoji: '🌳',
    en: { title: '“Paradise” is a Persian word', text: 'It comes from Old Persian pairidaeza, a walled garden. Persian gardens were so beautiful that the word travelled through Greek into English and Italian (paradiso). Modern Persian still has pardis.' },
    it: { title: '“Paradiso” è una parola persiana', text: 'Viene dall’antico persiano pairidaeza, giardino recintato. I giardini persiani erano così belli che la parola è arrivata, passando per il greco, in italiano e in inglese. Il persiano moderno ha ancora pardis.' },
    word: { fa: 'پردیس', tr: 'pardis', en: 'paradise, garden', it: 'paradiso, giardino' },
  },
  {
    id: 'pajamas', emoji: '🛌',
    en: { title: 'You sleep in Persian', text: 'Pajamas comes from Persian pâ (leg) + jâme (garment): clothes for the legs. It reached English through India.' },
    it: { title: 'Dormi in persiano', text: 'Pigiama viene dal persiano pâ (gamba) + jâme (indumento): un vestito per le gambe. È arrivato in Europa passando per l’India.' },
    word: { fa: 'پا', tr: 'pâ', en: 'leg, foot', it: 'gamba, piede' },
  },
  {
    id: 'checkmate', emoji: '♟️',
    en: { title: 'Checkmate = shâh mât', text: 'Chess came to Europe through Persia. “Checkmate” comes from Persian shâh mât: the king is helpless.' },
    it: { title: 'Scacco matto = shâh mât', text: 'Gli scacchi sono arrivati in Europa attraverso la Persia. “Scacco matto” viene dal persiano shâh mât: il re è senza scampo.' },
    word: { fa: 'شاه', tr: 'shâh', en: 'king', it: 're' },
  },
  {
    id: 'bazaar', emoji: '🛍️',
    en: { title: 'Bazaar, caravan, kiosk', text: 'All three are Persian: bâzâr (market), kârvân (a group of travellers) and kushk (a pavilion, via Turkish). You already speak some Persian!' },
    it: { title: 'Bazar, carovana, chiosco', text: 'Sono tutte e tre persiane: bâzâr (mercato), kârvân (gruppo di viaggiatori) e kushk (padiglione, passando per il turco). Parli già un po’ di persiano!' },
    word: { fa: 'بازار', tr: 'bâzâr', en: 'market', it: 'mercato' },
  },
  {
    id: 'spinach-lemon', emoji: '🍋',
    en: { title: 'Spinach and lemons', text: 'Spinach comes from Persian esfenâj, and lemon most likely from Persian limu, both travelling west through Arabic.' },
    it: { title: 'Spinaci e limoni', text: 'Spinaci viene dal persiano esfenâj e limone molto probabilmente dal persiano limu: tutte e due le parole sono arrivate in Europa passando per l’arabo.' },
    word: { fa: 'لیمو', tr: 'limu', en: 'lemon', it: 'limone' },
  },
  {
    id: 'shahnameh', emoji: '📖',
    en: { title: 'A thousand-year-old book you can still read', text: 'Ferdowsi finished the Shahnameh, the Book of Kings, around 1010. Iranians today can still read much of it, a bit like English speakers reading Shakespeare.' },
    it: { title: 'Un libro di mille anni che si legge ancora', text: 'Ferdowsi terminò lo Shahnameh, il Libro dei Re, intorno al 1010. Gli iraniani di oggi ne capiscono ancora gran parte, un po’ come un italiano che legge Dante.' },
    word: { fa: 'کتاب', tr: 'ketâb', en: 'book', it: 'libro' },
  },
  {
    id: 'three-countries', emoji: '🗺️',
    en: { title: 'One language, three names', text: 'Persian is Fârsi in Iran, Dari in Afghanistan and Tajik in Tajikistan, where it is written in the Cyrillic alphabet.' },
    it: { title: 'Una lingua, tre nomi', text: 'Il persiano si chiama fârsi in Iran, dari in Afghanistan e tagico in Tagikistan, dove si scrive con l’alfabeto cirillico.' },
    word: { fa: 'فارسی', tr: 'fârsi', en: 'Persian', it: 'persiano' },
  },
  {
    id: 'numbers-ltr', emoji: '🔢',
    en: { title: 'Right to left… except numbers', text: 'Persian is written from right to left, but numbers go left to right, just like yours: ۱۴۰۵ is 1405.' },
    it: { title: 'Da destra a sinistra… tranne i numeri', text: 'Il persiano si scrive da destra a sinistra, ma i numeri vanno da sinistra a destra, come i tuoi: ۱۴۰۵ è 1405.' },
    word: { fa: 'عدد', tr: 'adad', en: 'number', it: 'numero' },
  },
  {
    id: 'calendar', emoji: '📅',
    en: { title: 'It is the year 1405', text: 'Iran uses a solar calendar that starts with Nowruz, the first day of spring. The year that began in March 2026 is 1405.' },
    it: { title: 'Siamo nell’anno 1405', text: 'L’Iran usa un calendario solare che inizia con Nowruz, il primo giorno di primavera. L’anno cominciato a marzo 2026 è il 1405.' },
    word: { fa: 'سال', tr: 'sâl', en: 'year', it: 'anno' },
  },
  {
    id: 'nowruz-moment', emoji: '🌸',
    en: { title: 'New Year to the second', text: 'Nowruz begins at the exact moment of the spring equinox, so some years families count down at 3 in the morning, or in the middle of lunch. It is on UNESCO’s list of world heritage.' },
    it: { title: 'Capodanno al secondo', text: 'Nowruz comincia nel momento esatto dell’equinozio di primavera, quindi certi anni le famiglie fanno il conto alla rovescia alle 3 di notte, o a metà pranzo. È nella lista del patrimonio UNESCO.' },
    word: { fa: 'نوروز', tr: 'nowruz', en: 'Persian New Year (“new day”)', it: 'capodanno persiano (“nuovo giorno”)' },
  },
  {
    id: 'pishi', emoji: '🐱',
    en: { title: 'Pishi, pishi!', text: 'Iranians call cats with “pishi pishi”, the way English speakers say “kitty kitty”. The formal word is gorbe. And yes, Persian cats are named after Persia.' },
    it: { title: 'Pishi, pishi!', text: 'Gli iraniani chiamano i gatti con “pishi pishi”, come in italiano si dice “micio micio”. La parola normale è gorbe. E sì, i gatti persiani prendono il nome dalla Persia.' },
    word: { fa: 'گربه', tr: 'gorbe', en: 'cat', it: 'gatto' },
  },
  {
    id: 'love-friend', emoji: '❤️',
    en: { title: '“I love you” is “I hold you as a friend”', text: 'Dustet dâram is built from dust (friend) and dâshtan (to have): roughly “I hold you dear”. The same verb is used for liking things: in Persian you love pizza and people with the same words.' },
    it: { title: '“Ti amo” è “ti tengo come amico”', text: 'Dustet dâram è fatto di dust (amico) e dâshtan (avere): più o meno “ti tengo caro”. Lo stesso verbo si usa per le cose che piacciono: in persiano ami la pizza e le persone con le stesse parole.' },
    word: { fa: 'دوستت دارم', tr: 'dustet dâram', en: 'I love you', it: 'ti amo / ti voglio bene' },
  },
  {
    id: 'pas-farda', emoji: '⏳',
    en: { title: 'A word for “the day before yesterday”', text: 'Persian has single words for the day before yesterday (pariruz) and the day after tomorrow (pas-fardâ), like Italian ieri l’altro and dopodomani.' },
    it: { title: 'Una parola per “l’altro ieri”', text: 'Il persiano ha parole singole per l’altro ieri (pariruz) e dopodomani (pas-fardâ), proprio come l’italiano.' },
    word: { fa: 'پس‌فردا', tr: 'pas-fardâ', en: 'the day after tomorrow', it: 'dopodomani' },
  },
  {
    id: 'no-the', emoji: '📚',
    en: { title: 'No word for “the”', text: 'Ketâb means both “book” and “the book”. To say “a book” you add -i: ketâbi. Simple!' },
    it: { title: 'Niente articolo determinativo', text: 'Ketâb vuol dire sia “libro” che “il libro”. Per dire “un libro” aggiungi -i: ketâbi. Facile!' },
    word: { fa: 'کتابی', tr: 'ketâbi', en: 'a book', it: 'un libro' },
  },
  {
    id: 'dast-dard', emoji: '🙌',
    en: { title: '“May your hand not hurt”', text: 'When someone cooks for you or gives you something, Iranians say dastet dard nakone: may your hand not hurt. It is the warmest way to say thank you for an effort.' },
    it: { title: '“Che la tua mano non faccia male”', text: 'Quando qualcuno cucina per te o ti dà qualcosa, gli iraniani dicono dastet dard nakone: che la tua mano non faccia male. È il grazie più caldo per una fatica.' },
    word: { fa: 'دست', tr: 'dast', en: 'hand', it: 'mano' },
  },
  {
    id: 'hafez-fal', emoji: '🔮',
    en: { title: 'Asking a poet for your fortune', text: 'Iranians open the poems of Hafez, a 14th-century poet, at a random page to read their fortune: the fâl-e Hâfez. Many families put his book on the haft-sin table at Nowruz.' },
    it: { title: 'Chiedere il futuro a un poeta', text: 'Gli iraniani aprono a caso le poesie di Hafez, poeta del Trecento, per leggere il proprio futuro: il fâl-e Hâfez. Molte famiglie mettono il suo libro sulla tavola dell’haft-sin a Nowruz.' },
    word: { fa: 'فال', tr: 'fâl', en: 'fortune, omen', it: 'presagio, sorte' },
  },
  {
    id: 'rumi', emoji: '🌀',
    en: { title: 'Rumi, a bestseller 800 years later', text: 'Rumi (Mowlânâ to Iranians) wrote in Persian in the 1200s. In translation he has been one of the best-selling poets in the United States.' },
    it: { title: 'Rumi, un bestseller dopo 800 anni', text: 'Rumi (per gli iraniani Mowlânâ) scriveva in persiano nel Duecento. Tradotto, è stato uno dei poeti più venduti negli Stati Uniti.' },
    word: { fa: 'شعر', tr: 'she’r', en: 'poem, poetry', it: 'poesia' },
  },
  {
    id: 'names', emoji: '🌹',
    en: { title: 'Names that mean something', text: 'Many Persian names are everyday words: Shirin means sweet, Golnâr pomegranate flower, Nasrin wild rose, Omid hope, Bahâr spring.' },
    it: { title: 'Nomi che significano qualcosa', text: 'Molti nomi persiani sono parole di tutti i giorni: Shirin vuol dire dolce, Golnâr fiore di melograno, Nasrin rosa selvatica, Omid speranza, Bahâr primavera.' },
    word: { fa: 'شیرین', tr: 'shirin', en: 'sweet', it: 'dolce' },
  },
  {
    id: 'verb-last', emoji: '🔚',
    en: { title: 'The verb waits until the end', text: 'Persian puts the verb last: man châi mikhoram, “I tea drink”. You have to listen to the very end to know what happened!' },
    it: { title: 'Il verbo arriva alla fine', text: 'Il persiano mette il verbo in fondo: man châi mikhoram, “io tè bevo”. Bisogna ascoltare fino all’ultima parola per sapere cosa succede!' },
    word: { fa: 'چای', tr: 'châi', en: 'tea', it: 'tè' },
  },
  {
    id: 'qanat', emoji: '💧',
    en: { title: 'Rivers under the desert', text: 'Thousands of years ago Iranians dug qanâts, gently sloping tunnels that carry water from the mountains under the desert to villages. Some still work and are on UNESCO’s World Heritage list.' },
    it: { title: 'Fiumi sotto il deserto', text: 'Migliaia di anni fa gli iraniani scavarono i qanât, gallerie in leggera pendenza che portano l’acqua dalle montagne ai villaggi sotto il deserto. Alcuni funzionano ancora e sono patrimonio UNESCO.' },
    word: { fa: 'آب', tr: 'âb', en: 'water', it: 'acqua' },
  },
  {
    id: 'yakhchal', emoji: '🧊',
    en: { title: 'Ice in the desert, without electricity', text: 'Ancient Iranians kept ice through the summer in yakhchâls, tall domed ice houses built of thick mud brick. Yakh means ice, chal means pit.' },
    it: { title: 'Ghiaccio nel deserto, senza elettricità', text: 'Gli antichi iraniani conservavano il ghiaccio per tutta l’estate negli yakhchâl, alte ghiacciaie a cupola di spesso mattone crudo. Yakh vuol dire ghiaccio, chal fossa.' },
    word: { fa: 'یخ', tr: 'yakh', en: 'ice', it: 'ghiaccio' },
  },
  {
    id: 'ghorbunet', emoji: '🥰',
    en: { title: '“May I be sacrificed for you”', text: 'Ghorbunet beram sounds dramatic, but Iranians say it all day to mean “you’re a sweetheart”, even to a shopkeeper. Persian loves big, warm words.' },
    it: { title: '“Che io sia sacrificato per te”', text: 'Ghorbunet beram sembra drammatico, ma gli iraniani lo dicono di continuo per dire “sei un tesoro”, anche al negoziante. Il persiano ama le parole grandi e affettuose.' },
    word: { fa: 'قربونت برم', tr: 'ghorbunet beram', en: 'you’re a sweetheart (lit. may I be sacrificed for you)', it: 'sei un tesoro (lett. che io sia sacrificato per te)' },
  },
]
