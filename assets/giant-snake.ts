import { rgb } from '../src/index.js';
import { serpentAsset } from './parts/serpent-kind.js';

/**
 * Giant snake — Chibi Quest monster (catalog `monsters/beast/giant-snake`), a big friendly-looking
 * snake about 0.7 m to the top of the head, faces +Z. Target: docs/monster-mockups/giant-snake_001.jpg
 * (made with mmx).
 *
 * The serpent of `assets/parts/serpent-kind.ts` (a spine path, belly plates, the default snake head,
 * rig, and clips) as one coil on the ground with the neck rising from the front of the coil: a big
 * round head with big glossy black eyes, a forked pink tongue, a pale yellow belly with plate lines,
 * and dark green diamonds along the back.
 * Role: a jungle and swamp beast; the raised head and the yellow belly read at 128 px.
 * Palette (60/30/10): green #5aa04a body; pale yellow #f2e4a0 belly; dark green diamonds and a pink
 *   tongue as the accent.
 */
export default serpentAsset({
  name: 'giant-snake',
  description: 'Chibi giant snake monster: a green snake in one coil with the neck raised, a big round head, big glossy black eyes, a forked pink tongue, a pale yellow belly with plate lines, and dark green diamonds along the back; serpent rig with a jaw and a tongue.',
  reference: 'docs/monster-mockups/giant-snake_001.jpg',
  variants: {
    body: { green: '#5aa04a', sand: '#c09a5a', violet: '#7a62b0' },
    belly: { yellow: '#f2e4a0', cream: '#f0e8d4', peach: '#f4c8a8' },
    eyes: { black: '#161214', brown: '#3a2416', plum: '#341e40' },
  },
  presets: {
    desert: { body: 'sand', belly: 'cream', eyes: 'brown' },
    dusk: { body: 'violet', belly: 'peach', eyes: 'plum' },
  },
  path: [
    [-0.05, 0.02, 0.25, 0.02],
    [-0.2, 0.034, 0.17, 0.034],
    [-0.29, 0.05, -0.03, 0.05],
    [-0.18, 0.064, -0.24, 0.064],
    [0.06, 0.072, -0.28, 0.072],
    [0.24, 0.075, -0.1, 0.075],
    [0.21, 0.075, 0.08, 0.075],
    [0.07, 0.09, 0.15, 0.072],
    [0.02, 0.22, 0.18, 0.066],
    [0, 0.35, 0.09, 0.062],
    [0, 0.46, 0.1, 0.06],
  ],
  root: 5,
  face: { r: 0.16, eyeR: 0.05 },
  paint(body, s) {
    // Dark diamonds along the middle of the back, one every 0.1 m, smaller toward the tail tip.
    const dark = s.tone('body', '#2e5e2a');
    return body.paintFn((x, y, z, c) => {
      const a = s.along(x, y, z);
      if (a.side < 0 || a.t < 0.04 || a.t > 0.985) return c;
      const u = (a.s / 0.1) % 1;
      const d = Math.abs(u - 0.5) * 2 + (1 - a.side) * 1.6;
      return d < 0.75 ? rgb(dark) : c;
    });
  },
});
