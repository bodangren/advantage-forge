import { noise, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Pack goat — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/pack-goat`), about 0.9 m to
 * the top of the horns, faces +Z. Target: docs/wildlife-mockups/pack-goat_001.jpg (made with mmx).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 0.95 of its size, as a mountain pack goat: big ridged horns that curl back, down, and forward
 * beside the head, a long grey beard, drooping ears, a grey-brown coat, and a red pad with a canvas
 * saddle bag on each side; no fawn spots, bib, eye patches, or antlers.
 * Role: the traveller's pack animal on mountain paths; the curled horns and the bags read at
 *   128 px.
 * Palette (60/30/10): grey coat #807b75; tan horns #b8946a; canvas bags #d8b878; a red pad #b0403a
 *   as the accent; black hooves.
 */

export default scaleAsset(
  deerAsset({
    name: 'pack-goat',
    description: 'Chibi pack goat: a big round head with glossy eyes, big curled ridged horns, a long grey beard, drooping ears, a grey-brown coat, and a red pad with two canvas saddle bags; quadruped rig.',
    reference: 'docs/wildlife-mockups/pack-goat_001.jpg',
    variants: {
      fur: { grey: '#807b75', brown: '#8a6a4c', white: '#e8e0d0', black: '#3e3834' },
      eyes: { brown: '#5a3418', amber: '#a87a2a' },
      pad: { red: '#b0403a', blue: '#4a6aa0', green: '#5a8a4a' },
    },
    presets: {
      brown: { fur: 'brown', eyes: 'amber', pad: 'green' },
      white: { fur: 'white', eyes: 'brown', pad: 'blue' },
      black: { fur: 'black', eyes: 'amber', pad: 'red' },
    },
    colors: { cream: '#b0aaa0', earInner: '#6a6460', nose: '#2a2624', mouth: '#4a3a34', hoof: '#221c1a' },
    mask: false,
    bib: false,
    spots: false,
    antlers: false,
    earTilt: -122,
    earTurn: 28,
    bulk: 0.05,
    headProbes: [[0.19, 0.78, 0.04], [-0.19, 0.78, 0.04], [0.16, 0.97, 0.0], [-0.16, 0.97, 0.0], [0, 0.44, 0.29]],
    extra(k, deer) {
      // Horns: thick ridged spirals, back, down, and forward beside the head.
      const BASE = [0.05, 0.83, 0.13] as const;
      const horn = sdf
        .chain(
          [[0.05, 0.83, 0.13, 0.042], [0.09, 0.93, 0.1, 0.04], [0.14, 0.97, 0.02, 0.036], [0.175, 0.89, -0.03, 0.031], [0.19, 0.79, 0.01, 0.025], [0.18, 0.75, 0.08, 0.016]],
          0.015,
        )
        .paintFn((x, y, z, c) => {
          const d = Math.hypot(x - BASE[0], y - BASE[1], z - BASE[2]);
          const ring = Math.floor(d / 0.024) % 2 === 1 ? 0.8 : 1;
          return [c[0] * ring, c[1] * ring, c[2] * ring];
        });
      k.body('horns', horn.mirror('x'), { color: '#b8946a', roughness: 0.5, detail: 0.003, bone: 'head' });
      const hair = (s: sdf.Shape) => s.displace(0.003, (x, y, z) => noise.fbm(x * 70, y * 30, z * 70, 2));
      const beard = hair(sdf.chain([[0, 0.58, 0.27, 0.034], [0, 0.52, 0.285, 0.03], [0, 0.45, 0.29, 0.012]], 0.015));
      k.body('beard', beard, { color: deer.tone('fur', '#aaa59e', 0.6), roughness: 0.9, detail: 0.003, bone: 'jaw' });
      // The pack: a pad over the back and a canvas bag with a flap and a buckle on each side.
      const trunk = deer.trunk;
      const pad = trunk.round(0.01).smoothIntersect(0.008, sdf.box([0.4, 0.15, 0.2], 0.03).at(0, 0.47, -0.07));
      k.body('pad', pad, { color: k.tint('pad'), roughness: 0.85, detail: 0.004 });
      const side = sdf.raycast(trunk, [1, 0.4, -0.07], [-1, 0, 0])!;
      const bx = side[0] + 0.045;
      const bag = sdf.box([0.075, 0.13, 0.16], 0.028).at(bx, 0.385, -0.07);
      const flap = sdf.box([0.4, 0.055, 0.4]).at(bx, 0.43, -0.07);
      const buckle = sdf.box([0.012, 0.022, 0.02], 0.004).at(bx + 0.038, 0.4, -0.07);
      k.body('bags', bag.paintWhere(flap, '#b8985a', 0.004).mirror('x'), { color: '#d8b878', roughness: 0.85, detail: 0.004, bone: 'spine' });
      k.body('buckles', buckle.mirror('x'), { color: '#c8a040', roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'spine' });
    },
  }),
  0.95,
);
