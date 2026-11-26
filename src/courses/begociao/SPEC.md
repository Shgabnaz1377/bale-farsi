# Bego Ciao (بگو چائو): course spec

Bego Ciao teaches **Italian to Persian speakers**, A1 to B2. It reuses PersianMeow's engine and its `Unit` type
(`src/content/types.ts`), with the fields meaning something different:

| field | in Bego Ciao |
|---|---|
| `fa` | the **Italian** text (the language being learned). The name is historical. |
| `tr` | how the Italian **sounds, written in Persian letters** (e.g. ciao → `چائو`). For learners who read Persian script more easily than Latin letters. |
| `en` | the **Persian meaning** (standard written Persian, Persian script). |
| `alt` | other accepted Persian answers for typed exercises (synonyms, with/without ‌ها, etc.). |
| `note` | a short note **in Persian**. |
| `tiles` / `trTiles` | Italian word tiles / their Persian-letter pronunciation. `tiles.join(' ')` must equal the Italian sentence with punctuation (. , ! ? : ; « » " ( )) removed. Keep elided forms like `l'acqua`, `un'amica`, `c'è` as ONE tile. |
| unit `title`, `can`, `tip` | in **Persian**. `fa`/`tr` of the unit: its Italian name and pronunciation. |
| `grammar.title`, `grammar.body` | in **Persian**. Italian inside the body goes in `<span class="fa">…</span>` and must be followed immediately by its Persian-letter pronunciation in ` <i>…</i>` (or ` (…)`). Only `<b>`, `<i>`, `<span class="fa">` are allowed. |
| `grammar.examples` | Italian `fa`, pronunciation `tr`, Persian `en`. |
| `grammar.checks` | `q` and `why` in Persian; `options` are Italian; `optionsTr` their Persian-letter pronunciation; `answer` the right index. |
| `dialogue` | `who` an Italian first name or role in Italian letters (Marco, Giulia, Cameriere); `fa` Italian; `tr` pronunciation; `en` Persian. |
| `reading` (B1, B2) | `title` in Persian; `paragraphs[].fa` Italian, `paragraphs[].tr` **empty string ''** (too long to transliterate), `paragraphs[].en` Persian translation; `questions` in Persian with Persian options. |
| `digit` (numbers) | the number in Western digits, e.g. `'15'`. |

Unit ids: `a1-…`, `a2-…` etc. as in the checker; they only need to be unique within Bego Ciao.

## Writing Italian pronunciation in Persian letters (`tr`)

Write **every vowel visibly** so a Persian reader can say it right:
- a → ا (آ at the start of a word); e → ِ (kasra) inside a word, ـه at the end; i → ی; o → ُ (zamma) inside, و at the end; u → و.
- c + e/i → چ (ciao چائو, cena چِنا); c + a/o/u and ch → ک (casa کازا, chi کی); g + e/i → ج (gelato جِلاتو); g + a/o/u and gh → گ.
- gli → لی (famiglia فامیلیا); gn → نی (bagno بانیو); sc + e/i → ش (pesce پِشه); sci → ش; z → تس or دز (pizza پیتسا, zero دزِرو); qu → کو.
- double consonants: write once, but you may mark with ّ (tashdid) where it helps (pizza پیتّسا is fine).
- Separate words with spaces exactly like the Italian. Keep it readable, not pedantic; be consistent.

## Quality
- Correct, natural, contemporary Italian (standard, as spoken in Italy). Persian meanings and explanations: clear, natural standard Persian for an Iranian reader, using "تو" when addressing the learner.
- Explain Italian grammar by comparing with Persian where it helps (Persian has no articles or grammatical gender; Italian does; Italian puts the verb in the middle, Persian at the end; etc.).
- Facts in tips and readings must be real (Italian culture, food, places, history). Do not invent statistics, quotes or attributions; when unsure, leave it out or write a clearly everyday fictional scene.
- Words: 12 per unit, Italian `fa` and Persian `en` both unique within a unit. Sentences: 5. Grammar: 3–4 examples, 3 checks. A2+: dialogue 6–10 lines. B1/B2: reading of 2–3 paragraphs (B1 ~80–140 Italian words, B2 ~150–250) with 3 questions.
- Use ZWNJ in Persian where needed, written as the escape `‌` in the TS source.

Run `node scripts/check-bego.ts <level>` until it reports 0 problems.
