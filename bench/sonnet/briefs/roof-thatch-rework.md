# roof-thatch rework (architecture/building-parts/roof-thatch) -> assets/roof-thatch.ts

Rework the existing file in place. The render is a flat yellow slab with faint comb lines and a row of balls along the eave; the mockup docs/item-mockups/roof-thatch-mock.jpg is shaggy thatch: thick overlapping bundles of straw that droop over the eave, under a plump pale ridge cap.

Size and placement stay: 2.0 m along X, 1.4 m down the slope, eave edge on y = 0 at +Z, ridge at -Z, crest about 1.32 m. Keep the bodies: thatch, ridge-roll, lashing.

Changes:
1. Build in a local flat frame (X across, Z down the slope) and place the union with a helper that applies the pitch, like the slate roof.
2. Thatch: four courses down the slope. Each course is a row of twelve fat capsules lying along Z (r 0.11, length 0.55), side by side with 0.02 m overlap, blended with smoothUnion 0.05 so they read as one shaggy bundle row; each capsule gets a random tilt of 2 to 5 degrees and a random Z offset up to 0.05 m. Courses overlap by 0.2 m. The lowest course droops: rotate it 12 degrees more than the pitch so its ends hang below the eave line, and give its ends a slight downward bend (`.bend`). Displace the whole thatch with `.displace(0.015, noise.fbm(x*8, y*8, z*30, 2))` for straw striations along Z. Backing slab 0.1 m thick under everything, closed underside.
3. Paint: straw #e0b85a on top, #b8903c in the valleys between capsules, #8a6a2a at the drooping ends. Roughness 0.9.
4. Ridge roll: a plump pale slab [2.1, 0.22, 0.5] radius 0.1 in #efd48a straddling the crest, with the two existing rope lashings kept.

Checks: `FORGE_WORKERS=2 ./forge render roof-thatch --fast`, look at out/roof-thatch/render.png; the surface must read as rows of thick bundles with shadowed valleys, and the eave must hang shaggy in the side view. At most three looks. Then `FORGE_WORKERS=2 ./forge all roof-thatch` once. Under 14,000 triangles, no `warning:` lines. Update the design note. Never commit. Only edit assets/roof-thatch.ts.
