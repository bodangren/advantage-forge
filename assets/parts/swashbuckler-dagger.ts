import { profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Swashbuckler dagger (part of `assets/swashbuckler.ts`; standalone `assets/swashbuckler-dagger.ts`).
 * A short straight dagger with a gold guard. Class: hand-held. Local frame: the origin is the grip center, the blade up (+Y), the flat
 * toward +Z; the host's `inHand` pose places it. Body: dagger (bone `knife.L`). Tint slots: none.
 */
const C = { gold: '#e0b040', blade: '#c8ccd0', grip: '#4a3022' };

export function swashbucklerDagger(): Part {
    const guardOf = (w: number) => sdf.box([w, 0.011, 0.016], 0.005).at(0, 0.04, 0).paint(C.gold);
    // The dagger: 0.17 overall, the blade 0.024 wide, the same guard style.
    const dagger = sdf.union(
      sdf
        .extrude(
          profile.polygon(
            [
              [-0.012, 0],
              [0.012, 0],
              [0.0085, 0.085],
              [0, 0.115],
              [-0.0085, 0.085],
            ],
            { smooth: false },
          ),
          0.01,
          0.003,
        )
        .at(0, 0.04, 0)
        .paint(C.blade),
      guardOf(0.05),
      sdf.capsule([0, -0.026, 0], [0, 0.036, 0], 0.012).paint(C.grip),
      sdf.sphere(0.0145).at(0, -0.04, 0).paint(C.gold),
    );
  return {
    name: 'swashbuckler-dagger',
    bodies: [{ name: 'dagger', shape: dagger, options: { color: C.blade, roughness: 0.3, metalness: 0.9, detail: 0.003 }, bone: 'knife.L' }],
  };
}
