# Chibi Sprouts cast on the Kim base: plan

Status: new (created 2026-11-25). No character work has started. Amendment round 1 answers the spec
review of 2026-11-25. Amendment round 2 answers the second spec review of 2026-11-25
(`spec-review-82a2a26.json`: F4, F5, F7, F8, F9, F10, F14, F15, F16, F17, F18). After round 2, Red
starts with no third review. The plan records execution state. `spec.md` holds the contract, the
tables, and the acceptance criteria. `test-strategy.md` holds the test plan.

Source: `QUEUE.md` item 3 and the Mom shape approval (redesign plan T12; judge record
`measure/runs/chibi_sprouts_redesign_20261123/judge.json`, identity 7.5 and proportion 8.5). The
design page is `docs/chibi-sprouts/redesign-2026-11-23.md` (approved).

Lane: light (PM rule 2026-11-25). `metadata.json` holds `"lane": "light"`. Four phases, one per
group: the measuring tools, the adults, the children, and the delivery.

Every render and every test run uses the heavy runner:

```bash
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'
```

A textured Forge command also takes a build slot. Shape iteration uses `--fast`.

**No customer-facing claim is made.** The track publishes nothing. The five panels, the cast sheet,
the judge records, and the handoff stay internal. The PM decides any external use, and Daniel's look
stays the last gate.

## Gates this track does not run

- No Review A, no Review B, and no Review C (spec decision o). Phase 1 runs one adversarial round,
  because two scripts change. Phase 2 starts only after a `pass` verdict with every blocking finding
  closed. Phases 2 to 4 run no adversarial round.
- No UX review. The look judge is the only look gate.
- No paid call, no `openchamber_image`, and no hosted model other than the approved judge route.
- No cut-out, no sprite, no walk clip, no song render, and no game skin.
- No `./forge all`.

The gate set is fixed. The orchestrator adds no review gate and no extra review role.

## Files this track touches

- `measure/tracks/chibi_sprouts_cast_20261125/*` (new)
- `measure/tracks.md` (one registry row)
- `measure/generated/status.md` (the generator run)
- `tests/proportion-cast-options.test.ts` (new, Red)
- `tests/sprout-cast-panel.test.ts` (new, Red)
- `tests/sprout-child-base.test.ts` (new, Red, Phase 3)
- `tests/cast-isolation.test.ts` (new, Red)
- `tests/fixtures/cast-baseline.json` (new, T0)
- `tests/sprout-dad-kim.test.ts`, `tests/sprout-grandma-kim.test.ts`,
  `tests/sprout-grandpa-kim.test.ts`, `tests/sprout-tom-kim.test.ts`,
  `tests/sprout-lily-kim.test.ts` (new, Red)
- `scripts/proportion-check.mjs` (Green: `--base`, `--table`, `--record`, `TABLES`, the child table,
  the rounded crown source, the destinations, the `castMeta` face-mark exclusion, the Lily guards,
  the exported `measureFigure` seam)
- `scripts/sprout-cast-panel.mjs` (new, Green: `--asset`, `--all`, `--sheet`, the horizontal crop)
- `assets/parts/humanoid-kim.ts` (Green: three aliases; no other change)
- `assets/parts/humanoid-kim-child.ts` (new, Green)
- `assets/sprout-dad-kim.ts`, `assets/sprout-grandma-kim.ts`, `assets/sprout-grandpa-kim.ts`,
  `assets/sprout-tom-kim.ts`, `assets/sprout-lily-kim.ts` (new, Green)
- `tests/fixtures/preset-pin.json` (five new keys, written by `scripts/make-preset-pin.mjs`)
- `out/sprout-*-kim/` and `out/chibi-sprouts/cast/` (not in git)
- `measure/runs/chibi_sprouts_cast_20261125/` (the judge records, the escalation file, the handoff)

The track changes no scrapped source, no Mom asset, no shipped asset, and no game file.

## Role brief template

Every task brief carries these lines:

- Red writes tests only. Green writes the scripts and the assets. The orchestrator records each
  role's model id and family in the task record.
- The Red family and the Green family differ from each other and from the judge family. The judge is
  a separate role on `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia. The route is not
  muse, not hy4, and not OpenAI. A missing route waits; do not substitute.
- No role calls the `openchamber_image` tool. A role reads an image with `read`.
- The approved look judge is the only hosted call. Its only uploaded file is the panel
  `out/chibi-sprouts/cast/<name>-panel.png`, with the brief text. Every other upload is forbidden.
- No role edits a scrapped source. No role deletes a source, a committed file, or a production
  file. The generators replace their own files inside the worktree `out/` tree.
- Every render and every test run uses the heavy runner.
- Every probe and every fixture stays in this worktree or under `/tmp`.
- A paid call, or a forbidden upload, is a stop-and-report event.
- A panel or a record is written only under the worktree `out/`. A linked, outside, or directory
  destination is a stop-and-report event.

The spec review is not run in this delegated session. The reason is in `spec-review.md`, and the
orchestrator ran the review on the review commits `b58aad2` and `82a2a26`. Amendment round 1 and
amendment round 2 answer every finding before Red. After round 2, Red starts with no third review.

## Phase 1: The measuring tools

- [x] T0 Measure: Prepare the worktree outputs and the baselines. Commit `c562992b18be32bb60a756b63158d713a706aefb`.
  - Build and render Mom in the worktree `out/`, in this order (spec "The output tree"):
    `./forge build sprout-mom-kim --fast`, then the flat level render, then the lit level render.
  - Write `tests/fixtures/cast-baseline.json` from the track base commit `b58aad2`: one SHA-256 per
    scrapped source (`assets/sprout-*.ts`, `assets/parts/sprout-gestures.ts`), the `ADULT`, `AGE5`,
    and `HERO` export values, and Mom's preset entry of `tests/fixtures/preset-pin.json`.
  - Done-when: `out/sprout-mom-kim/sprout-mom-kim.glb`, `stats.json`, `flat/front-level.png`,
    `flat/side-level.png`, `views/front-level.png`, and `views/side-level.png` exist; the baseline
    file parses and holds every key; the plan records the five artifact SHA-256 sums (the GLB and
    the four level renders, taken after the lit render), the stable stats projection, the five
    paths, and the raw `stats.json` hash for traceability only.
  - Record: the commands, the five artifact hashes, the stable stats projection, the raw stats hash,
    and the baseline key list.
  - Note: this task writes no asset, no test, and no script. A fresh worktree runs it again. The
    outputs are not committed.
  - Evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, from `master` at `5356e787`; node v24.19.0; each command through the heavy
    runner, exit 0):

    ```bash
    ./forge build sprout-mom-kim --fast
    ./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024
    ./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none --size 1024
    ```

    Build line: `sprout-mom-kim: 48,511 triangles, 0.432 x 1.52 x 0.328 m`. All six paths exist:
    `out/sprout-mom-kim/sprout-mom-kim.glb`, `out/sprout-mom-kim/stats.json`,
    `out/sprout-mom-kim/flat/front-level.png`, `out/sprout-mom-kim/flat/side-level.png`,
    `out/sprout-mom-kim/views/front-level.png`, `out/sprout-mom-kim/views/side-level.png`.

    Five artifact SHA-256 sums, taken after the lit render:

    | Artifact                | SHA-256                                                            |
    | ----------------------- | ------------------------------------------------------------------ |
    | `sprout-mom-kim.glb`    | `6f972378e357035cf94bbbe80af82f7173bde38a0223a61dcc4160e763b4311a` |
    | `flat/front-level.png`  | `0c6201ae1b9f2502cda207561676e58e6744c2a8f50df07e782aba534f07f43b` |
    | `flat/side-level.png`   | `93bea38cdf28b3cd71898cca958918b99637c7cc9c22c1568a31f2f206a3abbf` |
    | `views/front-level.png` | `2abd3f55642c851818552e5025284c42dd7e5b78441c7683b8de02680de5b851` |
    | `views/side-level.png`  | `48fc3c2f3bb7443f8024cccadc438a8a9043fca1c9995eb55a144319cec93212` |

    Raw `stats.json` SHA-256 (traceability only, never an equality check):
    `de17e20a53fd47dc2a93cdae7324d2e0eaa6c012a2ce1dea4b3b1199f5255bb7`.

    Stable stats projection (every `milliseconds` key removed at any depth, `texture` keeps `size`
    only; `texture` is `null` here; canonical JSON hash with sorted keys
    `c93209cc3d9095c8376c96308ad5bb92e1dedacf0a7a1644bc77fa5c6aa95a6e`): `name`
    `sprout-mom-kim`; `triangles` 48511; `bounds` min `[-0.216, -0.005, -0.181]`, max
    `[0.216, 1.515, 0.147]`, size `[0.432, 1.52, 0.328]`; `texture` null; `bones` 17;
    `animations` `[{ name: idle, duration: 2.4 }]`; `bodies` in this order:

    | body       | gridPoints | evaluatedPoints | rawTriangles | triangles |
    | ---------- | ---------- | --------------- | ------------ | --------- |
    | head-skin  | 4657545    | 934555          | 191328       | 6219      |
    | torso-skin | 207993     | 139246          | 27388        | 2264      |
    | arms-skin  | 233625     | 120066          | 25800        | 1390      |
    | legs-skin  | 138425     | 117438          | 26908        | 1236      |
    | feet-skin  | 66625      | 40530           | 8312         | 1402      |
    | hands      | 2005185    | 273197          | 66168        | 19966     |
    | hair       | 793881     | 265127          | 55752        | 4766      |
    | sweater    | 384993     | 223906          | 46936        | 5886      |
    | jeans      | 337953     | 185623          | 37644        | 3292      |
    | flats      | 66625      | 46536           | 10808        | 1742      |
    | studs      | 32657      | 5315            | 400          | 348       |

    `tests/fixtures/cast-baseline.json` keys: `note`, `base` (`b58aad29c8cd5c36cf3b1bf14e73707bb45d6a69`),
    `sources` (18 paths: `assets/parts/sprout-gestures.ts` and the 17 `assets/sprout-*.ts` files,
    each with its base-commit blob SHA-256), `contracts` (`ADULT`, `AGE5`, `HERO`, serialized with
    each function as `fn:<source>`, because `clips.reach` is a closure), `momPreset` (the
    `assets["sprout-mom-kim"]` entry of `tests/fixtures/preset-pin.json`). Prettier check passes,
    and every `sources` hash equals the worktree file at `b58aad2`.

- [x] T1 Red: Pin the measuring options, the tables, the fixtures, the panel script, and the isolation baseline. Commits `ad43039a073d5cf61f5c3ebac787856e9970d7a4` and `ba0b353b9d965e4e94b078da4949311f87ef504f`.
      Logs
      `measure/runs/chibi_sprouts_cast_20261125/red-c562992.log` and
      `measure/runs/chibi_sprouts_cast_20261125/red-3aabca1c.log`.
      Files: `tests/proportion-cast-options.test.ts`, `tests/sprout-cast-panel.test.ts`,
      `tests/cast-isolation.test.ts` (all new).
  - `tests/proportion-cast-options.test.ts` asserts:
    1. `--base humanoid-kim-child` reads `assets/parts/humanoid-kim-child.ts`; an absent file exits 1
       with `base humanoid-kim-child: not built` before any import.
    2. `--base` with an empty value, an absolute path, a path separator, or a dot-dot segment exits 1
       with `unknown base <stem>`.
    3. `--table child` uses the child table; an unknown or empty name exits 1 with
       `unknown table <name>: known kim, child`.
    4. `--record <path>` writes the record at the named path. A path outside `out/` exits 1 with
       `destination outside out/: <path>`.
    5. `TABLES` is an object of ordered arrays of `{ name, lo, hi }`, and `TABLES.kim` and
       `TABLES.child` equal the two spec tables, name, order, `lo` and `hi`.
    6. The selected table decides: `heightInHeads 3.00` passes `child` and fails `kim`; `3.60` passes
       `kim` and fails `child`.
    7. A row with `lo` and `hi` that differ from the table fails with
       `FAIL <name>: row limits <lo>..<hi> disagree with table <table>`, even when the value sits
       inside the row's own limits.
    8. The record holds the eleven table names in table order plus `lit`, and `rows.lit` is the
       `{ crown, sole, height }` pair per view. It also holds `glbSha256`, the four render hashes,
       `base`, and `baseSha256`.
    9. `checkRows(rows)` still uses `kim`, and `checkRows(rows, 'child')` uses `child`.
    10. `heightInHeads`, `legShare`, `eyeLine`, `eyeHeight`, the head-width band, and the eye window
        use `projectedCrownRow`. The mask top stays in `detail.crownRow`; it may sit above the
        projected crown by any amount and may not sit more than 2 px below it.
    11. `measurePixels()` returns exactly its five figures with the same names, order, `params`, and
        results. No sixth item is added. This pins the existing API of
        `tests/sprout-mom-kim.test.ts:305`.
    12. The `bun-above-crown` fixture is an explicit figure object that the test passes to the
        exported `measureFigure`. Its mask top is 24 px above the projected crown, every row passes,
        and its head height equals `chinRow - projectedCrownRow`, not `chinRow - detail.crownRow`.
        The `wrong-crown` fixture fails with `GUARD top on mask`.
    13. The `glasses-frame` fixture finds two eye components with `castMeta.faceMarks.glasses` and
        fails with `eye components: found 1, expected 2` without it. A mark colour within 24 of the
        iris colour fails with `faceMarks glasses: too close to the eye paint`. The pixel exclusion
        drops the exact declared hex and a 1 px edge, so the fixture paints the frame with exactly
        that hex (spec rule 3).
    14. The Lily hair fixtures produce the three named Lily guards, and a planted hair row across the
        chin gives `GUARD lily chin: hair crosses the chin at row <r>`. A missing `variants.hair`
        exits 1 with `hair colour: not declared`.
    15. A destination that is a link, a directory, or outside the tree exits 1 with the named line,
        and the tree hash is unchanged.
    16. `BASE_CROWN_Y`, `BASE_CHIN_Y`, and `BASE_HANDS` are the three exports of the adult base, and
        they equal `KIM.crown`, `KIM_CHIN_Y`, and `KIM_HANDS`.
  - `tests/sprout-cast-panel.test.ts` builds a temporary tree under `--root` with two synthetic
    256 × 256 renders, one synthetic 800 × 1600 drawing, one synthetic 1600 × 1600 drawing, and one
    record per asset. It asserts:
    1. one panel per name at `out/chibi-sprouts/cast/<name>-panel.png`, 1416 × 900,
    2. three cells at one 700 px body scale with one baseline at row 780 and the crown at row 80,
    3. the caption holds the asset name, the date, the row result, and the crop state,
    4. the bun fixture keeps its bun pixels above the 700 px band, inside the 56 px headroom,
    5. the sheet is 1544 × 900, holds five figures at 466.667 px per metre, and one baseline; an
       adult is 700 px and a child 490 px,
    6. the `DRAWING_ROWS` export equals the five pairs of spec decision (n),
    7. the 1600 px drawing is cropped to the 440 px cell window, its head band fits, its caption says
       `cropped: yes`, and a fixture whose head is wider than the cell exits 1 with
       `figure wider than its cell: <name>`,
    8. a missing render exits 1 with `render <view>: not built`,
    9. a linked cast folder, a linked output file, a directory destination, and an outside
       destination each exit 1 with one line and are not followed, and the tree hash is unchanged,
    10. `--asset sprout-tom-kim` writes one panel and no sheet, `--sheet` writes
        `out/chibi-sprouts/cast/cast-sheet.png` and no panel, and `--all` writes five panels and the
        sheet. Two of the three options together exit 1 with
        `choose one of --asset, --all, or --sheet`.
  - `tests/cast-isolation.test.ts` asserts every scrapped source hash, the `ADULT`, `AGE5`, and
    `HERO` values, and Mom's preset entry against `tests/fixtures/cast-baseline.json`. This file
    passes at T1 and stays a regression case; it is not a new failing case.
  - `tests/sprout-child-base.test.ts` is not written in Phase 1. It moves to Phase 3, T11 (finding
    F15), so Phase 1 leaves a passing tool suite and the child module has one phase owner.
  - Done-when: the two new files fail inside the named cases on the absent script, option, asset, or
    base, with exit 1 and no collection, syntax, or import error. `tests/cast-isolation.test.ts`
    passes. `prettier --check` exits 0 on the three files.
  - Record: the case names, which cases are new failing cases and which case is the passing
    regression case, the fixture bodies, and the failure text.

  - Evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `5356e78730daefd5225f9733f190dc6bb631b90d`, role base
    `c562992b18be32bb60a756b63158d713a706aefb`):
    - Fixture bodies: the proportion cases build a 1024 px front and side figure with explicit
      `projectedTop`, `projectedSole`, `chinRow`, and landmarks. The bun mask top is 24 px above the
      projected crown. The wrong-crown projection is 20 px above the mask top. The glasses frame
      touches both eyes in `#3b2a1e`; the eye paint `#6e4020` is more than 24 Chebyshev away. The
      close-colour case uses `#6e4020` as the mark. Lily hair is `#7a5230` at the chin, side chin, or
      eye window. The missing-hair CLI case runs a copied script in `/tmp/opencode` with copied Mom
      outputs.
    - Panel fixtures: each temporary `--root` tree holds two 256 × 256 alpha renders per asset,
      800 × 1600 drawings, one 1600 × 1600 Grandma drawing, and one measure record per asset. The
      Grandma render plants a bun 16 source px above the crown, which is 56 output px. Destination
      cases plant links, a directory, and an outside target, then hash the tree.
    - Commands and results:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts'
      # exit 1: both new files fail inside their named cases
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/cast-isolation.test.ts'
      # exit 0: the isolation regression passes
      node_modules/.bin/prettier --check tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts
      # exit 0: all matched files use Prettier code style
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
      # exit 0: the existing Mom pin still passes
      ```

    - New failing cases in `tests/proportion-cast-options.test.ts`:

      | Case                                                                            | Red failure at `c562992b`                                   |
      | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
      | `child base is checked as a file before any import`                             | `--base` is ignored, so Mom exits 0.                        |
      | `invalid base stems fail with unknown base before measurement`                  | `--base` is ignored, so Mom exits 0.                        |
      | `child table is selected and unknown table names are refused`                   | `--table` is ignored, so Mom exits 0 on `kim`.              |
      | `named record path holds the table rows, lit pairs, base and final hashes`      | `--record` is ignored, so the named file is absent.         |
      | `TABLES exports the two ordered spec tables`                                    | `TABLES` is undefined.                                      |
      | `selected table decides 3.00 for child and 3.60 for kim`                        | `checkRows` ignores its table argument and uses `kim`.      |
      | `row limits cannot override the selected table`                                 | `checkRows` accepts the loose row limits.                   |
      | `projected crown drives the head rows and the mask guard is one-sided`          | `measureFigure` is not exported.                            |
      | `measurePixels keeps five figures and measureFigure is the direct fixture seam` | `measureFigure` is not exported.                            |
      | `bun-above-crown passes and wrong-crown fails the named mask guard`             | `measureFigure` is not exported.                            |
      | `glasses-frame excludes the declared mark and rejects a close mark colour`      | `measureFigure` is not exported.                            |
      | `Lily fixtures produce all three named hair guards`                             | `measureFigure` is not exported.                            |
      | `missing variants.hair exits with hair colour not declared`                     | The Lily hair guard is absent, so copied Mom exits 0.       |
      | `record links, directories and outside paths are refused without tree changes`  | `--record` is ignored, so Mom exits 0.                      |
      | `adult base exports the three measured landmark aliases`                        | `BASE_CROWN_Y`, `BASE_CHIN_Y`, and `BASE_HANDS` are absent. |

    - New failing cases in `tests/sprout-cast-panel.test.ts`:
      `writes one 1416 x 900 panel at the exact cast path`;
      `three cells share the 700 px band, row 780 baseline and row 80 crown`;
      `caption changes with the date, row result and crop state`;
      `bun pixels stay above the body band inside the 56 px headroom`;
      `sheet is 1544 x 900 with five figures at one scale and one baseline`;
      `DRAWING_ROWS exports the five fixed drawing pairs`;
      `1600 px drawing crops to 440 px while its head band fits`;
      `a head wider than its cell fails with the named line`;
      `missing render fails with render view not built`;
      `linked and directory destinations are refused without changing the tree`;
      `an outside cast target is never followed`;
      `--asset writes one panel and no sheet`;
      `--sheet writes the sheet and no panel`;
      `--all writes five panels and the sheet`;
      `two mode options fail with the choose-one line`.
      Every case fails inside the case because `scripts/sprout-cast-panel.mjs` is absent. Node reports
      `MODULE_NOT_FOUND`; no file-scope import error occurs.
    - Passing regression: `tests/cast-isolation.test.ts` compares every source SHA-256, the
      `ADULT`, `AGE5`, and `HERO` values, and Mom's preset. The contract loader uses `tsx`, because
      Vitest reformats function source text. Functions use the baseline `fn:<source>` format.
    - Full command output and the final result block:
      `measure/runs/chibi_sprouts_cast_20261125/red-c562992.log`.

  - Red remediation (2026-11-26, role base `3aabca1cb6ae0e35eced8048ad30414db55ba8fd`,
    implementation HEAD `3aabca1cb6ae0e35eced8048ad30414db55ba8fd`):
    - R1: `rawPanel` now destructures Sharp's `{ data, info }` result and returns `data`, `width`,
      `height`, and `channels`. The four pixel cases read real panel pixels.
    - R2: the `glasses-frame` fixture now touches both eyes with the frame. Its eye paint is
      `#6e4020`, more than 24 Chebyshev from the declared `#3b2a1e` mark. The close-colour case still
      uses `#6e4020` as the mark.
    - Commands and exit codes:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-cast-panel.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/cast-isolation.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.validation.test.ts'
      # exit 0
      node_modules/.bin/prettier --check tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts
      # exit 0
      ```

    - No Green finding remains. The corrected tests pass against the implementation at `3aabca1c`.
      The full result block is `measure/runs/chibi_sprouts_cast_20261125/red-3aabca1c.log`.

- [x] T2 Green: Add the options, the tables, the rounded crown, the destinations, the face-mark exclusion, and the panel script. Commits `41458a54a0282af2e062a1ed8a213f71856d7a40`, `3aabca1cb6ae0e35eced8048ad30414db55ba8fd`, and `8b2509512584dd1896fc04908bead332017f024e`.
      Files: `scripts/proportion-check.mjs`, `scripts/sprout-cast-panel.mjs` (new),
      `assets/parts/humanoid-kim.ts` (three aliases).
  - `scripts/proportion-check.mjs`: add `--base <stem>`, `--table <name>`, and `--record <path>`,
    the `TABLES` export of ordered `{ name, lo, hi }` arrays, `checkRows(rows, table = 'kim')` with
    the selected table authoritative and the row-limit check, the rounded `projectedCrownRow` and
    its one-sided mask guard, the destination checks of spec "The destinations", the `castMeta`
    face-mark exclusion and its colour separation, the Lily guards, and the exported `measureFigure`
    seam. The two new fixtures stay in the test and reach `measureFigure` directly; `measurePixels()`
    gains no item. The record gains `base`, `baseSha256`, `glbSha256`, `litFrontSha256`, and
    `litSideSha256`, with the last five hashes taken after the lit render. The name checks and the
    one-line errors are those of the spec. The loading order is unchanged. The default record path
    stays `out/chibi-sprouts/redesign/measure.json`.
  - `scripts/sprout-cast-panel.mjs`: the five panels and the cast sheet of spec AC7, with the
    `DRAWING_ROWS` export, the `--asset`, `--all`, `--sheet`, `--date`, and `--root` options, the
    copied `maskSpan`, `panel`, and `textSvg` conventions, the 56 px headroom, the 466.667 px per
    metre sheet scale, the fixed horizontal crop of spec "The horizontal crop", the exact panel and
    sheet paths, and the destination checks. `--sheet` writes the sheet alone. It imports nothing
    from `scripts/mom-kim-sheet.mjs`.
  - `assets/parts/humanoid-kim.ts` adds `BASE_CROWN_Y = KIM.crown`, `BASE_CHIN_Y = KIM_CHIN_Y`, and
    `BASE_HANDS = KIM_HANDS`. No other line changes.
  - Done-when:
    - `HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts'`
      exits 0.
    - The Mom pin still exits 0:
      `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts`.
      The plan records her eleven rows before and after the change, and every row stays in range.
    - The Mom stable stats projection and her five artifact hashes are unchanged before and after
      the change, with the same build type: `./forge build sprout-mom-kim --fast` on both sides,
      then both level renders, then a SHA-256 sum of the GLB and the four level renders. The raw
      `stats.json` hash is recorded for traceability only and is not compared.
    - `prettier --check` exits 0 on the three changed files.
    - `tsc --noEmit` reports the baseline error count of TD-35 to TD-39 and no error in the changed
      files.
  - Record: the exported symbols, the option names, the before and after Mom rows, the stable stats
    projection, the five artifact hashes, the raw stats hash, and the two test runs.
  - Note: this task changes no renderer option and no existing render path. The two new named views
    already exist from the redesign track.
  - PM decision F5 (2026-11-26, adversarial round 1): the eye-component width limit is 0.60 of the
    head width for both cast tables. Mom's rows are identical under 0.40 and 0.60, so they do not
    move (this task and the round-1 `measurePixels()` probe).

  - Evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `5356e78730daefd5225f9733f190dc6bb631b90d`, role bases
    `ad43039a073d5cf61f5c3ebac787856e9970d7a4` and `ba0b353b9d965e4e94b078da4949311f87ef504f`,
    implementation commits `41458a54a0282af2e062a1ed8a213f71856d7a40`,
    `3aabca1cb6ae0e35eced8048ad30414db55ba8fd`, and `8b2509512584dd1896fc04908bead332017f024e`,
    Green route `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family minimax):

    - Implementation commits `41458a54a0282af2e062a1ed8a213f71856d7a40`,
      `3aabca1cb6ae0e35eced8048ad30414db55ba8fd`, and `8b2509512584dd1896fc04908bead332017f024e`,
      three files: `scripts/proportion-check.mjs`, `scripts/sprout-cast-panel.mjs` (new),
      `assets/parts/humanoid-kim.ts`.
    - Exported symbols of `scripts/proportion-check.mjs`: `TABLES`, `TABLE_NAMES`, `checkRows(rows,
table = 'kim')`, `measureFigure(figure, table = 'kim')`, `palmCheck(side, mesh, landmarks)`,
      `measurePixels()`, and `destinationError(root, dest, treeRel)`. The options are `--asset`,
      `--base <stem>` (default `humanoid-kim`), `--table <name>` (default `kim`), and `--record
<path>` (default `out/chibi-sprouts/redesign/measure.json`).
    - Exported symbols of `scripts/sprout-cast-panel.mjs`: `DRAWING_ROWS` and `NAMES`. The options
      are `--asset <name>`, `--all`, `--sheet`, `--date YYYY-MM-DD`, and `--root <dir>`.
    - The three aliases of `assets/parts/humanoid-kim.ts`: `BASE_CROWN_Y = KIM.crown`,
      `BASE_CHIN_Y = KIM_CHIN_Y`, `BASE_HANDS = KIM_HANDS`. No other line of that file changes.
    - Mom rows before the change (`ad43039a`, script run on the T0 outputs):
      `heightInHeads 3.552657`, `armToTorso 1.328305`, `legShare 0.387632`,
      `headToShoulders 1.233173`, `wrist -0.061303`, `fingertips 0.509578`, `eyeLine 0.636311`,
      `eyeHeight 0.108755`, `spacingHead 0.365741`, `eyeWidthFace 0.229412`,
      `spacingFace 0.464706`. Both palms ok.
    - Mom rows after the change (`41458a54`, same inputs, no rebuild):
      `heightInHeads 3.653929`, `armToTorso 1.328305`, `legShare 0.391841`,
      `headToShoulders 1.233173`, `wrist -0.061303`, `fingertips 0.509578`, `eyeLine 0.621882`,
      `eyeHeight 0.113069`, `spacingHead 0.365741`, `eyeWidthFace 0.229412`,
      `spacingFace 0.464706`. Both palms ok. Every row stays inside the adult table.
    - The five Mom artifact hashes are unchanged by the script change, and the raw `stats.json` hash
      is unchanged for traceability only:

      | Artifact                | SHA-256                                                            |
      | ----------------------- | ------------------------------------------------------------------ |
      | `sprout-mom-kim.glb`    | `6f972378e357035cf94bbbe80af82f7173bde38a0223a61dcc4160e763b4311a` |
      | `flat/front-level.png`  | `0c6201ae1b9f2502cda207561676e58e6744c2a8f50df07e782aba534f07f43b` |
      | `flat/side-level.png`   | `93bea38cdf28b3cd71898cca958918b99637c7cc9c22c1568a31f2f206a3abbf` |
      | `views/front-level.png` | `2abd3f55642c851818552e5025284c42dd7e5b78441c7683b8de02680de5b851` |
      | `views/side-level.png`  | `48fc3c2f3bb7443f8024cccadc438a8a9043fca1c9995eb55a144319cec93212` |

      The raw `stats.json` hash is `de17e20a53fd47dc2a93cdae7324d2e0eaa6c012a2ce1dea4b3b1199f5255bb7`.
      The stable stats projection is the projection of T0, because the build inputs did not change.

    - Commands and results:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts'
      # exit 0: 15 of 15 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-cast-panel.test.ts'
      # exit 1: 11 of 15 cases pass; 4 cases fail on the Red helper, not on the script
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/cast-isolation.test.ts'
      # exit 0: 3 of 3 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
      # exit 0: 29 of 29 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.validation.test.ts'
      # exit 0: 19 of 19 cases pass
      node_modules/.bin/prettier --check scripts/proportion-check.mjs scripts/sprout-cast-panel.mjs assets/parts/humanoid-kim.ts
      # exit 0: all matched files use Prettier code style
      node node_modules/typescript/bin/tsc --noEmit
      # exit 2: 54 errors in 15 files; the five TD-35 groups hold their baseline counts (38 errors)
      # and no error sits in the three changed files
      ```

    - The task is blocked by two Red findings, not by the implementation. The full log is
      `measure/runs/chibi_sprouts_cast_20261125/green-41458a54.log`.
      - **R1 (Red helper, blocker).** `tests/sprout-cast-panel.test.ts:217` reads a panel with
        `return await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });`.
        Sharp returns `{ data, info }`, so `raw.width`, `raw.height`, and `raw.channels` are
        `undefined` in `colourBounds`. Every pixel index is `NaN`, so every colour count is 0 and
        the four pixel cases (`three cells share the 700 px band`, `bun pixels stay above the body
band`, `sheet is 1544 x 900`, `1600 px drawing crops to 440 px`) fail for every possible
        script. The repo convention is `const { data, info } = await sharp(...).toBuffer({
resolveWithObject: true })`, as in `tests/mom-kim-sheet.test.ts:66`. A scratch probe with
        the corrected reader passes all four intended cases against the panels of this commit: the
        three panel cells run from row 80 to row 780, the bun sits in rows 24 to 79, the sheet holds
        five figures at 700 px and 490 px with one baseline at row 780, and the 1600 px drawing
        crops to 440 px with a head band of 392 px.
      - **R2 (Red fixture, blocker for one case).** The `glasses-frame` fixture of
        `tests/proportion-cast-options.test.ts:240` draws the frame from `col(-0.13 / 2 + eyeHalf)
        - 1`to`col(0.13 / 2 - eyeHalf) - 1`, which leaves a one-pixel gap at columns 492 and 532
between the frame and each eye. The frame therefore does not join the eyes, and the
undeclared case cannot report `eye components: found 1`. The fixture also draws the eyes
in `#241812`, which is 23 in Chebyshev distance from the declared `#3b2a1e`, so the 24-pixel
          exclusion of spec "The asset metadata and the eye mask" removes the eyes as well. The
          implementation reaches the behaviour the spec describes with three documented changes: the
          exclusion uses the Euclidean distance, the component search runs on a one-pixel dilated
          mask, and the eye-width limit is 0.6 of the head width instead of 0.4. The measured eye
          width still comes from the undilated pixels, so the Mom rows do not move. The case passes
          with those changes.
    - The panel cells and the sheet cells use a nearest-neighbour mapping, not `sharp.extract` plus
      `resize({ height, fit: 'fill' })`. The mapping puts the source crown row on the panel row 80
      and the source sole row on the baseline, so the three cells share one baseline to the pixel.
      A literal `sharp.extract` takes a negative top on Dad's crown row 80, which sits above 8 % of
      the band, and throws; the mean difference to the extract-plus-resize path is 1.6 of 255.
    - The eye-width limit of the eye-component filter is 0.6 of the head width, not 0.4. A blob
      that joins the two eyes is then one eye component, so an undeclared face mark fails the run
      with the named error of the spec instead of vanishing from the count. The measured rows do not
      move, because the eye width comes from the eye blobs alone.
    - The T2 gate is met after the Red repair of R1 and R2. The Green re-run of 2026-11-26 records
      the following. The role base of that round is
      `ba0b353b9d965e4e94b078da4949311f87ef504f`, the repaired Red commit. The full result block is
      `measure/runs/chibi_sprouts_cast_20261125/green-8b250951.log`.
      - The repaired fixture holds the spec rules on its own, so the implementation gives back the
        two changes it made for the broken fixture. Commit
        `8b2509512584dd1896fc04908bead332017f024e` restores the Chebyshev distance of 24 for the
        face-mark exclusion and the plain eye-mask component search, with no dilation. One change
        stays: the eye-width limit is 0.6 of the head width instead of 0.4, so a blob that joins
        the two eyes counts as one eye component and an undeclared face mark fails the run with the
        named error `eye components: found 1, expected 2` of the spec.
      - The commands and their exit codes:

        ```bash
        HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts tests/sprout-mom-kim.test.ts tests/sprout-mom-kim.validation.test.ts'
        # exit 0: 81 of 81 cases pass over 5 files
        HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts'
        # exit 0: 15 of 15 cases pass
        HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-cast-panel.test.ts'
        # exit 0: 15 of 15 cases pass
        HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/cast-isolation.test.ts'
        # exit 0: 3 of 3 cases pass
        HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
        # exit 0: 29 of 29 cases pass
        HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.validation.test.ts'
        # exit 0: 19 of 19 cases pass
        node_modules/.bin/prettier --check scripts/proportion-check.mjs scripts/sprout-cast-panel.mjs assets/parts/humanoid-kim.ts measure/tracks/chibi_sprouts_cast_20261125/plan.md
        # exit 0: all matched files use Prettier code style
        node node_modules/typescript/bin/tsc --noEmit
        # exit 2: 54 errors in 15 files; the five TD-35 groups hold their baseline counts (38 errors)
        # and no error sits in the three changed files
        ```

      - Mom's eleven rows after the re-run are the rows of the first Green round: `heightInHeads
3.653929`, `armToTorso 1.328305`, `legShare 0.391841`, `headToShoulders 1.233173`, `wrist
-0.061303`, `fingertips 0.509578`, `eyeLine 0.621882`, `eyeHeight 0.113069`, `spacingHead
0.365741`, `eyeWidthFace 0.229412`, `spacingFace 0.464706`. Both palms ok. The five artifact
        hashes and the raw stats hash are unchanged.
      - The `mom-kim-sheet` tests read `out/storytime-review/muse-cast/teacher-kim-sheet.png`, which
        this worktree does not hold. They fail on that missing file before and after the change, and
        they are not a Phase 1 gate.

  - Remediation after the adversarial round 1 (2026-11-26, role base
    `ba0b353b9d965e4e94b078da4949311f87ef504f`, Red fix commit
    `622a0fa5af8a19a0646b18cc8d7ae75ce7b1901d`, the Red cases of F1, F2, F3, F4, F6, F8, F9, F10,
    and F11):
    - The finding-to-fix map:

      | Finding | The fix in the two scripts                                                                                                                                                                                                                                                                                                                                    |
      | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
      | F1      | `scripts/sprout-cast-panel.mjs` holds `DRAWING_CHINS`, the chin row of each drawing from `docs/chibi-sprouts/redesign-2026-11-23.md`. The head band of a drawing runs from its crown row to its chin row. The drawing mask drops the stray ink of a scanned page, the window is centred on the head axis, and the five committed drawings write their panels. |
      | F2      | The Lily side-chin guard reads the colour of the frontmost pixel of the alpha-128 side mask at any alpha, and the guard fires unless that pixel is skin.                                                                                                                                                                                                      |
      | F3      | The cast sheet applies the head-fit rule and the figure-top rule to every sheet cell, and every sheet cell prints and captions its crop state.                                                                                                                                                                                                                |
      | F4      | The face-mark exclusion drops the mark's own region, the pixels of the declared colour and the one-pixel blend edge around them. The eye blobs of the mask without that region stay in the eye mask, so a painted iris that sits close to the mark colour in the palette still reads as an eye.                                                               |
      | F6      | Both scripts accept only their known options, each with its own value. An unknown argument, a repeated option, or a missing value is refused with one named line before any read or write.                                                                                                                                                                    |
      | F8      | Every record, render, and drawing of every target is read before the first write, and every PNG is written by a temporary file and a rename.                                                                                                                                                                                                                  |
      | F9      | A record must hold the eleven table rows in table order plus `rows.lit`, or the run exits 1 with `record <name>: rows incomplete`. The caption prints `/11`.                                                                                                                                                                                                  |
      | F10     | The destination walk catches `ENOTDIR` and names the parent that is a regular file.                                                                                                                                                                                                                                                                           |
      | F11     | The destination walk refuses a file with more than one name, so a hard link is refused as `destination is a link`.                                                                                                                                                                                                                                            |

    - F5 and F12 are the PM decisions of commit `9fee6e88`. The eye-component width limit stays at
      0.60 of the head width, which the spec of that commit records in "The eye-component width
      limit", and the cell scale stays the clamped nearest-neighbour sampling, which the same commit
      records in decision (m) and in "The look judge and the panels".
    - The commands and their exit codes:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts tests/sprout-mom-kim.test.ts tests/sprout-mom-kim.validation.test.ts'
      # exit 0: 96 of 96 cases pass over 5 files
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts'
      # exit 0: 21 of 21 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-cast-panel.test.ts'
      # exit 0: 24 of 24 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/cast-isolation.test.ts'
      # exit 0: 3 of 3 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
      # exit 0: 29 of 29 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.validation.test.ts'
      # exit 0: 19 of 19 cases pass
      node_modules/.bin/prettier --check scripts/proportion-check.mjs scripts/sprout-cast-panel.mjs assets/parts/humanoid-kim.ts measure/tracks/chibi_sprouts_cast_20261125/plan.md
      # exit 0: all matched files use Prettier code style
      node node_modules/typescript/bin/tsc --noEmit
      # exit 2: 54 errors in 15 files; the five TD-35 groups hold their baseline counts (38 errors)
      # and no error sits in the three changed files
      ```

    - Mom's eleven rows and her five artifact hashes are unchanged by the remediation. The rows are
      the rows of the first Green round, and the hashes are the hashes of T0.
    - Two Red findings stay open for the next round, because the Red pin and the adversarial
      finding ask for opposite results:
      - **F4 (the Red pin against the finding).** The Red case `F4 base iris paint survives the spec
example glasses mark` requires the run to pass with the declared `#3b2a1e` mark and the base
        iris paint `#4a2e18`. The finding asks the guard to compare the mark with the rendered iris
        colour, which would fail that run with `faceMarks glasses: too close to the eye paint`. The
        implementation keeps the iris in the eye mask and leaves the guard as the spec of "The asset
        metadata and the eye mask" writes it, so the Red case passes.
      - **F12 (the plan reason).** The plan reason of the nearest-neighbour sampling was wrong, as
        the finding shows. The correct reason is in decision (m) of the PM decision of commit
        `9fee6e88`: a literal `sharp.extract` takes a negative top on Dad's crown row 80.

  - Remediation after the adversarial round 2 (2026-11-26, role base
    `154ebc4749c90239898d67275a86ed98efdc2a13`, the Red commit of round 2, implementation commit
    `a3040c95e11610f9f0c70f73ceedd82b1dfbeefc`):
    - The finding-to-fix map:

      | Finding | The fix in `scripts/sprout-cast-panel.mjs`                                                                                                                                                                                                                                                                            |
      | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
      | F3      | The cast sheet compares the head width with its own cell limit, `SHEET_CELL_W - 16` = 264 px, and no longer with the panel limit of 424 px. The crop state line of the caption uses the short names of the five cast members, so the fifth cell stays inside the sheet width. Every sheet cell prints its crop state. |
      | F7      | The head is the widest mask run of the head band, and no longer the median row width. A cell is cropped when a mask pixel falls outside the window, so an off-axis arm tip reads as cropped.                                                                                                                          |
      | F18     | The temporary file of the atomic write lives in a fresh folder inside the checked cast folder, and it is opened with the exclusive flag. A planted symlink at a guessed name is never followed and never overwritten.                                                                                                 |
      | F19     | A record without a chin row is refused by name with `record <name>: no chin row`.                                                                                                                                                                                                                                     |
      | F6      | An empty option value is refused with one named line, as an unknown argument and a repeated option are.                                                                                                                                                                                                               |

    - The paper of a scanned drawing is now the per-channel median of the border pixels, and a
      pixel within 24 (Chebyshev) of that colour is paper. The blend pixels around a figure leave
      the ink mask, so the widest run of the head band stays the head of the drawing.
    - The commands and their exit codes:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts tests/sprout-mom-kim.test.ts tests/sprout-mom-kim.validation.test.ts'
      # exit 1: 96 of 102 cases pass. The six failures are the sheet cases, and every one of them
      # has the same cause: the sheet fixture head of Dad is 339.5 px wide, and the sheet cell
      # limit is 264 px.
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts'
      # exit 0: 21 of 21 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-cast-panel.test.ts'
      # exit 1: 24 of 30 cases pass. The six failures are the sheet cases named below.
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/cast-isolation.test.ts'
      # exit 0: 3 of 3 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
      # exit 0: 29 of 29 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.validation.test.ts'
      # exit 0: 19 of 19 cases pass
      node_modules/.bin/prettier --check scripts/proportion-check.mjs scripts/sprout-cast-panel.mjs
      # exit 0: all matched files use Prettier code style
      node scripts/sprout-cast-panel.mjs --asset <name> --date 2026-11-26 --root <a /tmp/opencode root>
      # exit 0 for each of the five cast members: the five committed drawings write their panels
      ```

    - Mom's eleven rows and her six artifact hashes are unchanged by this remediation. The rows are
      the rows of the first Green round, and the hashes are the hashes of T0.
    - **One Red finding stays open, and it needs the PM.** The Red pin of round 2 and the spec
      "The horizontal crop" rule 2 ask for opposite results for the cast sheet fixture.
      - The spec rule 2: the widest mask run of the head band, scaled, must be at most
        `cellWidth - 16` px. The sheet cell is 280 px wide, so the sheet limit is 264 px.
      - The sheet fixture of `tests/sprout-cast-panel.test.ts` draws every lit front render as one
        rectangle from x 80 to x 176. The head band of that rectangle is 97 source px wide, and the
        sheet scale of the adult fixture is 3.5, so the head of Dad is 339.5 px wide. The head of
        the sheet fixture does not fit the 264 px limit, so the sheet refuses the fixture.
      - The six failing cases are `sheet is 1544 x 900 with five figures at one scale and one
baseline`, `F3 sheet refuses a head wider than its 280 px cell`, `F3 sheet caption includes
the fifth cell crop state inside the sheet width`, `F3 sheet prints and captions cropped
state for every cell`, `--sheet writes the sheet and no panel`, and `--all writes five
panels and the sheet`. The second case expects the refusal to name `sprout-tom-kim`, and
        the script names `sprout-dad-kim` first, because the head of Dad is already too wide.
      - The new case `F3 sheet uses the 264 px head-fit limit` passes. Its fixture draws a head of
        100 source px, which is 350 px at the sheet scale, and the sheet refuses it by name.
      - The only threshold that accepts the sheet fixture and refuses the 350 px head is a limit
        between 339.5 px and 350 px. No rule of the spec states such a limit, so the implementation
        keeps the 264 px limit of the spec and the adversarial finding.
      - A probe with the same fixtures and a head of 37 source px, which is 129.5 px wide, shows
        that the sheet then writes: the caption ends at column 584 of 1544, the caption bytes
        change when the crop state of Lily changes, the sheet refuses the wide head of Tom by
        name, and the sheet refuses the 350 px head of Dad by name.
      - The repair belongs to Red, because Red owns the test files. The repair is one line: the
        sheet fixture draws the lit front renders with a head of at most 75 source px, which is
        264 px at the sheet scale. The panel cell is 440 px wide, so the panel cases of the same
        fixture stay valid.
      - The PM may instead amend the spec, so that the sheet limit accepts a head of 339.5 px and
        refuses a head of 350 px. Green does not choose that limit without the amendment.

- [x] T3 Measure: One adversarial round on the two scripts.
  - It reads the T2 commit and attacks the table selection, the row-limit rule, the base name, the
    record and panel destinations, the crown rounding and mask tolerance, the face-mark exclusion,
    the Lily guards, the panel scale and headroom, the horizontal crop and the head-fit rule, the
    sheet-only route, and the linked output. Report-only. It changes no file.
  - Done-when: the round writes
    `measure/runs/chibi_sprouts_cast_20261125/adversarial-p1-<sha>.json` with one finding per fault,
    a severity per finding, and a verdict. It names the audited commit.
  - Record: the audited commit, the findings, the severity of each, and the dispositions.
  - Red fix pins (2026-11-26, role base `9adcc72e79e2184eaa391c39bf1d1dc7b95ba980`):
    - F1: `F1 all five committed drawings produce panels` fails for Grandma, Grandpa, and Lily with
      `figure wider than its cell`. `F1 noisy JPEG uses the fixed chin, drops stray ink, and centres
on the head` fails with the same line. The fixture uses the committed crown, chin, and sole rows
      from `docs/chibi-sprouts/redesign-2026-11-23.md`.
    - F2: `F2 Lily side chin rejects antialiased hair at alpha 200 and 128` and `F2 Lily side chin
requires skin at the frontmost mask pixel` both miss the named guard.
    - F3: `F3 sheet refuses a head wider than its 280 px cell` gets exit 0. `F3 sheet prints and
captions cropped state for every cell` gets no per-cell crop line and no caption change.
    - F4: `F4 base iris paint survives the spec example glasses mark` fails with
      `eye components: found 0, expected 2`.
    - F6: `F6 equals-form and unknown options fail before any write` and `F6 unknown panel options
fail before any write` both exit 0 and write output.
    - F8: `F8 --all validates every input before writing any panel` overwrites the existing Dad panel
      before the missing Grandpa record stops the run.
    - F9: `F9 a record with no rows is refused and writes no panel` exits 0 and writes a panel.
    - F10: `F10 record destination reports a regular-file parent without throwing` throws `ENOTDIR`.
      `F10 a regular-file parent gives a named line without a stack trace` prints the raw `ENOTDIR`
      line.
    - F11: `F11 record destination refuses a hard link` returns null. `F11 a hard-linked panel
destination is refused without changing its target` exits 0 and overwrites the target.
    - Commands and exit codes:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts'
      # exit 1: the new F2, F4, F6, F10, and F11 cases fail for the named reasons
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-cast-panel.test.ts'
      # exit 1: the new F1, F3, F6, F8, F9, F10, and F11 cases fail for the named reasons
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/cast-isolation.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.validation.test.ts'
      # exit 0
      node_modules/.bin/prettier --check tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts
      # exit 0
      ```

    - F5 and F12 to F17 stay skipped for the spec owner. This role does not stage the adversarial
      JSON or log. The full result block is `measure/runs/chibi_sprouts_cast_20261125/red-9adcc72e.log`.
  - Green remediation (2026-11-26, role base
    `ba0b353b9d965e4e94b078da4949311f87ef504f`): the finding-to-fix map, the exit codes, and the
    two open Red findings are in the T2 notes above. F5 and F12 are the PM decisions of commit
    `9fee6e88`. F4 and F12 stay open for the next round, because the Red pin and the adversarial
    finding ask for opposite results.
  - Green remediation after the adversarial round 2 (2026-11-26, role base
    `154ebc4749c90239898d67275a86ed98efdc2a13`, implementation commit
    `a3040c95e11610f9f0c70f73ceedd82b1dfbeefc`): the finding-to-fix map of F3, F7, F18, F19, and
    F6, the exit codes, and the open Red finding are in the T2 notes above. F18, F19, and F7 are
    closed. F3 is closed in the script, and the sheet fixture of the Red pin does not fit the
    264 px sheet limit of the spec, so the six sheet cases fail until Red repairs the fixture. The
    PM owns the choice between the Red repair and a spec amendment.
  - Adversarial round 2 (2026-11-26, audited commit `70ebbfbe05ea910e3893154f2e66caabf22073ec`,
    verdict `fail`). The result block is
    `measure/runs/chibi_sprouts_cast_20261125/adversarial-70ebbfb.json` and its log.
    - F1, F2, F8, F9, F10, and F11 are closed on real input. F6 is closed except for an empty
      option value.
    - F3 stays open as a Blocker. The sheet caption clips the crop state of the fifth cell, and the
      sheet head-fit tests the 424 px panel limit on a 280 px cell.
    - PM decision F4 (2026-11-26): the code reading is the contract. Rule 3 of "The asset metadata
      and the eye mask" now writes the guard as the exact declared colour plus a 1 px edge. The
      guard keeps any other pixel that sits in an eye-shaped blob. A cast asset must paint its mark
      with exactly the declared hex, and a mark painted off the declared hex is not excluded. The
      same commit writes the same rule in this plan and in the test strategy.
    - New findings: F18 (Major, the temp file of the atomic write), F7 (Major, the head-fit reads
      the median row width), F19 and F20 (Nit). F13 to F17 are carried.
    - T3 stays `[~]`. Phase 2 waits for the close of F3, F18, and F7 and for a passing round.
  - Red fix pins after adversarial round 2 (2026-11-26, role base
    `70ebbfbe05ea910e3893154f2e66caabf22073ec`):
    - F3: `F3 sheet caption includes the fifth cell crop state inside the sheet width` leaves the
      caption bytes unchanged when only Lily's crop state changes. `F3 sheet uses the 264 px head-fit
limit` gets exit 0 for a 350 px head.
    - F7: `F7 head-fit uses the widest run rather than the median row` gets exit 0 for the 472 px
      widest row. `F7 crop state reads yes when an off-axis arm tip is cut` prints `cropped: no`.
    - F18: `F18 a planted temp-path symlink never overwrites the outside target` overwrites the
      outside target through the predictable temporary name.
    - F19: `F19 a record without chinRow is refused by name` gets exit 0 and writes a panel.
    - Commands and exit codes:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-cast-panel.test.ts'
      # exit 1: the new F3, F7, F18, and F19 cases fail for the named reasons
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/cast-isolation.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.validation.test.ts'
      # exit 0
      node_modules/.bin/prettier --check tests/sprout-cast-panel.test.ts tests/proportion-cast-options.test.ts tests/cast-isolation.test.ts
      # exit 0
      ```

    - The full result block is `measure/runs/chibi_sprouts_cast_20261125/red-70ebbfb.log`.
  - Sheet fixture repair (2026-11-26, PM Option A, role base
    `62258e9ee684e887724a6b5ad72e85bc8c94dbed`): the spec keeps the 264 px sheet head-fit limit.
    - The default lit render now spans x 90 to x 164, a 75 source px head. At the adult sheet scale,
      the head is 262.5 px, inside the 264 px limit. The panel limit stays 424 px.
    - The refusal fixtures stay separate: the 100 source px head is 350 px at the sheet scale, and
      the 236 source px Tom head stays above both limits.
    - The crop-state caption case uses a 40 source px head with a wide or narrow body. It changes the
      crop state without breaking the sheet head-fit rule.
    - Commands and exit codes:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-cast-panel.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/cast-isolation.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.validation.test.ts'
      # exit 0
      node_modules/.bin/prettier --check tests/sprout-cast-panel.test.ts tests/proportion-cast-options.test.ts tests/cast-isolation.test.ts
      # exit 0
      ```

    - No Green finding remains in these cases. The full result block is
      `measure/runs/chibi_sprouts_cast_20261125/red-62258e9.log`.
  - Type correction after phase acceptance F2 (2026-11-26, role base
    `ede60f0812c31584037b337485b203ae11b8edb8`): `rowsFor` now takes `TableRow[]`, where
    `TableRow = Omit<Row, 'value'>`. No assertion changes.
    - `tsc --noEmit` exits 2 with 51 existing diagnostics and no diagnostic in
      `tests/proportion-cast-options.test.ts`.
    - The five Phase 1 test files and `prettier --check` each exit 0.
    - The full result block is `measure/runs/chibi_sprouts_cast_20261125/red-ede60f08.log`.

  - T3 record (2026-11-26). The audited scripts are `scripts/proportion-check.mjs` and
    `scripts/sprout-cast-panel.mjs`. Three rounds ran. The JSON and the log of each round are in
    `measure/runs/chibi_sprouts_cast_20261125/`.
    - Round 1: `adversarial-9adcc72e.json`, audited commit
      `9adcc72e79e2184eaa391c39bf1d1dc7b95ba980`, verdict `fail`, with Blockers F1, F2, and F3.
      The round also raised F4 to F17.
    - Round 2: `adversarial-70ebbfb.json`, audited commit
      `70ebbfbe05ea910e3893154f2e66caabf22073ec`, verdict `fail`, with Blocker F3 and the new
      findings F18, F19, and F20.
    - Round 3: `adversarial-9af8f65.json`, audited commit
      `9af8f652f99ea0e0e872806e1cf0f65660d1e774`, verdict `pass`, no Blocker.
    - Round 3 closed F3, F7, F18, F19, and the empty option value of F6 on real input. F1, F2, and
      F8 to F11 did not regress. The evidence: 102 of 102 cases pass, the five real drawings write
      five panels and the sheet, Mom's eleven rows and her five artifact hashes did not move, and
      Prettier exits 0.
  - The Red commits are `ad43039a`, `ba0b353b`, `622a0fa5`, `154ebc47`, and `766c2655`. The Green
    commits are `41458a54`, `3aabca1c`, `8b250951`, `77fad41f`, and `a3040c95`. The commit
    `9af8f652` records the Red fixture repair of `766c2655`.
  - The PM decisions:
    - F4 (commit `5c93345f`) makes the code reading the contract of the face-mark exclusion.
    - F5 and F12 (commit `9fee6e88`) keep the eye-component width limit at 0.60 of the head width
      and the clamped nearest-neighbour sampling.
    - Option A (`766c2655`, T3 note) keeps the 264 px sheet head-fit limit of the spec and fits the
      Red sheet fixture to it.
  - The nine late findings F13 to F17, F20, F21, F22, and F23 are not closed in Phase 1. They are
    the rows TD-57 to TD-65 of `measure/tech-debt.md`, and their fix is out of scope for this phase.
  - T3 is `[x]`. T4 is `[x]` after the Phase 1 gate of 2026-11-26.

- [x] T4 Measure: The Phase 1 gate.
  - Done-when:
    - the tool tests exit 0,
    - the Mom pin exits 0 with every row in range, the stable stats projection unchanged, and the
      five artifact hashes unchanged,
    - `tests/cast-isolation.test.ts` exits 0 against the T0 baseline,
    - the adversarial verdict is `pass`, every blocking finding is `closed`, and a new round ran
      after the last blocking finding,
    - `./measure/generate.sh` exits 0 and `./measure/doctor.sh --structural-only` exits 0,
    - the plan holds the adversarial verdict, every disposition, and the Mom row, stats, and hash
      record.
  - Record: the commands, the row and hash record, the verdict, and the dispositions.
  - Note: a `fail` verdict, or one open blocking finding, stops the gate. Phase 2 does not start.
    `tests/sprout-child-base.test.ts` does not exist yet; it arrives at T11.

  - Record (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `5356e78730daefd5225f9733f190dc6bb631b90d`):
    - Phase acceptance is `pass` at `54e7b15f05bbdb1187cc95c2f89b73e9a5826f07` with no blocking
      finding. The records are `phase-acceptance-p1-54e7b15.json` and
      `phase-acceptance-p1-54e7b15.log`. The earlier run at `ede60f08` was `fail` on acceptance F2,
      three TypeScript errors in `tests/proportion-cast-options.test.ts`. Red closed acceptance F2
      in `42f40ba7`.
    - The adversarial verdict is `pass` at `54e7b15f`, record `adversarial-54e7b15.json`. Earlier
      rounds: `adversarial-ede60f0.json` (`pass`, audit `ede60f08`) and `adversarial-9af8f65.json`
      (`pass`, audit `9af8f652`). Rounds 1 and 2 were `fail`. Every blocking finding of both is
      closed.
    - Red commits: `ad43039a073d5cf61f5c3ebac787856e9970d7a4`,
      `ba0b353b9d965e4e94b078da4949311f87ef504f`, `622a0fa5af8a19a0646b18cc8d7ae75ce7b1901d`,
      `154ebc4749c90239898d67275a86ed98efdc2a13`, `766c2655333202264ebb3e8d3529d50a993f8627`,
      `9af8f652f99ea0e0e872806e1cf0f65660d1e774`, and `42f40ba798f90794ca29cd4610fa5aafe8468b5d`
      (the type annotation only).
    - Green commits: `41458a54a0282af2e062a1ed8a213f71856d7a40`,
      `3aabca1cb6ae0e35eced8048ad30414db55ba8fd`, `8b2509512584dd1896fc04908bead332017f024e`,
      `77fad41f80da3aa6d77be879bb1461116766275c`, and `a3040c95e11610f9f0c70f73ceedd82b1dfbeefc`.
    - Commands and exit codes:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts tests/sprout-mom-kim.test.ts tests/sprout-mom-kim.validation.test.ts'
      # exit 0: 102 of 102 cases pass
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit'
      # exit 2: 51 baseline diagnostics; none in a changed file
      node_modules/.bin/prettier --check scripts/proportion-check.mjs scripts/sprout-cast-panel.mjs assets/parts/humanoid-kim.ts tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts tests/fixtures/cast-baseline.json
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/sprout-cast-panel.mjs --all --date 2026-11-26 --root /tmp/opencode/sprouts-cast-acceptance-z5529yfd'
      # exit 0: five panels of 1416 x 900 and the 1544 x 900 sheet
      ./measure/generate.sh --check
      # exit 0
      ./measure/doctor.sh --structural-only
      # exit 1: the two declared environment limits of TD-43; both links predate the phase
      ```

    - Mom's eleven rows match T2: `heightInHeads 3.653929`, `armToTorso 1.328305`,
      `legShare 0.391841`, `headToShoulders 1.233173`, `wrist -0.061303`, `fingertips 0.509578`,
      `eyeLine 0.621882`, `eyeHeight 0.113069`, `spacingHead 0.365741`,
      `eyeWidthFace 0.229412`, `spacingFace 0.464706`. Both palms are ok. Every row is in range.
    - Mom's five artifact hashes match T0: GLB
      `6f972378e357035cf94bbbe80af82f7173bde38a0223a61dcc4160e763b4311a`, flat front
      `0c6201ae1b9f2502cda207561676e58e6744c2a8f50df07e782aba534f07f43b`, flat side
      `93bea38cdf28b3cd71898cca958918b99637c7cc9c22c1568a31f2f206a3abbf`, lit front
      `2abd3f55642c851818552e5025284c42dd7e5b78441c7683b8de02680de5b851`, lit side
      `48fc3c2f3bb7443f8024cccadc438a8a9043fca1c9995eb55a144319cec93212`. The stable stats
      projection is `c93209cc3d9095c8376c96308ad5bb92e1dedacf0a7a1644bc77fa5c6aa95a6e`. The raw
      stats hash is `de17e20a53fd47dc2a93cdae7324d2e0eaa6c012a2ce1dea4b3b1199f5255bb7`, for
      traceability only.
    - Dispositions: adversarial F1, F2, and F3 are closed. Adversarial F4, F5, and F12 are closed by
      the PM decisions `5c93345f` and `9fee6e88`. F6 to F11 and F18, F19 are closed in the Green
      commits. Acceptance F2 is closed in `42f40ba7`. The late findings F13 to F17 and F20 to F23 are
      TD-57 to TD-65, and their fix is out of scope for this phase. The doctor links are TD-43
      environment limits.

## Phase 2: The adult variants

- [x] T5 Red: Pin Dad, Grandma, and Grandpa. Commits `2d5808a79b9dfbdeceafe2cafc566bab5275abb6` and `d519ae1fcb4ee305813f0fe04ba5c8bc54b2c957`.
      Files: `tests/sprout-dad-kim.test.ts`, `tests/sprout-grandma-kim.test.ts`,
      `tests/sprout-grandpa-kim.test.ts` (all new).
  - Each file runs `--asset <name> --table kim --record out/chibi-sprouts/cast/<name>-measure.json`
    on the build and renders that the Green task wrote. It requires exit 0, `Object.keys(record.rows)`
    equal to the eleven table names plus `lit`, each value inside `TABLES.kim`, each row limit equal
    to the table, both palms ok, and the record path.
  - The Grandma file also requires `GUARD top on mask` to be absent with a bun above the crown, and
    the record's `detail.crownRow` (the mask top) to be above `detail.projectedCrownRow`.
  - The Grandpa file also requires two eye components and the declared `castMeta.faceMarks.glasses`
    in the record.
  - Done-when: each file exits 1 inside its case on the absent asset, with no collection error.
    `prettier --check` exits 0 on the three files.
  - Record: the case names and the failure text.

  - Red evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `b48c3df3235d69337aecc90da7db6cd178455eed`, role base
    `b48c3df3235d69337aecc90da7db6cd178455eed`):
    - The pins cover the exact Kim table, the record rows and palms, the 1.500 m adult landmarks,
      the 17-bone and `idle` inventory, the base bodies, the face layer, and the preset pin.
    - Dad's pin covers the black swept hair and the jaw, brow, smile, plaid, tee, jeans, and boots.
    - Grandma's pin covers the white bun above the projected crown in both flat views.
    - Grandpa's pin covers the bald crown, white side hair, glasses declaration, and moustache paint.
    - Every pin compares the adult base and every existing preset value with the phase base.
    - Command and result:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-dad-kim.test.ts tests/sprout-grandma-kim.test.ts tests/sprout-grandpa-kim.test.ts'
      # exit 1: every case fails inside its case on the absent adult asset
      ```

    - Failing cases and exact causes:

      | File                               | Case                                                                             | Red failure                                                                                                                                        |
      | ---------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
      | `tests/sprout-dad-kim.test.ts`     | `measures eleven Kim rows, both palms, and the black swept hair`                 | `asset sprout-dad-kim: not built`; `missing: assets/sprout-dad-kim.ts`; expected exit 0, received 1.                                               |
      | `tests/sprout-dad-kim.test.ts`     | `keeps the adult base, absolute landmarks, face layer, and built inventory`      | `asset sprout-dad-kim: not built: /home/daniebo/Desktop/forge-worktrees/sprouts-cast/assets/sprout-dad-kim.ts`; expected `true`, received `false`. |
      | `tests/sprout-dad-kim.test.ts`     | `pins the Dad identity, castMeta, and preset without moving existing values`     | `asset sprout-dad-kim: not built`; expected `true`, received `false`.                                                                              |
      | `tests/sprout-grandma-kim.test.ts` | `measures eleven Kim rows, both palms, and the high white bun`                   | `asset sprout-grandma-kim: not built`; `missing: assets/sprout-grandma-kim.ts`; expected exit 0, received 1.                                       |
      | `tests/sprout-grandma-kim.test.ts` | `keeps the adult base, absolute landmarks, face layer, and built inventory`      | `asset sprout-grandma-kim: not built`; expected `true`, received `false`.                                                                          |
      | `tests/sprout-grandma-kim.test.ts` | `pins the Grandma identity, castMeta, and preset without moving existing values` | `asset sprout-grandma-kim: not built`; expected `true`, received `false`.                                                                          |
      | `tests/sprout-grandpa-kim.test.ts` | `measures eleven Kim rows, both palms, glasses, moustache, and side hair`        | `asset sprout-grandpa-kim: not built`; `missing: assets/sprout-grandpa-kim.ts`; expected exit 0, received 1.                                       |
      | `tests/sprout-grandpa-kim.test.ts` | `keeps the adult base, absolute landmarks, face layer, and built inventory`      | `asset sprout-grandpa-kim: not built`; expected `true`, received `false`.                                                                          |
      | `tests/sprout-grandpa-kim.test.ts` | `pins the Grandpa identity, castMeta, and preset without moving existing values` | `asset sprout-grandpa-kim: not built`; expected `true`, received `false`.                                                                          |

    - No collection, syntax, or module-import error occurs. Each dynamic asset load checks the file
      inside the case before import.
    - `node_modules/.bin/prettier --check tests/sprout-dad-kim.test.ts tests/sprout-grandma-kim.test.ts tests/sprout-grandpa-kim.test.ts`
      exits 0.
    - `node node_modules/typescript/bin/tsc --noEmit --pretty false` exits 2 with 51 existing
      diagnostics. None sits in the three new files.
    - The Phase 1 tools, isolation baseline, Mom pin, and Mom validation command exits 0.
    - Result block: `measure/runs/chibi_sprouts_cast_20261125/red-b48c3df3.log`.

  - Red repair (2026-11-26, role base `2d5808a79b9dfbdeceafe2cafc566bab5275abb6`):
    - The three pins now compare every joint element with `toBeCloseTo(..., 6)`.
    - This accepts the immutable base value `KIM.chin + 0.09 = 1.1780000000000002`.
    - No other assertion changed. The built-joint checks use the same six-digit tolerance.
    - The adult command exits 0 with Green's uncommitted assets and preset pin in the worktree.
    - The Phase 1 tools, isolation baseline, Mom pin, and Mom validation command exits 0.
    - Prettier exits 0 on the three test files.
    - `tsc --noEmit` exits 2 with 51 existing diagnostics and none in the three test files.
    - No adult case remains failing. The result block is
      `measure/runs/chibi_sprouts_cast_20261125/red-2d5808a7.log`.

- [x] T6 Green: Dad. File: `assets/sprout-dad-kim.ts` (new). Commits `bae2072671011b3115fa54d29ea81e62eddaeec6` and `3cd8582a1cd6a5d0c5a154e84d87f2d7fb29de98`.
  - Look remediation round 2 (2026-11-26): the look judge gave identity 7.0 and proportion 8.2 in round 1.
  - Build the identity of the spec: black swept-back hair, square jaw, thick brows, open smile, a
    red-and-black plaid shirt over a white tee, dark blue jeans, and brown boots. Import `buildKim`
    and `KIM`. Add the face layer that recreates the two eyes, the jaw and brow body, and the mouth
    and brow paint of spec "The face layer and the paint". Declare `variants`, one preset `dad`, and
    the `castMeta` export (no marks).
  - Shape loop: build and run the lit level render, read it with `read`, write the three largest
    differences, fix the largest first.
  - Done-when:
    - `./forge build sprout-dad-kim --fast` exits 0 and writes the GLB and `stats.json`,
    - the flat and lit level renders exit 0 (spec "Build and render sequence"),
    - `tests/sprout-dad-kim.test.ts` exits 0 with the eleven rows of `TABLES.kim`, row limits equal
      to the table, and both palms ok,
    - `./forge check sprout-dad-kim` ends `result ok` (the check needs no sprite and no `./forge all`),
    - `scripts/sprout-cast-panel.mjs --asset sprout-dad-kim` writes the 1416 × 900 panel,
    - `scripts/make-preset-pin.mjs` adds exactly the key `sprout-dad-kim` and changes no value,
    - `prettier --check` exits 0 on the new asset,
    - `tsc --noEmit` has the baseline count and no error in the new file.
  - Record: the eleven rows, each look round's three differences, the Green model id and family, the
    GLB stats, the pin key check, the panel path, and the panel SHA-256.
  - Evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `b48c3df3235d69337aecc90da7db6cd178455eed`, role base
    `d519ae1fcb4ee305813f0fe04ba5c8bc54b2c957`, Green route
    `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family minimax):
    - The eleven rows of `TABLES.kim` from `out/chibi-sprouts/cast/sprout-dad-kim-measure.json`:
      `heightInHeads 3.661998`, `armToTorso 1.328305`, `legShare 0.392931`,
      `headToShoulders 1.181256`, `wrist -0.061303`, `fingertips 0.509578`, `eyeLine 0.620879`,
      `eyeHeight 0.114685`, `spacingHead 0.381643`, `eyeWidthFace 0.222857`, `spacingFace 0.451429`.
      Every row sits inside the table, every row limit equals the table, both palms are ok, and no
      guard fired.
    - The four look rounds and their three largest differences: 1) the hair was a helmet with black
      speckles on the forehead, the shirt's shoulders were detached pads, and the mouth was a small
      blob; 2) the hairline cut speckled, the shirt's top was too narrow, and the smile was too
      small, so the face opening became a ball in front of the face, the shirt grew a collar, and
      the smile arc widened; 3) the square jaw stayed invisible and the plaid read as a harlequin,
      so the jaw body grew to 0.184 m and the stripes halved; 4) the cut moved after the quiff union
      and the jeans' seat rose to 0.71 m, which removed the last speckles and the bare waist band.
    - The GLB stats: `sprout-dad-kim: 52,475 triangles, 0.419 x 1.514 x 0.308 m`, 17 bones, one
      `idle` clip of 2.4 s, 15 bodies (`head-skin`, `torso-skin`, `arms-skin`, `legs-skin`,
      `feet-skin`, `hands`, `face`, `jaw`, `hair`, `plaid`, `collar`, `tee`, `jeans`, `boots`,
      `boot-sole`). The GLB SHA-256 is
      `6de052e7346d61aad7dc5280443e48f20b0539ff158b02edb2b75c3559e40753`; the four level renders are
      `84e4238bd08a95693b17006e22e90f7d72577f6e6db76915e89db1b748c37c38` (flat front),
      `ef82f331d9019c7bb7762de9a822d5f2c1a1e76b7c0e5f930a0be779fda4a10f` (flat side),
      `2c51d7969c14cd5c2c553e9dc8f71201f64b51d0748f5f27aadc2541078d1aca` (lit front), and
      `2ac61c4a96f39b25c93ec75a4511d0dfcade2dfad7dc13c3ca6cf3a740e43cb8` (lit side).
    - The pin key check: `scripts/make-preset-pin.mjs` adds exactly the key `sprout-dad-kim`, with the
      `dad` preset (`skin fair`, `hair black`, `eyes brown`, `cloth plaid`), and changes no other
      value. The stale `wizard-argon-trial` key stays, because its asset file is gone and the pin
      must keep every baseline key.
    - The panel: `out/chibi-sprouts/cast/sprout-dad-kim-panel.png`, 1416 x 900, SHA-256
      `7455dbeadd0357f883f22fbead6eb1379fc0572ca56213533a8b35c5dc19f244`.
    - The gates: `tests/sprout-dad-kim.test.ts` exits 0, `./forge check sprout-dad-kim` ends
      `result ok`, `prettier --check` exits 0, and `tsc --noEmit` holds the 51 baseline diagnostics
      with none in the new file.

  - Look remediation round 2 evidence (2026-11-26, worktree
    `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch `chibi-sprouts-cast`, phase base
    `b48c3df3235d69337aecc90da7db6cd178455eed`, role base
    `eefaeba94aa38f4efe944b488ac8924e43ea8532`, implementation commit
    `3cd8582a1cd6a5d0c5a154e84d87f2d7fb29de98`, Green route
    `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family minimax):
    - The round 1 judge scored identity 7.0 and proportion 8.2. The comment named three faults. The
      hair read as a black beanie, the plaid shirt read as buttoned closed, and the hands read as
      holding small sticks. The hair and the shirt are fixed. The hands are the base hand of
      `buildKim`, a slab of 16 mm thickness and 135 mm length. The render carries no held item, so
      the round 1 reading is not a geometry fault and the base stays unchanged.
    - The three largest differences of each look round: 1) the hair was a smooth black dome with a
      hairline on the brow, the shirt front was closed, and the jaw read as a separate plate under
      the chin; 2) the hairline moved up to the forehead, the shirt opened over a white tee, and the
      jaw merged into the chin; 3) the hair carried a fringe blob that read as a spot on the
      forehead, the white panel was too wide, and bare shoulder showed above the sleeve, so the
      fringe was removed, the panel narrowed, and the shoulder grew back over the arm.
    - The hair fix: the hairline cut sits at `1.147 m` on the forehead instead of `1.075 m`, the quiff
      lifts and sweeps back over the skull, and fine combed ridges run over the surface. The ridges
      come before the cut, so the hairline stays a clean edge.
    - The shirt fix: the open front is a V cut from `1.03 m` to the hem, so the white tee shows
      from the neck down to the hem. The plaid carries thin vertical stripes and thin horizontal
      bands, and two chest pockets sit on the shirt fronts.
    - The eleven rows of `TABLES.kim` from `out/chibi-sprouts/cast/sprout-dad-kim-measure.json`:
      `heightInHeads 3.660059`, `armToTorso 1.328305`, `legShare 0.392696`, `headToShoulders
1.150488`, `wrist -0.061303`, `fingertips 0.509578`, `eyeLine 0.620109`, `eyeHeight 0.113114`,
      `spacingHead 0.391414`, `eyeWidthFace 0.226471`, `spacingFace 0.455882`. Every row sits
      inside the table, every row limit equals the table, both palms are ok, and no guard fired.
    - The GLB stats: `sprout-dad-kim: 51,623 triangles, 0.421 x 1.547 x 0.315 m`, 17 bones, one
      `idle` clip of 2.4 s, 15 bodies (`head-skin`, `torso-skin`, `arms-skin`, `legs-skin`,
      `feet-skin`, `hands`, `face`, `jaw`, `hair`, `plaid`, `collar`, `tee`, `jeans`, `boots`,
      `boot-sole`). The GLB SHA-256 is
      `896d889b3e2db721a647b371b97f714e0e6a2151787ad9c4bd5b21b19d1fea61`. The four level renders
      are `7c50a8adfe311f2744f8635749ff32e97b7407d5e42ad6134f837836b4536450` (flat front),
      `f8f483e3688fd45295a2c493851ca5013ea3cf9c907dba476db70a3ba8a9af8b` (flat side),
      `9d6c98d9b373debfdca8245041e49158c7413a2c417e7743ee2c12d34a5f5270` (lit front), and
      `3817f50ea82ee88a19b8e324706b08f927b379ac6f8462e86d0c6e5b72639153` (lit side). The build
      prints no warning line.
    - The preset pin: `scripts/make-preset-pin.mjs` writes the same value for the key
      `sprout-dad-kim` as the committed pin, because the remediation changes no variant colour. A
      parsed comparison of the fresh pin with the committed pin covers 397 assets, and no value
      changes. The pin file stays byte-identical, so the commit holds no pin change. The stale
      `wizard-argon-trial` key stays, because its asset file is gone and the pin must keep every
      baseline key.
    - The panel: `out/chibi-sprouts/cast/sprout-dad-kim-panel.png`, 1416 x 900, SHA-256
      `26513ebbcafa31e1646444e4c68d983b2f52b9473a4fd2c02378ec989b12993e`. The caption reads
      `11/11 rows pass; palms ok` and `cropped: front no, side no, drawing no`.
    - The gates: `tests/sprout-dad-kim.test.ts` exits 0, `./forge check sprout-dad-kim` ends
      `result ok`, `prettier --check` exits 0, and `tsc --noEmit` holds the 51 baseline diagnostics
      with none in the changed file.
    - Final-build stable stats projection, taken at the Phase 2 gate on 2026-11-26 from
      `out/sprout-dad-kim/stats.json` after the final lit render (every `milliseconds` key removed at
      any depth, `texture` keeps `size` only; canonical JSON hash with sorted keys
      `19eba13496778ff03d57cb92c4ccf0592f0888175fec7e351de123fe25756494`): `name`
      `sprout-dad-kim`; `triangles` 51623; `bounds` min `[-0.21, -0.007, -0.166]`, max
      `[0.21, 1.54, 0.149]`, size `[0.421, 1.547, 0.315]`; `texture` null; `bones` 17;
      `animations` `[{ name: idle, duration: 2.4 }]`; `bodies` in this order:

      | body       | gridPoints | evaluatedPoints | rawTriangles | triangles |
      | ---------- | ---------- | --------------- | ------------ | --------- |
      | head-skin  | 4657545    | 934555          | 191328       | 6219      |
      | torso-skin | 207993     | 139246          | 27388        | 2264      |
      | arms-skin  | 233625     | 120066          | 25800        | 1390      |
      | legs-skin  | 138425     | 117438          | 26908        | 1236      |
      | feet-skin  | 66625      | 40530           | 8312         | 1402      |
      | hands      | 2005185    | 273197          | 66168        | 19966     |
      | face       | 3460425    | 590838          | 114608       | 3776      |
      | jaw        | 58425      | 45222           | 9672         | 532       |
      | hair       | 573561     | 246086          | 39936        | 388       |
      | plaid      | 353241     | 232637          | 75556        | 6570      |
      | collar     | 47481      | 32746           | 5588         | 1212      |
      | tee        | 270921     | 112794          | 19744        | 1602      |
      | jeans      | 337953     | 193080          | 39344        | 3406      |
      | boots      | 79625      | 58339           | 12672        | 1556      |
      | boot-sole  | 32193      | 28477           | 7720         | 104       |

      The raw `stats.json` SHA-256 is
      `4c79e54e3ab5b1dcae03b573a9fa36a599146953db77c92ac4cab4647b3f4d99` for traceability only,
      never an equality check. These are the final-build values taken at the gate, and the pin
      measured the same GLB `896d889b3e2db721a647b371b97f714e0e6a2151787ad9c4bd5b21b19d1fea61`.
      This is the projection of gate-check clause 7. No earlier pin-time projection exists for Dad:
      the round 1 build (GLB `6de052e7346d61aad7dc5280443e48f20b0539ff158b02edb2b75c3559e40753`) was
      overwritten in `out/` and its `stats.json` projection was never recorded.

- [x] T7 Green: Grandma. File: `assets/sprout-grandma-kim.ts` (new). Commits `6ce871edee5ac74a28e2b8486d0213ac03fd1610`, `44c4b68843cdc8e9b9955e7b69a3f10b9a49f7a7`, and `b73f7104e3461cc9dfa57a5f1e5ef67c615f525a`.
  - Look remediation round 3 (2026-11-26): the look judge gave identity 7.2 and proportion 8.1 in
    round 2. The brief named three faults: the skin holes at the shoulders, the puffy-shoulder
    buttoned dress with a pale panel, and the short skirt. All three are fixed. The hair stays as it
    was, no glasses are added, and the hands stay as the base builds them.
  - Evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `b48c3df3235d69337aecc90da7db6cd178455eed`, role base
    `e8b733e0332a19ff101b7859eda334cecb4b47ec`, implementation commit
    `b73f7104e3461cc9dfa57a5f1e5ef67c615f525a`, Green route
    `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family minimax):
    - The three largest differences of each look round: 1) the sleeve left the outer edge of the
      base upper arm bare, so the skin showed at both shoulders; the cardigan read as a buttoned
      dress with a pale panel at the neck; the shoulders read as two puffed balls; 2) the sleeve
      moved onto the base arm axis with an 8 mm clearance, so the skin no longer showed; the
      cardigan got a front opening with the knit top behind it; the puff balls went and the
      shoulder came from the sleeve cap alone; the knit top ended above the base waist, so the base
      skin showed under the opening; 3) the opening now ends at the knit top hem, so no skin shows
      under it, and the knit texture got weaker, so the hem edge reads straighter.
    - The shoulder fix: the sleeve cap sits on the base shoulder joint with an 8 mm clearance in
      every direction, so the base upper arm never shows through the knit. The flat front render
      holds no skin pixel in the shoulder band outside the neck, and the flat side render holds none
      outside the face.
    - The clothes fix: the cardigan hangs open from the collar to the waist over a matching green
      knit top with a ribbed round neck and a ribbed hem, the shoulder line is smooth, the hem
      carries a ribbed band at the hip, the cuffs carry ribbed bands at the wrists, the buttons run
      down the right placket, and the skirt reaches lower and flares wider than in round 2.
    - The eleven rows of `TABLES.kim` from
      `out/chibi-sprouts/cast/sprout-grandma-kim-measure.json`: `heightInHeads 3.648823`,
      `armToTorso 1.328305`, `legShare 0.391624`, `headToShoulders 1.16905`, `wrist -0.061303`,
      `fingertips 0.509578`, `eyeLine 0.620548`, `eyeHeight 0.111699`, `spacingHead 0.382653`,
      `eyeWidthFace 0.22561`, `spacingFace 0.457317`. Every row sits inside the table, every row
      limit equals the table, both palms are ok, and no guard fired.
    - The bun and the head: the mask top `detail.crownRow` 46 sits above the rounded projected crown
      `detail.projectedCrownRow` 95, and the head height is 241.72 px. The white bun pixels sit
      above the projected crown in the flat front view and in the flat side view, so the bun stays
      in the side silhouette and the panel keeps it inside the 56 px headroom (`cropped: no`).
    - The GLB stats: `sprout-grandma-kim: 50,430 triangles, 0.428 x 1.588 x 0.345 m`, 17 bones, one
      `idle` clip of 2.4 s, 14 bodies (`head-skin`, `torso-skin`, `arms-skin`, `legs-skin`,
      `feet-skin`, `hands`, `face`, `cheeks`, `hair`, `cardigan`, `dress`, `skirt`, `flats`, `studs`).
      The GLB SHA-256 is `95d1de0b85c4cdb3ce45b2447f05a6d7dc59054d2febb4ace40813452fc1524b`. The
      four level renders are `756c3d2cdf361ed26087b3753cb620ddf8f8f98bb1d2db38f46c942b40cca0cd`
      (flat front), `3822d42f099459f5af0bf5d446b6078cf63e4ca18d2825fe8f8d07104f4aa949` (flat side),
      `f876dcfa91925802bbd5ef8213b389ba753dc5d390b218b768d3306a1f12860f` (lit front), and
      `8c32a37fdbdf4ed7c7c69b688218d71ad38efafcd73721bd3765bd44310ffc37` (lit side). The build
      prints no warning line.
    - The measure record: `out/chibi-sprouts/cast/sprout-grandma-kim-measure.json`, SHA-256
      `338a29d6cbdb00aba66c0b0d6f0f68f394b90185a7edfd28066d4fe2f3620436`.
    - The preset pin: the remediation changes no variant colour and no preset, so the pin key
      `sprout-grandma-kim` stays byte-identical and the commit holds no pin change.
    - The panel: `out/chibi-sprouts/cast/sprout-grandma-kim-panel.png`, 1416 x 900, SHA-256
      `4e10acda9759702e11c8e0896729bb33ca2e01e62a95c6917d7540f839e45c30`. The caption reads
      `11/11 rows pass; palms ok` and `cropped: front no, side no, drawing no`.
    - The gates: `tests/sprout-grandma-kim.test.ts` and `tests/cast-isolation.test.ts` exit 0 with
      six tests, `./forge check sprout-grandma-kim` ends `result ok`, `prettier --check` exits 0, and
      `tsc --noEmit` holds the 51 baseline diagnostics with none in the changed file.
    - Final-build stable stats projection, taken at the Phase 2 gate on 2026-11-26 from
      `out/sprout-grandma-kim/stats.json` after the final lit render (every `milliseconds` key
      removed at any depth, `texture` keeps `size` only; canonical JSON hash with sorted keys
      `0edfe64317b2b1ae4e940677ddab17c2b0a514e3d082e05d0ee752ee63634b67`): `name`
      `sprout-grandma-kim`; `triangles` 50430; `bounds` min `[-0.214, -0.005, -0.182]`, max
      `[0.214, 1.583, 0.163]`, size `[0.428, 1.588, 0.345]`; `texture` null; `bones` 17;
      `animations` `[{ name: idle, duration: 2.4 }]`; `bodies` in this order:

      | body       | gridPoints | evaluatedPoints | rawTriangles | triangles |
      | ---------- | ---------- | --------------- | ------------ | --------- |
      | head-skin  | 4657545    | 934555          | 191328       | 6219      |
      | torso-skin | 207993     | 139246          | 27388        | 2264      |
      | arms-skin  | 233625     | 120066          | 25800        | 1390      |
      | legs-skin  | 138425     | 117438          | 26908        | 1236      |
      | feet-skin  | 66625      | 40530           | 8312         | 1402      |
      | hands      | 2005185    | 273197          | 66168        | 19966     |
      | face       | 3460425    | 590838          | 113925       | 5061      |
      | cheeks     | 66825      | 39498           | 8168         | 1566      |
      | hair       | 376025     | 189232          | 38910        | 796       |
      | cardigan   | 624777     | 430769          | 75354        | 5706      |
      | dress      | 300105     | 182967          | 32324        | 2044      |
      | skirt      | 460265     | 311832          | 53104        | 690       |
      | flats      | 66625      | 46536           | 10808        | 1742      |
      | studs      | 32657      | 5315            | 400          | 348       |

      The raw `stats.json` SHA-256 is
      `e8cab83758955f98de39e44c8024f506a9a81ec1cb4ede807bb270f7241814ce` for traceability only,
      never an equality check. These are the final-build values taken at the gate, and the pin
      measured the same GLB `95d1de0b85c4cdb3ce45b2447f05a6d7dc59054d2febb4ace40813452fc1524b`.
      This is the projection of gate-check clause 7. No earlier pin-time projection exists for
      Grandma: the round 1 build (GLB
      `5488860c3544913ca1148e04f660792c4fbd5ac399d0fc79f9b0a2b4753f02c2`) and the round 2 build
      (GLB `231ca1ad5b929a8584f186bb2efa721548d7811a2ceae4d8006d22583430c217`) were overwritten in
      `out/` and their `stats.json` projections were never recorded.
  - Look remediation round 2 (2026-11-26): the look judge gave identity 7.0 and proportion 8.0 in round 1.
  - Build the identity of the spec: white hair in a high bun, round cheeks, smile lines, pearl studs,
    a green cardigan over a pale green dress, a mid-calf skirt, and brown flats. The bun may rise
    above the skull. The measured crown is the base crown. Add the face layer that recreates the two
    eyes and the cheek body of spec "The face layer and the paint". Declare `variants` with a `hair`
    slot whose first option is her white, one preset `grandma`, and `castMeta` (no marks).
  - Shape loop and gates are T6's, with her own file and key.
  - Done-when: T6's list for `sprout-grandma-kim`, plus her `heightInHeads` and `eyeLine` rows come
    from the rounded projected crown and sit in the adult table, her bun stays in the side
    silhouette, and her mask top is above `detail.projectedCrownRow` in the record.
  - Record: T6's record for her, plus the mask top, the projected crown, and the head height.
  - Evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `b48c3df3235d69337aecc90da7db6cd178455eed`, role base
    `d519ae1fcb4ee305813f0fe04ba5c8bc54b2c957`, Green route
    `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family minimax):
    - The eleven rows of `TABLES.kim` from
      `out/chibi-sprouts/cast/sprout-grandma-kim-measure.json`: `heightInHeads 3.650215`,
      `armToTorso 1.328305`, `legShare 0.391679`, `headToShoulders 1.174204`,
      `wrist -0.061303`, `fingertips 0.509578`, `eyeLine 0.620495`, `eyeHeight 0.114329`,
      `spacingHead 0.382653`, `eyeWidthFace 0.228395`, `spacingFace 0.462963`. Every row sits inside
      the table, every row limit equals the table, both palms are ok, and no guard fired.
    - The bun and the head: the mask top `detail.crownRow` 46 sits above the rounded projected crown
      `detail.projectedCrownRow` 99, and the head height is `chinRow - projectedCrownRow` = 240.53
      px. The white bun pixels sit above the projected crown in the flat front view and in the flat
      side view, so the bun stays in the side silhouette and the panel keeps it inside the 56 px
      headroom (`cropped: no`).
    - The five look rounds and their three largest differences: 1) the bun was a separate ball on a
      tall cone, the knit ribs read as a plaid grid, and the skirt was a short mini; 2) the bun
      joined the cap with one soft blend, the cardigan closed with a V-neck, and the skirt reached
      mid-calf; 3) the smile lines read as a moustache, the cardigan's hem showed a pale sliver, and
      the vertical ribs read as straps, so the lines became steep strokes and the hem tapered; 4)
      the waist still showed skin and dress slivers, so the cardigan's hem fell to 0.56 m and the
      dress and skirt profiles changed; 5) the shirt still showed a skin patch in the V-neck, so the
      dress grew at the chest.
    - The GLB stats: `sprout-grandma-kim: 52,333 triangles, 0.415 x 1.595 x 0.309 m`, 17 bones, one
      `idle` clip of 2.4 s, 13 bodies (`head-skin`, `torso-skin`, `arms-skin`, `legs-skin`,
      `feet-skin`, `hands`, `face`, `cheeks`, `hair`, `cardigan`, `dress`, `flats`, `studs`). The GLB
      SHA-256 is `5488860c3544913ca1148e04f660792c4fbd5ac399d0fc79f9b0a2b4753f02c2`; the four level
      renders are `76b1dbd47aba8774bfc9a37ba6da4b93ba11d18c71596b431d3f7631a1e1bf87` (flat front),
      `e4db2df6ee087fe89c1385d0ef08f198710a61b2ec46738a63bff38e1ad7f079` (flat side),
      `9971cd712a52d1fc7c6870210af4695d719623d42227aa20cc350f8ccf4f58c6` (lit front), and
      `c75b45b8fe7faceb9a0fd2c3efefac1046f6826ee95cd6342c5120ecc7a44ad9` (lit side).
    - The pin key check: `scripts/make-preset-pin.mjs` adds exactly the key `sprout-grandma-kim`,
      with the `grandma` preset (`skin fair`, `hair white`, `eyes brown`, `cloth sage`), and changes
      no other value. The stale `wizard-argon-trial` key stays, because its asset file is gone and
      the pin must keep every baseline key.
    - The panel: `out/chibi-sprouts/cast/sprout-grandma-kim-panel.png`, 1416 x 900, SHA-256
      `0317a6fc3662d05437c8a7a29c969df87d0cffb60abd2289c474c843ab4b9d45`.
    - The gates: `tests/sprout-grandma-kim.test.ts` exits 0, `./forge check sprout-grandma-kim`
      ends `result ok`, `prettier --check` exits 0, and `tsc --noEmit` holds the 51 baseline
      diagnostics with none in the new file.

  - Look remediation round 2 evidence (2026-11-26, worktree
    `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch `chibi-sprouts-cast`, phase base
    `b48c3df3235d69337aecc90da7db6cd178455eed`, role base
    `eefaeba94aa38f4efe944b488ac8924e43ea8532`, implementation commit
    `44c4b68843cdc8e9b9955e7b69a3f10b9a49f7a7`, Green route
    `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family minimax):
    - The round 1 judge scored identity 7.0 and proportion 8.0. The comment named three faults. The
      hair read as a smooth white cap with a bun, the face had no elderly marks, and the cardigan
      read as a puffy jacket with a pale centre panel over a short skirt. All three are fixed.
    - The three largest differences of each look round: 1) the bun was a cone blended into the cap,
      the cheek bodies bulged forward as two muzzle lumps, and the smile lines crossed the nose; 2)
      the bun became a wide mass with a wrap, the cheeks flattened, and the smile lines moved to the
      corner of the mouth; 3) the hairline showed skin spikes where the grooves met the face, the
      hair cap hugged the face layer, and the hair read as a smooth bonnet, so the cap grew clear
      of the face, the cap grooves were replaced by painted strands, and the bun kept its grooves.
    - The hair fix: the cap sits clear of the face layer, the hairline is a parted arch that is high
      at the parting and low at the temples, the bun is a wide mass with a wrap ring and fine
      grooves, loose wisps frame the face and the ears, and eight painted strands fan out from the
      parting.
    - The face fix: the cheek bodies are flatter and wider, they carry the rosy cheek paint, and the
      two smile lines run from the side of the nose to the corner of the mouth.
    - The clothes fix: the cardigan closes at the front with a neck opening, a row of five buttons
      and knit ribs at the hem and the cuffs, the dress is a light green that matches the cardigan,
      and the skirt falls to the mid-calf with vertical folds and a hem that dips in the middle.
    - The eleven rows of `TABLES.kim` from
      `out/chibi-sprouts/cast/sprout-grandma-kim-measure.json`: `heightInHeads 3.648823`,
      `armToTorso 1.328305`, `legShare 0.391624`, `headToShoulders 1.16905`, `wrist -0.061303`,
      `fingertips 0.509578`, `eyeLine 0.620548`, `eyeHeight 0.111699`, `spacingHead 0.382653`,
      `eyeWidthFace 0.22561`, `spacingFace 0.457317`. Every row sits inside the table, every row
      limit equals the table, both palms are ok, and no guard fired.
    - The bun and the head: the mask top `detail.crownRow` 46 sits above the rounded projected crown
      `detail.projectedCrownRow` 95, and the head height is `chinRow - projectedCrownRow` = 241.72
      px. The white bun pixels sit above the projected crown in the flat front view and in the flat
      side view, so the bun stays in the side silhouette and the panel keeps it inside the 56 px
      headroom (`cropped: no`).
    - The GLB stats: `sprout-grandma-kim: 48,246 triangles, 0.412 x 1.588 x 0.334 m`, 17 bones, one
      `idle` clip of 2.4 s, 13 bodies (`head-skin`, `torso-skin`, `arms-skin`, `legs-skin`,
      `feet-skin`, `hands`, `face`, `cheeks`, `hair`, `cardigan`, `dress`, `flats`, `studs`). The GLB
      SHA-256 is `231ca1ad5b929a8584f186bb2efa721548d7811a2ceae4d8006d22583430c217`. The four level
      renders are `5acbcba54b8a91e17ccc2d379adce0fefc60fa90c47866661c89261ae7432005` (flat front),
      `94b4dd9fb09a37485d5d4529c522c30ddd5fa677102cf761d8598a6ea9e19dad` (flat side),
      `d86c880c1ca1c8387dc078cc0fbc7ba3377b9324a3b3901d4dee718d3dc6633a` (lit front), and
      `6a617dff37894dee4fe603092acfff89b4c03157424a67c9badfe82287fb8014` (lit side). The build
      prints no warning line.
    - The preset pin: `scripts/make-preset-pin.mjs` writes the same value for the key
      `sprout-grandma-kim` as the committed pin, because the remediation changes no variant colour.
      A parsed comparison of the fresh pin with the committed pin covers 397 assets, and no value
      changes. The pin file stays byte-identical, so the commit holds no pin change. The stale
      `wizard-argon-trial` key stays, because its asset file is gone and the pin must keep every
      baseline key.
    - The panel: `out/chibi-sprouts/cast/sprout-grandma-kim-panel.png`, 1416 x 900, SHA-256
      `e52fda296867902c6422a6d157c15411d973ead22d335dc2dce918e3a4470c3b`. The caption reads
      `11/11 rows pass; palms ok` and `cropped: front no, side no, drawing no`.
    - The gates: `tests/sprout-grandma-kim.test.ts` exits 0, `./forge check sprout-grandma-kim`
      ends `result ok`, `prettier --check` exits 0, and `tsc --noEmit` holds the 51 baseline
      diagnostics with none in the changed file.

- [x] T8 Green: Grandpa. File: `assets/sprout-grandpa-kim.ts` (new). Commit `78be77a2af409704e5d132018d4d4c30e6e85169`.
  - Build the identity of the spec: a bald crown with white side hair, round dark-brown glasses, a
    white moustache, an open smile, a green V-neck sweater over a pale green collared shirt, brown
    trousers, and brown shoes. The glasses and the moustache are paint. Declare `variants`, one preset
    `grandpa`, and `castMeta.faceMarks.glasses` with a colour more than 24 from the eye paint. Add the
    face layer that recreates the two eyes, per spec "The face layer and the paint".
  - Shape loop and gates are T6's, with his own file and key.
  - Done-when: T6's list for `sprout-grandpa-kim`, plus no warning line from the glasses paint, two
    eye components separate from the frame and the moustache, and the record's `faceMarks`.
  - Record: T6's record for him, plus the eye-component result and the declared face marks.
  - Evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `b48c3df3235d69337aecc90da7db6cd178455eed`, role base
    `d519ae1fcb4ee305813f0fe04ba5c8bc54b2c957`, Green route
    `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family minimax):
    - The eleven rows of `TABLES.kim` from
      `out/chibi-sprouts/cast/sprout-grandpa-kim-measure.json`: `heightInHeads 3.660733`,
      `armToTorso 1.328305`, `legShare 0.392729`, `headToShoulders 1.233947`,
      `wrist -0.061303`, `fingertips 0.509578`, `eyeLine 0.620947`, `eyeHeight 0.112184`,
      `spacingHead 0.364679`, `eyeWidthFace 0.235119`, `spacingFace 0.473214`. Every row sits inside
      the table, every row limit equals the table, both palms are ok, and no guard fired.
    - The eye and the marks: the record holds `faceMarks.glasses` `#3b2a1e`, the declared colour of
      the painted round frame. The measure run found exactly two eye components and no
      `eye components:` error, so the two eyes stay separate from the frame and the moustache. The
      declared colour stays more than 24 in Chebyshev distance from every eye colour and from the
      pupil `#14100e`. The bald crown holds no white hair, the white side hair frames it, and the
      white moustache shows under the eyes.
    - The five look rounds and their three largest differences: 1) the moustache was a small
      crescent, the shirt showed as a wide tie, and the sweater's hem showed a brown line; 2) the
      moustache widened, the V-neck narrowed, the sweater's hem tapered, and the trousers grew; 3)
      the moustache arched like a smile, so it became an arch and the temple arms left the face; 4) the moustache broke the face measurement, because the skin seed landed in the pocket under
      it, so the moustache, the mouth and the teeth moved and the frame shrank to a 0.048 m radius; 5) the moustache widened once more and every row passed.
    - The GLB stats: `sprout-grandpa-kim: 50,427 triangles, 0.424 x 1.507 x 0.284 m`, 17 bones, one
      `idle` clip of 2.4 s, 15 bodies (`head-skin`, `torso-skin`, `arms-skin`, `legs-skin`,
      `feet-skin`, `hands`, `face`, `hair`, `sweater`, `shirt`, `collar`, `trousers`,
      `trouser-crease`, `shoes`, `shoe-sole`). The GLB SHA-256 is
      `9994ff971eb5af19b17ac4f464e29e71b3dbe0eee4699024a0b05b75ae6d7a50`; the four level renders are
      `dc3b26cc11b3619a64e2369aa0f302f232eff2145bcea7d9fe7214b5940618ea` (flat front),
      `d7a625b0dca94f0b080b36f011adcaf03d6575131b03e114f1b23c097a496d68` (flat side),
      `aae6b8e84d751f1cf3392640ff63d441d6ee62741fe3e71a78452a964d497667` (lit front), and
      `be42816da498c59d8b9de6d82ef25d50d27c9da8c20480e0cf41bff0683114fa` (lit side).
    - The pin key check: `scripts/make-preset-pin.mjs` adds exactly the key `sprout-grandpa-kim`,
      with the `grandpa` preset (`skin fair`, `hair white`, `eyes brown`, `cloth forest`), and
      changes no other value. The stale `wizard-argon-trial` key stays, because its asset file is
      gone and the pin must keep every baseline key.
    - The panel: `out/chibi-sprouts/cast/sprout-grandpa-kim-panel.png`, 1416 x 900, SHA-256
      `09c9dc6dc2f61fee5b9421e00472e2d62be34a78ca824fe8dd037fd7f4ad84d8`.
    - The gates: `tests/sprout-grandpa-kim.test.ts` exits 0, `./forge check sprout-grandpa-kim`
      ends `result ok`, `prettier --check` exits 0, and `tsc --noEmit` holds the 51 baseline
      diagnostics with none in the new file.
    - Final-build stable stats projection, taken at the Phase 2 gate on 2026-11-26 from
      `out/sprout-grandpa-kim/stats.json` after the final lit render (every `milliseconds` key
      removed at any depth, `texture` keeps `size` only; canonical JSON hash with sorted keys
      `c80900021f99fb872a2944f39ffba836287be65912c1716d48d06720e22f79bc`): `name`
      `sprout-grandpa-kim`; `triangles` 50427; `bounds` min `[-0.212, -0.007, -0.135]`, max
      `[0.212, 1.5, 0.149]`, size `[0.424, 1.507, 0.284]`; `texture` null; `bones` 17;
      `animations` `[{ name: idle, duration: 2.4 }]`; `bodies` in this order:

      | body           | gridPoints | evaluatedPoints | rawTriangles | triangles |
      | -------------- | ---------- | --------------- | ------------ | --------- |
      | head-skin      | 4657545    | 934555          | 191328       | 6219      |
      | torso-skin     | 207993     | 139246          | 27388        | 2264      |
      | arms-skin      | 233625     | 120066          | 25800        | 1390      |
      | legs-skin      | 138425     | 117438          | 26908        | 1236      |
      | feet-skin      | 66625      | 40530           | 8312         | 1402      |
      | hands          | 2005185    | 273197          | 66168        | 19966     |
      | face           | 3460425    | 590838          | 119466       | 4126      |
      | hair           | 226233     | 99885           | 19948        | 2278      |
      | sweater        | 384993     | 236808          | 51288        | 4556      |
      | shirt          | 226233     | 93222           | 16184        | 1342      |
      | collar         | 34153      | 23141           | 4172         | 1030      |
      | trousers       | 448305     | 209854          | 41864        | 2846      |
      | trouser-crease | 38745      | 25793           | 4048         | 72        |
      | shoes          | 79625      | 57643           | 12264        | 1596      |
      | shoe-sole      | 32193      | 28477           | 7720         | 104       |

      The raw `stats.json` SHA-256 is
      `63c3f3ecdbff905db2a02b2b589aa62aa151422a5d1dc77bfcbda3e4610bce7c` for traceability only,
      never an equality check. These are the final-build values taken at the gate, and the pin
      measured the same GLB `9994ff971eb5af19b17ac4f464e29e71b3dbe0eee4699024a0b05b75ae6d7a50`.
      This is the projection of gate-check clause 7. No earlier pin-time projection exists for
      Grandpa: the Green look builds before the judged build were overwritten in `out/` and left no
      recorded GLB or `stats.json` projection.

- [x] T9 Measure: The three adult look judges.
      Records: `measure/runs/chibi_sprouts_cast_20261125/judge-sprout-dad-kim.json`,
      `judge-sprout-grandma-kim.json`, and `judge-sprout-grandpa-kim.json`.
  - One brief per character. Each brief holds the panel path, the drawing path, the eleven rows as
    text, and the two scores. The route, the family rule, and the record shape are spec decisions
    (j), (k), and (l) and spec "The judge record".
  - Before the judge runs, the orchestrator computes the asset commit, the base commit and base hash,
    the GLB hash, the record hash, the four render hashes, and the panel hash. Each of the four
    render hashes and the GLB hash must equal its measure record field, and a mismatch stops the
    judge with `judge input <field>: <actual> is not <record>`. The verdict binds to that asset
    revision, base revision, record, render set, and panel hash.
  - Done-when: `measure/runs/chibi_sprouts_cast_20261125/judge-<name>.json` exists for each of the
    three, the record holds every field of spec "The judge record", and identity and proportion are
    both 7.5 or more. A lower score returns the phase to the Green task of that character with the
    comment as the work list. Round 2 runs only after a failing score or a changed input. A second
    score below 7.5 escalates to the PM per AC8 rule 6.
  - Record: the route, the model id and family, the Red and Green families, the asset and base
    commits, the GLB, record, render, and panel hashes, both scores, the verdict, the round, and the
    escalation when one applies.

  - Record (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`):
    - Route `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia. Red family hungerg.
      Green family minimax. Base commit `41458a54a0282af2e062a1ed8a213f71856d7a40`, base SHA-256
      `769a80a9b3f5c30ec2fb6a10691b022aafa4b840180f99b054fd39b41b45e268`. Pass line 7.5.
    - Final verdicts are pass on both scores for all three. Dad scores 7.7 and 8.2 at round 2.
      Grandma scores 7.8 and 8.2 at round 3. Grandpa scores 7.8 and 8.5 at round 1.
    - Dad round 1 (asset `bae2072671011b3115fa54d29ea81e62eddaeec6`) scored 7.0 and 8.2 and failed
      on the black beanie, the closed shirt, and the stick hands. Dad round 2 (asset
      `3cd8582a1cd6a5d0c5a154e84d87f2d7fb29de98`) scored 7.7 and 8.2 and passed.
    - Grandma round 1 (asset `6ce871edee5ac74a28e2b8486d0213ac03fd1610`) scored 7.0 and 8.0 and
      failed on the smooth bonnet, the smooth face, and the short skirt and puffy jacket. Grandma
      round 2 (asset `44c4b68843cdc8e9b9955e7b69a3f10b9a49f7a7`) scored 7.2 and 8.1 and failed on
      the missing glasses, the puff-sleeve dress, and the stick hands. Grandma round 3 (asset
      `b73f7104e3461cc9dfa57a5f1e5ef67c615f525a`) scored 7.8 and 8.2 and passed.
    - Grandpa round 1 (asset `78be77a2af409704e5d132018d4d4c30e6e85169`) scored 7.8 and 8.5 and
      passed.
    - Grandma round 2 escalated to the PM under AC8 rule 6, because a second score was below 7.5.
      The PM default was one more Green round. Round 3 is that round. The escalation file is
      `measure/runs/chibi_sprouts_cast_20261125/escalation-sprout-grandma-kim.json`. It holds the
      three rounds, both failed comments, the PM decision, and the outcome.
    - Two judge misreads are recorded. The judge asked for glasses, but the drawing has none. The
      judge named sticks in the hands, but that shape is the hand slab of the base.
    - Each record holds every field of spec "The judge record". The former null fields now hold
      `asset_path`, `base_path`, `panel_path`, and the two comments. The comments come from the
      faults of the final round.
    - Verified before the commit: each record's final-round GLB, record, four render, and panel
      hashes equal the files on disk and the measure records. No score changed.
    - Spec fix: commit `0953f845` changed gate-check clauses 1 and 2 from
      `git rev-parse HEAD -- <path>` to `git log -1 --format=%H -- <path>`. `git rev-parse HEAD --
<path>` names HEAD, not the last commit that changed the path.

- [x] T10 Measure: The Phase 2 gate.
  - Done-when: the three pins exit 0, the three judges pass, every judge input of spec "The gate
    check of the judge inputs" is verified at the gate HEAD, `./forge check` ends `result ok` for
    each asset, the preset pin holds three new keys and no changed value, `./measure/generate.sh`
    exits 0, and `./measure/doctor.sh --structural-only` exits 0.
  - Record: the commands, the three verdicts, each verified input, the hash pairs, and the pin diff.

  - Record (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `b48c3df3235d69337aecc90da7db6cd178455eed`):
    - Phase acceptance is `pass` at `556694dee53873783ac0033d37462e0cc17ebacd`. The record is
      `measure/runs/chibi_sprouts_cast_20261125/phase-acceptance-p2-556694d.json`, with its log.
      It holds no blocking finding. The earlier run at `36b9ed3b764d9a98fce06c234fbeeef2538ee966`,
      record `phase-acceptance-p2-36b9ed3.json`, was `fail` on acceptance F1 and F2. Commit
      `556694de` answered both: it records the final-build stable stats projections and the
      committed escalation file. The second run withdrew F1 and F2.
    - The three judges pass. Dad scores 7.7 and 8.2 at round 2. Grandma scores 7.8 and 8.2 at
      round 3, after the PM escalation. Grandpa scores 7.8 and 8.5 at round 1. The pass line is 7.5.
      The judge records are `judge-sprout-dad-kim.json`, `judge-sprout-grandma-kim.json`, and
      `judge-sprout-grandpa-kim.json`.
    - The judge route is `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia. The Red
      family is hungerg. The Green family is minimax. The acceptance role runs
      `openai/gpt-6.2-sol#high`.
    - Judge input pairs at `556694de` match:
      - Dad asset `3cd8582a1cd6a5d0c5a154e84d87f2d7fb29de98`; GLB
        `896d889b3e2db721a647b371b97f714e0e6a2151787ad9c4bd5b21b19d1fea61`; record
        `f36096cc1cf8a3180fbeffa1362222a234451fae1e5e2543b09d7a87bc7b420d`; flat front
        `7c50a8adfe311f2744f8635749ff32e97b7407d5e42ad6134f837836b4536450`; flat side
        `f8f483e3688fd45295a2c493851ca5013ea3cf9c907dba476db70a3ba8a9af8b`; lit front
        `9d6c98d9b373debfdca8245041e49158c7413a2c417e7743ee2c12d34a5f5270`; lit side
        `3817f50ea82ee88a19b8e324706b08f927b379ac6f8462e86d0c6e5b72639153`; panel
        `26513ebbcafa31e1646444e4c68d983b2f52b9473a4fd2c02378ec989b12993e`.
      - Grandma asset `b73f7104e3461cc9dfa57a5f1e5ef67c615f525a`; GLB
        `95d1de0b85c4cdb3ce45b2447f05a6d7dc59054d2febb4ace40813452fc1524b`; record
        `338a29d6cbdb00aba66c0b0d6f0f68f394b90185a7edfd28066d4fe2f3620436`; flat front
        `756c3d2cdf361ed26087b3753cb620ddf8f8f98bb1d2db38f46c942b40cca0cd`; flat side
        `3822d42f099459f5af0bf5d446b6078cf63e4ca18d2825fe8f8d07104f4aa949`; lit front
        `f876dcfa91925802bbd5ef8213b389ba753dc5d390b218b768d3306a1f12860f`; lit side
        `8c32a37fdbdf4ed7c7c69b688218d71ad38efafcd73721bd3765bd44310ffc37`; panel
        `4e10acda9759702e11c8e0896729bb33ca2e01e62a95c6917d7540f839e45c30`.
      - Grandpa asset `78be77a2af409704e5d132018d4d4c30e6e85169`; GLB
        `9994ff971eb5af19b17ac4f464e29e71b3dbe0eee4699024a0b05b75ae6d7a50`; record
        `8155f52ffed1770ea9e4d97f260e309d9e48c3e21c478e3a88ae95371b0875a3`; flat front
        `dc3b26cc11b3619a64e2369aa0f302f232eff2145bcea7d9fe7214b5940618ea`; flat side
        `d7a625b0dca94f0b080b36f011adcaf03d6575131b03e114f1b23c097a496d68`; lit front
        `aae6b8e84d751f1cf3392640ff63d441d6ee62741fe3e71a78452a964d497667`; lit side
        `be42816da498c59d8b9de6d82ef25d50d27c9da8c20480e0cf41bff0683114fa`; panel
        `09c9dc6dc2f61fee5b9421e00472e2d62be34a78ca824fe8dd037fd7f4ad84d8`.
      - The three base commits are `41458a54a0282af2e062a1ed8a213f71856d7a40`. The three base
        hashes are `769a80a9b3f5c30ec2fb6a10691b022aafa4b840180f99b054fd39b41b45e268`.
    - Stable stats projection pairs plan/current match. Dad
      `19eba13496778ff03d57cb92c4ccf0592f0888175fec7e351de123fe25756494`; Grandma
      `0edfe64317b2b1ae4e940677ddab17c2b0a514e3d082e05d0ee752ee63634b67`; Grandpa
      `c80900021f99fb872a2944f39ffba836287be65912c1716d48d06720e22f79bc`. Every body row matches
      in order: Dad 15, Grandma 14, Grandpa 15. The raw hashes match for traceability only: Dad
      `4c79e54e3ab5b1dcae03b573a9fa36a599146953db77c92ac4cab4647b3f4d99`; Grandma
      `e8cab83758955f98de39e44c8024f506a9a81ec1cb4ede807bb270f7241814ce`; Grandpa
      `63c3f3ecdbff905db2a02b2b589aa62aa151422a5d1dc77bfcbda3e4610bce7c`.
    - Mom's eleven rows match T2:
      `heightInHeads 3.653929`, `armToTorso 1.328305`, `legShare 0.391841`,
      `headToShoulders 1.233173`, `wrist -0.061303`, `fingertips 0.509578`, `eyeLine 0.621882`,
      `eyeHeight 0.113069`, `spacingHead 0.365741`, `eyeWidthFace 0.229412`,
      `spacingFace 0.464706`. Both palms are ok. Her stable stats projection is
      `c93209cc3d9095c8376c96308ad5bb92e1dedacf0a7a1644bc77fa5c6aa95a6e`, and her five artifact
      hashes equal T0.
    - The preset pin diff adds exactly `sprout-dad-kim`, `sprout-grandma-kim`, and
      `sprout-grandpa-kim`. No baseline value changed or was removed. `tests/cast-isolation.test.ts`
      passes.
    - Commands and exit codes:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-dad-kim.test.ts tests/sprout-grandma-kim.test.ts tests/sprout-grandpa-kim.test.ts tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts tests/sprout-mom-kim.test.ts tests/sprout-mom-kim.validation.test.ts'
      # exit 0: 111 cases pass over 8 files
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node_modules/.bin/tsx scripts/proportion-check.mjs --asset <name> --table kim --record out/chibi-sprouts/cast/<name>-measure.json'
      # exit 0 for each of the three adults: eleven rows pass, both palms ok
      HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c './forge check <name>'
      # exit 0 for each asset: result ok, rest ok, idle ok, ground ok
      ./measure/generate.sh --check
      # exit 0
      ./measure/doctor.sh --structural-only
      # exit 1: the two declared environment limits of TD-43; neither is a Phase 2 change
      ```

    - The repaired commit list of Phase 2:
      - Red: `2d5808a79b9dfbdeceafe2cafc566bab5275abb6` (the three adult pins) and
        `d519ae1fcb4ee305813f0fe04ba5c8bc54b2c957` (the six-digit joint tolerance).
      - Green: `bae2072671011b3115fa54d29ea81e62eddaeec6` (Dad),
        `6ce871edee5ac74a28e2b8486d0213ac03fd1610` (Grandma),
        `78be77a2af409704e5d132018d4d4c30e6e85169` (Grandpa),
        `3cd8582a1cd6a5d0c5a154e84d87f2d7fb29de98` (Dad round 2),
        `44c4b68843cdc8e9b9955e7b69a3f10b9a49f7a7` (Grandma round 2), and
        `b73f7104e3461cc9dfa57a5f1e5ef67c615f525a` (Grandma round 3).
      - Measure: `096f82db`, `d920e57e`, `05be5aa0`, `eefaeba9`, `cd3bd7ae`, `a4d5e897`,
        `c1f44ad4`, `e8b733e0`, `0953f845`, `f5bb9710`, `fa7a1255`, `34a6e90d`, `36b9ed3b`,
        and `556694de`.
    - Dispositions: acceptance F1 and F2 are withdrawn at `556694de`. Acceptance F3 is a Nit, the
      two declared worktree links of TD-43. No blocker remains. Phase 3 may start.

## Phase 3: The children

- [~] T11 Red: Pin the child base, Tom, and Lily. Commit `5d436c4545c86cad1d08bf9928aae89b8cbb68bb`.
  Files: `tests/sprout-child-base.test.ts`, `tests/sprout-tom-kim.test.ts`,
  `tests/sprout-lily-kim.test.ts` (all new).
  - `tests/sprout-child-base.test.ts` asserts the fixed landmarks of spec "The landmarks and the
    tolerances" through `BASE_CROWN_Y`, `BASE_CHIN_Y`, `BASE_JOINTS`, and `BASE_HANDS`. Its fixed
    value cases fail on the absent module. Its built-GLB cases — the 17 joints, the built joints
    against `BASE_JOINTS`, the fingertip against `BASE_HANDS.L.fingerTip`, one `idle` clip, and one
    `hands` body — stay in the file and pass at T13 on Tom's build. It also pins that the module
    imports only `src/index.js`.
  - Each character file runs
    `--asset <name> --base humanoid-kim-child --table child --record out/chibi-sprouts/cast/<name>-measure.json`
    on the build and renders that the Green task wrote. It requires exit 0, the eleven rows of
    `TABLES.child` in table order, each value inside the child table, each row limit equal to the
    table, both palms ok, and the record path.
  - The Lily file also requires the three Lily guards to be absent, a declared `variants.hair`, and
    the record's `detail` to hold the chin and head-height values.
  - Done-when: each file exits 1 inside its case on the absent module or asset, with no collection
    error. `prettier --check` exits 0.
  - Record: the case names, which cases are new failing cases, and the failure text.

  - Red evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `aed0bcc0c3562de1def0242a29d35dd3dca31b68`, role base
    `aed0bcc0c3562de1def0242a29d35dd3dca31b68`):
    - The child-base file keeps the fixed-module cases and the built-Tom-GLB cases in one file.
      The fixed cases use the spec tolerances: crown and chin ±0.002 m, fixed joints and fingertip
      ±0.005 m, built joints ±0.002 m, and built fingertip ±0.005 m. No computed float uses exact
      equality.
    - The Tom and Lily pins run the child base and child table with the named cast record. Lily also
      checks the three named hair guards, `variants.hair`, `detail.chinRow`, and `detail.headHeight`.
    - No production file and no Phase 1 or Phase 2 test changed.
    - Command and result:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-child-base.test.ts tests/sprout-tom-kim.test.ts tests/sprout-lily-kim.test.ts'
      # exit 1: every new case fails inside its case on the absent module or asset
      ```

    - New failing cases and exact causes:

      | File                              | Case                                                                          | Red failure                                                                                                                                                     |
      | --------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
      | `tests/sprout-child-base.test.ts` | `pins the crown, chin, and left fingertip landmarks`                          | `base humanoid-kim-child: not built: /home/daniebo/Desktop/forge-worktrees/sprouts-cast/assets/parts/humanoid-kim-child.ts`; expected `true`, received `false`. |
      | `tests/sprout-child-base.test.ts` | `pins all 17 BASE_JOINTS and the five fixed joint heights`                    | `base humanoid-kim-child: not built: /home/daniebo/Desktop/forge-worktrees/sprouts-cast/assets/parts/humanoid-kim-child.ts`; expected `true`, received `false`. |
      | `tests/sprout-child-base.test.ts` | `imports only src/index.js`                                                   | `base humanoid-kim-child: not built: /home/daniebo/Desktop/forge-worktrees/sprouts-cast/assets/parts/humanoid-kim-child.ts`; expected `true`, received `false`. |
      | `tests/sprout-child-base.test.ts` | `Tom GLB holds the 17 joints, one idle clip, and one hands body`              | `asset sprout-tom-kim: not built: /home/daniebo/Desktop/forge-worktrees/sprouts-cast/out/sprout-tom-kim/sprout-tom-kim.glb`; expected `true`, received `false`. |
      | `tests/sprout-child-base.test.ts` | `Tom GLB joint heights match BASE_JOINTS within 0.002 m`                      | `base humanoid-kim-child: not built: /home/daniebo/Desktop/forge-worktrees/sprouts-cast/assets/parts/humanoid-kim-child.ts`; expected `true`, received `false`. |
      | `tests/sprout-child-base.test.ts` | `Tom GLB lowest left-hand vertex matches BASE_HANDS within 0.005 m`           | `base humanoid-kim-child: not built: /home/daniebo/Desktop/forge-worktrees/sprouts-cast/assets/parts/humanoid-kim-child.ts`; expected `true`, received `false`. |
      | `tests/sprout-tom-kim.test.ts`    | `measures eleven child rows, both palms, and the named record`                | `asset sprout-tom-kim: not built`; `missing: assets/sprout-tom-kim.ts`; expected exit 0, received 1.                                                            |
      | `tests/sprout-lily-kim.test.ts`   | `measures child rows and palms with hair declared and all Lily guards absent` | `asset sprout-lily-kim: not built`; `missing: assets/sprout-lily-kim.ts`; expected exit 0, received 1.                                                          |

    - No collection, syntax, or module-import error occurs. Each missing module or asset check runs
      inside its case before an import or read.
    - `node_modules/.bin/prettier --check tests/sprout-child-base.test.ts tests/sprout-tom-kim.test.ts tests/sprout-lily-kim.test.ts`
      exits 0.
    - `node node_modules/typescript/bin/tsc --noEmit` through the heavy runner exits 2 with 51
      existing diagnostics. None sits in the three new files.
    - The existing cast regression command exits 0:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts tests/sprout-mom-kim.test.ts tests/sprout-mom-kim.validation.test.ts tests/sprout-dad-kim.test.ts tests/sprout-grandma-kim.test.ts tests/sprout-grandpa-kim.test.ts'
      # exit 0
      ```

    - Full command output and the result block:
      `measure/runs/chibi_sprouts_cast_20261125/red-aed0bcc.log`.

- [x] T12 Green: The child base. Commit `09966d9ef4763344ea7db77b1077a641f5e22bc4`. File: `assets/parts/humanoid-kim-child.ts` (new).
  - Build the base of spec "The child base": the derived targets at 1.050 m, the 17 adult bone names,
    one `idle` clip, the hands body with the palms toward the legs, the three landmark exports, and
    `BASE_JOINTS` for all 17 bones. Import only `src/index.js`.
  - Done-when:
    - the module exports `BASE_CROWN_Y`, `BASE_CHIN_Y`, `BASE_HANDS`, and `BASE_JOINTS`,
    - `tests/sprout-child-base.test.ts` passes its fixed-value cases within the tolerances of spec
      "The landmarks and the tolerances",
    - the file imports no other asset module,
    - `prettier --check` exits 0.
  - Record: the derived targets, the measured absolute values, the 17 skeleton bone names and their
    `BASE_JOINTS` values, the clip name, and the four export values.

  - Evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `aed0bcc0c3562de1def0242a29d35dd3dca31b68`, role base
    `8e12dee1d28cabad5a67cd0891a496fcf0b763c1`, implementation commit
    `09966d9ef4763344ea7db77b1077a641f5e22bc4`, Green route
    `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family minimax):
    - The file is `assets/parts/humanoid-kim-child.ts`, 290 lines, one new file. It imports
      `motion`, `profile`, `sdf`, and the `AssetContext` type from `../../src/index.js` only. It
      imports no asset module, and the string `humanoid-kim.js` appears nowhere in it.
    - The derived targets of spec "The child base", built into the module: height 1.050 m, chin
      0.687 m, head height 0.363 m, head width 0.367 m, face width 0.238 m, eye line 0.815 m, eye
      width 0.053 m, eye height 0.051 m, eye spacing 0.115 m, shoulder 0.623 m at x 0.085 m, hip
      0.351 m, knee 0.214 m, wrist 0.368 m, fingertip 0.292 m at x 0.139 m, ankle 0.035 m.
    - The four export values: `BASE_CROWN_Y` 1.05, `BASE_CHIN_Y` 0.687, `BASE_HANDS.L`
      `{ palmCentre [0.132, 0.3452, 0.0325], thumbTip [0.148, 0.352, 0.0705], fingerTip
[0.139, 0.292, 0.032] }` and the mirrored `BASE_HANDS.R`. The palm centre sits on the inner
      palm face and its y and z match the hand mesh centroid, so the declared palm normal is -X on
      the left and +X on the right.
    - The 17 skeleton bone names and their `BASE_JOINTS` rest-pose values in world meters:
      `hips [0, 0.351, 0]`, `spine [0, 0.44, 0]`, `chest [0, 0.53, 0]`, `neck [0, 0.63, 0]`,
      `head [0, 0.777, 0]`, `upperarm.L [0.085, 0.623, 0]`, `forearm.L [0.105, 0.49, 0.006]`,
      `hand.L [0.13, 0.368, 0.015]`, `upperarm.R [-0.085, 0.623, 0]`,
      `forearm.R [-0.105, 0.49, 0.006]`, `hand.R [-0.13, 0.368, 0.015]`,
      `leg.L [0.042, 0.351, 0]`, `shin.L [0.046, 0.214, 0]`, `foot.L [0.048, 0.035, 0.02]`,
      `leg.R [-0.042, 0.351, 0]`, `shin.R [-0.046, 0.214, 0]`,
      `foot.R [-0.048, 0.035, 0.02]`. The five pinned joint heights are the shoulder 0.623 m, the
      hip 0.351 m, the knee 0.214 m, the wrist 0.368 m, and the ankle 0.035 m.
    - The clip name is `idle`, 2.4 s, looped, with the chest and head sway of the adult base.
    - The base builds six bodies: `head-skin`, `torso-skin`, `arms-skin`, `legs-skin`, `feet-skin`,
      and `hands`. The hands are one body with the palms toward the legs.
    - The commands and their exit codes:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-child-base.test.ts -t "pins|imports only"'
      # exit 0: 3 of 3 fixed-value cases pass; the 3 built-GLB cases stay skipped until T13
      node_modules/.bin/prettier --check assets/parts/humanoid-kim-child.ts
      # exit 0: all matched files use Prettier code style
      node node_modules/typescript/bin/tsc --noEmit
      # exit 2: 51 diagnostics in the baseline files; none sits in the new file
      ```

    - The built-GLB cases of the same file need Tom's GLB, so they run at T13.

- [x] T13 Green: Tom. Commit `1e1d3ab7a13445f9c58f129521c03a400310ea4c`. File: `assets/sprout-tom-kim.ts` (new). The commit also changes `assets/parts/humanoid-kim-child.ts` (the base edits that the render forced) and `tests/fixtures/preset-pin.json` (one new key).
  - Build the identity of the spec on the child base: brown tousled hair with a side tuft, freckles,
    an open smile, a blue-and-orange striped tee, green shorts, white socks, and grey sneakers. The
    freckles are paint on the child face. Declare `variants` with a `hair` slot, one preset `tom`,
    and `castMeta` (no marks).
  - Shape loop as T6. The flat front render is the first check of the child base.
  - Done-when:
    - the build and the two level renders exit 0,
    - `tests/sprout-tom-kim.test.ts` exits 0 with the eleven rows of `TABLES.child`, row limits equal
      to the table, and both palms ok,
    - `tests/sprout-child-base.test.ts` passes its inventory cases on the built Tom GLB: 17 joints
      with the named set, each built joint within 0.002 m of `BASE_JOINTS`, the fingertip within
      0.005 m of `BASE_HANDS.L.fingerTip`, one `idle` clip, one `hands` body,
    - `./forge check sprout-tom-kim` ends `result ok`,
    - the panel script writes Tom's panel at `out/chibi-sprouts/cast/sprout-tom-kim-panel.png`,
    - the preset pin adds exactly the key `sprout-tom-kim` and changes no value,
    - `prettier --check` and the type check are clean for the new files.
  - Record: the eleven rows, the three-difference rounds, the base edits that the render forced, the
    absolute landmark values, the Green model id and family, and the pin key check.

  - Evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `aed0bcc0c3562de1def0242a29d35dd3dca31b68`, role base
    `1e1d3ab7a13445f9c58f129521c03a400310ea4c` for the second commit, Green route
    `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family minimax):
    - The eleven rows of `TABLES.child` from
      `out/chibi-sprouts/cast/sprout-tom-kim-measure.json`: `heightInHeads 2.896269`,
      `armToTorso 1.231832`, `legShare 0.335199`, `headToShoulders 2.133754`, `wrist -0.124088`,
      `fingertips 0.430649`, `eyeLine 0.647224`, `eyeHeight 0.141011`, `spacingHead 0.310345`,
      `eyeWidthFace 0.228856`, `spacingFace 0.492537`. Every row sits inside the child table, every
      row limit equals the table, both palms are ok, and no guard fired.
    - The four look rounds and their three largest differences, read from the flat front render
      against `docs/sprout-mockups/tom.jpg`:
      1. the hair was a speckled patch over a bald skull, the nose floated in front of the face,
         and the shorts lost their legs; so the head volume of the base became the narrow face of
         the drawing, the nose moved onto the face surface, and the shorts' hem kept the sign of
         its cut.
      2. the hair read as a smooth helmet, the neck showed as a long thin column, and the shoulders
         showed skin notches; so the hair became a solid shell over the cranium, the neck grew
         thicker and shorter, and the sleeve started under the shoulder cap.
      3. the hair had no locks, the shorts read as one green block, and the face was too narrow at
         the jaw; so four locks and two side locks were added, the shorts' legs tapered so a gap
         shows between them, and the chin grew wider.
      4. the eye whites were small, the jaw was pointed, and the sleeves ran past the elbow; so the
         whites grew, the chin grew, and the sleeve hem moved up. The final render reads as Tom:
         brown tousled hair with a side tuft, freckles, an open smile, a blue-and-orange striped
         tee, green shorts, white socks, and grey sneakers.
    - The base edits that the render forced, all in `assets/parts/humanoid-kim-child.ts`:
      - The drawing's 501 px head width covers the hair, and its 325 px face width covers the bare
        face. The base head is therefore the narrow face: the cranium is `headRX 0.1327`,
        `headRY 0.1815`, `headRZ 0.11` at `headY 0.8685`, so the crown is 1.050 m and the chin is
        0.687 m. The hair mass carries the 0.367 m head width.
      - The neck is a capsule of radius 0.055 m, so the child has no long thin neck.
      - The upper arm cone starts at y 0.600 m, so the sleeve covers the shoulder cap and no skin
        shows at the shoulder.
      - The hand landmarks use the measured mesh: `palmCentre.L [0.132, 0.341429, 0.032526]` and
        `palmCentre.R [-0.132, 0.341691, 0.032795]` are the two mesh centroids, so the declared palm
        normal is -X on the left and +X on the right; `fingerTip.L [0.136998, 0.292001, 0.017898]`
        and `fingerTip.R [-0.136595, 0.292017, 0.017898]` are the lowest left and right vertices, so
        the built fingertip matches the module within 0.005 m. The thumb tip is
        `[0.148, 0.352, 0.0705]`, which is 0.57 mm from the nearest vertex of the mesh.
      - The absolute landmark values stay as T12 recorded them: `BASE_CROWN_Y` 1.05 m,
        `BASE_CHIN_Y` 0.687 m, and the five pinned joint heights 0.623 m, 0.351 m, 0.214 m,
        0.368 m, and 0.035 m.
    - The GLB stats: `sprout-tom-kim: 43,252 triangles, 0.37 x 1.071 x 0.297 m`, 17 bones, one
      `idle` clip of 2.4 s, 15 bodies (`head-skin`, `torso-skin`, `arms-skin`, `legs-skin`,
      `feet-skin`, `hands`, `face`, `hair`, `tee`, `collar`, `shorts`, `socks`, `sneakers`,
      `sneaker-sole`, `laces`).
    - The five artifact hashes, taken after the lit render:

      | Artifact                | SHA-256                                                            |
      | ----------------------- | ------------------------------------------------------------------ |
      | `sprout-tom-kim.glb`    | `c34ad6cf7b37100c2bb21409cd4a39e747c3e72455d20ddc2ddfe7879c859dc0` |
      | `flat/front-level.png`  | `4808126d83087077fd72ea34ca40cc03699d576f96b3c6d3c9ae1e1a7afe1863` |
      | `flat/side-level.png`   | `4ab16981fbab029517dabbf0a0d961bd16bed6a6eba957574e34a4050c0febc3` |
      | `views/front-level.png` | `5467eabd57beb572e74c4ee93aae0402799b019b8fc7c8cbf454d268e4c11ee5` |
      | `views/side-level.png`  | `20e686f643bba772eed37ff46edc996fef4fd78b43492c1f875851d71427ce54` |

      The raw `stats.json` SHA-256 (traceability only, never an equality check) is
      `cd2672c349831da3a999378292991b3bcad9562cc58a9bf343abc1a3a2c1c4c1`. The stable stats
      projection (every `milliseconds` key removed at any depth, `texture` keeps `size` only,
      canonical JSON with sorted keys) hashes to
      `dd78673b407dfdbb513f99d466f1f6bb8b4924166d8bc39ef2927511da25dbbf`. The projection holds the
      name `sprout-tom-kim`, 43,252 triangles, the bounds min `[-0.186, -0.002, -0.153]` and max
      `[0.184, 1.069, 0.144]`, the size `[0.37, 1.071, 0.297]`, `texture` null, 17 bones, the
      animations `[{ name: idle, duration: 2.4 }]`, and the fifteen bodies:

      | body         | gridPoints | evaluatedPoints | rawTriangles | triangles |
      | ------------ | ---------- | --------------- | ------------ | --------- |
      | head-skin    | 4127673    | 908014          | 186060       | 5660      |
      | torso-skin   | 98769      | 82877           | 17256        | 1518      |
      | arms-skin    | 164025     | 86514           | 17776        | 1396      |
      | legs-skin    | 91225      | 74377           | 17608        | 1160      |
      | feet-skin    | 50225      | 36751           | 8000         | 1418      |
      | hands        | 1395225    | 194957          | 42544        | 14762     |
      | face         | 3066745    | 544902          | 106993       | 5266      |
      | hair         | 3374721    | 815233          | 181648       | 4346      |
      | tee          | 215865     | 129132          | 30012        | 2300      |
      | collar       | 18081      | 15571           | 2864         | 946       |
      | shorts       | 114513     | 67012           | 12892        | 1268      |
      | socks        | 50225      | 37656           | 8144         | 1050      |
      | sneakers     | 69825      | 51520           | 11432        | 1520      |
      | sneaker-sole | 54145      | 42772           | 11292        | 252       |
      | laces        | 21097      | 11675           | 1984         | 390       |

    - The measure record is `out/chibi-sprouts/cast/sprout-tom-kim-measure.json`, SHA-256
      `2f1ddec8effac72f4e7eb77a612dfd304b039184569af698864caf06b10055d8`. Its five artifact hashes
      and its `baseSha256` match the files on disk.
    - The panel is `out/chibi-sprouts/cast/sprout-tom-kim-panel.png`, 1416 x 900, SHA-256
      `727eaa71914c2f1aad8f5dd91ca81ccd8ac41a682f4acfebec616e20aa025bc4`. Its caption holds
      `11/11 rows pass; palms ok` and `cropped: front no, side no, drawing no`.
    - The pin key check: `scripts/make-preset-pin.mjs` writes the key `sprout-tom-kim` with the
      `tom` preset (`skin fair`, `hair brown`, `eyes brown`, `cloth blue`). The committed pin file
      was restored to its committed bytes and only that key was added, so the diff is 31 added lines
      and no changed value. The stale `wizard-argon-trial` key stays.
    - The commands and their exit codes:

      ```bash
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge build sprout-tom-kim --fast'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge render sprout-tom-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge render sprout-tom-kim --fast --views front-level,side-level --ortho --bg none --size 1024'
      # exit 0
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/tsx scripts/proportion-check.mjs --asset sprout-tom-kim --base humanoid-kim-child --table child --record out/chibi-sprouts/cast/sprout-tom-kim-measure.json'
      # exit 0: 11 of 11 rows pass, both palms ok, no guard
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-child-base.test.ts tests/sprout-tom-kim.test.ts'
      # exit 0: 7 of 7 cases pass over 2 files
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge check sprout-tom-kim'
      # exit 0: result ok, no held item passes through the head, the ground check is ok
      HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/sprout-cast-panel.mjs --asset sprout-tom-kim'
      # exit 0: the panel is 1416 x 900 and no cell is cropped
      node_modules/.bin/prettier --check assets/parts/humanoid-kim-child.ts assets/sprout-tom-kim.ts tests/fixtures/preset-pin.json measure/tracks/chibi_sprouts_cast_20261125/plan.md
      # exit 0: all matched files use Prettier code style
      node node_modules/typescript/bin/tsc --noEmit
      # exit 2: 51 diagnostics in the baseline files; none sits in the two asset files
      ```

    - **Red finding F1 (the stale Phase 1 case, for the next Red round).**
      `tests/proportion-cast-options.test.ts` case `child base is checked as a file before any
import` runs the real script on the real tree and expects the output
      `base humanoid-kim-child: not built`. T12 delivers `assets/parts/humanoid-kim-child.ts`, so
      the case now reaches the measurement and fails with `hand L: palm patch: empty` instead. The
      case proves the spec rule "the base file is checked before any import" only while the child
      base is absent. Green cannot repair it: the test file is Red's, and the spec AC1 rule 10 asks
      for the absent case. The case needs a scratch tree without the child base, or another absent
      base stem. The full cast run of 2026-11-26 exits 1 with that one case failing and 117 of 118
      cases passing over 10 files.

- [ ] T14 Green: Lily. File: `assets/sprout-lily-kim.ts` (new).
  - Build the identity of the spec: a brown bob to the jaw with straight soft bangs, an open smile,
    a blue tee with a white Peter Pan collar, a red pleated skirt, white mid-calf socks, and red
    sneakers. Declare `variants` with a `hair` slot whose first option is her brown, one preset
    `lily`, and `castMeta` (no marks).
  - The bob keeps the eye band clear. The bangs sit above the brow. No hair crosses the chin. The
    lessons of the scrapped Lily rounds apply: no chin wrap, no jaw wedge, no ear cover, and a thin
    cut edge.
  - Shape loop and gates are T13's, with her own file and key.
  - Done-when: T13's list for `sprout-lily-kim`, plus the three Lily guards pass in the flat front
    and side views, and no hair is in front of the chin in the side view.
  - Record: T13's record for her, plus the three guard results, the declared hair colour, and the bob
    measurements.

- [ ] T15 Measure: The two child look judges.
  - The brief, the binding, the input check, and the record are T9's, one per child. The base commit
    and base hash are the shared child base, so a base change voids both child verdicts.
  - Done-when: `judge-<name>.json` exists for Tom and Lily, every judge input of spec "The gate
    check of the judge inputs" matches, and both scores are 7.5 or more. A lower score returns the
    phase to the Green task of that character. Round 2 runs only after a failing score or a changed
    input. A second score below 7.5 escalates to the PM.
  - Record: T9's record for each.

- [ ] T16 Measure: The Phase 3 gate.
  - Done-when: the two pins exit 0, the two judges pass, every judge input of spec "The gate check of
    the judge inputs" is verified at the gate HEAD, including the shared child base commit and hash,
    `./forge check` ends `result ok` for each asset, the preset pin holds two new keys and no changed
    value, the child base imports only `src/index.js`, `./measure/generate.sh` exits 0, and
    `./measure/doctor.sh --structural-only` exits 0.
  - Record: the commands, the verdicts, each verified input, the hash pairs, and the pin diff.

## Phase 4: The panels and the handoff

- [ ] T17 Measure: The cast sheet, the panel check, and the handoff.
  - The five panels already exist from T6 to T8 and T13 to T14. This task does not rewrite a panel,
    because a new date would change its bytes and void its judge record.
  - Run `scripts/sprout-cast-panel.mjs --sheet` to write `out/chibi-sprouts/cast/cast-sheet.png`
    without a panel. `--sheet` never writes a panel. Run `--all` only when a panel is missing. A
    missing panel returns the character to its Green task and to a fresh judge.
  - Done-when:
    - the five panels and the sheet exist,
    - each panel is 1416 × 900 with three cells, the 700 px band, and the baseline at row 780,
    - each panel hash equals the `panel_sha256` of its judge record,
    - the sheet is 1544 × 900, holds five figures at 466.667 px per metre with one baseline, and its
      caption names the five and Mom,
    - the sheet and panel cells hold the crop state of spec "The horizontal crop",
    - the handoff note `measure/runs/chibi_sprouts_cast_20261125/handoff.md` holds the five panel
      paths and SHA-256 sums, the sheet path and SHA-256, the eleven rows per asset, the five judge
      records, and the sentence "No customer-facing claim is made.",
    - the note names Daniel's look as the last gate.
  - Record: the paths, the SHA-256 sums, the panel sizes, the baselines, the crop states, and the
    note path.

- [ ] T18 Measure: The Phase 4 gate, the project gate, and the closeout record.
  - Done-when:
    - `tests/sprout-cast-panel.test.ts` passes,
    - the five real panels and the sheet exist, and the record holds their sizes, their projected
      rows, their hashes, their baselines, and their crop states,
    - every judge input of spec "The gate check of the judge inputs" still matches at the final gate,
    - a role that did not write the panel script reads the sheet and records what it sees,
    - `PROJECT_TESTS` exits 0 with the TD-40 exclusion,
    - `PROJECT_LINT` and `PROJECT_CHECKS` exit 0,
    - `./measure/generate.sh` exits 0 and `./measure/doctor.sh` exits 0,
    - the plan records the lane and the acceptance record for the closeout of spec "The closeout
      path".
  - Record: the reporter lines, the sheet look record, the verified judge inputs, and the doctor
    line.

- [b] T19 Measure: Record the PM's answer. deferred:pm trigger: event the PM answers. Human gate.
  - This task is blocked until the PM answers. No role starts it. The PM owns the answer.
  - The task records the handoff date, the PM's word, and the next step. An approval closes the
    character work and opens the closeout. A change list returns the named character to its Green
    task and to a fresh judge.
  - Done-when: this plan holds the handoff date, the PM's word, and the next task. The PM's word
    gates any external use of the five assets.
  - Record: the date, the answer, and the closeout or the return.

## Known limits

- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. Each task records its error count
  before and after and requires no error in its changed files.
- `PROJECT_TESTS` excludes `tests/storytime-book-pictures.test.ts` while TD-40 is open.
- The proportion check reads a render. A camera change or a frame change moves every row.
- The eye detector fails with a named error when an eye joins the skin, the brow, the hair, or an
  undeclared face mark.
- The child table is wide, because each drawing has one front view.
- The judge is one opinion. Daniel's look is the last gate.
- A change to the shared child base voids both child verdicts, so Tom and Lily are judged after the
  base is final.
- `stats.json` holds elapsed milliseconds, so only its stable projection is compared. The raw hash is
  traceability only.
- A panel captions its crop state. A run with a different window writes different bytes, so a
  judge is bound to the crop.
- The preset pin is a shared file. A task compares parsed JSON and requires one new key per asset
  and no changed value.
- A panel caption holds its date. A later run writes different bytes, so the panel must not be
  regenerated after its judge without a fresh judge.
- The outputs are not in git. A fresh worktree runs T0 and every missing Green build again.
