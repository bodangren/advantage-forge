import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Chibi city wall gate, 4 m wide, 4 m to the merlon tips (catalog `architecture/structure/wall-gate`).
 *
 * Role: village wall entrance on the hamlet map; must read at 128 px. No rig, no clips.
 * Size: 4.0 m wide (X), 1.0 m deep (Z), wall body to 3.5 m + parapet and merlons to ~4.2 m.
 *   Stands on y = 0, centred on the Y axis, front and arch face +Z.
 * One idea: a chunky sandstone gatehouse whose round arch shows a half-raised spiked iron
 *   portcullis, crowned with fat rounded merlons and flanked by two leaf-green banners.
 * Shape language: square/sturdy mass (safe walls) with one big round arch (welcome opening).
 * Palette: sandstone #b5a98f with dark #8a7d68 and mortar #d9cfba; wood honey oak #b5814a and
 *   warm brown #8a5a35; iron #363a3f / #4a4f55; banner leaf green #5cb85c with straw #e0bb60
 *   and burlap #c8a86b trim; dark tunnel #241a12.
 * Materials: stone wall + footing + parapet (0.9), pale stone arch trim (0.85), iron
 *   portcullis (0.5 / metal 0.7), wood banner poles (0.8), cloth banners (0.9), void recess (0.9).
 * Detail list: (1) stone mass with arched opening, (2) footing + moss at the base, (3) pale
 *   arch ring, (4) raised portcullis with spikes, (5) parapet + merlons, (6) two green banners
 *   on oak poles. Focal point: the arch + portcullis.
 * Budget notes (under 8,000 triangles): stone paint stays free of hard edges because the mesher
 *   cuts topology seams at steep paint transitions and those seams block triangle reduction;
 *   stone courses and mortar live in `bump` (normal map). Big flat bodies carry explicit
 *   maxTriangles caps with small maxError so the arch keeps its round shape.
 */

const W = 4.0;
const D = 1.0;
const WALL_TOP = 3.5;
const FRONT = D / 2;
const ARCH_R = 1.0; // opening 2 m wide, 3 m at the crown
const ARCH_SPRING = 2.0;

const C = {
  cream: rgb('#e8e0d0'),
  grey: rgb('#a8b0bc'),
  joint: rgb('#6f7680'),
  light: rgb('#f2ede2'),
  iron: rgb('#363a3f'),
  ironHi: rgb('#4a4f55'),
  oak: rgb('#b5814a'),
  walnut: rgb('#6b4226'),
  green: rgb('#5cb85c'),
  greenDark: rgb('#3f8f47'),
  straw: rgb('#e0bb60'),
  gold: rgb('#d4a93a'),
  slit: rgb('#1c1a1e'),
};

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const archProfile = (halfW: number, bot: number, spring: number) => {
  const pts: [number, number][] = [[-halfW, bot], [halfW, bot]];
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([halfW * Math.cos(a), spring + halfW * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

// Block courses: footing (1.0 x 0.5) plus four 0.625 m courses with staggered joints.
const GAP = 0.02;
const ROWS: { y0: number; y1: number; ws: number[]; d: number }[] = [
  { y0: 0, y1: 0.5, ws: [1, 1, 1, 1], d: 1.3 },
  { y0: 0.5, y1: 1.125, ws: [0.9, 0.7, 0.8, 0.8, 0.8], d: 1.0 },
  { y0: 1.125, y1: 1.75, ws: [0.5, 0.9, 0.8, 0.9, 0.9], d: 1.0 },
  { y0: 1.75, y1: 2.375, ws: [0.8, 0.8, 0.9, 0.7, 0.8], d: 1.0 },
  { y0: 2.375, y1: 3.0, ws: [0.7, 0.9, 0.8, 0.8, 0.8], d: 1.0 },
];
interface Blk { x0: number; x1: number; y0: number; y1: number; id: number; d: number }
const BLOCKS: Blk[] = [];
ROWS.forEach((r, ri) => {
  let lo = -2;
  r.ws.forEach((w, i) => {
    const last = i === r.ws.length - 1;
    BLOCKS.push({
      x0: lo + (i > 0 ? GAP : 0), x1: lo + w - (last ? 0 : GAP),
      y0: r.y0 + (ri > 0 ? GAP : 0), y1: r.y1 - (ri < ROWS.length - 1 ? GAP : 0),
      id: ri * 10 + i, d: r.d,
    });
    lo += w;
  });
});
const blockAt = (x: number, y: number): Blk | null =>
  BLOCKS.find((b) => x >= b.x0 - 0.001 && x <= b.x1 + 0.001 && y >= b.y0 - 0.001 && y <= b.y1 + 0.001) ?? null;

const blockPaint = (x: number, y: number, _z: number): Rgb => {
  const b = blockAt(x, y);
  if (!b) return C.joint;
  const t = noise.random(b.id, 3, 9);
  const v = noise.random(b.id, 5, 2);
  return t < 0.34 ? mixRgb(C.grey, C.cream, 0.12 * v) : mixRgb(C.cream, C.light, 0.5 * v);
};
const softPaint = (x: number, y: number, z: number): Rgb =>
  mixRgb(C.cream, C.light, 0.5 + 0.5 * noise.fbm(x * 3, y * 3, z * 3, 2));
const grain = (x: number, y: number, z: number) => 0.0015 * noise.fbm(x * 20, y * 20, z * 20, 2);

export default defineAsset({
  name: 'wall-gate',
  description:
    'Chibi city wall gate: real stone blocks in grey and cream, stepped footing, overhanging parapet with merlons, through arch with raised portcullis and open oak doors, arrow slits, and two banners.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/wall-gate-mock.jpg',

  build(k) {
    const archCut = sdf.extrude(archProfile(ARCH_R, -0.1, ARCH_SPRING), D + 1.0, 0.02);
    const slit = (sx: number) => sdf.box([0.12, 0.5, 0.1], 0.02).at(sx * 1.55, 1.35, FRONT);

    const core = sdf.box([W, 3.0, 0.9], 0.02).at(0, 1.5, 0);
    const blocks = sdf.union(
      ...BLOCKS.map((b) =>
        sdf.box([b.x1 - b.x0, b.y1 - b.y0, b.d], 0.03).at((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 0),
      ),
    );
    const wallShape = sdf
      .smoothUnion(0.01, core, blocks)
      .subtract(archCut, slit(-1), slit(1));
    k.body('stone', wallShape.paintFn(blockPaint), {
      color: C.cream, roughness: 0.9, detail: 0.02, maxError: 0.002, maxTriangles: 2600, bump: grain,
    });

    // Arrow slit dark inserts.
    const inserts = sdf.union(
      sdf.box([0.11, 0.48, 0.04], 0.01).at(-1.55, 1.35, 0.44),
      sdf.box([0.11, 0.48, 0.04], 0.01).at(1.55, 1.35, 0.44),
    );
    k.body('slits', inserts, { color: C.slit, roughness: 0.95, detail: 0.02, maxTriangles: 60 });

    // Parapet: fat overhanging slab plus 5 chunky merlons per edge.
    const slab = sdf.box([W, 0.5, 1.5], 0.04).at(0, 3.25, 0);
    k.body('slab', slab.paintFn(softPaint), {
      color: C.cream, roughness: 0.9, detail: 0.02, maxError: 0.002, maxTriangles: 400, bump: grain,
    });
    const xs = [-1.7, -0.85, 0, 0.85, 1.7];
    const merlon = (x: number, z: number) => sdf.box([0.6, 0.45, 0.45], 0.04).at(x, 3.5 + 0.225, z);
    const mer = [];
    for (const x of xs) mer.push(merlon(x, 0.525), merlon(x, -0.525));
    k.body('merlons', sdf.union(...mer).paintFn(softPaint), {
      color: C.cream, roughness: 0.9, detail: 0.02, maxError: 0.002, maxTriangles: 950, bump: grain,
    });

    // Back stair block at the +x end.
    const stairs = [0, 1, 2].map((i) => {
      const dep = 0.3 * (3 - i) + 0.2;
      return sdf.box([0.8, 0.4 * (i + 1), dep], 0.04).at(1.5, 0.2 * (i + 1), -FRONT + 0.05 - dep / 2 - 0.15);
    });
    k.body('stair', sdf.union(...stairs).paintFn(softPaint), {
      color: C.cream, roughness: 0.9, detail: 0.02, maxTriangles: 300, bump: grain,
    });

    // Pale arch ring: 11 voussoirs plus jamb blocks.
    const rMid = ARCH_R + 0.14;
    const vous = [];
    for (let i = 0; i < 11; i++) {
      const a = (Math.PI * (i + 0.5)) / 11;
      vous.push(
        sdf.box([0.3, 0.28, 0.14], 0.035).rotateZ((a * 180) / Math.PI - 90)
          .at(rMid * Math.cos(a), ARCH_SPRING + rMid * Math.sin(a), FRONT + 0.02),
      );
    }
    for (const sx of [-1, 1]) {
      for (const yy of [0.78, 1.3, 1.82]) vous.push(sdf.box([0.28, 0.5, 0.14], 0.035).at(sx * rMid, yy, FRONT + 0.02));
    }
    k.body('arch-trim', sdf.union(...vous).paintFn(softPaint), {
      color: C.light, roughness: 0.85, detail: 0.02, maxTriangles: 800, maxError: 0.003,
    });

    // Open door leaves, angled 25 degrees off the passage walls, hinged near the front.
    for (const sx of [-1, 1] as const) {
      const leaf = sdf.box([0.07, 2.1, 0.75], 0.012).paintFn((x, y, z) => {
        const f = ((z + 0.375) / 0.15) % 1;
        const seam = sstep(0.05, 0.0, Math.min(f, 1 - f));
        return mixRgb(C.oak, C.walnut, seam);
      });
      const ang = 25;
      const rad = (ang * Math.PI) / 180;
      const hx = sx * 0.94;
      const hz = 0.3;
      const cx = hx - sx * Math.sin(rad) * 0.375;
      const cz = hz - Math.cos(rad) * 0.375;
      const place = (sh: ReturnType<typeof leaf.at>) => sh.rotateY(sx * ang).at(cx, 1.15, cz);
      k.body(`door${sx}`, place(leaf), { color: C.oak, roughness: 0.8, detail: 0.02, maxTriangles: 300 });
      const f = -sx * 0.05;
      const strap = sdf.union(
        sdf.box([0.03, 0.1, 0.5], 0.01).rotateX(-32).at(f, 1.05, -0.17),
        sdf.box([0.03, 0.1, 0.5], 0.01).rotateX(32).at(f, 1.05, 0.17),
      );
      k.body(`strap${sx}`, place(strap), {
        color: C.iron, roughness: 0.5, metalness: 0.7, detail: 0.012, maxTriangles: 100,
      });
    }

    // Portcullis, raised to two thirds of the arch; pivot at y = 3.2, built in local coords.
    const PY = 3.2;
    const bars = [];
    for (let i = 0; i < 7; i++) {
      const x = -0.81 + (i * 1.62) / 6;
      bars.push(sdf.box([0.07, 1.5, 0.07], 0.015).at(x, 2.92 - PY, 0.0));
      bars.push(sdf.cone([x, 2.17 - PY, 0], [x, 1.9 - PY, 0], 0.05, 0.008));
    }
    bars.push(sdf.box([1.9, 0.1, 0.08], 0.02).at(0, 2.45 - PY, 0));
    bars.push(sdf.box([1.9, 0.1, 0.08], 0.02).at(0, 3.05 - PY, 0));
    const portcullis = sdf.union(...bars).paintFn((x, y) => mixRgb(C.iron, C.ironHi, 0.3 + 0.5 * sstep(-1.2, -0.5, y)));
    k.group('portcullis', { at: [0, PY, 0] }, (g) => {
      g.body('grate', portcullis, {
        color: C.ironHi, roughness: 0.5, metalness: 0.7, detail: 0.012, maxError: 0.004, maxTriangles: 700,
      });
    });

    // Banners under the parapet, back face 0.08 m clear of the block face.
    const bannerProfile = profile.polygon([
      [-0.25, 0], [0.25, 0], [0.25, -1.0], [0.12, -0.85], [0, -0.7], [-0.12, -0.85], [-0.25, -1.0],
    ]);
    for (const side of [-1, 1] as const) {
      const bx = side * 1.55;
      const py = 2.85;
      const pz = FRONT + 0.14;
      k.body(`pole${side}`, sdf.cylinder(0.035, 0.66, 0.012).rotateZ(90).at(bx, py, pz), {
        color: C.oak, roughness: 0.8, detail: 0.012, maxTriangles: 100,
      });
      for (const e of [-1, 1]) {
        k.body(`ball${side}${e}`, sdf.sphere(0.06).at(bx + e * 0.33, py, pz), {
          color: C.gold, roughness: 0.5, metalness: 0.4, detail: 0.012, maxTriangles: 80,
        });
      }
      const cloth = sdf.extrude(bannerProfile, 0.03, 0.008).at(bx, py - 0.04, FRONT + 0.105).paintFn((x, y) => {
        const rel = py - 0.04 - y;
        const c = mixRgb(C.green, C.greenDark, 0.25 * sstep(0.1, 0.7, rel));
        return mixRgb(c, C.straw, sstep(0.66, 0.7, rel));
      });
      k.body(`banner${side}`, cloth, { color: C.green, roughness: 0.9, detail: 0.012, maxTriangles: 180 });
    }
  },
});
