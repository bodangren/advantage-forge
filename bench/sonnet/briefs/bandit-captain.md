# bandit-captain (enemies/humanoid/bandit-captain) -> assets/bandit-captain.ts

A human outlaw leader about 1.05 m to the hat crown, faces +Z, on the bandit base (assets/bandit.ts: the rogue rig with knee bones and a weapon hand; clips idle, walk, run, attack, hit, death, taunt; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/bandit-captain_001.jpg (set `reference` to that path). Match its idea: a wide flat-brim black hat with a tall flat crown and a red feather on the right side; a red bandana under the hat with a tail hanging on the left; a black eyepatch over the left eye with a strap; a big black beard and mustache, one dark eye, a round nose, a light skin face; a red neckerchief; a long black leather coat open in front with a wide flared collar and two rows of brass buttons; a brown vest with buttons; a wide brown belt with a big brass buckle; a dagger sheath on the belt; dark trousers; brown boots. Right hand: a curved steel cutlass held low. Left hand: a short dagger.

Palette: hat and coat black leather #2a2624 with lit #3f3a37 (roughness 0.55); bandana and neckerchief red #b8262e; feather #c8323a; beard #1c1815; skin #f0c9a2; vest #5a3a26; belt #6a3f22 with brass #c9a24a (metalness 0.8, roughness 0.35); trousers #2e2a30; boots #4a2a1c; cutlass steel #b9bcc4 with a #6a4a2a hilt.
Variants: cloth (red default, green #3f7a3f, blue #2f4f8a), coat (black default, brown #4a3020, grey #4a4a50), feather (red default, white #eee6d8, black #222).

Construction recipe:
1. Copy assets/bandit.ts. Remove the mask and the loot sack. Keep the rig, the clips, and the weapon hand.
2. Head: the hat is a wide flat disc brim (cylinder r 0.30, h 0.02) plus a flat-topped crown (a tapered cylinder r 0.19 to 0.17, h 0.13) sitting on the skull, a red feather (a thin bent extrude) on the right; a red bandana band under the brim; the eyepatch is a dark ellipse painted over the left eye with a thin black strap painted around the head; a big beard and mustache as smooth-united blobs in dark hair color; keep one visible eye.
3. Body: the coat is the torso body extended to a long open coat (a shell around the torso, cut open in front with a subtracted wedge, flared collar as two rounded boxes), coat tails to mid-shin, `bone` weights from the torso and legs. Two rows of brass button spheres on the coat front. The vest and belt with a big brass buckle (rounded box 0.06 x 0.05) sit inside the opening.
4. Weapons: a curved cutlass 0.5 m in `hand.R` (a curved extruded blade with a brass guard), a dagger 0.22 m in `hand.L`. `./forge check bandit-captain` must end with `result ok`.
5. Sprites: the hat brim, the feather, the beard, and the red neckerchief must read at 128 px.

Limits: under 70,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/bandit-captain.ts. Finish with one `./forge all bandit-captain`.
