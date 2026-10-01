import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — katana (equipment/melee-weapons/katana).
 *
 * Role: a chibi-quest hero's sidearm; seen in hand (small, in motion) and as a
 *   pickup icon. It must read at 128 px as a gently curved single-edge blade on
 *   a round gold guard with a black wrapped handle.
 * Size: 1.0 m tall, standing on its pommel at y = 0, grip centred on the Y
 *   axis, the flat of the blade facing +Z. Grip centre is at y ~ 0.17.
 * One idea: a slim iron blade that leans into a soft curve, its bright steel
 *   cutting edge running up the convex side to an angled tip.
 * Shape language: round dominant (soft bevels, ball pommel, round guard),
 *   triangular secondary (the angled blade tip).
 * Palette: iron blade #4a4f55 / #363a3f with highlight #a8acb1, steel edge
 *   #c8ccd2; gold guard #d4a93a; near-black cord #241a12 with pale tan
 *   under-wrap diamonds #c9a06a. 60/30/10: iron dominant, black grip
 *   secondary, gold + steel edge accents.
 * Materials: iron (roughness 0.5, metalness 0.7), gold (roughness 0.3,
 *   metalness 1), cord (roughness 0.8).
 * Detail: primary curved blade + round guard + grip + pommel; secondary gold
 *   collar, wrap diamonds; tertiary brushed sheen, wrap bump, gold tarnish.
 *   Focal point: the gold guard between dark grip and dark blade.
 * Rig/animation: none (static item).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');
const STEEL_EDGE = rgb('#c8ccd2');

const GOLD = rgb('#d4a93a');
const GOLD_DEEP = rgb('#a87e22');

const CORD = rgb('#241a12');
const UNDERWRAP = rgb('#c9a06a');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ------------------------------------------------------------------ proportions
const POMMEL_R = 0.024;

const GRIP_BOT_Y = 0.05;
const GRIP_TOP_Y = 0.285;
const GRIP_R = 0.02;

const GUARD_Y = 0.2925; // round gold tsuba, 0.011 thick
const GUARD_R = 0.052;

const COLLAR_Y = 0.315; // gold habaki around the blade base
const COLLAR_W = 0.038;
const COLLAR_H = 0.03;
const COLLAR_D = 0.022;

const BLADE_BOT_Y = 0.3;
const BLADE_TIP_Y = 1.0;
const BLADE_LEN = BLADE_TIP_Y - BLADE_BOT_Y;
const LEAN = 0.035; // how far the tip drifts toward +X (the edge side)

const BLADE_DEPTH = 0.007;
const BLADE_ROUND = 0.003;
const EDGE_TIP_T = 0.94; // cutting edge stops here; angled tip above

// Half width of the blade measured from the spine, sampled along t in [0, 1].
// The spine stays wide and then drops quickly into a short blunt kissaki.
const WIDTH_KEYS: readonly (readonly [number, number])[] = [
  [0.0, 0.036],
  [0.45, 0.034],
  [0.75, 0.028],
  [0.85, 0.025],
  [0.94, 0.014],
  [1.0, 0.0035],
];

const halfWidth = (t: number) => {
  for (let i = 0; i < WIDTH_KEYS.length - 1; i++) {
    const [t0, w0] = WIDTH_KEYS[i]!;
    const [t1, w1] = WIDTH_KEYS[i + 1]!;
    if (t <= t1) return w0 + (w1 - w0) * ((t - t0) / (t1 - t0));
  }
  return WIDTH_KEYS[WIDTH_KEYS.length - 1]![1];
};

// Spine centreline: a gentle drift toward +X with height.
const spineX = (t: number) => LEAN * Math.pow(t, 2);
const spineY = (t: number) => BLADE_BOT_Y + BLADE_LEN * t;

// Unit tangent and outward (cutting-edge) normal of the spine at t.
const spineNormal = (t: number): [number, number] => {
  const e = 1e-3;
  const a = Math.max(0, t - e);
  const b = Math.min(1, t + e);
  const dx = spineX(b) - spineX(a);
  const dy = spineY(b) - spineY(a);
  const m = Math.hypot(dx, dy) || 1;
  return [dy / m, -dx / m];
};

// Signed distance across the blade: +1 at the cutting edge, -1 at the spine.
const acrossBlade = (x: number, y: number) => {
  const t = clamp01((y - BLADE_BOT_Y) / BLADE_LEN);
  const [nx, ny] = spineNormal(t);
  const hw = Math.max(1e-4, halfWidth(t));
  return ((x - spineX(t)) * nx + (y - spineY(t)) * ny) / hw;
};

// ------------------------------------------------------------------ paint
// Iron blade: darkest at the spine, mid iron on the flat, a bright steel
// strip along the cutting edge, a faint brushed sheen over everything.
const ironPaint = (x: number, y: number, z: number) => {
  const s = clamp01((acrossBlade(x, y) + 1) / 2);
  let c = mixRgb(IRON_DEEP, IRON, clamp01((s + 0.1) / 0.55));
  c = mixRgb(c, IRON_HI, clamp01((s - 0.5) / 0.3) * 0.7);
  c = mixRgb(c, STEEL_EDGE, clamp01((s - 0.78) / 0.18));
  const sheen = 0.5 + 0.5 * noise.fbm(x * 24, y * 24, z * 60, 2);
  c = mixRgb(c, IRON_HI, 0.08 * sheen);
  const base = clamp01((BLADE_BOT_Y + 0.06 - y) / 0.12);
  c = mixRgb(c, IRON_DEEP, 0.35 * base);
  return c;
};

// Gold: warm base with tarnish in the recesses, brighter on top faces.
const goldPaint = (x: number, y: number, z: number) => {
  let c = GOLD;
  const wear = 0.5 + 0.5 * noise.fbm(x * 30 + 9, y * 30, z * 30, 2);
  c = mixRgb(c, GOLD_DEEP, 0.28 * wear);
  const low = clamp01((0.08 - y) / 0.08);
  c = mixRgb(c, GOLD_DEEP, 0.3 * low);
  return c;
};

// Wrapped handle: near-black cord crossed in two diagonal directions; the
// pale under-wrap shows through where the cords leave a diamond gap.
const WRAP_K = 125; // diamond rows every ~0.025 m
const diamondMask = (x: number, y: number, z: number) => {
  const a = Math.atan2(z, x);
  const u = Math.abs(Math.sin(a - WRAP_K * y));
  const v = Math.abs(Math.sin(a + WRAP_K * y));
  return clamp01((0.5 - u) / 0.12) * clamp01((0.5 - v) / 0.12);
};
const wrapPaint = (x: number, y: number, z: number) => {
  const m = diamondMask(x, y, z);
  let c = mixRgb(CORD, UNDERWRAP, m);
  const wear = 0.5 + 0.5 * noise.fbm(x * 34 + 5, y * 34, z * 34, 2);
  c = mixRgb(c, CORD, 0.18 * wear * (1 - m));
  return c;
};

export default defineAsset({
  name: 'katana',
  description:
    'Katana, 1.0 m: a gently curved single-edge iron blade with a bright steel cutting edge, a round gold guard and collar, and a black cord-wrapped handle with pale diamond under-wrap.',
  detail: 0.004,
  reference: 'docs/item-mockups/katana-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.169, 0] },

  build(k) {
    // --------------------------------------------------------------- blade
    // Outline in XY (the flat faces +Z): cutting edge on +X, spine on -X,
    // an angled kissaki tip between the spine top and the edge.
    const N = 26;
    const edgePts: [number, number][] = [];
    const spinePts: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * EDGE_TIP_T;
      const [nx, ny] = spineNormal(t);
      const hw = halfWidth(t);
      edgePts.push([spineX(t) + nx * hw, spineY(t) + ny * hw]);
    }
    for (let i = 0; i <= N; i++) {
      const t = 1 - i / N; // spine descends from the tip
      const [nx, ny] = spineNormal(t);
      const hw = halfWidth(t);
      spinePts.push([spineX(t) - nx * hw, spineY(t) - ny * hw]);
    }
    const blade = sdf
      .extrude(profile.polygon([...edgePts, ...spinePts]), BLADE_DEPTH)
      .round(BLADE_ROUND)
      .paintFn(ironPaint);

    k.body('blade', blade, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 200, y * 30, z * 200, 2), // brushed iron
      maxTriangles: 1300,
    });

    // --------------------------------------------------------------- gold
    // Round tsuba guard, a collar (habaki) where the blade leaves the guard,
    // and a ball pommel (kashira) with a short neck into the grip.
    const guard = sdf.cylinder(GUARD_R, 0.011, 0.0045).at(0, GUARD_Y, 0);
    const collar = sdf
      .box([COLLAR_W, COLLAR_H, COLLAR_D], 0.006)
      .at(0, COLLAR_Y, 0);
    const pommel = sdf
      .smoothUnion(
        0.006,
        sdf.sphere(POMMEL_R).at(0, POMMEL_R, 0),
        sdf.cone([0, POMMEL_R, 0], [0, GRIP_BOT_Y + 0.01, 0], 0.02, 0.017),
      );
    k.body('gold', sdf.union(guard, collar, pommel).paintFn(goldPaint), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 60, y * 60, z * 60, 2),
      maxTriangles: 650,
    });

    // --------------------------------------------------------------- grip
    // Fat capsule grip under the black cord wrap; the cords sit in bump and
    // the pale under-wrap shows through the diamond gaps in paint.
    const grip = sdf.capsule([0, GRIP_BOT_Y, 0], [0, GRIP_TOP_Y, 0], GRIP_R);
    k.body('grip', grip.paintFn(wrapPaint), {
      color: '#241a12',
      roughness: 0.8,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (1 - diamondMask(x, y, z)),
      maxTriangles: 450,
    });
  },
});
