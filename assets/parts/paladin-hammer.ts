import { noise, profile, sdf, type Part } from '../../src/index.js';

/**
 * Paladin war hammer (part of `assets/paladin.ts`; standalone `assets/paladin-hammer.ts`).
 * Class: hand-held. Local frame: the grip center at the origin, the haft along +Y, the head up
 * (haft top at 0.32 m). Bodies: hammer, hammer-gold, haft (bone `hand.R`). Tint slots: none.
 */

const C = { steel: '#c3c8cf', gold: '#e0b040', wood: '#7a4a2e' };

export function paladinHammer(): Part {
    // lies across the haft, turned 45 degrees between +X and +Z, so both bells show from the front.
    const HAFT_TOP = 0.32;
    const HEAD_TURN = 45;
    const headAxis = (s: sdf.Shape) => s.rotateX(90).rotateY(HEAD_TURN).at(0, HAFT_TOP, 0);
    const bells = sdf.revolve(
      profile.polygon(
        [
          [0, -0.126],
          [0.068, -0.126],
          [0.076, -0.115],
          [0.066, -0.085],
          [0.044, -0.04],
          [0.038, 0],
          [0.044, 0.04],
          [0.066, 0.085],
          [0.076, 0.115],
          [0.068, 0.126],
          [0, 0.126],
        ],
        { smooth: true, samples: 4 },
      ),
    );
    const hammerHead = headAxis(bells);
    const hammerGold = sdf.union(
      headAxis(sdf.union(sdf.torus(0.068, 0.007).at(0, 0.095, 0), sdf.torus(0.068, 0.007).at(0, -0.095, 0))),
      sdf.cylinder(0.022, 0.024, 0.005).at(0, HAFT_TOP - 0.046, 0),
    );
    const haft = sdf.smoothUnion(
      0.012,
      sdf.cylinder(0.0155, 0.4, 0.004).at(0, 0.11, 0),
      sdf.sphere(0.025).at(0, -0.098, 0),
      sdf.ellipsoid([0.023, 0.034, 0.023]).at(0, 0.225, 0),
    );
  return {
    name: 'paladin-hammer',
    bodies: [
      { name: 'hammer', shape: hammerHead, options: { color: C.steel, roughness: 0.3, metalness: 0.9, detail: 0.004 }, bone: 'hand.R' },
      { name: 'hammer-gold', shape: hammerGold, options: { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.004 }, bone: 'hand.R' },
      {
        name: 'haft',
        shape: haft,
        options: { color: C.wood, roughness: 0.7, detail: 0.004, bump: (x: number, y: number, z: number) => 0.0008 * noise.noise3(x * 90, y * 12, z * 90) },
        bone: 'hand.R',
      },
    ],
  };
}
