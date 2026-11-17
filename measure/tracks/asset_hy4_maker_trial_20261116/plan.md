# Trial Hy4 Flash as the maker of simple 3D asset files

Status: new (2026-11-16). Phase 0 authors the track (8d045c1d). Phase 1 makes 3 props twice from one
brief, judges the cards blind, and promotes the winner.

The track follows Daniel's order of 2026-11-16: a small trial of `opencode/hy4-flash-free` as the maker
of asset TypeScript files. The [specification](./spec.md) owns the scope, decisions D1 to D10, and the
acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track. The author writes the track files.
- Owned paths are in the "Owned paths" section of the specification. The planning paths are this folder
  and `measure/runs/asset_hy4_maker_trial_20261116/`.
- Do not change a frozen path of the specification: `src/`, the review card tool, the typecheck tool,
  `scenes/maps/**`, the catalog, and every other track plan.
- The question tool is denied. A question for Daniel or the PM goes in the final reply with a default.
- Other agents share the git index. Each commit holds explicit paths only. The author stages
  `measure/tracks.md` through a blob, because that file holds a foreign hunk.
- The author does not run `./measure/generate.sh`, because `measure/generated/` holds foreign changes.
  The author runs `./measure/doctor.sh`.
- Metered spend: 0 USD. The 3 mockups use the MiniMax Token Plan quota (D2 of the specification).
- Scratch goes only under `/tmp/opencode/hy4trial/`.
- One role runs at a time.

### Load rule

Every `forge`, `tsc`, `vitest`, or Chrome command runs as one heavy job:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'
```

A browser install, a render, and a capture also run only through `heavy-run.sh` (PM load rule,
2026-11-16). Playwright build 1234 sits in `~/.cache/ms-playwright`. No arm starts a new
`playwright install`. Exit 75 means a lock wait: wait and retry. The machine has 7.1 GiB and one heavy
job runs at a time.

### Light lane

PM 2026-11-03: one maker role per arm per try round, one checker (`measure-phase-acceptance`) after the
phase, then closeout. No spec review, Red, Reviews A to C, adversarial review, UX review, or final
acceptance role runs.

The route models:

| Role | Model |
| --- | --- |
| Hy4 maker | `measure-jr-green` on `opencode/hy4-flash-free#high` |
| Current maker | `measure-jr-green` on `minimax-cn-coding-plan/MiniMax-M3.1-Flash` (back on the PM allowed list 2026-11-17) |
| Judge | `opencode-go/muse-spark-1.3-contributor#high` (ra-quota pick review-c --not-family deepseek --not-family minimax, 2026-11-17; family muse, not hy, deepseek, or minimax) |
| Phase checker | `measure-phase-acceptance` on `opencode-go/mimo-v2.6-flash` (ra-quota pick acceptance --not-family deepseek --not-family minimax --not-family claude --not-family muse) |
| Closeout | `measure-closeout` on `minimax-cn-coding-plan/MiniMax-M3.1-Flash` |

Note (2026-11-17): Kimi and NVIDIA left the table after the PM model rule of 2026-11-16. `ra-quota`
cannot exclude family `hy`, so the orchestrator checks by hand that no judge or checker is on `hy`.

### Task markers

`[x]` means complete. `[~]` means in progress. `[ ]` means ready and not started. `[b]` means blocked,
with a trailing `deferred:<owner>` field. The owner changes `[b]` to `[~]` when the blocker clears. The
doctor counts only `[ ]`, `[~]`, and `[x]`.

## Phase 0: Authoring [checkpoint: 8d045c1d]

- [x] Task 0 (8d045c1d): Author the track: specification, plan, metadata, index, 3 briefs, 3 mockups,
  the arm key, the judge brief, and the mechanical check with its test on `bucket`. Add the registry
  entry. The creation commit has the message `measure(asset_hy4_maker_trial): create the track`.
  - The 3 assets are `towel-stack`, `wash-basin`, and `towel-rack` (specification D1). The bar is 7.0.
  - Mockups: `docs/bathhouse-mockups/<name>-mock.jpg`. The prompts, the SHA-256 values, and the quota
    use are in `measure/runs/asset_hy4_maker_trial_20261116/mockups.md`. All 3 `mmx` calls answered.
  - Briefs: `measure/tracks/asset_hy4_maker_trial_20261116/briefs/<name>.md`. One file per asset, read
    by both arms.
  - Arm key: `measure/runs/asset_hy4_maker_trial_20261116/arm-key.json`, seed 20261116. Hy4 holds label
    `a` for `towel-stack`, label `a` for `wash-basin`, and label `b` for `towel-rack`.
  - Judge brief: `measure/runs/asset_hy4_maker_trial_20261116/judge-brief.md`.
  - Mechanical check: `measure/runs/asset_hy4_maker_trial_20261116/mech-check.mjs`. Its test on `bucket`
    passes with exit 0; the output is in `mech-check-test.txt`.
  - Environment work of this task: `node_modules` held no packages, so `pnpm install --frozen-lockfile`
    ran again. Playwright 1.62.0 needed browser build 1234, so `npx playwright install chromium` added
    it. Both steps are tools, not spend.

## Phase 1: The trial

### Task 1: Try round 1

- [~] Task 1: Try round 1 for the 3 assets. Run the Hy4 maker role, then the current maker role, then
  the judge.
  - The Hy4 maker covers the 3 assets that `arm-key.json` assigns to label `a` or `b` for the Hy4 arm.
    The current maker covers the other 3 sources. Roles run one at a time.
  - A maker role base: read `AGENTS.md`, `.claude/skills/forge-assets/SKILL.md` with
    `references/props.md` and `references/materials-and-color.md`, the brief, and the mockup. Write only
    `assets/<name>-<label>.ts`. Never open a file of the other label.
  - Inside one try: `./forge render <name> --fast` and look at `out/<name>/render.png`. Then
    `./forge inspect <name> --fast`. Then `./forge all <name>`. Then the mechanical check of D6. Then
    `scripts/review-cards.py out/hy4-trial/cards/r1 <name>-<label>` for the card.
  - The judge session reads `judge-brief.md`, the 3 briefs, the mockups, and the 6 cards of round 1. It
    writes `measure/runs/asset_hy4_maker_trial_20261116/judge-r1.json` (a provisional file first, then
    the final one).
  - Record the rating of each card, the pass or fail, and the findings.
  - Arm 1 round 1: commit 37769535; mech-check ok for towel-stack-a, wash-basin-a, towel-rack-b; cards at out/hy4-trial/cards/r1/.
  - Known misses of arm 1 round 1 (maker log, commit 37769535): wash-basin-a is 0.199 m tall against the 0.17 m brief; towel-rack-b is 0.689 m wide against the 0.62 m brief. The judge gets both; a try 2 fixes them if the judge fails the asset.

### Task 2: Try round 2

- [ ] Task 2: Try round 2 for each arm and each asset that did not pass in round 1. Run only when a card
  fails.
  - A maker of round 2 gets only the judge findings for its own arm and asset. It iterates, runs
    `forge all`, the mechanical check, and card `<name>-<label>` at `out/hy4-trial/cards/r2/`.
  - One judge session rates the open cards of round 2 and writes `judge-r2.json`.
  - At most 2 tries per arm per asset after round 1.

### Task 3: Try round 3

- [ ] Task 3: Try round 3 for each arm and each asset that still has no pass and has fewer than 3 tries.
  - Same shape as Task 2, with cards at `out/hy4-trial/cards/r3/` and `judge-r3.json`.
  - An asset with no pass after 3 tries of an arm is a fail for that arm. It gets no more tries.

### Task 4: Results and promotion

- [ ] Task 4: Apply the win rule of D8 to each asset and promote the passing winner to
  `assets/<name>.ts` (D9).
  - Run `./forge all <name>` and the mechanical check on each promoted source.
  - Delete both trial sources of the asset and their `out/<name>-a` and `out/<name>-b` folders.
  - Write the results table in this plan: route, asset, pass or fail, tries, rating per try, and the
    reason. Write the route result.
  - Add one lesson to `measure/lessons-learned.md`.

### Phase 1 gate and closeout

- [ ] Phase 1 gate: phase acceptance by the checker at an immutable HEAD. The checker reads the spec,
  the plan, the run files, the mockups, the mech-check output, and the judge files. It runs the
  mechanical check on one promoted asset and greps for the spend rule and the foreign-hunk rule.
- [ ] Closeout: archive the track, move the registry entry to the Archived Tracks section, and run
  `./measure/doctor.sh`. The generator does not run while `measure/generated/` holds foreign changes.

The light lane has no final acceptance role.

## Human gate

Daniel ordered the trial and owns the route decision. The author writes the route result as a
recommendation from the judge evidence. A card rating is model evidence, not owner acceptance.

## Risks

| Risk | Control |
| --- | --- |
| A maker reads a file of the other label and copies it. | The role base names one label. The sources stay in separate files. |
| The judge learns the routes. | The judge brief denies the arm key, the plan, the log, and the history. |
| A trial source overwrites a catalog source. | The `-a` and `-b` suffixes. Promotion is the only write to `assets/<name>.ts`. |
| The mockups drift from the Forge style. | The prompts follow `docs/item-mockups/`. The brief is the contract. |
| A heavy job runs beside another heavy job. | The load rule. One heavy job at a time. |
| A foreign hunk of `measure/tracks.md` enters a commit. | The registry entry goes in through a blob, and the staged diff is checked. |
| An arm cannot build because a tool is absent. | Phase 0 installed the packages and browser build 1234. The mech-check test proves the tool chain. |

## Evidence

- Track creation commit: recorded at creation (message `measure(asset_hy4_maker_trial): create the
  track`).
- Run records: `measure/runs/asset_hy4_maker_trial_20261116/` (arm key, mockup log, judge brief,
  mechanical check, check test, judge files).
