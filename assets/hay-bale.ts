import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - hay bale (props/farm/hay-bale), catch-up rework.
 *
 * Role: farm clutter prop beside the barn; the top face is seen from the sprite camera.
 * Size: 0.9 x 0.7 x 0.62 m bale, wisps bring bounds to about 0.91 x 0.88 x 0.66; on y = 0, +Z front.
 * One idea: a square-cut bale of compressed straw cinched by two twine bands, bristling with wisps.
 * Shape language: square (rounded box, 0.06 m bevel), small spiky wisps as the secondary.
 * Palette: straw #e0b84a, lighter top #f0d070, darker bottom #b8923a, twine #8a6a3a.
 * Materials: straw (matte, bump fbm stretched along X), twine bands, wisps.
 * Detail: primary bale; secondary two bands; tertiary straw grain (bump) and 26 wisps on
 *   the top edges and the ends. Focal point: the bands on the top face.
 * Rig/animation: none.
 */

const W = 0.9;
const H = 0.7;
const D = 0.62;
const BANDS = [-0.2, 0.2];

const STRAW = rgb('#e0b84a');
const TOP = rgb('#f0d070');
const BOTTOM = rgb('#b8923a');
const TWINE = rgb('#8a6a3a');
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const strawBump = (x: number, y: number, z: number) =>
  0.004 * noise.fbm(x * 4, y * 40, z * 40, 3, 7) + 0.0015 * noise.fbm(x * 30, y * 30, z * 30, 2, 23);

const strawPaint = (x: number, y: number, z: number) => {
  const t = clamp01(y / H);
  let c = t > 0.5 ? mixRgb(STRAW, TOP, clamp01((t - 0.5) / 0.5)) : mixRgb(BOTTOM, STRAW, t / 0.5);
  const n = noise.fbm(x * 4, y * 40, z * 40, 2, 7);
  c = mixRgb(c, BOTTOM, 0.3 * clamp01(0.5 - 0.5 * n));
  return mixRgb(c, TOP, 0.15 * clamp01(0.5 + 0.5 * n));
};

// 26 wisps: [x, y, z, dirX, dirY, dirZ, length]; bases sit just inside the surface.
const WISPS: [number, number, number, number, number, number, number][] = [];
for (let i = 0; i < 26; i++) {
  const r = (n: number) => noise.random(i, n, 5);
  const side = r(1) < 0.5 ? -1 : 1;
  const kind = i % 3;
  if (kind === 0) {
    WISPS.push([(r(2) - 0.5) * 0.6, H - 0.03, side * (0.18 + 0.06 * r(3)), (r(4) - 0.5) * 0.3, 1, side * 0.3, 0.15 + 0.06 * r(5)]);
  } else if (kind === 1) {
    WISPS.push([side * (W / 2 - 0.08), 0.12 + 0.46 * r(2), (r(3) - 0.5) * 0.4, side, 0.3 * (r(4) - 0.3), (r(5) - 0.5) * 0.5, 0.07 + 0.02 * r(6)]);
  } else {
    WISPS.push([side * (W / 2 - 0.1), H - 0.04, (r(2) - 0.5) * 0.4, side * 0.05, 1, (r(3) - 0.5) * 0.3, 0.15 + 0.06 * r(4)]);
  }
}

export default defineAsset({
  name: 'hay-bale',
  description: 'Square straw bale with two twine bands and loose wisps.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    const box = () => sdf.box([W, H, D], 0.06).at(0, H / 2, 0);
    const bale = box().intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('straw', bale.paintFn(strawPaint), {
      color: STRAW, roughness: 0.9, metalness: 0, detail: 0.008, textureDensity: 2,
      maxTriangles: 4200, bump: strawBump,
    });

    const bands = sdf.union(
      ...BANDS.map((bx) => box().round(0.004).intersect(sdf.box([0.05, 3, 3]).at(bx, 0, 0))),
    ).intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('twine', bands.paintFn(() => TWINE), {
      color: TWINE, roughness: 0.95, metalness: 0, detail: 0.006, maxTriangles: 1200,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 30, z * 30, 2, 11),
    });

    const wisps = WISPS.map(([x, y, z, dx, dy, dz, len]) => {
      const m = Math.hypot(dx, dy, dz);
      return sdf
        .capsule([x, y, z], [x + (dx / m) * len, y + (dy / m) * len, z + (dz / m) * len], 0.007)
        .paintFn((_x, py) => mixRgb(STRAW, TOP, clamp01((py - 0.3) / 0.5)));
    });
    k.body('wisps', sdf.union(...wisps), {
      color: TOP, roughness: 0.9, metalness: 0, detail: 0.004, maxTriangles: 900,
    });
  },
});
