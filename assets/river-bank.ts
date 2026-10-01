import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

// river-bank — modular river bank edge tile (architecture/landscape-parts).
//
// Role: transition tile between a grass tile and a river tile on the Chibi Quest hamlet
// map. Exactly 2 x 2 m, a 0.3 m slab: walkable top at y = 0, soil down to y = -0.3, facing
// +Z. Sides: a grass lip over warm soil strata; at the channel mouth a blue water face down
// to a sand bed at y = -0.18, over sand and soil. The channel opens through the front (+Z) edge with the exact cross-section of
// river-straight (1.4 m at grass level, water 0.9 m wide) and closes into grass inside
// the tile, so the stream visibly ends here. The other three edges are grass.
//
// One idea: one calm pool where the stream ends — a thin warm sand shore, a handful of
// round pebbles straddling the waterline, grass everywhere else.
//
// Palette (60/30/10), matched to the neighbour tiles: grass #5fb14d dominant (the same
// fresh mid green as the grass-ground tile, dark patches #3d8a37, pale flecks #a8d76c),
// water #257d9e -> #7ecdbf secondary (as river-straight), sand #e8d39c accent (wet
// #c2a372), silt #6b5c41, soil cross-section #8a6a48.
//
// Materials: ground body (grass + sand + silt painted, roughness 0.9), water body
// (roughness 0.55, opacity 0.9), pebbles (roughness 0.85). No rig, no animation.

const TILE = 2.0;
const SLAB = 0.3; // ground tile depth: top at y = 0, bottom at y = -0.3
const EDGE = 0.001; // 1 mm overlap so neighbours never show a gap
const WATER_Y = -0.03; // water surface, 3 cm below the grass (same as river-straight)
const BED = -0.18; // channel bed

// Channel cross-section: the same capsule tube constants as river-straight, widened in X
// into a soft elliptical bowl. Bed at y = 0.03; half-width 0.7 at grass level (channel
// ~1.4 m wide) and 0.45 at the waterline. The water tube is slightly fatter, so its rim
// is buried in the bank and only the flat surface shows.
const AV = 0.70; // valley tube axis height
const RV = 0.75; // valley tube radius
const AW = 0.717; // water tube axis height
const RW = 0.77; // water tube radius
const SW = 2.6; // cross-section widening factor in X
const END = 0.6;
// Deep part of the channel: a narrower rounded trough that takes the bed down to y = -0.18
// without widening the channel at the grass line.
const AD = 0.12; // trough axis height (bed = AD - RD = -0.18)
const RD = 0.3;
const SD = 1.75; // trough widening factor in X // z where the channel closes inside the tile

const C = {
  grass: rgb('#5fb14d'), // fresh mid green, matches the grass-ground tile
  grassDeep: rgb('#3d8a37'), // shadow patches, matches grass-ground
  fleck: rgb('#a8d76c'), // pale sunlit flecks, matches grass-ground
  sand: rgb('#e8d39c'), // dry shore
  sandWet: rgb('#c2a372'), // damp band at the waterline
  silt: rgb('#6b5c41'), // dark bed under the water
  soil: rgb('#7a4a2a'), // side soil
  soilDark: rgb('#57331d'), // soil strata and the lower side
  sideSand: rgb('#d8c08a'),
  pebbleSoil: rgb('#9a8a78'),
  waterDeep: rgb('#257d9e'), // calm teal, matches river-straight and river-bend
  waterShallow: rgb('#7ecdbf'),
  pebble: rgb('#aca79b'),
  pebbleDark: rgb('#6f6a60'),
};

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
/** Smoothstep, tolerant of a > b. */
const sstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - t * 2);
};

/** Grass coverage [0,1] of the top: 1 on the flat banks, 0 at the waterline. */
const grassMask = (y: number): number => sstep(-0.016, -0.01, y);

/** Elliptical tube radius of the channel cross-section at (x, y). */
const tubeRadius = (x: number, y: number): number =>
  Math.sqrt((x * x) / (SW * SW) + (y - AV) * (y - AV));

/** Signed distance (about, in meters) from the channel cavity: negative inside. */
const cavity = (x: number, y: number): number =>
  Math.min(
    tubeRadius(x, y) - RV,
    Math.sqrt((x * x) / (SD * SD) + (y - AD) * (y - AD)) - RD,
  );

/** The channel tube along Z, widened in X — identical to river-straight's. */
const riverTube = (axisY: number, r: number, sx: number = SW): sdf.Shape =>
  sdf.capsule([0, axisY, -1.25], [0, axisY, 1.25], r).scale([sx, 1, 1]);

// Pale flecks on the grass, same recipe as the grass-ground tile. (x, z, radius).
const FLECKS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.72, -0.55, 0.1],
  [0.62, 0.1, 0.09],
  [-0.3, -0.15, 0.08],
  [0.8, -0.55, 0.09],
  [-0.85, 0.35, 0.08],
  [0.18, -0.75, 0.09],
  [-0.1, 0.3, 0.08],
  [0.42, 0.05, 0.08],
  [-0.55, -0.85, 0.07],
];

/** 1 inside a fleck, fading to 0 at its soft edge. */
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

/** Top and channel paint: silt at the waterline, damp band, dry sand, grass on the flat top. */
const topPaint = (x: number, y: number, z: number): Rgb => {
  const c = cavity(x, y);
  const inChannel = (1 - sstep(-0.015, 0.02, c)) * sstep(END - 0.02, END + 0.05, z);
  const bank = mixRgb(C.silt, C.sandWet, sstep(-0.034, -0.025, y));
  const bankDry = mixRgb(bank, C.sand, sstep(-0.024, -0.017, y));
  // Grass with the same two-scale patch variation as the grass-ground tile.
  const big = noise.fbm(x * 2.4, 0, z * 2.4, 3);
  const small = noise.fbm(x * 7, 0, z * 7, 2);
  const v = clamp01(big * 0.45 + small * 0.25 + 0.5);
  let grassCol = mixRgb(C.grass, C.grassDeep, v * 0.45);
  const w = fleckWeight(x, z);
  if (w > 0 && z < 0.52) grassCol = mixRgb(grassCol, C.fleck, w);
  return mixRgb(mixRgb(grassCol, bankDry, inChannel), grassCol, grassMask(y) * (1 - inChannel * 0));
};

/** Side color: lip = top paint at the same (x, z), over soil strata; sand under the channel. */
const sideColorAt = (x: number, y: number, z: number): Rgb => {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
  if (y > -drip) return mixRgb(topPaint(x, 0, z), C.soilDark, 0.25 * Math.min(1, -y / drip));
  const depth = -y / SLAB;
  let c = mixRgb(C.soil, C.soilDark, 0.15 + depth * 0.55);
  const strata = Math.sin((y + 0.02 * Math.sin(along * Math.PI * 2)) * 70);
  c = mixRgb(c, C.soilDark, Math.max(0, strata - 0.6) * 0.8);
  const n = noise.fbm(along * 9, y * 9, 3.1, 2);
  if (n > 0.45) c = mixRgb(c, C.pebbleSoil, Math.min(1, (n - 0.45) * 6) * 0.8);
  // Sand band under the channel bed at the open front face.
  if (z > 0.99 && Math.abs(x) < 0.9) {
    const sandEdge = BED - 0.045 - 0.008 * Math.sin(x * Math.PI * 5);
    if (y > sandEdge && y < BED + 0.005 && Math.abs(x) < 0.5) c = mixRgb(C.sideSand, C.soil, 0.1 * (BED - y) / 0.05);
  }
  return c;
};

const bankPaint = (x: number, y: number, z: number): Rgb => {
  const face = Math.abs(x) > 0.995 || Math.abs(z) > 0.995 || y < -0.29;
  const channelSurface = z > END - 0.05 && cavity(x, y) < 0.015;
  if (y < -0.01 && face && !channelSurface) return sideColorAt(x, y, z);
  return topPaint(x, y, z);
};

/** Calm water: deeper teal toward the channel center, like river-straight. */
const waterPaint = (x: number, y: number, z: number): Rgb => {
  const t = clamp01((0.45 - Math.abs(x)) / 0.2);
  let col = mixRgb(C.waterShallow, C.waterDeep, sstep(0.05, 0.75, t));
  col = mixRgb(col, C.waterShallow, 0.07 * sstep(0.45, 0.8, noise.fbm(x * 6, y * 3, z * 6, 2)));
  return col;
};

/** Grass nap bump only on the flat top, so the tile edges stay clean and the slope stays smooth. */
const grassBump = (x: number, y: number, z: number): number =>
  sstep(-0.006, -0.0005, y) *
  (0.0028 * noise.fbm(x * 34, y * 34, z * 34, 3) + 0.0016 * noise.fbm(x * 9, 5, z * 9, 2));

export default defineAsset({
  name: 'river-bank',
  description:
    'River bank edge tile, a 0.3 m slab with its top at y = 0 and a grass lip over soil on the sides: fresh grass with a sandy shore, round pebbles and a sliver of still water where the stream ends at the front edge.',
  detail: 0.015,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ ground slab
    // A 2 x 0.3 x 2 m slab with square edges, matching the grass-ground tile. The
    // elliptical tube opens through the front edge with river-straight's cross-section
    // and closes just past z = 0.6 with a smooth rounded end.
    const slab = sdf.box([TILE + 2 * EDGE, SLAB + 2 * EDGE, TILE + 2 * EDGE]).at(0, -SLAB / 2, 0);
    const valley = riverTube(AV, RV)
      .smoothUnion(0.03, riverTube(AD, RD, SD))
      .smoothIntersect(0.08, sdf.box([4, 1.4, 0.9]).at(0, 0.3, END + 0.45));
    const bank = slab.smoothSubtract(0.012, valley).paintFn(bankPaint);
    k.body('bank', bank, {
      color: C.grass,
      roughness: 0.9,
      paintWeight: 2,
      textureDensity: 2,
      detail: 0.015,
      bump: grassBump,
    });

    // ------------------------------------------------------------------ water
    // The fatter water tube cut flat at the water level, clipped just inside the tile so
    // only the calm surface shows; it runs to the front edge to continue into the river.
    const water = riverTube(AW, RW)
      .smoothUnion(0.03, riverTube(AD + 0.005, RD + 0.005, SD + 0.05))
      .intersect(sdf.halfSpace([0, 1, 0], WATER_Y))
      .intersect(sdf.box([4, 0.6, 0.38]).at(0, 0.1, 0.81))
      .paintFn(waterPaint);
    k.body('water', water, {
      color: C.waterDeep,
      roughness: 0.55,
      opacity: 0.9,
      paintWeight: 2,
      detail: 0.02,
      textureDensity: 2,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 14, y * 14, z * 14, 2),
    });

    // ------------------------------------------------------------------ pebbles on the waterline
    // Placed with a surface probe so they sit half-buried on the shore, straddling the
    // waterline arc of the closing pool, never floating.
    const stone = (x: number, z: number, s: number): sdf.Shape => {
      const p = sdf.surfacePoint(bank, [x, -0.02, z], 0.001 * s);
      return sdf
        .ellipsoid([0.026 * s, 0.016 * s, 0.028 * s])
        .rotateY(28 * s)
        .at(p[0], p[1], p[2]);
    };
    k.body(
      'pebbles',
      sdf
        .union(
          stone(-0.42, 0.92, 1),
          stone(-0.2, 0.85, 0.7),
          stone(0.06, 0.84, 0.85),
          stone(0.3, 0.89, 0.6),
          stone(0.47, 0.95, 0.95),
          stone(-0.55, 0.96, 0.7),
        )
        .paintFn(
          (x, y, z, base) =>
            mixRgb(base, C.pebbleDark, 0.35 + 0.3 * noise.fbm(x * 90, y * 90, z * 90, 2)),
        ),
      {
        color: C.pebble,
        roughness: 0.85,
        detail: 0.006,
      },
    );
  },
});
