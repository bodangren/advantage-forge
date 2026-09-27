import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Chibi hamlet barn, about 4.0 m tall to the ridge.
 *
 * Role: background/focal building in a cozy hamlet; must read at 128 px.
 * Size: 4.5 m wide (X), 3.5 m deep (Z), ridge runs along Z; the gable and doors face +Z.
 * One idea: a broad, bright cream roof sitting on a chunky plank-red box, with a big friendly
 * double door as the focal point.
 * Shape language: square/boxy mass (sturdy) with rounded bevels (friendly); big triangular roof.
 * Palette: red walls #c93b27 (mid), cream roof/trim #e9dcc0 (light), tan base #d9c7a1,
 *   deep-red recesses #5f1d12 (dark), gold knob #d7a63a (accent).
 * Materials: painted wood (rough 0.85), roof shingles (rough 0.8), stone-ish footing (0.9),
 *   worn gold hardware (metal 1, rough 0.35).
 * Detail: plank grooves + shingle rows in `bump`; recessed door panels and loft arch in geometry.
 * Rig/animation: none.
 */

const W = 4.5; // width along X
const D = 3.5; // depth along Z
const FOUND = 0.24; // foundation height
const EAVE = 2.3; // top of the walls (roof springs here)
const RIDGE = 3.93; // gable apex
const FRONT = D / 2; // 1.75
const PLANK = 0.2; // wall plank width

const ROOF_HALF = W / 2 + 0.36; // roof overhang past the side walls
const ROOF_OVER_Z = D / 2 + 0.34; // roof overhang past the gable
const ROOF_EAVE_Y = EAVE - 0.16;
const APEX_Y = RIDGE + 0.11;
const ROOF_INNER_DROP = 0.22;

const DOOR_W = 1.7;
const DOOR_H = 1.62;
const DOOR_BOT = FOUND;
const DOOR_TOP = DOOR_BOT + DOOR_H;
const DOOR_MID = DOOR_BOT + DOOR_H / 2;

const HAY_W = 0.46;
const HAY_R = HAY_W / 2;
const HAY_BOT = 2.45;
const HAY_RECT_TOP = HAY_BOT + 0.28;

const C = {
  red: rgb('#c93b27'),
  redDark: rgb('#8e2a1b'),
  redDeep: rgb('#5f1d12'),
  cream: rgb('#e9dcc0'),
  creamDark: rgb('#c9b795'),
  tan: rgb('#d9c7a1'),
  gold: rgb('#d7a63a'),
  void: rgb('#241110'),
};

/** Smooth periodic groove weight: 1 at a plank edge, 0 at the plank centre. */
const grooveAt = (f: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 3);

/** Vertical plank color: continuous board tint plus a soft dark groove at the board edge. */
const plankPaint =
  (base: typeof C.red, strength = 0.55) =>
  (x: number, y: number, z: number) => {
    // Front/back faces vary with x; side faces vary with z.
    const along = Math.abs(z) >= Math.abs(x) ? x : z;
    const f = along / PLANK - Math.floor(along / PLANK);
    const g = grooveAt(f);
    // Continuous variation, so no hard color boundary splits the mesh.
    const board = 0.5 + 0.5 * noise.fbm(along * 3.5, y * 1.5, 0, 2);
    const grain = 0.5 + 0.5 * noise.fbm(along * 22, y * 6, 0, 2);
    let c = mixRgb(base, C.redDark, 0.1 + 0.22 * board);
    c = mixRgb(c, C.redDark, 0.1 * grain);
    c = mixRgb(c, C.redDeep, strength * g);
    return c;
  };

/** Plank grooves as a normal-map-only relief. */
const plankBump = (x: number, y: number, z: number) => {
  const along = Math.abs(z) >= Math.abs(x) ? x : z;
  const f = along / PLANK - Math.floor(along / PLANK);
  return -0.004 * grooveAt(f) + 0.0015 * noise.fbm(along * 22, y * 6, 0, 2);
};

export default defineAsset({
  name: 'barn',
  description:
    'Red wooden barn with a broad cream shingle roof, big double doors, a small arched hay door, and cream corner trim.',
  detail: 0.016,
  texture: { size: 1024 },
  reference: 'reference/barn_001.jpg',

  build(k) {
    // ---------------------------------------------------------------- foundation
    const foundation = sdf
      .box([W + 0.14, FOUND, D + 0.14], 0.03)
      .at(0, FOUND / 2, 0)
      .paintFn((x, y, z, base) =>
        mixRgb(base, C.creamDark, 0.25 * Math.max(0, noise.fbm(x * 14, y * 3, z * 14, 2))),
      );
    k.body('foundation', foundation, {
      color: C.tan,
      roughness: 0.9,
      detail: 0.03,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 14, y * 4, z * 14, 3),
    });

    // ---------------------------------------------------------------- walls and gable
    // One extruded "house" profile: a clean solid with no internal union crease, which
    // simplifies well.
    const wallProfile = profile.polygon([
      [-W / 2, FOUND],
      [W / 2, FOUND],
      [W / 2, EAVE],
      [0, RIDGE],
      [-W / 2, EAVE],
    ]);
    let walls = sdf.extrude(wallProfile, D, 0.02);
    k.body('walls', walls.paintFn(plankPaint(C.red)), {
      color: C.red,
      roughness: 0.85,
      detail: 0.016,
      bump: plankBump,
    });

    // Recessed arched hay (loft) door: a dark arched panel set into the gable.
    const hayPts: [number, number][] = [
      [-HAY_R, HAY_BOT],
      [HAY_R, HAY_BOT],
      [HAY_R, HAY_RECT_TOP],
    ];
    for (let i = 1; i < 8; i++) {
      const a = (Math.PI * i) / 8;
      hayPts.push([HAY_R * Math.cos(a), HAY_RECT_TOP + HAY_R * Math.sin(a)]);
    }
    hayPts.push([-HAY_R, HAY_RECT_TOP]);
    const hayProfile = profile.polygon(hayPts);
    const hayOpening = sdf.extrude(hayProfile, 0.06, 0.012).at(0, 0, FRONT + 0.005);
    k.body('hay-door', hayOpening, {
      color: C.void,
      roughness: 0.9,
      detail: 0.01,
    });

    // ---------------------------------------------------------------- roof
    const roofProfile = profile.polygon([
      [-ROOF_HALF, ROOF_EAVE_Y],
      [0, APEX_Y],
      [ROOF_HALF, ROOF_EAVE_Y],
      [ROOF_HALF, ROOF_EAVE_Y - ROOF_INNER_DROP],
      [0, APEX_Y - ROOF_INNER_DROP],
      [-ROOF_HALF, ROOF_EAVE_Y - ROOF_INNER_DROP],
    ]);
    const slope = Math.atan2(APEX_Y - ROOF_EAVE_Y, ROOF_HALF);
    const ROW = 0.17;
    const COL = 0.22;
    const downSlope = (y: number) => (APEX_Y - y) / Math.sin(slope);
    const roof = sdf.extrude(roofProfile, ROOF_OVER_Z * 2, 0.025).paintFn((x, y, z) => {
      const s = downSlope(y) / ROW;
      const row = Math.floor(s);
      const f = s - row;
      const u = z / COL + (row % 2) * 0.5;
      const col = Math.floor(u);
      const g = u - col;
      const seam = f < 0.12 || g < 0.09 || g > 0.91;
      const tint = noise.random(row, col, 11) * 0.4;
      return seam ? C.creamDark : mixRgb(C.cream, C.creamDark, tint);
    });
    const shingleBump = (x: number, y: number, z: number) => {
      const s = downSlope(y) / ROW;
      const f = s - Math.floor(s);
      const ramp = f < 0.85 ? f / 0.85 : (1 - f) / 0.15;
      const u = z / COL + (Math.floor(s) % 2) * 0.5;
      const g = u - Math.floor(u);
      const ridge = g < 0.09 || g > 0.91 ? -0.004 : 0;
      return 0.014 * ramp + ridge + 0.002 * noise.noise3(x * 24, y * 24, z * 24);
    };
    k.body('roof', roof, {
      color: C.cream,
      roughness: 0.8,
      detail: 0.018,
      maxError: 0.007,
      textureDensity: 2,
      bump: shingleBump,
    });

    // ---------------------------------------------------------------- doors and frame
    const doorZ = FRONT + 0.03;
    const doorLeaves = sdf
      .box([DOOR_W, DOOR_H, 0.14], 0.015)
      .at(0, DOOR_MID, doorZ)
      .subtract(sdf.box([0.6, DOOR_H - 0.34, 0.12]).at(0.41, DOOR_MID, doorZ + 0.06))
      .subtract(sdf.box([0.6, DOOR_H - 0.34, 0.12]).at(-0.41, DOOR_MID, doorZ + 0.06))
      // A shallow centre split, not a through cut, so the leaves meet at the base.
      .subtract(sdf.box([0.03, DOOR_H, 0.09]).at(0, DOOR_MID, doorZ + 0.06));

    const frameX = DOOR_W / 2 + 0.11;
    const frameH = DOOR_H + 0.2;
    const frame = sdf
      .union(
        sdf.box([0.22, frameH, 0.17], 0.015).at(-frameX, FOUND + frameH / 2, FRONT + 0.02),
        sdf.box([0.22, frameH, 0.17], 0.015).at(frameX, FOUND + frameH / 2, FRONT + 0.02),
        sdf.box([DOOR_W + 0.6, 0.2, 0.19], 0.015).at(0, DOOR_TOP + 0.1, FRONT + 0.03),
        sdf.box([DOOR_W + 0.72, 0.08, 0.25], 0.015).at(0, DOOR_TOP + 0.24, FRONT + 0.03),
      )
      .paintFn(plankPaint(C.red, 0.04));
    k.body('door-frame', frame, {
      color: C.red,
      roughness: 0.85,
      detail: 0.016,
      maxError: 0.006,
      bump: plankBump,
    });

    const leaves = doorLeaves.paintFn((x, y, z) => {
      const alongPos = x + DOOR_W / 2;
      const f = alongPos / PLANK - Math.floor(alongPos / PLANK);
      const board = 0.5 + 0.5 * noise.fbm(alongPos * 3.5, y * 1.5, 5, 2);
      let c = mixRgb(C.red, C.redDark, 0.1 + 0.24 * board);
      c = mixRgb(c, C.redDark, 0.12 * Math.max(0, noise.fbm(x * 24, y * 6, 0, 2)));
      c = mixRgb(c, C.redDeep, 0.55 * grooveAt(f));
      return c;
    });
    k.body('doors', leaves, {
      color: C.red,
      roughness: 0.85,
      detail: 0.013,
      maxError: 0.005,
      bump: plankBump,
    });

    const knob = sdf
      .ellipsoid([0.05, 0.05, 0.028])
      .at(0, DOOR_BOT + 0.66, FRONT + 0.11)
      .union(sdf.cylinder(0.018, 0.05).rotateX(90).at(0, DOOR_BOT + 0.66, FRONT + 0.1));
    k.body('knob', knob, { color: C.gold, roughness: 0.35, metalness: 1, detail: 0.005 });

    // Chunky belt rail around the building, just above the door header.
    const rail = sdf
      .box([W + 0.08, 0.14, D + 0.08], 0.02)
      .at(0, DOOR_TOP + 0.19, 0)
      .paintFn(plankPaint(C.red, 0.03));
    k.body('belt-rail', rail, {
      color: C.red,
      roughness: 0.85,
      detail: 0.024,
      maxError: 0.006,
      bump: plankBump,
    });

    // ---------------------------------------------------------------- cream trim
    const corner = sdf
      .box([0.16, EAVE - FOUND + 0.02, 0.16], 0.02)
      .at(W / 2 - 0.03, (EAVE + FOUND) / 2, D / 2 - 0.03)
      .mirror('x', 0)
      .mirror('z', 0);
    const cornerBead = sdf
      .ellipsoid([0.05, 0.05, 0.05])
      .at(W / 2 + 0.01, EAVE - 0.16, D / 2 + 0.01)
      .mirror('x', 0)
      .mirror('z', 0);

    const hayOuterPts: [number, number][] = [
      [-HAY_R - 0.055, HAY_BOT],
      [HAY_R + 0.055, HAY_BOT],
      [HAY_R + 0.055, HAY_RECT_TOP],
    ];
    for (let i = 1; i < 8; i++) {
      const a = (Math.PI * i) / 8;
      hayOuterPts.push([
        (HAY_R + 0.055) * Math.cos(a),
        HAY_RECT_TOP + (HAY_R + 0.055) * Math.sin(a),
      ]);
    }
    hayOuterPts.push([-HAY_R - 0.055, HAY_RECT_TOP]);
    const hayTrim = sdf
      .extrude(profile.polygon(hayOuterPts), 0.12, 0.015)
      .subtract(sdf.extrude(hayProfile, 0.44))
      .at(0, 0, FRONT + 0.015);
    const haySill = sdf.box([HAY_W + 0.24, 0.09, 0.18], 0.02).at(0, HAY_BOT - 0.03, FRONT + 0.05);

    k.body('trim', sdf.union(corner, cornerBead, hayTrim, haySill), {
      color: C.cream,
      roughness: 0.85,
      detail: 0.014,
      maxError: 0.005,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 26, y * 8, z * 26, 2),
    });
  },
});
