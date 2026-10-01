import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather belt (equipment/armor/belt).
 *
 * Role: hero gear item / pickup. Reads at 128 px as a chunky tan leather loop
 *   with one bright brass square buckle. Focal point: the buckle.
 * Size: elliptical loop 0.50 m wide (x) by 0.39 m deep (z), the hero waist at 2x (fit contract, anchor hips), 0.07 m of belt width, 0.024 m thick, ~0.096 m tall;
 *   lies flat on y = 0, centred on the Y axis, buckle toward +Z.
 * One idea: a loose leather belt coiled flat on the ground, its big square
 *   brass buckle standing up at the front and a small riveted pouch on the
 *   right. Exaggerate the buckle (oversized, glossy).
 * Shape language: square dominant at the focal point (buckle frame), round
 *   everywhere else (soft loop, fat rivets, rounded pouch).
 * Palette: leather #8a5a35 dominant, dark leather #5c3a22 secondary, brass
 *   #d4a93a accent. Value plan: mid leather band, dark straps/keeper, bright
 *   brass buckle on top.
 * Materials: leather (roughness 0.65), dark leather (roughness 0.7),
 *   polished brass (roughness 0.3, metalness 1).
 * Detail: leather loop, buckle frame + prong, stitched strap end, keeper
 *   collar, pouch plate + flap + two rivets, grain and edge shading in paint.
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

// Loop: outer radius 0.175 (0.35 m across), belt 0.07 m wide, 0.024 m thick.
const R_OUT = 0.195; // z outer semi-axis; x is stretched by SX to 0.25
const SX = 0.25 / R_OUT;
/** Elliptical radius: 1 unit = the loop centre line scale of the revolve. */
const er = (x: number, z: number) => Math.hypot(x / SX, z);
const THICK = 0.012; // radial half-thickness
const WIDTH = 0.07; // vertical belt width
const R_MAJOR = R_OUT - THICK; // 0.1675
const BAND_Y = WIDTH / 2; // 0.0325, so the band rests on y = 0

const th = (62 * Math.PI) / 180; // ellipse parameter of the pouch, from +Z toward +X
const ex = 0.25 * Math.sin(th);
const ez = R_OUT * Math.cos(th);
const nl = Math.hypot(ex / 0.25 ** 2, ez / R_OUT ** 2);
const nx = ex / 0.25 ** 2 / nl;
const nz = ez / R_OUT ** 2 / nl;
const POUCH_ANGLE = (Math.atan2(nx, nz) * 180) / Math.PI; // outward normal direction
const pa = (POUCH_ANGLE * Math.PI) / 180;
const POUCH_X = ex + nx * 0.004;
const POUCH_Z = ez + nz * 0.004;

/** Shared leather paint: warm grain, darker toward the ground, lit top edge. */
function leatherPaint(x: number, y: number, z: number): readonly [number, number, number] {
  const patch = 0.5 + 0.5 * noise.fbm(x * 8 + 2, y * 8, z * 8, 2);
  const grain = 0.5 + 0.5 * noise.fbm(x * 55, y * 90, z * 55, 2);
  let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.05 + 0.2 * patch);
  c = mixRgb(c, LEATHER_DARK, 0.06 + 0.2 * grain);
  const t = clamp01(y / WIDTH);
  c = mixRgb(c, LEATHER_LIGHT, 0.3 * ss(0.62, 1, t));
  c = mixRgb(c, LEATHER_DEEP, 0.55 * ss(0.36, 0, t));
  return c;
}

/** Pouch: the back plate reads, with a deep crease under the folded flap and a shaded base. */
function pouchPaint(x: number, y: number, z: number): readonly [number, number, number] {
  const dx = x - POUCH_X;
  const dz = z - POUCH_Z;
  const ly = y - 0.046;
  const lz = dx * Math.sin(pa) + dz * Math.cos(pa);
  let c = leatherPaint(x, y, z);
  const outer = ss(0, 0.012, lz);
  c = mixRgb(c, LEATHER_DEEP, 0.7 * outer * ss(0.024, 0.012, ly)); // seam under the flap
  c = mixRgb(c, LEATHER_DEEP, 0.5 * outer * ss(-0.014, -0.03, ly)); // shaded lower edge
  c = mixRgb(c, LEATHER_LIGHT, 0.35 * outer * ss(0.03, 0.045, ly)); // lit flap top
  return c;
}

/** The band reads by value: a lit outer wall and rim, a deep inner wall and base. */
function bandPaint(x: number, y: number, z: number): readonly [number, number, number] {
  const patch = 0.5 + 0.5 * noise.fbm(x * 8 + 2, y * 8, z * 8, 2);
  const grain = 0.5 + 0.5 * noise.fbm(x * 55, y * 90, z * 55, 2);
  const r = er(x, z);
  const t = clamp01(y / WIDTH);
  let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.05 + 0.2 * patch);
  c = mixRgb(c, LEATHER_DARK, 0.06 + 0.2 * grain);
  c = mixRgb(c, LEATHER_LIGHT, 0.32 * ss(0.68, 1, t)); // sun-lit top rim
  c = mixRgb(c, LEATHER_DEEP, 0.85 * ss(0.4, 0.02, t)); // shaded base
  c = mixRgb(c, LEATHER_DEEP, 0.9 * clamp01((R_MAJOR - r) / THICK)); // deep inner wall
  c = mixRgb(c, LEATHER_LIGHT, 0.3 * clamp01((r - R_MAJOR) / THICK) * ss(0.4, 0.95, t)); // lit outer wall
  // Stitch dashes run near the top and bottom edges of the band.
  const a = Math.atan2(z, x);
  const onSeam = Math.abs(y - 0.014) < 0.0022 || Math.abs(y - (WIDTH - 0.014)) < 0.0022;
  if (onSeam && Math.sin(a * 95) > 0.35) c = mixRgb(c, THREAD, 0.6);
  return c;
}

const grainBump = (x: number, y: number, z: number) =>
  0.0006 * noise.fbm(x * 40, y * 70, z * 40, 2) + 0.0004 * noise.fbm(x * 120, y * 120, z * 120, 2);

/** A flat band profile (U = radius, V = height) with rounded edges. */
const bandProfile = profile.polygon(
  [
    [R_MAJOR - THICK, BAND_Y + WIDTH * 0.28],
    [R_MAJOR - THICK, BAND_Y - WIDTH * 0.28],
    [R_MAJOR - THICK * 0.35, BAND_Y - WIDTH * 0.5],
    [R_MAJOR + THICK * 0.35, BAND_Y - WIDTH * 0.5],
    [R_MAJOR + THICK, BAND_Y - WIDTH * 0.28],
    [R_MAJOR + THICK, BAND_Y + WIDTH * 0.28],
    [R_MAJOR + THICK * 0.35, BAND_Y + WIDTH * 0.5],
    [R_MAJOR - THICK * 0.35, BAND_Y + WIDTH * 0.5],
  ],
  { smooth: true, samples: 10 },
);

export default defineAsset({
  name: 'belt',
  description:
    'A loose tan leather belt coiled flat on the ground, with a big square brass buckle standing at the front and a small riveted leather pouch at the side.',
  detail: 0.008,
  reference: 'docs/item-mockups/belt-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'waist', fitScale: 2, origin: [0, 0.035, 0] },

  build(k) {
    // ------------------------------------------------------------------ leather loop
    // A surface of revolution: a flat belt band laid in the XZ plane.
    const band = sdf.revolve(bandProfile).scale([SX, 1, 1]);
    k.body('belt', band.paintFn(bandPaint), {
      color: '#8a5a35',
      roughness: 0.65,
      metalness: 0,
      detail: 0.009,
      maxError: 0.0008,
      paintWeight: 1.5,
      maxTriangles: 1200,
      bump: grainBump,
    });

    // ------------------------------------------------------------------ strap end
    // The free end of the belt runs out through the buckle and rests flat on
    // the ground, so the loop reads as a belt and not a plain ring.
    const strap = sdf
      .box([0.05, 0.013, 0.1], 0.005)
      .union(sdf.cylinder(0.0065, 0.014, 0.003).at(0, 0, 0.048))
      .rotateY(9)
      .at(0.02, 0.008, 0.132);
    k.body('strap', strap.paintFn((x, y, z) => {
      let c = leatherPaint(x, y, z);
      // Worn darker tip past the last hole.
      c = mixRgb(c, LEATHER_DARK, 0.4 * Math.max(0, Math.min(1, (z - 0.16) / 0.03)));
      return c;
    }), {
      color: '#8a5a35',
      roughness: 0.65,
      metalness: 0,
      detail: 0.007,
      paintWeight: 1.5,
      maxTriangles: 240,
      bump: grainBump,
    });

    // ------------------------------------------------------------------ keeper collar
    // A dark leather keeper wraps the band just before the buckle.
    const kt = (22 * Math.PI) / 180;
    const kx = SX * R_MAJOR * Math.sin(kt);
    const kz = R_MAJOR * Math.cos(kt);
    const kl = Math.hypot(kx / (SX * R_MAJOR) ** 2, kz / R_MAJOR ** 2);
    const keeper = sdf
      .box([0.018, 0.078, 0.036], 0.008)
      .rotateY((Math.atan2(kx / (SX * R_MAJOR) ** 2 / kl, kz / R_MAJOR ** 2 / kl) * 180) / Math.PI)
      .at(kx, BAND_Y + 0.005, kz);
    k.body('keeper', keeper.paintFn(leatherPaint), {
      color: '#5c3a22',
      roughness: 0.7,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 180,
      bump: grainBump,
    });

    // ------------------------------------------------------------------ pouch
    // A flat riveted pocket sewn on the outside of the band (local +Z is outward).
    const pouch = sdf
      .smoothUnion(
        0.006,
        sdf.box([0.085, 0.09, 0.02], 0.01), // back plate against the belt
        sdf.box([0.07, 0.052, 0.014], 0.005).at(0, -0.016, 0.015), // lower front pocket
      )
      .union(sdf.box([0.089, 0.032, 0.024], 0.01).at(0, 0.033, 0.004)) // folded flap
      .union(sdf.box([0.018, 0.07, 0.008], 0.004).at(0, -0.006, 0.023)) // vertical seam strap
      .rotateY(POUCH_ANGLE)
      .at(POUCH_X, 0.046, POUCH_Z);
    k.body('pouch', pouch.paintFn(pouchPaint), {
      color: '#8a5a35',
      roughness: 0.65,
      metalness: 0,
      detail: 0.006,
      maxError: 0.0008,
      paintWeight: 1.5,
      maxTriangles: 500,
      bump: grainBump,
    });

    // ------------------------------------------------------------------ pouch rivets
    const rivet = sdf.cylinder(0.0075, 0.008, 0.002).rotateX(90).at(0, 0, 0.017);
    const rivets = sdf
      .union(rivet.at(0.03, 0.034, 0), rivet.at(-0.03, 0.034, 0))
      .rotateY(POUCH_ANGLE)
      .at(POUCH_X, 0.046, POUCH_Z);

    // ------------------------------------------------------------------ buckle
    // Big square brass frame standing at the front (+Z), face toward the viewer.
    const BUCKLE_Y = 0.0475;
    const BUCKLE_Z = 0.19;
    const frame = sdf
      .box([0.1, 0.095, 0.02], 0.01)
      .smoothSubtract(0.007, sdf.box([0.066, 0.061, 0.04], 0.008))
      .at(0, BUCKLE_Y, BUCKLE_Z);
    const prong = sdf.box([0.012, 0.086, 0.016], 0.005).at(0, BUCKLE_Y, BUCKLE_Z + 0.007);

    k.body('brass', sdf.union(frame, prong, rivets), {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.005,
      maxTriangles: 430,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
  },
});
