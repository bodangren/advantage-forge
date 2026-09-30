import { defineAsset, noise, rgb, mixRgb, sdf } from '../src/index.js';

/**
 * Giant crystal — nature/terrain prop, 2.0 m tall, stands on y = 0, largest crystal leans to +Z.
 * Reference: bench/overnight/refs/p1-dungeon/giant-crystal-mock.jpg.
 * One idea: five chunky hexagonal purple crystals glowing from inside on a small grey rock mound.
 * Shape language: triangular facets over a rounded rock. Palette: crystal #b060ff glow on #2a1040,
 * pale tips #d8a0ff, rock #6f7680 with #4b525c cracks, shards #8040c0.
 * Bodies: rock, crystals (emissive, flat), shards.
 */

const crystal = (h: number, w: number, capLen: number): sdf.Shape => {
  // Hexagonal prism (apothem w) of height h with a six-sided pointed cap, base at the origin.
  const H = h + capLen;
  const L = Math.hypot(capLen, w);
  let s: sdf.Shape = sdf.box([w * 3, H * 1.2, w * 3]).at(0, H * 0.5, 0).intersect(sdf.halfSpace([0, -1, 0], 0.12));
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * Math.PI * 2;
    const c = Math.cos(t), sn = Math.sin(t);
    s = s.intersect(sdf.halfSpace([c, 0, sn], w));
    s = s.intersect(sdf.halfSpace([(capLen / L) * c, w / L, (capLen / L) * sn], (w * H) / L));
  }
  return s;
};

// [height, apothem, leanDeg, headingDeg (0 = +Z, 90 = +X), x, z]
const SPEC: [number, number, number, number, number, number][] = [
  [1.65, 0.21, 8, 0, 0.0, -0.05],
  [1.3, 0.16, 20, 250, -0.1, -0.05],
  [1.15, 0.15, 18, 110, 0.12, -0.05],
  [0.9, 0.12, 22, 200, -0.05, -0.15],
  [0.6, 0.1, 25, 160, 0.05, -0.2],
  [1.1, 0.14, 20, 25, 0.15, 0.1],
  [0.8, 0.12, 22, 335, -0.15, 0.12],
];
const BASE_Y = 0.36;
const TIP = 0.8; // the top 20 percent of each crystal is the tip body

const place = (s: sdf.Shape, lean: number, head: number, x: number, z: number, y = BASE_Y) =>
  s.rotateX(lean).rotateY(head).at(x, y, z);

const nrm = (v: number[]) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((c) => c / l) as [number, number, number];
};

export default defineAsset({
  name: 'giant-crystal',
  description: 'A cluster of seven glowing purple hexagonal crystals with pink tips on an angular grey rock slab with pebbles.',
  detail: 0.012,
  reference: 'bench/overnight/refs/p1-dungeon/giant-crystal-mock.jpg',
  texture: { size: 1024 },
  build(k) {
    let cr: sdf.Shape | null = null;
    let tp: sdf.Shape | null = null;
    for (const [h, w, lean, head, x, z] of SPEC) {
      const cap = h * 0.22;
      const full = crystal(h - cap, w, cap);
      const cut = h * TIP;
      const lower = place(full.intersect(sdf.halfSpace([0, 1, 0], cut + 0.005)), lean, head, x, z);
      const upper = place(full.intersect(sdf.halfSpace([0, -1, 0], -cut)), lean, head, x, z);
      cr = cr ? cr.union(lower) : lower;
      tp = tp ? tp.union(upper) : upper;
    }
    const base = rgb('#3a1660'), mid = rgb('#8a3fe0');
    const crystals = cr!.paintFn((x, y) => {
      const t = Math.min(1, Math.max(0, (y - 0.4) / 1.4));
      return mixRgb(base, mid, t);
    });
    const tips = tp!.paint(rgb('#e8a0ff'));

    // Rock: angular slab with tilted cuts, two leaning chunks, five pebbles.
    let slab: sdf.Shape = sdf.box([1.6, 0.45, 1.2], 0.05);
    const cuts: [number[], number][] = [
      [[1, 0.9, 0.5], 0.78], [[-1, 0.7, 0.3], 0.8], [[0.3, 0.8, -1], 0.78], [[-0.4, 0.6, 1], 0.78],
    ];
    for (const [n, f] of cuts) {
      const u = nrm(n);
      const corner = Math.abs(u[0]) * 0.8 + Math.abs(u[1]) * 0.225 + Math.abs(u[2]) * 0.6;
      slab = slab.intersect(sdf.halfSpace(u, corner * f));
    }
    slab = slab.at(0, 0.225, 0);
    const chunk1 = sdf.box([0.5, 0.3, 0.4], 0.04).rotate(0, 30, 25).at(-0.75, 0.16, 0.45);
    const chunk2 = sdf.box([0.5, 0.3, 0.4], 0.04).rotate(0, -20, -30).at(0.78, 0.15, 0.4);
    const pebbles: [number, number, number, number][] = [
      [-0.95, 0.1, -0.2, 0.11], [0.9, 0.08, -0.35, 0.09], [0.35, 0.12, 0.85, 0.14],
      [-0.4, 0.09, 0.85, 0.1], [0.05, 0.1, -0.8, 0.12],
    ];
    let rk = slab.union(chunk1, chunk2);
    for (const [x, y, z, r] of pebbles) rk = rk.union(sdf.sphere(r).at(x, y, z));
    const shards = [[0.4, 0.42, 0.2, 18, 40], [-0.45, 0.42, 0.15, -20, 140], [0.15, 0.42, 0.42, 25, 250]]
      .map(([x, y, z, l, hd]) => place(crystal(0.16, 0.04, 0.08), l, hd, x, z, y))
      .reduce((a, b) => a.union(b));
    const rock = rk.paintFn((x, y) => mixRgb(rgb('#6a6e78'), rgb('#8a8e98'), Math.min(1, Math.max(0, (y - 0.12) / 0.2))));

    k.body('rock', rock, { color: '#8a8e98', roughness: 0.95, metalness: 0, detail: 0.016, flat: true, maxTriangles: 1200,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 30, z * 30, 3, 11) });
    k.body('crystals', crystals, { color: '#2a1040', roughness: 0.2, metalness: 0, detail: 0.012, flat: true,
      emissive: '#b060ff', emissiveIntensity: 1.5, opacity: 0.92, maxTriangles: 2000 });
    k.body('tips', tips, { color: '#7a3fb0', roughness: 0.2, metalness: 0, detail: 0.012, flat: true,
      emissive: '#e8a0ff', emissiveIntensity: 1.8, opacity: 0.92, maxTriangles: 900 });
    k.body('shards', shards, { color: '#8040c0', roughness: 0.2, metalness: 0, detail: 0.012, flat: true,
      emissive: '#8040c0', emissiveIntensity: 1.2, maxTriangles: 300 });
  },
});
