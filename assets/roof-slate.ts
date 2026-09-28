import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — slate roof panel (architecture/building-parts/roof-slate).
 *
 * Role: modular village building part, 2 x 2 m; sits on wall tops or stands alone in the kit,
 *   paired with roof-thatch in the same catalog.
 * Size: slab 2.0 m along X, 2.0 m down the slope at a 35 degree pitch, 0.08 m thick; the eave
 *   bottom edge rests on y = 0 at +Z, the ridge underside reaches y ~ 1.15 at -Z, the ridge cap
 *   crests at ~1.32 m.
 * One idea: six chunky pillow courses of grey-blue slate stepping down the slope, each tile
 *   reading as a rounded pebble, under a fat half-round ridge cap.
 * Shape language: round dominant (pillow tiles, soft ridge roll), square secondary (the thin
 *   straight slab and the straight course lines).
 * Palette (60/30/10): slate grey-blue #8ea3b7 dominant, deep slate #6d8399 shade bands, dark
 *   seams #515f6e, weathered light #aebfd0 on crowns and the ridge cap. Accent: muted moss
 *   #6a9a52 tucked in the eave seams.
 * Materials: one matte slate body (roughness 0.85), one ridge cap body (0.8). Tile seams,
 *   per-tile domes and grain live in bump and paint, not displacement; moss is eave paint.
 * Detail: primary slab; secondary courses, rake rolls, ridge cap; tertiary seams and grain.
 *   Focal point: the ridge cap.
 * Rig/animation: none (static building part).
 */

const W = 2.0; // width along X
const SLOPE = 2.0; // slab length down the slope
const THICK = 0.08; // slab thickness, perpendicular to the slope
const PITCH_DEG = 35;

const PITCH = (PITCH_DEG * Math.PI) / 180;
const SIN = Math.sin(PITCH);
const COS = Math.cos(PITCH);
/** Lift that puts the eave bottom edge exactly on y = 0 (a hair low to survive reduction). */
const LIFT = (SLOPE / 2) * SIN + (THICK / 2) * COS - 0.01;
/** Ridge top-edge corner (slab-local y = +THICK/2, z = -SLOPE/2) in world space. */
const RIDGE_Y = LIFT + (THICK / 2) * COS + (SLOPE / 2) * SIN;
const RIDGE_Z = (THICK / 2) * SIN - (SLOPE / 2) * COS;

/** Distance in meters measured down the slope from the ridge top edge (0 at ridge, 2 at eave). */
const downSlope = (y: number, z: number) => (RIDGE_Y - y) * SIN + (z - RIDGE_Z) * COS;

/** Tile courses: pillow ribs in slab-local z (ridge -1 ... eave +1). */
const ROW_H = 0.39; // course spacing down the slope
const ROW0 = 0.24; // down-slope position of the first course centre
const N_ROWS = 5;
const RIB_LEN = 0.48;
const RIB_H = 0.12;
const RIB_PROUD = [0.042, 0.038, 0.045, 0.04, 0.05];
const ribZ = (i: number) => ROW0 + i * ROW_H - SLOPE / 2;

const TW = 0.4; // tile width along X
const STAGGER = 0.2; // half-tile offset on odd courses

/** Shadow line under each course overlap, measured down the slope. */
const creaseAt = (i: number) => ROW0 + i * ROW_H + 0.25;
const distToCrease = (s: number) => {
  let d = 10;
  for (let i = 0; i < N_ROWS - 1; i++) d = Math.min(d, Math.abs(s - creaseAt(i)));
  return d;
};

const C = {
  slate: rgb('#8499ad'),
  slateLight: rgb('#a3b6c7'),
  slateDeep: rgb('#65798e'),
  slateDark: rgb('#4b5866'),
  soffit: rgb('#414f5a'),
  moss: rgb('#63924b'),
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mod = (v: number, m: number) => ((v % m) + m) % m;
const sstep = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Tile cell at a surface point: row, staggered column, distances to seam and course centre. */
const tileCell = (x: number, s: number) => {
  const u = x + W / 2;
  const row = Math.round((s - ROW0) / ROW_H);
  const stagger = mod(row, 2) === 1 ? STAGGER : 0;
  const v = u - stagger;
  const col = Math.floor(v / TW);
  const b = v - col * TW;
  return {
    row,
    col,
    u,
    seam: Math.min(b, TW - b),
    du: v - (col + 0.5) * TW,
    ds: s - (ROW0 + row * ROW_H),
  };
};

/** Slate relief: seam grooves, crease groove, per-tile domes, fine grain. Normal map only. */
const slateBump = (x: number, y: number, z: number) => {
  const s = downSlope(y, z);
  const { seam, du, ds } = tileCell(x, s);
  let h = 0;
  h -= 0.0022 * (1 - sstep(0.008, 0.028, seam));
  h -= 0.002 * (1 - sstep(0.012, 0.045, distToCrease(s)));
  const dome = 1 - (ds * ds) / 0.0361 - (du * du) / 0.0324;
  h += 0.0024 * Math.max(0, dome);
  h += 0.0012 * noise.fbm(x * 26, s * 7, 3.3, 3, 11);
  return h;
};

/** Slate color: per-tile tint, lit crowns, dark seams, course shadows, moss at the eave. */
const slatePaint = (x: number, y: number, z: number): Rgb => {
  const s = downSlope(y, z);
  const { row, col, u, seam, du, ds } = tileCell(x, s);
  const trow = Math.max(0, row);
  const tint = noise.random(col * 3 + 11, trow * 7 + 3);
  const grain = noise.fbm(x * 24, s * 6, 3.3, 3, 11);
  const patch = noise.fbm(x * 3.2, y * 3.2, z * 3.2, 2, 17);
  const edgeFade = sstep(0.02, 0.09, Math.min(u, W - u));

  let c = mixRgb(C.slate, C.slateDeep, 0.45 + 0.3 * tint);
  c = mixRgb(c, C.slateDark, 0.36 * clamp01(0.5 - 0.6 * grain));
  c = mixRgb(c, C.slateLight, 0.13 * clamp01(0.4 + 0.5 * grain));
  const crown = clamp01(1 - Math.abs(ds) / 0.16) * clamp01(1 - Math.abs(du) / (TW * 0.42));
  c = mixRgb(c, C.slateLight, 0.08 * crown);
  c = mixRgb(c, C.slateDeep, 0.15 * patch);
  c = mixRgb(c, C.slateDark, 0.6 * edgeFade * (1 - sstep(0.03, 0.065, seam)));
  c = mixRgb(c, C.slateDark, 0.62 * (1 - sstep(0.035, 0.085, distToCrease(s))));
  c = mixRgb(c, C.slateDark, 0.4 * (1 - sstep(0.04, 0.1, s))); // under the ridge cap
  c = mixRgb(c, C.slateDark, 0.45 * sstep(1.92, 2.04, s)); // eave drip strip
  const moss = noise.fbm(x * 5.5, s * 5.5, 2.2, 2, 23);
  const mossBand =
    sstep(0.9, 1.25, s) *
    (0.4 + 0.6 * (1 - sstep(0.025, 0.06, seam)) + 0.5 * (1 - sstep(0.03, 0.08, distToCrease(s))));
  c = mixRgb(c, C.moss, clamp01(mossBand) * 0.5 * sstep(0.28, 0.55, moss));
  return c;
};

/** Weathered, slightly lighter ridge cap with faint section seams. */
const ridgePaint = (x: number, y: number, z: number): Rgb => {
  const band = noise.fbm(x * 3, y * 3, z * 3, 2, 29);
  const wear = noise.fbm(x * 18, y * 18, z * 8, 2, 31);
  let c = mixRgb(C.slate, C.slateLight, 0.12 + 0.1 * clamp01(0.5 + 0.5 * band));
  c = mixRgb(c, C.slateDeep, 0.24 * clamp01(0.5 - 0.5 * wear));
  const p = mod(x + 0.19, 0.4);
  c = mixRgb(c, C.slateDark, 0.28 * (1 - sstep(0.025, 0.06, Math.min(p, 0.4 - p))));
  return c;
};

const ridgeBump = (x: number, y: number, z: number) => {
  const p = mod(x + 0.19, 0.4);
  return (
    -0.0016 * (1 - sstep(0.006, 0.018, Math.min(p, 0.4 - p))) +
    0.0009 * noise.fbm(x * 24, y * 24, z * 10, 2, 35)
  );
};

export default defineAsset({
  name: 'roof-slate',
  description:
    'Slate roof panel: six overlapping courses of rounded grey-blue tiles on a thin sloped slab, with a half-round ridge cap and a touch of moss.',
  reference: 'docs/item-mockups/roof-slate-mock.jpg',
  detail: 0.016,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------- slab + tile courses
    // Thin slab cut square to the 35 degree slope; eave bottom edge on y = 0 at +Z.
    const slab = sdf.box([W, THICK, SLOPE], 0.02).rotateX(PITCH_DEG).at(0, LIFT, 0);

    // One pillow rib per course, blended softly into the slab so the tiles read as
    // rounded overlapping slates; the tile seams are painted and bumped, not cut.
    const ribs = RIB_PROUD.map((proud, i) =>
      sdf
        .box([W - 0.05, RIB_H, RIB_LEN], 0.05)
        .at(0, THICK / 2 + proud, ribZ(i))
        .rotateX(PITCH_DEG)
        .at(0, LIFT, 0),
    );

    // Rounded gable rake roll following each sloped side edge, bulging just past the
    // slab face so the side silhouette stops being a bare plank.
    const rake = [-1, 1].map((side) =>
      sdf.chain(
        [0.12, 0.42, 0.72, 1.02, 1.32, 1.62, 1.9].map((t, i) => [
          side * (W / 2 + 0.008),
          LIFT - (t - 1) * SIN,
          (t - 1) * COS,
          0.034 + 0.006 * noise.random(i, side > 0 ? 27 : 29),
        ]),
        0.012,
      ),
    );

    // Dark shaded soffit: the underside and the lower half of the eave edge.
    const underStencil = sdf
      .box([W - 0.02, 0.06, SLOPE])
      .at(0, -0.03, 0)
      .rotateX(PITCH_DEG)
      .at(0, LIFT, 0);

    let slate = sdf.smoothUnion(0.035, slab, ...ribs);
    for (const edge of rake) slate = sdf.smoothUnion(0.02, slate, edge);

    k.body('slate', slate.paintFn(slatePaint).paintWhere(underStencil, C.soffit, 0.04), {
      color: C.slate,
      roughness: 0.85,
      metalness: 0,
      detail: 0.026,
      textureDensity: 2,
      maxError: 0.009,
      maxTriangles: 3200,
      bump: slateBump,
    });

    // ------------------------------------------------------------------ ridge cap
    // Plump half-round cap, seated just past the ridge top edge so it nests in.
    const ROLL_R = 0.115;
    const ROLL_SEAT = -0.012;
    const ROLL_Y = RIDGE_Y + ROLL_SEAT * COS;
    const ROLL_Z = RIDGE_Z + ROLL_SEAT * SIN;
    const roll = sdf.capsule(
      [-W / 2, ROLL_Y, ROLL_Z],
      [W / 2, ROLL_Y, ROLL_Z],
      ROLL_R,
    );
    k.body('ridge-cap', roll.paintFn(ridgePaint), {
      color: C.slate,
      roughness: 0.8,
      metalness: 0,
      detail: 0.02,
      maxError: 0.004,
      maxTriangles: 480,
      bump: ridgeBump,
    });
  },
});
