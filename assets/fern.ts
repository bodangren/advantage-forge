import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Fern — forest dressing (catalog `forest/dressing/fern`): 0.54 m tall, 0.68 m wide,
 * standing on y = 0 and facing +Z. No rig, no clips.
 *
 * - Role: forest-floor set dressing; must read as a fern at the 128 px sprite size, also from above.
 * - One idea: eight arching pinnate fronds from one crown; each has a thin rachis and 16 pairs
 *   of flat leaflets that shrink toward the tip, so the plant reads feathery from every side.
 * - Shape language: soft and round overall (arching fan), pointed leaflets as the secondary accent.
 * - Palette: green #3f8a2e body, lighter tips #7cbf45, soil #3a2a1c.
 *   Value plan: dark soil, mid frond bases, light tips.
 * - Materials: matte foliage (roughness 0.75), fiddleheads, dark soil tuft.
 * - Detail: (1) eight fronds, (2) 32 leaflets per frond via helper, (3) two fiddleheads,
 *   (4) soil tuft; fine bump on leaflets. Focal point: the light arching tips.
 */

const DEG0 = Math.PI / 180;
type P3 = [number, number, number];

/** One frond: rachis arcs out (+X) and up (+Y), leaflets on both sides, then turned to azimuth. */
const buildFrond = (len: number, start: number, end: number, az: number, pw: number): Sdf => {
  const N = 40;
  const pts: { p: P3; h: number }[] = [];
  let x = 0.035;
  let y = 0.04;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const h = (start + (end - start) * Math.pow(s, pw)) * DEG0;
    pts.push({ p: [x, y, 0], h });
    x += Math.cos(h) * (len / N);
    y += Math.sin(h) * (len / N);
  }
  const at = (s: number) => pts[Math.min(N, Math.round(s * N))]!;
  const rach = sdf.chain(
    [0, 0.25, 0.5, 0.75, 1].map((s, i) => {
      const q = at(s).p;
      return [q[0], q[1], 0, 0.009 - i * 0.0012] as [number, number, number, number];
    }),
    0.01,
  );
  const leaves: Sdf[] = [];
  const PAIRS = 16;
  for (let i = 0; i < PAIRS; i++) {
    const u = i / (PAIRS - 1);
    const s = 0.12 + 0.86 * (1 - Math.pow(1 - u, 1.4)); // denser toward the tip
    const { p, h } = at(s);
    const L = 0.06 - 0.035 * Math.pow(u, 0.9);
    const wd = Math.max(0.0085, L / 6);
    for (const side of [1, -1]) {
      const yaw = 48 * side;
      const dx = Math.cos(yaw * DEG0);
      const dz = -Math.sin(yaw * DEG0);
      leaves.push(
        sdf
          .ellipsoid([L / 2, 0.0065, wd])
          .rotateY(yaw)
          .rotateZ(h / DEG0 - 14)
          .at(p[0] + dx * L * 0.48 * Math.cos(h), p[1] + dx * L * 0.48 * Math.sin(h) - 0.004, p[2] + dz * L * 0.48),
      );
    }
  }
  const tip = at(1);
  leaves.push(sdf.ellipsoid([0.02, 0.0065, 0.009]).rotateZ(tip.h / DEG0).at(tip.p[0] + 0.012, tip.p[1] + 0.003, 0));
  return sdf.smoothUnion(0.006, rach, ...leaves).rotateY(az - 90);
};

export default defineAsset({
  name: 'fern',
  description: 'A forest fern: eight arching pinnate fronds with paired leaflets and two fiddleheads over a dark soil tuft.',
  detail: 0.006,
  texture: { size: 1024 },

  build(k) {
    const soil = sdf
      .ellipsoid([0.1, 0.05, 0.1])
      .at(0, 0.02, 0)
      .displace(0.008, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('soil', soil, { color: '#3a2a1c', roughness: 0.95, detail: 0.012, maxTriangles: 400 });

    const specs: [number, number, number, number, number][] = [
      [0.46, 66, -55, 10, 3.2],
      [0.42, 64, -72, 55, 2.8],
      [0.42, 62, -72, 100, 2.6],
      [0.45, 66, -55, 150, 3.2],
      [0.42, 64, -72, 200, 2.8],
      [0.34, 52, -62, 250, 2],
      [0.42, 62, -72, 300, 2.6],
      [0.33, 50, -60, 345, 2],
    ];
    const fronds = sdf.union(...specs.map(([l, a, b, az, pw]) => buildFrond(l, a, b, az, pw)));
    const paint = (x: number, y: number, z: number, _b: Rgb): Rgb => {
      const r = Math.hypot(x, z);
      const t = Math.min(1, Math.max(0, (r - 0.06) / 0.28));
      const v = 0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 2);
      let c = mixRgb(rgb('#2f6e24'), rgb('#3f8a2e'), 0.35 + 0.65 * v);
      c = mixRgb(c, rgb('#7cbf45'), Math.pow(t, 1.5) * 0.85);
      return c;
    };
    k.body('fronds', fronds.paintFn(paint), {
      color: '#3f8a2e',
      roughness: 0.75,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 9000,
      bump: (x, y, z) => 0.0015 * noise.noise3(x * 90, y * 40, z * 90),
    });

    const curl = (az: number, sc: number) => {
      const pts: [number, number, number, number][] = [];
      for (let i = 0; i <= 7; i++) {
        const a = -0.3 + i * 0.62;
        const rr = (0.05 - i * 0.004) * sc;
        pts.push([0.02 + Math.sin(a) * rr * 0.6 + i * 0.002, 0.05 + i * 0.03 * sc * (i < 4 ? 1 : 0.4) + (1 - Math.cos(a)) * rr * 0.3, 0, 0.017 - i * 0.0013]);
      }
      return sdf.chain(pts, 0.01).rotateY(az - 90);
    };
    k.body('fiddleheads', sdf.union(curl(120, 1), curl(240, 0.8)), {
      color: '#6fb23d',
      roughness: 0.7,
      detail: 0.006,
      maxTriangles: 600,
    });
  },
});
