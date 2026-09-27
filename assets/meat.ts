import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — roasted leg of meat on a bone (props/food/meat).
 *
 * Role: tavern table food pickup; must read at 128 px as one stout roast with a bone.
 * Size: 0.30 m long, about 0.15 m tall, lying on y = 0, centred on the Y axis, facing +Z.
 * One idea: a fat, glossy caramel-brown roast pierced by a cream bone whose two
 *   knuckle ends stick out — a big ball up-left, a small nub at the lower right.
 * Shape language: round dominant (soft blobby roast, ball knuckles),
 *   one hard accent (the bone shaft crossing the silhouette).
 * Palette: roast deep #4a2010 (shadow/underside), mid #7a3a20, light #b56545,
 *   glaze highlight #c47848; bone cream #f0e6cf with #cbb992 shade and #b08a5a stain.
 * Materials: glazed roast (roughness 0.30, metalness 0.03), matte bone (roughness 0.45).
 * Detail: primary roast mass + bone; secondary knuckles + shoulder bulge;
 *   tertiary roast bands and pores in paint and `bump`. Focal point: pale bone vs dark glaze.
 * Rig/animation: none (static prop).
 */

const ROAST_DEEP = rgb('#4a2010');
const ROAST = rgb('#7a3a20');
const ROAST_LIGHT = rgb('#b56545');
const GLAZE = rgb('#c47848');
const BONE = rgb('#f0e6cf');
const BONE_SHADE = rgb('#cbb992');
const BONE_STAIN = rgb('#b08a5a');

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** The carved -X face of the roast, as a signed distance (0 at the flat face). */
function cutFace(x: number, y: number): number {
  return -0.974 * (x + 0.085) - 0.225 * (y - 0.0431);
}

/** Roast: dark underside rising to a glossy glazed crown, with faint roast bands. */
function meatPaint(x: number, y: number, z: number, _base: Rgb): Rgb {
  const h = clamp01((y - 0.01) / 0.12);
  let c = mixRgb(ROAST_DEEP, ROAST, 0.5 + 0.5 * h);
  c = mixRgb(c, ROAST_LIGHT, smoothstep(0.14, 0.92, h) * 0.85);
  // Bands across the roast, perpendicular to the bone.
  const u = (x + 0.07) / 0.055;
  const f = u - Math.floor(u);
  const band = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 3);
  c = mixRgb(c, ROAST_DEEP, 0.12 * band * (1 - 0.5 * h));
  // The carved face is matte cooked meat, not glaze: a touch darker.
  const cut = smoothstep(-0.028, -0.004, cutFace(x, y));
  c = mixRgb(c, ROAST, cut * 0.45);
  // Glossy catch on the top-front shoulder: the focal catch light.
  const shine = clamp01((y - 0.075) / 0.05) * clamp01((z + 0.012) / 0.05) * (1 - cut);
  c = mixRgb(c, GLAZE, shine * 0.55);
  // Fine mottling keeps the glaze from looking like flat plastic.
  const n = noise.fbm(x * 16, y * 16, z * 16, 2);
  c = mixRgb(c, n > 0 ? GLAZE : ROAST_DEEP, Math.abs(n) * 0.08);
  return c;
}

function meatBump(x: number, y: number, z: number): number {
  const pore = noise.fbm(x * 26, y * 22, z * 26, 2);
  return 0.0012 * pore;
}

/** Bone: warm stain at the meat joint, pale and clean toward each free end. */
function bonePaint(x: number, y: number, z: number, _base: Rgb): Rgb {
  const stainL = clamp01((-0.045 - x) / 0.06);
  const stainR = clamp01((x - 0.132) / 0.026);
  const clean = Math.max(stainL, stainR);
  let c = mixRgb(BONE_STAIN, BONE_SHADE, 0.5 + 0.5 * clean);
  c = mixRgb(c, BONE, smoothstep(0.15, 0.85, clean));
  const n = noise.fbm(x * 22, y * 20, z * 22, 2);
  c = mixRgb(c, BONE_SHADE, 0.16 * Math.max(0, n));
  // The big knuckle is the lightest point.
  const knob = clamp01(1 - Math.hypot(x + 0.112, y - 0.132, z + 0.008) / 0.05);
  c = mixRgb(c, BONE, knob * 0.4);
  return c;
}

export default defineAsset({
  name: 'meat',
  description: 'A glossy roasted leg of meat on a bone, lying on the ground.',
  detail: 0.006,
  reference: 'docs/item-mockups/meat-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ roast
    // One stout mass: a chunky rounded block whose -X end is cut at an angle
    // (the carved roast face), tapering to a rounded shank knob on +X, with a
    // fuller bulge toward +Z (the front).
    const core = sdf.box([0.15, 0.098, 0.092], 0.034).at(-0.012, 0.06, 0).rotateZ(13);
    const meat = sdf
      .smoothUnion(
        0.032,
        core,
        sdf.ellipsoid([0.058, 0.052, 0.046]).at(-0.005, 0.058, 0.026),
        sdf.ellipsoid([0.052, 0.044, 0.042]).at(0.06, 0.052, 0.005),
        sdf.sphere(0.036).at(0.098, 0.045, 0.006),
      )
      // Soft organic lumpiness, then flatten the base onto y = 0.
      .displace(0.004, (x, y, z) => noise.fbm(x * 5, y * 4, z * 5, 2))
      .smoothIntersect(0.02, sdf.box([0.7, 0.42, 0.7], 0.02).at(0, 0.206, 0))
      .paintFn(meatPaint);

    k.body('roast', meat, {
      color: '#7a3a20',
      roughness: 0.3,
      metalness: 0.03,
      detail: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 1900,
      bump: meatBump,
    });

    // ------------------------------------------------------------------ bone
    // One shaft running diagonally through the roast. It emerges top-left with a
    // big ball knuckle, and pokes out of the shank knob at the lower right.
    const shaft = sdf.smoothUnion(
      0.012,
      sdf.capsule([-0.115, 0.134, -0.008], [-0.06, 0.112, -0.004], 0.014),
      sdf.capsule([-0.06, 0.112, -0.004], [0.02, 0.072, 0], 0.013),
      sdf.capsule([0.02, 0.072, 0], [0.13, 0.034, -0.006], 0.011),
    );
    // A bilobed condyle at the free end reads as a knobbly bone tip.
    const knuckle = sdf.smoothUnion(
      0.008,
      sdf.ellipsoid([0.03, 0.026, 0.024]).at(-0.114, 0.133, -0.018),
      sdf.ellipsoid([0.027, 0.023, 0.021]).at(-0.111, 0.13, 0.008),
    );
    const nub = sdf.sphere(0.018).at(0.135, 0.032, -0.006);
    const bone = sdf.smoothUnion(0.012, shaft, knuckle, nub).paintFn(bonePaint);

    k.body('bone', bone, {
      color: '#f0e6cf',
      roughness: 0.45,
      metalness: 0,
      detail: 0.004,
      textureDensity: 2,
      paintWeight: 1,
      maxTriangles: 700,
    });
  },
});
