import { addPart, defineAsset } from '../src/index.js';
import { KNIGHT_HELM_MOUNT, knightHelm } from './parts/knight-helm.js';

/**
 * Knight helm — the knight's worn helm as a standalone item, from the shared part
 * `assets/parts/knight-helm.ts`, at the exact worn size (a shop view scales it for display).
 *
 * Role: equipment pickup, shop icon, and avatar part; the dome, gold brow, and red plume read at
 * 128 px. Size: 0.55 m wide, 0.69 m tall with the plume, 0.52 m deep; the rim rests on y = 0, the face
 * opening toward +Z. Static: no rig. The plume slot takes the knight's livery colors.
 */

/** The rim's lowest point in the part frame (knight y 0.49 below the head center). */
const RIM_Y = 0.49 - KNIGHT_HELM_MOUNT[1];

export default defineAsset({
  name: 'knight-helm',
  description: "The knight's round steel helm with a gold brow band, crest, ear discs, and a red plume, at its worn size.",
  detail: 0.005,
  reference: 'docs/hero-mockups/knight_001.jpg',
  texture: { size: 512 },
  variants: {
    plume: { red: '#c93a32', blue: '#2f58b8', green: '#2e7a3c' },
  },

  build(k) {
    addPart(k, knightHelm(k.tint), { pose: (s) => s.at(0, -RIM_Y, 0), bones: null });
  },
});
