import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note: wooden pier section (architecture/structure/pier).
 * Role: village shore prop, seen small. 2 m wide (X), 4 m long (Z), deck top y 1.2, faces +Z.
 * One idea: a chunky plank deck on fat round posts with ball-capped corner posts and a straw
 * rope rail. Shape language: square deck, round posts and balls, soft rope.
 * Palette: pale planks #c9a06a / honey #b5814a, posts #8a5a35 / #6b4226, straw rope #e0bb60.
 * Materials: planks, posts, caps, rope. Focal point: rope coil near the front-left corner.
 */
const PLANK = rgb('#c9a06a');
const HONEY = rgb('#b5814a');
const WALNUT = rgb('#6b4226');
const POST = rgb('#8a5a35');
const ROPE = rgb('#e0bb60');
const ROPE2 = rgb('#c8a86b');
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const DECK = 1.2;
const PX = 0.85;
const CORNERS: Array<[number, number]> = [[-PX, 1.7], [PX, 1.7], [-PX, -1.7], [PX, -1.7]];
const CAP_Y = 1.72;
const COIL: [number, number] = [-0.55, 1.35];

export default defineAsset({
  name: 'pier',
  description: 'A wooden pier section on round posts with ball-capped corners, a rope rail, and a rope coil.',
  detail: 0.01,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/pier-mock.jpg',

  build(k) {
    const planks = [];
    for (let i = 0; i < 11; i++) {
      const x = (i - 5) * 0.185;
      const len = 4.0 - 0.03 * (i % 3);
      planks.push(sdf.box([0.172, 0.11, len], 0.025).at(x, DECK - 0.05, ((i % 2) * 2 - 1) * 0.01));
    }
    const beams = sdf.union(
      sdf.box([0.15, 0.15, 3.9], 0.02).at(-0.8, DECK - 0.175, 0),
      sdf.box([0.15, 0.15, 3.9], 0.02).at(0.8, DECK - 0.175, 0),
    );
    k.body('planks', sdf.union(...planks, beams).paintFn((x, y, z) => {
      const pi = Math.round(x / 0.185);
      const t = noise.random(pi, 3, 1);
      let c = mixRgb(PLANK, HONEY, 0.15 + 0.6 * t);
      const g = noise.fbm(x * 6, y * 5, z * 1.5, 3);
      c = mixRgb(c, WALNUT, clamp01(-g) * 0.25);
      if (y < DECK - 0.1) c = mixRgb(c, WALNUT, 0.45);
      return c;
    }), { color: '#c9a06a', roughness: 0.85, metalness: 0, detail: 0.01, maxError: 0.003, maxTriangles: 2300,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 5, y * 6, z * 1.5, 2) });

    const posts = [];
    for (const x of [-PX, PX]) for (const z of [-1.7, 0, 1.7]) posts.push(sdf.cylinder(0.13, 1.1, 0.03).at(x, 0.55, z));
    for (const [x, z] of CORNERS) posts.push(sdf.cylinder(0.13, 0.65, 0.03).at(x, 1.425, z));
    posts.push(sdf.cylinder(0.1, 0.5, 0.03).at(PX, 1.35, 0));
    for (const z of [-1.7, 1.7]) for (const s of [-1, 1]) {
      const zi = z > 0 ? 1 : -1;
      posts.push(sdf.capsule([s * PX, 0.15, z], [s * PX, 0.95, z - zi * 0.7], 0.05).at(0, 0, 0));
    }
    k.body('posts', sdf.union(...posts).paintFn((x, y, z) => {
      const g = noise.fbm(x * 6, y * 1.5, z * 6, 2);
      return mixRgb(POST, WALNUT, clamp01(0.35 - g) * 0.7 + clamp01((0.25 - y) / 0.25) * 0.25);
    }), { color: '#8a5a35', roughness: 0.85, metalness: 0, detail: 0.01, maxTriangles: 1500,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 9, y * 2.5, z * 9, 2) });

    const caps = sdf.union(...CORNERS.map(([x, z]) =>
      sdf.union(sdf.box([0.28, 0.14, 0.28], 0.04).at(x, CAP_Y + 0.07, z),
        sdf.sphere(0.13).at(x, CAP_Y + 0.25, z)),
    ), sdf.sphere(0.11).at(PX, 1.62, 0));
    k.body('caps', caps.paintFn((x, y, z) => mixRgb(HONEY, PLANK, clamp01((y - 1.7) / 0.5) * 0.4)), {
      color: '#b5814a', roughness: 0.8, metalness: 0, detail: 0.008, maxTriangles: 700 });

    const ry = 1.62;
    const rail = sdf.chain([
      [PX, 1.65, 1.7, 0.03], [PX, 1.5, 0.85, 0.03], [PX, 1.58, 0, 0.03],
      [PX, 1.5, -0.85, 0.03], [PX, 1.65, -1.7, 0.03],
    ], 0.02);
    const [cx, cz] = COIL;
    const ring = (y: number, dx: number) => sdf.torus(0.11, 0.035).at(cx + dx, y, cz);
    const coil = sdf.union(ring(DECK + 0.035, 0), ring(DECK + 0.085, 0.006), ring(DECK + 0.135, -0.004),
      sdf.chain([[cx + 0.11, DECK + 0.04, cz], [cx + 0.3, DECK + 0.03, cz - 0.1], [cx + 0.45, DECK + 0.03, cz - 0.3, 0.025]].map((p) => [p[0]!, p[1]!, p[2]!, p[3] ?? 0.03]), 0.01));
    void ry;
    k.body('rope', sdf.union(rail, coil).paintFn((x, y, z) =>
      mixRgb(ROPE, ROPE2, 0.2 + 0.5 * (0.5 + 0.5 * Math.sin((x + y + z) * 45)))), {
      color: '#e0bb60', roughness: 0.92, metalness: 0, detail: 0.008, maxTriangles: 1200,
      bump: (x, y, z) => 0.0015 * Math.sin((x + y + z) * 45) });
  },
});
