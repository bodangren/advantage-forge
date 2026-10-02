# Evidence: complete P0 and P1 assets and maps (2026-10-02)

## Final outputs

The final output check on 2026-10-02 covered 526 names: the 495 sources of the 504 P0
and P1 catalog rows, and 31 more assets that the five P0 maps place. All 526 pass:

- `out/<name>/<name>.glb` and `stats.json` exist and are newer than the source and its imported parts.
- The build is textured. `coal` declares `texture: false` and is vertex-colored by design.
- `sprites/preview.png` is newer than the source, and every clip in `stats.json` has its `anim/<clip>.png`.

[rebuilds.tsv](./rebuilds.tsv) lists the 211 `./forge all` runs of this track (exit code, warning
count, seconds): 0 failed, 0 warnings, about 357 build minutes. Sources at commit 0596423 or earlier;
no asset source changed after its last run.

| List | Builds | Reason |
| --- | ---: | --- |
| outputs | 143 | P0 and P1 rows with an old, fast-only, or incomplete output (the first check found 144 sources; warrior moved to typefix) |
| maps | 21 | Map pieces with old outputs, 9 of them with only a GLB from the trial runs |
| typefix | 40 | P0 and P1 sources after their type-only corrections |
| typefix-maps | 7 | Six map pieces after their type-only corrections, and coal |

## Maps

| Map | Before | After | Pieces | Commit |
| --- | ---: | ---: | ---: | --- |
| Blacksmith shop | 5.5 | 7.5 | 64 | f3bc6b6 |
| Forest (Old Oak Clearing) | 6.0 | 7.5 | 191 | 58b9a08 |
| Tavern | 6.5 | 7.5 | 148 | cb0903b |
| Village | 6.5 | 7.5 | 455 | 879281e |
| Dungeon (Sunken Vault) | 6.5 | 7.5 | 221 | 619f80e |

Viewer changes: warm interior light for the cutaways (c0bc297), a weaker key light for dark maps
(9f4a136), and warm point lights at the flames of dark maps (619f80e). The shots are in each
`docs/<env>-mockups/` folder; the scores and notes are in `bench/sonnet/log.tsv` (rows `map-*`).

## Type errors

46 sources corrected (40 P0 and P1, 6 map pieces), each SAME by `scripts/mesh-same.mjs`
(identical bounds, triangles per body, and GLB data, clips included). The full compiler went from
297 to 32 errors; the 32 are in P2 and P3 sources and in two tests (TD-01).

## Agent cost

| Work | Agents | Tokens |
| --- | ---: | ---: |
| Maps (5 builds, 2 feedback passes) | 5 forge-sonnet-medium | about 309K |
| Type corrections | 4 medium, 13 low | about 504K |
