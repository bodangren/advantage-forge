import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — round tavern table (catalog `props/furniture/round-table`).
 *
 * Role: the main table of the tavern set; a furniture prop that must read as "round disc
 *   on a stout pedestal" at 128 px. No rig, no animation.
 * Size: 1.05 m across the top, 0.6 m tall, stands on y = 0, faces +Z.
 * One idea: a thick honey-oak disc carried by a heavy turned pedestal that splays into
 *   three chunky feet — the top is twice as wide as the base is tall.
 * Shape language: round dominant (disc, turned bulges, rounded toes); the tripod splay is
 *   the sturdy secondary read from the front and side.
 * Palette: honey oak #b5814a top (mid), warm brown #8a5a35 pedestal (dark),
 *   pale cut wood #c9a06a rim wear (light accent).
 * Materials: wood — top roughness 0.78, pedestal roughness 0.84, metalness 0.
 * Detail: primary disc, turned column, three feet; secondary beveled rim, three bulges,
 *   apron flare; tertiary plank seams, rim wear, one cup-ring stain, grain bump.
 * Rig/animation: none.
 */

const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const SHADE = rgb('#4a2c16');

const TOP_R = 0.525; // 1.05 m across
const PLANK = 0.18; // plank pitch across the round top

/** Hermite smoothstep; also usable with a > b to make a downward step. */
const ss = (a: number, b: number, v: number): number => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Dark plank seam lines running along X. */
const seam = (z: number): number => {
  const f = z / PLANK - Math.floor(z / PLANK);
  return Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 10);
};

export default defineAsset({
  name: 'round-table',
  description: 'Round tavern table: a thick honey-oak top on a turned pedestal with three splayed feet.',
  detail: 0.008,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',

  build(k) {
    // ------------------------------------------------------------------- top
    // One thick disc with a soft 25 mm bevel on both rims; flat top at y = 0.6.
    const top = sdf.cylinder(TOP_R, 0.07, 0.025).at(0, 0.565, 0);

    const topPainted = top.paintFn((x, y, z) => {
      const r = Math.hypot(x, z);
      const plank = Math.floor((z + 3) / PLANK);
      const tint = noise.random(plank, 4, 9);
      const grain = noise.fbm(x * 3, y * 6, z * 36, 2);
      let c = mixRgb(OAK, PALE, 0.05 + 0.15 * tint + 0.08 * grain);
      c = mixRgb(c, SHADE, 0.6 * seam(z));
      // Pale cut wood where the rim is handled and knocked.
      const wear = ss(0.475, 0.515, r) * ss(0.546, 0.564, y);
      const patch = 0.55 + 0.45 * (0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 2));
      c = mixRgb(c, PALE, 0.7 * wear * patch);
      // The underside sits in the pedestal's shadow.
      c = mixRgb(c, SHADE, 0.45 * ss(0.556, 0.536, y));
      // One faint cup ring: a tavern has been here.
      const ring = Math.max(0, 1 - Math.abs(Math.hypot(x - 0.17, z - 0.12) - 0.052) / 0.013);
      c = mixRgb(c, SHADE, 0.4 * ring * ss(0.578, 0.59, y));
      return c;
    });

    k.body('top', topPainted, {
      color: '#b5814a',
      roughness: 0.78,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxTriangles: 2200,
      bump: (x, y, z) => -0.0022 * seam(z) + 0.0011 * noise.fbm(x * 3, y * 8, z * 34, 2),
    });

    // -------------------------------------------------------------- pedestal
    // Turned column: a grounded base boss, three chunky bulges, a trumpet apron
    // that reaches into the underside of the top.
    const columnProfile = profile.polygon(
      [
        [0.0, 0.0],
        [0.115, 0.0],
        [0.14, 0.035],
        [0.126, 0.075],
        [0.1, 0.105],
        [0.135, 0.15],
        [0.14, 0.19],
        [0.1, 0.245],
        [0.13, 0.29],
        [0.128, 0.33],
        [0.095, 0.38],
        [0.122, 0.425],
        [0.115, 0.455],
        [0.15, 0.49],
        [0.21, 0.548],
        [0.0, 0.548],
      ],
      { smooth: true, samples: 7 },
    );
    const column = sdf.revolve(columnProfile);

    // One splayed foot, built along +Z from inside the column down to a flat toe.
    const foot = sdf.chain(
      [
        [0, 0.2, -0.02, 0.072],
        [0, 0.14, 0.08, 0.07],
        [0, 0.08, 0.19, 0.066],
        [0, 0.05, 0.25, 0.072],
      ],
      0.02,
    );
    const feet = sdf.union(foot, foot.rotateY(120), foot.rotateY(240));

    const pedestal = column.smoothUnion(0.03, feet).intersect(sdf.halfSpace([0, -1, 0], 0));

    const pedestalPainted = pedestal.paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 7, y * 3, z * 7, 3);
      let c = mixRgb(BROWN, PALE, 0.05 + 0.12 * grain);
      c = mixRgb(c, SHADE, 0.32 * (1 - ss(0.0, 0.26, y)));
      c = mixRgb(c, PALE, 0.14 * ss(0.46, 0.54, y));
      return c;
    });

    k.body('pedestal', pedestalPainted, {
      color: '#8a5a35',
      roughness: 0.84,
      metalness: 0,
      detail: 0.01,
      paintWeight: 2,
      maxTriangles: 3300,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 14, y * 5, z * 14, 2),
    });
  },
});
