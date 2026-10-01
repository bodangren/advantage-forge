import { addPart, defineAsset } from '../src/index.js';
import { explorerMap } from './parts/explorer-map.js';

/**
 * Explorer map: the explorer's rolled parchment map, at worn size.
 * Role: equipment pickup and avatar part. Size: 0.19 m long, 0.078 m across.
 * Lies on y = 0 with its open end toward +Z. Static: no rig.
 */
export default defineAsset({
  name: 'explorer-map',
  description: "The explorer's rolled parchment map with a red ring.",
  detail: 0.004,
  reference: 'docs/hero-mockups/explorer_001.jpg',
  texture: { size: 512 },
  build(k) {
    addPart(k, explorerMap(), { pose: (s) => s.at(0, 0.0445, -0.045), bones: null });
  },
});
