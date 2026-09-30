import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Lute (equipment/instruments/lute). A held or displayed instrument, seen at pickup size.
 * Size: 0.9 m tall, 0.42 m wide, stands on y = 0 on its rounded bottom, faces +Z,
 * leans back 12 degrees around the base.
 * One idea: a plump teardrop soundboard with a gold rose, a deep dark bowl, a bent-back peg head.
 * Shape language: round bowl and knobs, one slim neck, a head that breaks the outline.
 * Palette: pale board #e8c07a, bowl #8a4a2a, neck #b07a48, dark wood #4a2c18, strings #efe4c8,
 *   gold #d4a93a (the accent).
 * Materials: board, bowl, neck (wood, rough 0.8), fittings (dark wood), strings, gold rose (metal).
 * Detail: six rib grooves, sound hole, rosette, two frets, fingerboard, four pegs, bridge, four strings.
 * No rig.
 */

const PALE = rgb('#e8c07a');
const BOWL = rgb('#8a4a2a');
const BOWL_DARK = rgb('#5e3019');
const NECK = rgb('#b07a48');
const DARK = rgb('#4a2c18');
const GOLD = rgb('#d4a93a');
const LEAN = -12;

const lean = <T extends { rotateX: (d: number) => T }>(s: T): T => s.rotateX(LEAN);

// Teardrop outline, x half-width by y: wide at y 0.2, narrow at y 0.5, round bottom at y 0.
const half: [number, number][] = [
  [0.0, 0.0],
  [0.09, 0.02],
  [0.17, 0.07],
  [0.208, 0.14],
  [0.21, 0.2],
  [0.185, 0.29],
  [0.13, 0.39],
  [0.075, 0.46],
  [0.06, 0.5],
];
const outline = (shrink: number) => {
  const pts: [number, number][] = [
    ...half.map(([x, y]): [number, number] => [x - shrink * (y === 0 ? 0 : 1), y + (y === 0 ? shrink : 0)]),
    ...[...half].reverse().slice(1).map(([x, y]): [number, number] => [-(x - shrink), y]),
  ];
  return profile.polygon(pts, { smooth: true });
};
const halfWidth = (y: number) => {
  for (let i = 1; i < half.length; i++) {
    const [x0, y0] = half[i - 1]!;
    const [x1, y1] = half[i]!;
    if (y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  }
  return 0.06;
};

export default defineAsset({
  name: 'lute',
  description: 'An upright lute with a teardrop board, gold rose, dark ribbed bowl, bent peg head, and four strings.',
  reference: 'docs/item-mockups/lute-mock.jpg',
  detail: 0.005,
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- soundboard and bowl
    const hole = sdf.cylinder(0.06, 0.02, 0).rotateX(90).at(0, 0.3, 0.012);
    const board = sdf
      .extrude(outline(0), 0.02, 0.004)
      .subtract(hole)
      .paintFn((x, y, z) => {
        const r = Math.hypot(x, y - 0.3);
        if (r < 0.056) return DARK;
        const n = 0.5 + 0.5 * noise.fbm(x * 30, y * 6, 1, 2);
        const rim = Math.max(0, (Math.abs(x) - halfWidth(y) + 0.03) / 0.03);
        return mixRgb(mixRgb(PALE, rgb('#f1d497'), n * 0.5), BOWL, Math.min(1, rim) * 0.45);
      });
    k.body('board', lean(board), { color: '#e8c07a', roughness: 0.7, detail: 0.007, maxTriangles: 900 });

    const bowlShape = sdf
      .extrude(outline(0.06), 0.08)
      .round(0.06)
      .at(0, 0, -0.11)
      .intersect(sdf.box([1, 1.2, 0.4]).at(0, 0.5, -0.21))
      .paintFn((x, y, z) => {
        const w = Math.max(0.05, halfWidth(y));
        const s = Math.abs(Math.sin((x / w) * Math.PI * 3.5));
        const groove = s < 0.14 ? 1 - s / 0.14 : 0;
        const n = 0.5 + 0.5 * noise.fbm(x * 12, y * 8, z * 12, 2);
        return mixRgb(mixRgb(BOWL, rgb('#9c5a34'), n * 0.4), BOWL_DARK, groove * 0.8);
      });
    k.body('bowl', lean(bowlShape), {
      color: '#8a4a2a',
      roughness: 0.6,
      detail: 0.01,
      maxTriangles: 1600,
      bump: (x, y) => {
        const w = Math.max(0.05, halfWidth(y));
        const s = Math.abs(Math.sin((x / w) * Math.PI * 3.5));
        return s < 0.14 ? -0.002 * (1 - s / 0.14) : 0;
      },
    });

    // ---------------------------------------------------------------- neck, frets, head
    const HEAD_A = -60;
    const neck = sdf.box([0.09, 0.32, 0.05], 0.012).at(0, 0.63, 0.0);
    const fretBands = sdf.union(
      ...[0.58, 0.68].map((y) => sdf.box([0.1, 0.014, 0.06], 0.005).at(0, y, 0.0)),
    );
    const headBox = sdf.box([0.1, 0.16, 0.06], 0.012).at(0, 0.075, 0).rotateX(HEAD_A).at(0, 0.78, 0);
    const woodNeck = neck
      .smoothUnion(0.01, headBox)
      .paintFn((x, y, z) => {
        const g = 0.5 + 0.5 * noise.fbm(x * 30, y * 5, z * 30, 2);
        return mixRgb(NECK, rgb('#c48f58'), g * 0.5);
      });
    k.body('neck', lean(woodNeck), { color: '#b07a48', roughness: 0.75, detail: 0.005, maxTriangles: 800 });

    const finger = sdf.box([0.05, 0.3, 0.012], 0.004).at(0, 0.63, 0.027);
    const fretBars = sdf.union(
      ...[0.58, 0.68].map((y) => sdf.box([0.104, 0.014, 0.066], 0.006).at(0, y, 0.0)),
    );
    const peg = (side: number, ly: number) =>
      sdf.smoothUnion(
        0.004,
        sdf.cylinder(0.015, 0.06, 0.004).rotateZ(90).at(side * 0.08, ly, 0),
        sdf.sphere(0.024).at(side * 0.115, ly, 0),
      );
    const pegs = sdf
      .union(peg(1, 0.05), peg(-1, 0.05), peg(1, 0.125), peg(-1, 0.125))
      .rotateX(HEAD_A)
      .at(0, 0.78, 0);
    const bridge = sdf.box([0.14, 0.02, 0.02], 0.006).at(0, 0.12, 0.024);
    const nut = sdf.box([0.06, 0.012, 0.016], 0.004).at(0, 0.782, 0.028);
    const fittings = sdf.union(finger, fretBars, pegs, bridge, nut).paintFn((x, y, z) => {
      if (y > 0.57 && y < 0.69 && Math.abs(y - 0.58) < 0.009) return GOLD;
      if (Math.abs(y - 0.68) < 0.009 && y < 0.7) return GOLD;
      return mixRgb(DARK, rgb('#6b4226'), 0.3 * (0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2)));
    });
    k.body('fittings', lean(fittings), { color: '#4a2c18', roughness: 0.6, detail: 0.004, maxTriangles: 900 });

    // ---------------------------------------------------------------- strings
    const bx = [-0.05, -0.017, 0.017, 0.05];
    const nx = [-0.018, -0.006, 0.006, 0.018];
    const rad = (HEAD_A * Math.PI) / 180;
    const hy = 0.03;
    const headPt = (x: number, ly: number, lz: number): [number, number, number] => [
      x,
      0.78 + Math.cos(rad) * ly - Math.sin(rad) * lz,
      Math.sin(rad) * ly + Math.cos(rad) * lz,
    ];
    const strings = sdf.union(
      ...bx.map((x, i) =>
        sdf.union(
          sdf.capsule([x, 0.135, 0.036], [nx[i]!, 0.79, 0.038], 0.004),
          sdf.capsule([nx[i]!, 0.79, 0.038], headPt(nx[i]!, hy + 0.04, 0.034), 0.004),
        ),
      ),
    );
    k.body('strings', lean(strings), { color: '#efe4c8', roughness: 0.5, detail: 0.003, maxTriangles: 500 });

    // ---------------------------------------------------------------- rosette
    const rose = sdf
      .union(sdf.torus(0.066, 0.005), sdf.torus(0.078, 0.0035))
      .rotateX(90)
      .at(0, 0.3, 0.02);
    k.body('rose', lean(rose), { color: '#d4a93a', roughness: 0.32, metalness: 1, detail: 0.003, maxTriangles: 500 });
  },
});
