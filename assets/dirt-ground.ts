import { defineAsset, noise, rgb, mixRgb, sdf } from '../src/index.js';

/**
 * Modular bare-dirt ground tile, a 0.3 m slab: top at y = 0, packed soil down to y = -0.3.
 *
 * - Role: side-by-side floor tile for a cozy chibi hamlet map (matches grass tiles).
 * - Size: 2 m square, 0.3 m thick, top surface at y = 0, bottom at y = -0.3.
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

const SLAB = 0.3;
const EDGE = 0.001;
const OLD = 0.08;
const SOIL = rgb('#6a4428');
const STRATA = rgb('#4a2e1a');
const SPECK = rgb('#9a8a78');
/** Side color: a lip of the top color with a wavy edge, then packed soil with strata and pebbles. */
function sideColor(x: number, y: number, z: number, top: (x: number, z: number) => ReturnType<typeof rgb>) {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
  if (y > -drip) return top(x, z);
  const depth = -y / SLAB;
  let c = mixRgb(SOIL, STRATA, 0.1 + depth * 0.6);
  // Broken strata and soft clumps, so the side reads as earth and not as planks.
  const strata = Math.sin((y + 0.03 * noise.fbm(along * 3, y * 3, 5.3, 2)) * 45);
  const breakUp = Math.max(0, Math.min(1, 0.5 + noise.fbm(along * 4, y * 12, 7.1, 2)));
  c = mixRgb(c, STRATA, Math.max(0, strata - 0.7) * 0.9 * breakUp);
  const clump = noise.fbm(along * 14, y * 14, 11.7, 2);
  c = mixRgb(c, clump > 0 ? STRATA : SPECK, Math.min(1, Math.abs(clump)) * 0.3);
  const n = noise.fbm(along * 9, y * 9, 3.1, 2);
  if (n > 0.45) c = mixRgb(c, SPECK, Math.min(1, (n - 0.45) * 6) * 0.8);
  return c;
}

export default defineAsset({
  name: 'dirt-ground',
  description: 'Modular 2 m square bare-dirt ground tile, a 0.3 m slab with its top at y = 0; dirt lip over packed soil sides.',
  detail: 0.012,

  build(k) {
    // Palette
    const dirt = rgb('#b8855a'); // warm light brown — base
    const dirtDark = rgb('#7a4f2e'); // mid-shadow patches
    const dirtDeep = rgb('#523220'); // deepest pockets (value floor)
    const dirtLight = rgb('#d49b6d'); // sun-bleached highlights
    const pebble = rgb('#8d7866');
    const pebbleDark = rgb('#5e5044');

    // Keep the outer edge square so adjacent cells meet without a shaded gap.
    const slab = sdf.box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE]).at(0, -SLAB / 2, 0);

    // Paint: warm base, soft darker patches, a few deeper pockets, and a few sun-lit
    // highlights across the top. Patches use low-frequency fbm for big soft shapes;
    // highlights use a different seed for an asymmetric, organic feel.
    const dirtColorAt = (x: number, y0: number, z: number) => {
      const y = y0 + OLD; // old height: top was at 0.08
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
    const painted = slab.paintFn((x, y, z) =>
      y > -0.01 ? dirtColorAt(x, y, z) : sideColor(x, y, z, (px, pz) => dirtColorAt(px, 0, pz)),
    );

    // Bump for soft packed-earth texture, applied via `bump` so it stays in the normal map.
    const bump = (x: number, y: number, z: number) =>
      y < -0.01 ? 0 : 0.6 * noise.fbm(x * 10, y * 2, z * 10, 3) + 0.4 * noise.fbm(x * 30, 0, z * 30, 2);

    k.body('dirt', painted, { color: '#b8855a', roughness: 0.92, metalness: 0, bump, maxTriangles: 8000 });

    // Pebbles: small spheres sitting on the top surface. Five pebbles, scattered but
    // off-center so the tile does not look symmetric. Slight per-pebble size variation,
    // and a darker rim via paintFn so each pebble reads as a rounded rock, not a flat dot.
    const pebbleSeed: Array<[number, number, number, number]> = [
      [-0.62, 0, -0.45, 0.02],
      [0.35, 0, 0.58, 0.018],
      [-0.18, 0, 0.72, 0.016],
      [0.68, 0, -0.55, 0.019],
      [-0.78, 0, 0.32, 0.015],
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
        return y < 0.005 ? mixRgb(c, pebbleDark, 0.3) : c;
      });
    k.body('pebbles', pebbles, { color: '#8d7866', roughness: 0.85, metalness: 0 });
  },
});
