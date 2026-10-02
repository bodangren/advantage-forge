import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * dungeon/structure/floor — modular 2 x 2 m stone floor tile.
 *
 * - Role: the ground the party walks on in the dungeon kit. Seen from a high game camera
 *   and as a 128 px sprite, so the grout grid must carry the read, not fine relief.
 * - Size: 2 x 2 m footprint, module base 0.072 m thick; flagstone tops flush at y = 0.08
 *   (same walking plane as the hamlet ground tiles). Origin centered, bottom on y = 0.
 * - The one idea: cool worn flagstones in a chunky grid, grout lines dark as slate shadow,
 *   a few patches of stone still wet and glossy from the dungeon drip.
 * - Shape language: square and sturdy (a modular kit), softened by a 10 mm bevel on every
 *   slab. Module edges stay square so tiles mate edge-to-edge with no lip.
 * - Palette (dungeon contract):
 *     grout / deep shadow  #2a3547
 *     slab sides / blocks  #4a5d75
 *     pale worn tops       #7a8ba0   (worn highlight #8b9caf)
 *     wet stone            #5a6c82 at roughness 0.28
 *     moss seasoning       #3f8a7a, two soft blobs in the grout
 * - Materials: one grout body (roughness 0.92), one flagstone body (0.8), one wet-sheen
 *   body (0.28) whose paint matches the slab tops so only the gloss differs.
 * - Detail list: 3x3 grid of flagstones with three split cells (primary), bevels and
 *   per-slab value tint (secondary), worn pale patches + grain in bump (tertiary).
 *   Focal point: the pale, wet-worn center slab.
 * - No rig, no animation. Surface variation is bump only, never displace.
 */

const TOP = 0.08; // walking surface, flush with the hamlet ground tiles
const BASE_H = 0.072; // grout floor height (module base top)
const SLAB_H = 0.024; // flagstone box height (sunk into the base)
const SLAB_Y = TOP - SLAB_H / 2; // flagstone box center
const RELIEF = TOP - BASE_H; // how far slabs sit above the grout floor
const CELL = 2 / 3; // grid pitch: three flagstone cells per 2 m side
const GROUT = 0.045; // grout band width, centered on every grid line
const HALF = CELL / 2 - GROUT / 2; // half-size of a full-cell slab (grout takes g/2 per side)
const BEVEL = 0.01; // soft edge on every slab

// Palette (dungeon contract)
const DEEP = rgb('#2a3547'); // grout, slab feet, cracks
const MID = rgb('#4a5d75'); // slab sides and shaded tops
const PALE = rgb('#5d7088'); // worn slab tops
const PALE_LIT = rgb('#6a7d95'); // worn-smooth highlights
const WET = rgb('#5a6c82'); // wet stone: darker, glossier
const MOSS = rgb('#3f8a7a'); // teal-green seasoning in the grout

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/** A flagstone rectangle in the XZ plane. */
interface Slab {
  readonly x0: number;
  readonly x1: number;
  readonly z0: number;
  readonly z1: number;
  readonly id: number;
}

// Three cells are split into two slabs ('x' = divided by an X-running grout line,
// 'z' = divided by a Z-running one) so the grid has the reference's mixed rhythm.
const SPLITS: ReadonlyArray<readonly [number, number, 'x' | 'z']> = [
  [1, 0, 'x'],
  [2, 1, 'z'],
  [0, 2, 'x'],
];

/** The 12 flagstones of this tile, each with a stable id for per-slab tint. */
const SLABS: ReadonlyArray<Slab> = (() => {
  const out: Slab[] = [];
  let id = 0;
  for (let iz = 0; iz < 3; iz++)
    for (let ix = 0; ix < 3; ix++) {
      const cx = (ix - 1) * CELL;
      const cz = (iz - 1) * CELL;
      const split = SPLITS.find(([sx, sz]) => sx === ix && sz === iz);
      if (!split) {
        out.push({ x0: cx - HALF, x1: cx + HALF, z0: cz - HALF, z1: cz + HALF, id: id++ });
      } else if (split[2] === 'x') {
        out.push({ x0: cx - HALF, x1: cx + HALF, z0: cz - CELL / 2 + GROUT / 2, z1: cz - GROUT / 2, id: id++ });
        out.push({ x0: cx - HALF, x1: cx + HALF, z0: cz + GROUT / 2, z1: cz + CELL / 2 - GROUT / 2, id: id++ });
      } else {
        out.push({ x0: cx - CELL / 2 + GROUT / 2, x1: cx - GROUT / 2, z0: cz - HALF, z1: cz + HALF, id: id++ });
        out.push({ x0: cx + GROUT / 2, x1: cx + CELL / 2 - GROUT / 2, z0: cz - HALF, z1: cz + HALF, id: id++ });
      }
    }
  return out;
})();

const slabCenter = (s: Slab): [number, number] => [(s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2];

/** Which flagstone contains (x, z), or -1 on the grout. */
function slabIdAt(x: number, z: number): number {
  for (const s of SLABS) if (x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1) return s.id;
  return -1;
}

/** Per-slab value tone: 0 dark, 1 light. The center slab is worn palest by traffic. */
const slabTone = (id: number): number => (id === 5 ? 0.9 : 0.15 + 0.7 * noise.random(id * 7.13, 3.7));

/** Color of a point on the flagstone body. */
function slabPaint(x: number, y: number, z: number) {
  const id = slabIdAt(x, z);
  const t = clamp01((y - BASE_H) / RELIEF); // 0 at the grout floor, 1 on the worn top
  const tone = id < 0 ? 0.5 : slabTone(id);
  const shift = (tone - 0.5) * 0.75;

  let c = mixRgb(MID, PALE, t);
  c = shift > 0 ? mixRgb(c, PALE_LIT, shift) : mixRgb(c, DEEP, -shift);

  // Worn pale patches: big soft shapes on the tops only.
  const wear = clamp01(noise.fbm(x * 2.6, 0, z * 2.6, 3) * 0.8 + 0.3);
  c = mixRgb(c, PALE_LIT, wear * t * 0.5);

  // Dark foot where the slab meets the grout, so the bevel grounds itself.
  const foot = clamp01((BASE_H + 0.006 - y) / 0.008);
  c = mixRgb(c, DEEP, foot * 0.55);

  // Fine speckle so tops read as stone, not flat paint.
  const speck = noise.fbm(x * 26, y * 26, z * 26, 2);
  c = mixRgb(c, speck > 0 ? PALE_LIT : DEEP, Math.abs(speck) * 0.14);
  return c;
}

// Wet sheen patches: thin lenses on slab interiors, list as [x, z, rx, rz].
const WET_PATCHES: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.1, -0.12, 0.17, 0.13], // center slab, the big one
  [-0.76, 0.08, 0.14, 0.11], // mid-left slab
  [0.72, -0.55, 0.12, 0.1], // back-right slab
];

export default defineAsset({
  name: 'floor',
  description:
    'Dungeon floor tile: a 2 m square of cool worn flagstones in a grout grid, flush tops at y = 0.08, with wet glossy patches.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- grout base
    // The module itself: a 2 x 0.072 x 2 box with square outer edges so adjacent
    // tiles butt together with no gap and no lip. Its top is the grout floor that
    // shows between the flagstones, 8 mm below the walking surface.
    const base = sdf.box([2, BASE_H, 2]).at(0, BASE_H / 2, 0);
    // Moss seasoning: two soft blobs pooled in the grout, kept small and few.
    const MOSS_BLOBS: ReadonlyArray<readonly [number, number, number, number]> = [
      [-0.33, 0.38, 0.09, 0.06], // x, z, rx, rz
      [0.52, -0.44, 0.07, 0.09],
    ];
    const mossWeight = (x: number, y: number, z: number): number => {
      if (y > BASE_H + 0.004) return 0; // only the grout floor and slab feet
      let w = 0;
      for (const [mx, mz, rx, rz] of MOSS_BLOBS) {
        const d = Math.hypot((x - mx) / rx, (z - mz) / rz);
        if (d < 1) w = Math.max(w, clamp01((1 - d) * 1.2));
      }
      const fade = clamp01(noise.fbm(x * 14, y * 14, z * 14, 2) * 1.4 + 0.55);
      return w * fade;
    };
    k.body(
      'grout',
      base.paintFn((x, y, z) => {
        const onTop = y > BASE_H - 0.006;
        let c = onTop ? DEEP : mixRgb(DEEP, rgb('#1d2634'), 0.5); // darker sides for grounding
        const patch = noise.fbm(x * 5, 0, z * 5, 3);
        c = mixRgb(c, MID, clamp01(patch * 0.5) * (onTop ? 0.22 : 0.08));
        const grit = noise.fbm(x * 30, 0, z * 30, 2);
        c = mixRgb(c, grit > 0 ? MID : rgb('#151d29'), Math.abs(grit) * (onTop ? 0.3 : 0.1));
        const moss = mossWeight(x, y, z);
        if (moss > 0) c = mixRgb(c, MOSS, moss * 0.85);
        return c;
      }),
      {
        color: '#2a3547',
        roughness: 0.92,
        metalness: 0,
        detail: 0.014,
        maxTriangles: 1500,
        bump: (x, y, z) => (y > 0.055 ? 0.0012 * noise.fbm(x * 30, 0, z * 30, 2) : 0),
      },
    );

    // ------------------------------------------------------------- flagstones
    // One body for all 12 slabs: rounded boxes sunk into the base, tops flush at
    // y = 0.08. Half a grout width is inset at every grid line, including the module
    // boundary, so neighbor tiles complete the grout line with no lip.
    const slabShapes = SLABS.map((s) => {
      const [cx, cz] = slabCenter(s);
      return sdf
        .box([s.x1 - s.x0, SLAB_H, s.z1 - s.z0], BEVEL)
        .at(cx, SLAB_Y, cz);
    });
    k.body(
      'slabs',
      sdf.union(...slabShapes).paintFn(slabPaint),
      {
        color: '#4a5d75',
        roughness: 0.8,
        metalness: 0,
        detail: 0.006,
        maxTriangles: 4300,
        paintWeight: 2,
        bump: (x, y, z) => {
          // Gentle per-slab dome: worn flagstones crown slightly at the middle.
          const id = slabIdAt(x, z);
          let dome = 0;
          if (id >= 0) {
            const s = SLABS[id]!;
            const [cx, cz] = slabCenter(s);
            const u = clamp01(1 - ((x - cx) / (s.x1 - s.x0)) ** 2);
            const v = clamp01(1 - ((z - cz) / (s.z1 - s.z0)) ** 2);
            dome = 0.0022 * u * v;
          }
          return (
            dome +
            0.0018 * noise.fbm(x * 22, y * 6, z * 22, 3) +
            0.0009 * noise.noise3(x * 55, y * 20, z * 55)
          );
        },
      },
    );

    // ------------------------------------------------------------- wet sheen
    // Thin water lenses on the slab tops: roughness drops to 0.28 here while the
    // paint darkens toward the lens center and matches the slab at the rim, so the
    // patch reads as sheen, not a puddle with a visible edge. A little displacement
    // wobble breaks the perfect ellipse so the edges wander like real drip marks.
    const wet = sdf
      .union(
        ...WET_PATCHES.map(([wx, wz, rx, rz]) =>
          sdf.ellipsoid([rx, 0.026, rz]).at(wx, TOP + 0.005 - 0.026, wz),
        ),
      )
      .displace(0.006, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 2));
    k.body(
      'wet',
      wet.paintFn((x, y, z) => {
        const slab = slabPaint(x, y, z);
        let w = 0;
        for (const [wx, wz, rx, rz] of WET_PATCHES) {
          const d = Math.hypot((x - wx) / rx, (z - wz) / rz);
          if (d < 1) w = Math.max(w, clamp01((1 - d) * 1.2));
        }
        // Smoothstep the falloff so the patch edge never shows a hard polygon rim.
        w = w * w * (3 - 2 * w);
        // Wet stone darkens and cools; deepest at the lens middle.
        return mixRgb(slab, WET, w * 0.65);
      }),
      {
        color: '#5a6c82',
        roughness: 0.28,
        metalness: 0,
        detail: 0.004,
        maxTriangles: 1300,
        textureDensity: 1.5,
      },
    );
  },
});
