# clay-golem (enemies/construct/clay-golem) -> assets/clay-golem.ts

A stocky terracotta construct about 1.1 m tall, faces +Z, on the stone golem base (assets/stone-golem.ts: the heavy golem rig with knee bones; clips idle, walk, run, attack, attack2, roar, hit, death; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/clay-golem_001.jpg (set `reference` to that path). Match its idea: smooth rounded orange-brown clay everywhere; a rounded head with two round hollow dark eyes, a wide flat slot mouth, and a glowing amber gem set in the forehead; a small carved rune word on the chest; a big round belly with a carved shield-shaped panel; huge rounded shoulders; thick rounded arms with big blocky hands; short thick legs with rounded knee pads and wide flat feet with three toes; seams, cracks, and fingerprint dents as surface detail.

Palette: clay #c46a3a with shade #9a4e2a and lit #d8845a (roughness 0.85, metalness 0); eye holes #2a1a12; mouth slot #2a1a12; forehead gem #ffc23a emissive 1.6; carved lines darker by paintWhere.
Variants: clay (terracotta default, grey #8a8a86, dark #5a3a2a), gem (amber default, blue #3a9aff, green #5aff6a).

Construction recipe:
1. Copy assets/stone-golem.ts. Keep the rig and the clips. Replace every boulder with smooth rounded forms in one clay material: head (ellipsoid 0.26 x 0.22 x 0.24), chest and belly (two overlapping ellipsoids, belly 0.4 x 0.34 x 0.34), shoulders (spheres r 0.14), upper arms and forearms (capsules r 0.09 and 0.1), hands (rounded boxes 0.16 with four finger bumps), pelvis, legs (capsules r 0.1), knee pads (spheres), feet (rounded boxes 0.22 x 0.1 x 0.26 with three toe bumps). Use smoothUnion 0.02 between parts so the seams read as pressed clay.
2. Face: two hollow eyes (subtracted spheres r 0.03 with a dark inner body), a wide mouth slot (a subtracted box 0.16 x 0.03 x 0.06 with a dark inner body), a forehead gem (an ellipsoid set into a socket, emissive).
3. Surface: a carved rune word on the chest (five small extruded strokes intersected with a thin shell of the chest, painted darker), a shield-shaped panel outline on the belly (a thin extruded outline, painted darker), cracks and fingerprint dents in `bump` only.
4. Clips: keep the base clips; the attack is a heavy two-hand slam, attack2 a wide backhand. No held items. The ground check must be ok.
5. Sprites: the gem, the eye holes, the mouth slot, and the round silhouette must read at 128 px.

Limits: under 55,000 triangles, `detail` 0.005 on the head, 0.007 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/clay-golem.ts. Finish with one `./forge all clay-golem`.
