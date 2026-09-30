import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — sturdy square tavern table (props/furniture/table), reworked: four gapped planks (#b07a45) with
 * rounded ends, knots, grain bump, worn center; chamfered legs, stretchers, corner brackets, cleats (#7a4e2a).
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

const TOP = rgb('#b07a45');
const TOP_DARK = rgb('#7a5330');
const KNOT = rgb('#4a2c14');
const GAP = 0.014;
const OAK = rgb('#b07a45'); // top
const BROWN = rgb('#6a4424'); // legs + stretchers (secondary)
const PALE = rgb('#c9a06a'); // pale cut wood, edge wear (accent)
const OAK_DARK = rgb('#7a5330'); // plank lines / shaded oak
const BROWN_DARK = rgb('#3e2512'); // foot grime / shaded brown

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const TOP_W = 0.95; // top square side
const TOP_T = 0.07; // top thickness
const TOP_Y0 = 0.53; // underside of the top
const TOP_BEVEL = 0.014; // soft edge bevel
const PLANKS = 5; // plank divisions across the top (running along X)

const LEG_S = 0.08; // square leg cross-section
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
    // Four planks along X with gaps, rounded ends, worn center, dark knots.
    const PW = (TOP_W - 3 * GAP) / 4;
    const plankZ = (i: number) => -TOP_W / 2 + PW / 2 + i * (PW + GAP);
    const planks = [0, 1, 2, 3].map((i) =>
      sdf
        .box([TOP_W - 0.004 * (i % 2) * 2, TOP_T, PW], 0.02)
        .at(0, TOP_Y0 + TOP_T / 2, plankZ(i)),
    );
    const topShape = sdf.union(...planks);

    const plankOf = (z: number) =>
      Math.min(3, Math.max(0, Math.floor((z + TOP_W / 2) / (PW + GAP))));
    const KNOTS: [number, number, number, number][] = [
      [-0.22, 0.0, 1, 0.03],
      [0.25, 0.0, 2, 0.025],
      [0.05, 0.0, 0, 0.022],
    ];
    const knotAmt = (x: number, z: number) => {
      let m = 0;
      for (const [kx, , pi, r] of KNOTS) {
        const dx = (x - kx) / (r * 1.8);
        const dz = (z - plankZ(pi)) / r;
        m = Math.max(m, 1 - smoothstep(0.6, 1, Math.sqrt(dx * dx + dz * dz)));
      }
      return m;
    };

    const topPaint = (x: number, y: number, z: number) => {
      const idx = plankOf(z);
      const grain = noise.fbm(x * 4, y * 7, z * 34, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
      let c = mixRgb(TOP, TOP_DARK, 0.06 + 0.16 * noise.random(idx, 3, 9));
      c = mixRgb(c, TOP_DARK, 0.22 * patch);
      c = mixRgb(c, PALE, 0.1 * (0.5 + 0.5 * grain));
      // Lighter worn center.
      const r = Math.hypot(x, z);
      c = mixRgb(c, PALE, 0.4 * (1 - smoothstep(0.1, 0.38, r)));
      // Dark plank sides near the gaps.
      const f = (z + TOP_W / 2) / (PW + GAP) - Math.floor((z + TOP_W / 2) / (PW + GAP));
      const edgeD = Math.min(f, 1 - f) * (PW + GAP);
      c = mixRgb(c, TOP_DARK, 0.5 * (1 - smoothstep(0.004, 0.02, edgeD)));
      c = mixRgb(c, KNOT, 0.9 * knotAmt(x, z));
      const edge = Math.abs(x);
      c = mixRgb(c, TOP_DARK, 0.55 * smoothstep(0.43, 0.47, edge));
      return c;
    };

    k.body('top', topShape.paintFn(topPaint), {
      color: '#b07a45',
      roughness: 0.78,
      metalness: 0,
      detail: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 5000,
      bump: (x, y, z) => {
        const g = noise.fbm(x * 4, y * 7, z * 40, 2);
        const ring = Math.sin((z + 0.3 * noise.fbm(x * 3, 0, z * 3, 2)) * 220);
        return 0.0012 * g + 0.0008 * ring - 0.002 * knotAmt(x, z);
      },
    });

    // ------------------------------------------------------- legs + stretcher
    // Four chunky square legs slightly inset from the corners, joined by a low
    // rectangular stretcher frame whose bars run into the legs.
    const legAt = (sx: number, sz: number) =>
      sdf.box([LEG_S, LEG_H, LEG_S], 0.012).at(sx * LEG_X, LEG_H / 2, sz * LEG_X);
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

    // Apron: 0.07 tall, 0.03 thick boards under the top edge, joining the legs.
    const APR_Y = TOP_Y0 - 0.035;
    const L2 = 2 * LEG_X + LEG_S;
    const brackets = [-1, 1].flatMap((s) => [
      sdf.box([L2, 0.07, 0.03], 0.008).at(0, APR_Y, s * LEG_X),
      sdf.box([0.03, 0.07, L2], 0.008).at(s * LEG_X, APR_Y, 0),
    ]);
    const cleats = [-LEG_X, LEG_X].map((z) =>
      sdf.box([2 * LEG_X + LEG_S, 0.04, 0.06], 0.01).at(0, TOP_Y0 - 0.02, z),
    );
    const frame = sdf
      .union(legAt(1, 1), legAt(-1, 1), legAt(1, -1), legAt(-1, -1))
      .smoothUnion(0.01, barX(1), barX(-1), barZ(1), barZ(-1), ...brackets, ...cleats);

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
      color: '#6a4424',
      roughness: 0.84,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 3000,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 26, y * 4, z * 26, 2),
    });
  },
});
