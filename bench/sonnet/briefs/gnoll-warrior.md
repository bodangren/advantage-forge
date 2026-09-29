# gnoll-warrior (enemies/humanoid/gnoll-warrior) -> assets/gnoll-warrior.ts

A hyena-headed warrior about 1.05 m tall to the ear tips, faces +Z, on the orc warrior base (assets/orc-warrior.ts: the heavy rig with knee bones and a weapon hand; clips idle, walk, run, attack, attack2, roar, hit, death; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/gnoll-warrior_001.jpg (set `reference` to that path). Match its idea: a hyena head with a long dark muzzle, a black nose, an open snarl with white teeth, big round dark eyes, tall pointed dark-tipped ears, a spiky dark mane down the neck and around the cheeks, dark triangle spots on the forehead; tan fur body with darker paws; a leather chest harness with an X strap and a buckle, a bone-tooth necklace, a studded belt with a dark leather loincloth; wrapped cloth bands on the right forearm and shins; a long jagged spear with a wide bladed head and two spikes, held upright in the left hand; bare clawed feet.

Palette: fur tan #c8934f with shade #a8743a (roughness 0.9), muzzle and mane #2e2a28, paws #3a3430; teeth #efe8d8; eyes #1c1c20 with white glints; leather #3a2e2a with #5a4a40 lit; buckle #6a6a70; spear blade #8a8a92 with #b8b8c0 edge; shaft #4a3a2c; wraps #8a7a66.
Variants: fur (tan default, grey #9a9490, red-brown #9a5a34), mane (dark default, grey #6a6660, red #7a3a22), harness (dark default, brown #6a4a2a, red #7a2a22).

Construction recipe:
1. Copy assets/orc-warrior.ts. Keep the rig, the clips, and the weapon hand. Replace the orc head with a hyena head: a skull ellipsoid 0.24 x 0.22 x 0.22, a long muzzle (a rounded box 0.12 x 0.1 x 0.14 pushed forward, dark), a black nose sphere, an open mouth cut by a subtracted box with a dark inner body and cone teeth, two big eye spheres r 0.03 with glints, tall pointed ears (flattened cones 0.14 tall) with dark tips, a mane of 12 to 16 spiky cones around the cheeks and down the neck, three dark triangle marks painted on the forehead (extruded triangle stencils).
2. Body: tan fur torso and limbs with dark paws (paintWhere), a leather X harness (two thin crossing boxes with a buckle), a bone necklace (six small cone teeth on a torus), a studded belt, a loincloth (a flat rounded box with a torn hem in front and back), cloth wraps as stacked tori on the right forearm and both shins, clawed feet.
3. Spear: 1.1 m in `hand.L` held upright (tip up) at rest, a thrust forward in `attack`, a sweep in `attack2`; the blade is an extruded leaf shape 0.22 long with two side spikes. `./forge check gnoll-warrior` must end with `result ok` and the ground check must be ok.
4. Sprites: the ears, the muzzle, the mane, and the spear must read at 128 px.

Limits: under 70,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/gnoll-warrior.ts. Finish with one `./forge all gnoll-warrior`.
