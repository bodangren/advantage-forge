import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — thatched roof section (architecture/building-parts/roof-thatch).
 *
 * Role: modular village building part, 2 m wide; sits on wall tops or stands alone in the kit.
 * Size: slab 2.0 m along X, 1.4 m down the slope, 0.25 m thick; eave bottom edge rests on
 *   y = 0 at +Z, ridge underside reaches y = 1.0 at -Z; the ridge roll crests at ~1.32 m.
 * One idea: one fat slab of combed straw with four rolled courses stepping down the slope, a
 *   scalloped straw skirt drooping over the eave, and a plump pale ridge roll lashed with rope.
 * Shape language: round dominant (pillowy ribs, drooping skirt, soft ridge roll), square
 *   secondary (the straight slab and its course lines).
 * Palette (60/30/10): straw #e0bb60 dominant, pale roll #c9a06a, warm brown rope #8a5a35,
 *   deep straw #c09747 shadows, dark soffit #a5763a. Accent: the pale ridge roll.
 * Materials: one matte straw body (roughness 0.88), one pale roll body (0.8), one rope body
 *   (0.75). Straw strands, course shading and the shaded soffit live in bump and paint.
 * Detail: primary slab; secondary courses, skirt, roll, lashings; tertiary combed strands.
 *   Focal point: the ridge roll.
 * Rig/animation: none (static building part).
 */

const W = 2.0; // width along X
const SLOPE = 1.4; // slab length down the slope
const THICK = 0.25; // slab thickness, perpendicular to the slope
const RISE = 1.0; // vertical rise from eave to ridge

const PITCH = Math.asin(RISE / SLOPE); // ~45.6 degrees
const PITCH_DEG = (PITCH * 180) / Math.PI;
const SIN = Math.sin(PITCH);
const COS = Math.cos(PITCH);
/** Lift that puts the eave bottom edge exactly on y = 0. */
const LIFT = (SLOPE / 2) * SIN + (THICK / 2) * COS;
/** Ridge top-edge corner (slab-local y = +THICK/2, z = -SLOPE/2) in world space. */
const RIDGE_Y = LIFT + (THICK / 2) * COS + (SLOPE / 2) * SIN;
const RIDGE_Z = (THICK / 2) * SIN - (SLOPE / 2) * COS;

/** Plump pale ridge roll, seated just past the ridge corner so it nests into the roof. */
const ROLL_R = 0.13;
const ROLL_SEAT = -0.012; // roll centre relative to the ridge top edge, along the surface normal
const ROLL_Y = RIDGE_Y + ROLL_SEAT * COS;
const ROLL_Z = RIDGE_Z + ROLL_SEAT * SIN;

/** Distance in meters measured down the slope from the ridge top edge (0 at ridge, 1.4 at eave). */
const downSlope = (y: number, z: number) => (RIDGE_Y - y) * SIN + (z - RIDGE_Z) * COS;

const ROW_H = 0.32; // course spacing down the slope
/** Course rib centres in slab-local slope coordinate (local z: -0.7 ridge, +0.7 eave). */
const RIBS = [-0.52, -0.2, 0.12, 0.44];
/** How far each rib sits proud of the slab surface (slab-local normal offset). */
const RIB_PROUD = [0.062, 0.052, 0.065, 0.055];

const C = {
  straw: rgb('#e0bb60'),
  strawLight: rgb('#f0d488'),
  strawDeep: rgb('#c09747'),
  strawDark: rgb('#9a7434'),
  soffit: rgb('#a5763a'),
  roll: rgb('#c9a06a'),
  rollLight: rgb('#e2c08c'),
  rollDark: rgb('#a37b40'),
  rope: rgb('#8a5a35'),
  ropeLight: rgb('#a97a4a'),
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Smooth 0 -> 1 ramp between e0 and e1. */
const sstep = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Long combed strokes running down the slope, plus fine fleck. Normal-map only, in meters. */
const strawBump = (x: number, y: number, z: number) => {
  const s = downSlope(y, z);
  return (
    0.0042 * noise.fbm(x * 28, s * 5.5, 4.2, 3, 11) +
    0.0012 * noise.fbm(x * 55, y * 55, z * 55, 2, 5)
  );
};

/** Straw color: strand strokes, per-course tint, sun-bleached ridge, grubby skirt, dark soffit. */
const strawPaint = (x: number, y: number, z: number): Rgb => {
  const s = downSlope(y, z);
  const rowTint = noise.random(Math.floor(s / ROW_H) * 7 + 1, 31);
  const strand = noise.fbm(x * 26, s * 5, 4.2, 3, 11);
  const patch = noise.fbm(x * 3.5, y * 3.5, z * 3.5, 2, 17);

  let c = mixRgb(C.straw, C.strawDeep, 0.3 + 0.4 * rowTint);
  c = mixRgb(c, C.strawDark, 0.3 * clamp01(0.5 - 0.5 * strand));
  c = mixRgb(c, C.strawLight, 0.26 * clamp01(0.5 + 0.5 * strand));
  c = mixRgb(c, C.strawDeep, 0.16 * patch);
  c = mixRgb(c, C.strawLight, 0.22 * (1 - sstep(0.15, 0.7, s))); // pale near the ridge
  c = mixRgb(c, C.strawDark, 0.2 * sstep(1.2, 1.45, s)); // grubby eave skirt
  return c;
};

/** Loose wrap-strand relief on the ridge roll. */
const rollBump = (x: number, y: number, z: number) => {
  const a = Math.atan2(z - ROLL_Z, y - ROLL_Y);
  return 0.0016 * noise.fbm(x * 26, a * 11, 0.5, 2, 41);
};

const rollPaint = (x: number, y: number, z: number): Rgb => {
  const wrap = noise.fbm(x * 22, (y + z) * 16, 2.5, 2, 41);
  const strand = noise.fbm(x * 40, (y + z) * 30, 1.5, 2, 43);
  let c = mixRgb(C.roll, C.rollLight, 0.16 + 0.2 * clamp01(0.5 + 0.5 * wrap));
  c = mixRgb(c, C.rollDark, 0.24 * clamp01(0.5 - 0.5 * strand));
  return c;
};

export default defineAsset({
  name: 'roof-thatch',
  description:
    'Thatched roof section: a sloped straw slab with combed courses, a scalloped eave skirt and a lashed ridge roll.',
  reference: 'docs/item-mockups/roof-thatch-mock.jpg',
  detail: 0.016,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ straw slab + courses
    // Slab cut square to a ~46 degree slope; eave bottom edge on y = 0 at +Z.
    const slab = sdf.box([W, THICK, SLOPE], 0.045)
      .rotateX(PITCH_DEG)
      .at(0, LIFT, 0);

    // Rolled course ribs lying on the top surface, one per course row: plump pillows
    // blended softly into the slab so they read as rolled straw layers.
    const ribs = RIBS.map((s, i) =>
      sdf.box([W - 0.06, 0.13, 0.36], 0.045)
        .at(0, THICK / 2 + RIB_PROUD[i], s)
        .rotateX(PITCH_DEG)
        .at(0, LIFT, 0),
    );

    // Scalloped straw skirt: big overlapping lobes drooping from the eave tip to y ~ 0,
    // blended into one continuous fringe with an even bottom line.
    const skirt: ReturnType<typeof sdf.capsule>[] = [];
    for (let i = 0; i < 9; i++) {
      const x = -0.84 + i * 0.21 + (noise.random(i, 3) - 0.5) * 0.03;
      const r = 0.07 + 0.009 * noise.random(i, 7);
      const z = 0.5 + 0.03 * noise.random(i, 11);
      const drop = r + 0.014 + 0.006 * noise.random(i, 13);
      skirt.push(
        sdf.capsule(
          [x + (noise.random(i, 17) - 0.5) * 0.02, 0.18, z + 0.04],
          [x, drop, z - 0.012],
          r,
        ),
      );
    }

    // Rolled gable rake: one blended straw roll following each sloped side edge, bulging
    // just past the slab face so the side silhouette stops being a bare plank.
    const rake = [-1, 1].map((side) =>
      sdf.chain(
        [0.15, 0.4, 0.65, 0.9, 1.15, 1.38].map((t, i) => [
          side * (W / 2 + (i % 2 === 0 ? 0.015 : 0.04)),
          RIDGE_Y - t * SIN,
          RIDGE_Z + t * COS,
          0.052 + 0.014 * noise.random(i, side > 0 ? 27 : 29),
        ]),
        0.012,
      ),
    );

    // Dark shaded soffit: the underside band and the down-facing eave face.
    const underStencil = sdf.box([W - 0.04, 0.11, SLOPE - 0.04])
      .at(0, -THICK / 2 + 0.055, 0)
      .rotateX(PITCH_DEG)
      .at(0, LIFT, 0);

    const straw = slab;
    let strawShape = sdf.smoothUnion(0.012, straw, ...ribs);
    for (const tuft of skirt) strawShape = sdf.smoothUnion(0.022, strawShape, tuft);
    for (const edge of rake) strawShape = sdf.smoothUnion(0.015, strawShape, edge);

    k.body(
      'straw',
      strawShape.paintFn((x, y, z) => strawPaint(x, y, z)).paintWhere(underStencil, C.soffit, 0.015),
      {
        color: C.straw,
        roughness: 0.88,
        metalness: 0,
        detail: 0.026,
        textureDensity: 2,
        maxError: 0.005,
        maxTriangles: 3200,
        bump: strawBump,
      },
    );

    // ------------------------------------------------------------------- ridge roll
    const roll = sdf.capsule(
      [-W / 2 - 0.05, ROLL_Y, ROLL_Z],
      [W / 2 + 0.05, ROLL_Y, ROLL_Z],
      ROLL_R,
    );
    k.body('ridge-roll', roll.paintFn(rollPaint), {
      color: C.roll,
      roughness: 0.8,
      metalness: 0,
      detail: 0.024,
      maxTriangles: 700,
      bump: rollBump,
    });

    // ------------------------------------------------------------------- rope lashings
    // Two ropes cinched around the roll, holding the ridge together.
    const ropes = [-0.62, 0.62].map((x) =>
      sdf.torus(ROLL_R + 0.005, 0.015)
        .rotateZ(90)
        .at(x, ROLL_Y, ROLL_Z),
    );
    k.body('lashing', sdf.union(...ropes), {
      color: C.rope,
      roughness: 0.75,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 260,
    });
  },
});
