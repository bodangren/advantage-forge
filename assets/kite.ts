import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';
import type { Vec2 } from '../src/sdf/profile.js';

/**
 * Design note — paper kite (Chibi Sprouts props).
 *
 * Role: a toy prop that flies beside the cast; must read at 128 px.
 * Size: 0.51 m tall sail, 0.36 m wide. The kite flies upright with no backward tilt, and its
 *   tail hangs 0.45 m down below the sail's bottom notch. The lowest cloth bow touches y = 0,
 *   so nothing else lies on the ground.
 * One idea: a paper kite whose sail is split into four quarters by the cross spars, with a
 *   cream binding cross and a cream edge band, wooden spars on its face, and a three-bow
 *   cloth tail hanging down in a gentle S curve.
 * Shape language: triangular (the sail's taper and the spars) with round soft cloth bows as
 *   the secondary language.
 * Palette (default preset redyellow, the W7 line): sailA #d9443a (top-left and bottom-right
 *   quarters), sailB #f2c230 (the other two), cream #efe6d2 (binding cross, edge band, bows),
 *   warm brown #8a5a35 (wooden spars), pale wood #a87545 (grain), cord #d8ccb2, and the bow
 *   knots #c0503c. Value plan: two mid fields, the light cream bands as the brightest areas,
 *   the brown spars as the dark lines.
 * Materials: paper sail (0.9, 0), cloth bows and cord (0.9, 0), wood (0.82, 0).
 * Detail list: primary the quartered sail with the notch; secondary the cream cross, the edge
 *   band, the two spars, the top loop; tertiary the paper grain, the bows' folds, the cord
 *   twist. The cream cross over the four quarters is the focal point.
 * Rig/animation: none (static prop).
 */

const RED = rgb('#c0503c');
const CREAM = '#efe6d2';
const CREAM_SHADE = rgb('#d8ccb2');
const WOOD = rgb('#8a5a35');
const WOOD_PALE = rgb('#a87545');

const DEG = Math.PI / 180;
const SPREADER_Y = 0.205; // the cross spar that divides the sail into quarters
/** The kite flies: this lift puts the tail's lowest bow on y = 0. */
const LIFT = 0.42;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Sail outline in its own plane: two wide shoulders, two lower tips, and a bottom notch. */
const SAIL: Vec2[] = [
  [0, 0.458], // apex
  [0.18, 0.205], // upper right shoulder (widest point)
  [0.082, 0.0], // lower right wing tip
  [0, 0.046], // bottom notch
  [-0.082, 0.0], // lower left wing tip
  [-0.18, 0.205], // upper left shoulder
];

/** Distance (m) from a point in the sail plane to the sail outline. */
const edgeDist = (x: number, y: number): number => {
  let best = Infinity;
  for (let i = 0; i < SAIL.length; i++) {
    const [ax, ay] = SAIL[i]!;
    const [bx, by] = SAIL[(i + 1) % SAIL.length]!;
    const vx = bx - ax;
    const vy = by - ay;
    const t = clamp01(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy));
    const d = Math.hypot(x - (ax + vx * t), y - (ay + vy * t));
    if (d < best) best = d;
  }
  return best;
};

/**
 * The two sail colour slots. The spine (x = 0) and the spreader (y = SPREADER_Y) cut the sail
 * into four quarters. sailA takes the top-left and the bottom-right quarter; sailB the other
 * two. The front view looks at +Z, so world -X reads as the viewer's left: the top-left
 * quarter is x < 0.
 */
const sailSlot = (x: number, y: number): string => ((x < 0) === (y > SPREADER_Y) ? 'sailA' : 'sailB');

/**
 * One quarter's paint. The two sail colours come from the colour slots, so the book's
 * red-and-yellow kite (W7) and its one red plus one yellow kite (W2) are presets of one
 * source. The cream bands are fixed colours that do not follow a slot.
 */
const makeSailPaint =
  (k: AssetContext) =>
  (x: number, y: number) => {
    const slot = sailSlot(x, y);
    const cream = rgb(k.tint(slot, { color: CREAM, follow: 0 }));
    let c = rgb(k.tint(slot, 0));
    c = mixRgb(c, rgb(k.tint(slot, -0.18)), 0.3 * clamp01((0.14 - y) / 0.14)); // the lower sail's shadow
    c = mixRgb(c, rgb(k.tint(slot, 0.10)), clamp01((y - 0.14) / 0.32)); // the lit upper sail
    // Cream edge binding all round the outline.
    c = mixRgb(c, cream, 1 - smoothstep(0.016, 0.022, edgeDist(x, y)));
    // Cream tape cross: over the spine, then over the spreader.
    const spine = 1 - smoothstep(0.013, 0.017, Math.abs(x));
    const spreader = 1 - smoothstep(0.011, 0.015, Math.abs(y - SPREADER_Y));
    c = mixRgb(c, cream, Math.max(spine, spreader));
    return c;
  };

const paperBump = (x: number, y: number, z: number): number =>
  0.00014 * noise.fbm(x * 55, y * 55, z * 55, 2) + 0.0002 * noise.fbm(x * 8, y * 9, z * 8, 2);

const woodPaint = (x: number, y: number, z: number) => {
  const g = 0.5 + 0.5 * noise.fbm(x * 40, y * 18, z * 40, 2);
  return mixRgb(WOOD, WOOD_PALE, 0.25 + 0.35 * g);
};

/** One cloth bow hanging face on to the viewer: two loops and a knot, in the XY plane. */
const bow = () => {
  const loops = sdf
    .union(
      sdf.ellipsoid([0.034, 0.02, 0.0095]).at(0.031, 0, 0).rotateZ(14),
      sdf.ellipsoid([0.034, 0.02, 0.0095]).at(-0.031, 0, 0).rotateZ(-12),
    )
    .paintFn((x, y, z) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
      let c = mixRgb(CREAM_SHADE, rgb(CREAM), 0.5 + 0.45 * n);
      // A little crease along each loop's inner end.
      c = mixRgb(c, CREAM_SHADE, 0.5 * (1 - smoothstep(0.004, 0.016, Math.hypot(x - 0.012, y * 0.6))));
      return c;
    });
  const knot = sdf.sphere(0.013).at(0, 0, 0.0105).paint(RED);
  return sdf.smoothUnion(0.004, loops, knot);
};

/**
 * The tail cord in the sail's own frame: from under the bottom notch it hangs 0.45 m down in
 * a gentle S curve, drifting left then right. The last point is one bow's half height above
 * y = 0, so the lowest bow touches the ground.
 */
const TAIL: [number, number, number, number][] = [
  [0.0, 0.042, -0.011, 0.0034],
  [0.02, -0.02, -0.013, 0.0032],
  [0.032, -0.086, -0.012, 0.0031], // bow 1
  [0.024, -0.158, -0.01, 0.003],
  [0.002, -0.23, -0.008, 0.0029], // bow 2
  [-0.016, -0.302, -0.006, 0.0028],
  [-0.022, -0.37, -0.005, 0.0027],
  [-0.016, -0.406, -0.004, 0.0026], // bow 3; its lower edge is at y = 0
];

/** The three bows hang in the sail's plane, face on to the viewer. */
const BOWS = [
  { at: TAIL[2]!, turn: -6 },
  { at: TAIL[4]!, turn: 5 },
  { at: TAIL[7]!, turn: -3 },
];

export default defineAsset({
  name: 'kite',
  description:
    'A paper kite that flies upright, 0.51 m tall and 0.36 m wide, with a sail quartered into two colours by the cross spars, a cream binding cross, a cream edge band, wooden spars on its face, a top string loop, and a three-bow cloth tail hanging 0.45 m down to the ground.',
  detail: 0.006,
  texture: { size: 1024 },

  variants: {
    sailA: { red: '#d9443a', yellow: '#f2c230' },
    sailB: { yellow: '#f2c230', red: '#d9443a' },
  },
  presets: {
    // W7 "one red-and-yellow kite, flies high over green park"; the first option of each slot
    // is the default look.
    redyellow: { sailA: 'red', sailB: 'yellow' },
    // W2 "two kites, one red and one yellow, high in sky".
    red: { sailA: 'red', sailB: 'red' },
    yellow: { sailA: 'yellow', sailB: 'yellow' },
  },

  build(k) {
    const outline = profile.polygon(SAIL, { smooth: false });
    const sail = sdf
      .extrude(outline, 0.014, 0.004)
      .paintFn(makeSailPaint(k))
      .at(0, LIFT, 0);

    k.body('sail', sail, {
      color: k.tint('sailA'),
      roughness: 0.95,
      metalness: 0,
      detail: 0.0065,
      textureDensity: 2,
      bump: paperBump,
    });

    // Wooden spine and spreader, on the front face, in the plane of the sail.
    const sparZ = 0.012;
    const spars = sdf
      .union(
        sdf.capsule([0, 0.452, sparZ], [0, 0.052, sparZ], 0.0062),
        sdf.capsule([-0.168, SPREADER_Y, sparZ], [0.168, SPREADER_Y, sparZ], 0.0058),
      )
      .paintFn(woodPaint)
      .at(0, LIFT, 0);
    k.body('spars', spars, { color: '#8a5a35', roughness: 0.82, metalness: 0, detail: 0.0028 });

    // The string loop at the top point, with a short cord down to the apex.
    const loop = sdf
      .union(
        sdf.torus(0.0115, 0.0038).rotateX(90).at(0, 0.4942, 0),
        sdf.capsule([0, 0.457, 0], [0, 0.4825, 0], 0.0028),
      )
      .at(0, LIFT, 0)
      .paint(CREAM_SHADE);
    k.body('loop', loop, { color: '#d8ccb2', roughness: 0.9, metalness: 0, detail: 0.0022 });

    // The tail cord: it hangs from under the bottom notch, below the sail.
    const cord = sdf.chain(TAIL, 0.02).at(0, LIFT, 0).paint(CREAM_SHADE);
    k.body('cord', cord, { color: '#d8ccb2', roughness: 0.9, metalness: 0, detail: 0.0032 });

    // Three cloth bows tied to the tail, hanging face on to the viewer.
    const bows = BOWS.map(({ at, turn }) => {
      const [x, y, z] = at;
      return bow().rotateZ(turn).at(x, y + LIFT, z);
    });
    k.body('bows', sdf.union(...bows), { color: '#efe6d2', roughness: 0.9, metalness: 0, detail: 0.0045 });
  },
});
