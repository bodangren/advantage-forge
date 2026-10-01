import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * forest-ground — a 2 x 2 m modular forest-floor tile for the Chibi Quest forest set.
 *
 * Role: side-by-side ground tile that must butt against hamlet `grass-ground` and
 *   `dirt-ground` cells, so it shares their footprint exactly: 2 m square, a 0.3 m slab,
 *   top surface at y = 0 (soil down to y = -0.3), square outer edge.
 * Size: 2 x 0.3 x 2 m, centered on the Y axis, top at y = 0, facing +Z. No rig.
 * The one idea: shaded forest green strewn with warm fallen leaf blobs; the leaf scatter
 *   is the focal point and must stay clear of the tile edges so repeats read seamless.
 * Shape language: square modular slab (sturdy, reliable) plus round leaf blobs (soft).
 * Value plan: dominant mid-dark green ground, pale-tan leaves as the light contrast,
 *   warm-brown leaves as mid, deep-bark leaves as the dark accents. Squint: leaves read.
 * Palette (contract): shaded green #4a8a3f ground, deep green #2f7a3f patches,
 *   sunny green #5faa4c flecks, fallen leaves pale tan #c8a86b / warm brown #8a5a35 /
 *   dark bark #5f3d22, twig wood #8a5a35 + pale cut #c9a06a.
 * Materials: ground (roughness 0.9), leaves (roughness 0.85), twig/mushroom wood (0.85).
 * Detail list: slab + painted ground (big), leaf blobs (focal, medium), three twigs and
 *   one tiny mushroom (small), soft grass grain in the normal map (tertiary).
 * Rig/animation: none.
 */

const ground = rgb('#4a8a3f'); // shaded forest green — dominant
const groundDeep = rgb('#2f7a3f'); // deep shade / moss pockets — dark value
const groundLight = rgb('#7ec850'); // sunny leaf green dapples — light value
const dirtTan = rgb('#c8a86b'); // a little warm earth showing through

const leafPale = rgb('#c8a86b'); // pale tan leaves — lightest value
const leafBrown = rgb('#8a5a35'); // warm brown leaves — mid value
const leafDeep = rgb('#5f3d22'); // dark bark-brown leaves — darkest value

const twigBark = rgb('#8a5a35');
const twigDeep = rgb('#5f3d22');
const cutWood = rgb('#c9a06a');
const capBrown = rgb('#8a5a35');
const capDeep = rgb('#5f3d22');
const capTan = rgb('#c9a06a');

const SLAB = 0.3;
const EDGE = 0.001;
const soil = rgb('#4a3020'); // humus
const root = rgb('#6a4a30'); // root threads
const strata = rgb('#33221a'); // dark strata

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// ------------------------------------------------------------------ tiling noise
// Sample a 3-octave fbm field and blend it across the 2 m tile so opposite painted
// edges match. This keeps the ground color seamless when tiles repeat.
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function tileNoise(x: number, z: number, frequency: number, octaves: number, seed = 0): number {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, 0, sz * frequency, octaves, seed);
  return lerp(
    lerp(sample(x, z), sample(x - 2, z), u),
    lerp(sample(x, z - 2), sample(x - 2, z - 2), u),
    v,
  );
}

// ------------------------------------------------------------------ ground paint
// Dominant shaded green with soft deep patches, moss, and a few sunny flecks. A faint
// warm-earth tinge in the lightest spots keeps the green from going flat.
function sideColorAt(x: number, y: number, z: number): Rgb {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const drip = 0.06 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
  if (y > -drip) {
    const top = groundColorAt(x, 0, z);
    const lit = noise.random(Math.floor(along * 14) + 50, 1, 2) < 0.4 ? leafBrown : leafPale;
    return mixRgb(mixRgb(top, lit, 0.2), groundDeep, 0.25 * Math.min(1, -y / drip));
  }
  const depth = -y / SLAB;
  let c = mixRgb(soil, strata, 0.1 + depth * 0.5);
  const st = Math.sin((y + 0.02 * Math.sin(along * Math.PI * 2)) * 70);
  c = mixRgb(c, strata, Math.max(0, st - 0.6) * 0.8);
  const n = noise.fbm(along * 9, y * 9, 3.1, 2);
  if (n > 0.4) c = mixRgb(c, root, Math.min(1, (n - 0.4) * 6) * 0.8);
  return c;
}

function groundColorAt(x: number, y: number, z: number): Rgb {
  if (y < -0.01) return sideColorAt(x, y, z);
  const topness = 1;

  const patch = tileNoise(x, z, 1.8, 3, 3); // large shade / sun patches
  const mossN = tileNoise(x, z, 4.5, 2, 17); // medium moss clumps
  const speck = tileNoise(x, z, 12, 2, 41); // fine speckle

  // Shaded green base with clear dark shade patches and sunny dapples. Thresholds make
  // distinct light and dark areas instead of one mid tone.
  let c = ground;
  const shade = clamp01((0.02 - patch) * 2.6); // dark where the field dips
  const sun = clamp01((patch - 0.06) * 2.6); // light where the canopy opens
  c = mixRgb(c, groundDeep, shade * 0.8);
  c = mixRgb(c, groundLight, sun * 0.55);
  c = mixRgb(c, groundDeep, clamp01((0.0 - mossN) * 2.4) * 0.5 * topness);
  c = mixRgb(c, groundLight, clamp01((speck - 0.12) * 2.4) * 0.25 * topness);
  c = mixRgb(c, dirtTan, clamp01((patch - 0.24) * 3.4) * 0.2 * topness);

  // Tiny painted leaf-litter specks: sparse flecks of pale and brown so the floor reads as
  // littered from a distance without adding any geometry. Cheap and seamless (tile-periodic).
  const litterN = tileNoise(x, z, 22, 2, 123);
  const litterMask = clamp01((Math.abs(litterN) - 0.22) * 6) * topness;
  c = mixRgb(c, litterN > 0 ? leafPale : leafBrown, litterMask * 0.22);

  return c;
}

// Soft grass/moss grain is deliberately omitted from the ground: the top must stay flat and
// free of normal-map artefacts, so the baked base color carries all the surface interest.

// ------------------------------------------------------------------ leaves
// A jittered 5 x 5 grid, thinned a little, gives an even scatter with no clumping at
// the edges: every leaf centre stays within |x|, |z| <= 0.85, and no leaf reaches the
// edge. That is what makes repeated tiles read seamless.
interface LeafSpec {
  readonly x: number;
  readonly z: number;
  readonly rot: number;
  readonly len: number;
  readonly wid: number;
  readonly h: number;
  readonly color: Rgb;
}

const LEAVES: LeafSpec[] = (() => {
  const out: LeafSpec[] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (noise.random(i, j, 5) < 0.06) continue; // thin the grid so it is not regular
      const rx = noise.random(i, j, 11);
      const rz = noise.random(i, j, 17);
      const rr = noise.random(i, j, 23);
      const rs = noise.random(i, j, 31);
      const rc = noise.random(i, j, 37);
      const x = -0.72 + i * 0.36 + (rx - 0.5) * 0.26;
      const z = -0.72 + j * 0.36 + (rz - 0.5) * 0.26;
      const len = 0.048 + rs * 0.028; // half-length 0.048 .. 0.076 m
      const wid = 0.034 + rs * 0.016;
      const h = 0.013 + rr * 0.005;
      let color: Rgb;
      if (rc < 0.46) color = leafPale;
      else if (rc < 0.8) color = leafBrown;
      else color = leafDeep;
      out.push({ x, z, rot: rr * Math.PI, len, wid, h, color });
    }
  }
  return out;
})();

// Per-leaf color: match each surface point to its nearest leaf centre.
function leafColorAt(x: number, y: number, z: number): Rgb {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < LEAVES.length; i++) {
    const l = LEAVES[i]!;
    const d = (x - l.x) * (x - l.x) + (z - l.z) * (z - l.z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const base = LEAVES[best]!.color;
  // Slight per-leaf tone shift and a darker underside so each blob reads round.
  const v = noise.random(best, 3, 9);
  let c = mixRgb(base, leafDeep, v * 0.12);
  if (y < 0.006) c = mixRgb(c, leafDeep, clamp01((0.006 - y) / 0.01) * 0.4);
  return c;
}

// ------------------------------------------------------------------ twigs
interface TwigSpec {
  readonly a: [number, number, number];
  readonly b: [number, number, number];
  readonly c: [number, number, number];
}

function twig(cx: number, cz: number, angleDeg: number, length: number, r: number): TwigSpec {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dz = Math.sin(a);
  const half = length * 0.5;
  return {
    a: [cx - dx * half, 0.006, cz - dz * half],
    b: [cx, 0.009, cz],
    c: [cx + dx * half, 0.005, cz + dz * half],
  };
}

const TWIGS: ReadonlyArray<{ spec: TwigSpec; r: number }> = [
  { spec: twig(-0.46, 0.22, 38, 0.27, 0.0085), r: 0.0085 },
  { spec: twig(0.36, -0.4, -24, 0.23, 0.0075), r: 0.0075 },
  { spec: twig(0.6, 0.44, 112, 0.2, 0.0065), r: 0.0065 },
];

function twigShape(): ReturnType<typeof sdf.chain> {
  const shapes = TWIGS.map(({ spec, r }) =>
    sdf.chain(
      [
        [spec.a[0], spec.a[1], spec.a[2], r * 0.6],
        [spec.b[0], spec.b[1], spec.b[2], r],
        [spec.c[0], spec.c[1], spec.c[2], r * 0.5],
      ],
      0.004,
    ),
  );
  return sdf.union(...shapes) as ReturnType<typeof sdf.chain>;
}

// Pale cut at the twig tips, darker weather along the shaft, dark underside.
function twigColorAt(x: number, y: number, z: number): Rgb {
  let bestTip = Infinity;
  for (const { spec } of TWIGS) {
    bestTip = Math.min(
      bestTip,
      Math.hypot(x - spec.a[0], y - spec.a[1], z - spec.a[2]),
      Math.hypot(x - spec.c[0], y - spec.c[1], z - spec.c[2]),
    );
  }
  let c = mixRgb(twigBark, twigDeep, clamp01(0.4 + noise.fbm(x * 30, y * 20, z * 30, 2, 5) * 0.6) * 0.5);
  c = mixRgb(c, cutWood, clamp01((0.026 - bestTip) / 0.02) * 0.7);
  c = mixRgb(c, twigDeep, clamp01((0.006 - y) / 0.012) * 0.45);
  return c;
}

// ------------------------------------------------------------------ mushroom
const MUSHROOM_X = 0.5;
const MUSHROOM_Z = -0.06;

function mushroomShape() {
  // Kept under the 0.03 m relief limit: cap top reaches 0.110 m against a 0.08 m floor.
  const stem = sdf.cylinder(0.012, 0.028, 0.004).at(MUSHROOM_X, 0.008, MUSHROOM_Z);
  const cap = sdf.ellipsoid([0.033, 0.013, 0.033]).at(MUSHROOM_X, 0.017, MUSHROOM_Z);
  return stem.smoothUnion(0.006, cap);
}

function mushroomColorAt(x: number, y: number, z: number): Rgb {
  const d = Math.hypot(x - MUSHROOM_X, z - MUSHROOM_Z);
  const cap = clamp01((y - 0.009) / 0.008); // 1 inside the cap, 0 down the stem
  let c = mixRgb(cutWood, capTan, clamp01(1 - d / 0.016) * 0.4);
  let mc = mixRgb(capBrown, capDeep, clamp01((d - 0.016) / 0.018) * 0.7);
  mc = mixRgb(mc, capDeep, clamp01((0.018 - y) / 0.016) * 0.5);
  c = mixRgb(c, mc, cap);
  return c;
}

const mushroomBump = (x: number, y: number, z: number): number =>
  0.0006 * noise.fbm(x * 90, y * 90, z * 90, 2, 13);

// ------------------------------------------------------------------ asset
export default defineAsset({
  name: 'forest-ground',
  description:
    'A 2 m square modular forest-floor tile, a 0.3 m slab with its top at y = 0 and a leaf-litter lip over dark humus sides: shaded green ground scattered with pale-tan and warm-brown fallen leaves, three tiny twigs and a tiny mushroom.',
  detail: 0.02,
  texture: { size: 1024 },

  build(k) {
    // Square slab, 2 x 0.3 x 2 m. Top at y = 0, bottom at y = -0.3. Square outer edge so
    // neighbouring hamlet ground tiles meet without a shaded gap.
    const slab = sdf.box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE]).at(0, -SLAB / 2, 0);

    k.body('ground', slab.paintFn(groundColorAt), {
      color: '#4a8a3f',
      roughness: 0.9,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 4000,
      textureDensity: 2,
    });

    // Fallen leaves: squashed ellipsoid blobs sunk just into the top surface. No blob is
    // taller than 0.03 m and none reaches the tile edge.
    const leavesShape = sdf.union(
      ...LEAVES.map((l) => sdf.ellipsoid([l.len, l.h, l.wid]).rotateY((l.rot * 180) / Math.PI).at(l.x, 0.002, l.z)),
    );
    k.body('leaves', leavesShape.paintFn(leafColorAt), {
      color: '#c8a86b',
      roughness: 0.85,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 1500,
      maxError: 0.004,
      paintWeight: 2,
    });

    // Three tiny twigs lying on the floor.
    k.body('twigs', twigShape().paintFn(twigColorAt), {
      color: '#8a5a35',
      roughness: 0.85,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 250,
    });

    // One tiny mushroom: pale stem, warm brown cap.
    k.body('mushroom', mushroomShape().paintFn(mushroomColorAt), {
      color: '#8a5a35',
      roughness: 0.8,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 250,
      bump: mushroomBump,
    });
  },
});
