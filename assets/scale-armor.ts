import { defineAsset, mixRgb, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note: scale armor shirt (equipment/armor/scale-armor). Item icon, 0.7 m tall, 0.55 m wide,
 * hem on y = 0, front toward +Z, no body. One idea: a chunky bronze-green scale cuirass under fat
 * grey pauldrons. Round dominant, scalloped rows secondary. Palette: scale #6f7f5a / #8c9c74 /
 * #4a5a3c, iron #7c828a, leather #8a5a35 / #5c3a22, gold #d4a93a accent.
 */
const SCALE = rgb('#6f7f5a');
const LIT = rgb('#8c9c74');
const DARK = rgb('#4a5a3c');
const IRON = rgb('#7c828a');
const LEATHER = rgb('#8a5a35');
const BELT = rgb('#5c3a22');
const GOLD = rgb('#d4a93a');

const ROWS = 7;
const Y0 = 0.04;
const Y1 = 0.6;
const RH = (Y1 - Y0) / ROWS;

export default defineAsset({
  name: 'scale-armor',
  description: 'Chunky bronze-green scale cuirass with iron pauldrons, leather collar and belt, gold trim.',
  detail: 0.005,
  reference: 'bench/overnight/refs/p1-gear/scale-armor-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.62],
            [0.13, 0.62],
            [0.22, 0.56],
            [0.3, 0.45],
            [0.28, 0.32],
            [0.27, 0.2],
            [0.3, 0.05],
            [0.3, 0],
            [0, 0],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.75]);
    // neck opening
    const neck = sdf.cylinder(0.13, 0.2, 0.01).scale([1, 1, 0.75]).at(0, 0.72, 0);
    const shell = torso.smoothSubtract(0.01, neck);

    const scaled = shell.paintFn((x, y, z, base) => {
      const row = Math.floor((y - Y0) / RH);
      if (row < 0 || row >= ROWS) return mixRgb(base, DARK, 0.3);
      const across = 0.07 * 1.0;
      const th = Math.atan2(x, z) * 0.28; // arc-length at ~0.24 m radius
      const u = th / across + (row % 2) * 0.5;
      const fx = u - Math.floor(u) - 0.5;
      const fy = (y - Y0) / RH - row; // 0 bottom .. 1 top
      // scallop: bottom edge curved downward at center
      const edge = fy - 0.25 * (1 - 4 * fx * fx) * 0.0 - 0.3 * (fx * fx * 4);
      const rim = Math.abs(fx) > 0.44 || fy < 0.1 + 0.3 * fx * fx * 4 * 0.5 ? 1 : 0;
      let c = mixRgb(base, LIT, Math.max(0, Math.min(1, fy)) * 0.6);
      if (rim || edge < 0) c = mixRgb(c, DARK, 0.75);
      return c;
    });
    k.body(
      'scales',
      scaled.displace(0.004, (_x, y) => Math.cos(((y - Y0) / RH) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5),
      { color: SCALE, roughness: 0.5, metalness: 0.6, detail: 0.005, textureDensity: 2, maxTriangles: 3300 },
    );

    // pauldrons: two stacked plates each
    const dome = sdf
      .ellipsoid([0.25, 0.16, 0.22])
      .smoothIntersect(0.005, sdf.box([0.7, 0.4, 0.7]).at(0, 0.2, 0));
    const cap = sdf.ellipsoid([0.18, 0.1, 0.16]).at(0.04, 0.1, 0);
    const rivet = sdf.sphere(0.03).at(0.1, 0.19, 0.12);
    const pauldron = dome
      .smoothUnion(0.01, cap)
      .smoothUnion(0.01, rivet)
      .rotateZ(-20)
      .at(0.27, 0.4, 0);
    k.body('iron', pauldron.mirror('x', 0), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      maxTriangles: 1300,
    });

    // raised iron collar with a shield plate (iron body)
    const collar = sdf.torus(0.15, 0.035).scale([1, 1, 0.75]).at(0, 0.62, 0);
    const plate = sdf
      .extrude(profile.polygon([[-0.05, 0.07], [0.05, 0.07], [0.05, -0.01], [0, -0.07], [-0.05, -0.01]]), 0.03, 0.006)
      .at(0, 0.5, 0.19);
    k.body('collar', sdf.union(collar, plate), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      maxTriangles: 700,
    });

    // belt
    const belt = shell
      .round(0.006)
      .smoothIntersect(0.005, sdf.box([0.8, 0.06, 0.7], 0.01).at(0, 0.12, 0));
    k.body('leather', belt, {
      color: BELT,
      roughness: 0.65,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 700,
    });

    // gold trim, buckle, emblem
    const hemY = 0.035;
    const trim = sdf.torus(0.31, 0.02).scale([1, 1, 0.75]).at(0, hemY, 0);
    const buckle = sdf.box([0.08, 0.06, 0.02], 0.008).at(0, 0.12, 0.225);
    const emblem = sdf
      .extrude(profile.polygon([[0, 0.05], [0.032, 0], [0, -0.05], [-0.032, 0]]), 0.02, 0.004)
      .at(0, 0.51, 0.205);
    k.body('gold', sdf.union(trim, buckle, emblem), {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 700,
    });
  },
});
