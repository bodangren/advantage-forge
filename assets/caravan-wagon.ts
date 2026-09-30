import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - caravan wagon (vehicles/land/caravan-wagon).
 * Role: hero vehicle prop, read at 128 px. Size: 2.6 m long (Z -0.95..1.65),
 *   1.3 m wide over wheels, 1.95 m tall with chimney; wheels on y = 0, faces +Z.
 * One idea: a rounded barrel-vault house, green roof over red planks, on chunky wheels.
 * Shape language: round dominant (vault, wheels, flowers), square secondary (bed, bench).
 * Palette: red #b03a2a walls, green #2f7a4a roof, gold #d9a83a trim, honey oak #b5814a
 *   bed and wheels, walnut #6b4226 door, iron #4a4f55 fittings. Accent: yellow flowers.
 * Materials: wood, painted wood, gold trim, iron, glass, leaf, petals.
 * Rig: none.
 */
const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const RED = rgb('#b03a2a');
const RED_DARK = rgb('#7f2a20');
const GREEN = rgb('#2f7a4a');
const GREEN_LIGHT = rgb('#3f9a5c');
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const AXLE_Y = 0.42;
const RIM_R = 0.365;
const WHEEL_X = 0.62;
const FRONT_Z = 0.6;
const REAR_Z = -0.6;
const FLOOR_TOP = 0.62;
const WALL_TOP = 1.16; // vault springs from here
const HZ0 = -0.95; // house back
const HZ1 = 0.45; // house front
const HC = (HZ0 + HZ1) / 2;
const HL = HZ1 - HZ0;
const R = 0.53;

export default defineAsset({
  name: 'caravan-wagon',
  description:
    'A caravan wagon: red plank house with a green barrel-vault roof and gold trim on four chunky spoked wheels, with a round-windowed back door, flower boxes, an iron chimney, and a driver bench.',
  detail: 0.008,
  reference: 'docs/vehicle-mockups/caravan-wagon-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- wheels
    const rim = sdf.torus(RIM_R, 0.06).rotateZ(90);
    const hub = sdf.cylinder(0.08, 0.11, 0.012).rotateZ(90);
    const spokes: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 6; i++)
      spokes.push(sdf.capsule([0, 0.05, 0], [0, RIM_R - 0.04, 0], 0.021).rotateX(i * 60));
    const wheelProto = sdf.smoothUnion(0.012, rim, hub, ...spokes);
    const wheelPaintAt = (zc: number) => (x: number, y: number, z: number) => {
      const rr = Math.hypot(y - AXLE_Y, z - zc);
      const grain = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
      let c = mixRgb(OAK, PALE, 0.14 * grain);
      c = mixRgb(c, BROWN, 0.55 * clamp01((rr - 0.3) / 0.12));
      c = mixRgb(c, PALE, 0.45 * clamp01((0.09 - rr) / 0.09));
      return c;
    };
    const spots: [string, number, number][] = [
      ['wheel.fl', -WHEEL_X, FRONT_Z],
      ['wheel.fr', WHEEL_X, FRONT_Z],
      ['wheel.rl', -WHEEL_X, REAR_Z],
      ['wheel.rr', WHEEL_X, REAR_Z],
    ];
    for (const [name, wx, wz] of spots)
      k.body(name, wheelProto.at(wx, AXLE_Y, wz).paintFn(wheelPaintAt(wz)), {
        color: '#b5814a',
        roughness: 0.8,
        metalness: 0,
        detail: 0.01,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
        maxTriangles: 1600,
      });

    // ---------------------------------------------------------------- iron
    const rodF = sdf.cylinder(0.02, 1.4, 0.004).rotateZ(90).at(0, AXLE_Y, FRONT_Z);
    const rodR = sdf.cylinder(0.02, 1.4, 0.004).rotateZ(90).at(0, AXLE_Y, REAR_Z);
    const cap = sdf.cylinder(0.068, 0.024, 0.004).rotateZ(90).at(WHEEL_X + 0.052, AXLE_Y, 0);
    const nut = sdf.sphere(0.02).at(WHEEL_X + 0.068, AXLE_Y, 0);
    const chimney = sdf.union(
      sdf.cylinder(0.055, 0.5, 0.01).at(0.2, 1.74, -0.35),
      sdf.cylinder(0.075, 0.05, 0.012).at(0.2, 1.97, -0.35),
    );
    const iron = sdf.union(
      rodF,
      rodR,
      cap.mirror('x', 0).at(0, 0, FRONT_Z),
      cap.mirror('x', 0).at(0, 0, REAR_Z),
      nut.mirror('x', 0).at(0, 0, FRONT_Z),
      nut.mirror('x', 0).at(0, 0, REAR_Z),
      chimney,
      sdf.cylinder(0.056, 0.06, 0.008).rotateX(90).at(0, 0.3, 1.65),
    );
    k.body('iron-work', iron, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.005,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 1500,
    });

    // ---------------------------------------------------------------- bed + frame (wood)
    const floorBoard = sdf.box([1.1, 0.06, 2.0], 0.02).at(0, FLOOR_TOP - 0.03, 0.05);
    const rail = sdf.box([0.07, 0.14, 1.9], 0.012).at(0.32, 0.5, 0);
    const axleWoodF = sdf.cylinder(0.045, 1.14, 0.008).rotateZ(90).at(0, AXLE_Y, FRONT_Z);
    const axleWoodR = sdf.cylinder(0.045, 1.14, 0.008).rotateZ(90).at(0, AXLE_Y, REAR_Z);
    const block = sdf.box([0.1, 0.16, 0.14], 0.01).at(0.32, 0.47, FRONT_Z);
    const shaft = sdf.capsule([0, 0.55, 0.85], [0, 0.3, 1.62], 0.05);
    const foot = sdf.box([1.0, 0.06, 0.3], 0.02).at(0, 0.72, 0.85);
    const wood = sdf.smoothUnion(
      0.016,
      floorBoard,
      rail.mirror('x', 0),
      axleWoodF,
      axleWoodR,
      block.mirror('x', 0),
      block.mirror('x', 0).at(0, 0, REAR_Z - FRONT_Z),
      shaft,
      foot,
    );
    const bedPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 6, z * 22, 2);
      let c = mixRgb(OAK, PALE, 0.2 * grain);
      c = mixRgb(c, BROWN, 0.3 * grain * grain);
      if (y > 0.6 && y < 0.76 && z > 0.68) {
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * ((x + 0.5) / 0.2)), 20);
        c = mixRgb(c, WALNUT, 0.5 * seam);
      }
      if (z > 1.0) c = mixRgb(c, BROWN, 0.4);
      c = mixRgb(c, WALNUT, 0.45 * Math.pow(clamp01(1 - y / 0.25), 2));
      return c;
    };
    k.body('bed', wood.paintFn(bedPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.01,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 8, z * 30, 2),
      maxTriangles: 2000,
    });

    // ---------------------------------------------------------------- house
    const walls = sdf.box([1.0, WALL_TOP - FLOOR_TOP, HL], 0.03).at(0, (WALL_TOP + FLOOR_TOP) / 2, HC);
    const vault = sdf.cylinder(R - 0.005, HL, 0.02).rotateX(90).at(0, WALL_TOP, HC);
    const house = sdf.smoothUnion(0.02, walls, vault.intersect(sdf.box([1.4, 1.0, HL + 0.2]).at(0, WALL_TOP + 0.5, HC)));
    const housePaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 30, z * 8, 2);
      const inRoof = y > WALL_TOP - 0.02 && z > HZ0 + 0.03 && z < HZ1 - 0.03;
      if (inRoof) {
        // long roof planks along Z
        const ang = Math.atan2(x, y - WALL_TOP);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(ang * 9), 30);
        let c = mixRgb(GREEN, GREEN_LIGHT, 0.35 * grain + 0.25 * clamp01((y - 1.5) / 0.2));
        return mixRgb(c, rgb('#1f5535'), 0.6 * seam);
      }
      // red horizontal planks
      const f = (y - FLOOR_TOP) / 0.108;
      const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 22);
      let c = mixRgb(RED, RED_DARK, 0.35 * grain);
      c = mixRgb(c, rgb('#d65a3e'), 0.25 * noise.random(Math.floor(f), Math.round(x * 3), 1));
      c = mixRgb(c, rgb('#3f1a12'), 0.6 * seam);
      return mixRgb(c, WALNUT, 0.35 * Math.pow(clamp01(1 - (y - FLOOR_TOP) / 0.1), 2));
    };
    k.body('house', house.paintFn(housePaint), {
      color: '#b03a2a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.01,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 4500,
    });

    // gold trim: an arch band at each end of the vault plus a ridge-free eave line
    const arch = (z: number) =>
      sdf
        .torus(R + 0.02, 0.04)
        .rotateX(90)
        .at(0, WALL_TOP, z)
        .intersect(sdf.box([1.4, 0.7, 0.2]).at(0, WALL_TOP + 0.3, z));
    const post = sdf.box([0.07, WALL_TOP - FLOOR_TOP, 0.07], 0.02).at(R + 0.02, (WALL_TOP + FLOOR_TOP) / 2, 0);
    const posts = (z: number) => post.mirror('x', 0).at(0, 0, z);
    const trim = sdf.smoothUnion(
      0.01,
      arch(HZ0 + 0.02),
      arch(HZ1 - 0.02),
      posts(HZ0 + 0.02),
      posts(HZ1 - 0.02),
    );
    const doorFrame = sdf.box([0.5, 0.66, 0.04], 0.015).at(0, FLOOR_TOP + 0.34, HZ0 - 0.005);
    const trimAll = sdf.smoothUnion(0.01, trim, doorFrame);
    k.body('trim', trimAll.paintFn((x, y, z) => mixRgb(rgb('#d9a83a'), rgb('#f0c860'), 0.3 * (0.5 + 0.5 * noise.fbm(x * 10, y * 10, z * 10, 2)))), {
      color: '#d9a83a',
      roughness: 0.6,
      metalness: 0.15,
      detail: 0.006,
      maxTriangles: 2000,
    });

    // door + windows (walnut) at the back, side window frames
    const door = sdf
      .union(
        sdf.box([0.34, 0.4, 0.04], 0.015).at(0, FLOOR_TOP + 0.24, HZ0 - 0.02),
        sdf.cylinder(0.17, 0.04, 0.02).rotateX(90).at(0, FLOOR_TOP + 0.44, HZ0 - 0.02),
      )
      .paintWhere(sdf.sphere(0.06).at(0.12, FLOOR_TOP + 0.24, HZ0 - 0.05), rgb('#d9a83a'), 0.01);
    const winFrame = sdf.torus(0.1, 0.03).rotateZ(90).at(R - 0.02, 0.93, HC);
    const frames = sdf.union(winFrame, winFrame.mirror('x', 0), sdf.torus(0.075, 0.025).rotateX(90).at(0, FLOOR_TOP + 0.58, HZ0 - 0.045));
    k.body('door', door, { color: '#6b4226', roughness: 0.8, metalness: 0, detail: 0.006, maxTriangles: 800 });
    k.body('window-frames', frames, { color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.005, maxTriangles: 1200 });
    const glass = sdf.union(
      sdf.cylinder(0.09, 0.03, 0.01).rotateZ(90).at(R - 0.02, 0.93, HC),
      sdf.cylinder(0.09, 0.03, 0.01).rotateZ(90).at(-(R - 0.02), 0.93, HC),
      sdf.cylinder(0.07, 0.03, 0.01).rotateX(90).at(0, FLOOR_TOP + 0.58, HZ0 - 0.035),
    );
    k.body('glass', glass, { color: '#f2d27a', roughness: 0.2, metalness: 0, opacity: 0.85, emissive: '#f2d27a', emissiveIntensity: 0.4, detail: 0.005, maxTriangles: 600 });

    // flower boxes under the side windows, with leaves and yellow flowers
    const boxSolid = sdf.box([0.09, 0.09, 0.4], 0.02).at(R + 0.02, 0.75, HC);
    const boxes = sdf.union(boxSolid, boxSolid.mirror('x', 0));
    k.body('flower-box', boxes.paint(WALNUT), { color: '#6b4226', roughness: 0.8, metalness: 0, detail: 0.006, maxTriangles: 1200 });
    const leaves: ReturnType<typeof sdf.sphere>[] = [];
    const petals: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 5; i++) {
      const z = HC - 0.16 + i * 0.08;
      const h = 0.05 + 0.03 * noise.random(i, 1, 1);
      leaves.push(sdf.sphere(0.05).at(R + 0.02, 0.83, z));
      petals.push(sdf.sphere(0.04).at(R + 0.03, 0.83 + h + 0.03, z));
    }
    const lv = sdf.smoothUnion(0.01, ...leaves);
    const pt = sdf.union(...petals);
    k.body('leaves', sdf.union(lv, lv.mirror('x', 0)), { color: '#3c7a3d', roughness: 0.6, metalness: 0, detail: 0.006, maxTriangles: 800 });
    k.body('flowers', sdf.union(pt, pt.mirror('x', 0)), { color: '#f2c531', roughness: 0.6, metalness: 0, detail: 0.005, maxTriangles: 800 });

    // ---------------------------------------------------------------- driver bench
    const seat = sdf.box([0.9, 0.07, 0.3], 0.02).at(0, 0.98, 0.75);
    const seatSide = sdf.box([0.07, 0.3, 0.3], 0.02).at(0.42, 0.83, 0.75);
    const benchBack = sdf.box([0.9, 0.2, 0.05], 0.02).at(0, 1.12, 0.62);
    const bench = sdf.smoothUnion(0.012, seat, seatSide.mirror('x', 0), benchBack);
    k.body('bench', bench.paintFn((x, y, z) => mixRgb(BROWN, OAK, 0.4 + 0.4 * noise.fbm(x * 15, y * 15, z * 15, 2))), {
      color: '#8a5a35',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 30, y * 10, z * 30, 2),
      maxTriangles: 1500,
    });
  },
});
