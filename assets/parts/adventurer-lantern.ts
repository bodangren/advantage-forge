import { sdf, type Part } from '../../src/index.js';

/**
 * Adventurer lantern (part of `assets/adventurer.ts`; standalone `assets/adventurer-lantern.ts`).
 * Class: hung item. Local frame: the lantern center at the origin, upright, hook ring on top.
 * Bodies: lantern-frame, lantern-light (skin tag `lantern`, set inside the shapes). Tint slots: none.
 */
const C = { brass: '#b8893a', glow: '#ffcc55' };

export function adventurerLantern(): Part {
  const frame = sdf.union(
    sdf.cylinder(0.03, 0.012, 0.004).at(0, 0.028, 0),
    sdf.cone([0, 0.032, 0], [0, 0.048, 0], 0.024, 0.01),
    sdf.cylinder(0.032, 0.012, 0.004).at(0, -0.034, 0),
    ...[0, 90, 180, 270].map((a) => sdf.capsule([0.026, -0.028, 0], [0.026, 0.024, 0], 0.004).rotateY(a + 45)),
    sdf.torus(0.02, 0.004).rotateX(90).at(0, 0.068, 0),
  );
  return {
    name: 'adventurer-lantern',
    bodies: [
      { name: 'lantern-frame', shape: frame.bone('lantern'), options: { color: C.brass, roughness: 0.35, metalness: 0.8 } },
      {
        name: 'lantern-light',
        shape: sdf.cylinder(0.024, 0.056, 0.01).bone('lantern'),
        options: { color: C.glow, roughness: 0.3, emissive: C.glow, emissiveIntensity: 0.8 },
      },
    ],
  };
}
