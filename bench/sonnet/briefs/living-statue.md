# living-statue (enemies/construct/living-statue) -> assets/living-statue.ts

An animated marble knight statue about 1.05 m tall, faces +Z, on the knight base (assets/knight.ts: the hero rig with knee bones, a sword hand and a shield arm; clips idle, walk, run, attack, attack2, hit, death, victory; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/living-statue_001.jpg (set `reference` to that path). Match its idea: everything carved from white-grey marble with grey veins and small cracks: a round closed helm with a carved laurel-and-scroll crown band and a center leaf, a horizontal visor slit with pale glowing blue-white eyes inside; a pauldron each side with a carved edge; a chainmail texture on the upper arms (carved dimples); a chest plate with a carved center line and a belt with a round medallion; a tabard skirt with carved scroll patterns; a cape behind; round-toed boots; a plain marble sword in the right hand and a big round marble shield with a raised rim and boss on the left arm.

Palette: marble #e4e2dc with lit #f4f2ee and shade #b8b6b0 (roughness 0.45, metalness 0); veins by paintFn (thin noise streaks in #a8a6a0); eyes #bfe8f0 emissive 1.2; the whole asset is one material family (no gold, no leather colors).
Variants: marble (white default, black #3a3a40 with #6a6a70 veins, green #6a8a7a), eyes (blue default, gold #ffd23a, red #ff4a4a).

Construction recipe:
1. Copy assets/knight.ts. Keep the rig, the clips, the sword, and the shield. Repaint every body to the marble palette (one base color with veins by paintFn and cracks in bump); set metalness 0 and roughness 0.45 everywhere; remove any hero color slots and add the marble and eyes slots.
2. Helm: a closed round helm (sphere r 0.24 cut at the visor) with a horizontal visor slit (a subtracted box 0.22 x 0.035) and an emissive eye bar behind it; a crown band (a torus R 0.22 r 0.02 at the brow) with six carved scroll bumps (small tori and spheres) and a center leaf (an extruded leaf shape).
3. Body: pauldrons with a carved edge (a raised rim torus segment), upper arms with a chainmail dimple pattern in bump, a chest plate with a center ridge, a belt with a round medallion (torus with a sphere), a tabard skirt (a flared revolve segment in front) with scroll patterns in bump, a cape shell behind.
4. Weapons: the sword is a plain marble blade (no guard metal color), the shield a thick round disc r 0.22 with a raised rim and a boss; both in marble. `./forge check living-statue` must end with `result ok` and the ground check must be ok.
5. Sprites: the crown band, the visor eyes, the round shield, and the sword must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the helm, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/living-statue.ts. Finish with one `./forge all living-statue`.
