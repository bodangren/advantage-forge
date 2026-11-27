# Trial: Blender in the asset loop

Status: new (2026-11-27). The plan records the trial state. The PM task and these six tasks are the whole scope.

Lane: light. One phase. The PM card is Daniel's Google Task `Z2JLNEp4NEM4QnEwdzNXUQ` of 2026-11-27:
"We do not use blender now. That choice was made when we were developing in a very constrained system.
Maybe we should reconsider." The trial starts when a slot frees. The Chibi Sprouts cast art track closes first.
No review role and no gate run for this card.

Rules for this trial:

- Heavy renders and builds run only through `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`. Exit 75 means wait and retry.
- Routes: Go Hy4 flash free first, then MiniMax or Claude.
- No paid generation. No `openchamber_image` and no paid image API.
- The look judge: `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, or the judge of the Hy4 3D trial, `opencode-go/muse-spark-1.3-contributor#high` (that trial record, 2026-11-18). NVIDIA left the route table on 2026-11-16.
- Write nothing into a production `out/` path. The trial outputs live in a worktree or in this card's folder.

## Phase 1: The trial

- [ ] Task: T1. Install Blender headless (apt or the official tarball, no cost), install blender-mcp, and read github.com/arjun988/blender-skills (MIT, 94 skills). Record the versions and the install path.
  - Done when: `blender --background --version` prints a version, the versions and the install path are recorded, and one skill runs a headless export.
  - Evidence: pending.
- [ ] Task: T2. Pick 3 assets that the look judges faulted before (read the judge records under measure/runs and bench/ for the lowest-scored assets with a code-first source in assets/), and write one brief each.
  - Done when: the 3 assets are named, the judge record that faulted each one is named, and one brief exists for each asset.
  - Evidence: pending.
- [ ] Task: T3. Arm A: make the 3 assets from the brief with the current code-first pipeline (./forge, as in AGENTS.md). Record time, tokens, route, file sizes.
  - Done when: the 3 assets exist as code-first sources from the brief, and the time, tokens, route, and file sizes are recorded for each of them.
  - Evidence: pending.
- [ ] Task: T4. Arm B: the same 3 assets from the same brief: the current pipeline plus a Blender pass (retopology, UV unwrap, bake, rig check, GLB export) driven by the blender-skills. Record time, tokens, route, file sizes.
  - Done when: the same 3 assets exist with the Blender pass, and the time, tokens, route, and file sizes are recorded for each of them.
  - Evidence: pending.
- [ ] Task: T5. Blind look judge with vision, as in the Hy4 3D trial (completed 2026-11-18): the judge sees renders of arm A and arm B with the labels hidden and in random order; record scores per asset and arm.
  - Done when: the judge file holds one score for each of the 6 cards (3 assets, 2 arms), the labels were hidden, and the card order was random.
  - Evidence: pending.
- [ ] Task: T6. One-page readout with the numbers and a recommendation (adopt, adopt for some steps, or no), to the PM: write it to measure/tracks/asset_blender_trial_20261127/readout.md and report the commit sha.
  - Done when: `measure/tracks/asset_blender_trial_20261127/readout.md` holds the numbers and one recommendation, and the readout names the commit sha.
  - Evidence: pending.
