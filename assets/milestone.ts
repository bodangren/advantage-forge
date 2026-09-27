import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — roadside milestone (props/world/milestone).
 *
 * Role: village landmark prop beside the road; players read direction and distance here.
 *   Must read at the 128 px sprite size.
 * Size: 0.70 m tall, 0.32 m wide; stands on y = 0, faces +Z, centred on the Y axis.
 * One idea: a chunky warm-gray stone post carrying a wider rounded marker head, with a
 *   carved arrow and a bold numeral cut into the front, and moss + grass at the foot.
 * Shape language: round/soft dominant (rounded post, oval head, domed foot), square
 *   secondary (the flat carved panel) — friendly and sturdy.
 * Palette: warm stone #9a9083 (dominant), lit stone #c8bfae, carved recess #453f34,
 *   crevice #37322a; moss #5f7f3c / dark #37552a; grass leaf #5cb85c / dark #2f6b32.
 *   Value plan: mid stone mass, dark carvings as contrast, green moss and grass as the accent.
 * Materials: stone (roughness 0.9), moss (roughness 0.98), grass blades (roughness 0.85).
 *   Grain and speckle go in `bump`, never `displace`.
 * Detail: post + head + foot + chip first; carved panel, arrow, numeral second; moss and
 *   grass tuft third. Focal point: the carved arrow panel.
 * Rig/animation: none (static prop).
 */

const STONE_LIGHT = rgb('#c8bfae');
const STONE_DARK = rgb('#5a5348');
const STONE_DEEP = rgb('#37322a');
const PANEL = rgb('#6b6355');
const CARVE = rgb('#453f34');
const MOSS_DARK = rgb('#37552a');
const MOSS_LIGHT = rgb('#87a355');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#2f6b32');

const HEAD_Y = 0.595;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Arrow-shaped outline pointing +X, from x = 0 to x = L. */
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

/** The bold numeral "3": two stacked right-hand arcs, widened across X. */
function numeralThree(): Sdf {
  const arc = (dy: number) =>
    sdf.extrude(profile.arc(0.036, 0.026, -112, 112), 0.09, 0.008).at(0, dy, 0);
  return sdf.union(arc(0.035), arc(-0.035)).scale([1.1, 1, 1]);
}

export default defineAsset({
  name: 'milestone',
  description:
    'Roadside stone milestone: a rounded warm-gray post with a carved arrow and numeral, moss and a grass tuft at the foot.',
  detail: 0.009,
  reference: 'docs/item-mockups/milestone-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const ground = sdf.halfSpace([0, -1, 0], 0);

    // ------------------------------------------------------------------ stone mass
    // Chunky post, a wider rounded marker head, and a low flared foot. One stone body.
    // A chipped top-left corner and a weathered bump on top-right give it a used, asymmetric
    // silhouette.
    const post = sdf.box([0.175, 0.52, 0.135], 0.03).at(0, 0.26, 0);
    const head = sdf.extrude(profile.rect([0.3, 0.17], 0.05), 0.15, 0.022).at(0, HEAD_Y, 0);
    const foot = sdf.box([0.25, 0.085, 0.215], 0.035).at(0, 0.04, 0).intersect(ground);
    const bump = sdf.ellipsoid([0.055, 0.032, 0.06]).at(0.075, 0.672, 0);

    const mass = sdf
      .smoothUnion(0.025, post, head)
      .smoothUnion(0.035, foot)
      .smoothUnion(0.026, bump)
      .smoothSubtract(0.022, sdf.sphere(0.05).at(-0.155, 0.665, 0.03))
      .displace(0.004, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 3, 1))
      .intersect(ground);

    // ------------------------------------------------------------------ carvings
    // A shallow oval panel, a deeper arrow inside it, and a numeral on the post below.
    const panelCutter = sdf
      .extrude(profile.rect([0.21, 0.105], 0.05), 0.09, 0.016)
      .at(0, HEAD_Y, 0.095);
    const arrow = arrowProfile(0.135, 0.06, 0.052, 0.084);
    const arrowCutter = sdf.extrude(arrow, 0.12, 0.009).at(-0.0675, HEAD_Y, 0.105);
    const numeralCutter = numeralThree().at(0, 0.3, 0.082);

    // ------------------------------------------------------------------ stone paint
    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      // Sun-bleached toward the crown, damp and dark at the foot, mottled in between.
      const bleach = clamp01((y - 0.5) / 0.2);
      const shade = clamp01(1 - y / 0.42);
      let c = mixRgb(base, STONE_LIGHT, bleach * 0.85);
      c = mixRgb(c, STONE_DEEP, shade * shade * 0.75);
      const mottle = noise.fbm(x * 6, y * 6, z * 6, 3, 2);
      c = mixRgb(c, STONE_DARK, clamp01(-mottle) * 0.6);
      c = mixRgb(c, STONE_LIGHT, clamp01(mottle - 0.15) * 0.5);
      const grain = noise.fbm(x * 40, y * 40, z * 40, 2, 7);
      c = mixRgb(c, STONE_DEEP, clamp01(grain) * 0.3);
      // Contact shadow where the head meets the post.
      c = mixRgb(c, STONE_DEEP, clamp01((0.04 - Math.abs(y - 0.5)) / 0.04) * 0.55);
      return c;
    };

    const stone = mass
      .subtract(panelCutter, arrowCutter, numeralCutter)
      .paintFn(stonePaint)
      .paintWhere(panelCutter, PANEL, 0.003)
      .paintWhere(arrowCutter, CARVE, 0.003)
      .paintWhere(numeralCutter, CARVE, 0.003);

    k.body('stone', stone, {
      color: '#9a9083',
      roughness: 0.9,
      metalness: 0,
      detail: 0.014,
      maxError: 0.008,
      maxTriangles: 2200,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0024 * noise.fbm(x * 34, y * 34, z * 34, 3, 11) +
        0.0008 * noise.noise3(x * 90, y * 90, z * 90, 23),
    });

    // ------------------------------------------------------------------ moss
    // A crust hugging the foot, creeping higher on the shaded -X side, plus a low ground patch.
    const shell = mass.round(0.013).subtract(mass.round(-0.005));
    const mossMask = sdf
      .ellipsoid([0.145, 0.065, 0.13])
      .at(-0.015, 0.012, 0)
      .smoothUnion(0.03, sdf.ellipsoid([0.08, 0.075, 0.07]).at(-0.085, 0.1, -0.03))
      .displace(0.024, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 3, 3));
    const mossCrust = shell.intersect(mossMask).round(0.004);
    const mossPatch = sdf
      .ellipsoid([0.15, 0.028, 0.13])
      .at(-0.02, 0.0, 0.0)
      .displace(0.014, (x, y, z) => noise.fbm(x * 14, y * 14, z * 14, 2, 8))
      .intersect(ground);
    const moss = mossCrust
      .union(mossPatch)
      .intersect(ground)
      .paintFn((x, y, z, base: Rgb) => {
        const t = clamp01(y / 0.1);
        let c = mixRgb(MOSS_DARK, base, clamp01(0.3 + 0.7 * t));
        const n = noise.fbm(x * 16, y * 16, z * 16, 3, 6);
        c = mixRgb(c, MOSS_DARK, clamp01(-n) * 0.5);
        c = mixRgb(c, MOSS_LIGHT, clamp01(n * 0.8 + 0.2) * 0.35);
        return c;
      });

    k.body('moss', moss, {
      color: '#5f7f3c',
      roughness: 0.98,
      metalness: 0,
      detail: 0.012,
      maxError: 0.004,
      maxTriangles: 450,
      paintWeight: 2,
      bump: (x, y, z) => 0.0035 * noise.fbm(x * 70, y * 70, z * 70, 3, 4),
    });

    // ------------------------------------------------------------------ grass tuft
    // A compact tuft of four chunky blades leaning out at the front-left foot.
    const blade = (bx: number, bz: number, tx: number, ty: number, tz: number, r: number): Sdf =>
      sdf.cone([bx, -0.01, bz], [tx, ty, tz], r, 0.003);
    const crown = sdf.ellipsoid([0.045, 0.018, 0.045]).at(0, 0.012, 0).intersect(ground);
    const grass = sdf
      .smoothUnion(
        0.006,
        crown,
        blade(0.09, 0.03, 0.13, 0.13, 0.05, 0.02),
        blade(-0.09, 0.05, -0.12, 0.12, 0.08, 0.019),
        blade(0.02, 0.09, 0.03, 0.15, 0.13, 0.019),
        blade(-0.05, -0.05, -0.08, 0.11, -0.09, 0.018),
      )
      .intersect(ground)
      .paintFn((x, y, z, base: Rgb) => {
        const t = clamp01(y / 0.14);
        let c = mixRgb(LEAF_DARK, base, clamp01(0.25 + 0.85 * t));
        const n = 0.5 + 0.5 * noise.fbm(x * 22, y * 22, z * 22, 2, 9);
        c = mixRgb(c, LEAF_DARK, (1 - n) * 0.4);
        c = mixRgb(c, LEAF, clamp01((t - 0.6) / 0.4) * 0.5);
        return c;
      });

    k.body('grass', grass, {
      color: '#5cb85c',
      roughness: 0.85,
      metalness: 0,
      detail: 0.012,
      maxError: 0.004,
      maxTriangles: 450,
      paintWeight: 2,
    });
  },
});
