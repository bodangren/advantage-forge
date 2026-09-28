import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — woven basket heaped with fruit (props/food/fruit-basket).
 *
 * Role: market/kitchen prop for the cozy chibi hamlet; must read at 128 px.
 * Size: basket 0.40 m wide and 0.21 m tall, fruit heap to ~0.44 m; stands on
 *   y = 0, centred on Y, faces +Z.
 * One idea: a plump, slightly flared woven bowl with a huge rolled rim braid,
 *   overflowing with bright fruit — the glossy red apple and the purple grape
 *   bunch are the focal points.
 * Shape language: round dominant (bowl, fruit, rim roll); one woven texture
 *   rhythm as the secondary line.
 * Palette: straw #e0bb60 dominant, shade #b5814a and deep #6b4226 grooves,
 *   light #f2d78e rim. Accents: apple red #d92b1f, green apple #8fbf4a,
 *   pear #c7c94a, grape #6f4a9c, orange #e8842b, leaf #5cb85c, stem #6b4226.
 * Materials: woven straw (rough 0.8), glossy apple skin (0.32), pear (0.5),
 *   grapes (0.4), orange peel (0.55), stem wood (0.85), leaf satin (0.55).
 * Detail: primary bowl + rim roll + fruit heap; secondary weave rows, stems,
 *   leaves; tertiary per-brick tint and weave relief in `bump`.
 * Rig/animation: none (static prop).
 */

const STRAW = rgb('#e0bb60');
const STRAW_LIGHT = rgb('#f2d78e');
const STRAW_DARK = rgb('#b5814a');
const STRAW_DEEP = rgb('#6b4226');

const APPLE_RED = rgb('#d92b1f');
const APPLE_RED_DARK = rgb('#9c140c');
const APPLE_RED_HI = rgb('#ff7a55');
const APPLE_GREEN = rgb('#8fbf4a');
const APPLE_GREEN_DARK = rgb('#5e8a2a');
const APPLE_GREEN_HI = rgb('#b9d96a');
const PEAR = rgb('#c7c94a');
const PEAR_DARK = rgb('#8f9a34');
const PEAR_HI = rgb('#e6e07a');
const GRAPE = rgb('#6f4a9c');
const GRAPE_DARK = rgb('#41285f');
const GRAPE_HI = rgb('#9d78c8');
const ORANGE = rgb('#e8842b');
const ORANGE_DARK = rgb('#a95212');
const ORANGE_HI = rgb('#f8b64e');
const STEM = '#6b4226';
const LEAF = '#5cb85c';
const LEAF_LIGHT = rgb('#93d97e');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ------------------------------------------------------------------ basket
const RIM_Y = 0.2; // wall top
const RIM_R = 0.2; // rim outer radius (0.40 m wide)
const RIM_BAND = RIM_Y - 0.06; // start of the rolled braid band
const COLS = 16; // weave bricks around the basket
const ROWS = 5; // weave rows over the wall
const CW = (2 * Math.PI * 0.16) / COLS;
const CH = RIM_Y / ROWS;

/**
 * Shared weave field: horizontal bands with slightly skewed stitch columns,
 * so the surface reads as woven straw rather than a tiled grid. `stripe` is
 * the vertical braid of the rolled rim band.
 */
function weaveAt(x: number, y: number, z: number) {
  const a = Math.atan2(z, x);
  const r = Math.hypot(x, z);
  const u = a * Math.max(r, 0.06);
  const row = Math.floor(y / CH);
  const s1 = u / CW;
  const f1 = s1 - Math.floor(s1);
  const f2 = y / CH - row;
  const band = Math.sin(Math.PI * f2); // horizontal weave row
  const stitch = Math.sin(Math.PI * f1); // vertical stake
  const brick = Math.pow(band, 0.7) * (0.55 + 0.45 * stitch);
  const fa = ((a + Math.PI) / (Math.PI * 2)) * COLS * 1.5;
  const fs = fa - Math.floor(fa);
  const stripe = Math.sin(Math.PI * fs);
  return { row, f1, f2, band, stitch, brick, stripe };
}

const strawPaint = (x: number, y: number, z: number) => {
  const { brick, stripe } = weaveAt(x, y, z);
  const groove = 1 - brick;
  let c = mixRgb(STRAW, STRAW_DARK, 0.85 * groove);
  c = mixRgb(c, STRAW_LIGHT, 0.28 * (1 - groove));
  c = mixRgb(c, STRAW_DARK, 0.14 * (0.5 + 0.5 * noise.fbm(x * 15, y * 15, z * 15, 2)));
  const t = clamp01(y / RIM_Y);
  c = mixRgb(c, STRAW_DEEP, 0.5 * (1 - t) * (1 - t));
  c = mixRgb(c, STRAW_LIGHT, 0.18 * clamp01((t - 0.65) / 0.35));
  const rimT = clamp01((y - RIM_BAND) / 0.05);
  if (rimT > 0) {
    c = mixRgb(c, STRAW_DARK, rimT * 0.7 * (1 - stripe));
    c = mixRgb(c, STRAW_LIGHT, rimT * 0.25 * stripe);
  }
  return c;
};

const strawBump = (x: number, y: number, z: number) => {
  const { brick, stripe } = weaveAt(x, y, z);
  let h = 0.005 * (brick - 0.45);
  const rimT = clamp01((y - RIM_BAND) / 0.05);
  h += rimT * 0.0026 * (stripe - 0.5);
  h += 0.0008 * noise.fbm(x * 44, y * 44, z * 44, 2);
  return h;
};

const strawOpts = {
  color: '#e0bb60',
  roughness: 0.8,
  metalness: 0,
  textureDensity: 2,
  paintWeight: 2,
} as const;

// ------------------------------------------------------------------ fruit
// Profile U = radius, V = height, base near V = 0; shared by every apple.
const appleProfile = profile.polygon(
  [
    [0, 0.007],
    [0.03, 0.007],
    [0.052, 0.016],
    [0.06, 0.035],
    [0.061, 0.055],
    [0.056, 0.078],
    [0.044, 0.095],
    [0.028, 0.103],
    [0.016, 0.102],
    [0.01, 0.094],
    [0, 0.092],
  ],
  { smooth: true, samples: 12 },
);
const pearProfile = profile.polygon(
  [
    [0, 0.005],
    [0.036, 0.006],
    [0.053, 0.022],
    [0.059, 0.043],
    [0.05, 0.062],
    [0.035, 0.078],
    [0.027, 0.092],
    [0.025, 0.106],
    [0.02, 0.116],
    [0.01, 0.121],
    [0, 0.121],
  ],
  { smooth: true, samples: 14 },
);

const litPaint =
  (base: readonly [number, number, number], hi: readonly [number, number, number], dark: readonly [number, number, number], yLo: number, yHi: number) =>
  (x: number, y: number, z: number) => {
    const v = 0.5 + 0.5 * noise.fbm(x * 13, y * 13, z * 13, 2);
    let c = mixRgb(base, dark, 0.2 * v);
    c = mixRgb(c, hi, 0.5 * clamp01((y - yLo) / (yHi - yLo)));
    c = mixRgb(c, dark, 0.3 * clamp01((yLo - 0.02 - y) / 0.05));
    return c;
  };

export default defineAsset({
  name: 'fruit-basket',
  description:
    'Round woven basket with a rolled rim braid, heaped with red and green apples, a pear, a bunch of purple grapes, and two oranges.',
  detail: 0.01,
  reference: 'docs/item-mockups/fruit-basket-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- bowl
    // Solid revolved bowl (flat foot, soft flare) minus a shallow cavity, so
    // the wall stays ~0.03 m thick and the mesh simplifies cleanly. The deep
    // interior is hidden by the fruit, so a shallow dish is enough.
    const outerProfile = profile.polygon(
      [
        [0, 0],
        [0.085, 0],
        [0.115, 0.012],
        [0.155, 0.04],
        [0.182, 0.085],
        [0.196, 0.135],
        [0.2, 0.175],
        [0.199, 0.198],
        [0.186, 0.21],
        [0, 0.208],
      ],
      { smooth: true, samples: 16 },
    );
    const cavityProfile = profile.polygon(
      [
        [0, 0.115],
        [0.105, 0.115],
        [0.13, 0.15],
        [0.148, 0.19],
        [0.155, RIM_Y],
        [0.155, RIM_Y + 0.05],
        [0, RIM_Y + 0.05],
      ],
      { smooth: true, samples: 14 },
    );
    const bowl = sdf
      .revolve(outerProfile)
      .subtract(sdf.revolve(cavityProfile))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    // Thick rolled rim braid, hugging the flared wall.
    const rim = sdf.torus(0.176, 0.038).at(0, 0.194, 0);
    // The weave lives in the paint and `bump` (baked to the normal map) so the
    // basket keeps a clean, smooth silhouette at this triangle budget.
    const basket = sdf.smoothUnion(0.008, bowl, rim).paintFn(strawPaint);
    k.body('basket', basket, {
      ...strawOpts,
      detail: 0.011,
      maxTriangles: 1200,
      bump: strawBump,
    });

    // ---------------------------------------------------------------- apples
    const appleAt = (cx: number, cy: number, cz: number, s: number) =>
      sdf
        .revolve(appleProfile)
        .scale(s)
        .at(cx, cy - 0.05 * s, cz);

    const redApples = sdf.union(
      appleAt(0.052, 0.248, 0.055, 1.06),
      appleAt(0.0, 0.318, -0.02, 1.05),
    );
    k.body(
      'apples-red',
      redApples.paintFn(litPaint(APPLE_RED, APPLE_RED_HI, APPLE_RED_DARK, 0.3, 0.38)),
      {
        color: '#d92b1f',
        roughness: 0.32,
        metalness: 0,
        detail: 0.007,
        textureDensity: 2,
        paintWeight: 2,
        maxTriangles: 420,
      },
    );

    const greenApples = sdf.union(
      appleAt(-0.09, 0.242, 0.052, 1.08),
      appleAt(-0.06, 0.302, -0.06, 1.0),
    );
    k.body(
      'apples-green',
      greenApples.paintFn(litPaint(APPLE_GREEN, APPLE_GREEN_HI, APPLE_GREEN_DARK, 0.3, 0.38)),
      {
        color: '#8fbf4a',
        roughness: 0.35,
        metalness: 0,
        detail: 0.007,
        textureDensity: 2,
        paintWeight: 2,
        maxTriangles: 420,
      },
    );

    // ---------------------------------------------------------------- pear
    const pear = sdf.revolve(pearProfile).scale(1.05).at(0.09, 0.285, -0.04);
    k.body(
      'pear',
      pear.paintFn(litPaint(PEAR, PEAR_HI, PEAR_DARK, 0.32, 0.4)),
      {
        color: '#c7c94a',
        roughness: 0.5,
        metalness: 0,
        detail: 0.007,
        textureDensity: 2,
        maxTriangles: 330,
      },
    );

    // ---------------------------------------------------------------- oranges
    const orangeAt = (cx: number, cy: number, cz: number) =>
      sdf.sphere(0.056).scale([1, 0.92, 1]).at(cx, cy, cz);
    const oranges = sdf.union(orangeAt(-0.1, 0.216, 0.082), orangeAt(0.094, 0.212, 0.088));
    k.body(
      'oranges',
      oranges.paintFn((x, y, z) => {
        const v = 0.5 + 0.5 * noise.fbm(x * 26, y * 26, z * 26, 3);
        let c = mixRgb(ORANGE, ORANGE_DARK, 0.24 * v);
        c = mixRgb(c, ORANGE_HI, 0.4 * clamp01((y - 0.27) / 0.05));
        return c;
      }),
      {
        color: '#e8842b',
        roughness: 0.55,
        metalness: 0,
        detail: 0.006,
        textureDensity: 2,
        maxTriangles: 480,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 90, y * 90, z * 90, 2),
      },
    );

    // ---------------------------------------------------------------- grapes
    // Tapering bunch hanging over the front rim; purple spheres, ~0.044 m each.
    const grapeOffsets: readonly (readonly [number, number, number])[] = [
      [-0.03, 0.05, 0.0],
      [0.0, 0.055, 0.0],
      [0.03, 0.05, 0.0],
      [-0.018, 0.046, -0.032],
      [0.018, 0.046, -0.032],
      [-0.036, 0.018, -0.008],
      [0.0, 0.022, 0.006],
      [0.036, 0.018, -0.008],
      [-0.02, -0.01, 0.0],
      [0.02, -0.01, 0.0],
      [0.0, -0.034, 0.0],
    ];
    const grapeAt = (cx: number, cy: number, cz: number) =>
      sdf.union(
        ...grapeOffsets.map(([ox, oy, oz]) => sdf.sphere(0.022).at(cx + ox, cy + oy, cz + oz)),
      );
    k.body(
      'grapes',
      grapeAt(0.005, 0.235, 0.14).paintFn((x, y, z) => {
        const v = 0.5 + 0.5 * noise.noise3(x * 40, y * 40, z * 40);
        let c = mixRgb(GRAPE, GRAPE_DARK, 0.5 * v);
        return mixRgb(c, GRAPE_HI, 0.45 * clamp01((x * 0.3 + y - 0.3) / 0.05));
      }),
      {
        color: '#6f4a9c',
        roughness: 0.4,
        metalness: 0,
        detail: 0.011,
        textureDensity: 2,
        maxTriangles: 600,
      },
    );

    // ---------------------------------------------------------------- stems
    const stemOf = (cx: number, cy: number, cz: number, s: number) =>
      sdf.cone([cx, cy, cz], [cx + 0.004 * s, cy + 0.028 * s, cz + 0.002 * s], 0.006 * s, 0.003 * s);
    const stems = sdf.union(
      stemOf(0.052, 0.298, 0.055, 1.05),
      stemOf(0.0, 0.368, -0.02, 1.05),
      stemOf(-0.09, 0.293, 0.052, 1.05),
      stemOf(-0.06, 0.349, -0.06, 1.0),
      sdf.cone([0.09, 0.34, -0.04], [0.1, 0.378, -0.035], 0.007, 0.003), // pear stem
      sdf.cone([0.005, 0.285, 0.14], [0.01, 0.32, 0.137], 0.006, 0.003), // grape stalk
    );
    k.body('stems', stems, {
      color: STEM,
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 140,
    });

    // ---------------------------------------------------------------- leaves
    // Chunky flattened blades (read reliably where a thin extruded leaf would
    // vanish after reduction), light toward the tip.
    const leafBlade = sdf.sphere(0.03).scale([1.55, 0.26, 0.78]);
    const leafAt = (x: number, y: number, z: number, rotY: number, rotZ: number) =>
      leafBlade
        .rotate(0, rotY, rotZ)
        .at(x, y, z)
        .paintFn((px, _py, pz) =>
          mixRgb(LEAF_LIGHT, rgb(LEAF), clamp01((px - x + pz - z + 0.06) / 0.08)),
        );
    const leaves = sdf.union(
      leafAt(0.088, 0.318, 0.062, 30, 26),
      leafAt(0.108, 0.362, -0.03, -25, 32),
    );
    k.body('leaves', leaves, {
      color: LEAF,
      roughness: 0.55,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 140,
    });
  },
});
