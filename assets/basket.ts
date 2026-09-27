import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — woven wicker apple basket (props/containers/basket).
 *
 * Role: market/harvest container prop for the cozy chibi hamlet; must read at 128 px.
 * Size: basket 0.40 m wide and 0.30 m tall, single arched handle to ~0.47 m, stands on
 *   y = 0, faces +Z; filled with five glossy red apples that overflow the rim.
 * One idea: a plump woven straw basket whose single flat arch handle and heap of red
 *   apples break the round silhouette; the red fruit is the focal point.
 * Shape language: round dominant (revolved bowl, rolled rim, apple pile), one strong
 *   curve (the handle arch) as the secondary line.
 * Palette: straw #e0bb60 dominant, straw shade #b08a3a and #7d5f24 (grooves, foot),
 *   straw light #f0d488 (rim highlight); accent apple red #d92b1f with #ff6a44 shine,
 *   leaf green #4f9a3a, stem brown #6b4426, small iron rivet #a8acb1.
 * Materials: woven straw (roughness 0.78, metalness 0, weave in paint + bump),
 *   glossy apple skin (roughness 0.3), apple stem wood (0.85), leaf satin (0.55),
 *   iron rivet (roughness 0.5, metalness 0.7).
 * Detail: primary revolved bowl + rim roll + handle arch; secondary weave rows, rim
 *   braid band, apples; tertiary per-brick tint and grain in bump. Focal point: apples.
 * Rig/animation: none (static prop).
 */

const STRAW = rgb('#e0bb60');
const STRAW_LIGHT = rgb('#f0d488');
const STRAW_DARK = rgb('#b08a3a');
const STRAW_DEEP = rgb('#7d5f24');
const APPLE = rgb('#d92b1f');
const APPLE_DARK = rgb('#9c140c');
const APPLE_HI = rgb('#ff6a44');
const STEM = '#6b4426';
const LEAF = '#4f9a3a';
const LEAF_LIGHT = rgb('#7ec850');
const IRON = '#a8acb1';

const RIM_Y = 0.3; // basket wall height / rim top
const RIM_R = 0.2; // rim outer radius (0.40 m wide)
const HANDLE_R = 0.185; // handle arch radius (feet land on the wall)
const HANDLE_FOOT_Y = 0.255;

const COLS = 18; // weave bricks around the basket
const ROWS = 7; // weave rows over the wall
const CW = (2 * Math.PI * 0.165) / COLS; // mean arc width of one brick
const CH = RIM_Y / ROWS; // height of one weave row
const RIM_BAND = RIM_Y - 0.062; // start of the braided crown band

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Shared weave field: bands that run around the basket with slightly skewed
 * stitch columns, so it reads as woven straw rather than a tile grid. Also the
 * vertical braid columns of the rim band.
 */
function weaveAt(x: number, y: number, z: number) {
  const a = Math.atan2(z, x);
  const r = Math.hypot(x, z);
  const u = a * Math.max(r, 0.06); // arc length (clamped near the axis)
  const row = Math.floor(y / CH);
  const s1 = (u + y * 0.22) / CW; // skewed stitch columns
  const f1 = s1 - Math.floor(s1);
  const f2 = y / CH - row;
  const band = Math.sin(Math.PI * f2); // continuous horizontal weave band
  const stitch = Math.sin(Math.PI * f1); // column shoulder
  const brick = Math.pow(band, 0.7) * (0.55 + 0.45 * stitch);
  const fa = ((a + Math.PI) / (Math.PI * 2)) * COLS * 1.5;
  const fs = fa - Math.floor(fa);
  const stripe = Math.sin(Math.PI * fs); // rim braid columns
  return { row, f1, brick, stripe };
}

const strawPaint = (x: number, y: number, z: number) => {
  const { brick, stripe } = weaveAt(x, y, z);
  const groove = 1 - brick;
  let c = mixRgb(STRAW, STRAW_DARK, 0.7 * groove); // dark weave grooves
  c = mixRgb(c, STRAW_LIGHT, 0.2 * (1 - groove)); // sun-lit band tops
  c = mixRgb(c, STRAW_DARK, 0.1 * (0.5 + 0.5 * noise.fbm(x * 15, y * 15, z * 15, 2)));
  const t = clamp01(y / RIM_Y);
  c = mixRgb(c, STRAW_DEEP, 0.42 * (1 - t) * (1 - t)); // shaded foot
  c = mixRgb(c, STRAW_LIGHT, 0.14 * clamp01((t - 0.65) / 0.35)); // sun-lit shoulder
  const rimT = clamp01((y - RIM_BAND) / 0.05);
  if (rimT > 0) {
    c = mixRgb(c, STRAW_DARK, rimT * 0.55 * (1 - stripe)); // braid grooves
    c = mixRgb(c, STRAW_LIGHT, rimT * 0.2 * stripe); // braid tops
  }
  return c;
};

const strawBump = (x: number, y: number, z: number) => {
  const { brick, stripe } = weaveAt(x, y, z);
  let h = 0.0042 * (brick - 0.45);
  const rimT = clamp01((y - RIM_BAND) / 0.05);
  h += rimT * 0.0024 * (stripe - 0.5);
  h += 0.0008 * noise.fbm(x * 42, y * 42, z * 42, 2);
  return h;
};

const strawOpts = {
  color: '#e0bb60',
  roughness: 0.78,
  metalness: 0,
  textureDensity: 2,
  paintWeight: 2,
} as const;

export default defineAsset({
  name: 'basket',
  description:
    'Round woven wicker basket with a rolled rim, a single arched handle with iron rivets, filled with five glossy red apples.',
  detail: 0.008,
  reference: 'docs/item-mockups/basket-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ bowl
    // Solid revolved bowl (flat foot, soft flare, rolled rim) minus a shallow
    // chunky cavity, so the wall stays ~0.034 m thick — a friendly, sturdy
    // basket and a mesh that simplifies cleanly. Flat base on y = 0. The deep
    // interior is hidden by the apple pile, so a shallow dish is enough.
    const outerProfile = profile.polygon(
      [
        [0, 0],
        [0.1, 0],
        [0.13, 0.011],
        [0.152, 0.045],
        [0.168, 0.1],
        [0.182, 0.17],
        [0.194, 0.24],
        [0.203, 0.285],
        [0.202, 0.298],
        [0.186, 0.304],
        [0, RIM_Y],
      ],
      { smooth: true, samples: 16 },
    );
    // Near-cylindrical dish so the apple pile can spread to the wall.
    const cavityProfile = profile.polygon(
      [
        [0, 0.2],
        [0.118, 0.2],
        [0.14, 0.238],
        [0.152, 0.282],
        [0.158, RIM_Y],
        [0.158, RIM_Y + 0.04],
        [0, RIM_Y + 0.04],
      ],
      { smooth: true, samples: 14 },
    );
    const bowl = sdf
      .revolve(outerProfile)
      .subtract(sdf.revolve(cavityProfile))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    // Thick rolled rim braid.
    const rim = sdf.torus(0.18, 0.027).at(0, 0.297, 0);
    const basketShape = sdf.smoothUnion(0.008, bowl, rim).paintFn(strawPaint);
    k.body('basket', basketShape, {
      ...strawOpts,
      detail: 0.018,
      maxTriangles: 1900,
      bump: strawBump,
    });

    // --------------------------------------------------------------- handle
    // Flat woven arch in the XY plane (spans left-right), with a foot pad on
    // each side; the feet land on the upper wall just under the rim.
    const arch = sdf.extrude(profile.arc(HANDLE_R, 0.056, 0, 180), 0.056, 0.02);
    const archBand = arch.at(0, HANDLE_FOOT_Y, 0);
    const footPad = sdf
      .box([0.042, 0.086, 0.066], 0.016)
      .at(HANDLE_R, HANDLE_FOOT_Y - 0.026, 0)
      .mirror('x', 0);
    const handle = sdf.smoothUnion(0.012, archBand, footPad).paintFn(strawPaint);
    k.body('handle', handle, {
      ...strawOpts,
      detail: 0.009,
      maxTriangles: 480,
      bump: strawBump,
    });

    // Small round iron rivets on the outside of each handle foot.
    const rivet = sdf
      .cylinder(0.013, 0.026, 0.004)
      .rotateZ(90)
      .at(HANDLE_R + 0.026, HANDLE_FOOT_Y, 0)
      .paintFn((x, y, z) => {
        const shine = clamp01((x - 0.19) / 0.03);
        return mixRgb(rgb('#4a4f55'), rgb('#c8ccd2'), 0.35 + 0.5 * shine);
      });
    k.body('rivets', sdf.union(rivet, rivet.mirror('x', 0)), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxTriangles: 160,
    });

    // ----------------------------------------------------------------- apples
    // Plump shiny apples using the market-apple cross-section, heaped so they
    // overflow the rim. Rounded (revolved) skin, glossy red.
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
    // [x, y, z, scale] — a centre apple crowned by a ring of four.
    const cluster: readonly (readonly [number, number, number, number])[] = [
      [0.0, 0.322, 0.012, 1.22],
      [0.078, 0.298, 0.024, 1.12],
      [-0.076, 0.306, 0.028, 1.16],
      [0.012, 0.316, -0.078, 1.08],
      [-0.03, 0.29, 0.084, 1.0],
    ];
    const appleAt = (cx: number, cy: number, cz: number, s: number) =>
      sdf
        .revolve(appleProfile)
        .scale(s)
        .at(cx, cy - 0.055 * s, cz);
    const apples = sdf.union(...cluster.map(([x, y, z, s]) => appleAt(x, y, z, s))).paintFn(
      (x, y, z) => {
        const v = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
        let c = mixRgb(APPLE, APPLE_DARK, 0.22 * v);
        c = mixRgb(c, APPLE_HI, 0.26 * clamp01((y - 0.25) / 0.1)); // lit tops
        return mixRgb(c, APPLE_DARK, 0.3 * clamp01((0.275 - y) / 0.06)); // shaded base
      },
    );
    k.body('apples', apples, {
      color: '#d92b1f',
      roughness: 0.3,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 1100,
    });

    // Stems rising from each apple crown.
    const stems = sdf.union(
      ...cluster.map(([x, y, z, s]) => {
        const base: [number, number, number] = [x, y + 0.045 * s, z];
        const top: [number, number, number] = [x + 0.004, y + 0.072 * s, z + 0.002];
        return sdf.cone(base, top, 0.006 * s, 0.0035 * s);
      }),
    );
    k.body('stems', stems, {
      color: STEM,
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 120,
    });

    // Two leaves on top of the pile.
    const leafOutline = profile.polygon(
      [
        [0, 0],
        [0.012, 0.014],
        [0.03, 0.013],
        [0.05, 0],
        [0.03, -0.013],
        [0.012, -0.014],
      ],
      { smooth: true, samples: 8 },
    );
    const leafAt = (x: number, y: number, z: number, rotY: number, rotZ: number) =>
      sdf
        .extrude(leafOutline, 0.005, 0.002)
        .rotateX(90)
        .rotateZ(rotZ)
        .rotateY(rotY)
        .at(x, y, z)
        .paintFn((px) => mixRgb(LEAF_LIGHT, rgb(LEAF), clamp01((px - x + 0.05) / 0.05)));
    const leaves = sdf.union(
      leafAt(0.062, 0.378, 0.024, 20, 16),
      leafAt(-0.052, 0.366, -0.044, -40, 10),
    );
    k.body('leaves', leaves, {
      color: LEAF,
      roughness: 0.55,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 140,
    });
  },
});
