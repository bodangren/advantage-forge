# Complete P1 equipment

Status: completed. This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [x] Task: Select a bounded batch from the scope map.
- [x] Task: Record scale, palette, rig, clips, and game uses before generation.

## Phase 2: Acceptance checks

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch.
- [x] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [x] Task: Build missing sources and review existing sources in the batch.
- [x] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [x] Task: Record review evidence and export paths for every accepted asset.
- [x] Task: Update this plan and the scope records.
- [x] Task: Run measure/generate.sh and measure/doctor.sh.

## Batch 1 round 1 (Sonnet 5.5, 2026-09-29): cloth-robe, mantle

Both P1, kind model, bar 7/10. Briefs in `bench/sonnet/briefs/`, passes in `bench/sonnet/log.tsv`.

- cloth-robe (`equipment/armor/cloth-robe`): `forge-sonnet-low`, one build plus two feedback
  passes, 43,589 tokens. `assets/cloth-robe.ts`, 4,600 triangles, no warnings. Review 7.0.
  Limits: the hood is a cowl on the back only; sleeves are stiff tubes.
- mantle (`equipment/armor/mantle`): two `forge-sonnet-low` passes failed (6.5, 6.0: a hem hole,
  folds through the collar), then one fresh `forge-sonnet-medium` build passed, 80,251 tokens in
  all. `assets/mantle.ts`, 3,492 triangles, no warnings. Review 7.0. Limits: narrow cone, small
  clasp.
- Lesson: the low tier reached 6.5 on both armor pieces at the first pass. Armor pieces go to
  the medium tier from now on.

## Equipment fit contract and audit (2026-09-29)

Owner decision: every equipment piece fits the chibi humanoid base so it can equip avatars later.
Contract: `docs/equipment-fit.md` (base measurements, per-class display scale and anchor);
chest numbers in `bench/sonnet/briefs/torso-contract.md` (exactly 2x the hero torso revolve).

- Batch 1 round 5 armor rebuilt on the contract: plate-armor 7.5, scale-armor 7.3,
  studded-leather 7.0 (all `forge-sonnet-medium`; passes and tokens in `bench/sonnet/log.tsv`).
- Audit result: chest family 2x with two reworks (chainmail, leather-armor P0); head family has
  no shared scale (0.5x to 0.9x of the head, none fits over it) and is set to 1x, seven reworks;
  belt rotated 90 degrees; arms, legs, shoulders, weapons, shields compliant.
- [x] Task: Rework the ten non-compliant pieces (belt, iron-helmet, steel-helmet, chainmail,
  leather-armor, horned-helmet, cloth-hood, leather-cap, crown, circlet). Done 2026-09-29 by
  `forge-sonnet-medium`, one pass each, 27K to 47K tokens each (354K in all); bounds and scale
  factors per piece in `bench/sonnet/log.tsv` (rows tagged `armor-fit`). Head pieces with thin
  walls came out wider than 0.43 m (crown 0.62, circlet 0.51, steel-helmet 0.49) because the
  inner cavity takes priority.

## Rework batch (Sonnet 5.5 run 4, 2026-09-30): sub-7 grafted equipment

The common failure is a thin item lying flat: it vanishes at 128 px. Reworks stand the item upright
and make every part chibi-thick (pole r 0.03 or more, blades 0.03 to 0.05 m thick).
- Accepted: glaive 7.3, greaves 7.0, fishing-pole 7.2, fishing-rod 7.2, amulet 7.5, mining-pick 7.5,
  spear 7.2, lute 7.3, staff 7.2 (medium agents); pike 7.0, scythe 7.0, vial 7.0 (orchestrator).
- Kept without rework: crown, boots, cloak, quiver, steel-helmet, arrow, pickaxe, belt-pouch,
  halberd, bracers, horn, heavy-crossbow, club, compass, leather-cap, shoulder-armor, bolt,
  bracelet, key-iron. cloth-hood stays at 6.5 (its mockup shows a wearer).
- In flight (22:17): javelin, rune-stone, sickle; grimoire, throwing-axe; earring, pendant, sling;
  gloves, scabbard.

## World catch-up (2026-10-01, track `asset_world_catchup_20261001`)

The world catch-up reviewed or reworked 6 assets of this family. 3 are accepted at their bar (P0 7.5, P1 7.0). Scores and notes are in [the catch-up evidence](../asset_world_catchup_20261001/evidence.md) and in `bench/sonnet/log.tsv`.

belt-pouch 6.3 (to the equipment-parts track), gauntlets 6.3 (to the equipment-parts track), halberd 6.5 (to the equipment-parts track), lantern 7.5, pike 7.0, scythe 7.0.

## Closeout (2026-10-02, track `asset_p0p1_closeout_20261002`)

The closeout brought the rows of this family below their bar to it: halberd 7.0, gauntlets 7.0, belt-pouch 7.2, cloth-hood 7.0 (review of the current render); horned-helmet 7.2 and steel-helmet 7.2 now fit the avatar base (0b14487). Scores and notes are in `bench/sonnet/log.tsv` (batch `closeout`) and in `docs/character-reviews.json`. Bars: P0 7.5, P1 7.0, characters 7.5 (owner decision of 2026-10-02).

## Completion (2026-10-02, track `asset_p0p1_completion_20261002`)

The completion track closed this family. All 93 P1 rows are at their bar. Each source has a current textured output,
sprites, and one strip for each clip, its last `./forge all` has no warnings, and the compiler finds no error in it.
The world catch-up, closeout, and completion tracks did the tasks above. Evidence: [the completion
evidence](../asset_p0p1_completion_20261002/evidence.md) and [the rebuild table](../asset_p0p1_completion_20261002/rebuilds.tsv).
