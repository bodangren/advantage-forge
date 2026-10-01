import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Farm field plot for the hamlet kit. Overlay on grass tiles: stands on y = 0, 4.28 x 0.23 x 3.28 m.
 * Role: P1 game prop, seen from above by the sprite camera, so the top is the main face.
 * The one idea: a chunky wooden bed holding 7 tidy ridges, each with a row of 9 green cabbage rosettes.
 * Shape language: square and sturdy frame, round soft ridges and rosettes.
 * Palette (60/30/10): tilled soil #5d3d23 with furrows #452c19 and light flecks; warm wood #8a5a32
 * with dark end grain and corner posts; accent = fresh green #6fb04a with light centers #a8d76c.
 * Materials: soil (matte), ridges (matte), frame (wood), crops (leaf). Grain and crumbs in bump.
 * No rig, no animation. Budget: 12,000 triangles.
 */

const W = 4.0;
const D = 3.0;
const FW = 0.14; // beam thickness
const FH = 0.19; // beam height
const PH = 0.23; // post height
const SOIL_TOP = 0.06;
const RIDGES = 7;
const RZ = 0.4; // ridge spacing
const COLS = 9;

const soil = rgb('#5d3d23');
const soilDark = rgb('#452c19');
const soilLight = rgb('#8a6840');
const wood = rgb('#8a5a32');
const woodDark = rgb('#5a3819');
const leaf = rgb('#6fb04a');
const leafLight = rgb('#a8d76c');
const leafDark = rgb('#4e8a34');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ridgeZ = (i: number) => (i - (RIDGES - 1) / 2) * RZ;
const nearRidge = (z: number) => {
  let d = 9;
  for (let i = 0; i < RIDGES; i++) d = Math.min(d, Math.abs(z - ridgeZ(i)));
  return d;
};

export default defineAsset({
  name: 'farm-field',
  description: 'A 4 m x 3 m framed farm field: wooden border with corner posts, tilled soil with seven ridges, rows of cabbage rosettes.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // soil bed
    const bed = sdf
      .box([W + 0.02, SOIL_TOP, D + 0.02], 0.01)
      .at(0, SOIL_TOP / 2, 0)
      .paintFn((x, y, z) => {
        const f = noise.fbm(x * 4, 1.3, z * 4, 2);
        let c = mixRgb(soil, soilDark, 0.35 + 0.3 * f);
        const fleck = noise.noise3(x * 30, 2.1, z * 30);
        if (fleck > 0.6) c = mixRgb(c, soilLight, 0.7);
        return mixRgb(c, soilDark, 0.4 * clamp01(1 - nearRidge(z) / 0.2));
      });
    k.body('soil', bed, {
      color: '#452c19',
      roughness: 0.95,
      detail: 0.02,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 20, y * 20, z * 20, 2),
    });

    // ridges
    const rows = [];
    for (let i = 0; i < RIDGES; i++) rows.push(sdf.ellipsoid([1.92, 0.04, 0.14]).at(0, SOIL_TOP, ridgeZ(i)));
    const ridges = sdf
      .union(...rows)
      .intersect(sdf.box([W, 0.3, D]).at(0, 0.15, 0))
      .paintFn((x, y, z) => {
        const crest = clamp01((y - SOIL_TOP) / 0.04);
        const n = noise.noise3(x * 26, y * 26, z * 26);
        let c = mixRgb(soilDark, soil, 0.4 + 0.6 * crest);
        if (n > 0.55) c = mixRgb(c, soilLight, 0.6);
        return c;
      });
    k.body('ridges', ridges, {
      color: '#5d3d23',
      roughness: 0.95,
      detail: 0.012,
      maxTriangles: 2000,
      bump: (x, y, z) => 0.005 * noise.fbm(x * 22, y * 22, z * 22, 2),
    });

    // wooden frame
    const grain = (x: number, y: number, z: number) => {
      const g = noise.fbm(x * 3, y * 30, z * 30, 2);
      return mixRgb(wood, woodDark, clamp01(0.3 + 0.5 * g));
    };
    const grainZ = (x: number, y: number, z: number) => {
      const g = noise.fbm(x * 30, y * 30, z * 3, 2);
      return mixRgb(wood, woodDark, clamp01(0.3 + 0.5 * g));
    };
    const LX = W + FW * 2;
    const LZ = D + FW * 2;
    const bz = D / 2 + FW / 2;
    const bx = W / 2 + FW / 2;
    const beams = sdf.union(
      sdf.box([LX - 0.2, FH, FW], 0.025).at(0, FH / 2, bz).paintFn(grain),
      sdf.box([LX - 0.2, FH, FW], 0.025).at(0, FH / 2, -bz).paintFn(grain),
      sdf.box([FW, FH, LZ - 0.2], 0.025).at(bx, FH / 2, 0).paintFn(grainZ),
      sdf.box([FW, FH, LZ - 0.2], 0.025).at(-bx, FH / 2, 0).paintFn(grainZ),
    );
    k.body('frame', beams, {
      color: '#8a5a32',
      roughness: 0.85,
      detail: 0.02,
      maxTriangles: 2600,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 8, y * 40, z * 40, 2) + 0.003 * noise.fbm(x * 40, y * 40, z * 8, 2),
    });
    const px = LX / 2 - 0.09;
    const pz = LZ / 2 - 0.09;
    const posts = [];
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        posts.push(
          sdf
            .box([0.18, PH, 0.18], 0.03)
            .at(sx * px, PH / 2, sz * pz)
            .paintFn((x, y, z) => {
              const g = noise.fbm(x * 30, y * 4, z * 30, 2);
              return mixRgb(mixRgb(wood, woodDark, clamp01(0.45 + 0.4 * g)), woodDark, clamp01((y - 0.2) * 12) * 0.6);
            }),
        );
    k.body('posts', sdf.union(...posts), {
      color: '#6e4526',
      roughness: 0.85,
      detail: 0.015,
      maxTriangles: 900,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 30, y * 6, z * 30, 2),
    });

    // cabbage rosettes
    const plants = [];
    const span = 3.3;
    for (let i = 0; i < RIDGES; i++) {
      for (let c = 0; c < COLS; c++) {
        const x = -span / 2 + (c / (COLS - 1)) * span + (noise.random(c, i, 1) - 0.5) * 0.06;
        const z = ridgeZ(i) + (noise.random(c, i, 2) - 0.5) * 0.03;
        const base = SOIL_TOP + 0.035;
        const n = 4 + ((c + i) % 2);
        const leaves = [];
        for (let l = 0; l < n; l++) {
          const a = (l / n) * 360 + noise.random(c, i, 3 + l) * 40;
          leaves.push(
            sdf
              .ellipsoid([0.11, 0.024, 0.07])
              .rotateZ(28)
              .at(0.08, 0.045, 0)
              .rotateY(a),
          );
        }
        const heart = sdf.sphere(0.065).at(0, 0.05, 0); // rosettes 0.3 m across, so each reads at 128 px
        plants.push(sdf.union(...leaves, heart).at(x, base, z));
      }
    }
    const crops = sdf.union(...plants).paintFn((x, y, z) => {
      const h = clamp01((y - SOIL_TOP - 0.035) / 0.11);
      const n = noise.noise3(x * 40, y * 40, z * 40);
      const c = mixRgb(leafDark, leaf, 0.35 + 0.65 * h + 0.1 * n);
      return mixRgb(c, leafLight, clamp01((h - 0.45) * 2));
    });
    k.body('crops', crops, {
      color: '#6fb04a',
      roughness: 0.75,
      detail: 0.01,
      maxTriangles: 8000,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });
  },
});
