import { defineAsset, mixRgb, profile, rgb, sdf } from '../src/index.js';

/**
 * Wicker basket (props/containers/wicker-basket), matched to docs/item-mockups/wicker-basket-mock.jpg.
 * Size: 0.54 m wide, 0.4 m tall with its handles, on y = 0. One idea: an empty flared basket with
 * a raised basket weave, a thick rolled rim, and two loop handles on the sides.
 * Palette: wicker #dca45a / shade #a8743a. Material: dry wicker (0.8).
 */

const WICKER = rgb('#dca45a');
const SHADE = rgb('#a8743a');

const weave = (x: number, y: number, z: number) => {
  const a = Math.atan2(z, x);
  const row = Math.floor(y / 0.035);
  const u = Math.sin(a * 18 + (row % 2) * Math.PI);
  const v = Math.abs(Math.sin((y / 0.035) * Math.PI));
  return u * v;
};

export default defineAsset({
  name: 'wicker-basket',
  description: 'An empty wicker basket with a raised basket weave, a thick rolled rim, and two loop handles.',
  detail: 0.004,
  reference: 'docs/item-mockups/wicker-basket-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const outer = sdf.revolve(profile.polygon([[0, 0], [0.17, 0], [0.19, 0.03], [0.235, 0.27], [0, 0.27]]));
    const inner = sdf.revolve(profile.polygon([[0, 0.022], [0.15, 0.022], [0.212, 0.3], [0, 0.3]]));
    const wall = outer
      .subtract(inner)
      .displace(0.005, (x, y, z) => -Math.max(0, weave(x, y, z)), 1.3)
      .paintFn((x, y, z) => mixRgb(WICKER, SHADE, 0.55 - 0.45 * weave(x, y, z)));
    k.body('basket', wall, { color: '#dca45a', roughness: 0.8, metalness: 0, textureDensity: 2 });

    // Rolled rim and two loop handles, twisted like a cane rope.
    const twist = (x: number, y: number, z: number) => 0.5 + 0.5 * Math.sin(Math.atan2(z, x) * 60 + y * 200);
    const rim = sdf.torus(0.226, 0.022).at(0, 0.272, 0);
    const handles = sdf.union(
      ...[1, -1].map((s) =>
        sdf
          .torus(0.07, 0.014)
          .rotateZ(90)
          .at(s * 0.215, 0.28, 0)
          .intersect(sdf.halfSpace([0, -1, 0], -0.28).intersect(sdf.box([1, 1, 1]).at(0, 0.5, 0))),
      ),
    );
    k.body(
      'rim',
      sdf.smoothUnion(0.01, rim, handles).paintFn((x, y, z) => mixRgb(WICKER, SHADE, 0.35 * twist(x, y, z))),
      { color: '#dca45a', roughness: 0.8, metalness: 0 },
    );
  },
});
