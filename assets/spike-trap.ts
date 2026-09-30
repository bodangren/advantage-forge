import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — dungeon spike trap (props/world/spike-trap), reworked.
 *
 * Role: floor trap prop in the Sunken Vault; must read at 128 px as a trap,
 *   not a bed of nails.
 * Size: 1.0 x 1.0 m footprint on y = 0, faces +Z. Blocks 0.16 m tall, spikes
 *   reach y 0.45.
 * One idea: four chunky hewn stone blocks around a round gold-marked pressure
 *   plate, one big iron spike on each block.
 * Shape language: square dominant (blocks), triangular secondary (spikes),
 *   round accent (plate, socket rings).
 * Palette: stone #6f7680, dark #4b525c, worn top #8a8e96; iron #4a4f55 with
 *   #a8acb1 highlight; gold arrow #d4a93a; rust accent #8a3a2a.
 * Materials: stone (rough 0.9), iron (rough 0.5, metal 0.7), gold arrow
 *   (rough 0.35, metal 1), rust blob (rough 0.9).
 * Detail: primary blocks + spikes; secondary plate rim, socket rings, arrow;
 *   tertiary hewn displacement, rust blob. Focal point: the four spikes.
 * Rig/animation: none.
 */

const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#4b525c');
const STONE_LIGHT = rgb('#8a8e96');
const IRON = rgb('#4a4f55');
const IRON_LIGHT = rgb('#a8acb1');
const GOLD = rgb('#d4a93a');
const RUST = rgb('#8a3a2a');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const s = clamp01((v - a) / (b - a));
  return s * s * (3 - 2 * s);
};

const OFFS: ReadonlyArray<readonly [number, number]> = [
  [0.26, 0.26],
  [-0.26, 0.26],
  [0.26, -0.26],
  [-0.26, -0.26],
];
const TOP = 0.16;

export default defineAsset({
  name: 'spike-trap',
  description:
    'Dungeon spike trap: four chunky hewn stone blocks around a round pressure plate with a gold arrow, one large iron spike on each block.',
  detail: 0.006,
  reference: 'docs/item-mockups/spike-trap-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ stone
    const blocks = OFFS.map(([x, z], i) => {
      const body = sdf
        .box([0.44, 0.16, 0.44], 0.04)
        .smoothUnion(0.03, sdf.box([0.47, 0.05, 0.47], 0.02).at(0, -0.055, 0))
        .at(x, 0.08, z);
      return body.displace(0.008, (px, py, pz) => noise.fbm(px * 14 + i * 3, py * 14, pz * 14, 3));
    });
    const plate = sdf
      .cylinder(0.16, 0.06, 0.01)
      .at(0, 0.06, 0)
      .smoothUnion(0.01, sdf.torus(0.155, 0.017).at(0, 0.09, 0));
    const stone = sdf.union(...blocks, plate).intersect(sdf.halfSpace([0, -1, 0], 0));

    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      let c = mixRgb(STONE_DARK, base, smoothstep(0.02, 0.15, y));
      c = mixRgb(c, STONE_LIGHT, smoothstep(0.145, 0.16, y) * 0.75);
      const n = noise.fbm(x * 9, y * 6, z * 9, 2);
      c = mixRgb(c, n > 0 ? STONE_LIGHT : STONE_DARK, Math.abs(n) * 0.18);
      return c;
    };
    k.body('stone', stone.paintFn(stonePaint), {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      paintWeight: 2,
      textureDensity: 2,
      maxTriangles: 2500,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 24, z * 30, 2),
    });

    // ------------------------------------------------------------------- gold
    const arrow = sdf
      .extrude(
        profile.polygon([
          [-0.06, -0.05],
          [0, 0.07],
          [0.06, -0.05],
          [0, -0.02],
        ]),
        0.01,
        0.002,
      )
      .rotateX(90)
      .at(0, 0.095, 0);
    k.body('arrow', arrow, {
      color: GOLD,
      roughness: 0.35,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 600,
    });

    // ------------------------------------------------------------------- iron
    const spikes = sdf.union(
      ...OFFS.map(([x, z]) => {
        const cone = sdf.cone([x, TOP - 0.02, z], [x, 0.45, z], 0.06, 0.006);
        const ring = sdf.torus(0.07, 0.015).at(x, TOP + 0.005, z);
        return cone.smoothUnion(0.01, ring);
      }),
    );
    const ironPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      let c = mixRgb(base, IRON_LIGHT, smoothstep(0.3, 0.42, y) * 0.8);
      const ringy = smoothstep(0.2, 0.15, y);
      c = mixRgb(c, STONE_DARK, ringy * 0.85);
      const n = noise.fbm(x * 40, y * 30, z * 40, 2);
      return mixRgb(c, IRON_LIGHT, clamp01(n) * 0.08);
    };
    k.body('iron', spikes.paintFn(ironPaint), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      paintWeight: 1.5,
      maxTriangles: 2200,
    });

    // ------------------------------------------------------------------- rust
    k.body('rust', sdf.sphere(0.03).at(0.42, 0.13, 0.5), {
      color: RUST,
      roughness: 0.9,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 300,
    });
  },
});
