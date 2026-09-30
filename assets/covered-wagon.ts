import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — covered wagon (vehicles/land/covered-wagon), the farm wagon with a canvas hood, driver bench, water barrel, lantern. One idea: the pale canvas half-cylinder over five dark hoops with a puckered oval back opening. Palette adds canvas #efe6d2.
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
  name: 'covered-wagon',
  description:
    'A honey-oak wagon under a pale canvas cover on five hoops, puckered oval back opening, driver bench, water barrel, and hanging lantern.',
  detail: 0.008,
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
        maxTriangles: 1700,
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
      maxTriangles: 2000,
    });
    k.body('frame', frame.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.014,
      bump: woodBump,
      maxTriangles: 800,
    });

    // ------------------------------------------------------------------ canvas
    const CANVAS = rgb('#efe6d2');
    const CANVAS_SH = rgb('#cfc2a4');
    const CY = 1.0; // cover ellipse center height
    const RX = 0.56;
    const RY = 0.9;
    const elong = (r: number, len: number, z: number, sx: number, sy: number) =>
      sdf.cylinder(r, len).rotateX(90).scale([sx, sy, 1]).at(0, CY, z);
    const outer = elong(1, 2.2, 0, RX, RY);
    const inner = elong(1, 2.4, -0.1, RX - 0.06, RY - 0.06);
    const above = sdf.box([2, 1.2, 3]).at(0, CY + 0.6 - 0.04, 0);
    // Puckered back opening: oval cut plus a gathered rim ring.
    const backCut = sdf.ellipsoid([0.36, 0.56, 0.3]).at(0, CY + 0.08, -1.12);
    const frontCut = sdf.ellipsoid([0.3, 0.42, 0.2]).at(0, CY + 0.06, 1.1);
    const shell = outer
      .subtract(inner)
      .subtract(backCut, frontCut)
      .intersect(above);
    const ring = sdf
      .torus(1, 0.06)
      .rotateX(90)
      .scale([0.36 + 0.02, 0.56 + 0.02, 0.9])
      .at(0, CY + 0.08, -1.09)
      .displace(0.008, (x, y) => Math.cos(Math.atan2(y - (CY + 0.08), x) * 12));
    const canvas = sdf.smoothUnion(0.03, shell, ring.intersect(above));
    const canvasPaint = (x: number, y: number, z: number) => {
      const w = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 5, 2);
      let c = mixRgb(CANVAS, CANVAS_SH, 0.25 * w);
      const a = Math.atan2(y - CY, x);
      c = mixRgb(c, CANVAS_SH, 0.35 * clamp01((0.4 - Math.abs(x)) * 0 + (1 - (y - CY) / 0.9) * 0.6 - 0.2));
      // shaded pucker folds near the back opening
      if (z < -0.98) c = mixRgb(c, CANVAS_SH, 0.35 * (0.5 + 0.5 * Math.cos(a * 12)));
      return c;
    };
    k.body('canvas', canvas.paintFn(canvasPaint), {
      color: '#efe6d2',
      roughness: 0.92,
      metalness: 0,
      detail: 0.014,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 1),
      maxTriangles: 3500,
    });

    // hoop ribs: dark walnut arcs proud of the canvas
    const hoopProto = sdf
      .torus(1, 0.075)
      .rotateX(90)
      .scale([RX + 0.03, RY + 0.03, 0.62])
      .at(0, CY, 0);
    const hoopZ = [-1.0, -0.5, 0, 0.5, 1.0];
    const hoops = sdf
      .union(...hoopZ.map((z) => hoopProto.at(0, 0, z)))
      .intersect(above);
    k.body('hoops', hoops.paintFn(() => WALNUT), {
      color: '#6b4226',
      roughness: 0.8,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 1700,
    });

    // ------------------------------------------------------------------ bench
    const seat = sdf.box([0.9, 0.06, 0.32], 0.02).at(0, 1.08, 1.4);
    const seatBack = sdf.box([0.9, 0.22, 0.05], 0.02).at(0, 1.2, 1.55);
    const brace = sdf.box([0.06, 0.4, 0.06], 0.015).at(0.38, 0.92, 1.3);
    const bench = sdf.smoothUnion(0.012, seat, seatBack, brace.mirror('x', 0));
    k.body('bench', bench.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.01,
      bump: woodBump,
      maxTriangles: 1200,
    });

    // ------------------------------------------------------------------ barrel
    const BX = 0.74;
    const BY = 0.9;
    const BZ = -0.05;
    const barrelShape = sdf
      .revolve(profile.polygon([[0, -0.21], [0.13, -0.21], [0.165, -0.08], [0.175, 0], [0.165, 0.08], [0.13, 0.21], [0, 0.21]], { smooth: true }))
      .at(BX, BY, BZ);
    const BARREL_STAVE = rgb('#8a5a35');
    k.body(
      'barrel',
      barrelShape.paintFn((x, y, z) => {
        const a = Math.atan2(z - BZ, x - BX);
        const stave = 0.5 + 0.5 * Math.cos(a * 10);
        return mixRgb(mixRgb(BARREL_STAVE, OAK, 0.4 * stave), WALNUT, 0.15 * noise.fbm(x * 20, y * 6, z * 20, 2));
      }),
      { color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.008, maxTriangles: 1200 },
    );

    // ------------------------------------------------------------------ iron fittings
    const hoopIron = (dy: number) => sdf.torus(0.175, 0.014).at(BX, BY + dy, BZ);
    const shelf = sdf.box([0.34, 0.05, 0.4], 0.01).at(BX - 0.06, 0.66, BZ);
    const strapBar = sdf.box([0.03, 0.03, 0.3], 0.008).at(0.55, 0.75, BZ);
    const arm = sdf.capsule([0, 1.9, 1.0], [0, 1.9, 1.22], 0.02);
    const drop = sdf.capsule([0, 1.9, 1.22], [0, 1.72, 1.22], 0.008);
    const fit = sdf.smoothUnion(0.01, arm, drop, hoopIron(-0.12), hoopIron(0.12), shelf, strapBar);
    k.body('fittings', fit, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.005,
      maxTriangles: 1200,
    });

    // ------------------------------------------------------------------ lantern
    const lamp = sdf.smoothUnion(
      0.01,
      sdf.cylinder(0.055, 0.14, 0.02).at(0, 1.62, 1.22),
      sdf.cone([0, 1.69, 1.22], [0, 1.75, 1.22], 0.075, 0.03),
    );
    k.body('lantern-frame', sdf.cylinder(0.07, 0.03, 0.01).at(0, 1.54, 1.22), {
      color: IRON_DARK, roughness: 0.5, metalness: 0.8, detail: 0.005, maxTriangles: 400,
    });
    k.body('lantern-glass', lamp.paint(rgb('#ffd57a')), {
      color: '#ffd57a', roughness: 0.3, metalness: 0, detail: 0.005,
      emissive: '#ffb84a', emissiveIntensity: 0.55, maxTriangles: 800,
    });
  },
});
