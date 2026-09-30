import { defineAsset, sdf, noise, rgb, mixRgb } from '../src/index.js';

// Design note (country loaf on board, props/food/bread):
// - Role: tavern food prop; reads at 128 px from above as a long loaf with
//   three wide pale score cuts on a wooden board.
// - Size: 0.40 x 0.17 x 0.25 m; board bottom on y = 0, loaf on board top.
// - One idea: elongated loaf, three deep diagonal scores showing pale crumb.
// - Shape: round loaf (dominant), chamfered plank (secondary).
// - Palette: crust #c58a3c sides, #9a5f24 top, crumb #f3dca0, flour specks
//   pale, board #a0703f with darker edge.
// - Materials: bread matte (0.75), board wood (0.8); grain and specks in bump.
// - Detail: scores (cut with smoothSubtract, crumb painted inside), flour.
// - Rig/animation: none.

const CRUST = rgb('#c58a3c');
const CRUST_TOP = rgb('#9a5f24');
const CRUMB = rgb('#f3dca0');
const FLOUR = rgb('#f0e4c4');
const BOARD = rgb('#a0703f');
const BOARD_DARK = rgb('#7c5330');

const BOARD_TOP = 0.04;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Three diagonal scores across the loaf (centers along X), direction in XZ.
const SCORE_X = [-0.075, 0, 0.075];
const SCORE_ANGLE = 28; // degrees off the Z axis
const SCORE_HALF = 0.06;
const SCORE_W = 0.015; // half width
const ux = Math.sin((SCORE_ANGLE * Math.PI) / 180);
const uz = Math.cos((SCORE_ANGLE * Math.PI) / 180);
function scoreDist(x: number, z: number): number {
  let d = Infinity;
  for (const cx of SCORE_X) {
    const px = x - cx;
    const s = Math.max(-SCORE_HALF, Math.min(SCORE_HALF, px * ux + z * uz));
    d = Math.min(d, Math.hypot(px - ux * s, z - uz * s));
  }
  return d;
}

export default defineAsset({
  name: 'bread',
  description: 'A long country loaf with three score cuts on a small wooden board.',
  detail: 0.007,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    let loafShape = sdf
      .ellipsoid([0.17, 0.088, 0.085])
      .at(0, 0.082, 0)
      .displace(0.004, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2))
      .intersect(sdf.halfSpace([0, -1, 0], -BOARD_TOP));
    const cuts = SCORE_X.map((cx) =>
      sdf
        .box([SCORE_W * 2, 0.06, SCORE_HALF * 2 + 0.02], 0.006)
        .rotateY(-SCORE_ANGLE)
        .at(cx, 0.163, 0),
    );
    loafShape = loafShape.smoothSubtract(0.004, ...cuts);

    const loafPaint = (x: number, y: number, z: number) => {
      const t = clamp01((y - BOARD_TOP) / 0.13);
      let c = mixRgb(CRUST, CRUST_TOP, smoothstep(0.35, 0.9, t));
      const d = scoreDist(x, z);
      if (y > 0.1) {
        const inCut = 1 - smoothstep(SCORE_W * 0.85, SCORE_W * 1.15, d);
        const lip = (1 - smoothstep(SCORE_W * 1.1, SCORE_W * 1.8, d)) * 0.5;
        c = mixRgb(c, CRUST_TOP, lip * (1 - inCut));
        c = mixRgb(c, CRUMB, inCut);
      }
      const n = noise.fbm(x * 90, y * 90, z * 90, 2);
      c = mixRgb(c, FLOUR, smoothstep(0.45, 0.7, n) * 0.6 * smoothstep(0.4, 0.8, t));
      return c;
    };
    k.body('loaf', loafShape.paintFn(loafPaint), {
      color: '#c58a3c',
      roughness: 0.75,
      metalness: 0,
      detail: 0.004,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 2),
      maxTriangles: 3500,
    });

    // Thin chamfered plank, grain running along X.
    const boardShape = sdf.box([0.4, 0.04, 0.25], 0.012).at(0, 0.02, 0);
    const boardPaint = (x: number, y: number, z: number) => {
      const grain = noise.fbm(x * 7, z * 45, y * 45, 3);
      let c = mixRgb(BOARD, BOARD_DARK, 0.15 + 0.25 * grain);
      c = mixRgb(c, BOARD_DARK, smoothstep(0.14, 0.2, Math.abs(x)) * 0.45);
      c = mixRgb(c, BOARD_DARK, (1 - smoothstep(0, 0.035, y)) * 0.4);
      return c;
    };
    k.body('board', boardShape.paintFn(boardPaint), {
      color: '#a0703f',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 7, z * 45, y * 45, 2),
      maxTriangles: 400,
    });
  },
});
