import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Pit trap (props/world/pit-trap), matched to docs/item-mockups/pit-trap-mock.jpg.
 * A 2 m x 2 m stone floor tile, 0.1 m thick with its top at y = 0.1, with a 1.2 m square pit.
 * The pit goes 0.6 m below the tile into the ground, with iron spikes on its floor, and a broken
 * wooden cover lies beside it. Palette: floor #7d746a / #6c645b, gaps #3e3832, pit walls #4a443e,
 * pit floor #2a2622, spikes #5a4a40 / tips #b8bec6, planks #8a5a35.
 */

const STONE = rgb('#7d746a');
const STONE_DARK = rgb('#5c554d');
const GAP = rgb('#3e3832');
const TOP = 0.1;
const HOLE = 1.2;

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
/** Flagstone seams: distance to the nearest seam of a 0.4 m running-bond grid. */
const seam = (x: number, z: number) => {
  const row = Math.floor((z + 1) / 0.4);
  const u = (x + 1 + (row % 2) * 0.2) / 0.5;
  const v = (z + 1) / 0.4;
  return Math.min(Math.abs(u - Math.round(u)) * 0.5, Math.abs(v - Math.round(v)) * 0.4);
};

export default defineAsset({
  name: 'pit-trap',
  description: 'A stone floor tile with an open square pit: dark stone walls, iron spikes on the pit floor, and a broken wooden cover beside it.',
  detail: 0.008,
  reference: 'docs/item-mockups/pit-trap-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const hole = sdf.box([HOLE, 2, HOLE], 0.01).at(0, 0, 0);
    const floor = sdf
      .box([2, TOP, 2], 0.004)
      .at(0, TOP / 2, 0)
      .subtract(hole)
      .paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
        const c = mixRgb(STONE, STONE_DARK, 0.2 + 0.4 * n);
        return y > TOP - 0.006 ? mixRgb(c, GAP, 1 - clamp((seam(x, z) - 0.006) / 0.006)) : c;
      });
    k.body('floor', floor, { color: '#7d746a', roughness: 0.9, metalness: 0, maxError: 0.002, bump: (x, y, z) => 0.0015 * noise.fbm(x * 25, y * 25, z * 25, 2) });

    const walls = sdf.box([HOLE + 0.1, 0.62, HOLE + 0.1], 0.01).at(0, -0.3, 0).subtract(sdf.box([HOLE, 0.7, HOLE]).at(0, -0.25, 0));
    const pitFloor = sdf.box([HOLE, 0.04, HOLE]).at(0, -0.58, 0);
    k.body(
      'pit',
      sdf.union(walls, pitFloor).paintFn((_x, y) => mixRgb(rgb('#2a2622'), rgb('#4a443e'), clamp((y + 0.6) / 0.6))),
      { color: '#4a443e', roughness: 0.95, metalness: 0 },
    );

    const spikes = [];
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const x = i * 0.34 + (j === 0 ? 0.05 : 0);
        const z = j * 0.34;
        spikes.push(sdf.cone([x, -0.57, z], [x, -0.18 - 0.05 * ((i + j + 2) % 2), z], 0.045, 0.004));
      }
    k.body(
      'spikes',
      sdf.union(...spikes).paintFn((_x, y) => mixRgb(rgb('#5a4a40'), rgb('#b8bec6'), clamp((y + 0.3) / 0.1))),
      { color: '#5a4a40', roughness: 0.5, metalness: 0.7 },
    );

    const planks = sdf.union(
      sdf.box([0.16, 0.035, 0.9], 0.008).at(0.8, TOP + 0.0175, 0.1),
      sdf.box([0.15, 0.035, 0.55], 0.008).rotateY(12).at(0.78, TOP + 0.052, -0.15),
      sdf.box([0.14, 0.035, 0.5], 0.008).rotateZ(-18).rotateY(-6).at(0.62, TOP + 0.03, 0.45),
    );
    k.body(
      'cover',
      planks.paintFn((x, y, z) => mixRgb(rgb('#8a5a35'), rgb('#5e3a1e'), 0.2 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 6, 3)))),
      { color: '#8a5a35', roughness: 0.8, metalness: 0 },
    );
  },
});
