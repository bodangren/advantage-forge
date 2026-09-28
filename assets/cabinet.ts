import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Kitchen cabinet (props/furniture/cabinet), matched to docs/item-mockups/cabinet-mock.jpg.
 * Size: 1.0 m wide, 1.1 m tall with the plates, 0.45 m deep, on y = 0, front toward +Z.
 * One idea: a honey-oak cabinet with an overhanging top, a row of two drawers, two raised-panel
 * doors with cream knobs, a plinth, and a stack of plates on top.
 * Palette: oak #c9874a / grain #9a6434, top #b0763e, knobs #efe6d2, plates #f2ede0 / rim #7a9ac0.
 */

const OAK = rgb('#c9874a');
const GRAIN = rgb('#9a6434');
const W = 1.0;
const H = 0.98;
const D = 0.45;

const wood = (x: number, y: number, z: number) =>
  mixRgb(OAK, GRAIN, 0.12 + 0.35 * (0.5 + 0.5 * noise.fbm(x * 4, y * 30, z * 4, 3)));

export default defineAsset({
  name: 'cabinet',
  description: 'A honey-oak kitchen cabinet with two drawers, two raised-panel doors with cream knobs, and plates on top.',
  detail: 0.006,
  reference: 'docs/item-mockups/cabinet-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const carcass = sdf.box([W, H - 0.1, D], 0.02).at(0, (H - 0.1) / 2 + 0.06, 0);
    const plinth = sdf.box([W - 0.04, 0.07, D - 0.04], 0.012).at(0, 0.035, -0.005);
    const top = sdf.box([W + 0.06, 0.05, D + 0.05], 0.018).at(0, H - 0.015, 0.012);
    // Raised door panels and drawer fronts on the front face.
    const fronts = [];
    for (const s of [-1, 1]) {
      fronts.push(sdf.box([W / 2 - 0.07, 0.52, 0.03], 0.014).at(s * (W / 4 - 0.005), 0.4, D / 2 + 0.008));
      fronts.push(sdf.box([W / 2 - 0.19, 0.38, 0.03], 0.012).at(s * (W / 4 - 0.005), 0.4, D / 2 + 0.02));
      fronts.push(sdf.box([W / 2 - 0.07, 0.15, 0.03], 0.012).at(s * (W / 4 - 0.005), 0.8, D / 2 + 0.008));
    }
    k.body('cabinet', sdf.union(carcass, plinth, top, ...fronts).paintFn(wood), {
      color: '#c9874a',
      roughness: 0.65,
      metalness: 0,
      textureDensity: 1.5,
    });
    const knobs = sdf.union(
      ...[-1, 1].flatMap((s) => [
        sdf.ellipsoid([0.018, 0.03, 0.018]).at(s * 0.06, 0.45, D / 2 + 0.045),
        sdf.sphere(0.018).at(s * (W / 4 - 0.005), 0.8, D / 2 + 0.035),
      ]),
    );
    k.body('knobs', knobs, { color: '#efe6d2', roughness: 0.4, metalness: 0 });

    const plates = sdf.union(
      ...[0, 1, 2].map((i) => sdf.cylinder(0.12, 0.018, 0.008).at(0.22, H + 0.02 + i * 0.02, 0.02)),
      sdf.cylinder(0.1, 0.016, 0.007).at(-0.25, H + 0.018, -0.03),
    );
    k.body(
      'plates',
      plates.paintFn((x, _y, z) => {
        const r = Math.min(Math.hypot(x - 0.22, z - 0.02), Math.hypot(x + 0.25, z + 0.03));
        return r > 0.085 && r < 0.1 ? rgb('#7a9ac0') : rgb('#f2ede0');
      }),
      { color: '#f2ede0', roughness: 0.3, metalness: 0 },
    );
  },
});
