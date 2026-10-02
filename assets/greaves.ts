import { defineAsset, noise, profile, sdf } from '../src/index.js';

/**
 * Design note - greaves (equipment/armor/greaves), reworked to the mockup and the avatar base.
 * Role: shop pickup and equipment fit for the chibi hero (2x leg scale); reads at 128 px as a pair.
 * Size: each greave 0.30 m tall (shin and knee only), 0.24 m wide, foot 0.34 m long; on y = 0, front +Z.
 * One idea: red-brown leather sleeves with a steel diamond plate, a steel shin band with a fin and a flat steel sabaton.
 * Shape language: square/rounded plates over a round sleeve; diamond knee is the focal point.
 * Palette: leather #b0603a with darker rim #7a3e26; steel #a8acb1 / #6c737a; sole #3e3e44.
 * Materials: leather (0.7, 0), steel (0.4, 0.8), sole (0.85, 0). No rig.
 * Avatar fit (2026-10-02): sleeve, shin plate and foot are built in avatar meters around the avatar
 *   shin and foot, grown about 1 cm, then scaled by 2. The top stops at avatar y 0.15 so the shirt
 *   hem stays clear (it was 0.25 and cut into hips). `origin` x is X0 so the +X half is kept.
 */
const X0 = 0.13;
const AX = 0.098;
const toAsset = (s: sdf.Shape) => s.scale(2).at(X0 - 2 * AX, 0, 0);
const place = (s: sdf.Shape) => s.mirror('x', 0);

export default defineAsset({
  name: 'greaves',
  description: 'A pair of leather-red greaves with steel diamond knee plates, shin plates and steel boot feet.',
  detail: 0.005,
  reference: 'docs/item-mockups/greaves-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'feet', fitScale: 2, origin: [X0, 0.14, 0], hides: ['shoes'] },

  build(k) {
    // Tapered sleeve with a rolled rim, from the ankle to just under the shirt hem (0.152).
    const sleeve = sdf
      .revolve(profile.polygon([[0, 0.05], [0.052, 0.05], [0.06, 0.15], [0, 0.15]]))
      .at(AX, 0, 0.001);
    const rim = sdf.torus(0.056, 0.007).at(AX, 0.144, 0.001);
    const band = sdf.cylinder(0.058, 0.02, 0.006).at(AX, 0.062, 0.001);
    const leather = toAsset(sleeve.smoothUnion(0.008, rim).smoothUnion(0.006, band));
    k.body('leather', place(leather), {
      color: '#9a4a2c',
      roughness: 0.7,
      detail: 0.006,
      maxError: 0.002,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 30, y * 12, z * 30, 2),
    });

    // Steel: middle shin band with a front fin, diamond plate with stud, flat sabaton.
    const midBand = sdf.cylinder(0.059, 0.026, 0.006).at(AX, 0.093, 0.001);
    const fin = sdf.box([0.01, 0.05, 0.016], 0.004).at(AX, 0.093, 0.062);
    const diamond = sdf.box([0.056, 0.056, 0.014], 0.006).rotateZ(45).at(AX, 0.122, 0.058);
    const stud = sdf.sphere(0.008).at(AX, 0.123, 0.063);
    const foot = sdf.smoothUnion(
      0.015,
      sdf.ellipsoid([0.045, 0.034, 0.08]).at(AX, 0.036, 0.025),
      sdf.cone([AX, 0.042, 0.06], [AX, 0.036, 0.12], 0.034, 0.014),
      sdf.ellipsoid([0.045, 0.03, 0.04]).at(AX, 0.06, -0.005),
    );
    const steel = toAsset(sdf.union(midBand, fin, diamond, stud, foot)).paintFn((x, y, z, base) =>
      y > 0.19 && y < 0.2 ? [0.42, 0.45, 0.48] : base,
    );
    k.body('steel', place(steel), {
      color: '#a8acb1',
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.005,
      maxError: 0.002,
    });

    const sole = sdf.cylinder(0.092, 0.024, 0.01).scale([1, 1, 1.75]).at(X0, 0.012, 0.05);
    k.body('sole', place(sole), { color: '#3e3e44', roughness: 0.85, detail: 0.006 });
  },
});
