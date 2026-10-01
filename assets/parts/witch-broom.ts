import { noise, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Witch broom (part of `assets/witch.ts`; standalone `assets/witch-broom.ts`).
 * A crooked wooden stick with a cord and a bristle bundle on top. Class: hand-held. Local frame:
 * built along +Y with the grip at the origin, the bristles up. The function takes the pose that
 * places it, because the wood and bristle paint and bump read world coordinates after the pose.
 * Bodies: broom, bristles, cord (bone hand.R). Tint slots: none.
 */
const C = {
  stick: '#5a3a24',
  stickDark: '#3a2414',
  bristle: '#8a6a44',
  bristleDark: '#6a4a2c',
  cord: '#4a2e1c',
};

const rad = Math.PI / 180;
const rotY = (p: readonly [number, number, number], d: number): [number, number, number] => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

export function witchBroom(pose: (s: sdf.Shape) => sdf.Shape): Part {
  const stick = sdf.chain(
    [
      [0, -0.33, 0, 0.011],
      [0.008, -0.2, 0.004, 0.0135],
      [-0.006, -0.06, -0.004, 0.0145],
      [0.004, 0.06, 0.006, 0.0135],
      [0.0, 0.17, 0.0, 0.0125],
    ],
    0.01,
  );
  const BR_Y = 0.17;
  const bristles = sdf.smoothUnion(
    0.012,
    sdf.cone([0, BR_Y - 0.01, 0], [0, BR_Y + 0.11, 0], 0.02, 0.04),
    ...Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * 360 + (i % 2) * 15;
      const spread = 0.038 + 0.016 * noise.random(i, 2, 3);
      const len = 0.16 + 0.03 * noise.random(i, 5, 6);
      const p = rotY([spread, 0, 0], a);
      return sdf.cone([p[0] * 0.3, BR_Y, p[2] * 0.3], [p[0], BR_Y + len, p[2]], 0.014, 0.0065);
    }),
  );
  const cord = sdf.torus(0.02, 0.0075).at(0, BR_Y - 0.003, 0);
  const woodDark = rgb(C.stickDark);
  const bristleDark = rgb(C.bristleDark);

  return {
    name: 'witch-broom',
    bodies: [
      {
        name: 'broom',
        shape: pose(stick).paintFn((x, y, z, base) => (noise.fbm(x * 90, y * 14, z * 90, 2) > 0.25 ? woodDark : base)),
        options: { color: C.stick, roughness: 0.8, detail: 0.004, bump: (x, y, z) => 0.0015 * noise.fbm(x * 90, y * 12, z * 90, 2) },
        bone: 'hand.R',
      },
      {
        name: 'bristles',
        shape: pose(bristles).paintFn((x, y, z, base) => (noise.fbm(x * 70, y * 40, z * 70, 2) > 0.1 ? bristleDark : base)),
        options: { color: C.bristle, roughness: 0.9, detail: 0.0035, bump: (x, y, z) => 0.002 * noise.fbm(x * 60, y * 200, z * 60, 2) },
        bone: 'hand.R',
      },
      { name: 'cord', shape: pose(cord), options: { color: C.cord, roughness: 0.85, detail: 0.003 }, bone: 'hand.R' },
    ],
  };
}
