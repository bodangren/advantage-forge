import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Lava pool ground tile: 2 m x 2 m slab 0.3 m thick (y -0.3..0), lava surface at y = -0.03.
 * One idea: glowing orange lava with bright veins between dark crust plates, in a periodic
 * pattern (period 2 m) so tiles chain with no seam. Sides dark basalt. No edge features.
 * Palette: lava #ff6a1a, vein #ffc040, crust #3a2a28, basalt #2b2626.
 */
const CELLS = 4;
const SLAB = 0.3;
const SURF = -0.03;
const LAVA = rgb('#ff6a1a');
const VEIN = rgb('#ffc040');
const CRUST = rgb('#3a2a28');
const BASALT = rgb('#2b2626');
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const wrap = (i: number) => ((i % CELLS) + CELLS) % CELLS;

function cells(x: number, z: number): { edge: number; id: number } {
  const u = ((x + 1) / 2) * CELLS;
  const v = ((z + 1) / 2) * CELLS;
  const ui = Math.floor(u);
  const vi = Math.floor(v);
  let f1 = Infinity;
  let f2 = Infinity;
  let id = 0;
  for (let dj = -2; dj <= 2; dj++)
    for (let di = -2; di <= 2; di++) {
      const i = ui + di;
      const j = vi + dj;
      const wi = wrap(i);
      const wj = wrap(j);
      const px = i + 0.2 + 0.6 * noise.random(wi, wj, 0, 31);
      const pz = j + 0.2 + 0.6 * noise.random(wi, wj, 0, 32);
      const d = Math.hypot(u - px, v - pz);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = wj * CELLS + wi;
      } else if (d < f2) f2 = d;
    }
  return { edge: (f2 - f1) * 0.5 * (2 / CELLS), id };
}

// Periodic swirl in [0,1] with period 2 m.
const P = Math.PI;
const swirl = (x: number, z: number) =>
  0.5 + 0.25 * Math.sin(P * (2 * x) + 1.7 * Math.sin(P * z * 2)) + 0.25 * Math.sin(P * (2 * z) + 1.3 * Math.sin(P * x * 3));

export default defineAsset({
  name: 'lava-ground',
  description: 'A 2 m square seamless lava pool tile with glowing veins and floating dark crust plates.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    const crust = (x: number, z: number) => {
      const { edge, id } = cells(x, z);
      return smooth(0.03, 0.08, edge) * smooth(0.3, 0.5, noise.random(id, 0, 0, 33) + 0.3 * swirl(x, z));
    };
    const base = sdf.box([2, SLAB - 0.04, 2]).at(0, -SLAB / 2 - 0.02, 0).paintFn((x, y) => mixRgb(BASALT, rgb('#1d1a1a'), clamp(-y / SLAB) * 0.6));
    k.body('basalt', base, { color: '#2b2626', roughness: 0.9, metalness: 0, detail: 0.01, maxTriangles: 800 });
    const top = sdf.box([2, 0.024, 2]).at(0, SURF - 0.012, 0).paintFn((x, y, z) => {
      const s = swirl(x, z);
      const { edge } = cells(x, z);
      let c = mixRgb(LAVA, VEIN, smooth(0.45, 0.9, s) * 0.6 + (1 - smooth(0.0, 0.06, edge)) * 0.6);
      c = mixRgb(c, CRUST, crust(x, z));
      return y < SURF - 0.02 ? BASALT : c;
    });
    k.body('lava', top, {
      color: '#ff6a1a',
      roughness: 0.6,
      metalness: 0,
      detail: 0.005,
      emissive: '#ff5a10',
      emissiveIntensity: 1.0,
      maxTriangles: 6000,
    });
  },
});
