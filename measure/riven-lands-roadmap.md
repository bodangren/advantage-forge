# Riven Lands roadmap

Riven Lands is the second asset pack (skin) for the games. It targets secondary students (grades 7 to 12) in
Reading Advantage. The pack recreates the Chibi Quest assets with new proportions and a new surface treatment.
The gameplay meaning, the shared layouts, the bone names, the clip names, and the socket names stay the same.
Design: [docs/pack-layout.md](../docs/pack-layout.md). Art references: the
[hamlet concept map](../docs/hamlet-mockups/README.md) and the
[goblin warrior turnaround](../reference-designs/riven-goblin-warrior-20260925/README.md).

## Owner decisions of 2026-10-09

| Question (from `docs/pack-layout.md`) | Decision |
| --- | --- |
| Scope and order | The game set first (the rows the 28 games load, the 2D actors, the base, and the avatar pieces). Then the rest of the 856 catalog rows by family. |
| Game set track | One separate track builds the whole game set, with the 142 avatar pieces (about 230 assets), before the game skin and the family tracks. Decided later on 2026-10-09: the first plan put the game rows in the first phase of each family track, so the games had to wait for 8 whole family tracks. |
| Base character | About 1.6 m tall and 5 heads tall. Not chibi. |
| Skeleton | The same bone, clip, and socket names as Chibi Quest. Only joint positions and proportions change. |
| Track split | Foundation tracks, the game set, and one production track per catalog family. |
| Start | Build work starts after the Primary Advantage cutover is complete (cutover 2026-10-14 to 16, last date 2026-10-20). Planning may start now. |
| First game | Open. Proposal: Labyrinth (11 models). The game skin track asks the owner. |
| Stage 2 of the pack layout | Open. Not needed for this program. |

## Tracks

Every track has status `new` and the same start gate. Measure runs one track at a time to its end, so the order below is the build order.

| Order | Track | Workstream | Scope | Depends on |
| --- | --- | --- | --- | --- |
| 1 | [Pack layout stage 1](./tracks/riven_pack_layout_20261009/) | foundation | `packs/riven-lands/`, the `--pack` option, `out/<pack>/`, the pack key in the scope tables and the review tools | `repo_rename_advantage_forge_20261002` |
| 2 | [Base character and fit](./tracks/riven_base_character_20261009/) | assets | The Riven humanoid kind, the avatar base, every shared clip, `fit.md`, `PORTING.md`, two style proofs (knight, goblin warrior) | 1 |
| 3 | [Game set](./tracks/riven_game_set_20261009/) | assets | Every asset that the games and the avatar pack load: 89 game rows, 142 avatar pieces, and the sunken vault (231 assets and one scene) | 2 |
| 4 | [Game skin delivery](./tracks/riven_game_skin_20261009/) | games | Model packs, `secondary-riven-2d`, the avatar pack, the pack in the launch context, QC of 28 games, release to Reading Advantage | 2, 3 |
| 5 | [Heroes](./tracks/riven_heroes_20261009/) | assets | 44 rows outside the game set | 3 |
| 5 | [Enemies](./tracks/riven_enemies_20261009/) | assets | 64 rows outside the game set | 3 |
| 5 | [Monsters](./tracks/riven_monsters_20261009/) | assets | 79 rows outside the game set, on the remaining kinds | 3 |
| 5 | [NPCs](./tracks/riven_npcs_20261009/) | assets | 110 rows outside the game set | 3 |
| 5 | [Equipment](./tracks/riven_equipment_20261009/) | assets | 27 rows outside the game set and the avatar pieces | 3 |
| 5 | [Props](./tracks/riven_props_20261009/) | assets | 101 rows outside the game set | 3 |
| 5 | [Architecture](./tracks/riven_architecture_20261009/) | assets | 82 rows outside the game set | 3 |
| 5 | [Nature](./tracks/riven_nature_20261009/) | assets | 36 rows outside the game set | 3 |
| 6 | [Scenes](./tracks/riven_scenes_20261009/) | assets | The hamlet and the five P0 maps | props, architecture, nature |
| 7 | [Wildlife](./tracks/riven_wildlife_20261009/) | assets | 63 rows; no game row | 2 |
| 7 | [Items](./tracks/riven_items_20261009/) | assets | 59 rows; no game row | 1 |
| 7 | [Vehicles](./tracks/riven_vehicles_20261009/) | assets | 15 rows; no game row | 1 |
| 7 | [Effects geometry](./tracks/riven_fx_geometry_20261009/) | assets | 33 rows; no game row; may reuse Chibi Quest sources per row | 1 |

The games get the Riven Lands look after tracks 1 to 4. The family tracks follow, in the demand order of the games.
The registry lists the tracks in this order under the heading "Riven Lands pack".

## The game set

The 28 game manifests load 86 Forge models: 68 catalog rows and 18 kit pieces without a catalog row.
The 2D pack holds 24 actors (15 characters with presets); 3 heroes are in the 2D pack only.
The avatar pack holds the base and 142 ready pieces: 72 are equipment catalog rows, and 70 are character pieces with no catalog row.

| Family | Game rows | Rows |
| --- | ---: | --- |
| heroes | 7 | adventurer, cleric, druid, knight, paladin, ranger, wizard (adventurer, paladin, ranger are in the 2D pack only) |
| enemies | 5 | bandit, goblin-warrior, orc-warrior, skeleton, zombie |
| monsters | 5 | dragon-fire, giant-bat, griffin, mimic, slime |
| npcs | 4 | farmer, guard, innkeeper, villager |
| equipment | 1 | lantern |
| props | 27 | 20 catalog rows and 7 kit pieces |
| architecture | 25 | 18 catalog rows and 7 kit pieces |
| nature | 15 | 11 catalog rows and 4 kit pieces |
| **Total** | **89** | 86 3D models and 3 2D-only heroes, plus 142 avatar pieces and the sunken vault |

## Rules that apply to every track

- Bars: characters 7.5, wildlife and world assets 7.0, maps 7.5. An independent reviewer agent rates each batch; the builder never rates its own work (owner, 2026-10-05).
- A row that stays below the bar after three reviews goes on the follow-up list (the wildlife stop rule, owner, 2026-10-08).
- Keep every variant (owner, 2026-10-01). Rated G content (owner, 2026-10-04).
- One agent builds one asset in one narrow step. Textured builds run one at a time on this machine.
- Chibi Quest sources stay unchanged. Ratings go in `packs/riven-lands/reviews.json`.
- The monorepo session makes every monorepo change. Releases wait for the Primary deployment and for the end of any feature freeze.

## Cost estimate

A Chibi Quest character took one build and one feedback pass, about 115K to 250K agent tokens on the high
tier. The Riven Lands pack has 381 rigged rows (heroes, enemies, monsters, NPCs, wildlife) and 475 world and
equipment rows. The porting recipe (a shared kind with a proportion warp and a re-dress) is the main lever on
this cost; the base track proves it before the family tracks start.

## Status

Updated 2026-10-09: 17 tracks, all `new`. The game set track was added the same day, and the family tracks lost their game phase. No Riven Lands source exists yet.
