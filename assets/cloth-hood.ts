import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — cloth hood (equipment/armor/cloth-hood).
 *
 * Role: gear for the chibi heroes; must read as "green hood" at 128 px on the shelf and in hand.
 * Size: 0.4 m tall, stands on y = 0, centered on Y, the open face toward +Z.
 * One idea: a soft leaf-green hood standing on an invisible head, the crown swept to a
 *   backward point, the dark open face reading as the focal hollow.
 * Shape language: round and soft (dome, bell cape, rolled rim); one backward point breaks
 *   the silhouette.
 * Palette (60/30/10): leaf green #568e3e dominant, deep fold green #33582a, crown light
 *   #84bb60, near-black interior #1d2b18 as the dark accent inside the face.
 * Materials: one wool cloth body (roughness 0.9, weave in bump); a small cloth tie; no
 *   metal, no glow.
 * Detail: primary dome + backward tip + bell cape; secondary rolled face rim and front tie;
 *   tertiary cloth folds (displace) and weave (bump). Focal point: the open face.
 * Rig/animation: none (static gear prop).
 */

const GREEN = rgb('#568e3e');
const DARK = rgb('#33582a');
const LIGHT = rgb('#84bb60');
const INTERIOR = rgb('#1d2b18');

export default defineAsset({
  name: 'cloth-hood',
  description:
    'A soft leaf-green cloth hood with a short folded cape, standing on an invisible head; pointed back, open dark face.',
  detail: 0.005,
  reference: 'docs/item-mockups/cloth-hood-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- hood mass
    // Rounded dome over the invisible head, with a soft point swept up and backward.
    const dome = sdf.ellipsoid([0.15, 0.13, 0.15]).at(0, 0.243, 0.002);
    const tip = sdf.cone([0, 0.335, -0.045], [0, 0.378, -0.155], 0.04, 0.01);
    const hoodMass = sdf
      .smoothUnion(0.05, dome, tip)
      .displace(0.0025, (x, y, z) => noise.fbm(x * 8, y * 8, z * 8, 2), 1.1);

    // ------------------------------------------------------------- cape (bell with folds)
    const capeProfile = profile.polygon(
      [
        [0, 0.15],
        [0.068, 0.147],
        [0.096, 0.137],
        [0.112, 0.12],
        [0.122, 0.097],
        [0.137, 0.072],
        [0.151, 0.045],
        [0.161, 0.02],
        [0.164, 0.008],
        [0.158, 0.003],
        [0, 0.002],
      ],
      { smooth: true, samples: 10 },
    );
    const fold = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const t = Math.min(1, Math.max(0, (0.15 - y) / 0.14)); // 0 at the neck, 1 at the hem
      return Math.sin(a * 4 + 0.7) * (0.2 + 0.8 * t);
    };
    const cape = sdf
      .revolve(capeProfile)
      .scale([1, 1, 0.78])
      .displace(0.008, fold)
      .displace(0.0025, (x, y, z) => noise.fbm(x * 7, y * 7, z * 7, 2), 1.1);

    // ------------------------------------------------------------- shell, face opening, rim
    const cavity = sdf.ellipsoid([0.126, 0.113, 0.127]).at(0, 0.248, 0.0);
    const opening = sdf.ellipsoid([0.118, 0.096, 0.27]).at(0, 0.258, 0.165);

    const clothMass = sdf.smoothUnion(0.035, cape, hoodMass);
    const hood = clothMass.subtract(cavity.round(-0.003)).smoothSubtract(0.02, opening);
    // A thick rolled rim around the face opening.
    const rim = hoodMass
      .round(0.015)
      .subtract(cavity.round(-0.004))
      .intersect(opening.round(0.03))
      .subtract(opening);

    const clothPaint = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) => {
      let c = base; // GREEN on the surface
      c = mixRgb(c, LIGHT, 0.62 * Math.min(1, Math.max(0, (y - 0.2) / 0.15))); // sunlit crown
      c = mixRgb(c, DARK, 0.5 * Math.min(1, Math.max(0, (0.08 - y) / 0.08))); // damp hem shadow
      c = mixRgb(c, DARK, 0.12 * (0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2))); // patchiness
      return c;
    };
    const cloth = sdf
      .smoothUnion(0.01, hood, rim)
      .intersect(sdf.halfSpace([0, -1, 0], 0)) // stand on the ground plane
      .paintFn(clothPaint)
      .paintWhere(cavity.round(0.005), INTERIOR, 0.012);
    k.body('cloth', cloth, {
      color: GREEN,
      roughness: 0.9,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 2600,
      bump: (x, y, z) =>
        0.0015 * noise.fbm(x * 55, y * 55, z * 55, 2) + 0.0008 * noise.fbm(x * 110, y * 110, z * 110, 1),
    });

    // ------------------------------------------------------------- front tie
    // A small knot with two short ribbon ends, rooted on the cape's front surface.
    const anchor = sdf.surfacePoint(cape, [0, 0.155, 0.3], 0.006);
    const tieLocal = sdf
      .smoothUnion(
        0.01,
        sdf.sphere(0.02),
        sdf.cone([-0.007, -0.006, 0], [-0.042, -0.082, 0.014], 0.014, 0.007),
        sdf.cone([0.007, -0.006, 0], [0.042, -0.082, 0.014], 0.014, 0.007),
      )
      .scale([1, 1, 0.7])
      .at(anchor[0], anchor[1], anchor[2]);
    k.body('tie', tieLocal, { color: GREEN, roughness: 0.9, metalness: 0, detail: 0.004, maxTriangles: 300 });
  },
});
