import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Dry riverbed tile. Role: modular canyon terrain tile, 2 x 2 m, 0.3 m slab, banks at y = 0.
 * A shallow channel 1.4 m wide, 0.12 m deep runs along Z (back edge middle to front edge middle).
 * One idea: pale sand and cracked mud plates in a sunken ribbon between orange-red banks.
 * Palette: bank #c2733f, sandy lip #e0b97c, bed sand #e6d3a6, mud #b79b72, strata reds.
 * Materials: slab body (banks, bed, sides), pebbles, smooth stones.
 */

const SLAB = 0.3;
const EDGE = 0.001;
const BED_Y = -0.12;
const HALF = 0.7;

const bankCol = rgb('#c2733f');
const bankDark = rgb('#a85d30');
const lipCol = rgb('#e0b97c');
const sandCol = rgb('#e8d6a9');
const mudCol = rgb('#b99d74');
const crackCol = rgb('#7d6445');
const soilA = rgb('#b4572f');
const soilB = rgb('#8c3f22');
const soilC = rgb('#d08a4c');
const stoneA = rgb('#a89a86');
const stoneB = rgb('#7d6e5e');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const sstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function topColor(x: number, z: number) {
  const ax = Math.abs(x);
  // Bank: orange-red earth with slow patches.
  const n = noise.fbm(x * 3, 1.3, z * 3, 3);
  let bank = mixRgb(bankCol, bankDark, clamp01(n * 0.6 + 0.2) * 0.6);
  bank = mixRgb(bank, lipCol, 0.25 * sstep(0.3, 0.8, noise.fbm(x * 9, 4, z * 9, 2) + 0.4));
  // Sandy lip at the channel edge.
  bank = mixRgb(bank, lipCol, 1 - sstep(HALF + 0.03, HALF + 0.12, ax));
  // Bed: sand with mud plates separated by cracks.
  const plate = noise.fbm(x * 7, 9.1, z * 7, 2);
  const crack = 1 - sstep(0.0, 0.06, Math.abs(plate));
  const mudZone = sstep(-0.1, 0.25, noise.fbm(x * 2.2, 6, z * 2.2, 2));
  let bed = mixRgb(sandCol, mudCol, mudZone * (0.55 + 0.3 * noise.fbm(x * 18, 2, z * 18, 2)));
  bed = mixRgb(bed, crackCol, crack * mudZone * 0.85);
  // Darker toe where the bank meets the bed.
  bed = mixRgb(bed, mudCol, 0.4 * sstep(HALF - 0.12, HALF, ax));
  return mixRgb(bed, bank, sstep(HALF - 0.02, HALF + 0.03, ax));
}

function sideColor(x: number, y: number, z: number) {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const zFace = Math.abs(z) > Math.abs(x);
  if (zFace && Math.abs(x) < HALF && y > BED_Y - 0.04) return mixRgb(sandCol, mudCol, 0.4);
  const lip = 0.025 + 0.012 * Math.sin(along * 9 + 0.7);
  if (y > -lip) return mixRgb(lipCol, bankCol, 0.35);
  const w = Math.sin((y + 0.02 * noise.fbm(along * 3, y * 3, 5.3, 2)) * 55);
  let c = w > 0.35 ? soilA : w < -0.4 ? soilC : mixRgb(soilA, soilB, 0.5);
  c = mixRgb(c, soilB, clamp01(-y / SLAB) * 0.5);
  const n = noise.fbm(along * 12, y * 12, 2.2, 2);
  if (n > 0.45) c = mixRgb(c, stoneA, clamp01((n - 0.45) * 5) * 0.5);
  return c;
}

export default defineAsset({
  name: 'dry-riverbed',
  description:
    'Modular 2 m straight dry riverbed tile, a 0.3 m slab with banks at y = 0: a 1.4 m wide, 0.12 m deep sandy channel with cracked mud, pebbles and smooth stones between orange-red earth banks.',
  detail: 0.015,
  texture: { size: 1024 },

  build(k) {
    const slab = sdf.box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE]).at(0, -SLAB / 2, 0);
    const cut = sdf.box([2 * HALF, 0.3, 2.6], 0.06).at(0, BED_Y + 0.15, 0);
    const bed = slab.smoothSubtract(0.03, cut).paintFn((x, y, z) => {
      const edge = Math.abs(x) > 0.995 || Math.abs(z) > 0.995;
      if ((edge && y < -0.005) || y < -0.25) return sideColor(x, y, z);
      return topColor(x, z);
    });
    const bump = (x: number, y: number, z: number) => {
      if (y < -0.2) return 0;
      const plate = noise.fbm(x * 7, 9.1, z * 7, 2);
      const c = Math.abs(x) < HALF ? -0.004 * (1 - sstep(0.0, 0.06, Math.abs(plate))) : 0;
      return c + 0.002 * noise.fbm(x * 25, y * 25, z * 25, 3);
    };
    k.body('bed', bed, { color: bankCol, roughness: 0.95, detail: 0.015, textureDensity: 2, bump });

    const onBed = (x: number, z: number, r: number, sq: number, tint: number) => {
      const p = sdf.surfacePoint(bed, [x, 0.2, z], -0.003);
      return sdf
        .ellipsoid([r, r * sq, r * 1.15])
        .rotateY(tint * 90)
        .at(p[0], p[1] + 0.2 * r * sq, p[2])
        .paintFn((_x, _y, _z, base) => mixRgb(base, stoneB, tint * 0.6));
    };
    const pebbles: ReturnType<typeof onBed>[] = [];
    const seeds: ReadonlyArray<readonly [number, number, number]> = [
      [-0.3, -0.7, 0.014], [0.2, -0.45, 0.012], [0.4, -0.1, 0.016], [-0.15, 0.1, 0.011],
      [-0.4, 0.35, 0.013], [0.1, 0.6, 0.015], [0.45, 0.8, 0.011], [-0.2, 0.85, 0.012],
      [0.0, -0.9, 0.01], [0.3, 0.35, 0.01],
    ];
    seeds.forEach(([x, z, r], i) => pebbles.push(onBed(x, z, r, 0.6, (i % 4) / 4)));
    k.body('pebbles', sdf.union(...pebbles), { color: stoneA, roughness: 0.85, detail: 0.005 });

    const stones = sdf.union(
      onBed(-0.38, -0.25, 0.06, 0.55, 0.2),
      onBed(0.3, 0.2, 0.05, 0.55, 0.5),
      onBed(-0.1, 0.72, 0.045, 0.6, 0.35),
    );
    k.body('stones', stones, { color: stoneA, roughness: 0.7, detail: 0.006 });
  },
});
