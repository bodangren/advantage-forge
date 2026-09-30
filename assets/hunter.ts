import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Hunter — Chibi Quest hero (catalog `heroes/martial/hunter`), 1.0 m to the cap top, faces +Z.
 * Target: docs/hero-mockups/hunter_001.jpg (beardless, round human ears, a crossbow for the bow).
 * Built on the archer's body, face, and chibi skeleton with knee bones, so the heroes read as a set.
 *
 * Role: player hero seen in 3D and as a 128 px sprite: the peaked cap and feather, the green
 *   vest, the pelt on the back, and the crossbow must read.
 * One idea: a big brown peaked cap with a grey feather over a young determined face, and a
 *   crossbow held level in both hands in front of the belly (its wide prod breaks the outline).
 * Proportions: cap top 1.0 (feather above), cap brim 0.745, eyes 0.63, chin 0.48, shoulders 0.38,
 *   belt 0.25, crossbow at y 0.31 (butt at the belly, prod 0.28 wide at z 0.37).
 * Shape language: round and soft (cap dome, fists, boots, pelt roll), with the feather, the peak,
 *   and the crossbow limbs as the points and the long thin shapes.
 * Palette (60/30/10): leather brown #6b4226 (cap, belts) / vest green #5a7a3a / tan shirt #c8b088;
 *   steel #a8acb1 accents. Skin #f2c7a4, hair #4a2e1c, pelt #b8a888, trousers #5a6040.
 * Bodies: skin, hair, cap, feather, shirt, vest, leather, steel, pelt, bandage, trousers, boots,
 *   crossbow stock, prod, latch, string (drawn and slack), bolt.
 * Rig: the archer's skeleton without the hood point. The crossbow is rigid on `xbow` (a child of
 *   the right hand); the left hand holds the fore-end, so the clips solve both arms to the
 *   crossbow's pose. The drawn string, the slack string, and the bolt have their own bones: the
 *   shot swaps the strings, flies the bolt, and brings it back.
 *   Clips: idle, walk, run, attack (shoulder shot), attack2 (crouch shot), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  earInner: '#eaa98e',
  blush: '#f09a86',
  freckle: '#cf8a66',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#b07a34',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#3e2416',
  mouth: '#b0504a',
  hair: '#4a2e1c',
  cap: '#6b4226',
  capDark: '#4e2d1c',
  feather: '#b8bcc0',
  featherDark: '#4a4038',
  featherCream: '#eadfc4',
  vest: '#4c6a30',
  vestDark: '#33501f',
  shirt: '#d8c496',
  shirtDark: '#b09c70',
  lace: '#6b4226',
  steel: '#a8acb1',
  brass: '#c99a3e',
  strap: '#452515',
  pelt: '#b8a888',
  peltDark: '#8a7860',
  bandage: '#e8e0d0',
  stock: '#5a3a24',
  limb: '#3a2a20',
  string: '#d8d0c0',
  shaft: '#b98c55',
  pants: '#5a6040',
  boot: '#3a2a20',
  sole: '#241a14',
  sheath: '#4e2d1c',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => scl(a, 1 / len(a));
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const DEG = Math.PI / 180;
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

/** The elbow of a two-bone arm from the shoulder to a wrist target, bent toward `pole`. */
const elbowOf = (s: V3, w: V3, a: number, b: number, pole: V3): V3 => {
  const t = sub(w, s);
  const d = Math.min(len(t), a + b - 1e-4);
  const td = norm(t);
  const pp = sub(pole, s);
  const side = norm(sub(pp, scl(td, dot(pp, td))));
  const cosA = (a * a + d * d - b * b) / (2 * a * d);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  return add(s, add(scl(td, a * cosA), scl(side, a * sinA)));
};

// Joints. Both arms hold the crossbow level in front of the belly: the right hand at the grip,
// the left hand under the fore-end. The arms are longer than the archer's so both hands reach it.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ARM_UP = 0.074; // the archer's arm length
const ARM_LO = 0.1;
// The crossbow hangs in the right hand at the hip, muzzle down and turned toward +X; the left arm hangs.
const CARRY_PITCH = 12;
const CARRY_YAW = 25;
const rot = (q: THREE.Quaternion, v: V3): V3 => {
  const w = new THREE.Vector3(v[0], v[1], v[2]).applyQuaternion(q);
  return [w.x, w.y, w.z];
};
/** The rotation of a crossbow pointing `pitchDown` degrees below level and turned `yaw` toward +X. */
const qOf = (pitchDown: number, yaw: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(pitchDown * DEG, yaw * DEG, 0, 'YXZ'));
const wantOf = (q: THREE.Quaternion) => ({ dir: rot(q, [0, 0, 1]), up: rot(q, [0, 1, 0]) });
const Q0 = qOf(CARRY_PITCH, CARRY_YAW);
const XB: V3 = [-0.155, 0.235, 0.09];
const FIST_R = add(XB, rot(Q0, [-0.02, -0.02, -0.01]));
const WRIST_R = add(FIST_R, [0.008, 0.042, -0.004]);
const POLE_R: V3 = [-0.5, 0.3, -0.15];
const ELBOW_R = elbowOf(mx(SHOULDER), WRIST_R, ARM_UP, ARM_LO, POLE_R);
const ELBOW_L: V3 = [0.18, 0.332, 0.012];
const WRIST_L: V3 = [0.205, 0.238, 0.03];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const LEG = { hip: HIP, knee: KNEE, ankle: ANKLE };

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

/** Turn a shape built along +Y so its axis runs a to b (call `.at(...)` afterwards). */
const alongAxis = (s: sdf.Shape, a: V3, b: V3) => {
  const d = norm(sub(b, a));
  return s.rotateX(Math.acos(Math.max(-1, Math.min(1, d[1]))) / DEG).rotateY(Math.atan2(d[0], d[2]) / DEG);
};

// The crossbow: its origin (the grip) in the rest pose, and its frame (+Z forward, +Y up).
const xb = (s: sdf.Shape) => s.rotateX(CARRY_PITCH).rotateY(CARRY_YAW).at(...XB);
const xbP = (p: V3): V3 => add(XB, rot(Q0, p));
const REST_Q = wantOf(Q0);
const TIP_X = 0.14; // the prod's tip, half the width
const TIP_Z = 0.275;
const LATCH: V3 = [0, 0.036, 0.062];

export default defineAsset({
  name: 'hunter',
  description: 'Chibi hunter hero with a peaked leather cap and feather, a green vest, a pelt roll, and a crossbow.',
  detail: 0.006,
  reference: 'docs/hero-mockups/hunter_001.jpg',
  variants: {
    eyes: { brown: C.iris, green: '#3d7a35', blue: '#2f6aa8' },
    hair: { brown: C.hair, black: '#231a17', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { green: C.vest, pine: '#2f5a40', earth: '#7d6a45' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', clothing: 'green' },
    pine: { eyes: 'green', hair: 'black', skin: 'tan', clothing: 'pine' },
    earth: { eyes: 'blue', hair: 'auburn', skin: 'brown', clothing: 'earth' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      earInner: k.tint('skin', { color: C.earInner, follow: 1 }),
      freckle: k.tint('skin', { color: C.freckle, follow: 1 }),
      vest: k.tint('clothing'),
      vestDark: k.tint('clothing', { color: C.vestDark, follow: 1 }),
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
      // The crossbow, rigid on the right hand; only the death clip moves it (it drops).
      xbow: { parent: 'hand.R', at: XB },
      // The drawn string, the slack string (after the shot), and the bolt: children of the crossbow.
      'string.drawn': { parent: 'xbow', at: xbP([0, 0.01, 0.15]) },
      'string.slack': { parent: 'xbow', at: xbP([0, 0, 0.27]) },
      bolt: { parent: 'xbow', at: xbP([0, 0.036, 0.15]) },
    });

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');

    // Small round human ears: a thin oval with a hollow, turned a little to the front.
    const earPose = (s: sdf.Shape) => s.rotateZ(-6).rotateY(-12).at(0.207, 0.636, -0.012);
    const earLocal = sdf.ellipsoid([0.026, 0.047, 0.035]).smoothSubtract(0.006, sdf.ellipsoid([0.024, 0.031, 0.023]).at(0.016, 0.002, 0.004));
    const ear = earPose(earLocal);
    const earHollow = earPose(sdf.ellipsoid([0.028, 0.034, 0.025]).at(0.016, 0.002, 0.004));
    const ears = pair(ear.bone('head'));
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

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.014, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.006, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.017),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Heavy, straight brows, the inner ends low: a determined look.
    const brows = pair(
      sdf
        .extrude(profile.arc(0.16, 0.03, 75, 105), 0.3)
        .at(0, -0.16, 0.1)
        .rotateZ(13)
        .at(0.104, 0.716, 0),
    );
    // A firm mouth: a short, nearly straight line with a slight curve.
    const mouth = sdf.extrude(profile.arc(0.2, 0.013, 257, 283), 0.3).at(0, 0.532 + 0.2, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    const freckles = pair(
      sdf.union(
        ...(
          [
            [0.118, 0.575],
            [0.14, 0.582],
            [0.156, 0.568],
            [0.132, 0.558],
          ] as const
        ).map(([x, y]) => at(sdf.sphere(0.0055), x, y)),
      ),
    );

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(pair(earHollow), T.earInner, 0.006)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(freckles, T.freckle, 0.003)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ cap, peak, and feather
    const CAP_CUT = 0.745;
    const CAP_Y = 0.8;
    // A low, wide, floppy crown with a soft dent and a fold on top (the inner surface is dented too).
    const dentA = (dy: number) => sdf.ellipsoid([0.1, 0.035, 0.09]).at(0.04, 0.992 + dy, -0.03);
    const dentB = (dy: number) => sdf.ellipsoid([0.075, 0.03, 0.05]).rotateZ(25).at(-0.1, 0.978 + dy, 0.05);
    const domeO = sdf.ellipsoid([0.262, 0.168, 0.255]).at(0, CAP_Y, -0.012).smoothSubtract(0.02, dentA(0), dentB(0));
    const domeI = sdf.ellipsoid([0.246, 0.152, 0.239]).at(0, CAP_Y - 0.003, -0.012).smoothSubtract(0.02, dentA(-0.014), dentB(-0.014));
    const aboveCut = sdf.halfSpace([0, -1, 0], -CAP_CUT);
    const capShell = domeO.subtract(domeI).intersect(aboveCut);
    // The peak: a wide flat oval at the front of the brim, turned down 12 degrees.
    const peak = sdf.ellipsoid([0.19, 0.016, 0.13]).rotateX(12).at(0, CAP_CUT - 0.006, 0.25);
    const cap = sdf
      .smoothUnion(0.012, capShell, peak)
      .paintWhere(domeI.round(0.004), C.capDark, 0.01)
      .paintFn((x, y, z, base) => (y > 0.752 && y < 0.786 ? rgb(C.capDark) : base));
    k.body('cap', cap.bone('head'), { color: C.cap, roughness: 0.85 });

    // The feather on the +X side of the cap band: a flattened, curved vane (0.12 long, 0.035 wide,
    // about 0.006 thick) with a dark quill, light grey on one side of the quill and cream on the other.
    const xc = (y: number) => 3 * y * (0.12 - y);
    const vane = sdf
      .chain(
        [
          [xc(0), 0, 0, 0.008],
          [xc(0.02), 0.02, 0, 0.012],
          [xc(0.05), 0.05, 0, 0.0175],
          [xc(0.08), 0.08, 0, 0.0165],
          [xc(0.105), 0.105, 0, 0.01],
          [xc(0.12), 0.122, 0, 0.004],
        ],
        0.012,
      )
      .scale([1, 1, 0.17])
      .paintFn((x, _y, _z, _base) => (x > xc(_y) ? rgb(C.feather) : rgb(C.featherCream)));
    const quill = sdf.union(
      ...[
        [-0.03, 0.0],
        [0.0, 0.03],
        [0.03, 0.065],
        [0.065, 0.1],
        [0.1, 0.118],
      ].map(([y0, y1]) => sdf.capsule([xc(y0!), y0!, 0], [xc(y1!), y1!, 0], 0.0033)),
    ).paint(C.featherDark);
    const feather = sdf
      .union(vane, quill)
      .scale(1.25)
      .rotateY(30)
      .rotateX(-16)
      .rotateZ(-20)
      .at(0.238, 0.765, 0.03);
    k.body('feather', feather, { color: C.feather, roughness: 0.8, detail: 0.003, bone: 'head' });

    // ------------------------------------------------------------------ hair (under the cap)
    const insideCap = domeI.round(-0.002).union(sdf.halfSpace([0, 1, 0], CAP_CUT).intersect(sdf.box([1, 0.6, 1]).at(0, 0.7, 0)));
    const hairCap = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.014, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.005, -0.01)
      .intersect(sdf.halfSpace([0, -1, 0], -0.565));
    const faceMask = sdf.ellipsoid([0.215, 0.145, 0.26]).at(0, 0.612, 0.175);
    // Chunky fringe locks over the forehead, and sideburns in front of the ears.
    const lock = (x: number, dx: number, y0: number, r: number) =>
      sdf.chain(
        [
          [x - dx * 0.4, 0.76, 0.15, r * 1.3],
          [x, 0.75, 0.187, r],
          [x + dx * 0.5, y0, 0.198, r * 0.45],
        ],
        0.015,
      );
    const fringe = sdf.union(
      lock(-0.135, 0.02, 0.728, 0.028),
      lock(-0.06, -0.015, 0.735, 0.028),
      lock(0.015, 0.03, 0.726, 0.03),
      lock(0.09, -0.01, 0.733, 0.028),
      lock(0.155, 0.015, 0.722, 0.024),
    );
    const burns = pair(sdf.cone([0.182, 0.735, 0.08], [0.194, 0.628, 0.1], 0.031, 0.011));
    const hairAll = sdf.smoothUnion(0.02, hairCap.smoothSubtract(0.015, faceMask), fringe, burns);
    const hair = hairAll.intersect(insideCap).subtract(pair(ear.round(0.006)));
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ shirt, vest, sleeves
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.125, 0.29],
            [0.134, 0.25],
            [0.148, 0.212],
            [0.158, 0.178],
            [0.161, 0.163],
            [0.15, 0.153],
            [0, 0.153],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const zAt = (y: number) => sdf.raycast(torso, [0, y, 1], [0, 0, -1])![2];

    // The shirt: tan, with a rolled collar and the lace across the V of the vest.
    const laceStroke = (y: number) =>
      sdf.union(
        sdf.capsule([-0.032, y + 0.011, zAt(y) + 0.002], [0.032, y - 0.011, zAt(y) + 0.002], 0.0055),
        sdf.capsule([-0.032, y - 0.011, zAt(y) + 0.002], [0.032, y + 0.011, zAt(y) + 0.002], 0.0055),
      );
    const laces = sdf.union(laceStroke(0.418), laceStroke(0.386), laceStroke(0.354));
    const collar = sdf.torus(0.064, 0.02).scale([1, 1, 0.92]).at(0, 0.452, -0.008);
    const shirt = sdf
      .smoothUnion(0.012, torso, collar)
      .paintWhere(laces, C.lace, 0.002)
      .paintWhere(collar.round(0.004), C.shirtDark, 0.004);
    k.body('shirt', shirt.bone('spine'), { color: C.shirt, roughness: 0.9 });

    // Long sleeves: the right one rolled up at the elbow, the bandage below it.
    const upSleeve = (s: V3, e: V3, bone: string) =>
      sdf.cone(add(lerp(s, e, -0.05), [s[0] > 0 ? -0.015 : 0.015, 0.02, 0]), lerp(s, e, 1.02), 0.045, 0.041).bone(bone);
    const sleeveL = sdf.smoothUnion(
      0.014,
      upSleeve(SHOULDER, ELBOW_L, 'upperarm.L'),
      sdf.cone(ELBOW_L, lerp(ELBOW_L, WRIST_L, 0.9), 0.041, 0.037).bone('forearm.L'),
    );
    const rollR = sdf.cone(lerp(ELBOW_R, WRIST_R, -0.02), lerp(ELBOW_R, WRIST_R, 0.2), 0.047, 0.045).round(0.004).bone('forearm.R');
    const sleeveR = sdf.smoothUnion(0.014, upSleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'), rollR);
    k.body('sleeves', sdf.union(sleeveL, sleeveR).paintWhere(rollR.round(0.003), C.shirtDark, 0.004), {
      color: C.shirt,
      roughness: 0.9,
    });

    // The vest: the torso grown a little and cut into a laced V, with holes for the arms.
    const vestRange = sdf.box([0.6, 0.3, 0.6], 0.004).at(0, 0.322, 0);
    const vee = sdf
      .extrude(
        profile.polygon([
          [-0.056, 0.49],
          [0.056, 0.49],
          [0, 0.33],
        ]),
        0.3,
        0.004,
      )
      .at(0, 0, 0.2);
    const hemNotch = sdf
      .extrude(
        profile.polygon([
          [-0.03, 0.135],
          [0.03, 0.135],
          [0, 0.222],
        ]),
        0.3,
      )
      .at(0, 0, 0.15);
    const armHoles = sdf.union(
      sdf.cone([0.105, 0.402, 0], lerp(SHOULDER, ELBOW_L, 0.9), 0.052, 0.05).round(0.004),
      sdf.cone([-0.105, 0.402, 0], lerp(mx(SHOULDER), ELBOW_R, 0.9), 0.052, 0.05).round(0.004),
    );
    const neckHole = sdf.cylinder(0.062, 0.2).at(0, 0.53, -0.005);
    const stitch = (x: number, y: number, z: number) => Math.abs(y - 0.19) < 0.0035 && Math.sin(Math.atan2(z, x) * 46) > 0.15;
    const foldStroke = (deg: number) =>
      sdf.capsule([0, 0.29, 0], [0.2 * Math.sin(deg * DEG), 0.2, 0.2 * 0.78 * Math.cos(deg * DEG)], 0.006);
    const foldLines = sdf.union(...[-70, -45, -20, 20, 45, 70, 110, 180, 250].map(foldStroke));
    const vestBase = torso
      .round(0.011)
      .intersect(vestRange)
      .subtract(neckHole)
      .smoothSubtract(0.006, vee)
      .smoothSubtract(0.008, hemNotch)
      .subtract(armHoles)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.2), T.vestDark)
      .paintWhere(foldLines, T.vestDark, 0.004)
      .paintFn((x, y, z, base) => (stitch(x, y, z) ? rgb(C.shirt) : base));
    k.body('vest', vestBase.bone('spine'), { color: T.vest, roughness: 0.85 });

    // ------------------------------------------------------------------ leather: strap, belt, sheath, cuffs
    const beltY = 0.252;
    const belt = torso.round(0.014).smoothIntersect(0.006, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0));
    // The chest strap runs from the right shoulder, over the chest, to the left hip.
    const strap = torso
      .round(0.016)
      .smoothIntersect(0.005, sdf.box([0.7, 0.036, 0.7], 0.005).rotateZ(-38).at(0.01, 0.35, 0));
    // The knife sheath on the left hip, hung from the belt, with a hilt above it.
    const sheathAt = sdf.surfacePoint(belt, [0.02, 0.25, -0.16], 0.004);
    const sheathLocal = sdf.union(
      sdf.box([0.034, 0.075, 0.022], 0.009).at(0, -0.038, 0),
      sdf.box([0.038, 0.016, 0.026], 0.006).at(0, -0.005, 0),
    );
    const sheath = sheathLocal.rotateZ(-80).rotateY(180).at(...sheathAt);
    const hiltLocal = sdf.capsule([0, 0.005, 0], [0, 0.07, 0], 0.011);
    const hilt = hiltLocal.rotateZ(-80).rotateY(180).at(...sheathAt);
    const cuffL = sdf.cone(lerp(ELBOW_L, WRIST_L, 0.86), lerp(ELBOW_L, WRIST_L, 1.02), 0.042, 0.04).round(0.004).bone('forearm.L');
    const wristStrapR = sdf.cone(lerp(ELBOW_R, WRIST_R, 0.96), lerp(ELBOW_R, WRIST_R, 1.06), 0.039, 0.037).round(0.003).bone('forearm.R');
    k.body(
      'leather',
      sdf.union(belt.bone('spine'), sheath.paint(C.sheath).bone('spine'), cuffL, wristStrapR),
      { color: C.cap, roughness: 0.6 },
    );
    k.body('strap', strap.bone('spine'), { color: C.strap, roughness: 0.6 });
    k.body('hilt', hilt.bone('spine'), { color: C.stock, roughness: 0.7 });

    // The bandage on the right forearm: a wrapped band of thin rings.
    const rSkin = (t: number) => 0.036 - 0.004 * t;
    const bandBase = sdf.cone(lerp(ELBOW_R, WRIST_R, 0.24), lerp(ELBOW_R, WRIST_R, 0.96), rSkin(0.24) + 0.003, rSkin(0.96) + 0.003).round(0.001);
    const rings = sdf.union(
      ...[0.3, 0.45, 0.6, 0.75, 0.9].map((t) => {
        const c = lerp(ELBOW_R, WRIST_R, t);
        return alongAxis(sdf.torus(rSkin(t) + 0.0035, 0.0055), ELBOW_R, WRIST_R).at(...c);
      }),
    );
    k.body('bandage', sdf.union(bandBase, rings).bone('forearm.R'), { color: C.bandage, roughness: 0.95 });

    // ------------------------------------------------------------------ steel: buckles
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.056, 0.046, 0.012], 0.005).subtract(sdf.box([0.034, 0.026, 0.03], 0.003)),
        sdf.box([0.008, 0.03, 0.01], 0.003).at(0.004, 0, 0.004),
      )
      .at(0, beltY, beltZ + 0.004);
    const strapBuckleAt = sdf.surfacePoint(strap, [-0.05, 0.39, 0.2], 0.002);
    const strapBuckle = sdf
      .box([0.04, 0.046, 0.009], 0.004)
      .subtract(sdf.box([0.022, 0.026, 0.03], 0.002))
      .rotateZ(-38)
      .at(...strapBuckleAt);
    // The boots' buckled cuffs (built in the boot frame below).
    const BOOT_TURN = 12;
    const bootPose = (s: sdf.Shape) => s.rotateY(BOOT_TURN).at(ANKLE[0], 0, 0);
    const cuffAngle = 38;
    const bootBuckleLocal = sdf
      .box([0.02, 0.03, 0.008], 0.003)
      .subtract(sdf.box([0.011, 0.018, 0.03], 0.002))
      .at(0, 0, 0.06)
      .rotateY(-cuffAngle)
      .at(0, 0.074, 0);
    const bootBuckles = pair(bootPose(bootBuckleLocal).bone('foot.L'));
    k.body('brass', sdf.union(buckle.bone('spine'), strapBuckle.bone('spine'), bootBuckles), {
      color: C.brass,
      roughness: 0.35,
      metalness: 0.85,
    });

    // ------------------------------------------------------------------ pelt roll on the back
    const P1: V3 = [0.125, 0.435, -0.142];
    const P2: V3 = [-0.045, 0.29, -0.152];
    const PR = 0.054;
    const peltAxis = norm(sub(P2, P1));
    const peltLen = len(sub(P2, P1));
    const peltShape = sdf
      .capsule(P1, P2, PR)
      .displace(0.004, (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 2))
      .paintFn((x, y, z, base) => {
        const rel = sub([x, y, z], P1);
        const u = dot(rel, peltAxis);
        const r = len(sub(rel, scl(peltAxis, u)));
        const capZone = u < 0.003 || u > peltLen - 0.003;
        const n = noise.fbm(x * 60, y * 60, z * 60, 2);
        if (capZone) return Math.sin(r * 300) > 0 ? rgb(C.peltDark) : rgb('#a89878');
        return n > 0.25 ? rgb(C.peltDark) : base;
      });
    k.body('pelt', peltShape.bone('chest'), {
      color: C.pelt,
      roughness: 1,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 130, y * 130, z * 130, 2),
    });
    // Two leather straps around the roll.
    const rollStrap = (t: number) => alongAxis(sdf.torus(PR - 0.001, 0.0085), P1, P2).at(...lerp(P1, P2, t));
    k.body('pelt-straps', sdf.union(rollStrap(0.28), rollStrap(0.72)).bone('chest'), { color: C.cap, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ trousers and boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.12, 0.004], 0.046).bone('leg.L')),
    );
    k.body('trousers', pants, { color: C.pants, roughness: 0.85 });

    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.048, 0.064, 0.02).at(0, 0.052, 0),
        sdf.ellipsoid([0.056, 0.05, 0.1]).at(0, 0.048, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cone([0, 0.06, 0], [0, 0.086, 0], 0.053, 0.059).round(0.005).paint(C.cap);
    const boot = bootPose(sdf.union(bootFoot, sole.paint(C.sole), bootCuff)).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ crossbow (rigid on the right hand)
    const stock = sdf
      .smoothUnion(
        0.012,
        sdf.box([0.042, 0.05, 0.27], 0.014).at(0, 0, 0.095),
        sdf.box([0.05, 0.07, 0.05], 0.016).at(0, -0.006, -0.03), // the butt
        sdf.box([0.06, 0.06, 0.12], 0.016).at(0, -0.006, 0.14), // the fore-end
        sdf.box([0.056, 0.05, 0.05], 0.012).at(0, 0, 0.222), // the prod block
      )
      .paintWhere(sdf.box([0.08, 0.07, 0.06]).at(0, 0, -0.03), C.capDark, 0.008);
    k.body('crossbow', xb(stock), { color: C.stock, roughness: 0.65, detail: 0.004, bone: 'xbow' });

    const limbChain = sdf.chain(
      [
        [0, 0, 0.225, 0.024],
        [0.05, 0, 0.226, 0.021],
        [0.1, 0, 0.237, 0.017],
        [0.128, 0, 0.255, 0.0135],
        [TIP_X, 0, TIP_Z, 0.0105],
      ],
      0.01,
    );
    const prod = sdf.union(pair(limbChain), hard(sdf.sphere(0.014).at(TIP_X, 0, TIP_Z)));
    k.body('crossbow-prod', xb(prod), { color: C.limb, roughness: 0.5, detail: 0.004, bone: 'xbow' });

    // The latch on the stock and the stirrup at the front, in steel.
    const latch = sdf.union(
      sdf.box([0.022, 0.014, 0.024], 0.004).at(LATCH[0], 0.032, LATCH[2] + 0.004),
      sdf.torus(0.021, 0.0055).rotateX(90).at(0, 0, 0.27),
      sdf.capsule([0, 0, 0.235], [0, 0, 0.268], 0.007),
    );
    k.body('crossbow-steel', xb(latch), { color: C.steel, roughness: 0.5, metalness: 0.7, detail: 0.004, bone: 'xbow' });

    // The drawn string: from each tip back to the latch. After the shot the slack string spans the tips.
    const stringLook = { color: C.string, roughness: 0.8, detail: 0.003 };
    k.body('string-drawn', xb(hard(sdf.capsule([TIP_X, 0, TIP_Z], LATCH, 0.0036))), { ...stringLook, bone: 'string.drawn' });
    k.body('string-slack', xb(sdf.capsule([-TIP_X, 0, TIP_Z + 0.004], [TIP_X, 0, TIP_Z + 0.004], 0.0036)), { ...stringLook, bone: 'string.slack' });

    // The loaded bolt: a shaft on the stock from the string to past the prod, a steel head, grey fletching.
    const BY = 0.036;
    const bolt = sdf
      .union(
        sdf.capsule([0, BY, 0.064], [0, BY, 0.262], 0.008),
        sdf.cone([0, BY, 0.258], [0, BY, 0.31], 0.015, 0.002).paint(C.steel),
        sdf.box([0.003, 0.028, 0.05], 0.001).at(0, BY, 0.09).paint(C.feather),
        sdf.box([0.028, 0.003, 0.05], 0.001).at(0, BY, 0.09).paint(C.feather),
      )
      .paintWhere(sdf.halfSpace([0, 0, -1], -0.26), C.steel);
    k.body('bolt-mesh', xb(bolt), { color: C.shaft, roughness: 0.7, detail: 0.003, bone: 'bolt' });

    // ------------------------------------------------------------------ animation
    const { wave, bump } = motion;
    const { keys, reach, orient, follow, quat, euler } = motion;
    const HIDE: V3 = [0.001, 0.001, 0.001];
    const Z3: V3 = [0, 0, 0];
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const POLE_L: V3 = [0.4, 0.517, -0.009]; // the rest bend plane of the hanging left arm
    const POLE_AIM_L: V3 = [0.4, 0.3, -0.05];
    const POLE_AIM_R: V3 = [-0.4, 0.3, -0.05];
    const turnBy = rot;
    const chainQ = (rots: readonly V3[]) => {
      const q = new THREE.Quaternion();
      for (const r of rots) q.multiply(quat(r));
      return q;
    };
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const OFF_L: V3 = [0.052, 0.017, 0.046]; // the left wrist in the crossbow's frame when it holds the fore-end
    const FREE: { dir: V3; up: V3 } = { dir: [0, 0, 1], up: [0, 1, 0] };

    /**
     * Both arms on the crossbow: its origin at `g`, its frame turned by `q` (chest frame). `grip`
     * (0 to 1) blends the left hand from hanging to the fore-end; the right hand always holds it.
     */
    const holdHands = (g: V3, q: THREE.Quaternion, shR: V3, shL: V3, grip: number, aim: number) => {
      const want = wantOf(q);
      const qr = quat(orient([], REST_Q, want));
      const wristR = sub(g, turnBy(qr, sub(XB, WRIST_R)));
      const wristL = lerp(WRIST_L, add(g, turnBy(q, OFF_L)), grip);
      if (process.env.HUNTER_DEBUG) {
        const dR = len(sub(sub(wristR, shR), mx(SHOULDER)));
        const dL = len(sub(sub(wristL, shL), SHOULDER));
        if (dR > 0.17 || dL > 0.17) console.warn('reach', dR.toFixed(3), dL.toFixed(3));
      }
      const r = reach(ARM_R, sub(wristR, shR), lerp(POLE_R, POLE_AIM_R, aim));
      const l = reach(ARM_L, sub(wristL, shL), lerp(POLE_L, POLE_AIM_L, grip));
      return {
        wristR,
        armR: r,
        armL: l,
        handR: orient([r.upper, r.lower], REST_Q, want),
        handL: scl(orient([l.upper, l.lower], FREE, want), grip),
      };
    };
    const armPose = (h: ReturnType<typeof holdHands>, shR: V3, shL: V3) => ({
      'upperarm.L': { move: shL, rotate: h.armL.upper },
      'forearm.L': { rotate: h.armL.lower },
      'hand.L': { rotate: h.handL },
      'upperarm.R': { move: shR, rotate: h.armR.upper },
      'forearm.R': { rotate: h.armR.lower },
      'hand.R': { rotate: h.handR },
    });

    // Idle: the crossbow hangs in the right hand at the hip; the left arm rests.
    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [1 * wave(p, 1, 0.1), 0, 0] },
      }),
    });

    // Walk and run: motion.gait for the legs. The right hand keeps the crossbow at the hip, so
    // that arm only bobs; the left arm swings freely against the left leg.
    const stride = (duration: number, step: number, footLift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.092, 0, -0.025],
          toe: [0.11, 0, 0.1],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { rotate: [armSwing * 0.12 * wave(p, 2, 0.25), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03));

    // ------------------------------------------------------------------ attack: a shoulder shot
    // The crossbow rises from the hip to the chest in front of the chin and the left hand comes
    // up to the fore-end. A short aim with a slight tremble; the release swaps the strings,
    // flies the bolt 0.4 m forward (then hides it), and kicks the crossbow up. Then the arms
    // lower and the bolt is loaded again. The arms are solved to the crossbow's pose.
    const G_AIM: V3 = [-0.02, 0.362, 0.14];
    const bolts = (p: number, rel: number, flyTime: number, reload: number) => {
      const flown = p >= rel ? Math.min(1, (p - rel) / flyTime) : 0;
      const back = p >= reload;
      const shown = p < rel || back;
      return {
        bolt: { move: [0, 0, back ? 0 : 0.4 * flown] as V3, scale: shown ? ([1, 1, 1] as V3) : HIDE },
        'string.drawn': { scale: shown ? ([1, 1, 1] as V3) : HIDE },
        'string.slack': { scale: p >= rel && !back ? ([1, 1, 1] as V3) : HIDE },
      };
    };
    const REL1 = 0.52;
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const up = keys(p, [[0, 0], [0.26, 1], [0.78, 1], [0.97, 0]] as const);
        const grip = keys(p, [[0, 0], [0.1, 0], [0.26, 1], [0.78, 1], [0.93, 0]] as const);
        const kick = p >= REL1 ? Math.exp(-(p - REL1) * 22) : 0;
        const tremble = p > 0.32 && p < REL1 ? Math.sin(((p - 0.32) / (REL1 - 0.32)) * Math.PI * 4) : 0;
        const g = add(lerp(XB, G_AIM, up), [0, 0.002 * tremble, -0.03 * kick]);
        const q = Q0.clone().slerp(qOf(-2 - 5 * kick + 0.5 * tremble, 0), up);
        const sh = scl([0, 0.006, 0.05], up);
        const h = holdHands(g, q, sh, sh, grip, up);
        return {
          hips: { move: [0, -0.002 * up, 0] },
          spine: { rotate: [-2 * up, -4 * up, 0] },
          chest: { rotate: [-2 * up - 4 * kick, -2 * up, 0] },
          head: { rotate: [-2 * up - 2 * kick, -4 * up, 3 * up] },
          ...armPose(h, sh, sh),
          ...bolts(p, REL1, 0.12, 0.9),
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    const SHIN = 0.125;
    const HEEL = 0.055;
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
          hips: { move: [0, -motion.legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
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
          'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps the chest back, the hunter slumps and wobbles, then tips back over the heels
    // as one piece and lands on the back. The pelt roll props the body up, so the hips stay off
    // the floor. The right hand lets go: the crossbow (bone `xbow`) drops flat beside it.
    const LIE = 80;
    const LIE_Y = 0.13;
    const PROP = [0.1, -0.205] as const; // the pelt roll's low end, in the hips' rest frame
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0]];
    const XB_CHAIN: readonly V3[] = [...TRUNK, mx(SHOULDER), ELBOW_R, WRIST_R];
    const DROP_AT: V3 = [-0.36, 0.045, -0.5];
    const DROP_TURN = quat(orient([], REST_Q, { dir: norm([0.08, 0, 1]), up: [0, 1, 0] }));
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = Math.min(1, Math.max(0, (p - 0.36) / 0.24));
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.44, 0], [0.52, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.48, 0], [0.7, 1]] as const);
        const turnBow = keys(p, [[0.42, 0], [0.54, 1]] as const);
        const loose = keys(p, [[0.42, 0], [0.6, 1]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const heels = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsY = heels + Math.max(0, -(heels + PROP[0] * Math.cos(a) + PROP[1] * Math.sin(a)));
        const hipsMove: V3 = [0, hipsY - 0.2 - motion.legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * Math.min(1, Math.max(0, (tilt - LIE + 14) / 14));
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        // The wrists: flung back by the blow, slumped, flung out in the fall, then out on the ground.
        const standR = add(add(add(WRIST_R, scl([-0.03, 0.03, -0.05], hitB)), scl([0, -0.03, -0.02], sag)), scl([-0.06, 0, 0.04], fly));
        const armRr = reach(ARM_R, lerp(standR, [-0.22, 0.34, -0.14], land), lerp(POLE_R, [-0.3, 0.3, -0.1], land));
        const standL = add(add(add(WRIST_L, scl([0.03, 0.03, 0.04], hitB)), scl([0, -0.01, 0.02], sag)), scl([0.05, 0.05, 0.06], fly));
        const armLr = reach(ARM_L, lerp(standL, [0.2, 0.36, -0.15], land), lerp(POLE_L, [0.3, 0.32, -0.1], land));
        const handR: V3 = Z3;
        const handQ = chainQ([hipsR, spineR, chestR, armRr.upper, armRr.lower, handR]);
        const held = add(follow(XB_CHAIN, [hipsR, spineR, chestR, armRr.upper, armRr.lower, handR], XB), hipsMove);
        const drop = keys(p, [[0.42, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = turnBy(inv, sub(lerp(held, drop, loose), held));
        // The crossbow bone turns from its carried frame to lying flat (rest frame Q0 to DROP_TURN).
        const lying = handQ.clone().slerp(DROP_TURN, turnBow);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB, -6 * wob + 6 * land] },
          'upperarm.L': { rotate: armLr.upper },
          'forearm.L': { rotate: armLr.lower },
          'upperarm.R': { rotate: armRr.upper },
          'forearm.R': { rotate: armRr.lower },
          xbow: { move: d, rotate: euler(inv.clone().multiply(lying)) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a crouch shot
    // The hunter drops into a crouch (hips down, knees out, feet planted), leans forward, and
    // holds the crossbow lower and steadier: a longer aim, a harder kick, the bolt flies 0.4 m.
    const REL2 = 0.6;
    const G_AIM2: V3 = [-0.02, 0.36, 0.14];
    k.animation('attack2', {
      duration: 1.3,
      loop: false,
      pose: (_t, p) => {
        const crouch = keys(p, [[0, 0], [0.2, 1], [0.86, 1], [1, 0]] as const);
        const up = keys(p, [[0, 0], [0.28, 1], [0.84, 1], [0.98, 0]] as const);
        const grip = keys(p, [[0, 0], [0.12, 0], [0.28, 1], [0.84, 1], [0.95, 0]] as const);
        const kick = p >= REL2 ? Math.exp(-(p - REL2) * 16) : 0;
        const hold = Math.min(1, Math.max(0, (p - 0.4) / (REL2 - 0.4)));
        const tremble = p > 0.4 && p < REL2 ? Math.sin(hold * Math.PI * 6) * (0.3 + 0.7 * hold) : 0;
        const drop = 0.05 * crouch;
        const hips = { at: [0, 0.2, 0] as V3, move: [0, -drop, -0.01 * crouch] as V3, rotate: [0, 0, 0] as V3 };
        const spread = 0.045 * crouch;
        const legL = motion.legTo('L', LEG, [ANKLE[0] + spread, ANKLE[1], 0.03 * crouch], { hips });
        const legR = motion.legTo('R', LEG, [-(ANKLE[0] + spread), ANKLE[1], -0.045 * crouch], { hips });
        const g = add(lerp(XB, G_AIM2, up), [0, 0.002 * tremble + 0.004 * kick, -0.035 * kick]);
        const q = Q0.clone().slerp(qOf(-5 - 10 * kick + 0.6 * tremble, 0), up);
        const sh = scl([0, 0.006, 0.05], up);
        const h = holdHands(g, q, sh, sh, grip, up);
        return {
          hips: { move: hips.move, rotate: hips.rotate },
          spine: { rotate: [6 * crouch, -3 * up, 0] },
          chest: { rotate: [3 * crouch - 3 * kick, -2 * up, 0] },
          neck: { rotate: [-3 * crouch, 0, 0] },
          head: { rotate: [-6 * crouch - 3 * kick, -3 * up, 2 * up] },
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
          ...armPose(h, sh, sh),
          ...bolts(p, REL2, 0.1, 0.92),
        };
      },
    });

    // ------------------------------------------------------------------ victory: the crossbow held high
    // A hop, the right arm raises the crossbow beside the head (the prod turned front-to-back so
    // it clears the cap), the left fist pumps twice, then goes to the hip. Ends in a proud pose.
    const V_WRIST: V3 = [-0.27, 0.44, 0.06];
const V_OUT: V3 = [-0.28, 0.33, 0.12]; // first the wrist goes out to the side, then the crossbow swings up
    const V_WANT = { dir: norm([-0.6, 1, 0.05]), up: norm([-1, 0, 0.1]) };
    const V_POLE_R: V3 = [-0.42, 0.35, -0.05];
    const FIST_UP: V3 = [0.235, 0.5, 0.1];
    const FIST_DOWN: V3 = [0.2, 0.4, 0.12];
    const FIST_HIP: V3 = [0.19, 0.3, 0.02];
    const V_POLE_L: V3 = [0.42, 0.25, 0.05];
    const HIP_POLE_L: V3 = [0.42, 0.38, -0.15];
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.26, 1]] as const);
        const hop = keys(p, [[0.06, 0], [0.17, 1], [0.28, 0]] as const);
        const pumpBeat = keys(p, [[0.2, 0], [0.3, 1], [0.4, 0], [0.5, 1], [0.62, 0]] as const);
        const look = keys(p, [[0.08, 0], [0.24, 1], [0.5, 1], [0.75, 0]] as const);
        const proud = keys(p, [[0.55, 0], [0.8, 1]] as const);
        // The right arm: the crossbow swings up beside the head, jumping a little with each pump.
        const wristR = add(keys(p, [[0, WRIST_R], [0.12, V_OUT], [0.3, V_WRIST], [1, V_WRIST]] as const), [0, 0.012 * pumpBeat, 0]);
        const turnUp = ease(0.15, 0.3, p);
        const dirR = norm(lerp(REST_Q.dir, V_WANT.dir, turnUp));
        const upR = norm(lerp(REST_Q.up, V_WANT.up, ease(0.02, 0.1, p)));
        const wantR = { dir: dirR, up: upR };
        const armR = reach(ARM_R, wristR, lerp(POLE_R, V_POLE_R, ease(0, 0.12, p)));
        const handR = orient([armR.upper, armR.lower], REST_Q, wantR);
        // The left arm: from holding the fore-end up to a pumping fist, then to the hip.
        const wristL = keys(p, [
          [0, WRIST_L],
          [0.2, FIST_UP],
          [0.3, FIST_DOWN],
          [0.4, FIST_UP],
          [0.5, FIST_DOWN],
          [0.62, add(FIST_UP, [-0.01, -0.03, 0])],
          [0.8, FIST_HIP],
          [1, FIST_HIP],
        ] as const);
        const toHip = keys(p, [[0.62, 0], [0.8, 1]] as const);
        const poleL = lerp(lerp(POLE_L, V_POLE_L, ease(0, 0.18, p)), HIP_POLE_L, toHip);
        const armL = reach(ARM_L, wristL, poleL);
        return {
          hips: { move: [0, 0.03 * hop, 0] },
          spine: { rotate: [-3 * proud + 2 * pumpBeat, 0, -8 * raise] },
          chest: { rotate: [-6 * proud + 3 * pumpBeat - 3 * hop, 0, -3 * raise] },
          neck: { rotate: [-4 * proud, 0, 0] },
          head: { rotate: [-8 * look - 6 * proud, -12 * look, -5 * raise] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'leg.L': { rotate: [-6 * hop, 0, 5 * proud] },
          'leg.R': { rotate: [4 * hop, 0, -5 * proud] },
          'foot.L': { rotate: [12 * hop, 0, -5 * proud] },
          'foot.R': { rotate: [12 * hop, 0, 5 * proud] },
        };
      },
    });
  },
});
