import { addPart, defineAsset } from '../src/index.js';
import { dragoonHelm } from './parts/dragoon-helm.js';

/**
 * Dragoon helm: the dragoon's winged dragon helm as a standalone item, from the shared part
 * `assets/parts/dragoon-helm.ts`, at its worn size.
 * Role: equipment pickup and avatar part. Size: about 0.5 m wide, 0.5 m tall to the crown, spike on top;
 * the rim rests on y = 0, the face opening toward +Z. Static: no rig.
 */
const RIM_Y = 0.585 - 0.6748046875; // HEM_Y below the head center (part frame)

export default defineAsset({
  name: 'dragoon-helm',
  description: "The dragoon's dark-blue winged dragon helm with a riveted silver brim, horn blades, and a center spike.",
  detail: 0.005,
  reference: 'docs/hero-mockups/dragoon_001.jpg',
  texture: { size: 512 },
  variants: {
    plate: { blue: '#4a5a7a', black: '#2a2d36', crimson: '#8a2e3a' },
  },

  build(k) {
    addPart(k, dragoonHelm(k.tint), { pose: (s) => s.at(0, -RIM_Y, 0), bones: null });
  },
});
