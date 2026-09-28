import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Round stone watchtower, 6 m tall and 2.4 m wide (catalog `architecture/structure/tower`).
 *
 * Role: hamlet landmark on the village map; must read at 128 px. No rig, no clips.
 * Size: body diameter 2.4 m, ~6.0 m to the flag tip, on y = 0, front toward +Z.
 * One idea: a chunky cream-stone tower swallowed at the base by big round boulders, wearing a
 *   swirling red cone roof with a green flag — the mockup's soft clay charm.
 * Shape language: round and soft (boulders, curved cone); one tapered cylinder core.
 * Palette: stone cream #c9bda2 / tan #b5a37f / gray #a39a8c, mortar #6f6759; roof red #b34a33,
 *   dark #8e3524, deep #5f1d12; door honey oak #b5814a / warm brown #8a5a35 / walnut #6b4226;
 *   iron #4a4f55; flag leaf green #5cb85c.
 * Materials: stone body (0.9), boulder base (0.92), light stone trim (0.88), red tile roof (0.8),
 *   wood door (0.8), worn iron (0.5, metal 0.7), dark glass with faint warm emissive, cloth flag (0.85).
 * Detail list: (1) tapered stone body, (2) boulder ring footing, (3) red spiral-tile cone + flag,
 *   (4) arched plank door + stone arch + iron straps + ring, (5) two small arched windows.
 * Focal point: the door; accent: the glowing windows and green flag.
 */

const C = {
  stone: rgb('#c9bda2'),
  stoneTan: rgb('#b5a37f'),
  stoneGray: rgb('#a39a8c'),
  mortar: rgb('#6f6759'),
  trim: rgb('#d9cdb2'),
  trimDark: rgb('#b8ab8e'),
  roof: rgb('#b34a33'),
  roofDark: rgb('#8e3524'),
  roofDeep: rgb('#5f1d12'),
  oak: rgb('#b5814a'),
  oakDark: rgb('#8a5a35'),
  walnut: rgb('#6b4226'),
  iron: rgb('#4a4f55'),
  ironDark: rgb('#363a3f'),
  void: rgb('#241410'),
  glow: rgb('#ffb347'),
  flag: rgb('#5cb85c'),
  flagDark: rgb('#3f8f3f'),
};

const WALL_TOP = 4.5;
const ROOF_APEX = 5.88;
const ROOF_ROW = 0.135;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Arch in XY: flat bottom, half-round top of radius halfW springing at `spring`. */
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

/** Laid-stone paint: mortar in the worley gaps, a warm or gray tint per cell. */
const stonePaint =
  (base: (typeof C)['stone'], scale: number, seed: number) => (x: number, y: number, z: number) => {
    const { f1, f2, id } = noise.worley(x * scale, y * scale * 0.65, z * scale, seed);
    const gap = sstep(0.05, 0.14, f2 - f1);
    let c = mixRgb(base, C.stoneTan, 0.5 * noise.random(id, seed + 1));
    if (noise.random(id, seed + 2) > 0.7) c = mixRgb(c, C.stoneGray, 0.6);
    return mixRgb(c, C.mortar, 0.78 * (1 - gap));
  };

const stoneBump = (scale: number, seed: number) => (x: number, y: number, z: number) => {
  const { f1, f2 } = noise.worley(x * scale, y * scale * 0.65, z * scale, seed);
  return -0.005 * (1 - sstep(0.05, 0.14, f2 - f1)) + 0.002 * noise.fbm(x * 18, y * 18, z * 18, 2);
};

/** Vertical plank paint for the door leaf. */
const plankPaint = (x: number, y: number) => {
  const plank = 0.125;
  const f = x / plank - Math.floor(x / plank);
  const g = Math.pow(0.5 + 0.5 * Math.cos(f * Math.PI * 2), 4);
  const board = noise.random(Math.floor(x / plank + 9), 2);
  const grain = 0.5 + 0.5 * noise.fbm(x * 5, y * 12, 0, 2);
  return mixRgb(mixRgb(C.oak, C.oakDark, 0.1 + 0.26 * board + 0.08 * grain), C.walnut, 0.6 * g);
};

const plankBump = (x: number, y: number) => {
  const plank = 0.125;
  const f = x / plank - Math.floor(x / plank);
  return -0.004 * Math.pow(0.5 + 0.5 * Math.cos(f * Math.PI * 2), 4) + 0.001 * noise.fbm(x * 8, y * 14, 0, 2);
};

export default defineAsset({
  name: 'tower',
  description:
    'A round cream-stone watchtower with a boulder footing, an arched oak door, two small glowing windows, a swirling red tile cone roof, and a green flag.',
  detail: 0.016,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/tower-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- boulder footing
    const stones = [sdf.cylinder(1.3, 0.22, 0.05).at(0, 0.11, 0)];
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + noise.random(i, 4) * 0.3;
      const r = 0.27 + 0.07 * noise.random(i, 5);
      const d = 1.22 + 0.1 * noise.random(i, 6);
      stones.push(
        sdf
          .ellipsoid([r * 1.15, r * 0.95, r])
          .rotateY((a * 180) / Math.PI + 30 * noise.random(i, 7))
          .at(Math.sin(a) * d, 0.16 + 0.1 * noise.random(i, 8), Math.cos(a) * d),
      );
    }
    k.body('footing', sdf.smoothUnion(0.06, ...stones).paintFn(stonePaint(C.stone, 4.2, 3)), {
      color: C.stone,
      roughness: 0.92,
      detail: 0.03,
      maxError: 0.01,
      maxTriangles: 1500,
      bump: stoneBump(4.2, 3),
    });

    // ---------------------------------------------------------------- tapered stone body
    const body = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.4],
            [0.9, 0.42],
            [1.16, 0.5],
            [1.2, 0.78],
            [1.17, 1.4],
            [1.13, 2.2],
            [1.09, 3.0],
            [1.06, 3.8],
            [1.04, 4.28],
            [1.1, 4.42],
            [1.13, 4.52],
            [0, 4.55],
          ],
          { smooth: true },
        ),
      )
      .round(0.02)
      .paintFn(stonePaint(C.stone, 6.5, 12));
    k.body('body', body, {
      color: C.stone,
      roughness: 0.9,
      detail: 0.02,
      maxError: 0.006,
      maxTriangles: 2400,
      bump: stoneBump(6.5, 12),
    });

    // ---------------------------------------------------------------- red tile cone roof
    const roof = sdf
      .revolve(
        profile.polygon(
          [
            [1.52, 4.4],
            [1.28, 4.54],
            [1.0, 4.8],
            [0.74, 5.14],
            [0.5, 5.46],
            [0.28, 5.68],
            [0.08, 5.82],
            [0, 5.88],
            [0, 5.68],
            [0.16, 5.6],
            [0.38, 5.38],
            [0.64, 5.04],
            [0.9, 4.72],
            [1.16, 4.48],
            [1.32, 4.34],
          ],
          { smooth: true },
        ),
      )
      .round(0.02)
      .paintFn((x, y, z) => {
        const row = (ROOF_APEX - y) / ROOF_ROW;
        const rf = row - Math.floor(row);
        const a = Math.atan2(x, z);
        const u = (a / (Math.PI * 2)) * 16 + Math.floor(row) * 0.45;
        const g = u - Math.floor(u);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(g * Math.PI * 2), 6);
        const rowSeam = Math.pow(0.5 + 0.5 * Math.cos(rf * Math.PI * 2), 5);
        const tint = noise.random(Math.floor(u) * 7 + Math.floor(row) * 13, 5);
        let c = mixRgb(C.roof, C.roofDark, 0.12 + 0.3 * tint);
        c = mixRgb(c, C.roofDeep, 0.75 * Math.max(seam, rowSeam * 0.8));
        return mixRgb(c, C.roofDeep, 0.3 * sstep(4.62, 4.44, y));
      });
    k.body(
      'roof',
      roof,
      {
        color: C.roof,
        roughness: 0.8,
        detail: 0.024,
        maxError: 0.008,
        maxTriangles: 1400,
        textureDensity: 2,
        bump: (x, y, z) => {
          const row = (ROOF_APEX - y) / ROOF_ROW;
          const rf = row - Math.floor(row);
          const ramp = rf < 0.85 ? rf / 0.85 : (1 - rf) / 0.15;
          const a = Math.atan2(x, z);
          const u = (a / (Math.PI * 2)) * 16 + Math.floor(row) * 0.45;
          const g = u - Math.floor(u);
          const seam = g < 0.08 || g > 0.92 ? -0.004 : 0;
          return 0.01 * ramp + seam + 0.002 * noise.noise3(x * 22, y * 22, z * 22);
        },
      },
    );

    // ---------------------------------------------------------------- flag
    const pole = sdf.capsule([0, 5.6, 0], [0, 6.0, 0], 0.024);
    k.body('flag-pole', pole, { color: C.walnut, roughness: 0.8, detail: 0.008, maxTriangles: 120 });

    const flag = sdf
      .box([0.36, 0.2, 0.016], 0.006)
      .at(0.21, 5.86, 0)
      .displace(0.012, (x, y, z) => Math.sin(x * 9 + y * 5) * Math.max(0, x / 0.4))
      .paintFn((x, y, z, base) => mixRgb(base, C.flagDark, 0.4 * sstep(0.28, 0.4, x)));
    k.body('flag', flag, { color: C.flag, roughness: 0.85, detail: 0.007, maxTriangles: 300, paintWeight: 2 });

    // ---------------------------------------------------------------- door
    const DOOR_HALF = 0.34;
    const DOOR_BOT = 0.1;
    const DOOR_SPRING = 1.15;
    const doorZ = 1.13;

    k.body(
      'door-reveal',
      sdf.extrude(archProfile(DOOR_HALF + 0.012, DOOR_BOT - 0.01, DOOR_SPRING), 0.12, 0.008).at(0, 0, doorZ),
      { color: C.void, roughness: 0.95, detail: 0.014, maxError: 0.006, maxTriangles: 120 },
    );

    k.body(
      'door',
      sdf
        .extrude(archProfile(DOOR_HALF - 0.008, DOOR_BOT + 0.012, DOOR_SPRING), 0.09, 0.014)
        .at(0, 0, doorZ + 0.03)
        .paintFn(plankPaint),
      {
        color: C.oak,
        roughness: 0.8,
        detail: 0.01,
        maxError: 0.004,
        maxTriangles: 600,
        paintWeight: 2,
        textureDensity: 2,
        bump: plankBump,
      },
    );

    // Stone step in front of the door.
    const step = sdf.box([0.98, 0.15, 0.44], 0.03).at(0, 0.075, 1.3);

    // ---------------------------------------------------------------- windows (front + back)
    const windowAt = (zs: 1 | -1, cy: number) => {
      const wz = 1.07 * zs;
      const reveal = sdf
        .extrude(archProfile(0.135, cy - 0.17, cy + 0.03), 0.12, 0.006)
        .at(0, 0, wz);
      const glass = sdf
        .extrude(archProfile(0.112, cy - 0.15, cy + 0.035), 0.05, 0.004)
        .at(0, 0, wz + 0.045 * zs);
      const frame = sdf
        .extrude(archProfile(0.19, cy - 0.21, cy + 0.03), 0.18, 0.012)
        .at(0, 0, wz - 0.02 * zs)
        .subtract(sdf.extrude(archProfile(0.135, cy - 0.165, cy + 0.032), 0.6).at(0, 0, wz));
      return { reveal, glass, frame };
    };
    const winF = windowAt(1, 2.9);
    const winB = windowAt(-1, 3.2);

    k.body(
      'window-reveals',
      sdf.union(winF.reveal, winB.reveal),
      { color: C.void, roughness: 0.95, detail: 0.014, maxError: 0.006, maxTriangles: 160 },
    );
    k.body(
      'window-glass',
      sdf.union(winF.glass, winB.glass),
      {
        color: C.void,
        roughness: 0.2,
        emissive: C.glow,
        emissiveIntensity: 0.55,
        detail: 0.012,
        maxError: 0.005,
        maxTriangles: 160,
      },
    );

    // Light stone trim: both window frames, the door arch, and the step.
    const doorFrame = sdf
      .extrude(archProfile(DOOR_HALF + 0.09, DOOR_BOT - 0.03, DOOR_SPRING), 0.22, 0.016)
      .at(0, 0, 1.02)
      .subtract(sdf.extrude(archProfile(DOOR_HALF + 0.004, DOOR_BOT, DOOR_SPRING), 0.8).at(0, 0, 1.1));
    k.body(
      'trim',
      sdf
        .union(winF.frame, winB.frame, doorFrame, step)
        .paintFn((x, y, z, base) => mixRgb(base, C.trimDark, 0.22 * (0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2)))),
      {
        color: C.trim,
        roughness: 0.88,
        detail: 0.011,
        maxError: 0.004,
        maxTriangles: 800,
        textureDensity: 2,
        bump: (x, y, z) => 0.003 * noise.fbm(x * 16, y * 16, z * 16, 2),
      },
    );

    // ---------------------------------------------------------------- iron door furniture
    const ironZ = doorZ + 0.085;
    const strap = (y: number) => sdf.box([0.6, 0.055, 0.028], 0.012).at(0, y, ironZ);
    const ring = sdf
      .torus(0.05, 0.014)
      .rotateX(90)
      .at(0.17, 0.82, ironZ + 0.02)
      .union(sdf.sphere(0.024).at(0.17, 0.9, ironZ));
    k.body(
      'iron',
      sdf.union(strap(0.5), strap(0.98), ring).paintFn((x, y, z, base) =>
        mixRgb(base, C.ironDark, 0.35 * (0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2))),
      ),
      { color: C.iron, roughness: 0.5, metalness: 0.7, detail: 0.008, maxError: 0.003, maxTriangles: 300 },
    );
  },
});
