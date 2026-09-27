import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — chunky cabbage (props/food/cabbage).
 *
 * Role: cozy chibi farm/market food prop; must read at 128 px sprite.
 * Size: ~0.25 m wide, ~0.19 m tall; stands on y = 0, centred on Y, faces +Z.
 * One idea: a fat pale-green head cuddled in a cup of thick wrapper leaves —
 *   a low green lip at the front, tall curled leaves rising around the sides and back.
 * Shape language: round dominant (head, cupped leaves); soft ruffled edges secondary.
 * Palette: head #9ed36a pale (60), wrapper leaf #5cb85c (30), vein/fold dark #3c7a3d
 *   and sun-lit leaf rim #86d47e (10 accent at the ruffled edge).
 * Materials: cabbage head (rough 0.55), wrapper leaf (rough 0.72). No metal.
 * Detail: primary head + 4 thick cupped leaves; secondary central veins + folded rims;
 *   tertiary mottle and bump. Focal point: pale head vs dark leaf folds.
 * Rig/animation: none (static prop).
 */

const HEAD = rgb('#9ed36a');
const HEAD_LIGHT = rgb('#c3e88f');
const HEAD_DARK = rgb('#6fae43');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#3c7a3d');
const LEAF_LIGHT = rgb('#86d47e');

const HEAD_RX = 0.093;
const HEAD_RY = 0.088;
const HEAD_RZ = 0.093;
const HEAD_CY = 0.097;

function deg(d: number): number {
  return (d * Math.PI) / 180;
}

// Low solid cup with a rounded rim (no flat cut) that the head rests in.
const lipProfile = profile.polygon(
  [
    [0.0, 0.0],
    [0.06, 0.0],
    [0.104, 0.022],
    [0.118, 0.05],
    [0.12, 0.078],
    [0.112, 0.092],
    [0.098, 0.096],
    [0.08, 0.086],
    [0.05, 0.052],
    [0.0, 0.04],
  ],
  { smooth: true, samples: 16 },
);
const baseLip = sdf.revolve(lipProfile).paintFn((x, y, z, base) => {
  let c = mixRgb(LEAF_DARK, LEAF, 0.3 + 0.55 * Math.min(1, y / 0.09));
  const m = 0.5 + 0.5 * noise.fbm(x * 13, y * 13, z * 13, 2);
  return mixRgb(c, LEAF, m * 0.13);
});

// A broad pointed leaf blade, extruded thick and rounded.
const leafOutline = profile.polygon(
  [
    [0, 0.0],
    [0.04, 0.012],
    [0.066, 0.045],
    [0.072, 0.082],
    [0.06, 0.118],
    [0.036, 0.142],
    [0.014, 0.152],
    [0, 0.156],
    [-0.014, 0.152],
    [-0.036, 0.142],
    [-0.06, 0.118],
    [-0.072, 0.082],
    [-0.066, 0.045],
    [-0.04, 0.012],
  ],
  { smooth: true, samples: 16 },
);
const bladeBase = sdf.extrude(leafOutline, 0.026, 0.012);

/** A big wrapper leaf: a pointed blade leaning outward, veined along its center. */
function wrapperLeaf(azDeg: number, leanDeg: number, baseY: number, r0: number, sc: number) {
  const a = deg(azDeg);
  return bladeBase
    .scale(sc)
    .rotateX(leanDeg)
    .at(0, baseY, r0)
    .rotateY(azDeg)
    .paintFn((x, y, z, base) => {
      const phi = Math.atan2(x, z);
      let d = phi - a;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const hy = Math.max(0, Math.min(1, (y - baseY) / 0.16)); // 0 base, 1 tip
      // Dark tucked base, mid leaf, a little sun on the tip.
      let c = mixRgb(LEAF_DARK, LEAF, 0.28 + 0.55 * hy);
      c = mixRgb(c, LEAF_LIGHT, Math.max(0, hy - 0.6) * 1.4);
      // Central vein plus two soft side veins.
      const vein = Math.exp(-Math.pow(d / 0.18, 2));
      const side = Math.exp(-Math.pow((Math.abs(d) - 0.28) / 0.1, 2));
      c = mixRgb(c, LEAF_DARK, 0.6 * vein + 0.22 * side);
      // Gentle mottle so the leaf reads as living tissue.
      const m = 0.5 + 0.5 * noise.fbm(x * 13, y * 13, z * 13, 2);
      return mixRgb(c, LEAF, m * 0.13);
    });
}

export default defineAsset({
  name: 'cabbage',
  description: 'A chunky pale-green cabbage head wrapped in four curled outer leaves with veins.',
  detail: 0.007,
  reference: 'docs/item-mockups/cabbage-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // -------------------------------------------------------------- head
    const head = sdf
      .ellipsoid([HEAD_RX, HEAD_RY, HEAD_RZ])
      .at(0, HEAD_CY, 0)
      .displace(0.016, (x, y, z) => {
        // Tight wrapped-leaf lobes running over the crown.
        const phi = Math.atan2(x, z);
        const up = Math.max(0, Math.min(1, (y - (HEAD_CY - HEAD_RY)) / (2 * HEAD_RY)));
        return (0.5 + 0.5 * Math.cos(phi * 5) - 0.5) * up;
      })
      .paintFn((x, y, z, base) => {
        const t = Math.max(0, Math.min(1, (y - (HEAD_CY - HEAD_RY)) / (2 * HEAD_RY)));
        let c = mixRgb(HEAD_DARK, HEAD, 0.32 + 0.68 * t);
        c = mixRgb(c, HEAD_LIGHT, Math.max(0, t - 0.55) * 1.2);
        // Creases between the wrapped leaves.
        const phi = Math.atan2(x, z);
        const crease = Math.pow(0.5 - 0.5 * Math.cos(phi * 5), 2.2);
        c = mixRgb(c, HEAD_DARK, 0.45 * crease);
        // Lighter crowns of each leaf.
        const crown = 0.5 + 0.5 * Math.cos(phi * 5);
        c = mixRgb(c, HEAD_LIGHT, 0.14 * crown);
        const m = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
        return mixRgb(c, HEAD_LIGHT, m * 0.12);
      });
    // A few small nub bumps on the crown, as in the mock.
    const nubs = [
      sdf.sphere(0.012).at(0.035, 0.155, 0.04),
      sdf.sphere(0.01).at(-0.05, 0.15, -0.022),
      sdf.sphere(0.009).at(0.006, 0.168, -0.04),
      sdf.sphere(0.008).at(-0.022, 0.163, 0.032),
    ];
    k.body('head', sdf.union(head, ...nubs), {
      color: '#9ed36a',
      roughness: 0.55,
      metalness: 0,
      detail: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 1200,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 34, y * 34, z * 34, 2),
    });

    // -------------------------------------------------------------- leaves
    // Four big wrapper leaves rising out of a low cupped base.
    const leaves = sdf
      .union(
        baseLip,
        wrapperLeaf(45, 14, 0.02, 0.072, 0.97),
        wrapperLeaf(135, 8, 0.03, 0.076, 1.12),
        wrapperLeaf(225, 8, 0.03, 0.076, 1.12),
        wrapperLeaf(315, 14, 0.02, 0.072, 0.97),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0)); // flat, clean ground contact
    k.body('leaves', leaves, {
      color: '#5cb85c',
      roughness: 0.72,
      metalness: 0,
      detail: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 1650,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 22, y * 22, z * 22, 2),
    });
  },
});
