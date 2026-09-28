import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — wooden balcony on a cottage wall (architecture/building-parts/balcony).
 *
 * Role: background architecture piece for the chibi hamlet; must read at 128 px sprite.
 * Size: 2.0 m wide, sticks out 0.9 m from the wall at z = 0, floor top at y = 1.0.
 * One idea: a warm honey-oak balcony whose curved carved brackets and turned balusters
 *   read clearly against a plain cream plaster wall panel.
 * Shape language: square dominant (plank floor, rails, wall) with round secondary
 *   (scrolled brackets, turned balusters, ball-topped newel posts).
 * Palette: honey oak #b5814a (floor, dominant), warm brown #8a5a35 (railing),
 *   dark walnut #6b4226 (brackets, trims), pale cut wood #c9a06a (balusters, box);
 *   leaf green #5cb85c foliage, straw #e0bb60 flowers, iron #4a4f55 rods.
 * Materials: wood (roughness 0.82), plaster wall (0.95), worn iron (0.5 / 0.7),
 *   foliage (0.85), flowers (0.6).
 * Detail: floor planks (painted gaps + grain bump), scrolled brackets, turned balusters,
 *   flower box with foliage + straw flowers. Focal point: the flower box.
 * Rig/animation: none (static architecture).
 */

const HONEY = rgb('#b5814a');
const HONEY_LIGHT = rgb('#c9a06a');
const WARM_BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const GAP = rgb('#4e3018');
const PLASTER = rgb('#ece2cc');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#3f8a3f');
const STRAW = rgb('#e0bb60');

const FLOOR_Y = 0.97; // floor slab center (top at 1.0)
const RAIL_Z = 0.84;

export default defineAsset({
  name: 'balcony',
  description:
    'Wooden balcony on a plaster wall: plank floor on two carved scrolled brackets, railing with turned balusters, and a flower box.',
  detail: 0.008,
  reference: 'docs/item-mockups/balcony-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wall
    // Plain cream plaster panel the balcony hangs on; grounds the back view.
    const wallShape = sdf.box([2.3, 1.75, 0.12], 0.02).at(0, 0.875, -0.06);
    k.body(
      'wall',
      wallShape.paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
        return mixRgb(PLASTER, rgb('#ded1b6'), 0.35 * n);
      }),
      {
        color: '#ece2cc',
        roughness: 0.95,
        metalness: 0,
        detail: 0.014,
        maxTriangles: 300,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 22, y * 22, z * 22, 2),
      },
    );

    // ------------------------------------------------------------------ floor
    // Plank slab, 2.0 x 0.9 m; boards run along Z, gaps + per-board tint painted.
    const floorShape = sdf.box([2.0, 0.06, 0.9], 0.012).at(0, FLOOR_Y, 0.45);
    const BOARD_W = 0.115;
    const floorPaint = (x: number, y: number, z: number) => {
      const u = (x + 1.0) / BOARD_W;
      const idx = Math.floor(u);
      const f = u - idx;
      const gap = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 8);
      const tint = noise.random(idx, 3, 1);
      const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 6, z * 3, 2);
      let c = mixRgb(HONEY, HONEY_LIGHT, 0.15 + 0.3 * tint);
      c = mixRgb(c, HONEY, 0.3 * grain);
      c = mixRgb(c, GAP, 0.7 * gap);
      // Sunlit top face, darker underside and end grain.
      c = mixRgb(c, WALNUT, y < FLOOR_Y - 0.02 ? 0.35 : 0);
      c = mixRgb(c, WALNUT, 0.25 * Math.max(0, (Math.abs(x) - 0.93) / 0.07));
      return c;
    };
    k.body('floor', floorShape.paintFn(floorPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.01,
      paintWeight: 1,
      maxTriangles: 900,
      bump: (x, y, z) => {
        const u = (x + 1.0) / BOARD_W;
        const f = u - Math.floor(u);
        const gap = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 8);
        return -0.0022 * gap + 0.0014 * noise.fbm(x * 26, y * 8, z * 4, 2);
      },
    });

    // Ledger beam where the floor meets the wall.
    const ledger = sdf.box([2.0, 0.075, 0.05], 0.012).at(0, 0.885, 0.03);
    k.body('ledger', ledger, {
      color: '#6b4226',
      roughness: 0.82,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 200,
    });

    // ------------------------------------------------------------------ brackets
    // Two carved scrolled corbels: a tapered chain curling from the wall base
    // up to the floor underside. Dark walnut so they read against the wall.
    const bracket = sdf.chain(
      [
        [0, 0.3, 0.03, 0.05],
        [0, 0.22, 0.05, 0.055],
        [0, 0.32, 0.2, 0.06],
        [0, 0.6, 0.38, 0.06],
        [0, 0.88, 0.46, 0.05],
        [0, 0.94, 0.36, 0.035],
      ],
      0.04,
    );
    k.body('brackets', bracket.at(0.7, 0, 0).mirror('x', 0), {
      color: '#6b4226',
      roughness: 0.82,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 800,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 20, y * 20, z * 20, 2),
    });

    // Iron support rods flanking the center, wall to floor front underside.
    const rod = sdf.capsule([0, 0.34, 0.03], [0, 0.92, 0.62], 0.017);
    const rods = sdf.union(
      rod.at(-0.22, 0, 0),
      rod.at(0.22, 0, 0),
      // bolt heads where the rods meet the floor
      sdf.sphere(0.024).at(-0.22, 0.915, 0.615),
      sdf.sphere(0.024).at(0.22, 0.915, 0.615),
    );
    k.body('iron-rods', rods, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.01,
      maxTriangles: 400,
    });

    // ------------------------------------------------------------------ railing
    // Chunky rails + five turned balusters + ball-capped newel posts, one body.
    const topRail = sdf.box([1.92, 0.07, 0.1], 0.02).at(0, 1.47, RAIL_Z);
    const bottomRail = sdf.box([1.92, 0.055, 0.07], 0.015).at(0, 1.05, RAIL_Z);

    // Turned baluster: revolved vase profile, 0.37 m tall.
    const balusterProfile = profile.polygon(
      [
        [0.033, 0.0],
        [0.035, 0.015],
        [0.02, 0.06],
        [0.035, 0.115],
        [0.021, 0.185],
        [0.036, 0.25],
        [0.021, 0.315],
        [0.035, 0.35],
        [0.028, 0.37],
        [0.001, 0.37],
      ],
      { smooth: true, samples: 12 },
    );
    const balusterProto = sdf.revolve(balusterProfile).at(0, 1.075, RAIL_Z);
    const balusters = sdf.union(
      ...[-0.72, -0.36, 0, 0.36, 0.72].map((x) => balusterProto.at(x, 0, 0)),
    );

    const newel = sdf.smoothUnion(
      0.02,
      sdf.box([0.1, 0.56, 0.1], 0.018).at(0, 1.26, RAIL_Z),
      sdf.sphere(0.058).at(0, 1.575, RAIL_Z),
    );
    const railing = sdf.union(
      topRail,
      bottomRail,
      balusters,
      newel.at(0.94, 0, 0).mirror('x', 0),
    );
    k.body(
      'railing',
      railing.paintFn((x, y, z) => {
        // Pale cut wood on the turned balusters and newel balls, warm brown elsewhere.
        if (y < 1.5 && y > 1.07 && Math.abs(z - RAIL_Z) < 0.045 && Math.abs(x) < 0.86)
          return mixRgb(HONEY_LIGHT, HONEY, 0.3 * (0.5 + 0.5 * noise.fbm(x * 8, y * 30, z * 8, 2)));
        if (y > 1.53) return mixRgb(HONEY_LIGHT, WARM_BROWN, 0.25);
        return mixRgb(WARM_BROWN, WALNUT, 0.2 * (0.5 + 0.5 * noise.fbm(x * 5, y * 20, z * 5, 2)));
      }),
      {
        color: '#8a5a35',
        roughness: 0.82,
        metalness: 0,
        detail: 0.009,
        paintWeight: 1,
        maxError: 0.008,
        maxTriangles: 1200,
        bump: (x, y, z) => 0.0014 * noise.fbm(x * 24, y * 10, z * 24, 2),
      },
    );

    // ------------------------------------------------------------------ flower box
    // Pale planter on the floor against the railing, offset for a lived-in look.
    const BOX_X = 0.3;
    const boxShape = sdf.box([0.6, 0.19, 0.22], 0.02).at(BOX_X, 1.095, 0.68);
    const boxPaint = boxShape
      .paintWhere(
        sdf.box([0.64, 0.03, 0.26]).at(BOX_X, 1.17, 0.68),
        WALNUT,
        0.008,
      )
      .paintWhere(
        sdf.box([0.64, 0.035, 0.26]).at(BOX_X, 1.02, 0.68),
        WALNUT,
        0.008,
      )
      .paintFn((x, y, z) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 26, y * 8, z * 8, 2);
        return mixRgb(HONEY_LIGHT, HONEY, 0.35 * grain);
      });
    k.body('flower-box', boxPaint, {
      color: '#c9a06a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.008,
      paintWeight: 1,
      maxTriangles: 550,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 26, y * 8, z * 8, 2),
    });

    // Dark soil filling the planter top.
    const soil = sdf.box([0.57, 0.035, 0.21], 0.012).at(BOX_X, 1.185, 0.68);
    k.body('soil', soil, {
      color: '#4a2c16',
      roughness: 0.95,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 150,
    });

    // Leafy clumps spilling over the box edges.
    const leafProto = sdf.ellipsoid([0.13, 0.09, 0.11]);
    const foliage = sdf.smoothUnion(
      0.05,
      leafProto.at(BOX_X - 0.16, 1.27, 0.66),
      leafProto.at(BOX_X + 0.02, 1.31, 0.7),
      leafProto.at(BOX_X + 0.19, 1.27, 0.66),
      leafProto.at(BOX_X - 0.02, 1.26, 0.6),
      sdf.ellipsoid([0.1, 0.07, 0.09]).at(BOX_X + 0.1, 1.24, 0.78),
    );
    k.body(
      'foliage',
      foliage.paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
        return mixRgb(LEAF, LEAF_DARK, 0.45 * n);
      }),
      {
        color: '#5cb85c',
        roughness: 0.85,
        metalness: 0,
        detail: 0.012,
        paintWeight: 1,
        maxTriangles: 600,
        bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 30, z * 30, 2),
      },
    );

    // Straw-yellow flower dots on top of the foliage.
    const flowers = sdf.union(
      sdf.sphere(0.032).at(BOX_X - 0.2, 1.35, 0.68),
      sdf.sphere(0.03).at(BOX_X + 0.05, 1.4, 0.72),
      sdf.sphere(0.032).at(BOX_X + 0.24, 1.34, 0.66),
      sdf.sphere(0.026).at(BOX_X - 0.05, 1.36, 0.58),
      sdf.sphere(0.026).at(BOX_X + 0.14, 1.33, 0.79),
    );
    k.body('flowers', flowers, {
      color: '#e0bb60',
      roughness: 0.6,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 200,
    });
  },
});
