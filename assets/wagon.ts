import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — four-wheeled farm wagon (props/craft-and-trade/wagon).
 *
 * Role: parked farm wagon in the hamlet; must read at 128 px sprite size as
 *   one honey-oak wagon heaped with hay, sacks, and a cabbage.
 * Size: bed 2.4 m long (Z) x 1.04 m wide (X), side rim at 0.98 m; four 0.84 m
 *   wheels stand on y = 0, axle line at 0.42 m; centred on Y, front shaft
 *   and low front board toward +Z.
 * One idea: a chunky plank wagon whose four big spoked wheels, long front
 *   drawbar shaft, and a golden mound of hay bales and slouchy sacks break
 *   the silhouette everywhere.
 * Shape language: round dominant (wheels, sacks, hay mound), square secondary
 *   (plank bed, low sides, straight shaft).
 * Palette: honey oak #b5814a (dominant), warm brown #8a5a35 + walnut #6b4226
 *   (secondary), pale cut wood #c9a06a (lit tops); iron #4a4f55 / #363a3f with
 *   highlight #a8acb1 (small); straw #e0bb60, burlap #c8a86b, leaf green
 *   #5cb85c as the accent on top. 60/30/10.
 * Materials: wood (roughness 0.8), worn iron (0.5 / 0.7), straw (0.85),
 *   burlap (0.9), cabbage leaf (0.6). One body per material family.
 * Detail: primary bed + wheels + shaft + cargo mound; secondary rails, posts,
 *   axles, hub caps, rim strakes, sack necks; tertiary plank seams, nail dots,
 *   grain, straw grooves in paint + bump. Focal point: the golden cargo heap.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const IRON = '#4a4f55';
const IRON_DARK = '#363a3f';
const IRON_HI = '#a8acb1';
const BURLAP = rgb('#c8a86b');
const BURLAP_DARK = rgb('#9a7c4a');
const STRAW = rgb('#e0bb60');
const STRAW_DARK = rgb('#b08a3a');
const STRAW_DEEP = rgb('#8a6420');
const STRAW_PALE = rgb('#f0d488');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#3c7a3d');
const LEAF_LIGHT = rgb('#86d47e');

const AXLE_Y = 0.42; // wheel outer radius -> wheels stand on y = 0
const RIM_R = 0.365;
const RIM_T = 0.055;
const WHEEL_X = 0.6;
const FRONT_Z = 0.72;
const REAR_Z = -0.72;
const FLOOR_TOP = 0.62;
const RIM_TOP = 0.98; // side-board rim

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'wagon',
  description:
    'A honey-oak farm wagon: plank bed with low sides on four chunky spoked wheels, a long front drawbar shaft, and a load of golden hay bales, straw, burlap sacks, and a cabbage.',
  detail: 0.008,
  reference: 'docs/item-mockups/wagon-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wheels
    // Chunky wooden wheel: torus rim, fat hub, six round spokes, axis along X.
    // One wheel per body: single wheels reduce cleanly (no cross-wheel slivers)
    // and each gets an exact radial paint.
    const rim = sdf.torus(RIM_R, 0.06).rotateZ(90);
    const hub = sdf.cylinder(0.08, 0.11, 0.012).rotateZ(90);
    const spokes: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 6; i++) {
      spokes.push(
        sdf.capsule([0, 0.05, 0], [0, RIM_R - 0.04, 0], 0.021).rotateX(i * 60),
      );
    }
    const wheelProto = sdf.smoothUnion(0.012, rim, hub, ...spokes);
    const wheelPaintAt =
      (zc: number) =>
      (x: number, y: number, z: number) => {
        const rr = Math.hypot(y - AXLE_Y, z - zc); // radial in the wheel plane
        const grain = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
        let c = mixRgb(OAK, PALE, 0.14 * grain);
        c = mixRgb(c, BROWN, 0.55 * clamp01((rr - 0.3) / 0.12)); // darker rim
        c = mixRgb(c, PALE, 0.45 * clamp01((0.09 - rr) / 0.09)); // pale hub
        c = mixRgb(c, WALNUT, 0.32 * clamp01((0.2 - y) / 0.2)); // damp lower half
        return c;
      };
    const wheelSpots: [string, number, number][] = [
      ['wheel.fl', -WHEEL_X, FRONT_Z],
      ['wheel.fr', WHEEL_X, FRONT_Z],
      ['wheel.rl', -WHEEL_X, REAR_Z],
      ['wheel.rr', WHEEL_X, REAR_Z],
    ];
    for (const [name, wx, wz] of wheelSpots) {
      k.body(name, wheelProto.at(wx, AXLE_Y, wz).paintFn(wheelPaintAt(wz)), {
        color: '#b5814a',
        roughness: 0.8,
        metalness: 0,
        detail: 0.01,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
        maxTriangles: 2500,
      });
    }

    // ------------------------------------------------------------------ iron work
    // Axle rods through both wheel pairs, hub caps with bright nuts, and a thin
    // iron strake band hugging the outer face of each rim.
    const rodF = sdf.cylinder(0.02, 1.34, 0.004).rotateZ(90).at(0, AXLE_Y, FRONT_Z);
    const rodR = sdf.cylinder(0.02, 1.34, 0.004).rotateZ(90).at(0, AXLE_Y, REAR_Z);
    const cap = sdf.cylinder(0.068, 0.024, 0.004).rotateZ(90).at(WHEEL_X + 0.052, AXLE_Y, 0);
    const nut = sdf.sphere(0.016).at(WHEEL_X + 0.068, AXLE_Y, 0);
    const rimTorus = sdf.torus(RIM_R, 0.06).rotateZ(90);
    const strake = rimTorus
      .round(0.004)
      .subtract(rimTorus.round(-0.003))
      .intersect(sdf.box([0.024, 0.9, 0.9], 0.006))
      .at(WHEEL_X, AXLE_Y, 0);
    const iron = sdf
      .union(
        rodF,
        rodR,
        cap.mirror('x', 0).at(0, 0, FRONT_Z),
        cap.mirror('x', 0).at(0, 0, REAR_Z),
        nut.mirror('x', 0).at(0, 0, FRONT_Z),
        nut.mirror('x', 0).at(0, 0, REAR_Z),
        strake.mirror('x', 0).at(0, 0, FRONT_Z),
        strake.mirror('x', 0).at(0, 0, REAR_Z),
        // dark band around the drawbar shaft tip
        sdf.cylinder(0.056, 0.06, 0.008).rotateX(90).at(0, 0.308, 1.75),
      )
      .paintWhere(
        sdf.box([0.03, 0.09, 0.09], 0.004).at(WHEEL_X + 0.066, AXLE_Y, FRONT_Z),
        IRON_HI,
        0.004,
      )
      .paintWhere(
        sdf.box([0.03, 0.09, 0.09], 0.004).at(-WHEEL_X - 0.066, AXLE_Y, FRONT_Z),
        IRON_HI,
        0.004,
      )
      .paintWhere(
        sdf.box([0.03, 0.09, 0.09], 0.004).at(WHEEL_X + 0.066, AXLE_Y, REAR_Z),
        IRON_HI,
        0.004,
      )
      .paintWhere(
        sdf.box([0.03, 0.09, 0.09], 0.004).at(-WHEEL_X - 0.066, AXLE_Y, REAR_Z),
        IRON_HI,
        0.004,
      );
    k.body('iron-work', iron, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 900,
    });

    // ------------------------------------------------------------------ bed
    // One oak body: plank floor, low two-plank side boards, front and back
    // boards, four corner posts, under-rails, wooden axles with blocks, front
    // and rear beams, and the long drawbar shaft reaching forward.
    const floorBoard = sdf.box([1.04, 0.05, 2.4], 0.018).at(0, FLOOR_TOP - 0.025, 0);
    const sideL = sdf.box([0.045, 0.28, 2.4], 0.018).at(-0.4975, FLOOR_TOP + 0.14, 0);
    const back = sdf.box([1.04, 0.28, 0.045], 0.018).at(0, FLOOR_TOP + 0.14, -1.1775);
    const front = sdf.box([1.04, 0.28, 0.045], 0.018).at(0, FLOOR_TOP + 0.14, 1.1775);
    const post = sdf.box([0.06, 0.34, 0.06], 0.02).at(0.49, FLOOR_TOP + 0.17, 1.16);
    const deck = sdf.smoothUnion(
      0.016,
      floorBoard,
      sideL.mirror('x', 0),
      back,
      front,
      post.mirror('x', 0).mirror('z', 0),
    );
    const rail = sdf.box([0.06, 0.14, 2.1], 0.012).at(0.3, 0.5, 0);
    const axleWoodF = sdf.cylinder(0.045, 1.12, 0.008).rotateZ(90).at(0, AXLE_Y, FRONT_Z);
    const axleWoodR = sdf.cylinder(0.045, 1.12, 0.008).rotateZ(90).at(0, AXLE_Y, REAR_Z);
    const block = sdf.box([0.1, 0.16, 0.14], 0.01).at(0.3, 0.47, FRONT_Z);
    const beamF = sdf.box([0.5, 0.07, 0.06], 0.012).at(0, 0.55, 1.1);
    const beamR = sdf.box([0.56, 0.07, 0.06], 0.012).at(0, 0.55, -1.1);
    const shaft = sdf.capsule([0, 0.55, 1.02], [0, 0.3, 1.8], 0.045);
    const frame = sdf.smoothUnion(
      0.016,
      rail.mirror('x', 0),
      axleWoodF,
      axleWoodR,
      block.mirror('x', 0).at(0, 0, REAR_Z - FRONT_Z),
      block.mirror('x', 0),
      beamF,
      beamR,
      shaft,
    );
    // Nail heads on the outer side boards and front/back boards (painted dots).
    const sideNails: [number, number, number][] = [];
    for (const sx of [-1, 1])
      for (const nz of [-0.95, -0.35, 0.35, 0.95])
        for (const ny of [0.7, 0.87]) sideNails.push([sx * 0.521, ny, nz]);
    const endNails: [number, number, number][] = [];
    for (const sz of [-1, 1])
      for (const nx of [-0.38, 0, 0.38])
        for (const ny of [0.7, 0.87]) endNails.push([nx, ny, sz * 1.201]);
    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 6, z * 22, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 6 + 9, y * 6, z * 6, 2);
      let c = mixRgb(OAK, PALE, 0.12 * grain + 0.12 * patch);
      c = mixRgb(c, BROWN, 0.3 * grain * grain * grain);
      // Floor: six lengthwise planks, dark seams between.
      if (y > FLOOR_TOP - 0.01 && Math.abs(x) < 0.51 && Math.abs(z) < 1.19) {
        const f = (x + 0.52) / 0.1733;
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 24);
        c = mixRgb(c, WALNUT, 0.6 * seam);
        c = mixRgb(c, PALE, 0.1 * noise.random(Math.floor(f), 2, 4));
      }
      // Side boards: one horizontal seam between the two planks.
      if (Math.abs(x) > 0.473 && y > FLOOR_TOP) {
        const seam = Math.exp(-Math.pow((y - (FLOOR_TOP + 0.14)) / 0.035, 2));
        c = mixRgb(c, WALNUT, 0.66 * seam);
        c = mixRgb(c, PALE, 0.1 * noise.random(y > FLOOR_TOP + 0.14 ? 1 : 0, x > 0 ? 3 : 5, 1));
      }
      // Front/back boards: vertical plank seams.
      if (Math.abs(z) > 1.153 && y > FLOOR_TOP) {
        const f = (x + 0.52) / 0.1733;
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 24);
        c = mixRgb(c, WALNUT, 0.6 * seam);
      }
      // Shaft reads a touch darker than the bed.
      if (z > 1.0) {
        const hgrain = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 5, 2);
        c = mixRgb(c, BROWN, 0.26 + 0.2 * hgrain);
      }
      // Nail dots.
      if (Math.abs(x) > 0.512) {
        for (const [nx, ny, nz] of sideNails) {
          if (Math.sign(nx) !== Math.sign(x)) continue;
          const d2 = (y - ny) * (y - ny) + (z - nz) * (z - nz);
          if (d2 < 0.00007) c = mixRgb(c, WALNUT, 0.85);
        }
      }
      if (Math.abs(z) > 1.192) {
        for (const [nx, ny, nz] of endNails) {
          if (Math.sign(nz) !== Math.sign(z)) continue;
          const d2 = (y - ny) * (y - ny) + (x - nx) * (x - nx);
          if (d2 < 0.00007) c = mixRgb(c, WALNUT, 0.85);
        }
      }
      // Value plan: shaded underside, sun-lit rim and posts.
      c = mixRgb(c, WALNUT, 0.5 * Math.pow(clamp01(1 - y / 0.2), 2));
      c = mixRgb(c, PALE, 0.28 * Math.pow(clamp01((y - 0.86) / 0.14), 2));
      return c;
    };
    const woodBump = (x: number, y: number, z: number) => {
      let b = 0.0012 * noise.fbm(x * 30, y * 8, z * 30, 2);
      if (Math.abs(x) > 0.473 && y > FLOOR_TOP) {
        b -= 0.002 * Math.exp(-Math.pow((y - (FLOOR_TOP + 0.14)) / 0.035, 2));
      }
      return b;
    };
    k.body('deck', deck.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.014,
      bump: woodBump,
      maxTriangles: 2600,
    });
    k.body('frame', frame.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.014,
      bump: woodBump,
      maxTriangles: 800,
    });

    // ------------------------------------------------------------------ hay
    // A grooved straw bale across the back, a lumpy straw mound in front of
    // it, and a few pale wisps poking from the bale crown.
    const STRAPS = [-0.21, 0.21];
    const GROOVE_W = 0.032;
    const grooveAt = (x: number) => {
      let g = 0;
      for (const s of STRAPS) {
        const d = Math.abs(x - s);
        if (d < GROOVE_W) g = Math.max(g, 0.5 + 0.5 * Math.cos((Math.PI * d) / GROOVE_W));
      }
      return g;
    };
    const bale = sdf
      .box([0.72, 0.4, 0.52], 0.09)
      .at(0, 0.82, -0.68)
      .displace(0.006, (x) => -grooveAt(x));
    // Lumpy straw mound from blended spheres: smooth forms reduce cleanly (no displace).
    const mound = sdf.smoothUnion(
      0.035,
      sdf.sphere(0.23).at(0.02, 0.88, -0.1),
      sdf.sphere(0.15).at(-0.14, 0.84, 0.05),
      sdf.sphere(0.14).at(0.18, 0.84, 0.06),
      sdf.sphere(0.15).at(0.0, 0.82, -0.32),
      sdf.sphere(0.13).at(0.03, 1.0, -0.08),
    );
    const wisps: ReturnType<typeof sdf.chain>[] = [
      sdf.chain(
        [
          [-0.2, 0.98, -0.6, 0.018],
          [-0.24, 1.08, -0.62, 0.012],
          [-0.28, 1.15, -0.6, 0.008],
        ],
        0.005,
      ),
      sdf.chain(
        [
          [0.05, 1.0, -0.72, 0.018],
          [0.07, 1.1, -0.76, 0.012],
          [0.05, 1.18, -0.79, 0.008],
        ],
        0.005,
      ),
      sdf.chain(
        [
          [0.22, 0.98, -0.55, 0.017],
          [0.27, 1.06, -0.52, 0.011],
          [0.31, 1.12, -0.5, 0.008],
        ],
        0.005,
      ),
    ];
    const hay = sdf.union(bale, mound, ...wisps);
    const hayPaint = (x: number, y: number, z: number) => {
      const strand = noise.fbm(x * 6, y * 48, z * 48, 2, 7);
      const coarse = 0.5 + 0.5 * noise.fbm(x * 3, y * 9, z * 9, 2, 19);
      const fine = noise.noise3(x * 42, y * 42, z * 42, 23);
      let c = mixRgb(STRAW, STRAW_PALE, 0.1 + 0.24 * coarse);
      c = mixRgb(c, STRAW_DEEP, 0.24 * clamp01(0.5 - 0.5 * strand));
      c = mixRgb(c, STRAW_PALE, 0.16 * clamp01(0.5 + 0.5 * strand));
      c = mixRgb(c, STRAW_DARK, 0.12 * clamp01(0.5 + 0.5 * fine));
      // Value plan: sun-lit crown, shaded foot.
      c = mixRgb(c, STRAW_PALE, 0.2 * clamp01((y - 0.92) / 0.2));
      c = mixRgb(c, STRAW_DEEP, 0.34 * clamp01((0.72 - y) / 0.14));
      // Dark strap grooves on the bale.
      c = mixRgb(c, STRAW_DEEP, 0.55 * grooveAt(x));
      return c;
    };
    k.body('hay', hay.paintFn(hayPaint), {
      color: '#e0bb60',
      roughness: 0.85,
      metalness: 0,
      detail: 0.028,
      textureDensity: 2,
      bump: (x, y, z) =>
        0.0016 * noise.fbm(x * 6, y * 48, z * 48, 2, 7) -
        0.005 * grooveAt(x),
      maxTriangles: 2200,
    });

    // ------------------------------------------------------------------ sacks
    // Two slouchy burlap grain sacks tucked into the front of the bed.
    const sack1 = sdf
      .sphere(0.14)
      .scale([1, 0.85, 0.95])
      .displace(0.005, (x, y, z) => noise.fbm(x * 22, y * 14, z * 22, 2))
      .at(-0.08, 0.95, 0.28);
    const sack2 = sdf
      .sphere(0.13)
      .scale([1, 0.88, 1])
      .displace(0.005, (x, y, z) => noise.fbm(x * 22, y * 14, z * 22, 2))
      .at(0.2, 0.88, 0.5);
    const sacks = sdf.union(
      sack1,
      sack2,
      sdf.torus(0.045, 0.014).rotateX(8).at(-0.08, 1.07, 0.285),
      sdf.sphere(0.028).at(-0.075, 1.088, 0.29),
      sdf.torus(0.04, 0.013).rotateX(-6).at(0.2, 0.985, 0.5),
      sdf.sphere(0.026).at(0.205, 1.0, 0.505),
    );
    const sackPaint = (x: number, y: number, z: number) => {
      const weave = 0.5 + 0.5 * noise.fbm(x * 34, y * 34, z * 34, 2);
      let c = mixRgb(BURLAP, BURLAP_DARK, 0.18 + 0.3 * weave);
      c = mixRgb(c, BURLAP_DARK, 0.4 * clamp01((0.9 - y) / 0.12)); // shaded bottom
      c = mixRgb(c, mixRgb(BURLAP, STRAW, 0.3), 0.2 * clamp01((y - 1.0) / 0.08)); // lit crown
      return c;
    };
    k.body('sacks', sacks.paintFn(sackPaint), {
      color: '#c8a86b',
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 600,
    });

    // ------------------------------------------------------------------ greens
    // Two small cabbages as the green accent: one crowning the left sack, one
    // small one resting between the sacks and the mound.
    const cabbage = (x: number, y: number, z: number, s: number) =>
      sdf
        .ellipsoid([0.1 * s, 0.092 * s, 0.098 * s])
        .at(x, y, z)
        .displace(0.012 * s, (px, py, pz) => {
          const phi = Math.atan2(px - x, pz - z);
          const up = clamp01((py - (y - 0.092 * s)) / (0.184 * s));
          return (0.5 + 0.5 * Math.cos(phi * 4) - 0.5) * up;
        });
    const cabbages = sdf.smoothUnion(0.01, cabbage(-0.08, 1.13, 0.28, 0.9), cabbage(0.16, 1.02, 0.08, 0.6));
    const greensPaint = (x: number, y: number, z: number) => {
      const specs: [number, number, number, number][] = [
        [-0.08, 1.13, 0.28, 0.9],
        [0.16, 1.02, 0.08, 0.6],
      ];
      let best = specs[0]!;
      let bd = Infinity;
      for (const a of specs) {
        const d = (x - a[0]) ** 2 + (y - a[1]) ** 2 + (z - a[2]) ** 2;
        if (d < bd) {
          bd = d;
          best = a;
        }
      }
      const [cx, cy, cz, s] = best;
      const t = clamp01((y - (cy - 0.092 * s)) / (0.184 * s));
      const phi = Math.atan2(x - cx, z - cz);
      const crease = Math.pow(0.5 - 0.5 * Math.cos(phi * 4), 2.2);
      const crown = 0.5 + 0.5 * Math.cos(phi * 4);
      let c = mixRgb(LEAF_DARK, LEAF, 0.3 + 0.68 * t);
      c = mixRgb(c, LEAF_LIGHT, Math.max(0, t - 0.5) * 1.35);
      c = mixRgb(c, LEAF_DARK, 0.5 * crease);
      c = mixRgb(c, LEAF_LIGHT, 0.13 * crown);
      const m = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
      return mixRgb(c, LEAF_LIGHT, m * 0.1);
    };
    k.body('greens', cabbages.paintFn(greensPaint), {
      color: '#5cb85c',
      roughness: 0.6,
      metalness: 0,
      detail: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 32, y * 32, z * 32, 2),
      maxTriangles: 400,
    });
  },
});
