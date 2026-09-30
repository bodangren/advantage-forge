import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — ruined stone column (architecture/structure/ruin-column), reworked.
 *
 * Role: forest-clearing landmark decor; must read as "broken column" at 128 px.
 * Size: about 1.05 m tall with the moss, 1.2 x 1.0 m footprint, on y = 0, faces +Z.
 * One idea: a short thick fluted stump under a heavy square capital, with chunky
 *   fallen blocks at its foot and moss cushions spreading over ground and capital.
 * Shape language: square dominant (plinth, capital, blocks), round secondary (shaft),
 *   organic accent (moss).
 * Palette: stone #8a94a0, light #b6bec6, dark #565e68, damp #3f464e; moss #7ec850 / #4a8a3f.
 * Materials: stone (roughness 0.9) for base, shaft+capital, fallen; moss (0.95).
 * Detail: primary stump + capital + rubble; secondary flutes, jagged break, moss cushions;
 *   tertiary stone grain in bump. Focal point: moss-topped capital.
 * Rig/animation: none.
 */

const STONE = rgb('#8a94a0');
const STONE_LIGHT = rgb('#b6bec6');
const STONE_DARK = rgb('#565e68');
const STONE_DEEP = rgb('#3f464e');
const MOSS = rgb('#7ec850');
const MOSS_DARK = rgb('#4a8a3f');

const FLUTES = 12;
// 1 at the bottom of a flute valley, 0 at a ridge crest.
const fluteValley = (x: number, z: number) => {
  const a = Math.atan2(z, x);
  const u = ((a + Math.PI) / (Math.PI * 2)) * FLUTES;
  const f = u - Math.floor(u);
  return Math.pow(0.5 - 0.5 * Math.cos(Math.PI * 2 * f), 2);
};

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

const stoneBump = (amp: number) => (x: number, y: number, z: number) =>
  amp * noise.fbm(x * 26, y * 26, z * 26, 2, 4);

export default defineAsset({
  name: 'ruin-column',
  description:
    'Broken ruined stone column: square base, fluted shaft snapped off in a slanted jagged break with a dripping moss cap, a fallen fluted drum, and rubble chunks with mossy feet.',
  detail: 0.01,
  reference: 'docs/item-mockups/ruin-column-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Shared moss dusting: fbm-gated green creep for low, damp stone surfaces.
    const mossDust = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) => {
      const m = clamp01(
        clamp01((0.42 - y) / 0.42) * 0.7 +
          noise.fbm(x * 7 + 13, y * 7, z * 7, 3, 31) * 0.55 -
          0.28,
      );
      const shade = clamp01(0.5 + 0.5 * noise.fbm(x * 15, y * 15, z * 15, 2, 8));
      return mixRgb(base, mixRgb(MOSS_DARK, MOSS, shade), m * 0.8);
    };

    // ------------------------------------------------------------- base + plinth
    const baseShape = sdf.box([0.6, 0.12, 0.6], 0.02).at(0, 0.06, 0);
    const basePaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 3, y * 4, z * 4, 3, 5);
      const speck = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2, 9);
      let c = mixRgb(STONE, STONE_DARK, 0.45 * patch);
      c = mixRgb(c, STONE_LIGHT, 0.09 * speck);
      // Worn upper edges, damp dark near the floor.
      const e = Math.max(Math.abs(x) / 0.31, Math.abs(z) / 0.31, Math.abs(y - 0.14) / 0.16);
      const wear =
        clamp01((e - 0.68) / 0.3) *
        (0.4 + 0.6 * (0.5 + 0.5 * noise.fbm(x * 13 + 2, y * 13, z * 13, 2, 6)));
      c = mixRgb(c, STONE_LIGHT, 0.45 * wear);
      c = mixRgb(c, STONE_DEEP, 0.5 * Math.pow(clamp01(1 - y / 0.3), 2));
      return mossDust(x, y, z, c);
    };
    k.body('base', baseShape.paintFn(basePaint), {
      color: '#8a94a0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      paintWeight: 2,
      bump: stoneBump(0.0022),
      maxTriangles: 1800,
    });

    // ------------------------------------------------------- fluted shaft, snapped
    const flutes = sdf.union(
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return sdf.capsule([0.165 * Math.cos(a), 0.2, 0.165 * Math.sin(a)], [0.165 * Math.cos(a), 0.86, 0.165 * Math.sin(a)], 0.03);
      }),
    );
    const brk = sdf.box([0.5, 0.2, 0.5]).rotate(12, 0, -8).at(0.05, 0.9, 0);
    const chips = sdf.union(
      sdf.sphere(0.035).at(0.13, 0.8, 0.06),
      sdf.sphere(0.03).at(-0.1, 0.81, -0.1),
    );
    const capital = sdf.box([0.5, 0.16, 0.5], 0.03).at(0, 0.9, 0);
    const ring = sdf.torus(0.2, 0.04).at(0, 0.8, 0);
    const shaftShape = sdf
      .smoothUnion(
        0.01,
        sdf.cylinder(0.16, 0.78).at(0, 0.51, 0).subtract(flutes).subtract(brk).subtract(chips),
        capital,
        ring,
      );
    const shaftPaint = (x: number, y: number, z: number) => {
      const g = fluteValley(x, z);
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 5, y * 4, z * 4, 3, 12);
      let c = mixRgb(STONE, STONE_DARK, 0.42 * patch);
      c = mixRgb(c, STONE_DARK, 0.6 * g); // flute valleys catch shadow
      const t = clamp01((y - 0.12) / 0.9);
      c = mixRgb(c, STONE_LIGHT, 0.16 * t * t); // sunlit toward the break
      c = mixRgb(c, STONE_DEEP, 0.4 * Math.max(0, 1 - t * 2.4)); // damp foot
      // Raw broken stone: pale fresh fracture on the jagged top.
      c = mixRgb(c, STONE_LIGHT, 0.15 * clamp01((y - 0.85) / 0.15));
      return c;
    };
    k.body('shaft', shaftShape.paintFn(shaftPaint), {
      color: '#8a94a0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      bump: stoneBump(0.0016),
      maxTriangles: 2600,
    });

    // -------------------------------------------------- fallen drum + rubble chunks
    // Drum lies on its side, bitten end up; two half-sunk chunks tumbled nearby.
    const blk = (rx: number, ry: number, rz: number, x: number, y: number, z: number, w = 0.28, h = 0.2, d = 0.22) =>
      sdf.box([w, h, d], 0.03).rotate(rx, ry, rz).at(x, y, z);
    const drum = sdf.box([0.3, 0.16, 0.3], 0.03).rotate(8, 25, 10).at(0.62, 0.08, 0.1);
    const fallenShape = sdf
      .smoothUnion(
        0.006,
        blk(10, 25, 12, -0.45, 0.1, 0.1),
        blk(-8, -30, -10, 0.45, 0.09, -0.3),
        blk(6, 50, 15, -0.2, 0.09, 0.4),
        blk(-12, 10, 8, 0.25, 0.1, 0.42),
        drum,
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const fallenPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 8, y * 4, z * 4, 3, 17);
      const speck = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2, 23);
      let c = mixRgb(STONE, STONE_DARK, 0.46 * patch);
      c = mixRgb(c, STONE_LIGHT, 0.09 * speck);
      c = mixRgb(c, STONE_LIGHT, 0.35 * clamp01((y - 0.14) / 0.16)); // sunlit tops
      c = mixRgb(c, STONE_DEEP, 0.5 * Math.pow(clamp01(1 - y / 0.16), 2)); // damp bottoms
      return mossDust(x, y, z, c);
    };
    k.body('fallen', fallenShape.paintFn(fallenPaint), {
      color: '#8a94a0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      paintWeight: 2,
      bump: stoneBump(0.002),
      maxTriangles: 1800,
    });

    // ------------------------------------------------------------------------ moss
    // Lumpy cap over the break, three drips over the rim, two crusts at the base.
    const cap = sdf
      .ellipsoid([0.28, 0.06, 0.28])
      .displace(0.012, (x, y, z) => noise.fbm(x * 20 + 3, y * 20, z * 20, 2, 14))
      .at(0, 0.98, 0);
    const drips = sdf.union(
      sdf.ellipsoid([0.03, 0.08, 0.03]).at(0.22, 0.92, 0.2),
      sdf.ellipsoid([0.026, 0.07, 0.026]).at(-0.15, 0.93, 0.24),
    );
    const cushion = (sx: number, sy: number, sz: number, x: number, z: number, seed: number) =>
      sdf
        .ellipsoid([sx, sy, sz])
        .displace(0.01, (px, py, pz) => noise.fbm(px * 20 + seed, py * 20, pz * 20, 2, seed))
        .at(x, sy * 0.6, z);
    const crusts = sdf.union(
      cushion(0.3, 0.06, 0.25, 0.1, 0.42, 27),
      cushion(0.28, 0.055, 0.22, -0.35, -0.3, 33),
      cushion(0.3, 0.06, 0.25, 0.4, 0.3, 41),
    );
    const mossShape = sdf.smoothUnion(0.012, cap, drips, crusts);
    const mossPaint = (x: number, y: number, z: number) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2, 19);
      let c = mixRgb(MOSS_DARK, MOSS, n);
      c = mixRgb(c, MOSS, 0.35 * clamp01((y - 0.95) / 0.08)); // bright crown
      return c;
    };
    k.body('moss', mossShape.paintFn(mossPaint), {
      color: '#7ec850',
      roughness: 0.95,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxTriangles: 1400,
    });
  },
});
