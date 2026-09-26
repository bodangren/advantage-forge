import { defineAsset, motion, noise, profile, sdf, THREE } from '../src/index.js';

/**
 * Goblin archer — Chibi Quest enemy (catalog `enemies/humanoid/goblin-archer`), about 0.95 m to
 * the peak of its hood, faces +Z. Target: docs/enemy-mockups/goblin-archer_001.jpg (made with mmx,
 * with the goblin warrior design as the character reference; one front view). Built on the goblin
 * warrior's head, face, body, and skeleton, so the two goblins read as one tribe.
 *
 * Role: a ranged common enemy, seen in 3D and as a 128 px sprite; the hood, ears, and bow read.
 * One idea: a sly goblin peering out of a pointed dark green hood, its huge ears poking out
 *   through slits, with a recurve bow at its side and red-fletched arrows over its shoulder.
 * Proportions: the goblin warrior's (head center 0.7, eyes 0.655, chin 0.51, belt 0.28, hem
 *   0.19); the hood peak rises to 0.95 and the capelet hem sits at 0.36.
 * Shape language: round (head, cheeks, fists, boots) with points for menace (hood peak, ear tips,
 *   dagged capelet hem, fletching, bow tips).
 * Palette (60/30/10): olive-green skin #a0a446; dark hood green #3f4a2e and leather browns
 *   (jerkin #8a5534, straps #5e3820); red fletching #b8302a and orange war paint #d98a3a as the
 *   accents; brass studs and buckles #c8a050.
 * Value plan: the dark hood frames the light face (focal point); the red fletching over the
 *   shoulder is the second accent; the dark pants and boots ground the figure.
 * Bodies: skin, hood, capelet, jerkin, leather, bracers, brass, quiver, arrows, nocked-arrow,
 *   pants, boots, bow, bowstring (two halves).
 * Rig: the warrior's skeleton (ears, no scarf knot); the bow is rigid on `bowgrip`, a child of
 *   `hand.L` that only the death clip moves (the bow drops); the quiver is on `chest`. The string
 *   is in two halves on `string.top` and `string.bot` (children of `bowgrip`), so the draw pulls
 *   its middle back. The shot arrow is on `arrow` (in the right fist); its mesh rests in the
 *   quiver, and every clip but the shot scales it to nothing.
 *   Clips: idle, walk, run, attack (nock, draw, loose), hit, death, taunt (shake the bow high out
 *   to the side, hop from foot to foot twice, pluck the empty string once with a grin; plays when
 *   the goblin first sees the player).
 */

const C = {
  skin: '#a0a446',
  skinDark: '#868a3a',
  earInner: '#7f8436',
  warPaint: '#d98a3a',
  eyeWhite: '#f7f1e6',
  iris: '#5e2812',
  irisLow: '#c4682a',
  pupil: '#1a1416',
  lid: '#1d1a22',
  brow: '#392e2a',
  mouth: '#3a2418',
  hood: '#383d24',
  hoodInside: '#1c2014',
  jerkin: '#8a5534',
  jerkinDark: '#6a3f25',
  leather: '#5e3820',
  bracer: '#8a5a32',
  bracerDark: '#5e3820',
  brass: '#c8a050',
  quiver: '#6e4024',
  quiverDark: '#4a2a18',
  shaft: '#c8a878',
  fletch: '#b8302a',
  pants: '#3e2c26',
  boot: '#7a4a2c',
  cuff: '#8f5f36',
  sole: '#4a2e1e',
  bow: '#7a4a28',
  grip: '#3e2618',
  string: '#e8dcc0',
  arrowhead: '#8a8e94',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.7;
const HEAD = [0.205, 0.168, 0.205] as const;
const EYE = [0.108, 0.655] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const DEG = Math.PI / 180;
const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotYv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) + v[2] * Math.sin(d * DEG), v[1], -v[0] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];

// Joints. The right arm hangs relaxed; the left (bow) arm is held out, so the bow clears the
// capelet, the boot, and the ground.
const SHOULDER: V3 = [0.14, 0.405, 0];
const ELBOW_R: V3 = [-0.2, 0.335, 0.01];
const WRIST_R: V3 = [-0.222, 0.262, 0.03];
const ELBOW_L: V3 = [0.215, 0.35, 0.01];
const WRIST_L: V3 = [0.284, 0.318, 0.05];
const HIP: V3 = [0.075, 0.2, 0];
const ANKLE: V3 = [0.108, 0.075, 0];
const KNEE: V3 = [0.0915, 0.1375, 0]; // the knee: splits the leg (shin.L takes the weight below it)
/** The bow's grip in the left fist: the pivot of the `bowgrip` bone. */
const GRIP: V3 = [WRIST_L[0] + 0.008, WRIST_L[1] - 0.044, WRIST_L[2] + 0.004];
// The recurve bow in the left fist (see bowPose): limb lengths and points of the bow frame in the
// rest pose.
const UPPER = 0.3;
const LOWER = 0.2;
const BOW_TILT = -8;
const bowDir = (d: V3) => rotZv(rotYv(d, 100), BOW_TILT);
const bowPoint = (p: V3) => add(bowDir(p), GRIP);
const NOCK_TOP = bowPoint([0, 0.9 * UPPER, -0.072]);
const NOCK_BOT = bowPoint([0, -0.9 * LOWER, -0.072]);
const NOCK_MID = bowPoint([0, 0.035, -0.072]); // the nocking point, level with the top of the fist
const ARROW_ON_BOW = bowPoint([0, 0.035, 0]); // where the arrow lies on the bow hand
// The quiver's pose on the back (see quiverPose); the shot arrow rests in it: its nock and its
// direction (nock to head).
const quiverDir = (d: V3) => rotZv(rotXv(d, -6), 46);
const quiverPoint = (p: V3) => add(quiverDir(p), [0.07, 0.2, -0.152]);
const ARROW_NOCK = quiverPoint([0, 0.43, 0]);
const ARROW_DIR = quiverDir([0, -1, 0]);
// The right fist's curled fingers, where they hook the string.
const PINCH: V3 = [WRIST_R[0] + 0.008, WRIST_R[1] - 0.053, WRIST_R[2] + 0.045];

/** A fist hanging from the wrist `w`; `s` mirrors it for the right hand. Its grip hole runs along Z. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.046, 0.05, 0.05]).at(...o(0.008, -0.044, 0.004)),
    sdf.capsule(o(-0.01, -0.068, 0.034), o(-0.006, -0.044, 0.05), 0.02),
    sdf.cone(o(0.024, -0.026, 0.029), o(0.001, -0.038, 0.056), 0.019, 0.015),
  );
};

export default defineAsset({
  name: 'goblin-archer',
  description: 'Chibi goblin archer enemy with a pointed dark green hood, ears through slits, war paint, a quiver, and a recurve bow.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/goblin-archer_001.jpg',

  build(k) {
    const EAR: V3 = [0.165, 0.7, -0.01];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.27, 0] },
      chest: { parent: 'spine', at: [0, 0.35, 0] },
      neck: { parent: 'chest', at: [0, 0.46, -0.01] },
      head: { parent: 'neck', at: [0, 0.51, -0.01] },
      'ear.L': { parent: 'head', at: EAR, tail: [0.37, 0.82, -0.15] },
      'ear.R': { parent: 'head', at: mx(EAR), tail: [-0.37, 0.82, -0.15] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      bowgrip: { parent: 'hand.L', at: GRIP },
      // The bowstring in two halves from the nocks, so the draw pulls its middle back.
      'string.top': { parent: 'bowgrip', at: NOCK_TOP },
      'string.bot': { parent: 'bowgrip', at: NOCK_BOT },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      // The shot arrow, in the right hand's fingers; its mesh rests in the quiver.
      arrow: { parent: 'hand.R', at: PINCH },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and ears (the goblin warrior's)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, -0.005),
        pair(sdf.sphere(0.1).at(0.108, 0.605, 0.062)), // full cheeks
        sdf.ellipsoid([0.15, 0.06, 0.1]).at(0, 0.56, 0.05), // broad jaw
        sdf.ellipsoid([0.07, 0.042, 0.05]).at(0, 0.58, 0.12), // a small muzzle under the nose
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    // A wider, flatter snout than the warrior's, with big nostrils.
    const nose = sdf.ellipsoid([0.042, 0.029, 0.03]).at(0, 0.6, faceZ(0, 0.6) - 0.007).bone('head');

    // A flat leaf, drawn outward along +X with the base at the origin; the cup faces +Z.
    const earOutline = profile.polygon(
      [
        [-0.05, 0.105],
        [0.05, 0.11],
        [0.15, 0.113],
        [0.225, 0.112],
        [0.258, 0.1],
        [0.225, 0.07],
        [0.17, 0.015],
        [0.105, -0.05],
        [0.04, -0.1],
        [-0.05, -0.125],
      ],
      { smooth: true, samples: 5 },
    );
    const earCup = sdf.extrude(profile.offsetProfile(earOutline, -0.028), 0.03, 0.01).at(0.012, 0.004, 0.02);
    const earLocal = sdf.extrude(earOutline, 0.028, 0.012).smoothSubtract(0.01, earCup);
    // A little longer than the warrior's ears, because the hood covers their base.
    const earPose = (s: sdf.Shape) => s.scale(1.12).rotateY(41).at(...EAR);
    const ears = pair(earPose(earLocal.paintWhere(earCup.round(0.004), C.earInner, 0.008)).bone('ear.L'));
    const neck = sdf.capsule([0, 0.44, -0.01], [0, 0.55, -0.01], 0.056).bone('neck');

    // Arms: bare green upper arms, forearms under bracers, big fists.
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.046, 0.04).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.04, 0.036).bone('forearm.L'),
      fistAt(WRIST_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.046, 0.04).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.04, 0.036).bone('forearm.R'),
      fistAt(WRIST_R, -1).bone('hand.R'),
    );

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.06, 0.062, 0.07]), EYE[0], EYE[1]));
    // The irises look in toward the nose: a sly, scheming glance.
    const IRIS_X = EYE[0] - 0.015;
    const iris = pair(at(sdf.ellipsoid([0.04, 0.05, 0.07]), IRIS_X, EYE[1] - 0.008));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.02, 0.029, 0.07]), IRIS_X + 0.002, EYE[1] - 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.062, 0.015, 12, 172), 0.3).at(EYE[0], EYE[1] - 0.002, 0.1));
    const lowLid = pair(sdf.extrude(profile.arc(0.061, 0.005, 200, 340), 0.3).at(EYE[0], EYE[1] + 0.001, 0.1));
    const shine = sdf.union(
      ...[IRIS_X, -IRIS_X].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.012, EYE[1] + 0.012),
        at(sdf.sphere(0.006), x - 0.012, EYE[1] - 0.026),
      ]),
    );
    // Heavy brows set low over the eyes: a squinting hunter.
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.165, 0.748],
              [0.125, 0.758],
              [0.088, 0.742],
              [0.054, 0.716],
              [0.058, 0.698],
              [0.092, 0.716],
              [0.128, 0.73],
              [0.162, 0.734],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // A wide, closed, satisfied smile.
    const MOUTH_R = 0.16;
    const mouth = sdf.extrude(profile.arc(MOUTH_R, 0.008, 234, 306), 0.3).at(0, 0.542 + MOUTH_R, 0.1);
    // Two orange war-paint streaks on each cheek, sloping down to the outside.
    const streak = (y: number) =>
      sdf
        .extrude(
          profile.polygon(
            [
              [-0.03, 0.006],
              [0.02, 0.009],
              [0.034, 0.0],
              [0.02, -0.007],
              [-0.03, -0.005],
            ],
            { smooth: true, samples: 3 },
          ),
          0.3,
        )
        .rotateZ(-14)
        .at(0.148, y, 0.1);
    const warPaint = pair(sdf.union(streak(0.595), streak(0.571)));
    const noseFront = sdf.raycast(nose, [0, 0.588, 1], [0, 0, -1])![2];
    const nostrils = pair(sdf.ellipsoid([0.009, 0.007, 0.01]).at(0.018, 0.584, noseFront - 0.012));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .smoothUnion(0.02, ears)
      .union(armL, armR)
      .paintWhere(warPaint, C.warPaint, 0.004)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.014)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lowLid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(mouth, C.mouth)
      .paintWhere(nostrils, C.mouth, 0.003);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hood (pointed; the ears come out through it)
    const hoodOuter = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.24, 0.205, 0.24]).at(0, 0.72, -0.015),
      sdf.ellipsoid([0.25, 0.13, 0.228]).at(0, 0.585, -0.005), // wraps the cheeks and the jaw
      sdf.cone([0, 0.86, -0.03], [0, 0.985, -0.075], 0.1, 0.012), // the peak
    );
    const cavity = sdf.smoothUnion(0.02, head.round(0.014), sdf.ellipsoid([0.216, 0.184, 0.218]).at(0, 0.706, -0.01));
    // An oval window from the forehead to below the chin; the hood edge frames the cheeks.
    const opening = sdf.ellipsoid([0.192, 0.155, 0.4]).at(0, 0.64, 0.3);
    // A thick rolled rim around the face opening.
    const rim = hoodOuter
      .round(0.016)
      .subtract(cavity.round(-0.004))
      .intersect(opening.round(0.035))
      .subtract(opening);
    const hood = sdf
      .smoothUnion(0.012, hoodOuter.subtract(cavity).smoothSubtract(0.02, opening), rim)
      .intersect(sdf.halfSpace([0, -1, 0], -0.47))
      .paintWhere(cavity.round(0.006), C.hoodInside, 0.012);
    k.body('hood', hood, { color: C.hood, roughness: 0.85, bone: 'head' });

    // ------------------------------------------------------------------ capelet (dagged hem, brass studs)
    const capeletSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.505],
            [0.13, 0.484],
            [0.188, 0.444],
            [0.214, 0.396],
            [0.222, 0.356],
            [0.204, 0.352],
            [0.194, 0.392],
            [0.168, 0.436],
            [0.12, 0.466],
            [0.066, 0.482],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86]);
    // V cuts from below make pointed dags; each cutter passes through the middle and cuts two.
    const dag = (angle: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-0.036, 0.33],
            [0.036, 0.33],
            [0, 0.392],
          ]),
          0.6,
        )
        .rotateY(angle);
    const capelet = capeletSolid.subtract(sdf.union(...[0, 36, 72, 108, 144].map((a) => dag(a + 18))));
    k.body('capelet', capelet.bone('chest'), { color: C.hood, roughness: 0.85 });

    // ------------------------------------------------------------------ leather jerkin
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.5],
            [0.06, 0.498],
            [0.1, 0.482],
            [0.128, 0.452],
            [0.138, 0.4],
            [0.136, 0.34],
            [0.133, 0.3],
            [0.142, 0.26],
            [0.152, 0.236],
            [0.156, 0.222],
            [0.148, 0.212],
            [0, 0.212],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const jerkin = torso
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.234), C.jerkinDark) // a darker hem band
      .paintWhere(sdf.extrude(profile.rect([0.008, 0.2], 0.003), 0.4).at(0, 0.36, 0.2), C.jerkinDark, 0.002); // front seam
    k.body('jerkin', jerkin.bone('spine'), { color: C.jerkin, roughness: 0.65 });

    // ------------------------------------------------------------------ straps: belt and the quiver strap
    const beltY = 0.28;
    const belt = torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    // The quiver strap runs from the right shoulder, under the capelet, down to the left hip.
    const strap = torso.round(0.009).smoothIntersect(0.005, sdf.box([0.7, 0.034, 0.7], 0.005).rotateZ(-34).at(0, 0.36, 0));
    k.body('leather', sdf.union(belt, strap).bone('spine'), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ bracers
    const bracer = (e: V3, w: V3) =>
      sdf
        .cone(lerp(e, w, 0.3), lerp(e, w, 1.04), 0.045, 0.056)
        .round(0.003)
        .paintWhere(sdf.sphere(0.05).at(...lerp(e, w, 1.2)), C.bracerDark, 0.004);
    const bracers = sdf.union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(ELBOW_R, WRIST_R).bone('forearm.R'));
    k.body('bracers', bracers, { color: C.bracer, roughness: 0.6 });

    // ------------------------------------------------------------------ brass: belt buckle, strap buckle, capelet studs
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.066, 0.052, 0.014], 0.007).subtract(sdf.box([0.036, 0.026, 0.03], 0.005)),
        sdf.box([0.008, 0.03, 0.01], 0.003).at(0.002, 0, 0.004),
      )
      .at(0, beltY, beltZ + 0.004);
    const strapBuckleAt = sdf.surfacePoint(strap, [-0.045, 0.39, 0.2], 0.002);
    const strapBuckle = sdf
      .box([0.032, 0.038, 0.01], 0.004)
      .subtract(sdf.box([0.016, 0.02, 0.03], 0.002))
      .rotateZ(-34)
      .at(...strapBuckleAt);
    // Studs along the front of the capelet, just above the dags.
    const studs = sdf.union(
      ...[-60, -35, -12, 12, 35, 60].map((a) => {
        const r = (a * Math.PI) / 180;
        const p = sdf.surfacePoint(capelet, [Math.sin(r) * 0.3, 0.378, Math.cos(r) * 0.3], 0.001);
        return sdf.sphere(0.0085).at(...p);
      }),
    );
    k.body('brass', sdf.union(buckle.bone('spine'), strapBuckle.bone('spine'), studs.bone('chest')), {
      color: C.brass,
      roughness: 0.4,
      metalness: 0.7,
    });

    // ------------------------------------------------------------------ quiver and arrows (on the back)
    // Local frame: bottom of the quiver at the origin, the mouth up +Y. The mouth is at the right
    // shoulder, so the fletching shows over it from the front.
    const QUIVER_LEN = 0.25;
    const quiverPose = (s: sdf.Shape) => s.rotateX(-6).rotateZ(46).at(0.07, 0.2, -0.152);
    const tube = sdf.cone([0, 0, 0], [0, QUIVER_LEN, 0], 0.038, 0.048).round(0.004);
    const quiverShape = sdf
      .union(
        tube.subtract(sdf.cylinder(0.042, 0.1).at(0, QUIVER_LEN + 0.04, 0)),
        sdf.torus(0.048, 0.009).at(0, QUIVER_LEN - 0.006, 0).paint(C.quiverDark), // rolled mouth
        sdf.cylinder(0.046, 0.026, 0.008).at(0, 0.12, 0).paint(C.quiverDark), // strap band
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.025), C.quiverDark);
    k.body('quiver', quiverPose(quiverShape).bone('chest'), {
      color: C.quiver,
      roughness: 0.6,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 140, y * 140, z * 140, 2),
    });

    // Five arrows fanned in the mouth; only the shafts and the red fletching show.
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
        return sdf.union(sdf.capsule(base, top, 0.006), f.paint(C.fletch));
      }),
    );
    k.body('arrows', quiverPose(arrows).bone('chest'), { color: C.shaft, roughness: 0.7, detail: 0.004 });
    // The arrow for the shot, in the middle of the quiver (quiver frame: nock up at 0.43, the
    // head down in the tube). Its bone hides it in every clip but the shot.
    const shotArrow = sdf.union(
      sdf.capsule([0, 0.17, 0], [0, 0.43, 0], 0.006),
      sdf.cone([0, 0.176, 0], [0, 0.13, 0], 0.013, 0.002).paint(C.arrowhead),
      fletching.at(0, 0.358, 0).paint(C.fletch),
    );
    k.body('nocked-arrow', quiverPose(shotArrow), { color: C.shaft, roughness: 0.7, detail: 0.0035, bone: 'arrow' });

    // ------------------------------------------------------------------ pants and boots (the warrior's)
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.12, 0.055, 0.09]).at(0, 0.21, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0], 0.11, 0.004], 0.052).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(
        0.04,
        sdf.cylinder(0.062, 0.1, 0.02).at(0, 0.06, -0.01),
        sdf.ellipsoid([0.078, 0.064, 0.13]).at(0, 0.058, 0.035),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    // A slim folded-down cuff with a small pointed flap at the outside.
    const bootCuff = sdf.smoothUnion(
      0.008,
      sdf.cylinder(0.068, 0.026, 0.01).at(0, 0.104, -0.01),
      sdf.cone([0.05, 0.106, -0.01], [0.078, 0.122, -0.012], 0.016, 0.005),
    );
    const boot = sdf
      .union(bootFoot, sole.paint(C.sole), bootCuff.paint(C.cuff))
      .rotateY(16)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ recurve bow in the left hand
    // Local frame: grip at the origin, limbs along Y, the back of the bow toward +Z, the string
    // behind it at -Z. Each limb bends back toward the string, then the tip curls forward.
    const limb = (len: number, sign: 1 | -1) =>
      sdf.chain(
        [
          [0, 0, 0, 0.018],
          [0, 0.22 * len * sign, -0.007, 0.0145],
          [0, 0.48 * len * sign, -0.03, 0.0125],
          [0, 0.72 * len * sign, -0.056, 0.0105],
          [0, 0.88 * len * sign, -0.066, 0.0092],
          [0, 0.97 * len * sign, -0.052, 0.0084],
          [0, 1.02 * len * sign, -0.026, 0.0078],
          [0, 1.03 * len * sign, 0.0, 0.0072],
          [0, 1.015 * len * sign, 0.02, 0.0068],
        ],
        0.01,
      );
    const bowLocal = sdf.union(limb(UPPER, 1), limb(LOWER, -1)).paintWhere(sdf.box([0.1, 0.075, 0.1]), C.grip);
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
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'ear.L': { rotate: [0, 0, 4 * wave(p, 1, 0.35)] },
        'ear.R': { rotate: [0, 0, -4 * wave(p, 1, 0.35)] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
        arrow: { scale: HIDE },
      }),
    });

    // The bow arm swings less than the free arm and lifts out from the body (`lift`, degrees),
    // so the bow tip clears the ground and the boot while the hips drop at each step.
    // The lift also tilts the upper bow limb (above the shoulder) in toward the hood, so the
    // hand turns back by the lift plus `tiltOut` degrees: the bow leans out, clear of the hood.
    // The legs come from motion.gait: planted stance boots, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (the run has a flight between steps), `hop` the hips bob. The left boot
    // strikes at p = 0.25, when the left arm is back and the right arm forward (gait's phase 0 is
    // the left strike). The sole points are the boot's heel and toe on the floor (measured on the
    // boot SDF at y = 0, turned out 16 degrees).
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      armSwing: number,
      lean: number,
      hop: number,
      lift: number,
      tiltOut: number,
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
          heel: [0.097, 0, -0.068],
          toe: [0.128, 0, 0.107],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The ears flap twice per cycle, a little after the steps.
          'ear.L': { rotate: [0, lean * 0.8 + 3 * wave(p, 2, 0.2), 7 * wave(p, 2, 0.15)] as const },
          'ear.R': { rotate: [0, -lean * 0.8 - 3 * wave(p, 2, 0.2), -7 * wave(p, 2, 0.15)] as const },
          'upperarm.L': { rotate: [armSwing * 0.35 * s, 0, lift] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.2, 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          'hand.L': { rotate: [0, 0, -(lift + tiltOut)] as const },
          arrow: { scale: HIDE },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.03, 0.58, 28, 3, 0.008, 10, 8));
    k.animation('run', stride(0.56, 0.15, 0.05, 0.38, 50, 12, 0.035, 16, 6));

    // ------------------------------------------------------------------ attack: a bow shot, solved by targets
    // Plan (in the chest's rest frame): the goblin turns side-on, raises the bow in front, brings
    // the right hand up and nocks the arrow, then pushes the bow out at the target while the right
    // hand draws back along the arrow line to the anchor under the right jaw. A short hold, the
    // release: the string snaps forward, the arrow is gone, the right hand flicks back and out,
    // and the bow arm follows through. Then back to rest.
    // The head and the hood are big and the arms short: the anchor is under the jaw, in front of
    // the hood's hem, and the bow cants its top out to the goblin's right, clear of the eyes.
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
    const ANCHOR: V3 = [-0.022, 0.43, 0.205]; // the pinch at full draw: under the right jaw, below the hood's hem
    const BOW_AT = add(add(ANCHOR, scl(AIM, 0.15)), [0, -0.022, 0]); // the grip at full draw
    const BOW_NOCK = add(BOW_AT, [-0.006, 0, -0.008]); // the grip while the arrow is nocked
    const BOW_REST = { dir: bowDir([0, 1, 0]), up: bowDir([0, 0, 1]) }; // the limbs, the back of the bow
    const CANT = 0.5; // the bow top leans out to the goblin's right by about 27 degrees
    const HAND_R_REST = { dir: norm(sub(WRIST_R, ELBOW_R)), up: [0, 0, 1] as V3 };
    // The draw hand: the forearm rises along the arrow line to the fist, so the thick bracer stays
    // under the hood's hem; the palm faces the neck.
    const HAND_R_DRAW = { dir: norm(add(AIM, [0, 0.45, 0])), up: norm([AIM[2], 0, -AIM[0]]) };
    const OFF_R = sub(PINCH, WRIST_R);
    const OFF_DRAW = turnBy(quat(orient([], HAND_R_REST, HAND_R_DRAW)), OFF_R);
    // Elbow poles: at rest (in the rest bend plane, so the solved arm matches the rest pose) and in the shot.
    const POLE_L_REST: V3 = [0.212, 0.248, -0.162];
    const POLE_L_AIM: V3 = [0.37, 0.24, -0.12];
    const POLE_R_REST: V3 = [-0.37, 0.417, -0.058];
    const POLE_R_DRAW: V3 = [-0.45, 0.4, -0.04];

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
    const bowArm = (grip: V3, want: { dir: V3; up: V3 }, sh: V3, pole: V3) => {
      let wrist = sub(grip, sub(GRIP, WRIST_L));
      let arm = reach(ARM_L, sub(wrist, sh), pole);
      let hand: V3 = Z3;
      for (let i = 0; i < 3; i++) {
        arm = reach(ARM_L, sub(wrist, sh), pole);
        hand = orient([arm.upper, arm.lower], BOW_REST, want);
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
        const drawn = keys(p, [[0.28, 0], [0.46, 1], [RELEASE, 1], [RELEASE + 0.03, 0]] as const);
        const kick = p >= RELEASE ? Math.exp(-(p - RELEASE) * 30) : 0;
        const tremble = p > 0.46 && p < RELEASE ? Math.sin(((p - 0.46) / (RELEASE - 0.46)) * Math.PI * 4) : 0;
        // Shoulders: the bow shoulder pushes toward the target; the string shoulder comes forward
        // a little, so the short arm reaches the string.
        const shL = scl([0, 0.012, 0.06], aim);
        const shR = keys(p, [[0, Z3], [0.22, [0.035, 0.012, 0.045]], [0.46, [0.02, 0.008, 0.04]], [0.8, [0.02, 0.008, 0.04]], [1, Z3]] as const);

        // ---- the bow arm: up in front, the nock, the push at the target, the follow-through, back.
        const bowAt = keys(p, [
          [0, GRIP],
          [0.12, add(GRIP, [0, 0.08, 0.1])],
          [0.22, BOW_NOCK],
          [0.28, BOW_NOCK],
          [0.46, BOW_AT],
          [RELEASE, BOW_AT],
          [RELEASE + 0.06, add(BOW_AT, [0.02, -0.006, 0.03])],
          [0.76, add(BOW_AT, [0.012, -0.014, 0.02])],
          [0.88, add(GRIP, [0.01, 0.07, 0.1])],
          [1, GRIP],
        ] as const);
        // The bow cants its top out to the goblin's right (a roll about the arrow line), so the
        // upper limb passes outside the right eye. After the release the bow tips forward in the
        // open hand.
        const side = norm([-AIM[2], 0, AIM[0]]);
        const lean = norm(add(add([0, 1, 0], scl(side, CANT)), scl(AIM, 0.15 * kick)));
        const r = ease(0, 0.12, p) * (1 - ease(0.86, 1, p));
        const bowWant = { dir: norm(lerp(BOW_REST.dir, lean, r)), up: norm(lerp(BOW_REST.up, AIM, r)) };
        const poleL = keys(p, [[0, POLE_L_REST], [0.2, POLE_L_AIM], [0.8, POLE_L_AIM], [1, POLE_L_REST]] as const);
        const bow = bowArm(bowAt, bowWant, shL, poleL);
        const rotsL = [bow.arm.upper, bow.arm.lower, bow.hand] as const;
        const onBow = (pt: V3) => add(follow(CHAIN_L, rotsL, pt), shL);
        const nockNow = onBow(NOCK_MID);
        const restOnBow = onBow(ARROW_ON_BOW);
        const toBow = norm(sub(restOnBow, nockNow));

        // ---- the string hand: up in front, the nock, the draw to the anchor, the hold, the
        // release flick back and out past the jaw, back to rest.
        const pinchAt = keys(p, [
          [0, PINCH],
          [0.12, [-0.09, 0.35, 0.24]],
          [0.22, nockNow],
          [0.28, nockNow],
          [0.46, ANCHOR],
          [RELEASE, add(ANCHOR, scl(AIM, -0.004))],
          [RELEASE + 0.05, add(ANCHOR, [-0.075, 0.012, -0.01])],
          [0.78, add(ANCHOR, [-0.085, -0.03, -0.01])],
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
        // the middle and stretches along its rest axis to the new length.
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
          hips: { move: [0, -0.003 * turn, 0], rotate: [0, -35 * turn, 0] },
          spine: { rotate: [0, -12 * turn, 0] },
          chest: { rotate: [-2 * aim + 0.4 * tremble - 3 * kick, -8 * turn, 0] },
          // The head turns back to the target and lifts the chin a little over the string.
          neck: { rotate: [0, 15 * turn, 0] },
          head: { rotate: [-4 * aim, 32 * turn, 0] },
          // The ears lie back in the draw and flick at the release.
          'ear.L': { rotate: [0, 12 * kick - 5 * drawn, -6 * drawn + 9 * kick] },
          'ear.R': { rotate: [0, -12 * kick + 5 * drawn, 6 * drawn - 9 * kick] },
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
    // The goblin warrior's hit. The head and the chest snap back and the hips give way: the left
    // foot stays planted and the right foot steps back, then all returns quickly. The bow arm
    // swings a little out and the hand tilts the bow out, clear of the hood. The ears flop late.
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.077; // the back of the boot, behind the ankle's ground point
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
          'ear.L': { rotate: [4 * flop, -10 * flop, 6 * flop] },
          'ear.R': { rotate: [4 * flop, 10 * flop, -6 * flop] },
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
    // The goblin warrior's death. The blow snaps the chest back, the goblin slumps forward and
    // wobbles, then tips back over its heels as one piece and lands on its back (and the quiver).
    // The arms are solved by targets in the chest's rest frame and lie out on the ground. The left
    // hand opens in the fall and the `bowgrip` bone carries the bow to lie flat on the floor beside
    // the left hand, the string out. The ears flop down last.
    const LIE = 84; // the hips' final tilt back, degrees
    const LIE_Y = 0.17; // the hips' height when the goblin lies on its back
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.27, 0], [0, 0.35, 0]]; // hips, spine, chest pivots
    const BOW_CHAIN: readonly V3[] = [...TRUNK, SHOULDER, ELBOW_L, WRIST_L];
    // The bow's rest frame in the world (see `bowPose`): the limbs along local +Y, the flat side
    // along local +X. On the floor the flat side faces up, so the bow lies at its limb radius.
    const BOW_Q = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 0, 1), -8 * DEG)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 100 * DEG));
    const bowAxis = (x: number, y: number, z: number): V3 => {
      const v = new THREE.Vector3(x, y, z).applyQuaternion(BOW_Q);
      return [v.x, v.y, v.z];
    };
    const DROP_AT: V3 = [0.47, 0.021, -0.36]; // the grip on the floor, the upper limb toward the head
    const DROP_TURN = quat(orient([], { dir: bowAxis(0, 1, 0), up: bowAxis(1, 0, 0) }, { dir: norm([0.1, 0, -1]), up: [0, 1, 0] }));
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
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const earUp = keys(p, [[0.36, 0], [0.54, 1], [0.62, 1], [0.7, 0]] as const);
        const earDown = keys(p, [[0.62, 0], [0.72, 1.15], [0.8, 0.92], [0.88, 1]] as const);
        // The stagger: the hips give way backward over planted feet.
        const back = 0.022 * hitB;
        const lean = plant(back);
        // The fall: a rigid tip over the back of the heels, until the hips reach their lying height.
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * Math.min(1, Math.max(0, (tilt - 66) / 18)); // the legs come down once the hips hold
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        // The wrists: flung back by the blow, slumped, flung out in the fall, then out on the ground.
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.27, 0.34, -0.07], land), lerp(ELBOW_R, [-0.25, 0.3, -0.2], land));
        const standL = add(add(add(WRIST_L, [0.03, 0.02, 0.04], hitB), [0, -0.03, 0.02], sag), [0.06, 0.03, 0.06], fly);
        const armL = reach(ARM_L, lerp(standL, [0.29, 0.34, -0.07], land), lerp(ELBOW_L, [0.26, 0.3, -0.2], land));
        // The bow: in the posed hand until the hand opens, then it drops flat to the floor.
        const handQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).multiply(quat(armL.upper)).multiply(quat(armL.lower));
        const held = add(follow(BOW_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, [0, 0, 0]], GRIP), hipsMove);
        const drop = keys(p, [[0.44, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = new THREE.Vector3(...add(lerp(held, drop, loose), held, -1)).applyQuaternion(inv);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 6 * land, -8 * hitB, -6 * wob + 6 * land] },
          'ear.L': { rotate: [0, -6 * hitB - 14 * earUp + 3 * earDown, 5 * wob + 8 * earUp - 8 * earDown] },
          'ear.R': { rotate: [0, 6 * hitB + 14 * earUp - 3 * earDown, -5 * wob - 8 * earUp + 8 * earDown] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          bowgrip: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
          arrow: { scale: HIDE },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: shake the bow, hop, pluck the string
    // Played when the goblin first sees the player. It raises the bow high out to the side and
    // shakes it, the head cocked away from it, and hops from foot to foot twice with the ears
    // flicking. Then it turns the bow side forward, holds the bow up in front as in the shot's nock
    // (see attack), plucks the empty string once with the right hand (the middle pulls back, snaps,
    // and trembles), grins at the player with a tilt of the head, and returns to rest. The arms are
    // solved in the chest's rest frame (bowArm, reach, orient); `plant` keeps the soles on the floor.
    // The shot arrow stays hidden.
    // In the shake the bow turns about its limbs so its back faces out and back and the string lies
    // in front of the limbs, not between the bow and the hood.
    const HIPS_AT: V3 = TRUNK[0]!;
    // Sole points of the left boot (turned out 16 degrees at the ankle's ground point); the right
    // boot mirrors them.
    const c16 = Math.cos(16 * DEG);
    const s16 = Math.sin(16 * DEG);
    const SOLE_L: V3[] = ([[0, 0, -0.068], [0, 0, 0.128], [0.055, 0, 0.02], [-0.05, 0, 0.02]] as const).map(
      ([x, y, z]): V3 => [ANKLE[0] + x * c16 + z * s16, y, -x * s16 + z * c16],
    );
    const SOLE_R: V3[] = SOLE_L.map(mx);
    /** A hop's height, 0 to 1: a parabola from take-off `a` to landing `b` (phases). */
    const hopArc = (p: number, a: number, b: number) => {
      const u = (p - a) / (b - a);
      return u <= 0 || u >= 1 ? 0 : 4 * u * (1 - u);
    };
    type BowWant = { dir: V3; up: V3 };
    const blendWant = (a: BowWant, b: BowWant, t: number): BowWant => ({ dir: norm(lerp(a.dir, b.dir, t)), up: norm(lerp(a.up, b.up, t)) });
    /** The rest bow turned `twist` about the vertical, tilted out `out`, and leaned forward `fwd` degrees (chest frame). */
    const bowWantAt = (twist: number, out: number, fwd: number): BowWant => ({
      dir: rotXv(rotZv(rotYv(BOW_REST.dir, twist), -out), fwd),
      up: rotXv(rotZv(rotYv(BOW_REST.up, twist), -out), fwd),
    });
    const RAISE_AT: V3 = [0.285, 0.485, 0.1]; // the grip high out to the side, level with the chin, in front of the hood
    const SH_UP: V3 = [0.01, 0.025, 0.035]; // the bow shoulder shrugs up and forward
    const POLE_L_UP: V3 = [0.36, 0.33, -0.1]; // the elbow out, down, and back
    const MID_AT: V3 = [0.25, 0.42, 0.2]; // the grip on the way from high to the front
    const BACK_AT = add(GRIP, [0.01, 0.07, 0.1]); // the grip on the way back to rest (as in the attack)
    const SIDE_AIM = norm([-AIM[2], 0, AIM[0]]);
    const LUTE: BowWant = { dir: norm(add([0, 1, 0], scl(SIDE_AIM, CANT))), up: AIM }; // the bow at the nock
    const SH_LUTE_L: V3 = [0, 0.012, 0.06];
    const SH_LUTE_R: V3 = [0.035, 0.012, 0.055];
    // The pluck: the bow a little lower and more forward than the shot's nock, so the right forearm
    // passes under the hood; the right elbow goes out, and the hand comes back out and forward,
    // clear of the jerkin.
    const LUTE_AT = add(BOW_NOCK, [0.005, -0.02, 0.01]);
    const POLE_R_PLUCK: V3 = [-0.5, 0.38, 0.02];
    const PINCH_OUT: V3 = add(PINCH, [-0.03, 0.01, 0.05]); // the free fist a little out and forward in the dance
    const PINCH_BACK: V3 = add(PINCH, [-0.05, 0.04, 0.07]); // the fist on the way back to rest, out and forward
    const PINCH_UP: V3 = [-0.09, 0.35, 0.24]; // the right fist up in front, on the way to the string
    const PULL = 0.028; // how far the fingers pull the string's middle back
    const PLUCK = 0.78; // the release
    const TURN_T = 47; // the body turns this far to its right for the pluck; the head turns back to the player
    k.animation('taunt', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.13, 1]] as const); // rest to the bow held high
        const lower = keys(p, [[0.52, 0], [0.66, 1]] as const); // high to the nock hold
        const back = keys(p, [[0.86, 0], [1, 1]] as const); // to rest
        const turn = keys(p, [[0.52, 0], [0.64, 1], [0.86, 1], [1, 0]] as const);
        const cock = keys(p, [[0.04, 0], [0.16, 1], [0.5, 1], [0.62, 0]] as const); // the head cocked away from the bow
        const env = keys(p, [[0.1, 0], [0.16, 1], [0.48, 1], [0.54, 0]] as const);
        const shake = env * Math.sin((2 * Math.PI * (p - 0.1)) / 0.11);
        // Foot to foot: +1 stands on the left foot with the right foot kicked up, -1 the reverse.
        // The weight changes in the air; the last change is a step down, not a hop.
        const side = keys(p, [[0.14, 0], [0.22, 1], [0.3, 1], [0.38, -1], [0.46, -1], [0.54, 0]] as const);
        const air = 0.05 * (hopArc(p, 0.14, 0.26) + hopArc(p, 0.3, 0.42));
        const land = keys(p, [[0.25, 0], [0.28, 1], [0.32, 0], [0.41, 0], [0.44, 1], [0.48, 0]] as const);
        const flick = env * Math.sin((2 * Math.PI * (p - 0.14)) / 0.16); // one ear flick back and forth per hop
        const onString = keys(p, [[0.5, 0], [0.6, 0.4], [0.67, 1], [0.85, 1], [0.95, 0]] as const);
        const pull = keys(p, [[0.7, 0], [PLUCK, 1]] as const);
        const grin = keys(p, [[0.62, 0], [0.74, 1], [0.9, 1], [1, 0]] as const);
        const snap = keys(p, [[PLUCK, 0], [PLUCK + 0.04, 1], [PLUCK + 0.12, 0]] as const);

        // ---- the legs: the hips tilt up on the side of the free leg, both legs counter it, and the
        // free leg kicks back and out with its sole level. In the pluck the feet turn a little
        // toward the front again (as in the attack's braced stance).
        const liftL = Math.max(0, -side);
        const liftR = Math.max(0, side);
        const hipsR: V3 = [0, -30 * turn, -5 * side];
        const legL: V3 = [38 * liftL - 4 * turn, 21 * turn, 5 * side + 18 * liftL + 4 * turn];
        const legR: V3 = [38 * liftR + 3 * turn, 13 * turn, 5 * side - 18 * liftR - 3 * turn];
        const footL: V3 = [-34 * liftL + 4 * turn, 8 * turn, -4 * turn];
        const footR: V3 = [-34 * liftR - 3 * turn, 7 * turn, 3 * turn];
        const ground = motion.plant([
          { joints: [HIPS_AT, HIP, ANKLE], rotations: [hipsR, legL, footL], sole: SOLE_L },
          { joints: [HIPS_AT, mx(HIP), mx(ANKLE)], rotations: [hipsR, legR, footR], sole: SOLE_R },
        ]);
        const hipsMove: V3 = [0, ground + air, 0];
        // The upper body leans away from the raised bow, and a little back in the grin.
        const spineR: V3 = [3 * land - 3 * grin, -10 * turn, 3 * side + 2 * cock];
        const chestR: V3 = [-2 * cock - 2 * turn, -(TURN_T - 40) * turn, 2 * cock];

        // ---- the bow arm: rest, high out to the side (shaken: a tilt out, a turn, and a bob), up
        // in front at the nock, rest.
        const high = add(RAISE_AT, [0, 0.01 * shake, 0]);
        const gripAt = keys(p, [
          [0, GRIP],
          [0.13, high],
          [0.52, high],
          [0.59, MID_AT],
          [0.66, LUTE_AT],
          [0.86, LUTE_AT],
          [0.93, BACK_AT],
          [1, GRIP],
        ] as const);
        const wantHigh = bowWantAt(33 + 10 * shake, 11 + 5 * shake, 12);
        const want = blendWant(blendWant(blendWant(BOW_REST, wantHigh, raise), LUTE, lower), BOW_REST, back);
        const shL = keys(p, [[0, Z3], [0.13, SH_UP], [0.52, SH_UP], [0.66, SH_LUTE_L], [0.86, SH_LUTE_L], [1, Z3]] as const);
        const poleL = keys(p, [[0, POLE_L_REST], [0.13, POLE_L_UP], [0.52, POLE_L_UP], [0.64, POLE_L_AIM], [0.86, POLE_L_AIM], [1, POLE_L_REST]] as const);
        const bow = bowArm(gripAt, want, shL, poleL);
        const rotsL = [bow.arm.upper, bow.arm.lower, bow.hand] as const;
        const qL = chainQ(rotsL);
        const onBow = (pt: V3) => add(follow(CHAIN_L, rotsL, pt), shL);
        const nockNow = onBow(NOCK_MID);
        const backW = turnBy(qL, BOW_REST.up); // the back of the bow, now

        // ---- the string: the fingers pull its middle back from the bow, let go, and it snaps
        // forward past rest and trembles out. Each half turns from its nock toward the middle and
        // stretches along its rest axis to the new length.
        const give = p < PLUCK ? pull : Math.cos((2 * Math.PI * (p - PLUCK)) / 0.05) * Math.exp(-(p - PLUCK) / 0.03);
        const mid = add(nockNow, backW, -PULL * give);
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

        // ---- the string hand: a little out in the dance, up in front and onto the string, the
        // pull, the release flick out and up, and back to rest out and forward of the jerkin.
        const pulledAt = add(nockNow, backW, -PULL);
        const flickAt = add(pulledAt, [-0.09, 0.02, 0.02]);
        const pinchAt =
          p < 0.67
            ? keys(p, [[0, PINCH], [0.14, PINCH_OUT], [0.5, PINCH_OUT], [0.6, PINCH_UP], [0.67, nockNow]] as const)
            : p < PLUCK
              ? mid
              : keys(p, [[PLUCK, pulledAt], [PLUCK + 0.05, flickAt], [0.85, flickAt], [0.93, PINCH_BACK], [1, PINCH]] as const);
        const shR = keys(p, [[0.5, Z3], [0.6, SH_LUTE_R], [0.85, SH_LUTE_R], [0.97, Z3]] as const);
        const poleR = keys(p, [[0.5, POLE_R_REST], [0.62, POLE_R_PLUCK], [0.9, POLE_R_PLUCK], [1, POLE_R_REST]] as const);
        const wristR = sub(pinchAt, add(scl(OFF_R, 1 - onString), scl(OFF_DRAW, onString)));
        const armR = reach(ARM_R, sub(wristR, shR), poleR);
        const handR = slerpRot(Z3, orient([armR.upper, armR.lower], HAND_R_REST, HAND_R_DRAW), onString);

        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          // The head turns back to the player in the pluck.
          neck: { rotate: [4 * land, 15 * turn, 0] },
          // Cocked away from the bow in the dance; in the pluck the chin up and the head tilted away
          // from the bow, with a little jerk back at the twang: a smug grin at the player.
          head: { rotate: [-3 * cock - 4 * turn - 3 * grin - 4 * snap, (TURN_T - 15) * turn, 9 * cock + 3 * side + 7 * grin] },
          'ear.L': { rotate: [0, 22 * flick, 8 * cock - 6 * land + 8 * flick + 10 * grin] },
          'ear.R': { rotate: [0, -22 * flick, -8 * cock + 6 * land - 8 * flick - 10 * grin] },
          'upperarm.L': { move: shL, rotate: bow.arm.upper },
          'forearm.L': { rotate: bow.arm.lower },
          'hand.L': { rotate: bow.hand },
          'string.top': string(NOCK_TOP),
          'string.bot': string(NOCK_BOT),
          'upperarm.R': { move: shR, rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          arrow: { scale: HIDE },
          'leg.L': { rotate: legL },
          'leg.R': { rotate: legR },
          'foot.L': { rotate: footL },
          'foot.R': { rotate: footR },
        };
      },
    });
  },
});
