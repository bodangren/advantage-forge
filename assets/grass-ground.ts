/**
 * Modular grass ground tile for a cozy chibi fantasy hamlet map.
 * Exactly 2 m square, 0.08 m thick, sits on y = 0 with the top surface at y = 0.08.
 * Straight tile edges so neighbours repeat without seams. No grass blades, no rigging.
 *
 * Palette: bright cheerful green dominant, slightly darker variation, pale lime flecks.
 * Shape language: round (soft, friendly). Focal point: a few lighter flecks on top.
 */

import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import { tileSurface } from '../src/tile-surface.js';

const grass = rgb('#5fb14d');      // bright cheerful grass (dominant)
const grassDark = rgb('#3d8a37');  // shadow patches for soft variation
const fleckColor = rgb('#a8d76c');  // pale sunlit flecks (accent)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Repeat noise across the 2 m tile so opposite painted edges have the same color. */
function tileNoise(x: number, z: number, frequency: number, octaves: number): number {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, 0, sz * frequency, octaves);
  return lerp(
    lerp(sample(x, z), sample(x - 2, z), u),
    lerp(sample(x, z - 2), sample(x - 2, z - 2), u),
    v,
  );
}

// Lighter flecks as flat ellipses in XZ. Centers and radii stay inside the 2 m boundary.
const FLECKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-0.72, 0, -0.55, 0.10],
  [ 0.62, 0,  0.78, 0.11],
  [-0.30, 0,  0.45, 0.08],
  [ 0.78, 0, -0.25, 0.09],
  [-0.85, 0,  0.20, 0.08],
  [ 0.20, 0, -0.80, 0.09],
  [ 0.85, 0,  0.40, 0.08],
  [-0.10, 0, -0.05, 0.07],
  [ 0.40, 0,  0.10, 0.08],
  [-0.55, 0,  0.65, 0.07],
  [ 0.15, 0,  0.50, 0.09],
  [ 0.45, 0, -0.55, 0.08],
];

/** Return a 0..1 fleck weight: 1 inside the fleck, fading to 0 at the soft edge. */
function fleckWeight(x: number, z: number): number {
  let w = 0;
  for (const [cx, , cz, r] of FLECKS) {
    const dx = (x - cx) / r;
    const dz = (z - cz) / (r * 0.85);
    const d2 = dx * dx + dz * dz;
    if (d2 < 1) w = Math.max(w, 1 - Math.sqrt(d2));
  }
  return w;
}

function grassColorAt(x: number, y: number, z: number) {
  const onTop = y > 0.07;
  const big = tileNoise(x, z, 2.4, 3);
  const small = tileNoise(x, z, 7, 2);
  const v = Math.max(0, Math.min(1, big * 0.45 + small * 0.25 + 0.5));
  const topColor = mixRgb(grass, grassDark, v * 0.45);
  const baseColor = onTop ? topColor : mixRgb(grass, grassDark, 0.35);
  if (!onTop) return baseColor;
  const w = fleckWeight(x, z);
  return w > 0 ? mixRgb(baseColor, fleckColor, w * 0.5) : baseColor;
}

export default defineAsset({
  name: 'grass-ground',
  description: 'A 2 m square modular grass ground tile with soft green variation and pale flecks.',
  detail: 0.025,
  texture: { size: 1024 },

  build(k) {
    // Tile body: 2 x 0.08 x 2 m. Bottom at y = 0, top at y = 0.08.
    // Keep the outer edge square. Rounded tile edges expose dark gaps between cells.
    const tile = sdf.box([2, 0.08, 2]).at(0, 0.04, 0);

    // Soft color variation only on the top surface (y > 0.07). Two octaves of noise give
    // large soft patches plus a hint of smaller speckle. Sides and bottom get a slightly
    // darker tone so the tile reads as one mass.
    const grassBody = tile.paintFn(grassColorAt);

    // Bump on the top only, so the sides stay flat (good for tiling) and the top
    // catches light as soft grass texture.
    const topBump = (x: number, y: number, z: number) =>
      y > 0.07 ? 0.004 * tileNoise(x, z, 14, 2) : 0;

    k.body('grass', grassBody, {
      color: '#5fb14d',
      roughness: 0.85,
      bump: topBump,
    });
    k.add('grass-top', tileSurface('grass-top', (x, z) => grassColorAt(x, 0.08, z)));
  },
});
