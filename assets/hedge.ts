import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * Design note — hedge tile (architecture/building-parts/hedge).
 *
 * Role: garden-border tile for the hamlet map; laid end to end it draws low green
 *   walls around yards, so it must read at 128 px and tile seamlessly along X.
 * Size: 2.0 m long (X), 0.6 m deep (Z), about 0.9 m tall, standing on y = 0, front +Z.
 * One idea: a plump leafy cushion — a soft rounded box with a lumpy top of leaf
 *   clumps, trimmed flat at both ends so tiles join into one continuous hedge run.
 * Shape language: round dominant (big bevels, bulged faces, scalloped clumps); the
 *   flat trimmed ends are the sturdy secondary read.
 * Palette (leaf family only): body green #3a8a44 dominant, clump green #5cb85c,
 *   deep crevice/ground shade #2c6a34, sunlit clump tops lifted toward #8adb7a.
 *   Value plan: bright lumpy top (focal), mid sides, darkest at the ground line.
 * Materials: one leaf body, roughness 0.78; leaf grain in `bump` only.
 * Detail list: rounded box + belly (primary), 17 leaf clumps (primary), low-frequency
 *   lumpy displacement (secondary), leaf-grain bump (tertiary). Focal point: the top.
 * Tiling: clump centers on the end planes (x = ±1) are cut in half by the tile clip;
 *   both halves share one seed, so abutting tiles merge them into one whole clump.
 * Rig/animation: none (static tile).
 */

const gDeep = rgb('#2c6a34');
const gBase = rgb('#3a8a44');
const gLeaf = rgb('#5cb85c');
const gLite = rgb('#8adb7a');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

interface Clump {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly r: number;
  /** noise seed; the two end clumps share one so their halves match across tiles */
  readonly s: number;
}

// Top ridge (dominant), shoulders breaking the top edges, soft face bumps, and a low
// skirt. End ridge clumps sit exactly on x = ±1 so the tile cut halves them cleanly.
const clumps: readonly Clump[] = [
  { x: -1.0, y: 0.76, z: 0.02, r: 0.22, s: 99 }, // end half, merges with the next tile
  { x: -0.5, y: 0.73, z: -0.04, r: 0.26, s: 1 },
  { x: 0.0, y: 0.71, z: 0.05, r: 0.29, s: 2 },
  { x: 0.5, y: 0.74, z: -0.03, r: 0.25, s: 3 },
  { x: 1.0, y: 0.76, z: 0.02, r: 0.22, s: 99 }, // end half, same seed as -1.0
  { x: -0.62, y: 0.62, z: 0.16, r: 0.11, s: 4 },
  { x: 0.58, y: 0.61, z: 0.16, r: 0.11, s: 5 },
  { x: -0.45, y: 0.61, z: -0.16, r: 0.11, s: 6 },
  { x: 0.5, y: 0.62, z: -0.16, r: 0.11, s: 7 },
  { x: -0.3, y: 0.46, z: 0.19, r: 0.095, s: 8 },
  { x: 0.25, y: 0.44, z: -0.19, r: 0.09, s: 9 },
  { x: -0.75, y: 0.32, z: -0.19, r: 0.095, s: 10 },
  { x: 0.78, y: 0.34, z: 0.19, r: 0.095, s: 11 },
  { x: -0.15, y: 0.22, z: 0.2, r: 0.085, s: 12 },
  { x: 0.42, y: 0.2, z: -0.2, r: 0.085, s: 13 },
  { x: -0.55, y: 0.21, z: -0.19, r: 0.08, s: 14 },
  { x: 0.72, y: 0.22, z: 0.19, r: 0.08, s: 15 },
];

/**
 * One leaf pad: a wide squat blob with two low lobes, proud of the body, not a ball.
 * Ridge pads (near z = 0) stay narrow in Z to hold the 0.6 m tile depth; side pads
 * stretch along the wall so they cover more face without poking deeper.
 */
function clumpShape(c: Clump): Sdf {
  const side = Math.abs(c.z) >= 0.1;
  const fx = side ? 1.45 : 1.3;
  const fz = side ? 1.1 : 0.95;
  const lz = side ? 0.9 : 0.6;
  const main = sdf.ellipsoid([c.r * fx, c.r * 0.62, c.r * fz]).at(c.x, c.y, c.z);
  const lobes: Sdf[] = [];
  for (let j = 0; j < 2; j++) {
    const a = noise.random(c.s, j, 3) * Math.PI * 2 + j * 2.1;
    const lr = c.r * (0.45 + 0.15 * noise.random(c.s, j, 8));
    lobes.push(
      sdf.ellipsoid([lr, lr * 0.7, lr]).at(
        c.x + Math.cos(a) * c.r * fx * 0.75,
        c.y - c.r * 0.18 + (noise.random(c.s, j, 13) - 0.5) * c.r * 0.3,
        c.z + Math.sin(a) * c.r * lz,
      ),
    );
  }
  return sdf.smoothUnion(0.03, main, ...lobes);
}

/** The built pad shapes, so the paint can ask a pad for its signed distance. */
const pads: readonly { c: Clump; shape: Sdf }[] = clumps.map((c) => ({ c, shape: clumpShape(c) }));

/** Nearest pad to a point, plus its signed distance (negative inside the pad). */
function nearestPad(x: number, y: number, z: number): { c: Clump; sd: number } {
  let best = pads[0]!;
  let bestD = Infinity;
  for (const p of pads) {
    const d = (x - p.c.x) ** 2 + (y - p.c.y) ** 2 + (z - p.c.z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return { c: best.c, sd: best.shape.dist(x, y, z) };
}

export default defineAsset({
  name: 'hedge',
  description:
    'Hedge tile, 2 m: a plump leafy box with a lumpy clump top, trimmed flat at both ends so tiles join into a run.',
  detail: 0.014,
  reference: 'docs/item-mockups/hedge-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Base cushion: a soft rounded box, gently belled at the waist. The waist ellipsoid
    // tapers out before the tile ends, so the end cross-section stays flat and flush.
    const body = sdf.smoothUnion(
      0.06,
      sdf.box([2.0, 0.74, 0.6], 0.13).at(0, 0.37, 0),
      sdf.ellipsoid([0.96, 0.42, 0.3]).at(0, 0.38, 0),
    );

    // Big soft wobble over the whole cushion; it dies near the ends (flat tiling faces)
    // and near the ground (clean contact line).
    const endFade = (x: number): number => 1 - smoothstep(0.78, 0.98, Math.abs(x));
    const wobble = (x: number, y: number, z: number): number =>
      noise.fbm(x * 2.3, y * 3.1, z * 2.3, 2, 11) * endFade(x) * smoothstep(0.03, 0.16, y);

    const leaf = sdf
      .smoothUnion(0.035, body, ...clumps.map(clumpShape))
      .displace(0.018, wobble)
      .intersect(sdf.box([2.0, 2.2, 1.4]).at(0, 0.5, 0)) // flat ends at x = ±1
      .intersect(sdf.halfSpace([0, -1, 0], 0)) // flat foot on y = 0
      .paintFn((x, y, z) => {
        const { c, sd } = nearestPad(x, y, z);
        const patch = 0.5 + 0.5 * noise.fbm(x * 3.2, y * 3.2, z * 3.2, 2, 21);
        // Pad paint, by signed distance: 1 inside the pad, fading over the fillet.
        const onPad = 1 - smoothstep(0, 0.045, sd);
        // Pad lighting: leaf green across the pad face, sunlit top, dark crevice only
        // at the pad's base, so the dark never smears down the body.
        const local = clamp01(((y - c.y) / c.r) * 0.6 + 0.45);
        const wob = 0.1 * noise.fbm(x * 2.4, y * 2.4, z * 2.4, 2, 33);
        const band = smoothstep(0.02, 0.5, local + wob);
        let cl = mixRgb(gLeaf, gDeep, (1 - band) * 0.8);
        cl = mixRgb(cl, gLite, smoothstep(0.38, 0.9, local + 0.5 * wob) * (0.4 + 0.3 * patch));
        // Body between the pads: dark cushion green, so the pads carry the light, with a
        // narrow dark ring just outside each pad.
        const ground = 1 - smoothstep(0.05, 0.3, y);
        let base = mixRgb(gDeep, gBase, 0.12 + 0.28 * patch);
        base = mixRgb(base, gDeep, ground * 0.65);
        base = mixRgb(base, gLeaf, 0.1 * patch);
        const ring = smoothstep(0.012, 0.03, sd) * (1 - smoothstep(0.05, 0.1, sd));
        base = mixRgb(base, gDeep, ring * 0.4);
        return mixRgb(base, cl, onPad);
      });

    k.body('bush', leaf, {
      color: '#3a8a44',
      roughness: 0.78,
      detail: 0.014,
      maxTriangles: 5600,
      paintWeight: 3,
      bump: (x, y, z) => 0.0035 * noise.fbm(x * 12, y * 12, z * 12, 2, 5),
    });
  },
});
