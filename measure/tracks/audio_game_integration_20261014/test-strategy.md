# Test strategy: Sound in the games

Track: `audio_game_integration_20261014`. Phases 1 to 6 of `plan.md`. Lane: light.
Sources: `spec.md` (amendment 2026-11-22), `plan.md`, `metadata.json`, spec-review r2 at
`6dc8114f`.

## Base SHA and capture point

HEAD at the start of this strategy revision is
`3f6a19214994e7ac05a79a8fa7faeded684267b7`. Record it as `role_base_sha` for this revision only.
Phase 3 was accepted at `aaf678693732984a6adbc78af1157610e8225fd9`. Neither SHA is
`phase_base_sha`. Both predate this committed strategy.

The orchestrator must capture the immutable `phase_base_sha` with `git rev-parse HEAD` at this
exact point: as the first command after the commit that adds this `test-strategy.md` lands on the
branch, before any Red command runs. The captured value is the new HEAD of that commit. It cannot
equal `3f6a1921...` unless the strategy commit itself is HEAD. Write the captured value into the
run artifacts, never into a file that predates the commit. Run Red, Green, adversarial, and every
review against that captured SHA. A remediation commit invalidates the review artifacts and needs
a fresh capture and fresh reviews. Do not embed a SHA that predates the committed strategy in a
`phase_base_sha` field.

## Risk classification

| Phase | Risk   | Reason                                                                                                                                             |
| ----- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | medium | A data file and a cross-reference scan of `src/`. A loose pattern can pass on a partial map (A7), and the map is silent input.                     |
| 2     | medium | A pinned external binary writes binary files. The contract is an exact argv and three exact failure lines.                                         |
| 3     | high   | The change sits in shared game runtime. Thirty files construct the bus, and the six driver views call `.sfx`. Browser-only globals need a harness. |
| 4     | high   | A headless browser with network emulation and a timing budget. A run with zero audio rows can pass as "measured" (A4).                             |
| 5     | medium | Delivery to the PM. Files, checksums, and a proposed path. The monorepo must stay untouched.                                                       |
| 6     | low    | Deferred work. No code, no file, no command. The risk is a false "done" mark (A6, A8).                                                             |

## Test layers and global rules

Three layers, kept separate in every report:

1. **Fixture layer.** `spawnSync` scripts and fake binaries (Phases 1, 2, 5). A fake proves
   process behavior only. A four-byte `OggS` output is not a valid Ogg file.
2. **Unit layer, fake platform.** `tests/apk3d/audio-files.test.ts` installs a fake
   `window.AudioContext`, a fake `Audio`, and a fake `fetch`. It needs no audio device and no
   network. `vitest` runs the Node environment here (no jsdom). The test must define
   `globalThis.window`, `globalThis.navigator`, `globalThis.Audio`, and `globalThis.fetch` itself.
3. **Live-behavior proof.** The real earshot render (Phase 2) and the real headless browser
   measurement (Phase 4). A passing fixture or unit test does not prove a real render or a real
   fetch of a committed file.

Documentation and artifact checks are a fourth, non-behavioral layer: `prettier --check`,
`node measure/tools/generate.mjs --check`, `./measure/doctor.sh --structural-only`, and the
Phase 5 checksum gate. They prove format, record freshness, and file integrity. They prove no
runtime behavior and no audible sound.

Targeted command shape for every phase:

```
node node_modules/vitest/vitest.mjs run --maxWorkers=1 <files>
```

Every heavy command goes through the shared runner. Exit 75 means wait and retry, never a test
result:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'
```

## Phase 1: Event map

Risk: `medium`. The map is the input that Phase 3 and the games will trust.

**Red command (targeted).**

```
node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/audio-event-map.test.ts
```

**Red done-when.** Exit 1. The failure is `ENOENT` for `docs/sound-event-map.tsv`. No syntax or
import error. 8 tests are collected and each fails on the missing file, not on a skip.
`prettier --check tests/audio-event-map.test.ts` exits 0.

**Green gate.** The same command exits 0 with 8 of 8 tests passing. `docs/sound-event-map.tsv`
holds one header line and 58 data rows and no other line. `prettier --check` passes on the test
file and the plan/metadata text files. `.tsv` has no prettier parser, so never pass it to
prettier.

**Closeout addition.** The map stays byte-identical to the Green commit. `git status --short`
lists only `docs/sound-event-map.tsv`, `tests/audio-event-map.test.ts`, and the track files.

**Fixtures and assertions.** Read the map with `readFileSync` and split on `\n` and `\t`. No
library, no shell. The eight plan cases, with the exact defense:

| Case | Assertion                                                                                                   | Falsification                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1    | Header equals `event\tsource\tnote`. Line count is 59.                                                      | A comment line, a blank line, CRLF, or 57/60 rows fails.       |
| 2    | Three fields per row. `event` values unique. `source` in the seven `chibi/*` values or `synth`.             | A fourth field, a duplicate event, or an unknown source fails. |
| 3    | The event set equals the 58 spec names, compared in both directions.                                        | One missing or one extra name fails with the name printed.     |
| 4    | Each of the 31 mapped rows carries the spec table source.                                                   | A moved name fails, even if the count stays 31.                |
| 5    | Each of the 27 `synth` rows carries `synth`.                                                                | A mapped row counted as synth fails.                           |
| 6    | Each of the seven set entries appears at least once.                                                        | A source with zero rows fails.                                 |
| 7    | The seven `chibi` names equal the `name` values of `sounds/sets/chibi.json`.                                | A map entry with no rendered file fails.                       |
| 8    | The map name set equals the `src/` literal-name set from `audio.play('`, `audio.defineSfx('`, and `.sfx('`. | An unmatched name in either direction fails with the name.     |

Case 8 must print the extracted set size as a labeled integer and compare it to 58 before the
set equality. `src/` holds 368 `audio.play` calls with 58 unique literal names. A pattern change
that finds 57 must fail on the count, not pass on a subset.

**Anti-pattern coverage.**

| ID  | Defense                                                                                 | Falsification                                                          |
| --- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A3  | Parse the row count and the 31/27 split as labeled integers and compare to 58, 31, 27.  | A count read from a path, a note, or a date fails.                     |
| A4  | Require 58 data rows and both directions. Zero rows, or one direction only, fails.      | An empty or one-sided map cannot pass.                                 |
| A5  | The Red run must fail on ENOENT. Never use `skip` or a conditional guard around case 1. | A green Red run, or a pass without the map file, fails.                |
| A7  | Exact patterns with a quote terminator. Exact field splits. No `includes` on a name.    | A name match by substring, or a 3-field assert on a split of 4, fails. |
| A9  | The test reads repo-relative paths only. It never reads `measure/archive/**.`           | A test path into an archived track fails review.                       |
| A10 | Run `generate.mjs --check` after the docs commit.                                       | Stale committed facts fail at closeout.                                |

## Phase 2: MP3 copies in the wrapper

Risk: `medium`. The wrapper writes binary files through an external binary.

**Red command (targeted).**

```
node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sound-set.test.ts tests/sound-set-mp3.test.ts
```

**Red done-when.** Exit 1. Case 1 fails on the absent MP3 stdout line and on the absent ffmpeg
call. Case 5 fails with `ENOENT` for `sounds/chibi/<name>.mp3`. No syntax or import error.

**Green gate.** The same command exits 0. The render command exits 0 and writes 14 files:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'bash scripts/sound-setup.sh && node scripts/sound-set.mjs chibi'
```

`sounds/README.md` holds byte size and duration for both formats and the render-host ffmpeg
version. The host reports `ffmpeg version 8.0.1-3ubuntu2` today; record the line the Green host
prints, not this one.

**Closeout addition.** The seven `.mp3` files are staged with explicit paths. The venv and
`out/` are never staged. Re-run case 5 on the committed bytes.

**Fixtures.** `spawnSync(process.execPath, [SCRIPT, set])` with `SOUNDS_ROOT=<temp root>`,
`EARSHOT_BIN=<fake earshot>`, and `FFMPEG_BIN=<fake ffmpeg>`. Each fake appends
`process.argv.slice(2).join(' ')` to its own log before any failure branch, so a failed call is
still recorded. The fake earshot keeps the existing contract: derive the name from `-o`, print
`fake-out`/`fake-err`, write `OggS`, honor `fail-at` and `no-write`. The fake ffmpeg writes the
`-o` bytes unless `ffmpeg-no-write` names the sound.

**Case map.**

| Case | Assertion                                                                                                                                                                                  | Falsification                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| 1    | Two entries give 14 files, two Ogg calls, two ffmpeg calls. The `alpha` ffmpeg argv equals the AC2 line with both paths substituted. Stdout is the four success lines plus the final line. | A reordered flag, a missing `-y`, a wrong bitrate, or a wrong line order fails. |
| 2    | `FFMPEG_BIN` names an absent path: exit 1, the exact line, zero ffmpeg calls.                                                                                                              | Any Ogg written, any child call, or a different line fails.                     |
| 3    | ffmpeg exits 3 for `beta`: exit 1, exact line, no `gamma` call.                                                                                                                            | A `gamma` line or a continued run fails.                                        |
| 4    | ffmpeg exits 0 and writes no file for `alpha`: exit 1, exact line, one Ogg call.                                                                                                           | A stale `.mp3` left in place that satisfies the check fails.                    |
| 5    | The six AC3 steps on each committed `sounds/chibi/<name>.mp3`, read with `readFileSync` and byte math.                                                                                     | The first failing step fails the case.                                          |

**Settlement the Red and Green must agree on.** The ffmpeg binary check runs once, before the
first entry. An absent ffmpeg therefore writes no Ogg and starts no render. This matches the
sibling wrapper, which checks its binary before the loop, and it fails closed. Case 2 asserts
zero earshot calls. If Green instead checks per entry, case 2 must assert one Ogg call and no MP3
call, and Review A must accept the partial set. Pick fail-fast.

**Anti-pattern coverage.**

| ID  | Defense                                                                                          | Falsification                                         |
| --- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| A3  | Integer counts from the two logs (`2`, `1`, `0`) and an exact 14-file count.                     | A count inferred from a filename digit fails.         |
| A4  | Case 1 requires two Log lines and 14 files. Case 4 removes a stale `.mp3` first.                 | Zero calls, or a stale target, cannot pass.           |
| A5  | `stderr.trim()` equality for all three AC2 lines. Exact argv array equality for the ffmpeg call. | A prefix match, or a "contains" assert, fails review. |
| A7  | Compare `argv` arrays, not a joined string with `includes`.                                      | Extra or missing flags pass no case.                  |
| A9  | Read `sounds/sets/chibi.json` and the committed files. Never read the archived sibling path.     | A test read of `measure/archive/**` fails review.     |
| A10 | The README table is documentation, not a generated fact. Still run `generate.mjs --check`.       | A registry or generated drift fails at closeout.      |

## Phase 3: File playback in the AudioBus

Risk: `high`. This is shared runtime. Every game constructs the bus.

**Red command (targeted).**

```
node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-files.test.ts
```

**Red done-when.** Exit 1. `useSoundFiles` and `preload` are absent from the class, so each case
fails on the call and not on a parse error. 10 tests are collected.

**Green gate.** The same command exits 0 with 10 of 10 tests passing. The architecture boundary
test also passes:

```
node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/imports.test.ts
```

`node node_modules/typescript/bin/tsc --noEmit` reports no error in `src/apk3d/audio/bus.ts` or
`src/apk3d/audio/index.ts`. The 38 baseline errors of TD-35 to TD-39 stay open; count them and
require 38.

**Closeout addition.** `installAudioUnlock`, `music`, `setMuted`, `suspend`, `resume`, and
`dispose` keep their signatures. `git diff` shows no change to `defineSfx`, `defineMood`,
`BUILT_IN_SFX`, or `BUILT_IN_MOODS`.

**Harness (no audio device).** Install before each test and restore after:

- `globalThis.window = { AudioContext: FakeCtx, webkitAudioContext: undefined, setInterval, clearInterval }`.
- `globalThis.navigator = { audioSession: { type: 'playback' } }`.
- `globalThis.Audio = class { canPlayType(type) { ... } }` with per-case answers.
- `globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) }))`.

`FakeCtx` records: `createOscillator` (type, `frequency` calls, `start`, `stop`),
`createGain` (connections), `createBufferSource` (`buffer`, `start`, `stop`), `createBuffer`,
`decodeAudioData` (count), `resume`, `suspend`, `close`, `currentTime`, `sampleRate`, `state`,
`destination`. A `FakeAudioBuffer` with `duration` and `getChannelData` satisfies decode.

The ten cases map to AC4 rules. Every negative case also asserts a positive counter, so a fake
that records nothing cannot pass:

| Case | Rule | Assertion                                                                                          | Falsification                                             |
| ---- | ---- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1    | 1    | Ogg answer `probably`: first `play` URL ends `.ogg`.                                               | An `.mp3` URL fails.                                      |
| 2    | 1    | Empty Ogg and mp3 `maybe`: URL ends `.mp3`.                                                        | Two `Audio` instances, or a second query, fails.          |
| 3    | 1, 6 | Two empty answers: zero fetches, `play` runs the recipe (oscillators > 0).                         | A fetch, or zero oscillators, fails.                      |
| 4    | 3, 4 | First mapped play: oscillators > 0 and exactly one fetch.                                          | A missing synth, or two fetches, fails.                   |
| 5    | 3    | After decode: one buffer source `start`, zero oscillators for that call.                           | A synth double-play, or a silent no-op, fails.            |
| 6    | 5    | Three plays give one fetch and one decode.                                                         | A retry per play fails.                                   |
| 7    | 5    | Rejected fetch, non-OK status, and rejected decode each mark: synth on later calls, fetch count 1. | A later fetch, or a silent event, fails.                  |
| 8    | 7    | `preload(['correct'])`: one fetch and one decode, zero sources started.                            | Any sound, or zero fetches, fails.                        |
| 9    | 6    | Unmapped event: synth runs, zero fetches. `useSoundFiles(null)` clears the map.                    | A fetch, or a synthesized mapped event after null, fails. |
| 10   | 8    | `dispose()` calls `stop` on each started source and `close` once.                                  | A missing `stop`, or a live context, fails.               |

`unlock()` is called once before each case. The format choice is asserted to happen once, in the
first `unlock()`, by counting `new Audio()` constructions across two `unlock()` calls.

**Anti-pattern coverage.**

| ID  | Defense                                                                                     | Falsification                                        |
| --- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| A3  | Counters are integers compared to exact values (one fetch, one decode, one source).         | A count parsed from a URL or a byte length fails.    |
| A4  | Each negative case asserts a positive counter: oscillators > 0, or `start` count 1.         | A no-op fake cannot pass case 3, 5, or 7.            |
| A5  | The URL is asserted by exact equality to `<base><entry>.<ext>`. No "ended with ogg" alone.  | A wrong base, entry, or extension fails.             |
| A7  | Match on exact string equality, not `includes('ogg')`.                                      | A URL that contains `ogg` in a query passes no case. |
| A9  | Import the source by its live path. Never import from `measure/archive/**`.                 | An archived import fails review.                     |
| A10 | The `index.ts` export is a public surface. Run `generate.mjs --check` and the imports test. | A boundary or generated-fact break fails the gate.   |

**Changed-contract risks.**

- `play()` becomes asynchronous after the first call. A game that plays on every tap must not
  double-play. Case 5 holds that line.
- `dispose()` gains buffer stopping. Existing callers still expect the interval clear and
  `close()`. Case 10 covers both.
- `useSoundFiles` accepts a caller-supplied `base`. A security review must check that the URL is
  built only from `base`, the mapped entry, and the chosen extension. No user input reaches it.
- `src/apk3d/audio` may import only `apk3d/contracts`, `apk3d/sim`, and `three`
  (`tests/apk3d/imports.test.ts`). A `SoundFiles` type export adds no import and keeps the rule.

**Product wiring gap (nonblocking).** No phase calls `useSoundFiles` or `preload` from a game or
the demo. The API is inert until a caller sets the map. Unit proof and browser proof cannot
observe a real file request in a game page without that call. Record the gap. Phase 4 must create
the call inside its own harness, as stated there.

Closed by T6a and T6b: each of the 29 2D hosts now calls `wireChibiSounds` once, and the helper
sets the map and preloads the game's own events (spec AC9).

## Phase 4: Preload budget

Risk: `high`. The gate uses a headless browser, network emulation, and a 1.5 s limit. A zero-row
measurement can look like a number. A noisy second run can cross the limit.

**Red command (targeted, exact).**

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'rm -f out/audio-budget/rune-match.json && node node_modules/vitest/vitest.mjs run tests/audio-budget.test.ts --maxWorkers=1'
```

The `rm -f` removes only an untracked generated artifact. It makes the Red result independent of
an earlier measurement. Exit 75 from the runner means wait and retry; it is not a test result.

**Red done-when.** Exit 1 with 4 tests collected and exactly 1 failed. Cases 1 to 3 pass, because
`sounds/README.md` already holds both format tables and the 14 byte values match `statSync`. Case 4
fails with `ENOENT: no such file or directory, open 'out/audio-budget/rune-match.json'`. No syntax
or import error occurs. `node_modules/.bin/prettier --check tests/audio-budget.test.ts` exits 0.
A Red run with 4 passing tests is a broken Red and fails review.

**Green command (exact, one heavy call).**

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/audio-budget.mjs --game rune-match && node node_modules/vitest/vitest.mjs run tests/audio-budget.test.ts --maxWorkers=1'
```

The measurement runs first. It writes the JSON. The test then reads that JSON. Both halves use one
runner call. The plan's standalone measurement command is
`HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/audio-budget.mjs --game rune-match'`.

**Green gate.** The command exits 0. The test reports 4 of 4 passing. The measurement exits 0 and
writes `out/audio-budget/rune-match.json` with exactly three numeric fields: `bytes`, `files`, and
`seconds`. `files` is 6: the six mapped entries in the Rune Match wire list (`tap`, `correct` to
`right`, `wrong`, `victory` to `level-end`, `whoosh`, `spawn` to `pop`). `bytes` is a labeled
integer, greater than 0 and at most 100,000. It equals 79,319 for Ogg or 62,496 for MP3, the sums
of the six matching README rows. `seconds` is a labeled number, greater than 0 and at most 1.5.
The plan records the observed `bytes`, `files`, and `seconds` without rounding that hides a breach.
`out/` stays untracked.

**Test file contract (four cases).**

| Case | Assertion                                                                                                                                                                                            | Falsification                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1    | Parse `sounds/README.md` into the Ogg table and the MP3 table. Each table holds 7 rows. The 14 names equal the seven `sounds/sets/chibi.json` names with each extension.                             | A missing row, a swapped table, or a wrong name fails with the name printed.                      |
| 2    | For all 14 files, the byte column equals `statSync('sounds/chibi/<name>').size`. Print name, README integer, and stat integer on a mismatch.                                                         | A one-byte drift in any file or in the README fails with both labeled integers.                   |
| 3    | Sum each format's seven byte integers. Both sums are greater than 0 and at most 100,000. Today they are 90,468 and 71,136.                                                                           | A total parsed from a duration column, or a total above the limit, fails.                         |
| 4    | Read `out/audio-budget/rune-match.json`. `bytes`, `files`, and `seconds` are labeled numbers. `files` is 6. `bytes` equals one of the six-file README sums. `bytes` <= 100,000 and `seconds` <= 1.5. | The absent JSON fails at Red. A zero count, an unmapped byte total, or a slow run fails at Green. |

Parse each byte column with a row-anchored pattern on the `Bytes` column. Never take a digit from a
file name, a duration, or a date. Parse the JSON fields by key and validate the numeric type before
any comparison. Do not use `includes` on a README line.

**Measurement script contract.** `scripts/audio-budget.mjs --game rune-match` does the following,
in order. No step is optional.

1. Spawn the dev server as a child: `node node_modules/vite/bin/vite.js --port 5199 --strictPort
--host 127.0.0.1`, with the repo root as cwd. `--strictPort` fails the run if another session
   holds port 5199. Do not kill a server this script did not start.
2. Poll `http://127.0.0.1:5199/demo/index.html` until it answers, with a 60 s cap. Fail on a
   timeout.
3. Launch Playwright Chromium headless with `--autoplay-policy=no-user-gesture-required` and
   `--mute-audio`. Open CDP with `Network.enable`, then apply `Network.emulateNetworkConditions`
   with `offline: false`, `latency: 300`, and `downloadThroughput: Math.round(1.6 * 1024 * 1024 /
8)` bytes per second (209,715). Set `uploadThroughput: -1` so uploads stay unthrottled. Apply
   the profile before navigation.
4. Navigate to `http://127.0.0.1:5199/demo/index.html?renderer=phaser`. Follow the Phase 3 probe
   exactly: wait for `window.__apk3dReady`, click `[data-game="rune-match"]:not(.soon)`, click
   `[data-read]`, click `[data-next]`, click `[data-start]`, wait for the Phaser canvas, click the
   canvas center as the unlock gesture, and press Space to reach the first effect.
5. Read `performance.getEntriesByType('resource')` in the page. Keep rows whose URL path starts
   `/demo/audio/chibi/` and ends `.ogg` or `.mp3`, with the file name in the seven set entries.
   Poll every 200 ms until the row count is unchanged for 5 polls, with a 60 s cap. Read the rows
   once at the end. Never stub `fetch`, patch the bus, or set a map from the script.
6. Gate before writing JSON: at least 1 audio row, every row's `encodedBodySize` above 0, every
   URL an allowed set file, `bytes` at most 100,000, and `seconds` at most 1.5. Also require
   `bytes` to equal the sum of `statSync` sizes of the same files under
   `demo/public/audio/chibi/`. On any failed gate, print the row details, write no JSON, and exit
   non-zero.
7. Write `out/audio-budget/rune-match.json` with only `bytes`, `files`, and `seconds`. Then stop
   the Chromium browser and kill the vite child with SIGTERM in a `finally` block. Escalate to
   SIGKILL after 5 s. Print the JSON to stdout.

**Transfer-byte settlement (Green has no choice).** The Vite dev server sends these files without
content encoding. Use `encodedBodySize` from each resource-timing row as the transfer byte count.
With no compression, `encodedBodySize` equals `decodedBodySize` and the on-disk `statSync` size.
Do not use `transferSize`: Chromium adds response-header bytes to it, so it does not measure the
audio payload. Do not infer bytes from the README; use the README only as the independent
cross-check in step 6. A row with `encodedBodySize` 0 fails the run.

**Seconds settlement (Green has no choice).** Set `seconds` to `(max(responseEnd) -
min(startTime)) / 1000` over the kept audio rows. This is the load window of the preload burst.
Decode begins after each response ends; the script reaches the first effect before reading rows, so
a failed decode produces no play and fails the run through the page and console checks. Record the
limitation: resource timing does not expose a separate decode duration. Do not add navigation time
or the click-to-canvas delay to `seconds`.

**Fixtures, mocks, and live-behavior proof.** The artifact layer is `sounds/README.md`, the 14
committed files, and the generated JSON. It proves record and file integrity, not a fetch. The
browser layer is the real dev server, real headless Chromium, real file requests under the CDP
profile, and real resource timing. There is no mock in the browser layer. Playwright clicks are
real input events. Muted headless playback proves requests and timing; it proves no audible
quality on a device. A human listen stays an owner check.

**Closeout addition.** Re-run the Green command once. Report both runs in the plan and keep both
numbers. A second run that breaches a threshold fails the phase. Do not commit `out/`. Do not
change `sounds/README.md` or the 14 files in this task. Run `node measure/tools/generate.mjs
--check` and `./measure/doctor.sh --structural-only`. The full suite stays intentionally red on
TD-40; never edit `tests/storytime-book-pictures.test.ts` to make it pass.

**Changed-contract risks.** This task adds one dev script and one test file. It changes no
production source, no game host, and no audio file. It adds no dependency: Playwright and Vite are
already installed and the Phase 3 probe used both. It must not change the page flow that T6b
wired or add a second preload path. The script writes only `out/audio-budget/`. The plan records
the measured numbers; a claim in the plan must match the JSON byte for byte.

**Anti-pattern coverage.**

| ID  | Defense                                                                                                                                                                     | Falsification                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| A3  | Parse `files`, `bytes`, and `seconds` as labeled numbers by key. Assert `files` is 6 and `bytes` is one of the two six-file README sums.                                    | A digit from a file name, a date, or a duration cannot satisfy the keyed assertions. |
| A4  | The script exits non-zero on zero audio rows or zero `encodedBodySize`. The test fails at Red on an absent JSON.                                                            | A "measured" JSON of zeros, or a green Red, fails the gate.                          |
| A5  | The plan records the JSON values. Review runs the Green command and compares the printed JSON to the plan.                                                                  | A plan number that differs from the JSON fails review.                               |
| A6  | Do not write "budget verified" or "monorepo path confirmed" in any record. The JSON and the Phase 5 PM answer decide those claims.                                          | A budget claim with a red adversarial gate fails acceptance.                         |
| A7  | Match resource rows by exact path prefix and exact extension. Parse README byte cells with a row-anchored pattern. No bare `\d+` over a whole line.                         | A duration cell or a foreign URL cannot enter the byte sum.                          |
| A9  | Read only live paths: `sounds/README.md`, `sounds/chibi/`, `demo/public/audio/chibi/`, and `measure/tracks/audio_game_integration_20261014/`. No `measure/archive/**` path. | A test or script path into an archived track fails review.                           |
| A10 | Run `generate.mjs --check` after the docs edit. Keep `out/` untracked.                                                                                                      | Stale generated facts, or a committed `out/` file, fail closeout.                    |
| A11 | Record the real status of each Phase 4 review. Do not leave executed review tasks as `[b] deferred:review-execution` once the artifacts exist.                              | A review artifact with every task still blocked fails acceptance.                    |
| A2  | Not applicable: this phase has no publish gate and no personal data.                                                                                                        | A publish claim would be out of scope and fails review.                              |

## Phase 5: Hand-off to the PM

Risk: `medium`. Delivery artifact. No runtime behavior.

**Red command (targeted).** Run from the repo root. Red fails because the folder is absent.

```
d=out/apk-audio-handoff/chibi; test -d "$d" \
  && test "$(ls "$d"/*.ogg "$d"/*.mp3 2>/dev/null | wc -l)" -eq 14 \
  && test "$(wc -l < "$d/MANIFEST.tsv")" -eq 15 \
  && test "$(cut -f6 "$d/MANIFEST.tsv" | tail -n +2 | grep -c '^proposed: apps/advantage-games/public/audio/chibi/')" -eq 14 \
  && test -s "$d/README.md" \
  && (cd "$d" && sha256sum -c MANIFEST.sha256) \
  && test -z "$(git -C ../reading-advantage-monorepo status --short)"
```

**Red done-when.** Exit non-zero. The first failing clause names the absent folder.

**Green gate.** The command exits 0, and `demo/public/audio/chibi/` holds the same 14 files. One
row is added to `docs/apk-port.md` with the model-pack pattern. The hand-off `README.md` names
the proposed target, the AC4 load rule, and `docs/apk-port.md` line 238.

**The MANIFEST.sha256 settlement (spec-review r2 F6).** No phase creates `MANIFEST.sha256`, yet the
plan done-when checks it. Green must create it in `sha256sum` format: one line per file, 64
lowercase hex characters, two spaces, then the file name. Derive the hashes from the committed
bytes, and make the text manifest's `sha256` column agree. The folder then holds 17 files: 14
sound files, `MANIFEST.tsv`, `MANIFEST.sha256`, and `README.md`. Record that one-file addition in
the plan, and let Review A confirm it. The checksum file makes the done-when executable as
written. A checksum file with 14 rows but one wrong byte fails the gate.

**Closeout addition.** `git status --short ../reading-advantage-monorepo` stays empty. No file is
written outside this repository. The PM answer lands in the plan with a date before any claim
that the path is confirmed.

**Fixtures.** Filesystem only. `sha256sum -c` is the reader. `MANIFEST.tsv` has the six columns
`file`, `bytes`, `sha256`, `format`, `source`, and `target`. `bytes` equals `statSync` for each
file. No audio device, no network.

**Anti-pattern coverage.**

| ID  | Defense                                                                             | Falsification                                                |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A3  | Row count 14, file count 14, and per-row `bytes` from `statSync`.                   | A count from a directory listing name fails.                 |
| A4  | An empty folder, a README-only folder, or a manifest without files fails.           | A pass on an empty hand-off fails.                           |
| A5  | The done-when is the executed command and its exit code, not "files exist".         | A pass claim before the checksum runs fails review.          |
| A6  | Never write "monorepo path confirmed" before the PM answer. Record "proposed" only. | A confirmed-path claim with no PM note fails acceptance.     |
| A7  | Exact 64-hex plus two-space format. `grep -c` is anchored to the proposed prefix.   | A substring match on a name, or an unanchored prefix, fails. |
| A9  | The README cites `docs/apk-port.md` line 238, a live path. No archived path.        | An archived citation fails review.                           |
| A10 | A new `docs/apk-port.md` row is documentation. Run `generate.mjs --check`.          | Generated-fact drift fails closeout.                         |

## Phase 6: Deferred work (credits)

Risk: `low`. No Red command and no Green gate. The task stays `[ ]` with the word deferred in its
prose, and `audio/CREDITS.md` keeps its bytes. This phase runs no test.

**Anti-pattern coverage.** A1/A8: do not rely on the word "deferred" as a structured signal. Keep
the `[ ]` marker; the supervisor reads markers, not prose. A6: do not mark the task `[x]`; do not
claim the credits screen exists. A2: not applicable (no publish gate). Falsification: a `[x]`
marker, an edited `CREDITS.md`, or a "done" registry note fails acceptance.

## Gates and closeout

After the last phase, run and record each exit code:

1. `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/audio-event-map.test.ts tests/sound-set.test.ts tests/sound-set-mp3.test.ts tests/apk3d/audio-files.test.ts tests/audio-budget.test.ts`
2. `node measure/tools/generate.mjs --check`
3. `./measure/doctor.sh --structural-only`
4. `node_modules/.bin/prettier --check` on each touched text file with a parser: the five test
   files, `scripts/sound-set.mjs`, `scripts/audio-budget.mjs`, `src/apk3d/audio/bus.ts`,
   `src/apk3d/audio/index.ts`, `sounds/README.md`, `docs/apk-port.md`, and the track files.
   Exclude `docs/sound-event-map.tsv`, `MANIFEST.tsv`, and `MANIFEST.sha256`; prettier has no
   parser for them.
5. The Phase 5 command.
6. `git status --short` shows only assigned paths.

Run the five-file test command through the heavy runner when the machine is busy. Run the Phase 5
command directly; it is light.

## Intentionally-red aggregate suite

The full suite is intentionally red. `tests/storytime-book-pictures.test.ts` fails on 9 tests
(TD-40), so `PROJECT_TESTS` excludes it. At each Red, the new files also fail. Gate only on the
targeted files above. Report aggregate failures as baseline debt. Never edit unrelated tests to
make the aggregate suite green in this track. The sibling archive reported 211 files and 3,233
tests with exit 0 on 2026-11-21; use that as the baseline shape, not as a current result.

## Review gate applicability

| Phase | Review A correctness                                     | Review B security                                                             | Review C UX/API                                                  | Adversarial                                                                   | UX browser review                                                                              |
| ----- | -------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1     | Applicable                                               | Not applicable: data file, no I/O                                             | Not applicable: internal data map                                | Applicable                                                                    | Not applicable: no UI                                                                          |
| 2     | Applicable                                               | Applicable, reduced: argv, no shell                                           | Not applicable: CLI covered by A                                 | Applicable                                                                    | Not applicable: no UI                                                                          |
| 3     | Applicable                                               | Applicable: URL build, fetch scope                                            | Applicable: public API and audible fallback                      | Applicable                                                                    | Applicable: game runtime and audible output                                                    |
| 4     | Applicable: four cases, script gates, JSON-to-plan match | Applicable, reduced: local server, fixed base, seven-name allowlist, no shell | Not applicable: no API change; the page flow is the existing one | Applicable: zero rows, zero bytes, stale JSON, wrong URL, second-run variance | Applicable, limited: the script is the browser measurement; review its JSON, not sound quality |
| 5     | Applicable                                               | Applicable, reduced: paths, no writes in monorepo                             | Not applicable: delivery artifact                                | Applicable                                                                    | Not applicable: no UI                                                                          |
| 6     | Not applicable                                           | Not applicable                                                                | Not applicable                                                   | Not applicable                                                                | Not applicable                                                                                 |

Why Phase 3 and Phase 4 get browser review. Phase 3 changes code every game runs. The browser
check must load the game page, click once, and assert one audio request with no console error. Phase
4 is a browser measurement. Its script starts its own Vite server on port 5199 and stops it before
exit. Review the recording: the JSON values, the audio rows, and the gate output. Do not change the
page flow or add a second preload path to make the measurement pass. Neither review proves audible
quality on a real device. State that limit. A human listen is an owner check, not a gate for this
track.

## Architecture guardrails

- Keep one rules core. This track changes no `src/apk3d/sim/**` file and no game rule; in
  `src/games/**` it adds only the one `wireChibiSounds` call per 2D host that T6b and AC9 name.
- `tests/apk3d/imports.test.ts` is the architecture guard. `src/apk3d/audio` may import only
  `apk3d/contracts`, `apk3d/sim`, and `three`. Run it after the barrel change.
- Do not add a dependency, a build step, or an audio library. `readFileSync` and byte math only.
- Keep `sounds/sets/chibi.json` untouched. The seven names are the set contract.
- Keep the `AudioBus` public methods. Add only `useSoundFiles` and `preload`, and the
  `SoundFiles` export.
- Do not write in the monorepo. `git status` there must stay empty.
- Do not commit `out/`, `.venv-earshot/`, or `bench/`.

## Anti-pattern index for this track

A2 (consent-blind publish) is not applicable: this track has no publish gate and no personal
data. A11 (executed review track left fully blocked) applies at every phase closeout: every
review artifact must state its real status, and a pass must not be recorded as blocked. A1 and A8
apply to the deferred marker in Phase 6. All other entries appear in the phase tables above with a
falsification condition. The local `measure/anti-patterns.md` is absent. The canonical entries were
read from `../advantage-pr/measure/anti-patterns.md` (A1 to A10) and
`../reading-advantage-monorepo/measure/anti-patterns.md` (A11). Record the local absence as a
documentation gap; it does not weaken the per-phase defenses.
