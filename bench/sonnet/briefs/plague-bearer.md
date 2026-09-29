# plague-bearer (enemies/undead/plague-bearer) -> assets/plague-bearer.ts

A bloated hooded undead about 1.05 m tall, faces +Z, on the zombie base (assets/zombie.ts: the shambling rig with knee bones; clips idle, walk, run, attack, hit, death, rise; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/plague-bearer_001.jpg (set `reference` to that path). Match its idea: a hunched sickly green-grey body with a big bloated belly; a pale tattered hooded coat, open at the front and belted with a dark leather strap, sleeves wrapped in bandages; a cracked brown leather beak mask over the lower face with one big round pale green eye above it (the other eye hidden under the hood); moss-green boils on the shoulder and wrist; bandaged clawed hands; ragged dark trousers with hanging straps; bare rotting feet; a rusty round lantern-pot hanging from the left hand with faint green fumes.

Palette: skin #8a9a6a with shade #6a7a4e (compensate for the renderer, which lifts greens one step) and dark spots by paintFn; coat #d8d2c0 with #b8b0a0 shade and stains (roughness 0.9); mask #6a4a30 with cracks in bump; eye #d8e8a0 with a dark pupil, emissive 0.4; belt #3a2e2a; trousers #3a3a40; bandages #c8c0a8; lantern #5a3a2a with rust and a green #8aff9a emissive glow inside (emissive 1.2); fumes #a8e8b8 opacity 0.5; boils #7a9a3a.
Variants: coat (pale default, black #2a2a30, red-brown #7a3a2a), glow (green default, yellow #ffe25a, violet #c07fff), skin (green-grey default, blue-grey #6a7a88, brown #7a5a44).

Construction recipe:
1. Copy assets/zombie.ts. Keep the rig and the clips. Enlarge the belly (an ellipsoid 0.32 x 0.28 x 0.28 at the waist, smoothUnion 0.04) and hunch the chest forward 10 degrees.
2. Hood and coat: a hood revolve around the head with a forward-leaning opening (the inside dark), a coat shell over the torso open in front (subtract a wedge) so the belly shows, sleeves as cones with bandage tori, a torn hem at mid-thigh (subtract wedges), a belt torus with a buckle.
3. Face: a beak mask (a cone from the face center forward and down 0.14 long, r 0.05 to 0.012, leather colored, with a strap torus around the head) and one big eye (sphere r 0.045 with a pupil) above it on the right side; the hood shadow covers the left.
4. Hands: bandaged with claw finger cones; boils as small spheres r 0.02 clusters on the right shoulder and left wrist.
5. Lantern: a sphere pot r 0.07 with a lid and a bail handle hanging from the left hand on the `hand.L` bone; a fumes body (three small translucent ellipsoids above the pot). Keep the attack as a swipe with the right claw; keep rise. `./forge check plague-bearer` must end with `result ok` (the lantern is a held item) and the ground check must be ok.
6. Sprites: the hood, the beak, the eye, the belly, and the lantern must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/plague-bearer.ts. Finish with one `./forge all plague-bearer`.
