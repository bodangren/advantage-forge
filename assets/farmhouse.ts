import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - farmhouse (catalog `architecture/structure/farmhouse`).
 * Role: village home, seen small in the map; static, no rig.
 * Size: 6 m wide (X), 4 m deep (Z), 4.5 m tall; on y = 0, door facing +Z, ridge along X.
 * One idea: a squat whitewashed box under one huge fat straw thatch roof with drooping eaves.
 * Shape language: round and soft (thatch), square secondary (walls, chimney).
 * Palette: whitewash #ece4d2, thatch #e0bb60 / #b8923f, stone #8a94a0, oak #b5814a,
 *   brown #8a5a35, walnut #6b4226, pale wood #c9a06a, iron #4a4f55, leaf #5cb85c,
 *   flowers #e0503c / #f2c94c.
 * Materials: whitewash (0.9), thatch (0.95), stone (0.9), wood (0.8), iron (0.5, m 0.7), leaves, flowers.
 * Details: door + porch (focal), two windows with flower boxes, chimney, timber corner posts.
 */

const C = {
  white: rgb('#ece4d2'),
  thatch: rgb('#d9a84a'),
  thatchDark: rgb('#b8863a'),
  stone: rgb('#8a94a0'),
  oak: rgb('#b5814a'),
  brown: rgb('#8a5a35'),
  pale: rgb('#c9a06a'),
  walnut: rgb('#6b4226'),
  iron: rgb('#4a4f55'),
  leaf: rgb('#5cb85c'),
  red: rgb('#e0503c'),
  yellow: rgb('#f2c94c'),
  glass: rgb('#3a4a5a'),
};
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const FZ = 2.0; // front wall plane
const WALL_TOP = 2.6;
const DOOR_X = 0;
const WIN_Y = 1.5;
const WIN_XS = [-1.9, 1.9];

export default defineAsset({
  name: 'farmhouse',
  description:
    'Chibi farmhouse: whitewashed walls, huge fat straw thatch roof, stone chimney, big door with a small porch, and two windows with flower boxes.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/farmhouse-mock.jpg',

  build(k) {
    // Stone plinth, chimney, porch step.
    const plinth = sdf.box([6.2, 0.3, 4.2], 0.06).at(0, 0.15, 0);
    const chimney = sdf.box([0.75, 2.8, 0.75], 0.07).at(2.0, 3.6, -0.5);
    const chimneyCap = sdf.box([0.98, 0.16, 0.98], 0.05).at(2.0, 5.0, -0.5);
    const step = sdf.box([1.7, 0.2, 0.7], 0.05).at(DOOR_X, 0.1, FZ + 0.75);
    k.body('stone', sdf.union(chimney, chimneyCap).paintFn((x, y, z, b) =>
      mixRgb(b, rgb('#6a7480'), 0.4 * (0.5 + 0.5 * noise.fbm(x * 2.5, y * 2.5, z * 2.5, 2))),
    ), {
      color: C.stone, roughness: 0.9, detail: 0.03, maxTriangles: 1400,
      bump: (x, y, z) => {
        const { f1, f2 } = noise.worley(x * 3, y * 2.4, z * 3, 4);
        return -0.008 * (1 - clamp01((f2 - f1 - 0.05) / 0.09));
      },
    });

    k.body('foundation', sdf.union(plinth, step), { color: C.pale, roughness: 0.9, detail: 0.03, maxTriangles: 300,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 6, y * 6, z * 6, 2) });
    const stones = sdf.union(
      ...[-2.4, -1.45, 1.45, 2.4].map((x, i) => sdf.box([0.5, 0.3, 0.16], 0.06).at(x, 0.42 + (i % 2) * 0.04, FZ + 0.03)),
      ...[-1, 1].flatMap((sx) => [-0.9, 0.9].map((z) => sdf.box([0.16, 0.3, 0.5], 0.06).at(sx * 3.0, 0.45, z))),
    );
    k.body('footstones', stones, { color: C.pale, roughness: 0.85, detail: 0.02, maxTriangles: 500 });

    // Whitewashed walls, with a small chimney-independent rounded box.
    const walls = sdf.box([6.0, WALL_TOP - 0.3, 4.0], 0.12).at(0, 0.3 + (WALL_TOP - 0.3) / 2, 0);
    k.body('walls', walls, {
      color: C.white, roughness: 0.92, detail: 0.04, maxTriangles: 900,
      bump: (x, y, z) => 0.006 * noise.fbm(x * 5, y * 5, z * 5, 3),
    });

    // Thatch roof: profile in XY (x = across the house), extruded along Z then turned so the ridge runs along X.
    const roofP = profile.polygon([
      [-2.8, 2.3], [-2.8, 2.65], [-1.5, 3.7], [-0.4, 4.4], [0.4, 4.4], [1.5, 3.7], [2.8, 2.65], [2.8, 2.3],
      [1.5, 2.3], [-1.5, 2.3],
    ], { smooth: false });
    const roof = sdf.extrude(roofP, 6.9, 0.12).rotateY(90);
    const ridge = sdf.capsule([-3.3, 4.32, 0], [3.3, 4.32, 0], 0.26);
    // Scalloped flaps drooping under both eave edges.
    const flaps = sdf.union(...[-1, 1].flatMap((sz) => [0, 1, 2, 3, 4, 5].map((i) =>
      sdf.ellipsoid([0.6, 0.3, 0.3]).at(-2.75 + i * 1.1, 2.3, sz * 2.72))));
    // Raised curved straw ridges on each slope.
    const sideR = (sz: number) => [[2.15, 3.32], [1.2, 3.97]].map(([z, y], j) =>
      sdf.chain([-2.4, -1.2, 0, 1.2, 2.4].map((x, i) => [x, y + 0.07 + 0.09 * Math.sin(i * 1.7 + j * 2 + sz), sz * (z + 0.1 + 0.05 * Math.sin(i * 1.3 + j)), 0.1]), 0.05));
    const thatch = sdf.smoothUnion(0.12, roof, ridge, flaps)
      .displace(0.03, (x, y, z) => noise.fbm(x * 5, y * 9, z * 5, 3));
    k.body('thatch', thatch.paintFn((x, y, z, b) => {
      const t = clamp01((3.4 - y) / 1.2);
      const streak = 0.5 + 0.5 * noise.fbm(x * 2, y * 12, z * 12, 2, 9);
      return mixRgb(mixRgb(b, C.thatchDark, t * 0.55), C.thatchDark, streak * 0.2);
    }), { color: C.thatch, roughness: 0.95, detail: 0.05, maxTriangles: 2200, maxError: 0.02 });

    // Timber corner posts and beams (honey oak).
    const posts = sdf.union(
      ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => sdf.box([0.2, 2.3, 0.2], 0.05).at(sx * 2.98, 1.45, sz * 1.98))),
      sdf.box([6.1, 0.2, 0.16], 0.04).at(0, WALL_TOP - 0.12, FZ + 0.02),
    );
    k.body('timber', posts, { color: C.oak, roughness: 0.8, detail: 0.03, maxTriangles: 700,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 6, y * 20, z * 6, 2) });

    // Door, big and round-topped, plus frame.
    const doorH = 1.85;
    const doorP = profile.polygon([[-0.55, 0], [0.55, 0], [0.55, doorH - 0.4], [0.35, doorH - 0.08], [0, doorH], [-0.35, doorH - 0.08], [-0.55, doorH - 0.4]]);
    const door = sdf.extrude(doorP, 0.14, 0.03).at(DOOR_X, 0.3, FZ + 0.05);
    k.body('door', door.paintFn((x, y, z, b) => {
      const f = (x + 1) / 0.22; const g = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 5);
      return mixRgb(b, C.walnut, 0.7 * g);
    }), { color: C.brown, roughness: 0.8, detail: 0.02, maxTriangles: 700 });
    const frame = sdf.extrude(profile.polygon([[-0.72, 0], [0.72, 0], [0.72, doorH - 0.3], [0.45, doorH + 0.1], [0, doorH + 0.2], [-0.45, doorH + 0.1], [-0.72, doorH - 0.3]]), 0.1, 0.03)
      .subtract(sdf.extrude(doorP, 0.6)).at(DOOR_X, 0.3, FZ + 0.04);
    // Porch: floor, two posts, small roof.
    const porchFloor = sdf.box([2.1, 0.12, 0.9], 0.04).at(DOOR_X, 0.3, FZ + 0.6);
    const porchPosts = sdf.union(
      sdf.capsule([-0.95, 0.3, FZ + 0.95], [-0.95, 2.35, FZ + 0.95], 0.09),
      sdf.capsule([0.95, 0.3, FZ + 0.95], [0.95, 2.35, FZ + 0.95], 0.09),
    );
    const porchRoof = sdf.extrude(profile.polygon([[-1.3, 2.3], [0, 2.75], [1.3, 2.3], [1.3, 2.18], [0, 2.6], [-1.3, 2.18]]), 1.2, 0.04)
      .at(DOOR_X, 0, FZ + 0.55);
    k.body('trim', sdf.union(frame, porchFloor, porchPosts).paintFn((x, y, z, b) => mixRgb(b, C.walnut, 0.25 * (0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2)))),
      { color: C.pale, roughness: 0.8, detail: 0.025, maxTriangles: 900 });
    k.body('porch-roof', porchRoof.displace(0.02, (x, y, z) => noise.fbm(x * 6, y * 8, z * 6, 2)),
      { color: C.thatch, roughness: 0.95, detail: 0.04, maxTriangles: 500 });

    // Windows: frame, shutters, glass, flower boxes.
    const winFrame = sdf.union(...WIN_XS.map((wx) =>
      sdf.box([1.0, 0.95, 0.1], 0.05).subtract(sdf.box([0.76, 0.72, 0.5])).at(wx, WIN_Y, FZ + 0.04)));
    const shutters = sdf.union(...WIN_XS.flatMap((wx) => [-1, 1].map((s) =>
      sdf.box([0.32, 0.95, 0.07], 0.03).at(wx + s * 0.68, WIN_Y, FZ + 0.06))));
    k.body('shutters', sdf.union(winFrame, shutters), { color: C.brown, roughness: 0.8, detail: 0.02, maxTriangles: 700 });
    const glass = sdf.union(...WIN_XS.flatMap((wx) => [
      sdf.box([0.78, 0.74, 0.05], 0.02).at(wx, WIN_Y, FZ - 0.01),
    ]));
    const mull = sdf.union(...WIN_XS.flatMap((wx) => [
      sdf.box([0.06, 0.78, 0.06], 0.02).at(wx, WIN_Y, FZ + 0.05),
      sdf.box([0.8, 0.06, 0.06], 0.02).at(wx, WIN_Y, FZ + 0.05),
    ]));
    k.body('glass', glass, { color: C.glass, roughness: 0.2, detail: 0.03, maxTriangles: 150 });
    k.body('mullions', mull, { color: C.pale, roughness: 0.8, detail: 0.02, maxTriangles: 400 });
    const boxes = sdf.union(...WIN_XS.map((wx) =>
      sdf.box([1.1, 0.26, 0.3], 0.06).at(wx, WIN_Y - 0.62, FZ + 0.2)));
    k.body('flowerbox', boxes, { color: C.walnut, roughness: 0.8, detail: 0.025, maxTriangles: 400 });
    const leaves = sdf.union(...WIN_XS.map((wx) =>
      sdf.ellipsoid([0.5, 0.12, 0.13]).at(wx, WIN_Y - 0.42, FZ + 0.2)));
    k.body('leaves', leaves, { color: C.leaf, roughness: 0.8, detail: 0.025, maxTriangles: 400 });
    const blooms: ReturnType<typeof sdf.sphere>[] = [];
    WIN_XS.forEach((wx, wi) => {
      for (let i = 0; i < 5; i++) {
        blooms.push(sdf.sphere(0.075).at(wx - 0.4 + i * 0.2, WIN_Y - 0.32 + (i % 2) * 0.04, FZ + 0.22 + (i % 2) * 0.03).paint(((i + wi) % 2 ? C.red : C.yellow)));
      }
    });
    k.body('flowers', sdf.union(...blooms), { color: C.red, roughness: 0.7, detail: 0.02, maxTriangles: 500 });

    // Iron door hardware.
    const iron = sdf.union(
      sdf.box([0.7, 0.07, 0.04], 0.015).at(DOOR_X, 0.85, FZ + 0.14),
      sdf.box([0.7, 0.07, 0.04], 0.015).at(DOOR_X, 1.75, FZ + 0.14),
      sdf.torus(0.07, 0.02).rotateX(90).at(DOOR_X + 0.3, 1.25, FZ + 0.16),
    );
    k.body('iron', iron, { color: C.iron, roughness: 0.5, metalness: 0.7, detail: 0.012, maxTriangles: 400 });
  },
});
