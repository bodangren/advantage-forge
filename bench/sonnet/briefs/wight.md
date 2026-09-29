# wight (enemies/undead/wight) -> assets/wight.ts

An undead noble enemy about 1.0 m to the crown points, faces +Z, on the vampire base (assets/vampire.ts: the rogue rig with knee bones, face layout, and clip set; variant slots and presets), which is itself on the rogue. Bar 8/10 (character).

Mockup: docs/enemy-mockups/wight_001.jpg (set `reference` to that path). Match its idea: a gaunt pale grey-green face with big pale blue-violet eyes, heavy angry brow ridges, long pointed ears, long straight white hair down to the shoulders, a rusted iron crown with a diamond emblem and side points; a tattered dark grey burial robe with a hood collar over a rusted iron breastplate and shoulder plate, a rusted belt with a buckle, iron bracers, bony hands with pale nails, bare feet; a rusted long sword held low in the right hand.

Palette: skin grey-green #a9b8a6 with #7d8c7b shade; eyes pale violet #8a86c8 with dark pupils; hair white #efece4 with #cfcabb shade; crown rust iron #5a4a3a with #8a5a35 rust and #4a4f55 iron (roughness 0.8, metalness 0.5); robe #3f4045 with #2a2b2f shade, jagged hem; breastplate and bracers rust iron; sword rust iron with a #6a6a72 edge.
Variants: keep the vampire's slots (skin, hair, cloth) with options in the grey-green, bone-white, and slate families.

Construction recipe:
1. Copy assets/vampire.ts; remove the cape, collar wings, and cravat; keep the head and face layout; set the skin and eye colors; add the brow ridges (two rounded boxes lowered in a V) and long pointed ears (cones 0.12 long, angled out and back).
2. Hair: a cap plus 8 to 10 flat strands (flattened capsules) hanging to y 0.42 around the back and sides, white; the crown: a band (torus R 0.21, r 0.02) with a front diamond plate and four side points, rust iron, `bone: 'head'`.
3. Robe: a torso shell with a hood collar ring and a knee-length skirt with a jagged hem (subtract wedges); the breastplate as a rounded box 0.2 x 0.18 with two rivets on the chest; a shoulder plate on the left shoulder; a belt with a square buckle; bracers as short cylinders.
4. Sword: a rusted long sword 0.55 m in `hand.R`, held low and slightly forward at rest, a rising slash in `attack`. `./forge check wight` must end with `result ok`.
5. Sprites: the white hair, the crown points, and the pale eyes must read at 128 px.

Limits: under 60,000 triangles, `detail` 0.004 on the face and hands, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/wight.ts. Finish with one `./forge all wight`.
