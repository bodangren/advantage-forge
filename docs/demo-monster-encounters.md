# Monster Encounters: a standalone reading-game demo

A public web demo (GitHub Pages) of how a Primary Advantage story turns into a 3D game encounter.
The student reads a real workbook story first, then a party of chibi heroes fights monsters in the
Sunken Vault, and every hero action needs the story's words, sentences, or answers. It is
standalone: no login, no app backend, no saved progress.

Audience: grades 3 to 6, CEFR A0 to A1, Thai students. It follows the game guardrails in the
Reading Advantage student-experience strategy (advantage-pr/14-reports/...-strategy-2026-06.md):
reading comes first, the game is an encounter built from the article, no timers or speed, no
game over, XP is cosmetic only, co-op before competition, no public ranking.

## Flow

1. **Title.** Choose one of three stories (level shown). Toggle helper mode.
2. **Read.** The story reader: pictures, paragraphs, tap a word for its Thai meaning and English
   definition, a Thai translation toggle per paragraph, read-aloud (browser voice). "Start the
   quest" appears at the end of the story.
3. **Quest.** Four encounters in the Sunken Vault (below).
4. **Results.** Stars, cosmetic XP, words and sentences to practice, and a reward: three stars
   unlock a color preset for a hero.
5. **Class boss.** A simulated class of 30 shares one weekly dragon: the student's correct answers
   add damage to the class total. It shows how asynchronous co-op would work; no ranking.

## The quest

Party: Knight, Wizard, Cleric. They take turns in that order. Each turn is one challenge for the
active hero.

| # | Place | Enemies (HP) | Challenge kind |
| --- | --- | --- | --- |
| 1 | The Bone Hall | 2 skeletons (2 each) | word: English word, pick its Thai meaning |
| 2 | The Bat Roost | 2 giant bats (2 each) | sentence: tap the words in order |
| 3 | The Treasure Room | 1 mimic (3) | fill: pick the word for the blank |
| 4 | The Dragon's Hall | 1 fire dragon (= number of story questions, 3 to 5) | question: story comprehension |

If a story lacks items of a kind, the encounter uses the next kind in this order: word, fill,
sentence, question (never an empty encounter). Enemy HP never exceeds what the items can cover
with some repeats.

### A turn

- **Correct:** the hero attacks the first enemy that is not defeated (damage 1). The Knight uses
  `attack`, the Wizard `attack`, the Cleric `attack2`. A correct Cleric also heals 1 courage
  (when below the maximum). Hit, then defeat when HP reaches 0.
- **Wrong:** the hero misses. The feedback gives the right answer and a kind explanation, and the
  paragraph to look at again when known. The item goes back into the queue and comes again at
  least two turns later (or as the last item if the queue is shorter). Then one enemy attacks:
  courage drops by 1.
- **Courage** starts at 5 (maximum 5). At 0 the team takes a rest: courage returns to 3 and the
  encounter continues. There is no game over and no timer anywhere.
- An encounter ends when all its enemies are defeated. The next encounter starts at once.
- When the queue of new items is empty but enemies remain, items come again: first those answered
  wrong, then the least recently seen.

### Challenge building (all choices come from the seeded random generator)

- **word:** prompt = the English word; options = its Thai meaning plus distractors from other
  words' Thai meanings in the same story (3 options in helper mode, 4 otherwise; never two
  identical option texts). Hint = the phonetic spelling, or the English definition in helper mode.
- **fill:** prompt = the sentence with its blank; options = the answer plus distractors from the
  other fill answers and the story words (same counts). Match answers without case sensitivity.
- **sentence:** tokens = the answer sentence split at spaces (punctuation stays attached to its
  word), shuffled, never already in order. A response is correct when the token texts, in the
  chosen order, equal the answer's words exactly. Two identical words are interchangeable.
- **question:** prompt = the question; options = the workbook's options in a shuffled order.

### Scoring (cosmetic)

- XP: 10 for a first-try correct answer, 5 for a correct retry, 20 for each encounter cleared, 50
  for victory. XP never gates content and never describes skill.
- Stars from first-try accuracy over items: 3 at 90% or more, 2 at 70% or more, else 1.
- Evidence per item: attempts, correct at the first try, solved.

### The class boss (simulated)

`simulateClassBoss(seed, yourDamage)`: a class of 30 with seeded first names (Thai nicknames in
Latin letters, like "Ploy", "Bank", "Mint"), about 60% to 80% of them have played this week, each
dealing 5 to 25 damage. The boss "Ember, the Fire Dragon" has 600 HP. The student's damage = correct
answers x 2. Report hp before and after, how many played, and the last five helpers (the student
first). No ranking.

## Content

Stories come from the Primary workbook generator (`../Workbooks/primary/**/NN-Title_workbook.json`)
through `scripts/apk3d-import.ts`, which writes `demo/public/stories/<id>/story.json` as a
`StoryInput` pack (section 5 of `docs/apk3d-cartridge.md`), WebP images, and
`demo/public/stories/index.json`. The demo converts a pack with `toStoryPack` in
`src/apk3d/contracts/story-input.ts` (the old `src/demo/core/content.ts`). Besides the two workbook sentences, the importer takes sentences of 3
to 8 words from the paragraphs (up to 12 per story, no quotation marks, no duplicates). Chosen
stories:

- Origins 2, lesson 12: "Pip is Brave" (A0)
- Origins 3.1, lesson 14: "Squeaky, the Small Mouse" (A0)
- Origins 3.1, lesson 7: "Pip and the Red Car" (A0; teamwork, like the class boss)
- Origins 2, lesson 4: "Fun Day at the Beach" (A0)
- Origins 3.1, lesson 2: "Pip's Happy Night" (A0)
- Origins 3.1, lesson 4: "Pip Sees Colors" (A0)
- Adventures 1.0, lesson 1: "The New Student" (A1; no images, Thai glosses written by a model,
  `reviewed: false`)
- Adventures 1.0, lesson 2: "The School Garden" (A1; the same)

## Code

| Path | Owner | Role |
| --- | --- | --- |
| `src/games/monster-encounters/core/types.ts` | shared | The contract: story pack, challenges, events, quest API |
| `src/games/monster-encounters/core/*.ts` | game core | Quest rules and the `Simulation` wrapper (seeded random in `src/apk3d/sim`, the class boss in `src/host/classBoss.ts`) |
| `scripts/apk3d-import.ts` | game core | Workbook JSON to `StoryInput` packs and WebP images |
| `tests/demo/*.test.ts` | game core | Rules and import tests |
| `src/games/monster-encounters/*` | frontend | The 3D cartridge: manifest, strings, start screen, battle stage, HUD, game loop |
| `src/host/*`, `demo/index.html`, `demo/main.ts` | frontend | The standalone host: selector (level, story, game), reader, start screen, results, class boss |
| `src/apk3d/*` | kit | The shared 3D kit (see `docs/apk3d-cartridge.md`) |
| `scripts/demo-models.ts` | frontend | Web-weight models from `out/` into `demo/public/models/` |
| `scripts/apk3d-shot.ts` | frontend | Plays the whole flow headless and saves screenshots (portrait and landscape) |
| `scripts/demo-publish.ts` | frontend | Builds the site and pushes it to the `gh-pages` branch |
| `vite.demo.config.ts` | frontend | Dev server and the static build (`dist-demo/`) |

The frontend never decides correctness or damage: it shows the core's current challenge, sends the
student's response, and animates the returned events in order. The core never touches the DOM,
three.js, time, or `Math.random`.

## Running it

```bash
node --import tsx scripts/apk3d-import.ts                # story packs from ../Workbooks/primary
node --import tsx scripts/demo-models.ts                 # web models from out/ (after forge builds)
node_modules/.bin/vite --config vite.demo.config.ts      # dev server at http://127.0.0.1:5190
node_modules/.bin/vitest run tests/demo                  # the game core's tests
node --import tsx scripts/apk3d-shot.ts both --dist     # play the built site, screenshots in out/apk3d-shots/
node --import tsx scripts/demo-publish.ts                # publish to GitHub Pages
```

Public page: https://bodangren.github.io/advantage-forge/

### Web weight

The web models are the Forge characters merged into one skinned mesh each (1 to 3 draw calls),
simplified to 10k to 16k triangles, with 512 px WebP textures and Meshopt compression: 340 to
560 KB per character instead of 5 to 8 MB. Map pieces repeat, so they are drawn as instanced
meshes (one draw call per piece type) and simplified harder (their detail lives in the normal
map). The vault and the heroes load first (about 4 MB); the monsters load while the student
reads. The whole site is about 8 MB; the script is about 210 KB gzipped.

## Demo content and read-aloud (2026-10-02)

The published demo has four stories: the first article of `bank-1` to `bank-4` in the Workbooks lesson
packages (`scripts/apk3d-import-bank.ts`). These are not workbook articles. The workbook stories stay
in `tests/fixtures/stories` for the tests only (`scripts/apk3d-import.ts`). A story can carry `audio`:
`article.mp3` with a time span for each sentence (and its paragraph), and `words.mp3` with a span for each
glossary word. The reader plays a paragraph or the whole story, marks the sentence being read, and plays
recorded words in the word card. A story with no `audio` uses the browser voice. All games accept `Pre-A1`.
