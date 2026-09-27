import { defineAsset, sdf, profile, rgb, mixRgb } from '../src/index.js';

// Design note (8 lines):
// - Role: standing outdoor lamp + cozy landmark for a chibi hamlet square. Reads at 128 px.
// - Size: ~1.45 m tall, stands on y = 0, faces +Z. Chunky friendly iron post + big glass head.
// - The one idea: an oversized glowing candy-like glass head on a stubby iron post.
// - Shape language: round/soft dominant (bulged post, cone cap, teardrop flame); square
//   secondary (boxy glass head + plates) for a sturdy, readable silhouette.
// - Palette: dark iron #3d4047, warm glass #ffd9a0, flame accent #ff9a2a, brass #d9a93a,
//   candle cream #f2eadb. Dark frame vs bright glass = strongest contrast at focal point.
// - Materials: iron (metal), glass (transparent + emissive), flame (strong emissive), wax.
// - Details: stepped round base, post bulge + collar rings, 4 corner posts, peaked cap + finial.
// - Rig/animation: none (static prop).

const IRON = '#3d4047';
const BRASS = '#d9a93a';
const GLASS = '#ffd9a0';
const GLASS_GLOW = '#ffb85e';
const FLAME = '#ff9a2a';
const FLAME_HOT = '#ffe9a8';
const WAX = '#f2eadb';

export default defineAsset({
  name: 'lantern',
  description: 'Chunky standing iron lantern with a glowing glass head and peaked cap.',
  detail: 0.005,

  build(k) {
    // ------------------------------------------------------------------ ironwork
    // Base: two stepped round discs with a collar ball, all softly blended.
    const base = sdf.smoothUnion(
      0.015,
      sdf.cylinder(0.17, 0.07, 0.02).at(0, 0.035, 0),
      sdf.cylinder(0.125, 0.07, 0.02).at(0, 0.1, 0),
      sdf.sphere(0.07).at(0, 0.15, 0),
    );
    // Post: gentle taper with a chunky mid bulge (friendly, not a plain pole).
    const post = sdf.smoothUnion(
      0.02,
      sdf.cone([0, 0.12, 0], [0, 0.98, 0], 0.05, 0.034),
      sdf.sphere(0.06).at(0, 0.45, 0),
      sdf.torus(0.055, 0.014).at(0, 0.3, 0),
      sdf.torus(0.048, 0.012).at(0, 0.72, 0),
    );
    // Head frame: bottom + top plates, 4 corner posts, peaked cap with an
    // eave brim, finial ball. Crisp union: metalwork reads better with edges.
    const cx = 0.135;
    // Peaked cap: a solid of revolution (wide eave curling to a peak).
    // NOTE: do not use sdf.cone here: a stubby cone whose (ra - rb) exceeds its
    // height makes the rounded-cone SDF hollow and breaks mesh reduction.
    const capProfile = profile.polygon(
      [
        [0, 0],
        [0.2, 0],
        [0.2, 0.02],
        [0.12, 0.07],
        [0.05, 0.11],
        [0.012, 0.13],
        [0, 0.135],
      ],
      { smooth: true, samples: 8 },
    );
    const frame = sdf.union(
      sdf.box([0.34, 0.05, 0.34], 0.015).at(0, 0.99, 0),
      sdf.box([0.34, 0.05, 0.34], 0.015).at(0, 1.3, 0),
      ...[-cx, cx].flatMap((x) =>
        [-cx, cx].map((z) => sdf.box([0.035, 0.32, 0.035], 0.01).at(x, 1.145, z)),
      ),
      sdf.revolve(capProfile).at(0, 1.325, 0), // peaked cap
      sdf.sphere(0.028).at(0, 1.47, 0), // finial ball
    );
    const iron = sdf
      .smoothUnion(0.02, base, post)
      .union(frame)
      // Brass accents: finial ball + both collar rings.
      .paintWhere(sdf.sphere(0.04).at(0, 1.47, 0), rgb(BRASS), 0.008)
      .paintWhere(sdf.box([0.2, 0.05, 0.2], 0.01).at(0, 0.3, 0), rgb(BRASS), 0.008)
      .paintWhere(sdf.box([0.2, 0.05, 0.2], 0.01).at(0, 0.72, 0), rgb(BRASS), 0.008);
    k.body('iron', iron, { color: IRON, roughness: 0.55, metalness: 0.7, detail: 0.007 });

    // ------------------------------------------------------------------ glass
    // Four thin panels (hollow inside so the flame floats free, never buried).
    const glass = sdf.smoothUnion(
      0.008,
      sdf.box([0.25, 0.26, 0.014], 0.005).at(0, 1.145, 0.118),
      sdf.box([0.25, 0.26, 0.014], 0.005).at(0, 1.145, -0.118),
      sdf.box([0.014, 0.26, 0.25], 0.005).at(0.118, 1.145, 0),
      sdf.box([0.014, 0.26, 0.25], 0.005).at(-0.118, 1.145, 0),
    );
    k.body('glass', glass, {
      color: GLASS,
      roughness: 0.12,
      metalness: 0,
      opacity: 0.45,
      emissive: GLASS_GLOW,
      emissiveIntensity: 0.6,
    });

    // ------------------------------------------------------------------ candle + flame
    const candle = sdf.cylinder(0.032, 0.06, 0.008).at(0, 1.045, 0);
    k.body('candle', candle, { color: WAX, roughness: 0.6 });
    // Teardrop flame: big round belly + smaller tip, pale hot core at the bottom.
    const flame = sdf
      .smoothUnion(0.02, sdf.sphere(0.038).at(0, 1.1, 0), sdf.sphere(0.022).at(0, 1.15, 0))
      .paintFn((_x, y, _z, _base) => {
        const t = Math.max(0, Math.min(1, (y - 1.06) / 0.12));
        return mixRgb(rgb(FLAME_HOT), rgb(FLAME), t);
      });
    k.body('flame', flame, {
      color: FLAME,
      roughness: 0.4,
      emissive: '#ff8a1e',
      emissiveIntensity: 2.2,
      detail: 0.004,
    });
  },
});
