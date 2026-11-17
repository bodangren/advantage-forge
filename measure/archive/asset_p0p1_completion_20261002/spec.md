# Complete P0 and P1 assets and maps

## Purpose

Owner goal of 2026-10-02: complete all P0 and P1 assets with Sonnet 5.5 agents, including all maps,
then report the status of P2.

The [closeout track](../asset_p0p1_closeout_20261002/) brought all 504 P0 and P1 catalog rows to their
review bars. A review score is not completion: the final outputs must also be current, and the maps
need acceptance. This track closes those two gaps.

## Scope

1. **Final outputs of the 504 rows.** For each row, `out/<name>/` holds a textured GLB, sprites, and
   one strip for each clip, all newer than the source and its imported parts. The build has no
   `warning:` lines. An output check on 2026-10-02 found 144 sources (147 rows) with an old, fast, or
   incomplete output.
2. **The five P0 maps** of `docs/fantasy-world-scene-blueprints.tsv`: dungeon (`scenes/sunken-vault.ts`),
   forest (`scenes/old-oak-clearing.ts`), tavern (`scenes/tavern-interior.ts`), blacksmith-shop
   (`scenes/blacksmith-shop.ts`), and village (`scenes/village.ts`). Each map has a style mockup,
   a component list, and a scene source. No map has a recorded acceptance, and every blueprint row
   still says `mockup-needed` (TD-05).
3. **Type errors in P0 and P1 sources** (TD-01 class B): 244 errors in 40 files on 2026-10-02.
   Each correction must leave the mesh and colors the same (`scripts/mesh-same.mjs`).
4. **The P2 status report**: source coverage, review scores, and the next P2 work.

The 95 P2 blueprint rows are P2 work. The P2 report covers them; this track does not build them.

## Method

- The orchestrator measures each asset or map first and writes a short brief with the exact faults.
- One Sonnet 5.5 agent (`forge-sonnet-low`, `-medium`, or `-high`) takes one asset or one map and one
  narrow step. Agents do not commit and do not edit `src/`.
- The orchestrator reviews each result, runs `./forge all` and the type check, and commits explicit paths.

## Acceptance

- Assets: every P0 and P1 row has a current textured output, sprites, and clip strips, its last
  build has no warnings, and its source has no compiler errors.
- Maps: every component in the map's component list has a source; the overview renders match the
  mockup zones, portals, and paths; the map scores 7.5 or more (P0 bar). The blueprint row then
  says `accepted`.
