import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 nest with three eggs, a small picture prop.
 * Role: a bird's nest for a low branch, with all three eggs readable on a book page.
 * Size: about 0.19 m across and 0.075 m tall, standing on y = 0 and facing +Z.
 * One idea: a deep, rough cup of thick sticks that holds three large, light-blue eggs.
 * Shape language: a round cup, one thick rim stick, five long wall sticks, four large
 * rounded stick ends that break the silhouette.
 * Palette: warm brown #b5864f with soft variation toward #c09360 and #a1744a, eggs #a9dce8.
 * Materials: rough woven wood and smooth matte eggshell.
 * Detail: a deep cup, one rim stick, five wall sticks, four stick ends, three eggs.
 * Line art: the paint stays inside one narrow brown band, so no paint edge draws a line.
 * The sticks join the cup with a crisp 0.8 mm join, so each one draws a long line.
 * Rig/animation: none.
 */

const NEST_BASE = rgb('#b5864f');
const NEST_WARM = rgb('#c09360');
const NEST_SHADE = rgb('#a1744a');
const EGG_LIGHT = rgb('#d5eef2');
const EGG_BLUE = rgb('#a9dce8');

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// A deeper cup: a small foot, a full belly, a narrow mouth, and a floor that the eggs sink into.
const bowlProfile = profile.polygon(
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

// Outer wall radius of the cup at height y (a table, not a fit, so the sticks stay proud).
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

// One thick stick that runs the full rim. It sits proud of the lip, so its line never breaks.
const rimStick = (): sdf.Shape => {
  const points: [number, number, number, number][] = [];
  const segments = 30;
  for (let j = 0; j <= segments; j++) {
    const a = (j / segments) * Math.PI * 2;
    const y = 0.0458 + 0.0013 * Math.sin(a * 2 + 0.6) + 0.0006 * Math.sin(a * 3.7 + 1.9);
    const rr = 0.0847 + 0.0011 * Math.sin(a * 3 + 2.2) + 0.0007 * Math.sin(a * 5 + 0.4);
    const thick = 0.0052 - 0.0004 * Math.abs(Math.sin(a * 2 + 1.1));
    points.push([rr * Math.cos(a), y, rr * Math.sin(a), thick]);
  }
  return sdf.chain(points, 0.0012);
};

// One long stick that climbs the outer wall, crosses the rim stick, and ends on the inner lip.
const wallStick = (start: number, span: number, yLow: number, thickness: number): sdf.Shape => {
  const points: [number, number, number, number][] = [];
  const steps = 5;
  const climb = span * 0.74;
  for (let j = 0; j < steps; j++) {
    const t = j / (steps - 1);
    const a = start + climb * t;
    const y = yLow + (0.0492 - yLow) * t;
    const rr = wallRadius(y) + 0.0046 - (j === 0 ? 0.0042 : 0);
    const thick = thickness * (j === 0 ? 0.6 : 1.06);
    points.push([rr * Math.cos(a), y, rr * Math.sin(a), thick]);
  }
  // The hook lies on the rim stick and buries its end deep in the inner lip, so it never floats.
  const aTop = start + climb;
  points.push([0.0792 * Math.cos(aTop + span * 0.06), 0.0542, 0.0792 * Math.sin(aTop + span * 0.06), thickness * 0.82]);
  points.push([0.0662 * Math.cos(aTop + span * 0.15), 0.0382, 0.0662 * Math.sin(aTop + span * 0.15), thickness * 0.7]);
  return sdf.chain(points, 0.0012);
};

// One long stick that climbs the wall and runs out past the rim. Its rounded end breaks the
// round silhouette as one long stroke, so no short mark appears at a tip.
const outrigger = (
  start: number,
  span: number,
  yLow: number,
  thickness: number,
  reach: number,
  tipY: number,
): sdf.Shape => {
  const points: [number, number, number, number][] = [];
  const steps = 5;
  const climb = span * 0.7;
  for (let j = 0; j < steps; j++) {
    const t = j / (steps - 1);
    const a = start + climb * t;
    const y = yLow + (0.0455 - yLow) * t;
    const rr = wallRadius(y) + 0.0046 - (j === 0 ? 0.0042 : 0);
    const thick = thickness * (j === 0 ? 0.6 : 1.06);
    points.push([rr * Math.cos(a), y, rr * Math.sin(a), thick]);
  }
  const aTop = start + climb;
  points.push([0.0864 * Math.cos(aTop + span * 0.08), 0.0498, 0.0864 * Math.sin(aTop + span * 0.08), thickness * 0.96]);
  points.push([(0.0864 + reach) * Math.cos(aTop + span * 0.17), tipY, (0.0864 + reach) * Math.sin(aTop + span * 0.17), thickness * 0.86]);
  return sdf.chain(points, 0.0012);
};

export default defineAsset({
  name: 'storytime-nest',
  description: "A small woven bird's nest with three large light-blue eggs.",
  detail: 0.0014,
  texture: { size: 1024 },

  build(k) {
    // The cup itself has no small form edges: one smooth blend, deep mouth, full belly.
    const cup = sdf.revolve(bowlProfile);

    // One rim stick, five long wall sticks, four big stick ends. Every stick joins the cup with
    // a 0.8 mm crisp join, so the 1-bit line art draws one long strip per stick and no dash.
    const sticks: sdf.Shape[] = [rimStick()];
    const wallAngles: [number, number, number, number, number, number][] = [
      [0.42, 1.75, 0.0115, 0.0048, 0.0068, 0.0575],
      [1.58, 1.95, 0.0135, 0.0047, 0.0046, 0.0472],
      [3.28, 1.7, 0.0105, 0.005, 0.0092, 0.0588],
      [4.42, 1.9, 0.0125, 0.0048, 0.0054, 0.0468],
    ];
    for (const [start, span, yLow, thickness, reach, tipY] of wallAngles) {
      sticks.push(outrigger(start, span, yLow, thickness, reach, tipY));
    }
    sticks.push(wallStick(2.35, 1.9, 0.0125, 0.0049));

    // Plain union: each stick crosses the cup at a clear angle, so its line is continuous.
    const woven = sdf.smoothUnion(0.0008, cup, ...sticks);

    // One soft paint field over the whole nest. Every color stays inside a narrow warm band,
    // so no paint edge reaches the 0.2 linear gap that draws a line.
    const painted = woven.paintFn((x, y, z, base) => {
      const r = Math.hypot(x, z);
      const grain = noise.fbm(x * 55, y * 70, z * 55, 2);
      const fine = noise.fbm(x * 150, y * 150, z * 150, 2);
      const outerStick = clamp01((r - 0.0755) / 0.011);
      const inner = clamp01((0.033 - y) / 0.016) * clamp01((0.068 - r) / 0.012);
      const shade = mixRgb(base, NEST_SHADE, clamp01(0.26 + 0.2 * grain + 0.3 * inner));
      return mixRgb(shade, NEST_WARM, clamp01(0.34 * outerStick + 0.1 * fine));
    });

    k.body('woven-twigs', painted.at(0, 0.001, 0), {
      color: '#b5864f',
      roughness: 0.92,
      detail: 0.0014,
      bump: (x, y, z) => 0.00035 * noise.fbm(x * 130, y * 90, z * 130, 2),
      maxTriangles: 16000,
    });

    const egg = (x: number, y: number, z: number, tilt: number) => eggShape().rotateZ(tilt).at(x, y, z);
    // Spread in a triangle so the front, the side, and the back each show three separate eggs.
    const eggs = sdf
      .union(egg(-0.037, 0.027, -0.03, -6), egg(0.004, 0.029, 0.034, 3), egg(0.036, 0.027, -0.004, 7))
      .paintFn((_x, y, _z, base) => mixRgb(base, EGG_LIGHT, Math.max(0, Math.min(0.32, (y - 0.035) * 10))));
    k.body('three-blue-eggs', eggs.at(0, 0.001, 0), {
      color: EGG_BLUE,
      roughness: 0.68,
      detail: 0.001,
      maxTriangles: 6500,
    });
  },
});
