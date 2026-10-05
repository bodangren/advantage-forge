import { profile, sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { bellySpots } from './parts/bird-extras.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Falcon — Chibi Quest wildlife (catalog `wildlife/birds/falcon`), a peregrine falcon about 0.42 m
 * tall, faces +Z. Target: docs/wildlife-mockups/falcon_001.jpg (made with mmx).
 *
 * The bird of `assets/parts/bird-kind.ts` at 0.48 of its size, as a peregrine falcon: a slate
 * blue-grey back, head, and wings, a cream face and chest with small dark spots, a dark stripe
 * under each eye, yellow eye rings, a short hooked grey beak, and yellow feet.
 * Role: a hunting bird and a hero's falconry companion; the dark cheek stripes and the slate hood
 *   read at 128 px.
 * Palette (60/30/10): slate #64748a back and wings; cream #f2ead8 face and chest; dark slate
 *   stripes and spots; yellow eye rings and feet as the accent.
 */
export default scaleAsset(
  birdAsset({
    name: 'falcon',
    description: 'Chibi falcon: a cream falcon with a sage-grey hood and wings, a cream face, big yellow eyes with a dark stripe out from each eye, a hooked dark beak on a yellow cere, upper lids, a few short dark dashes on the chest, long narrow wings, and short yellow legs; bird rig with wings.',
    reference: 'docs/wildlife-mockups/falcon_001.jpg',
    variants: {
      body: { cream: '#f2ead8', buff: '#e8d4b0', pale: '#f4f2ec' },
      head: { sage: '#7c8c84', blue: '#7a9298', slate: '#5e6c80', brown: '#6a5040' },
      wings: { sage: '#74867e', blue: '#728a90', slate: '#56647a', brown: '#5e4636' },
      eyes: { yellow: '#e8c020', amber: '#d89020', brown: '#5a3218' },
    },
    presets: {
      peregrine: { body: 'pale', head: 'slate', wings: 'slate', eyes: 'brown' },
      lanner: { body: 'buff', head: 'brown', wings: 'brown', eyes: 'amber' },
    },
    colors: { belly: '#f6f0e2', flight: '#5e6e68', eyeRim: '#2a2a2e' },
    body: [0.19, 0.21, 0.18],
    head: 0.16,
    beak: 'short',
    beakScale: 0.78,
    beakDroop: 30,
    beakColors: ['#e8b020', '#e8b020'],
    beakTip: '#3a3c42',
    mouth: false,
    brows: false,
    eyeScale: 1.25,
    featherBump: 0.003,
    featherOn: { body: false, head: false },
    walkBob: 0.5,
    wingRest: -124,
    wingTurn: 52,
    wingOut: 0.07,
    wingScale: 0.72,
    legLength: 0.3,
    wingStyle: 'paddle',
    neckScale: 1.35,
    cheeks: 0,
    wingSlim: 0.8,
    paint(plumage, b) {
      const { HEAD_C, HR } = b.joints;
      const cream = b.tint.body;
      const dark = b.tone('head', '#2a2a2e', 0.3);
      // A cream face and cheeks round the eyes under the sage hood, which comes down to a point at the beak.
      const e = b.eye.at;
      const es = b.eye.scale;
      const face = sdf
        .smoothUnion(0.02, sdf.ellipsoid([HR * 1.02, HR * 0.62, HR]).at(0, HEAD_C[1] - HR * 0.42, HEAD_C[2] + HR * 0.4), sdf.sphere(HR * 0.42).at(e[0] + HR * 0.08, e[1], e[2]).mirror('x'))
        .smoothSubtract(0.01, sdf.extrude(profile.polygon([[-HR * 0.3, HR * 0.7], [HR * 0.3, HR * 0.7], [0, -HR * 0.36]], { smooth: false }), 1).at(0, HEAD_C[1], 0));
      // The dark stripe: a line from the outer corner of each eye out to the side of the head.
      const front = sdf.halfSpace([0, 0, -1], -HEAD_C[2]);
      const lid = (drop: number) =>
        sdf
          .cylinder(0.04 * es, 1)
          .rotateX(90)
          .at(e[0], e[1], 0)
          .intersect(sdf.halfSpace([-0.28, -1, 0], -(e[1] + 0.016 * es - drop) - 0.28 * e[0]))
          .mirror('x')
          .intersect(front);
      const stripe = sdf.box([0.05 * es, 0.013 * es, 1], 0.004).at(e[0] + 0.055 * es, e[1] + 0.006 * es, 0).mirror('x').intersect(front);
      return plumage
        .paintWhere(face, cream, 0.012)
        .paintWhere(stripe, dark, 0.004)
        .paintWhere(sdf.cylinder(0.038 * es, 1).rotateX(90).at(e[0], e[1], 0).mirror('x').intersect(front), '#2a2a2e', 0.002)
        .paintWhere(sdf.cylinder(0.031 * es, 1).rotateX(90).at(e[0], e[1], 0).mirror('x').intersect(front), b.tint.eye, 0.002)
        .paintWhere(sdf.cylinder(0.017 * es, 1).rotateX(90).at(e[0] - 0.003 * es, e[1] - 0.002 * es, 0).mirror('x').intersect(front), '#141012', 0.002)
        .paintWhere(sdf.sphere(0.011 * es).at(e[0] + 0.011 * es, e[1] + 0.006 * es, e[2]).mirror('x'), '#ffffff', 0.002)
        // Upper lids in the hood color over the top of each eye, lower at the inner end (a keen
        // look), with a dark line at the lid edge.
        .paintWhere(lid(0.004), '#2a2a2e', 0.002)
        .paintWhere(lid(0), b.tint.head, 0.002);
    },
    extra(k, b) {
      const { BODY_C, B } = b.joints;
      // A few short dark dashes: a row of five and two below.
      const spots = sdf.union(bellySpots(b, 1, 5, 0.006, [BODY_C[1] - B[1] * 0.1, BODY_C[1] - B[1] * 0.1], 2.8), bellySpots(b, 1, 2, 0.006, [BODY_C[1] - B[1] * 0.55, BODY_C[1] - B[1] * 0.55], 2.8));
      k.body('spots', spots, { color: b.tone('wings', '#3a4456', 0.6), roughness: 0.8, detail: 0.003 });
    },
  }),
  0.48,
);
