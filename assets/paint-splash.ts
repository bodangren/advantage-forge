import { defineAsset, sdf, type Sdf } from '../src/index.js';

/**
 * Design note — the paint splash (Chibi Sprouts props).
 *
 * Role: a song-video prop for week 3; must read at 128 px. Three of them stand in a row.
 * Size: 0.30 m across; 0.025 m thick at the rim and 0.033 m at the centre; stands on y = 0.
 * One idea: a big round splash of wet paint with seven rounded lobes, three droplets on thin
 *   necks, and a small foot, in red, blue, or yellow.
 * Shape language: round, with lobed edges and flying drops.
 * Palette: one slot, `paint`: red #d9443a (the default), blue #3f6fa8, yellow #f2c230.
 * Materials: wet glossy paint (roughness 0.25) with a darker rim.
 * Detail list: primary the lobed blob; secondary the droplets and the foot; tertiary the
 *   glossy rim.
 * Rig/animation: none (static prop).
 *
 * r2 (2026-11-18, finding B1): the faces curve (the centre is 0.008 m thicker than the rim),
 * every join uses one wide fillet of 0.025 m so no ring seam shows on the face, the foot is no
 * deeper than the paint is thick so it shows no tab, and the outer 0.015 m of the outline is
 * painted 25 % darker through the `paint` slot, so every preset keeps its own dark rim.
 */

const DEG = Math.PI / 180;

const R = 0.12; // the circle of the blob
const T = 0.025; // the thickness of the paint at the rim
const EDGE = 0.006; // the rounded edge
const FLAT = -0.1; // the flat bottom, in the blob's own frame
const DOME = 0.008; // the centre is this much thicker than the rim
const FILLET = 0.025; // the fillet that joins the lobes, the drops and the necks
const SOFT = 0.006; // the fillet of the soft dome
const BAND = 0.015; // the dark rim band
const TALL = 0.3; // the height of the footprint the dark band is cut from

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
    // The slab: a flat disc with a rounded edge, facing +Z.
    const slab = sdf.cylinder(R - EDGE, T - 2 * EDGE).round(EDGE).rotateX(90);
    // The dome: the centre of the blob is DOME thicker than its rim, so the faces curve.
    const dome = sdf.ellipsoid([R, R, T / 2 + DOME / 2]);
    let splash = slab.smoothUnion(SOFT, dome);

    // The lobes: soft domes on the rim. One wide fillet joins them to the disc, so the face
    // carries no ring seam.
    for (const [deg, lr] of LOBES) {
      const a = deg * DEG;
      const lobe = sdf.ellipsoid([lr, lr, T / 2 + DOME / 2]).at(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
      splash = splash.smoothUnion(FILLET, lobe);
    }

    // The droplets: round drops outside the rim, each on a thin neck.
    for (const [deg, dr, dist] of DROPS) {
      const a = deg * DEG;
      const drop = sdf.ellipsoid([dr, dr, T / 2 + DOME / 2]).at(Math.cos(a) * dist, Math.sin(a) * dist, 0);
      const neck = sdf
        .cylinder(0.01 - EDGE, T - 2 * EDGE)
        .round(EDGE)
        .rotateX(90)
        .at(Math.cos(a) * (dist / 2 + 0.05), Math.sin(a) * (dist / 2 + 0.05), 0);
      splash = splash.smoothUnion(FILLET, drop).smoothUnion(FILLET, neck);
    }

    // The flat bottom, and the small foot of the same paint inside it. The foot is 0.02 m deep,
    // less than the 0.025 m thickness of the paint, so it shows no tab on the faces.
    const foot = sdf.box([0.06, 0.02, 0.02]).at(0, FLAT + 0.01, 0);
    splash = splash.intersect(sdf.halfSpace([0, -1, 0], -FLAT)).smoothUnion(0.004, foot);

    // The footprint: the same outline, made tall. Its shell keeps the outer BAND of the
    // silhouette on the front face, the back face and the rim.
    const footprint: Sdf[] = [sdf.cylinder(R, TALL).rotateX(90)];
    for (const [deg, lr] of LOBES) {
      const a = deg * DEG;
      footprint.push(sdf.cylinder(lr, TALL).rotateX(90).at(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0));
    }
    for (const [deg, dr, dist] of DROPS) {
      const a = deg * DEG;
      footprint.push(sdf.cylinder(dr, TALL).rotateX(90).at(Math.cos(a) * dist, Math.sin(a) * dist, 0));
    }
    const outline = sdf
      .smoothUnion(SOFT, ...footprint)
      .intersect(sdf.halfSpace([0, -1, 0], -FLAT))
      .smoothUnion(0.004, sdf.box([0.06, 0.02, TALL]).at(0, FLAT + 0.01, 0));

    // The band: every point within BAND of the silhouette.
    const room = sdf.box([0.6, 0.6, 0.4]);
    const outside = room.subtract(outline);
    const core = room.subtract(outside.round(BAND));
    const band = room.subtract(core).at(0, -FLAT, 0);

    k.body('splash', splash.at(0, -FLAT, 0).paintWhere(band, k.tint('paint', -0.25)), {
      color: k.tint('paint'),
      roughness: 0.25,
      metalness: 0,
      textureDensity: 1.5,
    });
  },
});
