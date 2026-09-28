import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Chibi round garden gazebo, 2.4 m wide and about 2.8 m tall
 * (catalog `architecture/structure/gazebo`).
 *
 * Role: hamlet centerpiece near the well; must read at 128 px. No rig, no clips.
 * Size: 2.6 m across the roof eave, ~2.9 m to the finial tip; stands on y = 0, entrance faces +Z.
 * One idea: six chunky honey-oak posts with stacked log rails circling a stone plinth, all under
 *   one big warm-brown paneled roof whose curled eave tips and iron finial break the silhouette.
 * Shape language: round and chunky (friendly); the pointed roof adds one triangular accent.
 * Palette (village): honey oak #b5814a posts, warm brown #8a5a35 rails, pale cut wood #c9a06a
 *   floor, dark walnut #6b4226 seams, warm stone #9a9082 base, iron #4a4f55 finial + lantern,
 *   leaf #5cb85c vine, amber lantern glow #ffb347.
 * Materials: stone base (0.9), pale plank floor (0.8), honey-oak posts + beam (0.8), warm-brown
 *   log rails (0.8), shingle roof (0.8), iron finial + lantern frame (0.5, metal 0.7), emissive
 *   lantern core (glow), leaf vine (0.8).
 * Detail list: (1) stone base + step, (2) plank floor, (3) six posts + plinths + ring beam,
 *   (4) log rails with the front span open, (5) paneled shingle roof + curled eave tips,
 *   (6) iron finial, (7) hanging lantern (focal glow), (8) small vine on one post.
 */

const POST_R = 0.92; // post circle radius
const POST_Y0 = 0.32; // floor top
const POST_Y1 = 1.88; // post top
const BASE_TOP = 0.22;
const FLOOR_TOP = 0.32;

const EAVE_R = 1.3;
const EAVE_Y = 1.98;
const APEX_Y = 2.68;
const SLOPE = Math.atan2(APEX_Y - EAVE_Y, EAVE_R - 0.02);
const SIN_SLOPE = Math.sin(SLOPE);

const C = {
  honey: rgb('#b5814a'),
  honeyDark: rgb('#96683a'),
  warm: rgb('#8a5a35'),
  warmDark: rgb('#6b4226'),
  pale: rgb('#c9a06a'),
  paleDark: rgb('#a37f4e'),
  walnut: rgb('#6b4226'),
  stone: rgb('#9a9082'),
  stoneDark: rgb('#6f6759'),
  mortar: rgb('#b8ac97'),
  iron: rgb('#4a4f55'),
  ironDark: rgb('#363a3f'),
  leaf: rgb('#5cb85c'),
  leafDark: rgb('#3d8a3f'),
  glowBase: rgb('#4a1405'),
  glow: rgb('#ffb347'),
};

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Position of a post: angle in degrees measured from +Z. */
const postPos = (deg: number, r = POST_R): [number, number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), 0, r * Math.cos(a)];
};

const stoneBump = (x: number, y: number, z: number) => {
  const { f1, f2 } = noise.worley(x * 7.5, y * 9, z * 7.5, 4);
  return -0.006 * (1 - sstep(0.05, 0.14, f2 - f1)) + 0.002 * noise.fbm(x * 20, y * 20, z * 20, 2);
};
const plankPaint =
  (base: Rgb, dark: Rgb, strength = 0.55) =>
  (x: number, y: number, z: number) => {
    const f = x / 0.19;
    const g = f - Math.floor(f);
    const groove = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * g), 3);
    const board = noise.random(Math.floor(f), 3);
    const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 6, z * 3, 2);
    let c = mixRgb(base, dark, 0.08 + 0.18 * board + 0.08 * grain);
    c = mixRgb(c, dark, strength * groove);
    return c;
  };

const TAU = Math.PI * 2;
const line = (v: number, p: number) => Math.pow(0.5 + 0.5 * Math.cos(TAU * v), p);

/** Roof paint: horizontal shingle rows down the slope plus 8 dark radial facet seams. */
const roofPaint = (x: number, y: number, z: number) => {
  const theta = Math.atan2(z, x);
  const facet = 1 - Math.abs(Math.cos(4 * theta)); // 0 at facet centre, 1 at facet seam
  const s = (APEX_Y - y) / SIN_SLOPE / 0.24;
  const row = Math.floor(s);
  const f = s - row;
  const seamRow = line(f, 3);
  const tint = noise.random(row, 11);
  let c = mixRgb(C.warm, C.honey, 0.16 + 0.3 * tint);
  c = mixRgb(c, C.walnut, 0.7 * seamRow);
  c = mixRgb(c, C.walnut, 0.65 * Math.pow(facet, 2));
  // Dark fascia band at the eave rim and a darker flat ceiling.
  c = mixRgb(c, C.walnut, sstep(0.2, 0.03, s));
  if (y < EAVE_Y - 0.18) c = mixRgb(c, C.warmDark, 0.55);
  return c;
};

const roofBump = (x: number, y: number, z: number) => {
  const theta = Math.atan2(z, x);
  const facet = 1 - Math.abs(Math.cos(4 * theta));
  const s = (APEX_Y - y) / SIN_SLOPE / 0.24;
  const f = s - Math.floor(s);
  const ramp = f < 0.85 ? f / 0.85 : (1 - f) / 0.15;
  return 0.01 * ramp - 0.005 * Math.pow(facet, 2) + 0.002 * noise.noise3(x * 24, y * 24, z * 24);
};

export default defineAsset({
  name: 'gazebo',
  description:
    'Round garden gazebo: six honey-oak posts with stacked log rails on a low round stone base, an open front entrance, a pointed paneled shingle roof with curled eave tips, an iron finial, and a glowing hanging lantern.',
  detail: 0.016,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/gazebo-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- stone base
    // Two stacked round steps plus the entrance step; simple cylinders keep the mesh light.
    const step = sdf.box([0.62, 0.09, 0.3], 0.03).at(0, 0.045, 1.32);
    const base = sdf
      .union(
        sdf.cylinder(1.24, 0.08, 0.025).at(0, 0.04, 0),
        sdf.cylinder(1.17, 0.16, 0.03).at(0, 0.14, 0),
        step,
      )
      .paintFn((x, y, z, baseColor) =>
        mixRgb(baseColor, C.stoneDark, 0.28 * (0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 3))),
      );
    k.body('base', base, { color: C.stone, roughness: 0.92, detail: 0.03, maxError: 0.01, bump: stoneBump });

    // ---------------------------------------------------------------- plank floor
    const floor = sdf
      .cylinder(1.14, FLOOR_TOP - BASE_TOP + 0.04, 0.02)
      .at(0, (FLOOR_TOP + BASE_TOP) / 2 + 0.01, 0)
      .paintFn(plankPaint(C.pale, C.paleDark));
    k.body('floor', floor, { color: C.pale, roughness: 0.8, detail: 0.03, maxError: 0.008 });

    // ---------------------------------------------------------------- posts + plinths + ring beam
    const postAngles = [30, 90, 150, 210, 270, 330];
    const postParts = postAngles.map((a) => {
      const [px, , pz] = postPos(a);
      return sdf
        .union(
          sdf.box([0.17, 0.18, 0.17], 0.03).at(px, POST_Y0 + 0.09, pz), // plinth
          sdf.cylinder(0.062, POST_Y1 - POST_Y0 - 0.14, 0.025).at(px, (POST_Y1 + POST_Y0 + 0.12) / 2, pz), // shaft
          sdf.sphere(0.075).at(px, POST_Y1 - 0.02, pz), // rounded top into the beam
        );
    });
    const beam = sdf.torus(POST_R, 0.055).at(0, POST_Y1 - 0.03, 0);
    const posts = sdf
      .union(...postParts, beam)
      .paintFn((x, y, z, baseColor) => {
        // Pale honey oak with a soft vertical grain; plinths darker like the mockup.
        const grain = 0.5 + 0.5 * noise.fbm(x * 18, y * 2.5, z * 18, 2);
        let c = mixRgb(baseColor, C.honeyDark, 0.1 + 0.14 * grain);
        c = mixRgb(c, C.warmDark, 0.35 * sstep(0.52, 0.4, y));
        return c;
      });
    k.body('posts', posts, {
      color: C.honey,
      roughness: 0.8,
      detail: 0.016,
      maxError: 0.006,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 24, y * 4, z * 24, 2),
    });

    // ---------------------------------------------------------------- log rails (front span open)
    const railSpans: [number, number][] = [
      [30, 90],
      [90, 150],
      [150, 210],
      [210, 270],
      [270, 330],
    ];
    const railYs = [0.52, 0.68, 0.84];
    const rails = sdf.union(
      ...railSpans.flatMap(([a0, a1]) => {
        const [x0, , z0] = postPos(a0, POST_R * 0.99);
        const [x1, , z1] = postPos(a1, POST_R * 0.99);
        return railYs.map((ry) =>
          sdf
            .capsule([x0, ry, z0], [x1, ry, z1], 0.04)
            .paint(mixRgb(C.warm, C.warmDark, 0.25 * noise.random(a0 + ry * 100, 5))),
        );
      }),
    );
    k.body('rails', rails, {
      color: C.warm,
      roughness: 0.8,
      detail: 0.014,
      maxError: 0.006,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 20, y * 8, z * 20, 2),
    });

    // ---------------------------------------------------------------- paneled shingle roof
    const roofProfile = profile.polygon([
      [0, 1.74],
      [1.22, 1.74],
      [EAVE_R, EAVE_Y],
      [0.02, APEX_Y],
      [0, APEX_Y],
    ]);
    // Eight gentle facets carved along radial seams; tiny amplitude keeps triangles low.
    const roofCore = sdf.revolve(roofProfile).displace(0.02, (x, y, z) => {
      const r = Math.hypot(x, z);
      const facet = 1 - Math.abs(Math.cos(4 * Math.atan2(z, x)));
      return -Math.pow(facet, 1.5) * Math.min(1, r / 0.35);
    });
    // Curled eave tips at the eight roof corners, like the mockup.
    const tips = sdf.union(
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 + 22.5) * (Math.PI / 180);
        return sdf.cone(
          [Math.sin(a) * (EAVE_R - 0.02), EAVE_Y + 0.01, Math.cos(a) * (EAVE_R - 0.02)],
          [Math.sin(a) * (EAVE_R + 0.13), EAVE_Y + 0.14, Math.cos(a) * (EAVE_R + 0.13)],
          0.05,
          0.006,
        );
      }),
    );
    k.body('roof', sdf.union(roofCore, tips).paintFn(roofPaint), {
      color: C.warm,
      roughness: 0.8,
      detail: 0.024,
      maxError: 0.01,
      textureDensity: 2,
      bump: roofBump,
    });

    // ---------------------------------------------------------------- iron finial
    const finial = sdf.union(
      sdf.cylinder(0.07, 0.05, 0.015).at(0, APEX_Y + 0.01, 0),
      sdf.sphere(0.05).at(0, APEX_Y + 0.08, 0),
      sdf.cone([0, APEX_Y + 0.1, 0], [0, APEX_Y + 0.24, 0], 0.028, 0.004),
      sdf.sphere(0.016).at(0, APEX_Y + 0.26, 0),
    );
    k.body('finial', finial, { color: C.iron, roughness: 0.5, metalness: 0.7, detail: 0.008, maxError: 0.004 });

    // ---------------------------------------------------------------- hanging lantern (focal glow)
    const lanternFrame = sdf.union(
      sdf.capsule([0, 1.74, 0], [0, 1.6, 0], 0.012),
      sdf.cone([0, 1.52, 0], [0, 1.6, 0], 0.075, 0.03),
      sdf.cylinder(0.05, 0.03, 0.01).at(0, 1.37, 0),
      sdf.sphere(0.02).at(0, 1.34, 0),
    );
    k.body('lantern-frame', lanternFrame, {
      color: C.ironDark,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      maxError: 0.004,
    });
    const lanternGlow = sdf.cylinder(0.052, 0.11, 0.015).at(0, 1.45, 0);
    k.body('lantern-glow', lanternGlow, {
      color: C.glowBase,
      roughness: 0.2,
      emissive: rgb('#ff9a2e'),
      emissiveIntensity: 2.3,
      detail: 0.008,
      maxError: 0.004,
    });

    // ---------------------------------------------------------------- small vine on the back-left post
    const [vx, , vz] = postPos(150);
    const vinePts: [number, number, number, number][] = [];
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      const a = t * Math.PI * 2.2 + 0.6;
      vinePts.push([vx + Math.cos(a) * 0.075, 0.55 + t * 0.95, vz + Math.sin(a) * 0.075, 0.018]);
    }
    const vine = sdf
      .chain(vinePts, 0.012)
      .union(
        sdf.ellipsoid([0.045, 0.02, 0.03]).at(vx + 0.1, 0.9, vz + 0.02),
        sdf.ellipsoid([0.04, 0.018, 0.028]).at(vx - 0.02, 1.2, vz - 0.1),
        sdf.ellipsoid([0.042, 0.02, 0.03]).at(vx - 0.09, 1.42, vz + 0.05),
      )
      .paintFn((x, y, z, baseColor) => mixRgb(baseColor, C.leafDark, 0.35 + 0.25 * noise.fbm(x * 30, y * 30, z * 30, 2)));
    k.body('vine', vine, { color: C.leaf, roughness: 0.8, detail: 0.009, maxError: 0.004 });
  },
});
