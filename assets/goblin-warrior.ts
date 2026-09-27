import { defineAsset, motion, profile, rgb, sdf, Sdf, THREE } from '../src/index.js';

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
 *   fang, dagger, jagged hem); one soft crest of hair leans back on the crown.
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
 *   rigid on `dagger`, a child of `hand.R` that the death clip moves (the dagger drops) and the
 *   taunt turns (one spin in the fingers).
 *   Clips: idle, walk, run, attack, hit, death, taunt (point the dagger at the player, hop from
 *   foot to foot twice, spin the dagger once; plays when the goblin first sees the player).
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
const KNEE: V3 = [0.0915, 0.1375, 0]; // the knee: splits the leg (shin.L takes the weight below it)
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
  // Color slots for individual goblins (the first option is the default look).
  variants: {
    eyes: { amber: C.iris, yellow: '#8f7010', red: '#7a0e0a' },
    skin: { olive: C.skin, moss: '#6b7c34', grey: '#8a9676' },
    clothing: { brown: C.tunic, slate: '#58616c', crimson: '#7a2e2a' },
    scarf: { ember: C.scarf, purple: '#7a3c9c', teal: '#2f8c88' },
  },
  presets: {
    bog: { eyes: 'yellow', skin: 'moss', clothing: 'brown', scarf: 'teal' },
    cave: { eyes: 'red', skin: 'grey', clothing: 'slate', scarf: 'purple' },
    raider: { eyes: 'yellow', skin: 'olive', clothing: 'crimson', scarf: 'teal' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot keep their exact default color and follow
    // the slot when a game recolors it; the blush and the mouth follow the skin halfway.
    const TS = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      skin: k.tint('skin'),
      skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
      earInner: k.tint('skin', { color: C.earInner, follow: 1 }),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      tunic: k.tint('clothing'),
      scarf: k.tint('scarf'),
    };
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
      dagger: { parent: 'hand.R', at: GUARD },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
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
    // A slight cup across the width: both long edges curve toward the inner (+Z) face, so the far
    // ear keeps a visible inner face in the diagonal views instead of a thin edge.
    const EAR_CUP = 0.014;
    const cupOffset = (x: number, y: number) => {
      const ramp = Math.min(1, Math.max(0, (x + 0.03) / 0.12)); // flat where the ear meets the head
      const across = (y - (0.01 + 0.35 * x)) / Math.max(0.035, 0.1 - 0.3 * x); // -1..1 edge to edge
      return EAR_CUP * ramp * across * across;
    };
    const cupped = (s: sdf.Shape): sdf.Shape =>
      new Sdf(
        (x, y, z) => s.dist(x, y, z - cupOffset(x, y)) * 0.75,
        { min: s.bounds.min, max: [s.bounds.max[0], s.bounds.max[1], s.bounds.max[2] + EAR_CUP * 3] },
        (x, y, z, f) => s.color(x, y, z - cupOffset(x, y), f),
      );
    // The ear rolls 28 degrees about its long axis so the inner face looks a little upward, and it
    // sweeps back a little less; the raised sprite cameras then see that face in the diagonal views.
    const earPose = (s: sdf.Shape) => s.scale(1.06).rotateX(-28).rotateY(32).at(...EAR);
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
    const ears = pair(earPose(cupped(earLocal.paintWhere(earCup.round(0.004), TS.earInner, 0.008))).bone('ear.L')).subtract(nicks);

    // One soft crest of hair on the crown: a single flame shape that leans back.
    const tuft = sdf
      .chain(
        [
          [0, 0, 0.04, 0.058],
          [0, 0.047, 0.004, 0.045],
          [0, 0.069, -0.034, 0.031],
          [0, 0.074, -0.068, 0.018],
        ],
        0.025,
      )
      .scale([1.05, 1, 1])
      .at(0.008, 0.818, 0);
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
      .paintWhere(blush, TS.blush, 0.018)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(iris, TS.iris)
      .paintWhere(irisLow, TS.irisLow, 0.014)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lowLid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(mouth, TS.mouth)
      .paintWhere(nostrils, TS.skinDark, 0.004);
    k.body('skin', skin, { color: TS.skin, roughness: 0.55, textureDensity: 2 });

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
    k.body('tunic', tunic.bone('spine'), { color: TS.tunic, roughness: 0.85 });

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
    k.body('scarf', scarf, { color: TS.scarf, roughness: 0.8 });

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
    k.body('blade', daggerPose(bladeLocal), { color: C.blade, roughness: 0.35, metalness: 0.55, detail: 0.003, bone: 'dagger' });
    const hiltLocal = sdf.union(
      sdf.cylinder(0.03, 0.014, 0.006).at(0, 0.002, 0), // round guard
      sdf.capsule([0, -0.1, 0], [0, 0, 0], 0.012), // grip, mostly inside the fist
      sdf.sphere(0.017).at(0, -0.108, 0), // pommel
    );
    k.body('hilt', daggerPose(hiltLocal), { color: C.wood, roughness: 0.7, bone: 'dagger' });

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

    // The legs come from motion.gait: planted stance boots, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `lift` the swing height, `duty` the share of the
    // cycle a foot is down (the run has a flight between steps), `hop` the hips bob. The left boot
    // strikes at p = 0.25, when the left arm is back and the right arm forward (gait's phase 0 is
    // the left strike). The sole points are the boot's heel and toe on the floor (measured on the
    // boot SDF at y = 0, turned out 16 degrees).
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
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
          // The ears flap and the scarf tails bounce twice per cycle, a little after the steps.
          'ear.L': { rotate: [0, lean * 0.8 + 3 * wave(p, 2, 0.2), 7 * wave(p, 2, 0.15)] as const },
          'ear.R': { rotate: [0, -lean * 0.8 - 3 * wave(p, 2, 0.2), -7 * wave(p, 2, 0.15)] as const },
          knot: { rotate: [lean * 1.5 + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.5 * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.03, 0.58, 28, 3, 0.008));
    k.animation('run', stride(0.56, 0.15, 0.05, 0.38, 50, 12, 0.035));

    // A sneaky lunge-stab, solved by targets. The wrist follows a path in world space. Each frame
    // converts it into the chest's rest frame (the hips, spine, and chest turn under the arm),
    // reach solves the arm, and orient turns the fist so the blade points along the path.
    // Anticipation: the goblin crouches, coils away, and pulls the dagger back to the right hip
    // with the point forward. Strike: the right foot steps, the hips drop and drive forward, and
    // the fist runs straight along the blade's own line to a target at chest height, so the blade
    // stays parallel to its motion. Recovery: the dagger pulls back along the line, then all
    // returns to rest. The ears flop late.
    const { keys, reach, orient, follow, quat } = motion;
    const DEG = Math.PI / 180;
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.27, 0], [0, 0.35, 0]]; // hips, spine, chest pivots
    const FLAT: V3 = [0, -Math.sin(DAGGER_TILT.x * DEG), Math.cos(DAGGER_TILT.x * DEG)]; // blade flat normal at rest
    const COCK: V3 = [-0.24, 0.29, -0.06]; // the guard at the right hip, point forward
    const HIT: V3 = [-0.08, 0.35, 0.335]; // the guard at full extension
    const AIM = norm([HIT[0] - COCK[0], HIT[1] - COCK[1], HIT[2] - COCK[2]]); // the strike line and the blade
    // The blade's roll: flat down in the chamber (the fist sits on the hip, the elbow up behind
    // it), then the fist turns a quarter in the thrust so the flat faces inward.
    const ROLL_COCK: V3 = [0, -1, 0];
    const ROLL_HIT: V3 = [1, 0, 0];
    const GRIP_OFFSET: V3 = [GUARD[0] - WRIST_R[0], GUARD[1] - WRIST_R[1], GUARD[2] - WRIST_R[2]];
    const POLE_COCK: V3 = [-0.4, 0.3, -0.35]; // the elbow back and out
    const POLE_HIT: V3 = [-0.42, 0.2, 0.1]; // the elbow out and a little down
    // The chest's posed frame: world points and directions into the chest's rest frame.
    const chestFrame = (rots: readonly V3[], move: V3) => {
      const inv = quat(rots[0]!).multiply(quat(rots[1]!)).multiply(quat(rots[2]!)).invert();
      const at = follow(TRUNK, rots, TRUNK[2]!);
      const c = TRUNK[2]!;
      return {
        point: (w: V3): V3 => {
          const v = new THREE.Vector3(w[0] - at[0] - move[0], w[1] - at[1] - move[1], w[2] - at[2] - move[2]).applyQuaternion(inv);
          return [v.x + c[0], v.y + c[1], v.z + c[2]];
        },
        dir: (d: V3): V3 => {
          const v = new THREE.Vector3(d[0], d[1], d[2]).applyQuaternion(inv);
          return [v.x, v.y, v.z];
        },
      };
    };
    k.animation('attack', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const coil = keys(p, [[0, 0], [0.3, 1], [0.36, 1], [0.46, 0]] as const);
        const lunge = keys(p, [[0.36, 0], [0.47, 1], [0.6, 1], [0.8, 0.25], [1, 0]] as const);
        const step = keys(p, [[0.36, 0], [0.42, 1], [0.48, 0]] as const); // the front foot lifts
        const aim = keys(p, [[0, 0], [0.28, 1], [0.7, 1], [1, 0]] as const); // rest grip to the strike line
        const ext = keys(p, [[0.28, 0], [0.36, -0.08], [0.47, 1], [0.58, 1], [0.72, 0.5]] as const);
        const flop = keys(p, [[0.4, 0], [0.54, 1], [0.66, 0.8], [1, 0]] as const); // the ears lag behind
        // Rigid legs: the left foot stays planted, so its angle sets the hips; the right leg swings
        // at least as far, so its foot never sinks.
        const legL = -8 * coil + 20 * lunge;
        const legR = -8 * coil - 20 * lunge - 8 * step;
        const hipsMove: V3 = [0, -legDrop(LEG, legL), LEG * Math.sin(legL * DEG)];
        const hipsR: V3 = [0, -10 * coil + 8 * lunge, 0];
        const spineR: V3 = [13 * coil + 8 * lunge, -8 * coil + 6 * lunge, 0];
        const chestR: V3 = [4 * coil + 4 * lunge, -12 * coil + 12 * lunge, 0];
        const frame = chestFrame([hipsR, spineR, chestR], hipsMove);
        // The guard runs along the strike line; the wrist follows from the fist's world turn.
        const guard = lerp(GUARD, lerp(COCK, HIT, ext), aim);
        const dirW = norm(lerp(GRIP_DIR, AIM, aim));
        const upW = norm(lerp(FLAT, lerp(ROLL_COCK, ROLL_HIT, Math.min(1, Math.max(0, ext))), aim));
        const turn = quat(orient([], { dir: GRIP_DIR, up: FLAT }, { dir: dirW, up: upW }));
        const off = new THREE.Vector3(...GRIP_OFFSET).applyQuaternion(turn);
        const wrist: V3 = [guard[0] - off.x, guard[1] - off.y, guard[2] - off.z];
        const pole = lerp(ELBOW_R, keys(p, [[0.1, POLE_COCK], [0.36, POLE_COCK], [0.47, POLE_HIT]] as const), aim);
        const arm = reach(ARM_R, frame.point(wrist), frame.point(pole));
        const hand = orient([arm.upper, arm.lower], { dir: GRIP_DIR, up: FLAT }, { dir: frame.dir(dirW), up: frame.dir(upW) });
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          head: { rotate: [-11 * coil - 8 * lunge, 20 * coil - 16 * lunge, 0] },
          'ear.L': { rotate: [6 * flop, 12 * flop - 4 * coil, 5 * coil - 6 * flop] },
          'ear.R': { rotate: [6 * flop, -12 * flop + 4 * coil, -5 * coil + 6 * flop] },
          knot: { rotate: [10 * flop, 0, 6 * flop] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          // The empty left claw comes up in front in the coil, then swings back for balance.
          'upperarm.L': { rotate: [-14 * coil + 28 * lunge, 0, 8 * coil + 14 * lunge] },
          'forearm.L': { rotate: [-24 * coil - 10 * lunge, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'leg.R': { rotate: [legR, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'foot.R': { rotate: [-legR - 10 * step, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The head and the chest snap back and the hips give way: the left foot stays planted and the
    // right foot steps back, then all returns quickly. The ears and the scarf tails flop late.
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
          head: { rotate: [-16 * h, -6 * h, -5 * h] },
          'ear.L': { rotate: [4 * flop, -10 * flop, 6 * flop] },
          'ear.R': { rotate: [4 * flop, 10 * flop, -6 * flop] },
          knot: { rotate: [-14 * flop, 0, 8 * flop] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          'upperarm.L': { rotate: [-18 * h, 0, 20 * h] },
          'forearm.L': { rotate: [-16 * h, 0, 0] },
          'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps the chest back, the goblin slumps forward and wobbles, then tips back over its
    // heels as one piece and lands on its back. The hips stay high enough for the big head: the
    // body rests on the back of the skull and the tunic. The arms are solved by targets in the
    // chest's rest frame and lie out on the ground. The hand opens in the fall and the dagger bone
    // carries the dagger to lie flat beside the right hand. The ears flop down last.
    const { euler } = motion;
    const LIE = 84; // the hips' final tilt back, degrees
    const LIE_Y = 0.155; // the hips' height when the goblin lies on its back
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const HAND_CHAIN: readonly V3[] = [...TRUNK, mx(SHOULDER), ELBOW_R, WRIST_R];
    const DROP_AT: V3 = [-0.43, 0.033, -0.28]; // the guard on the ground, the point toward the feet
    const DROP_TURN = quat(orient([], { dir: GRIP_DIR, up: FLAT }, { dir: norm([-0.3, -0.11, 1]), up: [0, 1, 0] }));
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
        const standL = add(add(add(WRIST, [0.05, 0.05, 0.06], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.08], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.07], land), lerp(ELBOW, [0.25, 0.3, -0.2], land));
        // The dagger: attached to the posed hand until the hand opens, then it drops to the ground.
        const handQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).multiply(quat(armR.upper)).multiply(quat(armR.lower));
        const held = add(follow(HAND_CHAIN, [hipsR, spineR, chestR, armR.upper, armR.lower, [0, 0, 0]], GUARD), hipsMove);
        const drop = keys(p, [[0.44, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = new THREE.Vector3(...add(lerp(held, drop, loose), held, -1)).applyQuaternion(inv);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 6 * land, -8 * hitB, 8 * wob + 6 * land] },
          'ear.L': { rotate: [0, -6 * hitB - 14 * earUp + 3 * earDown, 5 * wob + 8 * earUp - 5 * earDown] },
          'ear.R': { rotate: [0, 6 * hitB + 14 * earUp - 3 * earDown, -5 * wob - 8 * earUp + 5 * earDown] },
          knot: { rotate: [-12 * hitB, 0, 10 * fly + 6 * wob] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          dagger: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: point, hop, twirl
    // Played when the goblin first sees the player. It points the dagger straight at the player,
    // the left fist on the hip; it hops from foot to foot twice, the head cocked and the ears
    // flicking; then it flips the blade up, spins it once in the fingers, and returns to rest.
    // The right fist center follows a path in world space that rides with the hops; each frame
    // converts it into the chest's rest frame, reach solves the arm, and orient turns the fist.
    // The spin turns the `dagger` bone 360 degrees about the hand's axis (wrist to fist center),
    // through the fist center, so the grip stays in the fingers.
    const FIST_OFF: V3 = [FIST_R[0] - WRIST_R[0], FIST_R[1] - WRIST_R[1], FIST_R[2] - WRIST_R[2]];
    const HAND_AXIS = norm(FIST_OFF);
    const FIST_POINT: V3 = [-0.105, 0.38, 0.155]; // the blade straight ahead at chest height
    const FIST_SPIN: V3 = [-0.175, 0.37, 0.215]; // the forearm level, forward and a little out, the blade up
    const Q_REST = new THREE.Quaternion();
    const Q_POINT = quat(orient([], { dir: GRIP_DIR, up: FLAT }, { dir: [0, 0, 1], up: [1, 0, 0] }));
    const Q_SPIN = quat(orient([], { dir: HAND_AXIS, up: GRIP_DIR }, { dir: norm([-0.1, 0, 1]), up: norm([-0.25, 1, 0]) }));
    const POLE_POINT: V3 = [-0.42, 0.34, 0.08]; // the elbow out to the side
    const POLE_SPIN: V3 = [-0.42, 0.24, 0.06]; // the elbow out and down
    const WRIST_HIP: V3 = [0.2, 0.3, -0.005]; // the left fist on the hip
    const POLE_HIP: V3 = [0.42, 0.42, -0.14]; // the left elbow out and back
    const HIPS_AT: V3 = [0, 0.2, 0];
    // The hops. The hips' height is a cubic Hermite curve through knots [phase, meters, slope per
    // phase]: each flight is an exact parabola (peak HOP, FLY phases long), and the ground parts
    // carry the landing speed into the crouch and build the take-off speed out of it.
    const HOP = 0.075;
    const FLY = 0.11;
    const V = (4 * HOP) / FLY;
    const HIPS_Y: readonly (readonly [number, number, number])[] = [
      [0.15, 0, 0], // standing, the dagger pointed
      [0.215, -0.034, 0], // the crouch on both knees
      [0.25, 0, V], // take-off from the right foot
      [0.305, HOP, 0],
      [0.36, 0, -V], // the left foot lands
      [0.395, -0.035, 0], // the left knee absorbs it
      [0.43, 0, V], // take-off from the left foot
      [0.485, HOP, 0],
      [0.54, 0, -V], // the right foot lands
      [0.575, -0.032, 0], // the right knee absorbs it
      [0.65, 0, 0], // the left foot is down; the goblin stands up
    ];
    const hipsY = (p: number) => {
      if (p <= HIPS_Y[0]![0] || p >= HIPS_Y[HIPS_Y.length - 1]![0]) return 0;
      let i = 0;
      while (p > HIPS_Y[i + 1]![0]) i++;
      const [t0, y0, m0] = HIPS_Y[i]!;
      const [t1, y1, m1] = HIPS_Y[i + 1]!;
      const s = t1 - t0;
      const u = (p - t0) / s;
      const u2 = u * u;
      const u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * m0 * s + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * m1 * s;
    };
    const TUCK = 0.075; // the tucked ankle, above its rest height in the hips' frame
    /**
     * One leg, solved by its ankle's world target. The target converts into the hips' rest frame,
     * reach bends the knee forward, and the foot gets the opposite turn (plus `pitch`, toe down)
     * so the sole stays level.
     */
    const legTo = (right: boolean, ankleW: V3, pitch: number, hipsR: V3, hipsMove: V3) => {
      const f = (v: V3) => (right ? mx(v) : v);
      const qH = quat(hipsR);
      const t = new THREE.Vector3(ankleW[0] - HIPS_AT[0] - hipsMove[0], ankleW[1] - HIPS_AT[1] - hipsMove[1], ankleW[2] - HIPS_AT[2] - hipsMove[2])
        .applyQuaternion(qH.clone().invert());
      const leg = reach({ root: f(HIP), mid: f(KNEE), end: f(ANKLE) }, add(HIPS_AT, [t.x, t.y, t.z]), f([HIP[0] + 0.02, KNEE[1], 0.3]));
      const foot = euler(qH.multiply(quat(leg.upper)).multiply(quat(leg.lower)).invert().multiply(quat([pitch, 0, 0])));
      return { leg: leg.upper, shin: leg.lower, foot };
    };
    k.animation('taunt', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const up = keys(p, [[0, 0], [0.14, 1]] as const); // rest to the point
        const jab = keys(p, [[0.12, 0], [0.17, 1], [0.24, 0]] as const); // "you!": a short thrust
        const flip = keys(p, [[0.58, 0], [0.67, 1]] as const); // the point to the blade up
        const spin = keys(p, [[0.66, 0], [0.84, 1]] as const); // 0.25 s, one full turn
        const down = keys(p, [[0.82, 0], [1, 1]] as const); // back to rest
        const akimbo = keys(p, [[0, 0], [0.14, 1], [0.82, 1], [1, 0]] as const);
        const cock = keys(p, [[0.06, 0], [0.2, 1], [0.8, 1], [1, 0]] as const); // the head tilt, the lean back
        // Foot to foot: +1 stands on the left foot with the right foot tucked up, -1 the reverse.
        // Two hops (right to left, left to right), then the left foot steps down.
        const side = keys(p, [[0.2, 0], [0.3, 1], [0.4, 1], [0.48, -1], [0.56, -1], [0.64, 0]] as const);
        const h = hipsY(p);
        const land = Math.min(1, Math.max(0, -h / 0.035)); // the crouch: 1 on a fully bent knee
        const env = keys(p, [[0.16, 0], [0.22, 1], [0.58, 1], [0.66, 0]] as const);
        const flick = env * Math.sin((2 * Math.PI * (p - 0.2)) / 0.18); // one flick back and forth per hop
        // The legs: the hips tilt up on the side of the free leg and shift over the stance foot.
        // A leg on the ground keeps its ankle on the rest spot (the hips' drop bends the knee); in
        // the air it hangs a little bent below the hips. The take-off leg tucks up behind (the
        // knee bent, the heel up) until it reaches down for the next landing.
        const hipsR: V3 = [0, 0, -5 * side];
        const hipsMove: V3 = [0.01 * side, h, 0];
        const tuckL = keys(p, [[0.43, 0], [0.47, 1], [0.56, 1], [0.62, 0]] as const);
        const tuckR = keys(p, [[0.25, 0], [0.29, 1], [0.44, 1], [0.51, 0]] as const);
        const ankle = (a: number, s: number): V3 => [
          0.012 * a * s,
          a * (h + TUCK) + (1 - a) * 0.9 * Math.max(0, h),
          -0.025 * a,
        ];
        const legsL = legTo(false, add(ANKLE, ankle(tuckL, 1)), 10 * tuckL, hipsR, hipsMove);
        const legsR = legTo(true, add(mx(ANKLE), ankle(tuckR, -1)), 10 * tuckR, hipsR, hipsMove);
        // The goblin leans back while it points and hops, and stands up straight for the spin.
        const spineR: V3 = [-4 * cock * (1 - flip) + 3 * land, 0, 3 * side];
        const chestR: V3 = [-3 * cock * (1 - flip), 10 * up * (1 - flip), 0]; // the right shoulder leads the point
        const frame = chestFrame([hipsR, spineR, chestR], hipsMove);
        // The right fist: rest, the point (with the jab), the level forearm for the spin, rest.
        const pointAt = add(FIST_POINT, [0, 0, 0.025], jab);
        const fist = add(lerp(lerp(lerp(FIST_R, pointAt, up), FIST_SPIN, flip), FIST_R, down), hipsMove);
        const turn = Q_REST.clone().slerp(Q_POINT, up).slerp(Q_SPIN, flip).slerp(Q_REST, down);
        const off = new THREE.Vector3(...FIST_OFF).applyQuaternion(turn);
        const wrist: V3 = [fist[0] - off.x, fist[1] - off.y, fist[2] - off.z];
        const pole = lerp(lerp(lerp(ELBOW_R, POLE_POINT, up), POLE_SPIN, flip), ELBOW_R, down);
        const arm = reach(ARM_R, frame.point(wrist), frame.point(add(pole, hipsMove)));
        const dirW = new THREE.Vector3(...GRIP_DIR).applyQuaternion(turn);
        const upW = new THREE.Vector3(...FLAT).applyQuaternion(turn);
        const hand = orient(
          [arm.upper, arm.lower],
          { dir: GRIP_DIR, up: FLAT },
          { dir: frame.dir([dirW.x, dirW.y, dirW.z]), up: frame.dir([upW.x, upW.y, upW.z]) },
        );
        // The twirl: the dagger turns about the hand's axis through the fist center.
        const twirl = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...HAND_AXIS), 2 * Math.PI * spin);
        const g = new THREE.Vector3(GUARD[0] - FIST_R[0], GUARD[1] - FIST_R[1], GUARD[2] - FIST_R[2]).applyQuaternion(twirl);
        const armL = reach(ARM_L, lerp(WRIST, WRIST_HIP, akimbo), lerp(ELBOW, POLE_HIP, akimbo));
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [4 * land, 0, 0] },
          // The head cocks to its left, away from the blade, the chin a little down: a sly grin.
          head: { rotate: [5 * cock, 0, -10 * cock - 3 * side] },
          'ear.L': { rotate: [0, 22 * flick, 8 * up * (1 - down) - 6 * land + 8 * flick] },
          'ear.R': { rotate: [0, -22 * flick, -8 * up * (1 - down) + 6 * land - 8 * flick] },
          knot: { rotate: [12 * env * Math.sin((2 * Math.PI * (p - 0.24)) / 0.18), 0, 6 * side] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          dagger: { move: [FIST_R[0] + g.x - GUARD[0], FIST_R[1] + g.y - GUARD[1], FIST_R[2] + g.z - GUARD[2]], rotate: euler(twirl) },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
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
