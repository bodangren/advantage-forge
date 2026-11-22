import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';
import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';
import type { HumanoidShape } from './parts/humanoid-kind.js';
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

// Lily's face detail (Daniel 2026-11-22: more detail in the faces), matched to
// docs/sprout-mockups/lily.jpg. Paint only: the shared stencils and every other
// kind user keep today's geometry and paint, so their GLBs stay byte-identical.
const FACE = {
  irisDark: '#452714',
  irisLow: '#7a4a26',
  pupil: '#141a18',
  mouth: '#7e2a2e',
  teeth: '#fbf8f0',
  tongue: '#e88a9a',
  freckle: '#b06a48',
  noseShade: '#d89a78',
};

/** Lily's face over the shared paint: dark round iris, open toothy smile, soft brows, nose shade, freckles. */
const lilyFace = (skin: sdf.Shape, h: HumanoidShape): sdf.Shape => {
  const pair = (s: sdf.Shape) => s.mirror('x', 0);
  const [EX, EY] = h.joints.EYE;
  const smileY = AGE5.face.smileY;
  const browY = AGE5.face.browY;

  // Dark round iris over the shared amber one, a warm low arc, the pupil, and one
  // big catchlight: the reference eye is deep brown with a single bright spark.
  const dark = pair(h.onFace(sdf.ellipsoid([0.037, 0.044, 0.07]), EX, EY - 0.006));
  const low = dark.intersect(sdf.halfSpace([0, 1, 0], EY - 0.008));
  const pupil = pair(h.onFace(sdf.ellipsoid([0.026, 0.029, 0.07]), EX, EY + 0.004));
  const big = pair(h.onFace(sdf.sphere(0.012), EX + 0.015, EY + 0.018));
  const small = pair(h.onFace(sdf.sphere(0.005), EX - 0.013, EY - 0.02));

  // The shared brow band is long and heavy; cover it with skin and paint a shorter,
  // thinner, softer arc in the same place (the reference brow is short and light).
  // The cover matches the shared stencil exactly, so no skin margin shows.
  const cover = pair(sdf.extrude(profile.arc(0.1, 0.024, 58, 122), 0.3).at(0.1, browY - 0.1, 0.1));
  const brow = pair(sdf.extrude(profile.arc(0.068, 0.013, 64, 116), 0.3).at(0.1, browY - 0.1, 0.1));

  // An open happy smile with an upper teeth band and a tongue, Lily-wide: smaller
  // and rounder than Tom's laugh, the teeth tucked inside the mouth corners.
  const s = 0.88;
  const outline = profile.polygon(
    (
      [
        [-0.052, 0.014],
        [-0.026, 0.006],
        [0, 0.004],
        [0.026, 0.006],
        [0.052, 0.014],
        [0.044, -0.012],
        [0.018, -0.03],
        [-0.018, -0.03],
        [-0.044, -0.012],
      ] as [number, number][]
    ).map(([x, y]): [number, number] => [x * s, y * s]),
    { smooth: true },
  );
  const tooth = profile.polygon(
    (
      [
        [-0.052, 0.014],
        [-0.026, 0.006],
        [0, 0.004],
        [0.026, 0.006],
        [0.052, 0.014],
        [0.044, -0.012],
        [0.018, -0.03],
        [-0.018, -0.03],
        [-0.044, -0.012],
      ] as [number, number][]
    ).map(([x, y]): [number, number] => [x * 0.72, y * 0.72]),
    { smooth: true },
  );
  const mouth = sdf.extrude(outline, 0.3).at(0, smileY, 0.1);
  const teeth = sdf.extrude(tooth, 0.3).at(0, smileY + 0.002, 0.1).intersect(sdf.halfSpace([0, -1, 0], -(smileY - 0.003)));
  const tongue = mouth.intersect(sdf.ellipsoid([0.022, 0.011, 0.5]).at(0, smileY - 0.024, 0.1));

  // A soft shade under the small nose and a scatter of freckles over the nose bridge.
  const shade = sdf.ellipsoid([0.02, 0.008, 0.05]).at(0, AGE5.face.noseY - 0.018, h.faceZ(0, AGE5.face.noseY - 0.018));
  const dots: [number, number][] = [
    [-0.03, 0.012],
    [-0.014, 0.02],
    [0.004, 0.014],
    [0.022, 0.02],
    [0.038, 0.01],
    [-0.048, 0.004],
    [0.052, 0.002],
  ];
  const freckles = sdf.union(...dots.map(([dx, dy]) => h.onFace(sdf.sphere(0.0026), dx, AGE5.face.noseY + dy)));

  return skin
    .paintWhere(dark, FACE.irisDark, 0.006)
    .paintWhere(low, FACE.irisLow, 0.008)
    .paintWhere(pupil, FACE.pupil)
    .paintWhere(big, '#ffffff')
    .paintWhere(small, '#ffffff')
    .paintWhere(cover, h.tint.skin!)
    .paintWhere(brow, h.tint.brow!)
    .paintWhere(mouth, FACE.mouth, 0.001)
    .paintWhere(tongue, FACE.tongue, 0.002)
    .paintWhere(teeth, FACE.teeth, 0.001)
    .paintWhere(shade, FACE.noseShade, 0.01)
    .paintWhere(freckles, FACE.freckle, 0.001);
};

export default humanoidAsset({
  name: 'sprout-lily',
  description: 'Lily, a seven-year-old girl: large dark-brown eyes, chin-length straight brown hair with straight bangs, a mid-blue T-shirt with a white round collar, a red pleated skirt, white mid-calf socks, and red sneakers with white laces.',
  reference: 'docs/sprout-mockups/lily.jpg',
  proportions: AGE5,
  sing: true,
  sproutFace: true,
  sproutHands: true,
  handClearance: 0.04,
  paintSkin: (skin, h) => lilyFace(skin, h),
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
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ---------------------------------------------------------------- hair: one smooth chin-length bob
    // Local frame: y 0 is the head center (eyes at -0.047, brows at +0.047, mouth at -0.145).
    // One smooth revolve draws the whole bob: a close dome, straight sides over the ears (the ear
    // reaches x 0.2264), and a blunt chin-length hem. There is no separate cap, so no mushroom
    // shelf, and the Catmull-Rom profile removes the stepped bands of the old faceted polygon.
    const bob = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.212],
            [0.075, 0.206],
            [0.145, 0.182],
            [0.192, 0.135],
            [0.216, 0.07],
            [0.227, 0.01],
            [0.229, -0.045],
            [0.225, -0.095],
            [0.202, -0.14],
            [0.196, -0.19],
            [0.19, -0.24],
            [0, -0.24],
            [0, -0.1],
            [0, 0.1],
            [0, 0.205],
          ],
          { smooth: true, samples: 10 },
        ),
      )
      .scale([1, 1, 0.9]);
    // A large ellipsoid cuts the face opening. Its back surface is a gentle curve, not a flat
    // wall: z -0.01 at the jaw and ear band, and at most +0.016 at the fringe. The curve stays far
    // behind the chin front (z +0.14), so the jaw reads clean.
    // Five rounded bangs replace the old straight visor edge. Each lock is a soft Gaussian dip in
    // the cut line: the peak lowers the hair (a lock tip) and the gaps leave it short. The peaks
    // differ in width and depth so the fringe reads as loose locks, not a comb. All tips stay above
    // the brows at y +0.047, so the eyes and the raised-hand clips stay clear.
    const bangLocks = [
      [-0.152, 0.030, 0.70],
      [-0.076, 0.026, 1.00],
      [0.0, 0.032, 0.84],
      [0.076, 0.026, 0.96],
      [0.152, 0.030, 0.68],
    ] as const;
    const fringeLocks = (x: number): number => {
      let d = 0;
      for (const [cx, w, peak] of bangLocks) {
        const t = (x - cx) / w;
        d += peak * Math.exp(-t * t);
      }
      return Math.min(1, d);
    };
    const faceCut = sdf
      .ellipsoid([0.8, 0.5, 0.51])
      .at(0, -0.1, 0.5)
      .intersect(sdf.halfSpace([0, 1, 0], 0.064).displace(0.012, fringeLocks));
    // A second, lower cut reaches further back at the jaw (z -0.025) than at the cheek (z -0.01).
    // The side edge therefore curves back toward the nape instead of falling as a flat slab, so the
    // bob reads round in the side view. It stays behind the ear plane at every height.
    const jawCut = sdf.ellipsoid([0.8, 0.19, 0.525]).at(0, -0.185, 0.5);
    const faceWindow = sdf.smoothUnion(0.02, faceCut, jawCut);
    // The blunt cut: level at the chin in front and a little longer at the nape behind.
    const hem = sdf.halfSpace([0, -1, 0.065], 0.1846);
    const hairPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const low = Math.max(0, (-0.14 - y) * 6) * 0.12; // a soft darkening at the hem
      // A warm lift on the thin cut edge: the shell wall caught the light badly and read as a dark
      // inner rim along the cheeks and under the bangs. Lift only the narrow band at the cut.
      const yTop = 0.064 - 0.012 * fringeLocks(x);
      const bangEdge = Math.max(0, 1 - Math.abs(y - yTop) / 0.014) * Math.min(1, Math.max(0, (z - 0.04) / 0.08));
      const cheekEdge = Math.max(0, 1 - Math.abs(z + 0.018) / 0.028)
        * Math.max(0, 1 - Math.abs(y + 0.09) / 0.13)
        * Math.min(1, Math.max(0, (Math.abs(x) - 0.09) / 0.06));
      const edge = Math.max(bangEdge, cheekEdge);
      // Strand separations combed into the fringe: five soft vertical grooves where the
      // reference parts the bangs. Front only, so the side panels stay smooth.
      let groove = 0;
      for (const gx of [-0.108, -0.054, 0, 0.054, 0.108]) {
        const t = (x - gx) / 0.007;
        groove += Math.exp(-t * t);
      }
      const fringeBand = Math.min(1, Math.max(0, (y + 0.03) / 0.03)) * Math.min(1, Math.max(0, (yTop - y) / 0.02 + 1));
      const strand = Math.min(1, groove) * fringeBand * (z > 0.08 ? 0.16 : 0);
      return mixRgb(mixRgb(mixRgb(base, rgb('#3a1e10'), low), rgb('#8b5535'), 0.3 * edge), rgb('#3a1e10'), strand);
    };
    // No separate fringe lip. Hollow the bob into a thin shell, so the cut edge is thin too. The
    // original shell (0.93 scale, 0.006 m fillet) stays: a thinner shell opened tiny slivers at the
    // cap edge y 0.12, which read as crown speckles. The dark rim is addressed by the warm lift in
    // `hairPaint` instead. The outer surface stays one smooth mass.
    const inner = bob
      .scale([0.93, 1, 0.93])
      .intersect(sdf.halfSpace([0, 1, 0], 0.12));
    const hairShell = bob.subtract(inner);
    const hairLocal = hairShell
      .smoothSubtract(0.006, faceWindow)
      .intersect(hem)
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
    sproutGestures(k, h, P, { handClearance: 0.04 });
  },
});
