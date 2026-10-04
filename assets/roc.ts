import { sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';

/**
 * Roc — Chibi Quest monster (catalog `monsters/beast/roc`), a legendary giant bird about 0.95 m to
 * the crest, faces +Z. Target: docs/monster-mockups/roc_001.jpg (made with mmx from the griffin
 * mockup).
 *
 * The bird of `assets/parts/bird-kind.ts` (egg body, head, beak, legs, wings, rig, and clips) as a
 * young roc: a big round orange head with a tall red crest and big round eyes, a hooked yellow beak,
 * a small orange body with a red feather bib, raised wings of yellow coverts and red flight
 * feathers, a red and gold tail fan, and orange legs with black talons.
 * Role: a sky beast of the high peaks; the raised wings and the red crest read at 128 px.
 * Palette (60/30/10): orange #e8902a body and head; yellow #f2c040 wing coverts; red #d84a2a crest,
 *   bib, and flight feathers as the accent; black and white eyes and talons.
 * Bodies added: crest (rigid on the head), bib (on the chest).
 */
type V3 = [number, number, number];

export default birdAsset({
  name: 'roc',
  description: 'Chibi roc monster: a legendary orange bird with a big round head, a tall red crest, big round eyes, a hooked yellow beak, a red feather bib, raised yellow and red wings, a red and gold tail, and orange legs with black talons; bird rig with wings.',
  reference: 'docs/monster-mockups/roc_001.jpg',
  variants: {
    body: { orange: '#e8902a', gold: '#e0b040', crimson: '#c04a3a' },
    head: { orange: '#eb9a30', gold: '#e8bc48', crimson: '#c85242' },
    wings: { yellow: '#f2c040', cream: '#f0e0b0', violet: '#9a6ac0' },
    eyes: { brown: '#3a2010', blue: '#2a4a7a', green: '#2a5a30' },
  },
  presets: {
    sun: { body: 'gold', head: 'gold', wings: 'cream', eyes: 'blue' },
    ember: { body: 'crimson', head: 'crimson', wings: 'violet', eyes: 'green' },
  },
  colors: { belly: '#f2b050', flight: '#d84a2a', scale: '#f09a30', scaleDark: '#d8801c', talon: '#1e1a1c', eyeRim: '#fbf6ee' },
  body: [0.15, 0.165, 0.14],
  head: 0.2,
  brows: false,
  eyeScale: 1.55,
  wingScale: 1.05,
  tailSlot: 'wings',
  extra(k, b) {
    const { HEAD_C, BODY_C, B } = b.joints;
    const red = b.tone('wings', '#d84a2a', 0.5);
    // A tall crest of red feathers, swept back, tallest in the middle.
    const crest = sdf.smoothUnion(
      0.015,
      ...(
        [
          [0, 0.07, 0.2, 0.05],
          [0.045, 0.035, 0.16, 0.042],
          [-0.045, 0.035, 0.16, 0.042],
          [0, -0.02, 0.15, 0.045],
        ] as const
      ).map(([x, z, len, r]) => {
        const root = b.topHit(x, HEAD_C[2] + z);
        return sdf.chain(
          [
            [root[0], root[1] - 0.02, root[2], r],
            [root[0] * 1.2, root[1] + len * 0.6, root[2] - len * 0.15, r * 0.7],
            [root[0] * 1.4, root[1] + len, root[2] - len * 0.45, 0.012],
          ],
          0.01,
        );
      }),
    );
    k.body('crest', crest.bone('head'), { color: red, roughness: 0.8, detail: 0.004 });
    // A bib of pointed red feathers on the chest, below the head.
    const top: V3 = [0, BODY_C[1] + B[1] * 0.4, BODY_C[2] + B[2] * 0.82];
    const bib = sdf.smoothUnion(
      0.012,
      ...[-2, -1, 0, 1, 2].map((i) => {
        const a = i * 26 * (Math.PI / 180);
        const from: V3 = [Math.sin(a) * 0.09, top[1], top[2] + Math.cos(a) * 0.03 - 0.03];
        const to: V3 = [Math.sin(a) * 0.12, top[1] - 0.1 + Math.abs(i) * 0.015, top[2] + Math.cos(a) * 0.06];
        return sdf.cone(from, to, 0.04, 0.008);
      }),
    );
    k.body('bib', bib.bone('spine'), { color: red, roughness: 0.8, detail: 0.004 });
  },
});
