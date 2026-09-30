import { defineAsset, noise, profile, sdf } from '../src/index.js';

/**
 * Design note - greaves (equipment/armor/greaves), reworked to the mockup.
 * Role: shop pickup and equipment fit for the chibi hero (2x leg scale); reads at 128 px as a pair.
 * Size: each greave 0.5 m tall, 0.24 m wide, foot 0.32 m long; pair about 0.6 m wide, on y = 0, front +Z.
 * One idea: leather-red boot sleeves armored with a steel diamond knee plate, shin plate and steel foot.
 * Shape language: square/rounded plates over a round sleeve; diamond knee is the focal point.
 * Palette: leather #b0603a with darker rim #7a3e26; steel #a8acb1 / #6c737a; sole #3e3e44.
 * Materials: leather (0.7, 0), steel (0.4, 0.8), sole (0.85, 0). No rig.
 * Local frame: one greave built at x = 0.16, then .mirror('x', 0).
 */
const X = 0.16;
const place = (s: sdf.Shape) => s.at(X, 0, 0).mirror('x', 0);

export default defineAsset({
  name: 'greaves',
  description: 'A pair of leather-red greaves with steel diamond knee plates, shin plates and steel boot feet.',
  detail: 0.005,
  reference: 'docs/item-mockups/greaves-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const sleeve = sdf.cone([0, 0.06, 0], [0, 0.5, 0], 0.11, 0.12);
    const hollow = sdf.revolve(
      profile.polygon([[0, 0.06], [0.11, 0.06], [0.12, 0.5], [0.09, 0.5], [0.09, 0.42], [0, 0.42]]),
    );
    const leather = hollow
      .paintFn((x, y, z, base) => {
        if (y > 0.455) return [0.478, 0.243, 0.149];
        return base;
      });
    k.body('leather', place(leather), {
      color: '#b0603a',
      roughness: 0.7,
      detail: 0.006,
      maxError: 0.002,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 30, y * 12, z * 30, 2),
    });

    const knee = sdf.box([0.16, 0.16, 0.03], 0.014).rotateZ(45).at(0, 0.4, 0.11);
    const rivet = (x: number, y: number, z: number) => sdf.sphere(0.02).at(x, y, z);
    const shell = sleeve.round(0.02).subtract(sleeve.round(-0.005));
    const zone = sdf.box([0.22, 0.2, 0.4]).at(0, 0.22, 0);
    const shin = shell
      .intersect(sdf.halfSpace([0, 0, -1], -0.02).intersect(zone));
    const ridge = sdf.box([0.03, 0.2, 0.02], 0.006).at(0, 0.22, 0.132);
    const steel = sdf
      .union(
        knee,
        rivet(0, 0.4, 0.13),
        shin,
        ridge,
        rivet(-0.05, 0.16, 0.122),
        rivet(0.05, 0.16, 0.122),
        rivet(-0.05, 0.28, 0.124),
        rivet(0.05, 0.28, 0.124),
        sdf.box([0.2, 0.1, 0.32], 0.04).at(0, 0.06, 0.06),
        sdf.ellipsoid([0.1, 0.06, 0.09]).at(0, 0.06, 0.18),
      )
      .paintFn((x, y, z, base) => (y < 0.3 && y > 0.1 && z < 0.05 ? [0.42, 0.45, 0.48] : base));
    k.body('steel', place(steel), {
      color: '#a8acb1',
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.005,
      maxError: 0.002,
    });

    const sole = sdf.box([0.21, 0.02, 0.33], 0.008).at(0, 0.01, 0.06);
    k.body('sole', place(sole), { color: '#3e3e44', roughness: 0.85, detail: 0.006 });
  },
});
