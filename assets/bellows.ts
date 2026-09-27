import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — hand bellows (props/craft-and-trade/bellows).
 *
 * Role: blacksmith-shop prop that feeds the forge; reads at 128 px as one
 *   stout little leather pump sitting on the stone floor.
 * Size: ~0.34 m long (nozzle tip to handle ends), 0.12 m wide, 0.19 m tall
 *   at the hinged back; stands on y = 0, nozzle facing +Z.
 * One idea: a chunky teardrop wedge — two thick walnut paddles closed to a
 *   point at the brass nozzle and opened at the back hinge, with two stacked
 *   tan leather bags puffing out of the gap between them.
 * Shape language: round dominant (puffy leather, rounded paddle corners),
 *   square secondary (thick board slabs, blocky handle grips).
 * Palette: leather tan #8a5a35 (dominant, the bags), walnut #6b4226 / #54331d
 *   (boards + handles), brass #caa24a (nozzle accent), iron #4a4f55 (nails,
 *   rivets); charcoal soot stain near the nozzle.
 * Value plan: dark bottom board + shaded bag underside, sun-lit top board
 *   and bag top, bright brass accent — strong top/bottom contrast so the
 *   wedge reads at 128 px.
 * Materials: leather roughness 0.62, walnut wood 0.8, brass metalness 1
 *   roughness 0.3, worn iron metalness 0.7 roughness 0.55. Grain in bump.
 * Detail: primary = 2 boards + 2 wedge bags + nozzle; secondary = handles,
 *   hinge straps; tertiary = waist seam, soot, nails, grain bump.
 * Rig/animation: none — static prop.
 */

const LEATHER = rgb('#8a5a35');
const LEATHER_LIGHT = rgb('#b98a55');
const LEATHER_DARK = rgb('#6e4527');
const STRAP = '#563720'; // oiled dark leather for the hinge straps
const WALNUT = rgb('#6b4226');
const WALNUT_DARK = rgb('#54331d');
const WALNUT_LIGHT = rgb('#8a6540');
const BRASS = '#caa24a';
const IRON = '#4a4f55';
const CHARCOAL = rgb('#2e2a26');

const TILT = 22; // wedge angle: top board closes toward the nozzle (deg)
const SLOPE = Math.tan((TILT * Math.PI) / 180); // underside: y = Y0 - SLOPE * z
const TOP_Y = 0.128; // top-board center height at z = 0 (front low, back high)
const BOTTOM_T = 0.035; // bottom board thickness

// Teardrop plan (U = X half-width, V = Z length): wide blunt paddle at the
// back hinge, narrow tip at the nozzle. Shared by both boards and the bags.
const TEARDROP = profile.polygon(
  [
    [0.0, 0.15],
    [0.023, 0.142],
    [0.046, 0.112],
    [0.055, 0.068],
    [0.057, 0.012],
    [0.056, -0.04],
    [0.052, -0.08],
    [0.048, -0.105],
    [0.045, -0.118],
    [0.04, -0.128],
    [0.0, -0.134],
    [-0.04, -0.128],
    [-0.045, -0.118],
    [-0.048, -0.105],
    [-0.052, -0.08],
    [-0.056, -0.04],
    [-0.057, 0.012],
    [-0.055, 0.068],
    [-0.046, 0.112],
    [-0.023, 0.142],
  ],
  { smooth: true },
);

/**
 * A leather bag as a slab of the teardrop plan, trimmed into a wedge by
 * planes: flat bottom on the lower board, sloped top just under the top
 * board. Slightly wider than the boards so a tan rim peeks out.
 */
const wedgeBag = (yBottom: number, yTop: number, topSloped: boolean) => {
  let bag: sdf.Shape = sdf
    .extrude(TEARDROP, 0.14, 0.009)
    .scale([1.04, 1, 1])
    .rotateX(90)
    .at(0, 0.14, 0)
    .intersect(sdf.halfSpace([0, -1, 0], -yBottom))
    .intersect(sdf.halfSpace([0, 1, 0], yTop));
  if (topSloped) {
    bag = bag.intersect(sdf.halfSpace([0, 1, SLOPE], TOP_Y - 0.03 - 0.002));
  }
  return bag.displace(0.0025, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 2));
};

/** Walnut grain along the board length (z), per-board tint, soft patches. */
const walnutPaint =
  (seed: number, y0: number, y1: number, dark: number, light: number) =>
  (x: number, y: number, z: number): readonly [number, number, number] => {
    const tint = noise.random(seed, 3);
    const grain = 0.5 + 0.5 * noise.fbm(x * 18, y * 30, z * 7, 2);
    const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
    // Keep the boards clearly darker than the tan bag; the sun-lit lift on
    // the top face gives the value stack dark / mid / light down the wedge.
    let c = mixRgb(WALNUT, WALNUT_DARK, dark + 0.28 * tint + 0.2 * grain);
    const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0)));
    c = mixRgb(c, WALNUT_LIGHT, light * t * t + 0.06 * patch);
    return c;
  };

const walnutBump = (x: number, y: number, z: number) =>
  0.0012 * noise.fbm(x * 22, y * 34, z * 8, 2);

export default defineAsset({
  name: 'bellows',
  description:
    'Stout hand bellows: two walnut boards squeezing stacked tan leather bags, brass nozzle, leather hinge straps.',
  detail: 0.005,
  reference: 'reference/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- bags
    // Two stacked teardrop leather bags fill the wedge gap between the
    // boards and puff a rim past the paddle edges. The waist seam between
    // them and the charcoal soot by the nozzle sell the "pump" read.
    const lowerBag = wedgeBag(0.033, 0.084, false);
    const upperBag = wedgeBag(0.078, 0.16, true);
    const waist = sdf.box([0.3, 0.012, 0.3], 0.005).at(0, 0.081, 0);
    const sootLow = sdf.sphere(0.04).at(0, 0.055, 0.11);
    const sootHigh = sdf.sphere(0.028).at(0, 0.09, 0.1);
    const bagPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
      let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.06 + 0.16 * patch);
      // Strong sun-lit top vs deep shaded underside so the wedge value plan
      // reads against the dark boards.
      c = mixRgb(c, LEATHER_LIGHT, 0.4 * Math.min(1, Math.max(0, (y - 0.06) / 0.08)));
      c = mixRgb(c, LEATHER_DARK, 0.5 * Math.min(1, Math.max(0, (0.05 - y) / 0.05)));
      return c;
    };
    k.body(
      'bag',
      lowerBag
        .smoothUnion(0.008, upperBag)
        .paintFn(bagPaint)
        .paintWhere(waist, mixRgb(LEATHER_DARK, CHARCOAL, 0.2), 0.01)
        .paintWhere(sootLow, mixRgb(LEATHER_DARK, CHARCOAL, 0.55), 0.02)
        .paintWhere(sootHigh, mixRgb(LEATHER_DARK, CHARCOAL, 0.45), 0.018),
      {
        color: '#8a5a35',
        roughness: 0.62,
        metalness: 0,
        detail: 0.005,
        paintWeight: 2,
        bump: (x, y, z) => 0.0014 * noise.fbm(x * 34, y * 34, z * 34, 3),
        maxTriangles: 1700,
      },
    );

    // ---------------------------------------------------------------- boards
    // Bottom walnut paddle lies flat on y = 0 with its chunky handle. Top
    // paddle is the same teardrop, tilted into the closing wedge, handle
    // kicked up behind.
    const bottomBoard = sdf.smoothUnion(
      0.012,
      sdf.extrude(TEARDROP, BOTTOM_T, 0.007).rotateX(90).at(0, BOTTOM_T, 0),
      sdf.capsule([0, 0.016, -0.1], [0, 0.016, -0.148], 0.016),
    );
    k.body('bottom-board', bottomBoard.paintFn(walnutPaint(4, 0.0, BOTTOM_T, 0.55, 0.08)), {
      color: '#54331d',
      roughness: 0.8,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      bump: walnutBump,
      maxTriangles: 700,
    });

    const topBoard = sdf.smoothUnion(
      0.012,
      sdf
        .extrude(TEARDROP, 0.03, 0.007)
        .rotateX(90)
        .rotateX(TILT)
        .at(0, TOP_Y, 0.006),
      sdf.capsule([0, 0.156, -0.1], [0, 0.184, -0.152], 0.0165),
    );
    const boardSoot = sdf.sphere(0.03).at(0, 0.085, 0.12);
    k.body(
      'top-board',
      topBoard
        .paintFn(walnutPaint(9, 0.1, 0.18, 0.22, 0.34))
        .paintWhere(boardSoot, mixRgb(WALNUT_DARK, CHARCOAL, 0.5), 0.018),
      {
        color: '#6b4226',
        roughness: 0.8,
        metalness: 0,
        detail: 0.006,
        paintWeight: 2,
        bump: walnutBump,
        maxTriangles: 700,
      },
    );

    // ---------------------------------------------------------------- nozzle
    // Brass tube pinched between the board tips at the front, tapering out
    // and slightly up.
    const nozzle = sdf.cone([0, 0.04, 0.085], [0, 0.058, 0.185], 0.021, 0.008);
    k.body(
      'nozzle',
      nozzle.paintWhere(
        sdf.sphere(0.013).at(0, 0.057, 0.179),
        mixRgb(rgb(BRASS), CHARCOAL, 0.5),
        0.01,
      ),
      {
        color: BRASS,
        roughness: 0.3,
        metalness: 1,
        detail: 0.0045,
        maxTriangles: 350,
      },
    );

    // ---------------------------------------------------------------- straps
    // Leather hinge straps wrap the back paddle: a vertical band down the
    // rear face plus a flap lying on the tilted top board, either side of
    // the centered handles.
    const strap = (x: number) =>
      sdf.smoothUnion(
        0.006,
        sdf.box([0.03, 0.15, 0.014], 0.005).at(x, 0.075, -0.1185),
        sdf.box([0.03, 0.011, 0.05], 0.004).rotateX(TILT).at(x, 0.172, -0.1),
      );
    k.body('hinge-straps', sdf.union(strap(-0.032), strap(0.032)), {
      color: STRAP,
      roughness: 0.66,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 250,
    });

    // ---------------------------------------------------------------- nails
    // Iron nails along the bottom-board edges and rivets through the straps.
    const sideNails = [-0.02, 0.05, 0.1].map((z) => sdf.sphere(0.006).at(0.054, 0.0175, z));
    const strapRivets = [-0.032, 0.032].map((x) => sdf.sphere(0.0055).at(x, 0.1, -0.127));
    k.body('nails', sdf.union(...sideNails, ...strapRivets).mirror('x', 0), {
      color: IRON,
      roughness: 0.55,
      metalness: 0.7,
      detail: 0.0035,
      maxTriangles: 120,
    });
  },
});
