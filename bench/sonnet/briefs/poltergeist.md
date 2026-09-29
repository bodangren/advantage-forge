# poltergeist (enemies/undead/poltergeist) -> assets/poltergeist.ts

A small grinning ghost about 0.85 m tall with four small household objects orbiting it, faces +Z, on the ghost base (assets/ghost.ts: a floating rig with a hover move; clips idle, walk, attack, hit, death, taunt; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/poltergeist_001.jpg (set `reference` to that path). Match its idea: a big round pale violet head with two large black eyes with a glint, a huge wide grin full of square white teeth, a small smile bump for a nose; a short sheet body with a wavy scalloped hem, two stubby arms raised with three fingers each, two tiny feet under the hem; a faint violet glow; four small objects float in a ring around it at chest to head height: a wooden stool, a tin plate, a candlestick with a candle, and a blue book.

Palette: body #cfc4f0 with shade #a898d8 (roughness 0.6, opacity 0.92); teeth #f2ecd8; eyes #14121a with white glints; glow: emissive 0.3 on the body base; stool wood #7a3a2a; plate #b8bcc4 (metalness 0.6); candle #efe4c0 with a brass #b08a3a holder; book #3a4f8a with a #d8c8a0 page edge.
Variants: body (violet default, mint #bfe8d0, peach #f0d0c0), eyes (black default, cyan glow #4fe8ff, red #ff4a4a).

Construction recipe:
1. Copy assets/ghost.ts. Keep the hover rig and the clips. Make the head larger (ellipsoid 0.3 x 0.28 x 0.28) and the body a short sheet (revolve from the neck to a scalloped hem at y 0.12, hem waves by displacing with sin(atan2(z, x) * 6)). Two tiny feet spheres reach y 0 so the asset stands on the ground plane.
2. Face: two big eye spheres r 0.045 set into the head with white glints; a wide grin: a subtracted flat box mouth 0.2 x 0.06 with a dark inner body and two rows of small box teeth (loop 8 across), lips as a thin torus segment in the body color.
3. Arms: two stubby cones raised at 30 degrees with three finger cones each.
4. Orbit objects: four small bodies on their own bones (`orbit1`..`orbit4`, parented to the root) placed on a ring r 0.42 at y 0.55 to 0.8, each built at small scale: a stool (a box seat with four leg cones, 0.12 tall), a plate (a flattened cylinder r 0.07), a candlestick (a cylinder holder with a candle and a small orange emissive flame), a book (a box 0.1 x 0.12 x 0.03 with a lighter page edge). In every clip rotate the ring (each orbit bone rotates about Y by phase * 360 plus an offset) and bob them by move y.
5. Clips: idle hovers and grins; attack flings the objects outward (orbit bones move out by 0.15 and back); death drops the objects (move y down) while the ghost fades (scale down). No held items; the ground check must be ok.
6. Sprites: the grin, the eyes, and the orbiting objects must read at 128 px.

Limits: under 50,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/poltergeist.ts. Finish with one `./forge all poltergeist`.
