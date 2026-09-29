# orc-warlord (enemies/humanoid/orc-warlord) -> assets/orc-warlord.ts

A huge orc chieftain about 1.15 m to the crest tip, faces +Z, on the orc warrior base (assets/orc-warrior.ts: the heavy rig with knee bones and a weapon hand; clips idle, walk, run, attack, attack2, roar, hit, death; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/orc-warlord_001.jpg (set `reference` to that path). Match its idea: a black iron helmet with a nose bar, two big bone-white curved horns, and a red horsehair crest on a central spike; small glowing yellow eyes under the brow, a green face with two large lower tusks and a red-brown beard; huge spiked black iron pauldrons with rivet rows and fur trim; a leather harness strap across the chest with a round red emblem; bare green arms with spiked black bracers; a studded belt with a hanging tabard plate that shows a red hand print; fur-topped iron boots with skull bosses and red straps. A huge double-headed black battle axe held across the body in both hands.

Palette: skin #5f8a2e (compensate for the renderer, which lifts greens one step; not brighter than #6a9a38); iron #2c2c30 with lit #46464c (roughness 0.5, metalness 0.6); horns bone #d9cfa8; crest #b83a2e; beard #7a3a22; fur #5a4632; leather #5a3a24; red marks #b02a22; eyes yellow #ffd23a emissive 1.4.
Variants: skin (green default, grey #6f7a6a, brown #7a5a3a), crest (red default, black #222, white #e8e0d0), paint (red default, white, blue #2f4f8a).

Construction recipe:
1. Copy assets/orc-warrior.ts. Keep the rig, the clips, and the weapon hand. Replace the single pauldron with two big spiked pauldrons (dome r 0.16 with three cones each, rivets as small spheres, fur trim as a displaced band below).
2. Helmet: a half-sphere bowl r 0.25 with a nose bar and a cheek guard each side; two horns (`sdf.chain` sweeping out to x +-0.28 and up to y 1.05, r 0.045 to 0.015) in bone; a central spike with a crest (a tall displaced ellipsoid, `bump` for hair strands). Keep the base face and tusks under the helmet; make the tusks larger.
3. Body: a chest harness strap (a thin torus segment) with a round red emblem; a studded belt; a tabard plate (rounded box 0.16 x 0.2) in front with a painted red hand print (extrude a simple hand outline); spiked bracers; boots with a skull boss (small sphere with two dark eye holes) and a red strap.
4. Axe: a double-headed battle axe 0.9 m in `hand.R`, held across the body at rest, a wide sweep in `attack`, an overhead chop in `attack2`. `./forge check orc-warlord` must end with `result ok`.
5. Sprites: the horns, the crest, the pauldrons, and the axe must read at 128 px.

Limits: under 75,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/orc-warlord.ts. Finish with one `./forge all orc-warlord`.
