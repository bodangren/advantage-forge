# Produce P3 vehicles

Status: completed (2026-10-01 00:00). This plan owns execution status. Source documents retain design details.

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

## Batch 1 (Sonnet 5.5 run 4, 2026-09-30 23:58): all 15 P3 vehicles

The last static family without sources after the P2 items closed. Bar 7 (P3, no game pack).
Briefs come from `bench/sonnet/make-p3-vehicle-briefs.mjs` (into `bench/sonnet/briefs/<name>.md`),
mockups from mmx into `docs/vehicle-mockups/<name>-mock.jpg`. Kinds: CART on `assets/market-cart.ts`
(handcart, merchant-cart), WAGON on `assets/wagon.ts` (caravan-wagon, covered-wagon, war-wagon),
BOAT recipe (sleigh, rowboat, fishing-boat), SHIP recipe (riverboat, longship, merchant-ship,
pirate-ship), AIR recipe (balloon-basket, flying-carpet, airship). Scale: chibi (character 1 m);
carts 1.4 m, wagons 2.6 m, boats 2.4 to 3.2 m, ships 4.5 to 8 m, airship 7 m. Static, no rig.
Tiers: carts, wagons, boats, sleigh, carpet on `forge-sonnet-medium`; ships, balloon and airship on
`forge-sonnet-high`, one vehicle per agent. Checks: silhouette in four views, wheels on y = 0 or
keel on y = 0, plank rows in paint and bump (no subtracted grooves), no `warning:` lines, tri caps
12K (carts, boats), 20K (wagons), 30K (ships, air).

## Close (2026-10-01 00:00)

All 15 vehicles accepted at 7.0 to 7.5 and committed: handcart 7.0, merchant-cart 7.0,
caravan-wagon 7.3, covered-wagon 7.2, war-wagon 7.0, sleigh 7.0, rowboat 7.0, fishing-boat 7.0,
riverboat 7.0, longship 7.3, merchant-ship 7.0, pirate-ship 7.3, balloon-basket 7.5,
flying-carpet 7.2, airship 7.0. About 900K subagent tokens (medium 35K to 55K per vehicle, high
40K to 100K). Three needed one feedback pass (handcart, rowboat, longship); rowboat also took an
orchestrator edit (keel hugged to the hull, oars shipped inside). Five built without a mockup
(mmx network failures): covered-wagon, war-wagon, sleigh, rowboat, and pirate-ship's mockup
arrived on the retry. Hull recipe that held: a stretched ellipsoid centered low so the y = 0 cut
leaves a flat keel strip, hollowed to a thick wall, cut flat at the gunwale, keel as part of the
hull body, plank rows in paint and bump. Evidence: bench/sonnet/log.tsv, bench/sonnet/state.tsv,
out/<name>/. Follow-ups: none blocking; mockup-specific details (faceted looks, hanging sails)
were simplified.
