import { defineAsset, mixRgb, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 child's cup, a small check-row picture prop.
 * Role: a child's cup that a five-year-old reads as "cup" at 1500 px and in line art.
 * Size: about 0.135 m wide with the handle and 0.098 m tall, standing on y = 0 and facing +Z.
 * One idea: a short, round, soft sky-blue cup with a cream rim, one big round loop handle on +X.
 * Shape language: a slightly tapered round body (wider at the top), a thick soft rim, a flat base.
 * Palette: cup #4fb3ee, inside #2d7fb8, rim #fff3d2.
 * Materials: smooth matte plastic.
 * Detail: an empty inside that shows darker, a cream rim ring, a handle loop on the +X side
 *   (the side that the three-quarter and side views show).
 * Rig/animation: none. No text, number, logo, face, picture, liquid, lid, or straw.
 */

const BLUE = rgb('#4fb3ee');
const BLUE_LIGHT = rgb('#7cc9f6');
const INSIDE = rgb('#2d7fb8');
const CREAM = rgb('#fff3d2');

const HEIGHT = 0.09; // the top of the wall
const WALL = 0.006;
const R_BASE = 0.033;
const R_TOP = 0.046;

// Outer radius at height y: a straight taper, wider at the top.
const outerR = (y: number) => R_BASE + (R_TOP - R_BASE) * Math.pow(Math.min(1, Math.max(0, y / HEIGHT)), 0.8);

const cupProfile = (() => {
  // Closed polygon: outer wall up, over the top, inner wall down, floor to the axis.
  const inner = (y: number) => outerR(y) - WALL;
  return [
    [0, 0],
    [0.027, 0],
    [0.0335, 0.0028],
    [outerR(0.01), 0.01],
    [outerR(0.045), 0.045],
    [outerR(0.088), 0.088],
    [R_TOP - WALL / 2, HEIGHT],
    [inner(0.088), 0.088],
    [inner(0.045), 0.045],
    [inner(0.02), 0.02],
    [inner(0.014) - 0.004, 0.0125],
    [0, 0.0115],
  ] as [number, number][];
})();

export default defineAsset({
  name: 'storytime-child-cup',
  description: "A short, round, soft sky-blue child's cup with a cream rim and one round loop handle.",
  detail: 0.0011,
  texture: { size: 1024 },

  build(k) {
    const body = sdf.revolve(profile.polygon(cupProfile, { smooth: true }));

    // The handle: one big round loop on +X, in the XY plane. The cavity is cut out of it
    // so no handle material shows inside the cup.
    const handle = sdf
      .torus(0.0245, 0.0078)
      .rotateX(90)
      .at(0.064, 0.049, 0)
      .subtract(sdf.cylinder(0.0345, 0.1).at(0, 0.058, 0));

    const cup = body.smoothUnion(0.005, handle).paintFn((x, y, z, base) => {
      const r = Math.hypot(x, z);
      const insideWall = y > 0.0105 && r < outerR(y) - WALL * 0.45 && x < 0.045;
      if (insideWall) return mixRgb(INSIDE, base, 0.1);
      return mixRgb(base, BLUE_LIGHT, Math.min(0.35, Math.max(0, (y - 0.025) * 4)) * (x > 0 ? 0.6 : 1));
    });
    k.body('cup', cup, { color: BLUE, roughness: 0.55, detail: 0.0011, maxTriangles: 16000 });

    // A thick, soft cream rim ring on the top edge.
    const rim = sdf.torus(R_TOP - WALL / 2, 0.0056).at(0, HEIGHT, 0);
    k.body('rim', rim, { color: CREAM, roughness: 0.5, detail: 0.001, maxTriangles: 6000 });
  },
});
