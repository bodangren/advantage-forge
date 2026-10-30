import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 school bus, a toy-sized check-row picture prop.
 * Role: a classic yellow school bus that a five-year-old reads as "bus" at 1500 px and in line art.
 * Size: about 1.45 m long, 0.72 m wide, 0.77 m tall, standing on y = 0 and facing +Z.
 * One idea: a short, round, soft yellow bus with a hood, big windows, big wheels, and a side door.
 * Shape language: rounded boxes with a deep fillet, round wheels, round headlights.
 * Palette: bus yellow #f7b81c, glass #86bde0, trim #3d3d48, tires #2b2b33, hubs #b9bfc8.
 * Materials: satin painted metal, glossy glass, matte rubber, bright metal hubs.
 * Detail: nose hood with grille and two headlights, windshield, two rows of side windows,
 *   a two-leaf door with a dark frame and a step on the left side (+X, the side the picture views show;
 *   the -X side has plain windows), black stripe, bumpers, mirrors, roof lamps.
 * Rig/animation: none. No text, number, logo, or flag.
 */

const YELLOW = rgb('#f7b81c');
const YELLOW_LIGHT = rgb('#ffd45a');
const YELLOW_DOOR = rgb('#c98a0a');
const DARK = rgb('#3d3d48');
const GLASS = rgb('#86bde0');
const GLASS_LIGHT = rgb('#c4e4f5');
const HUB = rgb('#b9bfc8');
const HUB_DARK = rgb('#6d737d');
const CREAM = rgb('#fff4c2');
const AMBER = rgb('#ffa51f');
const RED = rgb('#e03a2f');

const HALF_W = 0.36; // body half width
const BODY_Z0 = -0.7;
const BODY_Z1 = 0.45;
const AXLE_Y = 0.14;
const WHEEL_X = 0.335;
const FRONT_AXLE_Z = 0.53;
const REAR_AXLE_Z = -0.4;
const WIN_Y = 0.52;
const WIN_H = 0.19;
const DOOR_Z = 0.25;
const DOOR_LEN = 0.22;
const DOOR_SIDE = 1; // +X, the left side of the bus: the side that the picture views show
const DOOR_H = 0.4;
const DOOR_Y = 0.42;
const PLAIN_WINDOWS = [-0.46, -0.22, 0.02, 0.26]; // the -X side: windows only
const DOOR_SIDE_WINDOWS = [-0.46, -0.22, 0.02]; // the +X side: windows behind the door
const WIN_LEN = 0.17;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// A recess cutter for a side panel: a shallow rounded box that sinks 0.014 m into the side.
const sideCutter = (side: number, y: number, z: number, h: number, len: number) =>
  sdf.box([0.1, h, len], 0.035).at(side * (HALF_W + 0.05 - 0.014), y, z);
// A thin glass slab lying on the floor of that recess.
const sideGlass = (side: number, y: number, z: number, h: number, len: number) =>
  sdf.box([0.014, h, len], 0.006).at(side * (HALF_W - 0.014 - 0.0), y, z);

export default defineAsset({
  name: 'storytime-school-bus',
  description:
    'A short, round, soft yellow school bus with a hood, big windows, a two-leaf side door on the left, two headlights, and four big wheels.',
  detail: 0.005,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ body
    const bodyLen = BODY_Z1 - BODY_Z0;
    const cabin = sdf.box([2 * HALF_W, 0.6, bodyLen], 0.12).at(0, 0.47, (BODY_Z0 + BODY_Z1) / 2);
    const hood = sdf.box([0.64, 0.3, 0.36], 0.09).at(0, 0.32, 0.52);
    let shell = sdf.smoothUnion(0.03, cabin, hood);

    // Wheel arches: a round bite where each wheel sits.
    const archAt = (wz: number) => sdf.cylinder(0.172, 0.16, 0.01).rotateZ(90).at(0, AXLE_Y, wz);
    for (const wz of [FRONT_AXLE_Z, REAR_AXLE_Z]) {
      for (const s of [-1, 1]) shell = shell.subtract(archAt(wz).at(s * WHEEL_X, 0, 0));
    }

    // Window and door recesses.
    const cuts: sdf.Shape[] = [];
    for (const z of PLAIN_WINDOWS) cuts.push(sideCutter(-DOOR_SIDE, WIN_Y, z, WIN_H, z > 0.2 ? 0.16 : WIN_LEN));
    for (const z of DOOR_SIDE_WINDOWS) cuts.push(sideCutter(DOOR_SIDE, WIN_Y, z, WIN_H, WIN_LEN));
    cuts.push(sideCutter(DOOR_SIDE, DOOR_Y, DOOR_Z, DOOR_H, DOOR_LEN));
    cuts.push(sdf.box([0.4, 0.17, 0.1], 0.035).at(0, 0.555, BODY_Z1 + 0.05 - 0.014)); // windshield
    cuts.push(sdf.box([0.36, 0.17, 0.1], 0.035).at(0, 0.555, BODY_Z0 - 0.05 + 0.014)); // rear window
    shell = shell.subtract(...cuts);

    const archDist = (y: number, z: number) => {
      const d1 = Math.hypot(y - AXLE_Y, z - FRONT_AXLE_Z);
      const d2 = Math.hypot(y - AXLE_Y, z - REAR_AXLE_Z);
      return Math.min(d1, d2);
    };
    const bodyPaint = (x: number, y: number, z: number) => {
      let c = YELLOW;
      // Sun-lit roof, soft shaded lower edge.
      c = mixRgb(c, YELLOW_LIGHT, 0.55 * clamp01((y - 0.64) / 0.12));
      c = mixRgb(c, YELLOW_DOOR, 0.35 * clamp01((0.3 - y) / 0.13));
      // Black stripe along both sides and a dark lower skirt.
      if (Math.abs(x) > 0.3 && Math.abs(y - 0.36) < 0.012) c = mixRgb(c, DARK, 0.95);
      if (y < 0.2) c = mixRgb(c, DARK, clamp01((0.2 - y) / 0.015));
      // Dark wheel arches.
      if (Math.abs(x) > 0.2 && archDist(y, z) < 0.178) c = DARK;
      // Door: darker leaves and a centre seam.
      if (x > 0.33 && Math.abs(z - DOOR_Z) < DOOR_LEN / 2 + 0.004 && y > 0.2 && y < 0.625) {
        c = YELLOW_DOOR;
        if (Math.abs(z - DOOR_Z) < 0.004) c = DARK;
      }
      // Grille between the headlights.
      if (z > 0.66 && Math.abs(x) < 0.1 && y > 0.25 && y < 0.38) {
        const slot = Math.sin((y - 0.25) * 150) > 0.1 ? 1 : 0.55;
        c = mixRgb(c, DARK, 0.9 * slot);
      }
      return c;
    };
    k.body('bus-body', shell.paintFn(bodyPaint), {
      color: '#f7b81c',
      roughness: 0.45,
      metalness: 0.05,
      detail: 0.005,
      textureDensity: 2,
      maxTriangles: 16000,
    });

    // ------------------------------------------------------------------ glass
    const panes: sdf.Shape[] = [];
    for (const z of PLAIN_WINDOWS) panes.push(sideGlass(-DOOR_SIDE, WIN_Y, z, WIN_H - 0.012, (z > 0.2 ? 0.16 : WIN_LEN) - 0.012));
    for (const z of DOOR_SIDE_WINDOWS) panes.push(sideGlass(DOOR_SIDE, WIN_Y, z, WIN_H - 0.012, WIN_LEN - 0.012));
    for (const dz of [-0.05, 0.05]) panes.push(sideGlass(DOOR_SIDE, 0.5, DOOR_Z + dz, 0.26, 0.082)); // two tall door panes
    panes.push(sdf.box([0.38, 0.15, 0.014], 0.006).at(0, 0.555, BODY_Z1 - 0.014)); // windshield
    panes.push(sdf.box([0.34, 0.15, 0.014], 0.006).at(0, 0.555, BODY_Z0 + 0.014)); // rear window
    k.body('windows', sdf.union(...panes).paintFn((_x, y, _z) => mixRgb(GLASS, GLASS_LIGHT, 0.7 * clamp01((y - 0.5) / 0.14))), {
      color: '#86bde0',
      roughness: 0.15,
      metalness: 0.1,
      detail: 0.004,
      maxTriangles: 3500,
    });

    // ------------------------------------------------------------------ wheels
    const spots: [number, number][] = [];
    for (const wz of [FRONT_AXLE_Z, REAR_AXLE_Z]) for (const s of [-1, 1]) spots.push([s * WHEEL_X, wz]);
    const tireProto = sdf.cylinder(0.14, 0.12, 0.04).rotateZ(90);
    const hubProto = sdf.cylinder(0.075, 0.13, 0.012).rotateZ(90);
    const tires = sdf.union(...spots.map(([wx, wz]) => tireProto.at(wx, AXLE_Y, wz)));
    k.body('tires', tires, { color: '#2b2b33', roughness: 0.9, detail: 0.005, maxTriangles: 3000 });
    const hubs = sdf.union(...spots.map(([wx, wz]) => hubProto.at(wx, AXLE_Y, wz)));
    k.body(
      'hubs',
      hubs.paintFn((_x, y, z, base) => {
        const wz = z > 0.2 ? FRONT_AXLE_Z : REAR_AXLE_Z;
        const rr = Math.hypot(y - AXLE_Y, z - wz);
        return rr < 0.032 ? HUB_DARK : base;
      }),
      { color: '#b9bfc8', roughness: 0.35, metalness: 0.5, detail: 0.003, maxTriangles: 2500 },
    );

    // ------------------------------------------------------------------ trim
    const bumperFront = sdf.box([0.6, 0.055, 0.07], 0.025).at(0, 0.215, 0.715);
    const bumperRear = sdf.box([0.68, 0.055, 0.07], 0.025).at(0, 0.215, BODY_Z0 - 0.015);
    const mirror = sdf
      .capsule([HALF_W - 0.01, 0.6, 0.4], [HALF_W + 0.03, 0.62, 0.415], 0.01)
      .smoothUnion(0.01, sdf.ellipsoid([0.016, 0.045, 0.03]).at(HALF_W + 0.04, 0.615, 0.415));
    // Door frame: a dark rubber ring that stands proud of the side, so the door reads in line art.
    const frameX = DOOR_SIDE * (HALF_W + 0.002);
    const frame = sdf
      .box([0.03, 0.46, 0.27], 0.014)
      .at(frameX, DOOR_Y + 0.005, DOOR_Z)
      .subtract(sdf.box([0.12, 0.385, 0.2], 0.02).at(frameX, DOOR_Y + 0.005, DOOR_Z));
    // Centre seam between the two leaves.
    const seam = sdf.box([0.012, 0.37, 0.012], 0.004).at(DOOR_SIDE * (HALF_W - 0.008), DOOR_Y, DOOR_Z);
    const trim = sdf.union(bumperFront, bumperRear, mirror, mirror.mirror('x', 0), frame, seam);
    k.body('trim', trim, {
      color: '#3d3d48',
      roughness: 0.5,
      metalness: 0.25,
      detail: 0.004,
      maxTriangles: 2500,
    });

    // One low step under the door.
    const step = sdf.box([0.09, 0.03, 0.22], 0.012).at(DOOR_SIDE * (HALF_W + 0.025), 0.2, DOOR_Z);
    k.body('door-step', step, { color: '#b9bfc8', roughness: 0.4, metalness: 0.4, detail: 0.004, maxTriangles: 1200 });

    // ------------------------------------------------------------------ lamps
    const lampBall = (x: number, y: number, z: number, r: number, flat: number) =>
      sdf.sphere(r).scale([1, 1, flat]).at(x, y, z);
    const lamps = sdf.union(
      lampBall(-0.19, 0.325, 0.7, 0.052, 0.55), // headlights
      lampBall(0.19, 0.325, 0.7, 0.052, 0.55),
      lampBall(-0.27, 0.757, 0.38, 0.03, 0.9), // roof lamps, front
      lampBall(0.27, 0.757, 0.38, 0.03, 0.9),
      lampBall(-0.27, 0.757, -0.62, 0.03, 0.9), // roof lamps, rear
      lampBall(0.27, 0.757, -0.62, 0.03, 0.9),
      lampBall(-0.28, 0.3, BODY_Z0 - 0.005, 0.034, 0.5), // tail lamps
      lampBall(0.28, 0.3, BODY_Z0 - 0.005, 0.034, 0.5),
    );
    k.body(
      'lamps',
      lamps.paintFn((_x, y, z) => {
        if (z < 0) return RED;
        return y < 0.5 ? CREAM : AMBER;
      }),
      { color: '#fff4c2', roughness: 0.3, detail: 0.003, maxTriangles: 2500 },
    );
  },
});
