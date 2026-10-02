import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/structure/city-wall: 4 m wall section, 3 m tall, 0.8 m thick.
 * Role: modular background wall for town scenes; joins at flat ends x = +-2.
 * One idea: chunky pillowy cream blocks under a crenellated parapet, with a stone stair behind.
 * Shape language: square, sturdy, soft 6 cm bevels. Palette: cream #c9bda2, tan #b5a37f,
 * grey #a39a8c, mortar #6f6759. Materials: stone (blocks, walkway, parapet), core mortar, stair.
 */
const CREAM = rgb('#d6d0c4');
const TAN = rgb('#c9bda2');
const GREY = rgb('#c8c2b6');
const LIGHT = rgb('#e0dbd0');
const MORTAR = rgb('#8e887c');
const GAP = 0.03;
const COURSES: number[][] = [
  [1.3, 1.4, 1.3],
  [0.9, 1.2, 1.0, 0.9],
  [1.4, 1.2, 1.4],
];
interface B { x0: number; x1: number; y0: number; y1: number; id: number; r: number; d: number }
const BLOCKS: B[] = [];
COURSES.forEach((ws, row) => {
  let lo = -2;
  ws.forEach((w, i) => {
    BLOCKS.push({ x0: lo + GAP / 2, x1: lo + w - GAP / 2, y0: row * 0.8 + GAP / 2, y1: row * 0.8 + 0.8 - GAP / 2 + -0.05 * noise.random(row * 10 + i, 1, 4), id: row * 10 + i, r: 0.06 + 0.04 * noise.random(row * 10 + i, 2, 5), d: 0.7 + 2 * (0.04 + 0.04 * noise.random(row * 10 + i, 3, 6)) });
    lo += w;
  });
});
const blockAt = (x: number, y: number): B | null => BLOCKS.find((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) ?? null;

function blockPaint(x: number, y: number, z: number): Rgb {
  const b = blockAt(x, y);
  if (!b) return MORTAR;
  const t = noise.random(b.id, 3, 9);
  const tone = noise.random(b.id, 3, 9);
  let c = tone < 0.5 ? mixRgb(GREY, CREAM, tone * 2) : mixRgb(CREAM, LIGHT, (tone - 0.5) * 2);
  if (b.y0 < 0.1) c = mixRgb(c, TAN, 0.15);
  return c;
}

export default defineAsset({
  name: 'city-wall',
  description: 'City wall section: three courses of chunky cream blocks, crenellated parapet, walkway and a back stair. 4 m long.',
  reference: 'bench/overnight/refs/p1-village/city-wall-mock.jpg',
  detail: 0.012,
  texture: { size: 1024 },
  build(k) {
    const core = sdf.box([4.0, 2.4, 0.7]).at(0, 1.2, 0);
    k.body('core', core.paint(MORTAR), { color: MORTAR, roughness: 0.95, detail: 0.012 });

    const blocks = sdf.union(
      ...BLOCKS.map((b) => sdf.box([b.x1 - b.x0, b.y1 - b.y0, b.d], b.r).at((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 0)),
    );
    const cut = sdf.intersect(blocks, sdf.box([4.0, 2.6, 1.0]).at(0, 1.3, 0));
    k.body('blocks', cut.paintFn((x, y, z) => blockPaint(x, y, z)), {
      color: CREAM, roughness: 0.9, detail: 0.012, maxTriangles: 2400, bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 30, z * 30, 3),
    });

    const slab = sdf.box([4.0, 0.1, 0.8], 0.03).at(0, 2.35, 0);
    let rail: Sdf = sdf.box([4.0, 0.8, 0.35], 0.06).at(0, 2.7, 0.225);
    for (let i = 0; i < 4; i++) rail = rail.subtract(sdf.box([0.45, 0.35, 0.6], 0.03).at(-1.335 + i * 0.89, 3.1, 0.225));
    const top = sdf.smoothUnion(0.02, slab, rail);
    k.body('parapet', top.paintFn((x, y, z) => mixRgb(CREAM, GREY, 0.5 * Math.max(0, noise.fbm(x * 4, y * 4, z * 4, 2)) + (y < 2.42 ? 0.3 : 0))), {
      color: CREAM, roughness: 0.9, detail: 0.01, maxTriangles: 1900, bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 30, z * 30, 3),
    });

    const steps: Sdf[] = [];
    const W = [0.9, 0.8, 0.9, 0.75, 0.9];
    const DX = [0, 0.05, -0.03, 0.06, 0];
    for (let i = 0; i < 5; i++) {
      const top = 0.48 * (i + 1);
      steps.push(sdf.box([W[i]!, top, 0.45], 0.06).at(-1.4 + DX[i]!, top / 2, -0.575 - 0.4 * (4 - i)));
    }
    k.body('stair', sdf.union(...steps).paintFn((x, y, z) => mixRgb(TAN, CREAM, 0.3 * noise.random(Math.floor(y / 0.6), 1, 2) + 0.1)), {
      color: TAN, roughness: 0.9, detail: 0.01, maxTriangles: 1000, bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 30, z * 30, 3),
    });
  },
});
