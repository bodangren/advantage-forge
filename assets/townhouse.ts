import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - townhouse (catalog `architecture/structure/townhouse`).
 * Role: village home, seen small; static, no rig. Size 3 x 4 x 6 m, on y = 0, door facing +Z.
 * One idea: a narrow jettied half-timber house under a steep roof of fat terracotta tiles.
 * Shape language: square (frame), round secondary (tiles, arched door, shrubs).
 * Palette: plaster #f0e2a8 / #e2d090, timber #8a5a35, walnut #6b4226, tile #d9764a / #b45a36,
 *   straw #e0bb60, leaf #5cb85c, brick #c0503a.
 * Materials: plaster, timber, walnut door, tile, chimney, glass, brick, pots, leaves.
 */
const C = {
  plaster: rgb('#f0e2a8'), shade: rgb('#e2d090'), brown: rgb('#8a5a35'), walnut: rgb('#6b4226'),
  tile: rgb('#d9764a'), tileDark: rgb('#b45a36'), straw: rgb('#e0bb60'), leaf: rgb('#5cb85c'),
  brick: rgb('#c0503a'), glass: rgb('#3a4a5a'),
};
const DEG = 180 / Math.PI;
type S = ReturnType<typeof sdf.box>;

// Beam between two points in the XY plane (front) at depth z.
const barXY = (x1: number, y1: number, x2: number, y2: number, z: number, w = 0.16, d = 0.1): S =>
  sdf.box([Math.hypot(x2 - x1, y2 - y1), w, d], 0.035)
    .rotateZ(Math.atan2(y2 - y1, x2 - x1) * DEG).at((x1 + x2) / 2, (y1 + y2) / 2, z);
// Beam between two points in the ZY plane (side) at x.
const barZY = (z1: number, y1: number, z2: number, y2: number, x: number, w = 0.16, d = 0.1): S =>
  sdf.box([d, w, Math.hypot(z2 - z1, y2 - y1)], 0.035)
    .rotateX(-Math.atan2(y2 - y1, z2 - z1) * DEG).at(x, (y1 + y2) / 2, (z1 + z2) / 2);

const GZ = 1.8, GX = 1.4; // ground floor half depth / half width
const UZ = 2.1, UX = 1.7; // upper floor half depth / half width
const UY = 4.55; // upper window height

export default defineAsset({
  name: 'townhouse',
  description: 'Chibi townhouse: cream plaster ground floor, jettied half-timber upper floor, steep fat terracotta tile roof, arched door, chimney, potted shrubs.',
  detail: 0.014,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/townhouse-mock.jpg',

  build(k) {
    // Plaster walls.
    const ground = sdf.box([2.8, 2.6, 3.6], 0.05).at(0, 1.3, 0);
    const upper = sdf.box([3.4, 2.4, 4.2], 0.05).at(0, 4.0, 0);
    const gable = sdf.extrude(profile.polygon([[-1.65, 5.0], [1.65, 5.0], [0, 5.9]]), 4.1, 0.03);
    const shadeFn = (x: number, y: number, z: number, b: ReturnType<typeof rgb>) =>
      mixRgb(b, C.shade, Math.max(0, Math.min(1, (0.8 - y) / 0.8)) * 0.6 + 0.12 * (0.5 + 0.5 * noise.fbm(x * 3, y * 3, z * 3, 2)));
    k.body('plaster', sdf.union(ground, upper, gable).paintFn(shadeFn), {
      color: C.plaster, roughness: 0.95, detail: 0.014, maxTriangles: 1200,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 6, y * 6, z * 6, 2),
    });

    // Timber: ground posts, sill, jetty beam, corbels, studs, braces, plates.
    const posts = sdf.union(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) =>
      sdf.box([0.18, 2.6, 0.18], 0.04).at(sx * (GX - 0.01), 1.3, sz * (GZ - 0.01)))));
    const sill = sdf.box([2.86, 0.18, 3.66], 0.04).at(0, 0.09, 0);
    const jetty = sdf.box([3.44, 0.22, 4.24], 0.05).at(0, 2.7, 0);
    const corbels = sdf.union(...[-1.55, -0.8, 0.8, 1.55].map((x) => sdf.box([0.24, 0.26, 0.3], 0.04).at(x, 2.5, GZ + 0.05)));
    const frontFrame = (): S => sdf.union(
      ...[-UX + 0.05, 0, UX - 0.05].map((x) => sdf.box([0.16, 2.4, 0.1], 0.035).at(x, 4.0, UZ + 0.02)),
      barXY(-UX + 0.05, 3.95, 0, 3.0, UZ + 0.03), barXY(0, 3.0, UX - 0.05, 3.95, UZ + 0.03),
      sdf.box([3.44, 0.16, 0.1], 0.035).at(0, 5.12, UZ + 0.02),
      sdf.box([0.14, 0.9, 0.08], 0.03).at(0, 5.45, UZ - 0.05),
    );
    const sideFrame = (sx: number): S => sdf.union(
      ...[-1, 1].map((sz) => sdf.box([0.1, 2.4, 0.16], 0.035).at(sx * (UX + 0.02), 4.0, sz * (UZ - 0.05))),
      barZY(-1.95, 4.0, 1.95, 2.95, sx * (UX + 0.03)), barZY(-1.95, 2.95, 1.95, 4.0, sx * (UX + 0.03)),
      sdf.box([0.1, 0.16, 4.24], 0.035).at(sx * (UX + 0.02), 5.12, 0),
    );
    const upperFrame = sdf.union(frontFrame(), frontFrame().rotateY(180), sideFrame(1), sideFrame(-1));
    // Window frames and shutters.
    const winFrame = (): S => sdf.union(
      sdf.box([0.86, 0.76, 0.08], 0.03).subtract(sdf.box([0.7, 0.6, 0.5])),
      sdf.box([0.05, 0.62, 0.05], 0.015), sdf.box([0.72, 0.05, 0.05], 0.015),
    );
    const shutterPair = (): S => sdf.union(...[-1, 1].map((s) => sdf.box([0.22, 0.62, 0.05], 0.025).at(s * 0.54, 0, 0)));
    const win = (): S => sdf.union(winFrame(), shutterPair());
    const winFront = (x: number, y: number, zf: number): S => win().at(x, y, zf);
    const winSide = (sx: number, y: number, xf: number): S => win().rotateY(sx * 90).at(sx * xf, y, 0);
    const wins = sdf.union(
      winFront(-0.75, UY, UZ), winFront(0.75, UY, UZ),
      winSide(1, UY, UX), winSide(-1, UY, UX), winSide(1, 1.4, GX), winSide(-1, 1.4, GX),
    );
    k.body('timber', sdf.union(posts, sill, jetty, corbels, upperFrame, wins), {
      color: C.brown, roughness: 0.85, detail: 0.012, maxTriangles: 1800,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 5, y * 18, z * 5, 2),
    });
    const glassOne = (): S => sdf.box([0.7, 0.6, 0.04]);
    k.body('glass', sdf.union(
      glassOne().at(-0.75, UY, UZ - 0.01), glassOne().at(0.75, UY, UZ - 0.01),
      ...[1, -1].flatMap((sx) => [glassOne().rotateY(sx * 90).at(sx * (UX - 0.01), UY, 0), glassOne().rotateY(sx * 90).at(sx * (GX - 0.01), 1.4, 0)]),
    ), { color: C.glass, roughness: 0.25, detail: 0.01, maxTriangles: 150 });

    // Arched plank door with frame.
    const doorP = (w: number, h: number) => profile.polygon([[-w, 0], [w, 0], [w, h - w], [w * 0.7, h - w * 0.3], [0, h], [-w * 0.7, h - w * 0.3], [-w, h - w]]);
    const door = sdf.extrude(doorP(0.5, 1.8), 0.14, 0.03).at(0, 0.18, GZ + 0.02);
    k.body('door', door.paintFn((x, y, _z, b) => {
      const g = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * ((x + 0.5) / 0.25)), 8);
      const rail = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * ((y - 0.18) / 0.6)), 14);
      return mixRgb(b, rgb('#3e2414'), 0.85 * Math.max(g, rail * 0.6));
    }), { color: C.walnut, roughness: 0.85, detail: 0.01, maxTriangles: 500 });
    const frame = sdf.extrude(doorP(0.66, 1.98), 0.12, 0.04).subtract(sdf.extrude(doorP(0.5, 1.8), 0.6)).at(0, 0.18, GZ + 0.02);
    const step = sdf.box([1.5, 0.12, 0.5], 0.04).at(0, 0.06, GZ + 0.3);
    k.body('doorframe', sdf.union(frame, step), { color: C.brown, roughness: 0.85, detail: 0.01, maxTriangles: 500 });

    // Roof: thin slab plus staggered fat tiles.
    const RISE = 1.1, HALF = 1.95, EY = 4.9, RY = 6.0;
    const a = Math.atan2(RISE, HALF), sa = Math.sin(a), ca = Math.cos(a);
    const slab = sdf.extrude(profile.polygon([[-HALF, EY], [0, RY], [HALF, EY], [HALF, EY - 0.14], [0, RY - 0.14], [-HALF, EY - 0.14]]), 4.8, 0.02);
    const tiles: S[] = [];
    for (let row = 0; row < 4; row++) {
      const s = 0.3 + row * 0.57;
      const lx = s * ca, ly = RY - s * sa;
      const zs: [number, number][] = row % 2 === 0
        ? [-3, -2, -1, 0, 1, 2, 3].map((j): [number, number] => [j * 0.7, 0.68])
        : [...[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((j): [number, number] => [j * 0.7, 0.68]), [-2.27, 0.4], [2.27, 0.4]];
      for (const [z, w] of zs) {
        const t = sdf.box([0.62, 0.1, w], 0.04);
        for (const sx of [1, -1]) {
          tiles.push(t.rotateZ(-sx * a * DEG).at(sx * (lx + sa * 0.05), ly + ca * 0.05, z));
        }
      }
    }
    const ridge = sdf.capsule([0, RY + 0.06, -2.5], [0, RY + 0.06, 2.5], 0.13);
    const diamond = sdf.box([0.16, 0.16, 0.04], 0.015).rotateZ(45).at(0, 1.2, GZ + 0.16);
    k.body('tiles', sdf.union(slab, ridge, ...tiles, diamond).paintFn((x, y, z, b) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
      return mixRgb(b, C.tileDark, 0.35 * n + (y < 1.5 ? 0 : 0.0));
    }), { color: C.tile, roughness: 0.8, detail: 0.012, maxTriangles: 2200 });

    // Chimney on the right (+x) slope, near the back.
    const cy = RY - (0.85 / HALF) * RISE;
    k.body('chimney', sdf.union(
      sdf.box([0.5, 1.1, 0.5], 0.05).at(0.85, cy + 0.4, -0.6),
      sdf.box([0.62, 0.14, 0.62], 0.04).at(0.85, cy + 1.0, -0.6),
    ).paintFn((x, y, z, b) => mixRgb(b, rgb('#a8863a'), y > cy + 0.92 ? 0.7 : 0)), { color: C.straw, roughness: 0.85, detail: 0.012, maxTriangles: 300 });

    // Bricks at the left (-x) front corner.
    k.body('bricks', sdf.union(...[0, 1, 2].map((i) =>
      sdf.box([0.62, 0.13, 0.5], 0.04).at(-1.6 + (i % 2) * 0.05, 0.07 + i * 0.14, GZ + 0.22))), {
      color: C.brick, roughness: 0.85, detail: 0.012, maxTriangles: 200,
    });

    // Shrubs in pots.
    const px = [-1.02, 1.02];
    k.body('pots', sdf.union(...px.map((x) => sdf.cone([x, 0, GZ + 0.35], [x, 0.3, GZ + 0.35], 0.14, 0.2, ).smoothUnion(0.02, sdf.cylinder(0.21, 0.05, 0.02).at(x, 0.3, GZ + 0.35)))), {
      color: C.brown, roughness: 0.85, detail: 0.01, maxTriangles: 250,
    });
    k.body('shrubs', sdf.union(...px.map((x) => sdf.smoothUnion(0.05,
      sdf.sphere(0.24).at(x, 0.58, GZ + 0.35), sdf.cone([x, 0.6, GZ + 0.35], [x, 1.05, GZ + 0.35], 0.2, 0.02)))), {
      color: C.leaf, roughness: 0.8, detail: 0.012, maxTriangles: 300,
    });
  },
});
