import { defineAsset, motion, noise, profile, rgb, Sdf, sdf } from '../src/index.js';

/**
 * Rune-Smith — hero (catalog `heroes/magic/rune-smith`), a young stocky dwarf-built smith, about 0.98 m
 * to the top of the goggles, faces +Z. Target: docs/hero-mockups/rune-smith_001.jpg (the beard is left
 * out so the face stays young, round, and beardless like every hero of the set). Built on the cleric's
 * body and skeleton (the rogue's head, chibi skeleton with knee bones, a wider barrel body and broad
 * shoulders) with the alchemist's young face and goggles.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite; the red hair with goggles, the brown apron on
 *   the dark tunic, and the glowing rune hammer must read small.
 * One idea: a stocky young smith holding up a heavy hammer whose dark head is covered in glowing cyan
 *   rune dots, dark iron goggles pushed up on swept red hair.
 * Proportions: goggles 0.98, hair 0.90, eyes 0.63, chin 0.48, shoulders 0.39, belt 0.25, apron hem 0.08,
 *   boots 0.13. The hammer head (r 0.055, 0.16 long) rides at 0.70 beside the right shoulder.
 * Shape language: round and soft (face, fists, boots) over square, sturdy forms (barrel body, apron,
 *   the cylinder head of the hammer).
 * Palette (60/30/10): dark grey #2e2a30 cowl and tunic; leather browns #8a5a35 / #4e2d1c / #6b4226;
 *   red hair #b84a28; brass #c9a24a buckles and studs; the cyan runes #40e0ff are the accent.
 * Value plan: the dark cowl, tunic, and hammer head frame the mid browns; the bright hair and the
 *   glowing runes hold the strongest contrast.
 * Bodies: skin, hair, goggle iron/lens/strap, tunic, sleeves, cowl, apron, belt, brass, bracer, pants,
 *   boots, hammer-haft, hammer-head, hammer-brass, rune-glow, rune-disc.
 * Rig: the cleric's chibi skeleton without the beard and relic bones, plus `runes` on the right hand
 *   (the rune dots and discs; they flare in the attacks). The hammer is rigid on the right hand.
 *   Clips: idle, walk, run, attack (a slam with a rune flash), attack2 (an overhead rune strike), hit,
 *   death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  freckle: '#d08e6c',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#b07a34',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#9a3c1e',
  mouth: '#7a2a2a',
  hair: '#c8502a',
  hairDark: '#8a3018',
  iron: '#3a3a40',
  goggle: '#2a2a2e',
  glass: '#08080a',
  discRune: '#6ff0ff',
  lens: '#1a1a1e',
  tunic: '#2f3038',
  tunicFold: '#1c1a1e',
  cowl: '#5a5e68',
  pants: '#26232a',
  apron: '#7a4e2a',
  apronEdge: '#5f3d22',
  belt: '#4e2d1c',
  brass: '#c9a24a',
  brassDark: '#4a3510',
  boot: '#6b4226',
  bootCuff: '#54331c',
  cap: '#2e2a30',
  sole: '#2a1a10',
  head: '#3a3634',
  rune: '#40e0ff',
  runeBase: '#104050',
  haft: '#4a2e1c',
  haftWrap: '#2e1c10',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. Broad shoulders. The right forearm points forward and holds the hammer upright; the
// left arm hangs at the side with the fist forward.
const SHOULDER: V3 = [0.16, 0.39, 0];
const ELBOW_R: V3 = [-0.236, 0.345, -0.004];
const WRIST_R: V3 = [-0.27, 0.335, 0.094];
const ELBOW_L: V3 = [0.215, 0.335, 0.0];
const WRIST_L: V3 = [0.24, 0.262, 0.07];
const HIP: V3 = [0.075, 0.195, 0];
const ANKLE: V3 = [0.105, 0.07, 0];
const KNEE: V3 = [0.09, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

const rad = Math.PI / 180;
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotY = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

/** A big fist hanging from the wrist at the origin; its grip hole runs along Z. */
const palmLocal = (s: 1 | -1) => sdf.ellipsoid([0.043, 0.048, 0.05]).at(0.008 * s, -0.042, 0.004);
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    palmLocal(s),
    sdf.capsule([-0.01 * s, -0.064, 0.034], [-0.006 * s, -0.042, 0.048], 0.019),
    sdf.cone([0.023 * s, -0.026, 0.028], [0.001 * s, -0.037, 0.054], 0.018, 0.014),
  );
const HAND_R = { pitch: -84, roll: 17 };
const HAND_L = { pitch: -50, roll: 8 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);
const GRIP = handPoint(HAND_R, WRIST_R, [-0.008, -0.044, 0.004]);
const HAFT_AXIS = norm(rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll));

// The hammer: grip in the fist, a short haft (the butt hangs a hand below the fist), and a cylinder
// head (r 0.055, 0.16 long, axis across the haft) centered at 0.70, level with the face.
const HAFT_DOWN = 0.03;
const HEAD_T = (0.74 - GRIP[1]) / HAFT_AXIS[1]; // the head's center, along the haft from the grip
const haftAt = (t: number): V3 => add(GRIP, scl(HAFT_AXIS, t));
const HEAD_C = haftAt(HEAD_T);

export default defineAsset({
  name: 'rune-smith',
  description: 'Chibi rune-smith hero with swept red hair under dark iron goggles, a dark cowl and tunic, a brown apron, a brass-studded bracer, and a heavy hammer covered in glowing cyan runes.',
  detail: 0.006,
  reference: 'docs/hero-mockups/rune-smith_001.jpg',
  // Color slots for individual smiths (the first option is the default look). The runes slot is the
  // glow of the hammer head: the dots, the disc, and their dark base.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { red: C.hair, black: '#231a17', blond: '#c9a050' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    runes: { cyan: C.rune, gold: '#ffd060', violet: '#c060ff' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'red', skin: 'fair', runes: 'cyan' },
    gold: { eyes: 'blue', hair: 'blond', skin: 'tan', runes: 'gold' },
    violet: { eyes: 'green', hair: 'black', skin: 'brown', runes: 'violet' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      freckle: k.tint('skin', { color: C.freckle, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      rune: k.tint('runes'),
      discRune: k.tint('runes', { color: C.discRune, follow: 1 }),
      runeBase: k.tint('runes', { color: C.runeBase, follow: 1 }),
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
      runes: { parent: 'hand.R', at: HEAD_C },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face (the alchemist's)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.097, 0.575, 0.072)),
        sdf.ellipsoid([0.115, 0.057, 0.087]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.03, 0.026, 0.024]).at(0, 0.572, faceZ(0, 0.572) - 0.003).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.032, 0.05, 0.034])
        .subtract(sdf.sphere(0.02).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.612, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.054).bone('neck');
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.046, 0.04).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.04, 0.035).bone('forearm.R'),
      handPose(HAND_R, WRIST_R)(fistLocal(-1)).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.046, 0.04).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.04, 0.035).bone('forearm.L'),
      handPose(HAND_L, WRIST_L)(fistLocal(1)).bone('hand.L'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.054, 0.058, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.045, 0.051, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.039, 0.045, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] - 0.002));
    // Heavy upper lids, a little flat on the inner side: a determined look.
    const lid = pair(sdf.extrude(profile.arc(0.053, 0.012, 22, 158), 0.3).at(EYE[0], EYE[1] - 0.006, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.013), x + 0.016, EYE[1] + 0.018),
        at(sdf.sphere(0.0065), x - 0.015, EYE[1] - 0.022),
      ]),
    );
    const blush = pair(at(sdf.sphere(0.036), 0.142, 0.562));
    const freckles = sdf.union(
      ...[1, -1].flatMap((s) =>
        [
          [0.11, 0.567],
          [0.13, 0.554],
          [0.088, 0.55],
        ].map(([x, y]) => at(sdf.sphere(0.0065), s * x!, y!)),
      ),
    );
    // A firm, slightly downturned mouth: a short shallow line with a small pout below it.
    const MOUTH_Y = 0.528;
    const mouth = sdf.extrude(profile.arc(0.13, 0.01, 246, 294), 0.3).at(0, MOUTH_Y + 0.13, 0.1);
    const pout = sdf.ellipsoid([0.03, 0.012, 0.03]).at(0, MOUTH_Y - 0.02, faceZ(0, MOUTH_Y - 0.02) + 0.004).bone('head');
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .smoothUnion(0.012, pout)
      .union(armR, armL)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(freckles, T.freckle, 0.004)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(mouth, T.mouth, 0.002);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a low swept cap with six locks to -X
    const DEG = Math.PI / 180;
    const skull = sdf.ellipsoid([HEAD[0], HEAD[1], HEAD[2]]).at(0, HEAD_Y, 0);
    const faceMask = sdf.ellipsoid([0.25, 0.17, 0.22]).at(0, 0.6, 0.15);
    const volume = sdf
      .ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.018, HEAD[2] + 0.018])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -0.585)) // the nape line
      .smoothSubtract(0.015, faceMask)
      .smoothSubtract(0.012, pair(sdf.ellipsoid([0.05, 0.062, 0.05]).at(0.232, 0.622, 0.004))); // clear the ears
    const HC: V3 = [0, 0.7, -0.01];
    /** The point on the hair volume seen from the center in direction (polar `th` from the top, azimuth `ph` from the front toward his left), lifted along the ray. */
    const hs = (th: number, ph: number, lift = 0): V3 => {
      const d: V3 = [Math.sin(th * DEG) * Math.sin(ph * DEG), Math.cos(th * DEG), Math.sin(th * DEG) * Math.cos(ph * DEG)];
      const hit = sdf.raycast(volume, add(HC, scl(d, 0.6)), scl(d, -1))!;
      return add(hit, scl(d, lift));
    };
    const up = (p: V3, dy: number): V3 => [p[0], p[1] + dy, p[2]];
    // A thick lock: a chain from inside the volume that sweeps out and ends in a point.
    const lock = (th: number, ph: number, dth: number, dph: number, lift: number, r: number, tipUp: number) =>
      sdf.chain(
        [
          [...hs(th, ph, -0.022), r],
          [...hs(th + dth * 0.5, ph + dph * 0.5, 0.012 + lift * 0.35), r * 0.78],
          [...up(hs(th + dth, ph + dph, lift), tipUp), 0.006],
        ],
        0.012,
      );
    // Two short tufts at the nape.
    const backLocks = sdf.union(lock(112, 158, 8, 16, 0.03, 0.03, -0.012), lock(112, -158, 8, -16, 0.03, 0.03, -0.012));
    // The fringe: a big swept lock over the right side of the forehead (a bent ellipsoid, tilted 25
    // degrees toward -X) and two smaller locks beside it.
    const bandFront = skull.round(0.02);
    const fr = (x: number, y: number, lift: number): V3 => {
      const h = sdf.raycast(bandFront, [x, y, 1], [0, 0, -1])!;
      return [h[0], h[1], h[2] + lift];
    };
    const bigLockAt = fr(-0.045, 0.77, 0.028);
    const tipAt = fr(-0.115, 0.735, 0.02);
    const bigLock = sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([0.07, 0.035, 0.05]).rotateZ(25).at(...bigLockAt),
      sdf.ellipsoid([0.04, 0.026, 0.036]).rotateZ(40).at(...tipAt),
    );
    const fringeLock = (x0: number, x1: number, y0: number, y1: number) =>
      sdf.chain(
        [
          [...fr(x0, 0.81, 0.0), 0.034],
          [...fr((x0 + x1) / 2, (y0 + y1) / 2 + 0.008, 0.016), 0.028],
          [...fr(x1, y1, 0.01), 0.007],
        ],
        0.012,
      );
    const fringe = sdf.union(bigLock, fringeLock(0.13, 0.04, 0.785, 0.75), fringeLock(0.06, 0.0, 0.79, 0.755));
    const sideburns = pair(sdf.cone([0.194, 0.7, 0.04], [0.198, 0.6, 0.066], 0.026, 0.011));
    // Heavy brows: thick arched rolls, the inner ends lower, the outer ends curling down.
    const brow = (s: 1 | -1) => {
      const pt = (x: number, y: number, lift: number): V3 => [s * x, y, faceZ(x, y) + lift];
      const a = pt(0.036, 0.712, 0.008);
      const m = pt(0.092, 0.736, 0.012);
      const b = pt(0.148, 0.73, 0.006);
      const c = pt(0.176, 0.706, 0.0);
      return sdf.chain(
        [
          [a[0], a[1], a[2], 0.02],
          [m[0], m[1], m[2], 0.023],
          [b[0], b[1], b[2], 0.018],
          [c[0], c[1], c[2], 0.01],
        ],
        0.012,
      );
    };
    const brows = sdf.union(brow(1), brow(-1));
    const hairShape = volume
      .smoothUnion(0.02, sideburns)
      .smoothUnion(0.025, backLocks)
      .smoothUnion(0.012, brows)
      .smoothUnion(0.01, fringe);
    const browPaint = brows.round(0.004);
    const hair = hairShape.paintWhere(browPaint, T.brow, 0.006);
    k.body('hair', hair, { color: T.hair, roughness: 0.65, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ goggles pushed up on the forehead
    // Two dark iron rings with black lenses, tilted back, joined by a bridge, with an iron strap band
    // around the head.
    const GOG_X = 0.06;
    const GOG_Y = 0.862;
    const gogZ = sdf.raycast(volume, [GOG_X, 0.815, 1], [0, 0, -1])![2] + 0.006;
    const gogPose = (s: sdf.Shape) => s.rotateX(58).rotateY(8).at(GOG_X, GOG_Y, gogZ);
    const ringIron = sdf.union(sdf.torus(0.052, 0.015), sdf.torus(0.056, 0.011).at(0, -0.012, 0));
    const lens = sdf.smoothUnion(0.006, sdf.cylinder(0.046, 0.022, 0.004).at(0, -0.002, 0), sdf.ellipsoid([0.045, 0.024, 0.045]).at(0, 0.006, 0));
    const strapBox = sdf.box([0.8, 0.02, 0.8], 0.006).rotateX(-6).at(0, 0.79, 0);
    const strapShell = hairShape.round(0.009).subtract(hairShape.round(-0.004)).smoothIntersect(0.004, strapBox);
    const bridge = sdf.capsule([-0.02, GOG_Y + 0.004, gogZ], [0.02, GOG_Y + 0.004, gogZ], 0.013);
    k.body('goggle-iron', sdf.union(hard(gogPose(ringIron)), bridge, strapShell).bone('head'), { color: C.goggle, roughness: 0.45, metalness: 0.7, detail: 0.005 });
    k.body('goggle-lens', hard(gogPose(lens)).bone('head'), { color: C.glass, roughness: 0.06, metalness: 0.3, detail: 0.004 });

    // ------------------------------------------------------------------ tunic, sleeves, cowl
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.48],
            [0.08, 0.475],
            [0.12, 0.45],
            [0.14, 0.41],
            [0.146, 0.34],
            [0.142, 0.29],
            [0.15, 0.24],
            [0.164, 0.19],
            [0.174, 0.162],
            [0.164, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1.22, 1, 0.88]);
    const folds = (y0: number, y1: number, freq: number) => (x: number, y: number, z: number, base: readonly [number, number, number]) =>
      y > y0 && y < y1 && Math.sin(Math.atan2(z, x) * freq + y * 24) > 0.995 ? rgb(C.tunicFold) : base;
    k.body('tunic', torso.bone('spine').paintFn(folds(0.15, 0.45, 6)), { color: C.tunic, roughness: 0.85 });
    // Short sleeves to mid upper arm.
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf.cone([s[0] * 0.8, 0.41, 0], lerp(s, e, 0.8), 0.058, 0.053).round(0.004).bone(tag);
    k.body('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')).paintFn(folds(0.3, 0.44, 5)), {
      color: C.tunic,
      roughness: 0.85,
    });
    // The cowl: a lighter grey shoulder cape (0.02 proud of the tunic) with a rounded collar ring around
    // the neck, an open front over the bib, a soft hem at chest height, and a heap of hood behind the neck.
    const capeShell = torso
      .round(0.022)
      .subtract(torso.round(-0.004))
      .smoothIntersect(0.012, sdf.box([1, 0.3, 1], 0.02).at(0, 0.51, 0))
      .smoothSubtract(0.012, sdf.box([0.19, 0.12, 0.5], 0.03).at(0, 0.385, 0.25));
    const collarRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.083, 0.512],
            [0.11, 0.505],
            [0.13, 0.484],
            [0.12, 0.45],
            [0.09, 0.448],
          ],
          { smooth: true, samples: 4 },
        ),
      )
      .scale([1, 1, 0.9]);
    const hoodHeap = sdf.smoothUnion(0.03, sdf.ellipsoid([0.115, 0.07, 0.06]).at(0, 0.44, -0.115), sdf.ellipsoid([0.08, 0.05, 0.045]).at(0, 0.5, -0.1));
    const cowl = sdf
      .smoothUnion(0.02, capeShell, collarRing, hoodHeap)
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 9 + y * 30) > 0.993 ? rgb(C.tunicFold) : base));
    k.body('cowl', cowl, { color: C.cowl, roughness: 0.9, bone: 'chest', detail: 0.005 });

    // ------------------------------------------------------------------ apron, belt, brass, bracer
    const beltY = 0.25;
    // The bib: the torso's skin, 0.022 thick, cut to a 0.18 x 0.16 rounded panel on the chest.
    const bibBox = sdf.box([0.16, 0.185, 0.6], 0.03).at(0, 0.3675, 0.3);
    const torsoShell = torso.round(0.012).subtract(torso.round(-0.01));
    const edgeOf = (b: sdf.Shape) => b.subtract(b.round(-0.011));
    const bib = torsoShell.smoothIntersect(0.004, bibBox).paintWhere(edgeOf(bibBox), C.apronEdge, 0.002);
    // The skirt panel: 0.22 x 0.18, hanging from the belt in front, a thin curved shell.
    const skirtCone = sdf.cone([0, 0.26, 0], [0, 0.08, 0], 0.163, 0.15).scale([1.22, 1, 0.88]);
    const skirtBox = sdf.box([0.22, 0.18, 0.6], 0.02).at(0, 0.165, 0.3);
    const skirt = skirtCone.round(0.008).subtract(skirtCone.round(-0.008)).smoothIntersect(0.004, skirtBox).paintWhere(edgeOf(skirtBox), C.apronEdge, 0.002);
    k.body('apron', sdf.union(bib, skirt).bone('spine'), { color: C.apron, roughness: 0.85, detail: 0.005 });

    const belt = torso.round(0.02).smoothIntersect(0.006, sdf.box([0.6, 0.05, 0.6], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.belt, roughness: 0.7 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];

    // Brass: two bib buckles, the rune buckle, the anvil charm, and the bracer studs.
    const bibStud = (x: number) => {
      const p = sdf.surfacePoint(bib, [x, 0.41, 0.4], 0);
      return sdf.sphere(0.0095).at(p[0], p[1], p[2] + 0.002);
    };
    const runeBox = sdf.box([0.076, 0.062, 0.014], 0.006).at(0, beltY, beltZ + 0.004);
    const runeZ = sdf.raycast(runeBox, [0, beltY, 1], [0, 0, -1])![2];
    // An angular rune (a ᚱ shape): a staff, a bowl, and a leg.
    const stroke = (a: [number, number], b: [number, number]) => sdf.capsule([a[0], beltY + a[1], runeZ], [b[0], beltY + b[1], runeZ], 0.0048);
    const runeStroke = sdf.union(
      stroke([-0.013, -0.022], [-0.013, 0.022]),
      stroke([-0.013, 0.022], [0.009, 0.01]),
      stroke([0.009, 0.01], [-0.013, -0.003]),
      stroke([-0.004, -0.003], [0.013, -0.022]),
    );
    const runeBuckle = runeBox.paintWhere(runeStroke, C.brassDark, 0.001);
    const anvilP = profile.polygon(
      [
        [-0.019, 0.008],
        [-0.008, 0.012],
        [0.014, 0.012],
        [0.014, 0.006],
        [0.006, 0.003],
        [0.005, -0.005],
        [0.012, -0.008],
        [0.012, -0.012],
        [-0.012, -0.012],
        [-0.012, -0.008],
        [-0.005, -0.005],
        [-0.006, 0.003],
        [-0.012, 0.005],
      ],
      { smooth: false },
    );
    const CHARM_X = 0.085;
    const charmZ = sdf.raycast(skirt, [CHARM_X, 0.19, 1], [0, 0, -1])![2] + 0.008;
    const anvil = sdf
      .union(
        sdf.extrude(anvilP, 0.016, 0.002).rotateZ(10).at(CHARM_X, 0.188, charmZ),
        sdf.capsule([CHARM_X, beltY - 0.02, charmZ], [CHARM_X, 0.2, charmZ], 0.0045),
      )
      .bone('spine');
    // The bracer: a dark iron cylinder on the left forearm with five brass studs on the outer face.
    const bracerShape = sdf
      .union(
        sdf.cone(lerp(ELBOW_L, WRIST_L, 0.12), lerp(ELBOW_L, WRIST_L, 0.96), 0.05, 0.055).round(0.003),
        sdf.cone(lerp(ELBOW_L, WRIST_L, 0.08), lerp(ELBOW_L, WRIST_L, 0.2), 0.055, 0.056).round(0.003),
        sdf.cone(lerp(ELBOW_L, WRIST_L, 0.88), lerp(ELBOW_L, WRIST_L, 1.0), 0.06, 0.06).round(0.003),
      )
      .bone('forearm.L');
    const studs = sdf
      .union(
        ...[0.2, 0.35, 0.5, 0.65, 0.8].map((t) => {
          const p = sdf.surfacePoint(bracerShape, add(lerp(ELBOW_L, WRIST_L, t), scl(norm([1, 0, 0.35]), 0.12)), 0);
          return sdf.sphere(0.0085).at(p[0], p[1], p[2]);
        }),
      )
      .bone('forearm.L');
    k.body('brass', sdf.union(bibStud(0.05).bone('spine'), bibStud(-0.05).bone('spine'), runeBuckle.bone('spine'), anvil, studs), {
      color: C.brass,
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.004,
    });
    k.body('bracer', bracerShape, { color: C.iron, roughness: 0.45, metalness: 0.7 });

    // ------------------------------------------------------------------ legs and boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.13, 0.05, 0.09]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.1, 0.1, 0.004], 0.054).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });
    // Big round boots: a wide toe with a dark toe cap, a folded cuff, a dark sole.
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.064, 0.1, 0.02).at(0, 0.07, 0), sdf.ellipsoid([0.075, 0.062, 0.122]).at(0, 0.052, 0.052))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const cuff = sdf.cylinder(0.071, 0.03, 0.012).at(0, 0.104, 0);
    const boot = sdf
      .union(
        bootFoot
          .paintWhere(sdf.halfSpace([0, 1, 0], 0.018), C.sole)
          .paintWhere(sdf.ellipsoid([0.1, 0.075, 0.06]).at(0, 0.045, 0.178), C.cap, 0.006),
        cuff.paintWhere(sdf.halfSpace([0, 1, 0], 0.094), C.bootCuff),
      )
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.55 });

    // ------------------------------------------------------------------ the rune hammer (right hand)
    const haft = sdf
      .capsule(haftAt(-HAFT_DOWN), haftAt(HEAD_T), 0.02)
      .paintFn((x, y, z, base) => (Math.sin(y * 150 + Math.atan2(z - GRIP[2], x - GRIP[0]) * 2) > 0.55 ? rgb(C.haftWrap) : base));
    k.body('hammer-haft', haft, { color: C.haft, roughness: 0.75, bone: 'hand.R' });
    // The head: a cylinder along X (r 0.055, 0.16 long) with two raised bands and an iron ring at each end,
    // tilted with the haft; a socket under it.
    const headPose = (s: sdf.Shape) => s.rotateZ(HAND_R.roll).at(...HEAD_C);
    const R_H = 0.06;
    const headLocal = sdf.union(
      sdf.cylinder(R_H, 0.16, 0.012).rotateZ(90),
      ...[-1, 1].flatMap((sx) => [
        sdf.cylinder(R_H + 0.004, 0.012, 0.004).rotateZ(90).at(sx * 0.055, 0, 0),
        sdf.torus(0.054, 0.006).rotateZ(90).at(sx * 0.08, 0, 0),
      ]),
      sdf.smoothUnion(0.006, sdf.cylinder(0.027, 0.06, 0.006).at(0, -0.08, 0), sdf.cylinder(0.034, 0.016, 0.005).at(0, -0.059, 0)),
    );
    k.body('hammer-head', headPose(headLocal), {
      color: C.head,
      roughness: 0.6,
      metalness: 0.3,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 3),
    });
    const brassPin = sdf.smoothUnion(0.006, sdf.cone([0, 0.055, 0], [0, 0.093, 0], 0.012, 0.005), sdf.sphere(0.008).at(0, 0.095, 0));
    const buttCap = sdf.smoothUnion(0.006, sdf.cylinder(0.026, 0.02, 0.005).at(...haftAt(-HAFT_DOWN + 0.006)));
    k.body('hammer-brass', sdf.union(headPose(brassPin), buttCap), { color: C.brass, roughness: 0.4, metalness: 0.8, bone: 'hand.R', detail: 0.004 });
    // The glow: twelve rune dots (short studs that reach into the head, so they can grow out of it in a
    // flare) in three staggered columns, and a disc on each end face.
    const dots = sdf.union(
      ...[-1, 0, 1].flatMap((c) =>
        [0, 1, 2, 3].map((j) => {
          const a = (j * 90 + (c === 0 ? 0 : 45)) * DEG;
          const cy = Math.sin(a);
          const cz = Math.cos(a);
          return sdf.capsule([c * 0.028, 0.032 * cy, 0.032 * cz], [c * 0.028, 0.0585 * cy, 0.0585 * cz], 0.0105);
        }),
      ),
    );
    k.body('rune-glow', headPose(dots), {
      color: T.runeBase,
      roughness: 0.4,
      emissive: T.rune,
      emissiveIntensity: 1.6,
      bone: 'runes',
      detail: 0.004,
    });
    // The disc faces: full-brightness cyan, r 0.05, on each end of the head.
    const discs = sdf.union(...[-1, 1].map((sx) => sdf.cylinder(0.05, 0.05, 0.004).rotateZ(90).at(sx * 0.062, 0, 0)));
    k.body('rune-disc', headPose(discs), { color: T.discRune, roughness: 0.3, emissive: T.discRune, emissiveIntensity: 0.6, bone: 'runes', detail: 0.004 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        'forearm.R': { rotate: [-3 * bump(p), 0, 0] },
      }),
    });

    // A short, heavy stride: body roll, the braids bounce on each step. The legs come from
    // motion.gait: planted stance feet, a knee lift in the swing, heel strike and toe-off. `step` is
    // the foot travel, `lift` the swing height, `duty` the share of the cycle a foot is down (a run
    // has a flight between steps), `hop` the hips bob. The sole points are the boot's heel and toe
    // on the floor (measured from bootFoot, turned 10 degrees out).
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, 4 * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, { // left heel strike at 0.25, with the left arm back
          stride: step,
          lift,
          duty,
          bob: hop,
          sit: 0.005, // the upright hammer's butt hangs low: a shallow sit keeps it off the floor
          roll: 10,
          heel: [0.1, 0, -0.028],
          toe: [0.117, 0, 0.12],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -2 * s] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, -2 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.2 * s, 0, 2] as const },
          'upperarm.R': { rotate: [-armSwing * 0.35 * s, 0, -3] as const },
        };
      },
    });
    k.animation('walk', stride(0.95, 0.1, 0.025, 0.6, 26, 3, 0.006));
    k.animation('run', stride(0.6, 0.15, 0.045, 0.4, 44, 10, 0.03));

    // Posing by targets: the wrist follows keys in the chest's rest frame (reach), and the hand
    // turns so the haft points along its own keys (orient). HAMMER.up is the normal of the cross
    // face; in a swing it turns sideways, so the striking end of the head leads.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const HAMMER = { dir: HAFT_AXIS, up: [0, 0, 1] as V3 };
    // The left arm hangs and only swings; its fist follows the forearm.
    const armPose = (wrist: V3, pole: V3 = [0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower } };
    };
    const hammerPose = (wrist: V3, dir: V3, up: V3, pole: V3 = [-0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], HAMMER, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    // The rune dots and discs grow out of the head in a flare (scale about the head's center).
    const flareScale = (f: number) => ({ runes: { scale: [1 + 0.45 * f, 1 + 0.45 * f, 1 + 0.45 * f] as const } });

    // attack: an overhead smash. The hammer rises up and back over the right shoulder, its head
    // lagging behind; a short hold at the top; then the body drives it over and down in front on
    // the right side, the knees drop, the spine bends, the head of the hammer hits the ground and
    // bounces a little; a slow recovery back to rest.
    k.animation('attack', {
      duration: 1.15,
      loop: false,
      pose: (_t, p) => {
        // The strike keeps its speed through the keys (spline) and stops dead at the impact;
        // the bounce and the recovery ease in and out (smooth).
        const HIT = 0.58;
        const wristKeys = [
          [0, WRIST_R],
          [0.14, [-0.29, 0.41, 0.05]],
          [0.3, [-0.272, 0.53, -0.04]],
          [0.42, [-0.262, 0.54, -0.055]],
          [0.49, [-0.268, 0.52, 0.06]],
          [0.54, [-0.268, 0.43, 0.15]],
          [HIT, [-0.262, 0.35, 0.16]],
        ] as const;
        const wristAfter = [
          [HIT, [-0.262, 0.35, 0.16]],
          [0.66, [-0.26, 0.37, 0.15]],
          [1, WRIST_R],
        ] as const;
        const dirKeys = [
          [0, HAFT_AXIS],
          [0.14, norm([-0.32, 0.92, -0.22])],
          [0.3, norm([-0.2, 0.8, -0.58])],
          [0.42, norm([-0.12, 0.66, -0.74])],
          [0.49, norm([-0.06, 0.98, 0.1])],
          [0.54, norm([0, 0.8, 0.6])],
          [HIT, norm([0, 0.44, 0.9])],
        ] as const;
        const dirAfter = [
          [HIT, norm([0, 0.44, 0.9])],
          [0.66, norm([0, 0.52, 0.85])],
          [1, HAFT_AXIS],
        ] as const;
        const wrist = p < HIT ? keys(p, wristKeys, 'spline') : keys(p, wristAfter);
        const dir = p < HIT ? keys(p, dirKeys, 'spline') : keys(p, dirAfter);
        const up = keys(
          p,
          [
            [0, [0, 0, 1]],
            [0.2, [-1, 0, 0.1]],
            [0.84, [-1, 0, 0.1]],
            [1, [0, 0, 1]],
          ] as const,
        );
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.44, 0.54, p));
        const smash = ease(0.46, 0.58, p) * (1 - ease(0.7, 1, p));
        const jolt = bump(Math.min(1, Math.max(0, (p - 0.57) / 0.1)));
        return {
          ...hammerPose(wrist, dir, up),
          hips: {
            move: [0, -legDrop(LEG, 22 * smash) - 0.016 * smash - 0.004 * wind, 0.035 * smash - 0.015 * wind],
            rotate: [0, -10 * wind + 8 * smash, 0],
          },
          spine: { rotate: [-7 * wind + 18 * smash, 0, 0] },
          chest: { rotate: [-5 * wind + 10 * smash + 3 * jolt, -16 * wind + 12 * smash, 0] },
          head: { rotate: [8 * wind - 14 * smash, 12 * wind - 10 * smash, 0] },
          // The left arm swings out and back for balance, then braces forward.
          ...armPose(keys(p, [[0, WRIST_L], [0.3, [0.29, 0.3, 0.0]], [0.5, [0.29, 0.3, 0.0]], [0.6, [0.235, 0.27, 0.09]], [1, WRIST_L]] as const)),
          // The runes charge during the wind-up and flare at the impact.
          ...flareScale(Math.max(0.5 * ease(0.1, 0.3, p) * (1 - ease(0.44, 0.5, p)), ease(0.5, 0.58, p) * (1 - ease(0.66, 0.95, p)))),
          'leg.L': { rotate: [2 * wind - 26 * smash, 0, 0] },
          'leg.R': { rotate: [-2 * wind + 18 * smash, 0, 0] },
          'foot.L': { rotate: [18 * smash, 0, 0] },
          'foot.R': { rotate: [-10 * smash, 0, 0] },
        };
      },
    });

    // attack2: an overhead rune strike. He raises the hammer high beside his head (clear of it), the
    // runes charge and glow, then he drives it forward and down in front; the runes flare at the
    // impact and settle.
    k.animation('attack2', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0.04, 0.4, p) * (1 - ease(0.46, 0.56, p));
        const strike = ease(0.48, 0.6, p) * (1 - ease(0.72, 1, p));
        const charge = 0.6 * ease(0.2, 0.42, p) * (1 - ease(0.5, 0.58, p));
        const hitFlare = ease(0.55, 0.6, p) * (1 - ease(0.62, 0.92, p));
        const wristKeys = [
          [0, WRIST_R],
          [0.16, [-0.28, 0.44, 0.04]],
          [0.34, [-0.27, 0.53, -0.03]],
          [0.46, [-0.27, 0.53, -0.05]],
          [0.54, [-0.27, 0.46, 0.09]],
          [0.6, [-0.265, 0.38, 0.16]],
          [0.72, [-0.265, 0.38, 0.16]],
          [1, WRIST_R],
        ] as const;
        const dirKeys = [
          [0, HAFT_AXIS],
          [0.16, norm([-0.3, 0.95, 0.1])],
          [0.34, norm([-0.25, 1, 0.05])],
          [0.46, norm([-0.2, 1, -0.15])],
          [0.54, norm([-0.1, 0.8, 0.55])],
          [0.6, norm([0, 0.35, 0.94])],
          [0.72, norm([0, 0.4, 0.92])],
          [1, HAFT_AXIS],
        ] as const;
        const upKeys = [
          [0, [0, 0, 1]],
          [0.3, [-1, 0, 0.1]],
          [0.72, [-1, 0, 0.1]],
          [1, [0, 0, 1]],
        ] as const;
        return {
          ...hammerPose(keys(p, wristKeys, 'spline'), keys(p, dirKeys, 'spline'), keys(p, upKeys)),
          ...armPose(keys(p, [[0, WRIST_L], [0.3, [0.29, 0.3, 0.0]], [0.5, [0.29, 0.3, 0.0]], [0.62, [0.235, 0.27, 0.09]], [1, WRIST_L]] as const)),
          ...flareScale(Math.max(charge, hitFlare)),
          hips: {
            move: [0, -legDrop(LEG, 16 * strike) - 0.01 * strike, 0.03 * strike - 0.008 * wind],
            rotate: [0, -8 * wind + 8 * strike, 0],
          },
          spine: { rotate: [-5 * wind + 15 * strike, 0, 0] },
          chest: { rotate: [-4 * wind + 8 * strike, -14 * wind + 10 * strike, 0] },
          head: { rotate: [6 * wind - 10 * strike, 8 * wind - 8 * strike, 0] },
          'leg.L': { rotate: [2 * wind - 20 * strike, 0, 0] },
          'leg.R': { rotate: [-2 * wind + 14 * strike, 0, 0] },
          'foot.L': { rotate: [14 * strike, 0, 0] },
          'foot.R': { rotate: [-8 * strike, 0, 0] },
        };
      },
    });

    // hit: the head and chest snap back from a blow, a small step back, a quick return. The
    // hammer swings out to the side, away from the head.
    k.animation('hit', {
      duration: 0.42,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        return {
          hips: { move: [0, -0.006 * h, -0.025 * h], rotate: [0, 6 * h, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, -3 * h] },
          head: { rotate: [-14 * h, -8 * h, 4 * h] },
          ...hammerPose(lerp(WRIST_R, [-0.3, 0.34, 0.05], h), lerp(HAFT_AXIS, norm([-0.5, 0.85, -0.1]), h), [0, 0, 1]),
          'upperarm.L': { rotate: [-6 * h, 0, 16 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger back, the knees give, and he falls flat on his back. Both arms fling out
    // to the sides as he lands; the hammer ends on the ground beside his right shoulder, pointing
    // away from his head, the fist beside his left.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.16)));
        const fling = ease(0.2, 0.62, p);
        // The hammer tips forward out of his grip and comes down along his right side. It lands
        // flat: the haft points to his feet and slopes down a little from the fist, and the
        // head on one side with a cross face up. The keys are in the chest's rest frame; lying
        // down, that frame is turned 84 degrees back, so chest +Z is world up.
        const hammerArm = hammerPose(
          keys(p, [[0, WRIST_R], [0.3, [-0.29, 0.34, 0.1]], [0.66, [-0.305, 0.34, -0.11]]] as const),
          keys(
            p,
            [
              [0, HAFT_AXIS],
              [0.3, norm([-0.3, 0.75, 0.6])],
              [0.5, norm([-0.2, -0.2, 0.96])],
              [0.66, norm([-0.05, -0.997, 0.06])],
            ] as const,
          ),
          keys(p, [[0, [0, 0, 1]], [0.3, [-1, 0, 0]], [0.5, [-1, 0, 0]], [0.66, [0, 0.1045, 0.9945]]] as const),
          [-0.3, 0.2, -0.4],
        );
        const leftArm = armPose(lerp(WRIST_L, [0.3, 0.33, -0.05], fling), [0.3, 0.2, -0.4]);
        return {
          ...hammerArm,
          ...leftArm,
          hips: {
            move: [0, -0.034 * fall * fall + 0.02 * bump(fall) + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall],
            rotate: [-86 * fall - 4 * stagger, 0, 0],
          },
          spine: { rotate: [-6 * stagger + 2 * fall, 0, 0] },
          chest: { rotate: [-4 * stagger, 0, 0] },
          neck: { rotate: [4 * fall, 0, 0] },
          head: { rotate: [-16 * stagger + 6 * fall, 18 * fall, 0] },
          // The legs lag the fall (they stay under him), then lie out along the ground.
          'leg.L': { rotate: [6 * stagger + 16 * bump(fall) + 22 * fall, 0, 5 * fall] },
          'leg.R': { rotate: [-6 * stagger + 18 * bump(fall) + 24 * fall, 0, -6 * fall] },
          'foot.L': { rotate: [-12 * fall, 0, 0] },
          'foot.R': { rotate: [-16 * fall, 0, 0] },
        };
      },
    });

    // victory: a jump on both knees. He crouches (both feet flat), pushes off, and at the top of the
    // jump thrusts the hammer up beside his head (out on the right, never over it); the left fist stays
    // at his side. He lands on both feet, the knees absorb it, he stands up, and pumps the fist twice.
    // The hips' height is a cubic Hermite curve through knots [phase, meters, slope per phase]: the
    // flight is an exact parabola (peak JUMP, FLY phases long), and the ground parts build the
    // take-off speed out of the crouch and carry the landing speed into the absorb.
    const JUMP = 0.095;
    const FLY = 0.17;
    const OFF = 0.2; // the take-off
    const TOP = OFF + FLY / 2;
    const LAND = OFF + FLY;
    const V = (4 * JUMP) / FLY;
    const VICTORY_Y: readonly (readonly [number, number, number])[] = [
      [0, 0, 0],
      [0.13, -0.04, 0], // the crouch: the hips down 4 cm, the knees bent, both feet flat
      [OFF, 0, V], // the push-off: the legs straight, the feet leave the ground
      [TOP, JUMP, 0], // the top of the jump
      [LAND, 0, -V], // both feet land
      [LAND + 0.07, -0.035, 0], // the knees absorb it
      [LAND + 0.21, 0, 0], // he stands up
    ];
    const victoryY = (p: number) => {
      const last = VICTORY_Y[VICTORY_Y.length - 1]!;
      if (p <= 0 || p >= last[0]) return 0;
      let i = 0;
      while (p > VICTORY_Y[i + 1]![0]) i++;
      const [t0, y0, m0] = VICTORY_Y[i]!;
      const [t1, y1, m1] = VICTORY_Y[i + 1]!;
      const s = t1 - t0;
      const u = (p - t0) / s;
      const u2 = u * u;
      const u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * m0 * s + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * m1 * s;
    };
    /**
     * One leg, solved by its ankle's target in the hips' rest frame (`lift` above the rest ankle,
     * `back` behind it). reach bends the knee forward, and the foot gets the opposite turn (plus
     * `pitch`, toe down) so the sole stays level.
     */
    const legTo = (right: boolean, lift: number, back: number, pitch: number) => {
      const f = (v: V3) => (right ? mx(v) : v);
      const leg = reach({ root: f(HIP), mid: f(KNEE), end: f(ANKLE) }, f(add(ANKLE, [0, lift, -back])), f([HIP[0] + 0.02, KNEE[1], 0.3]));
      const foot = motion.euler(motion.quat(leg.upper).multiply(motion.quat(leg.lower)).invert().multiply(motion.quat([pitch, 0, 0])));
      return { leg: leg.upper, shin: leg.lower, foot };
    };
    k.animation('victory', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const up = ease(0.08, TOP, p); // the thrust: the hammer is highest at the top of the jump
        const pump = bump(Math.min(1, Math.max(0, (p - 0.5) / 0.46)), 2);
        const hipsY = victoryY(p) - 0.006 * pump;
        const crouch = Math.max(0, -hipsY) / 0.04; // 1 in the deep crouch
        const air = Math.max(0, hipsY) / JUMP; // 1 at the top of the jump
        const absorb = p > LAND ? crouch : 0;
        // In the air the knees tuck a little (the ankles up and back) and the toes point down.
        const tuck = p > OFF && p < LAND ? Math.sin((Math.PI * (p - OFF)) / FLY) : 0;
        const lift = Math.max(0, -hipsY) + 0.016 * tuck;
        const legsL = legTo(false, lift, 0.01 * tuck, 16 * tuck);
        const legsR = legTo(true, lift, 0.01 * tuck, 14 * tuck);
        // The right arm reaches out to the side, so the bracer and the hammer stay clear of the mane
        // and the hair.
        const wrist: V3 = [-0.36 - 0.02 * pump, 0.49 + 0.03 * pump, 0.06 + 0.02 * pump];
        // In the crouch he pulls the fist up to his chest (the hammer's butt stays off the floor).
        const load = p < OFF ? crouch : 0;
        return {
          ...hammerPose(add(lerp(WRIST_R, wrist, up), [0, 0.065 * load, -0.01 * load]), lerp(HAFT_AXIS, norm([-0.32, 1, 0.16 - 0.1 * pump]), up), [0, 0, 1]),
          ...armPose(lerp(WRIST_L, [0.25, 0.27, 0.09], up)),
          ...flareScale(Math.sin(Math.PI * Math.min(1, Math.max(0, (p - OFF) / (FLY + 0.3))))),
          hips: { move: [0, hipsY, 0] },
          spine: { rotate: [5 * crouch - 5 * up, 0, 0] },
          chest: { rotate: [-4 * up - 3 * pump, -6 * up, 0] },
          head: { rotate: [-10 * up - 4 * crouch, -4 * up, 0] },
          'leg.L': { rotate: legsL.leg },
          'shin.L': { rotate: legsL.shin },
          'foot.L': { rotate: legsL.foot },
          'leg.R': { rotate: legsR.leg },
          'shin.R': { rotate: legsR.shin },
          'foot.R': { rotate: legsR.foot },
        };
      },
    });
  },
});
