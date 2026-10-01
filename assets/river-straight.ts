import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * River straight tile — catalog id architecture/landscape-parts/river-straight.
 *
 * Role: modular terrain tile for the cozy chibi hamlet map, read from above and at 128 px.
 * Size: exactly 2 x 2 m, a 0.3 m slab: grass banks at y = 0, soil down to y = -0.3. The stream
 * runs straight along Z, entering at the middle of the back edge (z = -1) and leaving at the
 * middle of the front edge (z = +1), so it chains with river-bend and itself in a grid.
 * The water surface is 0.03 m below the banks and the channel bed is at y = -0.18.
 * One idea: a calm blue-green ribbon of water sliding through a chunky grass slab, edged by
 * a thin pale sand shore. At the stream edges the side shows a blue water face over a sand and
 * gravel bed band and soil; elsewhere a grass lip over warm soil strata.
 * Palette 60/30/10: grass #5fb14d dominant, sand #e8d39c secondary, teal water as the accent.
 * Materials: bank body (grass, sand, silt, soil by height), water body, pebbles, tufts.
 */

const SLAB = 0.3;
const EDGE = 0.001;
const OLD = 0.08; // old top height: paint and bump tests below use the old y = y + OLD
const TOP = 0; // grass surface height
const WATER_Y = -0.03; // water surface (3 cm below the banks)
const BED_Y = -0.18; // channel bed

// Channel cross-section: an ellipse in XY (semi-axes A x B), centre height AV, extruded along Z.
// Half-width 0.7 at y = 0, bed at y = -0.18.
const RV = 0.5; // ellipse semi-axis in Y
const AV = RV + BED_Y; // centre height 0.32
const SW = 1.822; // X semi-axis / RV

const C = {
  grass: rgb('#5fb14d'),
  grassDeep: rgb('#3d8a37'),
  fleck: rgb('#a8d76c'),
  sand: rgb('#e8d39c'),
  sandWet: rgb('#c2a372'),
  silt: rgb('#6b5c41'),
  soil: rgb('#8a6a48'),
  soilDark: rgb('#6a4f34'),
  waterDeep: rgb('#257d9e'),
  waterShallow: rgb('#7ecdbf'),
  waterGlint: rgb('#aee6d4'),
  pebble: rgb('#aca79b'),
  pebbleDark: rgb('#6f6a60'),
  blade: rgb('#4f9e3e'),
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const tileNoise = (x: number, z: number, frequency: number, octaves: number) => {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, 0, sz * frequency, octaves);
  return lerp(lerp(sample(x, z), sample(x - 2, z), u), lerp(sample(x, z - 2), sample(x - 2, z - 2), u), v);
};
/** Smoothstep, tolerant of a > b. */
const sstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Grass coverage [0,1] of the top: 1 on the flat banks and the gentle shoulder, 0 at the waterline. */
const grassMask = (y: number) => sstep(0.064, 0.07, y);

// Pale flecks on the grass strips, same recipe as the grass-ground tile. (x, z, radius).
const FLECKS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.84, -0.55, 0.09],
  [ 0.8 , -0.2 , 0.1 ],
  [-0.78,  0.3 , 0.08],
  [ 0.86,  0.6 , 0.09],
  [-0.88,  0.85, 0.07],
  [ 0.76,  0.15, 0.07],
  [-0.8 , -0.9 , 0.08],
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

/**
 * Smooth swept tube along the stream: one capsule from beyond the back edge to beyond the
 * front edge, widened in X into the elliptical bowl. The slab cut leaves a gentle grassy
 * slope down to the water and a thin floor under the channel.
 */
const riverTube = (axisY: number, r: number) =>
  sdf
    .capsule([0, axisY, -1.25], [0, axisY, 1.25], r)
    .scale([SW, 1, 1]);

/** Grass nap bump only on the flat top, so the tile edges stay clean and the slope stays smooth. */
const grassBump = (x: number, y: number, z: number) => {
  const mask = sstep(0.074, 0.0795, y + OLD);
  return mask * (0.0028 * noise.fbm(x * 34, y * 34, z * 34, 3) + 0.0016 * noise.fbm(x * 9, 5, z * 9, 2));
};

/**
 * Bank paint: dark wet silt at the waterline, a thin damp band, then dry sand up the slope,
 * grass on the flat top, and a soil cross-section on the tile sides and bottom.
 */
const bankPaintTop = (x: number, y0: number, z: number) => {
  const y = y0 + OLD;
  const inChannel = 1 - sstep(0.66, 0.73, Math.abs(x));
  const bank = mixRgb(C.silt, C.sandWet, sstep(0.046, 0.055, y));
  const bankDry = mixRgb(bank, C.sand, sstep(0.056, 0.063, y));
  const soil = mixRgb(C.soil, C.soilDark, sstep(0.05, 0.0, y) * 0.5);
  const col = mixRgb(soil, bankDry, inChannel);
  // Grass with the same two-scale patch variation as the grass-ground tile.
  const big = tileNoise(x, z, 2.4, 3);
  const small = tileNoise(x, z, 7, 2);
  const v = clamp01(big * 0.45 + small * 0.25 + 0.5);
  let grassCol = mixRgb(C.grass, C.grassDeep, v * 0.45);
  const w = fleckWeight(x, z);
  if (w > 0) grassCol = mixRgb(grassCol, C.fleck, w);
  return mixRgb(col, grassCol, grassMask(y));
};

const sideSoil = rgb('#7a4a2a');
const soilStrata = rgb('#57331d');
const bedBand = rgb('#a89a78');

/** Channel bed height at x (bottom of the cut ellipse). */
const bedAt = (x: number) => AV - RV * Math.sqrt(Math.max(0, 1 - (x / (RV * SW)) ** 2));

/** Side and bottom colour: bed band at the stream ends, else a grass lip over soil strata. */
function sideColorAt(x: number, y: number, z: number) {
  const zFace = Math.abs(z) > Math.abs(x);
  const along = zFace ? x : z;
  const soilAt = (yy: number) => {
    const depth = -yy / SLAB;
    let c = mixRgb(sideSoil, soilStrata, 0.15 + depth * 0.55);
    const strata = Math.sin((yy + 0.02 * Math.sin(along * Math.PI * 2)) * 70);
    c = mixRgb(c, soilStrata, Math.max(0, strata - 0.6) * 0.8);
    const n = noise.fbm(along * 9, yy * 9, 3.1, 2);
    if (n > 0.45) c = mixRgb(c, C.pebble, Math.min(1, (n - 0.45) * 6) * 0.8);
    return c;
  };
  if (zFace && Math.abs(x) < 0.72) {
    const yb = bedAt(x);
    if (y > yb - 0.055) {
      const n = noise.fbm(x * 30, y * 30, 1.7, 2);
      return mixRgb(mixRgb(bedBand, C.sandWet, 0.3), C.pebbleDark, clamp01(n * 0.8 - 0.1) * 0.6);
    }
    return soilAt(y);
  }
  const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
  if (y > -drip) return mixRgb(bankPaintTop(x, 0, z), C.grassDeep, 0.15 * Math.min(1, -y / drip));
  return soilAt(y);
}

const bankPaint = (x: number, y: number, z: number) => {
  const edge = Math.abs(x) > 0.995 || Math.abs(z) > 0.995;
  if ((edge && y < -0.01) || y < -0.25) return sideColorAt(x, y, z);
  return bankPaintTop(x, y, z);
};

/** Calm water: deeper teal toward the channel center, faint glint streaks. */
const waterPaint = (x: number, y: number, z: number) => {
  const t = clamp01((0.45 - Math.abs(x)) / 0.2);
  let col = mixRgb(C.waterShallow, C.waterDeep, sstep(0.05, 0.75, t));
  col = mixRgb(col, C.waterGlint, 0.07 * sstep(0.45, 0.8, tileNoise(x, z, 6, 2)));
  return col;
};

export default defineAsset({
  name: 'river-straight',
  description:
    'Modular 2 m straight river tile, a 0.3 m slab with banks at y = 0: calm teal stream along Z, 0.18 m deep, between grassy banks with a thin sandy shore; water, gravel bed and soil show on the sides.',
  detail: 0.015,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ ground slab
    // A square 0.3 m slab; the elliptical tube carves the channel through both stream edges.
    const slab = sdf.box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE]).at(0, -SLAB / 2, 0);
    const bank = slab.smoothSubtract(0.012, riverTube(AV, RV)).paintFn(bankPaint);
    k.body('bank', bank, { color: C.grass, roughness: 0.9, detail: 0.015, textureDensity: 2, bump: grassBump });

    // ------------------------------------------------------------------ water
    // The channel below the water line, filled to the tile edges so neighbouring tiles join.
    const water = riverTube(AV, RV)
      .round(0.004)
      .intersect(sdf.box([3, 0.4, 2 + 2 * EDGE]).at(0, WATER_Y - 0.2, 0));
    k.body('water', water.paintFn((x, y, z) => {
      const c = waterPaint(x, y, z);
      return mixRgb(c, C.waterDeep, clamp01((WATER_Y - y) / 0.15) * 0.7);
    }), { color: C.waterShallow, roughness: 0.55, detail: 0.012 });

    // ------------------------------------------------------------------ waterline pebbles
    // Round river-worn stones on the sandy shore, placed by probing the bank surface.
    const pebble = (x: number, z: number, r: number, sq: number) => {
      const p = sdf.surfacePoint(bank, [x, 0.2, z], -0.003);
      return sdf
        .ellipsoid([r, r * sq, r * 1.12])
        .at(p[0], p[1] + 0.12 * r * sq, p[2])
        .paintFn((_x, _y, _z, base) => mixRgb(base, C.pebbleDark, 0.2 + 0.35 * clamp01(noise.noise3(_x * 70, _y * 70, _z * 70))));
    };
    k.body(
      'pebbles',
      sdf.union(pebble(-0.58, 0.34, 0.038, 0.58), pebble(0.56, -0.52, 0.031, 0.54), pebble(0.6, 0.72, 0.034, 0.56), pebble(-0.55, -0.78, 0.028, 0.56)),
      { color: C.pebble, roughness: 0.85, detail: 0.006 },
    );

    // ------------------------------------------------------------------ grass tufts
    // A few tufts lean in from the banks, blades kept between the tile's two greens.
    const tuft = (x: number, z: number, s: number) =>
      sdf.union(
        sdf.cone([x, TOP - 0.004, z], [x - 0.02 * s, TOP + 0.068 * s, z + 0.012 * s], 0.016 * s, 0.002),
        sdf.cone([x + 0.012 * s, TOP - 0.004, z - 0.008 * s], [x + 0.03 * s, TOP + 0.052 * s, z - 0.016 * s], 0.013 * s, 0.002),
        sdf.cone([x - 0.006 * s, TOP - 0.004, z - 0.014 * s], [x - 0.024 * s, TOP + 0.046 * s, z - 0.028 * s], 0.012 * s, 0.002),
      );
    k.body('tufts', sdf.union(tuft(-0.88, 0.52, 0.72), tuft(0.9, -0.58, 0.65), tuft(-0.86, -0.85, 0.6)), {
      color: C.blade,
      roughness: 0.85,
      detail: 0.005,
    });
  },
});
