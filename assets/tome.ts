import { HAND_FIT, defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Spell tome (equipment/magic-weapons/tome), matched to docs/item-mockups/tome-mock.jpg.
 * Size: 0.26 m x 0.32 m, 0.08 m thick, lying flat on y = 0. One idea: a thick closed book with
 * a purple leather cover, gold corner guards, a gold clasp, and a glowing blue gem in a gold
 * bezel on the front. Palette: cover #7a4ab8 / #5a3290, pages #f2e3c2 / #d9c49a, gold #d4a93a,
 * gem glow #4ab0ff on a dark base #0c2a3a.
 */

const COVER = rgb('#7a4ab8');
const COVER_DARK = rgb('#5a3290');
const PAGE = rgb('#f2e3c2');
const PAGE_LINE = rgb('#d9c49a');

const W = 0.24; // along X (spine at -X)
const D = 0.3; // along Z
const T = 0.08; // thickness

export default defineAsset({
  name: 'tome',
  description: 'A thick closed spell tome with a purple leather cover, gold corners, a gold clasp, and a glowing blue gem.',
  detail: 0.003,
  reference: 'docs/item-mockups/tome-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'offhand', fitScale: HAND_FIT, frame: 'body', origin: [0, 0.04, -0.12], rotate: [90, 0, 90] },

  build(k) {
    const board = (y: number) => sdf.box([W, 0.014, D], 0.006).at(0, y, 0);
    const spine = sdf.box([0.03, T, D], 0.014).at(-W / 2 + 0.01, T / 2, 0);
    const cover = sdf.union(board(0.007), board(T - 0.007), spine);
    k.body(
      'cover',
      cover.paintFn((x, y, z) => mixRgb(COVER, COVER_DARK, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2)))),
      { color: '#7a4ab8', roughness: 0.65, metalness: 0, textureDensity: 2 },
    );

    const pages = sdf.box([W - 0.018, T - 0.026, D - 0.016], 0.004).at(0.004, T / 2, 0);
    k.body(
      'pages',
      pages.paintFn((_x, y) => mixRgb(PAGE, PAGE_LINE, Math.pow(0.5 + 0.5 * Math.cos(y * 900), 8))),
      { color: '#f2e3c2', roughness: 0.85, metalness: 0 },
    );

    // Gold: four corner guards on the front edge side, a clasp, and the gem bezel.
    const corners = [];
    for (const sz of [1, -1]) {
      corners.push(
        sdf
          .box([0.05, T + 0.006, 0.05], 0.006)
          .intersect(sdf.box([0.055, T + 0.01, 0.055]).rotateY(45))
          .at(W / 2 - 0.018, T / 2, sz * (D / 2 - 0.018)),
      );
    }
    const clasp = sdf.box([0.05, T * 0.6, 0.05], 0.006).at(W / 2 + 0.004, T / 2, 0);
    const bezel = sdf.torus(0.036, 0.007).at(0.01, T + 0.002, 0);
    k.body('gold', sdf.union(...corners, clasp, bezel), { color: '#d4a93a', roughness: 0.3, metalness: 1 });

    const gem = sdf.ellipsoid([0.03, 0.014, 0.03]).at(0.01, T + 0.003, 0);
    k.body('gem', gem, { color: '#0c2a3a', roughness: 0.15, metalness: 0, flat: true, detail: 0.004, emissive: '#4ab0ff', emissiveIntensity: 1.6 });
  },
});
