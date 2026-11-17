import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';

/**
 * Design note — child's stitched leather ball (Chibi Sprouts props).
 *
 * Role: a small toy prop that stands on the floor; must read at 128 px.
 * Size: 0.16 m across, 0.16 m tall; the centre is at (0, 0.08, 0), so it rests on y = 0.
 * One idea: a soft leather ball of four gores, two in one colour (panelA) and two in a
 *   second (panelB), with dark stitched seams that run pole to pole and a shallow dent
 *   that softens the sphere. The book gives a red-and-yellow ball (W7) and five
 *   colourful balls in a row (W2), so the two panel colours are colour slots.
 * Shape language: round (friendly, soft), one small flat dent as the only irregularity.
 * Palette (default preset redyellow, the W7 line): panelA #d9443a (two gores), panelB
 *   #f2c230 (two gores), seam #5a4030 (the dark accent), shadow #6f503a (the lower
 *   contact area). Value plan: a mid red and a mid yellow at the top, the dark seams as
 *   the strongest contrast, a darker band near the ground.
 * Materials: soft leather (roughness 0.75, metalness 0).
 * Detail list: primary the sphere with the dent; secondary the four gores and the seam
 *   lines; tertiary the leather grain and the stitched seam groove in bump. The seam
 *   lines are the focal point.
 * Rig/animation: none (static prop).
 */

const SEAM = '#5a4030';
const SHADE = '#6f503a';

const R = 0.08;
const DEG = Math.PI / 180;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Shortest surface arc (m) from the point to a seam. Seams sit at azimuth 45 + 90k degrees. */
const seamArc = (x: number, z: number): number => {
  const a = Math.atan2(x, z) / DEG; // -180..180
  const t = (((a + 45) % 90) + 90) % 90; // 0..90 inside one gore
  const off = Math.abs(t - 45); // degrees from the gore centre
  return Math.abs(45 - off) * DEG * R;
};

/** The gore index: 0 faces +Z, then it counts to the left (+X). */
const goreIndex = (x: number, z: number): number => {
  const a = Math.atan2(x, z) / DEG;
  return Math.floor((((a + 45) % 360) + 360) % 360 / 90);
};

/** The colour slot of one gore: the gores alternate panelA, panelB round the ball. */
const slotFor = (x: number, z: number): string => (goreIndex(x, z) % 2 === 0 ? 'panelA' : 'panelB');

/**
 * One gore's paint. The panel colour comes from the two colour slots, so the book's
 * red-and-yellow ball and the four more colourful balls are presets of one source.
 * The seam and the floor shadow are fixed colours that do not follow the slot.
 */
const makeBallPaint =
  (k: AssetContext) =>
  (x: number, y: number, z: number) => {
    const slot = slotFor(x, z);
    const sheen = 0.5 + 0.5 * noise.fbm(x * 26, y * 26, z * 26, 2);
    let c = rgb(k.tint(slot, 0.03 + 0.05 * sheen)); // the lit leather
    // The dark stitched seam: a crisp line with a soft edge.
    const seam = 1 - smoothstep(0.0042, 0.0078, seamArc(x, z));
    c = mixRgb(c, rgb(k.tint(slot, { color: SEAM, follow: 0 })), seam);
    // A warm shadow where the ball meets the floor.
    c = mixRgb(c, rgb(k.tint(slot, { color: SHADE, follow: 0 })), 0.22 * clamp01((0.026 - y) / 0.026));
    return c;
  };

const ballBump = (x: number, y: number, z: number): number => {
  const groove = -0.0012 * (1 - smoothstep(0.0032, 0.0062, seamArc(x, z)));
  const grain = 0.00016 * noise.fbm(x * 120, y * 120, z * 120, 2);
  return groove + grain;
};

export default defineAsset({
  name: 'ball',
  description:
    "A child's stitched leather ball, 0.16 m across, with two gores in one colour and two in a second, dark stitched seams, and one soft dent.",
  detail: 0.0045,
  texture: { size: 512 },

  variants: {
    panelA: { red: '#d9443a', blue: '#3f6fa8', green: '#4f9a4a', orange: '#e8892c', purple: '#7b4a9e' },
    panelB: { yellow: '#f2c230', white: '#f4f1ea' },
  },
  presets: {
    // W7 "one red-and-yellow ball bouncing"; the first option of each slot is the default look.
    redyellow: { panelA: 'red', panelB: 'yellow' },
    // W2 "five colorful balls in a row, bouncing on green grass".
    bluewhite: { panelA: 'blue', panelB: 'white' },
    greenyellow: { panelA: 'green', panelB: 'yellow' },
    orangewhite: { panelA: 'orange', panelB: 'white' },
    purplewhite: { panelA: 'purple', panelB: 'white' },
  },

  build(k) {
    // A sphere that rests on the floor, with one shallow scoop on the upper front.
    const sphere = sdf.sphere(R).at(0, R, 0);
    const dent = sdf.sphere(0.06).at(0.034, 0.12, 0.123);
    const ball = sphere.smoothSubtract(0.015, dent);

    k.body('ball', ball.paintFn(makeBallPaint(k)), {
      color: k.tint('panelA'),
      roughness: 0.75,
      metalness: 0,
      bump: ballBump,
      textureDensity: 2,
    });
  },
});
