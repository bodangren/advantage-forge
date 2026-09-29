# orc-archer (enemies/humanoid/orc-archer) -> assets/orc-archer.ts

A ranged orc enemy about 1.0 m to the topknot, faces +Z, on the orc warrior base (assets/orc-warrior.ts: the same wide-joint chibi skeleton with knee bones and the `knot` bone; clips idle, walk, run, attack, attack2, roar, hit, death; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/orc-archer_001.jpg (set `reference` to that path). Match its idea: a leaner orc than the warrior, bald green head with a small dark topknot, heavy brow, small tusks, pointed ears; a dark leather jerkin with a diagonal quiver strap, a brown belt, leather bracers, a ragged dark loincloth, bare feet; a big curved wooden longbow in the left hand held across the body, a quiver of three arrows on the back.

Palette: the orc warrior's skin slot (green #7aa23e, shade #5a7a2c), tusks cream #efe4cc, eyes yellow #f2c230; jerkin dark leather #3f3a35, strap and belt #6e3f24, bracers #5a3a22; bow wood #8a5a35 with #6b4226 ends, string #c8a86b; arrows shaft #8a5a35, iron heads #5a6068, grey fletching.
Variants: keep the warrior's slots (skin, leather, cloth) and presets.

Construction recipe:
1. Copy assets/orc-warrior.ts. Remove the axe, the spiked pauldron, the beard, and the fur shin wraps. Narrow the torso 10 percent and the arms 10 percent. Keep the head, tusks (smaller, r 0.7x), brow, ears, topknot.
2. Jerkin: a torso shell in dark leather with a raised collar; a diagonal strap torus segment from the right shoulder to the left hip; belt with a square buckle; bracers as short flared cylinders on both forearms.
3. Bow: a bent capsule arc (`sdf.chain` through 7 points on an arc, r 0.025 tapering to 0.012) 0.9 m tall, `bone: 'hand.L'`, held vertical at the left hip at rest, raised across the body in `attack`; string as a thin capsule between the tips. Quiver: a cylinder r 0.06, 0.4 tall on the back at 30 degrees, `bone: 'chest'`, with three arrow shafts and fletching sticking out the top.
4. Clips: keep the base clips; retime `attack` as a draw and release (the right hand pulls back to the cheek for 0.3 s, then snaps forward), `attack2` as a quick kick plus a bow bash. `./forge check orc-archer` must end with `result ok` (the bow never passes through the head).
5. Sprites: `./forge sprites orc-archer`, view sprites/preview.png; the bow, tusks, and topknot must read at 128 px.

Limits: under 70,000 triangles, `detail` 0.004 on the face and hands, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/orc-archer.ts. Finish with one `./forge all orc-archer`.
