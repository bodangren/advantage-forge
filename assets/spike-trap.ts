import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — dungeon spike trap tile (props/world/spike-trap).
 *
 * Role: floor trap prop in the Sunken Vault dungeon; must read at 128 px as a
 *   chunky trapped floor tile with sixteen sharp iron spikes poking through.
 * Size: 1.0 m x 0.08 m x 1.0 m stone slab on y = 0 (top at y = 0.08); front
 *   faces +Z; the spikes rise from y = 0.02 (sunk in the slab) to y = 0.20.
 * One idea: a chunky dungeon floor tile with sixteen sharp iron spikes poking
 *   halfway up — half hidden in the slab, half visible — so the danger reads
 *   before the player steps on it.
 * Shape language: square dominant (slab, cube layout), triangular secondary
 *   (the sharp spikes).
 * Palette (dungeon contract): cool gray stone #6f7680, dark stone #4b525c,
 *   worn stone #8a8e96; iron #4a4f55, iron shadow #363a3f, iron highlight
 *   #a8acb1; tiny warm rust #6e4830.
 * Materials: one stone body (roughness 0.9, metalness 0) and one iron body
 *   (roughness 0.5, metalness 0.7). Wear, mortar grit, and rust variation live
 *   in paint and bump.
 * Detail: primary stone slab + 4x4 spike grid; secondary shallow mortar depressions
 *   around each spike (the "holes"); tertiary worn iron and rust patches.
 * Focal point: the 4x4 grid of sharp iron spikes.
 * Rig/animation: none (static prop).
 */

const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#4b525c');
const STONE_LIGHT = rgb('#8a8e96');
const STONE_DEEP = rgb('#3b4148');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const RUST = rgb('#6e4830');

const SIZE = 1.0;
const THICK = 0.08;
const GRID = 4;
const CELL = SIZE / GRID; // 0.25
const SPIKE_H = 0.12; // height above slab
const SPIKE_BASE = 0.038; // base radius
const SPIKE_TIP = 0.003; // tip radius (sharp)
const HOLE_R = 0.052; // hole/depression radius
const HOLE_LIFT = 0.018; // how deep the depression sinks into the slab

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const s = clamp01((v - a) / (b - a));
  return s * s * (3 - 2 * s);
};

// Center positions for the 4x4 grid.
const CENTERS: ReadonlyArray<readonly [number, number]> = (() => {
  const out: Array<[number, number]> = [];
  const half = (GRID - 1) / 2;
  for (let iz = 0; iz < GRID; iz++) {
    for (let ix = 0; ix < GRID; ix++) {
      out.push([(ix - half) * CELL, (iz - half) * CELL]);
    }
  }
  return out;
})();

export default defineAsset({
  name: 'spike-trap',
  description:
    'A 1.0 m square dungeon stone slab 0.08 m thick with a 4x4 grid of sixteen sharp iron spikes poking halfway up through shallow mortar holes.',
  detail: 0.006,
  reference: 'docs/item-mockups/spike-trap-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- stone slab
    // A chunky slab with soft bevels on every edge; the shallow depressions at
    // each grid point read as the holes the spikes poke through. The slab sits
    // on y = 0 (the bottom is clipped by a half-space so it grounds cleanly).
    let slab = sdf.box([SIZE, THICK, SIZE], 0.018).at(0, THICK / 2, 0);
    // Shallow mortar depressions around every spike: a slightly larger radius
    // cylinder sunk into the top, intersected with the slab so it cannot
    // poke out the bottom.
    const depressions = CENTERS.map(([x, z]) =>
      sdf.cylinder(HOLE_R, HOLE_LIFT + 0.005).at(x, THICK - HOLE_LIFT + 0.001, z),
    );
    const depression = sdf.union(...depressions);
    slab = sdf.subtract(slab, depression);
    slab = slab.intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------- iron spikes
    // Sixteen sharp tapered cones, each sunk 0.06 m into the slab so the base
    // is hidden in the depression and the visible portion above the slab is
    // SPIKE_H. Slight per-spike jitter on tip y and base radius for a hand-set
    // read so they don't look cast from a mold.
    let spikes: import('../src/index.js').Sdf = sdf.union(
      ...CENTERS.map(([x, z]) =>
        sdf.cone(
          [x, 0.02, z],
          [x, THICK + SPIKE_H + (noise.random(x * 13.7 + z * 5.3, 11) - 0.5) * 0.012, z],
          SPIKE_BASE + (noise.random(x * 7.1 + z * 3.9, 17) - 0.5) * 0.005,
          SPIKE_TIP,
        ),
      ),
    );

    // ------------------------------------------------------------- stone paint
    // Cool gray stone with per-block tonal drift, mortar grit inside the
    // depressions, dirtier toward the bottom, soft pale highlights on the
    // outer edges that catch the studio key light.
    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      // Per-tile tonal drift so big surfaces aren't flat gray.
      const patch = noise.fbm(x * 2.4 + 1.3, 0, z * 2.4, 2);
      let c = mixRgb(STONE_DARK, STONE_LIGHT, clamp01(0.5 + 0.5 * patch * 0.7));
      // Stone tiles of the canon style are slightly warmer than pure gray;
      // a soft warm bias keeps it from feeling sterile.
      c = mixRgb(c, base, 0.5);
      // Fine mottling inside each block (low frequency so the reducer is
      // happy with the painted area).
      const mot = noise.fbm(x * 8, y * 6, z * 8, 2);
      c = mixRgb(c, mot > 0 ? STONE_LIGHT : STONE_DARK, Math.abs(mot) * 0.16);
      // Mortar grit inside every depression (each spike hole).
      let nearHole = 0;
      for (const [hx, hz] of CENTERS) {
        const r = Math.hypot(x - hx, z - hz);
        const inRing = smoothstep(HOLE_R + 0.012, HOLE_R - 0.002, r);
        const topness = smoothstep(THICK - HOLE_LIFT - 0.002, THICK - HOLE_LIFT + 0.004, y);
        nearHole = Math.max(nearHole, inRing * topness);
      }
      c = mixRgb(c, STONE_DEEP, 0.55 * nearHole);
      // Ground shadow at the bottom so the slab reads as heavy and grounded.
      const low = smoothstep(0.04, 0.0, y);
      c = mixRgb(c, STONE_DARK, low * 0.5);
      // Pale worn top edges (the bevel catches the light).
      const topness = smoothstep(THICK - 0.012, THICK, y);
      c = mixRgb(c, STONE_LIGHT, topness * 0.12);
      return c;
    };

    const stoneBump = (x: number, y: number, z: number): number => {
      // Fine stone grit over the whole surface; the depressions sit slightly
      // below the bed plane.
      const base = 0.0018 * noise.fbm(x * 28, y * 22, z * 28, 2);
      let nearHole = 0;
      for (const [hx, hz] of CENTERS) {
        const r = Math.hypot(x - hx, z - hz);
        const inRing = smoothstep(HOLE_R + 0.012, HOLE_R - 0.002, r);
        const topness = smoothstep(THICK - HOLE_LIFT - 0.002, THICK - HOLE_LIFT + 0.004, y);
        nearHole = Math.max(nearHole, inRing * topness);
      }
      return base - 0.0028 * nearHole;
    };

    k.body('stone', slab.paintFn(stonePaint), {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      textureDensity: 2,
      maxError: 0.003,
      maxTriangles: 1800,
      bump: stoneBump,
    });

    // ------------------------------------------------------------- iron paint
    // Iron with worn cast patches, brighter highlights on the ridges, darker
    // shadows in the valleys. A few spikes get a touch of warm rust for
    // variation, but most stay clean dark iron (the trap is active).
    const ironPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      // Per-spike tonal drift: some spikes feel a touch cleaner and brighter,
      // others slightly duller and more pitted.
      const sx = Math.round(x / CELL) * CELL;
      const sz = Math.round(z / CELL) * CELL;
      const spikeSeed = noise.random(sx * 13.1, sz * 17.3, 5);
      // Vertical streakiness that hints at forging marks on the iron.
      const vert = noise.fbm(x * 18, y * 6, z * 18, 2);
      let c = mixRgb(IRON_DARK, base, clamp01(0.45 + 0.4 * vert));
      c = mixRgb(c, IRON_LIGHT, clamp01(vert - 0.2) * 0.5);
      // Brighter sharp tip and brighter base where the spike enters the stone
      // (a soft rim that catches light on the cap).
      const r = Math.hypot(x - sx, z - sz);
      const tipBand = smoothstep(THICK + SPIKE_H - 0.012, THICK + SPIKE_H, y);
      const baseBand = smoothstep(THICK - 0.008, THICK + 0.004, y) * smoothstep(0.018, 0.005, r);
      c = mixRgb(c, IRON_LIGHT, 0.28 * (tipBand + baseBand * 0.7));
      // Per-spike variation: clean spikes lean bright, pitted spikes lean dark.
      c = mixRgb(c, IRON_LIGHT, 0.08 * (spikeSeed - 0.5));
      c = mixRgb(c, IRON_DARK, 0.1 * (0.5 - spikeSeed) * (0.5 + 0.5 * vert));
      // Two spikes get a touch of warm rust near their bases.
      const rustHere =
        spikeSeed > 0.78 && y < THICK + SPIKE_H * 0.35 && r < SPIKE_BASE * 0.9;
      c = rustHere ? mixRgb(c, RUST, 0.4) : c;
      // Subtle speckle keeps the iron from feeling flat at sprite size.
      const sp = noise.fbm(x * 60, y * 60, z * 60, 2);
      c = mixRgb(c, IRON_LIGHT, clamp01(sp) * 0.08);
      c = mixRgb(c, IRON_DARK, clamp01(-sp) * 0.14);
      return c;
    };

    const ironBump = (x: number, y: number, z: number): number =>
      0.0008 * noise.fbm(x * 48, y * 36, z * 48, 2);

    k.body('iron', spikes.paintFn(ironPaint), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      paintWeight: 1.5,
      maxTriangles: 2000,
      bump: ironBump,
    });
  },
});