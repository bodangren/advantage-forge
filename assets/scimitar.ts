import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — scimitar (equipment/melee-weapons/scimitar).
 *
 * Role: a chibi-quest hero's curved sword; a shop pickup and held weapon.
 *   It must read at 128 px as an upswept curved blade on a small brass guard.
 * Size: 0.8 m tall, standing point-up on its gold pommel at y = 0, grip
 *   centred on the Y axis, the flat of the blade facing +Z.
 * One idea: a fat crescent of pale steel that sweeps up and toward the left
 *   (+X) and widens toward its tip, between a small chunky brass crossguard
 *   and a dark leather-wrapped grip with a gold ball pommel.
 * Shape language: round dominant (soft beveled blade, ball pommel, fat grip
 *   coils), square secondary (blocky brass guard).
 * Palette: steel blade #c8ccd2 / #8e959e with an iron base shadow #4a4f55;
 *   brass guard and pommel #d4a93a / #a87e22; leather grip #5c3a22 / #8a5a35.
 *   60/30/10: steel dominant, leather secondary, brass accent at the guard.
 * Materials: polished steel (roughness 0.3, metalness 1), brass (roughness 0.3,
 *   metalness 1), leather (roughness 0.7).
 * Detail: primary curved widening blade + guard + grip + pommel; secondary
 *   wrap coils, guard knobs, guard collar; tertiary steel bevel gradient,
 *   wrap bump, brass wear. Focal point: the guard and pommel.
 * Rig/animation: none (static item).
 */

const STEEL = rgb('#d6dbe1');
const STEEL_DEEP = rgb('#9aa1aa');
const STEEL_BASE = rgb('#7c838c');
const STEEL_LIGHT = rgb('#eef2f6');

const BRASS = rgb('#d4a93a');
const BRASS_DEEP = rgb('#a87e22');

const LEATHER = rgb('#8a5a35');
const LEATHER_DEEP = rgb('#5c3a22');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ------------------------------------------------------------------ proportions
const POMMEL_R = 0.027;
const POMMEL_Y = POMMEL_R; // bottom touches y = 0

const GRIP_BOT_Y = 0.048;
const GRIP_TOP_Y = 0.205;
const GRIP_R = 0.0145;

const GUARD_Y = 0.224;
const GUARD_W = 0.108; // full width across
const GUARD_H = 0.026;
const GUARD_D = 0.042;

const BLADE_BOT_Y = 0.235;
const BLADE_TIP_Y = 0.796;
const BLADE_LEN = BLADE_TIP_Y - BLADE_BOT_Y;
const CURVE = 0.150; // how far the tip sweeps toward +X
const SPINE_X0 = -0.026; // blade base x (a touch behind the grip axis)

const BLADE_DEPTH = 0.007; // extruded thickness before the edge bevel
const BLADE_ROUND = 0.004; // soft bevel on every blade edge

// Half width of the blade, perpendicular to the spine, sampled along t in [0, 1].
const WIDTH_KEYS: readonly (readonly [number, number])[] = [
  [0.0, 0.014],
  [0.18, 0.017],
  [0.4, 0.02],
  [0.6, 0.026],
  [0.78, 0.036],
  [0.88, 0.034],
  [0.95, 0.019],
  [1.0, 0.0015],
];

// A barb on the back (spine) edge and a shallow scoop below it, like the
// mockup's swept notch.
const barb = (t: number) =>
  0.016 * Math.exp(-(((t - 0.71) / 0.045) ** 2)) - 0.007 * Math.exp(-(((t - 0.5) / 0.12) ** 2));


const halfWidth = (t: number) => {
  for (let i = 0; i < WIDTH_KEYS.length - 1; i++) {
    const [t0, w0] = WIDTH_KEYS[i]!;
    const [t1, w1] = WIDTH_KEYS[i + 1]!;
    if (t <= t1) return w0 + (w1 - w0) * ((t - t0) / (t1 - t0));
  }
  return WIDTH_KEYS[WIDTH_KEYS.length - 1]![1];
};

const spineX = (t: number) => SPINE_X0 + CURVE * Math.pow(t, 1.8);
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

// Signed distance across the blade: +1 near the cutting edge, -1 near the spine.
const acrossBlade = (x: number, y: number) => {
  const t = clamp01((y - BLADE_BOT_Y) / BLADE_LEN);
  const [nx, ny] = spineNormal(clamp01(t));
  const hw = Math.max(1e-4, halfWidth(t));
  return ((x - spineX(t)) * nx + (y - spineY(t)) * ny) / hw;
};

// ------------------------------------------------------------------ paint
// Steel: darker at the spine and the base, brighter toward the cutting edge,
// with a faint brushed sheen.
const steelPaint = (x: number, y: number, z: number) => {
  const s = clamp01((acrossBlade(x, y) + 1) / 2);
  let c = mixRgb(STEEL_BASE, STEEL, Math.min(1, s * 1.5));
  c = mixRgb(c, STEEL_LIGHT, clamp01((s - 0.4) / 0.6) * 0.6);
  const sheen = 0.5 + 0.5 * noise.fbm(x * 24, y * 24, z * 40, 2);
  c = mixRgb(c, STEEL_DEEP, 0.18 * sheen);
  const base = clamp01((BLADE_BOT_Y + 0.05 - y) / 0.1);
  c = mixRgb(c, STEEL_BASE, 0.3 * base);
  return c;
};

// Brass: warm base with tarnish patches and darker recesses, brighter on top.
const brassPaint = (x: number, y: number, z: number) => {
  let c = BRASS;
  const wear = 0.5 + 0.5 * noise.fbm(x * 20 + 4, y * 20, z * 20, 2);
  c = mixRgb(c, BRASS_DEEP, 0.30 * wear);
  const top = clamp01((y - GUARD_Y) / 0.05);
  c = mixRgb(c, BRASS, 0.25 * top);
  const low = clamp01((0.05 - y) / 0.06);
  c = mixRgb(c, BRASS_DEEP, 0.35 * low);
  return c;
};

// Leather: dark warm brown, lighter on the raised wrap coils.
const leatherPaint = (x: number, y: number, z: number) => {
  let c = LEATHER_DEEP;
  const coil = Math.abs(Math.sin(Math.atan2(z, x) + (y - GRIP_BOT_Y) * 95));
  c = mixRgb(c, LEATHER, 0.55 * coil);
  const wear = 0.5 + 0.5 * noise.fbm(x * 22 + 7, y * 22, z * 22, 2);
  c = mixRgb(c, LEATHER_DEEP, 0.25 * wear);
  return c;
};

export default defineAsset({
  name: 'scimitar',
  description:
    'Scimitar, 0.8 m: a curved steel blade that widens toward its tip, swept up from a small brass crossguard, a dark leather-wrapped grip, and a gold ball pommel.',
  detail: 0.005,
  reference: 'docs/item-mockups/scimitar-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.127, 0] },

  build(k) {
    // --------------------------------------------------------------- blade
    // Curved, widening outline in XY (the flat faces +Z), swept toward +X.
    const N = 30;
    const outer: [number, number][] = [];
    const inner: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const [nx, ny] = spineNormal(t);
      const hw = halfWidth(t);
      outer.push([spineX(t) + nx * hw, spineY(t) + ny * hw]);
      inner.push([spineX(t) - nx * (hw + barb(t)), spineY(t) - ny * (hw + barb(t))]);
    }
    const outline: [number, number][] = [...outer, ...inner.reverse()];
    const blade = sdf
      .extrude(profile.polygon(outline), BLADE_DEPTH)
      .round(BLADE_ROUND)
      .paintFn(steelPaint);

    k.body('blade', blade, {
      color: '#d6dbe1',
      roughness: 0.33,
      metalness: 0.75,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 120, y * 20, z * 220, 2),
      maxTriangles: 1300,
    });

    // --------------------------------------------------------------- guard
    // A small chunky brass crossguard with rounded end knobs and a center boss.
    const guardBar = sdf.box([GUARD_W, GUARD_H, GUARD_D], 0.011).at(0, GUARD_Y, 0);
    const guardKnob = (sx: number) =>
      sdf.ellipsoid([0.019, 0.017, 0.019]).at(sx * (GUARD_W / 2 - 0.002), GUARD_Y + 0.004, 0);
    const guardBoss = sdf.ellipsoid([0.026, 0.020, 0.024]).at(0, GUARD_Y + 0.006, 0);
    const guard = sdf
      .union(guardBar, guardKnob(1), guardKnob(-1), guardBoss)
      .smoothUnion(0.006, sdf.cylinder(0.018, 0.02, 0.006).at(0, GUARD_Y - 0.004, 0));

    k.body('guard', guard.paintFn(brassPaint), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 50, y * 50, z * 50, 2),
      maxTriangles: 600,
    });

    // --------------------------------------------------------------- grip
    // Dark leather grip with four fat wrap coils.
    const gripBase = sdf.capsule([0, GRIP_BOT_Y, 0], [0, GRIP_TOP_Y, 0], GRIP_R);
    const COILS = 5;
    const GAP = (GRIP_TOP_Y - GRIP_BOT_Y) / COILS;
    const coil = (i: number) =>
      sdf
        .torus(GRIP_R + 0.0008, 0.0038)
        .rotateX(90)
        .at(0, GRIP_BOT_Y + GAP * (i + 0.5), 0);
    const grip = sdf.union(
      gripBase,
      ...Array.from({ length: COILS }, (_, i) => coil(i)),
    );

    k.body('grip', grip.paintFn(leatherPaint), {
      color: '#5c3a22',
      roughness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0014 * Math.abs(Math.sin(Math.atan2(z, x) + (y - GRIP_BOT_Y) * 95)),
      maxTriangles: 380,
    });

    // --------------------------------------------------------------- pommel
    // Gold ball pommel with a short neck up into the grip; sits on y = 0.
    const pommel = sdf
      .smoothUnion(
        0.006,
        sdf.sphere(POMMEL_R).at(0, POMMEL_Y, 0),
        sdf.cone([0, POMMEL_Y + 0.004, 0], [0, GRIP_BOT_Y + 0.004, 0], 0.019, 0.015),
      );

    k.body('pommel', pommel.paintFn(brassPaint), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 60, y * 60, z * 60, 2),
      maxTriangles: 400,
    });
  },
});
