import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Chibi hamlet barn, about 4.0 m tall to the ridge.
 *
 * Role: background/focal building in a cozy hamlet; must read at 128 px (top-down sprites).
 * Size: 4.5 m wide (X), 3.5 m deep (Z), bounds about 5.2 x 4.0 x 4.2 m; gables and doors face +Z.
 * One idea: a gambrel barn: red plank walls, a big dark-red plank roof with white trim on every
 *   edge, and big double doors with white X braces under a hooded arched hay-loft door.
 * Shape language: square/boxy mass (sturdy) with rounded bevels; broken gambrel roof outline.
 * Palette: walls #b8322a (mid), roof #7a2218 (dark), white trim #efe8d8 (light), tan base #d9c7a1,
 *   dark openings #241110, gold knob #d7a63a (accent).
 * Materials: painted wood (rough 0.85), roof planks (0.8), stone footing (0.9), gold (metal 1).
 * Detail: plank grooves and roof courses in `bump`; white frames, braces, windows in geometry.
 * Sides each have a framed window, the back has two windows. Triangle budget 40k via maxTriangles.
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

const DOOR_W = 1.9;
const DOOR_H = 1.75;
const DOOR_BOT = FOUND;
const DOOR_TOP = DOOR_BOT + DOOR_H;
const DOOR_MID = DOOR_BOT + DOOR_H / 2;

const HAY_W = 0.46;
const HAY_R = HAY_W / 2;
const HAY_BOT = 2.5;
const HAY_RECT_TOP = HAY_BOT + 0.28;

const C = {
  red: rgb('#b8322a'),
  redDark: rgb('#8e2a1b'),
  redDeep: rgb('#5f1d12'),
  cream: rgb('#efe8d8'),
  creamDark: rgb('#7a2218'),
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

// Gambrel outline (x, y): eave, knee, ridge. Roof outer outline and wall outline.
const ROOF_OUT: [number, number][] = [
  [-2.56, 1.93], [-1.72, 3.03], [0, 3.98], [1.72, 3.03], [2.56, 1.93],
];
const ROOF_ZH = 2.06;

export default defineAsset({
  name: 'barn',
  description:
    'Red plank gambrel barn with a dark-red plank roof, white trim, X-braced double doors, hooded loft door, and framed windows.',
  detail: 0.016,
  texture: { size: 1024 },
  reference: 'reference/barn_001.jpg',

  build(k) {
    const WHITE = { color: C.cream, roughness: 0.85, detail: 0.014, maxError: 0.005 };
    const trimBump = (x: number, y: number, z: number) => 0.002 * noise.fbm(x * 26, y * 8, z * 26, 2);

    const foundation = sdf
      .box([W + 0.14, FOUND, D + 0.14], 0.03)
      .at(0, FOUND / 2, 0)
      .paintFn((x, y, z, base) =>
        mixRgb(base, rgb('#c9b795'), 0.25 * Math.max(0, noise.fbm(x * 14, y * 3, z * 14, 2))),
      );
    k.body('foundation', foundation, {
      color: C.tan, roughness: 0.9, detail: 0.03, maxTriangles: 1500,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 14, y * 4, z * 14, 3),
    });

    // walls with gambrel gable
    const wallProfile = profile.polygon([
      [-W / 2, FOUND], [W / 2, FOUND], [W / 2, 2.3], [1.62, 2.98], [0, 3.8], [-1.62, 2.98], [-W / 2, 2.3],
    ]);
    const walls = sdf.extrude(wallProfile, D, 0.02);
    k.body('walls', walls.paintFn(plankPaint(C.red)), {
      color: C.red, roughness: 0.85, detail: 0.016, bump: plankBump, maxTriangles: 7000,
    });

    // loft door opening
    const hayPts: [number, number][] = [[-HAY_R, HAY_BOT], [HAY_R, HAY_BOT], [HAY_R, HAY_RECT_TOP]];
    for (let i = 1; i < 8; i++) {
      const a = (Math.PI * i) / 8;
      hayPts.push([HAY_R * Math.cos(a), HAY_RECT_TOP + HAY_R * Math.sin(a)]);
    }
    hayPts.push([-HAY_R, HAY_RECT_TOP]);
    const hayProfile = profile.polygon(hayPts);
    // vent (round, dark) and hay door
    const hayOpening = sdf
      .extrude(hayProfile, 0.06, 0.012)
      .at(0, 0, FRONT + 0.005)
      .union(sdf.cylinder(0.11, 0.06).rotateX(90).at(0, 3.47, FRONT + 0.005));
    k.body('hay-door', hayOpening, { color: C.void, roughness: 0.9, detail: 0.01, maxTriangles: 1500 });

    // roof: gambrel slab, plank courses in bump
    const outer = profile.polygon(ROOF_OUT.concat([]).map(([x, y]) => [x, y]) as [number, number][]);
    const roofProfile = profile.polygon([
      ...ROOF_OUT.map(([x, y]) => [x, y] as [number, number]),
      [2.56, 1.93 - 0.16], [1.64, 2.87 - 0.02], [0, 3.76], [-1.64, 2.85], [-2.56, 1.77],
    ]);
    void outer;
    const sCoord = (x: number, y: number) => {
      const ax = Math.abs(x);
      return y > 3.03
        ? Math.hypot(ax, 3.98 - y)
        : 2.0 + Math.hypot(ax - 1.72, 3.03 - y);
    };
    const ROWH = 0.3;
    const PW = 0.26;
    const roof = sdf.extrude(roofProfile, ROOF_ZH * 2, 0.02).paintFn((x, y, z) => {
      const s = sCoord(x, y) / ROWH;
      const row = Math.floor(s);
      const f = s - row;
      const u = z / PW + (row % 2) * 0.5;
      const col = Math.floor(u);
      const g = u - col;
      const seam = f < 0.1 || g < 0.06 || g > 0.94;
      const c = mixRgb(rgb('#8a281c'), rgb('#6a1c14'), noise.random(row, col, 7) * 0.8);
      return seam ? rgb('#3f120d') : c;
    });
    const roofBump = (x: number, y: number, z: number) => {
      const s = sCoord(x, y) / ROWH;
      const f = s - Math.floor(s);
      const u = z / PW + (Math.floor(s) % 2) * 0.5;
      const g = u - Math.floor(u);
      return 0.012 * (f < 0.85 ? f / 0.85 : (1 - f) / 0.15) + (g < 0.06 || g > 0.94 ? -0.004 : 0) +
        0.002 * noise.noise3(x * 24, y * 24, z * 24);
    };
    k.body('roof', roof, {
      color: rgb('#7a2218'), roughness: 0.8, detail: 0.018, maxError: 0.008, maxTriangles: 12000,
      textureDensity: 2, bump: roofBump,
    });

    // white trim along all roof edges: gable outline rings, eave rods, ridge cap
    const ringAt = (z: number) =>
      sdf.extrude(profile.offsetProfile(roofProfile, 0.05), 0.06, 0.012)
        .subtract(sdf.extrude(profile.offsetProfile(roofProfile, -0.0), 0.2))
        .at(0, 0, z);
    const roofTrim = sdf.union(
      ringAt(ROOF_ZH + 0.0),
      ringAt(-ROOF_ZH),
      sdf.capsule([2.56, 1.91, -ROOF_ZH], [2.56, 1.91, ROOF_ZH], 0.045),
      sdf.capsule([-2.56, 1.91, -ROOF_ZH], [-2.56, 1.91, ROOF_ZH], 0.045),
      sdf.capsule([0, 3.97, -ROOF_ZH], [0, 3.97, ROOF_ZH], 0.05),
      sdf.capsule([1.72, 3.03, -ROOF_ZH], [1.72, 3.03, ROOF_ZH], 0.04),
      sdf.capsule([-1.72, 3.03, -ROOF_ZH], [-1.72, 3.03, ROOF_ZH], 0.04),
    );
    k.body('roof-trim', roofTrim, { ...WHITE, maxTriangles: 5000, bump: trimBump });

    // doors
    const doorZ = FRONT + 0.03;
    const leafW = DOOR_W / 2 - 0.02;
    const leafBox = (sx: number) => sdf.box([leafW, DOOR_H, 0.12], 0.015).at(sx * (leafW / 2 + 0.01), DOOR_MID, doorZ);
    const leaves = sdf.union(leafBox(1), leafBox(-1)).paintFn((x, y, z) => {
      const p = x + DOOR_W / 2;
      const f = p / PLANK - Math.floor(p / PLANK);
      const board = 0.5 + 0.5 * noise.fbm(p * 3.5, y * 1.5, 5, 2);
      let c = mixRgb(C.red, C.redDark, 0.1 + 0.24 * board);
      c = mixRgb(c, C.redDeep, 0.5 * grooveAt(f));
      return c;
    });
    k.body('doors', leaves, {
      color: C.red, roughness: 0.85, detail: 0.014, maxError: 0.005, bump: plankBump, maxTriangles: 3000,
    });
    // white frame
    const frameX = DOOR_W / 2 + 0.08;
    const frameH = DOOR_H + 0.12;
    const frame = sdf.union(
      sdf.box([0.16, frameH, 0.16], 0.015).at(-frameX, FOUND + frameH / 2, FRONT + 0.03),
      sdf.box([0.16, frameH, 0.16], 0.015).at(frameX, FOUND + frameH / 2, FRONT + 0.03),
      sdf.box([DOOR_W + 0.4, 0.16, 0.17], 0.015).at(0, DOOR_TOP + 0.08, FRONT + 0.03),
      sdf.box([0.05, DOOR_H, 0.05], 0.01).at(0, DOOR_MID, doorZ + 0.06),
    );
    // X braces on each leaf, clipped to the leaf
    const brace = (cx: number) => {
      const clip = sdf.box([leafW - 0.1, DOOR_H - 0.1, 0.4], 0.0).at(cx, DOOR_MID, doorZ);
      const ang = (Math.atan2(leafW - 0.1, DOOR_H - 0.1) * 180) / Math.PI;
      const bar = (a: number) => sdf.box([0.075, 2.2, 0.035], 0.008).rotateZ(a).at(cx, DOOR_MID, doorZ + 0.07);
      return sdf.union(bar(ang), bar(-ang)).intersect(clip);
    };
    const borders = (cx: number) =>
      sdf.box([leafW, DOOR_H, 0.03], 0.01).at(cx, DOOR_MID, doorZ + 0.065)
        .subtract(sdf.box([leafW - 0.12, DOOR_H - 0.12, 0.3]).at(cx, DOOR_MID, doorZ));
    const cxs = leafW / 2 + 0.01;
    k.body('door-frame', sdf.union(frame, brace(cxs), brace(-cxs), borders(cxs), borders(-cxs)), {
      ...WHITE, maxTriangles: 5000, bump: trimBump,
    });

    const knob = sdf
      .ellipsoid([0.05, 0.05, 0.028]).at(0.14, DOOR_BOT + 0.85, FRONT + 0.1)
      .mirror('x', 0);
    k.body('knob', knob, { color: C.gold, roughness: 0.35, metalness: 1, detail: 0.005, maxTriangles: 600 });

    // corner boards, eave band, loft trim + hood
    const corner = sdf
      .box([0.16, 2.3 - FOUND + 0.02, 0.16], 0.02)
      .at(W / 2 - 0.03, (2.3 + FOUND) / 2, D / 2 - 0.03)
      .mirror('x', 0).mirror('z', 0);
    const band = sdf.box([0.06, 0.1, D], 0.012).at(W / 2 + 0.0, 2.22, 0).mirror('x', 0);
    const hayOuterPts: [number, number][] = [
      [-HAY_R - 0.055, HAY_BOT], [HAY_R + 0.055, HAY_BOT], [HAY_R + 0.055, HAY_RECT_TOP],
    ];
    for (let i = 1; i < 8; i++) {
      const a = (Math.PI * i) / 8;
      hayOuterPts.push([(HAY_R + 0.055) * Math.cos(a), HAY_RECT_TOP + (HAY_R + 0.055) * Math.sin(a)]);
    }
    hayOuterPts.push([-HAY_R - 0.055, HAY_RECT_TOP]);
    const hayTrim = sdf.extrude(profile.polygon(hayOuterPts), 0.12, 0.015)
      .subtract(sdf.extrude(hayProfile, 0.44)).at(0, 0, FRONT + 0.015);
    const haySill = sdf.box([HAY_W + 0.24, 0.09, 0.18], 0.02).at(0, HAY_BOT - 0.03, FRONT + 0.05);
    const hoodY = HAY_RECT_TOP + HAY_R + 0.12;
    const hood = sdf.extrude(profile.polygon([[-0.42, 0], [0.42, 0], [0, 0.26]]), 0.3, 0.012)
      .at(0, hoodY, FRONT + 0.1);
    const ventRing = sdf.cylinder(0.16, 0.05).rotateX(90).at(0, 3.47, FRONT + 0.01)
      .subtract(sdf.cylinder(0.11, 0.3).rotateX(90).at(0, 3.47, FRONT + 0.02));
    // windows (built facing +Z at the origin)
    const win = (): ReturnType<typeof sdf.box> => {
      const ring = sdf.box([0.82, 0.74, 0.09], 0.012).at(0, 0, 0.03)
        .subtract(sdf.box([0.6, 0.52, 0.3]));
      const bars = sdf.union(
        sdf.box([0.04, 0.56, 0.05]).at(0, 0, 0.03),
        sdf.box([0.64, 0.04, 0.05]).at(0, 0, 0.03),
      );
      const sill = sdf.box([0.94, 0.06, 0.15], 0.012).at(0, -0.4, 0.05);
      return sdf.union(ring, bars, sill);
    };
    const place = (s: ReturnType<typeof win>, ry: number, x: number, y: number, z: number) =>
      s.rotateY(ry).at(x, y, z);
    const windows = [
      place(win(), 90, W / 2, 1.3, 0), place(win(), -90, -W / 2, 1.3, 0),
      place(win(), 180, 1.0, 1.35, -D / 2), place(win(), 180, -1.0, 1.35, -D / 2),
    ];
    const pane = (ry: number, x: number, y: number, z: number) =>
      sdf.box([0.6, 0.52, 0.04], 0.005).rotateY(ry).at(x, y, z);
    k.body('trim', sdf.union(corner, band, hayTrim, haySill, hood, ventRing, ...windows), {
      ...WHITE, maxTriangles: 7000, bump: trimBump,
    });
    k.body('panes', sdf.union(
      pane(90, W / 2, 1.3, 0), pane(-90, -W / 2, 1.3, 0),
      pane(0, 1.0, 1.35, -D / 2), pane(0, -1.0, 1.35, -D / 2),
    ), { color: rgb('#2a3a4a'), roughness: 0.2, detail: 0.01, maxTriangles: 800 });
  },
});
