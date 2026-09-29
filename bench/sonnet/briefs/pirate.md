# pirate (enemies/humanoid/pirate) -> assets/pirate.ts

A grinning human pirate deckhand about 1.0 m tall, faces +Z, on the bandit base (assets/bandit.ts: the rogue rig with knee bones, a cutlass in `hand.R`, a loot sack; clips idle, walk, run, attack, hit, death, taunt; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/pirate_001.jpg (set `reference` to that path). Match its idea: a red bandana tied over the head with a knot and a hanging tail at the back left; black hair at the temples; thick black brows, big dark eyes, a round nose, a big curled black moustache and a short chin beard; a wide grin with a teeth strip; a gold hoop earring on each ear; a blue and cream horizontally striped shirt with a blue collar and rolled cream cuffs; an open brown leather vest with two brass buttons; a wide brown belt with a big brass buckle and a diagonal strap; dark rolled trousers with grey cuffs at the knee; bare feet; a cutlass with a brass guard in the right hand.

Palette: bandana #c83a30 with #9a2a22 shade (roughness 0.9); hair, brows, moustache #24201c; skin #f0c8a0 with #e8a090 cheeks; teeth #f0ece0; earrings #d8b040 (metalness 0.9); shirt stripes #2a6aa8 and #ece4d0 (paintFn by y, stripe period 0.03 m), collar #2a6aa8, cuffs #ece4d0; vest #6a4a30 with #8a6a48 lit; buttons and buckle #c9a24a (metalness 0.8); belt and strap #4a3222; trousers #2a2a2e with #6a6a64 cuffs; cutlass blade #a0a4aa with a #d0d4d8 edge, guard #c9a24a, grip #2a2a2e.
Variants: bandana (red default, blue #2a4a7a, black #24201c), shirt stripe (blue default, red #a83a30, green #3a6a3a), vest (brown default, black #2a2622, tan #a08060).

Construction recipe:
1. Copy assets/bandit.ts. Remove the mask and the loot sack. Keep the rig, the clips, the weapon hand, and the cutlass (widen the guard into a brass cup).
2. Head: a bandana (a cap 1.05x the skull cut at the brow line, with a folded band torus at the edge, a knot sphere at the back left, and a tail flap chain 0.1 m long hanging behind the ear); hair patches at the temples; thick brows, big eyes, a round nose; a curled moustache (two mirrored chains r 0.012 that curl up at the tips) and a chin beard patch; a wide grin cut with a teeth strip; hoop earrings (tori R 0.014 r 0.003 at each ear).
3. Body: a striped shirt (the torso body with paintFn horizontal stripes) with a collar ring and rolled cuff tori at the elbows, bare forearms; an open vest (two front flaps with two button spheres); a belt with a big buckle and a diagonal strap; trousers with cuff tori at the knees; bare feet with toe bumps (three small spheres per foot).
4. Weapon: the cutlass in `hand.R`, held low at the side. The attack is a slash. `./forge check pirate` must end with `result ok` and the ground check must be ok.
5. Sprites: the red bandana, the striped shirt, the moustache, and the cutlass must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/pirate.ts. Finish with one `./forge all pirate`.
