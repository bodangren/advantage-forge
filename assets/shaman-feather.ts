import { addPart, defineAsset } from '../src/index.js';
import { shamanFeather } from './parts/shaman-feather.js';

/**
 * Shaman feather — the held cream feather as a standalone item, from `assets/parts/shaman-feather.ts`,
 * at the exact worn size. Role: equipment pickup, shop icon, avatar part. Size: about 0.46 m tall,
 * upright on its quill on y = 0, the vane facing +Z. Static: no rig.
 */
export default defineAsset({
  name: 'shaman-feather',
  description: 'Large cream feather with a brown tip and a long quill, at its worn size.',
  detail: 0.005,
  reference: 'docs/hero-mockups/shaman_001.jpg',
  texture: { size: 512 },
  equip: { slot: 'offhand', origin: [0, 0.0462, 0] },
  build(k) {
    addPart(k, shamanFeather(), { pose: (s) => s.at(0, 0.0462, 0), bones: null });
  },
});
