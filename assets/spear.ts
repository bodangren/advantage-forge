import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — spear (equipment/melee-weapons/spear).
 *
 * Role: equipment weapon / pickup icon. It must read at 128 px as a clear
 *   vertical silhouette: a long slim shaft crowned by a large leaf-shaped
 *   steel head, with a leather wrap at hand height and an iron butt on the
 *   ground.
 * Size: 1.5 m tall, stands on its iron butt at y = 0, centred on Y, faces +Z.
 * One idea: a slim straight pole with a single bold leaf blade on top — the
 *   shaft is one mass, the blade is the focal point.
 * Shape language: vertical/square dominant (long straight shaft), round
 *   secondary (chunky butt cap, soft wrap, flared socket, lens-section blade).
 * Palette: walnut #6b4226 / #54331d, iron #4a4f55 / #363a3f with highlight
 *   #a8acb1, steel edge #c8ccd2, leather #6e4526 / dark #4e3018. 60/30/10.
 * Materials: walnut wood (roughness 0.8), worn iron (roughness 0.5,
 *   metalness 0.7), polished steel (roughness 0.3, metalness 1), leather
 *   wrap (roughness 0.7).
 * Detail: iron butt + flared iron socket + leather wrap (handles) + long
 *   walnut shaft + leaf steel head with a darker central bevel.
 * Rig/animation: none (static prop).
 */

// Palette -----------------------------------------------------------------
const IRON = '#4a4f55';
const IRON_DEEP = '#363a3f';
const IRON_LIGHT = '#a8acb1';
const WALNUT = '#6b4226';
const WALNUT_DEEP = '#54331d';
const WALNUT_LIGHT = '#c08a44';
const STEEL = '#c8ccd2';
const STEEL_DEEP = '#8e959e';
const LEATHER = '#6e4526';
const LEATHER_DARK = '#4e3018';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Proportions (meters) ----------------------------------------------------
// Total length 1.5 m. From bottom up:
//   iron butt  0.00 - 0.07   (7 cm)
//   walnut     0.07 - 1.04   (97 cm)
//   leather    0.46 - 0.58   (12 cm wrap, over the shaft)
//   iron sock. 1.04 - 1.22   (18 cm flared socket)
//   steel blade 1.22 - 1.50  (28 cm leaf head)
const BUTT_TOP = 0.07;
const SHAFT_TOP = 1.04;
const WRAP_Y0 = 0.46;
const WRAP_Y1 = 0.58;
const SOCKET_TOP = 1.22;
const BLADE_TOP = 1.50;

const SHAFT_R = 0.022;

// Walnut paint: warm honey base, fine grain, big tonal patches, lit crown,
// deep butt.
const walnutPaint = (x: number, y: number, z: number) => {
  let c = rgb(WALNUT);
  const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 4, z * 30, 2);
  c = mixRgb(c, rgb(WALNUT_DEEP), 0.32 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 7 + 5, y * 7, z * 7, 2);
  c = mixRgb(c, rgb(WALNUT_LIGHT), 0.5 * patch);
  const top = clamp01((y - 0.15) / 0.8);
  c = mixRgb(c, rgb(WALNUT_LIGHT), 0.16 * top);
  const low = clamp01((0.09 - y) / 0.10);
  c = mixRgb(c, rgb(WALNUT_DEEP), 0.4 * low);
  return c;
};

// Iron paint: dark base, tarnish patches, light top band, shadowed underside.
const ironPaint = (x: number, y: number, z: number, base: string) => {
  let c = rgb(base);
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 22 + 3, y * 22, z * 22, 2);
  c = mixRgb(c, rgb(IRON_DEEP), 0.32 * tarnish);
  // Lighter top of each piece, darker bottom for a chunky volumetric read.
  const top = clamp01((y - 0.04) / 0.02);
  c = mixRgb(c, rgb(IRON_LIGHT), 0.28 * top);
  const low = clamp01((0.035 - y) / 0.035);
  c = mixRgb(c, rgb(IRON_DEEP), 0.45 * low);
  return c;
};

// Steel paint: bright polished with subtle sheen.
const steelPaint = (x: number, y: number, z: number) => {
  let c = rgb(STEEL);
  const sheen = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
  c = mixRgb(c, rgb(STEEL_DEEP), 0.22 * sheen);
  return c;
};

export default defineAsset({
  name: 'spear',
  description:
    'Spear, 1.5 m: a straight walnut shaft on an iron butt, with a leather wrap at hand height, a flared iron socket, and a long leaf-shaped steel head.',
  detail: 0.005,
  reference: 'docs/item-mockups/spear-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ----------------------------------------------------- iron butt cap
    // A short, rounded cylinder that flares slightly, sits flush with the
    // ground at y = 0. The bottom point of the profile is (0, 0).
    const buttProfile = profile.polygon(
      [
        [0.0, 0.0],
        [0.024, 0.0],
        [0.028, 0.005],
        [0.030, 0.020],
        [0.026, 0.040],
        [0.028, 0.055],
        [0.024, 0.068],
        [0.0, 0.068],
      ],
      { smooth: true, samples: 8 },
    );
    const butt = sdf.revolve(buttProfile).paintFn((x, y, z) => ironPaint(x, y, z, IRON));

    k.body('butt', butt, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 380,
    });

    // ----------------------------------------------------- walnut shaft
    // A long, straight cylinder. Rounded edge so the silhouette has no razor.
    const shaft = sdf
      .cylinder(SHAFT_R, SHAFT_TOP - BUTT_TOP, 0.008)
      .at(0, (SHAFT_TOP + BUTT_TOP) / 2, 0)
      .paintFn(walnutPaint);

    k.body('shaft', shaft, {
      color: WALNUT,
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 22, y * 5, z * 22, 2) - 0.5),
      maxTriangles: 800,
    });

    // ----------------------------------------------------- leather wrap
    // A capsule around the shaft at hand height with a spiral paint pattern.
    const wrap = sdf
      .capsule([0, WRAP_Y0, 0], [0, WRAP_Y1, 0], 0.030)
      .paintFn((x, y, z) => {
        const ang = Math.atan2(z, x);
        const spiral = Math.sin(ang + (y - WRAP_Y0) * 90);
        if (y < WRAP_Y0 + 0.018 || y > WRAP_Y1 - 0.018) return rgb(LEATHER_DARK);
        return spiral > 0.1 ? rgb(LEATHER_DARK) : rgb(LEATHER);
      });

    k.body('wrap', wrap, {
      color: LEATHER,
      roughness: 0.68,
      metalness: 0,
      detail: 0.0045,
      bump: (x, y, z) => 0.0013 * Math.abs(Math.sin(Math.atan2(z, x) + y * 95)),
      maxTriangles: 600,
      textureDensity: 2,
    });

    // ----------------------------------------------------- iron socket
    // A flared cup. Collar at the base, then a small pinched waist, then a
    // wider bulb that holds the blade.
    const socketHeight = SOCKET_TOP - SHAFT_TOP; // 0.18
    const collarH = 0.020;
    const waistH = 0.030;
    const bulbH = socketHeight - collarH - waistH; // 0.130

    const collar = sdf
      .cone([0, SHAFT_TOP, 0], [0, SHAFT_TOP + collarH, 0], SHAFT_R + 0.009, SHAFT_R + 0.013)
      .paintFn((x, y, z) => ironPaint(x, y, z, IRON));

    const waist = sdf
      .cone([0, SHAFT_TOP + collarH, 0], [0, SHAFT_TOP + collarH + waistH, 0], SHAFT_R + 0.013, SHAFT_R + 0.005)
      .paintFn((x, y, z) => ironPaint(x, y, z, IRON));

    const bulb = sdf
      .cone(
        [0, SHAFT_TOP + collarH + waistH, 0],
        [0, SOCKET_TOP, 0],
        SHAFT_R + 0.005,
        0.038,
      )
      .paintFn((x, y, z) => ironPaint(x, y, z, IRON));

    const socket = sdf.smoothUnion(0.005, collar, waist, bulb);

    k.body('socket', socket, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 500,
    });

    // ----------------------------------------------------- steel blade
    // Leaf outline in the XY plane, lens cross-section for sharp edges.
    const BLADE_W = 0.060;                     // half-width at widest
    const BLADE_H = BLADE_TOP - SOCKET_TOP;    // 0.28 m blade height
    const BLADE_T = 0.014;                     // full blade thickness

    const bladeOutline = profile.polygon(
      [
        [0.000, 0.000],
        [0.018, 0.012],
        [0.034, 0.034],
        [0.052, 0.066],
        [BLADE_W, 0.100],
        [0.055, 0.140],
        [0.034, 0.180],
        [0.020, 0.220],
        [0.008, BLADE_H * 0.92],
        [0.000, BLADE_H],
        [-0.008, BLADE_H * 0.92],
        [-0.020, 0.220],
        [-0.034, 0.180],
        [-0.055, 0.140],
        [-BLADE_W, 0.100],
        [-0.052, 0.066],
        [-0.034, 0.034],
        [-0.018, 0.012],
      ],
      { smooth: true, samples: 6 },
    );

    // Lens: overlap of two big upright cylinders so the blade has a sharp
    // edge on the sides and a fuller-thin tip.
    const R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / (BLADE_T / 2);
    const lens = sdf.intersect(
      sdf.cylinder(R, BLADE_H * 2).at(0, BLADE_H / 2, R - BLADE_T / 2),
      sdf.cylinder(R, BLADE_H * 2).at(0, BLADE_H / 2, -(R - BLADE_T / 2)),
    );

    const blade = sdf
      .extrude(bladeOutline, 0.2, 0.0015)
      .intersect(lens)
      .at(0, SOCKET_TOP, 0)
      .paintWhere(
        sdf.extrude(profile.rect([0.020, BLADE_H * 0.6]), 0.2).at(0, SOCKET_TOP + BLADE_H * 0.5, 0),
        STEEL_DEEP,
        0.005,
      )
      .paintFn(steelPaint);

    k.body('blade', blade, {
      color: STEEL,
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 400, y * 20, z * 400, 2),
      maxTriangles: 600,
      textureDensity: 2,
    });
  },
});