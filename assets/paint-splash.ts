import { defineAsset, sdf } from '../src/index.js';

/**
 * Design note — the paint splash (Chibi Sprouts props).
 *
 * Role: a song-video prop for week 3; must read at 128 px. Three of them stand in a row.
 * Size: 0.30 m across and 0.025 m thick; stands on y = 0 on its flat bottom edge.
 * One idea: a big round splash of wet paint with seven rounded lobes, three droplets on thin
 *   necks, and a small foot, in red, blue, or yellow.
 * Shape language: round, with lobed edges and flying drops.
 * Palette: one slot, `paint`: red #d9443a (the default), blue #3f6fa8, yellow #f2c230.
 * Materials: wet glossy paint (roughness 0.3).
 * Detail list: primary the lobed blob; secondary the droplets and the foot; tertiary the
 *   glossy rim.
 * Rig/animation: none (static prop).
 */

const DEG = Math.PI / 180;

const R = 0.12; // the circle of the blob
const T = 0.025; // the thickness of the paint
const EDGE = 0.006; // the rounded edge
const FLAT = -0.1; // the flat bottom, in the blob's own frame

// The seven lobes: the angle and the radius of each one.
const LOBES: readonly (readonly [number, number])[] = [
  [20, 0.045],
  [68, 0.04],
  [116, 0.035],
  [164, 0.04],
  [212, 0.035],
  [300, 0.03],
  [348, 0.04],
];

// The three droplets: the angle, the radius, and the distance from the centre.
const DROPS: readonly (readonly [number, number, number])[] = [
  [92, 0.018, 0.132],
  [188, 0.022, 0.13],
  [324, 0.015, 0.135],
];

export default defineAsset({
  name: 'paint-splash',
  description:
    'A big round splash of wet paint with seven rounded lobes, three droplets on thin necks, and a small foot, in red, blue, or yellow.',
  detail: 0.0035,
  texture: { size: 512 },

  variants: {
    paint: { red: '#d9443a', blue: '#3f6fa8', yellow: '#f2c230' },
  },
  presets: {
    red: { paint: 'red' },
    blue: { paint: 'blue' },
    yellow: { paint: 'yellow' },
  },

  build(k) {
    // A flat disc with a rounded edge, facing +Z.
    const disc = sdf.cylinder(R - EDGE, T - 2 * EDGE).round(EDGE).rotateX(90);
    let splash = disc;

    // The lobes: flat bumps on the rim.
    for (const [deg, lr] of LOBES) {
      const a = deg * DEG;
      const lobe = sdf
        .cylinder(lr - EDGE, T - 2 * EDGE)
        .round(EDGE)
        .rotateX(90)
        .at(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
      splash = splash.smoothUnion(0.004, lobe);
    }

    // The droplets: flat drops outside the rim, each on a thin neck.
    for (const [deg, dr, dist] of DROPS) {
      const a = deg * DEG;
      const drop = sdf
        .cylinder(dr - EDGE, T - 2 * EDGE)
        .round(EDGE)
        .rotateX(90)
        .at(Math.cos(a) * dist, Math.sin(a) * dist, 0);
      const neck = sdf
        .cylinder(0.01 - EDGE, T - 2 * EDGE)
        .round(EDGE)
        .rotateX(90)
        .at(Math.cos(a) * (dist / 2 + 0.05), Math.sin(a) * (dist / 2 + 0.05), 0);
      splash = splash.smoothUnion(0.01, drop).smoothUnion(0.01, neck);
    }

    // The flat bottom, and the small foot of the same paint inside it.
    const foot = sdf.box([0.06, 0.02, 0.04]).at(0, FLAT + 0.01, 0);
    splash = splash.intersect(sdf.halfSpace([0, -1, 0], -FLAT)).smoothUnion(0.004, foot);

    k.body('splash', splash.at(0, -FLAT, 0), {
      color: k.tint('paint'),
      roughness: 0.3,
      metalness: 0,
      textureDensity: 1.5,
    });
  },
});
