import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Rgb, Sdf } from '../src/index.js';

/**
 * Design note
 * Role: dungeon wall segment with a wide arched opening; a modular kit piece for interiors.
 *   It must read as one canon-block arch at 128 px, at the same scale as the wall pieces.
 * Size: about 2.75 m wide (X), 2.4 m tall (Y, 4 canon courses), 0.45 m thick (Z), on y = 0.
 *   The opening is 1.0 m wide and 1.6 m tall to the inner crown. Faces +Z.
 * One idea: a heavy round arch of the SAME canon blocks as the wall around it, with one proud
 *   keystone and a deep slate shadow inside the opening.
 * Shape language: square canon blocks (sturdy) with deep rounded pillow bevels (hand-laid).
 * Palette (60/30/10): block face #4a5d75 dominant, worn tops #7a8ba0 secondary, joints and
 *   opening #2a3547 dark; teal moss #3fae9a is the small accent, at the base only.
 * Materials: one stone body (roughness 0.9, metalness 0), one slate body for the opening,
 *   one moss body (roughness 0.9).
 * Masonry canon: course 0.60, block 0.55 (half blocks at run ends), bevel 0.045, joint 0.03.
 * Detail list: primary = wall field + radial arch ring; secondary = voussoir joints, proud
 *   keystone; tertiary = worn tops, weathering, moss tufts. Focal point: the arch and its shadow.
 * Rig / animation: none.
 */

// ------------------------------------------------------------------ canon masonry
const CH = 0.6; // course height (exactly 2 courses per 1.2 m)
const BL = 0.55; // block length
const JOINT = 0.03; // recessed joint width
const BEVEL = 0.045; // deep rounded pillow bevel
const BULGE = 0.008; // how far the slightly convex block face bows out

const WX = 2.2; // wall width: half + 3 full + half blocks (about the 2 m batch module)
const WY = 2.4; // wall height: 4 courses
const T = 0.45; // wall thickness
const HW = WX / 2;
const COURSES = Math.round(WY / CH);
const NFULL = Math.floor(WX / BL + 1e-6); // 5
const HALF = (WX - (NFULL - 1) * BL) / 2; // 0.275
const SLAB_T = T - 0.04; // recessed joint bed, 0.02 behind the block faces each side

// ------------------------------------------------------------------ arch
const OPEN_HALF = 0.5; // opening half width (1.0 m wide)
const SPRING = 1.1; // arch centre height; inner crown sits at SPRING + OPEN_HALF = 1.6
const RING = 0.6; // ring radial thickness = one course height
const R_OUT = OPEN_HALF + RING; // 1.10
const R_MID = (OPEN_HALF + R_OUT) / 2;
const VOUSSOIRS = 5; // radial ring segments; the middle one is the keystone

// ------------------------------------------------------------------ palette
const FACE = rgb('#4a5d75');
const FACE_DARK = rgb('#35445a');
const FACE_LIGHT = rgb('#5b7292');
const WORN = rgb('#7a8ba0');
const SLATE = rgb('#2a3547');
const SLATE_DEEP = rgb('#20293a');
const MOSS = rgb('#3fae9a');
const MOSS_DARK = rgb('#2d7f73');
const MOSS_LIGHT = rgb('#63c9b5');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** 2D arc points around the arch centre (0, SPRING) at radius r, degrees. */
const arcAt = (r: number, a0: number, a1: number, n: number): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push([Math.cos(a) * r, SPRING + Math.sin(a) * r]);
  }
  return pts;
};

/** The void profile: a 1.0 m rectangle up to the springing, then a half round head. */
const keyholeProfile = (half: number, rHead: number, bot = -0.12) => {
  const pts: [number, number][] = [
    [-half, bot],
    [half, bot],
    [half, SPRING],
    [rHead, SPRING],
  ];
  pts.push(...arcAt(rHead, 0, 180, 40).slice(1));
  pts.push([-half, SPRING]);
  return profile.polygon(pts);
};

/** Upper half annulus between two radii, for the recessed ring backing. */
const ringBackProfile = (rIn: number, rOut: number) => {
  const pts: [number, number][] = [...arcAt(rOut, 0, 180, 40)];
  pts.push(...arcAt(rIn, 180, 0, 40));
  return profile.polygon(pts);
};

/** One radial voussoir wedge between two radii. */
const wedgeProfile = (a0: number, a1: number, rIn: number, rOut: number) => {
  const n = Math.max(6, Math.round(Math.abs(a1 - a0) / 5));
  const pts: [number, number][] = [...arcAt(rIn, a0, a1, n)];
  pts.push(...arcAt(rOut, a1, a0, n));
  return profile.polygon(pts);
};

/** Positive inside the opening, negative outside; used to darken the reveal. */
const openingField = (x: number, y: number) =>
  y <= SPRING ? OPEN_HALF - Math.abs(x) : OPEN_HALF - Math.hypot(x, y - SPRING);

export default defineAsset({
  name: 'arch',
  description:
    'Dungeon wall segment with a round arched opening: canon pillow-beveled stone blocks, a radial arch ring with a proud keystone, slate shadow inside the opening, and teal moss at the base.',
  detail: 0.022,
  texture: { size: 1024 },
  reference: 'docs/dungeon-mockups/masonry-canon.png',

  build(k) {
    // ---------------------------------------------------------------- wall field
    // Every piece is a canon block: a rounded box proud of a recessed joint bed, with a shallow
    // dome so the broad faces read slightly convex (a pillow).
    const blockAt = (cx: number, cy: number, len: number, h: number): Sdf =>
      sdf
        .box([len, h, T], BEVEL)
        .smoothUnion(
          0.05,
          sdf.ellipsoid([len / 2 - 0.03, h / 2 - 0.03, T / 2 + BULGE]),
        )
        .at(cx, cy, 0);

    const runsFor = (c: number): [number, number][] => {
      const runs: [number, number][] = [];
      let x = -HW;
      if (c % 2 === 1) {
        // Offset course: five full blocks, so the joints break the course below.
        for (let i = 0; i < NFULL; i++) {
          runs.push([x, x + BL]);
          x += BL;
        }
      } else {
        // Running course: half + four full + half.
        runs.push([x, x + HALF]);
        x += HALF;
        for (let i = 0; i < NFULL - 1; i++) {
          runs.push([x, x + BL]);
          x += BL;
        }
        runs.push([x, x + HALF]);
      }
      return runs;
    };

    const blocks: Sdf[] = [];
    for (let c = 0; c < COURSES; c++) {
      const y0 = c * CH + (c === 0 ? 0 : JOINT / 2);
      const y1 = (c + 1) * CH - (c === COURSES - 1 ? 0 : JOINT / 2);
      for (const [a, b] of runsFor(c)) {
        const x0 = Math.abs(a + HW) < 1e-9 ? a : a + JOINT / 2;
        const x1 = Math.abs(b - HW) < 1e-9 ? b : b - JOINT / 2;
        blocks.push(blockAt((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0));
      }
    }

    const slab = sdf.box([WX, WY, SLAB_T], 0.02).at(0, WY / 2, 0);
    const cutter = sdf.extrude(keyholeProfile(OPEN_HALF, R_OUT), T + 0.3);

    // ---------------------------------------------------------------- arch ring
    // Radial voussoirs of the same canon stone, with 0.03 m radial joints over a dark backing.
    const halfGap = (JOINT / 2 / R_MID) * (180 / Math.PI);
    const voussoirs: Sdf[] = [];
    for (let i = 0; i < VOUSSOIRS; i++) {
      // Segments run 0 deg (right springing) over the top to 180 deg (left springing).
      const a0 = (180 * i) / VOUSSOIRS + halfGap;
      const a1 = (180 * (i + 1)) / VOUSSOIRS - halfGap;
      const keystone = i === Math.floor(VOUSSOIRS / 2);
      const rOut = keystone ? R_OUT + 0.05 : R_OUT;
      const depth = keystone ? T + 0.09 : T;
      // Base wedge plus a smaller, deeper wedge: the broad faces read slightly convex, like the
      // wall blocks, so the ring never looks like smooth voussoirs.
      const base = sdf.extrude(wedgeProfile(a0, a1, OPEN_HALF + 0.004, rOut), depth, BEVEL);
      const dome = sdf.extrude(
        wedgeProfile(a0 + 0.9, a1 - 0.9, OPEN_HALF + 0.08, rOut - 0.08),
        depth + 2 * BULGE,
        BEVEL * 0.7,
      );
      voussoirs.push(base.smoothUnion(0.04, dome));
    }
    const ringBack = sdf.extrude(ringBackProfile(OPEN_HALF, R_OUT), SLAB_T, 0.02);

    // ---------------------------------------------------------------- stone (one body)
    const stone = sdf.union(slab, ...blocks).subtract(cutter).union(ringBack, ...voussoirs);

    const stonePaint = (x: number, y: number, z: number): Rgb => {
      // Broad weathering patches and fine speckle, then the canon value plan.
      const patch = 0.5 + 0.5 * noise.fbm(x * 3.1, y * 3.1, z * 3.1, 3);
      let c = mixRgb(FACE, FACE_DARK, 0.32 * patch);
      const spec = 0.5 + 0.5 * noise.noise3(x * 26, y * 26, z * 26);
      c = mixRgb(c, FACE_LIGHT, 0.13 * spec);
      // Worn tops: the upper edge of every course weathers pale; the foot of the wall sits in
      // shadow. This is the canon value plan (light tops, dark joints, darker base).
      const localY = ((y % CH) + CH) % CH;
      const worn = Math.max(
        smoothstep(CH - 0.2, CH - 0.02, localY),
        smoothstep(WY - 0.13, WY - 0.005, y),
      );
      c = mixRgb(c, WORN, 0.72 * worn);
      c = mixRgb(c, FACE_DARK, 0.14 * (1 - smoothstep(0.0, 1.3, y)));
      // Recessed joints and the shadowed flank of every pillow.
      const groove = smoothstep(0.24, 0.2, Math.abs(z));
      c = mixRgb(c, SLATE, 0.92 * groove);
      // The reveal around the opening falls into deep slate.
      const rim = clamp01(1 - Math.abs(openingField(x, y)) / 0.05);
      c = mixRgb(c, SLATE_DEEP, Math.max(rim, 0.4 * smoothstep(0.2, -0.2, z) * rim));
      // A few distinct moss tufts at the foot, never a gradient wash.
      const baseW = 1 - smoothstep(0.02, 0.3, y);
      const clumpField = 0.5 + 0.5 * noise.fbm(x * 9, y * 13, z * 9, 3);
      const moss = baseW * smoothstep(0.66, 0.86, clumpField);
      c = mixRgb(c, MOSS, 0.8 * moss);
      c = mixRgb(c, MOSS_DARK, 0.5 * moss * smoothstep(0.8, 0.96, clumpField));
      // Grime line at the very base.
      c = mixRgb(c, FACE_DARK, 0.3 * (1 - smoothstep(0.0, 0.1, y)));
      return c;
    };
    k.body('stone', stone.paintFn(stonePaint), {
      color: FACE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.022,
      maxError: 0.008,
      maxTriangles: 4400,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 20, y * 20, z * 20, 3),
    });

    // ---------------------------------------------------------------- opening shadow
    // A dark panel deep in the opening, so the arch reads as a passage in shadow.
    const back = sdf
      .extrude(keyholeProfile(OPEN_HALF - 0.004, OPEN_HALF - 0.004, 0.004), 0.08)
      .at(0, 0, -0.14);
    k.body('opening-shadow', back, {
      color: SLATE,
      roughness: 0.95,
      metalness: 0,
      detail: 0.035,
      maxTriangles: 260,
    });

    // ---------------------------------------------------------------- moss (base only)
    // Small, flat teal clumps hugging the foot; a few on each face plus one at each pier.
    const clumps: Sdf[] = [];
    const tuft = (x: number, y: number, z: number, s: number): Sdf =>
      sdf
        .ellipsoid([0.062 * s, 0.038 * s, 0.05 * s])
        .at(x, y, z)
        .intersect(sdf.halfSpace([0, -1, 0], 0));
    let seed = 0;
    const rnd = () => noise.random(seed++, 11, 5);
    for (let i = 0; i < 6; i++) {
      const s = 0.7 + 0.6 * rnd();
      const x = -0.95 + 0.38 * i + 0.12 * (rnd() - 0.5);
      clumps.push(tuft(x, 0.03 * s, T / 2 + BULGE - 0.01, s));
      clumps.push(tuft(x + 0.06, 0.024 * s, T / 2 + BULGE - 0.02, s * 0.7));
    }
    for (let i = 0; i < 5; i++) {
      const s = 0.7 + 0.6 * rnd();
      const x = -0.92 + 0.46 * i + 0.12 * (rnd() - 0.5);
      clumps.push(tuft(x, 0.03 * s, -(T / 2 + BULGE - 0.01), s));
    }
    clumps.push(tuft(-1.0, 0.03, 0.2, 1.1));
    clumps.push(tuft(1.02, 0.028, -0.14, 1.0));
    const moss = sdf.union(...clumps);
    k.body(
      'moss',
      moss.paintFn((x, y, z) => {
        const v = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
        return mixRgb(mixRgb(MOSS_DARK, MOSS, 0.5 + 0.5 * v), MOSS_LIGHT, 0.4 * smoothstep(0.03, 0.09, y));
      }),
      { color: MOSS, roughness: 0.9, metalness: 0, detail: 0.016, maxTriangles: 700 },
    );
  },
});
