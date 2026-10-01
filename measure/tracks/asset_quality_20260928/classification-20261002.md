# Type error classification (2026-10-02)

Source: `tsc --noEmit -p .` on 2026-10-02, after the closeout batch 1 commit (19f193e).
Result: 357 errors in 73 files (355 in assets, 2 in tests). The baseline of 2026-09-28 had 140.
The increase comes from reworks after the baseline: rework agents did not run the compiler.
Since 9217cfa, every rework agent runs `node scripts/typecheck-asset.mjs <name>` before it reports.

## Class A: changes the render when corrected

The runtime ignores these values today, so the current renders do not show the intended shape or paint.
A correction changes the render, and each corrected asset needs a new render review.

| Defect | Files | Effect today |
| --- | --- | --- |
| `paintFn` passed as a body option (TS2353) | dirt-road-crossing, dirt-road-t-junction, fountain, glaive, trident, windmill, wood-wall | The pipeline never reads `options.paintFn`, so that paint is missing. Correction: call `.paintFn(...)` on the shape. |
| `sdf.intersect` with 4 arguments (TS2554) | living-statue (line 262), parts/warrior-sword (line 57) | `intersect` takes 2 shapes; the third and fourth cutters are ignored. |

## Class B: no visible change when corrected

| Defect | Files | Note |
| --- | --- | --- |
| `sdf.intersect` with 3 arguments | cheese (line 93) | The ignored box only bounded the wedge cutter; the wheel is bounded anyway. |
| `sdf.cone` with an edge radius (5 arguments) | vial (line 84) | `cone` takes no edge radius; the render already shows the unrounded cone. |
| Names that do not exist | fallen-tree (`PLATE_C`, `plateN`, `plateU`, `plateV`) | In `plateFrame`, which nothing calls: dead code. Delete it. |
| `scale` in a typed pose literal | clockwork-sentry (line 433) | The rig applies `scale`; only the local type omits it. |
| Type imports that do not exist | stalagmite (`Profile`), urn (`sdf.Sdf`) | Type positions only. |
| Possibly undefined index access (TS2532, TS18048, and TS2345/TS2322 with `number \| undefined`) | 66 files, about 290 errors | `noUncheckedIndexedAccess`: array reads in loops and tables. Correct with typed tuples, guards, or defaults; never with `!` in bulk. |
| Implicit `any` parameters (TS7006, TS7023) | 25 errors | Add parameter types. |
| Iterators of possibly undefined values (TS2488) | 6 errors | Same as the index class. |

## Tests

- tests/games/labyrinth/bot.test.ts: `dir` is not on `LabyrinthCommand` (owned by the Labyrinth track, TD-02).
- tests/part.test.ts: an optional `bone` under `exactOptionalPropertyTypes`.

## Order of work

1. Class A first, one asset at a time, with a render review per asset (7 + 2 files).
2. Class B by file, largest first (ivy 33, market-cart 29, campfire 20, vines 19, fishing-rod 15).
   Before and after each file, record the triangle count and the bounds from `stats.json`;
   a type-only correction must not change them.
3. Add the full `tsc --noEmit` to the import workflow when the count reaches 0.
