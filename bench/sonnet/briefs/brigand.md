# brigand (enemies/humanoid/brigand) -> assets/brigand.ts

A rough human outlaw about 1.0 m tall, faces +Z, on the bandit base (assets/bandit.ts: the rogue rig with knee bones and a weapon hand; clips idle, walk, run, attack, hit, death, taunt; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/brigand_001.jpg (set `reference` to that path). Match its idea: an olive-green cloth hood pulled up over a dark leather skullcap band with rivets; heavy angry black brows, small dark eyes, a big red nose, a scar mark on the forehead, an open snarling mouth; a full bushy brown beard; a grey-brown padded tunic under a brown leather jerkin with shoulder plates; chainmail sleeves (dimple bump) on the upper arms; a diagonal chest strap with a brass buckle; a wide belt with a big brass buckle, a coin pouch, a small knife and hanging leather tabs; wrapped forearms; dark trousers and worn boots; a chipped hand axe in the right hand and a round wooden buckler with an iron rim on the left arm.

Palette: hood #6a7a4a with shade #4e5a34; skullcap band #2e2a26 with #7a7a80 rivets; skin #e8c49a with a #d88a70 nose; beard #6a4028 with #8a5a3a lit strands in bump; brows #2a2420; tunic #6a6660; jerkin #6a4a30 with #8a6a48 lit; chainmail #7a7a74 (metalness 0.6); straps and belt #4a3222 with brass #c9a24a; trousers #3a3a40; boots #4a3a2c; axe head #8a8a92 with a #5a3a24 haft; buckler wood #7a5a3a with an iron rim #4a4a50.
Variants: hood (green default, brown #6a4a30, black #2a2a2e), jerkin (brown default, black #2a2622, red #7a2a22), beard (brown default, black #24201c, grey #8a8a80).

Construction recipe:
1. Copy assets/bandit.ts. Remove the mask, the loot sack, and the cutlass. Keep the rig, the clips, and the weapon hand.
2. Head: a hood (a revolve around the skull open at the face, draped to the shoulders, a peak fold on top) with a skullcap band (a torus scaled [1, 0.5, 1] at the brow with six rivet spheres) under its front edge; heavy tilted brows, small eyes, a big nose sphere, a scar (a short dark extruded stroke on the forehead), an open mouth cut with a dark inner body; a full beard (a rounded bib ellipsoid 0.2 x 0.16 x 0.1 plus two cheek lobes) that leaves the nose and eyes bare, strand grooves in bump.
3. Body: a padded tunic (the torso body), a leather jerkin shell over it with two shoulder plates (rounded caps) and a torn hem, chainmail upper arms (dimple bump), a diagonal chest strap with a buckle, a wide belt with a big buckle, a coin pouch (rounded box), a small knife, and three hanging leather tabs; wrapped forearms (stacked tori); boots.
4. Weapons: a hand axe 0.35 m (a haft with a chipped wedge head, one notch subtracted) in `hand.R`, a round buckler r 0.12 with an iron rim and a center boss on the left forearm (`bone: 'forearm.L'`). The attack is a chop. `./forge check brigand` must end with `result ok` and the ground check must be ok.
5. Sprites: the hood, the beard, the axe, and the buckler must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/brigand.ts. Finish with one `./forge all brigand`.
