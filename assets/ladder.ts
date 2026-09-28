import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — wooden ladder (architecture/structure/ladder).
 *
 * Role: background/landmark structure for a cozy chibi hamlet. Must read at 128 px.
 * Size: 2.0 m tall, ~0.6 m wide, ~0.36 m deep. Stands on y = 0, faces +Z, leans
 *   slightly back (top toward -Z).
 * One idea: two chunky rounded-plank rails leaning back, framing seven fat pale rungs
 *   that stick out past the rails as round pegs.
 * Shape language: round dominant (capsule rails with domed tops, round rungs) with a
 *   square secondary (flat plank depth, straight grain) — friendly and sturdy.
 * Palette: honey oak #b5814a dominant (rails), warm brown #8a5a35 secondary (shade),
 *   pale cut wood #c9a06a (rungs, focal point), dark walnut #6b4226 (grain, holes).
 * Value plan: rails mid-value with a dark foot and bleached top; rungs the light band;
 *   the four dark holes are the small accent.
 * Materials: one wood material split into two bodies (rails, rungs) for value contrast,
 *   roughness 0.82, metalness 0. Grain lives in `bump` only.
 * Detail list: primary rails + rungs; secondary rounded rail tops and peg ends;
 *   tertiary drilled bolt holes and grain texture. Focal point: the pale rung rhythm.
 * Rig/animation: none (static structure).
 */

const HONEY = rgb('#b5814a');
const WARM = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const DARK = rgb('#3a2412');

const H = 2.0; // total height
const RAIL_X = 0.235; // rail centre distance from the Y axis
const RAIL_R = 0.056; // rail half-width (chunky plank)
const RAIL_DEPTH = 0.6; // Z flattening factor: a plank, not a log
const RUNG_R = 0.03; // rung radius (0.06 m dowel)
const RUNG_END = 0.26; // rung ends flush with the rail outer face
const LEAN = -8; // degrees; top tips toward -Z (back)
const RUNG_Y = [0.3, 0.52, 0.74, 0.96, 1.18, 1.4, 1.62];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Lean the whole structure back about the ground line at the origin. */
const pose = (s: sdf.Shape) => s.rotateX(LEAN);

/** A rail: a plank-ish capsule with a domed top and a flared foot, flat on y = 0. */
function railAt(x: number) {
  const side = x > 0 ? 1 : -1;
  const foot = sdf.box([0.128, 0.17, 0.082], 0.032).at(x + side * 0.012, 0.07, 0.006);
  const body = sdf
    .smoothUnion(
      0.032,
      sdf.capsule([x, 0, 0], [x, H - RAIL_R, 0], RAIL_R).scale([1, 1, RAIL_DEPTH]),
      foot,
    )
    .intersect(sdf.halfSpace([0, -1, 0], 0))
    .paintFn((px, py, pz) => {
      // Long vertical grain; sun-bleached shoulders; a dark, damp foot.
      const g = 0.5 + 0.5 * noise.fbm(px * 7, py * 2.6, pz * 9, 3);
      const fine = 0.5 + 0.5 * noise.noise3(px * 34, py * 5, pz * 34);
      let c = mixRgb(WARM, HONEY, 0.16 + 0.52 * g);
      c = mixRgb(c, WALNUT, 0.34 * fine);
      const t = clamp01(py / H);
      c = mixRgb(c, WALNUT, 0.34 * (1 - t) * (1 - t));
      c = mixRgb(c, PALE, 0.2 * clamp01((t - 0.6) / 0.4) * g);
      return c;
    });

  // Two drilled bolt holes per rail, on the outer face — the small story detail.
  const holes = [-1, 1].map((side) => {
    const outer = x + side * (RAIL_R - 0.004);
    return sdf.union(
      sdf.cylinder(0.015, 0.05).rotate(0, 0, 90).at(outer, 1.72, 0),
      sdf.cylinder(0.015, 0.05).rotate(0, 0, 90).at(outer, 0.44, 0),
    );
  });
  return body.paintWhere(sdf.union(...holes), DARK, 0.004);
}

/** A rung: a fat dowel along X with round peg ends, pale cut wood. */
function rungAt(y: number) {
  return sdf
    .capsule([-RUNG_END, y, 0], [RUNG_END, y, 0], RUNG_R)
    .paintFn((px, py, pz) => {
      // Grain runs down the length (X); ends are darker end-grain.
      const g = 0.5 + 0.5 * noise.fbm(px * 2.2, py * 26, pz * 26, 2);
      const fine = 0.5 + 0.5 * noise.noise3(px * 8, py * 40, pz * 40);
      let c = mixRgb(PALE, HONEY, 0.1 + 0.35 * g);
      c = mixRgb(c, WARM, 0.3 * fine);
      // Shade the underside of every dowel so the rungs read as round.
      const shade = clamp01((y - py) / RUNG_R);
      c = mixRgb(c, WALNUT, 0.4 * shade * shade);
      // End grain past the rail face.
      c = mixRgb(c, WALNUT, 0.55 * clamp01((Math.abs(px) - 0.245) / 0.05));
      return c;
    });
}

export default defineAsset({
  name: 'ladder',
  description:
    'A 2 m honey-oak ladder with two rounded rails and seven fat pale rungs, leaning slightly back.',
  reference: 'docs/item-mockups/ladder-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    const rails = sdf.union(...[-RAIL_X, RAIL_X].map(railAt));
    const rungs = sdf.union(...RUNG_Y.map(rungAt));

    k.body('rails', pose(rails), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      maxTriangles: 1500,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 30, y * 3.5, z * 30, 2),
    });

    k.body('rungs', pose(rungs), {
      color: '#c9a06a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.007,
      paintWeight: 2,
      maxTriangles: 900,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 3, y * 40, z * 40, 2),
    });
  },
});
