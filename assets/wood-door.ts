import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/building-parts/wood-door
 *
 * Role: the standalone door module for the 2 m plaster-and-timber wall tiles; it fills
 *   the 0.85 x 1.2 m doorway and must read at 128 px. Background building part.
 * Size: frame 0.97 wide x 1.28 tall x 0.14 deep; leaf 0.80 x 1.19 x 0.05.
 *   Stands on y = 0, centred on x = 0, front face toward +Z.
 * One idea: a chunky hand-hewn dark walnut frame around a warm honey-oak plank door —
 *   the iron strap hinges and ring handle are the readable accents.
 * Shape language: square, sturdy carpentry (dominant) with soft rounded bevels everywhere.
 * Palette: walnut #6b4226 / deep #54331d (dark frame, dominant), honey oak #b5814a with
 *   warm brown #8a5a35 and pale cut wood #c9a06a planks (focal), black iron #35393e.
 * Materials: walnut frame (0.8), oak leaf + Z brace (0.78), pale threshold (0.85),
 *   black iron (0.5, metalness 0.75).
 * Detail list: frame posts + lintel + sill (big); plank leaf with grooves, Z brace on
 *   the back, strap hinges with rivets, ring handle (medium); grain, worn threshold (small).
 * Rig/animation: none — a closed door, a static building part.
 */

const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#7d5433');
const OAK = rgb('#b5814a');
const OAK_PLANK = rgb('#8a5a35');
const OAK_PALE = rgb('#c9a06a');
const OAK_DARK = rgb('#6e4526');
const IRON = rgb('#35393e');
const IRON_DARK = rgb('#24272b');
const IRON_LIGHT = rgb('#565c63');

// ---------------------------------------------------------------- layout
const FRAME_W = 0.97; // frame outer width
const FRAME_H = 1.28; // frame outer height
const FRAME_D = 0.14; // frame depth
const POST_W = 0.06; // jamb post width; clear opening = 0.97 - 2 * 0.06 = 0.85
const SILL_H = 0.04; // sill + lintel band height; clear opening = 1.28 - 2 * 0.04 = 1.2

const LEAF_W = 0.8; // door leaf width (15 mm clearance each side of the opening)
const LEAF_BOT = 0.045;
const LEAF_TOP = 1.235; // leaf sits between sill top (0.04) and lintel bottom (1.24)
const LEAF_T = 0.05;
const LEAF_Z = 0.02; // leaf centre; front face at 0.045, recessed 25 mm in the frame
const PLANK_W = 0.14; // vertical plank pitch; half-pitch offset keeps edge planks whole

const HINGE_X = -0.398; // hinge line, at the leaf's left edge
const STRAP_YS = [0.34, 0.94]; // strap hinge heights
const HANDLE_X = 0.3; // ring handle, 0.1 in from the free edge

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Plank cell coordinate of a point on the leaf: boundaries at k + 0.5, edges mid-plank. */
const plankCell = (x: number): number => (x + PLANK_W / 2) / PLANK_W;
/** 1 inside a plank gap, 0 mid plank. */
const plankGap = (x: number): number => {
  const f = plankCell(x) - Math.floor(plankCell(x));
  return smoothstep(0.1, 0.025, Math.min(f, 1 - f));
};

// ---------------------------------------------------------------- paints
const walnutPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const g = noise.fbm(x * 26, y * 7, z * 26, 3, 5);
  let c = mixRgb(WALNUT, WALNUT_DEEP, 0.45 + clamp01(-g) * 0.3);
  c = mixRgb(c, WALNUT_LIGHT, clamp01(g) * 0.08);
  c = mixRgb(c, WALNUT_DEEP, smoothstep(0.34, 0.02, y) * 0.35);
  return c;
};

const oakPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const i = Math.floor(plankCell(x));
  const tint = noise.random(i, 9, 4);
  let c = mixRgb(OAK, OAK_PLANK, 0.1 + 0.34 * tint);
  c = mixRgb(c, OAK_PALE, 0.62 * Math.max(0, tint - 0.5)); // the pale planks
  const grain = noise.fbm(x * 40, y * 4, z * 40, 3, 8);
  c = mixRgb(c, OAK_DARK, clamp01(-grain) * 0.26);
  c = mixRgb(c, OAK_PALE, clamp01(grain) * 0.2);
  c = mixRgb(c, OAK_DARK, plankGap(x) * 0.9);
  c = mixRgb(c, OAK_PLANK, smoothstep(0.3, 0.05, y) * 0.15);
  c = mixRgb(c, OAK_PLANK, smoothstep(0.34, 0.42, x) * 0.2); // shaded free edge
  return c;
};

const oakBump = (x: number, y: number, z: number): number =>
  -0.0022 * plankGap(x) + 0.0009 * noise.fbm(x * 50, y * 5, z * 50, 3, 12);

const bracePaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const grain = noise.fbm(x * 30, y * 6, z * 30, 3, 8);
  let c = mixRgb(OAK_PLANK, OAK_DARK, 0.22);
  c = mixRgb(c, OAK, clamp01(grain) * 0.15);
  c = mixRgb(c, OAK_DARK, clamp01(-grain) * 0.3);
  c = mixRgb(c, OAK_PALE, clamp01(grain) * 0.1);
  return c;
};

const sillPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const g = noise.fbm(x * 22, y * 10, z * 22, 3, 6);
  let c = mixRgb(OAK_PALE, OAK, clamp01(-g) * 0.25);
  c = mixRgb(c, OAK_DARK, smoothstep(0.02, 0.004, y) * 0.3); // worn ground edge
  return c;
};

const ironPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = noise.fbm(x * 60, y * 60, z * 60, 2, 9);
  let c = mixRgb(IRON, IRON_DARK, clamp01(-n) * 0.35);
  c = mixRgb(c, IRON_LIGHT, clamp01(n) * 0.25);
  return c;
};

// Rivet heads painted onto the straps: three per strap, dark dots.
const RIVET_XS = [0.05, 0.14, 0.23]; // offsets from the strap start (hinge edge)
const hingePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  let c = ironPaint(x, y, z, base);
  for (const sy of STRAP_YS) {
    for (const rx of RIVET_XS) {
      const d = Math.hypot(x - (HINGE_X + 0.008 + rx), y - sy);
      if (d < 0.01) {
        c = mixRgb(c, IRON_DARK, smoothstep(0.01, 0.004, d) * 0.85);
        return c;
      }
    }
  }
  return c;
};

// ---------------------------------------------------------------- build
export default defineAsset({
  name: 'wood-door',
  description:
    'Standalone cottage door with its frame: a chunky dark walnut frame around a closed ' +
    'honey-oak plank door with shallow grooves, two black iron strap hinges, a ring ' +
    'handle, and a Z brace on the back face; fills the 0.85 x 1.2 m wall doorway.',
  detail: 0.012,
  reference: 'docs/item-mockups/wood-door-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ walnut frame
    // Two jamb posts, a lintel and a sill; all one walnut body. The rounded box edges
    // read as carpentry joints where the boxes meet.
    const B = (w: number, h: number, d: number, r: number, x: number, y: number): Sdf =>
      sdf.box([w, h, d], r).at(x, y, 0);
    const postX = FRAME_W / 2 - POST_W / 2; // 0.455
    const frame = sdf.union(
      B(POST_W, FRAME_H, FRAME_D, 0.016, -postX, FRAME_H / 2),
      B(POST_W, FRAME_H, FRAME_D, 0.016, postX, FRAME_H / 2),
      B(FRAME_W, SILL_H, FRAME_D, 0.014, 0, SILL_H / 2),
      B(FRAME_W, SILL_H, FRAME_D, 0.014, 0, FRAME_H - SILL_H / 2),
    );
    k.body('frame', frame.paintFn(walnutPaint), {
      color: WALNUT_DEEP,
      roughness: 0.8,
      detail: 0.012,
      maxError: 0.003,
      maxTriangles: 1500,
      paintWeight: 2,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 30, y * 8, z * 30, 3, 7),
    });

    // ------------------------------------------------------------------ pale threshold
    // A worn pale cut-wood step across the opening, slightly proud of the frame front.
    const threshold = sdf.box([FRAME_W - 0.04, 0.032, FRAME_D + 0.02], 0.008).at(0, 0.016, 0.012);
    k.body('threshold', threshold.paintFn(sillPaint), {
      color: OAK_PALE,
      roughness: 0.85,
      detail: 0.008,
      maxError: 0.002,
      maxTriangles: 250,
      paintWeight: 1,
    });

    // ------------------------------------------------------------------ plank door leaf
    const leaf = sdf
      .box([LEAF_W, LEAF_TOP - LEAF_BOT, LEAF_T], 0.012)
      .at(0, (LEAF_TOP + LEAF_BOT) / 2, LEAF_Z);
    k.body('door-leaf', leaf.paintFn(oakPaint), {
      color: OAK,
      roughness: 0.78,
      detail: 0.01,
      maxError: 0.0025,
      maxTriangles: 1400,
      textureDensity: 2,
      paintWeight: 2,
      bump: oakBump,
    });

    // ------------------------------------------------------------------ Z brace (back face)
    // Top and bottom ledgers plus a diagonal from the hinge-side top to the free-side
    // bottom, so the brace reads as a Z from behind. Blended joints, chunky battens.
    const battenH = 0.085;
    const braceZ = LEAF_Z - LEAF_T / 2 - 0.01; // battens protrude from the leaf back
    const top = sdf.box([0.74, battenH, 0.03], 0.01).at(0, 1.1, braceZ);
    const bottom = sdf.box([0.74, battenH, 0.03], 0.01).at(0, 0.22, braceZ);
    const DIAG_LEN = 1.16;
    const DIAG_ANG = (-Math.atan2(1.1 - 0.22, 0.72) * 180) / Math.PI; // -50.7 deg
    const diagonal = sdf
      .box([DIAG_LEN, battenH, 0.03], 0.01)
      .rotateZ(DIAG_ANG)
      .at(0, 0.66, braceZ);
    k.body('door-brace', top.smoothUnion(0.008, bottom, diagonal).paintFn(bracePaint), {
      color: OAK_PLANK,
      roughness: 0.78,
      detail: 0.009,
      maxError: 0.0025,
      maxTriangles: 700,
      paintWeight: 1,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 8, z * 40, 3, 9),
    });

    // ------------------------------------------------------------------ iron strap hinges (front, left)
    const strap = (sy: number): Sdf =>
      sdf
        .extrude(
          profile.polygon([
            [0, -0.046],
            [0.27, -0.032],
            [0.31, -0.016],
            [0.31, 0.016],
            [0.27, 0.032],
            [0, 0.046],
          ]),
          0.014,
          0.004,
        )
        .at(HINGE_X + 0.008, sy, LEAF_Z + LEAF_T / 2 + 0.007);
    const barrel = (sy: number): Sdf =>
      sdf.cylinder(0.019, 0.11, 0.005).at(HINGE_X, sy, LEAF_Z + 0.01);
    const rivet = (dx: number, sy: number): Sdf =>
      sdf.sphere(0.009).at(HINGE_X + 0.008 + dx, sy, LEAF_Z + LEAF_T / 2 + 0.015);
    k.body(
      'door-hinges',
      sdf
        .union(
          ...STRAP_YS.map(strap),
          ...STRAP_YS.map(barrel),
          ...STRAP_YS.flatMap((sy) => RIVET_XS.map((dx) => rivet(dx, sy))),
        )
        .paintFn(ironPaint),
      {
        color: IRON,
        roughness: 0.5,
        metalness: 0.75,
        detail: 0.005,
        maxError: 0.0015,
        maxTriangles: 1100,
        bump: (x, y, z) => 0.0008 * noise.fbm(x * 50, y * 50, z * 50, 2, 11),
      },
    );

    // ------------------------------------------------------------------ iron ring handle (front, right)
    const bossZ = LEAF_Z + LEAF_T / 2;
    const handle = sdf.union(
      sdf.cylinder(0.023, 0.014).rotateX(90).at(HANDLE_X, 0.72, bossZ + 0.007),
      sdf.torus(0.04, 0.01).rotateX(90).at(HANDLE_X, 0.672, bossZ + 0.021),
    );
    k.body('door-handle', handle.paintFn(ironPaint), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.75,
      detail: 0.005,
      maxError: 0.0015,
      maxTriangles: 500,
    });
  },
});
