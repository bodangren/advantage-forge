import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 low tree branch, a class A story-page prop.
 * Role: the low branch that holds the nest on `story-page-a-nest` and
 *   `story-page-a-nest-and-a-nut`. The nest is a separate asset. It is not here.
 * Size: a young garden tree about 1.65 m tall. The trunk is one smooth taper,
 *   0.16 m thick at the base. One thick branch leaves the trunk toward +X.
 * Nan: her eyes sit near y = 0.585 m. She points up. The seat is a little above them.
 * Nest seat: `NEST_SEAT` below. Place the `storytime-nest` origin there.
 *   The nest is about 0.18 m across and 0.07 m tall. The open saddle fits that nest.
 * One idea: a stout soft trunk, a round leaf crown, and one low open fork.
 * Shape language: soft rounds. Leaf clusters are fat blobs, not single leaves.
 * Palette: bark #a86b45, bark dark #6e432c, leaf #43a047, leaf light #8ede6a.
 * Materials: matte bark with a soft bump, matte leaves.
 * Detail: the branch and the open seat sit on +X. No pale band at the base.
 * Rig/animation: none. No text, letter, number, logo, face, or carved mark.
 */

/**
 * Place the storytime-nest origin at this point (meters, this asset's space).
 * The nest stands on y = 0 in its own file, so this y is the nest bottom.
 * Nan's eyes are near y = 0.585 m. This seat is a little above them.
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
    'A young garden tree with one low thick branch. The branch ends in an open fork that holds a nest.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // One cone. A chain of cones leaves blend beads that read as bamboo.
    const trunk = sdf.cone([0, 0, 0], [0, 1.18, 0], 0.08, 0.046);
    // A soft root flare in the same bark color. No pale band, so the base is not a sock.
    const flare = sdf.ellipsoid([0.13, 0.04, 0.12]).at(0, 0.016, 0);

    // Thick at the trunk, then a clear taper toward the open seat on +X.
    const branch = sdf.smoothUnion(
      0.012,
      sdf.cone([0.02, 0.73, 0], [0.26, 0.735, 0.016], 0.055, 0.038),
      sdf.cone([0.26, 0.735, 0.016], [0.5, 0.7, 0.032], 0.038, 0.028),
    );
    // A low wood floor under the open seat. The nest rests here. The center stays bare.
    const saddle = sdf.ellipsoid([0.1, 0.015, 0.09]).at(NEST_SEAT.x, 0.686, NEST_SEAT.z);
    // A low back rim. It is a ridge, not a twig, so the nest has a back wall.
    const rimBack = sdf.ellipsoid([0.045, 0.014, 0.022]).at(0.5, 0.698, -0.05);

    // Two short thick tines form a Y. They curve up. They are too short to read as fingers.
    // A low front lip shows the cradle from the side. It does not rise into a third finger.
    const twigInner = sdf.chain(
      [
        [0.38, 0.7, 0.07, 0.026],
        [0.34, 0.76, 0.09, 0.018],
        [0.32, 0.81, 0.1, 0.014],
      ],
      0.018,
    );
    const twigOuter = sdf.chain(
      [
        [0.62, 0.695, 0.04, 0.026],
        [0.66, 0.75, 0.045, 0.018],
        [0.68, 0.8, 0.04, 0.014],
      ],
      0.018,
    );
    const lipFront = sdf.chain(
      [
        [0.5, 0.692, 0.12, 0.022],
        [0.48, 0.73, 0.17, 0.015],
      ],
      0.016,
    );

    const wood = sdf
      .smoothUnion(0.032, trunk, flare, branch, saddle, rimBack, twigInner, twigOuter, lipFront)
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
    // Leaf clusters sit on the two tine tips, beside and above the seat.
    // The front lip stays bare wood so the seat stays open in the front view.
    const leavesInner = sdf.smoothUnion(
      0.025,
      blob(0.3, 0.85, 0.12, 0.062),
      blob(0.33, 0.8, 0.1, 0.038),
    );
    const leavesOuter = sdf.smoothUnion(
      0.025,
      blob(0.71, 0.84, 0.04, 0.062),
      blob(0.66, 0.79, 0.05, 0.038),
    );
    const leaves = sdf.union(crown, leavesInner, leavesOuter).paintFn((x, y, z, base) => {
      const up = Math.min(1, Math.max(0, (y - 0.85) / 0.7));
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
