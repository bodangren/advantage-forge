# Produce P3 fx-geometry

Status: in progress (2026-10-24, fireball pilot in production). This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope [checkpoint: bf0eccd]

- [x] Task: Select a bounded batch from the scope map. (Fireball only, 2026-10-24.)
- [x] Task: Record scale, palette, rig, clips, and game uses before generation. (See the fireball contract.)

## Phase 2: Acceptance checks [checkpoint: bf0eccd]

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch. (See the fireball contract.)
- [x] Task: Confirm shared dimensions against the kit reference before launching trials. (The owner selected the 0.4 m core contract on 2026-10-24. No established kit effect dimensions exist.)

## Phase 3: Production

- [ ] Task: Build missing sources and review existing sources in the batch.
- [ ] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [ ] Task: Record review evidence and export paths for every accepted asset.
- [ ] Task: Update this plan and the scope records.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.

## Fireball contract (owner-approved, 2026-10-24)

- Catalog ID: `fx-geometry/magic/fireball`. Source: `assets/fireball.ts`.
- Use: a reusable projectile and magic effect. It faces +Z, and its trail extends toward -Z.
- Size: a 0.4 m diameter core with a short trail. The complete effect stays within 1 m depth.
- Ground: the rest pose and every clip stay at or above y = 0.
- Main idea: a bright core with an asymmetric curled flame trail.
- Shape: a round core and swept triangular flames. The silhouette must read from every view.
- Palette: pale yellow #ffe08a, orange #ff9a3c, red-orange #e54b1b, and deep red #8f1d17.
- Materials: emissive core and flames, roughness about 0.3, and no metalness.
- Transparency: the core is opaque. Every visible flame body has opacity 0.5 or greater.
- Rig: one root pulse and optional trail motion. Use one seamless `fly` clip of about 1.2 seconds.
- Motion: pulse without translation. Keep the effect centered in every review frame.
- Outputs: a textured GLB, a turnaround, eight-direction sprites, and a `fly` strip and GIF.
- Budget: 4,000 to 12,000 triangles. Do not exceed 20,000 triangles.
- Checks: a nonempty mesh, a scoped type check, no build warnings, and `forge check` passing.
- Review: inspect the fast render before export. Review the final render, sprites, and motion.
- Acceptance: the owner approves the review page. Do not record approval for the owner.

## Deferred (2026-10-01 00:10)

The other 32 effect rows have no contract: the catalog calls them "geometry effects" and no game
document names one. Open owner questions before a batch starts: (1) is an effect static
geometry (a glowing shape on y = 0) or a looping clip (scale, spin, rise) on a small rig; (2) the
size contract (a fireball r 0.2 m, a spell circle 1.2 m across); (3) whether sprites per direction
apply or one frame strip; (4) opacity limits (the sprite renderer drops surfaces below 0.5, TD-13).
Existing effect-like assets to reuse: portal, orb, bolt, ritual-circle, glowing-mushroom.
