import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 butterfly net, a child-sized picture prop.
 * Role: a green butterfly net that a five-year-old can hold up, readable as an icon.
 * Size: about 0.90 m tall with a 0.32 m hoop, standing on y = 0 and facing +Z.
 * One idea: a light wooden handle below a large green hoop and a deep open mesh bag.
 * Shape language: one long rounded handle, one bold circle, soft tapered mesh.
 * Palette: pale wood #d8b67e, hoop #5ea66d, net #8fca83, dark grain #a87c48.
 * Materials: satin wood, matte painted hoop, rough green woven cord.
 * Detail: rounded grip, thick hoop, sixteen lengthwise cords and five crosswise cords.
 * Rig/animation: none; the hoop faces +Z and the bag extends toward -Z.
 */

const WOOD = rgb('#d8b67e');
const GRAIN = rgb('#a87c48');

export default defineAsset({
  name: 'storytime-butterfly-net',
  description: 'A child-sized butterfly net with a pale wooden handle, green hoop, and deep green mesh bag.',
  detail: 0.002,
  texture: { size: 1024 },

  build(k) {
    const handle = sdf.capsule([0, 0.014, 0], [0, 0.58, 0], 0.014).paintFn((x, y, z, base) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 90, y * 14, z * 90, 2);
      return mixRgb(base, GRAIN, 0.08 + 0.13 * grain);
    });
    k.body('wooden-handle', handle, {
      color: WOOD,
      roughness: 0.8,
      detail: 0.0018,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 100, y * 16, z * 100, 2),
      maxTriangles: 3000,
    });

    const hoop = sdf
      .torus(0.155, 0.009)
      .rotateX(90)
      .at(0, 0.735, 0)
      .smoothUnion(0.006, sdf.sphere(0.018).at(0, 0.578, 0));
    k.body('green-hoop', hoop, {
      color: '#5ea66d',
      roughness: 0.7,
      detail: 0.0018,
      maxTriangles: 4500,
    });

    const section = (t: number) => ({
      r: 0.151 * Math.pow(1 - t, 0.78) + 0.003,
      y: 0.735 - 0.085 * t * t,
      z: -0.006 - 0.224 * t,
    });
    const cords: sdf.Shape[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const points: [number, number, number, number][] = [];
      for (let j = 0; j <= 6; j++) {
        const s = section(j / 6);
        points.push([s.r * Math.cos(a), s.y + s.r * Math.sin(a), s.z, 0.0024]);
      }
      cords.push(sdf.chain(points, 0.0007));
    }
    for (const t of [0.18, 0.36, 0.55, 0.73, 0.88]) {
      const s = section(t);
      cords.push(sdf.torus(s.r, 0.0023).rotateX(90).at(0, s.y, s.z));
    }
    cords.push(sdf.sphere(0.005).at(0, section(1).y, section(1).z));
    k.body('green-net-bag', sdf.union(...cords), {
      color: '#8fca83',
      roughness: 0.9,
      detail: 0.0015,
      maxTriangles: 14000,
    });
  },
});
