# pit-trap rework (props/world/pit-trap) -> assets/pit-trap.ts

Rebuild the existing file in place. The current build is a thin tile with a black box hanging 0.6 m below the ground: in the render it reads as a table, and in a scene the box would pass through the ground tile under it. Match the mockup docs/item-mockups/pit-trap-mock.jpg: a chunky raised flagstone tile with an open square pit, tall spikes rising from the pit floor past the rim, a skull and pebbles.

Everything stays on or above y = 0. Size: 2.0 x 2.0 m footprint, tile 0.3 m thick (top at y 0.3), pit 1.2 x 1.2 m open from y 0.04 (pit floor) to the top, front toward +Z.

Construction recipe:
1. Tile: a rounded box [2.0, 0.3, 2.0] radius 0.04 minus the pit box [1.2, 0.4, 1.2] at y 0.24 (so the pit floor is at y 0.04). Split the tile top into flagstones: subtract shallow groove boxes 0.03 m wide and 0.03 m deep along a 4 x 4 grid, and displace the whole tile by 0.01 with fbm noise for a hewn look. Stone #7d746a with #5c554d on the sides and #3e3832 in the grooves, roughness 0.9. One body.
2. Spikes: nine cones in a 3 x 3 grid on the pit floor, base r 0.07 at y 0.04, tip r 0.006 at y 0.75 (0.45 m above the rim), each with a socket disc r 0.09 at the base. Dark iron #4a4f55 with the top third painted highlight #a8acb1. One body.
3. Bones: a skull sphere r 0.1 with two dark eye pits, lying on the pit floor in a corner, plus two bone capsules, bone #f0e2c4. One body.
4. Debris: five small pebbles (spheres r 0.04 to 0.06, flattened) on the tile top near the rim, and two broken planks [0.5, 0.04, 0.12] in walnut #8a5a35 lying across one corner of the pit, one broken in two. Planks one body, pebbles part of the stone body.

Checks: `FORGE_WORKERS=2 ./forge render pit-trap --fast`, look at out/pit-trap/render.png; the front view must show a thick tile with spikes rising above it, and the three-quarter view must show the open pit with the spikes and skull inside. At most three looks. Then `FORGE_WORKERS=2 ./forge all pit-trap` once. Under 8,000 triangles, no `warning:` lines. Update the design note. Never commit. Only edit assets/pit-trap.ts.
