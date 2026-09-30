import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Sailor — Chibi Quest hero (catalog `heroes/support/sailor`), about 0.98 m to the top of the cap,
 * faces +Z. Target: docs/hero-mockups/sailor_001.jpg. Built on the adventurer's head, face, and
 * skeleton (knee bones included), so the heroes read as one set.
 *
 * Role: player hero (support), seen in 3D and as a 128 px sprite; the cap, the stripes, and the
 *   red neckerchief read.
 * One idea: a cheerful boy in a big blue knit cap worn back, a blue and white striped shirt, a red
 *   neckerchief, a rope over one shoulder, and a cutlass held low, barefoot.
 * Proportions: cap top 0.98, cuff 0.74 to 0.82, eyes 0.63, chin 0.48, shoulders 0.385, belt 0.25,
 *   trouser cuffs 0.11, bare feet on the ground.
 * Shape language: round and soft (cap, face, feet, rope) with the curved cutlass as the sharp accent.
 * Palette (60/30/10): white trousers and stripes #f4f0e8, blue cap and shirt #4a8ac0 / #3f6a9a,
 *   brown belt #6b4226; the red neckerchief #c93a32 is the accent under the face.
 * Value plan: the dark hair frames the light face; the blue cap is the top mass; the red
 *   neckerchief is the strongest color accent.
 * Bodies: skin, cap, hair, shirt, collar, trousers, neckerchief, belt, steel, rope, feet, cutlass,
 *   hilt (guard, pommel, grip).
 * Rig: the adventurer's chibi skeleton without `knot` and `lantern`; the cutlass is rigid on the
 *   right hand. Clips: idle, walk, run, attack (a cutlass slash), attack2 (a rope-swing hop: a
 *   crouch, a hop, a landing chop), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2a1409',
  iris: '#553018',
  irisLow: '#7a4a24',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#3a2418',
  mouth: '#7a2a2a',
  teeth: '#fbf5ee',
  tongue: '#e0706a',
  hair: '#3a2418',
  hairLight: '#5a3826',
  hairDark: '#1e1008',
  cap: '#3a8ad0',
  capDark: '#2a6aa0',
  stripe: '#3f6a9a',
  white: '#f4f0e8',
  red: '#c93a32',
  redDark: '#992a24',
  trousers: '#ece8dc',
  fold: '#c8c4b8',
  belt: '#6b4226',
  beltDark: '#4a2c18',
  steel: '#a8acb1',
  blade: '#c3c8cf',
  bladeDark: '#8f959e',
  brass: '#c9a24a',
  grip: '#3a2a20',
  rope: '#c9a878',
  ropeDark: '#9c7c4c',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => scl(a, 1 / Math.hypot(a[0], a[1], a[2]));
const along = (p: V3, d: V3, s: number): V3 => add(p, scl(d, s));
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** `b` without its component along the unit vector `a`, normalized. */
const perp = (b: V3, a: V3): V3 => norm(sub(b, scl(a, dot(a, b))));
/** Places a shape built in a local frame: local X, Y, Z go to `ex`, `ey`, `ez`; the origin to `p`. */
const frame = (s: sdf.Shape, ex: V3, ey: V3, ez: V3, p: V3) => s.transform([...ex, 0, ...ey, 0, ...ez, 0, ...p, 1]);

// Joints: the adventurer's shoulders and legs. The right forearm hangs a little forward with the
// cutlass, the left hangs relaxed with an empty fist.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW_R: V3 = [-0.18, 0.332, 0.0];
const WRIST_R: V3 = [-0.2, 0.236, 0.025];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)

// The cutlass: the grip center sits in the right fist; at rest the blade points forward and low.
// Its frame: the tip direction, the flat's normal (toward his right), and the edge line.
const FIST_R = along(WRIST_R, norm(sub(WRIST_R, ELBOW_R)), 0.04);
const BLADE_DIR = norm([-0.18, -0.3, 0.85]);
const FLAT = perp([-1, 0, 0.1], BLADE_DIR);
const EDGE = cross(FLAT, BLADE_DIR);
const swordPose = (s: sdf.Shape) => frame(s, EDGE, scl(BLADE_DIR, -1), FLAT, FIST_R);

// The empty left fist: closed around an imaginary grip that runs front to back.
const FIST_L = along(WRIST, norm(sub(WRIST, ELBOW)), 0.04);
const LEFT_AXIS = norm([0.3, 0.05, 1]);

/** A fist closed around a grip through `g` along the unit axis `a`, entered from the wrist `w`. */
const fistAround = (g: V3, a: V3, w: V3) => {
  const toW = perp(sub(w, g), a);
  const side = cross(a, toW);
  const o = (u: number, v: number, s: number): V3 => add(add(add(g, scl(a, u)), scl(toW, v)), scl(side, s));
  return sdf.smoothUnion(
    0.012,
    sdf.capsule(o(0.012, 0.006, 0), o(-0.01, 0.006, 0), 0.034), // the palm around the grip
    sdf.capsule(o(0.016, -0.018, 0.004), o(-0.016, -0.018, 0.004), 0.02), // the finger roll
    sdf.cone(o(0.004, 0.012, 0.026), o(0.02, -0.004, 0.024), 0.015, 0.012), // the thumb over the grip
  );
};

export default defineAsset({
  name: 'sailor',
  description:
    'Chibi sailor hero in a blue knit cap worn back, a striped shirt with a square collar and a red neckerchief, a rope over the shoulder, white rolled trousers, bare feet, and a cutlass.',
  detail: 0.005,
  reference: 'docs/hero-mockups/sailor_001.jpg',
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#231a17', blond: '#c4974a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { blue: C.stripe, red: '#a83a32', green: '#2e7a5c' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', clothing: 'blue' },
    red: { eyes: 'blue', hair: 'black', skin: 'tan', clothing: 'red' },
    green: { eyes: 'green', hair: 'blond', skin: 'brown', clothing: 'green' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairLight: k.tint('hair', { color: C.hairLight, follow: 1 }),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      shirt: k.tint('clothing'),
      cap: k.tint('clothing', { color: C.cap, follow: 1 }),
      capDark: k.tint('clothing', { color: C.capDark, follow: 1 }),
    };

    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.024, 0.02, 0.018]).at(0, 0.572, faceZ(0, 0.572) - 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.032, 0.05, 0.034])
        .subtract(sdf.sphere(0.02).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.612, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
      fistAround(FIST_L, LEFT_AXIS, WRIST).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAround(FIST_R, BLADE_DIR, WRIST_R).bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.05, 0.053, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.046, 0.05, 0.07]), EYE[0], EYE[1] - 0.002));
    const iris = pair(at(sdf.ellipsoid([0.041, 0.046, 0.07]), EYE[0], EYE[1] - 0.003));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.022));
    const pupil = pair(at(sdf.ellipsoid([0.025, 0.029, 0.07]), EYE[0], EYE[1] - 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.053, 0.009, 24, 156), 0.3).at(EYE[0], EYE[1] - 0.006, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.0085), x + 0.014, EYE[1] + 0.017),
      ]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.022, 62, 116), 0.3).at(0.102, 0.725 - 0.1, 0.1));
    // A soft closed smile: a thin curved line, no teeth.
    const SMILE_R = 0.04;
    const mouth = sdf.extrude(profile.arc(SMILE_R, 0.011, 238, 302), 0.3).at(0, 0.548 + SMILE_R, 0.1);
    const blush = pair(at(sdf.sphere(0.04), 0.142, 0.562));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ the knit beret, worn back
    // A flat, wide crown (a squashed ellipsoid about 0.24 x 0.09 x 0.24) on a short skirt that ends
    // in a rolled band 0.027 m thick, tilted back 15 degrees so the front edge rides high and the
    // forehead shows under a thick fringe. A fine knit grid lives in the bump.
    const CAP_AT: V3 = [0, 0.785, -0.03];
    const CAP_TILT = -15;
    const capPose = (s: sdf.Shape) => s.rotateX(CAP_TILT).at(...CAP_AT);
    const TAN15 = Math.tan((15 * Math.PI) / 180);
    const crown = sdf.ellipsoid([0.25, 0.085, 0.25]).at(0, 0.095, 0);
    const skirt = sdf.revolve(profile.polygon([[0, -0.004], [0.2, -0.004], [0.236, 0.05], [0, 0.05]]));
    const band = sdf.torus(0.2, 0.0135).at(0, 0.0, 0).scale([1, 1, 1.02]);
    const capSolid = sdf.smoothUnion(0.02, crown, skirt).smoothUnion(0.008, band);
    const capWorld = capPose(capSolid);
    const capGrooveAng = (x: number, z: number) => Math.atan2(x, z - CAP_AT[2]);
    const capLocalY = (y: number, z: number) => (y - (CAP_AT[1] + (z - CAP_AT[2]) * TAN15)) * 0.966;
    const cap = capWorld.paintFn((x, y, z, base) => {
      const ly = capLocalY(y, z);
      // The rolled band and its seam are darker.
      if (ly < 0.022) return rgb(C.capDark);
      return Math.abs(Math.sin(capGrooveAng(x, z) * 6)) < 0.06 && ly > 0.05 ? rgb(C.capDark) : base;
    });
    k.body('cap', cap.bone('head'), {
      color: T.cap,
      roughness: 0.95,
      bump: (x, y, z) => {
        const ly = capLocalY(y, z);
        const ang = capGrooveAng(x, z);
        // A fine knit grid: stitches in rows and columns.
        const col = Math.max(0, Math.sin(ang * 96));
        const row = Math.max(0, Math.sin(ly * 420));
        return 0.002 * (col * 0.5 + row * 0.5);
      },
    });

    // ------------------------------------------------------------------ hair: thick locks under the cap
    // A volume under the cap (cut by it), big side locks over the ears, short nape points, and three
    // thick fringe locks swept across the forehead from under the cap's front.
    const DEG = Math.PI / 180;
    const faceMask = sdf.ellipsoid([0.235, 0.16, 0.22]).at(0, 0.61, 0.15);
    const volume = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.018, HEAD[2] + 0.018]).at(0, HEAD_Y + 0.008, -0.01),
        sdf.ellipsoid([0.19, 0.085, 0.175]).rotateZ(6).at(-0.01, 0.852, -0.012),
      )
      .smoothSubtract(0.015, faceMask);
    const HC: V3 = [0, 0.7, -0.01];
    const hs = (th: number, ph: number, lift = 0): V3 => {
      const d: V3 = [Math.sin(th * DEG) * Math.sin(ph * DEG), Math.cos(th * DEG), Math.sin(th * DEG) * Math.cos(ph * DEG)];
      const hit = sdf.raycast(volume, along(HC, d, 0.6), scl(d, -1))!;
      return along(hit, d, lift);
    };
    const grooves = sdf.union(
      ...[-130, -100, -72, 72, 100, 130, 160, 185, 210].map((g, i) =>
        sdf.chain(
          [
            [...hs(68, g, 0), 0.008],
            [...hs(88, g + 4, 0), 0.011],
            [...hs(112 + (i % 2) * 6, g + 8, 0), 0.008],
            [...hs(132, g + 10, 0), 0.005],
          ],
          0.004,
        ),
      ),
    );
    // Short points at the nape, under the cuff.
    const nape = sdf.union(
      ...[150, 172, 194, 216].map((ph, i) =>
        sdf.chain(
          [
            [...hs(116, ph + 12, -0.012), 0.032],
            [...hs(134, ph + 14, 0.006), 0.024],
            [...hs(152 - (i % 2) * 6, ph + 18, 0.02), 0.007],
          ],
          0.01,
        ),
      ),
    );
    const sideburns = pair(sdf.cone([0.19, 0.72, 0.03], [0.198, 0.61, 0.064], 0.032, 0.011));
    const fz = (x: number, y: number, lift: number): V3 => [x, y, faceZ(Math.abs(x), y) + lift];
    const fringe = sdf.union(
      // Four thick locks (r about 0.024) over the brow, swept toward his left from under the band.
      ...[
        [-0.09, 0.745, 0.029],
        [-0.03, 0.75, 0.027],
        [0.03, 0.74, 0.026],
        [0.09, 0.73, 0.024],
      ].map(([x0, yTip, r]) =>
        sdf.chain(
          [
            [...fz(x0!, 0.835, -0.02), r! * 1.25],
            [...fz(x0! + 0.004, 0.795, 0.012), r!],
            [...fz(x0! + 0.03, 0.765, 0.024), r! * 0.78],
            [...fz(x0! + 0.052, yTip!, 0.022), 0.008],
          ],
          0.012,
        ),
      ),
      // The side lock over his left temple, into the sideburn.
      sdf.chain(
        [
          [...fz(0.11, 0.8, -0.016), 0.036],
          [...fz(0.15, 0.765, 0.0), 0.03],
          [...fz(0.172, 0.715, 0.01), 0.022],
          [...fz(0.182, 0.66, 0.02), 0.009],
        ],
        0.012,
      ),
      // And one over his right temple.
      sdf.chain(
        [
          [...fz(-0.11, 0.8, -0.016), 0.036],
          [...fz(-0.15, 0.765, 0.0), 0.03],
          [...fz(-0.172, 0.715, 0.01), 0.022],
          [...fz(-0.182, 0.66, 0.02), 0.009],
        ],
        0.012,
      ),
    );
    const hair = volume
      .smoothUnion(0.02, sideburns)
      .smoothSubtract(0.004, capWorld.round(0.001))
      .smoothUnion(0.012, nape)
      .smoothSubtract(0.005, grooves)
      .paintWhere(grooves.round(0.003), T.hairDark, 0.006)
      .smoothUnion(0.01, fringe)
      .paintFn((x, y, z, base) => {
        if (base[0] + base[1] + base[2] === 0) return base;
        const top = Math.min(1, Math.max(0, (y - 0.73) / 0.07)) * 0.6;
        const l = rgb(T.hairLight);
        return [base[0] + (l[0] - base[0]) * top, base[1] + (l[1] - base[1]) * top, base[2] + (l[2] - base[2]) * top];
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.0035, bone: 'head' });

    // ------------------------------------------------------------------ shirt: blue and white stripes
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.124, 0.29],
            [0.13, 0.25],
            [0.138, 0.21],
            [0.14, 0.196],
            [0.13, 0.186],
            [0, 0.186],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const white = rgb(C.white);
    const torsoStriped = torso.paintFn((_x, y, _z, base) => (Math.floor((y - 0.186) / 0.036) % 2 !== 0 ? white : base));
    const sleeve = (s: V3, e: V3, tag: string) => {
      const a0 = lerp(s, e, 0.9);
      const d = norm(sub(e, s));
      return sdf
        .smoothUnion(
          0.012,
          sdf
            .cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 1.02), 0.048, 0.045)
            .paintFn((x, y, z, base) => (Math.floor((dot(sub([x, y, z], s), d) + 0.03) / 0.022) % 2 !== 0 ? white : base)),
          sdf.cone(a0, lerp(s, e, 1.12), 0.05, 0.05).round(0.004).paint(C.white), // rolled cuff
        )
        .bone(tag);
    };
    const shirt = sdf.union(torsoStriped.bone('spine'), sleeve(SHOULDER, ELBOW, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'));
    k.body('shirt', shirt, { color: T.shirt, roughness: 0.85 });

    // The square sailor collar: a shell panel over the shoulders with two front points and a flat
    // panel down the back, each with a white edge stroke.
    const collarShell = torso.round(0.013).subtract(torso.round(-0.002));
    const frontOutline = profile.polygon([
      [-0.122, 0.446],
      [-0.066, 0.478],
      [0, 0.41],
      [0.066, 0.478],
      [0.122, 0.446],
      [0, 0.352],
    ]);
    const backOutline = profile.polygon([
      [-0.092, 0.46],
      [0.092, 0.46],
      [0.1, 0.372],
      [-0.1, 0.372],
    ]);
    const edgeOf = (p: ReturnType<typeof profile.polygon>) => sdf.extrude(p, 0.5).subtract(sdf.extrude(profile.offsetProfile(p, -0.008), 0.5));
    const frontCollar = collarShell.intersect(sdf.extrude(frontOutline, 0.5)).intersect(sdf.halfSpace([0, 0, -1], 0.0));
    const backCollar = collarShell.intersect(sdf.extrude(backOutline, 0.5)).intersect(sdf.halfSpace([0, 0, 1], -0.0));
    const collar = sdf
      .union(frontCollar, backCollar)
      .paintWhere(sdf.union(edgeOf(frontOutline), edgeOf(backOutline)), C.white, 0.002);
    k.body('collar', collar.bone('spine'), { color: T.shirt, roughness: 0.85, detail: 0.005 });

    // The red neckerchief: a ring around the neck, a V point on the chest, a knot, and two tails.
    const scarfRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.05, 0.5],
            [0.09, 0.494],
            [0.124, 0.472],
            [0.134, 0.45],
            [0.112, 0.436],
            [0.08, 0.457],
            [0.05, 0.47],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    const scarfShell = torso.round(0.016).subtract(torso.round(-0.002));
    const scarfV = scarfShell.intersect(
      sdf.extrude(
        profile.polygon([
          [-0.1, 0.475],
          [0.1, 0.475],
          [0.022, 0.4],
          [-0.022, 0.4],
        ]),
        0.5,
      ),
    ).intersect(sdf.halfSpace([0, 0, -1], 0.0));
    const KNOT_P = sdf.surfacePoint(torso.round(0.016), [0, 0.425, 0.2], 0.004);
    const knot = sdf.ellipsoid([0.03, 0.026, 0.024]).at(KNOT_P[0], 0.42, KNOT_P[2] + 0.006);
    const tail = (polyPts: [number, number][]) =>
      sdf.extrude(profile.polygon(polyPts), 0.5);
    const tails = scarfShell
      .round(0.004)
      .intersect(
        sdf.union(
          tail([
            [0.0, 0.43],
            [0.034, 0.41],
            [0.056, 0.33],
            [0.028, 0.322],
            [0.008, 0.375],
          ]),
          tail([
            [0.0, 0.43],
            [-0.03, 0.41],
            [-0.044, 0.34],
            [-0.014, 0.352],
            [-0.004, 0.385],
          ]),
        ),
      )
      .intersect(sdf.halfSpace([0, 0, -1], 0.0));
    const scarf = sdf
      .smoothUnion(0.01, scarfRing, scarfV, knot, tails)
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 11 + y * 50) > 0.8 || Math.abs(Math.sin((x * 1.0 + y) * 160)) > 0.96 && y < 0.42 ? rgb(C.redDark) : base));
    k.body('neckerchief', scarf.bone('chest'), { color: C.red, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ white trousers rolled at the calf
    const LEG_TOP = 0.2;
    const foldLines = (cx: number) => (x: number, y: number, z: number, base: readonly [number, number, number]) => {
      const a = Math.atan2(z - 0.004, x - cx);
      const wob = Math.sin(y * 38) * 0.25;
      if (y < 0.135 && y > 0.09 && Math.abs(y - 0.127) < 0.0035) return rgb(C.fold); // the cuff's upper seam
      if (y > 0.13 && Math.abs(Math.sin(a * 3 + wob)) > 0.965) return rgb(C.fold);
      return base;
    };
    const trouserLeg = sdf
      .smoothUnion(
        0.012,
        sdf.capsule([HIP[0], LEG_TOP, 0], [0.096, 0.125, 0.004], 0.06),
        sdf.torus(0.056, 0.022).at(0.096, 0.108, 0.004), // the rolled cuff
        sdf.cylinder(0.06, 0.03, 0.012).at(0.096, 0.108, 0.004),
      )
      .paintFn(foldLines(0.096))
      .bone('leg.L');
    const trousers = sdf
      .smoothUnion(0.03, sdf.ellipsoid([0.122, 0.058, 0.09]).at(0, 0.205, 0).bone('hips'), pair(trouserLeg))
      .paintFn((x, y, z, base) => {
        // Crotch and hip creases on the front.
        if (y > 0.13 && z > 0.05 && Math.abs(x) < 0.04 && Math.abs(Math.abs(x) - 0.012) < 0.0028) return rgb(C.fold);
        return base;
      });
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });

    // ------------------------------------------------------------------ belt and buckle
    const beltY = 0.245;
    const belt = torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.belt, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.066, 0.056, 0.014], 0.007).subtract(sdf.box([0.04, 0.032, 0.03], 0.006)), sdf.box([0.009, 0.036, 0.01], 0.003).at(0.004, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    k.body('steel', buckle.bone('spine'), { color: C.steel, roughness: 0.35, metalness: 0.85 });

    // ------------------------------------------------------------------ the rope: a braided bandolier, a hip coil, and a holster
    // Two loops run from the right shoulder across the chest to the left hip; a two-turn coil hangs
    // at the left hip, and a leather holster tube for the cutlass hangs at the right hip.
    const ROPE_R = 0.02;
    const ropeLoop = (R: number, shift: number) =>
      sdf
        .torus(R, ROPE_R)
        .scale([1, 1, 0.8])
        .rotateZ(-41)
        .at(shift * 0.7, 0.345 - shift * 0.7, 0);
    const COIL_AT = sdf.surfacePoint(belt, [0.095, beltY - 0.04, 0.3], 0);
    const COIL_AXIS = norm([0.5, 0, 0.87]);
    const coilTurn = (R: number, off: number) =>
      sdf
        .torus(R, 0.0175)
        .rotateX(90)
        .rotateY(30)
        .at(...along([COIL_AT[0], beltY - 0.05, COIL_AT[2]], COIL_AXIS, 0.03 + off));
    const braidS = (x: number, y: number) => 0.755 * x - 0.656 * y;
    const braidP = (x: number, y: number) => 0.656 * x + 0.755 * y;
    const rope = sdf
      .union(ropeLoop(0.148, 0), ropeLoop(0.144, -0.046), coilTurn(0.045, 0), coilTurn(0.043, 0.032))
      .paintFn((x, y, _z, base) => (Math.sin(braidS(x, y) * 300 + braidP(x, y) * 140) > 0.45 ? rgb(C.ropeDark) : base));
    k.body('rope', rope.bone('spine'), {
      color: C.rope,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y) => 0.0022 * Math.sin(braidS(x, y) * 300 + braidP(x, y) * 140),
    });
    const holsterAt = sdf.surfacePoint(belt, [-0.105, beltY - 0.03, 0.3], 0.022);
    const holster = sdf
      .union(
        sdf.cylinder(0.026, 0.14, 0.01).subtract(sdf.cylinder(0.016, 0.07).at(0, 0.05, 0)),
        sdf.box([0.07, 0.03, 0.05], 0.008).at(0, 0.07, 0).paint(C.beltDark), // the collar at the mouth
      )
      .rotateX(-12)
      .rotateZ(8)
      .at(holsterAt[0], holsterAt[1] - 0.05, holsterAt[2]);
    k.body('holster', holster.bone('spine'), { color: C.belt, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ bare feet
    const foot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.043, 0.14, 0.012).at(0, 0.07, 0),
        sdf.ellipsoid([0.05, 0.034, 0.096]).at(0, 0.034, 0.048),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeSpec: [number, number, number][] = [
      // [x (inner to outer), radius, extra forward]
      [-0.032, 0.0165, 0.0],
      [-0.0135, 0.0115, 0.003],
      [0.004, 0.0105, 0.0],
      [0.02, 0.0095, -0.004],
      [0.034, 0.0085, -0.011],
    ];
    const toes = sdf.union(
      ...toeSpec.map(([x, r, dz]) => {
        const f = Math.sqrt(Math.max(0.05, 1 - (x / 0.055) ** 2));
        return sdf.sphere(r).at(x, r * 0.95, 0.048 + 0.088 * f + dz);
      }),
    );
    const footWithToes = foot.smoothUnion(0.006, toes);
    const feet = footWithToes
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('feet', pair(feet), { color: T.skin, roughness: 0.55, detail: 0.004, textureDensity: 1.5 });

    // ------------------------------------------------------------------ the cutlass in the right fist
    // Local frame: the grip center at the origin, the pommel up (+Y), the blade down (-Y), the
    // blade's width along X (the cutting edge toward +X) and its flat facing +Z.
    const BL0 = 0.045;
    const BLEN = 0.322;
    const steps = 14;
    const bend = (t: number) => 0.07 * t * t; // the blade curves toward the edge
    const back: [number, number][] = [];
    const edge: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = -(BL0 + BLEN * t);
      const taper = t < 0.78 ? 1 : Math.sqrt(Math.max(0, 1 - ((t - 0.78) / 0.22) ** 2));
      const c = bend(t);
      back.push([c - 0.019 * taper, y]);
      edge.push([c + (0.02 + 0.007 * Math.sin(Math.min(1, t / 0.6) * Math.PI * 0.5)) * taper, y]);
    }
    const bladeOutline: [number, number][] = [...back, ...edge.reverse().slice(1)];
    const bladeLocal = sdf
      .extrude(profile.polygon(bladeOutline, { smooth: true, samples: 3 }), 0.015, 0.004)
      .paintWhere(sdf.box([0.007, 0.26, 0.1], 0.003).at(0.0, -0.19, 0).rotateZ(0), C.bladeDark, 0.003);
    k.body('cutlass', swordPose(bladeLocal), { color: C.blade, roughness: 0.3, metalness: 0.9, detail: 0.003, bone: 'hand.R' });
    // The brass cup guard: a bowl that opens toward the hand, with a short crossbar.
    const cup = sdf
      .sphere(0.04)
      .subtract(sdf.sphere(0.032))
      .intersect(sdf.halfSpace([0, 1, 0], 0.0))
      .at(0, -0.032, 0);
    const bar = sdf.capsule([-0.046, -0.04, 0], [0.046, -0.04, 0], 0.0095);
    const pommel = sdf.sphere(0.021).at(0, 0.075, 0);
    const grip = sdf
      .cylinder(0.0145, 0.1, 0.004)
      .at(0, 0.03, 0)
      .paint(C.grip)
      .paintFn((_x, y, z, base) => (Math.sin(y * 320 + z * 20) > 0.55 ? rgb(C.beltDark) : base));
    k.body('hilt', swordPose(sdf.union(cup, bar, pommel.paint(C.brass), grip)), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.0035, bone: 'hand.R' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, edgeUp } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const BLADE = { dir: BLADE_DIR, up: FLAT };
    type P = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        // The sword tip bobs a little, as if he is eager to use it.
        'hand.R': { rotate: [-4 * bump(p, 1, 0.2), 0, 0] },
      }),
    });

    // The legs come from motion.gait: planted stance feet, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `lift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `hop` the hips bob. The heel and
    // the toe are the ends of the boot's sole at y = 0.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, { // left heel strike at 0.25, with the left arm back
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.093, 0, -0.021],
          toe: [0.108, 0, 0.087],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The bandana tails stream back and the lantern swings, both a little after the steps.
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          // The sword arm swings less and holds the blade up a little, clear of the ground.
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -8] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03));

    // ---------------------------------------------------------------- attack: a stepping diagonal slash
    // The wrist and the blade follow keys in the chest's rest frame. Wind-up: the blade rises up
    // and back over his right shoulder while the chest turns away and the map hand reaches toward
    // the foe (hold). Strike: the hips and chest turn in, the right foot steps forward, and the
    // blade cuts down and across the space in front of him to his low left, edge first.
    const slashBlade = [
      [0, BLADE_DIR],
      [0.14, norm([-0.6, 0.25, 0.75])], // out to the right and rising
      [0.28, norm([-0.6, 0.7, -0.38])], // up, out, and back over the right shoulder
      [0.38, norm([-0.55, 0.72, -0.42])], // the hold at the top, clear of the head
      [0.45, norm([-0.05, 0.85, 0.5])], // over the shoulder toward the front
      [0.5, norm([0.4, 0.3, 0.87])], // forward and a little up, across the front
      [0.56, norm([0.75, -0.35, 0.55])], // down to the left
      [0.64, norm([0.62, -0.58, 0.53])], // follow-through, low left and still forward
      [1, BLADE_DIR],
    ] as const;
    const slashAt = (p: number) => keys(p, slashBlade, 'spline');
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.23, 0.34, 0.07]],
            [0.28, [-0.3, 0.45, 0.0]],
            [0.38, [-0.3, 0.455, 0.0]],
            [0.45, [-0.3, 0.45, 0.1]],
            [0.5, [-0.12, 0.41, 0.16]],
            [0.56, [-0.09, 0.33, 0.16]],
            [0.64, [-0.12, 0.335, 0.165]],
            [0.82, [-0.2, 0.29, 0.12]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(slashAt(p));
        const arm = reach(ARM_R, wrist, [-0.5, 0.25, -0.35]);
        const hand = orient([arm.upper, arm.lower], BLADE, { dir, up: edgeUp(slashAt, p, FLAT) });
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.42, 0.54, p) * (1 - ease(0.66, 1, p));
        // The off hand reaches toward the foe in the wind-up and swings back through the cut.
        const handL = keys(p, [
          [0, WRIST],
          [0.3, [0.17, 0.33, 0.13]],
          [0.42, [0.17, 0.33, 0.13]],
          [0.55, [0.23, 0.28, -0.07]],
          [0.7, [0.23, 0.28, -0.06]],
          [1, WRIST],
        ] as const);
        const armL = reach(ARM_L, handL, [0.5, 0.3, -0.3]);
        // The right foot steps forward in the cut; the left foot stays planted.
        const step = ease(0.4, 0.52, p) * (1 - ease(0.7, 0.98, p));
        const hipsZ = -0.012 * wind + 0.03 * cut;
        const plant = (Math.asin(Math.max(-0.9, Math.min(0.9, hipsZ / 0.13))) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, Math.max(Math.abs(plant), 20 * step)) - 0.008 * wind, hipsZ], rotate: [0, -10 * wind + 10 * cut, 0] },
          spine: { rotate: [-3 * wind + 5 * cut, -6 * wind + 4 * cut, 0] },
          chest: { rotate: [-4 * wind + 3 * cut, -22 * wind + 18 * cut, 0] },
          head: { rotate: [-3 * wind + 3 * cut, 30 * wind - 26 * cut, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: [0, 0, -15 * wind] },
          'leg.L': { rotate: [plant, 12 * wind - 14 * cut, 0] },
          'leg.R': { rotate: [plant - 26 * step, 12 * wind - 14 * cut, 0] },
          'foot.L': { rotate: [-plant * 0.5, 0, 0] },
          'foot.R': { rotate: [20 * step - 20 * bump(Math.min(1, Math.max(0, (p - 0.4) / 0.14)) * 0.5), 0, 0] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- legs on the knees
    // A planted leg reaches from the hip through the knee to an ankle target in the hips' rest
    // frame (so it moves against the hips), and the foot takes the opposite turn: `pitch` > 0
    // points the toes down, < 0 lifts them. `yaw` is the hips' turn about Y; the foot then turns
    // back by it, so it keeps pointing to world +Z.
    const FLAT_FOOT = { dir: [0, 0, 1] as V3, up: [0, 1, 0] as V3 };
    const legTo = (side: 1 | -1, ankle: V3, pitch: number, yaw = 0) => {
      const m = (v: V3): V3 => (side > 0 ? v : mx(v));
      const a = (pitch * Math.PI) / 180;
      const c = Math.cos(-yaw * DEG), s = Math.sin(-yaw * DEG);
      const want = { dir: [Math.cos(a) * s, -Math.sin(a), Math.cos(a) * c] as V3, up: [Math.sin(a) * s, Math.cos(a), Math.sin(a) * c] as V3 };
      if (Math.hypot(ankle[0] - ANKLE[0], ankle[1] - ANKLE[1], ankle[2] - ANKLE[2]) < 1e-6) {
        return { leg: [0, 0, 0] as V3, shin: [0, 0, 0] as V3, foot: orient([], FLAT_FOOT, want) };
      }
      const { upper, lower } = reach({ root: m(HIP), mid: m(KNEE), end: m(ANKLE) }, m(ankle), m([KNEE[0], KNEE[1], 0.3]));
      return { leg: upper, shin: lower, foot: orient([upper, lower], FLAT_FOOT, want) };
    };
    // A world point into the hips' rest frame, for hips that move by `move` and turn by `yaw`
    // degrees about their vertical axis (x = z = 0).
    const intoHips = (w: V3, move: V3, yaw: number): V3 => {
      const c = Math.cos(-yaw * DEG), s = Math.sin(-yaw * DEG);
      const x = w[0] - move[0], z = w[2] - move[2];
      return [x * c + z * s, w[1] - move[1], -x * s + z * c];
    };

    // ---------------------------------------------------------------- attack2: a rope-swing hop
    // A crouch with the cutlass wound back at the right hip, a push-off and a hop of 8 cm with the
    // knees tucked and the blade swung up and out (clear of the head), then a landing on bent
    // knees with a forward chop across the front. The soles stay flat on the floor (legTo).
    const HOP = 0.08;
    const SQUAT = 0.045;
    const [A_OFF, A_LAND] = [0.34, 0.56];
    const PULL_W: V3 = [-0.21, 0.25, -0.012];
    const PULL_D = norm([-0.12, 0.12, 1]);
    const UP_D = norm([-0.4, 0.75, 0.45]);
    const CHOP_D = norm([0.2, -0.12, 0.97]);
    k.animation('attack2', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        let h: number;
        if (p < 0.3) h = -SQUAT * ease(0, 0.26, p);
        else if (p < A_OFF) h = -SQUAT * (1 - ((p - 0.3) / (A_OFF - 0.3)) ** 2);
        else if (p < A_LAND) h = (4 * HOP * (p - A_OFF) * (A_LAND - p)) / (A_LAND - A_OFF) ** 2;
        else if (p < 0.66) h = -0.034 * Math.sin(((Math.PI / 2) * (p - A_LAND)) / (0.66 - A_LAND));
        else h = -0.034 * keys(p, [[0.66, 1], [0.78, 0.12], [0.86, 0.25], [1, 0]] as const);
        const bend = Math.max(0, -h) / SQUAT;
        const air = Math.max(0, h) / HOP;
        const flight = p > A_OFF && p < A_LAND ? Math.sin((Math.PI * (p - A_OFF)) / (A_LAND - A_OFF)) : 0;
        const tuck = 0.025 * flight;
        const pitch = Math.min(26, (Math.max(0, h) + tuck) / 0.0025);
        const back = -0.25 * Math.max(0, -h);
        const ankle: V3 = [ANKLE[0], ANKLE[1] - Math.min(0, h) + tuck, -back];
        const legL = legTo(1, ankle, pitch);
        const legR = legTo(-1, ankle, pitch);
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.22, PULL_W],
            [0.3, PULL_W],
            [0.44, [-0.27, 0.44, 0.05]],
            [0.56, [-0.25, 0.42, 0.07]],
            [0.64, [-0.12, 0.35, 0.17]],
            [0.74, [-0.14, 0.32, 0.15]],
            [1, WRIST_R],
          ] as const,
          'smooth',
        );
        const dir = norm(
          keys(p, [[0, BLADE_DIR], [0.22, PULL_D], [0.3, PULL_D], [0.44, UP_D], [0.56, UP_D], [0.64, CHOP_D], [0.74, CHOP_D], [1, BLADE_DIR]] as const),
        );
        const up = norm(keys(p, [[0, FLAT], [0.3, FLAT], [0.44, norm([-1, 0.4, 0])], [0.56, norm([-1, 0.4, 0])], [0.64, FLAT], [1, FLAT]] as const));
        const arm = reach(ARM_R, wrist, [-0.6, 0.1, -0.3]);
        const hand = orient([arm.upper, arm.lower], BLADE, { dir, up });
        const handL = keys(
          p,
          [[0, WRIST], [0.3, [0.2, 0.22, -0.03]], [0.44, [0.27, 0.42, 0.05]], [0.56, [0.26, 0.38, 0.06]], [0.64, [0.22, 0.3, 0.1]], [1, WRIST]] as const,
          'smooth',
        );
        const armL = reach(ARM_L, handL, [0.3, 0.1, -0.25]);
        const chop = keys(p, [[0.56, 0], [0.64, 1], [0.8, 0]] as const);
        return {
          hips: { move: [0, h, back] },
          spine: { rotate: [10 * bend - 4 * air + 8 * chop, -4 * air * 0, 0] },
          chest: { rotate: [6 * bend - 4 * air + 6 * chop, 6 * air - 8 * chop, 0] },
          head: { rotate: [-3 * bend - 6 * chop, 6 * air, 0] },
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
        } as P;
      },
    });

    // ---------------------------------------------------------------- hit: snap back from a blow
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.18, 1], [0.35, 0.85], [1, 0]] as const);
        const back = -0.022 * h;
        const lean = (Math.asin(back / 0.13) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, lean), back], rotate: [0, 6 * h, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, 8 * h, 4 * h] },
          head: { rotate: [-16 * h, -8 * h, -6 * h] },
          'leg.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean, 0, 0] },
          'foot.L': { rotate: [-lean, 0, 0] },
          'foot.R': { rotate: [-lean, 0, 0] },
          'upperarm.L': { rotate: [-20 * h, 0, 28 * h] },
          'upperarm.R': { rotate: [-24 * h, 0, -30 * h] },
          'forearm.L': { rotate: [-20 * h, 0, 0] },
          'forearm.R': { rotate: [-26 * h, 0, 0] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- death: stagger back, then fall face down under the pack
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.1, 1], [0.24, 0.3], [0.34, 0]] as const);
        const sag = keys(p, [[0.14, 0], [0.36, 1]] as const);
        // The fall: 0 standing, 1 on the ground; a small bounce at the impact.
        const fall = keys(p, [[0.3, 0], [0.62, 1.03], [0.7, 0.97], [0.78, 1]] as const, 'smooth');
        const f2 = fall * fall;
        // On the ground the chest frame is turned about 86 deg forward: the blade then points
        // along his body toward the feet (chest -Y) with its flat facing the sky (chest -Z).
        const upperR: V3 = [-24 * hitB - 20 * sag * (1 - fall) - 30 * fall, 0, -30 * sag - 8 * fall];
        const lowerR: V3 = [-20 * sag * (1 - fall) - 10 * fall, 0, 0];
        // Mid-fall the blade points almost straight down; tip it out to his right for a moment
        // so the point touches the floor and does not go into it.
        const tipOut = keys(p, [[0.36, 0], [0.48, 1], [0.6, 0]] as const, 'smooth');
        const handR = orient([upperR, lowerR], BLADE, {
          dir: norm(lerp(lerp(lerp(BLADE_DIR, [0, -0.2, 1], 0.6 * sag), [-0.25, -1, 0.1], fall), [-1, 0.3, 0.1], 0.7 * tipOut)),
          up: norm(lerp(FLAT, [0, 0.1, -1], fall)),
        });
        return {
          hips: {
            move: [0, -0.016 * sag - 0.042 * fall, -0.02 * hitB + 0.13 * f2],
            rotate: [86 * f2, 8 * sag, 6 * fall],
          },
          spine: { rotate: [-10 * hitB + 8 * sag - 4 * fall, 0, 0] },
          chest: { rotate: [-10 * hitB + 6 * sag - 6 * fall, 0, 0] },
          neck: { rotate: [-12 * fall, 0, 0] },
          head: { rotate: [-16 * hitB + 10 * sag - 12 * fall, 20 * fall, 10 * sag - 4 * fall] },
          // The legs straighten back along the ground, the feet turned out.
          'leg.L': { rotate: [-6 * sag - 44 * fall, 0, 10 * fall] },
          'leg.R': { rotate: [4 * sag - 40 * fall, 0, -12 * fall] },
          'foot.L': { rotate: [30 * fall, 0, 0] },
          'foot.R': { rotate: [30 * fall, 0, 0] },
          // The arms flail out in the stagger, then lie out beside his body, well clear of the
          // head; the sword stays in the hand and lies flat beside his hip.
          'upperarm.L': { rotate: [-24 * hitB - 20 * sag * (1 - fall) - 30 * fall, 0, 30 * sag + 8 * fall] },
          'upperarm.R': { rotate: upperR },
          'forearm.L': { rotate: [-20 * sag * (1 - fall) - 10 * fall, 0, 0] },
          'forearm.R': { rotate: lowerR },
          'hand.R': { rotate: handR },
        } as P;
      },
    });

    // ---------------------------------------------------------------- victory: a jump with the sword thrust up
    // An anticipation crouch on bent knees with the arms pulled down, a push-off that straightens
    // the legs, a jump of about 9 cm with the knees tucked and the toes pointing down, the sword
    // thrust up at the top, and a landing on both feet that the knees absorb with a small bounce.
    // The legs use legTo (above attack2): the soles stay flat on the floor.
    const JUMP = 0.09; // the hips' rise at the top of the jump
    const DROP = 0.045; // the depth of the anticipation crouch
    const [T_OFF, T_TOP, T_LAND] = [0.3, 0.41, 0.52];
    const FIST_BACK: V3 = [0.215, 0.222, -0.035];
    const FIST_LIST: readonly (readonly [number, V3])[] = [[0, WRIST], [0.2, FIST_BACK], [0.25, FIST_BACK], [0.34, [0.21, 0.37, 0.1]], [0.46, [0.19, 0.33, 0.075]]];
    k.animation('victory', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        // The hips' height: the crouch, a push-off that speeds up, a parabola in the air, then the
        // landing dip and a smaller second dip.
        let h: number;
        if (p < 0.24) h = -DROP * ease(0, 0.2, p);
        else if (p < T_OFF) h = -DROP * (1 - ((p - 0.24) / (T_OFF - 0.24)) ** 2);
        else if (p < T_LAND) h = (4 * JUMP * (p - T_OFF) * (T_LAND - p)) / (T_LAND - T_OFF) ** 2;
        else if (p < 0.6) h = -0.034 * Math.sin(((Math.PI / 2) * (p - T_LAND)) / (0.6 - T_LAND));
        else h = -0.034 * keys(p, [[0.6, 1], [0.7, 0.12], [0.77, 0.28], [0.9, 0]] as const);
        const bend = Math.max(0, -h) / DROP; // 1 at the bottom of the crouch
        const air = Math.max(0, h) / JUMP; // 1 at the top of the jump
        const flight = p > T_OFF && p < T_LAND ? Math.sin((Math.PI * (p - T_OFF)) / (T_LAND - T_OFF)) : 0;
        // In the air the knees tuck (the ankles come up under the hips) and the toes point down,
        // but never lower than the floor.
        const tuck = 0.025 * flight;
        const pitch = Math.min(26, (Math.max(0, h) + tuck) / 0.0025);
        // The hips sit back a little over the heels when they drop.
        const back = -0.25 * Math.max(0, -h);
        const ankle: V3 = [ANKLE[0], ANKLE[1] - Math.min(0, h) + tuck, -back];
        const legL = legTo(1, ankle, pitch);
        const legR = legTo(-1, ankle, pitch);
        // The arms pull down and back in the crouch and swing up in the push-off; the sword gets
        // to its full height at the top of the jump. The fist rises out to his right side (never
        // in front of the face), the blade up and out.
        const pull = keys(p, [[0, 0], [0.2, 1], [0.25, 1], [0.31, 0]] as const);
        const raise = ease(0.26, T_TOP, p);
        const wrist = lerp(lerp(WRIST_R, [-0.21, 0.222, -0.012], pull), [-0.285, 0.47, 0.07], raise);
        const dir = norm(lerp(lerp(BLADE_DIR, [-0.12, -0.1, 1], pull), [-0.45, 0.87, 0.18], raise));
        const arm = reach(ARM_R, wrist, [-0.6, 0.1, -0.3]);
        // The flat faces out to his right, so the guard runs front to back, not toward his cheek.
        const hand = orient([arm.upper, arm.lower], BLADE, { dir, up: norm(lerp(FLAT, [-1, 0.4, 0], raise)) });
        // The left fist (with the map) swings back in the crouch, up in the push-off, and pumps
        // down to his hip in triumph.
        const armL = reach(ARM_L, keys(p, FIST_LIST), [0.3, 0.1, -0.25]);
        // The bandana tails and the lantern lag behind the jump and swing after the landing.
        const swing = keys(p, [[T_LAND, 0], [0.6, 1], [1, 0]] as const);
        return {
          hips: { move: [0, h, back] },
          spine: { rotate: [10 * bend - 4 * air - 6 * raise, 0, 0] },
          chest: { rotate: [6 * bend - 6 * raise, 8 * raise, 0] },
          head: { rotate: [-3 * bend - 12 * raise, 8 * raise, -6 * raise] },
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
        } as P;
      },
    });
  },
});
