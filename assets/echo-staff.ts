import { HAND_FIT, defineAsset, sdf } from '../src/index.js';

/**
 * Design note — echo staff (avatar reward piece; the app emblem "Echo Staff", for perfect English
 * read-aloud audio).
 *
 * Role: a reward piece the student wears in the main hand, and its shop-style icon. It must read
 * at 128 px and on the avatar at phone size. Rated G.
 * Size: 1.24 m tall like `staff`, stands on y = 0, faces +Z; the grip centre is at y = 0.47.
 * One idea: a big tuning fork that holds a singing lilac crystal, with glowing teal sound rings
 *   around one prong. The head (fork and crystal) is 40% of the height.
 * Shape language: round and smooth (the ball foot, the fork's thick U, the rings); the crystal is
 *   the one sharp accent.
 * Palette: pale powder steel blue #a9bfd4 (all metal), crystal lilac #b48ff0, rings teal #6ff0d8.
 *   The crystal and the rings are the focal point.
 * Materials: metal (pole, collars, fork, foot), emissive crystal, emissive rings.
 * Detail: a big ball foot, a plain pole, a collar stack and a neck bead under the fork, thick
 *   prongs that curve in around the crystal, a hexagonal prism crystal with points, two tilted
 *   rings. No rig.
 */

const STEEL = '#a9bfd4';
const CRYSTAL = '#b48ff0';
const RING = '#6ff0d8';

/** The crystal: the prism runs from GEM_Y - PRISM to GEM_Y + PRISM. */
const GEM_Y = 1.11;
const PRISM = 0.055;

/**
 * A hexagonal crystal with faces 0.07 m from the axis, a prism 0.11 m tall, a point 0.075 m long
 * up and 0.1 m long down.
 */
function crystal() {
  const apothem = 0.07;
  // A facet plane through the prism edge (apothem, edge) and the apex (0, apex), for one side.
  const facets = (edge: number, apex: number) => {
    const len = Math.abs(apex - edge);
    const sign = Math.sign(apex - edge);
    const norm = Math.hypot(len, apothem);
    const n: [number, number, number] = [len / norm, (sign * apothem) / norm, 0];
    const offset = n[0] * apothem + n[1] * edge;
    return [0, 1, 2, 3, 4, 5].map((i) => sdf.halfSpace(n, offset).rotateY(i * 60 + 30));
  };
  const sides = [0, 1, 2, 3, 4, 5].map((i) => sdf.halfSpace([1, 0, 0], apothem).rotateY(i * 60 + 30));
  const cuts = [...facets(PRISM, PRISM + 0.075), ...facets(-PRISM, -PRISM - 0.1), ...sides];
  return cuts.reduce((acc, c) => sdf.intersect(acc, c), sdf.box([0.2, 0.36, 0.2]));
}

export default defineAsset({
  name: 'echo-staff',
  description: 'A pale steel-blue tuning-fork staff whose thick prongs hold a tall glowing lilac crystal, with two teal sound rings; a reward piece.',
  detail: 0.006,
  reference: 'docs/item-mockups/echo-staff-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.47, 0], twoHanded: true },

  build(k) {
    // The plain pole on a big ball foot.
    const pole = sdf.capsule([0, 0.08, 0], [0, 0.6, 0], 0.022);
    const foot = sdf.smoothUnion(
      0.008,
      sdf.sphere(0.052).at(0, 0.052, 0),
      sdf.torus(0.025, 0.009).at(0, 0.112, 0),
      sdf.cylinder(0.02, 0.03, 0.005).at(0, 0.12, 0),
    );
    // The collar stack under the fork: a ring, a wide barrel, a ring, then a neck with a bead.
    const collar = sdf.smoothUnion(
      0.005,
      sdf.torus(0.03, 0.009).at(0, 0.57, 0),
      sdf.cylinder(0.038, 0.05, 0.014).at(0, 0.605, 0),
      sdf.torus(0.03, 0.009).at(0, 0.64, 0),
    );
    const neck = sdf.smoothUnion(0.01, sdf.capsule([0, 0.64, 0], [0, 0.76, 0], 0.019), sdf.ellipsoid([0.026, 0.034, 0.026]).at(0, 0.695, 0));
    // The fork: a thick U that opens up and then curves in, so the prong tips hold the crystal.
    // The prong centre line is a cubic Bezier curve, sampled finely so the prong stays smooth.
    const bezier = (t: number, a: number, b: number, c: number, d: number) =>
      (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
    const prong = sdf.chain(
      Array.from({ length: 17 }, (_, i) => {
        const t = i / 16;
        return [bezier(t, 0, 0.13, 0.135, 0.099), bezier(t, 0.752, 0.752, 0.97, 1.075), 0, 0.032 - 0.012 * t] as [number, number, number, number];
      }),
      0.001,
    );
    const fork = prong.mirror('x', 0.01);
    const metal = sdf.smoothUnion(0.01, pole, foot).smoothUnion(0.008, collar).smoothUnion(0.008, neck).smoothUnion(0.014, fork);
    k.body('metal', metal, { color: STEEL, roughness: 0.34, metalness: 0.55, detail: 0.005, maxTriangles: 5000 });

    // The singing crystal, held by the prong tips and rising above them.
    k.body('crystal', crystal().at(0, GEM_Y, 0), {
      color: CRYSTAL,
      roughness: 0.12,
      metalness: 0,
      emissive: CRYSTAL,
      emissiveIntensity: 0.4,
      detail: 0.004,
      maxError: 0.0008,
      textureDensity: 2,
      flat: true,
    });

    // Two parallel teal sound rings around the -X prong. The tilt (20 degrees forward, 35 degrees
    // down to +X) makes them ellipses from the front and the side, and from a high camera at the
    // back they still show as thin ellipses.
    const ring = (radius: number) => sdf.torus(radius, 0.0105).rotateX(20).rotateZ(-35);
    const rings = sdf.union(ring(0.15).at(-0.15, 0.93, 0.0), ring(0.1).at(-0.11, 0.9, 0.006));
    k.body('rings', rings, { color: RING, roughness: 0.3, metalness: 0, emissive: RING, emissiveIntensity: 0.7, detail: 0.004, maxTriangles: 3000 });
  },
});
