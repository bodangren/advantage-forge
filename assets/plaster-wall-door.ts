import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * tavern/architecture/building-parts — plaster-wall-door (covers the wood-door P0 row).
 *
 * Role: 2 m modular tavern wall with a doorway; the door variant of the plaster-wall family.
 *   Must read at 128 px and sit flush with the other wall modules on the 2 m grid.
 * Size: 2.0 m long (X), 1.5 m tall (Y), 0.12 m thick (Z); stands on y = 0, faces +Z.
 * One idea: a warm plaster panel in a chunky dark walnut frame with a honey-oak plank door
 *   swung 30 deg open into the room — the dark reveal behind the leaf is the focal point.
 * Shape language: square, sturdy carpentry (dominant) with soft rounded bevels everywhere.
 * Palette: plaster warm white #f0e4cc (light, dominant), walnut #6b4226 + deep #54331d (frame),
 *   honey oak #b5814a with warm brown #8a5a35 planks (focal), iron #4a4f55 (small accents).
 * Materials: plaster (roughness 0.95), walnut frame (0.8), oak leaf (0.78), iron (0.5, metal 0.7).
 * Detail list: framed wall + doorway (big); jamb posts, lintel, sill, threshold, top rail
 *   (medium); plank gaps, strap hinges, ring handle, mottled plaster (small). Focal: the ajar door.
 * Rig/animation: none — the leaf is a separate body held in a static 30 deg open pose.
 */

const PLASTER = rgb('#f0e4cc');
const PLASTER_SHADE = rgb('#d9c8a4'); // mottle
const PLASTER_SPLASH = rgb('#c9b48c'); // ground splash
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#7d5433');
const OAK = rgb('#b5814a');
const OAK_PLANK = rgb('#8a5a35');
const OAK_DARK = rgb('#6e4526'); // plank gaps
const OAK_LIGHT = rgb('#c89a66');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#35393e');
const IRON_LIGHT = rgb('#6a7077');

// ---------------------------------------------------------------- layout
const LEN = 2.0; // wall length along X
const H = 1.5; // wall height
const THICK = 0.12; // plaster slab thickness
const SLAB_R = 0.02; // plaster edge bevel

const OPEN_W = 0.85; // rough opening in the plaster
const OPEN_H = 1.2;
const OPEN_X = OPEN_W / 2; // 0.425

const JAMB_W = 0.12; // door-frame post width (X); overlaps the opening edge by 0.02
const JAMB_IN = OPEN_X - 0.02; // clear opening edge, 0.405
const JAMB_OUT = JAMB_IN + JAMB_W; // 0.525
const LINTEL_BOT = 1.18;
const LINTEL_TOP = 1.34;
const RAIL_BOT = 1.4; // top rail band
const SILL_TOP = 0.15;
const POST_W = 0.15; // end posts
const FRAME_D = 0.17; // timber depth (Z), proud of the plaster on both faces

const LEAF_W = 0.78;
const LEAF_BOT = 0.055;
const LEAF_TOP = LINTEL_BOT - 0.015;
const LEAF_T = 0.05;
const PLANK_W = 0.13; // vertical plank pitch; half-pitch offset keeps edge planks whole
const HINGE_X = -(JAMB_IN - 0.015); // hinge line just inside the clear opening
const DOOR_ANGLE = 0; // closed, flush in the doorway (no door animation exists)

const STRAP_YS = [0.3, 0.94]; // strap hinge heights on the leaf (local)
const HANDLE_X = 0.66; // ring handle, 0.12 in from the free edge

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Plank cell coordinate of a point on the leaf: boundaries at k + 0.5, edges mid-plank. */
const plankCell = (x: number): number => (x + PLANK_W / 2) / PLANK_W;
/** 1 inside a plank gap, 0 mid plank. */
const plankGap = (x: number): number => {
  const f = plankCell(x) - Math.floor(plankCell(x));
  return smoothstep(0.1, 0.025, Math.min(f, 1 - f));
};

const plasterPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = noise.fbm(x * 6, y * 6, z * 6, 3, 6);
  let c = mixRgb(PLASTER, PLASTER_SHADE, clamp01(0.5 + n) * 0.28);
  const splash = noise.fbm(x * 6 + 11, y * 6, z * 6 + 11, 3, 3);
  c = mixRgb(c, PLASTER_SPLASH, smoothstep(0.3, 0.02, y) * clamp01(0.4 + splash) * 0.5);
  return c;
};

const walnutPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const g = noise.fbm(x * 26, y * 7, z * 26, 3, 5);
  let c = mixRgb(WALNUT, WALNUT_DEEP, clamp01(-g) * 0.4);
  c = mixRgb(c, WALNUT_LIGHT, clamp01(g) * 0.22);
  c = mixRgb(c, WALNUT_DEEP, smoothstep(0.22, 0.02, y) * 0.25);
  return c;
};

const oakPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const i = Math.floor(plankCell(x));
  const tint = noise.random(i, 9, 4);
  let c = mixRgb(OAK, OAK_PLANK, 0.1 + 0.3 * tint);
  c = mixRgb(c, OAK_LIGHT, 0.3 * Math.max(0, tint - 0.62));
  const grain = noise.fbm(x * 40, y * 4, z * 40, 3, 8);
  c = mixRgb(c, OAK_DARK, clamp01(-grain) * 0.28);
  c = mixRgb(c, OAK_LIGHT, clamp01(grain) * 0.2);
  c = mixRgb(c, OAK_DARK, plankGap(x) * 0.85);
  return c;
};

const oakBump = (x: number, y: number, z: number): number =>
  -0.0022 * plankGap(x) + 0.0009 * noise.fbm(x * 50, y * 5, z * 50, 3, 12);

const ironPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = noise.fbm(x * 60, y * 60, z * 60, 2, 9);
  let c = mixRgb(IRON, IRON_DARK, clamp01(-n) * 0.35);
  c = mixRgb(c, IRON_LIGHT, clamp01(n) * 0.25);
  return c;
};

// Rivet heads painted onto the straps: three per strap, dark dots.
const RIVETS: Array<[number, number]> = STRAP_YS.flatMap((sy) =>
  [0.05, 0.14, 0.23].map((rx) => [rx, sy] as [number, number]),
);
const hingePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  let c = ironPaint(x, y, z, base);
  for (const [rx, ry] of RIVETS) {
    const d = Math.hypot(x - rx, y - ry);
    if (d < 0.01) {
      c = mixRgb(c, IRON_DARK, smoothstep(0.01, 0.005, d) * 0.8);
      break;
    }
  }
  return c;
};

export default defineAsset({
  name: 'plaster-wall-door',
  description:
    'Tavern wall module, 2 m of warm plaster in a dark walnut timber frame, with a closed ' +
    'honey-oak plank door on iron strap hinges; braces flank the doorway and the sill and ' +
    'top rail step around the opening.',
  detail: 0.02,
  reference: 'reference/mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ plaster
    // Warm white slab, 2 x 1.5 x 0.12, with the doorway cut clean through.
    // The cut edges are buried inside the walnut jamb posts and lintel. The slab is
    // inset 5 mm in X and 20 mm in Y so no face is coplanar with the frame (the bake
    // would bleed plaster texels onto the walnut ends and top).
    const slab = sdf.box([LEN - 0.01, H - 0.02, THICK], SLAB_R).at(0, (H - 0.02) / 2, 0);
    const opening = sdf
      .box([OPEN_W, OPEN_H + 0.12, THICK + 0.1])
      .at(0, OPEN_H - (OPEN_H + 0.12) / 2, 0);
    k.body('plaster', slab.subtract(opening).paintFn(plasterPaint), {
      color: PLASTER,
      roughness: 0.95,
      detail: 0.02,
      maxError: 0.004,
      maxTriangles: 2200,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 18, y * 18, z * 18, 3, 4),
    });

    // ------------------------------------------------------------------ walnut frame
    // End posts, door jamb posts, lintel, sill beams stepping around the opening,
    // threshold, and the top rail. All one walnut body; boxes touch so their own
    // rounded edges read as carpentry joints.
    const B = (w: number, h: number, d: number, r: number, x: number, y: number): Sdf =>
      sdf.box([w, h, d], r).at(x, y, 0);
    const postX = LEN / 2 - POST_W / 2;
    // Diagonal braces flanking the doorway: one on each side, mirroring the wall-window
    // variant. Each brace starts from the end-post/sill pocket and lands in the top rail,
    // so the three plaster-wall variants share the same wall-construction contract. The
    // inner edge of each brace sits at x ≈ ±0.42, just outside the doorway opening (±0.405).
    const brace = (side: 1 | -1): Sdf =>
      sdf
        .box([0.85, 0.115, FRAME_D], 0.014)
        .rotateZ(side * -45)
        .at(side * 0.78, 0.4, 0);
    const frame = sdf.union(
      B(POST_W, H, 0.18, 0.02, -postX, H / 2),
      B(POST_W, H, 0.18, 0.02, postX, H / 2),
      B(JAMB_W, LINTEL_TOP + 0.01, FRAME_D, 0.015, -(JAMB_IN + JAMB_W / 2), (LINTEL_TOP + 0.01) / 2),
      B(JAMB_W, LINTEL_TOP + 0.01, FRAME_D, 0.015, JAMB_IN + JAMB_W / 2, (LINTEL_TOP + 0.01) / 2),
      B(JAMB_OUT * 2, LINTEL_TOP - LINTEL_BOT, FRAME_D, 0.015, 0, (LINTEL_BOT + LINTEL_TOP) / 2),
      B((LEN / 2 - POST_W) * 2, H - RAIL_BOT, FRAME_D, 0.015, 0, (RAIL_BOT + H) / 2),
      B(0.85 - JAMB_OUT, SILL_TOP, FRAME_D, 0.015, -(0.85 + JAMB_OUT) / 2, SILL_TOP / 2),
      B(0.85 - JAMB_OUT, SILL_TOP, FRAME_D, 0.015, (0.85 + JAMB_OUT) / 2, SILL_TOP / 2),
      B(JAMB_IN * 2, 0.045, FRAME_D, 0.012, 0, 0.0225),
      brace(-1),
      brace(1),
    );
    k.body('frame', frame.paintFn(walnutPaint), {
      color: WALNUT,
      roughness: 0.8,
      detail: 0.02,
      maxError: 0.004,
      maxTriangles: 2400,
      paintWeight: 2,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 30, y * 8, z * 30, 3, 7),
    });

    // ------------------------------------------------------------------ closed door leaf
    // Local space: the hinge line is the group origin, the leaf runs along +X. With
    // DOOR_ANGLE = 0 the leaf sits flush in the doorway; no animation drives it.
    k.group('door', { at: [HINGE_X, 0, 0], rotate: [0, -DOOR_ANGLE, 0] }, (g) => {
      const leaf = sdf
        .box([LEAF_W, LEAF_TOP - LEAF_BOT, LEAF_T], 0.012)
        .at(LEAF_W / 2, (LEAF_TOP + LEAF_BOT) / 2, 0);
      g.body('door-leaf', leaf.paintFn(oakPaint), {
        color: OAK,
        roughness: 0.78,
        detail: 0.014,
        maxError: 0.003,
        maxTriangles: 1700,
        textureDensity: 2,
        paintWeight: 2,
        bump: oakBump,
      });

      // Two iron strap hinges on the room-side face, with a barrel at the hinge edge.
      const strap = (sy: number): Sdf =>
        sdf
          .extrude(
            profile.polygon([
              [0, -0.034],
              [0.3, -0.011],
              [0.3, 0.011],
              [0, 0.034],
            ]),
            0.014,
            0.004,
          )
          .at(0.01, sy, LEAF_T / 2 + 0.004);
      const barrel = (sy: number): Sdf =>
        sdf.cylinder(0.018, 0.1, 0.005).at(0.012, sy, 0.012);
      g.body(
        'door-hinges',
        sdf.union(...STRAP_YS.map(strap), ...STRAP_YS.map(barrel)).paintFn(hingePaint),
        {
          color: IRON,
          roughness: 0.55,
          metalness: 0.7,
          detail: 0.006,
          maxError: 0.001,
          maxTriangles: 700,
        },
      );

      // Small dark ring handle on a round boss, near the free edge.
      const handle = sdf.union(
        sdf.cylinder(0.017, 0.014).rotateX(90).at(HANDLE_X, 0.72, LEAF_T / 2 + 0.006),
        sdf.torus(0.034, 0.009).rotateX(90).at(HANDLE_X, 0.676, LEAF_T / 2 + 0.015),
      );
      g.body('door-handle', handle.paintFn(ironPaint), {
        color: IRON,
        roughness: 0.5,
        metalness: 0.7,
        detail: 0.006,
        maxError: 0.001,
        maxTriangles: 450,
      });
    });
  },
});
