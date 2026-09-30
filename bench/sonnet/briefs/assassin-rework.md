# assassin rework (enemies/humanoid/assassin) -> assets/assassin.ts

Rework the existing assets/assassin.ts (a fresh agent; the file builds, 42,044 triangles, `./forge check` ok). Bar 8/10 (character). Two passes scored 7.6 and 7.7. Mockup: docs/enemy-mockups/assassin_001.jpg (already the `reference`). The 3D views are close to the mockup. Keep the rig, the clips, the variants, the hood peak and folds, the rolled collar, the mask, the harness, the sash, the daggers, the colors.

The one blocking issue: in out/assassin/sprites/preview.png (a 128 px view from above at about 35 degrees) the hood rim covers the eyes, so the face reads as a black blob. Fix the sprite face, largest first:

1. Raise the face opening. Move the top edge of the hood opening up 0.02 m (from about y 0.70 to 0.72) and pull the front rim back 0.015 m toward -Z so it does not overhang the brow when seen from above. Keep the peak lean and the side rims.
2. Enlarge and lift the eyes. Move the eyes up 0.012 m and scale the eye whites 1.2x (keep the angry tilt and the red corner marks). Give the eye whites a light emissive (0.3, color #e8f0f0) so they stay pale in the sprite shadow under the rim. Move the brows up with the eyes; keep the black drips above the brows but shorten them to 0.035 m so they do not cover the eyes from above.
3. Mask contrast. Lift the mask knit to #5a5858 with #6a6868 lit so it separates from the black hood and jerkin at 128 px.
4. Verify in the sprite: after `./forge all assassin`, look at out/assassin/sprites/preview.png. In the S, SW, and SE sprites the two pale eyes and the grey mask must be visible as separate shapes inside the hood. If they are not, raise the opening another 0.01 m and rerun the sprites with `FORGE_WORKERS=2 ./forge sprites assassin`.

Report the three largest remaining differences.

Limits: under 65,000 triangles. No `warning:` lines. `./forge check assassin` must end with `result ok` and the ground line must be ok. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/assassin.ts. Finish with one `./forge all assassin` (plus one `./forge sprites assassin` if step 4 needs it).
