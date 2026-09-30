# apprentice (heroes/support/apprentice) -> assets/apprentice.ts

A young eager apprentice hero about 0.98 m to the top of the hair, faces +Z, on the mage base (assets/mage.ts: the wizard's body, skeleton with `skirt`, `cloak`, `hatroot`, `hattip`, `orb`, and knee bones; round glasses; a wand rigid in `hand.R`, a book on `hand.L`; clips idle, walk, run, attack, attack2, hit, death, victory; variant slots eyes, hair, skin, clothing with presets). Bar 8/10 (character).

Mockup: docs/hero-mockups/apprentice_001.jpg (set `reference` to that path). Match its idea, with one change: no beard; every hero on this set has the young, round, beardless face. Messy dark brown hair in thick swept locks; round black-rimmed glasses; big eyes looking up at the wand with a hopeful open mouth; an oversized pale blue robe with a big folded collar and rolled-up sleeves that hang past the hands; a brown belt with a big square gold buckle; a brown leather satchel at the right hip with three rolled scrolls poking out; a short brown training wand with a small yellow spark flame at the tip held up in the right hand; the left hand a loose fist; scuffed brown shoes.

Palette: hair #4a2e1c with #2e1c10 grooves; glasses #1a1a1a; skin #f2c7a4; robe #8ab8c8 with #6a98a8 folds (roughness 0.85); collar #a0c8d8; belt #6b4226, buckle gold #e0b040; satchel #6b4226 with #8a5a35 flap; scrolls #ece0c4; wand #4a2e1c; spark #f0e060 emissive 1.4 on a #5a4a10 base; shoes #5a3a24.
Variants (the hero slot set): eyes (brown default, blue #2f6aa8, green #3d7a35), hair (brown default, black #231a17, blond #c4974a), skin (fair default, tan #d49a72, brown #8a5a3e), clothing (sky default, sage #8ab890, lilac #a898c8). Presets: default, sage, lilac.

Construction recipe:
1. Copy assets/mage.ts. Remove the hat, the book, the cape, and the stars. Keep the rig (keep `orb` at the wand tip for the spark), the clips (attack a wand flick with a spark pop, attack2 a two-hand cast that fizzles: a bigger spark then a puff), the glasses, the robe (recolor, enlarge 0.015 all round, add the folded collar), the sleeves (lengthen past the hands with a rolled cuff torus), the belt, the shoes, the wand (shorten to 0.18, a plain stick).
2. Head: hair as 10 to 12 thick swept locks (chains r 0.03, smoothUnion 0.02) with a fringe falling over the glasses on one side; the glasses (two tori R 0.04 r 0.005 with a bridge); big eyes; a hopeful open mouth (a small oval); round human ears.
3. Body: the folded collar (a flat shell ring 0.06 wide around the neck opening); the satchel (a box 0.1 x 0.08 x 0.04 with a flap and a strap torus over the left shoulder, three scroll cylinders r 0.012 poking out of the top); the belt with a square buckle box.
4. Held item: the wand rigid on `hand.R`, held up beside the head at shoulder height with the tip at y 0.75, at least 0.04 m clear of the head in every clip; the spark (a small displaced cone 0.05 tall, emissive) on `orb`. `./forge check apprentice` must end with `result ok` and the ground check must be ok.
5. Sprites: the messy hair, the glasses, the pale blue robe with the big collar, the satchel, and the spark must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/apprentice.ts. Finish with one `./forge all apprentice`.
