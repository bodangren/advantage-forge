import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - longhouse (catalog `architecture/structure/longhouse`).
 * Role: village hall, seen small on the map; static, no rig.
 * Size: 8 m long (X), 4 m deep (Z), about 4 m tall (dragons to 4.3); on y = 0, front toward +Z.
 * One idea: a chunky oak hall under a fat terracotta shingle roof whose eaves sweep up at the
 *   gable ends, capped by carved dragon heads.
 * Shape language: round and chunky, curved horns and rays as secondary.
 * Palette: oak #b5814a, pale #c9a06a, walnut #6b4226, terracotta #d9764a, tan/straw #e0bb60,
 *   iron #8a94a0, stone #a39a8c.
 * Materials: stone, walls, timber, roof, shingles (2), straw carving, door, iron, glass.
 * Details: door and porch (focal), two sun-ray windows, dragon heads, corner posts with studs.
 */

const C = {
  oak: rgb('#b5814a'),
  pale: rgb('#c9a06a'),
  walnut: rgb('#6b4226'),
  terra: rgb('#d9764a'),
  tan: rgb('#e0bb60'),
  iron: rgb('#8a94a0'),
  stone: rgb('#a39a8c'),
  glass: rgb('#2f3a44'),
};

const FZ = 1.8; // front wall plane
const HX = 3.8; // half length of walls
const A = 20; // roof pitch, degrees
const SA = Math.sin((A * Math.PI) / 180);
const CA = Math.cos((A * Math.PI) / 180);
const lift = (x: number): number => 0.5 * Math.pow(Math.max(0, Math.abs(x) - 1.6) / 2.8, 2);
const liftSlope = (x: number): number =>
  (Math.sign(x) * (1.0 * Math.max(0, Math.abs(x) - 1.6)) / (2.8 * 2.8)) * 180 / Math.PI * 0.9;
// Place a part built in the slope frame: u along the slope from the ridge, n above the slab.
const onSlope = (s: ReturnType<typeof sdf.box>, x: number, u: number, n: number, sz: number) =>
  s
    .rotateX(sz * A)
    .rotateZ(liftSlope(x))
    .at(x, 3.55 - u * SA + n * CA + lift(x), sz * (0.1 + u * CA + n * SA));

export default defineAsset({
  name: 'longhouse',
  description:
    'Chibi viking longhouse: honey-oak plank walls, a fat shingled roof sweeping up at the gables, dragon heads, arched door under a porch, and two sun-ray windows.',
  detail: 0.016,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/longhouse-mock.jpg',

  build(k) {
    // Plinth, front blocks, chimney shaft.
    const plinth = sdf.box([8.4, 0.3, 4.4], 0.07).at(0, 0.15, 0);
    const blocks = sdf.union(
      ...[1.0, 2.1, 3.1].map((x, i) => sdf.box([0.95, 0.24 + (i === 0 ? 0.1 : 0), 0.34], 0.08).at(x, 0.3 + 0.06, 2.3)),
    );
    const step = sdf.box([2.0, 0.2, 0.8], 0.06).at(-1.9, 0.1, 2.5);
    k.body('stone', sdf.union(plinth, blocks), {
      color: C.stone, roughness: 0.9, detail: 0.016, maxTriangles: 550,
      bump: (x, y, z) => 0.005 * noise.fbm(x * 5, y * 5, z * 5, 2),
    });
    const chimney = sdf.box([0.6, 0.9, 0.6], 0.06).at(2.0, 3.55, -1.1);
    k.body('chimney', chimney, { color: C.iron, roughness: 0.9, detail: 0.016, maxTriangles: 200 });
    k.body('step', step, { color: C.pale, roughness: 0.85, detail: 0.016, maxTriangles: 150 });

    // Walls with plank grooves, plus gable end walls.
    let walls = sdf.box([7.6, 2.4, 3.6], 0.06).at(0, 1.5, 0);
    const gableP = profile.polygon([[-1.9, 2.6], [1.9, 2.6], [0, 3.55]], { smooth: false });
    const gables = sdf.union(...[-1, 1].map((sx) => sdf.extrude(gableP, 0.3, 0.05).rotateY(90).at(sx * 3.65, 0, 0)));
    walls = sdf.union(walls, gables);
    const grooves = Array.from({ length: 0 }, (_, i) => 0.62 + i * 0.27);
    walls = walls.subtract(
      ...grooves.flatMap((y) => [
        sdf.box([7.7, 0.06, 0.08]).at(0, y, FZ),
        sdf.box([7.7, 0.06, 0.08]).at(0, y, -FZ),
        sdf.box([0.08, 0.06, 3.7]).at(HX, y, 0),
        sdf.box([0.08, 0.06, 3.7]).at(-HX, y, 0),
      ]),
    );
    k.body('walls', walls.paintFn((x, y, z, b) => {
      const band = 0.3 * (0.5 + 0.5 * Math.sin(((y - 0.35) / 0.27) * Math.PI));
      const grain = 0.5 + 0.5 * noise.fbm(x * 0.6, y * 1.5, z * 0.6, 2);
      return mixRgb(mixRgb(mixRgb(b, C.pale, band), C.walnut, 0.22 * grain), C.walnut, 0.85 * Math.pow(0.5 + 0.5 * Math.cos(((y - 0.62) / 0.27) * Math.PI * 2), 24) * (y > 0.5 && y < 2.8 ? 1 : 0));
    }), {
      color: C.oak, roughness: 0.85, detail: 0.016, maxTriangles: 1250,
      bump: (x, y, z) => -0.03 * Math.pow(0.5 + 0.5 * Math.cos(((y - 0.62) / 0.27) * Math.PI * 2), 24) + 0.004 * noise.fbm(x * 4, y * 22, z * 4, 2),
    });

    // Corner posts with studs.
    const posts = sdf.union(
      ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => sdf.box([0.4, 2.6, 0.4], 0.08).at(sx * HX, 1.6, sz * FZ))),
    );
    const capBlocks = sdf.union(
      ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => sdf.box([0.5, 0.2, 0.5], 0.06).at(sx * HX, 2.8, sz * FZ))),
    );
    const studs = sdf.union(
      ...[-1, 1].flatMap((sx) => [-1, 1].flatMap((sz) => [0.75, 1.5].map((y) =>
        sdf.cylinder(0.075, 0.08, 0.02).rotateX(90).at(sx * HX, y, sz * (FZ + 0.2))))),
    );
    k.body('timber', sdf.union(posts, capBlocks, studs), {
      color: C.oak, roughness: 0.85, detail: 0.016, maxTriangles: 600,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 5, y * 18, z * 5, 2),
    });

    // Roof slabs (segmented so eaves lift toward the gables), ridge beam.
    const xs = [-3.9, -2.6, -1.3, 0, 1.3, 2.6, 3.9];
    const slabs = sdf.union(...[-1, 1].flatMap((sz) => xs.map((x) =>
      onSlope(sdf.box([1.5, 0.25, 2.7], 0.08), x, 1.3, -0.12, sz))));
    const ridge = sdf.capsule([-4.3, 3.66, 0], [4.3, 3.66, 0], 0.2);
    k.body('roof', slabs.smoothUnion(0.05, ridge), {
      color: C.terra, roughness: 0.8, detail: 0.014, maxTriangles: 750,
    });
    const shingle = (row: number, i: number, sz: number) => {
      const x = -3.85 + i * 1.1 + (row % 2) * 0.45;
      return { x, s: onSlope(sdf.box([1.0, 0.1, 0.7], 0.05), x, 0.75 + row * 0.5, 0.06, sz) };
    };
    const terraS: ReturnType<typeof sdf.box>[] = [];
    const tanS: ReturnType<typeof sdf.box>[] = [];
    for (const sz of [-1, 1]) {
      for (let row = 0; row < 4; row++) {
        for (let i = 0; i < 8; i++) {
          const { x, s } = shingle(row, i, sz);
          if (Math.abs(x) > 4.2) continue;
          (row % 2 ? tanS : terraS).push(s);
        }
      }
    }
    k.body('shingles-terra', sdf.union(...terraS), { color: C.terra, roughness: 0.8, detail: 0.014, maxTriangles: 800 });
    k.body('shingles-tan', sdf.union(...tanS), { color: C.tan, roughness: 0.8, detail: 0.014, maxTriangles: 800 });
    k.body('chimney-cap', sdf.box([0.8, 0.16, 0.8], 0.06).at(2.0, 4.08, -1.1), { color: C.terra, roughness: 0.8, detail: 0.016, maxTriangles: 150 });

    // Dragon heads and crown emblems in straw.
    const dragons = sdf.union(...[-1, 1].map((sx) => {
      const neck = sdf.chain([
        [sx * 4.15, 3.5, 0, 0.16], [sx * 4.4, 3.75, 0, 0.14], [sx * 4.6, 4.05, 0, 0.11], [sx * 4.62, 4.3, 0, 0.09],
      ], 0.05);
      const head = sdf.box([0.7, 0.34, 0.44], 0.1).rotateZ(-sx * 25).at(sx * 4.9, 4.4, 0);
      const horn = sdf.cone([sx * 4.62, 4.4, 0], [sx * 4.5, 4.75, 0], 0.07, 0.015);
      return sdf.smoothUnion(0.04, neck, head, horn);
    }));
    const crown = sdf.union(...[-1, 1].map((sx) => {
      const ex = sx * (HX + 0.22);
      return sdf.union(
        sdf.box([0.14, 0.24, 0.5], 0.04).at(ex, 2.98, 0),
        ...[-0.2, 0, 0.2].map((z) => sdf.capsule([ex, 3.05, z * 0.9], [ex, 3.3 + (z === 0 ? 0.08 : 0), z * 1.1], 0.06)),
      );
    }));
    k.body('carving', sdf.union(dragons, crown), {
      color: C.tan, roughness: 0.85, detail: 0.01, maxTriangles: 750,
    });

    // Door, frame, iron, porch.
    const DX = -1.9;
    const doorP = profile.polygon([[-0.6, 0], [0.6, 0], [0.6, 1.5], [0.45, 1.85], [0, 2.0], [-0.45, 1.85], [-0.6, 1.5]], { smooth: false });
    const door = sdf.extrude(doorP, 0.16, 0.04).at(DX, 0.3, FZ + 0.03);
    k.body('door', door.paintFn((x, y, z, b) => {
      const g = Math.pow(0.5 + 0.5 * Math.cos(((x - DX) / 0.2) * Math.PI * 2), 6);
      return mixRgb(b, rgb('#4a2c18'), 0.7 * g);
    }), { color: C.walnut, roughness: 0.85, detail: 0.01, maxTriangles: 450 });
    const frameP = profile.polygon([[-0.8, 0], [0.8, 0], [0.8, 1.5], [0.6, 2.05], [0, 2.25], [-0.6, 2.05], [-0.8, 1.5]], { smooth: false });
    const frame = sdf.extrude(frameP, 0.14, 0.04).subtract(sdf.extrude(doorP, 0.7)).at(DX, 0.3, FZ + 0.02);
    k.body('frame', frame, { color: rgb('#8a4a30'), roughness: 0.85, detail: 0.01, maxTriangles: 350 });
    const iron = sdf.union(
      sdf.box([1.1, 0.13, 0.05], 0.02).at(DX, 1.0, FZ + 0.2),
      sdf.box([1.1, 0.13, 0.05], 0.02).at(DX, 1.9, FZ + 0.2),
      sdf.cylinder(0.14, 0.05, 0.02).rotateX(90).at(DX, 1.45, FZ + 0.2),
    );
    k.body('iron', iron, { color: C.iron, roughness: 0.5, metalness: 0.7, detail: 0.01, maxTriangles: 250 });
    const porchPosts = sdf.union(...[-1, 1].map((s) => sdf.capsule([DX + s * 0.95, 0.3, FZ + 0.75], [DX + s * 0.95, 2.35, FZ + 0.75], 0.1)));
    const porchRoof = sdf.extrude(
      profile.polygon([[-1.3, 2.3], [0, 2.85], [1.3, 2.3], [1.3, 2.12], [0, 2.65], [-1.3, 2.12]], { smooth: false }), 1.1, 0.05,
    ).at(DX, 0, FZ + 0.55);
    k.body('porch', sdf.union(porchPosts, porchRoof), {
      color: C.oak, roughness: 0.85, detail: 0.01, maxTriangles: 650,
    });

    // Windows with sun-ray frames.
    const WX = [0.6, 2.3];
    const WY = 1.45;
    const winP = profile.polygon([[-0.35, 0], [0.35, 0], [0.35, 0.55], [0.22, 0.82], [0, 0.92], [-0.22, 0.82], [-0.35, 0.55]], { smooth: false });
    const glass = sdf.union(...WX.map((x) => sdf.extrude(winP, 0.1, 0.02).at(x, WY - 0.45, FZ - 0.01)));
    k.body('glass', glass, { color: C.glass, roughness: 0.3, detail: 0.01, maxTriangles: 150 });
    const outerP = profile.polygon([[-0.5, -0.1], [0.5, -0.1], [0.5, 0.55], [0.34, 0.95], [0, 1.08], [-0.34, 0.95], [-0.5, 0.55]], { smooth: false });
    const frames = sdf.union(...WX.map((x) =>
      sdf.extrude(outerP, 0.12, 0.04).subtract(sdf.extrude(winP, 0.7)).at(x, WY - 0.45, FZ + 0.0)));
    const sills = sdf.union(...WX.map((x) => sdf.box([0.85, 0.13, 0.22], 0.05).at(x, WY - 0.6, FZ + 0.1)));
    k.body('frames', sdf.union(frames, sills), { color: rgb('#e0a040'), roughness: 0.85, detail: 0.01, maxTriangles: 550 });
    const rays = sdf.union(...WX.flatMap((x) =>
      Array.from({ length: 8 }, (_, i) => {
        const a = ((15 + i * 150 / 7) * Math.PI) / 180;
        const cx = x, cy = WY + 0.3;
        return sdf.capsule(
          [cx + Math.cos(a) * 0.52, cy + Math.sin(a) * 0.56, FZ + 0.06],
          [cx + Math.cos(a) * 0.85, cy + Math.sin(a) * 0.9, FZ + 0.06], 0.09);
      })));
    k.body('rays', rays, { color: C.tan, roughness: 0.85, detail: 0.01, maxTriangles: 450 });
  },
});
