# Chibi Sprouts: new adult base on Teacher Kim, with Mom as the first trial

Status: new. The plan records execution state. `spec.md` holds the acceptance criteria and the
measurement method.

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
| T9   | the trial log, the verify row, and the result note                                                                                                                            | none                                                                                      |
| T10  | `judge.json` with both scores                                                                                                                                                 | none                                                                                      |
| T11  | the handoff, no command                                                                                                                                                       | none                                                                                      |
| T12  | the plan record                                                                                                                                                               | none                                                                                      |
| T13  | deferred; starts by amendment                                                                                                                                                 | none                                                                                      |
| T14  | deferred; starts by amendment                                                                                                                                                 | none                                                                                      |

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

- [ ] T4 Red: Pin the measurement. File: `tests/sprout-mom-kim.test.ts`.
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

- [ ] T5 Red: Pin the sheet layout. File: `tests/mom-kim-sheet.test.ts`.
  - Cases per AC5: the sheet size, the two rows and the `no side drawing` cell, one baseline and the
    700 px body scale, the lit row sources, the caption strip, and the two-cell `mom-panel.png`.
  - Done-when: the test exits 1 inside the cases on the absent script. No syntax or import error.
    `prettier --check` exits 0 on the file.
  - Record: the case names and the failure text.

## Phase 4: Green

- [ ] T6 Green: Write the measurement script. File: `scripts/proportion-check.mjs`.
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

- [ ] T7 Green: Build the new base and Mom. Files: `assets/parts/humanoid-kim.ts` (new),
      `assets/sprout-mom-kim.ts` (new), `tests/fixtures/preset-pin.json`.
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

- [ ] T8 Green: Write the sheet script. File: `scripts/mom-kim-sheet.mjs`.
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

## Phase 6: LATO.2 GPU trial (Daniel 2026-11-23, USD 5 cap)

- [ ] T9 Measure: Run one LATO.2 image-to-mesh trial on our own VM. Files:
      `out/chibi-sprouts/redesign/lato2-gpu/trial-log.tsv` and
      `measure/runs/chibi_sprouts_redesign_20261123/lato2-gpu/trial-result.md` (both new, not in
      git for the log path).
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
  - Record: the command list, the zone, the instance name, the total minutes, the total estimate, and
    the verify output. A missing verify row blocks the task.
  - The result feeds the PM decision at T12. It changes no row of the SDF pass table.

## Phase 7: Look

- [ ] T10 Measure (owner: the judge role): Run the independent look judge. File:
      `measure/runs/chibi_sprouts_redesign_20261123/judge.json` (new, not in git).
  - The judge reads `out/chibi-sprouts/redesign/mom-panel.png` and the numeric rows. It reads no Kim
    image (decision k).
  - The judge is on a family other than Green's and Red's.
  - Done-when: `judge.json` holds the AC4 rule 5 fields, and both scores are 7.5 or more. A lower
    score records the comment as the work list and returns the track to T7. A PM demand for a
    local-only judge stops the task (AC4 rule 7).
  - Record: the panel SHA-256, the judge model id and family, both scores, and the verdict.
  - This task uploads nothing and writes no script.

## Phase 8: PM stop

- [ ] T11 Measure: Hand the sheet to the PM. No file changes, and no command runs.
  - The handoff names: the sheet path, its SHA-256, the eleven measured rows, the judge record, the
    two AC3 palm results, the `mom-panel.png` path, the LATO.2 result note, and the fact that no
    cut-out and no sprite exist.
  - Done-when: the PM holds the handoff. The upload to Daniel waits for the PM's word (AC5 rule 7).
  - Record: nothing in this task. T12 records the handoff and the answer.

- [ ] T12 Measure: Record the handoff and the PM answer. File: this plan.
  - It records the handoff date, the PM's word, and the next step. A PM answer that asks for a shape
    change returns the track to T7 with the change as the work list. An approval opens Phase 9 by
    amendment (AC6 rule 3). The LATO.2 result informs the answer.
  - Done-when: this plan holds the handoff date, the PM's word, and the next task.
  - This line runs after T11, so T11 keeps its no-write rule.

## Phase 9: deferred:pm

These tasks start only by an amendment after the PM approves the shape at T12. No earlier task
builds their output (AC6).

- [ ] T13 (deferred:pm) Measure: One 900 px or taller song cut-out of Mom on the new base. Files: a
      cut-out step on the existing cut-out path, and `out/chibi-sprouts/redesign/cutout/`.
  - Every render run uses the wrapper:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
    The cut-out command takes a build slot.
  - Done-when: the amendment lands, the cut-out is transparent at 900 px or taller, and a second
    look judge rates it 7.5 or more. The plan records the command, the file size, and the score.

- [ ] T14 (deferred:pm) Measure: One 128 px idle sprite sample of Mom on the new base. Files:
      `out/sprout-mom-kim/sprites/` and its preview.
  - The sample is idle only. The walk clip comes from a later amendment task pair (AC6 rule 3).
  - Every render run uses the wrapper:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge sprites sprout-mom-kim --clip idle'`.
  - Done-when: the amendment lands, the idle sprites exist at 128 px, the face reads in
    `sprites/preview.png`, and a second look judge rates them 7.5 or more. The plan records the
    command, the preview path, and the score.

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
