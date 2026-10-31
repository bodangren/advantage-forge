import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 nest with three eggs, a small picture prop.
 * Role: a bird's nest for a low branch, with all three eggs readable on a book page.
 * Size: about 0.20 m across and 0.078 m tall, standing on y = 0 and facing +Z.
 * One idea: a dark brown cup that carries many light tan twigs, and three light blue eggs.
 * Shape language: a rough cup, one continuous rim twig, four twig ends past the lip,
 * five wall twigs, two low braces, and one twig that crosses the floor.
 * Palette: dark cup #7c4a26, light dry twigs #d6b184, light blue eggs #8fd3f0.
 * Materials: rough woven wood and smooth matte eggshell.
 * Why two nest bodies: the line-art pass draws no interior form crease. It draws a paint edge
 * only when two colors differ by 0.2 in one channel. So the cup and the twigs are two bodies
 * with two flat colors, and each twig draws its outline against the dark cup. The color gap is
 * 0.35, so the outline is continuous and no depth edge is needed.
 * Why vertex colors: the 1024 bake left smeared texels on the cup floor and a black seam under
 * the rim where the twigs and the eggs crossed the cup. Vertex colors need no atlas gutter.
 * Detail: one cup, eleven twigs, four twig ends, three eggs. No fine scales.
 * Rig/animation: none.
 */

const CUP = rgb('#7c4a26');
const CUP_SHADE = rgb('#653a1d');
const CUP_WARM = rgb('#8d5a30');
const TWIG = rgb('#d6b184');
const TWIG_SHADE = rgb('#bb9459');
const TWIG_WARM = rgb('#e8cba4');
const EGG = rgb('#8fd3f0');
const EGG_TOP = rgb('#aadff7');

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

// One continuous twig ring on the lip. It buries 3 mm in the outer wall and stands 10 mm proud,
// so the dark cup interior stays behind it and its outline draws by the paint rule.
const rimRing = (): sdf.Shape => {
  const points: [number, number, number, number][] = [];
  const segments = 36;
  for (let j = 0; j <= segments; j++) {
    const a = (j / segments) * Math.PI * 2;
    const rr = 0.0815 + 0.0012 * Math.sin(a * 2 + 0.9) + 0.0008 * Math.sin(a * 5 + 2.3);
    const y = 0.0472 + 0.0016 * Math.sin(a * 3 + 1.4) + 0.0007 * Math.sin(a * 7 + 0.2);
    const thick = 0.0064 - 0.0008 * Math.abs(Math.sin(a * 2 + 1.1));
    points.push([rr * Math.cos(a), y, rr * Math.sin(a), thick]);
  }
  return sdf.chain(points, 0.0012);
};

// One twig that climbs the outer wall and runs out past the lip. Its large round end breaks the
// round silhouette as one long stroke, so no short mark appears at a tip.
const climber = (
  start: number,
  span: number,
  yLow: number,
  thickness: number,
  reach: number,
  tipY: number,
): sdf.Shape => {
  const points: [number, number, number, number][] = [];
  const steps = 5;
  const climb = span * 0.68;
  for (let j = 0; j < steps; j++) {
    const t = j / (steps - 1);
    const a = start + climb * t;
    const y = yLow + (0.0445 - yLow) * t;
    const rr = wallRadius(y) + 0.0026 - (j === 0 ? 0.0009 : 0);
    const thick = thickness * (j === 0 ? 0.68 : 1.04);
    points.push([rr * Math.cos(a), y, rr * Math.sin(a), thick]);
  }
  const aTop = start + climb;
  points.push([0.0842 * Math.cos(aTop + span * 0.06), 0.0492, 0.0842 * Math.sin(aTop + span * 0.06), thickness * 1.02]);
  points.push([
    (0.0862 + reach) * Math.cos(aTop + span * 0.14),
    tipY,
    (0.0862 + reach) * Math.sin(aTop + span * 0.14),
    thickness * 1.06,
  ]);
  return sdf.chain(points, 0.0012);
};

// One twig that climbs the wall and ends buried in the rim ring, so it never floats.
const wallTwig = (start: number, span: number, yLow: number, thickness: number): sdf.Shape => {
  const points: [number, number, number, number][] = [];
  const steps = 5;
  const climb = span * 0.8;
  for (let j = 0; j < steps; j++) {
    const t = j / (steps - 1);
    const a = start + climb * t;
    const y = yLow + (0.0472 - yLow) * t;
    const rr = wallRadius(y) + 0.0025 - (j === 0 ? 0.0009 : 0);
    const thick = thickness * (j === 0 ? 0.7 : 1.02);
    points.push([rr * Math.cos(a), y, rr * Math.sin(a), thick]);
  }
  const aTop = start + climb + span * 0.08;
  points.push([0.0798 * Math.cos(aTop), 0.0472, 0.0798 * Math.sin(aTop), thickness * 0.92]);
  return sdf.chain(points, 0.0012);
};

// One low twig that wraps the belly in a near level band, a different angle from every climber.
const brace = (start: number, span: number, yLow: number, rise: number, thickness: number): sdf.Shape => {
  const points: [number, number, number, number][] = [];
  const steps = 6;
  for (let j = 0; j < steps; j++) {
    const t = j / (steps - 1);
    const a = start + span * t;
    const y = yLow + rise * t;
    const rr = wallRadius(y) + 0.0022;
    const thick = thickness * (0.7 + 0.32 * Math.sin(Math.PI * t));
    points.push([rr * Math.cos(a), y, rr * Math.sin(a), thick]);
  }
  return sdf.chain(points, 0.0012);
};

// One twig that crosses the floor of the cup. It lies on the dark floor and rises over the lip,
// so its whole outline draws against the cup by the paint rule.
const floorTwig = (): sdf.Shape => {
  const points: [number, number, number, number][] = [
    [0.0722, 0.0498, 0.0308, 0.0048],
    [0.048, 0.0362, 0.0224, 0.0044],
    [0.018, 0.0312, 0.0082, 0.0042],
    [-0.016, 0.0298, -0.0092, 0.0042],
    [-0.052, 0.0342, -0.0288, 0.0044],
  ];
  return sdf.chain(points, 0.0014);
};

export default defineAsset({
  name: 'storytime-nest',
  description: "A small woven bird's nest with three large light-blue eggs.",
  detail: 0.0016,
  texture: false,

  build(k) {
    // The cup: one smooth revolve with a deep mouth and a full belly.
    const cup = sdf.revolve(cupProfile);

    // Eleven twigs, all one body and one light color, on two clear angles: four long climbers
    // with round ends past the lip, three wall twigs, two low braces, one rim ring, one floor twig.
    const twigs: sdf.Shape[] = [
      rimRing(),
      floorTwig(),
      climber(0.42, 1.75, 0.0125, 0.0052, 0.0078, 0.0562),
      climber(1.58, 1.95, 0.0142, 0.005, 0.0052, 0.0472),
      climber(3.28, 1.7, 0.0115, 0.0054, 0.0102, 0.0576),
      climber(4.42, 1.9, 0.0132, 0.0052, 0.0062, 0.0458),
      wallTwig(1.02, 1.9, 0.0128, 0.0048),
      wallTwig(2.62, 1.7, 0.0112, 0.0046),
      wallTwig(5.24, 1.8, 0.0138, 0.0048),
      brace(0.0, 1.5, 0.0108, 0.0072, 0.0048),
      brace(3.02, 1.6, 0.0122, 0.0068, 0.0048),
    ];

    // The twigs join each other with one crisp blend. Their outline against the cup is a body
    // edge with a 0.35 color gap, so the line-art paint rule draws one clean stroke per twig.
    const woven = sdf.smoothUnion(0.0009, ...twigs);

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
      color: '#7c4a26',
      roughness: 0.94,
      detail: 0.002,
      paintWeight: 1,
      maxTriangles: 9000,
    });

    // Light twigs with soft variation only: under 0.09 in every channel.
    const twigPaint = woven.paintFn((x, y, z, base) => {
      const grain = noise.fbm(x * 120, y * 105, z * 120, 2);
      const shade = mixRgb(base, TWIG_SHADE, clamp01(0.12 + 0.16 * grain + 0.14 * clamp01((0.028 - y) / 0.02)));
      return mixRgb(shade, TWIG_WARM, clamp01(0.18 * clamp01((y - 0.036) / 0.014) + 0.1 * grain));
    });

    k.body('light-twigs', twigPaint.at(0, 0.001, 0), {
      color: '#d6b184',
      roughness: 0.9,
      detail: 0.0016,
      paintWeight: 1,
      maxTriangles: 20000,
    });

    const egg = (x: number, y: number, z: number, tilt: number) => eggShape().rotateZ(tilt).at(x, y, z);
    // Spread in a triangle so the front, the side, and the back each show three separate eggs.
    const eggs = sdf
      .union(egg(-0.037, 0.027, -0.03, -6), egg(0.004, 0.029, 0.034, 3), egg(0.036, 0.027, -0.004, 7))
      .paintFn((_x, y, _z, base) => mixRgb(base, EGG_TOP, clamp01((y - 0.032) * 14)));

    k.body('three-blue-eggs', eggs.at(0, 0.001, 0), {
      color: '#8fd3f0',
      roughness: 0.66,
      detail: 0.0011,
      paintWeight: 1,
      maxTriangles: 7000,
    });
  },
});
