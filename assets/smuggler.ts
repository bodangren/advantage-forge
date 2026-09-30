import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Smuggler — Chibi Quest enemy (catalog `enemies/humanoid/smuggler`), about 0.98 m to the top of
 * the hat, faces +Z. Target: docs/enemy-mockups/smuggler_001.jpg (one front view). Built on the
 * bandit's rig (the rogue's head and skeleton), so the human enemies read as one set.
 *
 * Role: a sly human enemy, seen in 3D and as a 128 px sprite; the wide hat, the red neckerchief,
 *   the striped shirt, the crate and the glowing lantern must read small.
 * One idea: a grinning kid under a huge dark olive felt hat, with a crate of loot at one hip and
 *   an orange lantern held up in the other hand.
 * Proportions: the rogue's (head center 0.675, eyes 0.628, chin 0.48, shoulders 0.385, belt 0.235).
 *   The hat is tilted back 14 degrees so the brim does not hide the eyes.
 * Shape language: round and soft (hat, cheeks, kerchief) with small hard accents (brass, lantern).
 * Palette (60/30/10): olive hat #4a4e3a and shirt #5a6a48; brown leather #6a4a30; a red kerchief
 *   #b83a30 as the accent; brass #c9a24a and the orange lantern glass #ff9a30 as focal glints.
 * Value plan: the light face between the dark hat and the red kerchief is the focal point.
 * Bodies: skin, legs, hair, hat, kerchief, shirt, vest, shorts, sandals, leather, brass, crate,
 *   lantern, glass.
 * Rig: the bandit's skeleton; `knot` carries the kerchief knot and tails. The crate is rigid on
 *   the right hand and the lantern on the left hand (the mockup shows them that way: the crate at
 *   the viewer's left, the lantern at the viewer's right).
 * Clips: idle, walk, run, attack (a lantern swing), hit, death, taunt.
 */

const C = {
  skin: '#f0c8a0',
  cheek: '#e8a090',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#2a1a12',
  pupil: '#0e0a08',
  lid: '#16100c',
  brow: '#2a2420',
  hair: '#3a2a1e',
  hairDark: '#2a1e16',
  lip: '#6a3428',
  teeth: '#f0ece0',
  hat: '#4a4e3a',
  hatLit: '#5e6248',
  hatShade: '#363a2a',
  scarf: '#b83a30',
  scarfShade: '#8a2a22',
  shirt: '#5a6a48',
  stripe: '#d8d0b8',
  cuff: '#b0a070',
  vest: '#6a4a30',
  vestLit: '#8a6a48',
  brass: '#c9a24a',
  belt: '#4a3222',
  strap: '#5a3c26',
  pouch: '#6a4a30',
  shorts: '#6a6448',
  shortsCuff: '#8a8460',
  sandal: '#3a2a1e',
  crate: '#8a6a44',
  crateGap: '#5a4028',
  iron: '#2a2a2e',
  glass: '#ff9a30',
  glassBase: '#7a3a10',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const DEG = Math.PI / 180;

// Joints. The left (+X) arm is bent up: the forearm rises forward and the fist holds the lantern
// at chest height. The right (-X) arm hangs down by the crate at the hip.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.18, 0.332, 0.012];
const WRIST_R: V3 = [-0.205, 0.238, 0.03];
const ELBOW_L: V3 = [0.215, 0.4, 0.05];
const WRIST_L: V3 = [0.24, 0.49, 0.11];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left sandal sole (y = 0), from the bandit's boot shape.
const SOLE_HEEL: V3 = [0.093, 0, -0.024];
const SOLE_TOE: V3 = [0.108, 0, 0.085];

/** A fist hanging from the wrist `w`; `s` mirrors it for the right hand. Its grip hole runs along Z. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(...o(0.007, -0.038, 0.004)),
    sdf.capsule(o(-0.009, -0.058, 0.03), o(-0.005, -0.038, 0.042), 0.017),
    sdf.cone(o(0.02, -0.023, 0.025), o(0.001, -0.033, 0.048), 0.016, 0.013),
  );
};

/** A torus whose axis points along `dir`, centered at `c`. */
const ringAlong = (c: V3, dir: V3, R: number, r: number) => {
  const l = Math.hypot(dir[0], dir[1], dir[2]);
  const d = [dir[0] / l, dir[1] / l, dir[2] / l];
  const a = Math.asin(d[2]!) / DEG;
  const b = Math.atan2(-d[0]!, d[1]!) / DEG;
  return sdf.torus(R, r).rotateX(a).rotateZ(b).at(...c);
};

export default defineAsset({
  name: 'smuggler',
  description: 'Chibi smuggler enemy: a wide olive felt hat, a sly grin, a red neckerchief, a striped shirt and leather vest, a crate of loot and a glowing lantern.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/smuggler_001.jpg',
  variants: {
    shirt: { olive: C.shirt, blue: '#3a5a7a', red: '#8a3a30' },
    hat: { olive: C.hat, brown: '#5a4030', black: '#2a2a2e' },
    neckerchief: { red: C.scarf, yellow: '#d8b040', blue: '#2a4a7a' },
  },
  presets: {
    dockhand: { shirt: 'olive', hat: 'olive', neckerchief: 'red' },
    harbor: { shirt: 'blue', hat: 'black', neckerchief: 'yellow' },
    rustler: { shirt: 'red', hat: 'brown', neckerchief: 'blue' },
  },

  build(k) {
    const T = {
      shirt: k.tint('shirt'),
      hat: k.tint('hat'),
      hatLit: k.tint('hat', { color: C.hatLit, follow: 1 }),
      hatShade: k.tint('hat', { color: C.hatShade, follow: 1 }),
      scarf: k.tint('neckerchief'),
      scarfShade: k.tint('neckerchief', { color: C.scarfShade, follow: 1 }),
    };
    const KNOT_AT: V3 = [0, 0.442, 0.1];
    const GRIP_L: V3 = [WRIST_L[0] + 0.007, WRIST_L[1] - 0.041, WRIST_L[2] + 0.012];
    const GRIP_R: V3 = [WRIST_R[0] - 0.007, WRIST_R[1] - 0.043, WRIST_R[2] + 0.014];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      knot: { parent: 'chest', at: KNOT_AT, tail: [0, 0.34, 0.13] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
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
    const nose = sdf.ellipsoid([0.023, 0.019, 0.018]).at(0, 0.57, faceZ(0, 0.57) - 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.05, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.61, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAt(WRIST_R, -1).bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    // Big round eyes: a wide white, a huge dark iris, and two shines.
    const eyeWhite = pair(at(sdf.ellipsoid([0.056, 0.059, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.047, 0.052, 0.07]), EYE[0] - 0.001, EYE[1] - 0.003));
    const iris = pair(at(sdf.ellipsoid([0.043, 0.048, 0.07]), EYE[0] - 0.001, EYE[1] - 0.004));
    const pupil = pair(at(sdf.ellipsoid([0.03, 0.034, 0.07]), EYE[0] - 0.001, EYE[1] - 0.004));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.0125), x + 0.014, EYE[1] + 0.017), at(sdf.sphere(0.0065), x - 0.014, EYE[1] - 0.02)]),
    );
    // A dark lash line over each eye with a small flick at the outer corner.
    const lash = pair(sdf.extrude(profile.arc(0.058, 0.009, 25, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1)).intersect(sdf.halfSpace([0, -1, 0], -(EYE[1] + 0.006)));
    const flick = pair(sdf.extrude(profile.polygon([[0.157, 0.632], [0.178, 0.651], [0.176, 0.657], [0.152, 0.641]]), 0.3).at(0, 0, 0.1));
    // Thick arched brows.
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.166, 0.7],
              [0.14, 0.72],
              [0.094, 0.73],
              [0.05, 0.712],
              [0.046, 0.696],
              [0.09, 0.712],
              [0.14, 0.706],
              [0.164, 0.69],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // A wide closed-lip grin: a dark arc (0.08 m wide, 0.014 m tall, curving up at the ends) with
    // one light teeth bar in the cut and a small gold tooth left of center.
    const MOUTH = { r: 0.0641, cy: 0.599 }; // the arc's centerline bottom is at y 0.535
    const lipArc = sdf.extrude(profile.arc(MOUTH.r, 0.019, 228, 312), 0.3).at(0, MOUTH.cy, 0.1);
    const teethBar = sdf.box([0.06, 0.012, 0.3], 0.003).at(0, 0.5365, 0.1).intersect(sdf.extrude(profile.arc(MOUTH.r, 0.012, 225, 315), 0.3).at(0, MOUTH.cy, 0.1));
    const goldTooth = sdf.box([0.008, 0.008, 0.3]).at(-0.012, 0.5355, 0.1).intersect(teethBar.round(0.001));
    const cheek = (x: number) => sdf.ellipsoid([0.05, 0.034, 0.05]).at(x, 0.585, faceZ(Math.abs(x), 0.585) - 0.012);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(sdf.union(cheek(0.135), cheek(-0.135)), C.cheek, 0.03)
      .paintWhere(sdf.ellipsoid([0.026, 0.02, 0.02]).at(0, 0.567, faceZ(0, 0.567) - 0.004), '#eeb090', 0.01)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(pupil, C.pupil)
      .paintWhere(shine, '#ffffff')
      .paintWhere(lash, C.lid)
      .paintWhere(flick, C.lid)
      .paintWhere(brows, C.brow)
      .paintWhere(lipArc, C.lip)
      .paintWhere(teethBar, C.teeth)
      .paintWhere(goldTooth, '#d8b040');
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: short, with a fringe under the brim
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.012, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.008)
      .smoothSubtract(0.015, sdf.ellipsoid([0.23, 0.14, 0.22]).at(0, 0.62, 0.15));
    const capTop = cap.intersect(sdf.halfSpace([0, -1, 0], -0.655));
    const capBack = cap.intersect(sdf.box([0.6, 0.4, 0.26]).at(0, 0.8, -0.2));
    const lock = (x: number, y0: number, y1: number, dx: number, r: number) => {
      const zf = (px: number, py: number) => faceZ(Math.max(-0.15, Math.min(0.15, px)), py) + 0.006;
      const xm = x + dx * 0.5;
      const ym = (y0 + y1) / 2;
      return sdf.chain(
        [
          [x, y0, zf(x, y0), r * 1.2],
          [xm, ym, zf(xm, ym) + 0.004, r],
          [x + dx, y1, zf(x + dx, y1) + 0.006, r * 0.45],
        ],
        0.015,
      );
    };
    const fringe = sdf.smoothUnion(
      0.015,
      lock(-0.13, 0.82, 0.752, -0.012, 0.03),
      lock(-0.09, 0.83, 0.742, 0.02, 0.03),
      lock(-0.045, 0.84, 0.738, -0.016, 0.03),
      lock(0.0, 0.84, 0.735, 0.022, 0.031),
      lock(0.045, 0.84, 0.744, -0.014, 0.03),
      lock(0.09, 0.83, 0.74, 0.022, 0.03),
      lock(0.13, 0.82, 0.75, -0.01, 0.03),
    );
    const sideLocks = pair(
      sdf.smoothUnion(
        0.012,
        sdf.chain([[0.185, 0.74, 0.03, 0.036], [0.194, 0.68, 0.04, 0.03], [0.198, 0.63, 0.03, 0.014]], 0.01),
        sdf.chain([[0.17, 0.66, -0.07, 0.03], [0.185, 0.62, -0.06, 0.02]], 0.01),
      ),
    );
    const hair = sdf.smoothUnion(0.02, capTop, capBack, fringe, sideLocks).paintWhere(sdf.ellipsoid([0.2, 0.08, 0.2]).at(0, 0.7, -0.02), C.hairDark, 0.06);
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ the felt hat, tilted back 14 degrees
    // Local frame: the crown base at y = 0 on the axis; the brim droops toward its edge.
    const hatProfile = profile.polygon(
      [
        [0, -0.02],
        [0.2, -0.022],
        [0.28, -0.042],
        [0.345, -0.08],
        [0.362, -0.06],
        [0.345, -0.034],
        [0.27, -0.005],
        [0.232, 0.01],
        [0.228, 0.07],
        [0.218, 0.12],
        [0.19, 0.165],
        [0.12, 0.19],
        [0, 0.195],
      ],
      { smooth: true, samples: 6 },
    );
    const hatShape = sdf
      .revolve(hatProfile)
      .smoothSubtract(0.035, sdf.ellipsoid([0.115, 0.06, 0.16]).at(0, 0.232, -0.01))
      .displace(0.008, (x, y, z) => noise.fbm(x * 8 + 3, y * 8, z * 8, 2))
      .paintWhere(sdf.ellipsoid([0.2, 0.1, 0.2]).at(0, 0.2, 0), T.hatLit, 0.07)
      .paintWhere(sdf.box([1, 0.03, 1]).at(0, 0.035, 0), T.hatShade, 0.008)
      .paintWhere(sdf.box([1, 0.05, 1]).at(0, -0.07, 0), T.hatShade, 0.01);
    const hatPose = (s: sdf.Shape) => s.rotateX(-14).at(0, 0.79, -0.01);
    k.body('hat', hatPose(hatShape), { color: T.hat, roughness: 0.95, bone: 'head', bump: (x, y, z) => 0.0006 * noise.fbm(x * 90, y * 90, z * 90, 2) });

    // ------------------------------------------------------------------ shirt (striped), vest
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
    const stripe = rgb(C.stripe);
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(
          0.008,
          sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 0.86), 0.05, 0.047),
          sdf.cone(lerp(s, e, 0.82), lerp(s, e, 1.1), 0.054, 0.054).round(0.004).paint(C.cuff), // the rolled cuff at the elbow
        )
        .bone(tag);
    const shirt = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'))
      .paintFn((x, y, z, base) => (y < 0.44 && y > 0.19 && Math.abs(x) < 0.105 && Math.sin((x * 2 * Math.PI) / 0.02) > 0.2 ? stripe : base));
    k.body('shirt', shirt, { color: T.shirt, roughness: 0.85, bump: (x, y, z) => 0.0005 * Math.sin(x * 500) * Math.sin(y * 500) });
    // The vest: a leather shell over the chest, open at the front in a wide V, to the belt.
    const openPoly = profile.polygon([
      [-0.048, 0.47],
      [0.048, 0.47],
      [0.088, 0.19],
      [-0.088, 0.19],
    ]);
    const vest = torso
      .round(0.02)
      .subtract(torso.round(0.001))
      .intersect(sdf.halfSpace([0, 1, 0], 0.425))
      .intersect(sdf.halfSpace([0, -1, 0], -0.215))
      .smoothSubtract(0.006, sdf.extrude(openPoly, 0.4).at(0, 0, 0.2))
      .subtract(pair(sdf.ellipsoid([0.06, 0.07, 0.07]).at(0.13, 0.38, 0)))
      .paintWhere(sdf.extrude(profile.offsetProfile(openPoly, 0.014), 0.4).at(0, 0, 0.2), C.vestLit, 0.003);
    k.body('vest', vest.bone('chest'), { color: C.vest, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ neckerchief: a soft cowl, a knot, two short tails
    const cowl = sdf.smoothUnion(0.02, ringAlong([0, 0.447, 0.004], [0, 1, 0], 0.11, 0.03).scale([1, 0.95, 0.85]), sdf.cylinder(0.088, 0.05, 0.02).scale([1, 1, 0.85]).at(0, 0.452, 0.004));
    const knot = sdf.sphere(0.025).at(...KNOT_AT);
    const tailShape = (dx: number, rot: number) =>
      sdf
        .extrude(profile.polygon([[-0.03, 0], [0.03, 0], [0.002, -0.07]], { smooth: false }), 0.012, 0.005)
        .rotateZ(rot)
        .rotateX(-22)
        .at(KNOT_AT[0] + dx, KNOT_AT[1] - 0.008, KNOT_AT[2] + 0.008);
    const scarfShape = sdf
      .smoothUnion(0.012, cowl.bone('neck'), sdf.smoothUnion(0.01, knot, tailShape(-0.02, 12), tailShape(0.022, -14)).bone('knot'))
      .displace(0.006, (x, y, z) => noise.fbm(x * 13, y * 13, z * 13, 2))
      .paintFn((x, y, z, base) => (noise.fbm(x * 17 + 5, y * 17, z * 17, 2) > 0.24 ? rgb(T.scarfShade) : base));
    k.body('kerchief', scarfShape, { color: T.scarf, roughness: 0.85, detail: 0.005 });

    // ------------------------------------------------------------------ shorts, legs, sandals
    const shorts = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(
        sdf
          .smoothUnion(
            0.01,
            sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.125, 0.004], 0.053),
            sdf.cylinder(0.065, 0.044, 0.016).at(0.096, 0.112, 0.004).paint(C.shortsCuff), // the rolled cuff at the knee
          )
          .bone('leg.L'),
      ),
    );
    k.body('shorts', shorts, { color: C.shorts, roughness: 0.85, bump: (x, y, z) => 0.0006 * noise.fbm(x * 120, y * 120, z * 120, 2) });
    // Bare shins and feet with toes. The feet stand on the sandal soles.
    const footSkin = sdf
      .smoothUnion(
        0.02,
        sdf.cylinder(0.033, 0.06, 0.012).at(0, 0.078, 0),
        sdf.ellipsoid([0.05, 0.03, 0.09]).at(0, 0.036, 0.046),
        ...[-0.03, -0.015, 0, 0.015, 0.03].map((x, i) => sdf.sphere(0.0125 - 0.0008 * Math.abs(i - 2)).at(x * 1.05, 0.026, 0.128 - 0.004 * Math.abs(i - 2))),
      )
      .intersect(sdf.halfSpace([0, -1, 0], -0.01));
    const shin = sdf.capsule([0.096, 0.14, 0.004], [0.098, 0.085, 0.002], 0.031);
    const legL = sdf.smoothUnion(0.02, shin.bone('shin.L'), footSkin.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L'));
    k.body('legs', pair(legL), { color: C.skin, roughness: 0.55, detail: 0.004, textureDensity: 1.5 });
    const soleFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.052, 0.08, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = soleFoot.intersect(sdf.halfSpace([0, 1, 0], 0.016));
    const straps = footSkin
      .round(0.0045)
      .smoothIntersect(0.002, sdf.union(sdf.box([0.3, 0.3, 0.016]).at(0, 0.05, 0.062), sdf.box([0.3, 0.3, 0.014]).rotateX(-25).at(0, 0.05, -0.002)));
    const sandalL = sdf.union(sole, straps.paint(C.sandal)).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('sandals', pair(sandalL), { color: C.sandal, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ leather: belt, pouches, shoulder strap
    const beltY = 0.235;
    const belt = torso.round(0.027).smoothIntersect(0.006, sdf.box([0.5, 0.048, 0.5], 0.006).at(0, beltY, 0));
    const pouchOn = (sx: number) => {
      const p = sdf.surfacePoint(belt, [sx * 0.115, beltY - 0.02, 0.13], 0);
      return sdf
        .union(sdf.box([0.052, 0.062, 0.036], 0.012), sdf.box([0.058, 0.026, 0.042], 0.01).at(0, 0.022, 0.002).paint(C.vest))
        .rotateY(-sx * 35)
        .at(p[0], p[1] - 0.03, p[2] + 0.004);
    };
    // The diagonal strap: from the (-X) shoulder down to the (+X) hip, a shell over the vest.
    const sd: readonly [number, number] = [0.724, -0.69];
    const sn: readonly [number, number] = [0.69, 0.724];
    const sp0: readonly [number, number] = [-0.115, 0.455];
    const sp1: readonly [number, number] = [0.118, 0.232];
    const hw = 0.017;
    const strapBand = sdf
      .extrude(
        profile.polygon([
          [sp0[0] - sd[0] * 0.04 + sn[0] * hw, sp0[1] - sd[1] * 0.04 + sn[1] * hw],
          [sp1[0] + sd[0] * 0.02 + sn[0] * hw, sp1[1] + sd[1] * 0.02 + sn[1] * hw],
          [sp1[0] + sd[0] * 0.02 - sn[0] * hw, sp1[1] + sd[1] * 0.02 - sn[1] * hw],
          [sp0[0] - sd[0] * 0.04 - sn[0] * hw, sp0[1] - sd[1] * 0.04 - sn[1] * hw],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const strap = torso.round(0.024).subtract(torso.round(0.01)).intersect(strapBand);
    const belts = sdf.union(belt.paint(C.belt), strap.paint(C.strap), pouchOn(1), pouchOn(-1));
    k.body('leather', belts.bone('spine'), { color: C.pouch, roughness: 0.6, detail: 0.005 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.066, 0.05, 0.014], 0.006).subtract(sdf.box([0.038, 0.028, 0.03], 0.004)), sdf.box([0.008, 0.032, 0.012], 0.003).at(0.004, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    const button = (x: number, y: number) => {
      const p = sdf.surfacePoint(vest, [x, y, 0.2], 0);
      return sdf.sphere(0.0095).at(p[0], p[1], p[2] + 0.002);
    };
    k.body('brass', sdf.union(buckle, button(0.092, 0.4), button(0.096, 0.345), button(-0.092, 0.4), button(-0.096, 0.345)).bone('spine'), {
      color: C.brass,
      roughness: 0.35,
      metalness: 0.8,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ the crate in the right hand, at the hip
    const CR = { c: [-0.25, 0.12, 0.058] as V3, size: [0.14, 0.11, 0.11] as const };
    const crateBox = sdf.box(CR.size, 0.008).at(...CR.c);
    const slat = (dx: number) => sdf.box([0.016, 0.116, 0.116], 0.004).at(CR.c[0] + dx, CR.c[1], CR.c[2]);
    const handleBar = sdf.union(
      sdf.capsule([GRIP_R[0], GRIP_R[1], GRIP_R[2] - 0.05], [GRIP_R[0], GRIP_R[1], GRIP_R[2] + 0.05], 0.0075),
      sdf.capsule([GRIP_R[0], GRIP_R[1], GRIP_R[2] - 0.05], [GRIP_R[0], CR.c[1] + 0.055, GRIP_R[2] - 0.05], 0.0075),
      sdf.capsule([GRIP_R[0], GRIP_R[1], GRIP_R[2] + 0.05], [GRIP_R[0], CR.c[1] + 0.055, GRIP_R[2] + 0.05], 0.0075),
    );
    const plank = (y: number) => {
      const u = (y - (CR.c[1] - 0.055)) / (0.11 / 3);
      return Math.abs(u - Math.round(u)) < 0.07 && u > 0.5 && u < 2.5;
    };
    const crate = sdf
      .union(crateBox, slat(-0.046), slat(0.046))
      .paintFn((x, y, z, base) => (plank(y) ? rgb(C.crateGap) : base));
    k.body('crate', sdf.union(crate, handleBar.paint(C.crateGap)).bone('hand.R'), {
      color: C.crate,
      roughness: 0.85,
      detail: 0.005,
      bump: (x, y, z) => (plank(y) ? -0.0022 : 0.0006 * noise.fbm(x * 130, y * 20, z * 130, 2)),
    });

    // ------------------------------------------------------------------ the lantern in the left hand, held up
    const lan = (s: sdf.Shape) => s.scale(1.4).at(...GRIP_L);
    const LY = -0.11; // the center of the cage, below the grip
    const ring = sdf.torus(0.03, 0.007).rotateZ(90).at(0, -0.029, 0);
    const cage = sdf.smoothUnion(
      0.006,
      sdf.torus(0.033, 0.005).at(0, LY + 0.017, 0),
      sdf.torus(0.033, 0.005).at(0, LY - 0.017, 0),
      sdf.cylinder(0.022, 0.02, 0.008).at(0, -0.06, 0), // the cap
      sdf.cylinder(0.038, 0.014, 0.006).at(0, LY + 0.043, 0), // the top rim
      sdf.cylinder(0.041, 0.024, 0.008).at(0, LY - 0.046, 0), // the base
      ...[0, 60, 120, 180, 240, 300].map((a) =>
        sdf.capsule([0.033 * Math.cos(a * DEG), LY + 0.04, 0.033 * Math.sin(a * DEG)], [0.033 * Math.cos(a * DEG), LY - 0.04, 0.033 * Math.sin(a * DEG)], 0.006),
      ),
    );
    k.body('lantern', lan(sdf.smoothUnion(0.006, ring, cage)), { color: C.iron, roughness: 0.5, metalness: 0.35, detail: 0.005, bone: 'hand.L' });
    k.body('glass', lan(sdf.cylinder(0.029, 0.086, 0.012).at(0, LY, 0)), {
      color: C.glassBase,
      roughness: 0.2,
      emissive: C.glass,
      emissiveIntensity: 1.6,
      detail: 0.004,
      bone: 'hand.L',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, quat, euler, follow } = motion;
    void quat;
    void euler;
    void follow;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // Sly: the head tilts and glances, the hat follows.
        head: { rotate: [0, 10 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        knot: { rotate: [3 * wave(p, 1, 0.4), 0, 3 * wave(p, 1, 0.3)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'forearm.L': { rotate: [-3 * bump(p, 1, 0.2), 0, 0] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
      }),
    });

    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 10,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          knot: { rotate: [lean * 1.2 + 5 * wave(p, 2, 0.2), 0, 5 * wave(p, 2, 0.1)] as const },
          // The lantern arm is bent up and swings a little; the crate arm swings less, off the thigh.
          'upperarm.L': { rotate: [armSwing * 0.3 * s, 0, 3] as const },
          'forearm.L': { rotate: [-armSwing * 0.1 * wave(p, 2, 0.1), 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.22 * s, 0, -3] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 26, 3));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 0.03, 46, 12));

    // Attack: a lantern swing. The wind-up cocks the forearm back so the lantern rides up behind the
    // shoulder and the chest turns away; the cut whips the forearm forward and down across the front.
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.32, p) * (1 - ease(0.4, 0.48, p));
        const cut = ease(0.4, 0.52, p) * (1 - ease(0.7, 1, p));
        const swing = ease(0.46, 0.62, p) * (1 - ease(0.74, 1, p));
        return {
          hips: { move: [0.008 * wind - 0.006 * cut, -legDrop(LEG, 14 * cut) - 0.005 * wind, 0.03 * cut - 0.01 * wind], rotate: [0, 8 * wind - 16 * cut, 0] },
          spine: { rotate: [-4 * wind + 8 * cut, -5 * cut, 0] },
          chest: { rotate: [-4 * wind + 4 * cut, 14 * wind - 18 * cut, 0] },
          head: { rotate: [-2 * wind + 4 * cut, -8 * wind + 14 * cut, 0] },
          knot: { rotate: [-5 * wind + 12 * swing, 0, 5 * wind - 8 * swing] },
          'upperarm.L': { rotate: [40 * wind - 55 * cut, 0, 20 * wind - 12 * cut] },
          'forearm.L': { rotate: [-70 * wind + 25 * cut, 0, 0] },
          'hand.L': { rotate: [20 * wind - 15 * cut, 0, 0] },
          'upperarm.R': { rotate: [-12 * wind + 8 * cut, 0, -8 * wind] },
          'leg.R': { rotate: [-6 * wind - 22 * cut, 0, 0] },
          'leg.L': { rotate: [-3 * wind + 12 * cut, 0, 0] },
          'foot.R': { rotate: [6 * wind + 16 * cut, 0, 0] },
          'foot.L': { rotate: [3 * wind - 8 * cut, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.06; // the back of the sole, behind the ankle's ground point
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const flop = keys(p, [[0.08, 0], [0.3, 1], [0.5, -0.45], [0.68, 0.15], [0.85, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, -5 * h] },
          knot: { rotate: [-16 * flop, 0, 8 * flop] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          // The lantern arm jerks up; the crate arm swings out.
          'upperarm.L': { rotate: [-8 * h, 0, 12 * h] },
          'forearm.L': { rotate: [-14 * h, 0, 0] },
          'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps the chest back, the smuggler slumps forward and wobbles, then tips back over
    // his heels as one piece and lands on his back. The arms are solved by targets in the chest's
    // rest frame and lie out on the ground; the crate and the lantern lie beside him.
    const LIE = 86;
    const LIE_Y = 0.13;
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24);
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * clamp01((tilt - 70) / 16);
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.215, 0.26, -0.07], land), lerp(ELBOW_R, [-0.3, 0.3, -0.05], land));
        const standL = add(add(add(WRIST_L, [0.05, 0.04, 0.02], hitB), [0.07, 0.02, 0.03], sag), [0.08, 0.06, 0.04], fly);
        const armLd = reach(ARM_L, lerp(standL, [0.36, 0.28, -0.07], land), lerp(ELBOW_L, [0.4, 0.32, -0.1], land));
        return {
          hips: { move: hipsMove, rotate: [-tilt, 0, 0] },
          spine: { rotate: [-8 * hitB + 6 * sag, 0, 4 * wob] },
          chest: { rotate: [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob] },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB + 30 * land, 8 * wob] },
          knot: { rotate: [-12 * hitB + 10 * fly, 0, 10 * wob - 60 * land] },
          'upperarm.L': { rotate: armLd.upper },
          'forearm.L': { rotate: armLd.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          // The hands turn so the lantern and the crate lie outward on the ground.
          'hand.L': { rotate: [0, 0, -80 * land] },
          'hand.R': { rotate: [0, 0, -80 * land] },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: dangle the lantern, wink the hat
    // He leans back with his chin up, lifts the lantern high and swings it side to side, then
    // shows the crate with a hip bump: "want some?".
    k.animation('taunt', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const cock = keys(p, [[0, 0], [0.1, 1], [0.8, 1], [1, 0]] as const);
        const lift = keys(p, [[0.05, 0], [0.22, 1], [0.7, 1], [0.88, 0]] as const);
        const sway = wave(p, 3, 0.1) * lift;
        const bumpR = keys(p, [[0.5, 0], [0.62, 1], [0.74, 0], [0.82, 0.7], [0.92, 0]] as const);
        return {
          hips: { move: [0.008 * bumpR, 0, 0], rotate: [0, 0, 4 * bumpR] },
          spine: { rotate: [-4 * cock, 0, 0] },
          chest: { rotate: [-4 * cock, 5 * cock, 0] },
          neck: { rotate: [-3 * cock, 0, 2 * cock] },
          head: { rotate: [-6 * cock, 8 * wave(p, 2, 0.1) * cock, 10 * cock] },
          knot: { rotate: [6 * cock, 0, 6 * sway] },
          'upperarm.L': { rotate: [-45 * lift, 0, 12 * lift + 6 * sway] },
          'forearm.L': { rotate: [-10 * lift, 0, 10 * sway] },
          'hand.L': { rotate: [0, 0, 14 * sway] },
          'upperarm.R': { rotate: [-10 * bumpR, 0, -10 * bumpR] },
          'forearm.R': { rotate: [-8 * bumpR, 0, 0] },
        };
      },
    });
  },
});
