import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Grass ground tile (architecture/building-parts/grass-floor): 2 m x 2 m, a 0.3 m slab, top at
 * y = 0 (soil down to y = -0.3), edges at x = ±1 and z = ±1, matched to docs/item-mockups/grass-floor-mock.jpg.
 * One idea: soft green turf with gentle lumps, a few grass tufts, and white daisies. The lumps
 * fade out near the edges, so tiles placed side by side meet flat. Palette: grass #7ec850 /
 * #5fae3f, soil sides #7a5a3a, daisy petals #fbfaf2, centers #f2c040.
 */

const GRASS = rgb('#72bb48');
const GRASS_DARK = rgb('#4f9636');
const SOIL = rgb('#7a4a2a');
const STRATA = rgb('#57331d');
const PEBBLE = rgb('#9a8a78');
const TOP = 0;
const SLAB = 0.3;
const EDGE = 0.003; // this turf reduces to a few triangles, and its sharp edges settle up to 2 mm inside

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

const TUFTS: [number, number][] = [
  [-0.6, -0.4], [0.3, -0.7], [0.65, 0.2], [-0.2, 0.55], [-0.75, 0.45], [0.1, 0.05], [0.55, -0.35], [-0.35, -0.8],
];
// Four big flat daisies, like the mockup (small daisies vanish at 128 px).
const DAISIES: [number, number][] = [
  [-0.55, -0.35], [0.5, 0.55], [0.68, -0.6], [-0.6, 0.62],
];

export default defineAsset({
  name: 'grass-floor',
  description: 'A 2 m square grass ground tile, a 0.3 m slab with its top at y = 0 and a grass lip over layered soil sides: soft green turf with gentle lumps, grass tufts, and white daisies.',
  detail: 0.012,
  reference: 'docs/item-mockups/grass-floor-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Lumps fade to zero within 0.12 m of every edge.
    const fade = (x: number, z: number) => clamp((1 - Math.abs(x)) / 0.12) * clamp((1 - Math.abs(z)) / 0.12);
    const turf = sdf
      .box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE])
      .at(0, -SLAB / 2, 0)
      .displace(0.012, (x, y, z) => -fade(x, z) * clamp((y + 0.03) / 0.03) * (0.5 + 0.5 * noise.fbm(x * 2.2, 0, z * 2.2, 3)), 1.3)
      .paintFn((x, y, z) => {
        const topAt = (px: number, pz: number) => {
          const tn = 0.5 + 0.5 * noise.fbm(px * 3, 0, pz * 3, 3);
          return mixRgb(GRASS, GRASS_DARK, 0.1 + 0.7 * tn * tn);
        };
        if (y < -0.01) {
          const along = Math.abs(x) > Math.abs(z) ? z : x;
          const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
          if (y > -drip) return mixRgb(topAt(x, z), GRASS_DARK, 0.25 + 0.3 * Math.min(1, -y / drip));
          let c = mixRgb(SOIL, STRATA, 0.15 + (-y / SLAB) * 0.55);
          c = mixRgb(c, STRATA, Math.max(0, Math.sin((y + 0.02 * Math.sin(along * Math.PI * 2)) * 70) - 0.6) * 0.8);
          const pn = noise.fbm(along * 9, y * 9, 3.1, 2);
          return pn > 0.45 ? mixRgb(c, PEBBLE, Math.min(1, (pn - 0.45) * 6) * 0.8) : c;
        }
        const n = 0.5 + 0.5 * noise.fbm(x * 3, 0, z * 3, 3);
        const fine = 0.5 + 0.5 * noise.noise3(x * 40, 0, z * 40);
        return mixRgb(GRASS, GRASS_DARK, 0.1 + 0.7 * n * n + 0.2 * fine);
      });
    k.body('turf', turf, {
      color: '#7ec850',
      roughness: 0.9,
      metalness: 0,
      maxTriangles: 6000,
      maxError: 0.004,
      bump: (x, y, z) => y < -0.01 ? 0 : 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 2),
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
      maxTriangles: 3000,
    });

    const petals = [];
    const centers = [];
    for (const [dx, dz] of DAISIES) {
      for (let p = 0; p < 6; p++) {
        const a = (p * Math.PI) / 3;
        petals.push(sdf.ellipsoid([0.075, 0.016, 0.036]).rotateY((-a * 180) / Math.PI).at(dx + Math.cos(a) * 0.066, TOP + 0.012, dz + Math.sin(a) * 0.066));
      }
      centers.push(sdf.ellipsoid([0.04, 0.022, 0.04]).at(dx, TOP + 0.02, dz));
    }
    k.body('petals', sdf.union(...petals), { color: '#fbfaf2', roughness: 0.7, metalness: 0, detail: 0.005, maxTriangles: 2500 });
    k.body('centers', sdf.union(...centers), { color: '#f2c040', roughness: 0.7, metalness: 0, detail: 0.005, maxTriangles: 600 });
  },
});
