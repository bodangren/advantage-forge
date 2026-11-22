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
- `tests/old-browser/no-es2022-builtins.test.ts` (new)
- `scripts/old-browser-check.mjs` (new)
- `out/old-browser/` (not in git)
- `measure/tracks/old_browser_builtins_20261122/*`

The heavy runner wraps every test run and every browser run:

```bash
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'
```

## Phase 1: Red

- [ ] T1 Red: Add `tests/old-browser/deep-copy.test.ts`, and pin the state types of the 29 games
      first. The file imports `../../src/apk3d/sim/copy.js` inside each case, so the state-type pin
      runs at HEAD, before the helper exists. The four cases:

  1. State types: build the start snapshot of each of the 29 games through
     `tests/games/<game>/helpers.ts`, walk every value, and require a plain object, an array, a
     string, a number, a boolean, `null`, or `undefined`. Print the type set.
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

- [ ] T2 Red: Add `tests/old-browser/index-math.test.ts`. The three cases:

  1. `atIndex` equals `Array.prototype.at` over the AC2 rule 2 table: an empty list, an index inside
     the range, a negative index inside the range, a negative index before the start, a positive
     index after the end, `-0`, a fractional index, `NaN`, `Infinity`, and `-Infinity`.
  2. `lastIndexWhere` equals `Array.prototype.findLastIndex` over the AC2 rule 3 table: no match,
     one match, several matches, and a match at index 0.
  3. The 9 sites: each file holds one `atIndex(` or `lastIndexWhere(` call and no array `.at(` and
     no `.findLastIndex(`. The case reads the file text and imports no view module.
  - Red evidence: `node node_modules/vitest/vitest.mjs run tests/old-browser/index-math.test.ts --maxWorkers=1`
  - Red done-when: the command exits 1. Cases 1 and 2 fail on the absent helper module, inside the
    case. Case 3 fails and names the 9 paths. No syntax or import error.
  - Record in this task: the 9 sites and their line numbers.

- [ ] T3 Red: Add `tests/old-browser/no-es2022-builtins.test.ts` per AC3. It strips block comments,
      line comments, and string and template literal text, then matches the 19 patterns. The named
      false positives stay out: `this.at(`, `.at(` with two or more arguments, `z.union(`, and the
      three `Box3.union` calls of `src/render/page.ts`. The two controls: a fixture string with
      every pattern fails, and a comment or a string with every pattern passes.
  - Red evidence: `node node_modules/vitest/vitest.mjs run tests/old-browser/no-es2022-builtins.test.ts --maxWorkers=1`
  - Red done-when: the command exits 1 with 46 hits: the 44 hits of AC1 and AC2 and the two
    `Object.hasOwn` hits of `src/apk3d/audio/`. Each hit line is `<path>:<line>: <pattern>`. The
    two controls pass. No syntax error.
  - Record in this task: the 46 hits as a list, grouped by pattern.
  - Dependency: the two hits in `src/apk3d/audio/` leave with task T6k of
    `audio_game_integration_20261014`. This track changes no file in that folder.

## Phase 2: Green

- [ ] T4 Green: Add `src/apk3d/sim/copy.ts` with `deepCopy` per AC1 rules 3 to 6, and
      `src/apk3d/sim/index-math.ts` with `atIndex` and `lastIndexWhere` per AC2 rules 2 and 3.
      Re-export the three functions from `src/apk3d/sim/index.ts`. Keep the module free of imports,
      because `apk3d/sim` may import only `apk3d/contracts`.
  - Green done-when: cases 1, 2, and 4 of T1 pass. Cases 1 and 2 of T2 pass. Case 3 of T2 still
    fails on the 9 sites.
  - Gate: `tests/apk3d/imports.test.ts` exits 0. The command is
    `node node_modules/vitest/vitest.mjs run tests/apk3d/imports.test.ts --maxWorkers=1`.
  - Type check: `node node_modules/typescript/bin/tsc --noEmit` reports no error in the two new
    modules. The 38 baseline errors of TD-35 to TD-39 stay open.

- [ ] T5 Green: Replace all 44 uses. The 35 `structuredClone` calls become `deepCopy`, with one
      import per file. The 8 `.at(` calls become `atIndex`, and the `findLastIndex` call of
      `src/host/reader.ts:197` becomes `lastIndexWhere`. The call order and the expression shape
      stay the same, because a copy or an index result is equal.
  - Green done-when: T1 and T2 exit 0. T3 exits 0 with the 2 audio hits only, or with zero hits when
    T6k has landed.
  - Gate: the AC4 command exits 0. The 29 snapshots pass the replay tests of their own game.
  - Record in this task: the 37 changed files, the 44 replacements, and the file count of each
    pattern.

- [ ] T6 Green: Close the scan. Run `tests/old-browser/no-es2022-builtins.test.ts` after task T6k of
      `audio_game_integration_20261014` lands, and record that commit here.
  - Green done-when: the T3 command exits 0 with zero hits, and this task names the audio commit and
    its date.
  - If T6k has not landed at the T5 gate, this task waits. The wait does not block the browser
    check or the gates, because the AC3 test reports the two known hits and AC5 covers behaviour.

## Phase 3: Browser check

- [ ] T7 Measure: Add `scripts/old-browser-check.mjs` per AC5. It serves the demo with the Vite dev
      server in the pattern of `scripts/apk3d-shot.ts`, opens `spellweavers-run` at
      `?qc=1&renderer=phaser`, and installs `context.addInitScript` before the first navigation. The
      init script deletes the four built-ins. The script asserts each absence in the page, starts
      the game, plays one move, and writes `out/old-browser/check.json` and two screenshots.
  - Run: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/old-browser-check.mjs --game spellweavers-run'`
  - Done-when: the command exits 0. `check.json` holds `started: true`, `moves` of 1 or more, and
    `errors: []`. The two screenshots exist. The plan records the game, the four deleted names, the
    move that ran, and the file paths.
  - If `spellweavers-run` cannot play a move in the 2D view, name the other 2D game with an `.at(`
    call and record the reason here.

## Phase 4: Gates

- [ ] T8 Gates: Run every gate of AC6 and record each exit code in this plan.
  - Commands, each run through the heavy runner where it starts tests:
    - `node node_modules/vitest/vitest.mjs run tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts tests/old-browser/no-es2022-builtins.test.ts --maxWorkers=1`
    - `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts`
    - `node measure/tools/generate.mjs --check`
    - `./measure/doctor.sh --structural-only`
    - `node_modules/.bin/prettier --check` on each new text file
  - Done-when: each command exits 0, and this plan holds one line per command with its date and its
    count. The three new test files pass in one run. A failure that belongs to TD-35 to TD-40 stays
    named as that debt and does not count as a pass.

## Known limits

- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. It reports 38 baseline errors.
- `PROJECT_TESTS` excludes `tests/storytime-book-pictures.test.ts` while TD-40 is open.
- The scan reads text. A built-in that a generated file or a dependency brings in is out of its
  reach, and the browser check of AC5 is the only runtime proof of the four deleted names.
