import { defineAsset, mixRgb, profile, rgb, sdf } from '../src/index.js';

/**
 * Curtain (props/furniture/curtain), matched to docs/item-mockups/curtain-mock.jpg.
 * Size: 1.4 m wide, 1.8 m tall, on y = 0, hanging in the XY plane and facing +Z. One idea: a red
 * cloth curtain hanging in soft folds from a wooden rod with rings, drawn aside and tied back at
 * the right with a gold tie-back and tassel, so the left part of the opening is clear.
 * Palette: cloth #b8402a / fold shade #7a2418, rod #8a5a32, rings and tie-back #d4a93a.
 */

const CLOTH = rgb('#b8402a');
const SHADE = rgb('#7a2418');
const TIE = { x: 0.42, y: 0.88 };

/** Fold phase: tight folds below the tie, wider folds above it. */
const fold = (x: number, y: number) => {
  const tight = y < TIE.y + 0.1 ? 1 : Math.max(0, 1 - (y - TIE.y - 0.1) / 0.5);
  return Math.sin(x * (22 + 20 * tight) + y * 1.5);
};

export default defineAsset({
  name: 'curtain',
  description: 'A red cloth curtain in soft folds on a wooden rod with rings, tied back at the right with a gold tie-back and tassel.',
  detail: 0.006,
  reference: 'docs/item-mockups/curtain-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const outline = profile.polygon(
      [
        [-0.62, 1.73],
        [0.62, 1.73],
        [0.64, 1.3],
        [0.58, TIE.y],
        [0.62, 0.4],
        [0.66, 0.02],
        [0.22, 0.02],
        [0.28, 0.45],
        [TIE.x - 0.12, TIE.y],
        [0.12, 1.2],
        [-0.25, 1.48],
        [-0.62, 1.6],
      ],
      { smooth: true },
    );
    const cloth = sdf
      .extrude(outline, 0.03, 0.01)
      .displace(0.025, (x, y) => -0.5 - 0.5 * fold(x, y), 1.6)
      .paintFn((x, y) => mixRgb(CLOTH, SHADE, 0.55 * (0.5 - 0.5 * fold(x, y))));
    k.body('cloth', cloth, { color: '#b8402a', roughness: 0.85, metalness: 0 });

    const rod = sdf.union(
      sdf.cylinder(0.018, 1.36, 0.004).rotateZ(90).at(0, 1.79, 0),
      sdf.sphere(0.035).at(-0.7, 1.79, 0),
      sdf.sphere(0.035).at(0.7, 1.79, 0),
    );
    k.body('rod', rod, { color: '#8a5a32', roughness: 0.6, metalness: 0 });
    const gold = [
      ...Array.from({ length: 7 }, (_, i) => sdf.torus(0.03, 0.006).rotateZ(90).at(-0.6 + i * 0.2, 1.77, 0)),
      sdf.torus(0.13, 0.016).scale([1, 1, 0.45]).at(TIE.x + 0.04, TIE.y, 0.01),
      sdf.capsule([TIE.x + 0.15, TIE.y, 0.03], [TIE.x + 0.17, TIE.y - 0.14, 0.04], 0.012),
      sdf.cone([TIE.x + 0.17, TIE.y - 0.14, 0.04], [TIE.x + 0.18, TIE.y - 0.24, 0.045], 0.018, 0.03),
    ];
    k.body('gold', sdf.union(...gold), { color: '#d4a93a', roughness: 0.35, metalness: 0.9 });
  },
});
