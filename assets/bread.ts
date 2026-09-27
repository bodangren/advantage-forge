import { defineAsset, sdf, noise, rgb, mixRgb } from '../src/index.js';

// Design note (country loaf on board, props/food/bread):
// - Role: tavern food prop / market clutter; must read at 128 px as one stout
//   tan loaf on a small wooden board.
// - Size: loaf ~0.28 m wide, ~0.12 m tall, sitting on a 0.4 x 0.04 x 0.25 m
//   board; board bottom on y = 0, loaf base on the board top (y = 0.04).
// - One idea: a plump round country loaf with a soft floured X slash on top.
// - Shape language: round/chunky dominant (dome loaf, chamfered plank).
// - Palette: crust gold #d4a04a (60), crumb pale #f2e2ba (slash), bake dark
//   #8a5a30 (bottom crust band, slash rim, speckles), board honey #b5814a
//   with shadow #8a5a35. Value plan: pale slash focal point on mid dome,
//   dark crust foot anchoring it to the board.
// - Materials: bread matte (roughness 0.75), board wood (0.8); grain, slash
//   groove, and speckles in `bump` so the mesh stays under 1500 triangles.
// - Detail: dome loaf (primary), X slash + speckles (secondary paint),
//   grain plank (secondary). Focal point: the pale X on the dome.
// - Rig/animation: none (static prop).

const CRUST = rgb('#d4a04a');
const CRUST_LIGHT = rgb('#eac078');
const CRUMB = rgb('#f2e2ba');
const BAKE = rgb('#8a5a30');
const BOARD_DARK = rgb('#8a5a35');

const BOARD_TOP = 0.04;
const LOAF_H = 0.13;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Distance field of the X slash (two diagonal strokes on the dome top),
// plus a height gate so paint/bump only apply on the upper dome.
const SLASH_DIRS: Array<[number, number]> = [
  [0.857, 0.514],
  [0.857, -0.514],
];
const SLASH_LEN = 0.085;
function slashField(x: number, y: number, z: number): { d: number; gate: number } {
  let d = Infinity;
  for (const [ux, uz] of SLASH_DIRS) {
    const s = Math.max(-SLASH_LEN, Math.min(SLASH_LEN, x * ux + z * uz));
    d = Math.min(d, Math.hypot(x - ux * s, z - uz * s));
  }
  return { d, gate: smoothstep(0.1, 0.122, y) };
}

export default defineAsset({
  name: 'bread',
  description: 'A round country loaf with an X slash on a small wooden board.',
  detail: 0.007,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ loaf
    // Plump dome: wide ellipsoid with a flat base where it meets the board.
    const loafShape = sdf
      .ellipsoid([0.14, 0.082, 0.115])
      .at(0, 0.088, 0)
      .displace(0.0025, (x, y, z) => noise.fbm(x * 14, y * 14, z * 14, 2))
      .intersect(sdf.halfSpace([0, -1, 0], -BOARD_TOP));

    const loafPaint = (x: number, y: number, z: number) => {
      const t = clamp01((y - BOARD_TOP) / LOAF_H);
      // Golden dome over a thicker dark crust foot.
      let c = mixRgb(BAKE, CRUST, smoothstep(0.02, 0.42, t));
      c = mixRgb(c, CRUST_LIGHT, smoothstep(0.5, 1, t) * 0.55);
      // X slash: pale crumb interior with a baked darker rim.
      const { d, gate } = slashField(x, y, z);
      const mask = (1 - smoothstep(0.009, 0.018, d)) * gate;
      const rim =
        smoothstep(0.007, 0.012, d) * (1 - smoothstep(0.012, 0.022, d)) * gate;
      c = mixRgb(c, BAKE, rim * 0.55);
      c = mixRgb(c, CRUMB, mask * 0.9);
      // Faint bake speckles on the dome, kept out of the slash.
      if (t > 0.3) {
        const n = noise.fbm(x * 95, y * 95, z * 95, 2);
        c = mixRgb(c, BAKE, smoothstep(0.35, 0.75, n) * 0.35 * (1 - mask));
      }
      return c;
    };
    k.body('loaf', loafShape.paintFn(loafPaint), {
      color: '#d4a04a',
      roughness: 0.75,
      metalness: 0,
      detail: 0.005,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => {
        const { d, gate } = slashField(x, y, z);
        const groove = -(1 - smoothstep(0, 0.012, d)) * gate * 0.0025;
        const sp = Math.max(0, noise.fbm(x * 95, y * 95, z * 95, 2) - 0.35) * 0.001;
        return groove - sp;
      },
      maxTriangles: 1150,
    });

    // ------------------------------------------------------------ board
    // Thin chamfered plank, grain running along X.
    const boardShape = sdf.box([0.4, 0.04, 0.25], 0.012).at(0, 0.02, 0);
    const boardPaint = (x: number, y: number, z: number) => {
      const grain = noise.fbm(x * 7, z * 45, y * 45, 3);
      let c = mixRgb(rgb('#b5814a'), BOARD_DARK, 0.25 + 0.25 * grain);
      c = mixRgb(c, BOARD_DARK, smoothstep(0.14, 0.2, Math.abs(x)) * 0.45);
      c = mixRgb(c, BOARD_DARK, (1 - smoothstep(0, 0.035, y)) * 0.4);
      return c;
    };
    k.body('board', boardShape.paintFn(boardPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 7, z * 45, y * 45, 2),
      maxTriangles: 400,
    });
  },
});
