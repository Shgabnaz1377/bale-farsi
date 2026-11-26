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
| **Settings** | Persian script, Latin transliteration, or both; light/dark; backup and restore progress. |

Audio uses the browser's speech synthesis and needs a Persian (fa-IR) voice; Microsoft Edge ships one.

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
