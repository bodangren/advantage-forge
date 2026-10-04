import { motion, profile, sdf } from '../src/index.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Kitsune — Chibi Quest monster (catalog `monsters/fey-and-spirit/kitsune`), a fox spirit about
 * 0.8 m to the ear tips, faces +Z. Target: docs/monster-mockups/kitsune_001.jpg (made with mmx from
 * the dire wolf mockup).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * as a kitsune: orange fur with white cheeks, muzzle, and chest; a calm closed smile (no brows, no
 * forelock, no upper teeth); black ear tips and black paws; red marks on the forehead (a triangle
 * and dots) and white marks over the eyes; gold eyes; and three white-tipped tails (the wolf's
 * tail and two more on their own bones that sway in every clip).
 * Role: a fey trickster spirit; the three tails and the forehead marks read at 128 px.
 * Palette (60/30/10): orange #f07a2a; white #fff8f0; black tips #2a1e1a; red marks #e0302a; gold
 *   eyes as the accent.
 * Bodies added: tails (tagged to `tail.L` and `tail.R`).
 */

const RED = '#e0302a';

export default wolfAsset({
  name: 'kitsune',
  description: 'Chibi kitsune monster: an orange fox spirit with a white muzzle and chest, a calm smile, gold eyes, black ear tips and paws, red marks on the forehead, and three fluffy white-tipped tails.',
  reference: 'docs/monster-mockups/kitsune_001.jpg',
  variants: {
    fur: { orange: '#f07a2a', silver: '#c8c4cc', ember: '#d8502a' },
    markings: { white: '#fff8f0', cream: '#f4e4c8', frost: '#eef2f8' },
    eyes: { gold: '#f0c040', amber: '#f08a20', violet: '#a070e0' },
  },
  presets: {
    silver: { fur: 'silver', markings: 'frost', eyes: 'violet' },
    ember: { fur: 'ember', markings: 'cream', eyes: 'amber' },
  },
  colors: { furLight: '#fff4ea', furDark: '#2a1e1a', earInner: '#fff0e4', eyeRim: '#a8700c', nose: '#1a1214', claw: '#2a1e1a' },
  earScale: 1.1,
  brows: false,
  forelock: false,
  smile: true,
  paint(fur, t) {
    // Black ear tips and paws; a red triangle and three dots on the forehead; white marks over
    // the eyes.
    const through = (p: ReturnType<typeof profile.circle>) => sdf.extrude(p, 0.3).at(0, 0, 0.3);
    const triangle = through(
      profile.polygon([
        [-0.026, 0.615],
        [0.026, 0.615],
        [0, 0.572],
      ]),
    );
    const dots = sdf.union(
      through(profile.circle(0.009)).at(0, 0.638, 0),
      through(profile.circle(0.007)).at(0.03, 0.628, 0),
      through(profile.circle(0.007)).at(-0.03, 0.628, 0),
    );
    const brows = sdf.union(...[0.078, -0.078].map((x) => through(profile.circle(0.016)).scale([1.4, 0.8, 1]).at(x, 0.598, 0)));
    return fur
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.735), '#2a1e1a', 0.006)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.085), t.furDark, 0.01) // black paws
      .paintWhere(sdf.union(triangle, dots), RED, 0.002)
      .paintWhere(brows, t.markings, 0.003);
  },
  bones: {
    'tail.L': { parent: 'hips', at: [0.03, 0.31, -0.27], tail: [0.3, 0.5, -0.36] },
    'tail.R': { parent: 'hips', at: [-0.03, 0.31, -0.27], tail: [-0.3, 0.5, -0.36] },
  },
  extra(k, w) {
    // Two more bushy tails that fan out to the sides, with white tips.
    const TIP: [number, number, number] = [0.3, 0.5, -0.36];
    const tail = sdf
      .chain(
        [
          [0.03, 0.31, -0.28, 0.038],
          [0.11, 0.36, -0.35, 0.066],
          [0.21, 0.43, -0.38, 0.072],
          [TIP[0], TIP[1], TIP[2], 0.012],
        ],
        0.03,
      )
      .scale([1, 1, 0.8])
      .paintWhere(sdf.sphere(0.1).at(TIP[0], TIP[1], TIP[2] * 0.8).intersect(sdf.halfSpace([-0.6, -0.55, 0], -0.36)), w.tint.markings, 0.02)
      .bone('tail.L');
    k.body('tails', tail.mirror('x'), { color: w.tint.fur, roughness: 0.85 });
  },
  pose(clip, p) {
    // The side tails sway a little out of step with each other, faster when it runs.
    const n = clip === 'run' ? 4 : clip === 'walk' ? 2 : 1;
    const sway = (o: number) => motion.wave(p, n, o);
    const still = clip === 'death' ? 0.3 : 1;
    return {
      'tail.L': { rotate: [4 * sway(0.1) * still, 10 * sway(0) * still, 8 * sway(0.25) * still] },
      'tail.R': { rotate: [4 * sway(0.6) * still, -10 * sway(0.5) * still, -8 * sway(0.75) * still] },
    };
  },
});
