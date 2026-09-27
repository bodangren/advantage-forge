import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Design note — village notice board (props/world/notice-board).
 *
 * Role: village landmark. Players read quests here. It must read at 128 px.
 * Size: posts are 1.6 m tall. The plank board is 1.0 m by 0.7 m. It stands on y = 0 and faces +Z.
 * One idea: two chunky posts hold a framed board under a small peaked shingle roof. The wanted poster is the focal point.
 * Shape language: square posts and boards, soft bevels, one peaked roof that breaks the silhouette.
 * Palette: honey oak #b5814a planks, warm brown #8a5a35 posts, walnut #6b4226 frame,
 *   parchment #efe2c0 papers, straw #e0bb60 shingles, iron #4a4f55 pins, leaf #5cb85c grass.
 * Materials: wood, straw shingles, parchment, worn iron, grass. No rig.
 * Detail: posts, frame, planks, and roof first. Papers and iron pins second. Grain and shingle rows in bump.
 */

const OAK = rgb('#b5814a');
const OAK_LIGHT = rgb('#c9a06a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const SEAM = rgb('#4e2f18');
const STRAW = rgb('#e0bb60');
const STRAW_DARK = rgb('#a56a32');
const PARCHMENT = rgb('#efe2c0');
const PARCHMENT_AGED = rgb('#e4cfa0');
const INK = rgb('#3d3428');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#2f6b32');

const BOARD_Y = 1.03;
const POST_X = 0.58;
const POST_Z = -0.03;
const BOARD_Z = 0.022;
const BOARD_FRONT = BOARD_Z + 0.019; // front face of the 0.038 m plank

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Horizontal plank tint, dark seams, and stretched grain. */
const plankPaint = (x: number, y: number, z: number) => {
  const local = (y - (BOARD_Y - 0.34)) / 0.17;
  const board = Math.floor(local);
  const f = local - board;
  const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 10);
  const tint = noise.random(board, 4);
  const grain = 0.5 + 0.5 * noise.fbm(x * 7, y * 28, z * 4, 2);
  let c = mixRgb(OAK, OAK_LIGHT, 0.15 + 0.4 * tint);
  c = mixRgb(c, BROWN, 0.22 * (0.5 + 0.5 * noise.fbm(x * 3, y * 2, z, 2)));
  c = mixRgb(c, OAK_LIGHT, 0.18 * grain);
  // Sun on the upper boards, shade at the foot of the board.
  const t = clamp01((y - 0.68) / 0.7);
  c = mixRgb(c, SEAM, 0.28 * (1 - t) * (1 - t));
  c = mixRgb(c, OAK_LIGHT, 0.16 * Math.max(0, (t - 0.65) / 0.35));
  return mixRgb(c, SEAM, 0.8 * seam);
};

const plankBump = (x: number, y: number, z: number) => {
  const local = (y - (BOARD_Y - 0.34)) / 0.17;
  const f = local - Math.floor(local);
  const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 8);
  return -0.0025 * seam + 0.0014 * noise.fbm(x * 18, y * 6, z * 10, 2);
};

/** Straw courses. Strong row seams, soft column seams, walnut barge boards on the gables. */
const shinglePaint = (x: number, y: number, z: number) => {
  const rowH = 0.05;
  const colW = 0.12;
  const s = (1.75 - y) / rowH;
  const row = Math.floor(s);
  const f = s - row;
  const u = x / colW + (row % 2) * 0.5;
  const g = u - Math.floor(u);
  const rowLine = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
  const colLine = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * g), 8);
  const tint = noise.random(row + 3, Math.floor(u) + 8, 2);
  // Warm straw, pulled toward oak so the roof sits with the village wood, not flat yellow.
  let c = mixRgb(STRAW, STRAW_DARK, 0.4 + 0.38 * tint);
  c = mixRgb(c, STRAW, 0.28 * f);
  c = mixRgb(c, WALNUT, 0.88 * rowLine);
  c = mixRgb(c, BROWN, 0.55 * colLine);
  const barge = clamp01((Math.abs(x) - 0.56) / 0.08);
  return mixRgb(c, WALNUT, barge);
};

const shingleBump = (x: number, y: number, z: number) => {
  const rowH = 0.046;
  const colW = 0.115;
  const s = (1.73 - y) / rowH;
  const row = Math.floor(s);
  const f = s - row;
  const ramp = f < 0.82 ? f / 0.82 : (1 - f) / 0.18;
  const u = x / colW + (row % 2) * 0.5;
  const g = u - Math.floor(u);
  const ridge = g < 0.08 || g > 0.92 ? -0.003 : 0;
  return 0.014 * ramp + ridge;
};

interface Sheet {
  readonly w: number;
  readonly h: number;
  readonly tilt: number;
  readonly at: readonly [number, number, number];
  readonly seed: number;
  readonly wanted?: boolean;
  readonly torn?: boolean;
}

/** Ink marks in the sheet's local frame. Lines are thick so they survive at 128 px. */
const sheetPaint = (w: number, h: number, seed: number, wanted: boolean) => (x: number, y: number) => {
  const age = noise.random(seed, 2);
  let c = mixRgb(PARCHMENT, PARCHMENT_AGED, wanted ? 0.28 : 0.08 + 0.3 * age);
  const stain = noise.fbm(x * 9 + seed, y * 9, seed * 0.3, 2);
  c = mixRgb(c, rgb('#d7c49a'), clamp01(stain) * 0.22);
  // Soft dirty edge.
  const ex = Math.abs(x) / (w * 0.5);
  const ey = Math.abs(y) / (h * 0.5);
  c = mixRgb(c, rgb('#cbb892'), clamp01((Math.max(ex, ey) - 0.78) / 0.22) * 0.55);

  const inkLine = (ly: number, half: number, thick: number, x0 = -half) => {
    const dy = Math.abs(y - ly);
    const dx = x < x0 ? x0 - x : x > x0 + half * 2 ? x - (x0 + half * 2) : 0;
    const d = Math.hypot(dx, Math.max(0, dy - thick * 0.45));
    c = mixRgb(c, INK, 0.9 * clamp01(1 - d / (thick * 0.7)));
  };
  const inkDisc = (cx: number, cy: number, rx: number, ry: number, amount = 0.92) => {
    const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
    c = mixRgb(c, INK, amount * clamp01((1.05 - d) / 0.18));
  };

  if (wanted) {
    // Soft border, filled head, wide hat. Light eyes sit in the head so the face reads small.
    const inset = Math.min(w * 0.5 - Math.abs(x), h * 0.5 - Math.abs(y));
    c = mixRgb(c, INK, 0.88 * clamp01((0.016 - inset) / 0.01));
    inkDisc(0, -0.005, 0.064, 0.068, 0.95);
    // Brim overlaps the crown of the head so it reads as a hat, not a halo.
    inkDisc(0, 0.062, 0.108, 0.028, 0.95);
    // Eyes sit high in the head. A frown sits well below them.
    const eye = (cx: number) => {
      const d = Math.hypot((x - cx) / 0.018, (y - 0.02) / 0.015);
      c = mixRgb(c, PARCHMENT, clamp01((1.2 - d) / 0.4));
    };
    eye(-0.028);
    eye(0.028);
    const mouthY = -0.04 - 1.4 * x * x;
    const md = Math.hypot(x / 0.032, (y - mouthY) / 0.008);
    if (Math.abs(x) < 0.036) c = mixRgb(c, PARCHMENT, clamp01((1.2 - md) / 0.45));
    inkLine(-0.11, 0.13, 0.011);
    inkLine(-0.155, 0.11, 0.01, -0.1);
    inkLine(-0.195, 0.12, 0.011, -0.11);
  } else {
    const n = 3 + (seed % 3);
    for (let i = 0; i < n; i++) {
      const ly = -h * 0.3 + i * (h * 0.62) / Math.max(1, n - 1);
      const half = w * (0.26 + 0.1 * noise.random(seed, i + 3));
      const x0 = -w * 0.32 + (noise.random(seed, i + 11) - 0.5) * 0.04;
      inkLine(ly, half, 0.012, x0);
    }
  }
  return c;
};

const paper = (s: Sheet): Sdf => {
  let shape = sdf.box([s.w, s.h, 0.018], 0.004);
  if (s.torn) {
    shape = shape.subtract(sdf.sphere(0.028).at(s.w * 0.48, -s.h * 0.46, 0));
  }
  return shape
    .paintFn((x, y, _z) => sheetPaint(s.w, s.h, s.seed, s.wanted === true)(x, y))
    .rotateZ(s.tilt)
    .at(s.at[0], s.at[1], s.at[2]);
};

/** World position of a point in a sheet after rotateZ then translate. */
const sheetPoint = (s: Sheet, lx: number, ly: number, lz: number): [number, number, number] => {
  const a = (s.tilt * Math.PI) / 180;
  const c = Math.cos(a);
  const sn = Math.sin(a);
  return [s.at[0] + lx * c - ly * sn, s.at[1] + lx * sn + ly * c, s.at[2] + lz];
};

const pin = (x: number, y: number, z: number, r = 0.022): Sdf =>
  sdf
    .sphere(r)
    .paintFn((px, py) => {
      const up = py / r;
      if (up > 0.35) return mixRgb(IRON, IRON_LIGHT, clamp01((up - 0.35) / 0.65));
      if (up < -0.25) return mixRgb(IRON, IRON_DARK, clamp01((-up - 0.25) / 0.75));
      return IRON;
    })
    .at(x, y, z);

export default defineAsset({
  name: 'notice-board',
  description:
    'Village notice board: two posts, a peaked shingle roof, a plank board, and pinned parchment with a wanted poster.',
  detail: 0.008,
  reference: 'docs/item-mockups/notice-board-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const ground = sdf.halfSpace([0, -1, 0], 0);

    // ------------------------------------------------------------------ posts
    const postAt = (x: number): Sdf => {
      const shaft = sdf.cone([x, 0.08, POST_Z], [x, 1.55, POST_Z], 0.064, 0.044);
      const foot = sdf
        .cylinder(0.082, 0.1, 0.014)
        .at(x, 0.032, POST_Z)
        .intersect(ground);
      return shaft.smoothUnion(0.02, foot);
    };
    const beam = sdf.box([1.28, 0.064, 0.078], 0.012).at(0, 1.5, POST_Z);
    const backRail = sdf.box([1.08, 0.05, 0.045], 0.01).at(0, 0.66, -0.06);
    const knot = sdf.sphere(0.016).at(POST_X - 0.01, 0.38, POST_Z + 0.05);
    const posts = postAt(POST_X)
      .mirror('x', 0)
      .union(beam, backRail)
      .smoothUnion(0.008, knot)
      .paintFn((x, y, z) => {
        const shade = clamp01(1 - y / 1.55);
        const grain = 0.5 + 0.5 * noise.fbm(x * 4, y * 14, z * 4, 2);
        let c = mixRgb(BROWN, WALNUT, 0.35 * shade * shade);
        c = mixRgb(c, OAK, 0.16 * grain);
        c = mixRgb(c, SEAM, 0.22 * Math.max(0, noise.fbm(x * 8, y * 3, z * 8, 2)));
        return c;
      });
    k.body('posts', posts, {
      color: '#8a5a35',
      roughness: 0.84,
      metalness: 0,
      detail: 0.012,
      maxError: 0.006,
      maxTriangles: 900,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 10, y * 22, z * 10, 2),
    });

    // ------------------------------------------------------------------ frame
    const bar = 0.082;
    const frameZ = 0;
    const frameD = 0.068;
    const top = sdf.box([1.16, bar, frameD], 0.014).at(0, BOARD_Y + 0.35 + bar / 2, frameZ);
    const bottom = sdf.box([1.16, bar, frameD], 0.014).at(0, BOARD_Y - 0.35 - bar / 2, frameZ);
    const side = sdf.box([bar, 0.7, frameD], 0.014).at(0.5 + bar / 2, BOARD_Y, frameZ);
    let frame = top.smoothUnion(0.012, bottom, side, side.mirror('x', 0));
    // Dark nail heads on the frame face. Paint, so they cost no extra triangles.
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        frame = frame.paintWhere(
          sdf.sphere(0.016).at(sx * 0.52, BOARD_Y + sy * 0.39, 0.028),
          '#3a2418',
        );
      }
    }
    k.body('frame', frame, {
      color: '#6b4226',
      roughness: 0.82,
      metalness: 0,
      detail: 0.012,
      maxError: 0.005,
      maxTriangles: 550,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 12, y * 8, z * 12, 2),
    });

    // ------------------------------------------------------------------ planks
    let planks: Sdf = sdf.box([0.98, 0.68, 0.042], 0.01).at(0, BOARD_Y, BOARD_Z);
    for (const gy of [BOARD_Y - 0.17, BOARD_Y, BOARD_Y + 0.17]) {
      // Wide grooves on both faces so the planks still read after reduction.
      planks = planks.subtract(
        sdf.box([1.04, 0.016, 0.02], 0.003).at(0, gy, BOARD_FRONT),
        sdf.box([1.04, 0.014, 0.02], 0.003).at(0, gy, BOARD_Z - 0.02),
      );
    }
    k.body('planks', planks.paintFn(plankPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.01,
      maxError: 0.003,
      maxTriangles: 640,
      textureDensity: 1.3,
      paintWeight: 1,
      bump: plankBump,
    });

    // ------------------------------------------------------------------ roof
    // Two thick slabs. +X rotation drops the +Z end, so the front slope uses +pitch.
    const frontPitch = (Math.atan2(0.24, 0.34) * 180) / Math.PI;
    const backPitch = (Math.atan2(0.18, 0.26) * 180) / Math.PI;
    const frontSlab = sdf
      .box([1.38, 0.07, 0.48], 0.02)
      .rotateX(frontPitch)
      .at(0, 1.58, 0.15);
    const backSlab = sdf
      .box([1.32, 0.064, 0.36], 0.018)
      .rotateX(-backPitch)
      .at(0, 1.62, -0.1);
    // A rounded ridge beam. No tile blobs: those creases stop triangle reduction.
    const ridge = sdf.cylinder(0.045, 1.28, 0.012).rotateZ(90).at(0, 1.73, 0.02);
    const roof = frontSlab.smoothUnion(0.03, backSlab).smoothUnion(0.02, ridge);
    k.body('roof', roof.paintFn(shinglePaint), {
      color: '#e0bb60',
      roughness: 0.84,
      metalness: 0,
      detail: 0.02,
      maxError: 0.01,
      maxTriangles: 700,
      textureDensity: 1.5,
      bump: shingleBump,
    });

    // ------------------------------------------------------------------ papers
    const sheets: Sheet[] = [
      { w: 0.38, h: 0.5, tilt: -2, at: [-0.05, 1.0, 0.05], seed: 1, wanted: true },
      { w: 0.28, h: 0.2, tilt: 5, at: [0.24, 1.22, 0.064], seed: 2 },
      { w: 0.26, h: 0.18, tilt: -3.5, at: [0.26, 0.98, 0.066], seed: 3, torn: true },
      { w: 0.26, h: 0.16, tilt: 6.5, at: [-0.26, 0.78, 0.062], seed: 4 },
      { w: 0.2, h: 0.14, tilt: -6, at: [0.2, 0.76, 0.064], seed: 5 },
    ];
    // The poster is its own body so the face keeps enough vertices to read.
    k.body('poster', paper(sheets[0]!), {
      color: '#efe2c0',
      roughness: 0.78,
      metalness: 0,
      detail: 0.012,
      maxError: 0.006,
      maxTriangles: 420,
      textureDensity: 3,
    });
    const notes = sheets.slice(2).reduce<Sdf>((acc, s) => acc.union(paper(s)), paper(sheets[1]!));
    k.body('notes', notes, {
      color: '#efe2c0',
      roughness: 0.8,
      metalness: 0,
      detail: 0.014,
      maxError: 0.007,
      maxTriangles: 360,
      textureDensity: 2,
    });

    // ------------------------------------------------------------------ iron pins
    const pins: Sdf[] = [];
    const wanted = sheets[0]!;
    pins.push(pin(...sheetPoint(wanted, -0.11, 0.19, 0.008)));
    pins.push(pin(...sheetPoint(wanted, 0.11, 0.19, 0.008)));
    for (const s of sheets.slice(1)) {
      pins.push(pin(...sheetPoint(s, 0, s.h * 0.34, 0.008)));
    }
    k.body('pins', sdf.union(...pins), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      maxError: 0.003,
      maxTriangles: 360,
    });

    // ------------------------------------------------------------------ grass at the feet
    // One soft patch that climbs both post feet, not three separate pads.
    const grass = sdf
      .ellipsoid([0.22, 0.09, 0.17])
      .at(POST_X, 0.04, POST_Z)
      .smoothUnion(0.025, sdf.ellipsoid([0.18, 0.08, 0.15]).at(-POST_X - 0.01, 0.035, POST_Z + 0.02))
      .intersect(ground)
      .paintFn((x, y, z) => {
        const tip = clamp01(y / 0.07);
        const n = 0.5 + 0.5 * noise.fbm(x * 6, y * 5, z * 6, 2);
        return mixRgb(mixRgb(LEAF_DARK, LEAF, 0.3 + 0.45 * n), mixRgb(LEAF, STRAW, 0.35), tip * 0.4);
      });
    k.body('grass', grass, {
      color: '#5cb85c',
      roughness: 0.9,
      metalness: 0,
      detail: 0.012,
      maxError: 0.006,
      maxTriangles: 350,
    });
  },
});
