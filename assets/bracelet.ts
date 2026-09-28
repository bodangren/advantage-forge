import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Silver bracelet (equipment/accessories/bracelet), matched to docs/item-mockups/bracelet-mock.jpg.
 * Size: 0.1 m wide, standing upright on y = 0. One idea: a thick silver band with an engraved wave
 * pattern and three small blue gems set in the outer face. Palette: silver #c0c6cc / engraving
 * #7e858e, gems #3a8ad8.
 */

const SILVER = rgb('#c0c6cc');
const ENGRAVE = rgb('#7e858e');
const R = 0.04;
const T = 0.008;
const CY = R + T; // band center height

export default defineAsset({
  name: 'bracelet',
  description: 'A thick silver bracelet standing upright, with an engraved wave pattern and three small blue gems.',
  detail: 0.0018,
  reference: 'docs/item-mockups/bracelet-mock.jpg',
  texture: { size: 512 },

  build(k) {
    // A flattened band: a torus stretched across its width (Z), standing in the XY plane.
    const band = sdf.torus(R, T).rotateX(90).scale([1, 1, 2.2]).at(0, CY, 0);
    const wave = (x: number, y: number, z: number) => {
      const a = Math.atan2(y - CY, x);
      return Math.abs(Math.abs(z) - 0.011) < 0.0012 || Math.abs(z - 0.005 * Math.sin(a * 12)) < 0.0012 ? 1 : 0;
    };
    k.body(
      'band',
      band.paintFn((x, y, z) => mixRgb(SILVER, ENGRAVE, wave(x, y, z))),
      { color: '#c0c6cc', roughness: 0.3, metalness: 0.9, textureDensity: 3, bump: (x, y, z) => -0.0006 * wave(x, y, z) },
    );
    const gems = [60, 90, 120].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return sdf.ellipsoid([0.0065, 0.0065, 0.0065]).at(Math.cos(a) * (R + T - 0.001), CY + Math.sin(a) * (R + T - 0.001), 0);
    });
    k.body('gems', sdf.union(...gems), { color: '#3a8ad8', roughness: 0.15, metalness: 0, flat: true });
  },
});
