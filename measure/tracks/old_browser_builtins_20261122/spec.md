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
- The scan of 2026-11-22 finds these hits in `src/`:

| Built-in             | First Safari | First Chrome | Uses | Where                                                                                                                                         |
| -------------------- | ------------ | ------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `structuredClone`    | 15.4         | 98           | 35   | 29 `src/games/*/core/sim.ts` files and `src/games/labyrinth/core/mazes.ts`                                                                    |
| `Array.prototype.at` | 15.4         | 92           | 8    | `dragon-flight` and `dragon-rider` `view2d/game.ts`, `spellweavers-run` `view/game.ts` and `view2d/game.ts`, `src/storytime/book-pictures.ts` |
| `findLastIndex`      | 15.4         | 97           | 1    | `src/host/reader.ts:197`                                                                                                                      |
| `Object.hasOwn`      | 15.4         | 93           | 2    | `src/apk3d/audio/bus.ts:263` and `src/apk3d/audio/chibi.ts:24` (audio track T6k)                                                              |

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
- The audio track scoped its own scan to `src/apk3d/audio/`. Its scan file was not committed (PM
  order of 2026-11-22). This track widens the scan to `src/`.

The total is 46 hits. This track owns the 44 hits outside the audio folder. The audio track
`audio_game_integration_20261014` owns the two `Object.hasOwn` hits (task T6k).

## Decisions

| #   | PM decision 2026-11-22     | Rule                                                                                                                                                                           |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| a   | The device gate stays      | The track changes no gate value. Old Android phones with WebView 80 to 97 are the audience. The code must fit the gate, not the reverse.                                       |
| b   | No new dependency          | The track adds no package and no `core-js`. The copy helper and the index helpers are local modules in `src/apk3d/sim/`. The build target stays `es2020`.                      |
| c   | One scan for all of `src/` | The audio track scan covers `src/apk3d/audio/`. This track's scan covers every `.ts` file under `src/`, and it keeps the audio folder in scope. It replaces no committed file. |

## Scope

- One deep-copy helper that replaces the 35 `structuredClone` calls.
- Two index helpers that replace the 8 array `.at(` calls and the one `findLastIndex` call.
- One scan test over `src/`, with the pattern list and the named false positives.
- One headless browser check that deletes four built-ins before the page loads, in the pattern of
  `scripts/apk3d-shot.ts`.
- The barrel export in `src/apk3d/sim/index.ts`.

## Exclusions

- No new dependency and no `core-js` (decision b).
- No change to the device gate (decision a).
- No change to the Vite target and no change to the shape of the build output.
- The two `Object.hasOwn` hits in `src/apk3d/audio/`. The audio track T6k owns them.
- Game rules, content, strings, and rendering. A modern browser sees equal snapshot values and
  equal index results.
- `tests/`, `scripts/`, and `demo/` files outside the new scan and the new check. The scan reads
  `src/` only.
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
   `tests/games/<game>/helpers.ts` and walks every value. Each value is a plain object, an array, a
   string, a number, a boolean, `null`, or `undefined`. The case prints the type set, and the plan
   records it.
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
   tables of rule 2 and rule 3. It also reads the 9 sites as text, and it requires a helper call and
   no `.at(` or `.findLastIndex(` in each one: `src/games/dragon-flight/view2d/game.ts`,
   `src/games/dragon-rider/view2d/game.ts`, `src/games/spellweavers-run/view/game.ts`,
   `src/games/spellweavers-run/view2d/game.ts`, `src/storytime/book-pictures.ts`, and
   `src/host/reader.ts`.

### AC3: The scan

1. `tests/old-browser/no-es2022-builtins.test.ts` reads every `.ts` file under `src/` and strips
   block comments, line comments, and the text of string and template literals before it matches.
2. The pattern list is: `Object.hasOwn`, `structuredClone`, an array `.at(` with one argument,
   `.findLast(`, `.findLastIndex(`, `.toSorted(`, `.toReversed(`, `.toSpliced(`, `Object.groupBy`,
   `Map.groupBy`, `Promise.withResolvers`, `Array.fromAsync`, `.union(`, `.intersection(`,
   `.difference(`, `.symmetricDifference(`, `.isSubsetOf(`, `.isSupersetOf(`, and
   `.isDisjointFrom(`.
3. The exclusion list is by name: `this.at(` (the board tile lookup), `.at(` with two or more
   arguments, `z.union(`, and the three `Box3.union` calls in `src/render/page.ts`.
4. A hit fails the test with the line `<path>:<line>: <pattern>`.
5. Two controls guard the scan. A fixture string with every pattern fails, and a comment or a string
   with every pattern passes.
6. The scan reports 46 hits at Red: the 44 hits of this track and the two `Object.hasOwn` hits of
   the audio track. It reports zero at Green, after task T6k of the audio track lands.
7. The scan reads `src/` only. `tests/`, `scripts/`, and `demo/` stay out of scope.

### AC4: Existing tests

Every test file that exists at the track start passes without an edit. The project test gate is
`node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts`.
The audio plan recorded 217 files and 3,299 tests for it on 2026-11-22. This track adds three test
files and changes no existing test file.

### AC5: Browser check

1. `scripts/old-browser-check.mjs` serves the demo with the Vite dev server, in the pattern of
   `scripts/apk3d-shot.ts`.
2. It opens one 2D game at `?qc=1&renderer=phaser`. The first choice is `spellweavers-run`, because
   its 2D host holds two `.at(` calls, its core holds a `structuredClone` call, and the audio wiring
   calls `Object.hasOwn`. A different 2D game with a `.at(` call may replace it. The plan records
   the choice.
3. `context.addInitScript` deletes `structuredClone`, `Array.prototype.at`,
   `Array.prototype.findLastIndex`, and `Object.hasOwn` before any page script runs.
4. The script asserts in the page that all four values are absent.
5. It starts the game with `[data-game="<id>"]`, `[data-read]`, `[data-next]`, and `[data-start]`,
   then plays one move.
6. It records each `pageerror` and each console error.
7. It writes `out/old-browser/check.json` with `game`, `deleted`, `started`, `moves`, and `errors`,
   and two screenshots.
8. It exits 0 when `started` is true, `moves` is 1 or more, and `errors` is empty.

### AC6: Gates

These commands pass, and the plan records each exit code:

- `node node_modules/vitest/vitest.mjs run tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts tests/old-browser/no-es2022-builtins.test.ts --maxWorkers=1`
- `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts`
- `node measure/tools/generate.mjs --check`
- `./measure/doctor.sh --structural-only`
- `node_modules/.bin/prettier --check` on each new text file

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
- [Browser check pattern](../../../scripts/apk3d-shot.ts)
- [Audio track plan](../audio_game_integration_20261014/plan.md)

## Scope control

This track adds two source modules, three test files, and one script. It changes 30 game files, 5
view and storytime files, one host file, and one barrel. It changes no game rule, no content, no
string, and no renderer. It adds no dependency, changes no gate value, and changes no Vite target.
It pushes nothing and writes nothing in the monorepo.
