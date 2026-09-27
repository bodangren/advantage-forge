import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Small village cottage, 2.0 m wide, 1.8 m to the eaves, steep golden thatch roof.
 *
 * Role: cozy village backdrop building for the chibi quest line; must read at 128 px.
 * Size: 2.0 m wide (X) x 1.6 m deep (Z), eaves at 1.8 m, ridge along Z so the gable
 *   and door face +Z; stands on y = 0.
 * One idea: a stout whitewashed cube under a big steep straw roof, with one warm lit
 *   window and a smoking stone chimney telling "someone is home".
 * Shape language: square sturdy mass (safe, cozy) with rounded bevels everywhere and a
 *   deep triangular roof (friendly, storybook).
 * Palette (village contract): plaster #f0e4cc -> #d8c9a8 near the ground, walnut door
 *   #6b4226, honey-oak window frame #b5814a, thatch #caa14a -> #a07830, stone #5e5e58.
 *   Value plan: light plaster dominant, golden roof secondary, dark door + glowing
 *   window as focal contrast.
 * Materials: plaster (rough 0.95), straw thatch (0.9), walnut timber (0.8), honey oak
 *   (0.75), fieldstone (0.9), iron hardware (0.5 / 0.7), glass (0.2, faint warm emissive).
 * Detail: stone plinth + doorstep, recessed arched plank door with iron ring, shuttered
 *   window with muntin cross and deep sill, worley-stone chimney with cap and smoke wisp,
 *   thatch rows + reed strokes in paint and bump.
 * Rig/animation: none (static building).
 */

// ---------------------------------------------------------------- palette (village contract)
const PLASTER = rgb('#f0e4cc');
const PLASTER_DARK = rgb('#d8c9a8');
const PLASTER_LIGHT = rgb('#f7eeda');
const SPLASH = rgb('#c4a880');
const WALNUT = rgb('#6b4226');
const WALNUT_LIGHT = rgb('#7d5030');
const DEEP = rgb('#54331d');
const OAK = rgb('#b5814a');
const OAK_LIGHT = rgb('#c9a06a');
const OAK_DEEP = rgb('#8a5a35');
const THATCH = rgb('#caa14a');
const THATCH_DARK = rgb('#a07830');
const STONE = rgb('#5e5e58');
const STONE_LIGHT = rgb('#73716a');
const MORTAR = rgb('#4c4c46');
const RECESS = rgb('#1a2433');
const GLOW = rgb('#59371a');
const IRON = rgb('#3d4047');
const SMOKE = rgb('#d3cec4');

// ---------------------------------------------------------------- layout (meters)
const W = 2.0;
const D = 1.6;
const PLINTH = 0.16; // stone plinth height
const EAVE = 1.8; // wall top (roof springs just below)
const ROOF_HALF = W / 2 + 0.28; // 1.28 — roof overhang past the side walls
const ROOF_EAVE_Y = EAVE - 0.02;
const APEX_Y = 3.15; // steep ~47 degree pitch
const ROOF_DEPTH = D + 0.52;
const FRONT = D / 2; // 0.8

const DOOR_X = -0.42;
const DOOR_W = 0.56;
const DOOR_H = 1.0;
const DOOR_BOT = PLINTH;
const DOOR_SPRING = DOOR_BOT + DOOR_H - DOOR_W / 2; // arch spring line
const DOOR_R = DOOR_W / 2;

const WIN_X = 0.5;
const WIN_CY = 1.12;
const WIN_HALF = 0.22; // 0.44 m opening
const JAMB_W = 0.06;

const CHIM_X = 0.42;
const CHIM_Z = -0.25;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
/** Smooth groove weight: 1 at a board edge, 0 at the board centre. */
const grooveAt = (f: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 3);

// ---------------------------------------------------------------- stone (plinth, step, chimney)
const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  // Laid fieldstone: worley cells stretched vertically, mortar where f2 - f1 is small.
  // All blends are continuous so the mesh can reduce.
  const w = noise.worley(x * 3.4, y * 5.4, z * 3.4, 4);
  const tint = 0.5 + 0.5 * noise.fbm(x * 3.4, y * 5.4, z * 3.4, 2, 14);
  let c = mixRgb(base, STONE_LIGHT, 0.08 + 0.22 * tint);
  c = mixRgb(c, MORTAR, smoothstep(0.1, 0.025, w.f2 - w.f1));
  return c;
};
const stoneBump = (x: number, y: number, z: number): number => {
  const w = noise.worley(x * 3.4, y * 5.4, z * 3.4, 4);
  return -0.004 * smoothstep(0.1, 0.025, w.f2 - w.f1) + 0.002 * noise.fbm(x * 18, y * 18, z * 18, 2, 9);
};

// ---------------------------------------------------------------- thatch roof helpers
const SLOPE_RISE = APEX_Y - ROOF_EAVE_Y; // 1.37
const SLOPE_LEN = Math.hypot(SLOPE_RISE, ROOF_HALF); // 1.873
const SIN_SLOPE = SLOPE_RISE / SLOPE_LEN;
const ROW = 0.115; // thatch course height down the slope
const REED = 0.06; // reed width along the ridge
const downSlope = (y: number) => (APEX_Y - y) / SIN_SLOPE;

const thatchPaint = (x: number, y: number, z: number): Rgb => {
  // Continuous thatch: soft grooves at each course and reed, streaky straw tint.
  // (No per-cell jumps: discontinuous paint splits the mesh into islands and
  // blocks triangle reduction.)
  const ds = downSlope(y);
  const s = ds / ROW;
  const f = s - Math.floor(s);
  const u = z / REED;
  const g = u - Math.floor(u);
  const course = grooveAt(f);
  const reed = grooveAt(g);
  const tint = 0.5 + 0.5 * noise.fbm(z * 2.5, ds * 1.6, 3, 2);
  let c = mixRgb(THATCH, THATCH_DARK, 0.1 + 0.34 * tint);
  // Long straw streaks running down the slope.
  const streak = noise.fbm(z * 26, ds * 3.2, 5, 2);
  c = mixRgb(c, THATCH_DARK, clamp01(-streak) * 0.3);
  c = mixRgb(c, rgb('#e0bb60'), clamp01(streak) * 0.22);
  c = mixRgb(c, THATCH_DARK, 0.4 * Math.max(course, reed * 0.7));
  return c;
};
const thatchBump = (x: number, y: number, z: number): number => {
  const ds = downSlope(y);
  const s = ds / ROW;
  const f = s - Math.floor(s);
  const ramp = f < 0.85 ? f / 0.85 : (1 - f) / 0.15;
  const u = z / REED + (Math.floor(s) % 2) * 0.5;
  const g = u - Math.floor(u);
  const reed = g < 0.08 || g > 0.92 ? -0.004 : 0;
  return 0.011 * ramp + reed + 0.0022 * noise.fbm(z * 30, ds * 5, 0, 2, 12);
};

export default defineAsset({
  name: 'cottage',
  description:
    'Stout whitewashed village cottage with a steep golden thatched roof, an arched walnut door, one shuttered window with a honey-oak frame, and a smoking stone chimney.',
  detail: 0.02,
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- stone plinth + doorstep
    // Single rounded boxes keep the meshes connected so they reduce cleanly.
    const plinth = sdf.box([W + 0.12, PLINTH, D + 0.12], 0.03).at(0, PLINTH / 2, 0);
    k.body('plinth', plinth.paintFn(stonePaint), {
      color: STONE,
      roughness: 0.9,
      detail: 0.05,
      maxError: 0.01,
      maxTriangles: 700,
      bump: stoneBump,
    });
    const step = sdf.box([0.62, 0.07, 0.3], 0.02).at(DOOR_X, 0.035, FRONT + 0.16);
    k.body('doorstep', step.paintFn(stonePaint), {
      color: STONE,
      roughness: 0.9,
      detail: 0.02,
      maxError: 0.006,
      maxTriangles: 120,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- stone chimney (base buried in the roof)
    // One box; the cap slab and flue opening are paint, so the mesh stays simple.
    const CHIM_TOP = 3.1;
    const chimneyPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      let c = stonePaint(x, y, z, base);
      // Cap slab: lighter band near the top.
      c = mixRgb(c, STONE_LIGHT, smoothstep(CHIM_TOP - 0.14, CHIM_TOP - 0.06, y) * 0.45);
      // Flue opening: dark square on the top face.
      if (y > CHIM_TOP - 0.03 && Math.abs(x - CHIM_X) < 0.09 && Math.abs(z - CHIM_Z) < 0.09)
        c = MORTAR;
      return c;
    };
    const shaft = sdf.box([0.32, 1.0, 0.32], 0.025).at(CHIM_X, CHIM_TOP - 0.5, CHIM_Z);
    k.body('chimney', shaft.paintFn(chimneyPaint), {
      color: STONE,
      roughness: 0.9,
      detail: 0.024,
      maxError: 0.008,
      maxTriangles: 450,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- walls + gable (one clean extrude)
    const wallProfile = profile.polygon([
      [-W / 2, 0],
      [W / 2, 0],
      [W / 2, EAVE],
      [0, EAVE + 0.42],
      [-W / 2, EAVE],
    ]);
    const winHole = sdf
      .box([WIN_HALF * 2, WIN_HALF * 2, 0.5], 0.01)
      .at(WIN_X, WIN_CY, 0);
    const walls = sdf.extrude(wallProfile, D, 0.025).subtract(winHole);
    const plasterPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const patch = noise.fbm(x * 2.6, y * 2.6, z * 2.6, 3, 4);
      let c = mixRgb(base, PLASTER_DARK, clamp01(patch) * 0.32);
      c = mixRgb(c, PLASTER_LIGHT, clamp01(-patch) * 0.16);
      // Shade to #d8c9a8 near the ground, with mottled splash accents.
      const low = smoothstep(0.5, 0.06, y);
      c = mixRgb(c, PLASTER_DARK, low * 0.55);
      c = mixRgb(c, SPLASH, low * clamp01(0.25 + 0.55 * noise.fbm(x * 5, y * 7, z * 5, 2, 6)) * 0.7);
      return c;
    };
    k.body('walls', walls.paintFn(plasterPaint), {
      color: PLASTER,
      roughness: 0.95,
      detail: 0.02,
      maxError: 0.01,
      maxTriangles: 1100,
      paintWeight: 2,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 14, y * 14, z * 14, 3, 6),
    });

    // ---------------------------------------------------------------- thatched roof
    const roofProfile = profile.polygon([
      [-ROOF_HALF, ROOF_EAVE_Y],
      [0, APEX_Y],
      [ROOF_HALF, ROOF_EAVE_Y],
      [ROOF_HALF, ROOF_EAVE_Y - 0.3],
      [0, APEX_Y - 0.3],
      [-ROOF_HALF, ROOF_EAVE_Y - 0.3],
    ]);
    // Thick rounded thatch: all reed detail lives in paint + bump, so the mesh stays light.
    const roof = sdf.extrude(roofProfile, ROOF_DEPTH, 0.05);
    k.body('roof', roof.paintFn(thatchPaint), {
      color: THATCH,
      roughness: 0.9,
      detail: 0.026,
      maxError: 0.012,
      maxTriangles: 1100,
      textureDensity: 2,
      bump: thatchBump,
    });

    // ---------------------------------------------------------------- walnut door (arched, plank) + frame ring
    const archPts = (r: number, springY: number, botY: number): [number, number][] => {
      const pts: [number, number][] = [
        [-r, botY],
        [r, botY],
        [r, springY],
      ];
      for (let i = 1; i < 8; i++) {
        const a = (Math.PI * i) / 8;
        pts.push([r * Math.cos(a), springY + r * Math.sin(a)]);
      }
      pts.push([-r, springY]);
      return pts;
    };
    const doorShape = sdf
      .extrude(profile.polygon(archPts(DOOR_R, DOOR_SPRING, DOOR_BOT)), 0.1, 0.012)
      .at(DOOR_X, 0, FRONT);
    const frameShape = sdf
      .extrude(profile.polygon(archPts(DOOR_R + 0.06, DOOR_SPRING, DOOR_BOT - 0.02)), 0.08, 0.014)
      .subtract(sdf.extrude(profile.polygon(archPts(DOOR_R + 0.01, DOOR_SPRING, DOOR_BOT)), 0.4))
      .at(DOOR_X, 0, FRONT + 0.02);
    const plankPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const along = x - (DOOR_X - DOOR_R);
      const f = along / 0.14 - Math.floor(along / 0.14);
      const board = 0.5 + 0.5 * noise.fbm(x * 3.5, y * 1.5, 7, 2);
      let c = mixRgb(base, WALNUT_LIGHT, 0.12 + 0.26 * board);
      c = mixRgb(c, DEEP, 0.14 * Math.max(0, noise.fbm(x * 24, y * 6, 0, 2)));
      c = mixRgb(c, DEEP, 0.6 * grooveAt(f));
      return c;
    };
    k.body('door', doorShape.paintFn(plankPaint), {
      color: WALNUT,
      roughness: 0.8,
      detail: 0.012,
      maxError: 0.006,
      maxTriangles: 380,
      paintWeight: 2,
      bump: (x, y, z) => {
        const along = x - (DOOR_X - DOOR_R);
        const f = along / 0.14 - Math.floor(along / 0.14);
        return -0.0035 * grooveAt(f) + 0.0012 * noise.fbm(x * 24, y * 6, 0, 2, 8);
      },
    });
    k.body('door-frame', frameShape, {
      color: DEEP,
      roughness: 0.8,
      detail: 0.014,
      maxError: 0.006,
      maxTriangles: 300,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 26, y * 8, z * 26, 2, 8),
    });

    // ---------------------------------------------------------------- iron ring handle + door straps
    const ring = sdf
      .torus(0.045, 0.011)
      .rotateX(90)
      .at(DOOR_X + 0.17, DOOR_BOT + 0.52, FRONT + 0.075)
      .union(sdf.ellipsoid([0.028, 0.028, 0.014]).at(DOOR_X + 0.17, DOOR_BOT + 0.52, FRONT + 0.055));
    const strap = (hy: number): Sdf =>
      sdf
        .box([0.2, 0.034, 0.012], 0.005)
        .at(DOOR_X - 0.17, hy, FRONT + 0.056)
        .union(sdf.cylinder(0.014, 0.05, 0.004).rotateX(90).at(DOOR_X - 0.245, hy, FRONT + 0.056));
    k.body('iron', ring.union(strap(DOOR_BOT + 0.24)).union(strap(DOOR_BOT + 0.78)), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxError: 0.003,
      maxTriangles: 220,
    });

    // ---------------------------------------------------------------- honey-oak window frame + shutters + glass
    const jambX = WIN_HALF + JAMB_W / 2;
    const oakFrame = sdf.union(
      sdf.box([JAMB_W, WIN_HALF * 2 + 0.14, 0.13], 0.012).at(WIN_X + jambX, WIN_CY, FRONT + 0.045),
      sdf.box([JAMB_W, WIN_HALF * 2 + 0.14, 0.13], 0.012).at(WIN_X - jambX, WIN_CY, FRONT + 0.045),
      sdf.box([WIN_HALF * 2 + 0.14, JAMB_W, 0.13], 0.012).at(WIN_X, WIN_CY + WIN_HALF + JAMB_W / 2, FRONT + 0.045),
      // Chunky deep sill with ears.
      sdf.box([WIN_HALF * 2 + 0.24, 0.07, 0.22], 0.015).at(WIN_X, WIN_CY - WIN_HALF - 0.045, FRONT + 0.06),
      // Muntin cross, recessed behind the frame front.
      sdf.box([WIN_HALF * 2, 0.042, 0.05], 0.008).at(WIN_X, WIN_CY, FRONT - 0.01),
      sdf.box([0.042, WIN_HALF * 2, 0.05], 0.008).at(WIN_X, WIN_CY, FRONT - 0.01),
    );
    const oakPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const tint = noise.fbm(x * 2.2, y * 2.2, z * 2.2, 3, 7);
      let c = mixRgb(base, OAK_LIGHT, clamp01(tint) * 0.25);
      c = mixRgb(c, OAK_DEEP, clamp01(-tint) * 0.3);
      const grain = noise.fbm(x * 3.2, y * 26, z * 26, 2, 9);
      c = mixRgb(c, OAK_DEEP, clamp01(-grain) * 0.2);
      return c;
    };
    k.body('window-frame', oakFrame.paintFn(oakPaint), {
      color: OAK,
      roughness: 0.75,
      detail: 0.011,
      maxError: 0.005,
      maxTriangles: 400,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 30, z * 30, 2, 8),
    });

    // Dark glass, recessed deep, faintly warm — someone is home.
    const glass = sdf.box([WIN_HALF * 2, WIN_HALF * 2, 0.05], 0.008).at(WIN_X, WIN_CY, FRONT - 0.12);
    k.body('glass', glass, {
      color: RECESS,
      roughness: 0.2,
      metalness: 0.05,
      emissive: GLOW,
      emissiveIntensity: 0.4,
      detail: 0.02,
      maxError: 0.008,
      maxTriangles: 60,
    });

    // Two walnut shutter leaves standing open, canted off the wall.
    const SHUT_TILT = 14;
    const hingeX = WIN_HALF + JAMB_W + 0.01;
    const shutterLeaf = (side: 1 | -1): Sdf =>
      sdf
        .box([0.24, WIN_HALF * 2 + 0.08, 0.04], 0.012)
        .at(side * 0.12, 0, 0)
        .rotateY(side * -SHUT_TILT)
        .at(WIN_X + side * hingeX, WIN_CY, FRONT + 0.05);
    const shutterPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const f = (Math.abs(x - WIN_X) - hingeX) / 0.12;
      const bi = Math.floor(f) + (x < WIN_X ? 11 : 0);
      const tint = noise.random(bi, 3, 5);
      let c = mixRgb(base, WALNUT_LIGHT, 0.2 * tint);
      c = mixRgb(c, DEEP, 0.18 * (1 - tint));
      c = mixRgb(c, DEEP, 0.55 * grooveAt(f - Math.floor(f)));
      const grain = noise.fbm(x * 30, y * 4, z * 30, 2, 8);
      c = mixRgb(c, DEEP, clamp01(-grain) * 0.2);
      return c;
    };
    k.body('shutters', sdf.union(shutterLeaf(1), shutterLeaf(-1)).paintFn(shutterPaint), {
      color: WALNUT,
      roughness: 0.8,
      detail: 0.011,
      maxError: 0.005,
      maxTriangles: 300,
      paintWeight: 2,
      bump: (x, y, z) => {
        const f = (Math.abs(x - WIN_X) - hingeX) / 0.12;
        return -0.003 * grooveAt(f - Math.floor(f)) + 0.0012 * noise.fbm(x * 30, y * 4, z * 30, 2, 8);
      },
    });

    // ---------------------------------------------------------------- smoke wisp above the chimney
    const puff = (dx: number, dy: number, dz: number, s: number): Sdf =>
      sdf.ellipsoid([0.075 * s, 0.06 * s, 0.065 * s]).at(CHIM_X + dx, dy, CHIM_Z + dz);
    const smoke = sdf
      .smoothUnion(0.06, puff(0.01, 3.26, 0, 0.9), puff(0.08, 3.44, 0.03, 1.1), puff(0.17, 3.64, 0.07, 1.35))
      .paintFn((x, y, z, base) => mixRgb(base, SMOKE, smoothstep(3.25, 3.75, y) * 0.5));
    k.body('smoke', smoke, {
      color: SMOKE,
      roughness: 1,
      opacity: 0.35,
      detail: 0.02,
      maxError: 0.01,
      maxTriangles: 140,
    });
  },
});
