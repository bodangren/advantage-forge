import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — iron spade shovel (props/craft-and-trade/shovel).
 *
 * Role: hand tool / blacksmith-quest prop for a cozy chibi scene; must read at 128 px.
 * Size: 1.0 m tall, ~0.28 m wide at the blade, stands on its blade tip at y = 0, faces +Z.
 * One idea: a chunky rounded iron spade — a wide curved scoop with a raised central spine —
 *   on a walnut haft with a fat pale grip band and a big flat walnut D-grip on top.
 * Shape language: round dominant (curved scoop, rounded shoulders, looped grip, soft bevels),
 *   square secondary (flat D-grip bar and the stout socket collar).
 * Palette: iron #4a4f55 dominant with deep #363a3f and highlight #a8acb1; steel edge
 *   #c8ccd2 at the cutting tip; walnut #6b4226 / deep #54331d for the haft and D-grip;
 *   pale grip band #a9764a / #c9a06a (10% accent, the read at small size).
 * Materials: worn iron (roughness 0.5, metalness 0.7), walnut wood (roughness 0.8),
 *   pale grip wood (roughness 0.8). Grain and dents in `bump` only.
 * Detail: primary curved scoop + haft + grip band + D-grip; secondary socket collar and
 *   central blade spine; tertiary rim highlight and steel cutting edge. Focal point: the
 *   bright scoop against the dark tip.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const STEEL = rgb('#c8ccd2');
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#8a5c36');
const GRIP_MID = rgb('#a9764a');
const GRIP_LIGHT = rgb('#c9a06a');
const GRIP_DEEP = rgb('#7a4f2c');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ---------------------------------------------------------------- dimensions
const BLADE_W = 0.140; // half width at the widest point
const SOCKET_BOT = 0.242;
const SOCKET_TOP = 0.315;
const SOCKET_R_BOT = 0.046;
const SOCKET_R_TOP = 0.023;
const GRIP_BOT = 0.295;
const GRIP_TOP = 0.585;
const GRIP_R = 0.029;
const HAFT_BOT = 0.31;
const HAFT_TOP = 0.772;
const HAFT_R = 0.0215;
const DGRIP_Y = 0.770;
const DGRIP_T = 0.042; // slab thickness along Z

// Iron paint: dark tarnished iron, bright worn rim, steel cutting tip.
const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  // Tarnish: broad dark patches over the scoop.
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 22, y * 22, z * 22, 2);
  c = mixRgb(c, IRON_DEEP, 0.52 * tarnish * tarnish);
  // Mild worn sheen patches, like polished use.
  const sheen = 0.5 + 0.5 * noise.fbm(x * 8 + 3, y * 8, z * 8, 2);
  c = mixRgb(c, IRON_LIGHT, 0.2 * sheen);
  // Gentle sunlit upper blade.
  const sun = clamp01((y - 0.12) / 0.18);
  c = mixRgb(c, IRON_LIGHT, 0.22 * sun);
  // Socket collar: a dark band that separates the scoop from the pale grip.
  const collar = clamp01((y - 0.238) / 0.016) * clamp01((0.325 - y) / 0.02);
  c = mixRgb(c, IRON_DEEP, 0.7 * collar);
  // Bright worn rim along the blade shoulders.
  const rim = clamp01((y - 0.225) / 0.055) * clamp01((0.305 - y) / 0.02);
  c = mixRgb(c, IRON_LIGHT, 0.65 * rim);
  // Steel cutting edge around the bottom tip.
  const edge = clamp01((0.075 - y) / 0.055);
  c = mixRgb(c, STEEL, 0.9 * edge);
  return c;
};

// Walnut paint: dark grain, per-board variation, a lighter golden crown at the D-grip.
const walnutPaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 20, y * 6, z * 20, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.42 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 6 + 9, y * 6, z * 6, 2);
  c = mixRgb(c, WALNUT_LIGHT, 0.15 * patch);
  // The D-grip reads a touch lighter and warmer than the shaft.
  const crown = clamp01((y - 0.77) / 0.10);
  c = mixRgb(c, GRIP_LIGHT, 0.5 * crown);
  // Shaded under the grip and into the socket.
  const low = clamp01((0.40 - y) / 0.08);
  c = mixRgb(c, WALNUT_DEEP, 0.35 * low);
  return c;
};

// Pale grip paint: warm light wood, darker at the ends where the hands grip.
const gripPaint = (x: number, y: number, z: number) => {
  let c = GRIP_MID;
  const grain = 0.5 + 0.5 * noise.fbm(x * 14, y * 4, z * 14, 2);
  c = mixRgb(c, GRIP_LIGHT, 0.45 * grain);
  const head = clamp01((y - (GRIP_TOP - 0.09)) / 0.09);
  c = mixRgb(c, GRIP_LIGHT, 0.42 * head);
  const foot = clamp01((GRIP_BOT + 0.06 - y) / 0.06);
  c = mixRgb(c, GRIP_DEEP, 0.65 * foot);
  return c;
};

export default defineAsset({
  name: 'shovel',
  description:
    'Iron spade shovel with a curved rounded scoop, raised central spine, steel cutting tip, a walnut haft with a pale grip band, and a flat walnut D-grip on top.',
  detail: 0.006,
  reference: 'docs/item-mockups/shovel-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ blade
    // Spade outline in XY: a narrow neck, flared rounded wings, then a long taper to a
    // rounded tip (placed just below y = 0 so the flattened tip lands on the ground).
    const outline = profile.polygon(
      [
        [-0.022, 0.250],
        [-0.068, 0.292],
        [-0.110, 0.302],
        [-0.145, 0.275],
        [-BLADE_W, 0.205],
        [-BLADE_W, 0.140],
        [-0.145, 0.075],
        [-0.108, 0.030],
        [-0.056, -0.006],
        [0.0, -0.020],
        [0.056, -0.006],
        [0.108, 0.030],
        [0.145, 0.075],
        [BLADE_W, 0.140],
        [BLADE_W, 0.205],
        [0.145, 0.275],
        [0.110, 0.302],
        [0.068, 0.292],
        [0.022, 0.250],
      ],
      { smooth: true, samples: 14 },
    );
    const slab = sdf.extrude(outline, 0.16, 0.010);

    // Curved scoop: keep only a thin shell of a large upright cylinder whose axis sits in
    // front (+Z), so the digging face is concave toward the viewer.
    const scoopR = 0.34;
    const wall = 0.028;
    const moldZ = scoopR - wall;
    const mold = sdf
      .cylinder(scoopR, 0.7)
      .subtract(sdf.cylinder(scoopR - wall, 0.72))
      .at(0, 0.15, moldZ);

    // Raised central spine running down from the socket, sitting proud of the concave face.
    const spine = sdf.cone([0, 0.29, 0.014], [0, 0.10, 0.020], 0.016, 0.004);

    // Socket collar: metal cone that wraps the blade neck and the base of the haft.
    const socket = sdf.cone([0, SOCKET_BOT, 0], [0, SOCKET_TOP, 0], SOCKET_R_BOT, SOCKET_R_TOP);

    const blade = sdf
      .smoothUnion(0.010, slab.intersect(mold), spine)
      .smoothUnion(0.012, socket)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(ironPaint);
    k.body('blade', blade, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.007,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * (noise.fbm(x * 34, y * 34, z * 34, 2) - 0.5),
      maxTriangles: 1500,
    });

    // ------------------------------------------------------------------ haft + D-grip
    // Shaft under the grip, with a soft swell toward the D-grip.
    const shaft = sdf
      .cone([0, HAFT_BOT, 0], [0, HAFT_TOP, 0], HAFT_R + 0.001, HAFT_R + 0.004)
      .union(sdf.sphere(HAFT_R + 0.004).at(0, HAFT_TOP, 0));

    // D-grip: a flat walnut loop. Extrude an outer outline and subtract an inner hole.
    const dOuter = profile.polygon(
      [
        [-0.028, 0.0],
        [-0.062, 0.040],
        [-0.082, 0.100],
        [-0.085, 0.160],
        [-0.082, 0.200],
        [-0.062, 0.222],
        [0.0, 0.230],
        [0.062, 0.222],
        [0.082, 0.200],
        [0.085, 0.160],
        [0.082, 0.100],
        [0.062, 0.040],
        [0.028, 0.0],
      ],
      { smooth: true, samples: 14 },
    );
    const dInner = profile.polygon(
      [
        [-0.030, 0.058],
        [-0.050, 0.110],
        [-0.048, 0.160],
        [-0.036, 0.185],
        [0.036, 0.185],
        [0.048, 0.160],
        [0.050, 0.110],
        [0.030, 0.058],
        [0.0, 0.048],
      ],
      { smooth: true, samples: 12 },
    );
    const dGrip = sdf
      .extrude(dOuter, DGRIP_T, 0.013)
      .subtract(sdf.extrude(dInner, 0.3))
      .at(0, DGRIP_Y, 0);

    const haft = sdf.smoothUnion(0.012, shaft, dGrip).paintFn(walnutPaint);
    k.body('haft', haft, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.006,
      paintWeight: 2,
      bump: (x, y, z) => 0.001 * (noise.fbm(x * 22, y * 5, z * 22, 2) - 0.5),
      maxTriangles: 950,
    });

    // ------------------------------------------------------------------ grip band
    // A fat pale sleeve over the lower shaft, with a couple of turned ring grooves.
    const grip = sdf
      .cone([0, GRIP_BOT, 0], [0, GRIP_TOP, 0], GRIP_R - 0.002, GRIP_R)
      .union(sdf.sphere(GRIP_R - 0.002).at(0, GRIP_BOT, 0))
      .union(sdf.sphere(GRIP_R).at(0, GRIP_TOP, 0));
    k.body('grip', grip.paintFn(gripPaint), {
      color: '#a9764a',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => {
        const groove =
          Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * ((y - (GRIP_TOP - 0.075)) / 0.028)), 8) *
          clamp01((y - (GRIP_TOP - 0.095)) / 0.02);
        return -0.0035 * groove + 0.001 * (noise.fbm(x * 26, y * 6, z * 26, 2) - 0.5);
      },
      maxTriangles: 500,
    });
  },
});
