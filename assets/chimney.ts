import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — chimney (architecture/building-parts/chimney)
 *
 * Role: a village building part. It must read at 128 px as a chimney stack.
 * Size: 0.70 m wide, 1.40 m to the flue rim. It stands on y = 0, centered, front toward +Z.
 * One idea: a hand-laid fieldstone stack that steps in as it rises, crowned by a pale slab
 *   and a dark flue that sends up a thin gray wisp.
 * Shape language: square and sturdy, with soft bevels. The smoke curl is the soft accent.
 * Palette: cool gray stone #a39eaa (dominant), warm tan #c9b48a (accent), pale cap #efe4d4,
 *   flue pot #7a746c with a near-black mouth, gray smoke #9a9692. Mortar is a thin seam.
 * Materials: stone (roughness 0.92), soot flue (roughness 0.8), smoke (opacity 0.5, no emissive).
 * Detail: five bond courses, a segmented slab cap, a flue pot, one smoke wisp. Focal point: the flue.
 * Rig: none.
 */

const GRAY = rgb('#a39eaa');
const GRAY_DARK = rgb('#6e6974');
const GRAY_DEEP = rgb('#514c54');
const GRAY_LIGHT = rgb('#d0cbd4');
const TAN = rgb('#c9b48a');
const TAN_DEEP = rgb('#a88858');
const TAN_PALE = rgb('#e4d4b4');
const CAP = rgb('#efe4d4');
const CAP_WARM = rgb('#f6eee2');
const CAP_COOL = rgb('#e2d4c2');
const MORTAR = rgb('#6a645c');
const SOOT = rgb('#4a443c');
const FLUE_BODY = '#7a746c';
const FLUE_RIM = '#9a948c';
const FLUE_HOLE = '#161412';
const SMOKE = '#9a9692';

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Five field courses. `half` is the outer half-width. The stack steps in as it rises. */
const COURSES: { y0: number; y1: number; half: number; thick: number }[] = [
  { y0: 0.0, y1: 0.228, half: 0.348, thick: 0.1 },
  { y0: 0.246, y1: 0.458, half: 0.334, thick: 0.096 },
  { y0: 0.476, y1: 0.698, half: 0.32, thick: 0.092 },
  { y0: 0.716, y1: 0.928, half: 0.308, thick: 0.088 },
  { y0: 0.946, y1: 1.158, half: 0.296, thick: 0.086 },
];

const POT_X = 0.01;
const POT_Z = 0.02;

function stoneColor(id: number, course: number, hero: boolean): Rgb {
  const u = noise.random(id, 1, 3);
  // One warm block on the front. The rest of the stack stays cool gray, like the mock.
  if (hero) return mixRgb(TAN_DEEP, TAN, 0.6);
  const r = noise.random(id, 2, 5);
  const tan = course > 0 && r < 0.1;
  if (tan) return r < 0.04 ? mixRgb(TAN_DEEP, TAN, u) : mixRgb(TAN, TAN_PALE, u * 0.3);
  if (r > 0.8) return mixRgb(GRAY, GRAY_LIGHT, u * 0.4);
  if (r < 0.26) return mixRgb(GRAY_DEEP, GRAY_DARK, 0.25 + 0.75 * u);
  return mixRgb(GRAY_DARK, GRAY, 0.45 + 0.45 * u);
}

/**
 * A running-bond ring. Even courses: front and back stones own the corners.
 * Odd courses: the side stones own the corners. The joint sits off center.
 */
function courseRing(index: number): Sdf[] {
  const c = COURSES[index]!;
  const joint = 0.018;
  const h = c.y1 - c.y0;
  const cy = (c.y0 + c.y1) / 2;
  const frontOwns = index % 2 === 0;
  const shift = (noise.random(index + 1, 4, 8) - 0.5) * 0.07;
  const stones: Sdf[] = [];
  let id = index * 10 + 2;

  const place = (alongAxis: 'x' | 'z', sign: 1 | -1, owns: boolean) => {
    const limit = owns ? c.half : c.half - c.thick - joint * 0.5;
    const mid = shift * (alongAxis === 'x' ? -1 : 1);
    const spans: [number, number][] = [
      [-limit, mid - joint / 2],
      [mid + joint / 2, limit],
    ];
    for (const [a, b] of spans) {
      const along = b - a;
      if (along < 0.08) continue;
      const center = (a + b) / 2;
      const hero = alongAxis === 'z' && sign === 1 && index === 2 && center > 0;
      // A few stones sit proud so the outline is a stack, not a smooth taper.
      const stick = noise.random(id, 13, 17) > 0.78;
      const proud = hero || stick ? 0.024 : Math.max(0, noise.random(id, 11, 19) - 0.55) * 0.012;
      const depth = c.thick + proud;
      const bevel = Math.min(0.02, along * 0.18, h * 0.2, depth * 0.28);
      const size: [number, number, number] =
        alongAxis === 'z' ? [along, h, depth] : [depth, h, along];
      const faceOut = c.half - depth / 2 + proud * 0.2;
      const x = alongAxis === 'z' ? center : sign * faceOut;
      const z = alongAxis === 'z' ? sign * faceOut : center;
      let shape = sdf.box(size, bevel);
      // A few upper stones sit a few degrees off, so the stack looks hand-laid.
      const yaw = index > 0 && index < 4 ? (noise.random(id, 7, 2) - 0.5) * 4.5 : 0;
      if (Math.abs(yaw) > 0.6) shape = shape.rotateY(yaw);
      stones.push(shape.at(x, cy, z).paint(stoneColor(id, index, hero)));
      id++;
    }
  };

  place('z', 1, frontOwns);
  place('z', -1, frontOwns);
  place('x', 1, !frontOwns);
  place('x', -1, !frontOwns);
  return stones;
}

/** Mortar core. It stays inside the stones and shows only in the thin joints. */
function mortarCore(): Sdf {
  const parts = COURSES.map((c, i) => {
    const next = COURSES[i + 1];
    const half = Math.min(c.half, next ? next.half : c.half) - 0.01;
    const yLo = i === 0 ? 0 : c.y0 - 0.004;
    const yHi = next ? next.y0 + 0.012 : 1.22;
    const h = yHi - yLo;
    return sdf.box([half * 2, h, half * 2], 0.01).at(0, yLo + h / 2, 0);
  });
  return sdf.union(...parts).paint(MORTAR);
}

/** Four pale cap slabs. The mortar bed stays inside the top course so it does not form a dark lip. */
function capSlabs(): Sdf {
  const bed = sdf.box([0.5, 0.08, 0.5], 0.014).at(0, 1.16, 0).paint(MORTAR);
  const gap = 0.016;
  const slab = 0.322;
  const off = gap / 2 + slab / 2;
  const colors = [CAP, CAP_WARM, CAP_COOL, mixRgb(CAP, CAP_WARM, 0.5)];
  const slabs = [
    [off, off],
    [-off, off],
    [off, -off],
    [-off, -off],
  ].map(([x, z], i) =>
    sdf
      .box([slab, 0.1, slab], 0.022)
      .at(x!, 1.22, z!)
      .paint(colors[i]!),
  );
  const seam = sdf
    .union(
      sdf.box([0.62, 0.045, 0.014], 0.003).at(0, 1.2, 0),
      sdf.box([0.014, 0.045, 0.62], 0.003).at(0, 1.2, 0),
    )
    .paint(MORTAR);
  return sdf.union(bed, seam, ...slabs);
}

function weather(x: number, y: number, z: number, base: Rgb): Rgb {
  const grit = noise.fbm(x * 6, y * 6, z * 6, 2, 4);
  let c = grit < 0 ? mixRgb(base, GRAY_DARK, -grit * 0.12) : mixRgb(base, GRAY_LIGHT, grit * 0.08);
  c = mixRgb(c, GRAY_DEEP, clamp01((0.12 - y) / 0.12) * 0.14);
  if (y > 1.12) {
    const radial = Math.hypot(x - POT_X, z - POT_Z);
    const soot = clamp01(1 - (radial - 0.05) / 0.13) * clamp01((y - 1.12) / 0.06);
    c = mixRgb(c, SOOT, soot * 0.45);
  }
  return c;
}

/** Short stone pot. The open top is the dark flue. The rim stays lighter than the mouth. */
function fluePot(): Sdf {
  const wall = sdf.cylinder(0.1, 0.14, 0.014).at(POT_X, 1.33, POT_Z);
  const rim = sdf.torus(0.094, 0.014).at(POT_X, 1.386, POT_Z);
  const hole = sdf.cylinder(0.062, 0.16).at(POT_X, 1.4, POT_Z);
  const interior = sdf.cylinder(0.068, 0.12).at(POT_X, 1.35, POT_Z);
  const lip = sdf.torus(0.094, 0.02).at(POT_X, 1.386, POT_Z);
  return sdf
    .smoothUnion(0.01, wall, rim)
    .subtract(hole)
    .paint(FLUE_BODY)
    .paintWhere(interior, FLUE_HOLE)
    .paintWhere(lip, FLUE_RIM, 0.006);
}

/** A thin gray wisp. The spine starts in the pot mouth and curls as it rises. No emissive. */
function smokeWisp(): Sdf {
  const spine = sdf.chain(
    [
      [POT_X, 1.34, POT_Z, 0.018],
      [POT_X + 0.006, 1.42, POT_Z + 0.016, 0.026],
      [POT_X + 0.022, 1.5, POT_Z + 0.02, 0.03],
      [POT_X + 0.046, 1.57, POT_Z + 0.008, 0.022],
      [POT_X + 0.066, 1.64, POT_Z - 0.004, 0.016],
    ],
    0.02,
  );
  const bulge = sdf.ellipsoid([0.028, 0.02, 0.024]).at(POT_X + 0.016, 1.48, POT_Z + 0.028);
  return spine.smoothUnion(0.02, bulge).paintFn((x, y, _z, base) => {
    const t = clamp01((y - 1.36) / 0.28);
    return mixRgb(rgb('#6a6662'), base, 0.4 + 0.6 * t);
  });
}

export default defineAsset({
  name: 'chimney',
  description:
    'Fieldstone chimney stack: five tapered courses of rounded blocks, a pale slab cap, a dark flue pot, and a thin gray smoke wisp.',
  detail: 0.013,
  reference: 'docs/item-mockups/chimney-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const stones = COURSES.flatMap((_, i) => courseRing(i));
    const stack = sdf.union(mortarCore(), capSlabs(), ...stones).paintFn(weather);
    k.body('stone', stack, {
      color: '#a39eaa',
      roughness: 0.92,
      metalness: 0,
      detail: 0.014,
      textureDensity: 1.4,
      paintWeight: 0.6,
      maxError: 0.006,
      maxTriangles: 2400,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 16, y * 16, z * 16, 2, 6),
    });

    k.body('flue', fluePot(), {
      color: FLUE_BODY,
      roughness: 0.8,
      metalness: 0,
      detail: 0.006,
      textureDensity: 2,
      maxError: 0.0016,
      maxTriangles: 650,
    });

    k.body('smoke', smokeWisp(), {
      color: SMOKE,
      roughness: 0.9,
      metalness: 0,
      opacity: 0.5,
      detail: 0.005,
      maxError: 0.0015,
    });
  },
});
