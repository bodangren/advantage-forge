import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - sleigh (vehicles/land/sleigh).
 * Role: parked winter sleigh prop; reads at 128 px as a red tub on curled runners.
 * Size: 0.9 wide x 2.0 long x about 1.1 tall; runners on y 0, bow toward +Z.
 * One idea: high scroll curling up and back over the front of a chunky red body.
 * Shape language: round, chunky, soft bevels.
 * Palette: red #b03a2a, green cushion #2f5a3a, gold #d9a83a, iron #4a4f55, walnut #6b4226.
 * Materials: red lacquered wood, cushion, gold trim/buttons, iron runners, wood seat.
 * Detail: hollow body, scroll, bench, buttons, gold band, runners, struts.
 */
const RED = rgb('#b03a2a');
const RED_DARK = rgb('#8a2c20');
const GOLD = rgb('#d9a83a');
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'sleigh',
  description: 'A red sleigh with a curled scroll bow, green bench cushion with gold buttons, and two iron runners.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    const Y0 = 0.4; // body center, spans 0.15..0.65
    const outer = sdf.box([0.9, 0.5, 2.0], 0.12).at(0, Y0, 0);
    const inner = sdf.box([0.78, 0.5, 1.88], 0.08).at(0, Y0 + 0.06, 0);
    const cutTop = sdf.box([2, 0.5, 4], 0).at(0, 0.65 - 0.25, 0);
    const shell = sdf.subtract(outer, inner).intersect(cutTop);
    // scroll: rises from the front corners, curls back
    const scrollPts: [number, number, number, number][] = [
      [0, 0.45, 0.85, 0.09],
      [0, 0.55, 1.02, 0.08],
      [0, 0.75, 1.1, 0.07],
      [0, 0.95, 1.05, 0.06],
      [0, 1.08, 0.93, 0.055],
      [0, 1.06, 0.82, 0.05],
      [0, 0.97, 0.78, 0.045],
    ];
    const side = (x: number) =>
      sdf.chain(scrollPts.map(([, y, z, r]) => [x, y, z, r] as [number, number, number, number]), 0.04);
    const scroll = sdf.union(side(0.36), side(-0.36));
    const front = sdf.box([0.8, 0.5, 0.1], 0.04).at(0, 0.7, 1.0).intersect(sdf.box([2, 0.6, 4]).at(0, 0.8, 0));
    const hull = sdf.smoothUnion(0.05, shell, scroll, front);
    const paint = (x: number, y: number, z: number) => {
      let c = mixRgb(RED, RED_DARK, 0.25 * (0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2)));
      c = mixRgb(c, RED_DARK, 0.4 * clamp01((0.3 - y) / 0.12));
      if (y > 0.5 && y < 0.56 && (Math.abs(x) > 0.36 || z > 0.9)) c = GOLD;
      if (y > 0.62 && y < 0.68 && Math.abs(x) > 0.32) c = mixRgb(c, GOLD, 0.8);
      return c;
    };
    k.body('hull', hull.paintFn(paint), {
      color: '#b03a2a', roughness: 0.6, metalness: 0, detail: 0.008,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 30, y * 10, z * 30, 2),
      maxTriangles: 6000,
    });

    // bench + cushion
    k.body('bench', sdf.box([0.78, 0.2, 0.44], 0.03).at(0, 0.45, -0.1), {
      color: '#6b4226', roughness: 0.8, metalness: 0, detail: 0.008, maxTriangles: 600,
    });
    const cushion = sdf.box([0.74, 0.12, 0.42], 0.05).at(0, 0.61, -0.1);
    k.body('cushion', cushion, {
      color: '#2f5a3a', roughness: 0.9, metalness: 0, detail: 0.006,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 25, y * 25, z * 25, 2),
      maxTriangles: 1500,
    });
    const btns = [-0.24, -0.08, 0.08, 0.24].map((x) => sdf.sphere(0.03).at(x, 0.675, -0.1));
    k.body('buttons', sdf.union(...btns), {
      color: '#d9a83a', roughness: 0.35, metalness: 0.8, detail: 0.004, maxTriangles: 500,
    });

    // runners + struts
    const runner = sdf
      .smoothUnion(
        0.03,
        sdf.capsule([0.38, 0.035, -0.95], [0.38, 0.035, 0.85], 0.035),
        sdf.chain([[0.38, 0.035, 0.8, 0.035], [0.38, 0.09, 1.0, 0.033], [0.38, 0.22, 1.1, 0.03], [0.38, 0.38, 1.08, 0.03]], 0.03),
      )
      .mirror('x', 0);
    k.body('runners', runner, {
      color: '#4a4f55', roughness: 0.5, metalness: 0.8, detail: 0.004, maxTriangles: 2500,
    });
    const strut = sdf.box([0.86, 0.09, 0.1], 0.02);
    const struts = sdf.union(strut.at(0, 0.11, 0.55), strut.at(0, 0.11, -0.6));
    k.body('struts', struts, {
      color: '#6b4226', roughness: 0.8, metalness: 0, detail: 0.006, maxTriangles: 800,
    });
  },
});
