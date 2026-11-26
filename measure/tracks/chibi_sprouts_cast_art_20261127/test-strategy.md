# Test strategy: Chibi Sprouts cast art

Track: `chibi_sprouts_cast_art_20261127`. Lane: light. Three phases, T0 to T9.
Role: `measure-strategy`, first strategy of this track. Date: 2026-11-27.
Source: `spec.md` (AC1 to AC6, decisions a to o), `plan.md`,
`measure/archive/chibi_sprouts_cast_20261125/plan.md` (T6 to T8, T13 to T14),
`measure/archive/chibi_sprouts_redesign_20261123/plan.md` (Phase 9, T13 and T14), `measure/workflow.md`,
`measure/gates.json`, and the files named in section 4.

Every command that starts a render, a textured build, a full `tsc`, or a vitest run uses this
wrapper exactly:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'
```

Exit 75 from the heavy runner means wait and retry. Exit 75 is never a result.

**No customer-facing claim is made.** No file, record, or test in this strategy is customer-facing
material.

## 1. Base SHA, the phase base, and the audited HEAD

The track base is `97fd53ce9e9a8d147729c8c810b59899a697fd1f`, the commit `measure(chibi_sprouts_cast):
T19 accepted by the PM`. The five assets and the two bases are on `master` at that commit.

Two SHAs have two jobs, and they are never the same value:

1. **The phase base.** The orchestrator captures `phase_base_sha` once at the start of each phase,
   after the previous gate commit lands: `git -C /home/daniebo/Desktop/advantage-forge rev-parse HEAD`.
   It serves the phase diff (`git diff --stat <phase_base_sha>..HEAD`) and the gate record.
2. **The audited HEAD.** Each delivery, judge, and gate result records its own `audited_head_sha` at
   the moment it ran. A result certifies only the commit it audited.

The work happens on branch `chibi-sprouts-cast-art` in
`/home/daniebo/Desktop/forge-worktrees/sprouts-cast-art`. No file of this track changes on `master`
except the track record and the registry row.

## 2. Phase map, risk, and review applicability

| Phase | Tasks    | Proofs                                                                                                                            | Risk   | Reason                                                                                                             |
| ----- | -------- | --------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| 1     | T0 to T4 | The five baseline hashes, the three adult cut-outs, the three adult sprite sets, the three judge records, the cut-out check lines | `high` | The build hashes must reproduce the accepted shapes, and a wrong camera, scale, or cell voids every delivery.      |
| 2     | T5 to T7 | The two child cut-outs, the two child sprite sets, the two judge records, the shared child base hash                              | `high` | The child base is shared. A base change voids both records, and the children are the shortest figures at 900 px/m. |
| 3     | T8, T9   | The five re-verified records, the ten files, the project gates, the handoff                                                       | `low`  | Read, hash, and record. T9 is a human gate and runs no test.                                                       |

A risk of `high` here means a wrong number or a wrong build, not a code defect. No phase changes a
source file, so no phase runs Red, Green, adversarial testing, or a review role.

Review applicability, stated for every phase:

| Review gate         | Applies                      | Reason                                                                                                                      |
| ------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Security review     | Not applicable               | No auth, no network input, no user data. The only hosted call is the approved judge route.                                  |
| UX/API review       | Not applicable               | No UI and no package API. The look judge is the look gate.                                                                  |
| Adversarial testing | Not run                      | No script and no test changes, so the round has no surface. The cut-out check and the sprite verifier are the fixed probes. |
| Browser review      | Not applicable               | Forge renders headless Chromium under the heavy runner. Every image is read as a PNG with `read`.                           |
| Phase acceptance    | Each phase gate (T4, T7, T8) | Each gate is recorded against its own audited HEAD, with the captured `phase_base_sha` for the diff.                        |
| Review A/B/C        | Not run                      | Decision (m) forbids them.                                                                                                  |
| Final acceptance    | Not applicable               | The light lane uses the Phase 3 gate as the acceptance record (decision n).                                                 |

## 3. Fixed rules that leave the roles no decision

### 3.1 Model families and the judge

The judge is `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia. The route is not muse,
not hy4, and not OpenAI (decision i). A missing route waits; it never substitutes. No role calls
`openchamber_image`; a role reads a file with `read`.

This track runs no Red role and no Green role, because it changes no source. A shape fix would need a
Green role and a new export, and decision (l) makes that a PM gate, not a task here.

### 3.2 Verdict binding and retries

The judge record holds the asset commit, the base commit, the base hash, the cut-out hash, the sprite
preview hash, the `metrics.json` hash, the route, the round, and the scores (spec "The judge record").
A verdict applies only to those bytes. At most two rounds run per character. Round 2 runs only after
a score below 7.5 or after a changed input voids round 1. A second failure writes
`escalation-<name>.json` and reports to the PM. The PM owns that gate.

A gate that accepts a verdict re-checks every input at its own audited HEAD, as spec "The gate check
of the judge inputs" lists. A cut-out hash alone is not a gate.

### 3.3 The output tree

`out/` is not in git, and the accepted builds exist only in `sprouts-cast`. T0 creates
`sprouts-cast-art` and rebuilds the five assets there. Every later command runs in that worktree. A
role writes no build and no output to the main checkout's `out/`. A scratch verifier stays under
`/tmp/opencode`.

### 3.4 The command order

The order per character is fixed: the cut-out, then the animated sprite set, then the static sprite
set, then the checks, then the judge. The last textured command replaces the GLB and `stats.json`, so
the delivered GLB hash is taken after the last command. The baseline hash pair of T0 is a separate
record and never compares against a textured build.

### 3.5 The cut-out check and the foot row

`node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout` prints one line per PNG and ends
`result ok` or `result fail`. The check compares the lowest opaque row with the manifest foot row and
allows 4 px. At 900 px per metre, a lowest point of -0.005 m is 4 px (Grandma, Mom), -0.007 m is 6 px
(Grandpa, Dad), and -0.010 m is 9 px (Lily). Decision (f) accepts the foot-row line alone, and only
with the arithmetic and the `bounds.min[1]` value recorded. Any other line fails the task.

### 3.6 The sprite check

`/tmp/opencode/verify-sprouts-art.mjs <sprites dir> <name>` reads the PNGs and `metrics.json`. It
requires 128 x 128 frames, an empty outer 1 px ring, one alpha component per frame, size 128, and
clip idle. It is a scratch verifier, as Mom's `verify-mom-delivery.mjs` was. Its output is recorded in
the task record and its path is named there.

## 4. Test layers and proof expectations

### Unit layer

None. The track changes no code, so it adds no test file and no fixture. The two existing probes serve
as the format checks: `scripts/cutout-check.mjs` and the scratch sprite verifier.

### Live-behavior proof

- T0 runs five real `--fast` builds and ten real level renders. The five GLB hashes and the five
  projections are the proof that the accepted shapes reproduce.
- Each art task runs the real cut-out and the two real sprite commands, then reads the real PNGs.
- Each judge reads a real cut-out and a real `preview.png`. The score is model evidence, not owner
  acceptance.

### Artifact and documentation checks

`./measure/generate.sh`, `./measure/doctor.sh`, `prettier --check`, the judge record fields, the
PNG sizes, the manifest values, and the SHA-256 pairs prove format and record integrity. They never
prove the look on their own.

## 5. Phase 1: T0 to T4

T0 — commands through the wrapper where a render runs:

```
./forge build sprout-dad-kim --fast
./forge render sprout-dad-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024
./forge render sprout-dad-kim --fast --views front-level,side-level --ortho --bg none --size 1024
```

The same three commands run for Grandma, Grandpa, Tom and Lily. Proof: each GLB hash equals the cast
record value, and each projection hash equals the cast record value (spec "The worktree and the
baseline").

T1 to T3 — per adult:

```
./forge cutout <name> --out out/chibi-sprouts/redesign/cutout --views front --ppm 900 --canvas 1024x1500
./forge sprites <name> --clip idle --cell
./forge sprites <name>
node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout
node /tmp/opencode/verify-sprouts-art.mjs out/<name>/sprites <name>
```

Expected: the cut-out line `ok <name>/front.png 1024x1500 ...` for Grandma, and the foot-row line for
Dad and Grandpa with 6 px recorded. Every sprite line reads 128 and 64 frames.

T4 — the gate checks the three records, every judge input, the baseline record, and
`./measure/generate.sh`.

## 6. Phase 2: T5 to T7

T5 and T6 repeat the T1 command set for `sprout-tom-kim` and `sprout-lily-kim`. The child base
`assets/parts/humanoid-kim-child.ts` is a judge input for both.

Expected: Tom's cut-out is 981 px tall and his foot-row line passes (2 px). Lily's is 960 px tall and
her foot-row line records 9 px under decision (f). Every other line is `ok`.

T7 — the gate checks the two records, every judge input including the shared child base commit and
hash, and `./measure/generate.sh`.

## 7. Phase 3: T8 and T9

T8 re-verifies the five records and the ten files, then runs:

```
PROJECT_TESTS: node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts
PROJECT_LINT: ./measure/doctor.sh --structural-only
PROJECT_CHECKS: node measure/tools/generate.mjs --check
node_modules/.bin/prettier --check measure/tracks/chibi_sprouts_cast_art_20261127
./measure/generate.sh
./measure/doctor.sh
```

T9 is `[b]` with `deferred:pm` and an event trigger. The PM owns it. It records the handoff date, the
PM's word, and the next task. An approval opens the closeout; a change list returns the named
character to its task. No role starts T9.

## 8. Anti-pattern coverage and falsification

The catalog is `/home/daniebo/Desktop/measure/measure/anti-patterns.md`. A2 (consent-blind publish
gate) does not apply: this track publishes nothing.

| ID                   | Defense                                                                                                                | Falsification                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A3 digit-only count  | Parse labeled counts: 5 GLB hashes, 5 projections, 5 cut-outs, 5 sprite sets, 64 frames, 8 directions, 128 px, 900 px. | A count read from a date, a tolerance, or a loose digit fails the equality.                    |
| A4 vacuous pass      | A verdict is `pass` only on every score 7.5 or more. A gate names each verified input and each hash pair.              | A gate that holds one `fail` verdict, one unverified input, or one absent file passes nothing. |
| A5 false claim       | Run the command before the plan records a result. Record the pixel sizes and the hashes from the run.                  | A recorded result with no run, or a hash that disagrees with the file, fails closeout.         |
| A7 over-broad filter | Name exact failures: the foot-row line, `result fail`, a size line, a ring line. No loose substring.                   | A filter that hides a failing line, or accepts a different failure, fails the case.            |
| A10 facts drift      | Run `./measure/generate.sh` at T4, T7, and T8, and `./measure/doctor.sh` at T8.                                        | Stale committed facts fail the check.                                                          |
| A11 doc drift        | Verify the paths, the ppm, the canvas, the cell size, and the hashes against the source and the cast record before T1. | A wrong number, a renamed line, or a missing file fails the case.                              |

## 9. Aggregate suite

No suite is intentionally red in the worktree. The main checkout holds 18 cast cases that fail
without the worktree inputs; this track runs no test in the main checkout and claims no exception.

## 10. Known limits

- The judge is one opinion. Daniel's look is the last gate.
- The cut-out foot row allows 4 px. A figure below the ground plane reports its line at 900 px/m.
- The cut-out check walks one folder. One failing line is printed beside four passing lines.
- The sprite is a still set. An animation stays unjudged.
- `stats.json` holds elapsed milliseconds. Only its stable projection is compared.
- The builds are git-ignored, so T0 is the only route to a matching build.
- The shared child base voids both child records when it changes.
