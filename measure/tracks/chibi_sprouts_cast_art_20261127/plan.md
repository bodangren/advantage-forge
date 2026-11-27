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

## PM decisions of 2026-11-27 (owner PM)

| #   | Decision        | Rule                                                                                                                                                                                                                                        |
| --- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Foot-row line   | The cut-out check allows 4 px at the foot row. Dad and Grandpa (6 px) and Lily (9 px) exceed it. The task accepts that one check line for them, records the arithmetic and `bounds.min[1]`, and keeps one 900 ppm folder (spec decision f). |
| 2   | Sprite verifier | The sprite verifier stays a scratch file under `/tmp/opencode`, as Mom's track did. Each task record names its path.                                                                                                                        |

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

## Phase 1: The worktree and the three adults [checkpoint: 1fe69b50]

- [x] T0 Measure: Create the worktree and prove the five baseline builds.
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
  - Result (2026-11-27, owner PM): done. Worktree `/home/daniebo/Desktop/forge-worktrees/sprouts-cast-art`
    on branch `chibi-sprouts-cast-art`, base commit `b69f46a4e63404e695b875c32460df915b1010a6`,
    node `v24.19.0`. `git worktree add` exited 0 and `node_modules` links to the main checkout's
    `node_modules`. All fifteen commands exited 0 in the final pass. Each command ran through the
    heavy runner with `HEAVY_MIN_AVAIL_MB=1500`.
  - Result: the five GLB SHA-256 sums equal the cast record. Dad
    `896d889b3e2db721a647b371b97f714e0e6a2151787ad9c4bd5b21b19d1fea61`; Grandma
    `95d1de0b85c4cdb3ce45b2447f05a6d7dc59054d2febb4ace40813452fc1524b`; Grandpa
    `9994ff971eb5af19b17ac4f464e29e71b3dbe0eee4699024a0b05b75ae6d7a50`; Tom
    `3958d9e788f194825a068ebbe69470760f34a82a452d9e95b3476495c79ac000`; Lily
    `fbe2232826445103c59a04b8f9bcf7b34a84780123a827bd83dd25b26b48265d`.
  - Result: the five stable stats projections equal the cast record. Dad
    `19eba13496778ff03d57cb92c4ccf0592f0888175fec7e351de123fe25756494`; Grandma
    `0edfe64317b2b1ae4e940677ddab17c2b0a514e3d082e05d0ee752ee63634b67`; Grandpa
    `c80900021f99fb872a2944f39ffba836287be65912c1716d48d06720e22f79bc`; Tom
    `9776ad8174f88f91b7292db2afcb80871ff2afcbda7c3f0f743858b2dcd46e83`; Lily
    `613ca8417caa5023f229ccc271c5798bbc97fe9ca464b2c2fde540d12d5658aa`. The projection script is
    `/tmp/opencode/stable-stats-projection.mjs`.
  - Result: the raw `stats.json` hashes, for traceability only, are Dad
    `bd1c4738a72f1e9be308caf7d90c0546ef7b43fe57be2138526e28817beb5c09`; Grandma
    `f3d65994a21f4216a75776e290942ac364ba3b332305f3e299cf3a0aaf809cff`; Grandpa
    `29e88905acaa6cb1121f92880f6688bbbe1acb9ab485fc4e68219bb3a6527a41`; Tom
    `f43dbbde78725993d7488c0d7e27219865e4b069aa47b5a73c5daee3c98d04ab`; Lily
    `ccee3306dd03da192d77eb4356bbaf1d97d0d5050bed74b8215801a8bdb79aea`.
  - Result: the build and bounds lines are Dad 51,623 triangles, `1.547` m; Grandma 50,430 triangles,
    `1.588` m; Grandpa 50,427 triangles, `1.507` m; Tom 41,529 triangles, `1.090` m; Lily 51,352
    triangles, `1.067` m. The `bounds.min[1]` values are Dad `-0.007`, Grandma `-0.005`, Grandpa
    `-0.007`, Tom `-0.002` and Lily `-0.010` m.
  - Result: `measure/runs/chibi_sprouts_cast_art_20261127/t0-baseline.json` holds the facts and
    `t0-log.txt` holds the command lines and key output lines.
  - Result: the first pass gave four non-zero exits and three empty logs. The stdout write to the log
    under `/tmp/opencode` failed with `errno -122 EDQUOT`, because `/tmp` is a tmpfs mounted with
    usrquota. The asset output in the worktree was written. Grandma, Grandpa and Tom were rebuilt and
    re-rendered with logs in the worktree `out/t0-logs/`; every command exited 0 and no hash changed.
  - Result: the worktree holds only this plan, the run record and the run log outside the new `out/`
    tree. The main checkout's track file is unchanged, and no file was written to the main checkout's
    `out/` or the cast worktree's `out/`.

- [x] T1 Measure: Dad, the cut-out and the idle sprite.
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
  - Result (2026-11-27, production role): the production part is done. This role is
    `opencode-go/deepseek-v4.1-flash`, family deepseek. The judge is a separate role and did not run
    here; the judge input is `/tmp/opencode/judge-cast-art-dad-brief.md`. All six commands exited 0
    except `cutout-check`, which exits 1 on the foot-row line only (PM decision 1). Every textured
    command ran through `HEAVY_MIN_AVAIL_MB=1500 bash
    /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`. Logs are in
    `out/t1-logs/` in the worktree, because `/tmp` gave EDQUOT at T0.
  - Result: the commands in order, through the heavy runner. `./forge cutout sprout-dad-kim --out
    out/chibi-sprouts/redesign/cutout --views front --ppm 900 --canvas 1024x1500` exited 0 and
    wrote the cut-out and the manifest (ppm 900, canvas 1024 x 1500, elevation 0, footPoint 512,
    1484). `./forge sprites sprout-dad-kim --clip idle --cell` exited 0. `./forge sprites
    sprout-dad-kim` exited 0. The build line is 51,623 triangles, `0.421 x 1.547 x 0.315` m. The
    asset sets `texture: false`, so the build line reads `texture none (vertex colors)` and the
    delivered GLB keeps the T0 `--fast` hash.
  - Result: cut-out `out/chibi-sprouts/redesign/cutout/sprout-dad-kim/front.png` is 429,873 bytes,
    1024 x 1500, figure rows 88..1490, height 1403 px, SHA-256
    `3522ad0916cdc44e6b59a4117cef5f03d672333f31ddfe4213d7db3b68877843`.
  - Result: `node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout` exited 1 and printed
    `FAIL sprout-dad-kim/front.png  1024x1500 soft 5048 edge 4679 worstDrop 93% rows 88..1490 cols
    322..701  lowest opaque row 1490, foot row 1484` then `result fail`. The only problem is the
    foot-row line, so decision (f) and PM decision 1 apply. Arithmetic: `bounds.min[1]` is `-0.007`
    m; 0.007 x 900 = 6.3 px; lowest opaque row 1490 - foot row 1484 = 6 px; the check allows 4 px.
  - Result: `node /tmp/opencode/verify-cutout.mjs <cut-out>` exited 0: size 1024 x 1500, outer 1 px
    ring 0 opaque pixels, 0 alpha-0 pixels holding colour, 1 alpha component, figure rows 88..1490.
    The corners are transparent. This script did not exist at T0; it is new, scratch, under
    `/tmp/opencode`, and not in git.
  - Result: the sprite static set `out/sprout-dad-kim/sprites/` holds 8 direction frames
    (E, N, NE, NW, S, SE, SW, W) at 128 x 128, `preview.png` (151,733 bytes, SHA-256
    `2e8919c7080d1b2b46108fca63393b4ed3c408ee230b496f12f713f220735748`), `sheet.png` and
    `metrics.json`. The animated set `sprites/idle/` holds 64 frames (8 directions x 8 frames),
    `sheet.png` (316,538 bytes), `preview.png` (357,611 bytes), `idle.gif` (295,575 bytes) and
    `metrics.json` (5,878 bytes, SHA-256
    `d9faf96eb7b05ffb52f9f3c2303a35b4b68a9c5b7561ad9224aae19b5dab9ee7`). `metrics.json` reports
    size 128, clip `idle`, frames 8, directions 8, pivot 64, 111.
  - Result: `/tmp/opencode/verify-sprouts-art.mjs` did not exist at T0. This role wrote it from the
    T14 practice and it checks the 128 x 128 static set, the empty outer ring of every frame, one
    alpha component per frame, the 64 frame idle set, `sheet.png`, `preview.png`, `idle.gif`, and
    the `metrics.json` size 128 and clip idle. It is scratch, under `/tmp/opencode`, and not in git.
    `node /tmp/opencode/verify-sprouts-art.mjs out/sprout-dad-kim/sprites sprout-dad-kim` exited 0
    with `static sprout-dad-kim: 8 frames`, `idle sprout-dad-kim: 64 frames`, `metrics
    sprout-dad-kim: size 128 clip "idle" directions 8 frames 8 pivot [64,111]` and `result ok`.
  - Result: the five hashes. Cut-out `3522ad0916cdc44e6b59a4117cef5f03d672333f31ddfe4213d7db3b68877843`;
    static `preview.png` `2e8919c7080d1b2b46108fca63393b4ed3c408ee230b496f12f713f220735748`; idle
    `metrics.json` `d9faf96eb7b05ffb52f9f3c2303a35b4b68a9c5b7561ad9224aae19b5dab9ee7`; delivered GLB
    `out/sprout-dad-kim/sprout-dad-kim.glb` 2,020,416 bytes,
    `896d889b3e2db721a647b371b97f714e0e6a2151787ad9c4bd5b21b19d1fea61`; base file
    `assets/parts/humanoid-kim.ts` `769a80a9b3f5c30ec2fb6a10691b022aafa4b840180f99b054fd39b41b45e268`.
    Asset commit `3cd8582a1cd6a5d0c5a154e84d87f2d7fb29de98`; base commit
    `41458a54a0282af2e062a1ed8a213f71856d7a40`.
  - Result: my look at the cut-out with `read`. One line: a standing boy-faced adult in a red plaid
    open shirt over a white tee, blue jeans and brown boots, dark hair cap, big eyes, thick brows and
    an open smile. Second line: the figure fills the canvas with clean edges; the hands are two thin
    hanging slabs of curled fingers, which the base provides and the brief tells the judge to
    ignore.
  - Result: my look at `sprites/preview.png` with `read`. One line: eight 3x cells show the same
    figure from S to SE, with the red plaid, white tee, blue jeans and brown boots in every cell.
    Second line: at 128 px the face still reads as two dark eyes under a black brow bar with a small
    light mouth, and the hair mass reads as a dark cap.
  - Note: no asset, base, script, test, or committed file changed. Nothing was written to the main
    checkout's `out/` or the cast worktree's `out/`. The judge record is not written by this role.
  - Result (2026-11-27, judge write): the judge record is
    `measure/runs/chibi_sprouts_cast_art_20261127/judge-sprout-dad-kim.json`. Route
    `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia, round 1, verdict `pass`, pass
    line 7.5. Scores: cut-out identity 9, cut-out proportion 8, sprite identity 8.5, sprite
    proportion 8, sprite face reads 7.5. Faults: the sprite face details are small and barely
    legible at 128 px; the cut-out face is stylized differently from the drawing (rectangular brows,
    wide flat face); the hair is blocky and flat compared with the drawing.
  - Result: the foot-row line is accepted for Dad under PM decision 1. `bounds.min[1]` is `-0.007` m.
    Arithmetic: 0.007 x 900 = 6.3 px; the lowest opaque row 1490 minus the foot row 1484 is 6 px; the
    check allows 4 px. No other line of his fails. The judge's hands note is the base slab and holds
    nothing.
  - Result: the judge inputs re-verified at the close. Cut-out
    `3522ad0916cdc44e6b59a4117cef5f03d672333f31ddfe4213d7db3b68877843`; static `preview.png`
    `2e8919c7080d1b2b46108fca63393b4ed3c408ee230b496f12f713f220735748`; idle `metrics.json`
    `d9faf96eb7b05ffb52f9f3c2303a35b4b68a9c5b7561ad9224aae19b5dab9ee7`; delivered GLB
    `896d889b3e2db721a647b371b97f714e0e6a2151787ad9c4bd5b21b19d1fea61`; base file
    `769a80a9b3f5c30ec2fb6a10691b022aafa4b840180f99b054fd39b41b45e268`. Asset commit
    `3cd8582a1cd6a5d0c5a154e84d87f2d7fb29de98` and base commit
    `41458a54a0282af2e062a1ed8a213f71856d7a40` each equal
    `git log -1 --format=%H -- <path>`. The figure is 1403 px and the cell is 128 px.
  - Closed by commit `9e0156320ee4812da74560935c01042a3509018b` (this plan, the three judge records).

- [x] T2 Measure: Grandma, the cut-out and the idle sprite.
  - Asset: `sprout-grandma-kim` on `assets/parts/humanoid-kim.ts`. Adult table. Her bun sits above
    the projected crown; the cut-out canvas must hold it.
  - The commands, checks, done-when, and record are those of T1, with `sprout-grandma-kim`.
  - Note: her lowest point is -0.005 m, which is 4 px at 900 px per metre. The foot-row line is
    expected to pass, as it did for Mom.
  - Result (2026-11-27, production role): the production part is done. This role is
    `opencode-go/deepseek-v4.1-flash`, family deepseek. The judge is a separate role and did not run
    here; the judge input is `/tmp/opencode/judge-cast-art-grandma-brief.md`. The three Forge
    commands and both verifiers exited 0. `cutout-check` exits 1 through Dad's foot-row line only;
    Grandma's own line is `ok`. Logs are in `out/t2-logs/`.
  - Result: the commands in order, through the heavy runner. `./forge cutout sprout-grandma-kim
    --out out/chibi-sprouts/redesign/cutout --views front --ppm 900 --canvas 1024x1500` exited 0.
    `./forge sprites sprout-grandma-kim --clip idle --cell` exited 0. `./forge sprites
    sprout-grandma-kim` exited 0. The build line is 50,430 triangles, `0.428 x 1.588 x 0.345` m,
    `texture none (vertex colors)`. The folder manifest still holds ppm 900, canvas 1024 x 1500,
    elevation 0, footPoint 512, 1484, and now two `files` entries.
  - Result: cut-out `out/chibi-sprouts/redesign/cutout/sprout-grandma-kim/front.png` is 348,842
    bytes, 1024 x 1500, figure rows 58..1488, height 1431 px, SHA-256
    `4766936fd96ef0168d1ec76ee37cee87dc4a50adc3bafa403f6947566832b1e9`. The figure height is
    measured from the alpha channel.
  - Result: `node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout` exited 1 and printed
    `ok   sprout-grandma-kim/front.png  1024x1500 soft 4644 edge 4182 worstDrop 51% rows 58..1488
    cols 318..705`, next to Dad's accepted foot-row line, then `result fail`. Grandma's line holds
    no problem. Her lowest row 1488 is 4 px below the foot row 1484, and the check allows 4 px, so
    decision (f) is not needed for her. Arithmetic: `bounds.min[1]` is `-0.005` m; 0.005 x 900 =
    4.5 px, which rounds to 4 px and passes.
  - Result: `node /tmp/opencode/verify-cutout.mjs <cut-out>` exited 0: size 1024 x 1500, outer 1 px
    ring 0 opaque pixels, 0 alpha-0 pixels holding colour, 1 alpha component, figure rows 58..1488.
    The bun sits inside the top edge with 58 rows clear above it, so the canvas holds it.
  - Result: the sprite static set `out/sprout-grandma-kim/sprites/` holds 8 direction frames at
    128 x 128, `preview.png` (150,506 bytes, SHA-256
    `b05fa258f1846d5d9da99bc608d731da43c276e9fa6e030c8f264c11b6f382b7`), `sheet.png` and
    `metrics.json`. The animated set `sprites/idle/` holds 64 frames (8 directions x 8 frames),
    `sheet.png` (280,937 bytes), `preview.png` (321,684 bytes), `idle.gif` (266,607 bytes) and
    `metrics.json` (5,863 bytes, SHA-256
    `b1f0f5d136ae07c7a3ca307d5a73c233470e5c52f32f29ffb1b6c521a9fcd8c9`). `metrics.json` reports
    size 128, clip `idle`, frames 8, directions 8, pivot 64, 111.
  - Result: `node /tmp/opencode/verify-sprouts-art.mjs out/sprout-grandma-kim/sprites
    sprout-grandma-kim` exited 0 with `static sprout-grandma-kim: 8 frames`, `idle
    sprout-grandma-kim: 64 frames`, `metrics sprout-grandma-kim: size 128 clip "idle" directions 8
    frames 8 pivot [64,111]` and `result ok`.
  - Result: the five hashes. Cut-out
    `4766936fd96ef0168d1ec76ee37cee87dc4a50adc3bafa403f6947566832b1e9`; static `preview.png`
    `b05fa258f1846d5d9da99bc608d731da43c276e9fa6e030c8f264c11b6f382b7`; idle `metrics.json`
    `b1f0f5d136ae07c7a3ca307d5a73c233470e5c52f32f29ffb1b6c521a9fcd8c9`; delivered GLB
    `out/sprout-grandma-kim/sprout-grandma-kim.glb`,
    `95d1de0b85c4cdb3ce45b2447f05a6d7dc59054d2febb4ace40813452fc1524b`; base file
    `assets/parts/humanoid-kim.ts` `769a80a9b3f5c30ec2fb6a10691b022aafa4b840180f99b054fd39b41b45e268`.
    Asset commit `3cd8582a1cd6a5d0c5a154e84d87f2d7fb29de98`; base commit
    `41458a54a0282af2e062a1ed8a213f71856d7a40`.
  - Result: my look at the cut-out with `read`. One line: an older woman in a sage-green buttoned
    jacket and a green knee-length skirt, white hair in a high bun, brown slip-on shoes, rounded
    cheeks with blush. Second line: the eyes, thin grey brows and a small closed mouth read at full
    size, the bun clears the top edge, and the hands are the base's two thin finger slabs.
  - Result: my look at `sprites/preview.png` with `read`. One line: eight 3x cells show the same
    figure with the white bun, green jacket and skirt and brown shoes in every direction.
    Second line: at 128 px the face reads on the S and SW cells as two dark eyes, a blush line and a
    small mouth, and the white bun reads as the highest shape.
  - Note: no asset, base, script, test, or committed file changed. Nothing was written to the main
    checkout's `out/` or the cast worktree's `out/`. The judge record is not written by this role.
  - Result (2026-11-27, judge write): the judge record is
    `measure/runs/chibi_sprouts_cast_art_20261127/judge-sprout-grandma-kim.json`. Route
    `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia, round 1, verdict `pass`, pass
    line 7.5. Scores: cut-out identity 9, cut-out proportion 8.5, sprite identity 9, sprite
    proportion 8.5, sprite face reads 8. Faults: the cut-out face is rounder and simpler than the
    drawing's expressive face; the cardigan knit texture is lost in the cut-out; the sprite face at
    128 px reads weakly.
  - Result: the foot-row line does not apply to Grandma. Her line was `ok` in the production pass,
    and her lowest row 1488 is 4 px below the foot row 1484, which the check allows.
  - Result: the judge inputs re-verified at the close. Cut-out
    `4766936fd96ef0168d1ec76ee37cee87dc4a50adc3bafa403f6947566832b1e9`; static `preview.png`
    `b05fa258f1846d5d9da99bc608d731da43c276e9fa6e030c8f264c11b6f382b7`; idle `metrics.json`
    `b1f0f5d136ae07c7a3ca307d5a73c233470e5c52f32f29ffb1b6c521a9fcd8c9`; delivered GLB
    `95d1de0b85c4cdb3ce45b2447f05a6d7dc59054d2febb4ace40813452fc1524b`; base file
    `769a80a9b3f5c30ec2fb6a10691b022aafa4b840180f99b054fd39b41b45e268`. Base commit
    `41458a54a0282af2e062a1ed8a213f71856d7a40` equals
    `git log -1 --format=%H -- assets/parts/humanoid-kim.ts`.
  - Result: the production line above names asset commit `3cd8582a...`. That value is Dad's commit
    and is wrong for Grandma. This line supersedes it:
    `git log -1 --format=%H -- assets/sprout-grandma-kim.ts` is
    `b73f7104e3461cc9dfa57a5f1e5ef67c615f525a`, the commit
    `feat(chibi_sprouts_cast): grandma look remediation round 3`. The judge record holds it.
  - Closed by commit `9e0156320ee4812da74560935c01042a3509018b` (this plan, the three judge records).

- [x] T3 Measure: Grandpa, the cut-out and the idle sprite.
  - Asset: `sprout-grandpa-kim` on `assets/parts/humanoid-kim.ts`. Adult table.
  - The commands, checks, done-when, and record are those of T1, with `sprout-grandpa-kim`.
  - Note: his lowest point is -0.007 m, which is 6 px at 900 px per metre. The foot-row line is
    expected, and decision (f) applies. The task records the arithmetic and the `bounds.min[1]`
    value.
  - Result (2026-11-27, production role): the production part is done. This role is
    `opencode-go/deepseek-v4.1-flash`, family deepseek. The judge is a separate role and did not run
    here; the judge input is `/tmp/opencode/judge-cast-art-grandpa-brief.md`. The three Forge
    commands and both verifiers exited 0. `cutout-check` exits 1 through Dad's and Grandpa's
    foot-row lines only; no other line fails. Logs are in `out/t3-logs/`.
  - Result: the commands in order, through the heavy runner. `./forge cutout sprout-grandpa-kim
    --out out/chibi-sprouts/redesign/cutout --views front --ppm 900 --canvas 1024x1500` exited 0.
    `./forge sprites sprout-grandpa-kim --clip idle --cell` exited 0. `./forge sprites
    sprout-grandpa-kim` exited 0. The build line is 50,427 triangles, `0.424 x 1.507 x 0.284` m,
    `texture none (vertex colors)`. The folder manifest still holds ppm 900, canvas 1024 x 1500,
    elevation 0, footPoint 512, 1484, and now three `files` entries.
  - Result: cut-out `out/chibi-sprouts/redesign/cutout/sprout-grandpa-kim/front.png` is 361,344
    bytes, 1024 x 1500, figure rows 129..1490, height 1362 px, SHA-256
    `fd2f8aa6bf1ff0df6eaa3f2930371c41df006e0711c74adba07c4ed3cfc309d2`.
  - Result: `node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout` exited 1 and printed
    `FAIL sprout-grandpa-kim/front.png  1024x1500 soft 4931 edge 4532 worstDrop 60% rows 129..1490
    cols 320..702  lowest opaque row 1490, foot row 1484`, next to Dad's accepted line and Grandma's
    `ok` line, then `result fail`. The only problem on Grandpa's line is the foot row, so decision
    (f) and PM decision 1 apply. Arithmetic: `bounds.min[1]` is `-0.007` m; 0.007 x 900 = 6.3 px;
    lowest opaque row 1490 - foot row 1484 = 6 px; the check allows 4 px. No other figure's line
    fails except Dad's accepted line.
  - Result: `node /tmp/opencode/verify-cutout.mjs <cut-out>` exited 0: size 1024 x 1500, outer 1 px
    ring 0 opaque pixels, 0 alpha-0 pixels holding colour, 1 alpha component, figure rows 129..1490.
    The corners are transparent.
  - Result: the sprite static set `out/sprout-grandpa-kim/sprites/` holds 8 direction frames at
    128 x 128, `preview.png` (151,255 bytes, SHA-256
    `cd45fc628286f4b619ed52f64b78ba06b9f03603ddaaab3cd49e8d55dfbdf9e4`), `sheet.png` and
    `metrics.json`. The animated set `sprites/idle/` holds 64 frames (8 directions x 8 frames),
    `sheet.png` (284,594 bytes), `preview.png` (324,507 bytes), `idle.gif` (267,458 bytes) and
    `metrics.json` (5,878 bytes, SHA-256
    `c7836a21c277cda3a026a3a1374b2fff063455a74b9ef90d47dc75970f3df08f`). `metrics.json` reports
    size 128, clip `idle`, frames 8, directions 8, pivot 64, 111.
  - Result: `node /tmp/opencode/verify-sprouts-art.mjs out/sprout-grandpa-kim/sprites
    sprout-grandpa-kim` exited 0 with `static sprout-grandpa-kim: 8 frames`, `idle
    sprout-grandpa-kim: 64 frames`, `metrics sprout-grandpa-kim: size 128 clip "idle" directions 8
    frames 8 pivot [64,111]` and `result ok`.
  - Result: the five hashes. Cut-out
    `fd2f8aa6bf1ff0df6eaa3f2930371c41df006e0711c74adba07c4ed3cfc309d2`; static `preview.png`
    `cd45fc628286f4b619ed52f64b78ba06b9f03603ddaaab3cd49e8d55dfbdf9e4`; idle `metrics.json`
    `c7836a21c277cda3a026a3a1374b2fff063455a74b9ef90d47dc75970f3df08f`; delivered GLB
    `out/sprout-grandpa-kim/sprout-grandpa-kim.glb`,
    `9994ff971eb5af19b17ac4f464e29e71b3dbe0eee4699024a0b05b75ae6d7a50`; base file
    `assets/parts/humanoid-kim.ts` `769a80a9b3f5c30ec2fb6a10691b022aafa4b840180f99b054fd39b41b45e268`.
    Asset commit `3cd8582a1cd6a5d0c5a154e84d87f2d7fb29de98`; base commit
    `41458a54a0282af2e062a1ed8a213f71856d7a40`.
  - Result: my look at the cut-out with `read`. One line: a bald older man with white hair at the
    sides, round dark glasses, white brows and a small white moustache, a green long-sleeve top over
    a pale collar, a brown thick belt and brown trousers with brown shoes. Second line: the glasses,
    brows, moustache and open mouth read at full size, the figure is whole with clean edges, and the
    hands are the base's two thin finger slabs.
  - Result: my look at `sprites/preview.png` with `read`. One line: eight 3x cells show the same
    figure from S to SE, with the bald head and white side hair, green top, brown belt and trousers,
    and brown shoes. Second line: at 128 px the glasses read as two dark rings around the eyes, the
    mouth reads as a red smile, and the white brow and moustache marks read on the S cell.
  - Note: no asset, base, script, test, or committed file changed. Nothing was written to the main
    checkout's `out/` or the cast worktree's `out/`. The judge record is not written by this role.
  - Result (2026-11-27, judge write): the judge record is
    `measure/runs/chibi_sprouts_cast_art_20261127/judge-sprout-grandpa-kim.json`. Route
    `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia, round 1, verdict `pass`, pass
    line 7.5. Scores: cut-out identity 9, cut-out proportion 8.5, sprite identity 9, sprite
    proportion 8.5, sprite face reads 8. Faults: the white side hair is a blocky bald cap with side
    blocks instead of fluffy tufts; the collar is a flat light-green rectangle instead of a V-neck
    collared shirt; the sprite face details are small at 128 px.
  - Result: the foot-row line is accepted for Grandpa under PM decision 1. `bounds.min[1]` is
    `-0.007` m. Arithmetic: 0.007 x 900 = 6.3 px; the lowest opaque row 1490 minus the foot row 1484
    is 6 px; the check allows 4 px. No other line of his fails.
  - Result: the judge inputs re-verified at the close. Cut-out
    `fd2f8aa6bf1ff0df6eaa3f2930371c41df006e0711c74adba07c4ed3cfc309d2`; static `preview.png`
    `cd45fc628286f4b619ed52f64b78ba06b9f03603ddaaab3cd49e8d55dfbdf9e4`; idle `metrics.json`
    `c7836a21c277cda3a026a3a1374b2fff063455a74b9ef90d47dc75970f3df08f`; delivered GLB
    `9994ff971eb5af19b17ac4f464e29e71b3dbe0eee4699024a0b05b75ae6d7a50`; base file
    `769a80a9b3f5c30ec2fb6a10691b022aafa4b840180f99b054fd39b41b45e268`. Base commit
    `41458a54a0282af2e062a1ed8a213f71856d7a40` equals
    `git log -1 --format=%H -- assets/parts/humanoid-kim.ts`.
  - Result: the production line above names asset commit `3cd8582a...`. That value is Dad's commit
    and is wrong for Grandpa. This line supersedes it:
    `git log -1 --format=%H -- assets/sprout-grandpa-kim.ts` is
    `78be77a2af409704e5d132018d4d4c30e6e85169`, the commit
    `feat(chibi_sprouts_cast): grandpa adult variant`. The judge record holds it.
  - Closed by commit `9e0156320ee4812da74560935c01042a3509018b` (this plan, the three judge records).

- [x] T4 Measure: The Phase 1 gate.
  - Done-when: the T0 baseline holds; the three cut-outs and the three sprite sets pass decision (e),
    decision (h), and decision (j); each judge input of spec "The gate check of the judge inputs" is
    verified at the gate HEAD; the three records hold no open blocking finding; the three records sit
    under `measure/runs/chibi_sprouts_cast_art_20261127/`; `./measure/generate.sh` exits 0.
  - Record: the phase base, the gate HEAD, the three verdicts, each verified input with its hash
    pair, the cut-out check lines, the sprite metrics lines, and the phase diff.
  - Note: no panel, no sheet, and no source change. A failing line returns the named character to its
    task.
  - Result (2026-11-27, orchestrator): phase acceptance PASS at gate HEAD
    `291f54e8fe627d032c1c03f8e00e0f6ea34b9c0f`. The role record is
    `measure/runs/chibi_sprouts_cast_art_20261127/phase-acceptance-p1-291f54e8.json` with status
    `pass`, no blocking finding, `confidence` `high`, and `retry_recommendation` `none`.
  - Result: the phase base is `b69f46a4e63404e695b875c32460df915b1010a6`. The phase diff holds six
    commits and seven paths: this plan, `measure/generated/status.md`, the three judge records, the
    T0 JSON and the T0 log. It holds no source, script, test, filter, or registry change.
  - Result: the three verdicts are `pass`: Dad 9/8/8.5/8/7.5, Grandma 9/8.5/9/8.5/8, Grandpa
    9/8.5/9/8.5/8. Every score is 7.5 or more. The cut-out hashes, sprite preview hashes,
    `metrics.json` hashes, asset commits, base commit `41458a54a0282af2e062a1ed8a213f71856d7a40`,
    and base file hash `769a80a9b3f5c30ec2fb6a10691b022aafa4b840180f99b054fd39b41b45e268` all equal
    their record values at the gate HEAD. The three cut-outs are 1024 x 1500 and 1403, 1431 and
    1362 px tall. The three sprite sets hold 8 static frames and 64 idle frames, 128 x 128, and
    `metrics.json` reports size 128 and clip `idle`.
  - Result: the two nonblocking findings of the role record, copied:
    - F1 [Nit] phase-acceptance: Prettier fails on the current plan, but the plan at the phase base
      passes. T8 owns the formatting gate. Do not record this as a pre-existing failure at phase
      creation.
    - F2 [Nit] phase-acceptance: The judge records omit `audited_head_sha`, which section 1 of the
      strategy names. Each record has every spec field and its input hashes and commits match the
      current HEAD. Record the judge HEAD in subsequent records.
  - Result: the foot-row line is accepted for Dad and Grandpa under PM decision 1. `bounds.min[1]` is
    `-0.007` m for both. Arithmetic: 0.007 x 900 = 6.3 px; the lowest opaque row 1490 minus the foot
    row 1484 is 6 px; the check allows 4 px. Grandma's line is `ok` at 4 px. No other figure's line
    fails. The two failing lines are `FAIL sprout-dad-kim/front.png ... lowest opaque row 1490, foot
    row 1484` and `FAIL sprout-grandpa-kim/front.png ... lowest opaque row 1490, foot row 1484`.
  - Result: `./measure/generate.sh` exits 0 at the gate and writes four Measure facts.
    `./measure/doctor.sh` exits 1 on one archived broken link only,
    `out/storytime-review/muse-cast/teacher-kim-sheet.png`, which T8 owns.
  - Note: no panel, no sheet, no source change, and no file outside the track record changed.

## Phase 2: The two children

- [~] T5 Measure: Tom, the cut-out and the idle sprite.
  - Asset: `sprout-tom-kim` on `assets/parts/humanoid-kim-child.ts`. Child table.
  - The commands, checks, done-when, and record are those of T1, with `sprout-tom-kim`.
  - Note: his height is 1.090 m, which is 981 px at 900 px per metre. His lowest point is -0.002 m,
    which is 2 px. The foot-row line is expected to pass.
  - Note: the shared child base is a judge input. The record holds its commit and its SHA-256.
  - Result (2026-11-27, production role): the production part is done. This role is
    `opencode-go/deepseek-v4.1-flash`, family deepseek. The judge is a separate role and did not run
    here; the judge input is `/tmp/opencode/judge-cast-art-tom-brief.md`. The three Forge commands
    and both verifiers exited 0. `cutout-check` exits 1 through Dad's and Grandpa's accepted
    foot-row lines only; Tom's own line is `ok`. Logs are in `out/t5-logs/`. Every textured command
    ran through `HEAVY_MIN_AVAIL_MB=1500 bash
    /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  - Result: the commands in order. `./forge cutout sprout-tom-kim --out
    out/chibi-sprouts/redesign/cutout --views front --ppm 900 --canvas 1024x1500` exited 0.
    `./forge sprites sprout-tom-kim --clip idle --cell` exited 0. `./forge sprites sprout-tom-kim`
    exited 1 with 75 on the first try (`heavy-run: load hold`), and exited 0 on the retry.
    `node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout` exited 1 through Dad and
    Grandpa only. The build line is 41,529 triangles, `0.366 x 1.090 x 0.294` m, `texture none
    (vertex colors)`. The folder manifest still holds ppm 900, canvas 1024 x 1500, elevation 0,
    footPoint 512, 1484, and now four `files` entries.
  - Result: cut-out `out/chibi-sprouts/redesign/cutout/sprout-tom-kim/front.png` is 240,606 bytes,
    1024 x 1500, figure rows 505..1485, height 981 px, SHA-256
    `3a85981754212fb3a2d2b5e142bfeec6a8f98c1d41757f5e7bdbc141918338fd`. The figure height is
    measured from the alpha channel and equals the T5 note value.
  - Result: `node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout` printed
    `ok   sprout-tom-kim/front.png  1024x1500 soft 3861 edge 3438 worstDrop 55% rows 505..1485 cols
    348..677`, next to Dad's and Grandpa's accepted lines and Grandma's `ok` line, then `result
    fail`. Tom's lowest opaque row 1485 is 1 px below the foot row 1484, which the check allows.
    Arithmetic: `bounds.min[1]` is `-0.002` m; 0.002 x 900 = 1.8 px. Decision (f) is not needed for
    him.
  - Result: `node /tmp/opencode/verify-cutout.mjs <cut-out>` exited 0: size 1024 x 1500, outer 1 px
    ring 0 opaque pixels, 0 alpha-0 pixels holding colour, 1 alpha component, figure rows
    505..1485.
  - Result: the sprite static set `out/sprout-tom-kim/sprites/` holds 8 direction frames (E, N, NE,
    NW, S, SE, SW, W) at 128 x 128, `sheet.png` (52,468 bytes), `preview.png` (154,230 bytes,
    SHA-256 `4bad3b3e82b8bb4472911401f9cebca5e6c669c3d989dbb865b92366a16a7772`) and
    `metrics.json`. The occupied boxes are S 37x100, SW 33x100, W 30x98, NW 34x97, N 37x93,
    NE 33x100, E 30x101, SE 34x102. The animated set `sprites/idle/` holds 64 frames (8 directions
    x 8 frames), `sheet.png` (327,599 bytes), `preview.png` (368,775 bytes), `idle.gif` (268,819
    bytes) and `metrics.json` (5,838 bytes, SHA-256
    `e798827504c2608f496844fe2eacd27c2df0b91ccb4bfb2aeb80b50fe8a6088f`). `metrics.json` reports
    size 128, clip `idle`, frames 8, directions 8, pivot 64, 109.
  - Result: `node /tmp/opencode/verify-sprouts-art.mjs out/sprout-tom-kim/sprites sprout-tom-kim`
    exited 0 with `static sprout-tom-kim: 8 frames`, `idle sprout-tom-kim: 64 frames`, `metrics
    sprout-tom-kim: size 128 clip "idle" directions 8 frames 8 pivot [64,109]` and `result ok`.
  - Result: the five hashes. Cut-out
    `3a85981754212fb3a2d2b5e142bfeec6a8f98c1d41757f5e7bdbc141918338fd`; static `preview.png`
    `4bad3b3e82b8bb4472911401f9cebca5e6c669c3d989dbb865b92366a16a7772`; idle `metrics.json`
    `e798827504c2608f496844fe2eacd27c2df0b91ccb4bfb2aeb80b50fe8a6088f`; delivered GLB
    `out/sprout-tom-kim/sprout-tom-kim.glb` 1,615,652 bytes,
    `3958d9e788f194825a068ebbe69470760f34a82a452d9e95b3476495c79ac000`, which equals the T0
    value because the asset sets `texture: false`; base file `assets/parts/humanoid-kim-child.ts`
    `415e0a9b920b656880363e1a49693ec7e627c8242c5e449d3873e97c96d3a905`. Asset commit
    `58c66c25e8020c5bd948cc3a67c6a975d9cd74d0`; base commit
    `1e1d3ab7a13445f9c58f129521c03a400310ea4c`. Both equal `git log -1 --format=%H -- <path>`.
  - Result: my look at the cut-out with `read`. One line: a small boy with a big brown tousled bowl
    of hair and spiky tufts, round brown eyes with white highlights, thick brows, pink blush,
    freckles and an open smile, in a blue-and-orange striped tee, green shorts, white socks and grey
    sneakers. Second line: the figure is whole with clean transparent edges and stands high on the
    canvas, and the hands are the base's two thin finger slabs.
  - Result: my look at `sprites/preview.png` with `read`. One line: eight 3x cells show the same boy
    from S to SE, with the brown hair, the blue-and-orange striped tee, the green shorts, the white
    socks and the grey sneakers in every direction. Second line: at 128 px the eyes, the brow bar
    and the mouth read in the S and SE cells, and the hair reads as a rounded brown cap with a small
    top tuft.
  - Note: no asset, base, script, test, or committed file changed. Nothing was written to the main
    checkout's `out/`. The judge record is not written by this role.

- [~] T6 Measure: Lily, the cut-out and the idle sprite.
  - Asset: `sprout-lily-kim` on `assets/parts/humanoid-kim-child.ts`. Child table, hair slot.
  - The commands, checks, done-when, and record are those of T1, with `sprout-lily-kim`.
  - Note: her height is 1.067 m, which is 960 px at 900 px per metre. Her lowest point is -0.010 m,
    which is 9 px. The foot-row line is expected, and decision (f) applies. The task records the
    arithmetic, and every other check line must be `ok`.
  - Note: the bob must stay clear of the face at 128 px. The face reads in `preview.png` is the
    sprite score that protects it.
  - Result (2026-11-27, production role): the production part is done. This role is
    `opencode-go/deepseek-v4.1-flash`, family deepseek. The judge is a separate role and did not run
    here; the judge input is `/tmp/opencode/judge-cast-art-lily-brief.md`. The three Forge commands
    and both verifiers exited 0. `cutout-check` exits 1 through Dad's, Grandpa's and Lily's
    foot-row lines only; Lily's only failing line is the foot row. Logs are in `out/t6-logs/`.
    Every textured command ran through `HEAVY_MIN_AVAIL_MB=1500 bash
    /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  - Result: the commands in order. `./forge cutout sprout-lily-kim --out
    out/chibi-sprouts/redesign/cutout --views front --ppm 900 --canvas 1024x1500` exited 0.
    `./forge sprites sprout-lily-kim --clip idle --cell` exited 0. `./forge sprites sprout-lily-kim`
    exited 0. `node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout` exited 1 through the
    three foot-row lines. The build line is 51,352 triangles, `0.374 x 1.067 x 0.310` m, `texture
    none (vertex colors)`. The folder manifest still holds ppm 900, canvas 1024 x 1500, elevation
    0, footPoint 512, 1484, and now five `files` entries.
  - Result: cut-out `out/chibi-sprouts/redesign/cutout/sprout-lily-kim/front.png` is 266,438 bytes,
    1024 x 1500, figure rows 532..1492, height 961 px, SHA-256
    `7fdcea6f43b7426b1a6624b8aadaaa705cd5842c8bc7c1f332a37201fc7432ae`. The figure height is
    measured from the alpha channel and is 961 px against the 960 px note value.
  - Result: `node scripts/cutout-check.mjs out/chibi-sprouts/redesign/cutout` printed
    `FAIL sprout-lily-kim/front.png  1024x1500 soft 3761 edge 3327 worstDrop 65% rows 532..1492
    cols 343..679  lowest opaque row 1492, foot row 1484`, next to Dad's and Grandpa's accepted
    lines and Grandma's and Tom's `ok` lines, then `result fail`. Lily's only failing line is the
    foot row, so decision (f) and PM decision 1 apply. Arithmetic: `bounds.min[1]` is `-0.010` m;
    0.010 x 900 = 9 px; the lowest opaque row 1492 minus the foot row 1484 is 8 px; the check
    allows 4 px.
  - Result: `node /tmp/opencode/verify-cutout.mjs <cut-out>` exited 0: size 1024 x 1500, outer 1 px
    ring 0 opaque pixels, 0 alpha-0 pixels holding colour, 1 alpha component, figure rows
    532..1492.
  - Result: the sprite static set `out/sprout-lily-kim/sprites/` holds 8 direction frames (E, N, NE,
    NW, S, SE, SW, W) at 128 x 128, `sheet.png` (55,638 bytes), `preview.png` (160,104 bytes,
    SHA-256 `d3993845d7890a76879071a671541ef984faa668448a28572548a54b5bf99468`) and
    `metrics.json`. The occupied boxes are S 38x98, SW 34x100, W 32x99, NW 34x97, N 38x94,
    NE 34x97, E 32x98, SE 34x100. The animated set `sprites/idle/` holds 64 frames (8 directions x
    8 frames), `sheet.png` (320,289 bytes), `preview.png` (360,458 bytes), `idle.gif` (291,467
    bytes) and `metrics.json` (5,837 bytes, SHA-256
    `cabc6c64520f5917fc66e1aadab38d219d008a541f037a6891b4a92c155b7e7e`). `metrics.json` reports
    size 128, clip `idle`, frames 8, directions 8, pivot 64, 108.
  - Result: `node /tmp/opencode/verify-sprouts-art.mjs out/sprout-lily-kim/sprites sprout-lily-kim`
    exited 0 with `static sprout-lily-kim: 8 frames`, `idle sprout-lily-kim: 64 frames`, `metrics
    sprout-lily-kim: size 128 clip "idle" directions 8 frames 8 pivot [64,108]` and `result ok`.
  - Result: the five hashes. Cut-out
    `7fdcea6f43b7426b1a6624b8aadaaa705cd5842c8bc7c1f332a37201fc7432ae`; static `preview.png`
    `d3993845d7890a76879071a671541ef984faa668448a28572548a54b5bf99468`; idle `metrics.json`
    `cabc6c64520f5917fc66e1aadab38d219d008a541f037a6891b4a92c155b7e7e`; delivered GLB
    `out/sprout-lily-kim/sprout-lily-kim.glb` 1,945,784 bytes,
    `fbe2232826445103c59a04b8f9bcf7b34a84780123a827bd83dd25b26b48265d`, which equals the T0
    value because the asset sets `texture: false`; base file `assets/parts/humanoid-kim-child.ts`
    `415e0a9b920b656880363e1a49693ec7e627c8242c5e449d3873e97c96d3a905`. Asset commit
    `fc22048b17dd02d31169ff192071293ee571ab3e`; base commit
    `1e1d3ab7a13445f9c58f129521c03a400310ea4c`. Both equal `git log -1 --format=%H -- <path>`.
  - Result: my look at the cut-out with `read`. One line: a small girl with a big light-brown bob
    and a straight fringe over the brow, round brown eyes with white highlights, pink blush,
    freckles and an open red-lipped smile, in a blue short-sleeve top with a white collar, a red
    flared skirt, white knee socks and red-and-white shoes. Second line: the figure is whole with
    clean transparent edges, the bob clears the eyes at full size, and the hands are the base's two
    thin finger slabs.
  - Result: my look at `sprites/preview.png` with `read`. One line: eight 3x cells show the same
    girl from S to SE, with the light-brown bob, the blue top, the red skirt, the white socks and
    the red shoes in every direction. Second line: at 128 px the fringe sits close over the eyes,
    so the eyes, the small brow marks and the mouth read weakly in the S and SE cells; the bob
    reads as a clean helmet shape and never covers the mouth.
  - Note: no asset, base, script, test, or committed file changed. Nothing was written to the main
    checkout's `out/`. The judge record is not written by this role.

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

- [ ] T9 Measure: Record the PM's answer.
  - PM decision 2026-11-27 (owner PM): the PM accepts the delivery on the T8 record. The look judge
    pass at 7.5 or more accepts each character. When T8 passes with its recorded gates, this task
    closes `[x]` with the line `Evidence: PM accepted on the T8 gate record, 2026-11-27` and the T8
    sha, the commit that records the T8 gate. No handoff is sent and no role waits for the PM. The
    same rule applies to any future "Record the PM's answer" task.
  - The handoff names: the ten delivery files with their paths, sizes, and SHA-256 sums; the five
    judge records; the five scores; the cut-out check lines; the sprite metrics lines; the worktree
    and branch; and the fact that no customer-facing claim is made.
  - Done-when: T8 passes and its record holds every gate. This task then writes the evidence line
    and the T8 sha. `./measure/generate.sh` exits 0.
  - Record: the date, the evidence line, the T8 sha, and the five judge scores.
  - Note: the track makes no customer-facing claim, so no Daniel gate applies.
  - Note: a change list names each character and returns it to its task. A reshape request is a new
    track, because this track changes no source (decision l). The closeout follows this task.

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
