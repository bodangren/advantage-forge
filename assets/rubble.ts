import { defineAsset, mixRgb, noise, rgb, sdf, type Vec3 } from '../src/index.js';

/**
 * dungeon/structure/rubble — a pile of fallen dungeon masonry.
 *
 * Role: floor dressing beside walls and doorways; must read as "collapsed wall" at 128 px.
 * Size: mound about 0.8 m wide (X -0.42..0.42), ~0.65 m deep, 0.4 m tall, on y = 0, facing +Z.
 * One idea: one big half-buried wall block with an edge jutting out of the heap, smaller blocks
 *   and pebbles tumbled against it, a broken floor slab propped on the back, moss on the
 *   shaded (-X) side.
 * Shape language: chunky rounded boxes with soft bevels (sturdy), squashed ellipsoid pebbles
 *   secondary. Big/medium/small rhythm: one 0.4 m anchor block, three medium blocks, a slab,
 *   a small chunk, four pebbles.
 * Palette (dungeon contract): deep slate shadow #2a3547, mid blue-gray block #4a5d75, pale worn
 *   tops #7a8ba0, moss teal #3fae9a (dark #2e6e5c, light #5fc0ab). No emissive: no light source.
 * Materials: stone (roughness 0.92, grain in bump), moss (roughness 0.95).
 * Detail list: block heap with bevels and crevices (big, focal), pale worn tops + slate crevice
 *   paint (medium), pebbles, moss patches and dusting (small).
 * Rig/animation: none.
 */

const STONE = rgb('#4a5d75');
const STONE_DARK = rgb('#2a3547');
const STONE_LIGHT = rgb('#7a8ba0');
const MOSS = rgb('#3fae9a');
const MOSS_DARK = rgb('#2e6e5c');
const MOSS_LIGHT = rgb('#5fc0ab');

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

export default defineAsset({
  name: 'rubble',
  description:
    'Pile of fallen dungeon masonry: rounded slate blocks and pebbles tumbled into a low mound with a half-buried block edge, a propped floor slab, and a dusting of moss on the shaded side.',
  detail: 0.012,
  reference: 'docs/dungeon-mockups/dungeon-quest_002.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ blocks
    // One dominant anchor block (the half-buried wall block), three medium blocks packed
    // against it, a small chunk wedged on top-left, and a floor slab propped on the back.
    // All boxes get fat bevels; slight tilts make the heap look tumbled, not stacked.
    const anchor = sdf
      .box([0.4, 0.26, 0.28], 0.05)
      .rotateY(18)
      .rotateX(-7)
      .rotateZ(8)
      .at(0.05, 0.16, -0.05);
    const top = sdf
      .box([0.18, 0.13, 0.16], 0.04)
      .rotateY(-12)
      .rotateZ(12)
      .at(-0.06, 0.345, 0.03);
    const left = sdf
      .box([0.24, 0.2, 0.22], 0.045)
      .rotateY(-24)
      .rotateX(6)
      .rotateZ(-6)
      .at(-0.22, 0.11, 0.05);
    const front = sdf
      .box([0.26, 0.16, 0.22], 0.04)
      .rotateY(30)
      .rotateX(2)
      .at(0.17, 0.075, 0.19);
    const chunk = sdf
      .box([0.15, 0.11, 0.14], 0.03)
      .rotateY(8)
      .rotateZ(-14)
      .at(-0.1, 0.2, -0.04);
    const slab = sdf
      .box([0.28, 0.07, 0.24], 0.02)
      .rotateX(-34)
      .rotateZ(4)
      .at(-0.03, 0.07, -0.26);

    // Four pebbles tucked at the base; centers sit low so they read as half-sunk.
    const pebbles = sdf.union(
      sdf.ellipsoid([0.055, 0.04, 0.05]).rotateY(20).at(-0.36, 0.028, -0.14),
      sdf.ellipsoid([0.05, 0.035, 0.045]).rotateY(-30).at(0.37, 0.025, 0.08),
      sdf.ellipsoid([0.045, 0.03, 0.04]).rotateY(50).at(0.06, 0.02, 0.34),
      sdf.ellipsoid([0.04, 0.028, 0.038]).rotateY(-15).at(-0.3, 0.02, 0.22),
    );

    // Crisp union (tiny blend only) so blocks keep visible creases; the ground cut makes a
    // clean flat contact so the heap stands on y = 0.
    const heap = sdf
      .smoothUnion(0.005, anchor, top, left, front, chunk, slab, pebbles)
      .displace(0.004, (x, y, z) => noise.fbm(x * 11, y * 11, z * 11, 2, 7));
    const stone = heap.intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------- paint
    // Value plan: slate-dark crevices and ground contact, mid blue-gray mass, pale worn tops,
    // then a patchy moss dusting on the shaded (-X) side and upper rims.
    const stonePaint = (x: number, y: number, z: number) => {
      const patch = noise.fbm(x * 5, y * 5, z * 5, 2, 3);
      const up = clamp01((y - 0.12) / 0.26);
      let c = mixRgb(STONE, STONE_DARK, clamp01(0.42 - patch * 0.3));
      c = mixRgb(c, STONE_LIGHT, up * 0.6);
      // Deep slate in the dips and where the heap meets the floor.
      const contact = clamp01((0.08 - y) / 0.08);
      c = mixRgb(c, STONE_DARK, contact * 0.75);
      c = mixRgb(c, STONE_DARK, clamp01(-patch - 0.05) * 0.6);
      c = mixRgb(c, STONE_LIGHT, clamp01(patch - 0.35) * 0.25);
      // Moss dusting: shaded side, upper rims, broken into sparse patches by fbm.
      const side = clamp01((0.08 - x + 0.22 * y) / 0.28);
      const m = clamp01(side * 0.6 + up * 0.25 - 0.55 + noise.fbm(x * 8 + 9, y * 8, z * 8, 3, 11) * 0.5);
      if (m > 0) {
        const mossShade = clamp01(noise.fbm(x * 13, y * 13, z * 13, 2, 5) * 0.5 + 0.5);
        c = mixRgb(c, mixRgb(MOSS_DARK, MOSS, mossShade), m * 0.85);
      }
      return c;
    };

    k.body(
      'stone',
      stone.paintFn(stonePaint),
      {
        color: '#4a5d75',
        roughness: 0.92,
        metalness: 0,
        detail: 0.012,
        maxTriangles: 2400,
        paintWeight: 2,
        bump: (x, y, z) =>
          0.0022 * noise.fbm(x * 40, y * 40, z * 40, 2, 8) + 0.0009 * noise.noise3(x * 90, y * 90, z * 90, 4),
      },
    );

    // ------------------------------------------------------------------- moss
    // Three low crust patches on the shaded side: left block crown, anchor rim, slab face.
    // Thin, fbm-lumpy, and sunk deep so only the lumps poke out — crust, not leaves.
    const crust = (s: Vec3, seed: number) =>
      sdf
        .ellipsoid(s)
        .displace(0.006, (x, y, z) => noise.fbm(x * 26 + seed, y * 26 + seed, z * 26, 2, seed))
        .rotateZ(seed * 5 - 6);
    const moss = sdf.union(
      crust([0.1, 0.016, 0.08], 2).at(-0.26, 0.192, 0.03),
      crust([0.1, 0.014, 0.07], 5).at(-0.095, 0.293, -0.06),
      crust([0.075, 0.013, 0.075], 8).rotateX(-34).at(-0.04, 0.155, -0.22),
    );
    const mossPainted = moss.paintFn((x, y, z) => {
      const n = noise.fbm(x * 16, y * 16, z * 16, 2, 21);
      let c = mixRgb(MOSS_DARK, MOSS, clamp01(n * 0.5 + 0.5));
      c = mixRgb(c, STONE_DARK, 0.15);
      c = mixRgb(c, MOSS_LIGHT, clamp01((y - 0.2) / 0.12) * 0.3);
      return c;
    });
    k.body('moss', mossPainted, {
      color: '#3fae9a',
      roughness: 0.95,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 500,
      paintWeight: 2,
    });
  },
});
