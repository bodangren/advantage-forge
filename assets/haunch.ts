import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

// Design note — roasted haunch on a honey-oak plank (props/food/haunch).
// Role: tavern table food. It must read at 128 px as one stout roast with a bone.
// Size: plank 0.42 × 0.05 × 0.28 m on y = 0. Whole prop about 0.45 × 0.20 × 0.28 m.
// One idea: a glossy mahogany haunch with a cream bone that sticks out one end.
// Shape language: round dominant (roast, knuckle); square secondary (chamfered plank).
// Palette: mahogany #7a3a1a, grill #4a2010, glaze #c47848, bone #ece0c0, oak #b5814a.
// Materials: glazed roast (rough 0.28), bone (rough 0.42), honey oak (rough 0.82).
// Detail: roast mass, rising bone with a knuckle, faint crown grill bars.
// Focal point: the pale bone against the dark glaze. No rig. No animation.

const MAHOGANY = rgb('#7a3a1a');
const GRILL = rgb('#4a2010');
const GLAZE = rgb('#a85c32');
const GLAZE_HI = rgb('#c47848');
const CATCH = rgb('#e0b080');
const BONE = rgb('#ece0c0');
const BONE_SHADE = rgb('#cbb992');
const BONE_STAIN = rgb('#a87848');
const OAK = rgb('#b5814a');
const OAK_DEEP = rgb('#8a5a35');
const OAK_LIGHT = rgb('#c9a06a');
const JUICE = rgb('#6a3418');

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Roast and bone share this yaw. Bump samples world space, so grill grooves
// must use the same local frame as paintFn.
const YAW = (-24 * Math.PI) / 180;
const YAW_C = Math.cos(YAW);
const YAW_S = Math.sin(YAW);
function toLocal(x: number, y: number, z: number): [number, number, number] {
  return [YAW_C * x - YAW_S * z, y, YAW_S * x + YAW_C * z];
}

/** Faint grill bars across the crown. 1 on a bar, 0 off the crown. */
function grillAmount(x: number, y: number, z: number): number {
  const crown = clamp01((y - 0.128) / 0.04);
  if (crown <= 0) return 0;
  const u = (x + z * 0.12 + 0.05) / 0.042;
  const f = u - Math.floor(u);
  const bar = Math.pow(Math.max(0, 1 - Math.abs(f - 0.32) * 7.5), 1.5);
  // Keep marks off the bone end so the knuckle stays clean.
  const fade = clamp01((0.1 - x) / 0.06);
  return bar * crown * (0.35 + 0.65 * fade);
}

function meatPaint(x: number, y: number, z: number, _base: Rgb): Rgb {
  const h = clamp01((y - 0.05) / 0.13);
  const sheen = clamp01((y - 0.11) / 0.07) * clamp01(0.55 + z * 5);
  let c = mixRgb(GRILL, MAHOGANY, 0.28 + 0.72 * h);
  c = mixRgb(c, GLAZE, sheen * 0.62);
  c = mixRgb(c, GLAZE_HI, sheen * sheen * 0.4);
  // Lengthwise fiber, stretched along X, kept quiet.
  const fiber = noise.fbm(x * 3.5, y * 10, z * 16, 2);
  c = mixRgb(c, fiber > 0 ? GLAZE : GRILL, Math.abs(fiber) * 0.14 * h);
  const shine = clamp01((y - 0.15) / 0.03) * clamp01((z + 0.01) / 0.045) * clamp01(1 - Math.abs(x + 0.02) / 0.06);
  c = mixRgb(c, CATCH, shine * 0.5);
  c = mixRgb(c, GRILL, grillAmount(x, y, z) * 0.72);
  return c;
}

function meatBump(x: number, y: number, z: number): number {
  const [lx, ly, lz] = toLocal(x, y, z);
  const grill = grillAmount(lx, ly, lz);
  const pore = noise.fbm(lx * 22, ly * 18, lz * 22, 2);
  return -0.0028 * grill + 0.0011 * pore;
}

function plankPaint(x: number, y: number, z: number, _base: Rgb): Rgb {
  const grain = 0.5 + 0.5 * noise.fbm(x * 5, y * 3, z * 24, 3);
  const streak = 0.5 + 0.5 * noise.fbm(x * 1.6, y * 6, z * 36, 2);
  let c = mixRgb(OAK, OAK_LIGHT, 0.22 + 0.28 * grain);
  c = mixRgb(c, OAK_DEEP, 0.42 * streak * streak);
  // Short ends read as end grain. Long edges sit a step darker.
  const end = clamp01((Math.abs(x) - 0.155) / 0.05);
  const edge = clamp01((Math.abs(z) - 0.1) / 0.04);
  c = mixRgb(c, OAK_DEEP, 0.45 * end + 0.22 * edge);
  const side = y < 0.036 ? 0.18 : 0;
  c = mixRgb(c, OAK_DEEP, side);
  // Juice stain on the top face, under the roast.
  const stain = Math.max(0, 1 - Math.hypot((x - 0.0) / 0.13, z / 0.08));
  const onTop = y > 0.04 ? 1 : 0;
  c = mixRgb(c, JUICE, stain * stain * 0.38 * onTop);
  return c;
}

function plankBump(x: number, y: number, z: number): number {
  const grain = noise.fbm(x * 8, y * 4, z * 28, 2);
  const end = clamp01((Math.abs(x) - 0.16) / 0.04);
  return 0.0014 * grain - 0.001 * end;
}

function bonePaint(x: number, y: number, z: number, _base: Rgb): Rgb {
  // 0 at the buried root, 1 at the knuckle.
  const along = clamp01((x - 0.06) / 0.14);
  let c = mixRgb(BONE_SHADE, BONE, 0.25 + 0.75 * along);
  c = mixRgb(c, BONE_STAIN, (1 - along) * (1 - along) * 0.7);
  const n = noise.fbm(x * 18, y * 16, z * 18, 2);
  c = mixRgb(c, BONE_SHADE, 0.16 * Math.max(0, n));
  // Knuckle is the lightest point.
  const knob = clamp01(1 - Math.hypot(x - 0.236, y - 0.176, z - 0.02) / 0.034);
  c = mixRgb(c, BONE, knob * 0.55);
  return c;
}

export default defineAsset({
  name: 'haunch',
  description:
    'A mahogany-glazed roast haunch with a cream bone, on a chamfered honey-oak plank.',
  detail: 0.008,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ plank
    // One thick honey-oak board. Radius chamfers every edge.
    const plank = sdf.box([0.42, 0.05, 0.28], 0.012).at(0, 0.025, 0);
    k.body('platter', plank.paintFn(plankPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.012,
      paintWeight: 1,
      maxTriangles: 420,
      bump: plankBump,
    });

    // ------------------------------------------------------------------ roast
    // One stout mass: meaty end on -X, a fat taper on +X. A large fillet
    // keeps the bone end from pinching into a separate lobe.
    const thigh = sdf.ellipsoid([0.108, 0.072, 0.098]).at(-0.028, 0.12, -0.002);
    const crown = sdf.ellipsoid([0.062, 0.03, 0.048]).at(-0.02, 0.164, 0.012);
    const taper = sdf.ellipsoid([0.062, 0.048, 0.055]).at(0.055, 0.112, 0.006);
    const collar = sdf.ellipsoid([0.03, 0.026, 0.026]).at(0.1, 0.122, 0.01);
    const sit = sdf.box([0.55, 0.42, 0.46], 0.004).at(0, 0.252, 0);
    const meat = sdf
      .smoothUnion(0.04, thigh, crown, taper, collar)
      .displace(0.0035, (x, y, z) => noise.fbm(x * 4.2, y * 3.2, z * 4.2, 2))
      .smoothIntersect(0.016, sit)
      .paintFn(meatPaint)
      .rotateY(-24);

    k.body('roast', meat, {
      color: '#7a3a1a',
      roughness: 0.28,
      metalness: 0.04,
      detail: 0.007,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 980,
      bump: meatBump,
    });

    // ------------------------------------------------------------------ bone
    // Shaft rises out of the shank on +X. Same yaw as the roast.
    const shaft = sdf.smoothUnion(
      0.012,
      sdf.capsule([0.03, 0.11, 0.006], [0.13, 0.128, 0.01], 0.017),
      sdf.capsule([0.11, 0.124, 0.01], [0.228, 0.168, 0.02], 0.016),
    );
    const knuckle = sdf.ellipsoid([0.034, 0.025, 0.023]).at(0.236, 0.176, 0.02);
    const bone = sdf.smoothUnion(0.01, shaft, knuckle).paintFn(bonePaint).rotateY(-24);

    k.body('bone', bone, {
      color: '#ece0c0',
      roughness: 0.42,
      metalness: 0,
      detail: 0.005,
      textureDensity: 2,
      paintWeight: 1,
      maxTriangles: 340,
    });
  },
});
