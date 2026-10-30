import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 butterfly net, a child-sized picture prop.
 * Role: a green butterfly net that a five-year-old can hold up, readable as an icon.
 * Size: about 0.90 m tall with a 0.32 m hoop, standing on y = 0 and facing +Z.
 * One idea: a light wooden handle below a large green hoop and a deep soft cloth bag.
 * Shape language: one long rounded handle, one bold circle, one deep round-bottomed bag.
 * Palette: pale wood #d8b67e, hoop #5ea66d, net #8fca83, dark grain #a87c48.
 * Materials: satin wood, matte painted hoop, soft green cloth with a painted weave.
 * Detail: green wrapped grip, thick hoop, soft opaque bag with a painted diamond weave.
 * Rig/animation: none; the hoop faces +Z and the bag hangs back (-Z) and down.
 */

const WOOD = rgb('#d8b67e');
const GRIP = rgb('#5ea66d');
const GRIP_DARK = rgb('#4a8c58');
const CLOTH = rgb('#a6d98f');
const WEAVE = rgb('#78b86c');

export default defineAsset({
  name: 'storytime-butterfly-net',
  description: 'A child-sized butterfly net with a pale wooden handle, green wrapped grip, green hoop, and deep soft green bag.',
  detail: 0.002,
  texture: { size: 1024 },

  build(k) {
    const handle = sdf
      .capsule([0, 0.014, 0], [0, 0.585, 0], 0.014)
      .smoothUnion(0.01, sdf.cylinder(0.0185, 0.27, 0.008).at(0, 0.17, 0))
      .smoothUnion(0.006, sdf.sphere(0.0215).at(0, 0.585, 0))
      .paintFn((x, y, _z, base) => {
        if (y > 0.04 && y < 0.305) {
          const ring = Math.sin(y * 330) > 0.35 ? 1 : 0;
          return mixRgb(GRIP, GRIP_DARK, ring * 0.9);
        }
        if (y > 0.56) return GRIP;
        return base;
      });
    k.body('wooden-handle', handle, {
      color: WOOD,
      roughness: 0.8,
      detail: 0.0018,
      maxTriangles: 5000,
    });

    const hoop = sdf.torus(0.155, 0.009).rotateX(90).at(0, 0.735, 0);
    k.body('green-hoop', hoop, {
      color: '#5ea66d',
      roughness: 0.7,
      detail: 0.0018,
      maxTriangles: 4500,
    });

    // The bag hangs back and down from the hoop and ends in a round bottom.
    const spine = (t: number): [number, number, number, number] => [
      0,
      0.735 - 0.2 * Math.pow(t, 1.6),
      -0.006 - 0.29 * t,
      0.152 * (1 - 0.62 * Math.pow(t, 1.5)),
    ];
    const outerPts: [number, number, number, number][] = [];
    const innerPts: [number, number, number, number][] = [];
    for (let j = 0; j <= 10; j++) {
      const s = spine(j / 10);
      outerPts.push(s);
      innerPts.push([s[0], s[1], s[2], s[3] - 0.0045]);
    }
    const outer = sdf.chain(outerPts, 0.03);
    const inner = sdf.chain(innerPts, 0.03);
    const open = sdf.box([0.6, 0.8, 0.8]).at(0, 0.7, -0.404);
    const bag = outer
      .subtract(inner)
      .intersect(open)
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(y - (0.735 - 0.2 * Math.pow(Math.min(1, -z / 0.3), 1.6)), x);
        const u = (a / (Math.PI * 2)) * 26;
        const v = z * 26;
        const d1 = Math.abs(((u + v) % 1 + 1) % 1 - 0.5);
        const d2 = Math.abs(((u - v) % 1 + 1) % 1 - 0.5);
        const line = Math.max(d1, d2) > 0.42 ? 1 : 0;
        return mixRgb(base, WEAVE, line * 0.9);
      });
    k.body('green-net-bag', bag, {
      color: CLOTH,
      roughness: 0.95,
      detail: 0.0022,
      maxTriangles: 14000,
    });
  },
});
