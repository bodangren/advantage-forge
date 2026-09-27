import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Chibi village barn, 3 m wide, walls 2.2 m to the eave (catalog `architecture/building-parts/barn`).
 *
 * Role: farm building in the village kit, beside the cottage and farm field; must read at 128 px.
 *   No rig, no clips.
 * Size: 3.0 m wide (X), 2.2 m deep (Z); ridge runs along Z, gable and big doors face +Z.
 *   Walls rise to 2.2 m, the thatched ridge to about 3.4 m.
 * One idea: a stout walnut timber frame with horizontal plank infill under one steep golden
 *   thatch roof, big X-braced double doors swung half-open, a small hayloft window high in the gable.
 * Shape language: square sturdy mass, chunky posts, one broad triangular roof (stable + friendly).
 * Palette (contract): walnut posts #6b4226, plank infill #8a5a35, thatch #caa14a to #a07830,
 *   iron #4a4f55, dark void #241a12. Value plan: light thatch on top, mid brown walls,
 *   dark doorway as the focal accent.
 * Materials: plank wood infill (rough 0.85), walnut timber frame (0.8), thatch (0.9),
 *   worn iron straps (metal 0.7), dark interior (0.95).
 * Detail list: (1) plank walls + gable, (2) walnut posts/rails/gable truss, (3) steep thatch roof
 *   + ridge cap, (4) half-open split double doors with X braces, (5) iron strap hinges,
 *   (6) hayloft window. Focal point: the open double doors.
 */

const W = 3.0; // width along X
const D = 2.2; // depth along Z
const EAVE = 2.2; // top of the walls
const RIDGE = 3.3; // gable apex
const FRONT = D / 2; // 1.1

const ROOF_HALF = W / 2 + 0.35; // overhang past the side walls
const ROOF_OVER_Z = D / 2 + 0.35; // overhang past the gable
const ROOF_EAVE_Y = EAVE - 0.1;
const APEX_Y = RIDGE + 0.1;
const ROOF_INNER_DROP = 0.16;

const DOOR_W = 1.5;
const DOOR_BOT = 0.1;
const DOOR_H = 1.78;
const DOOR_SPRING = DOOR_BOT + DOOR_H; // flat-topped doorway
const OPEN_DEG = 38; // doors swung half-open

const C = {
  walnut: rgb('#6b4226'),
  walnutDark: rgb('#4a2e17'),
  plank: rgb('#8a5a35'),
  plankDark: rgb('#6e4526'),
  plankDeep: rgb('#503317'),
  thatch: rgb('#caa14a'),
  thatchDark: rgb('#a07830'),
  iron: rgb('#4a4f55'),
  void: rgb('#241a12'),
};

const PLANK_H = 0.23; // horizontal plank band height

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Smooth periodic groove weight: 1 at a plank edge, 0 at the plank centre. */
const grooveAt = (f: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 3);

/** Horizontal plank paint: a soft dark groove at each board edge plus grain tint. */
const plankPaint =
  (base: Rgb, dark: Rgb, deep: Rgb, strength = 0.55) =>
  (x: number, y: number, z: number) => {
    const f = y / PLANK_H - Math.floor(y / PLANK_H);
    const g = grooveAt(f);
    const along = Math.abs(z) >= Math.abs(x) ? x : z;
    const board = 0.5 + 0.5 * noise.fbm(along * 3.2, y * 1.6, 0, 2);
    const grain = 0.5 + 0.5 * noise.fbm(along * 22, y * 5, 0, 2);
    let c = mixRgb(base, dark, 0.1 + 0.24 * board);
    c = mixRgb(c, dark, 0.1 * grain);
    c = mixRgb(c, deep, strength * g);
    return c;
  };

/** Plank grooves as normal-map-only relief. */
const plankBump = (x: number, y: number, z: number) => {
  const f = y / PLANK_H - Math.floor(y / PLANK_H);
  const along = Math.abs(z) >= Math.abs(x) ? x : z;
  return -0.004 * grooveAt(f) + 0.0015 * noise.fbm(along * 22, y * 5, 0, 2);
};

export default defineAsset({
  name: 'barn',
  description:
    'Stout timber-frame barn with walnut posts, horizontal plank infill, a steep golden thatched roof, big half-open X-braced double doors with iron strap hinges, and a small hayloft window in the gable.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'reference/village-quest_001.jpg',

  build(k) {
    // ---------------------------------------------------------------- plank walls and gable
    const wallProfile = profile.polygon([
      [-W / 2, 0],
      [W / 2, 0],
      [W / 2, EAVE],
      [0, RIDGE],
      [-W / 2, EAVE],
    ]);
    // Gentle hand-made wobble only; the frame carries the character.
    const walls = sdf.extrude(wallProfile, D, 0.04).displace(0.01, (x, y, z) =>
      Math.max(-1, Math.min(1, noise.fbm(x * 3, y * 3, z * 3, 2))),
    );
    k.body('walls', walls.paintFn(plankPaint(C.plank, C.plankDark, C.plankDeep)), {
      color: C.plank,
      roughness: 0.85,
      detail: 0.024,
      maxError: 0.008,
      bump: plankBump,
    });

    // ---------------------------------------------------------------- timber frame (walnut)
    const POST = 0.17; // post width
    const cornerPost = sdf.box([POST, EAVE, POST], 0.03).at(W / 2 - 0.01, EAVE / 2, D / 2 - 0.01);
    const plateX = sdf
      .box([W + 0.06, 0.15, POST], 0.028)
      .at(0, EAVE - 0.06, D / 2 - 0.01);
    const plateZ = sdf
      .box([POST, 0.15, D + 0.06], 0.028)
      .at(W / 2 - 0.01, EAVE - 0.06, 0);
    const midRailX = sdf
      .box([W + 0.04, 0.11, 0.1], 0.024)
      .at(0, 1.06, D / 2 + 0.02);
    const midRailZ = sdf
      .box([0.1, 0.11, D + 0.04], 0.024)
      .at(W / 2 + 0.02, 1.06, 0);
    // Studs flanking the doorway on the front gable wall.
    const jamb = sdf.box([0.13, DOOR_H + 0.1, 0.12], 0.024).at(DOOR_W / 2 + 0.1, DOOR_BOT + DOOR_H / 2, D / 2 + 0.02);
    const lintel = sdf
      .box([DOOR_W + 0.46, 0.13, 0.12], 0.024)
      .at(0, DOOR_SPRING + 0.05, D / 2 + 0.02);
    // Gable truss: collar beam plus two braces following the rake up to the apex.
    const collar = sdf.box([W - 0.1, 0.12, 0.11], 0.026).at(0, EAVE + 0.34, D / 2 - 0.08);
    const braceLen = Math.hypot(W / 2, RIDGE - EAVE) - 0.16;
    const braceAngle = (-Math.atan2(RIDGE - EAVE, W / 2) * 180) / Math.PI;
    const brace = sdf
      .box([braceLen, 0.12, 0.1], 0.026)
      .rotateZ(braceAngle)
      .at(-W / 4 + 0.03, (EAVE + RIDGE) / 2 + 0.02, D / 2 - 0.08);
    // Base beam all around.
    const baseX = sdf.box([W + 0.06, 0.13, POST], 0.028).at(0, 0.07, D / 2 - 0.01);
    const baseZ = sdf.box([POST, 0.13, D + 0.06], 0.028).at(W / 2 - 0.01, 0.07, 0);
    const frame = sdf.union(
      cornerPost.mirror('x', 0).mirror('z', 0),
      plateX.mirror('z', 0),
      plateZ.mirror('x', 0),
      midRailX.mirror('z', 0),
      midRailZ.mirror('x', 0),
      jamb.mirror('x', 0),
      lintel,
      collar,
      brace.mirror('x', 0),
      baseX.mirror('z', 0),
      baseZ.mirror('x', 0),
    );
    k.body('frame', frame, {
      color: C.walnut,
      roughness: 0.8,
      detail: 0.016,
      maxError: 0.005,
      bump: (x, y, z) => 0.0025 * noise.fbm(x * 20, y * 7, z * 20, 2),
    });

    // ---------------------------------------------------------------- thatched roof
    const roofProfile = profile.polygon([
      [-ROOF_HALF, ROOF_EAVE_Y],
      [0, APEX_Y],
      [ROOF_HALF, ROOF_EAVE_Y],
      [ROOF_HALF, ROOF_EAVE_Y - ROOF_INNER_DROP],
      [0, APEX_Y - ROOF_INNER_DROP],
      [-ROOF_HALF, ROOF_EAVE_Y - ROOF_INNER_DROP],
    ]);
    const slope = Math.atan2(APEX_Y - ROOF_EAVE_Y, ROOF_HALF);
    const ROW = 0.17; // thatch course height along the slope
    const downSlope = (y: number) => (APEX_Y - y) / Math.sin(slope);
    const line = (v: number, p: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * v), p);
    const roof = sdf.extrude(roofProfile, ROOF_OVER_Z * 2, 0.05).paintFn((x, y, z) => {
      const s = downSlope(y) / ROW;
      // Wavy course edges: the boundary drifts along the ridge like laid reeds.
      const wobble = 0.35 * noise.fbm(z * 1.8, s * 0.5, 0, 2);
      const f = s + wobble - Math.floor(s + wobble);
      const seam = line(f, 4);
      const streak = 0.5 + 0.5 * noise.fbm(z * 4.5, s * 3.2, 0, 3);
      const c = mixRgb(mixRgb(C.thatch, C.thatchDark, 0.42 * streak), C.thatchDark, 0.8 * seam);
      // Darker eave edge and a warm bright ridge.
      const edge = sstep(0.55, 0.05, s);
      const ridge = sstep(0.5, 0.1, downSlope(y));
      return mixRgb(mixRgb(c, C.thatchDark, 0.35 * edge), C.thatch, 0.3 * ridge);
    });
    const thatchBump = (x: number, y: number, z: number) => {
      const s = downSlope(y) / ROW;
      const f = s - Math.floor(s);
      const ramp = f < 0.85 ? f / 0.85 : (1 - f) / 0.15;
      // Fine reed strands run down the slope (mostly along Z here).
      const reed = noise.fbm(z * 30, s * 6, x * 3, 2);
      return 0.011 * ramp + 0.004 * reed + 0.002 * noise.noise3(x * 22, y * 22, z * 22);
    };
    k.body('roof', roof, {
      color: C.thatch,
      roughness: 0.9,
      detail: 0.028,
      maxError: 0.01,
      textureDensity: 2,
      bump: thatchBump,
    });

    // Rolled ridge cap along the apex.
    const ridgeCap = sdf.capsule([0, APEX_Y + 0.01, -ROOF_OVER_Z + 0.06], [0, APEX_Y + 0.01, ROOF_OVER_Z - 0.06], 0.095);
    k.body('ridge-cap', ridgeCap, {
      color: C.thatchDark,
      roughness: 0.9,
      detail: 0.024,
      maxError: 0.008,
      bump: (x, y, z) => 0.004 * noise.fbm(z * 24, y * 8, x * 8, 2),
    });

    // ---------------------------------------------------------------- doorway and doors
    // Dark reveal behind the leaves so the gap reads as an opening.
    const opening = sdf.extrude(profile.rect([DOOR_W, DOOR_H + 0.04], 0.02), 0.08, 0.012).at(0, DOOR_BOT + DOOR_H / 2, FRONT - 0.01);
    k.body('door-opening', opening, {
      color: C.void,
      roughness: 0.95,
      detail: 0.014,
      maxError: 0.006,
    });

    // One door leaf, hinged at its outer edge, swung OPEN_DEG outward (+Z).
    // Local frame: hinge edge at x = 0, leaf extends +X; pivot at the jamb after the last .at.
    const LEAF_W = DOOR_W / 2 - 0.02;
    const leafCore = sdf.box([LEAF_W, DOOR_H, 0.07], 0.018).at(LEAF_W / 2, 0, 0);
    const leafPainted = leafCore.paintFn(plankPaint(C.plank, C.plankDark, C.plankDeep, 0.45));
    // X brace in darker walnut, sitting proud of the leaf face.
    const braceBar = sdf
      .box([Math.hypot(LEAF_W, DOOR_H - 0.24), 0.09, 0.035], 0.015)
      .rotateZ((Math.atan2(DOOR_H - 0.24, LEAF_W) * 180) / Math.PI)
      .at(LEAF_W / 2, 0, 0.045);
    const leafBrace = braceBar.union(braceBar.rotateZ(0).mirror('z', 0));
    // Iron strap hinges: two straps running from the hinge across the leaf.
    const strapBar = sdf.box([LEAF_W * 0.72, 0.055, 0.02], 0.008).at(LEAF_W * 0.55, 0, 0.052);
    const leafStraps = strapBar.at(0, DOOR_H / 2 - 0.3, 0).union(strapBar.at(0, -DOOR_H / 2 + 0.3, 0));
    const leafAll = leafPainted
      .union(leafBrace.paint(C.walnutDark))
      .at(-0, 0, 0);
    const leafL = leafAll.rotateY(-OPEN_DEG).at(-(DOOR_W / 2), DOOR_BOT + DOOR_H / 2, FRONT + 0.09);
    const leaves = leafL.mirror('x', 0);
    k.body('doors', leaves, {
      color: C.plank,
      roughness: 0.82,
      detail: 0.014,
      maxError: 0.005,
      bump: plankBump,
    });

    // Strap hinges and round hinge pins on both leaves.
    const strapsAll = leafStraps
      .paint(C.iron)
      .rotateY(-OPEN_DEG)
      .at(-(DOOR_W / 2), DOOR_BOT + DOOR_H / 2, FRONT + 0.09)
      .mirror('x', 0);
    const pins = sdf
      .cylinder(0.035, DOOR_H, 0.012)
      .at(DOOR_W / 2 + 0.02, DOOR_BOT + DOOR_H / 2, FRONT + 0.1)
      .mirror('x', 0)
      .paint(C.iron);
    k.body('ironwork', strapsAll.union(pins), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.01,
      maxError: 0.004,
    });

    // ---------------------------------------------------------------- hayloft window
    const LOFT_W = 0.44;
    const LOFT_H = 0.42;
    const LOFT_Y = EAVE + 0.5;
    const loftVoid = sdf
      .extrude(profile.rect([LOFT_W, LOFT_H], 0.015), 0.08, 0.01)
      .at(0, LOFT_Y, FRONT - 0.005);
    k.body('loft-void', loftVoid, {
      color: C.void,
      roughness: 0.95,
      detail: 0.012,
      maxError: 0.005,
    });
    const loftFrame = sdf
      .extrude(profile.rect([LOFT_W + 0.1, LOFT_H + 0.1], 0.02), 0.07, 0.016)
      .subtract(sdf.extrude(profile.rect([LOFT_W + 0.01, LOFT_H + 0.01], 0.01), 0.4))
      .at(0, LOFT_Y, FRONT + 0.01);
    const loftMullion = sdf.union(
      sdf.box([LOFT_W + 0.02, 0.045, 0.05], 0.012).at(0, LOFT_Y, FRONT + 0.03),
      sdf.box([0.045, LOFT_H + 0.02, 0.05], 0.012).at(0, LOFT_Y, FRONT + 0.03),
    );
    const loftSill = sdf.box([LOFT_W + 0.16, 0.07, 0.14], 0.02).at(0, LOFT_Y - LOFT_H / 2 - 0.05, FRONT + 0.03);
    k.body('loft-frame', sdf.union(loftFrame, loftMullion, loftSill), {
      color: C.walnut,
      roughness: 0.8,
      detail: 0.011,
      maxError: 0.004,
    });
    // A hay glow deep in the loft: warm straw inside the dark opening.
    const hayGlow = sdf
      .extrude(profile.rect([LOFT_W - 0.1, LOFT_H - 0.12], 0.02), 0.03)
      .at(0, LOFT_Y - 0.04, FRONT + 0.005)
      .paint(C.thatchDark);
    k.body('loft-hay', hayGlow, {
      color: C.thatchDark,
      roughness: 0.95,
      detail: 0.012,
      maxError: 0.005,
    });
  },
});
