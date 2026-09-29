# minotaur-guard rework (enemies/humanoid/minotaur-guard) -> assets/minotaur-guard.ts

Review 7.0/10 (shape 3, technical 3); bar 8/10. Keep the rig, clips, bone names, variant slots, and design (bull-headed brute on the orc-warrior base with one two-handed iron maul). Mockup: docs/enemy-mockups/minotaur-guard_001.jpg.

Fixes from the review:
1. Horns: thick low crescents like the mockup: each horn a `sdf.chain` of 5 points sweeping out sideways from the temples, then up and slightly forward, radius 0.06 at the base tapering to 0.02 at the tip, tip height about 0.15 above the crown, span about 0.7 m; ivory #d9ccb0 with darker #8a7a68 bases.
2. Loincloth: chunky fur (8 to 10 fat overlapping teardrop ellipsoids, r 0.05 to 0.07, with noise displacement) instead of long strands, with three leather flaps (flat rounded boxes with a stud) over it.
3. Mane: a round fluffy mass: 10 to 12 overlapping spheres (r 0.08 to 0.11) around the face and neck, smoothUnion 0.03, `.displace(0.01, noise)`, not vertical locks.
4. Technical: the maul touches the chest plate and the bracer by 1 to 2.5 cm in the attacks; move the grip targets 0.03 outward and forward so `./forge check minotaur-guard` reports no body contact. Triangle count 82,546 is over the 80,000 character budget: raise `detail` on the fur and mane to 0.007 so the final build is under 80,000.
5. After `./forge all minotaur-guard`, view sprites/preview.png: the horn crescents must read as a wide silhouette in every direction.

Limits: under 80,000 triangles; no `warning:` lines; check ok. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/minotaur-guard.ts.
