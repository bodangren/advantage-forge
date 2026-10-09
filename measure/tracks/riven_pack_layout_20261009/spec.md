# Riven Lands pack layout (stage 1)

## Purpose

Give the Riven Lands pack a home in this repository without a move of any existing path. This track
executes stage 1 of `docs/pack-layout.md` (approved by the owner on 2026-10-02) and takes over Phase 5,
task 1 of `repo_rename_advantage_forge_20261002`.

## Owner decisions (2026-10-09)

- Scope order: the game set first, then the rest of the catalog by family.
- Base figure: about 1.6 m tall and 5 heads tall. Not chibi.
- Skeleton: the same bone, clip, and socket names as Chibi Quest. Only joint positions and proportions change.
- Track split: foundation tracks plus one production track per catalog family.
- Build work starts after the Primary Advantage cutover is complete. Track creation and planning may start now.

## Functional requirements

- FR-1: `packs/riven-lands/` exists with `pack.json` (id `riven-lands`, audience `secondary`, base character, fit contract path, sprite pack id `secondary-riven-2d`), `assets/`, `parts/`, `scenes/`, `reference-designs/`, `mockups/`, `fit.md`, and `reviews.json`.
- FR-2: The CLI takes `--pack <id>`. The default pack is `chibi-quest`, which resolves to today's `assets/`, `assets/parts/`, and `scenes/`. Every existing command keeps its behavior with no option.
- FR-3: Build output for a non-default pack goes to `out/<pack>/<asset>/`. The default pack keeps `out/<asset>/`.
- FR-4: `defineAsset` sources of one pack may import shared parts of another pack by an explicit path. A pack source has the same file name as its Chibi Quest counterpart and the same catalog ID.
- FR-5: Scope tables gain a pack key: `measure/scope-map.tsv` (a `pack` column, default `chibi-quest`), the avatar catalog (one file per pack: `packs/riven-lands/avatar-catalog.tsv`), and the review ratings (one file per pack: `packs/riven-lands/reviews.json`). Existing files keep their paths and columns.
- FR-6: The review tools (`scripts/review-cards.py`, `scripts/record-reviews.py`), `scripts/part-check.mjs`, `scripts/mesh-same.mjs`, and `forge check` accept the pack.
- FR-7: `measure/generate.sh` counts the Riven Lands sources per family in the asset inventory under a pack key.
- FR-8: The existing reference material moves nowhere. `docs/hamlet-mockups/riven-lands-v2.png` and `reference-designs/riven-goblin-warrior-20260925/` stay; `packs/riven-lands/reference-designs/README.md` links to them.

## Non-functional requirements

- No path that a caller, a tool, or a user depends on changes (AGENTS.md rule). Stage 2 (the move of Chibi Quest) stays out of scope.
- `pnpm test` and `pnpm typecheck` pass after the CLI change. A test covers the pack resolution and the output path.

## Acceptance criteria

- `./forge render goblin-warrior --pack riven-lands --fast` builds a source in `packs/riven-lands/assets/` and writes `out/riven-lands/goblin-warrior/render.png`.
- `./forge render rogue --fast` is unchanged: same input path, same output path, same render.
- The scope map has a `pack` column and every existing row reads `chibi-quest`.
- The doctor passes.

## Out of scope

- Stage 2 of the pack layout (the move of `assets/` to `packs/chibi-quest/`). It needs a separate owner decision and a quiet repository.
- The model folder per pack in `demo/public/models/` and the pack choice in the launch context. The game skin track (`riven_game_skin_20261009`) owns them.
- Any Riven Lands asset beyond one smoke source for the CLI test.
