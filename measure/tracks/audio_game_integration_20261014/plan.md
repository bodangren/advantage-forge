# Sound in the games: library takes for the game events

Status: new. The plan records execution state. `docs/sound-library.md` retains the library design.

Decisions (a) to (d) and the acceptance criteria: `spec.md`, amendment 2026-11-22. The earshot set
`sounds/chibi/*.ogg` is the first source. The synthesized recipes stay the fallback.

Lane: light. Phases 1 to 6. Source: PM decisions of 2026-11-22. Deadline: none named.

Files this track touches:

- `docs/sound-event-map.tsv` (new)
- `tests/audio-event-map.test.ts` (new)
- `scripts/sound-set.mjs` (the MP3 step)
- `tests/sound-set-mp3.test.ts` (new)
- `tests/sound-set.test.ts` (the stdout line list)
- `sounds/chibi/<name>.mp3` for the seven names (new, committed)
- `sounds/README.md` (the MP3 line, the sizes, and the ffmpeg version)
- `tests/apk3d/audio-files.test.ts` (new)
- `src/apk3d/audio/bus.ts` (file playback)
- `src/apk3d/audio/index.ts` (the `SoundFiles` export)
- `scripts/audio-budget.mjs` (new)
- `tests/audio-budget.test.ts` (new)
- `demo/public/audio/chibi/` (the 14 files)
- `docs/apk-port.md` (one row for the sound files)
- `out/apk-audio-handoff/chibi/` (not in git)
- `measure/tracks/audio_game_integration_20261014/*`

## Phase 1: Event map

- [ ] T1 Red: Add `tests/audio-event-map.test.ts`. It reads `docs/sound-event-map.tsv` with
      `readFileSync` and splits each line on the tab. The eight cases:

  1. The file exists, and line 1 is exactly `event\tsource\tnote`.
  2. Each line holds three fields. Each `event` value is unique. Each `source` value is one of the
     seven `chibi/<name>` values or `synth`.
  3. The rows are exactly the 58 names of spec AC1, in both directions.
  4. Each of the 31 mapped rows holds the `source` of the spec AC1 table.
  5. Each of the 27 `synth` rows holds `synth`.
  6. Each of the seven set entries appears at least once as a `source` value.
  7. The seven set entry names equal the `name` values of `sounds/sets/chibi.json`.
  8. The name set of the map equals the name set of `src/`, read with three patterns:
     `audio.play('<name>'`, `audio.defineSfx('<name>'`, and `.sfx('<name>'`. A name in one set and
     not the other fails the test with the name in the message.
  - Red evidence: `node node_modules/vitest/vitest.mjs run tests/audio-event-map.test.ts --maxWorkers=1`
  - Red done-when: the command exits 1. The failure is the absent map file (ENOENT). The test file
    holds no syntax or import error. `node_modules/.bin/prettier --check tests/audio-event-map.test.ts`
    exits 0.

- [ ] T2 Green: Write `docs/sound-event-map.tsv` with the AC1 table. Use one line for each event.
      The `note` column names the event's meaning in three words or less. Name the seven
      `chibi/<entry>` values in the file header comment, with the set entry design from
      `sounds/README.md`.
  - Green done-when: the T1 command exits 0 with 8 of 8 tests passing.
  - Record: the plan notes the 31 mapped names and the 27 `synth` names, and the count of `.ogg`
    bytes that a game with every mapped event would load.

## Phase 2: MP3 copies in the wrapper

- [ ] T3 Red: Add `tests/sound-set-mp3.test.ts`, and change the stdout assertion of case 1 in
      `tests/sound-set.test.ts` to the new line order. The test uses `spawnSync` with
      `SOUNDS_ROOT=<temp root>`, a fake earshot binary, and a fake ffmpeg binary. Each fake appends
      `process.argv.slice(2).join(' ')` to its own log, as `tests/sound-set.test.ts` does. The five
      cases:

  1. Full render of two entries: 14 files, the Ogg log holds two calls, and the ffmpeg log holds
     two calls. The `alpha` call is exactly the AC2 argument line, with the two substituted paths.
     Stdout holds `sound-set: alpha.ogg <- tap/soft`, then `sound-set: alpha.mp3 <- tap/soft`, then
     the `beta` pair, then `sound-set: 2 sounds -> sounds/fake`.
  2. `FFMPEG_BIN` names an absent path: exit 1, the exact AC2 line, and no ffmpeg call.
  3. ffmpeg exits 3 for `beta`: exit 1, the exact AC2 line, and no `gamma` call.
  4. ffmpeg exits 0 and writes no file for `alpha`: exit 1, the exact AC2 line, and one Ogg call.
  5. The six AC3 steps on each committed `sounds/chibi/<name>.mp3`.
  - Red evidence: `node node_modules/vitest/vitest.mjs run tests/sound-set.test.ts tests/sound-set-mp3.test.ts --maxWorkers=1`
  - Red done-when: the command exits 1. Case 1 fails on the absent MP3 line and on the absent ffmpeg
    call. Case 5 fails with ENOENT. The test files raise no syntax or import error.

- [ ] T4 Green: Add the MP3 step to `scripts/sound-set.mjs` per spec AC2. Add the `FFMPEG_BIN`
      lookup, the target preparation for the `.mp3`, and the three failure lines with their exits.
      Then render the real set once, and stage the seven `.mp3` files with explicit paths.
  - Green done-when: the T3 command exits 0 with every test passing. The render command exits 0 and
    writes 14 files. `sounds/README.md` holds the byte size and the duration of each file, in both
    formats, and the ffmpeg version of the render host.
  - Render command: `bash scripts/sound-setup.sh && node scripts/sound-set.mjs chibi`. Record the
    ffmpeg version line. A first render can take about 69 s for the numba compile.
  - The earshot and ffmpeg versions go in `sounds/README.md`, next to the design line.

## Phase 3: File playback in the AudioBus

- [ ] T5 Red: Add `tests/apk3d/audio-files.test.ts`. The test installs a fake `window.AudioContext`
      and a fake `fetch`, so it needs no audio device. The fake context records each oscillator, each
      gain, each buffer source, and each `decodeAudioData` call. The ten cases:

  1. The ogg answer `probably` gives a URL that ends `.ogg`.
  2. The empty ogg answer and the mp3 answer `maybe` give a URL that ends `.mp3`.
  3. Two empty answers start no fetch, and `play` runs the synth recipe.
  4. The first `play` of a mapped event runs the synth recipe and starts one fetch.
  5. The second `play` after the decode starts one buffer source and runs no synth recipe.
  6. Three calls start one fetch.
  7. A rejected fetch, a non-OK status, and a rejected decode each mark the event. Later calls run
     the synth recipe, and the fetch count stays 1.
  8. `preload(['correct'])` starts the fetch and plays no sound.
  9. An event without a mapping runs the synth recipe and starts no fetch.
  10. `dispose()` stops each playing buffer and closes the context.
  - Red evidence: `node node_modules/vitest/vitest.mjs run tests/apk3d/audio-files.test.ts --maxWorkers=1`
  - Red done-when: the command exits 1. `useSoundFiles` and `preload` are absent from the class, so
    the cases fail on the call and not on a parse error.

- [ ] T6 Green: Add the file playback to `src/apk3d/audio/bus.ts` per spec AC4. Keep `defineSfx`,
      `defineMood`, `unlock`, `setMuted`, `suspend`, `resume`, `music`, and `dispose` in their
      current shape. Export `SoundFiles` from `src/apk3d/audio/index.ts`.
  - Green done-when: the T5 command exits 0 with 10 of 10 tests passing.
  - Type check: `node node_modules/typescript/bin/tsc --noEmit` reports no error in
    `src/apk3d/audio/bus.ts` or `src/apk3d/audio/index.ts`. The 38 baseline errors of TD-35 to TD-39
    stay open.

## Phase 4: Preload budget

- [ ] T7 Measure: Add `scripts/audio-budget.mjs`. It serves the demo with vite, opens one game in
      headless Chromium with Playwright, and sets the slow-3G profile through CDP
      `Network.emulateNetworkConditions` (1.6 Mbit/s down, 300 ms latency). It plays to the first
      effect, reads the audio rows of `performance.getEntriesByType('resource')`, and writes
      `out/audio-budget/<game>.json`. Add `tests/audio-budget.test.ts`: the byte column of
      `sounds/README.md` equals `statSync` for all 14 files, and each format total is at most
      100,000 bytes.
  - Command: `node scripts/audio-budget.mjs --game rune-match`.
  - Done-when: the JSON holds `bytes`, `files`, and `seconds` for Rune Match. `bytes` is at most
    100,000. `seconds` is at most 1.5. The plan records both numbers and the file count. The test
    command exits 0.
  - The test file runs under `node node_modules/vitest/vitest.mjs run tests/audio-budget.test.ts --maxWorkers=1`.

## Phase 5: Hand-off to the PM

- [ ] T8 Hand-off: Copy the 14 files to `demo/public/audio/chibi/`. Add one row to
      `docs/apk-port.md` with the pattern of the model pack row: `demo/public/audio/chibi/` to
      `apps/advantage-games/public/audio/chibi/`. Build `out/apk-audio-handoff/chibi/` with the 14
      files, `MANIFEST.tsv`, and `README.md` per spec AC6. Give the folder path to the PM.
  - Done-when: `sha256sum -c out/apk-audio-handoff/chibi/MANIFEST.sha256` exits 0. The folder holds
    14 sound files. `git status --short ../reading-advantage-monorepo` stays empty. The PM answer
    lands in this plan with its date.
  - The MANIFEST rows hold the target path `apps/advantage-games/public/audio/chibi/<file>`.

## Phase 6: Deferred work

- [ ] T9 (deferred) Credits: Show the lines of `audio/CREDITS.md` on one screen of the game package.
      This task starts when a library take enters a set. The earshot set needs no credits screen
      (PM decision 2026-11-22c).
  - Done-when, when it starts: each credit line of `audio/CREDITS.md` appears on the screen, and the
    PM records the place in this plan. This track does not start the task.

## Gates

Run these commands after the last phase, and record each exit code in this plan:

- `node node_modules/vitest/vitest.mjs run tests/audio-event-map.test.ts tests/sound-set.test.ts tests/sound-set-mp3.test.ts tests/apk3d/audio-files.test.ts tests/audio-budget.test.ts --maxWorkers=1`
- `node measure/tools/generate.mjs --check`
- `./measure/doctor.sh --structural-only`
- `node_modules/.bin/prettier --check` on each touched text file

Known limits stay known: `tsc --noEmit` keeps the 38 baseline errors of TD-35 to TD-39.
