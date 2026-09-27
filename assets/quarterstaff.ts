import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — walnut quarterstaff (equipment/melee-weapons/quarterstaff).
 *
 * Role: melee weapon / walking staff carried by the Chibi Quest heroes; shown upright, must
 *   read as an icon at 128 px.
 * Size: 1.40 m tall, pole ~0.048 m thick, stands on y = 0, centered on Y, front toward +Z.
 * One idea: a stout straight walnut pole framed by chunky rounded iron caps and two raised
 *   leather grip wraps — the dark iron steps and the warm wraps are the read.
 * Shape language: round dominant (domed caps, beveled ferrule, rolled wraps), square secondary
 *   (flat collar steps near the top give a sturdy, hand-made read).
 * Palette (60/30/10): walnut #6b4226 dominant with warm #8a5a35 and deep #54331d grain;
 *   iron #4a4f55 with deep #363a3f and highlight #a8acb1; leather #8a5a35 / #5c3a22 wraps.
 * Materials: walnut wood (rough 0.82, metal 0), worn iron (rough 0.5, metal 0.7),
 *   leather (rough 0.65, metal 0). Wood grain and strap windings live in `bump` only.
 * Detail: primary pole + two iron ends + two leather wraps; secondary top collar steps and
 *   ferrule taper; tertiary grain, tarnish and helical strap grooves. Focal point: the
 *   stepped iron top cap.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const STEEL = rgb('#c8ccd2');
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WARM = rgb('#8a5a35');
const HONEY = rgb('#b5814a');
const LEATHER = rgb('#8a5a35');
const LEATHER_DARK = rgb('#5c3a22');
const LEATHER_DEEP = rgb('#3f2716');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ------------------------------------------------------------------- dimensions
const POLE_R = 0.024;
const POLE_BOT = 0.02;
const POLE_TOP = 1.38;

const WRAP_R = 0.0305;
const WRAP_LO_BOT = 0.115;
const WRAP_LO_TOP = 0.275;
const WRAP_HI_BOT = 0.6;
const WRAP_HI_TOP = 0.76;

// Iron paint: dark tarnished body, worn sheen patches, bright top-of-cap highlight, a
// scuffed dirty foot, and a steel glint on the very top of the crown.
const ironPaint = (x: number, y: number, z: number) => {
  const a = Math.atan2(z, x);
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(a * 1.6, y * 24, 0.3, 3);
  c = mixRgb(c, IRON_DEEP, 0.5 * tarnish * tarnish);
  const sheen = 0.5 + 0.5 * noise.fbm(a * 3.1 + 5, y * 12, 1.7, 2);
  c = mixRgb(c, IRON_LIGHT, 0.2 * sheen);
  // Sun-lit crown and collar steps.
  c = mixRgb(c, IRON_LIGHT, 0.32 * clamp01((y - 1.2) / 0.14));
  // Steel glint on the rounded top.
  c = mixRgb(c, STEEL, 0.5 * clamp01((y - 1.36) / 0.045));
  // The ferrule takes the dirt.
  c = mixRgb(c, IRON_DEEP, 0.45 * clamp01((0.07 - y) / 0.06));
  return c;
};

// Walnut paint: dark walnut pole with warm and honey grain streaks running along the
// shaft, and a little shadowing toward the clamped ends.
const woodPaint = (x: number, y: number, z: number) => {
  const a = Math.atan2(z, x);
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(a * 2.2, y * 6.5, 0.7, 3);
  c = mixRgb(c, WALNUT_DEEP, 0.42 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(a * 0.9 + 3, y * 1.6, 1.3, 2);
  c = mixRgb(c, WARM, 0.42 * patch);
  const honey = 0.5 + 0.5 * noise.fbm(a * 3.4 + 7, y * 3.2, 2.6, 2);
  c = mixRgb(c, HONEY, 0.2 * honey * honey);
  // A little darker toward the clamped ends.
  c = mixRgb(c, WALNUT_DEEP, 0.18 * (clamp01((0.16 - y) / 0.14) + clamp01((y - 1.22) / 0.16)));
  return c;
};

// Leather paint: dark rich leather with fine grain, worn lighter on the outer face, and
// deep rolled edges at both ends of each wrap.
const leatherPaint = (x: number, y: number, z: number) => {
  const a = Math.atan2(z, x);
  let c = LEATHER_DARK;
  const grain = 0.5 + 0.5 * noise.fbm(a * 5.5, y * 22, 2.1, 2);
  c = mixRgb(c, LEATHER_DEEP, 0.42 * grain);
  const wear = 0.5 + 0.5 * noise.fbm(a * 1.4 + 2, y * 4, 4.2, 2);
  c = mixRgb(c, LEATHER, 0.34 * wear);
  // Clean dark rolled edges at the wrap ends.
  const dLo = Math.min(y - WRAP_LO_BOT, WRAP_LO_TOP - y);
  const dHi = Math.min(y - WRAP_HI_BOT, WRAP_HI_TOP - y);
  const edge = clamp01((0.018 - Math.max(dLo, dHi)) / 0.018);
  c = mixRgb(c, LEATHER_DEEP, 0.75 * edge);
  return c;
};

export default defineAsset({
  name: 'quarterstaff',
  description:
    'Plain 1.4 m walnut quarterstaff with rounded iron end caps, collar steps and two raised leather grip wraps.',
  detail: 0.008,
  reference: 'docs/item-mockups/quarterstaff-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ pole
    const pole = sdf
      .cylinder(POLE_R, POLE_TOP - POLE_BOT, 0.006)
      .at(0, (POLE_BOT + POLE_TOP) / 2, 0);
    k.body('pole', pole.paintFn(woodPaint), {
      color: '#6b4226',
      roughness: 0.82,
      metalness: 0,
      detail: 0.007,
      maxError: 0.0005,
      bump: (x, y, z) => {
        const a = Math.atan2(z, x);
        return 0.0009 * noise.fbm(a * 2.4, y * 7, 0.4, 3);
      },
    });

    // ------------------------------------------------------------------ iron ends
    // Rounded foot ferrule sitting flat on y = 0, with a tapered collar into the pole.
    const ferrule = sdf
      .cylinder(0.0315, 0.078, 0.013)
      .at(0, 0.039, 0)
      .smoothUnion(0.008, sdf.cone([0, 0.05, 0], [0, 0.108, 0], 0.0295, 0.0258));

    // Stepped top: one chunky collar band, then a domed crown finishing exactly on 1.40 m.
    const collar = sdf.cylinder(0.034, 0.05, 0.002).at(0, 1.276, 0);
    const crown = sdf
      .cylinder(0.029, 0.052, 0.012)
      .at(0, 1.348, 0)
      .smoothUnion(0.006, sdf.sphere(0.027).at(0, 1.373, 0));
    const topEnd = sdf.union(collar, crown);

    // Four small studs seated on the lower wrap.
    const studs: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      studs.push(
        sdf
          .sphere(0.0072)
          .at(Math.cos(a) * (WRAP_R + 0.001), (WRAP_LO_BOT + WRAP_LO_TOP) / 2, Math.sin(a) * (WRAP_R + 0.001)),
      );
    }

    const iron = sdf.union(ferrule, topEnd, ...studs).paintFn(ironPaint);
    k.body('iron', iron, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.007,
      maxError: 0.001,
      bump: (x, y, z) => {
        const a = Math.atan2(z, x);
        return 0.0005 * (noise.fbm(a * 2, y * 40, 1.1, 2) - 0.5);
      },
    });

    // ------------------------------------------------------------------ leather wraps
    const wrap = (bot: number, top: number) =>
      sdf.cylinder(WRAP_R, top - bot, 0.009).at(0, (bot + top) / 2, 0);
    const wraps = sdf.union(wrap(WRAP_LO_BOT, WRAP_LO_TOP), wrap(WRAP_HI_BOT, WRAP_HI_TOP));
    k.body('wraps', wraps.paintFn(leatherPaint), {
      color: '#5c3a22',
      roughness: 0.65,
      metalness: 0,
      detail: 0.007,
      maxError: 0.0008,
      paintWeight: 2,
      // A spiral strap wound up each grip.
      bump: (x, y, z) => {
        const a = Math.atan2(z, x);
        const groove = Math.pow(0.5 + 0.5 * Math.cos(a + y * 230), 8);
        return -0.0022 * groove + 0.0007 * (noise.fbm(a * 8, y * 30, 5, 2) - 0.5);
      },
    });
  },
});
