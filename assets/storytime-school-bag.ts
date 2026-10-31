import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 school bags, picture props.
 * Role: the small school backpack of a five-year-old. Two bags use this source: Pat's bag
 *   (`storytime-school-bag`, red body with a round bump) and Ben's bag (`storytime-school-bag-ben`,
 *   green body with no bump). The week 1 pages show a bag on a back, on a floor, and on a wall hook.
 *   It must read as a small child's school backpack, not as an adventurer's pack.
 * Size: 0.244 m wide, 0.291 m tall with the grab loop, 0.128 m deep. The bag body alone is
 *   0.235 m wide and 0.254 m tall.
 * Why this size: Pat is 0.858 m tall with a shoulder span of about 0.23 m (assets/parts/
 *   humanoid-kind.ts, AGE5 shoulder x 0.13 at the age-5 torso scale). A 0.235 m bag is as wide as
 *   his shoulders, so it covers his back and leaves his arms and head clear. The body reaches from
 *   the shoulder line down to the hip line, so a reader sees a child's small bag and not a full
 *   body cover.
 * One idea: a soft child's backpack: a rounded main body, one wide front pocket, a short top grab
 *   loop, and two padded shoulder straps on the back.
 * The bump: one small round bulge, 0.084 m across, on the upper edge of the main body and a little
 *   to +X. It rises 0.018 m above the rounded top, so the bump changes the silhouette in the front
 *   view and in the three-quarter view. A soft fillet of 0.022 m blends it into the fabric, so it
 *   reads as something round inside the bag, not as a second pocket and not as a face. The bump is
 *   an option: Pat's bag has it and Ben's bag does not.
 * Palette, Pat: main body red `#d9483b`, front pocket yellow `#f2c230`, straps and grab loop dark
 *   blue `#2f4a7a`.
 * Palette, Ben: main body green `#3fa34d`, front pocket orange `#f59a2c`, straps and grab loop dark
 *   blue `#2f4a7a`.
 * Every pair differs by 0.3 or more in one channel, so the 1-bit line art draws a stroke at every
 *   part edge (src/storytime/line-art-pass.ts draws a stroke where the unlit color jumps by more
 *   than 0.2 across 4 px). Ben's green body differs from his blue shirt `#5c94e0` by 0.58 in the
 *   blue channel, and his bag differs from Pat's red bag by 0.6 in the red channel.
 * Materials: matte cloth, roughness 0.85, no metal, no glass.
 * Bodies: four, one per color, because a separate body holds one color and the color step at each
 *   edge is exact at every render scale. Vertex colors only (`texture: false`), because the texture
 *   bake left black specks on thin parts in rounds 34 to 36.
 * Detail: no zipper teeth, no stitches, no small buckles, no text, no face. Shape only.
 * Rig and animation: none.
 */

type Rgb = ReturnType<typeof rgb>;

/** The colors of one bag. Each entry is one hard boundary in the 1-bit line art. */
export interface SchoolBagColors {
  body: Rgb;
  bodyLight: Rgb;
  bodyDark: Rgb;
  pocket: Rgb;
  pocketDark: Rgb;
  strap: Rgb;
  strapLight: Rgb;
}

/** One bag: its asset name, its line, its colors, and whether the upper edge carries the bump. */
export interface SchoolBagOptions {
  name: string;
  description: string;
  colors: SchoolBagColors;
  bump: boolean;
}

const PAT_COLORS: SchoolBagColors = {
  body: rgb('#d9483b'),
  bodyLight: rgb('#e8695c'),
  bodyDark: rgb('#a8352b'),
  pocket: rgb('#f2c230'),
  pocketDark: rgb('#d8a018'),
  strap: rgb('#2f4a7a'),
  strapLight: rgb('#3d5c92'),
};

/** The main body: a rounded box with a domed top, cut flat on the ground plane. */
const bodyShape = (c: SchoolBagColors, bump: boolean) => {
  const base = sdf.smoothUnion(
    0.05,
    sdf.box([0.235, 0.225, 0.11], 0.05).at(0, 0.1125, 0),
    sdf.ellipsoid([0.112, 0.048, 0.052]).at(0, 0.2, 0),
  );
  // The round bump on the upper edge, a little to +X. The soft fillet keeps the fabric smooth.
  const shaped = bump
    ? base.smoothUnion(0.018, sdf.ellipsoid([0.042, 0.043, 0.047]).at(0.05, 0.236, 0))
    : base;
  return shaped.intersect(sdf.halfSpace([0, -1, 0], 0)).paintFn((x, y, z, paint) => {
    const weave = 0.5 + 0.5 * noise.fbm(x * 90, y * 90, z * 90, 2);
    const shade = 0.12 * weave + 0.22 * Math.max(0, (y - 0.16) / 0.1);
    const color = mixRgb(mixRgb(c.body, c.bodyLight, shade), c.bodyDark, 0.1 * (1 - weave));
    return mixRgb(paint, color, 0.94);
  });
};

/** The front pocket: one wide rounded pocket on the +Z face. */
const pocketShape = (c: SchoolBagColors) =>
  sdf.box([0.158, 0.104, 0.035], 0.015).at(0, 0.1, 0.052).paintFn((x, y, z, paint) => {
    const weave = 0.5 + 0.5 * noise.fbm(x * 110, y * 110, z * 110, 2);
    const color = mixRgb(c.pocket, c.pocketDark, 0.12 * (1 - weave));
    return mixRgb(paint, color, 0.94);
  });

/** One padded strap on the -Z side, from the top edge to the bottom corner. */
const strap = (side: 1 | -1, c: SchoolBagColors) =>
  sdf
    .chain(
      [
        [side * 0.055, 0.238, -0.044, 0.017],
        [side * 0.094, 0.15, -0.06, 0.017],
        [side * 0.096, 0.05, -0.058, 0.015],
      ],
      0.02,
    )
    .paintFn((x, _y, z, paint) => {
      const weave = 0.5 + 0.5 * noise.fbm(x * 120, _y * 120, z * 120, 2);
      return mixRgb(paint, mixRgb(c.strap, c.strapLight, 0.1 * weave), 0.94);
    });

/** The short top grab loop, for a wall hook in a later row. Its lower half sinks into the bag. */
const loopShape = (c: SchoolBagColors) =>
  sdf
    .torus(0.028, 0.011)
    .rotateX(90)
    .at(0, 0.252, -0.012)
    .paintFn((x, _y, z, paint) => {
      const weave = 0.5 + 0.5 * noise.fbm(x * 130, _y * 130, z * 130, 2);
      return mixRgb(paint, mixRgb(c.strap, c.strapLight, 0.1 * weave), 0.94);
    });

/** Build one school bag asset from its colors and its bump option. */
export function defineSchoolBag(options: SchoolBagOptions) {
  const c = options.colors;
  return defineAsset({
    name: options.name,
    description: options.description,
    detail: 0.0018,
    texture: false,

    build(k) {
      k.body('bag-body', bodyShape(c, options.bump), {
        color: c.body,
        roughness: 0.85,
        paintWeight: 1,
        detail: 0.0018,
      });
      k.body('pocket', pocketShape(c), {
        color: c.pocket,
        roughness: 0.85,
        paintWeight: 1,
        detail: 0.0015,
      });
      k.body('strap.L', strap(1, c), {
        color: c.strap,
        roughness: 0.85,
        paintWeight: 1,
        detail: 0.0015,
      });
      k.body('strap.R', strap(-1, c), {
        color: c.strap,
        roughness: 0.85,
        paintWeight: 1,
        detail: 0.0015,
      });
      k.body('grab-loop', loopShape(c), {
        color: c.strap,
        roughness: 0.85,
        paintWeight: 1,
        detail: 0.0015,
      });
    },
  });
}

export default defineSchoolBag({
  name: 'storytime-school-bag',
  description:
    "Pat's school bag: a small child's backpack with a red rounded body, a yellow front pocket, dark blue shoulder straps and a short top grab loop, and a small round bump on the upper edge.",
  colors: PAT_COLORS,
  bump: true,
});
