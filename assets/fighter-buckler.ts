import { addPart, defineAsset } from '../src/index.js';
import { fighterBuckler } from './parts/fighter-buckler.js';

/**
 * Fighter buckler — the fighter's round wooden buckler with a brass rim and boss as a standalone item from the shared part `assets/parts/fighter-buckler.ts`,
 * at the exact worn size. Static: no rig. Standing on its rim, the face toward +Z.
 */

export default defineAsset({
  name: 'fighter-buckler',
  description: 'The fighter\'s round wooden buckler with a brass rim and boss, at its worn size.',
  detail: 0.006,
  reference: 'docs/hero-mockups/fighter_001.jpg',
  texture: { size: 512 },

  build(k) {
    addPart(k, fighterBuckler(), { pose: (s) => s.at(0, 0.133, 0), bones: null });
  },
});
