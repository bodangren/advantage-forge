import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — ceramic paint pot with four paint colours (Chibi Sprouts props).
 *
 * Role: a paint-corner prop that stands on the floor; must read at 128 px.
 * Size: 0.0845 m tall, 0.067 m across the belly; the ear reaches 0.039 m from the
 *   axis. It stands on y = 0, is centred on the Y axis, and faces +Z.
 * One idea: a small cream ceramic pot with a red band, a jug ear on its left, and a
 *   glossy mound of paint that sits over the mouth of the pot, so the colour of the
 *   set reads from every view.
 * Shape language: round (a soft ceramic cup) with one small ear breaking the outline.
 * Palette: cream #efe6d2 (body), red #c0503c (band), ceramic shade #d8ccb2, and the
 *   paint slot: red #c0503c, blue #3f6fa8, yellow #e0b23c, green #4f8f5a. Value plan:
 *   the body is the light mass, the band is the mid accent, the paint mound is the
 *   saturated focal point.
 * Materials: glazed ceramic (0.8, 0), wet paint (0.25, 0).
 * Detail list: primary the cup and the paint mound; secondary the rim, the red band,
 *   the ear; tertiary the ceramic speckle and the faint paint meniscus. The paint
 *   mound is the focal point.
 * Rig/animation: none (static prop).
 */

const CREAM = rgb('#efe6d2');
const CREAM_SHADE = rgb('#d8ccb2');
const CREAM_DARK = rgb('#c3b7a0');
const BAND = rgb('#c0503c');

/**
 * The cup is scaled down so the mound of paint clears the rim. A camera that looks at
 * the cup from the side sits below the rim, and a pool inside the cup stays hidden.
 */
const CUP_HEIGHT = 0.94;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * The wall cross-section, from the base centre up the outside, over the rim, and back
 * down the inside to the floor. A dense point list keeps the revolve smooth: a smooth
 * spline through these corners overshoots and breaks the rim.
 */
const CUP_PROFILE: [number, number][] = (
  [
    // The base, from the centre out to the foot.
    [0.0, 0.0],
    [0.015, 0.0],
    [0.0242, 0.0],
    [0.0272, 0.001],
    [0.0288, 0.0034],
    // The outside wall, slightly flared.
    [0.0296, 0.0068],
    [0.0304, 0.011],
    [0.0311, 0.016],
    [0.0317, 0.022],
    [0.0321, 0.029],
    [0.0325, 0.037],
    [0.0328, 0.045],
    [0.033, 0.053],
    [0.0332, 0.061],
    [0.0333, 0.069],
    [0.0334, 0.076],
    [0.0334, 0.0795],
    // The rim, round over the top.
    [0.0336, 0.0812],
    [0.0333, 0.0828],
    [0.0324, 0.0841],
    [0.0308, 0.0847],
    [0.0288, 0.0849],
    // The inner lip.
    [0.0272, 0.0845],
    [0.0262, 0.0833],
    [0.0259, 0.081],
    // The inside wall, down to the floor.
    [0.0258, 0.076],
    [0.0256, 0.069],
    [0.0254, 0.061],
    [0.0251, 0.053],
    [0.0248, 0.045],
    [0.0244, 0.037],
    [0.0239, 0.029],
    [0.0233, 0.022],
    [0.0225, 0.016],
    [0.0214, 0.0115],
    // The floor, dished a little.
    [0.0195, 0.0096],
    [0.015, 0.0088],
    [0.009, 0.0085],
    [0.004, 0.0084],
    [0.0, 0.0084],
  ] as [number, number][]
).map(([u, v]) => [u, v * CUP_HEIGHT]);

const BAND_Y = 0.0475 * CUP_HEIGHT;
const EAR_Y = 0.046 * CUP_HEIGHT;

/** Cream ceramic with one red band and a soft shade under the rim. */
const potPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 90, y * 90, z * 90, 2);
  let c = mixRgb(CREAM_SHADE, CREAM, 0.55 + 0.4 * n);
  // A speckled glaze: a few small darker flecks.
  const fleck = 0.5 + 0.5 * noise.fbm(x * 260, y * 260, z * 260, 1);
  c = mixRgb(c, CREAM_DARK, 0.25 * clamp01((fleck - 0.72) / 0.2));
  // The red band round the middle of the cup.
  const band = smoothstep(0.0035, 0.0045, Math.abs(y - BAND_Y));
  c = mixRgb(BAND, c, band);
  return c;
};

export default defineAsset({
  name: 'paint-pot',
  description:
    'A small cream ceramic paint pot, 0.085 m tall, with a red band, a jug ear, and a glossy mound of paint over the mouth, in red, blue, yellow, or green.',
  detail: 0.0035,
  texture: { size: 512 },

  variants: {
    paint: { red: '#c0503c', blue: '#3f6fa8', yellow: '#e0b23c', green: '#4f8f5a' },
  },
  presets: {
    red: { paint: 'red' },
    blue: { paint: 'blue' },
    yellow: { paint: 'yellow' },
    green: { paint: 'green' },
  },

  build(k) {
    // The cup: a flared wall with a round rim, hollowed from the top.
    const cup = sdf.revolve(profile.polygon(CUP_PROFILE));
    // A small jug ear on the left (+X), cut where it enters the wall.
    const ear = sdf
      .torus(0.0065, 0.0026)
      .rotateX(90)
      .at(0.03, EAR_Y, 0)
      .intersect(sdf.halfSpace([-1, 0, 0], -0.0305));
    const pot = sdf.smoothUnion(0.002, cup, ear).paintFn(potPaint);
    k.body('pot', pot, {
      color: '#efe6d2',
      roughness: 0.8,
      metalness: 0,
      detail: 0.0035,
      textureDensity: 2,
      bump: (x, y, z) => 0.00018 * noise.fbm(x * 150, y * 150, z * 150, 2),
    });

    // The paint: a low mound that fills the mouth of the cup and clears the rim, so the
    // colour of the set reads from the front and the three-quarter view.
    const paint = sdf.smoothUnion(
      0.003,
      sdf.cylinder(0.025, 0.0118, 0.0012).at(0, 0.0725, 0),
      sdf.ellipsoid([0.0287, 0.008, 0.0287]).at(0, 0.0765, 0),
    );
    k.body('paint', paint, {
      color: k.tint('paint'),
      roughness: 0.25,
      metalness: 0,
      detail: 0.0028,
    });
  },
});
