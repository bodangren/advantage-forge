import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — alchemy apparatus (props/craft-and-trade/alchemy-apparatus).
 *
 * Role: craft/clutter prop for the warm firelit tavern scene; must read at 128 px.
 * Size: 0.8 m wide wooden stand, ~0.68 m tall overall. Stands on y = 0, faces +Z.
 * One idea: a round flask of bubbling glowing purple liquid heated by a burner
 *   flame, a coiled glass tube winding over to a second flask, two small vials.
 * Shape language: round dominant (flask bellies, coil loops, bubbles, flame),
 *   square secondary (plank stand, burner base, vial shafts).
 * Palette: honey oak #b5814a / warm brown #8a5a35 / pale cut wood #c9a06a /
 *   dark walnut #6b4226 (wood family, dominant); purple liquid emissive #a06af0
 *   on dark base #2a1245 (accent, focal); flame emissive #ff9a3c on #4a1405;
 *   teal liquid emissive #3fd4c0 on #0d2f33; pewter burner #9aa3ad.
 * Materials: wood (rough 0.82), glass (rough 0.08, opacity 0.3, metalness 0),
 *   liquids (rough 0.3, emissive 1.5 to 1.9 on dark bases), flame (rough 0.2,
 *   emissive 1.9), pewter burner (rough 0.35, metalness 0.8), cork (rough 0.85).
 * Detail: primary = plank stand + burner + 2 flasks + coil tube; secondary =
 *   flame, liquids, bubbles, vials, corks; tertiary = wood grain bump only.
 *   Focal point: the bubbling purple glow under the coiled tube.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');

const GLASS_TINT = rgb('#cfe4e8');
const GLASS_SHADE = rgb('#5e7a82');
const GLASS_HI = rgb('#ffffff');

const PURPLE = rgb('#2a1245');
const PURPLE_GLOW = rgb('#a06af0');
const TEAL = rgb('#0d2f33');
const TEAL_GLOW = rgb('#3fd4c0');
const AMBER = rgb('#4a2a05');
const AMBER_GLOW = rgb('#ffb347');
const GREEN = rgb('#14320d');
const GREEN_GLOW = rgb('#7ddf5a');

const PEWTER = rgb('#9aa3ad');
const PEWTER_DARK = rgb('#565e66');
const CORK = rgb('#b08a5a');
const CORK_DARK = rgb('#5e3e1e');

// Layout constants.
const STAND_TOP = 0.137; // top surface of the stand boards.
const FLASK_A_X = -0.19;
const FLASK_B_X = 0.16;
const FLASK_Z = -0.02; // both flasks sit slightly back, vials up front.

export default defineAsset({
  name: 'alchemy-apparatus',
  description:
    'Wooden alchemist stand with a round flask of bubbling glowing purple liquid over a pewter burner flame, a coiled glass tube leading to a second flask, and two corked vials.',
  detail: 0.006,
  reference: 'docs/item-mockups/alchemy-apparatus-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ stand (wood)
    // Four stubby feet, a slab, and an overhanging top board with plank seams.
    const feet = sdf.union(
      sdf.cylinder(0.026, 0.04, 0.008).at(-0.33, 0.02, -0.15),
      sdf.cylinder(0.026, 0.04, 0.008).at(0.33, 0.02, -0.15),
      sdf.cylinder(0.026, 0.04, 0.008).at(-0.33, 0.02, 0.15),
      sdf.cylinder(0.026, 0.04, 0.008).at(0.33, 0.02, 0.15),
    );
    const slab = sdf.box([0.74, 0.075, 0.36], 0.028).at(0, 0.0775, 0);
    const topBoard = sdf.box([0.8, 0.024, 0.42], 0.012).at(0, 0.126, 0);
    const stand = sdf.union(feet, slab, topBoard);
    const woodPaint = (x: number, y: number, z: number) => {
      let c = mixRgb(OAK, BROWN, 0.35 + 0.35 * noise.fbm(x * 5, y * 5, z * 5, 2));
      // Plank seams + per-plank tint on the top board.
      if (y > 0.115) {
        const u = (z + 0.21) / 0.105;
        const f = u - Math.floor(u);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 8);
        c = mixRgb(c, WALNUT, 0.7 * seam);
        c = mixRgb(c, PALE, 0.14 * noise.random(Math.floor(u), 3, 1));
      }
      // Sun-lit top edges, walnut shade under the slab and on the feet.
      c = mixRgb(c, PALE, 0.28 * Math.max(0, (y - 0.1) / 0.05));
      c = mixRgb(c, WALNUT, 0.55 * Math.max(0, (0.055 - y) / 0.055));
      return c;
    };
    k.body('stand', stand.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.009,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 30, y * 8, z * 4, 2),
      maxTriangles: 1200,
    });

    // ------------------------------------------------------------ burner (pewter)
    // Squat alcohol-burner base with a small chimney under flask A.
    const burnerBase = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0],
            [0.052, 0],
            [0.056, 0.008],
            [0.054, 0.032],
            [0.03, 0.042],
            [0.016, 0.048],
            [0.014, 0.062],
            [0, 0.062],
          ],
          { smooth: true },
        ),
      )
      .at(FLASK_A_X, STAND_TOP, FLASK_Z);
    const burnerPaint = (x: number, y: number, z: number) => {
      let c = mixRgb(PEWTER, PEWTER_DARK, 0.15 + 0.3 * noise.fbm(x * 20, y * 20, z * 20, 2));
      c = mixRgb(c, GLASS_HI, 0.3 * Math.max(0, (y - 0.16) / 0.05));
      return c;
    };
    k.body('burner', burnerBase.paintFn(burnerPaint), {
      color: '#9aa3ad',
      roughness: 0.35,
      metalness: 0.8,
      detail: 0.006,
      maxTriangles: 400,
    });

    // ------------------------------------------------------------ flame (emissive)
    // Teardrop flame between the burner chimney and the raised round bottom of
    // flask A, its lower half in open air so the glow reads from every view.
    const flame = sdf.smoothUnion(
      0.007,
      sdf.sphere(0.022).at(FLASK_A_X, 0.214, FLASK_Z),
      sdf.cone([FLASK_A_X, 0.2, FLASK_Z], [FLASK_A_X, 0.286, FLASK_Z], 0.017, 0.0015),
    );
    k.body('flame', flame, {
      color: '#4a1405',
      roughness: 0.2,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 1.9,
      detail: 0.005,
      maxTriangles: 300,
    });

    // ------------------------------------------------------------ flask A glass
    // Round-bottom flask with a short neck; closed top so the tube reads as
    // entering the mouth. Belly bottom hangs just above the flame.
    // Raised so its round bottom hovers just above the flame (bottom ~0.244).
    const glassAProfile = profile.polygon(
      [
        [0, 0.244],
        [0.05, 0.249],
        [0.086, 0.28],
        [0.105, 0.333],
        [0.1, 0.388],
        [0.072, 0.436],
        [0.034, 0.47],
        [0.031, 0.548],
        [0.039, 0.563],
        [0.028, 0.57],
        [0, 0.572],
      ],
      { smooth: true, samples: 14 },
    );
    const glassA = sdf.revolve(glassAProfile).at(FLASK_A_X, 0, FLASK_Z).paintFn(
      (x, y, z) => {
        const yn = (y - 0.25) / 0.33;
        let c = mixRgb(GLASS_SHADE, GLASS_TINT, Math.min(1, yn * 1.4));
        // Bright rim near the lip line.
        c = mixRgb(c, GLASS_HI, 0.4 * Math.exp(-Math.pow((y - 0.548) * 34, 2)));
        // Fixed highlight streak for a glassy read.
        const a = Math.atan2(z - FLASK_Z, x - FLASK_A_X);
        let w = Math.abs(a - 2.2);
        w = Math.min(w, Math.PI * 2 - w);
        const streak = Math.exp(-(w * w) / 0.16) * Math.sin(Math.PI * Math.min(1, yn));
        return mixRgb(c, GLASS_HI, 0.5 * streak);
      },
    );
    k.body('glass-flask-a', glassA, {
      color: '#cfe4e8',
      roughness: 0.08,
      metalness: 0,
      opacity: 0.3,
      detail: 0.0065,
      paintWeight: 2,
      maxTriangles: 850,
    });

    // ------------------------------------------------------------ liquid A (purple)
    // Fill inside the belly, clipped to a level surface, with bubble beads
    // straddling the surface so it reads as bubbling.
    const liquidABulb = sdf
      .sphere(0.09)
      .at(FLASK_A_X, 0.333, FLASK_Z)
      .intersect(sdf.halfSpace([0, 1, 0], 0.366));
    const bubbles = sdf.union(
      sdf.sphere(0.011).at(FLASK_A_X - 0.03, 0.368, FLASK_Z + 0.02),
      sdf.sphere(0.008).at(FLASK_A_X + 0.025, 0.37, FLASK_Z - 0.015),
      sdf.sphere(0.0065).at(FLASK_A_X + 0.005, 0.369, FLASK_Z + 0.033),
      sdf.sphere(0.0075).at(FLASK_A_X - 0.008, 0.37, FLASK_Z - 0.035),
    );
    const liquidA = sdf
      .smoothUnion(0.006, liquidABulb, bubbles)
      .paintFn((x, y, z) => {
        let c = mixRgb(PURPLE, PURPLE_GLOW, Math.max(0, Math.min(1, (y - 0.27) / 0.1)) * 0.55);
        // Bright halo right at the cut surface where the bubbles sit.
        c = mixRgb(c, PURPLE_GLOW, 0.45 * Math.exp(-Math.pow((y - 0.366) * 60, 2)));
        const a = Math.atan2(z - FLASK_Z, x - FLASK_A_X);
        let w = Math.abs(a - 0.9);
        w = Math.min(w, Math.PI * 2 - w);
        return mixRgb(c, PURPLE, 0.4 * Math.exp(-(w * w) / 0.6));
      });
    k.body('liquid-a', liquidA, {
      color: '#2a1245',
      roughness: 0.3,
      metalness: 0,
      emissive: '#a06af0',
      emissiveIntensity: 1.9,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 500,
    });

    // ------------------------------------------------------------ flask B glass
    // Conical Erlenmeyer-style receiver with a short neck, open to the tube.
    const glassBProfile = profile.polygon(
      [
        [0, 0.137],
        [0.07, 0.14],
        [0.088, 0.168],
        [0.058, 0.305],
        [0.044, 0.368],
        [0.028, 0.402],
        [0.027, 0.5],
        [0.034, 0.513],
        [0.024, 0.52],
        [0, 0.522],
      ],
      { smooth: true, samples: 14 },
    );
    const glassB = sdf.revolve(glassBProfile).at(FLASK_B_X, 0, FLASK_Z).paintFn(
      (x, y, z) => {
        const yn = (y - 0.14) / 0.38;
        let c = mixRgb(GLASS_SHADE, GLASS_TINT, Math.min(1, yn * 1.4));
        c = mixRgb(c, GLASS_HI, 0.4 * Math.exp(-Math.pow((y - 0.5) * 34, 2)));
        const a = Math.atan2(z - FLASK_Z, x - FLASK_B_X);
        let w = Math.abs(a - 2.2);
        w = Math.min(w, Math.PI * 2 - w);
        const streak = Math.exp(-(w * w) / 0.16) * Math.sin(Math.PI * Math.min(1, yn));
        return mixRgb(c, GLASS_HI, 0.5 * streak);
      },
    );
    k.body('glass-flask-b', glassB, {
      color: '#cfe4e8',
      roughness: 0.08,
      metalness: 0,
      opacity: 0.3,
      detail: 0.0065,
      paintWeight: 2,
      maxTriangles: 800,
    });

    // ------------------------------------------------------------ liquid B (teal)
    const liquidB = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.142],
            [0.062, 0.146],
            [0.072, 0.172],
            [0.056, 0.212],
            [0, 0.212],
          ],
          { smooth: true },
        ),
      )
      .at(FLASK_B_X, 0, FLASK_Z)
      .intersect(sdf.halfSpace([0, 1, 0], 0.213))
      .paintFn((x, y, z) => {
        let c = mixRgb(TEAL, TEAL_GLOW, Math.max(0, Math.min(1, (y - 0.16) / 0.06)) * 0.6);
        return mixRgb(c, TEAL_GLOW, 0.4 * Math.exp(-Math.pow((y - 0.212) * 70, 2)));
      });
    k.body('liquid-b', liquidB, {
      color: '#0d2f33',
      roughness: 0.3,
      metalness: 0,
      emissive: '#3fd4c0',
      emissiveIntensity: 1.5,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 450,
    });

    // ------------------------------------------------------------ coiled tube
    // Glass tube: rises from flask A's mouth, loops ~2.25 turns as a helix,
    // then dips into flask B's mouth. One smooth chain, gently tapering.
    const HELIX_CX = -0.015;
    const HELIX_R = 0.075;
    const HELIX_Y0 = 0.56;
    const HELIX_Y1 = 0.665;
    const TURNS = 2.25;
    const STEPS = 24;
    const tubePts: [number, number, number, number][] = [
      [FLASK_A_X, 0.558, FLASK_Z, 0.0135],
      [-0.155, 0.585, FLASK_Z, 0.013],
      [-0.1, 0.592, FLASK_Z, 0.0125],
      [HELIX_CX + HELIX_R, 0.578, FLASK_Z, 0.012],
    ];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const a = t * TURNS * Math.PI * 2;
      tubePts.push([
        HELIX_CX + Math.cos(a) * HELIX_R,
        HELIX_Y0 + t * (HELIX_Y1 - HELIX_Y0),
        FLASK_Z + Math.sin(a) * HELIX_R,
        0.0115,
      ]);
    }
    tubePts.push(
      [0.085, 0.652, FLASK_Z, 0.012],
      [0.128, 0.61, FLASK_Z, 0.0125],
      [FLASK_B_X, 0.56, FLASK_Z, 0.013],
      [FLASK_B_X, 0.518, FLASK_Z, 0.0135],
    );
    const tube = sdf.chain(tubePts, 0.009).paintFn((x, y, z) => {
      let c = GLASS_TINT;
      const a = Math.atan2(z - FLASK_Z, x - HELIX_CX);
      let w = Math.abs(a - 2.2);
      w = Math.min(w, Math.PI * 2 - w);
      return mixRgb(c, GLASS_HI, 0.45 * Math.exp(-(w * w) / 0.2));
    });
    k.body('glass-tube', tube, {
      color: '#cfe4e8',
      roughness: 0.08,
      metalness: 0,
      opacity: 0.3,
      detail: 0.0065,
      paintWeight: 2,
      maxTriangles: 1150,
    });

    // ------------------------------------------------------------ vials
    // Two small corked test vials standing at the front-right of the board:
    // one amber, one green, both glowing faintly on dark bases.
    const vialAt = (x: number, z: number) =>
      sdf
        .capsule([x, 0.152, z], [x, 0.238, z], 0.02)
        .smoothUnion(0.004, sdf.cylinder(0.016, 0.028, 0.005).at(x, 0.252, z));
    const vialGlass = sdf.union(vialAt(0.295, 0.1), vialAt(0.35, 0.1)).paintFn(
      (x, y, z) => mixRgb(GLASS_SHADE, GLASS_TINT, Math.max(0, Math.min(1, (y - 0.14) / 0.12)) * 1.2),
    );
    k.body('vial-glass', vialGlass, {
      color: '#cfe4e8',
      roughness: 0.08,
      metalness: 0,
      opacity: 0.3,
      detail: 0.005,
      maxTriangles: 600,
    });

    const vialLiquidAmber = sdf.capsule([0.295, 0.15, 0.1], [0.295, 0.196, 0.1], 0.0145);
    k.body('vial-liquid-amber', vialLiquidAmber.paint(AMBER_GLOW), {
      color: '#4a2a05',
      roughness: 0.3,
      metalness: 0,
      emissive: '#ffb347',
      emissiveIntensity: 1.4,
      detail: 0.004,
      maxTriangles: 250,
    });
    const vialLiquidGreen = sdf.capsule([0.35, 0.15, 0.1], [0.35, 0.188, 0.1], 0.0145);
    k.body('vial-liquid-green', vialLiquidGreen.paint(GREEN_GLOW), {
      color: '#14320d',
      roughness: 0.3,
      metalness: 0,
      emissive: '#7ddf5a',
      emissiveIntensity: 1.4,
      detail: 0.004,
      maxTriangles: 250,
    });

    const corks = sdf
      .cylinder(0.013, 0.02, 0.004)
      .at(0.295, 0.263, 0.1)
      .smoothUnion(0.003, sdf.cylinder(0.013, 0.02, 0.004).at(0.35, 0.263, 0.1))
      .paintFn((x, y, z) => mixRgb(CORK, CORK_DARK, 0.3 + 0.5 * noise.fbm(x * 60, y * 20, z * 60, 2)));
    k.body('corks', corks, {
      color: '#8a6a3a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.003,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 90, y * 30, z * 90, 2),
      maxTriangles: 300,
    });
  },
});
