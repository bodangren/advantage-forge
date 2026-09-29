# iron-golem (enemies/construct/iron-golem) -> assets/iron-golem.ts

A massive blocky iron construct about 1.15 m tall, faces +Z, on the stone golem base (assets/stone-golem.ts: the heavy golem rig with knee bones; clips idle, walk, run, attack, attack2, roar, hit, death; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/iron-golem_001.jpg (set `reference` to that path). Match its idea: a small angular cubic head with a wide glowing orange visor slit and a rust spike on top, set low between huge shoulders; a big boxy chest with a round riveted furnace hatch in the center; huge blocky upper arms and forearms with chamfered plate edges, rivet rows, and fist balls of iron; a narrow blocky pelvis; short thick box legs with square vent cutouts and flat wide feet with three toe blocks; rust streaks and chipped edges everywhere; no weapon.

Palette: iron #3a3b3e with lit #55575c (roughness 0.6, metalness 0.7); rust #8a4a22 streaks by `paintFn` with noise, on edges and rivets; visor glow orange #ff8a1a emissive 1.6 on a #3a1a08 base; the hatch glow #ff6a10 emissive 1.2.
Variants: glow (orange default, blue #3a9aff, green #5aff6a), rust (rust default, verdigris #4a8a6a, clean #55575c).

Construction recipe:
1. Copy assets/stone-golem.ts. Keep the rig and the clips. Replace every boulder with chamfered boxes (`sdf.box([w, h, d], 0.015)`): head 0.2 x 0.18 x 0.2 with the visor slit as a subtracted box and an emissive strip behind it; chest 0.5 x 0.4 x 0.34; shoulders 0.24 cubes; upper arms 0.2 x 0.26 x 0.2; forearms 0.24 x 0.28 x 0.24; fists as unions of five spheres r 0.05; pelvis 0.3 x 0.16 x 0.24; legs 0.2 x 0.3 x 0.22 with a subtracted square vent; feet 0.24 x 0.1 x 0.3 with three toe blocks.
2. Rivets: small spheres r 0.012 in rows along the plate edges (loop over positions). Chipped edges and plate seams go in `bump`, not in the geometry.
3. The furnace hatch: a torus R 0.09 r 0.02 on the chest front with an emissive disc inside, four rivets around it.
4. Clips: keep the base clips; the attack is a heavy double-fist slam, attack2 a wide backhand. No held items. Ground check must be ok.
5. Sprites: the glowing visor, the hatch, and the boxy silhouette must read at 128 px.

Limits: under 60,000 triangles, `detail` 0.005 on the head, 0.007 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/iron-golem.ts. Finish with one `./forge all iron-golem`.
