# Bale · Learn Persian (Farsi), A1 to B2

**Live:** https://shgabnaz1377.github.io/bale-farsi/

Bale (<span lang="fa">بله</span>, "yes") is a free web app that teaches Persian to English speakers, from first letters to upper-intermediate reading. It runs entirely in the browser; progress is saved locally.

## What's in it

| | |
|---|---|
| **Alphabet** | All 32 letters with their four joined shapes, example words, and six lessons. |
| **Course** | 24 units across A1, A2, B1 and B2, 288 words and 120 sentences. Each unit has two word lessons, a grammar lesson, a sentence-building lesson, and from A2 a dialogue, from B1 a reading. |
| **Exercises** | Pick the meaning, pick the Persian, match pairs, type the English, build sentences from tiles (right to left for Persian), read Persian digits, listen and choose, reading comprehension. |
| **Review** | Leitner spaced repetition: every word you meet comes back when it is due. |
| **Level tests** | Test out of a level to unlock the next one. |
| **Motivation** | XP, daily goal, streak on the Persian week (Saturday first), hearts or a relaxed mode. |
| **Accounts** | Optional sign-in by email link; progress syncs across devices and merges with what is already on the device. |
| **Finglish** | Every Persian word, sentence, grammar answer and reading also comes in Finglish (Persian in English letters), so you can start before you can read the alphabet. |
| **Settings** | Show Persian script + Finglish, Finglish only, or script only; light/dark; backup and restore progress. |

Audio uses the browser's speech synthesis and needs a Persian (fa-IR) voice; Microsoft Edge ships one.

## Accounts (optional)

Without configuration Bale is fully offline and keeps progress in the browser. To let learners sign in and sync:

1. Create a [Supabase](https://supabase.com) project.
2. In its SQL editor, run [`supabase/schema.sql`](supabase/schema.sql): one `progress` row per learner, with row level security so each learner can only read and write their own row.
3. Under Authentication → URL Configuration, add the site URL (e.g. `https://shgabnaz1377.github.io/bale-farsi/`) to the redirect URLs.
4. Set the repository variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` (Settings → Secrets and variables → Actions → Variables). Both are public by design. Locally, put them in `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Sign-in uses a one-time email link (PKCE). Signing out clears the device so the next learner starts fresh.

## Content quality

The course content was drafted with AI assistance and checked automatically (`npm run check:content`) for structure: every sentence's tiles rebuild the sentence, every exercise has exactly one right answer, ZWNJ is used where Persian needs it. It still needs review by a native speaker; spoken vs written forms, transliteration choices and the quoted poetry are the places most worth checking. Corrections are very welcome as issues or pull requests: the whole course is plain TypeScript in [`src/content/`](src/content/).

## Develop

```bash
npm install
npm run dev            # http://localhost:5173
npm run check:content  # course content rules
npm run lint && npm run typecheck && npm test
npm run build          # content check + typecheck + production build
npx playwright test    # browser smoke tests, including a full lesson
```

Vue 3, TypeScript, Vite, Vitest and Playwright. Static output with hash routing, so it deploys to any static host; `main` deploys to GitHub Pages.

## License

MIT © Shabnaz Ghaffari
