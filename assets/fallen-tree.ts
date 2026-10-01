import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * Fallen tree — Chibi Quest terrain prop (catalog `nature/terrain/fallen-tree`).
 *
 * Role: forest-floor landmark and path obstacle. It must read at 128 px.
 * Size: 3.58 x 1.04 x 1.04 m, a 0.75 m thick log along X with a cut face at -X and a root flare at +X.
 * One idea: a short chunky log, ringed cut end, splayed roots, tall broken branch stub, moss on top.
 * Shape language: round and chunky, with soft bevels. The plate breaks the silhouette.
 * Palette: bark #8a5a35 / #5f3d22, cut wood #c9a06a, earth #6b4a32 / #4a3222,
 * moss and fern #2f7a3f / #4a9a4f / #7ec850, stone flecks #8a94a0 in the earth.
 * Materials: wood 0.86, earth 0.94, moss 0.92, fern 0.78. No metal.
 * Detail: trunk, plate, stubs, and roots (big); earth clumps (medium); moss and fern (small).
 * Focal point: the pale ringed face of the root plate. No rig and no clips.
 */

const bark = rgb('#8a5a35');
const barkDark = rgb('#5f3d22');
const barkDeep = rgb('#3d2717');
const barkLight = rgb('#a4713f');
const cutWood = rgb('#c9a06a');
const pale = rgb('#c89a62');
const darkRing = rgb('#8a5a32');
const cutLight = rgb('#e4c49a');
const cutRing = rgb('#a87d4b');
const cutDark = rgb('#6e4a28');
const earthMid = rgb('#6b4a32');
const earthDark = rgb('#4a3222');
const earthLight = rgb('#8a6244');
const mossMid = rgb('#4a9a4f');
const mossDark = rgb('#2f7a3f');
const mossLight = rgb('#9cc848'); // yellow-green tops
const fernDeep = rgb('#2f7a3f');
const fernMid = rgb('#4a9a4f');
const fernLight = rgb('#7ec850');
const stoneMid = rgb('#8a94a0');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (u: Vec3): Vec3 => {
  const l = Math.hypot(u[0], u[1], u[2]) || 1;
  return [u[0] / l, u[1] / l, u[2] / l];
};
const add = (a: Vec3, b: Vec3, s = 1): Vec3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];

/** Match `Sdf.rotate`: R = Rz * Ry * Rx, so a local axis lands on this world axis. */
const rotY = (v: Vec3, deg: number): Vec3 => {
  const c = Math.cos((deg * Math.PI) / 180);
  const s = Math.sin((deg * Math.PI) / 180);
  return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]];
};
const rotZ = (v: Vec3, deg: number): Vec3 => {
  const c = Math.cos((deg * Math.PI) / 180);
  const s = Math.sin((deg * Math.PI) / 180);
  return [c * v[0] - s * v[1], s * v[0] + c * v[1], v[2]];
};

// Cut face at the -X end, turned a little toward +Z so the front view sees the oval.
const cutN = norm([-0.8, 0.03, 0.6]);
const cutAt: Vec3 = [-1.74, 0.29, 0.0];
const cutOff = dot(cutN, cutAt);

const stubUpA: Vec3 = [0.05, 0.5, 0.05];
const stubUpB: Vec3 = [0.12, 0.98, 0.1];
const stubSideA: Vec3 = [-0.75, 0.45, -0.2];
const stubSideB: Vec3 = [-0.62, 0.6, -0.5];

const ground = sdf.halfSpace([0, -1, 0], 0);

const ridges = (x: number, y: number, z: number): number => noise.fbm(y * 14, z * 14, x * 2.2, 3, 41);

const woodPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  let c = mixRgb(base, barkDark, 0.1 + 0.14 * (0.5 + 0.5 * noise.fbm(x * 1.4, y * 1.8, z * 1.8, 2, 11)));
  const g = ridges(x, y, z);
  c = mixRgb(c, barkDeep, smoothstep(0.05, -0.5, g) * 0.7);
  c = mixRgb(c, barkLight, smoothstep(0.1, 0.55, g) * 0.32);
  c = mixRgb(c, barkDeep, clamp01((0.14 - y) / 0.14) * 0.45);
  c = mixRgb(c, barkLight, clamp01((y - 0.3) / 0.28) * 0.1);
  // Soft moss tint on the upper bark. Wide falloff so it stays a gradient, not a seam.
  const mossN = noise.fbm(x * 1.8, y * 1.6, z * 1.8, 2, 27);
  const mossW = clamp01((y - 0.18) / 0.2) * clamp01(mossN + 0.15) * 0.55;
  if (mossW > 0.02) c = mixRgb(c, mixRgb(mossDark, mossMid, clamp01(0.4 + mossN)), mossW);

  // Cut oval at the -X end.
  const cutDepth = cutOff - dot(cutN, [x, y, z]);
  const relC: Vec3 = [x - cutAt[0], y - cutAt[1], z - cutAt[2]];
  const cutRadial = Math.sqrt(Math.max(0, dot(relC, relC) - cutDepth * cutDepth));
  const onCut = smoothstep(0.03, 0.008, cutDepth) * smoothstep(0.42, 0.3, cutRadial);
  if (onCut > 0.01) {
    const ring = Math.floor(cutRadial / 0.048) % 2 === 0 ? 0 : 1;
    let pc = mixRgb(pale, darkRing, ring * 0.85);
    pc = mixRgb(pc, darkRing, clamp01((0.03 - cutRadial) / 0.03) * 0.6);
    pc = mixRgb(pc, barkDark, smoothstep(0.255, 0.275, cutRadial));
    c = mixRgb(c, pc, onCut);
  }

  const tipW = (a: Vec3, b: Vec3): number => {
    const ab: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const len = Math.hypot(ab[0], ab[1], ab[2]) || 1;
    const along = dot([x - a[0], y - a[1], z - a[2]], norm(ab));
    return smoothstep(len - 0.04, len - 0.012, along) * smoothstep(0.07, 0.03, Math.hypot(x - b[0], y - b[1], z - b[2]));
  };
  const tw = Math.max(tipW(stubUpA, stubUpB), tipW(stubSideA, stubSideB));
  if (tw > 0.02) c = mixRgb(c, mixRgb(cutWood, cutRing, 0.3), tw);
  return c;
};

const woodBump = (x: number, y: number, z: number): number => {
  const cutDepth = cutOff - dot(cutN, [x, y, z]);
  const onCut = smoothstep(0.03, 0.0, cutDepth);
  return 0.008 * ridges(x, y, z) * (1 - 0.85 * onCut);
};

const earthPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const n = noise.fbm(x * 4, y * 4, z * 4, 3, 17);
  let c = mixRgb(base, earthDark, clamp01(-n) * 0.5);
  c = mixRgb(c, earthLight, clamp01(n - 0.12) * 0.35);
  c = mixRgb(c, earthDark, clamp01((0.07 - y) / 0.07) * 0.4);
  c = mixRgb(c, stoneMid, smoothstep(0.5, 0.75, noise.fbm(x * 16, y * 16, z * 16, 2, 71)) * 0.4);
  return c;
};

const mossPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const n = noise.fbm(x * 8, y * 8, z * 8, 2, 23);
  let c = mixRgb(mossDark, base, clamp01(0.4 + n * 0.6));
  c = mixRgb(c, mossLight, clamp01(n * 0.6 + (y - 0.25) * 1.2) * 0.5);
  return c;
};

const fernPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const t = clamp01((y - 0.02) / 0.34);
  let c = mixRgb(fernDeep, fernMid, t);
  c = mixRgb(c, fernLight, smoothstep(0.5, 1, t) * 0.8);
  return c;
};

// Bubbly moss cushions: a flat pad under a cluster of small distinct bumps, like the
// mockup's clay moss (single smooth spheres read as pills).
const mossClump = (cx: number, cy: number, cz: number, s: number): Sdf => {
  const parts: Sdf[] = [sdf.ellipsoid([0.085 * s, 0.022 * s, 0.075 * s]).at(cx, cy, cz)];
  for (let i = 0; i < 11; i++) {
    const a = noise.random(i, Math.round(cx * 100), 3) * Math.PI * 2;
    const d = Math.sqrt(noise.random(i, Math.round(cz * 100), 5)) * 0.07 * s;
    const r = (0.02 + 0.016 * noise.random(i, 7, Math.round(s * 10))) * s;
    parts.push(sdf.sphere(r).at(cx + Math.cos(a) * d, cy + 0.012 * s, cz + Math.sin(a) * d));
  }
  return sdf.smoothUnion(0.006 * s, ...parts);
};

const FERN: Vec3 = [0.82, 0, 0.4];

export default defineAsset({
  name: 'fallen-tree',
  description:
    'A 3 m fallen tree on the forest floor: rough bark, an upturned root plate with roots and earth, two broken stubs, moss, and a small fern.',
  detail: 0.022,
  reference: 'docs/item-mockups/fallen-tree-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wood
    let trunk = sdf.chain(
      [
        [-1.8, 0.28, 0.0, 0.3],
        [-0.8, 0.3, 0.0, 0.335],
        [0.4, 0.325, 0.0, 0.365],
        [1.15, 0.33, 0.0, 0.39],
      ],
      0.1,
    );
    trunk = trunk
      .smoothUnion(0.04, sdf.ellipsoid([0.12, 0.1, 0.1]).at(-0.3, 0.6, 0.25))
      .smoothUnion(0.04, sdf.ellipsoid([0.1, 0.09, 0.09]).at(0.7, 0.55, -0.25));

    const rootDefs: Array<[Vec3, Vec3, Vec3, number]> = [
      [[1.1, 0.4, 0.2], [1.3, 0.12, 0.42], [1.4, -0.02, 0.5], 0.13],
      [[1.15, 0.4, -0.2], [1.3, 0.14, -0.42], [1.4, -0.02, -0.5], 0.13],
      [[1.25, 0.35, 0.05], [1.5, 0.12, 0.25], [1.68, -0.02, 0.32], 0.11],
      [[1.25, 0.35, -0.05], [1.5, 0.12, -0.25], [1.68, -0.02, -0.32], 0.11],
      [[1.3, 0.3, 0.0], [1.55, 0.1, 0.0], [1.74, -0.02, 0.0], 0.1],
      [[1.0, 0.25, 0.3], [1.0, 0.08, 0.45], [0.95, -0.02, 0.52], 0.09],
      [[1.0, 0.25, -0.3], [1.0, 0.08, -0.45], [0.95, -0.02, -0.52], 0.09],
    ];
    const rootShapes = rootDefs.map(([a, m, e, r]) =>
      sdf.chain([[a[0], a[1], a[2], r], [m[0], m[1], m[2], r * 0.75], [e[0], e[1], e[2], r * 0.55]], 0.03),
    );
    const roots = sdf.smoothUnion(0.04, ...rootShapes);
    const flare = sdf.ellipsoid([0.34, 0.36, 0.4]).at(1.25, 0.3, 0);
    const stubUp = sdf.cone(stubUpA, stubUpB, 0.11, 0.07);
    const stubSide = sdf.cone(stubSideA, stubSideB, 0.085, 0.055);

    const wood = trunk
      .smoothUnion(0.08, flare)
      .smoothUnion(0.05, stubUp)
      .smoothUnion(0.04, stubSide)
      .smoothIntersect(0.02, sdf.halfSpace(cutN, cutOff))
      .intersect(ground);

    k.body('wood', wood.paintFn(woodPaint), {
      color: bark,
      roughness: 0.86,
      metalness: 0,
      detail: 0.022,
      maxTriangles: 3500,
      textureDensity: 1.3,
      bump: woodBump,
    });

    k.body('roots', roots.intersect(ground).paintFn(woodPaint), {
      color: bark,
      roughness: 0.86,
      metalness: 0,
      detail: 0.016,
      maxTriangles: 1500,
      bump: woodBump,
    });

    // ------------------------------------------------------------------ earth
    const earth = sdf
      .ellipsoid([0.5, 0.08, 0.5])
      .at(1.25, 0.0, 0)
      .smoothUnion(0.04, sdf.ellipsoid([0.14, 0.07, 0.12]).at(0.6, 0.02, 0.45))
      .intersect(ground);
    k.body('earth', earth.paintFn(earthPaint), {
      color: earthMid,
      roughness: 0.94,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0035 * noise.fbm(x * 5, y * 5, z * 5, 2, 3),
    });

    // ------------------------------------------------------------------ moss
    const moss = mossClump(-1.1, 0.64, 0.05, 2)
      .smoothUnion(0.012, mossClump(-0.35, 0.68, -0.05, 2.2))
      .smoothUnion(0.012, mossClump(0.5, 0.7, 0.05, 2))
      .smoothUnion(0.012, mossClump(0.95, 0.7, -0.05, 1.8))
      .smoothUnion(0.01, mossClump(0.0, 0.04, 0.42, 0.9));
    k.body('moss', moss.paintFn(mossPaint), {
      color: mossMid,
      roughness: 0.92,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 2200,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 45, y * 45, z * 45, 3, 4),
    });

    // ------------------------------------------------------------------ fern
    // Five broad blades in front of the log. Wide in X so the front view sees the fan.
    const fern = sdf
      .sphere(0.055)
      .at(FERN[0], 0.045, FERN[2])
      .smoothUnion(0.018, sdf.ellipsoid([0.07, 0.14, 0.04]).at(0.82, 0.16, 0.5))
      .smoothUnion(0.016, sdf.ellipsoid([0.06, 0.12, 0.038]).rotateZ(-22).at(0.66, 0.14, 0.5))
      .smoothUnion(0.016, sdf.ellipsoid([0.06, 0.12, 0.038]).rotateZ(20).at(0.98, 0.14, 0.52))
      .smoothUnion(0.014, sdf.ellipsoid([0.05, 0.09, 0.034]).rotateZ(-32).at(0.54, 0.1, 0.46))
      .smoothUnion(0.014, sdf.ellipsoid([0.05, 0.09, 0.034]).rotateZ(30).at(1.08, 0.1, 0.48))
      .intersect(ground);
    k.body('fern', fern.paintFn(fernPaint), {
      color: fernDeep,
      roughness: 0.78,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 600,
    });
  },
});
