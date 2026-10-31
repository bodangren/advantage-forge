import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1, Pat's school bag, a picture prop.
 * Role: Pat's own school bag. The week 1 pages show it on his back, on the floor behind Ben, and
 * on a wall hook in a later row. It must read as a small child's school backpack, not as an
 * adventurer's pack.
 * Size: 0.244 m wide, 0.291 m tall with the grab loop, 0.128 m deep. The bag body alone is
 * 0.235 m wide and 0.254 m tall.
 * Why this size: Pat is 0.858 m tall with a shoulder span of about 0.23 m (assets/parts/
 * humanoid-kind.ts, AGE5 shoulder x 0.13 at the age-5 torso scale). A 0.235 m bag is as wide as
 * his shoulders, so it covers his back and leaves his arms and head clear. The body reaches from
 * the shoulder line down to the hip line, so a reader sees a child's small bag and not a full
 * body cover.
 * One idea: a soft child's backpack: a rounded main body, one wide front pocket, a short top grab
 * loop, and two padded shoulder straps on the back.
 * The bump: one small round bulge, 0.084 m across, on the upper edge of the main body and a little
 * to +X. It rises 0.018 m above the rounded top, so the bump changes the silhouette in the front
 * view and in the three-quarter view. A soft fillet of 0.022 m blends it into the fabric, so it
 * reads as something round inside the bag, not as a second pocket and not as a face.
 * Palette (three clear colors, each a hard boundary): main body red `#d9483b`, front pocket yellow
 * `#f2c230`, straps and grab loop dark blue `#2f4a7a`. Each pair differs by 0.47 or more in one
 * channel, so the 1-bit line art draws a stroke at every part edge (src/storytime/line-art-pass.ts
 * draws a stroke where the unlit color jumps by more than 0.2 across 4 px).
 * Materials: matte cloth, roughness 0.85, no metal, no glass.
 * Bodies: four, one per color, because a separate body holds one color and the color step at each
 * edge is exact at every render scale. Vertex colors only (`texture: false`), because the texture
 * bake left black specks on thin parts in rounds 34 to 36.
 * Detail: no zipper teeth, no stitches, no small buckles, no text, no face. Shape only.
 * Rig and animation: none.
 */

const RED = rgb('#d9483b');
const RED_LIGHT = rgb('#e8695c');
const RED_DARK = rgb('#a8352b');
const YELLOW = rgb('#f2c230');
const YELLOW_DARK = rgb('#d8a018');
const BLUE = rgb('#2f4a7a');
const BLUE_LIGHT = rgb('#3d5c92');

/** The main body: a rounded box with a domed top, cut flat on the ground plane. */
const bodyShape = sdf
  .smoothUnion(
    0.05,
    sdf.box([0.235, 0.225, 0.11], 0.05).at(0, 0.1125, 0),
    sdf.ellipsoid([0.112, 0.048, 0.052]).at(0, 0.2, 0),
  )
  // The round bump on the upper edge, a little to +X. The soft fillet keeps the fabric smooth.
  .smoothUnion(0.018, sdf.ellipsoid([0.042, 0.043, 0.047]).at(0.05, 0.236, 0))
  .intersect(sdf.halfSpace([0, -1, 0], 0))
  .paintFn((x, y, z, base) => {
    const weave = 0.5 + 0.5 * noise.fbm(x * 90, y * 90, z * 90, 2);
    const shade = 0.12 * weave + 0.22 * Math.max(0, (y - 0.16) / 0.10);
    const color = mixRgb(mixRgb(RED, RED_LIGHT, shade), RED_DARK, 0.10 * (1 - weave));
    return mixRgb(base, color, 0.94);
  });

/** The front pocket: one wide rounded pocket on the +Z face. */
const pocketShape = sdf.box([0.158, 0.104, 0.035], 0.015).at(0, 0.1, 0.052).paintFn(
  (x, y, z, base) => {
    const weave = 0.5 + 0.5 * noise.fbm(x * 110, y * 110, z * 110, 2);
    const color = mixRgb(YELLOW, YELLOW_DARK, 0.12 * (1 - weave));
    return mixRgb(base, color, 0.94);
  },
);

/** One padded strap on the -Z side, from the top edge to the bottom corner. */
const strap = (side: 1 | -1) =>
  sdf
    .chain(
      [
        [side * 0.055, 0.238, -0.044, 0.017],
        [side * 0.094, 0.15, -0.06, 0.017],
        [side * 0.096, 0.05, -0.058, 0.015],
      ],
      0.02,
    )
    .paintFn((x, _y, z, base) => {
      const weave = 0.5 + 0.5 * noise.fbm(x * 120, _y * 120, z * 120, 2);
      return mixRgb(base, mixRgb(BLUE, BLUE_LIGHT, 0.1 * weave), 0.94);
    });

/** The short top grab loop, for a wall hook in a later row. Its lower half sinks into the bag. */
const loopShape = sdf
  .torus(0.028, 0.011)
  .rotateX(90)
  .at(0, 0.252, -0.012)
  .paintFn((x, _y, z, base) => {
    const weave = 0.5 + 0.5 * noise.fbm(x * 130, _y * 130, z * 130, 2);
    return mixRgb(base, mixRgb(BLUE, BLUE_LIGHT, 0.1 * weave), 0.94);
  });

export default defineAsset({
  name: 'storytime-school-bag',
  description:
    "Pat's school bag: a small child's backpack with a red rounded body, a yellow front pocket, dark blue shoulder straps and a short top grab loop, and a small round bump on the upper edge.",
  detail: 0.0018,
  texture: false,

  build(k) {
    k.body('bag-body', bodyShape, { color: RED, roughness: 0.85, paintWeight: 1, detail: 0.0018 });
    k.body('pocket', pocketShape, { color: YELLOW, roughness: 0.85, paintWeight: 1, detail: 0.0015 });
    k.body('strap.L', strap(1), { color: BLUE, roughness: 0.85, paintWeight: 1, detail: 0.0015 });
    k.body('strap.R', strap(-1), { color: BLUE, roughness: 0.85, paintWeight: 1, detail: 0.0015 });
    k.body('grab-loop', loopShape, { color: BLUE, roughness: 0.85, paintWeight: 1, detail: 0.0015 });
  },
});
