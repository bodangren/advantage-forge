import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - ruined-house (catalog `architecture/ruin/ruined-house`).
 * Role: background ruin in a war-torn village, seen small; static, no rig. 4 x 3.5 x 4 m, on y = 0.
 * One idea: a collapsed townhouse; front and right walls jagged, tile roof hanging on charred beams.
 * Shape language: square with jagged breaks; round rubble and vines.
 * Palette: plaster #f0e2a8 / soot #8a7a5a, timber #8a5a35, char #2e2a28, tile #d9764a, stone #9a948a, moss #6a9a3c.
 * Materials: plaster, timber, charred beams, tiles, rubble stone, floor, vines, moss.
 */
const C = {
  plaster: rgb('#f0e2a8'), soot: rgb('#8a7a5a'), brown: rgb('#8a5a35'), char: rgb('#2e2a28'),
  tile: rgb('#d9764a'), tileDark: rgb('#b45a36'), stone: rgb('#9a948a'), stoneDark: rgb('#6f6a64'),
  moss: rgb('#6a9a3c'), leaf: rgb('#5cb85c'), floor: rgb('#7a6a54'),
};
type S = ReturnType<typeof sdf.box>;
type P = [number, number];

const T = 0.3; // wall thickness
const frontPoly: P[] = [[-2, 0], [2, 0], [2, 3.5], [1.6, 3.1], [1.2, 3.35], [0.6, 2.75], [0.1, 2.95], [-0.3, 2.45], [-0.9, 2.65], [-1.3, 1.9], [-1.7, 2.15], [-2, 1.2]];
// Side wall profile: u = -z (after rotateY 90), so u = -2 is the front corner.
const sidePoly: P[] = [[-2, 0], [2, 0], [2, 1.1], [1.4, 1.8], [1.0, 1.45], [0.4, 2.5], [-0.2, 2.2], [-0.7, 3.0], [-1.2, 2.7], [-1.6, 3.2], [-2, 3.5]];
const backPoly: P[] = [[-2, 0], [2, 0], [2, 1.0], [1.5, 0.8], [0.9, 1.25], [0.3, 0.95], [-0.4, 1.2], [-1.0, 0.85], [-1.6, 1.1], [-2, 0.7]];
const leftPoly: P[] = [[-2, 0], [2, 0], [2, 0.5], [1.0, 0.8], [0.0, 0.4], [-1.0, 0.7], [-2, 0.45]];

const doorP = (w: number, h: number) => profile.polygon([[-w, 0], [w, 0], [w, h - w], [w * 0.7, h - w * 0.3], [0, h], [-w * 0.7, h - w * 0.3], [-w, h - w]]);
const DX = -0.7; // door x
const WX = 1.0, WY = 1.7; // window centre

const wallF = (poly: P[], depth = T): S => sdf.extrude(profile.polygon(poly), depth, 0.03);
// Placement helpers into world.
const front = (s: S): S => s.at(0, 0, 1.85);
const right = (s: S): S => s.rotateY(90).at(1.85, 0, 0);
const back = (s: S): S => s.at(0, 0, -1.85);
const left = (s: S): S => s.rotateY(90).at(-1.85, 0, 0);

const rnd = (i: number, j = 0, k = 0): number => noise.random(i, j, k);

export default defineAsset({
  name: 'ruined-house',
  description: 'Chibi collapsed townhouse: jagged cream plaster walls with exposed half-timber, charred beams, half-fallen red tile roof, rubble, vines and moss.',
  detail: 0.014,
  texture: { size: 1024 },

  build(k) {
    // Plaster walls with chunks bitten out.
    const frontW = wallF(frontPoly)
      .subtract(sdf.extrude(doorP(0.5, 1.85), 1).at(DX, 0, 0), sdf.box([0.8, 0.8, 1]).at(WX, WY, 0))
      .subtract(...([[-1.5, 1.2, 0.3], [0.5, 1.9, 0.35], [1.7, 2.6, 0.3], [-0.3, 0.8, 0.22]] as [number, number, number][]).map(([x, y, r]: [number, number, number]) => sdf.ellipsoid([r, r * 0.8, 0.2]).at(x, y, 0.28)));
    const sideW = wallF(sidePoly)
      .subtract(...([[-1.0, 1.3, 0.35], [0.6, 1.0, 0.3], [-1.6, 2.2, 0.28]] as [number, number, number][]).map(([x, y, r]: [number, number, number]) => sdf.ellipsoid([r, r * 0.8, 0.2]).at(x, y, 0.28)));
    const walls = sdf.union(front(frontW), right(sideW), back(wallF(backPoly, 0.3)), left(wallF(leftPoly, 0.3)));
    k.body('plaster', walls.paintFn((x, y, z, b) => {
      const dirt = Math.max(0, Math.min(1, (0.9 - y) / 0.9)) * 0.55 + 0.35 * (0.5 + 0.5 * noise.fbm(x * 2.5, y * 2.5, z * 2.5, 3));
      return mixRgb(b, C.soot, dirt);
    }), { color: C.plaster, roughness: 0.95, detail: 0.014, maxTriangles: 7000,
      bump: (x, y, z) => 0.006 * noise.fbm(x * 8, y * 8, z * 8, 3) });

    // Half-timber studs and braces, clipped to the broken wall outline.
    const studs = (xs: number[], poly: P[], brace: boolean): S => {
      const clip = wallF(poly, 0.5);
      const parts: S[] = xs.map((x) => sdf.box([0.15, 4, 0.4], 0.03).at(x, 2, 0));
      parts.push(sdf.box([4.2, 0.15, 0.4], 0.03).at(0, 1.2, 0), sdf.box([4.2, 0.15, 0.4], 0.03).at(0, 0.12, 0));
      if (brace) parts.push(sdf.box([0.13, 1.6, 0.4], 0.03).rotateZ(-40).at(-1.0, 2.0, 0), sdf.box([0.13, 1.6, 0.4], 0.03).rotateZ(40).at(1.2, 2.1, 0));
      return sdf.union(...parts).intersect(clip).subtract(sdf.extrude(doorP(0.5, 1.85), 1).at(DX, 0, 0).scale(1));
    };
    const frameF = studs([-1.92, -1.2, 0.0, 1.92], frontPoly, true)
      .subtract(sdf.box([0.8, 0.8, 1]).at(WX, WY, 0));
    const frameS = studs([-1.92, -0.8, 0.5, 1.92], sidePoly, true);
    const winFrame = sdf.box([0.98, 0.98, 0.4], 0.03).subtract(sdf.box([0.76, 0.76, 1])).at(WX, WY, 0);
    const arch = sdf.extrude(doorP(0.66, 2.0), 0.4, 0.04).subtract(sdf.extrude(doorP(0.5, 1.85), 1.2)).at(DX, 0, 0);
    const timber = sdf.union(front(sdf.union(frameF, winFrame, arch)), right(frameS),
      sdf.box([0.5, 0.2, 0.6], 0.04).at(DX, 0.1, 2.3));
    k.body('timber', timber, { color: C.brown, roughness: 0.85, detail: 0.012, maxTriangles: 5000,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 5, y * 18, z * 5, 2) });

    // Roof section: tilted slab with tiles, hanging from the right wall toward the back.
    const roofLocal: S[] = [sdf.box([2.8, 0.1, 2.3], 0.02)];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (rnd(r, c, 3) < 0.25) continue;
        const dz = (rnd(r, c, 5) - 0.5) * 0.04;
        roofLocal.push(sdf.box([0.62, 0.09, 0.55], 0.035).rotateZ((rnd(r, c, 7) - 0.5) * 8).at(-1.05 + r * 0.7, 0.09, -0.85 + c * 0.58 + dz));
      }
    }
    const roofPose = (s: S): S => s.rotateZ(26).rotateX(5).at(0.75, 2.2, -0.9);
    k.body('tiles', roofPose(sdf.union(...roofLocal)).paintFn((x, y, z, b) =>
      mixRgb(b, C.tileDark, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2)))),
    { color: C.tile, roughness: 0.8, detail: 0.012, maxTriangles: 5000 });

    // Charred beams: rafters under the roof, a beam to the ground, a broken ridge stub.
    const raft = [-0.75, 0, 0.75].map((z) => roofPose(sdf.box([3.0, 0.14, 0.14], 0.03).at(0, -0.12, z)));
    const strut = sdf.box([0.16, 2.6, 0.16], 0.03).rotateZ(-28).rotateX(10).at(-0.1, 1.15, -1.5);
    const leaning = sdf.box([2.6, 0.16, 0.16], 0.03).rotateZ(35).at(-1.35, 0.9, 1.1);
    k.body('charred', sdf.union(...raft, strut, leaning).paintFn((x, y, z, b) =>
      mixRgb(b, rgb('#5a4030'), 0.5 * (0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2)))),
    { color: C.char, roughness: 0.95, detail: 0.012, maxTriangles: 2500,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 12, y * 12, z * 12, 2) });

    // Floor.
    k.body('floor', sdf.box([3.8, 0.1, 3.8], 0.03).at(0, 0.05, 0), { color: C.floor, roughness: 0.95, detail: 0.02, maxTriangles: 300,
      bump: (x, y, z) => 0.005 * noise.fbm(x * 8, y * 8, z * 8, 2) });

    // Rubble: stones and broken timber.
    const stones: S[] = [];
    const pile = (cx: number, cz: number, rx: number, rz: number, h: number, n: number, seed: number) => {
      for (let i = 0; i < n; i++) {
        const a = rnd(i, seed, 1) * Math.PI * 2, rr = Math.sqrt(rnd(i, seed, 2));
        const x = cx + Math.cos(a) * rr * rx, z = cz + Math.sin(a) * rr * rz;
        const s = 0.1 + rnd(i, seed, 3) * 0.16;
        const y = 0.1 + h * (1 - rr) * (0.5 + rnd(i, seed, 4) * 0.5) + s * 0.4;
        stones.push(sdf.box([s * 2, s * 1.4, s * 1.7], s * 0.45).rotate(rnd(i, seed, 5) * 60, rnd(i, seed, 6) * 180, rnd(i, seed, 7) * 60).at(x, y, z));
      }
    };
    pile(0.1, -0.5, 1.5, 1.3, 0.55, 26, 1);
    pile(-0.6, 2.6, 1.0, 0.7, 0.25, 12, 2);
    pile(1.7, 2.5, 0.5, 0.5, 0.2, 5, 3);
    pile(-2.4, 0.5, 0.5, 1.2, 0.25, 7, 4);
    k.body('rubble', sdf.union(...stones).paintFn((x, y, z, b) =>
      mixRgb(b, C.stoneDark, 0.6 * (0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2)))),
    { color: C.stone, roughness: 0.92, detail: 0.014, maxTriangles: 6000,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 12, y * 12, z * 12, 2) });
    const logs = sdf.union(
      sdf.box([1.5, 0.13, 0.13], 0.03).rotateY(25).rotateZ(8).at(0.2, 0.55, -0.4),
      sdf.box([1.1, 0.13, 0.13], 0.03).rotateY(-40).rotateZ(-6).at(-0.8, 0.4, 0.4),
      sdf.box([1.3, 0.13, 0.13], 0.03).rotateY(70).at(-0.2, 0.2, 2.8),
      sdf.box([0.8, 0.13, 0.13], 0.03).rotateY(-20).at(0.9, 0.18, 2.5),
    );
    k.body('beams', logs, { color: C.brown, roughness: 0.85, detail: 0.012, maxTriangles: 800 });

    // Vines climbing the front corner and window, and moss.
    const vine = sdf.chain([[1.95, 0.1, 2.25, 0.035], [1.85, 0.8, 2.25, 0.03], [1.95, 1.5, 2.25, 0.03], [1.8, 2.3, 2.24, 0.028], [1.9, 3.0, 2.24, 0.025]], 0.02);
    const vine2 = sdf.chain([[1.4, 0.1, 2.25, 0.03], [1.5, 0.7, 2.24, 0.03], [1.45, 1.25, 2.24, 0.028]], 0.02);
    const leaves: S[] = [];
    for (let i = 0; i < 16; i++) {
      const y = 0.3 + i * 0.19;
      leaves.push(sdf.ellipsoid([0.1, 0.07, 0.03]).rotateZ(rnd(i, 9, 9) * 180).at(1.9 + (rnd(i, 8, 8) - 0.5) * 0.25, y, 2.28));
    }
    for (let i = 0; i < 5; i++) leaves.push(sdf.ellipsoid([0.1, 0.07, 0.03]).rotateZ(rnd(i, 4, 4) * 180).at(1.45 + (rnd(i, 3, 3) - 0.5) * 0.2, 0.3 + i * 0.22, 2.28));
    k.body('vines', sdf.union(vine, vine2, ...leaves), { color: C.leaf, roughness: 0.8, detail: 0.01, maxTriangles: 1500 });
    k.body('moss', sdf.union(
      sdf.ellipsoid([0.35, 0.07, 0.3]).at(-0.6, 0.12, 2.5),
      sdf.ellipsoid([0.45, 0.06, 0.25]).at(-1.4, 0.1, 2.15),
      sdf.ellipsoid([0.3, 0.08, 0.3]).at(0.1, 0.78, -0.6),
      sdf.ellipsoid([0.3, 0.07, 0.17]).at(-0.4, 0.88, -1.85),
    ), { color: C.moss, roughness: 0.95, detail: 0.012, maxTriangles: 800,
      bump: (x, y, z) => 0.01 * noise.fbm(x * 15, y * 15, z * 15, 2) });
  },
});
