import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — clothesline (architecture/building-parts).
 *
 * Role: a cozy village yard prop from the village kit; the player sees it in runs at
 *   128 px, so it must read as one stout little laundry line in silhouette.
 * Size: 2 m between the two walnut posts, 0.9 m tall, standing on y = 0, centered on X;
 *   faces +Z.
 * One idea: a sagging hemp line strung between two round walnut posts, with three
 *   chunky cloth items folded over it — the sag and the cloth rhythm are the signature.
 * Shape language: round wood posts (friendly), soft draped rectangles (calm cloth).
 * Palette: walnut #6b4226 (dark anchors), hemp #c2a06a (line + warm-tan shirt),
 *   soft cream #f0e4cc (bedsheet, light value), muted blue #5e7a8a (trouser, accent).
 *   Value plan: dark posts low, light sheet as the brightest mass, blue as the accent.
 * Materials: walnut wood (roughness 0.8, grain in `bump`), hemp rope (roughness 0.9),
 *   three cloth bodies (roughness 0.9, low-frequency wrinkle `displace`).
 * Detail: primary posts + sagging line; secondary three cloth items folded over the line;
 *   tertiary tie wraps at the posts, wrinkles, weave `bump`. Focal point: the cloth row.
 * Rig/animation: none.
 */

const POST_X = 1.0; // posts at x = -1 and +1
const POST_R = 0.048;
const POST_H = 0.9;

const LINE_R = 0.011;
const LINE_END_Y = 0.862; // line height where it ties at the posts
const LINE_MID_Y = 0.84; // sag mid-height

// Cloth anchor heights follow the sagging line (linear between end and middle).
const lineYAt = (x: number) =>
  x <= 0
    ? LINE_END_Y + (LINE_MID_Y - LINE_END_Y) * ((x + POST_X) / POST_X)
    : LINE_MID_Y + (LINE_END_Y - LINE_MID_Y) * (x / POST_X);

const WALNUT = rgb('#6b4226');
const WALNUT_LIGHT = rgb('#9a6b3e');
const WALNUT_DARK = rgb('#3c2410');

export default defineAsset({
  name: 'clothesline',
  description:
    'A 2 m hemp clothesline strung between two walnut posts, with a shirt, a bedsheet, and trousers hanging.',
  detail: 0.009,
  reference: 'reference/village-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ posts
    // Round walnut posts with a flat foot on y = 0 and a soft dome on top.
    const postAt = (x: number) => {
      const shaft = sdf.capsule([x, POST_R, 0], [x, POST_H - POST_R, 0], POST_R);
      return shaft.intersect(sdf.halfSpace([0, -1, 0], 0));
    };
    const posts = sdf.union(postAt(-POST_X), postAt(POST_X));

    // Sun-lit top, damp shaded foot, broad low-frequency tone so it reduces cleanly.
    const wood = posts.paintFn((x, y, z) => {
      const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
      const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 3);
      const t = clamp01(y / POST_H);
      const base = mixRgb(WALNUT_LIGHT, WALNUT, 0.25 + 0.5 * patch);
      const shade = 1 - t;
      return mixRgb(base, WALNUT_DARK, clamp01(0.15 + 0.75 * shade * shade));
    });

    k.body('posts', wood, {
      color: '#6b4226',
      roughness: 0.8,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      maxTriangles: 420,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 24, y * 7, z * 24, 2),
    });

    // ------------------------------------------------------------------ line
    // A gently sagging hemp line, tied to each post just below its dome.
    const line = sdf.chain(
      [
        [-0.97, LINE_END_Y, 0, LINE_R],
        [-0.5, 0.847, 0, LINE_R],
        [0, LINE_MID_Y, 0, LINE_R],
        [0.5, 0.847, 0, LINE_R],
        [0.97, LINE_END_Y, 0, LINE_R],
      ],
      0.035,
    );
    // Wraps where the line ties around each post.
    const wrap = (x: number) =>
      sdf
        .torus(POST_R + LINE_R * 0.5, LINE_R * 1.15)
        .rotateX(90)
        .at(x, LINE_END_Y, 0);

    k.body('rope', sdf.union(line, wrap(-POST_X), wrap(POST_X)), {
      color: '#c2a06a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 300,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------------ cloth
    // Each item is a rounded fold bar draped over the line with a panel hanging
    // from it. The fold radius swallows the line, so nothing floats.
    const clothBump = (x: number, y: number, z: number) =>
      0.0013 * noise.fbm(x * 60, y * 60, z * 60, 2);

    // Warm-tan shirt: fold bar, torso panel, two short sleeves drooping outward.
    // Built centered on x = 0, mirrored for the sleeves, then placed on the line.
    const shirtY = lineYAt(-0.55);
    const shirtFold = sdf
      .capsule([-0.15, 0, 0], [0.15, 0, 0], 0.023)
      .displace(0.0025, (x, y, z) => noise.fbm(x * 14, y * 10, z * 14, 2));
    const shirtTorso = sdf.box([0.27, 0.3, 0.02], 0.009).at(0, -0.12, 0);
    const shirtSleeve = sdf.capsule([-0.12, -0.02, 0], [-0.24, -0.09, 0], 0.034);
    const shirt = sdf
      .smoothUnion(0.02, shirtFold, shirtTorso)
      .smoothUnion(0.02, shirtSleeve)
      .mirror('x')
      .displace(0.0035, (x, y, z) => noise.fbm(x * 11, y * 9, z * 11, 2))
      .at(-0.55, shirtY, 0);

    k.body('shirt', shirt, {
      color: '#c2a06a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxTriangles: 400,
      bump: clothBump,
    });

    // Soft-cream bedsheet: the biggest, brightest cloth mass.
    const sheetY = lineYAt(0.02);
    const sheetFold = sdf.capsule([-0.2, sheetY, 0], [0.24, sheetY, 0], 0.028);
    const sheetPanel = sdf.box([0.4, 0.3, 0.018], 0.009).at(0.02, sheetY - 0.125, 0);
    const sheet = sdf
      .smoothUnion(0.022, sheetFold, sheetPanel)
      .displace(0.004, (x, y, z) => noise.fbm(x * 9, y * 7, z * 9, 2))
      .paintFn((x, y, z) => {
        // Subtle laundry shading: slightly warm shadow toward the hem.
        const hem = Math.min(1, Math.max(0, (sheetY - 0.18 - y) / 0.12));
        return mixRgb(rgb('#f0e4cc'), rgb('#d9c8a4'), 0.45 * hem);
      });

    k.body('sheet', sheet, {
      color: '#f0e4cc',
      roughness: 0.92,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxTriangles: 260,
      bump: clothBump,
    });

    // Muted-blue trousers: waistband fold with two legs hanging and a gap between.
    const trouserY = lineYAt(0.58);
    const trouserFold = sdf.capsule([-0.15, 0, 0], [0.15, 0, 0], 0.02);
    const leg = sdf.box([0.115, 0.28, 0.018], 0.008).at(-0.0725, -0.13, 0);
    const crotch = sdf.box([0.06, 0.09, 0.018], 0.008).at(0, -0.05, 0);
    const trouser = sdf
      .smoothUnion(0.018, trouserFold, leg)
      .smoothUnion(0.015, crotch)
      .mirror('x')
      .displace(0.003, (x, y, z) => noise.fbm(x * 12, y * 9, z * 12, 2))
      .at(0.58, trouserY, 0);

    k.body('trouser', trouser, {
      color: '#5e7a8a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxTriangles: 300,
      bump: clothBump,
    });
  },
});
