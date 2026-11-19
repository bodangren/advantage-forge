# Bring P0 and P1 world assets to their bars

## Phase 1: Contract and owner decisions

- [x] Task: Record the bars, the slab height, and the character decisions in the specification.
- [x] Task: Commit the accepted characters (summoner, ogre-brute, living-statue) and log the three deferrals. (f9adb06)

## Phase 2: Batch 1 (game-used and P0)

- [x] Task: Render every batch 1 asset that has no current render. (53 re-rendered, 0 failures, 1 warning: sarcophagus)
- [x] Task: Review contact sheets and record a score for each asset in `bench/sonnet/log.tsv`. (26 accepted, 22 rework, 4 to the slab phase, 3 to the equipment-parts track)
- [x] Task: Write rework briefs for assets below the bar. (`bench/sonnet/briefs/<name>-catchup.md`)
- [x] Task: Run rework agents, one asset per agent, and review each result. (22 of 22 accepted: 12 P0 at 7.5 or more, 10 P1 at 7.0 or more)
- [x] Task: Run `./forge all` on each reworked asset and confirm no warnings. (textures and sprites newer than each source)

## Phase 3: Ground tiles

- [x] Task: List every ground tile and the scenes that stand on it. (33 slab tiles in `tiles.txt`; farm-field is an overlay; users: old-oak-clearing, village, chibi-quest, tavern-interior, blacksmith-shop, churchyard, potion-rush shop, dragon-flight)
- [x] Task: Rebuild the tiles as 0.3 m slabs with the top surface at y = 0, the standing height of the games. (33 tiles accepted at 7.0 or more, stone-floor 7.5; farm-field reworked as an overlay at 7.5; 3e9393a)
- [x] Task: Correct the scenes and confirm that characters stand on the tile surface. (old-oak-clearing, tavern-interior, blacksmith-shop, chibi-quest bridge; seven scene shots checked; games need no change)

## Phase 4: Batch 2 (other P1)

- [x] Task: Review the other P1 rows without a score, and record the scores. (34 reviewed: 23 accepted, 8 rework, 3 to the equipment-parts track: belt-pouch, gauntlets, halberd)
- [x] Task: Rework the P1 rows below 7. (8 of 8 accepted at 7.0 or more: candle and plate by orchestrator edit, 7 by agents; 3 on the low tier)
- [x] Task: Run `./forge all` on each reworked asset and confirm no warnings. (textures and sprites newer than each source)

## Phase 5: Close

- [x] Task: Update the P0 acceptance and P1 family plans with the accepted rows. (catch-up section in five family plans; [evidence](./evidence.md))
- [x] Task: Update the asset roadmap and project status.
- [x] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`. (no errors for this track; the remaining errors belong to avatar_system and showcase_battle_teaser)
