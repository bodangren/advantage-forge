import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Tall bookcase (props/furniture/bookcase), matched to docs/item-mockups/bookcase-mock.jpg.
 * Size: 1.2 m wide, 2.05 m tall, 0.4 m deep, on y = 0, front toward +Z. One idea: a walnut
 * bookcase with a crown moulding, four shelves of colorful leaning books, and a scroll rack at the
 * bottom. Palette: walnut #6b4226 / #54331d, books red #b8402a, blue #3a6ab0, green #4a8a3a,
 * ochre #c89a3a, purple #7a4a98, scrolls #efe0b8.
 */

const WALNUT = rgb('#6b4226');
const DARK = rgb('#54331d');
const BOOKS = ['#b8402a', '#3a6ab0', '#4a8a3a', '#c89a3a', '#7a4a98', '#8a3a2a', '#2f7a7a'].map((c) => rgb(c));
const W = 1.2;
const D = 0.4;
const SHELVES = [0.45, 0.85, 1.25, 1.65];

const wood = (x: number, y: number, z: number) => mixRgb(WALNUT, DARK, 0.15 + 0.35 * (0.5 + 0.5 * noise.fbm(x * 5, y * 25, z * 5, 3)));

export default defineAsset({
  name: 'bookcase',
  description: 'A tall walnut bookcase with a crown moulding, four shelves of colorful books, and a scroll rack at the bottom.',
  detail: 0.006,
  reference: 'docs/item-mockups/bookcase-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const parts = [
      sdf.box([W, 1.95, 0.03], 0.008).at(0, 1.0, -D / 2 + 0.015),
      ...[-1, 1].map((s) => sdf.box([0.05, 1.95, D], 0.012).at(s * (W / 2 - 0.025), 1.0, 0)),
      sdf.box([W, 0.08, D], 0.012).at(0, 0.04, 0),
      sdf.box([W + 0.08, 0.06, D + 0.05], 0.015).at(0, 1.99, 0.01),
      sdf.box([W + 0.02, 0.04, D + 0.02], 0.01).at(0, 1.94, 0.005),
      ...SHELVES.map((y) => sdf.box([W - 0.06, 0.03, D - 0.03], 0.006).at(0, y, 0.01)),
      // Scroll rack dividers under the first shelf.
      ...[-0.2, 0.2].map((x) => sdf.box([0.03, 0.35, D - 0.04], 0.006).at(x, 0.26, 0.01)),
    ];
    k.body('case', sdf.union(...parts).paintFn(wood), { color: '#6b4226', roughness: 0.65, metalness: 0 });

    const books = [];
    let n = 0;
    for (const y0 of SHELVES) {
      let x = -W / 2 + 0.07;
      while (x < W / 2 - 0.1) {
        const r = (u: number) => noise.random(n, u, 0, 41);
        const w = 0.035 + 0.03 * r(1);
        const h = 0.24 + 0.1 * r(2);
        const lean = r(3) > 0.85 ? 12 : 0;
        const color = BOOKS[Math.floor(r(4) * BOOKS.length)]!;
        books.push(
          sdf
            .box([w, h, 0.22 + 0.06 * r(5)], 0.006)
            .rotateZ(-lean)
            .at(x + w / 2, y0 + 0.015 + h / 2 - (lean ? 0.01 : 0), 0.02)
            .paintFn((_px, py) => (Math.abs(py - (y0 + h * 0.8)) < 0.008 || Math.abs(py - (y0 + h * 0.25)) < 0.008 ? rgb('#d4a93a') : color)),
        );
        x += w + 0.004 + (lean ? 0.03 : 0);
        n++;
        if (r(6) > 0.9) x += 0.08; // a gap now and then
      }
    }
    k.body('books', sdf.union(...books), { color: '#b8402a', roughness: 0.6, metalness: 0 });

    const scrolls = [];
    for (const cx of [-0.4, 0, 0.4])
      for (let i = 0; i < 3; i++) scrolls.push(sdf.cylinder(0.035, 0.3, 0.01).rotateX(90).at(cx - 0.05 + (i % 2) * 0.08, 0.12 + Math.floor(i / 2) * 0.07 + (i === 1 ? 0.0 : 0), 0.02));
    k.body('scrolls', sdf.union(...scrolls), { color: '#efe0b8', roughness: 0.8, metalness: 0 });
  },
});
