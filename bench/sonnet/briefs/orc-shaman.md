# orc-shaman (enemies/humanoid/orc-shaman) -> assets/orc-shaman.ts

A caster orc enemy about 1.05 m to the headdress feathers (1.2 m to the staff skull), faces +Z, on the orc warrior base (assets/orc-warrior.ts: the same skeleton with knee bones; clips idle, walk, run, attack, attack2, roar, hit, death; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/orc-shaman_001.jpg (set `reference` to that path). Match its idea: a hunched grey-green orc with a grey beard and one tusk, white face paint (a band over the eyes and a stripe down the nose), a dark hood headdress with a small animal skull on the brow and two feathered bone sticks rising like antlers, a shaggy fur mantle over the shoulders, a bone bead necklace, a hide skirt with a rope belt and a small bone charm, bare feet; a tall gnarled staff in the right hand topped with a green glowing skull and a green flame.

Palette: skin sage green #7f9a5a with shade #5d7540 (the warrior's skin slot); beard grey #6a6560; paint white #efe4cc; hood #3f3a35; feathers #8a7a68 with white tips; skull bone #efe4cc; fur #6a4a30; beads #d9ccb0; skirt hide #8a5a35 with #6b4226 fringe; staff #4a2c17; staff skull emissive green (base #1f3a14, emissive #7dff5a, intensity 1.8), flame the same emissive.
Variants: keep the warrior's slots and presets; the emissive green stays fixed.

Construction recipe:
1. Copy assets/orc-warrior.ts. Remove the axe, the pauldron, the topknot, and the shin wraps. Tilt the spine forward 8 degrees in the rest pose (hunched), keep the head size; one tusk only (the left).
2. Headdress: a hood cap over the skull with a brow band; a small skull (sphere r 0.05 with two eye pits and a snout) at the brow center; two sticks (capsules 0.3 m) rising at 25 degrees left and right from the crown with a flat feather (a flattened ellipsoid 0.12 x 0.03 x 0.06) at each tip; all `bone: 'head'`.
3. Mantle: a shaggy torus (R 0.22, r 0.07) with noise displacement over the shoulders, `bone: 'chest'`; necklace: a chain of 12 small spheres hanging in a U on the chest; skirt: a flared revolve from the belt to y 0.16 with a jagged hem; rope belt torus with a bone charm.
4. Staff: a gnarled capsule chain 1.1 m (r 0.03) in `hand.R`, planted on the ground at rest; the skull on top (sphere r 0.07 with pits) and a flame (a tapered cone 0.12 tall, emissive, `opacity` 0.85). In `attack` the staff lifts and thrusts forward (a green bolt cast); in `attack2` a two-hand ground slam. `./forge check orc-shaman` must end with `result ok`.
5. Sprites: `./forge sprites orc-shaman`, view sprites/preview.png; the feathers, the glowing skull, and the face paint must read at 128 px.

Limits: under 70,000 triangles, `detail` 0.004 on the face and hands, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/orc-shaman.ts. Finish with one `./forge all orc-shaman`.
