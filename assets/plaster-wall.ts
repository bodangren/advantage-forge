import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/building-parts/plaster-wall — modular tavern wall tile (Chibi Quest tavern set).
 *
 * Role: 2 m wall module for tavern interiors. Two tiles meeting at 90° must read as a proper
 *   timber corner with no dedicated corner piece, so the square end posts are the key feature.
 * Size: 2.0 m long (X), 1.5 m tall, plaster core 0.12 m thick, timbers proud to 0.16 m.
 *   Stands on y = 0, centered on z = 0, flush ends at x = ±1 so tiles butt cleanly.
 * One idea: warm white plaster infill recessed behind chunky dark walnut timbers, every edge
 *   softly beveled, the frame reading from both sides (back = inside of the room).
 * Shape language: square/sturdy mass (sturdy, safe) with soft 2 cm bevels (chunky, friendly).
 * Palette: timber walnut #6b4226 with deep #54331d grain streaks; plaster warm white #f0e4cc
 *   shading to #d8c9a8 near the sill. Value plan: light panel inside a dark frame.
 * Materials: plaster (roughness 0.95, light trowel bump), walnut (roughness 0.8, grain bump).
 * Detail list: frame layout + brace (big), bevels and shadow gaps (medium), grain + trowel
 *   paint (small).
 * Rig/animation: none.
 */

const WALNUT = rgb('#6b4226'); // timber base (contract)
const WALNUT_DEEP = rgb('#54331d'); // grain streaks / shade (contract)
const WALNUT_LIFT = rgb('#7d5233'); // dry flecks, keeps the frame from going flat
const PLASTER = rgb('#f0e4cc'); // warm white (contract)
const PLASTER_SHADE = rgb('#d8c9a8'); // soft shade near the sill (contract)
const PLASTER_LIGHT = rgb('#f8efdc'); // sun-kissed mottling

const LEN = 2.0; // length along X, flush ends at x = ±1
const H = 1.5; // total height
const PLASTER_D = 0.12; // plaster core thickness along Z
const TIMBER_D = 0.15; // timber depth along Z, proud of the plaster
const POST_W = 0.16; // end posts: square in section
const POST_X = LEN / 2 - POST_W / 2;
const SILL_H = 0.18;
const RAIL_H = 0.18;
const BRACE_W = 0.1;
const BEVEL = 0.02; // soft bevel on every timber
const FILLET = 0.012; // blend where timbers meet

// Diagonal brace: springs from the post/sill pocket at A, lands in the top rail at B.
const AX = -0.88;
const AY = 0.1;
const BX = 0.44;
const BY = 1.36;
const braceLen = Math.hypot(BX - AX, BY - AY);
const braceDeg = (Math.atan2(BY - AY, BX - AX) * 180) / Math.PI;
const braceCos = Math.cos((braceDeg * Math.PI) / 180);
const braceSin = Math.sin((braceDeg * Math.PI) / 180);

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/**
 * Wood grain stretched along each member's axis: vertical in the posts, horizontal in the
 * sill and rail, diagonal in the brace. Shared by paint and bump so dark streaks line up
 * with relief.
 */
const grain = (x: number, y: number, z: number): number => {
  const dBrace = Math.abs((x - AX) * braceSin - (y - AY) * braceCos);
  if (dBrace < 0.07) {
    const u = (x - AX) * braceCos + (y - AY) * braceSin;
    return noise.fbm(u * 46, (x + y) * 7, z * 26, 3, 7);
  }
  if (Math.abs(x) > POST_X - POST_W / 2 - 0.005) {
    return noise.fbm(x * 26, y * 52, z * 26, 3, 7); // posts: vertical grain
  }
  return noise.fbm(x * 52, y * 26, z * 26, 3, 7); // rails: horizontal grain
};

export default defineAsset({
  name: 'plaster-wall',
  description:
    'Tavern wall tile: warm white plaster panel recessed between chunky walnut timbers — square end posts, sill, top rail, one diagonal brace; 2 m, tiles on a 2 m grid.',
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  detail: 0.014,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ timber frame
    // Full-depth members: each timber shows identically on both faces, so the wall reads
    // from inside and outside, and two end posts form a proper corner with no corner piece.
    const post = (side: 1 | -1): Sdf =>
      sdf.box([POST_W, H, TIMBER_D], BEVEL).at(side * POST_X, H / 2, 0);
    const sill = sdf.box([LEN, SILL_H, TIMBER_D], BEVEL).at(0, SILL_H / 2, 0);
    const rail = sdf.box([LEN, RAIL_H, TIMBER_D], BEVEL).at(0, H - RAIL_H / 2, 0);
    const brace = sdf
      .box([braceLen, BRACE_W, TIMBER_D], BEVEL * 0.8)
      .rotateZ(braceDeg)
      .at((AX + BX) / 2, (AY + BY) / 2, 0);
    const frame = sdf.smoothUnion(FILLET, post(1), post(-1), sill, rail, brace);

    const timberPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const g = grain(x, y, z);
      let c = mixRgb(base, WALNUT_DEEP, clamp01(g) * 0.48); // dark grain streaks
      c = mixRgb(c, WALNUT_LIFT, clamp01(-g) * 0.12); // pale flecks between streaks
      // Per-member tint: posts a touch deeper so the corners carry the darkest wood.
      const postMask = smoothstep(POST_X - POST_W / 2 - 0.03, POST_X - POST_W / 2 + 0.03, Math.abs(x));
      c = mixRgb(c, WALNUT_DEEP, postMask * 0.18);
      // Dust and hand-oil low on the frame.
      c = mixRgb(c, WALNUT_DEEP, smoothstep(0.14, 0.0, y) * 0.3);
      return c;
    };

    k.body('timber', frame.paintFn(timberPaint), {
      color: WALNUT,
      roughness: 0.8,
      metalness: 0,
      detail: 0.011,
      maxError: 0.002,
      maxTriangles: 4200,
      paintWeight: 2,
      bump: (x, y, z) => 0.0015 * grain(x, y, z) + 0.0004 * noise.noise3(x * 90, y * 90, z * 90, 7),
    });

    // ------------------------------------------------------------------ plaster panel
    // Slightly smaller than the tile so every edge is buried inside the posts, sill, and
    // rail (no coplanar faces at x = ±1), leaving a shadow gap at the proud timbers.
    const panel = sdf.box([LEN - 0.02, H - 0.02, PLASTER_D], 0.012).at(0, H / 2, 0);

    const plasterPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      let c = base;
      const mottle = noise.fbm(x * 2.3, y * 2.3, z * 2.3, 3, 4);
      c = mixRgb(c, PLASTER_SHADE, clamp01(-mottle) * 0.28);
      c = mixRgb(c, PLASTER_LIGHT, clamp01(mottle) * 0.16);
      const trowel = noise.fbm(x * 9, y * 9, z * 9, 3, 9);
      c = mixRgb(c, PLASTER_SHADE, clamp01(-trowel) * 0.1);
      // Soft shade rising from the sill (palette contract).
      c = mixRgb(c, PLASTER_SHADE, smoothstep(0.45, 0.05, y) * 0.55);
      return c;
    };

    k.body('plaster', panel.paintFn(plasterPaint), {
      color: PLASTER,
      roughness: 0.95,
      metalness: 0,
      detail: 0.016,
      maxError: 0.003,
      maxTriangles: 3400,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0012 * noise.fbm(x * 11, y * 11, z * 11, 3, 5) +
        0.0005 * noise.noise3(x * 38, y * 38, z * 38, 5),
    });
  },
});
