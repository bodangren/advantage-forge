import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Moss patch — Chibi Quest nature dressing (catalog `nature/plants/moss`).
 *
 * - Role: low ground dressing in the forest clearing; must read as a soft green cushion
 *   at the 128 px sprite size. Background prop, no rig, no clips.
 * - Size: 0.8 m wide (X), about 0.62 m deep (Z), crown near y = 0.17; lies on y = 0,
 *   centred on the Y axis, front toward +Z.
 * - One idea: the patch is a cluster of soft rounded green lobes — a low skirt of
 *   flattened cushions with one fat centre-back mound carrying a crown of little beans
 *   and a few tiny sprouts poking out of it.
 * - Shape language: round dominant (cushions, beans, buds); low flat secondary (flush
 *   footprint that hugs the floor).
 * - Palette: dark recess #3d6b2c, mid green #5c9a3a, light green #7cb84a, sunlit
 *   highlight #93cc5e; sprouts slightly hotter #9ed05e. Value plan: dark crevices low,
 *   mid bodies, light sunlit crowns, tiny pale bud tips.
 * - Materials: moss — matte, roughness 0.92, metalness 0; sprouts — roughness 0.78.
 * - Detail list: (1) low base skirt, (2) seven rounded cushions big to small, (3) crown
 *   of four little beans, (4) five tiny buds/sprouts. Focal point: the sprouted crown.
 * - Budget: detail 0.008 keeps the raw mesh small; maxTriangles holds the asset under
 *   3,000 triangles.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const DEEP = rgb('#36601f');
const SHADE = rgb('#4a7d2c');
const MID = rgb('#5c9a3a');
const LIGHT = rgb('#7cb84a');
const HILITE = rgb('#93cc5e');

const SPROUT_DARK = rgb('#4d8032');
const SPROUT_MID = rgb('#7cb84a');
const SPROUT_TIP = rgb('#a9d96a');

/** Mound top height at (x, z), by probing the union cups. */
interface Cup {
  x: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  cy: number;
}

const CUPS: readonly Cup[] = [
  // big centre-back mound
  { x: 0.02, z: -0.06, rx: 0.185, ry: 0.13, rz: 0.15, cy: 0.05 },
  // flanking cushions
  { x: -0.225, z: 0.08, rx: 0.155, ry: 0.09, rz: 0.12, cy: 0.035 },
  { x: 0.225, z: 0.06, rx: 0.16, ry: 0.085, rz: 0.13, cy: 0.035 },
  // back cushions
  { x: -0.13, z: -0.17, rx: 0.125, ry: 0.075, rz: 0.105, cy: 0.033 },
  { x: 0.15, z: -0.16, rx: 0.12, ry: 0.072, rz: 0.1, cy: 0.031 },
  // low front cushion
  { x: -0.02, z: 0.17, rx: 0.13, ry: 0.06, rz: 0.1, cy: 0.025 },
  // crown: little beans sitting proud on the big mound
  { x: -0.01, z: -0.02, rx: 0.075, ry: 0.055, rz: 0.07, cy: 0.13 },
  { x: -0.07, z: 0.025, rx: 0.05, ry: 0.045, rz: 0.05, cy: 0.135 },
  { x: 0.05, z: -0.05, rx: 0.048, ry: 0.043, rz: 0.048, cy: 0.132 },
  { x: 0.06, z: 0.03, rx: 0.042, ry: 0.038, rz: 0.042, cy: 0.125 },
];

const topAt = (x: number, z: number): number => {
  let top = 0.02;
  for (const c of CUPS) {
    const q = 1 - ((x - c.x) / c.rx) ** 2 - ((z - c.z) / c.rz) ** 2;
    if (q <= 0) continue;
    const t = c.cy + c.ry * Math.sqrt(q);
    if (t > top) top = t;
  }
  return top;
};

const cup = (c: Cup): Sdf => sdf.ellipsoid([c.rx, c.ry, c.rz]).at(c.x, c.cy, c.z);

/** One tiny sprout: a leaning tapered stem with a rounded bud at the tip. */
interface Sprout {
  x: number;
  z: number;
  h: number;
  lean: number;
  az: number;
  r: number;
}

const SPROUTS: readonly Sprout[] = [
  { x: -0.01, z: -0.02, h: 0.032, lean: 0.018, az: 205, r: 0.0065 },
  { x: -0.07, z: 0.03, h: 0.027, lean: 0.02, az: 320, r: 0.0065 },
  { x: 0.05, z: -0.05, h: 0.022, lean: 0.016, az: 70, r: 0.006 },
  { x: -0.19, z: 0.09, h: 0.026, lean: 0.018, az: 290, r: 0.006 },
  { x: 0.19, z: 0.04, h: 0.02, lean: 0.016, az: 95, r: 0.006 },
];

const buildSprout = (s: Sprout): Sdf => {
  const a = (s.az * Math.PI) / 180;
  const dx = Math.sin(a) * s.lean;
  const dz = Math.cos(a) * s.lean;
  const baseY = topAt(s.x, s.z) - 0.012;
  const base: [number, number, number] = [s.x, baseY, s.z];
  const p1: [number, number, number] = [s.x + dx * 0.4, baseY + s.h * 0.55, s.z + dz * 0.4];
  const tip: [number, number, number] = [s.x + dx, baseY + s.h, s.z + dz];
  const stem = sdf.chain(
    [
      [base[0], base[1], base[2], s.r],
      [p1[0], p1[1], p1[2], s.r * 0.72],
      [tip[0], tip[1], tip[2], s.r * 0.45],
    ],
    0.004,
  );
  const bud = sdf.ellipsoid([s.r * 1.15, s.r * 1.7, s.r * 1.15]).at(tip[0], tip[1], tip[2]);
  return stem.smoothUnion(0.004, bud);
};

export default defineAsset({
  name: 'moss',
  description:
    'A 0.8 m moss patch: soft lumpy green cushions over a low skirt, crowned with tiny sprouts.',
  detail: 0.008,
  reference: 'docs/item-mockups/moss-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ patch body
    // Low skirt plus ten rounded cushions, melted together into one lumpy cushion.
    const skirt = sdf
      .ellipsoid([0.37, 0.05, 0.245])
      .at(0, 0.0, 0)
      .smoothUnion(0.03, sdf.ellipsoid([0.12, 0.05, 0.095]).at(-0.2, 0.0, 0.15))
      .smoothUnion(0.03, sdf.ellipsoid([0.11, 0.048, 0.085]).at(0.3, 0.0, -0.11))
      .smoothUnion(0.03, sdf.ellipsoid([0.095, 0.048, 0.085]).at(0.02, 0.0, -0.25));

    const patch = sdf
      .smoothUnion(0.028, skirt, ...CUPS.map(cup))
      .displace(0.007, (x, y, z) => noise.fbm(x * 11, y * 11, z * 11, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        const t = clamp01(y / 0.15);
        const v = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
        let c = mixRgb(DEEP, SHADE, clamp01(t * 2.4 + (v - 0.5) * 0.5));
        c = mixRgb(c, MID, clamp01((t - 0.32) * 1.9 + (v - 0.5) * 0.3));
        c = mixRgb(c, LIGHT, clamp01((t - 0.62) * 2 + (v - 0.5) * 0.25) * 0.9);
        c = mixRgb(c, HILITE, clamp01((t - 0.85) * 3) * clamp01((v - 0.35) * 2.2) * 0.4);
        // The outer rim of the patch sits lower and reads a touch darker.
        const rim = clamp01((Math.hypot(x / 0.43, z / 0.3) - 0.68) / 0.32);
        c = mixRgb(c, DEEP, rim * 0.45);
        return c;
      });

    k.body('patch', patch, {
      color: '#5c9a3a',
      roughness: 0.92,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxTriangles: 2100,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 38, y * 38, z * 38, 2),
    });

    // ------------------------------------------------------------ sprouts
    const sprouts = sdf
      .smoothUnion(0.005, ...SPROUTS.map(buildSprout))
      .paintFn((_x, y, _z) => {
        const t = clamp01(y / 0.16);
        const v = 0.5 + 0.5 * noise.fbm(_x * 24, y * 24, _z * 24, 2);
        let c = mixRgb(SPROUT_DARK, SPROUT_MID, clamp01(t * 1.4 + (v - 0.5) * 0.3));
        c = mixRgb(c, SPROUT_TIP, clamp01((t - 0.55) * 2.4));
        return c;
      });

    k.body('sprouts', sprouts, {
      color: '#7cb84a',
      roughness: 0.78,
      metalness: 0,
      detail: 0.004,
      paintWeight: 2,
      maxTriangles: 700,
    });
  },
});
