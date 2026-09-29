import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * Ancient tree — Chibi Quest nature prop (catalog `nature/trees/ancient-tree`): 5 m tall, 5 m wide,
 * standing on y = 0, facing +Z. Role: forest landmark seen at sprite size.
 * One idea: a huge knuckled root flare and fat trunk under a wide clumped dome, with a dark
 *   hollow and a vine loop as the focal read.
 * Shape language: round, chunky, with sturdy branches as the secondary read.
 * Palette: bark #8a5a35, groove #5f3d22, ridge #a9713c, leaf #6fae43, sun #b2d95e, under #3e7331,
 *   hollow #1a1c20.
 * Materials: wood (0.9), foliage (0.72), hollow, vine (bark colored).
 */
const bark = rgb('#8a5a35');
const barkDark = rgb('#5f3d22');
const barkLight = rgb('#a9713c');
const leafDark = rgb('#3e7331');
const leaf = rgb('#6fae43');
const leafLight = rgb('#b2d95e');
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

interface Clump { readonly x: number; readonly y: number; readonly z: number; readonly r: number }
const clumps: Clump[] = [
  { x: 0, y: 4.2, z: 0, r: 1.2 },
  { x: 0.2, y: 4.85, z: 0.1, r: 0.85 },
  { x: -0.7, y: 4.6, z: -0.3, r: 0.8 },
  { x: 0.8, y: 4.55, z: 0.5, r: 0.8 },
  { x: -0.5, y: 4.55, z: 0.7, r: 0.8 },
  { x: 0.6, y: 4.6, z: -0.7, r: 0.8 },
  { x: -1.3, y: 3.9, z: 0.3, r: 1.0 },
  { x: 1.3, y: 3.9, z: -0.1, r: 1.0 },
  { x: 0.1, y: 3.75, z: 1.3, r: 0.95 },
  { x: -0.1, y: 3.8, z: -1.3, r: 0.95 },
  { x: -1.5, y: 3.4, z: 1.0, r: 0.8 },
  { x: 1.5, y: 3.4, z: 1.0, r: 0.8 },
  { x: -1.5, y: 3.4, z: -1.0, r: 0.8 },
  { x: 1.5, y: 3.4, z: -1.0, r: 0.8 },
  { x: -1.7, y: 3.3, z: 0.0, r: 0.8 },
  { x: 1.7, y: 3.3, z: 0.0, r: 0.8 },
  { x: 0.0, y: 3.3, z: 1.6, r: 0.8 },
  { x: 0.0, y: 3.3, z: -1.6, r: 0.8 },
  { x: -1.0, y: 4.5, z: 0.0, r: 0.8 },
  { x: 1.1, y: 4.4, z: 0.0, r: 0.8 },
  { x: 0.0, y: 3.4, z: 0.0, r: 1.1 },
];

function clumpShape(c: Clump, i: number): Sdf {
  const main = sdf.ellipsoid([c.r * 1.05, c.r * 0.88, c.r * 1.02]).at(c.x, c.y, c.z);
  const lobes: Sdf[] = [];
  for (let j = 0; j < 2; j++) {
    const a = (j / 2) * Math.PI * 2 + noise.random(i, j, 1) * 1.7 + i;
    const lr = c.r * 0.42;
    lobes.push(sdf.ellipsoid([lr, lr * 0.8, lr]).at(c.x + Math.cos(a) * c.r * 0.85, c.y - c.r * 0.35, c.z + Math.sin(a) * c.r * 0.85));
  }
  return sdf.smoothUnion(0.08, main, ...lobes);
}

function nearestClump(x: number, y: number, z: number): Clump {
  let best = clumps[0]!;
  let bd = Infinity;
  for (const c of clumps) {
    const d = (x - c.x) ** 2 + (y - c.y) ** 2 + (z - c.z) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

export default defineAsset({
  name: 'ancient-tree',
  description: 'Huge chibi ancient oak: knuckled roots, hollow, vine loop, wide clumped canopy.',
  reference: 'bench/overnight/refs/p1-forest/ancient-tree-mock.jpg',
  detail: 0.014,
  texture: { size: 1024 },

  build(k) {
    const trunkCore = sdf.cone([0, 0, 0], [0, 3.2, 0], 0.9, 0.5);
    const branchDefs: [number, number][] = [[1.6, 0.6], [-1.6, 0.6], [0.2, -1.6]];
    const branches = branchDefs.map(([x, z]) => sdf.chain([[0, 2.8, 0, 0.42], [x * 0.5, 3.2, z * 0.5, 0.3], [x, 3.6, z, 0.15]], 0.1));
    const roots: Sdf[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3;
      const len = 1.8 + noise.random(i, 2, 5) * 0.6;
      const ca = Math.cos(a), sa = Math.sin(a);
      roots.push(
        sdf.chain(
          [
            [ca * 0.3, 0.75, sa * 0.3, 0.45],
            [ca * len * 0.25, 0.5, sa * len * 0.25, 0.4],
            [ca * len * 0.45, 0.42, sa * len * 0.45, 0.3],
            [ca * len * 0.7, 0.3, sa * len * 0.7, 0.26],
            [ca * len, 0.14, sa * len, 0.15],
          ],
          0.1,
        ),
      );
    }
    const hollowCut = sdf.box([0.55, 0.75, 0.5], 0.15).at(0, 0.95, 0.75);
    const groove = (x: number, y: number, z: number): number => Math.cos(Math.atan2(z, x) * 4 + y * 0.8);
    const wood = sdf
      .smoothUnion(0.08, trunkCore, ...branches)
      .smoothUnion(0.06, ...roots)
      .subtract(hollowCut)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .displace(0.04, (x, y, z) => noise.fbm(x * 1.2, y * 1.2, z * 1.2, 2, 31))
      .paintFn((x, y, z) => {
        const g = clamp01(-groove(x, y, z) * 0.5 + 0.5);
        const base = mixRgb(bark, barkDark, g * g * 0.8);
        const lit = mixRgb(base, barkLight, clamp01(groove(x, y, z)) * 0.4 + clamp01(1 - y / 0.6) * 0.3);
        return lit;
      });
    k.body('wood', wood, { color: '#8a5a35', roughness: 0.9, detail: 0.02, paintWeight: 2, maxTriangles: 4000, bump: (x, y, z) => 0.006 * groove(x, y, z) });

    k.body('hollow', sdf.box([0.5, 0.68, 0.3], 0.1).at(0, 0.95, 0.5), { color: '#1a1c20', roughness: 0.95, detail: 0.014, maxTriangles: 400 });

    const vine = sdf.union(sdf.torus(0.78, 0.14).rotateX(12).at(0, 1.5, 0), sdf.torus(0.7, 0.12).rotateX(-12).at(0, 1.7, -0.05)).paint(bark);
    k.body('vine', vine, { color: '#8a5a35', roughness: 0.9, detail: 0.02, maxTriangles: 1300 });

    const canopy = sdf
      .smoothUnion(0.12, ...clumps.map(clumpShape))
      .displace(0.03, (x, y, z) => noise.fbm(x * 2, y * 2, z * 2, 2, 5))
      .paintFn((x, y, z) => {
        const c = nearestClump(x, y, z);
        const local = clamp01(((y - c.y) / c.r) * 0.6 + 0.45);
        const global = clamp01((y - 2.8) / 2.4);
        const base = mixRgb(leafDark, leaf, smoothstep(0.2, 0.7, local));
        return mixRgb(base, leafLight, smoothstep(0.6, 0.95, local) * (0.4 + 0.6 * global));
      });
    k.body('canopy', canopy, { color: '#6fae43', roughness: 0.72, detail: 0.03, paintWeight: 3, maxTriangles: 3000 });
  },
});
