import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Map fragment (quest item): a torn quarter of a map, 0.24 m x 0.20 m, 0.02 m thick, propped at
 * 70 degrees on a dark wood wedge. Torn east and top edges (notches 0.02 m deep), a raised red X
 * near the tear, a soft pale sea wash, two raised green forest domes.
 * Palette: parchment #efdcae, sea #8fc0dc, ink #6b4a2a, X #d83a2a, forest #5f8f3a.
 */

const PAPER = rgb('#efdcae');
const PAPER_EDGE = rgb('#cdb27c');
const INK = rgb('#6b4a2a');
const SEA = rgb('#b9d4e2');

const HX = 0.12;
const HZ = 0.1;
const T = 0.02;
const TILT = 70;
const LIFT = 0.096;

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const pose = (s: ReturnType<typeof sdf.box>) => s.rotateX(TILT).at(0, LIFT, 0);

// Outline (x, z): straight west and south edges, torn east and north edges with ten 0.02 m notches.
const OUTLINE: [number, number][] = [[-HX, HZ], [HX, HZ]];
{
  const east = [0.0, 0.02, 0.005, 0.02, 0.0, 0.02, 0.008, 0.02, 0.0, 0.015];
  east.forEach((d, i) => OUTLINE.push([HX - d, HZ - ((i + 1) / (east.length + 1)) * 2 * HZ]));
  OUTLINE.push([HX - 0.005, -HZ]);
  const north = [0.0, 0.02, 0.006, 0.02, 0.0, 0.018, 0.0, 0.02, 0.008, 0.02];
  north.forEach((d, i) => OUTLINE.push([HX - ((i + 1) / (north.length + 1)) * 2 * HX, -HZ + d]));
}

const paint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 25, y * 25, z * 25, 2);
  let c = mixRgb(PAPER, PAPER_EDGE, 0.15 * n);
  const edge = Math.max(x / HX, z / HZ, -x / HX, -z / HZ);
  c = mixRgb(c, PAPER_EDGE, clamp((edge - 0.85) / 0.15) * 0.8);
  if (y > T * 0.6) {
    const coast = x + 0.06 + 0.02 * noise.noise3(0, 0, z * 18);
    c = mixRgb(c, SEA, 0.85 * (1 - clamp((coast + 0.01) / 0.05)));
    c = mixRgb(c, INK, 0.6 * (1 - clamp((Math.abs(coast) - 0.002) / 0.003)));
  }
  return c;
};

const barPose = (s: ReturnType<typeof sdf.box>, a: number) =>
  s.rotateY(a).at(0.035, T + 0.005, -0.02);

export default defineAsset({
  name: 'map-fragment',
  description: 'A torn quarter of a map propped on a wood wedge: jagged torn edges, a raised red X, a pale sea wash and two forest domes.',
  detail: 0.004,
  reference: 'docs/item-mockups/map-fragment-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const sheet = sdf.extrude(profile.polygon(OUTLINE), T, 0.004).rotateX(90).at(0, T / 2, 0);
    k.body('paper', pose(sheet.paintFn(paint)), {
      color: '#efdcae',
      roughness: 0.85,
      metalness: 0,
      textureDensity: 3,
      paintWeight: 2,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });

    const full = sdf.box([0.16 * 0.7, 0.02 * 0.7, 0.04 * 0.7], 0.0069);
    k.body('x', pose(sdf.smoothUnion(0.006, barPose(full, 45), barPose(full, -45))), {
      color: '#d83a2a',
      roughness: 0.45,
      metalness: 0,
      detail: 0.003,
    });

    const dome = (x: number, z: number) => sdf.sphere(0.012).at(x, T, z);
    k.body('forest', pose(sdf.union(dome(0.02, 0.05), dome(0.05, 0.03))), {
      color: '#5f8f3a',
      roughness: 0.7,
      metalness: 0,
      detail: 0.003,
    });

    k.body('wedge', sdf.box([0.12, 0.07, 0.07], 0.01).at(0, 0.035, -0.045), {
      color: '#4a2e18',
      roughness: 0.75,
      metalness: 0,
      detail: 0.005,
    });
  },
});
