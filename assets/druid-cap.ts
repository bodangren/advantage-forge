import { addPart, defineAsset } from '../src/index.js';
import { druidCap } from './parts/druid-cap.js';

/**
 * Druid cap — the spotted red mushroom cap with cream gills, two small mushrooms and a sprig of
 * leaves, as a standalone item, from the shared part `assets/parts/druid-cap.ts`, at its worn size.
 *
 * Role: equipment pickup, shop icon, and avatar part. Size: about 0.86 m wide and 0.37 m tall,
 * resting on its rim on y = 0, the front toward +Z. Static: no rig, no tint slots.
 */
const RIM = 0.0204; // the rim's lowest point below the underside center

export default defineAsset({
  name: 'druid-cap',
  description: "The druid's big red spotted mushroom cap with cream gills and a few small mushrooms and leaves growing from it.",
  detail: 0.005,
  reference: 'docs/hero-mockups/druid_001.png',
  texture: { size: 512 },

  build(k) {
    addPart(k, druidCap(), { pose: (s) => s.at(0, RIM, 0), bones: null });
  },
});
