/**
 * Modular grass ground tile for a cozy chibi fantasy hamlet map.
 * Exactly 2 m square, a 0.3 m slab: the walkable top is at y = 0 and the soil goes down to
 * y = -0.3, like every ground tile (scenes and games stand props and characters on y = 0).
 * Straight tile edges so neighbours repeat without seams. No grass blades, no rigging.
 * Sides: a grass lip with a wavy drip edge over layered brown soil (seen at the map edge).
 *
 * Palette: bright cheerful green dominant, slightly darker variation, pale lime flecks.
 * Shape language: round (soft, friendly). Focal point: a few lighter flecks on top.
 */

import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

const grass = rgb('#5fb14d');      // bright cheerful grass (dominant)
const grassDark = rgb('#3d8a37');  // shadow patches for soft variation
const fleckColor = rgb('#a8d76c');  // pale sunlit flecks (accent)
const soil = rgb('#7a4a2a');       // side soil
const soilDark = rgb('#57331d');   // soil strata and the lower side
const pebble = rgb('#9a8a78');     // small stones in the soil

const SLAB = 0.3; // ground tile depth: top at y = 0, bottom at y = -0.3
const EDGE = 0.001; // meshing can place a sharp box edge up to 2 mm inside; 1 mm of overlap never leaves a gap

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

/** Side color: a grass lip with a wavy drip edge over soil strata. Periodic along each edge. */
function sideColorAt(x: number, y: number, z: number) {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
  if (y > -drip) return mixRgb(grass, grassDark, 0.25 + 0.3 * Math.min(1, -y / drip));
  const depth = -y / SLAB; // 0 at the top, 1 at the bottom
  let c = mixRgb(soil, soilDark, 0.15 + depth * 0.55);
  const strata = Math.sin((y + 0.02 * Math.sin(along * Math.PI * 2)) * 70);
  c = mixRgb(c, soilDark, Math.max(0, strata - 0.6) * 0.8);
  const n = noise.fbm(along * 9, y * 9, 3.1, 2);
  if (n > 0.45) c = mixRgb(c, pebble, Math.min(1, (n - 0.45) * 6) * 0.8);
  return c;
}

function grassColorAt(x: number, y: number, z: number) {
  const onTop = y > -0.01;
  const big = tileNoise(x, z, 2.4, 3);
  const small = tileNoise(x, z, 7, 2);
  const v = Math.max(0, Math.min(1, big * 0.45 + small * 0.25 + 0.5));
  const topColor = mixRgb(grass, grassDark, v * 0.45);
  if (!onTop) return sideColorAt(x, y, z);
  const w = fleckWeight(x, z);
  return w > 0 ? mixRgb(topColor, fleckColor, w * 0.5) : topColor;
}

export default defineAsset({
  name: 'grass-ground',
  description: 'A 2 m square modular grass ground tile, a 0.3 m slab with its top at y = 0: soft green variation and pale flecks on top, a grass lip over layered soil on the sides.',
  detail: 0.025,
  texture: { size: 1024 },

  build(k) {
    // Tile body: 2 x 0.3 x 2 m. Top at y = 0, bottom at y = -0.3.
    // Keep the outer edge square. Rounded tile edges expose dark gaps between cells.
    // The box is 2 mm larger than the tile, so neighbours never show a gap after meshing.
    const tile = sdf.box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE]).at(0, -SLAB / 2, 0);

    // Soft color variation on the top surface (y > -0.01). Two octaves of noise give
    // large soft patches plus a hint of smaller speckle. The sides show a grass lip over soil.
    const grassBody = tile.paintFn(grassColorAt);

    // Bump on the top only, so the sides stay flat (good for tiling) and the top
    // catches light as soft grass texture.
    const topBump = (x: number, y: number, z: number) =>
      y > -0.01 ? 0.004 * tileNoise(x, z, 14, 2) : 0;

    k.body('grass', grassBody, {
      color: '#5fb14d',
      roughness: 0.85,
      bump: topBump,
    });
  },
});
