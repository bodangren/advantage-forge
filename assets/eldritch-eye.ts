import { mixRgb, noise, rgb, sdf } from '../src/index.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Eldritch eye — Chibi Quest monster (catalog `monsters/abyssal-and-cosmic/eldritch-eye`), a
 * floating eyeball about 0.8 m tall, faces +Z. Target: docs/monster-mockups/eldritch-eye_001.jpg
 * (made with mmx from the ghost mockup).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the wisp body, stubby arms, tail, rig, and the
 * hover clips) with one big eyeball in place of the egg head and no face: a taupe-grey ball
 * whose front is a white eye with a dark rim, faint red veins, a purple iris with a raised ring,
 * and a big black pupil; under it a dark violet wisp body like a ragged cloak, with taupe arms.
 * Role: a watcher of the abyss that floats and stares; the one huge eye reads at 128 px.
 * Palette (60/30/10): taupe-grey ball and arms #a8988e; dark violet cloak #3a2a4e; a white eye;
 *   a purple iris #8a5ac8 and red veins as the accent; a black pupil.
 * Bodies added: iris-ring (rigid on the head).
 */

const C: [number, number, number] = [0, 0.53, 0];
const R = 0.272;
const FRONT: [number, number, number] = [C[0], C[1], C[2] + R];

export default spiritAsset({
  name: 'eldritch-eye',
  description: 'Chibi eldritch eye monster: one huge floating eyeball with a white eye, red veins, a purple iris with a raised ring, and a big black pupil, on a dark violet ragged wisp body with two stubby arms.',
  reference: 'docs/monster-mockups/eldritch-eye_001.jpg',
  variants: {
    body: { taupe: '#a8988e', bone: '#c8bca8', slate: '#6a7488' },
    element: { violet: '#3a2a4e', black: '#22202a', moss: '#2e3a2a' },
    eyes: { purple: '#8a5ac8', amber: '#e0a020', green: '#5ab86a' },
  },
  presets: {
    bone: { body: 'bone', element: 'black', eyes: 'amber' },
    bog: { body: 'slate', element: 'moss', eyes: 'green' },
  },
  face: false,
  head: {
    roughness: 0.35,
    shape: sdf.sphere(R).at(...C),
    paint(ball, s) {
      const at = (r: number) => sdf.sphere(r).at(...FRONT);
      const vein = rgb('#d86a7a');
      const veins = (x: number, y: number, z: number, base: readonly [number, number, number]) => {
        const d = Math.hypot(x - FRONT[0], y - FRONT[1], z - FRONT[2]);
        if (d < 0.13 || d > 0.205) return base;
        const line = Math.abs(noise.noise3(x * 26, y * 26, z * 26));
        return line < 0.035 ? mixRgb(base, vein, 0.8 * (1 - line / 0.035)) : base;
      };
      return ball
        .paintWhere(at(0.218), s.tone('body', '#4a4058'), 0.004)
        .paintWhere(at(0.205), '#f6f2ee', 0.004)
        .paintFn(veins)
        .paintWhere(at(0.118), s.tint.glow, 0.004)
        .paintWhere(at(0.08), '#121016', 0.003)
        .paintWhere(sdf.sphere(0.024).at(0.06, 0.6, 0.262), '#ffffff', 0.003);
    },
  },
  wisp: {
    roughness: 0.7,
    paint: (wisp, s) => {
      const dark = rgb(s.tone('element', '#241a32'));
      const arm = rgb(s.tint.body);
      return wisp.paintFn((x, y, _z, c) => {
        const low = mixRgb(c, dark, Math.max(0, Math.min(1, (0.2 - y) / 0.12)) * 0.7);
        return y > 0.24 ? mixRgb(low, arm, Math.max(0, Math.min(1, (Math.abs(x) - 0.15) / 0.03))) : low;
      });
    },
  },
  extra: {
    build(k, s) {
      // A raised ring around the iris, sitting on the ball.
      const z = Math.sqrt(R * R - 0.1 * 0.1);
      const ring = sdf
        .torus(0.1, 0.016)
        .displace(0.004, (x, _y, z) => Math.sin(Math.atan2(z, x) * 14))
        .rotateX(90)
        .at(C[0], C[1], C[2] + z);
      k.body('iris-ring', ring.bone('head'), { color: s.tone('eyes', '#6a3aa8'), roughness: 0.3, detail: 0.003 });
    },
  },
});
