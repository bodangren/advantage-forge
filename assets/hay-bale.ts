import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — chunky straw hay bale (props/farm/hay-bale).
 *
 * Role: farm clutter prop that sits beside the barn; must read at 128 px sprite size.
 * Size: 0.9 m wide (X), 0.70 m tall (Y), 0.62 m deep (Z); stands on y = 0, faces +Z.
 * One idea: a fat rounded block of compressed ripe straw, cinched by three shallow strap
 *   grooves, with a tuft of pale straw wisps springing from the top.
 * Shape language: round dominant (heavily rounded corners, bulging sides), square secondary
 *   (the blocky bale mass and the straight groove lines).
 * Palette (60/30/10, 60 = dominant): ripe-crop mid gold #d2a02e, lighter sun-lit gold
 *   #ecc25a, pale accent #f4dd97 (wisp tips, top highlight); grooves and shaded foot
 *   #6f4a0e. Same gold family as the barn knob (#d7a63a) and cottage trim (#d7a63a).
 * Materials: one matte dry-straw body (roughness 0.85, metalness 0); a second pale-straw
 *   body for the wisps. Straw strands, grain and flecks live in `paintFn` and `bump`.
 * Detail: primary rounded block; secondary strap grooves + wisp tuft; tertiary strand
 *   grain and end-face speckle. Focal point: the wisp tuft on top.
 * Rig/animation: none (static prop).
 */

const W = 0.9; // width along X
const H = 0.7; // height along Y
const D = 0.62; // depth along Z
const R = 0.1; // corner radius — keeps the chunky, soft Chibi Quest read

// Three strap grooves wrapping the bale around the Y-Z cross-section.
const STRAPS = [-0.26, 0, 0.26];
const GROOVE_W = 0.032; // half width of each groove
const GROOVE_DEPTH = 0.018;

const GOLD_PALE = rgb('#f4dd97');
const GOLD_LIGHT = rgb('#ecc25a');
const GOLD_MID = rgb('#d2a02e');
const GOLD_DARK = rgb('#9e6f1c');
const GOLD_DEEP = rgb('#6f4a0e');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Smooth 0 -> 1 ramp between a and b (for masks, never a hard jump). */
const ramp = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Groove weight: 1 at a strap centre, smoothly 0 at the groove edge. */
const grooveAt = (x: number) => {
  let g = 0;
  for (const s of STRAPS) {
    const d = Math.abs(x - s);
    if (d < GROOVE_W) g = Math.max(g, 0.5 + 0.5 * Math.cos((Math.PI * d) / GROOVE_W));
  }
  return g;
};

/** Fine straw strand relief, aligned along the bale length (X). Normal-map only, in meters. */
const strawBump = (x: number, y: number, z: number) =>
  0.0018 * noise.fbm(x * 6, y * 48, z * 48, 2, 7) +
  0.001 * noise.fbm(x * 40, y * 40, z * 40, 2, 23) -
  0.005 * grooveAt(x);

/** Compressed-straw color: long strands, sun-lit top, shaded foot, dark strap grooves. */
const strawPaint = (x: number, y: number, z: number) => {
  const strand = noise.fbm(x * 6, y * 48, z * 48, 3, 7);
  const coarse = noise.fbm(x * 3, y * 9, z * 9, 2, 19);
  const fine = noise.noise3(x * 42, y * 42, z * 42, 23);

  let c = mixRgb(GOLD_MID, GOLD_LIGHT, 0.22 + 0.3 * coarse);
  c = mixRgb(c, GOLD_DEEP, 0.26 * clamp01(0.5 - 0.5 * strand)); // dark strand lines
  c = mixRgb(c, GOLD_PALE, 0.18 * clamp01(0.5 + 0.5 * strand)); // lit strand tops
  c = mixRgb(c, GOLD_DARK, 0.12 * clamp01(0.5 + 0.5 * fine));

  // Value plan: sun-lit crown, damp shaded foot.
  const t = clamp01(y / H);
  c = mixRgb(c, GOLD_PALE, 0.18 * Math.max(0, (t - 0.55) / 0.45));
  c = mixRgb(c, GOLD_DEEP, 0.34 * (1 - t) * (1 - t));

  // Cut straw ends: a light speckle on the two grooved end faces.
  const endMask = ramp(0.32, 0.44, Math.abs(x));
  const speck = noise.noise3(x * 34, y * 70, z * 70, 41);
  c = mixRgb(c, speck > 0 ? GOLD_PALE : GOLD_DEEP, 0.30 * endMask * Math.abs(speck));

  // Dark strap grooves.
  c = mixRgb(c, GOLD_DEEP, 0.55 * grooveAt(x));
  return c;
};

/** A tuft of pale straw wisps poking up from the crown. Thicker near the base so they read small. */
const WISPS: { x: number; z: number; dx: number; dz: number; h: number; r: number }[] = [
  { x: -0.14, z: 0.05, dx: -0.1, dz: 0.02, h: 0.17, r: 0.019 },
  { x: 0.02, z: -0.08, dx: 0.03, dz: -0.06, h: 0.14, r: 0.018 },
  { x: 0.13, z: 0.07, dx: 0.1, dz: 0.04, h: 0.16, r: 0.018 },
  { x: -0.03, z: 0.12, dx: 0.04, dz: 0.09, h: 0.12, r: 0.017 },
  { x: 0.21, z: -0.06, dx: 0.09, dz: -0.05, h: 0.13, r: 0.017 },
  { x: -0.15, z: -0.06, dx: -0.09, dz: -0.04, h: 0.15, r: 0.018 },
];

export default defineAsset({
  name: 'hay-bale',
  description:
    'Chunky golden hay bale: a rounded rectangular block of compressed straw with three shallow strap grooves and pale straw wisps poking from the top.',
  detail: 0.012,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- bale block
    // Rounded block, gently lumpy like compressed straw, flat on the ground.
    const block = sdf
      .box([W, H, D], R)
      .at(0, H / 2, 0)
      .displace(0.012, (x, y, z) => noise.fbm(x * 7, y * 7, z * 7, 2, 3))
      .displace(GROOVE_DEPTH, (x) => -grooveAt(x))
      // Sit exactly on the ground with a flat lower face.
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    k.body('straw', block.paintFn((x, y, z) => strawPaint(x, y, z)), {
      color: GOLD_MID,
      roughness: 0.85,
      metalness: 0,
      detail: 0.026,
      textureDensity: 2,
      maxTriangles: 3200,
      bump: strawBump,
    });

    // ------------------------------------------------------------- wisp tuft
    const wisps: ReturnType<typeof sdf.chain>[] = WISPS.map(({ x, z, dx, dz, h, r }) =>
      sdf
        .chain(
          [
            [x, H - 0.1, z, r],
            [x + dx * 0.15, H + h * 0.35, z + dz * 0.15, r * 0.72],
            [x + dx * 0.6, H + h * 0.72, z + dz * 0.6, r * 0.5],
            [x + dx, H + h, z + dz, r * 0.38],
          ],
          0.006,
        )
        .paintFn((_px, py, _pz) =>
          mixRgb(GOLD_LIGHT, GOLD_PALE, clamp01(0.25 + 0.75 * ((py - H) / (h + 0.02)))),
        ),
    );
    k.body('wisps', sdf.union(...wisps), {
      color: GOLD_LIGHT,
      roughness: 0.85,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 500,
    });
  },
});
