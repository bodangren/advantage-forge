import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';
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
 *   rigid on the hips, with a level hem two thirds of the way from hip to knee.
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

    // ---------------------------------------------------------------- hair: one smooth chin-length bob
    // Local frame: y 0 is the head center (eyes at -0.047, brows at +0.047, chin at -0.145).
    // One volume: a cap that sits 0.015 m from the skull on top, at the sides, and at the back.
    // Its front stays close to the forehead, so the fringe covers the skin. The sides hug the ear
    // band (the ear reaches x 0.226 at y -0.065) and then tuck in to a straight panel of 0.177
    // down to the blunt cut at the chin, which keeps the raised-hand clips clear of the hair.
    // A shallow-sloped hem takes the back down to the nape (no skin between the hair and the
    // collar), and one flat-top face opening leaves a straight fringe line above the brows.
    const cap = sdf.ellipsoid([H[0] + 0.015, H[1] + 0.015, H[2] + 0.01]).at(0, 0, -0.005);
    const sides = sdf
      .revolve(
        profile.polygon([
          [0, 0.145],
          [0.1, 0.135],
          [0.16, 0.105],
          [0.19, 0.05],
          [0.214, -0.01],
          [0.22, -0.03],
          [0.226, -0.042],
          [0.231, -0.065],
          [0.23, -0.082],
          [0.224, -0.093],
          [0.2175, -0.101],
          [0.214, -0.105],
          [0.211, -0.108],
          [0.208, -0.111],
          [0.204, -0.114],
          [0.2, -0.117],
          [0.197, -0.121],
          [0.193, -0.126],
          [0.19, -0.13],
          [0.185, -0.134],
          [0.181, -0.137],
          [0.178, -0.14],
          [0.177, -0.15],
          [0.177, -0.24],
          [0, -0.24],
        ]),
      )
      .scale([1, 1, 0.9]);
    const mass = sdf.smoothUnion(0.025, cap, sides);
    // The face opening is wide at the eyes and narrows to the chin; its flat top at +0.058 sits
    // 1.1 cm above the brows, so the fringe edge is one straight horizontal line. The 0.012 fillet
    // rounds the corners where that line meets the side panels.
    const faceOpen = sdf
      .ellipsoid([0.185, 0.17, 0.26])
      .at(0, -0.06, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], 0.058));
    // The blunt cut: level at the chin in front (y -0.172) and at the nape behind (y -0.199).
    const hem = sdf.halfSpace([0, -1, 0.065], 0.1846);
    const hairPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const low = Math.max(0, (-0.14 - y) * 6) * 0.12; // a soft darkening at the hem
      return mixRgb(base, rgb('#3a1e10'), low);
    };
    // The fringe step: a rounded lip stands proud of the forehead. Its sharp lower edge sits at
    // the forehead cut (y 0.057), 1 cm above the brows (brows at 0.047), so the step is geometry.
    // The lip thins with height and meets the cap at y 0.092, so it leaves no second line, and it
    // fades before the temples, where the face opening has already cut the hair away.
    const fringeLip = sdf
      .ellipsoid([0.2, 0.16, 0.2203])
      .at(0, 0, -0.005)
      .intersect(sdf.halfSpace([0, -1, 0], -0.057))
      .intersect(sdf.halfSpace([0, 0, -1], -0.02));
    const hairLocal = mass
      .smoothSubtract(0.012, faceOpen)
      .intersect(hem)
      .smoothUnion(0.005, fringeLip)
      .paintFn(hairPaint)
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

    // ---------------------------------------------------------------- red A-line pleated skirt
    // The waistband stays inside the shirt. The visible skirt starts under the shirt hem at
    // y 0.21 and flares to a level hem at 0.161, the point two thirds of the way from the hip
    // (y 0.205) to the knee (y 0.139). The pleats are shallow vertical grooves; a level half-space
    // cut after the displacement keeps the hem flat.
    const PLEAT_TOP = HEM_SHIRT - 0.005;
    const SKIRT_HEM = 0.161;
    const tri = (x: number, z: number) => {
      const t = ((((PLEATS * Math.atan2(x, z)) / (2 * Math.PI)) % 1) + 1) % 1;
      return 1 - 4 * Math.abs(t - 0.5);
    };
    const ramp = (y: number) => Math.min(1, Math.max(0, (PLEAT_TOP - y) / 0.01));
    const skirtBase = sdf
      .revolve(
        profile.polygon([
          [0, 0.238],
          [0.098, 0.238],
          [0.103, 0.214],
          [0.114, 0.2],
          [0.152, 0.14],
          [0, 0.14],
        ]),
      )
      .scale([1, 1, 0.86]);
    const skirt = skirtBase
      .displace(0.004, (x, y, z) => ramp(y) * tri(x, z))
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.fold), 0.45 * ramp(y) * (0.5 - 0.5 * tri(x, z))))
      .intersect(sdf.halfSpace([0, -1, 0], -SKIRT_HEM))
      .bone('hips');
    k.body('skirt', skirt, { color: C.skirt, roughness: 0.85, detail: 0.003, textureDensity: 2, maxError: 0.003 });

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
