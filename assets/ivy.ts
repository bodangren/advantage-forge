import { defineAsset, noise, rgb, mixRgb, sdf } from '../src/index.js';

/**
 * Ivy patch (nature/plants/ivy): 1.2 m wide, 1.5 m tall, flat back at z = 0, on y = 0, facing +Z.
 * Role: background wall decoration. One idea: one smooth vine under dense clover-like leaves.
 * Shape language: round, soft. Palette: leaves #8ad45a #5cb85c #4a9c3f; stems #6b4a2e.
 * Materials: leaves (rough 0.75), stems (rough 0.9). Rig: none.
 */
const VZ = 0.03;
const main: number[][] = [
  [-0.1, 0.0, 0.035], [-0.17, 0.2, 0.032], [-0.1, 0.4, 0.029], [0.02, 0.6, 0.026],
  [0.03, 0.8, 0.023], [-0.07, 1.0, 0.02], [-0.13, 1.2, 0.018], [-0.06, 1.35, 0.016], [0.02, 1.45, 0.015],
];
// tendrils: start index on main vine, then offsets (dx, dy) from the start, ending in a curl
const tend: { from: number; pts: number[][] }[] = [
  { from: 1, pts: [[-0.12, 0.06], [-0.28, 0.12], [-0.4, 0.26], [-0.46, 0.4], [-0.4, 0.46], [-0.35, 0.4]] },
  { from: 2, pts: [[0.12, 0.05], [0.28, 0.1], [0.4, 0.2], [0.46, 0.34], [0.4, 0.4], [0.35, 0.34]] },
  { from: 4, pts: [[-0.12, 0.05], [-0.26, 0.1], [-0.38, 0.22], [-0.42, 0.36], [-0.35, 0.4], [-0.31, 0.34]] },
  { from: 5, pts: [[0.12, 0.05], [0.26, 0.1], [0.36, 0.22], [0.4, 0.36], [0.33, 0.4], [0.3, 0.34]] },
  { from: 6, pts: [[-0.1, 0.05], [-0.22, 0.1], [-0.3, 0.17], [-0.32, 0.24], [-0.26, 0.26]] },
];
const tendPts = tend.map((t) => {
  const s = main[t.from];
  return [[s[0], s[1], 0.012], ...t.pts.map(([dx, dy], i) => [s[0] + dx, s[1] + dy, 0.012 - 0.004 * ((i + 1) / t.pts.length)])].map(
    ([x, y, r]) => [x, y, VZ, r],
  );
});
const stems = sdf.union(
  sdf.chain(main.map(([x, y, r]) => [x, y, VZ, r]), 0.02),
  ...tendPts.map((p) => sdf.chain(p, 0.01)),
);

/** One lobed leaf: three lobes in a fan on top, one below, flattened; faces +Z. */
const leaf = (size: number) => {
  const r = 0.3 * size;
  return sdf
    .smoothUnion(
      0.12 * size,
      sdf.sphere(r).at(-0.36 * size, 0.3 * size, 0),
      sdf.sphere(r).at(0, 0.5 * size, 0),
      sdf.sphere(r).at(0.36 * size, 0.3 * size, 0),
      sdf.sphere(r * 0.9).at(0, -0.08 * size, 0),
    )
    .scale([1, 1, 0.15]);
};

// leaf centres: [x, y, size, spinDeg]
const pts: number[][] = [];
let n = 0;
const rnd = (a: number) => noise.random(n, a, 0);
const sizeAt = (y: number) => 0.3 - 0.08 * (y / 1.5);
// main vine: sample along the polyline, alternate sides
const sample = (poly: number[][], t: number) => {
  const f = t * (poly.length - 1);
  const i = Math.min(poly.length - 2, Math.floor(f));
  const u = f - i;
  return [poly[i][0] + (poly[i + 1][0] - poly[i][0]) * u, poly[i][1] + (poly[i + 1][1] - poly[i][1]) * u];
};
const NM = 20;
for (let i = 0; i < NM; i++) {
  n++;
  const [x, y] = sample(main, (i + 0.3) / NM);
  const side = i % 2 ? 1 : -1;
  const s = sizeAt(y) * (0.92 + 0.16 * rnd(1));
  pts.push([x + side * 0.1 * s / 0.2, y + 0.02, s, side * (18 + 25 * rnd(2)) + 12 * (rnd(3) - 0.5)]);
}
for (const tp of tendPts) {
  const poly = tp.map(([x, y]) => [x, y]);
  const cnt = tp.length > 5 ? 4 : 3;
  for (let j = 0; j < cnt; j++) {
    n++;
    const [x, y] = sample(poly, (j + 0.75) / (cnt + 0.4));
    const s = sizeAt(y) * (0.85 + 0.15 * rnd(1));
    pts.push([x, y + 0.03, s, 40 * (rnd(2) - 0.5) + 25 * (j % 2 ? 1 : -1)]);
  }
}
const leafShapes: any[] = pts.map(([x, y, s, spin], i) => {
  n = i + 100;
  const tilt = 4 + 8 * rnd(4);
  const dir = rnd(5) * 360;
  return leaf(s)
    .rotateZ(spin)
    .rotateX(tilt * Math.cos((dir * Math.PI) / 180))
    .rotateY(tilt * Math.sin((dir * Math.PI) / 180))
    .at(x, y, 0.03 + 0.05 * rnd(6));
});
// ground leaves spilling forward
const ground: number[][] = [
  [-0.3, 0.2, 0.24], [-0.12, 0.3, 0.22], [0.05, 0.22, 0.26], [0.22, 0.28, 0.21], [0.4, 0.14, 0.2], [-0.45, 0.1, 0.19],
];
for (let i = 0; i < ground.length; i++) {
  n = i + 300;
  const [x, z, s] = ground[i];
  leafShapes.push(leaf(s).rotateZ(60 * i + 40 * rnd(1)).rotateX(-90).at(x, 0.02 + 0.006 * rnd(2), z));
}
// z-depth ground leaves keep their flat face on +Y: rotateY applied before rotateX spins them in plane.

const light = rgb('#8ad45a');
const mid = rgb('#4a9c3f');
const base = rgb('#5cb85c');
const wallCut = sdf.box([1.4, 1.5, 0.6]).at(0, 0.75, 0.3);
const front = sdf.box([1.4, 1.5, 0.7]).at(0, 0.75, -0.14);
const sheet = sdf
  .union(...leafShapes)
  .intersect(sdf.union(wallCut, sdf.box([1.4, 0.1, 0.7]).at(0, 0.05, 0.35)))
  .intersect(front.union(sdf.box([1.4, 0.1, 0.7]).at(0, 0.05, 0.35)));

export default defineAsset({
  name: 'ivy',
  detail: 0.008,
  reference: 'bench/overnight/refs/p1-forest/ivy-mock.jpg',
  texture: { size: 1024 },
  build(k) {
    k.body(
      'leaves',
      sheet.paintFn((x, y) => {
        const v = 0.5 + 0.5 * noise.fbm(x * 3.5, y * 3.5, 1.3, 2);
        const c = mixRgb(light, mid, Math.max(0, Math.min(1, v)));
        return mixRgb(c, base, 0.3);
      }),
      { color: base, roughness: 0.75, detail: 0.008, maxTriangles: 4400 },
    );
    k.body('stems', stems.paintFn(() => rgb('#6b4a2e')), { color: rgb('#6b4a2e'), roughness: 0.9, detail: 0.012, maxTriangles: 1000 });
  },
});
