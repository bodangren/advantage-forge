import { mixRgb, rgb, sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Pigeon — Chibi Quest wildlife (catalog `wildlife/birds/pigeon`), a plump town pigeon about 0.33 m
 * tall, faces +Z. Target: docs/wildlife-mockups/pigeon_001.jpg (made with mmx).
 *
 * The bird of `assets/parts/bird-kind.ts` at 0.4 of its size, as a pigeon: a plump grey body, a
 * shiny green and purple band round the neck, paler grey wings, orange eyes, a
 * small dark beak with a white bump at the root, and pink feet.
 * Role: ambient life in towns, squares, and castles; the neck sheen and the pink feet read at
 *   128 px.
 * Palette (60/30/10): grey #9a9ca6 body and head; pale grey wings #b0b2bc; a green
 *   and purple neck band; orange eyes and pink feet as the accent.
 */
export default scaleAsset(
  birdAsset({
    name: 'pigeon',
    description: 'Chibi pigeon: an upright egg-shaped grey pigeon with a small head on a short neck, a shiny green neck that blends into a ruffled purple bib, pale grey wings with two dark bars, orange eyes, a pale grey beak with a white bump, wings folded along the sides, a grey tail with a dark tip, and short pink legs; bird rig with wings.',
    reference: 'docs/wildlife-mockups/pigeon_001.jpg',
    variants: {
      body: { grey: '#a6a29e', blue: '#9a9ca6', white: '#eeeceb', brown: '#9a7a66', dark: '#5e5e68' },
      head: { grey: '#9a9692', blue: '#8c8e9a', white: '#f0eeec', brown: '#8a6a58', dark: '#52525c' },
      wings: { grey: '#bab6b0', blue: '#b0b2bc', white: '#e4e2e0', brown: '#b09482', dark: '#6e6e78' },
      eyes: { orange: '#e07020', red: '#c8402a', dark: '#2a1a12' },
    },
    presets: {
      white: { body: 'white', head: 'white', wings: 'white', eyes: 'dark' },
      brown: { body: 'brown', head: 'brown', wings: 'brown', eyes: 'orange' },
      dark: { body: 'dark', head: 'dark', wings: 'dark', eyes: 'red' },
      blue: { body: 'blue', head: 'blue', wings: 'blue', eyes: 'orange' },
    },
    colors: { belly: '#aeaaa6', flight: '#5a5c66', scale: '#e88a8a', scaleDark: '#d47878', talon: '#6a5050', eyeRim: '#5a5a64' },
    body: [0.21, 0.24, 0.2],
    pear: 0.7,
    head: 0.1,
    headLift: 0.035,
    oneBody: 0.03,
    beak: 'short',
    beakScale: 1.15,
    beakDroop: 14,
    beakColors: ['#a8a6ac', '#a8a6ac'],
    beakTip: '#3a3a42',
    mouth: false,
    brows: false,
    eyeScale: 0.9,
    featherOn: { body: false, head: false, wings: false },
    walkBob: 1,
    stillNeck: true,
    talons: false,
    wingBars: { color: '#4a4c56', at: [0.2, 0.27] },
    tailSlot: 'body',
    tailTip: '#4a4c56',
    wingRest: -104,
    wingTurn: 64,
    wingOut: 0,
    wingTips: 'smooth',
    wingScale: 0.62,
    legLength: 0.35,
    wingStyle: 'paddle',
    neckScale: 1.3,
    paint(plumage, b) {
      // The green sheen starts on the cheeks under the eyes and blends down into the neck skin.
      const { HEAD_C, HR } = b.joints;
      const grey = rgb(b.tint.head);
      const green = rgb(b.tone('head', '#4a9a6a', 0.3));
      const y0 = HEAD_C[1] - HR * 0.08;
      const y1 = HEAD_C[1] - HR * 0.38;
      return plumage.paintFn((_x, y, _z, base) => (y > y0 ? base : mixRgb(base, mixRgb(grey, green, 0.85), Math.min(1, (y0 - y) / (y0 - y1)))));
    },
    paintBody(body, b) {
      // The neck sheen on the neck and the upper chest: grey from the head blends into green and
      // then into purple, with no edge.
      const { HEAD_C, HR } = b.joints;
      const grey = rgb(b.tint.head);
      const green = rgb(b.tone('head', '#4a9a6a', 0.3));
      const purple = rgb(b.tone('head', '#8a5a9a', 0.3));
      const yTop = HEAD_C[1] - HR * 0.38;
      const yBot = HEAD_C[1] - HR * 0.92 - 0.03; // just under the collar line
      const ramp = (y: number) => (yTop - y) / (yTop - yBot);
      return body.paintFn((_x, y, _z, base) => {
        const t = ramp(y);
        if (t < 0) return mixRgb(grey, green, 0.85);
        if (t < 0.15) return mixRgb(mixRgb(grey, green, 0.85), green, t / 0.15);
        if (t < 0.5) return green;
        if (t < 1) return mixRgb(green, purple, (t - 0.5) / 0.5);
        return t < 1.35 ? mixRgb(purple, base, (t - 1) / 0.35) : base;
      });
    },
    extra(k, b) {
      const { HEAD_C, HR } = b.joints;
      // The ruffled purple bib at the bottom of the sheen: a row of round lobes.
      const yBot = HEAD_C[1] - HR * 0.92 - 0.03; // just under the collar line
      const lobes = Array.from({ length: 15 }, (_, i) => {
        const a = ((-112 + (224 * i) / 14) * Math.PI) / 180;
        const hit = sdf.raycast(b.trunk, [Math.sin(a) * 2, yBot, HEAD_C[2] + Math.cos(a) * 2], [-Math.sin(a), 0, -Math.cos(a)])!;
        return sdf
          .ellipsoid([0.03, 0.03 + 0.006 * Math.cos(i * 2.1), 0.01])
          .rotateX(-38)
          .rotateY((a * 180) / Math.PI)
          .at(hit[0] + Math.sin(a) * 0.004, hit[1], hit[2] + Math.cos(a) * 0.004);
      });
      k.body('neck-sheen', sdf.smoothUnion(0.012, ...lobes).bone('neck'), { color: b.tone('head', '#8a5a9a', 0.3), roughness: 0.55, detail: 0.003 });
      // The white bump at the root of the beak.
      const root = b.faceHit(0, HEAD_C[1] - HR * 0.02);
      k.body('cere', sdf.ellipsoid([0.03, 0.016, 0.022]).at(root[0], root[1], root[2] + 0.006).bone('head'), { color: '#f2f0ec', roughness: 0.6, detail: 0.002 });
    },
  }),
  0.4,
);
