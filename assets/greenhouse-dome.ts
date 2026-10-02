import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Design note - greenhouse-dome (architecture/structure/greenhouse-dome).
 * Role: cozy village garden building, small in 3/4 view; no rig.
 * Size: 3 m wide, 3 m tall, on y = 0, door toward +Z.
 * One idea: a chunky white ribbed dome of tinted glass on a round sand base, plants glowing inside.
 * Shape language: round with soft bevels. Palette: frame #f2f0ea, glass #bfe8e0, sand #e6d5a8, leaf #5cb85c, terracotta #c8674a.
 * Materials: base, slabs, frame, glass, pots, plants, fruit.
 */
const C = {
  frame: rgb('#f2f0ea'), sand: rgb('#e6d5a8'), slab: rgb('#c9bda2'), glass: rgb('#bfe8e0'),
  leaf: rgb('#5cb85c'), leafDark: rgb('#3d8a3d'), pot: rgb('#c8674a'), red: rgb('#c8423a'), yellow: rgb('#e0bb60'),
};
const R = 1.4;
const Y0 = 0.2;
const YW = 1.7;
const DOOR_W = 0.9;
const DOOR_TOP = 1.6;
const ARCH_Y = DOOR_TOP - DOOR_W / 2;

export default defineAsset({
  name: 'greenhouse-dome',
  description: 'Chibi domed greenhouse: white ribbed frame, tinted glass, round sand base with stone path, open arched door, potted plants inside.',
  detail: 0.012,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/greenhouse-dome-mock.jpg',

  build(k) {
    k.body('base', sdf.cylinder(1.7, 0.2, 0.06).at(0, 0.1, 0), { color: C.sand, roughness: 0.9, detail: 0.01, maxTriangles: 500 });
    const slabs = sdf.union(
      sdf.box([0.5, 0.05, 0.36], 0.02).rotateY(8).at(-0.4, 0.215, 1.6),
      sdf.box([0.5, 0.05, 0.36], 0.02).rotateY(-6).at(0.15, 0.215, 1.62),
      sdf.box([0.5, 0.05, 0.36], 0.02).rotateY(4).at(0.65, 0.215, 1.5),
    );
    k.body('slabs', slabs, { color: C.slab, roughness: 0.9, detail: 0.01, maxTriangles: 400 });

    // Frame
    const parts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      parts.push(sdf.capsule([Math.sin(a) * R, Y0, Math.cos(a) * R], [Math.sin(a) * R, YW, Math.cos(a) * R], 0.05));
    }
    for (const y of [0.9, YW]) parts.push(sdf.torus(R, 0.045).at(0, y, 0));
    parts.push(sdf.torus(R, 0.045).at(0, Y0+ 0.03, 0));
    const up = sdf.box([3.4, 1.6, 0.3]).at(0, YW + 0.8, 0);
    for (let i = 0; i < 4; i++) {
      parts.push(sdf.torus(R, 0.045).rotateX(90).scale([1, 1.3 / 1.4, 1]).at(0, YW, 0)
        .intersect(sdf.box([3.4, 1.6, 0.3]).at(0, YW + 0.8, 0)).rotateY(i * 45));
    }
    void up;
    parts.push(sdf.torus(1.05, 0.045).at(0, 2.4, 0));
    parts.push(sdf.sphere(0.1).at(0, 3.0, 0));
    // door frame
    const dz = R + 0.03;
    for (const sx of [-1, 1]) parts.push(sdf.capsule([sx * DOOR_W / 2, Y0, dz], [sx * DOOR_W / 2, ARCH_Y, dz], 0.055));
    parts.push(sdf.torus(DOOR_W / 2, 0.05).rotateX(90).at(0, ARCH_Y, dz).intersect(sdf.box([1.2, 0.6, 0.3]).at(0, ARCH_Y + 0.3, dz)));
    parts.push(sdf.capsule([-0.7, 0.9, dz], [0.7, 0.9, dz], 0.04).subtract(sdf.box([DOOR_W - 0.1, 0.3, 0.4]).at(0, 0.9, dz)));
    k.body('frame', sdf.smoothUnion(0.02, ...parts), { color: C.frame, roughness: 0.5, metalness: 0.3, detail: 0.012, maxTriangles: 2600 });

    // Glass
    const door = sdf.union(
      sdf.box([DOOR_W - 0.06, ARCH_Y - Y0, 0.6]).at(0, (ARCH_Y + Y0) / 2, R),
      sdf.cylinder(DOOR_W / 2 - 0.03, 0.6).rotateX(90).at(0, ARCH_Y, R),
    );
    const wall = sdf.cylinder(1.38, YW - Y0).at(0, (YW + Y0) / 2, 0);
    const wallShell = wall.subtract(sdf.cylinder(1.35, YW - Y0 + 0.1).at(0, (YW + Y0) / 2, 0)).subtract(door);
    const dome = sdf.ellipsoid([1.38, 1.28, 1.38]).at(0, YW, 0)
      .intersect(sdf.box([3.2, 1.5, 3.2]).at(0, YW + 0.75, 0)).shell(0.03);
    k.body('glass', sdf.union(wallShell, dome), { color: C.glass, roughness: 0.08, opacity: 0.35, detail: 0.014, maxTriangles: 1200, maxError: 0.02 });

    // Plants
    const spots: [number, number, number][] = [
      [-0.6, 0.5, 1], [0.6, 0.55, 2], [-0.9, -0.3, 3], [0.9, -0.2, 4], [-0.3, -0.85, 5], [0.35, -0.8, 6],
    ];
    k.body('pots', sdf.union(...spots.map(([x, z]) => sdf.cylinder(0.2, 0.28, 0.04).at(x, 0.2 + 0.14, z)),
      sdf.cylinder(0.14, 0.2, 0.03).at(-0.95, 0.3, 1.85), sdf.cylinder(0.14, 0.2, 0.03).at(0.95, 0.3, 1.85)),
      { color: C.pot, roughness: 0.85, detail: 0.01, maxTriangles: 700 });
    const cluster = (x: number, z: number, s: number, big = 1) => {
      const balls = [];
      const n = 3 + (s % 2);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + s;
        balls.push(sdf.sphere((0.16 + 0.03 * ((i + s) % 4)) * big).at(x + Math.cos(a) * 0.1, 0.6 + 0.1 * i * big, z + Math.sin(a) * 0.1));
      }
      return sdf.smoothUnion(0.05, ...balls);
    };
    const bush = (x: number, z: number) => sdf.ellipsoid([0.2, 0.14, 0.17]).at(x, 0.3, z);
    const plants = sdf.union(
      ...spots.map(([x, z, s]) => cluster(x, z, s, s === 5 || s === 6 ? 1.3 : 1)),
      bush(-1.3, 1.65), bush(1.3, 1.6), bush(-1.05, 1.85).scale(0.8), bush(1.05, 1.85).scale(0.7).at(0, 0.02, 0),
    );
    k.body('plants', plants.paintFn((x, y, z, base) => mixRgb(base, C.leafDark, Math.max(0, Math.min(1, (0.9 - y) / 0.6)) * 0.6)),
      { color: C.leaf, roughness: 0.8, detail: 0.008, maxTriangles: 1300 });
    const fruit = [[-0.6, 0.85, 0.72], [0.62, 0.8, 0.7], [-0.88, 0.75, -0.15], [0.35, 0.9, -0.68]] as const;
    k.body('fruit', sdf.union(...fruit.map(([x, y, z]) => sdf.sphere(0.05).at(x, y, z))),
      { color: C.red, roughness: 0.6, detail: 0.008, maxTriangles: 300 });
    k.body('fruit2', sdf.union(sdf.sphere(0.05).at(0.85, 0.82, -0.05), sdf.sphere(0.05).at(-0.3, 0.9, -0.75)),
      { color: C.yellow, roughness: 0.6, detail: 0.008, maxTriangles: 200 });
  },
});
