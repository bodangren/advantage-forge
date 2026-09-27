import { defineAsset, noise, rgb, mixRgb, sdf } from '../src/index.js';
import { tileSurface } from '../src/tile-surface.js';

/**
 * Modular bare-dirt ground tile.
 *
 * - Role: side-by-side floor tile for a cozy chibi hamlet map (matches grass tiles).
 * - Size: 2 m square, 0.08 m thick, top surface at y = 0.08. Origin centered on Y axis,
 *   bottom on y = 0.
 * - The one idea: warm packed earth with soft tonal patches and a few pebble dots.
 *   Clean straight silhouette so tiles butt together without gaps.
 * - Shape language: square modular slab with a small bevel; readable as a chunky tile.
 *   Dominant warm brown, mid-tone patches, and a touch of pebble gray.
 * - Palette:
 *     base dirt   #b8855a (warm light brown)
 *     patch       #8a5d3b (darker brown)
 *     shadow rim  #6e4528 (darker still, under the top edge)
 *     pebble      #8d7866 (gray-tan)
 * - Materials: one dirt body (roughness 0.92, metalness 0); pebbles share roughness.
 * - Detail: small bevel on the box, subtle fbm color patches across the top, five
 *   pebble dots scattered on the surface. No rig, no animation.
 */
export default defineAsset({
  name: 'dirt-ground',
  description: 'Modular 2 m square bare-dirt ground tile, 0.08 m thick.',
  detail: 0.008,

  build(k) {
    // Palette
    const dirt = rgb('#b8855a'); // warm light brown — base
    const dirtDark = rgb('#7a4f2e'); // mid-shadow patches
    const dirtDeep = rgb('#523220'); // deepest pockets (value floor)
    const dirtLight = rgb('#d49b6d'); // sun-bleached highlights
    const pebble = rgb('#8d7866');
    const pebbleDark = rgb('#5e5044');

    // Keep the outer edge square so adjacent cells meet without a shaded gap.
    const slab = sdf.box([2, 0.08, 2]).at(0, 0.04, 0);

    // Paint: warm base, soft darker patches, a few deeper pockets, and a few sun-lit
    // highlights across the top. Patches use low-frequency fbm for big soft shapes;
    // highlights use a different seed for an asymmetric, organic feel.
    const dirtColorAt = (x: number, y: number, z: number) => {
      // Top face is at y = 0.08; fade paint back to base on the sides and bottom.
      const topness = Math.min(1, Math.max(0, (y - 0.02) / 0.06));

      // Two scales of darker patches: big soft shapes (1.6x) and mid blobs (5x).
      const bigPatch = 0.5 + 0.5 * noise.fbm(x * 1.6, z * 1.6, 11, 3);
      const midPatch = 0.5 + 0.5 * noise.fbm(x * 4.5, z * 4.5, 23, 2);

      // Only the dark portions of the noise contribute — push values below 0.55
      // toward dirtDark, leave the rest near the base color.
      const darkMask = Math.max(0, Math.min(1, (0.55 - bigPatch) * 2.2)) * topness;
      const midDarkMask = Math.max(0, Math.min(1, (0.6 - midPatch) * 2.0)) * topness;
      const patchAmt = Math.min(0.85, 0.35 * darkMask + 0.25 * midDarkMask);

      // A few deeper pockets — sparse dark spots.
      const deep = noise.fbm(x * 7, z * 7, 47, 2);
      const deepMask = Math.max(0, Math.min(1, (0.35 - deep) * 3.0)) * topness;

      // Light highlights — sun-bleached spots in a few places.
      const lightNoise = noise.fbm(x * 1.2, z * 1.2, 71, 2);
      const lightMask = Math.max(0, Math.min(1, (lightNoise - 0.55) * 2.5)) * topness;

      // Speckle: a fine grain so the top reads as soil, not flat paint.
      const speckle = 0.5 + 0.5 * noise.fbm(x * 14, y * 4, z * 14, 2);
      const speckAmt = 0.1 * (0.3 + 0.7 * topness) * (speckle - 0.5);

      // Dark rim just under the top edge — gives the tile a sense of thickness from the side.
      const rim = Math.max(0, 1 - Math.abs(y - 0.072) / 0.012);

      let c = mixRgb(dirt, dirtDark, patchAmt + speckAmt);
      c = mixRgb(c, dirtDeep, 0.8 * deepMask);
      c = mixRgb(c, dirtLight, 0.5 * lightMask);
      c = mixRgb(c, dirtDeep, 0.65 * rim * topness);
      return c;
    };
    const painted = slab.paintFn(dirtColorAt);

    // Bump for soft packed-earth texture, applied via `bump` so it stays in the normal map.
    const bump = (x: number, y: number, z: number) =>
      0.6 * noise.fbm(x * 10, y * 2, z * 10, 3) + 0.4 * noise.fbm(x * 30, 0, z * 30, 2);

    k.body('dirt', painted, { color: '#b8855a', roughness: 0.92, metalness: 0, bump });
    k.add('dirt-top', tileSurface('dirt-top', (x, z) => dirtColorAt(x, 0.08, z)));

    // Pebbles: small spheres sitting on the top surface. Five pebbles, scattered but
    // off-center so the tile does not look symmetric. Slight per-pebble size variation,
    // and a darker rim via paintFn so each pebble reads as a rounded rock, not a flat dot.
    const pebbleSeed: Array<[number, number, number, number]> = [
      [-0.62, 0.08, -0.45, 0.02],
      [0.35, 0.08, 0.58, 0.018],
      [-0.18, 0.08, 0.72, 0.016],
      [0.68, 0.08, -0.55, 0.019],
      [-0.78, 0.08, 0.32, 0.015],
    ];
    const pebbles = sdf
      .union(
        ...pebbleSeed.map(([px, py, pz, pr]) => sdf.sphere(pr).at(px, py + pr * 0.6, pz)),
      )
      .paintFn((x, y, z, base) => {
        // Match each pebble to its nearest seed and tint accordingly.
        let best = 0;
        let bestD = Infinity;
        for (let i = 0; i < pebbleSeed.length; i++) {
          const [px, , pz, pr] = pebbleSeed[i]!;
          const d = Math.hypot(x - px, z - pz) - pr;
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
        const tint = 0.4 + 0.6 * noise.random(best, 5);
        const c = mixRgb(pebble, pebbleDark, tint);
        // Darken the underside of each pebble slightly for grounding.
        return y < 0.085 ? mixRgb(c, pebbleDark, 0.3) : c;
      });
    k.body('pebbles', pebbles, { color: '#8d7866', roughness: 0.85, metalness: 0 });
  },
});
