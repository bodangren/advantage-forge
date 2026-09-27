import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — chunky wooden barrel (props/containers/barrel).
 *
 * Role: background storage prop for a cozy chibi hamlet; must read at 128 px sprite.
 * Size: 0.9 m tall, 0.65 m wide at the belly, stands on y = 0, faces +Z.
 * One idea: a squat, cheerfully bulged barrel — belly much wider than the ends,
 *   hugged by two thick dark iron hoops.
 * Shape language: round dominant (bulged revolved body, domed lid, round bung),
 *   square secondary (narrow hoop bands give a sturdy read).
 * Palette: warm honey-brown wood family from fence/barn — mid #8a5a30 (dominant),
 *   light #d6a561 (sun-lit top / lid), dark #3a2210 (stave seams, shaded foot);
 *   dark iron hoops #3d4047 (lantern metal family).
 * Materials: wood (roughness 0.82, metalness 0), worn iron (roughness 0.55,
 *   metalness 0.7). Stave grooves + grain in `bump` only.
 * Detail: primary bulged body + 2 hoops + lid; secondary bung + hoop rivets;
 *   tertiary stave seams and grain in bump. Focal point: belly bulge vs dark hoops.
 * Rig/animation: none (static prop).
 */

const WOOD_MID = rgb('#8a5a30');
const WOOD_LIGHT = rgb('#d6a561');
const WOOD_DARK = rgb('#3a2210');
const IRON = '#3d4047';

const H = 0.86; // body height (lid caps it to 0.9 total)
const BELLY_R = 0.325; // max radius at mid height (0.65 m wide)
const END_R = 0.265; // radius at top/bottom rims
const STAVES = 14;
const HOOP_Y_LOW = 0.22;
const HOOP_Y_HIGH = 0.64;
const HOOP_W = 0.075;

export default defineAsset({
  name: 'barrel',
  description:
    'Chunky wooden barrel with bulged staves, two dark iron hoops, and a lid with a round bung.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ body
    // Squat revolved barrel: narrow foot, wide friendly belly, tucked top rim.
    const bodyProfile = profile.polygon(
      [
        [0.12, 0.002],
        [END_R - 0.02, 0.002],
        [END_R, 0.03],
        [0.295, 0.12],
        [0.315, 0.28],
        [BELLY_R, 0.45],
        [0.315, 0.62],
        [0.293, 0.76],
        [END_R, 0.83],
        [0.2, 0.808],
        [0.1, 0.81],
        [0, 0.81],
      ],
      { smooth: true, samples: 16 },
    );
    // Flat foot on y = 0 so the ground line is perfect (as in fence.ts).
    const bodyShape = sdf
      .revolve(bodyProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Staves: per-stave tint + dark seams, plus a fence-like vertical value plan
    // (shaded foot, sun-lit shoulder). Seams also get relief in `bump` below.
    const stavePaint = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x); // -pi..pi
      const u = ((a + Math.PI) / (Math.PI * 2)) * STAVES;
      const idx = Math.floor(u);
      const f = u - idx;
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
      const tint = noise.random(idx, 7, 3);
      const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 10, y * 42, z * 10, 2);
      let c = mixRgb(WOOD_MID, WOOD_LIGHT, 0.12 + 0.3 * tint);
      c = mixRgb(c, WOOD_MID, 0.35 * patch);
      c = mixRgb(c, WOOD_LIGHT, 0.1 * grain);
      // Sun-lit shoulder, damp shaded foot.
      const t = Math.min(1, Math.max(0, y / H));
      const shade = 1 - t;
      c = mixRgb(c, WOOD_DARK, 0.32 * shade * shade);
      c = mixRgb(c, WOOD_LIGHT, 0.22 * Math.max(0, (t - 0.55) / 0.45));
      // Dark seam lines between staves.
      c = mixRgb(c, WOOD_DARK, 0.72 * edge);
      return c;
    };
    const staveBump = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const u = ((a + Math.PI) / (Math.PI * 2)) * STAVES;
      const f = u - Math.floor(u);
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
      return -0.003 * edge + 0.0016 * noise.fbm(x * 26, y * 8, z * 26, 2);
    };
    k.body('staves', bodyShape.paintFn(stavePaint), {
      color: '#8a5a30',
      roughness: 0.82,
      metalness: 0,
      detail: 0.01,
      paintWeight: 2,
      bump: staveBump,
      maxTriangles: 3800,
    });

    // ------------------------------------------------------------------ hoops
    // Thin shells of the body surface, cut into bands so they hug the bulge.
    const shell = bodyShape.round(0.013).subtract(bodyShape.round(-0.002));
    const bandAt = (y: number) =>
      shell.intersect(sdf.box([1.2, HOOP_W, 1.2], 0.008).at(0, y, 0));
    // Round rivet studs sitting proud on each hoop, 8 per hoop.
    const rivets: ReturnType<typeof sdf.sphere>[] = [];
    for (const y of [HOOP_Y_LOW, HOOP_Y_HIGH]) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + (y > 0.4 ? Math.PI / 8 : 0);
        // Belly radius near the hoops is ~0.307; shell outer face sits ~+0.013.
        const r = 0.318;
        rivets.push(sdf.sphere(0.017).at(Math.cos(a) * r, y, Math.sin(a) * r));
      }
    }
    const hoops = sdf.union(bandAt(HOOP_Y_LOW), bandAt(HOOP_Y_HIGH), ...rivets);
    k.body('hoops', hoops, {
      color: IRON,
      roughness: 0.55,
      metalness: 0.7,
      detail: 0.007,
      maxTriangles: 3000,
    });

    // ------------------------------------------------------------------ lid + bung
    // Close-fitting lid: rounded-edge disc dropped into the top rim, planks along X.
    const lidShape = sdf.cylinder(0.252, 0.055, 0.012).at(0, H - 0.012, 0);
    const lidPaint = (x: number, y: number, z: number) => {
      const along = x + 0.3;
      const f = along / 0.1 - Math.floor(along / 0.1);
      const g = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 4);
      const board = 0.5 + 0.5 * noise.fbm(along * 30, 0, z * 4, 2);
      let c = mixRgb(WOOD_LIGHT, WOOD_MID, 0.3 + 0.3 * board);
      c = mixRgb(c, WOOD_DARK, 0.55 * g);
      const r = Math.hypot(x, z);
      c = mixRgb(c, WOOD_DARK, 0.35 * Math.max(0, (r - 0.19) / 0.07));
      return c;
    };
    k.body('lid', lidShape.paintFn(lidPaint), {
      color: '#d6a561',
      roughness: 0.82,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 600,
      bump: (x, y, z) => {
        const along = x + 0.3;
        const f = along / 0.1 - Math.floor(along / 0.1);
        const g = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 4);
        return -0.0025 * g + 0.0012 * noise.fbm(x * 30, y * 8, z * 30, 2);
      },
    });

    // Small round bung plug near the lid edge, with a dark seating ring.
    const bung = sdf
      .smoothUnion(
        0.008,
        sdf.cylinder(0.038, 0.03, 0.008).at(0.11, H + 0.022, 0.07),
        sdf.sphere(0.02).at(0.11, H + 0.035, 0.07),
      )
      .paintWhere(sdf.torus(0.04, 0.008).at(0.11, H + 0.012, 0.07), WOOD_DARK, 0.006);
    k.body('bung', bung, {
      color: '#8a5a30',
      roughness: 0.82,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 300,
    });
  },
});
