# Old-browser built-ins: every game and the host run on iOS 15.0+ and WebView 80+

## Purpose

The device gate accepts iOS 15.0 and Android WebView 80. Both are older than the built-ins that the
game code calls. `structuredClone` throws on iOS 15.0 to 15.3 and on WebView 80 to 97. Every game
copies its state on the first move, so the failure stops the game at start.

This track removes the ES2022+ built-in uses outside the audio folder from `src/`. It adds one local
deep-copy helper and two local index helpers. It adds one scan that fails on a new unpolyfilled
built-in. The device gate stays.

## Context

- `vite.demo.config.ts:55` sets `target: 'es2020'`. Vite downlevels syntax to that target and adds
  no polyfill. `vite.config.ts` sets no target and takes the Vite default.
- No polyfill exists in `src/`, in `package.json`, or in the lockfile. `core-js` is absent.
- The gate admits iOS 15.0+ and WebView 80+. The two checks are `src/apk3d/device/gate.ts:115-116`.
  The values are `minIosVersion: 15` and `minWebViewChromeVersion: 80` in
  `src/apk3d/contracts/manifest.ts`.
- The scan of 2026-11-22 finds these hits in `src/` at baseline `a414b406`:

| Built-in             | First Safari | First Chrome | Uses                                | Where                                                                             |
| -------------------- | ------------ | ------------ | ----------------------------------- | --------------------------------------------------------------------------------- |
| `structuredClone`    | 15.4         | 98           | 35                                  | 29 `src/games/*/core/sim.ts` files and `src/games/labyrinth/core/mazes.ts`        |
| `Array.prototype.at` | 15.4         | 92           | 8                                   | 5 files, and every site is listed below                                           |
| `findLastIndex`      | 15.4         | 97           | 1                                   | `src/host/reader.ts:197`                                                          |
| `Object.hasOwn`      | 15.4         | 93           | 0 (2 fixed by audio T6k `0cc7b5c4`) | `src/apk3d/audio/bus.ts:263` and `src/apk3d/audio/chibi.ts:24` before that commit |

- The 8 array `.at(` sites, one file to line:

  - `src/games/dragon-flight/view2d/game.ts:565`
  - `src/games/dragon-rider/view2d/game.ts:591`
  - `src/games/spellweavers-run/view/game.ts:216`
  - `src/games/spellweavers-run/view2d/game.ts:311`
  - `src/games/spellweavers-run/view2d/game.ts:429`
  - `src/storytime/book-pictures.ts:2269`
  - `src/storytime/book-pictures.ts:3935`
  - `src/storytime/book-pictures.ts:4558`

- A recount of 2026-11-23 with a balanced-paren probe finds 17 single-argument `.at(` calls in
  `src/`: these 8, the 8 `this.at(` tile lookups of the two boards, and one doc comment
  (`src/sdf/profile.ts:189`). The count of this track is 8.
- Zero hits: `.findLast(`, `.toSorted(`, `.toReversed(`, `.toSpliced(`, `Object.groupBy`,
  `Map.groupBy`, `Promise.withResolvers`, `Array.fromAsync`, and the new Set methods.
- False positives to exclude by name: `this.at(` in `src/apk3d/hud/board.ts` and
  `src/apk3d/view2d/board2d.ts` (tile lookup), `.at(` with two or more arguments (shape, arena, and
  part moves), `z.union(` in the contract schemas, and the three `Box3.union` calls in
  `src/render/page.ts`.
- The state of every sim is plain data at this revision: objects, arrays, strings, numbers,
  booleans, `null`, and optional properties (`translation?`, `paragraph?`) that give `undefined`.
  No state holds a `Map`, a `Set`, a `Date`, or a typed array. The Red pins record this. The helper
  still copies those types, because a later state can hold one.
- The audio track committed one scanner, `tests/apk3d/no-unpolyfilled-builtins.test.ts`
  (`1f45fcfe`), with `SCAN_ROOT` on `src/apk3d/audio/`. This track widens that constant to `src/`.
  Its two `Object.hasOwn` hits left with task T6k (`0cc7b5c4`), which is in the baseline.

The total is 44 hits at baseline `a414b406`: 35 `structuredClone`, 8 array `.at(`, and 1
`findLastIndex`. This track owns all 44. The audio track had 2 more before T6k, so the number was 46
at the track creation.

## Decisions

| #   | PM decision 2026-11-22     | Rule                                                                                                                                                                                                                                                        |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | The device gate stays      | The track changes no gate value. Old Android phones with WebView 80 to 97 are the audience. The code must fit the gate, not the reverse.                                                                                                                    |
| b   | No new dependency          | The track adds no package and no `core-js`. The copy helper and the index helpers are local modules in `src/apk3d/sim/`. The build target stays `es2020`.                                                                                                   |
| c   | One scan for all of `src/` | The audio track committed one scanner, `tests/apk3d/no-unpolyfilled-builtins.test.ts` (`1f45fcfe`). This track widens its `SCAN_ROOT` to `src/`, adds the missing patterns, the controls, and the named exclusions to that file. It adds no second scanner. |

## Scope

- One deep-copy helper that replaces the 35 `structuredClone` calls.
- Two index helpers that replace the 8 array `.at(` calls and the one `findLastIndex` call.
- One widened scan in `tests/apk3d/no-unpolyfilled-builtins.test.ts`, with the pattern list, the
  controls, and the named false positives.
- One headless browser check that deletes four built-ins before the page loads, in the pattern of
  `scripts/apk3d-shot.ts`.
- The barrel export in `src/apk3d/sim/index.ts`.

## Exclusions

- No new dependency and no `core-js` (decision b).
- No change to the device gate (decision a).
- No change to the Vite target and no change to the shape of the build output.
- A second scan file. The committed scanner is the one source of truth (decision c).
- The two `Object.hasOwn` hits in `src/apk3d/audio/`. Task T6k `0cc7b5c4` fixed them already.
- Game rules, content, strings, and rendering. A modern browser sees equal snapshot values and
  equal index results.
- `tests/`, `scripts/`, and `demo/` files outside the changed scan file and the new check. The scan
  reads `src/` only.
- The monorepo. A later sync carries the change there. This track writes no monorepo file.
- A polyfill in the page. A polyfill runtime is a new dependency, and decision b forbids it.

## Acceptance criteria

### AC1: Deep copy

1. `src/apk3d/sim/copy.ts` exports `deepCopy<T>(value: T): T`. `src/apk3d/sim/index.ts` re-exports
   it.
2. Each of the 35 `structuredClone` calls becomes one `deepCopy` call. A scan of `src/` finds no
   `structuredClone`.
3. A copy keeps every type that a sim state holds: a plain object with own string keys, an array, a
   string, a finite or a non-finite number, a boolean, `null`, and an own key with the value
   `undefined`. `NaN`, `Infinity`, `-Infinity`, and `-0` stay the same value.
4. A copy keeps a `Map`, a `Set`, a `Date`, a typed array, and an `ArrayBuffer` with equal content.
   The Red probe covers each of these types, although no state holds one today.
5. A copy shares no object, array, `Map`, `Set`, `Date`, buffer, or typed array with the source at
   any depth. Two copies share nothing.
6. The helper throws a `TypeError` for a value that it cannot copy: a function, a symbol, a
   `WeakMap`, a `WeakSet`, or a promise.
7. `tests/old-browser/deep-copy.test.ts` holds the cases. It imports the helper inside each case, so
   the state-type pin runs before the helper exists.
8. Case "state types" builds the start snapshot of each of the 29 games through
   `tests/games/<game>/helpers.ts` and walks every value. It records the observed type set of each
   game first, then it requires the allowed list: a plain object, an array, a string, a number, a
   boolean, `null`, or `undefined`. The plan records the observed sets.
9. Case "equal values" compares a copied snapshot with its source by `toEqual`, for each of the 29
   games.
10. Case "no shared reference" changes a nested value of a copy and shows the source unchanged, for
    each of the 29 games.

### AC2: Index math

1. `src/apk3d/sim/index-math.ts` exports `atIndex(list, index)` and
   `lastIndexWhere(list, predicate)`. `src/apk3d/sim/index.ts` re-exports both.
2. `atIndex` returns the same value as `Array.prototype.at` for each argument: an empty list, an
   index inside the range, a negative index inside the range, a negative index before the start, a
   positive index after the end, `-0`, a fractional index, `NaN`, `Infinity`, and `-Infinity`.
3. `lastIndexWhere` returns the same index as `Array.prototype.findLastIndex` for a list with no
   match, one match, several matches, and a match at index 0. It returns -1 for no match.
4. Each of the 8 `.at(` calls and the `findLastIndex` call at `src/host/reader.ts:197` becomes one
   helper call. A scan of `src/` finds no array `.at(` and no `.findLastIndex(`.
5. `tests/old-browser/index-math.test.ts` compares both helpers with the native methods over the
   tables of rule 2 and rule 3. It also reads the 9 old call sites as text: the 8 `.at(` calls and
   the one `findLastIndex` call. Each site holds a helper call and no `.at(` or `.findLastIndex(`:

   - `src/games/dragon-flight/view2d/game.ts:565`
   - `src/games/dragon-rider/view2d/game.ts:591`
   - `src/games/spellweavers-run/view/game.ts:216`
   - `src/games/spellweavers-run/view2d/game.ts:311`
   - `src/games/spellweavers-run/view2d/game.ts:429`
   - `src/storytime/book-pictures.ts:2269`
   - `src/storytime/book-pictures.ts:3935`
   - `src/storytime/book-pictures.ts:4558`
   - `src/host/reader.ts:197`

### AC3: The scan

1. `tests/apk3d/no-unpolyfilled-builtins.test.ts` is the one scan, and it stays at that path. It
   resolves its root from its own URL, with these lines:

   ```ts
   const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
   const wide = process.env.SCAN_WIDE === '1';
   const SCAN_ROOT = wide ? join(ROOT, 'src') : join(ROOT, 'src', 'apk3d', 'audio');
   ```

   The two steps go up from `tests/apk3d/` to the repository root. During T3 and T4 the default run
   scans `src/apk3d/audio/` only, so a session that runs the suite without the flag stays green.
   Task T5 removes the `wide` line and the flag, and `SCAN_ROOT` becomes `join(ROOT, 'src')` without
   a condition. A copy of the file elsewhere would resolve another root, so the file never moves.

2. The scan walks every `.ts` file under `SCAN_ROOT` and skips `*.gen.ts`.
3. The strip is one left-to-right pass with a state for code, a line comment, a block comment, a
   single-quoted string, a double-quoted string, template text, and a template `${...}` expression.
   A string or a comment ends at its own terminator and never at a `//` inside a string. Template
   text is dropped, and each `${...}` content is scanned as code, with nested braces counted. Dropped
   characters become spaces, and each newline stays. One pass is the rule: the scan does not strip
   comments first, because a URL string would then cut the rest of its line.
4. The patterns run over the whole stripped text, not line by line, so a call that spans lines is
   found. The pattern list stays the 19 labels of the committed file: `Object.hasOwn`,
   `structuredClone`, an array `.at(` with one argument, `.findLast(`, `.findLastIndex(`,
   `.toSorted(`, `.toReversed(`, `.toSpliced(`, `Object.groupBy`, `Map.groupBy`,
   `Promise.withResolvers`, `Array.fromAsync`, `.union(`, `.intersection(`, `.difference(`,
   `.symmetricDifference(`, `.isSubsetOf(`, `.isSupersetOf(`, and `.isDisjointFrom(`. The `.at(`
   pattern allows whitespace and newlines inside its one argument, and it excludes a `this.` receiver.
   No label is missing today. A new unpolyfilled built-in joins this list with its own label and its
   own probe.
5. The named false positives stay out by pattern or by exclusion row: `this.at(` (the board tile
   lookup), `.at(` with two or more arguments, `z.union(`, and the three `Box3.union` calls of
   `src/render/page.ts` at lines 263, 440, and 447. An exclusion row names the file, the line, and
   the reason, and it must still match a hit today. An exclusion that matches nothing fails the
   test, so the list cannot rot.
6. A hit fails the test with the line `<path>:<line>: <label>`. The path starts at the repository
   root, and the line comes from the match index: one plus the newlines before it.
7. The controls are fixture strings inside the test file, not files under `src/`. A `\n` in a
   fixture marks a line break. Each row names a fixture, the hits of the fixed scanner, and the hits
   of a witness that strips comments before strings. The witness stays in the test as
   `stripCommentsFirst`, and only the control test uses it. The rows:

   | Control                                | Fixture                                             | Fixed | Witness |
   | -------------------------------------- | --------------------------------------------------- | ----- | ------- |
   | URL before a call on one line          | `const u = "https://e.test/x"; structuredClone(s);` | 1     | 0       |
   | Call in a template interpolation       | ``const t = `copy ${structuredClone(s).phase}`;``   | 1     | 0       |
   | Receiver on the next line              | `const l = [...m.values()]\n  .at(-1);`             | 1     | 1       |
   | Argument on the next lines             | `const l = [...m.values()].at(\n  -1,\n);`          | 1     | 0       |
   | `structuredClone(` over two lines      | `const s = structuredClone(\n  state\n);`           | 1     | 1       |
   | Every label inside comments or strings | the 19 labels inside one comment and one string     | 0     | 0       |

   Three rows demand a fixed hit and a witness miss: the URL row, the template row, and the argument
   row. A scanner that still misses any of the three fails the test. The two multi-line rows that
   both scanners catch are regression pins: the fixed scanner must keep them. The last row proves
   that a comment and a string never hide a call, and that the strip does not invent a hit. The
   controls run in both modes, because they do not read `SCAN_ROOT`. The source of the first two rows
   is audio review A round 6 F2 and audio adversarial round 5 F1.

8. Red runs with `SCAN_WIDE=1` and reports 44 hits: 35 `structuredClone`, 8 array `.at(`, and 1
   `findLastIndex`. Without the flag it reports zero hits, because the audio folder holds none. Green
   holds no flag path, and the scan over `src/` reports zero hits. `Object.hasOwn` reports no hit in
   every mode, because task T6k (`0cc7b5c4`) fixed the two audio calls in the baseline.
9. The scan reads `src/` only. `tests/`, `scripts/`, and `demo/` stay out of scope.

### AC4: Existing tests

Every test file that exists at the track start passes without an edit. The project test gate is
`node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts`.
The plan records the reporter output of the actual run: the file count, the test count, the skipped
count, the exit code 0, and the commit that the run tested. This track adds two test files and
changes one existing test file, `tests/apk3d/no-unpolyfilled-builtins.test.ts`. No other existing
test file changes. A pinned count from an earlier track is not evidence for this track.

### AC5: Browser check

1. Prerequisite, met: task T6k of `audio_game_integration_20261014` (`0cc7b5c4`) removed both
   `Object.hasOwn` calls from `src/apk3d/audio/`. A scan of `src/` at baseline `a414b406` finds none.
   The deletion of rule 4 is therefore valid, and no game start can fail on that name.
2. `scripts/old-browser-check.mjs` serves the demo with the Vite dev server, in the pattern of
   `scripts/apk3d-shot.ts`.
3. It opens one 2D game at `?qc=1&renderer=phaser`. The first choice is `spellweavers-run`, because
   its 2D host holds two `.at(` calls and its core holds a `structuredClone` call. A different 2D
   game with a `.at(` call may replace it. The plan records the choice.
4. `context.addInitScript` deletes `structuredClone`, `Array.prototype.at`,
   `Array.prototype.findLastIndex`, and `Object.hasOwn` before any page script runs.
5. The script asserts in the page that all four values are absent.
6. It starts the game with `[data-game="<id>"]`, `[data-read]`, `[data-next]`, and `[data-start]`,
   then plays one move.
7. It records each `pageerror` and each console error.
8. It writes `out/old-browser/check.json` with `game`, `deleted`, `started`, `moves`, and `errors`,
   and two screenshots.
9. It exits 0 when `started` is true, `moves` is 1 or more, and `errors` is empty.

### AC6: Gates

These commands pass, and the plan records each exit code:

- `node node_modules/vitest/vitest.mjs run tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts --maxWorkers=1`
- `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts`
- `node measure/tools/generate.mjs --check`
- `./measure/doctor.sh --structural-only`
- `node_modules/.bin/prettier --check` on each new or changed text file

## Sources

- [Demo build target](../../../vite.demo.config.ts)
- [Device gate](../../../src/apk3d/device/gate.ts)
- [Device requirements](../../../src/apk3d/contracts/manifest.ts)
- [Simulation barrel](../../../src/apk3d/sim/index.ts)
- [One sim with a state copy](../../../src/games/abyssal-well/core/sim.ts)
- [The maze copy](../../../src/games/labyrinth/core/mazes.ts)
- [A 2D view with `.at(`](../../../src/games/spellweavers-run/view2d/game.ts)
- [The book picture `.at(` calls](../../../src/storytime/book-pictures.ts)
- [The reader `findLastIndex`](../../../src/host/reader.ts)
- [The committed built-in scan](../../../tests/apk3d/no-unpolyfilled-builtins.test.ts)
- [Audio review A round 6](../../runs/audio_game_integration_20261014/review-a-a414b40.json)
- [Audio adversarial round 5](../../runs/audio_game_integration_20261014/adversarial-p3-a414b40.json)
- [Browser check pattern](../../../scripts/apk3d-shot.ts)
- [Audio track plan](../audio_game_integration_20261014/plan.md)

## Scope control

This track adds two source modules, two test files, and one script. It changes one test file
(`tests/apk3d/no-unpolyfilled-builtins.test.ts`), 30 game files, 5 view and storytime files, one host
file, and one barrel. It changes no game rule, no content, no string, and no renderer. It adds no
dependency, changes no gate value, and changes no Vite target. It pushes nothing and writes nothing
in the monorepo.
