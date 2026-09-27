import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — stout cast-iron anvil (props/blacksmith/anvil).
 *
 * Role: workhorse prop in the blacksmith corner of the chibi hamlet; must read
 *   at 128 px as "one stout dark-iron anvil".
 * Size: 0.45 m long (horn tip to heel), 0.185 m wide, 0.30 m tall; stands on
 *   y = 0, long axis along X with the horn toward -X so the classic profile
 *   reads in the front view; the waist front faces +Z.
 * One idea: one heavy dark-iron mass — splayed foot, pinched swelling waist,
 *   wide flat face — finished by a single strong horn; the worn bright top is
 *   the focal point.
 * Shape language: square dominant (blocky face and base, sturdy) with one
 *   conical sweep (the horn).
 * Palette contract: iron #4a4f55, shadow #363a3f, highlight #a8acb1;
 *   60/30/10 value plan (mid body, dark foot and waist, small bright face).
 * Materials: a single cast-iron body, roughness 0.5, metalness 0.7; wear,
 *   seam and cast tone come from paint, fine cast grain in `bump` only.
 * Detail: primary face slab + horn + waist + splayed foot; secondary hardie
 *   and pritchel holes and the face-plate seam; tertiary worn-top noise.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#4a4f55');
const SHADOW = rgb('#363a3f');
const HIGHLIGHT = rgb('#a8acb1');

const FACE_TOP = 0.3;
const FACE_T = 0.045;
const HORN_X = -0.27; // horn tip

const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'anvil',
  description:
    'Heavy cast-iron anvil with a splayed foot, pinched waist, wide flat worn face, a strong horn, and hardie and pritchel holes.',
  detail: 0.008,
  reference: 'reference/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- iron mass
    // Splayed foot: a wide low plinth blended into a narrower upper block.
    const foot = sdf.smoothUnion(
      0.028,
      sdf.box([0.315, 0.05, 0.185], 0.012).at(0, 0.025, 0),
      sdf.box([0.25, 0.06, 0.13], 0.014).at(0, 0.078, 0),
    );
    // Waist: narrow block with a soft swell where it meets the foot and body.
    const waist = sdf.box([0.145, 0.105, 0.082], 0.02).at(0, 0.14, 0);
    // Body: the main mass under the face, stepped in from the face slab.
    const body = sdf.box([0.28, 0.135, 0.13], 0.016).at(0, 0.205, 0);
    // Face: the wide flat slab, slightly overhanging the body on every side.
    const face = sdf.box([0.33, FACE_T, 0.16], 0.012).at(0, FACE_TOP - FACE_T / 2, 0);
    // Horn: a tapered cone sweeping toward -X with a rounded tip.
    const horn = sdf.smoothUnion(
      0.016,
      sdf.cone([-0.125, 0.27, 0], [HORN_X, 0.256, 0], 0.06, 0.013),
      sdf.sphere(0.016).at(HORN_X - 0.004, 0.255, 0),
    );

    let mass = sdf.smoothUnion(0.022, foot, waist, body, face, horn);
    // Flatten the ground contact so the foot sits perfectly on y = 0, and
    // clip the top flush with the face so the horn's root cap cannot bulge
    // above the flat top (the clip plane is hidden on the face's flat).
    mass = mass
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .intersect(sdf.halfSpace([0, 1, 0], FACE_TOP));

    // ------------------------------------------------------------ top holes
    // Hardie hole (square) near the heel and pritchel hole (round) toward the
    // middle, both punched through the face slab.
    const holes = sdf.union(
      sdf.box([0.03, 0.09, 0.03], 0.005).at(0.11, 0.285, 0),
      sdf.cylinder(0.012, 0.09).at(0.03, 0.285, 0),
    );
    const anvil = sdf.subtract(mass, holes);

    // ------------------------------------------------------- paint and bump
    const paint = (x: number, y: number, z: number) => {
      let c = IRON;
      // Soft cast-iron tonal patches.
      const patch = 0.5 + 0.5 * noise.fbm(x * 5 + 11, y * 5, z * 5, 3);
      c = mixRgb(c, SHADOW, 0.16 * patch);
      // Grounded shadow: darker toward the foot.
      c = mixRgb(c, SHADOW, 0.34 * ss(0.16, 0.0, y));
      // Soft shade through the waist swell.
      c = mixRgb(c, SHADOW, 0.22 * Math.exp(-(((y - 0.145) / 0.045) ** 2)));
      // Face-plate seam just under the face slab.
      c = mixRgb(c, SHADOW, 0.3 * Math.exp(-(((y - 0.258) / 0.0045) ** 2)));
      // Worn bright top of the face (focal point): a broad lift so the face
      // reads lighter than the body, plus patchy bright streaks from hammer
      // wear around the striking area.
      const topW = ss(0.282, 0.295, y);
      c = mixRgb(c, HIGHLIGHT, 0.14 * topW);
      const dx = x / 0.11;
      const dz = z / 0.06;
      const zone = Math.max(0, 1 - (dx * dx + dz * dz));
      const wearN = 0.5 + 0.5 * noise.fbm(x * 42 + 4, 1.7, z * 42, 3);
      const spots = Math.pow(wearN, 2.2) * 1.6;
      const streaks = Math.pow(0.5 + 0.5 * noise.fbm(x * 14, 0.4, z * 48, 2), 2.6) * 2.0;
      const wear = topW * zone * Math.min(1.2, 0.1 + 0.55 * spots + 0.75 * streaks);
      c = mixRgb(c, HIGHLIGHT, Math.min(0.85, wear));
      // Polished horn tip.
      const hornT =
        ss(-0.15, -0.26, x) * ss(0.05, 0.015, Math.abs(z)) * ss(0.05, 0.015, Math.abs(y - 0.262));
      c = mixRgb(c, HIGHLIGHT, 0.42 * hornT);
      // Dark rims around the two holes.
      const dHardie = Math.max(Math.abs(x - 0.11), Math.abs(z));
      const dPrit = Math.hypot(x - 0.03, z);
      c = mixRgb(c, SHADOW, 0.55 * ss(0.05, 0.02, dHardie) * topW);
      c = mixRgb(c, SHADOW, 0.55 * ss(0.034, 0.012, dPrit) * topW);
      return c;
    };

    k.body('anvil', anvil.paintFn(paint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0075,
      textureDensity: 2,
      paintWeight: 1.5,
      bump: (x, y, z) => 0.0013 * noise.fbm(x * 36, y * 36, z * 36, 2),
      maxTriangles: 3800,
    });
  },
});
