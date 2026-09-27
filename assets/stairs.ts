import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note
 * Role: a dungeon stair flight the player climbs; a background/level prop that must read as
 *   stone steps plus a canon masonry wall at 128 px.
 * Size: 1.6 m wide (X), 2.0 m run along Z, about 1.2 m tall. Rises toward -Z, stands on y = 0.
 * One idea: five smooth pale-topped slabs climbing between two cheeks of the SAME chunky
 *   canon blocks as the dungeon wall. The masonry is the point; the steps stay calm.
 * Shape language: square/blocky masonry (sturdy) with deep rounded pillow bevels (friendly).
 * Palette (60/30/10): block face #4a5d75 dominant, joint navy #2a3547 secondary,
 *   worn top #7a8ba0 light, moss #3fae9a small accent at the base only.
 * Materials: stone cheeks and treads (roughness 0.9, metalness 0), moss crust (0.95).
 * Detail list: primary = two block courses on the cheeks; secondary = five tread slabs and
 *   the stepped cheek top; tertiary = 0.03 m joints, 0.04 m bevels, small moss clumps.
 * Focal point: the canon block face at the tall (back) end.
 * Rig / animation: none.
 */

// ------------------------------------------------------------------ canon masonry constants
const COURSE = 0.6; // exactly 2 courses per 1.2 m
const JOINT = 0.03; // recessed joint width
const BEVEL = 0.04; // deep rounded pillow bevel on every block
const FACE = rgb('#4a5d75'); // block face
const FACE_DARK = rgb('#3a4a5d');
const WALL_JOINT = rgb('#2a3547'); // deep navy joint / mortar
const WORN = rgb('#7a8ba0'); // worn pale top
const WORN_LIGHT = rgb('#a8b8ca'); // sun-bleached top rim
const JOINT_DARK = rgb('#1c2531'); // deep shadow in the joints and at the foot
const MOSS = rgb('#3fae9a');
const MOSS_DARK = rgb('#2f8a7b');

// ------------------------------------------------------------------ staircase dimensions
const W = 1.6; // full width across X
const HALF = W / 2; // 0.8, outer face of each cheek
const CHEEK_IN = 0.5; // inner face of each cheek (treads run between)
const PLATE_IN = 0.72; // mortar plate inner face (hidden inside the blocks)
const PLATE_OUT = 0.77; // mortar plate outer face, 0.03 behind the block face
const Z_BACK = -1.0; // top step back edge
const Z_FRONT = 1.0; // bottom step front edge
const NSTEP = 5;
const RISE = 0.18; // tread slab height
const TREAD = 0.4; // run per step

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Top of the step whose tread covers this z (0.18 at the front, 0.90 at the back). */
const stepTopAt = (z: number): number => {
  const i = Math.max(0, Math.min(NSTEP - 1, Math.round((Z_FRONT - z) / TREAD - 0.5)));
  return (i + 1) * RISE;
};

/**
 * Cheek top height at this z. The cheeks step in whole courses, so the top of every course
 * always lands on a 0.6 boundary: 1 course (0.6) over the three low steps, 2 courses (1.2)
 * over the two high steps. The tall end therefore shows exactly two block courses.
 */
const cheekTopAt = (z: number): number => (z < -0.2 ? 2 : 1) * COURSE;

/** Soft moss mask that clings to the base of the stone, strongest at the ground. */
const mossAt = (x: number, y: number, z: number, reach: number): number =>
  clamp01(smoothstep(reach, 0, y) * (0.45 + 0.55 * noise.fbm(x * 11, y * 11, z * 11, 2)));

export default defineAsset({
  name: 'stairs',
  description:
    'Five chunky stone steps rising between two canon-block masonry cheeks; worn pale treads and small teal moss at the base.',
  detail: 0.014,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ mortar core (navy)
    // A thin plate just inboard of the block faces. It is hidden inside the blocks and only
    // shows through the 0.03 m joints, giving the recessed deep-navy line of the canon wall.
    const plate = (y0: number, y1: number, z0: number, z1: number) =>
      sdf
        .box([PLATE_OUT - PLATE_IN, y1 - y0, z1 - z0], 0.012)
        .at((PLATE_IN + PLATE_OUT) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

    // The plate stays slightly inside every block surface (never flush) so the baked maps
    // never z-fight with a block face. Only the 0.03 m joints expose it.
    const core = sdf.union(
      plate(0, COURSE - JOINT / 2 - 0.01, Z_BACK + 0.02, Z_FRONT - 0.02), // bottom course backing
      plate(COURSE - JOINT / 2 - 0.01, COURSE + JOINT / 2 - 0.004, Z_BACK + 0.02, -0.19), // joint band
      plate(COURSE + JOINT / 2, 2 * COURSE - 0.01, Z_BACK + 0.02, -0.19), // top course backing
    );

    k.body('mortar', sdf.union(core, core.mirror('x', 0)), {
      color: WALL_JOINT,
      roughness: 0.92,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 260,
    });

    // ------------------------------------------------------------------ cheeks: two block courses
    // Block extents are explicit [z0, z1] so the run-end blocks are true half-blocks and the
    // joints sit between neighbours only. Bottom course spans the whole 2 m run; the top
    // course exists only over the tall end (z < -0.2), offset to stagger the vertical joints.
    const bottomZ: [number, number][] = [
      [-1.0, -0.565],
      [-0.535, -0.015],
      [0.015, 0.535],
      [0.565, 1.0],
    ];
    const topZ: [number, number][] = [
      [-1.0, -0.765],
      [-0.735, -0.2],
    ];

    const blockAt = (
      side: number,
      y0: number,
      y1: number,
      [z0, z1]: [number, number],
    ): sdf.Shape =>
      sdf
        .box([HALF - CHEEK_IN, y1 - y0, z1 - z0], BEVEL)
        .at(side * (HALF + CHEEK_IN) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

    const cheekBlocks: sdf.Shape[] = [];
    for (const side of [1, -1]) {
      for (const z of bottomZ) cheekBlocks.push(blockAt(side, 0, COURSE - JOINT / 2, z));
      for (const z of topZ) cheekBlocks.push(blockAt(side, COURSE + JOINT / 2, 2 * COURSE, z));
    }

    const cheeks = sdf.union(...cheekBlocks).paintFn((x, y, z, base): Rgb => {
      // Slight value variation per block, aligned to the block grid.
      const course = y < COURSE ? 0 : 1;
      const cellZ = course === 0 ? Math.floor((z + 1.0) / 0.55) : Math.floor((z + 1.0) / 0.5);
      const t = noise.random(course * 11 + cellZ, 4);
      // The upper course sits lighter and the lower course darker, as on the canon plate.
      let c = mixRgb(base, FACE_DARK, course === 0 ? 0.24 + 0.18 * t : 0.04 * t);
      if (course === 1) c = mixRgb(c, WORN, 0.22);
      // Worn pale tops: the flat top and upper bevel of every exposed block.
      const top = cheekTopAt(z);
      c = mixRgb(c, WORN, 0.85 * smoothstep(top - 0.11, top - 0.02, y));
      c = mixRgb(c, WORN_LIGHT, 0.6 * smoothstep(top - 0.035, top - 0.006, y));
      // Damp, dark stone at the base, with a little moss creeping up from the damp foot.
      const ground = smoothstep(0.28, 0.0, y);
      c = mixRgb(c, JOINT_DARK, 0.6 * ground);
      const moss = mossAt(x, y, z, 0.14);
      c = mixRgb(c, MOSS_DARK, 0.7 * moss);
      c = mixRgb(c, MOSS, 0.35 * moss * clamp01(0.4 + noise.fbm(x * 20, y * 20, z * 20, 2)));
      const mottling = noise.fbm(x * 7, y * 7, z * 7, 2);
      c = mixRgb(c, FACE_DARK, 0.12 * clamp01(-mottling));
      return c;
    });

    k.body('cheeks', cheeks, {
      color: FACE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.024,
      maxTriangles: 3200,
      textureDensity: 2,
    });

    // ------------------------------------------------------------------ treads (smooth slabs)
    const stepBoxes: sdf.Shape[] = [];
    for (let i = 0; i < NSTEP; i++) {
      const h = (i + 1) * RISE;
      const zc = Z_FRONT - (i + 0.5) * TREAD;
      stepBoxes.push(sdf.box([CHEEK_IN * 2 + 0.04, h, TREAD], 0.02).at(0, h / 2, zc));
    }
    const treads = sdf.union(...stepBoxes).paintFn((x, y, z, base): Rgb => {
      const h = stepTopAt(z);
      let c = base;
      // Pale worn walking surface with a sun-bleached nosing.
      c = mixRgb(c, WORN, 0.95 * smoothstep(h - 0.07, h - 0.008, y));
      c = mixRgb(c, WORN_LIGHT, 0.55 * smoothstep(h - 0.025, h - 0.004, y));
      // Darker toward the ground and in the corner against each cheek.
      c = mixRgb(c, JOINT_DARK, 0.5 * smoothstep(0.24, 0.0, y));
      const edge = smoothstep(0.36, 0.5, Math.abs(x));
      c = mixRgb(c, WALL_JOINT, 0.4 * edge);
      c = mixRgb(c, MOSS_DARK, 0.55 * mossAt(x, y, z, 0.09));
      const grain = noise.fbm(x * 12, y * 12, z * 12, 2);
      c = mixRgb(c, FACE_DARK, 0.12 * clamp01(grain));
      return c;
    });

    k.body('treads', treads, {
      color: FACE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.019,
      maxTriangles: 1050,
      textureDensity: 2,
    });

    // ------------------------------------------------------------------ moss at the base only
    // Small flattened clumps tucked against the foot of the cheeks and the bottom riser.
    // They sit low and hug the stone; never a blob on a tread or a top.
    const clumps: [number, number, number][] = [
      [HALF + 0.02, 0.72, 0.09],
      [HALF + 0.03, 0.16, 0.075],
      [HALF + 0.02, -0.4, 0.08],
      [-HALF - 0.02, 0.6, 0.085],
      [-HALF - 0.03, -0.02, 0.07],
      [-HALF - 0.02, -0.74, 0.08],
      [0.34, Z_FRONT + 0.015, 0.06],
      [-0.4, Z_FRONT + 0.01, 0.065],
    ];
    const moss = sdf
      .union(
        ...clumps.map(([mx, mz, r]) =>
          sdf.ellipsoid([r, r * 0.55, r * 0.85]).at(mx, r * 0.28, mz),
        ),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((_x, y, _z): Rgb =>
        mixRgb(MOSS_DARK, MOSS, clamp01(0.25 + y * 8 + 0.25 * noise.fbm(_x * 22, y * 22, _z * 22, 2))),
      );

    k.body('moss', moss, {
      color: MOSS,
      roughness: 0.95,
      metalness: 0,
      detail: 0.03,
      maxTriangles: 650,
      textureDensity: 0.5,
    });
  },
});
