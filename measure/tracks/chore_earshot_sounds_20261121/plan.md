# Author game sound sets with earshot

Status: in_progress (2026-11-21). T1 through T4 and T6 and T7 are `[x]` with commit evidence. T5 is a
deferred closeout task owned by the closeout role. This plan owns execution status. `spec.md`
holds the decisions and acceptance criteria.

Lane: light. One phase. Source: PM assignment P2 of 2026-11-21. Deadline: none named.

Files this track touches:

- `tests/sound-set.test.ts` (new)
- `scripts/sound-set.mjs` (new)
- `scripts/sound-setup.sh` (new)
- `.gitignore` (one added line, `.venv-earshot/`)
- `sounds/sets/chibi.json` (new)
- `sounds/chibi/tap.ogg`, `right.ogg`, `wrong.ogg`, `star.ogg`, `pop.ogg`, `whoosh.ogg`,
  `level-end.ogg` (new, committed)
- `sounds/README.md` (new)
- `measure/tracks/chore_earshot_sounds_20261121/*` and the registry row in `measure/tracks.md`
- `measure/generated/*` (only from `./measure/generate.sh`)

## Phase 1: Pin, render, and record

- [x] T1 Red: Add `tests/sound-set.test.ts`. Use `spawnSync(process.execPath, [script, ...])` with [commit `8a5582cc`]
      `env` set to `SOUNDS_ROOT=<temp root>` and `EARSHOT_BIN=<fake>`. The test writes the fake binary
      as a Node script with an executable mode. The fake derives the sound name from the `-o` path,
      then appends `process.argv.slice(2).join(' ')` to `<temp>/calls.log` on every call, before the
      `fail-at` check. It prints `fake-out <name>` to stdout and `fake-err <name>` to stderr on every
      call. It writes `OggS` to the `-o` path unless `<temp>/no-write` holds the sound name. It exits
      3 when the `-o` path ends with `/<name>.ogg` for the name in `<temp>/fail-at`, and it exits 0
      otherwise. Forwarding reading (D5: the wrapper forwards the output of a successful call, prints
      none of a failed call's output, and prints nothing else on stderr): a successful child's stdout
      and stderr are both forwarded to the wrapper's stdout in call order, each followed by its
      `sound-set: <name>.ogg <- <design>` line; the wrapper's stderr stays empty on success and
      carries only the single exact failure line on failure. The test compares `stderr.trim()` with
      the exact line of the spec D5 table, after the value substitution. The ten cases:

  1. Full render: `sounds/sets/fake.json` holds two entries, `alpha` to `tap/soft` and `beta` to
     `error/knock`. The wrapper exits 0. `calls.log` holds exactly two lines, in set order:
     `make --sound tap/soft -o <root>/sounds/fake/alpha.ogg` and
     `make --sound error/knock -o <root>/sounds/fake/beta.ogg`. The two output files exist. Stdout
     holds seven lines in order: `fake-out alpha`, `fake-err alpha`,
     `sound-set: alpha.ogg <- tap/soft`, `fake-out beta`, `fake-err beta`,
     `sound-set: beta.ogg <- error/knock`, and `sound-set: 2 sounds -> sounds/fake`. Stderr is empty.
  2. Missing set file: `sounds/sets/none.json` is absent. Exit 1, the line is
     `sound-set: set file not found: <root>/sounds/sets/none.json`, and `calls.log` is absent.
  3. Set JSON error: `sounds/sets/bad.json` holds `not json`. Exit 1, the line is
     `sound-set: set file is not valid JSON: <root>/sounds/sets/bad.json`.
  4. Set shape errors, each with exit 1, its exact line, and no calls: `sounds` absent, `sounds` as
     an empty array, an entry without `name`, an entry with `design` as an empty string, a
     duplicate `name`, and a `name` of `Bad_Name`.
  5. Usage errors: no argument gives exit 2 and
     `sound-set: usage: node scripts/sound-set.mjs <set>`; the set `../x` gives exit 2 and
     `sound-set: bad set name: ../x`.
  6. Binary errors, with the valid `sounds/sets/fake.json`: `EARSHOT_BIN` names an absent path,
     then a file without the execute bit. Each gives exit 1, the line
     `sound-set: earshot not found at <path>; run scripts/sound-setup.sh`, and no calls.
  7. Failed render: `sounds/sets/fake.json` holds three entries, `alpha` to `tap/soft`, `beta` to
     `error/knock`, and `gamma` to `pop/bubble`; `fail-at` holds `beta`. Exit 1, the line is
     `sound-set: earshot failed for beta (error/knock) with exit 3`, and `calls.log` holds the
     `alpha` and `beta` lines only: `gamma` is never called. Stdout forwards the successful `alpha`
     output (`fake-out alpha`, `fake-err alpha`, `sound-set: alpha.ogg <- tap/soft`) and holds none
     of `beta`'s output and no `gamma` line. Stderr holds only the exact failure line.
  8. Missing output: `no-write` holds `alpha`. Exit 1, the line is
     `sound-set: earshot wrote no file for alpha (tap/soft): <root>/sounds/fake/alpha.ogg`, stdout is
     empty, and `calls.log` holds only the `alpha` line.
  9. Stale output (F1 regression): the target `<root>/sounds/fake/alpha.ogg` already exists before
     the run and the fake writes nothing for `alpha`. Exit 1, the line is
     `sound-set: earshot wrote no file for alpha (tap/soft): <root>/sounds/fake/alpha.ogg`, stdout is
     empty, and `calls.log` holds only the `alpha` line. A write from the current invocation is
     required; a pre-existing file does not satisfy the check.
  10. Committed files: read `sounds/sets/chibi.json` in the repository. For each entry, run the nine
      AC3 steps on `sounds/chibi/<name>.ogg` and fail on the first step that does not hold. The
      reader uses `readFileSync` and `readUInt32LE`, with no audio library.

  Run the file through the heavy runner. Case 9 and the missing `scripts/sound-set.mjs` make the
  suite fail. That failure is the Red proof.
  - Red evidence: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run --maxWorkers=1 tests/sound-set.test.ts'`.
    Log: `measure/runs/chore_earshot_sounds_20261121/red.log`
  - Red result (2026-11-21): exit 1 with 16 of 16 tests failing. Cases 1-8 fail because
    `scripts/sound-set.mjs` is absent (the child exits MODULE_NOT_FOUND, so no exact D5 line
    matches). Case 9 fails with ENOENT on `sounds/sets/chibi.json` (set and sound files absent).
    The test file parses and runs with no syntax or import error. `prettier --check
tests/sound-set.test.ts` passes.
  - Evidence commit: Red `8a5582cc1f16c1a6091639e80f2cca3cd9c9256a`.
  - Green recheck (2026-11-21): the same targeted command exits 0 with 16 of 16 tests passing.

- [x] T2 Green: Add `scripts/sound-setup.sh`, `scripts/sound-set.mjs`, the `.gitignore` line, and [commit `e45704be`]
      `sounds/sets/chibi.json` (the seven maps of AC1). Then render and commit the files.
  - `scripts/sound-setup.sh` runs `python3 -m venv .venv-earshot` when the venv is absent, then
    `.venv-earshot/bin/pip install "earshot @ git+https://github.com/Leonxlnx/earshot@7a7f7c5c70d4a763a1eca4b3666af7c77e313f97"`,
    then prints `.venv-earshot/bin/earshot --version`. A second run reuses the venv.
  - `scripts/sound-set.mjs` follows D5 of the spec. It has a shebang, a header comment with the
    usage, and `ROOT` from `import.meta.url`, as `scripts/sfx-library.mjs` does.
  - The render runs in one heavy call:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'bash scripts/sound-setup.sh && node scripts/sound-set.mjs chibi'`.
    The first render can take about 69 s for the numba compile; later renders take about 3 s.
  - Stage the seven Ogg files with explicit paths. Do not stage the venv.
  - Evidence: the Red command passes with exit 0. The render call exits 0 and writes seven files.
    Each file reads 48 kHz. Log: `measure/runs/chore_earshot_sounds_20261121/green.log`.
  - Green result (2026-11-21): implementation commit `e45704be17d785cd89570ae5637e41e332fe2862`
    adds the script, the setup wrapper, the gitignore line, the set file, and the seven Ogg files.
    The targeted command exits 0 with 16 of 16 tests passing. The render call exits 0 and writes
    all seven files. The standalone wrapper run exits 0. The venv is gitignored and never staged.
    Host `python3` is 3.14 without `ensurepip`, so the setup wrapper falls back to `python3.11`
    (3.11.15); the pin and the venv path are unchanged.
- [x] T3 Record: Add `sounds/README.md` with the designs line of AC5 and the render command. Record [commit `e45704be`]
      the file sizes and the durations. Write the evidence line for the PM hand-off (the set name and
      its seven files). Record any deferred work in the owning track.
  - Gate commands:
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run --maxWorkers=1 tests/sound-set.test.ts'`
    - `node_modules/.bin/prettier --check scripts/sound-set.mjs sounds/sets/chibi.json sounds/README.md tests/sound-set.test.ts measure/tracks/chore_earshot_sounds_20261121/spec.md measure/tracks/chore_earshot_sounds_20261121/plan.md measure/tracks/chore_earshot_sounds_20261121/spec-review.md measure/tracks/chore_earshot_sounds_20261121/metadata.json measure/tracks/chore_earshot_sounds_20261121/index.md`
      (`prettier` has no shell parser, so `scripts/sound-setup.sh` and `.gitignore` are outside
      this gate.)
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/sound-set.mjs chibi'` with exit 0
  - Then run `node measure/tools/generate.mjs --check`, run `./measure/generate.sh` when
    `git status --short measure/generated` is clean, and run the doctor through the heavy runner:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './measure/doctor.sh'`.

  - Recorded sizes and durations (bytes; seconds from `ffprobe`): `tap.ogg` 5534, 0.130;
    `right.ogg` 24579, 1.846; `wrong.ogg` 10800, 0.579; `star.ogg` 11149, 0.691; `pop.ogg` 7639,
    0.319; `whoosh.ogg` 7730, 0.390; `level-end.ogg` 23037, 1.712. The same line is in
    `sounds/README.md`.
  - Green result (2026-11-21): `sounds/README.md` lands in commit
    `e45704be17d785cd89570ae5637e41e332fe2862`. The prettier gate exits 0. The generated facts
    were refreshed after the metadata status moved to `in_progress`. At audit head `c86ccebe` the
    heavy-run doctor exited 1 with `in_progress track has no unchecked task`. That earlier claim
    of a passing doctor was false. Green r3 records the real exit codes below and adds the deferred
    closeout task T5.
  - PM hand-off evidence: set `chibi`; seven files `sounds/chibi/tap.ogg`, `sounds/chibi/right.ogg`,
    `sounds/chibi/wrong.ogg`, `sounds/chibi/star.ogg`, `sounds/chibi/pop.ogg`,
    `sounds/chibi/whoosh.ogg`, `sounds/chibi/level-end.ogg`. All seven land in commit
    `e45704be17d785cd89570ae5637e41e332fe2862`. The same evidence line is in
    `measure/runs/chore_earshot_sounds_20261121/green.log`.

- [x] T4 Red r2 / Green r3 (remediation for review A): own the test side of F1, F2, and F4 and the wrapper fix. Touch only [commits `ebf5ad20`, `f2d2fde4`]
      `tests/sound-set.test.ts`, `plan.md`, `test-strategy.md`, and the run log. Change no
      production source. F1: add a stale-output regression (the target
      `<root>/sounds/fake/alpha.ogg` already exists and the fake writes nothing for alpha, so the
      wrapper must exit 1 with the exact D5 no-file line; a write from the current invocation is
      required). F2: log the failed call in `calls.log` before the fake exits non-zero; use a third
      entry (`gamma` to `pop/bubble`) so the fail-at-`beta` case proves `gamma` is never called;
      print a known stdout line and a known stderr line from the fake and assert forwarding for
      successful calls and suppression for the failed call per D5. F4: assert a successful child's
      stderr is preserved without breaking the exact-line contract for wrapper failure lines. Align
      the case-7 expectation text here and in `test-strategy.md` with the new test. Run the targeted
      Red command; the new assertions fail for the right reasons with no syntax or import error.
  - Red evidence: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run --maxWorkers=1 tests/sound-set.test.ts'`.
    Log: `measure/runs/chore_earshot_sounds_20261121/red-r2.log`
  - Red result (2026-11-21): exit 1 with 3 failed and 14 passed of 17 tests. The full-render case
    fails because stdout lacks the `fake-err` lines (F4: successful child stderr dropped). The
    fail-at-`beta` case fails on the missing forwarded `fake-err alpha` (F4); its stop rule holds
    (`calls.log` has the `alpha` and `beta` lines, `gamma` never called) and its exact failure line
    holds. The stale-output case fails with exit 0 instead of 1 (F1: pre-existing target accepted).
    No syntax or import error. `prettier --check` on the touched files passes.
  - Green r3 result (2026-11-21): implementation commit `f2d2fde40a3a1cb115ef7256a2a586060f714df4`
    changes `scripts/sound-set.mjs` only. F1 fix: the wrapper removes the target with
    `rmSync(out, { force: true })` before each spawn, so a pre-existing file cannot satisfy the
    post-render existence check. F2 and F4 fix: a successful child's stdout and stderr are both
    forwarded to the wrapper stdout in that order, before the `sound-set: <name>.ogg <- <design>`
    line; a failed call still prints no child output and the wrapper stderr keeps the single exact
    D5 line. The targeted heavy-run command exits 0 with 17 of 17 tests passing. No Ogg file was
    re-rendered. Log: `measure/runs/chore_earshot_sounds_20261121/green-r3.log`.

- [ ] T5 Closeout (deferred:closeout-steward): Phase acceptance records the final verdict. The
      closeout role then moves the track to completed, updates the registry and generated facts,
      and archives it. This is a human-gated deferred task. Green r3 does not perform these
      actions. The task stays pending until closeout so the doctor sees an unchecked task while the
      track remains in_progress.

- [x] T6 Adversarial remediation (ADV-1 test side and ADV-2 fix): fix the AC3 reader in `tests/sound-set.test.ts` [commits `06325093`, `d78f3ded`]
      to compare the Ogg magic bytes exactly. The `toString('ascii')` decoding clears the high bit,
      so `0xcf` passes for `O` and `0xf6` for `v`. Compare raw bytes with `Buffer.equals` against
      `Buffer.from('OggS')` and the `0x01` plus `vorbis` sequence. Change no production source and do
      not edit `tests/sound-set.adversarial.test.ts` (it executes the existing reader body in place,
      so the fix flows through with no rename). After the fix the two high-bit adversarial tests
      pass; the two ADV-2 tests (directory at target, 300-char name) stay failing for Green.
  - Red evidence: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run --maxWorkers=1 tests/sound-set.test.ts tests/sound-set.adversarial.test.ts'`.
    Log: `measure/runs/chore_earshot_sounds_20261121/red-r3.log`
  - Red result (2026-11-21): exit 1 with 2 failed and 70 passed of 72 tests. The only failures are
    the two ADV-2 filesystem tests (directory at target, 300-char name), which stay failing for
    Green. All 17 original tests pass and both high-bit adversarial tests
    (`capture pattern high bit`, `vorbis marker high bit`) pass. No syntax or import error.
    `prettier --check` on the touched files passes.
  - Green r4 result (2026-11-21): implementation commit
    `d78f3dedc205773daad2b39b720d30accbeee140` changes `scripts/sound-set.mjs` and adds one row to
    the spec D5 table. The wrapper uses `lstatSync` before each spawn. A directory target or any
    filesystem exception sets a blocked flag and prints one line,
    `sound-set: cannot prepare output for <name> (<design>): <path>`, on stderr with exit 1. The
    check runs before the child call, so `calls.jsonl` stays absent. `rmSync` never uses recursive
    mode, so a directory and its `keep.txt` stay intact. The combined targeted command exits 0
    with 72 of 72 tests passing. No Ogg file was re-rendered. Log:
    `measure/runs/chore_earshot_sounds_20261121/green-r4.log`.
  - Correction (Green r5): the earlier claim that "any filesystem exception" is contained covered
    target preparation only. Output-folder creation stayed outside the handler at that commit.
    Review A r3 F7 found the gap. T7 below records the fix and the new test result.

- [x] T7 Review A r3 remediation (F6/F7 test side and F7 fix): add exact substituted-line assertions [commits `d5742637`, `e49155a2`]
      (`stderr.trim()` equality) for the D5 class
      `sound-set: cannot prepare output for <name> (<design>): <path>`, exit 1. F6: change the two
      adversarial tests (`tests/sound-set.adversarial.test.ts:201-228`, directory at target and
      300-char name) to assert the exact D5 line, keeping the exit-code, no-call, and `keep.txt`
      checks; remove the comments that say D5 has no exact text. Add one case of this class
      (directory at target) to `tests/sound-set.test.ts`. F7 (orchestrator decision, recorded here
      and in `test-strategy.md`; Green adds the sentence to spec D5): when the output folder
      `<root>/sounds/<set>` cannot be created (a regular file sits at that path), the wrapper
      reports this same row for the FIRST set entry, with that entry's target path
      `<root>/sounds/<set>/<first>.ogg`, exit 1, and makes no earshot call. Add an F7 folder test
      to `tests/sound-set.test.ts`. Change no production source and, except for the F6 assertion
      upgrade, do not change other adversarial tests.
  - Red evidence: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run --maxWorkers=1 tests/sound-set.test.ts tests/sound-set.adversarial.test.ts'`.
    Log: `measure/runs/chore_earshot_sounds_20261121/red-r4.log`
  - Red result (2026-11-21): exit 1 with 1 failed and 73 passed of 74 tests. The only failure is
    the new F7 folder test: a regular file at `<root>/sounds/fake` makes the wrapper's
    top-level `mkdirSync` throw an uncaught `EEXIST` stack trace instead of the exact D5 line.
    The F6 exact-line tests pass already at HEAD (the Green r4 wrapper emits the exact
    `cannot prepare output` line for the directory target in both test files and for the 300-char
    name), so they stand as regression guards. No syntax or import error. `prettier --check` on
    the touched files passes.
  - Green r5 result (2026-11-21): implementation commit
    `e49155a24b54379d1f7d39f4579b7741d3c037da` changes `scripts/sound-set.mjs` and adds one
    sentence to the spec D5 row added in r4. Output-folder creation moved inside the same failure
    handler as target preparation. When `mkdirSync` throws, the wrapper names the first set entry
    and its target path in the exact line
    `sound-set: cannot prepare output for <name> (<design>): <path>`, exits 1, and starts no
    earshot call. The combined targeted command exits 0 with 74 of 74 tests passing. No Ogg file
    was re-rendered. Log: `measure/runs/chore_earshot_sounds_20261121/green-r5.log`.
