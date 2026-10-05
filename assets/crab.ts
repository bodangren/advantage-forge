import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';
import type { BonePose } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Crab — Chibi Quest wildlife (catalog `wildlife/water/crab`), a small round red crab about 0.3 m
 * tall to the tips of its horns, faces +Z. Target: docs/wildlife-mockups/crab_001.jpg (made with
 * mmx).
 *
 * A clay-toy crab, built at 1.8x its size and scaled down (the cell count stays): a round red body
 * that sits low between short bead legs, a happy face on the front (two big glossy eyes set into the
 * body and a wide thin smile), two small tan horns on top, and two short arms with round C-shaped
 * pincers held up at the sides. Everything is red: no pale underside. The giant crab of
 * `assets/giant-crab.ts` (on `assets/parts/crab-kind.ts`) stays the grumpy monster with eye stalks.
 * Rig: body, three bones per claw (arm, claw, and the inner finger), and one bone per leg (four per
 * side). Clips: idle (a bob and slow pincer snaps), walk and run (a sideways scuttle in place: the
 * legs lift in two alternating groups), attack (both claws up and forward, then a snap), hit (a
 * jolt back), and death (it slumps flat with the legs splayed and the claws down).
 * Role: ambient life on beaches, docks, and in tide pools; the round body, the raised claws, and the
 *   big eyes read at 128 px.
 * Palette (60/30/10): red #e8553c body, legs, and claws; tan #9a7450 horns; white eyes with black
 *   pupils and a black smile as the accent.
 */

type V3 = [number, number, number];
type Pose = Record<string, BonePose>;

// The body: a round ball that sits low; the face is on its front.
const BODY_C: V3 = [0, 0.27, 0];
const BODY_R: V3 = [0.205, 0.2, 0.18];
// A claw (left): the shoulder in the side of the body, the wrist under the palm, and the root of
// the inner finger, which opens on its own bone.
const SHOULDER: V3 = [0.17, 0.25, 0.045];
const WRIST: V3 = [0.272, 0.3, 0.06];
const NIP: V3 = [0.25, 0.35, 0.06];
// The legs (left): directions around the body from the front to the back, in degrees from +X.
const LEG_DEG = [58, 28, -4, -36];
const legDir = (i: number): V3 => {
  const a = (LEG_DEG[i]! * Math.PI) / 180;
  return [Math.cos(a), 0, Math.sin(a)];
};
const legAt = (i: number, r: number, y: number): V3 => {
  const d = legDir(i);
  return [d[0] * r, y, d[2] * r];
};
const HIP = (i: number) => legAt(i, 0.135, 0.13);
const KNEE = (i: number) => legAt(i, 0.2, 0.1);
const FOOT = (i: number) => legAt(i, 0.236, 0.041);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

/** A point on the body ball's front at (x, y), `inset` meters inside the surface. */
function front(x: number, y: number, inset = 0): V3 {
  const u = x / BODY_R[0];
  const v = (y - BODY_C[1]) / BODY_R[1];
  return [x, y, BODY_C[2] + BODY_R[2] * Math.sqrt(Math.max(0, 1 - u * u - v * v)) - inset];
}

export default scaleAsset(
  defineAsset({
    name: 'crab',
    description: 'Chibi crab: a small round red crab with a happy face (two big glossy eyes set into the body and a wide thin smile), two small tan horns on top, short round pincers held up at the sides, and short bead legs; the body sits low; crab rig with a sideways scuttle.',
    detail: 0.006,
    reference: 'docs/wildlife-mockups/crab_001.jpg',
    variants: {
      body: { red: '#e8553c', orange: '#e88a2a', blue: '#3a7ab8', green: '#5a8a3a' },
      horns: { tan: '#9a7450', dark: '#5a4030', ivory: '#e8dcc0' },
      eyes: { black: '#1a1416', brown: '#4a2a18' },
    },
    presets: {
      orange: { body: 'orange', horns: 'dark', eyes: 'brown' },
      blue: { body: 'blue', horns: 'ivory', eyes: 'black' },
      green: { body: 'green', horns: 'tan', eyes: 'brown' },
    },

    build(k) {
      const T = { body: k.tint('body'), bodyDark: k.tint('body', -0.18), horns: k.tint('horns'), hornTip: k.tint('horns', 0.3), eye: k.tint('eyes') };
      const clay = (x: number, y: number, z: number) => noise.fbm(x * 9, y * 9, z * 9, 2);

      // ------------------------------------------------------------------ skeleton
      const legBones = Object.fromEntries(
        LEG_DEG.flatMap((_, i) => [
          [`leg${i}.L`, { parent: 'body', at: HIP(i), tail: FOOT(i) }],
          [`leg${i}.R`, { parent: 'body', at: mx(HIP(i)), tail: mx(FOOT(i)) }],
        ]),
      );
      k.skeleton({
        body: { at: [0, 0.2, 0], tail: [0, 0.45, 0] },
        'arm.L': { parent: 'body', at: SHOULDER },
        'claw.L': { parent: 'arm.L', at: WRIST },
        'nip.L': { parent: 'claw.L', at: NIP, tail: [0.245, 0.45, 0.06] },
        'arm.R': { parent: 'body', at: mx(SHOULDER) },
        'claw.R': { parent: 'arm.R', at: mx(WRIST) },
        'nip.R': { parent: 'claw.R', at: mx(NIP), tail: [-0.245, 0.45, 0.06] },
        ...legBones,
      });

      // ------------------------------------------------------------------ body and face
      // The face: a wide thin smile (an arc stencil through the front) under the eyes.
      const smile = sdf.extrude(profile.arc(0.137, 0.013, 217, 323), 0.4).at(0, 0.334, 0.2);
      const shell = sdf
        .ellipsoid(BODY_R)
        .at(...BODY_C)
        .displace(0.004, clay)
        .paintWhere(smile, T.eye, 0.002)
        // A slightly darker red low on the body, where the shadow of a clay toy falls.
        .paintWhere(sdf.ellipsoid([0.3, 0.09, 0.3]).at(0, 0.07, 0), T.bodyDark, 0.05);
      k.body('shell', shell.bone('body'), { color: T.body, roughness: 0.62, textureDensity: 1.6, detail: 0.005 });

      // Two big glossy eyes set into the front of the body, a black pupil and a small shine each.
      const eye = (side: 1 | -1) => {
        const c = front(0.078 * side, 0.375, 0.02);
        const r = 0.056;
        const on = (x: number, y: number, z: number): V3 => {
          const l = Math.hypot(x, y, z);
          return [c[0] + (x / l) * r, c[1] + (y / l) * r, c[2] + (z / l) * r];
        };
        return sdf
          .sphere(r)
          .at(...c)
          .paintWhere(sdf.sphere(r * 0.84).at(...on(-0.1 * side, -0.12, 0.98)), T.eye, 0.002)
          .paintWhere(sdf.sphere(r * 0.16).at(...on(-0.1 * side + 0.28, 0.2, 0.94)), '#ffffff', 0.001);
      };
      k.body('eyes', sdf.union(eye(1), eye(-1)), { color: '#fbfaf6', roughness: 0.08, bone: 'body', textureDensity: 2, detail: 0.003 });

      // Two small horns on top, tilted out, with lighter tips.
      const horn = sdf
        .cone([0.044, 0.43, -0.01], [0.062, 0.548, -0.008], 0.021, 0.006)
        .paintWhere(sdf.halfSpace([0, -1, 0], -0.51), T.hornTip, 0.02);
      k.body('horns', horn.mirror('x'), { color: T.horns, roughness: 0.5, bone: 'body', detail: 0.003 });

      // ------------------------------------------------------------------ claws
      // A short round arm bead from the side of the body, then a round C-shaped pincer: a palm, a
      // thick outer finger that curls up and over, and a short inner finger (on its own bone).
      const arm = sdf
        .smoothUnion(
          0.02,
          sdf.capsule(SHOULDER, [0.215, 0.258, 0.055], 0.032),
          sdf.ellipsoid([0.052, 0.036, 0.04]).rotateZ(12).at(0.232, 0.262, 0.058),
        )
        .bone('arm.L');
      const palm = sdf
        .smoothUnion(
          0.03,
          sdf.ellipsoid([0.06, 0.056, 0.046]).at(0.296, 0.33, 0.06),
          sdf.chain([[0.33, 0.32, 0.06, 0.05], [0.36, 0.405, 0.06, 0.047], [0.338, 0.47, 0.06, 0.034], [0.305, 0.488, 0.06, 0.021]], 0.025),
        )
        .bone('claw.L');
      const finger = sdf.chain([[0.255, 0.34, 0.06, 0.036], [0.238, 0.405, 0.06, 0.03], [0.244, 0.448, 0.06, 0.019]], 0.02).bone('nip.L');
      const claw = sdf.smoothUnion(0.012, arm, sdf.smoothUnion(0.014, palm, finger));
      k.body('claws', claw.displace(0.003, clay).mirror('x'), { color: T.body, roughness: 0.62, detail: 0.004 });

      // ------------------------------------------------------------------ legs
      // Short legs of two round beads each, out and down from under the body to the ground.
      const leg = (i: number) =>
        sdf
          .smoothUnion(0.005, sdf.capsule(HIP(i), KNEE(i), 0.042), sdf.capsule(KNEE(i), FOOT(i), 0.04))
          .bone(`leg${i}.L`);
      k.body('legs', sdf.union(...LEG_DEG.map((_, i) => leg(i))).displace(0.003, clay).mirror('x'), {
        color: T.body,
        roughness: 0.62,
        detail: 0.004,
      });

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys, mirrorPose } = motion;
      // Both claws at once: arm forward (x), arm out (z, positive raises the left claw), and the
      // inner finger open (degrees).
      const claws = (fwd: number, out: number, open: number): Pose => ({
        ...mirrorPose({ 'arm.L': { rotate: [fwd, 0, out] }, 'nip.L': { rotate: [0, 0, open] } }),
        'arm.L': { rotate: [fwd, 0, out] },
        'nip.L': { rotate: [0, 0, open] },
      });
      // All legs: lift (degrees, positive raises the foot) and swing (degrees about Y) per leg.
      const legs = (f: (i: number, side: 1 | -1) => [number, number]): Pose => {
        const pose: Pose = {};
        LEG_DEG.forEach((_, i) => {
          const [liftL, swingL] = f(i, 1);
          const [liftR, swingR] = f(i, -1);
          pose[`leg${i}.L`] = { rotate: [0, swingL, liftL] };
          pose[`leg${i}.R`] = { rotate: [0, -swingR, -liftR] };
        });
        return pose;
      };

      // Idle: a slow bob, the claws sway, and the pincers snap twice.
      k.animation('idle', {
        duration: 2.4,
        pose: (_t, p) => ({
          body: { move: [0, 0.006 * bump(p, 2), 0], rotate: [0, 4 * wave(p, 1), 2 * wave(p, 1, 0.25)] },
          ...claws(3 * wave(p, 1, 0.1), 6 * wave(p, 1, 0.3), 6 + 14 * Math.max(0, wave(p, 2, 0.1)) ** 2),
        }),
      });

      // Walk and run: a sideways scuttle in place. The legs lift in two alternating groups (front
      // and third legs of one side with the second and back legs of the other), the body sways
      // from side to side and bobs, and the claws bounce.
      const scuttle = (duration: number, lift: number, sway: number) => ({
        duration,
        pose: (_t: number, p: number): Pose => ({
          body: { move: [sway * wave(p, 1), 0.008 * bump(p, 2), 0], rotate: [0, 0, 3 * wave(p, 1)] },
          ...claws(4 * wave(p, 2), 6 * wave(p, 2, 0.25), 8),
          ...legs((i, side) => {
            const group = (i + (side === 1 ? 0 : 1)) % 2 === 0 ? 0 : 0.5;
            return [lift * bump(p, 2, group), 10 * wave(p, 2, group)];
          }),
        }),
      });
      k.animation('walk', scuttle(0.7, 18, 0.01));
      k.animation('run', scuttle(0.4, 24, 0.016));

      // Attack: it rears back with both claws up and open, then lunges with the claws forward and
      // snaps them shut.
      k.animation('attack', {
        duration: 0.8,
        loop: false,
        pose: (_t, p) => {
          const rear = keys(p, [[0, 0], [0.32, 1], [0.44, 1], [0.52, -0.6], [0.7, -0.5], [1, 0]]);
          const open = keys(p, [[0, 6], [0.32, 34], [0.46, 36], [0.52, -4], [0.7, -4], [1, 6]]);
          return {
            body: { move: [0, 0.01 * Math.max(0, rear), -0.012 * rear], rotate: [-10 * rear, 0, 0] },
            ...claws(-34 * rear, 14 * Math.max(0, rear), open),
            ...legs(() => [6 * Math.max(0, -rear), 0]),
          };
        },
      });

      // Hit: a jolt back with the claws flung out, then it settles.
      k.animation('hit', {
        duration: 0.5,
        loop: false,
        pose: (_t, p) => {
          const s = keys(p, [[0, 0], [0.18, 1], [0.45, 0.6], [1, 0]]);
          return {
            body: { move: [0, -0.008 * s, -0.016 * s], rotate: [-10 * s, 6 * s * wave(p, 3), 0] },
            ...claws(10 * s, 22 * s, 20 * s),
          };
        },
      });

      // Death: it sways, then slumps flat on the ground with the legs splayed out and the claws
      // down at its sides.
      k.animation('death', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const sway = keys(p, [[0, 0], [0.15, 1], [0.3, -1], [0.4, 0]]);
          const flop = keys(p, [[0.3, 0], [0.62, 1], [0.7, 0.94], [0.8, 1]]);
          return {
            body: { move: [0, -0.07 * flop, 0], rotate: [6 * flop, 0, 6 * sway] },
            ...claws(10 * flop, -60 * flop, 18 * flop),
            ...legs(() => [42 * flop, 0]),
          };
        },
      });
    },
  }),
  0.55,
);
