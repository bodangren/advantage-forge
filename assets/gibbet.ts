import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — dungeon gibbet (catalog props/world/gibbet).
 *
 * Role: dungeon landmark prop. Must read at 128 px as a gallows with a cage.
 * Size: 2.0 m tall. Stands on y = 0, centred on the Y axis, faces +Z.
 * One idea: a stout hewn post and one arm, with a big barrel iron cage (0.55 m
 *   tall, 0.34 m wide, eight bars, three hoops, dome cap) holding a skull and bones,
 *   hanging on a three-link chain 0.45 m from the post. The cage is the focal point.
 * Shape language: square timber (sturdy, grim) with round iron and cobbles.
 * Palette: oak #9a6840 / dark #5a3820 (dominant), stone #6f7680 / #4b525c,
 *   iron #4a4f55 / #363a3f / #a8acb1, bone #f0e2c4, gold stud #d4a93a.
 * Materials: wood 0.82, stone 0.9, iron 0.5 / metal 0.7, bone 0.45, gold 0.32 / metal 1.
 * Detail: post, arm, braces, cobbles (big); hook, chain, cage (focal); bones, gold stud.
 * The arm yaws toward +Z so the cage clears the post in the side view.
 * Rig: none.
 */

const WOOD = rgb('#9a6840');
const WOOD_DARK = rgb('#5a3820');
const WOOD_DEEP = rgb('#3a2416');
const WOOD_LIGHT = rgb('#d4b07a');
const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#4b525c');
const STONE_PALE = rgb('#9aa2ab');
const MOSS = rgb('#3f6b52');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');
const BONE = rgb('#f0e2c4');
const BONE_SHADE = rgb('#c4ae88');
const SOCKET = rgb('#2a2420');

const PX = 0.1;
const ARM_Y = 1.58;
const YAW = 32;
const HANG = 0.16;
const HOOK_X = -0.45; // local X, cage side of the post
const ARM_LEN = 0.9;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const woodPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const vertical = noise.fbm(x * 16, y * 2.4, z * 16, 3);
  const fine = noise.fbm(x * 30, y * 9, z * 30, 2);
  let c = mixRgb(WOOD, WOOD_DARK, 0.12 + 0.62 * clamp01(0.45 - vertical));
  c = mixRgb(c, WOOD_LIGHT, 0.34 * clamp01(fine) * clamp01((y - 0.5) / 1.2));
  c = mixRgb(c, WOOD_DEEP, 0.62 * clamp01(0.28 - fine));
  c = mixRgb(c, WOOD_DEEP, 0.45 * clamp01((0.26 - y) / 0.26));
  c = mixRgb(c, WOOD_LIGHT, 0.28 * clamp01((y - 1.72) / 0.26));
  return c;
};

const stonePaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const w = noise.worley(x * 2.8, y * 2.2, z * 2.8, 4);
  const tint = (w.id % 997) / 997;
  let c = mixRgb(STONE, STONE_DARK, 0.1 + 0.6 * tint);
  c = mixRgb(c, STONE_PALE, 0.32 * clamp01((y - 0.05) / 0.1) * (1 - tint * 0.4));
  const crevice = clamp01((0.11 - (w.f2 - w.f1)) / 0.11);
  c = mixRgb(c, STONE_DARK, 0.45 * crevice);
  const moss = clamp01((0.06 - y) / 0.06) * clamp01(0.3 + noise.fbm(x * 8, y * 8, z * 8, 2));
  return mixRgb(c, MOSS, 0.48 * moss * (z < 0.06 ? 1 : 0.3));
};

const ironPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = noise.fbm(x * 9, y * 9, z * 9, 2);
  const spec = noise.fbm(x * 32, y * 32, z * 32, 2);
  let c = mixRgb(IRON_DARK, IRON, 0.55 + 0.35 * clamp01(0.5 + n));
  c = mixRgb(c, IRON_HI, 0.38 * clamp01(spec - 0.15));
  c = mixRgb(c, IRON_DARK, 0.22 * clamp01((0.95 - y) / 0.35));
  return c;
};

const bonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const n = noise.fbm(x * 14, y * 14, z * 14, 2);
  return mixRgb(base, BONE_SHADE, 0.28 * clamp01(0.15 - n));
};

const woodOpts = {
  color: '#9a6840',
  roughness: 0.82,
  metalness: 0,
  detail: 0.015,
  paintWeight: 2,
  bump: (x: number, y: number, z: number) => 0.0024 * noise.fbm(x * 12, y * 3, z * 12, 2),
} as const;

export default defineAsset({
  name: 'gibbet',
  description:
    'Dungeon gibbet: a stout wooden post and arm, an iron chain, and a hanging cage with bones, on a cobble base.',
  detail: 0.008,
  reference: 'docs/item-mockups/gibbet-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ cobble base
    const cobbleSpecs: Array<[number, number, number, number, number, number]> = [
      [0.02, 0.065, 0.0, 0.2, 0.07, 0.15],
      [0.22, 0.08, 0.1, 0.13, 0.085, 0.11],
      [0.16, 0.07, -0.14, 0.12, 0.08, 0.11],
      [-0.18, 0.08, 0.12, 0.13, 0.09, 0.11],
      [-0.2, 0.07, -0.1, 0.12, 0.08, 0.11],
      [0.36, 0.05, 0.0, 0.11, 0.06, 0.09],
      [-0.36, 0.05, 0.04, 0.11, 0.06, 0.09],
      [0.04, 0.05, 0.24, 0.12, 0.06, 0.1],
      [0.0, 0.05, -0.24, 0.11, 0.06, 0.09],
      [PX, 0.11, 0.05, 0.1, 0.075, 0.09],
      [PX - 0.02, 0.1, -0.06, 0.09, 0.07, 0.08],
    ];
    const cobbles = cobbleSpecs.map(([x, y, z, rx, ry, rz]) => sdf.ellipsoid([rx, ry, rz]).at(x, y, z));
    k.body('stones', sdf.smoothUnion(0.022, ...cobbles).paintFn(stonePaint), {
      color: '#6f7680',
      roughness: 0.9,
      metalness: 0,
      detail: 0.016,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 8, y * 7, z * 8, 2),
      maxTriangles: 900,
    });

    // Hewn post. The arm is a separate body so each mesh stays axis-aligned.
    // Smooth paint on the post. Hard grain seams stop the reducer from collapsing it.
    const postPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
      const g = noise.fbm(x * 5, y * 1.5, z * 5, 3);
      const band = noise.fbm(x * 7, y * 2.2, z * 7, 2);
      let c = mixRgb(WOOD, WOOD_DARK, 0.16 + 0.48 * clamp01(0.35 - g));
      c = mixRgb(c, WOOD_LIGHT, 0.2 * clamp01(band));
      c = mixRgb(c, WOOD_DEEP, 0.4 * clamp01((0.24 - y) / 0.24));
      c = mixRgb(c, WOOD_LIGHT, 0.26 * clamp01((y - 1.7) / 0.28));
      return c;
    };
    const shaft = sdf.box([0.16, 1.9, 0.16], 0.02).at(PX, 1.05, 0);
    const foot = sdf.box([0.22, 0.3, 0.22], 0.03).at(PX, 0.17, 0);
    const post = sdf
      .smoothUnion(0.02, shaft, foot)
      .displace(0.006, (x, y, z) => noise.fbm(x * 4, y * 9, z * 4, 3))
      .paintFn(postPaint);
    k.body('post', post, { ...woodOpts, paintWeight: 0, detail: 0.012, maxTriangles: 750 });

    // Arm, chain, and cage are built straight, then yawed so the side view
    // shows the cage. Meshes stay axis-aligned, which the reducer can keep.
    k.group('hang', { at: [PX, 0, 0], rotate: [0, YAW, 0] }, (g) => {
      const arm = sdf.box([ARM_LEN, 0.14, 0.12], 0.032).at(-HANG, ARM_Y, 0);
      const brace = (z: number) =>
        sdf.capsule([-0.04, 1.22, z], [-0.32, 1.5, z * 0.35], 0.032);
      const knotEnd = sdf.sphere(0.028).at(-HANG + ARM_LEN / 2 - 0.04, ARM_Y + 0.01, 0.03);
      const armWood = sdf
        .smoothUnion(0.028, arm, brace(0.07), brace(-0.07))
        .paintFn(woodPaint)
        .paintWhere(knotEnd, WOOD_DEEP, 0.012);
      g.body("arm", armWood, { ...woodOpts, maxTriangles: 900 });

      // Hook ring around the beam, three chain links, barrel cage.
      const hook = sdf.torus(0.05, 0.02).rotateZ(90).at(HOOK_X, ARM_Y, 0);
      const link = (y: number, ry: number) =>
        sdf.torus(0.03, 0.008).rotateX(90).rotateY(ry).at(HOOK_X, y, 0);
      const chainLinks = [link(1.49, 0), link(1.435, 90), link(1.385, 0)];
      const rAt = (y: number) => {
        const t = (y - 0.83) / (1.3 - 0.83);
        return t < 0.5 ? 0.13 + (0.17 - 0.13) * Math.sin((t / 0.5) * Math.PI / 2)
          : 0.17 - (0.17 - 0.12) * (1 - Math.cos(((t - 0.5) / 0.5) * Math.PI / 2));
      };
      const ys = [0.83, 1.07, 1.3];
      const rs: number[] = [0.13, 0.17, 0.12];
      const bars = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const p = (j: number): [number, number, number] => [HOOK_X + c * (rs[j] ?? 0), ys[j] ?? 0, s * (rs[j] ?? 0)];
        bars.push(sdf.capsule(p(0), p(1), 0.012), sdf.capsule(p(1), p(2), 0.012));
      }
      void rAt;
      const hoops = ys.map((y, j) => sdf.torus(rs[j] ?? 0, 0.012).at(HOOK_X, y, 0));
      const floor = sdf
        .smoothUnion(0.01, sdf.cylinder(0.125, 0.02, 0.008).at(HOOK_X, 0.81, 0), sdf.ellipsoid([0.12, 0.02, 0.12]).at(HOOK_X, 0.79, 0))
        ;
      const dome = sdf.ellipsoid([0.12, 0.065, 0.12]).at(HOOK_X, 1.3, 0).shell(0.008);
      const domeCut = sdf.box([0.5, 0.2, 0.5]).at(HOOK_X, 1.3 + 0.1 - 0.0, 0);
      void domeCut;
      const capRing = sdf.torus(0.026, 0.009).rotateX(90).at(HOOK_X, 1.352, 0);
      g.body('iron', sdf.smoothUnion(0.008, hook, ...chainLinks, ...bars, ...hoops, floor, dome, capRing).paintFn(ironPaint), {
        color: '#5a6068',
        roughness: 0.5,
        metalness: 0.7,
        detail: 0.006,
        paintWeight: 2,
        bump: (x, y, z) => 0.001 * noise.fbm(x * 14, y * 14, z * 14, 2),
        maxTriangles: 4600,
      });

      const skullY = 0.9;
      const sockL = sdf.sphere(0.02).at(HOOK_X - 0.03, skullY + 0.01, 0.06);
      const sockR = sdf.sphere(0.02).at(HOOK_X + 0.03, skullY + 0.01, 0.06);
      const nose = sdf.sphere(0.011).at(HOOK_X, skullY - 0.02, 0.068);
      const skull = sdf
        .smoothUnion(
          0.014,
          sdf.sphere(0.07).at(HOOK_X, skullY, 0),
          sdf.box([0.07, 0.04, 0.06], 0.012).at(HOOK_X, skullY - 0.055, 0.02),
        )
        .smoothSubtract(0.006, sockL, sockR, nose)
        .paintWhere(sockL.round(0.005), SOCKET, 0.005)
        .paintWhere(sockR.round(0.005), SOCKET, 0.005)
        .paintWhere(nose.round(0.004), SOCKET, 0.004);
      const femur = sdf.smoothUnion(
        0.008,
        sdf.capsule([HOOK_X - 0.09, 0.845, -0.07], [HOOK_X + 0.08, 0.845, -0.05], 0.014),
        sdf.sphere(0.022).at(HOOK_X - 0.095, 0.845, -0.07),
        sdf.sphere(0.02).at(HOOK_X + 0.085, 0.845, -0.05),
      );
      const shard = sdf.capsule([HOOK_X + 0.05, 0.845, 0.08], [HOOK_X - 0.06, 0.845, 0.09], 0.013);
      g.body('bones', sdf.union(skull, femur, shard).paintFn(bonePaint), {
        color: '#f0e2c4',
        roughness: 0.45,
        metalness: 0,
        detail: 0.005,
        textureDensity: 2,
        maxTriangles: 900,
      });

      const aim: [number, number, number] = [-0.06, ARM_Y, 0.4];
      const hit = sdf.raycast(armWood, aim, [0, 0, -1]);
      const bossAt = hit ?? [-0.06, ARM_Y, 0.08];
      const n = hit ? sdf.normalAt(armWood, hit) : [0, 0, 1];
      g.body(
        'stud',
        sdf.sphere(0.04).at(bossAt[0] + n[0] * 0.016, bossAt[1] + n[1] * 0.016, bossAt[2] + n[2] * 0.016),
        {
          color: '#d4a93a',
          roughness: 0.32,
          metalness: 1,
          detail: 0.006,
          maxTriangles: 120,
        },
      );
    });
  },
});
