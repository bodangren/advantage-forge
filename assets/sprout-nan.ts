import { profile, sdf } from '../src/index.js';
import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Nan, a five-year-old girl of Chibi Sprouts: about 0.9 m with the bunches, faces +Z. No picture
 * of her exists; she follows the style of the cast sheet (docs/sprout-mockups/pat.jpg).
 * Role: a classmate in the kindergarten renders, seen large; the orange shirt with the white star,
 * the red shorts, and the two small bunches must read.
 * One idea: a bright, friendly girl whose orange shirt, white star, and red-banded bunches pop on
 * the small round chibi body. Shape language: round and soft.
 * Palette (60/30/10): shirt #f08a2a (orange) with a white star; shorts #c8352e (red); hair #231a17;
 *   white sneakers with grey soles; red hair bands (#c8352e) are the accent.
 * Bodies: skin, hair (short style) and bunches, bands, shirt (star painted), shorts, shoes.
 * Rig: the humanoid kind's skeleton and clips at age 5.
 */

const C = { star: '#fbf7ee', shorts: '#c8352e', band: '#c8352e', shoe: '#f6f4ef', sole: '#8d8f96', strap: '#c9ccd4' };

const star = (outer: number, inner: number) =>
  profile.polygon(
    Array.from({ length: 10 }, (_, i): [number, number] => {
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? outer : inner;
      return [r * Math.cos(a), r * Math.sin(a)];
    }),
  );

export default humanoidAsset({
  name: 'sprout-nan',
  description: 'Nan, a five-year-old girl: large dark-brown eyes, short black hair in two small red-banded bunches, an orange T-shirt with a white star, red shorts, and white sneakers with grey soles.',
  reference: 'docs/sprout-mockups/pat.jpg',
  proportions: AGE5,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', auburn: '#8e3b1c', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { orange: '#f08a2a', amber: '#f2a83a', coral: '#ea7452', apricot: '#f0a068' },
  },
  presets: {
    nan: { skin: 'fair', hair: 'black', eyes: 'brown', cloth: 'orange' },
  },

  extra(k, h) {
    const { HIP, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = AGE5;

    // ---------------------------------------------------------------- short hair in a smooth shell, two bunches
    // One cap 0.012 m over the skull; two tilted masks cut a soft V hairline with a center part.
    const hairColor = k.tint('hair');
    const H = P.head;
    const mask = (s: number) => sdf.ellipsoid([0.2, 0.15, 0.25]).rotateZ(12 * s).at(0.07 * s, -0.062, 0.14);
    const cap = sdf
      .ellipsoid([H[0] + 0.012, H[1] + 0.014, H[2] + 0.012])
      .at(0, 0.008, -0.01)
      .smoothSubtract(0.02, sdf.union(mask(1), mask(-1)));
    const waves = sdf.union(
      sdf.ellipsoid([0.05, 0.03, 0.05]).at(0.1, 0.1, 0.13),
      sdf.ellipsoid([0.05, 0.03, 0.05]).at(-0.1, 0.1, 0.13),
      sdf.ellipsoid([0.06, 0.035, 0.04]).at(0, 0.13, 0.14),
    );
    const bunch = sdf
      .smoothUnion(0.02, sdf.sphere(0.052).at(0.212, 0.105, -0.01), sdf.ellipsoid([0.034, 0.03, 0.034]).at(0.2, 0.062, -0.01))
      .bone('head');
    const hair = sdf
      .smoothUnion(0.02, cap, waves.smoothIntersect(0.02, sdf.ellipsoid([H[0] + 0.02, H[1] + 0.022, H[2] + 0.02]).at(0, 0.008, -0.01)), pair(bunch))
      .bone('head');
    k.body('hair', hair.at(0, HEAD_Y, 0), { color: hairColor, roughness: 0.6, detail: 0.004 });
    const band = sdf.torus(0.05, 0.013).rotateZ(-64).at(0.195, 0.095, -0.01).bone('head');
    k.body('bands', pair(band).at(0, HEAD_Y, 0), { color: C.band, roughness: 0.5, detail: 0.003 });

    // ---------------------------------------------------------------- orange T-shirt with a white star
    const sleeves = h.perArm(() => sdf.cone(P.shirt.sleeveStart, P.shirt.sleeveEnd, ...P.shirt.sleeveR).bone('upperarm.L'));
    const body = h.torso.round(0.006).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -0.185));
    const starMark = sdf.extrude(star(0.03, 0.0125), 0.3).at(0, 0.318, 0.2);
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(body), sleeves)
      .paintWhere(sdf.halfSpace([0, -1, 0], -P.shirt.collarY), k.tint('cloth', -0.15), 0.003)
      .paintWhere(starMark.intersect(sdf.halfSpace([0, 0, -1], -0.02)), C.star, 0.001);
    k.body('shirt', shirt, { color: h.tint.shirt!, roughness: 0.85, textureDensity: 2 });

    // ---------------------------------------------------------------- red shorts to mid-thigh
    const waist = h.torso.round(0.0).smoothIntersect(0.01, sdf.box([0.6, 0.05, 0.6]).at(0, 0.175, 0));
    const shortLeg = sdf.cone(HIP, [HIP[0] + 0.008, 0.15, 0], 0.052, 0.058).round(0.003).bone('leg.L');
    const shorts = sdf.smoothUnion(0.02, h.weighted(waist), sdf.ellipsoid([0.099, 0.05, 0.074]).at(0, 0.19, 0).bone('hips'), pair(shortLeg));
    k.body('shorts', shorts, { color: C.shorts, roughness: 0.85 });

    // ---------------------------------------------------------------- white sneakers, grey soles
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(...P.shoe.cylinder).at(0, P.shoe.cylinderY, 0), sdf.ellipsoid(P.shoe.toeSize).at(...P.shoe.toeAt))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = shoeFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], P.shoe.soleTop)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const strap = sdf.box([0.4, 0.4, 0.014]).at(0, 0.3, 0.02).intersect(sdf.halfSpace([0, -1, 0], -0.052));
    const sneaker = sdf
      .union(shoeFoot.paintWhere(strap, C.strap, 0.002), sole.paint(C.sole))
      .rotateY(12)
      .scale(P.shoe.scale)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(sneaker), { color: C.shoe, roughness: 0.6 });
  },
});
