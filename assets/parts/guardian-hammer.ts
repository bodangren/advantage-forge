import { noise, sdf, type Part } from '../../src/index.js';

/**
 * Guardian war hammer (part of `assets/guardian.ts`; standalone `assets/guardian-hammer.ts`).
 * Class: hand-held. Local frame: the grip center at the origin, the haft along +Y, the head up.
 * Bodies: hammer, hammer-gold, haft, hammer-grip (bone `hand.R`). Tint slots: none.
 */

const C = { hammer: '#7d858e', gold: '#d4a93a', walnut: '#6b4226', grip: '#3f2a1a' };

export function guardianHammer(): Part {
  const HAFT_TOP = 0.15;
  const HEAD_TURN = 45;
  const headAxis = (s: sdf.Shape) => s.rotateY(HEAD_TURN).at(0, HAFT_TOP, 0);
  const hammerHead = headAxis(sdf.box([0.15, 0.085, 0.085], 0.018));
  const capBox = (x: number) => sdf.box([0.022, 0.09, 0.09], 0.007).at(x, 0, 0);
  const hammerGold = sdf.union(
    headAxis(sdf.union(capBox(0.064), capBox(-0.064), sdf.box([0.016, 0.092, 0.092], 0.006))),
    sdf.cylinder(0.021, 0.03, 0.007).at(0, -0.062, 0), // the ferrule
  );
  const haft = sdf.capsule([0, -0.07, 0], [0, HAFT_TOP, 0], 0.016);
  const gripWrap = sdf.cylinder(0.02, 0.07, 0.006).at(0, 0.07, 0);
  return {
    name: 'guardian-hammer',
    bodies: [
      { name: 'hammer', shape: hammerHead, options: { color: C.hammer, roughness: 0.45, metalness: 0.8, detail: 0.004 }, bone: 'hand.R' },
      { name: 'hammer-gold', shape: hammerGold, options: { color: C.gold, roughness: 0.35, metalness: 1, detail: 0.004 }, bone: 'hand.R' },
      {
        name: 'haft',
        shape: haft,
        options: { color: C.walnut, roughness: 0.7, detail: 0.004, bump: (x: number, y: number, z: number) => 0.0008 * noise.noise3(x * 90, y * 12, z * 90) },
        bone: 'hand.R',
      },
      {
        name: 'hammer-grip',
        shape: gripWrap,
        options: { color: C.grip, roughness: 0.85, detail: 0.004, bump: (x: number, y: number, z: number) => 0.0007 * Math.sin(y * 260 + (x + z) * 40) },
        bone: 'hand.R',
      },
    ],
  };
}
