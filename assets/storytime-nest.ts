import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 nest with three eggs, a small picture prop.
 * Role: a bird's nest for a low branch, with all three eggs readable on a book page.
 * Size: about 0.18 m across and 0.07 m tall, standing on y = 0 and facing +Z.
 * One idea: a soft woven bowl holding three large, light-blue eggs.
 * Shape language: round and layered, with gently irregular twig ends.
 * Palette: nest #9c7148 and #c39a63, dark grooves #6f4c32, eggs #a9dce8.
 * Materials: rough woven wood and smooth matte eggshell.
 * Detail: a shallow bowl, woven strands, a rim of rough crossing twigs, three round blue eggs.
 * Rig/animation: none.
 */

const TWIG_LIGHT = rgb('#c39a63');
const TWIG_DARK = rgb('#6f4c32');
const EGG_LIGHT = rgb('#d5eef2');
const EGG_BLUE = rgb('#a9dce8');

const bowlProfile = profile.polygon(
  [
    [0, 0],
    [0.044, 0],
    [0.064, 0.006],
    [0.079, 0.019],
    [0.088, 0.037],
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

export default defineAsset({
  name: 'storytime-nest',
  description: "A small woven bird's nest with three large light-blue eggs.",
  detail: 0.0014,
  texture: { size: 1024 },

  build(k) {
    const bowl = sdf.revolve(bowlProfile).paintFn((x, y, z, base) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 90, y * 120, z * 90, 2);
      return mixRgb(base, TWIG_DARK, 0.08 + 0.13 * grain);
    });
    k.body('bowl', bowl.at(0, 0.001, 0), {
      color: '#9c7148',
      roughness: 0.92,
      detail: 0.0014,
      bump: (x, y, z) => 0.00045 * noise.fbm(x * 100, y * 130, z * 100, 2),
      maxTriangles: 6500,
    });

    const strands: sdf.Shape[] = [];
    for (let i = 0; i < 24; i++) {
      const level = i % 3;
      const y = 0.012 + level * 0.012;
      const r = 0.073 + level * 0.008;
      const start = i * 2.39996;
      const span = 0.9 + (i % 4) * 0.09;
      const points: [number, number, number, number][] = [];
      for (let j = 0; j < 5; j++) {
        const t = j / 4;
        const a = start + span * t;
        const rr = r + 0.0018 * Math.sin(t * Math.PI * 2 + i);
        points.push([rr * Math.cos(a), y + 0.002 * Math.sin(t * Math.PI + i * 0.7), rr * Math.sin(a), 0.0022 + (i % 3) * 0.00025]);
      }
      strands.push(sdf.chain(points, 0.0008));
    }
    // Rough rim: short crossing twigs of different length and thickness. Some ends poke out and up.
    for (let i = 0; i < 34; i++) {
      const start = i * 2.39996 + 0.4;
      const span = 0.32 + 0.5 * noise.random(i, 1, 0);
      const climb = (noise.random(i, 2, 0) - 0.45) * 0.014;
      const baseY = 0.036 + 0.006 * noise.random(i, 3, 0);
      const baseR = 0.078 + 0.012 * noise.random(i, 4, 0);
      const thick = 0.0026 + 0.0013 * noise.random(i, 5, 0);
      const points: [number, number, number, number][] = [];
      for (let j = 0; j < 4; j++) {
        const t = j / 3;
        const a = start + span * t;
        const rr = baseR + 0.007 * t * (noise.random(i, 6, 0) - 0.3);
        points.push([rr * Math.cos(a), baseY + climb * t, rr * Math.sin(a), thick * (1 - 0.35 * t)]);
      }
      strands.push(sdf.chain(points, 0.0006));
    }
    const twigs = sdf.union(...strands).paintFn((x, y, z) => {
      const variation = 0.5 + 0.5 * noise.fbm(x * 75, y * 95, z * 75, 2);
      return mixRgb(TWIG_DARK, TWIG_LIGHT, 0.55 + 0.35 * variation);
    });
    k.body('woven-twigs', twigs.at(0, 0.001, 0), {
      color: '#b88b57',
      roughness: 0.9,
      detail: 0.0012,
      bump: (x, y, z) => 0.00025 * noise.fbm(x * 150, y * 80, z * 150, 2),
      maxTriangles: 11000,
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
