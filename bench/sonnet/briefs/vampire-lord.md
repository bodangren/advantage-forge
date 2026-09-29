# vampire-lord (enemies/undead/vampire-lord) -> assets/vampire-lord.ts

A regal armored vampire about 1.05 m tall, faces +Z, on the vampire base (assets/vampire.ts: the hero rig with knee bones and a weapon hand; clips idle, walk, run, attack, attack2, hit, death, victory; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/vampire-lord_001.jpg (set `reference` to that path). Match its idea: slicked-back black hair with a widow's peak and a raised swept top; pale grey skin; heavy angry black brows; big red glowing eyes with a pale ring; a wide fanged grimace showing a row of teeth; pointed ears; a high stiff collar, red inside, black outside; a black cloak with a red lining that flares to a bat-wing hem at the calves; a black plate breastplate with gold trim lines and a small red gem at the throat; segmented black pauldrons; a gold-buckled belt; black trousers, knee plates, black boots; clawed pale hands.

Palette: skin #b8b8c0 with shade #9a9aa4; hair #1a1a1e with #34343a highlights; eyes red #ff2a2a emissive 1.4 on a #f0e8e8 ring; teeth #f2ecdc; collar and cloak outside #1c1a1e, lining #a81e28; plate #26242a with gold #c9a24a trim (metalness 0.7, roughness 0.35); gem #d02a2a emissive 1.0; boots #1a1a1e.
Variants: lining (red default, violet #5a2a7a, gold #b08a3a), eyes (red default, amber #ffb020, ice #7fd0ff), hair (black default, white #e8e4dc, grey #6a6a70).

Construction recipe:
1. Copy assets/vampire.ts. Keep the rig, the clips, and the weapon hand (no weapon: the attacks are claw swipes; move the base weapon out or leave hand.R empty). Rebuild the hair as a slicked cap with a widow's peak (an ellipsoid cap cut by a face mask with a V notch at the forehead) and a swept-up back (a displaced ellipsoid on the crown leaning back), strands in bump.
2. Face: heavy brows (two tilted rounded boxes), big red emissive eyes r 0.035 with a pale sclera ring, a wide mouth cut (box) with a row of small box teeth and two longer fang cones, pointed ears.
3. Collar and cloak: a high stiff collar (two flat rounded boxes rising behind the head, red inner face by paintWhere), a cloak shell behind and to the sides from the shoulders to the calves with a bat-wing hem (subtract four arcs), red lining inside by paintWhere on the inner surface; `bone: 'chest'` or weighted to the chest and hips.
4. Armor: a breastplate (a rounded box over the chest) with gold trim strips (thin paintWhere boxes) and a V line, segmented pauldrons (two stacked domes each), a gold buckle belt, knee plates, boots.
5. Clips: attack and attack2 are claw swipes; keep victory. `./forge check vampire-lord` must end with `result ok` (or "no held items") and the ground check must be ok.
6. Sprites: the collar, the hair peak, the red eyes, and the cloak hem must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/vampire-lord.ts. Finish with one `./forge all vampire-lord`.
