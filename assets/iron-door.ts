import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/building-parts/iron-door
 *
 * Role: the dungeon door module for the Sunken Vault wall tiles; it fills a 0.84 x 1.86 m
 *   arched doorway and must read at 128 px. Background building part, torch-lit.
 * Size: frame 1.2 wide x 2.0 tall x 0.4 deep. Stands on y = 0, centred on the Y axis,
 *   front face toward +Z.
 * One idea: a heavy riveted iron plate door sunk deep in a chunky arched stone frame —
 *   the warm glow behind its barred window and the big old-gold ring handle are the reads.
 * Shape language: square and sturdy (dominant iron plates, stone blocks) with a round
 *   arch secondary and small round rivets.
 * Palette: dungeon stone cool gray #6f7680 / dark #4b525c (dominant), iron #4a4f55 /
 *   #363a3f with worn highlight #a8acb1 (secondary), old gold #d4a93a and torch glow
 *   #ff9a3c (small accents at the focal point).
 * Materials: one stone body (roughness 0.9), one iron leaf body (0.5 / 0.7), one iron
 *   fittings body (0.5 / 0.7), one gold body (0.3 / 1), one emissive window body.
 * Detail list: stone backing ring + jamb blocks + arch voussoirs + keystone + threshold
 *   (big); iron leaf with plate seams, two cross bands with rivets, barrel hinges, barred
 *   window with frame (medium); worley mortar, plate wear, gold grain (small).
 * Rig/animation: none — a closed door, a static building part.
 */

const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#4b525c');
const STONE_LIGHT = rgb('#8b929c');
const MORTAR = rgb('#3a4048');

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#8f6b1f');

const EMBER = rgb('#ff9a3c');
const EMBER_BASE = rgb('#4a1405');

// ---------------------------------------------------------------- layout
const OUTER_HALF_W = 0.58; // frame outer half width (1.16 m + proud blocks ≈ 1.2 m)
const OUTER_SPRING = 1.42; // where the outer arch starts
const INNER_HALF_W = 0.415; // door leaf half width
const OPEN_HALF_W = 0.42; // clear opening half width
const SPRING = 1.44; // inner arch spring line; apex = 1.86, frame apex = 2.0
const LEAF_BOT = 0.02;
const LEAF_Z = 0.03; // leaf centre; front face 0.075, recessed 0.125 in the frame
const FRAME_FRONT = 0.19; // ring front face; blocks and threshold sit at/proud of it

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const sstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((e1 - e0) === 0 ? 0 : (v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const fract = (v: number): number => v - Math.floor(v);

/** Arched outline in XY: rectangle from `bot` to `spring`, half-round top of radius `halfW`. */
const archOutline = (halfW: number, bot: number, spring: number) => {
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

// ---------------------------------------------------------------- paints
/** Cool laid-stone paint: worley cells with dark mortar seams, a tint per cell. */
const stonePaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const { f1, f2, id } = noise.worley(x * 4.5, y * 5, z * 4.5, 3);
  const gap = sstep(0.06, 0.17, f2 - f1);
  const tint = noise.random(id, 7);
  let c = mixRgb(STONE, STONE_DARK, 0.2 + 0.38 * tint);
  const patch = 0.5 + 0.5 * noise.fbm(x * 2.2, y * 2.2, z * 2.2, 3);
  c = mixRgb(c, STONE_DARK, clamp01(patch - 0.55) * 0.45);
  c = mixRgb(c, STONE_LIGHT, clamp01(0.42 - patch) * 0.35);
  c = mixRgb(c, MORTAR, (1 - gap) * 0.72);
  c = mixRgb(c, MORTAR, sstep(0.12, 0.02, y) * 0.4); // ground grime
  return c;
};

const stoneBump = (x: number, y: number, z: number): number => {
  const { f1, f2 } = noise.worley(x * 4.5, y * 5, z * 4.5, 3);
  return -0.005 * (1 - sstep(0.06, 0.17, f2 - f1)) + 0.002 * noise.fbm(x * 18, y * 18, z * 18, 2);
};

// Iron door leaf: big plates in a grid, dark seams, sparse worn highlights.
const PLATE_W = 0.2075; // 4 columns across the 0.83 m leaf
const PLATE_H = 0.36;
const seamMask = (f: number): number => sstep(0.09, 0.02, Math.min(f, 1 - f));

const ironPlatePaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const cx = Math.floor((x + PLATE_W / 2) / PLATE_W);
  const cy = Math.floor((y - LEAF_BOT + PLATE_H / 2) / PLATE_H);
  const fx = fract((x + PLATE_W / 2) / PLATE_W);
  const fy = fract((y - LEAF_BOT + PLATE_H / 2) / PLATE_H);
  const plateTint = noise.random(cx * 7.1, cy * 3.3, 5);
  let c = mixRgb(IRON, IRON_DARK, 0.28 + 0.3 * plateTint);
  const wear = 0.5 + 0.5 * noise.fbm(x * 17, y * 17, z * 17, 3);
  c = mixRgb(c, IRON_HI, 0.32 * sstep(0.74, 0.95, wear));
  c = mixRgb(c, IRON_DARK, 0.85 * Math.max(seamMask(fx), seamMask(fy)));
  c = mixRgb(c, IRON_DARK, sstep(0.1, 0.02, y) * 0.35); // grime at the foot
  return c;
};

const ironPlateBump = (x: number, y: number, z: number): number =>
  -0.0022 * Math.max(
    seamMask(fract((x + PLATE_W / 2) / PLATE_W)),
    seamMask(fract((y - LEAF_BOT + PLATE_H / 2) / PLATE_H)),
  ) + 0.0009 * noise.fbm(x * 40, y * 40, z * 40, 2);

/** Plain worn iron for bands, hinges, bars, and the window frame. */
const ironWear = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 3);
  let c = mixRgb(IRON_DARK, IRON, 0.3 + 0.55 * n);
  c = mixRgb(c, IRON_HI, 0.3 * sstep(0.72, 0.95, n));
  return c;
};

const goldPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
  return mixRgb(GOLD_DARK, GOLD, 0.45 + 0.55 * n);
};

// ---------------------------------------------------------------- build
export default defineAsset({
  name: 'iron-door',
  description:
    'Dungeon iron door with its stone frame: a 1.2 m wide, 2.0 m tall arched frame of ' +
    'chunky gray stone blocks around a heavy riveted iron plate door with a small barred ' +
    'window glowing warm from inside, a big old-gold ring handle, and barrel hinges.',
  detail: 0.01,
  reference: 'docs/item-mockups/iron-door-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ stone frame
    // Dark backing ring (the mortar bed), chunky jamb blocks, arch voussoirs with a
    // keystone, and a worn threshold step. One stone body.
    const outer = sdf.extrude(archOutline(OUTER_HALF_W, 0, OUTER_SPRING), 0.38);
    const innerCut = sdf.extrude(archOutline(OPEN_HALF_W, -0.06, SPRING), 0.6);
    const ring = outer.subtract(innerCut);

    const blocks: Sdf[] = [];
    const jambRows: [number, number][] = [
      [0, 0.5],
      [0.47, 0.97],
      [0.94, 1.44],
    ];
    jambRows.forEach(([y0, y1], i) => {
      for (const side of [-1, 1] as const) {
        const jx = (noise.random(i, side * 3 + 5) - 0.5) * 0.024;
        const jy = (noise.random(i, side * 7 + 2) - 0.5) * 0.024;
        const s = 0.97 + noise.random(i, side + 11) * 0.06;
        const rz = (noise.random(i, side + 17) - 0.5) * 4;
        blocks.push(
          sdf
            .box([0.24 * s, (y1 - y0) * s, 0.34], 0.025)
            .rotateZ(rz)
            .at(side * 0.53 + jx, (y0 + y1) / 2 + jy, 0.02),
        );
      }
    });

    const ARCH_R = 0.5;
    for (const aDeg of [12, 38, 64, 90, 116, 142, 168]) {
      const a = (aDeg * Math.PI) / 180;
      const i = aDeg / 26;
      const s = 0.96 + noise.random(i, 21) * 0.08;
      const big = aDeg === 90 ? 1.18 : 1; // the keystone
      blocks.push(
        sdf
          .box([0.24 * s * big, 0.2 * s, 0.36], 0.025)
          .rotateZ(aDeg - 90 + (noise.random(i, 23) - 0.5) * 3)
          .at(Math.cos(a) * ARCH_R, SPRING + Math.sin(a) * ARCH_R, 0.03),
      );
    }

    const threshold = sdf.box([1.06, 0.1, 0.42], 0.02).at(0, 0.05, 0);

    k.body('stone', sdf.union(ring, ...blocks, threshold).paintFn(stonePaint), {
      color: STONE,
      roughness: 0.92,
      detail: 0.02,
      maxError: 0.008,
      maxTriangles: 3200,
      paintWeight: 2,
      bump: stoneBump,
    });

    // ------------------------------------------------------------------ iron door leaf
    const windowCut = sdf.box([0.34, 0.26, 0.2], 0.03).at(0, 1.64, 0.075);
    const leaf = sdf
      .extrude(archOutline(INNER_HALF_W, LEAF_BOT, SPRING), 0.09)
      .at(0, 0, LEAF_Z)
      .subtract(windowCut);
    k.body('door-leaf', leaf.paintFn(ironPlatePaint), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.01,
      maxError: 0.004,
      maxTriangles: 1200,
      textureDensity: 2,
      paintWeight: 2,
      bump: ironPlateBump,
    });

    // ------------------------------------------------------------------ iron fittings
    // Two cross bands wrapping the leaf (they read on the back too), rivets on their
    // front faces, three barrel hinges on the left edge, and the window frame + bars.
    const bandY = [0.52, 1.24];
    const bands = bandY.map((y) => sdf.box([0.82, 0.1, 0.13], 0.015).at(0, y, LEAF_Z));
    const rivets = bandY.flatMap((y) =>
      [-0.31, -0.11, 0.11, 0.31].map((x) => sdf.sphere(0.013).at(x, y, 0.102)),
    );

    const hinges = [0.42, 1.0, 1.35].flatMap((y) => [
      sdf.cylinder(0.024, 0.15, 0.006).at(-0.415, y, 0.055),
      sdf.box([0.1, 0.07, 0.02], 0.008).at(-0.375, y, 0.088),
    ]);

    const winFrame = [
      sdf.box([0.44, 0.05, 0.034], 0.012).at(0, 1.795, 0.08),
      sdf.box([0.44, 0.05, 0.034], 0.012).at(0, 1.485, 0.08),
      sdf.box([0.05, 0.27, 0.034], 0.012).at(-0.195, 1.64, 0.08),
      sdf.box([0.05, 0.27, 0.034], 0.012).at(0.195, 1.64, 0.08),
    ];
    const bars = [-0.095, 0, 0.095].map((x) =>
      sdf.box([0.024, 0.3, 0.024], 0.008).at(x, 1.64, 0.083),
    );

    k.body(
      'iron-fittings',
      sdf.union(...bands, ...rivets, ...hinges, ...winFrame, ...bars).paintFn(ironWear),
      {
        color: IRON_DARK,
        roughness: 0.5,
        metalness: 0.7,
        detail: 0.005,
        maxError: 0.002,
        maxTriangles: 1100,
        bump: (x, y, z) => 0.0007 * noise.fbm(x * 50, y * 50, z * 50, 2),
      },
    );

    // ------------------------------------------------------------------ gold ring handle
    const bossZ = 0.086;
    const handle = sdf.union(
      sdf.cylinder(0.05, 0.024, 0.006).rotateX(90).at(0, 1.09, bossZ),
      sdf.torus(0.062, 0.015).rotateX(90).at(0, 0.995, bossZ + 0.01),
    );
    k.body('gold-handle', handle.paintFn(goldPaint), {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.005,
      maxError: 0.0015,
      maxTriangles: 450,
    });

    // ------------------------------------------------------------------ window glow
    k.body('window-glow', sdf.box([0.27, 0.19, 0.05], 0.022).at(0, 1.64, 0.045), {
      color: EMBER_BASE,
      emissive: EMBER,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      detail: 0.01,
      maxTriangles: 150,
    });
  },
});
