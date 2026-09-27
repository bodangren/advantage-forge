import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — chibi quest bookshelf (props/furniture/bookshelf).
 *
 * Role: cozy tavern/hamlet furniture; a background prop that must read at 128 px.
 * Size: 1.0 m wide, 0.35 m deep, 1.5 m tall (candle and jar ride on top),
 *   stands on y = 0, centered on the Y axis, front toward +Z.
 * One idea: a chunky honey-oak bookcase whose three rows of muted red, green,
 *   and brown books are the color accent; a lit candle is the focal glow.
 * Shape language: square and sturdy (posts, boards) softened by round bevels;
 *   books add a small zigzag rhythm to the silhouette.
 * Palette: honey oak #b5814a dominant, warm brown #8a5a35 and dark walnut
 *   #6b4226 secondary, pale cut wood #c9a06a for lit edges; book accents
 *   #9a4a3a / #5f6e46 / #8a5a35; flame #ff9a3c over a dark #4a1405 base.
 * Materials: wood (roughness 0.8), book cloth (roughness 0.85), pewter
 *   (roughness 0.4, metalness 0.8), wax ceramic, emissive flame.
 * Detail: primary frame + rows of books; secondary pegs, leaning books, a
 *   horizontal stack, candle + jar on top; tertiary grain in bump only.
 * Rig/animation: none (static prop).
 */

const C = {
  oak: rgb('#b5814a'),
  oakPale: rgb('#c9a06a'),
  brown: rgb('#8a5a35'),
  walnut: rgb('#6b4226'),
  woodDark: rgb('#4a2c14'),
  plaster: rgb('#f0e4cc'),
  pewter: '#9aa3ad',
  red: rgb('#9a4a3a'),
  green: rgb('#5f6e46'),
  cream: rgb('#e3d5b8'),
  flame: '#ff9a3c',
  flameBase: '#4a1405',
  wick: '#2a170b',
};

// Frame layout (m).
const POST_X = 0.465; // post center |x|
const TOP_Y = 1.49; // top face of the top board
const FLOOR0 = 0.09; // bottom-compartment floor (top of plinth)
const FLOOR1 = 0.545; // middle-compartment floor (top of shelf 1)
const FLOOR2 = 0.995; // top-compartment floor (top of shelf 2)
const BOOK_Z = -0.005; // book rows center z (depth 0.24)
const BOOK_SPINE = 0.115; // front face of the book rows

type Book = { x0: number; x1: number; h: number; color: ReturnType<typeof rgb>; label: boolean };

/** Pick a muted book color from a deterministic hash. */
const bookColor = (r: number): ReturnType<typeof rgb> => {
  const base = r < 0.3 ? C.brown : r < 0.55 ? C.red : r < 0.72 ? C.green : r < 0.9 ? C.walnut : C.cream;
  return mixRgb(base, r < 0.5 ? C.oakPale : C.woodDark, 0.14 * noise.random(r * 91, 7, 3));
};

/** A row of upright books as one extruded zigzag profile. */
const makeRow = (floorY: number, hMin: number, hMax: number, xStart: number, xEnd: number, seed: number): Book[] => {
  const books: Book[] = [];
  let x = xStart;
  for (let i = 0; ; i++) {
    const w = 0.042 + 0.014 * noise.random(i, seed, 1);
    if (x + w > xEnd) break;
    const h = hMin + (hMax - hMin) * noise.random(i, seed, 2);
    books.push({
      x0: x,
      x1: x + w,
      h,
      color: bookColor(noise.random(i, seed, 3)),
      label: noise.random(i, seed, 4) > 0.62,
    });
    x += w + 0.007 + 0.008 * noise.random(i, seed, 5);
  }
  return books;
};

/** Extrude a row's zigzag silhouette (book heights as seen from the front). */
const rowShape = (books: Book[], floorY: number) => {
  const pts: [number, number][] = [[books[0]!.x0, 0]];
  for (const b of books) pts.push([b.x0, b.h], [b.x1, b.h]);
  pts.push([books[books.length - 1]!.x1, 0]);
  return sdf.extrude(profile.polygon(pts, { smooth: false }), 0.24, 0.005).at(0, floorY, BOOK_Z);
};

/** One leaning book. xb = bottom edge x; angleDeg > 0 leans the top toward -X. */
const leaner = (xb: number, angleDeg: number, h: number, floorY: number, color: ReturnType<typeof rgb>) => {
  const a = (angleDeg * Math.PI) / 180;
  return sdf
    .box([0.045, h, 0.225], 0.007)
    .rotateZ(angleDeg)
    .at(xb - (h / 2) * Math.sin(a), floorY + (h / 2) * Math.cos(a) - 0.003, BOOK_Z)
    .paint(color);
};

const closeTo = (c: readonly number[], t: ReturnType<typeof rgb>) =>
  Math.abs(c[0]! - t[0]) < 0.03 && Math.abs(c[1]! - t[1]) < 0.03 && Math.abs(c[2]! - t[2]) < 0.03;

export default defineAsset({
  name: 'bookshelf',
  description:
    'Chunky honey-oak bookshelf with three rows of muted red, green, and brown books, a few leaning, a small stack, and a lit candle and jar on top.',
  detail: 0.008,
  reference: 'docs/item-mockups/bookshelf-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ frame (wood)
    const post = sdf.box([0.07, 1.49, 0.35], 0.014).at(POST_X, 0.745, 0);
    const pegY = [0.16, 0.5225, 0.9725, 1.36];
    const pegs = pegY.flatMap((y) => [
      sdf.cylinder(0.017, 0.03, 0.006).rotateX(90).at(POST_X, y, 0.178).paint(C.walnut),
      sdf.cylinder(0.017, 0.03, 0.006).rotateX(90).at(-POST_X, y, 0.178).paint(C.walnut),
    ]);
    const frame = sdf.union(
      post.mirror('x', 0),
      sdf.box([1.0, 0.07, 0.35], 0.012).at(0, 1.455, 0), // top board
      sdf.box([1.0, 0.09, 0.35], 0.012).at(0, 0.045, 0), // plinth
      sdf.box([0.86, 1.33, 0.03], 0.008).at(0, 0.755, -0.16), // back panel
      sdf.box([0.86, 0.045, 0.33], 0.01).at(0, 0.5225, 0), // shelf 1
      sdf.box([0.86, 0.045, 0.33], 0.01).at(0, 0.9725, 0), // shelf 2
      ...pegs,
    );
    const woodPaint = (x: number, y: number, z: number, base: readonly number[]) => {
      if (closeTo(base, C.walnut)) return base; // pegs keep their dark color
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 26, y * 3, z * 26, 2);
      let c = mixRgb(C.oak, C.oakPale, 0.1 + 0.22 * patch);
      c = mixRgb(c, C.brown, 0.18 * grain);
      c = mixRgb(c, C.walnut, 0.42 * Math.max(0, (-z - 0.09) / 0.08)); // shaded interior
      c = mixRgb(c, C.oakPale, 0.16 * Math.max(0, (y - 1.38) / 0.11)); // sun-lit top
      c = mixRgb(c, C.woodDark, 0.22 * Math.max(0, (0.14 - y) / 0.14)); // shaded foot
      return c;
    };
    k.body('frame', frame.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 24, y * 2.5, z * 24, 2),
      maxTriangles: 2400,
    });

    // ------------------------------------------------------------------ book rows (cloth)
    const rows = [
      makeRow(FLOOR0, 0.3, 0.375, -0.425, 0.215, 11),
      makeRow(FLOOR1, 0.3, 0.37, -0.425, 0.33, 23),
      makeRow(FLOOR2, 0.3, 0.39, -0.33, 0.425, 37),
    ];
    const floors = [FLOOR0, FLOOR1, FLOOR2];
    const rowPaint = (x: number, y: number, z: number) => {
      const ri = y < 0.52 ? 0 : y < 0.97 ? 1 : 2;
      const books = rows[ri]!;
      // Books are sorted along x; scan is cheap and deterministic.
      let b = books[books.length - 1]!;
      for (const cand of books) {
        if (x >= cand.x0 && x <= cand.x1) {
          b = cand;
          break;
        }
        if (cand.x0 > x) break;
      }
      if (x < b.x0 || x > b.x1) return mixRgb(C.woodDark, C.walnut, 0.5); // gap shadow
      const floorY = floors[ri]!;
      let c = b.color;
      const topD = floorY + b.h - y;
      c = mixRgb(c, C.cream, 0.35 * Math.max(0, 1 - topD / 0.009)); // page tops
      if (b.label && y < floorY + 0.05 && z > 0.05) c = mixRgb(c, C.cream, 0.8); // spine label band
      const d = Math.min(x - b.x0, b.x1 - x);
      c = mixRgb(c, C.woodDark, d < 0.0035 ? 0.78 : d < 0.0065 ? 0.4 : 0); // gap lines
      return c;
    };
    k.body('book-rows', sdf.union(...rows.map((r, i) => rowShape(r, floors[i]!))).paintFn(rowPaint), {
      color: '#8a5a35',
      roughness: 0.85,
      metalness: 0,
      detail: 0.009,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 3400,
    });

    // ------------------------------------------------------------------ loose books (leaning + stack)
    const stackBase = FLOOR0;
    const stack = [0, 1, 2].map((i) =>
      sdf
        .box([0.15, 0.037, 0.21], 0.007)
        .rotateY(-5 + 6 * noise.random(i, 5, 1))
        .at(0.355 + 0.008 * (noise.random(i, 5, 2) - 0.5), stackBase + 0.0185 + i * 0.037, BOOK_Z)
        .paint(bookColor(0.2 + 0.5 * noise.random(i, 5, 3))),
    );
    const loose = sdf.union(
      leaner(0.24, -10, 0.365, FLOOR0, C.red), // leans onto the stack
      leaner(0.355, -11, 0.335, FLOOR1, C.green), // leans on the right post
      leaner(-0.355, 11, 0.36, FLOOR2, C.brown), // leans on the left post
      ...stack,
    );
    k.body('books-loose', loose, {
      color: '#8a5a35',
      roughness: 0.85,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 1400,
    });

    // ------------------------------------------------------------------ candle on top (focal point)
    const CANDLE_X = -0.31;
    const holder = sdf
      .smoothUnion(
        0.006,
        sdf.cylinder(0.052, 0.02, 0.006).at(CANDLE_X, TOP_Y + 0.01, 0),
        sdf.torus(0.044, 0.009).at(CANDLE_X, TOP_Y + 0.021, 0),
      )
      .smoothUnion(0.006, sdf.cylinder(0.027, 0.012, 0.004).at(CANDLE_X, TOP_Y + 0.032, 0));
    k.body('candle-metal', holder, {
      color: C.pewter,
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.004,
      maxTriangles: 450,
    });
    const wax = sdf
      .smoothUnion(
        0.008,
        sdf.cylinder(0.027, 0.068, 0.008).at(CANDLE_X, TOP_Y + 0.066, 0),
        sdf.sphere(0.027).scale([1, 0.4, 1]).at(CANDLE_X, TOP_Y + 0.1, 0),
      )
      .union(sdf.cylinder(0.004, 0.014, 0.002).at(CANDLE_X, TOP_Y + 0.103, 0).paint(rgb(C.wick)));
    k.body('wax', wax, {
      color: '#f0e4cc',
      roughness: 0.55,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 450,
    });
    const flame = sdf.union(
      sdf.sphere(0.026).scale([0.8, 1.5, 0.8]).at(CANDLE_X, TOP_Y + 0.132, 0),
      sdf.sphere(0.015).at(CANDLE_X, TOP_Y + 0.162, 0),
    );
    k.body('flame', flame, {
      color: C.flameBase,
      roughness: 0.2,
      metalness: 0,
      emissive: C.flame,
      emissiveIntensity: 2,
      detail: 0.004,
      maxTriangles: 250,
    });

    // ------------------------------------------------------------------ small jar on top
    const JAR_X = 0.29;
    const jarProfile = profile.polygon(
      [
        [0.0, 0.0],
        [0.045, 0.002],
        [0.058, 0.02],
        [0.06, 0.055],
        [0.048, 0.085],
        [0.033, 0.1],
        [0.032, 0.112],
      ],
      { smooth: true, samples: 12 },
    );
    const jar = sdf
      .smoothUnion(
        0.005,
        sdf.revolve(jarProfile).at(JAR_X, TOP_Y, 0),
        sdf.cylinder(0.037, 0.024, 0.007).at(JAR_X, TOP_Y + 0.122, 0).paint(C.walnut),
      )
      .union(sdf.sphere(0.013).at(JAR_X, TOP_Y + 0.138, 0).paint(C.walnut));
    k.body('jar', jar, {
      color: '#ddd0b4',
      roughness: 0.45,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 550,
    });
  },
});
