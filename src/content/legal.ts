/**
 * Privacy policy and terms of use, in plain words. The app stores (Google Play, App Store) need a
 * public link to both; they are at /#/privacy and /#/terms.
 * Keep them true: when the app starts collecting something new, add it here in the same change.
 */
export type LegalDoc = 'privacy' | 'terms'
interface Section { h: string; p: string[] }
interface Text { title: string; updated: string; intro: string; sections: Section[] }

export const LEGAL_UPDATED = '2026-11-28'
export const CONTACT_EMAIL = 'ghaffarishabnaz@gmail.com'
const OWNER = 'Shabnaz Ghaffari'

const en = (app: string): Record<LegalDoc, Text> => ({
  privacy: {
    title: 'Privacy policy',
    updated: `Last updated ${LEGAL_UPDATED}`,
    intro: `${app} is made by ${OWNER}, who is responsible for your data (the "data controller" under the EU GDPR). The short version: you can use the whole app without an account, nothing about you leaves your device unless you sign in, and we never sell or share your data for advertising.`,
    sections: [
      { h: 'Without an account', p: [
        'Your progress (XP, streak, finished lessons, review history and settings) is saved only in your browser or on your phone. We cannot see it.',
        'There are no ads, no advertising trackers and no analytics cookies.',
      ] },
      { h: 'With an account', p: [
        'When you sign up we store your name, your email address and your password (encrypted; we never see it), the date you joined and the last time you used the app.',
        'Your progress is copied to your account so it follows you to other devices.',
        'If you press "sounds wrong?" on a word, we store your note, the word and when you sent it, so a native speaker can fix it.',
        'We use this only to run your account, sync your progress, fix the course and see how many people learn and how often. The owner can see the list of learners, with their name, email and progress, to look after the app.',
      ] },
      { h: 'Who else handles it', p: [
        'Supabase (servers in the European Union) stores accounts and synced progress for us.',
        'GitHub Pages serves the app; like any web server it sees your IP address when you open the app. Fonts, pictures and recordings come from the app itself, not from Google or other sites.',
        'Tips are paid on Ko-fi, under Ko-fi’s own privacy policy; we see only the name and message you choose to leave there.',
        'Nobody else receives your data, and none of it is sold.',
      ] },
      { h: 'How long we keep it', p: [
        'As long as you have an account. When you delete it (Account → Delete my account), your account, profile and saved progress are erased straight away. What stays on your device is yours to clear (Settings → Reset progress).',
      ] },
      { h: 'Your rights', p: [
        `You can see, correct, download or delete your data, and object to how we use it. Most of this you can do in the app (Account → Download my data gives you everything we keep about you as a file); for anything else write to ${CONTACT_EMAIL} and we will answer within 30 days. You can also complain to your data protection authority (in Italy, the Garante per la protezione dei dati personali).`,
      ] },
      { h: 'Children', p: [
        'Anyone can use the app without an account. To create an account you must be at least 16, or have a parent’s permission.',
      ] },
      { h: 'Changes', p: [
        'If this policy changes, the new version will be on this page with a new date. If the change matters, we will tell signed-in learners in the app.',
      ] },
    ],
  },
  terms: {
    title: 'Terms of use',
    updated: `Last updated ${LEGAL_UPDATED}`,
    intro: `These terms are between you and ${OWNER}, who makes ${app}. By using the app you accept them.`,
    sections: [
      { h: 'The app', p: [
        `${app} is a language course. It is offered as it is: we work hard to make it right, but the course was written with AI help and is still being checked by native speakers, so it may contain mistakes. Please report them with "sounds wrong?" or on GitHub.`,
        'We may change, add or remove parts of the app at any time.',
      ] },
      { h: 'Your account', p: [
        'Keep your password to yourself; you are responsible for what is done with your account. Give a real email address so you can recover it.',
        'We may block an account that abuses the app or other people, for example by sending offensive reports.',
      ] },
      { h: 'What you send us', p: [
        'When you send a correction or a recording, you allow us to use it to improve the course, without payment. Only send what you have the right to share.',
      ] },
      { h: 'Copyright', p: [
        'The app’s code is open source under its licence on GitHub. Pishi the cat, the name and the course content belong to the owner; you may share screenshots, but not copy the course into another product.',
      ] },
      { h: 'Paid features', p: [
        'The app is free today. If paid features are added, their price and terms will be shown clearly before you pay, and nothing you already have for free will be taken away without notice.',
      ] },
      { h: 'Liability', p: [
        'As far as the law allows, we are not liable for indirect losses from using the app. Nothing in these terms limits your rights as a consumer under the law of your country.',
      ] },
      { h: 'Law and contact', p: [
        `These terms follow Italian law. Questions: ${CONTACT_EMAIL}.`,
      ] },
    ],
  },
})

const it = (app: string): Record<LegalDoc, Text> => ({
  privacy: {
    title: 'Informativa sulla privacy',
    updated: `Ultimo aggiornamento ${LEGAL_UPDATED}`,
    intro: `${app} è realizzata da ${OWNER}, titolare del trattamento dei tuoi dati ai sensi del GDPR. In breve: puoi usare tutta l'app senza account, nulla di tuo lascia il dispositivo se non accedi, e non vendiamo né condividiamo mai i tuoi dati per pubblicità.`,
    sections: [
      { h: 'Senza account', p: [
        'I tuoi progressi (XP, serie, lezioni finite, ripassi e impostazioni) restano solo nel browser o sul telefono. Noi non li vediamo.',
        'Non ci sono pubblicità, tracker pubblicitari né cookie di analisi.',
      ] },
      { h: 'Con un account', p: [
        "Quando ti registri conserviamo nome, indirizzo email e password (cifrata: non la vediamo mai), la data di iscrizione e l'ultima volta che hai usato l'app.",
        'I progressi vengono copiati nel tuo account, così ti seguono su altri dispositivi.',
        'Se premi "suona male?" su una parola, conserviamo la tua nota, la parola e la data, così un madrelingua può correggerla.',
        "Usiamo questi dati solo per gestire l'account, sincronizzare i progressi, correggere il corso e capire quante persone studiano e quanto spesso. La titolare vede l'elenco degli studenti, con nome, email e progressi, per curare l'app.",
      ] },
      { h: 'Chi altro li tratta', p: [
        "Supabase (server nell'Unione europea) conserva per noi account e progressi.",
        "GitHub Pages serve l'app; come ogni server web vede il tuo indirizzo IP quando apri l'app. Caratteri, immagini e registrazioni arrivano dall'app stessa, non da Google o da altri siti.",
        'Le mance si pagano su Ko-fi, secondo la sua informativa; noi vediamo solo il nome e il messaggio che scegli di lasciare.',
        'Nessun altro riceve i tuoi dati e non vengono venduti.',
      ] },
      { h: 'Per quanto tempo', p: [
        "Finché hai un account. Quando lo elimini (Account → Elimina il mio account), account, profilo e progressi salvati vengono cancellati subito. Ciò che resta sul dispositivo puoi cancellarlo tu (Impostazioni → Azzera progressi).",
      ] },
      { h: 'I tuoi diritti', p: [
        `Puoi vedere, correggere, scaricare o cancellare i tuoi dati e opporti al loro uso. Quasi tutto si fa nell'app (Account → Scarica i miei dati ti dà in un file tutto ciò che conserviamo su di te); per il resto scrivi a ${CONTACT_EMAIL}, risponderemo entro 30 giorni. Puoi anche rivolgerti al Garante per la protezione dei dati personali.`,
      ] },
      { h: 'Minori', p: [
        "Chiunque può usare l'app senza account. Per creare un account devi avere almeno 16 anni, o il permesso di un genitore.",
      ] },
      { h: 'Modifiche', p: [
        "Se questa informativa cambia, la nuova versione sarà qui con una nuova data. Se il cambiamento è importante, lo diremo nell'app a chi ha un account.",
      ] },
    ],
  },
  terms: {
    title: "Condizioni d'uso",
    updated: `Ultimo aggiornamento ${LEGAL_UPDATED}`,
    intro: `Queste condizioni valgono tra te e ${OWNER}, che realizza ${app}. Usando l'app le accetti.`,
    sections: [
      { h: "L'app", p: [
        `${app} è un corso di lingua offerto così com'è: ci impegniamo perché sia corretto, ma il corso è stato scritto con l'aiuto dell'IA ed è ancora in revisione da parte di madrelingua, quindi può contenere errori. Segnalali con "suona male?" o su GitHub.`,
        "Possiamo cambiare, aggiungere o togliere parti dell'app in qualsiasi momento.",
      ] },
      { h: 'Il tuo account', p: [
        "Tieni per te la password: sei responsabile di ciò che si fa con il tuo account. Usa un'email vera, così puoi recuperarlo.",
        "Possiamo bloccare un account che abusa dell'app o di altre persone, per esempio con segnalazioni offensive.",
      ] },
      { h: 'Ciò che ci invii', p: [
        'Quando invii una correzione o una registrazione, ci permetti di usarla gratuitamente per migliorare il corso. Invia solo ciò che hai il diritto di condividere.',
      ] },
      { h: "Diritto d'autore", p: [
        "Il codice dell'app è open source con la licenza indicata su GitHub. Il gatto Pishi, il nome e i contenuti del corso appartengono alla titolare; puoi condividere screenshot, ma non copiare il corso in un altro prodotto.",
      ] },
      { h: 'Funzioni a pagamento', p: [
        "Oggi l'app è gratuita. Se verranno aggiunte funzioni a pagamento, prezzo e condizioni saranno mostrati chiaramente prima di pagare, e nulla di ciò che hai gratis ti verrà tolto senza preavviso.",
      ] },
      { h: 'Responsabilità', p: [
        "Nei limiti di legge, non rispondiamo di danni indiretti dovuti all'uso dell'app. Nulla in queste condizioni limita i tuoi diritti di consumatore.",
      ] },
      { h: 'Legge e contatti', p: [
        `Queste condizioni seguono la legge italiana. Domande: ${CONTACT_EMAIL}.`,
      ] },
    ],
  },
})

/** The text of one document in the learner's language (Persian falls back to English for now). */
export function legalText(doc: LegalDoc, lang: string, app: string): Text {
  return (lang === 'it' ? it(app) : en(app))[doc]
}
