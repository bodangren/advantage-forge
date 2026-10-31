import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 nest with three eggs, a small picture prop.
 * Role: a bird's nest for a low branch, with all three eggs readable on a book page.
 * Size: about 0.18 m across and 0.07 m tall, standing on y = 0 and facing +Z.
 * One idea: a soft woven bowl holding three large, light-blue eggs.
 * Shape language: round and layered, with four soft rim coils and a few long twigs.
 * Palette: nest #9c7148 and #c39a63, mid twig #ab7c4e, dark grooves #6f4c32, eggs #a9dce8.
 * Materials: rough woven wood and smooth matte eggshell.
 * Detail: a shallow bowl, four thick rim coils, seven long twigs, three eggs.
 * Line art: few long closed strokes. The woven look lives in the paint, not in small geometry.
 * Rig/animation: none.
 */

const TWIG_LIGHT = rgb('#c39a63');
const TWIG_MID = rgb('#ab7c4e');
const TWIG_DARK = rgb('#6f4c32');
const EGG_LIGHT = rgb('#d5eef2');
const EGG_BLUE = rgb('#a9dce8');

const bowlProfile = profile.polygon(
  [
    [0, 0],
    [0.036, 0],
    [0.058, 0.005],
    [0.077, 0.018],
    [0.088, 0.036],
    [0.089, 0.040],
    [0.085, 0.042],
    [0.078, 0.037],
    [0.067, 0.026],
    [0.046, 0.016],
    [0, 0.015],
  ],
  { smooth: true },
);

// A smooth egg: a wide round base blended into a smaller round top, so no tip is pointed.
const eggShape = () =>
  sdf
    .ellipsoid([0.0185, 0.0215, 0.0185])
    .at(0, 0.0215, 0)
    .smoothUnion(0.012, sdf.ellipsoid([0.0148, 0.0175, 0.0148]).at(0, 0.0275, 0));

// Outer wall radius of the bowl profile at height y (measured, not fitted per point).
const wallRadius = (y: number) => Math.max(0.0705, 0.0695 + 0.5 * y);

// One continuous coil: a thick strand that runs one full turn around the rim.
const rimCoil = (y0: number, r0: number, wobble: number, phase: number): sdf.Shape => {
  const points: [number, number, number, number][] = [];
  const segments = 26;
  for (let j = 0; j <= segments; j++) {
    const t = j / segments;
    const a = t * Math.PI * 2 * 1.04 + phase;
    const y = y0 + wobble * Math.sin(a * 2 + phase) + 0.4 * wobble * Math.sin(a * 3.5);
    const rr = r0 + 0.0011 * Math.sin(a * 3 + phase);
    points.push([rr * Math.cos(a), y, rr * Math.sin(a), 0.0046]);
  }
  return sdf.chain(points, 0.0018);
};

// One long twig that climbs the outer wall over a wide arc at a gentle angle.
const longTwig = (start: number, span: number, yLow: number, rise: number, thickness: number): sdf.Shape => {
  const points: [number, number, number, number][] = [];
  const steps = 6;
  for (let j = 0; j < steps; j++) {
    const t = j / (steps - 1);
    const a = start + span * t;
    const y = yLow + rise * t;
    const rr = wallRadius(y) + 0.0008 - 0.0016 * t * t;
    points.push([rr * Math.cos(a), y, rr * Math.sin(a), thickness - 0.0005 * t]);
  }
  return sdf.chain(points, 0.002);
};

export default defineAsset({
  name: 'storytime-nest',
  description: "A small woven bird's nest with three large light-blue eggs.",
  detail: 0.0014,
  texture: { size: 1024 },

  build(k) {
    const bowl = sdf.revolve(bowlProfile).paintFn((x, y, z, base) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 90, y * 120, z * 90, 2);
      const inner =
        Math.max(0, Math.min(1, (0.040 - Math.hypot(x, z)) / 0.02)) *
        Math.max(0, Math.min(1, (0.032 - y) / 0.012));
      const weave = 0.5 + 0.5 * Math.sin(Math.atan2(z, x) * 6 + y * 190 + 2.2 * noise.fbm(x * 40, y * 40, z * 40, 2));
      return mixRgb(base, TWIG_DARK, 0.08 + 0.13 * grain + 0.22 * inner + 0.07 * weave);
    });

    // Four soft coils around the rim. Each one is a single unbroken loop, so the line art
    // draws one long stroke per coil instead of a row of dashes.
    const coils: sdf.Shape[] = [
      rimCoil(0.0305, 0.0858, 0.0010, 0.0),
      rimCoil(0.0347, 0.0862, 0.0011, 1.7),
      rimCoil(0.0387, 0.0854, 0.0010, 3.1),
      rimCoil(0.0424, 0.0836, 0.0009, 4.6),
    ].map((shape, i) => shape.paint(i % 2 === 0 ? TWIG_LIGHT : TWIG_DARK));

    // Six long twigs that climb the outer wall at gentle angles and cross the coils.
    const twigs: sdf.Shape[] = [];
    for (let i = 0; i < 6; i++) {
      const start = (i * Math.PI * 2) / 6 + 0.35 + 0.1 * (i % 3);
      const span = 1.75 + 0.15 * (i % 5);
      const yLow = 0.018 + 0.0022 * (i % 3);
      const rise = 0.017 + 0.0015 * (i % 4);
      const thickness = 0.0046 + 0.0003 * (i % 2);
      const shape = longTwig(start, span, yLow, rise, thickness);
      twigs.push(shape.paint(i % 3 === 0 ? TWIG_DARK : i % 3 === 1 ? TWIG_LIGHT : TWIG_MID));
    }

    // Two long twigs draped over the lip into the bowl, so the rim reads as woven.
    const draped: [number, number, number][][] = [
      [
        [0.0840, 0.0180, 0.0044],
        [0.0890, 0.0295, 0.0046],
        [0.0862, 0.0458, 0.0044],
        [0.0790, 0.0405, 0.0042],
        [0.0690, 0.0295, 0.0040],
        [0.0590, 0.0222, 0.0036],
      ],
      [
        [0.0830, 0.0210, 0.0042],
        [0.0886, 0.0330, 0.0046],
        [0.0850, 0.0466, 0.0044],
        [0.0770, 0.0400, 0.0042],
        [0.0660, 0.0285, 0.0040],
        [0.0570, 0.0218, 0.0036],
      ],
    ];
    const drapedSpots: [number, number][] = [
      [0.55, 0.55],
      [2.60, 0.45],
    ];
    draped.forEach((path, i) => {
      const [a0, span] = drapedSpots[i]!;
      const points: [number, number, number, number][] = path.map(([r, y, r2], j) => {
        const a = a0 + span * (j / (path.length - 1));
        return [r * Math.cos(a), y, r * Math.sin(a), r2];
      });
      twigs.push(sdf.chain(points, 0.0022).paint(i === 0 ? TWIG_MID : TWIG_LIGHT));
    });

    // Two thick twig ends that lean out of the rim along the coil, each one rounded.
    for (let i = 0; i < 2; i++) {
      const a0 = 0.75 + i * 3.1;
      const points: [number, number, number, number][] = [];
      for (let j = 0; j < 4; j++) {
        const t = j / 3;
        const a = a0 + 0.34 * t;
        const r = 0.0836 + 0.0058 * t;
        const y = 0.0412 + 0.0054 * t;
        points.push([r * Math.cos(a), y, r * Math.sin(a), 0.0048 - 0.0010 * t]);
      }
      const tip = points[3]!;
      const end = sdf
        .chain(points, 0.0018)
        .smoothUnion(0.0012, sdf.sphere(0.0038).at(tip[0] * 1.008, tip[1] + 0.0006, tip[2] * 1.008));
      twigs.push(end.paint(i === 1 ? TWIG_MID : TWIG_LIGHT));
    }

    // Blend the strands so every crossing is a smooth join and no short edge appears.
    const rim = sdf.smoothUnion(0.0028, ...coils, ...twigs).paintFn((x, y, z, base) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 75, y * 110, z * 75, 2);
      return mixRgb(base, TWIG_DARK, 0.05 + 0.11 * grain);
    });

    const woven = bowl.smoothUnion(0.0030, rim);
    k.body('woven-twigs', woven.at(0, 0.001, 0), {
      color: '#b88b57',
      roughness: 0.9,
      detail: 0.0014,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 140, y * 90, z * 140, 2),
      maxTriangles: 15000,
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
