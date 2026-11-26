# Chibi Sprouts cast art: the five cut-outs and the 128 px idle sprites

## Purpose

The cast model work is done and merged (`chibi_sprouts_cast_20261125`). Dad, Grandma, Grandpa, Tom
and Lily have an accepted build, a panel, and a cast sheet. The PM accepted the five panels and the
sheet on 2026-11-27.

Release 1 art still needs two deliverables for each of the five characters: one cut-out and one
128 px idle sprite. Mom has both from `chibi_sprouts_redesign_20261123`, Phase 9 tasks T13 and T14.

This track produces the five cut-outs and the five sprite sets with the Mom tools and gates. It
changes no source file and no test file.

**No customer-facing claim is made.** The track publishes no page, post, deck, video, or email. The
ten deliverables stay in the worktree and the handoff. Daniel's look gate stays with him.

## Context

- The PM decision is `QUEUE.md` item 3. The cast model work is done; the two deliverables remain.
- The cast track records the accepted builds in
  `measure/archive/chibi_sprouts_cast_20261125/plan.md` (T6 to T8 and T13 to T14).
- The cast worktree is `/home/daniebo/Desktop/forge-worktrees/sprouts-cast` on branch
  `chibi-sprouts-cast`. Its `out/` tree is git-ignored and holds the only builds.
- Mom's cut-out is `out/chibi-sprouts/redesign/cutout/sprout-mom-kim/front.png`, 1024 x 1500, figure
  1370 px, 900 px per metre. Mom's sprites are `out/sprout-mom-kim/sprites/`, 128 px, idle.
- Mom's Phase 9 record is
  `measure/runs/chibi_sprouts_redesign_20261123/judge-p9-bf4158a.json`.
- The cut-out command is `./forge cutout`. It exists in `src/cli/forge.ts` and
  `src/render/cutout.ts`. The format check is `scripts/cutout-check.mjs`.
- The sprite command is `./forge sprites`. It writes the static 128 px set and the animated sheets.
- `out/` is not in git. A fresh checkout holds no GLB and no render. T0 rebuilds the five assets in
  the new worktree and proves the hashes match the cast record.
- Every render and every textured command uses the heavy runner:
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
- A textured Forge command takes one of the two machine build slots.
- The PM rule of 2026-11-25 asks for the lightest gates the risk allows.

## Standing rules

- Work in `/home/daniebo/Desktop/forge-worktrees/sprouts-cast-art` on branch
  `chibi-sprouts-cast-art`. Never write a build or an output to the main checkout's `out/`.
- No role calls the `openchamber_image` tool. It costs money. A role reads an image with `read`.
- No paid generation call runs. The approved look judge is the only hosted call.
- Only the judge inputs leave the worktree: one cut-out PNG, one sprite `preview.png`, and the brief
  text. Nothing else leaves.
- No role edits an asset source, a base source, a script, a test, or a shipped file.
- No role deletes a source file or a committed file. A generator replaces its own output inside the
  worktree `out/` tree; that is an internal step, not a deletion.
- Every probe and every scratch verifier stays under `/tmp/opencode` or inside the worktree.
- A paid call, a forbidden upload, or a write outside the worktree `out/` is a stop-and-report
  event. The role keeps every file and reports to the PM.

## Authoring decisions

These decisions are fixed here. The executing role decides nothing.

| #   | Decision              | Rule                                                                                                                                                                                                                                                                                                                                                                     | Why                                                                                                                                    |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| a   | Characters            | `sprout-dad-kim`, `sprout-grandma-kim`, `sprout-grandpa-kim`, `sprout-tom-kim`, `sprout-lily-kim`. Dad, Grandma and Grandpa use `assets/parts/humanoid-kim.ts`. Tom and Lily use `assets/parts/humanoid-kim-child.ts`.                                                                                                                                                   | The cast track fixed the five names, the two bases, and the accepted shapes. This track renders them.                                  |
| b   | Worktree              | T0 creates `/home/daniebo/Desktop/forge-worktrees/sprouts-cast-art` on branch `chibi-sprouts-cast-art`, cut from `master`. Every build and every output goes there. The main checkout's `out/` stays untouched.                                                                                                                                                          | The cast builds exist only in the `sprouts-cast` worktree. A new worktree gives a clean, isolated tree for the ten deliverables.       |
| c   | Baseline rebuild      | T0 rebuilds each asset with `./forge build <name> --fast`, then the flat level render, then the lit level render. The GLB SHA-256 must equal the cast record value. The stable stats projection must equal the cast record value.                                                                                                                                        | The accepted shape is the input. A hash mismatch means a different build, and no deliverable is accepted from a different build.       |
| d   | Cut-out route         | `./forge cutout <name> --out out/chibi-sprouts/redesign/cutout --views front --ppm 900 --canvas 1024x1500`. One folder keeps one scale and one canvas, as Mom's track did.                                                                                                                                                                                               | Mom's delivery path and scale are the release 1 standard. One folder keeps the five figures at one scale.                              |
| e   | Cut-out gate          | The file exists at `out/chibi-sprouts/redesign/cutout/<name>/front.png`. It is 1024 x 1500. The figure is 900 px or taller. The corners are transparent, the outer 1 px ring is empty, the figure is one alpha component, and no alpha-0 pixel holds colour. `node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout` runs and its full output is recorded.     | These are Mom's checks (T13). The size and the alpha border are the delivery contract.                                                 |
| f   | The foot-row line     | The cut-out check ends `result fail` only through its foot-row line, and only for a named figure whose lowest point lies below the ground plane. The task records the `bounds.min[1]` value and the arithmetic in pixels. Any other failing line fails the task.                                                                                                         | The check allows 4 px. Lily's boot reaches -0.010 m, which is 9 px at 900 px per metre. The art is accepted; the line is a known flag. |
| g   | Sprite route          | `./forge sprites <name> --clip idle --cell`, then `./forge sprites <name>`. The files land in `out/<name>/sprites/`.                                                                                                                                                                                                                                                     | This is Mom's delivered pair (T14). `--cell` keeps the 128 px cell at one scale and one pivot.                                         |
| h   | Sprite gate           | The static set holds 128 x 128 frames and `preview.png`. Every frame's outer 1 px ring is empty. The animated `idle/` set holds 64 frames, `sheet.png`, `preview.png`, `idle.gif`, and `metrics.json`. `metrics.json` reports size 128 and clip idle. The face reads in `preview.png` when a role looks at it.                                                           | These are Mom's checks (T14). The face at 128 px is the point of the sprite.                                                           |
| i   | Judge route           | `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia. The route is not muse, not hy4, and not OpenAI. A missing route waits; the track does not substitute.                                                                                                                                                                                                    | This route judged Mom's Phase 9 pair and passed it. The PM rule names it.                                                              |
| j   | Judge input and score | One judge record per character. Its inputs are the character's cut-out `front.png`, its static `preview.png`, and the brief text. It scores the cut-out on identity and proportion, and the sprite on identity, proportion, and face reads. Every score is 7.5 or more. At most two rounds run. A second failure, a third round, or an absent route escalates to the PM. | This is Mom's Phase 9 record and pass line. One record binds both deliverables to one asset revision.                                  |
| k   | Verdict binding       | The record holds the asset commit, the base commit, the base SHA-256, the cut-out SHA-256, the sprite preview SHA-256, the `metrics.json` SHA-256, the route, the round, the scores, and the verdict. A change to any of them voids the record.                                                                                                                          | An unbound score proves nothing about the final bytes.                                                                                 |
| l   | No reshape            | The track changes no asset source. A score below 7.5 on an accepted shape is a PM gate, not a rework. A score below 7.5 on a delivery fault (a crop, a cell, a scale, a missing frame) returns to the same task.                                                                                                                                                         | The PM accepted the five shapes on 2026-11-27. A reshape needs the PM's word.                                                          |
| m   | Gates                 | Three phases. No Review A, no Review B, and no Review C. No adversarial round, because no script and no test changes. No UX review. The look judge is the look gate. The project gate is `PROJECT_TESTS` with the TD-40 exclusion, `PROJECT_LINT`, `PROJECT_CHECKS`, and `./measure/doctor.sh`.                                                                          | The PM rule of 2026-11-25 asks for the lightest gates. Two scripts do not change, so the adversarial round has nothing to attack.      |
| n   | Closeout              | `metadata.json` holds `"lane": "light"`. The Phase 3 gate is the track acceptance record. The closeout runs after T9 and archives the track. No separate final-acceptance role runs.                                                                                                                                                                                     | A light-lane track closes on its phase gates and the PM word.                                                                          |
| o   | Commits               | Stage by explicit path only. Never stage `measure/generated/asset-inventory.json`. Another session shares the git index.                                                                                                                                                                                                                                                 | Shared staged files entered unrelated commits before (2026-11-25).                                                                     |

## Deliverables and paths

| Character | Cut-out                                                          | Sprites                           |
| --------- | ---------------------------------------------------------------- | --------------------------------- |
| Dad       | `out/chibi-sprouts/redesign/cutout/sprout-dad-kim/front.png`     | `out/sprout-dad-kim/sprites/`     |
| Grandma   | `out/chibi-sprouts/redesign/cutout/sprout-grandma-kim/front.png` | `out/sprout-grandma-kim/sprites/` |
| Grandpa   | `out/chibi-sprouts/redesign/cutout/sprout-grandpa-kim/front.png` | `out/sprout-grandpa-kim/sprites/` |
| Tom       | `out/chibi-sprouts/redesign/cutout/sprout-tom-kim/front.png`     | `out/sprout-tom-kim/sprites/`     |
| Lily      | `out/chibi-sprouts/redesign/cutout/sprout-lily-kim/front.png`    | `out/sprout-lily-kim/sprites/`    |

Every path is relative to the worktree root `/home/daniebo/Desktop/forge-worktrees/sprouts-cast-art`.
No deliverable goes to the main checkout.

## The worktree and the baseline

T0 creates the worktree and rebuilds the five assets. The expected GLB hashes are the cast record
values:

| Asset                | GLB SHA-256                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `sprout-dad-kim`     | `896d889b3e2db721a647b371b97f714e0e6a2151787ad9c4bd5b21b19d1fea61` |
| `sprout-grandma-kim` | `95d1de0b85c4cdb3ce45b2447f05a6d7dc59054d2febb4ace40813452fc1524b` |
| `sprout-grandpa-kim` | `9994ff971eb5af19b17ac4f464e29e71b3dbe0eee4699024a0b05b75ae6d7a50` |
| `sprout-tom-kim`     | `3958d9e788f194825a068ebbe69470760f34a82a452d9e95b3476495c79ac000` |
| `sprout-lily-kim`    | `fbe2232826445103c59a04b8f9bcf7b34a84780123a827bd83dd25b26b48265d` |

The stable stats projection removes every `milliseconds` key at any depth and keeps `texture.size`
only. Its canonical JSON hash with sorted keys must equal the cast record:

| Asset                | Projection SHA-256                                                 |
| -------------------- | ------------------------------------------------------------------ |
| `sprout-dad-kim`     | `19eba13496778ff03d57cb92c4ccf0592f0888175fec7e351de123fe25756494` |
| `sprout-grandma-kim` | `0edfe64317b2b1ae4e940677ddab17c2b0a514e3d082e05d0ee752ee63634b67` |
| `sprout-grandpa-kim` | `c80900021f99fb872a2944f39ffba836287be65912c1716d48d06720e22f79bc` |
| `sprout-tom-kim`     | `9776ad8174f88f91b7292db2afcb80871ff2afcbda7c3f0f743858b2dcd46e83` |
| `sprout-lily-kim`    | `613ca8417caa5023f229ccc271c5798bbc97fe9ca464b2c2fde540d12d5658aa` |

The raw `stats.json` SHA-256 is recorded for traceability only. No gate compares its bytes.

## The cut-out contract

1. The command is the one of decision (d). It is a textured command, so it takes a build slot.
2. The manifest `out/chibi-sprouts/redesign/cutout/manifest.json` keeps ppm 900, canvas 1024 x 1500,
   and one `files` entry per asset. A second asset with different options exits 1; the task records
   the line and stops.
3. The figure is measured from the alpha channel: the bounding box of alpha above 0. A figure is
   900 px or taller.
4. `scripts/cutout-check.mjs` runs on the whole folder. It prints one line per PNG. The accepted
   lines and the foot-row exception are decision (f).
5. The recorded facts are the path, the file size, the figure height in pixels, the check line, the
   manifest values, and the judge score.

## The sprite contract

1. `./forge sprites <name> --clip idle --cell` writes `out/<name>/sprites/idle/`: 64 frame PNGs
   (8 directions x 8 frames), `sheet.png`, `preview.png`, `idle.gif`, and `metrics.json`. The cell
   is 128 px because `--cell` keeps the static cell size.
2. `./forge sprites <name>` writes the static 128 px set and its `preview.png` at
   `out/<name>/sprites/`.
3. The scratch verifier `/tmp/opencode/verify-sprouts-art.mjs` checks every frame: 128 x 128, the
   outer 1 px ring empty, one alpha component per frame. It reads `metrics.json` and records the
   size, the clip, the frame count, and the direction count.
4. The judge reads `out/<name>/sprites/preview.png`. The face must read: eyes, brows, mouth.
5. The recorded facts are the folder path, the cell size, the frame and direction counts, the
   verifier lines, the preview hash, and the judge score.

## The judge record

The judge writes `measure/runs/chibi_sprouts_cast_art_20261127/judge-<name>.json` with:

- `route`, `family`, `red_family`, `green_family`,
- `asset_path`, `asset_commit`,
- `base_path`, `base_commit`, `base_sha256`,
- `cutout_path`, `cutout_sha256`, `cutout_identity`, `cutout_proportion`, `cutout_comment`,
- `sprite_preview_path`, `sprite_preview_sha256`, `sprite_metrics_sha256`,
- `sprite_identity`, `sprite_proportion`, `sprite_face_reads`, `sprite_comment`,
- `round`, `verdict`, `pass_line`, `judged_at`.

The verdict is `pass` only when every score is 7.5 or more. The pass line is 7.5.

A verdict applies to one asset revision only. A change to the asset source, the base source, the
cut-out, the preview, or `metrics.json` voids it. The task re-checks the hashes and re-judges only
on a failing score or a changed input.

At most two rounds run per character. A second failure writes
`measure/runs/chibi_sprouts_cast_art_20261127/escalation-<name>.json` with both rounds and both
comments, and reports to the PM. No third family substitutes.

## The gate check of the judge inputs

Every phase gate re-reads the final inputs at its own HEAD and compares them with the record:

1. `git log -1 --format=%H -- assets/<name>.ts` equals `asset_commit`.
2. `git log -1 --format=%H -- assets/parts/<base>.ts` equals `base_commit`, and the base file's
   SHA-256 equals `base_sha256`.
3. The cut-out SHA-256 equals `cutout_sha256`.
4. The sprite `preview.png` SHA-256 equals `sprite_preview_sha256`, and `metrics.json` equals
   `sprite_metrics_sha256`.
5. The figure height is still 900 px or more, and the cell is still 128 px.
6. The delivery files still exist at the decision (a) paths, and no file sits outside the worktree
   `out/` tree.

Any mismatch voids the verdict, and the gate fails with `judge input <field> changed`.

## Gates

| Phase | Gate                                                                                                                                                                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | T0 records the five GLB hashes and the five projections equal to the cast record. Dad, Grandma and Grandpa each hold a cut-out of 900 px or more, a 128 px idle set, a clean alpha border, a passing look judge record, and verified judge inputs.                                       |
| 2     | Tom and Lily have the same two deliverables and the same checks, with the shared child base verified at the gate HEAD.                                                                                                                                                                   |
| 3     | All five records re-verify. `PROJECT_TESTS` with the TD-40 exclusion exits 0, `PROJECT_LINT` exits 0, `PROJECT_CHECKS` exits 0, `./measure/generate.sh` exits 0, and `./measure/doctor.sh` exits 0. The PM handoff holds the ten files, their sizes, their hashes, and the five records. |

## Scope

- Five cut-outs and five sprite sets, generated by existing commands.
- Five delivery records, five judge records, and one handoff note.
- One worktree, one branch, and one registry row.

## Exclusions

- No change to an asset source, a base source, a script, a test, a fixture, or a preset.
- No reshape of an accepted character.
- No `./forge all`.
- No walk clip and no gesture clip.
- No panel, no cast sheet, and no song scene.
- No game file, no monorepo file, and no delivery folder.
- No paid generation call, and no customer-facing text.
- No production `out/` path outside the worktree.

## Acceptance criteria

### AC1: the worktree and the baseline

1. The worktree exists at the decision (b) path on branch `chibi-sprouts-cast-art`.
2. The five `--fast` GLB hashes equal the cast record values.
3. The five stable stats projections equal the cast record values.
4. The raw `stats.json` hashes are recorded for traceability only.

### AC2: the five cut-outs

1. Each cut-out file exists at the decision (a) path.
2. Each cut-out is 1024 x 1500, and its figure is 900 px or taller.
3. The corners are transparent, the outer 1 px ring is empty, the figure is one alpha component, and
   no alpha-0 pixel holds colour.
4. The `cutout-check` output is recorded. The only accepted failing line is the foot-row line of
   decision (f), with the arithmetic recorded.
5. The manifest holds one scale and one canvas.

### AC3: the five sprite sets

1. Each static set holds 128 x 128 frames and `preview.png`.
2. Each animated `idle/` set holds 64 frames, `sheet.png`, `preview.png`, `idle.gif`, and
   `metrics.json`.
3. Every frame's outer 1 px ring is empty, and `metrics.json` reports size 128 and clip idle.
4. The face reads in each `preview.png`.

### AC4: the look judge

1. Each character has one judge record with every field of "The judge record".
2. Every score is 7.5 or more, and the verdict is `pass`.
3. The route is the decision (i) route. Its family is not muse, hy4, or OpenAI.
4. The round count follows "The judge record".
5. Each phase gate verifies every judge input of "The gate check of the judge inputs".

### AC5: the gates and the record

1. Three phases, and each phase records its gate result in the plan.
2. No Review A, B, or C, and no adversarial round.
3. `PROJECT_TESTS` with the TD-40 exclusion, `PROJECT_LINT`, and `PROJECT_CHECKS` exit 0 at the
   Phase 3 gate.
4. `./measure/generate.sh` and `./measure/doctor.sh` exit 0 at the Phase 3 gate, or the plan names
   each failing line and its owner.
5. Every commit stages explicit paths only.
6. T9 is a human-gated task. The PM owns the answer.

### AC6: no customer-facing claim

1. The track writes no page, post, deck, video script, email, or sales text.
2. The ten files stay in the worktree and the PM handoff. The only exception is the approved judge
   upload of one cut-out, one sprite preview, and the brief text per call.
3. The plan and the handoff say that no customer-facing claim is made.

## Known limits

- The judge is one opinion. A 7.5 does not prove the look to Daniel.
- The cut-out check allows 4 px at the foot row. A figure whose lowest point is more than 4 px below
  the ground plane reports its foot-row line at 900 px per metre. Lily's boot is the clear case.
- The cut-out check walks every PNG in the folder, so one figure's failing line is printed in the
  same run as the four passing figures. The task reads line by line.
- The sprite is a still set. An animation stays unjudged.
- `stats.json` holds elapsed milliseconds. Only its stable projection is compared.
- A textured command replaces the GLB and `stats.json` of its asset. The delivered GLB after the
  cut-out and the sprites is a textured build, so it is not the `--fast` baseline hash.
- The five builds exist only in the cast worktree. T0 is the only route to a matching build.
- The shared child base is a judge input for Tom and Lily. A base change voids both records.
- The two children are shorter than the adults, so their cut-outs are shorter in pixels. Tom is
  1.090 m, which is 981 px at 900 px per metre.

## Sources

- [The cast track](../../archive/chibi_sprouts_cast_20261125/spec.md)
- [The cast plan](../../archive/chibi_sprouts_cast_20261125/plan.md)
- [The redesign plan, Phase 9](../../archive/chibi_sprouts_redesign_20261123/plan.md)
- [The redesign spec](../../archive/chibi_sprouts_redesign_20261123/spec.md)
- [Mom's Phase 9 judge record](../../runs/chibi_sprouts_redesign_20261123/judge-p9-bf4158a.json)
- [The cut-out command](../../../src/cli/forge.ts)
- [The cut-out check](../../../scripts/cutout-check.mjs)
- [The queue](../../../QUEUE.md)
