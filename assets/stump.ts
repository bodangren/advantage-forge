import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * Stump — Chibi Quest nature prop (catalog `nature/terrain/stump`).
 *
 * - Role: forest-floor landmark that reads at 128 px; a place to sit or a quest marker.
 * - Size: 0.5 m wide, 0.4 m tall, stands on y = 0, centred on the Y axis, faces +Z.
 * - One idea: a chunky cut trunk flaring into thick gripping buttress roots, capped by a
 *   pale growth-ring top and a small cluster of red toadstools on the front-right.
 * - Shape language: round dominant (fat tapered trunk, soft root lobes, beveled rims);
 *   the flat pale cut is the square secondary read.
 * - Palette (scene contract): bark #8a5a35 (dominant), dark #5f3d22, deep #3d2717,
 *   light #a4713f; pale cut #d2a870 with rings #a87d4b / #8a6238; moss #4a8a3f with
 *   #7ec850 highlights and #2f7a3f shadows; mushrooms red #d9443a with white spots #f2eadb
 *   and cream stems #e8d9b8. Value plan: dark bark mass, bright pale top, small red accent.
 * - Materials: one wood body (bark and cut, roughness 0.88), matte moss (0.9), satin cap
 *   (0.5), matte stems (0.78). Fine bark grooves and grain live in `bump`; only the coarse
 *   1 cm gnarl sits in `displace`.
 * - Detail: (1) trunk + 5 buttress roots + flat cut, (2) growth rings and the knot,
 *   (3) the moss pads and the 3-mushroom cluster. Focal point: the pale ringed top.
 * - Rig/animation: none (static prop).
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

const BARK_DARK = rgb('#5f3d22');
const BARK_DEEP = rgb('#3d2717');
const BARK_LIGHT = rgb('#a4713f');
const CUT = rgb('#d2a870');
const CUT_LIGHT = rgb('#e4c088');
const CUT_RING = rgb('#a87d4b');
const CUT_DARK = rgb('#8a6238');
const MOSS_MID = rgb('#4a8a3f');
const MOSS_LIGHT = rgb('#7ec850');
const MOSS_DARK = rgb('#2f7a3f');
const CAP_RED = rgb('#d9443a');
const CAP_LIGHT = rgb('#e8604f');
const CAP_DARK = rgb('#a72e27');
const SPOT = '#f2eadb';
const STEM_SHADE = rgb('#c0a878');

const TOP_Y = 0.4; // flat cut height
const TRUNK_R = 0.185; // radius at the base (roots flare past it to ~0.5 m wide)
const TOP_R = 0.174; // radius at the cut (slightly narrower than the base)
const BEVEL = 0.006;

// Azimuths of the five buttress roots (degrees, standard atan2(z, x)). The wide gap near
// 70 degrees leaves room for the mushroom cluster; roots flank the front view left and right.
// Each starts high up the trunk and runs out to the ground, so the flare reads in silhouette.
const ROOTS: readonly { a: number; reach: number; r: number; up: number }[] = [
  { a: 12, reach: 0.198, r: 0.048, up: 0.25 },
  { a: 118, reach: 0.192, r: 0.045, up: 0.23 },
  { a: 172, reach: 0.202, r: 0.05, up: 0.27 },
  { a: 232, reach: 0.19, r: 0.043, up: 0.21 },
  { a: 298, reach: 0.2, r: 0.049, up: 0.25 },
];

// Vertical bark ridges: elongated along Y, several ridges around the trunk (as in oak-tree).
const ridges = (x: number, y: number, z: number): number => noise.fbm(x * 16, y * 1.1, z * 16, 3, 41);

/** One buttress root: a thick tapered lobe from up the trunk down and out to the ground. */
const rootShape = (a: number, reach: number, r: number, up: number): Sdf => {
  const rad = (a * Math.PI) / 180;
  const cx = Math.cos(rad);
  const cz = Math.sin(rad);
  // A wide root sweeping down from the trunk (r * 2.05) to a rounded tip on the ground.
  return sdf.cone([cx * 0.075, up, cz * 0.075], [cx * reach, 0.018, cz * reach], r * 2.05, r);
};

export default defineAsset({
  name: 'stump',
  description:
    'Chunky cut tree stump, 0.5 m wide: rough bark sides, five flared buttress roots, a pale growth-ring top, and a small cluster of red toadstools.',
  detail: 0.008,
  reference: 'docs/item-mockups/stump-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ trunk
    // Fat irregular column, cut flat at TOP_Y with soft beveled rims (round then re-cut).
    let wood: Sdf = sdf.chain(
      [
        [0.0, -0.02, 0.0, TRUNK_R],
        [0.01, 0.1, 0.004, TRUNK_R - 0.003],
        [-0.007, 0.22, 0.0, TRUNK_R - 0.006],
        [0.005, 0.32, 0.006, TRUNK_R - 0.009],
        [0.0, TOP_Y, 0.008, TOP_R],
      ],
      0.06,
    );
    // Buttress roots.
    wood = sdf.smoothUnion(
      0.02,
      wood,
      ...ROOTS.map((r) => rootShape(r.a, r.reach, r.r, r.up)),
    );
    // One short broken branch stub on the back-left, to break the silhouette.
    const stubRad = (205 * Math.PI) / 180;
    wood = wood.smoothUnion(
      0.025,
      sdf.cone(
        [Math.cos(stubRad) * 0.1, 0.27, Math.sin(stubRad) * 0.1],
        [Math.cos(stubRad) * 0.215, 0.315, Math.sin(stubRad) * 0.205],
        0.05,
        0.026,
      ),
    );
    // A knot bulge on the front-right flank.
    const knotRad = (66 * Math.PI) / 180;
    const knot: Vec3 = [Math.cos(knotRad) * 0.182, 0.21, Math.sin(knotRad) * 0.182];
    wood = wood.smoothUnion(0.028, sdf.ellipsoid([0.042, 0.038, 0.042]).at(knot[0], knot[1], knot[2]));

    // Gnarled bark relief, then a flat ground and a flat beveled cut top.
    wood = wood.displace(0.013, (x, y, z) => noise.fbm(x * 7, y * 1.7, z * 7, 2, 31));
    const cutTop = sdf.halfSpace([0, 1, 0], TOP_Y);
    const cutGround = sdf.halfSpace([0, -1, 0], 0);
    wood = wood.intersect(cutTop).intersect(cutGround).round(BEVEL).intersect(cutTop).intersect(cutGround);

    const topW = (x: number, y: number, z: number): number => clamp01((y - (TOP_Y - 0.012)) / 0.008);
    const knotDist = (x: number, y: number, z: number): number =>
      Math.hypot(x - knot[0], y - knot[1], z - knot[2]);

    // Growth rings on the pale top: concentric bands around a slightly off-centre pith.
    const ringAt = (x: number, z: number): number => {
      const d = Math.hypot(x - 0.006, z + 0.012);
      return 0.5 + 0.5 * Math.sin(d * 200 + noise.fbm(x * 22, 0, z * 22, 2, 51) * 1.4);
    };

    const barkPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      let c = mixRgb(base, BARK_DARK, 0.18 + 0.22 * (0.5 + 0.5 * noise.fbm(x * 3, y * 3, z * 3, 2, 11)));
      // Vertical bark ridges: deep furrows and pale weathered crests.
      const g = ridges(x, y, z);
      c = mixRgb(c, BARK_DEEP, smoothstep(-0.02, -0.55, g) * 0.92);
      c = mixRgb(c, BARK_LIGHT, smoothstep(0.05, 0.5, g) * 0.45);
      // Sunny shoulder, damp shaded base.
      c = mixRgb(c, BARK_LIGHT, clamp01((y - 0.12) / 0.28) * 0.18);
      c = mixRgb(c, BARK_DEEP, clamp01((0.16 - y) / 0.16) * 0.88);
      // A darker, warmer ring around the knot.
      c = mixRgb(c, BARK_DARK, clamp01((0.07 - knotDist(x, y, z)) / 0.05) * 0.45);
      // Shaded lip just under the cut: the dark band the mock shows beneath the pale top.
      c = mixRgb(c, BARK_DEEP, smoothstep(0.22, 0.39, y) * 0.55 * (1 - topW(x, y, z)));
      // Moss patches, weighted to the shaded back and the low flanks.
      const low = clamp01((0.11 - y) / 0.11);
      const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2, 91);
      const back = 0.45 + 0.55 * clamp01(-z * 2.5);
      const mw = low * clamp01((patch - 0.5) * 3.1) * back;
      if (mw > 0.004) {
        const v = noise.fbm(x * 9, y * 7, z * 9, 2, 23);
        let mc = mixRgb(MOSS_DARK, MOSS_MID, clamp01(0.3 + v * 0.9));
        mc = mixRgb(mc, MOSS_LIGHT, clamp01(v * 1.1 + 0.3) * 0.55);
        c = mixRgb(c, mc, mw);
      }
      // The pale cut: growth rings, a darker outer ring, and a thin dark bark lip.
      const tw = topW(x, y, z);
      if (tw > 0.004) {
        const d = Math.hypot(x - 0.006, z + 0.012);
        const ring = ringAt(x, z);
        let pc = mixRgb(CUT, CUT_LIGHT, 0.45 * (1 - ring));
        pc = mixRgb(pc, CUT_DARK, ring * 0.62);
        pc = mixRgb(pc, CUT_RING, 0.12);
        pc = mixRgb(pc, CUT_DARK, smoothstep(0.11, 0.175, d) * 0.5);
        pc = mixRgb(pc, BARK_DARK, smoothstep(0.16, 0.186, d) * 0.85);
        // Small dark pith at the centre where the rings converge.
        pc = mixRgb(pc, CUT_DARK, clamp01((0.012 - d) / 0.012) * 0.65);
        c = mixRgb(c, pc, tw);
      }
      return c;
    };

    const barkBump = (x: number, y: number, z: number): number => {
      const tw = clamp01(topW(x, y, z));
      const groove = 0.007 * ridges(x, y, z) * (1 - 0.85 * tw);
      const grain = 0.0012 * noise.noise3(x * 85, y * 22, z * 85, 2) * (1 - 0.7 * tw);
      // Slightly recessed growth rings on the cut.
      const ring = ringAt(x, z);
      const ringRelief = -0.0012 * clamp01(ring * 1.3 - 0.35) * tw;
      return groove + grain + ringRelief;
    };

    k.body('bark', wood.paintFn(barkPaint), {
      color: '#8a5a35',
      roughness: 0.88,
      metalness: 0,
      detail: 0.011,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 2200,
      bump: barkBump,
    });

    // ------------------------------------------------------------------ moss pads
    // A small cushion under the mushroom cluster plus a low lump on the back root.
    const clusterA = (66 * Math.PI) / 180;
    const clusterOut: Vec3 = [Math.cos(clusterA), 0, Math.sin(clusterA)];
    const clusterTan: Vec3 = [-Math.sin(clusterA), 0, Math.cos(clusterA)];
    const probe: Vec3 = [clusterOut[0] * 0.5, 0.05, clusterOut[2] * 0.5];
    const hit = sdf.surfacePoint(wood, probe, -0.004);
    const cx = hit[0];
    const cz = hit[2];

    const mossPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const n = 0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 3, 61);
      const sun = clamp01((y - 0.012) / 0.045);
      let c = mixRgb(MOSS_DARK, MOSS_MID, 0.15 + 0.75 * n);
      c = mixRgb(c, MOSS_LIGHT, sun * (0.3 + 0.45 * n));
      c = mixRgb(c, rgb('#245c30'), clamp01(1 - y / 0.035) * 0.45);
      return c;
    };

    const pad = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.078, 0.022, 0.072]).at(cx, 0.0, cz),
        sdf.ellipsoid([0.05, 0.018, 0.046]).at(cx + clusterTan[0] * 0.055, 0.0, cz + clusterTan[2] * 0.055),
        sdf.ellipsoid([0.044, 0.016, 0.042]).at(cx - clusterOut[0] * 0.02, 0.0, cz - clusterOut[2] * 0.02),
      )
      .displace(0.006, (x, y, z) => noise.fbm(x * 11, y * 11, z * 11, 2, 7))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(mossPaint);
    k.body('moss-pad', pad, {
      color: '#4a8a3f',
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      textureDensity: 1.5,
      paintWeight: 2,
      maxTriangles: 320,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 30, y * 30, z * 30, 2, 13),
    });

    // ------------------------------------------------------------------ mushrooms
    interface Shroom {
      readonly o: number; // outward offset from the cluster centre
      readonly t: number; // tangential offset
      readonly lean: number;
      readonly h: number;
      readonly r0: number;
      readonly r1: number;
      readonly capR: number;
      readonly capH: number;
    }
    const SHROOMS: readonly Shroom[] = [
      { o: 0.016, t: 0.004, lean: 13, h: 0.06, r0: 0.026, r1: 0.021, capR: 0.056, capH: 0.057 },
      { o: -0.004, t: 0.072, lean: 17, h: 0.043, r0: 0.02, r1: 0.016, capR: 0.041, capH: 0.042 },
      { o: 0.048, t: -0.06, lean: 8, h: 0.027, r0: 0.014, r1: 0.011, capR: 0.029, capH: 0.03 },
    ];
    const spin = 90 - (clusterA * 180) / Math.PI; // rotateY(spin) points local +Z outward
    const baseOf = (m: Shroom): [number, number] =>
      [
        cx + clusterOut[0] * m.o + clusterTan[0] * m.t,
        cz + clusterOut[2] * m.o + clusterTan[2] * m.t,
      ];
    const pose = (m: Shroom, s: Sdf): Sdf => {
      const [bx, bz] = baseOf(m);
      return s.rotateX(m.lean).rotateY(spin).at(bx, 0, bz);
    };

    const capProfile = (R: number, H: number): [number, number][] => [
      [0, H],
      [0.3 * R, 0.965 * H],
      [0.58 * R, 0.87 * H],
      [0.82 * R, 0.68 * H],
      [0.96 * R, 0.42 * H],
      [1.0 * R, 0.2 * H],
      [0.94 * R, 0.05 * H],
      [0.72 * R, 0.0],
      [0, 0.0],
    ];

    const stemOf = (m: Shroom): Sdf =>
      pose(
        m,
        sdf.chain(
          [
            [0, m.r0 * 0.7, 0, m.r0],
            [m.h * 0.06, m.h * 0.55, 0, m.r1 * 1.05],
            [m.h * 0.14, m.h - 0.004, 0, m.r1],
          ],
          0.016,
        ),
      );

    const capOf = (m: Shroom): Sdf => {
      let cap = sdf.revolve(profile.polygon(capProfile(m.capR, m.capH), { smooth: true, samples: 8 }));
      // Shaded rim, lit apex.
      cap = cap.paintFn((x, y, _z, b: Rgb) => {
        const t = clamp01(y / m.capH);
        let c = mixRgb(b, CAP_DARK, (1 - t) * 0.45);
        c = mixRgb(c, CAP_LIGHT, smoothstep(0.5, 1, t) * 0.32);
        return mixRgb(c, CAP_DARK, clamp01(-noise.fbm(x * 18, y * 18, _z * 18, 2, 5)) * 0.14);
      });
      // Pale gill underside.
      cap = cap.paintWhere(sdf.box([3 * m.capR, 0.05, 3 * m.capR]).at(0, -0.016 * m.capH, 0), '#efe0c8', 0.0015);
      // Three chunky white spots per cap, riding the dome.
      const spots: readonly [number, number, number][] = [
        [0.3, 0.95, 20],
        [0.62, 0.8, 150],
        [0.8, 0.55, 285],
      ];
      for (const [rf, hf, az] of spots) {
        const a = (az * Math.PI) / 180;
        const sr = m.capR * 0.17;
        const st = sdf
          .ellipsoid([sr * 1.35, sr, sr])
          .rotateY(-(az + 90))
          .at(Math.cos(a) * rf * m.capR, hf * m.capH, Math.sin(a) * rf * m.capR);
        cap = cap.paintWhere(st, SPOT, 0.0016);
      }
      return pose(m, cap.at(m.h * 0.14, m.h, 0));
    };

    const stems = sdf.union(...SHROOMS.map(stemOf)).intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('mushroom-stems', stems.paintFn((x, y, _z, b: Rgb) => {
      let c = mixRgb(STEM_SHADE, b, smoothstep(0, 0.02, y));
      c = mixRgb(c, rgb('#f4ead0'), clamp01(noise.fbm(x * 34, y * 6, _z * 34, 2, 17)) * 0.3);
      return c;
    }), {
      color: '#e8d9b8',
      roughness: 0.78,
      metalness: 0,
      detail: 0.006,
      textureDensity: 1.5,
      maxTriangles: 260,
    });

    k.body('mushroom-caps', sdf.union(...SHROOMS.map(capOf)), {
      color: '#d9443a',
      roughness: 0.5,
      metalness: 0,
      detail: 0.008,
      textureDensity: 2,
      maxTriangles: 900,
    });
  },
});
