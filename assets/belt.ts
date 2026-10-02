import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather belt (equipment/armor/belt).
 *
 * Role: hero gear item / pickup and avatar waist piece. Reads at 128 px as a chunky tan leather
 *   band with one big square brass buckle. Focal point: the buckle.
 * Size: the band is the avatar torso at 2x (fit contract, waist, fitScale 2), cut to a 0.07 m tall,
 *   0.02 m thick ring (0.62 x 0.50 m), 10.5 cm up, with a large pouch that stands on y = 0; buckle toward +Z.
 * Fit: the ring is built from the avatar torso profile (copied from avatar-base) scaled by 2, so it
 *   follows the waist all round. The outer skin is 0.03 m (1.5 cm worn) out, the inner wall 1 cm
 *   (5 mm worn) off the shirt. `origin` y 0.113 + LIFT puts the band on the shirt's painted belt (worn y 0.251).
 * One idea: a chunky leather belt with an oversized brass buckle in front, a big flapped pouch with
 *   two brass studs on the right hip (-X) and a round brass ring with a strap loop on the left hip.
 * Shape language: square at the buckle and pouch, round everywhere else.
 * Palette: leather #8a5a35 dominant, dark leather #5c3a22 secondary, brass #d4a93a accent.
 * Materials: leather (roughness 0.65), dark leather (0.7), polished brass (0.3, metalness 1).
 * Detail: stitched edges, keeper, strap tail, pouch plate + flap + studs, ring + loop, grain in bump.
 * Rig/animation: none (static item).
 */

const LEATHER = rgb('#8a5a35');
const LEATHER_LIGHT = rgb('#c69a63');
const LEATHER_DARK = rgb('#5c3a22');
const LEATHER_DEEP = rgb('#3a2312');
const THREAD = rgb('#e0c188');
const BRASS = '#d4a93a';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ss = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

const WIDTH = 0.07; // vertical belt width
// The ring stands 10.5 cm up and the large pouch hangs to the ground, as in the mock.
const LIFT = 0.105;
const BAND_Y = WIDTH / 2 + LIFT;
const POUCH_SCALE = 1.8;
const POUCH_Y = BAND_Y - 0.05; // pouch centre: its top 0.5 cm above the band, its bottom on y = 0
const BELT_WORN_Y = 0.251; // centre of the shirt's painted belt (avatar meters)
// Outer ellipse of the band at belt height (x semi-axis, z semi-axis), asset meters.
const XO = 0.29;
const ZO = 0.226;
const ellipseR = (x: number, z: number) => Math.hypot(x / XO, z / ZO);

/** Point and outward normal angle on the outer ellipse at parameter `deg` (from +Z toward +X). */
function onBand(deg: number, lift = 0.004) {
  const t = (deg * Math.PI) / 180;
  const ex = XO * Math.sin(t);
  const ez = ZO * Math.cos(t);
  const nl = Math.hypot(ex / XO ** 2, ez / ZO ** 2);
  const nx = ex / XO ** 2 / nl;
  const nz = ez / ZO ** 2 / nl;
  return { x: ex + nx * lift, z: ez + nz * lift, angle: (Math.atan2(nx, nz) * 180) / Math.PI };
}
const POUCH = onBand(-62);
const RING = onBand(62);
const KEEP = onBand(24, 0);
const TAIL = onBand(40, 0.003);

/** Avatar torso (assets/avatar-base.ts) at 2x, moved so worn y 0.251 maps to the band centre. */
const torsoPoints: [number, number][] = [
  [0, 0.47],
  [0.07, 0.465],
  [0.105, 0.44],
  [0.125, 0.4],
  [0.13, 0.34],
  [0.124, 0.29],
  [0.13, 0.25],
  [0.138, 0.2],
  [0.14, 0.165],
  [0.132, 0.152],
  [0, 0.152],
];
const torso = sdf
  .revolve(
    profile.polygon(
      torsoPoints.map(([r, y]): [number, number] => [2 * r, 2 * (y - BELT_WORN_Y) + BAND_Y]),
      { smooth: true, samples: 8 },
    ),
  )
  .scale([1, 1, 0.78]);

/** Shared leather paint: warm grain, darker toward the ground, lit top edge. */
function leatherPaint(x: number, y: number, z: number): readonly [number, number, number] {
  const patch = 0.5 + 0.5 * noise.fbm(x * 8 + 2, y * 8, z * 8, 2);
  const grain = 0.5 + 0.5 * noise.fbm(x * 55, y * 90, z * 55, 2);
  let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.05 + 0.2 * patch);
  c = mixRgb(c, LEATHER_DARK, 0.06 + 0.2 * grain);
  const t = clamp01((y - LIFT) / WIDTH);
  c = mixRgb(c, LEATHER_LIGHT, 0.3 * ss(0.62, 1, t));
  c = mixRgb(c, LEATHER_DEEP, 0.4 * ss(0.3, 0, t));
  return c;
}

/** Pouch: the back plate reads, with a deep crease under the folded flap and a shaded base. */
function pouchPaint(x: number, y: number, z: number): readonly [number, number, number] {
  const pa = (POUCH.angle * Math.PI) / 180;
  const lz = ((x - POUCH.x) * Math.sin(pa) + (z - POUCH.z) * Math.cos(pa)) / POUCH_SCALE;
  const ly = (y - POUCH_Y) / POUCH_SCALE + 0.004;
  let c = leatherPaint(x, y, z);
  const outer = ss(0, 0.012, lz);
  c = mixRgb(c, LEATHER_DEEP, 0.7 * outer * ss(0.012, 0.004, ly - 0.0));
  c = mixRgb(c, LEATHER_LIGHT, 0.3 * outer * ss(0.012, 0.03, ly));
  return c;
}

/** The band: a lit outer wall and rim, a deep inner wall, stitch dashes near both edges. */
function bandPaint(x: number, y: number, z: number): readonly [number, number, number] {
  const patch = 0.5 + 0.5 * noise.fbm(x * 8 + 2, y * 8, z * 8, 2);
  const grain = 0.5 + 0.5 * noise.fbm(x * 55, y * 90, z * 55, 2);
  const r = ellipseR(x, z);
  const t = clamp01((y - LIFT) / WIDTH);
  let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.05 + 0.2 * patch);
  c = mixRgb(c, LEATHER_DARK, 0.06 + 0.2 * grain);
  c = mixRgb(c, LEATHER_LIGHT, 0.28 * ss(0.68, 1, t));
  c = mixRgb(c, LEATHER_DEEP, 0.5 * ss(0.25, 0.02, t));
  c = mixRgb(c, LEATHER_DEEP, 0.9 * ss(0.96, 0.9, r)); // deep inner wall
  if (r > 0.95) {
    const a = Math.atan2(z / ZO, x / XO);
    const onSeam = Math.abs(y - LIFT - 0.012) < 0.0022 || Math.abs(y - LIFT - (WIDTH - 0.012)) < 0.0022;
    if (onSeam && Math.sin(a * 80) > 0.2) c = mixRgb(c, THREAD, 0.7);
  }
  return c;
}

const grainBump = (x: number, y: number, z: number) =>
  0.0006 * noise.fbm(x * 40, y * 70, z * 40, 2) + 0.0004 * noise.fbm(x * 120, y * 120, z * 120, 2);

export default defineAsset({
  name: 'belt',
  description:
    'A chunky tan leather belt that follows the waist, with a big square brass buckle in front, a flapped pouch with two brass studs on the right hip and a brass ring with a strap loop on the left.',
  detail: 0.008,
  reference: 'docs/item-mockups/belt-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'waist', fitScale: 2, origin: [0, 0.113 + LIFT, 0] },

  build(k) {
    // ------------------------------------------------------------------ leather band
    const G = 0.03; // outer skin offset from the shirt (asset m)
    const T = 0.02; // thickness
    const band = torso
      .round(G)
      .subtract(torso.round(G - T))
      .smoothIntersect(0.006, sdf.box([1, WIDTH, 1], 0.01).at(0, BAND_Y, 0));
    k.body('belt', band.paintFn(bandPaint), {
      color: '#8a5a35',
      roughness: 0.65,
      metalness: 0,
      detail: 0.006,
      maxError: 0.0006,
      paintWeight: 1.5,
      maxTriangles: 4000,
      bump: grainBump,
    });

    // ------------------------------------------------------------------ keeper + strap tail
    const keeper = sdf
      .box([0.02, 0.082, 0.04], 0.008)
      .rotateY(KEEP.angle)
      .at(KEEP.x, BAND_Y, KEEP.z);
    const tail = sdf
      .box([0.05, 0.05, 0.012], 0.005)
      .rotateY(TAIL.angle)
      .at(TAIL.x, BAND_Y, TAIL.z);
    k.body('keeper', sdf.union(keeper, tail).paintFn(leatherPaint), {
      color: '#5c3a22',
      roughness: 0.7,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 400,
      bump: grainBump,
    });

    // ------------------------------------------------------------------ pouch (right hip, -X)
    const pouch = sdf
      .smoothUnion(
        0.006,
        sdf.box([0.11, 0.1, 0.022], 0.01), // back plate against the belt
        sdf.box([0.09, 0.066, 0.016], 0.006).at(0, -0.016, 0.017), // lower front pocket
      )
      .union(sdf.box([0.114, 0.04, 0.028], 0.012).at(0, 0.03, 0.005)) // folded flap
      .union(sdf.box([0.02, 0.08, 0.009], 0.004).at(0, -0.004, 0.025)) // vertical seam strap
      .scale(POUCH_SCALE)
      .rotateY(POUCH.angle)
      .at(POUCH.x, POUCH_Y, POUCH.z);
    k.body('pouch', pouch.paintFn(pouchPaint), {
      color: '#8a5a35',
      roughness: 0.65,
      metalness: 0,
      detail: 0.006,
      maxError: 0.0008,
      paintWeight: 1.5,
      maxTriangles: 700,
      bump: grainBump,
    });

    // ------------------------------------------------------------------ left-hip strap loop
    const loop = sdf
      .box([0.03, 0.07, 0.016], 0.006)
      .rotateY(RING.angle)
      .at(RING.x, BAND_Y, RING.z);
    k.body('loop', loop.paintFn(leatherPaint), {
      color: '#5c3a22',
      roughness: 0.7,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 250,
      bump: grainBump,
    });

    // ------------------------------------------------------------------ brass
    const rivet = sdf.cylinder(0.0085, 0.009, 0.002).rotateX(90).at(0, 0, 0.0285);
    const studs = sdf
      .union(rivet.at(0.032, 0.03, 0), rivet.at(-0.032, 0.03, 0))
      .scale(POUCH_SCALE)
      .rotateY(POUCH.angle)
      .at(POUCH.x, POUCH_Y, POUCH.z);
    const ring = sdf
      .torus(0.026, 0.0075)
      .rotateX(90)
      .rotateY(RING.angle)
      .at(RING.x + 0.016 * Math.sin((RING.angle * Math.PI) / 180), BAND_Y - 0.004, RING.z + 0.016 * Math.cos((RING.angle * Math.PI) / 180));

    const BUCKLE_Z = ZO + 0.004;
    const frame = sdf
      .box([0.1, 0.095, 0.02], 0.01)
      .smoothSubtract(0.007, sdf.box([0.066, 0.061, 0.04], 0.008))
      .at(0, BAND_Y, BUCKLE_Z);
    const prong = sdf.box([0.012, 0.086, 0.016], 0.005).at(0, BAND_Y, BUCKLE_Z + 0.007);

    k.body('brass', sdf.union(frame, prong, studs, ring), {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.005,
      maxTriangles: 1200,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
  },
});
