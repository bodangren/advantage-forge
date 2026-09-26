# Vegetation and rocks

Worked example: `assets/oak-tree.ts` (flared roots, forked limbs, clumped canopy with
per-clump lighting, moss, wind sway).

## Stylized trees

The stylized-tree look comes from **distinct foliage clumps, each lit on its own**: a bright
top and a dark underside on every clump, around a bigger central mass. One smooth canopy blob
reads as a bush or broccoli.

- Trunk: `sdf.chain` from the ground up with decreasing radius and a slight lean; fork into
  2 or 3 limbs with more chains from the fork point. Let some limbs show between clumps.
- Roots: 4 to 6 short, thick cones from low on the trunk out to the ground (radius 0.15 to 0.07,
  reaching 0.4 to 0.55 m for a 3 m tree), blended with k about 0.1, and a flat cut at `y = 0`.
  Long thin roots look like spider legs.
- Bark: vertical ridges from noise stretched along Y (`noise.fbm(x * 22, y * 3, z * 22)`), in
  `displace` if you want a bumpy silhouette (a few centimeters) and in `paintFn` for darker
  grooves. Moss: a green tint on one side, near the ground, modulated by noise.
- Canopy: 7 to 12 spheres of varied size (range at least 1.7:1) placed over the limb ends and
  above the center, blended with a small k (0.1 to 0.15) so each stays a separate mass, then a
  large-scale noise `displace` (5 to 10 cm) for lumps and a fine one (2 cm) for leaf texture.
- Canopy color: for each point, find the nearest clump and mix dark to light by the height
  within that clump, plus a global height gradient and a few light patches:
  ```ts
  const local = clamp(((y - c.y) / c.r) * 0.6 + 0.45); // 0 underside, 1 top of this clump
  const t = local * 0.7 + global * 0.3;
  color = mix(mix(leafDark, leaf, t * 1.3), leafLight, max(0, t - 0.55) * 1.8 * patch);
  ```
- Mesh detail: trees are large, so use `detail` 0.014 to 0.02; the canopy can be coarser than
  the trunk.
- Wind: bones `root`, `trunk` (about a third up), `crown` (at the fork); tag trunk and roots,
  limbs and canopy to `crown`; sway with small rotations (1 to 2 degrees) at slightly different
  frequencies and offsets so it never looks mechanical.

## Other plants

- **Pine/fir**: a trunk plus stacked cones (`sdf.cone` with a large bottom radius and a sharp
  top), each tier smaller and darker at its underside; droop the tier edges with a small `bend`.
- **Bush**: 4 to 7 clumps like a small canopy, sitting on the ground, no trunk.
- **Flowers**: a stem `chain`, a center sphere, and petals as flattened ellipsoids rotated
  around the center (`rotateY(i * 360 / n)`). Saturated petals against green leaves are an
  accent; use them in small numbers.
- **Grass tufts**: 7 to 15 thin tapered cones from a common base, bent outward with different
  angles; keep them at least two cells thick or render them as a few wide blades.
- **Mushrooms**: a revolved cap profile (dome with a curled rim) on a slightly bent stem; spots
  painted with `noise.worley` cells or spheres as stencils.

## Rocks and boulders

- Start from a rounded box or a few intersected half spaces (a faceted chunk), then add
  `displace` with large-scale noise for the silhouette and `bump` for grain. Stylized rocks
  have **planar facets with soft edges**: intersect a sphere with 5 to 8 randomly tilted half
  spaces, then `.round(0.02)`.
- Color: a base gray with a warm or cool tint, darker in crevices (paint by noise), moss or
  lichen on the top faces (paint where the surface is high or faces up).
- Group rocks in sets of 3 sizes; a single rock rarely looks good alone.

## Failure modes seen in practice

- **Broccoli or lollipop tree**: one smooth canopy blob with no clumps and no visible limbs.
- **Spider roots**: roots too long and thin.
- **Flat green**: no value gradient between clump tops and undersides.
- **Uniform clumps**: all spheres the same size; vary sizes and place a dominant mass.
- **Mesh too heavy**: noise with high frequency in `displace` on a large object; move it to
  `bump` or raise `detail`.
