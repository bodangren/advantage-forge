import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — royal crown (equipment/armor/crown).
 *
 * Role: hero head gear and treasure pickup for the Chibi Quest hamlet; must read at 128 px.
 * Size: about 0.62 m wide x 0.58 m deep, 0.31 m tall (0.24 x 0.14 x 0.24 scaled 2.56 x 2.2 x 2.4 to sit on the hero head, inner radii 0.215 x 0.20), standing on y = 0, centred on Y, the front toward +Z.
 * One idea: a chunky golden band flaring into a rolled foot, carrying five rounded points with
 *   ball finials; red and blue gems stud the band and a red velvet cap fills the inside.
 * Shape language: round dominant (rolled foot, ball finials, cabochon gems, soft dome cap);
 *   the vertical rhythm band / points / balls gives a big, medium, small read.
 * Palette (60/30/10): gold #d4a93a (dominant, metalness 1); red velvet and red gems
 *   #8f2024 / #e8442f (secondary + accent); blue gems #63d3e8 (small accent).
 * Materials: gold (roughness 0.32, metalness 1); velvet cloth (roughness 0.9, metalness 0);
 *   gems (roughness 0.1, flat, a faint sparkle so they read at 128 px).
 * Detail: primary band, foot, points, and balls; secondary gems; tertiary velvet cap inside.
 *   Focal point: the big red lozenge gem under the front point.
 * Rig/animation: none (static equipment).
 */

const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#9a7220');
const GOLD_LIGHT = rgb('#ecc964');
const VELVET = rgb('#8f2024');
const GEM_RED_BASE = rgb('#b0281e');
const GEM_RED_GLOW = rgb('#e8442f');
const GEM_BLUE_BASE = rgb('#2b7f9c');
const GEM_BLUE_GLOW = rgb('#63d3e8');

// Band and foot (all in meters; the band is a revolve, U = radius, V = height).
const Y_BAND_BOT = 0.032;
const Y_RIM = 0.068;
const R_FOOT = 0.1; // foot ring radius
const R_TUBE = 0.022; // foot tube radius

// The five points and their ball finials.
const POINT_ANGLES = [0, 72, 144, 216, 288];
const R_LOBE = 0.098;
const LOBE_W = 0.066;
const LOBE_H = 0.062;
const LOBE_T = 0.032;
const Y_LOBE = 0.06; // bottom of a point (overlaps the rim)
const BALL_R = 0.02;
const Y_BALL = Y_LOBE + LOBE_H - 0.005;

// Gems on the band.
const R_GEM = 0.099;
const R_GEM_BLUE = 0.104;
const Y_GEM = 0.051;

const SC: [number, number, number] = [2.56, 2.2, 2.4];
const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'crown',
  description:
    'Royal gold crown with a rolled foot, five rounded points topped with balls, red and blue gems, and a red velvet cap inside.',
  detail: 0.005,
  reference: 'docs/item-mockups/crown-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Angle 0 is the front (+Z); positive angles swing toward +X (the crown's left).
    const place = (s: sdf.Shape, deg: number, r: number, y: number) => {
      const a = (deg * Math.PI) / 180;
      return s.rotateY(deg).at(Math.sin(a) * r, y, Math.cos(a) * r);
    };

    // ------------------------------------------------------------------ gold band and foot
    // Band: a ring wall (up the outside, over the rim, down the inside). Foot: a rolled ring
    // (a half torus, flat on the ground) that the band sits on, as in the mock.
    const bandShape = sdf.revolve(
      profile.polygon(
        [
          [0.107, Y_BAND_BOT],
          [0.109, 0.046],
          [0.107, 0.056],
          [0.109, Y_RIM],
          [0.093, Y_RIM + 0.003],
          [0.09, 0.062],
          [0.087, 0.048],
          [0.084, Y_BAND_BOT],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const foot = sdf
      .torus(R_FOOT, R_TUBE)
      .at(0, 0.021, 0)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Five rounded points with a ball finial on each, evenly spaced around the rim.
    const points: sdf.Shape[] = [];
    for (const deg of POINT_ANGLES) {
      points.push(
        place(sdf.box([LOBE_W, LOBE_H, LOBE_T], 0.015), deg, R_LOBE, Y_LOBE + LOBE_H / 2),
        place(sdf.sphere(BALL_R), deg, R_LOBE, Y_BALL),
      );
    }

    const gold = bandShape
      .smoothUnion(0.006, foot)
      .smoothUnion(0.006, ...points)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .scale(SC)
      .paintFn((x, y, z, base) => {
        let c = base;
        // Sunlit points and balls, shaded foot.
        c = mixRgb(c, GOLD_LIGHT, 0.3 * ss(0.176, 0.33, y));
        c = mixRgb(c, GOLD_DARK, 0.26 * (1 - ss(0.009, 0.062, y)));
        // A whisper of tarnish so the metal is not a flat mirror.
        const speck = 0.5 + 0.5 * noise.fbm(x * 44, y * 44, z * 44, 2);
        c = mixRgb(c, GOLD_DARK, 0.06 * speck);
        return c;
      });
    k.body('gold', gold, {
      color: GOLD,
      roughness: 0.32,
      metalness: 1,
      detail: 0.011,
      maxTriangles: 5000,
      bump: (x, y, z) => 0.00035 * noise.fbm(x * 120, y * 120, z * 120, 2),
    });

    // ------------------------------------------------------------------ red velvet cap
    // A soft cushion filling the crown's mouth: widest at the rim, doming up between the points.
    const cap = sdf
      .ellipsoid([0.09, 0.031, 0.09])
      .at(0, 0.05, 0)
      .intersect(sdf.halfSpace([0, -1, 0], -0.04))
      .displace(0.002, (x, y, z) => noise.fbm(x * 26, y * 26, z * 26, 2))
      .scale(SC);
    k.body('cap', cap, {
      color: VELVET,
      roughness: 0.9,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 200,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ gems on the band
    // Red: one big lozenge at the front, small cabochons beside it and around the back.
    // Blue: two teardrops on each side.
    // A rounded lozenge (extruded soft diamond) for the front centrepiece.
    const bigGemProto = sdf.extrude(
      profile.polygon(
        [
          [0, 0.019],
          [0.015, 0],
          [0, -0.019],
          [-0.015, 0],
        ],
        { smooth: true, samples: 8 },
      ),
      0.024,
      0.006,
    );
    const smallGemProto = sdf.sphere(0.0125);
    const blueGemProto = sdf
      .cone([0, 0.011, 0], [0, -0.013, 0], 0.015, 0.004)
      .scale([1, 1, 0.68]);

    const redGems = [
      place(bigGemProto, 0, R_GEM, Y_GEM),
      place(smallGemProto, 36, R_GEM, Y_GEM),
      place(smallGemProto, -36, R_GEM, Y_GEM),
      place(smallGemProto, 108, R_GEM, Y_GEM),
      place(smallGemProto, -108, R_GEM, Y_GEM),
      place(smallGemProto, 180, R_GEM, Y_GEM),
    ];
    k.body('gem-red', sdf.union(...redGems).scale(SC), {
      color: GEM_RED_BASE,
      roughness: 0.1,
      metalness: 0,
      emissive: GEM_RED_GLOW,
      emissiveIntensity: 0.4,
      flat: true,
      detail: 0.011,
      maxTriangles: 420,
    });

    const blueGems = [
      place(blueGemProto, 72, R_GEM_BLUE, Y_GEM),
      place(blueGemProto, -72, R_GEM_BLUE, Y_GEM),
      place(blueGemProto, 144, R_GEM_BLUE, Y_GEM),
      place(blueGemProto, -144, R_GEM_BLUE, Y_GEM),
    ];
    k.body('gem-blue', sdf.union(...blueGems).scale(SC), {
      color: GEM_BLUE_BASE,
      roughness: 0.1,
      metalness: 0,
      emissive: GEM_BLUE_GLOW,
      emissiveIntensity: 0.4,
      flat: true,
      detail: 0.011,
      maxTriangles: 300,
    });
  },
});
