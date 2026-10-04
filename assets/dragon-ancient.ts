import { sdf } from '../src/index.js';
import { dragonAsset } from './parts/dragon-kind.js';

/**
 * Ancient dragon — Chibi Quest monster (catalog `monsters/dragon/dragon-ancient`), an old, wise
 * dragon about 1.0 m to the horn tips, faces +Z. Target: docs/monster-mockups/dragon-ancient_001.jpg
 * (made with mmx from the fire dragon mockup).
 *
 * The fire dragon (`assets/dragon-fire.ts`; body, rig, and clips from `assets/parts/dragon-kind.ts`)
 * as an ancient dragon: dark bronze-green scales, a pale gold belly, long horns that sweep back
 * and out, a white mane (the crest), bushy white brows, a spiky white beard on the jaw, dull
 * olive wings, and gold eyes.
 * Role: a final or story boss of the dragon family; the beard, the white mane, and the long horns
 *   read as "old" at 128 px.
 * Palette (60/30/10): dark bronze-green #4e5a48; pale gold belly #d8c890; white mane, brows, and
 *   beard #ece6d8; brown horns; gold eyes as the accent.
 * Bodies added: beard (rigid on the jaw, so it opens with the mouth).
 */
export default dragonAsset({
  name: 'dragon-ancient',
  description: 'Chibi ancient dragon monster: an old dark bronze-green dragon with long swept-back horns, a white mane and bushy white brows, a spiky white beard, gold eyes, a pale gold belly, and dull olive bat wings.',
  reference: 'docs/monster-mockups/dragon-ancient_001.jpg',
  variants: {
    scales: { bronze: '#4e5a48', slate: '#4a4e58', umber: '#5a4a3a' },
    belly: { gold: '#d8c890', ivory: '#e8e2cc', sand: '#c8b080' },
    eyes: { gold: '#ffc030', amber: '#ff9a2a', jade: '#6ad8a0' },
  },
  presets: {
    slate: { scales: 'slate', belly: 'ivory', eyes: 'jade' },
    umber: { scales: 'umber', belly: 'sand', eyes: 'amber' },
  },
  palette: {
    redDark: '#343c30',
    creamLine: '#a89a6a',
    eyeLow: '#d08a18',
    horn: '#a08060',
    hornBase: '#6a5040',
    brow: '#ece6d8',
    claw: '#e8e0c8',
  },
  looks: {
    crest: { color: '#ece6d8', roughness: 0.7 },
    crestMid: { color: '#f4f0e6', roughness: 0.7 },
    wings: { color: '#7a7448' },
  },
  horn: [
    [0.13, 0.79, -0.03, 0.05],
    [0.22, 0.825, -0.08, 0.043],
    [0.31, 0.845, -0.12, 0.034],
    [0.39, 0.88, -0.12, 0.024],
    [0.43, 0.94, -0.09, 0.01],
  ],
  hornBaseBelow: 0.82,
  extra(k, dragon) {
    // The beard: white spikes that hang from the underside of the jaw, longest at the middle.
    const spikes: sdf.Shape[] = [];
    for (let i = -3; i <= 3; i++) {
      const x = i * 0.032;
      const z = 0.13 + 0.05 * Math.cos((i / 3) * (Math.PI / 2));
      const p = sdf.raycast(dragon.skull, [x, 0.2, z], [0, 1, 0]);
      if (!p) continue;
      const len = 0.13 - Math.abs(i) * 0.018;
      spikes.push(sdf.cone([p[0], p[1] + 0.012, p[2]], [p[0] * 1.15, p[1] - len, p[2] + 0.03], 0.024, 0.004));
    }
    k.body('beard', sdf.smoothUnion(0.012, ...spikes), { color: '#ece6d8', roughness: 0.75, bone: 'jaw', detail: 0.003 });
  },
});
