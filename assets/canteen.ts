import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Canteen (props/containers/canteen), matched to docs/item-mockups/canteen-mock.jpg.
 * Size: 0.22 m wide, 0.27 m tall, standing on its edge on y = 0. One idea: a round flat
 * leather-covered flask with a stitched edge band, a brass neck, a cork, and a shoulder strap
 * arching over the top. Palette: leather #9a6038 / #6e4226, stitch #e0c890, brass #d4a93a,
 * cork #c9a06a.
 */

const LEATHER = rgb('#9a6038');
const LEATHER_DARK = rgb('#6e4226');
const STITCH = rgb('#e0c890');

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const ground = (s: ReturnType<typeof sdf.sphere>) =>
  s.intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 1, 1]).at(0, 0.3, 0)));

export default defineAsset({
  name: 'canteen',
  description: 'A round leather-covered canteen with a stitched edge band, a brass neck, a cork, and a shoulder strap.',
  detail: 0.003,
  reference: 'docs/item-mockups/canteen-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const flask = sdf.ellipsoid([0.1, 0.1, 0.052]).at(0, 0.097, 0);
    k.body(
      'flask',
      ground(flask).paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        return mixRgb(LEATHER, LEATHER_DARK, 0.15 + 0.35 * n + 0.3 * clamp((0.03 - y) / 0.03));
      }),
      { color: '#9a6038', roughness: 0.65, metalness: 0, textureDensity: 2 },
    );
    // Edge band with a dashed stitch line on each face.
    const band = flask
      .round(0.004)
      .intersect(sdf.box([0.4, 0.4, 0.026]).at(0, 0.1, 0))
      .paintFn((x, y, z) => {
        const a = Math.atan2(y - 0.097, x);
        const stitch = Math.abs(Math.abs(z) - 0.009) < 0.0022 && Math.sin(a * 40) > 0.2;
        return stitch ? STITCH : LEATHER_DARK;
      });
    k.body('band', ground(band), { color: '#6e4226', roughness: 0.7, metalness: 0, textureDensity: 2 });

    const brass = sdf.union(
      sdf.cylinder(0.02, 0.035, 0.005).at(0, 0.205, 0),
      sdf.torus(0.021, 0.004).at(0, 0.22, 0),
      ...[1, -1].map((s) => sdf.torus(0.013, 0.004).rotateZ(90).at(s * 0.095, 0.15, 0)),
    );
    k.body('brass', brass, { color: '#d4a93a', roughness: 0.3, metalness: 0.9 });
    k.body('cork', sdf.cone([0, 0.22, 0], [0, 0.255, 0], 0.016, 0.019), { color: '#c9a06a', roughness: 0.85, metalness: 0 });

    // Shoulder strap arching over the top from lug to lug.
    const strap = sdf
      .torus(0.1, 0.006)
      .rotateX(90)
      .scale([1, 1.25, 1])
      .at(0, 0.15, 0)
      .intersect(sdf.halfSpace([0, -1, 0], -0.15).intersect(sdf.box([0.4, 0.4, 0.4]).at(0, 0.3, 0)));
    k.body('strap', strap, { color: '#6e4226', roughness: 0.7, metalness: 0 });
  },
});
