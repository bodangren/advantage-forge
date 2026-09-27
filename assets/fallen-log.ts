import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Vec3 } from '../src/index.js';

/**
 * forest/prop/fallen-log — a chunky mossy fallen log for the Chibi Quest forest.
 *
 * Role: mid-ground forest prop; the dark hollow at the front end is the story hook
 *   (something lives in there), framed by a bright pale cut ring.
 * Size: about 2 m long along +Z, 0.5 m thick, resting on y = 0, facing +Z. No rig, no clips.
 * One idea: warm brown bark with one strong value contrast — a pale cut face around a
 *   near-black hollow — while moss and shelf mushrooms keep the top sunny green.
 * Shape language: round dominant (chunky cylinder, soft bevels on every rim, gentle lumps);
 *   the tilted back cut breaks the pure cylinder silhouette.
 * Palette (contract): bark #8a5a35, dark bark #5f3d22, pale cut wood #c9a06a,
 *   moss #4a9a4f (+deep #357a3f, light #6fbf5e), hollow near-black #241406,
 *   shelf fungus tan #b98d55 with cream underside #e8d5a8.
 * Materials: bark/wood (roughness 0.85, groove detail in bump, never displace) and
 *   shelf fungus (roughness 0.8, fuzzy bump).
 * Detail list: lumpy log with tilted back cut (big), pale faces + hollow (focal, medium),
 *   two branch stubs, three shelf mushrooms, moss patches on the upper flank (medium),
 *   groove/grain bump (small). Focal point: the hollow end.
 * Rig/animation: none.
 */

const barkBase = rgb('#8a5a35');
const barkDark = rgb('#5f3d22');
const barkDeep = rgb('#3d2717');
const barkLight = rgb('#a4713f');
const cutWood = rgb('#c9a06a');
const cutRing = rgb('#a87d4b');
const hollowDark = rgb('#241406');
const mossMid = rgb('#4a9a4f');
const mossDeep = rgb('#357a3f');
const mossLight = rgb('#6fbf5e');
const shelfTop = rgb('#9d7744');
const shelfBand = rgb('#7d5a30');
const shelfRim = rgb('#c9a06a');
const shelfUnder = rgb('#e8d5a8');

const AXIS_Y = 0.245; // log axis height; radius ~0.24 so the flat ground cut is a small patch
const FRONT_Z = 1.0; // the hollow end faces +Z
const HOLLOW_R = 0.135;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const norm = (u: Vec3): Vec3 => {
  const l = Math.hypot(u[0], u[1], u[2]) || 1;
  return [u[0] / l, u[1] / l, u[2] / l];
};

// Back end: a cut plane tilted 13 degrees, so the log ends in a slanted pale face.
const tilt = (13 * Math.PI) / 180;
const nBack = norm([0, Math.sin(tilt), -Math.cos(tilt)]);
const backC: Vec3 = [0, AXIS_Y, -0.975]; // where the back plane crosses the log axis
const backOff = nBack[1] * backC[1] + nBack[2] * backC[2];

// ------------------------------------------------------------------ shared masks
// The same weight functions drive paint and bump so grooves and dark lines line up.

const frontFaceW = (x: number, y: number, z: number): number =>
  clamp01((z - (FRONT_Z - 0.012)) / 0.01);

const backFaceW = (x: number, y: number, z: number): number => {
  const behind = -(nBack[1] * y + nBack[2] * z - backOff); // depth past the face plane
  return clamp01((0.011 - behind) / 0.008);
};

// Cavity interior: inside the opening radius and behind the front face plane.
const hollowW = (x: number, y: number, z: number): number =>
  clamp01((0.153 - Math.hypot(x, y - AXIS_Y)) / 0.01) *
  clamp01((FRONT_Z + 0.002 - z) / 0.006);

// Pale ring on the front face: the face itself, minus the dark lip of the opening.
const paleFrontW = (x: number, y: number, z: number): number =>
  frontFaceW(x, y, z) * clamp01((Math.hypot(x, y - AXIS_Y) - 0.156) / 0.012);

const grooveN = (x: number, y: number, z: number): number =>
  noise.fbm(x * 8, y * 8, z * 1.8, 3, 7) + 0.4 * noise.fbm(x * 24, y * 24, z * 6, 2, 37);

const mossW = (x: number, y: number, z: number): number => {
  const top = clamp01((y - (AXIS_Y - 0.005)) / 0.09); // upper flank only
  const patch = noise.fbm(x * 2.6, y * 2.2, z * 1.4, 3, 11);
  const grit = clamp01(0.55 + noise.noise3(x * 55, y * 55, z * 20, 2) * 0.7);
  return clamp01((patch + 0.08) * 2.8) * top * grit;
};

const ringShade = (d: number, x: number, y: number, z: number): number =>
  0.5 + 0.5 * Math.sin(d * 110 + noise.fbm(x * 26, y * 26, z * 26, 2, 31) * 1.4);

// ------------------------------------------------------------------ paint

const barkPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  let c = base;
  // Bark grooves: dark furrows with lighter weathered ridges, aligned with the bump.
  const g = grooveN(x, y, z);
  c = mixRgb(c, barkDark, clamp01((-g - 0.08) * 3) * 0.8);
  c = mixRgb(c, barkLight, clamp01((g - 0.12) * 2.4) * 0.32);
  const streak = noise.fbm(x * 5, y * 5, z * 1.2, 2, 17);
  c = mixRgb(c, barkDark, clamp01(-streak) * 0.25);
  // Ground contact shading on the underside, gentle weathering on top.
  const low = clamp01((AXIS_Y - y) / 0.2);
  c = mixRgb(c, barkDeep, low * 0.5);
  c = mixRgb(c, barkLight, clamp01((y - AXIS_Y) / 0.2) * 0.1);
  // Moss patches on the upper side, chunky and sunny.
  const mw = mossW(x, y, z);
  if (mw > 0.003) {
    const v = noise.fbm(x * 9, y * 7, z * 6, 2, 23);
    let mc = mixRgb(mossDeep, mossMid, clamp01(0.35 + v * 0.9));
    mc = mixRgb(mc, mossLight, clamp01(v * 1.2 + 0.35) * 0.55);
    c = mixRgb(c, mc, mw);
  }
  // Dark hollow interior, darkest toward the floor of the cavity.
  const hw = hollowW(x, y, z);
  if (hw > 0.003) {
    const deep = clamp01((0.1 - Math.hypot(x, y - AXIS_Y)) / 0.1);
    c = mixRgb(c, hollowDark, hw * (0.82 + 0.18 * deep));
  }
  // Front face: pale cut wood with growth rings, darker toward the rim.
  const pf = paleFrontW(x, y, z);
  if (pf > 0.003) {
    const d = Math.hypot(x, y - AXIS_Y);
    let pc = mixRgb(cutWood, cutRing, ringShade(d, x, y, z) * 0.62);
    pc = mixRgb(pc, cutRing, clamp01((d - 0.17) / 0.07) * 0.35);
    c = mixRgb(c, pc, pf);
  }
  // Back face: the same pale cut, rings around the tilted face centre.
  const pb = backFaceW(x, y, z);
  if (pb > 0.003) {
    const d = Math.hypot(x - backC[0], y - backC[1], z - backC[2]);
    let pc = mixRgb(cutWood, cutRing, ringShade(d, x, y, z) * 0.62);
    pc = mixRgb(pc, cutRing, clamp01((d - 0.17) / 0.07) * 0.35);
    c = mixRgb(c, pc, pb);
  }
  return c;
};

const barkBump = (x: number, y: number, z: number): number => {
  const face = Math.max(frontFaceW(x, y, z), backFaceW(x, y, z));
  const keep = 1 - 0.85 * clamp01(face); // cut faces are smooth; grooves live on bark only
  let b = 0.0055 * grooveN(x, y, z) * keep;
  b += 0.0013 * noise.noise3(x * 85, y * 85, z * 26, 2) * (1 - 0.6 * clamp01(face));
  b += 0.0016 * noise.fbm(x * 42, y * 42, z * 42, 2, 5) * mossW(x, y, z); // moss fuzz
  return b;
};

// Shelf fungus: banded tan cap face (up and outward), cream underside, dark grip at the bark.
const shelves: Array<{ at: Vec3; n: Vec3 }> = [
  { at: [0.22, 0.39, 0.3], n: [0.41, 0.91, 0] },
  { at: [-0.22, 0.39, 0.58], n: [-0.44, 0.9, 0] },
  { at: [0.16, 0.43, 0.85], n: [0.34, 0.94, 0] },
];

const shelfPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  let bd = 1e9;
  let dn = 0;
  for (const s of shelves) {
    const dx = x - s.at[0];
    const dy = y - s.at[1];
    const dz = z - s.at[2];
    const d = Math.hypot(dx, dy, dz);
    if (d < bd) {
      bd = d;
      dn = dx * s.n[0] + dy * s.n[1] + dz * s.n[2];
    }
  }
  const band = 0.5 + 0.5 * Math.sin(bd * 80 + noise.fbm(x * 30, y * 30, z * 30, 2, 41) * 1.2);
  const cap = clamp01((dn + 0.008) / 0.016);
  let c = mixRgb(shelfUnder, base, clamp01(cap * 1.6));
  c = mixRgb(c, shelfBand, cap * band * 0.75);
  c = mixRgb(c, shelfRim, cap * clamp01((bd - 0.11) / 0.025) * 0.25);
  c = mixRgb(c, barkDeep, clamp01((0.05 - bd) / 0.05) * 0.55);
  return c;
};

export default defineAsset({
  name: 'fallen-log',
  description:
    'Chunky mossy fallen log, 2 m along +Z, with a dark hollow in a pale cut face, bark grooves, shelf mushrooms and moss.',
  detail: 0.02,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ log body
    // A rounded core with three gentle lumps, two branch stubs, bevelled end cuts,
    // a flat ground contact and a hollow bored into the front face.
    const core = sdf.cylinder(0.235, 2.14, 0.02).rotateX(90).at(0, AXIS_Y, 0);
    const lumps = sdf
      .ellipsoid([0.3, 0.29, 0.33])
      .at(0.015, AXIS_Y + 0.005, -0.45)
      .smoothUnion(0.055, sdf.ellipsoid([0.28, 0.285, 0.3]).at(-0.02, AXIS_Y, 0.22))
      .smoothUnion(0.055, sdf.ellipsoid([0.26, 0.26, 0.28]).at(0.015, AXIS_Y - 0.012, 0.66));
    const stubSide = sdf.cone([0.15, 0.27, -0.52], [0.4, 0.42, -0.6], 0.065, 0.03);
    const stubTop = sdf.cone([0.03, 0.4, -0.72], [0.1, 0.54, -0.76], 0.055, 0.024);
    const hollow = sdf.cylinder(HOLLOW_R, 0.3, 0.008).rotateX(90).at(0, AXIS_Y, 0.88);

    const log = core
      .smoothUnion(0.06, lumps)
      .smoothUnion(0.025, stubSide)
      .smoothUnion(0.02, stubTop)
      .smoothIntersect(0.016, sdf.halfSpace([0, 0, 1], FRONT_Z))
      .smoothIntersect(0.014, sdf.halfSpace(nBack, backOff))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .smoothSubtract(0.012, hollow);

    k.body('log', log.paintFn(barkPaint), {
      color: barkBase,
      roughness: 0.85,
      metalness: 0,
      detail: 0.022,
      maxTriangles: 2800,
      paintWeight: 2,
      textureDensity: 2,
      bump: barkBump,
    });

    // ------------------------------------------------------------------ shelf mushrooms
    // Three bracket caps drooping out of the upper flank, banded face up and outward.
    const m1 = sdf.ellipsoid([0.16, 0.065, 0.11]).rotateZ(-24).at(0.25, 0.4, 0.3);
    const m2 = sdf.ellipsoid([0.13, 0.06, 0.09]).rotateZ(206).at(-0.245, 0.4, 0.58);
    const m3 = sdf.ellipsoid([0.105, 0.055, 0.075]).rotateZ(-20).at(0.184, 0.444, 0.85);
    const shelvesShape = m1.smoothUnion(0.012, m2).smoothUnion(0.012, m3);

    k.body('shelves', shelvesShape.paintFn(shelfPaint), {
      color: shelfTop,
      roughness: 0.8,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 800,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 2, 9),
    });
  },
});
