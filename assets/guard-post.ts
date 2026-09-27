import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Chibi quest guard post, about 2.4 m tall to the ridge (catalog `architecture/structure/guard-post`).
 *
 * Role: hamlet security booth on the village map; must read at 128 px. No rig, no clips.
 * Size: 1.6 m wide (X), 1.4 m deep (Z); ridge runs along X, roof slopes face +Z and -Z.
 *   Stands on y = 0, front (the open counter side) faces +Z.
 * One idea: a chunky honey-oak plank booth, open at the front with a pale counter shelf, under one
 *   broad warm-brown shingle roof, with a glowing amber lantern on an iron hook as the focal point.
 * Shape language: square sturdy mass (safe) with rounded bevels everywhere (friendly).
 * Palette: honey oak walls #b5814a (dominant), warm brown posts #8a5a35 (secondary),
 *   dark brown shingle roof #6f4527, pale cut wood counter/ridge/base #c9a06a, dark walnut
 *   grooves #6b4226, iron #4a4f55/#363a3f, amber glow #ffa143 over dark #4a1405 (accent),
 *   burlap sack #c8a86b, straw tie #e0bb60.
 * Materials: plank wood walls/base (0.85), timber posts/beams (0.8), counter + ridge pale wood
 *   (0.8), shingle roof (0.8), worn iron (0.5, metal 0.7), emissive lantern glass (0.2),
 *   burlap sack (0.9), straw tie (0.85).
 * Detail list: (1) three plank walls + platform, (2) four chunky posts + top beams, (3) counter
 *   shelf, (4) shingle roof + ridge log, (5) iron lantern hook + cage, (6) glowing lantern,
 *   (7) burlap sack with straw tie. Focal point: the amber lantern.
 */

const W = 1.6; // width along X
const D = 1.4; // depth along Z
const BASE_H = 0.12; // platform thickness
const WALL_TOP = 1.05; // top of the lower walls / counter height
const EAVE = 1.86; // roof spring line
const APEX = 2.4; // ridge height

const ROOF_HALF_Z = D / 2 + 0.24; // slope half span with overhang
const ROOF_HALF_X = W / 2 + 0.25; // gable overhang past the sides
const ROOF_DROP = 0.16; // roof slab thickness measured down the slope

const PLANK = 0.16; // wall plank width

const C = {
  oak: rgb('#b5814a'),
  oakDark: rgb('#96683a'),
  walnut: rgb('#6b4226'),
  brown: rgb('#8a5a35'),
  brownDark: rgb('#6f4527'),
  pale: rgb('#c9a06a'),
  paleDark: rgb('#a5814f'),
  iron: rgb('#4a4f55'),
  ironDark: rgb('#363a3f'),
  ironHi: rgb('#a8acb1'),
  glowBase: rgb('#4a1405'),
  glow: rgb('#ffa143'),
  burlap: rgb('#c8a86b'),
  burlapDark: rgb('#a5874f'),
  straw: rgb('#e0bb60'),
};

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Smooth periodic groove weight: 1 at a plank edge, 0 at the plank centre. */
const grooveAt = (f: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 3);

/** Vertical plank color: continuous board tint plus a soft dark groove at the board edge. */
const plankPaint =
  (base: Rgb, dark: Rgb, deep: Rgb, strength = 0.55) =>
  (x: number, y: number, z: number) => {
    // Front/back faces vary with x; side faces vary with z.
    const along = Math.abs(z) >= Math.abs(x) ? x : z;
    const f = along / PLANK - Math.floor(along / PLANK);
    const g = grooveAt(f);
    const board = 0.5 + 0.5 * noise.fbm(along * 3.5, y * 1.5, 0, 2);
    const grain = 0.5 + 0.5 * noise.fbm(along * 22, y * 6, 0, 2);
    let c = mixRgb(base, dark, 0.1 + 0.22 * board);
    c = mixRgb(c, dark, 0.1 * grain);
    c = mixRgb(c, deep, strength * g);
    return c;
  };

/** Plank grooves as a normal-map-only relief. */
const plankBump = (x: number, y: number, z: number) => {
  const along = Math.abs(z) >= Math.abs(x) ? x : z;
  const f = along / PLANK - Math.floor(along / PLANK);
  return -0.004 * grooveAt(f) + 0.0015 * noise.fbm(along * 22, y * 6, 0, 2);
};

export default defineAsset({
  name: 'guard-post',
  description:
    'Chibi wooden guard post with plank walls on three sides, an open front with a pale counter shelf, a warm brown shingle roof with a ridge log, and a glowing amber lantern on an iron hook, with a burlap sack beside it.',
  detail: 0.014,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/guard-post-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- platform
    const base = sdf
      .box([W + 0.12, BASE_H, D + 0.12], 0.03)
      .at(0, BASE_H / 2, 0)
      .paintFn(plankPaint(C.pale, C.paleDark, C.walnut, 0.45));
    k.body('base', base, {
      color: C.pale,
      roughness: 0.85,
      detail: 0.02,
      maxError: 0.006,
      bump: plankBump,
    });

    // ---------------------------------------------------------------- plank walls (three sides)
    const backWall = sdf.box([W, WALL_TOP - BASE_H, 0.09], 0.02).at(0, (BASE_H + WALL_TOP) / 2, -D / 2 + 0.045);
    const sideWall = sdf.box([0.09, WALL_TOP - BASE_H, D], 0.02).at(W / 2 - 0.045, (BASE_H + WALL_TOP) / 2, 0);
    const walls = sdf.smoothUnion(0.025, backWall, sideWall, sideWall.mirror('x', 0));
    k.body('walls', walls.paintFn(plankPaint(C.oak, C.oakDark, C.walnut, 0.72)), {
      color: C.oak,
      roughness: 0.85,
      detail: 0.013,
      maxError: 0.004,
      bump: plankBump,
    });

    // ---------------------------------------------------------------- posts and top beams
    const post = sdf
      .box([0.11, EAVE - BASE_H, 0.11], 0.025)
      .at(W / 2 - 0.08, (BASE_H + EAVE) / 2, D / 2 - 0.08);
    const beamFront = sdf.box([W - 0.1, 0.1, 0.09], 0.02).at(0, EAVE - 0.08, D / 2 - 0.08);
    const beamSide = sdf.box([0.09, 0.1, D - 0.1], 0.02).at(W / 2 - 0.08, EAVE - 0.08, 0);
    const timber = sdf.smoothUnion(
      0.02,
      post,
      post.mirror('x', 0),
      post.mirror('z', 0),
      post.mirror('x', 0).mirror('z', 0),
      beamFront,
      beamFront.mirror('z', 0),
      beamSide,
      beamSide.mirror('x', 0),
      // two small corbels under the counter shelf
      sdf.box([0.07, 0.12, 0.07], 0.018).at(0.55, WALL_TOP - 0.08, D / 2 + 0.08),
      sdf.box([0.07, 0.12, 0.07], 0.018).at(-0.55, WALL_TOP - 0.08, D / 2 + 0.08),
    );
    k.body('timber', timber.paintFn(plankPaint(C.brown, C.walnut, C.walnut, 0.55)), {
      color: C.brown,
      roughness: 0.8,
      detail: 0.012,
      maxError: 0.004,
      bump: plankBump,
    });

    // ---------------------------------------------------------------- counter shelf (front)
    const counter = sdf
      .box([W + 0.04, 0.07, 0.4], 0.022)
      .at(0, WALL_TOP + 0.035, D / 2 + 0.05)
      .paintFn(plankPaint(C.pale, C.paleDark, C.walnut, 0.4));
    k.body('counter', counter, {
      color: C.pale,
      roughness: 0.8,
      detail: 0.01,
      maxError: 0.004,
      bump: plankBump,
    });

    // ---------------------------------------------------------------- shingle roof
    // Cross-section is an inverted V over Z (slopes face +Z and -Z), extruded along X.
    const roofProfile = profile.polygon([
      [-ROOF_HALF_Z, EAVE],
      [0, APEX],
      [ROOF_HALF_Z, EAVE],
      [ROOF_HALF_Z, EAVE - ROOF_DROP],
      [0, APEX - ROOF_DROP],
      [-ROOF_HALF_Z, EAVE - ROOF_DROP],
    ]);
    const slope = Math.atan2(APEX - EAVE, ROOF_HALF_Z);
    const ROW = 0.12;
    const COL = 0.17;
    const downSlope = (y: number) => (APEX - y) / Math.sin(slope);
    const line = (v: number, p: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * v), p);
    const roof = sdf.extrude(roofProfile, ROOF_HALF_X * 2, 0.04).rotateY(90).paintFn((x, y, z) => {
      const s = downSlope(y) / ROW;
      const row = Math.floor(s);
      const f = s - row;
      const u = x / COL + (row % 2) * 0.5;
      const g = u - Math.floor(u);
      const seam = Math.max(line(f, 5), line(g, 6));
      const tint = 0.5 + 0.5 * noise.fbm(x * 3.5, s * 3.5, 0, 2);
      const shingle = mixRgb(mixRgb(C.walnut, C.brownDark, 0.3 * tint), C.walnut, 0.75 * seam);
      // Pale rake board along the left and right gable edges.
      const edge = sstep(ROOF_HALF_X - 0.08, ROOF_HALF_X - 0.02, Math.abs(x));
      return mixRgb(shingle, C.pale, edge);
    });
    const shingleBump = (x: number, y: number, z: number) => {
      const s = downSlope(y) / ROW;
      const f = s - Math.floor(s);
      const ramp = f < 0.85 ? f / 0.85 : (1 - f) / 0.15;
      const u = x / COL + (Math.floor(s) % 2) * 0.5;
      const g = u - Math.floor(u);
      const ridge = g < 0.09 || g > 0.91 ? -0.004 : 0;
      return 0.01 * ramp + ridge + 0.002 * noise.noise3(x * 24, y * 24, z * 24);
    };
    k.body('roof', roof, {
      color: C.brownDark,
      roughness: 0.8,
      detail: 0.018,
      maxError: 0.008,
      textureDensity: 2,
      bump: shingleBump,
    });

    // Ridge log: a pale rounded beam along the apex.
    const ridge = sdf
      .capsule([-ROOF_HALF_X + 0.02, APEX - 0.015, 0], [ROOF_HALF_X - 0.02, APEX - 0.015, 0], 0.055)
      .paintFn((x, y, z, base) => mixRgb(base, C.paleDark, 0.3 * (0.5 + 0.5 * noise.fbm(x * 4, y * 4, 0, 2))));
    k.body('ridge', ridge, {
      color: C.pale,
      roughness: 0.8,
      detail: 0.014,
      maxError: 0.005,
      bump: (x, y, z) => 0.002 * noise.fbm(z * 18, y * 6, x * 6, 2),
    });

    // ---------------------------------------------------------------- lantern hook and cage (iron)
    const HX = -W / 2 + 0.08; // hangs off the front-left post
    const HZ = D / 2 - 0.08;
    const HY = EAVE - 0.2; // hook arm height
    const arm = sdf.union(
      sdf.capsule([HX, HY, HZ], [HX, HY, HZ + 0.3], 0.016),
      sdf.capsule([HX, HY, HZ + 0.3], [HX, HY - 0.09, HZ + 0.32], 0.014),
    );
    const LY = HY - 0.09 - 0.16; // lantern centre
    const LZ = HZ + 0.32;
    const cage = sdf.union(
      sdf.box([0.13, 0.035, 0.13], 0.012).at(HX, LY + 0.095, LZ),
      sdf.box([0.14, 0.035, 0.14], 0.012).at(HX, LY - 0.095, LZ),
      sdf.capsule([HX - 0.05, LY - 0.08, LZ - 0.05], [HX - 0.05, LY + 0.08, LZ - 0.05], 0.009),
      sdf.capsule([HX + 0.05, LY - 0.08, LZ - 0.05], [HX + 0.05, LY + 0.08, LZ - 0.05], 0.009),
      sdf.capsule([HX - 0.05, LY - 0.08, LZ + 0.05], [HX - 0.05, LY + 0.08, LZ + 0.05], 0.009),
      sdf.capsule([HX + 0.05, LY - 0.08, LZ + 0.05], [HX + 0.05, LY + 0.08, LZ + 0.05], 0.009),
      sdf.torus(0.028, 0.009).rotateX(90).at(HX, LY + 0.13, LZ),
    );
    k.body('ironwork', sdf.union(arm, cage), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.007,
      maxError: 0.004,
    });

    // Glowing amber core: dark base color, emissive body.
    const glow = sdf.box([0.085, 0.12, 0.085], 0.025).at(HX, LY, LZ);
    k.body('lantern-glow', glow, {
      color: C.glowBase,
      roughness: 0.2,
      emissive: C.glow,
      emissiveIntensity: 1.8,
      detail: 0.008,
      maxError: 0.004,
    });

    // ---------------------------------------------------------------- burlap sack with straw tie
    const sack = sdf
      .box([0.3, 0.36, 0.3], 0.12)
      .scale([1, 1, 0.92])
      .at(1.06, 0.17, 0.42)
      .paintFn((x, y, z, base) => {
        const weave = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
        let c = mixRgb(base, C.burlapDark, 0.35 + 0.3 * patch);
        c = mixRgb(c, C.burlapDark, 0.2 * weave);
        return c;
      });
    k.body('sack', sack, {
      color: C.burlapDark,
      roughness: 0.9,
      detail: 0.011,
      maxError: 0.005,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 34, y * 34, z * 34, 2),
    });

    const tie = sdf.union(
      sdf.cone([1.06, 0.3, 0.42], [1.06, 0.42, 0.42], 0.1, 0.03),
      sdf.sphere(0.045).at(1.06, 0.4, 0.42),
      sdf.capsule([1.06, 0.4, 0.42], [1.17, 0.32, 0.48], 0.016),
    );
    k.body('sack-tie', tie, {
      color: C.straw,
      roughness: 0.85,
      detail: 0.008,
      maxError: 0.004,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });
  },
});
