import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — wooden dock section (architecture/structure/dock).
 *
 * Role: a walkable pier section for the forest shore. It must read at 128 px.
 * Size: deck 2.0 m wide (X) and 3.0 m long (Z). It stands on y = 0, centred
 *   on the Y axis, front toward +Z. The long axis runs along Z. The water end
 *   points toward -Z.
 * One idea: a thick plank deck on round log posts, with a painted mooring post
 *   and a yellow rope coil as the focal point.
 * Shape language: square deck (sturdy) with round posts, a round bollard, and
 *   a soft rope (friendly).
 * Palette: cut wood #c9a06a (dominant, light), bark #8a5a35 / #5f3d22 (dark
 *   posts), painted cap #9a96c4, rope #e8c56a (accent).
 * Materials: cut wood (0.82), bark (0.88), painted wood (0.48), rope (0.92).
 * Detail: deck, beams, six posts; bollard and rope coil; side ladder. Focal
 *   point is the bollard and rope.
 * Rig/animation: none.
 */

const CUT = rgb('#c9a06a');
const CUT_PALE = rgb('#e0c08a');
const CUT_DARK = rgb('#8a5a35');
const SEAM = rgb('#5f3d22');
const BARK = rgb('#8a5a35');
const BARK_DARK = rgb('#5f3d22');
const BARK_LIGHT = rgb('#c9a06a');
const MOSS = rgb('#2f7a3f');
const PAINT_DARK = rgb('#6e6a96');
const PAINT_LIGHT = rgb('#c8c4e4');
const ROPE = rgb('#e8c56a');
const ROPE_DARK = rgb('#b8923e');

const DECK_TOP = 0.58;
const DECK_T = 0.15;
const BX = -0.36;
const BZ = 0.9;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const POSTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-0.86, 1.3, 0.125, 0.74],
  [0.88, 1.28, 0.132, 0.71],
  [-0.84, 0.02, 0.118, 0.7],
  [0.86, -0.01, 0.128, 0.73],
  [-0.87, -1.3, 0.122, 0.72],
  [0.85, -1.28, 0.13, 0.75],
];

const SEAM_X = [-0.6, -0.2, 0.2, 0.6];

function seamAt(x: number): number {
  let s = 0;
  for (const sx of SEAM_X) {
    const d = Math.abs(x - sx);
    if (d < 0.02) s = Math.max(s, 1 - d / 0.02);
  }
  return s;
}

function deckPaint(x: number, y: number, z: number, _base: Rgb): Rgb {
  const pi = Math.floor((x + 1.02) / 0.4);
  const tint = noise.random(pi, 5, 1);
  let c = mixRgb(CUT, tint > 0.62 ? CUT_PALE : rgb('#b07a42'), 0.1 + 0.28 * Math.abs(tint - 0.4));
  const grain = noise.fbm(x * 4.5, y * 7, z * 1.8, 3, 2);
  c = mixRgb(c, SEAM, clamp01(-grain) * 0.28);
  c = mixRgb(c, CUT_PALE, clamp01(grain - 0.15) * 0.14);
  const worn = clamp01(1 - Math.hypot(x - BX, z - BZ) / 0.55);
  c = mixRgb(c, CUT_DARK, 0.22 * worn * worn);
  const inSlab = y < DECK_TOP + 0.01 && y > 0.28 && Math.abs(x) < 1.05 && Math.abs(z) < 1.55;
  if (inSlab) {
    c = mixRgb(c, CUT_PALE, 0.18 * clamp01((y - 0.5) / 0.08));
    c = mixRgb(c, SEAM, 0.45 * clamp01((0.46 - y) / 0.08));
  }
  const onTop = y > DECK_TOP - 0.035 && y < DECK_TOP + 0.02;
  const onEnd = Math.abs(z) > 1.4 && y < DECK_TOP + 0.02;
  const seam = seamAt(x);
  if ((onTop || onEnd) && seam > 0.05) c = mixRgb(c, SEAM, 0.88 * seam);
  if (onEnd && seam < 0.35) {
    const ring = 0.5 + 0.5 * Math.sin((y - 0.5) * 78 + x * 6);
    c = mixRgb(c, CUT_DARK, 0.22 * ring);
  }
  return c;
}

function deckBump(x: number, y: number, z: number): number {
  let g = 0.0016 * noise.fbm(x * 3.5, y * 6, z * 1.6, 2, 2);
  if (y > DECK_TOP - 0.04) g -= 0.0028 * seamAt(x);
  return g;
}

function nearestPost(x: number, z: number): readonly [number, number, number, number] {
  let best = POSTS[0]!;
  let bestD = 1e9;
  for (const p of POSTS) {
    const d = (x - p[0]) ** 2 + (z - p[1]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function postPaint(x: number, y: number, z: number, _base: Rgb): Rgb {
  const p = nearestPost(x, z);
  const lx = x - p[0];
  const lz = z - p[1];
  const rad = Math.hypot(lx, lz);
  const top = p[3];
  // Soft gradients only. A hard color cut makes seam triangles that will not reduce.
  const streak = noise.fbm(lx * 5, y * 1.4, lz * 5, 2, 4);
  let c = mixRgb(BARK, BARK_DARK, 0.38 + 0.42 * clamp01(-streak));
  c = mixRgb(c, BARK_LIGHT, clamp01(streak) * 0.34);
  const wet = clamp01((0.16 - y) / 0.16);
  c = mixRgb(c, rgb('#3a4030'), 0.26 * wet);
  const mossN = 0.5 + 0.5 * noise.fbm(x * 2.5, y * 1.6, z * 2.5, 2, 6);
  const moss = clamp01(mossN - 0.35) * clamp01((0.2 - y) / 0.2);
  const waterEnd = clamp01((-z + 0.2) / 1.4);
  c = mixRgb(c, MOSS, 0.28 * moss * (0.4 + 0.6 * waterEnd));
  const crown = clamp01((y - (top - 0.07)) / 0.06) * clamp01((p[2] * 0.95 - rad) / 0.04);
  const ring = 0.5 + 0.5 * Math.sin(rad * 55);
  const face = mixRgb(CUT_PALE, CUT, 0.25 + 0.2 * ring);
  return mixRgb(c, face, crown * 0.85);
}

function postBump(x: number, y: number, z: number): number {
  return 0.0032 * noise.fbm(x * 11, y * 2.6, z * 11, 2, 4);
}

function ropeShape(): Sdf {
  // Tight wraps, not a loose spring. Turns overlap so the coil reads as one rope.
  const ring = (y: number, tilt: number, roll: number, dx: number) =>
    sdf.torus(0.074, 0.031).rotateX(tilt).rotateZ(roll).at(BX + dx, y, BZ);
  let coil = ring(0.7, 7, -4, 0);
  coil = coil.smoothUnion(0.012, ring(0.752, -6, 5, 0.004));
  coil = coil.smoothUnion(0.012, ring(0.802, 5, -3, -0.003));
  const tail = sdf.chain(
    [
      [BX + 0.072, 0.7, BZ + 0.02, 0.028],
      [BX + 0.14, 0.64, BZ + 0.1, 0.026],
      [BX + 0.26, 0.606, BZ + 0.2, 0.024],
      [BX + 0.34, 0.602, BZ + 0.36, 0.022],
      [BX + 0.16, 0.6, BZ + 0.5, 0.02],
    ],
    0.016,
  );
  return coil.smoothUnion(0.012, tail);
}

export default defineAsset({
  name: 'dock',
  description:
    'A wooden dock section: plank deck on thick round posts, a mooring post with a coiled rope, and a side ladder.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/dock-mock.jpg',

  build(k) {
    // Deck slab, two stringers, and three joists. One cut-wood body.
    const deck = sdf.box([2, DECK_T, 3], 0.028).at(0, DECK_TOP - DECK_T / 2, 0);
    const stringers = sdf.union(
      sdf.box([0.16, 0.14, 2.55], 0.02).at(-0.42, 0.38, 0.02),
      sdf.box([0.15, 0.13, 2.48], 0.02).at(0.44, 0.375, -0.02),
    );
    const joists = sdf.union(
      sdf.box([1.62, 0.1, 0.14], 0.018).at(0, 0.34, 1.22),
      sdf.box([1.58, 0.1, 0.13], 0.018).at(0, 0.335, 0.0),
      sdf.box([1.6, 0.1, 0.14], 0.018).at(0, 0.34, -1.22),
    );
    k.body('planks', sdf.union(deck, stringers, joists).paintFn(deckPaint), {
      color: '#c9a06a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.024,
      maxError: 0.008,
      maxTriangles: 1600,
      paintWeight: 1.6,
      bump: deckBump,
    });

    // Brown shaft of the mooring post. Separate so deck paint does not wash it.
    k.body(
      'shaft',
      sdf.cylinder(0.055, 0.38, 0.014).at(BX, 0.76, BZ).paintFn((x, y, z) => {
        const g = noise.fbm(x * 8, y * 3, z * 8, 2, 5);
        return mixRgb(rgb('#7a4e2c'), rgb('#5f3d22'), 0.25 + 0.4 * clamp01(-g));
      }),
      {
        color: '#7a4e2c',
        roughness: 0.78,
        metalness: 0,
        detail: 0.014,
        maxTriangles: 220,
        paintWeight: 1,
      },
    );

    // Six log posts. Rounded cylinders sit on y = 0. No ground cut, so reduction stays clean.
    const posts = sdf.union(
      ...POSTS.map(([x, z, r, top]) => sdf.cylinder(r, top, 0.028).at(x, top / 2, z)),
    );
    k.body('posts', posts.paintFn(postPaint), {
      color: '#8a5a35',
      roughness: 0.88,
      metalness: 0,
      detail: 0.032,
      maxError: 0.012,
      maxTriangles: 1200,
      paintWeight: 0.8,
      bump: postBump,
    });

    // Painted foot and cap of the mooring post. The rope tucks under the cap.
    const foot = sdf.sphere(0.11).scale([1.18, 0.5, 1.18]).at(BX, 0.575, BZ);
    const cap = sdf.sphere(0.08).scale([1.16, 0.84, 1.16]).at(BX, 0.9, BZ);
    k.body('bollard', sdf.union(foot, cap).paintFn((x, y) => {
      const up = clamp01((y - 0.55) / 0.42);
      return mixRgb(PAINT_DARK, PAINT_LIGHT, 0.35 + 0.55 * up);
    }), {
      color: '#9a96c4',
      roughness: 0.48,
      metalness: 0.05,
      detail: 0.012,
      maxTriangles: 400,
      paintWeight: 1.5,
    });

    k.body('rope', ropeShape().paintFn((x, y, z) => {
      const twist = 0.5 + 0.5 * Math.sin((y + x + z) * 48);
      return mixRgb(ROPE, ROPE_DARK, 0.15 + 0.45 * twist);
    }), {
      color: '#e8c56a',
      roughness: 0.92,
      metalness: 0,
      detail: 0.008,
      maxError: 0.004,
      maxTriangles: 900,
      paintWeight: 1.5,
      bump: (x, y, z) => 0.0016 * Math.sin(y * 48 + Math.atan2(z - BZ, x - BX) * 2.5),
    });

    // Small ladder on the +X side, between the mid post and the water-end post.
    const z0 = -0.98;
    const z1 = -0.56;
    const rails = sdf.union(
      sdf.capsule([0.92, 0.62, z0], [1.16, 0.05, z0], 0.038),
      sdf.capsule([0.92, 0.62, z1], [1.16, 0.05, z1], 0.038),
      sdf.box([0.38, 0.045, 0.08], 0.016).at(0.8, 0.6, z0),
      sdf.box([0.38, 0.045, 0.08], 0.016).at(0.8, 0.6, z1),
    );
    const rungYs = [0.16, 0.3, 0.44];
    const rungs = sdf.union(
      ...rungYs.map((y) => {
        const t = (0.62 - y) / (0.62 - 0.05);
        const x = 0.92 + t * 0.24;
        return sdf.capsule([x, y, z0], [x, y, z1], 0.032);
      }),
    );
    k.body('ladder', sdf.union(rails, rungs).paintFn((x, y, z) => {
      const g = noise.fbm(x * 6, y * 4, z * 8, 2, 3);
      let c = mixRgb(CUT_DARK, CUT, 0.35 + 0.3 * clamp01(g));
      c = mixRgb(c, rgb('#3a4030'), 0.35 * clamp01((0.22 - y) / 0.22));
      return c;
    }), {
      color: '#a07848',
      roughness: 0.84,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 700,
      paintWeight: 1.4,
    });
  },
});
