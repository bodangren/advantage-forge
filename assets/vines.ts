import { defineAsset, noise, rgb, mixRgb, sdf } from '../src/index.js';

/**
 * Hanging vines (nature/plants/vines): 1.0 m wide, 1.5 m tall, 0.35 m deep, on y = 0, facing +Z.
 * Role: background decoration hanging against a wall. One idea: chunky leafy strands with curls.
 * Shape language: round, soft. Palette: leaves #8ad45a #5cb85c #4a9c3f; vines #6a9a3a; branch #6b4a2e;
 * moss #4a9a4f; flowers #9a6ac8 / #e0bb60.
 * Materials: leaves, vines, branch, moss, petals, centers.
 */
const bx = (i: number) => -0.45 + 0.9 * (i / 5);
const by = (x: number) => 1.5 - 0.02 * ((x + 0.55) / 1.1);
// per vine: x drift phase, z phase, bottom y, curl?
const cfg = [
  { bot: 0.05, curl: true, dz: 1, dx: 1 },
  { bot: 0.3, curl: false, dz: -1, dx: -1 },
  { bot: 0.12, curl: true, dz: 1, dx: -1 },
  { bot: 0.38, curl: false, dz: -1, dx: 1 },
  { bot: 0.05, curl: true, dz: 1, dx: 1 },
  { bot: 0.25, curl: false, dz: -1, dx: -1 },
];
type P = [number, number, number];
const strands = cfg.map((c, i) => {
  const x0 = bx(i);
  const y0 = by(x0) - 0.02;
  const pts: P[] = [];
  const N = 9;
  for (let j = 0; j <= N; j++) {
    const u = j / N;
    const y = y0 + (c.bot - y0) * u;
    pts.push([x0 + c.dx * 0.12 * Math.sin(u * Math.PI * 2), y, 0.1 * c.dz * Math.sin(u * Math.PI * 2 + 0.6) * 0.8 + 0.04]);
  }
  if (c.curl) {
    const [x, y, z] = pts[N];
    const s = -c.dx;
    pts.push([x + s * 0.05, y + 0.02, z], [x + s * 0.09, y + 0.07, z], [x + s * 0.05, y + 0.12, z], [x + s * 0.01, y + 0.09, z]);
  }
  return pts;
});
const radAt = (u: number) => 0.02 - 0.008 * u;
const vineShape = sdf.union(
  ...strands.map((p) => sdf.chain(p.map(([x, y, z], j) => [x, y, z, radAt(Math.min(1, j / 9)) * (j > 9 ? 0.75 : 1)]), 0.01)),
);
const branchPts = [-0.55, -0.3, 0, 0.3, 0.55].map((x, i): [number, number, number, number] => [
  x, 1.5 - 0.02 * ((x + 0.55) / 1.1) + 0.012 * Math.sin(i * 2), 0.03, 0.05 - 0.01 * (i / 4),
]);
const branch = sdf.chain(branchPts, 0.02);
const moss = sdf.smoothUnion(
  0.02,
  sdf.ellipsoid([0.14, 0.05, 0.08]).at(-0.3, 1.54, 0.03),
  sdf.ellipsoid([0.12, 0.045, 0.075]).at(0.05, 1.54, 0.03),
  sdf.ellipsoid([0.1, 0.045, 0.07]).at(0.38, 1.52, 0.03),
);

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
    .scale([1, 1, 0.3]);
};

const leaves: any[] = [];
const rnd = (a: number, b: number) => noise.random(a, b, 7);
let flowers: [number, number, number][] = [];
strands.forEach((p, i) => {
  const M = 6;
  for (let j = 0; j < M; j++) {
    const f = ((j + 0.7) / (M + 0.4)) * 9;
    const a = Math.floor(f);
    const u = f - a;
    const x = p[a][0] + (p[a + 1][0] - p[a][0]) * u;
    const y = p[a][1] + (p[a + 1][1] - p[a][1]) * u;
    const z = p[a][2] + (p[a + 1][2] - p[a][2]) * u;
    const side = j % 2 ? 1 : -1;
    const s = 0.17 * (0.9 + 0.2 * rnd(i, j));
    const lf = leaf(s)
      .scale(1.0)
      .rotateZ(side * (115 + 25 * rnd(i, j + 9))) // hang outward-down
      .rotateY(side * (8 + 12 * rnd(i, j + 3)))
      .at(x + side * 0.03, y, z + 0.015 + 0.02 * rnd(i, j + 5));
    leaves.push(lf);
  }
  if (i === 1 || i === 3 || i === 5) {
    flowers.push([p[6][0], p[6][1], p[6][2] + 0.03], [p[8][0], p[8][1], p[8][2] + 0.03]);
  }
  if (i === 5) flowers.push([p[4][0], p[4][1], p[4][2] + 0.03]);
});
const light = rgb('#8ad45a');
const mid = rgb('#4a9c3f');
const base = rgb('#5cb85c');
const foliage = sdf.union(...leaves);
const petals = sdf.union(
  ...flowers.flatMap(([x, y, z]) =>
    [0, 1, 2, 3, 4].map((k) => {
      const a = (k / 5) * Math.PI * 2;
      return sdf.sphere(0.022).at(x + 0.03 * Math.cos(a), y + 0.03 * Math.sin(a), z);
    }),
  ),
);
const centers = sdf.union(...flowers.map(([x, y, z]) => sdf.sphere(0.02).at(x, y, z + 0.012)));

export default defineAsset({
  name: 'vines',
  detail: 0.008,
  reference: 'bench/overnight/refs/p1-forest/vines-mock.jpg',
  texture: { size: 1024 },
  build(k) {
    k.body(
      'leaves',
      foliage.paintFn((x, y) => {
        const v = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, 1.3, 2);
        const c = mixRgb(mid, light, Math.max(0, Math.min(1, v * 0.6 + 0.4 * (y / 1.5))));
        return mixRgb(c, base, 0.25);
      }),
      { color: base, roughness: 0.75, detail: 0.008, maxTriangles: 2000 },
    );
    k.body('vines', vineShape.paintFn(() => rgb('#6a9a3a')), { color: rgb('#6a9a3a'), roughness: 0.9, detail: 0.008, maxTriangles: 700 });
    k.body('branch', branch.paintFn(() => rgb('#6b4a2e')), { color: rgb('#6b4a2e'), roughness: 0.9, detail: 0.008, maxTriangles: 300 });
    k.body('moss', moss.paintFn(() => rgb('#4a9a4f')), { color: rgb('#4a9a4f'), roughness: 0.95, detail: 0.008, maxTriangles: 300 });
    k.body('petals', petals.paintFn(() => rgb('#9a6ac8')), { color: rgb('#9a6ac8'), roughness: 0.7, detail: 0.006, maxTriangles: 400 });
    k.body('centers', centers.paintFn(() => rgb('#e0bb60')), { color: rgb('#e0bb60'), roughness: 0.7, detail: 0.006, maxTriangles: 150 });
  },
});
