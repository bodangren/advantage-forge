import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Cultist — Chibi Quest enemy (catalog `enemies/humanoid/cultist`), a P1 dungeon enemy of the
 * Sunken Vault, about 0.97 m to the point of the hood, faces +Z. Target:
 * docs/enemy-mockups/cultist_001.jpg (made with mmx; one front view). Built on the bandit (the
 * rogue's skeleton with knee bones and the enemy clip set), so the human enemies read as one set.
 *
 * Role: a common caster-thug of the vault; seen in 3D and as a 128 px sprite, the two glowing
 *   eyes in the black hood read first.
 * One idea: a small figure in a big crimson hood with no face, only two purple eyes in the dark,
 *   a ritual dagger in one hand and a black candle with a purple flame in the other.
 * Proportions: the rogue's body (shoulders 0.385, belt 0.25); the hood is larger than a head
 *   (0.49 m wide, point at 0.97); the robe reaches the ankles and small shoes show below it.
 * Shape language: soft and round (hood, robe, fists), with sharp accents (the hood's point, the
 *   curved blade, the slanted eyes, the flame).
 * Palette (60/30/10): crimson robe #7a1e2a, black trim and shadow, grey gloves; the purple glow
 *   #b060ff and the cream bone charm are the accents.
 * Value plan: the darkest mass (the face) holds the brightest spots (the eyes); the cream charm
 *   is the second light mark.
 * Bodies: shadow (the face), eyes, robe (hood, robe, sleeves), trim, hands, legs, shoes, charm,
 *   ring, blade, hilt, candle-wax, candle-flame.
 * Rig: the rogue's skeleton; the dagger is rigid on `dagger` (a child of `hand.R`), the candle on
 *   `candle` (a child of `hand.L`), and the flame on `flame` (it flickers by scale).
 *   Clips: idle, walk, run, attack (a high diagonal slash), hit, death, taunt (a chant with the
 *   candle raised). Attack, hit, and death are the bandit's clips, mirrored to the right hand.
 */

const C = {
  robe: '#7a1e2a',
  robeDark: '#5a1420',
  trim: '#1c181a',
  shadow: '#0e0a0c',
  eye: '#b060ff',
  eyeBase: '#2a1040',
  glove: '#a4a4ac',
  legs: '#2a2226',
  shoe: '#1e1a1c',
  bone: '#e6d8b8',
  boneDark: '#3a2e26',
  ring: '#4a4448',
  wax: '#1e1b20',
  waxTop: '#e8dcc0',
  bladeEdge: '#b4b8c0',
  blade: '#6e7280',
  hilt: '#1e1a1c',
  guard: '#5a5258',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints: both hands low at the sides and a little forward (symmetric arms).
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.19, 0.335, 0.02];
const WRIST_L: V3 = [0.218, 0.262, 0.07];
const ELBOW_R = mx(ELBOW_L);
const WRIST_R = mx(WRIST_L);
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const SOLE_HEEL: V3 = [0.093, 0, -0.024];
const SOLE_TOE: V3 = [0.108, 0, 0.08];
// The left fist's grip (the candle); the dagger's grip is its mirror.
const GRIP: V3 = [WRIST_L[0] + 0.007, WRIST_L[1] - 0.045, WRIST_L[2] + 0.02];
// The candle stands at the outer side of the left fist, clear of the cuff (as in the mockup).
const CANDLE: V3 = [GRIP[0] + 0.05, GRIP[1], GRIP[2] + 0.015];
const CANDLE_TOP = GRIP[1] + 0.115;
const FLAME_AT: V3 = [CANDLE[0], CANDLE_TOP + 0.01, CANDLE[2]];
const HOOD_C: V3 = [0, 0.69, -0.02];
const UP: V3 = [0, 1, 0];
const FWD: V3 = [0, 0, 1];

/** A fist hanging from the wrist `w`; `s` mirrors it for the right hand. Its grip hole runs along Z. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(...o(0.007, -0.038, 0.004)),
    sdf.capsule(o(-0.009, -0.058, 0.03), o(-0.005, -0.038, 0.042), 0.017),
    sdf.cone(o(0.02, -0.023, 0.025), o(0.001, -0.033, 0.048), 0.016, 0.013),
  );
};

export default defineAsset({
  name: 'cultist',
  description: 'Chibi cultist dungeon enemy: a deep crimson hooded robe with black trim, a faceless dark hood with two glowing purple eyes, a bone charm, a curved ritual dagger, and a black candle with a purple flame.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/cultist_001.jpg',
  // Color slots: robe (the hood, robe, and sleeves; the trim stays black) and eyes (the glow of
  // the eyes and the candle flame).
  variants: {
    robe: { crimson: C.robe, black: '#2a2628', green: '#2c4228', blue: '#232c4a' },
    eyes: { purple: C.eye, red: '#ff5040', green: '#6af070' },
  },
  presets: {
    zealot: { robe: 'crimson', eyes: 'red' },
    shade: { robe: 'black', eyes: 'purple' },
    mirecaller: { robe: 'green', eyes: 'green' },
  },

  build(k) {
    const T = {
      robe: k.tint('robe'),
      robeDark: k.tint('robe', { color: C.robeDark, follow: 1 }),
      eye: k.tint('eyes'),
      eyeBase: k.tint('eyes', { color: C.eyeBase, follow: 1 }),
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
      candle: { parent: 'hand.L', at: GRIP },
      flame: { parent: 'candle', at: FLAME_AT },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      dagger: { parent: 'hand.R', at: mx(GRIP) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ the face: a dark void with two eyes
    const face = sdf.ellipsoid([0.17, 0.195, 0.17]).at(0, 0.655, 0.02);
    k.body('shadow', face, { bone: 'head', color: C.shadow, roughness: 0.95 });
    const faceZ = (x: number, y: number) => sdf.raycast(face, [x, y, 1], [0, 0, -1])![2];
    const EYE = [0.085, 0.58] as const;
    // Slanted almond eyes: the outer ends up.
    const eyes = pair(sdf.ellipsoid([0.037, 0.025, 0.02]).rotateZ(14).at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) - 0.011));
    k.body('eyes', eyes, { bone: 'head', color: T.eyeBase, emissive: T.eye, emissiveIntensity: 1.3, roughness: 0.3, detail: 0.003 });

    // ------------------------------------------------------------------ robe: hood, robe, sleeves
    // The hood: larger than the head, a soft point on top, spread over the shoulders as a collar.
    const hoodTop = sdf
      .smoothUnion(0.07, sdf.ellipsoid([0.245, 0.25, 0.235]).at(...HOOD_C), sdf.cone([0, 0.84, -0.05], [0, 0.935, -0.085], 0.09, 0.03))
      .bone('head');
    const collar = sdf.ellipsoid([0.235, 0.09, 0.2]).at(0, 0.465, -0.01).bone('chest');
    const hoodSolid = sdf.smoothUnion(0.08, hoodTop, collar);
    // The face opening: an oval that narrows to a V at the neck.
    const cavity = sdf.smoothUnion(0.04, sdf.ellipsoid([0.168, 0.205, 0.2]).at(0, 0.66, 0.1), sdf.cone([0, 0.56, 0.15], [0, 0.43, 0.2], 0.09, 0.012));
    const hood = hoodSolid.subtract(cavity);
    const robeShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.135, 0.29],
            [0.15, 0.22],
            [0.172, 0.15],
            [0.195, 0.09],
            [0.205, 0.066],
            [0.195, 0.058],
            [0, 0.058],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const sleeve = (s: V3, e: V3, w: V3, up: string, fore: string) =>
      sdf.smoothUnion(0.015, sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.05, 0.053).bone(up), sdf.cone(e, lerp(e, w, 0.72), 0.053, 0.056).bone(fore));
    const robe = sdf
      .union(
        robeShape.bone('spine'),
        hood,
        sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'),
        sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'),
      )
      .paintWhere(cavity.round(0.004), C.shadow, 0.004)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.1), T.robeDark, 0.05);
    k.body('robe', robe, { color: T.robe, roughness: 0.9, bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 30, z * 70, 2) });

    // ------------------------------------------------------------------ trim: the hood's rim, the front bands, the cuffs
    const rim = hoodSolid.round(0.007).intersect(cavity.round(0.024)).subtract(cavity.round(0.002));
    const rimParts = sdf.union(rim.intersect(sdf.halfSpace([0, -1, 0], -0.53)).bone('head'), rim.intersect(sdf.halfSpace([0, 1, 0], 0.53)).bone('chest'));
    const bands = robeShape
      .round(0.006)
      .subtract(robeShape.round(-0.004))
      .intersect(
        pair(
          sdf
            .extrude(
              profile.polygon([
                [0.04, 0.47],
                [0.068, 0.47],
                [0.1, 0.0],
                [0.066, 0.0],
              ]),
              0.4,
            )
            .at(0, 0, 0.2),
        ),
      )
      .bone('spine');
    const cuff = (e: V3, w: V3, fore: string) =>
      sdf
        .cone(lerp(e, w, 0.64), lerp(e, w, 0.8), 0.058, 0.06)
        .subtract(sdf.sphere(0.038).at(...lerp(e, w, 0.98)))
        .bone(fore);
    k.body('trim', sdf.union(rimParts, bands, cuff(ELBOW_L, WRIST_L, 'forearm.L'), cuff(ELBOW_R, WRIST_R, 'forearm.R')), { color: C.trim, roughness: 0.8 });

    // ------------------------------------------------------------------ hands (grey gloves), legs, shoes
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAt(WRIST_R, -1).bone('hand.R'),
    );
    k.body('hands', sdf.union(armL, armR), { color: C.glove, roughness: 0.6, detail: 0.004 });
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.smoothUnion(0.01, sdf.capsule([HIP[0], 0.2, 0], KNEE, 0.045).bone('leg.L'), sdf.capsule(KNEE, [ANKLE[0], 0.06, 0], 0.04).bone('shin.L'))),
    );
    k.body('legs', legs, { color: C.legs, roughness: 0.85, detail: 0.007 });
    const shoe = sdf
      .smoothUnion(0.03, sdf.cylinder(0.046, 0.06, 0.015).at(0, 0.035, 0), sdf.ellipsoid([0.054, 0.044, 0.094]).at(0, 0.04, 0.04))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.55 });

    // ------------------------------------------------------------------ the bone charm on a ring at the neck
    const dark = sdf.union(
      pair(sdf.sphere(0.0075).at(0.012, 0.016, 0.014)), // eye holes
      sdf.sphere(0.005).at(0, 0.003, 0.014), // nose hole
      ...[-0.011, 0, 0.011].flatMap((x) => [sdf.sphere(0.0038).at(x, -0.012, 0.01), sdf.sphere(0.0038).at(x, -0.021, 0.01)]), // teeth holes
    );
    const charm = sdf
      .smoothUnion(0.01, sdf.ellipsoid([0.03, 0.027, 0.014]).at(0, 0.018, 0), sdf.box([0.038, 0.03, 0.018], 0.007).at(0, -0.01, 0))
      .paintWhere(dark, C.boneDark, 0.002)
      .at(0, 0.335, 0.122);
    k.body('charm', charm, { color: C.bone, roughness: 0.6, bone: 'chest', detail: 0.003, textureDensity: 2 });
    k.body('ring', sdf.torus(0.013, 0.0035).rotateX(90).at(0, 0.393, 0.124), { color: C.ring, roughness: 0.4, metalness: 0.7, bone: 'chest', detail: 0.003 });

    // ------------------------------------------------------------------ the ritual dagger in the right hand
    // Local frame: the grip at the origin, the curved blade along +X with the edge below. The pose
    // is the mirror of the bandit's cutlass pose (the extrusion is symmetric in Z).
    const bladeOutline = profile.polygon(
      [
        [0.025, 0.017],
        [0.1, 0.024],
        [0.165, 0.043],
        [0.215, 0.086],
        [0.198, 0.03],
        [0.151, -0.015],
        [0.086, -0.036],
        [0.022, -0.024],
      ],
      { smooth: true, samples: 4 },
    );
    const bladeLocal = sdf
      .extrude(bladeOutline, 0.01, 0.0035)
      .paintWhere(sdf.extrude(profile.offsetProfile(bladeOutline, -0.007), 0.1).subtract(sdf.box([1, 0.02, 1]).at(0.22, -0.02, 0)), C.blade, 0.003);
    const hiltLocal = sdf.union(
      sdf.torus(0.016, 0.005).rotateZ(90).at(0.024, 0, 0).paint(C.guard), // ring guard
      sdf.capsule([-0.05, 0, 0], [0.022, 0, 0], 0.012), // grip
      sdf.sphere(0.015).at(-0.056, 0, 0).paint(C.bone), // bone pommel
    );
    const daggerPose = (s: sdf.Shape) => s.rotateY(-90).rotateX(6).rotateY(-66).at(...mx(GRIP));
    k.body('blade', daggerPose(bladeLocal), { color: C.bladeEdge, roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'dagger' });
    k.body('hilt', daggerPose(hiltLocal), { color: C.hilt, roughness: 0.7, detail: 0.004, bone: 'dagger' });

    // ------------------------------------------------------------------ the black candle in the left hand
    const waxTop = rgb(C.waxTop);
    const candle = sdf
      .cylinder(0.021, 0.185, 0.005)
      .at(CANDLE[0], GRIP[1] + 0.0225, CANDLE[2])
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(z - CANDLE[2], x - CANDLE[0]);
        return y > CANDLE_TOP - 0.012 - 0.03 * Math.max(0, Math.sin(a * 3)) ** 3 ? waxTop : base;
      });
    k.body('candle-wax', candle, { color: C.wax, roughness: 0.5, bone: 'candle', detail: 0.004 });
    const flameShape = sdf.smoothUnion(0.01, sdf.sphere(0.012).at(0, 0.014, 0), sdf.cone([0, 0.016, 0], [0, 0.05, 0], 0.01, 0.001)).at(...FLAME_AT);
    k.body('candle-flame', flameShape, { bone: 'flame', color: T.eyeBase, emissive: T.eye, emissiveIntensity: 1.5, roughness: 0.3, detail: 0.003 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, edgeUp, quat, follow, euler, mirrorPose } = motion;
    const LEG = 0.19;
    const DEG = Math.PI / 180;
    /** The flame's flicker; `boost` flares it up. */
    const flicker = (p: number, n: number, boost = 0) => ({
      scale: [1 + 0.08 * wave(p, n, 0.1) + 0.3 * boost, 1 + 0.18 * wave(p, n + 2) + 0.6 * boost, 1 + 0.08 * wave(p, n, 0.3) + 0.3 * boost] as const,
    });

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // Still and watchful: the hood tilts slowly from side to side.
        head: { rotate: [2 * wave(p, 1, 0.25), 5 * wave(p, 1, 0.4), 4 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-3 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
        flame: flicker(p, 4),
      }),
    });

    // The legs come from motion.gait (see the bandit): the left heel strikes at p = 0.25, when the
    // left arm is back. Short shuffling steps under the robe.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 5 * s, 0] as const;
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
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.5 * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.5 * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.25, 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.25, 0, 0] as const },
          flame: flicker(p, 4),
        };
      },
    });
    k.animation('walk', stride(0.95, 0.09, 0.022, 0.62, 0.005, 22, 4));
    k.animation('run', stride(0.58, 0.14, 0.04, 0.4, 0.025, 40, 12));

    // ---------------------------------------------------------------- attack, hit, death: the bandit's clips
    // These are written in the bandit's frame, where the blade is in the LEFT hand (all arm
    // geometry is symmetric), and mirrorPose turns them to the right hand.
    const bladeTurn = (v: V3): V3 => {
      const w = new THREE.Vector3(...v)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-90))
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(6))
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(66));
      return [w.x, w.y, w.z];
    };
    const BLADE_DIR = bladeTurn([1, 0, 0]);
    const FLAT = bladeTurn([0, 0, 1]);
    const CUT_FLAT = norm([-0.6, 0.75, 0]);
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const bladeKeys = [
      [0, BLADE_DIR],
      [0.12, norm([0.75, 0.62, 0.22])],
      [0.24, norm([0.3, 0.75, -0.6])],
      [0.3, norm([0.28, 0.72, -0.64])],
      [0.39, norm([0.24, 0.7, -0.67])],
      [0.44, norm([0.45, 0.88, 0.1])],
      [0.48, norm([0.58, 0.52, 0.62])],
      [0.51, norm([-0.08, -0.1, 0.99])],
      [0.54, norm([-0.58, -0.52, 0.62])],
      [0.62, norm([-0.68, -0.56, 0.47])],
      [0.72, norm([-0.68, -0.58, 0.45])],
      [0.86, norm([0.35, 0.02, 0.94])],
      [1, BLADE_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        // The wrist keys sit 2 cm further out than the bandit's, clear of the wider hood collar.
        const wrist = keys(
          p,
          [
            [0, WRIST_L],
            [0.12, [0.25, 0.36, 0.04]],
            [0.24, [0.265, 0.47, -0.045]],
            [0.3, [0.27, 0.48, -0.06]],
            [0.39, [0.27, 0.485, -0.065]],
            [0.44, [0.27, 0.475, 0.02]],
            [0.48, [0.2, 0.44, 0.11]],
            [0.51, [0.15, 0.385, 0.16]],
            [0.54, [0.12, 0.335, 0.165]],
            [0.62, [0.11, 0.32, 0.16]],
            [0.72, [0.115, 0.32, 0.16]],
            [0.86, [0.2, 0.3, 0.13]],
            [1, WRIST_L],
          ] as const,
          'spline',
        );
        const dir = norm(bladeAt(p));
        const lead = ease(0.14, 0.3, p) * (1 - ease(0.74, 0.94, p));
        const cutUp = edgeUp(bladeAt, p, CUT_FLAT);
        const up = norm([FLAT[0] + (cutUp[0] - FLAT[0]) * lead, FLAT[1] + (cutUp[1] - FLAT[1]) * lead, FLAT[2] + (cutUp[2] - FLAT[2]) * lead]);
        const POLE_REST: V3 = add(SHOULDER, add(ELBOW_L, SHOULDER, -1), 4);
        const pole = keys(p, [[0, POLE_REST], [0.24, [0.6, 0.35, -0.2]], [0.42, [0.6, 0.35, -0.15]], [0.5, [0.5, 0.05, 0.5]], [0.74, [0.45, -0.05, 0.5]], [1, POLE_REST]] as const);
        const arm = reach(ARM_L, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: BLADE_DIR, up: FLAT }, { dir, up });
        const wind = ease(0, 0.28, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.41, 0.54, p) * (1 - ease(0.72, 1, p));
        // The candle arm reaches forward and out for balance; the hand keeps the candle upright.
        const upperR: V3 = [-18 * wind + 8 * cut, 0, -12 * wind];
        const lowerR: V3 = [-14 * wind, 0, 0];
        const candleUp = orient([upperR, lowerR], { dir: UP, up: FWD }, { dir: UP, up: FWD });
        return mirrorPose({
          hips: { move: [0.012 * wind - 0.01 * cut, -legDrop(LEG, 16 * cut) - 0.006 * wind, 0.035 * cut - 0.012 * wind], rotate: [0, 8 * wind - 18 * cut, 0] },
          spine: { rotate: [-5 * wind + 10 * cut, -6 * cut, 0] },
          chest: { rotate: [-5 * wind + 5 * cut, 14 * wind - 16 * cut, 0] },
          head: { rotate: [-2 * wind + 4 * cut, -8 * wind + 16 * cut, 0] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          'upperarm.R': { rotate: upperR },
          'forearm.R': { rotate: lowerR },
          'hand.R': { rotate: candleUp },
          'leg.R': { rotate: [-6 * wind - 22 * cut, 0, 0] },
          'leg.L': { rotate: [-3 * wind + 12 * cut, 0, 0] },
          'foot.R': { rotate: [6 * wind + 16 * cut, 0, 0] },
          'foot.L': { rotate: [3 * wind - 8 * cut, 0, 0] },
        });
      },
    });

    // Hit: a blow from the front; the head and the chest snap back, one foot steps back.
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const SHIN = 0.125;
    const HEEL = 0.06;
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return mirrorPose({
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, -5 * h] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          'upperarm.L': { rotate: [-8 * h, 0, 14 * h] },
          'forearm.L': { rotate: [-10 * h, 0, 0] },
          'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        });
      },
    });

    // Death: a stagger, then a fall on the back as one piece; the hand opens and the dagger drops
    // beside it; the candle stays in the other hand. The body keeps its size.
    const LIE = 86;
    const LIE_Y = 0.13;
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0]];
    const HAND_CHAIN: readonly V3[] = [...TRUNK, SHOULDER, ELBOW_L, WRIST_L];
    const DROP_AT: V3 = [0.4, 0.028, -0.36];
    const DROP_TURN = quat(orient([], { dir: BLADE_DIR, up: FLAT }, { dir: norm([0.35, -0.05, 1]), up: [0, 1, 0] }));
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24);
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * clamp01((tilt - 70) / 16);
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.215, 0.26, -0.07], land), lerp(ELBOW_R, [-0.3, 0.3, -0.05], land));
        const standL = add(add(add(WRIST_L, [0.05, 0.04, 0.02], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.04], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.07], land), lerp(ELBOW_L, [0.35, 0.36, -0.1], land));
        const handQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).multiply(quat(armL.upper)).multiply(quat(armL.lower));
        const held = add(follow(HAND_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, [0, 0, 0]], GRIP), hipsMove);
        const drop = keys(p, [[0.44, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = new THREE.Vector3(...add(lerp(held, drop, loose), held, -1)).applyQuaternion(inv);
        return mirrorPose({
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB + 30 * land, 8 * wob] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          dagger: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        });
      },
    });

    // ------------------------------------------------------------------ taunt: the chant
    // Played when the cultist first sees the player. The candle rises out to the left, level with
    // the hood and upright; the cultist leans back, then nods three times with the chanted lines
    // while the hood sways and the flame flares. The dagger hand comes up before the waist. The
    // wrist target is in the chest's rest frame; the hand keeps the candle upright.
    const POLE_REST_L: V3 = add(SHOULDER, add(ELBOW_L, SHOULDER, -1), 4);
    const RAISE_AT: V3 = [0.25, 0.56, 0.17];
    const POLE_RAISE: V3 = [0.55, 0.3, -0.1];
    k.animation('taunt', {
      duration: 2.4,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.16, 1], [0.84, 1], [1, 0]] as const);
        const chant = raise * bump(p, 3);
        const sway = raise * wave(p, 1.5);
        const wrist = lerp(WRIST_L, add(RAISE_AT, [0, 0.02 * chant, 0]), raise);
        const arm = reach(ARM_L, wrist, lerp(POLE_REST_L, POLE_RAISE, raise));
        const hand = orient([arm.upper, arm.lower], { dir: UP, up: FWD }, { dir: UP, up: FWD });
        return {
          spine: { rotate: [-3 * raise, 0, 2 * sway] },
          chest: { rotate: [-3 * raise + 5 * chant, -6 * raise, 2 * sway] },
          neck: { rotate: [-4 * raise + 4 * chant, 0, 0] },
          head: { rotate: [-8 * raise + 8 * chant, 4 * raise, 5 * sway] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          'upperarm.R': { rotate: [-14 * raise, 0, -4 * raise] },
          'forearm.R': { rotate: [-30 * raise - 6 * chant, 0, 0] },
          flame: flicker(p, 8, raise),
        };
      },
    });
  },
});
