import { defineAsset, motion, noise, profile, sdf, THREE } from '../src/index.js';

/**
 * Hunter rival — Chibi Quest enemy (catalog `enemies/humanoid/hunter-rival`), 1.0 m tall, faces +Z.
 * Target: docs/enemy-mockups/hunter-rival_001.jpg (ears are round human ears, not pointed).
 * Built on the ranger (the rogue's body, face, skeleton, bow, quiver, and clips) with the hood,
 * capelet, and cloak taken away, so the rival reads as a smug trapper, not a hooded woodsman.
 *
 * Role: enemy human, seen in 3D and as a 128 px sprite: the cap, the beard, the tunic, the bow,
 *   and the quiver must read small.
 * One idea: a smug bearded hunter: a big flat fur-banded cap over a red-brown fringe, one raised
 *   and one lowered brow, a wide teeth-baring grin in a full red beard, a dark green wool tunic.
 * Shape language: round and chunky (cap, beard, tunic) with a few sharp accents (fangs, bow tips).
 * Palette (60/30/10): green wool #3a4a30; brown leather and fur #5a3a26 / #9a7a58 / #7a5a3a;
 *   red-brown beard #7a3a22; skin #f0c8a0; steel #8a8c92 and tooth-white #ece4d0 as accents.
 * Value plan: the light face and teeth sit between the dark cap and the dark red beard (focal point);
 *   the dark bow, boots, and belt are the second contrast.
 * Bodies: skin, hair (fringe, sideburns, brows), beardhair, flatcap, capband, fur (cuffs, hem, boot tops),
 *   wool (tunic and sleeves), vest, leather, steel, necklace-string, teeth, quiver, arrows, pants,
 *   boots, bow, bowstring (two halves), nocked-arrow.
 * Rig: the ranger's skeleton without the hood peak; `bowgrip`, `string.*`, and `arrow` as before.
 *   Clips: idle, walk, run, attack (nock, draw, loose), hit, death, taunt (the bow held high).
 */

const C = {
  skin: '#f0c8a0',
  earInner: '#e8a090',
  blush: '#e8a090',
  eyeWhite: '#ffffff',
  irisRim: '#1e1610',
  iris: '#3a2214',
  irisLow: '#6a4428',
  pupil: '#120c0a',
  lid: '#2a1a12',
  mouth: '#8a2e2c',
  teeth: '#f0ece0',
  hair: '#7a3a22',
  hairLit: '#9a4a2a',
  cap: '#7a5a3a',
  fur: '#9a7a58',
  tunic: '#3a4a30',
  tunicLit: '#4a5a3e',
  vest: '#5a3a26',
  vestLit: '#7a5236',
  tooth: '#ece4d0',
  string: '#3a2a1e',
  belt: '#4a3222',
  leatherDark: '#35200f',
  steel: '#8a8c92',
  glove: '#3a2a1e',
  boot: '#4a3020',
  lace: '#2a1e14',
  sole: '#2a1e14',
  quiver: '#6a4428',
  shaft: '#8a6a44',
  fletch: '#ece4d0',
  arrowhead: '#8a8e94',
  pants: '#3a3226',
  bow: '#3a2a1e',
  grip: '#5a3a24',
  bowstring: '#e6d8b0',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');

// Joints. The right arm hangs like the rogue's; the left (bow) arm is held out from the body,
// so the bow clears the capelet, the boot, and the ground.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW_L: V3 = [0.198, 0.342, 0];
const WRIST_L: V3 = [0.268, 0.31, 0.04];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

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
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => scl(a, 1 / len(a));
const DEG = Math.PI / 180;
const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotYv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) + v[2] * Math.sin(d * DEG), v[1], -v[0] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];

// The recurve bow in the left fist (see bowPose): limb lengths, the grip, and points of the bow
// frame in the rest pose.
const UPPER = 0.33;
const LOWER = 0.21;
const BOW_TILT = -8;
const GRIP: V3 = [WRIST_L[0] + 0.008, WRIST_L[1] - 0.044, WRIST_L[2] + 0.004];
const bowDir = (d: V3) => rotZv(rotYv(d, 100), BOW_TILT);
const bowPoint = (p: V3) => add(bowDir(p), GRIP);
const NOCK_TOP = bowPoint([0, 0.9 * UPPER, -0.072]);
const NOCK_BOT = bowPoint([0, -0.9 * LOWER, -0.072]);
const NOCK_MID = bowPoint([0, 0.035, -0.072]); // the nocking point, level with the top of the fist
const ARROW_ON_BOW = bowPoint([0, 0.035, 0]); // where the arrow lies on the bow hand
// The quiver's pose on the back, on the back (see quiverPose); the shot arrow rests in it:
// its nock and its direction (nock to head).
const Q_TILT = 40; // the quiver leans to the right, so the arrows show beside the hood
const Q_AT: V3 = [0.055, 0.29, -0.15];
const quiverDir = (d: V3) => rotZv(rotXv(d, -10), Q_TILT);
const quiverPoint = (p: V3) => add(quiverDir(p), Q_AT);
const ARROW_NOCK = quiverPoint([0, 0.43, 0]);
const ARROW_DIR = quiverDir([0, -1, 0]);
// The right fist's curled fingers, where they hook the string.
const PINCH: V3 = [-WRIST[0] + 0.008, WRIST[1] - 0.053, WRIST[2] + 0.045];

export default defineAsset({
  name: 'hunter-rival',
  description: 'Chibi rival hunter: a flat fur-banded cap, a full red beard, a smug grin, a green wool tunic, a wolf-tooth necklace, a quiver, and a recurve bow.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/hunter-rival_001.jpg',
  // Color slots for individual rivals (the first option is the default look).
  variants: {
    tunic: { green: C.tunic, brown: '#5a4a30', blue: '#2a4a5a' },
    beard: { redbrown: C.hair, black: '#24201c', blond: '#c8a050' },
    cap: { brown: C.cap, grey: '#6a6a64', black: '#2a2622' },
  },
  presets: {
    trapper: { tunic: 'brown', beard: 'black', cap: 'grey' },
    stalker: { tunic: 'blue', beard: 'blond', cap: 'black' },
    poacher: { tunic: 'green', beard: 'black', cap: 'black' },
  },

  build(k) {
    const T = {
      tunic: k.tint('tunic'),
      tunicLit: k.tint('tunic', { color: C.tunicLit, follow: 1 }),
      hair: k.tint('beard'),
      hairLit: k.tint('beard', { color: C.hairLit, follow: 1 }),
      cap: k.tint('cap'),
      band: k.tint('cap', { color: C.fur, follow: 1 }),
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
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
      // The bow's grip in the left fist: only the death clip moves it (the bow drops).
      bowgrip: { parent: 'hand.L', at: GRIP },
      'string.top': { parent: 'bowgrip', at: NOCK_TOP },
      'string.bot': { parent: 'bowgrip', at: NOCK_BOT },
      arrow: { parent: 'hand.R', at: PINCH },
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
    const nose = sdf.ellipsoid([0.022, 0.018, 0.017]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    // Small round human ears.
    const ears = pair(
      sdf
        .ellipsoid([0.034, 0.056, 0.04])
        .subtract(sdf.sphere(0.021).at(0.02, 0, 0.008))
        .rotateY(-16)
        .at(0.207, 0.6, 0.0)
        .bone('head'),
    );
    const earHollow = pair(sdf.sphere(0.026).at(0.226, 0.6, 0.012));
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    // Arms: the tunic sleeves cover them; the fists are painted with fingerless gloves.
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), mx(ELBOW), 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(mx(ELBOW), mx(WRIST), 0.036, 0.032).bone('forearm.R'),
      fistAt(mx(WRIST), -1).bone('hand.R'),
    );
    // Fingerless gloves: the palm, the back of the hand, and the wrist; the finger roll stays skin.
    const gloveAt = (w: V3, s: 1 | -1) => {
      const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
      return sdf.union(
        sdf.ellipsoid([0.058, 0.054, 0.034]).at(...o(0.008, -0.042, -0.004)),
        sdf.capsule(o(0, 0.02, 0), o(0, -0.03, 0), 0.05),
      );
    };
    const gloves = sdf.union(gloveAt(WRIST_L, 1), gloveAt(mx(WRIST), -1));

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.054, 0.052, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.044, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.039, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.027, 0.07]), EYE[0], EYE[1] + 0.001));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.013, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.013), x + 0.017, EYE[1] + 0.02),
        at(sdf.sphere(0.006), x - 0.015, EYE[1] - 0.023),
      ]),
    );
    // Half-lid on the +X eye: skin over the top third of the eye, with a dark lid line under it.
    const halfLid = at(sdf.box([0.13, 0.05, 0.14], 0.012), EYE[0], EYE[1] + 0.044);
    const halfLidLine = at(sdf.box([0.108, 0.009, 0.14], 0.003), EYE[0], EYE[1] + 0.0185);
    // The mouth: a lopsided grin (higher on the -X side) with a strip of teeth in it.
    const GRIN_Y = 0.527 + 0.085 + 0.004;
    const grin = sdf.extrude(profile.arc(0.085, 0.022, 242, 298), 0.3).rotateZ(-14).at(0, GRIN_Y, 0.1);
    const teethStrip = sdf.extrude(profile.arc(0.0855, 0.0125, 250, 290), 0.3).rotateZ(-14).at(0, GRIN_Y + 0.0005, 0.1);
    const blush = pair(at(sdf.sphere(0.036), 0.135, 0.562));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(earHollow, C.earInner, 0.006)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(halfLid, C.skin, 0.002)
      .paintWhere(halfLidLine, C.lid, 0.002)
      .paintWhere(shine, '#ffffff')
      .paintWhere(grin, C.mouth)
      .paintWhere(teethStrip, C.teeth)
      .paintWhere(gloves, C.glove, 0.004);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: fringe, sideburns, back, brows
    // Brows: separate bodies on the skin, each a chain of capsules that follows the face surface.
    // The -X brow is raised and arched; the +X brow is flat and low, on the eyelid.
    const browOn = (pts: readonly (readonly [number, number, number])[]) =>
      sdf.chain(pts.map(([x, y, r]) => [x, y, faceZ(Math.abs(x), y) + 0.001, r] as [number, number, number, number]), 0.008);
    const browRaised = browOn([
      [-0.165, 0.706, 0.0075],
      [-0.135, 0.727, 0.0088],
      [-0.1, 0.738, 0.0095],
      [-0.065, 0.732, 0.0088],
      [-0.045, 0.716, 0.008],
    ]);
    const browLow = browOn([
      [0.045, 0.7, 0.0085],
      [0.08, 0.706, 0.0098],
      [0.115, 0.708, 0.0098],
      [0.15, 0.7, 0.0088],
      [0.168, 0.687, 0.0075],
    ]);
    k.body('brow-raised', browRaised.bone('head'), { color: T.hair, roughness: 0.6, detail: 0.003 });
    k.body('brow-low', browLow.bone('head'), { color: T.hair, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ hair: fringe, sideburns, back
    const faceMask = sdf.ellipsoid([0.178, 0.19, 0.26]).at(0, 0.6, 0.17);
    const earClear = pair(sdf.ellipsoid([0.075, 0.075, 0.07]).at(0.205, 0.6, 0.0));
    const backHair = sdf
      .ellipsoid([0.217, 0.212, 0.202])
      .at(0, HEAD_Y + 0.004, -0.005)
      .smoothIntersect(0.025, sdf.ellipsoid([0.25, 0.16, 0.25]).at(0, 0.73, -0.005))
      .smoothSubtract(0.03, faceMask, earClear);
    const sideburns = pair(
      sdf.chain(
        [
          [0.172, 0.79, 0.07, 0.03],
          [0.176, 0.72, 0.09, 0.022],
          [0.172, 0.66, 0.1, 0.017],
          [0.168, 0.6, 0.1, 0.02],
        ],
        0.015,
      ),
    );
    // A wavy swoop: three overlapping locks leave the band at the -X temple, sweep across the
    // forehead to +X, and curl up at the tips.
    const lockOn = (pts: readonly (readonly [number, number, number])[]) =>
      sdf.chain(pts.map(([x, y, r]) => [x, y, faceZ(Math.abs(x), y) + 0.008, r] as [number, number, number, number]), 0.01);
    const fringe = sdf.union(
      lockOn([
        [-0.155, 0.792, 0.018],
        [-0.11, 0.768, 0.016],
        [-0.06, 0.778, 0.0135],
        [-0.01, 0.764, 0.011],
        [0.035, 0.771, 0.0085],
        [0.06, 0.786, 0.0065],
      ]),
      lockOn([
        [-0.12, 0.798, 0.018],
        [-0.06, 0.774, 0.016],
        [0.0, 0.782, 0.0135],
        [0.05, 0.762, 0.011],
        [0.095, 0.766, 0.0085],
        [0.115, 0.782, 0.0065],
      ]),
      lockOn([
        [-0.05, 0.8, 0.018],
        [0.02, 0.778, 0.016],
        [0.08, 0.772, 0.0135],
        [0.125, 0.752, 0.011],
        [0.158, 0.744, 0.0085],
        [0.175, 0.758, 0.0065],
      ]),
    );
    const hairShape = sdf
      .smoothUnion(0.01, backHair, sideburns, fringe)
      .paintWhere(sdf.union(sdf.capsule([-0.11, 0.785, 0.19], [-0.02, 0.775, 0.205], 0.01), sdf.capsule([0.05, 0.775, 0.19], [0.13, 0.755, 0.17], 0.01)), T.hairLit, 0.008);
    k.body('hair', hairShape, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ the full beard
    const beardTop = 0.512;
    const jaw = head.round(0.014).intersect(sdf.halfSpace([0, 1, 0], beardTop));
    const beardSides = pair(sdf.ellipsoid([0.06, 0.065, 0.1]).at(0.185, 0.555, 0.07)).intersect(head.round(0.014));
    const bib = sdf.ellipsoid([0.13, 0.078, 0.1]).at(0, 0.478, 0.082);
    const beardStrands = sdf.union(
      ...[-0.09, -0.05, -0.01, 0.03, 0.07, 0.11].map((x, i) =>
        sdf.capsule([x, 0.5, 0.17], [x * 1.1, 0.43 + (i % 2) * 0.008, 0.17], 0.008),
      ),
    );
    const beardShape = sdf
      .smoothUnion(0.02, jaw, beardSides, bib)
      .paintWhere(beardStrands, T.hairLit, 0.01);
    k.body('beardhair', beardShape.bone('head'), {
      color: T.hair,
      roughness: 0.7,
      detail: 0.005,
      textureDensity: 1.5,
      bump: (x, y, z) => 0.0022 * Math.sin(x * 260 + Math.sin(y * 42 + z * 20) * 2.2) + 0.001 * noise.fbm(x * 60, y * 40, z * 60, 2),
    });

    // ------------------------------------------------------------------ the flat cap with a fur band
    const CAP_Y = 0.81;
    const CAP_TILT = 3; // the front dips a little
    const capPose = (s: sdf.Shape) => s.rotateX(CAP_TILT).at(0, CAP_Y, 0);
    const crown = sdf
      .ellipsoid([0.222, 0.108, 0.205])
      .at(0, 0.034, -0.004)
      .intersect(sdf.halfSpace([0, -1, 0], 0.0));
    k.body('flatcap', capPose(crown), {
      color: T.cap,
      roughness: 0.85,
      detail: 0.005,
      bone: 'head',
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 45, y * 45, z * 45, 3),
    });
    const bandShape = sdf.torus(0.198, 0.03).scale([1, 1, 0.94]);
    const furBump = (x: number, y: number, z: number) => 0.0028 * noise.fbm(x * 110, y * 110, z * 110, 2) + 0.0014 * Math.sin(Math.atan2(z, x) * 150 + y * 60);
    k.body('capband', capPose(bandShape), { color: T.band, roughness: 1, detail: 0.005, bone: 'head', bump: furBump });

    // ------------------------------------------------------------------ wool tunic with sleeves
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
    const sleeve = (s: V3, e: V3, w: V3, side: 'L' | 'R') =>
      sdf.smoothUnion(
        0.02,
        sdf.sphere(0.058).at(s[0], s[1] + 0.004, s[2]).bone(`upperarm.${side}`),
        sdf.cone(s, e, 0.056, 0.05).bone(`upperarm.${side}`),
        sdf.cone(e, lerp(e, w, 1.02), 0.05, 0.049).bone(`forearm.${side}`),
      );
    const sleeves = sdf.union(sleeve(SHOULDER, ELBOW_L, WRIST_L, 'L'), sleeve(mx(SHOULDER), mx(ELBOW), mx(WRIST), 'R'));
    const tunicLitAt = sdf.union(
      sdf.sphere(0.05).at(0.14, 0.4, 0.06),
      sdf.sphere(0.05).at(-0.14, 0.39, 0.05),
      sdf.sphere(0.06).at(0, 0.28, 0.12),
    );
    const wool = sdf.union(torso.bone('spine'), sleeves).paintWhere(tunicLitAt, T.tunicLit, 0.05);
    const knit = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      return 0.0016 * Math.sin(y * 330 + Math.sin(a * 40) * 1.6) * Math.sin(a * 60 + y * 30) + 0.0008 * noise.fbm(x * 50, y * 50, z * 50, 2);
    };
    k.body('wool', wool, { color: T.tunic, roughness: 0.95, textureDensity: 1.5, detail: 0.007, bump: knit });

    // ------------------------------------------------------------------ open leather vest
    const vestShell = torso
      .round(0.014)
      .subtract(torso.round(0.001))
      .intersect(sdf.halfSpace([0, -1, 0], -0.19))
      .intersect(sdf.halfSpace([0, 1, 0], 0.425));
    const vestOpening = sdf
      .extrude(
        profile.polygon([
          [-0.045, 0.18],
          [0.045, 0.18],
          [0.085, 0.44],
          [-0.085, 0.44],
        ]),
        0.3,
      )
      .at(0, 0, 0.15);
    const vest = vestShell
      .subtract(vestOpening)
      .paintWhere(sdf.union(sdf.sphere(0.06).at(0.13, 0.3, 0.05), sdf.sphere(0.05).at(-0.12, 0.34, 0.06)), C.vestLit, 0.04);
    k.body('vest', vest.bone('spine'), {
      color: C.vest,
      roughness: 0.7,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------------ belt, strap, pouch
    const beltY = 0.252;
    const belt = torso.round(0.02).smoothIntersect(0.006, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0));
    const baldric = torso
      .round(0.02)
      .smoothIntersect(0.005, sdf.box([0.7, 0.034, 0.7], 0.005).rotateZ(-38).at(0.01, 0.35, 0));
    const pouchAt = sdf.surfacePoint(belt, [-0.11, 0.24, 0.12], 0);
    const pouchBody = sdf.box([0.056, 0.066, 0.036], 0.012).rotateY(-38);
    const pouchFlap = sdf.box([0.062, 0.03, 0.042], 0.01).rotateY(-38).at(0, 0.024, 0.002);
    const pouch = sdf
      .union(pouchBody, pouchFlap.paint(C.leatherDark))
      .at(pouchAt[0] - 0.012, pouchAt[1] - 0.034, pouchAt[2] + 0.004);
    k.body('leather', sdf.union(belt.bone('spine'), baldric.bone('spine'), pouch.bone('spine')), {
      color: C.belt,
      roughness: 0.6,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });

    // ------------------------------------------------------------------ steel: round buckle, strap buckle, flap stud
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.torus(0.026, 0.0068).rotateX(90), sdf.box([0.006, 0.05, 0.008], 0.002).at(0.004, 0, 0), sdf.box([0.03, 0.006, 0.008], 0.002).at(0, 0, 0))
      .at(0, beltY, beltZ + 0.006);
    const strapBuckleAt = sdf.surfacePoint(baldric, [-0.052, 0.39, 0.2], 0.002);
    const strapBuckle = sdf
      .box([0.03, 0.036, 0.008], 0.004)
      .subtract(sdf.box([0.016, 0.02, 0.03], 0.002))
      .rotateZ(-38)
      .at(...strapBuckleAt);
    const flapStud = sdf.sphere(0.009).at(pouchAt[0] - 0.012, pouchAt[1] - 0.018, pouchAt[2] + 0.03);
    k.body('steel', sdf.union(buckle.bone('spine'), strapBuckle.bone('spine'), flapStud.bone('spine')), {
      color: C.steel,
      roughness: 0.32,
      metalness: 0.9,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ fur: cuffs, tunic hem, boot tops
    const ringAt = (c: V3, dir: V3, R: number, r: number) => {
      const d = norm(dir);
      return sdf
        .torus(R, r)
        .rotateX((Math.asin(d[2]) * 180) / Math.PI)
        .rotateZ((Math.atan2(-d[0], d[1]) * 180) / Math.PI)
        .at(...c);
    };
    const cuffL = ringAt(lerp(ELBOW_L, WRIST_L, 0.985), sub(WRIST_L, ELBOW_L), 0.05, 0.02).bone('forearm.L');
    const cuffR = ringAt(lerp(mx(ELBOW), mx(WRIST), 0.985), sub(mx(WRIST), mx(ELBOW)), 0.05, 0.02).bone('forearm.R');
    const hem = sdf.torus(0.158, 0.024).scale([1, 1, 0.79]).at(0, 0.168, 0).bone('spine');
    // Tall boot tops: a fur torus around the shaft, built in the boot frame (see boots below).
    const bootTop = sdf.torus(0.0525, 0.018).at(0, 0.133, 0);
    const turnOut = (s: sdf.Shape) => s.rotateY(12).at(ANKLE[0], 0, 0);
    const furTops = pair(turnOut(bootTop).bone('shin.L'));
    k.body('fur', sdf.union(cuffL, cuffR, hem, furTops), { color: C.fur, roughness: 1, detail: 0.005, bump: furBump });

    // ------------------------------------------------------------------ wolf-tooth necklace
    const tunicFront = (x: number, y: number) => sdf.raycast(torso, [x, y, 1], [0, 0, -1])![2];
    const nYAt = (x: number) => 0.418 - 0.04 * (1 - (x / 0.115) ** 2);
    const onChest = (x: number, lift: number): V3 => {
      const y = nYAt(x);
      return [x, y, tunicFront(x, y) + lift];
    };
    // The cord (a chain that follows the chest, like a torus R 0.09 hung on the neck).
    const cordPts = [-0.11, -0.09, -0.07, -0.05, -0.025, 0, 0.025, 0.05, 0.07, 0.09, 0.11].map((x) => [...onChest(x, 0.005), 0.006] as [number, number, number, number]);
    k.body('necklace-string', sdf.chain(cordPts, 0.006).bone('chest'), { color: C.string, roughness: 0.8, detail: 0.004 });
    // Twelve chunky beads along the front (alternating cream shades) and a fang at the center.
    const beads = sdf.union(
      ...Array.from({ length: 12 }, (_, i) => {
        const x = (i - 5.5) * 0.0195;
        return sdf.sphere(0.012).at(...onChest(x, 0.009)).paint(i % 2 ? '#d8d0c0' : C.tooth);
      }),
      sdf.cone(onChest(0, 0.012).map((v, n) => (n === 1 ? v - 0.008 : v)) as unknown as V3, onChest(0, 0.018).map((v, n) => (n === 1 ? v - 0.038 : v)) as unknown as V3, 0.0125, 0.0015).paint(C.tooth),
    );
    k.body('beads', beads.bone('chest'), { color: C.tooth, roughness: 0.45, detail: 0.004 });

    // ------------------------------------------------------------------ quiver and arrows (on the back)
    // Local frame: bottom of the quiver at the origin, the mouth up +Y.
    const QUIVER_LEN = 0.24;
    const quiverPose = (s: sdf.Shape) => s.rotateX(-10).rotateZ(Q_TILT).at(...Q_AT);
    const tube = sdf.cone([0, 0, 0], [0, QUIVER_LEN, 0], 0.036, 0.046).round(0.004);
    const quiverShape = sdf
      .union(
        tube.subtract(sdf.cylinder(0.04, 0.1).at(0, QUIVER_LEN + 0.04, 0)),
        sdf.torus(0.046, 0.009).at(0, QUIVER_LEN - 0.006, 0).paint(C.leatherDark), // rolled mouth
        sdf.cylinder(0.044, 0.026, 0.008).at(0, 0.12, 0).paint(C.leatherDark), // strap band
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.025), C.leatherDark);
    k.body('quiver', quiverPose(quiverShape).bone('chest'), { color: C.quiver, roughness: 0.6 });

    // Five arrows fanned in the mouth; only the shafts and the grey goose fletching show.
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
      ...arrowTips.map(([x, z, len], i) => {
        const top: V3 = [x * 2.6, len, z * 2.6];
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
    // The arrow for the shot, in the middle of the quiver (quiver frame: nock up at 0.43, the
    // head down in the tube). Its bone hides it in every clip but the shot.
    const shotArrow = sdf.union(
      sdf.capsule([0, 0.2, 0], [0, 0.43, 0], 0.0055),
      sdf.cone([0, 0.205, 0], [0, 0.165, 0], 0.012, 0.002).paint(C.arrowhead),
      fletching.at(0, 0.358, 0).paint(C.fletch),
    );
    k.body('nocked-arrow', quiverPose(shotArrow), { color: C.shaft, roughness: 0.7, detail: 0.0035, bone: 'arrow' });


    // ------------------------------------------------------------------ legs and tall laced boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.12, 0.004], 0.046).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });

    // Tall boot built at the ankle's ground point, then turned out a little: the foot on `foot.L`,
    // the shaft and its laces on `shin.L`; the fur top is in the fur body.
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.048, 0.064, 0.02).at(0, 0.052, 0),
        sdf.ellipsoid([0.056, 0.05, 0.1]).at(0, 0.048, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootShaft = sdf.cone([0, 0.055, 0], [0, 0.135, 0], 0.05, 0.053).round(0.003);
    const laces = sdf.union(...[0.082, 0.098, 0.114].map((y) => sdf.box([0.05, 0.0075, 0.06]).at(0, y, 0.06)));
    const boot = sdf.union(
      turnOut(sdf.union(bootFoot, sole.paint(C.sole))).bone('foot.L'),
      turnOut(bootShaft.paintWhere(laces, C.lace, 0.002)).bone('shin.L'),
    );
    k.body('boots', pair(boot), {
      color: C.boot,
      detail: 0.007,
      roughness: 0.6,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 45, y * 45, z * 45, 2),
    });

    // ------------------------------------------------------------------ recurve longbow in the left hand
    // Local frame: grip at the origin, limbs along Y, the back of the bow toward +Z, the string
    // behind it at -Z. Each limb bends back toward the string, then the tip curls forward.
    const limb = (len: number, sign: 1 | -1) =>
      sdf.chain(
        ([
          [0, 0, 0, 0.017],
          [0, 0.22 * len * sign, -0.007, 0.0135],
          [0, 0.48 * len * sign, -0.03, 0.0115],
          [0, 0.72 * len * sign, -0.056, 0.0098],
          [0, 0.88 * len * sign, -0.066, 0.0086],
          [0, 0.97 * len * sign, -0.052, 0.0078],
          [0, 1.02 * len * sign, -0.026, 0.0072],
          [0, 1.03 * len * sign, 0.0, 0.0068],
          [0, 1.015 * len * sign, 0.02, 0.0064],
        ] as [number, number, number, number][]).map((q): [number, number, number, number] => [q[0], q[1], q[2], q[3] * 1.35]),
        0.012,
      );
    const bowLocal = sdf
      .union(limb(UPPER, 1), limb(LOWER, -1))
      .paintWhere(sdf.box([0.1, 0.07, 0.1]), C.grip);
    // The back of the bow faces out (+X), so the front view shows the whole curve.
    const bowPose = (s: sdf.Shape) => s.rotateY(100).rotateZ(BOW_TILT).at(...GRIP);
    k.body('bow', bowPose(bowLocal), { color: C.bow, roughness: 0.55, detail: 0.004, bone: 'bowgrip' });
    // The string in two halves that meet at the nocking point, each on its own bone.
    const stringLook = { color: C.string, roughness: 0.8, detail: 0.003 };
    k.body('bowstring', sdf.capsule(NOCK_TOP, NOCK_MID, 0.0035), { ...stringLook, bone: 'string.top' });
    k.body('bowstring-low', sdf.capsule(NOCK_BOT, NOCK_MID, 0.0035), { ...stringLook, bone: 'string.bot' });


    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const HIDE: V3 = [0.001, 0.001, 0.001]; // the shot arrow's scale outside the shot

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
        arrow: { scale: HIDE },
      }),
    });

    // The legs come from motion.gait: planted stance feet, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `hop` the hips bob.
    // The heel and the toe are the ends of the boot sole on the ground (the boot turns out 12 deg).
    // The bow arm swings less than the free arm and lifts out from the body (`lift`, degrees),
    // so the bow tip clears the ground and the boot while the hips drop at each step.
    // The lift also tilts the upper bow limb (above the shoulder) in toward the hood, so the
    // hand turns back by the lift plus `tiltOut` degrees: the bow leans out, clear of the hood.
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      armSwing: number,
      lean: number,
      hop: number,
      flop: number,
      lift: number,
      tiltOut: number,
    ) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, { // left heel strike at 0.25, with the left arm back
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
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The hood's peak nods twice per cycle, a little after the steps.
          'upperarm.L': { rotate: [armSwing * 0.35 * s, 0, lift] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.2, 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          'hand.L': { rotate: [0, 0, -(lift + tiltOut)] as const },
          arrow: { scale: HIDE },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 20, 3, 0.006, 3, 12, 8));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 30, 12, 0.03, 5, 19, 6));

    // ------------------------------------------------------------------ attack: a bow shot, solved by targets
    // Plan (in the chest's rest frame): the archer turns side-on, raises the bow in front, brings
    // the string hand up and nocks the arrow, then pushes the bow out at the target while the
    // string hand draws back along the arrow line to the anchor under the right jaw. A short hold,
    // the release: the string snaps forward, the arrow is gone, the string hand flicks back past
    // the jaw, and the bow tips forward in the open hand. Then back to rest.
    // The head and the hood are big and the arms short: the anchor is under the jaw, in front of
    // the cowl, and the bow leans its top out, away from the hood.
    const { keys, reach, orient, follow, quat, euler } = motion;
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
    const CHAIN_L = [SHOULDER, ELBOW_L, WRIST_L] as const;
    const CHAIN_R = [mx(SHOULDER), mx(ELBOW), mx(WRIST)] as const;
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
    const ANCHOR: V3 = [-0.01, 0.424, 0.19]; // the pinch at full draw: under the right jaw
    const BOW_AT = add(add(ANCHOR, scl(AIM, 0.135)), [0, -0.022, 0]); // the grip at full draw
    const BOW_NOCK = add(BOW_AT, [-0.01, 0, -0.02]); // the grip while the arrow is nocked
    const BOW_REST = { dir: bowDir([0, 1, 0]), up: bowDir([0, 0, 1]) }; // the limbs, the back of the bow
    const HAND_R_REST = { dir: norm(sub(mx(WRIST), mx(ELBOW))), up: [0, 0, 1] as V3 };
    // The draw hand: the forearm along the arrow line, the palm toward the neck.
    const HAND_R_DRAW = { dir: AIM, up: norm([AIM[2], 0, -AIM[0]]) };
    const OFF_R = sub(PINCH, mx(WRIST));
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
      const at = sub(nock, turnBy(rw, sub(ARROW_NOCK, PINCH)));
      const inv = q.clone().invert();
      return { move: turnBy(inv, sub(at, pivot)), rotate: euler(inv.multiply(rw)) };
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

    const HAND_OUT: [number, number] = [14, 20]; // extra degrees on the bow hand (attack, taunt): the bow limbs clear the belt and cuffs
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
        const lean = norm(add(add([0, 1, 0], scl(side, 0.55)), scl(AIM, 0.25 * kick)));
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
          'hand.L': { rotate: [bow.hand[0], bow.hand[1], bow.hand[2] + HAND_OUT[0] * r] as V3 },
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
    // The archer's hit. The head and the chest snap back and the hips give way: the left
    // foot stays planted and the right foot steps back, then all returns quickly. The bow arm
    // swings a little out and the hand tilts the bow top out, clear of the hood. The hood point
    // lags behind the head and flops late.
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.055; // the back of the boot, behind the ankle's ground point
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const flop = keys(p, [[0.08, 0], [0.3, 1], [0.5, -0.4], [0.68, 0.15], [0.85, 0]] as const);
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
    // The archer's death. The blow snaps the chest back, the archer slumps forward and
    // wobbles, then tips back over the heels as one piece and lands on the back (and the quiver).
    // The quiver and the fletching behind the back prop the body up, so the hips stay off the
    // floor and the arms hang back to it. The arms are solved by targets in the chest's rest
    // frame. The left hand opens in the
    // fall and the `bowgrip` bone carries the bow (and its string) to lie flat on the floor beside
    // the left hand, the string out. The hood point flops down last.
    const LIE = 80; // the hips' final tilt back, degrees
    const LIE_Y = 0.13; // the hips' height when the archer lies on the back
    // The fletching over the right shoulder (above and behind the hips pivot, in the hips' rest
    // frame) is the lowest point of the lying body: the hips rise so that it stays on the floor.
    const PROP = [0.43, -0.36] as const;
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
        const tipUp = keys(p, [[0.36, 0], [0.54, 1], [0.62, 1], [0.7, 0]] as const);
        const tipDown = keys(p, [[0.62, 0], [0.72, 1.15], [0.8, 0.92], [0.88, 1]] as const);
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
        const standR = add(add(add(mx(WRIST), scl([-0.05, 0.02, -0.05], hitB)), scl([0, -0.06, -0.03], sag)), scl([-0.07, 0, 0.04], fly));
        const armR = reach(ARM_R, lerp(standR, [-0.23, 0.33, -0.13], land), lerp(mx(ELBOW), [-0.3, 0.3, -0.1], land));
        const standL = add(add(add(WRIST_L, scl([0.03, 0.03, 0.04], hitB)), scl([0, -0.01, 0.02], sag)), scl([0.05, 0.05, 0.06], fly));
        const armL = reach(ARM_L, lerp(standL, [0.2, 0.36, -0.15], land), lerp(ELBOW_L, [0.3, 0.32, -0.1], land));
        // The bow hand tilts the bow top out in the blow, clear of the hood.
        const handL: V3 = [0, 0, -14 * hitB - 8 * fly];
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

    // ------------------------------------------------------------------ taunt: the bow held high and a fist pump
    // She hops and swings the bow up high on her left, beside the hood: the bow stands in front
    // of the ear with its back to the front, so the limbs and the string stay clear of the hood
    // and the ear tip. The right fist comes up and pumps twice, then goes to her hip. She ends in
    // a proud pose and holds it: the chest out, the chin up, the bow high, the hood point at
    // rest. The arms are solved by targets in the chest's rest frame, like the shot.
    const V_GRIP: V3 = [0.27, 0.53, 0.14]; // the bow grip, high beside the hood
    // The limbs lean out; the back of the bow faces front and a little in, so the string is out and behind.
    const V_BOW = { dir: norm([0.4, 1, 0.15]), up: norm([-0.35, 0, 1]) };
    const V_POLE_L: V3 = [0.45, 0.3, -0.1];
    const FIST_UP: V3 = [-0.225, 0.48, 0.1]; // the right wrist: the fist up
    const FIST_DOWN: V3 = [-0.2, 0.4, 0.12]; // the right wrist at the bottom of a pump
    const FIST_HIP: V3 = [-0.19, 0.3, 0.02]; // the right wrist: the fist on the hip
    const V_POLE_R: V3 = [-0.4, 0.25, 0.05];
    const HIP_POLE_R: V3 = [-0.42, 0.38, -0.15];
    k.animation('taunt', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.24, 1]] as const);
        const hop = keys(p, [[0.06, 0], [0.17, 1], [0.28, 0]] as const);
        const pumpBeat = keys(p, [[0.2, 0], [0.3, 1], [0.4, 0], [0.5, 1], [0.62, 0]] as const);
        const look = keys(p, [[0.08, 0], [0.24, 1], [0.5, 1], [0.75, 0]] as const);
        const proud = keys(p, [[0.55, 0], [0.8, 1]] as const);
        const flop = keys(p, [[0.1, 0], [0.2, -1], [0.32, 0.8], [0.42, -0.4], [0.52, 0.5], [0.66, -0.2], [0.8, 0]] as const);

        // ---- the bow arm: the bow swings up and forward to stand high beside the hood; it jumps a
        // little with each pump.
        const shL = scl([0.004, 0.018, 0.01], raise);
        const bowAt = add(
          keys(p, [
            [0, GRIP],
            [0.12, add(GRIP, [0.05, 0.12, 0.12])],
            [0.24, add(V_GRIP, [0, 0.012, 0])],
            [0.32, V_GRIP],
            [1, V_GRIP],
          ] as const),
          [0, 0.01 * pumpBeat, 0],
        );
        const r = ease(0.02, 0.22, p);
        const bowWant = { dir: norm(lerp(BOW_REST.dir, V_BOW.dir, r)), up: norm(lerp(BOW_REST.up, V_BOW.up, r)) };
        const bow = bowArm(bowAt, bowWant, shL, 1, lerp(POLE_L_REST, V_POLE_L, r));

        // ---- the right fist: up, two pumps, then to the hip.
        const wristR = keys(p, [
          [0, mx(WRIST)],
          [0.2, FIST_UP],
          [0.3, FIST_DOWN],
          [0.4, FIST_UP],
          [0.5, FIST_DOWN],
          [0.62, add(FIST_UP, [0.01, -0.03, 0])],
          [0.8, FIST_HIP],
          [1, FIST_HIP],
        ] as const);
        const toHip = keys(p, [[0.62, 0], [0.8, 1]] as const);
        const poleR = lerp(lerp(POLE_R_REST, V_POLE_R, ease(0, 0.18, p)), HIP_POLE_R, toHip);
        const armR = reach(ARM_R, wristR, poleR);

        return {
          hips: { move: [0, 0.03 * hop, 0] },
          // The body leans a little to the right, away from the bow, which lifts the bow higher.
          spine: { rotate: [-3 * proud + 2 * pumpBeat, 0, 5 * raise] },
          chest: { rotate: [-6 * proud + 3 * pumpBeat - 3 * hop, 0, 3 * raise] },
          neck: { rotate: [-4 * proud, 0, 0] },
          head: { rotate: [-8 * look - 6 * proud, 12 * look, 5 * raise] },
          'upperarm.L': { move: shL, rotate: bow.arm.upper },
          'forearm.L': { rotate: bow.arm.lower },
          'hand.L': { rotate: [bow.hand[0], bow.hand[1], bow.hand[2] + HAND_OUT[1] * r] as V3 },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          arrow: { scale: HIDE },
          'leg.L': { rotate: [-6 * hop, 0, 5 * proud] },
          'leg.R': { rotate: [4 * hop, 0, -5 * proud] },
          'foot.L': { rotate: [12 * hop, 0, -5 * proud] },
          'foot.R': { rotate: [12 * hop, 0, 5 * proud] },
        };
      },
    });
  },
});

