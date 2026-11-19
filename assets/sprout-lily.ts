import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';
import { sproutGestures } from './parts/sprout-gestures.js';

/**
 * Lily, Tom's seven-year-old sister in Chibi Sprouts, faces +Z. Target: docs/sprout-mockups/lily.jpg.
 * Role: a classmate in the kindergarten renders; the chin-length brown bob with straight bangs,
 * the white round collar on the mid-blue shirt, and the red pleated skirt must read large.
 * One idea: a sweet girl with a neat straight bob whose blunt fringe stops above the eyes and
 * frames cheeks that end at the chin. Shape language: round and soft, with the pleats as the one
 * repeated form.
 * Palette (60/30/10): mid-blue shirt #3f8fd0 with a white collar; red skirt #cf3a2e; brown hair
 *   #5a301d; white mid-calf socks and red sneakers with white laces and white soles.
 * Bodies: skin, hair (shell, straight fringe, chin side locks), shirt (white collar band), skirt
 *   (10 pleats), socks, shoes. Rig: the humanoid kind's skeleton and clips at age 5; the skirt is
 *   rigid on the hips.
 */
const C = { skirt: '#cf3a2e', fold: '#8e2318', sock: '#f6f4ef', shoe: '#c8352e', sole: '#f6f4ef', lace: '#f6f4ef', collar: '#f6f4ef', shirt: '#3f8fd0' };
const PLEATS = 10;

export default humanoidAsset({
  name: 'sprout-lily',
  description: 'Lily, a seven-year-old girl: large dark-brown eyes, chin-length straight brown hair with straight bangs, a mid-blue T-shirt with a white round collar, a red pleated skirt, white mid-calf socks, and red sneakers with white laces.',
  reference: 'docs/sprout-mockups/lily.jpg',
  proportions: AGE5,
  sing: true,
  sproutFace: true,
  sproutHands: true,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', auburn: '#8e3b1c', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { blue: '#3f8fd0', sky: '#6fa8d8', navy: '#2f4a8a', powder: '#a8c8e8' },
  },
  presets: {
    lily: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'blue' },
  },

  extra(k, h) {
    const { KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = AGE5;
    const H = P.head;
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ---------------------------------------------------------------- hair: a chin-length bob with a straight fringe
    // The fringe ends 1.7 cm above the eye tops; the sides fall to the chin; the back is cut
    // at the jaw so the neck shows. Local frame: y 0 is the head center (eyes at -0.047).
    const faceMask = sdf.ellipsoid([0.185, 0.12, 0.21]).at(0, -0.11, 0.12);
    const cap = sdf
      .ellipsoid([H[0] + 0.008, H[1] + 0.015, H[2] + 0.013])
      .at(0, 0.008, -0.01)
      .smoothSubtract(0.02, faceMask);
    // Straight blunt fringe across the forehead, hugging the skull, cut flat above the brows.
    const fringe = sdf
      .ellipsoid([0.165, 0.055, 0.075])
      .at(0, 0.09, 0.105)
      .smoothIntersect(0.02, sdf.ellipsoid([H[0] + 0.03, H[1] + 0.03, H[2] + 0.03]).at(0, 0.008, -0.01))
      .intersect(sdf.halfSpace([0, -1, 0], -0.06));
    // Chin side locks framing the cheeks.
    const lock = sdf.chain(
      [
        [0.14, 0.06, 0.1, 0.035],
        [0.155, -0.04, 0.075, 0.03],
        [0.15, -0.12, 0.05, 0.026],
      ],
      0.03,
    );
    const hairLocal = sdf
      .smoothUnion(0.02, cap, fringe, pair(lock))
      .intersect(sdf.halfSpace([0, -1, 0], 0.13))
      .bone('head');
    k.body('hair', hairLocal.at(0, HEAD_Y, 0), { color: k.tint('hair'), roughness: 0.6, detail: 0.004 });

    // ---------------------------------------------------------------- mid-blue T-shirt with a white round collar
    const HEM_SHIRT = 0.21;
    const sleeves = h.perArm(() => sdf.cone(P.shirt.sleeveStart, P.shirt.sleeveEnd, ...P.shirt.sleeveR).bone('upperarm.L'));
    const body = h.torso.round(0.006).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -HEM_SHIRT));
    const collarBand = sdf.box([0.6, 0.04, 0.6]).at(0, P.shirt.collarY + 0.005, 0);
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(body), sleeves)
      .paintWhere(collarBand, C.collar, 0.003);
    k.body('shirt', shirt, { color: h.tint.shirt!, roughness: 0.85 });

    // ---------------------------------------------------------------- red pleated skirt to the knee
    // The waistband stays inside the shirt and the pleats start below the shirt hem. The folds
    // are straight triangle-wave ridges from there to the hem.
    const PLEAT_TOP = HEM_SHIRT - 0.015;
    const SKIRT_HEM = 0.13;
    const tri = (x: number, z: number) => {
      const t = ((((PLEATS * Math.atan2(x, z)) / (2 * Math.PI)) % 1) + 1) % 1;
      return 1 - 4 * Math.abs(t - 0.5);
    };
    const ramp = (y: number) => Math.min(1, Math.max(0, (PLEAT_TOP - y) / 0.008));
    const skirtBase = sdf
      .revolve(
        profile.polygon([
          [0, 0.235],
          [0.104, 0.235],
          [0.108, HEM_SHIRT],
          [0.117, PLEAT_TOP],
          [0.146, SKIRT_HEM],
          [0, SKIRT_HEM],
        ]),
      )
      .scale([1, 1, 0.84]);
    const skirt = skirtBase
      .displace(0.01, (x, y, z) => ramp(y) * tri(x, z))
      .intersect(sdf.box([0.6, 0.2, 0.6]).at(0, SKIRT_HEM + 0.12, 0))
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.fold), 0.7 * ramp(y) * (0.5 - 0.5 * tri(x, z))))
      .bone('hips');
    k.body('skirt', skirt, { color: C.skirt, roughness: 0.85, detail: 0.004, textureDensity: 2, maxError: 0.004 });

    // ---------------------------------------------------------------- white socks to mid-calf
    const sockA = lerp(KNEE, ANKLE, 0.45);
    const sockB = lerp(KNEE, ANKLE, 1.0);
    const sock = sdf
      .smoothUnion(0.004, sdf.cone(sockA, sockB, 0.0365, 0.035), sdf.torus(0.0365, 0.005).at(sockA[0], sockA[1], sockA[2]))
      .bone('shin.L');
    k.body('socks', pair(sock), { color: C.sock, roughness: 0.9, detail: 0.003 });

    // ---------------------------------------------------------------- red sneakers, white laces, white soles and toe caps
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(...P.shoe.cylinder).at(0, P.shoe.cylinderY, 0), sdf.ellipsoid(P.shoe.toeSize).at(...P.shoe.toeAt))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = shoeFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.026)).intersect(sdf.halfSpace([0, -1, 0], 0));
    // Three laces across the instep and a white toe cap, painted where the bars cross the shoe.
    const laceY = (z: number) => 0.048 + 0.05 * Math.sqrt(Math.max(0, 1 - ((z - 0.045) / 0.098) ** 2));
    const laces = sdf.union(...[0.045, 0.068, 0.091].map((z) => sdf.box([0.07, 0.03, 0.011]).at(0, laceY(z), z)));
    const toeCap = sdf.halfSpace([0, 0, 1], 0.06).intersect(sdf.halfSpace([0, 1, 0], 0.05));
    const sneaker = sdf
      .union(shoeFoot.paintWhere(laces, C.lace, 0.002).paintWhere(toeCap, C.sole, 0.002), sole.paint(C.sole))
      .rotateY(12)
      .scale(P.shoe.scale)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(sneaker), { color: C.shoe, roughness: 0.6 });

    // ---------------------------------------------------------------- the week 1 gestures (option C: every singer plays them)
    sproutGestures(k, h);
  },
});
