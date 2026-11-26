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

- [x] T0 Measure: Prepare the worktree outputs and the baselines. Commit
      `c562992b18be32bb60a756b63158d713a706aefb`.
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

- [~] T1 Red: Pin the measuring options, the tables, the fixtures, the panel script, and the
  isolation baseline.
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
        iris colour fails with `faceMarks glasses: too close to the eye paint`.
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
      joins the eyes in `#3b2a1e`; the close-colour case uses `#6e4020`. Lily hair is `#7a5230` at
      the chin, side chin, or eye window. The missing-hair CLI case runs a copied script in
      `/tmp/opencode` with copied Mom outputs.
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

- [~] T2 Green: Add the options, the tables, the rounded crown, the destinations, the face-mark
  exclusion, and the panel script.
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

  - Evidence (2026-11-26, worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast`, branch
    `chibi-sprouts-cast`, phase base `5356e78730daefd5225f9733f190dc6bb631b90d`, role base
    `ad43039a073d5cf61f5c3ebac787856e9970d7a4`, implementation commit
    `41458a54a0282af2e062a1ed8a213f71856d7a40`, Green route
    `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family minimax):

    - Implementation commit `41458a54a0282af2e062a1ed8a213f71856d7a40`, three files:
      `scripts/proportion-check.mjs`, `scripts/sprout-cast-panel.mjs` (new),
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
    - The T2 gate is not met, so T2 stays `[~]`. The next role is a Mid Red retry for R1 and R2,
      then a Green re-run on the same implementation commit.

- [ ] T3 Measure: One adversarial round on the two scripts.
  - It reads the T2 commit and attacks the table selection, the row-limit rule, the base name, the
    record and panel destinations, the crown rounding and mask tolerance, the face-mark exclusion,
    the Lily guards, the panel scale and headroom, the horizontal crop and the head-fit rule, the
    sheet-only route, and the linked output. Report-only. It changes no file.
  - Done-when: the round writes
    `measure/runs/chibi_sprouts_cast_20261125/adversarial-p1-<sha>.json` with one finding per fault,
    a severity per finding, and a verdict. It names the audited commit.
  - Record: the audited commit, the findings, the severity of each, and the dispositions.

- [ ] T4 Measure: The Phase 1 gate.
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

## Phase 2: The adult variants

- [ ] T5 Red: Pin Dad, Grandma, and Grandpa.
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

- [ ] T6 Green: Dad. File: `assets/sprout-dad-kim.ts` (new).
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

- [ ] T7 Green: Grandma. File: `assets/sprout-grandma-kim.ts` (new).
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

- [ ] T8 Green: Grandpa. File: `assets/sprout-grandpa-kim.ts` (new).
  - Build the identity of the spec: a bald crown with white side hair, round dark-brown glasses, a
    white moustache, an open smile, a green V-neck sweater over a pale green collared shirt, brown
    trousers, and brown shoes. The glasses and the moustache are paint. Declare `variants`, one preset
    `grandpa`, and `castMeta.faceMarks.glasses` with a colour more than 24 from the eye paint. Add the
    face layer that recreates the two eyes, per spec "The face layer and the paint".
  - Shape loop and gates are T6's, with his own file and key.
  - Done-when: T6's list for `sprout-grandpa-kim`, plus no warning line from the glasses paint, two
    eye components separate from the frame and the moustache, and the record's `faceMarks`.
  - Record: T6's record for him, plus the eye-component result and the declared face marks.

- [ ] T9 Measure: The three adult look judges.
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

- [ ] T10 Measure: The Phase 2 gate.
  - Done-when: the three pins exit 0, the three judges pass, every judge input of spec "The gate
    check of the judge inputs" is verified at the gate HEAD, `./forge check` ends `result ok` for
    each asset, the preset pin holds three new keys and no changed value, `./measure/generate.sh`
    exits 0, and `./measure/doctor.sh --structural-only` exits 0.
  - Record: the commands, the three verdicts, each verified input, the hash pairs, and the pin diff.

## Phase 3: The children

- [ ] T11 Red: Pin the child base, Tom, and Lily.
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

- [ ] T12 Green: The child base. File: `assets/parts/humanoid-kim-child.ts` (new).
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

- [ ] T13 Green: Tom. File: `assets/sprout-tom-kim.ts` (new).
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
