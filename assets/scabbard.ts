import { defineAsset, mixRgb, noise, profile, sdf } from '../src/index.js';

/**
 * Scabbard (equipment/accessories): a 0.8 m leather sword scabbard lying flat on y = 0,
 * length along Z, throat and hilt toward +Z. Chibi Quest style: rounded chunky leather,
 * brass throat and chape, a riveted strap, a belt loop, and the sword's hilt sticking out
 * of the throat (the idea of the concept mockup).
 *
 * - Role: hero gear / pickup icon; must read at 128 px.
 * - Size: 0.8 m scabbard, ~1.0 m overall with the hilt; stands on y = 0, centered on Y.
 * - One idea: a well-kept brown leather scabbard dressed with bright brass fittings.
 * - Shape language: long rounded triangle (soft), accent bumps at both ends (brass).
 * - Palette: leather #8a5a35 (dominant), dark leather #5c3a22 (strap, loop, grip),
 *   brass/gold #d4a93a (accent: throat, chape, rivets, guard, pommel).
 * - Materials: leather, dark leather, brass. No rig; static accessory.
 */

const LAY_Y = 0.031; // scabbard axis height (flattened half-height)
const LAY_Z = -0.39; // profile v 0..0.78 maps to z -0.39..0.39
const FLAT: [number, number, number] = [1.2, 0.55, 1];

// Lay a revolved profile (axis +Y, v 0..0.78) down along Z.
const lay = (s: ReturnType<typeof sdf.revolve>) =>
  s.rotateX(90).scale(FLAT).at(0, LAY_Y, LAY_Z);

export default defineAsset({
  name: 'scabbard',
  description:
    'Leather sword scabbard lying flat: brass throat and chape, riveted strap, belt loop, hilt sticking out.',
  detail: 0.006,
  reference: 'docs/item-mockups/scabbard-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- leather body
    const bodyProfile = profile.polygon(
      [
        [0.006, 0.0],
        [0.022, 0.03],
        [0.031, 0.08],
        [0.04, 0.18],
        [0.047, 0.32],
        [0.051, 0.48],
        [0.053, 0.62],
        [0.055, 0.72],
        [0.056, 0.78],
      ],
      { smooth: true },
    );
    const body = lay(sdf.revolve(bodyProfile));
    k.body('leather', body, {
      color: '#8a5a35',
      roughness: 0.65,
      detail: 0.007,
      maxTriangles: 1050,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 240, y * 240, z * 240, 2), // leather grain
      paintFn: (x, y, z) => {
        // Mottled hide, darker toward the thin side edges (the seam sides).
        let c = mixRgb('#8a5a35', '#9a6a3e', 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 6, 3));
        const edge = Math.min(1, Math.max(0, (Math.abs(x) - 0.044) / 0.014));
        return mixRgb(c, '#5c3a22', edge * 0.9);
      },
    });

    // ------------------------------------------------------------- dark leather: strap, loop, grip
    const strapProfile = profile.polygon(
      [
        [0.05, 0.42],
        [0.056, 0.445],
        [0.056, 0.515],
        [0.05, 0.55],
      ],
      { smooth: true },
    );
    const strap = lay(sdf.revolve(strapProfile));

    const loop = sdf.chain(
      [
        [-0.042, 0.04, 0.22, 0.0095],
        [-0.042, 0.082, 0.22, 0.0095],
        [0, 0.108, 0.22, 0.0095],
        [0.042, 0.082, 0.22, 0.0095],
        [0.042, 0.04, 0.22, 0.0095],
      ],
      0.018,
    );

    const grip = sdf.capsule([0, LAY_Y, 0.432], [0, LAY_Y, 0.545], 0.02);

    k.body('leather-dark', sdf.union(strap, loop, grip), {
      color: '#5c3a22',
      roughness: 0.7,
      maxTriangles: 650,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 200, y * 200, z * 200, 2),
      paintFn: (x, y, z, base) =>
        // Spiral wrap on the grip only.
        z > 0.41
          ? mixRgb(base, '#7a4e2c', 0.5 + 0.5 * Math.sin(Math.atan2(y - LAY_Y, x) * 3 + z * 320))
          : base,
    });

    // ------------------------------------------------------------- brass: throat, chape, rivets, hilt furniture
    const throatProfile = profile.polygon(
      [
        [0.055, 0.64],
        [0.057, 0.68],
        [0.0585, 0.74],
        [0.0585, 0.79],
        [0.056, 0.815],
      ],
      { smooth: true },
    );
    const chapeProfile = profile.polygon(
      [
        [0.004, -0.014],
        [0.02, -0.004],
        [0.03, 0.02],
        [0.036, 0.05],
        [0.039, 0.09],
        [0.040, 0.13],
        [0.0405, 0.165],
      ],
      { smooth: true },
    );
    const throat = lay(sdf.revolve(throatProfile));
    const chape = lay(sdf.revolve(chapeProfile));

    const rivets = sdf.union(
      sdf.sphere(0.009).at(-0.03, 0.058, 0.085),
      sdf.sphere(0.009).at(0.03, 0.058, 0.085),
    );

    const guard = sdf
      .box([0.18, 0.052, 0.036], 0.014)
      .union(sdf.sphere(0.017).at(-0.09, 0, 0).mirror('x', 0))
      .at(0, LAY_Y, 0.408);
    const pommel = sdf
      .smoothUnion(
        0.009,
        sdf.ellipsoid([0.03, 0.03, 0.024]).at(0, LAY_Y, 0.578),
        sdf.cone([0, LAY_Y, 0.548], [0, LAY_Y, 0.568], 0.021, 0.026),
      );

    k.body('brass', sdf.union(throat, chape, rivets, guard, pommel), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.005,
      maxTriangles: 800,
      bump: (x, y, z) => 0.0002 * noise.fbm(x * 300, y * 300, z * 300, 2),
    });
  },
});
