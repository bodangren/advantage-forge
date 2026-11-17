import { defineAsset, sdf, type Sdf } from '../src/index.js';

/**
 * Design note — the paint splash (Chibi Sprouts props).
 *
 * Role: a song-video prop for week 3; must read at 128 px. Three of them stand in a row.
 * Size: 0.30 m across; 0.033 m thick at the centre and 0.025 m at r 0.15 m; stands on y = 0.
 * One idea: a big round splash of wet paint with seven rounded lobes, three droplets on thin
 *   necks, and a small foot, in red, blue, or yellow.
 * Shape language: round, with lobed edges and flying drops.
 * Palette: one slot, `paint`: red #d9443a (the default), blue #3f6fa8, yellow #f2c230.
 * Materials: wet glossy paint (roughness 0.25) with a darker rim.
 * Detail list: primary the lobed blob; secondary the droplets and the foot; tertiary the
 *   glossy rim.
 * Rig/animation: none (static prop).
 *
 * r2 (2026-11-18, finding B1): the foot is no deeper than the paint (0.02 m), and the outer
 *   0.015 m of the outline is painted 25 % darker through the `paint` slot, so every preset
 *   keeps its own dark rim.
 * r3 (2026-11-18, findings N1 and N2): the face is one smooth lens. The solid is the extruded
 *   outline clipped by one ellipsoid (radii 0.23, 0.23, 0.0165 m); the clip and the flat bottom
 *   take a 0.005 m roll, so the rim and the bottom edge catch the light. Measured on the GLB:
 *   0.0326 m thick at the centre and 0.0248 m at r 0.15 m, and the face falls from the centre to
 *   every edge. The outline joins use one fillet of 0.006 m.
 */

const DEG = Math.PI / 180;

const R = 0.12; // the circle of the blob
const FLAT = -0.1; // the flat bottom, in the blob's own frame
const DEPTH = 0.04; // the depth of the extruded outline; the lens is the thinner limit
const LENS = 0.0165; // the half thickness of the one lens
const LENS_R = 0.23; // the radius of the lens: 0.025 m thick at r 0.15 m
const NECK = 0.01; // the radius of a droplet neck
const EDGE = 0.005; // the roll of the rim edge
const SOFT = 0.006; // the one fillet that joins the lobes, the drops and the necks
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
  detail: 0.0025,
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
    // The outline: the round blob, the seven lobes, the three droplets and their thin necks.
    // It is extruded DEPTH deep and centred on z = 0. One fillet joins every part.
    const silhouette = (depth: number): Sdf => {
      const parts: Sdf[] = [sdf.cylinder(R, depth).rotateX(90)];
      for (const [deg, lr] of LOBES) {
        const a = deg * DEG;
        parts.push(
          sdf
            .cylinder(lr, depth)
            .rotateX(90)
            .at(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0),
        );
      }
      for (const [deg, dr, dist] of DROPS) {
        const a = deg * DEG;
        parts.push(
          sdf
            .cylinder(dr, depth)
            .rotateX(90)
            .at(Math.cos(a) * dist, Math.sin(a) * dist, 0),
        );
        const neckAt = dist / 2 + 0.05;
        parts.push(
          sdf
            .cylinder(NECK, depth)
            .rotateX(90)
            .at(Math.cos(a) * neckAt, Math.sin(a) * neckAt, 0),
        );
      }
      return sdf.smoothUnion(SOFT, ...parts);
    };

    // The solid: the extruded outline clipped by one ellipsoid. The clip is smooth, so the rim
    // edge is a 0.005 m roll that catches the light, and the face falls from the centre to every
    // edge; no rim bead stands above the face and no ring shows.
    let splash = silhouette(DEPTH).smoothIntersect(EDGE, sdf.ellipsoid([LENS_R, LENS_R, LENS]));

    // The flat bottom and the small foot of the same paint inside it. The bottom cut takes the
    // same roll, so the bottom edge catches the light like the rim. The paint is 0.030 m thick
    // at the bottom edge, so the 0.02 m foot shows no tab on the faces.
    splash = splash.smoothIntersect(EDGE, sdf.halfSpace([0, -1, 0], -FLAT));
    const foot = sdf.box([0.06, 0.02, 0.02]).at(0, FLAT + 0.01, 0);
    splash = splash.smoothUnion(0.004, foot);

    // The footprint: the same outline, made tall. Its shell keeps the outer BAND of the
    // silhouette on the front face, the back face and the rim.
    const outline = silhouette(TALL)
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
