import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note - slate roof panel (architecture/building-parts/roof-slate), reworked.
 *
 * Role: modular village building part, 2 x 2 m, paired with roof-thatch in the same catalog.
 * Size: 2.0 m along X, 2.0 m down the slope at a 35 degree pitch; eave bottom edge on y = 0
 *   at +Z, ridge at -Z, ridge cap crest ~1.4 m.
 * One idea: six courses of fat pillow slates (0.10 m thick), staggered bond, each course
 *   stepping 0.03 m up the slope and overlapping the one below, like fish scales.
 * Shape language: round dominant (pillow tiles, fat ridge tiles), square secondary (bond grid).
 * Palette: slate #7d8ba0 body, #5a6678 crevices, #a3b0c2 upper faces, ridge #8e9bb0.
 * Materials: slate (roughness 0.75), ridge-cap (0.75); grit in bump only.
 * Detail: primary tile pillows; secondary backing slab and ridge tiles; tertiary grit.
 *   Focal point: the row of ridge tiles.
 * Rig/animation: none (static building part).
 */

const PITCH = 35;
const S = Math.sin((PITCH * Math.PI) / 180);
const CO = Math.cos((PITCH * Math.PI) / 180);
const COURSES = 6;
const PITCH_Z = 0.32; // course spacing: 0.44 deep, 0.12 overlap
const STEP_Y = 0.03;
const TILE = [0.4, 0.1, 0.44] as const;
const courseZ = (n: number) => 0.76 - n * PITCH_Z; // n = 0 at the eave
const courseTop = (n: number) => 0.04 + n * STEP_Y + TILE[1] / 2 + 0.02; // local top y
const LIFT = S + 0.06 * CO - 0.01;

/** Local flat frame (X across, Z down slope, Y out of the slope) to world. */
const place = <T extends { rotateX(d: number): T; at(x: number, y: number, z: number): T }>(s: T) =>
  s.rotateX(PITCH).at(0, LIFT, 0);
const toLocal = (x: number, y: number, z: number) => {
  const yy = y - LIFT;
  return { x, y: yy * CO + z * S, z: -yy * S + z * CO };
};
const worldPt = (x: number, y: number, z: number): [number, number, number] => [
  x,
  y * CO - z * S + LIFT,
  y * S + z * CO,
];

const C = {
  slate: rgb('#7d8ba0'),
  gap: rgb('#5a6678'),
  light: rgb('#a3b0c2'),
  ridge: rgb('#8e9bb0'),
};
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const sstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const slatePaint = (wx: number, wy: number, wz: number): Rgb => {
  const p = toLocal(wx, wy, wz);
  const n = Math.max(0, Math.min(COURSES - 1, Math.round((0.76 - p.z) / PITCH_Z)));
  const depth = courseTop(n) - p.y;
  const tint = noise.random(Math.round(p.x * 5) + 9, n + 4);
  let c = mixRgb(C.slate, C.gap, 0.12 + 0.2 * tint);
  c = mixRgb(c, C.light, 0.7 * (1 - sstep(0.0, 0.035, depth)));
  c = mixRgb(c, C.gap, 0.85 * sstep(0.05, 0.12, depth));
  return mixRgb(c, C.gap, 0.15 * clamp01(0.5 - noise.fbm(wx * 20, wy * 20, wz * 20, 2, 5)));
};

const grit = (x: number, y: number, z: number) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2, 13);

export default defineAsset({
  name: 'roof-slate',
  description:
    'Slate roof panel: six staggered courses of fat pillow slates stepping down like scales, under a row of fat rounded ridge tiles.',
  reference: 'docs/item-mockups/roof-slate-mock.jpg',
  detail: 0.016,
  texture: { size: 1024 },

  build(k) {
    const parts: ReturnType<typeof sdf.box>[] = [];
    for (let n = 0; n < COURSES; n++) {
      const shift = n % 2 ? 0.2 : 0;
      const yc = 0.04 + n * STEP_Y;
      for (let i = -3; i <= 4; i++) {
        const cx = -0.8 + i * 0.4 + shift;
        if (cx < -1.18 || cx > 1.18) continue;
        const tilt = (b: number) => 1 + 2 * noise.random(i + 20, n * 5 + b);
        parts.push(
          sdf
            .box([...TILE], 0.045)
            .rotate(tilt(1) * (n % 2 ? -1 : 1), tilt(2) * (i % 2 ? 1 : -1) * 0.5, tilt(3))
            .at(cx, yc, courseZ(n)),
        );
      }
      // filler under the course so the stack is solid down to the backing slab
      if (n > 0) parts.push(sdf.box([2.2, yc - 0.04, 0.34], 0.01).at(0, (yc - 0.04) / 2, courseZ(n)));
    }
    const backing = sdf.box([2.2, 0.06, 2.1], 0.015).at(0, -0.03, 0);
    const clip = sdf.box([2.0, 1.0, 2.2]).at(0, 0.3, 0);
    const panel = sdf.union(backing, ...parts).intersect(clip);
    k.body('slate', place(panel).paintFn(slatePaint), {
      color: C.slate,
      roughness: 0.75,
      metalness: 0,
      detail: 0.014,
      maxError: 0.004,
      maxTriangles: 9000,
      bump: grit,
    });

    // ridge cap: seven fat tiles straddling the crest
    const top = courseTop(COURSES - 1) - 0.03;
    const [, ry, rz] = worldPt(0, top, courseZ(COURSES - 1) - 0.18);
    const tiles = [];
    for (let i = 0; i < 7; i++) {
      tiles.push(sdf.box([0.29, 0.16, 0.3], 0.07).at(-0.85 + i * 0.2833, ry, rz + 0.02));
    }
    k.body('ridge-cap', sdf.union(...tiles).paintFn((x, y, z) =>
      mixRgb(C.ridge, C.gap, 0.25 * clamp01(0.5 - noise.fbm(x * 15, y * 15, z * 15, 2, 8))),
    ), {
      color: C.ridge,
      roughness: 0.75,
      metalness: 0,
      detail: 0.012,
      maxError: 0.003,
      maxTriangles: 2500,
      bump: grit,
    });
  },
});
