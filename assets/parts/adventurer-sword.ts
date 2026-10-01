import { profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Adventurer short sword (part of `assets/adventurer.ts`; standalone `assets/adventurer-sword.ts`).
 * Class: hand-held. Local frame: the grip center at the origin, the pommel up (+Y), the blade down
 * (-Y), the blade width along X, its flat facing +Z. The host turns it into the fist.
 * Bodies: sword, hilt (bone `hand.R`). Tint slots: none.
 */
const C = { steel: '#b8bec6', steelDark: '#8a9098', iron: '#4a4a50', leather: '#7a4a2c', leatherDark: '#503020' };
const hard = (s: sdf.Shape) => s.mirror('x', 0);

export function adventurerSword(): Part {
  const bladeLocal = sdf
    .extrude(
      profile.polygon([
        [-0.025, -0.048],
        [0.025, -0.048],
        [0.023, -0.226],
        [0.0, -0.272],
        [-0.023, -0.226],
      ]),
      0.013,
      0.0035,
    )
    .paintWhere(sdf.box([0.008, 0.15, 0.1], 0.003).at(0, -0.12, 0), C.steelDark, 0.003);
  const guard = sdf.union(sdf.box([0.1, 0.018, 0.03], 0.008).at(0, -0.042, 0), hard(sdf.sphere(0.013).at(0.052, -0.038, 0)));
  const pommel = sdf.sphere(0.021).at(0, 0.082, 0);
  const grip = sdf
    .cylinder(0.0125, 0.108, 0.004)
    .at(0, 0.019, 0)
    .paint(C.leather)
    .paintFn((x, y, z, base) => (Math.sin(y * 330 + Math.atan2(z, x)) > 0.5 ? rgb(C.leatherDark) : base));
  return {
    name: 'adventurer-sword',
    bodies: [
      { name: 'sword', shape: bladeLocal, options: { color: C.steel, roughness: 0.3, metalness: 0.9, detail: 0.003 }, bone: 'hand.R' },
      { name: 'hilt', shape: sdf.union(guard, pommel, grip), options: { color: C.iron, roughness: 0.45, metalness: 0.7, detail: 0.0035 }, bone: 'hand.R' },
    ],
  };
}
