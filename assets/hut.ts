import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Small round forest hut, 2.4 m wide and 2.4 m tall.
 *
 * Role: a clearing landmark that must read at 128 px. No rig.
 * Size: 2.4 m across, 2.4 m tall, on y = 0, front toward +Z.
 * One idea: a woven basket under a fat golden thatch cone, with a big arched door.
 * Shape language: round and soft, with one triangular roof.
 * Palette: thatch #f2d56e, wattle #e0a84a, door #b88860, frame #e4c4ae, stone #8a94a0, iron #3a3634.
 * Materials: stone, wattle, thatch, door wood, frame wood, worn iron.
 * Detail: low stone footing, ribbed wattle, short thatch rolls, arched plank door. Focal point: the door.
 */

const C = {
  thatch: rgb('#f2d56e'),
  thatchMid: rgb('#e0b44a'),
  thatchDark: rgb('#b88832'),
  wattle: rgb('#e0a84a'),
  wattleDark: rgb('#c08030'),
  wattleDeep: rgb('#8a5420'),
  door: rgb('#c4986a'),
  doorDark: rgb('#8a5a35'),
  doorDeep: rgb('#5f3d22'),
  frame: rgb('#e4c4ae'),
  frameDark: rgb('#c4a088'),
  stone: rgb('#8a94a0'),
  stoneDark: rgb('#6a7380'),
  iron: rgb('#4a4542'),
  moss: rgb('#4a9a4f'),
  mossDark: rgb('#2f7a3f'),
  void: rgb('#2a1810'),
};

const DOOR_HALF = 0.32;
const DOOR_BOT = 0.14;
const DOOR_SPRING = 0.58;
const DOOR_Z = 1.05;
const DOOR_D = 0.08;
const FRAME_Z = 0.92;
const FRAME_D = 0.28;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const sstep = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Arch in XY: a flat bottom and a half-round top. */
const archProfile = (halfW: number, bot: number, spring: number) => {
  const pts: [number, number][] = [
    [-halfW, bot],
    [halfW, bot],
  ];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([halfW * Math.cos(a), spring + halfW * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

/** A short thatch roll. Side rolls hang lower and farther out than the front roll. */
const roll = (angle: number, r0: number, y0: number, r1: number, y1: number, rad0: number, rad1: number) => {
  const p = (r: number, y: number): [number, number, number] => [
    Math.sin(angle) * r,
    y,
    Math.cos(angle) * r,
  ];
  return sdf.cone(p(r0, y0), p(r1, y1), rad0, rad1);
};

const thatchPaint = (x: number, y: number, z: number) => {
  const a = Math.atan2(x, z);
  const streak = 0.5 + 0.5 * Math.cos(a * 11);
  const along = (2.35 - y) * 2.8;
  const fiber = 0.5 + 0.5 * noise.fbm(Math.cos(a) * 2, along, Math.sin(a) * 2, 2);
  let c = mixRgb(C.thatch, C.thatchMid, 0.14 + 0.36 * fiber);
  return mixRgb(c, C.thatchDark, 0.16 * (1 - streak));
};

const plankPaint = (x: number, y: number) => {
  const plank = 0.125;
  const f = x / plank - Math.floor(x / plank);
  const g = Math.pow(0.5 + 0.5 * Math.cos(f * Math.PI * 2), 4);
  const board = noise.random(Math.floor(x / plank + 4), 2);
  const grain = 0.5 + 0.5 * noise.fbm(x * 5, y * 12, 0, 2);
  return mixRgb(mixRgb(C.door, C.doorDark, 0.1 + 0.28 * board + 0.08 * grain), C.doorDeep, 0.68 * g);
};

export default defineAsset({
  name: 'hut',
  description:
    'A small round forest hut with a stone footing, woven wattle walls, a conical thatched roof, and a round-topped plank door.',
  detail: 0.018,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/hut-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- stone footing
    // Smooth color only. Hard cell edges block triangle reduction.
    const stone = sdf
      .cylinder(1.0, 0.15, 0.03)
      .at(0, 0.075, 0)
      .paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 2.2, y * 2, z * 2.2, 2);
        const c = mixRgb(C.stone, C.stoneDark, 0.3 * n);
        const moss = sstep(0.16, 0.02, y) * sstep(-0.1, -0.7, z);
        return mixRgb(c, C.mossDark, 0.42 * moss);
      });
    k.body('stone', stone, {
      color: C.stone,
      roughness: 0.92,
      detail: 0.028,
      maxError: 0.01,
      maxTriangles: 500,
      bump: (x, y, z) => {
        const { f1, f2 } = noise.worley(x * 5, y * 3.5, z * 5, 3);
        return -0.005 * (1 - sstep(0.08, 0.18, f2 - f1));
      },
    });

    // ---------------------------------------------------------------- wattle walls
    // A smooth pot. Vertical stakes are a soft flute, not extra poles, so the wall stays round.
    const stakeN = 7;
    const walls = sdf
      .revolve(
        profile.polygon([
          [0, 0.07],
          [0.58, 0.1],
          [0.78, 0.26],
          [0.9, 0.48],
          [0.88, 0.7],
          [0.78, 0.9],
          [0.58, 1.04],
          [0.28, 1.08],
          [0, 1.02],
        ]),
      )
      .round(0.04)
      .paintFn((x, y, z) => {
        const rib = 0.5 + 0.5 * Math.cos(Math.atan2(x, z) * stakeN);
        const tint = 0.5 + 0.5 * noise.fbm(x * 1.3, y * 1.1, z * 1.3, 2);
        let c = mixRgb(C.wattle, C.wattleDark, 0.1 + 0.22 * tint + 0.16 * (1 - rib));
        const moss = sstep(0.24, 0.06, y) * sstep(0.15, -0.5, z);
        return mixRgb(c, C.moss, 0.26 * moss);
      });
    k.body('walls', walls, {
      color: C.wattle,
      roughness: 0.88,
      detail: 0.01,
      maxError: 0.0014,
      maxTriangles: 2200,
      bump: (x, y, z) => {
        const row = y / 0.07;
        const weave = Math.sin(Math.atan2(x, z) * stakeN + (Math.floor(row) % 2) * Math.PI);
        const rib = 0.5 + 0.5 * Math.cos(Math.atan2(x, z) * stakeN);
        return 0.005 * weave - 0.004 * Math.pow(1 - rib, 1.3);
      },
    });

    // ---------------------------------------------------------------- thatch
    // A smaller cone fills the gaps. The rolls are the roof.
    const roof = sdf
      .revolve(
        profile.polygon([
          [0.06, 2.04],
          [0.55, 1.56],
          [1.05, 1.16],
          [1.1, 1.02],
          [0.88, 1.06],
          [0.4, 1.44],
          [0.04, 1.9],
        ]),
      )
      .round(0.03)
      .paintFn(thatchPaint);
    k.body('thatch', roof, {
      color: C.thatch,
      roughness: 0.92,
      detail: 0.02,
      maxError: 0.008,
      maxTriangles: 900,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 6, y * 10, z * 6, 2),
    });

    const rolls = [];
    const eaveN = 9;
    for (let i = 0; i < eaveN; i++) {
      const a = (i / eaveN) * Math.PI * 2;
      const side = 1 - Math.max(0, Math.cos(a));
      const r1 = 1.05 + 0.06 * side;
      const y1 = 1.2 - 0.1 * side;
      const rad = 0.115 + 0.012 * noise.random(i, 2);
      rolls.push(roll(a, r1 - 0.42, y1 + 0.34, r1, y1, rad * 0.62, rad));
    }
    for (let i = 0; i < eaveN; i++) {
      const a = ((i + 0.5) / eaveN) * Math.PI * 2;
      const side = 1 - Math.max(0, Math.cos(a));
      const r1 = 0.86 + 0.05 * side;
      const y1 = 1.38 - 0.05 * side;
      const rad = 0.095;
      rolls.push(roll(a, r1 - 0.32, y1 + 0.26, r1, y1, rad * 0.65, rad));
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.25;
      rolls.push(roll(a, 0.18, 1.88, 0.48, 1.6, 0.05, 0.072));
    }
    const knot = [sdf.capsule([0, 1.9, 0], [0, 2.34, 0], 0.055)];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      const a2 = a + 0.85;
      knot.push(
        sdf.capsule(
          [Math.sin(a) * 0.03, 1.88, Math.cos(a) * 0.03],
          [Math.sin(a2) * 0.1, 2.3, Math.cos(a2) * 0.1],
          0.082,
        ),
      );
    }
    k.body('rolls', sdf.union(sdf.smoothUnion(0.028, ...knot), ...rolls).paintFn(thatchPaint), {
      color: C.thatch,
      roughness: 0.9,
      detail: 0.015,
      maxError: 0.006,
      maxTriangles: 3600,
    });

    // ---------------------------------------------------------------- door
    k.body(
      'reveal',
      sdf.extrude(archProfile(DOOR_HALF + 0.012, DOOR_BOT - 0.01, DOOR_SPRING), 0.04, 0.006).at(0, 0, DOOR_Z - 0.04),
      { color: C.void, roughness: 0.95, detail: 0.014, maxError: 0.006, maxTriangles: 80 },
    );

    k.body(
      'door',
      sdf
        .extrude(archProfile(DOOR_HALF - 0.006, DOOR_BOT + 0.01, DOOR_SPRING), DOOR_D, 0.016)
        .at(0, 0, DOOR_Z)
        .paintFn(plankPaint),
      {
        color: C.door,
        roughness: 0.8,
        detail: 0.01,
        maxError: 0.004,
        maxTriangles: 600,
        paintWeight: 2,
        textureDensity: 2,
        bump: (x, y) => {
          const plank = 0.125;
          const f = x / plank - Math.floor(x / plank);
          const g = Math.pow(0.5 + 0.5 * Math.cos(f * Math.PI * 2), 4);
          return -0.004 * g + 0.001 * noise.fbm(x * 8, y * 14, 0, 2);
        },
      },
    );

    k.body(
      'frame',
      sdf
        .extrude(archProfile(DOOR_HALF + 0.065, DOOR_BOT - 0.02, DOOR_SPRING), FRAME_D, 0.016)
        .at(0, 0, FRAME_Z)
        .subtract(sdf.extrude(archProfile(DOOR_HALF + 0.006, DOOR_BOT, DOOR_SPRING), 0.7).at(0, 0, FRAME_Z))
        .paintFn((x, y) => mixRgb(C.frame, C.frameDark, 0.16 * (0.5 + 0.5 * noise.fbm(x * 4, y * 5, 0, 2)))),
      {
        color: C.frame,
        roughness: 0.82,
        detail: 0.011,
        maxError: 0.004,
        maxTriangles: 380,
        textureDensity: 2,
      },
    );

    const ironZ = DOOR_Z + DOOR_D / 2 - 0.004;
    const hinge = (y: number) =>
      sdf.union(
        sdf.box([0.24, 0.052, 0.03], 0.012).at(0.16, y, ironZ),
        sdf.cylinder(0.032, 0.095, 0.008).at(0.33, y, ironZ),
      );
    const latch = sdf.union(
      sdf.box([0.075, 0.14, 0.028], 0.011).at(-0.2, 0.52, ironZ),
      sdf.torus(0.034, 0.01).rotateX(90).at(-0.2, 0.45, ironZ + 0.022),
    );
    k.body('iron', sdf.union(hinge(0.4), hinge(0.68), latch), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.72,
      detail: 0.008,
      maxError: 0.003,
      maxTriangles: 300,
    });
  },
});
