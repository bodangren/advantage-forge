import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Clay golem — Chibi Quest P1 dungeon enemy, about 1.1 m tall with the gem, faces +Z.
 * Target: docs/enemy-mockups/clay-golem_001.jpg (one three-quarter view).
 *
 * Base: assets/stone-golem.ts (the same heavy rig, knee bones, and clip set; every boulder is now
 *   smooth pressed clay, the attack is a two-hand slam, attack2 a wide backhand).
 * Role: a slow, sturdy dungeon construct; at 128 px the round head with two dark eye holes, the flat
 *   mouth slot, the amber forehead gem, the huge round shoulders, and the big hands must read.
 * One idea: a snowman of terracotta clay: a round head with a glowing gem in the crown, giant round
 *   shoulders, a fat belly with a carved shield panel, and hands as big as the head.
 * Proportions: head top 1.0, gem 1.03, eyes 0.9, mouth 0.84, shoulders 0.71 with r 0.14, belly
 *   0.25 to 0.6, hands 0.2 to 0.4, knee pads 0.2, feet 0.11 top.
 * Palette: clay #c46a3a (slot `clay`), shade -0.3 for carved lines, lit +0.2; holes #2a1a12;
 *   gem #ffc23a (slot `gem`) emissive.
 * Bodies: head (clay, detail 0.005), body (clay everything else), holes (eyes and mouth), gem.
 * Rig: the stone golem's. Clips: idle, walk, run, attack, attack2, roar, hit, death.
 */

const C = {
  clay: '#c46a3a',
  gem: '#ffc23a',
  hole: '#2a1a12',
};

type V3 = readonly [number, number, number];
type Rgb = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: high, wide shoulders, arms hanging far out, a short wide stance.
const SHOULDER: V3 = [0.32, 0.66, 0];
const ELBOW: V3 = [0.362, 0.464, 0.02]; // the upper arm is 0.2 long, 12 degrees out
const WRIST: V3 = [0.408, 0.249, 0.04]; // the forearm is 0.22 long
const HIP: V3 = [0.145, 0.3, 0];
const KNEE: V3 = [0.17, 0.19, 0.005]; // the knee: splits the leg (shin.L takes the weight below it)
const ANKLE: V3 = [0.19, 0.09, 0.01];
// The ends of the flat bottom of the left foot block (y = 0): heel and toe.
const SOLE_HEEL: V3 = [0.19, 0, -0.1];
const SOLE_TOE: V3 = [0.19, 0, 0.16];
const HEAD_Y = 0.87;

/** Mottled clay: a slow and a fine variation over the color underneath. */
const mottle = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const n = 1 + 0.06 * noise.fbm(x * 6, y * 6, z * 6, 3) + 0.03 * noise.fbm(x * 30, y * 30, z * 30, 2);
  return [base[0] * n, base[1] * n, base[2] * n];
};

const shield = profile.polygon(
  [
    [-0.06, 0.535],
    [-0.01, 0.55],
    [0.05, 0.54],
    [0.09, 0.48],
    [0.08, 0.4],
    [0.02, 0.345],
    [-0.05, 0.352],
    [-0.09, 0.4],
    [-0.09, 0.48],
  ],
  { smooth: true },
);

export default defineAsset({
  name: 'clay-golem',
  description: 'Chibi clay golem: a smooth terracotta construct with a round head, hollow eyes, a slot mouth, an amber forehead gem, huge round shoulders, a big belly with a carved shield, blocky hands, and short thick legs.',
  detail: 0.007,
  reference: 'docs/enemy-mockups/clay-golem_001.jpg',
  variants: {
    clay: { terracotta: C.clay, grey: '#8a8a86', dark: '#5a3a2a' },
    gem: { amber: C.gem, blue: '#3a9aff', green: '#5aff6a' },
  },
  presets: {
    ash: { clay: 'grey', gem: 'blue' },
    umber: { clay: 'dark', gem: 'green' },
    kiln: { clay: 'dark', gem: 'amber' },
  },

  build(k) {
    const T = {
      clay: k.tint('clay'),
      shade: k.tint('clay', -0.32),
      lit: k.tint('clay', 0.2),
      shadeSoft: k.tint('clay', -0.14),
      gem: k.tint('gem'),
      gemBase: k.tint('gem', -0.5),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.3, 0] },
      spine: { parent: 'hips', at: [0, 0.4, 0] },
      chest: { parent: 'spine', at: [0, 0.54, 0] },
      neck: { parent: 'chest', at: [0, 0.72, -0.02] },
      head: { parent: 'neck', at: [0, 0.79, -0.01] },
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

    // A fine grain, a few shallow cracks, and fingerprint dents in the normal map only.
    const clayBump = (x: number, y: number, z: number) => {
      const c = Math.abs(noise.noise3(x * 8 + 3, y * 8, z * 8));
      const crack = c < 0.03 ? -0.0018 * (1 - c / 0.03) : 0;
      const d = noise.noise3(x * 38, y * 38, z * 38);
      const dent = d > 0.55 ? -0.001 * Math.min(1, (d - 0.55) / 0.1) : 0;
      return crack + dent + 0.0006 * noise.fbm(x * 90, y * 90, z * 90, 2);
    };
    /** A groove where `cutter` crosses the outer `depth` of `s`. */
    const groove = (s: sdf.Shape, cutter: sdf.Shape, depth: number) => s.subtract(cutter.subtract(s.round(-depth)));

    // ------------------------------------------------------------------ head: a round egg with a heavy jaw
    const skull = sdf.ellipsoid([0.152, 0.135, 0.14]).at(0, HEAD_Y + 0.025, -0.005);
    const jaw = sdf.ellipsoid([0.145, 0.09, 0.135]).at(0, HEAD_Y - 0.042, 0.014);
    const head0 = sdf.smoothUnion(0.05, skull, jaw);
    const faceZ = (x: number, y: number) => sdf.raycast(head0, [x, y, 1], [0, 0, -1])![2];
    const EYE_X = 0.064;
    const EYE_Y = HEAD_Y + 0.028;
    const eyeZ = faceZ(EYE_X, EYE_Y);
    const MOUTH_Y = HEAD_Y - 0.05;
    const mouthZ = faceZ(0, MOUTH_Y);
    const eyeHoles = pair(sdf.sphere(0.03).at(EYE_X, EYE_Y, eyeZ));
    const mouthHole = sdf.box([0.165, 0.03, 0.06], 0.012).at(0, MOUTH_Y, mouthZ);
    // The gem sits at the middle of the forehead, facing forward, in a raised rim. Probe the surface for
    // its place and its tilt.
    const GEM_Y = HEAD_Y + 0.112;
    const gz = faceZ(0, GEM_Y);
    const tilt = (Math.atan2(faceZ(0, GEM_Y - 0.012) - faceZ(0, GEM_Y + 0.012), 0.024) * 180) / Math.PI; // the surface leans back above
    const gemPose = (s: sdf.Shape) => s.rotateX(-tilt).at(0, GEM_Y, gz);
    const socket = gemPose(sdf.ellipsoid([0.056, 0.04, 0.03]).at(0, 0, -0.004));
    const rim = gemPose(sdf.torus(0.052, 0.011).rotateX(90).scale([1, 0.74, 1]).at(0, 0, 0.0));
    const head = head0
      .smoothSubtract(0.006, eyeHoles, mouthHole, socket)
      .smoothUnion(0.008, rim.intersect(sdf.halfSpace([0, 0, -1], -0.03).at(0, 0, 0.0).round(0)))
      .paintFn(mottle)
      .paintWhere(socket.round(0.008), T.shade, 0.006)
      .paintWhere(eyeHoles.round(0.008), T.shade, 0.006)
      .paintWhere(mouthHole.round(0.008), T.shade, 0.006);
    k.body('head-mesh', head, { color: T.clay, roughness: 0.85, detail: 0.005, textureDensity: 2, bone: 'head', bump: clayBump });

    // ------------------------------------------------------------------ body: neck, trunk, arms, legs, feet
    const neck = sdf.capsule([0, 0.68, -0.02], [0, 0.8, -0.02], 0.085).bone('neck');
    const chestBox = sdf.box([0.42, 0.21, 0.28], 0.09).at(0, 0.625, 0.0);
    const bellyE = sdf.ellipsoid([0.225, 0.185, 0.2]).at(0, 0.42, 0.04);
    const hipsE = sdf.ellipsoid([0.17, 0.09, 0.13]).at(0, 0.31, 0.005);
    const trunk = sdf.smoothUnion(0.02, chestBox.bone('chest'), bellyE.bone('spine'), hipsE.bone('hips'));

    const HAND: V3 = [0.415, 0.165, 0.055];
    const armAt = (s: 1 | -1) => {
      const f = (p: V3): V3 => (s > 0 ? p : mx(p));
      const side = s > 0 ? 'L' : 'R';
      const hand = sdf.smoothUnion(
        0.015,
        sdf.box([0.205, 0.16, 0.18], 0.05).rotateZ(s > 0 ? -4 : 4).at(...f(HAND)),
        // The thumb on the inner side, pointing forward and down.
        sdf.capsule(f([0.35, 0.2, 0.08]), f([0.355, 0.135, 0.15]), 0.04),
        // Four thick finger bumps curled under the front of the hand.
        ...[0.37, 0.408, 0.446, 0.484].map((x, i) => sdf.capsule(f([x, 0.14, 0.11]), f([x, 0.105, 0.135 - (i === 3 ? 0.015 : 0)]), 0.037 - (i === 3 ? 0.005 : 0))),
      );
      // The shoulder is its own big sphere on top of the chest; the seam to the chest stays visible.
      const arm = sdf.smoothUnion(
        0.02,
        sdf.cone(f(SHOULDER), f(ELBOW), 0.105, 0.098).bone(`upperarm.${side}`),
        sdf.cone(f(ELBOW), f(WRIST), 0.1, 0.092).bone(`forearm.${side}`),
        sdf.sphere(0.115).at(...f(lerp(ELBOW, WRIST, 0.35))).bone(`forearm.${side}`),
        hand.bone(`hand.${side}`),
      );
      return { arm, shoulder: sdf.ellipsoid([0.16, 0.14, 0.15]).at(...f([0.31, 0.675, -0.005])).bone(`upperarm.${side}`) };
    };
    const armL = armAt(1);
    const armR = armAt(-1);
    // Legs: thick capsules, round knee pads on the shins.
    const legs = pair(
      sdf.smoothUnion(
        0.02,
        sdf.capsule(HIP, KNEE, 0.12).bone('leg.L'),
        sdf.capsule(KNEE, ANKLE, 0.1).bone('shin.L'),
        sdf.sphere(0.09).at(KNEE[0], KNEE[1] + 0.005, KNEE[2] + 0.075).bone('shin.L'),
      ),
    );
    // Feet: a wide flat block with three toe bumps; the sole is cut flat at y = 0.
    const footL = sdf
      .smoothUnion(
        0.015,
        sdf.box([0.24, 0.11, 0.28], 0.04).at(0, 0, -0.005),
        ...[-0.075, 0, 0.075].map((x) => sdf.ellipsoid([0.043, 0.045, 0.05]).at(x, -0.008, 0.14 + (x === 0 ? 0.014 : 0))),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0.05))
      .at(0.19, 0.05, 0.03)
      .bone('foot.L');
    const feet = pair(footL);

    const torso = sdf.smoothUnion(0.03, neck, trunk).smoothUnion(0.03, legs).smoothUnion(0.012, feet);
    const body0 = torso.smoothUnion(0.02, armL.arm, armR.arm).smoothUnion(0.012, armL.shoulder, armR.shoulder);

    // Long pressed-clay seams: shallow grooves (0.004) across the chest, belly, and arms.
    const front = (z: number) => sdf.halfSpace([0, 0, -1], -z).intersect(sdf.box([1.4, 1.4, 1.4]).at(0, 0.5, 0.7));
    const trunkOnly = sdf.box([0.5, 1, 1]).at(0, 0.5, 0);
    const armsOnly = sdf.box([0.4, 1, 1]).at(0.4, 0.5, 0);
    const seamCut = sdf.union(
      sdf.box([0.6, 0.008, 0.6]).rotateX(-8).rotateZ(3).at(0, 0.53, 0.3).intersect(trunkOnly).intersect(front(0.03)), // chest to belly
      sdf.box([0.008, 0.5, 0.6]).rotateY(-14).rotateZ(-6).at(0.14, 0.4, 0.3).intersect(trunkOnly).intersect(front(0.1)), // down the belly
      sdf.box([0.008, 0.5, 0.6]).rotateY(14).rotateZ(6).at(-0.14, 0.4, 0.3).intersect(trunkOnly).intersect(front(0.1)),
      sdf.box([0.6, 0.008, 0.6]).rotateZ(-8).at(0.36, 0.56, 0).intersect(armsOnly), // a band at the top of the upper arm
      sdf.box([0.6, 0.008, 0.6]).rotateZ(8).at(-0.36, 0.56, 0).intersect(armsOnly.at(-0.8, 0, 0)),
      sdf.box([0.6, 0.008, 0.6]).rotateZ(-6).at(0.4, 0.3, 0).intersect(armsOnly), // and one at the wrist
      sdf.box([0.6, 0.008, 0.6]).rotateZ(6).at(-0.4, 0.3, 0).intersect(armsOnly.at(-0.8, 0, 0)),
    );
    const body1 = groove(body0, seamCut, 0.004);

    // Carved marks cut as real grooves (0.006): a five-stroke rune word on the chest and a shield panel on the belly.
    const stroke = (cx: number, cy: number, w: number, h: number, rot: number) => sdf.extrude(profile.rect([w, h], w * 0.4), 0.3).rotateZ(rot).at(cx, cy, 0.18);
    const runeWord = sdf.union(
      stroke(-0.064, 0.655, 0.012, 0.062, 0),
      stroke(-0.032, 0.655, 0.012, 0.062, 0),
      stroke(0.0, 0.655, 0.012, 0.066, 20),
      stroke(0.032, 0.658, 0.012, 0.056, -15),
      stroke(0.064, 0.655, 0.012, 0.062, 0),
      sdf.extrude(profile.rect([0.06, 0.011], 0.004), 0.3).at(-0.032, 0.635, 0.18),
      sdf.extrude(profile.rect([0.05, 0.011], 0.004), 0.3).rotateZ(-20).at(0.045, 0.643, 0.18),
    );
    const panelOutline = sdf.extrude(shield, 0.4).at(0, 0, 0.2).subtract(sdf.extrude(profile.offsetProfile(shield, -0.008), 0.5).at(0, 0, 0.2));
    const glyph = sdf.union(
      sdf.extrude(profile.rect([0.05, 0.009], 0.003), 0.4).rotateZ(35).at(-0.026, 0.445, 0.2),
      sdf.extrude(profile.rect([0.05, 0.009], 0.003), 0.4).rotateZ(-35).at(0.02, 0.445, 0.2),
      sdf.extrude(profile.rect([0.045, 0.009], 0.003), 0.4).at(0.0, 0.42, 0.2),
    );
    const marks = sdf.union(runeWord, panelOutline, glyph).intersect(trunkOnly).intersect(front(0.1));
    const body2 = groove(body1, marks, 0.006);
    const bodyPainted = body2
      .paintFn(mottle)
      .paintWhere(seamCut, T.shadeSoft, 0.004)
      .paintWhere(marks, T.shade, 0.003)
      .paintFn((x, y, z, b) => {
        const g = 1 + 0.08 * Math.max(0, Math.min(1, (y - 0.5) * 2)) - 0.06 * Math.max(0, Math.min(1, (0.2 - y) * 5));
        return [b[0] * g, b[1] * g, b[2] * g];
      });
    k.body('torso-mesh', bodyPainted, { color: T.clay, roughness: 0.85, textureDensity: 1.5, bump: clayBump });

    // ------------------------------------------------------------------ holes: dark insides of the eyes and the mouth
    const eyeDark = pair(sdf.sphere(0.031).at(EYE_X, EYE_Y, eyeZ - 0.03));
    const mouthDark = sdf.box([0.16, 0.026, 0.03], 0.011).at(0, MOUTH_Y, mouthZ - 0.022);
    k.body('holes', sdf.union(eyeDark, mouthDark), { color: C.hole, roughness: 0.9, bone: 'head', detail: 0.004 });

    // ------------------------------------------------------------------ gem: amber, emissive, on a dark amber base
    const gem = gemPose(sdf.ellipsoid([0.05, 0.036, 0.024]).at(0, 0, 0.002));
    k.body('gem', gem, { color: T.gemBase, emissive: T.gem, emissiveIntensity: 1.8, roughness: 0.15, bone: 'head', detail: 0.004 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys } = motion;
    const LEG = HIP[1] - ANKLE[1];
    const DEG = Math.PI / 180;
    const deg = (r: number) => r / DEG;
    // A damped shake after `at`, with `n` swings in `len` of the clip.
    const shake = (p: number, at: number, len: number, n: number) =>
      p < at ? 0 : Math.exp((-(p - at) / len) * 3) * Math.sin(((p - at) / len) * Math.PI * n);

    k.animation('idle', {
      duration: 2.8,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [2 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 10 * wave(p, 1, 0.25), 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-4 * bump(p, 1, 0.3), 0, 0] },
      }),
    });

    // A heavy, rolling walk: the weight shifts from side to side at each step, the fists swing.
    // The legs come from motion.gait (planted stance feet, a knee lift in the swing, heel strike and
    // toe-off); the gait phase runs a quarter cycle behind the clip.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, sway: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 5 * s, sway * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 8,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.3, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -4] as const },
          'forearm.L': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(1.1, 0.12, 0.03, 0.62, 0.01, 16, 4, 4));
    k.animation('run', stride(0.7, 0.17, 0.05, 0.45, 0.025, 28, 10, 3));

    // ------------------------------------------------------------------ attack: a two-fist ground slam
    // Both fists swing up and back over the head while the golem rises and leans back; then the
    // trunk folds forward, the knees bend, and both fists drive down into the floor in front of
    // the feet (outside them). An impact shake, a hold, and a slow recovery.
    k.animation('attack', {
      duration: 1.3,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.52, 0.2, 5);
        const armX = keys(p, [[0, 0], [0.3, -150], [0.4, -158], [0.5, -70], [0.53, -64], [0.74, -64], [1, 0]] as const, 'smooth');
        const foreX = keys(p, [[0, 0], [0.3, -50], [0.4, -58], [0.5, -8], [0.74, -8], [1, 0]] as const, 'smooth');
        const handX = keys(p, [[0, 0], [0.3, -15], [0.4, -15], [0.5, 12], [0.74, 12], [1, 0]] as const, 'smooth');
        const spineX = keys(p, [[0, 0], [0.3, -6], [0.4, -8], [0.5, 20], [0.53, 22], [0.74, 20], [1, 0]] as const, 'smooth');
        const chestX = keys(p, [[0, 0], [0.3, -10], [0.4, -12], [0.5, 26], [0.53, 28], [0.74, 25], [1, 0]] as const, 'smooth') + 2 * sh;
        const c = keys(p, [[0, 0], [0.16, 0.35], [0.32, 0.05], [0.42, 0], [0.52, 1], [0.74, 0.95], [1, 0]] as const, 'smooth');
        return {
          hips: { move: [0, -0.05 * c - 0.004 * sh, -0.02 * c] },
          spine: { rotate: [spineX, 0, 0] },
          chest: { rotate: [chestX, 0, 0] },
          head: { rotate: [-(spineX + chestX) * 0.55 - 3 * sh, 0, 0] },
          'upperarm.L': { rotate: [armX, 0, 0] },
          'upperarm.R': { rotate: [armX, 0, 0] },
          'forearm.L': { rotate: [foreX, 0, 0] },
          'forearm.R': { rotate: [foreX, 0, 0] },
          'hand.L': { rotate: [handX, 0, 0] },
          'hand.R': { rotate: [handX, 0, 0] },
          'leg.L': { rotate: [-45 * c, 0, 0] },
          'shin.L': { rotate: [80 * c, 0, 0] },
          'foot.L': { rotate: [-35 * c, 0, 0] },
          'leg.R': { rotate: [-45 * c, 0, 0] },
          'shin.R': { rotate: [80 * c, 0, 0] },
          'foot.R': { rotate: [-35 * c, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a shoulder charge, then a backhand swipe
    // Plan: the golem sinks into a wide stance (the left foot steps back) and turns the right
    // boulder shoulder at the target; two heavy steps carry it forward into the ram, a short hold
    // with a shake. Then the body unwinds and the right fist swings backhand across the front and
    // out to the right. Two steps back to rest. A planted foot keeps its world position.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    type Step = readonly [number, number, number, number]; // phase start, phase end, from z, to z
    const footAt = (steps: readonly Step[], p: number) => {
      let z = 0;
      let lift = 0;
      for (const [a, b, from, to] of steps) {
        if (p >= a) z = from + (to - from) * ease(a, b, p);
        if (p > a && p < b) lift = 0.03 * Math.sin(((p - a) / (b - a)) * Math.PI);
      }
      return { z, lift };
    };
    const legTo = (footZ: number, hipsZ: number, hipsY: number, side: 1 | -1) => {
      const hipZ = hipsZ - side * HIP[0] * Math.sin(hipsY * DEG);
      const a = Math.asin(Math.max(-0.95, Math.min(0.95, (hipZ - footZ) / LEG)));
      return { rot: deg(a), drop: LEG * (1 - Math.cos(a)) };
    };
    const STEPS_L: readonly Step[] = [[0.02, 0.13, 0, -0.18], [0.16, 0.26, -0.18, 0.1], [0.85, 0.95, 0.1, 0]];
    const STEPS_R: readonly Step[] = [[0.26, 0.36, 0, 0.24], [0.72, 0.83, 0.24, 0]];

    k.animation('attack2', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.36, 0.1, 5);
        const hipsY = keys(p, [[0, 0], [0.15, 14], [0.45, 14], [0.48, 15], [0.66, -10], [0.72, -10], [0.9, 0]] as const);
        const spineY = keys(p, [[0, 0], [0.15, 12], [0.45, 12], [0.48, 13], [0.66, -10], [0.72, -10], [0.92, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.15, 18], [0.36, 20], [0.45, 20], [0.48, 24], [0.66, -16], [0.72, -16], [0.95, 0]] as const);
        const turn = hipsY + spineY + chestY;
        const lean = keys(p, [[0, 0], [0.15, 12], [0.26, 13], [0.36, 18], [0.45, 16], [0.48, 12], [0.66, 6], [0.72, 6], [0.95, 0]] as const);
        const dip = keys(p, [[0, 0], [0.15, -4], [0.36, -8], [0.45, -7], [0.6, 0]] as const); // the ramming shoulder drops
        const fL = footAt(STEPS_L, p);
        const fR = footAt(STEPS_R, p);
        const hipsZ = (fL.z + fR.z) / 2 + keys(p, [[0, 0], [0.3, 0], [0.36, 0.02], [0.45, 0.015], [0.6, 0.02], [0.72, 0]] as const);
        const legL = legTo(fL.z, hipsZ, hipsY, 1);
        const legR = legTo(fR.z, hipsZ, hipsY, -1);
        // The right fist: tucked in front of the belly in the charge, cocked across, then a
        // backhand swing out to the right at chest height.
        const rX = keys(p, [[0, 0], [0.15, -35], [0.45, -35], [0.49, -50], [0.58, -80], [0.66, -72], [0.72, -60], [0.9, -20], [1, 0]] as const, 'smooth');
        const rZ = keys(p, [[0, 0], [0.15, 12], [0.45, 12], [0.49, 28], [0.58, -10], [0.66, -45], [0.72, -45], [0.9, -10], [1, 0]] as const, 'smooth');
        const rFore = keys(p, [[0, 0], [0.15, -55], [0.45, -55], [0.49, -60], [0.58, -15], [0.66, -10], [0.72, -10], [0.9, -20], [1, 0]] as const, 'smooth');
        // The off arm braces forward, pulls back to drive the charge, and swings out in the swipe.
        const lX = keys(p, [[0, 0], [0.15, -30], [0.3, 15], [0.45, 15], [0.6, -20], [0.72, -20], [1, 0]] as const, 'smooth');
        const lZ = keys(p, [[0, 0], [0.15, 8], [0.45, 8], [0.6, 22], [0.72, 22], [1, 0]] as const, 'smooth');
        const h = hipsY * DEG;
        return {
          hips: { move: [0, -Math.min(legL.drop + fL.lift, legR.drop + fR.lift), hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean * Math.cos(h), spineY, lean * Math.sin(h)] },
          chest: { rotate: [3 * sh, chestY, dip + 2 * sh] },
          head: { rotate: [-lean * 0.6 - 3 * sh, -turn * 0.5, 0] },
          'upperarm.R': { rotate: [rX, 0, rZ] },
          'forearm.R': { rotate: [rFore, 0, 0] },
          'upperarm.L': { rotate: [lX, 0, lZ] },
          'forearm.L': { rotate: [-20 * ease(0, 0.15, p) * (1 - ease(0.8, 1, p)), 0, 0] },
          'leg.L': { rotate: [legL.rot, -hipsY, 0], move: [0, fL.lift, 0] },
          'leg.R': { rotate: [legR.rot, -hipsY, 0], move: [0, fR.lift, 0] },
          'foot.L': { rotate: [-legL.rot, 0, 0] },
          'foot.R': { rotate: [-legR.rot, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ roar: both fists raised, the stones tremble
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
        const lift = Math.max(0, rise);
        const crouch = Math.max(0, -rise);
        // Seven quick trembles while it roars (odd, so the strip does not freeze on them).
        const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
        return {
          hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
          spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
          chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0] },
          neck: { rotate: [6 * crouch - 6 * lift, 0, 0] },
          head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
          'upperarm.L': { rotate: [-25 * lift + 10 * crouch, 0, 65 * lift] },
          'upperarm.R': { rotate: [-25 * lift + 10 * crouch, 0, -65 * lift] },
          'forearm.L': { rotate: [-55 * lift - 20 * crouch, 0, 0] },
          'forearm.R': { rotate: [-55 * lift - 20 * crouch, 0, 0] },
          'leg.L': { rotate: [0, 0, 4 * lift] },
          'leg.R': { rotate: [0, 0, -4 * lift] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: snap back from a blow, a step back, recover
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.16, 1], [0.38, 0.8], [1, 0]] as const);
        const back = -0.025 * r;
        const legL = deg(Math.atan2(back, LEG));
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
          spine: { rotate: [-8 * r, 0, 3 * r] },
          chest: { rotate: [-9 * r, 7 * r, 0] },
          neck: { rotate: [-5 * r, 0, 0] },
          head: { rotate: [-14 * r, -9 * r, 6 * r] },
          'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
          'forearm.L': { rotate: [-22 * r, 0, 0] },
          'upperarm.R': { rotate: [10 * r, 0, -18 * r] },
          'forearm.R': { rotate: [-12 * r, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] }, // a small step back
          'foot.R': { rotate: [-12 * r, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: stagger back, topple, lie on the back
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const fall = keys(p, [[0, 0], [0.2, -8], [0.4, 3], [0.54, -40], [0.66, -88], [0.72, -84], [0.8, -88], [1, -88]] as const);
        const hipsY = keys(p, [[0, 0], [0.4, 0], [0.54, -0.01], [0.66, -0.1], [0.72, -0.085], [0.8, -0.1], [1, -0.1]] as const);
        const hipsZ = keys(p, [[0, 0], [0.2, -0.035], [0.4, -0.02], [0.66, -0.13], [1, -0.13]] as const);
        const legs = keys(p, [[0, 0], [0.2, 4], [0.4, -3], [0.54, 36], [0.66, 50], [1, 50]] as const);
        const stepR = keys(p, [[0, 0], [0.2, 14], [0.4, 4], [0.54, 0], [1, 0]] as const);
        const spill = keys(p, [[0, 0], [0.54, 0], [0.62, 1], [1, 1]] as const);
        return {
          hips: { move: [0, hipsY, hipsZ], rotate: [fall, keys(p, [[0, 0], [0.2, 8], [0.66, -6], [1, -6]] as const), 0] },
          spine: { rotate: [keys(p, [[0, 0], [0.2, -10], [0.4, 8], [0.56, 6], [0.66, -4], [1, 0]] as const), 0, 0] },
          chest: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 6], [0.66, -2], [1, 0]] as const), keys(p, [[0, 0], [0.2, 10], [0.5, -6], [1, 0]] as const), 0] },
          neck: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 8], [0.6, 16], [0.7, -6], [0.8, 0], [1, 0]] as const), 0, 0] },
          head: { rotate: [keys(p, [[0, 0], [0.2, -14], [0.4, 10], [0.6, 14], [0.7, -10], [0.8, 0], [1, 0]] as const), keys(p, [[0, 0], [0.7, 0], [0.9, 28], [1, 28]] as const), 0] },
          'upperarm.L': { rotate: [keys(p, [[0, 0], [0.2, 12], [0.4, -8], [0.58, -55], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, 28], [0.4, 12], [0.58, 40], [0.7, 60], [1, 62]] as const)] },
          'forearm.L': { rotate: [keys(p, [[0, 0], [0.2, -30], [0.58, -20], [0.7, -6], [1, -8]] as const), 0, 0] },
          'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -45], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, -22], [0.4, -10], [0.58, -35], [0.7, -58], [1, -60]] as const)] },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
          'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
          'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
          'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
          'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
        };
      },
    });
  },
});
