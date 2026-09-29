# gnoll-hunter rework (enemies/humanoid/gnoll-hunter) -> assets/gnoll-hunter.ts

Rework the existing assets/gnoll-hunter.ts (a fresh agent; the file builds, 64,536 triangles, `./forge check` ok). Bar 8/10 (character). Two passes scored 7.5 and 7.7. Mockup: docs/enemy-mockups/gnoll-hunter_001.jpg (already the `reference`). Keep the rig, the clips, the head, the mane, the pelt hood, the harness, the quiver, and the raised bow pose.

Fix these three differences, largest first:
1. Fur cuffs and shin fur. They are huge bulbous pods that swallow the forearms and the whole lower legs. Match the mockup: a wrist cuff is a short band (a torus R 0.055 r 0.02 with a fbm displace of 0.006 and eight short fur cones 0.03 long) that leaves the hand and the upper forearm visible; a shin cuff is the same band at the ankle (R 0.06) plus a second band under the knee, with the shin skin visible between them. Remove the fur skirt below the loincloth so the thighs show as tan fur. The arms and legs must read as limbs with fur trims, not as fur sacks.
2. Bow. It is a thin straight stave. Build the mockup's tall recurve: a chain of seven points from the lower tip to the upper tip (0.95 m tall), bowing back 0.06 m at the middle and curving forward 0.05 m at the last 0.12 m of each end, r 0.014 at the grip tapering to 0.007 at the tips, with a leather grip wrap (three tori), horn nocks (small cones) and a string (a thin cylinder r 0.003 between the tips). Hold it upright in the raised left hand as now. Confirm the draw clip still works and the check passes.
3. Face fur. Add fur texture to the head and muzzle with bump (fbm at frequency 40, amplitude 0.003) and a lighter #8a8680 brow and cheek patch so the face is not one smooth grey; widen the pelt hood ear flaps 1.3x so they show in the front view.

Check every fix in out/gnoll-hunter/render.png and out/gnoll-hunter/sprites/preview.png. Report the three largest remaining differences.

Limits: under 70,000 triangles. No `warning:` lines. `./forge check gnoll-hunter` must end with `result ok` and the ground check must be ok. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/gnoll-hunter.ts. Finish with one `./forge all gnoll-hunter`.
