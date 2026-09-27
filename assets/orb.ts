import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — magic orb on a stand (equipment/magic-weapons/orb).
 *
 * Role: magic-equipment pickup / landmark; the bright focal prop of an altar, chest, or shelf.
 *   Must read at 128 px as a glowing ball in a clawed holder.
 * Size: orb is 0.2 m wide (r = 0.1), centre at y = 0.235; the asset is ~0.34 m tall and
 *   ~0.24 m wide, stands on y = 0, centred on the Y axis, faces +Z.
 * The one idea: a floating cyan orb cradled by three curled gold claws on a chunky turned
 *   honey-oak base. The glow is the focal point; everything else is a dark, warm cradle.
 * Shape language: round dominant (orb, turned base, curled claws); small stepped turns give
 *   the base a sturdy, "carved" secondary read.
 * Palette: orb dark base #0a2433 under glow #6ad0ff (accent, 60/30/10); oak honey #b5814a,
 *   pale cut #c9a06a, dark walnut #6b4226; gold #d4a93a with shaded root #8a6a1e.
 *   Value plan: dark wood and shaded gold lows, mid gold, brightest cyan orb.
 * Materials: glowing core (dark base #0a2433, emissive #6ad0ff at 1.5) inside a see-through
 *   glass shell (roughness 0.05, opacity 0.1); gold (metalness 1, roughness 0.3); oak wood
 *   (roughness 0.82, metalness 0).
 * Detail list: primary orb + turned base + three curled claws; secondary gold hub with three
 *   lobes; tertiary growth rings and grain in paint + bump. Focal point: the glowing orb.
 * Rig/animation: none (static prop).
 */

const ORB_R = 0.1;
const ORB_Y = 0.235;

const WOOD_HONEY = rgb('#b5814a');
const WOOD_WARM = rgb('#8a5a35');
const WOOD_PALE = rgb('#c9a06a');
const WOOD_DARK = rgb('#6b4226');
const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#8a6a1e');
const ORB_DARK = rgb('#0a2433');
const ORB_MID = rgb('#124a63');
const ORB_RIM = rgb('#2f7fa0');
const GLOW = '#6ad0ff';

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** One slender curled claw, built in the +Z half-plane then swung around the orb axis. */
function claw(angleDeg: number) {
  const points: Array<[number, number, number, number]> = [
    [0, 0.095, 0.06, 0.028], // root, seated in the gold hub
    [0, 0.125, 0.086, 0.023],
    [0, 0.152, 0.096, 0.019], // sweeps up around the lower sphere
    [0, 0.176, 0.098, 0.015],
    [0, 0.2, 0.09, 0.011], // tip curls inward and presses the glass
  ];
  return sdf.chain(points, 0.018).rotate(0, angleDeg, 0);
}

export default defineAsset({
  name: 'orb',
  description:
    'Magic orb: a glowing cyan glass sphere held by three curled gold claws on a turned oak base.',
  detail: 0.006,
  reference: 'docs/item-mockups/orb-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wooden base
    // A short turned plinth: wide rounded foot, a waist, and a tucking top rim.
    const baseProfile = profile.polygon(
      [
        [0, 0],
        [0.095, 0],
        [0.116, 0.016],
        [0.116, 0.032],
        [0.102, 0.042],
        [0.102, 0.056],
        [0.082, 0.066],
        [0.074, 0.076],
        [0.06, 0.082],
        [0, 0.082],
      ],
      { smooth: true, samples: 8 },
    );
    const baseShape = sdf
      .revolve(baseProfile)
      .round(0.004)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const woodPaint = (x: number, y: number, z: number): Rgb => {
      const r = Math.hypot(x, z);
      // Growth rings around the axis, warped a little so they are not perfectly even.
      const ring = 0.5 + 0.5 * Math.sin(r * 92 + noise.fbm(x * 7, z * 7, 0, 2) * 3.2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 9, y * 40, z * 9, 2);
      let c = mixRgb(WOOD_HONEY, WOOD_PALE, 0.16 + 0.26 * grain);
      c = mixRgb(c, WOOD_WARM, 0.4 * (1 - clamp01(y / 0.082)));
      c = mixRgb(c, WOOD_DARK, 0.2 * Math.pow(ring, 3));
      // Pale worn lip where the turned rim catches the light.
      c = mixRgb(c, WOOD_PALE, 0.45 * smoothstep(0.06, 0.08, y));
      return c;
    };
    k.body('wood', baseShape.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 800,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 14, y * 50, z * 14, 2),
    });

    // ------------------------------------------------------------------ gold cradle
    // A small rounded hub with three lobes, and three slender claws rising from it.
    const hub = sdf.smoothUnion(
      0.01,
      sdf.cylinder(0.05, 0.03, 0.014).at(0, 0.09, 0),
      ...[-60, 60, 180].map((a) => {
        const rad = (a * Math.PI) / 180;
        return sdf
          .sphere(0.032)
          .scale([1, 0.85, 1])
          .at(Math.sin(rad) * 0.058, 0.092, Math.cos(rad) * 0.058);
      }),
    );
    const claws = sdf.union(...[60, -60, 180].map((a) => claw(a)));
    const goldPaint = (x: number, y: number, z: number): Rgb => {
      const t = clamp01((y - 0.06) / 0.17);
      const sheen = 0.5 + 0.5 * noise.fbm(x * 24, y * 60, z * 24, 2);
      let c = mixRgb(GOLD_DARK, GOLD, 0.32 + 0.68 * smoothstep(0, 1, t));
      c = mixRgb(c, GOLD, 0.12 * sheen);
      return c;
    };
    k.body('gold', sdf.smoothUnion(0.006, hub, claws).paintFn(goldPaint), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 850,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ glowing orb
    // An opaque glowing core inside a see-through glass shell: dark base colour so the cyan
    // emissive stays saturated instead of washing out under the studio light.
    const core = sdf.sphere(ORB_R - 0.006).at(0, ORB_Y, 0);
    const corePaint = (x: number, y: number, z: number): Rgb => {
      const t = clamp01((y - (ORB_Y - ORB_R)) / (2 * ORB_R));
      let c = mixRgb(ORB_DARK, ORB_MID, smoothstep(0.1, 0.85, t));
      const swirl = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
      c = mixRgb(c, ORB_RIM, 0.22 * swirl);
      return c;
    };
    k.body('core', core.paintFn(corePaint), {
      color: '#0a2433',
      roughness: 0.2,
      metalness: 0,
      emissive: GLOW,
      emissiveIntensity: 1.5,
      detail: 0.006,
      maxTriangles: 600,
      paintWeight: 2,
    });
    k.body('shell', sdf.sphere(ORB_R).at(0, ORB_Y, 0), {
      color: '#6ad0ff',
      roughness: 0.05,
      metalness: 0,
      opacity: 0.1,
      emissive: GLOW,
      emissiveIntensity: 0.08,
      detail: 0.007,
      maxTriangles: 600,
    });
  },
});
