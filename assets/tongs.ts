import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — blacksmith tongs (props/blacksmith/tongs).
 *
 * Role: hand tool in the blacksmith corner of the chibi hamlet; must read
 *   at 128 px from above as "one long iron tool".
 * Size: about 0.45 m long (rein tip to jaw tip), lying flat on y = 0 with
 *   the long axis along X; jaws and rivet toward +X, rounded rein tips at -X.
 * One idea: two long straight round iron reins joined by one chunky rivet,
 *   finished by short curved jaws that close on a glowing stub of hot iron —
 *   the orange stub is the focal point.
 * Shape language: round dominant (round reins, round rivet, rounded jaws);
 *   no finger rings, not scissors.
 * Palette contract: iron #4a4f55, shadow #363a3f, highlight #a8acb1;
 *   one small accent: glowing orange #ff8c2a stub.
 * Materials: forged iron (roughness 0.45, metalness 0.8, fine grain in
 *   bump), brighter steel on the rivet head and jaw tips, emissive hot iron.
 * Detail: primary two reins + rivet + jaws; secondary rivet head, worn tips;
 *   tertiary forged grain and tonal patches only.
 * Rig/animation: none (static tool).
 */

const IRON = rgb('#4a4f55');
const SHADOW = rgb('#363a3f');
const HIGHLIGHT = rgb('#a8acb1');

const REIN_Y = 0.0165; // rein center height (rein radius ~0.016)
const RIVET_X = 0.09; // rivet axis
const STUB_X = 0.19; // glowing stub center
const JAW_TIP_X = 0.195; // jaw tip

const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'tongs',
  description:
    'Blacksmith tongs lying flat: two long round iron reins joined by a chunky rivet, short curved jaws closing on a glowing stub of hot iron.',
  detail: 0.005,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ iron arms
    // One arm: a smooth tapered chain from the rounded rein tip, past the
    // rivet, into the short jaw that bows out then closes on the stub.
    // Build the +Z arm and mirror it across Z (hard copy, no blend).
    const arm = sdf
      .chain(
        [
          [-0.222, REIN_Y, 0.0325, 0.009], // rounded rein tip
          [-0.208, REIN_Y, 0.0325, 0.014],
          [-0.1, REIN_Y, 0.0325, 0.016],
          [0.0, REIN_Y, 0.032, 0.016],
          [0.055, REIN_Y, 0.031, 0.017],
          [RIVET_X, REIN_Y, 0.03, 0.0185], // thickest at the rivet
          [0.13, 0.016, 0.0325, 0.018],
          [0.165, 0.0155, 0.03, 0.016],
          [JAW_TIP_X, 0.0145, 0.026, 0.013], // jaw tip closing on the stub
        ],
        0.012,
      )
      .mirror('z', 0)
      // Flatten the ground contact so the tongs rest exactly on y = 0.
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const paint = (x: number, y: number, z: number) => {
      let c = IRON;
      // Soft forged tonal patches.
      const patch = 0.5 + 0.5 * noise.fbm(x * 6 + 7, y * 6, z * 6, 3);
      c = mixRgb(c, SHADOW, 0.16 * patch);
      // Grounded shadow: darker toward the ground contact.
      c = mixRgb(c, SHADOW, 0.34 * ss(0.028, 0.0, y));
      // Soft sheen along the top of the reins (roundness cue from the side).
      c = mixRgb(c, HIGHLIGHT, 0.09 * ss(0.026, 0.033, y));
      // Worn bright jaw tips.
      const dTip = Math.hypot(x - JAW_TIP_X, y - 0.0145, Math.abs(z) - 0.026);
      c = mixRgb(c, HIGHLIGHT, 0.62 * ss(0.03, 0.008, dTip));
      // Slight darkening where the reins pass under the rivet.
      c = mixRgb(c, SHADOW, 0.28 * ss(0.045, 0.012, Math.abs(x - RIVET_X)));
      return c;
    };

    k.body('arms', arm.paintFn(paint), {
      color: '#4a4f55',
      roughness: 0.45,
      metalness: 0.8,
      detail: 0.0045,
      textureDensity: 2,
      paintWeight: 1.5,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 38, y * 38, z * 38, 2), // forged grain
      maxTriangles: 2800,
    });

    // --------------------------------------------------------------- rivet
    // Chunky upright rivet through both arms: a rounded shaft with a
    // flattened dome head. The head is the bright steel focal accent.
    const shaft = sdf.cylinder(0.023, 0.048, 0.005).at(RIVET_X, 0.024, 0);
    const head = sdf.ellipsoid([0.027, 0.013, 0.027]).at(RIVET_X, 0.049, 0);
    const rivetPaint = (x: number, y: number, z: number) => {
      let c = IRON;
      c = mixRgb(c, SHADOW, 0.3 * ss(0.03, 0.0, y));
      // Bright dome head.
      c = mixRgb(c, HIGHLIGHT, 0.85 * ss(0.042, 0.052, y));
      return c;
    };
    k.body('rivet', shaft.smoothUnion(0.004, head).paintFn(rivetPaint), {
      color: '#4a4f55',
      roughness: 0.35,
      metalness: 0.9,
      detail: 0.004,
      textureDensity: 2,
      paintWeight: 1.5,
      maxTriangles: 600,
    });

    // ----------------------------------------------------------- hot stub
    // A small stub of glowing hot iron held between the jaw tips.
    const stub = sdf.cylinder(0.015, 0.056, 0.004).rotateZ(90).at(STUB_X, 0.0145, 0);
    k.body('stub', stub, {
      color: '#ff8c2a',
      roughness: 0.55,
      metalness: 0.2,
      emissive: '#ff7a1a',
      emissiveIntensity: 0.65,
      detail: 0.005,
      maxTriangles: 400,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 90, y * 90, z * 90, 2), // scale
    });
  },
});
