import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — dungeon prison cell bars (dungeon/prop/cell-bars).
 *
 * Role: a 2 m frontage section of a dungeon prison cell; a mid-ground prop seen
 *   at 128 px, must tile visually with the dungeon wall runs (2 m grid).
 * Size: 2.0 m wide (X), ~1.65 m tall, ~0.4 m deep; stands on y = 0, faces +Z.
 * One idea: seven fat iron bars caged between chunky blue-gray stone posts —
 *   six straight, one bowed outward as if something pushed through.
 * Shape language: square/blocky stone dominant (sturdy), round iron secondary
 *   (bars, rail, rivets); the bent bar breaks the silhouette.
 * Palette: stone deep slate #2a3547 (dark joints), mid blue-gray #4a5d75 (mid),
 *   pale worn tops #7a8ba0 (light); iron dark #3d4047 with rust #8a5a35 patches;
 *   moss teal #3fae9a at the base only. Value plan: pale caps, mid stone, near-
 *   black iron with warm rust speckle.
 * Materials: stone (roughness 0.9, metalness 0), worn iron (roughness 0.55,
 *   metalness 0.8, tiny bump). No light source on this asset — no emissive.
 * Detail list: posts + caps + curb (big), 7 bars + top rail + rivets (big),
 *   per-block tint + rust patches (medium), fbm bump (small). Focal point: the
 *   bent bar.
 * Rig/animation: none (static prop).
 */

const SLATE = rgb('#2a3547');
const BLOCK = rgb('#4a5d75');
const BLOCK_DARK = rgb('#35465a');
const PALE = rgb('#7a8ba0');
const PALE_HI = rgb('#a6b6c9');
const MOSS = rgb('#3fae9a');
const MOSS_DARK = rgb('#2d7f73');
const IRON = rgb('#3d4047');
const IRON_DARK = rgb('#23262c');
const RUST = rgb('#8a5a35');
const RUST_DARK = rgb('#5e3a1e');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// Posts: outer faces flush at x = ±1.0 so the piece fills a 2 m frontage.
const POST_W = 0.3;
const POST_D = 0.4;
const POST_X = 0.85; // post center
const POST_H = 1.5; // shaft top; cap sits above
const CAP_H = 0.14;

// Stone curb between the posts.
const CURB_TOP = 0.3;
const CURB_D = 0.26;

// Bars.
const BAR_R = 0.037; // fat enough to read at 128 px
const BAR_BOT = 0.22; // buried into the curb
const BAR_TOP = 1.36; // ends well inside the rail (rail spans 1.315–1.445)
const BAR_XS = [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6];
const BENT_I = 5; // the bar at x = +0.4 bows outward (+Z)
const BENT_Z = 0.09; // bow amount at mid height

const RAIL_Y = 1.38;
const RAIL_H = 0.13;
const RAIL_D = 0.15;

export default defineAsset({
  name: 'cell-bars',
  description:
    'Dungeon cell frontage: seven fat iron bars (one bowed outward) between a stone curb, a top iron rail, and two chunky stone posts; 2 m wide.',
  detail: 0.012,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ stone
    // Each post: two stacked pillow blocks + a wider cap slab with a pale top.
    const postAt = (x: number) => {
      const lo = sdf.box([POST_W, 0.72, POST_D], 0.06).at(x, 0.36, 0);
      const hi = sdf.box([POST_W, 0.72, POST_D], 0.06).at(x, 1.06, 0);
      const cap = sdf.box([POST_W + 0.1, CAP_H, POST_D + 0.1], 0.045).at(x, 1.44, 0);
      return sdf.smoothUnion(0.02, lo, hi, cap);
    };
    // Low curb between the posts; bars bury into it.
    const curb = sdf.box([2 * POST_X - POST_W + 0.1, CURB_TOP + 0.06, CURB_D], 0.05).at(0, (CURB_TOP - 0.06) / 2, 0);
    const stoneGeo = sdf
      .smoothUnion(0.02, postAt(-POST_X), postAt(POST_X), curb)
      .displace(0.006, (x, y, z) => noise.fbm(x * 3, y * 3, z * 3, 3, 5))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const tint = noise.random(Math.floor((x + 1) * 3) + Math.floor(y * 2) * 7, 4, 9);
      let c = mixRgb(base, BLOCK_DARK, 0.15 + 0.3 * tint);
      const patch = noise.fbm(x * 3.1, y * 3.1, z * 3.1, 3, 4);
      c = mixRgb(c, SLATE, clamp01(-patch) * 0.25);
      // Pale worn tops on caps and curb top.
      const capWear = clamp01((y - POST_H) / CAP_H);
      const curbWear = clamp01((y - (CURB_TOP - 0.1)) / 0.1) * (Math.abs(x) < POST_X ? 1 : 0);
      const wear = Math.max(capWear, curbWear * 0.8);
      c = mixRgb(c, PALE, wear * 0.75);
      c = mixRgb(c, PALE_HI, wear * wear * 0.25);
      // Ground shadow + moss creeping up the base.
      c = mixRgb(c, SLATE, clamp01((0.18 - y) / 0.18) * 0.35);
      const m = noise.fbm(x * 3 + 20, y * 3, z * 3 + 20, 3, 9);
      const mossAmt = clamp01((m - 0.06) * 2.6) * clamp01((0.32 - y) / 0.28);
      c = mixRgb(c, MOSS_DARK, mossAmt * 0.5);
      c = mixRgb(c, MOSS, mossAmt * 0.3);
      return c;
    };

    k.body('stone', stoneGeo.paintFn(stonePaint), {
      color: '#4a5d75',
      roughness: 0.9,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 2200,
      paintWeight: 2,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 26, y * 26, z * 26, 3, 11),
    });

    // ------------------------------------------------------------------ iron
    // Straight bars: capsules buried top and bottom. The bent bar is a smooth
    // chain bowing outward (+Z) at mid height.
    const bars = BAR_XS.map((x, i) => {
      if (i === BENT_I) {
        const mid = (BAR_BOT + BAR_TOP) / 2;
        return sdf.chain(
          [
            [x, BAR_BOT, 0, BAR_R],
            [x, mid - 0.3, BENT_Z * 0.55, BAR_R],
            [x, mid, BENT_Z, BAR_R],
            [x, mid + 0.3, BENT_Z * 0.55, BAR_R],
            [x, BAR_TOP, 0, BAR_R],
          ],
          0.03,
        );
      }
      return sdf.capsule([x, BAR_BOT, 0], [x, BAR_TOP, 0], BAR_R);
    });
    // Rail spanning into both posts. (No rivets: small studs on the flat rail
    // face triangulated into visible shading fans.)
    const rail = sdf.box([2 * POST_X, RAIL_H, RAIL_D], 0.04).at(0, RAIL_Y, 0);
    // Collar rings where each bar meets the curb top.
    const collars = BAR_XS.map((x, i) =>
      sdf.torus(BAR_R + 0.008, 0.014).rotateX(90).at(x, CURB_TOP + 0.01, i === BENT_I ? BENT_Z * 0.12 : 0),
    );
    // Hard union: smooth blending pulled visible bulges into the rail's top face.
    const ironGeo = sdf.union(...bars, rail, ...collars);

    const ironPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const patch = noise.fbm(x * 9, y * 9, z * 9, 3, 12);
      const speck = noise.fbm(x * 30 + 7, y * 30, z * 30, 2, 6);
      let c = mixRgb(base, IRON_DARK, 0.25 + 0.35 * clamp01(-patch));
      // Rust blooms: broad warm patches plus fine speckle, stronger low down.
      const low = clamp01((0.9 - y) / 0.9);
      const rustAmt = clamp01((patch - 0.05) * 1.8) * (0.35 + 0.65 * low);
      c = mixRgb(c, RUST_DARK, rustAmt * 0.6);
      c = mixRgb(c, RUST, rustAmt * clamp01(0.3 + speck) * 0.7);
      // Slight top highlight so bars read round.
      c = mixRgb(c, PALE, clamp01((y - 1.0) / 0.5) * 0.08);
      return c;
    };

    k.body('iron', ironGeo.paintFn(ironPaint), {
      color: '#3d4047',
      roughness: 0.55,
      metalness: 0.8,
      detail: 0.008,
      maxTriangles: 2600,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 40, z * 40, 2, 8),
    });
  },
});
