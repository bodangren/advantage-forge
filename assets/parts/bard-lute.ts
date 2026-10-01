import { rgb, sdf, type Part } from '../../src/index.js';

/**
 * Bard lute (part of `assets/bard.ts`; standalone `assets/bard-lute.ts`).
 *
 * A round-bowled wooden lute with a ribbed back, a sound hole, a dark fingerboard, a bent pegbox,
 * four strings, and gold pegs.
 * Class: hand-held. Local frame: the origin is the center of the bowl at the worn size (already
 * scaled by 1.2), +X along the neck, +Z out of the soundboard. The host tilts it 21 degrees and
 * sets it in front of the belly.
 * Bodies: luteBody, strings, pegs (bone `lute`). Tint slots: none.
 */

const C = {
  wood: '#6e3f22',
  woodRib: '#4e2b17',
  soundboard: '#96623a',
  fingerboard: '#3b2417',
  hole: '#2a170e',
  string: '#efe4c8',
  gold: '#d8a93c',
};
const rad = Math.PI / 180;
const SCALE = 1.2;
const worn = (s: sdf.Shape) => s.scale(SCALE);
type V3 = readonly [number, number, number];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];

export function bardLute(): Part {
  const bowl = sdf
    .smoothUnion(0.04, sdf.ellipsoid([0.105, 0.076, 0.045]).at(-0.015, 0, 0), sdf.ellipsoid([0.07, 0.05, 0.035]).at(0.06, 0, 0))
    .intersect(sdf.halfSpace([0, 0, 1], 0.012));
  const luteNeck = sdf.box([0.19, 0.03, 0.02], 0.006).at(0.19, 0, 0.001);
  const PEG_DIR: V3 = [Math.cos(38 * rad), 0, -Math.sin(38 * rad)];
  const pegbox = sdf.box([0.085, 0.034, 0.02], 0.007).at(0.042, 0, 0).rotateY(38).at(0.282, 0, 0);
  const bridge = sdf.box([0.012, 0.05, 0.008], 0.003).at(-0.068, 0, 0.013);
  const rib = rgb(C.woodRib);
  const lute = sdf
    .union(bowl, luteNeck, pegbox, bridge.paint(C.fingerboard))
    .paintFn((x, y, z, base) => (z < 0.006 && Math.sin(Math.atan2(y, -z) * 9) > 0.85 ? rib : base))
    .paintWhere(sdf.halfSpace([0, 0, -1], -0.009).intersect(sdf.box([0.3, 0.2, 0.1]).at(-0.02, 0, 0)), C.soundboard)
    .paintWhere(sdf.cylinder(0.027, 0.1).rotateX(90).at(0.035, 0, 0.012), C.fingerboard)
    .paintWhere(sdf.cylinder(0.02, 0.1).rotateX(90).at(0.035, 0, 0.012), C.hole)
    .paintWhere(sdf.box([0.2, 0.04, 0.012]).at(0.19, 0, 0.012), C.fingerboard);
  const strings = sdf.union(
    ...[-0.0105, -0.0035, 0.0035, 0.0105].map((y) => sdf.capsule([-0.068, y, 0.0135], [0.282, y * 0.7, 0.0135], 0.0022)),
  );
  const pegs = sdf.union(
    ...[0.028, 0.062].flatMap((t) => {
      const p = add([0.282, 0, 0], PEG_DIR, t);
      return [-1, 1].map((s) => sdf.capsule(p, add(p, [0, 0.03 * s, 0]), 0.005).union(sdf.sphere(0.012).at(...add(p, [0, 0.035 * s, 0]))));
    }),
  );
  return {
    name: 'bard-lute',
    bodies: [
      { name: 'luteBody', shape: worn(lute), options: { color: C.wood, roughness: 0.5, textureDensity: 1.5 }, bone: 'lute' },
      { name: 'strings', shape: worn(strings), options: { color: C.string, roughness: 0.4, detail: 0.002 }, bone: 'lute' },
      { name: 'pegs', shape: worn(pegs), options: { color: C.gold, roughness: 0.32, metalness: 0.9 }, bone: 'lute' },
    ],
  };
}
