import { sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Fighter cap (part of `assets/fighter.ts`; standalone `assets/fighter-cap.ts`).
 *
 * A plain steel skull cap: a brow band, a Y of three ridges over the crown with a boss, and a
 * nasal bar down to the nose tip. Class: head. Local frame: the origin is the head center of the
 * hero base (rounded to 1/1024 m), +Y up, the face toward +Z.
 * Bodies: cap-band, cap (bone `head`). No tint slot.
 * The shape code is the fighter's, unchanged; the host pose moves the mount point back.
 */

const C = { steel: '#bcc2cb', band: '#a9b0ba' };

/** The mount point in the fighter frame: the head center (0.675 m) rounded to 1/1024 m. */
export const FIGHTER_CAP_MOUNT: Vec3 = [0, Math.round(0.675 * 1024) / 1024, 0];
const local = (s: sdf.Shape) => s.at(-FIGHTER_CAP_MOUNT[0], -FIGHTER_CAP_MOUNT[1], -FIGHTER_CAP_MOUNT[2]);

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const pair = (s: sdf.Shape) => s.mirror('x');

export function fighterCap(): Part {
  const head = sdf.smoothUnion(
    0.06,
    sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
    pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
    sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
  );
  const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
  const BROW_Y = 0.75;
  const hairDome = sdf.ellipsoid([0.232, 0.212, 0.215]).at(0, 0.722, -0.03);

  const band = hairDome
    .round(0.011)
    .subtract(hairDome.round(-0.011))
    .smoothIntersect(0.004, sdf.box([0.8, 0.022, 0.8], 0.006).at(0, BROW_Y, 0));

  const ridgeShell = hairDome.round(0.017).subtract(hairDome.round(-0.006));
  const ridgeArm = (deg: number) => sdf.box([0.032, 0.5, 0.5], 0.012).at(0, 0.9, 0.25).rotateY(deg).at(0, 0, -0.03);
  const ridges = ridgeShell
    .smoothIntersect(0.004, sdf.union(ridgeArm(0), ridgeArm(120), ridgeArm(-120)))
    .intersect(sdf.halfSpace([0, -1, 0], -(BROW_Y - 0.006)));
  const crownTop = sdf.raycast(hairDome.round(0.017), [0, 1.3, -0.03], [0, -1, 0])![1];
  const crownBoss = sdf.sphere(0.024).scale([1, 0.55, 1]).at(0, crownTop - 0.004, -0.03);
  const zTip = faceZ(0, 0.566) + 0.011;
  const nasal = sdf.chain(
    [
      [0, 0.758, 0.19, 0.006],
      [0, 0.72, faceZ(0, 0.72) + 0.009, 0.006],
      [0, 0.68, faceZ(0, 0.68) + 0.008, 0.006],
      [0, 0.64, faceZ(0, 0.64) + 0.008, 0.006],
      [0, 0.6, faceZ(0, 0.6) + 0.009, 0.006],
      [0, 0.572, zTip, 0.0065],
    ],
    0.01,
  );
  const helmSteel = sdf.smoothUnion(0.006, ridges, crownBoss, nasal);

  return {
    name: 'fighter-cap',
    bodies: [
      { name: 'cap-band', shape: local(band), options: { color: C.band, roughness: 0.35, metalness: 0.8, detail: 0.004 }, bone: 'head' },
      { name: 'cap', shape: local(helmSteel), options: { color: C.steel, roughness: 0.35, metalness: 0.8, detail: 0.004 }, bone: 'head' },
    ],
  };
}
