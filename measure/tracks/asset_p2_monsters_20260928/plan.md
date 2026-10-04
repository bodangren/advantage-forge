# Produce P2 monsters

Status: in progress (batch 1 done 2026-10-04). This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [x] Task: Select a bounded batch from the scope map (batch 1 by game demand, below).
- [x] Task: Record scale, palette, rig, clips, and game uses before generation (the design note at the top of each source).

## Phase 2: Acceptance checks

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch.
- [x] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [ ] Task: Build missing sources and review existing sources in the batch (batches 1 to 4 done; 47 rows open).
- [ ] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [ ] Task: Record review evidence and export paths for every accepted asset.
- [ ] Task: Update this plan and the scope records.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.

## Acceptance checks (all batches)

Bar 7.5/10 (characters). Each asset needs: a mockup in `docs/monster-mockups/` (mmx, clay-toy
chibi style), a design note at the top of the source, a turnaround that matches the mockup in
silhouette and color, readable 8-direction sprites at 128 px, `./forge check <name>` with
`ground ok`, a `forge all` build with no `warning:` lines, a clip strip for each clip, and a
review entry in `docs/character-reviews.json` (scores, issues, next steps).

## Batch 1 (2026-10-04): game demand, built by the orchestrator

| Asset | Catalog ID | Base | Clips | Rating | Commit |
| --- | --- | --- | --- | ---: | --- |
| griffin | monsters/beast/griffin | new quadruped with wings (dire-wolf gait) | idle, walk, run, fly, attack, hit, roar, death | 7.7 | d0c3d6b |
| green-slime | monsters/small/green-slime | slime kind factory, leaf sprout | idle, walk, attack, hit, death, spit | 7.6 | 4a171cd |
| fire-slime | monsters/small/fire-slime | slime kind factory, flames | same six | 7.7 | 4a171cd |
| ice-slime | monsters/small/ice-slime | slime kind factory, crystals | same six | 7.6 | 4a171cd |
| poison-slime | monsters/small/poison-slime | slime kind factory, goo | same six | 7.8 | 4a171cd |
| dragon-wyrmling | monsters/dragon/dragon-wyrmling | fire-dragon rig and clips, new head and shell | idle, walk, run, fly, attack, hit, death, roar | 7.6 | f18f5c2 |

- Game use: the griffin replaces the fire dragon as the mount of Gryphon Patrol, Griffin Sky-Joust,
  and Griffin Riders Escape (integration is the next task, below). Its attack, hit, and roar happen
  in the air, so they blend with the fly loop. The slimes give Devourer Slime and the slime games
  four element kinds. The wyrmling is a weak early dragon or a companion.
- Slime kinds: `assets/slime.ts` (P0) now calls `slimeAsset` in `assets/parts/slime-kind.ts`;
  `node scripts/mesh-same.mjs slime` gave SAME (identical GLB data). A kind sets the slots and may
  add a crown on its own bone, posed in every clip and shrunk in the death.
- Evidence: `out/<name>/` (GLB, render, views, sprites with presets, `anim/` strips), the check
  output (ground ok for all six), and the review entries.

## Batch 2 (2026-10-04): element dragons on a dragon kind factory

| Asset | Catalog ID | Kind features | Rating |
| --- | --- | --- | ---: |
| dragon-ice | monsters/dragon/dragon-ice | ice horns and crest (see-through, faceted), frost breath | 7.7 |
| dragon-poison | monsters/dragon/dragon-poison | purple crest and wings, venom drop on a fang, gas breath | 8.0 |
| dragon-shadow | monsters/dragon/dragon-shadow | glowing violet crest and forehead gem, smoke breath | 7.9 |
| dragon-storm | monsters/dragon/dragon-storm | glowing yellow crest, silver metal horns, lightning breath | 7.8 |

- `assets/dragon-fire.ts` (P0) now calls `dragonAsset` in `assets/parts/dragon-kind.ts`;
  `node scripts/mesh-same.mjs dragon-fire` gave SAME. A kind sets the slots, the fixed palette
  (crest, wings, horns, brows, breath), the looks of the horns, crest, and wings, and extra bodies.
- All four: the eight fire dragon clips, `ground ok`, `forge all` with 0 warnings, a mockup from mmx.

## Batch 3 (2026-10-04): ten elementals on a spirit kind factory

| Asset | Catalog ID | Kind features | Rating |
| --- | --- | --- | ---: |
| fire-elemental | monsters/elemental/fire-elemental | flame hair cap and five flickering tongues, glowing orange wisp | 7.8 |
| water-elemental | monsters/elemental/water-elemental | wave crest curls and droplets, clear teal wisp | 7.6 |
| air-elemental | monsters/elemental/air-elemental | two spiral wind ribbons, wind tuft | 7.5 |
| earth-elemental | monsters/elemental/earth-elemental | sprout, cracked clay boulder body with moss and stones | 7.8 |
| ice-elemental | monsters/elemental/ice-elemental | pointed ears, crown of ice crystals, white-to-teal wisp | 7.9 |
| light-elemental | monsters/elemental/light-elemental | floating halo, small wings, glowing gold wisp | 7.7 |
| shadow-elemental | monsters/elemental/shadow-elemental | cat ears, violet eye glass, smoke wisps | 7.8 |
| storm-elemental | monsters/elemental/storm-elemental | lightning bolt crest, cloud rings on the wisp | 7.6 |
| crystal-elemental | monsters/elemental/crystal-elemental | burst of sixteen crystals, pulsing chest gem | 7.8 |
| magma-elemental | monsters/elemental/magma-elemental | rock hood, lava flame crest, glowing lava spots | 7.6 |

- `assets/ghost.ts` (P1) now calls `spiritAsset` in `assets/parts/spirit-kind.ts` with
  `lower: 'sheet'`; `node scripts/mesh-same.mjs ghost` gave SAME. An elemental kind uses the
  wisp body (a small round body that tapers into the curled tail), sets the head and wisp
  materials and paint, and adds element features with their own bones and clip poses.
- Shared feature shapes are in `assets/parts/element-features.ts` (crystal, flame tongue, curl);
  `assets/ice-slime.ts` now imports its crystal from there (mesh-same: SAME).
- All ten: the six ghost clips, `ground ok`, `forge all` with 0 warnings, a mockup from mmx.

## Batch 4 (2026-10-04): monsters on existing bases

| Asset | Catalog ID | Base | Rating |
| --- | --- | --- | ---: |
| will-o-wisp | monsters/fey-and-spirit/will-o-wisp | spirit kind: glowing ghost flame, flickering flames | 7.6 |
| forest-spirit | monsters/fey-and-spirit/forest-spirit | spirit kind: leaf hood, flower, moss wisp | 8.0 |
| imp-lord | monsters/abyssal-and-cosmic/imp-lord | imp kind: crown, purple mantle, gold armlets | 7.8 |
| demon | monsters/abyssal-and-cosmic/demon | imp kind: bulk 1.35, brow horn, stone armbands and belt | 7.5 |
| horned-demon | monsters/abyssal-and-cosmic/horned-demon | imp kind: huge horns, orange markings | 7.9 |
| drake | monsters/dragon/drake | dragon kind without wings, stripes | 7.6 |
| dragon-ancient | monsters/dragon/dragon-ancient | dragon kind: long horns, white mane and beard | 8.0 |
| hippogriff | monsters/beast/hippogriff | griffin copy with horse hindquarters, hooves, horse tail | 7.8 |
| giant-boar | monsters/beast/giant-boar | boar kind without horns, big tusks, tall mane | 7.8 |

- New factories: `assets/imp.ts` calls `impAsset` in `assets/parts/imp-kind.ts` (mesh-same:
  SAME) and `assets/horned-boar.ts` calls `boarAsset` in `assets/parts/boar-kind.ts` (SAME).
  The dragon kind gained `horn`, `hornBaseBelow`, `wings: false` (no wing bodies, no fly clip),
  and `paint` (dragon-fire, -ice, and -storm: SAME). The spirit kind gained head glow and opacity.
- The clip check counts any band on a forearm as a held item; the shared imp attack and death
  clips bring the forearms against the head, so the imp kinds wear bands on the upper arms.
- All nine: `ground ok`, `forge all` with 0 warnings, a mockup from mmx (with the base mockup as
  the subject reference).

## Next

- [x] Task: Put the griffin into the three griffin games. Done in the track `game_griffin_mount_20261004`.
- [x] Task: Batch 3: the ten elementals on a factory from the ghost (one floating body plan, element features).
- [x] Task: Batch 4: monsters on existing bases (spirit, imp, dragon, and boar kinds, and a griffin copy).
- [ ] Task: Batch 5: the next monsters by base reuse (wyvern and lindworm need a new rig; see the open rows).
