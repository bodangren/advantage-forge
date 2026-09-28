import { defineAsset, motion, noise, profile, sdf, Sdf, THREE } from '../src/index.js';

/**
 * Ghoul — Chibi Quest dungeon enemy (P1), about 0.9 m to the crown, faces +Z. Target: the mockup
 * docs/enemy-mockups/ghoul_001.jpg (front view). Built on the goblin warrior's body and rig.
 *
 * Role: a common dungeon enemy, seen in 3D and as a 128 px sprite; the grin and the ears read.
 * One idea: a huge bald head with a grin from ear to ear full of pointed teeth, big round yellow
 *   eyes under angry brow ridges, and very long pointed ears; a lean body with long clawed hands.
 * Proportions (from the mockup): crown 0.9, eyes 0.685, nose 0.645, grin 0.53 to 0.61, chin 0.5,
 *   ear tips about 0.44 out and 0.86 high, shoulders 0.415, rag waist 0.28, rag hem 0.16, front
 *   flap 0.07, knees 0.14; the claws hang to about 0.1.
 * Shape language: a round dome and pot belly against sharp points (ears, teeth, claws, torn rags).
 * Palette: grey-violet skin #a8989f, pink inner ears and nose, pale yellow eyes #efe39c, cream
 *   teeth in a near-black mouth, grey claws, dark grey-brown rags #4a3f3c.
 * Value plan: the pale eyes and the teeth against the dark mouth are the strongest contrast; the
 *   dark rags ground the figure.
 * Bodies: skin, eyes, teeth, claws, rags.
 * Rig: the goblin warrior's chibi skeleton (with knee `shin.*` bones) plus `ear.L`/`ear.R`.
 *   Clips: idle, walk, run, attack (a two-handed claw swipe), hit, death, taunt (hop from foot to
 *   foot with both claws up, the head cocked; plays when the ghoul first sees the player).
 */

const C = {
  skin: '#8a7a82',
  skinDark: '#6c5e66',
  earInner: '#b88690',
  nose: '#a8808a',
  lip: '#86606c',
  knuckle: '#9a8088',
  eye: '#ede3a8',
  pupil: '#18110f',
  mouth: '#2a1417',
  tooth: '#ece0b0',
  claw: '#8e8488',
  rag: '#4a3f3c',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.715;
const HEAD = [0.2, 0.185, 0.19] as const;
const EYE = [0.112, 0.683] as const; // x (each side), y
const EYE_R = 0.06;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints. Both thin arms hang a little out from the body, the elbows a little bent.
const SHOULDER: V3 = [0.125, 0.415, -0.005];
const ELBOW: V3 = [0.19, 0.315, 0];
const WRIST: V3 = [0.225, 0.228, 0.025];
const ELBOW_R = mx(ELBOW);
const WRIST_R = mx(WRIST);
const HIP: V3 = [0.075, 0.2, 0];
const ANKLE: V3 = [0.108, 0.075, 0];
const KNEE: V3 = [0.0915, 0.1375, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const FOOT_TURN = 14; // degrees, toes out

/** A long-fingered hand hanging from the left wrist `w`; the fingers curl in and forward. */
const handAt = (w: V3) => {
  const P = (x: number, y: number, z: number): V3 => [w[0] + x, w[1] + y, w[2] + z];
  const fingers: sdf.Shape[] = [];
  const claws: sdf.Shape[] = [];
  for (const [dz, dx, len] of [
    [0.024, 0.004, 1],
    [0.004, 0.006, 1.08],
    [-0.016, 0.002, 0.95],
  ] as const) {
    const a = P(dx, -0.055, dz);
    const b = P(dx - 0.004, -0.055 - 0.04 * len, dz * 1.25 + 0.008);
    const c = P(dx - 0.02, -0.055 - 0.07 * len, dz * 1.35 + 0.024);
    fingers.push(
      sdf.chain(
        [
          [...a, 0.013],
          [...b, 0.0118],
          [...c, 0.0095],
        ],
        0.006,
      ),
    );
    const d = norm([c[0] - b[0], c[1] - b[1], c[2] - b[2]]);
    const tip = add(c, norm([d[0] - 0.5, d[1] - 0.2, d[2] + 0.2]), 0.032);
    claws.push(sdf.cone(add(c, d, 0.003), tip, 0.0092, 0.0014));
  }
  // The thumb: out of the inner front of the palm, curling in.
  const t0 = P(-0.012, -0.028, 0.026);
  const t1 = P(-0.026, -0.052, 0.042);
  const t2 = P(-0.036, -0.075, 0.05);
  fingers.push(
    sdf.chain(
      [
        [...t0, 0.012],
        [...t1, 0.0105],
        [...t2, 0.0088],
      ],
      0.006,
    ),
  );
  claws.push(sdf.cone(t2, add(t2, norm([-0.45, -0.7, 0.35]), 0.028), 0.0085, 0.0014));
  const hand = sdf.smoothUnion(0.012, sdf.ellipsoid([0.025, 0.04, 0.034]).at(...P(0.002, -0.034, 0.006)), ...fingers);
  return { hand, claws: sdf.union(...claws) };
};

/** A long clawed foot, built at its ankle's ground point (0, 0, 0), toes along +Z. */
const footLocal = () => {
  const toes: sdf.Shape[] = [];
  const claws: sdf.Shape[] = [];
  for (const dx of [-0.03, 0, 0.03]) {
    const len = dx === 0 ? 1.08 : 1;
    const tip: V3 = [dx * 1.5, 0.013, 0.13 * len];
    toes.push(
      sdf.chain(
        [
          [dx * 0.6, 0.03, 0.045, 0.017],
          [dx * 1.15, 0.026, 0.092 * len, 0.0125],
          [...tip, 0.011],
        ],
        0.008,
      ),
    );
    claws.push(sdf.cone([tip[0], tip[1], tip[2] + 0.004], [dx * 1.65, 0.002, 0.13 * len + 0.036], 0.0092, 0.0016));
  }
  const foot = sdf
    .smoothUnion(
      0.02,
      sdf.ellipsoid([0.033, 0.036, 0.04]).at(0, 0.037, -0.012), // heel and ankle
      sdf.ellipsoid([0.046, 0.024, 0.048]).at(0, 0.03, 0.035), // the top of the foot
      ...toes,
    )
    .intersect(sdf.halfSpace([0, -1, 0], 0));
  return { foot, claws: sdf.union(...claws).intersect(sdf.halfSpace([0, -1, 0], 0)) };
};

export default defineAsset({
  name: 'ghoul',
  description: 'Chibi ghoul enemy with a huge bald head, very long pointed ears, a toothy grin, clawed hands and feet, and waist rags.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/ghoul_001.jpg',
  // Color slots for individual ghouls (the first option is the default look).
  variants: {
    skin: { violet: C.skin, green: '#7f8876', blue: '#77808f' },
    eyes: { yellow: C.eye, green: '#d0dc98', red: '#e8a090' },
    rags: { brown: C.rag, moss: '#4b5238', rust: '#6a4232' },
  },
  presets: {
    bog: { skin: 'green', eyes: 'green', rags: 'moss' },
    crypt: { skin: 'blue', eyes: 'red', rags: 'brown' },
    butcher: { skin: 'violet', eyes: 'red', rags: 'rust' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot keep their exact default color and follow
    // the slot when a game recolors it; the pinks and the lips follow the skin halfway.
    const TS = {
      skin: k.tint('skin'),
      skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
      earInner: k.tint('skin', { color: C.earInner, follow: 0.5 }),
      nose: k.tint('skin', { color: C.nose, follow: 0.5 }),
      lip: k.tint('skin', { color: C.lip, follow: 0.6 }),
      knuckle: k.tint('skin', { color: C.knuckle, follow: 0.7 }),
      eye: k.tint('eyes'),
      rag: k.tint('rags'),
      ragDark: k.tint('rags', -0.25),
    };
    const EAR: V3 = [0.17, 0.71, -0.02];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.27, 0] },
      chest: { parent: 'spine', at: [0, 0.35, 0] },
      neck: { parent: 'chest', at: [0, 0.46, -0.01] },
      head: { parent: 'neck', at: [0, 0.51, -0.01] },
      'ear.L': { parent: 'head', at: EAR, tail: [0.44, 0.86, -0.12] },
      'ear.R': { parent: 'head', at: mx(EAR), tail: [-0.44, 0.86, -0.12] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head
    const skull = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid(HEAD).at(0, HEAD_Y, -0.01),
      pair(sdf.sphere(0.095).at(0.1, 0.605, 0.06)), // full cheeks for the grin
      sdf.ellipsoid([0.172, 0.075, 0.13]).at(0, 0.572, 0.045), // a wide jaw
    );
    const faceZ = (x: number, y: number) => sdf.raycast(skull, [x, y, 1], [0, 0, -1])![2];
    const eyeC: V3 = [EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) - 0.03];
    // Heavy angry brow ridges: high at the outer end, low toward the nose.
    const brow = sdf.capsule([0.168, 0.748, faceZ(0.168, 0.748) - 0.012], [0.05, 0.712, faceZ(0.05, 0.712) - 0.004], 0.026);
    // An upper lid over each eyeball, lower at the inner end; a soft bag under the eye.
    const lid = sdf
      .sphere(EYE_R + 0.006)
      .intersect(sdf.halfSpace(norm([0.3, -1, -0.15]), -0.036))
      .at(...eyeC);
    const bag = sdf.capsule([eyeC[0] - 0.035, EYE[1] - 0.058, eyeC[2] + 0.034], [eyeC[0] + 0.045, EYE[1] - 0.047, eyeC[2] + 0.026], 0.011);
    const nose = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.024, 0.022, 0.024]).at(0, 0.648, faceZ(0, 0.648) - 0.004),
      pair(sdf.sphere(0.015).at(0.017, 0.638, faceZ(0.017, 0.638) - 0.001)),
    );
    const head = sdf
      .smoothUnion(0.022, skull, pair(brow), pair(lid))
      .smoothUnion(0.012, pair(bag), nose)
      .bone('head');

    // A flat leaf, drawn outward along +X with the base at the origin; the cup faces +Z.
    const earOutline = profile.polygon(
      [
        [-0.05, 0.1],
        [0.05, 0.11],
        [0.15, 0.118],
        [0.235, 0.122],
        [0.285, 0.12],
        [0.235, 0.088],
        [0.17, 0.025],
        [0.105, -0.045],
        [0.04, -0.105],
        [-0.05, -0.13],
      ],
      { smooth: true, samples: 5 },
    );
    const earCup = sdf.extrude(profile.offsetProfile(earOutline, -0.026), 0.03, 0.01).at(0.012, 0.004, 0.02);
    const earLocal = sdf.extrude(earOutline, 0.026, 0.011).smoothSubtract(0.01, earCup);
    // A slight cup across the width, so the far ear keeps a visible inner face in diagonal views.
    const EAR_CUP = 0.014;
    const cupOffset = (x: number, y: number) => {
      const ramp = Math.min(1, Math.max(0, (x + 0.03) / 0.12));
      const across = (y - (0.01 + 0.35 * x)) / Math.max(0.035, 0.1 - 0.3 * x);
      return EAR_CUP * ramp * across * across;
    };
    const cupped = (s: sdf.Shape): sdf.Shape =>
      new Sdf(
        (x, y, z) => s.dist(x, y, z - cupOffset(x, y)) * 0.75,
        { min: s.bounds.min, max: [s.bounds.max[0], s.bounds.max[1], s.bounds.max[2] + EAR_CUP * 3] },
        (x, y, z, f) => s.color(x, y, z - cupOffset(x, y), f),
      );
    const earPose = (s: sdf.Shape) => s.scale(1.18).rotateX(-24).rotateY(24).rotateZ(12).at(...EAR);
    const ears = pair(earPose(cupped(earLocal.paintWhere(earCup.round(0.004), TS.earInner, 0.01))).bone('ear.L'));
    const neck = sdf.capsule([0, 0.43, -0.012], [0, 0.54, -0.01], 0.042).bone('neck');

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const MOUTH_W = 0.165;
    const yu = (x: number) => 0.594 + 0.024 * (x / MOUTH_W) ** 2; // the upper lip
    const yl = (x: number) => 0.53 + 0.076 * (x / MOUTH_W) ** 2; // the lower lip
    const mouthPts: [number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const x = -MOUTH_W + (2 * MOUTH_W * i) / 10;
      mouthPts.push([x, yu(x)]);
    }
    for (let i = 9; i >= 1; i--) {
      const x = -MOUTH_W + (2 * MOUTH_W * i) / 10;
      mouthPts.push([x, yl(x)]);
    }
    const mouthOutline = profile.polygon(mouthPts, { smooth: true, samples: 3 });
    const mouth = sdf.extrude(mouthOutline, 0.3).at(0, 0, 0.12);
    const lips = sdf.extrude(profile.offsetProfile(mouthOutline, 0.009), 0.3).at(0, 0, 0.12);
    const noseFront = sdf.raycast(nose, [0, 0.632, 1], [0, 0, -1])![2];
    const nostrils = pair(sdf.sphere(0.0065).at(0.014, 0.632, noseFront - 0.006));

    // ------------------------------------------------------------------ lean body and pot belly
    const chest = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.075, 0.072]).at(0, 0.395, -0.01),
      pair(sdf.ellipsoid([0.052, 0.034, 0.03]).at(0.05, 0.398, 0.04)), // slack pecs
      pair(sdf.sphere(0.036).at(SHOULDER[0] - 0.006, SHOULDER[1] + 0.004, SHOULDER[2])), // bony shoulders
    );
    const belly = sdf.ellipsoid([0.088, 0.078, 0.086]).at(0, 0.308, 0.018);
    const pelvis = sdf.ellipsoid([0.095, 0.06, 0.075]).at(0, 0.232, 0);
    const torso = sdf.smoothUnion(0.045, chest.bone('chest'), belly.bone('spine'), pelvis.bone('hips'));
    // Faint ribs on the flanks, above the belly.
    const ribs = pair(
      sdf.union(
        ...[0.372, 0.352, 0.332].map((y, i) =>
          sdf.extrude(profile.arc(0.07, 0.006, 10, 70), 0.3).rotateY(90).at(0.07 - i * 0.004, y - 0.05, 0.01),
        ),
      ),
    );

    // Thin arms with bony elbows and long clawed hands.
    const handL = handAt(WRIST);
    const armL = sdf.smoothUnion(
      0.016,
      sdf.cone(SHOULDER, ELBOW, 0.031, 0.024).bone('upperarm.L'),
      sdf.sphere(0.025).at(ELBOW[0] + 0.004, ELBOW[1], ELBOW[2] - 0.006).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.025, 0.02).bone('forearm.L'),
      handL.hand.bone('hand.L'),
    );
    // Thin legs with big bony knees and long three-toed feet.
    const feet = footLocal();
    const footPose = (s: sdf.Shape) => s.rotateY(FOOT_TURN).at(ANKLE[0], 0, 0);
    const legL = sdf.smoothUnion(
      0.016,
      sdf.cone(HIP, KNEE, 0.046, 0.034).bone('leg.L'),
      sdf.sphere(0.039).at(KNEE[0] + 0.006, KNEE[1], KNEE[2] + 0.012).bone('leg.L'),
      sdf.cone(KNEE, ANKLE, 0.031, 0.024).bone('shin.L'),
      footPose(feet.foot).bone('foot.L'),
    );
    const knees = pair(sdf.sphere(0.024).at(KNEE[0] + 0.006, KNEE[1], KNEE[2] + 0.048));
    const elbows = pair(sdf.sphere(0.018).at(ELBOW[0] + 0.004, ELBOW[1], ELBOW[2] - 0.028));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.025, torso)
      .smoothUnion(0.018, ears)
      .smoothUnion(0.02, pair(armL))
      .smoothUnion(0.02, pair(legL))
      .paintWhere(ribs, TS.skinDark, 0.008)
      .paintWhere(knees, TS.knuckle, 0.02)
      .paintWhere(elbows, TS.knuckle, 0.015)
      .paintWhere(nose.round(0.004), TS.nose, 0.008)
      .paintWhere(nostrils, C.mouth, 0.003)
      .paintWhere(lips, TS.lip, 0.004)
      .paintWhere(mouth, C.mouth, 0.002);
    k.body('skin', skin, { color: TS.skin, roughness: 0.6, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ eyes: pale balls, small pupils
    // The pupils look a little in toward the nose: a mad, fixed stare.
    const pupilAt = add(eyeC, norm([-0.22, -0.02, 1]), EYE_R);
    const eyeball = sdf
      .sphere(EYE_R)
      .at(...eyeC)
      .paintWhere(sdf.sphere(0.0125).at(...pupilAt), C.pupil, 0.002)
      .paintWhere(sdf.sphere(0.006).at(...add(pupilAt, [0.014, 0.016, 0])), '#fffbe8', 0.002);
    k.body('eyes', pair(eyeball), { color: TS.eye, roughness: 0.2, detail: 0.003, bone: 'head', textureDensity: 2 });

    // ------------------------------------------------------------------ teeth: two rows of points
    const tooth = (x: number, y: number, len: number, dir: 1 | -1, r: number) => {
      const y2 = y + dir * len;
      return sdf.cone([x, y - dir * 0.003, faceZ(x, y) - 0.004], [x, y2, faceZ(x, y2) + 0.001], r, 0.0016);
    };
    const upper = Array.from({ length: 13 }, (_, i) => {
      const x = -0.148 + (0.296 * i) / 12;
      return tooth(x, yu(x), 0.021 + 0.005 * Math.abs(Math.sin(i * 2.3)) - 0.006 * Math.abs(x / MOUTH_W), -1, 0.0095);
    });
    const lower = Array.from({ length: 12 }, (_, i) => {
      const x = -0.136 + (0.272 * i) / 11;
      return tooth(x, yl(x), 0.018 + 0.004 * Math.abs(Math.sin(i * 1.7)) - 0.005 * Math.abs(x / MOUTH_W), 1, 0.009);
    });
    k.body('teeth', sdf.union(...upper, ...lower).bone('head'), { color: C.tooth, roughness: 0.35, detail: 0.0025 });

    // ------------------------------------------------------------------ claws on the hands and feet
    const claws = sdf.union(pair(handL.claws.bone('hand.L')), pair(footPose(feet.claws).bone('foot.L')));
    k.body('claws', claws, { color: C.claw, roughness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ rags around the waist
    const waist = sdf.smoothUnion(0.045, belly, pelvis);
    const band = waist.round(0.013).smoothIntersect(0.008, sdf.box([0.5, 0.045, 0.5]).at(0, 0.272, 0));
    const skirtBody = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.27],
            [0.1, 0.27],
            [0.114, 0.24],
            [0.126, 0.2],
            [0.136, 0.16],
            [0.126, 0.152],
            [0, 0.152],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.84]);
    // Torn hem: V notches through the middle cut both sides.
    const notch = (angle: number, top: number, w: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-w, 0.13],
            [w, 0.13],
            [0, top],
          ]),
          0.5,
        )
        .rotateY(angle);
    const hem = sdf.union(...[0, 27, 58, 85, 118, 147].map((a, i) => notch(a + 6, 0.182 + 0.014 * ((i * 5) % 3), 0.022 + 0.006 * (i % 2))));
    // Front and back flaps hang lower, torn at the bottom.
    const flapOutline = (bottom: number) =>
      profile.polygon(
        [
          [-0.058, 0.265],
          [0.058, 0.265],
          [0.068, bottom + 0.05],
          [0.06, bottom + 0.004],
          [0.042, bottom + 0.03],
          [0.028, bottom - 0.004],
          [0.01, bottom + 0.024],
          [-0.012, bottom],
          [-0.03, bottom + 0.028],
          [-0.048, bottom + 0.006],
          [-0.07, bottom + 0.042],
        ],
        { smooth: false },
      );
    const flapF = sdf.extrude(flapOutline(0.07), 0.012, 0.004).rotateX(-5).at(0, 0, 0.1);
    const flapB = sdf.extrude(flapOutline(0.1), 0.012, 0.004).rotateX(5).at(0, 0, -0.088);
    const knot = sdf.ellipsoid([0.03, 0.022, 0.02]).rotateZ(20).at(0.025, 0.268, 0.11);
    const folds = (x: number, y: number, z: number) => noise.noise3(Math.atan2(x, z) * 4, y * 5, 0.5);
    const rags = sdf
      .smoothUnion(0.01, band, skirtBody.subtract(hem), flapF, flapB, knot)
      .displace(0.003, folds)
      .paintWhere(sdf.box([0.4, 0.1, 0.4]).at(0, 0.1, 0), TS.ragDark, 0.04)
      .bone('hips');
    k.body('rags', rags, { color: TS.rag, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, quat, euler } = motion;
    const DEG = Math.PI / 180;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        spine: { rotate: [3 + 2 * wave(p), 0, 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [-3, 6 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        'ear.L': { rotate: [0, 0, 4 * wave(p, 1, 0.35)] },
        'ear.R': { rotate: [0, 0, -4 * wave(p, 1, 0.35)] },
        'upperarm.L': { rotate: [-4 + 2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [-4 + 2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-5 * bump(p, 1, 0.3), 0, 0] },
        // The claws flex open and shut.
        'hand.L': { rotate: [-10 * bump(p, 2, 0.1), 0, 0] },
        'hand.R': { rotate: [-10 * bump(p, 2, 0.35), 0, 0] },
      }),
    });

    // The legs come from motion.gait. The sole points are the foot's heel and toe pads on the
    // floor (turned out FOOT_TURN degrees). The ghoul walks hunched, the arms swinging loose.
    const turn = (x: number, z: number): V3 => [ANKLE[0] + x * Math.cos(FOOT_TURN * DEG) + z * Math.sin(FOOT_TURN * DEG), 0, z * Math.cos(FOOT_TURN * DEG) - x * Math.sin(FOOT_TURN * DEG)];
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
          heel: turn(0, -0.045),
          toe: turn(0, 0.13),
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'ear.L': { rotate: [0, lean * 0.8 + 3 * wave(p, 2, 0.2), 7 * wave(p, 2, 0.15)] as const },
          'ear.R': { rotate: [0, -lean * 0.8 - 3 * wave(p, 2, 0.2), -7 * wave(p, 2, 0.15)] as const },
          'upperarm.L': { rotate: [armSwing * s - 8, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * s - 8, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.4 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.4 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          'hand.L': { rotate: [8 * wave(p, 1, 0.15), 0, 0] as const },
          'hand.R': { rotate: [-8 * wave(p, 1, 0.15), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.03, 0.58, 26, 8, 0.008));
    k.animation('run', stride(0.56, 0.15, 0.05, 0.38, 44, 16, 0.035));

    // ------------------------------------------------------------------ attack: a two-handed claw swipe
    // Anticipation: the ghoul rears back and raises both claws high and wide. Strike: the right
    // foot steps, the body lunges, and both claws rake down and in across the front, the wrists
    // flicking. Recovery: the claws hang low, then all returns to rest. The ears flop late.
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const coil = keys(p, [[0, 0], [0.32, 1], [0.4, 1], [0.52, 0]] as const);
        const swipe = keys(p, [[0.38, 0], [0.52, 1], [0.64, 1], [0.86, 0.2], [1, 0]] as const);
        const step = keys(p, [[0.38, 0], [0.44, 1], [0.5, 0]] as const);
        const flop = keys(p, [[0.42, 0], [0.56, 1], [0.7, 0.8], [1, 0]] as const);
        const legLA = -6 * coil + 18 * swipe;
        const legRA = -6 * coil - 18 * swipe - 8 * step;
        const hipsMove: V3 = [0, -legDrop(LEG, legLA), LEG * Math.sin(legLA * DEG)];
        const armX = -85 * coil - 70 * swipe;
        const armZ = 55 * coil - 24 * swipe;
        const foreX = -70 * coil - 6 * swipe;
        const wristX = 30 * coil - 25 * swipe;
        return {
          hips: { move: hipsMove },
          spine: { rotate: [-8 * coil + 20 * swipe, 0, 0] },
          chest: { rotate: [-6 * coil + 10 * swipe, 0, 0] },
          head: { rotate: [10 * coil - 18 * swipe, 0, 0] },
          'ear.L': { rotate: [6 * flop, 12 * flop - 6 * coil, 6 * coil - 6 * flop] },
          'ear.R': { rotate: [6 * flop, -12 * flop + 6 * coil, -6 * coil + 6 * flop] },
          'upperarm.L': { rotate: [armX, 0, armZ] },
          'forearm.L': { rotate: [foreX, 0, 0] },
          'hand.L': { rotate: [wristX, 0, 0] },
          'upperarm.R': { rotate: [armX, 0, -armZ] },
          'forearm.R': { rotate: [foreX, 0, 0] },
          'hand.R': { rotate: [wristX, 0, 0] },
          'leg.L': { rotate: [legLA, 0, 0] },
          'leg.R': { rotate: [legRA, 0, 0] },
          'foot.L': { rotate: [-legLA, 0, 0] },
          'foot.R': { rotate: [-legRA - 10 * step, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The head and the chest snap back and the hips give way: the left foot stays planted and the
    // right foot steps back, then all returns quickly. The ears flop late.
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.05; // the back of the heel, behind the ankle's ground point
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
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          'upperarm.L': { rotate: [-18 * h, 0, 20 * h] },
          'forearm.L': { rotate: [-16 * h, 0, 0] },
          'upperarm.R': { rotate: [-14 * h, 0, -18 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'hand.L': { rotate: [20 * h, 0, 0] },
          'hand.R': { rotate: [20 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps the chest back, the ghoul slumps forward and wobbles, then tips back over its
    // heels as one piece and lands on its back. The hips stay high enough for the big head. The
    // arms are solved by targets in the chest's rest frame and lie out on the ground; the claws
    // go limp. The ears flop down last.
    const LIE = 84; // the hips' final tilt back, degrees
    const LIE_Y = 0.155; // the hips' height when the ghoul lies on its back
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
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
        const earUp = keys(p, [[0.36, 0], [0.54, 1], [0.62, 1], [0.7, 0]] as const);
        const earDown = keys(p, [[0.62, 0], [0.72, 1.15], [0.8, 0.92], [0.88, 1]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * Math.min(1, Math.max(0, (tilt - 66) / 18)); // the legs come down once the hips hold
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const standR = add(add(add(WRIST_R, [-0.05, 0.03, -0.05], hitB), [0, -0.03, 0.03], sag), [-0.07, 0.06, 0.06], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.27, 0.34, -0.07], land), lerp(ELBOW_R, [-0.25, 0.3, -0.2], land));
        const standL = add(add(add(WRIST, [0.05, 0.05, 0.06], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.08], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.07], land), lerp(ELBOW, [0.25, 0.3, -0.2], land));
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 6 * land, -8 * hitB, 8 * wob + 6 * land] },
          'ear.L': { rotate: [0, -6 * hitB - 14 * earUp + 3 * earDown, 5 * wob + 8 * earUp - 5 * earDown] },
          'ear.R': { rotate: [0, 6 * hitB + 14 * earUp - 3 * earDown, -5 * wob - 8 * earUp + 5 * earDown] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.L': { rotate: [25 * land, 0, 0] },
          'hand.R': { rotate: [25 * land, 0, 0] },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: claws up, hop, cackle
    // Played when the ghoul first sees the player. Both claws come up beside the head, the fingers
    // raking the air; it hops from foot to foot twice with the head cocked and the ears flicking,
    // cackles (fast head bobs), and returns to rest.
    const HIPS_AT: V3 = [0, 0.2, 0];
    // The hops: the hips' height is a cubic Hermite curve through knots [phase, meters, slope].
    const HOP = 0.075;
    const FLY = 0.11;
    const V = (4 * HOP) / FLY;
    const HIPS_Y: readonly (readonly [number, number, number])[] = [
      [0.15, 0, 0],
      [0.215, -0.034, 0],
      [0.25, 0, V],
      [0.305, HOP, 0],
      [0.36, 0, -V],
      [0.395, -0.035, 0],
      [0.43, 0, V],
      [0.485, HOP, 0],
      [0.54, 0, -V],
      [0.575, -0.032, 0],
      [0.65, 0, 0],
    ];
    const hopY = (p: number) => {
      if (p <= HIPS_Y[0]![0] || p >= HIPS_Y[HIPS_Y.length - 1]![0]) return 0;
      let i = 0;
      while (p > HIPS_Y[i + 1]![0]) i++;
      const [t0, y0, m0] = HIPS_Y[i]!;
      const [t1, y1, m1] = HIPS_Y[i + 1]!;
      const s = t1 - t0;
      const v = (p - t0) / s;
      const v2 = v * v;
      const v3 = v2 * v;
      return (2 * v3 - 3 * v2 + 1) * y0 + (v3 - 2 * v2 + v) * m0 * s + (-2 * v3 + 3 * v2) * y1 + (v3 - v2) * m1 * s;
    };
    const TUCK = 0.075;
    /** One leg, solved by its ankle's world target; the foot gets the opposite turn plus `pitch`. */
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
        const up = keys(p, [[0, 0], [0.14, 1], [0.8, 1], [1, 0]] as const); // the claws up beside the head
        const cock = keys(p, [[0.06, 0], [0.2, 1], [0.8, 1], [1, 0]] as const);
        const side = keys(p, [[0.2, 0], [0.3, 1], [0.4, 1], [0.48, -1], [0.56, -1], [0.64, 0]] as const);
        const h = hopY(p);
        const land = Math.min(1, Math.max(0, -h / 0.035));
        const env = keys(p, [[0.16, 0], [0.22, 1], [0.58, 1], [0.66, 0]] as const);
        const flick = env * Math.sin((2 * Math.PI * (p - 0.2)) / 0.18);
        const cackle = keys(p, [[0.62, 0], [0.66, 1], [0.84, 1], [0.9, 0]] as const) * Math.sin((2 * Math.PI * (p - 0.62)) / 0.06);
        const rake = up * Math.sin((2 * Math.PI * p) / 0.2); // the fingers rake the air
        const hipsR: V3 = [0, 0, -5 * side];
        const hipsMove: V3 = [0.01 * side, h, 0];
        const tuckL = keys(p, [[0.43, 0], [0.47, 1], [0.56, 1], [0.62, 0]] as const);
        const tuckR = keys(p, [[0.25, 0], [0.29, 1], [0.44, 1], [0.51, 0]] as const);
        const ankle = (a: number, s: number): V3 => [0.012 * a * s, a * (h + TUCK) + (1 - a) * 0.9 * Math.max(0, h), -0.025 * a];
        const legsL = legTo(false, add(ANKLE, ankle(tuckL, 1)), 10 * tuckL, hipsR, hipsMove);
        const legsR = legTo(true, add(mx(ANKLE), ankle(tuckR, -1)), 10 * tuckR, hipsR, hipsMove);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: [4 * cock + 3 * land, 0, 3 * side] },
          chest: { rotate: [-2 * cock, 0, 0] },
          neck: { rotate: [4 * land, 0, 0] },
          head: { rotate: [5 * cock - 6 * cackle, 0, -10 * cock - 3 * side] },
          'ear.L': { rotate: [0, 22 * flick, 8 * up - 6 * land + 8 * flick] },
          'ear.R': { rotate: [0, -22 * flick, -8 * up + 6 * land - 8 * flick] },
          'upperarm.L': { rotate: [-45 * up, 0, 56 * up] },
          'forearm.L': { rotate: [-65 * up, 0, 0] },
          'hand.L': { rotate: [18 * rake, 0, 0] },
          'upperarm.R': { rotate: [-45 * up, 0, -56 * up] },
          'forearm.R': { rotate: [-65 * up, 0, 0] },
          'hand.R': { rotate: [-18 * rake, 0, 0] },
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
