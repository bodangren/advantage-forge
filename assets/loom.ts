import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Design note — standing frame loom (props/craft-and-trade/loom).
 *
 * Role: village craft landmark. Must read at 128 px as a wooden frame with a bright cloth.
 * Size: 1.2 m wide, 1.3 m tall, about 0.9 m deep with the bench. Stands on y = 0, faces +Z.
 * One idea: two fat beams hold cream warp and heddle loops, with a half-woven red-and-cream
 *   cloth between them, a shuttle on the fell, and a small bench in front.
 * Shape language: round dominant (beams, posts, loops, feet), square secondary (cloth, seat).
 * Palette: honey oak #b5814a (60), cream warp #f3e6cc and walnut feet #6b4226 (30),
 *   red cloth #c4453c accent (10). Iron pegs #4a4f55. Pale cut wood #c9a06a on beam ends.
 * Materials: wood 0.82, cloth 0.88, yarn 0.9, worn iron 0.5 / 0.7. Grain and weave in bump.
 * Detail: frame, cloth, and loops are primary. Shuttle, bench, and pegs are secondary.
 * Rig: none.
 */

const HONEY = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const PALE_LIT = rgb('#e4c99a');
const WALNUT = rgb('#6b4226');
const CREAM = rgb('#f3e6cc');
const CREAM_SHADE = rgb('#cbb892');
const CLOTH_CREAM = rgb('#e4cfa6');
const RED = rgb('#c4453c');
const RED_DEEP = rgb('#8a3028');
const IRON = rgb('#4a4f55');
const IRON_HI = rgb('#a8acb1');

const POST_X = 0.44;
const POST_R = 0.046;
const TOP_Y = 1.2;
const CLOTH_Y = 0.42;
const BEAM_R = 0.046;
const TOP_HALF = 0.554; // end spheres finish the width at 1.20 m
const CLOTH_HALF = 0.49;

const WARP_XS = [-0.24, -0.12, 0, 0.12, 0.24];
const WARP_R = 0.015;
const LOOP_R = 0.062;
const LOOP_T = 0.016;

const CLOTH_BOT = 0.54;
const CLOTH_TOP = 0.88;
const CLOTH_Z = 0.068;
const CLOTH_T = 0.042;
const CLOTH_MID_Y = (CLOTH_BOT + CLOTH_TOP) / 2;

const SEAT_TOP = 0.37;
const SEAT_Z = 0.32;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Boat shuttle lies diagonally on the fell. A small yaw shows one end from the side. */
const poseShuttle = (s: Sdf) => s.rotateZ(-18).rotateY(16).at(0, 0.8, 0.102);

const weave = (x: number, y: number, base: ReturnType<typeof rgb>, shade: ReturnType<typeof rgb>) => {
  const u = x / 0.12;
  const groove = clamp01(1 - Math.abs(u - Math.round(u)) / 0.32);
  let c = mixRgb(base, shade, 0.55 * groove * groove);
  const weft = 0.5 + 0.5 * Math.sin(y * 150);
  c = mixRgb(c, shade, 0.07 * weft);
  return c;
};

export default defineAsset({
  name: 'loom',
  description:
    'A honey-oak frame loom, 1.2 m wide and 1.3 m tall: two beams, cream warp and heddle loops, a half-woven red and cream cloth, a shuttle on the fell, and a small bench in front.',
  detail: 0.008,
  reference: 'docs/item-mockups/loom-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ frame
    const post = sdf.smoothUnion(
      0.014,
      sdf.capsule([POST_X, 0.08, 0], [POST_X, 1.2, 0], POST_R),
      sdf.sphere(0.06).at(POST_X, 0.2, 0),
      sdf.sphere(0.064).at(POST_X, CLOTH_Y, 0),
      sdf.sphere(0.066).at(POST_X, TOP_Y, 0),
      sdf.sphere(0.052).at(POST_X, 1.248, 0),
    );
    const foot = sdf.capsule([POST_X, 0.05, -0.36], [POST_X, 0.05, 0.18], 0.05);
    const brace = sdf.capsule([POST_X, 0.07, -0.28], [POST_X, 0.62, -0.04], 0.026);
    const side = sdf.smoothUnion(0.016, post, foot, brace);

    const topBeam = sdf
      .smoothUnion(
        0.012,
        sdf.cylinder(BEAM_R, TOP_HALF * 2).rotateZ(90),
        sdf.sphere(BEAM_R).at(-TOP_HALF, 0, 0),
        sdf.sphere(BEAM_R).at(TOP_HALF, 0, 0),
      )
      .at(0, TOP_Y, 0);
    const clothBeam = sdf
      .smoothUnion(
        0.012,
        sdf.cylinder(BEAM_R, CLOTH_HALF * 2).rotateZ(90),
        sdf.sphere(BEAM_R).at(-CLOTH_HALF, 0, 0),
        sdf.sphere(BEAM_R).at(CLOTH_HALF, 0, 0),
      )
      .at(0, CLOTH_Y, 0);
    const stretcher = sdf.capsule([-POST_X, 0.16, 0], [POST_X, 0.16, 0], 0.026);
    const rearTie = sdf.capsule([-POST_X, 0.08, -0.26], [POST_X, 0.08, -0.26], 0.022);
    // Heddle rod across the open warp, just above the woven fell.
    const heddle = sdf.capsule([-0.48, 0.98, 0.036], [0.48, 0.98, 0.036], 0.018);

    const seat = sdf.box([0.58, 0.056, 0.26], 0.016).at(0, SEAT_TOP - 0.028, SEAT_Z);
    const leg = (sx: number, sz: number) =>
      sdf.cone(
        [sx * 0.2, 0, SEAT_Z + sz * 0.1],
        [sx * 0.16, SEAT_TOP - 0.04, SEAT_Z + sz * 0.045],
        0.038,
        0.026,
      );
    const benchRail = sdf.capsule([-0.16, 0.13, SEAT_Z], [0.16, 0.13, SEAT_Z], 0.02);
    const bench = sdf.smoothUnion(0.012, seat, leg(1, 1), leg(1, -1), leg(-1, 1), leg(-1, -1), benchRail);

    const frame = sdf
      .smoothUnion(0.014, side.mirror('x', 0), topBeam, clothBeam, stretcher, rearTie, heddle, bench)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 10, y * 6, z * 10, 2);
      let c = mixRgb(HONEY, BROWN, 0.16 * grain);
      c = mixRgb(c, PALE, 0.08 * Math.max(0, 0.5 - grain));
      const low = clamp01((0.24 - y) / 0.24);
      c = mixRgb(c, WALNUT, 0.72 * low * low + 0.28 * low);
      // Pale end grain on the beam ends.
      const topEnd = Math.min(Math.hypot(x - 0.6, y - TOP_Y, z), Math.hypot(x + 0.6, y - TOP_Y, z));
      const clothEnd = Math.min(
        Math.hypot(x - 0.536, y - CLOTH_Y, z),
        Math.hypot(x + 0.536, y - CLOTH_Y, z),
      );
      const end = clamp01(1 - Math.min(topEnd, clothEnd) / 0.05);
      c = mixRgb(c, PALE, 0.75 * end);
      // Worn seat top.
      const seatTop =
        clamp01((y - (SEAT_TOP - 0.012)) / 0.012) * clamp01((0.16 - Math.abs(z - SEAT_Z)) / 0.08);
      c = mixRgb(c, PALE_LIT, 0.4 * seatTop * clamp01(1 - Math.abs(x) / 0.32));
      return c;
    };

    k.body('frame', frame.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 14, y * 8, z * 14, 2),
      maxTriangles: 2500,
    });

    // ------------------------------------------------------------------ iron
    const peg = (x: number, y: number) =>
      sdf.smoothUnion(
        0.005,
        sdf.cylinder(0.014, 0.07).rotateX(90).at(x, y, 0.02),
        sdf.sphere(0.026).at(x, y, 0.058),
      );
    const iron = sdf.union(peg(POST_X, TOP_Y), peg(-POST_X, TOP_Y), peg(POST_X, CLOTH_Y), peg(-POST_X, CLOTH_Y));
    const ironPaint = (x: number, y: number, z: number) => mixRgb(IRON, IRON_HI, 0.7 * clamp01((z - 0.04) / 0.03));
    k.body('pegs', iron.paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      maxTriangles: 360,
    });

    // ------------------------------------------------------------------ warp
    // Cream threads through heddle loops on both beams. A small z stagger shows from the side.
    const threads = WARP_XS.map((x, i) => {
      const z = i % 2 === 0 ? 0.01 : -0.008;
      return sdf.capsule([x, 0.38, z], [x, 1.16, z], WARP_R);
    });
    const loops = WARP_XS.flatMap((x) => [
      sdf.torus(LOOP_R, LOOP_T).rotateZ(90).at(x, TOP_Y, 0),
      sdf.torus(LOOP_R, LOOP_T).rotateZ(90).at(x, CLOTH_Y, 0),
    ]);
    const warp = sdf.union(...threads, ...loops);
    const warpPaint = (x: number, y: number, z: number) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 8, y * 22, z * 8, 2);
      let c = mixRgb(CREAM, CREAM_SHADE, 0.22 * n);
      c = mixRgb(c, rgb('#fff6e8'), 0.16 * clamp01((z + 0.02) / 0.06));
      return c;
    };
    k.body('warp', warp.paintFn(warpPaint), {
      color: '#f3e6cc',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      paintWeight: 1,
      bump: (x, y, z) => 0.0011 * Math.sin(y * 90 + x * 6),
      maxTriangles: 1700,
    });

    // ------------------------------------------------------------------ cloth
    // One slab, half the warp. Red bands are wider than cream. Nubs mark the working fell.
    const panel = sdf.box([0.62, CLOTH_TOP - CLOTH_BOT, CLOTH_T], 0.012).at(0, CLOTH_MID_Y, CLOTH_Z);
    const hem = sdf.capsule([-0.28, CLOTH_BOT + 0.004, CLOTH_Z], [0.28, CLOTH_BOT + 0.004, CLOTH_Z], 0.016);
    const scrap = sdf.box([0.16, 0.022, 0.1], 0.008).rotateY(-16).at(0.12, SEAT_TOP + 0.006, SEAT_Z);
    const cloth = sdf.smoothUnion(0.008, panel, hem, scrap);
    const clothPaint = (x: number, y: number, z: number) => {
      if (z > 0.22 && y < 0.46) {
        const fold = Math.floor((x + 0.3) / 0.04);
        const red = ((fold % 2) + 2) % 2 === 0;
        return weave(x, y, red ? RED : CLOTH_CREAM, red ? RED_DEEP : CREAM_SHADE);
      }
      const span = CLOTH_TOP - CLOTH_BOT;
      const t = clamp01((y - CLOTH_BOT) / span);
      // Red, cream, red, cream, red. Red owns the working edge.
      const stops = [0, 0.24, 0.4, 0.62, 0.78, 1];
      let band = 0;
      for (let i = 0; i < 4; i++) if (t >= stops[i + 1]!) band = i + 1;
      const red = band % 2 === 0;
      const base = red ? RED : CLOTH_CREAM;
      const shade = red ? RED_DEEP : CREAM_SHADE;
      let c = weave(x, y, y > CLOTH_TOP - 0.04 ? RED : base, y > CLOTH_TOP - 0.04 ? RED_DEEP : shade);
      const n = noise.fbm(x * 14, y * 18, z * 10, 2);
      c = mixRgb(c, shade, 0.06 * (0.5 + 0.5 * n));
      return c;
    };
    k.body('cloth', cloth.paintFn(clothPaint), {
      color: '#c4453c',
      roughness: 0.88,
      metalness: 0,
      detail: 0.007,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * Math.sin(y * 78) + 0.001 * Math.sin(x * 84),
      maxTriangles: 1100,
    });

    // ------------------------------------------------------------------ yarn
    // Ball sits on the bench so it reads as the weaver's supply, not a dropped fruit.
    const ball = sdf.sphere(0.05).scale([1, 0.86, 1]).at(-0.15, SEAT_TOP + 0.032, SEAT_Z - 0.01);
    // Short red weft wound on the shuttle waist. Stays smaller than the boat.
    const bobbin = poseShuttle(sdf.cylinder(0.022, 0.05, 0.004).rotateZ(90));
    const yarn = sdf.union(ball, bobbin);
    const yarnPaint = (x: number, y: number, z: number) => {
      const spiral = 0.5 + 0.5 * Math.sin(y * 55 + Math.atan2(z - SEAT_Z, x + 0.15) * 3);
      return mixRgb(RED, RED_DEEP, 0.38 * spiral);
    };
    k.body('yarn', yarn.paintFn(yarnPaint), {
      color: '#c4453c',
      roughness: 0.9,
      metalness: 0,
      detail: 0.006,
      paintWeight: 1,
      maxTriangles: 320,
    });

    // ------------------------------------------------------------------ shuttle
    const shuttle = poseShuttle(
      sdf
        .smoothUnion(0.01, sdf.capsule([-0.15, 0, 0], [0.15, 0, 0], 0.02), sdf.sphere(0.03).at(0, 0, 0))
        .scale([1, 0.9, 0.7]),
    );
    const shuttlePaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 18, y * 10, z * 18, 2);
      return mixRgb(PALE_LIT, PALE, 0.35 * grain);
    };
    k.body('shuttle', shuttle.paintFn(shuttlePaint), {
      color: '#c9a06a',
      roughness: 0.78,
      metalness: 0,
      detail: 0.005,
      paintWeight: 1,
      maxTriangles: 320,
    });
  },
});
