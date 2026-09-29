import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - fur-trimmed mantle (equipment/armor/mantle).
 * Role: hero gear icon / 128 px sprite. Size: 0.5 m wide, hem on y = 0, collar top ~0.48 m.
 * One idea: a chunky red capelet under a fat cream fur ring with a gold clasp.
 * Shape language: round and soft. Palette: red #c8423a, dark #8e2a25, light #da6248,
 * fur #efe4cc / #d9ccb0, gold #d4a93a. Materials: cloth, fur, gold.
 * Focal point: gold clasp below the collar front.
 */
const RED = rgb('#c8423a');
const RED_DEEP = rgb('#8e2a25');
const RED_LIGHT = rgb('#da6248');
const FUR = rgb('#efe4cc');
const FUR_SHADOW = rgb('#d9ccb0');

export default defineAsset({
  name: 'mantle',
  description: 'Short deep-red capelet with a fat cream fur collar and a gold clasp.',
  detail: 0.005,
  reference: 'bench/overnight/refs/p1-gear/mantle-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const prof = profile.polygon(
      [
        [0, 0.4],
        [0.11, 0.4],
        [0.135, 0.36],
        [0.17, 0.27],
        [0.21, 0.15],
        [0.24, 0.05],
        [0.25, 0.0],
        [0, 0.0],
      ],
      { smooth: false },
    );
    const fold = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const lower = Math.min(1, Math.max(0, (0.38 - y) / 0.3));
      return Math.cos(a * 6 + 0.5) * (0.3 + 0.7 * lower);
    };
    const wedge = sdf
      .extrude(
        profile.polygon([
          [0, 0.34],
          [0.025, -0.01],
          [-0.025, -0.01],
        ]),
        0.2,
      )
      .at(0, 0, 0.2);
    const cloth = sdf
      .revolve(prof)
      .scale([1, 1, 0.85])
      .displace(0.014, fold, 1.4)
      .displace(0.005, (x, y, z) => Math.sin(Math.atan2(z, x) * 4) * Math.max(0, 0.08 - y) * 12, 1)
      .subtract(wedge);
    k.body(
      'cloth',
      cloth.paintFn((x, y, z) => {
        let c = mixRgb(RED, RED_LIGHT, 0.3 * Math.max(0, (y - 0.2) / 0.2));
        const f = fold(x, y, z);
        c = f > 0 ? mixRgb(c, RED_LIGHT, 0.4 * f) : mixRgb(c, RED_DEEP, 0.5 * -f);
        return mixRgb(c, RED_DEEP, 0.3 * Math.min(1, Math.max(0, (0.1 - y) / 0.1)));
      }),
      {
        color: '#c8423a',
        roughness: 0.88,
        detail: 0.005,
        paintWeight: 2,
        maxTriangles: 2000,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 2),
      },
    );

    const ring = sdf.torus(0.13, 0.06).scale([1, 1, 0.85]).at(0, 0.42, 0);
    const lobe = sdf.ellipsoid([0.06, 0.035, 0.045]);
    const lobes = sdf.union(lobe.at(0.08, 0.435, 0.11), lobe.at(-0.08, 0.435, 0.11));
    const fur = ring
      .smoothUnion(0.03, lobes)
      .displace(0.004, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2), 1.1);
    k.body(
      'fur',
      fur.paintFn((x, y, z) => mixRgb(FUR, FUR_SHADOW, Math.min(1, Math.max(0, (0.44 - y) / 0.08)) * 0.8)),
      {
        color: '#efe4cc',
        roughness: 1,
        detail: 0.005,
        maxTriangles: 1200,
        bump: (x, y, z) => 0.003 * noise.fbm(x * 90, y * 90, z * 90, 2),
      },
    );

    const clasp = sdf.box([0.06, 0.05, 0.04], 0.012).at(0, 0.335, 0.128);
    const button = sdf.sphere(0.014).scale([1, 1, 0.6]).at(0, 0.335, 0.146);
    k.body('clasp', sdf.smoothUnion(0.005, clasp, button), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 400,
    });
  },
});
