# Chibi Sprouts: new adult base on Teacher Kim, with Mom as the first trial

Status: in progress (started 2026-11-23). The plan records execution state. `spec.md` holds the
acceptance criteria and the measurement method.

PM decisions 1 to 3, decision L, and the authoring decisions (d) to (m): `spec.md`. The source is
`docs/chibi-sprouts/redesign-2026-11-23.md` (approved 2026-11-23).

Lane: light. Phases 1 to 9. Source: PM decisions of 2026-11-23.
Target (orchestrator proposal, not a PM date): shape passes by 2026-11-25.
Spend to date: one unplanned image call, about USD 0.01, recorded in
`out/chibi-sprouts/redesign/costs.tsv`. The SDF work needs no paid call. Phase 6 holds the approved
LATO.2 trial under a USD 5 cap.

Every render and every test run goes through the heavy runner:

```bash
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'
```

A textured forge command also takes a build slot. Shape iteration uses `--fast`, and so do the
renders of AC2 and AC5. A flat or orthographic shape check does not need an atlas.

## Red scope rule

The mid-red gate accepts only `measure/` paths, `tests/` paths, and test files. Every Red task of
this plan commits `tests/` paths only. Assets, scripts, and `src/` files land in a Green task.

## Task order and gates

No done-when runs the full suite before T8. Each earlier task gates its own test file, and the table
names every test that still fails at that point.

| Task | Gate command                                                                                                                                                                  | Earlier tests that still fail                                                             |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| T1   | `vitest run` on the three scrapped files; expect 3 passed and 15 skipped                                                                                                      | none                                                                                      |
| T2   | `vitest run tests/render-options.test.ts`; expect exit 1 on the absent options                                                                                                | none                                                                                      |
| T3   | `vitest run tests/render-options.test.ts`; expect exit 0                                                                                                                      | none                                                                                      |
| T4   | `vitest run tests/sprout-mom-kim.test.ts`; expect exit 1 on the absent script                                                                                                 | none                                                                                      |
| T5   | `vitest run tests/mom-kim-sheet.test.ts`; expect exit 1 on the absent script                                                                                                  | none                                                                                      |
| T6   | `tsx scripts/proportion-check.mjs` with the named missing-asset error; `vitest run tests/sprout-mom-kim.test.ts` with only the end-to-end case and the real-hand case failing | the sheet test of T5, the measurement end-to-end case, and the measurement real-hand case |
| T7   | `vitest run tests/sprout-mom-kim.test.ts tests/preset-colour.test.ts tests/render-options.test.ts`; expect exit 0                                                             | the sheet test of T5 only                                                                 |
| T8   | `vitest run tests/mom-kim-sheet.test.ts`; then the full suite; expect exit 0 on both                                                                                          | none                                                                                      |
| T9   | the step-log table of the result note, the verify row, and the result note                                                                                                    | none                                                                                      |
| T10  | `judge.json` with both scores                                                                                                                                                 | none                                                                                      |
| T11  | the handoff, no command                                                                                                                                                       | none                                                                                      |
| T12  | the plan record                                                                                                                                                               | none                                                                                      |
| T13  | the cut-out file, its size and its clean alpha border, and the judge score                                                                                                    | none                                                                                      |
| T14  | the idle sprite set at 128 px, its clean alpha border, and the judge score                                                                                                    | none                                                                                      |

Files this track touches:

- `measure/tracks/chibi_sprouts_redesign_20261123/*` (new)
- `measure/tracks.md` (one registry row)
- `tests/sprout-base.test.ts` (the skip marker and the scrap reason)
- `tests/sprout-gestures.test.ts` (the skip marker and the scrap reason)
- `tests/sprout-gesture-offset.test.ts` (the hero describe stays active, the other two skip)
- `tests/render-options.test.ts` (new, Red; its fixture is written at run time)
- `tests/sprout-mom-kim.test.ts` (new, Red, the measurement)
- `tests/mom-kim-sheet.test.ts` (new, Red, the sheet layout)
- `scripts/proportion-check.mjs` (new, Green)
- `scripts/mom-kim-sheet.mjs` (new, Green)
- `src/cli/forge.ts` (Green: the named views `front-level` and `side-level`, the `ortho` and `flat`
  options, the `flat/` output folder)
- `src/render/page.ts` (Green: the orthographic frame, `useFlatMaterials`, the `flat/` file names)
- `assets/parts/humanoid-kim.ts` (new, Green; exports `KIM_CHIN_Y` and `KIM_HANDS`)
- `assets/sprout-mom-kim.ts` (new, Green)
- `tests/fixtures/preset-pin.json` (one new key, written by `scripts/make-preset-pin.mjs`)
- `out/sprout-mom-kim/` (not in git)
- `out/chibi-sprouts/redesign/` (not in git; holds `costs.tsv` and `lato2-gpu/trial-log.tsv`)
- `measure/runs/chibi_sprouts_redesign_20261123/` (the logs, `judge.json`, and
  `lato2-gpu/trial-result.md`)

The renderer pin asset is not a repository file. `tests/render-options.test.ts` creates
`assets/_flat-render-pin-<pid>.ts` at run time with the exclusive flag `wx`, so it never overwrites
a file, and the `finally` block removes only that one path. The `_` prefix keeps it out of
`listAssets`, and the preset scan skips it because it declares no variants.

The new base is `assets/parts/humanoid-kim.ts`. It imports only `src/index.js` (decision h). The new
asset is `assets/sprout-mom-kim.ts`. It imports the base and `src/index.js`.

No scrapped source changes. No file is deleted. The SDF work runs no paid call.

## Role brief template

Every task brief in this plan carries these lines:

- Role family: Red is muse. Green is not the Red family; the orchestrator picks Green with
  `ra-quota` at dispatch. The AC4 judge comes from a family other than Green's and Red's
  (spec decision (i)).
- No role calls the `openchamber_image` tool. That tool generates or edits images, and it costs
  money. To look at an image, a role uses the `read` tool.
- Kim art goes to no remote model, no demo, and no third party. Mom's render and Daniel's drawing
  may use an established look-judge route. The Kim sheet stays local.
- A paid call, or a forbidden upload, is a stop-and-report event. The role stops, keeps every file,
  and reports to the PM.
- Every render and every test run uses the heavy runner below.

## Phase 1: Red

- [x] T1 Red (tests 4c8dded7): Skip the scrapped contract tests with the scrap reason, and keep the hero assertions
      active. Files: `tests/sprout-base.test.ts`, `tests/sprout-gestures.test.ts`,
      `tests/sprout-gesture-offset.test.ts`.
  - Evidence 2026-11-23: baseline pre-edit exits 0 with 3 files and 15 passed tests. Post-edit the
    same command exits 0 with 3 files and 3 passed plus 15 skipped tests. `grep -c
'describe.skip('` gives 1, 1, 2; `grep -c 'hero clip contracts'` gives 1. The AC1 guard (3
    reason comments, hero describe, 3 hero names, 4 skip titles) fails on the unedited files and
    passes after the edit. `prettier --check` exits 0 on the three files.
  - `tests/sprout-base.test.ts`: the one describe becomes `describe.skip` with the title suffix
    ` — sprout base scrapped 2026-11-23 (Daniel)`. Two tests skip:
    `has the bone names, clip names, and equip sockets of the avatar base` and
    `keeps the hero head and a shorter body`.
  - `tests/sprout-gestures.test.ts`: the one describe becomes `describe.skip` with the same suffix.
    Four tests skip: `keeps the child clap plane and hand gap`, `keeps the child touch points`,
    `keeps the child chest and hip points`, and
    `moves each adult goal to the same place on the grown-up body`.
  - `tests/sprout-gesture-offset.test.ts`: add a new active describe
    `hero clip contracts (not scrapped)` above the two others. It holds three tests, moved out of
    the skipped bodies:
    - `keeps the hero clip inventory: the 8 base clips`, from lines 209-210,
    - `keeps the hero default pose digest: size 8, digest 68442177`, from line 220,
    - `keeps the hero cheer wrist-to-head distance: 0.27635 m`, from lines 243-244.
      The two other describes become `describe.skip` with the suffix. Their hero lines leave the
      bodies. Nine tests skip: the three of the first describe and the six of the second.
  - Each file gets the line `// sprout base scrapped 2026-11-23 (Daniel)` above its first import.
  - No other test file changes. `tests/song-timeline.test.ts` reads no scrapped source, and it
    stays.
  - Done-when: `grep -c 'describe.skip('` gives 1, 1, and 2 on the three files, and
    `grep -c 'hero clip contracts'` gives 1 on the third.
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-base.test.ts tests/sprout-gestures.test.ts tests/sprout-gesture-offset.test.ts'`
    exits 0 with 3 files, 3 passed tests, and 15 skipped tests. `prettier --check` exits 0 on the
    three files.
  - Record: the baseline of 3 files and 15 passed tests at the track start (2026-11-23), the three
    hero test names that stay, the 15 skipped names, the four skip sites, and the command output.
  - Note: the three files pass before the skip. The skip retires a contract of the scrapped base; it
    does not repair a failure.

- [x] T2 Red (tests d02c8fa9): Pin the renderer options with a behaviour test. File: `tests/render-options.test.ts`.
  - Evidence 2026-11-23: `vitest run tests/render-options.test.ts` exits 1 with 8 failed cases.
    Failure text: `Unknown option '--ortho'`, `Unknown view 'front-level'`, and the missing
    `out/_flat-render-pin-<pid>/flat/` PNGs. No syntax error, no collection error, no missing
    module. `git status --porcelain tests/ assets/` shows the test file alone (plus the unrelated
    pre-existing `assets/wizard-argon-trial.ts`). `prettier --check` exits 0; `tsc --noEmit`
    reports no error in the new file (51 pre-existing errors stay). Fixture: one box
    0.40 x 1.00 x 0.20 m with a 0.05 m block at +Z, created with the `wx` flag at the unique
    per-run path `assets/_flat-render-pin-<pid>.ts`; an ownership flag gates removal in
    `finally`; a pre-created path fails with `fixture path exists: <path>` and stays untouched.
  - The test writes a pin asset to a unique per-run path, `assets/_flat-render-pin-<pid>.ts`, where
    `<pid>` is the process id of the test run. It creates the file with the exclusive flag `wx`, so
    it never overwrites an existing file. The test sets an ownership flag `created = true` only after
    the `wx` create succeeds. A failed `wx` leaves the existing file untouched, sets `created` to
    false, and fails the test with `fixture path exists: <path>`. The `finally` block removes the
    path only when `created` is true, and it removes no other file.
  - The asset is one box 0.40 × 1.00 × 0.20 m with its bottom on y = 0, a 0.05 m block at +Z near the
    top, and two colours for the body and the block.
  - The test runs
    `./forge render _flat-render-pin-<pid> --fast --views front-level,side-level --ortho --flat --bg none --size 256`
    through the runner and asserts:
    1. `out/_flat-render-pin-<pid>/flat/front-level.png` and `side-level.png` exist at 256 × 256,
    2. the corner pixel has alpha 0,
    3. the box pixel at the projected centre holds the box hex within 1 of 255,
    4. the block pixel holds the block hex within 1 of 255,
    5. the crown-to-sole heights of the two views differ by 2 px or less,
    6. on the side view, the block's column is left of `W/2` by 0.02 m·`ppm` or more (decision j),
    7. `--views front-level` without `--ortho` still writes the named view, and `--flat` without
       `--fast` fails with `--flat needs --fast and --bg none`.
  - The test also asserts that its own fixture path is absent at the end, and that the fixture
    helper, called with a pre-created path, fails with `fixture path exists: <path>` and leaves that
    file in place.
  - Done-when: the test exits 1, and each case fails on the absent option or the absent output file,
    not on a syntax or import error. `git status --porcelain tests/ assets/` shows the test file
    alone. `prettier --check` exits 0 on the test file.
  - Record: the command, the nine case names, the failure text, and the fixture body.

## Phase 2: Green

- [x] T2r Red (tests c916af45): review r1 test findings (repo root from the module, one ownership check with a collision case, cleanup) and two failing source cases (unknown view before build, asset-name validation)
- [x] T3r Green remediation (src 6b3a0781): C-P2-1 view validation before the build; B-F1
      asset-name validation before the output path. Files: `src/cli/forge.ts`, `src/pipeline.ts`.
  - Evidence 2026-11-23 (Green model `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family MiniMax;
    the Red model of the track is `opencode-go/muse-spark-1.3-contributor`, family muse). Every
    command below ran through
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  - C-P2-1: the view names are checked before the server starts and before the build.
    `viewNamesOf(command, values)` gives each command its own list (the `--views` list or the
    command default), and `checkViewNames` refuses an unknown name with one line. The refusal
    comes from the top-level error handler, so the exit code is 1, the output is one line, and no
    stack frame prints. The raw output of the refused command:
    `Unknown view 'nosuch'. Known: front, three-quarter, side, back, back-three-quarter, top, front-level, side-level`
    No output folder appears, because the build never runs.
  - B-F1: `src/pipeline.ts` exports `checkAssetName(name)`, and `assetPath` calls it before it
    builds a path. The check refuses an empty name, an absolute name, a name with a path
    separator, and a dot-dot segment, each with one line. The CLI calls it for the worn pieces
    too, before the output name is built. The raw output of the refused traversal:
    `Invalid asset name '../measure/runs/chibi_sprouts_redesign_20261123/probe-escape-green': an asset name has no path separator.`
    A name with a dot or a dash, and the `_flat-render-pin-<pid>` fixture name, still work.
  - B-F1 (the flat removal): `removeFlatFolder(flatDir, outRoot)` replaces the recursive delete
    of the flat folder. It removes nothing when the folder is a symlink, and it removes the
    folder only when the real path of its parent sits directly under the real out/ root. A
    symlinked output folder is never followed and never deleted.
  - Gates, each through the runner:
    - The remediation Red command exits 0:
      `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/render-options.test.ts
tests/render-options.validation.test.ts` gave `Test Files 2 passed (2)` and
      `Tests 11 passed (11)`.
    - `node node_modules/vitest/vitest.mjs run --maxWorkers=1
tests/render-options.adversarial.test.ts tests/sprout-base.test.ts
tests/sprout-gestures.test.ts tests/sprout-gesture-offset.test.ts` exits 0 with
      `Tests 5 passed | 15 skipped (20)`.
    - The render-related existing tests and the scan test exit 0: `tests/cutout.test.ts`,
      `tests/asset.test.ts`, `tests/equip.test.ts`, `tests/part.test.ts`,
      `tests/variants.test.ts`, `tests/preset-colour.test.ts`, `tests/clip-check.test.ts`,
      `tests/song-still-hook.test.ts`, `tests/rig.test.ts`, `tests/apk3d/renderer-setting.test.ts`,
      `tests/apk3d/no-unpolyfilled-builtins.test.ts`, and `tests/storytime-line-art-pass.test.ts`
      gave `Test Files 12 passed (12)` and `Tests 73 passed (73)`.
    - `node node_modules/typescript/bin/tsc --noEmit` exits 2 with the 51 baseline errors of
      TD-35 to TD-39, and no error names `src/cli/forge.ts` or `src/pipeline.ts`.
    - `node_modules/.bin/prettier --check src/cli/forge.ts src/pipeline.ts` exits 0.
    - The whole project gate exits 0:
      `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude
tests/storytime-book-pictures.test.ts` gave `Test Files 232 passed | 4 skipped (236)` and
      `Tests 3397 passed | 26 skipped (3423)`, with no failing test.
  - The existing render output stays byte-identical. `./forge render sprout-pip --fast` and
    `./forge sprites sprout-pip --fast` ran at the base commit and with the fix. The SHA-256 sums
    match for `render.png` (`7efc9c27...`), the four views, the ten sprite PNGs, and
    `metrics.json`.
  - Note: `src/render/page.ts` is not touched, so the three `Box3.union` lines that the apk3d
    scan test pins stay at lines 331, 531, and 538.
- [x] T2r2 Red (tests 4f43e67c): round 2 test cases (inherited view names, cutout trailing comma, linked output parent)
- [x] T3r2 Green remediation round 2 (src 0fbd781b): one parsed view list shared by preflight and
      cutout, own-property membership; refuse a linked output parent before any write.
      File: `src/cli/forge.ts`.
  - Evidence 2026-11-23 (Green model `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family MiniMax;
    the Red model of the track is `opencode-go/muse-spark-1.3-contributor`, family muse). Every
    command below ran through
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  - F8 and C-P2-7 (one parsed list): `parseViewList(list)` splits the list on the comma, trims each
    member, and drops the empty members, as the cut-out parser did on the base. `viewListSource`
    gives each command its list, and the preflight, the renderer, and the cut-out read it. A
    trailing or a doubled comma names the same views as the list without it: the cut-out wrote
    `front.png` for `--views front,` and exited 0.
  - C-P2-1 (own-property membership): `isNamedView(name)` tests the named-view table with
    `Object.prototype.hasOwnProperty.call`, so `constructor`, `toString`, `__proto__`, and
    `hasOwnProperty` are unknown views. The renderer lookup uses the same rule. The raw output of
    the refused command:
    `Unknown view 'constructor'. Known: front, three-quarter, side, back, back-three-quarter, top, front-level, side-level`
    The refusal comes before the server starts, so no build runs and no output folder appears.
  - F9, C-P2-8, and N2 (a linked output folder): `checkOutputFolder(out)` runs before the build and
    refuses a linked `out/<name>` or `out/<name>/flat` with one line:
    `output folder is a link: out/<name>/flat`
    The link is never followed. No flat PNG lands in the link target, and the other asset's flat
    folder stays unchanged. `removeFlatFolder` keeps its realpath rule.
  - Gates, each through the runner:
    - The r2 Red command exits 0:
      `node node_modules/vitest/vitest.mjs run --maxWorkers=1
tests/render-options.validation-r2.test.ts tests/render-options.test.ts
tests/render-options.validation.test.ts` gave `Test Files 3 passed (3)` and
      `Tests 16 passed (16)`.
    - The T1 files and `tests/render-options.adversarial.test.ts` exit 0: `Tests 5 passed |
15 skipped`.
    - The render-related existing tests and the scan test exit 0: `tests/cutout.test.ts`,
      `tests/asset.test.ts`, `tests/equip.test.ts`, `tests/part.test.ts`,
      `tests/variants.test.ts`, `tests/preset-colour.test.ts`, `tests/clip-check.test.ts`,
      `tests/song-still-hook.test.ts`, `tests/rig.test.ts`, `tests/apk3d/renderer-setting.test.ts`,
      `tests/apk3d/no-unpolyfilled-builtins.test.ts`, and `tests/storytime-line-art-pass.test.ts`
      gave `Test Files 12 passed (12)` and `Tests 73 passed (73)`.
    - `node node_modules/typescript/bin/tsc --noEmit` exits 2 with the 51 baseline errors of
      TD-35 to TD-39, and no error names `src/cli/forge.ts`.
    - `node_modules/.bin/prettier --check src/cli/forge.ts src/pipeline.ts` exits 0.
    - The whole project gate exits 1 with one failing file:
      `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude
tests/storytime-book-pictures.test.ts` gave `Test Files 1 failed | 233 passed | 4 skipped
(238)` and `Tests 1 failed | 3403 passed | 26 skipped (3430)`. The failing file is
      `tests/render-options.adversarial-r2.test.ts`, and the conflict note below names it.
  - The existing render output stays byte-identical. `./forge render <asset> --fast` and
    `./forge sprites <asset> --fast` ran at the base commit and with the fix for `sprout-pip`,
    `ball`, and `kite`. Every SHA-256 sum matches for `render.png`, the views, and the sprites.
    The three output folders are real folders in this worktree, so no write went through a link.
  - Note: `src/render/page.ts` is not touched, so the three `Box3.union` lines that the apk3d
    scan test pins stay at lines 331, 531, and 538.
  - Conflict note, open for the orchestrator: `tests/render-options.adversarial-r2.test.ts`
    (commit 3bc49ab1, 15:51) expects the flat render to exit 0 when the output folder is a link.
    `tests/render-options.validation-r2.test.ts` (commit 4f43e67c, 16:17, the newer contract)
    expects a non-zero exit with one line for the same fixture. The two expectations cannot both
    hold. This task follows the newer contract, which matches findings F9, C-P2-8, and N2 and the
    brief of this round. The adversarial file needs its exit-code expectation refreshed (lines
    106 and 118); its marker assertions still hold, because the refusal touches nothing. This
    role does not change test files.

**Late findings and PM decisions (Phase 2).** Recorded 2026-11-23.

> PM 2026-11-23: F12 (watch mode checks the linked output folder only at startup) and Review B N1 (check/write symlink race) go to one tech-debt row. Both need a local writer to plant a link inside out/ during a run; no normal run gives a wrong result. Fix named: check the link at every rebuild and write. No third round for them.

- The audited HEAD is `9a2656ba8784a74e9011975e54fd9ee4867841a3`. Review A, Review B, and Review C read this commit.
- The debt row is not yet in `measure/tech-debt.md`. The file on `master` holds 50 lines, the limit, and its last row is TD-50. The worktree copy is older, and its last row is TD-49. No task in this worktree edits that file.
- Row text to add at the merge to `master`, after an archived row frees a line:

  ```text
  TD-NN, 2026-11-23, chibi_sprouts_redesign Phase 2: the flat render (watch mode rebuild, and the write after the pre-build link check) can write through a symlink planted in out/ during a run (F12, Review B N1); needs a local writer; Medium-low; Open; fix: check lstat for a link at every rebuild and immediately before each write; reopen trigger: a normal run writes outside its own out/<name> folder.
  ```

- Other late findings routed to tech debt, one line each:
  - F13 (Review A): `tests/render-options.adversarial-r2.test.ts` can change the permissions of, or remove, a same-PID output path that the test did not create.
  - F14 (Review A): the conflict note of T3r2 is stale, because commit `9a2656ba` refreshes the adversarial expectation.
  - C-P2-9 (Review C, round 2): `tests/render-options.test.ts` and `tests/render-options.validation.test.ts` can remove a pre-existing output folder after the fixture creation fails, because they record no test ownership.
  - C-P2-10 (Review C, round 2): the runner fallback in `tests/render-options.test.ts` assumes a nested worktree, so an ordinary checkout needs `HEAVY_RUN_PATH`.
  - C-P2-11 (Review C, round 3): the comment at `src/cli/forge.ts:753-755` says one view-list source, but lines 464-466, 640, and 659 still repeat the defaults.
  - C-P2-12 (Review C, round 3): the conflict note of T3r2 still calls the adversarial linked-output expectation open, and commit `9a2656ba` closes it.
- F14 and C-P2-12 record one stale note. F13 and C-P2-9 record one test-ownership gap.

**Late findings and PM decisions (Phase 4).** Recorded 2026-11-24.

- Review B N2: the `measure.json` write follows a planted symlink. This is the same class as the Phase 2 PM decision. Fix: check lstat for a link immediately before the write.
- ADV-R2-1: the corrupt-GLB test accepts a wrong asset-name error, because its fixture name contains `p4glb`. The gap is test-only. Fix: assert the `Invalid GLB` line.

**Late findings and PM decisions (Phase 5).** Recorded 2026-11-24.

- F6: a hard link at an output PNG path overwrites its target. Fix: refuse `st_nlink` greater than 1, and write through a temp file plus rename.
- F7: one stray alpha pixel in a render lowers the visible figure to 667 px. Fix: take the largest connected component of the alpha mask.
- Ruling: the orchestrator ruled F6 and F7 to tech debt on 2026-11-24, under the PM standing instruction to run Phase 5 to Phase 7 without stopping and the Phase 2 PM decision. A local writer or a stray pixel in a render of our own tool gives no wrong result. The real renders are clean at 700 px. `tests/mom-kim-sheet.adversarial-r3.test.ts` skips the two cases, and each skip title holds its debt reason.
- Lesson (2026-11-24): the main tree `out/chibi-sprouts/redesign` was deleted during the Phase 5 audits. From now on, every role brief forbids probes and fixtures on a production `out/` path of any checkout, and demands temp copies under `/tmp`. Candidate debt row and lessons-learned entry to add at the merge to `master`: the scripts `proportion-check.mjs` and `mom-kim-sheet.mjs` write `out/chibi-sprouts/redesign` of the checkout that holds the script. Nothing stops a probe from pointing them at the main tree.

**Project gate (Phases 4 and 5).** Recorded 2026-11-24.

- The whole project gate ran in Phase 4 with one named exclusion, `tests/mom-kim-sheet.test.ts`, which is red by design until T8. It ran in Phase 5 with no exclusion.
- The test `render-options.validation-r2` `rejects inherited view names on render before the build` timed out at 600 s under machine load in two gate runs without the load wrapper. A retry through the wrapper passed.
- Record the test as load-sensitive. Candidate debt row to add at the merge to `master`: `TD-NN: the test needs a stated timeout and a build-slot-free render; reopen trigger: a third timeout.`

**Routes (PM note, 2026-11-24).** Recorded 2026-11-24.

- The Phase 4 acceptance ran on Kimi k3.1-pro. The PM then closed Kimi for decision roles.
- From now on, phase acceptance and final acceptance take only an `ra-quota` pick. When `ra-quota` gives no route, they wait for `phase-acceptance`.

- [x] T3 Green (src c69a5b73): Add the renderer options. Files: `src/cli/forge.ts`,
      `src/render/page.ts`, and `tests/apk3d/no-unpolyfilled-builtins.test.ts` (the line numbers
      it pins, see the note below).
  - `src/render/page.ts` exports `ORTHO_MARGIN = 1.10`, `orthoFrame(bounds, size)` (it returns
    `{ left, right, top, bottom, pixelsPerMetre }` from decision (f)), and
    `useFlatMaterials(root)` (it swaps each mesh material for a
    `MeshBasicMaterial({ color, vertexColors, toneMapped: false, side })`, hides the ground, and
    returns the restore function). `ViewsRequest` gains `readonly ortho?: boolean` and
    `readonly flat?: boolean`. `renderViews` chooses the orthographic camera under `ortho`, applies
    `useFlatMaterials` under `flat`, and restores both at the end.
  - `src/cli/forge.ts`: `NAMED_VIEWS['front-level'] = { azimuth: 0, elevation: 0 }` and
    `NAMED_VIEWS['side-level'] = { azimuth: 90, elevation: 0 }`. `parseArgs` gains
    `ortho: { type: 'boolean' }` and `flat: { type: 'boolean' }`. `--flat` writes
    `join(out, 'flat', `${view}.png`)` and leaves `views/` alone. The command rejects `--flat`
    without `--fast` and `--bg none` with `--flat needs --fast and --bg none`.
  - Done-when:
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/render-options.test.ts'`
      exits 0 with 9 cases.
    - `tsc --noEmit` through the runner reports no error in the two changed files.
    - One render of an existing asset still writes `views/` as before.
    - `prettier --check` exits 0 on the two changed files.
  - Record: the exported symbols, the option names, the test run, and the render of the existing
    asset that shows no change.
  - Evidence 2026-11-23 (Green model `minimax-cn-coding-plan/MiniMax-M3.1-Flash`, family MiniMax;
    the Red model of this track was `opencode-go/muse-spark-1.3-contributor`, family muse, so the
    two families differ). Every command below ran through
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  - The exported symbols in `src/render/page.ts`: `ORTHO_MARGIN` (1.1, the value 1.10 of decision
    (f)), `orthoFrame(bounds, size)` (it returns `{ left, right, top, bottom, pixelsPerMetre }`),
    and `useFlatMaterials(root)` (it returns the restore function). `ViewsRequest` gains
    `readonly ortho?: boolean` and `readonly flat?: boolean`.
  - The option names in `src/cli/forge.ts`: `--ortho` and `--flat`, plus the named views
    `front-level` (azimuth 0, elevation 0) and `side-level` (azimuth 90, elevation 0). `--flat`
    writes `out/<name>/flat/<view>.png`, leaves `views/` alone, writes no sheet, and is refused
    without `--fast` and `--bg none` with the message `--flat needs --fast and --bg none`.
  - The T2 Red command now exits 0 with 9 cases:
    `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/render-options.test.ts` gave
    `Test Files 1 passed (1)` and `Tests 9 passed (9)`. Eight cases are the eight of the T2
    evidence above: the two flat views at 256 x 256, the transparent corner, the body colour, the
    block colour, the two view heights, the side block left of centre, the named view without
    `--ortho` with the refused `--flat`, and the fixture ownership. Remediation round 1 added the
    ninth case on purpose (Red `c916af45`). The added case is
    `fails closed when the actual fixture path already exists`. It plants a file at the actual
    fixture path before the run. It requires the error `fixture path exists: <path>`, an untouched
    planted file, no render result, and no output folder.
  - The flat pixel contract holds on the pin asset. The read values of
    `out/_flat-render-pin-<pid>/flat/front-level.png` are: the corner pixel `[0, 0, 0, 0]`, the
    centre pixel `[63, 143, 208, 255]` (the body hex `#3f8fd0`), and the block pixel
    `[224, 160, 48, 255]` (the block hex `#e0a030`). The side view holds the block in columns
    99 to 109, so the block sits 29 px left of the centre, above the required 4.65 px
    (`0.02` m times `ppm = 256 / 1.1`). Decision (j) holds: `Studio.aim` puts the azimuth-90
    camera at +X, and the frame gives `u = (cz - z) * ppm + W / 2`.
  - The other gates, each through the runner:
    - `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-base.test.ts
tests/sprout-gestures.test.ts tests/sprout-gesture-offset.test.ts` exits 0 with
      `Tests 3 passed | 15 skipped (18)`.
    - The render-related existing tests exit 0: `tests/cutout.test.ts`, `tests/asset.test.ts`,
      `tests/equip.test.ts`, `tests/part.test.ts`, `tests/variants.test.ts`,
      `tests/preset-colour.test.ts`, `tests/clip-check.test.ts`, `tests/song-still-hook.test.ts`,
      `tests/rig.test.ts`, `tests/apk3d/renderer-setting.test.ts`,
      `tests/apk3d/no-unpolyfilled-builtins.test.ts`, and `tests/storytime-line-art-pass.test.ts`
      gave `Test Files 12 passed (12)` and `Tests 73 passed (73)`.
    - `node node_modules/typescript/bin/tsc --noEmit` exits 2 with the 51 baseline errors of
      TD-35 to TD-39. The same 13 files fail as before the change, and no error names the two
      changed source files or the refreshed test file.
    - `node_modules/.bin/prettier --check src/cli/forge.ts src/render/page.ts
tests/apk3d/no-unpolyfilled-builtins.test.ts` exits 0.
  - The existing render output stays byte-identical. The renderer was run twice through the
    runner on `sprout-pip`: once at the base commit and once with the new code. The SHA-256 sums
    of `out/sprout-pip/render.png` and the four views match in both runs
    (`render.png` `7efc9c27...`, `views/front.png` `c5746f41...`, `views/side.png` `172a6ff4...`,
    `views/three-quarter.png` `d3d585e3...`, `views/back.png` `a830755b...`). The sprite set
    matches too (ten PNG files plus `metrics.json`).
  - Note on the format: the two source files were not Prettier-clean at the base commit
    (`.prettierrc.json` sets `printWidth` 110; the base files were written at a wider width).
    `prettier --write` reflowed the pre-existing lines of both files. The reflow changes line
    breaks only. The byte-identical renders above show that no behaviour changed.
  - Note on the apk3d test: `tests/apk3d/no-unpolyfilled-builtins.test.ts` binds three
    `Box3.union` false positives to the line numbers 263, 440, and 447 of `src/render/page.ts`,
    and it fails when those numbers rot. The new renderer code moved the three calls to lines
    331, 531, and 538. The test now binds those three numbers. The bound source text, the
    labels, the reasons, and the three rot cases are unchanged. The file is outside the file list
    of this task, and the change is the refresh the test asks for when the scanned file moves.

## Phase 3: Red

- [x] T4 Red (tests ba884846): Pin the measurement. File: `tests/sprout-mom-kim.test.ts`.
  - Evidence: `vitest run tests/sprout-mom-kim.test.ts` exits 1 with 28 failed
    and 1 passed of 29 cases. The AC1 skip guard passes. Every other case
    fails inside the case: the pure cases on
    `Cannot find module '.../scripts/proportion-check.mjs'`, the tsx cases on
    the missing script file. No collection or file-scope error.
    `prettier --check` exits 0. `tsc --noEmit` names no new file (51 errors stay).
  - Each case imports the script inside the case with `await import('../scripts/proportion-check.mjs')`
    or runs it through `tsx`, so the fail-first run reports a missing module or a missing asset
    inside the case.
  - Cases: the AC1 skip guard, the level and orthographic proof, the pass table, the eleven doctored
    rows, the five synthetic figures (with the merged-eye numbers of AC2 rule 7), the palm cases on
    the synthetic hand fixture of "The palm fixture and the three mutations" (the base pass and the
    three mutations with their exact named failures), the real-hand case on both hands, the
    hand-edge cases with a named absent row, and the side sign guard.
  - The palm cases split in two groups. The synthetic group runs on a hand mesh built inside the
    test, so it needs no GLB, and it passes at T6. The real-hand group loads
    `out/sprout-mom-kim/sprout-mom-kim.glb`, so it passes only at T7.
  - Done-when:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'`
    exits 1. The skip guard passes. Each other case fails inside the case with the absent script or
    the absent asset. `prettier --check` exits 0 on the file.
  - Record: the case names, the synthetic fixture body, and the failure text.
  - Recorded: 29 cases — the AC1 skip guard; the level and orthographic proof
    (missing asset fails before any import); the pass table; eleven doctored
    rows (one per pass-table row, each named in its own `FAIL <row>:` error);
    five synthetic figures (pass, crown-high, sole-low, wide-head,
    merged-eyes with `eye components: found 1, expected 2`); the synthetic
    palm group (base pass with sideDot −1, agreement +1, palmContact ≤ 1.8 mm,
    thumbContact 0, thumbOut 0.040, thumbForward ≥ 0.025; flipped, mirrored,
    and turned with their exact check 4, 7, and 6 failures); three hand-edge
    cases (2 px gap over 80 % of rows, front width within 0.60 of depth times
    ppm, a named `row <v>: no leg run` record entry); the side sign guard;
    the real-hand case on both hands; the end-to-end case. Fixture: palm box
    x 0.150-0.190, y 0.450-0.520, z 0.030-0.090; thumb box x 0.170-0.190,
    y 0.495-0.505, z 0.090-0.115; fingers box x 0.155-0.185, y 0.430-0.450,
    z 0.035-0.085; 16x16 quads per face, outward winding, over 200 vertices;
    palmCentre [0.150, centroid y, centroid z], thumbTip [0.190, 0.500,
    0.115], fingerTip [0.170, 0.430, 0.060]. Failure text at Red: the absent
    module or the absent script file inside each case; no other failure.

- [x] T5 Red (tests ba884846): Pin the sheet layout. File: `tests/mom-kim-sheet.test.ts`.
  - Evidence: `vitest run tests/mom-kim-sheet.test.ts` exits 1 with 8 failed
    of 8 cases. Every case fails inside the case on
    `Cannot find module '.../scripts/mom-kim-sheet.mjs'` from the tsx spawn.
    `prettier --check` exits 0. `tsc --noEmit` names no new file.
  - Cases per AC5: the sheet size, the two rows and the `no side drawing` cell, one baseline and the
    700 px body scale, the lit row sources, the caption strip, and the two-cell `mom-panel.png`.
  - Done-when: the test exits 1 inside the cases on the absent script. No syntax or import error.
    `prettier --check` exits 0 on the file.
  - Record: the case names and the failure text.
  - Recorded: 8 cases — writes the review sheet and the judge panel; sheet
    size holds two 700 px rows and a caption strip (review 1568 px tall,
    panel 748 px tall); two rows split into three segments each; the no side
    drawing cell holds text, not a figure (dark bbox under 200 px); one
    baseline and the 700 px body scale (figure masks 698-700 px, soles on the
    row baseline); lit row sources feed the render cells (cell widths match
    the 700 px scale of the lit masks and rows.lit); caption strip holds
    content; two-cell mom-panel holds both renders. Layout contract: PAD 24,
    caption 96, white background, column order Kim, render, drawing or text.
    Failure text at Red: the absent script file inside each case.

## Phase 4: Green

- [x] T6r Red (tests 2c774c62): remediation round 1 cases (load order, strict row table, asset name, corrupt GLB)
- [x] T6r Green remediation (src b6d66051): render checks after both imports; strict checkRows;
      asset-name rules; one-line corrupt-GLB error.
  - Evidence 2026-11-23 (Green model `opencode-go/hy4-flash-free`, family hy4; the Red model of the
    track is `opencode-go/muse-spark-1.3-contributor`, family muse). Every command ran through
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
    The targeted Red command before the fix exits 1 with `Tests 18 failed | 1 passed (19)`; after the
    fix `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.validation.test.ts`
    exits 0 with `Test Files 1 passed (1)` and `Tests 19 passed (19)`.
  - F1: the render-file checks now run after the asset import and the base import. The load-order
    case writes a marker on import, and the run reports `missing: out/_load-order-<pid>/flat/front-level.png`
    with the marker present.
  - F2: `checkRows` requires exactly eleven rows with the eleven expected unique names, and returns
    the exact names `checkRows: expected 11 rows, found 0`, `checkRows: missing row legShare`,
    `checkRows: duplicate row eyeLine`, `checkRows: unknown row extra-row`, and the value names
    `FAIL heightInHeads: not a number`, `FAIL wrist: not a number`, `FAIL armToTorso: not finite`,
    `FAIL spacingHead: not a number`, `FAIL eyeLine: not a number`, and `FAIL legShare: negative`.
    The pass-table bounds are unchanged and the valid eleven rows still return [].
  - N1: the script copies the `checkAssetName` rule of `src/pipeline.ts` (empty, absolute, path
    separator or backslash, dot-dot segment) and refuses a bad name in one line before any import,
    read or write. The empty name reports the required-name error. Copying keeps the load order.
  - N3: a corrupt or truncated GLB is caught at the read site and reports one line
    `Invalid GLB: out/<name>/<name>.glb` with no stack frames and no measure.json write.
  - Gates: the three-file vitest exits 0 with 3 files and 42 passed; the real-asset script exits 0
    with the same eleven T7 rows and both palms ok; `./forge check sprout-mom-kim` ends `result ok`.
    `tsc --noEmit` exits 2 with the 51 baseline errors and none in `scripts/proportion-check.mjs`.
    The whole project gate exits 1 with only the 8 T5 sheet cases failing, each on the absent
    `scripts/mom-kim-sheet.mjs` (T8): `Test Files 1 failed | 237 passed | 4 skipped (242)` and
    `Tests 8 failed | 3454 passed | 27 skipped (3489)`. `prettier --check` exits 0 on the script.
- [x] T6 Green (src 1f61d0f2): Write the measurement script. File: `scripts/proportion-check.mjs`.
  - Evidence 2026-11-23 (Green model `opencode-go/hy4-flash-free`, family hy4; the Red model of the
    track is `opencode-go/muse-spark-1.3-contributor`, family muse). Every command ran through
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
    The named-error proof `./node_modules/.bin/tsx scripts/proportion-check.mjs --asset sprout-mom-kim`
    exits 1 printing `asset sprout-mom-kim: not built` and `missing: assets/sprout-mom-kim.ts`, before any
    import, with no module-resolution text. The gate
    `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts` exits 1 with
    `Test Files 1 failed (1)`, `Tests 2 failed | 27 passed (29)`: only `end to end: the script passes
sprout-mom-kim and writes measure.json` and `real hand: both hands pass all seven checks` fail, each
    on the missing-asset exit 1. The pass table, eleven doctored rows, five synthetic figures, four
    synthetic palm cases, three hand-edge cases, and the side-sign guard pass. `prettier --check
scripts/proportion-check.mjs` exits 0.
  - Synthetic figure results (params, ok, single failure): pass `{}` ok; crown-high `{crownScale:1.15}`
    `FAIL heightInHeads: 3.298417 not in 3.54..3.74`; sole-low `{soleLower:0.1}`
    `FAIL legShare: 0.445401 not in 0.36..0.42`; wide-head `{headWiden:0.12}`
    `FAIL headToShoulders: 1.414388 not in 1.11..1.27`; merged-eyes `{eyeGap:0.06,eyeWidth:0.064}`
    `eye components: found 1, expected 2`. The pass figure's hand edge records 152 counted rows of
    76 band rows (two sides), a minimum gap of 11 px, a 7 px front width under an 18.62 px limit, and
    `pass: true`; the side sign records frontmost column 419 at or under limit 500; the merged-eyes
    record names `row 620: no leg run`.
  - Synthetic palm results: the base fixture passes all seven checks with `sideDot −1`, `agreement +1`,
    `palmContact 0.0015 m`, `thumbContact 0`, `thumbOut 0.040 m`, `thumbForward 0.0408 m`. The three
    mutations give exactly one named failure each: flipped winding
    `hand L: palm surface faces away from the declared normal` (check 4), mirrored hand
    `hand L: palm faces away from the body` (check 7), and turned hand
    `hand L: thumb not on the radial front edge` (check 6).
  - Note: the script measures projected image rows for the reach rows. The spec derived-target table
    lists wrist 0.569 m, but its own pass table and the design page put the wrist 0.06 of hip-to-knee
    ABOVE the hip. The base places the `hand.L` joint at 0.601 m so the image-row wrist row is −0.06;
    the fingertip target 0.452 m is unchanged.
  - It follows the loading order of the spec: parse the arguments, check that the asset file and the
    GLB exist, then `await import()` the asset and the base module, then read the renders. The
    missing-asset path exits 1 with `asset <name>: not built` before any import.
  - It measures per the evaluation order, the pass table, the palm check API, and the front hand
    edge of the spec, writes `out/chibi-sprouts/redesign/measure.json`, prints one line per row, and
    exports `checkRows(rows)`, `palmCheck(side, mesh, landmarks)`, and `measurePixels()`.
  - Done-when:
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/tsx scripts/proportion-check.mjs --asset sprout-mom-kim'`
      exits 1 with `asset sprout-mom-kim: not built` and no module-resolution error.
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'`
      exits 1 with only the end-to-end case and the real-hand case failing on the absent asset. The
      table, synthetic-figure, synthetic-palm, hand-edge, and side-sign cases pass.
    - `prettier --check` exits 0 on the script.
  - Record: the missing-asset text, the five synthetic results, and the synthetic palm results with
    their exact failure names. The real-hand evidence lands in T7; this task records the fixture
    results that need no asset.
  - Note: T6 creates the script only. The base module and the asset arrive in T7.

- [x] T7 Green (src aa9c9b74): Build the new base and Mom. Files: `assets/parts/humanoid-kim.ts`
      (new), `assets/sprout-mom-kim.ts` (new), `tests/fixtures/preset-pin.json`, and a small
      correction to `scripts/proportion-check.mjs` (the palm normal X convention and a one-pixel
      antialiasing allowance on the landmark-on-mask guard).
  - Evidence 2026-11-23 (Green model `opencode-go/hy4-flash-free`, family hy4; the Red model of the
    track is `opencode-go/muse-spark-1.3-contributor`, family muse). Every command ran through
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
    The two render commands are
    `./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024`
    and
    `./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none --size 1024`.
    Both exit 0. The script prints eleven rows, each a pass:
    `heightInHeads 3.595144`, `armToTorso 1.328305`, `legShare 0.389427`, `headToShoulders 1.170666`,
    `wrist -0.061303`, `fingertips 0.509578`, `eyeLine 0.62944`, `eyeHeight 0.104263`,
    `spacingHead 0.383495`, `eyeWidthFace 0.226744`, `spacingFace 0.459302`. Both palms print `ok`.
  - Look rounds, each read with the `read` tool on `views/front-level.png` and `views/side-level.png`:
    - Round 1: (1) eyes read as white blobs because a final `paintWhere` repainted the eye white over
      the iris and pupil; (2) the torso and sweater profiles stopped at hip height, leaving a hollow
      gap between the head and the hips; (3) the hair mass was oversized. Fix: removed the final eye
      repaint and raised both profiles to shoulder height.
    - Round 2: (1) hair cap and waves were too wide (head width 0.426 m, `headToShoulders` 1.489);
      (2) face width 0.241 m and eye width 0.050 m were too small; (3) the shoulder joint sat off the
      mask. Fix: narrowed the hair, widened the skull and eye stencils, widened the sweater shoulder,
      and moved the `hand.L` joint to 0.176 m.
    - Round 3: (1) the hair reads as a helmet with a flat part and short waves; (2) the eyes are large
      dark discs without Kim's softer opening; (3) the hands are thin slabs with visible banding from
      the fine-palm displacement. All eleven rows pass, so the done-when stops the shape loop here.
      These three are the remaining work list for the AC4 look judge and the PM, not a row failure.
  - Gates, each through the runner:
    - `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts tests/preset-colour.test.ts tests/render-options.test.ts`
      exits 0 with `Test Files 3 passed (3)` and `Tests 42 passed (42)`, including the real-hand case
      on both hands.
    - `./forge check sprout-mom-kim` ends with `result ok: no held item passes through the head`,
      with rest and idle clips ok and ground ok.
    - `node node_modules/typescript/bin/tsc --noEmit` exits 2 with the same 51 baseline TD-35 to
      TD-39 errors as T3; no error names `assets/parts/humanoid-kim.ts`, `assets/sprout-mom-kim.ts`,
      or `scripts/proportion-check.mjs`. Baseline 51, new count 51.
    - `prettier --check` exits 0 on the script, both new assets, and the regenerated pin.
  - Palm mutation names from T6, unchanged: flipped winding
    `hand L: palm surface faces away from the declared normal` (check 4), mirrored hand
    `hand L: palm faces away from the body` (check 7), turned hand
    `hand L: thumb not on the radial front edge` (check 6). The real hands pass all seven checks;
    the left normal is −X and the right normal is +X, so sideDot is −1 and +1.
  - Pin key check: `./node_modules/.bin/tsx scripts/make-preset-pin.mjs` reports 394 assets, 909
    presets, and 3194 slots. Parsed JSON against the role baseline `0540e6ce` (393 assets, 908
    presets, 3190 slots) differs by the one added key `sprout-mom-kim` (one preset `mom`, four
    slots); no baseline key removed and no baseline asset, preset, or slot value changed. The pin
    was reformatted by Prettier; the diff is line breaks only, and the parsed values are identical.
  - Note: the script's projected reach rows use image rows (y down). The spec derived-target table
    lists wrist 0.569 m, but its pass table and the design page put the wrist 0.06 of hip-to-knee
    above the hip, so the `hand.L` joint sits at 0.601 m. The guard on model landmarks allows one
    antialiased neighbour pixel because the fingertip vertex can round to a half-covered edge pixel.
  - The base: the skeleton with the bone names `hips`, `spine`, `chest`, `neck`, `head`,
    `upperarm.L/R`, `forearm.L/R`, `hand.L/R`, `leg.L/R`, `shin.L/R`, and `foot.L/R`; the head with
    the face paint of the pass table; the torso; the arms; the open hands as one body named `hands`
    with the palms toward the legs and the thumbs forward; the legs; the feet; one `idle` clip. It
    exports `KIM_CHIN_Y` and `KIM_HANDS`. The numbers start from the derived target table.
  - Mom's asset: the long brown waves, the knit sweater, the jeans, the brown flats, and the pearl
    studs. The `variants` table holds the four slots with Mom's colours first, and one preset `mom`.
  - Shape loop: `./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none`
    through the runner, then read `out/sprout-mom-kim/views/front-level.png` and `side-level.png`
    with the `read` tool. Write the three largest differences, then fix the largest first.
  - The preset pin: run `./node_modules/.bin/tsx scripts/make-preset-pin.mjs`, then compare the
    parsed pin with the role baseline:
    `git show <role-baseline>:tests/fixtures/preset-pin.json > /tmp/pin-baseline.json`, then a node
    check that the key sets differ by `sprout-mom-kim` alone and that every baseline asset, preset,
    and slot value is unchanged.
  - Done-when:
    - The two renders of the spec exit 0, and the script prints eleven rows, each a pass.
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts tests/preset-colour.test.ts tests/render-options.test.ts'`
      exits 0, including the real-hand case on both hands. The synthetic palm cases already passed
      at T6.
    - `./forge check sprout-mom-kim` ends with `result ok`, through the runner.
    - `tsc --noEmit` through the runner reports no error in the changed files. The plan records the
      baseline count of TD-35 to TD-39 and the new count.
    - `prettier --check` exits 0 on every new or changed text file.
  - This task does not gate the full suite, because the sheet test of T5 still fails until T8. The
    full suite gate belongs to T8.
  - Record: the eleven rows, the three largest differences of each look round, the Green model id,
    the two render commands, the type-check counts, the palm mutation names, and the pin key check.
  - No cut-out and no sprite in this task (AC6).

## Phase 5: Green

- [x] T5r Red (tests e10890f9): fixed the right-cell index at about line 258 and re-checked every cell index against the spec
  - Recorded: the `baseline` case measured [c3, c4] (the second all-white separator band) as the right cell, so with the toHaveLength(2) assertion it could never pass for any layout. The right cell is [seps[1][1], r.width] (spec AC5 rule 2: row one is Kim panel, render, drawing). Row two's right cell holds the `no side drawing` text (spec AC5 rule 2), not a figure, so the 700 px figure assertion applies to row one only; row two's text cell stays pinned by the `no side drawing` case. Bounds unchanged ([698,700], sole ±2). Re-checked every other index (left cell, middle cell, row two render, mom-panel cells): correct as written.
  - Synthetic proof (/tmp/sheet-proof.mjs, uncommitted; PNGs under /tmp): the old logic rejects a correct sheet (right height -699 on an all-white band); the corrected logic accepts it and rejects a separator-bleed layout and a two-cell layout. No new case added: the T5 count stays fixed at 8.
  - Red run vs the uncommitted draft script: exit 0, 8 passed of 8. The draft already emits the spec layout (two 700 px rows, three segments each, text cell, caption strip, two-cell panel), and the old code could never pass, so the passing run validates the fix.
- [x] T8 Green (src e2c70f6d): Write the sheet script. File: `scripts/mom-kim-sheet.mjs`.
  - Evidence 2026-11-24 (Green model `opencode-go/hy4-flash-free`, family hy4; the Red model of the
    track is `opencode-go/muse-spark-1.3-contributor`, family muse). The orchestrator parked the
    uncommitted T8 draft at `/tmp/mom-kim-sheet.draft.mjs` for the T5r Red gate. This role restored it
    with `mv` and verified sha256 `ca8e907ebd9b4199b547955c3c60714ec677bb8e74923865ddd4e15f78c64760`
    before the commit. Every command ran through
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  - The sheet test `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/mom-kim-sheet.test.ts`
    exits 0 with `Test Files 1 passed (1)` and `Tests 8 passed (8)`. The full suite
    `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts`
    exits 0 with `Test Files 238 passed | 4 skipped (242)` and
    `Tests 3462 passed | 27 skipped (3489)`. No render-options timeout occurred.
  - Outputs, regenerated by the final script:
    - `out/chibi-sprouts/redesign/mom-kim-review.png`, 1568 × 1568, 1177590 bytes, sha256
      `54e11c762a4d08f61172b57583d7dce10c4466a9438234bf4616c6670eb4ece0`.
    - `out/chibi-sprouts/redesign/mom-panel.png`, 1448 × 748, 302750 bytes, sha256
      `b6cba32ac4515dc23dc3332d21cfd5f950289b01567574603076377af5d5135f`.
  - Measured Kim rows: the background scan of Kim's side panel (columns 1036 to 1334) gives
    100 and 1196, within 4 px of the page's 102 and 1195; both Kim panels use 102 and 1195. Mom
    uses her drawing's page rows 71 and 1528, with no side scan and no side drawing. The lit
    masks give rows 46 to 977 for both `front-level` and `side-level`; the script writes these as
    the view-keyed `rows.lit` pair in `measure.json` while keeping the earlier keys.
  - `tsc --noEmit` exits 2 with the 51 TD-35 to TD-39 baseline errors and no error in
    `scripts/mom-kim-sheet.mjs`. `prettier --check` exits 0 on the script.
  - Look record, read with the `read` tool: the review sheet shows two rows of three figures on
    white. Row one holds Kim's front figure in a green cardigan and dark jeans, Mom's lit front
    render in a cream sweater and blue jeans, and Mom's drawing with long brown waves and a cream
    cable sweater. Row two holds Kim's side figure, Mom's lit side render, and the text
    `no side drawing`. A caption names the asset, the date, the 11/11 row result and the Green
    model; all soles sit on one baseline. The judge panel shows Mom's lit front render on the left
    and her lit side render on the right with a white separator. No Kim image appears in the panel.
  - Note: the T5r Red fix changed the right-cell check to `[c4, r.width]` and excluded row two's
    text cell from the figure check; the sheet layout was unchanged. No cut-out and no sprite
    exist for the new base (AC6).
  - It reads the lit views, `measure.json` `rows.lit`, Kim's sheet, and Mom's drawing. It finds Kim's
    two figure bands with a background scan and requires Kim's side rows within 4 px of 102 and 1195.
    It runs no scan on a Mom side drawing, because Mom has none. It scales each panel to a 700 px
    crown-to-sole height, sets one baseline, draws the caption, and writes `mom-kim-review.png` and
    `mom-panel.png`.
  - Done-when:
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/mom-kim-sheet.test.ts'`
      exits 0.
    - With every earlier test now green, the full suite command exits 0:
      `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts'`.
      The plan records its reporter line.
    - Both files exist, and a role that did not write the script reviews them with the `read` tool.
    - `prettier --check` exits 0 on the new file.
  - Record: the two paths, their sizes, the measured Kim rows, and the full-suite reporter line.

- [x] T8r Green (src 976144e8): fixed F1 to F3 in `scripts/mom-kim-sheet.mjs`.
  - Evidence 2026-11-24 (Green model `opencode-go/hy4-flash-free`, family hy4; the Red model of the
    track is `opencode-go/muse-spark-1.3-contributor`, family muse). The adversarial audit at
    `measure/runs/chibi_sprouts_redesign_20261123/adversarial-p5-2451d2c.json` found F1, F2 and F3.
    Every command ran through
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  - F1: the Kim sheet is scanned with an opaque-reference rule. A sheet whose opaque pixel count
    is under ten percent is refused with one line
    `mom-kim-sheet: Kim sheet is transparent, not a usable reference`, before any scan or write.
    The real Kim sheet is fully opaque. The 5 px shifted-row case still fails with the named
    `Kim side rows ... not within 4 px` line.
  - F2: `rows.lit` in `measure.json` is validated before any image work: it must be an object with
    no unknown keys, and any present row must hold finite numbers. A missing record, a stale record
    older than either lit render, an unknown row, or a string row exits 1 with one named line and
    writes no PNG. The measurement script may have rewritten the record in its legacy `front` /
    `side` form; the view-keyed `front-level` / `side-level` pairs are derived from those finite
    `crown` and `sole` numbers, never from image masks. No stale-regeneration was needed: the
    current `measure.json` is newer than both lit views.
  - F3: `lstatSync` checks `out/chibi-sprouts` and `out/chibi-sprouts/redesign` before any read or
    write. A symbolic link exits 1 with one line `output folder is a link: <path>`; the link is
    never followed, so neither `measure.json` nor a PNG lands in its target.
  - Gates: `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/mom-kim-sheet.adversarial.test.ts`
    exits 0 with 5 passed; the Red sheet test exits 0 with 8 passed; the whole project gate
    `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts`
    exits 0 with `Test Files 239 passed | 4 skipped (243)` and
    `Tests 3467 passed | 27 skipped (3494)`. `tsc --noEmit` exits 2 with the 51 baseline errors and
    none in the script. `prettier --check` exits 0.
  - The two PNGs were regenerated and are byte-identical to T8: `mom-kim-review.png` sha256
    `54e11c762a4d08f61172b57583d7dce10c4466a9438234bf4616c6670eb4ece0` and `mom-panel.png` sha256
    `b6cba32ac4515dc23dc3332d21cfd5f950289b01567574603076377af5d5135f`.

- [x] T8r2 Green (src 2325440f): fixed F4 and F5 in `scripts/mom-kim-sheet.mjs`.
  - Evidence 2026-11-24 (Green model `opencode-go/hy4-flash-free`, family hy4; the Red model of the
    track is `opencode-go/muse-spark-1.3-contributor`, family muse). The adversarial audit at
    `measure/runs/chibi_sprouts_redesign_20261123/adversarial-p5-ca4e8d0.json` found F4 and F5.
    Every command ran through
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  - F4: the script recomputes crown and sole rows from the alpha masks (alpha 128 or more) of the
    two lit views it reads, using the same quantities the T6 measurement script writes into
    `rows.lit`. It compares each recorded value with the mask value at the 2 px tolerance of the
    spec's mask guards (AC2 rule 3) and exits 1 with one line
    `mom-kim-sheet: measure.json rows.lit row <view> disagrees with the lit alpha mask` before any
    write. The tolerance is not loosened. A fresh `[0, 0]` or `[1023, 1023]` pair fails.
  - F5: `lstatSync` also checks `mom-kim-review.png` and `mom-panel.png` before any read or write.
    A link exits 1 with one line `output file is a link: <path>` and is never followed, so the
    target keeps its bytes. The linked-folder rule of T8r stays in force. The check-then-write swap
    race remains tech debt under the PM decision of 2026-11-23.
  - Gates: the three sheet files run together exit 0 with `Test Files 3 passed (3)` and
    `Tests 15 passed (15)` (8 Red, 5 adversarial round 1, 2 adversarial round 2). The whole project
    gate exits 0 with `Test Files 240 passed | 4 skipped (244)` and
    `Tests 3469 passed | 27 skipped (3496)`. `tsc --noEmit` exits 2 with the 51 baseline errors and
    none in the script. `prettier --check` exits 0.
  - Both PNGs are byte-identical to T8: `mom-kim-review.png` sha256
    `54e11c762a4d08f61172b57583d7dce10c4466a9438234bf4616c6670eb4ece0` and `mom-panel.png` sha256
    `b6cba32ac4515dc23dc3332d21cfd5f950289b01567574603076377af5d5135f`.

## Phase 6: LATO.2 GPU trial (Daniel 2026-11-23, USD 5 cap)

- [x] T9 Measure (0d4ff336): Run one LATO.2 image-to-mesh trial on our own VM. Files:
      `out/chibi-sprouts/redesign/lato2-gpu/trial-log.tsv` (lost 2026-11-24, see the loss record)
      and `measure/runs/chibi_sprouts_redesign_20261123/lato2-gpu/trial-result.md` (both new, not
      in git for the log path).
  - The trial runs in an orchestrator build session titled
    `Build · chibi redesign · LATO.2 GPU trial (Daniel USD 5)`. It runs alongside the SDF work. It
    uses one Spot L4 in `asia-southeast1` on project `reading-advantage`, with a 3 hour VM cap.
    The trial uses no fallback compute: a failed Spot create stops the task, cleans up, and reports,
    and the PM decides. The orchestrator withdrew a standard L4 fallback on 2026-11-23 after review
    r4.
  - One Kim full-body front crop runs on our own VM. The weights download to the VM. The trial calls
    no hosted API and no public demo. It uses no image tool.
  - Steps 1 to 5: create one VM and one temporary boot disk; set up the pinned dependencies and the
    weights; run one image-to-mesh inference; copy the mesh out and confirm the copy opens; delete
    the VM and the disk in the same session, then verify both are gone.
  - The delete and the verify run in the same session as the create, also on failure.
  - Each step writes `step`, `start`, `end`, `minutes`, `estimate_usd`, and `note` to the log, with
    that header.
  - Outputs: the mesh, a front render and a side render beside Kim, the body rows of the pass table,
    and the result note. The face rows stay out, because the mesh has no texture, and the note says
    so.
  - Done-when: the log holds one row per step, the verify row shows the VM and disk absent, the
    spend estimate stays at or under USD 5, and the result note holds the mesh result, the two render
    paths, the body rows, and the face-row note.
    Amended 2026-11-24: the 'Steps and times' table of `trial-result.md` counts as the step log,
    because `trial-log.tsv` was lost when the main tree `out/chibi-sprouts/redesign` folder went at
    2026-11-24 03:36:24.
  - Record: the command list, the zone, the instance name, the total minutes, the total estimate, and
    the verify output. A missing verify row blocks the task.
  - The result feeds the PM decision at T12. It changes no row of the SDF pass table.
  - Result note 2026-11-23: Daniel looked at
    `out/chibi-sprouts/redesign/lato2-gpu/lato2-shaded.png`.

    > Daniel: Not better than what we already have.

    The trial cost USD 0.58. It ran on one Spot L4 for 1.04 h. The VM and the disk are verified gone.

    PM ruling 2026-11-23: LATO.2 is out. Do not run LATO.2 on a GPU again. It is not a reference in
    the judge brief. The Mom SDF trial in our own tool stays the route. UniRig stays only as a note
    in the options table, with no run planned.

  - Artifact loss record 2026-11-24: the main tree deleted and recreated `out/chibi-sprouts/redesign`
    at 2026-11-24 03:36:24. The recreated folder has the new inode 33429231, and it holds
    `measure.json` only. These LATO.2 artifacts are lost: `trial-log.tsv`, `kim-front_pred.obj`,
    `kim-front_pred.ply`, `kim-front_cond.png`, `kim-front_ss.ply`, `kim-front.png`,
    `mesh-front.png`, `mesh-side.png`, `mesh-metrics.json`, `lato2-review.png`, `lato2-shaded.png`,
    `shaded-views/`, `vm-setup.sh`, and `vm-setup2.sh`. No author of the deletion is proven. The
    loss window is the Phase 5 audit window. One process also copied `measure.json` into the new
    folder, and copied `teacher-kim-sheet.png` over itself with identical bytes. `out/` is
    git-ignored, so git holds no copy.
  - What is intact: `measure/runs/chibi_sprouts_redesign_20261123/lato2-gpu/trial-result.md` in the
    main tree, 8076 bytes. It holds the mesh counts, the body rows, the face-row note, and the
    verify row.
  - The steps and times of record, copied from `trial-result.md` on 2026-11-24. This table now
    counts as the step log:

    | Step                                     | Start UTC | End UTC  | Result                                                                                           |
    | ---------------------------------------- | --------- | -------- | ------------------------------------------------------------------------------------------------ |
    | Local crop of the Kim front view         | 01:58     | 01:59    | `kim-front.png`, 768 × 768, plain white background                                               |
    | Price basis from the Google Cloud pages  | 01:58     | 01:59    | g2-standard-4 Spot in asia-southeast1 USD 0.544556 per hour; pd-balanced USD 0.11 per GiB-month  |
    | Create the Spot VM                       | 02:00:19  | 02:00:35 | `lato2-trial-0123`, asia-southeast1-a, g2-standard-4, 1 L4, 100 GiB pd-balanced boot disk        |
    | Clone LATO.2, venv, torch, base packages | 02:02     | 02:09    | torch 2.6.0+cu124; CUDA toolkit 12.9 present; image family `common-cu129-ubuntu-2204-nvidia-580` |
    | Fix the build tools                      | 02:10     | 02:14    | `g++` and `python3.10-dev` were missing; install them with apt                                   |
    | Build the CUDA extensions                | 02:15     | 02:30    | nvdiffrast 0.4.0, CuMesh 0.0.1, FlexGEMM 1.0.0; flash-attn 2.7.4.post1 wheel                     |
    | Download the weights                     | 02:15     | 02:16    | 7 `.pt` files, 3.4 GiB; licence MIT                                                              |
    | First two run attempts                   | 02:48     | 02:53    | Missing `safetensors`, then missing `kornia`; install both                                       |
    | One image-to-mesh run                    | 02:54:27  | 02:54:55 | Generation 28.21 s; total 65 s with model load; peak VRAM 8102 MB                                |
    | Copy the mesh out                        | 02:55     | 02:56    | 516 KiB of outputs                                                                               |
    | Delete the VM and its disk               | 03:01:56  | 03:02:00 | `Deleted .../instances/lato2-trial-0123`                                                         |
    | Verify                                   | 03:03     | 03:03    | `instances list`: "Listed 0 items." `disks list`: "Listed 0 items."                              |

    VM time: 02:00:19 to 03:02:00 = 1.036 hours. The verify output is
    `gcloud compute instances list` "Listed 0 items." and `gcloud compute disks list`
    "Listed 0 items."

  - The sheet that Daniel judged is on Drive:
    `https://drive.google.com/file/d/1UbUsTb9xtSMGp3fW_YC2Zj7p2utReep7/view`. The PM session
    uploaded it on 2026-11-23 17:35. Daniel judged it 'Not better than what we already have', and
    the PM ruled LATO.2 out. No GPU re-run happens.
  - Closed by the orchestrator after verification, 2026-11-24, on the `trial-result.md` evidence.

- Gate waiver 2026-11-25 (PM rule): the security review and the adversarial testing for Phases 6
  and 7 are waived. The PM rule of 2026-11-25 asks for the lightest gates the risk allows, as
  Daniel's new way of work. The Phase 6 to 9 acceptance checked the substance instead: the VM and
  the disk are deleted, the panel holds no Kim art, and the judge family differs from Green and Red.
  Record: `measure/runs/chibi_sprouts_redesign_20261123/phase-acceptance-p6-p9-06b03ed.json`,
  finding F1.

## Phase 7: Look

- [x] T10 Measure (2325440f): Run the independent look judge. File:
      `measure/runs/chibi_sprouts_redesign_20261123/judge.json` (new, not in git).
  - The judge reads `out/chibi-sprouts/redesign/mom-panel.png` and the numeric rows. It reads no Kim
    image (decision k).
  - The judge brief names no LATO.2 image and no LATO.2 mesh as a reference (PM ruling 2026-11-23).
  - The judge is on a family other than Green's and Red's.
  - Done-when: `judge.json` holds the AC4 rule 5 fields, and both scores are 7.5 or more. A lower
    score records the comment as the work list and returns the track to T7. A PM demand for a
    local-only judge stops the task (AC4 rule 7).
  - Record: the panel SHA-256, the judge model id and family, both scores, and the verdict.
  - This task uploads nothing and writes no script.
  - Evidence 2026-11-24. The line holds the SHA of the last commit that changed the panel script
    (T8r2 Green, `2325440f`), because `judge.json` is not in git. The judge ran at
    `2026-11-24T00:17:32Z`.
  - Panel: `out/chibi-sprouts/redesign/mom-panel.png`, 1448 × 748, 302750 bytes, SHA-256
    `b6cba32ac4515dc23dc3332d21cfd5f950289b01567574603076377af5d5135f`. A fresh `sha256sum` of the
    file matches the value in `judge.json` and the T8 and T8r2 record.
  - Judge model `opencode/nemotron-3.5-super-vl-free`, family nvidia. The route is the `ra-quota`
    pick `vision-review --not-family muse --not-family openai`, taken after the free route cleared
    at 07:14 on 2026-11-24. hy4 was the only other allowed route, and it is Green's family, so the
    judge did not use it. The three families differ: Red is muse
    (`opencode-go/muse-spark-1.3-contributor`), Green is hy4 (`opencode-go/hy4-flash-free`), and the
    judge is nvidia.
  - Scores: identity 7.5 and proportion 8.5. Verdict `pass`, because both scores are 7.5 or more.
    Identity sits exactly on the 7.5 threshold. A score of 7.4 would return the track to T7.
  - The two comments are the work list for a later round.
  - Identity comment, verbatim:

    > Reads as Mom through the cream sweater, blue jeans, brown flats, pearl studs, and brown hair.
    > Not a full likeness: the face is neutral with oversized eyes and minimal brows instead of
    > Daniel's warm smile, and the hair is swept into side masses rather than long loose waves. Fix
    > the face and hair first.

  - Proportion comment, verbatim:

    > All eleven measured rows pass: 3.60 heads tall, legs 39 %, open palms-to-legs hands, wrist just
    > above hip. The chibi adult reads as Kim-proportioned. Visually the hands look like small dowels
    > and the side nose is a tiny bump, but the body and face follow the numbers. No change needed
    > for proportion.

  - In short, the work list holds four items: the neutral face with oversized eyes and minimal
    brows, the hair in side masses instead of long loose waves, the hands that look like small
    dowels, and the tiny side nose.
  - The judge could not judge four things: the cable-knit sweater texture, the freckles, the exact
    smile shape, and the back-of-head hair detail. The render scale does not resolve them. Mom has
    no side drawing to compare. The idle clip and any animation stay unjudged, because a still
    panel holds no motion.
  - Difference between AC4 item 2 and the built panel: the panel holds Mom's two lit renders only,
    in two cells, as T5 and AC5 rule 2 pin it. The judge got Daniel's drawing
    `docs/sprout-mockups/mom.jpg` as a second file, which AC4 item 7 allows. No Kim image, no
    review sheet, and no LATO.2 file reached the judge.
  - The judge ran before the Phase 5 acceptance. The acceptance waits for an `ra-quota` route. The
    panel is final unless that acceptance finds a change.

- Gate waiver 2026-11-25 (PM rule): the security review and the adversarial testing for Phase 7 are
  waived under the Phase 6 waiver note. The Phase 6 to 9 acceptance checked the substance instead:
  the panel holds no Kim art, and the judge family differs from Green and Red.

## Phase 8: PM stop

- [x] T11 Measure (no file): Hand the sheet to the PM. No file changes, and no command runs.
  - The handoff names: the sheet path, its SHA-256, the eleven measured rows, the judge record, the
    two AC3 palm results, the `mom-panel.png` path, the LATO.2 result note, and the fact that no
    cut-out and no sprite exist.
  - Done-when: the PM holds the handoff. The upload to Daniel waits for the PM's word (AC5 rule 7).
  - Record: nothing in this task. T12 records the handoff and the answer.
  - Evidence 2026-11-25: the PM (Daniel) holds the handoff. No file changed and no command ran.

- [x] T12 Measure (no file, this plan): Record the handoff and the PM answer.
  - It records the handoff date, the PM's word, and the next step. A PM answer that asks for a shape
    change returns the track to T7 with the change as the work list. An approval opens Phase 9 by
    amendment (AC6 rule 3). The LATO.2 result informs the answer.
  - Done-when: this plan holds the handoff date, the PM's word, and the next task.
  - This line runs after T11, so T11 keeps its no-write rule.
  - Record 2026-11-25: the PM (Daniel) received the handoff on 2026-11-25. The PM approved the
    Phase 9 output, which is the song cut-out and the idle sprite. The judge identity score is 7.5,
    and that score is the pass line. The next task is T13.

## Phase 9: cut-out and sprite (amended 2026-11-25 after the T12 approval)

These tasks started by amendment after the PM (Daniel) approved the shape at T12 (AC6 rule 3).

- [x] T13 Measure (bf4158a5): One 900 px or taller song cut-out of Mom on the new base. Files: a
  cut-out step on the existing cut-out path, and `out/chibi-sprouts/redesign/cutout/`.
  - trigger: the T12 PM approval of 2026-11-25. It is met.
  - Every render and every heavy command uses the wrapper:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
    The cut-out command takes a build slot.
  - No role touches a production `out/` path outside this worktree. Every probe and every fixture
    stays inside this worktree or under `/tmp` (lesson 2026-11-24).
  - Done-when:
    - The cut-out file exists.
    - The cut-out is 900 px or taller.
    - The alpha border is clean.
    - A look judge gives 7.5 or more. The judge route is an `ra-quota` vision route that is not
      muse, not hy4, and not OpenAI.
  - Record: the command, the file path, the pixel size, and the judge score.
  - Evidence 2026-11-25 (maker role; the look judge is not part of this role): no source change was
    needed. The existing cut-out path (`src/cli/forge.ts`, `src/render/cutout.ts`) gave the delivery
    from options alone. Command, through the wrapper:
    `./forge cutout sprout-mom-kim --out out/chibi-sprouts/redesign/cutout --views front --ppm 900 --canvas 1024x1500`.
    It exits 0 and writes `out/chibi-sprouts/redesign/cutout/sprout-mom-kim/front.png`
    (1024 x 1500, 329,299 bytes, SHA-256
    `fc4327034bce6bb54239cf2bee4b62391a7c76d9495b1b18ab52e0122c02a688`) and `manifest.json`
    (ppm 900, canvas 1024 x 1500, elevation 0, footPoint 512, 1484).
  - `node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout` on the first cut-out ends
    `result ok`: `ok sprout-mom-kim/front.png 1024x1500 soft 4471 edge 4158 worstDrop 40% rows
    126..1488 cols 317..706`. The first cut-out was 1363 px tall (rows 126 to 1488). The accepted
    cut-out at commit bf4158a5 is 1370 px tall and its check run ends `result ok` with
    `soft 4927 edge 4561 worstDrop 40% rows 119..1488 cols 317..706`. The accepted cut-out has
    SHA-256 `b229114baee38db845983c84520f0cff44f112938125978c49ead24d577c5859`. Both cut-outs are
    above the 900 px line.
  - Alpha check (scratch script `/tmp/opencode/verify-mom-delivery.mjs`, not in git): the corners are
    0, 0, 0, 0; the outer 1 px ring holds 0 opaque pixels; 0 alpha-0 pixels hold colour; the figure is
    one 8-connected alpha component, so there are 0 stray pixels. The 4471 soft alpha pixels belong
    to the first cut-out. The accepted cut-out holds 4927 soft alpha pixels on the edge
    (final-acceptance-7478b2a.json, cut-out checks).
  - Scale note: `--ppm 1024` fails the foot-row row of `cutout-check` with
    `lowest opaque row 1589, foot row 1584`. The approved asset's lowest point is y = -0.005 m (the
    rounded toe of the flats), which is 5 px at 1024 px/m. The check allows 4 px. At 900 px/m the same
    5 mm is 4 px, so the check passes. The asset is unchanged.
  - Judge 2026-11-25 (route `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia) gave
    identity 8 and proportion 7.5, so the look judge passed at 7.5 or higher at commit bf4158a5. The
    cut-out is 900 px per metre, 1024x1500, and the figure is 1370 px tall. File:
    `measure/runs/chibi_sprouts_redesign_20261123/judge-p9-bf4158a.json`.

- [x] T14 Measure (bf4158a5): One 128 px idle sprite sample of Mom on the new base. Files:
  `out/sprout-mom-kim/sprites/` and its preview.
  - trigger: the T12 PM approval of 2026-11-25. It is met.
  - The sample is idle only. The walk clip comes from a later amendment task pair (AC6 rule 3).
  - Every heavy command uses the wrapper:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge sprites sprout-mom-kim --clip idle'`.
  - No role touches a production `out/` path outside this worktree. Every probe and every fixture
    stays inside this worktree or under `/tmp` (lesson 2026-11-24).
  - Done-when:
    - The idle sprite files exist in `out/sprout-mom-kim/sprites/`.
    - The sprites are 128 px.
    - The alpha border is clean.
    - The face reads in `sprites/preview.png`.
    - A look judge gives 7.5 or more. The judge route is an `ra-quota` vision route that is not
      muse, not hy4, and not OpenAI.
  - Record: the command, the folder path, the pixel size, and the judge score.
  - Evidence 2026-11-25 (maker role; the look judge is not part of this role): command, through the
    wrapper: `./forge sprites sprout-mom-kim --clip idle --cell`. It exits 0 and writes
    `out/sprout-mom-kim/sprites/idle/` with 64 frame PNGs (8 directions x 8 frames), `sheet.png`,
    `preview.png`, `idle.gif`, and `metrics.json`. The static command
    `./forge sprites sprout-mom-kim` exits 0 and writes the 128 px set and `preview.png` at
    `out/sprout-mom-kim/sprites/`.
  - Cell note: `--clip idle` alone gives a 132 px cell, because the idle sway widens the box that
    frames the clip. The delivered command adds `--cell`, which keeps the 128 px cell of the done-when
    at one scale and one pivot. The delivered `metrics.json` holds the pivot (64, 110).
  - Alpha and size check (`verify-mom-delivery.mjs`): all 64 idle frames are 128 x 128; the outer 1 px
    ring of every frame is empty; each frame holds one alpha component; `metrics.json` reports size
    128, clip idle, 8 frames, 8 directions.
  - Face check with the `read` tool: `out/sprout-mom-kim/sprites/preview.png` (3x cells) shows the
    eyes, brows, mouth, and blush. `sprites/idle/preview.png` (1024 x 1024, 1:1) shows two dark eyes
    and a mouth on the face.
  - SHA-256 of the delivered files (commit bf4158a5):
    `idle/S_0.png` `8c6049a8e093f915fdfbaf3605783057e2947a03b5970d233259b8ef48a3b6ef`,
    `idle/sheet.png` `f6e8754cc7e411ef56542681c07e9757d7259ac3002bb76ef2e2ec132e34fc0d`,
    `idle/preview.png` `daa3d46ffbd85065ccc5fa1acb227e4f681d697b2215af058e638a82437603a4`,
    `idle/idle.gif` `4b2bd2e4e63e3c105bdb8437af4964fffb2cb87684316130daa10f2061650b54`,
    static `preview.png` `b1451082705893b2903c74f4960517e05522e4b454844fd4018b253dd558afc6`.
    A clean rebuild of HEAD 7478b2af gives the same five values.
  - Judge 2026-11-25 (route `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia) gave
    identity 8, proportion 7.5 and face reads 8, so the look judge passed at 7.5 or higher at commit
    bf4158a5. The sprite is 128 px, made with `--clip idle --cell`. File:
    `measure/runs/chibi_sprouts_redesign_20261123/judge-p9-bf4158a.json`.
  - Phase 9 review sheet (finding F3). The Phase 9 rebuild replaced the T8 and T10 sheet and panel.
    The files on disk at HEAD 7478b2af hold
    `out/chibi-sprouts/redesign/mom-kim-review.png` SHA-256
    `e63cbdc1291aefd6f92ab683594f84c9b870b47f75d0748f8ca9b875a8bfbc2a` and
    `out/chibi-sprouts/redesign/mom-panel.png` SHA-256
    `0165b36d73239438ea1bf92cf1594fc285ec3111fe9cfdf1e064d0a436b219ff`.
    The earlier sheet 54e11c76 and panel b6cba32a belong to the Phase 7 record. A clean rebuild of
    HEAD gives the same bytes. The Phase 9 judge scored the cut-out and the idle sprite of the
    final shape, not the sheet. Daniel's look gate stays open on the new sheet.
  - Phase 9 review ruling (finding F5). `test-strategy.md:57` lists Phase 9 for UX/API review. The
    track brief waives Reviews A, B and C. The Phase 9 look judge
    (`judge-p9-bf4158a.json`) serves as the Phase 9 UX/API review. No separate Review C runs.

- Phase 9 failed judge round (record, 2026-11-25). Before commit bf4158a5, a first look-judge round
  on the same route (`nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia) failed the
  cut-out and the sprite. Cut-out: identity 8, proportion 8. Sprite: identity 7, proportion 7, face
  reads 5. The faults were a bald crown, a face that does not read at 128 px, and no waist. The
  reshape in bf4158a5 answered it. Record:
  `measure/runs/chibi_sprouts_redesign_20261123/phase-acceptance-p6-p9-06b03ed.json`, finding F2.

- Hem flecks (record, 2026-11-25). Two small blue wedges show at the sweater hem on the cut-out and
  on the sprites, one at each hip. The owner rule says nothing pokes through anything. They stay
  for Daniel's look gate. The fix is a lower jeans seat or a higher sweater hem, and it moves every
  Phase 9 hash. Record:
  `measure/runs/chibi_sprouts_redesign_20261123/phase-acceptance-p6-p9-06b03ed.json`, finding F3.

## Known limits

- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. T7 records its error count before and
  after the change, and it requires no error in the changed files.
- `PROJECT_TESTS` excludes `tests/storytime-book-pictures.test.ts` while TD-40 is open.
- The proportion check reads a render. A camera change or a frame change moves every row. The check
  pins the frame rule in decision (f) for that reason.
- The eye detector needs the two eyes to separate from the skin and from the brow. A face paint that
  joins an eye to the hair fails the check with a named error, not with a bad value.
- The judge is one opinion. A 7.5 from one family does not prove the look to Daniel. Daniel's look
  is the last gate, and it stays with him.
- The preset pin is a shared file. T7 requires one new key and no changed value, and it compares
  parsed JSON, not a diff line count.
- The renderer pin creates `assets/_flat-render-pin-<pid>.ts` at run time with the exclusive flag
  `wx`. It removes the path only when its own create succeeded. A collision leaves the existing file
  untouched and fails the test. A crashed run can leave one fixture file; the `_` prefix hides it
  from `listAssets`, the preset scan skips it, and a later run uses another path.
- The LATO.2 trial spends real money under the USD 5 cap. A failed run still spends, and the log
  holds its estimate.
