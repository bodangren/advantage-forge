import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Beast-rider — Chibi Quest hero (catalog `heroes/martial/beast-rider`), 1.0 m to the top of the
 * wolf-ear hood, faces +Z. Target: docs/hero-mockups/beast-rider_001.jpg (the wolf cub is not part
 * of the asset; the chin tuft is left out). Built on the ranger (the archer's body, face, and
 * skeleton with knee bones and `hoodtip`), so the heroes read as one set.
 *
 * Role: player hero (Griffin Riders), seen in 3D and as a 128 px sprite: the wolf-pelt hood with
 *   its two round ears, the big-eyed face under it, the fur collar, and the upright spear read.
 * One idea: a grey-tan wolf-pelt hood with two round ears and a bone-bead trim frames a
 *   striped, big-eyed face; a shaggy fur collar and a tall iron-leaf spear finish the outline.
 * Proportions: ear tips 1.0, hood crown 0.96, brow 0.72, eyes 0.63, chin 0.48, collar 0.43,
 *   rope wrap 0.25, tunic hem 0.14 (jagged), boot cuffs 0.145, spear 1.15 (butt on the ground).
 * Palette (60/30/10): pelt #a89078 (shadow #7a6650, rim #c8b8a0) and tunic #c8b088 as the two big
 *   masses; fur #d8c8a8 and leather #8a5a35 as the second; iron #6a6e74 and the dark hair #4a2e1c
 *   as the small accents. Skin #f2c7a4, cheek stripes #5a3a2a.
 * Value plan: the dark hair fringe and the shadow inside the hood frame the light face (focal
 *   point); the dark spear shaft and boots are the second contrast.
 * Bodies: skin, hood (pelt + ears + crown tuft), beads, hair, tunic (+ sleeves), skirt, fur
 *   (collar, cuffs, boot cuffs), leather, iron, rope, pants, boots, spear, spear-head.
 * Rig: the ranger's skeleton without the bow bones. The spear is rigid on `hand.R`, held upright
 *   beside the right shoulder with the butt at y 0. Clips: idle, walk, run, attack (a forward
 *   thrust), attack2 (an overhead strike), hit, death, victory (the spear held high).
 */

const C = {
  skin: '#f2c7a4',
  earInner: '#eaa98e',
  blush: '#f09a86',
  freckle: '#cf8a66',
  eyeWhite: '#f6f1ea',
  irisRim: '#1e1a14',
  iris: '#3d7a45',
  irisLow: '#86ad4a',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#5a3520',
  mouth: '#b0504a',
  stripe: '#5a3a2a',
  hair: '#4a2e1c',
  pelt: '#8a7a62',
  peltShadow: '#6a5a48',
  earDark: '#5a4a3a',
  peltRim: '#b0a088',
  bone: '#e6dcc4',
  fur: '#e8dcc0',
  tunic: '#c8b088',
  tunicFold: '#a08860',
  leather: '#6b4226',
  leatherDark: '#8a6a42',
  iron: '#4a4f55',
  rope: '#b09a70',
  ropeDark: '#8a7650',
  skirt: '#a0804a',
  shaft: '#3a2a20',
  head: '#6a6e74',
  pants: '#7a6650',
  boot: '#5a3a24',
  sole: '#3a2416',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');

// Joints. Both arms hang the same way (the left hand is open at the side, the right fist holds the spear).
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => scl(a, 1 / len(a));
const DEG = Math.PI / 180;
const rotYv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) + v[2] * Math.sin(d * DEG), v[1], -v[0] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const Z3: V3 = [0, 0, 0];

/** A ring of radius R and tube r around the axis `d` through `c` (a cuff on a limb). */
const ringAt = (c: V3, d: V3, R: number, r: number) => {
  const n = norm(d);
  const tz = -Math.asin(n[0]) / DEG;
  const tx = Math.atan2(n[2], n[1]) / DEG;
  return sdf.torus(R, r).rotateZ(tz).rotateX(tx).at(...c);
};

/** The right fist: palm, a finger roll at the front, and a thumb over it, placed from the wrist. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.042, 0.047, 0.048]).at(...o(0.008, -0.042, 0.004)),
    sdf.capsule(o(-0.01, -0.064, 0.033), o(-0.006, -0.042, 0.046), 0.019),
    sdf.cone(o(0.022, -0.025, 0.028), o(0.001, -0.036, 0.053), 0.018, 0.014),
  );
};
/** The open hand hanging at the side: a flat palm, four fingers side by side, a thumb forward. */
const openHandAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  const fingers = [-0.021, -0.007, 0.007, 0.021].map((z, i) => {
    const l = [0.03, 0.038, 0.036, 0.028][i]!;
    return sdf.capsule(o(0.004, -0.062, z), o(0.0, -0.062 - l, z + 0.004), 0.0095);
  });
  return sdf.smoothUnion(
    0.012,
    sdf.ellipsoid([0.02, 0.036, 0.034]).at(...o(0.006, -0.04, 0.0)),
    ...fingers,
    sdf.capsule(o(0.004, -0.04, 0.03), o(0.0, -0.07, 0.048), 0.0105),
  );
};

// The spear: the shaft passes through the right fist, leans out, and its butt stands on y = 0.
const FIST: V3 = [mx(WRIST)[0] - 0.008, WRIST[1] - 0.042, WRIST[2] + 0.004];
const SPEAR_D = norm([-0.17, 1, 0.05]);
const SPEAR_LEN = 1.15;
const GRIP_T = FIST[1] / SPEAR_D[1]; // distance from the butt to the fist along the shaft
const BUTT = add(sub(FIST, scl(SPEAR_D, GRIP_T)), [-0.012, 0, 0]);
const arc = (a: V3, b: V3) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...a), new THREE.Vector3(...b));
const turnBy = (q: THREE.Quaternion, v: V3): V3 => {
  const w = new THREE.Vector3(v[0], v[1], v[2]).applyQuaternion(q);
  return [w.x, w.y, w.z];
};

export default defineAsset({
  name: 'beast-rider',
  description: 'Chibi beast-rider hero in a wolf-pelt hood with two ears, a fur collar, a hide tunic, and a short iron-leaf spear.',
  detail: 0.006,
  reference: 'docs/hero-mockups/beast-rider_001.jpg',
  variants: {
    eyes: { green: C.iris, brown: '#6e4020', blue: '#2f6aa8' },
    hair: { brown: C.hair, black: '#231a17', red: '#a8501f' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    pelt: { 'grey-tan': C.pelt, white: '#e0dcd4', black: '#3a3430' },
  },
  presets: {
    default: { eyes: 'green', hair: 'brown', skin: 'fair', pelt: 'grey-tan' },
    white: { eyes: 'blue', hair: 'brown', skin: 'fair', pelt: 'white' },
    black: { eyes: 'brown', hair: 'black', skin: 'tan', pelt: 'black' },
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
      pelt: k.tint('pelt'),
      peltShadow: k.tint('pelt', { color: C.peltShadow, follow: 1 }),
      peltRim: k.tint('pelt', { color: C.peltRim, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      // The crown tuft of the pelt: it nods a little with the steps.
      hoodtip: { parent: 'head', at: [0, 0.89, -0.06], tail: [0, 0.968, -0.1] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
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
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    // Round human ears, hidden inside the hood.
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.044, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.196, 0.605, 0.004)
        .bone('head'),
    );
    const earHollow = pair(sdf.sphere(0.021).at(0.214, 0.605, 0.012));
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
      openHandAt(WRIST, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), mx(ELBOW), 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(mx(ELBOW), mx(WRIST), 0.036, 0.032).bone('forearm.R'),
      fistAt(mx(WRIST), -1).bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.12, 0.022, 62, 112), 0.3).at(0.102, 0.727 - 0.12, 0.1));
    const smile = sdf.extrude(profile.arc(0.08, 0.013, 236, 304), 0.3).at(0, 0.527 + 0.08, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    // Three thin dark stripes on each cheek, fanned out like whiskers.
    const stripe = (x: number, y: number, deg: number) =>
      sdf.extrude(profile.rect([0.072, 0.0145], 0.006), 0.3).rotateZ(deg).at(x, y, 0.1);
    const stripes = pair(sdf.union(stripe(0.15, 0.585, 16), stripe(0.153, 0.558, -2), stripe(0.148, 0.531, -20)));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(earHollow, T.earInner, 0.006)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(stripes, C.stripe, 0.002)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ pelt hood (up), two ears
    const dome = sdf.ellipsoid([0.262, 0.27, 0.255]).at(0, 0.69, -0.022);
    const cavity = sdf.ellipsoid([0.236, 0.238, 0.228]).at(0, 0.682, -0.015);
    // The opening: its top edge rests at the brow (0.79 at the center, lower at the temples).
    const opening = sdf.ellipsoid([0.236, 0.175, 0.42]).at(0, 0.62, 0.3);
    const rim = dome
      .round(0.016)
      .subtract(cavity.round(-0.004))
      .intersect(opening.round(0.038))
      .subtract(opening);
    // A fold ridge around the face opening (0.02 thick), which the bead trim sits on.
    const ridge = opening
      .round(0.026)
      .subtract(opening.round(0.006))
      .intersect(dome.round(0.02).subtract(dome.round(-0.002)))
      .paint(T.pelt);
    // The crown tuft: three soft spikes of fur on `hoodtip`.
    const crown = sdf.union(
      sdf.cone([0, 0.92, -0.03], [0, 0.99, -0.05], 0.03, 0.006),
      sdf.cone([0.02, 0.92, -0.035], [0.05, 0.975, -0.06], 0.024, 0.005),
      sdf.cone([-0.02, 0.92, -0.035], [-0.05, 0.975, -0.06], 0.024, 0.005),
    );
    // The wolf ears: broad, round-tipped, open to the front, tilted out, with a dark inner.
    const earLocal = sdf
      .cone([0, -0.03, 0], [0, 0.15, 0], 0.085, 0.024)
      .round(0.006)
      .scale([1, 1, 0.55]);
    const earInside = sdf.cone([0, 0.0, 0.02], [0, 0.135, 0.02], 0.064, 0.012).round(0.004).scale([1, 1, 0.8]);
    const earPose = (s: sdf.Shape) => s.rotateY(22).rotateZ(-30).at(0.155, 0.845, -0.005);
    const earOuter = earPose(earLocal);
    const earIn = earPose(earInside.at(0, 0, 0.012));
    const ear = earOuter.subtract(earIn).paintWhere(earIn.round(0.012), C.earDark, 0.006);
    const hoodShape = sdf
      .smoothUnion(
        0.012,
        sdf.smoothUnion(0.03, dome.bone('head'), crown.bone('hoodtip')).subtract(cavity).smoothSubtract(0.02, opening),
        rim.paint(T.peltRim).bone('head'),
        ridge.bone('head'),
        pair(ear).bone('head'),
      )
      .intersect(sdf.halfSpace([0, -1, 0], -0.44))
      .paintWhere(cavity.round(0.006), T.peltShadow, 0.012);
    // Soft shadow toward the back and the neck: the pelt darkens where the light does not reach.
    const shadeC = rgb(C.peltShadow);
    const hood = hoodShape.displace(0.004, (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 2)).paintFn((x, y, z, base) => {
      const back = Math.max(0, (-z - 0.02) / 0.25);
      const low = Math.max(0, (0.6 - y) / 0.2);
      return mixRgb(base, shadeC, Math.min(0.6, back * 0.45 + low * 0.4));
    });
    k.body('hood', hood, { color: T.pelt, roughness: 0.95, detail: 0.007, maxTriangles: 11000, bump: (x, y, z) => 0.0012 * noise.fbm(x * 90, y * 90, z * 90, 2) });

    // Six bone beads along the opening edge, set on the rim's front (probed on the hood).
    const beadXs = [-0.185, -0.115, -0.04, 0.04, 0.115, 0.185];
    const beads = sdf.union(
      ...beadXs.map((x) => {
        const yEdge = 0.62 + 0.175 * Math.sqrt(1 - (x / 0.236) ** 2) + 0.014;
        const p = sdf.raycast(hoodShape, [x, yEdge, 1], [0, 0, -1]);
        const z = p ? p[2] : 0.2;
        return sdf.ellipsoid([0.0105, 0.0125, 0.0105]).at(x, yEdge, z + 0.002);
      }),
    );
    k.body('beads', beads, { color: C.bone, roughness: 0.6, bone: 'head', detail: 0.004 });

    // ------------------------------------------------------------------ hair (dark fringe under the edge)
    const insideHood = cavity.round(-0.003).union(opening.round(-0.012).intersect(dome.round(0.008)));
    const faceMask = sdf.ellipsoid([0.25, 0.16, 0.23]).rotateZ(6).at(0.0, 0.612, 0.14);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, faceMask);
    // Locks hang from the hairline over the forehead; the tips end above the brows.
    const safeZ = (x: number, y: number) => {
      for (let f = 1; f > 0.2; f -= 0.1) {
        const p = sdf.raycast(head, [x * f, y, 1], [0, 0, -1]);
        if (p) return p[2];
      }
      return 0.1;
    };
    const locks = (
      [
        [-0.2, 0.7],
        [-0.135, 0.757],
        [-0.07, 0.752],
        [-0.015, 0.74],
        [0.045, 0.758],
        [0.105, 0.752],
        [0.165, 0.762],
        [0.205, 0.7],
      ] as const
    ).map(([x, tip], i) => {
      const yTop = 0.84;
      const zTop = safeZ(Math.abs(x) * 0.9, yTop - 0.02) + 0.018;
      const zTip = safeZ(Math.abs(x), tip) + 0.014;
      const sway = (i % 2 === 0 ? 1 : -1) * 0.012;
      return sdf.chain(
        [
          [x * 0.93, yTop, zTop, 0.034],
          [x * 1.0 + sway, (yTop + tip) / 2, (zTop + zTip) / 2 + 0.006, 0.026],
          [x * 1.04 - sway, tip, zTip, 0.011],
        ],
        0.02,
      );
    });
    const tufts = pair(sdf.chain([[0.17, 0.76, 0.08, 0.036], [0.186, 0.7, 0.1, 0.03], [0.194, 0.655, 0.108, 0.012]], 0.015));
    const hair = sdf.smoothUnion(0.02, cap, tufts, ...locks).intersect(insideHood);
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ tan hide tunic with fur-cuffed sleeves
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
            [0.161, 0.15],
            [0.158, 0.118],
            [0, 0.112],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    // A jagged hem: a sawtooth cut around the tunic.
    const saw = (x: number, z: number) => {
      const t = (Math.atan2(z, x) * 9) / (2 * Math.PI);
      return 2 * Math.abs(t - Math.floor(t) - 0.5);
    };
    const hemCut = sdf.halfSpace([0, -1, 0], -0.135).displace(0.024, (x, _y, z) => saw(x, z) - 0.5);
    const fold = rgb(C.tunicFold);
    const tunicBody = torso.intersect(hemCut).paintFn((x, y, z, base) => {
      const a = Math.atan2(z, x);
      const f = y < 0.25 ? Math.max(0, Math.sin(a * 5 + y * 8)) * Math.min(1, (0.25 - y) / 0.06) : 0;
      return mixRgb(base, fold, f * 0.55);
    });
    const sleeve = (s: 1 | -1, side: 'L' | 'R') => {
      const sh: V3 = s === 1 ? SHOULDER : mx(SHOULDER);
      const el: V3 = s === 1 ? ELBOW : mx(ELBOW);
      const wr: V3 = s === 1 ? WRIST : mx(WRIST);
      return sdf.smoothUnion(
        0.015,
        sdf.cone(sh, el, 0.052, 0.047).bone(`upperarm.${side}`),
        sdf.cone(el, lerp(el, wr, 0.9), 0.047, 0.043).bone(`forearm.${side}`),
      );
    };
    const tunic = sdf.union(tunicBody.bone('spine'), sleeve(1, 'L'), sleeve(-1, 'R'));
    k.body('tunic', tunic, { color: C.tunic, roughness: 0.9, maxTriangles: 12000, bump: (x, y, z) => 0.0008 * noise.fbm(x * 80, y * 80, z * 80, 2) });

    // The hide skirt panel in front: a flat box with five wedges cut from its hem.
    const panelTop = 0.245;
    const panelH = 0.14;
    const panelY = panelTop - panelH / 2;
    const wedges = sdf.union(
      ...[-0.08, -0.04, 0, 0.04, 0.08].map((x) =>
        sdf
          .extrude(
            profile.polygon([
              [-0.02, panelTop - panelH - 0.01],
              [0.02, panelTop - panelH - 0.01],
              [0, panelTop - panelH + 0.03 + (Math.abs(x) === 0.04 ? 0.01 : 0)],
            ]),
            0.1,
          )
          .at(x, 0, 0),
      ),
    );
    const panel = sdf
      .box([0.2, panelH, 0.02], 0.004)
      .at(0, panelY, 0.128)
      .subtract(wedges.at(0, 0, 0.128))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.14), mixRgb(rgb(C.skirt), rgb('#000000'), 0.12));
    k.body('skirt', panel.bone('spine'), { color: C.skirt, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ fur: collar, cuffs, boot cuffs
    const furNoise = (x: number, y: number, z: number) => noise.fbm(x * 38, y * 38, z * 38, 2);
    const collarY = 0.425;
    const furNoiseCoarse = (x: number, y: number, z: number) => noise.fbm(x * 25, y * 25, z * 25, 2);
    const collarRing = sdf.torus(0.14, 0.045).scale([1, 1, 0.86]).at(0, collarY, -0.004).displace(0.01, furNoiseCoarse);
    const tuftsAt = (
      n: number,
      center: V3,
      R: number,
      zs: number,
      out: number,
      drop: number,
      r0: number,
      phase = 0,
    ) =>
      sdf.union(
        ...Array.from({ length: n }, (_, i) => {
          const a = ((i + phase) / n) * Math.PI * 2;
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          const base: V3 = [center[0] + R * ca, center[1], center[2] + R * zs * sa];
          const o = norm([ca, 0, zs * sa]);
          const tip: V3 = [base[0] + o[0] * out, base[1] - drop, base[2] + o[2] * out];
          return sdf.cone(base, tip, r0, r0 * 0.15);
        }),
      );
    const collar = sdf.smoothUnion(
      0.012,
      collarRing,
      tuftsAt(22, [0, collarY - 0.005, -0.004], 0.148, 0.86, 0.06, 0.035, 0.02),
      tuftsAt(14, [0, collarY + 0.02, -0.004], 0.128, 0.86, 0.025, 0.055, 0.016, 0.5),
    );
    const cuff = (el: V3, wr: V3, side: 'L' | 'R') => {
      const c = lerp(el, wr, 0.95);
      const d = sub(wr, el);
      const ring = ringAt(c, d, 0.047, 0.018).displace(0.004, furNoise);
      const n = norm(d);
      const tufts = sdf.union(
        ...Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          // perpendicular basis to the forearm axis
          const u = norm([n[1] * 0 + 0, n[2], -n[1]]);
          const v: V3 = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
          const dir = norm(add(scl(u, Math.cos(a)), scl(v, Math.sin(a))));
          const base = add(add(c, scl(dir, 0.047)), scl(n, 0.008));
          const tip = add(add(base, scl(dir, 0.016)), scl(n, 0.032));
          return sdf.cone(base, tip, 0.012, 0.002);
        }),
      );
      return sdf.smoothUnion(0.008, ring, tufts).bone(`forearm.${side}`);
    };
    k.body('fur', sdf.union(collar.bone('chest'), cuff(ELBOW, WRIST, 'L'), cuff(mx(ELBOW), mx(WRIST), 'R')), {
      color: C.fur,
      roughness: 1.0,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 110, y * 110, z * 110, 2),
    });

    // ------------------------------------------------------------------ leather chest strap and iron ring
    const baldric = torso
      .round(0.008)
      .smoothIntersect(0.005, sdf.box([0.7, 0.03, 0.7], 0.005).rotateZ(-38).at(0.01, 0.35, 0));
    // Two thin straps hanging down the skirt panel.
    const strap = (x: number) => sdf.box([0.024, 0.11, 0.008], 0.003).at(x, 0.19, 0.142);
    k.body('leather', sdf.union(baldric.bone('spine'), strap(-0.06).bone('spine'), strap(0.06).bone('spine')), {
      color: C.leather,
      roughness: 0.65,
    });
    const ringAtP = sdf.surfacePoint(baldric, [-0.03, 0.375, 0.2], 0.002);
    const ringShape = sdf.torus(0.025, 0.0065).rotateX(90).at(ringAtP[0], ringAtP[1], ringAtP[2] + 0.004);
    const ringPlate = sdf.cylinder(0.014, 0.006, 0.002).rotateX(90).at(ringAtP[0], ringAtP[1] + 0.0, ringAtP[2] + 0.001);
    k.body('iron', sdf.union(ringShape, ringPlate).bone('spine'), { color: C.iron, roughness: 0.4, metalness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ rope wrap and hip coil
    const band = (y: number, r: number) => sdf.torus(0.142, r).scale([1, 1, 0.78]).at(0, y, 0);
    const twist = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 70 + y * 40);
    const ropeBands = sdf.union(band(0.232, 0.018), band(0.268, 0.018));
    const coilAxis = norm([-1, 0, -0.1]);
    const coilC: V3 = [-0.142, 0.292, -0.045];
    const coil = sdf.union(
      ringAt(add(coilC, scl(coilAxis, -0.006)), coilAxis, 0.05, 0.0135),
      ringAt(add(coilC, scl(coilAxis, 0.012)), coilAxis, 0.045, 0.0135),
      ringAt(add(coilC, scl(coilAxis, 0.028)), coilAxis, 0.038, 0.012),
    );
    const knot = sdf.sphere(0.024).at(-0.095, 0.25, 0.08);
    const ropeTail = sdf.chain(
      [
        [-0.095, 0.245, 0.082, 0.011],
        [-0.112, 0.2, 0.094, 0.009],
        [-0.118, 0.158, 0.094, 0.008],
      ],
      0.01,
    );
    const rope = sdf
      .smoothUnion(0.01, ropeBands, coil, knot, ropeTail)
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.ropeDark), Math.max(0, twist(x, y, z)) * 0.55));
    k.body('rope', rope.bone('spine'), { color: C.rope, roughness: 0.95, detail: 0.007, maxTriangles: 6000, bump: (x, y, z) => 0.0012 * twist(x, y, z) });

    // ------------------------------------------------------------------ legs and boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.12, 0.004], 0.046).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.9 });

    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.048, 0.064, 0.02).at(0, 0.052, 0),
        sdf.ellipsoid([0.056, 0.05, 0.1]).at(0, 0.048, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootShaft = sdf.cone([0, 0.055, 0], [0, 0.125, 0], 0.05, 0.053).round(0.003);
    const bootCuff = sdf
      .cone([0, 0.113, 0], [0, 0.148, 0], 0.056, 0.064)
      .round(0.005)
      .subtract(sdf.cylinder(0.048, 0.1).at(0, 0.19, 0))
      .displace(0.003, furNoise)
      .paint(C.fur);
    const turnOut = (s: sdf.Shape) => s.rotateY(12).at(ANKLE[0], 0, 0);
    const boot = sdf.union(
      turnOut(sdf.union(bootFoot, sole.paint(C.sole))).bone('foot.L'),
      turnOut(sdf.union(bootShaft, bootCuff)).bone('shin.L'),
    );
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.65 });

    // ------------------------------------------------------------------ the spear (rigid on hand.R)
    // Local frame: the butt at the origin, the shaft up +Y.
    const headLen = 0.15;
    const shaftTop = SPEAR_LEN - headLen;
    const leaf = sdf.extrude(
      profile.polygon(
        [
          [0, 0.0],
          [0.018, 0.014],
          [0.034, 0.058],
          [0.024, 0.11],
          [0, headLen],
          [-0.024, 0.11],
          [-0.034, 0.058],
          [-0.018, 0.014],
        ],
        { smooth: true, samples: 4 },
      ),
      0.013,
      0.004,
    );
    const spearHead = sdf
      .union(
        leaf.at(0, shaftTop, 0),
        sdf.capsule([0, shaftTop, 0], [0, shaftTop + 0.13, 0], 0.008),
        sdf.cone([0, shaftTop - 0.035, 0], [0, shaftTop + 0.012, 0], 0.0185, 0.014).round(0.002),
      )
      .paintWhere(sdf.halfSpace([0, -1, 0], -(shaftTop + 0.005)), C.iron);
    const wrapBands = sdf.union(
      ...Array.from({ length: 3 }, (_, i) => sdf.torus(0.0175, 0.005).at(0, GRIP_T - 0.05 + i * 0.05, 0)),
    );
    const twine = sdf.union(
      ...Array.from({ length: 3 }, (_, i) => sdf.torus(0.0165, 0.0035).at(0, shaftTop - 0.05 - i * 0.014, 0)),
    );
    const shaftShape = sdf.union(
      sdf.capsule([0, 0, 0], [0, shaftTop, 0], 0.016),
      sdf.cylinder(0.0195, 0.16, 0.005).at(0, GRIP_T, 0).paint(C.leatherDark),
      wrapBands.paint(C.stripe),
      twine.paint(C.rope),
      sdf.cylinder(0.019, 0.02, 0.006).at(0, 0.012, 0).paint(C.leather),
    );
    const spearPose = (s: sdf.Shape) =>
      s.rotateZ(-Math.asin(SPEAR_D[0]) / DEG).rotateX(Math.atan2(SPEAR_D[2], SPEAR_D[1]) / DEG).at(BUTT[0], BUTT[1] + 0.012, BUTT[2]);
    k.body('spear', spearPose(shaftShape), { color: C.shaft, roughness: 0.75, bone: 'hand.R', detail: 0.004 });
    k.body('spear-head', spearPose(spearHead), { color: C.head, roughness: 0.5, metalness: 0.6, bone: 'hand.R', detail: 0.004 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, quat, euler } = motion;
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
    const POLE_R_REST: V3 = [-0.4, 0.517, -0.009];
    const POLE_L_REST: V3 = [0.4, 0.517, -0.009];
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const chainQ = (rots: readonly V3[]) => {
      const q = new THREE.Quaternion();
      for (const r of rots) q.multiply(quat(r));
      return q;
    };
    /** The right arm holding the spear: the wrist at `wrist` (chest frame), the shaft along `dir`. */
    const spearArm = (wrist: V3, pole: V3, dir: V3, sh: V3 = Z3) => {
      const d = norm(dir);
      const arm = reach(ARM_R, sub(wrist, sh), pole);
      const up = turnBy(arc(SPEAR_D, d), [0, 0, 1]);
      const hand = orient([arm.upper, arm.lower], { dir: SPEAR_D, up: [0, 0, 1] }, { dir: d, up });
      return { arm, hand };
    };
    const armPose = (a: { arm: { upper: V3; lower: V3 }; hand: V3 }, sh: V3 = Z3) => ({
      'upperarm.R': { move: sh, rotate: a.arm.upper },
      'forearm.R': { rotate: a.arm.lower },
      'hand.R': { rotate: a.hand },
    });
    const SHIN = 0.125;
    const HEEL = 0.055;
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        hoodtip: { rotate: [3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.35)] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [0.6 * wave(p, 1, 0.1), 0, 0] },
        'forearm.R': { rotate: [-1.5 * bump(p), 0, 0] },
      }),
    });

    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      armSwing: number,
      lean: number,
      hop: number,
      flop: number,
      carry: number,
    ) => ({
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
          hoodtip: { rotate: [flop * wave(p, 2, 0.2), 0, flop * 0.8 * wave(p, 2, 0.1)] as const },
          // The free left arm swings; the right arm carries the spear, tilted forward, with a small swing.
          'upperarm.L': { rotate: [armSwing * s, 0, 3] as const },
          'forearm.L': { rotate: [-armSwing * 0.25 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.22 * s - carry * 0.35, 0, -4] as const },
          'forearm.R': { rotate: [-carry * 0.25, 0, 0] as const },
          'hand.R': { rotate: [carry, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 20, 3, 0.006, 3, 26));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 30, 12, 0.03, 5, 44));

    // ------------------------------------------------------------------ attack: a forward thrust
    // The rider turns the right shoulder back and pulls the fist to the hip with the spear head
    // up and forward, then lunges: the fist drives forward, the chest turns in, the left foot
    // steps ahead. A short hold, then the spear comes back upright.
    const D_WIND = norm([-0.06, 0.55, 0.85]);
    const D_THRUST = norm([0.0, 0.22, 1]);
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wr = keys(p, [[0, mx(WRIST)], [0.3, [-0.2, 0.3, -0.05]], [0.4, [-0.2, 0.3, -0.05]], [0.5, [-0.165, 0.335, 0.155]], [0.64, [-0.165, 0.335, 0.155]], [0.9, mx(WRIST)]] as const);
        const dir = keys(p, [[0, SPEAR_D], [0.3, D_WIND], [0.4, D_WIND], [0.5, D_THRUST], [0.64, D_THRUST], [0.9, SPEAR_D]] as const);
        const sh = keys(p, [[0, Z3], [0.3, [0, 0, -0.02]], [0.4, [0, 0, -0.02]], [0.5, [0.01, 0.01, 0.055]], [0.64, [0.01, 0.01, 0.055]], [0.9, Z3]] as const);
        const act = ease(0, 0.28, p) * (1 - ease(0.66, 0.9, p));
        const pole = lerp(POLE_R_REST, [-0.35, 0.28, -0.3], act);
        const arm = spearArm(wr, pole, dir, sh);
        const tw = keys(p, [[0, 0], [0.3, -1], [0.4, -1], [0.5, 1], [0.66, 1], [0.9, 0]] as const);
        const lunge = keys(p, [[0, 0], [0.3, 0.4], [0.5, 1], [0.68, 1], [0.9, 0]] as const);
        const strike = keys(p, [[0.36, 0], [0.5, 1], [0.66, 0.6], [0.9, 0]] as const);
        const drop = legDrop(SHIN, 16) * lunge;
        return {
          hips: { move: [0, -drop, 0.03 * lunge], rotate: [0, 8 * tw, 0] },
          spine: { rotate: [7 * strike, 9 * tw, 0] },
          chest: { rotate: [3 * strike, 12 * tw, 0] },
          neck: { rotate: [0, -8 * tw, 0] },
          head: { rotate: [-4 * strike, -14 * tw, 0] },
          hoodtip: { rotate: [-6 * strike, 0, 5 * tw] },
          ...armPose(arm, sh),
          'upperarm.L': { rotate: [16 * lunge - 10 * strike, 0, 10 * lunge] },
          'forearm.L': { rotate: [-12 * lunge, 0, 0] },
          'leg.L': { rotate: [-16 * lunge, 0, 3 * lunge] },
          'foot.L': { rotate: [16 * lunge, 0, -3 * lunge] },
          'leg.R': { rotate: [14 * lunge, 0, -3 * lunge] },
          'foot.R': { rotate: [-14 * lunge, 0, 3 * lunge] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
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
          hoodtip: { rotate: [-10 * flop, 0, 8 * flop] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          'upperarm.L': { rotate: [-10 * h, 0, 12 * h] },
          'forearm.L': { rotate: [-12 * h, 0, 0] },
          'upperarm.R': { rotate: [-4 * h, 0, -3 * h] },
          'forearm.R': { rotate: [-4 * h, 0, 0] },
          'hand.R': { rotate: [8 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    const LIE = 80;
    const LIE_Y = 0.13;
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
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.48, 0], [0.7, 1]] as const);
        const tipUp = keys(p, [[0.36, 0], [0.54, 1], [0.62, 1], [0.7, 0]] as const);
        const tipDown = keys(p, [[0.62, 0], [0.72, 1.15], [0.8, 0.92], [0.88, 1]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * Math.min(1, Math.max(0, (tilt - LIE + 14) / 14));
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const standR = add(add(add(mx(WRIST), scl([-0.05, 0.02, -0.05], hitB)), scl([0, 0.0, -0.03], sag)), scl([-0.07, 0.03, 0.04], fly));
        const armR = reach(ARM_R, lerp(standR, [-0.23, 0.33, -0.13], land), lerp(mx(ELBOW), [-0.3, 0.3, -0.1], land));
        const standL = add(add(add(WRIST, scl([0.05, 0.02, -0.05], hitB)), scl([0, -0.06, -0.03], sag)), scl([0.07, 0, 0.04], fly));
        const armL = reach(ARM_L, lerp(standL, [0.23, 0.33, -0.13], land), lerp(ELBOW, [0.3, 0.3, -0.1], land));
        // The spear lies on the floor beside the right hand, its head toward the head of the body.
        const bodyQ = chainQ([hipsR, spineR, chestR]);
        const lie = turnBy(bodyQ.clone().invert(), norm([-0.12, 0, -1]));
        const flat = keys(p, [[0.42, 0], [0.62, 1]] as const);
        const wantDir = norm(lerp(SPEAR_D, lie, flat));
        const handR = orient([armR.upper, armR.lower], { dir: SPEAR_D, up: [0, 0, 1] }, { dir: wantDir, up: turnBy(arc(SPEAR_D, wantDir), [0, 0, 1]) });
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB, -6 * wob + 6 * land] },
          hoodtip: { rotate: [-12 * tipUp + 6 * tipDown, 0, -6 * wob + 10 * tipUp - 4 * tipDown] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: [handR[0] + 28 * (1 - flat) * Math.max(hitB, sag), handR[1], handR[2]] as V3 },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: an overhead strike
    // The spear goes back over the right shoulder, head up and behind the ear (clear of the hood),
    // stands up, and swings over and down to the front. The rider lunges into the blow.
    const D_BACK = norm([-0.32, 0.75, -0.55]);
    const D_MID = norm([-0.42, 1, 0.12]);
    const D_STRIKE = norm([-0.03, 0.2, 1]);
    const D_LOW = norm([0.0, 0.1, 1]);
    const W_BACK: V3 = [-0.25, 0.46, -0.03];
    const W_UP: V3 = [-0.265, 0.5, 0.02];
    const W_STRIKE: V3 = [-0.17, 0.4, 0.15];
    const W_LOW: V3 = [-0.17, 0.36, 0.15];
    k.animation('attack2', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const wr = keys(p, [[0, mx(WRIST)], [0.22, W_BACK], [0.34, W_BACK], [0.42, W_UP], [0.5, W_STRIKE], [0.64, W_LOW], [0.72, W_LOW], [1, mx(WRIST)]] as const, 'spline');
        const dir = keys(p, [[0, SPEAR_D], [0.22, D_BACK], [0.34, D_BACK], [0.42, D_MID], [0.5, D_STRIKE], [0.64, D_LOW], [0.72, D_LOW], [1, SPEAR_D]] as const, 'spline');
        const sh = keys(p, [[0, Z3], [0.22, [0, 0.012, -0.02]], [0.34, [0, 0.012, -0.02]], [0.5, [0.01, 0, 0.05]], [0.72, [0.01, 0, 0.05]], [1, Z3]] as const);
        const act = ease(0, 0.2, p) * (1 - ease(0.74, 1, p));
        const pole = lerp(POLE_R_REST, [-0.4, 0.2, -0.25], act);
        const arm = spearArm(wr, pole, dir, sh);
        const tw = keys(p, [[0, 0], [0.34, -1], [0.5, 1], [0.74, 1], [1, 0]] as const);
        const lunge = keys(p, [[0, 0], [0.34, 0.5], [0.52, 1], [0.76, 1], [1, 0]] as const);
        const strike = keys(p, [[0.34, 0], [0.5, 1], [0.72, 0.7], [1, 0]] as const);
        const arch = keys(p, [[0.1, 0], [0.34, 1], [0.44, 0.4], [0.5, 0]] as const);
        const drop = legDrop(SHIN, 18) * lunge;
        return {
          hips: { move: [0, -drop, 0.035 * lunge], rotate: [0, 7 * tw, 0] },
          spine: { rotate: [-5 * arch + 8 * strike, 8 * tw, 0] },
          chest: { rotate: [-4 * arch + 4 * strike, 10 * tw, 0] },
          neck: { rotate: [3 * arch, -6 * tw, 0] },
          head: { rotate: [-3 * arch - 3 * strike, -12 * tw, 0] },
          hoodtip: { rotate: [-8 * strike, 0, 6 * tw] },
          ...armPose(arm, sh),
          'upperarm.L': { rotate: [-30 * arch - 12 * strike, 0, 20 * arch + 8 * strike] },
          'forearm.L': { rotate: [-20 * arch, 0, 0] },
          'leg.L': { rotate: [-18 * lunge, 0, 4 * lunge] },
          'foot.L': { rotate: [18 * lunge, 0, -4 * lunge] },
          'leg.R': { rotate: [16 * lunge, 0, -4 * lunge] },
          'foot.R': { rotate: [-16 * lunge, 0, 4 * lunge] },
        };
      },
    });

    // ------------------------------------------------------------------ victory: the spear held high
    const V_WRIST: V3 = [-0.25, 0.5, 0.05];
    const V_DIR = norm([-0.42, 1, 0.1]);
    const FIST_UP: V3 = [0.235, 0.5, 0.08];
    const FIST_DOWN: V3 = [0.22, 0.44, 0.09];
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.26, 1]] as const);
        const hop = keys(p, [[0.06, 0], [0.17, 1], [0.28, 0]] as const);
        const pumpBeat = keys(p, [[0.2, 0], [0.3, 1], [0.4, 0], [0.5, 1], [0.62, 0]] as const);
        const look = keys(p, [[0.08, 0], [0.24, 1], [0.5, 1], [0.75, 0]] as const);
        const proud = keys(p, [[0.55, 0], [0.8, 1]] as const);
        const flop = keys(p, [[0.1, 0], [0.2, -1], [0.32, 0.8], [0.42, -0.4], [0.52, 0.5], [0.66, -0.2], [0.8, 0]] as const);
        const wrist = lerp(mx(WRIST), add(V_WRIST, [0, 0.012 * pumpBeat, 0]), raise);
        const dir = norm(lerp(SPEAR_D, V_DIR, raise));
        const pole = lerp(POLE_R_REST, [-0.42, 0.3, -0.1], raise);
        const arm = spearArm(wrist, pole, dir);
        const fistL = keys(p, [[0, WRIST], [0.2, FIST_UP], [0.3, FIST_DOWN], [0.4, FIST_UP], [0.5, FIST_DOWN], [0.62, add(FIST_UP, [-0.01, -0.03, 0])], [0.8, [0.2, 0.3, 0.03]], [1, [0.2, 0.3, 0.03]]] as const);
        const armL = reach(ARM_L, fistL, lerp(POLE_L_REST, [0.42, 0.3, -0.1], ease(0, 0.18, p)));
        return {
          hips: { move: [0, 0.03 * hop, 0] },
          spine: { rotate: [-3 * proud + 2 * pumpBeat, 0, -3 * raise] },
          chest: { rotate: [-6 * proud + 3 * pumpBeat - 3 * hop, 0, -2 * raise] },
          neck: { rotate: [-4 * proud, 0, 0] },
          head: { rotate: [-8 * look - 6 * proud, 12 * look, -4 * raise] },
          hoodtip: { rotate: [10 * flop, 0, 6 * flop] },
          ...armPose(arm),
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [-6 * hop, 0, 5 * proud] },
          'leg.R': { rotate: [4 * hop, 0, -5 * proud] },
          'foot.L': { rotate: [12 * hop, 0, -5 * proud] },
          'foot.R': { rotate: [12 * hop, 0, 5 * proud] },
        };
      },
    });
    void euler;
    void len;
    void rotYv;
  },
});
