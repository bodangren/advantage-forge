import { sdf, type Part, type PartTint, type Vec3 } from '../../src/index.js';

/**
 * Rogue hood (part of `assets/rogue.ts`; standalone `assets/rogue-hood.ts`).
 * A big soft teal hood with a point on top, a rolled rim, and a seam over the crown.
 * Class: head. Local frame: the origin is the head center of the hero base (rogue frame
 * (0, 0.675, 0), rounded to 1/1024 m), +Y up, the face toward +Z. Body: hood (bone `head`).
 * Tint slot: `cloth` (the rogue maps it to `clothing`); the inside is a dark shade of the slot.
 * Regions: `inside`, the cavity under the hood where hair may stay.
 * The shape code is the rogue's, unchanged; `local` and the host pose cancel.
 */
const C = { hoodInside: '#16302e' };

export const ROGUE_HOOD_MOUNT: Vec3 = [0, 0.675, 0].map((v) => Math.round(v * 1024) / 1024) as unknown as Vec3;
const local = (s: sdf.Shape) => s.at(-ROGUE_HOOD_MOUNT[0], -ROGUE_HOOD_MOUNT[1], -ROGUE_HOOD_MOUNT[2]);

export function rogueHood(tint: PartTint): Part {
  const T = {
    cloth: tint('cloth'),
    clothInside: tint('cloth', { color: C.hoodInside, follow: 1 }),
  };
  const hoodOuter = sdf.smoothUnion(
    0.07,
    sdf.ellipsoid([0.285, 0.275, 0.272]).at(0, 0.685, -0.025),
    sdf.cone([0, 0.9, -0.05], [0, 0.99, -0.085], 0.12, 0.022), // the soft point on top
  );
  const cavity = sdf.ellipsoid([0.247, 0.235, 0.235]).at(0, 0.68, -0.015);
  const opening = sdf.ellipsoid([0.25, 0.23, 0.42]).at(0, 0.68, 0.3);
  // A thick rolled rim around the face opening.
  const rim = hoodOuter
    .round(0.018)
    .subtract(cavity.round(-0.004))
    .intersect(opening.round(0.04))
    .subtract(opening);
  // A raised seam over the crown: a thin skin of the hood, cut to a strip, not into the face.
  const seam = hoodOuter
    .round(0.006)
    .subtract(hoodOuter.round(-0.01))
    .intersect(sdf.box([0.014, 0.4, 0.8], 0.005).at(0, 0.82, -0.05))
    .intersect(sdf.halfSpace([0, 0, 1], 0.1)) // the hood's front skin passes in front of the face
    .subtract(opening.round(0.02));
  const hood = sdf
    .smoothUnion(0.012, hoodOuter.subtract(cavity).smoothSubtract(0.02, opening), rim, seam)
    .intersect(sdf.halfSpace([0, -1, 0], -0.43))
    .paintWhere(cavity.round(0.006), T.clothInside, 0.012);
  return {
    name: 'rogue-hood',
    bodies: [{ name: 'hood', shape: local(hood), options: { color: T.cloth, roughness: 0.85 }, bone: 'head' }],
    regions: { inside: local(cavity.round(-0.003)) },
  };
}
