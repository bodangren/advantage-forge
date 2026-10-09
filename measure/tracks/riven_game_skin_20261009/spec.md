# Riven Lands game skin delivery

## Purpose

Run the 28 student games in the Riven Lands skin for Reading Advantage. The games keep one rules core, one
three.js view, and one Phaser view. The pack changes only the models, the sprites, and the avatar pack.

## Owner decisions (2026-10-09)

- Scope order: the game set first, then the rest of the catalog by family.
- Base figure: about 1.6 m tall and 5 heads tall. Not chibi.
- Skeleton: the same bone, clip, and socket names as Chibi Quest. Only joint positions and proportions change.
- Track split: foundation tracks plus one production track per catalog family.
- Build work starts after the Primary Advantage cutover is complete. Track creation and planning may start now.

## The game set (batch 1 of every family)

The 28 game manifests (`src/games/*/manifest.ts`, `MODELS_3D`) load 86 Forge models: 68 catalog rows and 18
kit pieces without a catalog row. The 2D pack `primary-chibi-2d` holds 24 actors (15 characters with presets,
`background`, `prop`, and the rest). The avatar pack holds the base and 142 ready pieces.
The family tracks build these rows in their batch 1; this track packages and delivers them.

| Family | Game rows | Track |
| --- | ---: | --- |
| heroes | 7 | `riven_heroes_20261009` |
| enemies | 5 | `riven_enemies_20261009` |
| monsters | 5 | `riven_monsters_20261009` |
| npcs | 4 | `riven_npcs_20261009` |
| equipment | 1 (plus the avatar pieces in batch 2) | `riven_equipment_20261009` |
| props | 27 | `riven_props_20261009` |
| architecture | 25 | `riven_architecture_20261009` |
| nature | 15 | `riven_nature_20261009` |
| scenes | the sunken vault stage | `riven_scenes_20261009` |

## Functional requirements

- FR-1: The model pack generator builds the eight runtime packs (heroes, folk, dungeon-monsters, potion-shop, outdoor-props, flight-land, mounts, sunken-vault) from the Riven Lands sources into `demo/public/models/riven-lands/` or `demo/public/packs/<pack>/<version>/` with a pack id. The Chibi Quest files keep their paths. The model-pack format stays without a hash field (monorepo rule).
- FR-2: The 2D pack `secondary-riven-2d` holds every actor and clip that `primary-chibi-2d` holds, one to one (owner rule of 2026-10-06), with the Riven Lands presets.
- FR-3: The avatar pack of the Riven Lands base (`demo/public/avatar-pack/riven-lands/<version>/`) carries the base, the tint mask, the presets, and the ready pieces; `pack-version.ts` versions it per pack.
- FR-4: The host and every game pick the pack from the launch context (`pack: 'chibi-quest' | 'riven-lands'`, default `chibi-quest`). Every `loader.get(model(...))` call resolves through the pack. No game code names a pack.
- FR-5: The per-game budgets hold for the Riven Lands packs: 4.0 MB before the first interaction and the total per game (`docs/apk3d-cartridge.md` section 7.3; TD-21 for the first-load model).
- FR-6: The browser QC (`qc/run.mjs`, `--phone`, `--phone-landscape`) passes all 28 games in the Riven Lands skin in 3D and 2D.
- FR-7: `scripts/apk-release.ts` and `scripts/monorepo-sync.ts` take the pack and release the Riven Lands packs to the monorepo for Reading Advantage (`apps/reading-advantage`). The monorepo session makes every monorepo change (owner rule of 2026-10-06). `docs/apk-port.md` records each difference.
- FR-8: The first game ships alone as the proof before the other 27. Proposal: Labyrinth (11 models, the game of the avatar check in the app). The owner confirms the first game.

## Non-functional requirements

- The 2012 quad-core test machine and a 2020 laptop run the avatar bench at 30 fps or more with the Riven Lands base (TD-18 names the laptop).
- The Chibi Quest skin stays the default and stays unchanged in every check.

## Acceptance criteria

- One game, then all 28, run in the Riven Lands skin on the Forge demo page with no fallback diagnostic, no missing model, and no legacy model request.
- The 2D pack test proves one-to-one coverage against `primary-chibi-2d`.
- The budget test passes for every game with the Riven Lands packs.
- The release lands in the monorepo through the monorepo session, after the Primary deployment and outside any feature freeze.

## Out of scope

- The Reading Advantage app route, the launch context on the server, and the Reading Advantage progression (XP, GP, Guild Mode). The monorepo and a later progression track own them.
- Building the assets. The family tracks own them.
