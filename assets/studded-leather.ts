import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - studded leather vest (equipment/armor/studded-leather).
 * Role: equipment item icon, read at 128 px. Size 0.6 m tall, 0.5 m wide, hem on y = 0, front +Z.
 * One idea: an open leather vest with big brass studs and a dark lining showing in the gap.
 * Shape language: round and chunky, soft bevels. Palette: leather #a0623a, dark #6b4226, brass #d4a93a.
 * Materials: leather (0.65), lining (dark leather), brass studs (metal), laces, stitch paint.
 * Focal point: the brass studs. Static, no rig.
 */
const LEATHER = rgb('#a0623a');
const LIT = rgb('#b8784a');
const DARK = rgb('#6b4226');
const BRASS = rgb('#d4a93a');
const LACE = rgb('#5c3a22');
const STITCH = rgb('#3a2414');

const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const body = () =>
  sdf
    .revolve(
      profile.polygon(
        [
          [0, 0.64],
          [0.09, 0.64],
          [0.14, 0.636],
          [0.21, 0.576],
          [0.25, 0.496],
          [0.26, 0.376],
          [0.248, 0.276],
          [0.26, 0.196],
          [0.276, 0.096],
          [0.28, 0.026],
          [0.264, 0],
          [0, 0],
        ],
        { smooth: true, samples: 8 },
      ),
    )
    .scale([1, 1, 0.78]);

export default defineAsset({
  name: 'studded-leather',
  description: 'Open brown leather vest with brass studs, stand-up collar, shoulder caps, and side laces.',
  detail: 0.005,
  reference: 'bench/overnight/refs/p1-gear/studded-leather-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const cut = sdf.box([0.06, 0.8, 0.5], 0.008).at(0, 0.3, 0.25);
    const collar = sdf.torus(0.14, 0.02).scale([1, 2.0, 0.78]).at(0, 0.63, 0);
    const outer = sdf
      .union(body(), collar)
      .smoothSubtract(0.006, cut, sdf.box([0.5, 0.05, 0.5]).at(0, 0.61, 0).scale(0.0001))
      .round(0.004);
    // Stitch lines along the panel edges and hem.
    const paint = (x: number, y: number, z: number, base: typeof LEATHER) => {
      let c = mixRgb(base, LIT, 0.35 * ss(0.3, 0.55, y) * (0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2)));
      c = mixRgb(c, DARK, 0.5 * ss(0.21, 0.27, Math.abs(x)));
      if (z > 0.04) {
        const dash = Math.sin((y * Math.PI * 2) / 0.02) > -0.2;
        const ax = Math.abs(x);
        if (dash && Math.abs(ax - 0.05) < 0.0035 && y > 0.08 && y < 0.52) c = mixRgb(c, STITCH, 0.9);
        const dashx = Math.sin((x * Math.PI * 2) / 0.02) > -0.2;
        if (dashx && Math.abs(y - 0.05) < 0.0035 && ax > 0.05) c = mixRgb(c, STITCH, 0.9);
      }
      return c;
    };
    k.body('leather', outer.paintFn(paint), {
      color: LEATHER,
      roughness: 0.65,
      metalness: 0,
      detail: 0.005,
      textureDensity: 2,
      maxTriangles: 3000,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 36, y * 36, z * 36, 2),
    });
    k.body('lining', body().scale(0.97), {
      color: DARK,
      roughness: 0.75,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 800,
    });

    // Studs: probe the leather surface, then sit each stud proud of it.
    const studs: ReturnType<typeof sdf.sphere>[] = [];
    const stud = (from: [number, number, number], dir: [number, number, number]) => {
      const h = sdf.raycast(outer, from, dir);
      if (!h) return;
      const n = Math.hypot(...dir);
      studs.push(
        sdf.sphere(0.025).scale([1, 1, 0.7]).at(h[0] - (dir[0] / n) * 0.006, h[1] - (dir[1] / n) * 0.006, h[2] - (dir[2] / n) * 0.006),
      );
    };
    for (const sx of [1, -1]) {
      for (const [x, y] of [[0.075, 0.15], [0.075, 0.35], [0.14, 0.3], [0.14, 0.5]]) stud([x * sx, y, 0.6], [0, 0, -1]);
    }
    k.body('studs', sdf.union(...studs), {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 900,
    });

    // Side laces: a zigzag chain down each flank.
    const pts = (sx: number) => {
      const out: [number, number, number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const y = 0.45 - i * 0.043;
        const off = i % 2 ? 0.02 : -0.02;
        const h = sdf.raycast(outer, [0.6 * sx, y, off], [-sx, 0, 0]);
        out.push([(h ? h[0] : 0.22 * sx) - 0.004 * sx, y, off, 0.007]);
      }
      return out;
    };
    const lace = (sx: number) => sdf.chain(pts(sx), 0.004);
    k.body('laces', lace(1).union(lace(-1)), {
      color: LACE,
      roughness: 0.8,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 400,
    });
  },
});
