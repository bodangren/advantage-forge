import { sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Chicken — Chibi Quest wildlife (catalog `wildlife/land/chicken`), a plump hen about 0.42 m tall
 * to the comb, faces +Z. Target: docs/wildlife-mockups/chicken_001.jpg (made with mmx).
 *
 * The bird of `assets/parts/bird-kind.ts` at 0.5 of its size, as a white hen: a plump white body and
 * head, a small red comb and wattle (the cockatrice's, smaller), glossy dark eyes, a short
 * yellow beak, a short white tail fan, and yellow feet.
 * Role: a farm and village animal; the red comb on the white head reads at 128 px.
 * Palette (60/30/10): white #f6f2ea body, head, and wings; a red comb and wattle #e03a2a; a yellow
 *   beak and feet as the accent.
 */
export default scaleAsset(
  birdAsset({
    name: 'chicken',
    description: 'Chibi chicken: a plump white hen in one smooth pear shape, with a red comb of several lobes and a red wattle, small black dot eyes, a closed yellow beak, wings with round feather tips along the sides, a short white tail, and short thick yellow legs with round toes; bird rig with wings.',
    reference: 'docs/wildlife-mockups/chicken_001.jpg',
    variants: {
      body: { white: '#f6f2ea', brown: '#b0703a', black: '#3a3436', speckled: '#c8c0b0' },
      head: { white: '#f8f4ee', brown: '#c0803e', black: '#423c3e', speckled: '#d0c8b8' },
      wings: { white: '#ece6da', brown: '#9a5a2e', black: '#2e2a2c', speckled: '#b4ac9c' },
      eyes: { dark: '#2a1a12', amber: '#c08020' },
    },
    presets: {
      brown: { body: 'brown', head: 'brown', wings: 'brown', eyes: 'amber' },
      black: { body: 'black', head: 'black', wings: 'black', eyes: 'amber' },
      speckled: { body: 'speckled', head: 'speckled', wings: 'speckled', eyes: 'dark' },
    },
    colors: { belly: '#f4eadc', flight: '#ddd4c4', eyeRim: '#2a1a12' },
    body: [0.25, 0.21, 0.22],
    head: 0.15,
    beak: 'short',
    beakScale: 1.75,
    beakColors: ['#f0c030', '#f0c030'],
    mouth: false,
    brows: false,
    eyeStyle: 'bead',
    eyeScale: 0.85,
    glint: 1.9,
    talons: false,
    walkBob: 0.9,
    wingRest: -102,
    wingTurn: 16,
    wingOut: 0.02,
    wingScale: 0.72,
    legLength: 0.85,
    wingStyle: 'paddle',
    wingTips: 'feathers',
    neckScale: 1.9,
    headBlend: 0.08,
    oneBody: 0.05,
    extra(k, b) {
      // The comb: three round lobes on the crown, higher to the back, each turned out a little to
      // its own side, so the three lobes read from the front too.
      const { HEAD_C, HR } = b.joints;
      const lobes = (
        [
          [0.05, 0.05, 0.03, -10],
          [0.005, 0.085, 0.034, 8],
          [-0.04, 0.075, 0.032, -6],
        ] as const
      ).map(([z, h, r, tilt]) => {
        const root = b.topHit(0, HEAD_C[2] + z);
        return sdf
          .capsule([0, 0, 0], [0, h, -0.012], r)
          .scale([0.85, 1, 1])
          .rotateZ(tilt)
          .at(0, root[1] - 0.012, root[2]);
      });
      k.body('comb', sdf.smoothUnion(0.012, ...lobes).bone('head'), { color: '#e03a2a', roughness: 0.55, detail: 0.004 });
      // The wattle: two long red lobes that hang from under the beak in front of the chest,
      // apart at the bottom.
      const chin = b.faceHit(0, HEAD_C[1] - HR * 0.42);
      const front = sdf.raycast(sdf.union(b.trunk, b.skull), [0, chin[1] - 0.05, 2], [0, 0, -1])!;
      const drop = (x: number) =>
        sdf
          .chain([[0, 0.03, 0, 0.016], [x * 0.5, -0.01, 0.004, 0.022], [x, -0.052, 0.006, 0.02]], 0.01)
          .scale([1, 1, 0.75])
          .at(0, front[1], front[2] + 0.006);
      k.body('wattle', sdf.smoothUnion(0.006, drop(0.026), drop(-0.026)).bone('head'), { color: '#d8322a', roughness: 0.55, detail: 0.003 });
    },
  }),
  0.5,
);
