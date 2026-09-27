import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Role: smithy exterior wall tile. It must read at 128 px in a cutaway shop.
 * Size: 2.0 m along X, 1.5 m tall, plaster core 0.12 m thick. Stands on y = 0. Faces +Z.
 * One idea: warm white plaster sits recessed in a chunky walnut frame with one bold diagonal.
 * Shape language: square sturdy timbers, soft 18 mm bevels, one diagonal as the secondary line.
 * Palette: plaster #f0e4cc (light, dominant), walnut #6b4226 (dark frame), deep #54331d grain.
 * Materials: plaster (roughness 0.95), walnut timber (roughness 0.8).
 * Detail: end posts, sill, top rail, one brace. Grain and trowel marks stay in paint and bump.
 * Rig: none.
 */

const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIFT = rgb('#7d5233');
const PLASTER = rgb('#f0e4cc');
const PLASTER_SHADE = rgb('#d8c9a8');
const PLASTER_LIGHT = rgb('#f8efdc');
const PLASTER_SPLASH = rgb('#c4a880');

const LEN = 2.0;
const H = 1.5;
const PLASTER_D = 0.12;
const TIMBER_D = 0.18;
const POST_W = 0.16;
const POST_X = 0.925; // contract: centers at x = ±0.925
const BAND_H = 0.18; // sill and top rail
const BRACE_W = 0.12;
const BEVEL = 0.018;
const FILLET = 0.012;

// Brace centerline, lower-left to upper-right (construction contract).
const AX = -0.88;
const AY = 0.1;
const BX = 0.44;
const BY = 1.36;
const braceDx = BX - AX;
const braceDy = BY - AY;
const braceLen = Math.hypot(braceDx, braceDy);
const braceUx = braceDx / braceLen;
const braceUy = braceDy / braceLen;
const braceDeg = (Math.atan2(braceDy, braceDx) * 180) / Math.PI;
// Extra length buries the rounded end caps inside the post, sill, and rail.
const BRACE_EXTRA = 0.05;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Signed distance from the brace centerline, in the XY plane. */
const braceOffset = (x: number, y: number): number => (x - AX) * braceUy - (y - AY) * braceUx;
const braceAlong = (x: number, y: number): number => (x - AX) * braceUx + (y - AY) * braceUy;

/**
 * Grain runs along each member: vertical in the posts, horizontal in the bands,
 * diagonal in the brace. Paint and bump share this field.
 */
const grain = (x: number, y: number, z: number): number => {
  const along = braceAlong(x, y);
  if (Math.abs(braceOffset(x, y)) < BRACE_W * 0.55 && along > -0.04 && along < braceLen + 0.04) {
    return noise.fbm(along * 42, braceOffset(x, y) * 18, z * 28, 3, 7);
  }
  if (Math.abs(Math.abs(x) - POST_X) < POST_W * 0.55) {
    return noise.fbm(x * 22, y * 48, z * 22, 3, 7);
  }
  return noise.fbm(x * 48, y * 18, z * 22, 3, 7);
};

export default defineAsset({
  name: 'timber-wall',
  description:
    'Smithy wall tile: warm white plaster recessed between chunky walnut timbers, with square end posts, a sill, a top rail, and one diagonal brace. 2 m long, tiles on a 2 m grid.',
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  detail: 0.014,
  texture: { size: 1024 },

  build(k) {
    // Full-depth members. Each timber shows on both faces, so the tile reads from
    // the street and from inside the shop. Two end posts make a corner with no extra piece.
    const post = (side: 1 | -1): Sdf =>
      sdf.box([POST_W, H, TIMBER_D], BEVEL).at(side * POST_X, H / 2, 0);
    const sill = sdf.box([LEN, BAND_H, TIMBER_D], BEVEL).at(0, BAND_H / 2, 0);
    const rail = sdf.box([LEN, BAND_H, TIMBER_D], BEVEL).at(0, H - BAND_H / 2, 0);
    const brace = sdf
      .box([braceLen + BRACE_EXTRA * 2, BRACE_W, TIMBER_D], BEVEL * 0.85)
      .rotateZ(braceDeg)
      .at((AX + BX) / 2, (AY + BY) / 2, 0);
    const frame = sdf.smoothUnion(FILLET, post(-1), post(1), sill, rail, brace);

    const timberPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const g = grain(x, y, z);
      let c = mixRgb(base, WALNUT_DEEP, clamp01(g) * 0.46);
      c = mixRgb(c, WALNUT_LIFT, clamp01(-g) * 0.14);
      // Posts carry the darkest wood so the corners anchor the frame.
      const postMask = smoothstep(0.04, 0.0, Math.abs(Math.abs(x) - POST_X) - POST_W * 0.35);
      c = mixRgb(c, WALNUT_DEEP, postMask * 0.2);
      // Hand-oil and soot low on the frame. The shop floor marks the sill.
      c = mixRgb(c, WALNUT_DEEP, smoothstep(0.22, 0.0, y) * 0.32);
      // A lighter worn crown on the top rail, where rain and hands hit.
      c = mixRgb(c, WALNUT_LIFT, smoothstep(1.28, 1.48, y) * 0.16);
      return c;
    };

    k.body('timber', frame.paintFn(timberPaint), {
      color: WALNUT,
      roughness: 0.8,
      metalness: 0,
      detail: 0.011,
      maxError: 0.0022,
      maxTriangles: 3600,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * grain(x, y, z) + 0.00035 * noise.noise3(x * 80, y * 80, z * 80, 7),
    });

    // Inset 5 mm on X and 20 mm on Y so plaster texels never land on walnut ends.
    // Thinner than the timbers, so the infill sits 30 mm back on each face.
    const panel = sdf
      .box([LEN - 0.01, H - 0.04, PLASTER_D], 0.012)
      .at(0, H / 2, 0);

    const plasterPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const mottle = noise.fbm(x * 2.2, y * 2.4, z * 3, 3, 4);
      let c = mixRgb(base, PLASTER_SHADE, clamp01(-mottle) * 0.26);
      c = mixRgb(c, PLASTER_LIGHT, clamp01(mottle) * 0.14);
      const trowel = noise.fbm(x * 9, y * 9, z * 9, 3, 9);
      c = mixRgb(c, PLASTER_SHADE, clamp01(-trowel) * 0.1);
      // Shade rises from the sill. Splash marks the kick zone.
      const low = smoothstep(0.48, 0.06, y);
      c = mixRgb(c, PLASTER_SHADE, low * 0.5);
      const splash = noise.fbm(x * 5.5, y * 8, z * 5, 2, 6);
      c = mixRgb(c, PLASTER_SPLASH, low * clamp01(0.15 + splash) * 0.55);
      // Soft contact shade where plaster meets timber, so the recess reads at sprite size.
      const nearPost = smoothstep(0.12, 0.0, 0.845 - Math.abs(x));
      const nearSill = smoothstep(0.1, 0.0, y - 0.16);
      const nearRail = smoothstep(0.1, 0.0, 1.34 - y);
      const along = braceAlong(x, y);
      const onBrace = along > -0.02 && along < braceLen + 0.02;
      const nearBrace = onBrace ? smoothstep(0.1, 0.0, Math.abs(braceOffset(x, y)) - BRACE_W * 0.45) : 0;
      c = mixRgb(c, PLASTER_SHADE, Math.max(nearPost, nearSill, nearRail, nearBrace) * 0.42);
      return c;
    };

    k.body('plaster', panel.paintFn(plasterPaint), {
      color: PLASTER,
      roughness: 0.95,
      metalness: 0,
      detail: 0.018,
      maxError: 0.0035,
      maxTriangles: 1600,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0012 * noise.fbm(x * 11, y * 11, z * 11, 3, 5) +
        0.00045 * noise.noise3(x * 36, y * 36, z * 36, 5),
    });
  },
});
