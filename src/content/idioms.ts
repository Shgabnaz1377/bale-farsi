/**
 * Persian idioms that Pishi acts out (IdiomsView): the saying, what it says word for word, what it
 * really means, a close English / Italian saying, and an example. Learning a new one earns a heart.
 * The list follows Shabnaz's Reel ideas (tools/social/reels-idioms.md), so app and Instagram match.
 * Everything is spoken Tehran Persian, as people say it.
 */
export interface Idiom {
  /** Stable id: progress stores which idioms were learned, so never rename one. */
  id: string
  emoji: string
  fa: string
  tr: string
  /** Word for word. */
  literal: { en: string; it: string }
  meaning: { en: string; it: string }
  /** The closest saying in English / Italian. */
  like?: { en: string; it: string }
  note?: { en: string; it: string }
  example: { fa: string; tr: string; en: string; it: string }
  /** Vulgar: hidden until the learner asks for the rude ones. */
  rude?: boolean
}

export const IDIOMS: Idiom[] = [
  {
    id: 'cat-at-the-door', emoji: '😼',
    fa: 'گربه رو دمِ حجله کشتن', tr: 'gorbe ro dam-e hejle koshtan',
    literal: { en: 'to kill the cat at the door of the wedding room', it: 'uccidere il gatto davanti alla camera nuziale' },
    meaning: { en: 'To set the rules firmly on day one, so nobody tests you later.', it: 'Mettere in chiaro le regole fin dal primo giorno, così nessuno ti mette alla prova dopo.' },
    like: { en: 'start as you mean to go on', it: 'mettere subito i puntini sulle i' },
    note: { en: 'From a folk tale: a groom shows on the wedding night that he means business; a friend tries the same trick months later and his wife just laughs. Too late! Today it is said about a new job, a new flatmate, a new class.', it: 'Da una favola popolare: uno sposo fa vedere la prima notte che non scherza; un amico ci prova mesi dopo e la moglie gli ride in faccia. Troppo tardi! Oggi si dice di un lavoro nuovo, un coinquilino, una classe.' }, // TODO(Shabnaz): check the folk tale
    example: { fa: 'روز اول کلاس، معلم گربه رو دمِ حجله کشت.', tr: 'ruz-e avval-e kelâs, moallem gorbe ro dam-e hejle kosht.', en: 'On the first day of class, the teacher laid down the law.', it: 'Il primo giorno di lezione, l’insegnante ha messo subito le cose in chiaro.' },
  },
  {
    id: 'pif-pif', emoji: '🥩',
    fa: 'گربه دستش به گوشت نمی‌رسه، میگه پیف‌پیف بو میده', tr: 'gorbe dastesh be gusht nemirese, mige pif pif bu mide',
    literal: { en: 'the cat can’t reach the meat, so it says: yuck, it stinks!', it: 'il gatto non arriva alla carne, e dice: puah, puzza!' },
    meaning: { en: 'Pretending you never wanted what you couldn’t get.', it: 'Fingere di non volere quello che non si riesce ad avere.' },
    like: { en: 'sour grapes', it: 'fare come la volpe con l’uva' },
    note: { en: 'pif pif is the sound Iranians make at a bad smell: “yuck!”.', it: 'pif pif è il verso che gli iraniani fanno per una puzza: “puah!”.' },
    example: { fa: 'نتونست بلیت بخره، حالا میگه کنسرت خوب نبود!', tr: 'natunest belit bekhare, hâlâ mige konsert khub nabud!', en: 'He couldn’t get a ticket, and now he says the concert was no good!', it: 'Non è riuscito a prendere il biglietto e ora dice che il concerto non era bello!' },
  },
  {
    id: 'fart-temple', emoji: '🕵️', rude: true,
    fa: 'گوز رو به شقیقه ربط میده', tr: 'guz ro be shaghighe rabt mide',
    literal: { en: 'he links a fart to the temple (of the head)', it: 'collega una scoreggia alla tempia' },
    meaning: { en: 'Linking two things that have nothing to do with each other.', it: 'Collegare due cose che non c’entrano niente.' },
    like: { en: 'that’s a total non sequitur', it: 'c’entra come i cavoli a merenda' },
    note: { en: 'guz is a fart, shaghighe the side of your head. Rude, but very common among friends.', it: 'guz è una scoreggia, shaghighe la tempia. Volgare, ma comunissimo tra amici.' },
    example: { fa: 'من گفتم سردمه، اون گفت تقصیرِ دولته! گوز رو به شقیقه ربط میده.', tr: 'man goftam sardame, un goft taghsir-e dowlate! guz ro be shaghighe rabt mide.', en: 'I said I was cold and he said it’s the government’s fault! Talk about a stretch.', it: 'Ho detto che avevo freddo e lui ha detto che è colpa del governo! Cavoli a merenda.' },
  },
  {
    id: 'shamurti', emoji: '😇',
    fa: 'عجب آدمِ شامورتی‌ایه!', tr: 'ajab âdam-e shâmurti-ie!',
    literal: { en: 'what a shâmurti person! (a word you won’t find in a textbook)', it: 'che persona shâmurti! (una parola che non trovi nei libri)' },
    meaning: { en: 'Someone sly and sneaky who plays the innocent.', it: 'Una persona furba e imbrogliona che fa la santarellina.' },
    like: { en: 'a sly fox', it: 'una vecchia volpe' },
    example: { fa: 'با اون چشمای معصوم گولت می‌زنه، خیلی شامورتیه.', tr: 'bâ un cheshmâ-ye ma’sum gulet mizane, kheyli shâmurtie.', en: 'He fools you with those innocent eyes; he’s a real trickster.', it: 'Ti frega con quegli occhi innocenti: è proprio un furbetto.' },
  }, // TODO(Shabnaz): check the Finglish shâmurti
  {
    id: 'stingy', emoji: '🔒', rude: true,
    fa: 'نمی‌رینه که نخوره', tr: 'nemirine ke nakhore',
    literal: { en: 'he won’t even poop, so he never has to eat again', it: 'non va neanche in bagno, così non deve più mangiare' }, // TODO(Shabnaz): check the literal meaning
    meaning: { en: 'Someone extremely stingy.', it: 'Una persona tirchissima.' },
    like: { en: 'so tight he squeaks', it: 'avere il braccino corto' },
    note: { en: 'Very rude: only with close friends. dong is your share of a bill.', it: 'Molto volgare: solo con gli amici stretti. dong è la tua parte del conto.' },
    example: { fa: 'هیچ‌وقت دنگشو نمیده؛ نمی‌رینه که نخوره!', tr: 'hichvaght dongesho nemide; nemirine ke nakhore!', en: 'He never pays his share; stingiest man alive!', it: 'Non paga mai la sua parte: ha il braccino cortissimo!' },
  },
  {
    id: 'no-eyes', emoji: '🎀',
    fa: 'چشم نداره منو ببینه', tr: 'cheshm nadâre mano bebine',
    literal: { en: 'he has no eyes to see me', it: 'non ha occhi per vedermi' },
    meaning: { en: 'He is so jealous, or dislikes me so much, that he can’t stand the sight of me.', it: 'È così geloso, o mi detesta così tanto, che non sopporta di vedermi.' },
    like: { en: 'he can’t stand the sight of me', it: 'non mi può vedere' },
    example: { fa: 'از وقتی ماشین خریدم، چشم نداره منو ببینه.', tr: 'az vaghti mâshin kharidam, cheshm nadâre mano bebine.', en: 'Since I bought a car, he can’t stand the sight of me.', it: 'Da quando ho comprato la macchina, non mi può vedere.' },
  },
  {
    id: 'evil-eye', emoji: '🧿',
    fa: 'چشم می‌خوری، نگو!', tr: 'cheshm mikhori, nagu!',
    literal: { en: 'you’ll get hit by an eye, don’t say it!', it: 'ti colpirà un occhio, non dirlo!' },
    meaning: { en: 'Don’t boast about your luck out loud, or the evil eye will spoil it.', it: 'Non vantarti della tua fortuna ad alta voce, o il malocchio la rovinerà.' },
    like: { en: 'touch wood, don’t jinx it!', it: 'non dirlo, tocca ferro!' },
    note: { en: 'To undo it, people burn esfand (wild rue) seeds and say mâshâllâh. The blue bead against it is the nazar.', it: 'Per rimediare si bruciano semi di esfand (ruta siriana) e si dice mâshâllâh. La perlina blu contro il malocchio è il nazar.' },
    example: { fa: 'نگو هیچ‌وقت مریض نمی‌شی، چشم می‌خوری!', tr: 'nagu hichvaght mariz nemishi, cheshm mikhori!', en: 'Don’t say you never get ill, you’ll jinx it!', it: 'Non dire che non ti ammali mai, porta sfortuna!' },
  },
  {
    id: 'this-too', emoji: '🌦️',
    fa: 'این نیز بگذرد', tr: 'in niz bogzarad',
    literal: { en: 'this too shall pass', it: 'anche questo passerà' },
    meaning: { en: 'Hard times don’t last, and nor do good ones: stay calm and stay humble.', it: 'I momenti difficili non durano, e nemmeno quelli belli: resta calmo e resta umile.' },
    like: { en: 'this too shall pass (English took it from this Persian saying)', it: 'anche questo passerà' },
    note: { en: 'Old, poetic Persian: niz means “also”. In the story, a king asks for words that cheer him when he is sad and calm him when he is happy; his wise men engrave these on a ring.', it: 'Persiano antico e poetico: niz vuol dire “anche”. Nella storia un re chiede parole che lo consolino quando è triste e lo calmino quando è felice; i saggi le incidono su un anello.' },
    example: { fa: 'سخته، ولی غصه نخور؛ این نیز بگذرد.', tr: 'sakhte, vali ghosse nakhor; in niz bogzarad.', en: 'It’s hard, but don’t be sad: this too shall pass.', it: 'È dura, ma non essere triste: anche questo passerà.' },
  },
  {
    id: 'past-us', emoji: '👴',
    fa: 'از ما گذشت', tr: 'az mâ gozasht',
    literal: { en: 'it has passed from us', it: 'per noi è passata' },
    meaning: { en: 'We are too old for that now. Said as a joke, often by people who are not old at all.', it: 'Ormai siamo troppo vecchi per queste cose. Detto per scherzo, spesso da chi vecchio non è.' },
    like: { en: 'I’m too old for this', it: 'non ho più l’età' },
    example: { fa: 'دیسکو؟ نه بابا، از ما گذشت!', tr: 'disko? na bâbâ, az mâ gozasht!', en: 'A club? Oh no, those days are behind us!', it: 'In discoteca? Ma no, non ho più l’età!' },
  },
  {
    id: 'mouse-and-cat', emoji: '🐭',
    fa: 'موش و گربه بازی', tr: 'mush-o gorbe bâzi',
    literal: { en: 'a mouse-and-cat game', it: 'il gioco del topo e del gatto' },
    meaning: { en: 'One side keeps dodging, the other keeps chasing.', it: 'Uno continua a sfuggire, l’altro continua a inseguire.' },
    like: { en: 'cat and mouse (Persian puts the mouse first!)', it: 'il gioco del gatto col topo (in persiano il topo viene prima!)' },
    example: { fa: 'با صاحبخونه موش و گربه بازی می‌کنه که اجاره نده.', tr: 'bâ sâhabkhune mush-o gorbe bâzi mikone ke ejâre nade.', en: 'He plays cat and mouse with the landlord to dodge the rent.', it: 'Gioca al gatto col topo con il padrone di casa per non pagare l’affitto.' },
  },
  {
    id: 'morteza-ali-cat', emoji: '🐈',
    fa: 'مثلِ گربه‌ی مرتضی‌علی، همیشه با چهار دست و پا میاد پایین', tr: 'mesl-e gorbe-ye Morteza Ali, hamishe bâ châr dast-o pâ miyâd pâyin',
    literal: { en: 'like Morteza Ali’s cat, it always comes down on all fours', it: 'come il gatto di Morteza Ali, viene sempre giù a quattro zampe' },
    meaning: { en: 'Someone who always comes out of trouble just fine.', it: 'Qualcuno che se la cava sempre.' },
    like: { en: 'always lands on their feet', it: 'cadere sempre in piedi' },
    note: { en: 'Morteza Ali is Imam Ali. A folk story says he blessed a cat, and that is why cats land on their feet.', it: 'Morteza Ali è l’imam Ali. Una storia popolare dice che benedisse un gatto, ed è per questo che i gatti cadono in piedi.' }, // TODO(Shabnaz): check the story
    example: { fa: 'هر بار ورشکست میشه، دوباره سرپاست؛ مثلِ گربه‌ی مرتضی‌علی!', tr: 'har bâr varshekast mishe, dobâre sar-e pâst; mesl-e gorbe-ye Morteza Ali!', en: 'Every time he goes bust, he’s back on his feet, like Morteza Ali’s cat!', it: 'Ogni volta che fallisce si rimette in piedi: come il gatto di Morteza Ali!' },
  },
  {
    id: 'flea', emoji: '🦗',
    fa: 'کک تو تنبونش افتاده', tr: 'kak tu tonbunesh oftâde',
    literal: { en: 'a flea has got into his trousers', it: 'gli è entrata una pulce nei pantaloni' },
    meaning: { en: 'He is restless and can’t sit still.', it: 'È irrequieto e non riesce a stare fermo.' },
    like: { en: 'ants in his pants', it: 'avere l’argento vivo addosso' },
    note: { en: 'tonbun is an old word for baggy trousers.', it: 'tonbun è una vecchia parola per i pantaloni larghi.' },
    example: { fa: 'چی شده؟ از صبح انگار کک تو تنبونش افتاده.', tr: 'chi shode? az sobh engâr kak tu tonbunesh oftâde.', en: 'What’s up with him? He’s had ants in his pants all morning.', it: 'Che gli succede? Da stamattina ha l’argento vivo addosso.' },
  },
  {
    id: 'tail-on-shoulder', emoji: '🚶',
    fa: 'دمشو گذاشت رو کولش و رفت', tr: 'dumesho gozâsht ru kulesh o raft',
    literal: { en: 'he put his tail on his shoulder and left', it: 'si è messo la coda in spalla e se n’è andato' },
    meaning: { en: 'He gave up and left without a word, empty-handed.', it: 'Ha rinunciato e se n’è andato senza una parola, a mani vuote.' },
    like: { en: 'he left with his tail between his legs (in Persian the tail goes up on the shoulder!)', it: 'se n’è andato con la coda tra le gambe (in persiano la coda va in spalla!)' },
    example: { fa: 'دید کسی بهش پول نمیده، دمشو گذاشت رو کولش و رفت.', tr: 'did kasi behesh pul nemide, dumesho gozâsht ru kulesh o raft.', en: 'He saw nobody would give him money, so off he went.', it: 'Ha visto che nessuno gli dava soldi, e se n’è andato.' },
  }, // TODO(Shabnaz): check the meaning (left defeated? left proudly?)
  {
    id: 'watermelon', emoji: '🍉',
    fa: 'هندونه زیرِ بغلِ کسی گذاشتن', tr: 'hendune zir-e baghal-e kasi gozâshtan',
    literal: { en: 'to put a watermelon under someone’s arm', it: 'mettere un’anguria sotto il braccio a qualcuno' },
    meaning: { en: 'To flatter someone until they are all puffed up.', it: 'Lusingare qualcuno finché non si monta la testa.' },
    like: { en: 'to butter someone up', it: 'lisciare il pelo a qualcuno' },
    example: { fa: 'هندونه زیرِ بغلم نذار، می‌دونم کارِ تو بوده!', tr: 'hendune zir-e baghalam nazâr, midunam kâr-e to bude!', en: 'Don’t butter me up, I know it was you!', it: 'Non lisciarmi il pelo, so che sei stato tu!' },
  },
]
