# APK 3D: the cartridge, the kit, and the host

Status: design, 2026-09-27. Owner decisions are fixed (see the list at the end of the
introduction). Everything else in this document is decided here. Open items that only the owner
can decide are in section 13.

This document defines how the 3D reading games in this repo are built so that they publish to
GitHub Pages now and move into the Advantage Play Kit (APK) later with adapter work only. The
port itself is `docs/apk-port.md` (outline in section 14).

Fixed owner decisions: (1) front flow = level, story, game; the student reads first. (2) Several
games, turn-based and real-time; Potion Rush 3D first; Monster Encounters stays. (3) LINE in-app
browser, portrait 390x844 first, a clear gate for old devices, no 2D fallback. (4) A briefing
screen for every game; all UI text comes from a catalog. (5) A story input contract, proposed for
`game-contracts`. (6) Standalone in this repo, portable to the APK in the same major shapes.
(7) Stories come only from `../Workbooks/primary` for now. Primary book levels 1 to 3 are CEFR
A0 and levels 4 to 6 are A1; A2 exists only in the secondary app. The level of each story comes
from the workbook field `cefr_level`, never from the folder name. The selector shows A0 and A1
with stories and A2 as "coming soon". The story input and the selector accept A2 and more books
later without a contract change.

Review (Claude, 2026-09-27, checked against the APK code): the APK names in this document exist
(`runtimeCartridgeManifestSchema`, `createPhaserGameFactory`, the `capability:*` ids,
`BOUNDED_FRAME_DELTA_CEILING_MS = 50`, `BrowserQcDriver`, `resultExtension`, the catalog panels).
Four corrections are applied: WebGL2 is required (section 9), the QC runs skip the software-GL
check (section 9), audio unlocks on every gesture (section 9), and the briefing uses the exact
APK `gameBriefingSchema` (sections 4 and 8). Section 5 now has the real `cefr_level` values and
the owner's A2 decision.

Sources read: `src/demo/core/types.ts`, `src/demo/app/*`, `scripts/demo-*.ts`,
`advantage-play-kit/src/runtime/types.ts`, `runtime/runtime.ts`, `runtime/phaser-factory.ts`,
`presentation/*-contract.ts`, `game-contracts/src/{educational-io,listening,completion}.ts`,
`advantage-games/src/components/games/game/GameStartScreen.tsx`, `src/locales/en.ts`,
`src/store/usePotionRushStore.ts`, and the workbook JSON fields in `../Workbooks/primary`.

## 1. The shape in one picture

```
host (standalone now, APK later)
  selector -> reader -> briefing -> [game instance] -> results -> class boss
                                       |
                    three-factory: device gate, stage, loop, HUD root
                                       |
                    cartridge.createGame(context) -> Game3DInstance
                                       |
                  view (three.js + HUD)  <-- events --  core (pure simulation)
                                          -- commands -->
```

Three layers, and the import rules between them are strict (section 4):

| Layer | Owns | Must never import |
| --- | --- | --- |
| `core` of a game | rules, seeded random, commands in, events out | DOM, three.js, time, `Math.random` |
| `view` of a game | actors, camera, HUD, audio cues for its events | other games, the host |
| `kit` (`src/apk3d`) | contracts, simulation loop, stage, HUD widgets, i18n, device gate, factory, QC driver | games, host |
| `host` (`src/host`) | selector, reader, briefing, results, class boss, persistence, navigation | game internals (only `games/*/index.ts`) |

## 2. The 3D cartridge type (decision a)

### 2.1 Manifest

`Cartridge3DManifest` extends `RuntimeCartridgeManifest`. The APK validator keeps its fields; the
3D fields are additive.

```ts
// src/apk3d/contracts/manifest.ts
export const cartridge3DManifestSchema = runtimeCartridgeManifestSchema.extend({
  renderer: z.literal('three'),                               // Phaser cartridges: absent or 'phaser'
  inputMode: z.enum(['vocabulary', 'sentence', 'story']),     // 'story' = StoryInput (section 5)
  simulation: z.enum(['turn', 'realtime']),                   // fixed step is used by both (section 10)
  orientation: z.enum(['portrait', 'landscape', 'any']),      // 'portrait' for every phone-first game
  levels: z.array(cefrLevelSchema).min(1),                    // CEFR levels the game plays well
  needs: z.object({                                           // story items the game must have
    vocabulary: z.number().int().min(0).default(0),
    sentences: z.number().int().min(0).default(0),
    fills: z.number().int().min(0).default(0),
    questions: z.number().int().min(0).default(0),
  }),
  requiredModelBindings: z.array(semanticAssetKeySchema),     // 'hero.knight', 'enemy.skeleton', 'set.vault'
  packs: z.array(z.string()).min(1),                          // pack ids this game loads (section 7)
  device: deviceRequirementsSchema,                           // section 9; the kit default covers most games
  budget: z.object({ firstLoadBytes: z.number().int(), totalBytes: z.number().int() }),
  briefingKey: z.string(),                                    // catalog scope of the briefing text
});
```

`capabilities` keeps the APK capability ids (`capability:bounded-frame-delta`,
`capability:single-completion-emission`, `capability:result-accounting`, ...). A 3D cartridge
lists the same ids because the kit implements the same behaviors.

### 2.2 Cartridge and instance

A Phaser cartridge has `createGameConfig(context)`. A 3D cartridge has `createGame(context)`.
The two are one discriminated union in the port: `RuntimeCartridge = PhaserCartridge |
ThreeCartridge`, discriminated by `manifest.renderer`.

```ts
// src/apk3d/contracts/cartridge.ts
export interface ThreeCartridge {
  manifest: Cartridge3DManifest;
  createGame(context: Game3DContext): Promise<Game3DInstance>;
}

export interface Game3DContext {
  stage: Stage;                     // renderer, scene, camera rig, loader, actor factory (kit)
  hud: HudRoot;                     // the HTML overlay root inside the safe area (kit)
  audio: AudioBus;                  // sfx, music, speech; muted by the host (kit)
  i18n: ScopedI18n;                 // scoped to the game's catalog key (section 8)
  input: GameInput | StoryInput;    // validated by inputMode
  edition: RuntimeEdition3D;        // model bindings, tuning
  seed: number;
  sessionMode: 'playing' | 'tutorial' | 'demo';
  composition: SupportedResponsiveComposition | { profile: 'compact' | 'wide'; safe: LayoutRect };
  complete(result: GameResults, outcome: GameTerminalOutcome, evidence: StoryGameEvidence): void;
  diagnostic(event: APKDiagnosticInput): void;
}

export interface Game3DInstance {
  start(): void;                                  // after the briefing "Start" tap (audio is unlocked)
  pause(): void; resume(): void;
  resize(width: number, height: number): void;
  recompose(composition: Game3DContext['composition']): void;
  captureResponsiveState(): unknown; restoreResponsiveState(state: unknown): void;
  setMuted(muted: boolean): void;
  destroy(): Promise<void>;
  /** Test hook: the QC driver and the tutorial driver use it; production hosts do not. */
  readonly test: { state(): unknown; dispatch(command: unknown): void; tick(steps: number): void };
}
```

### 2.3 Factory and lifecycle

`createThreeGameFactory()` returns an APK `GameFactory`. It sits beside
`createPhaserGameFactory()`; the host picks one by `manifest.renderer`
(`selectGameFactory(cartridge)`). `mountCartridge` does not change.

| `APKGameInstance` call | What the three factory does |
| --- | --- |
| construction | run the device gate (section 9); throw a structured error `apk3d/unsupported-device` on failure; create the renderer once per container; build `Game3DContext`; `await cartridge.createGame`; preload the game's packs; return |
| `pause()` | stop the fixed-step loop; `audio.suspend()`; keep the last frame |
| `resume()` | reset the accumulator (no catch-up steps); `audio.resume()`; restart the loop |
| `resize(w, h)` | `renderer.setSize`, pixel ratio from the quality tier, camera aspect, HUD safe-area vars; then `instance.resize` |
| `captureResponsiveState()` | `{ sim: instance.test.state(), camera }` from the game |
| `restoreResponsiveState(s)` | the game restores the snapshot and rebuilds the view |
| `recompose(c)` | camera rig preset and HUD layout for `compact` or `wide`; `instance.recompose` |
| `setMuted(m)` | `audio.setMuted(m)`; speech stops when muted |
| `destroy()` | `instance.destroy()`; dispose scene, textures, geometries; `renderer.dispose()`; remove listeners; release the canvas |

The `complete` callback is wrapped in the kit's completion latch: one result per mount, later
calls become a `warning` diagnostic. This is the APK `single-completion-emission` behavior.

## 3. Ownership (decision b)

| Part | Owner now (this repo) | Owner in the APK | Notes |
| --- | --- | --- | --- |
| Level, story, game selector | host `src/host/selector.ts` | app page + `react/student-*-catalog-panel` | one screen on phones (section 3.1) |
| Story reader | host `src/host/reader.ts` | app page (reader from `advantage-games`) | the reader is not a game; it is the same for all games |
| Briefing (start screen) | host, from `manifest.briefingKey` | `presentation/game-briefing-screen.tsx` | the game supplies text keys and control hints only |
| Tutorial | host runs the kit tutorial driver against `instance.test` | `presentation/game-tutorial-*` | sessionMode `tutorial`; no results |
| Results | host `src/host/results.ts` | `react/apk-game-host.tsx` result panel + `resultExtension` | stars and practice list are host UI, from evidence |
| Class boss | host `src/host/classBoss.ts` (simulated) | app (class challenges, `challenges.ts`) | evidence `correctAnswers` feeds it |
| Persistence | host `src/host/persistence.ts` (`localStorage`, unlocked looks) | app backend | games never persist |
| Navigation | host `src/host/router.ts` (hash routes, whoosh) | `APKHostAdapter.navigate` | games only call `complete` |
| Diagnostics | kit `diagnostic()` to console and a ring buffer | `runtime` diagnostics + `diagnostics/` | same event shape |
| Device gate | kit `src/apk3d/device/gate.ts`, run by the host before load and by the factory (section 9) | `guards/` + the three factory | one module, two call sites |
| Stage, loop, HUD root, audio, i18n | kit | kit (`apk3d` package) | moves as one package |
| Rules, events, view, briefing text, catalog | the game | the game | one folder per game |

### 3.1 The front flow

One screen: a level row (A0, A1 active; A2 disabled as "coming soon", section 5.3), a story
list filtered by level, and a game row filtered by the selected story (section 5.4). On a 390 px wide phone the screen shows: the level row, three
story cards, and a horizontal game strip. If the story list is longer than four cards, the
screen becomes three steps with a 250 ms "whoosh" between them. The whoosh is one CSS transform
on the screen container and one sound cue; the router runs it.

Route order: `#/` selector, `#/read/<story>` reader, `#/play/<game>/<story>` briefing then game,
`#/results/<run>` results, `#/boss` class boss. The reader is always visited before `#/play`
(the router redirects when the story is not yet read in this session).

## 4. Folder and module layout (decision c)

```
src/apk3d/                         the 3D kit; moves as one package (@reading-advantage/apk3d)
  contracts/story-input.ts         StoryInput zod schema, derivations (section 5)
  contracts/manifest.ts            Cartridge3DManifest schema
  contracts/cartridge.ts           ThreeCartridge, Game3DContext, Game3DInstance
  contracts/results.ts             toGameResults, outcome rule
  contracts/evidence.ts            storyGameEvidenceSchema
  contracts/model-asset.ts         ModelAssetFile, ModelPack, RuntimeEdition3D
  contracts/i18n.ts                Catalog, ScopedI18n types
  contracts/briefing.ts            a copy of the APK gameBriefingSchema (same fields, same limits)
  sim/rng.ts                       createRng, hashString (moved from src/demo/core/rng.ts)
  sim/simulation.ts                Simulation<S, C, E>, createFixedStepLoop, Recorder
  sim/motion.ts                    easing and lerp helpers for views (pure)
  stage/stage.ts                   renderer, scene, camera rig, quality tier
  stage/loader.ts                  GLB loader with sha256 cache, pack preloading, dispose
  stage/actor.ts                   skinned actor: clips by name, presets, play/hold, screenOf
  stage/camera.ts                  rigs: fixed, follow, rail, orbit, isometric
  stage/instanced.ts               instanced set pieces
  hud/root.ts                      HUD root, safe area, compact/wide layout
  hud/widgets.ts                   button, card, banner, popup, meter, token row
  hud/drag.ts                      pointer drag helper (touch + mouse)
  audio/bus.ts                     sfx, music, unlock, mute
  audio/speech.ts                  speechSynthesis wrapper
  device/gate.ts                   checkDevice(): GateResult (section 9)
  device/tier.ts                   quality tier from the gate result
  i18n/catalog.ts                  createI18n(catalog), scope, interpolation
  factory/three-factory.ts         createThreeGameFactory(), selectGameFactory()
  qc/driver.ts                     window.__apk3d hook, screenshot points
  index.ts
src/games/<game>/                  one folder per game
  manifest.ts                      Cartridge3DManifest
  core/                            pure rules: types.ts, sim.ts, content.ts (derived items)
  view/                            game.ts (createGame), actors.ts, hud.ts, cues.ts
  briefing.ts                      GameBriefing built from catalog keys
  strings.en.ts                    the game's catalog scope
  qc/bot.ts                        headless play for screenshots and smoke tests
  index.ts                         exports { cartridge, strings }
src/games/monster-encounters/
src/games/potion-rush/
src/host/                          the standalone host (GitHub Pages)
  main.ts, router.ts, selector.ts, reader.ts, briefing.ts, results.ts, classBoss.ts,
  persistence.ts, gate-screen.ts, strings.en.ts, styles.css, registry.ts (the game list)
src/host/content/                  story index loading and StoryInput parsing
demo/index.html, demo/public/      page shell, stories, models, packs (unchanged locations)
scripts/apk3d-import.ts            workbook JSON -> StoryInput packs (from demo-import.ts)
scripts/apk3d-models.ts            web models + pack manifests with sha256 (from demo-models.ts)
scripts/apk3d-shot.ts              QC screenshots for any game (from demo-shot.ts)
scripts/apk3d-publish.ts           build + gh-pages (from demo-publish.ts)
tests/apk3d/                       kit tests (contracts, sim, i18n, gate, imports rule)
tests/games/<game>/                core tests, replay tests, bot smoke tests
tests/host/                        selector rules, router, results mapping
```

Import rules, checked by `tests/apk3d/imports.test.ts` (it scans import lines):

| From | May import |
| --- | --- |
| `src/apk3d/contracts` | `zod` only |
| `src/apk3d/sim` | `contracts` |
| `src/apk3d/stage`, `hud`, `audio` | `contracts`, `sim`, `three` |
| `src/games/*/core` | `src/apk3d/contracts`, `src/apk3d/sim` |
| `src/games/*/view`, `briefing.ts` | its own `core`, `src/apk3d/*` |
| `src/host` | `src/apk3d/*`, `src/games/*/index.ts` |
| `src/apk3d/*` | never `src/games`, never `src/host` |

Vite: `vite.demo.config.ts` stays the build; `demo/main.ts` imports `src/host/main.ts`.

## 5. Content contracts (decision d)

### 5.1 StoryInput (proposed for `game-contracts/src/story-input.ts`)

The current `StoryPack` becomes `StoryInput` with two field renames so that vocabulary items are
`VocabularyItem`-compatible: `word -> term`, `th -> translation`.

```ts
export const cefrLevelSchema = z.enum(['Pre-A1', 'A0', 'A0+', 'A1', 'A1+', 'A2', 'B1']);

export const storyInputSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  series: z.string(), lesson: z.number().int(),
  level: cefrLevelSchema,
  genre: z.string(),
  paragraphs: z.array(z.object({ text: z.string().min(1), translation: z.string().optional() })).min(1),
  images: z.array(z.string()),
  vocabulary: z.array(z.object({
    id: z.string(), term: z.string().min(1), translation: z.string().min(1),
    definition: z.string(), phonetic: z.string().optional(),
  })),
  sentences: z.array(z.object({
    id: z.string(), text: z.string().min(1), words: z.array(z.string()).min(2),
    translation: z.string().optional(), paragraph: z.number().int().optional(),
  })),
  fills: z.array(z.object({
    id: z.string(), sentence: z.string().includes('___'), answer: z.string().min(1),
    paragraph: z.number().int().optional(),
  })),
  questions: z.array(z.object({
    id: z.string(), question: z.string().min(1), options: z.array(z.string()).min(2),
    answer: z.number().int().min(0), paragraph: z.number().int().optional(),
  })),
  source: z.object({ file: z.string(), url: z.string().optional(), translationsGenerated: z.boolean().optional() }),
}).strict();
```

Workbook mapping (in `scripts/apk3d-import.ts`, unchanged logic): `vocabulary` from
`vocabulary` (`thai_definition` is `translation`), `sentences` from `sentence_order_answers`,
`fills` from `vocab_fill` + `vocab_fill_answer_string`, `questions` from
`comprehension_questions` + `mc_answers`, `paragraphs` from `article_paragraphs` +
`translation_paragraphs`, `level` from `cefr_level`.

The real `cefr_level` values in `../Workbooks/primary` are `"CEFR A0"` (28 stories),
`"CEFR A0+"` (1), and `"A1"` (2). The import removes the `"CEFR "` prefix and validates the rest
with `cefrLevelSchema`. In the primary book plan, book levels 1 to 3 are A0 and 4 to 6 are A1.

### 5.2 Derived inputs

| Game inputMode | Derivation | Rule |
| --- | --- | --- |
| `vocabulary` | `toVocabularyInput(story)` = `vocabulary.map(({term, translation}) => ({term, translation}))` | same shape as `VocabularyInput` |
| `sentence` | `toSentenceInput(story)` = `sentences.map(s => ({term: s.text, translation: s.translation ?? ''}))` | same shape as `SentenceInput`; the words come from `term.split(' ')` |
| `story` | the whole `StoryInput` | Monster Encounters |

A ported vocabulary or sentence game therefore runs unchanged on flashcard input in the APK and
on a story here. The story id, level, and paragraph hints go into the evidence, not the input.

### 5.3 Where the CEFR level lives

The level is a field of the story (`story.level`) and of the story index entry. The import
script copies it from the workbook field `cefr_level` and never derives it from the folder name
(owner decision 7). The game manifest lists `levels` it supports. The host never computes a
level. Today the primary workbooks give A0 (book levels 1 to 3) and A1 (book levels 4 to 6).

The selector level row is a fixed list `['A0', 'A1', 'A2']` in `src/host/selector.ts`. A level
with at least one story is active. A level with no story is shown disabled with the catalog
text `selector.level.comingSoon`. When A2 workbooks or more books arrive, the import script
adds their packs and the row activates by itself; `cefrLevelSchema` already accepts A2 and
above. The story index (`demo/public/stories/index.json`) carries `level` per entry, so the
selector filters without loading a pack. A story with a `+` level (`A0+`) shows under its base
chip (A0).

### 5.4 Game-to-story compatibility (the selector rule)

```ts
export function isCompatible(manifest: Cartridge3DManifest, story: StoryInput): boolean {
  return manifest.levels.includes(story.level)
    && story.vocabulary.length >= manifest.needs.vocabulary
    && story.sentences.length >= manifest.needs.sentences
    && story.fills.length >= manifest.needs.fills
    && story.questions.length >= manifest.needs.questions;
}
```

The selector hides incompatible games. A game must still handle a story that meets the minimums
and is short (Monster Encounters repeats items; Potion Rush ends when the sentences are used).

## 6. Results and evidence (decision e)

### 6.1 `GameResults` (five fields)

| Field | Rule (kit `toGameResults(evidence)`) |
| --- | --- |
| `correctAnswers` | count of correct responses in the run |
| `totalAttempts` | count of all responses |
| `accuracy` | `correctAnswers / totalAttempts`, 0 when no attempts |
| `xp` | kit policy: 10 per first-try correct item, 5 per later correct item, 20 per stage cleared, 50 on victory; cosmetic (matches Monster Encounters today) |
| `score` | the game's own display points, integer; a game with no points uses `xp` |

### 6.2 Outcome

`victory` when the game's win condition is met (all encounters cleared, all customers served).
`complete` when the run ended by exhaustion of items or by the student's exit. `defeat` is never
sent: the guardrail forbids a game over.

### 6.3 Evidence (proposed `game-contracts` member of `learningEvidenceSchema`)

```ts
export const storyGameEvidenceSchema = z.object({
  schemaVersion: z.literal(1),
  kind: z.literal('story-game'),
  gameId: z.string(), storyId: z.string(), level: cefrLevelSchema, seed: z.number().int(),
  durationMs: z.number().int().min(0),
  items: z.array(z.object({
    itemId: z.string(),
    itemKind: z.enum(['word', 'sentence', 'fill', 'question']),
    label: z.string(),
    attempts: z.number().int().min(1),
    correctFirstTry: z.boolean(),
    solved: z.boolean(),
    paragraph: z.number().int().optional(),
  })).max(200),
  practice: z.array(z.string()).max(200),
}).strict();
```

The host builds stars (3 at 90%, 2 at 70%, else 1 of first-try accuracy) and the practice list
from `items`. The class boss damage is `correctAnswers * 2`. In the APK the same object goes in
`APKHostAdapter.complete(result, outcome, evidence)` and in `metadata.learningEvidence`.

## 7. Assets (decision f)

### 7.1 Model asset kind

```ts
export const modelAssetFileSchema = z.object({
  id: z.string(), path: z.string(), kind: z.literal('model'), format: z.literal('glb'),
  byteSize: z.number().int(), sha256: z.string().regex(/^[0-9a-f]{64}$/),
  triangles: z.number().int(), textureSize: z.number().int(), skinned: z.boolean(),
  clips: z.array(z.string()), presets: z.array(z.string()),
  provenance: z.object({
    source: z.string(),          // 'fantasy-asset-forge/assets/knight.ts'
    license: z.string(),         // the project license label
    forgeCommit: z.string(),     // git sha of the source at build time
    tool: z.literal('scripts/apk3d-models.ts'),
  }),
});
export const modelPackSchema = z.object({
  id: z.string(), version: z.string(), root: z.string(),
  files: z.record(modelAssetFileSchema), byteSize: z.number().int(),
});
```

`scripts/apk3d-models.ts` writes `demo/public/packs/<pack>/pack.json` with these fields. It is
the `AssetPackManifest` shape with a new `kind`; the port adds `'model'` to
`PhysicalAssetKind` and a `format: 'glb'` branch.

### 7.2 Packs and bindings

| Pack | Files | Used by |
| --- | --- | --- |
| `heroes` | knight, wizard, cleric (+ preset textures) | every game |
| `sunken-vault` | vault set pieces (instanced) | Monster Encounters |
| `dungeon-monsters` | skeleton, giant-bat, mimic, dragon-fire | Monster Encounters |
| `potion-shop` | shop set, cauldron, customers (goblin, elf, dwarf ...) | Potion Rush |

A game manifest lists `packs` and `requiredModelBindings`. `RuntimeEdition3D.bindings` maps a
binding key to `{ pack, file }`. The kit loader caches a parsed GLB by `sha256` for the page
session, so a second game in the same visit loads `heroes` once. The Cache API stores files by
sha256 for repeat visits (a miss is silent; the fetch runs as usual).

Edition swap: two editions share the same bindings, `standard` and `lite`. `lite` points to
the same pack built with the smaller budgets (8k triangles, 384 px textures) and is selected by
the device tier (section 9). Editions never change rules or input.

### 7.3 Budget

| Limit | Value | Today (Monster Encounters) |
| --- | --- | --- |
| first load per game (before the first interaction) | 4.0 MB | about 4 MB (vault + heroes) |
| total per game, shared packs counted once per session | 6.0 MB | 7.9 MB for the whole site |
| script, gzipped | 250 KB | 210 KB |
| one skinned character | 600 KB, 16k triangles, 512 px | 480 to 564 KB |
| one set piece | 200 KB | 144 to 168 KB |

The manifest `budget` holds the two byte limits; `scripts/apk3d-models.ts` fails when a pack is
over its share, and `tests/apk3d/budget.test.ts` reads the pack manifests and fails the build
when a game's packs exceed the limits. To get Monster Encounters under 6 MB: the monsters move
to 384 px textures (about 1.2 MB saved). KTX2 is not needed now.

## 8. Localization (decision g)

The catalog is a nested object with the `advantage-games` shape, so a game's strings paste into
`src/locales/en.ts` at port time under `pages.student.games.<game>`.

```ts
// src/games/potion-rush/strings.en.ts
export default {
  potionRush: {
    title: 'Potion Rush', subtitle: 'Alchemical management',
    briefing: { objective: 'Serve every customer the sentence they ask for.',
      instructions: {
        read: { title: 'Read the order', description: 'Each customer asks for one sentence.' },
        brew: { title: 'Brew', description: 'Drag the words into the cauldron in order.' },
        serve: { title: 'Serve', description: 'Tap the customer to give them the potion.' },
      },
      controls: { touch: { label: 'Drag', action: 'Move a word into a cauldron' } },
      learningPreview: 'Sentences from your story',
      tip: 'A wrong word goes into the trash portal.', start: 'Start brewing' },
    hud: { served: 'Served {count}', orderFrom: '{name} wants:' },
  },
} as const;
```

`briefing.ts` returns a `GameBriefing` that passes the copied `gameBriefingSchema`: each
instruction is `{title, description}` and each control is `{mode, label, action}`, all from
catalog keys, so the APK `game-briefing-screen.tsx` shows it with no change.

Rules: keys are camelCase paths; interpolation is `{name}` only (the `advantage-games` form);
plural forms are separate keys (`served.one`, `served.other`); a game reads strings only
through `context.i18n` (`const t = i18n.scope('potionRush'); t('hud.served', { count })`); the
host merges all game catalogs with its own and validates that every `t('...')` literal in
`src/games` and `src/host` exists (`tests/apk3d/i18n.test.ts` scans the source); view files
must not assign literal text to `textContent` or `innerHTML` (the same test checks it).
Story text (paragraphs, glosses, translations, feedback built from items) is content and comes
from `StoryInput`. A missing key renders the key itself and emits a `warning` diagnostic.

## 9. Device gate (decision h)

`checkDevice(canvas?): GateResult` runs on the selector page (before any model download) and
again in the factory. `GateResult = { status: 'ok' | 'lite' | 'unsupported'; reason?: GateReason;
tier: 'high' | 'mid' | 'low'; details }`.

| Check | Pass | Else |
| --- | --- | --- |
| `getContext('webgl2', { failIfMajorPerformanceCaveat: true })` | WebGL2 | `unsupported: webgl`. three.js r163 and later (this repo: r185) has no WebGL1 renderer, so there is no WebGL1 path |
| software renderer | `WEBGL_debug_renderer_info` renderer does not contain `SwiftShader` or `llvmpipe` | `unsupported: software-gl` (skipped when the extension is absent) |
| QC runs | the QC driver opens the page with `?qc=1`; the gate then skips `failIfMajorPerformanceCaveat` and the software-renderer check, because headless Chromium renders with SwiftShader | production pages ignore `qc` for every other check |
| `MAX_TEXTURE_SIZE` | >= 2048 | `unsupported: texture-size` |
| `MAX_VERTEX_TEXTURE_IMAGE_UNITS` | >= 4 (bone textures) | `unsupported: skinning` |
| iOS version | >= 15 (Safari 15 ships WebGL2) | `unsupported: ios-version` |
| Android WebView Chrome version | >= 80 | `unsupported: webview-version` |
| `navigator.deviceMemory` | absent or >= 3 gives `high`; 2 gives `mid`; below 2 gives `lite` | never unsupported |
| `hardwareConcurrency` | <= 4 caps the tier at `mid` | |
| `devicePixelRatio` | tier sets the pixel ratio cap: high 2.0, mid 1.5, low 1.0 | |

`lite` selects the `lite` edition and the `low` tier (no antialias, pixel ratio 1, no shadows).
`unsupported` shows the host gate screen: title key `gate.unsupported.title` ("This device is
not supported for this game"), reason key `gate.reason.<reason>`, and a Back button. No 2D
fallback. The reader still works on an unsupported device; only `#/play` is gated.

LINE in-app browser rules (kit and host):

| Issue | Rule |
| --- | --- |
| viewport height | `height: 100dvh` with `100%` fallback; never `100vh`; the HUD root listens to `visualViewport` resize and scroll |
| safe areas | `viewport-fit=cover`; `env(safe-area-inset-*)` as CSS variables on the HUD root; the canvas is full-bleed under them |
| audio unlock | the kit listens to every `touchend`, `click`, and `keydown` (capture phase) and calls `audio.unlock()`: it creates the AudioContext on the first gesture, resumes it after a phone lock or a call, and sets `navigator.audioSession.type = 'playback'` (iPhone silent switch). This is the fix now live in `src/demo/app/audio.ts`; keep it. The selector may play tap sounds |
| no fullscreen API | never call `requestFullscreen`; the layout hides nothing that depends on it |
| gestures | `touch-action: none` on the canvas and drag surfaces; passive listeners elsewhere; no `window.open`, no `alert` |
| memory | dispose textures and geometries on scene swap; one renderer per page; `preserveDrawingBuffer: false` |
| devices with WebGL1 only (some old Android WebViews) | they get the gate screen (`unsupported: webgl`); the stage uses no float render targets, so mid-range WebGL2 phones keep working |
| detection | `/Line\//.test(navigator.userAgent)` sets `details.line = true` for diagnostics only; rules above apply everywhere |

## 10. Simulation and testing (decision i)

One pattern for turn-based and real-time games:

```ts
// src/apk3d/sim/simulation.ts
export interface Simulation<S, C, E> {
  readonly state: S;                        // read after any call
  dispatch(command: C): E[];                // a student action (answer, drag, serve)
  tick(): E[];                              // one fixed step of STEP_MS; turn games return []
  snapshot(): S;                            // structured-clone-safe
}
export const STEP_MS = 1000 / 30;           // fixed step; the view interpolates
export const MAX_FRAME_MS = 50;             // APK bounded frame delta ceiling
export function createFixedStepLoop(sim, view, now = performance.now) { ... }
export function createRecorder(seed, sim) { ... }   // { commands: [{step, command}], replay() }
```

Rules: `create(input, { seed, tuning })` is pure; all randomness comes from `createRng(seed)`;
time enters only through `tick()`; the view calls `dispatch` and `tick` and renders events in
order; a real-time view runs the loop with the accumulator clamped to `MAX_FRAME_MS` (at most
two steps per frame; the rest is dropped, never caught up). Events carry ids, not object
references. Potion Rush core: `tick` moves belt items and patience; `dispatch({type: 'drop',
wordId, cauldronId})` and `{type: 'serve', cauldronId}` produce `wordAccepted`,
`wordRejected`, `potionServed`, `customerLeft` events.

Tests:

| Level | Tool | What |
| --- | --- | --- |
| core | vitest, no DOM | rules per game; replay test: record a bot run, replay from the seed, compare snapshots; property test: no item disappears, results add up |
| kit | vitest | schemas, derivations, compatibility, results mapping, i18n key scan, import rule, gate on fake contexts |
| view smoke | vitest + jsdom + a fake stage | `createGame` on a fake stage renders every event kind without a throw |
| QC shots | `scripts/apk3d-shot.ts` + Playwright | drives the built site through `window.__apk3d` (the instance `test` hook plus route helpers); `games/<game>/qc/bot.ts` plays the game headless; screenshots at named points in portrait 390x844 (dpr 2, touch) and landscape 1280x720; run: `node --import tsx scripts/apk3d-shot.ts --game potion-rush --story 0 --layout both --dist` |
| budget | vitest | pack manifests against manifest budgets |

## 11. Migration of Monster Encounters (decision j)

1. Move `src/demo/core/rng.ts` to `src/apk3d/sim/rng.ts`; keep a re-export for one commit.
2. Create `src/apk3d/contracts/story-input.ts` from `src/demo/core/content.ts`; rename
   `word -> term`, `th -> translation`, add `schemaVersion`. Update `scripts/demo-import.ts` and
   rename it `apk3d-import.ts`. Rewrite the three story packs.
3. Move `types.ts`, `quest.ts`, `content.ts` (the quest parts) to
   `src/games/monster-encounters/core/`; wrap `Quest` in `Simulation` (`dispatch({type:
   'answer', response})`, `tick()` returns `[]`). Move `tests/demo/quest.test.ts`.
4. Move `classBoss.ts` to `src/host/classBoss.ts` (host-owned).
5. Split `src/demo/app/stage.ts`: renderer, loader, actor, camera go to `src/apk3d/stage/`; the
   vault set and battle blocking go to `src/games/monster-encounters/view/actors.ts`.
6. Split `hud.ts`: banner, popup, card, meter go to `src/apk3d/hud/widgets.ts`; the challenge
   card and enemy bars stay in `games/monster-encounters/view/hud.ts`.
7. Move `audio.ts` and `speech.ts` to `src/apk3d/audio/`.
8. Write `games/monster-encounters/manifest.ts` (`inputMode: 'story'`, `simulation: 'turn'`,
   `needs: { vocabulary: 4, questions: 1 }`, `levels: ['A0', 'A0+', 'A1']`) and `briefing.ts`.
9. Move UI strings from `main.ts` and `hud.ts` into `strings.en.ts` (game) and
   `src/host/strings.en.ts` (host).
10. Split `main.ts` into `src/host/{router,selector,reader,briefing,results,persistence}.ts`;
    the selector gets the level row and the game row.
11. Add the device gate and gate screen.
12. Generalize `demo-shot.ts` into `apk3d-shot.ts` with the `__apk3d` hook and a
    `games/monster-encounters/qc/bot.ts`.
13. Move models into `demo/public/packs/` with `pack.json`; rebuild with `apk3d-models.ts`.
14. Update `docs/demo-monster-encounters.md` paths; publish; compare screenshots with the
    current site.

## 12. Work breakdown (decision k)

Each task is small, in order. BACKEND = core rules, contracts, content, tests (me). FRONTEND =
stage, HUD, screens, audio, game feel (Claude).

| # | Task | Owner |
| --- | --- | --- |
| 1 | `src/apk3d/contracts/*`: story input, manifest, cartridge, results, evidence, model asset, i18n types; tests | BACKEND |
| 2 | `src/apk3d/sim/*`: rng move, `Simulation`, fixed-step loop, recorder; tests | BACKEND |
| 3 | `scripts/apk3d-import.ts`; rewrite the three story packs; story index with levels | BACKEND |
| 4 | `src/apk3d/i18n/catalog.ts` + key scan test + import rule test | BACKEND |
| 5 | `src/apk3d/device/gate.ts`, `tier.ts`; tests with fake contexts | BACKEND |
| 6 | `src/apk3d/stage/*` from `stage.ts` (renderer, loader with sha256 cache, actor, camera) | FRONTEND |
| 7 | `src/apk3d/hud/*` widgets, root, safe area, drag helper | FRONTEND |
| 8 | `src/apk3d/audio/*` move; unlock on Start | FRONTEND |
| 9 | `src/apk3d/factory/three-factory.ts` with the lifecycle table of section 2.3 | FRONTEND |
| 10 | `src/host/*`: router with whoosh, selector (level, story, game), gate screen, briefing screen from the APK briefing shape, results, class boss, persistence | FRONTEND |
| 11 | Monster Encounters core into `games/monster-encounters/core` as a `Simulation`; replay test | BACKEND |
| 12 | Monster Encounters view, manifest, briefing, strings | FRONTEND |
| 13 | `scripts/apk3d-models.ts` with pack manifests, sha256, budgets; budget test | BACKEND |
| 14 | `scripts/apk3d-shot.ts` + `__apk3d` hook + Monster Encounters bot; publish; screenshot compare | FRONTEND |
| 15 | Potion Rush core: customers, belt, cauldrons, patience as a gentle meter (section 13), events; tests and replay | BACKEND |
| 16 | Potion Rush content: `toSentenceInput`, customer names from a seeded list, order text | BACKEND |
| 17 | Potion Shop pack: shop set, cauldron, customer characters from existing NPC and monster assets; `apk3d-models` entries | FRONTEND |
| 18 | Potion Rush view: belt in 3D, drag words to cauldrons, serve, customers walk in and out; HUD; cues | FRONTEND |
| 19 | Potion Rush briefing, strings, manifest, bot, screenshots | FRONTEND |
| 20 | `docs/apk-port.md` from the outline in section 14 | BACKEND |
| 21 | Dragon Flight 3D (rail runner) core and view, same steps as 15 to 19 | both |

## 13. Questions for the owner (decision l)

| Question | Recommendation |
| --- | --- |
| Potion Rush patience timers versus the "no speed" guardrail (mastery strategy rule 7: speed must not be the dominant success condition). | Keep patience as a gentle meter: a customer who waits too long sits down and asks again later; nothing is lost, no reputation drop, no game over. Speed never changes the results or the evidence. Difficulty setting removed. |
| Thai glosses: some story packs have model-written glosses (`translationsGenerated`). Show them without review? | Show them; mark the story index entry `reviewed: false`; a Thai speaker reviews before the APK port. |
| The class boss in the standalone host is simulated. Keep it in the public demo? | Keep it, labeled "example class" in the catalog text. |
| Model license label in provenance. | The repo's project license label; the owner confirms the exact SPDX string. |
| Hero looks unlocked by stars are stored in `localStorage` only. Acceptable for the public site? | Yes; the APK owns persistence at port time. |
| Score display: `GameResults.score` shows nothing new for Monster Encounters. Show stars only? | Show stars and the practice list; never show a numeric score to students. |

## 14. Outline of `docs/apk-port.md`

1. Scope: move `src/apk3d` to `packages/advantage-play-kit-3d` (or `apk/src/three`), games to
   `packages/apk-games-3d/<game>`.
2. `game-contracts`: add `story-input.ts`, `storyGameEvidenceSchema` to `learningEvidenceSchema`,
   `StoryInput` to `GameInput`, `'story'` to `inputMode`.
3. `advantage-play-kit`: `RuntimeCartridge` union by `manifest.renderer`; `three-factory.ts`
   beside `phaser-factory.ts`; `selectGameFactory`; `'model'` asset kind; gate in `guards/`.
4. Host: `APKGameHost` gets `factory` from `selectGameFactory`; the briefing and tutorial
   screens consume the game's `briefing.ts`; results from evidence.
5. Content: story packs served by the app; the import script runs in the workbook pipeline.
6. Localization: paste each `strings.en.ts` under `pages.student.games.<game>`; add `th`.
7. QC: the `__apk3d` driver behind `qc/` `BrowserQcDriver`; screenshots in CI.
8. Removal list: `src/host` (replaced by app pages), simulated class boss, `localStorage`.
