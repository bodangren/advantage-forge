import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — wizard staff (equipment/magic-weapons/staff).
 *
 * Role: equipment pickup and icon. It must read at 128 px.
 * Size: 1.24 m tall, stands on y = 0, centred on Y, faces +Z.
 * One idea: a bright cyan faceted teardrop crystal in a gold six-petal crown on a dark wood shaft wrapped in orange vines.
 * Shape language: round and soft. Curls break the pole from every side.
 * Palette: walnut #6b4228 / #54331d, grain #8a5a35, vine orange #d9822b, leather #8a5632,
 *   cord #c4a574, gold #d4a93a, crystal #38c8ff. The crystal is the accent, vines second.
 * Materials: wood, vines, leather, gold crown, emissive crystal.
 * Detail: gnarled shaft, grip wrap, root-flare foot, six spiral vines with curls, six petals,
 *   faceted crystal. No rig.
 */

const WOOD = '#6b4228';
const WOOD_DARK = '#54331d';
const WOOD_LIGHT = '#8a5a35';
const VINE = '#d9822b';
const SAP = '#9a6840';
const LEATHER = '#8a5632';
const LEATHER_DARK = '#4e3018';
const CORD = '#c4a574';
const ORB_GLOW = '#38c8ff';
const GOLD = '#d4a93a';
const FLARE = 24;

/** Crystal centre. The apex lands at y = 1.24. */
const ORB_Y = 1.109;

/** Faceted teardrop: 6 side planes and 6 tilted top planes that meet at the apex. */
function crystal() {
  const t = (35 * Math.PI) / 180;
  const n: [number, number, number] = [Math.cos(t), Math.sin(t), 0];
  const top = [0, 1, 2, 3, 4, 5].map((i) => sdf.halfSpace(n, 0.075).rotateY(i * 60 + 30));
  const side = [0, 1, 2, 3, 4, 5].map((i) =>
    sdf.halfSpace([1, 0, 0], 0.074).rotateY(i * 60),
  );
  return [...top, ...side].reduce(
    (acc, c) => sdf.intersect(acc, c),
    sdf.ellipsoid([0.09, 0.15, 0.09]),
  );
}

export default defineAsset({
  name: 'staff',
  description:
    'Gnarled walnut wizard staff with a leather grip, orange vines, and a glowing faceted crystal in a gold crown.',
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
        [0.0, 0.94, 0.0, 0.03],
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
    const knot = sdf
      .revolve(
        profile.polygon(
          [[0, 0.88], [0.032, 0.88], [0.036, 0.92], [0.05, 0.97], [0.054, 1.0], [0, 1.0]],
          { smooth: true, samples: 8 },
        ),
      );

    // Root flare at the foot, standing on y = 0.
    const foot = sdf
      .revolve(
        profile.polygon(
          [[0, 0], [0.036, 0], [0.04, 0.008], [0.03, 0.026], [0.022, 0.06], [0, 0.06]],
          { smooth: true, samples: 8 },
        ),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const wood = sdf
      .smoothUnion(0.014, shaft, knots)
      .smoothUnion(0.02, knot)
      .smoothUnion(0.012, foot)
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

    // Orange vines: short spirals around the shaft, ending in small outward curls.
    const vineAt = (y: number, ang: number, r: number): [number, number, number] => [
      r * Math.cos(ang),
      y,
      r * Math.sin(ang),
    ];
    const vineSpec: Array<[number, number, number]> = [
      // y start, start angle (deg), turn direction: clusters low, middle, and under the crown
      [0.06, 20, 1],
      [0.13, 200, -1],
      [0.62, 60, -1],
      [0.7, 230, 1],
      [0.8, 330, -1],
      [0.84, 130, 1],
    ];
    const vines = sdf.union(
      ...vineSpec.map(([y0, a0, dir]) => {
        const pts: Array<[number, number, number, number]> = [];
        const steps = 4;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const ang = ((a0 + dir * u * 200) * Math.PI) / 180;
          const [px, py, pz] = vineAt(y0 + u * 0.08, ang, 0.032);
          pts.push([px, py, pz, 0.016 - 0.004 * u]);
        }
        // curl: leave the shaft, loop up and hook back
        const last = ((a0 + dir * 200) * Math.PI) / 180;
        const [cx, cy, cz] = vineAt(y0 + 0.1, last, 0.055);
        pts.push([cx, cy, cz, 0.012]);
        const [dx, dy, dz] = vineAt(y0 + 0.135, last + dir * 0.4, 0.065);
        pts.push([dx, dy, dz, 0.011]);
        const [ex, ey, ez] = vineAt(y0 + 0.15, last + dir * 0.9, 0.05);
        pts.push([ex, ey, ez, 0.01]);
        return sdf.chain(pts, 0.008);
      }),
    );
    k.body('vines', vines, {
      color: VINE,
      roughness: 0.5,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 1900,
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

    // Gold crown: six broad rounded petals flaring outward around the lower third of the crystal.
    const petal = sdf.extrude(
      profile.polygon(
        [[-0.034, 0], [0.034, 0], [0.042, 0.03], [0.036, 0.055], [0.015, 0.072], [0, 0.074], [-0.015, 0.072], [-0.036, 0.055], [-0.042, 0.03]],
        { smooth: true },
      ),
      0.015,
      0.004,
    );
    const petals = [0, 1, 2, 3, 4, 5].map((i) =>
      petal.rotateX(FLARE).at(0, 0, 0.062).at(0, 1.005, 0).rotateY(i * 60 + 30),
    );
    const cup = sdf
      .smoothUnion(0.006, ...petals, sdf.torus(0.066, 0.02).at(0, 1.015, 0))
      .paintFn((x, y, z, base) => rgb(base));
    k.body('cup', cup, {
      color: GOLD,
      roughness: 0.35,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 1500,
    });
  },
});
