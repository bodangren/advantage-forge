import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Selkie — Chibi Quest monster (catalog `monsters/fey-and-spirit/selkie`), a seal girl about 0.95 m
 * to the top of her seal hood, faces +Z. Target: docs/monster-mockups/selkie_001.jpg (made with mmx
 * from the fairy sprite mockup). Built on the dryad (`assets/dryad.ts`: the villager's head, face,
 * and skeleton, the stride, the topple), with both hands holding a pearl.
 *
 * Role: a shy sea fey of the coves and the harbors (friend or foe); the seal-skin hood with the seal's
 *   face on top, the grey robe with flippers, and the white pearl read at 128 px.
 * One idea: a girl in a soft grey seal-skin robe whose hood is the seal's head: two black eyes, a
 *   black nose, and whisker pads with dots above her forehead, flaps out at the sides, and two seal
 *   flippers out from her shoulders; black hair with a side fringe, big glossy dark eyes, rosy
 *   cheeks; she holds a white pearl in both hands, and little bare feet peek out under the robe. Her
 *   attack lifts the pearl and sends a water bubble.
 * Proportions: the villager's head (center 0.675, eyes 0.628); the hood to 0.94 and 0.25 wide at each
 *   side; the robe from the neck to 0.09; the pearl in front of the belly at 0.3.
 * Shape language: round and soft everywhere (hood, robe, pearl); the flaps and the flippers are the
 *   only points.
 * Palette (60/30/10): seal grey #8a98a6 (darker #6a7886 folds and whisker dots); black #1a1418 seal
 *   eyes, nose, and hair; pale skin #f4dcc8; the white pearl #f6f0ec and the water bubble #9ad4f0 as
 *   the accent.
 * Bodies: skin, hair, hood (the seal's head with the flaps), seal-face (eyes and nose), robe (with the
 *   sleeves and the flippers), pearl, bubble.
 * Rig: the villager's skeleton, `pearl` (on `chest`; the hands hold it) and `bubble` (on `pearl`;
 *   hidden in the pearl at 40 % and scaled up in the attack). Clips: idle, walk, run, attack (the
 *   pearl's water bubble), hit, death.
 */

const C = {
  skin: '#f4dcc8',
  blush: '#f2988a',
  eyeWhite: '#f6f1ea',
  irisRim: '#0e0a0c',
  iris: '#1e1a1e',
  irisLow: '#3a3236',
  pupil: '#0a0708',
  lid: '#1c130f',
  brow: '#2a2228',
  mouth: '#a04a40',
  hair: '#2a2228',
  seal: '#8a98a6',
  sealDark: '#6a7886',
  black: '#1a1418',
  pearl: '#f6f0ec',
  pearlPink: '#f0d8dc',
  bubble: '#9ad4f0',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Joints: both forearms come forward and in, the hands hold the pearl in front of the belly.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.172, 0.31, 0.05];
const WRIST: V3 = [0.072, 0.292, 0.122];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const HIPS_AT: V3 = [0, 0.2, 0];
const PEARL: V3 = [0, 0.3, 0.15];
const PEARL_R = 0.04;
const BUBBLE_REST = 0.4;

/** A small hand at the wrist `w`, the palm turned in to the pearl, the thumb up. `s` is 1 on the left, -1 on the right. */
const hand = (w: V3, s: 1 | -1) =>
  sdf.smoothUnion(
    0.012,
    sdf.ellipsoid([0.026, 0.032, 0.034]).at(w[0] - 0.012 * s, w[1] - 0.006, w[2] + 0.02),
    sdf.cone([w[0] - 0.008 * s, w[1] + 0.012, w[2] + 0.024], [w[0] - 0.02 * s, w[1] + 0.03, w[2] + 0.034], 0.011, 0.009),
  );

export default defineAsset({
  name: 'selkie',
  description: 'Chibi selkie monster: a girl in a soft grey seal-skin robe whose hood is a seal head with black eyes, a black nose, and whisker pads, flaps at the sides and seal flippers at the shoulders, black hair with a side fringe, big glossy dark eyes, rosy cheeks, little bare feet, and a white pearl held in both hands; she sends water bubbles.',
  detail: 0.005,
  reference: 'docs/monster-mockups/selkie_001.jpg',
  variants: {
    clothing: { grey: C.seal, brown: '#8a7464', white: '#d0d6de' },
    hair: { black: C.hair, brown: '#5a3a28', auburn: '#7a3a24' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    eyes: { black: C.iris, blue: '#2f5a8a', grey: '#5a6470' },
  },
  presets: {
    furseal: { clothing: 'brown', hair: 'auburn', skin: 'tan', eyes: 'blue' },
    harpseal: { clothing: 'white', hair: 'brown', skin: 'fair', eyes: 'grey' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      nose: k.tint('skin', { color: '#f0a090', follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      seal: k.tint('clothing'),
      sealDark: k.tint('clothing', { color: C.sealDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: HIPS_AT },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      pearl: { parent: 'chest', at: PEARL },
      bubble: { parent: 'pearl', at: PEARL },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head, face, hands, and feet (skin)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.018, 0.015, 0.014]).at(0, 0.57, faceZ(0, 0.57) - 0.002).bone('head');
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const arm = (s: 'L' | 'R') => {
      const m = (v: V3) => (s === 'L' ? v : mx(v));
      return sdf.smoothUnion(
        0.02,
        sdf.cone(m(SHOULDER), m(ELBOW), 0.036, 0.032).bone(`upperarm.${s}`),
        sdf.cone(m(ELBOW), m(WRIST), 0.032, 0.028).bone(`forearm.${s}`),
        hand(m(WRIST), s === 'L' ? 1 : -1).bone(`hand.${s}`),
      );
    };
    // Legs under the robe and little bare feet with round toes below its hem.
    const legs = pair(sdf.capsule([HIP[0], 0.21, 0], [0.096, 0.075, 0.004], 0.033).bone('leg.L'));
    const foot = sdf
      .smoothUnion(
        0.012,
        sdf.ellipsoid([0.04, 0.03, 0.06]).at(0, 0.028, 0.03),
        ...[-0.022, -0.007, 0.008, 0.022].map((x, i) => sdf.sphere(0.011 - i * 0.001).at(x, 0.018, 0.084 - Math.abs(x) * 0.4)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.05, 0.055, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.047, 0.052, 0.07]), EYE[0], EYE[1] - 0.002));
    const iris = pair(at(sdf.ellipsoid([0.043, 0.048, 0.07]), EYE[0], EYE[1] - 0.003));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.025));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.01, 20, 160), 0.3).at(EYE[0], EYE[1] - 0.002, 0.1));
    const lash = pair(sdf.extrude(profile.rect([0.018, 0.007], 0.003), 0.3).rotateZ(25).at(EYE[0] + 0.05, EYE[1] + 0.028, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.013), x + 0.017, EYE[1] + 0.02), at(sdf.sphere(0.006), x - 0.016, EYE[1] - 0.022)]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.012, 66, 112), 0.3).at(0.1, 0.728 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.045, 0.009, 248, 292), 0.3).at(0, 0.535 + 0.045, 0.1);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .union(arm('L'), arm('R'), legs, pair(foot))
      .paintWhere(pair(at(sdf.sphere(0.045), 0.14, 0.565)), T.blush, 0.032)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(lid, C.lid)
      .paintWhere(lash, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth)
      .paintWhere(sdf.sphere(0.016).at(0, 0.57, faceZ(0, 0.57) + 0.026), T.nose, 0.012);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: a cap inside the hood, a fringe swept to her left
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, sdf.ellipsoid([0.25, 0.155, 0.23]).at(0, 0.61, 0.14));
    const onHead = (x: number, y: number, r: number, lift = 0.55): [number, number, number, number] => [x, y, faceZ(Math.abs(x), y) + r * lift, r];
    const fringe = sdf.union(
      sdf.chain([onHead(-0.07, 0.785, 0.034), onHead(0.0, 0.765, 0.032), onHead(0.07, 0.74, 0.028), onHead(0.13, 0.705, 0.02), onHead(0.16, 0.665, 0.01)], 0.02),
      sdf.chain([onHead(-0.08, 0.785, 0.03), onHead(-0.13, 0.745, 0.026), onHead(-0.165, 0.69, 0.018), onHead(-0.175, 0.64, 0.008)], 0.016),
    );
    // Side locks down the cheeks inside the hood.
    const sideLocks = pair(sdf.chain([[0.172, 0.68, 0.06, 0.042], [0.185, 0.59, 0.07, 0.036], [0.172, 0.52, 0.075, 0.016]], 0.015));
    const hair = sdf.smoothUnion(0.02, cap, fringe, sideLocks).displace(0.002, (x, y, z) => Math.sin(Math.atan2(x, z) * 20 + y * 30));
    k.body('hair', hair, { color: T.hair, roughness: 0.55, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ the seal hood: the seal's head with whisker pads, flaps at the sides
    const hoodBall = sdf.ellipsoid([0.25, 0.235, 0.24]).at(0, 0.7, -0.015);
    const opening = sdf.ellipsoid([0.188, 0.178, 0.25]).at(0, 0.608, 0.21);
    const pads = pair(sdf.ellipsoid([0.062, 0.046, 0.05]).at(0.047, 0.815, 0.19));
    const flaps = pair(sdf.ellipsoid([0.085, 0.026, 0.06]).rotateZ(-20).rotateY(-10).at(0.25, 0.6, 0.0));
    const hoodShape = sdf
      .smoothUnion(0.02, hoodBall, pads, flaps)
      .subtract(sdf.ellipsoid([HEAD[0] + 0.016, HEAD[1] + 0.018, HEAD[2] + 0.016]).at(0, HEAD_Y + 0.008, -0.012))
      .smoothSubtract(0.012, opening)
      .intersect(sdf.halfSpace([0, -1, 0], -0.46));
    const padAt = (x: number, y: number) => sdf.raycast(pads, [x, y, 1], [0, 0, -1])!;
    const dots = sdf.union(
      ...[
        [0.03, 0.81],
        [0.05, 0.8],
        [0.068, 0.81],
        [0.045, 0.79],
      ].flatMap(([x, y]) => [x!, -x!].map((xx) => sdf.sphere(0.0055).at(...(padAt(xx, y!) as V3)))),
    );
    const hood = hoodShape
      .paintWhere(dots, T.sealDark, 0.001)
      .paintWhere(opening.round(0.012).subtract(opening), T.sealDark, 0.008)
      .paintFn((x, y, z, base) => (y > 0.86 && noise.fbm(x * 30, y * 30, z * 30, 2) > 0.55 ? rgb(T.sealDark) : base));
    k.body('hood', hood.bone('head'), { color: T.seal, roughness: 0.55, detail: 0.004, textureDensity: 1.4 });
    // The seal's black eyes and nose on the hood.
    const sealEyeAt = (x: number): V3 => {
      const h = sdf.raycast(hoodBall, [x, 0.895, 1], [0, 0, -1])!;
      return [h[0], h[1], h[2] - 0.006];
    };
    const sealNoseAt = sdf.raycast(pads, [0, 0.838, 1], [0, 0, -1])!;
    const sealFace = sdf.union(
      sdf
        .sphere(0.026)
        .at(...sealEyeAt(0.095))
        .paintWhere(sdf.sphere(0.007).at(sealEyeAt(0.095)[0] + 0.006, sealEyeAt(0.095)[1] + 0.009, sealEyeAt(0.095)[2] + 0.017), '#ffffff', 0.001)
        .mirror('x'),
      // The nose: a soft triangle, wide on top, between the whisker pads.
      sdf.cone([0, 0.015, -0.004], [0, -0.015, 0.004], 0.03, 0.01).scale([1, 1, 0.7]).at(0, 0.843, sealNoseAt[2]),
    );
    k.body('seal-face', sealFace.bone('head'), { color: C.black, roughness: 0.15, detail: 0.003 });

    // ------------------------------------------------------------------ robe: a long grey robe with wide sleeves and two flippers
    const robeShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.09, 0.465],
            [0.125, 0.43],
            [0.136, 0.36],
            [0.146, 0.28],
            [0.166, 0.2],
            [0.184, 0.13],
            [0.19, 0.1],
            [0.18, 0.088],
            [0, 0.088],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.86]);
    // Soft vertical folds that grow toward the hem, and fade out on its flat underside.
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z) * 8) * clamp01((0.3 - y) / 0.2) * clamp01((y - 0.088) / 0.02);
    const robeBody = robeShape.displace(0.005, folds);
    const sleeve = (s: 'L' | 'R') => {
      const m = (v: V3) => (s === 'L' ? v : mx(v));
      return sdf.smoothUnion(
        0.015,
        sdf.cone(m(lerp(SHOULDER, [0, 0.4, 0], 0.15)), m(ELBOW), 0.048, 0.05).bone(`upperarm.${s}`),
        sdf.cone(m(ELBOW), m(lerp(ELBOW, WRIST, 0.72)), 0.05, 0.056).bone(`forearm.${s}`),
      );
    };
    const flipper = pair(sdf.ellipsoid([0.09, 0.02, 0.052]).rotateZ(-28).rotateY(-8).at(0.215, 0.35, -0.02));
    const robe = sdf
      .union(
        robeBody.intersect(sdf.halfSpace([0, -1, 0], -0.33)).bone('chest'),
        robeBody.intersect(sdf.halfSpace([0, 1, 0], 0.33)).intersect(sdf.halfSpace([0, -1, 0], -0.24)).bone('spine'),
        robeBody.intersect(sdf.halfSpace([0, 1, 0], 0.24)).bone('hips'),
        sdf.smoothUnion(0.02, sleeve('L'), sleeve('R')),
        flipper.bone('chest'),
      );
    k.body('robe', robe, { color: T.seal, roughness: 0.6 });

    // ------------------------------------------------------------------ the pearl (on `pearl`) and the hidden water bubble (on `bubble`)
    const pearl = sdf
      .sphere(PEARL_R)
      .at(...PEARL)
      .paintFn((x, y, z, base) => (noise.fbm(x * 40, y * 40, z * 40, 2) > 0.3 ? rgb(C.pearlPink) : base));
    k.body('pearl-orb', pearl, { color: C.pearl, roughness: 0.2, metalness: 0.1, emissive: C.pearl, emissiveIntensity: 0.15, detail: 0.003, bone: 'pearl' });
    const bubble = sdf.smoothUnion(0.01, sdf.sphere(0.06), sdf.sphere(0.024).at(0.05, 0.03, 0.02), sdf.sphere(0.02).at(-0.045, -0.035, 0.015));
    k.body('water-bubble', bubble.scale(BUBBLE_REST).at(...PEARL), {
      color: C.bubble,
      opacity: 0.7,
      emissive: C.bubble,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      detail: 0.003,
      bone: 'bubble',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys, legDrop, reach } = motion;
    const ARM = (s: 'L' | 'R') => ({ root: s === 'L' ? SHOULDER : mx(SHOULDER), mid: s === 'L' ? ELBOW : mx(ELBOW), end: s === 'L' ? WRIST : mx(WRIST) });
    const POLE_L: V3 = [0.4, 0.3, -0.1];
    const POLE_R: V3 = [-0.4, 0.3, -0.1];
    /** Both hands on the pearl when the pearl moves by `d` (the chest's rest frame). */
    const holdPearl = (d: V3) => {
      const l = reach(ARM('L'), add(WRIST, d), POLE_L);
      const r = reach(ARM('R'), add(mx(WRIST), d), POLE_R);
      return {
        pearl: { move: d },
        'upperarm.L': { rotate: l.upper },
        'forearm.L': { rotate: l.lower },
        'upperarm.R': { rotate: r.upper },
        'forearm.R': { rotate: r.lower },
      };
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [1.5 * wave(p, 3), 7 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        ...holdPearl([0, 0.006 * wave(p, 2), 0.004 * wave(p, 2, 0.2)]),
      }),
    });

    // The villager's stride; she keeps the pearl in both hands, so the arms only bob, and she
    // waddles a little from side to side like a seal on land.
    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, sway: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, sway * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.096, 0, -0.03],
          toe: [0.1, 0, 0.09],
          hips: { at: HIPS_AT, rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, -sway * 0.4 * s] as const },
          ...holdPearl([0, 0.008 * wave(p, 2, 0.1), 0]),
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.025, 0.6, 0.006, 5, 3));
    k.animation('run', stride(0.58, 0.13, 0.04, 0.42, 0.025, 7, 8));

    // Attack: the pearl's water bubble. She lifts the pearl up and forward (0 to 0.3), the bubble
    // swells out of it, then flies forward and grows (0.32 to 0.62), and pops (0.62 to 0.68); she
    // brings the pearl back down.
    k.animation('attack', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const lift = ease(0.02, 0.28, p) * (1 - ease(0.7, 0.95, p));
        const push = ease(0.3, 0.42, p) * (1 - ease(0.55, 0.8, p));
        const swell = ease(0.08, 0.3, p);
        const fly = ease(0.32, 0.62, p);
        const pop = ease(0.62, 0.68, p);
        const live = p < 0.7;
        const size = live ? (1 / BUBBLE_REST) * (0.5 * swell + 0.8 * fly) * (1 + 0.4 * pop) * (1 - 0.98 * pop) : 1;
        return {
          spine: { rotate: [3 * push - 2 * lift, 0, 0] },
          chest: { rotate: [-4 * lift + 4 * push, 0, 0] },
          head: { rotate: [-6 * lift + 4 * push, 0, 0] },
          ...holdPearl([0, 0.05 * lift, 0.03 * lift + 0.02 * push]),
          bubble: live ? { move: [0, 0.02 * swell + 0.06 * fly, 0.06 * swell + 0.45 * fly], scale: [size, size, size] } : {},
        };
      },
    });

    // Hit: a blow from the front. The chest and the head snap back, the right foot steps back, she
    // hugs the pearl to her chest, and comes back quickly.
    const LEG = KNEE[1] - ANKLE[1] + (HIP[1] - KNEE[1]);
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.32, 0.8], [0.72, 0.1], [1, 0]] as const);
        return {
          hips: { move: [0, -legDrop(LEG, 12 * h), -0.03 * h], rotate: [-3 * h, 4 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-9 * h, -4 * h, -2 * h] },
          neck: { rotate: [-3 * h, 0, 0] },
          head: { rotate: [-8 * h, 5 * h, -4 * h] },
          ...holdPearl([0, 0.02 * h, -0.02 * h]),
          'leg.L': { rotate: [-9 * h, 0, 0] },
          'leg.R': { rotate: [14 * h, 0, 0] },
          'foot.L': { rotate: [9 * h, 0, 0] },
          'foot.R': { rotate: [-8 * h, 0, 0] },
        };
      },
    });

    // Death: the dryad's topple onto her left side, pivoting on the left foot; the body lifts as she
    // lands, and the neck and the head bend up, so the big hood props her head. She keeps the pearl.
    const FOOT_PIVOT: V3 = [ANKLE[0] + 0.02, 0, 0];
    const LIFT: V3 = [-0.02, 0.1, 0.02];
    const rotZ = (v: V3, deg: number): V3 => {
      const a = (deg * Math.PI) / 180;
      return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
    };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const st = keys(p, [[0, 0], [0.1, 1], [0.24, 0.75], [0.42, 0]] as const);
        const tt = clamp01((p - 0.24) / 0.44);
        const f = tt * tt;
        const land = bump(clamp01((p - 0.68) / 0.14));
        const lift = ease(0.42, 0.68, p);
        const rel: V3 = [HIPS_AT[0] - FOOT_PIVOT[0], HIPS_AT[1] - FOOT_PIVOT[1], 0];
        const r = rotZ(rel, -88 * f);
        const hb = ease(0.5, 0.72, p);
        return {
          hips: {
            move: [r[0] - rel[0] + LIFT[0] * lift, r[1] - rel[1] + LIFT[1] * lift + 0.012 * land, -0.03 * st + LIFT[2] * lift],
            rotate: [-4 * st, 0, -88 * f],
          },
          spine: { rotate: [-5 * st, 0, 0] },
          chest: { rotate: [-8 * st, -3 * st, 0] },
          neck: { rotate: [-3 * st, 0, 16 * hb] },
          head: { rotate: [-9 * st + 6 * hb, 4 * hb, 26 * hb + 4 * land] },
          ...holdPearl([0, -0.01 * f, 0.01 * f]),
          'leg.L': { rotate: [-6 * st - 15 * f, 0, 0] },
          'leg.R': { rotate: [14 * st * (1 - f) - 30 * f, 0, 0] },
          'foot.L': { rotate: [6 * st + 15 * f, 0, 0] },
          'foot.R': { rotate: [-8 * st + 12 * f, 0, 0] },
        };
      },
    });
  },
});
