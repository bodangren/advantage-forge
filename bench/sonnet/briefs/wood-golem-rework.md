# wood-golem rework (enemies/construct/wood-golem) -> assets/wood-golem.ts

Owner request 2026-09-29: fix the wood golem. The current file builds (70,184 triangles, no warnings, seven clips, check ok) but the review in docs/character-reviews.json is 3.8/10 (materials 3, sprite 3, everything else 4). Bar 8/10 (character). Keep the rig, the clips, the bone names, the variant slots, and the overall design (driftwood planks, split-plank crown, amber core, vines); fix the reads.

Mockup: docs/enemy-mockups/wood-golem_001.jpg (already the `reference`). Base: assets/stone-golem.ts.

Review issues and the fixes to make:
1. Eyes: the two amber slits read as dark bars at 128 px. Make each eye a glowing amber slot: a rounded box 0.07 x 0.03 x 0.04 sunk 0.01 into the face, emissive amber #ffa519 on a dark base #4a1405, emissiveIntensity 2.0, plus a soft amber paint ring 0.01 wide on the bark around each slot (paintWhere), so the glow reads in the sprite.
2. Moss vs wood: the moss and the bark sit close in value. Darken the moss to #3a5518 with #2c4212 shade, roughness 1.0, and give it a lumpy displace (0.008); lighten the pale worn plank faces to #cdbb96 and keep the seams near-black #2a2119, so the bark reads as planks with dark gaps.
3. Legs: the shins are smooth cones. Carve three vertical root grooves into each shin (subtract thin rounded boxes 0.02 deep) and add a rope wrap (two tori, R matching the shin, r 0.02, #c2a06a) just below each knee; splay the feet as two root clumps (three toe knuckles each).
4. Side silhouette: the crown reads as one flat crest. Split the crown into five plank staves of different heights (0.06 to 0.16) and tilts (-15 to +15 degrees), two of them leaning back, so the side view shows a ragged staggered crown; add one more vine tendril curling over the left shoulder toward the front.
5. Materials (score 3): bark roughness 0.9 with a strong grain bump (fbm along y), rope roughness 0.95 with strand bump, core emissive amber on a dark base with a slightly larger hollow so the glow shows from the three-quarter view.
6. Sprite (score 3): after `./forge all wood-golem`, view sprites/preview.png; the eyes and the core must be visible amber points and the crown must break the outline in every direction. If they do not, raise the emissive intensity and the slot size before reporting.

Limits: under 75,000 triangles; keep `detail` values as in the file. No `warning:` lines. `./forge check wood-golem` must end with `result ok`. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/wood-golem.ts.
