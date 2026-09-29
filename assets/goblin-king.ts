import { defineAsset, motion, noise, profile, rgb, sdf, Sdf, THREE } from '../src/index.js';

/**
 * Goblin king — the Labyrinth boss (catalog `enemies/humanoid/goblin-king`), about 1.05 m to the
 * tip of his crown, faces +Z. Target: docs/enemy-mockups/goblin-king_001.jpg, built on the goblin
 * warrior's rig (the rogue skeleton with knee bones), face, and leaf ears.
 *
 * Role: the boss of a dungeon game, seen in 3D and as a 128 px sprite; the crown, the ears, and
 *   the tusked grin read.
 * One idea: a squat, fat goblin who wears a crooked gold crown between two ivory horns and lugs
 *   a bone club; the crown and the belly are the silhouette.
 * Shape language: round (belly, head, fists, feet) with sharp points for menace (crown, horns,
 *   ears, tusks, ragged hem).
 * Palette (60/30/10): goblin green skin #7fae3f (belly #9cc456), grey vest #5a5450 and grey fur
 *   #a89f8c, purple cape #6a3f7a; browns for belt #8a5a35, loincloth #6b4226 and club haft;
 *   gold #d4a93a with a red gem #c8423a as the accent; ivory #efe4cc for horns, tusks, club head.
 * Value plan: the gold crown and the white tusks and eyes hold the strongest contrast; the
 *   dark vest and the purple cape frame the bright belly.
 * Bodies: skin, teeth, belly, limbs, crown, gem, horns, collar, cape, vest, studs, belt,
 *   buckle, loincloth, club-haft, club-gold, club-bone.
 * Rig: the warrior's skeleton, `knot` renamed `cape` (the hem of the cape) and `dagger` renamed
 *   `club` (rigid child of `hand.R`). Clips: idle, walk, run, attack (an overhead smash),
 *   attack2 (a wide sweep), hit, death.
 */

const C = {
  skin: '#7fae3f',
  skinDark: '#5f8a2c',
  skinLight: '#a3cc5a',
  belly: '#9cc456',
  earInner: '#b5c46a',
  blush: '#c4b84c',
  eyeWhite: '#f7f1e6',
  iris: '#2a2016',
  irisLow: '#3d2c1c',
  pupil: '#1a1416',
  lid: '#1d1a22',
  brow: '#6b4226',
  mouth: '#3a1c1c',
  tooth: '#f4ecd8',
  ivory: '#efe4cc',
  gold: '#d4a93a',
  gem: '#c8423a',
  fur: '#a89f8c',
  furDark: '#7f7666',
  cape: '#6a3f7a',
  capeDark: '#4a2c58',
  vest: '#5a5450',
  stud: '#4a4f55',
  strap: '#48433f',
  belt: '#8a5a35',
  loin: '#6b4226',
  wood: '#6b4226',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.7;
const HEAD_S = 1.12 * 1.06; // the head is about 19 percent bigger than the warrior's
const HEAD_LIFT = 0.035;
const HEAD = [0.205, 0.168, 0.205] as const;
const EYE = [0.108, 0.655] as const; // x (each side), y, in the head's own frame
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** A point in the head's own frame (as the warrior's head was built) to its place on the king. */
const hp = (p: V3): V3 => [p[0] * HEAD_S, HEAD_Y + HEAD_LIFT + (p[1] - HEAD_Y) * HEAD_S, p[2] * HEAD_S];
/** The head's own frame to the king's frame. */
const headPose = (s: sdf.Shape) => s.at(0, -HEAD_Y, 0).scale(HEAD_S).at(0, HEAD_Y + HEAD_LIFT, 0);

// Joints. The legs are 10 percent shorter than the warrior's; the arms are wider apart to clear the belly.
const SHOULDER: V3 = [0.17, 0.405, 0];
const ELBOW: V3 = [0.255, 0.335, 0.015];
const WRIST: V3 = [0.275, 0.255, 0.04];
const ELBOW_R: V3 = [-0.255, 0.34, 0.03];
const WRIST_R: V3 = [-0.285, 0.29, 0.105];
const HIP: V3 = [0.085, 0.2, 0];
const ANKLE: V3 = [0.115, 0.081, 0];
const KNEE: V3 = [0.1, 0.1405, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The club: its haft axis points up, out, and forward; the origin of its frame sits just above the fist.
const CLUB_TILT = { z: 18, x: 20 };
const DEG = Math.PI / 180;
const GRIP_DIR = norm([
  -Math.sin(CLUB_TILT.z * DEG),
  Math.cos(CLUB_TILT.z * DEG) * Math.cos(CLUB_TILT.x * DEG),
  Math.cos(CLUB_TILT.z * DEG) * Math.sin(CLUB_TILT.x * DEG),
]);
const FIST_R = add(WRIST_R, norm([WRIST_R[0] - ELBOW_R[0], WRIST_R[1] - ELBOW_R[1], WRIST_R[2] - ELBOW_R[2]]), 0.04);
const GUARD = add(FIST_R, GRIP_DIR, 0.05);
const clubPose = (s: sdf.Shape) => s.rotateZ(CLUB_TILT.z).rotateX(CLUB_TILT.x).at(...GUARD);

/** A relaxed fist hanging from the wrist `w`. */
const fistAt = (w: V3) =>
  sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.052, 0.056, 0.056]).at(w[0] + 0.008, w[1] - 0.048, w[2] + 0.004),
    sdf.capsule([w[0] - 0.012, w[1] - 0.076, w[2] + 0.038], [w[0] - 0.008, w[1] - 0.048, w[2] + 0.056], 0.022),
    sdf.cone([w[0] + 0.026, w[1] - 0.028, w[2] + 0.032], [w[0] + 0.001, w[1] - 0.04, w[2] + 0.062], 0.021, 0.016),
  );

export default defineAsset({
  name: 'goblin-king',
  description: 'Fat goblin king boss with a crooked gold crown between ivory horns, tusks, a fur collar, a purple cape, a studded vest, and a bone club.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/goblin-king_001.jpg',
  // Color slots for individual kings (the first option is the default look).
  variants: {
    eyes: { dark: C.iris, amber: '#5e2812', yellow: '#8f7010', red: '#7a0e0a' },
    skin: { green: C.skin, moss: '#66803a', grey: '#8a9a76' },
    cloth: { purple: C.cape, crimson: '#8a2e34', teal: '#2f6f78' },
    leather: { brown: C.belt, black: '#453830', tan: '#a8794a' },
  },
  presets: {
    swamp: { eyes: 'yellow', skin: 'moss', cloth: 'teal', leather: 'brown' },
    cave: { eyes: 'red', skin: 'grey', cloth: 'crimson', leather: 'black' },
    dune: { eyes: 'yellow', skin: 'green', cloth: 'crimson', leather: 'tan' },
  },

  build(k) {
    const TS = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      skin: k.tint('skin'),
      skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
      belly: k.tint('skin', { color: C.belly, follow: 1 }),
      earInner: k.tint('skin', { color: C.earInner, follow: 1 }),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cape: k.tint('cloth'),
      capeDark: k.tint('cloth', { color: C.capeDark, follow: 1 }),
      belt: k.tint('leather'),
      loin: k.tint('leather', { color: C.loin, follow: 1 }),
    };
    const EAR: V3 = hp([0.165, 0.7, -0.01]);
    const CAPE_AT: V3 = [0, 0.32, -0.19];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.27, 0] },
      chest: { parent: 'spine', at: [0, 0.35, 0] },
      neck: { parent: 'chest', at: [0, 0.46, -0.01] },
      head: { parent: 'neck', at: [0, 0.52, -0.01] },
      'ear.L': { parent: 'head', at: EAR, tail: hp([0.37, 0.82, -0.15]) },
      'ear.R': { parent: 'head', at: mx(EAR), tail: hp([-0.37, 0.82, -0.15]) },
      cape: { parent: 'chest', at: CAPE_AT, tail: [0, 0.16, -0.22] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      club: { parent: 'hand.R', at: GUARD },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and ears (the warrior's, in its own frame)
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
    const nose = sdf.ellipsoid([0.04, 0.03, 0.032]).at(0, 0.6, faceZ(0, 0.6) - 0.006).bone('head');

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
    const earPose = (s: sdf.Shape) => s.scale(1.06).rotateX(-28).rotateY(32).at(0.165, 0.7, -0.01);
    // Two small V nicks in the lower edge of the left ear, near the tip: a fighter's ear.
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
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.56, -0.01], 0.075).bone('neck');

    // Arms: bare green arms and big fists; the right fist holds the club.
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.054, 0.046).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.046, 0.042).bone('forearm.L'),
      fistAt(WRIST).bone('hand.L'),
    );
    const fistR = clubPose(
      sdf.smoothUnion(
        0.018,
        sdf.ellipsoid([0.052, 0.058, 0.054]).at(0, -0.05, 0),
        sdf.capsule([0.022, -0.082, 0.032], [0.024, -0.02, 0.034], 0.022), // curled fingers
        sdf.cone([-0.034, -0.02, 0.02], [0.012, -0.004, 0.036], 0.021, 0.015), // thumb over the fingers
      ),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.054, 0.046).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.046, 0.042).bone('forearm.R'),
      fistR.bone('hand.R'),
    );

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.048, 0.05, 0.07]), EYE[0], EYE[1]));
    // The irises look in toward the nose: a sly, scheming glance.
    const IRIS_X = EYE[0] - 0.011;
    const iris = pair(at(sdf.ellipsoid([0.034, 0.042, 0.07]), IRIS_X, EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.016));
    const pupil = pair(at(sdf.ellipsoid([0.016, 0.024, 0.07]), IRIS_X + 0.002, EYE[1] - 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.014, 12, 172), 0.3).at(EYE[0], EYE[1] - 0.002, 0.1));
    const lowLid = pair(sdf.extrude(profile.arc(0.049, 0.005, 200, 340), 0.3).at(EYE[0], EYE[1] + 0.001, 0.1));
    const shine = sdf.union(...[IRIS_X, -IRIS_X].map((x) => at(sdf.sphere(0.007), x + 0.009, EYE[1] + 0.011)));
    // Thick angry brows: the inner ends dip toward the nose.
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.172, 0.776],
              [0.125, 0.784],
              [0.082, 0.754],
              [0.048, 0.708],
              [0.058, 0.684],
              [0.095, 0.71],
              [0.13, 0.73],
              [0.168, 0.742],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // A wide grin: a dark slab across the lower face, a painted row of cream teeth along its upper
    // edge, and two wrinkles on each cheek.
    const upperEdge = (x: number) => 0.55 + 0.026 * (x / 0.085) ** 2;
    const mouth = sdf
      .extrude(
        profile.polygon(
          [
            [-0.085, 0.578],
            [-0.045, 0.556],
            [0, 0.55],
            [0.045, 0.556],
            [0.085, 0.578],
            [0.078, 0.548],
            [0.045, 0.522],
            [0, 0.514],
            [-0.045, 0.522],
            [-0.078, 0.548],
          ],
          { smooth: true, samples: 4 },
        ),
        0.3,
      )
      .at(0, 0, 0.1);
    const teeth = sdf.union(
      ...[-0.07, -0.05, -0.03, -0.01, 0.01, 0.03, 0.05, 0.07].map((x) =>
        sdf.box([0.014, 0.017, 0.3], 0.002).at(x, upperEdge(x) - 0.009, 0.1),
      ),
    );
    const wrinkles = pair(
      sdf.union(
        sdf.extrude(profile.arc(0.05, 0.005, -55, 45), 0.3).at(0.078, 0.575, 0.1),
        sdf.extrude(profile.arc(0.064, 0.005, -50, 40), 0.3).at(0.078, 0.575, 0.1),
      ),
    );
    const blush = pair(at(sdf.ellipsoid([0.03, 0.018, 0.07]), 0.152, 0.582));
    const noseFront = sdf.raycast(nose, [0, 0.59, 1], [0, 0, -1])![2];
    const nostrils = pair(sdf.sphere(0.0075).at(0.017, 0.581, noseFront - 0.012));

    const ridge = pair(sdf.capsule([0.06, 0.712, faceZ(0.06, 0.712) - 0.014], [0.162, 0.748, faceZ(0.162, 0.748) - 0.012], 0.02)).bone('head');
    const headSkin = sdf
      .smoothUnion(0.012, head, nose)
      .smoothUnion(0.02, ridge)
      .smoothUnion(0.02, ears)
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
      .paintWhere(teeth, C.tooth)
      .paintWhere(wrinkles, TS.skinDark, 0.003)
      .paintWhere(nostrils, TS.skinDark, 0.004);
    const skin = sdf.smoothUnion(0.03, headPose(headSkin), neck).union(armL, armR);
    k.body('skin', skin, { color: TS.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // Two tusks jut up from the lower jaw and hook over the lip at the corners of the grin.
    const TUSK_X = 0.066;
    const tuskZ = faceZ(TUSK_X, 0.54);
    const tusk = sdf
      .cone([0, 0, 0], [0.004, 0.046, 0.006], 0.023, 0.006)
      .scale([1, 1, 0.75])
      .at(TUSK_X, 0.532, tuskZ - 0.004);
    k.body('teeth', headPose(pair(tusk)).bone('head'), { color: C.tooth, roughness: 0.35, detail: 0.003 });

    // ------------------------------------------------------------------ crown and horns
    // The band hugs the head (two ellipsoid shells cut by a slab); five points rise from its rim.
    // The whole crown sits a little crooked.
    const HC = [0, HEAD_Y + HEAD_LIFT, -0.005 * HEAD_S] as const; // the head's center
    const R = [HEAD[0] * HEAD_S, HEAD[1] * HEAD_S, HEAD[2] * HEAD_S] as const;
    const shell = (s: number) => sdf.ellipsoid([R[0] * s, R[1] * s, R[2] * s]).at(...HC);
    const BAND_LO = HC[1] + 0.078;
    const BAND_HI = HC[1] + 0.155;
    const bandSlab = sdf.box([1, BAND_HI - BAND_LO, 1], 0.004).at(0, (BAND_LO + BAND_HI) / 2, 0);
    const band = shell(1.08).subtract(shell(0.95)).intersect(bandSlab);
    const rimR = (y: number) => {
      const dy = (y - HC[1]) / (R[1] * 1.035);
      return R[0] * 1.035 * Math.sqrt(Math.max(0, 1 - dy * dy));
    };
    const point = (angle: number, h: number, w: number) => {
      const y0 = BAND_HI - 0.018;
      const r0 = rimR(y0) - 0.004;
      const a = angle * DEG;
      const base: V3 = [r0 * Math.sin(a), y0, HC[2] + r0 * Math.cos(a)];
      const tip: V3 = [(r0 + 0.012) * Math.sin(a), y0 + h, HC[2] + (r0 + 0.012) * Math.cos(a)];
      return sdf.union(sdf.cone(base, tip, w, 0.008).round(0.003), sdf.sphere(0.014).at(...tip));
    };
    const points = sdf.union(point(0, 0.145, 0.05), point(58, 0.095, 0.046), point(-58, 0.095, 0.046), point(122, 0.08, 0.042), point(-122, 0.08, 0.042));
    const crownPose = (s: sdf.Shape) => s.at(-HC[0], -HC[1], -HC[2]).rotateZ(-7).rotateX(-4).at(...HC);
    // A row of small gold beads around the foot of the band.
    const beads = sdf.union(
      ...Array.from({ length: 16 }, (_, i) => {
        const a = (i * 360) / 16;
        const y = BAND_LO + 0.008;
        const r = rimR(y) + 0.004;
        return sdf.sphere(0.0105).at(r * Math.sin(a * DEG), y, HC[2] + r * Math.cos(a * DEG));
      }),
    );
    const crown = crownPose(sdf.smoothUnion(0.01, band, points, beads));
    k.body('crown', crown.bone('head'), { color: C.gold, roughness: 0.3, metalness: 1, detail: 0.0045 });
    // The gem on the front of the band, and a small gem at each side.
    const gemAt = (angle: number, size: number) => {
      const a = angle * DEG;
      const y = (BAND_LO + BAND_HI) / 2 + 0.004;
      const r = rimR(y) + 0.004;
      return sdf
        .ellipsoid([size, size * 1.35, size * 0.55])
        .rotateY(angle)
        .at(r * Math.sin(a), y, HC[2] + r * Math.cos(a));
    };
    // The center gem: a rounded box turned to a diamond, set on the front of the tallest point.
    const centerR = rimR(BAND_HI - 0.018) - 0.004;
    const centerGem = sdf.box([0.035, 0.035, 0.016], 0.006).rotateZ(45).at(0, BAND_HI - 0.018 + 0.048, HC[2] + centerR + 0.04);
    const gems = crownPose(sdf.union(centerGem, gemAt(58, 0.011), gemAt(-58, 0.011)));
    k.body('gem', gems.bone('head'), { color: C.gem, roughness: 0.15, metalness: 0.2, flat: true, detail: 0.003, emissive: C.gem, emissiveIntensity: 0.35 });
    // Two small ivory horns curve up beside the crown.
    const horn = sdf
      .chain(
        [
          [0.16, 0.825, -0.005, 0.052],
          [0.212, 0.895, -0.01, 0.042],
          [0.24, 0.968, -0.01, 0.028],
          [0.222, 1.03, -0.005, 0.011],
        ],
        0.03,
      )
      .bone('head');
    k.body('horns', hard(horn), { color: C.ivory, roughness: 0.45, detail: 0.005 });

    // ------------------------------------------------------------------ belly, legs, feet
    const belly = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid([0.215, 0.16, 0.2]).at(0, 0.31, 0.02).bone('spine'),
        sdf.ellipsoid([0.185, 0.1, 0.14]).at(0, 0.43, -0.015).bone('chest'),
        sdf.ellipsoid([0.16, 0.065, 0.13]).at(0, 0.205, 0).bone('hips'),
      );
    const bellyFront = sdf.raycast(belly, [0, 0.3, 1], [0, 0, -1])![2];
    const navel = sdf.sphere(0.016).at(0, 0.3, bellyFront + 0.004);
    k.body('belly', belly.paintWhere(navel, TS.skinDark, 0.008), { color: TS.belly, roughness: 0.55, detail: 0.006 });

    // A big bare foot built at the ankle's ground point, then turned out; three fat toes.
    const toe = (x: number, len: number) => sdf.capsule([x, 0.036, 0.1], [x * 1.18, 0.03, 0.1 + len], 0.027);
    const footLocal = sdf
      .smoothUnion(
        0.022,
        sdf.cylinder(0.052, 0.1, 0.02).at(0, 0.055, -0.012),
        sdf.ellipsoid([0.075, 0.05, 0.115]).at(0, 0.05, 0.04),
        toe(-0.043, 0.075),
        toe(0, 0.09),
        toe(0.043, 0.07),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const foot = footLocal.rotateY(16).at(ANKLE[0], 0, 0).bone('foot.L');
    const legs = sdf.smoothUnion(
      0.02,
      pair(
        sdf.smoothUnion(
          0.02,
          sdf.cone(HIP, KNEE, 0.068, 0.058).bone('leg.L'),
          sdf.cone(KNEE, ANKLE, 0.058, 0.048).bone('shin.L'),
          foot,
        ),
      ),
    );
    k.body('limbs', legs, { color: TS.skin, roughness: 0.55, detail: 0.006 });

    // ------------------------------------------------------------------ the torso surface the clothes follow
    const torso = belly;

    // Fur collar: a torus with a noisy surface, tipped down in front and up at the back.
    const collar = sdf
      .torus(0.185, 0.052)
      .scale([1, 1, 0.92])
      .displace(0.004, (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 2))
      .rotateX(10)
      .at(0, 0.462, -0.012);
    const furDark = rgb(C.furDark);
    const furPainted = collar.paintFn((x, y, z, base) => {
      const n = noise.fbm(x * 60, y * 30, z * 60, 2);
      return n > 0.15 ? furDark : base;
    });
    k.body('collar', furPainted.bone('chest'), {
      color: C.fur,
      roughness: 0.95,
      detail: 0.007,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 160, y * 160, z * 160, 2),
    });

    // Cape: a dome over the shoulders and a panel hanging down the back with a wavy hem.
    const mantle = sdf
      .ellipsoid([0.265, 0.1, 0.2])
      .at(0, 0.42, -0.01)
      .subtract(sdf.ellipsoid([0.25, 0.086, 0.186]).at(0, 0.42, -0.01))
      .intersect(sdf.box([1, 0.3, 1]).at(0, 0.405 + 0.15, 0))
      .subtract(sdf.cylinder(0.105, 1).at(0, 0.45, 0.01));
    const hem = profile.polygon(
      [
        [-0.23, 0.55],
        [0.23, 0.55],
        [0.23, 0.2],
        [0.19, 0.16],
        [0.14, 0.205],
        [0.09, 0.15],
        [0.04, 0.2],
        [-0.01, 0.145],
        [-0.06, 0.2],
        [-0.11, 0.15],
        [-0.16, 0.205],
        [-0.2, 0.16],
        [-0.23, 0.2],
      ],
      { smooth: false },
    );
    const panel = torso
      .round(0.032)
      .subtract(torso.round(0.006))
      .intersect(sdf.box([0.5, 0.45, 0.4]).at(0, 0.34, -0.2))
      .intersect(sdf.extrude(hem, 1));
    const capeUp = panel.intersect(sdf.halfSpace([0, -1, 0], -0.32)).bone('chest');
    const capeLow = panel.intersect(sdf.halfSpace([0, 1, 0], 0.32)).bone('cape');
    // Two flaps of cloth lie over the shoulders, tilted down at the outer edge.
    const flap = (sign: number) => sdf.box([0.14, 0.03, 0.1], 0.008).rotateZ(-25 * sign).at(0.225 * sign, 0.468, 0);
    const flaps = sdf.union(flap(1), flap(-1)).bone('chest');
    const cape = sdf
      .smoothUnion(0.012, mantle.bone('chest'), capeUp, capeLow, flaps)
      .paintWhere(sdf.box([1, 0.1, 1]).at(0, 0.165, 0), TS.capeDark, 0.02);
    k.body('cape-cloth', cape, { color: TS.cape, roughness: 0.85, detail: 0.006 });

    // Vest: two grey leather panels open over the belly, three studs on each.
    const vestOutline = profile.polygon(
      [
        [0.04, 0.53],
        [0.3, 0.53],
        [0.3, 0.33],
        [0.2, 0.295],
        [0.13, 0.31],
        [0.075, 0.42],
      ],
      { smooth: false },
    );
    const vestL = torso.round(0.013).intersect(sdf.extrude(vestOutline, 1));
    const vest = hard(vestL);
    k.body('vest', vest.bone('chest'), {
      color: C.vest,
      roughness: 0.75,
      detail: 0.005,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
    const studAt = (x: number, y: number) => sdf.surfacePoint(vestL, [x, y, 0.4], 0.002);
    const studs = hard(sdf.union(...[[0.13, 0.415], [0.205, 0.445], [0.205, 0.37], [0.255, 0.405]].map(([x, y]) => sdf.sphere(0.014).at(...studAt(x!, y!)))));
    k.body('studs', studs.bone('chest'), { color: C.stud, roughness: 0.4, metalness: 0.8, detail: 0.004 });

    // Two grey leather straps cross the chest, with a bone medallion where they meet.
    const strapBand = (angle: number) => torso.round(0.02).smoothIntersect(0.005, sdf.box([0.8, 0.05, 0.8], 0.006).rotateZ(angle).at(0, 0.41, 0));
    const straps = sdf.union(strapBand(35), strapBand(-35)).intersect(sdf.box([0.8, 0.5, 0.5]).at(0, 0.41, 0.25));
    k.body('straps', straps.bone('chest'), { color: C.strap, roughness: 0.7, detail: 0.006 });
    const medZ = sdf.raycast(straps, [0, 0.41, 1], [0, 0, -1])![2];
    const medallion = sdf.cylinder(0.03, 0.012, 0.004).rotateX(90).at(0, 0.41, medZ + 0.002);
    k.body('medallion', medallion.bone('chest'), { color: C.ivory, roughness: 0.5, detail: 0.003 });

    // Belt and the big gold buckle.
    const BELT_Y = 0.235;
    const belt = torso.round(0.016).smoothIntersect(0.006, sdf.box([0.7, 0.06, 0.7], 0.006).at(0, BELT_Y, 0));
    k.body('belt', belt.bone('spine'), { color: TS.belt, roughness: 0.6, detail: 0.005 });
    const beltZ = sdf.raycast(belt, [0, BELT_Y, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.108, 0.078, 0.016], 0.008).subtract(sdf.box([0.062, 0.042, 0.04], 0.006)),
        sdf.box([0.012, 0.05, 0.012], 0.004).at(0.004, 0, 0.004),
      )
      .at(0, BELT_Y, beltZ + 0.002);
    k.body('buckle', buckle.bone('spine'), { color: C.gold, roughness: 0.3, metalness: 1, detail: 0.003 });

    // Loincloth: a ragged apron in front of the hips, its hem cut into tabs.
    const apron = sdf
      .revolve(
        profile.polygon(
          [
            [0.19, 0.255],
            [0.225, 0.255],
            [0.21, 0.2],
            [0.185, 0.115],
            [0.165, 0.11],
            [0.185, 0.2],
          ],
          { smooth: false },
        ),
      )
      .scale([1, 1, 0.86])
      .intersect(sdf.box([0.3, 0.2, 0.4]).at(0, 0.17, 0.2));
    // Five hanging strips, each with a pointed hem of its own length.
    const strip = (x: number, bot: number) =>
      apron.intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.021, 0.3],
              [0.021, 0.3],
              [0.021, bot + 0.022],
              [0, bot],
              [-0.021, bot + 0.022],
            ]),
            1,
          )
          .at(x, 0, 0),
      );
    const loin = sdf.union(strip(-0.11, 0.135), strip(-0.055, 0.112), strip(0, 0.145), strip(0.055, 0.118), strip(0.11, 0.14));
    k.body('loincloth', loin.bone('hips'), {
      color: TS.loin,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 100, y * 100, z * 100, 2),
    });

    // ------------------------------------------------------------------ the bone club in the right hand
    // Local frame: the origin just above the fist, the haft up (+Y).
    const clubWood = sdf
      .union(
        sdf.cone([0, -0.115, 0], [0, 0.29, 0], 0.028, 0.036).round(0.004),
        sdf.cone([0, 0.27, 0], [0, 0.335, 0], 0.038, 0.066).round(0.003), // a flared cap under the ring
      )
      ;
    k.body('club-haft', clubPose(clubWood), {
      color: C.wood,
      roughness: 0.75,
      detail: 0.004,
      bone: 'club',
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 12, z * 60, 3),
    });
    k.body('club-gold', clubPose(sdf.cylinder(0.066, 0.018, 0.007).at(0, 0.344, 0)), { color: C.gold, roughness: 0.3, metalness: 1, detail: 0.003, bone: 'club' });
    const knob = sdf.smoothUnion(
      0.02,
      sdf.cone([0, 0.345, 0], [0, 0.4, 0], 0.046, 0.058),
      sdf.sphere(0.066).at(0, 0.43, 0),
      sdf.sphere(0.052).at(0.052, 0.472, 0.014),
      sdf.sphere(0.05).at(-0.05, 0.466, -0.01),
      sdf.sphere(0.048).at(0.004, 0.515, 0.005),
    );
    k.body('club-bone', clubPose(knob), { color: C.ivory, roughness: 0.5, detail: 0.004, bone: 'club' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, follow, quat, euler } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        spine: { rotate: [1.5 * wave(p), 0, 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'ear.L': { rotate: [0, 0, 4 * wave(p, 1, 0.35)] },
        'ear.R': { rotate: [0, 0, -4 * wave(p, 1, 0.35)] },
        cape: { rotate: [3 * wave(p, 1, 0.3), 0, 3 * wave(p, 1, 0.2)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    // The legs come from motion.gait (planted feet, a knee lift, heel strike and toe-off). The
    // heavy king waddles: the hips turn more and the cape swings twice per cycle.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 9 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.1, 0, -0.053],
          toe: [0.154, 0, 0.135],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -13 * s, 0] as const },
          head: { rotate: [-lean, 6 * s, 0] as const },
          'ear.L': { rotate: [0, lean * 0.8 + 3 * wave(p, 2, 0.2), 7 * wave(p, 2, 0.15)] as const },
          'ear.R': { rotate: [0, -lean * 0.8 - 3 * wave(p, 2, 0.2), -7 * wave(p, 2, 0.15)] as const },
          cape: { rotate: [lean * 1.5 + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.3 * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(1.0, 0.09, 0.028, 0.6, 24, 3, 0.008));
    k.animation('run', stride(0.6, 0.14, 0.05, 0.4, 44, 11, 0.03));

    // ---- club swings, solved by targets. The guard (the point just above the fist) follows a path
    // in world space; each frame converts it into the chest's rest frame (the hips, spine, and
    // chest turn under the arm), reach solves the arm, and orient turns the fist so the club points
    // along the path direction.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.27, 0], [0, 0.35, 0]]; // hips, spine, chest pivots
    const FLAT: V3 = [0, -Math.sin(CLUB_TILT.x * DEG), Math.cos(CLUB_TILT.x * DEG)]; // the fist's roll reference at rest
    const GRIP_OFFSET: V3 = [GUARD[0] - WRIST_R[0], GUARD[1] - WRIST_R[1], GUARD[2] - WRIST_R[2]];
    /** A club direction from a yaw (0 = forward, + toward +X) and a pitch (90 = straight up), degrees. */
    const yp = (yaw: number, pitch: number): V3 => [
      Math.sin(yaw * DEG) * Math.cos(pitch * DEG),
      Math.sin(pitch * DEG),
      Math.cos(yaw * DEG) * Math.cos(pitch * DEG),
    ];
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
    /** The arm rotations that put the guard at `guard`, the club along `dirW`, the elbow toward `pole`. */
    const swing = (guard: V3, dirW: V3, pole: V3, rots: readonly V3[], move: V3) => {
      const frame = chestFrame(rots, move);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...GRIP_DIR), new THREE.Vector3(...dirW));
      const f = new THREE.Vector3(...FLAT).applyQuaternion(q);
      const off = new THREE.Vector3(...GRIP_OFFSET).applyQuaternion(q);
      const wrist: V3 = [guard[0] - off.x, guard[1] - off.y, guard[2] - off.z];
      const arm = reach(ARM_R, frame.point(wrist), frame.point(pole));
      const hand = orient([arm.upper, arm.lower], { dir: GRIP_DIR, up: FLAT }, { dir: frame.dir(dirW), up: frame.dir([f.x, f.y, f.z]) });
      return { arm, hand };
    };

    // attack: an overhead smash. The king leans back and raises the club straight up beside his
    // head, then drops forward and brings it down in front of his feet. The ears flop late.
    const G_UP: V3 = [-0.32, 0.55, 0.06];
    const G_HIT: V3 = [-0.28, 0.4, 0.25];
    const P_UP: V3 = [-0.42, 0.4, -0.06];
    const P_HIT: V3 = [-0.36, 0.34, 0.15];
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const coil = keys(p, [[0, 0], [0.32, 1], [0.42, 1], [0.5, 0]] as const);
        const lunge = keys(p, [[0.42, 0], [0.52, 1], [0.68, 1], [0.9, 0.15], [1, 0]] as const);
        const step = keys(p, [[0.42, 0], [0.48, 1], [0.55, 0]] as const);
        const aim = keys(p, [[0, 0], [0.3, 1], [0.82, 1], [1, 0]] as const);
        const s0 = keys(p, [[0.42, 0], [0.53, 1]] as const);
        const s = s0 * s0; // the club speeds up into the ground
        const flop = keys(p, [[0.46, 0], [0.6, 1], [0.72, 0.8], [1, 0]] as const);
        const legL = -6 * coil + 16 * lunge;
        const legR = -6 * coil - 16 * lunge - 6 * step;
        const hipsMove: V3 = [0, -legDrop(LEG, legL), LEG * Math.sin(legL * DEG)];
        const hipsR: V3 = [0, -5 * coil + 3 * lunge, 0];
        const spineR: V3 = [-10 * coil + 17 * lunge, -5 * coil + 4 * lunge, 0];
        const chestR: V3 = [-6 * coil + 9 * lunge, -7 * coil + 5 * lunge, 0];
        const pathG = lerp(G_UP, G_HIT, s);
        const pathD = yp(-8 - 8 * s, 92 - 134 * s);
        const w = 4 * aim * (1 - aim); // while blending to and from rest the club swings wide of the head
        const guard = add(lerp(GUARD, pathG, aim), [-0.1, 0, 0], w);
        const rest = norm(GRIP_DIR);
        const dirW = norm(add(lerp(rest, pathD, aim), [-1.0, 0, 0], w));
        const pole = lerp(ELBOW_R, lerp(P_UP, P_HIT, s), aim);
        const { arm, hand } = swing(guard, dirW, pole, [hipsR, spineR, chestR], hipsMove);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          head: { rotate: [4 * coil - 14 * lunge, 8 * coil - 4 * lunge, 0] },
          'ear.L': { rotate: [6 * flop, 12 * flop - 4 * coil, 5 * coil - 6 * flop] },
          'ear.R': { rotate: [6 * flop, -12 * flop + 4 * coil, -5 * coil + 6 * flop] },
          cape: { rotate: [12 * flop - 6 * coil, 0, 6 * flop] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          // The empty left arm swings up for balance and drops with the club.
          'upperarm.L': { rotate: [-16 * coil + 26 * lunge, 0, 8 * coil + 12 * lunge] },
          'forearm.L': { rotate: [-22 * coil - 10 * lunge, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'leg.R': { rotate: [legR, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'foot.R': { rotate: [-legR - 8 * step, 0, 0] },
        };
      },
    });

    // attack2: a wide sweep at waist height. The king winds up to the right with the club pointing
    // back, then twists through and swings it across the front to the left.
    const G_WIND: V3 = [-0.36, 0.42, -0.12];
    const G_END: V3 = [-0.06, 0.4, 0.29];
    const P_WIND: V3 = [-0.4, 0.3, -0.1];
    const P_END: V3 = [-0.38, 0.3, 0.12];
    k.animation('attack2', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const coil = keys(p, [[0, 0], [0.34, 1], [0.42, 1], [0.5, 0]] as const);
        const lunge = keys(p, [[0.4, 0], [0.56, 1], [0.7, 1], [0.92, 0.1], [1, 0]] as const);
        const step = keys(p, [[0.4, 0], [0.47, 1], [0.54, 0]] as const);
        const aim = keys(p, [[0, 0], [0.3, 1], [0.78, 1], [1, 0]] as const);
        const s0 = keys(p, [[0.42, 0], [0.6, 1]] as const);
        const s = s0 * s0 * (3 - 2 * s0);
        const flop = keys(p, [[0.46, 0], [0.62, 1], [0.76, 0.6], [1, 0]] as const);
        const legL = -5 * coil + 12 * lunge;
        const legR = -5 * coil - 12 * lunge - 6 * step;
        const hipsMove: V3 = [0, -legDrop(LEG, legL), LEG * Math.sin(legL * DEG)];
        const hipsR: V3 = [0, -12 * coil + 12 * lunge, 0];
        const spineR: V3 = [6 * coil + 4 * lunge, -14 * coil + 14 * lunge, 0];
        const chestR: V3 = [2 * coil + 2 * lunge, -14 * coil + 14 * lunge, 0];
        const pathG = lerp(G_WIND, G_END, s);
        const pathD = yp(-135 + 195 * s, 8 - 2 * s);
        const guard = lerp(GUARD, pathG, aim);
        const dirW = norm(lerp(norm(GRIP_DIR), pathD, aim));
        const pole = lerp(ELBOW_R, lerp(P_WIND, P_END, s), aim);
        const { arm, hand } = swing(guard, dirW, pole, [hipsR, spineR, chestR], hipsMove);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          head: { rotate: [0, 30 * coil - 34 * lunge, 0] },
          'ear.L': { rotate: [4 * flop, 10 * flop, 5 * coil - 6 * flop] },
          'ear.R': { rotate: [4 * flop, -10 * flop, -5 * coil + 6 * flop] },
          cape: { rotate: [8 * flop, 0, 12 * flop - 6 * coil] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: [-10 * coil + 12 * lunge, 0, 12 * coil + 16 * lunge] },
          'forearm.L': { rotate: [-20 * coil - 8 * lunge, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'leg.R': { rotate: [legR, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'foot.R': { rotate: [-legR - 8 * step, 0, 0] },
        };
      },
    });

    // ---- hit: a blow from the front. The head and chest snap back and the hips give way: the left
    // foot stays planted and the right foot steps back, then all returns quickly.
    const SHIN = HIP[1] - ANKLE[1]; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.075; // the back of the foot, behind the ankle's ground point
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const flop = keys(p, [[0.08, 0], [0.3, 1], [0.5, -0.4], [0.68, 0.15], [0.85, 0]] as const);
        const back = 0.026 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, -5 * h] },
          'ear.L': { rotate: [4 * flop, -10 * flop, 6 * flop] },
          'ear.R': { rotate: [4 * flop, 10 * flop, -6 * flop] },
          cape: { rotate: [-14 * flop, 0, 8 * flop] },
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

    // ---- death: a stagger, then a fall on the back. The blow snaps the chest back, the king slumps
    // forward and wobbles, then tips back over his heels as one piece and lands on his back. The
    // arms are solved by targets in the chest's rest frame and lie out on the ground. The club
    // bone carries the club to lie on the ground beside the right hand. The ears flop down last.
    const LIE = 84; // the hips' final tilt back, degrees
    const LIE_Y = 0.2; // the hips' height when the king lies on his back (his belly and cape are thick)
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const HAND_CHAIN: readonly V3[] = [...TRUNK, mx(SHOULDER), ELBOW_R, WRIST_R];
    const DROP_AT: V3 = [-0.45, 0.095, -0.28]; // the guard on the ground, the knob toward the feet
    const DROP_TURN = quat(orient([], { dir: GRIP_DIR, up: FLAT }, { dir: norm([-0.3, -0.05, 1]), up: [0, 1, 0] }));
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
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * Math.min(1, Math.max(0, (tilt - 66) / 18)); // the legs come down once the hips hold
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.29, 0.34, -0.07], land), lerp(ELBOW_R, [-0.27, 0.3, -0.2], land));
        const standL = add(add(add(WRIST, [0.05, 0.05, 0.06], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.08], fly);
        const armL = reach(ARM_L, lerp(standL, [0.29, 0.34, -0.07], land), lerp(ELBOW, [0.27, 0.3, -0.2], land));
        // The club: attached to the posed hand until the hand opens, then it drops to the ground.
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
          cape: { rotate: [-12 * hitB, 0, 10 * fly + 6 * wob] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          club: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });
  },
});
