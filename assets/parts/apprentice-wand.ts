import { noise, rgb, sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Apprentice training wand and its spark (parts of `assets/apprentice.ts`; standalone
 * `assets/apprentice-wand.ts`).
 *
 * A plain tapered wooden stick with a round butt knob, and a small yellow spark at the tip.
 * Class: hand-held. Local frame of `apprenticeWand`: the origin is the grip (rounded to 1/1024 m),
 * the axes are the character axes (the wand leans along WAND_AXIS). 0.24 m long.
 * Local frame of `apprenticeWandGlow`: the origin is the spark base (rounded), upright along +Y.
 * Bodies: wand (bone `hand.R`); glow (bone `orb`). Tint slots: none.
 *
 * The code is the apprentice's, unchanged, in the character frame; a translation moves it.
 */

const C = {
  wood: '#3a2316',
  woodDark: '#241409',
  sparkBase: '#5a4a10',
  sparkCore: '#f0e060',
  sparkOuter: '#f0a030',
};

const rad = Math.PI / 180;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const rotX = (p: Vec3, d: number): Vec3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotZ = (p: Vec3, d: number): Vec3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

const WRIST_R: Vec3 = [-0.26, 0.49, 0.06];
const HAND_R = { pitch: -78, roll: 17 };
const handRPoint = (p: Vec3): Vec3 => add(rotZ(rotX(p, HAND_R.pitch), HAND_R.roll), WRIST_R);
export const WAND_AXIS: Vec3 = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);
export const GRIP: Vec3 = handRPoint([-0.008, -0.043, 0.004]);
const along = (t: number): Vec3 => add(GRIP, scale(WAND_AXIS, t));
const WAND_TIP = along(0.2);
export const FLAME_H = 0.085;
const FLAME_BASE: Vec3 = add(WAND_TIP, [0, -0.002, 0]);
const round = (p: Vec3): Vec3 => p.map((v) => Math.round(v * 1024) / 1024) as unknown as Vec3;
/** The part origins, rounded to 1/1024 m so the host round trip adds no float error. */
export const MOUNT: Vec3 = round(GRIP);
export const GLOW_MOUNT: Vec3 = round(FLAME_BASE);
/** The knob's lowest point below the grip. */
export const BUTT_DROP = 0.042 + 0.0145;

const flame = (h: number) =>
  sdf.smoothUnion(h * 0.12, sdf.sphere(h * 0.27).at(0, h * 0.27, 0), sdf.cone([0, h * 0.25, 0], [h * 0.05, h, 0], h * 0.24, h * 0.02));
const glowPaint = (base: Vec3, h: number) => {
  const core = rgb(C.sparkCore);
  const outer = rgb(C.sparkOuter);
  return (_x: number, y: number, _z: number) => {
    const t = Math.min(1, Math.max(0, ((y - base[1]) / h - 0.3) / 0.7));
    return [core[0] + (outer[0] - core[0]) * t, core[1] + (outer[1] - core[1]) * t, core[2] + (outer[2] - core[2]) * t] as const;
  };
};

export function apprenticeWand(): Part {
  const wandPts = [-0.04, 0.0, 0.07, 0.14, 0.2].map((t, i) => {
    const p = along(t);
    return [p[0], p[1], p[2], 0.0125 - i * 0.0003] as [number, number, number, number];
  });
  const woodDark = rgb(C.woodDark);
  const wand = sdf
    .smoothUnion(0.006, sdf.chain(wandPts, 0.01), sdf.sphere(0.0145).at(...along(-0.042)))
    .paintFn((x, y, z, base) => (noise.fbm(x * 200, y * 30, z * 200, 2) > 0.25 ? woodDark : base));
  return {
    name: 'apprentice-wand',
    bodies: [{ name: 'wand', shape: wand.at(-MOUNT[0], -MOUNT[1], -MOUNT[2]), options: { color: C.wood, roughness: 0.6 }, bone: 'hand.R' }],
    sockets: { tip: [WAND_TIP[0] - MOUNT[0], WAND_TIP[1] - MOUNT[1], WAND_TIP[2] - MOUNT[2]] },
  };
}

export function apprenticeWandGlow(): Part {
  const painted = flame(FLAME_H).at(...FLAME_BASE).paintFn(glowPaint(FLAME_BASE, FLAME_H));
  return {
    name: 'apprentice-wand-glow',
    bodies: [
      {
        name: 'glow',
        shape: painted.at(-GLOW_MOUNT[0], -GLOW_MOUNT[1], -GLOW_MOUNT[2]),
        options: { color: C.sparkBase, roughness: 0.4, emissive: C.sparkCore, emissiveIntensity: 1.4, detail: 0.003 },
        bone: 'orb',
      },
    ],
  };
}
