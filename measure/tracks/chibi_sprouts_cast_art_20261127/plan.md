# Implementation plan: Chibi Sprouts cast art

Track: `chibi_sprouts_cast_art_20261127`. Lane: light. Three phases, T0 to T9.
The specification is [spec.md](./spec.md). The strategy is [test-strategy.md](./test-strategy.md).

## Gates this track does not run

- No Review A, no Review B, and no Review C.
- No adversarial round. No script and no test changes, so the round has nothing to attack.
- No UX review. The look judge is the only look gate.
- No paid call, no `openchamber_image`, and no hosted model other than the approved judge route.
- No reshape of an accepted character.
- No `./forge all`.

The gate set is fixed. The orchestrator adds no gate.

## Files this track touches

- `measure/tracks/chibi_sprouts_cast_art_20261127/*` (new)
- `measure/tracks.md` (one registry row)
- `measure/generated/status.md` (the generator run)
- `measure/runs/chibi_sprouts_cast_art_20261127/` (the delivery records, the judge records, the
  handoff)
- `out/chibi-sprouts/redesign/cutout/` and `out/sprout-*-kim/sprites/` in the worktree (not in git)

The track changes no asset source, no script, no test, no preset, and no shipped file.

## Role brief template

Every task brief carries these lines:

- The role records its model id and family in the task record. The judge is a separate role on
  `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia. The route is not muse, not hy4, and
  not OpenAI. A missing route waits; do not substitute.
- No role calls the `openchamber_image` tool. A role reads an image with `read`.
- The approved look judge is the only hosted call. Its only uploaded files are the character's
  cut-out PNG, its sprite `preview.png`, and the brief text.
- No role edits an asset, a base, a script, a test, or a committed file.
- Every textured command, every render, and every test run uses the heavy runner.
- Every probe and every fixture stays in the worktree or under `/tmp/opencode`.
- Work in `/home/daniebo/Desktop/forge-worktrees/sprouts-cast-art` only. A write to the main
  checkout's `out/` is a stop-and-report event.
- Stage by explicit path. Never stage `measure/generated/asset-inventory.json`.

## Phase 1: The worktree and the three adults

- [ ] T0 Measure: Create the worktree and prove the five baseline builds.
  - Command: `git worktree add /home/daniebo/Desktop/forge-worktrees/sprouts-cast-art -b
chibi-sprouts-cast-art master`, run from the main checkout. Record the base commit and
    `git worktree list`.
  - In the new worktree, for each of the five assets, through the heavy runner:

    ```bash
    ./forge build <name> --fast
    ./forge render <name> --fast --views front-level,side-level --ortho --flat --bg none --size 1024
    ./forge render <name> --fast --views front-level,side-level --ortho --bg none --size 1024
    ```

  - Done-when: the five GLBs exist and their SHA-256 sums equal the cast record values of spec "The
    worktree and the baseline"; the five stable stats projections equal the cast record values; the
    worktree holds no change outside a new `out/`; the main checkout is unchanged.
  - Record: the worktree path, the branch, the base commit, the node version, each command and exit
    code, the five GLB hashes, the five projection hashes, the five raw `stats.json` hashes (for
    traceability only), and the build and bounds lines.
  - Note: this task writes no asset and no test. It writes `measure/runs/chibi_sprouts_cast_art_20261127/t0-baseline.json`
    and its log.
  - Note: the last lit render replaces the GLB and `stats.json` of its asset. The hash pair is taken
    after that render.

- [ ] T1 Measure: Dad, the cut-out and the idle sprite.
  - Asset: `sprout-dad-kim` on `assets/parts/humanoid-kim.ts`. Adult table.
  - Commands, through the heavy runner, in this order:

    ```bash
    ./forge cutout sprout-dad-kim --out out/chibi-sprouts/redesign/cutout --views front --ppm 900 --canvas 1024x1500
    ./forge sprites sprout-dad-kim --clip idle --cell
    ./forge sprites sprout-dad-kim
    node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout
    node /tmp/opencode/verify-sprouts-art.mjs out/sprout-dad-kim/sprites sprout-dad-kim
    ```

  - Done-when: the cut-out is 1024 x 1500 with a figure of 900 px or more; its corners are
    transparent, its outer 1 px ring is empty, and no alpha-0 pixel holds colour; the sprite static
    set is 128 x 128 with an empty ring; the animated `idle/` set holds 64 frames, `sheet.png`,
    `preview.png`, `idle.gif`, and `metrics.json`; `metrics.json` reports size 128 and clip idle; the
    face reads in `preview.png`; the judge scores the cut-out identity and proportion and the sprite
    identity, proportion, and face reads at 7.5 or more; the judge record holds every field of spec
    "The judge record".
  - Record: the three commands and exit codes, the two paths, the file sizes, the figure height, the
    check line, the frame and direction counts, the five hashes (cut-out, static preview, sprite
    metrics, delivered GLB, base file), the asset and base commits, and the five scores.
  - Note: the cut-out check walks the whole folder. The first run holds Dad alone; later runs hold
    more figures. The task reads one line per figure.
  - Note: a failing score on the accepted shape stops the task and reports to the PM (decision l).

- [ ] T2 Measure: Grandma, the cut-out and the idle sprite.
  - Asset: `sprout-grandma-kim` on `assets/parts/humanoid-kim.ts`. Adult table. Her bun sits above
    the projected crown; the cut-out canvas must hold it.
  - The commands, checks, done-when, and record are those of T1, with `sprout-grandma-kim`.
  - Note: her lowest point is -0.005 m, which is 4 px at 900 px per metre. The foot-row line is
    expected to pass, as it did for Mom.

- [ ] T3 Measure: Grandpa, the cut-out and the idle sprite.
  - Asset: `sprout-grandpa-kim` on `assets/parts/humanoid-kim.ts`. Adult table.
  - The commands, checks, done-when, and record are those of T1, with `sprout-grandpa-kim`.
  - Note: his lowest point is -0.007 m, which is 6 px at 900 px per metre. The foot-row line is
    expected, and decision (f) applies. The task records the arithmetic and the `bounds.min[1]`
    value.

- [ ] T4 Measure: The Phase 1 gate.
  - Done-when: the T0 baseline holds; the three cut-outs and the three sprite sets pass decision (e),
    decision (h), and decision (j); each judge input of spec "The gate check of the judge inputs" is
    verified at the gate HEAD; the three records hold no open blocking finding; the three records sit
    under `measure/runs/chibi_sprouts_cast_art_20261127/`; `./measure/generate.sh` exits 0.
  - Record: the phase base, the gate HEAD, the three verdicts, each verified input with its hash
    pair, the cut-out check lines, the sprite metrics lines, and the phase diff.
  - Note: no panel, no sheet, and no source change. A failing line returns the named character to its
    task.

## Phase 2: The two children

- [ ] T5 Measure: Tom, the cut-out and the idle sprite.
  - Asset: `sprout-tom-kim` on `assets/parts/humanoid-kim-child.ts`. Child table.
  - The commands, checks, done-when, and record are those of T1, with `sprout-tom-kim`.
  - Note: his height is 1.090 m, which is 981 px at 900 px per metre. His lowest point is -0.002 m,
    which is 2 px. The foot-row line is expected to pass.
  - Note: the shared child base is a judge input. The record holds its commit and its SHA-256.

- [ ] T6 Measure: Lily, the cut-out and the idle sprite.
  - Asset: `sprout-lily-kim` on `assets/parts/humanoid-kim-child.ts`. Child table, hair slot.
  - The commands, checks, done-when, and record are those of T1, with `sprout-lily-kim`.
  - Note: her height is 1.067 m, which is 960 px at 900 px per metre. Her lowest point is -0.010 m,
    which is 9 px. The foot-row line is expected, and decision (f) applies. The task records the
    arithmetic, and every other check line must be `ok`.
  - Note: the bob must stay clear of the face at 128 px. The face reads in `preview.png` is the
    sprite score that protects it.

- [ ] T7 Measure: The Phase 2 gate.
  - Done-when: the two cut-outs and the two sprite sets pass decision (e), decision (h), and
    decision (j); each judge input is verified at the gate HEAD, including the shared child base
    commit and hash; the two records hold no open blocking finding; `./measure/generate.sh` exits 0.
  - Record: the phase base, the gate HEAD, the two verdicts, each verified input with its hash pair,
    the cut-out check lines, the sprite metrics lines, and the phase diff.

## Phase 3: The final gate and the handoff

- [ ] T8 Measure: The final gate and the project gate.
  - Done-when: all five cut-outs and all five sprite sets exist at the decision (a) paths; the five
    judge inputs re-verify at the gate HEAD; the five verdicts are `pass`; the ten files sit inside
    the worktree `out/` tree; `PROJECT_TESTS` with the TD-40 exclusion exits 0; `PROJECT_LINT` exits
    0; `PROJECT_CHECKS` exits 0; `node_modules/.bin/prettier --check` exits 0 on the track files;
    `./measure/generate.sh` exits 0; `./measure/doctor.sh` exits 0.
  - Record: the gate HEAD, the five verdicts, each verified input, the ten file paths with sizes and
    hashes, each gate command with its exit code, and the doctor output.
  - Note: this gate is the track acceptance record (decision n). A doctor line that names another
    track, an archived track, or an open debt entry is recorded with its owner and does not fail
    this gate. A line that names this track fails it.

- [b] T9 Measure: Record the PM's answer. deferred:pm trigger: event the PM answers. Human gate.
  - The handoff names: the ten delivery files with their paths, sizes, and SHA-256 sums; the five
    judge records; the five scores; the cut-out check lines; the sprite metrics lines; the worktree
    and branch; and the fact that no customer-facing claim is made.
  - Done-when: this plan holds the handoff date, the PM's word, and the next step.
  - Record: an approval opens the closeout. A change list names each character and returns it to its
    task. A reshape request is a new track, because this track changes no source (decision l).

## Known limits

- The cut-out check allows 4 px at the foot row. Lily's boot is 9 px below the ground plane at
  900 px per metre, so her line is a known flag (decision f).
- The five cut-outs share one folder, one manifest, one scale, and one canvas. A per-asset scale
  would break the cast line-up.
- The sprite is a still set. An animation stays unjudged.
- The judge is one opinion. Daniel's look is the last gate.
- The builds are git-ignored. A fresh worktree runs T0 again, and T0 must reproduce the cast hashes.
- A textured command replaces the asset's GLB and `stats.json`, so the delivered GLB is not the
  `--fast` baseline hash.
- `PROJECT_TESTS` excludes `tests/storytime-book-pictures.test.ts` while TD-40 is open.
- The main checkout holds 18 cast cases that fail without the worktree inputs. This track runs no
  test in the main checkout and records no exception.
