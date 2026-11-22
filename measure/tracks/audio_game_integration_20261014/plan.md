# Sound in the games: library takes for the game events

Status: in_progress. The plan records execution state. `docs/sound-library.md` retains the library design.

Decisions (a) to (d) and the acceptance criteria: `spec.md`, amendment 2026-11-22. The earshot set
`sounds/chibi/*.ogg` is the first source. The synthesized recipes stay the fallback.

Lane: light. Phases 1 to 6. Source: PM decisions of 2026-11-22. Deadline: none named.

Files this track touches:

- `docs/sound-event-map.tsv` (new)
- `tests/audio-event-map.test.ts` (new)
- `tests/audio-event-map.adversarial.test.ts` (new, the Phase 1 adversarial file, commit 79ae99b5)
- `scripts/sound-set.mjs` (the MP3 step)
- `tests/sound-set-mp3.test.ts` (new)
- `tests/sound-set.test.ts` (the stdout line list)
- `tests/sound-set.adversarial.test.ts` (the Phase 2 adversarial file)
- `tests/sound-set-lookup.test.ts` (new, the lookup fixtures)
- `tests/sound-set.adversarial-p2.test.ts` (new, the earshot and PATH adversarial file)
- `tests/sound-set.adversarial-p2-r2.test.ts` (new, the adversarial round 2 file, commit ca68e6c8)
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

- [x] T1 Red (7ecd5832): Add `tests/audio-event-map.test.ts`. It reads `docs/sound-event-map.tsv` with
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
  - Red result 2026-11-22: test commit 7ecd5832985b61624c34bfcf2d0cb29215e487d2.
    Red command `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/audio-event-map.test.ts'`
    exited 1 with 8 failed on `ENOENT: no such file or directory, open 'docs/sound-event-map.tsv'`
    and no syntax or import error. `node_modules/.bin/prettier --check tests/audio-event-map.test.ts`
    exited 0.

- [x] T2 Green (75e56e8d): Write `docs/sound-event-map.tsv` as AC1 states: one header line
      `event<TAB>source<TAB>note`, then exactly one row for each of the 58 events, and nothing else.
      Write no comment line, no blank line, and no closing text. The `note` field names the event's
      meaning in three words or less. The seven `chibi/<entry>` values come from
      `sounds/sets/chibi.json`. The map's meaning lives in spec AC1, and the file holds data only.
  - Green done-when: the T1 command exits 0 with 8 of 8 tests passing.
  - Record: the plan notes the 31 mapped names and the 27 `synth` names, and the count of `.ogg`
    bytes that a game with every mapped event would load.
  - Green result 2026-11-22: map commit 75e56e8d00b97854c2993bb6ce17699740a11f53. Green command
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/audio-event-map.test.ts'`
    exited 0 with 8 passed (8). The file holds one header line and 58 data rows: 31 mapped names
    and 27 `synth` names. A game with every mapped event loads 90,468 `.ogg` bytes across the seven
    set entries.
  - Adversarial evidence (79ae99b5): `tests/audio-event-map.adversarial.test.ts` adds 21 cases. The
    Red file checks no note length, so the new file adds that rule. It runs the unchanged Red file
    with native Vitest against temporary map copies outside the repository. The malformed copies
    hold an empty map, CRLF bytes, an extra trailing blank line, a duplicate event, and an allowed
    but wrong source. Note probes reject an empty, a whitespace-only, and a four-word note, and
    accept one, two, and three words. A syntax-aware scan covers double quotes, whitespace,
    newlines, comments, receiver prefixes, and filter words. Targeted command:
    `node node_modules/vitest/vitest.mjs run tests/audio-event-map.test.ts tests/audio-event-map.adversarial.test.ts --maxWorkers=1`
    exits 0 with 2 files and 29 of 29 tests. Result: `adversarial-p1-ffbe96a.json` reports pass
    with zero findings.

## Phase 2: MP3 copies in the wrapper

- [x] T3 Red (efdb0314, bb9a1fd7): Add `tests/sound-set-mp3.test.ts`, and change the stdout assertion of case 1 in
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
  - Red result 2026-11-22: test commit 6fbb39bdfb6920ee6e5895a29f0f9547d9fa9a1e.
    Red command `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sound-set.test.ts tests/sound-set-mp3.test.ts'`
    exited 1 with 6 failed and 18 passed (24). `tests/sound-set-mp3.test.ts` case 1 fails on the absent
    `sound-set: alpha.mp3 <- tap/soft` line (the wrapper never calls ffmpeg, so `ffmpeg-calls.log`
    is absent too). Cases 2 to 4 fail with status 0 instead of 1: the wrapper has no ffmpeg step,
    so it succeeds where it must fail. Case 5 fails with
    `ENOENT: no such file or directory, open 'sounds/chibi/tap.mp3'`. The changed case 1 of
    `tests/sound-set.test.ts` fails on the two absent `.mp3` lines. The other 18 existing
    sound-set tests pass. No syntax or import error: all 24 tests collect and run.
    `node_modules/.bin/prettier --check tests/sound-set-mp3.test.ts tests/sound-set.test.ts` exits 0.
  - Note for Green: the plan text says case 1 gives "14 files" for two entries. Two entries give
    four files (two `.ogg`, two `.mp3`); 14 is the seven-entry real-set count. The committed test
    asserts the four fake files and names this correction here.
  - Fixture repair 2026-11-22: test commit efdb0314ec42561ec162d46e2d92f61623341c94. The three
    committed fixtures follow AC2's exact argv and per-entry order. See the second block of
    `measure/runs/audio_game_integration_20261014/red-p2.log`.
  - Green result 2026-11-22: after script commit 3e3ed5a5 and file commit debbf930, the command
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sound-set.test.ts tests/sound-set-mp3.test.ts tests/sound-set.adversarial.test.ts'`
    exited 0 with 3 files and 91 of 91 tests passing.
  - Gap-closing lookup fixtures 2026-11-22: test commit bb9a1fd79f8166670f65d303c54c9d67bb769556.
    New `tests/sound-set-lookup.test.ts` covers Review A F1 and F2 and Review B F1 to F3: a
    directory `FFMPEG_BIN`, an empty `FFMPEG_BIN` (read as unset, falling back to PATH), no
    `PATH` ffmpeg with an executable `./ffmpeg` in the working directory, a directory named
    `ffmpeg` shadowing a valid `PATH` executable, the default `PATH` lookup, a basename
    `FFMPEG_BIN` resolved through `PATH`, and a blocked `.mp3` target that must keep the stale
    `.ogg`. Five cases fail against the committed wrapper for the documented reasons; the
    default-lookup and basename cases pass as lock-in. See the third block of
    `measure/runs/audio_game_integration_20261014/red-p2.log`.

- [x] T4 Green (dcfad290, 2b29c067): Add the MP3 step to `scripts/sound-set.mjs` per spec AC2. Add the `FFMPEG_BIN`
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
  - Green result 2026-11-22: script commit 3e3ed5a5f847c6fe64709c3d4c675b8ea0ae9cf2 and file commit
    debbf930001ae186a72ec3e860d6a5eba09806b9. The Green command exited 0 with 3 files and 91 of 91
    tests. The render command exited 0 and wrote 14 files. The pre-render run failed only on MP3
    case 5 with ENOENT for `sounds/chibi/tap.mp3`, before the real render.
  - Ogg byte report: every changed byte is an Ogg stream serial or page CRC. The three-page files
    change 24 bytes each. `right.ogg` and `level-end.ogg` have four pages and change 32 bytes each.
    File sizes and decoded audio are unchanged. The seven `.ogg` files were restored to HEAD, and the
    seven `.mp3` files were re-encoded from those committed Oggs with the pinned argv. Re-encoded MP3
    bytes equal the render MP3 bytes.
  - `sounds/README.md` now holds byte size and duration for all 14 files, in two tables. It records
    earshot 1.0.0 and `ffmpeg version 8.0.1-3ubuntu2`. The Ogg total is 90,468 bytes and the MP3
    total is 71,136 bytes.
  - Project gate 2026-11-22: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts'`
    exited 0 with 214 files and 3267 of 3267 tests. `node measure/tools/generate.mjs --check` exited 0. `./measure/doctor.sh --structural-only` exited 0.
  - Remediation 2026-11-22: fix commit dcfad29055561f890e6d2117871d24e233268288. The wrapper now
    resolves ffmpeg only to a regular executable file. `FFMPEG_BIN` is an absolute path or a basename
    searched on PATH, an empty value is unset, the working directory is never searched, and PATH
    entries that hold directories are skipped. A failed lookup exits with AC2's missing-binary line
    before target preparation or earshot. Target preparation checks both `.ogg` and `.mp3` before
    removing either, so a blocked `.mp3` target leaves the stale `.ogg` in place and makes zero
    earshot calls.
  - Remediation gate 2026-11-22: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sound-set.test.ts tests/sound-set-mp3.test.ts tests/sound-set.adversarial.test.ts tests/sound-set-lookup.test.ts'`
    exited 0 with 4 files and 98 of 98 tests. The project gate exited 0 with 215 files and 3274 of
    3274 tests. Review A F1 and F2 and Review B F1 and F2 are fixed; the F3 note is corrected above.
  - Remediation r2 2026-11-22: fix commit 2b29c067756a8c4ba8b644edcea3ebf33b2698f2. Test commit
    81511930 adds `tests/sound-set.adversarial-p2.test.ts`. The earshot guard now applies the same
    regular-executable-file rule as ffmpeg, so an empty `EARSHOT_BIN` or a directory fails with the
    exact earshot diagnostic before preparation and both old files stay. The ffmpeg lookup skips
    every non-absolute PATH entry, so `.` and `bin` cannot supply a binary. The five-file gate exited
    0 with 5 files and 117 of 117 tests. The project gate exited 0 with 216 files and 3293 of 3293
    tests. Adversarial F5 and F6 are fixed.
  - Phase 2 checkpoint evidence 2026-11-22: test commit ca68e6c8 adds
    `tests/sound-set.adversarial-p2-r2.test.ts`, the adversarial round 2 file. The six-file command
    exited 0 with 6 files and 123 of 123 tests. The project gate exited 0 with 217 files and 3299 of
    3299 tests. Review A r3 (`review-a-d7ca282.json`), Review B r3 (`review-b-d7ca282.json`), and
    adversarial r2 (`adversarial-p2-d7ca282.json`) each report pass with an empty finding list.
    Phase acceptance `phase-acceptance-p2-ca68e6c.json` reports PASS.

## Phase 3: File playback in the AudioBus

- [x] T5 Red (7b75bd3d): Add `tests/apk3d/audio-files.test.ts`. The test installs a fake `window.AudioContext`
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
  - Red result 2026-11-22: test commit 7b75bd3dfd9f09d8277b14c79a36c57c167d3b39.
    Red command `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-files.test.ts'`
    exited 1 with 10 failed of 10 collected. Every failure is
    `TypeError: asFilesBus(...).useSoundFiles is not a function`, on the call, with no syntax,
    import, or reference error. The harness defines `window`, `navigator`, `Audio`, and `fetch`
    with `Object.defineProperty` (plain assignment fails on Node's getter-only `navigator`) and
    restores every global after each test. `tests/apk3d/imports.test.ts` still exits 0 with 4 of
    4 passing, so no existing test breaks. `node_modules/.bin/prettier --check tests/apk3d/audio-files.test.ts`
    exits 0.
  - Green evidence 2026-11-22: implementation commit
    `51b48de5c19bc68bdec178068d6fab81b7814f2f` makes the targeted command exit 0 with 10 of 10
    passing.

- [x] T6 Green (51b48de5): Add the file playback to `src/apk3d/audio/bus.ts` per spec AC4. Keep `defineSfx`,
      `defineMood`, `unlock`, `setMuted`, `suspend`, `resume`, `music`, and `dispose` in their
      current shape. Export `SoundFiles` from `src/apk3d/audio/index.ts`.
  - Green done-when: the T5 command exits 0 with 10 of 10 tests passing.
  - Type check: `node node_modules/typescript/bin/tsc --noEmit` reports no error in
    `src/apk3d/audio/bus.ts` or `src/apk3d/audio/index.ts`. The 38 baseline errors of TD-35 to TD-39
    stay open.
  - Green result 2026-11-22: implementation commit
    `51b48de5c19bc68bdec178068d6fab81b7814f2f` adds `SoundFiles`, `useSoundFiles`, `preload`, the
    one-time ogg-then-mp3 format pick in the first `unlock`, one fetch and decode per event, the
    synth fallback on first play and on any failure, buffer playback through the master gain, and
    buffer stopping plus context close in `dispose`. The file map is inert until a caller sets it.
    Targeted command (heavy runner) exits 0 with 10 of 10. `tests/apk3d/imports.test.ts` exits 0
    with 4 of 4. `tsc --noEmit` exits 2 with the 38 baseline errors of TD-35 to TD-39 and no error
    in either audio file. `node_modules/.bin/prettier --check` exits 0 on both audio files.
    `bash measure/doctor.sh` and `bash measure/doctor.sh --structural-only` exit 0 with no
    structural errors; `node measure/tools/generate.mjs --check` prints "Measure facts are current
    (4 files)" and exits 0.
  - Implementation note: the committed harness counts every `createBufferSource().start()`, so the
    old unlock silence pulse would make cases 5, 8, and 10 count one source too many. `unlock()`
    drops that pulse and keeps `resume()`; this does not change any public signature or any AC4
    rule. Prettier reformatted four pre-existing lines of `bus.ts` (a line wrap of the `victory`
    recipe in `BUILT_IN_SFX`, the `Ctx` assignment, the `synth` arrow, and the `tone` signature)
    because the baseline file was not Prettier-clean at printWidth 110; the recipes are unchanged.

- [x] T6a Red (c02dde0f): Add `tests/apk3d/audio-wiring.test.ts`. It proves that a 2D game host sets the sound
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
  - Red result 2026-11-22: test commit c02dde0fcb0c0016a75248dbae58d6a12c07b657.
    Red command `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-wiring.test.ts'`
    exited 1 with 5 failed of 5 collected. Case 1 fails with
    `ENOENT: no such file or directory, open 'src/apk3d/audio/chibi-events.gen.ts'`. Case 2 reads
    29 hosts and fails on the first path with 0 `wireChibiSounds(` calls. Cases 3 to 5 fail with
    `Cannot find module '/src/apk3d/audio/chibi.js'`, raised inside the case, with no collection
    error. `tests/apk3d/audio-files.test.ts` still exits 0 with 10 of 10 passing.
    `node_modules/.bin/prettier --check tests/apk3d/audio-wiring.test.ts` exits 0. The `[~]`
    marker keeps `plan.md` outside Prettier's task-list shape, so the plan file stays
    Prettier-dirty until Green marks it `[x]`; the Red done-when names the test file only.

- [x] T6b Green (5b4f5110): Add `scripts/audio-event-map.mjs`. It reads `docs/sound-event-map.tsv` and writes
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

  - Green result 2026-11-22: implementation commit
    `5b4f5110319abcdca031e09c8afb8e36892bcbe4` adds `scripts/audio-event-map.mjs`, the generated
    `src/apk3d/audio/chibi-events.gen.ts` with 31 entries, and `src/apk3d/audio/chibi.ts` with
    `chibiSoundFiles`, `chibiPreload`, and `wireChibiSounds`, exported from the audio barrel.
    `soundBase?: string` reaches each host through `Game2DContext`, `PhaserFactoryContext`, and
    `ThreeFactoryContext`; `src/host/main.ts` sets it to `${BASE}`. Each of the 29 hosts calls the
    helper once with its own event list. The 14 rendered files land in `demo/public/audio/chibi/`.
    The targeted command through the heavy runner exits 0: 5 of 5, 10 of 10, and 4 of 4 across the
    three named files (19 of 19 together). `node scripts/audio-event-map.mjs --check` exits 0 and
    writes no file. A changed TSV row exits 1 and names the event; the TSV was restored byte for
    byte. `node node_modules/typescript/bin/tsc --noEmit` exits 2 with 51 errors, all in `assets/`
    and `tests/`, and none in a changed file. The 38 errors of TD-35 to TD-39 stay open; the other
    13 come from the committed concurrent storytime faces guard test. Prettier `--check` exits 0
    on the generator, the generated map, the helper, and the audio barrel. The 29 hosts and the
    four edited source files were already Prettier-dirty at the role base; `measure/workflow.md`
    says no formatting track owns that work, so this task adds no unrelated reformatting. The
    committed Red tests were not edited.

- [x] T6c Red (e481628d): Review A F1/F2 test fixes
  - F1: `tests/apk3d/audio-files.test.ts` counts game sounds as buffer sources whose buffer is
    a decoded file (`gameSourceStarts`); the harness records every `decodeAudioData` buffer, so
    the unlock pulse and the synth recipes never count. Cases 5, 8, and 10 keep their meaning
    through the new counter. New case 11 asserts `unlock()` starts exactly one silent buffer
    source and resumes the context.
  - F2: `tests/apk3d/audio-wiring.test.ts` gains a sixth case. For each of the 29 hosts it parses
    the `wireChibiSounds` event list and requires every event the host plays: the literals of its
    `audio.play` calls (ternary branch names only, never the compared value) and its SFX values.
    Sprite animation `.play` calls never count. The failure names the host path and the names.
  - Red evidence: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-files.test.ts tests/apk3d/audio-wiring.test.ts'`
  - Red done-when: the command exits 1, failing only on the new unlock-pulse case and the new
    per-host event-list case; every earlier case still passes. `prettier --check` on the two
    test files exits 0.
  - Red result 2026-11-22: test commit e481628da5b2effcc9353f53d79b7e342c23a20c. The Red command
    exited 1 with 2 failed and 15 passed (17). Case 11 fails on `expected 0 to be 1` for the pulse
    source: no silent source exists at HEAD. Case 6 fails naming 7 hosts: dragon-flight and
    dragon-rider miss `correct, wrong`; griffin-riders-escape and gryphon-patrol miss `correct`;
    monster-encounters, rpg-battle, and rune-match miss `roar, spawn`. `prettier --check` on both
    test files exits 0.
  - Red re-run at Green start 2026-11-22: the Red command above exited 1 with 2 failed and 15 passed
    (17). Case 11 failed on `expected 0 to be 1` for the missing pulse source. Case 6 failed on the
    same 7 hosts. No other case failed. The committed Red tests were not edited.
  - Green evidence 2026-11-22: fix commit 19ecca6201b167e57fba3137dc8e724d7bea1663 makes both new
    cases pass. The three-file command in the Green result below is the gate and exits 0 with 21
    of 21 tests.
- [x] T6d Green (19ecca62): restore the unlock pulse, complete the host event lists, record the
      audio path and soundBase contract in `docs/apk-port.md` (Review C F1)
  - F1: `src/apk3d/audio/bus.ts` restores the original silent buffer-source pulse in `unlock()`.
    The pulse starts one source with a newly created silent buffer. `resume()` still runs. The
    buffer is not a decoded file, so the test's `gameSourceStarts` counter does not count it.
  - F2: the 7 hosts add the events they play to their lists: dragon-flight and dragon-rider add
    `correct, wrong`; griffin-riders-escape and gryphon-patrol add `correct`; monster-encounters,
    rpg-battle and rune-match add `roar, spawn`. The three longer lists use the Prettier shape.
  - Review C F1: `docs/apk-port.md` records `demo/public/audio/chibi/` to the proposed target
    `apps/advantage-games/public/audio/chibi/` and the `soundBase` contract.
  - Green result 2026-11-22: implementation commit
    `19ecca6201b167e57fba3137dc8e724d7bea1663`. Targeted command through the heavy runner exits 0
    with 3 files and 21 of 21 tests (audio-files 11/11, audio-wiring 6/6, imports 4/4).
    `node scripts/audio-event-map.mjs --check` exits 0 with 31 events current.
    `node node_modules/typescript/bin/tsc --noEmit` through the heavy runner prints 51 `error TS`
    lines, none in a changed file. The 38 errors of TD-35 to TD-39 and 13 concurrent storytime
    faces guard errors stay open. `prettier --check` exits 0 on `src/apk3d/audio/bus.ts` and
    `docs/apk-port.md`. The 7 hosts were Prettier-dirty at the role base; only the changed lines
    are clean. `git diff --check` exits 0. No new file entered the implementation commit.
  - dispositions: F1=FIX; F2=FIX; C-F1=FIX

  - Adversarial evidence (1e610cdb): `tests/apk3d/audio-files.adversarial.test.ts` (16 cases) and
    `tests/apk3d/audio-wiring.adversarial.test.ts` (8 cases) attack the Phase 3 edges the reviews
    left open: odd `canPlayType` answers (`no`, whitespace, both `maybe`), unlock before the map,
    play before unlock, double `useSoundFiles` and map swaps mid-flight, a base without a trailing
    slash, a fetch that resolves or rejects after `dispose()`, play during a pending decode with a
    later decode failure, preload of unmapped and duplicate names, and the unlock pulse when
    `createBuffer` throws. The wiring file also pins the host-list parser against computed keys,
    nested SFX braces, sprite plays, and comment- or string-hidden play calls, and requires a
    literal wire list in all 29 hosts. Targeted command:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-files.adversarial.test.ts tests/apk3d/audio-wiring.adversarial.test.ts'`
    exits 1 with 3 failed and 21 passed (24). The three failing cases pin real defects; the result
    is `adversarial-p3-1e610cdb.json`, retry recommendation `retry_implementation`.
    - F1 [Major] `src/apk3d/audio/bus.ts` `useSoundFiles` does not clear the per-event file state:
      a decoded buffer survives `useSoundFiles(null)` (and a swap to a map without the event), so
      the cleared event still plays its file. This contradicts the method contract ("clears them
      with null so every event uses the synth recipe") and AC4 rule 6. Green: clear `buffers`,
      `pendingDecode`, and `loading` when the map changes.
    - F2 [Minor] `unlock()` throws when `createBuffer` throws (older engines), so the gesture
      handler breaks and the context never resumes. Green: guard the silent pulse with a try/catch
      and keep `resume()`.
    - F3 [Minor] `tests/apk3d/audio-wiring.test.ts` case 6 counts `audio.play` calls inside
      comments and strings as played events. No host triggers it today (the raw-vs-stripped guard
      case passes), but a commented-out play would force a useless preload entry. Green: strip
      comments and strings before the extraction, and mirror the same rules in the `playedEventsOf`
      copy of the adversarial file.
    - A4 probe: a fixture track with a `completed` status and all-`[~]` markers fails the doctor
      with "completed track has an unchecked task"; the marker check is not vacuous. A5 re-run:
      the three original files still pass 21 of 21.

- [x] T6e Red: adversarial F3, wiring parser ignores comments and strings (097231b2). New shared
      helper `tests/apk3d/audio-wiring-parser.ts` exports `stripComments` and `playedEventsOf`;
      case 6 of `tests/apk3d/audio-wiring.test.ts` and the adversarial file both use it, so the
      two files cannot drift. The extraction strips comments, then matches `audio.play(` only
      outside string literals and reads the real quoted arguments, keeping the ternary-branch,
      computed-key SFX, and sprite-play rules. Evidence: `HEAVY_MIN_AVAIL_MB=1500 bash
      /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node
      node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-wiring.test.ts
      tests/apk3d/audio-wiring.adversarial.test.ts'` exits 0 with 2 files and 14 of 14 tests
      (the F3 fixture `ignores play calls that live in comments or strings` now passes).
      Breakage proof: the pre-fix raw regex on the same fixture yields
      `["ghost","specter","tap","wisp"]` where `["tap"]` is required, so the fixture fails
      without the fix. `prettier --check` exits 0 on all three test files. No production file
      changed.
  - Green verified at 9d03b6bd: 5 files, 45 of 45 tests.

- [x] T6f Green: adversarial F1/F2 (9d03b6bd). Commit
      `9d03b6bdeeaf5f7ac353bc8754d206b39a586c86` changes only `src/apk3d/audio/bus.ts`; no test
      file changed.
  - F1: `useSoundFiles` invalidates the per-event file state whose mapping changed or vanished. A
    null map, a different base, or a map without the event clears its decoded buffer, its pending
    bytes, and its in-flight load. An event that keeps its mapping keeps its file, so two calls with
    one equal map still fetch once. Failed events stay marked (AC4 rule 5). A decode that lands
    after its mapping vanished stores no buffer.
  - F2: the silent unlock pulse sits in a try/catch. `resume()` and the mood restart still run when
    `createBufferSource`, `createBuffer`, or `start` throws.
  - Red re-run at Green start: the two adversarial files exited 1 with F1 and F2 failing and 22
    passing (24). F3 was fixed by the parallel Red session (T6e). The first F1 attempt cleared
    `loading` on every call and broke the committed double-wiring case, which passes one equal map
    twice; invalidation is now per changed or vanished event.
  - Green evidence 2026-11-22: the five-file command through the heavy runner
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-files.test.ts tests/apk3d/audio-files.adversarial.test.ts tests/apk3d/audio-wiring.test.ts tests/apk3d/audio-wiring.adversarial.test.ts tests/apk3d/imports.test.ts'`
    exited 0 with 5 files and 45 of 45 tests. The two adversarial files alone exited 0 with 24 of
    24. `node node_modules/typescript/bin/tsc --noEmit` through the heavy runner exited 2 with the
    baseline errors in `assets/` and `tests/` only; no error in `src/apk3d/audio/bus.ts`.
    `prettier --check` on `src/apk3d/audio/bus.ts` and `git diff --check` both exited 0.
    `bash measure/doctor.sh` exited 0 with no structural errors and
    `node measure/tools/generate.mjs --check` exited 0 before this plan edit.
  - dispositions: F1=FIX; F2=FIX; F3=FIX(Red)

- [x] T6g Red (d2d70bcf): Review A/C r3 stale-decode race. Rework
  `tests/apk3d/audio-files.adversarial.test.ts`: the mid-flight swap case is now
  `rejects the stale decode when the map is swapped mid-flight` (fetch pending at the swap,
  resolves after), and the new case is `rejects the stale fetch that resolves after the map
  changed` (decode pending at the swap, resolves after). Each case quotes the AC4 rule in a
  comment ("the current map decides the file"), asserts the stale completion stores nothing,
  asserts the next play fetches the new file (`wrong.ogg`, exact URL list of two), plays it
  (`gameSourceStarts` 1), and never starts a source with the stale buffer. No other case
  changed; the equal-map double-wire case still fetches once. Fixture repair (1bc1cd21):
  the mid-flight case resolves later fetches at once, so the new file decodes and plays.
  - Red evidence 2026-11-22: the five-file command through the heavy runner
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-files.test.ts tests/apk3d/audio-files.adversarial.test.ts tests/apk3d/audio-wiring.test.ts tests/apk3d/audio-wiring.adversarial.test.ts tests/apk3d/imports.test.ts'`
    exits 1 with 2 failed and 44 passed (46). Both failures are assertion failures in the two
    T6g cases (`the next play fetches the new file` / `exactly one fetch for the new file
    follows`: only `right.ogg` fetched, `wrong.ogg` never follows, because the stale decode
    installs its buffer at HEAD). No syntax or import error.
    `node_modules/.bin/prettier --check tests/apk3d/audio-files.adversarial.test.ts` exits 0.
  - Full log: `measure/runs/audio_game_integration_20261014/red-p3-t6g.log`.
  - Green verified at 2fb45ba: 5 files, 46 of 46 tests. The fixture repair commit 1bc1cd21
    resolves the new file fetch, so both cases reach their final assertions and pass.
- [x] T6h Green (2fb45ba3): bind each load to its mapping; reject stale completions
  Commit `2fb45ba3534df6c78b3639cf87803d7d3c5a69ba` changes only `src/apk3d/audio/bus.ts`; no test
  file changed. Each load carries the URL that started it. `isCurrent(name, url)` resolves the
  event under the current map and base and compares the URL. A fetch or decode that finishes after
  a remap stores no buffer, marks no failure, and does not clear a newer load's marker. The same
  identity check guards the preload bytes held in `pendingDecode` until the first unlock. Public
  method shapes, equal-map rewiring, the failed set (AC4 rule 5), and the unlock pulse try/catch
  are unchanged.
  - Green evidence 2026-11-22: the five-file command through the heavy runner
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-files.test.ts tests/apk3d/audio-files.adversarial.test.ts tests/apk3d/audio-wiring.test.ts tests/apk3d/audio-wiring.adversarial.test.ts tests/apk3d/imports.test.ts'`
    exits 0 with 5 files and 46 of 46 tests. `tsc --noEmit` through the heavy runner exits 2 with
    baseline errors in `tests/` only and no error in `src/apk3d/audio/bus.ts`.
    `prettier --check src/apk3d/audio/bus.ts` and `git diff --check` both exit 0.
  - Dispositions: F1=FIX; F4=FIX. Result:
    `measure/runs/audio_game_integration_20261014/green-p3-t6h.log`.

- Adversarial round 2 (`09f808bd`): `tests/apk3d/audio-files.adversarial-r2.test.ts` pins the
  remap, preload, disposal, repeated unlock, memory, and unmapped-event cases. The targeted gate
  fails on F1, F2, and F3. The tests stay failing for Green. No production file changed.
  - F1: A stale preload overwrites the current file before unlock. Later plays use the synth
    without fetching the current file again.
  - F2: A decode that finishes after disposal supplies the sound when the original bus unlocks
    again. A separate new bus uses its own file.
  - F3: The Chibi helper and the bus request invalid URLs for inherited names outside the map.
  - Gate results: `measure/runs/audio_game_integration_20261014/adversarial-p3-09f808bd.log`.
- Late finding F1: tech-debt (TD-44; no current host rewires before unlock, so no wrong current result; PM decision 2026-11-22)
- Late finding F2: tech-debt (TD-44; no host reuses a disposed bus, so no wrong current result; PM decision 2026-11-22)
- Late finding F3: tech-debt (TD-44; guard added in 1b7312f4; no host passes inherited names; PM decision 2026-11-22)
- Late finding A6-F2: tech-debt (scanner gap; fixed by track old_browser_builtins_20261122 AC3 controls; no user reaches it)
- Late finding ADV5-S1: tech-debt (scanner gap; fixed by track old_browser_builtins_20261122 AC3 controls; no user reaches it)
- Late finding ADV5-R1: tech-debt (TD-44; no current host remaps or uses non-enumerable keys)
- [x] T6j Red (b913e55d): old-browser and inherited-remap pins, unpolyfilled built-in scan
  - Old-browser pin: already in 0750febc. `withoutNativeHasOwn` deletes `Object.hasOwn`
    for the case and restores it in `finally` via the saved descriptor
    (`tests/apk3d/audio-files.adversarial-r3.test.ts:27-35`).
  - Inherited-remap pin: 0750febc pins only a preload against an inherited entry, not a
    pending load across an own-to-inherited remap, so this round adds `drops a pending load
    when the event is remapped to an inherited-only entry`. A pending `custom -> tap`
    load, a remap to an inherited-only `custom -> tap` entry with the same value, then
    unlock and play: the stale buffer must never start and no fetch follows. `custom`
    has no synth recipe, so the case needs no oscillator fake; the unlock pulse buffer
    is excluded by identity (`started.filter((b) => b === decoded)`).
  - Red evidence 2026-11-22: the eight-file command through the heavy runner
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-files.test.ts tests/apk3d/audio-files.adversarial.test.ts tests/apk3d/audio-files.adversarial-r2.test.ts tests/apk3d/audio-wiring.test.ts tests/apk3d/audio-wiring.adversarial.test.ts tests/apk3d/imports.test.ts tests/apk3d/audio-files.adversarial-r3.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts'`
    exits 1 with 4 failed, 57 passed, and 2 skipped (63) across 8 files. The failures
    are exactly the two old-browser cases (`TypeError: Object.hasOwn is not a function`
    at `src/apk3d/audio/chibi.ts:24`), the new inherited-remap case (the stale load
    installs and starts its buffer), and the scan test. The 2 skips are the TD-44 pins.
    `node_modules/.bin/prettier --check` exits 0 on the r3 test file.
  - Scan disposition: the scan test is written and run but NOT committed, by PM order
    (scope question for the PM). A failing uncommitted scan would break parallel
    sessions' full-suite runs, so the file was removed after the evidence run; the hit
    list below re-adds it verbatim. The scan strips block comments, line comments, and
    quoted strings, skips `*.gen.ts`, and matches `Object.hasOwn`, `structuredClone`,
    `.findLast(`, `.findLastIndex(`, `.toSorted(`, `.toReversed(`, `.toSpliced(`,
    `Object.groupBy`, `Map.groupBy`, `Promise.withResolvers`, `Array.fromAsync`,
    single-argument `.at(` excluding `this.at(` (Board/Board2d tile lookup), and the
    Set methods `.union(` (excluding `z.union(`), `.intersection(`, `.difference(`,
    `.symmetricDifference(`, `.isSubsetOf(`, `.isSupersetOf(`, `.isDisjointFrom(`.
    Line numbers below are raw-file lines (the probe's strip collapses block comments,
    so its own line numbers shift; verified with raw grep).
  - Scan hits outside `src/apk3d/audio/` (49 hits total; only the 2 T6i `Object.hasOwn`
    lines are in audio: `src/apk3d/audio/bus.ts:263`, `src/apk3d/audio/chibi.ts:24`):
    `structuredClone` in 34 game sim lines: `src/games/abyssal-well/core/sim.ts:221`,
    `src/games/alchemists-synthesis/core/sim.ts:156`,
    `src/games/archers-revenge/core/sim.ts:64`, `:153`,
    `src/games/astral-mage/core/sim.ts:280`, `src/games/castle-defense/core/sim.ts:68`,
    `:208`, `src/games/devourer-slime/core/sim.ts:378`,
    `src/games/dragon-flight/core/sim.ts:304`, `src/games/dragon-rider/core/sim.ts:265`,
    `src/games/dungeon-liberator/core/sim.ts:396`,
    `src/games/enchanted-library/core/sim.ts:389`,
    `src/games/griffin-riders-escape/core/sim.ts:265`,
    `src/games/griffin-sky-joust/core/sim.ts:99`, `:313`,
    `src/games/gryphon-patrol/core/sim.ts:319`,
    `src/games/haunted-library/core/sim.ts:352`,
    `src/games/hero-vs-zombie/core/sim.ts:504`, `src/games/labyrinth/core/mazes.ts:232`,
    `src/games/labyrinth/core/sim.ts:479`, `src/games/magic-defense/core/sim.ts:112`,
    `:231`, `src/games/monster-encounters/core/sim.ts:35`,
    `src/games/paladins-twin-soul/core/sim.ts:150`,
    `src/games/potion-rush/core/sim.ts:401`, `src/games/realm-carver/core/sim.ts:447`,
    `src/games/rpg-battle/core/sim.ts:152`, `:214`,
    `src/games/rune-forge-chamber/core/sim.ts:204`,
    `src/games/rune-match/core/sim.ts:455`,
    `src/games/shadow-gate-dungeon/core/sim.ts:313`,
    `src/games/sorcerer-ziggurat/core/sim.ts:131`,
    `src/games/spellweavers-run/core/sim.ts:249`,
    `src/games/storm-castle-tower/core/sim.ts:339`,
    `src/games/village-guardian/core/sim.ts:423`; genuine `Array.prototype.at` in 8
    lines: `src/games/dragon-flight/view2d/game.ts:565`,
    `src/games/dragon-rider/view2d/game.ts:591`,
    `src/games/spellweavers-run/view/game.ts:216`,
    `src/games/spellweavers-run/view2d/game.ts:311`, `:429`,
    `src/storytime/book-pictures.ts:2269`, `:3935`, `:4558`; genuine
    `Array.prototype.findLastIndex` in `src/host/reader.ts:197`; `THREE.Box3.union`
    false positives (not `Set.prototype.union`) in `src/render/page.ts:263`, `:440`,
    `:447`. Zero hits: `.findLast(`, `.toSorted(`, `.toReversed(`, `.toSpliced(`,
    `Object.groupBy`, `Map.groupBy`, `Promise.withResolvers`, `Array.fromAsync`,
    `.intersection(`, `.difference(`, `.symmetricDifference(`, `.isSubsetOf(`,
    `.isSupersetOf(`, `.isDisjointFrom(`.
  - Red re-run at Green start 2026-11-22: the seven committed files through the heavy runner
    exit 1 with 3 failed, 57 passed, and 2 skipped (62). The two old-browser cases fail with
    `TypeError: Object.hasOwn is not a function`; the inherited-remap case installs its stale
    buffer. The uncommitted scan test is not part of this gate. `node_modules/.bin/prettier
    --check` exits 0 on `tests/apk3d/audio-files.adversarial-r3.test.ts`.
  - Green verification 2026-11-22: after fix 0cc7b5c4 the seven-file command exits 0 with 60
    passed and 2 skipped (62). The two old-browser cases and the inherited-remap case pass.
- [x] T6k Green (0cc7b5c4): Replace both `Object.hasOwn` calls with one local `hasOwn` helper in
      `src/apk3d/audio/bus.ts` that calls `Object.prototype.hasOwnProperty.call`. Use the helper
      at every event-map read: `requestFile`, the mapping comparison in `useSoundFiles`,
      `isCurrent`, and `chibiPreload`. Keep public shapes, equal-map behavior, the failed set,
      and the unlock pulse try/catch.
  - F1 (adversarial r4 F1, Review B r5 F1): the helper runs on the older admitted browsers, so
    Chibi wiring and direct preload no longer throw when the native static method is absent.
  - F2 (adversarial r4 F2, Review A r5 F1): a key that loses its own entry counts as changed in
    `useSoundFiles`, and `isCurrent` rejects a name the current map does not own. A pending load
    under an own-to-inherited remap now installs nothing and starts no follow-up fetch.
  - Scan hits outside `src/apk3d/audio/` stay out of scope (49 hits in `src/games/**`,
    `src/host/`, and `src/storytime/`); this task changes no file there.
  - Green evidence 2026-11-22: implementation commit
    `0cc7b5c493d488deec2f7e4341c94ef78d48b46a` changes only `src/apk3d/audio/bus.ts` and
    `src/apk3d/audio/chibi.ts`. Targeted command through the heavy runner
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/audio-files.test.ts tests/apk3d/audio-files.adversarial.test.ts tests/apk3d/audio-files.adversarial-r2.test.ts tests/apk3d/audio-wiring.test.ts tests/apk3d/audio-wiring.adversarial.test.ts tests/apk3d/imports.test.ts tests/apk3d/audio-files.adversarial-r3.test.ts'`
    exits 0 with 7 files and 60 passed, 2 skipped (62). `grep -rn 'Object.hasOwn'
    src/apk3d/audio/` finds no match. `node_modules/.bin/prettier --check` on both changed
    files exits 0. `tsc --noEmit` through the heavy runner exits 2 with 51 baseline errors,
    none in either changed file. `git diff --check` exits 0.
  - dispositions: F1=FIX; F2=FIX

- [x] T6l Red (1f45fcfe): unpolyfilled built-in scan, scoped to src/apk3d/audio/ (PM 2026-11-22)
  - `tests/apk3d/no-unpolyfilled-builtins.test.ts` walks one `SCAN_ROOT` constant (today
    `src/apk3d/audio/`, so track `old_browser_builtins_20261122` can widen it to `src/`),
    strips block comments, line comments, and quoted strings, skips `*.gen.ts`, and fails
    naming file and line on the T6j built-in list (`Object.hasOwn`, `structuredClone`,
    `.findLast(`, `.findLastIndex(`, `.toSorted(`, `.toReversed(`, `.toSpliced(`,
    `Object.groupBy`, `Map.groupBy`, `Promise.withResolvers`, `Array.fromAsync`,
    single-argument `.at(` excluding `this.at(`, and the seven Set methods with
    `z.union(` excluded). The 44 hits outside audio went to TD-45 and the new track.
  - Gap-closing evidence 2026-11-22: the eight-file command through the heavy runner
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/no-unpolyfilled-builtins.test.ts tests/apk3d/audio-files.test.ts tests/apk3d/audio-files.adversarial.test.ts tests/apk3d/audio-files.adversarial-r2.test.ts tests/apk3d/audio-files.adversarial-r3.test.ts tests/apk3d/audio-wiring.test.ts tests/apk3d/audio-wiring.adversarial.test.ts tests/apk3d/imports.test.ts'`
    exits 0 with 8 files and 61 passed, 2 skipped (63). The 2 skips are the TD-44 pins.
    `node_modules/.bin/prettier --check` exits 0 on the scan test.
  - Breakage proof 2026-11-22: with `SCAN_ROOT` temporarily pointed at
    `tests/tmp-builtin-fixture/` holding one file with `Object.hasOwn(x, "y")`, the scan
    exits 1 naming `src/apk3d/audio/evil.ts:2: Object.hasOwn`. The fixture was removed
    and the root restored; no production file changed.

## Phase 4: Preload budget

- [~] T7 Measure: Add `scripts/audio-budget.mjs`. It serves the demo with vite, opens one game in
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
  - Red result 2026-11-22: test commit c6ccaf463ce477aef526f96ea91ab201d98462dc.
    Red command `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'rm -f out/audio-budget/rune-match.json && node node_modules/vitest/vitest.mjs run tests/audio-budget.test.ts --maxWorkers=1'`
    exited 1 with 1 failed and 3 passed (4). Case 4 fails with
    `ENOENT: no such file or directory, open 'out/audio-budget/rune-match.json'`
    with no syntax or import error. `node_modules/.bin/prettier --check tests/audio-budget.test.ts`
    exits 0.

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
    14 sound files. `git -C ../reading-advantage-monorepo status --short` lists no path that this
    track names, both before and after the hand-off. Other sessions edit the monorepo, so the
    status need not be empty. No Forge command writes in the monorepo. The PM answer lands in this
    plan with its date, and that answer confirms or replaces the proposed path. The done-when does
    not depend on the monorepo path: the folder contents and the checksums decide it.
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
