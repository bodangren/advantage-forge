import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — wizard staff (equipment/magic-weapons/staff).
 *
 * Role: equipment pickup and icon. It must read at 128 px.
 * Size: 1.2 m tall, stands on y = 0, centred on Y, faces +Z.
 * One idea: a bright cyan faceted teardrop crystal in a gold four-prong cup on a dark wood knot.
 * Shape language: round and soft. Curls break the pole from every side.
 * Palette: walnut #6b4226 / #54331d, sap #9a6840, leather #8a5632, cord #c4a574,
 *   iron #6a7078, gold #d4a93a, crystal #38c8ff. The crystal is the accent.
 * Materials: wood, leather, iron, gold cup, emissive crystal.
 * Detail: gnarled shaft, grip wrap, ferrule, knot, four prongs, faceted crystal. No rig.
 */

const WOOD = '#6b4226';
const WOOD_DARK = '#54331d';
const WOOD_LIGHT = '#7d5434';
const SAP = '#9a6840';
const LEATHER = '#8a5632';
const LEATHER_DARK = '#4e3018';
const CORD = '#c4a574';
const IRON = '#6a7078';
const IRON_DARK = '#3c424a';
const ORB_GLOW = '#38c8ff';
const GOLD = '#d4a93a';
const LEAN = 15;

/** Crystal centre. Ellipsoid top lands at y = 1.24. */
const ORB_Y = 1.1;

/** Faceted teardrop: an ellipsoid cut by eight tilted planes that taper to the top. */
function crystal() {
  const t = (12 * Math.PI) / 180;
  const n: [number, number, number] = [Math.cos(t), Math.sin(t), 0];
  const cuts = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
    sdf.halfSpace(n, 0.062).rotateY(i * 45),
  );
  return sdf.intersect(sdf.ellipsoid([0.075, 0.14, 0.075]), ...cuts);
}

export default defineAsset({
  name: 'staff',
  description:
    'Gnarled walnut wizard staff with a leather grip, iron ferrule, and a glowing crystal orb in three curling tines.',
  detail: 0.007,
  reference: 'docs/item-mockups/staff-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.47, 0], twoHanded: true },

  build(k) {
    // A gentle S-curve, centred on Y, thicker at the fork.
    const shaft = sdf.chain(
      [
        [0.0, 0.045, 0.0, 0.022],
        [0.014, 0.18, -0.01, 0.023],
        [-0.016, 0.34, 0.012, 0.022],
        [0.005, 0.48, -0.003, 0.022],
        [-0.012, 0.64, 0.01, 0.022],
        [0.015, 0.78, -0.012, 0.023],
        [-0.006, 0.9, 0.005, 0.028],
        [0.0, 0.96, 0.0, 0.028],
      ],
      0.018,
    );

    const knots = sdf.union(
      sdf.sphere(0.02).at(0.02, 0.15, -0.012),
      sdf.sphere(0.018).at(-0.02, 0.26, 0.01),
      sdf.sphere(0.017).at(0.016, 0.68, 0.014),
      sdf.sphere(0.02).at(-0.016, 0.82, -0.012),
      sdf.sphere(0.028).at(0, 0.94, 0.004),
      sdf.sphere(0.018).at(0.002, 0.988, 0.008),
    );

    // Dark wood knot under the cup, joining the shaft.
    const knot = sdf.ellipsoid([0.06, 0.05, 0.06]).at(0, 0.94, 0);

    // Chunky curls on the bare shaft, below and above the grip.
    const rootlets = sdf.union(
      sdf.chain(
        [
          [-0.012, 0.17, 0.006, 0.015],
          [-0.038, 0.23, 0.024, 0.013],
          [-0.028, 0.3, 0.04, 0.011],
          [-0.006, 0.35, 0.026, 0.01],
        ],
        0.008,
      ),
      sdf.chain(
        [
          [0.012, 0.22, -0.008, 0.014],
          [0.036, 0.28, -0.028, 0.012],
          [0.02, 0.34, -0.022, 0.01],
        ],
        0.007,
      ),
      sdf.chain(
        [
          [0.01, 0.66, -0.01, 0.015],
          [0.036, 0.72, -0.032, 0.013],
          [0.022, 0.78, -0.04, 0.011],
          [0.004, 0.83, -0.022, 0.01],
        ],
        0.008,
      ),
      sdf.chain(
        [
          [-0.01, 0.74, 0.008, 0.014],
          [-0.032, 0.8, 0.028, 0.012],
          [-0.016, 0.86, 0.02, 0.01],
        ],
        0.007,
      ),
    );

    const wood = sdf
      .smoothUnion(0.014, shaft, knots)
      .smoothUnion(0.02, knot)
      .smoothUnion(0.008, rootlets)
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 6, y * 2.2, z * 6, 3);
        const along = Math.min(1, Math.max(0, (y - 0.06) / 0.9));
        let c = mixRgb(rgb(WOOD_DARK), rgb(base), 0.4 + 0.6 * along);
        c = mixRgb(c, rgb(WOOD_DARK), Math.max(0, n) * 0.5);
        c = mixRgb(c, rgb(WOOD_LIGHT), Math.max(0, -n) * 0.35);
        return c;
      })
      .paintWhere(sdf.box([0.26, 0.34, 0.26]).at(0, 1.08, 0), SAP, 0.03)
      .paintWhere(sdf.sphere(0.09).at(-0.02, 0.26, 0.02), SAP, 0.015)
      .paintWhere(sdf.sphere(0.08).at(0.02, 0.28, -0.02), SAP, 0.012)
      .paintWhere(sdf.sphere(0.09).at(0.02, 0.74, -0.02), SAP, 0.015)
      .paintWhere(sdf.sphere(0.07).at(-0.02, 0.8, 0.02), SAP, 0.012);

    k.body('wood', wood, {
      color: WOOD,
      roughness: 0.84,
      metalness: 0,
      detail: 0.0075,
      maxTriangles: 2300,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 22, y * 7, z * 22, 3),
    });

    // Leather wrap at hand height. End cords are pale so the band reads at icon size.
    const gripY0 = 0.39;
    const gripY1 = 0.55;
    const grip = sdf
      .smoothUnion(
        0.005,
        sdf.capsule([0.004, gripY0, -0.002], [-0.002, gripY1, 0.002], 0.03),
        sdf.torus(0.031, 0.008).at(0.002, gripY0 + 0.01, 0),
        sdf.torus(0.031, 0.008).at(0.0, gripY1 - 0.01, 0),
        sdf.torus(0.029, 0.006).at(0.001, 0.47, 0),
      )
      .paintFn((x, y, z) => {
        const ang = Math.atan2(z, x);
        const spiral = Math.sin(ang + (y - gripY0) * 145);
        if (y < gripY0 + 0.022 || y > gripY1 - 0.022) return rgb(CORD);
        return spiral > 0.15 ? rgb(LEATHER_DARK) : rgb(LEATHER);
      });
    k.body('grip', grip, {
      color: LEATHER,
      roughness: 0.64,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 700,
      textureDensity: 2,
      bump: (x, y, z) => 0.0013 * Math.abs(Math.sin(Math.atan2(z, x) + y * 145)),
    });

    // Iron shoe. Lifted a few millimetres so the mesh foot sits on y = 0, not under it.
    const ferrule = sdf
      .revolve(
        profile.polygon(
          [
            [0.0, 0.0],
            [0.038, 0.0],
            [0.04, 0.01],
            [0.03, 0.022],
            [0.027, 0.04],
            [0.033, 0.052],
            [0.03, 0.064],
            [0.02, 0.074],
            [0.0, 0.074],
          ],
          { smooth: true, samples: 10 },
        ),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 32, y * 24, z * 32, 2);
        if (y < 0.02) return rgb(IRON_DARK);
        if (n > 0.32) return mixRgb(rgb(base), rgb(IRON_DARK), 0.5);
        return rgb(base);
      });
    k.body('ferrule', ferrule, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.76,
      detail: 0.006,
      maxTriangles: 420,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 40, y * 36, z * 40, 2),
    });

    // Faceted cyan crystal, one body.
    k.body('orb', crystal().at(0, ORB_Y, 0), {
      color: ORB_GLOW,
      roughness: 0.15,
      metalness: 0,
      emissive: ORB_GLOW,
      emissiveIntensity: 0.6,
      detail: 0.0045,
      maxError: 0.0008,
      textureDensity: 2,
      flat: true,
    });

    // Gold cup: four leaf prongs leaning inward, plus a ring.
    const leaf = sdf.extrude(
      profile.polygon(
        [
          [0, 0], [0.02, 0.02], [0.025, 0.05], [0.014, 0.078],
          [0, 0.09], [-0.014, 0.078], [-0.025, 0.05], [-0.02, 0.02],
        ],
        { smooth: true },
      ),
      0.015,
    );
    const prongs = [0, 1, 2, 3].map((i) =>
      leaf.at(0, 0, 0).rotateX(-LEAN).at(0, 0, 0.078).at(0, 0.975, 0).rotateY(i * 90),
    );
    const cup = sdf
      .smoothUnion(0.006, ...prongs, sdf.torus(0.065, 0.02).at(0, 0.97, 0))
      .paintFn((x, y, z, base) => rgb(base));
    k.body('cup', cup, {
      color: GOLD,
      roughness: 0.35,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 1300,
    });
  },
});
