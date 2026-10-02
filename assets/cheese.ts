import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

// Design note — cheese wheel on a board (props/food/cheese).
// - Role: tavern table prop / market food; must read at 128 px as one stout
//   wheel with a missing slice.
// - Size: wheel 0.32 m diameter x 0.14 m tall on a 0.42 x 0.04 x 0.42 m board;
//   stands on y = 0, wheel axis on Y, wedge cut facing +Z.
// - One idea: a pale cream wheel with a thick warm rind band top and bottom,
//   one ~60 degree wedge sliced out at the front showing the soft interior.
// - Shape language: round dominant (stout cylinder, round holes, soft bevels),
//   square secondary (plank board).
// - Palette: cream #f4e4a4 (dominant), rind #d49a3a (secondary, darker mottle),
//   board honey oak #b5814a with dark seams #7a4e26. Focal: the cut faces.
// - Materials: cheese matte-waxy (roughness 0.62), oak board (roughness 0.8);
//   grain and plank gaps in `bump` only.
// - Detail: wheel with rind bands + wedge cut + faint carved holes; plank board.
// - Rig/animation: none (static prop).

const CREAM = rgb('#f4e4a4');
const CREAM_SHADE = rgb('#e4d18c');
const RIND = rgb('#d49a3a');
const RIND_DARK = rgb('#b0762a');
const RIND_LIGHT = rgb('#e2b356');
const OAK = rgb('#b5814a');
const OAK_LIGHT = rgb('#d6a061');
const OAK_DARK = rgb('#7a4e26');

const WHEEL_CY = 0.11; // wheel center height (board top at 0.04)
const WHEEL_R = 0.16;

// Wedge cut: two half-spaces through the wheel axis at +/-30 degrees from +Z.
const C30 = Math.cos(Math.PI / 6);
const S30 = Math.sin(Math.PI / 6);
// Faint round holes carved into each cut face: dir = in-plane axis of the
// face, s = distance along the face from the wheel axis, y = height, r = radius.
const HOLES = [
  { dir: [S30, C30], s: 0.055, y: 0.105, r: 0.016 },
  { dir: [S30, C30], s: 0.11, y: 0.125, r: 0.011 },
  { dir: [S30, C30], s: 0.125, y: 0.09, r: 0.008 },
  { dir: [-S30, C30], s: 0.065, y: 0.115, r: 0.014 },
  { dir: [-S30, C30], s: 0.11, y: 0.095, r: 0.01 },
];
// Inward normal of each cut face (points into the remaining cheese).
const faceInwardNormal = (dir: number[]) =>
  (dir[0] ?? 0) > 0 ? { x: C30, z: -S30 } : { x: -C30, z: -S30 };

export default defineAsset({
  name: 'cheese',
  description:
    'A whole cream cheese wheel with a thick orange rind, one wedge cut out at the front, on a small oak board.',
  detail: 0.008,
  texture: { size: 1024 },
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',

  build(k) {
    // ------------------------------------------------------------ board
    // One thin honey-oak plank slab, three planks running along X.
    const board = sdf.box([0.42, 0.04, 0.42], 0.014).at(0, 0.02, 0);
    const boardPaint = (x: number, y: number, z: number) => {
      const f = ((z + 0.21) / 0.14) % 1;
      const seam = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * f), 6);
      const plank = Math.floor((z + 0.21) / 0.14);
      const tint = noise.random(plank, 4, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 5, z * 3 + plank * 9, 2);
      let c = mixRgb(OAK, OAK_LIGHT, 0.08 + 0.3 * tint);
      c = mixRgb(c, OAK_LIGHT, 0.08 * grain);
      c = mixRgb(c, OAK_DARK, 0.72 * seam);
      const edge = Math.max(Math.abs(x), Math.abs(z));
      c = mixRgb(c, OAK_DARK, 0.28 * Math.max(0, (edge - 0.185) / 0.035));
      c = mixRgb(c, OAK_DARK, 0.3 * Math.max(0, (0.012 - y) / 0.012));
      return c;
    };
    k.body('board', board.paintFn(boardPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.01,
      paintWeight: 2,
      maxTriangles: 400,
      bump: (x, y, z) => {
        const f = ((z + 0.21) / 0.14) % 1;
        const seam = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * f), 6);
        return -0.0026 * seam + 0.0012 * noise.fbm(x * 26, y * 6, z * 4, 2);
      },
    });

    // ------------------------------------------------------------ wheel
    // Stout cylinder, soft bevels, minus a 60 degree front wedge.
    const wheel = sdf.cylinder(WHEEL_R, 0.14, 0.014).at(0, WHEEL_CY, 0);
    const wedge = sdf.intersect(
      sdf.halfSpace([C30, 0, -S30], 0),
      sdf.halfSpace([-C30, 0, -S30], 0),
    );
    const wheelCutters = [wedge];
    for (const h of HOLES) {
      const n = faceInwardNormal(h.dir);
      const depth = h.r * 0.35; // shallow sphere center: a wide, round opening
      const cx = (h.dir[0] ?? 0) * h.s + n.x * depth;
      const cz = (h.dir[1] ?? 0) * h.s + n.z * depth;
      wheelCutters.push(sdf.sphere(h.r).at(cx, h.y, cz));
    }
    const wheelCut = sdf.subtract(wheel, ...wheelCutters);

    const wheelPaint = (x: number, y: number, z: number) => {
      // Cream body with a soft mottle and a gentle darker base.
      const mottle = 0.5 + 0.5 * noise.fbm(x * 18, y * 10, z * 18, 2);
      let c = mixRgb(CREAM, CREAM_SHADE, 0.14 * mottle);
      c = mixRgb(c, CREAM_SHADE, 0.18 * Math.max(0, (0.085 - y) / 0.085));

      // Thick rind bands on top and bottom, wavy aged edge.
      const wobT = noise.fbm(x * 24, 0.3, z * 24, 2);
      const wobB = noise.fbm(x * 24, 7.7, z * 24, 2);
      if (y > 0.152 + 0.004 * wobT || y < 0.068 - 0.004 * wobB) {
        const rMottle = 0.5 + 0.5 * noise.fbm(x * 34, y * 22, z * 34, 3);
        c = mixRgb(RIND, RIND_DARK, 0.32 * rMottle);
        c = mixRgb(c, RIND_LIGHT, 0.16 * (0.5 + 0.5 * noise.fbm(x * 52, y * 34, z * 52, 2)));
      }

      return c;
    };
    k.body('wheel', wheelCut.paintFn(wheelPaint), {
      color: '#f4e4a4',
      roughness: 0.62,
      metalness: 0,
      detail: 0.008,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 1000,
    });
  },
});
