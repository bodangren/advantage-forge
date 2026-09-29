import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - watermill (catalog `architecture/structure/watermill`).
 * Role: village landmark, seen small. Static. 4 m wide (X), 5 m tall, on y = 0, front +Z.
 * One idea: a chunky stone-and-timber mill under fat terracotta tiles with a big wooden wheel
 * on the +X side, framed by a straw-yellow arch, standing beside a puddle of water.
 * Shape language: round, chunky, clay-like. Palette: stone #c9bda2/#b5a37f/#a39a8c, mortar #6f6759,
 * timber #8a5a35/#6b4226, tile #d9764a/#b45a36, straw #e0bb60, water #3fa8c8, grass #7ec850.
 * Materials: walls, blocks, timber, tiles, roof base, chimney, wheel, chute, door frame, door, arch, pad, water, rocks.
 */
const C = {
  cream: rgb('#c9bda2'), tan: rgb('#b5a37f'), grey: rgb('#a39a8c'), mortar: rgb('#6f6759'),
  brown: rgb('#8a5a35'), walnut: rgb('#6b4226'), tile: rgb('#d9764a'), tileDark: rgb('#b45a36'),
  straw: rgb('#e0bb60'), water: rgb('#3fa8c8'), grass: rgb('#7ec850'), rock: rgb('#8a94a0'),
  dark: rgb('#2a1f18'),
};
const HX = -0.6; // house center x
const FZ = 1.2; // front wall plane
const WCX = 1.15; // wheel x
const WCY = 1.38; // wheel center y
const DEG = Math.PI / 180;
type S = ReturnType<typeof sdf.box>;

const archProfile = (w: number, h: number) => {
  const pts: [number, number][] = [[-w / 2, 0], [w / 2, 0]];
  const cy = h - w / 2;
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI;
    pts.push([(w / 2) * Math.cos(a), cy + (w / 2) * Math.sin(a)]);
  }
  return profile.polygon(pts, { smooth: false });
};

export default defineAsset({
  name: 'watermill',
  description: 'Chibi watermill: stone and timber mill house, terracotta tile roof, big wooden wheel with a straw arch, chute, steps, and a water patch.',
  detail: 0.014,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/watermill-mock.jpg',

  build(k) {
    // Walls: mortar below, plaster above.
    const walls = sdf.box([2.4, 3.2, 2.4], 0.06).at(HX, 1.7, 0);
    k.body('walls', walls.paintFn((x, y, z) => (y < 1.75 ? C.mortar : mixRgb(C.cream, C.tan, 0.25 * (0.5 + 0.5 * noise.fbm(x * 3, y * 3, z * 3, 2))))),
      { color: C.cream, roughness: 0.9, detail: 0.014, maxTriangles: 400 });

    // Stone blocks on the lower half.
    const blocks: S[] = [];
    const cols = [C.cream, C.tan, C.grey];
    let n = 0;
    const put = (s: S) => { blocks.push(s.paint(cols[(n * 7 + (n >> 2)) % 3]!) as S); n++; };
    const courses = [0.4, 0.86, 1.32];
    for (const [ci, y] of courses.entries()) {
      const off = ci % 2 ? 0.1 : 0;
      put(sdf.box([0.42, 0.4, 0.15], 0.05).at(-1.58 + off * 0.5, y, FZ));
      put(sdf.box([0.42, 0.4, 0.15], 0.05).at(0.39 - off * 0.5, y, FZ));
      for (let i = 0; i < 4; i++) put(sdf.box([0.56, 0.4, 0.15], 0.05).at(-1.5 + i * 0.6 + off * 0.3, y, -FZ));
      for (let i = 0; i < 4; i++) {
        put(sdf.box([0.15, 0.4, 0.56], 0.05).at(-1.8, y, -0.9 + i * 0.6 + off * 0.3));
        put(sdf.box([0.15, 0.4, 0.56], 0.05).at(0.6, y, -0.9 + i * 0.6 + off * 0.3));
      }
    }
    [1, 2, 3].forEach((i) => put(sdf.box([1.5, 0.1 * (4 - i), 0.32], 0.04).at(HX, 0.12 + 0.05 * (4 - i), FZ + 0.25 + i * 0.3)));
    k.body('blocks', sdf.union(...blocks), { color: C.cream, roughness: 0.9, detail: 0.014, maxTriangles: 1500,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 8, y * 8, z * 8, 2) });

    // Timber frame.
    const t: S[] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) t.push(sdf.box([0.22, 3.1, 0.22], 0.05).at(HX + sx * 1.2, 1.67, sz * FZ));
    for (const sz of [-1, 1]) {
      t.push(sdf.box([2.5, 0.18, 0.12], 0.04).at(HX, 2.4, sz * (FZ + 0.02)));
      t.push(sdf.box([2.5, 0.2, 0.13], 0.04).at(HX, 3.14, sz * (FZ + 0.02)));
    }
    for (const sx of [-1, 1]) {
      t.push(sdf.box([0.12, 0.18, 2.5], 0.04).at(HX + sx * 1.22, 2.4, 0));
      t.push(sdf.box([0.13, 0.2, 2.5], 0.04).at(HX + sx * 1.22, 3.14, 0));
    }
    const brace = (a: [number, number, number], b: [number, number, number]) => sdf.capsule(a, b, 0.075) as unknown as S;
    for (const sz of [-1, 1]) {
      t.push(brace([-1.65, 1.8, sz * (FZ + 0.03)], [-1.1, 2.35, sz * (FZ + 0.03)]));
      t.push(brace([0.45, 1.8, sz * (FZ + 0.03)], [-0.1, 2.35, sz * (FZ + 0.03)]));
    }
    k.body('timber', sdf.union(...t), { color: C.brown, roughness: 0.85, detail: 0.014, maxTriangles: 800,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 6, y * 18, z * 6, 2) });

    // Roof base and tiles.
    const roofBase = sdf.extrude(profile.polygon([[-1.5, 3.1], [0, 4.5], [1.5, 3.1]], { smooth: false }), 3.0, 0.03).rotateY(90).at(HX, 0, 0);
    k.body('roof-base', roofBase, { color: C.tileDark, roughness: 0.8, detail: 0.014, maxTriangles: 300 });
    const th = Math.atan2(1.4, 1.5) / DEG;
    const tiles: S[] = [];
    for (const s of [-1, 1]) for (let j = 0; j < 3; j++) {
      const d = 0.35 + j * 0.62;
      const y = 4.5 - d * Math.sin(th * DEG) + 0.05 * Math.cos(th * DEG) + 0.02;
      const zz = s * (d * Math.cos(th * DEG) + 0.05 * Math.sin(th * DEG));
      for (let i = 0; i < 4; i++) {
        tiles.push(sdf.box([0.8, 0.08, 0.66], 0.03).rotateX(s * th).at(HX + (i - 1.5) * 0.78, y + 0.02 * ((i + j) % 2), zz).paint(mixRgb(C.tile, C.tileDark, ((i * 3 + j * 5 + (s > 0 ? 1 : 0)) % 4) * 0.12)) as S);
      }
    }
    const ridgeCap = sdf.capsule([-2.15, 4.56, 0], [0.95, 4.56, 0], 0.17);
    const eaveBoards = sdf.union(...[-1, 1].map((s) => sdf.box([3.0, 0.1, 0.16], 0.04).at(HX, 3.12, s * 1.48)));
    k.body('tiles', sdf.union(...tiles, ridgeCap, eaveBoards),
    { color: C.tile, roughness: 0.8, detail: 0.012, maxTriangles: 1100, maxError: 0.02 });

    // Chimney.
    k.body('chimney', sdf.union(sdf.box([0.5, 1.6, 0.5], 0.05).at(-1.4, 4.2, -0.7), sdf.box([0.6, 0.12, 0.6], 0.04).at(-1.4, 4.98, -0.7)).paint(C.cream),
      { color: C.cream, roughness: 0.9, detail: 0.014, maxTriangles: 300 });

    // Door: arch frame + dark opening.
    const outer = sdf.extrude(archProfile(1.5, 2.2), 0.22, 0.05).at(HX, 0.12, FZ + 0.06);
    const inner = sdf.extrude(archProfile(1.0, 1.9), 0.8).at(HX, 0.12, FZ + 0.06);
    k.body('door-frame', outer.subtract(inner), { color: C.straw, roughness: 0.8, detail: 0.01, maxTriangles: 300 });
    k.body('door', sdf.extrude(archProfile(1.0, 1.9), 0.1).at(HX, 0.12, FZ - 0.03), { color: C.dark, roughness: 0.9, detail: 0.012, maxTriangles: 200 });

    // Wheel.
    const rim = (dx: number) => sdf.torus(1.2, 0.1).rotateZ(90).at(WCX + dx, WCY, 0).paint(C.brown) as unknown as S;
    const parts: S[] = [rim(-0.2), rim(0.2)];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 360 + 11;
      parts.push(sdf.box([0.45, 0.18, 0.42], 0.03).rotateX(a).at(WCX, WCY + 1.2 * Math.cos(a * DEG), 1.2 * Math.sin(a * DEG)));
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 360;
      for (const dx of [-0.13, 0.13]) parts.push(sdf.box([0.12, 1.05, 0.12], 0.03).rotateX(a).at(WCX + dx, WCY + 0.72 * Math.cos(a * DEG), 0.72 * Math.sin(a * DEG)));
    }
    parts.push(sdf.cylinder(0.25, 0.5, 0.05).rotateZ(90).at(WCX, WCY, 0).paint(C.brown) as unknown as S);
    parts.push(sdf.capsule([0.5, WCY, 0], [WCX + 0.3, WCY, 0], 0.1) as unknown as S);
    k.body('wheel', sdf.union(...parts), { color: C.walnut, roughness: 0.85, detail: 0.012, maxTriangles: 1500,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 6, y * 6, z * 12, 2) });

    // Straw bracket arch beside the wheel.
    k.body('arch', sdf.extrude(profile.arc(1.15, 0.32, 0, 180), 0.24, 0.05).rotateY(90).at(1.75, 0.12, 0),
      { color: C.straw, roughness: 0.8, detail: 0.012, maxTriangles: 400 });

    // Chute.
    const trough = sdf.box([1.6, 0.25, 0.4], 0.04).subtract(sdf.box([1.7, 0.2, 0.28]).at(0, 0.06, 0)).rotateZ(-20).at(1.1, 3.1, 0);
    const post = sdf.capsule([1.9, 0.12, 0], [1.9, 2.75, 0], 0.08) as unknown as S;
    k.body('chute', sdf.union(trough, post), { color: C.brown, roughness: 0.85, detail: 0.01, maxTriangles: 300 });

    // Round window above the wheel.
    k.body('window-ring', sdf.torus(0.29, 0.06).rotateX(90).at(0.1, 2.77, FZ + 0.02), { color: C.brown, roughness: 0.85, detail: 0.01, maxTriangles: 300 });
    k.body('window', sdf.cylinder(0.26, 0.1).rotateX(90).at(0.1, 2.77, FZ - 0.01), { color: C.dark, roughness: 0.9, detail: 0.01, maxTriangles: 100 });

    // Pad, water, rocks.
    k.body('pad', sdf.extrude(profile.rect([4.4, 3.4], 0.5), 0.12, 0.04).rotateX(90).at(0.1, 0.06, 0).paintFn((x, y, z, b) => mixRgb(b, rgb('#5fae3c'), 0.4 * (0.5 + 0.5 * noise.fbm(x * 3, 0, z * 3, 2)))),
      { color: C.grass, roughness: 0.9, detail: 0.014, maxTriangles: 300 });
    k.body('water', sdf.extrude(profile.rect([2.2, 2.4], 0.5), 0.06, 0.02).rotateX(90).at(WCX + 0.1, 0.11, 0.1), { color: C.water, roughness: 0.2, detail: 0.014, maxTriangles: 200 });
    const rocks = [[0.55, 1.5, 0.22], [1.0, 1.35, 0.18], [2.0, 1.2, 0.2], [2.1, -0.5, 0.17], [0.4, -0.3, 0.16], [-1.9, 1.45, 0.2]]
      .map(([x, z, r], i) => sdf.ellipsoid([r!, r! * 0.8, r! * 1.1]).at(x!, 0.12 + r! * 0.5, z!).rotateY(i * 40));
    k.body('rocks', sdf.union(...rocks), { color: C.rock, roughness: 0.9, detail: 0.012, maxTriangles: 400 });
  },
});
