# troll-guard (enemies/humanoid/troll-guard) -> assets/troll-guard.ts

A big hunched troll about 1.15 m tall, faces +Z, on the orc warrior base (assets/orc-warrior.ts: the heavy rig with knee bones and a weapon hand; clips idle, walk, run, attack, attack2, roar, hit, death; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/troll-guard_001.jpg (set `reference` to that path). Match its idea: a big head with a huge bulbous nose, small pale blue eyes under a heavy brow, a wide underbite jaw with two big upward pale tusks, long pointed ears, a shaggy mane of dark rope-like hair that hangs around the face and down the chest; a small rusty iron helmet with a brow ridge and small spikes that sits too high on the head; a bare grey-green warty torso; a ragged brown leather kilt and a rope belt; big hands with thick fingers; bare flat three-toed feet; a heavy studded wooden club with an iron band held over the right shoulder.

Palette: skin #7a8a62 with shade #5a6a48 (compensate for the renderer, which lifts greens one step; not brighter than #8a9a70), warts by bump; hair #3a3228 rope strands; helmet #4a4a4e with rust #6a4a2a spots (roughness 0.6, metalness 0.5); tusks #d8ccae; kilt #5a3a24 with lighter patches #7a5a3a; club wood #6a4a2c with an iron band #3a3a3e; eyes #8fb8d8.
Variants: skin (grey-green default, blue-grey #6a7a88, brown #7a5a44), hair (dark default, grey #8a8a80, red #7a3a22), kilt (brown default, grey #4a4a4a, green #4a5a34).

Construction recipe:
1. Copy assets/orc-warrior.ts. Keep the rig, the clips, and the weapon hand. Make the head larger (ellipsoid 0.3 x 0.26 x 0.28) and hunch the torso forward (rotate the chest 12 degrees). Remove the pauldron and the topknot.
2. Face: a huge nose (ellipsoid r 0.07 on the face center), a wide lower jaw (a box-rounded ellipsoid under the mouth line that sticks out 0.03 m past the upper lip), two tusks rising from the jaw corners (cones r 0.03 to 0.008, 0.12 long), small eyes (r 0.018) under a heavy brow ridge, long pointed ears.
3. Hair: a mane of 14 to 18 `sdf.chain` rope strands from the crown down around the face and down to the chest (r 0.02 to 0.012), smoothUnion 0.01, strands in bump.
4. Helmet: a small half-sphere r 0.16 with a center ridge and four small spike cones, set high on the crown (y 0.98) with `bone: 'head'`.
5. Body: bare torso with warts (small spheres r 0.01 in a few places, and bump), a ragged kilt (a flared revolve with a torn hem), a rope belt (torus with a twist in bump), big hands, flat feet with three toes.
6. Club: a studded wooden club 0.7 m (cone r 0.03 to 0.07 with a flat end, an iron band, six studs) in `hand.R`, rested over the right shoulder at rest, a two-hand overhead slam in `attack`. `./forge check troll-guard` must end with `result ok` and the ground check must be ok.
7. Sprites: the nose, the tusks, the mane, the helmet, and the club must read at 128 px.

Limits: under 70,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/troll-guard.ts. Finish with one `./forge all troll-guard`.
