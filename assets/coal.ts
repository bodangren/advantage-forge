import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * Design note — items/crafting/coal (blacksmith-shop crafting lump).
 *
 * Role: crafting pickup and floor dressing beside the forge; must read at 128 px
 *   as one stout black rock, not as a featureless smudge.
 * Size: about 0.16 m wide, 0.16 m deep, 0.15 m tall, sitting flat on y = 0, facing +Z.
 * One idea: one chunky angular coal lump with broken facet planes; a faint blue-black
 *   sheen catches the upper planes and grey dust collects on the top rims and edges.
 * Shape language: square/angular dominant (broken mineral), round secondary (soft bevels).
 * Palette: coal #1a1a1a (dominant), sheen #1a1a22 (secondary on lit planes),
 *   dust #4a4a4a (accent on edges and top), deep #0d0d0f (ground contact). 60/30/10.
 * Materials: coal (roughness 0.6, metalness 0.15) — one body; grain and conchoidal
 *   fracture live in the normal map bump.
 * Detail: primary lump (big), corner lobes + four facet planes (medium),
 *   coal grain, dust flecks, and contact shading (small). Focal point: the sheen/dust
 *   contrast across the top ridge.
 * Rig/animation: none (static pickup).
 */

const COAL = rgb('#1a1a1a');
const SHEEN = rgb('#1a1a22');
const DUST = rgb('#4a4a4a');
const DEEP = rgb('#0d0d0f');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const norm = (u: Vec3): Vec3 => {
  const l = Math.hypot(u[0], u[1], u[2]) || 1;
  return [u[0] / l, u[1] / l, u[2] / l];
};

/** Surface point hit by a ray aimed inward from `center + dir`; a reliable facet anchor. */
function surfaceAim(shape: Sdf, center: Vec3, dir: Vec3): Vec3 {
  const u = norm(dir);
  const from: Vec3 = [center[0] + u[0] * 0.8, center[1] + u[1] * 0.8, center[2] + u[2] * 0.8];
  return sdf.raycast(shape, from, [-u[0], -u[1], -u[2]]) ?? sdf.surfacePoint(shape, from, 0);
}

/** A cutting plane facing `dir`, sunk `cut` meters into the surface at `point`. */
function facet(point: Vec3, dir: Vec3, cut: number): Sdf {
  const u = norm(dir);
  return sdf.halfSpace(u, u[0] * point[0] + u[1] * point[1] + u[2] * point[2] - cut);
}

export default defineAsset({
  name: 'coal',
  description:
    'Chunky angular coal lump: a jet-black broken rock with soft bevels, a faint blue-black sheen on the upper planes, and grey dust along the top edges; about 0.16 m.',
  detail: 0.004,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ blockout
    // One dominant rounded box, flicked off-axis so the lump is irregular, then a
    // crown block, a left flank buttress, a front toe, a right nose, and a back
    // chip build the broken, many-faced silhouette. Small blends keep the creases.
    const mass = sdf.box([0.15, 0.15, 0.14], 0.026).rotateY(18).rotateX(7).rotateZ(-9).at(0, 0.08, 0);
    const crown = sdf
      .box([0.09, 0.08, 0.085], 0.02)
      .rotateY(-24)
      .rotateX(6)
      .rotateZ(16)
      .at(0.03, 0.125, 0.015);
    const flank = sdf.box([0.05, 0.12, 0.07], 0.016).rotateY(38).rotateX(-7).at(-0.062, 0.062, -0.015);
    const toe = sdf.box([0.075, 0.06, 0.05], 0.014).rotateY(-12).rotateZ(-20).at(0.012, 0.04, 0.075);
    const nose = sdf.box([0.05, 0.05, 0.06], 0.012).rotateY(26).rotateX(8).at(0.06, 0.052, 0.05);
    const backChip = sdf.box([0.06, 0.05, 0.05], 0.012).rotateY(30).rotateX(-10).at(-0.04, 0.09, -0.06);

    let lump = mass
      .smoothUnion(0.011, crown)
      .smoothUnion(0.011, flank)
      .smoothUnion(0.009, toe)
      .smoothUnion(0.009, nose)
      .smoothUnion(0.009, backChip);

    // ------------------------------------------------------------------ facets
    // Four shallow facet planes shear the top, the back-left flank, the front-right
    // chest, and the front face, so the rock reads as broken mineral, not a blob.
    // Offsets come from surface probes so the cuts stay shallow and predictable.
    const topF = surfaceAim(lump, [0, 0.14, 0.01], [0.18, 1, 0.12]);
    const backF = surfaceAim(lump, [-0.05, 0.09, -0.06], [-0.55, 0.42, -0.72]);
    const chestF = surfaceAim(lump, [0.06, 0.075, 0.05], [0.72, 0.28, 0.6]);
    const faceF = surfaceAim(lump, [0.0, 0.06, 0.08], [0.08, 0.12, 1]);
    lump = lump
      .smoothIntersect(0.016, facet(topF, [0.18, 1, 0.12], 0.012))
      .smoothIntersect(0.02, facet(backF, [-0.55, 0.42, -0.72], 0.014))
      .smoothIntersect(0.02, facet(chestF, [0.72, 0.28, 0.6], 0.016))
      .smoothIntersect(0.02, facet(faceF, [0.08, 0.12, 1], 0.016));

    // Lumpy coal skin, soft all-over bevel, scaled to the ~0.16 m brief, then a
    // clean flat base on the ground.
    const rock = lump
      .displace(0.003, (x, y, z) => noise.fbm(x * 15, y * 15, z * 15, 3, 5))
      .round(0.004)
      .scale([0.86, 0.97, 0.87])
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------- paint
    // Value plan: near-black mass, faint blue sheen on the upper planes, grey dust
    // on the top rims and outer breaks. The dust is the one readable accent.
    const coalPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 3, 3);
      const grain = 0.5 + 0.5 * noise.fbm(x * 42, y * 42, z * 42, 2, 11);

      let c = mixRgb(COAL, SHEEN, clamp01(0.2 + patch * 0.8));

      // Sheen gathers on the up-facing planes; the underside stays flatter black.
      const up = clamp01((y - 0.05) / 0.1);
      c = mixRgb(c, SHEEN, up * 0.6);

      // Grey dust along the top rims and the outer broken edges, broken by patches.
      const rim = clamp01((Math.abs(x) - 0.042) / 0.035) + clamp01((Math.abs(z) - 0.042) / 0.035);
      const dust = clamp01(up * 0.85 + rim * 0.38 - 0.42 + (patch - 0.5) * 0.6);
      c = mixRgb(c, DUST, dust * 0.85);

      // Faint dust flecks in the grain.
      c = mixRgb(c, DUST, clamp01((grain - 0.7) * 3) * 0.4);

      // Sooty contact shadow where the lump meets the floor.
      const ground = clamp01((0.03 - y) / 0.03);
      c = mixRgb(c, DEEP, ground * 0.6);

      return c;
    };

    k.body('coal', rock.paintFn(coalPaint), {
      color: '#1a1a1a',
      roughness: 0.6,
      metalness: 0.15,
      detail: 0.004,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 3600,
      bump: (x, y, z) =>
        0.0016 * noise.fbm(x * 55, y * 55, z * 55, 3, 7) +
        0.0006 * noise.noise3(x * 130, y * 130, z * 130, 4),
    });
  },
});
