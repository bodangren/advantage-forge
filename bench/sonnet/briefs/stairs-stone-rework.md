# stairs-stone rework (architecture/building-parts/stairs-stone) -> assets/stairs-stone.ts

Rework the existing file in place. The steps are smooth pale slabs and the side blocks are small pillows sitting on the slabs; the whole reads as a plastic toy. Match the mockup docs/item-mockups/stairs-stone-mock.jpg: every step is made of two or three fat rounded blocks, the side walls are stacked blocks, the stone is a warm light grey, and the joints are dark.

Size stays: 1.2 m wide (X), 1.6 m run (Z), 1.0 m rise toward -Z, stands on y = 0, faces +Z. Five steps.

Changes:
1. Flight: build each step as a row of three rounded boxes (radius 0.035) across X, each 0.36 x 0.2 x 0.32 m, placed at the step's height with small random offsets (up to 0.015 m) in position and 2 to 3 degrees of yaw so the blocks look laid by hand. Dark gaps of 0.02 m between blocks. The risers are the block faces, no smooth slab under them. Fill the space under the flight with one dark box so no view shows a hollow.
2. Side walls: on each side, a stepped stack of rounded blocks (0.2 x 0.2 x 0.3 m, radius 0.035) that climbs with the steps and rises 0.2 m above each tread, forming a solid parapet. Same block treatment.
3. Paint: warm stone #a89e94 top faces, #7e746b sides, #4b4540 in the gaps (paint the gaps by darkening where the surface normal points sideways into a gap: a paintFn on the distance to the block centres works, or a darker base color with light top paint via a halfSpace above each tread). Roughness 0.9. Subtle `bump` grit only.
4. Two bodies: flight, side-blocks. Under 9,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render stairs-stone --fast`, look at out/stairs-stone/render.png; every step must read as separate chunky blocks with dark joints in the three-quarter view. At most three looks. Then `FORGE_WORKERS=2 ./forge all stairs-stone` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/stairs-stone.ts.
