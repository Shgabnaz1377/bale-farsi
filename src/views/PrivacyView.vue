<script setup lang="ts">
import { computed } from 'vue'
import { P } from '@/lib/store.ts'
import { APP } from '@/app.ts'
import { PRIVACY_VERSION } from '@/lib/account.ts'

/**
 * Privacy policy (GDPR, art. 13). Written in English and Italian here rather than through t():
 * it is a legal text, kept whole in each language. Change PRIVACY_VERSION (src/lib/account.ts) when it changes.
 */
const CONTACT = 'ghaffarishabnaz@gmail.com'

interface Section { h: string; p: string[] }
const EN: Section[] = [
  { h: 'Who is responsible', p: [
    `${APP.fullName} is a free course made by Shabnaz Ghaffari, who is the data controller. Write to ${CONTACT} for anything about your data.`,
  ] },
  { h: 'Without an account', p: [
    'You can use the course without an account. Your progress, settings and hearts are then saved only in your browser on this device (local storage). They are not sent to us.',
    'We use no cookies, no advertising, no analytics and no tracking. Browser storage is used only to make the app work, so no consent banner is needed.',
    'Fonts, pictures and recordings come from this site itself. Like any website, the host (GitHub Pages, run by GitHub Inc. in the USA) receives your IP address to deliver the pages, and may keep it briefly in its server logs for security.',
  ] },
  { h: 'With an account', p: [
    'If you create an account we store: your name, your email address, your password (only as a secure hash), the date you signed up and agreed to this policy, when you were last active, and your learning progress (lessons done, XP, streak, review cards, settings).',
    'If you report that a recording sounds wrong, we also store that report: the word, what you wrote, and the date.',
    'Why: to give you the account you asked for, so you can carry on from any device (GDPR art. 6(1)(b), a contract with you). The course owner can see learners’ names, emails, activity and progress to look after the course, answer questions and stop abuse (art. 6(1)(f), legitimate interest). Nobody else can see them.',
    'We send you emails only to confirm your account or reset your password. We never sell or share your data, and never use it for advertising.',
  ] },
  { h: 'Where it is kept', p: [
    'Accounts are run by Supabase, on servers in the European Union, under a data processing agreement. Supabase sends the account emails.',
  ] },
  { h: 'How long', p: [
    'We keep your account data until you delete your account. You can do this any time on the Account page; it removes your account, profile and saved progress at once. Pronunciation reports you sent stay, without your name or email, to keep the recordings correct.',
  ] },
  { h: 'Your rights', p: [
    'You can see, download, correct or delete your data at any time. On the Account page: “Download my data” gives you everything we keep about you as a file, you can change your name and password, and “Delete my account” deletes it.',
    `You can also object to how we use your data or ask us anything by writing to ${CONTACT}. We answer within one month.`,
    'If you think we handle your data wrongly, you can complain to a data protection authority: in Italy, the Garante per la protezione dei dati personali (garanteprivacy.it).',
  ] },
  { h: 'Children', p: [
    'Accounts are for people aged 14 or older. Younger learners can use the course without an account.',
  ] },
  { h: 'Links to other sites', p: [
    'Some buttons open other sites, for example Google Translate when you search a word we do not have. Those sites have their own privacy policies, and nothing is sent to them unless you tap.',
  ] },
]
const IT: Section[] = [
  { h: 'Chi è responsabile', p: [
    `${APP.fullName} è un corso gratuito creato da Shabnaz Ghaffari, titolare del trattamento. Per qualsiasi cosa sui tuoi dati scrivi a ${CONTACT}.`,
  ] },
  { h: 'Senza account', p: [
    'Puoi usare il corso senza account. In questo caso progressi, impostazioni e cuori restano solo nel tuo browser su questo dispositivo (memoria locale). Non vengono inviati a noi.',
    'Non usiamo cookie, pubblicità, statistiche o tracciamento. La memoria del browser serve solo a far funzionare l’app, quindi non serve un banner per il consenso.',
    'Caratteri, immagini e registrazioni arrivano da questo stesso sito. Come per ogni sito web, chi lo ospita (GitHub Pages, gestito da GitHub Inc. negli USA) riceve il tuo indirizzo IP per consegnare le pagine e può conservarlo per breve tempo nei log, per sicurezza.',
  ] },
  { h: 'Con un account', p: [
    'Se crei un account conserviamo: il tuo nome, la tua email, la password (solo in forma cifrata e irreversibile), la data di iscrizione e di accettazione di questa informativa, l’ultima attività e i tuoi progressi (lezioni fatte, XP, serie di giorni, schede di ripasso, impostazioni).',
    'Se segnali che una registrazione suona male, conserviamo anche la segnalazione: la parola, ciò che hai scritto e la data.',
    'Perché: per darti l’account che hai chiesto, così puoi continuare da qualsiasi dispositivo (GDPR art. 6(1)(b), contratto con te). La proprietaria del corso vede nomi, email, attività e progressi degli studenti per curare il corso, rispondere alle domande e fermare abusi (art. 6(1)(f), legittimo interesse). Nessun altro li vede.',
    'Ti mandiamo email solo per confermare l’account o reimpostare la password. Non vendiamo né condividiamo mai i tuoi dati e non li usiamo per pubblicità.',
  ] },
  { h: 'Dove sono conservati', p: [
    'Gli account sono gestiti da Supabase, su server nell’Unione Europea, con un accordo sul trattamento dei dati. Supabase invia le email dell’account.',
  ] },
  { h: 'Per quanto tempo', p: [
    'Conserviamo i dati del tuo account finché non lo elimini. Puoi farlo quando vuoi dalla pagina Account: account, profilo e progressi salvati vengono cancellati subito. Le segnalazioni sulla pronuncia restano, senza nome né email, per mantenere corrette le registrazioni.',
  ] },
  { h: 'I tuoi diritti', p: [
    'Puoi vedere, scaricare, correggere o cancellare i tuoi dati in qualsiasi momento. Nella pagina Account: “Scarica i miei dati” ti dà in un file tutto quello che conserviamo su di te, puoi cambiare nome e password, e “Elimina il mio account” lo cancella.',
    `Puoi anche opporti a come usiamo i tuoi dati o chiederci qualsiasi cosa scrivendo a ${CONTACT}. Rispondiamo entro un mese.`,
    'Se pensi che trattiamo male i tuoi dati puoi presentare reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).',
  ] },
  { h: 'Minori', p: [
    'Gli account sono per chi ha almeno 14 anni. Chi è più giovane può usare il corso senza account.',
  ] },
  { h: 'Link ad altri siti', p: [
    'Alcuni pulsanti aprono altri siti, per esempio Google Traduttore quando cerchi una parola che non abbiamo. Quei siti hanno la loro informativa, e non ricevono nulla finché non tocchi il pulsante.',
  ] },
]
const it = computed(() => P.settings.lang === 'it')
const sections = computed(() => (it.value ? IT : EN))
const title = computed(() => (it.value ? 'Informativa sulla privacy' : 'Privacy policy'))
const updated = computed(() => (it.value ? 'Aggiornata il' : 'Last updated') + ' ' + PRIVACY_VERSION)
</script>

<template>
  <main class="wrap page privacy">
    <h1>{{ title }}</h1>
    <p class="muted small">{{ updated }}</p>
    <section v-for="s in sections" :key="s.h">
      <h2>{{ s.h }}</h2>
      <p v-for="(para, i) in s.p" :key="i">{{ para }}</p>
    </section>
  </main>
</template>

<style scoped>
.privacy { max-width: 720px }
.privacy h1 { font-size: 1.7rem; font-weight: 800 }
.privacy h2 { font-size: 1.15rem; margin-top: 1.4rem }
.privacy p { margin: 0.5rem 0 }
</style>
