# spike-trap rework (props/world/spike-trap) -> assets/spike-trap.ts

Rebuild the existing file in place to match the mockup docs/item-mockups/spike-trap-mock.jpg. The current build is a thin flat slab with sixteen thin spikes; it reads as a bed of nails, not a trap. The mockup is four chunky rounded stone blocks around a round pressure plate, with one large spike on each block.

Size: 1.0 x 1.0 m footprint, stands on y = 0, faces +Z. Blocks 0.16 m tall; spikes reach y 0.45.

Construction recipe:
1. Four stone blocks: rounded boxes [0.44, 0.16, 0.44] radius 0.04, centered at (±0.26, 0.08, ±0.26), each with `.displace(0.008, noise.fbm(...))` for a hewn look and a slightly wider foot. One stone body, cool gray #6f7680 with a darker #4b525c on the sides via paintWhere and a worn #8a8e96 top. Roughness 0.9.
2. Pressure plate: a cylinder r 0.16, height 0.06, at the center (y 0.03) in the same stone, with a raised rim torus and a flat gold arrow (an extruded triangle 0.12 m, 0.01 m thick, pointing +Z) on top in #d4a93a, metalness 1, roughness 0.35.
3. Spikes: one big cone per block, base r 0.06 at the block top, tip r 0.006 at y 0.45, with a socket ring (torus r 0.07/0.015 in dark stone) around the base where it leaves the block. Iron #4a4f55 with a #a8acb1 highlight on the top third via paintWhere, roughness 0.5, metalness 0.7. One iron body.
4. A tiny accent: one small rust-red blob #8a3a2a (sphere r 0.03) at a front block edge, like the mockup's hint.

Checks: `FORGE_WORKERS=2 ./forge render spike-trap --fast`, look at out/spike-trap/render.png; four thick blocks and four tall spikes must read in the front view with a visible center plate in the three-quarter view. At most three looks. Then `FORGE_WORKERS=2 ./forge all spike-trap` once. Under 6,000 triangles, no `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/spike-trap.ts.
