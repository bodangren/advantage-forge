import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import * as THREE from 'three';

/**
 * River straight tile — catalog id architecture/landscape-parts/river-straight.
 *
 * Role: modular terrain tile for the cozy chibi hamlet map, read from above and at 128 px.
 * Size: exactly 2 x 2 m, 0.08 m thick, top surface at y = 0.08, standing on y = 0. The stream
 * runs straight along Z, entering at the middle of the back edge (z = -1) and leaving at the
 * middle of the front edge (z = +1), so it chains with river-bend and itself in a grid.
 * One idea: a calm blue-green ribbon of water sliding through a chunky grass slab, edged by
 * a thin pale sand shore. Shape language: round and soft everywhere except the straight clean
 * tile edges. Palette 60/30/10: grass #5fb14d dominant (matches the grass-ground tile), sand
 * #e8d39c secondary ring, teal water as the accent and focal point. Materials: one bank body
 * (grass, sand, wet sand, silt, soil by height), one water body (roughness 0.18, opacity 0.9),
 * a few waterline pebbles and grass tufts as the small story. No rig, no animation.
 */

const TOP = 0.08; // grass surface height
const WATER_Y = 0.05; // water surface height (3 cm below the banks)

// Channel cross-section: a capsule tube along Z, widened in X into a soft elliptical bowl.
// Bed at y = 0.03 (two mesh cells above the slab underside, so the floor meshes cleanly);
// half-width 0.7 at grass level (channel ~1.4 m wide) and 0.45 at the waterline. The water
// tube is slightly fatter and sits a little higher, so its rim is buried in the bank and
// only the flat surface shows.
const AV = 0.78; // valley tube axis height
const RV = 0.75; // valley tube radius
const SW = 2.6; // cross-section widening factor in X

const C = {
  grass: rgb('#5fb14d'), // fresh mid green, matches the grass-ground tile
  grassDeep: rgb('#3d8a37'), // shadow patches, matches grass-ground
  fleck: rgb('#a8d76c'), // pale sunlit flecks, matches grass-ground
  sand: rgb('#e8d39c'), // dry shore
  sandWet: rgb('#c2a372'), // damp band at the waterline
  silt: rgb('#6b5c41'), // dark bed under the water
  soil: rgb('#8a6a48'), // cut turf cross-section on the tile sides
  soilDark: rgb('#6a4f34'),
  waterDeep: rgb('#257d9e'), // calm teal, matches river-bend
  waterShallow: rgb('#7ecdbf'),
  waterGlint: rgb('#aee6d4'),
  pebble: rgb('#aca79b'),
  pebbleDark: rgb('#6f6a60'),
  blade: rgb('#4f9e3e'), // tuft blades, between the tile's two greens
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
  const mask = sstep(0.074, 0.0795, y);
  return mask * (0.0028 * noise.fbm(x * 34, y * 34, z * 34, 3) + 0.0016 * noise.fbm(x * 9, 5, z * 9, 2));
};

/**
 * Bank paint: dark wet silt at the waterline, a thin damp band, then dry sand up the slope,
 * grass on the flat top, and a soil cross-section on the tile sides and bottom.
 */
const bankPaint = (x: number, y: number, z: number) => {
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

/** Calm water: deeper teal toward the channel center, faint glint streaks. */
const waterPaint = (x: number, y: number, z: number) => {
  const t = clamp01((0.45 - Math.abs(x)) / 0.2);
  let col = mixRgb(C.waterShallow, C.waterDeep, sstep(0.05, 0.75, t));
  col = mixRgb(col, C.waterGlint, 0.07 * sstep(0.45, 0.8, tileNoise(x, z, 6, 2)));
  return col;
};

/** Exact edge vertices keep adjacent bank and water surfaces level. */
function surfaceMesh(name: string, width: number, segmentsX: number, segmentsZ: number, height: (x: number) => number, color: (x: number, y: number, z: number) => readonly [number, number, number], roughness: number): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, 2, segmentsX, segmentsZ);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const y = height(x);
    positions.setY(i, y);
    const c = color(x, y, z);
    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }
  positions.needsUpdate = true;
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness: 0, side: THREE.DoubleSide }));
  mesh.name = name;
  mesh.receiveShadow = true;
  return mesh;
}

export default defineAsset({
  name: 'river-straight',
  description:
    'Modular 2 m straight river tile: calm teal stream running along Z between grassy banks with a thin sandy shore; 0.08 m thick, top at 0.08.',
  detail: 0.015,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ ground slab
    // The exact square edge meets adjacent cells without a shaded gap. The elliptical tube
    // carves the channel through both stream edges.
    const slab = sdf.box([2, 0.08, 2]).at(0, 0.04, 0);
    const bank = slab.smoothSubtract(0.012, riverTube(AV, RV)).paintFn(bankPaint);
    k.body('bank', bank, { color: C.grass, roughness: 0.9, detail: 0.015, textureDensity: 2, bump: grassBump });

    const bankHeight = (x: number) => Math.min(TOP, AV - Math.sqrt(Math.max(0, RV * RV - (x / SW) ** 2))) + 0.001;
    k.add('bank-top', surfaceMesh('bank-top', 2, 64, 24, bankHeight, bankPaint, 0.9));

    // ------------------------------------------------------------------ water
    // A fatter tube cut flat at the water level and clipped just inside the tile, so only
    // the calm surface shows and the rim stays buried in the bank.
    k.add('water', surfaceMesh('water', 0.96, 32, 24, () => WATER_Y + 0.002, waterPaint, 0.72));

    // ------------------------------------------------------------------ waterline pebbles
    // Round river-worn stones on the sandy shore, placed by probing the bank surface.
    const pebble = (x: number, z: number, r: number, sq: number) => {
      const p = sdf.surfacePoint(bank, [x, TOP + 0.2, z], -0.003);
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
    k.body('tufts', sdf.union(tuft(-0.88, 0.52, 1.25), tuft(0.9, -0.58, 1.05), tuft(-0.86, -0.85, 0.9)), {
      color: C.blade,
      roughness: 0.85,
      detail: 0.005,
    });
  },
});
