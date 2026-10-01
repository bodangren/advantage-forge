import { addPart, defineAsset } from '../src/index.js';
import { duelistRapier } from './parts/duelist-rapier.js';

/**
 * Duelist rapier: a slim gold-hilted rapier at worn size. Size: 0.42 m long over the blade and hilt.
 * Stands on its pommel (y = 0), blade up, the guard's open side toward +Z. Static: no rig.
 */
export default defineAsset({
  name: 'duelist-rapier',
  description: "The duelist's slim gold-hilted rapier with a cup guard.",
  detail: 0.006,
  reference: 'docs/hero-mockups/duelist_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', origin: [0, 0.075, 0] },
  build(k) {
    // Local +Z (blade) becomes +Y; the pommel bottom (z = -0.075) rests on y = 0.
    addPart(k, duelistRapier(), { pose: (s) => s.rotateX(-90).at(0, 0.075, 0), bones: null });
  },
});
