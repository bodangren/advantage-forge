# Produce P3 fx-geometry

Status: new. This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [ ] Task: Select a bounded batch from the scope map.
- [ ] Task: Record scale, palette, rig, clips, and game uses before generation.

## Phase 2: Acceptance checks

- [ ] Task: Define silhouette, material, sprite, and clearance checks for the batch.
- [ ] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [ ] Task: Build missing sources and review existing sources in the batch.
- [ ] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [ ] Task: Record review evidence and export paths for every accepted asset.
- [ ] Task: Update this plan and the scope records.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.

## Deferred (2026-10-01 00:10)

The 33 effect rows have no contract: the catalog calls them "geometry effects" and no game
document names one. Open owner questions before a batch starts: (1) is an effect static
geometry (a glowing shape on y = 0) or a looping clip (scale, spin, rise) on a small rig; (2) the
size contract (a fireball r 0.2 m, a spell circle 1.2 m across); (3) whether sprites per direction
apply or one frame strip; (4) opacity limits (the sprite renderer drops surfaces below 0.5, TD-13).
Existing effect-like assets to reuse: portal, orb, bolt, ritual-circle, glowing-mushroom.
