import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — chunky wooden water bucket (catalog props/containers/bucket).
 *
 * Role: interactable village prop for a cozy chibi hamlet; must read at 128 px.
 * Size: 0.30 m wide, 0.32 m tall body, iron bail arching to ~0.44 m; stands on
 *   y = 0, faces +Z.
 * One idea: eight fat staves whose sawn tops stand proud as chunky blocks, in
 *   warm oak with dark painted seams, hugged by two dark iron hoops and holding
 *   bright blue water under a thick solid iron bail.
 * Shape language: round dominant (revolved tapered barrel, hoop rings, bail
 *   arc), one square accent (the eight blocky stave tops and the iron lugs).
 * Palette: honey oak #b5814a / warm brown #8a5a35 (dominant wood), pale cut
 *   wood #c9a06a (rim top), dark walnut #6b4226 (foot shade), deep groove
 *   #43260f; iron #4a4f55 with #363a3f shade and #a8acb1 highlight; water
 *   #3fa8c8 (roughness 0.1).
 * Materials: wood (roughness 0.82, metalness 0), worn iron (roughness 0.5,
 *   metalness 0.7), glossy water (roughness 0.1, metalness 0).
 * Detail list: primary tapered stave body + proud block rim; secondary water
 *   disc, two iron hoops; tertiary lugs + bail, stave seams and grain in
 *   paint/bump. Focal point: blue water framed by the dark round rim.
 * Rig/animation: none (static prop).
 */

const WOOD_HONEY = rgb('#b5814a');
const WOOD_BROWN = rgb('#8a5a35');
const WOOD_PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const GROOVE = rgb('#43260f');

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

const WATER = rgb('#3fa8c8');
const WATER_HI = rgb('#7fd6e8');

const STAVES = 8;
const STEP = 360 / STAVES; // 45 deg per stave
const H = 0.32; // rim height
const WATER_Y = H - 0.03; // water surface 3 cm below the rim

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Radial stave profile: 8 soft lobes, crest at c = +1 (board centre) and a
 * shallow seam at c = -1. A form change, so it lives in `displace`; the dark
 * seam itself is paint, never a hole.
 */
const staveWave = (x: number, _y: number, z: number): number => {
  const r = Math.hypot(x, z);
  if (r < 0.05) return 0;
  const ramp = clamp01((r - 0.05) / 0.05);
  return Math.cos(Math.atan2(z, x) * STAVES) * ramp;
};

/** Wood fields: painted seam darkness (1 at a stave seam) and a board tint. */
function staveAt(x: number, z: number) {
  const aDeg = (Math.atan2(z, x) * 180) / Math.PI;
  // Seams sit halfway between the lobe crests (which are at k * STEP).
  const m = (((aDeg - STEP / 2) % STEP) + STEP) % STEP;
  const dist = Math.min(m, STEP - m);
  const groove = clamp01((7 - dist) / 7);
  // Continuous around the rim, so the boards vary without a hard paint seam.
  const tint = 0.5 + 0.5 * noise.fbm(Math.cos((aDeg * Math.PI) / 180) * 2.4, 0.3, Math.sin((aDeg * Math.PI) / 180) * 2.4, 2);
  return { groove, tint };
}

const woodPaint = (x: number, y: number, z: number) => {
  const { groove, tint } = staveAt(x, z);
  let c = mixRgb(WOOD_BROWN, WOOD_HONEY, 0.12 + 0.45 * tint);
  const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
  c = mixRgb(c, WALNUT, 0.3 * patch);
  const grain = 0.5 + 0.5 * noise.fbm(x * 44, y * 9, z * 44, 2);
  c = mixRgb(c, WOOD_PALE, 0.12 * grain);
  // Dark seams between staves (paint, never a hole).
  c = mixRgb(c, GROOVE, 0.95 * groove);
  // Sawn pale tops of the staves, warm mid-height, shaded foot.
  c = mixRgb(c, WOOD_PALE, 0.55 * clamp01((y - 0.295) / 0.025));
  c = mixRgb(c, WOOD_HONEY, 0.22 * clamp01((y - 0.1) / 0.16));
  c = mixRgb(c, WALNUT, 0.5 * clamp01((0.045 - y) / 0.045));
  return c;
};

const woodBump = (x: number, y: number, z: number): number => {
  const { groove } = staveAt(x, z);
  return -0.004 * groove + 0.0012 * noise.fbm(x * 36, y * 36, z * 36, 2);
};

const ironPaint = (x: number, y: number, z: number) => {
  const t = clamp01(y / 0.44);
  let c = mixRgb(IRON_DARK, IRON, 0.15 + 0.5 * t);
  const speck = 0.5 + 0.5 * noise.fbm(x * 45, y * 45, z * 45, 2);
  c = mixRgb(c, IRON_HI, 0.14 * speck);
  return c;
};

const waterPaint = (x: number, y: number, z: number) => {
  const swirl = 0.5 + 0.5 * noise.fbm(x * 10, y * 10, z * 10, 2);
  let c = mixRgb(WATER, WATER_HI, 0.1 * swirl);
  c = mixRgb(c, WATER, 0.2 * clamp01((0.2 - Math.hypot(x, z)) / 0.2));
  return c;
};

export default defineAsset({
  name: 'bucket',
  description:
    'Wooden water bucket: eight chunky sawn staves with painted seams, two iron hoops, blue water, and a thick solid iron bail.',
  detail: 0.009,
  reference: 'docs/item-mockups/bucket-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ staves
    // Tapered bucket wall with a thick floor; eight soft lobes in `displace`
    // give the stave form, and dark painted seams (never holes) divide them.
    const outerProfile = profile.polygon(
      [
        [0, 0],
        [0.06, 0],
        [0.098, 0],
        [0.112, 0.006],
        [0.122, 0.022],
        [0.132, 0.07],
        [0.14, 0.14],
        [0.146, 0.22],
        [0.15, 0.285],
        [0.15, 0.305],
        [0.146, 0.318],
        [0.138, H],
        [0, H],
      ],
      { smooth: true, samples: 18 },
    );
    const cavityProfile = profile.polygon(
      [
        [0, 0.03],
        [0.1, 0.03],
        [0.112, 0.042],
        [0.116, 0.1],
        [0.118, 0.18],
        [0.118, 0.37],
        [0, 0.37],
      ],
      { smooth: true, samples: 16 },
    );
    const wall = sdf
      .revolve(outerProfile)
      .displace(0.005, staveWave)
      .subtract(sdf.revolve(cavityProfile))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const bucketShape = wall.paintFn(woodPaint);

    k.body('staves', bucketShape, {
      color: '#8a5a35',
      roughness: 0.82,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      maxError: 0.002,
      maxTriangles: 1500,
      bump: woodBump,
    });

    // ------------------------------------------------------------------ water
    // Flat glossy disc of water in the cavity, top 3 cm down from the rim.
    const waterShape = sdf.cylinder(0.112, 0.2, 0.014).at(0, WATER_Y - 0.1, 0).paintFn(waterPaint);
    k.body('water', waterShape, {
      color: '#3fa8c8',
      roughness: 0.1,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 260,
    });

    // ------------------------------------------------------------------- iron
    // Two solid hoop rings (annular cylinders so they hug the tapered wall),
    // two chunky lugs at the rim, and a thick solid bail arching between them.
    const hoopAt = (y: number, h: number) =>
      sdf
        .cylinder(0.159, h, 0.006)
        .subtract(sdf.cylinder(0.122, 0.1))
        .at(0, y, 0);
    const lugs = sdf.box([0.05, 0.062, 0.042], 0.014).at(0.15, 0.288, 0).mirror('x', 0);
    const bail = sdf
      .torus(0.146, 0.0145)
      .rotateX(90)
      .at(0, 0.288, 0)
      .intersect(sdf.halfSpace([0, -1, 0], -0.288));
    const iron = sdf.union(hoopAt(0.07, 0.058), hoopAt(0.252, 0.062), lugs, bail).paintFn(ironPaint);

    k.body('iron', iron, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.007,
      maxError: 0.0025,
      maxTriangles: 700,
    });
  },
});
