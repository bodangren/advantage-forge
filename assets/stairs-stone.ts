import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — stone stairs (architecture/building-parts/stairs-stone), reworked.
 *
 * Role: a flight of dungeon stairs the player climbs; must read as chunky laid
 *   blocks at 128 px.
 * Size: 1.2 m wide (X), 1.6 m run (Z), 1.0 m rise toward -Z, on y = 0, faces +Z.
 * One idea: every step is three fat rounded blocks with dark joints, between two
 *   stepped parapets of stacked blocks.
 * Shape language: square/blocky dominant, generous 0.035 bevels.
 * Palette: warm stone #a89e94 (tops), #7e746b (sides), joints #4b4540.
 * Materials: flight (blocks plus a dark fill under them) and side-blocks; roughness 0.9.
 * Detail: primary blocks; secondary dark joints and lit tops; tertiary grit bump.
 * Rig/animation: none.
 */

const TOP = rgb('#a89e94');
const SIDE = rgb('#7e746b');
const JOINT = rgb('#4b4540');
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const Z_FRONT = 0.8;
const NSTEP = 5;
const RISE = 0.2;
const RUN = 0.32;
const R = 0.035;

const stepAt = (z: number): number =>
  Math.max(0, Math.min(NSTEP - 1, Math.floor((Z_FRONT - z) / RUN)));
const jit = (a: number, b: number, c: number, m: number) => (noise.random(a, b, c) - 0.5) * 2 * m;

export default defineAsset({
  name: 'stairs-stone',
  description:
    'Five steps of fat rounded stone blocks with dark joints, 1.2 m wide, rising 1.0 m over 1.6 m toward -Z, between stepped parapets of stacked blocks.',
  detail: 0.014,
  reference: 'docs/item-mockups/stairs-stone-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const parts: sdf.Shape[] = [];
    for (let i = 0; i < NSTEP; i++) {
      const zc = Z_FRONT - (i + 0.5) * RUN;
      const top = (i + 1) * RISE;
      // Dark fill under the treads so no view shows a hollow.
      parts.push(sdf.box([1.1, top - 0.05, RUN - 0.05], 0.01).at(0, (top - 0.05) / 2, zc));
      for (let b = -1; b <= 1; b++) {
        parts.push(
          sdf
            .box([0.36, 0.2, RUN - 0.01], R)
            .rotateY(jit(i, b, 1, 1.4))
            .at(b * 0.38 + jit(i, b, 2, 0.012), top - 0.1 + jit(i, b, 3, 0.008), zc + jit(i, b, 4, 0.012)),
        );
      }
    }
    const flight = sdf.union(...parts).intersect(sdf.halfSpace([0, -1, 0], 0));
    // Distance to the nearest joint line: x gaps at +-0.19, z gaps at step boundaries.
    const paintFlight = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const i = stepAt(z);
      const top = (i + 1) * RISE;
      const gx = Math.min(Math.abs(Math.abs(x) - 0.19), Math.abs(Math.abs(x) - 0.57)) ;
      const fz = ((Z_FRONT - z) / RUN) % 1;
      const gz = Math.min(fz, 1 - fz) * RUN;
      const joint = Math.max(smoothstep(0.035, 0.012, gx), smoothstep(0.035, 0.012, gz));
      const tint = noise.random(i, Math.round(x * 2.6), 5);
      let c = mixRgb(SIDE, TOP, smoothstep(top - 0.08, top - 0.02, y));
      c = mixRgb(c, JOINT, 0.1 + 0.15 * tint);
      c = mixRgb(c, JOINT, 0.8 * joint);
      c = mixRgb(c, JOINT, 0.35 * smoothstep(0.15, 0, y));
      return c;
    };
    k.body('flight', flight.paintFn(paintFlight), {
      color: SIDE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 4200,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 24, y * 24, z * 24, 2, 7),
    });

    // Side walls: stacked 0.2 blocks that climb with the steps, 0.2 above each tread.
    const wall: sdf.Shape[] = [];
    for (let i = 0; i < NSTEP; i++) {
      const zc = Z_FRONT - (i + 0.5) * RUN;
      const levels = i + 2;
      for (let j = 0; j < levels; j++) {
        for (const s of [-1, 1]) {
          wall.push(
            sdf
              .box([0.2, 0.2, 0.3], R)
              .rotateY(jit(i, j, s + 7, 1.5))
              .at(
                s * (0.5 + jit(i, j, s + 11, 0.008)),
                0.1 + j * 0.2 + jit(i, j, s + 13, 0.005) * 0,
                zc + jit(i, j, s + 17, 0.012) + (j % 2) * 0.01,
              ),
          );
        }
      }
    }
    const walls = sdf.union(...wall).intersect(sdf.halfSpace([0, -1, 0], 0));
    const paintWall = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const i = stepAt(z);
      const levels = i + 2;
      const fz = ((Z_FRONT - z) / RUN) % 1;
      const gz = Math.min(fz, 1 - fz) * RUN;
      const fy = (y / 0.2) % 1;
      const gy = Math.min(fy, 1 - fy) * 0.2;
      const joint = Math.max(smoothstep(0.03, 0.01, gz), smoothstep(0.03, 0.01, gy));
      const topY = levels * 0.2;
      let c = mixRgb(SIDE, TOP, smoothstep(topY - 0.06, topY - 0.01, y));
      c = mixRgb(c, JOINT, 0.1 + 0.15 * noise.random(i, Math.floor(y / 0.2), 3));
      c = mixRgb(c, JOINT, 0.8 * joint * (1 - smoothstep(topY - 0.03, topY, y)));
      c = mixRgb(c, JOINT, 0.3 * smoothstep(0.12, 0, y));
      return c;
    };
    k.body('side-blocks', walls.paintFn(paintWall), {
      color: SIDE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 4500,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 24, y * 24, z * 24, 2, 9),
    });
  },
});
