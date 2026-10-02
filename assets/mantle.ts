import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - fur-trimmed mantle (equipment/armor/mantle).
 * Role: hero gear icon / 128 px sprite. Size: 1.0 m wide at the hem (0.5 m hem radius), 0.65 m
 *   tall, standing on y = 0 (LIFT).
 * One idea: a chunky red capelet under a fat cream fur ring with a gold clasp.
 * Shape language: round and soft. Palette: red #c8423a, dark #8e2a25, light #da6248,
 * fur #efe4cc / #d9ccb0, gold #d4a93a. Materials: cloth, fur, gold.
 * Focal point: gold clasp below the collar front.
 * Fit (rework): a bell cape wall revolved round Y, flaring to a 0.5 m hem (about 1.35x the shoulder
 *   radius), open below, with a front V slit; the fur is a rolled ring open at the front with two lobes.
 *   The ring sits on the shoulders above the cloth (tube 0.085 m), not sunk in it, so it shows worn.
 *   The wall profile is smoothed: straight segments gave ring creases that read as stripes.
 *   The model frame has origin y 0.42 (model y = 2 * worn y - 0.52); the display adds LIFT.
 */
// The cloth is modeled with its hem at y -0.12; LIFT stands the display on y = 0 (the origin moves too).
const LIFT = 0.152;
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
  equip: { slot: 'back', fitScale: 2, origin: [0, 0.42 + LIFT, 0] },

  build(k) {
    // Bell cape: a thick wall (outer then inner curve) revolved round Y, open below, 1.35x flare.
    const outer: [number, number][] = [[0.16, 0.42], [0.25, 0.4], [0.34, 0.34], [0.43, 0.22], [0.48, 0.05], [0.5, -0.12]];
    const inner: [number, number][] = [[0.42, -0.12], [0.41, 0.05], [0.37, 0.2], [0.3, 0.31], [0.22, 0.37], [0.12, 0.39]];
    const fold = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const lower = Math.min(1, Math.max(0, (0.38 - y) / 0.4));
      return Math.cos(a * 7 + 0.5) * (0.2 + 0.8 * lower);
    };
    const slit = sdf
      .extrude(profile.polygon([[0, 0.25], [0.06, -0.14], [-0.06, -0.14]]), 0.5, 0.01)
      .at(0, 0, 0.35);
    const cloth = sdf
      .revolve(profile.polygon([...outer, ...inner], { smooth: true, samples: 8 }))
      .scale([1, 1, 0.8])
      .displace(0.008, fold, 1.4)
      .smoothSubtract(0.012, slit);
    k.body(
      'cloth',
      cloth.paintFn((x, y, z) => {
        let c = mixRgb(RED, RED_LIGHT, 0.3 * Math.max(0, (y - 0.2) / 0.2));
        const f = fold(x, y, z);
        c = f > 0 ? mixRgb(c, RED_LIGHT, 0.4 * f) : mixRgb(c, RED_DEEP, 0.5 * -f);
        return mixRgb(c, RED_DEEP, 0.3 * Math.min(1, Math.max(0, (0.1 - y) / 0.1)));
      }).at(0, LIFT, 0),
      {
        color: '#c8423a',
        roughness: 0.88,
        detail: 0.005,
        paintWeight: 2,
        maxTriangles: 2000,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 2),
      },
    );

    // The fur ring sits on the shoulders, above the cloth (not sunk in it), and rolls up toward the chin.
    const gapCut = sdf.box([0.12, 0.3, 0.2]).at(0, 0.42, 0.21);
    const ring0 = sdf.torus(0.2, 0.085).scale([1, 1, 0.82]).at(0, 0.415, 0);
    const ring = ring0.subtract(gapCut);
    const lobe = sdf.ellipsoid([0.075, 0.1, 0.055]);
    const lobes = sdf.union(lobe.at(0.1, 0.36, 0.24), lobe.at(-0.1, 0.36, 0.24));
    const fur = ring
      .smoothUnion(0.03, lobes)
      .displace(0.004, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2), 1.1);
    k.body(
      'fur',
      fur.paintFn((x, y, z) => mixRgb(FUR, FUR_SHADOW, Math.min(1, Math.max(0, (0.46 - y) / 0.1)) * 0.8)).at(0, LIFT, 0),
      {
        color: '#efe4cc',
        roughness: 1,
        detail: 0.005,
        maxTriangles: 1200,
        bump: (x, y, z) => 0.003 * noise.fbm(x * 90, y * 90, z * 90, 2),
      },
    );

    const clasp = sdf.union(
      sdf.box([0.08, 0.03, 0.02], 0.008).at(0, 0.335, 0.28),
      sdf.box([0.07, 0.06, 0.025], 0.012).at(0, 0.29, 0.287),
    );
    const button = sdf.sphere(0.016).scale([1, 1, 0.6]).at(0, 0.29, 0.303);
    k.body('clasp', sdf.smoothUnion(0.005, clasp, button).at(0, LIFT, 0), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 400,
    });
  },
});
