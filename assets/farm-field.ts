import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Farm field plot for a cozy chibi hamlet. A 4 m x 3 m rectangle of dark tilled soil framed by a
 * low chunky wooden border, with neat rows of small green sprout dots across the top. Stands on
 * y = 0 with the soil surface at y = 0.1. The frame peeks a little above the soil so it reads as
 * a planter bed from any angle.
 *
 * Design:
 *  - Role: background prop for a cozy hamlet scene; reads clearly at 128 px.
 *  - The one idea: tidy framed patch of dark earth with bright green rows.
 *  - Shape language: rounded chunky (Chibi Quest: soft bevels, no razor edges).
 *  - Palette: dark brown soil, warm wood beam, fresh green sprouts (60/30/10).
 *  - Materials: rough tilled soil, rough warm wood, matte leaf green.
 *  - No rig, no animation.
 */

const SOIL_W = 4.0;
const SOIL_D = 3.0;
const SOIL_H = 0.1;

const FRAME_W = 0.14; // beam thickness
const FRAME_H = 0.18; // beam height (sticks above soil)

const soil = rgb('#5a3a25');
const soilDark = rgb('#3a2415');
const soilLight = rgb('#7a5236');

const wood = rgb('#b08358');
const woodDark = rgb('#7a4f2c');
const woodLight = rgb('#d6a578');

const leaf = rgb('#6fa84a');
const leafDark = rgb('#3f6a25');
const leafLight = rgb('#a8d65a');

// Soil bump: low-frequency lumps (clods) plus fine grain.
const soilBump = (x: number, y: number, z: number) =>
  0.55 * noise.fbm(x * 5, y * 5, z * 5, 3, 11) + 0.45 * noise.noise3(x * 22, y * 22, z * 22, 3);

// Wood grain: streaks along the long axis of each beam.
const woodGrain = (axis: 'x' | 'z') => (x: number, y: number, z: number) => {
  const along = axis === 'x' ? z : x; // grain runs across the beam
  return noise.fbm(along * 22, y * 4, (axis === 'x' ? x : z) * 3, 3, 7);
};

export default defineAsset({
  name: 'farm-field',
  description: 'A 4m x 3m framed farm field of tilled soil with sprout rows, for cozy chibi hamlets.',
  detail: 0.012,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------ soil slab
    // Furrow stripes along the sprout rows (X-axis strips darker than the gaps). The stripes
    // match the sprout row positions, so the tilled look lines up with what is planted.
    const ROW_STRIPES = 4;
    const STRIPE_W = 0.18;
    const furrowZ = (z: number) => {
      const half = SOIL_D / 2 - 0.32;
      const step = (half * 2) / (ROW_STRIPES - 1);
      const idx = Math.round((z + half) / step);
      const cz = -half + idx * step;
      return Math.abs(z - cz) < STRIPE_W ? 1 - Math.abs(z - cz) / STRIPE_W : 0;
    };
    const soilShape = sdf
      .box([SOIL_W, SOIL_H, SOIL_D], 0.025)
      .at(0, SOIL_H / 2, 0)
      .displace(0.01, soilBump)
      .paintFn((x, y, z) => {
        const clod = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 3, 1);
        const micro = 0.5 + 0.5 * noise.noise3(x * 28, y * 28, z * 28, 5);
        const t = clod * 0.55 + micro * 0.45;
        // Base mid-brown, with dark clods and brighter highlights.
        const base = mixRgb(soil, soilDark, 0.3 + 0.55 * t);
        const hi = mixRgb(base, soilLight, Math.max(0, t - 0.55) * 0.7);
        // Darker furrows under the sprout rows.
        return mixRgb(hi, soilDark, furrowZ(z) * 0.45);
      });
    k.body('soil', soilShape, {
      color: '#5a3a25',
      roughness: 0.95,
      bump: soilBump,
      maxError: 0.004,
    });

    // ------------------------------------------------ wooden border frame
    const beamLongLen = SOIL_W + FRAME_W * 2;
    const beamShortLen = SOIL_D + FRAME_W * 2;
    const beamZ = SOIL_D / 2 + FRAME_W / 2;
    const beamX = SOIL_W / 2 + FRAME_W / 2;

    // Brighter top edge highlight (where the sun catches the beam crown) plus the body variation.
    const woodPaintX = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * woodGrain('x')(x, y, z);
      const knot = noise.fbm(x * 3, y * 3, z * 3, 2, 9);
      const t = 0.25 + 0.4 * grain + 0.25 * Math.max(0, knot - 0.45);
      const base = mixRgb(wood, woodDark, Math.min(0.75, t));
      const topHi = Math.max(0, (y - FRAME_H * 0.35) / (FRAME_H * 0.65));
      return mixRgb(base, woodLight, topHi * 0.4);
    };
    const woodPaintZ = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * woodGrain('z')(x, y, z);
      const knot = noise.fbm(x * 3, y * 3, z * 3, 2, 13);
      const t = 0.25 + 0.4 * grain + 0.25 * Math.max(0, knot - 0.45);
      const base = mixRgb(wood, woodDark, Math.min(0.75, t));
      const topHi = Math.max(0, (y - FRAME_H * 0.35) / (FRAME_H * 0.65));
      return mixRgb(base, woodLight, topHi * 0.4);
    };

    const frontBeam = sdf
      .box([beamLongLen, FRAME_H, FRAME_W], 0.018)
      .at(0, FRAME_H / 2, beamZ)
      .paintFn(woodPaintX);
    const backBeam = sdf
      .box([beamLongLen, FRAME_H, FRAME_W], 0.018)
      .at(0, FRAME_H / 2, -beamZ)
      .paintFn(woodPaintX);
    const rightBeam = sdf
      .box([FRAME_W, FRAME_H, beamShortLen], 0.018)
      .at(beamX, FRAME_H / 2, 0)
      .paintFn(woodPaintZ);
    const leftBeam = sdf
      .box([FRAME_W, FRAME_H, beamShortLen], 0.018)
      .at(-beamX, FRAME_H / 2, 0)
      .paintFn(woodPaintZ);

    const frame = sdf.union(frontBeam, backBeam, rightBeam, leftBeam);
    k.body('frame', frame, { color: '#b08358', roughness: 0.85, maxError: 0.004 });

    // ------------------------------------------------ sprout rows
    // Four short rows along the long axis, with six sprouts per row, alternate rows offset
    // like a hand-sown plot. Tiny ellipsoids rest on the soil surface (top at y = 0.1).
    const NUM_ROWS = 4;
    const NUM_COLS = 6;
    const marginX = 0.32;
    const marginZ = 0.32;
    const innerW = SOIL_W - marginX * 2;
    const innerD = SOIL_D - marginZ * 2;

    const sproutBump = (x: number, y: number, z: number) =>
      0.5 * noise.noise3(x * 14, y * 14, z * 14, 17) + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2, 19);

    const sprouts: ReturnType<typeof sdf.ellipsoid>[] = [];
    for (let row = 0; row < NUM_ROWS; row++) {
      const z = -innerD / 2 + (row / (NUM_ROWS - 1)) * innerD;
      const offset = row % 2 === 1 ? innerW / (NUM_COLS * 2) : 0;
      for (let col = 0; col < NUM_COLS; col++) {
        const x = -innerW / 2 + offset + (col / (NUM_COLS - 1)) * (innerW - offset * 2);
        if (Math.abs(x) > innerW / 2 - 0.05) continue;
        const jx = (noise.random(col, row, 1) - 0.5) * 0.04;
        const jz = (noise.random(col, row, 2) - 0.5) * 0.04;
        // Slight height variation for a hand-planted look.
        const h = 0.055 + noise.random(col, row, 3) * 0.025;
        sprouts.push(
          sdf
            .ellipsoid([0.075, h, 0.075])
            .at(x + jx, SOIL_H + h * 0.55, z + jz)
            .paintFn((px, py, pz) => {
              const t = 0.5 + 0.5 * noise.fbm(px * 6, py * 6, pz * 6, 2, col * 7 + row * 13);
              const tip = Math.max(0, py - (SOIL_H + h * 0.3)) * 6; // brighter at top
              const base = mixRgb(leaf, leafDark, 0.2 + 0.55 * t);
              return mixRgb(base, leafLight, Math.min(0.7, tip * (0.4 + 0.6 * t)));
            })
            .displace(0.006, sproutBump),
        );
      }
    }
    const sproutsShape = sdf.union(...sprouts);
    k.body('sprouts', sproutsShape, {
      color: '#6fa84a',
      roughness: 0.75,
      bump: sproutBump,
      maxError: 0.004,
    });
  },
});