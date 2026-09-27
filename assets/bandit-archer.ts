import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Bandit archer — Chibi Quest enemy (catalog `enemies/humanoid/bandit-archer`), about 1.04 m to
 * the peak of the hood, faces +Z. Target: docs/enemy-mockups/bandit-archer_001.jpg (made with
 * mmx; one front view). Built on the bandit (the rogue's head, face, and skeleton with knee
 * bones); the bow, the string, the shot arrow, the quiver, and the shot come from the archer.
 *
 * Role: a ranged common enemy of the forest and village roads, seen in 3D and as a 128 px
 *   sprite; the hood, the glare over the mask, and the bow read.
 * One idea: a hooded road bandit, only his glaring eyes showing between a pointed dark green
 *   hood and a grey cloth mask, a short bow low in the left hand and a quiver on his back.
 * Proportions: the rogue's (head center 0.675, eyes 0.628, chin 0.48, shoulders 0.385, belt
 *   0.235); the hood peak rises to about 1.04, the mantle hem sits at 0.37, the tunic hem at 0.15.
 * Shape language: round (hood dome, head, fists, boots) with points for menace (hood peak, brows,
 *   the mask's V, arrow fletching, bow tips).
 * Palette (60/30/10): dark green hood and tunic #3a5a34; brown leather vest #6e4526 and darker
 *   straps; a grey cloth mask #4a4a44; brass buckles as the small accent.
 * Value plan: the light eyes and forehead between the dark hood and the grey mask are the focal
 *   point; the dark bow and the fletching over the shoulder are the second contrast.
 * Bodies: skin, hair, mask, hood, mantle, tunic, sleeves, vest, leather (belt, strap, pouches,
 *   bracers), brass, trousers, boots, quiver, arrows, nocked-arrow, bow, bowstring (two halves).
 * Rig: the bandit's skeleton without its prop bones (mask knot, sack, cutlass); the bow is rigid
 *   on `bowgrip`, a child of `hand.L` that only the death clip moves (the bow drops). The string is
 *   in two halves on `string.top` and `string.bot` (children of `bowgrip`), so the draw pulls its
 *   middle back. The shot arrow is on `arrow` (in the right fist); its mesh rests in the quiver,
 *   and every clip but the shot scales it to nothing.
 *   Clips: idle, walk, run, attack (nock, draw, hold, loose), hit, death, taunt (beckon twice with
 *   the free hand, then shake the bow high out to the side; plays when he first sees the player).
 */

const C = {
  skin: '#f2c7a4',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#4a2c1a',
  irisLow: '#7a4a26',
  pupil: '#110d0b',
  lid: '#16100c',
  brow: '#2a1c14',
  mark: '#5a2a22',
  hair: '#4a3022',
  hairDark: '#2e1e16',
  mask: '#4a4a44',
  maskDark: '#393934',
  hood: '#3a5a34',
  hoodInside: '#1c2c18',
  tunic: '#33502e',
  vest: '#6e4526',
  vestDark: '#4e301a',
  leather: '#553722',
  leatherDark: '#3a2414',
  trim: '#b4a484',
  trousers: '#3a3428',
  boot: '#4a2e1e',
  sole: '#2a1a12',
  brass: '#b8893a',
  quiver: '#5e3a22',
  shaft: '#8a6a48',
  fletch: '#4a3a30',
  arrowhead: '#8a8e94',
  bow: '#5a321c',
  grip: '#2e2018',
  string: '#d8ccb0',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => scl(a, 1 / len(a));
const DEG = Math.PI / 180;
const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotYv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) + v[2] * Math.sin(d * DEG), v[1], -v[0] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];

// Joints: the right arm hangs like the bandit's; the left (bow) arm is held out from the body like
// the archer's, so the bow clears the mantle, the boot, and the ground.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.18, 0.332, 0.012];
const WRIST_R: V3 = [-0.205, 0.238, 0.03];
const ELBOW_L: V3 = [0.198, 0.342, 0];
const WRIST_L: V3 = [0.268, 0.31, 0.04];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left boot (y = 0): heel and toe (the toe turns out 12 degrees).
const SOLE_HEEL: V3 = [0.093, 0, -0.024];
const SOLE_TOE: V3 = [0.108, 0, 0.085];

/** The fist: palm, a finger roll at the front, and a thumb over it, placed from the wrist. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.042, 0.047, 0.048]).at(...o(0.008, -0.042, 0.004)),
    sdf.capsule(o(-0.01, -0.064, 0.033), o(-0.006, -0.042, 0.046), 0.019),
    sdf.cone(o(0.022, -0.025, 0.028), o(0.001, -0.036, 0.053), 0.018, 0.014),
  );
};

// The short recurve bow in the left fist (see bowPose): limb lengths, the grip, and points of the
// bow frame in the rest pose.
const UPPER = 0.29;
const LOWER = 0.19;
const BOW_TILT = -14; // the top leans out, clear of the broad hood
const GRIP: V3 = [WRIST_L[0] + 0.008, WRIST_L[1] - 0.044, WRIST_L[2] + 0.004];
const bowDir = (d: V3) => rotZv(rotYv(d, 100), BOW_TILT);
const bowPoint = (p: V3) => add(bowDir(p), GRIP);
const NOCK_TOP = bowPoint([0, 0.9 * UPPER, -0.072]);
const NOCK_BOT = bowPoint([0, -0.9 * LOWER, -0.072]);
const NOCK_MID = bowPoint([0, 0.035, -0.072]); // the nocking point, level with the top of the fist
const ARROW_ON_BOW = bowPoint([0, 0.035, 0]); // where the arrow lies on the bow hand
// The quiver's pose on the back (see quiverPose); the shot arrow rests in it: its nock and its
// direction (nock to head).
const quiverDir = (d: V3) => rotZv(rotXv(d, -10), 50);
const quiverPoint = (p: V3) => add(quiverDir(p), [0.02, 0.27, -0.165]);
const ARROW_NOCK = quiverPoint([0, 0.43, 0]);
const ARROW_DIR = quiverDir([0, -1, 0]);
// The right fist's curled fingers, where they hook the string.
const PINCH: V3 = [WRIST_R[0] + 0.008, WRIST_R[1] - 0.053, WRIST_R[2] + 0.045];

export default defineAsset({
  name: 'bandit-archer',
  description: 'Chibi bandit archer enemy: a pointed dark green hood, a glare over a grey cloth mask, a leather vest, a quiver, and a short bow.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/bandit-archer_001.jpg',
  // Color slots for individual bandit archers (the first option is the default look). Eyes and
  // skin use the bandit's options; the hood slot also covers the mantle and the tunic.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    hood: { green: C.hood, brown: '#5a4430', grey: '#55554e', red: '#652c26' },
    vest: { brown: C.vest, black: '#2e2826' },
  },
  presets: {
    poacher: { eyes: 'green', skin: 'tan', hood: 'brown', vest: 'brown' },
    raider: { eyes: 'blue', skin: 'fair', hood: 'grey', vest: 'black' },
    cutthroat: { eyes: 'brown', skin: 'brown', hood: 'red', vest: 'black' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      skin: k.tint('skin'),
      mark: k.tint('skin', { color: C.mark, follow: 0.5 }),
      hood: k.tint('hood'),
      hoodInside: k.tint('hood', { color: C.hoodInside, follow: 1 }),
      tunic: k.tint('hood', { color: C.tunic, follow: 1 }),
      vest: k.tint('vest'),
      vestDark: k.tint('vest', { color: C.vestDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
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
      // The bow's grip in the left fist: only the death clip moves it (the bow drops).
      bowgrip: { parent: 'hand.L', at: GRIP },
      // The bowstring in two halves from the nocks, so the draw pulls its middle back.
      'string.top': { parent: 'bowgrip', at: NOCK_TOP },
      'string.bot': { parent: 'bowgrip', at: NOCK_BOT },
      // The shot arrow, in the right hand's fingers; its mesh rests in the quiver.
      arrow: { parent: 'hand.R', at: PINCH },
    });

    // ------------------------------------------------------------------ head and face (the bandit's)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.022, 0.018, 0.017]).at(0, 0.57, faceZ(0, 0.57) - 0.002).bone('head');
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
    const eyeWhite = pair(at(sdf.ellipsoid([0.05, 0.052, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.046, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.04, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.022));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] - 0.002));
    // A heavy upper lid that cuts the top of each eye on a slant: a glare.
    const lid = pair(
      sdf
        .extrude(
          profile.polygon([
            [EYE[0] - 0.06, EYE[1] + 0.022],
            [EYE[0] + 0.06, EYE[1] + 0.046],
            [EYE[0] + 0.06, EYE[1] + 0.09],
            [EYE[0] - 0.06, EYE[1] + 0.09],
          ]),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    const lidLine = pair(sdf.extrude(profile.arc(0.05, 0.011, 20, 160), 0.3).at(EYE[0], EYE[1] - 0.006, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.011), x + 0.015, EYE[1] + 0.012), at(sdf.sphere(0.0055), x - 0.013, EYE[1] - 0.022)]),
    );
    // Thick angry brows: the inner ends dip toward the nose.
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.165, 0.708],
              [0.12, 0.718],
              [0.075, 0.7],
              [0.042, 0.674],
              [0.046, 0.658],
              [0.08, 0.678],
              [0.122, 0.694],
              [0.162, 0.694],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // A scar on the left cheek, just above the mask.
    const scar = sdf.extrude(profile.arc(0.02, 0.006, 110, 250), 0.3).at(0.15, 0.628, 0.1);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .union(armL, armR)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(shine, '#ffffff')
      .paintWhere(lid.intersect(eyeWhite.round(0.004)), T.skin)
      .paintWhere(lidLine.intersect(sdf.halfSpace([0, -1, 0], -(EYE[1] + 0.004))), C.lid)
      .paintWhere(brows, C.brow)
      .paintWhere(scar, T.mark, 0.002);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ mask: a cloth over the nose and mouth
    // A wide, soft blend over the nose, so the cloth drapes over it as a low ridge.
    const faceShape = sdf.smoothUnion(0.05, head, sdf.ellipsoid([0.03, 0.024, 0.024]).at(0, 0.57, faceZ(0, 0.57) - 0.006));
    const maskShell = faceShape.round(0.013).subtract(faceShape.round(-0.002));
    const maskFront = maskShell.intersect(
      sdf
        .extrude(
          profile.polygon([
            [-0.26, 0.604],
            [-0.08, 0.594],
            [0, 0.602],
            [0.08, 0.594],
            [0.26, 0.604],
            [0.26, 0.44],
            [-0.26, 0.44],
          ]),
          0.4,
        )
        .at(0, 0, 0.2),
    );
    const mask = maskFront
      .bone('head')
      .paintFn((x, y, z, base) => (z > 0 && Math.abs(Math.sin(x * 40 - y * 20)) < 0.08 && y < 0.575 ? rgb(C.maskDark) : base));
    k.body('mask', mask, { color: C.mask, roughness: 0.95 });

    // ------------------------------------------------------------------ hood: a pointed dome that frames the eyes
    const dome = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.284, 0.285, 0.27]).at(0, 0.7, -0.03),
      sdf.ellipsoid([0.25, 0.14, 0.25]).at(0, 0.56, -0.015), // wraps the cheeks and the jaw
    );
    // A broad, soft peak: the dome rises to a blunt point, a little back.
    const peak = sdf.cone([0, 0.84, -0.05], [0.012, 1.03, -0.1], 0.19, 0.04);
    const hoodOuter = sdf.smoothUnion(0.1, dome, peak).displace(0.004, (x, y, z) => noise.fbm(x * 7, y * 7, z * 7, 2));
    const cavity = sdf.smoothUnion(0.02, head.round(0.016), sdf.ellipsoid([0.236, 0.238, 0.228]).at(0, 0.682, -0.015));
    // An oval window from the forehead to the chin; the hood's edge frames the eyes and the mask.
    const opening = sdf.ellipsoid([0.205, 0.178, 0.42]).at(0, 0.625, 0.3);
    // A thick rolled rim around the face opening.
    const rim = dome
      .round(0.016)
      .subtract(cavity.round(-0.004))
      .intersect(opening.round(0.036))
      .subtract(opening);
    const hood = sdf
      .smoothUnion(0.012, hoodOuter.subtract(cavity).smoothSubtract(0.02, opening), rim)
      .intersect(sdf.halfSpace([0, -1, 0], -0.44))
      .paintWhere(cavity.round(0.006), T.hoodInside, 0.012);
    k.body('hood', hood, { color: T.hood, roughness: 0.9, bone: 'head' });

    // ------------------------------------------------------------------ hair: a dark fringe inside the hood
    const insideHood = cavity.round(-0.003).union(opening.round(-0.012).intersect(dome.round(0.008)));
    const cap = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.02, HEAD[2] + 0.018]).at(0, HEAD_Y + 0.012, -0.01),
        sdf.ellipsoid([0.2, 0.08, 0.18]).at(0, 0.85, -0.01),
      )
      .smoothSubtract(0.015, sdf.ellipsoid([0.23, 0.14, 0.22]).at(0, 0.62, 0.15));
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.02);
    const fringe = sdf.smoothUnion(
      0.025,
      lock([
        [-0.05, 0.84, 0.15, 0.04],
        [-0.08, 0.78, 0.19, 0.03],
        [-0.1, 0.735, 0.19, 0.011],
      ]),
      lock([
        [0.01, 0.85, 0.16, 0.04],
        [0.02, 0.79, 0.2, 0.03],
        [0.035, 0.745, 0.195, 0.011],
      ]),
      lock([
        [0.07, 0.84, 0.15, 0.038],
        [0.1, 0.785, 0.185, 0.027],
        [0.125, 0.745, 0.18, 0.01],
      ]),
      lock([
        [-0.12, 0.82, 0.12, 0.036],
        [-0.15, 0.76, 0.15, 0.024],
        [-0.165, 0.72, 0.14, 0.009],
      ]),
    );
    const hair = sdf
      .smoothUnion(0.02, cap, fringe)
      .intersect(insideHood)
      .paintWhere(sdf.ellipsoid([0.2, 0.08, 0.2]).at(0, 0.7, -0.02), C.hairDark, 0.06);
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ mantle (the hood's shoulder cape)
    const mantleSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.5],
            [0.13, 0.478],
            [0.172, 0.44],
            [0.196, 0.4],
            [0.202, 0.372],
            [0.184, 0.366],
            [0.178, 0.396],
            [0.152, 0.43],
            [0.11, 0.456],
            [0.066, 0.476],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86])
      // Soft folds toward the edge.
      .displace(0.005, (x, y, z) => Math.sin(Math.atan2(z, x) * 7) * Math.min(1, Math.max(0, (0.45 - y) / 0.07)));
    k.body('mantle', mantleSolid, { color: T.hood, roughness: 0.9, bone: 'chest' });

    // ------------------------------------------------------------------ tunic (to a short skirt), sleeves
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
    const skirt = sdf
      .revolve(
        profile.polygon([
          [0, 0.245],
          [0.14, 0.245],
          [0.15, 0.2],
          [0.16, 0.158],
          [0.152, 0.148],
          [0, 0.148],
        ]),
      )
      .scale([1, 1, 0.8]);
    const tunic = sdf.smoothUnion(0.01, torso.bone('spine'), skirt.bone('hips'));
    k.body('tunic', tunic, { color: T.tunic, roughness: 0.85 });
    const sleeve = (s: V3, e: V3, w: V3, up: string, fore: string) =>
      sdf.smoothUnion(
        0.012,
        sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.048, 0.043).bone(up),
        sdf.cone(e, lerp(e, w, 0.55), 0.043, 0.039).bone(fore),
      );
    k.body('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R')), {
      color: T.tunic,
      roughness: 0.85,
    });

    // ------------------------------------------------------------------ vest: a leather chest piece
    const vest = torso
      .round(0.012)
      .subtract(torso.round(0.001))
      .intersect(sdf.halfSpace([0, 1, 0], 0.44))
      .intersect(sdf.halfSpace([0, -1, 0], -0.215))
      // Arm holes.
      .subtract(pair(sdf.ellipsoid([0.06, 0.07, 0.07]).at(0.13, 0.38, 0)))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.232), T.vestDark, 0.004);
    k.body('vest', vest.bone('chest'), { color: T.vest, roughness: 0.6 });

    // ------------------------------------------------------------------ leather: belt, quiver strap, pouches, bracers
    const beltY = 0.235;
    const belt = torso.round(0.018).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    // The quiver strap runs from the left shoulder, under the mantle, down to the right hip.
    const strap = torso.round(0.02).smoothIntersect(0.005, sdf.box([0.7, 0.032, 0.7], 0.005).rotateZ(36).at(-0.01, 0.335, 0));
    const pouchAt = (x: number, turn: number) => {
      const p = sdf.surfacePoint(belt, [x, beltY - 0.02, 0.15], 0);
      return sdf
        .union(sdf.box([0.052, 0.066, 0.034], 0.012), sdf.box([0.058, 0.028, 0.04], 0.01).at(0, 0.022, 0.002).paint(C.leatherDark))
        .rotateY(turn)
        .at(p[0] - Math.sign(x) * 0.008, p[1] - 0.032, p[2] + 0.006);
    };
    const pouches = sdf.union(pouchAt(-0.12, -35), pouchAt(0.115, 38));
    const bracer = (e: V3, w: V3) =>
      sdf.union(
        sdf.cone(lerp(e, w, 0.36), lerp(e, w, 1.04), 0.041, 0.047).round(0.003),
        sdf.cone(lerp(e, w, 0.3), lerp(e, w, 0.42), 0.046, 0.047).round(0.004).paint(C.trim), // the rolled trim
      );
    k.body(
      'leather',
      sdf.union(belt.bone('spine'), strap.bone('chest'), pouches.bone('spine'), bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(ELBOW_R, WRIST_R).bone('forearm.R')),
      { color: C.leather, roughness: 0.6 },
    );
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.052, 0.042, 0.012], 0.005).subtract(sdf.box([0.03, 0.022, 0.03], 0.004)), sdf.box([0.008, 0.028, 0.01], 0.003).at(0.002, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    const strapBuckleAt = sdf.surfacePoint(strap, [0.02, 0.35, 0.2], 0.002);
    const strapBuckle = sdf.box([0.034, 0.038, 0.009], 0.004).subtract(sdf.box([0.018, 0.022, 0.03], 0.002)).rotateZ(36).at(...strapBuckleAt);
    k.body('brass', sdf.union(buckle.bone('spine'), strapBuckle.bone('chest')), { color: C.brass, roughness: 0.35, metalness: 0.85 });

    // ------------------------------------------------------------------ trousers, boots
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.11, 0.004], 0.05).bone('leg.L')),
    );
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.054, 0.09, 0.02).at(0, 0.055, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = bootFoot
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ quiver and arrows (on the back)
    // Local frame: bottom of the quiver at the origin, the mouth up +Y.
    const QUIVER_LEN = 0.24;
    const quiverPose = (s: sdf.Shape) => s.rotateX(-10).rotateZ(50).at(0.02, 0.27, -0.165);
    const tube = sdf.cone([0, 0, 0], [0, QUIVER_LEN, 0], 0.036, 0.046).round(0.004);
    const quiverShape = sdf
      .union(
        tube.subtract(sdf.cylinder(0.04, 0.1).at(0, QUIVER_LEN + 0.04, 0)),
        sdf.torus(0.046, 0.009).at(0, QUIVER_LEN - 0.006, 0).paint(C.leatherDark), // rolled mouth
        sdf.cylinder(0.044, 0.026, 0.008).at(0, 0.12, 0).paint(C.leatherDark), // strap band
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.025), C.leatherDark);
    k.body('quiver', quiverPose(quiverShape).bone('chest'), { color: C.quiver, roughness: 0.6 });
    // Five arrows fanned in the mouth; only the shafts and the dark fletching show.
    const vane = sdf.extrude(
      profile.polygon([
        [0, -0.004],
        [0.017, 0.012],
        [0.016, 0.046],
        [0, 0.062],
        [-0.016, 0.046],
        [-0.017, 0.012],
      ]),
      0.008,
      0.003,
    );
    const fletching = sdf.union(vane, vane.rotateY(90));
    const arrowTips = [
      [-0.022, 0.012, 0.42],
      [0.004, 0.022, 0.45],
      [0.026, 0.006, 0.425],
      [-0.008, -0.018, 0.44],
      [0.018, -0.014, 0.41],
    ] as const;
    const arrows = sdf.union(
      ...arrowTips.map(([x, z, l], i) => {
        const top: V3 = [x * 2.6, l, z * 2.6];
        const base: V3 = [x * 0.6, 0.08, z * 0.6];
        const dir: V3 = [top[0] - base[0], top[1] - base[1], top[2] - base[2]];
        const tilt = (Math.atan2(Math.hypot(dir[0], dir[2]), dir[1]) * 180) / Math.PI;
        const yaw = (Math.atan2(dir[0], dir[2]) * 180) / Math.PI;
        const f = fletching
          .rotateY(i * 37)
          .rotateX(tilt)
          .rotateY(yaw)
          .at(...lerp(base, top, 0.84));
        return sdf.union(sdf.capsule(base, top, 0.0055), f.paint(C.fletch));
      }),
    );
    k.body('arrows', quiverPose(arrows).bone('chest'), { color: C.shaft, roughness: 0.7, detail: 0.004 });
    // The arrow for the shot, in the middle of the quiver (quiver frame: nock up at 0.43, the head
    // down in the tube). Its bone hides it in every clip but the shot.
    const shotArrow = sdf.union(
      sdf.capsule([0, 0.2, 0], [0, 0.43, 0], 0.0055),
      sdf.cone([0, 0.205, 0], [0, 0.165, 0], 0.012, 0.002).paint(C.arrowhead),
      fletching.at(0, 0.358, 0).paint(C.fletch),
    );
    k.body('nocked-arrow', quiverPose(shotArrow), { color: C.shaft, roughness: 0.7, detail: 0.0035, bone: 'arrow' });

    // ------------------------------------------------------------------ short recurve bow in the left hand
    // Local frame: grip at the origin, limbs along Y, the back of the bow toward +Z, the string
    // behind it at -Z. Each limb bends back toward the string, then the tip curls forward.
    const limb = (l: number, sign: 1 | -1) =>
      sdf.chain(
        [
          [0, 0, 0, 0.017],
          [0, 0.22 * l * sign, -0.007, 0.0135],
          [0, 0.48 * l * sign, -0.03, 0.0115],
          [0, 0.72 * l * sign, -0.056, 0.0098],
          [0, 0.88 * l * sign, -0.066, 0.0086],
          [0, 0.97 * l * sign, -0.052, 0.0078],
          [0, 1.02 * l * sign, -0.026, 0.0072],
          [0, 1.03 * l * sign, 0.0, 0.0068],
          [0, 1.015 * l * sign, 0.02, 0.0064],
        ],
        0.01,
      );
    const bowLocal = sdf.union(limb(UPPER, 1), limb(LOWER, -1)).paintWhere(sdf.box([0.1, 0.07, 0.1]), C.grip);
    // The back of the bow faces out (+X), so the front view shows the whole curve.
    const bowPose = (s: sdf.Shape) => s.rotateY(100).rotateZ(BOW_TILT).at(...GRIP);
    k.body('bow', bowPose(bowLocal), { color: C.bow, roughness: 0.55, detail: 0.004, bone: 'bowgrip' });
    // The string in two halves that meet at the nocking point, each on its own bone.
    const stringLook = { color: C.string, roughness: 0.8, detail: 0.003 };
    k.body('bowstring', sdf.capsule(NOCK_TOP, NOCK_MID, 0.0035), { ...stringLook, bone: 'string.top' });
    k.body('bowstring-low', sdf.capsule(NOCK_BOT, NOCK_MID, 0.0035), { ...stringLook, bone: 'string.bot' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, follow, quat, euler } = motion;
    const HIDE: V3 = [0.001, 0.001, 0.001]; // the shot arrow's scale outside the shot

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // Shifty: the head glances from side to side.
        head: { rotate: [0, 7 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'hand.L': { rotate: [0, 0, -3 * bump(p)] }, // the bow top leans out with the arm
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
        arrow: { scale: HIDE },
      }),
    });

    // The legs come from motion.gait: planted stance boots, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down, `hop` the hips bob. The bow arm swings less than the free arm and
    // lifts out from the body (`lift`, degrees), so the bow tip clears the ground and the boot;
    // the hand turns back by the lift plus `tiltOut` degrees, so the bow leans out, clear of the hood.
    const stride = (duration: number, step: number, footLift: number, duty: number, armSwing: number, lean: number, hop: number, lift: number, tiltOut: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob: hop,
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
          'upperarm.L': { rotate: [armSwing * 0.35 * s, 0, lift] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.2, 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          'hand.L': { rotate: [0, 0, -(lift + tiltOut)] as const },
          arrow: { scale: HIDE },
        };
      },
    });
    // A sneaky road bandit: short, light steps; the run is quick with a flight phase.
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 26, 3, 0.006, 12, 8));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 46, 12, 0.03, 19, 6));

    // ------------------------------------------------------------------ attack: a bow shot, solved by targets
    // The archer's shot. Plan (in the chest's rest frame): he turns side-on, raises the bow in
    // front, brings the string hand up and nocks the arrow, then pushes the bow out at the target
    // while the string hand draws back along the arrow line to the anchor under the right jaw. A
    // short hold, the release: the string snaps forward, the arrow is gone, the string hand flicks
    // back past the jaw, and the bow tips forward in the open hand. Then back to rest.
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const CHAIN_L = [SHOULDER, ELBOW_L, WRIST_L] as const;
    const CHAIN_R = [mx(SHOULDER), ELBOW_R, WRIST_R] as const;
    const Z3: V3 = [0, 0, 0];
    const chainQ = (rots: readonly V3[]) => {
      const q = new THREE.Quaternion();
      for (const r of rots) q.multiply(quat(r));
      return q;
    };
    const turnBy = (q: THREE.Quaternion, v: V3): V3 => {
      const w = new THREE.Vector3(v[0], v[1], v[2]).applyQuaternion(q);
      return [w.x, w.y, w.z];
    };
    const slerpRot = (a: V3, b: V3, t: number): V3 => euler(quat(a).slerp(quat(b), t));
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    const TURN = 55; // the body turns this far to its right, so the bow side faces the target
    const toChest = (w: V3): V3 => rotYv(w, TURN);
    const AIM = toChest(norm([0.2, 0.03, 1])); // at the target in front, a little to the bow side
    const ANCHOR: V3 = [-0.01, 0.428, 0.188]; // the pinch at full draw: under the right jaw, in front of the hood
    const BOW_AT = add(add(ANCHOR, scl(AIM, 0.135)), [0, -0.022, 0]); // the grip at full draw
    const BOW_NOCK = add(BOW_AT, [-0.01, 0, -0.02]); // the grip while the arrow is nocked
    const BOW_REST = { dir: bowDir([0, 1, 0]), up: bowDir([0, 0, 1]) }; // the limbs, the back of the bow
    const HAND_R_REST = { dir: norm(sub(WRIST_R, ELBOW_R)), up: [0, 0, 1] as V3 };
    // The draw hand: the forearm along the arrow line, the palm toward the neck.
    const HAND_R_DRAW = { dir: AIM, up: norm([AIM[2], 0, -AIM[0]]) };
    const OFF_R = sub(PINCH, WRIST_R);
    const OFF_DRAW = turnBy(quat(orient([], HAND_R_REST, HAND_R_DRAW)), OFF_R);
    // Elbow poles: at rest (in the rest bend plane, so the solved arm matches the rest pose) and in the shot.
    const POLE_L_REST: V3 = [0.155, 0.283, -0.28];
    const POLE_L_AIM: V3 = [0.36, 0.22, -0.12];
    const POLE_R_REST: V3 = [-0.4, 0.517, -0.009];
    const POLE_R_DRAW: V3 = [-0.36, 0.5, -0.16];

    // The arrow bone's pose that puts the arrow's nock at `nock`, pointing along `dir`, for a posed
    // right arm (`rots`: upper arm, forearm, hand; `sh`: the shoulder's move).
    const ARROW_UP: V3 = [0, 1, 0];
    const arrowPose = (rots: readonly V3[], sh: V3, nock: V3, dir: V3) => {
      const q = chainQ(rots);
      const pivot = add(follow(CHAIN_R, rots, PINCH), sh);
      const rw = quat(orient([], { dir: ARROW_DIR, up: ARROW_UP }, { dir, up: ARROW_UP }));
      const atW = sub(nock, turnBy(rw, sub(ARROW_NOCK, PINCH)));
      const inv = q.clone().invert();
      return { move: turnBy(inv, sub(atW, pivot)), rotate: euler(inv.multiply(rw)) };
    };
    // The bow arm: solve the wrist so the grip lands at `grip`, with the bow turned to `want`.
    const bowArm = (grip: V3, want: { dir: V3; up: V3 }, sh: V3, weight: number, pole: V3) => {
      let wrist = sub(grip, sub(GRIP, WRIST_L));
      let arm = reach(ARM_L, sub(wrist, sh), pole);
      let hand: V3 = Z3;
      for (let i = 0; i < 3; i++) {
        arm = reach(ARM_L, sub(wrist, sh), pole);
        hand = slerpRot(Z3, orient([arm.upper, arm.lower], BOW_REST, want), weight);
        const g = add(follow(CHAIN_L, [arm.upper, arm.lower, hand], GRIP), sh);
        wrist = add(wrist, sub(grip, g));
      }
      return { arm, hand };
    };

    const RELEASE = 0.58;
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const turn = keys(p, [[0, 0], [0.2, 1], [0.78, 1], [1, 0]] as const);
        const aim = keys(p, [[0, 0], [0.22, 1], [0.76, 1], [0.97, 0]] as const);
        const kick = p >= RELEASE ? Math.exp(-(p - RELEASE) * 30) : 0;
        const tremble = p > 0.46 && p < RELEASE ? Math.sin(((p - 0.46) / (RELEASE - 0.46)) * Math.PI * 4) : 0;
        // Shoulders: the bow shoulder pushes toward the target; the string shoulder comes forward
        // a little, so the short arm reaches the string.
        const shL = scl([0, 0.012, 0.05], aim);
        const shR = keys(p, [[0, Z3], [0.22, [0.035, 0.012, 0.04]], [0.46, [0.02, 0.008, 0.03]], [0.8, [0.02, 0.008, 0.03]], [1, Z3]] as const);

        // ---- the bow arm: up in front, the nock, the push at the target, the follow-through, back.
        const bowAt = keys(p, [
          [0, GRIP],
          [0.12, add(GRIP, [0, 0.08, 0.1])],
          [0.22, BOW_NOCK],
          [0.28, BOW_NOCK],
          [0.46, BOW_AT],
          [RELEASE, BOW_AT],
          [RELEASE + 0.06, add(BOW_AT, [0.02, -0.004, 0.03])],
          [0.76, add(BOW_AT, [0.012, -0.012, 0.02])],
          [0.88, add(GRIP, [0.01, 0.07, 0.1])],
          [1, GRIP],
        ] as const);
        // The bow leans its top out, away from the hood; in the shot the lean is a roll about the
        // arrow line. After the release the bow tips forward in the open hand.
        const out = norm([bowAt[0], 0, bowAt[2] + 0.02]);
        const along = out[0] * AIM[0] + out[2] * AIM[2];
        const side = norm(sub(out, scl(AIM, along * aim)));
        // The bow turns from its rest lean to the shot lean at once, so the rising forearm never
        // tips the upper limb into the hood.
        const lean = norm(add(add([0, 1, 0], scl(side, 0.9)), scl(AIM, 0.25 * kick)));
        const r = ease(0, 0.12, p) * (1 - ease(0.86, 1, p));
        const bowWant = { dir: norm(lerp(BOW_REST.dir, lean, r)), up: norm(lerp(BOW_REST.up, AIM, r)) };
        const poleL = keys(p, [[0, POLE_L_REST], [0.2, POLE_L_AIM], [0.8, POLE_L_AIM], [1, POLE_L_REST]] as const);
        const bow = bowArm(bowAt, bowWant, shL, 1, poleL);
        const rotsL = [bow.arm.upper, bow.arm.lower, bow.hand] as const;
        const onBow = (pt: V3) => add(follow(CHAIN_L, rotsL, pt), shL);
        const nockNow = onBow(NOCK_MID);
        const restOnBow = onBow(ARROW_ON_BOW);
        const toBow = norm(sub(restOnBow, nockNow));

        // ---- the string hand: up in front, the nock, the draw to the anchor, the hold, the
        // release flick back past the jaw, back to rest.
        const pinchAt = keys(p, [
          [0, PINCH],
          [0.12, [-0.07, 0.33, 0.21]],
          [0.22, nockNow],
          [0.28, nockNow],
          [0.46, ANCHOR],
          [RELEASE, add(ANCHOR, scl(AIM, -0.004))],
          [RELEASE + 0.05, add(ANCHOR, [-0.07, 0.01, 0])],
          [0.78, add(ANCHOR, [-0.08, -0.03, 0])],
          [1, PINCH],
        ] as const);
        const onString = keys(p, [[0, 0], [0.12, 0.4], [0.22, 1], [0.7, 1], [0.92, 0]] as const);
        const wristR = sub(pinchAt, add(scl(OFF_R, 1 - onString), scl(OFF_DRAW, onString)));
        const poleR = keys(p, [[0, POLE_R_REST], [0.2, POLE_R_DRAW], [0.82, POLE_R_DRAW], [1, POLE_R_REST]] as const);
        const armR = reach(ARM_R, sub(wristR, shR), poleR);
        const handR = slerpRot(Z3, orient([armR.upper, armR.lower], HAND_R_REST, HAND_R_DRAW), onString);
        const rotsR = [armR.upper, armR.lower, handR] as const;
        const pinchNow = add(follow(CHAIN_R, rotsR, PINCH), shR);

        // ---- the string: its middle follows the pinch from the nock to the release, then snaps
        // forward (a small overshoot) and settles straight. Each half turns from its nock toward
        // the middle and stretches along its rest axis (Y) to the new length.
        const pulled = p >= 0.22 && p < RELEASE;
        const mid = pulled ? pinchNow : add(nockNow, scl(toBow, 0.012 * kick));
        const qL = chainQ(rotsL);
        const string = (nock: V3) => {
          const n = onBow(nock);
          const v = sub(NOCK_MID, nock);
          const l = len(sub(mid, n));
          const sy = Math.sqrt(Math.max(1e-6, l * l - v[0] * v[0] - v[2] * v[2])) / Math.abs(v[1]);
          return {
            rotate: orient(rotsL, { dir: norm([v[0], v[1] * sy, v[2]]), up: [0, 0, 1] }, { dir: norm(sub(mid, n)), up: turnBy(qL, [0, 0, 1]) }),
            scale: [1, sy, 1] as V3,
          };
        };

        // ---- the arrow: in the fingers from the nock to the release, pointing at the bow hand;
        // at the release it leaves along the arrow line and is gone.
        const flown = p >= RELEASE ? Math.min(1, (p - RELEASE) / 0.04) : 0;
        const shown = p >= 0.2 && p < RELEASE + 0.04;
        const arrow = !shown
          ? { move: Z3, rotate: Z3 }
          : p < RELEASE
            ? arrowPose(rotsR, shR, pinchNow, norm(sub(restOnBow, pinchNow)))
            : arrowPose(rotsR, shR, add(nockNow, scl(toBow, 0.6 * flown)), toBow);

        return {
          hips: { move: [0, -0.002 * turn, 0], rotate: [0, -35 * turn, 0] },
          spine: { rotate: [0, -12 * turn, 0] },
          chest: { rotate: [-2 * aim + 0.4 * tremble - 3 * kick, -8 * turn, 0] },
          // The head turns back to the target and lifts the chin a little over the string.
          neck: { rotate: [0, 15 * turn, 0] },
          head: { rotate: [-3 * aim, 25 * turn, 0] },
          'upperarm.L': { move: shL, rotate: bow.arm.upper },
          'forearm.L': { rotate: bow.arm.lower },
          'hand.L': { rotate: bow.hand },
          'upperarm.R': { move: shR, rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'string.top': string(NOCK_TOP),
          'string.bot': string(NOCK_BOT),
          arrow: { ...arrow, scale: shown ? ([1, 1, 1] as V3) : HIDE },
          // A braced stance: the feet turn a little toward the target, the rear leg back.
          'leg.L': { rotate: [-5 * turn, 25 * turn, 5 * turn] },
          'leg.R': { rotate: [4 * turn, 15 * turn, -4 * turn] },
          'foot.L': { rotate: [5 * turn, 10 * turn, -5 * turn] },
          'foot.R': { rotate: [-4 * turn, 8 * turn, 4 * turn] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The head and the chest snap back and the hips give way: the left foot stays planted and the
    // right foot steps back, then all returns quickly. The bow arm swings a little out and the
    // hand tilts the bow top out, clear of the hood.
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.06; // the back of the boot, behind the ankle's ground point
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, 4 * h] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          'upperarm.L': { rotate: [-10 * h, 0, 12 * h] },
          'forearm.L': { rotate: [-12 * h, 0, 0] },
          'hand.L': { rotate: [0, 0, -20 * h] },
          'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
          arrow: { scale: HIDE },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps the chest back, he slumps forward and wobbles, then tips back over the heels as
    // one piece and lands on the back (and the quiver). The quiver and the fletching behind the
    // back prop the body up, so the hips stay off the floor and the arms hang back to it. The arms
    // are solved by targets in the chest's rest frame. The left hand opens in the fall and the
    // `bowgrip` bone carries the bow (and its string) to lie flat on the floor beside the left hand.
    const LIE = 80; // the hips' final tilt back, degrees
    const LIE_Y = 0.13; // the hips' height when he lies on the back
    // The fletching over the right shoulder (above and behind the hips pivot, in the hips' rest
    // frame) is the lowest point of the lying body: the hips rise so that it stays on the floor.
    const PROP = [0.305, -0.295] as const;
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0]]; // hips, spine, chest pivots
    const BOW_CHAIN: readonly V3[] = [...TRUNK, SHOULDER, ELBOW_L, WRIST_L];
    // On the floor the bow's flat side (local +X) faces up, so the bow lies at its limb radius.
    const DROP_AT: V3 = [0.34, 0.02, -0.4]; // the grip on the floor, the upper limb toward the head
    const DROP_TURN = quat(orient([], { dir: bowDir([0, 1, 0]), up: bowDir([1, 0, 0]) }, { dir: norm([0.12, 0, -1]), up: [0, 1, 0] }));
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = Math.min(1, Math.max(0, (p - 0.36) / 0.24)); // the fall speeds up to the impact
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.48, 0], [0.7, 1]] as const);
        const turnBow = keys(p, [[0.42, 0], [0.54, 1]] as const);
        const loose = keys(p, [[0.42, 0], [0.6, 1]] as const);
        // The stagger: the hips give way backward over planted feet.
        const back = 0.022 * hitB;
        const lean = plant(back);
        // The fall: a rigid tip over the back of the heels, until the hips reach their lying height.
        const a = tilt * DEG;
        const heels = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsY = heels + Math.max(0, -(heels + PROP[0] * Math.cos(a) + PROP[1] * Math.sin(a)));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * Math.min(1, Math.max(0, (tilt - LIE + 14) / 14)); // the legs come down once the hips hold
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        // The wrists: flung back by the blow, slumped, flung out in the fall, then out on the ground.
        const standR = add(add(add(WRIST_R, scl([-0.05, 0.02, -0.05], hitB)), scl([0, -0.06, -0.03], sag)), scl([-0.07, 0, 0.04], fly));
        const armR = reach(ARM_R, lerp(standR, [-0.23, 0.33, -0.13], land), lerp(ELBOW_R, [-0.3, 0.3, -0.1], land));
        const standL = add(add(add(WRIST_L, scl([0.03, 0.03, 0.04], hitB)), scl([0, -0.01, 0.02], sag)), scl([0.05, 0.05, 0.06], fly));
        const armL = reach(ARM_L, lerp(standL, [0.2, 0.36, -0.15], land), lerp(ELBOW_L, [0.3, 0.32, -0.1], land));
        // The bow hand tilts the bow top out in the blow, clear of the hood.
        const handL: V3 = [0, 0, -18 * hitB - 12 * sag - 16 * fly];
        // The bow: in the posed hand until the hand opens, then it turns flat and drops to the floor.
        const handQ = chainQ([hipsR, spineR, chestR, armL.upper, armL.lower, handL]);
        const held = add(follow(BOW_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, handL], GRIP), hipsMove);
        const drop = keys(p, [[0.42, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = turnBy(inv, sub(lerp(held, drop, loose), held));
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB, -6 * wob + 6 * land] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: handL },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          bowgrip: { move: d, rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, turnBow))) },
          arrow: { scale: HIDE },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: beckon, then shake the bow
    // Played when he first sees the player. He leans back with the head cocked and beckons twice
    // with the free right hand, the palm up: "come here" (the bandit's beckon). Then he raises the
    // bow high out to his left and shakes it, the body and the head leaning away from it, and
    // returns to rest. The hand turns the bow's top out, so the upper limb stays clear of the hood.
    const chestFrame = (rots: readonly V3[], move: V3) => {
      const q = quat(rots[0]!).multiply(quat(rots[1]!)).multiply(quat(rots[2]!));
      const inv = q.clone().invert();
      const atC = follow(TRUNK, rots, TRUNK[2]!);
      const c = TRUNK[2]!;
      return {
        q,
        inv,
        point: (w: V3): V3 => {
          const v = new THREE.Vector3(w[0] - atC[0] - move[0], w[1] - atC[1] - move[1], w[2] - atC[2] - move[2]).applyQuaternion(inv);
          return [v.x + c[0], v.y + c[1], v.z + c[2]];
        },
      };
    };
    const mix2 = (a: V3, ca: number, b: V3, cb: number): V3 => [a[0] * ca + b[0] * cb, a[1] * ca + b[1] * cb, a[2] * ca + b[2] * cb];
    const Q_ID = new THREE.Quaternion();
    // The right hand's rest frame: the wrist to the fist center, and the palm (the curled fingers) forward.
    const AXIS_R = norm([-0.008, -0.042, 0.004]);
    const PALM_R: V3 = [0, 0, 1];
    const BECKON_AT: V3 = [-0.215, 0.35, 0.1]; // the right wrist out and forward, the forearm level
    const BECKON_F = norm([-0.5, 0.2, 1]); // the hand points forward and out, a little up
    const BECKON_U = norm(add([0, 1, 0], BECKON_F, -BECKON_F[1])); // the palm up
    const POLE_REST_R: V3 = add(mx(SHOULDER), sub(ELBOW_R, mx(SHOULDER)), 4);
    const POLE_BECKON: V3 = [-0.4, 0.2, -0.06]; // the elbow down and out
    // The bow held high out to the left: the grip above the shoulder, the limbs leaning out, the
    // back of the bow toward the player (the string behind it).
    const RAISE_AT: V3 = [0.3, 0.45, 0.07];
    const SH_UP: V3 = [0.01, 0.02, 0];
    k.animation('taunt', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const beck = keys(p, [[0, 0], [0.08, 1], [0.35, 1], [0.44, 0]] as const);
        const curl = keys(p, [[0.08, 0], [0.15, 1], [0.22, 0], [0.29, 1], [0.36, 0]] as const);
        const cock = keys(p, [[0, 0], [0.08, 1], [0.36, 1], [0.45, 0]] as const);
        const raise = keys(p, [[0.38, 0], [0.5, 1], [0.84, 1], [0.97, 0]] as const);
        const env = keys(p, [[0.5, 0], [0.54, 1], [0.78, 1], [0.84, 0]] as const);
        const shake = env * Math.sin((2 * Math.PI * (p - 0.5)) / 0.1);
        const spineR: V3 = [-4 * cock, 0, 3 * raise];
        const chestR: V3 = [-4 * cock, 6 * cock, 3 * raise];
        const frame = chestFrame([Z3, spineR, chestR], Z3);
        // The right hand: forward with the palm up; it curls up toward him twice.
        const c = (10 + 75 * curl) * DEG;
        const beckonQ = quat(
          orient([], { dir: AXIS_R, up: PALM_R }, { dir: mix2(BECKON_F, Math.cos(c), BECKON_U, Math.sin(c)), up: mix2(BECKON_F, -Math.sin(c), BECKON_U, Math.cos(c)) }),
        );
        const turnR = Q_ID.clone().slerp(frame.inv.clone().multiply(beckonQ), beck);
        const wristR = lerp(WRIST_R, frame.point(add(BECKON_AT, [0, 0.012, -0.015], curl)), beck);
        const armR = reach(ARM_R, wristR, lerp(POLE_REST_R, frame.point(POLE_BECKON), beck));
        const handR = orient([armR.upper, armR.lower], { dir: AXIS_R, up: PALM_R }, { dir: turnBy(turnR, AXIS_R), up: turnBy(turnR, PALM_R) });
        // The bow arm, solved by targets as in the attack (in the chest's rest frame).
        const gripAt = add(lerp(GRIP, RAISE_AT, raise), [0, 0.014 * shake, 0]);
        const high = { dir: norm([0.55 + 0.18 * shake, 1, 0]), up: [0, 0, 1] as V3 };
        const bowWant = { dir: norm(lerp(BOW_REST.dir, high.dir, raise)), up: norm(lerp(BOW_REST.up, high.up, raise)) };
        const shL = scl(SH_UP, raise);
        const bow = bowArm(gripAt, bowWant, shL, 1, lerp(POLE_L_REST, POLE_L_AIM, raise));
        return {
          hips: { move: [0, -0.004 * raise, 0] },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-3 * cock, 0, 3 * cock + 3 * raise] },
          // Cocky: the chin up and the head cocked to his right, then away from the raised bow.
          head: { rotate: [-6 * cock - 4 * raise, -8 * raise, 9 * cock + 8 * raise] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          // The bow arm: high out to the side, shaken; the bow's top leans out, clear of the hood.
          'upperarm.L': { move: shL, rotate: bow.arm.upper },
          'forearm.L': { rotate: bow.arm.lower },
          'hand.L': { rotate: bow.hand },
          arrow: { scale: HIDE },
        };
      },
    });
  },
});
