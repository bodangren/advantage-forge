import { noise, rgb, sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Enchanter staff (part of `assets/enchanter.ts`; standalone `assets/enchanter-staff.ts`).
 *
 * A walnut staff with a gold collar and a round gold knob on top, held in the right fist.
 * Class: hand-held. The part keeps the enchanter's axes (the shaft tilts out from the fist); the
 * origin is the grip, rounded to 1/1024 m, and the host translates it back with `MOUNT`.
 * The standalone turns it upright with `holdPose`. The staff runs from 0.26 m below the grip to
 * the knob top at 0.395 m above it.
 * Bodies: staff, staff-gold (bone `hand.R`). Tint slots: none.
 */

const C = { gold: '#e0b040', wood: '#5c3a22', woodDark: '#3c2416' };

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

// The enchanter's frame (assets/enchanter.ts): the right fist, the grip in it, the staff axis.
const WRIST_R: Vec3 = [-0.24, 0.35, 0.085];
const HAND_R = { pitch: -78, roll: 19 };
const handRPoint = (p: Vec3) => add(rotZ(rotX(p, HAND_R.pitch), HAND_R.roll), WRIST_R);
export const STAFF_AXIS = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);
export const STAFF_GRIP = handRPoint([-0.007, -0.04, 0.004]);
const along = (t: number): Vec3 => add(STAFF_GRIP, scale(STAFF_AXIS, t));

/** The grip rounded to 1/1024 m: a translation by it is exact, so the mesh stays the same. */
export const MOUNT = STAFF_GRIP.map((v) => Math.round(v * 1024) / 1024) as unknown as Vec3;

export function enchanterStaff(): Part {
  const woodDark = rgb(C.woodDark);
  const staff = sdf
    .chain(
      [
        [...along(-0.26), 0.017],
        [...along(0.0), 0.018],
        [...along(0.34), 0.018],
      ] as [number, number, number, number][],
      0.01,
    )
    .paintFn((x, y, z, base) => (noise.fbm(x * 90, y * 12, z * 90, 2) > 0.25 ? woodDark : base));
  const knob = sdf.union(sdf.sphere(0.035).at(...along(0.36)), sdf.torus(0.022, 0.006).rotateX(90).at(...along(0.3))).bone('hand.R');
  const local = (s: sdf.Shape) => s.at(-MOUNT[0], -MOUNT[1], -MOUNT[2]);
  return {
    name: 'enchanter-staff',
    bodies: [
      { name: 'staff', shape: local(staff), options: { color: C.wood, roughness: 0.55 }, bone: 'hand.R' },
      { name: 'staff-gold', shape: local(knob), options: { color: C.gold, roughness: 0.4, metalness: 0.7, detail: 0.004 }, bone: 'hand.R' },
    ],
  };
}
