# Riven Lands NPCs

## Purpose

Build the Riven Lands treatment of every catalog row in the NPCs family (114 rows: 7 P0, 107 P2).
Batch 1 is the rows the 28 games load. Later batches follow the catalog priority.
The Chibi Quest counterpart is `asset_p2_npcs_20260928`.

## Owner decisions (2026-10-09)

- Scope order: the game set first, then the rest of the catalog by family.
- Base figure: about 1.6 m tall and 5 heads tall. Not chibi.
- Skeleton: the same bone, clip, and socket names as Chibi Quest. Only joint positions and proportions change.
- Track split: foundation tracks plus one production track per catalog family.
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

## Family notes

The Chibi Quest P2 NPCs are not built yet (7 of 114 rows). Build the Riven Lands NPCs from the Riven base directly. Do not wait for the Chibi Quest P2 NPC batches.

## Batches

| Batch | Rows | Source of the list |
| --- | --- | --- |
| 1: the game set | 4: farmer, guard, innkeeper, villager | `src/games/*/manifest.ts` (`MODELS_3D`) and `demo/public/assets/apk/primary-chibi-2d/v1/pack.json` |
| 2: the rest of the catalog | 114 rows in total (7 P0, 107 P2); batch 1 rows are not repeated | `docs/fantasy-world-asset-catalog.tsv`, family `npcs`, in P0, P1, P2, P3 order |

## Functional requirements

- FR-1: Each source lives in `packs/riven-lands/assets/<name>.ts` with the same file name and the same catalog ID as the Chibi Quest source. Shared parts live in `packs/riven-lands/parts/`.
- FR-2: Each row has an mmx mockup in the Riven Lands language in `packs/riven-lands/mockups/npcs/` before the build (the Chibi Quest mockups are in `docs/npc-mockups/`).
- FR-3: Each accepted asset has a textured GLB, a turnaround (`render.png`), and sprites at 128 px in 8 directions that read in `sprites/preview.png`.
- FR-4: Every character uses the shared bone, clip, and socket names. `./forge check <name> --pack riven-lands` ends with `result ok` for every clip.
- FR-5: Characters on a shared kind port through the recipe in `packs/riven-lands/PORTING.md` (the Riven kind or a proportion warp, then a re-dress). `scripts/part-check.mjs --pack riven-lands` proves a shape-code move.
- FR-6: Color slots and presets match the Chibi Quest source one to one (same slot names, same preset names) with muted Riven Lands colors.

## Acceptance criteria

- An independent reviewer agent rates each batch from review cards (`scripts/review-cards.py`, `scripts/record-reviews.py`). The builder never rates its own work (owner, 2026-10-05). A row that stays below the bar after three reviews goes on the follow-up list. The bar for this family is 7.5.
- Ratings and notes go in `packs/riven-lands/reviews.json`, not in `docs/character-reviews.json`.
- Builds have no `warning:` lines; each source passes the per-asset type check; textured builds run one at a time (the machine holds 7.1 GiB).
- The plan records evidence (render, review card, rating) and remaining limits for each batch.
- Each builder agent builds one asset and one narrow step per run (the lesson of 2026-09-27), with a triangle budget.

## Sources

- `docs/fantasy-world-asset-catalog.tsv` (family `npcs`)
- `measure/tracks/asset_p2_npcs_20260928/` (the Chibi Quest plan and evidence)
- `docs/pack-layout.md` and `measure/riven-lands-roadmap.md`

## Out of scope

- Chibi Quest sources stay unchanged. A fix found during a port goes to the Chibi Quest family track.
- Delivery to the games and the packs (`riven_game_skin_20261009`).
