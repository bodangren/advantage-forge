import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * desert-ground — a modular 2 x 2 m warm sand ground tile for the Chibi Quest desert set.
 *
 * Role: side-by-side terrain tile that must butt against its neighbours, so it keeps a
 *   square 2 m footprint, straight vertical sides, and a top surface that meets the tile
 *   edge at exactly y = 0.06 (the ripple relief fades out before every edge).
 * Size: 2 x 0.06 x 2 m, centered on the Y axis, standing on y = 0, facing +Z. No rig.
 * The one idea: a chunky slab of warm sand combed by broad, soft wind ripples; the
 *   light/dark ripple bands are the focal point, with a few small pebbles and a dry twig
 *   as seasoning that breaks the flat silhouette.
 * Shape language: square modular slab (sturdy) softened by round dune ripples and round
 *   pebbles (soft) — the Chibi Quest bevel-everything treatment.
 * Value plan: mid warm sand #e3c38a dominant, sunlit crests #f2d9a6 as the light value,
 *   trough shadow #bf9455 as the dark, deepest contact #a97c3f. Squint: the ripples read.
 * Palette: sand #e3c38a / #d9b27c / #bf9455 / #a97c3f; pebbles #a49a8b family;
 *   twig wood #8a5a35 with pale cut #c9a06a — all from the scene contract.
 * Materials: sand (roughness 0.95, metalness 0), pebbles (0.85), dry twig (0.85).
 * Detail list: slab + painted ripple bands (big, focal), geometric dune relief (medium),
 *   six pebbles and one forked twig (small), fine sand grain in the normal map (tertiary).
 * Rig/animation: none.
 */

const TILE = 2; // exact grid size in meters
const THICK = 0.06; // slab thickness, top face at y = 0.06
const TOP = THICK;
const RIPPLE_AMP = 0.032; // dune relief amplitude in meters (above the 5 mm displace limit)

const SAND = rgb('#e3c38a'); // warm sand — dominant
const SAND_LIGHT = rgb('#f2d9a6'); // sunlit crests — light value
const SAND_MID = rgb('#d9b27c'); // dry patches — secondary
const SAND_DARK = rgb('#bf9455'); // ripple troughs — dark value
const SAND_DEEP = rgb('#a97c3f'); // deepest trough / ground contact

const PEBBLE = rgb('#a49a8b');
const PEBBLE_DARK = rgb('#7e7568');
const PEBBLE_LIGHT = rgb('#c2b8a6');

const TWIG = rgb('#8a5a35');
const TWIG_DARK = rgb('#5f3d22');
const CUT = rgb('#c9a06a');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Smooth 0 -> 1 ramp between a and b (for masks, never a hard jump). */
const ramp = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Broad wind-ripple field: parallel diagonal dune ridges that meander, plus a faint
 * crossing ripple. Returns roughly [-1, 1]: positive is a ridge, negative is a trough.
 */
function rippleWave(x: number, z: number): number {
  // The ridge line wanders so the pattern reads as wind-combed sand, not a machine wave.
  const meander = 0.5 * Math.sin(Math.PI * (1 * x + 2 * z) + 0.9);
  const phase = Math.PI * (3.2 * x + 1.4 * z + meander) + 0.3;
  const ridge = Math.tanh(1.3 * Math.sin(phase)) / Math.tanh(1.3);
  const cross = 0.25 * Math.sin(Math.PI * (1.2 * x - 3.4 * z) + 2.2);
  return ridge * 0.8 + cross * 0.2;
}

/** Horizontal mask: 1 across the open top, 0 within ~8 cm of any tile edge. */
const edgeMask = (x: number, z: number): number =>
  1 - ramp(0.9, 0.98, Math.max(Math.abs(x), Math.abs(z)));
/** Vertical mask: relief only near the top face, zero at the bottom so y = 0 stays flat. */
const topMask = (y: number): number => ramp(TOP - 0.05, TOP - 0.014, y);

/** World height of the sand surface at (x, z): the top face plus its ripple relief. */
const surfaceY = (x: number, z: number): number =>
  TOP + RIPPLE_AMP * rippleWave(x, z) * edgeMask(x, z);

/** 1 on the open top face, 0 on the lower sides and bottom. */
const onTop = (y: number): number => ramp(TOP - 0.03, TOP - 0.006, y);

/** Warm sand: ripple-band value plan, dry patches, fine speckle, shaded sides. */
function sandColorAt(x: number, y: number, z: number): Rgb {
  const r = rippleWave(x, z) * edgeMask(x, z);
  const topness = onTop(y);

  let c = SAND;
  // Ripple bands: light ridgelines, dark troughs — strongest across the open top.
  c = mixRgb(c, SAND_LIGHT, clamp01(r * 1.3) * 0.7 * topness);
  c = mixRgb(c, SAND_DARK, clamp01(-r * 1.3) * 0.62 * topness);
  c = mixRgb(c, SAND_DEEP, clamp01((-r - 0.45) * 1.8) * 0.5 * topness);

  // Broad dry/sheltered patches break the regularity of the ripples.
  const patch = noise.fbm(x * 0.9, 3.3, z * 0.9, 2);
  c = mixRgb(c, SAND_MID, clamp01(0.5 + 0.5 * patch) * 0.34);
  // Fine speckle — the "read at 128 px" grain. Kept continuous (no hard thresholds) so
  // the color never steps and no painted seam can crack the mesh.
  const speck = noise.fbm(x * 13, 7.7, z * 13, 2);
  c = mixRgb(c, SAND_LIGHT, clamp01((speck - 0.1) * 2.6) * 0.28);
  c = mixRgb(c, SAND_DARK, clamp01((-speck - 0.2) * 2.6) * 0.22);

  // Sides sit in their own shade; the very bottom takes the contact shadow.
  c = mixRgb(c, SAND_DARK, (1 - topness) * 0.42);
  c = mixRgb(c, SAND_DEEP, clamp01((0.016 - y) / 0.016) * 0.45);
  return c;
}

// ------------------------------------------------------------------ pebbles
interface PebbleSpec {
  readonly x: number;
  readonly z: number;
  readonly r: number; // horizontal radius
}

// Six small stones spread over the tile, kept clear of the edges and the twig line.
const PEBBLES: PebbleSpec[] = [
  { x: 0.56, z: -0.36, r: 0.06 },
  { x: -0.6, z: 0.42, r: 0.05 },
  { x: 0.3, z: 0.68, r: 0.038 },
  { x: -0.28, z: -0.62, r: 0.052 },
  { x: 0.74, z: 0.5, r: 0.032 },
  { x: -0.72, z: -0.12, r: 0.028 },
];

function pebbleShape(): ReturnType<typeof sdf.ellipsoid> {
  return sdf.union(
    ...PEBBLES.map((p) => {
      const ry = p.r * 0.55;
      return sdf
        .ellipsoid([p.r, ry, p.r * 0.92])
        .rotateY((noise.random(Math.round(p.x * 97), 5, Math.round(p.z * 89)) * 180 * Math.PI) / 180)
        .at(p.x, surfaceY(p.x, p.z) + ry * 0.12, p.z);
    }),
  ) as ReturnType<typeof sdf.ellipsoid>;
}

/** Per-pebble tint from the nearest stone centre, pale on top, dark underneath. */
function pebbleColorAt(x: number, y: number, z: number): Rgb {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < PEBBLES.length; i++) {
    const p = PEBBLES[i]!;
    const d = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const tint = noise.random(best, 13, 7);
  let c = mixRgb(PEBBLE, PEBBLE_DARK, 0.2 + 0.5 * tint);
  const p = PEBBLES[best]!;
  const local = surfaceY(p.x, p.z);
  c = mixRgb(c, PEBBLE_LIGHT, clamp01((y - local) / (p.r * 0.7)) * 0.45);
  c = mixRgb(c, PEBBLE_DARK, clamp01((local - y) / (p.r * 0.7)) * 0.5);
  return c;
}

// ------------------------------------------------------------------ dry twig
interface TwigSeg {
  readonly pts: ReadonlyArray<readonly [number, number, number, number]>; // x, z, radius, lift
}

// One forked dry twig lying across the sand: a main shaft with a side branch. Radii are
// stylized thick so the twig reads at 128 px and meshes cleanly.
const TWIG_SEGMENTS: readonly TwigSeg[] = [
  {
    pts: [
      [-0.5, -0.22, 0.013, 0.95],
      [-0.18, 0.0, 0.017, 0.95],
      [0.16, 0.18, 0.015, 0.95],
      [0.46, 0.34, 0.011, 0.9],
    ],
  },
  {
    pts: [
      [-0.18, 0.0, 0.015, 0.95],
      [0.02, 0.26, 0.012, 0.95],
      [0.17, 0.45, 0.0085, 0.9],
    ],
  },
];

/**
 * Turn a coarse (x, z, radius) path into a dense polyline whose height follows the sand
 * surface, so the twig rides over ripple crests instead of sinking into them.
 */
function sampledPath(pts: TwigSeg['pts']): Array<[number, number, number, number]> {
  const out: Array<[number, number, number, number]> = [];
  const STEPS = 5;
  for (let s = 0; s < pts.length - 1; s++) {
    const a = pts[s]!;
    const b = pts[s + 1]!;
    for (let i = s > 0 ? 1 : 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const x = a[0] + (b[0] - a[0]) * t;
      const z = a[1] + (b[1] - a[1]) * t;
      const r = a[2] + (b[2] - a[2]) * t;
      const lift = a[3] + (b[3] - a[3]) * t;
      out.push([x, surfaceY(x, z) + r * lift, z, r]);
    }
  }
  return out;
}

function twigShape() {
  const chains = TWIG_SEGMENTS.map((seg) => sdf.chain(sampledPath(seg.pts), 0.004));
  return sdf.smoothUnion(0.005, ...chains).intersect(sdf.halfSpace([0, -1, 0], 0));
}

/** Dry bark: darker along the underside and at the ends, pale cut at the tips. */
function twigColorAt(x: number, y: number, z: number): Rgb {
  let bestTip = Infinity;
  for (const seg of TWIG_SEGMENTS) {
    for (const pt of [seg.pts[0]!, seg.pts[seg.pts.length - 1]!]) {
      bestTip = Math.min(
        bestTip,
        Math.hypot(x - pt[0], y - (surfaceY(pt[0], pt[1]) + pt[2] * pt[3]), z - pt[1]),
      );
    }
  }
  const grain = clamp01(0.5 + 0.5 * noise.fbm(x * 30, y * 20, z * 30, 2));
  let c = mixRgb(TWIG, TWIG_DARK, grain * 0.55);
  c = mixRgb(c, CUT, clamp01((0.03 - bestTip) / 0.02) * 0.7);
  c = mixRgb(c, TWIG_DARK, clamp01((0.075 - y) / 0.014) * 0.4);
  return c;
}

// ------------------------------------------------------------------ asset
export default defineAsset({
  name: 'desert-ground',
  description:
    'A 2 m square modular desert sand tile, 0.06 m thick with the top at y = 0.06: warm sand combed by soft wind ripples, with five small pebbles and a dry forked twig, straight tile edges.',
  detail: 0.02,
  reference: 'docs/item-mockups/desert-ground-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Square slab, 2 x 0.06 x 2 m: bottom on y = 0, top at y = 0.06. The dune relief is
    // displaced on the open top only (masked off near every edge and below the top), so
    // the sides stay straight and neighbouring tiles meet flush at y = 0.06.
    const slab = sdf
      .box([TILE, THICK, TILE], 0.004)
      .at(0, THICK / 2, 0)
      .displace(RIPPLE_AMP, (x, y, z) => rippleWave(x, z) * edgeMask(x, z) * topMask(y));

    k.body('sand', slab.paintFn(sandColorAt), {
      color: '#e3c38a',
      roughness: 0.95,
      metalness: 0,
      detail: 0.05,
      maxTriangles: 2200,
      paintWeight: 2,
      textureDensity: 2,
      // Fine sand grain and micro-ripples only; the big ripples are real geometry above.
      bump: (x, y, z) => {
        const micro = Math.sin(Math.PI * (3.2 * x + 1.4 * z) * 3 + 0.3);
        return (0.0014 * noise.fbm(x * 26, y * 18, z * 26, 2) + 0.0012 * micro) * onTop(y);
      },
    });

    // Small pebbles half-sunk into the sand, each resting on the local ripple height.
    k.body('pebbles', pebbleShape().paintFn(pebbleColorAt), {
      color: '#a49a8b',
      roughness: 0.85,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 400,
      paintWeight: 2,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });

    // One dry forked twig lying on the sand.
    k.body('twig', twigShape().paintFn(twigColorAt), {
      color: '#8a5a35',
      roughness: 0.85,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 700,
    });
  },
});
