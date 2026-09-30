import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Design note - dungeon chains (props/dungeon/chains), catch-up rework.
 *
 * Role: dungeon set-dressing; must read at 128 px (big links, hard dark-on-blue contrast).
 * Size: 0.87 x 0.68 x 0.71 m; wall stub at the back (z < -0.10), stands on y = 0, faces +Z.
 * One idea: two wall rings with hanging chains of large links, one ending in an open
 *   manacle, and a coiled pile of the same links on the floor.
 * Shape language: square dominant (kit masonry), round secondary (torus links, rings).
 * Palette: kit stone #4a5d75 block, #2a3547 joint bed, #7a8ba0 worn top; iron #34363c with
 *   worn edges #6a6e78. Value plan: dark iron against mid blue stone.
 * Materials: iron (rough 0.5, metal 0.8); stone (rough 0.9, bump pits).
 * Detail: primary wall blocks + chains; secondary rings, manacle, pile; tertiary bump.
 * Rig/animation: none.
 */

const IRON = rgb('#34363c');
const IRON_DARK = rgb('#22242a');
const IRON_WORN = rgb('#6a6e78');
const STONE_MID = rgb('#4a5d75');
const STONE_DARK = rgb('#35465a');
const STONE_PALE = rgb('#7a8ba0');
const JOINT = rgb('#2a3547');

const LR = 0.035; // link torus radius
const LT = 0.013; // link tube radius
const LE = 0.011; // link elongation
const PITCH = 2 * (LR + LE) - 2 * LT;

// Stadium link standing in the XY plane (faces +Z) or the ZY plane (faces +X).
const link = (turn: boolean): Sdf => {
  const l = sdf.torus(LR, LT).elongate(0, 0, LE).rotateX(90);
  return turn ? l.rotateY(90) : l;
};

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

export default defineAsset({
  name: 'chains',
  description:
    'Dungeon chains: a blue masonry wall stub with two iron rings, hanging chains of large links (one ends in an open manacle), and a coiled pile of links on the floor.',
  detail: 0.006,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ wall stub
    const WX0 = 0.05;
    const WX1 = 0.51;
    const WZ0 = -0.4;
    const WZ1 = -0.1;
    const WH = 0.665;
    const cx = (WX0 + WX1) / 2;
    const cz = (WZ0 + WZ1) / 2;
    const GAP = 0.02;
    const COURSE = WH / 2;
    const core = sdf.box([WX1 - WX0 - 0.05, WH - 0.03, WZ1 - WZ0 - 0.05], 0.01).at(cx, (WH - 0.03) / 2, cz);
    const blocks: Sdf[] = [];
    const rows: [number, number[]][] = [
      [0, [WX0, 0.27, WX1]],
      [1, [WX0, 0.16, 0.38, WX1]],
    ];
    for (const [r, cuts] of rows) {
      const y0 = r * COURSE + (r === 0 ? 0 : GAP / 2);
      const y1 = (r + 1) * COURSE - (r === 1 ? 0 : GAP / 2);
      for (let i = 0; i < cuts.length - 1; i++) {
        const x0 = cuts[i] + (i === 0 ? 0 : GAP / 2);
        const x1 = cuts[i + 1] - (i === cuts.length - 2 ? 0 : GAP / 2);
        blocks.push(
          sdf
            .box([x1 - x0, y1 - y0, WZ1 - WZ0], 0.03)
            .at((x0 + x1) / 2, (y0 + y1) / 2, cz),
        );
      }
    }
    const stonePaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
      let c = mixRgb(STONE_DARK, STONE_MID, 0.3 + 0.6 * patch);
      c = mixRgb(c, STONE_PALE, 0.5 * clamp01((y - 0.6) / 0.08));
      c = mixRgb(c, JOINT, 0.8 * clamp01((0.012 - Math.abs(y - COURSE)) / 0.012));
      return c;
    };
    const stoneBump = (x: number, y: number, z: number): number =>
      0.0018 * noise.fbm(x * 26, y * 26, z * 26, 3) + 0.0008 * noise.noise3(x * 70, y * 70, z * 70);
    k.body('wall-blocks', sdf.union(...blocks).paintFn(stonePaint), {
      color: '#4a5d75',
      roughness: 0.9,
      detail: 0.008,
      bump: stoneBump,
      maxTriangles: 1800,
    });
    k.body('wall-joints', core.paint(JOINT), {
      color: '#2a3547',
      roughness: 0.95,
      detail: 0.01,
      maxTriangles: 300,
    });

    // ------------------------------------------------------------ ironwork
    const parts: Sdf[] = [];
    const RY = 0.54;
    const faceZ = WZ1;
    // Wall rings: plate + flat ring standing out of the face.
    const hangs: { x: number; n: number }[] = [
      { x: 0.17, n: 6 },
      { x: 0.39, n: 4 },
    ];
    for (const h of hangs) {
      parts.push(sdf.cylinder(0.04, 0.02, 0.006).rotateX(90).at(h.x, RY, faceZ + 0.008));
      parts.push(sdf.torus(0.03, 0.014).rotateX(90).at(h.x, RY - 0.012, faceZ + 0.03));
      // chain hangs from the ring; first link turned to pass through it
      for (let i = 0; i < h.n; i++) {
        parts.push(link(i % 2 === 0).at(h.x, RY - 0.012 - 0.03 - 0.008 - i * PITCH - 0.02, faceZ + 0.03));
      }
    }
    // Open manacle under the second chain: C cuff with a hinge knuckle.
    {
      const x = hangs[1].x;
      const lastY = RY - 0.012 - 0.03 - 0.008 - (hangs[1].n - 1) * PITCH - 0.02;
      const my = lastY - PITCH - 0.012;
      const cuff = sdf
        .torus(0.046, 0.016)
        .rotateX(90)
        .rotateZ(-18);
      const gap = sdf.box([0.06, 0.08, 0.1]).at(0.046, -0.02, 0).rotateZ(-18);
      parts.push(cuff.subtract(gap).at(x, my, faceZ + 0.03));
      parts.push(sdf.cylinder(0.018, 0.045, 0.004).rotateX(90).at(x - 0.0, my + 0.047, faceZ + 0.03));
      parts.push(sdf.sphere(0.02).at(x - 0.03, my - 0.035, faceZ + 0.03));
    }
    // Coiled pile on the floor, same links.
    const pcx = -0.17;
    const pcz = 0.14;
    const place = (l: Sdf, rx: number, ry: number, x: number, y: number, z: number) =>
      parts.push(l.rotateX(rx).rotateY(ry).at(x, y, z));
    const flat = (t: boolean) => (t ? link(true) : link(false)).rotateX(90); // lie flat
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = 0.1 + 0.015 * (i % 2);
      place(flat(i % 2 === 1), 0, a * 57.3 + 90, pcx + Math.cos(a) * r, LT + (i % 2) * 0.012, pcz + Math.sin(a) * r);
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.6;
      place(flat(i % 2 === 1), (i % 2 ? 14 : -10), a * 57.3 + 50, pcx + Math.cos(a) * 0.045, 0.04 + LT, pcz + Math.sin(a) * 0.045);
    }
    place(flat(false), 12, 10, pcx - 0.02, 0.085, pcz + 0.01);
    // Tail trailing from the pile toward the camera.
    place(flat(false), 0, 70, pcx + 0.17, LT, pcz + 0.11);
    place(flat(true), 0, 70, pcx + 0.225, LT + 0.002, pcz + 0.16);

    const ironPaint = (x: number, y: number, z: number) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2);
      let c = mixRgb(IRON_DARK, IRON, 0.3 + 0.7 * n);
      c = mixRgb(c, IRON_WORN, 0.22 * clamp01((n - 0.6) / 0.3));
      return c;
    };
    k.body('iron', sdf.union(...parts).paintFn(ironPaint), {
      color: '#34363c',
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 45, y * 45, z * 45, 2),
      maxTriangles: 6800,
    });
  },
});
