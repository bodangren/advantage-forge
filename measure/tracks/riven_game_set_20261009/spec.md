# Riven Lands game set

## Purpose

Build the Riven Lands treatment of every asset that the 28 games and the avatar pack load, before any other
Riven Lands production: 89 game rows, the 142 ready avatar pieces, and the sunken vault stage
(231 assets and one scene). The game skin track (`riven_game_skin_20261009`) packages and delivers them.
The family tracks build the rest of the catalog afterwards and reuse the kinds and parts that this track ports.

## Owner decisions (2026-10-09)

- Scope order: the game set first, then the rest of the catalog by family.
- Game set: one track, `riven_game_set_20261009`, builds every asset that the 28 games and the avatar pack load (89 game rows, 142 avatar pieces, and the sunken vault). It comes after the base character and before the game skin and every family track. The family tracks build only the rows outside the game set.
- Base figure: about 1.6 m tall and 5 heads tall. Not chibi.
- Skeleton: the same bone, clip, and socket names as Chibi Quest. Only joint positions and proportions change.
- Track split: foundation tracks, the game set, and one production track per catalog family.
- Build work starts after the Primary Advantage cutover is complete. Track creation and planning may start now.

## Art direction

Riven Lands is the asset pack for secondary students (grades 7 to 12) in Reading Advantage. It keeps the
gameplay meaning, the map positions, the pivots, and the interaction points of Chibi Quest. Only the
proportions and the surface treatment change (`docs/pack-layout.md`, `docs/hamlet-mockups/README.md`).

- Architecture: tall, narrow gables, heavy stone footings, exposed timber braces, dark slate roofs, rugged ground, gnarled trees, and muted earth colors.
- Characters: no chibi proportions, no gore, and no realistic horror detail. Soft, color-matched edges and smooth shading. The face, the ears, and the key gear read at 128 pixels.
- Palette example (goblin warrior): olive skin, dark earth cloth, brown leather, and bronze metal.
- Content: rated G (owner, 2026-10-04).
- References: `docs/hamlet-mockups/riven-lands-v2.png` and `reference-designs/riven-goblin-warrior-20260925/`.

## Scope

| Family | Game rows | Rows |
| --- | ---: | --- |
| heroes | 7 | adventurer (2D pack only), cleric, druid, knight, paladin (2D pack only), ranger (2D pack only), wizard |
| enemies | 5 | bandit, goblin-warrior, orc-warrior, skeleton, zombie |
| npcs | 4 | farmer, guard, innkeeper, villager |
| monsters | 5 | dragon-fire, giant-bat, griffin, mimic, slime |
| props | 27 | apple, barrel, bottle, brazier, bread, cauldron, chains, chandelier, counter, crate, fireplace, hay-bale, pumpkin, round-table, sack, sarcophagus, shelf, stool, treasure-chest, workbench, bone-pile (kit piece), campfire-out (kit piece), candle-cluster (kit piece), gold-pile (kit piece), hanging-cage (kit piece), rubble (kit piece), torch-sconce (kit piece) |
| architecture | 25 | altar, arch, barn, cottage, dirt-ground, door, farm-field, fence, forest-ground, gate, grass-ground, pillar, plaster-wall, river-straight, stairs, wall-corner, well, wood-floor, cell-bars (kit piece), floor (kit piece), floor-cracked (kit piece), plaster-wall-door (kit piece), plaster-wall-window (kit piece), wall (kit piece), walkway (kit piece) |
| nature | 15 | boulder, bush, crystal-cluster, dead-tree, fern, mushroom, oak-tree, pine-tree, rock-cluster, tall-grass, wildflowers, ancient-oak (kit piece), moss-tuft (kit piece), mushroom-cluster (kit piece), tree-stump (kit piece) |
| equipment | 1 | lantern |
| **Total** | **89** | 21 characters and 68 world assets (86 models that the game manifests load, and 3 heroes for the 2D pack only) |

- **Avatar pieces:** the 142 `ready` rows of `docs/avatar-catalog.tsv` (head 25, mainhand 72, offhand 26, chest 5, hair 4, hands 3, back 3, feet 2, waist 1, shoulders 1). 72 are equipment catalog rows; the others are character pieces with no catalog row.
- **Scene:** the sunken vault (`scenes/sunken-vault.ts`), the stage of the battle games. 16 game manifests load its pack.
- **Style proofs:** the knight and the goblin warrior come from `riven_base_character_20261009`. This track accepts them as built and does not rebuild them.
- Lists come from `src/games/*/manifest.ts` (`MODELS_3D`), `demo/public/assets/apk/primary-chibi-2d/v1/pack.json`, and `docs/avatar-catalog.tsv` on 2026-10-09. Recount them in Phase 1.

## Functional requirements

- FR-1: Each source lives in `packs/riven-lands/assets/<name>.ts` with the same file name and catalog ID as its Chibi Quest source. Shared parts live in `packs/riven-lands/parts/`.
- FR-2: This track ports each kind factory that its characters use (the Riven humanoid kind from `riven_base_character_20261009`, and the kinds of the five game monsters) once, with a proportion warp and a new surface treatment (`packs/riven-lands/PORTING.md`). The family tracks reuse them.
- FR-3: Each row has an mmx mockup in the Riven Lands language in `packs/riven-lands/mockups/game-set/` before the build.
- FR-4: Each accepted asset has a textured GLB, a turnaround (`render.png`), and sprites at 128 px in 8 directions that read in `sprites/preview.png`.
- FR-5: Characters use the shared bone, clip, and socket names, and pass `./forge check <name> --pack riven-lands` for every clip. Their color slots and presets match the Chibi Quest source one to one (the 2D pack needs every preset, for example `knight@champion`).
- FR-6: Each avatar piece declares an `equip` block, fits the Riven Lands base (`packs/riven-lands/fit.md`), and passes `./forge check <piece> --pack riven-lands` (show-through, gap, floor, clip clearance). `packs/riven-lands/avatar-catalog.tsv` records each piece (id, slot, tier, status, triangles, rating, price).
- FR-7: World assets keep the footprint, the pivot, and the interaction points of the Chibi Quest source. Ground tiles stay 0.3 m slabs with the top at y = 0.
- FR-8: The sunken vault keeps `vault-places.ts` unchanged (the battle stage reads it; TD-03).

## Acceptance criteria

- An independent reviewer agent rates each batch from review cards (`scripts/review-cards.py`, `scripts/record-reviews.py`). The builder never rates its own work (owner, 2026-10-05). A row that stays below the bar after three reviews goes on the follow-up list. Bars: characters 7.5, world assets and avatar pieces 7.0, the sunken vault 7.5.
- Ratings and notes go in `packs/riven-lands/reviews.json`.
- Builds have no `warning:` lines; each source passes the per-asset type check; textured builds run one at a time (the machine holds 7.1 GiB).
- Each builder agent builds one asset in one narrow step, with a triangle budget.
- The plan records evidence (render, review card, rating) and remaining limits for each batch.

## Out of scope

- Delivery to the games, the 2D pack, and the avatar pack (`riven_game_skin_20261009`).
- The other catalog rows (the family tracks) and the other scenes (`riven_scenes_20261009`).
- Chibi Quest sources stay unchanged.
