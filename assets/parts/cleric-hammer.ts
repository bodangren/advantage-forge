import { noise, profile, rgb, sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Cleric warhammer (part of `assets/cleric.ts`; standalone `assets/cleric-hammer.ts`).
 *
 * A long leather-wrapped haft, a big octagonal steel head with a gold cross on each face, a gold
 * spike on top, and a gold pommel.
 * Class: hand-held. Local frame: the origin is the grip center in the fist, the axes are the
 * character axes (the haft tilts along HAFT_AXIS, the head up). A host or a standalone turns it.
 * Bodies: hammer-haft, hammer-head, hammer-gold (bone `hand.R`).
 * Tint slots: none.
 *
 * The code is the cleric's, unchanged, in the cleric's frame; `local` moves the grip to the origin; the host moves it back (a translation keeps the mesh identical).
 */

const C = {
  gold: '#e0b040',
  iron: '#6f767f',
  leatherDark: '#4e2e1c',
  haft: '#5a3620',
};

const rad = Math.PI / 180;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
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

// The cleric's frame (assets/cleric.ts): the right fist, the grip in it, and the haft axis.
const WRIST_R: Vec3 = [-0.27, 0.322, 0.094];
const HAND_R = { pitch: -84, roll: 17 };
export const GRIP: Vec3 = add(rotZ(rotX([-0.008, -0.044, 0.004], HAND_R.pitch), HAND_R.roll), WRIST_R);
export const HAFT_AXIS: Vec3 = norm(rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll));
/** The part origin: the grip rounded to 1/1024 m, so the host round trip adds no float error. */
export const MOUNT: Vec3 = [GRIP[0], GRIP[1], GRIP[2]].map((v) => Math.round(v * 1024) / 1024) as unknown as Vec3;
export const HAFT_DOWN = (GRIP[1] - 0.06) / HAFT_AXIS[1];
export const HAFT_UP = (0.69 - GRIP[1]) / HAFT_AXIS[1];
export const HEAD_T = HAFT_UP + 0.1; // the head's center, along the haft from the grip

export function clericHammer(): Part {
  const local = (s: sdf.Shape) => s.at(-MOUNT[0], -MOUNT[1], -MOUNT[2]);
  const haftAt = (t: number): Vec3 => add(GRIP, [HAFT_AXIS[0] * t, HAFT_AXIS[1] * t, HAFT_AXIS[2] * t]);
  const crossP = (w: number, h: number, t: number) =>
    sdf.union(sdf.extrude(profile.rect([t, h], t * 0.3), 0.4), sdf.extrude(profile.rect([w, t], t * 0.3), 0.4).at(0, h * 0.18, 0));

  const haft = sdf
    .capsule(haftAt(-HAFT_DOWN), haftAt(HAFT_UP), 0.018)
    .paintFn((x, y, z, base) => (Math.sin(y * 150 + Math.atan2(z - GRIP[2], x - GRIP[0]) * 2) > 0.55 ? rgb(C.leatherDark) : base));
  const headCenter = haftAt(HEAD_T);
  const octo = (r: number, len: number, bevel: number) =>
    sdf.intersect(sdf.box([len, r * 2, r * 2], bevel), sdf.box([len, r * 2, r * 2], bevel).rotateX(45));
  const endBlock = (sx: number) =>
    sdf.intersect(octo(0.086, 0.09, 0.008), sdf.box([0.09, 0.3, 0.3]).at(0, 0, 0)).at(sx * 0.13, 0, 0);
  const hammerLocal = sdf.union(octo(0.095, 0.18, 0.008), endBlock(1), endBlock(-1));
  const rivetsLocal = sdf.union(
    ...[-1, 1].flatMap((sx) =>
      [-1, 1].flatMap((sy) =>
        [-1, 1].flatMap((sz) => [
          sdf.sphere(0.009).at(sx * 0.13 + sx * 0.02, sy * 0.05, sz * 0.078),
          sdf.sphere(0.009).at(sx * 0.064, sy * 0.064, sz * 0.09),
        ]),
      ),
    ),
  );
  const socket = sdf.smoothUnion(
    0.006,
    sdf.cylinder(0.03, 0.07, 0.008).at(0, -0.12, 0),
    sdf.cylinder(0.036, 0.018, 0.006).at(0, -0.094, 0),
    sdf.cylinder(0.034, 0.014, 0.005).at(0, -0.148, 0),
  );
  const headPose = (s: sdf.Shape) => s.at(...headCenter);
  const faceCross = (z: number) => crossP(0.1, 0.13, 0.028).scale([1, 1, 0.04]).at(0, -0.008, z);
  const spike = sdf.smoothUnion(
    0.01,
    sdf.cylinder(0.04, 0.02, 0.006).at(0, 0.1, 0),
    sdf.cone([0, 0.1, 0], [0, 0.17, 0], 0.036, 0.004),
  );
  const pommel = sdf.smoothUnion(0.008, sdf.cylinder(0.026, 0.022, 0.005).at(...haftAt(-HAFT_DOWN + 0.012)), sdf.sphere(0.03).at(...haftAt(-HAFT_DOWN - 0.02)));
  const gripRing = sdf.cylinder(0.023, 0.016, 0.004).at(...haftAt(-0.07));

  return {
    name: 'cleric-hammer',
    bodies: [
      { name: 'hammer-haft', shape: local(haft), options: { color: C.haft, roughness: 0.75 }, bone: 'hand.R' },
      {
        name: 'hammer-head',
        shape: local(headPose(sdf.union(hammerLocal, rivetsLocal, socket))),
        options: { color: C.iron, roughness: 0.5, metalness: 0.75, bump: (x: number, y: number, z: number) => 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 3) },
        bone: 'hand.R',
      },
      {
        name: 'hammer-gold',
        shape: local(sdf.union(headPose(sdf.union(faceCross(0.094), faceCross(-0.094), spike)), pommel, gripRing)),
        options: { color: C.gold, roughness: 0.3, metalness: 0.9 },
        bone: 'hand.R',
      },
    ],
  };
}
