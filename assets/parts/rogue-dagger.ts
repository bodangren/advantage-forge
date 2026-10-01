import { profile, sdf, type Part } from '../../src/index.js';

/**
 * Rogue dagger (part of `assets/rogue.ts`; standalone `assets/rogue-dagger.ts`).
 * A reverse-grip dagger with a gold guard and pommel. Class: hand-held. Local frame: the origin is
 * the grip center, the blade up (+Y), the flat toward +Z; the host's `inHand` pose places it.
 * Bodies: `dagger.<tag>`, `daggerGrip.<tag>` (bone `knife.<tag>`). Tint slots: none.
 */
const C = { gold: '#dca83a', grip: '#3b2a22', blade: '#c9d1d6' };

export function rogueDagger(tag: 'L' | 'R' = 'L'): Part {
  const GUARD = 0.034;
  const longBlade = sdf.extrude(
    profile.polygon(
      [
        [-0.0185, 0],
        [0.0185, 0],
        [0.014, -0.105],
        [0, -0.153],
        [-0.014, -0.105],
      ],
      { smooth: false },
    ),
    0.017,
    0.005,
  );
  const handBlade = sdf.union(
    longBlade.rotateZ(180).at(0, GUARD, 0).paint(C.blade),
    sdf.box([0.052, 0.012, 0.024], 0.004).at(0, GUARD, 0).paint(C.gold), // guard
    sdf.sphere(0.013).at(0, -0.04, 0).paint(C.gold), // pommel
  );
  const handGrip = sdf.capsule([0, -0.032, 0], [0, GUARD, 0], 0.011);
  return {
    name: 'rogue-dagger',
    bodies: [
      {
        name: `dagger.${tag}`,
        shape: handBlade,
        options: { color: C.blade, roughness: 0.3, metalness: 0.85 },
        bone: `knife.${tag}`,
      },
      { name: `daggerGrip.${tag}`, shape: handGrip, options: { color: C.grip, roughness: 0.6 }, bone: `knife.${tag}` },
    ],
  };
}
