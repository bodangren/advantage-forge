import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * blacksmith-shop floor — `stone-floor`, the cobblestone workshop tile (components.tsv
 * wave 1, ~30 instances). Modular 2 x 2 m, 0.06 m thick, top of the mortar bed at
 * y = 0.06, centred on the origin so tiles repeat on the 2 m grid beside the walls.
 *
 * The one idea: chunky pillow flagstones set in dark mortar — every stone a softly
 * bevelled block rising 12–20 mm out of the bed, values drifting stone to stone like
 * the mockup's worn workshop floor.
 *
 * Shape language: round and sturdy — big radii on every stone, square tile edges so
 * tiles butt cleanly. Palette (blacksmith contract): stone #8a8a82, mortar #5e5e58,
 * shadow #6e6e66, light #a8a8a0, with per-stone drift toward #a09f96 / #75756e.
 * Materials: one matte stone body (roughness 0.88); all grit and crowning live in
 * `bump`, all color in `paintFn`. No rig, no animation.
 *
 * Seamless-tiling rules (same grammar as wood-floor / dungeon floor):
 * - Coursing is row-based with hand-set widths, so the pattern is stable.
 * - Every stone stops half a mortar joint short of the tile edge, so neighbouring
 *   tiles complete the joint at exactly interior width. No stone crosses ±1.
 * - Focal details (quench stain) sit well inside the tile, away from every edge.
 */

const TILE = 2;
const BED_H = 0.06; // mortar bed thickness; its top is the low floor at y = 0.06
const BED_BOTTOM = 0.022; // stones sink to here, hiding their undersides in the bed
const RAISE_MIN = 0.012; // stone tops sit 12–20 mm above the mortar
const RAISE_SPAN = 0.008;
const JOINT_MIN = 0.034; // mortar joint width between stones (per-side pads sum to this)
const JOINT_SPAN = 0.016;
const BOUND_JIT = 0.015; // interior coursing lines wander this much (joint width is kept)
const FILLET = 0.005; // packed-mortar crease where a stone meets the bed (stone-wall recipe)

// Palette (blacksmith-shop contract)
const STONE = rgb('#8a8a82'); // dominant warm grey
const LIGHT = rgb('#a09f96'); // pale stones
const DARK = rgb('#75756e'); // dark stones
const WEAR = rgb('#a8a8a0'); // worn-smooth highlights
const SHADOW = rgb('#6e6e66'); // shaded stone, dusty mortar
const BED = rgb('#5e5e58'); // mortar
const BED_DEEP = rgb('#4c4c46'); // deep in the joints, tile underside grounding

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/** A flagstone: footprint rect, pillow-box SDF params, and its stable paint identity. */
interface Stone {
  readonly id: number;
  readonly x0: number;
  readonly x1: number;
  readonly z0: number;
  readonly z1: number;
  readonly cx: number;
  readonly cy: number;
  readonly cz: number;
  readonly w: number;
  readonly h: number;
  readonly d: number;
  readonly r: number;
  readonly tone: number; // 0 = darkest, 1 = lightest
  readonly worn: number; // 0 = fresh, up to 1 = traffic-worn pale top
}

// Row heights along z (sum 2 − 2 × ~0.028 border pad = 1.944) and the stone widths
// of each row along x (each row sums to the same 1.944). Hand-set so the count stays
// at 28 stones of 0.25–0.5 m and no two neighbouring rows share a joint line.
const ROW_H = [0.31, 0.34, 0.32, 0.35, 0.31, 0.314] as const;
const ROW_W: ReadonlyArray<readonly number[]> = [
  [0.36, 0.42, 0.38, 0.44, 0.344],
  [0.5, 0.46, 0.48, 0.504],
  [0.4, 0.36, 0.46, 0.38, 0.344],
  [0.38, 0.44, 0.36, 0.42, 0.344],
  [0.48, 0.5, 0.47, 0.494],
  [0.38, 0.36, 0.42, 0.4, 0.384],
];

/** The 28 stones, laid out once at module load so paint and bump reuse the same table. */
const STONES: ReadonlyArray<Stone> = (() => {
  const out: Stone[] = [];
  let id = 0;
  let bz = -TILE / 2;
  for (let iz = 0; iz < ROW_H.length; iz++) {
    const bz1 = bz + ROW_H[iz]!;
    // The row's coursing lines: ends pinned to the tile edge, interior lines wander a
    // little. Both neighbour stones share the moved line, so joint widths never change.
    const lines: number[] = [-TILE / 2];
    let bx = -TILE / 2;
    for (let ix = 0; ix < ROW_W[iz]!.length - 1; ix++) {
      bx += ROW_W[iz]![ix]!;
      lines.push(bx + (noise.random(iz * 31 + ix, 67) - 0.5) * 2 * BOUND_JIT);
    }
    lines.push(TILE / 2);
    for (let ix = 0; ix < ROW_W[iz]!.length; ix++) {
      const bx0 = lines[ix]!;
      const bx1 = lines[ix + 1]!;
      // Per-side pads: joints sum to 0.04–0.06 m; border stones stop half a joint
      // short of the tile edge so neighbour tiles complete the joint.
      const padL = JOINT_MIN / 2 + noise.random(id, 11) * JOINT_SPAN;
      const padR = JOINT_MIN / 2 + noise.random(id, 23) * JOINT_SPAN;
      const padT = JOINT_MIN / 2 + noise.random(id, 37) * JOINT_SPAN;
      const padB = JOINT_MIN / 2 + noise.random(id, 41) * JOINT_SPAN;
      const x0 = bx0 + padL;
      const x1 = bx1 - padR;
      const z0 = bz + padT;
      const z1 = bz1 - padB;
      const w = x1 - x0;
      const d = z1 - z0;
      const top = BED_H + RAISE_MIN + noise.random(id * 7.9 + 3, 1.3) * RAISE_SPAN;
      const h = top - BED_BOTTOM;
      // Chunky pillow: the bevel takes almost half the stone's height, so the visible
      // edge from the mortar up is one soft round-over.
      const r = Math.min(0.026, Math.min(w, d, h) * 0.48);
      out.push({
        id,
        x0,
        x1,
        z0,
        z1,
        cx: (x0 + x1) / 2,
        cy: (BED_BOTTOM + top) / 2,
        cz: (z0 + z1) / 2,
        w,
        h,
        d,
        r,
        tone: noise.random(id * 3.1 + 1, 7.7),
        worn: noise.random(id * 5.3 + 2, 3.3) > 0.62 ? 0.5 + noise.random(id, 53) * 0.5 : 0,
      });
      id++;
    }
    bz = bz1;
  }
  return out;
})();

/** Signed distance to one stone's pillow box (mirrors sdf.box(size, radius) exactly). */
function stoneSd(s: Stone, x: number, y: number, z: number): number {
  const qx = Math.abs(x - s.cx) - (s.w / 2 - s.r);
  const qy = Math.abs(y - s.cy) - (s.h / 2 - s.r);
  const qz = Math.abs(z - s.cz) - (s.d / 2 - s.r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const oz = Math.max(qz, 0);
  return (
    Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - s.r
  );
}

/**
 * The stone whose footprint contains (x, z), or null. Footprints never overlap, so
 * this is unique. Paint and bump run on the surface itself, where an SDF test is
 * ambiguous (every surface point sits at sd ≈ 0 of its own body) — the footprint and
 * the bed plane are the unambiguous test: above the bed and inside a footprint is
 * stone; everything else is mortar.
 */
function stoneAt(x: number, z: number): Stone | null {
  for (const s of STONES) {
    if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
    return s;
  }
  return null;
}

/** Distance from a bed point to the nearest stone surface (for dust and depth). */
function gapToStone(x: number, y: number, z: number): number {
  let gap = 0.08;
  for (const s of STONES) {
    if (x < s.x0 - 0.06 || x > s.x1 + 0.06 || z < s.z0 - 0.06 || z > s.z1 + 0.06) continue;
    gap = Math.min(gap, stoneSd(s, x, y, z));
  }
  return gap;
}

/** True for surface points that belong to a stone (clear of the mortar meniscus). */
function onStone(s: Stone | null, y: number): s is Stone {
  return s !== null && y > BED_H + 0.0008;
}

/** One quench-water stain near the forge corner — paint only, kept off the edges. */
const STAIN: ReadonlyArray<readonly [number, number, number]> = [
  [0.55, -0.5, 0.24], // x, z, radius
];

function stainWeight(x: number, z: number): number {
  let w = 0;
  for (const [sx, sz, sr] of STAIN) {
    const d = Math.hypot((x - sx) / sr, (z - sz) / (sr * 0.75));
    if (d < 1) w = Math.max(w, clamp01((1 - d) * 1.3));
  }
  return w * w * (3 - 2 * w); // smoothstep so the rim never shows
}

/** Stone paint: per-stone value drift, mottling, grit, traffic wear, dark foot. */
function stonePaint(s: Stone, x: number, y: number, z: number): Rgb {
  let c = mixRgb(STONE, s.tone < 0.5 ? DARK : LIGHT, Math.abs(s.tone - 0.5) * 2);
  // Slight dark bias so the strong key light doesn't blow the tops out (stone-wall
  // does the same); the mockup floor sits below the wall's value.
  c = mixRgb(c, DARK, 0.08);
  // Broad mottling per stone (phase-shifted by id so no two stones match). Kept
  // low-frequency on purpose: fine grit lives in `bump`/the normal map, and smooth
  // paint lets the triangle reducer do its job.
  const mot = noise.fbm(x * 4.2 + s.id * 0.83, y * 2, z * 4.2, 3);
  c = mixRgb(c, mot > 0 ? WEAR : SHADOW, Math.abs(mot) * 0.16);
  // Traffic-worn pale crown on some stones, tops only.
  if (s.worn > 0 && y > BED_H + 0.002) {
    const wear = clamp01(noise.fbm(x * 3.1 + 9, 0, z * 3.1 - 4, 3) * 0.9 + 0.45) * s.worn;
    c = mixRgb(c, WEAR, wear * 0.32);
  }
  // Dark packed-mortar ring where the stone dips into the bed, fading up the bevel.
  const foot = clamp01(1 - (y - BED_H) / 0.007);
  c = mixRgb(c, SHADOW, foot * 0.3);
  return c;
}

/** Mortar paint: dusty shoulders, deep joint centers, grit, ground grime. */
function bedPaint(gap: number, x: number, y: number, z: number): Rgb {
  let c = mixRgb(BED, BED_DEEP, 0.2); // the joint family sits dark, like stone-wall's
  // Dust collects against the stone shoulders.
  const dust = clamp01(1 - gap / 0.012);
  c = mixRgb(c, SHADOW, dust * 0.3);
  // Wide joints read deeper.
  const deep = clamp01((gap - 0.008) / 0.018);
  c = mixRgb(c, BED_DEEP, deep * 0.35);
  // Soft mottling kept low-frequency; the sand-speck read comes from the bump grit.
  const mot = noise.fbm(x * 5.5, 3.3, z * 5.5, 3);
  c = mixRgb(c, mot > 0 ? SHADOW : BED_DEEP, Math.abs(mot) * 0.22);
  // Darker toward the ground so the tile sides sit down on the next tile.
  const ground = clamp01((0.014 - y) / 0.014);
  c = mixRgb(c, BED_DEEP, ground * 0.5);
  return c;
}

/** Full paint pass: stone above the bed plane inside a footprint, mortar elsewhere. */
function floorPaint(x: number, y: number, z: number): Rgb {
  const s = stoneAt(x, z);
  if (onStone(s, y)) {
    const c = stonePaint(s, x, y, z);
    const stain = stainWeight(x, z);
    return stain > 0 ? mixRgb(c, BED_DEEP, stain * 0.3) : c;
  }
  let c = bedPaint(gapToStone(x, y, z), x, y, z);
  const stain = stainWeight(x, z);
  if (stain > 0) c = mixRgb(c, BED_DEEP, stain * 0.3);
  return c;
}

/** Bump: stone crowns and grit above the bed, a dished bed with coarse grit in it. */
function floorBump(x: number, y: number, z: number): number {
  const s = stoneAt(x, z);
  if (onStone(s, y)) {
    const u = clamp01(1 - ((x - s.cx) / (s.w / 2)) ** 2);
    const v = clamp01(1 - ((z - s.cz) / (s.d / 2)) ** 2);
    return (
      0.0045 * u * v * (1 - s.worn * 0.4) + // crown, worn flatter by boots
      0.0013 * noise.fbm(x * 26, y * 9, z * 26, 3)
    );
  }
  // Packed mortar rises slightly against the stone, then dishes toward the joint
  // centre; coarse grit over everything.
  const gap = gapToStone(x, y, z);
  const packed = 0.0012 * clamp01(1 - gap / 0.016);
  return packed - 0.003 * clamp01(gap / 0.03) + 0.0018 * noise.fbm(x * 30, y * 10, z * 30, 3);
}

export default defineAsset({
  name: 'stone-floor',
  description:
    'Modular 2 m cobblestone workshop floor tile, 0.06 m thick: chunky bevelled flagstones in a dark mortar bed.',
  detail: 0.009,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // Mortar bed: a clean-edged 2 x 0.06 x 2 slab whose top is the low floor. Square
    // outer edges so adjacent tiles butt with no lip (same as the hamlet ground tiles).
    // Stones seat into the bed through a hairline packed-mortar fillet (same recipe as
    // stone-wall): softens the crease, keeps reduction clean, costs almost nothing.
    const bed = sdf.box([TILE, BED_H, TILE]).at(0, BED_H / 2, 0);
    const stones = STONES.map((s) => sdf.box([s.w, s.h, s.d], s.r).at(s.cx, s.cy, s.cz));
    k.body(
      'floor',
      sdf.smoothUnion(FILLET, bed, ...stones).paintFn(floorPaint),
      {
        color: '#8a8a82',
        roughness: 0.88,
        metalness: 0,
        detail: 0.009,
        maxError: 0.0028, // a chunky tile: ~3 mm of reduction error is invisible
        maxTriangles: 5500,
        paintWeight: 2, // paint is low-frequency, so weighted reduction stays clean
        textureDensity: 2, // the top face carries the whole read; give it texels
        bump: floorBump,
      },
    );
  },
});
