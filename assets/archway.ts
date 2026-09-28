import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Rgb, Sdf } from '../src/index.js';

/**
 * Design note
 * Role: free-standing stone archway for the Sunken Vault dungeon kit; a gate between
 *   rooms. Must read as a stacked-stone arch at 128 px.
 * Size: 2.0 m wide (X), 2.2 m tall (Y), 0.4 m deep (Z), on y = 0, centred on the Y axis,
 *   front toward +Z. Opening is 1.1 m wide, round-headed.
 * One idea: two chunky pillars of pillow-beveled blocks carrying a round arch of wedge
 *   stones, with one proud keystone set with a small old-gold inlay.
 * Shape language: square sturdy blocks with deep rounded bevels (canon masonry).
 * Palette (60/30/10): cool gray stone #6f7680 dominant, dark joints toward #363c45;
 *   a few muted warm tan blocks as secondary variation; old gold #d4a93a inlay as the
 *   small accent; teal moss #3fae9a at the foot (canon touch).
 * Materials: one stone body (roughness 0.92), one gold inlay body (metalness 1),
 *   one moss body (roughness 0.9).
 * Detail list: primary = pillars + arch ring; secondary = plinths, keystone, joints;
 *   tertiary = weathering patches, worn tops, moss tufts. Focal point: keystone + inlay.
 * Rig / animation: none.
 */

// --------------------------------------------------------------------- layout
const D = 0.4; // full depth of shaft blocks and arch ring
const CORE_D = 0.34; // recessed joint-bed depth (dark core / ring backing)
const SPRING = 1.3; // arch centre height = pillar top
const R_IN = 0.55; // arch inner radius (1.1 m opening)
const R_OUT = 0.9; // arch outer radius; crown lands at 2.2 m
const R_MID = (R_IN + R_OUT) / 2;
const N_WEDGE = 7; // voussoirs; the middle one is the keystone
const JOINT = 0.03; // joint width
const P_IN = 0.55; // pillar inner face; outer face at 1.0
const KEY_R_OUT = 0.96; // keystone radial pride
const KEY_D = 0.47; // keystone depth pride

// --------------------------------------------------------------------- palette
const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#4b525c');
const STONE_LIGHT = rgb('#8d949e');
const WORN = rgb('#9aa1ab');
const LIGHT_BLOCK = rgb('#aab2bd');
const MORTAR = rgb('#363c45');
const UNDERSHADOW = rgb('#2b313a');
const TAN = rgb('#978a74');
const GOLD = rgb('#d4a93a');
const MOSS = rgb('#3fae9a');
const MOSS_DARK = rgb('#2d7f73');
const MOSS_LIGHT = rgb('#63c9b5');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** 2D arc points around the arch centre (0, SPRING) at radius r, degrees. */
const arcAt = (r: number, a0: number, a1: number, n: number): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push([Math.cos(a) * r, SPRING + Math.sin(a) * r]);
  }
  return pts;
};

/** One radial voussoir wedge between two radii. */
const wedgeProfile = (a0: number, a1: number, rIn: number, rOut: number) => {
  const n = Math.max(6, Math.round(Math.abs(a1 - a0) / 5));
  const pts: [number, number][] = [...arcAt(rIn, a0, a1, n)];
  pts.push(...arcAt(rOut, a1, a0, n));
  return profile.polygon(pts);
};

/** Upper half annulus between two radii, the recessed ring backing. */
const ringBackProfile = (rIn: number, rOut: number) => {
  const pts: [number, number][] = [...arcAt(rOut, 0, 180, 40)];
  pts.push(...arcAt(rIn, 180, 0, 40));
  return profile.polygon(pts);
};

export default defineAsset({
  name: 'archway',
  description:
    'Free-standing stone archway: two chunky pillars of stacked pillow-beveled blocks on plinths, a round arch of wedge stones with a proud keystone set with an old-gold inlay, teal moss at the foot.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/archway-mock.jpg',

  build(k) {
    // ------------------------------------------------------------ pillar (+X side)
    // Canon build: proud pillow blocks over a recessed dark joint bed. One plinth, three
    // courses, slight per-block jitter and tilt so the stack reads hand-laid.
    const pillarParts: Sdf[] = [];
    pillarParts.push(
      sdf.box([1 - P_IN, SPRING, CORE_D], 0.02).at((P_IN + 1) / 2, SPRING / 2, 0),
    );
    pillarParts.push(sdf.box([0.5, 0.14, 0.44], 0.028).at(0.77, 0.07, 0));
    const courses: [number, number, number][] = [
      [0.14, 0.58, 1],
      [0.58, 0.94, 2],
      [0.94, 1.3, 3],
    ];
    for (const [y0, y1, seed] of courses) {
      const jx = (noise.random(seed, 3, 1) - 0.5) * 0.012;
      const rot = (noise.random(seed, 5, 2) - 0.5) * 2.2;
      pillarParts.push(
        sdf
          .box([1 - P_IN, y1 - y0, D], 0.034)
          .rotateZ(rot)
          .at((P_IN + 1) / 2 + jx, (y0 + y1) / 2, 0),
      );
    }
    const pillar = sdf.union(...pillarParts).mirror('x', 0);

    // ------------------------------------------------------------ arch ring
    const halfGap = (JOINT / 2 / R_MID) * (180 / Math.PI);
    const KEY_EXTRA = 2.5; // keystone borrows this many degrees from each neighbour
    const voussoirs: Sdf[] = [];
    for (let i = 0; i < N_WEDGE; i++) {
      let a0 = (180 * i) / N_WEDGE + halfGap;
      let a1 = (180 * (i + 1)) / N_WEDGE - halfGap;
      if (i === (N_WEDGE - 1) / 2) {
        a0 -= KEY_EXTRA;
        a1 += KEY_EXTRA;
      }
      if (i === (N_WEDGE - 1) / 2 - 1) a1 -= KEY_EXTRA;
      if (i === (N_WEDGE - 1) / 2 + 1) a0 += KEY_EXTRA;
      const keystone = i === (N_WEDGE - 1) / 2;
      voussoirs.push(
        sdf.extrude(
          wedgeProfile(a0, a1, R_IN, keystone ? KEY_R_OUT : R_OUT),
          keystone ? KEY_D : D,
          keystone ? 0.03 : 0.028,
        ),
      );
    }
    const ringBack = sdf.extrude(ringBackProfile(R_IN, R_OUT), CORE_D, 0.02);
    const arch = sdf.union(ringBack, ...voussoirs);

    // ------------------------------------------------------------ stone paint
    const halfGapDeg = (JOINT / 2 / R_MID) * (180 / Math.PI);
    const seg = 180 / N_WEDGE;
    const stonePaint = (x: number, y: number, z: number): Rgb => {
      const ax = Math.abs(x);
      const r = Math.hypot(x, y - SPRING);
      const ang = (Math.abs(Math.atan2(y - SPRING, x)) * 180) / Math.PI;

      // Per-block value plan: whole blocks read darker, lighter, warm, or base, like the
      // mixed masonry of the mockup. Quantized to the actual blocks.
      const inKey = ang > 90 - seg - 3 && ang < 90 + seg + 3 && r < KEY_R_OUT + 0.02;
      const inRing =
        y > SPRING - 0.02 && r > R_IN - 0.01 && (r < R_OUT + 0.01 || inKey);
      let value = 0; // + lighter, - darker
      let warmBlock = 0;
      if (inRing) {
        const i = Math.min(N_WEDGE - 1, Math.floor(ang / seg));
        const h = noise.random(i + 1, 21, 4);
        value = h > 0.62 ? 0.42 : h < 0.4 ? -0.36 : 0;
        warmBlock = noise.random(i + 1, 33, 8) > 0.78 ? 0.5 : 0;
      } else if (ax > 0.53 && y < 1.305) {
        const c = y < 0.14 ? 0 : y < 0.58 ? 1 : y < 0.94 ? 2 : 3;
        const side = x > 0 ? 0 : 1;
        const h = noise.random(c * 2 + side + 1, 21, 4);
        value = h > 0.6 ? 0.38 : h < 0.42 ? -0.34 : 0;
        warmBlock = noise.random(c * 2 + side + 1, 33, 8) > 0.76 ? 0.5 : 0;
      }

      const patch = 0.5 + 0.5 * noise.fbm(x * 3.3, y * 3.3, z * 3.3, 3);
      let c = mixRgb(STONE, STONE_DARK, 0.3 * patch);
      const spec = 0.5 + 0.5 * noise.noise3(x * 25, y * 25, z * 25, 4);
      c = mixRgb(c, STONE_LIGHT, 0.08 * spec);
      if (value > 0) c = mixRgb(c, LIGHT_BLOCK, value);
      else if (value < 0) c = mixRgb(c, STONE_DARK, -value);
      c = mixRgb(c, TAN, warmBlock);

      // Worn pale tops: the upper edge of every course and the outer arc of the ring.
      let worn = 0;
      for (const t of [0.14, 0.58, 0.94, 1.3]) {
        worn = Math.max(
          worn,
          smoothstep(t - 0.1, t - 0.025, y) * (1 - smoothstep(t + 0.004, t + 0.03, y)),
        );
      }
      worn = Math.max(
        worn,
        smoothstep(R_OUT - 0.15, R_OUT - 0.04, r) * smoothstep(SPRING - 0.02, SPRING + 0.08, y),
      );
      c = mixRgb(c, WORN, 0.62 * clamp01(worn));

      // Dark joints: horizontal course beds, painted vertical seams, radial wedge joints.
      let joint = 0;
      for (const t of [0.14, 0.58, 0.94]) {
        joint = Math.max(joint, smoothstep(0.055, 0.022, Math.abs(y - t)));
      }
      if (y < 1.31 && ax > 0.53) {
        const seamX = y < 0.14 ? 0.78 : y < 0.58 ? 0.74 : y < 0.94 ? 0.815 : 0.765;
        joint = Math.max(joint, smoothstep(0.026, 0.01, Math.abs(ax - seamX)));
      }
      if (y > SPRING - 0.02 && r > R_IN - 0.01 && r < R_OUT + 0.05) {
        const m = ((ang % seg) + seg) % seg;
        joint = Math.max(joint, smoothstep(halfGapDeg * 2.2 + 3.0, halfGapDeg * 0.8, Math.min(m, seg - m)));
      }
      c = mixRgb(c, MORTAR, 0.88 * clamp01(joint));

      // Shadowed intrados (the arch ceiling) and the opening's side walls, a deep
      // passage shadow so the middle reads open.
      if (y > SPRING - 0.02 && r > R_IN - 0.008 && r < R_IN + 0.06) {
        c = mixRgb(c, UNDERSHADOW, 0.85);
      }
      if (ax > 0.52 && ax < 0.6 && y < SPRING) {
        c = mixRgb(c, UNDERSHADOW, 0.85 * (1 - 0.4 * smoothstep(0.6, 1.3, y)));
      }
      // The keystone reads a touch lighter than its neighbours.
      if (y > SPRING && ang > 90 - seg && ang < 90 + seg && r > R_IN && r < KEY_R_OUT) {
        c = mixRgb(c, STONE_LIGHT, 0.08);
      }
      // Grime at the foot.
      c = mixRgb(c, UNDERSHADOW, 0.55 * (1 - smoothstep(0.0, 0.07, y)));
      c = mixRgb(c, STONE_DARK, 0.45 * (1 - smoothstep(0.0, 0.2, y)));
      return c;
    };

    const stone = sdf.union(pillar, arch);
    k.body('stone', stone.paintFn(stonePaint), {
      color: STONE,
      roughness: 0.92,
      metalness: 0,
      detail: 0.02,
      maxError: 0.01,
      maxTriangles: 5400,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 21, y * 21, z * 21, 3),
    });

    // ------------------------------------------------------------ gold inlay
    // A small diamond set into the keystone's front face; the focal accent.
    const inlayY = SPRING + (R_IN + KEY_R_OUT) / 2;
    const inlay = sdf
      .extrude(
        profile.polygon([
          [0, 0.085],
          [0.062, 0],
          [0, -0.085],
          [-0.062, 0],
        ]),
        0.024,
        0.008,
      )
      .at(0, inlayY, KEY_D / 2 - 0.005);
    k.body('gold-inlay', inlay, {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.008,
      maxTriangles: 160,
    });

    // ------------------------------------------------------------ moss
    // Small lumpy teal clumps hugging the plinths, front and back (the Sunken Vault damp).
    const tuft = (x: number, y: number, z: number, s: number): Sdf =>
      sdf
        .ellipsoid([0.05 * s, 0.026 * s, 0.034 * s])
        .at(x, y, z)
        .smoothUnion(
          0.012,
          sdf.ellipsoid([0.03 * s, 0.018 * s, 0.024 * s]).at(x + 0.038 * s, y - 0.003, z + 0.012 * s),
        )
        .intersect(sdf.halfSpace([0, -1, 0], 0));
    const mossShape = sdf
      .union(
        tuft(0.56, 0.016, 0.21, 0.9),
        tuft(0.92, 0.014, 0.212, 0.7),
        tuft(0.68, 0.012, 0.224, 0.5),
        tuft(0.6, 0.016, -0.21, 0.75),
        tuft(0.9, 0.013, -0.212, 0.6),
      )
      .mirror('x', 0);
    k.body(
      'moss',
      mossShape.paintFn((x, y, z) => {
        const v = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
        return mixRgb(
          mixRgb(MOSS_DARK, MOSS, 0.25 + 0.45 * v),
          MOSS_LIGHT,
          0.25 * smoothstep(0.02, 0.06, y),
        );
      }),
      { color: MOSS_DARK, roughness: 0.9, metalness: 0, detail: 0.014, maxTriangles: 600 },
    );
  },
});
