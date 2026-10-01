import { addPart, defineAsset } from '../src/index.js';
import { fighterCap } from './parts/fighter-cap.js';

/**
 * Fighter cap — the fighter's steel skull cap with a nasal bar as a standalone item from the shared part `assets/parts/fighter-cap.ts`,
 * at the exact worn size. Static: no rig. Resting on its band at y = 0; the front toward +Z.
 */

export default defineAsset({
  name: 'fighter-cap',
  description: 'The fighter\'s steel skull cap with a nasal bar, at its worn size.',
  detail: 0.006,
  reference: 'docs/hero-mockups/fighter_001.jpg',
  texture: { size: 512 },

  build(k) {
    // The nasal bar is the lowest point: it touches the ground (the band rests 0.17 m higher).
    addPart(k, fighterCap(), { pose: (s) => s.at(0, 0.109, 0), bones: null });
  },
});
