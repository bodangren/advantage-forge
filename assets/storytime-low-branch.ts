import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 low tree branch, a class A story-page prop.
 * Role: the low branch that holds the nest on `story-page-a-nest` and
 *   `story-page-a-nest-and-a-nut`. The nest is a separate asset. It is not here.
 * Size: a young garden tree about 1.65 m tall. The trunk is one smooth taper,
 *   0.16 m thick at the base, and it sinks into the ground with short roots.
 * One thick branch leaves the trunk toward +X. It dips, then splits into a long
 *   outer twig and a short twig that rises at the back. The nest sits in that fork.
 * Nan: her eyes sit near y = 0.585 m. She points up. The seat is a little above them.
 * Nest seat: `NEST_SEAT` below. Place the `storytime-nest` origin there.
 *   The nest is about 0.18 m across and 0.07 m tall. The fork crotch fits that nest.
 * One idea: a stout soft trunk, a round leaf crown, and one low open fork.
 * Shape language: soft rounds. Leaf clusters are fat blobs, not single leaves.
 * Palette: bark #a86b45, bark dark #6e432c, leaf #43a047, leaf light #8ede6a.
 * Materials: matte bark with a soft bump, matte leaves.
 * Detail: the branch and the open seat sit on +X. The fork front (+Z) stays open.
 *   Leaf clusters sit above and behind the fork, never on the twig tips by the seat.
 * Rig/animation: none. No text, letter, number, logo, face, or carved mark.
 */

/**
 * Place the storytime-nest origin at this point (meters, this asset's space).
 * The nest stands on y = 0 in its own file, so this y is the nest bottom.
 * Nan's eyes are near y = 0.585 m. This seat is a little above them.
 * The saddle top sits at y = 0.70 m, so the nest rests on the wood.
 */
export const NEST_SEAT = { x: 0.5, y: 0.7, z: 0.04 } as const;

const BARK = rgb('#a86b45');
const BARK_DARK = rgb('#6e432c');
const LEAF = rgb('#43a047');
const LEAF_LIGHT = rgb('#8ede6a');
const LEAF_DARK = rgb('#2f7a36');

const blob = (x: number, y: number, z: number, r: number) => sdf.sphere(r).at(x, y, z);

export default defineAsset({
  name: 'storytime-low-branch',
  description:
    'A young garden tree with one low thick branch. The branch splits into a long twig and a short twig, and the fork holds a nest.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // One cone. A chain of cones leaves blend beads that read as bamboo.
    const trunk = sdf.cone([0, 0, 0], [0, 1.18, 0], 0.082, 0.046);
    // Four low roots of different sizes. They sink below y = 0, so the ground cut
    // gives a soft step. No wide flat lid, so the base cannot read as a stand.
    const roots = sdf.smoothUnion(
      0.022,
      sdf.ellipsoid([0.088, 0.032, 0.062]).at(0.07, 0.001, 0.01),
      sdf.ellipsoid([0.054, 0.024, 0.05]).at(-0.062, 0.001, 0.078),
      sdf.ellipsoid([0.042, 0.021, 0.036]).at(-0.03, 0.001, -0.094),
      sdf.ellipsoid([0.03, 0.016, 0.028]).at(-0.092, 0.001, -0.03),
    );

    // Thick at the trunk, a clear taper, and a soft rise toward the fork on +X.
    const branch = sdf.smoothUnion(
      0.012,
      sdf.cone([0.02, 0.735, 0], [0.28, 0.712, 0.012], 0.055, 0.042),
      sdf.cone([0.28, 0.712, 0.012], [0.46, 0.688, 0.024], 0.042, 0.032),
    );
    // A rounded mound under the nest. Its top is y = 0.704 m, so the nest rests on wood.
    const saddle = sdf.ellipsoid([0.075, 0.032, 0.07]).at(NEST_SEAT.x, 0.672, NEST_SEAT.z);

    // The split. The long twig leaves the crotch toward +X and back, and it climbs.
    // Every point of it stays outside the nest footprint, so it never crosses the nest.
    const twigOuter = sdf.chain(
      [
        [0.46, 0.688, 0.02, 0.03],
        [0.58, 0.72, -0.062, 0.023],
        [0.68, 0.77, -0.132, 0.017],
        [0.76, 0.812, -0.182, 0.011],
      ],
      0.016,
    );
    // The short twig leaves the back of the crotch and climbs steeply. It is shorter,
    // steeper, and further back than the long twig. Neither twig ends in a round cap.
    const twigBack = sdf.chain(
      [
        [0.38, 0.698, -0.02, 0.032],
        [0.39, 0.765, -0.086, 0.022],
        [0.396, 0.812, -0.12, 0.013],
      ],
      0.016,
    );

    const wood = sdf
      .smoothUnion(0.03, trunk, roots, branch, saddle, twigOuter, twigBack)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z, base) => {
        // Soft bark patches. The frequency stays low so no mark or letter forms.
        const n = 0.5 + 0.5 * noise.fbm(x * 3.2, y * 1.4, z * 3.2, 2);
        return mixRgb(base, BARK_DARK, 0.05 + n * 0.2);
      });
    k.body('bark', wood, {
      color: BARK,
      roughness: 0.86,
      detail: 0.008,
      maxTriangles: 24000,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 6, y * 2.2, z * 6, 2),
    });

    // A round crown of several soft blobs, about 0.75 m across. Not a cone.
    const crown = sdf.smoothUnion(
      0.06,
      blob(0, 1.36, 0, 0.24),
      blob(-0.22, 1.26, 0.08, 0.17),
      blob(0.2, 1.24, -0.1, 0.16),
      blob(0.06, 1.52, 0.04, 0.14),
      blob(-0.08, 1.16, -0.14, 0.14),
      blob(0.16, 1.4, 0.16, 0.12),
      blob(-0.16, 1.44, -0.05, 0.12),
      blob(0.02, 1.1, 0.08, 0.13),
    );
    // A joined arc of leaf clusters from the back twig, over the fork, to the outer twig.
    // Each cluster touches its neighbour and the twig, so no leaf floats.
    // The arc stays behind the nest (z below -0.14) and above the rim, so the seat stays open.
    const leavesFork = sdf.smoothUnion(
      0.05,
      blob(0.4, 0.88, -0.15, 0.075),
      blob(0.47, 0.945, -0.185, 0.075),
      blob(0.57, 0.985, -0.205, 0.07),
      blob(0.67, 0.95, -0.235, 0.065),
      blob(0.755, 0.875, -0.21, 0.068),
      // Three small blobs break the outline, so the arc is not a smooth tube.
      blob(0.43, 0.83, -0.215, 0.045),
      blob(0.62, 1.03, -0.245, 0.045),
      blob(0.7, 0.99, -0.275, 0.04),
    );
    const leaves = sdf.union(crown, leavesFork).paintFn((x, y, z, base) => {
        const up = Math.min(1, Math.max(0, (y - 0.8) / 0.6));
        const n = 0.5 + 0.5 * noise.fbm(x * 1.6, y * 1.6, z * 1.6, 2);
        let c = mixRgb(base, LEAF_LIGHT, up * 0.32 + n * 0.05);
        const under = Math.min(1, Math.max(0, (1.22 - y) / 0.35));
        c = mixRgb(c, LEAF_DARK, under * 0.18);
        return c;
      });
    k.body('leaves', leaves, {
      color: LEAF,
      roughness: 0.72,
      detail: 0.012,
      maxTriangles: 18000,
    });
  },
});
