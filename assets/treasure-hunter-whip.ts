import { addPart, defineAsset, type Sdf } from '../src/index.js';
import { treasureHunterWhip } from './parts/treasure-hunter-whip.js';

/**
 * Treasure hunter whip: the treasure hunter's coiled whip with a hanging lash, at worn size.
 * Role: equipment pickup and avatar part. Size: about 0.15 m across, 0.2 m tall. Static: no rig.
 */
export default defineAsset({
  name: 'treasure-hunter-whip',
  description: "the treasure hunter's coiled whip with a hanging lash.",
  detail: 0.006,
  reference: 'docs/hero-mockups/treasure-hunter_001.jpg',
  texture: { size: 512 },
  build(k) {
    // The coil and handle go to the hip pose, the lash hangs as on the hero; all lowered to the ground.
    const part = treasureHunterWhip();
    const down = (s: Sdf) => s.at(0.099, 0, -0.125);
    addPart(k, { ...part, bodies: part.bodies.filter((b) => b.name !== 'whip-lash') }, { pose: (s) => down(s.rotateY(-29).at(-0.099, 0.195, 0.125)), bones: null });
    addPart(k, { ...part, bodies: part.bodies.filter((b) => b.name === 'whip-lash') }, { pose: down, bones: null });
  },
});
