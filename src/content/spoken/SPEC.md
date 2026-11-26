# Spoken forms for PersianMeow's audio

The app shows Persian as it is written, but the recorded audio should sound like real everyday Persian
(Tehran colloquial), the way a friendly native speaker would say the sentence to a learner. These files map a
displayed text to the text the voice should read. The display never changes; only the audio does.

## File format
`src/content/spoken/<level>.ts` (a1, a2, b1, b2):

```ts
/** Displayed Persian → how the voice should say it (only entries that differ). */
export const SPOKEN_A1: Record<string, string> = {
  'من آب می‌خواهم.': 'من آب می‌خوام.',
}
```
- **Keys are copied exactly** from the export JSON's `text` (same characters, punctuation and ZWNJ; write ZWNJ as `‌`).
- Only include texts whose spoken form **differs**. Most single words stay as they are and are left out.
- Values are in Persian script, in the spelling a Persian speaker would use when writing colloquially, because the
  speech engine reads what it sees: می‌خوام، می‌رم، نمی‌دونم، اونجا، ساراست، کتابو، خونه، می‌گه، هستن، داره.

## What to change
Typical written → spoken: می‌خواهم→می‌خوام، می‌روم→می‌رم، می‌گوید→می‌گه، است (after a word)→ـه / ـست، هستند→هستن،
دارند→دارن، را→رو / ـو، آن→اون، آنجا→اونجا، نان→نون، خانه→خونه (only where people really say it), می‌توانم→می‌تونم،
می‌دانم→می‌دونم، بروید→برید، بیایید→بیاید، ‌اید→ین. Keep it natural, not exaggerated slang. If a sentence is already
colloquial, leave it out.

## What NOT to change (leave out of the map)
- Reading passages (paragraphs) and anything newspaper-like, formal letters, official announcements.
- Poetry, proverbs and literary quotes (Hafez, Saadi, Rumi, Ferdowsi; proverbs keep their fixed wording).
- The B2 unit about written vs spoken Persian (b2-registers): its written examples must sound written.
- Grammar examples whose point is a written form (e.g. a grammar note about formal endings).
- Names, numbers and words that people say exactly as written.
