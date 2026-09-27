import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Chibi hamlet cottage, about 2.2 m tall to the ridge (catalog `architecture/structure/cottage`).
 *
 * Role: cozy hamlet home beside the barn; must read at 128 px. No rig, no clips.
 * Size: 2.0 m wide (X), 1.8 m deep (Z); the ridge runs along Z, and the gable, round window, and
 *   arched door face +Z.
 * One idea: a chunky red plank box under one big friendly cream roof, with a round window high in
 *   the gable and a warm wood arched door. Reads as the barn's little sibling.
 * Shape language: square/boxy mass (sturdy) with rounded bevels (friendly); one broad roof.
 * Palette (barn family): red walls #c93b27, cream roof/trim #e9dcc0, tan base #d9c7a1, deep-red
 *   recesses #5f1d12, warm wood #8a4b28, gold #d7a63a, warm stone #9a9082.
 * Materials: painted wood walls (0.85), shingle roof (0.8), cream trim (0.85), tan footing (0.9),
 *   wood door/shutters (0.8), stone chimney (0.9), worn iron straps (metal 0.7), gold ring (metal 1).
 * Detail list: (1) chunky walls + broad roof, (2) stone footing, (3) arched wood door + cream
 *   frame + iron straps, (4) round gable window + cream ring + wood shutters, (5) side stone
 *   chimney, (6) cream corner boards, (7) two bushes + tiny flowers. Focal point: door + round window.
 */

const W = 2.0; // width along X
const D = 1.8; // depth along Z
const FOUND = 0.18; // foundation height
const EAVE = 1.32; // top of the walls (roof springs here)
const RIDGE = 2.12; // gable apex
const FRONT = D / 2; // 0.9
const PLANK = 0.16; // wall plank width

const ROOF_HALF = W / 2 + 0.3; // roof overhang past the side walls
const ROOF_OVER_Z = D / 2 + 0.3; // roof overhang past the gable
const ROOF_EAVE_Y = EAVE - 0.12;
const APEX_Y = RIDGE + 0.08; // ~2.2 m to the ridge
const ROOF_INNER_DROP = 0.17;

const DOOR_W = 0.62;
const DOOR_R = DOOR_W / 2;
const DOOR_BOT = FOUND;
const DOOR_SPRING = 0.82;
const DOOR_FRAME = 0.085;

const WIN_R = 0.17; // glass radius
const WIN_CY = 1.55; // round window centre in the gable
const WIN_Z = FRONT + 0.03;

const C = {
  red: rgb('#c93b27'),
  redDark: rgb('#8e2a1b'),
  redDeep: rgb('#5f1d12'),
  cream: rgb('#e9dcc0'),
  creamDark: rgb('#c9b795'),
  tan: rgb('#d9c7a1'),
  wood: rgb('#8a4b28'),
  woodDark: rgb('#5f3117'),
  gold: rgb('#d7a63a'),
  iron: rgb('#3d4047'),
  void: rgb('#241110'),
  stone: rgb('#9a9082'),
  stoneDark: rgb('#6f6759'),
  leafDark: rgb('#2f6b3a'),
  leafMid: rgb('#4a9a4e'),
  leafLime: rgb('#8ede4f'),
  bloomA: rgb('#e0533d'),
  bloomB: rgb('#f2c14e'),
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

/** Arched outline in XY: a rectangle with a half-round top of radius `halfW`. */
const archProfile = (halfW: number, bot: number, spring: number) => {
  const pts: [number, number][] = [
    [-halfW, bot],
    [halfW, bot],
  ];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([halfW * Math.cos(a), spring + halfW * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

/** Warm laid-stone paint: mortar lines where the worley cells touch, a tint per cell. */
const stonePaint =
  (base: Rgb, dark: Rgb, mortar: Rgb) =>
  (x: number, y: number, z: number) => {
    const { f1, f2, id } = noise.worley(x * 9, y * 5.5, z * 9, 4);
    const gap = sstep(0.05, 0.14, f2 - f1);
    const tint = noise.random(id, 7);
    let c = mixRgb(base, dark, 0.35 * tint);
    c = mixRgb(c, mortar, 0.75 * (1 - gap));
    return c;
  };

const stoneBump = (x: number, y: number, z: number) => {
  const { f1, f2 } = noise.worley(x * 9, y * 5.5, z * 9, 4);
  return -0.006 * (1 - sstep(0.05, 0.14, f2 - f1)) + 0.002 * noise.fbm(x * 20, y * 20, z * 20, 2);
};

/** A chunky lumpy bush, flat on the ground, centred on the origin, about 0.44 m wide. */
const bushShape = (s: number, seed: number) => {
  const lumps = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + noise.random(i, seed) * 0.7;
    const r = 0.11 * s * (0.75 + 0.5 * noise.random(i, seed + 1));
    const bx = Math.cos(a) * 0.13 * s * (0.5 + 0.7 * noise.random(i, seed + 2));
    const bz = Math.sin(a) * 0.13 * s * (0.5 + 0.7 * noise.random(i, seed + 3));
    const by = 0.1 * s + 0.08 * s * noise.random(i, seed + 4);
    lumps.push(sdf.ellipsoid([r, r * 0.9, r]).at(bx, by, bz));
  }
  const base = sdf.smoothUnion(
    0.06 * s,
    sdf.ellipsoid([0.16 * s, 0.14 * s, 0.15 * s]).at(0, 0.13 * s, 0),
    ...lumps,
  );
  return base.displace(0.015 * s, (x, y, z) => noise.fbm(x * 7, y * 7, z * 7, 2)).intersect(sdf.halfSpace([0, -1, 0], 0));
};

export default defineAsset({
  name: 'cottage',
  description:
    'Chibi red plank cottage with a broad cream shingle roof, round gable window with shutters, arched wood door, stone chimney, and bushes at the base.',
  detail: 0.016,
  texture: { size: 1024 },
  reference: 'reference/barn_001.jpg',

  build(k) {
    // ---------------------------------------------------------------- foundation
    const foundation = sdf
      .box([W + 0.12, FOUND, D + 0.12], 0.03)
      .at(0, FOUND / 2, 0)
      .paintFn((x, y, z, base) =>
        mixRgb(base, C.creamDark, 0.25 * Math.max(0, noise.fbm(x * 14, y * 3, z * 14, 2))),
      );
    k.body('foundation', foundation, {
      color: C.tan,
      roughness: 0.9,
      detail: 0.022,
      maxError: 0.006,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 14, y * 4, z * 14, 3),
    });

    // ---------------------------------------------------------------- walls and gable
    const wallProfile = profile.polygon([
      [-W / 2, FOUND],
      [W / 2, FOUND],
      [W / 2, EAVE],
      [0, RIDGE],
      [-W / 2, EAVE],
    ]);
    // Gentle outward bow at mid height plus a slow hand-made wobble: rounded chunky walls.
    const wallBulge = (x: number, y: number, z: number) => {
      const bow = Math.sin(Math.PI * Math.max(0, Math.min(1, (y - FOUND) / (EAVE - FOUND))));
      return Math.max(-1, Math.min(1, 0.75 * bow + 0.5 * noise.fbm(x * 3.2, y * 3.2, z * 3.2, 2)));
    };
    const walls = sdf.extrude(wallProfile, D, 0.045).displace(0.013, wallBulge);
    k.body('walls', walls.paintFn(plankPaint(C.red, C.redDark, C.redDeep)), {
      color: C.red,
      roughness: 0.85,
      detail: 0.013,
      maxError: 0.004,
      bump: plankBump,
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
    const ROW = 0.15;
    const COL = 0.19;
    const downSlope = (y: number) => (APEX_Y - y) / Math.sin(slope);
    // Continuous shingle paint: a periodic dark line at each row/column edge plus smooth tint.
    // Hard color jumps would split the mesh into seams that fold under reduction.
    const line = (v: number, p: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * v), p);
    const roof = sdf.extrude(roofProfile, ROOF_OVER_Z * 2, 0.045).paintFn((x, y, z) => {
      const s = downSlope(y) / ROW;
      const row = Math.floor(s);
      const f = s - row;
      const u = z / COL + (row % 2) * 0.5;
      const g = u - Math.floor(u);
      const seam = Math.max(line(f, 5), line(g, 6));
      const tint = 0.5 + 0.5 * noise.fbm(z * 3.5, s * 3.5, 0, 2);
      const shingle = mixRgb(mixRgb(C.cream, C.creamDark, 0.35 * tint), C.creamDark, 0.85 * seam);
      // Plain cream rake board along the gable edges, like the barn's roof trim.
      const edge = sstep(ROOF_OVER_Z - 0.09, ROOF_OVER_Z - 0.02, Math.abs(z));
      return mixRgb(shingle, C.cream, edge);
    });
    const shingleBump = (x: number, y: number, z: number) => {
      const s = downSlope(y) / ROW;
      const f = s - Math.floor(s);
      const ramp = f < 0.85 ? f / 0.85 : (1 - f) / 0.15;
      const u = z / COL + (Math.floor(s) % 2) * 0.5;
      const g = u - Math.floor(u);
      const ridge = g < 0.09 || g > 0.91 ? -0.004 : 0;
      return 0.012 * ramp + ridge + 0.002 * noise.noise3(x * 24, y * 24, z * 24);
    };
    k.body('roof', roof, {
      color: C.cream,
      roughness: 0.8,
      detail: 0.022,
      maxError: 0.008,
      textureDensity: 2,
      bump: shingleBump,
    });

    // ---------------------------------------------------------------- door
    const doorZ = FRONT + 0.01;
    // Dark reveal behind the leaves, so the doorway reads as an opening.
    const opening = sdf.extrude(archProfile(DOOR_R + 0.01, DOOR_BOT, DOOR_SPRING), 0.06, 0.01);
    k.body('door-opening', opening.at(0, 0, doorZ), {
      color: C.void,
      roughness: 0.9,
      detail: 0.012,
      maxError: 0.005,
    });

    // One arched wood leaf, plank-painted.
    const leaf = sdf
      .extrude(archProfile(DOOR_R - 0.01, DOOR_BOT + 0.025, DOOR_SPRING), 0.1, 0.012)
      .at(0, 0, FRONT + 0.06);
    k.body('door', leaf.paintFn(plankPaint(C.wood, C.woodDark, C.void)), {
      color: C.wood,
      roughness: 0.8,
      detail: 0.01,
      maxError: 0.004,
      bump: plankBump,
    });

    // Two worn iron straps across the door.
    const straps = sdf
      .union(
        sdf.box([0.54, 0.05, 0.03], 0.012).at(0, 0.44, FRONT + 0.12),
        sdf.box([0.54, 0.05, 0.03], 0.012).at(0, 0.74, FRONT + 0.12),
      );
    k.body('straps', straps, { color: C.iron, roughness: 0.55, metalness: 0.7, detail: 0.008 });

    // Gold ring handle.
    const ring = sdf
      .torus(0.052, 0.015)
      .rotateX(90)
      .at(0.16, 0.6, FRONT + 0.13)
      .union(sdf.ellipsoid([0.03, 0.03, 0.018]).at(0.16, 0.67, FRONT + 0.12));
    k.body('handle', ring, { color: C.gold, roughness: 0.35, metalness: 1, detail: 0.01, maxError: 0.005 });

    // ---------------------------------------------------------------- round window
    const glass = sdf.extrude(profile.circle(WIN_R), 0.05).at(0, WIN_CY, WIN_Z);
    k.body('window-glass', glass, {
      color: C.void,
      roughness: 0.2,
      emissive: rgb('#ffbf6b'),
      emissiveIntensity: 0.25,
      detail: 0.014,
    });

    // ---------------------------------------------------------------- trim (cream)
    const frameRing = sdf
      .extrude(profile.circle(WIN_R + 0.058), 0.1, 0.02)
      .subtract(sdf.extrude(profile.circle(WIN_R + 0.002), 0.4))
      .at(0, WIN_CY, WIN_Z + 0.01);
    const mullions = sdf
      .union(
        sdf.box([WIN_R * 2 + 0.1, 0.03, 0.05], 0.012).at(0, WIN_CY, WIN_Z + 0.04),
        sdf.box([0.03, WIN_R * 2 + 0.1, 0.05], 0.012).at(0, WIN_CY, WIN_Z + 0.04),
      );
    const doorFrame = sdf
      .extrude(archProfile(DOOR_R + DOOR_FRAME, DOOR_BOT - 0.02, DOOR_SPRING), 0.15, 0.02)
      .subtract(sdf.extrude(archProfile(DOOR_R + 0.004, DOOR_BOT + 0.004, DOOR_SPRING), 0.5))
      .at(0, 0, FRONT + 0.01);
    const corner = sdf
      .box([0.13, EAVE - FOUND + 0.02, 0.13], 0.025)
      .at(W / 2 - 0.03, (EAVE + FOUND) / 2, D / 2 - 0.03)
      .mirror('x', 0)
      .mirror('z', 0);
    const bead = sdf
      .ellipsoid([0.05, 0.05, 0.05])
      .at(W / 2 + 0.02, EAVE - 0.14, D / 2 + 0.02)
      .mirror('x', 0)
      .mirror('z', 0);
    k.body('trim', sdf.union(frameRing, mullions, doorFrame, corner, bead), {
      color: C.cream,
      roughness: 0.85,
      detail: 0.011,
      maxError: 0.004,
      textureDensity: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 26, y * 8, z * 26, 2),
    });

    // ---------------------------------------------------------------- woodwork (shutters)
    const shutter = sdf
      .box([0.15, 0.34, 0.05], 0.022)
      .at(WIN_R + 0.13, WIN_CY, WIN_Z + 0.01)
      .mirror('x', 0)
      .paintFn(plankPaint(C.wood, C.woodDark, C.void, 0.4));
    k.body('shutters', shutter, {
      color: C.wood,
      roughness: 0.8,
      detail: 0.009,
      maxError: 0.004,
      bump: plankBump,
    });

    // ---------------------------------------------------------------- chimney (stone)
    const CH_X = 0.6;
    const CH_Z = -0.22;
    const CH_Y0 = 1.4;
    const CH_Y1 = 2.28;
    const chimney = sdf
      .box([0.26, CH_Y1 - CH_Y0, 0.26], 0.035)
      .at(CH_X, (CH_Y0 + CH_Y1) / 2, CH_Z)
      .paintFn(stonePaint(C.stone, C.stoneDark, C.creamDark));
    const cap = sdf
      .box([0.33, 0.07, 0.33], 0.02)
      .at(CH_X, CH_Y1 + 0.02, CH_Z)
      .paintFn((x, y, z, base) => mixRgb(base, C.stoneDark, 0.35));
    k.body('chimney', sdf.union(chimney, cap), {
      color: C.stone,
      roughness: 0.9,
      detail: 0.018,
      maxError: 0.006,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- bushes and flowers
    const bushes = sdf
      .union(bushShape(1.0, 1).at(-0.6, 0, 1.02), bushShape(0.85, 2).at(0.66, 0, 0.96))
      .paintFn((x, y, z, base) => {
        const t = Math.max(0, Math.min(1, y / 0.3));
        const v = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
        const target = mixRgb(C.leafDark, C.leafMid, Math.max(0, Math.min(1, t + (v - 0.5) * 0.35)));
        return mixRgb(base, target, 0.7);
      });
    k.body('bushes', bushes, { color: C.leafMid, roughness: 0.8, detail: 0.011, maxError: 0.005, paintWeight: 2 });

    // Bright leaf tips break the bush outline.
    const tips = sdf.union(
      sdf.ellipsoid([0.07, 0.06, 0.06]).at(-0.78, 0.26, 1.08),
      sdf.ellipsoid([0.06, 0.055, 0.055]).at(-0.5, 0.3, 0.86),
      sdf.ellipsoid([0.065, 0.055, 0.055]).at(0.82, 0.24, 0.98),
      sdf.ellipsoid([0.055, 0.05, 0.05]).at(0.56, 0.28, 1.1),
    );
    k.body('leaf-tips', tips, { color: C.leafLime, roughness: 0.72, detail: 0.013, maxError: 0.005 });

    // Three tiny flowers in front of the right bush.
    const flowers: [number, number, number, Rgb][] = [
      [0.4, 1.24, 0.17, C.bloomA],
      [0.5, 1.18, 0.21, C.bloomB],
      [0.33, 1.2, 0.14, C.bloomA],
    ];
    const stems = sdf.union(
      ...flowers.map(([fx, fz, h]) => sdf.capsule([fx, 0.012, fz], [fx, h, fz], 0.012)),
    );
    k.body('stems', stems, { color: C.leafDark, roughness: 0.8, detail: 0.006 });

    const blooms = sdf.union(
      ...flowers.map(([fx, fz, h, col]) =>
        sdf
          .sphere(0.038)
          .paint(col)
          .at(fx, h + 0.02, fz)
          .union(sdf.sphere(0.016).paint(C.woodDark).at(fx, h + 0.05, fz)),
      ),
    );
    k.body('blooms', blooms, { color: C.bloomA, roughness: 0.6, detail: 0.009, maxError: 0.006 });
  },
});
