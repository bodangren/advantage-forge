# Pull request text (prepared 2026-10-04, not opened)

Branch `apk3d-games-port` in `../reading-advantage-monorepo-3d`, rebased on `origin/master`
fe6aedc2b, 51 commits. The owner opens the pull request and approves the deployment.

---

**Title:** feat(apk3d): word adventures — 28 dual-renderer games on the student's saved words (track_id: apk3d_games_port_20261003)

## Summary

Primary Advantage gets "Word adventures" at `/[locale]/student/games/story`: 28 reading games
with a three.js view and a Phaser 2D view for older phones. The games use the words and
sentences that the student saved from reading.

- `GET /api/v1/apk/practice` returns the practice set of the signed-in student: at most 10 saved
  words and 8 saved sentences, in FSRS due order (`userWordRecords`, `userSentenceRecords`).
  The games do not change FSRS state.
- A game that needs more items is locked. The card shows the number of missing words or
  sentences and links to `/student/read`.
- A finished game records one completion with learning evidence (`recordGameCompletion`,
  server XP). The evidence item ids are the flashcard record ids.

## Packages

| Package | Change |
| --- | --- |
| `packages/game-contracts` | Practice input (`practiceInputSchema`, `parsePracticeInput`, `toPracticeInput`), story input, story-game evidence (`inputId`); `learningEvidenceSchema` accepts story-game evidence |
| `packages/advantage-play-kit-3d` (new) | 3D kit runtime, HUD, model packs, the app host (`host/`, `react/`), the avatar composer, prices, and portrait layers (`avatar/`, no app use yet) |
| `packages/game-cartridges-3d` (new) | 28 games, model packs and sprites, browser QC (`qc/run.mjs`) |
| `packages/domain` | `listGamePracticeInput`, `gamePracticeInputRequestSchema`; `contributions.ts` checks `effectiveModality` first |
| `apps/primary-advantage` | Practice route, game page with locks, completion mapping, messages in five locales, asset sync (`sync:3d-assets`) |

The Advantage Forge repository owns the game and kit source. `port-game.mjs --check all` and
`port-kit.mjs --check` show no difference from Forge. `game-contracts` and the app host stay
owned by this repository.

Binary assets: 280 files, 29 MB (89 GLB models, 180 PNG and WebP images, 8 MP3 sounds, 3 fonts).

## Verification

- `game-cartridges-3d`: 120 test files, 1885 tests pass; type check clean.
- `advantage-play-kit-3d`: 14 test files, 155 tests pass; type check and lint clean. `advantage-play-kit` (2D) and `domain` type check clean.
- `domain`: practice input tests pass (13). In the full domain suite under load,
  `mastery-persistence-public-api` can time out; it passes alone.
- Primary: ESLint passes on the changed files; the practice route, page, and completion tests pass (3 files, 18 tests).
- Browser QC (headless Chromium, software GL): 28 of 28 games in 3D and in 2D, no page errors,
  no legacy asset requests.
- Phone QC (`qc/run.mjs --phone` 390 x 844 and `--phone-landscape` 844 x 390, touch events):
  112 of 112 runs in 3D and 2D pass. The layout fixes it led to are in the kit (labels move
  apart and stay on screen, Thai labels keep whole words, Rune Match tiles fit their words, a
  portrait game shows a turn cover on a phone on its side).
- App QC on a local database (seeded student, 390 x 844 viewport): the route returns 10 words
  and 8 sentences; the Thai and English pages open 28 games; Labyrinth (3D) and Rune Match (2D)
  show the saved items; with 3 words and no sentences, all 28 games lock and link to
  `/student/read`.
- Lockfile: regenerated with pnpm 11.8.0; `pnpm install --lockfile-only` gives no change.
- Every commit passes commitlint.

## Known issues (not caused by this branch)

- `pnpm architecture:check` fails on `origin/master` with "Analyzer input snapshot hash does not
  match current bytes". The manifest dates from 2026-09-08. This branch does not change it.
- The Primary type check reports 14 errors in `components/apk/StudentCartridgeHost.tsx` and
  `app/api/v1/apk/__tests__/routes.test.ts`. This branch does not change these files or their types.
- `graph.db` stores paths of the main checkout. Refresh it after the merge.

## Not in this pull request

- Monster Encounters left the student games. It becomes a teacher-led game in the reading
  lesson with student avatars and names (deferred).
- Real touch-device checks for the 21 rewritten games.
- Tutor Advantage receives nothing.

## Test plan

- [ ] `pnpm --filter @reading-advantage/game-cartridges-3d test`
- [ ] `pnpm --filter @reading-advantage/advantage-play-kit-3d test`
- [ ] `pnpm --filter @reading-advantage/domain test`
- [ ] Primary: `pnpm --filter primary-advantage sync:3d-assets`, then open `/th/student/games/story` as a student with saved words
- [ ] Play one 3D game and one 2D game to the results screen; check one `gameCompletions` row and the XP log

🤖 Generated with [Claude Code](https://claude.com/claude-code)
