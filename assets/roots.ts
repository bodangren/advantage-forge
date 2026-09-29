import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Roots - Chibi Quest nature prop. 1.8 m wide, ~0.7 m tall, on y = 0, faces +Z.
 * One idea: a fat cut trunk stub gripped by twisted, knuckled roots that spread and dive.
 * Palette: bark #8a5a35 / #5f3d22 / #a9713c, cut #c9a06a rings #b5814a, moss #4a9a4f / #2f7a3f.
 * Bodies: bark (wood), moss. Static.
 */
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const BARK = rgb('#8a5a35');
const DARK = rgb('#5f3d22');
const LIGHT = rgb('#a9713c');
const CUT = rgb('#c9a06a');
const RING = rgb('#b5814a');
const M1 = rgb('#4a9a4f');
const M2 = rgb('#2f7a3f');
const TOP = 0.9;
const rad = (d: number): number => (d * Math.PI) / 180;

type P = [number, number, number, number];

export default defineAsset({
  name: 'roots',
  description: 'Big gnarled roots: a cut trunk stub with nine twisted roots, moss patches, on a dirt disc.',
  detail: 0.008,
  reference: 'bench/overnight/refs/p1-forest/roots-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const trunk = sdf.cone([0, 0, 0], [0, TOP + 0.05, 0], 0.55, 0.29);
    const parts: Sdf[] = [trunk];
    const dir = (a: number, r: number): [number, number] => [Math.cos(rad(a)) * r, Math.sin(rad(a)) * r];
    const angles = [5, 40, 90, 125, 170, 205, 250, 290, 322, 350];
    const forks = new Set([1, 4, 6, 8]);
    angles.forEach((a, i) => {
      const reach = 1.15 + 0.25 * ((i * 37) % 10) / 10;
      const pts: P[] = [];
      for (let j = 0; j < 5; j++) {
        const t = j / 4;
        const bend = a + (i % 2 ? 1 : -1) * Math.sin(t * 3.2 + i) * 16 + (i === 3 || i === 7 ? -t * 30 : 0);
        const r = j === 0 ? 0 : 0.25 + (reach - 0.25) * t;
        const y = j === 0 ? 0.45 : j === 4 ? 0.04 : 0.25 + 0.13 * Math.sin(t * 6.3 + i * 1.3);
        const rr = j === 0 ? 0.26 : 0.26 - 0.19 * t ** 0.8;
        const [dx, dz] = dir(bend, r);
        pts.push([dx, y, dz, rr]);
      }
      parts.push(sdf.chain(pts, 0.05));
      if (forks.has(i)) {
        const b0 = pts[2]!;
        const [ex, ez] = dir(a + (i % 2 ? 38 : -38), Math.hypot(b0[0], b0[2]) + 0.3);
        parts.push(sdf.chain([[b0[0], b0[1], b0[2], 0.075], [(b0[0] + ex) / 2, 0.08, (b0[2] + ez) / 2, 0.055], [ex, 0.03, ez, 0.035]], 0.03));
      }
    });
    let wood: Sdf = sdf.smoothUnion(0.1, ...parts);
    wood = wood.intersect(sdf.halfSpace([0, 1, 0], TOP)).round(0.008).intersect(sdf.halfSpace([0, 1, 0], TOP));
    wood = wood.intersect(sdf.halfSpace([0, -1, 0], 0));
    const groove = (x: number, y: number, z: number): number => Math.cos(Math.atan2(z, x) * 9) * 0.02;

    const paint = (x: number, y: number, z: number, _b: Rgb): Rgb => {
      const d = Math.hypot(x, z);
      if (y > TOP - 0.012 && d < 0.32) {
        const ring = 0.5 + 0.5 * Math.sin(d * 55 + noise.fbm(x * 8, 0, z * 8, 2) * 1.2);
        let c = mixRgb(CUT, RING, ring * 0.7);
        return mixRgb(c, DARK, clamp01((d - 0.25) / 0.05) * 0.85);
      }
      const g = noise.fbm(x * 9, y * 4, z * 9, 3);
      let c = mixRgb(BARK, DARK, clamp01(-g * 1.6) * 0.8 + 0.15);
      c = mixRgb(c, LIGHT, clamp01(g * 1.6) * 0.3 + clamp01((y - 0.12) / 0.06) * 0.45);
      return mixRgb(c, DARK, clamp01((0.06 - y) / 0.06) * 0.5);
    };
    k.body('bark', wood.paintFn(paint), {
      color: '#8a5a35',
      roughness: 0.9,
      detail: 0.008,
      textureDensity: 1.5,
      maxTriangles: 3400,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 30, y * 6, z * 30, 2) + groove(x, y, z) * 0.3,
    });

    // moss patches on the stub and roots
    const spots: [number, number][] = [[0.12, 0.05], [-0.15, -0.12], [0.75, 0.45], [-0.45, -0.55]];
    const patches = spots.map(([x, z], i) => {
      const p = sdf.raycast(wood, [x, 1.2, z], [0, -1, 0]) ?? [x, 0.05, z];
      return sdf.ellipsoid([0.22, 0.08, 0.16]).rotateY(i * 50).at(p[0], p[1] - 0.005, p[2]);
    });
    const moss = sdf
      .smoothUnion(0.03, ...patches)
      .displace(0.01, (x, y, z) => noise.fbm(x * 14, y * 14, z * 14, 2))
      .paintFn((x, y, z, _b: Rgb) => mixRgb(M2, M1, clamp01(0.5 + noise.fbm(x * 12, y * 12, z * 12, 2) * 1.2)));
    k.body('moss', moss, { color: '#4a9a4f', roughness: 1, detail: 0.008, maxTriangles: 900,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 30, y * 30, z * 30, 2) });
  },
});
