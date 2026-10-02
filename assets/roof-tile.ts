import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — clay tile roof section (architecture/building-parts/roof-tile).
 *
 * Role: modular village building part, 2 m wide; sits on wall tops or stands alone in the kit.
 * Size: deck slab 2.0 m along X, 1.4 m down the slope, 0.09 m thick; eave bottom edge rests on
 *   y = 0 at +Z, ridge underside reaches y = 1.0 at -Z; ridge caps crest near 1.2 m.
 * One idea: four fat courses of rounded terracotta pantiles stepping up the slope, each lip a
 *   plump wavy roll, crowned by a row of chunky half-round ridge caps.
 * Shape language: round dominant (pillow tiles, rolled lips, round caps), square secondary
 *   (the straight deck slab and the course lines).
 * Palette (60/30/10): terracotta #b8584a dominant, honey oak deck #b5814a secondary,
 *   deep clay #8a3e33 shadows, pale cut fascia #c9a06a, moss #5cb85c accent (tiny).
 * Materials: one clay tile body (roughness 0.72), one oak deck body (0.8), one cap body (0.7).
 * Detail: primary tile field; secondary course lips and ridge caps; tertiary clay speckle,
 *   moss patches, plank lines on the soffit. Focal point: the stepped wavy courses.
 * Rig/animation: none (static building part).
 */

const W = 2.0; // width along X
const SLOPE = 1.4; // length down the slope
const THICK = 0.09; // deck thickness, perpendicular to the slope
const RISE = 1.0; // vertical rise from the eave to the ridge

const PITCH = Math.asin(RISE / SLOPE); // ~45.6 degrees
const PITCH_DEG = (PITCH * 180) / Math.PI;
const SIN = Math.sin(PITCH);
const COS = Math.cos(PITCH);
/** Lift that puts the deck's eave bottom edge exactly on y = 0. */
const LIFT = (SLOPE / 2) * SIN + (THICK / 2) * COS;
const DECK_TOP = THICK / 2; // slab-local height of the deck's top face

/** Slab-local [x, height above the deck top, down-slope from centre] for a world point. */
const slabLocal = (x: number, y: number, z: number): [number, number, number] => {
  const dy = y - LIFT;
  return [x, dy * COS + z * SIN, -dy * SIN + z * COS];
};

// ------------------------------------------------------------------ tile field geometry
const WAVES = 6; // wave columns across the width
const LAMBDA = W / WAVES;
const T_MIN = 0.026; // tile thickness at a wave valley
const T_CREST = 0.102; // tile thickness at a wave crest
const CREST_POW = 0.6; // < 1 fattens the crests and narrows the gaps between tiles
const STEP = 0.035; // vertical rise from one course to the next
const LIPS = [0.7, 0.36, 0.02, -0.32]; // each course's down-slope lip, slab-local z
const TILE_LEN = 0.46; // tile length up the slope (0.12 laps under the course above)

/** Tile top-surface height above the tile bottom at x (crest at the verges and centre). */
const tileTop = (x: number) =>
  T_MIN + (T_CREST - T_MIN) * Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * ((x + 1) / LAMBDA)), CREST_POW);

/** Cross-section of one tile course: flat bottom, wavy pantile top. */
const tileProfile = (() => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 4; i++) pts.push([-W / 2 + (i * W) / 4, 0]);
  pts.push([W / 2, T_CREST / 2]);
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const x = W / 2 - (i * W) / n;
    pts.push([x, tileTop(x)]);
  }
  pts.push([-W / 2, T_CREST / 2]);
  return profile.polygon(pts, { smooth: true, samples: 8 });
})();

const CAP_R = 0.06; // ridge cap radius
const CAP_Y = 0.205; // ridge cap centre height, slab-local
const CAP_Z = -0.68; // ridge cap line, slab-local z
const CAP_HALF = 0.13; // half-length of one cap
/** Cap centres sit over the wave valleys. */
const CAP_X = [-0.8333, -0.5, -0.1667, 0.1667, 0.5, 0.8333];

const BOARD = 0.175; // deck plank spacing along the slope

const C = {
  tile: rgb('#b8584a'),
  tileDeep: rgb('#8a3e33'),
  tileLight: rgb('#cf7057'),
  cap: rgb('#ac4e41'),
  moss: rgb('#5cb85c'),
  mossDark: rgb('#3f7a3f'),
  oak: rgb('#b5814a'),
  paleCut: rgb('#c9a06a'),
  warmBrown: rgb('#8a5a35'),
  walnut: rgb('#6b4226'),
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Smooth 0 -> 1 ramp; edges may be given in either order. */
const sstep = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Terracotta: per-course and per-column tints, shaded gaps, lap shadows, moss. */
const tilePaint = (x: number, y: number, z: number): Rgb => {
  const row = Math.max(0, Math.min(3, Math.floor((LIPS[0]! - z) / 0.34)));
  const col = Math.floor((x + W / 2) * WAVES / W);
  const gap = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * ((x + W / 2) / LAMBDA)), CREST_POW);
  const rowTint = noise.random(row * 3 + 1, 31);
  const colTint = noise.random(col, 7);
  const patch = noise.fbm(x * 3.2, y * 3.2, z * 3.2, 2, 3);

  let c = mixRgb(C.tile, C.tileDeep, 0.14 + 0.14 * rowTint + 0.08 * colTint);
  c = mixRgb(c, C.tileLight, 0.13 * (1 - gap));
  c = mixRgb(c, C.tileDeep, 0.3 * gap);
  c = mixRgb(c, C.tileDeep, 0.12 * clamp01(0.5 - 0.5 * patch));

  // Contact shadow just down-slope of every course lip, plus under the ridge caps.
  let ao = 0;
  for (let i = 1; i < LIPS.length; i++) {
    const lip = LIPS[i]!;
    ao = Math.max(ao, sstep(lip - 0.002, lip + 0.016, z) * (1 - sstep(lip + 0.032, lip + 0.068, z)));
  }
  ao = Math.max(ao, 1 - sstep(CAP_Z + 0.05, CAP_Z + 0.1, z));
  c = mixRgb(c, C.tileDeep, 0.34 * ao);

  // Grubby eave skirt and a hand-made tint wobble along each column.
  c = mixRgb(c, C.tileDeep, 0.16 * sstep(0.56, 0.7, z));
  c = mixRgb(c, C.tileLight, 0.08 * noise.fbm(x * 22, y * 4, z * 4, 2, 8));

  // Sparse dark moss near the shaded verge and on the lower courses.
  const moss = noise.fbm(x * 6 + 40, y * 6, z * 6, 3, 47);
  const mossW = sstep(0.42, 0.68, moss) * sstep(0.02, 0.3, z) * (0.2 + 0.8 * sstep(0.1, -0.35, x));
  c = mixRgb(c, C.mossDark, 0.5 * mossW);
  c = mixRgb(c, C.moss, 0.3 * mossW * clamp01(0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2, 51)));
  return c;
};

/** Fine handmade clay speckle; normal-map only. */
const tileBump = (x: number, y: number, z: number) => {
  const [, ly, lz] = slabLocal(x, y, z);
  return (
    0.0011 * noise.fbm(x * 30, ly * 30, lz * 30, 2, 23) +
    0.0008 * noise.fbm(x * 8, ly * 8, lz * 8, 2, 29)
  );
};

/** Slightly deeper caps with a sunlit top and a shaded seat. */
const capPaint = (x: number, y: number, z: number): Rgb => {
  const col = Math.floor((x + W / 2) * WAVES / W);
  const tint = noise.random(col, 7);
  const grain = noise.fbm(x * 10, y * 10, z * 10, 2, 5);
  let c = mixRgb(C.cap, C.tileDeep, 0.12 + 0.12 * tint);
  c = mixRgb(c, C.tileLight, 0.14 * clamp01(0.5 + 0.5 * grain));
  c = mixRgb(c, C.tileDeep, 0.22 * sstep(CAP_Y - 0.015, CAP_Y - 0.045, y));
  return c;
};

const capBump = (x: number, y: number, z: number) => {
  const [, ly, lz] = slabLocal(x, y, z);
  return 0.0012 * noise.fbm(x * 24, ly * 24, lz * 24, 2, 37);
};

/** Oak deck: planks along X, pale end grain on the fascia faces, shaded soffit. */
const deckPaint = (x: number, y: number, z: number): Rgb => {
  const v = z + SLOPE / 2;
  const board = Math.floor(v / BOARD);
  const f = v / BOARD - board;
  const groove = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 3);
  const tint = noise.random(board, 9);
  const grain = noise.fbm(x * 16, y * 5, z * 5, 2, 13);

  let c = mixRgb(C.oak, C.paleCut, 0.18 + 0.24 * tint);
  c = mixRgb(c, C.warmBrown, 0.18 * clamp01(0.5 - 0.5 * grain));
  c = mixRgb(c, C.walnut, 0.5 * groove);
  c = mixRgb(c, C.paleCut, 0.45 * sstep(SLOPE / 2 - 0.025, SLOPE / 2 - 0.003, Math.abs(z)));
  c = mixRgb(c, C.warmBrown, 0.3 * sstep(-0.005, -0.035, y));
  return c;
};

const deckBump = (x: number, y: number, z: number) => {
  const [, ly, lz] = slabLocal(x, y, z);
  const v = lz + SLOPE / 2;
  const f = v / BOARD - Math.floor(v / BOARD);
  const groove = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 3);
  return -0.003 * groove + 0.0012 * noise.fbm(x * 18, ly * 6, lz * 6, 2, 13);
};

export default defineAsset({
  name: 'roof-tile',
  description:
    'Clay tile roof section: an oak deck slab under four stepped courses of rounded terracotta pantiles with rolled lips and a row of half-round ridge caps.',
  reference: 'docs/item-mockups/roof-tile-mock.jpg',
  detail: 0.015,
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- oak deck slab
    // Cut square to the ~46 degree slope; eave bottom edge rests on y = 0 at +Z.
    // A touch narrower and shorter than the tile field so no faces coincide.
    const deck = sdf.box([W - 0.02, THICK, SLOPE], 0.016).paintFn(deckPaint);
    k.body('deck', deck.rotateX(PITCH_DEG).at(0, LIFT, 0), {
      color: C.oak,
      roughness: 0.8,
      metalness: 0,
      detail: 0.02,
      maxError: 0.006,
      maxTriangles: 700,
      textureDensity: 2,
      bump: deckBump,
    });

    // ---------------------------------------------------------------- terracotta courses
    // Each course: a wavy pantile band plus a fatter roll at its lip, riding one STEP
    // above the course below so every lip laps over the waves beneath it.
    const parts: ReturnType<typeof sdf.extrude>[] = [];
    LIPS.forEach((lip, i) => {
      const up = i === LIPS.length - 1 ? -SLOPE / 2 + 0.005 : lip - TILE_LEN;
      const len = lip - up;
      const dy = DECK_TOP - 0.01 + i * STEP - (i === 0 ? 0.008 : 0);
      const zj = (noise.random(i, 5) - 0.5) * 0.01;
      parts.push(sdf.extrude(tileProfile, len, 0.006).at(0, dy, (lip + up) / 2 + zj));
      const fat = i === 0 ? 1.42 : 1.32 + 0.1 * noise.random(i, 17);
      const out = i === 0 ? 0.05 : 0.045; // how far the roll hangs past the lip
      parts.push(
        sdf.extrude(tileProfile, 0.11, 0.012)
          .scale([1, fat, 1])
          .at(0, dy, lip + out - 0.055 + zj),
      );
    });
    const field = sdf
      .union(...parts)
      .displace(0.004, (x, y, z) => noise.fbm(x * 2.6, y * 2.6, z * 2.6, 2, 9) * sstep(0.012, 0.03, y))
      .paintFn(tilePaint);
    k.body('tiles', field.rotateX(PITCH_DEG).at(0, LIFT, 0), {
      color: C.tile,
      roughness: 0.72,
      metalness: 0,
      detail: 0.015,
      maxError: 0.004,
      maxTriangles: 3400,
      textureDensity: 2,
      bump: tileBump,
    });

    // ---------------------------------------------------------------- ridge caps
    // Six chunky half-round caps over the wave valleys, straddling the ridge edge.
    const caps = sdf.union(
      ...CAP_X.map(
        (cx, i) =>
          sdf
            .capsule(
              [cx - CAP_HALF, CAP_Y, CAP_Z + (noise.random(i, 19) - 0.5) * 0.01],
              [cx + CAP_HALF, CAP_Y, CAP_Z + (noise.random(i, 19) - 0.5) * 0.01],
              CAP_R,
            )
            .paintFn(capPaint),
      ),
    );
    k.body('ridge-caps', caps.rotateX(PITCH_DEG).at(0, LIFT, 0), {
      color: C.cap,
      roughness: 0.7,
      metalness: 0,
      detail: 0.016,
      maxError: 0.004,
      maxTriangles: 700,
      textureDensity: 2,
      bump: capBump,
    });
  },
});
