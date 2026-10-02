import { mixRgb, profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Warrior's greatsword (part of `assets/warrior.ts`; standalone `assets/warrior-sword.ts`).
 *
 * A large two-handed sword: a long tapered blade with beveled edges, a guard with two horns
 * and a central sphere, a pommel of sphere and cylinder, and a leather-wrapped grip with a
 * diamond texture.
 * Class: hand-held (two hands). Local frame: the right fist's grip at the origin, the sword
 * along Y with the tip toward -Y (the pommel toward +Y), the blade's width along X, the flats
 * facing +-Z. At rest the tip points up, out and a little back over the right shoulder, the
 * flats to the front. The tip is at y = -0.78 m.
 * Bodies: blade, sword-iron (the guard and pommel), grip (all bone `hand.R`).
 * Tint slots: none.
 */

const C = {
  blade: '#a8acb1',
  bladeDark: '#9aa0a8',
  guard: '#6a6e74',
  grip: '#3a2a20',
};

type Vec3 = readonly [number, number, number];

const rad = Math.PI / 180;
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// ------------------------------------------------------------------ the greatsword's frame
// Local frame: the right fist's grip at the origin, the sword along Y with the tip toward -Y
// (the pommel toward +Y), the blade's width along X, the flats facing +-Z. At rest the tip points
// up, out and a little back over the right shoulder, the flats to the front.
const HAFT_WANT = norm([-0.45, 0.8, -0.4]);
const AXE_Z = Math.asin(HAFT_WANT[0]) / rad; // local +Y goes to -HAFT_WANT
const AXE_X = Math.atan2(-HAFT_WANT[2], -HAFT_WANT[1]) / rad;

// The blade in local XY (tip toward -Y): straight edges, a long taper, a point.
const BLADE_TOP = -0.07;
const BLADE_TIP = -0.78;
const bladeProfile = profile.polygon([
  [-0.05, BLADE_TOP],
  [0.05, BLADE_TOP],
  [0.054, -0.3],
  [0.05, -0.66],
  [0, BLADE_TIP],
  [-0.05, -0.66],
  [-0.054, -0.3],
]);

export function warriorSword(): Part {
  const bevelN = (sx: number, sz: number) => sdf.halfSpace(norm([0.14 * sx, 0, sz]), 0.008 / Math.hypot(0.14, 1));
  const bladeShape = sdf
    .extrude(bladeProfile, 0.03, 0.002)
    .intersect(bevelN(1, 1))
    .intersect(bevelN(-1, 1))
    .intersect(bevelN(1, -1))
    .intersect(bevelN(-1, -1))
    .paintWhere(sdf.box([0.02, 0.56, 0.2]).at(0, -0.36, 0), C.guard, 0.004);

  const guard = sdf.smoothUnion(
    0.008,
    sdf.capsule([-0.092, -0.08, 0], [0, -0.06, 0], 0.015),
    sdf.capsule([0.092, -0.08, 0], [0, -0.06, 0], 0.015),
    sdf.sphere(0.02).at(0, -0.062, 0),
  );

  const pommel = sdf.smoothUnion(0.006, sdf.sphere(0.028).at(0, 0.112, 0), sdf.cylinder(0.018, 0.02, 0.004).at(0, 0.092, 0));

  const gripShape = sdf
    .cylinder(0.0175, 0.16, 0.004)
    .at(0, 0.015, 0)
    .paintFn((x, y, z, base) => (Math.sin((x + y + z) * 320) > 0.5 ? mixRgb(base, rgb('#6a4a32'), 0.7) : base));

  return {
    name: 'warrior-sword',
    bodies: [
      {
        name: 'blade',
        shape: bladeShape,
        options: { color: C.blade, roughness: 0.5, metalness: 0.85, detail: 0.004 },
        bone: 'hand.R',
      },
      {
        name: 'sword-iron',
        shape: sdf.union(guard, pommel),
        options: { color: C.guard, roughness: 0.45, metalness: 0.8, detail: 0.004 },
        bone: 'hand.R',
      },
      {
        name: 'grip',
        shape: gripShape,
        options: { color: C.grip, roughness: 0.75, detail: 0.004 },
        bone: 'hand.R',
      },
    ],
  };
}
