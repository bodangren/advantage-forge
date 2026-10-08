# Asset roadmap

The production catalog remains at its existing path. Measure owns execution status and acceptance.

## Current position

The generated inventory of 2026-10-02 lists 735 asset sources; 586 of the 856 catalog rows have a source.
Source coverage by priority: P0 54/54, P1 450/450, P2 67/304, and P3 15/48.
Review scores against the bars (P0 7.5, P1 and later 7.0, characters 7.5): P0 54/54, P1 450/450, P2 66/67, and P3 15/15.
The one row below its bar is iron-ore (P2, 6.0).
P0 and P1 are complete since 2026-10-02: all 504 rows have current textured outputs, sprites, and clip strips, the last builds have no warnings,
the sources have no compiler errors, and the five P0 maps are accepted at 7.5 ([evidence](./tracks/asset_p0p1_completion_20261002/evidence.md); TD-08 resolved for P0 and P1).
For P2 and P3, a score at the bar is not full acceptance: export and sprite acceptance is a separate state (TD-04).
The migration baseline of 2026-09-28 contained 426 source files.

## P2 status (2026-10-04)

P0 and P1 are complete (track [asset_p0p1_completion_20261002](./tracks/asset_p0p1_completion_20261002/)), so P2 is the next production level.

| Family | Rows | With a source | At the bar | Open | Track |
| --- | ---: | ---: | ---: | ---: | --- |
| Items | 56 | 56 | 55 (iron-ore 6.0) | 0 | [items](./tracks/asset_p2_items_20260928/), completed |
| Monsters | 80 | 80 | 80 (giant-bat 8.1, giant-rat 8.1, imp 8.2, mimic 8.7; batch 1: griffin 7.7, four element slimes 7.6 to 7.8, dragon-wyrmling 7.6; batch 2: four element dragons 7.7 to 8.0; batch 3: ten elementals 7.5 to 7.9; batch 4: nine on existing bases 7.5 to 8.0; batch 5: twelve on six kinds 7.6 to 8.0; batch 6: five on dragon, wolf, and spider kinds 7.6 to 7.8; batch 7: eight on six kinds 7.5 to 7.7; batch 8: three on a bird kind 7.6 to 7.7; batch 9: four on a serpent kind and a hydra 7.5 to 7.7; batch 10: nine on toad, octopus, and four existing kinds 7.5 to 7.7; batch 11: five fey and small monsters 7.6) | 0 | [monsters](./tracks/asset_p2_monsters_20260928/), completed |
| NPCs | 107 | 7 | 7 (cultist, healer, hunter, priest, pilgrim, sailor, scout, all 8.0) | 100 | [NPCs](./tracks/asset_p2_npcs_20260928/), new |
| Wildlife | 61 | 61 | 50 (independent review, bar 7.0, 2026-10-08: 13 at 7.5 or higher; 8 below the bar on the follow-up list; 3 mounts in rework) | 0 | [wildlife](./tracks/asset_p2_wildlife_20260928/), in progress |
| **Total** | **304** | **204** | **192** | **100** | |

- Monsters batch 1 (2026-10-04): griffin, green-, fire-, ice-, and poison-slime (on the slime kind factory `assets/parts/slime-kind.ts`), and dragon-wyrmling, each with an mmx mockup, a `forge all` build, and a review. Batch 2: dragon-ice, -poison, -shadow, and -storm on the dragon kind factory `assets/parts/dragon-kind.ts`. Batch 3: the ten elementals (air, crystal, earth, fire, ice, light, magma, shadow, storm, water) on the spirit kind factory `assets/parts/spirit-kind.ts` (the ghost's head, rig, and clips). Batch 4: will-o-wisp and forest-spirit (spirit kinds), imp-lord, demon, and horned-demon (imp kinds, `assets/parts/imp-kind.ts`), drake and dragon-ancient (dragon kinds), hippogriff (a griffin copy), and giant-boar (boar kind, `assets/parts/boar-kind.ts`). Batch 5: unicorn, nightmare, and kelpie (horse kinds, `assets/parts/horse-kind.ts`), shadow-hound and displacer-beast (wolf kinds, `assets/parts/wolf-kind.ts`), giant-spider-queen (spider kind), hill-, fire-, and frost-giant and cyclops (ogre kinds, `assets/parts/ogre-kind.ts`), colossal-golem (golem kind), and gremlin (goblin kind). Batch 6: giant-lizard and basilisk (dragon kinds), kitsune (wolf kind), scorpion and giant-crab (spider kinds). Batch 7: abyssal-beast (wolf kind), dire-bear (boar kind), owlbear and mushroom-creature (goblin kinds), fairy-sprite and succubus (imp kinds), eldritch-eye (spirit kind), and eldritch-horror (slime kind). Batch 8: giant-eagle, roc, and cockatrice on the bird kind factory `assets/parts/bird-kind.ts`. Batch 9: giant-snake, sea-serpent, lindworm, and cave-worm on the serpent kind factory `assets/parts/serpent-kind.ts`, and hydra (dragon kind). Batch 10: centipede (serpent kind), wyvern (dragon kind), giant-toad (toad kind factory `assets/parts/toad-kind.ts`), treant (goblin kind), void-tentacle and kraken (octopus kind factory `assets/parts/octopus-kind.ts`), ancient-treant (ogre kind), manticore and chimera (wolf kinds). Batch 11: pixie-swarm (a standalone source), centaur (horse kind with `head: false`), and dryad, satyr, and selkie (new humanoid sources on the villager's head and skeleton). The monsters track is complete (2026-10-05).
- Every open P2 row is a rigged character (NPCs and wildlife). The NPC rows have no mockup yet (`docs/npc-mockups/` holds the P0 and P1 ones only). All 80 P2 monsters have an mmx mockup in `docs/monster-mockups/`; the wildlife batches add their mmx mockups to `docs/wildlife-mockups/`.
- Wildlife (2026-10-05): batch 1 put five mounts on the horse kind with tack (`assets/parts/horse-tack.ts`); batch 2 made the deer a kind factory (`assets/parts/deer-kind.ts`) for the stag, elk, moose, goats, and sheep; batch 3 added the cow, ox, and yak (horse kind) and the camel (deer kind); batch 4 added the wolf, fox, dog, and riding wolf (wolf kind) and the cat and familiar cat (`assets/parts/cat-kind.ts`); batch 5 added the boar, pig, bear, badger, and hedgehog (boar kind). `assets/parts/scale-asset.ts` scales a kind to a small or large animal.
- Cost from the run log: a character takes one build plus one feedback pass, about 115K to 250K agent tokens on the high tier, so 237 characters need about 30M to 55M tokens, plus the mockups.
- Maps: 95 P2 blueprint rows (33 adventure, 30 civic, 20 wilderness, 12 settlements). 94 are `mockup-needed`; the hamlet is `accepted` (owner review 2026-10-02) with its sample map (`scenes/chibi-quest.ts`), the quality reference of the five P0 maps.
- Quality: 30 of the 32 remaining compiler errors are in P2 and P3 sources (rowboat, airship, plank, waterskin, mushroom-cap, wool, merchant-cart, longship).
- P3 for comparison: 15 vehicles accepted; 33 fx-geometry rows wait for four owner questions.

## Completion (2026-10-02)

The [completion track](./tracks/asset_p0p1_completion_20261002/) closed P0 and P1 and the five P0 maps with Sonnet 5.5 agents.
Maps: blacksmith shop, forest, tavern, village, and dungeon went from 5.5 to 6.5 to 7.5 each (five medium agents, two feedback passes).
Types: 46 sources corrected with identical meshes (`scripts/mesh-same.mjs`); the compiler went from 297 to 32 errors (TD-01).
Outputs: 211 `forge all` builds with 0 failures and 0 warnings; 526 outputs pass the final check.
The six P0 and P1 family tracks are closed.

## Closeout (2026-10-02)

The [closeout track](./tracks/asset_p0p1_closeout_20261002/) reworked the P0 and P1 rows below their bars and the three deferred assets.
Owner decisions: a character at 7.5 is acceptable, with the rating recorded so that games use it less; the deferred assets get one more pass; cliff-face must reach its bar.
Accepted: long-sword, shortbow, staff, iron-helmet, stone-golem, wraith, and wood-golem at 7.5; key-skeleton, belt-pouch, horned-helmet, steel-helmet, and cliff-face at 7.2; halberd, gauntlets, and cloth-hood at 7.0.
Five characters reached the bar by the 7.5 rule with their earlier reviews: farmer 7.6, quest-giver, horse, bone-golem, and bandit-archer 7.5.
The orchestrator rebuilt cliff-face. Leather-armor went from 7.0 to 7.3 in three agent passes and to 7.5 in an orchestrator pass; it still fits the avatar base.
Scores and notes are in `bench/sonnet/log.tsv` (batch `closeout`) and in `docs/character-reviews.json`.

## World catch-up (2026-10-01)

The [world catch-up](./tracks/asset_world_catchup_20261001/) brought every P0 and P1 world asset in scope to its bar (P0 7.5, P1 7.0): 117 accepted, including 33 ground tiles rebuilt as 0.3 m slabs with the top at y = 0.
Six equipment items (long-sword, shortbow, staff, belt-pouch, gauntlets, halberd) moved to the [equipment parts](./tracks/asset_equipment_parts_20260930/) track.
Three assets stayed deferred: wood-golem, cliff-face, and key-skeleton (closed on 2026-10-02, see above).
The owner decision of 2026-10-01: finish all P0 and P1 assets, including the equipment parts, before P2, because the platform starts with mini-games.

## Priorities

| Order | Work | Owning track |
| --- | --- | --- |
| 1 | Repair type errors and import gates | [Asset quality](./tracks/asset_quality_20260928/) |
| 2 | Accept the existing P0 set | [P0 acceptance](./tracks/asset_p0_acceptance_20260928/) |
| 3 | Finish P1 by family | The six P1 tracks in the registry |
| 4 | Reconcile exports and game packs | [Asset delivery](./tracks/asset_delivery_20260928/) |
| 5 | Produce P2 batches by demand | Items, monsters, NPCs, and wildlife tracks |
| 6 | Produce P3 batches by demand | Vehicles and effects tracks |

Every catalog row has an owner in the [scope map](./scope-map.tsv).
The P1 family tracks own existing acceptance and missing sources.
The remaining queues select batches; they do not replace track plans.

## Immediate production handoff

The overnight wrap-up records three regular queue rows and 19 held rows.
It also records four external trials: giant-crystal, palm-tree, silo, and wall-gate.
Their results need review before any source enters this repository.
Samurai has a reference, but no source at the migration baseline.
Provider quota messages are historical observations, not current availability checks.

## Scenes

Four tracks own the 100 blueprint rows: settlements, civic places, adventure sites, and wilderness scenes.
Existing sources cover examples and review scenes, not seven accepted catalog blueprints.
Hamlet, dungeon, forest, tavern, blacksmith, and village references need status reconciliation.
The original blueprint statuses lag behind these artifacts.

## Acceptance and expansion

Use the Forge review loop for every batch.
Record scale, materials, clips, source revision, output paths, and review results.
Keep game-layer behavior separate from asset geometry.
The companion-media and engine-backlog tracks own documented future planning outside the model catalog.
