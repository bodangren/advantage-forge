import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Coal pile (props/blacksmith/coal): a small heap of faceted black lumps for the forge corner,
 * matched to the fuel piles in docs/blacksmith-mockups/blacksmith-quest_001.jpg.
 * Size: about 0.42 m x 0.36 m, 0.2 m tall, on y = 0. One idea: chunky angular lumps heaped into
 * a low mound, flat-shaded so each facet catches the forge light. Palette: coal #26262b,
 * sheen #4a4d57, dust #1a1a1d. Material: roughness 0.45, slightly glossy facets.
 */

const COAL = rgb('#26262b');
const SHEEN = rgb('#4a4d57');
const DUST = rgb('#1a1a1d');

export default defineAsset({
  name: 'coal',
  description: 'A small heap of chunky, faceted black coal lumps.',
  detail: 0.006,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: false,

  build(k) {
    const lumps = [];
    // Rings of lumps: a wide base ring, a middle ring, and a cap.
    const layers: [number, number, number, number][] = [
      // count, ring radius, center height, lump size
      [10, 0.13, 0.03, 0.075],
      [6, 0.065, 0.08, 0.07],
      [2, 0.02, 0.125, 0.065],
    ];
    let i = 0;
    for (const [count, ring, y, size] of layers) {
      for (let j = 0; j < count; j++, i++) {
        const r = (u: number) => noise.random(i, u, 0, 31);
        const a = ((j + 0.4 * r(1)) / count) * Math.PI * 2;
        const s = size * (0.75 + 0.5 * r(2));
        const lump = sdf
          .box([s * (1.1 + 0.4 * r(3)), s * (0.8 + 0.3 * r(4)), s * (0.9 + 0.4 * r(5))], s * 0.12)
          .intersect(sdf.halfSpace([0.6, 0.7, 0.3], s * 0.32))
          .intersect(sdf.halfSpace([-0.5, 0.6, -0.4], s * 0.34))
          .rotate(r(6) * 60 - 30, r(7) * 180, r(8) * 60 - 30)
          .at(Math.cos(a) * ring * 1.15, y + (r(9) - 0.5) * 0.02, Math.sin(a) * ring);
        lumps.push(lump);
      }
    }
    // A dark core mound fills the gaps between the lumps.
    lumps.push(sdf.ellipsoid([0.15, 0.085, 0.13]).at(0, 0.01, 0));
    const pile = sdf
      .union(...lumps)
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 1, 1]).at(0, 0.3, 0)))
      .paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        return mixRgb(mixRgb(DUST, COAL, Math.min(1, y / 0.05)), SHEEN, 0.35 * n * n);
      });
    k.body('coal', pile, { color: '#26262b', roughness: 0.45, metalness: 0.1, flat: true, detail: 0.006 });
  },
});
