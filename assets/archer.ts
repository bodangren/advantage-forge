import { defineAsset, motion, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Archer — Chibi Quest hero (catalog `heroes/martial/archer`), 1.0 m tall, faces +Z.
 * Target: docs/hero-mockups/archer_001.jpg (one front view; side and back are designed here).
 * Built on the rogue's body, face, and skeleton, so the heroes read as one set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the face, hood, and bow must read.
 * One idea: a leaf-green felt hood with a long floppy point and pointed elf ears poking out
 *   frames a big-eyed, cheerful face; a big recurve bow breaks the outline on the left.
 * Proportions (from the mockup): hood crown 1.0, hood point tip 0.64 at x -0.34, ear tips
 *   0.71 at x +-0.33, eyes 0.63, chin 0.48, shoulders 0.38, belt 0.25, tunic hem 0.15,
 *   boot cuffs 0.085. The hood and head are about half of the height.
 * Shape language: round and soft (hood dome, cheeks, fists, boots), with points for the
 *   forest (hood point, ear tips, arrow fletching, bow tips, hem notch).
 * Palette (60/30/10): leaf green cloth #5e8c32 / tunic #4f7a2b; brown leather #7c4327;
 *   gold #dca83a accent. Skin #f2c7a4, hair #4a2a18, cream leggings #cdb994.
 * Value plan: the dark inside of the hood frames the light face (focal point); the dark bow
 *   and quiver are the second contrast; gold buckle and fletching are the small accents.
 * Bodies: skin, hair, hood, cowl, tunic, sleeves, cuffs, leather, gold, quiver, arrows,
 *   pants (with the sock roll), boots, bow, bowstring (two halves), nocked-arrow.
 * Rig: the rogue's chibi skeleton plus `hoodtip` for the floppy point; the bow is rigid on
 *   `bowgrip`, a child of the left hand that only the death clip moves (the bow drops), and the
 *   quiver is on the chest. The string is in two halves on `string.top` and `string.bot`
 *   (children of `bowgrip`), so the draw pulls its middle back. The shot arrow is on `arrow` (in
 *   the right hand); its mesh rests in the quiver, and it shows only in the shot.
 *   Clips: idle, walk, run, attack (nock, draw, loose), attack2 (a power shot), hit, death,
 *   victory (the bow held high).
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
  hair: '#4a2a18',
  hood: '#5e8c32',
  hoodInside: '#26401a',
  tunic: '#4f7a2b',
  tunicDark: '#3f6523',
  stitch: '#d9c79a',
  cuff: '#e3d8bd',
  leather: '#7c4327',
  leatherDark: '#4e2b1b',
  gold: '#dca83a',
  quiver: '#8a4a2a',
  shaft: '#b98c55',
  fletch: '#d9ae48',
  pants: '#cdb994',
  sock: '#e6dcc4',
  boot: '#7a4326',
  sole: '#4a2c1c',
  bow: '#6a3a20',
  grip: '#3b2a22',
  string: '#e6d8b0',
  arrowhead: '#8a8e94',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. The right arm hangs like the rogue's; the left (bow) arm is held out from the body,
// so the bow clears the cowl, the boot, and the ground.
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
// The quiver's pose on the back (see quiverPose); the shot arrow rests in it: its nock and its
// direction (nock to head).
const quiverDir = (d: V3) => rotZv(rotXv(d, -10), 50);
const quiverPoint = (p: V3) => add(quiverDir(p), [0.02, 0.27, -0.16]);
const ARROW_NOCK = quiverPoint([0, 0.43, 0]);
const ARROW_DIR = quiverDir([0, -1, 0]);
// The right fist's curled fingers, where they hook the string.
const PINCH: V3 = [-WRIST[0] + 0.008, WRIST[1] - 0.053, WRIST[2] + 0.045];

export default defineAsset({
  name: 'archer',
  description: 'Chibi archer hero with a floppy leaf-green hood, elf ears, a quiver, and a recurve bow.',
  detail: 0.005,
  reference: 'docs/hero-mockups/archer_001.jpg',
  // Color slots for individual archers (the first option is the default look). The skin options
  // are the rogue's, so the heroes match.
  variants: {
    eyes: { brown: C.iris, green: '#3d7a35', blue: '#2f6aa8' },
    hair: { brown: C.hair, blonde: '#b88d4a', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { leaf: C.hood, pine: '#2f5a40', earth: '#7d6a45' },
  },
  presets: {
    sylvan: { eyes: 'green', hair: 'blonde', skin: 'fair', clothing: 'pine' },
    hunter: { eyes: 'brown', hair: 'auburn', skin: 'tan', clothing: 'earth' },
    warden: { eyes: 'blue', hair: 'brown', skin: 'brown', clothing: 'pine' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      earInner: k.tint('skin', { color: C.earInner, follow: 1 }),
      freckle: k.tint('skin', { color: C.freckle, follow: 1 }),
      cloth: k.tint('clothing'),
      clothInside: k.tint('clothing', { color: C.hoodInside, follow: 1 }),
      tunic: k.tint('clothing', { color: C.tunic, follow: 1 }),
      tunicDark: k.tint('clothing', { color: C.tunicDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      hoodtip: { parent: 'head', at: [-0.15, 0.88, -0.09], tail: [-0.34, 0.64, -0.1] },
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
      // The bowstring in two halves from the nocks, so the draw pulls its middle back.
      'string.top': { parent: 'bowgrip', at: NOCK_TOP },
      'string.bot': { parent: 'bowgrip', at: NOCK_BOT },
      // The shot arrow, in the right hand's fingers; its mesh rests in the quiver.
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
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');

    // Elf ears: a flat leaf with a hollow, from the side of the head out and up through the hood.
    const earLocal = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.044, 0.042, 0.017]).at(0.03, 0, 0),
        sdf.cone([0.035, 0.004, 0], [0.19, 0.036, 0], 0.034, 0.007).scale([1, 1, 0.55]),
      )
      .smoothSubtract(
        0.006,
        sdf.cone([0.03, 0, 0.012], [0.16, 0.03, 0.008], 0.025, 0.004).scale([1, 1, 0.6]),
      );
    const earPose = (s: sdf.Shape) => s.rotateZ(28).rotateY(10).at(0.17, 0.622, -0.012);
    const ear = earPose(earLocal);
    const earHollow = earPose(sdf.cone([0.035, 0, 0.02], [0.16, 0.03, 0.014], 0.027, 0.006));
    const ears = pair(ear.bone('head'));
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    // Arms: short upper arm (hidden by the sleeve), forearm inside the bracer, a fist.
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

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    // Both highlights sit up and to the +X side: one light for the whole face.
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Thick, friendly brows: raised and a little arched.
    const brows = pair(sdf.extrude(profile.arc(0.12, 0.024, 62, 112), 0.3).at(0.102, 0.727 - 0.12, 0.1));
    const smile = sdf.extrude(profile.arc(0.08, 0.013, 236, 304), 0.3).at(0, 0.527 + 0.08, 0.1);
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
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hood with the floppy point
    const dome = sdf.ellipsoid([0.262, 0.27, 0.255]).at(0, 0.69, -0.022);
    // The point leaves the crown on the right (-X) and flops down beside the head, behind the ear.
    const point = sdf
      .chain(
        [
          [-0.06, 0.9, 0, 0.12],
          [-0.17, 0.925, 0, 0.085],
          [-0.265, 0.87, 0, 0.056],
          [-0.325, 0.78, 0, 0.035],
          [-0.345, 0.69, 0, 0.019],
          [-0.336, 0.635, 0, 0.008],
        ],
        0.03,
      )
      .scale([1, 1, 0.62])
      .at(0, 0, -0.095);
    const hoodOuter = sdf.smoothUnion(0.06, dome.bone('head'), point.bone('hoodtip'));
    const cavity = sdf.ellipsoid([0.236, 0.238, 0.228]).at(0, 0.682, -0.015);
    const opening = sdf.ellipsoid([0.236, 0.228, 0.42]).at(0, 0.675, 0.3);
    // A thick rolled rim around the face opening.
    const rim = dome
      .round(0.016)
      .subtract(cavity.round(-0.004))
      .intersect(opening.round(0.038))
      .subtract(opening);
    // A raised seam over the crown, from the brow to the nape.
    const seam = dome
      .round(0.006)
      .subtract(dome.round(-0.01))
      .intersect(sdf.box([0.014, 0.4, 0.8], 0.005).at(0, 0.82, -0.05))
      .intersect(sdf.halfSpace([0, 0, 1], 0.1))
      .subtract(opening.round(0.02));
    const hood = sdf
      .smoothUnion(0.012, hoodOuter.subtract(cavity).smoothSubtract(0.02, opening), rim.bone('head'), seam.bone('head'))
      .subtract(pair(ear.round(0.0015))) // tight slits where the ears come through
      .intersect(sdf.halfSpace([0, -1, 0], -0.44))
      .paintWhere(cavity.round(0.006), T.clothInside, 0.012);
    k.body('hood', hood, { color: T.cloth, roughness: 0.9 });

    // ------------------------------------------------------------------ hair (inside the hood)
    // The hair fills the cavity and comes forward into the face opening, but not past the rim.
    const insideHood = cavity.round(-0.003).union(opening.round(-0.012).intersect(dome.round(0.008)));
    // Tilted so the hairline rises on +X (the part) and the big lock covers the other side.
    const faceMask = sdf.ellipsoid([0.25, 0.16, 0.23]).rotateZ(12).at(0.02, 0.622, 0.14);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, faceMask);
    // One big lock swept from the part across the forehead, and a curl falling the other way.
    const swoop = sdf.chain(
      [
        [0.11, 0.87, 0.1, 0.052],
        [0.03, 0.872, 0.165, 0.058],
        [-0.055, 0.84, 0.19, 0.052],
        [-0.11, 0.782, 0.2, 0.04],
        [-0.13, 0.728, 0.205, 0.028],
        [-0.126, 0.682, 0.198, 0.014],
      ],
      0.025,
    );
    const curl = sdf.chain(
      [
        [0.05, 0.862, 0.165, 0.044],
        [0.112, 0.818, 0.176, 0.038],
        [0.152, 0.768, 0.162, 0.025],
        [0.162, 0.732, 0.148, 0.011],
      ],
      0.02,
    );
    const tufts = pair(sdf.cone([0.178, 0.73, 0.09], [0.192, 0.645, 0.108], 0.03, 0.01));
    const grooves = sdf.union(
      sdf.capsule([0.1, 0.9, 0.2], [-0.09, 0.81, 0.265], 0.008),
      sdf.capsule([0.06, 0.93, 0.15], [-0.13, 0.86, 0.235], 0.008),
    );
    const hair = sdf
      .smoothUnion(0.02, cap, swoop, curl, tufts)
      .smoothSubtract(0.006, grooves)
      .intersect(insideHood);
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ tunic and sleeves
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
    // A notch at the front of the hem, a running stitch above it, and a darker hem band.
    const notch = sdf
      .extrude(
        profile.polygon([
          [-0.026, 0.135],
          [0.026, 0.135],
          [0, 0.222],
        ]),
        0.3,
      )
      .at(0, 0, 0.15);
    const stitch = rgb(C.stitch);
    const hemStitch = (x: number, y: number, z: number) =>
      Math.abs(y - 0.178) < 0.0035 && Math.sin(Math.atan2(z, x) * 50) > 0.15;
    const tunic = torso
      .smoothSubtract(0.008, notch)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.169), T.tunicDark)
      .paintFn((x, y, z, base) => (hemStitch(x, y, z) ? stitch : base));
    k.body('tunic', tunic.bone('spine'), { color: T.tunic, roughness: 0.85 });

    // Short green sleeves to above the elbow, with the cream shirt cuff rolled below them.
    const sleeveL = sdf.cone([0.11, 0.405, 0], lerp(SHOULDER, ELBOW_L, 0.8), 0.047, 0.044).bone('upperarm.L');
    const sleeveR = sdf.cone([-0.11, 0.405, 0], lerp(mx(SHOULDER), mx(ELBOW), 0.8), 0.047, 0.044).bone('upperarm.R');
    k.body('sleeves', sdf.union(sleeveL, sleeveR), { color: T.tunic, roughness: 0.85 });
    const cuffL = sdf.cone(lerp(SHOULDER, ELBOW_L, 0.72), lerp(SHOULDER, ELBOW_L, 1.08), 0.047, 0.046).round(0.004);
    const cuffR = sdf.cone(lerp(mx(SHOULDER), mx(ELBOW), 0.72), lerp(mx(SHOULDER), mx(ELBOW), 1.08), 0.047, 0.046).round(0.004);
    k.body('cuffs', sdf.union(cuffL.bone('upperarm.L'), cuffR.bone('upperarm.R')), { color: C.cuff, roughness: 0.9 });

    // ------------------------------------------------------------------ cowl (the hood's shoulder cape)
    const cowlSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.49],
            [0.12, 0.468],
            [0.158, 0.435],
            [0.178, 0.398],
            [0.182, 0.372],
            [0.165, 0.37],
            [0.16, 0.395],
            [0.14, 0.425],
            [0.105, 0.448],
            [0.064, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.84])
      // Soft folds toward the edge.
      .displace(0.005, (x, y, z) => Math.sin(Math.atan2(z, x) * 7) * Math.min(1, Math.max(0, (0.45 - y) / 0.07)));
    // The two hood sides meet in a V under the chin.
    const vee = sdf
      .extrude(
        profile.polygon([
          [-0.04, 0.36],
          [0.04, 0.36],
          [0, 0.45],
        ]),
        0.4,
      )
      .at(0, 0, 0.22);
    const cowl = cowlSolid.smoothSubtract(0.01, vee);
    k.body('cowl', cowl, { color: T.cloth, roughness: 0.9, bone: 'chest' });

    // ------------------------------------------------------------------ leather: belt, baldric, bracers, pouch
    const beltY = 0.252;
    const belt = torso.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0));
    // The quiver strap runs from the right shoulder, under the cowl, down to the left hip.
    const baldric = torso
      .round(0.008)
      .smoothIntersect(0.005, sdf.box([0.7, 0.034, 0.7], 0.005).rotateZ(-38).at(0.01, 0.35, 0));
    const bracer = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.32), lerp(e, w, 1.04), 0.04, 0.047).round(0.003);
    const bracers = sdf.union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(mx(ELBOW), mx(WRIST)).bone('forearm.R'));
    // A pouch on the right hip, hung from the belt, with a darker flap.
    const pouchAt = sdf.surfacePoint(belt, [-0.11, 0.24, 0.12], 0);
    const pouchBody = sdf.box([0.056, 0.066, 0.036], 0.012).rotateY(-38);
    const pouchFlap = sdf.box([0.062, 0.03, 0.042], 0.01).rotateY(-38).at(0, 0.024, 0.002);
    const pouch = sdf
      .union(pouchBody, pouchFlap.paint(C.leatherDark))
      .at(pouchAt[0] - 0.012, pouchAt[1] - 0.034, pouchAt[2] + 0.004);
    k.body('leather', sdf.union(belt.bone('spine'), baldric.bone('spine'), bracers, pouch.bone('spine')), {
      color: C.leather,
      roughness: 0.6,
    });

    // ------------------------------------------------------------------ gold: buckle, strap buckle, flap stud, boot studs
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.056, 0.046, 0.012], 0.005).subtract(sdf.box([0.034, 0.026, 0.03], 0.003)),
        sdf.box([0.008, 0.03, 0.01], 0.003).at(0.004, 0, 0.004), // the prong
      )
      .at(0, beltY, beltZ + 0.004);
    const strapBuckleAt = sdf.surfacePoint(baldric, [-0.052, 0.39, 0.2], 0.002);
    const strapBuckle = sdf
      .box([0.03, 0.036, 0.008], 0.004)
      .subtract(sdf.box([0.016, 0.02, 0.03], 0.002))
      .rotateZ(-38)
      .at(...strapBuckleAt);
    const flapStud = sdf.sphere(0.009).at(pouchAt[0] - 0.012, pouchAt[1] - 0.018, pouchAt[2] + 0.03);
    const bootStuds = pair(sdf.sphere(0.009).at(0.06, 0.07, 0.012).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L'));
    k.body('gold', sdf.union(buckle.bone('spine'), strapBuckle.bone('spine'), flapStud.bone('spine'), bootStuds), {
      color: C.gold,
      roughness: 0.32,
      metalness: 0.9,
    });

    // ------------------------------------------------------------------ quiver and arrows (on the back)
    // Local frame: bottom of the quiver at the origin, the mouth up +Y.
    const QUIVER_LEN = 0.24;
    const quiverPose = (s: sdf.Shape) => s.rotateX(-10).rotateZ(50).at(0.02, 0.27, -0.16);
    const tube = sdf.cone([0, 0, 0], [0, QUIVER_LEN, 0], 0.036, 0.046).round(0.004);
    const quiverShape = sdf
      .union(
        tube.subtract(sdf.cylinder(0.04, 0.1).at(0, QUIVER_LEN + 0.04, 0)),
        sdf.torus(0.046, 0.009).at(0, QUIVER_LEN - 0.006, 0).paint(C.leatherDark), // rolled mouth
        sdf.cylinder(0.044, 0.026, 0.008).at(0, 0.12, 0).paint(C.leatherDark), // strap band
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.025), C.leatherDark);
    k.body('quiver', quiverPose(quiverShape).bone('chest'), { color: C.quiver, roughness: 0.6 });

    // Five arrows fanned in the mouth; only the shafts and the gold fletching show.
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

    // ------------------------------------------------------------------ legs, socks, boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.12, 0.004], 0.046).bone('leg.L')),
    );
    // A pale sock roll shows between the leggings and the boot cuff.
    const sockRoll = pair(sdf.cylinder(0.052, 0.02, 0.009).at(0.095, 0.096, 0.004).bone('leg.L'));
    k.body('pants', pants.smoothUnion(0.006, sockRoll.paint(C.sock)), { color: C.pants, roughness: 0.85 });

    // Ankle boot built at the ankle's ground point, then turned out a little, with a folded cuff.
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.048, 0.064, 0.02).at(0, 0.052, 0),
        sdf.ellipsoid([0.056, 0.05, 0.1]).at(0, 0.048, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cone([0, 0.06, 0], [0, 0.08, 0], 0.052, 0.058).round(0.005);
    const boot = sdf
      .union(bootFoot, sole.paint(C.sole), bootCuff)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ recurve bow in the left hand
    // Local frame: grip at the origin, limbs along Y, the back of the bow toward +Z, the string
    // behind it at -Z. Each limb bends back toward the string, then the tip curls forward.
    const limb = (len: number, sign: 1 | -1) =>
      sdf.chain(
        [
          [0, 0, 0, 0.017],
          [0, 0.22 * len * sign, -0.007, 0.0135],
          [0, 0.48 * len * sign, -0.03, 0.0115],
          [0, 0.72 * len * sign, -0.056, 0.0098],
          [0, 0.88 * len * sign, -0.066, 0.0086],
          [0, 0.97 * len * sign, -0.052, 0.0078],
          [0, 1.02 * len * sign, -0.026, 0.0072],
          [0, 1.03 * len * sign, 0.0, 0.0068],
          [0, 1.015 * len * sign, 0.02, 0.0064],
        ],
        0.01,
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
        hoodtip: { rotate: [3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.35)] },
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
          // The hood point bounces twice per cycle, a little after the steps.
          hoodtip: { rotate: [flop * wave(p, 2, 0.2), 0, flop * 0.8 * wave(p, 2, 0.1)] as const },
          'upperarm.L': { rotate: [armSwing * 0.35 * s, 0, lift] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.2, 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          'hand.L': { rotate: [0, 0, -(lift + tiltOut)] as const },
          arrow: { scale: HIDE },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006, 6, 12, 8));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03, 12, 19, 6));

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
    const ANCHOR: V3 = [-0.005, 0.432, 0.165]; // the pinch at full draw: under the right jaw
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
          hoodtip: { rotate: [4 * kick, 0, keys(p, [[0, 0], [0.18, -7], [0.32, 3], [0.46, 0], [0.8, 0], [0.9, 5], [1, 0]] as const) + 6 * kick] },
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
    // The goblin archer's hit. The head and the chest snap back and the hips give way: the left
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
          hoodtip: { rotate: [-10 * flop, 0, 8 * flop] },
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
    // The goblin archer's death. The blow snaps the chest back, the archer slumps forward and
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
    const PROP = [0.305, -0.29] as const;
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
          hoodtip: { rotate: [-12 * tipUp + 6 * tipDown, 0, -6 * wob + 10 * tipUp - 4 * tipDown] },
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

    // ------------------------------------------------------------------ attack2: a power shot
    // The attack's shot, deeper and slower. She plants the feet wide and leans back a little,
    // pushes the bow further out at the target, and draws the string past the jaw, up under the
    // right ear (below the hood's edge). She holds longer while the limbs bend: the `bowgrip`
    // bone stretches the bow's depth (world X at rest), so the limbs curve back deeper, and the
    // string halves follow the bent nocks. On the release the string snaps, the limbs spring
    // back, the bow kicks forward along the arrow line and tips over in the open hand, and the
    // recoil pushes her back: the rear (right) foot steps back, the front foot stays planted.
    // Then she steps back in and returns to rest.
    const RELEASE2 = 0.72;
    const DRAW2 = 0.2; // the pinch to the grip along the arrow line at full draw (the attack: 0.135)
    const ANCHOR2 = add(add(ANCHOR, scl(AIM, -0.035)), [-0.01, 0.004, 0.004]); // back along the arrow line, under the ear
    const BOW_AT2 = add(add(ANCHOR2, scl(AIM, DRAW2)), [0, -0.012, 0]); // a little higher: a long shot
    const BOW_NOCK2 = add(BOW_AT2, add(scl(AIM, -0.045), [0, -0.006, 0]));
    const BACK_W = norm([-0.2, 0, -1]); // the recoil, away from the target (world)
    const BEND = 0.35; // the bow's depth stretch at the end of the hold
    const mul = (a: V3, b: V3): V3 => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
    const div = (a: V3, b: V3): V3 => [a[0] / b[0], a[1] / b[1], a[2] / b[2]];
    /** Leg swing (x) and spread (z) in degrees that move the ankle by `d` (hips frame) under a leg twisted by `yaw`. */
    const legTo = (d: V3, yaw: number) => {
      const s = Math.max(-0.9, Math.min(0.9, -d[2] / (SHIN * Math.cos(yaw * DEG))));
      const t = Math.max(-0.9, Math.min(0.9, d[0] / SHIN + s * Math.sin(yaw * DEG)));
      return [Math.asin(s) / DEG, Math.asin(t) / DEG] as const;
    };
    k.animation('attack2', {
      duration: 1.3,
      loop: false,
      pose: (_t, p) => {
        const turn = keys(p, [[0, 0], [0.18, 1], [0.84, 1], [1, 0]] as const);
        const aim = keys(p, [[0, 0], [0.2, 1], [0.82, 1], [0.98, 0]] as const);
        const brace = keys(p, [[0.1, 0], [0.5, 1], [RELEASE2, 1], [0.9, 0.4], [1, 0]] as const);
        const kick = p >= RELEASE2 ? Math.exp(-(p - RELEASE2) * 16) : 0;
        const hold = Math.min(1, Math.max(0, (p - 0.52) / (RELEASE2 - 0.52)));
        const tremble = p > 0.52 && p < RELEASE2 ? Math.sin(hold * Math.PI * 7) * (0.4 + 0.6 * hold) : 0;
        // The bend: it grows in the draw and the hold, then the limbs spring back past straight.
        const bend = keys(p, [[0.27, 0], [0.52, 0.75], [RELEASE2, 1], [RELEASE2 + 0.025, -0.35], [RELEASE2 + 0.06, 0.15], [RELEASE2 + 0.1, 0]] as const);
        const bs: V3 = [1 + BEND * bend, 1 - 0.04 * bend, 1];
        const bent = (pt: V3) => add(GRIP, mul(sub(pt, GRIP), bs)); // a rest point on the bent bow
        const shL = add(scl([0, 0.012, 0.06], aim), scl(AIM, 0.025 * kick));
        const shR = keys(p, [[0, Z3], [0.2, [0.035, 0.012, 0.04]], [0.52, [0.012, 0.01, 0.015]], [0.84, [0.012, 0.01, 0.015]], [1, Z3]] as const);

        // ---- the bow arm: up in front, the nock, the slow push, the kick, back.
        const bowAt = keys(p, [
          [0, GRIP],
          [0.1, add(GRIP, [0.03, 0.09, 0.12])],
          [0.2, BOW_NOCK2],
          [0.27, BOW_NOCK2],
          [0.52, BOW_AT2],
          [RELEASE2, add(BOW_AT2, scl(AIM, 0.006))],
          [RELEASE2 + 0.03, add(add(BOW_AT2, scl(AIM, 0.045)), [0, -0.008, 0])],
          [0.84, add(BOW_AT2, [0.012, -0.025, 0.02])],
          [0.93, add(GRIP, [0.03, 0.07, 0.11])],
          [1, GRIP],
        ] as const);
        const out = norm([bowAt[0], 0, bowAt[2] + 0.02]);
        const along = out[0] * AIM[0] + out[2] * AIM[2];
        const side = norm(sub(out, scl(AIM, along * aim)));
        const lean = norm(add(add([0, 1, 0], scl(side, 0.62)), scl(AIM, 0.5 * kick)));
        const r = ease(0, 0.1, p) * (1 - ease(0.9, 1, p));
        const bowWant = { dir: norm(lerp(BOW_REST.dir, lean, r)), up: norm(lerp(BOW_REST.up, AIM, r)) };
        const poleL = keys(p, [[0, POLE_L_REST], [0.18, POLE_L_AIM], [0.86, POLE_L_AIM], [1, POLE_L_REST]] as const);
        const bow = bowArm(bowAt, bowWant, shL, 1, poleL);
        const rotsL = [bow.arm.upper, bow.arm.lower, bow.hand] as const;
        const onBow = (pt: V3) => add(follow(CHAIN_L, rotsL, pt), shL);
        const nockNow = onBow(bent(NOCK_MID));
        const restOnBow = onBow(ARROW_ON_BOW);
        const toBow = norm(sub(restOnBow, nockNow));

        // ---- the string hand: up, the nock, the slow draw past the jaw, the hold, the flick back.
        const pinchAt = keys(p, [
          [0, PINCH],
          [0.1, [-0.07, 0.33, 0.21]],
          [0.2, nockNow],
          [0.27, nockNow],
          [0.52, ANCHOR2],
          [RELEASE2, add(ANCHOR2, scl(AIM, -0.006))],
          [RELEASE2 + 0.04, add(ANCHOR2, [-0.08, 0.015, -0.01])],
          [0.84, add(ANCHOR2, [-0.09, -0.04, 0])],
          [1, PINCH],
        ] as const);
        const onString = keys(p, [[0, 0], [0.1, 0.4], [0.2, 1], [0.8, 1], [0.94, 0]] as const);
        const wristR = sub(pinchAt, add(scl(OFF_R, 1 - onString), scl(OFF_DRAW, onString)));
        const poleR = keys(p, [[0, POLE_R_REST], [0.18, POLE_R_DRAW], [0.86, POLE_R_DRAW], [1, POLE_R_REST]] as const);
        const armR = reach(ARM_R, sub(wristR, shR), poleR);
        const handR = slerpRot(Z3, orient([armR.upper, armR.lower], HAND_R_REST, HAND_R_DRAW), onString);
        const rotsR = [armR.upper, armR.lower, handR] as const;
        const pinchNow = add(follow(CHAIN_R, rotsR, PINCH), shR);

        // ---- the string: as in the attack, but each half lives in the stretched bow frame, so
        // the target is taken back through the hand chain and the bow's stretch.
        const pulled = p >= 0.2 && p < RELEASE2;
        const mid = pulled ? pinchNow : add(nockNow, scl(toBow, 0.02 * kick));
        const qInv = chainQ(rotsL).invert();
        const string = (nock: V3) => {
          const n = onBow(bent(nock));
          const u = div(turnBy(qInv, sub(mid, n)), bs);
          const v = sub(NOCK_MID, nock);
          const l = len(u);
          const sy = Math.sqrt(Math.max(1e-6, l * l - v[0] * v[0] - v[2] * v[2])) / Math.abs(v[1]);
          return {
            rotate: orient([], { dir: norm([v[0], v[1] * sy, v[2]]), up: [0, 0, 1] }, { dir: norm(u), up: [0, 0, 1] }),
            scale: [1, sy, 1] as V3,
          };
        };

        // ---- the arrow: only from the nock to the release, then it leaves along the arrow line.
        const flown = p >= RELEASE2 ? Math.min(1, (p - RELEASE2) / 0.03) : 0;
        const shown = p >= 0.2 && p < RELEASE2 + 0.03;
        const arrow = !shown
          ? { move: Z3, rotate: Z3 }
          : p < RELEASE2
            ? arrowPose(rotsR, shR, pinchNow, norm(sub(restOnBow, pinchNow)))
            : arrowPose(rotsR, shR, add(ANCHOR2, scl(AIM, 0.8 * flown)), AIM); // along the arrow line, not the tipping bow

        // ---- the legs: a wide braced stance; the recoil moves the hips back, the front foot stays
        // planted, and the rear foot steps back twice as far (with a small lift), then returns.
        const recoil = keys(p, [[RELEASE2, 0], [RELEASE2 + 0.07, 1], [0.86, 1], [1, 0]] as const);
        const lift = keys(p, [[RELEASE2, 0], [RELEASE2 + 0.035, 1], [RELEASE2 + 0.07, 0], [0.86, 0], [0.93, 1], [1, 0]] as const);
        const b = 0.032 * recoil;
        const u = rotYv(BACK_W, 35 * turn); // the recoil in the hips' frame
        const wide = 9 * turn;
        const yawL = 25 * turn;
        const yawR = 15 * turn;
        const [sxL, szL] = legTo(scl(u, -b), yawL);
        const [sxR, szR] = legTo(scl(u, b + 0.02 * lift), yawR);
        const xL = -5 * turn + sxL;
        const zL = 5 * turn + wide + szL;
        const xR = 4 * turn + sxR;
        const zR = -4 * turn - wide + szR;
        const drop = SHIN * (1 - Math.cos(xL * DEG) * Math.cos(zL * DEG));

        return {
          hips: { move: add(scl(BACK_W, b), [0, -drop, 0]), rotate: [0, -35 * turn, 0] },
          spine: { rotate: [-5 * brace, -12 * turn, 0] },
          chest: { rotate: [-2 * aim + 0.5 * tremble - 7 * kick, -8 * turn, 0] },
          neck: { rotate: [2 * brace, 15 * turn, 0] },
          head: { rotate: [-5 * aim + 2 * brace, 25 * turn, 0] }, // the chin up, over the string
          hoodtip: { rotate: [8 * kick, 0, keys(p, [[0, 0], [0.16, -7], [0.3, 3], [0.46, 0], [RELEASE2, 0], [0.92, 5], [1, 0]] as const) + 10 * kick] },
          'upperarm.L': { move: shL, rotate: bow.arm.upper },
          'forearm.L': { rotate: bow.arm.lower },
          'hand.L': { rotate: bow.hand },
          bowgrip: { scale: bs },
          'upperarm.R': { move: shR, rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'string.top': string(NOCK_TOP),
          'string.bot': string(NOCK_BOT),
          arrow: { ...arrow, scale: shown ? ([1, 1, 1] as V3) : HIDE },
          'leg.L': { rotate: [xL, yawL, zL] },
          'leg.R': { rotate: [xR, yawR, zR] },
          'foot.L': { rotate: [-xL, 10 * turn, -zL] },
          'foot.R': { rotate: [-xR, 8 * turn, -zR] },
        };
      },
    });

    // ------------------------------------------------------------------ victory: the bow held high
    // She hops and swings the bow up high on her left, beside the hood: the bow stands in front
    // of the ear with its back to the front, so the limbs and the string stay clear of the hood
    // and the ear tip. The right fist comes up and pumps twice, then goes to her hip. She ends in
    // a proud pose and holds it: the chest out, the chin up, the bow high, the hood point at
    // rest. The arms are solved by targets in the chest's rest frame, like the shot.
    const V_GRIP: V3 = [0.23, 0.515, 0.125]; // the bow grip, high beside the hood
    // The limbs lean out; the back of the bow faces front and a little in, so the string is out and behind.
    const V_BOW = { dir: norm([0.4, 1, 0.15]), up: norm([-0.35, 0, 1]) };
    const V_POLE_L: V3 = [0.45, 0.3, -0.1];
    const FIST_UP: V3 = [-0.225, 0.48, 0.1]; // the right wrist: the fist up
    const FIST_DOWN: V3 = [-0.2, 0.4, 0.12]; // the right wrist at the bottom of a pump
    const FIST_HIP: V3 = [-0.19, 0.3, 0.02]; // the right wrist: the fist on the hip
    const V_POLE_R: V3 = [-0.4, 0.25, 0.05];
    const HIP_POLE_R: V3 = [-0.42, 0.38, -0.15];
    k.animation('victory', {
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
          hoodtip: { rotate: [10 * flop, 0, 6 * flop] },
          'upperarm.L': { move: shL, rotate: bow.arm.upper },
          'forearm.L': { rotate: bow.arm.lower },
          'hand.L': { rotate: bow.hand },
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
