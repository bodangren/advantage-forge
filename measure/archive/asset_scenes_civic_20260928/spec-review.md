# Spec Review: asset_scenes_civic_20260928
Author model: anthropic (migration 6b70d6f5); amendments: deepseek (opencode-go/deepseek-v4.1-flash, 2026-11-19)

## Round 1 (Reviewer: measure-spec-review, opencode-go/hy4-flash-free#high, 2026-11-19, verdict FAIL)

Baseline SHA: 64f815392f3cc1e018835736b866bb49d857e33f. Phase: track setup.
The review ran the standard paraphrase, zoom-out, and zero-decision checks.
`measure/anti-patterns.md` does not exist, so the checks ran without it.
The reviewer could not write this file. It held edit rights only in `measure/runs/**`.

### Paraphrase

The track plans and accepts the civic group of scene blueprints.
It claims all 32 civic rows in the 100-scene list.
Two rows are accepted at 7.5: `locations/civic/blacksmith-shop` and `locations/civic/tavern`.
The other 30 rows are `mockup-needed`.
The track will reconcile existing mockups and scene sources, pick a next scene, pin fit rules,
assemble one scene, compare renders with the mockup, and refresh the blueprint status.

`docs/fantasy-world-scene-blueprints.tsv` holds one row per scene with a group, priority, and status.
Two civic scene sources exist: `scenes/blacksmith-shop.ts` and `scenes/tavern-interior.ts`.
Their renders sit in `docs/blacksmith-mockups/` and `docs/tavern-mockups/`.
`docs/dungeon-mockups/fit-check.md` fixes dungeon verticals for a 1.0 m character.
`docs/fantasy-world-asset-catalog.md` defines asset IDs.
`.claude/skills/forge-assets/references/review.md` scores assets out of 10 against a priority bar.
Mockups need image generation. Paid generation needs PM approval.

### Zoom-out

1. Root problem: FAIL. The purpose claims all 32 rows. The tasks leave the next scene, the mockup
   supply, and the path to acceptance open.
2. Speculative feature: PASS.
3. Premature optimization: PASS.
4. Reuse: FAIL. The plan claims reuse but cites no file or symbol.
5. Correct place: PASS. Scene sources live in `scenes/`; mockups live in `docs/`.
6. Requirement level: PASS.

### Zero-decision check

A Red or Green role would decide alone: the scene record shape and paths; the mockup command and
the spend; the numeric bar and the scoring role; the per-scene advance rule; the scale and
clearance values.

### Findings

- F1 [Blocker] `plan.md` Phase 1 "Select the next scene" names no scene and no selection rule.
  30 civic rows are `mockup-needed`. Rationale: the standard treats a design choice left to the
  implementer as a Blocker. The user must name the next scene before Red starts.
- F2 [Blocker] `plan.md` Phase 1 "Reconcile existing mockups" names no 0 USD mockup route.
  P2 civic rows have no mockup. Paid image generation needs PM approval. Rationale: Green cannot
  create a needed input or spend money alone. The user must set the route and the approval gate.
- F3 [Blocker] `plan.md` Phases 1 to 4 name no file path for the scene source, the mockup, the
  component list, the comparison renders, or the acceptance record. Rationale: a role would
  invent paths that callers and tools depend on.
- F4 [Major] `spec.md` Acceptance criteria and `plan.md` Phase 4 pin no numeric review bar and
  name no scoring role. `review.md` sets 7.5 for P0 maps and 7.0 for the lowest priority.
  Rationale: an unpinned bar lets the acceptance role decide alone.
- F5 [Major] `plan.md` Phases 1 to 4 have no per-scene phase gate. No task moves a row from
  `mockup-needed` to assembly to `accepted`, and no task names the evidence. Rationale: a phase
  without a check is a Major.
- F6 [Major] `plan.md` Phase 3 "without duplicating reusable sources" claims reuse but cites no
  file or symbol. `scenes/blacksmith-shop.ts`, `scenes/tavern-interior.ts`, and the catalog IDs
  exist. Rationale: the zoom-out check requires a file and a symbol for a reuse claim.
- F7 [Major] `plan.md` Phase 2 "shared scale, palette, passage clearance" gives no source values.
  `fit-check.md` gives a 1.0 m median character, an opening at least the character plus 0.09 m,
  1.2 m walls, and a 45 to 50 degree camera. Rationale: the edge-case values and the main-body
  20 percent scale rule are not pinned.

### Verdict

status: fail
blocking_findings: F1, F2, F3
nonblocking_findings: F4, F5, F6, F7
retry_recommendation: escalate_human
confidence: high

The review found no speculative feature and no premature optimization.
The plan does not deliver the stated purpose, which is to own all 32 civic rows.

## Amendments after round 1

The orchestrator set each default under Daniel's primary directive of 2026-11-18.
The PM may reverse each default.

- F1 next scene: `spec.md` and `plan.md` name `locations/civic/bathhouse` (P2) as the next scene.
  Reason: the three bathhouse props (`assets/towel-stack.ts`, `assets/wash-basin.ts`,
  `assets/towel-rack.ts`) and `docs/bathhouse-mockups/` already exist, so it costs the least.
  The order after bathhouse is market-square, general-store, inn, then the remaining rows in TSV
  order.
- F2 mockup route: `spec.md` names `mmx image generate` on the MiniMax Token Plan at 0 USD
  metered. This is the route that made `docs/bathhouse-mockups/`. Any metered or paid generation
  needs PM approval first. Each mockup records the spend as "0 USD metered".
- F3 paths: `spec.md` and `plan.md` name the scene source `scenes/<scene>.ts`, which is
  `scenes/bathhouse.ts` for this scene. The mockup and the comparison renders live in
  `docs/<scene>-mockups/` as `<scene>-mock.jpg`, `render-3q.png`, and `render-top.png`. The
  component list is `measure/tracks/asset_scenes_civic_20260928/scenes/<scene>.md`, with a
  catalog ID or an explicit addition, a quantity, and transform notes. The acceptance record is
  the row in the plan acceptance table plus the TSV status column. Existing IDs and paths stay.
- F4 bar: `spec.md` sets 7.0 for a P2 row and 7.5 for a P0 row. An independent judge on the route
  from "ra-quota pick vision-review" rates the renders against the mockup out of 10, per
  `review.md`. The judge family differs from the maker family.
- F5 gate: `spec.md` and `plan.md` define the per-scene gate `mockup-needed` to `mockup-ready`
  to `assembled` to `accepted`. Each move updates the TSV status column and cites its commit.
  `mockup-ready` needs the mockup file. `assembled` needs the scene source, the component list,
  and the renders, with no `warning:` lines in the build. `accepted` needs the judge rating at
  or above the bar and no critical error.
- F6 reuse: `plan.md` Phase 3 cites `scenes/blacksmith-shop.ts` and
  `scenes/tavern-interior.ts` as the pattern, and cites the catalog IDs in
  `docs/fantasy-world-asset-catalog.md`. A missing component becomes an explicit addition,
  built in `assets/` through the normal asset loop.
- F7 fit values: `spec.md` and `plan.md` Phase 2 pin the values from
  `docs/dungeon-mockups/fit-check.md`: a 1.0 m median character, an opening at least the
  character plus 0.09 m, 1.2 m walls, and a 45 to 50 degree camera. They also pin the main-body
  rule from `review.md` for every prop: the main body stays within 20 percent of the brief on
  every axis.

Round 1 amendment 2 (orchestrator, 2026-11-19): the civic maps exist in scenes/maps/; the track changes from build to reconcile and independent review.
That line supersedes the build-path parts of F1, F3, F5, and F6 above. Phase 1 to Phase 4 now reconcile, rate, rework, and record the 30 existing civic maps. The "P0 map acceptance" section is unchanged. No task is marked done.
