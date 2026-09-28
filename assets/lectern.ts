import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Lectern (props/furniture/lectern), matched to docs/item-mockups/lectern-mock.jpg.
 * Size: 1.2 m tall, 0.6 m wide, on y = 0, reading side toward +Z. One idea: a walnut lectern with a
 * cross foot, a turned post, and a slanted top with a lip, holding a large open book.
 * Palette: walnut #7a4a2a / #5a3520, pages #f2e3c2 / lines #c9b28a, cover #7a1e22.
 */

const WALNUT = rgb('#7a4a2a');
const DARK = rgb('#5a3520');
const TOP_Y = 1.05;

const wood = (x: number, y: number, z: number) => mixRgb(WALNUT, DARK, 0.15 + 0.35 * (0.5 + 0.5 * noise.fbm(x * 6, y * 20, z * 6, 3)));

export default defineAsset({
  name: 'lectern',
  description: 'A walnut lectern with a cross foot, a turned post, and a slanted top holding a large open book.',
  detail: 0.005,
  reference: 'docs/item-mockups/lectern-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const foot = sdf.union(sdf.box([0.6, 0.06, 0.1], 0.02).at(0, 0.03, 0), sdf.box([0.1, 0.06, 0.5], 0.02).at(0, 0.03, 0));
    const post = sdf.revolve(
      profile.polygon(
        [[0, 0.05], [0.07, 0.05], [0.07, 0.1], [0.045, 0.14], [0.05, 0.3], [0.04, 0.5], [0.06, 0.55], [0.04, 0.6], [0.045, 0.85], [0.07, 0.92], [0.06, 0.98], [0, 0.98]],
        { smooth: true },
      ),
    );
    const top = sdf.union(
      sdf.box([0.62, 0.035, 0.44], 0.01),
      sdf.box([0.62, 0.05, 0.03], 0.008).at(0, 0.03, 0.22),
      sdf.box([0.4, 0.12, 0.3], 0.02).at(0, -0.07, -0.02),
    ).rotateX(22).at(0, TOP_Y, 0);
    k.body('lectern', sdf.union(foot, post, top).paintFn(wood), { color: '#7a4a2a', roughness: 0.6, metalness: 0 });

    const book = (s: number) =>
      sdf.box([0.25, 0.04, 0.34], 0.006).at(s * 0.13, 0.03, 0).smoothUnion(0.02, sdf.ellipsoid([0.08, 0.045, 0.16]).at(s * 0.04, 0.045, 0));
    const pages = sdf.union(book(1), book(-1)).intersect(sdf.halfSpace([0, 1, 0], 0.065)).rotateX(22).at(0, TOP_Y + 0.02, 0);
    k.body(
      'pages',
      pages.paintFn((x, y) => mixRgb(rgb('#f2e3c2'), rgb('#c9b28a'), Math.abs(Math.sin(y * 900 + x * 3)) > 0.97 ? 0.8 : 0.05)),
      { color: '#f2e3c2', roughness: 0.85, metalness: 0 },
    );
    const cover = sdf.box([0.54, 0.012, 0.36], 0.004).rotateX(22).at(0, TOP_Y + 0.02, 0);
    k.body('cover', cover, { color: '#7a1e22', roughness: 0.6, metalness: 0 });
  },
});
