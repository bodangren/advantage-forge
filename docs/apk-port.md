# Porting the APK 3D kit and the games into the monorepo

> Measure owns execution status. See the [track crosswalk](../measure/plan-crosswalk.md).
> This document retains its original design and historical notes.

Status: plan, 2026-09-28 (task 20 of `docs/apk3d-cartridge.md`; Phase C of
`docs/apk-2d3d-program.md`). Target: `../reading-advantage-monorepo` at commit fe6aedc2b, the
commit every APK copy in `src/apk3d/contracts/apk.ts` and `sprite-asset.ts` was taken from.
Re-check the copies against `HEAD` before step 1: `git -C ../reading-advantage-monorepo diff
fe6aedc2b HEAD -- packages/advantage-play-kit/src/runtime packages/advantage-play-kit/src/editions
packages/game-contracts/src`.

Rules: one pull request per step, in this order; every step ends with the tests of its blast
radius green (section "Tests to run") and a fresh `repo-graph affected` run; nothing in the
monorepo changes before Phase B gives Potion Rush its 2D view (the catalog tests need
`createGameConfig` on every listed cartridge, step 5).

## Status of 3 October 2026

Steps 1 to 6 exist on a local monorepo branch (`apk3d-games-port`, worktree `reading-advantage-monorepo-3d`, not pushed). Differences from this plan:

- The kit lives in `packages/advantage-play-kit-3d` and the 29 games in `packages/game-cartridges-3d`. The games keep their own registry; `cartridgeCatalog` stays unchanged.
- The host is `startStoryGame` and `StoryGameHost` (React). `APKGameHost` stays unchanged.
- Story and model-pack JSON ship as static assets, copied into the app `public/` by `scripts/sync-assets.mjs`.
- The story contracts (`story-input`, `evidence`) live in `@reading-advantage/game-contracts`.
- Primary Advantage offers the games at `student/games/story`. Completion goes through `recordGameCompletion` with game type `<game>-story`; the server computes XP.
- `scripts/port-game.mjs` in the games package copies a game from this repository and rewrites its imports.
- The copies in `contracts/apk.ts` and `sprite-asset.ts` are still copies. Replace them with APK imports.

The monorepo track is `measure/tracks/apk3d_games_port_20261003/`.

### Changes of 4 October 2026

- Forge is the source of the games. Edit a game in Forge, then copy it with `port-game.mjs`. The
  play-test edits of 3 October existed only in the monorepo copies; they moved to Forge (89a4769),
  and the script now reproduces the monorepo files.
- The game input is wrong. The owner rejected the story picker (owner decision 1 in section 6):
  the games must read the student's saved vocabulary and sentences, chosen by memory state. Track
  `game_flashcard_input_20261004` owns the change.
- The old uncommitted edits of 28 September in the main monorepo checkout are removed. The port
  branch replaces them.
- The port branch rebase waits until the input change is done. Its base `apk3d-port` carries 18
  unrelated `www` commits.
- The input change is done (track `game_flashcard_input_20261004`, completed 4 October). The
  games read `GET /api/v1/apk/practice`: at most 10 saved words and 8 saved sentences in FSRS
  due order. A game without enough items is locked and links to `/student/read`. Monster
  Encounters left the student games. The briefings say "Your words" and "one of your sentences",
  not "your story".
- App QC on a local database: seed the student with `seed-host-proof-session.ts` and
  `seed-demo-queue.ts`, make a cookie with `make-demo-session.ts`, sync the assets
  (`sync:3d-assets`), and start `next dev` on a free port. On the reference machine the first
  request to a route compiles for up to 4 minutes, so warm each route with `curl` before a
  browser run. The two seed scripts are local-only and not committed (owner decision open).

### Kit ownership (owner, 2026-10-04)

Forge owns the development of the 3D kit, as it owns the games. Changes are made in Forge and
copied into `packages/advantage-play-kit-3d`. Two parts stay with the monorepo:

- The contracts that the server also reads (`@reading-advantage/game-contracts`: the story and
  practice input, the evidence, and the APK types). The server checks every completion with
  them. The Forge copies in `src/apk3d/contracts` follow them, and a check compares the two.
- The app host (`host/`, `react/`). It exists only for the apps; Forge has its own demo host.

On 4 October, 52 of the 58 shared kit files were identical. The differences were the contract
re-exports (by design), the CSS loading (`installCss`, which the copy script can make), and one
loader refactor (`fetchModelPack`). Forge now has both (`hud/css.ts`, `stage/loader.ts`).

`packages/advantage-play-kit-3d/scripts/port-kit.mjs <forge>` copies the kit; `--check` writes
nothing and lists every kit file that differs from Forge. It also parses the same fixtures with
the Forge contract copies and with `game-contracts` (every story, its practice part, a saved
flashcard input, evidence, and broken variants) and lists every disagreement. Run the check
before every monorepo commit that touches the kit or the contracts.

## 1. Packages

| Move | From (this repo) | To (monorepo) | Package name |
| --- | --- | --- | --- |
| the kit | `src/apk3d/` | `packages/advantage-play-kit-3d/src/` | `@reading-advantage/advantage-play-kit-3d` |
| the games | `src/games/<game>/` | `packages/game-cartridges-3d/src/<game>/` | `@reading-advantage/game-cartridges-3d` |
| the content tools | `scripts/apk3d-import.ts`, `scripts/apk3d-models.ts` | `packages/reading-advantage-scripts/` | existing package |
| story packs | `demo/public/stories/` | served by the app (`apps/advantage-games/public/stories/` first) | |
| model packs | `demo/public/packs/` | `apps/advantage-games/public/packs/` | |
| sprite packs | `demo/public/assets/apk/<pack>/` | `apps/advantage-games/public/assets/apk/<pack>/` | the APK root rule |

Why two new packages and not folders in `advantage-play-kit` and `game-cartridges`: the kit
imports `three` (not a dependency of `advantage-play-kit`, which is imported by server code
through `guards/` and `assets/`), and `game-cartridges` builds with an explicit `tsup` entry list
of 30 files and a catalog test per entry. New packages keep the blast radius of the move itself
at zero. `phaser` comes from the workspace catalog (`phaser: 4.2.1`); `three` is added to the
catalog at `0.185.1`.

The copies in `src/apk3d/contracts/apk.ts` and `sprite-asset.ts` become imports from
`@reading-advantage/game-contracts` and `@reading-advantage/advantage-play-kit` (the file headers
name each source). `src/apk3d/factory/{phaser-factory,input}.ts` are deleted; the kit imports
`createPhaserGameFactory` and `createInputController` from the APK. `src/host` is not ported
(section 8).

## 2. `game-contracts` changes

| Change | File | Blast radius (files that name the symbol, outside `node_modules`, `dist`, `.next`) |
| --- | --- | --- |
| a. `story-input.ts` (new): `storyInputSchema`, `StoryInput`, `cefrLevelSchema`, `toVocabularyInput`, `toSentenceInput` | `packages/game-contracts/src/story-input.ts`, exported from `index.ts` | 0: additive |
| b. `GameInput = VocabularyInput \| SentenceInput \| StoryInput` | `advantage-play-kit/src/runtime/types.ts` (the type lives there) | 26: `game-cartridges` 20, `advantage-play-kit` 3, one file in each of `reading-advantage`, `primary-advantage`, `advantage-games`. Every cartridge narrows with `sentenceInputSchema.parse(context.input)` or `vocabularyInputSchema.parse(...)` before use (the Potion Rush pattern), so the union grows without a runtime change; `check-types` finds any cartridge that reads `input.length` on the raw union |
| c. `inputMode: 'vocabulary' \| 'sentence' \| 'story'` | `game-contracts/src/host-proof-bindings.ts:96` (the enum), `advantage-play-kit/src/runtime/cartridge-manifest.ts`, `runtime/types.ts` | 36 app files mention `inputMode` (`advantage-games` 14, `reading-advantage` 11, `primary-advantage` 11); most compare against a literal. The ones that switch exhaustively (catalog filters, the host-proof pages) get a `'story'` branch. `mountCartridge` picks the input schema by `inputMode`: it gets the `storyInputSchema` branch |
| d. `storyGameEvidenceSchema` joins `learningEvidenceSchema` | `game-contracts/src/listening.ts:427` (the union), `evidence.ts` (new) | 11: `game-contracts` 4, `advantage-play-kit` 3, `domain` 1, one app file each in `reading-advantage`, `primary-advantage`, `advantage-games`. `runtime.ts:385` narrows on `evidence.declaredModality`; the new member has `kind: 'story-game'` and no `declaredModality`, so that check keeps working. The apps' evidence writers persist `metadata.learningEvidence` as JSON and need no change |

`repo-graph affected` on `educational-io.ts` and `listening.ts` reports 2 and 1 direct importers
(the package index and the host-proof bindings); the counts above are transitive, by symbol.

## 3. `advantage-play-kit` changes

| Change | File | Blast radius |
| --- | --- | --- |
| a. `RuntimeCartridgeManifest.renderers?: readonly ('three' \| 'phaser')[]`; `runtimeCartridgeManifestSchema` gets the optional field (the schema is `.strict()`, so today a 3D manifest is rejected) | `runtime/types.ts`, `runtime/cartridge-manifest.ts` | 5 files name the schema (`advantage-play-kit` 4, `game-cartridges` 1); optional, so no cartridge changes |
| b. `RuntimeCartridge`: `createGameConfig?` and `createGame?(context: Game3DContext)`, one required per listed renderer (`validateCartridge` from `factory/select.ts`) | `runtime/types.ts` | 30 files name `RuntimeCartridge` (`game-cartridges` 19, `advantage-play-kit` 11); 70 `createGameConfig` implementations in `game-cartridges` stay valid. Call sites that call `cartridge.createGameConfig(...)` on the type must narrow: `phaser-factory.ts`, `testing/fixtures.ts`, `runtime.test.ts`, `phaser-factory.test.ts`, and 2 host files in `advantage-games`. Alternative with a smaller radius: keep `RuntimeCartridge` as is and add `ThreeCartridge` as a second type accepted by `mountCartridge` (`RuntimeCartridge \| ThreeCartridge`); take this one if `check-types` shows more than the six sites |
| c. `CartridgeGameConfigContext.complete(result, outcome?, evidence?)` and `GameFactoryContext.complete` the same; `mountCartridge` forwards the third argument to `completeForGeneration` and then `host.complete(result, outcome, evidence)` | `runtime/types.ts`, `runtime/runtime.ts`, `runtime/phaser-factory.ts` | 8 files name `mountCartridge` (`advantage-play-kit` 7 including tests, `game-cartridges` 1); 4 name `APKHostAdapter`. Additive parameter; existing callers pass two arguments |
| d. `runtime/three-factory.ts` (from `src/apk3d/factory/three-factory.ts`) and `runtime/select.ts` (`selectRenderer`, `selectGameFactory(cartridge, gate, setting)`) | new | 0 |
| e. `mountCartridge`: `validateEdition` only when the renderer is `'phaser'`; a 3D mount validates `edition3d` with `runtimeEdition3DSchema`; `MountCartridgeOptions` gets `renderer`, `edition3d?` | `runtime/runtime.ts`, `runtime/types.ts` | the 8 files of (c); `runtime.test.ts` gets the 3D branch tests from `tests/apk3d/factory.test.ts` |
| f. The device gate: `guards/device-gate.ts` from `src/apk3d/device/gate.ts` | new | 0 |
| g. `react/apk-game-host.tsx`: `factory ?? selectGameFactory(cartridge, checkDevice(...), props.renderer)`; a `renderer` prop; the briefing screen takes the game's `briefing(i18n, input)` (already the `gameBriefingSchema` shape) | `react/apk-game-host.tsx` | 14 files name `APKGameHost` (`advantage-play-kit` 4, `primary-advantage` 4, `advantage-games` 4, `reading-advantage` 2); the prop is optional, so the host pages change only when they opt in |
| h. Model packs: no change to `PhysicalAssetKind` (12 files name it) or `validateEdition`; `modelPackSchema` and `RuntimeEdition3D` live in the 3D kit | none | 0 |

`repo-graph affected` (direct importers, graph of 2026-09-14): `runtime/types.ts` 4 files
(`runtime.ts`, `apk-game-host.tsx`, and their tests), `runtime/runtime.ts` 2, `phaser-factory.ts`
3, `editions/editions.ts` 3, `cartridge-manifest.ts` 1. The graph resolves relative imports
only; the symbol counts above add the package-boundary consumers (76 files in `game-cartridges`,
17 in `advantage-games`, 10 each in `reading-advantage` and `primary-advantage` import the APK).
Rebuild the graph before the port: `repo-graph scan . graph.db` at the monorepo root, or
`repo-graph update graph.db <changed files>` after each step.

## 4. The kit package

`packages/advantage-play-kit-3d`: `src/apk3d/*` minus `factory/{phaser-factory,input}.ts` and
minus the contract copies. Depends on `three`, `zod`, `@reading-advantage/game-contracts`,
`@reading-advantage/advantage-play-kit`. Tests: `tests/apk3d/*` move to `src/**/*.test.ts` in
the package (the monorepo convention), the import-rule test rewritten for the package layout.
`FORGE_SLOTS`, the CLI, and the render code stay in this repo; the kit never imports them.

## 5. The games package and the catalog

`packages/game-cartridges-3d/src/<game>/` = `src/games/<game>/` (core, view, view2d, manifest,
briefing, strings, qc). Each game exports `cartridge` (both renderers) and `strings`. The
catalog (`game-cartridges/src/catalog.ts`) gets one lazy entry per game:
`'potion-rush-3d': () => import('@reading-advantage/game-cartridges-3d/potion-rush')`. The
catalog tests (`catalog.test.ts`, `catalog-standard-art.test.ts`, `existing-core-*.test.ts`)
call `createGameConfig` on every entry with a `RuntimeEdition`; so a game enters the catalog only
with its 2D view (Phase B) and a sprite pack that passes `validateEdition`.

## 6. Host pages

`apps/advantage-games`: the student games page (`src/app/[locale]/(student)/student/games/page.tsx`)
lists the catalog; the 3D games need the story step before play (owner decision 1). New page
flow under `student/games/story/<story>/<game>`: reader (the `advantage-games` reader component),
briefing, `APKGameHost` with `input: story`, `renderer` from the profile setting. The hosts
`PublicCartridgeHost.tsx` and `AuthenticatedCartridgeHost.tsx` take the `renderer` prop and the
3D edition. Results: `resultExtension` renders stars and the practice list from
`evidence.items` (the host `src/host/results.ts` logic, moved). The class boss is the app's
class challenges (`challenges.ts`), fed by `evidence` `correctAnswers * 2`; the simulated boss is
not ported.

## 7. Content, localization, QC

- Stories: `scripts/apk3d-import.ts` runs in the workbook pipeline
  (`packages/reading-advantage-scripts`), writes `StoryInput` JSON per story plus `index.json`
  (`storyIndexSchema`); the app serves them as static files first, from the database later.
- Strings: paste each `strings.en.ts` under `pages.student.games.<game>` in
  `apps/advantage-games/src/locales/en.ts`; add `th`. The kit `createI18n` becomes an adapter over
  the app's `useTranslations` with the same `t(key, params)` and `scope()` shape.
- QC: `scripts/apk3d-shot.ts` becomes a `qc/` driver behind `BrowserQcDriver`; the `__apk3d`
  hook stays; screenshots run in the app's Playwright suite.

## 8. Removal list

`src/host` (the app pages replace it), `src/host/classBoss.ts` (the simulated boss),
`localStorage` persistence (the profile owns the hero look and the renderer setting),
`demo/`, `vite.demo.config.ts`, `scripts/demo-publish.ts`.

## Tests to run, per step

| Step | Command (monorepo root) |
| --- | --- |
| 2 | `pnpm --filter @reading-advantage/game-contracts test` and `check-types`; `pnpm --filter @reading-advantage/game-cartridges test` (the 20 `GameInput` users); `pnpm --filter ./apps/advantage-games exec vitest run src/app/[locale]/(student)/student/games src/components/apk` |
| 3 | `pnpm --filter @reading-advantage/advantage-play-kit test` (`runtime.test.ts`, `phaser-factory.test.ts`, `apk-game-host.test.tsx`, `editions.test.ts`, `test-kit.test.ts`); `pnpm --filter @reading-advantage/game-cartridges test` (`existing-core-host-proof-parity.test.ts`, every `*.test.ts` that mounts) |
| 3g, 6 | `apps/advantage-games`: `PublicCartridgeHost.test.tsx`, `AuthenticatedCartridgeHost.test.tsx`, `games/page.test.tsx`; `apps/reading-advantage` and `apps/primary-advantage`: the `HostProofGameClient` tests |
| 4, 5 | the two new packages' own tests; `pnpm --filter @reading-advantage/game-cartridges test` (catalog) |
| every step | `pnpm check-types`, `pnpm lint`, `repo-graph affected graph.db <changed files>` |
