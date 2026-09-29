# ogre-brute (enemies/humanoid/ogre-brute) -> assets/ogre-brute.ts

A heavy enemy brute about 1.3 m tall (the biggest humanoid enemy), faces +Z, on the orc warrior base (assets/orc-warrior.ts: the same skeleton with knee bones; clips idle, walk, run, attack, attack2, roar, hit, death; variant slots and presets) scaled up 1.25 with a bigger belly. Bar 8/10 (character).

Mockup: docs/enemy-mockups/ogre-brute_001.jpg (set `reference` to that path). Match its idea: a huge round-bellied ogre with tan skin, a small head sunk into the shoulders with a heavy brow, small ears, a wide mouth with two upward tusks, a dark brown mane and beard around the face; massive arms with three-band leather bracers and red cloth wraps above them, a rope belt with a hanging rope tassel, a ragged red-and-brown loincloth of hide strips, one leather anklet, bare flat feet; a big wooden club with a stone spike lashed on top, held up in the right hand.

Palette: skin tan #c8925a with shade #a06f3f and belly light #d9a870 (a new skin slot with tan, grey #8a8a7a, and green #7aa23e options); mane #5a3a22; tusks cream #efe4cc; eyes dark #2a2016; bracers #6e3f24, wraps red #b83a2e; rope #c2a06a; loincloth #8a5a35 with red #b83a2e strips; club wood #6b4226, spike grey stone #8a94a0, lashing rope.
Variants: skin (tan default, grey, green), cloth (red default, blue #3a5a9a, black), leather.

Construction recipe:
1. Copy assets/orc-warrior.ts; scale the skeleton joints by 1.25; remove the axe, pauldron, topknot, and shin wraps; the head is 0.85x the warrior's relative size and sits low (neck joint 0.05 lower); the belly is an ellipsoid r 0.34 x 0.3 x 0.3 at y 0.5; the shoulders are wide (x +-0.36) with big upper arms (r 0.11) and huge fists (r 0.1).
2. Mane and beard: a shaggy ring of noise-displaced ellipsoids around the face and under the chin, `bone: 'head'`; two small ears; two tusk cones from the lower lip.
3. Gear: three-band bracers (three stacked tori) on each forearm with a red wrap torus above; a rope belt (torus with a twisted bump) with a rope tassel (three thin chains hanging 0.25 m); a loincloth of six flat strips (flattened boxes) in alternating red and brown; one anklet torus on the left shin.
4. Club: a wooden capsule 0.7 m (r 0.06 to 0.09) with a stone spike cone (0.2 m) lashed at the top by a rope torus, `bone: 'hand.R'`, raised over the shoulder at rest; `attack` is a two-hand overhead smash with a ground shake; `attack2` is a wide belly-first charge and a backhand swipe. `./forge check ogre-brute` must end with `result ok`.
5. Sprites: `./forge sprites ogre-brute`, view sprites/preview.png; the belly, the club, and the tusks must read at 128 px.

Limits: under 80,000 triangles, `detail` 0.005 on the face and hands, 0.007 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/ogre-brute.ts. Finish with one `./forge all ogre-brute`.
