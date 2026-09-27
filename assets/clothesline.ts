import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — cottage clothesline (prop).
 *
 * Role: cozy hamlet yard dressing between cottages and fences; must read at 128 px.
 * Size: two chunky posts 1.8 m tall at x = ±1.0, a rope sagging to 1.54 m between them,
 *   laundry hanging down to about 0.95 m. Stands on y = 0; the line runs along X; faces +Z.
 * One idea: bright laundry swaying on a sagging rope — a slice of cottage life.
 * Shape language: round chunky wood (dominant), soft rounded cloth slabs with wavy hems
 *   (secondary).
 * Palette: fence wood #8a5a30 / #d6a561 / #3a2210; laundry from the stall's cloth family:
 *   coral red #d9543f shirt, glazed-teal #2fb5a9 dress, awning cream #f4ecdc towel,
 *   amber #f0a83a kerchief; rope #d8b87e; terracotta pot #b8633f with wildflower accents.
 * Materials: wood (0.82), rope (0.92), cloth (0.85), terracotta (0.8), petals (0.7).
 * Detail: posts + sagging rope + four garments (primary); fold ridges, pins, pot (secondary);
 *   grain, weave, and rope twist (tertiary). Focal point: the teal dress at the center.
 * Rig: none.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const DEG = Math.PI / 180;

// ---------------------------------------------------------------- layout
const POST_X = 1.0; // post centers
const POST_R = 0.078; // chunky round posts, the fence's stock
const POST_H = 1.8;

const ROPE_Y = 1.69; // attach height on the posts
const ROPE_HALF = 0.95; // rope ends buried in the post shafts
const SAG = 0.15; // dip at mid span
const ROPE_R = 0.024;

const CLOTH_T = 0.052; // garment thickness

/** Rope mid-line height at world x. */
const ropeY = (x: number) => ROPE_Y - SAG * (1 - (x / ROPE_HALF) ** 2);
/** Rope slope at world x, degrees; garments sway to follow it. */
const ropeAngle = (x: number) => Math.atan((2 * SAG * x) / (ROPE_HALF * ROPE_HALF)) / DEG;

// ---------------------------------------------------------------- palette
const WOOD_MID = rgb('#8a5a30');
const WOOD_LIGHT = rgb('#d6a561');
const WOOD_DARK = rgb('#3a2210');

const ROPE_DARK = rgb('#a8845a');

const POT = rgb('#b8633f');
const POT_DARK = rgb('#7d4028');

const GREEN_LEAF = '#4d8f42';

// ---------------------------------------------------------------- cloth helpers

/**
 * Value plan for one garment, sampled in its local frame: sun on the shoulders, a soft
 * mid-tone at the hem, plus low-frequency patches so the folds catch light unevenly.
 */
const clothShade =
  (light: string, dark: string, top: number, bottom: number) =>
  (x: number, y: number, z: number, base: Rgb): Rgb => {
    const t = clamp01((top - y) / (top - bottom));
    const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 5, z * 6, 2);
    const shaded = mixRgb(base, rgb(dark), 0.34 * t * (0.55 + 0.45 * patch));
    return mixRgb(shaded, rgb(light), (1 - t) * 0.2);
  };

/** The cloth folded over the rope: a ridge that fully encases the line. */
const fold = (hw: number, r = 0.034) => sdf.capsule([-hw, 0.004, 0], [hw, 0.004, 0], r);

/** A wooden clothespin, proud of the cloth's front face. Local frame of its garment. */
const pin = (lx: number) =>
  sdf.box([0.018, 0.06, 0.014], 0.005).at(lx, 0.028, 0.024);

/** Soft vertical wrinkles; low frequency so the mesh still reduces cleanly. */
const wrinkle = (amp: number) => (x: number, y: number, z: number) =>
  amp * noise.fbm(x * 6, y * 4.5, z * 6, 2);

/** Place a garment-local shape onto the sagging rope with a slight sway. */
const hang = (x: number, swayDeg: number, local: Sdf) =>
  local.rotateZ(swayDeg).at(x, ropeY(x), 0);

// ---------------------------------------------------------------- garments

/** A coral shirt: sloped short sleeves, a body widening to a three-scallop hem. */
const shirt = hang(
  -0.5,
  -8,
  sdf
    .smoothUnion(
      0.014,
      sdf.extrude(
        profile.polygon(
          [
            [-0.115, 0.026],
            [0.115, 0.026],
            [0.138, -0.42],
            [0.09, -0.475],
            [0.045, -0.425],
            [0, -0.48],
            [-0.045, -0.425],
            [-0.09, -0.475],
            [-0.138, -0.42],
          ],
          { smooth: true },
        ),
        CLOTH_T,
        0.012,
      ),
      fold(0.12),
      sdf.capsule([-0.112, -0.05, 0], [-0.2, -0.185, 0], 0.047).scale([1, 1, 0.6]),
      sdf.capsule([0.112, -0.05, 0], [0.2, -0.185, 0], 0.047).scale([1, 1, 0.6]),
    )
    .displace(0.009, wrinkle(1))
    .paintFn(clothShade('#e8735c', '#a83a2a', 0.03, -0.48)),
);

/** A teal dress with puff sleeves, a cream sash, and a wide four-scallop skirt. */
const dress = hang(
  0.02,
  2,
  sdf
    .smoothUnion(
      0.014,
      sdf.extrude(
        profile.polygon(
          [
            [-0.1, 0.026],
            [0.1, 0.026],
            [0.088, -0.16],
            [0.19, -0.56],
            [0.13, -0.615],
            [0.065, -0.565],
            [0, -0.62],
            [-0.065, -0.565],
            [-0.13, -0.615],
            [-0.19, -0.56],
            [-0.088, -0.16],
          ],
          { smooth: true },
        ),
        CLOTH_T,
        0.012,
      ),
      fold(0.105),
      sdf.ellipsoid([0.055, 0.05, 0.036]).at(-0.105, -0.052, 0),
      sdf.ellipsoid([0.055, 0.05, 0.036]).at(0.105, -0.052, 0),
    )
    .displace(0.009, wrinkle(1))
    .paintFn(clothShade('#55cabb', '#1a7a72', 0.03, -0.62))
    .paintWhere(sdf.box([0.3, 0.05, 0.2]).at(0, -0.18, 0), '#f4ecdc', 0.004),
);

/** A small amber kerchief: a rounded triangle, the bright beat between dress and towel. */
const kerchief = hang(
  0.34,
  5,
  sdf
    .smoothUnion(
      0.01,
      sdf.extrude(
        profile.polygon(
          [
            [-0.115, 0.026],
            [0.115, 0.026],
            [0, -0.165],
          ],
          { smooth: true },
        ),
        CLOTH_T,
        0.01,
      ),
      fold(0.11, 0.03),
    )
    .displace(0.006, wrinkle(1))
    .paintFn(clothShade('#f7c063', '#c8852a', 0.03, -0.165)),
);

/** A cream towel folded double over the line, with a crisp coral stripe near the hem. */
const towel = hang(
  0.68,
  10,
  sdf
    .smoothUnion(
      0.014,
      sdf.extrude(profile.rect([0.44, 0.315], 0.035), 0.07, 0.014).at(0, -0.127, 0),
      fold(0.2, 0.042),
    )
    .displace(0.008, wrinkle(1))
    .paintFn((x, y, z, base) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 5, z * 6, 2);
      return mixRgb(base, rgb('#d9cdb4'), (0.12 + 0.2 * patch) * clamp01((0.03 - y) / 0.31));
    })
    .paintWhere(sdf.box([0.5, 0.075, 0.2]).at(0, -0.2, 0), '#d9543f', 0.006),
);

// ---------------------------------------------------------------- flower pot

/** One round flower head: a ring of petals around a center dome, tilted toward the sun. */
const flowerHead = (
  p: readonly [number, number, number],
  r: number,
  n: number,
  tilt: number,
  petal: string,
  center: string,
): Sdf => {
  const ring = r * 0.52;
  const petals = Array.from({ length: n }, (_, i) => {
    const a = (i * 360) / n;
    const rad = a * DEG;
    return sdf
      .ellipsoid([r * 0.46, r * 0.4, r * 0.2])
      .rotateZ(a)
      .at(Math.cos(rad) * ring, Math.sin(rad) * ring, 0);
  });
  const dome = sdf.ellipsoid([r * 0.32, r * 0.32, r * 0.2]).at(0, 0, r * 0.05);
  return sdf
    .smoothUnion(r * 0.2, ...petals)
    .smoothUnion(r * 0.12, dome)
    .rotateX(tilt)
    .at(p[0], p[1], p[2])
    .paint(petal)
    .paintWhere(
      sdf.ellipsoid([r * 0.36, r * 0.36, r * 0.3]).rotateX(tilt).at(p[0], p[1], p[2] + r * 0.05),
      center,
      0.0015,
    );
};

const potX = -0.895;
const potZ = 0.21;

const potProfile = profile.polygon(
  [
    [0, 0],
    [0.075, 0],
    [0.095, 0.03],
    [0.112, 0.135],
    [0.115, 0.16],
    [0.09, 0.16],
    [0.082, 0.13],
    [0.07, 0.045],
    [0, 0.045],
  ],
  { smooth: true },
);

const pot = sdf
  .revolve(potProfile)
  .at(potX, 0, potZ)
  .paintFn((x, y, z, base) => {
    const grain = 0.5 + 0.5 * noise.noise3(x * 22, y * 22, z * 22);
    const shaded = mixRgb(base, POT_DARK, (0.2 + 0.24 * grain) * (1 - clamp01(y / 0.16)) + 0.12);
    return shaded;
  });

const flowers = sdf.union(
  flowerHead([potX - 0.045, 0.25, potZ + 0.025], 0.05, 7, -18, '#e2503c', '#f6c33c'),
  flowerHead([potX + 0.045, 0.265, potZ - 0.02], 0.046, 6, -24, '#f0a83a', '#f7efdc'),
  flowerHead([potX, 0.24, potZ - 0.065], 0.042, 6, -12, '#f5f0e2', '#f2a63a'),
);

// A low green mound the heads sprout from: no fragile stems, and it hides the head bases.
const potLeaves = sdf.smoothUnion(
  0.008,
  sdf.ellipsoid([0.105, 0.075, 0.105]).at(potX, 0.16, potZ),
  sdf.ellipsoid([0.05, 0.016, 0.026]).rotateZ(-32).rotateY(24).at(potX - 0.075, 0.19, potZ + 0.02),
  sdf.ellipsoid([0.05, 0.016, 0.026]).rotateZ(30).rotateY(-22).at(potX + 0.075, 0.185, potZ - 0.015),
  sdf.ellipsoid([0.044, 0.015, 0.026]).rotateX(-38).at(potX + 0.005, 0.185, potZ + 0.075),
  sdf.ellipsoid([0.044, 0.015, 0.026]).rotateX(30).at(potX - 0.01, 0.18, potZ - 0.075),
);

// ---------------------------------------------------------------- assembly

export default defineAsset({
  name: 'clothesline',
  description:
    'Cottage clothesline: two chunky wooden posts with a sagging rope, four bright garments pinned over it, and a potted wildflower at a post base.',
  detail: 0.012,
  texture: { size: 1024 },

  build(k) {
    // --------------------------------------------------------------- posts
    // The fence's round stock: a capsule shaft, flat-cut foot, soft dome top.
    const postAt = (x: number) =>
      sdf
        .capsule([x, POST_R, 0], [x, POST_H - POST_R, 0], POST_R)
        .intersect(sdf.halfSpace([0, -1, 0], 0));
    const posts = sdf.union(postAt(-POST_X), postAt(POST_X));

    // One warm honey-brown wood, the fence's paint: shaded foot, sun-lit tops, broad patches.
    // The value bands normalize to the fence's 1.1 m height, so both assets read as the
    // same stock: dark damp foot, mid brown shaft, honey above half height.
    const woodPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 3);
      const t = clamp01(y / 1.1);
      const base = mixRgb(WOOD_LIGHT, WOOD_MID, 0.2 + 0.55 * patch);
      const dark = mixRgb(base, WOOD_DARK, clamp01(0.24 + 0.82 * (1 - t) * (1 - t)));
      return mixRgb(dark, WOOD_LIGHT, 0.55 * clamp01((t - 0.5) / 0.5));
    };

    k.body('posts', posts.paintFn(woodPaint), {
      color: '#8a5a30',
      roughness: 0.82,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 600,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 26, y * 8, z * 26, 2),
    });

    // --------------------------------------------------------------- rope
    // One sagging line along a parabola, tied off with a knot at each post.
    const N = 10;
    const rope = sdf
      .chain(
        Array.from({ length: N + 1 }, (_, i) => {
          const x = -ROPE_HALF + (2 * ROPE_HALF * i) / N;
          return [x, ropeY(x), 0, ROPE_R] as [number, number, number, number];
        }),
        0.005,
      )
      .smoothUnion(0.004, sdf.sphere(0.034).at(-0.925, ROPE_Y, 0), sdf.sphere(0.034).at(0.925, ROPE_Y, 0))
      .paintFn((x, y, z, base) => {
        // Twist lay: diagonal bands running along the line.
        const f = ((x * 80) % 1) + 1;
        const band = (f - Math.floor(f)) < 0.45 ? 1 : 0;
        return mixRgb(base, ROPE_DARK, band * 0.4);
      });
    k.body('rope', rope, { color: '#d8b87e', roughness: 0.92, detail: 0.012, maxTriangles: 460 });

    // --------------------------------------------------------------- laundry
    k.body('shirt', shirt, {
      color: '#d9543f',
      roughness: 0.85,
      detail: 0.012,
      maxTriangles: 750,
      textureDensity: 1.5,
      bump: (x, y, z) => 0.0009 * noise.noise3(x * 70, y * 70, z * 70),
    });
    k.body('dress', dress, {
      color: '#2fb5a9',
      roughness: 0.85,
      detail: 0.012,
      maxTriangles: 900,
      textureDensity: 1.5,
      bump: (x, y, z) => 0.0009 * noise.noise3(x * 70, y * 70, z * 70),
    });
    k.body('kerchief', kerchief, {
      color: '#f0a83a',
      roughness: 0.85,
      detail: 0.013,
      maxTriangles: 260,
      textureDensity: 1.5,
    });
    k.body('towel', towel, {
      color: '#f4ecdc',
      roughness: 0.85,
      detail: 0.015,
      maxTriangles: 170, // the cap re-runs reduction at a 3x target
      textureDensity: 1.5,
      bump: (x, y, z) => 0.0012 * noise.noise3(x * 90, y * 90, z * 90),
    });

    // --------------------------------------------------------------- pins
    const pins = sdf.union(
      hang(-0.5, -8, sdf.union(pin(-0.075), pin(0.075))),
      hang(0.02, 2, sdf.union(pin(-0.075), pin(0.075))),
    );
    k.body('pins', pins, { color: '#d6a561', roughness: 0.82, detail: 0.006, maxTriangles: 200 });

    // --------------------------------------------------------------- flower pot
    k.body('pot', pot, { color: POT, roughness: 0.8, detail: 0.009, maxTriangles: 330 });
    k.body('flowers', flowers, {
      color: '#e2503c',
      roughness: 0.7,
      detail: 0.006,
      maxTriangles: 400,
      textureDensity: 2,
    });
    k.body('leaves', potLeaves, {
      color: GREEN_LEAF,
      roughness: 0.82,
      detail: 0.007,
      maxTriangles: 310,
    });
  },
});
