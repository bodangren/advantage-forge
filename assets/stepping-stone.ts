import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * architecture/landscape-parts/stepping-stone — cottage-yard stepping-stone path piece.
 *
 * Role: short garden path the player walks past; must read at the 128 px sprite size.
 * Size: 2 m square flush grass base (top at y = 0.08, matches grass-ground tiles),
 *   5 rounded stones in a gentle S-line along Z over ~1.6 m, each 0.25–0.35 m across
 *   and 0.035–0.05 m proud of the grass. Faces +Z. No rig, no animation.
 * One idea: five worn pebble-soft stones wandering through bright cottage grass.
 * Shape language: round dominant (friendly, worn), flat tile secondary (flush, tidy).
 * Palette: warm light-gray stone #9c988d / dark #67645c / lit crown #c9c4b6 (well family,
 *   boulder-style vertical shading), grass #5fb14d / dark #3d8a37 / fleck #a8d76c
 *   (grass-ground family), tuft blades #4f9e3e.
 * Materials: stone (roughness 0.9, grain in bump), grass (roughness 0.85),
 *   tufts (roughness 0.85).
 * Detail list: grass tile with pale flecks (big), five domed stones (medium, focal),
 *   cone-triple tufts between stones (small).
 */

const TOP = 0.08;

const STONE = rgb('#9c988d');
const STONE_DARK = rgb('#67645c');
const STONE_LIGHT = rgb('#c9c4b6');
const STONE_FLECK = rgb('#6f675a');
const GRASS = rgb('#5fb14d');
const GRASS_DARK = rgb('#3d8a37');
const GRASS_FLECK = rgb('#a8d76c');
const BLADE = rgb('#4f9e3e');

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

// Pale sunlit flecks on the lawn, kept clear of the stone path center (|x| < 0.3).
const FLECKS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.62, -0.6, 0.1],
  [0.6, -0.72, 0.09],
  [-0.7, 0.05, 0.08],
  [0.68, 0.1, 0.1],
  [-0.55, 0.62, 0.09],
  [0.55, 0.68, 0.08],
  [-0.35, -0.88, 0.07],
  [0.82, -0.3, 0.07],
  [-0.85, -0.15, 0.07],
  [0.35, 0.9, 0.07],
];

function fleckWeight(x: number, z: number): number {
  let w = 0;
  for (const [cx, cz, r] of FLECKS) {
    const dx = (x - cx) / r;
    const dz = (z - cz) / (r * 0.85);
    const d2 = dx * dx + dz * dz;
    if (d2 < 1) w = Math.max(w, 1 - Math.sqrt(d2));
  }
  return w;
}

// [x, z, rx, rz, heightAboveGrass]
const STONES: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0.03, -0.78, 0.15, 0.14, 0.04],
  [-0.1, -0.4, 0.165, 0.15, 0.05],
  [0.06, -0.01, 0.175, 0.16, 0.05],
  [0.13, 0.37, 0.15, 0.155, 0.045],
  [-0.02, 0.75, 0.135, 0.14, 0.035],
];

export default defineAsset({
  name: 'stepping-stone',
  description:
    'Cottage-yard stepping-stone path: five worn light-gray stones in a gentle line on a flush 2 m grass base with tufts.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- grass base
    // Same footprint as grass-ground (2 x 0.08 x 2 m) so it tiles beside grass tiles.
    const tile = sdf.box([2, 0.08, 2], 0.006).at(0, 0.04, 0);
    const grassBody = tile.paintFn((x, y, z) => {
      const onTop = y > 0.07;
      if (!onTop) return mixRgb(GRASS, GRASS_DARK, 0.35);
      const big = noise.fbm(x * 2.4, 0, z * 2.4, 3);
      const small = noise.fbm(x * 7, 0, z * 7, 2);
      const v = clamp01(big * 0.45 + small * 0.25 + 0.5);
      const top = mixRgb(GRASS, GRASS_DARK, v * 0.45);
      const w = fleckWeight(x, z);
      return w > 0 ? mixRgb(top, GRASS_FLECK, w * 0.75) : top;
    });
    k.body('grass', grassBody, {
      color: '#5fb14d',
      roughness: 0.85,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 1100,
      bump: (x, y, z) => (y > 0.07 ? 0.004 * noise.fbm(x * 14, 0, z * 14, 2) : 0),
    });

    // ------------------------------------------------------------- stones
    // Flattened worn domes: the ellipsoid center sits below the lawn so the rim
    // meets the grass in a soft buried edge; the visible cap is 0.035–0.05 m tall.
    const stoneShapes = STONES.map(([sx, sz, rx, rz, h], i) => {
      const ry = 0.03 + h / 2;
      return sdf
        .ellipsoid([rx, ry, rz])
        .rotateY((i * 37) % 30 - 15)
        .at(sx, TOP + h - ry, sz)
        .displace(0.006, (x, y, z) => noise.fbm(x * 9 + i * 3.1, y * 9, z * 9, 2));
    });
    const stones = sdf
      .union(...stoneShapes)
      .paintFn((x, y, z) => {
        const t = clamp01((y - TOP) / 0.05);
        let c = mixRgb(STONE_DARK, STONE, clamp01(0.35 + t * 0.65));
        c = mixRgb(c, STONE_LIGHT, clamp01((t - 0.55) / 0.45) * 0.35);
        // Soft soil shadow where the stone dives into the lawn.
        const contact = clamp01((TOP + 0.008 - y) / 0.02);
        c = mixRgb(c, STONE_DARK, contact * 0.45);
        const patch = noise.fbm(x * 6, y * 6, z * 6, 2);
        c = mixRgb(c, STONE_DARK, clamp01(-patch) * 0.35);
        c = mixRgb(c, STONE_LIGHT, clamp01(patch) * 0.14);
        const spots = noise.fbm(x * 42, y * 42, z * 42, 2);
        c = mixRgb(c, STONE_FLECK, clamp01((spots - 0.55) * 3) * 0.4);
        return c;
      });
    k.body('stones', stones, {
      color: '#8d8a82',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 1500,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.002 * noise.fbm(x * 36, y * 36, z * 36, 2) + 0.0008 * noise.noise3(x * 95, y * 95, z * 95),
    });

    // ------------------------------------------------------------- grass tufts
    // Cone triples between the stones, leaning slightly; blades stay inside the
    // tile's greens so they melt into neighboring grass tiles.
    const tuft = (x: number, z: number, s: number) =>
      sdf.union(
        sdf.cone([x, TOP - 0.004, z], [x - 0.02 * s, TOP + 0.068 * s, z + 0.012 * s], 0.016 * s, 0.002),
        sdf.cone(
          [x + 0.012 * s, TOP - 0.004, z - 0.008 * s],
          [x + 0.03 * s, TOP + 0.052 * s, z - 0.016 * s],
          0.013 * s,
          0.002,
        ),
        sdf.cone(
          [x - 0.006 * s, TOP - 0.004, z - 0.014 * s],
          [x - 0.024 * s, TOP + 0.046 * s, z - 0.028 * s],
          0.012 * s,
          0.002,
        ),
      );
    const tufts = sdf.union(
      tuft(-0.3, -0.59, 1.1),
      tuft(0.24, -0.6, 0.95),
      tuft(0.3, -0.2, 1.2),
      tuft(-0.28, -0.14, 1.0),
      tuft(-0.24, 0.22, 1.15),
      tuft(0.35, 0.18, 0.9),
      tuft(0.22, 0.57, 1.05),
      tuft(-0.3, 0.55, 0.9),
    );
    k.body('tufts', tufts, {
      color: '#4f9e3e',
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 400,
    });
  },
});
