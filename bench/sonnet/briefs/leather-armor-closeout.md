# leather-armor rework (equipment/armor/leather-armor) -> assets/leather-armor.ts

Rework the existing file in place. Priority P0: the target score is 7.5 of 10. Reference: docs/item-mockups/leather-armor-mock.jpg.

The avatar fit passes today: the torso shell fits the avatar base at `fitScale: 2`. Keep the torso shell, its size, the `equip` block (origin [0, Y_HEM, 0], hides, displayOnly), and the body name `stand`. Change the details that differ from the mock:
1. Skirt: the current lower part is a tattered fringe. Make it a neat peplum: a short skirt below the belt that ends in a shallow point at the front center, with a stitched hem, no fringe and no torn tabs.
2. Shoulders: the current shoulders are flat discs. Make curved pauldrons that follow the shoulder: two overlapping leather lames per side, each with a rolled edge, held by a short strap with a small brass buckle.
3. Chest: add the pointed chest flap of the mock (a front panel that overlaps diagonally and ends in a rounded point), and two straps that cross over the chest from the shoulders with small brass buckles.
4. Belt: keep the belt with the brass buckle; add 4 to 6 small brass studs on it.
5. Paint: remove the light zigzag shapes on the vest (they read as noise). Use one leather tone #a0613a with a darker edge #6e3f22 and cream stitch lines.
6. Stand: replace the cross foot with a round wooden disc base (0.4 m diameter, 0.06 m tall, with a rounded edge) and the post, as in the mock.

After the last edit, run `./forge check leather-armor` (it must end `fit ok`) and `FORGE_WORKERS=2 ./forge render avatar-base --wear leather-armor --fast --views front,three-quarter,side`, and look at out/avatar-base+leather-armor/render.png once: nothing of the base may show through the armor, and the pauldrons may not cover the face. These two looks count in the budget.

Rules: put fine surface detail (grain, grooves, stitching, pits) in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick. Keep the file path, the `name`, the export, and the catalog role. Keep the `equip` block and the torso fit.

Checks: `FORGE_WORKERS=2 ./forge render leather-armor --fast`, then look at out/leather-armor/render.png and compare with the reference. At most 6 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all leather-armor` once (it can wait for a build slot; give it a long timeout), and look at out/leather-armor/sprites/preview.png once. No `warning:` lines. Run `node scripts/typecheck-asset.mjs leather-armor` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/leather-armor.ts.
