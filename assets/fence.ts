import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — wooden yard fence segment (architecture/building-parts).
 *
 * Role: a repeatable background piece for a cozy chibi hamlet. The player sees it in runs,
 *   so it must read as a clean silhouette at 128 px and tile without a seam.
 * Size: 1.8 m between post centers (1.93 m overall) and 1.1 m tall, on y = 0, centered on X;
 *   faces +Z.
 * One idea: a chunky picket fence — two round end posts frame two round rails and three
 *   rounded pickets; the picket rhythm is the signature.
 * Shape language: round wood forms dominant (friendly), square secondary (sturdy rails).
 * Palette: one warm brown wood family. Mid #8a5a30 (dominant), light #d6a561 (sun-lit top),
 *   dark #3a2210 (shaded foot). No paint accents: whole fence is one wood.
 * Materials: wood only (roughness 0.82, metalness 0), fine grain in `bump`.
 * Detail: primary posts, rails, pickets; secondary domed post and picket tops; tertiary
 *   grain in `bump`. Focal point: the picket rhythm against the posts.
 * Rig/animation: none.
 *
 * Tiling: posts sit at x = -0.9 and +0.9 at the same 1.1 m height, and every part stands
 *   on or above y = 0. Place the next segment at x += 1.8 and the posts meet.
 */

const L = 1.8; // segment length along X
const HALF = L / 2;

const POST_R = 0.066; // round post radius
const POST_H = 1.1; // post top height (both ends equal, so segments tile)

const RAIL_R = 0.043; // round rail radius
const RAIL_BOT = 0.34; // bottom rail center height
const RAIL_TOP = 0.8; // top rail center height

const PICKET_X = [-0.45, 0, 0.45]; // three upright pickets
const PICKET_W = 0.1; // picket width along X
const PICKET_D = 0.06; // picket thickness along Z
const PICKET_Z = 0.045; // pickets sit proud of the rails, as nailed boards
const PICKET_BOT = 0.16; // picket bottom, above the flat ground line
const PICKET_TOP = 1.0; // picket top, below the post tops

const WOOD_MID = rgb('#8a5a30');
const WOOD_LIGHT = rgb('#d6a561');
const WOOD_DARK = rgb('#3a2210');

export default defineAsset({
  name: 'fence',
  description: 'Repeatable wooden yard fence segment: two round posts, two rails, three pickets.',
  detail: 0.009,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ posts
    // Flat foot on y = 0, a soft dome on top. A capsule gives an even round shaft.
    const postAt = (x: number) => {
      const shaft = sdf.capsule([x, POST_R, 0], [x, POST_H - POST_R, 0], POST_R);
      // Cut the rounded foot flat so the ground line is perfect.
      return shaft.intersect(sdf.halfSpace([0, -1, 0], 0));
    };
    const posts = sdf.union(postAt(-HALF), postAt(HALF));

    // ------------------------------------------------------------------ rails
    // Round rails along X, long enough to bury both ends inside the posts.
    const railLen = L + 0.1;
    const railAt = (y: number) =>
      sdf.cylinder(RAIL_R, railLen, 0.016).rotateZ(90).at(0, y, 0);
    const rails = sdf.union(railAt(RAIL_BOT), railAt(RAIL_TOP));

    // ------------------------------------------------------------------ pickets
    // Soft plank with a domed top, nailed proud of the front of the rails; the overlap keeps
    // the whole fence one solid member.
    const picketAt = (x: number) => {
      const domeH = PICKET_W / 2;
      const shaftH = PICKET_TOP - domeH - PICKET_BOT;
      const shaft = sdf
        .box([PICKET_W, shaftH, PICKET_D], 0.024)
        .at(x, PICKET_BOT + shaftH / 2, PICKET_Z);
      const dome = sdf
        .ellipsoid([PICKET_W / 2, domeH, PICKET_D / 2])
        .at(x, PICKET_TOP - domeH, PICKET_Z);
      return sdf.smoothUnion(0.016, shaft, dome);
    };
    const pickets = sdf.union(...PICKET_X.map(picketAt));

    // ------------------------------------------------------------------ material
    // One warm brown wood for the whole fence. Smooth broad tone plus a vertical value plan
    // (shaded foot, sun-lit top) keeps it from reading flat. Fine grain lives in `bump` only,
    // so the silhouette stays crisp.
    const wood = sdf.union(posts, rails, pickets).paintFn((x, y, z) => {
      // Broad, smooth tone: low-frequency only so the mesh still reduces cleanly.
      const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 3);
      const t = clamp01(y / 1.1);
      // Damp, shaded wood low down; sun-bleached and warm at the top of every member.
      const shade = 1 - t;
      const base = mixRgb(WOOD_LIGHT, WOOD_MID, 0.2 + 0.55 * patch);
      const dark = mixRgb(base, WOOD_DARK, clamp01(0.24 + 0.82 * shade * shade));
      const glow = clamp01((t - 0.5) / 0.5);
      return mixRgb(dark, WOOD_LIGHT, 0.55 * glow);
    });

    k.body('wood', wood, {
      color: '#8a5a30',
      roughness: 0.82,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 26, y * 8, z * 26, 2),
    });
  },
});
