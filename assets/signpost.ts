import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note:
 * - Role: landmark background prop for a cozy chibi hamlet. Must read at 128 px.
 * - Size: ~2.15 m tall, ~1.3 m wide; stands on y = 0 and faces +Z.
 * - The one idea: two chunky arrow boards slice opposite ways from a sturdy log post.
 * - Shape language: round/soft dominant (turned log post, flared foot, domed cap, rounded
 *   board edges) with a triangular secondary (the two arrowheads) that breaks the outline.
 * - Palette: oak post #84501f (dominant), dark grain #3f220e, bleached top #e8cf9f, pale
 *   board #ad7038, dark aged board #4f2e14 (secondary value), moss #55702f, iron #3d4047.
 * - Materials: wood (roughness 0.85, metalness 0), iron nails (roughness 0.5, metalness 0.8).
 * - Details: flared foot, collar ring, domed cap, per-board tint and grain, two nails each.
 * - Rig/animation: none (static prop).
 */

const POST_TOP = 2.147;

const WOOD = rgb('#84501f');
const WOOD_DARK = rgb('#3f220e');
const WOOD_LIGHT = rgb('#e8cf9f');
const BOARD_A = rgb('#ad7038');
const BOARD_B = rgb('#4f2e14');
const MOSS = rgb('#55702f');
const IRON = '#3d4047';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** An arrow-shaped plank profile pointing +X, from the post axis (x = 0) to the tip. */
function arrowProfile(L: number, shaft: number, headL: number, headH: number) {
  const s = shaft / 2;
  const h = headH / 2;
  return profile.polygon(
    [
      [0, -s],
      [L - headL, -s],
      [L - headL, -h],
      [L, 0],
      [L - headL, h],
      [L - headL, s],
      [0, s],
    ],
    { smooth: false },
  );
}

export default defineAsset({
  name: 'signpost',
  description: 'Wooden hamlet signpost: a sturdy turned post with two arrow boards and iron nails.',
  detail: 0.006,

  build(k) {
    // ------------------------------------------------------------ post: turned log
    // Sturdy tapered post with a flared foot, a collar ring, and a rounded cap. The tight
    // intersect box keeps the bounding volume honest so the asset stands exactly on y = 0.
    const post = sdf
      .smoothUnion(
        0.035,
        sdf.cone([0, 0, 0], [0, 2.055, 0], 0.098, 0.068),
        sdf.cylinder(0.125, 0.055, 0.02).at(0, 0.028, 0),
        sdf.sphere(0.072).at(0, 2.072, 0),
      )
      .smoothUnion(0.02, sdf.torus(0.075, 0.012).at(0, 2.08, 0))
      .intersect(sdf.box([0.26, POST_TOP, 0.26]).at(0, POST_TOP / 2, 0))
      .paintFn((x, y, z, _base) => {
        // Vertical grain, sun-bleached toward the top, grimy dark foot with moss.
        const g = 0.5 + 0.5 * noise.noise3(x * 11, y * 2.2, z * 11);
        const fine = 0.5 + 0.5 * noise.noise3(x * 22, y * 3, z * 22);
        let c = mixRgb(WOOD, WOOD_DARK, 0.1 + 0.78 * g);
        if (fine > 0.68) c = mixRgb(c, rgb('#1e1006'), 0.55);
        const w = 0.5 + 0.5 * noise.noise3(x * 9, y * 3, z * 9);
        const weather = clamp01((y - 0.45) / 1.25);
        c = mixRgb(c, WOOD_LIGHT, weather * (0.34 + 0.6 * w));
        // Contact shadow where each board meets the post.
        const shade =
          clamp01(1 - Math.abs(y - 1.86) / 0.17) * 0.34 + clamp01(1 - Math.abs(y - 1.44) / 0.17) * 0.34;
        c = mixRgb(c, rgb('#2a1a0e'), Math.min(0.5, shade));
        const dirt = clamp01((0.14 - y) / 0.14);
        c = mixRgb(c, rgb('#241610'), 0.45 * dirt);
        const moss = clamp01(0.5 + 0.5 * noise.fbm(x * 11, y * 9, z * 11, 3)) * clamp01((0.4 - y) / 0.4);
        return mixRgb(c, MOSS, 0.7 * moss);
      });
    k.body('post', post, {
      color: '#9a6437',
      roughness: 0.85,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 30, y * 3, z * 30, 2),
    });

    // ------------------------------------------------------------ two arrow boards
    // Chunky planks, one on the front face and one on the back face, swept slightly toward
    // the camera so the silhouette reads from the front and keeps depth from the side.
    const geom = sdf.extrude(arrowProfile(0.64, 0.22, 0.17, 0.38), 0.08, 0.02);

    const boards = [
      {
        y: 1.86,
        yaw: -12,
        tilt: 5,
        z: 0.075,
        face: 1,
        base: BOARD_A,
        seed: 1,
        bleach: 0.24,
        name: 'board-a',
      },
      {
        y: 1.44,
        yaw: 168,
        tilt: -5,
        z: -0.075,
        face: -1,
        base: BOARD_B,
        seed: 2,
        bleach: 0.08,
        name: 'board-b',
      },
    ] as const;

    const boardBump = (x: number, y: number, z: number) => 0.0016 * noise.fbm(x * 3, y * 30, z * 30, 2);
    const nails: sdf.Shape[] = [];

    for (const b of boards) {
      const shape = geom
        .rotateY(b.yaw)
        .rotateZ(b.tilt)
        .at(0, b.y, b.z)
        .paintFn((x, y, z, _base) => {
          // Grain streaks run along the board length (X); the top edge is sun-bleached.
          const g = 0.5 + 0.5 * noise.noise3(x * 2, y * 18, z * 6);
          const fine = 0.5 + 0.5 * noise.noise3(x * 6, y * 50, z * 20);
          let c = mixRgb(b.base, WOOD_DARK, 0.05 + 0.7 * g + noise.random(b.seed, 5) * 0.14);
          if (fine > 0.74) c = mixRgb(c, rgb('#1e1108'), 0.55);
          const up = clamp01((y - b.y + 0.19) / 0.38);
          c = mixRgb(c, WOOD_LIGHT, b.bleach * up);
          const down = clamp01((b.y + 0.19 - y) / 0.2);
          return mixRgb(c, rgb('#2a1a0e'), 0.3 * down);
        });
      k.body(b.name, shape, { color: '#8a5530', roughness: 0.85, paintWeight: 2, bump: boardBump });

      // Two nails through the board's outer face, right where it meets the post.
      for (const dy of [-0.055, 0.055]) {
        const sign = b.face;
        const hit = sdf.raycast(shape, [sign * 0.06, b.y + dy, sign * 0.4], [0, 0, -sign]);
        if (!hit) continue;
        const n = sdf.normalAt(shape, hit);
        nails.push(sdf.sphere(0.017).at(hit[0] + n[0] * 0.002, hit[1] + n[1] * 0.002, hit[2] + n[2] * 0.002));
      }
    }

    k.body('nails', sdf.union(...nails), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.004,
    });
  },
});
