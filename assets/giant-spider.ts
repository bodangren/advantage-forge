import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Giant spider — Chibi Quest monster (catalog `monsters/small/giant-spider`), about 0.5 m tall and
 * 0.95 m across the legs, faces +Z. Target: docs/monster-mockups/giant-spider_001.jpg (made with
 * mmx; one front view). The mockup sets its round body under the head; here the big abdomen sits
 * behind the head, so the spider still reads as a spider from above and from the side.
 *
 * Role: a creepy cave and forest enemy, seen in 3D and as a 128 px sprite; the eyes, the fangs,
 *   and the eight legs must read.
 * One idea: a fuzzy dark purple spider with two huge glaring red eyes, pale fangs, and eight
 *   high-kneed legs banded in orange, carrying a big round abdomen with an orange skull mark.
 * Shape language: round masses (head, abdomen, eyes) with sharp accents (fangs, pointed leg tips,
 *   angry brows).
 * Palette (60/30/10): dark purple #3e2a52 (darker underside); orange #f08a2a bands and skull
 *   mark; red eyes #d8282a with white eyeballs as the accent; pale fangs #efe6d0.
 * Value plan: the white eyeballs with red irises on the dark head are the strongest contrast
 *   (focal point); the orange skull on the abdomen is the second.
 * Bodies: carapace (head, abdomen, legs, with bands and the skull mark), eyes, small-eyes, fangs,
 *   brows.
 * Rig: `body` (root), `head`, `abdomen`, and per leg a `leg<n>` (femur) and `shin<n>` bone on each
 *   side. Clips: idle, walk (an alternating four-leg gait), run, attack (rear up and strike).
 */

const C = {
  body: '#3e2a52',
  bodyDark: '#2a1c38',
  orange: '#f08a2a',
  white: '#f6f2ea',
  red: '#d8282a',
  redDark: '#8a1418',
  pupil: '#140c10',
  fang: '#efe6d0',
  brow: '#2e2040',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const rad = Math.PI / 180;

// The thorax center; all legs start around it. Leg angles are measured in the XZ plane from +X
// toward +Z (the front), for the left side.
const THORAX: V3 = [0, 0.24, 0.05];
const LEG_ANGLES = [52, 20, -14, -48];
const legRoot = (a: number): V3 => [THORAX[0] + Math.cos(a * rad) * 0.08, THORAX[1], THORAX[2] + Math.sin(a * rad) * 0.07];
const legKnee = (a: number): V3 => [THORAX[0] + Math.cos(a * rad) * 0.26, 0.36, THORAX[2] + Math.sin(a * rad) * 0.24];
const legMid = (a: number): V3 => [THORAX[0] + Math.cos(a * rad) * 0.36, 0.18, THORAX[2] + Math.sin(a * rad) * 0.33];
const legTip = (a: number): V3 => [THORAX[0] + Math.cos(a * rad) * 0.4, 0.0, THORAX[2] + Math.sin(a * rad) * 0.37];

export default defineAsset({
  name: 'giant-spider',
  description: 'Chibi giant spider monster: a fuzzy purple head with two huge glaring red eyes and pale fangs, eight orange-banded legs, and a big abdomen with an orange skull mark.',
  detail: 0.005,
  reference: 'docs/monster-mockups/giant-spider_001.jpg',

  build(k) {
    const bones: Record<string, { parent?: string; at: V3; tail?: V3 }> = {
      body: { at: THORAX },
      head: { parent: 'body', at: [0, 0.26, 0.12], tail: [0, 0.3, 0.3] },
      abdomen: { parent: 'body', at: [0, 0.28, -0.04], tail: [0, 0.36, -0.42] },
    };
    LEG_ANGLES.forEach((a, i) => {
      bones[`leg${i}.L`] = { parent: 'body', at: legRoot(a), tail: legKnee(a) };
      bones[`shin${i}.L`] = { parent: `leg${i}.L`, at: legKnee(a), tail: legTip(a) };
      const m = (p: V3): V3 => [-p[0], p[1], p[2]];
      bones[`leg${i}.R`] = { parent: 'body', at: m(legRoot(a)), tail: m(legKnee(a)) };
      bones[`shin${i}.R`] = { parent: `leg${i}.R`, at: m(legKnee(a)), tail: m(legTip(a)) };
    });
    k.skeleton(bones);

    // ------------------------------------------------------------------ head, abdomen
    const head = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.205, 0.18, 0.17]).at(0, 0.31, 0.13),
      sdf.ellipsoid([0.14, 0.08, 0.12]).at(0, 0.21, 0.08), // the thorax under the head
      // A heavy brow shelf over the eyes.
      sdf.ellipsoid([0.17, 0.04, 0.08]).at(0, 0.405, 0.2),
    );
    const ABD: V3 = [0, 0.33, -0.22];
    const abdomenShape = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.21, 0.19, 0.23]).rotateX(-12).at(...ABD),
      sdf.sphere(0.06).at(0, 0.27, -0.03), // the waist
    );
    const faceHit = (x: number, y: number) => sdf.raycast(head, [x, y, 2], [0, 0, -1])!;

    // ------------------------------------------------------------------ legs
    const legs = LEG_ANGLES.map((a, i) => {
      const root = legRoot(a);
      const knee = legKnee(a);
      const mid = legMid(a);
      const tip = legTip(a);
      const femur = sdf.cone(root, knee, 0.046, 0.04).bone(`leg${i}.L`);
      const tibia = sdf
        .chain(
          [
            [...knee, 0.04],
            [...mid, 0.033],
            [...tip, 0.01],
          ],
          0.008,
        )
        .bone(`shin${i}.L`);
      return sdf.smoothUnion(0.02, femur, tibia);
    });
    // Orange bands at the knee and the mid joint of every leg.
    const bands = sdf.union(
      ...LEG_ANGLES.flatMap((a) => {
        const lerp3 = (p: V3, q: V3, t: number): V3 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
        return [
          sdf.sphere(0.052).at(...legKnee(a)),
          sdf.sphere(0.042).at(...lerp3(legRoot(a), legKnee(a), 0.45)).intersect(sdf.sphere(0.2).at(...legKnee(a))),
          sdf.sphere(0.044).at(...legMid(a)),
          sdf.sphere(0.03).at(...lerp3(legMid(a), legTip(a), 0.55)),
        ];
      }),
    );

    // ------------------------------------------------------------------ the skull mark on the abdomen's back
    const skullOutline = sdf.union(
      sdf.extrude(profile.circle(0.085), 1).at(0, 0.02, 0),
      sdf.extrude(profile.rect([0.09, 0.07], 0.02), 1).at(0, -0.055, 0),
    );
    const skullHoles = sdf.union(
      sdf.extrude(profile.circle(0.026), 1.1).at(-0.034, 0.012, 0),
      sdf.extrude(profile.circle(0.026), 1.1).at(0.034, 0.012, 0),
      sdf.extrude(profile.polygon([[0, -0.03], [0.012, -0.05], [-0.012, -0.05]]), 1.1),
      ...[-0.03, 0, 0.03].map((x) => sdf.extrude(profile.rect([0.008, 0.04]), 1.1).at(x, -0.085, 0)),
    );
    // Turn the stencil so it runs along the direction up and back from the abdomen's center, with
    // the skull's top toward the head, and keep only the upper-back half.
    const axis: V3 = [0, 0.8, -0.6];
    const skullStencil = skullOutline
      .subtract(skullHoles)
      .rotateZ(180)
      .rotateX(-126.87)
      .at(...ABD)
      .intersect(sdf.halfSpace([0, -axis[1], -axis[2]], -(axis[1] * ABD[1] + axis[2] * ABD[2])));

    const body = sdf
      .smoothUnion(0.03, head.bone('head'), abdomenShape.bone('abdomen'))
      .smoothUnion(0.02, ...legs)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.2).intersect(sdf.sphere(0.3).at(0, 0.2, 0)), C.bodyDark, 0.05)
      .paintWhere(bands, C.orange, 0.004)
      .paintWhere(skullStencil, C.orange, 0.003);
    k.body('carapace', pair(body), {
      color: C.body,
      roughness: 0.8,
      textureDensity: 1.5,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 80, y * 80, z * 80, 2),
    });

    // ------------------------------------------------------------------ eyes: two big glaring eyes, four small ones above
    const EYE_X = 0.078;
    const EYE_Y = 0.32;
    const eyeHit = faceHit(EYE_X, EYE_Y);
    const EYE_R = 0.07;
    const eyeC: V3 = [eyeHit[0], eyeHit[1], eyeHit[2] - 0.03];
    const bigEye = sdf
      .sphere(EYE_R)
      .at(...eyeC)
      .paintWhere(sdf.cylinder(0.046, 1).rotateX(90).at(eyeC[0] - 0.008, eyeC[1] - 0.006, 0), C.red, 0.002)
      .paintWhere(sdf.cylinder(0.02, 1).rotateX(90).at(eyeC[0] - 0.01, eyeC[1] - 0.006, 0), C.pupil, 0.002)
      .paintWhere(sdf.sphere(0.012).at(eyeC[0] + 0.004, eyeC[1] + 0.02, eyeC[2] + EYE_R), C.white, 0.002)
      // An angry lid in body purple across the top of the eye, lower toward the middle.
      .paintWhere(
        sdf
          .halfSpace([0.4 / Math.hypot(0.4, 1), -1 / Math.hypot(0.4, 1), 0], (0.4 * eyeC[0] - (eyeC[1] + 0.03)) / Math.hypot(0.4, 1))
          .intersect(sdf.sphere(EYE_R + 0.01).at(...eyeC)),
        C.body,
        0.002,
      );
    k.body('eyes', pair(bigEye).bone('head'), { color: C.white, roughness: 0.1, textureDensity: 2 });
    const smallEyes = pair(
      sdf.union(
        ...[
          [0.03, 0.445, 0.024],
          [0.085, 0.43, 0.019],
        ].map(([x, y, r]) => {
          const h = sdf.raycast(head, [x!, y!, 2], [0, 0, -1])!;
          return sdf.sphere(r!).at(h[0], h[1], h[2] - 0.006).paintWhere(sdf.sphere(0.006).at(h[0] + 0.004, h[1] + 0.01, h[2] + r! - 0.006), C.white, 0.002);
        }),
      ),
    );
    k.body('small-eyes', smallEyes.bone('head'), { color: C.red, roughness: 0.12 });

    // ------------------------------------------------------------------ brows and fangs
    const browAt = (x: number, y: number): V3 => {
      const h = faceHit(x, y);
      return [h[0], h[1], h[2] - 0.006];
    };
    const brows = pair(
      sdf.chain(
        [
          [...browAt(EYE_X + 0.075, EYE_Y + 0.08), 0.024],
          [...browAt(EYE_X + 0.015, EYE_Y + 0.072), 0.03],
          [...browAt(EYE_X - 0.05, EYE_Y + 0.04), 0.024],
        ],
        0.008,
      ),
    );
    k.body('brows', brows.bone('head'), { color: C.brow, roughness: 0.6 });
    // Chelicerae: two dark bulbs under the eyes, each ending in a curved pale fang.
    const cheliAt = faceHit(0.05, 0.225);
    const fang = sdf.chain(
      [
        [cheliAt[0], cheliAt[1] - 0.01, cheliAt[2] - 0.006, 0.02],
        [cheliAt[0] + 0.004, cheliAt[1] - 0.05, cheliAt[2] + 0.012, 0.015],
        [cheliAt[0] - 0.006, cheliAt[1] - 0.09, cheliAt[2] + 0.004, 0.004],
      ],
      0.006,
    );
    k.body('fangs', pair(fang).bone('head'), { color: C.fang, roughness: 0.35, detail: 0.004 });

    // ------------------------------------------------------------------ animation
    const { wave, bump } = motion;
    // Lifting a leg that points along angle a (deg): rotate about the horizontal axis d x up.
    const lift = (a: number, side: 1 | -1, deg: number) => {
      const th = side > 0 ? a * rad : Math.PI - a * rad;
      return [-Math.sin(th) * deg, 0, Math.cos(th) * deg] as const;
    };
    const legPose = (i: number, side: 1 | -1, swing: number, up: number, fold: number) => {
      const a = LEG_ANGLES[i]!;
      const l = lift(a, side, up);
      const f = lift(a, side, -fold);
      const name = side > 0 ? 'L' : 'R';
      return {
        [`leg${i}.${name}`]: { rotate: [l[0], -side * swing, l[2]] as const },
        [`shin${i}.${name}`]: { rotate: [f[0], 0, f[2]] as const },
      };
    };

    // An alternating four-leg gait: L0, R1, L2, R3 step together, then R0, L1, R2, L3.
    const gait = (duration: number, swing: number, up: number, bob: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const upA = up * Math.max(0, wave(p, 1, 0.25));
        const upB = up * Math.max(0, -wave(p, 1, 0.25));
        const pose: Record<string, { rotate?: readonly [number, number, number]; move?: readonly [number, number, number] }> = {
          body: { move: [0, -bob * bump(p, 2), 0], rotate: [0, 3 * s, 0] },
          abdomen: { rotate: [3 * wave(p, 2, 0.2), 4 * s, 0] },
          head: { rotate: [0, -3 * s, 0] },
        };
        for (let i = 0; i < 4; i++) {
          const groupA = i % 2 === 0; // for the left side
          Object.assign(pose, legPose(i, 1, groupA ? swing * s : -swing * s, groupA ? upA : upB, 0));
          Object.assign(pose, legPose(i, -1, groupA ? -swing * s : swing * s, groupA ? upB : upA, 0));
        }
        return pose;
      },
    });
    k.animation('walk', gait(0.7, 20, 28, 0.01));
    k.animation('run', gait(0.4, 26, 36, 0.016));

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => {
        const pose: Record<string, { rotate?: readonly [number, number, number]; move?: readonly [number, number, number]; scale?: readonly [number, number, number] }> = {
          body: { move: [0, -0.004 * bump(p, 2), 0] },
          abdomen: { scale: [1 + 0.025 * bump(p, 2), 1 + 0.025 * bump(p, 2), 1 + 0.025 * bump(p, 2)], rotate: [2 * wave(p, 1, 0.2), 0, 0] },
          head: { rotate: [0, 6 * wave(p, 1, 0.3), 0] },
        };
        // The two front legs twitch and tap, one after the other.
        Object.assign(pose, legPose(0, 1, 0, 10 * bump(p, 3, 0.1), 0));
        Object.assign(pose, legPose(0, -1, 0, 10 * bump(p, 3, 0.45), 0));
        return pose;
      },
    });

    // Rear up with the front legs raised, then strike down with the fangs, and settle.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const rear = ease(0, 0.35, p) * (1 - ease(0.35, 0.47, p));
        const hit = ease(0.35, 0.47, p) * (1 - ease(0.62, 1, p));
        const pose: Record<string, { rotate?: readonly [number, number, number]; move?: readonly [number, number, number] }> = {
          body: { move: [0, 0.05 * rear - 0.02 * hit, -0.03 * rear + 0.06 * hit], rotate: [-26 * rear + 14 * hit, 0, 0] },
          head: { rotate: [-6 * rear + 14 * hit, 0, 0] },
          abdomen: { rotate: [10 * rear - 6 * hit, 0, 0] },
        };
        Object.assign(pose, legPose(0, 1, -12 * rear, 65 * rear - 10 * hit, 25 * rear));
        Object.assign(pose, legPose(0, -1, -12 * rear, 65 * rear - 10 * hit, 25 * rear));
        Object.assign(pose, legPose(1, 1, 0, 30 * rear, 10 * rear));
        Object.assign(pose, legPose(1, -1, 0, 30 * rear, 10 * rear));
        // The back legs brace down as the body tilts back.
        Object.assign(pose, legPose(3, 1, 0, -12 * rear, 0));
        Object.assign(pose, legPose(3, -1, 0, -12 * rear, 0));
        return pose;
      },
    });
  },
});
