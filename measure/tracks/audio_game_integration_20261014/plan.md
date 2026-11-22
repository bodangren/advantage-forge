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
- `src/apk3d/audio/index.ts` (the `SoundFiles` export, and the wiring exports)
- `scripts/audio-event-map.mjs` (new, the generated map module)
- `src/apk3d/audio/chibi-events.gen.ts` (new, generated from `docs/sound-event-map.tsv`)
- `src/apk3d/audio/chibi.ts` (new, the wiring helper)
- `tests/apk3d/audio-wiring.test.ts` (new)
- `src/apk3d/factory/types.ts` (the `soundBase` launch field, the site base)
- `src/host/main.ts` (the `soundBase` value, `${BASE}`)
- `src/games/*/view2d/game.ts` (29 hosts, the wiring call)
- `scripts/audio-budget.mjs` (new)
- `tests/audio-budget.test.ts` (new)
- `demo/public/audio/chibi/` (the 14 files, copied in T6b)
- `docs/apk-port.md` (one row for the sound files)
- `out/apk-audio-handoff/chibi/` (not in git)
- `measure/tracks/audio_game_integration_20261014/*`

## Phase 1: Event map

- [ ] T1 Red: Add `tests/audio-event-map.test.ts`. It reads `docs/sound-event-map.tsv` with
      `readFileSync` and splits each line on the tab. The eight cases:

  1. The file exists. Line 1 is exactly `event\tsource\tnote`, and the file holds 58 data rows and
     no other line.
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

- [ ] T2 Green: Write `docs/sound-event-map.tsv` as AC1 states: one header line
      `event<TAB>source<TAB>note`, then exactly one row for each of the 58 events, and nothing else.
      Write no comment line, no blank line, and no closing text. The `note` field names the event's
      meaning in three words or less. The seven `chibi/<entry>` values come from
      `sounds/sets/chibi.json`. The map's meaning lives in spec AC1, and the file holds data only.
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
  - Render command: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'bash scripts/sound-setup.sh && node scripts/sound-set.mjs chibi'`.
    Every render in this task uses this wrapper, as the sibling track pins it
    (`measure/archive/chore_earshot_sounds_20261121/spec.md`, D8). Record the ffmpeg version line.
    A first render can take about 69 s for the numba compile.
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

- [ ] T6a Red: Add `tests/apk3d/audio-wiring.test.ts`. It proves that a 2D game host sets the sound
      map and preloads at start. The five cases:

  1. `src/apk3d/audio/chibi-events.gen.ts` holds 31 entries. The keys equal the 31 mapped events of
     `docs/sound-event-map.tsv`, in both directions. Each value is a `sounds/sets/chibi.json` name,
     and each value equals the map `source` field with the `chibi/` prefix removed.
  2. Each of the 29 `src/games/*/view2d/game.ts` hosts holds one `wireChibiSounds(` call. The host
     count is 29. A host with zero calls or with two calls fails with its path.
  3. `wireChibiSounds(bus, '/demo/', ['tap', 'tap', 'hit', 'victory'])` calls `useSoundFiles` once
     with `{ base: '/demo/audio/chibi/', events: <the 31 entries> }`. The `soundBase` argument is
     the site base, and the helper appends `audio/chibi/`; the file URL is
     `'/demo/audio/chibi/tap.ogg'`. It calls `preload` once with `['tap', 'victory']`: `tap`
     appears once, and `hit` is synth only.
  4. `wireChibiSounds(bus, undefined, ['tap'])` calls neither method and returns false. A host with
     no sound base keeps the synth recipe for every event.
  5. On a real `AudioBus` with a fake `fetch`, one `wireChibiSounds(audio, '/x/', ['tap'])` starts
     one fetch. The URL ends `/x/audio/chibi/tap.ogg`, because the helper appends `audio/chibi/` to
     the site base once. A later `play('hit')` starts no fetch.
  - The bus calls sit in one helper, not in 29 copies. `src/apk3d/audio/chibi.ts` holds
    `wireChibiSounds(audio, soundBase, gameEvents)`, `chibiSoundFiles(soundBase)`, and
    `chibiPreload(events)`. Case 2 counts the helper call in each host. Case 3 counts the bus calls
    in the helper. Each host passes the events it plays: its `SFX` values, or the literal names of
    its `audio.play` calls.
  - Cases 3 to 5 load the helper with `await import('../../src/apk3d/audio/chibi.js')` inside the
    case. A missing module then fails the case and does not stop collection. Cases 1 and 2 read
    files and import nothing new.
  - Red evidence: `node node_modules/vitest/vitest.mjs run tests/apk3d/audio-wiring.test.ts --maxWorkers=1`
  - Red done-when: the command exits 1. Case 1 fails with `ENOENT` for the generated map. Case 2
    fails with 0 of 29 hosts. Cases 3 to 5 fail on the absent helper module. The test file holds no
    syntax error.

- [ ] T6b Green: Add `scripts/audio-event-map.mjs`. It reads `docs/sound-event-map.tsv` and writes
      `src/apk3d/audio/chibi-events.gen.ts`: a header line that names the generator and the source
      file, then `CHIBI_EVENTS` with the 31 mapped events. Add `src/apk3d/audio/chibi.ts` with
      `chibiSoundFiles`, `chibiPreload`, and `wireChibiSounds`, and export the three from
      `src/apk3d/audio/index.ts`. Add `soundBase?: string` to the launch context in
      `src/apk3d/factory/types.ts`, with a doc comment that names it the site base with a trailing
      slash (`${BASE}`) and says the helper appends `audio/chibi/`. Set it in `src/host/main.ts` to
      `${BASE}`, not `${BASE}audio/chibi/`: the helper appends the folder, so the page fetches
      `${BASE}audio/chibi/tap.ogg`. Call `wireChibiSounds(audio, ctx.soundBase, <the game's events>)`
      once in each of the 29 `src/games/*/view2d/game.ts` hosts. Copy the 14 files of
      `sounds/chibi/` to `demo/public/audio/chibi/` in this task, because the preload needs the
      files.
  - Green done-when: the T6a command exits 0 with 5 of 5 tests passing.
  - `node scripts/audio-event-map.mjs --check` exits 0 on the committed generated file, and writes
    no file. A changed TSV row makes it exit 1 and name the event.
  - `node node_modules/vitest/vitest.mjs run tests/apk3d/imports.test.ts --maxWorkers=1` exits 0.
  - `node node_modules/typescript/bin/tsc --noEmit` reports no error in `src/apk3d/audio/`,
    `src/apk3d/factory/types.ts`, `src/host/main.ts`, or the 29 hosts. The 38 baseline errors of
    TD-35 to TD-39 stay open.
  - The 29 hosts pass their event list. No host calls `useSoundFiles` or `preload` directly: the
    helper does. A host with no `SFX` map passes the literal names of its `audio.play` calls.

## Phase 4: Preload budget

- [ ] T7 Measure: Add `scripts/audio-budget.mjs`. It serves the demo with vite, opens one game in
      headless Chromium with Playwright, and sets the slow-3G profile through CDP
      `Network.emulateNetworkConditions` (1.6 Mbit/s down, 300 ms latency). It plays to the first
      effect, reads the audio rows of `performance.getEntriesByType('resource')`, and writes
      `out/audio-budget/<game>.json`. Add `tests/audio-budget.test.ts`: the byte column of
      `sounds/README.md` equals `statSync` for all 14 files, and each format total is at most
      100,000 bytes.
  - Command: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/audio-budget.mjs --game rune-match'`.
    The browser run uses the same wrapper as T4 (sibling track D8).
  - Done-when: the JSON holds `bytes`, `files`, and `seconds` for Rune Match. `bytes` is at most
    100,000. `seconds` is at most 1.5. The plan records both numbers and the file count. The test
    command exits 0.
  - The test file runs under `node node_modules/vitest/vitest.mjs run tests/audio-budget.test.ts --maxWorkers=1`.

## Phase 5: Hand-off to the PM

- [ ] T8 Hand-off: Check the 14 files in `demo/public/audio/chibi/` byte for byte against
      `sounds/chibi/`; T6b made the copy, so this task verifies it and does not write it again. Add
      one row to `docs/apk-port.md` with the pattern of the model pack row (`docs/apk-port.md`, line
      238: `apps/advantage-games/public/packs/`): `demo/public/audio/chibi/` to
      `apps/advantage-games/public/audio/chibi/`. Build `out/apk-audio-handoff/chibi/` with the 14
      files, `MANIFEST.tsv`, `MANIFEST.sha256`, and `README.md` per spec AC6. Give the folder path to
      the PM.
  - The monorepo path `apps/advantage-games/public/audio/chibi/` is a proposed target. The MANIFEST
    names it as proposed, and the PM or Monorepo session confirms or replaces it at hand-off. This
    repository holds no copy of that folder, so the plan cannot verify it here.
  - Done-when: `sha256sum -c out/apk-audio-handoff/chibi/MANIFEST.sha256` exits 0. The folder holds
    14 sound files. `git status --short ../reading-advantage-monorepo` stays empty. The PM answer
    lands in this plan with its date, and that answer confirms or replaces the proposed path. The
    done-when does not depend on the monorepo path: the folder contents and the checksums decide it.
  - The MANIFEST `target` rows hold the value `proposed: apps/advantage-games/public/audio/chibi/<file>`.

## Phase 6: Deferred work

- [ ] T9 (deferred) Credits: Show the lines of `audio/CREDITS.md` on one screen of the game package.
      This task starts when a library take enters a set. The earshot set needs no credits screen
      (PM decision 2026-11-22c).
  - Done-when, when it starts: each credit line of `audio/CREDITS.md` appears on the screen, and the
    PM records the place in this plan. This track does not start the task.

## Gates

Run these commands after the last phase, and record each exit code in this plan:

- `node node_modules/vitest/vitest.mjs run tests/audio-event-map.test.ts tests/sound-set.test.ts tests/sound-set-mp3.test.ts tests/apk3d/audio-files.test.ts tests/apk3d/audio-wiring.test.ts tests/audio-budget.test.ts --maxWorkers=1`
- `node scripts/audio-event-map.mjs --check`
- `node measure/tools/generate.mjs --check`
- `./measure/doctor.sh --structural-only`
- `node_modules/.bin/prettier --check` on each touched text file

Known limits stay known: `tsc --noEmit` keeps the 38 baseline errors of TD-35 to TD-39.
