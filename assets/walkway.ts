import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

/**
 * Design note — dungeon/dressing/walkway
 * Role: dungeon prop the player crosses over flooded floor; must read at 128 px from the top
 *   and the side. Stands on y = 0, faces +Z, walking surface flush at y = 0.08 at both ends.
 * Size: 2.0 m span along Z, 0.92 m wide along X, plank tops 0.08 (ends) to 0.14 (middle).
 * One idea: a worn arched plank walkway over cold flood water — bright warm planks in the
 *   protected middle, dark water-stained ends that dip toward the water line.
 * Shape language: chunky rounded boxes (soft bevels everywhere) with the calm arch as the
 *   secondary read.
 * Palette (60/30/10): plank brown #8a5a35 dominant, dark frame wood #5a3a22 secondary,
 *   worn pale tops #a4763f, small iron nails #30363c, water stain #38271a with a hint of
 *   algae teal #3f5a44 as the accent.
 * Materials: planks (wood, roughness 0.8, grain in bump), stringers (wood, 0.85, grain bump).
 * Detail list: primary = arched plank deck (focal); secondary = two edge stringer beams;
 *   tertiary = plank seams, grain (bump), nail dots, ragged waterline stain near both ends.
 * Rig/animation: none.
 */

const HALF = 1.0; // half span along Z
const RISE = 0.06; // mid-span arch rise above the flush ends
const END_TOP = 0.08; // plank top at the ends, flush with 0.08 m floor tiles
const PLANKS = 7;
const PITCH = (2 * HALF) / PLANKS;
const PLANK_GAP = 0.016; // real gap between planks; the rounded edges open it further
const PLANK_W = 0.92; // plank length along X
const PLANK_T = 0.052;
const PLANK_R = 0.014; // soft bevel on every plank edge
const STR_W = 0.09; // stringer thickness along X
const STR_X = 0.46 - STR_W / 2; // stringer outer face flush with the plank ends
const STR_TUCK = 0.046; // stringer top sits this far below the plank tops
const STR_R = 0.004; // extrude radius; the polygon is inset by this so sizes stay exact

const deckTop = (z: number) => END_TOP + RISE * (1 - (z / HALF) ** 2);
const strTop = (z: number) => deckTop(z) - STR_TUCK;
const strBot = (z: number) => Math.max(0, 0.02 * (1 - (z / HALF) ** 2));

const DEG = 180 / Math.PI;
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

const PLANK_A = rgb('#7c4e2a');
const PLANK_B = rgb('#663d1c');
const PLANK_DARK = rgb('#3f2612');
const PLANK_WORN = rgb('#93602f');
const PLANK_PALE = rgb('#b08148');
const STR_A = rgb('#4a2e18');
const STR_B = rgb('#38220f');
const STR_WORN = rgb('#6b4526');
const STAIN = rgb('#2e211a');
const ALGAE = rgb('#37503f');
const IRON = rgb('#262b31');

/** Ragged water line: the flood sat a little over 0.10 m up the work. */
const waterLine = (x: number, z: number) => 0.098 + 0.018 * noise.fbm(x * 3.2, 0.6, z * 3.2, 3);

/** Stain strength: only near the two ends, only below the ragged water line. */
const wetness = (x: number, y: number, z: number) =>
  clamp01((Math.abs(z) - 0.42) / 0.36) * clamp01((waterLine(x, z) - y) / 0.045);

export default defineAsset({
  name: 'walkway',
  description:
    'Two-meter arched plank walkway over flooded dungeon floor: seven warm brown planks on two dark stringer beams, water-stained ends.',
  detail: 0.011,
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- planks (focal point)
    // Seven planks run across the walk (along X); each one is tilted to follow the arch
    // tangent, so the walking surface sweeps up 0.06 m toward the middle.
    const plankShapes: sdf.Shape[] = [];
    for (let i = 0; i < PLANKS; i++) {
      const zc = -HALF + PITCH * (i + 0.5);
      const slope = (-2 * RISE * zc) / (HALF * HALF);
      const tilt = -Math.atan(slope) * DEG + (noise.random(i, 11) - 0.5) * 1.2;
      plankShapes.push(
        sdf
          .box([PLANK_W, PLANK_T, PITCH - PLANK_GAP], PLANK_R)
          .rotateX(tilt)
          .at(0, deckTop(zc) - PLANK_T / 2 + (noise.random(i, 5) - 0.5) * 0.003, zc),
      );
    }

    const deck = sdf.union(...plankShapes).paintFn((x, y, z, _base): Rgb => {
      const i = Math.max(0, Math.min(PLANKS - 1, Math.floor((z + HALF) / PITCH)));
      let c = mixRgb(PLANK_A, PLANK_B, 0.1 + 0.75 * noise.random(i, 7));
      // Grain streaks run along the plank (X): low frequency along X, high across it.
      const grain = noise.fbm(x * 3.2, y * 22, z * 22, 3);
      c = mixRgb(c, PLANK_DARK, clamp01(0.24 - 0.32 * grain) * 0.75);
      c = mixRgb(c, PLANK_WORN, clamp01(grain - 0.3) * 0.2);
      // Worn pale walking surface: the light accents that pop at 128 px.
      const wear = clamp01((y - (deckTop(z) - 0.014)) / 0.012);
      c = mixRgb(c, PLANK_PALE, wear * 0.18);
      // Dark undersides so the arch reads even in vertex-color mode.
      const under = clamp01((deckTop(z) - 0.055 - y) / 0.02);
      c = mixRgb(c, PLANK_DARK, under * 0.4);
      // Iron nail heads where each plank crosses a stringer.
      const zc = -HALF + PITCH * (i + 0.5);
      const nail =
        clamp01(1 - Math.abs(Math.abs(x) - 0.4) / 0.013) *
        clamp01(1 - Math.abs(z - zc) / 0.022) *
        (y > deckTop(z) - 0.03 ? 1 : 0);
      if (nail > 0) c = mixRgb(c, IRON, 0.8 * nail);
      // Dark water staining near both ends, below the ragged flood line.
      const wet = wetness(x, y, z);
      if (wet > 0) {
        c = mixRgb(c, STAIN, Math.min(1, 0.45 + 0.55 * wet));
        c = mixRgb(
          c,
          ALGAE,
          wet * clamp01(noise.fbm(x * 7, y * 7, z * 7, 2) + 0.15) * 0.45,
        );
      }
      return c;
    });
    k.body('planks', deck, {
      color: '#7c4e2a',
      roughness: 0.8,
      detail: 0.01,
      maxError: 0.0025,
      maxTriangles: 1600,
      paintWeight: 2,
      textureDensity: 2,
      bump: (x, y, z) =>
        0.0022 * noise.fbm(x * 2.8, y * 20, z * 20, 3) +
        0.0006 * noise.noise3(x * 55, y * 55, z * 55),
    });

    // ------------------------------------------------------------------ stringer beams
    // Two side beams under the plank ends: flat contact with the ground at both tips,
    // arched up in the middle so they read as the load-bearing arch from the side.
    const bandPts = (n = 28) => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const z = -HALF - STR_R + ((2 * HALF + 2 * STR_R) * i) / n;
        pts.push([z, Math.max(strBot(z) - STR_R, STR_R)]);
      }
      for (let i = n; i >= 0; i--) {
        const z = -HALF - STR_R + ((2 * HALF + 2 * STR_R) * i) / n;
        pts.push([z, strTop(z) - STR_R]);
      }
      return profile.polygon(pts);
    };
    const beam = profile.extrude(bandPts(), STR_W, STR_R).rotateY(90);
    const stringer = sdf.union(beam.at(STR_X, 0, 0), beam.at(-STR_X, 0, 0)).paintFn(
      (x, y, z, _base): Rgb => {
        // Grain streaks run along the beam (Z).
        const grain = noise.fbm(x * 22, y * 22, z * 3.2, 3);
        let c = mixRgb(STR_A, STR_B, clamp01(0.3 + 0.4 * grain));
        c = mixRgb(c, STR_WORN, clamp01(grain - 0.25) * 0.25);
        // Worn top edge where it tucks under the planks.
        const topWear = clamp01((y - (strTop(z) - 0.02)) / 0.02);
        c = mixRgb(c, STR_WORN, topWear * 0.2);
        const wet = wetness(x, y, z);
        if (wet > 0) {
          c = mixRgb(c, STAIN, Math.min(1, 0.35 + 0.55 * wet));
          c = mixRgb(
            c,
            ALGAE,
            clamp01(wet - 0.2) * clamp01(noise.fbm(x * 8, y * 8, z * 8, 2) + 0.2) * 0.5,
          );
        }
        return c;
      },
    );
    k.body('stringers', stringer, {
      color: '#5a3a22',
      roughness: 0.85,
      detail: 0.012,
      maxError: 0.0028,
      maxTriangles: 900,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 22, y * 22, z * 3.2, 3),
    });
  },
});
