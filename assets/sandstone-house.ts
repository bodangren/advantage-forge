import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * sandstone-house: chibi desert adobe house, 4 x 3.6 x 4 m (X by Y by Z), on y = 0, door faces +Z.
 * Role: background building in desert maps. One idea: a plastered cream cube with a scalloped
 * parapet and a teal-and-cream striped awning over a tall arched door.
 * Palette: sandstone #e6cf9f, mortar #c9ad78, teal #3f8f94, door wood #7a4a28.
 * Materials: plaster (rough, bump), wood, cloth (awning), tank (wood and iron).
 */
const CREAM = rgb('#e6cf9f');
const MORTAR = rgb('#c9ad78');
const TEAL = rgb('#3f8f94');
const WOOD = rgb('#7a4a28');
const WOOD_D = rgb('#4f2f18');
const W = 4.0;
const D = 4.0;
const WALL_H = 3.2;
const TOP = 3.6;
const FZ = D / 2;

const sstep = (a: number, b: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const archSlab = (w: number, h: number, d: number): Sdf =>
  sdf.union(
    sdf.box([w, h - w / 2, d], 0.015).at(0, (h - w / 2) / 2, 0),
    sdf.cylinder(w / 2, d, 0.015).rotateX(90).at(0, h - w / 2, 0),
  );

export default defineAsset({
  name: 'sandstone-house',
  description: 'Chibi desert adobe house: cream plaster cube, scalloped parapet, arched door under a striped awning, teal-shuttered windows, roof water tank.',
  detail: 0.03,
  texture: { size: 1024 },
  build(k) {
    // Walls: rounded cube, plinth, roof slab, parapet with scallops.
    const walls = sdf.box([W, WALL_H, D], 0.16).at(0, WALL_H / 2, 0);
    const plinth = sdf.box([W + 0.12, 0.22, D + 0.12], 0.07).at(0, 0.11, 0);
    const ring = sdf.box([W, 0.5, D], 0.12).subtract(sdf.box([W - 0.36, 1, D - 0.36])).at(0, WALL_H + 0.15, 0);
    const cutters: Sdf[] = [];
    for (let i = -2; i <= 2; i++) {
      cutters.push(sdf.box([0.4, 0.5, 6], 0.15).at(i * 0.68, TOP + 0.02, 0));
      cutters.push(sdf.box([6, 0.5, 0.4], 0.15).at(0, TOP + 0.02, i * 0.68));
    }
    const parapet = ring.subtract(...cutters);
    const body = sdf.smoothUnion(0.03, walls, plinth, parapet);
    k.body('plaster', body.paintFn((x, y, z, base) => {
      const { f1, f2 } = noise.worley(x * 3, y * 3, z * 3, 5);
      const g = sstep(0.03, 0.12, f2 - f1);
      const c = mixRgb(CREAM, MORTAR, 0.18 * noise.random(Math.floor(x * 3), Math.floor(y * 3), Math.floor(z * 3)));
      return mixRgb(c, MORTAR, y > 0.25 ? 0.35 * (1 - g) : 0.7);
    }), { color: CREAM, roughness: 0.92, detail: 0.03, maxTriangles: 18000, bump: (x: number, y: number, z: number) => 0.01 * noise.fbm(x * 8, y * 8, z * 8, 3) });

    // Door: frame, arched leaf, planks, handle.
    const door = archSlab(1.0, 2.1, 0.12).at(0, 0.02, FZ + 0.02);
    const frame = archSlab(1.3, 2.3, 0.1).at(0, 0, FZ + 0.0);
    k.body('door-frame', frame.paint(MORTAR), { roughness: 0.9 });
    k.body('door', door.paintFn((x, y, z, b) => (Math.abs(((x * 7) % 1)) < 0.06 ? WOOD_D : WOOD)), { color: WOOD, roughness: 0.8 });
    k.body('door-iron', sdf.union(
      sdf.sphere(0.04).at(0.3, 1.0, FZ + 0.1),
      sdf.box([0.8, 0.07, 0.03], 0.01).at(0, 0.5, FZ + 0.09),
      sdf.box([0.8, 0.07, 0.03], 0.01).at(0, 1.5, FZ + 0.09),
    ), { color: rgb('#3d4047'), metalness: 0.7, roughness: 0.5 });

    // Windows (front, plus one per side), shutters teal.
    const win = (x: number, y: number, z: number, ry: number) => {
      const place = (s: Sdf) => s.rotateY(ry).at(x, y, z);
      return {
        frame: place(archSlab(0.7, 0.95, 0.08)),
        glass: place(archSlab(0.5, 0.78, 0.1).at(0, 0.08, 0.02)),
        shut: place(sdf.union(
          archSlab(0.3, 0.8, 0.07).at(0.5, 0.06, 0.04),
          archSlab(0.3, 0.8, 0.07).at(-0.5, 0.06, 0.04),
        )),
      };
    };
    const ws = [win(-1.25, 1.55, FZ, 0), win(1.25, 1.55, FZ, 0), win(FZ, 1.55, 0, 90), win(-FZ, 1.55, 0, -90), win(0, 1.55, -FZ, 180)];
    k.body('win-frame', sdf.union(...ws.map((w) => w.frame)).paint(MORTAR), { roughness: 0.9 });
    k.body('glass', sdf.union(...ws.map((w) => w.glass)), { color: rgb('#243a46'), roughness: 0.2 });
    k.body('shutters', sdf.union(...ws.map((w) => w.shut)), { color: TEAL, roughness: 0.75 });

    // Striped awning over the door, slanting down and out, with scalloped skirt.
    const aw = sdf.box([1.7, 0.05, 0.9], 0.02).rotateX(-22).at(0, 2.55, FZ + 0.5);
    const skirt = sdf.union(...[-3, -2, -1, 0, 1, 2, 3].map((i) =>
      sdf.sphere(0.12).scale([1, 1, 0.3]).at(i * 0.24, 2.4 - 0.0, FZ + 0.92)));
    k.body('awning', sdf.union(aw, skirt).paintFn((x) => (Math.floor((x + 5) / 0.24) % 2 === 0 ? TEAL : rgb('#f1e6c8'))), { color: TEAL, roughness: 0.88 });
    k.body('awning-posts', sdf.union(
      sdf.capsule([-0.78, 0, FZ + 0.9], [-0.78, 2.4, FZ + 0.9], 0.035),
      sdf.capsule([0.78, 0, FZ + 0.9], [0.78, 2.4, FZ + 0.9], 0.035),
    ), { color: WOOD_D, roughness: 0.8 });

    // Roof tank on the back-left corner: barrel on a stand with a conical lid.
    const tx = 1.25, tz = -1.25;
    const tank = sdf.union(
      sdf.cylinder(0.4, 0.8, 0.08).at(tx, 3.2 + 0.4 + 0.45, tz),
      sdf.cone([tx, 4.9 - 0.2, tz], [tx, 4.65 + 0.5, tz], 0.46, 0.05).at(0, 0, 0),
    );
    k.body('tank', tank, { color: WOOD, roughness: 0.8 });
    const hoops = sdf.union(...[0.2, 0.55].map((o) => sdf.torus(0.41, 0.025).at(tx, 3.65 + o, tz)));
    k.body('tank-hoops', hoops, { color: rgb('#3d4047'), metalness: 0.7, roughness: 0.5 });
    const legs = sdf.union(...([[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]).map(([a, b]) =>
      sdf.capsule([tx + a * 0.28, 3.2, tz + b * 0.28], [tx + a * 0.28, 3.7, tz + b * 0.28], 0.04)));
    k.body('tank-legs', legs, { color: WOOD_D, roughness: 0.8 });
  },
});
