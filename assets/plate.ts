import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — round wooden dining plate (props/food/plate).
 *
 * Role: tableware prop on the tavern feast table; must read at 128 px sprite.
 * Size: 0.24 m diameter, 0.025 m tall, stands on y = 0, faces +Z.
 * One idea: one stout honey-oak disc — a thicker outer ring with a soft bevel
 *   wrapping a gently recessed well, built from concentric plank rings.
 * Shape language: round dominant (revolved disc, domed bevels), no secondary.
 * Palette (honey oak family, tavern §3): mid #b5814a (dominant wood),
 *   shadow #8a5a35 (grain, seams, underside), pale cut wood #c9a06a (rim top).
 * Materials: one wood body (roughness 0.82, metalness 0); grain in `bump` only.
 * Detail: primary revolved disc + recessed well; secondary rim band in pale wood;
 *   tertiary concentric plank seams + grain hints. Focal point: pale rim ring.
 * Rig/animation: none (static prop).
 */

const HONEY = rgb('#b5814a');
const SHADOW = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const PALE_DEEP = rgb('#b08a55');

const H = 0.025; // total height
const R_OUT = 0.12; // outer radius (0.24 m diameter)
const R_RIM = 0.097; // outer ring flat top
const R_WELL = 0.056; // recessed well floor
const RING_W = 0.028; // concentric plank-ring width

export default defineAsset({
  name: 'plate',
  description:
    'Round honey-oak dining plate: concentric plank rings as one disc, a thicker pale rim ring with a soft bevel, and a slightly recessed center well.',
  detail: 0.005,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- body
    // Revolved profile (U = radius, V = height): flat bottom, rounded outer
    // wall, flat pale rim ring, a soft bevel down into the recessed well.
    const plateProfile = profile.polygon(
      [
        [0, 0.004],
        [0.07, 0.001],
        [0.1, 0.0],
        [0.113, 0.003],
        [0.119, 0.009],
        [R_OUT, 0.0145],
        [0.1195, 0.021],
        [0.1145, H], // rounded top rim of the outer ring
        [R_RIM, 0.0248], // flat pale ring top
        [0.086, 0.0215], // soft bevel
        [R_WELL, 0.0168], // recessed well floor
        [0, 0.0162],
      ],
      { smooth: true, samples: 16 },
    );
    // Flat cut on y = 0 so the ground line is perfect.
    const plateShape = sdf
      .revolve(plateProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Concentric plank rings (read as one disc), pale cut-wood rim, shaded
    // underside, and grain hints. Seams align with `bump` below.
    const paint = (x: number, y: number, z: number) => {
      const r = Math.hypot(x, z);
      // Per-ring tint and dark seam lines between plank rings.
      const u = r / RING_W;
      const idx = Math.floor(u);
      const f = u - idx;
      const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
      const tint = noise.random(idx, 11, 5);
      // Concentric grain: noise varies fast along the radius, slow around.
      const a = Math.atan2(z, x);
      const grain = 0.5 + 0.5 * noise.fbm(r * 42, y * 9, a * 1.5, 2);
      let c = mixRgb(HONEY, SHADOW, 0.05 + 0.16 * tint);
      c = mixRgb(c, PALE_DEEP, 0.12 * (1 - grain));
      c = mixRgb(c, SHADOW, 0.2 * grain);
      // Pale cut wood on the top rim ring only (narrow band at the edge).
      const rim = Math.min(
        1,
        Math.max(0, (r - (R_RIM - 0.004)) / 0.005),
      );
      const topness = Math.min(1, Math.max(0, (y - 0.021) / 0.003));
      c = mixRgb(c, PALE, 0.9 * rim * rim * topness);
      // Recessed well reads a touch darker.
      const well = Math.min(1, Math.max(0, (R_WELL + 0.01 - r) / 0.02));
      c = mixRgb(c, SHADOW, 0.18 * well * (1 - rim));
      // Dark seams between plank rings on the top face.
      const topFace = Math.min(1, Math.max(0, (y - 0.014) / 0.006));
      c = mixRgb(c, SHADOW, 0.55 * seam * topFace * (1 - rim));
      // Shaded underside and outer wall.
      const low = 1 - Math.min(1, y / 0.02);
      c = mixRgb(c, SHADOW, 0.42 * low * low);
      return c;
    };

    k.body('plate', plateShape.paintFn(paint), {
      color: HONEY,
      roughness: 0.82,
      metalness: 0,
      detail: 0.005,
      paintWeight: 2,
      maxTriangles: 900,
      bump: (x, y, z) => {
        const r = Math.hypot(x, z);
        const u = r / RING_W;
        const f = u - Math.floor(u);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
        return (
          -0.0018 * seam +
          0.0012 * noise.fbm(x * 34, y * 9, z * 34, 2)
        );
      },
    });
  },
});
