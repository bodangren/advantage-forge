# goblin-king (enemies/humanoid/goblin-king) -> assets/goblin-king.ts

The boss of the Labyrinth game (docs/game-labyrinth-3d.md): a fat goblin king about 1.1 m to the crown tip, faces +Z. Built on the goblin warrior base (assets/goblin-warrior.ts: the rogue skeleton with knee bones, the enemy clip set idle, walk, run, attack, attack2, hit, death, and the goblin head with leaf ears). Bar 8/10 (character).

Mockup: docs/enemy-mockups/goblin-king_001.jpg (set `reference` to that path). Match its idea: a fatter, wider goblin than the warrior, a crooked gold crown with a red gem between two small ivory horns, thick brown brows, two lower fangs, a grey fur collar, a short purple cape, a grey studded leather vest open over a big green belly, a wide brown belt with a big gold buckle, a ragged brown loincloth, big bare feet, and a bone club (a wooden haft with a white knobbed bone head) held up in the right hand.

Palette: skin goblin green #7fae3f with #5f8a2c shade and #a3cc5a highlight (use the goblin warrior's skin slot), belly lighter #9cc456; crown gold #d4a93a (metalness 1, roughness 0.3) with a red #c8423a gem; horns ivory #efe4cc; fur #a89f8c; cape purple #6a3f7a with #4a2c58 shade; vest grey leather #5a5450 with iron studs #4a4f55; belt #8a5a35 with gold buckle; loincloth #6b4226; club haft #6b4226, bone head #efe4cc.
Variants: keep the goblin warrior's color slots (skin, cloth, leather) and add one preset per skin family as the base file does.

Construction recipe:
1. Start from a copy of assets/goblin-warrior.ts. Keep the skeleton, bone names, clips, and the face layout; widen the torso (belly ellipsoid r 0.22 at y 0.3), shorten the legs by 10 percent so the king reads squat, and scale the head 1.1x.
2. Crown: a revolve band (r 0.15, 0.06 tall) with five triangular points and a center gem, seated on the crown of the head at y 0.85, `bone: 'head'`; two small horn cones beside it.
3. Fur collar: a torus (R 0.2, r 0.05) with noise displacement at the neck, `bone: 'chest'`; cape: a short flat box 0.42 x 0.35 x 0.03 hanging behind the shoulders with a wavy hem, `bone: 'chest'`.
4. Vest: two flat leather panels on the chest with three stud spheres each; belt: a torus around the waist with a gold box buckle; loincloth: a flat box with a jagged hem in front.
5. Club: a haft capsule 0.5 m with a knobbed bone head (three spheres), `bone: 'hand.R'`, raised in the attack clips; run `./forge check goblin-king` (result ok, nothing through the head).
6. Sprites: run `./forge sprites goblin-king` and view sprites/preview.png; the crown, ears, and grin must read at 128 px.

Limits: whole asset under 60,000 triangles (character budget), `detail` 0.004 on the face and hands, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/goblin-king.ts. Finish with one `./forge all goblin-king`.
