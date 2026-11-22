# Old-browser built-ins: every game and the host run on iOS 15.0+ and WebView 80+

Status: new. The plan records execution state. `spec.md` holds the acceptance criteria.

Decisions (a) to (c) and the acceptance criteria: `spec.md`, PM decision of 2026-11-22. The device
gate stays. Every game and the host must run on iOS 15.0+ and WebView 80+.

Lane: light. Phases 1 to 4. Source: PM decision of 2026-11-22. Due: 2026-11-27, before the Storytime
launch of 2026-11-30.

Files this track touches:

- `src/apk3d/sim/copy.ts` (new, `deepCopy`)
- `src/apk3d/sim/index-math.ts` (new, `atIndex` and `lastIndexWhere`)
- `src/apk3d/sim/index.ts` (the two exports)
- 29 `src/games/*/core/sim.ts` files (35 `structuredClone` calls; 5 files hold 2)
- `src/games/labyrinth/core/mazes.ts` (1 `structuredClone` call)
- `src/games/dragon-flight/view2d/game.ts` (1 `.at(` call)
- `src/games/dragon-rider/view2d/game.ts` (1 `.at(` call)
- `src/games/spellweavers-run/view/game.ts` (1 `.at(` call)
- `src/games/spellweavers-run/view2d/game.ts` (2 `.at(` calls)
- `src/storytime/book-pictures.ts` (3 `.at(` calls)
- `src/host/reader.ts` (1 `findLastIndex` call, line 197)
- `tests/old-browser/deep-copy.test.ts` (new)
- `tests/old-browser/index-math.test.ts` (new)
- `tests/apk3d/no-unpolyfilled-builtins.test.ts` (the root resolve to `src/`, the `SCAN_WIDE` flag
  that T3 adds and T5 removes, the one-pass strip, the whole-text patterns, the named exclusions, and
  the control table with its witness; the audio track committed the file at `1f45fcfe`)
- `scripts/old-browser-check.mjs` (new)
- `out/old-browser/` (not in git)
- `measure/tracks/old_browser_builtins_20261122/*`

The track adds no second scan file. `tests/apk3d/no-unpolyfilled-builtins.test.ts` is the one scan
(decision c of `spec.md`).

The heavy runner wraps every test run and every browser run:

```bash
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'
```

## Phase 1: Red

- [x] T1 Red (3d7db18f): Add `tests/old-browser/deep-copy.test.ts`, and pin the state types of the 29 games
      first. The file imports `../../src/apk3d/sim/copy.js` inside each case, so the state-type pin
      runs at HEAD, before the helper exists. The four cases:

  1. State types: build the start snapshot of each of the 29 games through
     `tests/games/<game>/helpers.ts`, walk every value, and record the observed type set per game
     first. Then require the allowed list: a plain object, an array, a string, a number, a boolean,
     `null`, or `undefined`.
  2. Equal values: a copy of each snapshot is `toEqual` its source, for each of the 29 games.
  3. No shared reference: change one nested value of a copy, and show the source unchanged, for each
     of the 29 games.
  4. Type probe: a fixture value with a `Map`, a `Set`, a `Date`, a typed array, an `ArrayBuffer`, an
     own `undefined` key, `NaN`, `Infinity`, `-Infinity`, and `-0` copies with equal content and no
     shared reference. A function, a symbol, a `WeakMap`, a `WeakSet`, and a promise each raise a
     `TypeError`.
  - Red evidence: `node node_modules/vitest/vitest.mjs run tests/old-browser/deep-copy.test.ts --maxWorkers=1`
  - Red done-when: the command exits 1. Case 1 passes and prints the type set. Cases 2 to 4 fail on
    the absent helper module, inside the case, with no collection, syntax, or import error.
    `node_modules/.bin/prettier --check tests/old-browser/deep-copy.test.ts` exits 0.
  - Record in this task: the 29 games, the type set that case 1 prints, and one line on each of the
    35 call sites.
  - Red evidence (commit `3d7db18f`): `node node_modules/vitest/vitest.mjs run
tests/old-browser/deep-copy.test.ts --maxWorkers=1` exits 1: 3 failed inside the case on the
    absent `src/apk3d/sim/copy.js`, 1 passed, no collection or syntax error (log
    `measure/runs/old_browser_builtins_20261122/red-deep-copy.log`).
    `node_modules/.bin/prettier --check tests/old-browser/deep-copy.test.ts` exits 0. Case 1
    printed all 29 sets (`red-deep-copy-types.log`), each a subset of the allowed list:
    abyssal-well (array, boolean, number, plain-object, string), alchemists-synthesis (+null),
    archers-revenge, astral-mage (+null), castle-defense, devourer-slime, dragon-flight (+null),
    dragon-rider (+null), dungeon-liberator, enchanted-library (+null), griffin-riders-escape,
    griffin-sky-joust, gryphon-patrol (+null), haunted-library, hero-vs-zombie, labyrinth (+null),
    magic-defense, monster-encounters (array, null, number, plain-object, string),
    paladins-twin-soul, potion-rush (+null), realm-carver (+null), rpg-battle (+null),
    rune-forge-chamber (+null), rune-match, shadow-gate-dungeon, sorcerer-ziggurat,
    spellweavers-run (+null), storm-castle-tower, village-guardian (base set plus `null` where
    noted; no game uses `undefined` at start). The 35 `structuredClone` sites:
    abyssal-well/core/sim.ts:221, alchemists-synthesis/core/sim.ts:156,
    archers-revenge/core/sim.ts:64+153, astral-mage/core/sim.ts:280, castle-defense/core/sim.ts:82+208,
    devourer-slime/core/sim.ts:378, dragon-flight/core/sim.ts:304, dragon-rider/core/sim.ts:265,
    dungeon-liberator/core/sim.ts:396, enchanted-library/core/sim.ts:389,
    griffin-riders-escape/core/sim.ts:265, griffin-sky-joust/core/sim.ts:99+313,
    gryphon-patrol/core/sim.ts:319, haunted-library/core/sim.ts:352, hero-vs-zombie/core/sim.ts:504,
    labyrinth/core/mazes.ts:232, labyrinth/core/sim.ts:479, magic-defense/core/sim.ts:126+231,
    monster-encounters/core/sim.ts:35, paladins-twin-soul/core/sim.ts:150,
    potion-rush/core/sim.ts:401, realm-carver/core/sim.ts:461, rpg-battle/core/sim.ts:152+214,
    rune-forge-chamber/core/sim.ts:204, rune-match/core/sim.ts:471,
    shadow-gate-dungeon/core/sim.ts:321, sorcerer-ziggurat/core/sim.ts:138,
    spellweavers-run/core/sim.ts:256, storm-castle-tower/core/sim.ts:348,
    village-guardian/core/sim.ts:436 (all `src/games/`, `+` joins two lines in one file).

- [x] T2 Red (3d7db18f): Add `tests/old-browser/index-math.test.ts`. The three cases:

  1. `atIndex` equals `Array.prototype.at` over the AC2 rule 2 table: an empty list, an index inside
     the range, a negative index inside the range, a negative index before the start, a positive
     index after the end, `-0`, a fractional index, `NaN`, `Infinity`, and `-Infinity`.
  2. `lastIndexWhere` equals `Array.prototype.findLastIndex` over the AC2 rule 3 table: no match,
     one match, several matches, and a match at index 0.
  3. The 8 `.at(` sites and the one `findLastIndex` site: each file holds a helper call and no array
     `.at(` and no `.findLastIndex(`. The case reads the file text and imports no view module. The
     nine lines are `src/games/dragon-flight/view2d/game.ts:565`,
     `src/games/dragon-rider/view2d/game.ts:591`, `src/games/spellweavers-run/view/game.ts:216`,
     `src/games/spellweavers-run/view2d/game.ts:311`, `src/games/spellweavers-run/view2d/game.ts:429`,
     `src/storytime/book-pictures.ts:2269`, `src/storytime/book-pictures.ts:3935`,
     `src/storytime/book-pictures.ts:4558`, and `src/host/reader.ts:197`.
  - Red evidence: `node node_modules/vitest/vitest.mjs run tests/old-browser/index-math.test.ts --maxWorkers=1`
  - Red done-when: the command exits 1. Cases 1 and 2 fail on the absent helper module, inside the
    case. Case 3 fails and names the nine lines. No syntax or import error.
  - Record in this task: the nine lines and the 8 `.at(` count against the 1 `findLastIndex` count.
  - Red evidence (commit `3d7db18f`): `node node_modules/vitest/vitest.mjs run
tests/old-browser/index-math.test.ts --maxWorkers=1` exits 1: all 3 cases fail, no syntax or
    file-scope import error (log `measure/runs/old_browser_builtins_20261122/red-index-math.log`).
    `node_modules/.bin/prettier --check tests/old-browser/index-math.test.ts` exits 0. Cases 1
    and 2 fail inside the case on the absent `src/apk3d/sim/index-math.js`. Case 3 names all nine
    lines with both a missing-helper and a still-calls entry: dragon-flight/view2d/game.ts:565,
    dragon-rider/view2d/game.ts:591, spellweavers-run/view/game.ts:216,
    spellweavers-run/view2d/game.ts:311+429, storytime/book-pictures.ts:2269+3935+4558 (8 `.at(`),
    host/reader.ts:197 (1 `findLastIndex`).

- [x] T3 Red (3d7db18f): Widen the committed scan `tests/apk3d/no-unpolyfilled-builtins.test.ts` per AC3, and
      commit that file here with the root behind the `SCAN_WIDE` flag. The default root stays
      `src/apk3d/audio/` until T5, so a suite run by any session without the flag stays green. The
      changes: `ROOT` from the file URL, `wide` from `process.env.SCAN_WIDE === '1'`, and
      `SCAN_ROOT` per AC3 rule 1; the strip is one left-to-right pass; the patterns run over the
      whole stripped text; the pattern list stays the 19 labels; the named exclusion rows join the
      file with the rot check; the control table and its `stripCommentsFirst` witness join the test.
      The controls run in both modes.
  - Red evidence, two runs, both from the repository root with the file in `tests/apk3d/`:
    - Wide run, the failing one:
      `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'SCAN_WIDE=1 node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/no-unpolyfilled-builtins.test.ts' > measure/runs/old_browser_builtins_20261122/red-scan.log 2>&1`
    - Default run, the green one:
      `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/no-unpolyfilled-builtins.test.ts' > measure/runs/old_browser_builtins_20261122/red-scan-default.log 2>&1`
  - Red done-when: the wide run exits 1 with 44 hits: 35 `structuredClone`, 8 array `.at(`, and 1
    `findLastIndex`. `Object.hasOwn` reports no hit, because task T6k `0cc7b5c4` fixed the two audio
    calls. Each hit line is `<path>:<line>: <label>`, and the line matches the real source line. The
    default run exits 0 with 1 file and 0 hits. The control test passes in both runs: the URL row,
    the template row, and the argument row each show 1 fixed hit and 0 witness hits, and the other
    rows match the AC3 table. No syntax error.
  - Commit: the widened test file lands in this task, so no session ever sees an uncommitted failing
    scan. The default scope stays audio-only through T4, and T5 removes the flag.
  - Record in this task: the 44 hits as a list, grouped by label, the two log paths, the two exit
    codes, and the commit.
  - Prerequisite, met: task T6k of `audio_game_integration_20261014` (`0cc7b5c4`) removed both
    `Object.hasOwn` calls from `src/apk3d/audio/`. A scan of `src/` at baseline `a414b406` finds
    none.
  - Red evidence (commit `3d7db18f`, same commit as the scan code): the wide run
    `SCAN_WIDE=1 node node_modules/vitest/vitest.mjs run --maxWorkers=1
tests/apk3d/no-unpolyfilled-builtins.test.ts` exits 1 with exactly 44 hits grouped by label:
    35 `structuredClone`, 8 array `.at(`, 1 `.findLastIndex`, 0 `Object.hasOwn` (log
    `measure/runs/old_browser_builtins_20261122/red-scan.log`, whose reporter line reads
    `expected [ …(44) ] to deeply equal []`). Each hit line is `<path>:<line>: <label>` and matches
    the source; the three `Box3.union` raw hits in `src/render/page.ts` (lines 263, 440, 447) stay
    out through the named exclusions with the rot check. The default run without the flag exits 0
    with 1 file and 2 passed tests (log `measure/runs/old_browser_builtins_20261122/red-scan-default.log`).
    The control test passes in both runs: URL, template, and argument rows show 1 fixed hit and 0
    witness hits; the receiver and two-line `structuredClone` rows show 1 hit for both scanners;
    the 19-label row shows 0 for both.
    `node_modules/.bin/prettier --check tests/apk3d/no-unpolyfilled-builtins.test.ts` exits 0.

## Phase 2: Green

- [x] T4 Green (c8ddd883): Add `src/apk3d/sim/copy.ts` with `deepCopy` per AC1 rules 3 to 6, and
      `src/apk3d/sim/index-math.ts` with `atIndex` and `lastIndexWhere` per AC2 rules 2 and 3.
      Re-export the three functions from `src/apk3d/sim/index.ts`. Keep the module free of imports,
      because `apk3d/sim` may import only `apk3d/contracts`.
  - Green evidence 2026-11-23: `node node_modules/vitest/vitest.mjs run tests/apk3d/imports.test.ts
    --maxWorkers=1` through the heavy runner exits 0 (1 file, 4 tests). The targeted
    `node node_modules/vitest/vitest.mjs run tests/old-browser/deep-copy.test.ts
    tests/old-browser/index-math.test.ts --maxWorkers=1` exits 1 as expected before T5: deep-copy
    cases 1, 2 and 4 pass, index-math cases 1 and 2 pass, and only index-math case 3 fails on the
    nine old sites. `node node_modules/typescript/bin/tsc --noEmit` reports no error in the three
    new or changed files; the run has 52 error lines against a measured baseline of 57 at this
    revision, because the five `Cannot find module` errors for the two new modules are gone.
    `node_modules/.bin/prettier --check` exits 0 on all three files.
  - `deepCopy` handles plain data, `Map`, `Set`, `Date`, typed arrays and `ArrayBuffer` through one
    WeakMap seen-set; a function, symbol, `WeakMap`, `WeakSet` or promise raises a TypeError.
    `atIndex` matches `ToIntegerOrInfinity`, including `NaN` to index 0, and `lastIndexWhere`
    scans from the tail.
  - Green done-when: cases 1, 2, and 4 of T1 pass. Cases 1 and 2 of T2 pass. Case 3 of T2 still
    fails on the 8 `.at(` sites and the 1 `findLastIndex` site.
  - Gate: `tests/apk3d/imports.test.ts` exits 0. The command is
    `node node_modules/vitest/vitest.mjs run tests/apk3d/imports.test.ts --maxWorkers=1`.
  - Type check: `node node_modules/typescript/bin/tsc --noEmit` reports no error in the two new
    modules. The 38 baseline errors of TD-35 to TD-39 stay open.

- [x] T5 Green (1dcc1043): Replace all 44 uses and remove the flag path. The 35 `structuredClone` calls become
      `deepCopy`, with one import per file. The 8 `.at(` calls become `atIndex`, and the
      `findLastIndex` call of `src/host/reader.ts:197` becomes `lastIndexWhere`. The call order and
      the expression shape stay the same, because a copy or an index result is equal. In
      `tests/apk3d/no-unpolyfilled-builtins.test.ts`, delete the `wide` line and the flag, set
      `SCAN_ROOT = join(ROOT, 'src')` without a condition, and keep the strip, the patterns, the
      exclusion rows, the controls, and the witness. A `grep -n SCAN_WIDE
tests/apk3d/no-unpolyfilled-builtins.test.ts` returns nothing.
  - Green evidence 2026-11-23: the commit changes 37 files: 29 game `core/sim.ts` files,
    `labyrinth/core/mazes.ts`, four view files, `storytime/book-pictures.ts`, `host/reader.ts`, and
    the scan test. The 44 replacements are 35 `deepCopy` calls across 30 files, 8 `atIndex` calls
    across 5 files, and 1 `lastIndexWhere` call in 1 file. Commit `1dcc1043` removes the flag.
    `grep -n SCAN_WIDE tests/apk3d/no-unpolyfilled-builtins.test.ts` returns nothing. A grep of
    `src/` finds 35 `deepCopy(` calls, no `structuredClone(`, no array `.at(` target and no
    `.findLastIndex(`.
  - The three-file gate
    `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts`
    through the heavy runner exits 0: 3 files passed, 9 tests passed. `node node_modules/typescript/bin/tsc
    --noEmit` reports no error in any changed file; 52 error lines remain against a measured
    baseline of 57 at this revision. `node_modules/.bin/prettier --check` on the changed files
    reports 35 pre-existing failures that also fail at HEAD, and zero new failures; the two new
    modules and the edited scan test pass. No baseline file is reformatted for style only.
  - The 29 game snapshot replay tests pass in the AC4 project run; no game test fails.
  - AC4 project gate 2026-11-23 at commit `b2d87dbe` (the audio track's parallel commit; the last
    old-browser source commit is `1dcc1043`): `node node_modules/vitest/vitest.mjs run
    --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts` through the heavy runner exits
    0. Reporter: `Test Files 228 passed (228)`, `Tests 3376 passed | 2 skipped (3378)`. The first
    attempt at this revision exited 1 only because the parallel audio track's `tests/audio-budget.test.ts`
    was still in its intentional Red state; after that track produced its measurement artifact the
    same command exited 0 with the counts above. No file of this track was changed between the two
    runs.
  - Green done-when: T1 and T2 exit 0. The scan without the flag exits 0 with zero hits, and its
    control test still passes. The AC4 command exits 0. The 29 snapshots pass the replay tests of
    their own game.
  - Gate, no flag anywhere in the command:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts'`
  - Record in this task: the 37 changed source files, the 44 replacements, the file count of each
    label, and the commit that removes the flag. T3 already committed the scan code, so this task
    commits the unconditional `src/` root with the replacements. No committed state holds a failing
    scan. The two T3 logs stay in `measure/runs/old_browser_builtins_20261122/`.

- [x] T6 Green (1dcc1043): Close the scan with its evidence. Record the zero-hit run of
      `tests/apk3d/no-unpolyfilled-builtins.test.ts` over `src/` without the flag, and record the met
      prerequisite.
  - Green evidence 2026-11-23: `HEAVY_MIN_AVAIL_MB=1500 bash
    /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node
    node_modules/vitest/vitest.mjs run --maxWorkers=1
    tests/apk3d/no-unpolyfilled-builtins.test.ts'` exits 0: 1 file passed, 2 tests passed, zero
    hits. The scan test at `1dcc1043` sets `SCAN_ROOT = join(ROOT, 'src')` with no condition;
    `grep -n SCAN_WIDE tests/apk3d/no-unpolyfilled-builtins.test.ts` returns nothing. Audio task
    T6k of `audio_game_integration_20261014` at `0cc7b5c4` removed the two `Object.hasOwn` calls
    before Red baseline `a414b406`, so this scan starts from 44 hits and never reports that label.
  - Control evidence: all six AC3 rows pass. The three rows where the witness `stripCommentsFirst`
    misses and the fixed scanner catches are "URL before a call on one line", "call in a template
    interpolation", and "argument on the next lines". The receiver row and the two-line
    `structuredClone(` row pass for both scanners; the 19-label row gives zero for both.
  - Done-when: this task holds the run command, the exit code 0, the date, and the commit. A `grep`
    of the test file finds no `SCAN_WIDE`. It names task T6k of `audio_game_integration_20261014` at
    `0cc7b5c4` as the commit that removed the two `Object.hasOwn` calls before the Red baseline
    `a414b406`, so the scan of AC3 starts at 44 hits and never reports that label.
  - Control evidence: the task records the 6 rows of the AC3 control table as they pass at Green,
    and it names the 3 rows where the witness `stripCommentsFirst` misses and the fixed scanner
    catches: the URL row, the template row, and the argument row. The same rows passed in the T3
    default run, so the controls hold with and without the flag.

- [~] T5r Green remediation (review r1 A-F1, C-F1, C-F4 JSDoc; Red 64ddb5e9)

- [x] T3r Red (64ddb5e9): review r1 test findings A-F2, A-F3, A-F4, C-F2, C-F3 and F1 regression cases
  - Red evidence (commit `64ddb5e9`): the three-file gate exits 1 with only the two F1 regression
    cases failing (`tests/old-browser/deep-copy.test.ts` sparse-array length and own `__proto__`
    key against the current `src/apk3d/sim/copy.ts`); the other 11 tests pass (log
    `measure/runs/old_browser_builtins_20261122/red-p2-r1-final.log`). The fail-first run before the
    scanner fix exited 1 with 4 failures: the same 2 F1 cases plus the 7 new scanner control rows
    and the exclusion-binding control (log `red-p2-r1-failfirst.log`). The scanner now distinguishes
    division from regex literals, matches nested `.at(` arguments and comments before `(`, keeps
    exact `this.`/`z.` receiver boundaries, binds each `src/render/page.ts` exclusion to its call
    text, and covers all 19 labels as code. The index-math site check requires the exact helper call
    at each of the nine distinct sites with a breakage proof per site. The TS2769 at
    `tests/old-browser/deep-copy.test.ts:101` is fixed without changing the state-type check:
    `tsc --noEmit` reports no error in `tests/old-browser/`. `prettier --check` exits 0 on the three
    test files.

## Phase 3: Browser check

- [ ] T7 Measure: Add `scripts/old-browser-check.mjs` per AC5. Prerequisite, met: task T6k
      (`0cc7b5c4`) removed both `Object.hasOwn` calls from `src/apk3d/audio/`. The script serves the
      demo with the Vite dev server in the pattern of `scripts/apk3d-shot.ts`, opens
      `spellweavers-run` at `?qc=1&renderer=phaser`, and installs `context.addInitScript` before the
      first navigation. The init script deletes the four built-ins. The script asserts each absence
      in the page, starts the game, plays one move, and writes `out/old-browser/check.json` and two
      screenshots.
  - Run: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/old-browser-check.mjs --game spellweavers-run'`
  - Done-when: the command exits 0. `check.json` holds `started: true`, `moves` of 1 or more, and
    `errors: []`. The two screenshots exist. The plan records the game, the four deleted names, the
    move that ran, and the file paths.
  - If `spellweavers-run` cannot play a move in the 2D view, name the other 2D game with an `.at(`
    call and record the reason here.

## Phase 4: Gates

- [ ] T8 Gates: Run every gate of AC6 and record each exit code in this plan.
  - Commands, each run through the heavy runner where it starts tests:
    - `node node_modules/vitest/vitest.mjs run tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts --maxWorkers=1`
    - `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts`
    - `node measure/tools/generate.mjs --check`
    - `./measure/doctor.sh --structural-only`
    - `node_modules/.bin/prettier --check` on each new or changed text file
  - Done-when: each command exits 0, and this plan holds one line per command with its date, its
    exit code, and the reporter output of the run. For the project command, the reporter line gives
    the file count, the passed test count, and the skipped count, and the line names the commit that
    the run tested. A pinned count from an earlier track is not part of the record.
  - A failure that belongs to TD-35 to TD-40 stays named as that debt and does not count as a pass.

## Known limits

- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. It reports 38 baseline errors.
- `PROJECT_TESTS` excludes `tests/storytime-book-pictures.test.ts` while TD-40 is open.
- The scan skips `*.gen.ts`, as the committed file does. A built-in that a generated file or a
  dependency brings in is out of its reach, and the browser check of AC5 is the only runtime proof
  of the four deleted names.
- The scan reads text. A call built from string concatenation, such as `Object['has' + 'Own']`, has
  no literal label and stays out of reach. A hit line is only as true as the strip, and AC3 rule 3
  keeps the newlines for that reason.
- The witness `stripCommentsFirst` exists only to prove the controls. It is never used on `src/`,
  and the scan test does not call it outside the control test.
