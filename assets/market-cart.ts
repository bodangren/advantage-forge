import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — two-wheeled market cart (props/craft-and-trade/market-cart).
 *
 * Role: parked produce cart in the village market square; must read at 128 px
 *   as one honey-oak cart heaped with colorful vegetables.
 * Size: bed 1.2 m long (Z) x 0.8 m wide (X), side rim at 0.7 m; two 0.7 m
 *   wheels; stands on y = 0 on both wheels and the two shaft tips, centred on
 *   Y, shafts and low front board toward +Z.
 * One idea: a chunky plank cart whose two big spoked wheels, long ground-
 *   reaching shafts, and a tall mounded heap of cabbages / carrots / apples
 *   break the silhouette everywhere.
 * Shape language: round dominant (wheels, produce heap), square secondary
 *   (plank bed, low sides, straight shafts).
 * Palette: honey oak #b5814a (dominant), warm brown #8a5a35 + walnut #6b4226
 *   (secondary), pale cut wood #c9a06a (lit tops); iron #4a4f55 (small);
 *   accent produce: cabbage #9ed36a, carrot #e8823a, apple #d92b1f, leaf
 *   green #5cb85c, straw #e0bb60, burlap #c8a86b. 60/30/10.
 * Materials: wood (roughness 0.8), worn iron (0.5 / 0.7), burlap (0.9),
 *   food (0.35 apple gloss .. 0.65). One body per material family.
 * Detail: primary bed + wheels + shafts + heap; secondary rails, posts, axle,
 *   hub caps, rim bands, sack; tertiary plank seams, nail dots, grain, carrot
 *   rings, cabbage creases in paint + bump. Focal point: the produce heap.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const IRON = '#4a4f55';
const IRON_HI = '#a8acb1';
const BURLAP = rgb('#c8a86b');
const BURLAP_DARK = rgb('#9a7c4a');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#3c7a3d');
const LEAF_LIGHT = rgb('#86d47e');
const HEAD = rgb('#9ed36a');
const HEAD_LIGHT = rgb('#c3e88f');
const HEAD_DARK = rgb('#6fae43');
const CARROT = rgb('#e8823a');
const CARROT_DARK = rgb('#b8641f');
const APPLE = rgb('#d92b1f');
const APPLE_DARK = rgb('#9c140c');
const APPLE_HI = rgb('#ff6a44');
const STRAW = rgb('#e0bb60');
const STRAW_DARK = rgb('#b08a3a');
const STEM = '#6b4426';

const AXLE_Y = 0.35; // wheel radius 0.35 -> wheels stand on y = 0
const RIM_R = 0.3;
const RIM_T = 0.05;
const WHEEL_X = 0.46; // wheel centre off-axis (rim inner face at 0.41)
const BED_TOP = 0.44; // produce floor
const RIM_TOP = 0.695; // side-board rim

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'market-cart',
  description:
    'A honey-oak market cart: two big spoked wheels on an iron-banded axle, low plank sides, two long shafts reaching forward to the ground, and a heaped load of cabbages, carrots, and apples with a burlap sack.',
  detail: 0.007,
  reference: 'docs/item-mockups/market-cart-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wheels
    // Chunky wooden wheel: torus rim, fat hub, six round spokes, axis along X.
    // Both wheels share one mirrored wood body.
    const rim = sdf.torus(RIM_R, RIM_T).rotateZ(90);
    const hub = sdf.cylinder(0.062, 0.08, 0.01).rotateZ(90);
    const spokes: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 6; i++) {
      spokes.push(
        sdf.capsule([0, 0.05, 0], [0, RIM_R - 0.045, 0], 0.014).rotateX(i * 60),
      );
    }
    const wheel = sdf
      .smoothUnion(0.01, rim, hub, ...spokes)
      .at(WHEEL_X, AXLE_Y, 0)
      .mirror('x', 0);
    const wheelPaint = (x: number, y: number, z: number) => {
      const r = Math.hypot(y - AXLE_Y, z); // radial in the wheel plane
      const grain = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
      let c = mixRgb(OAK, PALE, 0.14 * grain);
      c = mixRgb(c, BROWN, 0.55 * clamp01((r - 0.24) / 0.11)); // darker rim
      c = mixRgb(c, PALE, 0.45 * clamp01((0.075 - r) / 0.075)); // pale hub
      c = mixRgb(c, WALNUT, 0.35 * clamp01((0.14 - y) / 0.14)); // damp lower half
      return c;
    };
    k.body('wheels', wheel.paintFn(wheelPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.009,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 2000,
    });

    // ------------------------------------------------------------------ iron work
    // Axle through the bed, hub caps with bright nuts, and a thin iron strake
    // band hugging each rim (shell of the rim cut by a thin slab).
    const axle = sdf.cylinder(0.02, 1.04, 0.004).rotateZ(90).at(0, AXLE_Y, 0);
    const cap = sdf.cylinder(0.072, 0.024, 0.004).rotateZ(90).at(WHEEL_X + 0.046, AXLE_Y, 0);
    const nut = sdf.sphere(0.017).at(WHEEL_X + 0.056, AXLE_Y, 0);
    const rimTorus = sdf.torus(RIM_R, RIM_T).rotateZ(90);
    const strake = rimTorus
      .round(0.004)
      .subtract(rimTorus.round(-0.003))
      .intersect(sdf.box([0.024, 0.9, 0.9], 0.006));
    const strakeL = strake.at(WHEEL_X, AXLE_Y, 0);
    const iron = sdf
      .union(axle, cap.mirror('x', 0), nut.mirror('x', 0), strakeL.mirror('x', 0))
      .paintWhere(sdf.box([0.03, 0.08, 0.08], 0.004).at(WHEEL_X + 0.055, AXLE_Y, 0), IRON_HI, 0.004)
      .paintWhere(sdf.box([0.03, 0.08, 0.08], 0.004).at(-WHEEL_X - 0.055, AXLE_Y, 0), IRON_HI, 0.004);
    k.body('iron-work', iron, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 776,
    });

    // ------------------------------------------------------------------ bed
    // One oak body: plank floor, low side boards (front board lower so the
    // load shows), corner posts, under-rails, axle blocks, front and rear
    // beams, two long shafts reaching forward to the ground, and the pull
    // crossbar between the shaft tips.
    const floorBoard = sdf.box([0.78, 0.045, 1.18], 0.012).at(0, BED_TOP - 0.0225, 0);
    const sideL = sdf.box([0.035, 0.25, 1.24], 0.012).at(-0.3825, RIM_TOP - 0.125, 0);
    const back = sdf.box([0.77, 0.25, 0.035], 0.012).at(0, RIM_TOP - 0.125, -0.6025);
    const front = sdf.box([0.77, 0.18, 0.035], 0.012).at(0, RIM_TOP - 0.09, 0.6025);
    const post = sdf.box([0.05, 0.28, 0.05], 0.012).at(0.375, RIM_TOP - 0.13, 0.595);
    const rail = sdf.box([0.06, 0.085, 1.14], 0.012).at(0.3, 0.3625, 0);
    const axleBlock = sdf.box([0.09, 0.09, 0.12], 0.01).at(0.3, AXLE_Y + 0.01, 0);
    const beamF = sdf.box([0.5, 0.055, 0.05], 0.01).at(0, 0.4, 0.63);
    const beamB = sdf.box([0.56, 0.06, 0.05], 0.01).at(0, 0.4, -0.63);
    const shaft = sdf.capsule([0.27, 0.44, 0.52], [0.3, 0.033, 1.38], 0.03);
    const grip = sdf.capsule([-0.31, 0.06, 1.35], [0.31, 0.06, 1.35], 0.034);
    const bed = sdf.smoothUnion(
      0.015,
      floorBoard,
      sideL.mirror('x', 0),
      back,
      front,
      post.mirror('x', 0).mirror('z', 0),
      rail.mirror('x', 0),
      axleBlock.mirror('x', 0),
      beamF,
      beamB,
      shaft.mirror('x', 0),
      grip,
    );
    // Nail heads on the outer side boards (painted dots, no geometry cost).
    const nails: [number, number, number][] = [];
    for (const sx of [-1, 1])
      for (const nz of [-0.45, 0, 0.45])
        for (const ny of [0.51, 0.645]) nails.push([sx * 0.401, ny, nz]);
    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 6, z * 22, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 6 + 9, y * 6, z * 6, 2);
      let c = mixRgb(OAK, PALE, 0.12 * grain + 0.12 * patch);
      c = mixRgb(c, BROWN, 0.3 * grain * grain * grain);
      // Side boards: one painted plank seam + per-board tint.
      if (Math.abs(x) > 0.36 && y > 0.45) {
        const f = (y - 0.445) / 0.25;
        const seam = Math.exp(-Math.pow((f - 0.5) / 0.07, 2));
        c = mixRgb(c, WALNUT, 0.68 * seam);
        c = mixRgb(c, PALE, 0.1 * noise.random(f < 0.5 ? 0 : 1, x > 0 ? 3 : 5, 1));
      }
      // Shafts read a touch darker than the bed.
      if (z > 0.55) {
        const hgrain = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 5, 2);
        c = mixRgb(c, BROWN, 0.26 + 0.2 * hgrain);
      }
      // Nail dots on the outer side faces.
      if (Math.abs(x) > 0.393) {
        for (const [nx, ny, nz] of nails) {
          if (Math.sign(nx) !== Math.sign(x)) continue;
          const d2 = (y - ny) * (y - ny) + (z - nz) * (z - nz);
          if (d2 < 0.00007) c = mixRgb(c, WALNUT, 0.85);
        }
      }
      // Value plan: shaded underside, sun-lit rim and posts.
      c = mixRgb(c, WALNUT, 0.5 * Math.pow(clamp01(1 - y / 0.16), 2));
      c = mixRgb(c, PALE, 0.3 * Math.pow(clamp01((y - 0.58) / 0.15), 2));
      return c;
    };
    k.body('bed', bed.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.009,
      bump: (x, y, z) => {
        let b = 0.0012 * noise.fbm(x * 30, y * 8, z * 30, 2);
        if (Math.abs(x) > 0.36 && y > 0.45) {
          const f = (y - 0.445) / 0.25;
          b -= 0.002 * Math.exp(-Math.pow((f - 0.5) / 0.07, 2));
        }
        return b;
      },
      maxTriangles: 1900,
    });

    // ------------------------------------------------------------------ apples
    // A three-layer mound of plump red apples: base and mid layers fill and
    // support the heap, the top layer shows above the cart rim.
    const apples: readonly (readonly [number, number, number, number])[] = [
      // base layer on the bed floor
      [-0.15, 0.5, 0.3, 0.054],
      [0.12, 0.5, 0.33, 0.052],
      [0.26, 0.5, 0.02, 0.052],
      [-0.27, 0.5, -0.04, 0.054],
      [0.05, 0.5, -0.33, 0.051],
      [-0.06, 0.5, 0.02, 0.052],
      [0.2, 0.5, 0.26, 0.048],
      // mid layer
      [-0.1, 0.58, -0.24, 0.052],
      [0.14, 0.59, 0.12, 0.05],
      [-0.22, 0.58, 0.16, 0.049],
      [0.02, 0.62, -0.12, 0.048],
      [-0.02, 0.59, 0.3, 0.047],
      // top layer, proud of the rim
      [-0.16, 0.72, 0.26, 0.054],
      [0.14, 0.73, 0.28, 0.052],
      [0.27, 0.7, -0.04, 0.05],
      [-0.27, 0.71, -0.08, 0.052],
      [0.0, 0.82, -0.04, 0.046],
    ];
    const heap = sdf.smoothUnion(
      0.008,
      ...apples.map(([x, y, z, r]) => sdf.sphere(r).at(x, y, z)),
    );
    const applePaint = (x: number, y: number, z: number) => {
      // Per-apple shading relative to the nearest apple centre.
      let best = apples[0];
      let bd = Infinity;
      for (const a of apples) {
        const d = (x - a[0]) ** 2 + (y - a[1]) ** 2 + (z - a[2]) ** 2;
        if (d < bd) {
          bd = d;
          best = a;
        }
      }
      const d =
        ((x - best[0]) * 0.45 + (y - best[1]) * 0.55 + (z - best[2]) * 0.6) / best[3];
      const hi = clamp01((d - 0.15) / 0.7);
      const shade = clamp01((0.47 - y) / 0.06);
      const varn = 0.5 + 0.5 * noise.fbm(x * 24, y * 24, z * 24, 2);
      let c = mixRgb(APPLE, APPLE_HI, hi * hi * 0.55);
      c = mixRgb(c, APPLE_DARK, shade * 0.62);
      return mixRgb(c, APPLE, varn * 0.08);
    };
    k.body('apples', heap.paintFn(applePaint), {
      color: '#d92b1f',
      roughness: 0.35,
      metalness: 0,
      detail: 0.0075,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 900,
    });

    // Short brown stems on the three most visible top apples.
    const stemAt = (x: number, y: number, z: number, tilt: number) =>
      sdf.cone([x, y, z], [x + tilt * 0.014, y + 0.038, z + 0.008], 0.008, 0.004);
    k.body(
      'stems',
      sdf.union(
        stemAt(-0.16, 0.768, 0.26, -1),
        stemAt(0.14, 0.778, 0.28, 1),
        stemAt(0.0, 0.858, -0.04, 0.5),
      ),
      { color: STEM, roughness: 0.85, metalness: 0, detail: 0.004, maxTriangles: 120 },
    );

    // ------------------------------------------------------------------ carrots
    // Six tapered roots leaning on the heap, thick ends up with green tufts,
    // tips buried in the apple layers. Rings painted along each root.
    const carrot = (p0: readonly number[], p2: readonly number[]) => {
      const mid = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2 + 0.018, (p0[2] + p2[2]) / 2];
      return sdf.chain(
        [
          [p0[0], p0[1], p0[2], 0.027],
          [mid[0], mid[1], mid[2], 0.021],
          [p2[0], p2[1], p2[2], 0.006],
        ],
        0.008,
      );
    };
    const carrotEnds: readonly (readonly number[])[] = [
      [-0.06, 0.78, 0.3],
      [0.25, 0.76, 0.18],
      [-0.28, 0.72, -0.05],
      [0.03, 0.84, -0.05],
      [-0.17, 0.72, -0.3],
      [0.19, 0.73, -0.32],
    ];
    const carrotTips: readonly (readonly number[])[] = [
      [-0.03, 0.55, 0.48],
      [0.33, 0.52, 0.35],
      [-0.34, 0.5, 0.1],
      [0.09, 0.55, 0.14],
      [-0.23, 0.5, -0.16],
      [0.25, 0.5, -0.17],
    ];
    const carrots = sdf.union(
      ...carrotEnds.map((p0, i) => carrot(p0, carrotTips[i])),
    );
    const carrotPaint = (x: number, y: number, z: number) => {
      const band = Math.pow(0.5 + 0.5 * Math.cos((x + y * 0.6 + z) * 88), 3);
      const len = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
      let c = mixRgb(CARROT, CARROT_DARK, 0.16 + 0.34 * band);
      c = mixRgb(c, mixRgb(CARROT, STRAW, 0.25), 0.14 * len); // sun-warmed side
      c = mixRgb(c, CARROT_DARK, 0.3 * clamp01((0.47 - y) / 0.08)); // shaded tips
      return c;
    };
    k.body('carrots', carrots.paintFn(carrotPaint), {
      color: '#e8823a',
      roughness: 0.55,
      metalness: 0,
      detail: 0.005,
      textureDensity: 2,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 520,
    });

    // ------------------------------------------------------------------ cabbages
    // Four pale heads rising from the heap: a big crown head at the front,
    // two flanking it, and a small one peeking over the front board.
    const cabbages: readonly (readonly [number, number, number, number])[] = [
      [-0.02, 0.87, 0.1, 1.2], // crown of the heap, clearly the biggest
      [-0.23, 0.74, -0.12, 0.88],
      [0.22, 0.75, -0.2, 0.85],
      [0.05, 0.7, 0.34, 0.68],
    ];
    const heads = sdf.smoothUnion(
      0.015,
      ...cabbages.map(([x, y, z, s]) =>
        sdf
          .ellipsoid([0.095 * s, 0.088 * s, 0.093 * s])
          .at(x, y, z)
          .displace(0.013 * s, (px, py, pz) => {
            const phi = Math.atan2(px - x, pz - z);
            const up = clamp01((py - (y - 0.088 * s)) / (0.176 * s));
            return (0.5 + 0.5 * Math.cos(phi * 4) - 0.5) * up;
          }),
      ),
    );
    const headPaint = (x: number, y: number, z: number) => {
      let best = cabbages[0];
      let bd = Infinity;
      for (const a of cabbages) {
        const d = (x - a[0]) ** 2 + (y - a[1]) ** 2 + (z - a[2]) ** 2;
        if (d < bd) {
          bd = d;
          best = a;
        }
      }
      const [cx, cy, cz, s] = best;
      const t = clamp01((y - (cy - 0.088 * s)) / (0.176 * s));
      const phi = Math.atan2(x - cx, z - cz);
      const crease = Math.pow(0.5 - 0.5 * Math.cos(phi * 4), 2.2);
      const crown = 0.5 + 0.5 * Math.cos(phi * 4);
      let c = mixRgb(HEAD_DARK, HEAD, 0.3 + 0.68 * t);
      c = mixRgb(c, HEAD_LIGHT, Math.max(0, t - 0.5) * 1.35);
      c = mixRgb(c, HEAD_DARK, 0.5 * crease); // creases between wrapped leaves
      c = mixRgb(c, HEAD_LIGHT, 0.13 * crown); // lit crowns
      const m = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
      return mixRgb(c, HEAD_LIGHT, m * 0.1);
    };
    k.body('cabbage-heads', heads.paintFn(headPaint), {
      color: '#9ed36a',
      roughness: 0.55,
      metalness: 0,
      detail: 0.007,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 32, y * 32, z * 32, 2),
      maxTriangles: 1150,
    });

    // ------------------------------------------------------------------ greens
    // Wrapper leaves cupping each cabbage + feathery tops on the carrot ends.
    const leafOutline = profile.polygon(
      [
        [0, 0],
        [0.038, 0.011],
        [0.062, 0.042],
        [0.068, 0.078],
        [0.056, 0.112],
        [0.034, 0.136],
        [0.013, 0.146],
        [0, 0.15],
        [-0.013, 0.146],
        [-0.034, 0.136],
        [-0.056, 0.112],
        [-0.068, 0.078],
        [-0.062, 0.042],
        [-0.038, 0.011],
      ],
      { smooth: true, samples: 12 },
    );
    const leafAt = (cx: number, cy: number, cz: number, azDeg: number, leanDeg: number, s: number) =>
      sdf
        .extrude(leafOutline, 0.02 * s, 0.008 * s)
        .scale(s)
        .rotateX(leanDeg)
        .at(0, 0, 0.062 * s)
        .rotateY(azDeg)
        .at(cx, cy - 0.03 * s, cz);
    const leaves: ReturnType<typeof leafAt>[] = [];
    const leafSpecs: readonly (readonly [number, number, number, number, number, number])[] = [
      [-0.02, 0.87, 0.1, 42, 22, 0.72],
      [-0.02, 0.87, 0.1, -42, 24, 0.68],
      [-0.23, 0.74, -0.12, 150, 12, 0.8],
      [-0.23, 0.74, -0.12, 230, 14, 0.75],
      [0.22, 0.75, -0.2, -130, 12, 0.75],
      [0.22, 0.75, -0.2, -60, 13, 0.72],
      [0.05, 0.7, 0.34, 12, 11, 0.62],
      [0.05, 0.7, 0.34, -70, 12, 0.6],
    ];
    for (const [cx, cy, cz, az, lean, s] of leafSpecs) leaves.push(leafAt(cx, cy, cz, az, lean, s));
    // Carrot top tufts: three thin blades fanning from each thick end.
    for (const p of carrotEnds) {
      for (const [dx, dz] of [
        [0.014, 0.008],
        [-0.012, 0.012],
        [0.002, -0.015],
      ]) {
        leaves.push(
          sdf
            .cone([p[0], p[1] - 0.01, p[2]], [p[0] + dx, p[1] + 0.045, p[2] + dz], 0.009, 0.0025),
        );
      }
    }
    const greensPaint = (x: number, y: number, z: number) => {
      const m = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
      let c = mixRgb(LEAF_DARK, LEAF, 0.4 + 0.32 * m);
      c = mixRgb(c, LEAF_LIGHT, 0.2 * clamp01((y - 0.7) / 0.2)); // sun-lit tips
      c = mixRgb(c, LEAF_DARK, 0.3 * clamp01((0.55 - y) / 0.1)); // shaded bases
      return c;
    };
    k.body('greens', sdf.union(...leaves).paintFn(greensPaint), {
      color: '#5cb85c',
      roughness: 0.7,
      metalness: 0,
      detail: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 24, y * 24, z * 24, 2),
      maxTriangles: 800,
    });

    // ------------------------------------------------------------------ burlap sack
    // A slouchy grain sack tucked into the back-left corner of the bed.
    const sackBody = sdf
      .sphere(0.125)
      .scale([1, 0.84, 0.96])
      .displace(0.005, (x, y, z) => noise.fbm(x * 22, y * 14, z * 22, 2))
      .at(-0.23, 0.7, -0.38);
    const sackNeck = sdf.torus(0.04, 0.013).rotateX(10).at(-0.23, 0.795, -0.385);
    const sackKnot = sdf.sphere(0.026).at(-0.225, 0.812, -0.38);
    const sackPaint = (x: number, y: number, z: number) => {
      const weave = 0.5 + 0.5 * noise.fbm(x * 34, y * 34, z * 34, 2);
      let c = mixRgb(BURLAP, BURLAP_DARK, 0.18 + 0.3 * weave);
      c = mixRgb(c, BURLAP_DARK, 0.4 * clamp01((0.54 - y) / 0.12)); // shaded bottom
      c = mixRgb(c, mixRgb(BURLAP, STRAW, 0.3), 0.2 * clamp01((y - 0.72) / 0.08)); // lit crown
      return c;
    };
    k.body('sack', sdf.union(sackBody, sackNeck, sackKnot).paintFn(sackPaint), {
      color: '#c8a86b',
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 450,
    });

    // ------------------------------------------------------------------ straw wisps
    // Two loose straws resting against the front of the heap (seasoning).
    const straw = sdf.union(
      sdf.capsule([-0.16, 0.72, 0.32], [-0.02, 0.76, 0.38], 0.008),
      sdf.capsule([0.02, 0.7, 0.36], [0.15, 0.74, 0.3], 0.0075),
    );
    const strawPaint = (x: number, y: number, z: number) => {
      const len = 0.5 + 0.5 * noise.fbm(x * 10, y * 10, z * 10, 2);
      return mixRgb(STRAW, STRAW_DARK, 0.25 + 0.35 * len);
    };
    k.body('straw', straw.paintFn(strawPaint), {
      color: '#e0bb60',
      roughness: 0.85,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 160,
    });
  },
});
