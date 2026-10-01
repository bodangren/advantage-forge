import { profile, sdf, type Part } from '../../src/index.js';

/**
 * Dragoon lance (part of `assets/dragoon.ts`; standalone `assets/dragoon-lance.ts`).
 *
 * A 1.5 m steel lance: a dark shaft, a leather grip, silver butt, collars, ring guard, and leaf head.
 * Class: hand-held. Local frame: the origin is the fist center on the shaft, +Y toward the point.
 * Bodies: lance, lance-grip, lance-steel (bone `hand.R`). No tint slot.
 * The shape code is the dragoon's, unchanged; the host moves it to the grip with `.at(GRIP)`.
 */

const C = { silver: '#c3c8cf', leather: '#4e2d1c', shaft: '#4a4f55' };
/** The grip height above the butt at rest in the dragoon frame (the host's GRIP y). */
export const DRAGOON_LANCE_GRIP_Y = -0.04 + 0.31;
const GRIP = [0, DRAGOON_LANCE_GRIP_Y, 0] as const;
const LANCE_LEN = 1.5;

export function dragoonLance(): Part {
    const at0 = (b: number) => b - GRIP[1]; // local y of a height b above the butt at rest
    const SHAFT_R = 0.018;
    const shaftLocal = sdf.cylinder(SHAFT_R, 1.3, 0.003).at(0, at0(0.04 + 0.65), 0);
    const gripLocal = sdf.cylinder(SHAFT_R + 0.004, 0.17, 0.004).at(0, at0(0.27), 0);
    const buttLocal = sdf.smoothUnion(0.006, sdf.cone([0, at0(0.0), 0], [0, at0(0.06), 0], 0.01, 0.024), sdf.sphere(0.013).at(0, at0(0.01), 0));
    const collar = (b: number, r: number) =>
      sdf.smoothUnion(0.004, sdf.cone([0, at0(b - 0.02), 0], [0, at0(b), 0], 0.018, r), sdf.cone([0, at0(b), 0], [0, at0(b + 0.02), 0], r, 0.018));
    // The ring guard: a torus R 0.04 around a hub, 0.55 m above the butt.
    const ringGuard = sdf.torus(0.04, 0.008).at(0, at0(0.55), 0).union(sdf.cylinder(0.026, 0.03, 0.006).at(0, at0(0.55), 0));
    const socket = sdf.cylinder(0.024, 0.05, 0.005).at(0, at0(1.3), 0);
    // The leaf head: 0.22 tall, 0.07 wide, a lens section with a raised center ridge.
    const HEAD_W = 0.07;
    const HEAD_T = 0.014;
    const LR = ((HEAD_W / 2) ** 2 + (HEAD_T / 2) ** 2) / HEAD_T;
    const lens = sdf.intersect(
      sdf.cylinder(LR, 4).at(0, 0, LR - HEAD_T / 2),
      sdf.cylinder(LR, 4).at(0, 0, -(LR - HEAD_T / 2)),
    );
    const leafOutline = profile.polygon([
      [0, at0(1.28)],
      [0.026, at0(1.31)],
      [HEAD_W / 2, at0(1.365)],
      [0.028, at0(1.43)],
      [0, at0(LANCE_LEN)],
      [-0.028, at0(1.43)],
      [-HEAD_W / 2, at0(1.365)],
      [-0.026, at0(1.31)],
    ]);
    const leaf = sdf
      .extrude(leafOutline, 0.2)
      .intersect(lens)
      .union(sdf.capsule([0, at0(1.3), 0], [0, at0(1.475), 0], 0.0085).intersect(sdf.extrude(leafOutline, 0.2)));

  return {
    name: 'dragoon-lance',
    bodies: [
      { name: 'lance', shape: shaftLocal, options: { color: C.shaft, roughness: 0.5, metalness: 0.6, detail: 0.004 }, bone: 'hand.R' },
      { name: 'lance-grip', shape: gripLocal, options: { color: C.leather, roughness: 0.75, detail: 0.004 }, bone: 'hand.R' },
      {
        name: 'lance-steel',
        shape: sdf.union(buttLocal, collar(0.63, 0.026), collar(1.0, 0.024), ringGuard, socket, leaf),
        options: { color: C.silver, roughness: 0.35, metalness: 0.8, detail: 0.003 },
        bone: 'hand.R',
      },
    ],
  };
}
