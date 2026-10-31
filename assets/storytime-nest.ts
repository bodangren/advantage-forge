import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 nest with three eggs, a small picture prop.
 * Role: a bird's nest for a low branch, with all three eggs readable on a book page.
 * Size: about 0.20 m across and 0.078 m tall, standing on y = 0 and facing +Z.
 * One idea: a dark brown cup wrapped by eight large twigs in two tan tones, with three blue eggs.
 * Shape language: a rough cup, one continuous rim twig, four climbers that break the silhouette,
 * and three low braces that wrap the belly. Every twig ends in a round bead on the dark cup.
 * Palette: dark cup #6e3f1e, light twigs #f7dcb2, mid twigs #d09a5c, light blue eggs #5c9aea.
 * Materials: rough dry twigs and smooth matte eggshell.
 * Why two twig tones: the line-art pass draws no interior form crease. It draws a paint edge only
 * when two pixels 4 px apart differ by over 0.2 in one channel. So the cup and the twigs are
 * separate bodies with flat colors, and two twig tones let a crossing twig draw its own line.
 * The cup-to-light gap is over 0.5, the cup-to-mid gap over 0.3, and the light-to-mid gap over
 * 0.25, so every twig outline closes by the paint rule and no depth edge is needed.
 * Why vertex colors: the 1024 bake left smeared texels on the cup floor and a black seam under
 * the rim where the twigs and the eggs crossed the cup. Vertex colors need no atlas gutter.
 * Detail: one cup, eight twigs, three eggs. No fine scales.
 * Rig/animation: none.
 */

const CUP = rgb('#6e3f1e');
const CUP_SHADE = rgb('#5c3317');
const CUP_WARM = rgb('#7d4a26');
const TWIG_LIGHT = rgb('#f7dcb2');
const TWIG_LIGHT_SHADE = rgb('#eccfa0');
const TWIG_MID = rgb('#d09a5c');
const TWIG_MID_SHADE = rgb('#c48f52');
const EGG = rgb('#5c9aea');
const EGG_TOP = rgb('#8ab7f4');

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// A deeper cup: a small foot, a full belly, a narrow mouth, and a floor that the eggs sink into.
const cupProfile = profile.polygon(
  [
    [0.0, 0.0045],
    [0.04, 0.0],
    [0.062, 0.004],
    [0.077, 0.014],
    [0.0838, 0.026],
    [0.0845, 0.035],
    [0.0818, 0.042],
    [0.0782, 0.0462],
    [0.0742, 0.0458],
    [0.0712, 0.0385],
    [0.0685, 0.0335],
    [0.058, 0.0288],
    [0.03, 0.0278],
    [0.0, 0.0276],
  ],
  { smooth: true },
);

// Outer wall radius of the cup at height y (a table, not a fit, so the twigs stay proud).
const wallTable: [number, number][] = [
  [0.0, 0.04],
  [0.004, 0.062],
  [0.014, 0.077],
  [0.026, 0.0838],
  [0.035, 0.0845],
  [0.042, 0.0818],
  [0.0462, 0.0782],
];
const wallRadius = (y: number): number => {
  const t = Math.max(0, Math.min(0.0462, y));
  for (let i = 1; i < wallTable.length; i++) {
    const [y1, r1] = wallTable[i]!;
    const [y0, r0] = wallTable[i - 1]!;
    if (t <= y1) return r0 + ((r1 - r0) * (t - y0)) / (y1 - y0);
  }
  return wallTable[wallTable.length - 1]![1];
};

// A smooth egg: a wide round base blended into a smaller round top, so no tip is pointed.
const eggShape = () =>
  sdf
    .ellipsoid([0.0185, 0.0215, 0.0185])
    .at(0, 0.0215, 0)
    .smoothUnion(0.012, sdf.ellipsoid([0.0148, 0.0175, 0.0148]).at(0, 0.0275, 0));

// A twig point: [azimuth in radians, height in m, thickness in m, absolute radius in m].
type TwigPoint = [number, number, number, number];

// One twig on the cup wall. Each point sits `proud` above the wall, so the twig buries about 3 mm
// and stands about 9 mm out. The chain gives a round bead at each end, and the small smoothing
// keeps the end bead crisp instead of pulling it into the cup.
const twigPath = (points: TwigPoint[], k = 0.0011): sdf.Shape => {
  const chain: [number, number, number, number][] = points.map(([a, y, thick, r]) => [
    r * Math.cos(a),
    y,
    r * Math.sin(a),
    thick,
  ]);
  return sdf.chain(chain, k);
};

const onWall = (a: number, y: number, thick: number, proud: number, wobble = 0): TwigPoint => {
  const r = wallRadius(y) + proud + wobble;
  return [a, y, thick, r];
};

// One continuous twig on the lip, in the light tone. It undulates in height so the rim does not
// read as one smooth bowl edge. The four climbers cross it in the mid tone.
const rimRing = (): sdf.Shape => {
  const points: TwigPoint[] = [];
  const segments = 44;
  for (let j = 0; j <= segments; j++) {
    const a = (j / segments) * Math.PI * 2;
    const rr = 0.0816 + 0.0011 * Math.sin(a + 2.1) + 0.0006 * Math.sin(a * 2 + 0.4);
    const y = 0.0466 + 0.0036 * Math.sin(a + 0.6) + 0.0014 * Math.sin(a * 3 + 1.9);
    const thick = 0.0066 + 0.0006 * Math.sin(a * 2 + 2.6);
    points.push([a, y, thick, rr]);
  }
  return twigPath(points);
};

// A twig that climbs the wall in the mid tone and runs out past the lip in a round bead. Four of
// them break the round silhouette at different heights, so the nest does not read as a bowl.
const climber = (
  start: number,
  climb: number,
  yLow: number,
  thick: number,
  tipY: number,
  reach: number,
): sdf.Shape => {
  const steps = 6;
  const points: TwigPoint[] = [];
  for (let j = 0; j < steps; j++) {
    const t = j / (steps - 1);
    const a = start + climb * t;
    const y = yLow + (0.0464 - yLow) * t;
    const bend = 0.0007 * Math.sin(t * 4.7 + start * 1.7);
    const bead = j === 0 ? -0.0006 : 0.0004 * Math.sin(Math.PI * t);
    points.push(onWall(a, y, thick + bead, 0.0031, bend));
  }
  const aTip = start + climb * 1.2;
  points.push([aTip, tipY, thick * 1.04, 0.0816 + reach]);
  return twigPath(points);
};

// A twig that wraps the belly in a near level band, in the light tone. It sits 1 mm further out
// than a climber, so a crossing always shows the brace in front with a closed outline.
const brace = (start: number, span: number, yLow: number, yHigh: number, thick: number): sdf.Shape => {
  const points: TwigPoint[] = [];
  const steps = 6;
  for (let j = 0; j < steps; j++) {
    const t = j / (steps - 1);
    const a = start + span * t;
    const y = yLow + (yHigh - yLow) * t + 0.0012 * Math.sin(Math.PI * t);
    const bead = 0.0008 * Math.cos(Math.PI * t);
    points.push(onWall(a, y, thick + bead, 0.0044));
  }
  return twigPath(points);
};

export default defineAsset({
  name: 'storytime-nest',
  description: "A small woven bird's nest with three large light-blue eggs.",
  detail: 0.0016,
  texture: false,

  build(k) {
    // The cup: one smooth revolve with a deep mouth and a full belly.
    const cup = sdf.revolve(cupProfile);

    // Eight twigs in two tones. The rim ring and the three braces are light; the four climbers are
    // mid tan. A light twig never touches another light twig, so no outline can run into itself.
    const lightTwigs = sdf.smoothUnion(
      0.0008,
      rimRing(),
      brace(0.5, 1.5, 0.0092, 0.0212, 0.006),
      brace(2.34, 1.5, 0.0206, 0.0106, 0.006),
      brace(4.3, 1.5, 0.0102, 0.0224, 0.006),
    );
    const midTwigs = sdf.smoothUnion(
      0.0008,
      climber(0.30, 1.02, 0.0082, 0.0062, 0.0552, 0.0098),
      climber(1.86, 1.0, 0.0096, 0.006, 0.0582, 0.0072),
      climber(3.42, 1.02, 0.0078, 0.0064, 0.0512, 0.0112),
      climber(4.98, 0.98, 0.0094, 0.006, 0.06, 0.0086),
    );

    // Dark cup with soft variation only: the mix stays under 0.09 in every channel, so no paint
    // edge fires inside the cup.
    const cupPaint = cup.paintFn((x, y, z, base) => {
      const r = Math.hypot(x, z);
      const grain = noise.fbm(x * 46, y * 60, z * 46, 2);
      const inner = clamp01((0.036 - y) / 0.02) * clamp01((0.07 - r) / 0.014);
      const low = clamp01((0.014 - y) / 0.012);
      const shade = mixRgb(base, CUP_SHADE, clamp01(0.16 + 0.14 * grain + 0.42 * inner + 0.24 * low));
      return mixRgb(shade, CUP_WARM, clamp01(0.2 * clamp01((r - 0.055) / 0.02) + 0.1 * grain));
    });

    k.body('dark-cup', cupPaint.at(0, 0.001, 0), {
      color: '#6e3f1e',
      roughness: 0.94,
      detail: 0.002,
      paintWeight: 1,
      maxTriangles: 9000,
    });

    // Light twigs: the rim ring and the three belly braces. Variation stays under 0.09.
    const lightPaint = lightTwigs.paintFn((x, y, z, base) => {
      const grain = noise.fbm(x * 120, y * 105, z * 120, 2);
      const shade = mixRgb(base, TWIG_LIGHT_SHADE, clamp01(0.14 + 0.16 * grain));
      return mixRgb(shade, TWIG_LIGHT, clamp01(0.12 + 0.3 * clamp01((y - 0.038) / 0.012)));
    });

    k.body('light-twigs', lightPaint.at(0, 0.001, 0), {
      color: '#f7dcb2',
      roughness: 0.9,
      detail: 0.0016,
      paintWeight: 1,
      maxTriangles: 14000,
    });

    // Mid twigs: the four climbers. Variation stays under 0.09.
    const midPaint = midTwigs.paintFn((x, y, z, base) => {
      const grain = noise.fbm(x * 118, y * 102, z * 118, 2);
      const shade = mixRgb(base, TWIG_MID_SHADE, clamp01(0.14 + 0.16 * grain));
      return mixRgb(shade, TWIG_MID, clamp01(0.18 * clamp01((y - 0.032) / 0.016)));
    });

    k.body('mid-twigs', midPaint.at(0, 0.001, 0), {
      color: '#d09a5c',
      roughness: 0.9,
      detail: 0.0016,
      paintWeight: 1,
      maxTriangles: 14000,
    });

    const egg = (x: number, y: number, z: number, tilt: number) => eggShape().rotateZ(tilt).at(x, y, z);
    // Spread in a triangle so the front, the side, and the back each show three separate eggs.
    const eggs = sdf
      .union(egg(-0.037, 0.027, -0.03, -6), egg(0.004, 0.029, 0.034, 3), egg(0.036, 0.027, -0.004, 7))
      .paintFn((_x, y, _z, base) => mixRgb(base, EGG_TOP, clamp01((y - 0.036) * 16)));

    k.body('three-blue-eggs', eggs.at(0, 0.001, 0), {
      color: '#5c9aea',
      roughness: 0.88,
      detail: 0.0011,
      paintWeight: 1,
      maxTriangles: 7000,
    });
  },
});
