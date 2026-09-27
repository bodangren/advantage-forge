import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Design note — locked chest, catalog props/containers/locked-chest.
 *
 * Role: dungeon landmark prop. It must read at 128 px as a chained chest.
 * Size: 0.80 m wide, 0.50 m deep, about 0.54 m tall. It stands on y = 0 and faces +Z.
 * One idea: thick iron and heavy chains hold a plank chest shut with three gold locks.
 * Shape language: square and chunky, with round links, locks, and a skull.
 * Palette: wood #6b4e38, iron #4a4f55 / #363a3f / #a8acb1, gold #d4a93a, bone #e6dcc8.
 * Materials: wood (roughness 0.84), iron (roughness 0.5, metalness 0.7), gold (metalness 1), bone.
 * Detail: plank box, slab lid, iron bands, corner plates, chains, three padlocks, skull emblem.
 * The skull is the focal point. Rig: none. The chest stays locked.
 */

const W = 0.76;
const D = 0.46;
const BODY_Y0 = 0.022;
const BODY_H = 0.31;
const BODY_Y1 = BODY_Y0 + BODY_H;
const LID_Y0 = BODY_Y1 + 0.012;
const LID_H = 0.096;
const LID_Y1 = LID_Y0 + LID_H;

const WOOD = rgb('#6b4e38');
const WOOD_DARK = rgb('#3a291c');
const WOOD_DEEP = rgb('#24180f');
const IRON_DARK = rgb('#363a3f');
const IRON_MID = rgb('#4a4f55');
const IRON_HI = rgb('#a8acb1');
const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#8a6418');
const BONE = rgb('#e8dcc6');
const BONE_DARK = rgb('#a89880');
const SOCKET = rgb('#1a1410');

const LINK_R = 0.037;
const LINK_T = 0.015;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Round link. facing is the hole axis. yaw is degrees around Y. */
function link(x: number, y: number, z: number, facing: 'x' | 'y' | 'z', yaw = 0): Sdf {
  let s = sdf.torus(LINK_R, LINK_T);
  if (facing === 'z') s = s.rotateX(90);
  else if (facing === 'x') s = s.rotateZ(90);
  if (yaw !== 0) s = s.rotateY(yaw);
  return s.at(x, y, z);
}

/** Upright padlock. Shackle is a capsule arch so the hole stays open. */
function padlock(): Sdf {
  const body = sdf.box([0.086, 0.064, 0.034], 0.012);
  const r = 0.009;
  const arch = sdf.smoothUnion(
    0.004,
    sdf.capsule([-0.014, 0.016, 0], [-0.014, 0.058, 0], r),
    sdf.capsule([0.014, 0.016, 0], [0.014, 0.058, 0], r),
    sdf.capsule([-0.014, 0.058, 0], [0.014, 0.058, 0], r),
  );
  const key = sdf.union(
    sdf.cylinder(0.009, 0.07, 0.002).rotateX(90).at(0, 0.008, 0),
    sdf.box([0.012, 0.024, 0.07], 0.003).at(0, -0.012, 0),
  );
  return body.smoothUnion(0.006, arch).subtract(key);
}

function skull(): Sdf {
  const cranium = sdf.ellipsoid([0.062, 0.056, 0.04]);
  const brow = sdf.box([0.108, 0.02, 0.024], 0.007).at(0, 0.014, 0.024);
  const jaw = sdf.ellipsoid([0.04, 0.02, 0.026]).at(0, -0.066, 0.006);
  let s = cranium.smoothUnion(0.008, brow, jaw);
  // Large sockets punch through to the dark iron plate so the face reads at 128 px.
  const eye = sdf.cylinder(0.023, 0.12, 0.004).rotateX(90).at(0.024, 0.008, 0.01);
  const nose = sdf.box([0.016, 0.022, 0.06], 0.004).at(0, -0.02, 0.02);
  const mouth = sdf.box([0.036, 0.01, 0.06], 0.003).at(0, -0.044, 0.016);
  s = s.subtract(eye, eye.mirror('x', 0), nose, mouth);
  return s
    .paintWhere(sdf.sphere(0.03).at(0.024, 0.008, 0.03), SOCKET, 0.006)
    .paintWhere(sdf.sphere(0.03).at(-0.024, 0.008, 0.03), SOCKET, 0.006);
}

const woodPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
  const onLid = y > BODY_Y1 + 0.004;
  const v = onLid ? x : y;
  const size = onLid ? 0.1 : 0.078;
  const board = Math.floor((v + 2) / size);
  const f = (v + 2) / size - board;
  const seam = f < 0.08 || f > 0.92 ? 0.84 : 0;
  const tint = (noise.random(board, onLid ? 9 : 4) - 0.45) * 0.3;
  const grain = noise.noise3(x * 7, y * 46, z * 7 + board);
  let c = mixRgb(WOOD, WOOD_DARK, clamp01(0.14 + tint + 0.18 * (0.5 - grain) + seam));
  if (onLid) c = mixRgb(c, WOOD, 0.16);
  const warm = 0.055 * clamp01((z - 0.02) / 0.22) * clamp01((y - 0.08) / 0.28);
  return mixRgb(c, rgb('#ff9a3c'), warm);
};

const woodBump = (x: number, y: number, z: number): number => {
  const onLid = y > BODY_Y1 + 0.004;
  const v = onLid ? x : y;
  const size = onLid ? 0.1 : 0.078;
  const f = (v + 2) / size - Math.floor((v + 2) / size);
  const edge = Math.min(f, 1 - f);
  const groove = Math.exp(-((edge / 0.016) ** 2));
  const grain = noise.noise3((onLid ? z : x) * 8, y * 40, (onLid ? x : z) * 8);
  return -0.003 * groove + 0.0014 * grain;
};

const ironPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
  const wear = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 3);
  let c = mixRgb(IRON_DARK, IRON_MID, 0.25 + 0.5 * wear);
  const high = clamp01((y - 0.36) / 0.14);
  const outer = clamp01((Math.abs(z) - 0.2) / 0.08) * 0.5 + clamp01((Math.abs(x) - 0.32) / 0.08) * 0.5;
  c = mixRgb(c, IRON_HI, 0.34 * high * wear + 0.14 * outer * wear);
  c = mixRgb(c, IRON_DARK, 0.35 * clamp01((0.06 - y) / 0.06));
  return c;
};

const goldPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
  const n = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
  return mixRgb(GOLD_DARK, GOLD, 0.42 + 0.52 * n);
};

const bonePaint = (x: number, y: number, z: number): readonly [number, number, number] => {
  const n = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
  let c = mixRgb(BONE_DARK, BONE, 0.28 + 0.64 * n);
  c = mixRgb(c, BONE_DARK, 0.35 * clamp01((0.21 - y) / 0.07));
  return c;
};

export default defineAsset({
  name: 'locked-chest',
  description:
    'Heavy iron-bound plank chest wrapped in chains, shut with three gold padlocks and a bone skull emblem.',
  detail: 0.008,
  reference: 'docs/item-mockups/locked-chest-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wood
    const body = sdf.box([W, BODY_H, D], 0.018).at(0, BODY_Y0 + BODY_H / 2, 0);
    const lid = sdf.box([W - 0.05, LID_H, D - 0.05], 0.014).at(0, LID_Y0 + LID_H / 2, 0);
    const seam = sdf
      .box([W - 0.09, 0.008, D - 0.09], 0.002)
      .at(0, BODY_Y1 + 0.004, 0)
      .paint(WOOD_DEEP);
    k.body('wood', sdf.union(body, lid, seam).paintFn(woodPaint), {
      color: '#6b4e38',
      roughness: 0.84,
      metalness: 0,
      detail: 0.018,
      bump: woodBump,
    });

    // ------------------------------------------------------------------ iron fittings
    const plates: Sdf[] = [];
    const zFace = D / 2 + 0.007;
    const xFace = W / 2 + 0.007;

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        plates.push(sdf.box([0.07, 0.026, 0.054], 0.008).at(sx * 0.3, 0.013, sz * 0.155));
      }
    }

    const rail = (y: number, h: number) => {
      const t = 0.02;
      plates.push(sdf.box([W - 0.1, h, t], 0.007).at(0, y, zFace));
      plates.push(sdf.box([W - 0.1, h, t], 0.007).at(0, y, -zFace));
      plates.push(sdf.box([t, h, D - 0.12], 0.007).at(xFace, y, 0));
      plates.push(sdf.box([t, h, D - 0.12], 0.007).at(-xFace, y, 0));
    };
    rail(0.068, 0.046);
    rail(0.292, 0.04);

    // Straps frame the skull. They stop at the top rail.
    for (const sx of [-1, 1]) {
      plates.push(sdf.box([0.044, 0.2, 0.02], 0.007).at(sx * 0.2, 0.18, zFace));
      plates.push(sdf.box([0.044, 0.2, 0.02], 0.007).at(sx * 0.2, 0.18, -zFace));
    }

    // Short corner blocks on the lid, plus L-plates at the base.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        plates.push(sdf.box([0.088, 0.05, 0.084], 0.012).at(sx * 0.3, LID_Y1 - 0.004, sz * 0.15));
        plates.push(sdf.sphere(0.01).at(sx * 0.3, LID_Y1 - 0.01, sz * (0.15 + 0.03)));
      }
    }
    const corner = (sx: number, sz: number): Sdf => {
      const face = sdf
        .box([0.096, 0.064, 0.018], 0.006)
        .at(sx * (W / 2 - 0.048), 0.068, sz * (D / 2 + 0.008));
      const side = sdf
        .box([0.018, 0.064, 0.084], 0.006)
        .at(sx * (W / 2 + 0.006), 0.068, sz * (D / 2 - 0.038));
      return face.smoothUnion(0.006, side);
    };
    plates.push(corner(1, 1), corner(-1, 1), corner(1, -1), corner(-1, -1));

    // Iron frame behind the skull. It shows through the eye sockets.
    plates.push(sdf.box([0.16, 0.168, 0.016], 0.006).at(0, 0.242, zFace));

    // Front belt sits under the skull. Links alternate and overlap.
    const chainY = 0.086;
    const frontZ = 0.278;
    const step = 0.058;
    const links = [
      link(-2 * step, chainY, frontZ, 'z'),
      link(-step, chainY, frontZ + 0.02, 'x'),
      link(0, chainY, frontZ, 'z'),
      link(step, chainY, frontZ + 0.018, 'x'),
      link(2 * step, chainY - 0.004, frontZ, 'z', 6),
      // Lid ring sits on the lid. The top lock shackle passes through it.
      link(0, LID_Y1 + 0.028, 0.11, 'z'),
      link(0.415, 0.17, 0.0, 'x'),
      link(0.0, 0.155, -0.278, 'z'),
    ];

    k.body('iron', sdf.smoothUnion(0.006, ...plates).union(...links).paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.014,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 26, y * 26, z * 26, 2),
    });

    // Locks close through the end links of the front belt and the lid ring.
    const leftLock = padlock().rotateZ(6).at(-2 * step, 0.05, 0.308);
    const rightLock = padlock().rotateZ(-10).at(2 * step, 0.046, 0.312);
    const topLock = padlock().at(0, LID_Y1 + 0.026, 0.155);
    k.body('locks', sdf.union(leftLock, rightLock, topLock).paintFn(goldPaint), {
      color: '#d4a93a',
      roughness: 0.32,
      metalness: 1,
      detail: 0.009,
      textureDensity: 2,
    });

    // ------------------------------------------------------------------ skull emblem
    k.body('skull', skull().at(0, 0.246, 0.272).paintFn(bonePaint), {
      color: '#e8dcc6',
      roughness: 0.42,
      metalness: 0,
      detail: 0.007,
      textureDensity: 2,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 20, y * 20, z * 20, 2),
    });
  },
});
