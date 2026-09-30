import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note - cottage (catalog `architecture/structure/cottage`), reworked to the village mockup.
 * Role: hamlet home seen small in the village; static, no rig. Must read at 128 px.
 * Size: 2.6 x 2.33 x 2.48 m (X by Y by Z) with roof, chimney and shrubs; on y = 0, gable and door face +Z.
 * One idea: a whitewashed half-timber box under one thick golden thatch roof with scalloped, drooping eaves.
 * Shape language: round and soft (thatch), square secondary (plaster box, timber frame).
 * Palette: plaster #efe8d8, timber #5a3a22, thatch #c89b4a / underside #a07a38, door wood #8a5a35,
 *   stone #9a9082, iron #3d4047, leaves green.
 * Materials: plaster (0.9), timber (0.8), thatch (0.95, straw in bump), plank door and shutters (0.8),
 *   stone chimney and footing (0.9), iron (metal 0.7), glass (emissive hint).
 * Details: corner posts, sill and top beams, diagonal braces on all four walls; plank door with X brace
 *   (focal); two front windows, one window on each side and the back; stone chimney; two shrubs.
 */

const W = 2.0;
const D = 1.8;
const FOUND = 0.18;
const EAVE = 1.32;
const RIDGE = 2.12;
const FRONT = D / 2;
const ROOF_HALF = W / 2 + 0.3;
const ROOF_OVER_Z = D / 2 + 0.3;
const ROOF_EAVE_Y = EAVE - 0.12;
const APEX_Y = RIDGE + 0.08;
const ROOF_DROP = 0.27;
const SLOPE = (APEX_Y - ROOF_EAVE_Y) / ROOF_HALF;

const C = {
  plaster: rgb('#efe8d8'),
  plasterDark: rgb('#d6cbb2'),
  timber: rgb('#5a3a22'),
  timberLight: rgb('#7a5030'),
  thatch: rgb('#c89b4a'),
  thatchUnder: rgb('#a07a38'),
  thatchLight: rgb('#dcb35e'),
  wood: rgb('#8a5a35'),
  woodDark: rgb('#5f3a1c'),
  iron: rgb('#3d4047'),
  void: rgb('#241110'),
  glass: rgb('#3a4a5a'),
  stone: rgb('#9a9082'),
  stoneDark: rgb('#6f6759'),
  creamDark: rgb('#c9b795'),
  tan: rgb('#b9a98a'),
  leafDark: rgb('#2f6b3a'),
  leafMid: rgb('#4a9a4e'),
  leafLime: rgb('#8ede4f'),
};

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
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


/** Window at the local origin on a wall plane z = 0 facing +Z: returns frame, glass, shutters. */
const windowParts = () => {
  const frame = sdf
    .box([0.38, 0.4, 0.06], 0.012)
    .subtract(sdf.box([0.26, 0.28, 0.4]))
    .at(0, 0, 0.02);
  const mull = sdf.union(
    sdf.box([0.27, 0.03, 0.03], 0.008).at(0, 0, 0.03),
    sdf.box([0.03, 0.29, 0.03], 0.008).at(0, 0, 0.03),
  );
  const glass = sdf.box([0.28, 0.3, 0.04], 0.01).at(0, 0, -0.01);
  const shutters = sdf.box([0.11, 0.32, 0.04], 0.015).at(0.235, 0, 0.03).mirror('x', 0);
  return { frame: sdf.union(frame, mull), glass, shutters };
};
const place = (s: ReturnType<typeof sdf.sphere>, x: number, y: number, z: number, rotY: number) =>
  s.rotateY(rotY).at(x, y, z);

export default defineAsset({
  name: 'cottage',
  description:
    'Chibi half-timber cottage: white plaster walls in a dark timber frame, thick golden thatch roof with scalloped eaves, plank door with X brace, shuttered windows on every wall, stone chimney.',
  detail: 0.016,
  texture: { size: 1024 },
  reference: 'docs/village-mockups/village-quest_001.jpg',

  build(k) {
    // ---------------------------------------------------------------- foundation
    const foundation = sdf
      .box([W + 0.12, FOUND, D + 0.12], 0.03)
      .at(0, FOUND / 2, 0)
      .paintFn((x, y, z, base) => mixRgb(base, C.stoneDark, 0.3 * Math.max(0, noise.fbm(x * 10, y * 3, z * 10, 2))));
    k.body('foundation', foundation, {
      color: C.tan,
      roughness: 0.9,
      detail: 0.022,
      maxError: 0.006,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- plaster walls
    const wallProfile = profile.polygon([
      [-W / 2, FOUND],
      [W / 2, FOUND],
      [W / 2, EAVE],
      [0, RIDGE],
      [-W / 2, EAVE],
    ]);
    const walls = sdf.extrude(wallProfile, D, 0.04).displace(0.008, (x, y, z) => noise.fbm(x * 2.5, y * 2.5, z * 2.5, 2));
    k.body(
      'walls',
      walls.paintFn((x, y, z, base) => mixRgb(base, C.plasterDark, 0.25 * (0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2)))),
      {
        color: C.plaster,
        roughness: 0.92,
        detail: 0.014,
        maxError: 0.004,
        bump: (x, y, z) => 0.004 * noise.fbm(x * 18, y * 18, z * 18, 3),
      },
    );

    // ---------------------------------------------------------------- timber frame
    const T = 0.04; // timber plane offset from the wall
    const POST = 0.12;
    const posts = sdf
      .box([POST, EAVE - FOUND + 0.02, POST], 0.02)
      .at(W / 2 - 0.02, (EAVE + FOUND) / 2, D / 2 - 0.02)
      .mirror('x', 0)
      .mirror('z', 0);
    const sillY = FOUND + 0.05;
    const topY = EAVE - 0.06;
    // Beams around the four faces.
    const beamsZ = sdf
      .union(
        sdf.box([W + 0.04, 0.1, 0.07], 0.015).at(0, sillY, FRONT + 0.005),
        sdf.box([W + 0.04, 0.1, 0.07], 0.015).at(0, topY, FRONT + 0.005),
        sdf.box([0.07, 0.1, 0.07], 0.01).at(0, 0, 0), // placeholder removed below
      )
      .mirror('z', 0);
    void beamsZ;
    const faceBeams = sdf
      .union(
        sdf.box([W + 0.04, 0.1, 0.07], 0.015).at(0, sillY, FRONT + 0.005),
        sdf.box([W + 0.04, 0.1, 0.07], 0.015).at(0, topY, FRONT + 0.005),
      )
      .mirror('z', 0);
    const sideBeams = sdf
      .union(
        sdf.box([0.07, 0.1, D + 0.04], 0.015).at(W / 2 + 0.005, sillY, 0),
        sdf.box([0.07, 0.1, D + 0.04], 0.015).at(W / 2 + 0.005, topY, 0),
      )
      .mirror('x', 0);
    // Gable: tie beam and a king post with two short braces under the roof edge.
    const gable = sdf
      .union(
        sdf.box([0.08, RIDGE - EAVE, 0.07], 0.012).at(0, (RIDGE + EAVE) / 2, FRONT + 0.005),
        sdf.capsule([0, EAVE + 0.1, FRONT + 0.02], [-0.34, EAVE + 0.02, FRONT + 0.02], 0.03),
        sdf.capsule([0, EAVE + 0.1, FRONT + 0.02], [0.34, EAVE + 0.02, FRONT + 0.02], 0.03),
      )
      .mirror('z', 0);
    const brace = (a: [number, number, number], b: [number, number, number]) => sdf.capsule(a, b, 0.031);
    const braces: ReturnType<typeof brace>[] = [];
    for (const sx of [-1, 1]) {
      // Front and back: knee braces above the windows, from the corner post.
      for (const sz of [-1, 1]) {
        braces.push(brace([sx * 0.93, topY - 0.02, sz * (FRONT + T - 0.02)], [sx * 0.6, 1.02, sz * (FRONT + T - 0.02)]));
      }
    }
    for (const sz of [-1, 1]) {
      // Side walls (x = +-W/2): diagonals framing a central window.
      for (const sx of [-1, 1]) {
        braces.push(brace([sx * (W / 2 + T - 0.02), topY - 0.02, sz * 0.82], [sx * (W / 2 + T - 0.02), 0.46, sz * 0.36]));
      }
    }
    // Back wall: window in the middle, braces on both sides, plus a vertical stud at each side of it.
    for (const sx of [-1, 1]) {
      braces.push(brace([sx * 0.93, sillY + 0.04, -(FRONT + T - 0.02)], [sx * 0.46, topY - 0.02, -(FRONT + T - 0.02)]));
    }
    const studs = sdf
      .box([0.07, topY - sillY, 0.06], 0.012)
      .at(0.38, (topY + sillY) / 2, FRONT + 0.005)
      .mirror('x', 0)
      .union(
        sdf
          .box([0.06, topY - sillY, 0.07], 0.012)
          .at(W / 2 + 0.005, (topY + sillY) / 2, 0.4)
          .mirror('z', 0),
      );
    void studs;
    // Door frame (timber).
    const DOOR_W = 0.56;
    const DOOR_TOP = 1.08;
    const doorFrame = sdf
      .box([DOOR_W + 0.16, DOOR_TOP - FOUND + 0.08, 0.07], 0.015)
      .subtract(sdf.box([DOOR_W + 0.01, DOOR_TOP - FOUND, 0.4]).at(0, -0.04, 0))
      .at(0, (DOOR_TOP + FOUND) / 2 + 0.04, FRONT + 0.005);
    const timberAll = sdf
      .union(posts, faceBeams, sideBeams, gable, doorFrame, ...braces)
      .paintFn((x, y, z, base) => mixRgb(base, C.timberLight, 0.35 * (0.5 + 0.5 * noise.fbm(x * 6, y * 20, z * 6, 2))));
    k.body('timber', timberAll, {
      color: C.timber,
      roughness: 0.8,
      detail: 0.01,
      maxError: 0.004,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 8, y * 30, z * 8, 2),
    });

    // ---------------------------------------------------------------- windows (front x2, sides, back)
    const WY = 0.82;
    const wp = windowParts();
    const spots: [number, number, number, number][] = [
      [-0.66, WY, FRONT, 0],
      [0.66, WY, FRONT, 0],
      [W / 2, WY, 0, 90],
      [-W / 2, WY, 0, -90],
      [0, WY, -FRONT, 180],
    ];
    k.body('window-frames', sdf.union(...spots.map(([x, y, z, r]) => place(wp.frame, x, y, z, r))), {
      color: C.timber, roughness: 0.8, detail: 0.008, maxError: 0.003,
    });
    k.body('window-glass', sdf.union(...spots.map(([x, y, z, r]) => place(wp.glass, x, y, z, r))), {
      color: C.glass, roughness: 0.2, emissive: rgb('#ffbf6b'), emissiveIntensity: 0.25, detail: 0.01,
    });
    k.body('shutters', sdf.union(...spots.map(([x, y, z, r]) => place(wp.shutters, x, y, z, r))), {
      color: C.wood, roughness: 0.8, detail: 0.008, maxError: 0.003,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 8, z * 30, 2),
    });

    // ---------------------------------------------------------------- door
    const doorH = DOOR_TOP - FOUND;
    const door = sdf.box([DOOR_W, doorH, 0.05], 0.012).at(0, FOUND + doorH / 2, FRONT + 0.005);
    k.body(
      'door',
      door.paintFn((x, y, z, base) => {
        const f = (x + 0.28) / 0.14;
        const g = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
        return mixRgb(base, C.woodDark, 0.6 * g);
      }),
      {
        color: C.wood, roughness: 0.8, detail: 0.008, maxError: 0.003,
        bump: (x, y, z) => -0.003 * Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * ((x + 0.28) / 0.14)), 6),
      },
    );
    const zb = FRONT + 0.035;
    const xbrace = sdf.union(
      sdf.capsule([-0.23, FOUND + 0.06, zb], [0.23, DOOR_TOP - 0.06, zb], 0.028),
      sdf.capsule([0.23, FOUND + 0.06, zb], [-0.23, DOOR_TOP - 0.06, zb], 0.028),
      sdf.box([DOOR_W - 0.04, 0.06, 0.03], 0.01).at(0, FOUND + 0.06, zb),
      sdf.box([DOOR_W - 0.04, 0.06, 0.03], 0.01).at(0, DOOR_TOP - 0.06, zb),
    );
    k.body('door-brace', xbrace, { color: C.timber, roughness: 0.8, detail: 0.008, maxError: 0.003 });
    const handle = sdf.torus(0.035, 0.012).rotateX(90).at(0.18, 0.62, FRONT + 0.06);
    k.body('handle', handle, { color: C.iron, roughness: 0.5, metalness: 0.7, detail: 0.008 });

    // ---------------------------------------------------------------- thatch roof
    const roofProfile = profile.polygon([
      [-ROOF_HALF, ROOF_EAVE_Y],
      [0, APEX_Y],
      [ROOF_HALF, ROOF_EAVE_Y],
      [ROOF_HALF, ROOF_EAVE_Y - ROOF_DROP],
      [0, APEX_Y - ROOF_DROP],
      [-ROOF_HALF, ROOF_EAVE_Y - ROOF_DROP],
    ]);
    const slab = sdf.extrude(roofProfile, ROOF_OVER_Z * 2, 0.07);
    const ridge = sdf.capsule([0, APEX_Y - 0.04, -ROOF_OVER_Z + 0.06], [0, APEX_Y - 0.04, ROOF_OVER_Z - 0.06], 0.085);
    const scallops: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 9; i++) {
      const z = -1.05 + i * 0.2625;
      for (const sx of [-1, 1]) {
        scallops.push(sdf.ellipsoid([0.1, 0.12, 0.13]).at(sx * (ROOF_HALF - 0.12), ROOF_EAVE_Y - ROOF_DROP - 0.03, z));
      }
    }
    for (let i = 0; i < 6; i++) {
      const x = 0.15 + i * 0.2;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const px = sx * x;
          const y = APEX_Y - Math.abs(px) * SLOPE - ROOF_DROP - 0.03;
          scallops.push(sdf.ellipsoid([0.11, 0.12, 0.1]).at(px, y, sz * (ROOF_OVER_Z - 0.1)));
        }
      }
    }
    const thatch = sdf.smoothUnion(0.045, slab, ridge, ...scallops);
    const topAt = (x: number) => APEX_Y - Math.abs(x) * SLOPE;
    k.body(
      'thatch',
      thatch.paintFn((x, y, z, base) => {
        const below = topAt(x) - y;
        const row = (below * 4.4) % 1;
        const under = sstep(0.1, 0.24, below);
        let c = mixRgb(C.thatch, C.thatchLight, 0.5 * (0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2)) * (1 - under));
        c = mixRgb(c, C.thatchUnder, 0.3 * Math.pow(row, 3) * (1 - under));
        return mixRgb(c, C.thatchUnder, 0.85 * under);
      }),
      {
        color: C.thatch,
        roughness: 0.95,
        detail: 0.02,
        maxError: 0.007,
        textureDensity: 2,
        bump: (x, y, z) => {
          const s = (topAt(x) - y) * 4.4;
          const f = s - Math.floor(s);
          return 0.006 * f + 0.004 * noise.fbm(x * 16, y * 10, z * 50, 2);
        },
      },
    );

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

  },
});
