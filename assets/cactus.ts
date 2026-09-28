import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Saguaro cactus (nature/plants/cactus), matched to docs/item-mockups/cactus-mock.jpg.
 * Size: 1.25 m tall, on a sandy mound on y = 0. One idea: a ribbed green trunk with two raised
 * arms, pale spine dots along the ribs, and a pink flower on top. Palette: cactus #5aa640 /
 * groove #3f7f2e, spines #efe6c0, sand #e3c38a, flower #f06a9a / center #f2c040.
 */

const GREEN = rgb('#5aa640');
const GROOVE = rgb('#3f7f2e');
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'cactus',
  description: 'A ribbed green saguaro cactus with two raised arms, spine dots, and a pink flower, on a sandy mound.',
  detail: 0.006,
  reference: 'docs/item-mockups/cactus-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Ribs: the angle around each limb's own axis is not known, so use the world angle around the
    // nearest vertical axis (trunk at x = 0, arms at x = +-0.3).
    const rib = (x: number, z: number) => {
      const cx = Math.abs(x) > 0.2 ? Math.sign(x) * 0.3 : 0;
      return 0.5 + 0.5 * Math.cos(Math.atan2(z, x - cx) * 10);
    };
    const body = sdf
      .smoothUnion(
        0.05,
        sdf.capsule([0, 0.05, 0], [0, 1.05, 0], 0.15),
        sdf.chain([[0.1, 0.5, 0, 0.1], [0.3, 0.52, 0, 0.1], [0.3, 0.85, 0, 0.1]], 0.04),
        sdf.chain([[-0.1, 0.62, 0, 0.09], [-0.28, 0.64, 0, 0.09], [-0.3, 0.9, 0, 0.09]], 0.04),
      )
      .displace(0.012, (x, _y, z) => -rib(x, z), 1.4);
    k.body(
      'cactus',
      body.paintFn((x, y, z) => {
        const r = rib(x, z);
        let c = mixRgb(GROOVE, GREEN, clamp(r * 1.4));
        if (r > 0.93 && Math.sin(y * 70) > 0.85) c = rgb('#efe6c0');
        return mixRgb(c, GROOVE, 0.12 * (0.5 + 0.5 * noise.fbm(x * 10, y * 10, z * 10, 2)));
      }),
      { color: '#5aa640', roughness: 0.6, metalness: 0, textureDensity: 1.5 },
    );
    const sand = sdf.ellipsoid([0.35, 0.1, 0.3]).at(0, 0.0, 0).intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([2, 1, 2]).at(0, 0.3, 0)));
    k.body('sand', sand.paintFn((x, y, z) => mixRgb(rgb('#e3c38a'), rgb('#c9a56a'), 0.3 * (0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2)))), {
      color: '#e3c38a',
      roughness: 0.95,
      metalness: 0,
    });
    const petals = Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3;
      return sdf.ellipsoid([0.035, 0.02, 0.022]).rotateY((-a * 180) / Math.PI).at(Math.cos(a) * 0.035, 1.2, Math.sin(a) * 0.035);
    });
    k.body('flower', sdf.union(...petals), { color: '#f06a9a', roughness: 0.6, metalness: 0 });
    k.body('center', sdf.sphere(0.022).at(0, 1.21, 0), { color: '#f2c040', roughness: 0.6, metalness: 0 });
  },
});
