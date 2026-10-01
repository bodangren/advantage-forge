import { addPart, defineAsset, type Sdf } from '../src/index.js';
import { WHIP_COIL_ANGLE, WHIP_COIL_AT, treasureHunterWhip } from './parts/treasure-hunter-whip.js';

/**
 * Treasure hunter whip: the treasure hunter's coiled whip with its lash, at worn size.
 * Role: equipment pickup, shop icon, and avatar part. Size: about 0.15 m across. Static: no rig.
 * Display pose: the coil lies flat on the ground, the handle and the lash rest beside it.
 */

/** Lifts the flat whip so that its lowest point is on y = 0, and centers it on the Y axis. */
const LIFT = 0.038;
const CENTER: [number, number] = [0.0085, 0.047];

export default defineAsset({
  name: 'treasure-hunter-whip',
  description: "The treasure hunter's coiled whip lying flat, with its handle and lash.",
  detail: 0.006,
  reference: 'docs/hero-mockups/treasure-hunter_001.jpg',
  texture: { size: 512 },
  build(k) {
    const part = treasureHunterWhip();
    // From the hero frame: back to the coil center, undo the hip turn, and lay the coil axis (Z) up.
    const flat = (s: Sdf) =>
      s.at(-WHIP_COIL_AT[0], -WHIP_COIL_AT[1], -WHIP_COIL_AT[2]).rotateY(-WHIP_COIL_ANGLE).rotateX(90).at(CENTER[0], LIFT, CENTER[1]);
    const coilAndHandle = { ...part, bodies: part.bodies.filter((b) => b.name !== 'whip-lash') };
    const lash = { ...part, bodies: part.bodies.filter((b) => b.name === 'whip-lash') };
    addPart(k, coilAndHandle, { pose: (s) => flat(s.rotateY(WHIP_COIL_ANGLE).at(...WHIP_COIL_AT)), bones: null });
    addPart(k, lash, { pose: flat, bones: null });
  },
});
