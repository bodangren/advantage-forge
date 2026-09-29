import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - greenhouse (catalog `architecture/structure/greenhouse`).
 * Role: cozy village garden building, seen small in 3/4 view; no rig.
 * Size: 3.0 m (X) x 2.0 m (Z) x 2.5 m to the ridge; on y = 0, front (+Z) long wall with the door.
 * One idea: a chunky cream timber cage with fat rafters sticking out past the eaves, glass between.
 * Shape language: square/chunky with soft bevels; round plants as contrast.
 * Palette: cream #ece0c8, cut wood #c9a06a, glass #cfe6ea, leaf #5cb85c / #3d8a3d, pot #8a5a35, slab #b5814a.
 * Materials: slab, frame, glass, pots, plants. Focal point: arched door + rafters.
 */
const C = {
  cream: rgb('#e9cfa0'),
  cut: rgb('#c9a06a'),
  glass: rgb('#cfe6ea'),
  leaf: rgb('#5cb85c'),
  leafDark: rgb('#3d8a3d'),
  pot: rgb('#8a5a35'),
  slab: rgb('#b5814a'),
};

const BASE_TOP = 0.14;
const EAVE = 2.1; // top of the wall plates
const RIDGE = 2.5;
const HX = 1.5;
const HZ = 1.0;
const RUN = HZ;
const RISE = RIDGE - EAVE;
const SLOPE_LEN = Math.hypot(RUN, RISE);
const ANG = (Math.atan2(RISE, RUN) * 180) / Math.PI;
const MID_Y = (EAVE + RIDGE) / 2;
const DOOR_X = -0.8;

const bx = (w: number, h: number, d: number, x: number, y: number, z: number, r = 0.03) =>
  sdf.box([w, h, d], Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)).at(x, y, z);

/** Place a shape built in slope-local space (x along ridge, z along slope toward the eave). */
const onSlope = (s: ReturnType<typeof sdf.sphere>, sign: number) =>
  s.rotateX(sign * ANG).at(0, MID_Y, sign * RUN / 2);

export default defineAsset({
  name: 'greenhouse',
  description:
    'Chibi greenhouse: honey oak slab, cream timber frame with fat overhanging rafters, tinted glass walls and pitched glass roof, an arched front door, potted plants inside and two shrubs outside.',
  detail: 0.01,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/greenhouse-mock.jpg',

  build(k) {
    // Base slab
    k.body('base', sdf.smoothUnion(0.012,
      sdf.box([3.4, 0.14, 2.4], 0.04).at(0, 0.07, 0),
      sdf.box([3.9, 0.1, 2.9], 0.04).at(0, 0.05, 0),
      sdf.box([3.4, 0.07, 0.2], 0.02).at(0, 0.175, HZ + 0.1),
      sdf.box([0.2, 0.07, 2.0], 0.02).at(HX + 0.1, 0.175, 0),
      sdf.box([0.2, 0.07, 2.0], 0.02).at(-HX - 0.1, 0.175, 0),
    ), {
      color: C.slab,
      roughness: 0.8,
      detail: 0.01,
      maxTriangles: 450,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 10, y * 10, z * 10, 2),
    });

    // Frame
    const parts = [];
    const py = BASE_TOP + 1.0; // post centre (2.0 tall -> top at 2.14)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(bx(0.14, 2.0, 0.14, sx * (HX - 0.07), py, sz * (HZ - 0.07)));
    // sill + top plate on each wall
    for (const sz of [-1, 1]) {
      parts.push(bx(3.0, 0.14, 0.14, 0, BASE_TOP + 0.07, sz * (HZ - 0.07)));
      parts.push(bx(3.06, 0.14, 0.14, 0, EAVE - 0.03, sz * (HZ - 0.07)));
    }
    for (const sx of [-1, 1]) {
      parts.push(bx(0.14, 0.14, 2.0, sx * (HX - 0.07), BASE_TOP + 0.07, 0));
      parts.push(bx(0.14, 0.14, 2.06, sx * (HX - 0.07), EAVE - 0.03, 0));
      // gable post
      parts.push(bx(0.14, RIDGE - EAVE + 0.1, 0.14, sx * (HX - 0.07), EAVE + 0.15, 0, 0.03));
    }
    // mullions: two per long wall (front avoids the door)
    for (const x of [0.35, 0.93]) parts.push(bx(0.14, 1.86, 0.14, x, py, HZ - 0.07));
    for (const x of [-0.5, 0.5]) parts.push(bx(0.14, 1.86, 0.14, x, py, -HZ + 0.07));
    // mid rails
    parts.push(bx(1.2, 0.09, 0.1, 0.9, 1.15, HZ - 0.05));
    parts.push(bx(3.0, 0.09, 0.1, 0, 1.15, -HZ + 0.05));
    // ridge beam with 0.1 overhang
    parts.push(bx(3.2, 0.14, 0.14, 0, RIDGE, 0, 0.04));
    // rafters
    const raftX = [-1.4, -0.7, 0, 0.7, 1.4];
    for (const sign of [1, -1]) {
      for (const x of raftX) {
        parts.push(onSlope(sdf.box([0.14, 0.12, SLOPE_LEN + 0.15 + 0.1], 0.05).at(x, 0.05, sign * 0.025), sign));
      }
    }
    // arched door frame (front wall)
    const dW = 0.76;
    const dH = 1.46;
    const archOuter = sdf.union(
      bx(dW + 0.28, dH - dW / 2 - 0.02, 0.14, DOOR_X, BASE_TOP + (dH - dW / 2) / 2, HZ - 0.03, 0.02),
      sdf.cylinder(dW / 2 + 0.14, 0.14, 0.02).rotateX(90).at(DOOR_X, BASE_TOP + dH - dW / 2, HZ - 0.03),
    );
    const archInner = sdf.union(
      bx(dW - 0.02, dH - dW / 2 + 0.01, 0.5, DOOR_X, BASE_TOP + (dH - dW / 2) / 2 - 0.005, HZ, 0.01),
      sdf.cylinder(dW / 2 - 0.01, 0.5, 0).rotateX(90).at(DOOR_X, BASE_TOP + dH - dW / 2, HZ),
    );
    parts.push(archOuter.subtract(archInner));
    // door mid-bar and centre stile (glass door panel sits in the arch)
    parts.push(bx(dW, 0.06, 0.06, DOOR_X, 0.85, HZ - 0.02, 0.02));
    parts.push(bx(0.06, dH - dW / 2 - 0.1, 0.06, DOOR_X, BASE_TOP + (dH - dW / 2) / 2 + 0.03, HZ - 0.02, 0.02));

    k.body(
      'frame',
      sdf.union(...parts),
      { color: C.cream, roughness: 0.75, detail: 0.01, maxTriangles: 4200, maxError: 0.009, bump: (x, y, z) => 0.0015 * noise.fbm(x * 20, y * 5, z * 20, 2) },
    );

    // Glass
    const gy = (EAVE + BASE_TOP) / 2;
    const gh = EAVE - BASE_TOP;
    const gable = (x: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-HZ + 0.06, EAVE - 0.03],
            [HZ - 0.06, EAVE - 0.03],
            [0.05, RIDGE - 0.08],
            [-0.05, RIDGE - 0.08],
          ]),
          0.03,
        )
        .rotateY(90)
        .at(x, 0, 0);
    const glassParts = [
      sdf.box([2.86, gh, 0.03], 0.005).at(0, gy, HZ - 0.06),
      sdf.box([2.86, gh, 0.03], 0.005).at(0, gy, -HZ + 0.06),
      sdf.box([0.03, gh, 1.86], 0.005).at(HX - 0.06, gy, 0),
      sdf.box([0.03, gh, 1.86], 0.005).at(-HX + 0.06, gy, 0),
      gable(HX - 0.06),
      gable(-HX + 0.06),
    ];
    for (const sign of [1, -1]) {
      glassParts.push(onSlope(sdf.box([2.9, 0.03, SLOPE_LEN - 0.04], 0.005).at(0, -0.02, 0), sign));
    }
    k.body('glass', sdf.union(...glassParts), {
      color: C.glass,
      roughness: 0.02,
      metalness: 0,
      opacity: 0.3,
      detail: 0.012,
      maxTriangles: 350,
    });

    // Pots and plants
    const spots: [number, number, number][] = [
      [-0.35, -0.5, 1],
      [0.5, -0.5, 2],
      [1.05, -0.35, 3],
      [0.7, 0.4, 4],
      [-0.1, 0.35, 5],
    ];
    const pots = sdf.union(...spots.map(([x, z]) => sdf.cylinder(0.18, 0.25, 0.03).at(x, BASE_TOP + 0.125, z)));
    k.body('pots', pots, { color: C.pot, roughness: 0.85, detail: 0.01, maxTriangles: 500 });

    const cluster = (x: number, z: number, s: number) => {
      const n = 3 + (s % 2);
      const balls = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + s;
        const r = 0.15 + 0.1 * noise.random(i, s);
        balls.push(sdf.sphere(r).at(x + Math.cos(a) * 0.1, BASE_TOP + 0.36 + 0.12 * i * (i % 2 ? 1 : 0.6), z + Math.sin(a) * 0.1));
      }
      return sdf.smoothUnion(0.06, ...balls);
    };
    const shrub = (x: number, z: number, h: number) => sdf.cone([x, BASE_TOP, z], [x, BASE_TOP + h, z], 0.15, 0.02).round(0.02);
    const plants = sdf.union(
      ...spots.map(([x, z, s]) => cluster(x, z, s)),
      shrub(-1.62, 1.08, 0.6),
      shrub(1.6, 1.1, 0.42),
      shrub(-1.0, 1.12, 0.3),
    );
    k.body(
      'plants',
      plants.paintFn((x, y, z, base) => mixRgb(base, C.leafDark, Math.max(0, Math.min(1, (0.75 - y) / 0.6)) * 0.7)),
      { color: C.leaf, roughness: 0.8, detail: 0.008, maxTriangles: 700 },
    );
  },
});
