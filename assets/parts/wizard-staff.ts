import { noise, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Wizard staff and its fire (parts of `assets/wizard.ts`; standalone `assets/wizard-staff.ts`).
 *
 * A gnarled wooden pole with two knots and a forked head of curling prongs that cradle a big fire
 * orb; the orange flame burns upright above the fork.
 * Class: hand-held. Local frame of `wizardStaff`: the origin is the grip center in the fist (MOUNT),
 * the axes are the character axes (the pole tilts along STAFF_AXIS, the head up). A host moves it
 * back with a translation (the mesh stays the same); the standalone turns it upright with
 * `holdPose(GRIP, STAFF_AXIS).local`.
 * Local frame of `wizardStaffFire`: the origin is the flame base `ORB_BASE_MOUNT`, in the same frame.
 * Bodies: staff (bone `hand.R`); fire (bone `orb`, the joint that flares the flame).
 * Tint slots: none.
 */

type V3 = readonly [number, number, number];

const C = {
  wood: '#6a3d22',
  woodDark: '#4a2a17',
  fire: '#e8401a',
  fireCore: '#ffc629',
};

const rad = Math.PI / 180;
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
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

/** The placement of a hand-held part: local +Y turns into `axis`, the origin goes to `grip`. */
export function holdPose(grip: V3, axis: V3): { pose: (s: sdf.Shape) => sdf.Shape; local: (s: sdf.Shape) => sdf.Shape } {
  const z = Math.asin(-axis[0]) / rad;
  const x = Math.atan2(axis[2], axis[1]) / rad;
  return {
    pose: (s) => s.rotateZ(z).rotateX(x).at(...grip),
    local: (s) => s.at(-grip[0], -grip[1], -grip[2]).rotateX(-x).rotateZ(-z),
  };
}

// The wizard's frame (assets/wizard.ts): the right fist, the grip in it, and the staff axis.
const WRIST_R: V3 = [-0.24, 0.35, 0.085];
const HAND_R = { pitch: -78, roll: 19 };
const handRPoint = (p: V3) => add(rotZ(rotX(p, HAND_R.pitch), HAND_R.roll), WRIST_R);
const STAFF_AXIS = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);
const GRIP = handRPoint([-0.007, -0.04, 0.004]);
const L_DOWN = (GRIP[1] - 0.03) / STAFF_AXIS[1];
const L_UP = (0.785 - GRIP[1]) / STAFF_AXIS[1];
const along = (t: number): V3 => add(GRIP, scale(STAFF_AXIS, t));
const STAFF_TOP = along(L_UP);
// Below the fist the pole bows gently in, so its foot stands beside the boot, clear of the hem:
// the foot sits where a less tilted staff (pitch -80, roll 12) would put it.
const FOOT_AXIS = rotZ(rotX([0, 0, 1], -80), 12);
const FOOT_SHIFT = sub(add(GRIP, scale(FOOT_AXIS, -(GRIP[1] - 0.03) / FOOT_AXIS[1])), along(-L_DOWN));
/** A point on the pole: straight above the grip (t >= 0), bowed below it. */
const pole = (t: number): V3 => (t >= 0 ? along(t) : add(along(t), scale(FOOT_SHIFT, (t / L_DOWN) ** 2)));
/** The fire orb in the staff head (and the `orb` bone that flares it). */
const ORB: V3 = add(STAFF_TOP, [-0.012, 0.085, 0.004]);
const ORB_FLAME = 0.26;
/** The part origin: the grip rounded to 1/1024 m, so the host round trip adds no float error. */
export const MOUNT: V3 = GRIP.map((v) => Math.round(v * 1024) / 1024) as unknown as V3;
export { GRIP, STAFF_AXIS, ORB, ORB_FLAME, L_DOWN };
/** The flame base. */
const orbBase: V3 = [ORB[0], ORB[1] - ORB_FLAME * 0.3, ORB[2]];
export const ORB_BASE: V3 = orbBase;
export const ORB_BASE_MOUNT: V3 = orbBase.map((v) => Math.round(v * 1024) / 1024) as unknown as V3;
/** A character-frame point in the upright standalone frame (grip at the origin). */
export const uprightPoint = (p: V3): V3 => {
  const z = Math.asin(-STAFF_AXIS[0]) / rad;
  const x = Math.atan2(STAFF_AXIS[2], STAFF_AXIS[1]) / rad;
  return rotZ(rotX(sub(p, GRIP), -x), -z);
};

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
 * Fire color: a light core low in the flame, orange toward the tips. The colors convert when the
 * build calls this (not at module load), so a tint-mask bake sees them as "not in a slot".
 */
const firePaint = (base: V3, h: number) => {
  const fireCore = rgb(C.fireCore);
  const fireOuter = rgb(C.fire);
  return (x: number, y: number, z: number) => {
    const t = Math.min(1, Math.max(0, (y - base[1]) / h));
    const r = Math.hypot(x - base[0], z - base[2]) / (h * 0.3);
    const k = Math.min(1, Math.max(0, t * 0.9 + r * 0.5 - 0.15));
    return [
      fireCore[0] + (fireOuter[0] - fireCore[0]) * k,
      fireCore[1] + (fireOuter[1] - fireCore[1]) * k,
      fireCore[2] + (fireOuter[2] - fireCore[2]) * k,
    ] as const;
  };
};

export function wizardStaff(): Part {
  const local = (s: sdf.Shape) => s.at(-MOUNT[0], -MOUNT[1], -MOUNT[2]);
  // A gnarled pole along the staff axis through the fist, with a forked head cradling the orb.
  const wobble = (t: number, a: number): V3 => [Math.sin(t * 23) * a, 0, Math.cos(t * 17) * a];
  const polePts = [-L_DOWN, -L_DOWN * 0.6, -L_DOWN * 0.25, 0, L_UP * 0.35, L_UP * 0.7, L_UP].map((t, i) => {
    const p = add(pole(t), wobble(t, i === 3 ? 0 : 0.006));
    return [p[0], p[1], p[2], 0.016 - i * 0.0006] as [number, number, number, number];
  });
  const top = STAFF_TOP;
  // Two gnarled prongs curl up around the orb; the outer one reaches farther.
  const prong = (side: 1 | -1) =>
    sdf.chain(
      [
        [top[0], top[1], top[2], 0.015],
        [top[0] + side * 0.05, top[1] + 0.03, top[2] + 0.004, 0.013],
        [ORB[0] + side * 0.088, ORB[1] - 0.01, ORB[2], 0.011],
        [ORB[0] + side * (side < 0 ? 0.1 : 0.08), ORB[1] + 0.06, ORB[2] - 0.004, 0.009],
        [ORB[0] + side * (side < 0 ? 0.075 : 0.05), ORB[1] + 0.1, ORB[2], 0.006],
      ],
      0.008,
    );
  const knots = sdf.union(sdf.sphere(0.02).at(...along(L_UP * 0.45)), sdf.sphere(0.018).at(...pole(-L_DOWN * 0.5)));
  const staff = sdf
    .smoothUnion(0.012, sdf.chain(polePts, 0.02), prong(1), prong(-1), knots)
    .paintFn((x, y, z, base) => (noise.fbm(x * 90, y * 12, z * 90, 2) > 0.25 ? rgb(C.woodDark) : base));
  return {
    name: 'wizard-staff',
    bodies: [
      {
        name: 'staff',
        shape: local(staff),
        options: { color: C.wood, roughness: 0.8, bump: (x: number, y: number, z: number) => 0.0012 * noise.fbm(x * 160, y * 25, z * 160, 2) },
        bone: 'hand.R',
      },
    ],
  };
}

export function wizardStaffFire(): Part {
  const local = (s: sdf.Shape) => s.at(-ORB_BASE_MOUNT[0], -ORB_BASE_MOUNT[1], -ORB_BASE_MOUNT[2]);
  const orbFlame = flame(ORB_FLAME).at(...orbBase);
  return {
    name: 'wizard-staff-fire',
    bodies: [
      {
        name: 'fire',
        shape: local(orbFlame.paintFn(firePaint(orbBase, ORB_FLAME))),
        options: { color: C.fire, roughness: 0.4, emissive: '#ff5a14', emissiveIntensity: 0.5, detail: 0.004 },
        bone: 'orb',
      },
    ],
  };
}
