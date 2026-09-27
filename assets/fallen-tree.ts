import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * Fallen tree — Chibi Quest terrain prop (catalog `nature/terrain/fallen-tree`).
 *
 * Role: forest-floor landmark and path obstacle. It must read at 128 px.
 * Size: a 3 m trunk along X, 0.4 m thick, on y = 0, centred, front toward +Z.
 * One idea: a chunky log with a pale cut at -X and a tall upturned root plate at +X.
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
const cutLight = rgb('#e4c49a');
const cutRing = rgb('#a87d4b');
const cutDark = rgb('#6e4a28');
const earthMid = rgb('#6b4a32');
const earthDark = rgb('#4a3222');
const earthLight = rgb('#8a6244');
const mossMid = rgb('#4a9a4f');
const mossDark = rgb('#2f7a3f');
const mossLight = rgb('#7ec850');
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

// Root plate: a disc at the +X end. The wood face points toward the trunk and the front camera.
const PLATE_YAW = 34;
const PLATE_LEAN = -16;
const PLATE_R = 0.5;
const PLATE_T = 0.18;
const PLATE_C: Vec3 = [1.16, 0.54, 0.0];
const plateN: Vec3 = rotZ(rotY(rotZ([0, 1, 0], 90), PLATE_YAW), PLATE_LEAN);

const plateUp = (): Vec3 => {
  const n = plateN;
  const hint: Vec3 = Math.abs(n[1]) > 0.85 ? [1, 0, 0] : [0, 1, 0];
  const d = dot(hint, n);
  return norm([hint[0] - n[0] * d, hint[1] - n[1] * d, hint[2] - n[2] * d]);
};
const plateV = plateUp();
const plateU: Vec3 = norm([
  plateN[1] * plateV[2] - plateN[2] * plateV[1],
  plateN[2] * plateV[0] - plateN[0] * plateV[2],
  plateN[0] * plateV[1] - plateN[1] * plateV[0],
]);

/** A point in the plate frame. depth is along the wood-face normal. */
const platePoint = (ang: number, rad: number, depth: number): Vec3 => {
  const a = (ang * Math.PI) / 180;
  return add(add(add(PLATE_C, plateU, Math.cos(a) * rad), plateV, Math.sin(a) * rad), plateN, depth);
};

// Pale cut at the -X end, turned toward +Z so the front view sees the oval.
const cutN = norm([-0.86, 0.05, 0.51]);
const cutAt: Vec3 = [-1.56, 0.175, 0.03];
const cutOff = dot(cutN, cutAt);

const stubUpA: Vec3 = [0.05, 0.34, 0.04];
const stubUpB: Vec3 = [0.14, 0.68, 0.12];
const stubSideA: Vec3 = [-0.52, 0.3, 0.14];
const stubSideB: Vec3 = [-0.4, 0.46, 0.44];

const ground = sdf.halfSpace([0, -1, 0], 0);

const ridges = (x: number, y: number, z: number): number => noise.fbm(y * 14, z * 14, x * 2.2, 3, 41);

const plateFrame = (x: number, y: number, z: number): { depth: number; radial: number; ang: number } => {
  const rel: Vec3 = [x - PLATE_C[0], y - PLATE_C[1], z - PLATE_C[2]];
  const depth = dot(rel, plateN);
  const u = dot(rel, plateU);
  const v = dot(rel, plateV);
  return { depth, radial: Math.hypot(u, v), ang: Math.atan2(v, u) };
};

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

  // Root-plate wood face: a few bold rings and a dark bark lip.
  const pf = plateFrame(x, y, z);
  const onPlate = smoothstep(0.04, 0.08, pf.depth) * smoothstep(PLATE_R + 0.03, PLATE_R - 0.015, pf.radial);
  if (onPlate > 0.01) {
    const ring = 0.5 + 0.5 * Math.sin(pf.radial * 20 + 0.4);
    let pc = mixRgb(cutWood, cutLight, 0.35 * (1 - ring));
    pc = mixRgb(pc, cutDark, smoothstep(0.25, 0.85, ring) * 0.72);
    pc = mixRgb(pc, cutDark, clamp01((0.05 - pf.radial) / 0.05) * 0.45);
    pc = mixRgb(pc, barkDark, smoothstep(PLATE_R - 0.09, PLATE_R - 0.02, pf.radial));
    const spoke = Math.abs(Math.sin(pf.ang * 1.5 + 0.6));
    pc = mixRgb(pc, barkDeep, smoothstep(0.28, 0.05, spoke) * smoothstep(0.1, 0.2, pf.radial) * 0.45);
    c = mixRgb(c, pc, onPlate);
  }

  // Cut oval at the -X end.
  const cutDepth = cutOff - dot(cutN, [x, y, z]);
  const relC: Vec3 = [x - cutAt[0], y - cutAt[1], z - cutAt[2]];
  const cutRadial = Math.sqrt(Math.max(0, dot(relC, relC) - cutDepth * cutDepth));
  const onCut = smoothstep(0.018, 0.004, cutDepth) * smoothstep(0.2, 0.13, cutRadial);
  if (onCut > 0.01) {
    const ring = 0.5 + 0.5 * Math.sin(cutRadial * 42);
    let pc = mixRgb(cutWood, cutLight, 0.3 * (1 - ring));
    pc = mixRgb(pc, cutRing, ring * 0.55);
    pc = mixRgb(pc, cutDark, clamp01((0.022 - cutRadial) / 0.022) * 0.4);
    pc = mixRgb(pc, barkDark, smoothstep(0.11, 0.16, cutRadial));
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
  const pf = plateFrame(x, y, z);
  const onPlate = smoothstep(0.035, 0.075, pf.depth) * smoothstep(PLATE_R, PLATE_R - 0.04, pf.radial);
  const cutDepth = cutOff - dot(cutN, [x, y, z]);
  const onCut = smoothstep(0.016, 0.0, cutDepth);
  const face = Math.max(onPlate, onCut);
  const groove = 0.0045 * ridges(x, y, z) * (1 - 0.75 * face);
  const ring = -0.0028 * onPlate * smoothstep(0.2, 0.8, 0.5 + 0.5 * Math.sin(pf.radial * 20));
  return groove + ring;
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

const mossClump = (cx: number, cy: number, cz: number, s: number): Sdf =>
  sdf
    .sphere(0.06 * s)
    .at(cx, cy, cz)
    .smoothUnion(0.022 * s, sdf.sphere(0.046 * s).at(cx + 0.05 * s, cy + 0.01 * s, cz + 0.022 * s))
    .smoothUnion(0.02 * s, sdf.sphere(0.04 * s).at(cx - 0.038 * s, cy + 0.014 * s, cz - 0.02 * s))
    .smoothUnion(0.018 * s, sdf.sphere(0.034 * s).at(cx + 0.012 * s, cy + 0.03 * s, cz + 0.04 * s));

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
    // The trunk sags onto the ground and rises into the centre of the plate. 3 m along X.
    let trunk = sdf.chain(
      [
        [-1.66, 0.175, 0.02, 0.165],
        [-1.02, 0.158, 0.035, 0.192],
        [-0.25, 0.15, -0.015, 0.21],
        [0.45, 0.162, 0.025, 0.198],
        [0.9, 0.24, 0.01, 0.18],
        [1.12, 0.4, 0.0, 0.145],
      ],
      0.065,
    );
    // Two knots so the log is not a pipe.
    trunk = trunk
      .smoothUnion(0.03, sdf.ellipsoid([0.07, 0.055, 0.06]).at(-0.7, 0.3, 0.12))
      .smoothUnion(0.028, sdf.ellipsoid([0.06, 0.05, 0.055]).at(0.35, 0.28, -0.1));

    let plate = sdf
      .cylinder(PLATE_R, PLATE_T, 0.034)
      .rotateZ(90)
      .rotateY(PLATE_YAW)
      .rotateZ(PLATE_LEAN)
      .at(PLATE_C[0], PLATE_C[1], PLATE_C[2]);
    for (const ang of [28, 125, 210, 310]) {
      const p = platePoint(ang, PLATE_R * 0.78, 0);
      plate = plate.smoothUnion(0.045, sdf.sphere(0.09).at(p[0], p[1], p[2]));
    }

    // Roots grip the ground. Radii stay moderate so the wood mesh can reduce cleanly.
    const roots = sdf.smoothUnion(
      0.028,
      sdf.chain(
        [
          [1.05, 0.28, 0.14, 0.072],
          [0.86, 0.1, 0.36, 0.055],
          [0.7, -0.02, 0.5, 0.04],
        ],
        0.02,
      ),
      sdf.chain(
        [
          [1.22, 0.3, -0.08, 0.066],
          [1.38, 0.1, -0.26, 0.05],
          [1.48, -0.02, -0.38, 0.038],
        ],
        0.02,
      ),
      sdf.chain(
        [
          [1.4, 0.28, 0.02, 0.06],
          [1.58, 0.1, 0.08, 0.046],
          [1.72, -0.02, 0.12, 0.036],
        ],
        0.018,
      ),
      sdf.chain(
        [
          [1.02, 0.16, 0.02, 0.055],
          [0.9, 0.06, 0.2, 0.042],
          [0.82, -0.02, 0.3, 0.034],
        ],
        0.016,
      ),
    );
    const stubUp = sdf.cone(stubUpA, stubUpB, 0.078, 0.042);
    const stubSide = sdf.cone(stubSideA, stubSideB, 0.068, 0.038);
    const cutStub = sdf.cone([-1.54, 0.1, 0.06], [-1.84, 0.05, 0.16], 0.042, 0.028);

    const wood = trunk
      .smoothUnion(0.05, plate)
      .smoothUnion(0.028, stubUp)
      .smoothUnion(0.024, stubSide)
      .smoothIntersect(0.014, sdf.halfSpace(cutN, cutOff))
      .smoothUnion(0.016, cutStub)
      .intersect(ground);

    k.body('wood', wood.paintFn(woodPaint), {
      color: bark,
      roughness: 0.86,
      metalness: 0,
      detail: 0.024,
      maxTriangles: 3800,
      textureDensity: 1.3,
      bump: woodBump,
    });

    // Roots are a second wood body so the long log can reduce without their creases.
    k.body('roots', roots.intersect(ground).paintFn(woodPaint), {
      color: bark,
      roughness: 0.86,
      metalness: 0,
      detail: 0.018,
      maxTriangles: 900,
      bump: woodBump,
    });

    // ------------------------------------------------------------------ earth
    // A low mound under the plate, plus soil still stuck to the lower rim. Not a second disc.
    const rimSoil = platePoint(200, 0.4, -0.05);
    const sideBreak = platePoint(20, 0.42, -0.02);
    const earth = sdf
      .ellipsoid([0.42, 0.1, 0.32])
      .at(1.16, 0.015, 0.02)
      .smoothUnion(0.045, sdf.ellipsoid([0.16, 0.12, 0.12]).at(rimSoil[0], Math.max(0.08, rimSoil[1]), rimSoil[2]))
      .smoothUnion(0.04, sdf.sphere(0.11).at(sideBreak[0], sideBreak[1], sideBreak[2]))
      .smoothUnion(0.04, sdf.ellipsoid([0.14, 0.08, 0.12]).at(0.76, 0.04, 0.38))
      .smoothUnion(0.035, sdf.ellipsoid([0.13, 0.07, 0.11]).at(1.55, 0.04, 0.1))
      .smoothUnion(0.03, sdf.ellipsoid([0.12, 0.06, 0.1]).at(1.34, 0.035, -0.24))
      .intersect(ground);
    k.body('earth', earth.paintFn(earthPaint), {
      color: earthMid,
      roughness: 0.94,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 1500,
      bump: (x, y, z) => 0.0035 * noise.fbm(x * 5, y * 5, z * 5, 2, 3),
    });

    // ------------------------------------------------------------------ moss
    const plateMoss = platePoint(90, 0.36, 0.04);
    const moss = mossClump(-0.22, 0.35, 0.08, 1.35)
      .smoothUnion(0.012, mossClump(0.42, 0.34, 0.1, 1.05))
      .smoothUnion(0.016, mossClump(plateMoss[0], plateMoss[1] + 0.03, plateMoss[2], 1.55))
      .smoothUnion(0.01, mossClump(0.12, 0.045, 0.4, 0.85));
    k.body('moss', moss.paintFn(mossPaint), {
      color: mossMid,
      roughness: 0.92,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 620,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 18, y * 18, z * 18, 2, 4),
    });

    // ------------------------------------------------------------------ fern
    // Five broad blades in front of the log. Wide in X so the front view sees the fan.
    const fern = sdf
      .sphere(0.055)
      .at(FERN[0], 0.045, FERN[2])
      .smoothUnion(0.018, sdf.ellipsoid([0.07, 0.14, 0.04]).at(0.82, 0.16, 0.54))
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
      maxTriangles: 900,
    });
  },
});
