import { defineAsset, motion, noise, profile, sdf, THREE } from '../src/index.js';

/**
 * Skeleton archer — Chibi Quest dungeon enemy, about 0.95 m to the top of its hood, faces +Z.
 * Target: docs/enemy-mockups/skeleton-archer_001.jpg (made with mmx, with the skeleton warrior
 * as the character reference; one front view). Built on the skeleton warrior's skull, eyes, and
 * rig, so the undead read as one family.
 *
 * Role: a ranged dungeon enemy, seen in 3D and as a 128 px sprite; the skull in the hood, the
 *   open ribcage, and the bow read.
 * One idea: a grinning skull with glowing eyes deep in a ragged green hood, over a bare ribcage
 *   crossed by a quiver strap, with a dark recurve bow in its bony hand.
 * Proportions: the knight's (head center 0.675, shoulders 0.385, hips 0.2); the ribcage from 0.29
 *   to 0.45, the loincloth hem at 0.13, the boot tops at 0.1.
 * Shape language: round and chunky (skull, hood, boots) with thin, knobby bones and ragged,
 *   pointed cloth edges for menace.
 * Palette (60/30/10): cream bone #efe2c4 and olive hood green #4f5a40; a near-black cloak
 *   #2c2b2e and leather browns (#6e4228, loincloth #6b4a33); red wraps and fletching #9a3024,
 *   brass #c8a050, and the glowing amber eyes #ffb03a as the accents.
 * Value plan: the light skull in the dark hood is the focal point; the light ribs over the dark
 *   chest cavity are the second; the dark cloak frames the light bones.
 * Bodies: bone, hand-bones, cavity, eyes, pupils, hood, mantle, cloak, leather, wraps, bracer,
 *   loincloth, brass, boots, quiver, arrows, bow, bowstring.
 * Rig: the skeleton warrior's; the bow is rigid on `hand.L`, the quiver on `chest`. Clips: idle,
 *   walk, run, attack (raise the bow, draw, loose).
 */

const C = {
  bone: '#efe2c4',
  boneShade: '#c9b58e',
  socket: '#1a1614',
  eye: '#ffb03a',
  pupil: '#1a1010',
  cavity: '#1f1a1a',
  hood: '#434c37',
  hoodDark: '#323a2a',
  hoodInside: '#1e2218',
  cloak: '#2c2b2e',
  cloakInside: '#1c1b1e',
  leather: '#6e4228',
  leatherDark: '#4a2c1c',
  wrap: '#9a3024',
  wrapDark: '#6e2018',
  cloth: '#6b4a33',
  clothDark: '#4c3222',
  brass: '#c8a050',
  boot: '#4a3024',
  bootFur: '#7a5a3c',
  lace: '#2a1c14',
  sole: '#241a16',
  quiver: '#5e3820',
  quiverDark: '#3e2414',
  shaft: '#c8a878',
  fletchRed: '#b02a24',
  fletchBlack: '#2a262c',
  bow: '#3a2a24',
  bowGrip: '#a0342a',
  string: '#e8dcc0',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** Turns local +Y toward `d` (rotateZ, then rotateX) and moves the origin to `p`. */
const alignY = (s: sdf.Shape, d: V3, p: V3) => {
  const n = norm(d);
  return s
    .rotateZ((Math.asin(-n[0]) * 180) / Math.PI)
    .rotateX((Math.atan2(n[2], n[1]) * 180) / Math.PI)
    .at(...p);
};

// Joints. The right arm hangs open; the left forearm points forward and holds the bow upright.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.172, 0.295, -0.005];
const WRIST_R: V3 = [-0.192, 0.212, 0.03];
const ELBOW_L: V3 = [0.185, 0.305, 0.0];
const WRIST_L: V3 = [0.228, 0.29, 0.09];
const HIP: V3 = [0.068, 0.195, 0];
const KNEE: V3 = [0.09, 0.13, 0.01];
const ANKLE: V3 = [0.098, 0.07, 0];
// The ends of the flat bottom of the left boot (y = 0), measured on the SDF: heel and toe.
// The toe turns out 12 degrees, so the toe point sits outboard of the heel.
const SOLE_HEEL: V3 = [0.09, 0, -0.049];
const SOLE_TOE: V3 = [0.112, 0, 0.098];
const GRIP: V3 = [WRIST_L[0] + 0.012, WRIST_L[1] - 0.038, WRIST_L[2] + 0.014];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const DEG = Math.PI / 180;
const rotYv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) + v[2] * Math.sin(d * DEG), v[1], -v[0] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];
// The bow's pose in the left fist (see bowPose): directions and points of the bow frame in the rest pose.
const BOW_TILT = -14; // the bow leans its top out, away from the hood
const bowDir = (d: V3) => rotZv(rotYv(d, 100), BOW_TILT);
const bowPoint = (p: V3) => add(bowDir(p), GRIP);
const NOCK_TOP = bowPoint([0, 0.279, -0.072]);
const NOCK_BOT = bowPoint([0, -0.18, -0.072]);
const NOCK_MID = bowPoint([0, 0.02, -0.072]); // where the arrow is nocked on the string
// The quiver's pose on the back (see quiverPose): its frame in the rest pose.
const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const quiverDir = (d: V3) => rotZv(rotXv(d, -14), 44);
const quiverPoint = (p: V3) => add(quiverDir(p), [0.08, 0.2, -0.178]);
// The arrow for the shot rests in the quiver with the others: its nock and its direction (nock to head).
const ARROW_NOCK = quiverPoint([0, 0.44, 0]);
const ARROW_DIR = quiverDir([0, -1, 0]);
// The right hand's fingertips, where it pinches the string (the hand hangs along the forearm).
const DIR_R = norm(sub(WRIST_R, ELBOW_R));
const PINCH = add(WRIST_R, scl(DIR_R, 0.07));

/** A bony hand wrapped around a vertical bow grip at `g`: a small palm and four curled finger bones. */
const boneGrip = (g: V3) =>
  sdf.smoothUnion(
    0.006,
    sdf.ellipsoid([0.03, 0.04, 0.03]).at(g[0] + 0.012, g[1], g[2] - 0.004),
    ...[0, 1, 2, 3].map((i) => {
      const y = g[1] + 0.024 - i * 0.017;
      return sdf.chain(
        [
          [g[0] + 0.022, y, g[2] + 0.01, 0.0095],
          [g[0] + 0.004, y - 0.002, g[2] + 0.026, 0.0088],
          [g[0] - 0.018, y - 0.004, g[2] + 0.014, 0.008],
        ],
        0.004,
      );
    }),
    sdf.chain(
      [
        [g[0] + 0.03, g[1] + 0.02, g[2] + 0.004, 0.01],
        [g[0] + 0.01, g[1] + 0.034, g[2] + 0.018, 0.0085],
      ],
      0.004,
    ),
  );

/**
 * A relaxed bony hand in a local frame: the wrist at the origin, the fingers down (-Y), the palm
 * toward +X (`s` = -1 mirrors it to -X), the thumb toward +Z. The finger bones are knobby at the joints and curl a little.
 */
const boneHangLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.006,
    sdf.ellipsoid([0.015, 0.016, 0.022]).at(0, -0.01, 0), // wrist bones
    sdf.ellipsoid([0.013, 0.028, 0.029]).at(0.002 * s, -0.036, 0.002), // palm
    ...[-0.021, -0.007, 0.007, 0.021].map((dz, i) => {
      const l = 1 - Math.abs(i - 1.4) * 0.07; // the middle finger is the longest
      return sdf.chain(
        [
          [0.001 * s, -0.058, dz, 0.0088],
          [0.004 * s, -0.058 - 0.018 * l, dz * 1.1, 0.0074],
          [0.008 * s, -0.058 - 0.032 * l, dz * 1.15, 0.0082],
          [0.016 * s, -0.058 - 0.046 * l, dz * 1.2, 0.0068],
        ],
        0.003,
      );
    }),
    sdf.chain(
      [
        [0.006 * s, -0.018, 0.022, 0.0095],
        [0.013 * s, -0.036, 0.036, 0.0082],
        [0.02 * s, -0.054, 0.04, 0.0072],
      ],
      0.003,
    ),
  );

/** A rib: a knobby bone chain around the chest at the height `y` (at the sternum), each side. */
const rib = (y: number, rx: number, rz: number, from: number) => {
  const pts = [from, 35, 60, 90, 120, 150, 172].map((deg): [number, number, number, number] => {
    const a = (deg * Math.PI) / 180;
    // The rib drops from the sternum to the side, then rises a little toward the spine.
    const drop = 0.034 * Math.sin(Math.min(a, Math.PI / 2)) - 0.012 * Math.max(0, Math.sin(a - Math.PI / 2));
    return [rx * Math.sin(a), y - drop, 0.004 + rz * Math.cos(a), deg === from ? 0.0125 : 0.0142];
  });
  return pair(sdf.chain(pts, 0.004));
};

export default defineAsset({
  name: 'skeleton-archer',
  description: 'Chibi skeleton archer dungeon enemy: a grinning skull with glowing eyes in a ragged green hood, a bare ribcage, a dark cloak, a quiver, and a recurve bow.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/skeleton-archer_001.jpg',

  build(k) {
    // ------------------------------------------------------------------ skeleton (rig)
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
      // The bowstring in two halves from the nocks, so the draw can pull its middle back; the
      // nocked arrow in the right hand.
      'string.top': { parent: 'hand.L', at: NOCK_TOP },
      'string.bot': { parent: 'hand.L', at: NOCK_BOT },
      // The shot arrow's bone is in the right hand; its mesh rests in the quiver, and each clip
      // places it (in the quiver, in the fingers, or in flight).
      arrow: { parent: 'hand.R', at: PINCH },
      // The shoulder caps of the mantle, on the shoulder joints. Each clip copies the upper arm's
      // pose to its cap, so a raised arm lifts the cap like a pauldron. They are separate bones
      // (not the upper arm tags) because the arms fall off in the death and the mantle stays on.
      'mantle.L': { parent: 'chest', at: SHOULDER },
      'mantle.R': { parent: 'chest', at: mx(SHOULDER) },
    });

    // ------------------------------------------------------------------ skull (the skeleton warrior's)
    const cranium = sdf.ellipsoid([0.205, 0.2, 0.19]).at(0, HEAD_Y, -0.005);
    const skullSolid = sdf.smoothUnion(
      0.04,
      cranium,
      pair(sdf.sphere(0.08).at(0.112, 0.59, 0.08)), // cheekbones
      sdf.box([0.15, 0.085, 0.13], 0.035).at(0, 0.53, 0.075), // the teeth block, narrower than the cheeks
    );
    const faceZ = (x: number, y: number) => sdf.raycast(skullSolid, [x, y, 1], [0, 0, -1])![2];
    const EYE: V3 = [0.094, 0.628, 0];
    // Each socket's top edge is a straight slant that dips toward the nose: an angry glare.
    const slant = norm([-0.42, 1, 0]);
    const socketTop = sdf.halfSpace(slant, slant[0] * (EYE[0] - 0.05) + slant[1] * (EYE[1] + 0.012));
    const socketL = sdf
      .ellipsoid([0.06, 0.054, 0.07])
      .at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) + 0.004)
      .smoothIntersect(0.008, socketTop);
    const sockets = pair(socketL);
    // The nose sits a little higher than the teeth, with a bridge of bone between them.
    const noseZ = faceZ(0, 0.59);
    const noseHole = pair(sdf.ellipsoid([0.013, 0.022, 0.03]).rotateZ(-24).at(0.011, 0.588, noseZ + 0.01));
    const browRidge = pair(
      sdf.capsule(
        [EYE[0] + 0.05, EYE[1] + 0.052, faceZ(EYE[0] + 0.05, EYE[1] + 0.052) - 0.012],
        [EYE[0] - 0.045, EYE[1] + 0.02, faceZ(EYE[0] - 0.045, EYE[1] + 0.02) - 0.01],
        0.016,
      ),
    );
    const skull = skullSolid.smoothUnion(0.02, browRidge).smoothSubtract(0.01, sockets).smoothSubtract(0.004, noseHole);
    // The grin: two rows of separate rounded teeth in a dark mouth. The front of the teeth block
    // is cut back 8 mm and painted dark; each tooth stands on that floor, turned to the skull's
    // surface, and sticks out 4 mm past the old surface, so the dark gaps show between the teeth.
    const MOUTH_RECESS = 0.008;
    const mouthBox = sdf.box([0.16, 0.075, 0.2], 0.008).at(0, 0.5315, 0.16);
    const tooth = (x: number, y: number, w: number, h: number) => {
      const s = sdf.raycast(skullSolid, [x, y, 1], [0, 0, -1])!;
      const n = sdf.normalAt(skullSolid, s);
      const yaw = (Math.atan2(n[0], n[2]) * 180) / Math.PI;
      const pitch = (-Math.atan2(n[1], Math.hypot(n[0], n[2])) * 180) / Math.PI;
      const c = add(s, scl(n, -0.007));
      return sdf.box([w, h, 0.022], 0.0055).rotateX(pitch * 0.5).rotateY(yaw).at(...c);
    };
    const toothRow = (y: number, pitch: number, w: number, h: number) =>
      [-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((i) => tooth(i * pitch, y, w, h));
    const teeth = sdf.union(...toothRow(0.551, 0.019, 0.0152, 0.03), ...toothRow(0.5135, 0.0175, 0.014, 0.028));
    const neckBones = sdf.union(
      ...[0.44, 0.47, 0.5].map((y) => sdf.cylinder(0.036, 0.022, 0.008).at(0, y, -0.015)),
      sdf.cylinder(0.026, 0.1, 0.006).at(0, 0.47, -0.015),
    );

    // ------------------------------------------------------------------ ribcage, sternum, and lumbar spine
    // Five ribs each side; the lowest is a short floating rib, so the cage ends in a V.
    // Thick ribs (chunky enough to read at 128 px), with dark gaps between them.
    const ribs = sdf.union(
      rib(0.452, 0.09, 0.074, 14),
      rib(0.416, 0.104, 0.082, 14),
      rib(0.38, 0.11, 0.084, 14),
      rib(0.344, 0.108, 0.082, 18),
      rib(0.308, 0.097, 0.074, 34),
    );
    const sternum = sdf
      .smoothUnion(
        0.01,
        sdf.box([0.032, 0.09, 0.016], 0.007),
        sdf.ellipsoid([0.011, 0.018, 0.008]).at(0, -0.05, 0.002), // the pointed lower tip
      )
      .rotateX(10)
      .at(0, 0.402, 0.078);
    const vertebra = (y: number) =>
      sdf.smoothUnion(
        0.006,
        sdf.cylinder(0.028, 0.017, 0.007).at(0, y, 0.004),
        pair(sdf.capsule([0.02, y, -0.01], [0.044, y - 0.004, -0.02], 0.008)), // side processes
      );
    const lumbar = sdf.union(vertebra(0.262), vertebra(0.286), vertebra(0.31));
    const chestBones = sdf.smoothUnion(0.006, ribs, sternum);

    // ------------------------------------------------------------------ arm and leg bones
    // Knobby ends make each long bone read as bone, even at sprite size.
    const longBone = (a: V3, b: V3, r: number, knobA: number, knobB: number) =>
      sdf.smoothUnion(0.012, sdf.capsule(a, b, r), sdf.sphere(knobA).at(...a), sdf.sphere(knobB).at(...b));
    // The forearm has two bones side by side (radius and ulna).
    const forearm = (e: V3, w: V3) => {
      const d = norm(sub(w, e));
      const side = norm([d[1], -d[0], 0]); // across the arm, in the view plane
      const o = (p: V3, s: number): V3 => [p[0] + side[0] * s, p[1] + side[1] * s, p[2] + side[2] * s];
      return sdf.smoothUnion(
        0.008,
        sdf.capsule(o(e, 0.009), o(w, 0.011), 0.0105),
        sdf.capsule(o(e, -0.009), o(w, -0.01), 0.0105),
        sdf.ellipsoid([0.02, 0.018, 0.02]).at(...e),
        sdf.ellipsoid([0.021, 0.014, 0.019]).at(...w),
      );
    };
    const armBones = sdf.union(
      longBone(SHOULDER, ELBOW_L, 0.0155, 0.027, 0.02).bone('upperarm.L'),
      forearm(ELBOW_L, WRIST_L).bone('forearm.L'),
      longBone(mx(SHOULDER), ELBOW_R, 0.0155, 0.027, 0.02).bone('upperarm.R'),
      forearm(ELBOW_R, WRIST_R).bone('forearm.R'),
    );
    const legL = sdf.smoothUnion(
      0.01,
      longBone([HIP[0], 0.2, 0], KNEE, 0.018, 0.028, 0.02),
      sdf.ellipsoid([0.03, 0.02, 0.026]).at(KNEE[0], KNEE[1] - 0.004, KNEE[2]), // knee end
      sdf.sphere(0.013).at(KNEE[0], KNEE[1], KNEE[2] + 0.024), // kneecap
      sdf.capsule(KNEE, ANKLE, 0.016),
    );
    const legBones = pair(legL.bone('leg.L'));

    const bone = sdf
      .union(
        sdf
          .union(
            skull
              .smoothSubtract(0.003, mouthBox.subtract(skullSolid.round(-MOUTH_RECESS)))
              .paintWhere(mouthBox, C.socket, 0.002)
              .bone('head'),
            neckBones.bone('neck'),
            chestBones.bone('chest'),
            lumbar.bone('spine'),
            armBones,
            legBones,
          )
          .paintWhere(sockets.round(0.012), C.boneShade, 0.012)
          .paintWhere(sockets.round(0.002), C.socket, 0.004)
          .paintWhere(noseHole.round(0.003), C.socket, 0.003),
        teeth.bone('head'), // unpainted: the teeth keep the light bone color
      )
      .paintFn((x, y, z, base) => {
        // Faint age stains.
        const n = noise.fbm(x * 22, y * 22, z * 22, 2);
        return n > 0.35 ? [base[0] * 0.93, base[1] * 0.9, base[2] * 0.84] : base;
      });
    k.body('bone', bone, { color: C.bone, roughness: 0.6, textureDensity: 2 });

    const handR = alignY(boneHangLocal(1), sub(ELBOW_R, WRIST_R), WRIST_R);
    k.body('hand-bones', sdf.union(handR.bone('hand.R'), boneGrip(GRIP).bone('hand.L')), {
      color: C.bone,
      roughness: 0.6,
      detail: 0.0035,
    });

    // The dark chest cavity behind the ribs.
    const cavity = sdf.smoothUnion(0.03, sdf.ellipsoid([0.09, 0.088, 0.066]).at(0, 0.37, 0.0), sdf.cylinder(0.04, 0.1, 0.015).at(0, 0.29, -0.04));
    k.body('cavity', cavity.bone('chest'), { color: C.cavity, roughness: 0.95 });

    // Glowing eyes deep in the sockets, with dark pupils and one highlight each.
    const eyeAt = (x: number): V3 => [x - Math.sign(x) * 0.004, EYE[1] - 0.01, faceZ(Math.abs(x), EYE[1]) - 0.04];
    const eyes = sdf.union(sdf.sphere(0.026).at(...eyeAt(EYE[0])), sdf.sphere(0.026).at(...eyeAt(-EYE[0])));
    k.body('eyes', eyes.bone('head'), { color: C.eye, roughness: 0.2, emissive: C.eye, emissiveIntensity: 1.4 });
    const pupils = sdf.union(
      ...[EYE[0], -EYE[0]].map((x) => {
        const e = eyeAt(x);
        const px = e[0] - Math.sign(x) * 0.006;
        return sdf
          .ellipsoid([0.011, 0.016, 0.008])
          .at(px, e[1] - 0.002, e[2] + 0.022)
          .paintWhere(sdf.sphere(0.0045).at(px + 0.005, e[1] + 0.007, e[2] + 0.029), '#ffffff', 0.002);
      }),
    );
    k.body('pupils', pupils.bone('head'), { color: C.pupil, roughness: 0.2, detail: 0.003 });

    // ------------------------------------------------------------------ hood (ragged green; the face shows through an oval window)
    const hoodOuter = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.23, 0.226, 0.22]).at(0, 0.694, -0.018),
      sdf.ellipsoid([0.238, 0.13, 0.22]).at(0, 0.575, -0.01), // wraps the cheeks and the jaw
      sdf.cone([0, 0.86, -0.07], [0, 0.955, -0.13], 0.075, 0.018), // a pointed tip that falls back
    );
    const hoodCavity = sdf.smoothUnion(0.02, skullSolid.round(0.014), sdf.ellipsoid([0.216, 0.21, 0.204]).at(0, 0.688, -0.01));
    const opening = sdf.ellipsoid([0.2, 0.145, 0.4]).at(0, 0.615, 0.3);
    const hoodRim = hoodOuter
      .round(0.014)
      .subtract(hoodCavity.round(-0.004))
      .intersect(opening.round(0.032))
      .subtract(opening);
    const weave = (x: number, y: number, z: number) => 0.0007 * noise.fbm(x * 120, y * 120, z * 120, 2);
    const hood = sdf
      .smoothUnion(0.012, hoodOuter.subtract(hoodCavity).smoothSubtract(0.02, opening), hoodRim)
      .intersect(sdf.halfSpace([0, -1, 0], -0.45))
      .paintWhere(hoodCavity.round(0.006), C.hoodInside, 0.012)
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 9, y * 9, z * 9, 3);
        return n > 0.25 ? [base[0] * 0.84, base[1] * 0.86, base[2] * 0.82] : base; // grime
      });
    k.body('hood', hood, { color: C.hood, roughness: 0.9, bone: 'head', bump: weave });

    // ------------------------------------------------------------------ mantle over the shoulders (ragged hem)
    const mantleSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.49],
            [0.13, 0.472],
            [0.182, 0.44],
            [0.208, 0.405],
            [0.218, 0.378],
            [0.2, 0.374],
            [0.19, 0.4],
            [0.166, 0.428],
            [0.12, 0.454],
            [0.066, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86]);
    // Irregular V cuts from below: each cutter passes through the middle and tears two dags.
    const tears = (count: number, yBase: number, seed: number) =>
      sdf.union(
        ...Array.from({ length: count }, (_, i) => {
          const a = (i * 180) / count + 7 + (noise.random(i, seed, 3) - 0.5) * 12;
          const w = 0.02 + noise.random(i, seed, 5) * 0.018;
          const h = 0.035 + noise.random(i, seed, 7) * 0.03;
          return sdf
            .extrude(
              profile.polygon([
                [-w, yBase - 0.03],
                [w, yBase - 0.03],
                [0, yBase + h],
              ]),
              0.7,
            )
            .rotateY(a);
        }),
      );
    // The front hangs open below the collar, so the ribs show.
    const chestWindow = sdf.ellipsoid([0.118, 0.14, 0.16]).at(0, 0.3, 0.17);
    const mantle = mantleSolid
      .subtract(tears(7, 0.374, 1))
      .smoothSubtract(0.012, chestWindow)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.405), C.hoodDark, 0.025);
    // Skinned, not rigid: the cap over each shoulder follows its mantle bone (the upper arm's pose),
    // so a raised arm lifts it instead of going into it. The collar and the front and back panels
    // stay on the chest. A band around the cap is in both tagged parts, so it takes half of each
    // bone and the cloth stretches over a wide band. Each tagged part is a piece of the mantle
    // itself (each side cut on its own, not mirrored, because the tears differ on each side), and
    // the union with the whole mantle keeps the surface exactly as it was.
    const CAP_AT: V3 = [0.19, 0.4, 0];
    const capZone = sdf.ellipsoid([0.07, 0.085, 0.08]).at(...CAP_AT);
    const bandZone = (s: 1 | -1) => sdf.ellipsoid([0.1, 0.115, 0.115]).at(CAP_AT[0] * s, CAP_AT[1], CAP_AT[2]);
    const mantleSkin = sdf.union(
      mantle,
      mantle.intersect(bandZone(1)).bone('mantle.L'),
      mantle.intersect(bandZone(-1)).bone('mantle.R'),
      mantle.subtract(hard(capZone)).bone('chest'),
    );
    k.body('mantle', mantleSkin, { color: C.hood, roughness: 0.9, bump: weave });

    // ------------------------------------------------------------------ cloak (behind; frames the bones)
    const cloakSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.1, 0.462],
            [0.16, 0.43],
            [0.19, 0.37],
            [0.2, 0.28],
            [0.21, 0.19],
            [0.216, 0.13],
            [0.204, 0.13],
            [0.198, 0.19],
            [0.188, 0.28],
            [0.178, 0.37],
            [0.148, 0.418],
            [0.09, 0.448],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.68]);
    const cloak = cloakSolid
      .intersect(sdf.halfSpace([0, 0, 1], -0.03))
      .subtract(tears(6, 0.13, 2))
      .paintWhere(cloakSolid.round(-0.006), C.cloakInside, 0.006);
    k.body('cloak', cloak.bone('chest'), { color: C.cloak, roughness: 0.9, bump: weave });

    // ------------------------------------------------------------------ loincloth: a hip wrap and torn flaps
    const wrapSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.258],
            [0.07, 0.256],
            [0.1, 0.246],
            [0.112, 0.225],
            [0.116, 0.195],
            [0.11, 0.175],
            [0, 0.172],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.82]);
    const flap = (front: boolean) =>
      sdf
        .extrude(
          profile.polygon([
            [0.004, 0.25],
            [0.078, 0.25],
            [0.086, 0.16],
            [0.078, 0.134],
            [0.07, 0.152],
            [0.061, 0.124],
            [0.052, 0.146],
            [0.042, 0.112],
            [0.032, 0.14],
            [0.022, 0.12],
            [0.013, 0.142],
            [0.004, 0.128],
          ]),
          0.012,
          0.004,
        )
        .rotateX(front ? -8 : 8)
        .at(0, 0, front ? 0.118 : -0.114);
    const flaps = pair(sdf.union(flap(true), flap(false)).bone('leg.L')).paintWhere(sdf.halfSpace([0, 1, 0], 0.15), C.clothDark, 0.025);
    k.body('loincloth', sdf.union(wrapSolid.bone('hips'), flaps), { color: C.cloth, roughness: 0.9, bump: weave });

    // ------------------------------------------------------------------ leather: belt and the quiver strap
    const beltY = 0.245;
    const belt = wrapSolid.round(0.01).smoothIntersect(0.005, sdf.box([0.5, 0.036, 0.5], 0.006).at(0, beltY, 0));
    // The strap lies on the ribs from the right shoulder down to the left side.
    const cageOuter = sdf.ellipsoid([0.118, 0.11, 0.092]).at(0, 0.378, 0.004);
    const strap = cageOuter
      .round(0.008)
      .subtract(cageOuter.round(-0.004))
      .smoothIntersect(0.004, sdf.box([0.7, 0.038, 0.7], 0.006).rotateZ(-40).at(0, 0.378, 0));
    k.body('leather', sdf.union(belt.bone('hips'), strap.bone('chest')), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ forearm wraps (right) and leather bracer (left)
    const dirR = norm(sub(WRIST_R, ELBOW_R));
    const wraps = sdf.union(
      alignY(sdf.cone([0, 0, 0], [0, 0.058, 0], 0.029, 0.027), dirR, lerp(ELBOW_R, WRIST_R, 0.38)),
      ...[0.42, 0.56, 0.7, 0.84, 0.97].map((t, i) =>
        alignY(
          sdf
            .torus(0.028, 0.0095)
            .rotateX(i % 2 ? 10 : -8)
            .paintWhere(sdf.halfSpace([0, -1, 0], 0.004), C.wrapDark, 0.006),
          dirR,
          lerp(ELBOW_R, WRIST_R, t),
        ),
      ),
    );
    k.body('wraps', wraps.bone('forearm.R'), { color: C.wrap, roughness: 0.85 });

    const dirL = norm(sub(WRIST_L, ELBOW_L));
    const bracerLocal = sdf
      .cone([0, 0, 0], [0, 0.085, 0], 0.034, 0.045)
      .round(0.003)
      .union(sdf.torus(0.045, 0.0065).at(0, 0.084, 0).paint(C.leatherDark))
      .paintWhere(
        sdf.union(...[0.02, 0.042, 0.064].map((y) => sdf.box([0.014, 0.006, 0.2], 0.002).rotateX(0).at(0, y, 0.1))),
        C.lace,
        0.002,
      );
    k.body('bracer', alignY(bracerLocal, dirL, lerp(ELBOW_L, WRIST_L, 0.2)).bone('forearm.L'), {
      color: C.leather,
      roughness: 0.6,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    // ------------------------------------------------------------------ brass: the belt disc and the strap ring
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const disc = sdf
      .union(sdf.cylinder(0.026, 0.01, 0.004), sdf.torus(0.016, 0.0035).at(0, 0.005, 0))
      .rotateX(90)
      .at(0, beltY, beltZ + 0.003);
    const ringAt = sdf.surfacePoint(strap, [-0.05, 0.43, 0.2], 0.002);
    const strapRing = sdf.torus(0.014, 0.0045).rotateX(90).rotateZ(-40).at(...ringAt);
    k.body('brass', sdf.union(disc.bone('hips'), strapRing.bone('chest')), { color: C.brass, roughness: 0.4, metalness: 0.75, detail: 0.0035 });

    // ------------------------------------------------------------------ boots (ankle boots with a fur cuff and laces)
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.052, 0.085, 0.018).at(0, 0.052, -0.006), sdf.ellipsoid([0.064, 0.052, 0.108]).at(0, 0.048, 0.04))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootSole = bootFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.016)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const fur = sdf.cylinder(0.06, 0.024, 0.011).at(0, 0.096, -0.006);
    const laces = sdf.union(...[0.062, 0.078].map((y) => sdf.capsule([-0.022, y, 0.058], [0.022, y + 0.006, 0.058], 0.0045)));
    const bootShape = sdf
      .union(bootFoot, bootSole.paint(C.sole), fur.paint(C.bootFur), laces.paint(C.lace))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(bootShape), {
      color: C.boot,
      roughness: 0.6,
      bump: (x, y, z) => (y > 0.083 ? 0.0016 * noise.fbm(x * 90, y * 160, z * 90, 2) : 0),
    });

    // ------------------------------------------------------------------ quiver and arrows (on the back)
    // Local frame: bottom of the quiver at the origin, the mouth up +Y; the mouth is at the right
    // shoulder, so the fletching shows over it from the front.
    const QUIVER_LEN = 0.25;
    const quiverPose = (s: sdf.Shape) => s.rotateX(-14).rotateZ(44).at(0.08, 0.2, -0.178);
    const tube = sdf.cone([0, 0, 0], [0, QUIVER_LEN, 0], 0.038, 0.048).round(0.004);
    const quiverShape = sdf
      .union(
        tube.subtract(sdf.cylinder(0.042, 0.1).at(0, QUIVER_LEN + 0.04, 0)),
        sdf.torus(0.048, 0.009).at(0, QUIVER_LEN - 0.006, 0).paint(C.quiverDark),
        sdf.cylinder(0.046, 0.026, 0.008).at(0, 0.12, 0).paint(C.quiverDark),
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.025), C.quiverDark);
    k.body('quiver', quiverPose(quiverShape).bone('chest'), {
      color: C.quiver,
      roughness: 0.6,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 140, y * 140, z * 140, 2),
    });
    const vane = sdf.extrude(
      profile.polygon([
        [0, -0.004],
        [0.019, 0.014],
        [0.018, 0.05],
        [0, 0.066],
        [-0.018, 0.05],
        [-0.019, 0.014],
      ]),
      0.008,
      0.003,
    );
    const fletching = sdf.union(vane, vane.rotateY(90));
    const arrowTips = [
      [-0.024, 0.012, 0.44],
      [0.004, 0.022, 0.47],
      [0.028, 0.006, 0.445],
      [-0.008, -0.018, 0.46],
      [0.018, -0.014, 0.43],
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
          .at(...lerp(base, top, 0.83));
        return sdf.union(sdf.capsule(base, top, 0.006), f.paint(i % 2 ? C.fletchBlack : C.fletchRed));
      }),
    );
    k.body('arrows', quiverPose(arrows).bone('chest'), { color: C.shaft, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ recurve bow in the left hand (the goblin archer's)
    // Local frame: grip at the origin, limbs along Y, the back of the bow toward +Z, the string
    // behind it at -Z. Each limb bends back toward the string (its back touches the string only
    // at the nock, 0.9 of the limb length), then the tip curls forward past the grip line into a
    // hook. The limbs are thick (chunky enough to read at 128 px); the grip keeps the fist's size.
    // `curl` scales the hook: the lower limb is shorter, so its hook is smaller.
    const limb = (len: number, sign: 1 | -1, curl: number) => {
      const n = 0.9 * len; // the nock
      return sdf.chain(
        [
          [0, 0, 0, 0.02],
          [0, 0.22 * len * sign, -0.006, 0.0225],
          [0, 0.48 * len * sign, -0.026, 0.0195],
          [0, 0.72 * len * sign, -0.045, 0.0165],
          [0, n * sign, -0.058, 0.0144],
          [0, (n + 0.022 * curl) * sign, -0.05 * curl - 0.008 * (1 - curl), 0.0132],
          [0, (n + 0.038 * curl) * sign, -0.028 * curl, 0.0123],
          [0, (n + 0.045 * curl) * sign, 0.0, 0.0115],
          [0, (n + 0.043 * curl) * sign, 0.026 * curl, 0.011],
          [0, (n + 0.034 * curl) * sign, 0.046 * curl, 0.0108],
        ],
        0.012,
      );
    };
    const UPPER = 0.31;
    const LOWER = 0.2;
    const bowLocal = sdf.union(limb(UPPER, 1, 1), limb(LOWER, -1, 0.75)).paintWhere(sdf.box([0.1, 0.085, 0.1]), C.bowGrip);
    const nockTop: V3 = [0, 0.9 * UPPER, -0.072];
    const nockBottom: V3 = [0, -0.9 * LOWER, -0.072];
    // The back of the bow faces out (+X), so the front view shows the whole curve.
    const bowPose = (s: sdf.Shape) => s.rotateY(100).rotateZ(BOW_TILT).at(...GRIP);
    k.body('bow', bowPose(bowLocal), {
      color: C.bow,
      roughness: 0.55,
      detail: 0.004,
      bone: 'hand.L',
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 30, y * 200, z * 30, 2),
    });
    void nockTop;
    void nockBottom;
    k.body('bowstring', sdf.capsule(NOCK_TOP, NOCK_MID, 0.0035), { color: C.string, roughness: 0.8, detail: 0.003, bone: 'string.top' });
    k.body('bowstring-low', sdf.capsule(NOCK_BOT, NOCK_MID, 0.0035), { color: C.string, roughness: 0.8, detail: 0.003, bone: 'string.bot' });
    // The arrow for the shot, in the quiver with the others (quiver frame: nock up at 0.44, head
    // down at 0.14): shaft, steel head, red fletching.
    const shotArrow = sdf.union(
      sdf.capsule([0, 0.15, 0], [0, 0.44, 0], 0.0058),
      sdf.cone([0, 0.16, 0], [0, 0.115, 0], 0.013, 0.002).paint('#8a8e94'),
      fletching.rotateX(180).at(0, 0.436, 0).paint(C.fletchRed),
    );
    k.body('nocked-arrow', quiverPose(shotArrow), { color: C.shaft, roughness: 0.7, detail: 0.0035, bone: 'arrow' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    const { keys, reach, orient, follow, quat, euler } = motion;
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const TURN = 45; // the body turns this far to its right (the left side toward the target)
    // Targets are planned in the world (the target is at +Z) and turned into the chest's frame.
    const toChest = (w: V3): V3 => rotYv(w, TURN);
    // The chibi head and hood are huge and the arms short, so the shot is planned in the chest's
    // frame: the string hand anchors under the right side of the jaw, in front of the ribs, with
    // the draw forearm along the arrow line; the bow hand is out in front, the bow canted.
    // The pinch at full draw: just below and in front of the right jaw corner (the head is turned
    // 42 degrees to the target), above the mantle collar and clear of the hood's cheek.
    const ANCHOR: V3 = [-0.04, 0.46, 0.228];
    // The arrow line, in the world: ahead, 30 degrees to the left and 9 degrees down. The bow hand
    // is out to the left of the draw hand and a little lower, so in the front view the bow arm
    // passes below the jaw and the draw hand shows at the jaw beside the bow fist.
    const AIM = toChest(norm([0.494, -0.156, 0.855]));
    // The extra torso turn at full aim that brings that line to straight ahead (+Z).
    const AIM_YAW = (Math.atan2(0.494, 0.855) * 180) / Math.PI;
    const REST_PT = add(ANCHOR, scl(AIM, 0.135)); // where the arrow lies on the bow hand
    const BOW_AT = add(REST_PT, [0, -0.018, 0]); // the grip at full aim
    const BOW_REST = { dir: bowDir([0, 1, 0]), up: bowDir([0, 0, 1]) }; // the limbs, and the back of the bow
    const HAND_R_REST = { dir: DIR_R, up: [0, 0, 1] as V3 };
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
    // The arrow bone's pose that puts the arrow's nock at `nock` pointing along `dir` (chest
    // frame), for a posed right arm (`rots`: upper arm, forearm, hand; `sh`: the shoulder's move).
    const ARROW_UP: V3 = [1, 0, 0];
    const arrowPose = (rots: readonly V3[], sh: V3, nock: V3, dir: V3) => {
      const q = chainQ(rots);
      const pivot = add(follow([mx(SHOULDER), ELBOW_R, WRIST_R], rots, PINCH), sh);
      const rw = quat(orient([], { dir: ARROW_DIR, up: ARROW_UP }, { dir, up: ARROW_UP }));
      const at = sub(nock, turnBy(rw, sub(ARROW_NOCK, PINCH)));
      const inv = q.clone().invert();
      return { move: turnBy(inv, sub(at, pivot)), rotate: euler(inv.multiply(rw)) };
    };
    type Pose = Record<string, { rotate?: readonly number[]; move?: readonly number[] }>;
    // Each mantle cap copies its upper arm's pose (scaled by `w`: the death lets the caps go back
    // to the chest while the arms fall off).
    const capes = <P extends Pose>(pose: P, w = 1) => {
      const cap = (s: 'L' | 'R') => {
        const a = pose[`upperarm.${s}`];
        return { rotate: slerpRot(Z3, (a?.rotate ?? Z3) as V3, w), move: scl((a?.move ?? Z3) as V3, w) };
      };
      return { ...pose, 'mantle.L': cap('L'), 'mantle.R': cap('R') };
    };
    // Keeps the shot arrow in the quiver while the right arm moves (for every other clip).
    const inQuiver = (pose: Pose, capeWeight = 1) => {
      const r = (b: string) => (pose[b]?.rotate ?? Z3) as V3;
      return capes({ ...pose, arrow: arrowPose([r('upperarm.R'), r('forearm.R'), r('hand.R')], (pose['upperarm.R']?.move ?? Z3) as V3, ARROW_NOCK, ARROW_DIR) }, capeWeight);
    };
    // The bow arm: solve the wrist so the grip lands at `grip`, with the bow turned to `want`.
    const bowArm = (grip: V3, want: { dir: V3; up: V3 }, shoulder: V3, weight: number) => {
      let wrist = sub(grip, sub(GRIP, WRIST_L));
      let arm = reach(ARM_L, sub(wrist, shoulder), [0.3, 0.05, -0.35]);
      let hand: V3 = Z3;
      for (let i = 0; i < 3; i++) {
        arm = reach(ARM_L, sub(wrist, shoulder), [0.3, 0.05, -0.35]);
        hand = slerpRot(Z3, orient([arm.upper, arm.lower], BOW_REST, want), weight);
        const g = add(follow([SHOULDER, ELBOW_L, WRIST_L], [arm.upper, arm.lower, hand], GRIP), shoulder);
        wrist = add(wrist, sub(grip, g));
      }
      return { arm, hand };
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) =>
        inQuiver({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // A slow, creaky head tilt.
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 4 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [3 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
        'hand.R': { rotate: [0, 0, 6 * wave(p, 1, 0.3)] },
        }),
    });

    // The bow arm swings less than the free arm and lifts out from the body (`lift`, degrees),
    // so the lower bow tip clears the ground and the boot while the hips drop at each step.
    // The lift also tilts the upper bow limb in toward the hood, so the hand turns back by the
    // lift plus `tiltOut` degrees (a negative `tiltOut` keeps some of the inward tilt).
    // The legs come from motion.gait: planted stance boots, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `bob` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the left arm
    // (the bow arm) is back. The hips' sway goes to gait, so the planted feet do not slide.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, lift: number, tiltOut: number) => ({
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
        return inQuiver({
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          // The skull bobs a beat late, loose on its neck bones.
          head: { rotate: [-lean + 3 * wave(p, 2, 0.3), 5 * s, 2 * wave(p, 1, 0.2)] as const },
          'upperarm.L': { rotate: [armSwing * 0.35 * s, 0, lift] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.15, 0, 0] as const },
          // The bow hand turns against the arm swing, so the bow stays upright and off the hood.
          'hand.L': { rotate: [-(armSwing * 0.35 * s - armSwing * 0.15), 0, -(lift + tiltOut)] as const },
          'forearm.R': { rotate: [-armSwing * 0.4 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          // The loose hand flops a beat late.
          'hand.R': { rotate: [8 * wave(p, 1, 0.2), 0, 0] as const },
        });
      },
    });
    // The walk turns the bow 4.4 degrees further out than before (the bow stays 2 cm off the hood);
    // the run turns it 6 degrees further out.
    // A light, bony walk; the run is quick with a flight phase.
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 28, 3, 12, -4));
    k.animation('run', stride(0.56, 0.14, 0.04, 0.42, 0.025, 50, 12, 18, -6.6));

    // ------------------------------------------------------------------ attack: a real bow shot, solved by targets
    // Plan (in the chest's rest frame): the archer turns side-on (the bow shoulder toward the
    // target), reaches back to the quiver behind the right shoulder for an arrow, brings it round
    // and nocks it on the string, raises the bow arm straight at the target, and draws the string
    // hand back along the arrow line to the jaw. A hold with a small tremble, the release: the
    // string snaps back, the arrow flies, the string hand jerks back past the jaw, the bow kicks.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const RELEASE = 0.7;
    k.animation('attack', {
      duration: 1.7,
      loop: false,
      pose: (_t, p) => {
        const turn = keys(p, [[0, 0], [0.16, 1], [0.82, 1], [1, 0]] as const);
        const aim = keys(p, [[0, 0], [0.3, 0.5], [0.4, 1], [0.82, 1], [1, 0]] as const);
        const tremble = p > 0.58 && p < RELEASE ? 0.6 * Math.sin(((p - 0.58) / (RELEASE - 0.58)) * Math.PI * 5) : 0;
        const kick = p >= RELEASE ? Math.exp(-(p - RELEASE) * 40) : 0;
        // Shoulders: the bow shoulder pushes toward the target, the string shoulder pulls back.
        // (The chibi arm is short: the string shoulder rises and comes forward under the mantle for
        // the draw, so the hand reaches the jaw with the elbow high and back on the arrow line.)
        const shL: V3 = scl([0.0, 0.03, 0.09], keys(p, [[0, 0], [0.26, 1], [0.82, 1], [1, 0]] as const)); // leads the bow arm up, over the mantle hem
        const SH_QUIVER: V3 = [0, 0.012, -0.035];
        const SH_DRAW: V3 = [0.025, 0.035, 0.06];
        const shR: V3 = keys(p, [[0, Z3], [0.12, SH_QUIVER], [0.2, SH_QUIVER], [0.33, SH_DRAW], [0.8, SH_DRAW], [1, Z3]] as const);
        // ---- the bow arm
        // In the recovery the bow swings past the side of the hood; `clear` holds it out from the hood.
        const clear = keys(p, [[0.83, 0], [0.88, 1], [0.94, 0]] as const);
        const bowAt = add(
          keys(p, [[0, GRIP], [0.2, add(GRIP, [0.04, 0.06, 0.05])], [0.38, BOW_AT], [RELEASE, BOW_AT], [RELEASE + 0.05, add(BOW_AT, [0.015, -0.01, 0.02])], [0.82, add(BOW_AT, [0.01, -0.02, 0.01])], [0.86, [0.15, 0.225, 0.24]], [0.91, toChest([0.28, 0.24, 0.16])], [0.95, add(GRIP, [0.05, -0.03, 0.02])], [1, GRIP]] as const),
          scl([0.022, 0, 0.01], clear),
        );
        // The bow is canted: its top leans to the archer's right, so the string clears the face.
        const cant = keys(p, [[0.3, 0.1], [0.38, -0.5], [0.85, -0.5], [0.9, 0.6], [1, 0.6]] as const);
        const bowWant = { dir: toChest(norm([cant, 1, 0])), up: AIM };
        const bow = bowArm(bowAt, bowWant, shL, ease(0.05, 0.36, p) * (1 - ease(0.84, 1, p)));
        const handL: V3 = add(bow.hand, [kick * -6, 0, 0]);
        // ---- the string hand: rest, the quiver (behind the right shoulder), pull the arrow out,
        // round the shoulder to the nock, draw along the arrow line to the jaw, hold, release.
        const nockNow = add(follow([SHOULDER, ELBOW_L, WRIST_L], [bow.arm.upper, bow.arm.lower, handL], NOCK_MID), shL);
        const pinchAt = keys(
          p,
          [
            [0, PINCH],
            [0.14, [-0.2, 0.34, -0.16]], // behind the right side, at the quiver
            [0.19, [-0.21, 0.35, -0.16]],
            [0.25, [-0.28, 0.35, 0.0]], // out round the right side, low (clear of the hood)
            [0.32, [-0.15, 0.39, 0.21]], // in front, below the hood
            [0.38, nockNow],
            [0.42, nockNow],
            [0.58, ANCHOR],
            [RELEASE, add(ANCHOR, [0, -0.002, -0.004])],
            [RELEASE + 0.04, add(ANCHOR, [-0.075, 0.005, -0.04])], // back along the arrow line, past the jaw
            [0.82, add(ANCHOR, [-0.09, -0.005, -0.045])],
            [0.9, [-0.26, 0.3, 0.1]], // down past the right side, clear of the mantle hem
            [1, PINCH],
          ] as const,
          'smooth',
        );
        // The draw direction of the fingers: along the aim while the arrow is on the string.
        const onString = keys(p, [[0, 0], [0.3, 0], [0.38, 1], [0.84, 1], [1, 0]] as const);
        const handWant = { dir: norm(add(scl(AIM, onString), scl([0, -1, 0.2], 1 - onString))), up: [0, 1, 0] as V3 };
        const pinchDir = norm(add(scl(AIM, onString), scl(DIR_R, 1 - onString)));
        const wristR = sub(pinchAt, scl(pinchDir, 0.07));
        // The draw elbow lifts out and back, level with the arrow and above the shoulder, so the
        // forearm lies along the arrow line and the wraps clear the ribs.
        const ELBOW_POLE: V3 = [-0.45, 0.55, -0.15];
        const armR = reach(ARM_R, sub(wristR, shR), keys(p, [[0, [-0.4, 0.1, -0.35]], [0.25, [-0.45, 0.2, -0.3]], [0.33, [-0.5, 0.45, -0.2]], [0.4, ELBOW_POLE], [0.84, ELBOW_POLE], [1, [-0.4, 0.1, -0.35]]] as const));
        const handR = slerpRot(Z3, orient([armR.upper, armR.lower], HAND_R_REST, handWant), onString);
        const pinchNow = add(follow([mx(SHOULDER), ELBOW_R, WRIST_R], [armR.upper, armR.lower, handR], PINCH), shR);
        // ---- the string: its middle follows the pinch from the nock to the release, then snaps back.
        const pulled = p >= 0.38 && p < RELEASE ? 1 : 0;
        const qL = chainQ([bow.arm.upper, bow.arm.lower, handL]);
        const string = (nock: V3, restLen: number) => {
          const n = add(follow([SHOULDER, ELBOW_L, WRIST_L], [bow.arm.upper, bow.arm.lower, handL], nock), shL);
          const mid = pulled ? pinchNow : nockNow;
          const want = norm(sub(mid, n));
          const rest = norm(sub(NOCK_MID, nock));
          return {
            rotate: orient([bow.arm.upper, bow.arm.lower, handL], { dir: rest, up: [0, 0, 1] }, { dir: want, up: turnBy(qL, [0, 0, 1]) }),
            scale: [1, len(sub(mid, n)) / restLen, 1] as V3,
          };
        };
        // ---- the arrow: taken from the quiver at 0.14-0.2, hangs down the right side while it
        // comes round, turns to the aim on the string, flies at the release, and is back in the
        // quiver (a fresh one) at the end.
        const restOnBow = add(follow([SHOULDER, ELBOW_L, WRIST_L], [bow.arm.upper, bow.arm.lower, handL], add(GRIP, [0, 0.018, 0])), shL);
        const toBow = norm(sub(restOnBow, pinchNow));
        const taken = keys(p, [[0, 0], [0.14, 0], [0.2, 1]] as const);
        const carryDir = norm(keys(p, [[0.14, ARROW_DIR], [0.2, ARROW_DIR], [0.25, [-0.3, -0.9, 0.2]], [0.32, [0.2, -0.3, 0.93]], [0.38, toBow]] as const));
        const dir = p < 0.38 ? carryDir : toBow;
        const flown = p >= RELEASE ? Math.min(1, (p - RELEASE) / 0.035) : 0;
        const inFlight = p >= RELEASE + 0.035 && p < 0.9;
        const nockAt = add(add(scl(ARROW_NOCK, 1 - taken), scl(pinchNow, taken)), scl(dir, 0.8 * flown));
        const arrow = p >= 0.9 || taken === 0 ? arrowPose([armR.upper, armR.lower, handR], shR, ARROW_NOCK, ARROW_DIR) : arrowPose([armR.upper, armR.lower, handR], shR, nockAt, norm(add(scl(ARROW_DIR, 1 - taken), scl(dir, taken))));
        const shown = inFlight ? 0.001 : 1;
        return capes({
          hips: { move: [0, -0.006 * aim, 0], rotate: [0, -30 * turn, 0] },
          // Through the draw, the hold, and the release the torso turns a further AIM_YAW degrees to
          // its right (on the spine and the chest, so the feet stay planted): the arrow line then
          // points straight ahead (+Z), along the facing. The arm pose stays the same relative to
          // the chest, and the neck and the head turn back so the skull looks at the target.
          spine: { rotate: [0, -10 * turn - AIM_YAW * 0.67 * aim, 0] },
          chest: { rotate: [-2 * aim + 0.4 * tremble - 3 * kick, -5 * turn - AIM_YAW * 0.33 * aim, 0] },
          neck: { rotate: [0, 16 * turn + 13 * aim, 0] },
          // The skull turns to the target and dips toward the string at full draw.
          head: { rotate: [keys(p, [[0, 0], [0.14, -6], [0.3, 0], [0.58, 2], [RELEASE, 2], [0.8, 0], [1, 0]] as const), 26 * turn + 13 * aim, keys(p, [[0.4, 0], [0.58, -6], [RELEASE, -6], [0.84, 0]] as const)] },
          'upperarm.L': { move: shL, rotate: bow.arm.upper },
          'forearm.L': { rotate: bow.arm.lower },
          'hand.L': { rotate: handL },
          'upperarm.R': { move: shR, rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'string.top': string(NOCK_TOP, len(sub(NOCK_MID, NOCK_TOP))),
          'string.bot': string(NOCK_BOT, len(sub(NOCK_MID, NOCK_BOT))),
          arrow: { ...arrow, scale: [shown, shown, shown] },
          // A braced stance: the front foot turns toward the target, the rear leg takes the weight.
          'leg.L': { rotate: [-6 * turn, 20 * turn, 5 * turn] },
          'leg.R': { rotate: [5 * turn, 10 * turn, -4 * turn] },
          'foot.L': { rotate: [6 * turn, 14 * turn, 0] },
          'foot.R': { rotate: [-5 * turn, 12 * turn, 0] },
        });
      },
    });

    // ------------------------------------------------------------------ hit: the skull rattles back, a step back
    k.animation('hit', {
      duration: 0.42,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.15, 1], [0.38, 0.75], [1, 0]] as const);
        const rattle = p < 0.7 ? Math.sin(p * Math.PI * 9) * (1 - p / 0.7) : 0;
        const back = -0.022 * r;
        const legL = (Math.atan2(back, 0.19) * 180) / Math.PI;
        return inQuiver({
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 6 * r, 0] },
          spine: { rotate: [-7 * r, 0, 3 * r] },
          chest: { rotate: [-8 * r, 8 * r, 0] },
          neck: { rotate: [-6 * r, 0, 0] },
          head: { rotate: [-12 * r + 4 * rattle, -8 * r, 6 * rattle] },
          'upperarm.L': { rotate: [10 * r, 0, 18 * r] },
          'hand.L': { rotate: [-10 * r, 0, 0] },
          'upperarm.R': { rotate: [12 * r, 0, -24 * r] },
          'forearm.R': { rotate: [-20 * r, 0, 0] },
          'hand.R': { rotate: [0, 0, 20 * rattle] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] },
          'foot.R': { rotate: [-12 * r, 0, 0] },
        });
      },
    });

    // ------------------------------------------------------------------ death: the bones fall apart into a heap
    // A stagger, then the skeleton collapses: the hips drop, the legs splay, the ribcage slumps,
    // the arms fall off, the skull (in its hood) tumbles off and rolls to a stop in front, and the
    // bow falls flat beside the heap. Loose parts are placed by world targets through the posed chain.
    const fk = (joints: readonly V3[], rots: readonly V3[], moves: readonly V3[], child: V3) => {
      const q = new THREE.Quaternion();
      const pos = new THREE.Vector3(joints[0]![0] + moves[0]![0], joints[0]![1] + moves[0]![1], joints[0]![2] + moves[0]![2]);
      for (let i = 0; i < joints.length; i++) {
        q.multiply(quat(rots[i]!));
        const next = i + 1 < joints.length ? joints[i + 1]! : child;
        const mv = i + 1 < joints.length ? moves[i + 1]! : Z3;
        pos.add(new THREE.Vector3(next[0] - joints[i]![0] + mv[0], next[1] - joints[i]![1] + mv[1], next[2] - joints[i]![2] + mv[2]).applyQuaternion(q));
      }
      return { at: [pos.x, pos.y, pos.z] as V3, q };
    };
    const release = (frame: { at: V3; q: THREE.Quaternion }, attached: THREE.Quaternion, want: V3, turn: THREE.Quaternion, loose: number) => {
      const inv = frame.q.clone().invert();
      const w: V3 = [frame.at[0] + (want[0] - frame.at[0]) * loose, frame.at[1] + (want[1] - frame.at[1]) * loose, frame.at[2] + (want[2] - frame.at[2]) * loose];
      const d = new THREE.Vector3(w[0] - frame.at[0], w[1] - frame.at[1], w[2] - frame.at[2]).applyQuaternion(inv);
      return { move: [d.x, d.y, d.z] as V3, rotate: euler(inv.multiply(frame.q.clone().multiply(attached).slerp(turn, loose))) };
    };
    const HIPS_AT: V3 = [0, 0.2, 0];
    const SPINE_AT: V3 = [0, 0.26, 0];
    const CHEST_AT: V3 = [0, 0.33, 0];
    const NECK_AT: V3 = [0, 0.43, -0.01];
    const HEAD_AT: V3 = [0, 0.48, -0.01];
    // The bow lying flat on the ground: limbs along the ground, its back up.
    const BOW_FLAT = quat(orient([], BOW_REST, { dir: norm([0.25, 0, 1]), up: [0, 1, 0] }));
    const BOW_GROUND: V3 = [0.3, 0.03, 0.08];
    k.animation('death', {
      duration: 1.7,
      loop: false,
      pose: (_t, p) => {
        const shudder = p > 0.1 && p < 0.34 ? wave((p - 0.1) / 0.24, 5) * Math.sin(((p - 0.1) / 0.24) * Math.PI) : 0;
        const drop = keys(p, [[0, 0], [0.34, 0], [0.48, 1], [0.53, 0.92], [0.58, 1], [1, 1]] as const);
        const off = keys(p, [[0, 0], [0.38, 0], [0.54, 1], [1, 1]] as const);
        const hipsMove: V3 = [0, -0.145 * drop, -0.02 * drop];
        const hipsR: V3 = [-5 * drop, 10 * drop, 4 * drop + 2 * shudder];
        const spineR: V3 = [keys(p, [[0, 0], [0.1, -9], [0.34, -5], [0.5, 18], [0.58, 24], [1, 24]] as const) + 2 * shudder, 0, 0];
        const chestR: V3 = [keys(p, [[0, 0], [0.1, -7], [0.34, -3], [0.5, 12], [0.6, 18], [1, 18]] as const), 3 * shudder, -8 * drop];
        const neckR: V3 = Z3;
        // The skull in its hood: on the neck until 0.4, then it tumbles off, lands in front at
        // 0.58, bounces, and rolls onto its side.
        const loose = keys(p, [[0, 0], [0.4, 0], [0.58, 1], [1, 1]] as const);
        const headFrame = fk([HIPS_AT, SPINE_AT, CHEST_AT, NECK_AT], [hipsR, spineR, chestR, neckR], [hipsMove, Z3, Z3, Z3], HEAD_AT);
        const skullAt = keys(p, [[0.4, [0, 0.46, 0.02]], [0.5, [-0.05, 0.34, 0.2]], [0.58, [-0.08, 0.22, 0.3]], [0.64, [-0.09, 0.25, 0.32]], [0.72, [-0.1, 0.22, 0.34]], [1, [-0.1, 0.22, 0.34]]] as const, 'spline');
        const skullTurn = quat(keys(p, [[0.4, [8, 0, 0]], [0.5, [30, -10, 20]], [0.58, [-10, -15, 50]], [0.64, [-16, -18, 44]], [0.72, [-20, -20, 76]], [1, [-20, -20, 78]]] as const));
        const head = release(headFrame, quat([keys(p, [[0, 0], [0.1, -14], [0.34, -6], [0.4, 8]] as const), 0, 5 * shudder]), skullAt, skullTurn, loose);
        // The bow hand lets go: the bow drops flat on the ground at the left.
        const armLRot: V3 = [keys(p, [[0, 0], [0.1, 10], [0.4, 0], [0.54, 20], [1, 24]] as const), 0, keys(p, [[0, 0], [0.1, 18], [0.4, 8], [0.54, 64], [0.62, 58], [1, 60]] as const)];
        const armLMove: V3 = [0.05 * off, -0.09 * off, -0.01 * off];
        const foreLRot: V3 = [keys(p, [[0, 0], [0.5, 12], [1, 12]] as const), 0, 0];
        const handFrame = fk([HIPS_AT, SPINE_AT, CHEST_AT, SHOULDER, ELBOW_L], [hipsR, spineR, chestR, armLRot, foreLRot], [hipsMove, Z3, Z3, armLMove, Z3], WRIST_L);
        const bowLoose = keys(p, [[0, 0], [0.34, 0], [0.5, 1], [1, 1]] as const);
        const bowPivot = sub(keys(p, [[0.34, add(BOW_GROUND, [0, 0.2, 0])], [0.5, BOW_GROUND], [0.55, add(BOW_GROUND, [0, 0.025, 0])], [0.6, BOW_GROUND], [1, BOW_GROUND]] as const), turnBy(BOW_FLAT, sub(GRIP, WRIST_L)));
        // In the stagger the bow hand turns against the arm's outward lift, so the bow leans off the hood.
        const handL = release(handFrame, quat([keys(p, [[0, 0], [0.1, -10], [0.34, -6]] as const), 0, keys(p, [[0, 0], [0.1, -6], [0.34, -4]] as const)]), bowPivot, BOW_FLAT, bowLoose);
        // The right arm drops off and lies on the ground at the right side, out and back, clear of
        // the skull that rolls to the front right.
        const armRRot: V3 = [keys(p, [[0, 0], [0.1, 12], [0.4, 0], [0.54, 18], [1, 20]] as const), keys(p, [[0, 0], [0.4, 0], [0.54, 36], [1, 40]] as const), keys(p, [[0, 0], [0.1, -22], [0.4, -8], [0.54, -26], [0.62, -18], [1, -20]] as const)];
        const armRMove: V3 = [-0.08 * off, -0.14 * off, -0.05 * off];
        return inQuiver({
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          head,
          'upperarm.L': { move: armLMove, rotate: armLRot },
          'forearm.L': { rotate: foreLRot },
          'hand.L': handL,
          'upperarm.R': { move: armRMove, rotate: armRRot },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.1, -20], [0.5, 34], [1, 40]] as const), 0, 0] },
          'hand.R': { rotate: [keys(p, [[0, 0], [0.5, 0], [0.7, 30], [1, 30]] as const), 0, 0] },
          'leg.L': { rotate: [keys(p, [[0, 0], [0.34, 0], [0.5, -22], [1, -24]] as const), 0, keys(p, [[0, 0], [0.34, 0], [0.5, 66], [0.56, 60], [1, 62]] as const)] },
          'leg.R': { rotate: [keys(p, [[0, 0], [0.34, 0], [0.5, -14], [1, -16]] as const), 0, keys(p, [[0, 0], [0.34, 0], [0.5, -68], [0.56, -62], [1, -64]] as const)] },
          'foot.L': { rotate: [keys(p, [[0, 0], [0.38, 0], [0.54, 16], [1, 16]] as const), 0, keys(p, [[0, 0], [0.38, 0], [0.54, -40], [1, -40]] as const)] },
          'foot.R': { rotate: [keys(p, [[0, 0], [0.38, 0], [0.54, 10], [1, 10]] as const), 0, keys(p, [[0, 0], [0.38, 0], [0.54, 40], [1, 40]] as const)] },
        }, 1 - off);
      },
    });
  },
});
