import { profile, sdf } from '../src/index.js';
import { impAsset } from './parts/imp-kind.js';

/**
 * Horned demon — Chibi Quest monster (catalog `monsters/abyssal-and-cosmic/horned-demon`), a purple
 * devil with huge horns, about 0.9 m to the horn tips, faces +Z. Target:
 * docs/monster-mockups/horned-demon_001.jpg (made with mmx from the imp mockup).
 *
 * The imp of `assets/parts/imp-kind.ts` (head, face, body, bat wings, rig, and clips) in purple,
 * with two huge black horns that sweep out and up, two small horns on the brow, orange eyes, and
 * orange flame markings on the chest and the forearms.
 * Role: a fire-casting demon; the huge horns make the silhouette, and the orange markings and eyes
 *   pop against the purple at 128 px.
 * Palette (60/30/10): purple skin #7a4ab0 (darker back); black horns; dark violet wings; orange
 *   eyes and markings #ff8a1a as the accent.
 */

export default impAsset({
  name: 'horned-demon',
  description: 'Chibi horned demon monster: a purple devil with two huge black horns sweeping out and up, two small brow horns, orange eyes, a fanged grin, dark violet bat wings, black claws, and orange flame markings on its chest and arms.',
  reference: 'docs/monster-mockups/horned-demon_001.jpg',
  variants: {
    skin: { purple: '#7a4ab0', indigo: '#4a4aa0', plum: '#8a3a7a' },
    wings: { violet: '#3a2850', night: '#22202e', wine: '#5a2040' },
    eyes: { orange: '#ff8a1a', yellow: '#f0d030', red: '#ff4a3a' },
    horns: { black: '#1e1618', bone: '#8a8074', violet: '#3a2a4a' },
  },
  presets: {
    indigo: { skin: 'indigo', wings: 'night', eyes: 'yellow', horns: 'bone' },
    plum: { skin: 'plum', wings: 'wine', eyes: 'red', horns: 'violet' },
  },
  colors: { skinDark: '#5a3488', belly: '#9a6ac8', brow: '#2a1440', irisDark: '#b84a10', vein: '#2a1c3a' },
  crest: false,
  hornRings: 0.8,
  horns: [
    [
      [0.075, 0.6, 0.0, 0.04],
      [0.15, 0.655, -0.02, 0.036],
      [0.235, 0.7, -0.03, 0.028],
      [0.285, 0.775, -0.015, 0.019],
      [0.29, 0.85, 0.015, 0.006],
    ],
    [
      [0.035, 0.635, 0.07, 0.02],
      [0.045, 0.685, 0.075, 0.012],
      [0.04, 0.715, 0.09, 0.003],
    ],
  ],
  paint(skin, imp) {
    const { ELBOW, WRIST } = imp.joints;
    const flame = imp.tone('eyes', '#ff8a1a', 0.6);
    // A flame mark on the chest (a drop that points down, cut through the front), and two bands
    // around each forearm.
    const drop = profile.polygon(
      [
        [0, -0.05],
        [0.032, -0.004],
        [0.024, 0.036],
        [0.009, 0.016],
        [0, 0.05],
        [-0.009, 0.016],
        [-0.024, 0.036],
        [-0.032, -0.004],
      ],
      { smooth: true },
    );
    const chest = sdf.extrude(drop, 0.3).at(0, 0.335, 0.15);
    const along = (t: number): [number, number, number] => [ELBOW[0] + (WRIST[0] - ELBOW[0]) * t, ELBOW[1] + (WRIST[1] - ELBOW[1]) * t, ELBOW[2] + (WRIST[2] - ELBOW[2]) * t];
    const band = (t: number) => sdf.torus(0.03, 0.008).rotateX(90).rotateY(15).at(...along(t));
    const stripes = sdf.union(band(0.35), band(0.62)).mirror('x');
    return skin.paintWhere(chest, flame, 0.004).paintWhere(stripes, flame, 0.004);
  },
});
