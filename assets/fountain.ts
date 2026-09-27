import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Round village fountain, 1.8 m wide, about 1.2 m tall (catalog `architecture/structure/fountain`).
 *
 * Role: hamlet landmark on the village map; must read at 128 px. No rig, no clips.
 * Size: 1.8 m diameter basin, 0.45 m tall basin wall; upper bowl rim at ~1.16 m. Stands on
 *   y = 0, centered on the Y axis, streams spilling toward +Z and around.
 * One idea: a chunky stacked-stone fountain with calm teal water in two bowls and little
 *   streams spilling from the upper bowl into the big basin.
 * Shape language: round dominant (revolved basin, pebble column, bowl); one broad low mass
 *   under a small high bowl for a clear big/small rhythm.
 * Palette: warm gray stone #8a8a82 (dominant), mortar #55554e, teal water #3fa8c8 (accent),
 *   leaf green #5cb85c (small accent), pale rim light #9b9b93.
 * Materials: stone (roughness 0.9, worley cells + mortar), water (roughness 0.05), grass
 *   (roughness 0.8).
 * Detail list: (1) revolved basin with bulged rim, (2) pebble-stack column, (3) small upper
 *   bowl + finial knob, (4) water discs in both bowls, (5) three spill streams + splashes,
 *   (6) grass tufts + pebbles at the base. Focal point: the teal water.
 */

const C = {
  stone: rgb('#8a8a82'),
  stoneDark: rgb('#6d6d65'),
  mortar: rgb('#55554e'),
  rim: rgb('#9b9b93'),
  water: rgb('#3fa8c8'),
  grass: rgb('#5cb85c'),
  grassDark: rgb('#3f8a3f'),
};

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Warm stone paint: worley block cells, mortar where cells touch, a damp dark base, a pale rim band. */
const stonePaint = (x: number, y: number, z: number) => {
  const { f1, f2, id } = noise.worley(x * 4.2, y * 5, z * 4.2, 4);
  const gap = sstep(0.06, 0.18, f2 - f1);
  const tint = noise.random(id, 7);
  let c = mixRgb(C.stone, C.stoneDark, 0.15 + 0.45 * tint);
  c = mixRgb(c, C.mortar, 0.85 * (1 - gap));
  // Pale worn rim band on the basin lip.
  const r = Math.hypot(x, z);
  const rimLight = sstep(0.74, 0.82, r) * sstep(0.4, 0.46, y) * (1 - sstep(0.47, 0.5, y));
  c = mixRgb(c, C.rim, 0.45 * rimLight);
  // Slightly damp dark base.
  c = mixRgb(c, C.stoneDark, 0.22 * (1 - sstep(0.03, 0.12, y)));
  return c;
};

const stoneBump = (x: number, y: number, z: number) => {
  const { f1, f2 } = noise.worley(x * 4.2, y * 5, z * 4.2, 4);
  return -0.009 * (1 - sstep(0.06, 0.18, f2 - f1)) + 0.0025 * noise.fbm(x * 18, y * 18, z * 18, 2);
};

/** One water stream: a smooth chain from the upper bowl lip down to the basin water. */
const stream = (dx: number, dz: number) =>
  sdf.chain(
    [
      [dx * 0.3, 1.12, dz * 0.3, 0.028],
      [dx * 0.355, 0.92, dz * 0.355, 0.024],
      [dx * 0.395, 0.62, dz * 0.395, 0.023],
      [dx * 0.415, 0.38, dz * 0.415, 0.03],
    ],
    0.03,
  );

export default defineAsset({
  name: 'fountain',
  description:
    'Round village fountain: chunky warm-gray stone basin with a rounded rim, a stacked-pebble column, a small upper bowl spilling teal streams into calm water in both bowls, with grass tufts at the base.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/fountain-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- stone
    // Basin: revolved annulus — interior floor, inner wall, bulged rim, outer wall to ground.
    const basinProfile = profile.polygon(
      [
        [0.0, 0.29],
        [0.654, 0.29],
        [0.693, 0.31],
        [0.717, 0.38],
        [0.746, 0.44],
        [0.818, 0.475],
        [0.885, 0.455],
        [0.9, 0.385],
        [0.866, 0.3],
        [0.856, 0.14],
        [0.823, 0.04],
        [0.75, 0.0],
        [0.0, 0.0],
      ],
      { smooth: true },
    );
    const basin = sdf.revolve(basinProfile);

    // Column: stacked rounded pebbles rising from the basin floor.
    const columnProfile = profile.polygon(
      [
        [0.0, 0.1],
        [0.16, 0.11],
        [0.185, 0.16],
        [0.15, 0.24],
        [0.125, 0.3],
        [0.155, 0.42],
        [0.135, 0.52],
        [0.115, 0.58],
        [0.15, 0.7],
        [0.125, 0.8],
        [0.11, 0.88],
        [0.135, 0.95],
        [0.1, 0.99],
        [0.0, 1.0],
      ],
      { smooth: true },
    );
    const column = sdf.revolve(columnProfile);

    // Upper bowl: small revolved bowl with a rolled rim, sitting on the column.
    const bowlProfile = profile.polygon(
      [
        [0.0, 0.93],
        [0.1, 0.94],
        [0.17, 0.965],
        [0.25, 1.01],
        [0.305, 1.07],
        [0.33, 1.125],
        [0.325, 1.16],
        [0.285, 1.155],
        [0.24, 1.1],
        [0.185, 1.055],
        [0.1, 1.035],
        [0.0, 1.03],
      ],
      { smooth: true },
    );
    const upperBowl = sdf.revolve(bowlProfile);

    // Finial knob poking out of the upper water.
    const finial = sdf.sphere(0.05).at(0, 1.13, 0);

    // Two small pebbles resting against the basin foot.
    const pebbles = sdf.union(
      sdf.ellipsoid([0.075, 0.05, 0.06]).at(0.66, 0.035, 0.56),
      sdf.ellipsoid([0.055, 0.04, 0.05]).at(-0.7, 0.028, 0.44),
    );

    // Clip the smoothed bottom edge so the fountain stands exactly on y = 0.
    const stoneShape = sdf
      .union(basin, column, upperBowl, finial, pebbles)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    k.body('stone', stoneShape, {
      color: C.stone,
      roughness: 0.9,
      detail: 0.02,
      maxError: 0.008,
      paintFn: stonePaint,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- water
    const basinWater = sdf.cylinder(0.69, 0.03).at(0, 0.325, 0);
    const bowlWater = sdf.cylinder(0.215, 0.03).at(0, 1.075, 0);
    const a0 = Math.PI / 2; // +Z front
    const dirs: [number, number][] = [
      [Math.cos(a0), Math.sin(a0)],
      [Math.cos(a0 + 2.1), Math.sin(a0 + 2.1)],
      [Math.cos(a0 - 2.1), Math.sin(a0 - 2.1)],
    ];
    const streams = sdf.union(
      ...dirs.map(([dx, dz]) => stream(dx, dz)),
      // Small splash blobs where the streams land.
      ...dirs.map(([dx, dz]) =>
        sdf.ellipsoid([0.055, 0.02, 0.055]).at(dx * 0.42, 0.345, dz * 0.42),
      ),
    );
    k.body('water', sdf.union(basinWater, bowlWater), {
      color: C.water,
      roughness: 0.05,
      emissive: C.water,
      emissiveIntensity: 0.22,
      detail: 0.02,
      maxError: 0.02,
    });
    k.body('streams', streams, {
      color: C.water,
      roughness: 0.05,
      emissive: C.water,
      emissiveIntensity: 0.22,
      detail: 0.018,
      maxError: 0.008,
    });

    // ---------------------------------------------------------------- grass tufts
    const blade = (ox: number, oz: number, tx: number, tz: number, h: number, r: number) =>
      sdf.cone([ox, 0, oz], [tx, h, tz], r, 0.004);
    const tuft = (x: number, z: number, s: number) =>
      sdf
        .union(
          blade(0, 0, 0.0 * s, 0.02 * s, 0.15 * s, 0.016 * s),
          blade(0.03 * s, 0.01 * s, 0.08 * s, 0.05 * s, 0.12 * s, 0.013 * s),
          blade(-0.03 * s, -0.01 * s, -0.07 * s, -0.04 * s, 0.13 * s, 0.013 * s),
        )
        .at(x, 0, z)
        .paintFn((gx, gy, gz, base) => mixRgb(base, C.grassDark, 0.4 * (1 - sstep(0.02, 0.14, gy))));
    k.body('grass', sdf.union(tuft(0.56, 0.6, 1.0), tuft(-0.58, 0.48, 0.85)), {
      color: C.grass,
      roughness: 0.8,
      detail: 0.008,
      maxError: 0.004,
    });
  },
});
