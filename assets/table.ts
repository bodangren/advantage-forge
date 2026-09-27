import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — sturdy square tavern table (props/furniture/table).
 *
 * Role: tavern seating prop, the anchor furniture piece of the tavern set; must
 *   read instantly at 128 px as "a square slab on four legs".
 * Size: 0.95 x 0.95 m top, 0.60 m tall, stands on y = 0, faces +Z.
 * One idea: one bold honey-oak slab with a soft bevel, floating on four chunky
 *   square legs tied by a low stretcher frame — sturdy and simple.
 * Shape language: square dominant (sturdy, reliable), round secondary (soft
 *   bevels on every edge, filleted joins — Chibi Quest treatment).
 * Palette (tavern contract): honey oak #b5814a top (dominant), warm brown
 *   #8a5a35 legs + stretchers (secondary), pale cut wood #c9a06a edge wear
 *   (accent); shadows toward #5c3a20, plank lines toward #7a5330.
 * Materials: wood only, split in two bodies — oak top (roughness 0.78) and
 *   brown legs (roughness 0.84). Plank grooves and grain in `bump`.
 * Detail: primary slab + legs + stretcher frame; secondary pale edge-wear band
 *   and faint plank division; tertiary grain in bump. Focal point: the thick
 *   beveled top.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a'); // honey oak top (dominant)
const BROWN = rgb('#8a5a35'); // legs + stretchers (secondary)
const PALE = rgb('#c9a06a'); // pale cut wood, edge wear (accent)
const OAK_DARK = rgb('#7a5330'); // plank lines / shaded oak
const BROWN_DARK = rgb('#4e3018'); // foot grime / shaded brown

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const TOP_W = 0.95; // top square side
const TOP_T = 0.07; // top thickness
const TOP_Y0 = 0.53; // underside of the top
const TOP_BEVEL = 0.014; // soft edge bevel
const PLANKS = 5; // plank divisions across the top (running along X)

const LEG_S = 0.1; // square leg cross-section
const LEG_X = 0.36; // leg center inset from the middle
const LEG_H = TOP_Y0; // legs run from the floor to the underside of the top
const STRETCH_Y = 0.14; // stretcher frame center height (low, near the floor)
const STRETCH_H = 0.06; // stretcher bar height
const STRETCH_D = 0.05; // stretcher bar depth

export default defineAsset({
  name: 'table',
  description:
    'Sturdy square tavern table: thick honey-oak top with a soft bevel and faint planks, on four chunky brown legs tied by a low stretcher frame.',
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ top
    // One bold slab: 0.95 x 0.07 x 0.95, beveled edges, planks running along X.
    const topShape = sdf
      .box([TOP_W, TOP_T, TOP_W], TOP_BEVEL)
      .at(0, TOP_Y0 + TOP_T / 2, 0);

    const topPaint = (x: number, y: number, z: number) => {
      // Planks across Z: index, boundary groove, per-plank tint.
      const u = ((z + TOP_W / 2) / TOP_W) * PLANKS;
      const idx = Math.floor(u);
      const f = u - idx;
      const line = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 10);
      // Grain runs along X: slow along the board, quick across it.
      const grain = noise.fbm(x * 4, y * 7, z * 34, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
      let c = mixRgb(OAK, OAK_DARK, 0.06 + 0.16 * noise.random(idx, 3, 9));
      c = mixRgb(c, OAK_DARK, 0.28 * patch);
      c = mixRgb(c, PALE, 0.09 * (0.5 + 0.5 * grain));
      // Faint plank division.
      c = mixRgb(c, OAK_DARK, 0.45 * line);
      // Pale cut-wood edge wear: a band around the rim, over bevel and face.
      const edge = Math.max(Math.abs(x), Math.abs(z));
      c = mixRgb(c, PALE, 0.7 * smoothstep(0.443, 0.466, edge));
      return c;
    };

    k.body('top', topShape.paintFn(topPaint), {
      color: '#b5814a',
      roughness: 0.78,
      metalness: 0,
      detail: 0.0065,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 3000,
      bump: (x, y, z) => {
        const u = ((z + TOP_W / 2) / TOP_W) * PLANKS;
        const f = u - Math.floor(u);
        const line = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 10);
        return -0.0022 * line + 0.0011 * noise.fbm(x * 4, y * 7, z * 34, 2);
      },
    });

    // ------------------------------------------------------- legs + stretcher
    // Four chunky square legs slightly inset from the corners, joined by a low
    // rectangular stretcher frame whose bars run into the legs.
    const legAt = (sx: number, sz: number) =>
      sdf.box([LEG_S, LEG_H, LEG_S], 0.016).at(sx * LEG_X, LEG_H / 2, sz * LEG_X);
    const barX = (sz: number) =>
      sdf.box([2 * LEG_X + LEG_S, STRETCH_H, STRETCH_D], 0.012).at(
        0,
        STRETCH_Y,
        sz * LEG_X,
      );
    const barZ = (sx: number) =>
      sdf.box([STRETCH_D, STRETCH_H, 2 * LEG_X + LEG_S], 0.012).at(
        sx * LEG_X,
        STRETCH_Y,
        0,
      );

    const frame = sdf
      .union(legAt(1, 1), legAt(-1, 1), legAt(1, -1), legAt(-1, -1))
      .smoothUnion(0.01, barX(1), barX(-1), barZ(1), barZ(-1));

    const legPaint = (x: number, y: number, z: number) => {
      // Grain runs along Y for legs and bars.
      const grain = noise.fbm(x * 26, y * 4, z * 26, 2);
      let c = mixRgb(BROWN, BROWN_DARK, 0.16 + 0.2 * (0.5 + 0.5 * grain));
      c = mixRgb(c, PALE, 0.07 * (0.5 + 0.5 * grain));
      // Scuffed pale feet, damp grime just above them.
      c = mixRgb(c, BROWN_DARK, 0.3 * smoothstep(0.07, 0.01, y));
      c = mixRgb(c, PALE, 0.28 * smoothstep(0.022, 0.004, y));
      return c;
    };

    k.body('legs', frame.paintFn(legPaint), {
      color: '#8a5a35',
      roughness: 0.84,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 2400,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 26, y * 4, z * 26, 2),
    });
  },
});
