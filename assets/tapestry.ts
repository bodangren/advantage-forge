import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — wall tapestry (catalog `props/furniture/tapestry`).
 *
 * Role: tavern wall dressing in the warm firelit hamlet set; must read at 128 px sprite.
 * Size: cloth 1.0 m wide, about 1.4 m tall with the rod; back plane z = 0, lowest
 *   tassel tip at y = 0 (the scene lifts it to wall height). Front faces +Z.
 * One idea: a prized hunt banner — deep red cloth rolled over a chunky wooden rod,
 *   framed by a gold brocade border, with a proud stag head as the single focal point.
 * Shape language: round dominant (rolled top, wavy hem, teardrop tassels, chunky knob
 *   ends), square secondary (calm straight cloth sides as rest areas).
 * Palette: fabric red #9a4a3a dominant, deep shade #6e3126, lifted #b05a44 halo;
 *   gold #d9a93a accent (border); wood family — honey #b5814a (stag), warm brown
 *   #8a5a35 (rod, antlers), pale cut wood #c9a06a (knobs), walnut #6b4226 (collars).
 * Materials: red cloth (rough 0.88, metal 0), gold brocade (rough 0.42, metal 0.5),
 *   oak rod (rough 0.8), pale wood knobs (rough 0.75). Weave and soft cloth rolls live
 *   in `bump` only; the silhouette waves come from the outline profile, not displacement.
 * Detail: primary red drape + gold border + roll; secondary stag emblem, hem tassels,
 *   rod knobs; tertiary weave and grain in bump. Focal point: the stag head on the red
 *   field, framed by the brightest gold in the asset.
 * Rig/animation: none (static wall prop).
 */

const RED = rgb('#9a4232');
const RED_DEEP = rgb('#6b2818');
const RED_LIFT = rgb('#b05038');
const GOLD = '#cf9c33';
const GOLD_DEEP = '#9c701f';
const HONEY = rgb('#b5814a');
const OAK = rgb('#8a5a35');
const OAK_DARK = rgb('#6b4226');
const PALE = '#c9a06a';

// Rod axis: the cloth back sits at z = 0, the roll wraps the rod in front of it.
const ROD_Y = 1.36;
const ROD_Z = 0.048;

const hemY = (x: number, base: number, amp: number, wl: number, phase: number) =>
  base + amp * Math.sin((x / wl) * Math.PI * 2 + phase);

/**
 * Cloth slab outline in XY: straight top (tucks under the roll), calm slightly
 * tapered sides, gently wavy hem. Sampled densely so the polygon stays exact;
 * meshing rounds the corners into soft bevels.
 */
const drapeProfile = (
  halfW: number,
  topY: number,
  base: number,
  amp: number,
  wl: number,
  phase: number,
  taper: number,
) => {
  const bot = halfW - taper;
  const y = (x: number) => hemY(x, base, amp, wl, phase);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 20; i++) pts.push([-halfW + (2 * halfW * i) / 20, topY]);
  pts.push([halfW, (topY + y(bot)) / 2]);
  for (let i = 0; i <= 48; i++) {
    const x = bot - (2 * bot * i) / 48;
    pts.push([x, y(x)]);
  }
  pts.push([-halfW, (topY + y(bot)) / 2]);
  return profile.polygon(pts);
};

export default defineAsset({
  name: 'tapestry',
  description:
    'Wall tapestry on a wooden rod with knob ends: deep red cloth with a gold brocade border, a carved stag head, and a wavy hem with tassels.',
  detail: 0.006,
  reference: 'docs/item-mockups/tapestry-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- gold border
    // Backing brocade layer, visible as a frame around the red cloth on three
    // sides; its top edge hides inside the roll. Sits proud of nothing: the red
    // drape in front of it is thicker, so the border reads as a flat edging.
    const borderShape = sdf.extrude(
      drapeProfile(0.478, 1.325, 0.098, 0.016, 0.26, 2.1, 0.02),
      0.022,
      0.005,
    );
    k.body(
      'border',
      borderShape.paintFn((x, y, z) =>
        mixRgb(rgb(GOLD), rgb(GOLD_DEEP), 0.15 + 0.2 * noise.fbm(x * 14, y * 14, z * 14, 2)),
      ),
      {
        color: GOLD,
        roughness: 0.55,
        metalness: 0.3,
        detail: 0.01,
        textureDensity: 1,
        bump: (x, y, z) => 0.0006 * noise.fbm(x * 90, y * 90, z * 90, 2),
        maxTriangles: 600,
      },
    );

    // ---------------------------------------------------------------- red drape
    // The main cloth: wavy-hem slab plus the roll that wraps over the rod.
    const slab = sdf.extrude(drapeProfile(0.44, 1.33, 0.055, 0.028, 0.21, 0.9, 0.018), 0.03, 0.006);
    const roll = sdf.cylinder(0.048, 1.0, 0.01).rotateZ(90).at(0, ROD_Y, ROD_Z);
    const clothPaint = (x: number, y: number, z: number) => {
      let c = RED;
      c = mixRgb(c, RED_DEEP, 0.14 * (0.5 + 0.5 * noise.fbm(x * 3, y * 3, z * 3, 2)));
      // Small lifted halo just behind the stag: the emblem keeps the strongest contrast.
      const r = Math.hypot(x / 0.24, (y - 0.79) / 0.36);
      c = mixRgb(c, RED_LIFT, 0.25 * Math.max(0, 1 - r));
      // Strong contact shade under the roll, deep shade toward the hem.
      c = mixRgb(c, RED_DEEP, 0.42 * Math.max(0, (y - 1.14) / 0.19));
      c = mixRgb(c, RED_DEEP, 0.38 * Math.max(0, (0.18 - y) / 0.18));
      // The roll catches the firelight on top.
      if (y > 1.382) c = mixRgb(c, RED_LIFT, 0.45 * Math.min(1, (y - 1.382) / 0.026));
      return c;
    };
    k.body('cloth', sdf.smoothUnion(0.008, slab, roll).paintFn(clothPaint), {
      color: '#9a4a3a',
      roughness: 0.88,
      metalness: 0,
      detail: 0.008,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0022 * noise.fbm(x * 8, y * 2.8, z * 8, 2) +
        0.0006 * noise.fbm(x * 150, y * 150, z * 150, 2),
      maxTriangles: 1000,
    });

    // ---------------------------------------------------------------- rod + ends
    const rod = sdf.cylinder(0.026, 1.12, 0.008).rotateZ(90).at(0, ROD_Y, ROD_Z);
    k.body('rod', rod, {
      color: '#8a5a35',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 6, y * 70, z * 70, 2),
      maxTriangles: 240,
    });

    // Turned knob ends: walnut collar ring against the roll, chunky pale disc.
    const collarR = sdf.cylinder(0.041, 0.018, 0.005).rotateZ(90).at(0.545, ROD_Y, ROD_Z);
    const knobR = sdf.ellipsoid([0.034, 0.06, 0.06]).at(0.578, ROD_Y, ROD_Z);
    k.body(
      'knobs',
      sdf.union(collarR, knobR)
        .mirror('x', 0)
        .paintWhere(collarR.mirror('x', 0).round(0.002), OAK_DARK, 0.003),
      { color: PALE, roughness: 0.75, metalness: 0, detail: 0.008, maxTriangles: 500 },
    );

    // -------------------------------------------------------------- stag emblem
    // Chunky rounded head, proud of the cloth so the side view keeps a silhouette.
    const skull = sdf.ellipsoid([0.14, 0.16, 0.0475]).at(0, 0.79, 0.062);
    const muzzle = sdf.ellipsoid([0.088, 0.1, 0.04]).at(0, 0.6875, 0.064);
    const ear = sdf.cone([0.095, 0.84, 0.056], [0.17, 0.915, 0.048], 0.033, 0.01).mirror('x', 0);
    const stagPaint = (x: number, y: number, z: number) => {
      let c = HONEY;
      c = mixRgb(c, OAK, 0.3 * Math.max(0, (0.75 - y) / 0.12));
      c = mixRgb(c, OAK, 0.12 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2)));
      return c;
    };
    k.body(
      'stag',
      sdf
        .union(sdf.smoothUnion(0.02, skull, muzzle), ear)
        .paintFn(stagPaint)
        .paintWhere(sdf.sphere(0.024).at(0, 0.665, 0.092), '#3a2414', 0.005)
        .paintWhere(sdf.sphere(0.015).at(0.056, 0.8225, 0.096).mirror('x', 0), '#241610', 0.004),
      {
        color: '#b5814a',
        roughness: 0.75,
        metalness: 0,
        detail: 0.005,
        textureDensity: 2,
        paintWeight: 2,
        maxTriangles: 800,
      },
    );

    // Antlers: thick curved beam with two top tines and an inward brow tine.
    const antler = sdf
      .smoothUnion(
        0.01,
        sdf.chain(
          [
            [0.045, 0.87, 0.048, 0.025],
            [0.1375, 0.969, 0.046, 0.019],
            [0.19, 1.058, 0.044, 0.014],
          ],
          0.014,
        ),
        sdf.cone([0.1375, 0.969, 0.046], [0.125, 1.101, 0.041], 0.016, 0.008),
        sdf.cone([0.19, 1.058, 0.044], [0.231, 1.17, 0.042], 0.0125, 0.007),
        sdf.cone([0.069, 0.901, 0.048], [0.025, 1.001, 0.044], 0.014, 0.0075),
      )
      .mirror('x', 0);
    k.body('antlers', antler, {
      color: '#8a5a35',
      roughness: 0.8,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 400,
    });

    // ------------------------------------------------------------------ tassels
    // Chunky teardrop tassels hang from the hem, tips at y = 0.
    const tasselAt = (x: number) =>
      sdf.chain(
        [
          [x, 0.095, 0.018, 0.014],
          [x, 0.05, 0.018, 0.021],
          [x, 0.012, 0.018, 0.011],
        ],
        0.014,
      );
    const tassels = sdf.union(...[-0.33, -0.165, 0, 0.165, 0.33].map(tasselAt));
    k.body('tassels', tassels, {
      color: '#8a3a2a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 320,
    });
  },
});
