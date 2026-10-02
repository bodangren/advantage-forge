import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * architecture/building-parts/wood-wall — modular plank wall tile (Chibi Quest village set).
 *
 * Role: 2 m wall module for the village set, same tile size as plaster-wall; tiles butt
 *   end to end at x = ±1, so every end is cut flat and square.
 * Size: 2.0 m long (X), 1.5 m tall, planks 0.14 m thick, sill/rail proud to 0.16 m.
 *   Stands on y = 0, centered on z = 0, front toward +Z.
 * One idea: bold vertical honey-oak planks with deep rounded grooves, framed by a heavy
 *   walnut sill and rail whose top face catches pale cut-wood light (mock: proud pale rail).
 * Shape language: square/sturdy mass with soft 1.4 cm bevels everywhere (chunky, friendly).
 * Palette (contract): honey oak #b5814a dominant, pale cut wood #c9a06a flecks + rail top,
 *   warm brown #8a5a35 per-plank tint, walnut #6b4226 frame shading to #54331d grooves,
 *   iron #4a4f55 nails (accent, ~10%). Value plan: mid field inside a dark top/bottom frame.
 * Materials: oak planks (roughness 0.85, vertical grain bump), walnut frame (roughness 0.8,
 *   horizontal grain bump), worn iron (roughness 0.5, metalness 0.7).
 * Detail list: slab + grooves + frame (big), bevels, nail heads, rail-top highlight (medium),
 *   grain + per-plank tint in paint/bump (small). Focal point: the grooved plank field.
 * Rig/animation: none (static building part).
 */

const HONEY = rgb('#b5814a'); // plank base (contract)
const HONEY_LIGHT = rgb('#c9a06a'); // pale cut wood: flecks, rail top (contract)
const WARM = rgb('#8a5a35'); // per-plank tint / shade (contract)
const WALNUT = rgb('#6b4226'); // sill + rail (contract)
const WALNUT_DEEP = rgb('#54331d'); // grooves, dirt line (contract shade)
const IRON = rgb('#4a4f55'); // nail heads (contract)
const IRON_DARK = rgb('#363a3f'); // worn speckle (contract)
const IRON_LIFT = rgb('#a8acb1'); // worn highlight (contract)

const LEN = 2.0; // flush ends at x = ±1
const H = 1.5; // total height
const THICK = 0.14; // plank thickness along Z
const RAIL_D = 0.16; // sill/rail depth, proud of the planks like the mock
const SILL_TOP = 0.17; // sill spans y 0..0.17
const RAIL_BOT = 1.33; // rail spans y 1.33..1.5
const PLANK_H = RAIL_BOT - SILL_TOP;
const PLANK_W = 0.2; // ten planks across the 2 m tile
const N_PLANKS = 10;
const BEVEL = 0.014; // soft bevel on the frame members

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'wood-wall',
  description:
    'Plank wall tile: bold vertical honey-oak planks with deep rounded grooves, a heavy walnut sill and top rail with a pale sun-cut top, and iron nails at the ends; 2 m, tiles on a 2 m grid.',
  reference: 'docs/item-mockups/wood-wall-mock.jpg',
  detail: 0.016,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ plank field
    // One softly rounded slab; the ten plank boards are painted, with grooves and grain
    // in `bump` (the normal map carries the relief, so the mesh stays light and reduces
    // cleanly). The mock's chunky log look comes from the wide dark groove lines.
    const slabY = (SILL_TOP + RAIL_BOT) / 2;
    const planks = sdf.box([LEN, PLANK_H + 0.02, THICK], 0.02).at(0, slabY, 0);

    // Per-plank tint (alternating warm/cool honey), dark groove lines on the 0.2 m pitch,
    // vertical grain, sun on top. Stays honey, never pale: the mock is warm oak.
    const plankPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const u = (x + LEN / 2) / PLANK_W;
      const idx = Math.max(0, Math.min(N_PLANKS - 1, Math.floor(u)));
      const d = Math.abs(u - Math.round(u)) * PLANK_W; // 0 at a groove, 0.1 mid-plank
      let c = mixRgb(base, WARM, 0.24 + 0.3 * noise.random(idx, 3, 7)); // warm per-plank tint
      c = mixRgb(c, HONEY_LIGHT, noise.random(idx, 11, 2) > 0.65 ? 0.14 : 0.04); // some paler boards
      c = mixRgb(c, WALNUT_DEEP, (1 - smoothstep(0.006, 0.018, d)) * 0.88); // crisp groove line
      c = mixRgb(c, WALNUT_DEEP, smoothstep(0.055, 0.018, d) * 0.16); // faint edge shading
      const g = noise.fbm(x * 26, y * 6, z * 26, 3, 7);
      c = mixRgb(c, WALNUT_DEEP, clamp01(-g) * 0.3); // vertical grain streaks
      c = mixRgb(c, HONEY_LIGHT, clamp01(g) * 0.12); // pale flecks
      c = mixRgb(c, HONEY_LIGHT, smoothstep(0.6, 1.28, y) * 0.26); // sun band under the rail
      c = mixRgb(c, WALNUT_DEEP, smoothstep(0.24, 0.14, y) * 0.24); // damp just above the sill
      return c;
    };

    k.body('planks', planks.paintFn(plankPaint), {
      color: HONEY,
      roughness: 0.85,
      metalness: 0,
      detail: 0.02,
      maxError: 0.005,
      maxTriangles: 2400,
      paintWeight: 2,
      bump: (x, y, z) => {
        const u = (x + LEN / 2) / PLANK_W;
        const d = Math.abs(u - Math.round(u)) * PLANK_W;
        const groove = 1 - smoothstep(0.004, 0.016, d); // recessed seam between boards
        const g = noise.fbm(x * 30, y * 7, z * 30, 3, 7);
        return -0.003 * groove + 0.0008 * g;
      },
    });

    // ------------------------------------------------------------------ walnut frame
    // Sill on the ground, rail proud on top like the mock; both run the full tile length
    // so neighbouring tiles meet flat end to end.
    const sill = sdf.box([LEN, SILL_TOP + 0.01, RAIL_D], BEVEL).at(0, (SILL_TOP + 0.01) / 2, 0);
    const rail = sdf.box([LEN, H - RAIL_BOT + 0.01, RAIL_D], BEVEL).at(0, (H + RAIL_BOT - 0.01) / 2, 0);
    const frame = sdf.union(sill, rail);

    const framePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const g = noise.fbm(x * 9, y * 44, z * 40, 3, 7); // horizontal grain
      let c = mixRgb(base, WALNUT_DEEP, 0.38 + clamp01(-g) * 0.35); // deep walnut, grain streaks
      c = mixRgb(c, HONEY_LIGHT, clamp01(g) * 0.1);
      // Pale cut top on the rail: the mock's pale rail reads here as a sun-caught top face.
      const topFace = smoothstep(H - 0.035, H - 0.002, y) * smoothstep(RAIL_D / 2 + 0.01, RAIL_D / 2 - 0.012, Math.abs(z));
      c = mixRgb(c, HONEY_LIGHT, topFace * 0.78);
      // Dirt and kick wear low on the sill.
      c = mixRgb(c, WALNUT_DEEP, smoothstep(0.07, 0.0, y) * 0.4);
      return c;
    };

    k.body('frame', frame.paintFn(framePaint), {
      color: WALNUT,
      roughness: 0.8,
      metalness: 0,
      detail: 0.015,
      maxError: 0.002,
      maxTriangles: 1300,
      paintWeight: 2,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 10, y * 46, z * 42, 3, 7),
    });

    // ------------------------------------------------------------------ iron nails
    // Two worn nail heads near each end of the sill and rail: the small iron accent.
    const nails: ReturnType<typeof sdf.sphere>[] = [];
    for (const sx of [1, -1]) {
      for (const y of [(SILL_TOP + 0.01) / 2, (H + RAIL_BOT - 0.01) / 2]) {
        nails.push(sdf.sphere(0.02).scale([1, 1, 0.55]).at(sx * (LEN / 2 - 0.07), y, RAIL_D / 2 + 0.004));
      }
    }
    const nailWear = sdf.union(...nails).paintFn((x, y, z, base) => {
      const w = noise.fbm(x * 60, y * 60, z * 60, 2, 3);
      let c = mixRgb(base, IRON_DARK, clamp01(-w) * 0.45); // worn dark speckle
      c = mixRgb(c, IRON_LIFT, clamp01(w) * 0.3); // burnished highlights
      return c;
    });
    k.body('nails', nailWear, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      maxTriangles: 160,
    });
  },
});
