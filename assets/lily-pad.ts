import { defineAsset, profile, sdf, type Sdf } from '../src/index.js';

/**
 * Design note — the lily pad (Chibi Sprouts props).
 *
 * Role: a song-video prop for week 6 ("frog hops from it"); must read at 128 px from above
 *   and in the front cutout.
 * Size: 0.40 m across and 0.02 m thick at the rim start; lies flat on y = 0 (the water
 *   surface), centred, its notch facing +Z. The rim curl tops out at 0.032 m.
 * One idea: a round wet leaf pad with a clean 30 degree V notch and nine dark veins, whose
 *   outer 0.03 m curls up so the pad reads as a dish in the front view.
 * Shape language: round dominant, with one straight cut (the V) as the secondary line.
 * Palette: leaf green #5fa364 on top; dark green #4f8f5a on the rim edge, the underside,
 *   and the nine veins. Value plan: mid green dominant, dark green secondary; no accent (the
 *   frog in the scene is the accent).
 * Materials: one wet leaf body, roughness 0.45, metalness 0.
 * Detail list: primary the dished disc and the curled rim; secondary the V notch; tertiary
 *   the nine painted radial veins. Focal point: the notch and the vein fan.
 * Rig/animation: none (static prop).
 *
 * NOTE (PM default, check against the book): the book gives no size and no colour for the
 * lily pad (Storytime inventory section 5: "lily pad | 6 | frog hops from it"). The 0.40 m
 * width, the greens, and the vein count are PM defaults. The frog (assets/frog.ts) measures
 * 0.347 m x 0.222 m at its feet, so this 0.40 m pad holds it with about 2 cm of leaf around
 * the body and the toes near the rim.
 */

const DEG = Math.PI / 180;

const R = 0.2; // half of the 0.40 m width (the widest point, on the outer wall)
const TOP = 0.02; // the pad thickness at the rim start
const DISH = 0.004; // the centre sits this much lower than the rim start
const RIM_START = 0.17; // where the rim curl begins
const LIP = 0.1975; // the top edge of the curled rim
const RISE = 0.012; // the outer 0.03 m of the rim rises this much
const NOTCH = 15; // half of the 30 degree V
const VEINS = 9;
const VEIN_W = 0.006;
const VEIN_IN = 0.015; // the veins start this far from the centre
const VEIN_OUT = 0.168; // and stop just inside the rim start

/** The top surface: a gentle dish inside RIM_START, then the rim curl. */
const topY = (r: number): number => {
  if (r <= RIM_START) return TOP - DISH * (1 - (r / RIM_START) ** 2);
  const t = Math.min(1, (r - RIM_START) / (LIP - RIM_START));
  return TOP + RISE * t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'lily-pad',
  description:
    'A round flat lily pad 0.40 m across with a 30 degree V notch facing +Z, a curled rim, a dished top, and nine dark radial veins.',
  detail: 0.0045,
  texture: { size: 1024 },

  build(k) {
    // The cross-section, in (radius, height): flat bottom, rounded outer edge, the curl, and
    // the dished top back to the axis. The top samples the dish and the curl every 3 mm, so the
    // 4.5 mm cells see one smooth curve; a smooth spline would overshoot the flat bottom.
    const outline: [number, number][] = [
      [0, 0],
      [0.06, 0],
      [0.12, 0],
      [0.168, 0],
      [0.184, 0],
      [0.19, 0],
      [0.1942, 0.0008],
      [0.1976, 0.0032],
      [0.1995, 0.007],
      [R, 0.012],
      [R, 0.0225],
      [0.1982, 0.0268],
      [LIP, TOP + RISE],
    ];
    for (let r = LIP - 0.003; r > 0.0015; r -= 0.003) outline.push([r, topY(r)]);
    outline.push([0, topY(0)]);
    const pad = sdf.revolve(profile.polygon(outline));

    // The notch: the wedge between the two 15 degree planes either side of +Z, cut through the
    // whole thickness. The half-spaces are intersected with a box, so the cut is finite.
    const room = sdf.box([0.7, 0.12, 0.7]).at(0, TOP / 2, 0);
    const wedge = sdf.intersect(
      sdf.intersect(
        sdf.halfSpace([1, 0, -Math.tan(NOTCH * DEG)], 0),
        sdf.halfSpace([-1, 0, -Math.tan(NOTCH * DEG)], 0),
      ),
      room,
    );
    const leaf = pad.subtract(wedge);

    // The nine veins: one stroke per angle, each a thin box pushed down through the top surface
    // (from y = 0.014 to 0.060) so it paints the top and never the underside.
    const strokes: Sdf[] = [];
    for (let i = 0; i < VEINS; i++) {
      strokes.push(
        sdf
          .box([VEIN_W, 0.046, VEIN_OUT - VEIN_IN])
          .at(0, 0.037, (VEIN_IN + VEIN_OUT) / 2)
          .rotateY(30 + i * 36),
      );
    }

    // The dark green: the underside (up to y = 0.007) and the outer 7 mm band of the rim.
    const under = sdf.box([0.5, 0.014, 0.5]);
    const ring = sdf.cylinder(0.3, 0.12).subtract(sdf.cylinder(0.193, 0.12));
    const dark = sdf.union(under, ring);

    k.body(
      'pad',
      leaf.paintWhere(dark, '#4f8f5a').paintWhere(sdf.union(...strokes), '#4f8f5a'),
      {
        color: '#5fa364',
        roughness: 0.45,
        metalness: 0,
        textureDensity: 2,
        maxTriangles: 7800,
      },
    );
  },
});
