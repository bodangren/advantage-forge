import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — standing village banner (catalog props/world/banner).
 *
 * Role: a landmark prop for the chibi hamlet. It must read at 128 px.
 * Size: 2.0 m tall. The pole is on the Y axis. The asset stands on y = 0 and faces +Z.
 * One idea: a deep blue swallowtail cloth hangs from a honey-oak crossbar, with a white
 *   shield and a gold cord border as the focal point.
 * Shape language: soft rounded cloth and ball finials, with a triangular swallowtail break.
 * Palette: blue #2f6aa8 dominant, honey oak #b5814a secondary, gold #d9a93a accent,
 *   shield #f3ecdf. Dark folds and iron sit under the light shield.
 * Materials: wood, cloth, gold, shield enamel, iron.
 * Detail: pole, crossbar, cross foot, roll, and cord (primary); shield and finials
 *   (focal); grain and weave in bump. No rig.
 */

const WOOD = rgb('#b5814a');
const WOOD_MID = rgb('#8a5a35');
const WOOD_PALE = rgb('#c9a06a');
const WOOD_DEEP = rgb('#6b4226');
const BLUE = rgb('#2f6aa8');
const BLUE_DEEP = rgb('#1a3f6c');
const BLUE_LIFT = rgb('#4d8fc4');
const GOLD = rgb('#d9a93a');
const GOLD_LIGHT = rgb('#f4d78a');
const GOLD_DEEP = rgb('#7a5814');
const SHIELD = rgb('#f3ecdf');
const SHIELD_SHADE = rgb('#d5cbb8');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// ---------------------------------------------------------------- layout
const BAR_Y = 1.74;
const POLE_R0 = 0.044;
const POLE_R1 = 0.032;
const CLOTH_HALF = 0.015;
const CORD_R = 0.026;
const Z0 = 0.06;
const AMP = 0.024;
const KX = Math.PI / 0.42;

/** Sheet centre Z. A crest faces +Z at x = 0 so the side view is not a line. */
const clothZ = (x: number): number => Z0 + AMP * Math.cos(KX * x);
const slopeOf = (x: number): number => -AMP * KX * Math.sin(KX * x);
const panelAngle = (x: number): number => (-Math.atan(slopeOf(x)) * 180) / Math.PI;

/**
 * Swallowtail edge, from the upper left, down around both tails, up to the upper right.
 * Tips sit at the outer hem. The centre notch is higher. The top edge is separate.
 */
const EDGE: [number, number][] = [
  [-0.4, 1.66],
  [-0.418, 1.14],
  [-0.4, 0.58],
  [-0.378, 0.32],
  [-0.36, 0.18],
  [-0.26, 0.3],
  [-0.12, 0.42],
  [0, 0.52],
  [0.12, 0.42],
  [0.26, 0.3],
  [0.36, 0.18],
  [0.378, 0.32],
  [0.4, 0.58],
  [0.418, 1.14],
  [0.4, 1.66],
];

const CLOTH_PTS: [number, number][] = [
  [-0.4, 1.75],
  [0.4, 1.75],
  ...EDGE.slice(1),
];

/** Heater shield outline in world XY. Point down. */
function heater(cx: number, cy: number, hw: number, hh: number): [number, number][] {
  const top = cy + hh * 0.4;
  const shoulder = cy + hh * 0.06;
  const tip = cy - hh * 0.6;
  return [
    [cx - hw, top],
    [cx + hw, top],
    [cx + hw, shoulder],
    [cx + hw * 0.58, cy - hh * 0.16],
    [cx, tip],
    [cx - hw * 0.58, cy - hh * 0.16],
    [cx - hw, shoulder],
  ];
}

/** Rippled cloth sheet. zLift moves a copy forward for a raised appliqué. */
function sheet(thickness: number, zLift: number): Sdf {
  const panels: Sdf[] = [];
  const n = 12;
  const x0 = -0.5;
  const x1 = 0.5;
  const step = (x1 - x0) / (n - 1);
  for (let i = 0; i < n; i++) {
    const x = x0 + step * i;
    panels.push(
      sdf
        .box([step + 0.045, 1.74, thickness], 0.006)
        .rotateY(panelAngle(x))
        .at(x, 0.94, clothZ(x) + zLift),
    );
  }
  return sdf.smoothUnion(0.032, ...panels);
}

const woodPaint = (x: number, y: number, z: number): Rgb => {
  const onBar = y > 1.66 && y < 1.84 && Math.abs(x) > 0.06;
  const onFoot = y < 0.1;
  // Sit darker than the gold so the two warm materials separate by value.
  let c = mixRgb(WOOD_MID, WOOD, 0.42);
  if (onBar) {
    const g = noise.fbm(x * 36, y * 8, z * 8, 2);
    c = mixRgb(c, WOOD_MID, 0.4 * clamp01(g));
    c = mixRgb(c, WOOD_PALE, 0.36 * clamp01(-g));
  } else if (onFoot) {
    const along = Math.abs(x) > Math.abs(z) ? x : z;
    const g = noise.fbm(along * 28, y * 10, x * 6 + z * 6, 2);
    c = mixRgb(c, WOOD_MID, 0.36 * clamp01(g));
    c = mixRgb(c, WOOD_PALE, 0.22 * clamp01(-g));
    c = mixRgb(c, WOOD_DEEP, 0.72 * clamp01((0.05 - y) / 0.05));
  } else {
    const g = noise.fbm(x * 9, y * 48, z * 9, 2);
    c = mixRgb(c, WOOD_MID, 0.38 * clamp01(g));
    c = mixRgb(c, WOOD_PALE, 0.3 * clamp01(-g));
    c = mixRgb(c, WOOD_DEEP, 0.55 * clamp01((0.35 - y) / 0.35));
  }
  return c;
};

const clothPaint = (x: number, y: number, z: number): Rgb => {
  const fold = Math.cos(KX * x);
  let c = BLUE;
  c = mixRgb(c, BLUE_DEEP, 0.7 * clamp01(-fold));
  c = mixRgb(c, BLUE_LIFT, 0.16 * clamp01(fold));
  c = mixRgb(c, BLUE_DEEP, 0.55 * clamp01((0.7 - y) / 0.5));
  c = mixRgb(c, BLUE_LIFT, 0.12 * clamp01((y - 1.45) / 0.28));
  const n = noise.fbm(x * 12, y * 12, z * 12, 2);
  c = mixRgb(c, BLUE_DEEP, 0.1 * clamp01(n));
  c = mixRgb(c, BLUE_LIFT, 0.08 * clamp01(-n));
  return c;
};

const goldPaint = (x: number, y: number, z: number): Rgb => {
  let c = GOLD;
  c = mixRgb(c, GOLD_LIGHT, 0.4 * clamp01((z - 0.04) / 0.08) + 0.18 * clamp01((y - 1.2) / 0.8));
  c = mixRgb(c, GOLD_DEEP, 0.45 * clamp01((0.04 - z) / 0.08));
  const n = noise.fbm(x * 22, y * 22, z * 22, 2);
  c = mixRgb(c, GOLD_DEEP, 0.12 * clamp01(n));
  return c;
};

export default defineAsset({
  name: 'banner',
  description:
    'Standing village banner: honey-oak pole and cross foot, blue swallowtail cloth, gold cord border, and a white shield.',
  detail: 0.01,
  reference: 'docs/item-mockups/banner-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wood
    const pole = sdf.cone([0, 0.02, 0], [0, 1.92, 0], POLE_R0, POLE_R1);
    const bar = sdf.capsule([-0.52, BAR_Y, 0], [0.52, BAR_Y, 0], 0.03);
    const footX = sdf.box([0.76, 0.086, 0.11], 0.02).at(0, 0.046, 0);
    const footZ = sdf.box([0.11, 0.086, 0.64], 0.02).at(0, 0.046, 0);
    const woodOpts = {
      color: '#b5814a' as const,
      roughness: 0.82,
      metalness: 0,
      detail: 0.012,
      maxError: 0.005,
      bump: (x: number, y: number, z: number) => 0.0014 * noise.fbm(x * 8, y * 36, z * 8, 2),
    };
    // Pole and bar share a fillet. The foot stays separate: a crossed union
    // folds under reduction and the build then keeps the full mesh.
    k.body('wood', sdf.smoothUnion(0.014, pole, bar).paintFn(woodPaint), { ...woodOpts, maxTriangles: 620 });
    const footPaint = (x: number, y: number, z: number): Rgb => {
      const along = Math.abs(x) > Math.abs(z) ? x : z;
      const g = noise.fbm(along * 28, y * 10, x * 6 + z * 6, 2);
      let c = mixRgb(WOOD_DEEP, WOOD_MID, 0.35);
      c = mixRgb(c, WOOD_PALE, 0.16 * clamp01(-g));
      c = mixRgb(c, rgb('#3a2414'), 0.55 * clamp01(g) + 0.35 * clamp01((0.04 - y) / 0.04));
      return c;
    };
    k.body('foot', sdf.smoothUnion(0.016, footX, footZ).paintFn(footPaint), { ...woodOpts, maxTriangles: 280 });

    // ------------------------------------------------------------------ cloth
    const outline = sdf.extrude(profile.polygon(CLOTH_PTS), 0.5, 0.008).at(0, 0, 0.07);
    const hung = sdf.intersect(sheet(0.03, 0), outline).round(0.006);
    const roll = sdf.capsule([-0.355, 1.755, 0.052], [0.355, 1.755, 0.052], 0.052);
    k.body('cloth', sdf.smoothUnion(0.014, hung, roll).paintFn(clothPaint), {
      color: '#2f6aa8',
      roughness: 0.88,
      metalness: 0,
      detail: 0.01,
      maxError: 0.005,
      maxTriangles: 900,
      paintWeight: 2,
      bump: (x, y, z) => 0.0013 * noise.fbm(x * 28, y * 36, z * 10, 2),
    });

    // ------------------------------------------------------------------ gold
    // A cord on the cloth edge, three ball finials, a shield rim, and a small boss.
    const cordPts = EDGE.map(
      ([x, y]) => [x, y, clothZ(x) + CLOTH_HALF + CORD_R * 0.35, CORD_R] as [number, number, number, number],
    );
    const cord = sdf.chain(cordPts, 0.012);
    const topBall = sdf.sphere(0.052).at(0, 1.948, 0);
    const endL = sdf.sphere(0.048).at(-0.5, BAR_Y, 0);
    const endR = sdf.sphere(0.048).at(0.5, BAR_Y, 0);

    const SH_CX = 0;
    const SH_CY = 1.08;
    const rimPts = heater(SH_CX, SH_CY, 0.162, 0.4);
    const rimZ = clothZ(0) + CLOTH_HALF + 0.012;
    const rim = sdf.chain(
      [...rimPts, rimPts[0]!].map(
        ([x, y]) => [x, y, rimZ + (clothZ(x) - clothZ(0)) * 0.65, 0.016] as [number, number, number, number],
      ),
      0.008,
    );
    const boss = sdf.ellipsoid([0.036, 0.036, 0.013]).at(SH_CX, SH_CY + 0.02, rimZ + 0.022);

    k.body('gold', sdf.union(cord, topBall, endL, endR, rim, boss).paintFn(goldPaint), {
      color: '#d9a93a',
      roughness: 0.32,
      metalness: 1,
      detail: 0.008,
      maxError: 0.004,
      maxTriangles: 580,
      paintWeight: 1,
    });

    // ------------------------------------------------------------------ shield
    const field = sdf
      .extrude(profile.polygon(heater(SH_CX, SH_CY, 0.136, 0.342)), 0.024, 0.006)
      .at(0, 0, rimZ + 0.004)
      .paintFn((x, y) => {
        const t = clamp01((SH_CY + 0.08 - y) / 0.32);
        let c = mixRgb(SHIELD, SHIELD_SHADE, 0.22 * t);
        c = mixRgb(c, rgb('#fffaf3'), 0.35 * clamp01((y - (SH_CY - 0.02)) / 0.2));
        return c;
      });
    k.body('shield', field, {
      color: '#f3ecdf',
      roughness: 0.55,
      metalness: 0.04,
      detail: 0.007,
      maxError: 0.003,
      maxTriangles: 280,
      textureDensity: 2,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ iron
    // A dark ring on the stub between the crossbar and the top finial.
    const ring = sdf
      .torus(0.044, 0.012)
      .at(0, 1.822, 0)
      .paintFn((x, y, z) => {
        let c = IRON;
        c = mixRgb(c, IRON_LIGHT, 0.55 * clamp01(z * 10 + 0.3));
        c = mixRgb(c, IRON_DARK, 0.5 * clamp01(-z * 8));
        return c;
      });
    k.body('iron', ring, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      maxError: 0.004,
      maxTriangles: 140,
    });
  },
});
