import { profile, sdf, type Part } from '../../src/index.js';

/**
 * Spear warden javelin (part of `assets/spear-warden.ts`; standalone `assets/spear-warden-javelin.ts`).
 * A 0.4 m bronze shaft with a leaf blade. Class: hand-held. Local frame: the origin is the butt,
 * the shaft along +Y, the blade flat toward +Z. The host poses it (`javPose`).
 * Bodies: javelin, javelin-blade (bone `hand.L`).
 */
const C = { bronze: '#c99a30', bronzeDark: '#86601f' };

export function spearWardenJavelin(): Part {
  const jleaf = profile.polygon(
    [
      [-0.01, 0],
      [0.01, 0],
      [0.021, 0.02],
      [0.025, 0.055],
      [0.017, 0.1],
      [0, 0.14],
      [-0.017, 0.1],
      [-0.025, 0.055],
      [-0.021, 0.02],
    ],
    { smooth: true, samples: 4 },
  );
  const jleafAt = (sh: sdf.Shape) => sh.at(0, 0.38, 0);
  const blade = sdf
    .union(jleafAt(sdf.extrude(jleaf, 0.008, 0.003)), sdf.cone([0, 0.35, 0], [0, 0.385, 0], 0.012, 0.0175))
    .paintWhere(jleafAt(sdf.extrude(jleaf, 0.3).subtract(sdf.extrude(profile.offsetProfile(jleaf, -0.006), 0.3))), C.bronzeDark, 0.0012);
  return {
    name: 'spear-warden-javelin',
    bodies: [
      { name: 'javelin', shape: sdf.capsule([0, 0, 0], [0, 0.4, 0], 0.0115), options: { color: C.bronze, roughness: 0.4, metalness: 0.8, detail: 0.004 }, bone: 'hand.L' },
      { name: 'javelin-blade', shape: blade, options: { color: C.bronze, roughness: 0.4, metalness: 0.8, detail: 0.003 }, bone: 'hand.L' },
    ],
  };
}
