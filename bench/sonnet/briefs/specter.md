# specter (enemies/undead/specter) -> assets/specter.ts

A tall floating hooded phantom about 1.1 m tall, faces +Z, on the wraith base (assets/wraith.ts: a floating hooded rig with a hover move, clips idle, walk, attack, hit, death, taunt; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/specter_001.jpg (set `reference` to that path). Match its idea: a deep hood that hides a black void face with two round glowing pale green eyes; a wrapped ragged cowl around the shoulders; a long grey-blue robe with a torn layered hem that ends in a bank of pale green mist at the ground; two long thin skeletal grey arms hanging at the sides with bony clawed hands; a short chain hanging from each wrist; a faint green glow at the mist.

Palette: robe #4f6470 with shade #3a4a54 and lit #6a8090 (roughness 0.85); skeletal arms #7a8288; void face #050608; eyes #9dffb8 emissive 2.0; mist #a8e8b8 with opacity 0.6 and emissive 0.4; chains #2a3a30 (metalness 0.6).
Variants: glow (green default, blue #7fd0ff, red #ff6a5a), robe (grey-blue default, black #202226, bone #cfc4b0).

Construction recipe:
1. Copy assets/wraith.ts. Keep the hover rig and the clips. Rebuild the hood as a deep cowl (a revolve profile with a forward-leaning opening, the inside cut by a subtracted ellipsoid and filled with a black void body) so the eyes float inside; two emissive eye spheres r 0.03.
2. A wrapped cowl: two or three stacked tori with displaced edges around the neck and shoulders.
3. Robe: a revolve profile from the cowl (r 0.14 at y 0.7) to the hem (r 0.26 at y 0.2), then a layered torn hem (subtract wedges from two overlapping shells). The mist is a smoothUnion of six to eight flattened ellipsoids around the hem down to y 0 (opacity 0.6), so the asset stands on the ground plane.
4. Arms: two long thin cones from the shoulders to y 0.3 with five bony finger cones each; a chain of 4 to 5 small tori hanging from each wrist. Tag the arms to the arm bones; add `arm.L`/`arm.R` bones if the base lacks them.
5. Clips: idle sways and hovers; attack reaches forward with both claws; death sinks into the mist. No held items. `./forge check specter` must end with `result ok` and the ground check must be ok.
6. Sprites: the hood, the two green eyes, the hanging arms, and the mist must read at 128 px.

Limits: under 55,000 triangles, `detail` 0.005 on the hood, 0.007 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/specter.ts. Finish with one `./forge all specter`.
