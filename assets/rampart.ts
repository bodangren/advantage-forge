import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Rampart corner tower (catalog architecture/structure/rampart), 2.5 m wide, ~3.9 m to the tall tips.
 * Role: village wall corner; must read at 128 px. Faces +Z, stands on y = 0. No rig.
 * One idea: a chunky grey drum with a flared light parapet and alternating tall pointed merlons.
 * Shape language: square/round chunky, soft bevels. Palette: stone #a8aaae, light #c4c6c9, joints #7e8286,
 *   door #8a5a35 / #6b4226, knob #c8423a, gold #d4a93a.
 * Materials: stone, light parapet stone, wood door, gold studs, red knob, dark slits.
 * Focal point: the arched plank door in its voussoir arch.
 */
const C = {
  stone: rgb('#8f9399'),
  light: rgb('#a8abb0'),
  blockLo: rgb('#85898f'),
  blockHi: rgb('#a0a4aa'),
  core: rgb('#6a6e74'),
  oak: rgb('#8a5a35'),
  walnut: rgb('#6b4226'),
  red: rgb('#c8423a'),
  gold: rgb('#d4a93a'),
  void: rgb('#1e1c1c'),
};
const deg = (r: number) => (r * 180) / Math.PI;

const archProfile = (halfW: number, bot: number, spring: number) => {
  const pts: [number, number][] = [
    [-halfW, bot],
    [halfW, bot],
  ];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([halfW * Math.cos(a), spring + halfW * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

const tone = (course: number, idx: number, seed: number) =>
  mixRgb(C.blockLo, C.blockHi, noise.random(course * 17 + idx + 40, seed));

/** Per-block tone: tower blocks by course and angle index, stub blocks by course and slot; core is darker. */
const stonePaint = (x: number, y: number, z: number) => {
  const inStubX = x > 0.95 && Math.abs(z) < 0.5;
  const inStubZ = z < -0.95 && Math.abs(x) < 0.5;
  if (inStubX || inStubZ) {
    const across = inStubX ? Math.abs(z) : Math.abs(x);
    const along = inStubX ? x : -z;
    if (across < 0.315 && along < 2.09) return C.core;
    const course = Math.max(0, Math.min(2, Math.floor(y / 0.8)));
    return tone(course + 5, Math.floor(along / 0.6) + (z < 0 || x < 0 ? 7 : 0), 11);
  }
  const r = Math.hypot(x, z);
  if (r < 1.215) return C.core;
  const course = Math.max(0, Math.min(3, Math.floor((y - 0.05) / 0.63)));
  const off = course % 2 ? 0.5 : 0;
  const a = (Math.atan2(x, z) / (Math.PI * 2)) * 10 - off;
  return tone(course, ((Math.round(a) % 10) + 10) % 10, 5);
};
const stoneBump = (x: number, y: number, z: number) => 0.003 * noise.fbm(x * 16, y * 16, z * 16, 2);

const plankPaint = (x: number, y: number) => {
  const f = x / 0.1 - Math.floor(x / 0.1);
  const g = Math.pow(0.5 + 0.5 * Math.cos(f * Math.PI * 2), 4);
  const board = noise.random(Math.floor(x / 0.1 + 9), 2);
  return mixRgb(mixRgb(C.oak, C.walnut, 0.15 + 0.3 * board), C.walnut, 0.7 * g);
};

export default defineAsset({
  name: 'rampart',
  description: 'A round grey stone corner tower with a crenellated parapet, pointed merlons, an arched plank door, and two wall stubs.',
  detail: 0.012,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/rampart-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- stone drum + blocks + stubs
    const parts = [sdf.cylinder(1.2, 2.65, 0.03).at(0, 1.325, 0)];
    for (let c = 0; c < 4; c++) {
      const y = 0.32 + c * 0.63;
      const off = c % 2 ? 0.5 : 0;
      for (let i = 0; i < 10; i++) {
        const a = ((i + off) / 10) * Math.PI * 2;
        parts.push(
          sdf
            .box([0.64, 0.54, 0.16], 0.06)
            .rotateY(deg(a))
            .at(Math.sin(a) * 1.16, y, Math.cos(a) * 1.16),
        );
      }
    }
    // Wall stubs: +X and -Z, each with three courses of proud blocks (running bond) and low merlons.
    const stubX = sdf.box([1.3, 2.4, 0.6], 0.05).at(1.5, 1.2, 0);
    const stubZ = sdf.box([0.6, 2.4, 1.3], 0.05).at(0, 1.2, -1.5);
    const stubBlocks: ReturnType<typeof sdf.box>[] = [];
    for (let c = 0; c < 3; c++) {
      const y = 0.4 + c * 0.8;
      const slots: [number, number][] = c % 2 ? [[1.0, 0.4], [1.5, 0.6], [2.0, 0.4]] : [[1.2, 0.6], [1.8, 0.6]];
      for (const [al, w] of slots) {
        for (const s of [1, -1]) {
          stubBlocks.push(sdf.box([w - 0.03, 0.7, 0.1], 0.04).at(al, y, s * 0.29));
          stubBlocks.push(sdf.box([0.1, 0.7, w - 0.03], 0.04).at(s * 0.29, y, -al));
        }
      }
      stubBlocks.push(sdf.box([0.1, 0.7, 0.5], 0.04).at(2.09, y, 0));
      stubBlocks.push(sdf.box([0.5, 0.7, 0.1], 0.04).at(0, y, -2.09));
    }
    const stubTops: ReturnType<typeof sdf.box>[] = [];
    for (const al of [1.15, 1.5, 1.85]) {
      stubTops.push(sdf.box([0.28, 0.24, 0.3], 0.05).at(al, 2.5, 0));
      stubTops.push(sdf.box([0.3, 0.24, 0.28], 0.05).at(0, 2.5, -al));
    }

    // Door arch: five clean rounded blocks around the arch plus three jamb blocks per side.
    const springY = 0.95;
    for (let i = 0; i < 5; i++) {
      const a = ((18 + i * 36) * Math.PI) / 180;
      const r = 0.4 + 0.125;
      parts.push(
        sdf
          .box([0.3, 0.25, 0.2], 0.05)
          .rotateZ(deg(a) - 90)
          .at(Math.cos(a) * r, springY + Math.sin(a) * r, 1.24),
      );
    }
    for (const s of [1, -1]) {
      for (const y of [0.8, 0.52, 0.24]) parts.push(sdf.box([0.3, 0.25, 0.2], 0.05).at(s * 0.525, y, 1.24));
    }

    const recess = sdf.extrude(archProfile(0.4, -0.1, springY), 0.5, 0.01).at(0, 0, 1.25);
    // Arrow slits at +/-60 degrees from the front (the +X side is covered by the wall stub).
    const slitCut = (s: number) =>
      sdf
        .box([0.08, 0.5, 0.14], 0.03)
        .rotateY(s * 60)
        .at(Math.sin((s * 60 * Math.PI) / 180) * 1.23, 1.8, Math.cos((s * 60 * Math.PI) / 180) * 1.23);
    const stoneAll = sdf
      .union(...parts, stubX, stubZ, ...stubBlocks, ...stubTops)
      .subtract(recess, slitCut(1), slitCut(-1))
      .paintFn(stonePaint);
    k.body('stone', stoneAll, {
      color: C.stone,
      roughness: 0.9,
      detail: 0.02,
      maxError: 0.03,
      maxTriangles: 5000,
      bump: stoneBump,
    });

    // Dark slit backs.
    const slitBack = (s: number) => {
      const a = (s * 60 * Math.PI) / 180;
      return sdf.box([0.06, 0.46, 0.03], 0.012).rotateY(s * 60).at(Math.sin(a) * 1.17, 1.8, Math.cos(a) * 1.17);
    };
    k.body('slits', sdf.union(slitBack(1), slitBack(-1)), { color: C.void, roughness: 0.95, detail: 0.008, maxTriangles: 200 });

    // ---------------------------------------------------------------- parapet
    const band = sdf.cylinder(1.35, 0.5, 0.06).at(0, 2.85, 0);
    const merlons = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const px = Math.sin(a) * 1.24;
      const pz = Math.cos(a) * 1.24;
      let m;
      if (i % 2 === 0) {
        m = sdf.box([0.35, 0.4, 0.3], 0.05).at(0, 0.2, 0);
      } else {
        m = sdf
          .box([0.35, 0.35, 0.3], 0.05)
          .at(0, 0.175, 0)
          .smoothUnion(0.02, sdf.cone([0, 0.3, 0], [0, 0.55, 0], 0.19, 0.03));
      }
      merlons.push(m.rotateY(deg(a)).at(px, 3.1, pz));
    }
    k.body(
      'parapet',
      sdf.union(band, ...merlons).paintFn((x, y, z, base) => mixRgb(base, C.stone, 0.2 * (0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2)))),
      { color: C.light, roughness: 0.88, detail: 0.008, maxError: 0.02, maxTriangles: 2000, bump: stoneBump },
    );

    // ---------------------------------------------------------------- door
    k.body(
      'door',
      sdf.extrude(archProfile(0.41, 0.0, springY), 0.14, 0.014).at(0, 0, 1.13).paintFn(plankPaint),
      { color: C.oak, roughness: 0.8, detail: 0.008, maxTriangles: 700, textureDensity: 2 },
    );

    // ---------------------------------------------------------------- gold studs + red knob
    const studs: ReturnType<typeof sdf.sphere>[] = [];
    for (const a of [-52, -20, 20, 52]) {
      const r = (a * Math.PI) / 180;
      studs.push(sdf.sphere(0.06).at(Math.sin(r) * 1.37, 2.85, Math.cos(r) * 1.37));
    }
    // door stud ring
    for (const [x, y] of [[-0.25, 0.9], [0.25, 0.9], [-0.25, 0.35], [0.25, 0.35], [0, 1.2]] as [number, number][]) {
      studs.push(sdf.sphere(0.035).at(x, y, 1.2));
    }
    k.body('gold', sdf.union(...studs), { color: C.gold, roughness: 0.35, metalness: 1, detail: 0.008, maxTriangles: 500 });
    k.body('knob', sdf.ellipsoid([0.08, 0.05, 0.04]).at(0, 0.65, 1.2), {
      color: C.red,
      roughness: 0.6,
      detail: 0.008,
      maxTriangles: 200,
    });
  },
});
