# highwayman (enemies/humanoid/highwayman) -> assets/highwayman.ts

A masked human road robber about 1.0 m tall, faces +Z, on the bandit base (assets/bandit.ts: the rogue rig with knee bones and a weapon hand; clips idle, walk, run, attack, hit, death, taunt; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/highwayman_001.jpg (set `reference` to that path). Match its idea: a big black leather tricorn hat with a stitched edge; a dark red cloth mask over the nose and mouth that hangs to the collar; big dark eyes under thick brows, short brown hair at the temples; a long dark grey wool coat with a wide raised collar, folded cuffs, and brass buttons down the front, open over a grey knitted waistcoat; a belt with a round brass buckle; dark leather breeches and tall dark brown boots with a folded top; dark brown gloves; a flintlock pistol in the right hand and a small gold coin purse in the left hand.

Palette: hat #26221f with a #3a3430 stitch band; mask #8a2a26 with #6a1e1c shade; skin #f0cfa8; hair #4a3222; brows #2a2420; coat #3d3f42 with #55585c lit and #2c2e30 creases (roughness 0.95); collar and cuffs #33353a; waistcoat #7a7770; buttons #b89040; belt #3a2a1e with brass #c9a24a; breeches #2a2622; boots #4a3020 with #5c3e2a folded tops; gloves #4a2e1e; pistol #2a2a2e with a #5a3a24 wooden stock; purse #d9b24a.
Variants: mask (red default, black #24201e, blue #2a4a7a), coat (grey default, black #202224, brown #4a3626), hat (black default, brown #4a3626, grey #5a5a60).

Construction recipe:
1. Copy assets/bandit.ts. Remove the loot sack and the cutlass. Keep the rig, the clips, and the weapon hand. Keep the mask shape if the base has one; otherwise build the mask as a cloth band.
2. Head: a tricorn (a flat round crown with the brim folded up on three sides: build the brim as a disc r 0.2, then cut three wedges and raise the rest with a smooth halfSpace bend, or build three rounded triangular flaps, a stitched edge in bump); a red mask band (a rounded box 0.16 x 0.09 x 0.1 that wraps the lower face and hangs 0.04 m below the chin as a soft point); big eyes and thick brows above it; short hair patches at the temples under the hat.
3. Body: a long coat (the torso body extended to a skirt shell that ends at y 0.28, split at the front; a raised collar as a ring 0.03 m tall behind the neck; folded cuffs as tori at the wrists; six brass buttons as small spheres in a column), a waistcoat panel in the open front, a belt with a round buckle, breeches, tall boots with a folded top band, gloves.
4. Weapons: a flintlock pistol 0.22 m (a barrel cylinder r 0.012, a lock box, a curved wooden grip) in `hand.R`, a coin purse (a rounded sphere 0.045 with a neck) in `hand.L`. The attack is a pistol point and a recoil. `./forge check highwayman` must end with `result ok` and the ground check must be ok.
5. Sprites: the tricorn, the red mask, the long grey coat, and the pistol must read at 128 px. The coat skirt must not swallow the legs: keep a 0.02 m gap and the boots visible.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/highwayman.ts. Finish with one `./forge all highwayman`.
