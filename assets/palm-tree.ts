import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * Palm tree — Chibi Quest nature prop (nature/trees/palm-tree): about 3.8 m tall, on y = 0, faces +Z.
 * Role: village landmark at sprite size. One idea: a short thick stacked trunk leaning toward +Z
 * under eight fat arching fronds, with two big orange coconuts in front. Round, chunky, soft.
 * Palette: trunk #b5814a / top #c9a06a / joint #8a5a35; fronds #5cb85c, top #8fd45c, under #3a8a3a;
 * coconut #e8a03a / #c07a20; heart #e0bb60.
 */
const CROWN = [0, 2.6, 0.32] as const;
const jointC = rgb('#8a5a35');
const trunkC = rgb('#b5814a');
const trunkTop = rgb('#c9a06a');
const leaf = rgb('#5cb85c');
const leafTop = rgb('#8fd45c');
const leafUnder = rgb('#3a8a3a');
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * One frond: 6 overlapping flattened ellipsoids on a circular arc in the local XY plane.
 * The arc starts pointing up at a0 degrees and ends 1.55 m out pointing down at a1 degrees.
 */
function frond(i: number, lifted: boolean): Sdf {
  const a0 = ((lifted ? 65 : 38) * Math.PI) / 180;
  const a1 = ((lifted ? -40 : -75) * Math.PI) / 180;
  const reach = 1.55;
  const R = reach / (Math.sin(a0) - Math.sin(a1));
  const turn = a0 - a1;
  const total = R * turn;
  const n = 6;
  const parts: Sdf[] = [];
  for (let j = 0; j < n; j++) {
    const u = j / (n - 1);
    const s = 0.2 + u * (total - 0.4);
    const a = a0 - s / R;
    const px = R * (Math.sin(a0) - Math.sin(a));
    const py = R * (Math.cos(a) - Math.cos(a0));
    const w = 0.25 - 0.09 * u;
    const th = 0.085 - 0.035 * u;
    const len = 0.26 - 0.02 * u;
    parts.push(sdf.ellipsoid([len, th, w]).rotateZ((a * 180) / Math.PI).at(px, py, 0));
  }
  const roll = (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 5);
  return sdf
    .smoothUnion(0.07, ...parts)
    .displace(0.03, (x, _y, z) => Math.sin(x * 14) * clamp01(Math.abs(z) / 0.2 - 0.2))
    .rotateX(roll)
    .rotateY(i * 40 + 10)
    .at(CROWN[0], CROWN[1] + 0.05, CROWN[2]);
}

export default defineAsset({
  name: 'palm-tree',
  description: 'Chibi palm, 3.8 m: short stacked leaning trunk, eight fat fronds, two big coconuts.',
  reference: 'bench/overnight/refs/p1-village/palm-tree-mock.jpg',
  detail: 0.014,
  texture: { size: 1024 },

  build(k) {
    const cx = (y: number): number => 0.0 * y;
    const cz = (y: number): number => -0.05 + 0.4 * (y / 2.5) ** 1.5;
    const segs: Sdf[] = [];
    for (let s = 0; s < 5; s++) {
      const y0 = s * 0.5 + 0.17;
      const y1 = s * 0.5 + 0.4;
      const r = 0.34 - 0.03 * s;
      segs.push(sdf.capsule([cx(y0), y0, cz(y0)], [cx(y1), y1, cz(y1)], r));
    }
    const foot = sdf.cone([0, 0, cz(0)], [0, 0.35, cz(0.35)], 0.42, 0.33);
    const trunk = sdf.smoothUnion(0.06, foot, ...segs).paintFn((_x, y) => {
      const f = (y / 0.5) % 1;
      const joint = Math.max(1 - f / 0.14, (f - 0.86) / 0.14, 0);
      const base = mixRgb(trunkC, trunkTop, clamp01(f * 1.2));
      return mixRgb(base, jointC, clamp01(joint));
    });
    k.body('trunk', trunk, { color: '#b5814a', roughness: 0.9, detail: 0.014, paintWeight: 2, maxTriangles: 2500 });

    const fronds = sdf
      .union(...Array.from({ length: 9 }, (_, i) => frond(i, i % 3 === 0)))
      .paintFn((_x, y) => {
        const t = clamp01((y - CROWN[1] + 0.35) / 0.9);
        return t < 0.5 ? mixRgb(leafUnder, leaf, t * 2) : mixRgb(leaf, leafTop, (t - 0.5) * 2);
      });
    k.body('fronds', fronds, { color: '#5cb85c', roughness: 0.7, detail: 0.012, paintWeight: 2, maxTriangles: 3900 });

    k.body('heart', sdf.sphere(0.28).at(CROWN[0], CROWN[1] + 0.05, CROWN[2]), { color: '#e0bb60', roughness: 0.75, detail: 0.012, maxTriangles: 400 });

    const nuts = sdf
      .union(sdf.sphere(0.2).at(-0.2, 2.45, 0.64), sdf.sphere(0.2).at(0.2, 2.45, 0.64))
      .paintFn((_x, y) => mixRgb(rgb('#c07a20'), rgb('#e8a03a'), clamp01((y - 2.27) / 0.3)));
    k.body('coconuts', nuts, { color: '#e8a03a', roughness: 0.55, detail: 0.01, maxTriangles: 500 });
    const caps = sdf.union(...[-0.2, 0.2].map((x) => sdf.cylinder(0.11, 0.04, 0.015).at(x, 2.64, 0.64)));
    k.body('caps', caps, { color: '#6aa838', roughness: 0.7, detail: 0.008, maxTriangles: 200 });
  },
});
