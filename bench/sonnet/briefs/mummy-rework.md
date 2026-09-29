# mummy rework (enemies/undead/mummy) -> assets/mummy.ts

Review 7.5/10; bar 8/10. Keep the rig, clips, bone names, variant slots, and design (a small bundle of cream linen on the zombie base with one glowing eye). Mockup: docs/enemy-mockups/mummy_001.jpg.

Fixes from the review:
1. Eye: smaller (r 0.028 instead of the current disc) with a strong glow: dark base #3a2a05, emissive #ffd23a, emissiveIntensity 2.2, inside a dark face hole (#14110c) that is 1.2x the current opening, so the glow reads at 128 px.
2. Rest pose: the arms hang down (upper arms rotated to about 10 degrees from vertical, elbows slightly bent, hands at the hips), as in the mockup; keep the zombie's reaching pose only in `attack`.
3. Collar: replace the full ring with a small V of layered wrap ends at the front of the neck (three flat strips) and a wrap seam on the back.
4. Chest wraps: loosen them: vary the band widths (0.03 to 0.06), tilt every band a few degrees, let two ends hang free (flat strips 0.15 long) from the left arm and the waist, as in the mockup.
5. After `./forge all mummy`, view sprites/preview.png: the eye must be a bright yellow point in the front directions.

Limits: under 40,000 triangles; no `warning:` lines; `./forge check mummy` ok. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/mummy.ts.
