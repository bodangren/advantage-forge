# key-skeleton pass (items/quest-and-treasure/key-skeleton) -> assets/key-skeleton.ts

One more pass on the existing file (owner decision of 2026-10-02). The file is not committed; edit it in place. Priority P2: the target score is 7.0 of 10. Reference: docs/item-mockups/key-skeleton-mock.jpg. The base of the key family is assets/key-iron.ts (read it for the size and the pose).

Last review (6.8): the key lies flat with the skull bow on top, so the skull face looks up. In the front and three-quarter views and in the front sprites, the skull is a plain ball; the eye pits show only from above. The jaw and teeth hide behind the skull. The bit is a plain comb.

Changes:
1. Turn the skull so its face looks toward +Z (the camera) while the key still lies along X on y = 0. The skull may stand up from the shaft a little, so the face is clear above the ground.
2. Skull face, large and simple: two big, deep, round eye sockets (radius about 0.012 m each, painted near black #1a1410 inside), a small upside-down heart nose hole, cheekbones, and a jaw below with 4 to 5 square teeth separated by dark gaps. The face must read in the front sprites at 128 px.
3. Shaft: 3 to 4 vertebra knobs (rings that bulge) along the shaft, as in the mock.
4. Bit: a small bone shape (a short bar with two round knobs at its end) with one C-shaped tooth, instead of the comb.
5. Color: bone ivory #efe6cf with soft shading #cfc3a5 in the creases; roughness 0.6, metalness 0.

Keep the size within 10 percent of the current bounds (0.24 x 0.065 x 0.07 m); the skull can make it taller, up to 0.09 m.

Rules: put fine surface detail (grain, grooves, stitching, pits) in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick. Keep the file path, the `name`, the export, and the catalog role. 

Checks: `FORGE_WORKERS=2 ./forge render key-skeleton --fast`, then look at out/key-skeleton/render.png and compare with the reference. At most 5 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all key-skeleton` once (it can wait for a build slot; give it a long timeout), and look at out/key-skeleton/sprites/preview.png once. No `warning:` lines. Run `node scripts/typecheck-asset.mjs key-skeleton` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/key-skeleton.ts.
