# Test strategy: Author game sound sets with earshot

Track: `chore_earshot_sounds_20261121`
Phase heading (exact): `Phase 1: Pin, render, and record`
Lane: light. One phase. Source: spec.md decisions D1-D8 and acceptance criteria AC1-AC6.

## Base SHA and capture point

The spec-review r2 audit passed at the audited HEAD. That SHA is the `role_base_sha` for the
r2 artifacts only. It predates this committed strategy and must not be used as `phase_base_sha`.

The orchestrator must capture the immutable `phase_base_sha` with `git rev-parse HEAD` at this
exact point: immediately after the commit that adds this `test-strategy.md` lands on the branch.
Run Red, Green, and all reviews against that captured `phase_base_sha`. A remediation commit
invalidates review artifacts and requires a fresh capture and fresh reviews.

## Risk classification

Phase 1 risk: `medium`.

Reasons. The wrapper spawns a child binary and parses untrusted set files. A pinned external
renderer writes binary Ogg output. The failure contract is a set of exact stderr lines. No
product source, no AudioBus change, no playback wiring, and no UI are in scope. The blast radius
is one script, one test, one set file, one README, and seven audio files.

## Test layers

### Fixtures and mocks (unit layer, no real render)

`tests/sound-set.test.ts` uses `spawnSync(process.execPath, [script, ...])`. It sets
`SOUNDS_ROOT=<temp root>` and `EARSHOT_BIN=<fake>` in `env`. The fake earshot is a Node script
written into the temp root with an executable mode. Fake contract:

- Derive the sound name from the `-o` path argument.
- Append `process.argv.slice(2).join(' ')` to `<temp>/calls.log` on every call, before the
  `fail-at` check, so a failed invocation is still logged.
- Print `fake-out <name>` to stdout and `fake-err <name>` to stderr on every call.
- Write the ASCII bytes `OggS` to the `-o` path, unless `<temp>/no-write` holds the sound name.
- Exit 3 when the `-o` path ends with `/<name>.ogg` for the name in `<temp>/fail-at`.
- Exit 0 otherwise.

Forwarding reading (D5: the wrapper forwards the output of a successful call, prints none of a
failed call's output, and prints nothing else on stderr): a successful child's stdout and stderr
are both forwarded to the wrapper's stdout in call order, each pair followed by its
`sound-set: <name>.ogg <- <design>` line. The wrapper's stderr stays empty on success and carries
only the single exact failure line on failure. This keeps the exact-line contract intact: failure
cases assert `stderr.trim()` equality, and only the failed call's output is suppressed.

The fake proves wrapper process behavior only. Its four-byte `OggS` output is not a valid Ogg
file. No test triggers a real earshot render. AC3 header checks read the committed Ogg files,
not fake output.

### Live-behavior proof (render layer, outside the test file)

The real render runs once through the heavy runner:
`bash scripts/sound-setup.sh && node scripts/sound-set.mjs chibi`. This call installs the pinned
earshot into `.venv-earshot/`, then renders seven files through that venv. Proof of live behavior
is exit 0 plus seven committed Ogg files that pass the nine AC3 header steps. A passing fake-binary
test does not prove a real render happened.

### Artifact and documentation checks (structural layer)

`prettier --check` proves format. `node measure/tools/generate.mjs --check` and `./measure/doctor.sh`
prove generated facts match the index. The README line check proves documentation content. These
checks do not prove runtime behavior. Keep them distinct from the two layers above.

## Test cases T1 must hold

Run all cases through the fake binary and temp root. Assert `stderr.trim()` equals the full D5
line after value substitution. A prefix match fails the test.

### D5 exact-line failure table (all classes)

| #   | Failure class                         | Exact stderr line                                                    | Exit |
| --- | ------------------------------------- | -------------------------------------------------------------------- | ---: |
| 1   | No argument                           | `sound-set: usage: node scripts/sound-set.mjs <set>`                 |    2 |
| 2   | Bad set name                          | `sound-set: bad set name: <set>`                                     |    2 |
| 3   | Set file missing                      | `sound-set: set file not found: <path>`                              |    1 |
| 4   | Invalid JSON                          | `sound-set: set file is not valid JSON: <path>`                      |    1 |
| 5   | `sounds` missing, not array, or empty | `sound-set: bad set file: sounds must be a non-empty array`          |    1 |
| 6   | Entry `name` missing or empty         | `sound-set: bad set file: entry <index> needs a name`                |    1 |
| 7   | Entry `design` missing or empty       | `sound-set: bad set file: entry <index> needs a design`              |    1 |
| 8   | Duplicate `name`                      | `sound-set: bad set file: duplicate name <name>`                     |    1 |
| 9   | Bad `name` characters                 | `sound-set: bad set file: bad name <name>`                           |    1 |
| 10  | earshot missing or not executable     | `sound-set: earshot not found at <path>; run scripts/sound-setup.sh` |    1 |
| 11  | earshot non-zero exit                 | `sound-set: earshot failed for <name> (<design>) with exit <code>`   |    1 |
| 12  | earshot wrote no file                 | `sound-set: earshot wrote no file for <name> (<design>): <path>`     |    1 |
| 13  | Output path cannot be prepared        | `sound-set: cannot prepare output for <name> (<design>): <path>`     |    1 |

`<index>` is the zero-based array position. `<path>` is the absolute resolved path. `<code>` is the
child exit code. Check order: set name, file existence, JSON parse, set content, binary, then each
render in array order. A failure stops the run. A successful call forwards its child stdout and
child stderr to the wrapper stdout. A failed call prints none of its child output. The output path
cannot be prepared when the target is a directory, its name is too long, or filesystem I/O fails
(including when the output folder itself cannot be created). This check runs before the child call
for that entry; the line names that entry and its target path. The wrapper never deletes a
directory recursively and preserves its contents.

### Plan T1 case map and falsification conditions

| Case              | Fixture and assertion                                                                                                                                                                                                                                                                                                                 | Falsification condition                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1 Full render     | `fake.json` holds `alpha`->`tap/soft`, `beta`->`error/knock`. Exit 0. `calls.log` holds exactly two ordered lines. Both output files exist. Stdout holds seven ordered lines: `fake-out alpha`, `fake-err alpha`, each success line, and the final line `sound-set: 2 sounds -> sounds/fake`. Stderr is empty.                        | Any wrong order, wrong count, missing file, missing forwarded line, or non-empty stderr fails.   |
| 2 Missing file    | `none.json` absent. Exit 1, exact line 3, no `calls.log`.                                                                                                                                                                                                                                                                             | A created log or a different line fails.                                                         |
| 3 Bad JSON        | `bad.json` holds `not json`. Exit 1, exact line 4.                                                                                                                                                                                                                                                                                    | A different line fails.                                                                          |
| 4 Set shape       | Six variants: `sounds` absent, empty array, entry without `name`, `design` as empty string, duplicate name, name `Bad_Name`. Each exit 1, exact line 5/6/7/8/9, and no calls.                                                                                                                                                         | Any variant that renders or prints a wrong line fails.                                           |
| 5 Usage           | No argument gives exit 2 and line 1. Set `../x` gives exit 2 and line 2.                                                                                                                                                                                                                                                              | Wrong exit code or line fails.                                                                   |
| 6 Binary          | `EARSHOT_BIN` absent path, then a file without execute bit. Each exit 1, exact line 10, no calls.                                                                                                                                                                                                                                     | Any call logged or wrong line fails.                                                             |
| 7 Failed render   | `fake.json` holds `alpha`->`tap/soft`, `beta`->`error/knock`, `gamma`->`pop/bubble`. `fail-at` holds `beta`. Exit 1, line 11 with code 3, `calls.log` holds the `alpha` and `beta` lines only. Stdout forwards the successful `alpha` output and holds none of `beta`'s output and no `gamma` line. Stderr holds only the exact line. | A `gamma` call line, a missing `beta` call line, forwarded `beta` output, or a wrong line fails. |
| 8 Missing output  | `no-write` holds `alpha`. Exit 1, exact line 12, stdout empty, `calls.log` holds only the `alpha` line.                                                                                                                                                                                                                               | A `beta` call line, any stdout output, or a wrong line fails.                                    |
| 8b Stale output   | Target `<root>/sounds/fake/alpha.ogg` pre-exists and `no-write` holds `alpha`. Exit 1, exact line 12, stdout empty, `calls.log` holds only the `alpha` line. A write from the current invocation is required.                                                                                                                         | Exit 0 or a wrong line fails.                                                                    |
| 8c Prepare output | Target `<root>/sounds/fake/alpha.ogg` is a directory holding `keep.txt`, or the entry name has 300 characters. Exit 1, exact line 13 with that entry and its target path, stdout empty, no calls, and `keep.txt` preserved. A wrong message fails.                                                                                    | A prefix-only match, a missing exact line, a child call, or a deleted directory fails.           |
| 8d Folder blocked | A regular file sits at `<root>/sounds/fake`. Exit 1, exact line 13 for the FIRST entry (`alpha`, `tap/soft`) with path `<root>/sounds/fake/alpha.ogg`, stdout empty, and no calls.                                                                                                                                                    | Any exit other than the exact line, any child call, or a line for a later entry fails.           |
| 9 Committed files | Read `sounds/sets/chibi.json` from the repo. For each entry run the nine AC3 steps on `sounds/chibi/<name>.ogg` with `readFileSync` and `readUInt32LE`. No audio library.                                                                                                                                                             | The first step that does not hold fails the case.                                                |

AC3 header steps, in order: bytes 0-3 equal `OggS`; byte 4 equals 0; byte 5 has bit `0x02`;
byte 26 is segment count `n`; segment table is bytes 27..`26+n` and the first packet starts at
`27+n`; packet byte 0 is `0x01` and bytes 1-6 are `vorbis`; `vorbis_version` at offset 7 is 0;
`audio_channels` at offset 11 is 2; `audio_sample_rate` at offset 12 is 48000; framing flag at
offset 29 is 1.

AC1 set map for case 9: `tap`->`tap/soft`, `right`->`success/rise`, `wrong`->`error/knock`,
`star`->`coin/bright`, `pop`->`pop/bubble`, `whoosh`->`whoosh/soft`, `level-end`->`success/triad`.

## Gate commands

Targeted Red command (name it; the Red role runs it and writes `red.log`):

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run --maxWorkers=1 tests/sound-set.test.ts'
```

At Red, case 9 and the missing `scripts/sound-set.mjs` make this command fail. That failure is the
Red proof. Exit 75 from the heavy runner means wait and retry, not a test result.

Green gate. All three must hold:

1. The targeted Red command above passes with exit 0.
2. The render call passes with exit 0 and writes seven files:
   `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'bash scripts/sound-setup.sh && node scripts/sound-set.mjs chibi'`
3. Each rendered file passes the AC3 header reader, and `git status` shows the seven Ogg files as
   staged with explicit paths. The venv is never staged.

Closeout gate. Run after Green and after every remediation commit:

1. The targeted vitest command passes with exit 0.
2. `node_modules/.bin/prettier --check scripts/sound-set.mjs sounds/sets/chibi.json sounds/README.md tests/sound-set.test.ts measure/tracks/chore_earshot_sounds_20261121/spec.md measure/tracks/chore_earshot_sounds_20261121/plan.md measure/tracks/chore_earshot_sounds_20261121/spec-review.md measure/tracks/chore_earshot_sounds_20261121/metadata.json measure/tracks/chore_earshot_sounds_20261121/index.md`
   (prettier has no shell parser, so `scripts/sound-setup.sh` and `.gitignore` stay outside.)
3. The standalone wrapper run exits 0 into a scratch root (never the real root):
   `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'SCRATCH=$(mktemp -d) && mkdir -p $SCRATCH/sounds && ln -s $PWD/sounds/sets $SCRATCH/sounds/sets && SOUNDS_ROOT=$SCRATCH EARSHOT_BIN=$PWD/.venv-earshot/bin/earshot node scripts/sound-set.mjs chibi'`
   with `git status --short sounds/` clean afterwards. `EARSHOT_BIN` names the repo venv because a scratch root holds no venv.
4. `node measure/tools/generate.mjs --check`; then `./measure/generate.sh` when
   `git status --short measure/generated` is clean.
5. The doctor passes through the heavy runner:
   `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './measure/doctor.sh'`

## Architecture guardrails and changed-contract risks

- Change no game, no `src/apk3d/audio/bus.ts`, and no asset. Scope control in spec.md forbids it.
- Do not add `.ogg` or `.mp3` playback wiring. `audio_game_integration_20261014` owns playback.
- Keep one command shape, `node scripts/sound-set.mjs <set>`. Derive the set file and output folder
  from the set name (D2). Do not hardcode `chibi` in the wrapper.
- Keep `EARSHOT_BIN` and `SOUNDS_ROOT` overrides (D5). The test depends on both.
- Keep `.venv-earshot/` gitignored. The pinned install must not touch host Python or `node_modules`.
- Changed-contract risk: any edit to a D5 line, exit code, or check order invalidates cases 1-8.
  Any edit to AC3 offsets or to the AC1 map invalidates case 9. Re-run the full targeted file.

## Intentionally-red aggregate suite

The full suite (`node_modules/.bin/vitest run`) is intentionally red. At Red it fails because
`scripts/sound-set.mjs` and the committed Ogg files are absent. Pre-existing debt from the
dependency-refresh track also keeps unrelated tests red. Gate only on the targeted file above.
Report aggregate-suite failures as baseline debt, never as a Green pass. Never edit unrelated
tests to make the aggregate suite green in this track.

## Review gate applicability

| Gate                   | Applicability             | Reason                                                                                                                                                                            |
| ---------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Review A (correctness) | Applicable                | New script, new test, and exact-line contract need independent correctness audit.                                                                                                 |
| Review B (security)    | Applicable, reduced scope | The wrapper spawns a child binary and parses a set file. Audit the `a-z0-9-` set-name check, argv-array spawn with no shell, and the `EARSHOT_BIN` path. No auth or data surface. |
| Review C (UX/API)      | Not applicable            | No API, route, or user flow. The CLI stderr and exit-code contract is already covered by Review A and the targeted test.                                                          |
| Adversarial testing    | Applicable                | Mutate exact lines, check order, stop rule, child-output suppression, and AC3 bytes. Probe that a prefix match cannot pass.                                                       |
| UX browser review      | Not applicable            | No UI. The orchestrator states no UI is in scope. No `PROJECT_DEV_URL` is needed.                                                                                                 |
| Phase acceptance       | Applicable                | Runs last on the immutable `phase_base_sha` captured after this strategy commit.                                                                                                  |

## Anti-pattern coverage and falsification

Every case above has a falsification condition in its table row. The registry used here is
`advantage-pr/measure/anti-patterns.md` (A1-A10). Applicable entries for Phase 1:

| ID                        | Defense in this phase                                                                                                                       | Falsification                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A3 digit-only count       | Parse the labeled count in the success line and require it to equal 2 in case 1. Use a labeled integer, not `rg '[0-9]+'` or a loose regex. | A count taken from a path, date, or any other digit fails the equality check.      |
| A4 vacuous pass           | Require exactly two ordered `calls.log` lines and two output files in case 1. Zero calls is a failure.                                      | A run that renders nothing cannot pass the full-render case.                       |
| A5 false claim            | Run every cited gate command and require exit 0 before the plan records a pass.                                                             | A README or plan claim that contradicts a red gate is caught by the closeout gate. |
| A6 registry overstatement | The tracks.md row and evidence claim seven committed files only after all gates pass.                                                       | A claim made while case 9 is red is caught by acceptance on the immutable HEAD.    |
| A7 over-broad filter      | Use exact `stderr.trim()` equality for all 13 D5 lines. No prefix match, no bare-word filter.                                               | Extra text after a correct prefix fails exact equality.                            |
| A10 generated-facts drift | Run `generate.mjs --check`, regenerate, and run the doctor after staging new files (A10).                                                   | Stale committed facts fail the doctor generated-facts check.                       |

Not applicable in this phase: A1 (supervisor substring heuristic), A2 (consent-blind publish),
A8 (supervisor marker regex), A9 (archived-track path in a test). State this in the audit so the
absence of those guards is not read as a gap.
