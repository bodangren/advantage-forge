import { sdf } from '../src/index.js';
import { octopusAsset } from './parts/octopus-kind.js';

/**
 * Kraken — Chibi Quest monster (catalog `monsters/beast/kraken`), a young kraken about 0.68 m tall,
 * faces +Z. Target: docs/monster-mockups/kraken_001.jpg (made with mmx from the eldritch horror
 * mockup).
 *
 * The octopus of `assets/parts/octopus-kind.ts` (a head dome, tentacles on their own bones, a face,
 * rig, and clips) on the sea floor: a big round pink-red head with glossy black eyes, rosy cheeks,
 * and a small smile; a wavy purple collar under the head; and eight thick purple tentacles that
 * spread on the ground and curl up at the pale tips.
 * Role: a beast of the deep sea and the harbors; the round head and the spread of tentacles read at
 *   128 px.
 * Palette (60/30/10): pink-red #d04a6a head; purple #7a4aa8 tentacles and collar; pale #f2e2ec tips
 *   and rosy cheeks as the accent.
 * Bodies added: collar (rigid on `body`).
 */
const ground = (u: number, up: number, r: number, curl: number): [number, number, number][] => [
  [0.07, 0.19, r],
  [0.16, 0.1, r * 0.92],
  [0.26 * u, 0.062, r * 0.8],
  [0.35 * u, 0.06 + 0.03 * curl, r * 0.62],
  [0.4 * u, 0.1 + up, r * 0.45],
];

export default octopusAsset({
  name: 'kraken',
  description: 'Chibi kraken monster: a young kraken with a big round pink-red head, glossy black eyes, rosy cheeks, a small smile, a wavy purple collar, and eight thick purple tentacles that spread on the ground and curl up at the pale tips; octopus rig.',
  reference: 'docs/monster-mockups/kraken_001.jpg',
  variants: {
    body: { rose: '#d04a6a', coral: '#e8705a', teal: '#3aa0a0' },
    arms: { purple: '#7a4aa8', plum: '#8a3a6a', navy: '#3a4a8a' },
    eyes: { black: '#141018', brown: '#3a2416', blue: '#1a2a50' },
  },
  presets: {
    reef: { body: 'coral', arms: 'plum', eyes: 'brown' },
    deep: { body: 'teal', arms: 'navy', eyes: 'blue' },
  },
  head: { at: [0, 0.45, 0], r: [0.22, 0.21, 0.21] },
  base: [0, 0.22, 0],
  tentacles: [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => ({
    angle,
    // The front tentacles are a little shorter, so the face stays clear; the tips curl up.
    points: ground(Math.abs(Math.cos((angle * Math.PI) / 180)) > 0.9 ? 0.9 : 1, 0.03 + 0.03 * (i % 3), 0.068, i % 2),
  })),
  eyes: { r: 0.032, x: 0.34, y: 0.02 },
  smile: { r: 0.06, width: 0.012 },
  grounded: true,
  colors: { mouth: '#3a1424' },
  paint(skin, o) {
    const arms = o.tone('arms', '#7a4aa8');
    const tip = o.tone('arms', '#f2e2ec', 0.2);
    const [hx, hy, hz] = [0, 0.45, 0];
    // The tentacles below the head in the arm color, with pale tips; rosy cheeks under the eyes.
    const tips = sdf.union(...o.arms.map((a) => sdf.sphere(a.points[a.points.length - 1]![3] * 2.2).at(...a.tip)));
    const cheeks = sdf.union(
      sdf.capsule([hx + 0.12, hy - 0.035, hz], [hx + 0.12, hy - 0.035, hz + 0.5], 0.03),
      sdf.capsule([hx - 0.12, hy - 0.035, hz], [hx - 0.12, hy - 0.035, hz + 0.5], 0.03),
    );
    return skin
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.25), arms, 0.02)
      .paintWhere(tips, tip, 0.01)
      .paintWhere(cheeks.intersect(sdf.halfSpace([0, -1, 0], -0.3)), o.tone('body', '#f08a9a', 0.5), 0.008);
  },
  extra(k, o) {
    // A wavy collar ring under the head, where the tentacles begin.
    const collar = sdf
      .torus(0.17, 0.035)
      .displace(0.012, (x, _y, z) => Math.sin(Math.atan2(z, x) * 10))
      .scale([1, 0.8, 1])
      .at(0, 0.265, 0);
    k.body('collar', collar.bone('body'), { color: o.tone('arms', '#9a5ab0'), roughness: 0.5 });
  },
});
