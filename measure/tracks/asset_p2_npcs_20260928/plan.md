# Produce P2 npcs

Status: in progress (2026-10-09, owner goal: complete the P2 NPCs with Sonnet subagents). This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [x] Task: Select a bounded batch from the scope map (batches below; settlement first, then wilderness, court and faction, and the fantasy peoples last).
- [x] Task: Record scale, palette, rig, clips, and game uses before generation (bench/sonnet/p2-npc-data.mjs, one row per NPC).

## Phase 2: Acceptance checks

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch (Acceptance checks below).
- [ ] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [ ] Task: Build missing sources and review existing sources in the batch.
- [ ] Task: Run forge all for each accepted source after visual correction.
- Note (2026-10-09): `baker` is at 7.2 after two reviews in the [Haiku trial](../asset_p2_npc_haiku_trial_20261009/), below the 7.5 character bar; one more pass under the stop rule. NPCs that carry an item in both hands can use the humanoid kind's `hold` option.

## Phase 4: Documentation and verification

- [ ] Task: Record review evidence and export paths for every accepted asset.
- [ ] Task: Update this plan and the scope records.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.

## Acceptance checks (all batches)

Bar 7.5/10 (characters, owner 2026-10-02). Stop rule (owner 2026-10-08): after three reviews below
the bar, record the rating and put the asset on the follow-up list. Each NPC has a mockup in
`docs/npc-mockups/<name>_001.jpg` (mmx, clay-toy chibi style with the kind's big eyes), a brief in
`bench/sonnet/briefs/<name>.md` from `bench/sonnet/make-p2-npc-briefs.mjs`, one `forge-sonnet-high`
agent, `./forge check` with `result ok` and `ground ok`, a `forge all` build with no `warning:`
lines, and an independent review (measure/tracks/asset_review_audit_20261005/reviewer-brief.md)
recorded in `docs/character-reviews.json`. Builds queue on one `flock` (machine memory).

Base: `humanoidAsset` (assets/parts/humanoid-kind.ts). Options added on 2026-10-09: `hold` (both
hands on a held item in every clip, level, with a lift in cheer, cast, and attack) and `pose` (one
or both arms in a held rest pose, kept in every clip; `h.arms`, `h.perArm`). Without them the
avatar base and the baker build identical (A/B mesh, animation, and node comparison).
Mockups pick hands freely: the data rows follow each mockup (the character's right hand is on the
viewer's left).

## Batches

| Batch | NPCs | Status |
| --- | --- | --- |
| 1 | bartender, merchant, mayor, town-crier, herbalist, weaponsmith | built 2026-10-09, in review |
| 2 | apothecary, armorer, brewer, carpenter, cobbler, cook, fisher, gardener | building |
| trial | baker (7.2 after two reviews) | third pass built |
