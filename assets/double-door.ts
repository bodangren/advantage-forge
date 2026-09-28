import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/building-parts/double-door
 *
 * Role: the tavern's front doorway module; must read at 128 px. Static building part.
 * Size: 1.6 m wide (X) x 1.8 m tall (Y) x 0.22 m deep (Z); stands on y = 0, centred on
 *   the Y axis, front face toward +Z. Arch springs at y = 1.0, apex at 1.8.
 * One idea: two honey-oak plank leaves under one round walnut arch, the pewter strap
 *   hinges and ring handles the readable accents.
 * Shape language: square sturdy carpentry (dominant) with a round arch top and soft bevels.
 * Palette: dark walnut #6b4226 frame (dominant), honey oak #b5814a / warm brown #8a5a35 /
 *   pale cut wood #c9a06a leaves (focal), pewter #9aa3ad ironwork (accent), dark reveal.
 * Materials: walnut frame (0.8), oak leaves (0.78), pale threshold (0.85), pewter (0.45,
 *   metalness 0.8), dark reveal (0.95).
 * Detail list: arch frame + posts + plinths + keystone (big); plank leaves with grooves,
 *   strap hinges with rivets, ring handles (medium); grain, worn threshold (small).
 * Rig/animation: none — a closed double door, a static building part.
 */

const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#7d5433');
const OAK = rgb('#b5814a');
const OAK_PLANK = rgb('#8a5a35');
const OAK_PALE = rgb('#c9a06a');
const OAK_DARK = rgb('#6e4526');
const PEWTER = rgb('#9aa3ad');
const PEWTER_DARK = rgb('#6e7681');
const PEWTER_LIGHT = rgb('#c3cad2');
const REVEAL = rgb('#241a12');

// ---------------------------------------------------------------- layout
const SPRING = 1.0; // arch spring line
const R_IN = 0.66; // clear opening half width (arch intrados)
const R_OUT = 0.8; // arch extrados; apex at SPRING + R_OUT = 1.8
const FRAME_D = 0.16;
const FRAME_FRONT = FRAME_D / 2; // 0.08

const LEAF_T = 0.06;
const LEAF_Z = -0.005; // leaf front at 0.025, recessed in the frame
const LEAF_FRONT = LEAF_Z + LEAF_T / 2;
const LEAF_OUT = 0.65; // leaf outer edge, 0.01 clear of the jamb
const GAP = 0.024; // centre seam between the leaves
const PLANK_W = 0.128; // vertical plank pitch

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const D2R = Math.PI / 180;

/** Half-annulus profile (0..180 deg) between ri and ro, local to the arch centre. */
const annulusProfile = (ri: number, ro: number, n = 30): ReturnType<typeof profile.polygon> => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([ro * Math.cos(a), ro * Math.sin(a)]);
  }
  for (let i = n; i >= 0; i--) {
    const a = (Math.PI * i) / n;
    pts.push([ri * Math.cos(a), ri * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

/** Wedge profile between radii ri..ro and angles a0..a1 (radians), for a keystone. */
const wedgeProfile = (ri: number, ro: number, a0: number, a1: number, n = 10): ReturnType<typeof profile.polygon> => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([ro * Math.cos(a), ro * Math.sin(a)]);
  }
  for (let i = n; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([ri * Math.cos(a), ri * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

/**
 * Right leaf outline in XY: rectangle from the centre seam (x = GAP/2) out to the jamb
 * (x = LEAF_OUT), with a quarter-round top on the arch (centre 0,SPRING, radius LEAF_OUT).
 */
const leafProfile = (): ReturnType<typeof profile.polygon> => {
  const pts: [number, number][] = [
    [GAP / 2, 0.02],
    [LEAF_OUT, 0.02],
    [LEAF_OUT, SPRING],
  ];
  const aEnd = Math.acos(GAP / 2 / LEAF_OUT);
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const a = (aEnd * i) / n;
    pts.push([LEAF_OUT * Math.cos(a), SPRING + LEAF_OUT * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

/** Full arched opening outline (reveal backing): rectangle r wide with a half-round top. */
const openingProfile = (): ReturnType<typeof profile.polygon> => {
  const pts: [number, number][] = [
    [-R_IN, 0],
    [R_IN, 0],
  ];
  const n = 20;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([R_IN * Math.cos(a), SPRING + R_IN * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

// ---------------------------------------------------------------- paints
const walnutPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const g = noise.fbm(x * 26, y * 7, z * 26, 3, 5);
  let c = mixRgb(WALNUT, WALNUT_DEEP, 0.45 + clamp01(-g) * 0.3);
  c = mixRgb(c, WALNUT_LIGHT, clamp01(g) * 0.08);
  c = mixRgb(c, WALNUT_DEEP, smoothstep(0.3, 0.02, y) * 0.35); // darker near the ground
  // Voussoir joints across the arch ring (15 deg offset: the seams flank the keystone).
  const r = Math.hypot(x, y - SPRING);
  if (y - SPRING > -0.03 && r > R_IN + 0.005 && r < R_OUT + 0.02) {
    const a = Math.atan2(y - SPRING, x) / D2R;
    const nearest = 15 + 30 * Math.round((a - 15) / 30);
    c = mixRgb(c, WALNUT_DEEP, smoothstep(0.022, 0.008, Math.abs(a - nearest) * D2R * r) * 0.6);
  }
  return c;
};

const leafPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const u = (Math.abs(x) + PLANK_W / 2) / PLANK_W;
  const f = u - Math.floor(u);
  const gap = smoothstep(0.1, 0.025, Math.min(f, 1 - f)); // 1 in a plank seam
  const i = Math.floor(u);
  const tint = noise.random(i, 9, 4);
  let c = mixRgb(OAK, OAK_PLANK, 0.1 + 0.34 * tint);
  c = mixRgb(c, OAK_PALE, 0.62 * Math.max(0, tint - 0.5)); // the pale planks
  const grain = noise.fbm(x * 40, y * 4, z * 40, 3, 8);
  c = mixRgb(c, OAK_DARK, clamp01(-grain) * 0.26);
  c = mixRgb(c, OAK_PALE, clamp01(grain) * 0.2);
  c = mixRgb(c, OAK_DARK, gap * 0.9);
  c = mixRgb(c, OAK_PLANK, smoothstep(0.3, 0.05, y) * 0.15); // worn bottom
  c = mixRgb(c, OAK_DARK, smoothstep(0.05, 0.015, Math.abs(x)) * 0.45); // centre seam shade
  return c;
};

const leafBump = (x: number, y: number, z: number): number => {
  const u = (Math.abs(x) + PLANK_W / 2) / PLANK_W;
  const f = u - Math.floor(u);
  const gap = smoothstep(0.1, 0.025, Math.min(f, 1 - f));
  return -0.0022 * gap + 0.0009 * noise.fbm(x * 50, y * 5, z * 50, 3, 12);
};

const sillPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const g = noise.fbm(x * 22, y * 10, z * 22, 3, 6);
  let c = mixRgb(OAK_PALE, OAK, clamp01(-g) * 0.25);
  c = mixRgb(c, OAK_DARK, smoothstep(0.02, 0.004, y) * 0.3); // worn ground edge
  return c;
};

const pewterPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = noise.fbm(x * 55, y * 55, z * 55, 2, 9);
  let c = mixRgb(PEWTER, PEWTER_DARK, clamp01(-n) * 0.4);
  c = mixRgb(c, PEWTER_LIGHT, clamp01(n) * 0.3);
  return c;
};

// ---------------------------------------------------------------- build
export default defineAsset({
  name: 'double-door',
  description:
    'Double wooden door in a rounded-top dark walnut frame: two honey-oak plank leaves with ' +
    'quarter-round tops under one round arch, pewter strap hinges with rivets, ring handles, ' +
    'a proud keystone with a stud, chunky plinths, and a pale worn threshold.',
  detail: 0.012,
  reference: 'docs/item-mockups/double-door-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ dark reveal
    // Behind the leaves, so the centre seam and the leaf clearance read as a deep slot.
    const reveal = sdf.extrude(openingProfile(), 0.04, 0.008).at(0, 0, -0.075);
    k.body('door-reveal', reveal, {
      color: REVEAL,
      roughness: 0.95,
      detail: 0.02,
      maxError: 0.008,
      maxTriangles: 200,
    });

    // ------------------------------------------------------------------ walnut frame
    const postX = (R_IN + R_OUT) / 2; // 0.73
    const post = sdf
      .box([R_OUT - R_IN, SPRING, FRAME_D], 0.02)
      .at(postX, SPRING / 2, 0)
      .mirror('x', 0);
    const plinth = sdf
      .box([0.18, 0.2, 0.22], 0.025)
      .at(0.71, 0.1, 0.01)
      .mirror('x', 0);
    const arch = sdf.extrude(annulusProfile(R_IN, R_OUT), FRAME_D, 0.015).at(0, SPRING, 0);
    const keystone = sdf
      .extrude(wedgeProfile(R_IN, 0.79, (90 - 15) * D2R, (90 + 15) * D2R), 0.22, 0.02)
      .at(0, SPRING, 0);
    const frame = sdf.union(post, plinth, arch, keystone);
    k.body('frame', frame.paintFn(walnutPaint), {
      color: WALNUT_DEEP,
      roughness: 0.8,
      detail: 0.012,
      maxError: 0.003,
      maxTriangles: 2200,
      paintWeight: 2,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 30, y * 8, z * 30, 3, 7),
    });

    // ------------------------------------------------------------------ pale threshold
    const threshold = sdf.box([2 * 0.62, 0.032, 0.22], 0.008).at(0, 0.016, 0.0);
    k.body('threshold', threshold.paintFn(sillPaint), {
      color: OAK_PALE,
      roughness: 0.85,
      detail: 0.008,
      maxError: 0.002,
      maxTriangles: 250,
      paintWeight: 1,
    });

    // ------------------------------------------------------------------ plank leaves
    const leaf = sdf.extrude(leafProfile(), LEAF_T, 0.012).at(0, 0, LEAF_Z).mirror('x', 0);
    k.body('door-leaves', leaf.paintFn(leafPaint), {
      color: OAK,
      roughness: 0.78,
      detail: 0.014,
      maxError: 0.006,
      maxTriangles: 1400,
      textureDensity: 2,
      paintWeight: 2,
      bump: leafBump,
    });

    // ------------------------------------------------------------------ pewter ironwork
    // Strap hinges: a barrel at the leaf's outer edge, an arrow-point strap reaching
    // inward, slightly tilted like the mock (upper tips rise toward the centre).
    const HINGE_X = LEAF_OUT;
    const STRAPS: { sy: number; tilt: number }[] = [
      { sy: 0.88, tilt: 12 },
      { sy: 0.44, tilt: -8 },
    ];
    const strapProfile = profile.polygon([
      [0, -0.05],
      [0.3, -0.04],
      [0.37, -0.02],
      [0.37, 0.02],
      [0.3, 0.04],
      [0, 0.05],
    ]);
    const hinges: Sdf[] = [];
    for (const { sy, tilt } of STRAPS) {
      const rot = 180 - tilt; // tip points inward (-X) for the right leaf
      const rad = rot * D2R;
      hinges.push(
        // mounting plate, the barrel, and the arrow strap
        sdf.box([0.11, 0.22, 0.024], 0.008).at(0.628, sy, LEAF_FRONT + 0.002),
        sdf.cylinder(0.026, 0.18, 0.006).at(HINGE_X, sy, 0.008),
        sdf
          .extrude(strapProfile, 0.02, 0.005)
          .rotateZ(rot)
          .at(HINGE_X, sy, LEAF_FRONT + 0.01),
      );
      for (const d of [0.12, 0.24]) {
        hinges.push(sdf.sphere(0.014).at(HINGE_X + d * Math.cos(rad), sy + d * Math.sin(rad), LEAF_FRONT + 0.024));
      }
    }
    // Dome stud on the keystone.
    hinges.push(sdf.sphere(0.034).at(0, SPRING + 0.725, 0.128));
    const hingeBody = sdf.union(...hinges).mirror('x', 0);
    k.body('iron-hinges', hingeBody.paintFn(pewterPaint), {
      color: PEWTER,
      roughness: 0.45,
      metalness: 0.8,
      detail: 0.008,
      maxError: 0.004,
      maxTriangles: 900,
      paintWeight: 1,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 50, y * 50, z * 50, 2, 11),
    });

    // Ring handle near the centre seam on each leaf.
    const boss = sdf.cylinder(0.028, 0.018).rotateX(90).at(0.09, 0.78, LEAF_FRONT + 0.009);
    const ring = sdf.torus(0.05, 0.013).rotateX(90).at(0.09, 0.78 - 0.062, LEAF_FRONT + 0.038);
    const handleBody = sdf.union(boss, ring).mirror('x', 0);
    k.body('iron-handles', handleBody.paintFn(pewterPaint), {
      color: PEWTER,
      roughness: 0.45,
      metalness: 0.8,
      detail: 0.006,
      maxError: 0.003,
      maxTriangles: 300,
      paintWeight: 1,
    });
  },
});
