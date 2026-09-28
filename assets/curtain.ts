import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — red cloth curtain (catalog `props/furniture/curtain`).
 *
 * Role: window dressing for the warm firelit chibi hamlet; must read at 128 px sprite.
 * Size: 1.2 m of cloth on a 1.44 m rod, 1.8 m tall overall; stands on y = 0, faces +Z.
 * One idea: a curtain swept to one side and cinched by a fat gold tie-back — a wide
 *   pleated drape above, a puffed skirt that pools on the floor below.
 * Shape language: round dominant (soft vertical pleats, rounded rod, ball finials, round
 *   cloth loops over the rod, rounded gold band), square secondary (calm straight rod).
 * Palette: fabric red #9a4a3a dominant, deep pleat shadow #571f10, lifted fold #cf7550;
 *   gold #d9a93a accent at the focal tie; wood honey #b5814a rod, pale cut wood #c9a06a
 *   finials, dark walnut #6b4226 collars.
 * Materials: red cloth (roughness 0.88, metalness 0), oak + pale wood (roughness 0.8/0.75),
 *   gold (roughness 0.38, metalness 0.95). Pleats are real displaced geometry plus matching
 *   paint so they read at sprite size; weave lives in `bump`.
 * Detail: primary drape + rod + tie; secondary cloth loops, finials, hem wave; tertiary
 *   weave bump and grain. Focal point: the gold tie-back against the red waist.
 * Rig/animation: none (static prop).
 */

const RED = rgb('#9a4a3a');
const RED_DEEP = rgb('#571f10');
const RED_LIFT = rgb('#cf7550');
const WOOD_DARK = rgb('#6b4226');
const PALE = '#c9a06a';
const GOLD = '#d9a93a';
const GOLD_DARK = '#9c701f';

const HALF_W = 0.6; // half width of the cloth at its widest (1.2 m total)
const TOP = 1.645; // top edge of the cloth
const TIE_Y = 0.8; // height of the gold tie-back
const WAIST_L = 0.03; // free-side boundary at the waist
const WAIST_R = 0.27; // tied-side boundary at the waist
const FLOOR_L = -0.34; // free-side hem corner
const FLOOR_R = 0.5; // tied-side hem corner (puffed skirt)
const DEPTH = 0.13; // cloth slab thickness before pleating
const EDGE_R = 0.016; // soft cloth bevel
const ROD_Y = 1.7;
const ROD_R = 0.026;
const TIE_X = (WAIST_L + WAIST_R) / 2;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Smooth interpolation through (s, width) keys; width 0 at the waist, 1 at the widest. */
const edgeW = (s: number, key: readonly (readonly [number, number])[]) => {
  const t = clamp01(s);
  for (let i = 0; i < key.length - 1; i++) {
    const [s0, w0] = key[i]!;
    const [s1, w1] = key[i + 1]!;
    if (t <= s1) {
      const u = (t - s0) / (s1 - s0);
      return w0 + (w1 - w0) * u * u * (3 - 2 * u);
    }
  }
  return key[key.length - 1]![1];
};
/** Above the tie the drape is narrow at the rod, bellies out at mid height, dies into the waist. */
const UPPER: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.35, 0.85],
  [0.55, 1],
  [0.8, 0.94],
  [1, 0.72],
];
/** Below the tie the gathered fabric flares into a puffed skirt that pools on the floor. */
const LOWER: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.35, 0.7],
  [0.7, 0.92],
  [1, 1],
];

const xFree = (y: number) =>
  y >= TIE_Y
    ? WAIST_L + (-HALF_W - WAIST_L) * edgeW((y - TIE_Y) / (TOP - TIE_Y), UPPER)
    : WAIST_L + (FLOOR_L - WAIST_L) * edgeW(1 - y / TIE_Y, LOWER);

/** Tied (+X) outline edge: same bell, offset toward +X so the cinch reads on one side. */
const xTied = (y: number) =>
  y >= TIE_Y
    ? WAIST_R + (HALF_W - WAIST_R) * edgeW((y - TIE_Y) / (TOP - TIE_Y), UPPER)
    : WAIST_R + (FLOOR_R - WAIST_R) * edgeW(1 - y / TIE_Y, LOWER);

/** Wavy hem so the cloth pools on the ground instead of slicing it. */
const hemY = (x: number) => 0.05 + 0.012 * (0.5 + 0.5 * Math.cos(x * 11 + 0.4));

/** Soft vertical pleats: 1 in a valley, -1 on a crest. Slightly irregular. */
const FOLD_K = (Math.PI * 2) / 0.24;
const fold = (x: number) => Math.sin(x * FOLD_K + 0.6) * (1 + 0.22 * Math.sin(x * FOLD_K * 0.37));
/** Pleats relax into the tie: gathered fabric is pulled flat. */
const gather = (y: number) => 0.24 + 0.76 * clamp01(Math.abs(y - TIE_Y) / 0.85);

const outline = (() => {
  const pts: [number, number][] = [[xTied(0), hemY(xTied(0))]];
  for (let i = 1; i <= 20; i++) {
    const x = xTied(0) + (xFree(0) - xTied(0)) * (i / 20);
    pts.push([x, hemY(x)]);
  }
  for (let i = 1; i <= 28; i++) {
    const y = (i / 28) * TOP;
    pts.push([xFree(y), y]);
  }
  for (let i = 1; i <= 14; i++) pts.push([xFree(TOP) + (xTied(TOP) - xFree(TOP)) * (i / 14), TOP]);
  for (let i = 25; i >= 1; i--) {
    const y = (i / 26) * TOP;
    pts.push([xTied(y), y]);
  }
  return profile.polygon(pts);
})();

const clothPaint = (x: number, y: number, z: number) => {
  const f = fold(x);
  let c = mixRgb(RED, RED_LIFT, 0.16 + 0.18 * (0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2)));
  // Pleat shading: valleys deep, crests catch the firelight.
  const g = gather(y);
  c = mixRgb(c, RED_DEEP, 0.72 * g * (0.5 - 0.5 * f));
  c = mixRgb(c, RED_LIFT, 0.5 * g * (0.5 + 0.5 * f));
  // Contact shade under the rod and a soft shade where the tie gathers the cloth.
  c = mixRgb(c, RED_DEEP, 0.55 * clamp01((y - 1.46) / 0.18));
  c = mixRgb(c, RED_DEEP, 0.34 * Math.exp(-Math.pow((y - TIE_Y) / 0.17, 2)));
  // Damp, shaded hem.
  c = mixRgb(c, RED_DEEP, 0.42 * clamp01((0.2 - y) / 0.2));
  return c;
};

const weaveBump = (x: number, y: number, z: number) =>
  0.0032 * noise.fbm(x * 8, y * 2.6, z * 8, 2) +
  0.0007 * noise.fbm(x * 90, y * 90, z * 90, 2);

export default defineAsset({
  name: 'curtain',
  description:
    'Red cloth curtain 1.2 m wide on a wooden rod with ring clips, swept to one side and gathered by a fat gold tie-back, pleated drape above and a puffed skirt on the floor.',
  detail: 0.01,
  reference: 'docs/item-mockups/curtain-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ cloth
    // Flat silhouette extruded, then pleated by displacement along its own normal.
    const sheet = sdf
      .extrude(outline, DEPTH, EDGE_R)
      .displace(0.038, (x, y) => fold(x) * gather(y), 2.2);
    // Cloth loops that fold over the rod, one per ring clip.
    const loops = sdf.union(
      ...[-0.34, -0.15, 0.04, 0.23, 0.42].map((x) =>
        sdf.torus(0.062, 0.034).rotateZ(90).at(x, ROD_Y, 0),
      ),
    );
    k.body('cloth', sdf.smoothUnion(0.018, sheet, loops).paintFn(clothPaint), {
      color: '#9a4a3a',
      roughness: 0.88,
      metalness: 0,
      detail: 0.01,
      textureDensity: 2,
      paintWeight: 2,
      bump: weaveBump,
      maxTriangles: 3000,
    });

    // ------------------------------------------------------------------ rod
    const rod = sdf.cylinder(ROD_R, 1.3, 0.008).rotateZ(90).at(0, ROD_Y, 0);
    k.body('rod', rod, {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 260,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 3, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ finials
    const collarR = sdf.cylinder(0.04, 0.024, 0.006).rotateZ(90).at(0.64, ROD_Y, 0);
    const ballR = sdf.ellipsoid([0.055, 0.072, 0.072]).at(0.705, ROD_Y, 0);
    k.body(
      'finials',
      sdf
        .union(collarR, ballR)
        .mirror('x', 0)
        .paintWhere(collarR.mirror('x', 0).round(0.002), WOOD_DARK, 0.003),
      {
        color: PALE,
        roughness: 0.75,
        metalness: 0,
        detail: 0.008,
        maxTriangles: 320,
        bump: (x, y, z) => 0.0009 * noise.fbm(x * 40, y * 40, z * 40, 2),
      },
    );

    // ------------------------------------------------------------------ tie-back
    // Fat gold band wrapping the cinched waist (squashed ring, axis vertical).
    const tie = sdf.torus(0.18, 0.045).scale([1, 1, 0.6]).at(TIE_X, TIE_Y, 0);
    k.body('tie', tie.paintFn((_x, _y, z) => mixRgb(rgb(GOLD), rgb(GOLD_DARK), z < 0 ? 0.35 : 0.08)), {
      color: GOLD,
      roughness: 0.38,
      metalness: 0.95,
      detail: 0.006,
      maxTriangles: 520,
    });
  },
});
