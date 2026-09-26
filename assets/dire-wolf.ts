import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Dire wolf — Chibi Quest monster (catalog `monsters/beast/dire-wolf`), about 0.8 m to the ear
 * tips and 0.75 m from nose to rump, faces +Z. Target: docs/monster-mockups/dire-wolf_001.jpg
 * (made with mmx; one front view).
 *
 * Role: a fast pack beast, seen in 3D and as a 128 px sprite; the grin and the brows must read.
 * One idea: a huge scowling wolf head with a toothy grin, framed by pointed cheek tufts, tall
 *   ears, and a spiky cream chest ruff, on a compact body with stubby legs and a bushy tail.
 * Shape language: round masses (head, body, paws) under sharp triangles (ears, cheek tufts,
 *   ruff points, fangs, tail tip): cute but dangerous.
 * Palette (60/30/10): dark slate fur #4a5058 (darker legs and back); cream #ece2c0 (brows,
 *   muzzle, forelock, ruff, tail tip); tan ear insides #c49a7a; amber eyes #f0a020 as the accent.
 * Value plan: the cream muzzle and brows on the dark face, with the amber eyes between them, are
 *   the strongest contrast (focal point); the cream ruff is the second light mass.
 * Bodies: fur, cream (brows, muzzle, forelock, ruff, tail tip), nose, teeth, claws.
 * Rig: quadruped (hips, spine, neck, head, tail, front and back legs with shins, as the horned
 *   boar). Clips: idle (breathing, ear flick, tail sway), walk (trot), run, attack (a lunging bite).
 */

const C = {
  fur: '#4a5058',
  furDark: '#363b42',
  cream: '#ece2c0',
  earInner: '#c49a7a',
  nose: '#1a1a1c',
  mouth: '#2a2426',
  eye: '#f0a020',
  eyeRim: '#b0500c',
  pupil: '#141012',
  tooth: '#fbf7ee',
  claw: '#2a2a2e',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');

// Joint positions (rest pose). Short, thick legs keep the body low under the big head.
const SHOULDER: V3 = [0.1, 0.24, 0.07];
const FKNEE: V3 = [0.105, 0.12, 0.08];
const HIP: V3 = [0.1, 0.24, -0.2];
const BKNEE: V3 = [0.105, 0.12, -0.22];
const HEAD_C: V3 = [0, 0.5, 0.17];

export default defineAsset({
  name: 'dire-wolf',
  description: 'Chibi dire wolf monster: a huge scowling head with a toothy grin, cream brows and chest ruff, tall ears, amber eyes, and a bushy tail; quadruped rig.',
  detail: 0.005,
  reference: 'docs/monster-mockups/dire-wolf_001.jpg',

  build(k) {
    k.skeleton({
      hips: { at: [0, 0.27, -0.17] },
      spine: { parent: 'hips', at: [0, 0.29, 0.0] },
      neck: { parent: 'spine', at: [0, 0.34, 0.1] },
      head: { parent: 'neck', at: [0, 0.4, 0.14] },
      tail: { parent: 'hips', at: [0, 0.32, -0.3], tail: [0.06, 0.5, -0.42] },
      'fleg.L': { parent: 'spine', at: SHOULDER },
      'fshin.L': { parent: 'fleg.L', at: FKNEE },
      'fleg.R': { parent: 'spine', at: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]] },
      'fshin.R': { parent: 'fleg.R', at: [-FKNEE[0], FKNEE[1], FKNEE[2]] },
      'bleg.L': { parent: 'hips', at: HIP },
      'bshin.L': { parent: 'bleg.L', at: BKNEE },
      'bleg.R': { parent: 'hips', at: [-HIP[0], HIP[1], HIP[2]] },
      'bshin.R': { parent: 'bleg.R', at: [-BKNEE[0], BKNEE[1], BKNEE[2]] },
    });

    // ------------------------------------------------------------------ body
    const chest = sdf.ellipsoid([0.15, 0.15, 0.16]).at(0, 0.29, 0.03);
    const rump = sdf.ellipsoid([0.13, 0.13, 0.14]).at(0, 0.26, -0.18);
    const neck = sdf.ellipsoid([0.12, 0.12, 0.09]).at(0, 0.37, 0.08);

    // ------------------------------------------------------------------ head
    const skull = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.2, 0.175, 0.17]).at(...HEAD_C),
      pair(sdf.sphere(0.09).at(0.1, 0.44, 0.22)), // cheeks
    );
    const MUZZLE: V3 = [0, 0.43, 0.3];
    const muzzle = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.14, 0.075, 0.085]).at(...MUZZLE),
      sdf.ellipsoid([0.06, 0.04, 0.06]).at(0, 0.47, 0.3), // the bridge up to the brows
    );
    const headBase = sdf.smoothUnion(0.03, skull, muzzle);
    const faceHit = (x: number, y: number) => sdf.raycast(headBase, [x, y, 2], [0, 0, -1])!;

    // Pointed cheek tufts, two on each side, flattened front to back.
    const tuft = (from: V3, to: V3, r: number) => sdf.cone(from, to, r, 0.004).scale([1, 1, 0.55]);
    const cheekTufts = pair(
      sdf.smoothUnion(
        0.02,
        tuft([0.14, 0.5, 0.18], [0.29, 0.52, 0.2], 0.06),
        tuft([0.13, 0.43, 0.2], [0.26, 0.38, 0.22], 0.055),
      ),
    );
    // Tall pointed ears, cupped toward the front.
    const earPose = (s: sdf.Shape) => s.rotateZ(-14).rotateX(-6).at(0.105, 0.62, 0.14);
    const earLocal = sdf
      .cone([0, 0, 0], [0, 0.17, 0], 0.07, 0.008)
      .scale([1, 1, 0.45])
      .smoothSubtract(0.006, sdf.cone([0, 0.02, 0.02], [0, 0.15, 0.02], 0.05, 0.004).scale([1, 1, 0.55]));
    const earCup = sdf.cone([0, 0.02, 0.03], [0, 0.15, 0.03], 0.052, 0.005).scale([1, 1, 0.8]);
    const ears = pair(earPose(earLocal.paintWhere(earCup, C.earInner, 0.006)));

    // ------------------------------------------------------------------ legs, paws, tail
    const leg = (hip: V3, knee: V3, upper: string, lower: string) =>
      sdf.smoothUnion(
        0.03,
        sdf.cone(hip, knee, 0.07, 0.056).bone(upper),
        sdf.cone(knee, [knee[0], 0.05, knee[2] + 0.02], 0.056, 0.05).bone(lower),
      );
    const legs = sdf.union(pair(leg(SHOULDER, FKNEE, 'fleg.L', 'fshin.L')), pair(leg(HIP, BKNEE, 'bleg.L', 'bshin.L')));
    // Big round paws with three toe pads at the front.
    const pawLocal = sdf
      .smoothUnion(
        0.015,
        sdf.ellipsoid([0.058, 0.04, 0.07]).at(0, 0.036, 0.02),
        ...[-0.03, 0, 0.03].map((x) => sdf.sphere(0.024).at(x, 0.026, 0.075 - Math.abs(x) * 0.4)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const paw = (knee: V3, bone: string) => pawLocal.at(knee[0], 0, knee[2] + 0.02).bone(bone);
    const paws = sdf.union(pair(paw(FKNEE, 'fshin.L')), pair(paw(BKNEE, 'bshin.L')));
    // A big bushy tail that curls up, flat-sided, with a cream tip.
    const TAIL_TIP: V3 = [0.09, 0.56, -0.44];
    const tailShape = sdf
      .chain(
        [
          [0, 0.31, -0.28, 0.04],
          [0.02, 0.36, -0.38, 0.07],
          [0.05, 0.45, -0.43, 0.078],
          [TAIL_TIP[0], TAIL_TIP[1], TAIL_TIP[2], 0.012],
        ],
        0.03,
      )
      .scale([0.8, 1, 1]);

    // ------------------------------------------------------------------ fur body
    const trunk = sdf.smoothUnion(0.07, chest.bone('spine'), rump.bone('hips'), neck.bone('neck'), headBase.bone('head'));
    const eyeC = (x: number): V3 => {
      const h = faceHit(x, 0.53);
      return [h[0], h[1], h[2]];
    };
    const EYE_X = 0.078;
    const eL = eyeC(EYE_X);
    const eyeRing = pair(sdf.cylinder(0.037, 1).rotateX(90).at(eL[0], eL[1], 0));
    const eye = pair(sdf.cylinder(0.031, 1).rotateX(90).at(eL[0], eL[1], 0));
    const pupil = pair(sdf.cylinder(0.014, 1).rotateX(90).at(eL[0] - 0.004, eL[1] - 0.002, 0));
    const shine = pair(sdf.sphere(0.008).at(eL[0] + 0.01, eL[1] + 0.012, eL[2]));
    const fur = trunk
      .smoothUnion(0.03, legs)
      .smoothUnion(0.02, paws)
      .smoothUnion(0.02, tailShape.bone('tail'))
      .smoothUnion(0.015, cheekTufts.bone('head'), ears.bone('head'))
      .paintWhere(sdf.union(legs, paws).intersect(sdf.halfSpace([0, 1, 0], 0.16)), C.furDark, 0.04)
      .paintWhere(sdf.sphere(0.12).at(...TAIL_TIP).intersect(sdf.halfSpace([-0.3, -0.6, 0.74], -0.55)), C.cream, 0.02)
      .paintWhere(eyeRing.intersect(sdf.halfSpace([0, 0, -1], -0.2)), C.eyeRim, 0.002)
      .paintWhere(eye.intersect(sdf.halfSpace([0, 0, -1], -0.2)), C.eye, 0.002)
      .paintWhere(pupil.intersect(sdf.halfSpace([0, 0, -1], -0.2)), C.pupil, 0.002)
      .paintWhere(shine, '#ffffff', 0.002);
    k.body('fur', fur, {
      color: C.fur,
      roughness: 0.85,
      textureDensity: 1.5,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 60, y * 25, z * 60, 2),
    });

    // ------------------------------------------------------------------ cream: muzzle, brows, forelock, ruff
    // The grin: a dark band on the muzzle that curves up at the corners.
    const GRIN_R = 0.16;
    const GRIN_Y = 0.39;
    const grin = sdf.extrude(profile.arc(GRIN_R, 0.028, 226, 314), 0.4).at(0, GRIN_Y + GRIN_R, 0.3);
    const muzzleCream = muzzle.round(0.004).paintWhere(grin, C.mouth, 0.002);
    const browAt = (x: number, y: number): V3 => {
      const h = faceHit(x, y);
      return [h[0], h[1], h[2] - 0.008];
    };
    const brows = pair(
      sdf.chain(
        [
          [...browAt(0.15, 0.6), 0.018],
          [...browAt(0.1, 0.59), 0.022],
          [...browAt(0.05, 0.565), 0.022],
          [...browAt(0.03, 0.545), 0.018],
        ],
        0.01,
      ),
    );
    const top = sdf.raycast(skull, [0, 2, 0.16], [0, -1, 0])!;
    const forelock = sdf.chain(
      [
        [top[0], top[1] - 0.02, top[2] + 0.02, 0.036],
        [top[0] + 0.01, top[1] + 0.04, top[2] + 0.0, 0.03],
        [top[0] + 0.035, top[1] + 0.07, top[2] - 0.04, 0.008],
      ],
      0.012,
    );
    // The ruff: pointed tufts around the front of the neck, longest at the chest.
    const ruffRow = (n: number, y: number, spread: number, reach: number, lenMax: number, r: number) =>
      Array.from({ length: n }, (_, i) => {
        const u = (i - (n - 1) / 2) / ((n - 1) / 2);
        const a = u * spread * (Math.PI / 180);
        const len = lenMax * (1 - 0.35 * Math.abs(u));
        const from: V3 = [Math.sin(a) * 0.11, y, 0.12 + Math.cos(a) * 0.08];
        const to: V3 = [Math.sin(a) * (0.13 + len * 0.6), y - len, 0.15 + Math.cos(a) * reach];
        return sdf.cone(from, to, r, 0.004);
      });
    const ruff = sdf.smoothUnion(
      0.025,
      sdf.ellipsoid([0.12, 0.1, 0.07]).at(0, 0.33, 0.14), // the cream chest
      ...ruffRow(9, 0.39, 95, 0.13, 0.13, 0.05),
      ...ruffRow(6, 0.31, 55, 0.13, 0.12, 0.042),
    );
    const cream = sdf.union(muzzleCream.bone('head'), brows.bone('head'), forelock.bone('head'), ruff.bone('neck'));
    k.body('cream', cream, { color: C.cream, roughness: 0.8, textureDensity: 1.5 });

    // ------------------------------------------------------------------ nose, teeth, claws
    const noseAt = faceHit(0, 0.465);
    k.body('nose', sdf.ellipsoid([0.05, 0.034, 0.036]).at(noseAt[0], noseAt[1], noseAt[2] - 0.004).bone('head'), {
      color: C.nose,
      roughness: 0.25,
    });
    // Small square teeth along the top of the grin, and a fang at each corner.
    const teeth = sdf.union(
      ...[-0.06, -0.02, 0.02, 0.06].map((x) => {
        const y = GRIN_Y + GRIN_R - Math.sqrt(GRIN_R * GRIN_R - x * x) + 0.008;
        const h = faceHit(x, y);
        return sdf.box([0.02, 0.018, 0.014], 0.005).at(h[0], h[1], h[2] - 0.002);
      }),
      ...[-0.092, 0.092].map((x) => {
        const y = GRIN_Y + GRIN_R - Math.sqrt(GRIN_R * GRIN_R - x * x) + 0.01;
        const h = faceHit(x, y);
        return sdf.cone([h[0], h[1] + 0.004, h[2] - 0.004], [h[0], h[1] - 0.022, h[2] + 0.002], 0.011, 0.003);
      }),
    );
    k.body('teeth', teeth.bone('head'), { color: C.tooth, roughness: 0.3, detail: 0.003 });
    const claws = sdf.union(
      ...[FKNEE, BKNEE].flatMap((kn, j) =>
        [-0.03, 0, 0.03].map((x) =>
          sdf
            .cone([kn[0] + x, 0.02, kn[2] + 0.02 + 0.085 - Math.abs(x) * 0.4], [kn[0] + x, 0.004, kn[2] + 0.02 + 0.11 - Math.abs(x) * 0.4], 0.01, 0.003)
            .bone(j === 0 ? 'fshin.L' : 'bshin.L'),
        ),
      ),
    );
    k.body('claws', pair(claws), { color: C.claw, roughness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ animation
    const { wave, bump } = motion;

    // Trot: diagonal pairs move together (front-left with back-right).
    const gait = (duration: number, swing: number, lift: number, bob: number, headDip: number, tailUp: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const a = wave(p);
        const liftA = Math.max(0, wave(p, 1, 0.25));
        const liftB = Math.max(0, -wave(p, 1, 0.25));
        return {
          hips: { move: [0, -bob * bump(p, 2), 0] as const, rotate: [0, 0, 3 * a] as const },
          spine: { rotate: [2 * wave(p, 2), 0, -3 * a] as const },
          neck: { rotate: [headDip, 0, 0] as const },
          head: { rotate: [-4 * wave(p, 2, 0.25), 4 * a, 0] as const },
          tail: { rotate: [tailUp + 8 * wave(p, 2, 0.1), 18 * wave(p, 1, 0.2), 0] as const },
          'fleg.L': { rotate: [-swing * a, 0, 0] as const },
          'bleg.R': { rotate: [-swing * a, 0, 0] as const },
          'fleg.R': { rotate: [swing * a, 0, 0] as const },
          'bleg.L': { rotate: [swing * a, 0, 0] as const },
          'fshin.L': { rotate: [lift * liftA, 0, 0] as const },
          'bshin.R': { rotate: [-lift * liftA, 0, 0] as const },
          'fshin.R': { rotate: [lift * liftB, 0, 0] as const },
          'bshin.L': { rotate: [-lift * liftB, 0, 0] as const },
        };
      },
    });
    k.animation('walk', gait(0.6, 26, 40, 0.01, 0, 0));
    k.animation('run', gait(0.36, 40, 62, 0.024, 10, 14));
    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        spine: { move: [0, 0.004 * bump(p, 2), 0] },
        neck: { rotate: [3 * bump(p), 5 * wave(p, 1, 0.2), 0] },
        head: { rotate: [-3 * wave(p, 2, 0.1), 0, 3 * wave(p)] },
        tail: { rotate: [4 * wave(p, 1, 0.3), 20 * wave(p, 2), 0] },
      }),
    });

    // A lunging bite: crouch back with the head low, spring forward, snap the head up, settle.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.32, p) * (1 - ease(0.32, 0.42, p));
        const hit = ease(0.32, 0.44, p) * (1 - ease(0.58, 1, p));
        const snap = ease(0.4, 0.48, p) * (1 - ease(0.52, 0.8, p));
        return {
          hips: { move: [0, -0.02 * wind, -0.04 * wind + 0.09 * hit] },
          spine: { rotate: [6 * wind - 6 * hit, 0, 0] },
          neck: { rotate: [14 * wind - 8 * hit, 0, 0] },
          head: { rotate: [6 * wind - 22 * snap, 0, 0] },
          tail: { rotate: [-10 * wind + 20 * hit, 10 * wave(p, 3), 0] },
          'fleg.L': { rotate: [14 * wind - 34 * hit, 0, 0] },
          'fleg.R': { rotate: [14 * wind - 26 * hit, 0, 0] },
          'bleg.L': { rotate: [-10 * wind + 26 * hit, 0, 0] },
          'bleg.R': { rotate: [-10 * wind + 20 * hit, 0, 0] },
          'fshin.L': { rotate: [24 * hit, 0, 0] },
          'fshin.R': { rotate: [16 * hit, 0, 0] },
        };
      },
    });

    // Hit, struck from the front: a yelp. The head jerks up and back (the nose and the grin point
    // up, the ears sweep back), the body flinches back and a little to its right, and the tail
    // tucks down; then a quick return. Each upper leg leans by the angle that cancels the body's
    // shift and each shin turns back by the same angle, so the paws stay flat and planted; the
    // hips sink by the height the leaning upper legs lose.
    const { keys } = motion;
    const DEG = 180 / Math.PI;
    const UPPER = 0.12; // shoulder or hip joint to knee
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.34, 0.85], [1, 0]] as const);
        const tuck = keys(p, [[0, 0], [0.14, 1], [0.55, 0.75], [1, 0]] as const);
        const back = 0.028 * h;
        const side = 0.01 * h;
        const a = Math.asin(back / UPPER) * DEG;
        const c = Math.asin(side / UPPER) * DEG;
        const sink = UPPER - Math.sqrt(UPPER * UPPER - back * back - side * side);
        const upper = { rotate: [-a, 0, c] as const };
        const lower = { rotate: [a, 0, -c] as const };
        return {
          hips: { move: [-side, 0.005 * h - sink, -back] },
          neck: { rotate: [-14 * h, -4 * h, 0] },
          head: { rotate: [-26 * h, -5 * h, 8 * h] },
          tail: { rotate: [-50 * tuck, 10 * tuck, 0] },
          'fleg.L': upper,
          'fleg.R': upper,
          'bleg.L': upper,
          'bleg.R': upper,
          'fshin.L': lower,
          'fshin.R': lower,
          'bshin.L': lower,
          'bshin.R': lower,
        };
      },
    });

    // Death: a yelping recoil and a stagger, then the legs give way: the front legs fold forward
    // with the forearms flat (the big paws cannot kneel), the hind legs bend, and the chest drops.
    // Then the wolf rolls onto its right side and lies still, the legs out and the head down.
    // The head is much wider than the body (the cheek tufts), so the neck turns it part of the way
    // back up: the head then rests on its lower cheek tuft instead of pushing the tuft into the
    // ground. The hips lift keeps every part on or above the ground, measured per phase with the
    // rigid-bone ground probe (scratch tool); zero where the pose already clears the ground.
    const DEATH_LIFT: readonly (readonly [number, number])[] = [
      [0, 0], [0.275, 0], [0.3, 0.004], [0.325, 0.008], [0.35, 0.011], [0.375, 0.012], [0.4, 0.011],
      [0.425, 0.014], [0.45, 0.019], [0.475, 0.025], [0.5, 0.032], [0.525, 0.034], [0.55, 0.036],
      [0.575, 0.041], [0.6, 0.046], [0.625, 0.04], [0.65, 0.028], [0.675, 0.02], [0.7, 0.016],
      [0.725, 0.012], [0.75, 0.006], [0.775, 0], [0.8, 0.002], [0.825, 0.009], [0.85, 0.015], [0.875, 0.016], [1, 0.016],
    ];
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const recoil = keys(p, [[0, 0], [0.06, 1], [0.16, 0.3], [0.26, 0]] as const);
        const sway = keys(p, [[0.05, 0], [0.14, 1], [0.24, -0.5], [0.34, 0]] as const);
        const fold = keys(p, [[0.22, 0], [0.36, 1]] as const); // the front legs buckle
        const drop = keys(p, [[0.26, 0], [0.42, 1], [0.55, 0.9], [0.74, 0]] as const); // onto the chest
        const crouch = keys(p, [[0.26, 0], [0.42, 1]] as const);
        const roll = keys(p, [[0.42, 0], [0.74, 1]] as const); // over onto the right side
        const outL = keys(p, [[0.46, 0], [0.68, 1]] as const); // the upper legs go out first
        const outR = keys(p, [[0.56, 0], [0.82, 1]] as const); // the lower legs slide out last
        const tuckR = keys(p, [[0.42, 0], [0.56, 1], [0.74, 0.3], [0.84, 0]] as const); // the lower legs fold under the belly
        const bounce = keys(p, [[0.72, 0], [0.78, 1], [0.86, 0]] as const);
        const twitch = Math.max(0, Math.sin((p - 0.86) * Math.PI * 12)) * Math.max(0, Math.min(1, (p - 0.86) / 0.03, (1 - p) / 0.06));
        const legZ = -5 * sway;
        const frontLeg = (f: number, out: number, z: number, tw: number) => ({
          upper: [45 * f - 24 * out - tw, 0, legZ + z] as const,
          lower: [-100 * f - 8 * out, 0, 0] as const,
        });
        // The shin also cancels the hips pitch, so the hind paws stay flat instead of toes-down.
        const backLeg = (c: number, out: number, z: number, tw: number) => ({
          upper: [-50 * c + 24 * out + tw, 0, legZ + z] as const,
          lower: [50 * c + 6 * out - 16 * drop, 0, 0] as const,
        });
        const fL = frontLeg(fold * (1 - outL), outL, 14 * outL, 6 * twitch);
        const fR = frontLeg(fold * (1 - outR), outR, -6 * outR + 35 * tuckR, 0);
        const bL = backLeg(crouch * (1 - outL), outL, 14 * outL, 5 * twitch);
        const bR = backLeg(crouch * (1 - outR), outR, -6 * outR + 35 * tuckR, 0);
        const y = 0.012 * Math.abs(sway) - 0.03 * drop * (1 - roll) - 0.1 * roll + 0.012 * bounce + keys(p, DEATH_LIFT, 'linear');
        return {
          hips: { move: [-0.02 * sway - 0.08 * roll, y, -0.03 * recoil], rotate: [16 * drop, 0, 5 * sway + 90 * roll] },
          spine: { rotate: [0, -6 * sway, 0] },
          neck: { rotate: [-16 * recoil + 10 * drop + 8 * roll, 0, -32 * roll] },
          head: { rotate: [-24 * recoil + 6 * drop + 4 * roll, 0, -13 * roll] },
          tail: { rotate: [-35 * recoil - 45 * roll, 20 * sway, 0] },
          'fleg.L': { rotate: fL.upper },
          'fshin.L': { rotate: fL.lower },
          'fleg.R': { rotate: fR.upper },
          'fshin.R': { rotate: fR.lower },
          'bleg.L': { rotate: bL.upper },
          'bshin.L': { rotate: bL.lower },
          'bleg.R': { rotate: bR.upper },
          'bshin.R': { rotate: bR.lower },
        };
      },
    });
  },
});
