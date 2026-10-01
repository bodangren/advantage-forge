import { noise, rgb, sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Mage wand and its flame (parts of `assets/mage.ts`; standalone `assets/mage-wand.ts`).
 *
 * A short, tapered dark wooden wand with a round butt knob and two silver bands, and a cyan magic
 * flame that burns upright above its tip.
 * Class: hand-held. Local frame of `mageWand`: the origin is the grip center (in the fist), the
 * shaft along +Y with the tip up; the knob ends at y = -0.084, the tip at y = 0.15.
 * Local frame of `mageWandFlame`: the origin is the center of the flame base, the flame upright
 * along +Y (0.14 m tall). A host puts it near the tip and keeps it upright.
 * Bodies: wand (bone `hand.R`); glow (bone `orb`, the joint that flares the flame).
 * Tint slots: none.
 *
 * The wand code is the mage's, unchanged, in the mage's frame; `local` undoes the mage's hand
 * placement (`holdPose`), so the worn wand stays the same.
 */

const C = {
  silver: '#c4c0b8',
  wood: '#4e2e1b',
  woodDark: '#321c10',
  glow: '#1a5a82',
  glowCore: '#5cc4ea',
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

/**
 * The placement of a hand-held part: local +Y turns into `axis` (a unit vector), and the origin
 * goes to `grip`. `pose` places the part; `local` is its inverse.
 */
export function holdPose(grip: Vec3, axis: Vec3): { pose: (s: sdf.Shape) => sdf.Shape; local: (s: sdf.Shape) => sdf.Shape } {
  const z = Math.asin(-axis[0]) / rad;
  const x = Math.atan2(axis[2], axis[1]) / rad;
  return {
    pose: (s) => s.rotateZ(z).rotateX(x).at(...grip),
    local: (s) => s.at(-grip[0], -grip[1], -grip[2]).rotateX(-x).rotateZ(-z),
  };
}

// The mage's frame (assets/mage.ts): the right fist, the grip in it, and the wand axis.
const WRIST_R: Vec3 = [-0.24, 0.35, 0.085];
const HAND_R = { pitch: -78, roll: 19 };
const handRPoint = (p: Vec3) => add(rotZ(rotX(p, HAND_R.pitch), HAND_R.roll), WRIST_R);
const WAND_AXIS = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);
const GRIP = handRPoint([-0.007, -0.04, 0.004]);
const along = (t: number): Vec3 => add(GRIP, scale(WAND_AXIS, t));

/** The flame's height. Its base sits 0.02 m below the tip in a host's up direction. */
export const WAND_FLAME_H = 0.14;

export function mageWand(): Part {
  const { local } = holdPose(GRIP, WAND_AXIS);
  // A short, tapered wand through the fist, a round butt knob, a silver band below the tip.
  const wandPts = [-0.062, -0.03, 0, 0.05, 0.1, 0.15].map((t, i) => {
    const p = along(t);
    return [p[0], p[1], p[2], 0.0115 - i * 0.0009] as [number, number, number, number];
  });
  const woodDark = rgb(C.woodDark);
  const wand = sdf
    .smoothUnion(0.006, sdf.chain(wandPts, 0.01), sdf.sphere(0.016).at(...along(-0.068)))
    .paintWhere(sdf.sphere(0.013).at(...along(0.128)), C.silver)
    .paintWhere(sdf.sphere(0.013).at(...along(-0.04)), C.silver)
    .paintFn((x, y, z, base) => (noise.fbm(x * 200, y * 30, z * 200, 2) > 0.3 ? woodDark : base));
  return {
    name: 'mage-wand',
    bodies: [{ name: 'wand', shape: local(wand), options: { color: C.wood, roughness: 0.55 }, bone: 'hand.R' }],
    sockets: { tip: [0, 0.15, 0] },
  };
}

/** A flame: a round base that rises into two or three curling tongues. `h` is its height. */
const flame = (h: number) =>
  sdf.smoothUnion(
    h * 0.08,
    sdf.sphere(h * 0.3).at(0, h * 0.3, 0),
    sdf.chain(
      [
        [0, h * 0.35, 0, h * 0.28],
        [h * 0.05, h * 0.7, 0, h * 0.16],
        [-h * 0.04, h, 0, h * 0.03],
      ],
      h * 0.1,
    ),
    sdf.chain(
      [
        [h * 0.14, h * 0.4, 0.0, h * 0.13],
        [h * 0.3, h * 0.66, 0, h * 0.07],
        [h * 0.26, h * 0.86, 0, h * 0.018],
      ],
      h * 0.06,
    ),
    sdf.chain(
      [
        [-h * 0.15, h * 0.36, 0, h * 0.12],
        [-h * 0.3, h * 0.58, 0.02 * h, h * 0.06],
        [-h * 0.3, h * 0.76, 0, h * 0.016],
      ],
      h * 0.06,
    ),
  );
/**
 * Magic flame color: a lighter cyan core low in the flame, deep blue toward the tips (the
 * emissive glow adds the light). The colors convert when the build calls this, not at load.
 */
const glowPaint = (base: Vec3, h: number) => {
  const core = rgb(C.glowCore);
  const outer = rgb(C.glow);
  return (x: number, y: number, z: number) => {
    const t = Math.min(1, Math.max(0, (y - base[1]) / h));
    const r = Math.hypot(x - base[0], z - base[2]) / (h * 0.3);
    const k = Math.min(1, Math.max(0, t * 0.9 + r * 0.5 - 0.15));
    return [core[0] + (outer[0] - core[0]) * k, core[1] + (outer[1] - core[1]) * k, core[2] + (outer[2] - core[2]) * k] as const;
  };
};

export function mageWandFlame(): Part {
  return {
    name: 'mage-wand-flame',
    bodies: [
      {
        name: 'glow',
        shape: flame(WAND_FLAME_H).paintFn(glowPaint([0, 0, 0], WAND_FLAME_H)),
        options: { color: C.glow, roughness: 0.4, emissive: '#3cc0f0', emissiveIntensity: 0.8, detail: 0.0035 },
        bone: 'orb',
      },
    ],
  };
}
