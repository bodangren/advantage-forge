# Author game sound sets with earshot

Status: new (2026-11-21). No task has started. This plan owns execution status. `spec.md` holds
the decisions and acceptance criteria.

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

- [~] T1 Red: Add `tests/sound-set.test.ts`. Use `spawnSync(process.execPath, [script, ...])` with
      `env` set to `SOUNDS_ROOT=<temp root>` and `EARSHOT_BIN=<fake>`. The test writes the fake binary
      as a Node script with an executable mode. The fake appends `process.argv.slice(2).join(' ')` to
      `<temp>/calls.log`. It writes `OggS` to the `-o` path unless `<temp>/no-write` holds the sound
      name. It exits 3 when the `-o` path ends with `/<name>.ogg` for the name in `<temp>/fail-at`,
      and it exits 0 otherwise. The test compares `stderr.trim()` with the exact line of the spec D5
      table, after the value substitution. The nine cases:

  1. Full render: `sounds/sets/fake.json` holds two entries, `alpha` to `tap/soft` and `beta` to
     `error/knock`. The wrapper exits 0. `calls.log` holds exactly two lines, in set order:
     `make --sound tap/soft -o <root>/sounds/fake/alpha.ogg` and
     `make --sound error/knock -o <root>/sounds/fake/beta.ogg`. The two output files exist.
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
  7. Failed render: `fail-at` holds `beta`. Exit 1, the line is
     `sound-set: earshot failed for beta (error/knock) with exit 3`, and `calls.log` holds only the
     `alpha` line.
  8. Missing output: `no-write` holds `alpha`. Exit 1, the line is
     `sound-set: earshot wrote no file for alpha (tap/soft): <root>/sounds/fake/alpha.ogg`, and
     `calls.log` holds only the `alpha` line.
  9. Committed files: read `sounds/sets/chibi.json` in the repository. For each entry, run the nine
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

- [ ] T2 Green: Add `scripts/sound-setup.sh`, `scripts/sound-set.mjs`, the `.gitignore` line, and
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
- [ ] T3 Record: Add `sounds/README.md` with the designs line of AC5 and the render command. Record
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
