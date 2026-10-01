import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

/**
 * river-junction — catalog id architecture/landscape-parts/river-junction.
 *
 * Role: modular terrain tile for the cozy chibi hamlet map, read from above and at 128 px.
 * Size: exactly 2 x 2 m, a 0.3 m slab: grass top at y = 0, soil down to y = -0.3. The river
 * runs 1 m wide along Z from the -Z edge to the +Z edge and branches 1 m wide to the +X edge,
 * so it chains with straight and corner river tiles.
 * One idea: a chunky grass slab with a clean blue T of water sunk 0.03 m into it, 0.18 m deep, ringed by
 * a rounded pebble shore and a soft grassy lip.
 * Shape language: round and soft (beveled lip, round pebbles, tapered tufts); the tile edges
 * stay straight and square so neighbours repeat without seams.
 * Palette 60/30/10: grass #7ec850 dominant (#4a8a3f shadow patches, #b8e878 pale flecks),
 * water #3fa8c8 -> #26718f secondary, grey pebbles #8a94a0 with tan #c9b183 accent. Focal
 * point: the water junction itself.
 * Sides: at the stream edges a blue water face over a sand-and-gravel bed band and soil;
 * elsewhere a grass lip over warm soil strata.
 * Materials: ground (grass/soil/pebble shore by height, roughness 0.9), water (roughness 0.5,
 * opacity 0.92), pebbles (roughness 0.85), grass tufts (roughness 0.85). No rig, no animation.
 */

const TILE = 2.0; // tile footprint (m)
const SLAB = 0.3;
const EDGE = 0.001;
const OLD = 0.06; // old top height: the paint tests below use y + OLD
const TOP = 0; // grass surface height
const WATER_Y = -0.03; // water surface, 0.03 m below the grass
const BED_Y = -0.18; // channel floor
const OPEN = 1.0; // channel opening at grass level (m)
const LOWW = 0.86; // channel width lower down (m)
const ARM = 2.8; // main arm length, past both tile ends
const BRANCH_LEN = 1.9; // branch arm length, from x = -0.5 to x = 1.4
const BRANCH_CX = 0.45; // branch arm center in X

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
/** Smoothstep, tolerant of a > b. */
const sstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const C = {
  grass: rgb('#7ec850'),
  grassDeep: rgb('#4a8a3f'),
  fleck: rgb('#b8e878'),
  soil: rgb('#7a4a2a'),
  soilDark: rgb('#57331d'),
  pebble: rgb('#8a94a0'),
  pebbleDark: rgb('#5f6873'),
  sand: rgb('#c9b183'),
  mud: rgb('#54452f'),
  water: rgb('#3fa8c8'),
  waterDeep: rgb('#26718f'),
  waterLight: rgb('#5cbdd8'),
};

// Pale flecks on the grass, laid out so they read on the banks but never on the water.
const FLECKS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.78, -0.7, 0.07],
  [-0.72, 0.62, 0.06],
  [0.82, -0.78, 0.055],
  [0.86, 0.66, 0.06],
  [-0.62, 0.05, 0.05],
  [0.78, 0.18, 0.05],
  [-0.86, -0.25, 0.05],
  [0.16, -0.86, 0.055],
  [-0.12, 0.9, 0.05],
  [0.72, -0.5, 0.045],
  [-0.4, -0.9, 0.05],
  [0.9, 0.1, 0.045],
];

/** 1 inside a fleck, fading to 0 at its soft edge. */
function fleckWeight(x: number, z: number): number {
  let w = 0;
  for (const [cx, cz, r] of FLECKS) {
    const dx = (x - cx) / r;
    const dz = (z - cz) / (r * 0.85);
    const d2 = dx * dx + dz * dz;
    if (d2 < 1) w = Math.max(w, clamp01((1 - Math.sqrt(d2)) * 3.5));
  }
  return w;
}

/** Grass coverage of the surface by height: 1 on the flat top and lip, 0 near the waterline. */
const grassMask = (y: number): number => sstep(0.046, 0.058, y);

/** Channel footprint mask [0,1]: 1 inside the T of water, 0 on the outer banks and sides. */
function channelMask(x: number, z: number): number {
  const main = 1 - sstep(0.42, 0.5, Math.abs(x));
  const branch = sstep(-0.6, -0.48, x) * (1 - sstep(0.42, 0.5, Math.abs(z)));
  return Math.max(main, branch);
}

/** Grass colour: two scales of world-space patch noise plus pale flecks. */
function grassColor(x: number, z: number): Rgb {
  const big = noise.fbm(x * 2.4, 0, z * 2.4, 3);
  const small = noise.fbm(x * 7, 0, z * 7, 2);
  const v = clamp01(big * 0.45 + small * 0.25 + 0.5);
  let col = mixRgb(C.grass, C.grassDeep, v * 0.62);
  const w = fleckWeight(x, z);
  if (w > 0) col = mixRgb(col, C.fleck, w * 0.25);
  return col;
}

/** Bank paint: soil on the outer cut sides, pebble shore down the banks, grass on top. */
const topPaint = (x: number, y0: number, z: number): Rgb => {
  const y = y0 + OLD;
  const grass = grassColor(x, z);
  // Outer soil: the cut turf cross-section on the tile sides and the slab underside.
  const soil = mixRgb(C.soilDark, C.soil, 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2));
  const outer = mixRgb(soil, grass, grassMask(y));
  // Inner shore: tan sand and grey pebbles with a wash of dark mud at the waterline.
  const pebbly = mixRgb(C.sand, C.pebble, 0.45 + 0.4 * noise.fbm(x * 24, y * 24, z * 24, 3));
  const pebbly2 = mixRgb(pebbly, C.pebbleDark, 0.3 * noise.fbm(x * 40, y * 40, z * 40, 2));
  const wet = mixRgb(pebbly2, C.mud, sstep(0.03, 0.018, y));
  const inner = mixRgb(wet, grass, grassMask(y));
  return mixRgb(outer, inner, channelMask(x, z));
};

/** Side and bottom colour: bed band at the stream ends, else a grass lip over soil strata. */
const groundPaint = (x: number, y: number, z: number): Rgb => {
  const edge = Math.abs(x) > 0.995 || Math.abs(z) > 0.995;
  if (!((edge && y < -0.01) || y < -0.25)) return topPaint(x, y, z);
  const zFace = Math.abs(z) > Math.abs(x);
  const along = zFace ? x : z;
  const soilAt = (yy: number): Rgb => {
    let c = mixRgb(C.soil, C.soilDark, 0.15 + (-yy / SLAB) * 0.55);
    const st = Math.sin((yy + 0.02 * Math.sin(along * Math.PI * 2)) * 70);
    c = mixRgb(c, C.soilDark, Math.max(0, st - 0.6) * 0.8);
    const n = noise.fbm(along * 9, yy * 9, 3.1, 2);
    if (n > 0.45) c = mixRgb(c, rgb('#9a8a78'), Math.min(1, (n - 0.45) * 6) * 0.8);
    return c;
  };
  const cutFace = zFace || x > 0; // the -X face has no channel
  if (cutFace && Math.abs(along) < 0.6) {
    const yb = BED_Y * (1 - sstep(0.43, 0.52, Math.abs(along)));
    if (y > yb - 0.055) {
      const n = noise.fbm(along * 30, y * 30, 1.7, 2);
      return mixRgb(rgb('#a89a78'), C.pebbleDark, clamp01(n * 0.8 - 0.1) * 0.6);
    }
    return soilAt(y);
  }
  const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
  if (y > -drip) return mixRgb(topPaint(x, 0, z), C.grassDeep, 0.15 * Math.min(1, -y / drip));
  return soilAt(y);
};

/** Calm water: deeper blue along each channel centerline, lighter toward the banks. */
const waterPaint = (x: number, y: number, z: number): Rgb => {
  const dMain = Math.abs(x) / 0.5;
  const dBranch = Math.abs(z) / 0.5;
  const d = Math.min(dMain, dBranch);
  let col = mixRgb(C.waterLight, C.water, sstep(0.15, 0.75, d));
  col = mixRgb(col, C.waterDeep, sstep(0.55, 1.0, d) * 0.9);
  col = mixRgb(col, C.waterLight, 0.05 * sstep(0.4, 0.9, noise.fbm(x * 6, y * 3, z * 6, 2)));
  return col;
};

export default defineAsset({
  name: 'river-junction',
  description:
    'Modular 2 m river junction tile: a 1 m blue channel along Z with a 1 m branch to +X, sunk into grass banks with rounded pebble shores; a 0.3 m slab with its top at y = 0, water 0.18 m deep; water, gravel bed and soil show on the sides.',
  detail: 0.013,
  reference: 'docs/item-mockups/river-junction-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ channel cutter
    // The channel cross-section is a lower narrow trough blended into a wider top, so the
    // banks slope gently from the grass lip to the waterline. The branch runs to +X only.
    const armZ = sdf.smoothUnion(
      0.05,
      sdf.box([LOWW, 0.4, ARM], 0.03).at(0, BED_Y + 0.2, 0),
      sdf.box([OPEN, 0.06, ARM], 0.02).at(0, 0.075 - OLD, 0),
    );
    const armX = sdf.smoothUnion(
      0.05,
      sdf.box([BRANCH_LEN, 0.4, LOWW], 0.03).at(BRANCH_CX, BED_Y + 0.2, 0),
      sdf.box([BRANCH_LEN, 0.06, OPEN], 0.02).at(BRANCH_CX, 0.075 - OLD, 0),
    );
    const cutter = sdf.smoothUnion(0.06, armZ, armX);

    // ------------------------------------------------------------------ ground slab
    // Exactly 2 x 0.3 x 2 m with square edges. The T trough is carved with a small fillet.
    const slab = sdf.box([TILE + 2 * EDGE, SLAB + 2 * EDGE, TILE + 2 * EDGE]).at(0, -SLAB / 2, 0);
    const ground = slab.smoothSubtract(0.02, cutter).paintFn(groundPaint);
    k.body('ground', ground, {
      color: C.grass,
      roughness: 0.9,
      paintWeight: 2,
      textureDensity: 2,
      detail: 0.02,
      bump: (x, y, z) =>
        grassMask(y + OLD) * (0.0026 * noise.fbm(x * 34, y * 34, z * 34, 3) + 0.0014 * noise.fbm(x * 9, 5, z * 9, 2)),
    });

    // ------------------------------------------------------------------ water
    // The channel below the water line, filled to the tile edges so neighbouring tiles join.
    const water = cutter
      .round(0.004)
      .intersect(sdf.box([TILE + 2 * EDGE, 0.4, TILE + 2 * EDGE]).at(0, WATER_Y - 0.2, 0));
    k.body('water', water.paintFn((x, y, z) => mixRgb(waterPaint(x, y, z), C.waterDeep, clamp01((WATER_Y - y) / 0.15) * 0.7)), {
      color: C.water,
      roughness: 0.55,
      metalness: 0,
      paintWeight: 2,
      textureDensity: 2,
      detail: 0.018,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 8, y * 4, z * 8, 2),
    });

    // ------------------------------------------------------------------ pebbles on the banks
    // Set directly on the sloped shore at the waterline, so each stone straddles the water
    // edge and stays above the slab underside; small pale stones dot the grass corners too.
    const stone = (x: number, y: number, z: number, r: number): sdf.Shape =>
      sdf.ellipsoid([r * 1.2, r * 0.72, r]).rotateY(37 * r * 10).at(x, y, z);
    const pebbles: sdf.Shape[] = [
      // main channel, east waterline (clear of the branch mouth)
      stone(0.44, -0.028, -0.9, 0.03),
      stone(0.45, -0.030, -0.62, 0.024),
      stone(0.43, -0.028, -0.32, 0.028),
      stone(0.46, -0.030, 0.66, 0.026),
      stone(0.44, -0.028, 0.9, 0.031),
      // main channel, west waterline
      stone(-0.44, -0.029, -0.78, 0.027),
      stone(-0.45, -0.028, -0.18, 0.031),
      stone(-0.43, -0.030, 0.42, 0.025),
      stone(-0.45, -0.029, 0.82, 0.028),
      // branch, north and south waterline
      stone(0.72, -0.029, 0.44, 0.027),
      stone(0.92, -0.030, 0.43, 0.023),
      stone(0.62, -0.029, -0.44, 0.025),
      stone(0.86, -0.030, -0.45, 0.029),
      // pale stones on the grass at the junction corner
      stone(0.6, -0.010, 0.62, 0.026),
      stone(0.72, -0.012, 0.72, 0.02),
    ];
    k.body(
      'pebbles',
      sdf.union(...pebbles).paintFn((x, y, z, base) =>
        mixRgb(base, mixRgb(C.pebbleDark, C.sand, 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2)), 0.45 * (0.5 + 0.5 * noise.fbm(x * 70, y * 70, z * 70, 2))),
      ),
      { color: C.pebble, roughness: 0.85, metalness: 0, detail: 0.016 },
    );

    // ------------------------------------------------------------------ grass tufts
    // A few chunky tufts on the banks give the slab a broken, hand-made silhouette.
    const tuft = (x: number, z: number, s: number): sdf.Shape => {
      const p = sdf.surfacePoint(ground, [x, TOP + 0.2, z], -0.004);
      return sdf.union(
        sdf.cone([p[0], p[1], p[2]], [p[0] - 0.022 * s, p[1] + 0.075 * s, p[2] + 0.012 * s], 0.016 * s, 0.002),
        sdf.cone([p[0] + 0.013 * s, p[1], p[2] - 0.01 * s], [p[0] + 0.033 * s, p[1] + 0.058 * s, p[2] - 0.02 * s], 0.013 * s, 0.002),
        sdf.cone([p[0] - 0.008 * s, p[1], p[2] - 0.016 * s], [p[0] - 0.026 * s, p[1] + 0.05 * s, p[2] - 0.032 * s], 0.012 * s, 0.002),
      );
    };
    k.body(
      'tufts',
      sdf.union(tuft(-0.82, 0.34, 0.65), tuft(0.84, -0.9, 0.6), tuft(-0.8, -0.86, 0.55), tuft(0.9, 0.9, 0.6)),
      { color: C.grassDeep, roughness: 0.85, metalness: 0, detail: 0.014 },
    );
  },
});
