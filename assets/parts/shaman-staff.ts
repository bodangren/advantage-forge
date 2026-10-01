import { mixRgb, noise, rgb, sdf, type Part, type PartTint } from '../../src/index.js';
import { featherShape } from './shaman-feather.js';

/**
 * Shaman rattle staff (part of `assets/shaman.ts`; standalone `assets/shaman-staff.ts`).
 *
 * A knotted staff with a wrapped round rattle head and two hanging feathers.
 * Class: hand-held. Local frame: the origin is the grip rounded to 1/1024 m, the axes are the
 * character axes (the staff tilts along STAFF_AXIS, the rattle up). A host or a standalone turns it.
 * Bodies: staff, rattle, rattle-wrap, rattle-feathers (bone `hand.R`). Tint slot: `cloth` (a hanging feather).
 * The code is the shaman's, unchanged; the part moves it by -MOUNT and the host moves it back.
 */

const C = { staff: '#4a3020', rattle: '#7a5a44', wrap: '#c8a870', fur: '#e8dcc0', quill: '#3a2618' };
type V3 = readonly [number, number, number];
const rad = Math.PI / 180;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};
const WRIST_R: V3 = [-0.225, 0.248, 0.068];
const HAND_R = { pitch: -84, roll: 8 };
const FIST = 0.86;
export const GRIP: V3 = add(rotZ(rotX([-0.008 * FIST, -0.044 * FIST, 0.004 * FIST], HAND_R.pitch), HAND_R.roll), WRIST_R);
export const STAFF_AXIS: V3 = norm(rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll));
/** The part origin: the grip rounded to 1/1024 m, so the host round trip adds no float error. */
export const MOUNT: V3 = [GRIP[0], GRIP[1], GRIP[2]].map((v) => Math.round(v * 1024) / 1024) as unknown as V3;
export const STAFF_DOWN = (GRIP[1] - 0.008) / STAFF_AXIS[1];
const RATTLE_T = 0.665;
const RATTLE_R = 0.06;
const staffAt = (t: number): V3 => add(GRIP, [STAFF_AXIS[0] * t, STAFF_AXIS[1] * t, STAFF_AXIS[2] * t]);
const RATTLE_AT = staffAt(RATTLE_T);
const STAFF_TILT = { x: 90 + HAND_R.pitch, z: HAND_R.roll };
const rattlePose = (s: sdf.Shape) => s.rotateX(STAFF_TILT.x).rotateZ(STAFF_TILT.z).at(...RATTLE_AT);

export function shamanStaff(tint: PartTint): Part {
  const T = { cloth: tint('cloth') };
  const local = (s: sdf.Shape) => s.at(-MOUNT[0], -MOUNT[1], -MOUNT[2]);
  const sp = (t: number, w: number, r: number): [number, number, number, number] => {
    const p = add(staffAt(t), [w, 0, w * 0.6]);
    return [p[0], p[1], p[2], r];
  };
  const shaft = sdf.chain(
    [
      sp(-STAFF_DOWN, 0, 0.017),
      sp(-0.12, 0.004, 0.0155),
      sp(-0.03, 0, 0.0148),
      sp(0.06, -0.001, 0.0148),
      sp(0.2, 0.006, 0.016),
      sp(0.3, 0.001, 0.0145),
      sp(0.42, -0.006, 0.0158),
      sp(0.52, 0.003, 0.0145),
      sp(0.6, 0, 0.0138),
      sp(RATTLE_T - 0.02, 0, 0.014),
    ],
    0.02,
  );
  const knots = sdf.union(
    sdf.ellipsoid([0.021, 0.03, 0.021]).at(...staffAt(0.2)),
    sdf.ellipsoid([0.02, 0.028, 0.02]).at(...staffAt(0.42)),
    sdf.sphere(0.0195).at(...staffAt(-STAFF_DOWN + 0.023)),
  );
  const staffShape = sdf.smoothUnion(0.01, shaft, knots).paintFn((x: number, y: number, z: number, base) => (noise.fbm(x * 80, y * 14, z * 80, 2) > 0.3 ? mixRgb(base, rgb('#2a1a10'), 0.6) : base));
  const staffBody = { name: 'staff', shape: staffShape, options: { color: C.staff, roughness: 0.85, detail: 0.005 }, bone: 'hand.R' };
  // A wrapped round rattle head: a lumpy hide-brown ball with three cord wraps.
  const rattleHead = sdf.ellipsoid([RATTLE_R, RATTLE_R + 0.008, RATTLE_R]).displace(0.004, (x: number, y: number, z: number) => noise.fbm(x * 55, y * 55, z * 55, 2));
  const rattleBody = { name: 'rattle', shape: rattlePose(rattleHead), options: { color: C.rattle, roughness: 0.85, detail: 0.005, bump: (x: number, y: number, z: number) => 0.002 * noise.fbm(x * 70, y * 20, z * 70, 2) }, bone: 'hand.R' };
  const wrapRing = (d: number, r: number) => sdf.torus(Math.sqrt(Math.max(0.0004, (RATTLE_R + 0.004) ** 2 - d * d)) + 0.0015, r).at(0, d, 0);
  const wraps = sdf.union(
    wrapRing(-0.028, 0.0055),
    wrapRing(0, 0.0065),
    wrapRing(0.028, 0.0055),
    sdf.torus(0.0185, 0.0062).at(0, -0.078, 0),
    sdf.torus(0.019, 0.0062).at(0, -0.3, 0),
  );
  const wrapBody = { name: 'rattle-wrap', shape: rattlePose(wraps), options: { color: C.wrap, roughness: 0.9, detail: 0.006 }, bone: 'hand.R' };
  // Two feathers hang from cords under the rattle head.
  const hang = (x: number, rot: number, len: number, color: string) =>
    sdf
      .union(featherShape(len, 0.024, 0.012).paint(color), sdf.capsule([0, -0.008, 0], [0, len * 0.92, 0], 0.0037).paint(C.quill))
      .rotateZ(180 + rot)
      .at(x, -0.035, 0.004);
  const rattleFeathers = sdf.union(hang(0.046, 10, 0.125, C.fur), hang(-0.046, -10, 0.115, T.cloth));
  const rfBody = { name: 'rattle-feathers', shape: rattlePose(rattleFeathers), options: { color: C.fur, roughness: 0.8, detail: 0.004 }, bone: 'hand.R' };

  return {
    name: 'shaman-staff',
    bodies: [staffBody, rattleBody, wrapBody, rfBody].map((b) => ({ ...b, shape: local(b.shape) })),
  };
}
