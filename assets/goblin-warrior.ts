import { defineAsset, motion, profile, rgb, sdf } from '../src/index.js';

/**
 * Goblin warrior — Chibi Quest enemy (catalog `enemies/humanoid/goblin-warrior`), about 0.93 m
 * to the tip of its hair tuft, faces +Z. Target: the four-view turnaround in
 * reference-designs/chibi-goblin-warrior-20260925/ (front, three-quarter, left side, back).
 *
 * Role: the first common enemy, seen in 3D and as a 128 px sprite; the ears and the grin read.
 * One idea: a big round green head with huge swept-back leaf ears, a sly toothy grin, and one
 *   chunky dagger held up; the ears are the silhouette.
 * Proportions (from the turnaround, on the rogue's body): head center 0.7, eyes 0.655, chin 0.51,
 *   ear tips 0.37 out and 0.82 high, shoulders 0.45, belt 0.28, tunic hem 0.18, boot cuffs 0.12.
 * Shape language: round (head, cheeks, fists, big boots) with sharp points for menace (ears,
 *   tuft, fang, dagger, jagged hem).
 * Palette (60/30/10): olive-green skin #b8ba4e; browns (tunic #86573a, leather #965d31, pouch
 *   #c98c42, boots #86593b); a red-orange scarf #de6233 as the accent under the face;
 *   blue-grey steel #7e8a9d on one shoulder; cream wraps #e4c496.
 * Value plan: the light eye whites and dark brows are the strongest contrast (focal point); the
 *   scarf is the strongest color; the dark pants and boots ground the figure.
 * Identity cues kept from the design: a nicked left ear, one left shoulder guard, a diagonal
 *   strap (left shoulder to right hip), a pouch on the left hip, wrapped forearms, boots, and a
 *   short dagger in the right hand.
 * Bodies: skin, teeth, tunic, scarf, leather, pouch, brass, pauldron, pauldron-rim, wraps,
 *   pants, boots, blade, hilt.
 * Rig: the rogue's chibi skeleton plus `ear.L`/`ear.R` and `knot` (scarf tails); the dagger is
 *   rigid on `hand.R`. Clips: idle, walk, run, attack.
 */

const C = {
  skin: '#a0a446',
  skinDark: '#868a3a',
  earInner: '#7f8436',
  blush: '#d9b048',
  eyeWhite: '#f7f1e6',
  iris: '#5e2812',
  irisLow: '#c4682a',
  pupil: '#1a1416',
  lid: '#1d1a22',
  brow: '#392e2a',
  mouth: '#3a2418',
  tooth: '#f4ecd8',
  tunic: '#86573a',
  tunicDark: '#6a432c',
  scarf: '#de6233',
  scarfDark: '#b84a22',
  leather: '#965d31',
  leatherDark: '#6e4224',
  pouch: '#c98c42',
  brass: '#d0a052',
  steel: '#7e8a9d',
  steelLight: '#a4afbf',
  wrap: '#e4c496',
  wrapDark: '#c9a878',
  pants: '#4f3a30',
  boot: '#86593b',
  cuff: '#c28c50',
  sole: '#4a2e1e',
  blade: '#ece6de',
  bladeDark: '#c6c0bc',
  wood: '#8a5a36',
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

// Joints. The left arm hangs relaxed; the right arm holds the dagger up in front of the body.
const SHOULDER: V3 = [0.14, 0.405, 0];
const ELBOW: V3 = [0.2, 0.335, 0.01];
const WRIST: V3 = [0.222, 0.262, 0.03];
const ELBOW_R: V3 = [-0.2, 0.335, 0.03];
const WRIST_R: V3 = [-0.232, 0.292, 0.1];
const HIP: V3 = [0.075, 0.2, 0];
const ANKLE: V3 = [0.108, 0.075, 0];
// The dagger: its grip axis points up, out, and forward; the guard sits just above the fist.
const DAGGER_TILT = { z: 24, x: 19 };
const GRIP_DIR = norm([-0.406, 0.862, 0.304]);
const FIST_R = add(WRIST_R, norm([WRIST_R[0] - ELBOW_R[0], WRIST_R[1] - ELBOW_R[1], WRIST_R[2] - ELBOW_R[2]]), 0.04);
const GUARD = add(FIST_R, GRIP_DIR, 0.048);
const daggerPose = (s: sdf.Shape) => s.rotateZ(DAGGER_TILT.z).rotateX(DAGGER_TILT.x).at(...GUARD);

/** A relaxed fist hanging from the wrist `w`. */
const fistAt = (w: V3) =>
  sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.046, 0.05, 0.05]).at(w[0] + 0.008, w[1] - 0.044, w[2] + 0.004),
    sdf.capsule([w[0] - 0.01, w[1] - 0.068, w[2] + 0.034], [w[0] - 0.006, w[1] - 0.044, w[2] + 0.05], 0.02),
    sdf.cone([w[0] + 0.024, w[1] - 0.026, w[2] + 0.029], [w[0] + 0.001, w[1] - 0.038, w[2] + 0.056], 0.019, 0.015),
  );

export default defineAsset({
  name: 'goblin-warrior',
  description: 'Chibi goblin warrior enemy with huge leaf ears, a toothy grin, a red scarf, one shoulder guard, and a dagger.',
  detail: 0.005,
  reference: 'reference-designs/chibi-goblin-warrior-20260925/chibi-goblin-warrior-turnaround.png',

  build(k) {
    const EAR: V3 = [0.165, 0.7, -0.01];
    const KNOT: V3 = [-0.075, 0.468, -0.112];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.27, 0] },
      chest: { parent: 'spine', at: [0, 0.35, 0] },
      neck: { parent: 'chest', at: [0, 0.46, -0.01] },
      head: { parent: 'neck', at: [0, 0.51, -0.01] },
      'ear.L': { parent: 'head', at: EAR, tail: [0.37, 0.82, -0.15] },
      'ear.R': { parent: 'head', at: mx(EAR), tail: [-0.37, 0.82, -0.15] },
      knot: { parent: 'chest', at: KNOT, tail: [-0.15, 0.42, -0.16] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head, ears, tuft
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
    const nose = sdf.ellipsoid([0.037, 0.027, 0.029]).at(0, 0.6, faceZ(0, 0.6) - 0.006).bone('head');

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
    const earPose = (s: sdf.Shape) => s.scale(1.06).rotateY(41).at(...EAR);
    // Two small V nicks in the lower edge of the left ear, near the tip.
    const nick = (x: number, y: number, a: number) =>
      sdf
        .extrude(
          profile.polygon([
            [0, 0.012],
            [0.013, -0.02],
            [-0.013, -0.02],
          ]),
          0.1,
        )
        .rotateZ(a)
        .at(x, y, 0);
    const nicks = earPose(sdf.union(nick(0.2, 0.052, 140), nick(0.16, 0.012, 135)));
    const ears = pair(earPose(earLocal.paintWhere(earCup.round(0.004), C.earInner, 0.008)).bone('ear.L')).subtract(nicks);

    // A small flame-shaped tuft of hair on the crown, swept back.
    const tuft = sdf.smoothUnion(
      0.015,
      sdf.chain(
        [
          [0.0, 0.83, 0.03, 0.052],
          [0.028, 0.888, 0.0, 0.036],
          [0.058, 0.912, -0.035, 0.02],
        ],
        0.01,
      ),
      sdf.chain(
        [
          [0.04, 0.83, 0.0, 0.042],
          [0.078, 0.87, -0.03, 0.028],
          [0.105, 0.878, -0.065, 0.016],
        ],
        0.01,
      ),
      sdf.chain(
        [
          [-0.035, 0.83, 0.01, 0.042],
          [-0.055, 0.87, -0.02, 0.026],
          [-0.066, 0.884, -0.05, 0.016],
        ],
        0.01,
      ),
    );
    const neck = sdf.capsule([0, 0.44, -0.01], [0, 0.55, -0.01], 0.056).bone('neck');

    // Arms: bare green upper arms, forearms under wraps, big fists.
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.046, 0.04).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.04, 0.036).bone('forearm.L'),
      fistAt(WRIST).bone('hand.L'),
    );
    const fistR = daggerPose(
      sdf.smoothUnion(
        0.018,
        sdf.ellipsoid([0.046, 0.052, 0.048]).at(0, -0.046, 0),
        sdf.capsule([0.02, -0.075, 0.03], [0.022, -0.02, 0.032], 0.02), // curled fingers
        sdf.cone([-0.03, -0.02, 0.02], [0.01, -0.006, 0.034], 0.019, 0.014), // thumb over the fingers
      ),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.046, 0.04).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.04, 0.036).bone('forearm.R'),
      fistR.bone('hand.R'),
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
    // One light for the whole face: both highlights up and to the +X side of the pupil.
    const shine = sdf.union(
      ...[IRIS_X, -IRIS_X].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.012, EYE[1] + 0.012),
        at(sdf.sphere(0.006), x - 0.012, EYE[1] - 0.026),
      ]),
    );
    // Thick angry brows: the inner ends dip toward the nose.
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.162, 0.756],
              [0.125, 0.764],
              [0.088, 0.746],
              [0.056, 0.72],
              [0.06, 0.704],
              [0.092, 0.722],
              [0.128, 0.74],
              [0.16, 0.744],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    const MOUTH_R = 0.135;
    const mouth = sdf.extrude(profile.arc(MOUTH_R, 0.008, 231, 309), 0.3).at(0, 0.542 + MOUTH_R, 0.1);
    const blush = pair(at(sdf.ellipsoid([0.03, 0.018, 0.07]), 0.152, 0.582));
    const noseFront = sdf.raycast(nose, [0, 0.59, 1], [0, 0, -1])![2];
    const nostrils = pair(sdf.sphere(0.0075).at(0.016, 0.581, noseFront - 0.012));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, tuft.bone('head'))
      .smoothUnion(0.02, ears)
      .union(armL, armR)
      .paintWhere(blush, C.blush, 0.018)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.014)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lowLid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(mouth, C.mouth)
      .paintWhere(nostrils, C.skinDark, 0.004);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // One upper fang hangs over the lip at the left corner of the grin.
    const FANG_X = 0.064;
    const fangTop = faceZ(FANG_X, 0.566);
    const fang = sdf
      .cone([0, 0, 0], [0.001, -0.024, 0.004], 0.014, 0.006)
      .scale([1, 1, 0.7])
      .at(FANG_X, 0.567, fangTop - 0.002);
    k.body('teeth', fang.bone('head'), { color: C.tooth, roughness: 0.35, detail: 0.003 });

    // ------------------------------------------------------------------ tunic (sleeveless, jagged hem)
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
            [0.156, 0.22],
            [0.166, 0.19],
            [0.158, 0.172],
            [0, 0.172],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    // V notches cut through the hem; each cutter passes through the middle and cuts both sides.
    const notch = (angle: number, top: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-0.03, 0.14],
            [0.03, 0.14],
            [0, top],
          ]),
          0.5,
        )
        .rotateY(angle);
    const hem = sdf.union(...[0, 30, 60, 90, 120, 150].map((a, i) => notch(a + 8, 0.204 + 0.012 * ((i * 7) % 3))));
    const tunic = torso.subtract(hem);
    k.body('tunic', tunic.bone('spine'), { color: C.tunic, roughness: 0.85 });

    // ------------------------------------------------------------------ scarf with a knot at the back
    const scarfRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.055, 0.532],
            [0.105, 0.526],
            [0.146, 0.5],
            [0.158, 0.47],
            [0.136, 0.452],
            [0.09, 0.474],
            [0.055, 0.49],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    const scarfTip = torso
      .round(0.013)
      .subtract(torso.round(-0.002))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.13, 0.5],
              [0.13, 0.5],
              [0.02, 0.408],
              [0, 0.388],
              [-0.02, 0.408],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    const scarfKnot = sdf.ellipsoid([0.03, 0.026, 0.024]).at(...KNOT);
    // Two flat tails flare out from the knot like a bow: one out and up, one out and down.
    const tail = (dx: number, dy: number) =>
      sdf
        .chain(
          [
            [0, 0, 0, 0.018],
            [dx * 0.55, dy * 0.55, 0, 0.03],
            [dx, dy, 0, 0.012],
          ],
          0.01,
        )
        .scale([1, 1, 0.38])
        .rotateY(-20)
        .at(KNOT[0], KNOT[1], KNOT[2] - 0.012);
    const scarfTails = sdf.union(tail(-0.095, 0.035), tail(-0.07, -0.075));
    const scarf = sdf.smoothUnion(0.012, scarfRing.bone('chest'), scarfTip.bone('chest'), scarfKnot.bone('chest'), scarfTails.bone('knot'));
    k.body('scarf', scarf, { color: C.scarf, roughness: 0.8 });

    // ------------------------------------------------------------------ leather: belt and strap
    const beltY = 0.28;
    const belt = torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    const strap = torso.round(0.009).smoothIntersect(0.005, sdf.box([0.7, 0.034, 0.7], 0.005).rotateZ(34).at(0, 0.385, 0));
    k.body('leather', sdf.union(belt, strap).bone('spine'), { color: C.leather, roughness: 0.6 });

    // The pouch on the left hip.
    const pouchAt = sdf.surfacePoint(belt, [0.1, beltY - 0.02, 0.16], 0);
    const pouchPose = (s: sdf.Shape) => s.rotateY(30).at(pouchAt[0] + 0.014, pouchAt[1] - 0.026, pouchAt[2] + 0.012);
    const pouchLocal = sdf.smoothUnion(
      0.004,
      sdf.box([0.082, 0.084, 0.04], 0.016),
      sdf.box([0.088, 0.036, 0.046], 0.012).at(0, 0.03, 0.002).paint(C.leather),
    );
    k.body('pouch', pouchPose(pouchLocal).bone('spine'), { color: C.pouch, roughness: 0.65 });

    // ------------------------------------------------------------------ brass: belt buckle, strap clasp, pouch button, rivets
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.062, 0.05, 0.014], 0.007).subtract(sdf.box([0.034, 0.024, 0.03], 0.005)),
        sdf.box([0.008, 0.03, 0.01], 0.003).at(0.002, 0, 0.004),
      )
      .at(0, beltY, beltZ + 0.004);
    const strapAt = sdf.surfacePoint(strap, [0, 0.385, 0.2], 0.002);
    const clasp = sdf
      .box([0.042, 0.042, 0.012], 0.005)
      .subtract(sdf.box([0.02, 0.02, 0.03], 0.003))
      .rotateZ(45)
      .at(...strapAt);
    const button = pouchPose(sdf.sphere(0.01).at(0, 0.014, 0.024));
    const brass = sdf.union(buckle, clasp, button).bone('spine');

    // ------------------------------------------------------------------ shoulder guard (left only)
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.08 * s, 0.056 * s, 0.078 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.012 * s))
        .round(0.003);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-28).at(0.158, 0.44, 0);
    const pauldron = pauldronPose(sdf.union(lame(1), lame(1.14).at(0, -0.03, 0))).bone('upperarm.L');
    k.body('pauldron', pauldron, { color: C.steel, roughness: 0.45, metalness: 0.75 });
    // A lighter rolled edge on each lame, and one big rivet on the outer face.
    const edge = (s: number, y: number) =>
      lame(s)
        .round(0.003)
        .smoothIntersect(0.004, sdf.box([0.4, 0.014, 0.4]).at(0, -0.006 * s, 0))
        .at(0, y, 0);
    const pauldronRim = pauldronPose(sdf.union(edge(1, 0), edge(1.14, -0.03))).bone('upperarm.L');
    k.body('pauldron-rim', pauldronRim, { color: C.steelLight, roughness: 0.4, metalness: 0.75 });
    const rivetAt = sdf.surfacePoint(pauldron, [0.2, 0.47, 0.08], 0);
    const rivet = sdf.sphere(0.013).at(...rivetAt).bone('upperarm.L');
    k.body('brass', sdf.union(brass, rivet), { color: C.brass, roughness: 0.4, metalness: 0.7 });

    // ------------------------------------------------------------------ forearm wraps
    const wrapsFor = (e: V3, w: V3) =>
      sdf.union(
        ...[0.25, 0.5, 0.75].map((t, i) =>
          sdf.cone(lerp(e, w, t - 0.14), lerp(e, w, t + 0.14), 0.047 - i * 0.001, 0.046 - i * 0.001).round(0.002),
        ),
      );
    // Darker lines where the bands overlap, slanted a little like a real wrap.
    const bandLines = (e: V3, w: V3) => {
      const d = norm([w[0] - e[0], w[1] - e[1], w[2] - e[2]]);
      const len = Math.hypot(w[0] - e[0], w[1] - e[1], w[2] - e[2]);
      return (x: number, y: number, z: number) => {
        const t = ((x - e[0]) * d[0] + (y - e[1]) * d[1] + (z - e[2]) * d[2]) / len + 0.03 * Math.sin(Math.atan2(z - e[2], x - e[0]));
        return [0.375, 0.625].some((b) => Math.abs(t - b) < 0.045);
      };
    };
    const linesL = bandLines(ELBOW, WRIST);
    const linesR = bandLines(ELBOW_R, WRIST_R);
    const wrapDark = rgb(C.wrapDark);
    const wraps = sdf
      .union(wrapsFor(ELBOW, WRIST).bone('forearm.L'), wrapsFor(ELBOW_R, WRIST_R).bone('forearm.R'))
      .paintFn((x, y, z, base) => ((x > 0 ? linesL(x, y, z) : linesR(x, y, z)) ? wrapDark : base));
    k.body('wraps', wraps, { color: C.wrap, roughness: 0.9 });

    // ------------------------------------------------------------------ pants and boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.12, 0.055, 0.09]).at(0, 0.21, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0], 0.11, 0.004], 0.052).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });

    // A big round boot built at the ankle's ground point, then turned out.
    const bootFoot = sdf
      .smoothUnion(
        0.04,
        sdf.cylinder(0.062, 0.1, 0.02).at(0, 0.06, -0.01),
        sdf.ellipsoid([0.078, 0.064, 0.13]).at(0, 0.058, 0.035),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cylinder(0.072, 0.04, 0.014).at(0, 0.106, -0.01);
    const boot = sdf
      .union(bootFoot, sole.paint(C.sole), bootCuff.paint(C.cuff))
      .rotateY(16)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the dagger in the right hand
    // Local frame: the guard at the origin, the blade up (+Y), the flat of the blade facing +Z.
    const bladeOutline = profile.polygon(
      [
        [-0.03, 0.008],
        [0.03, 0.008],
        [0.034, 0.1],
        [0, 0.19],
        [-0.034, 0.1],
      ],
      { smooth: false },
    );
    const T = 0.008; // half thickness at the ridge
    const W = 0.034; // half width where the bevels meet the edge
    const bevel = (sx: number, sz: number) => sdf.halfSpace(norm([sx * T, 0, sz * W]), (T * W) / Math.hypot(T, W));
    const bladeLocal = sdf
      .extrude(bladeOutline, 0.03)
      .intersect(bevel(1, 1))
      .intersect(bevel(-1, 1))
      .intersect(bevel(1, -1))
      .intersect(bevel(-1, -1))
      .round(0.0015)
      .paintWhere(sdf.halfSpace([1, 0, 0], 0), C.bladeDark);
    k.body('blade', daggerPose(bladeLocal), { color: C.blade, roughness: 0.35, metalness: 0.55, detail: 0.003, bone: 'hand.R' });
    const hiltLocal = sdf.union(
      sdf.cylinder(0.03, 0.014, 0.006).at(0, 0.002, 0), // round guard
      sdf.capsule([0, -0.1, 0], [0, 0, 0], 0.012), // grip, mostly inside the fist
      sdf.sphere(0.017).at(0, -0.108, 0), // pommel
    );
    k.body('hilt', daggerPose(hiltLocal), { color: C.wood, roughness: 0.7, bone: 'hand.R' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'ear.L': { rotate: [0, 0, 4 * wave(p, 1, 0.35)] },
        'ear.R': { rotate: [0, 0, -4 * wave(p, 1, 0.35)] },
        knot: { rotate: [3 * wave(p, 1, 0.3), 0, 3 * wave(p, 1, 0.2)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: {
            move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0] as const,
            rotate: [0, 7 * s, 0] as const,
          },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The ears flap and the scarf tails bounce twice per cycle, a little after the steps.
          'ear.L': { rotate: [0, lean * 0.8 + 3 * wave(p, 2, 0.2), 7 * wave(p, 2, 0.15)] as const },
          'ear.R': { rotate: [0, -lean * 0.8 - 3 * wave(p, 2, 0.2), -7 * wave(p, 2, 0.15)] as const },
          knot: { rotate: [lean * 1.5 + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.5 * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 28, 3, 0));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03));

    // A quick upward jab: wind up (right shoulder back, fist low), lunge and drive the tip forward
    // and up, hold, then settle back. The wrist turns forward so the tip leads the fist.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.3, p) * (1 - ease(0.3, 0.42, p));
        const hit = ease(0.3, 0.42, p) * (1 - ease(0.55, 1, p));
        const flop = ease(0.36, 0.5, p) * (1 - ease(0.6, 1, p)); // the ears lag behind the strike
        return {
          hips: { move: [0, -legDrop(LEG, 20 * hit) - 0.008 * wind, 0.045 * hit - 0.012 * wind], rotate: [0, -8 * wind + 10 * hit, 0] },
          spine: { rotate: [-4 * wind + 12 * hit, 0, 0] },
          chest: { rotate: [0, -18 * wind + 22 * hit, 0] },
          head: { rotate: [-2 * wind - 6 * hit, 10 * wind - 14 * hit, 0] },
          'ear.L': { rotate: [0, 12 * flop - 4 * wind, 5 * wind - 6 * flop] },
          'ear.R': { rotate: [0, -12 * flop + 4 * wind, -5 * wind + 6 * flop] },
          knot: { rotate: [10 * flop, 0, 6 * flop] },
          'upperarm.R': { rotate: [30 * wind - 85 * hit, 0, -8 * wind + 6 * hit] },
          'forearm.R': { rotate: [-30 * wind + 40 * hit, 0, 0] },
          'hand.R': { rotate: [10 * wind + 55 * hit, 0, 0] },
          'upperarm.L': { rotate: [-12 * wind + 25 * hit, 0, 12 * hit] },
          'forearm.L': { rotate: [-10 * wind - 20 * hit, 0, 0] },
          'leg.R': { rotate: [-20 * hit, 0, 0] },
          'leg.L': { rotate: [14 * hit, 0, 0] },
          'foot.R': { rotate: [12 * hit, 0, 0] },
          'foot.L': { rotate: [-8 * hit, 0, 0] },
        };
      },
    });
  },
});

