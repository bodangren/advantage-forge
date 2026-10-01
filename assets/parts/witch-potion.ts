import { sdf, type Part } from '../../src/index.js';

/**
 * Witch potion bottle (part of `assets/witch.ts`; standalone `assets/witch-potion.ts`).
 * A round glass flask with a neck, a cork, bubbles, and a bright liquid core. Class: hand-held.
 * Local frame: the flask center at `at` (the host passes the palm point), the neck up (+Y).
 * Bodies: potion, liquid, cork (bone hand.L). Tint slots: none.
 */
const C = { potion: '#106020', potionGlow: '#40c060', potionCore: '#7ae898', cork: '#8a6a44' };

type V3 = readonly [number, number, number];

export function witchPotion(at: V3): Part {
  const bottleShape = (r: number) =>
    sdf.smoothUnion(
      0.012,
      sdf.sphere(r),
      sdf.cylinder(0.0145 * (r / 0.05), 0.05).at(0, r + 0.005, 0),
      sdf.torus(0.0165 * (r / 0.05), 0.005).at(0, r + 0.03, 0),
    );
  const bubbleStencil = [
    [0.03, 0.028, 0.02, 0.011],
    [-0.028, 0.02, 0.028, 0.009],
    [0.01, 0.036, -0.03, 0.008],
  ] as const;
  const bubbles = sdf.union(...bubbleStencil.map(([x, y, z, r]) => sdf.sphere(r).at(x, y, z)));
  const glass = sdf.smoothUnion(0.008, bottleShape(0.05), bubbles);
  return {
    name: 'witch-potion',
    bodies: [
      {
        name: 'potion',
        shape: glass.at(...at),
        options: { color: C.potion, roughness: 0.15, emissive: C.potionGlow, emissiveIntensity: 1.2, opacity: 0.85, detail: 0.0035 },
        bone: 'hand.L',
      },
      {
        name: 'liquid',
        shape: sdf.sphere(0.037).at(0, -0.003, 0).at(...at),
        options: { color: C.potionCore, roughness: 0.3, emissive: C.potionCore, emissiveIntensity: 1.2, detail: 0.0035 },
        bone: 'hand.L',
      },
      {
        name: 'cork',
        // The cork sits in the mouth: half inside the neck, half above the lip (top of the lip 0.085).
        shape: sdf.cylinder(0.0155, 0.02, 0.004).at(at[0], at[1] + 0.05 + 0.035, at[2]),
        options: { color: C.cork, roughness: 0.85, detail: 0.003 },
        bone: 'hand.L',
      },
    ],
  };
}
