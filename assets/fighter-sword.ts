import { addPart, defineAsset } from '../src/index.js';
import { fighterSword } from './parts/fighter-sword.js';

/**
 * Fighter sword — the fighter's arming sword as a standalone item from the shared part `assets/parts/fighter-sword.ts`,
 * at the exact worn size. Static: no rig. Standing on its pommel, blade up, the flat toward +Z.
 */

export default defineAsset({
  name: 'fighter-sword',
  description: 'The fighter\'s arming sword, at its worn size.',
  detail: 0.006,
  reference: 'docs/hero-mockups/fighter_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, 0.07, 0] },

  build(k) {
    addPart(k, fighterSword(), { pose: (s) => s.rotateZ(180).at(0, 0.07, 0), bones: null });
  },
});
