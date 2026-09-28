import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Grass ground tile (architecture/building-parts/grass-floor): 2 m x 2 m, 0.06 m thick, top at
 * y = 0.06, edges at x = ±1 and z = ±1, matched to docs/item-mockups/grass-floor-mock.jpg.
 * One idea: soft green turf with gentle lumps, a few grass tufts, and white daisies. The lumps
 * fade out near the edges, so tiles placed side by side meet flat. Palette: grass #7ec850 /
 * #5fae3f, soil sides #7a5a3a, daisy petals #fbfaf2, centers #f2c040.
 */

const GRASS = rgb('#72bb48');
const GRASS_DARK = rgb('#4f9636');
const SOIL = rgb('#7a5a3a');
const TOP = 0.06;

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

const TUFTS: [number, number][] = [
  [-0.6, -0.4], [0.3, -0.7], [0.65, 0.2], [-0.2, 0.55], [-0.75, 0.45], [0.1, 0.05], [0.55, -0.35], [-0.35, -0.8],
];
const DAISIES: [number, number][] = [
  [-0.45, -0.1], [0.4, 0.6], [0.75, -0.65], [-0.1, -0.45], [0.2, 0.35], [-0.7, 0.8],
];

export default defineAsset({
  name: 'grass-floor',
  description: 'A 2 m square grass ground tile: soft green turf with gentle lumps, grass tufts, and white daisies.',
  detail: 0.012,
  reference: 'docs/item-mockups/grass-floor-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Lumps fade to zero within 0.12 m of every edge.
    const fade = (x: number, z: number) => clamp((1 - Math.abs(x)) / 0.12) * clamp((1 - Math.abs(z)) / 0.12);
    const turf = sdf
      .box([2, TOP, 2], 0.004)
      .at(0, TOP / 2, 0)
      .displace(0.012, (x, y, z) => -fade(x, z) * clamp((y - 0.03) / 0.03) * (0.5 + 0.5 * noise.fbm(x * 2.2, 0, z * 2.2, 3)), 1.3)
      .paintFn((x, y, z) => {
        if (y < TOP - 0.012) return SOIL;
        const n = 0.5 + 0.5 * noise.fbm(x * 3, 0, z * 3, 3);
        const fine = 0.5 + 0.5 * noise.noise3(x * 40, 0, z * 40);
        return mixRgb(GRASS, GRASS_DARK, 0.1 + 0.7 * n * n + 0.2 * fine);
      });
    k.body('turf', turf, {
      color: '#7ec850',
      roughness: 0.9,
      metalness: 0,
      maxTriangles: 4000,
      maxError: 0.004,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    const blades = [];
    for (const [tx, tz] of TUFTS) {
      for (let b = 0; b < 5; b++) {
        const a = b * 1.26 + tx * 7;
        const lean = 0.03;
        blades.push(sdf.cone([tx + Math.cos(a) * 0.015, TOP - 0.005, tz + Math.sin(a) * 0.015], [tx + Math.cos(a) * lean * 1.6, TOP + 0.11 + 0.03 * (b % 2), tz + Math.sin(a) * lean * 1.6], 0.016, 0.002));
      }
    }
    k.body('tufts', sdf.union(...blades).paintFn((_x, y) => mixRgb(GRASS_DARK, GRASS, clamp((y - TOP) / 0.08))), {
      color: '#5fae3f',
      roughness: 0.8,
      metalness: 0,
      detail: 0.004,
    });

    const petals = [];
    const centers = [];
    for (const [dx, dz] of DAISIES) {
      for (let p = 0; p < 6; p++) {
        const a = (p * Math.PI) / 3;
        petals.push(sdf.ellipsoid([0.034, 0.008, 0.017]).rotateY((-a * 180) / Math.PI).at(dx + Math.cos(a) * 0.03, TOP + 0.014, dz + Math.sin(a) * 0.03));
      }
      centers.push(sdf.ellipsoid([0.018, 0.011, 0.018]).at(dx, TOP + 0.018, dz));
      petals.push(sdf.capsule([dx, TOP - 0.005, dz], [dx, TOP + 0.008, dz], 0.003));
    }
    k.body('petals', sdf.union(...petals), { color: '#fbfaf2', roughness: 0.7, metalness: 0, detail: 0.003 });
    k.body('centers', sdf.union(...centers), { color: '#f2c040', roughness: 0.7, metalness: 0, detail: 0.003 });
  },
});
