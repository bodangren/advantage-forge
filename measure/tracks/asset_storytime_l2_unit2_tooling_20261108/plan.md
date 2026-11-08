# Storytime Level 2 unit 2 run tooling (unpaid)

Status: new (2026-11-08). The unpaid tools for the unit 2 paid run wait for the maker.

The track builds the unit 2 guard entry (cap empty), the judge batch unit 2 option, the unit 2
delivery writer, and the fix to the animal line-art sentence. It spends 0 USD. The
[specification](./spec.md) owns the scope and the acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track.
- Owned paths are in the "Owned paths" section of the specification. The owned planning paths are
  this folder and `measure/runs/asset_storytime_l2_unit2_tooling_20261108/`.
- Do not change `assets/fireball.ts` or `out/fireball/`. Their owner review stays separate.
- Do not change the judge kit or any unit 1 file. Do not write a value in `U2_RUN.capUsd`.
- The question tool is denied. Route every question for Daniel through the PM orchestrator.
- Other agents share the git index. The maker commits explicit paths only.
- The maker marks a task `[~]` before the task changes a file outside `measure/` (measure-guard).
- No PNG or JPG goes into git. Test fixtures are generated in temp folders.
- Every test run and typecheck runs with
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`,
  one at a time. Exit code 75 means hold: retry later. The PM asks for the slot through
  `scripts/jobs/slot wait` in the background (Monorepo goes first).
- Spend limit: 0 USD. No Muse, OpenRouter, or other paid call runs.
- Time box: the work finishes before the Go request of 2026-11-08 18:00 ICT.

PM 2026-11-03: light lane. The PM put this whole track on the light lane: one maker
(`measure-jr-green`), one checker (`measure-phase-acceptance`), then closeout. No spec review,
test strategy, Red, Review A, Review B, Review C, adversarial, UX review, or final acceptance role
runs. The maker writes the code and the tests. The checker checks the phase at an immutable HEAD.

### Task markers

`[x]` means complete. `[~]` means in progress. `[ ]` means ready and not started. `[b]` means
blocked, with a trailing `deferred:<owner>` field. The owner changes `[b]` to `[~]` when the
blocker clears and the task starts. The doctor counts only `[ ]`, `[~]`, and `[x]`.

## Phase 0: Authoring [checkpoint: f11c0c2]

- [x] Task 0 (f11c0c24): Author the track: specification, plan, metadata, index, spec review note, and the
  registry entry. The creation commit has the message
  `measure(storytime_l2_unit2_tooling): create the track`.

The light lane has no spec review gate. The second small commit marked Task 0 and put the
checkpoint on this heading.

## Phase 1: Guard, judge option, delivery writer, and line sentence

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`).

- [x] Task 1 (580bc970): Guard (D1). Add `U2_RUN`, the kind `u2` in `classifyOutDir`, and the
  empty-cap refusal in `runGuards`. Route unit 2 specs to the unit 2 root in the muse tool, with
  no other change. Write `tests/storytime-u2-guards.test.ts`: a `u2` call is refused while the cap
  is null, 0, negative, or a string; a test-only cap value lets a `u2` call pass the cap check;
  a mixed call is refused; the unit 1 and card tests pass without change. Set `startTime` to the
  real UTC time of this task, cut to the minute. Commit with explicit paths.
- [x] Task 2 (58f4ee10): Judge option (D2). Add `--unit2` to
  `scripts/storytime-judge-batch.mjs` (and its `.d.mts`). Write
  `tests/storytime-u2-judge-batch.test.ts`. Commit with explicit paths.
- [x] Task 3 (7ee4757f): Delivery writer (D3). Write `deliverMuseUnit2` and
  `tests/storytime-u2-delivery.test.ts` with generated fixtures, the reuse copy, the size and alpha
  checks, and the pin refusal. Commit with explicit paths.
  Checker findings F1, F3, F4, F5 of acceptance-p1-fa05dfe (2026-11-08): FIX in round r3,
  commit 258c1b93; F2: GREEN rerun at the new HEAD.
- [x] Task 4 (4c7e2b11): Line sentence (D4). Fix `scripts/storytime-u2-specs.mjs`, regenerate
  the specs and the prompt list, add the check to `tests/storytime-u2-specs.test.ts`, rebuild the
  hand-off folder with `make-handoff.mjs`, and run `sha256sum -c MANIFEST.txt` (0 failures).
  Commit with explicit paths.
- [x] Task 5 (395c573e): Zero-spend proof and report (D5). The `costs.tsv` hashes equal the
  hashes before the work. Run the GREEN test command and the typecheck. Write
  `measure/runs/asset_storytime_l2_unit2_tooling_20261108/pm-report.md`: the first line is
  `Status: done.`; then the hand-off MANIFEST count; then the guard state
  `cap empty, refuses all unit 2 calls`; then `Facts changed:`.
- [b] Phase 1 gate deferred:checker: phase acceptance by the checker (`measure-phase-acceptance`)
  at an immutable HEAD. The checker runs the GREEN test command and the typecheck. It probes the
  guard: every `u2` call is refused with an empty cap, and the unit 1 and card calls are
  unchanged. It runs `sha256sum -c MANIFEST.txt`, compares the `costs.tsv` hashes, and greps FR-8.

## Track-level roles

- [b] Closeout deferred:closeout: archive the track, update the registry, and run the doctor.

The light lane has no final acceptance role. Closeout commits `measure/runs/<track>/` with the
archive.

## Human gate

Daniel's "Go" on the Workbooks paid media list (due 2026-11-08 18:00) opens the paid run. The PM
writes the approved limit in `U2_RUN.capUsd` after the "Go". Both steps are outside this track.

## Risks

| Risk | Control |
| --- | --- |
| A unit 2 Muse call runs before the PM writes the cap. | `U2_RUN.capUsd` is null. FR-1 tests every null, zero, negative, and string case. |
| The guard change breaks unit 1 or card behavior. | FR-3: the blocks are byte equal and the old tests pass without change. |
| A mixed call counts unit 2 spend with other spend. | A mixed call is refused. A `u2` call reads only unit 2 cost files. |
| The delivery writer copies a wrong or damaged file. | D3 size and alpha checks, the pin check, and a stop that names the row id. |
| The judge option changes the frozen judge kit. | FR-10: the checker reads `git status` for the kit path. |
| A foreign hunk in `measure/tracks.md` enters the commit. | The author staged the registry entry through a blob. |
| A text claims a "Go" or a cap value. | FR-8. The checker greps the track files and the report. |

## Evidence

- Track creation commit: recorded at creation (message
  `measure(storytime_l2_unit2_tooling): create the track`).
- Run records: `measure/runs/asset_storytime_l2_unit2_tooling_20261108/` (costs hashes, role logs,
  PM report, acceptance result).
