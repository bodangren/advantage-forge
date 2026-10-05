import { sdf } from '../src/index.js';
import { boarAsset } from './parts/boar-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Boar — Chibi Quest wildlife (catalog `wildlife/forest/boar`), about 0.6 m tall at the ears and
 * 0.72 m from snout to tail, faces +Z. Target: docs/wildlife-mockups/boar_001.jpg (made with mmx).
 *
 * The giant boar of `assets/giant-boar.ts` (body, head, rig, and clips from
 * `assets/parts/boar-kind.ts`) at 0.8 of its size, as a friendly forest boar: big glossy green eyes
 * without brows or lid rings, big ivory tusks that curve up at the cheeks, a tall curved black tuft
 * on the head, spiky dark cheek tufts, round split hooves, a soft tail tuft, and no teeth.
 * Role: a common forest animal for hunting and farm scenes; the pink snout and the tusks read at
 *   128 px. The giant boar stays the angry monster of the kind.
 * Palette (60/30/10): chocolate-brown fur #7a5236 (darker legs and back, lighter belly); a pink
 *   snout #e88a86; black tufts and hooves; ivory tusks; green eyes with a white glint.
 */
export default scaleAsset(
  boarAsset({
    name: 'boar',
    description: 'Chibi boar: a friendly brown forest boar with big glossy green eyes, a pink snout, big ivory tusks that curve up at the cheeks, pointed ears, a tall curved black tuft on the head, spiky dark cheek tufts, and round black split hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/boar_001.jpg',
    variants: {
      fur: { brown: '#7a5236', grey: '#6a625c', russet: '#8a4a2a', dark: '#4a3a30' },
      skin: { pink: '#e88a86', dusky: '#a88078', slate: '#7a6e70' },
      eyes: { green: '#355a28', dark: '#2a1a12', amber: '#8a5a1a' },
      tusks: { ivory: '#efe6cf', yellowed: '#e0cc98', bone: '#c8c2b2' },
    },
    presets: {
      grey: { fur: 'grey', skin: 'slate', eyes: 'dark', tusks: 'bone' },
      russet: { fur: 'russet', skin: 'dusky', eyes: 'amber', tusks: 'yellowed' },
      dark: { fur: 'dark', skin: 'pink', eyes: 'dark', tusks: 'ivory' },
    },
    colors: { furDark: '#5a3a24', belly: '#9a7050', earInner: '#d8807e', black: '#2a2420' },
    ivorySlot: 'tusks',
    horns: false,
    tuskScale: 0.95,
    mane: false,
    hoofStyle: 'round',
    eyeScale: 1.35,
    eyeGlow: 0,
    brows: false,
    lids: false,
    teeth: false,
    extra(k, b) {
      const black = '#2a2420';
      // A tall curved tuft on the crown: one long lock that rises and curls back, and two short
      // ones beside it.
      const top = sdf.raycast(b.headBase, [0, 2, 0.2], [0, -1, 0])!;
      const lock = (x: number, h: number, r: number) =>
        sdf.chain(
          [
            [top[0] + x, top[1] - 0.02, top[2], r],
            [top[0] + x * 1.3, top[1] + h * 0.55, top[2] - h * 0.05, r * 0.8],
            [top[0] + x * 1.5, top[1] + h * 0.95, top[2] - h * 0.4, r * 0.45],
            [top[0] + x * 1.5, top[1] + h, top[2] - h * 0.75, r * 0.12],
          ],
          0.012,
        );
      const tuft = sdf.smoothUnion(0.01, lock(0, 0.13, 0.03), lock(0.026, 0.08, 0.022), lock(-0.026, 0.08, 0.022));
      // Spiky cheek tufts: three short points behind each cheek, out and back.
      const cheek = sdf
        .union(
          ...[
            [0.02, 0.03],
            [-0.025, 0.02],
            [0.0, -0.025],
          ].map(([dy, dz]) => {
            const root = sdf.surfacePoint(b.headBase, [0.4, 0.4 + dy!, 0.17 + dz!], -0.012);
            return sdf.cone(root, [root[0] + 0.06, root[1] + dy! * 1.2, root[2] - 0.03], 0.02, 0.004);
          }),
        )
        .mirror('x');
      k.body('tufts', sdf.union(tuft, cheek).bone('head'), { color: black, roughness: 0.55, detail: 0.004 });
      // A small soft tuft at the tail tip.
      const tail = sdf.smoothUnion(0.006, ...[[0, 0], [0.012, 0.012], [-0.012, 0.01]].map(([dx, dy]) => sdf.ellipsoid([0.018, 0.018, 0.026]).at(0.02 + dx!, 0.34 + dy!, -0.425)));
      k.body('tail-tuft', tail.bone('tail'), { color: black, roughness: 0.6, detail: 0.003 });
    },
  }),
  0.8,
);
