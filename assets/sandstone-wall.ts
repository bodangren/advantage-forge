import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * sandstone-wall: warm cream sandstone wall segment (bathhouse style), replaces stone-wall in maps.
 * Size: 2.0 m long (X), 1.5 m tall, core 0.12 m thick, blocks proud to ~0.16 m, flush ends at x = ±1.
 * One idea: chunky rounded cream blocks with a thin teal-blue tile band halfway up.
 * Palette: sandstone #e6cf9f, mortar #c9ad78, tile teal #3f8f94. Flat cap course on top.
 * Materials: stone (rough, bump), tile (glossier).
 */
const CREAM = rgb('#e6cf9f');
const MORTAR = rgb('#c9ad78');
const TEAL = rgb('#3f8f94');
const TEAL_DARK = rgb('#2f6f7c');
const LEN = 2.0;
const H = 1.5;
const CAP_H = 0.15;
const FIELD_TOP = H - CAP_H;
const GAP = 0.026;
const BAND0 = 0.681;
const BAND1 = 0.819;
const EPS = 1e-4;
const atEnd = (v: number): boolean => Math.abs(Math.abs(v) - LEN / 2) < EPS;

// Course edges (y), band excluded.
const ROWS: [number, number][] = [
  [0, 0.227], [0.227, 0.454], [0.454, BAND0],
  [BAND1, BAND1 + 0.2655], [BAND1 + 0.2655, FIELD_TOP],
];

const widthsFor = (row: number): number[] => {
  const n = 3 + (row % 2);
  const raw = Array.from({ length: n }, (_, i) => 0.6 + 0.8 * noise.random(row, i, 7));
  const s = raw.reduce((a, v) => a + v, 0);
  return raw.map((v) => (v / s) * LEN);
};

export default defineAsset({
  name: 'sandstone-wall',
  description: 'Chunky cream sandstone wall segment with a teal tile band and flat cap, 2 m long, chains end to end.',
  detail: 0.009,
  texture: { size: 1024 },
  build(k) {
    const core = sdf.box([LEN, H - 0.08, 0.12]).at(0, (H - 0.08) / 2 + 0.0, 0);
    const parts: Sdf[] = [];
    let id = 1;
    ROWS.forEach(([y0, y1], row) => {
      let lo = -LEN / 2;
      for (const w of widthsFor(row)) {
        const hi = lo + w;
        const x0 = lo + (atEnd(lo) ? 0 : GAP / 2);
        const x1 = hi - (atEnd(hi) ? 0 : GAP / 2);
        const by0 = y0 + (y0 === 0 ? 0 : GAP / 2);
        const by1 = y1 - GAP / 2;
        const d = 0.15 + 0.012 * noise.random(id, 5, 9);
        let b: Sdf = sdf.box([x1 - x0, by1 - by0, d], 0.03);
        if (noise.random(id, 71, 73) > 0.7 && !atEnd(x1)) {
          const chip = sdf.box([0.06, 0.05, 0.07], 0.01).rotate(25, 30, 20)
            .at((x1 - x0) / 2, (by1 - by0) / 2, d / 2);
          b = sdf.subtract(b, chip);
        }
        parts.push(b.at((x0 + x1) / 2, (by0 + by1) / 2, 0));
        lo = hi;
        id++;
      }
    });
    // Flat cap course, slightly proud, with a few joints.
    const capBounds = [-1, -0.35, 0.4, 1];
    for (let i = 0; i < 3; i++) {
      const a = capBounds[i] ?? 0;
      const c = capBounds[i + 1] ?? 0;
      const x0 = a + (i === 0 ? 0 : GAP / 2);
      const x1 = c - (i === 2 ? 0 : GAP / 2);
      parts.push(sdf.box([x1 - x0, CAP_H, 0.18], 0.012).at((x0 + x1) / 2, FIELD_TOP + CAP_H / 2, 0));
    }
    const wall = sdf.smoothUnion(0.004, core, ...parts);
    k.body('stone', wall.paintFn((x, y, z, base) => {
      const m = noise.fbm(x * 5, y * 5, z * 5, 3, 3);
      const rnd = noise.random(Math.floor((x + 1) * 3), Math.floor(y * 5), 11);
      let c = mixRgb(CREAM, rgb('#d9bf8a'), rnd * 0.5);
      c = m < 0 ? mixRgb(c, MORTAR, -m * 0.3) : mixRgb(c, rgb('#f0dcb0'), m * 0.2);
      // mortar in recessed joints: darken where the surface sits near the core
      const depth = Math.abs(z);
      c = mixRgb(MORTAR, c, depth > 0.07 ? 1 : 0.0);
      return depth > 0.07 ? c : base ? MORTAR : MORTAR;
    }), {
      color: CREAM,
      roughness: 0.92,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 12000,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 24, y * 24, z * 24, 3, 7),
    });

    // Teal tile band: a row of glazed tiles inset in the wall face.
    const tiles: Sdf[] = [];
    const N = 10;
    const tw = LEN / N;
    for (let i = 0; i < N; i++) {
      const x0 = -1 + i * tw + (i === 0 ? 0 : GAP / 2);
      const x1 = -1 + (i + 1) * tw - (i === N - 1 ? 0 : GAP / 2);
      tiles.push(sdf.box([x1 - x0, BAND1 - BAND0 - GAP, 0.15], 0.012).at((x0 + x1) / 2, (BAND0 + BAND1) / 2, 0));
    }
    k.body('tile', sdf.union(...tiles).paintFn((x, y, z) => {
      const i = Math.floor((x + 1) / tw);
      return mixRgb(TEAL, TEAL_DARK, noise.random(i, 3, 5) * 0.6);
    }), {
      color: TEAL,
      roughness: 0.4,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 4000,
      paintWeight: 2,
    });
  },
});
