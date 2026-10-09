# Riven Lands scenes

## Purpose

Assemble the Riven Lands treatment of the accepted Chibi Quest scenes: the hamlet (the one Riven Lands concept
map) and the five P0 maps (blacksmith shop, forest, tavern, village, dungeon). The shared layout, the map
positions, and the interaction points stay the same. The sunken vault is part of `riven_game_set_20261009`.

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

## Functional requirements

- FR-1: `packs/riven-lands/scenes/` holds one scene source per Chibi Quest scene with the same file name (`chibi-quest.ts` keeps its name unless the owner approves a rename).
- FR-2: The hamlet scene places the 26 component IDs of `docs/hamlet-mockups/components.tsv` in the Riven Lands treatment and matches `docs/hamlet-mockups/riven-lands-v2.png` in an overhead and a three-quarter render.
- FR-3: Each P0 map has an mmx mockup in the Riven Lands language before assembly.
- FR-4: Each scene reaches the map bar of 7.5 in an independent review.

## Acceptance criteria

- Each scene renders from its source with no missing model and no warning.
- The overhead and three-quarter renders sit next to the mockup in the review card.
- The scene blueprint rows (`docs/fantasy-world-asset-catalog.md`, scene blueprints) record a Riven Lands status (TD-05 names the lag of blueprint statuses).

## Out of scope

- The sunken vault (`riven_game_set_20261009`).
- The 94 P2 scene blueprints. A later track selects them by game demand.
- New map layouts. The layout is shared.
