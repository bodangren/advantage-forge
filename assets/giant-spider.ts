import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Giant spider — Chibi Quest monster (catalog `monsters/small/giant-spider`), about 0.53 m tall and
 * 0.95 m across the legs, faces +Z. Target: docs/monster-mockups/giant-spider_001.jpg (made with
 * mmx; one front view). As in the mockup, a big round head sits on a round thorax ball with an
 * orange splat; a big abdomen behind (with an orange skull) keeps it a spider from above and behind.
 *
 * Role: a creepy cave and forest enemy, seen in 3D and as a 128 px sprite; the eyes, the fangs,
 *   and the eight legs must read, also from above.
 * One idea: a fuzzy dark purple spider with two huge glaring red eyes under a heavy wrinkled
 *   brow, six small white eyeballs on top, pale fangs, and eight chunky legs banded in orange.
 * Shape language: round masses (head, thorax, abdomen, eyes) with sharp accents (fangs, pointed
 *   claw tips, the angry brow).
 * Palette (60/30/10): dark purple #3e2a52 (darker underside, near-black claw tips #1c1226); orange
 *   #f08a2a bands, splat, and skull; red irises #d8282a in white eyeballs as the accent; pale
 *   fangs #efe6d0.
 * Value plan: the white eyeballs with red irises on the dark head are the strongest contrast
 *   (focal point); the orange splat and skull are the second. The head tilts up 14 degrees, so the
 *   eyes also read in top-down sprites.
 * Bodies: carapace (head, thorax, abdomen, splat and skull marks), legs (with bands and claws),
 *   brows, eyes, small-eyes, fangs.
 * Rig: `body` (root), `head`, `abdomen`, `fang.L`/`fang.R`, and per leg a `leg<n>` (femur) and
 *   `shin<n>` bone on each side. Planted legs are solved with `reach`, so the tips stay put.
 *   Clips: idle, walk (an alternating four-leg gait), run, attack (rear up with the front legs
 *   raised and the fangs open, lunge and bite, recover), hit, death (curls up and rolls onto its
 *   back).
 */

const C = {
  body: '#3e2a52',
  bodyDark: '#2a1c38',
  brow: '#4a3462',
  claw: '#1c1226',
  orange: '#f08a2a',
  eyeWhite: '#fdfcf8',
  iris: '#d8282a',
  irisRim: '#8a1418',
  pupil: '#3a0a0e',
  fang: '#efe6d0',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const rad = Math.PI / 180;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const norm = (a: V3): V3 => scl(a, 1 / Math.hypot(a[0], a[1], a[2]));
const lerp3 = (p: V3, q: V3, t: number): V3 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
const mxp = (p: V3): V3 => [-p[0], p[1], p[2]];

// The thorax center; all legs start around it. Leg angles are measured in the XZ plane from +X
// toward +Z (the front), for the left side.
const THORAX: V3 = [0, 0.24, 0.05];
const LEG_ANGLES = [34, 8, -20, -50];
const at = (a: number, r: number, y: number, rz = r): V3 => [THORAX[0] + Math.cos(a * rad) * r, y, THORAX[2] + Math.sin(a * rad) * rz];
const legRoot = (a: number): V3 => at(a, 0.14, 0.215, 0.1);
const legKnee = (a: number): V3 => at(a, 0.3, 0.29, 0.27);
const legMid = (a: number): V3 => at(a, 0.405, 0.155, 0.37);
const legTip = (a: number): V3 => at(a, 0.465, 0.0, 0.43);

// The head is built upright and then tilted up about its bone's pivot.
const HEAD_PIVOT: V3 = [0, 0.26, 0.12];
const TILT = -14;
const headPose = (s: sdf.Shape) => s.at(-HEAD_PIVOT[0], -HEAD_PIVOT[1], -HEAD_PIVOT[2]).rotateX(TILT).at(...HEAD_PIVOT);
/** Where a point of the upright head goes when the head is tilted (the same rotation as headPose). */
const headPoint = (p: V3): V3 => {
  const c = Math.cos(TILT * rad);
  const s = Math.sin(TILT * rad);
  const y = p[1] - HEAD_PIVOT[1];
  const z = p[2] - HEAD_PIVOT[2];
  return [p[0], HEAD_PIVOT[1] + y * c - z * s, HEAD_PIVOT[2] + y * s + z * c];
};

export default defineAsset({
  name: 'giant-spider',
  description:
    'Chibi giant spider monster: a fuzzy purple head with two huge glaring red eyes, six small white eyeballs, pale fangs, eight chunky orange-banded legs, a round thorax with an orange splat, and a big abdomen with an orange skull.',
  detail: 0.005,
  reference: 'docs/monster-mockups/giant-spider_001.jpg',

  build(k) {
    // ------------------------------------------------------------------ head (upright), thorax, abdomen
    const headUp = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.21, 0.175, 0.17]).at(0, 0.37, 0.14),
      sdf.ellipsoid([0.15, 0.07, 0.11]).at(0, 0.255, 0.11), // the jaw under the face
    );
    const faceHit = (x: number, y: number) => sdf.raycast(headUp, [x, y, 2], [0, 0, -1])!;
    const topHit = (x: number, z: number) => sdf.raycast(headUp, [x, 2, z], [0, -1, 0])!;

    // The fang roots (upright head frame), and the fang bones at their posed positions.
    const cheliAt = faceHit(0.058, 0.26);
    const FANG_ROOT: V3 = [cheliAt[0], cheliAt[1] - 0.004, cheliAt[2] - 0.012];
    const fangPivot = headPoint(FANG_ROOT);

    const bones: Record<string, { parent?: string; at: V3; tail?: V3 }> = {
      body: { at: THORAX },
      head: { parent: 'body', at: HEAD_PIVOT, tail: [0, 0.36, 0.31] },
      abdomen: { parent: 'body', at: [0, 0.28, -0.04], tail: [0, 0.36, -0.44] },
      'fang.L': { parent: 'head', at: fangPivot, tail: add(fangPivot, [0, -0.1, 0.02]) },
      'fang.R': { parent: 'head', at: mxp(fangPivot), tail: add(mxp(fangPivot), [0, -0.1, 0.02]) },
    };
    LEG_ANGLES.forEach((a, i) => {
      bones[`leg${i}.L`] = { parent: 'body', at: legRoot(a), tail: legKnee(a) };
      bones[`shin${i}.L`] = { parent: `leg${i}.L`, at: legKnee(a), tail: legTip(a) };
      bones[`leg${i}.R`] = { parent: 'body', at: mxp(legRoot(a)), tail: mxp(legKnee(a)) };
      bones[`shin${i}.R`] = { parent: `leg${i}.R`, at: mxp(legKnee(a)), tail: mxp(legTip(a)) };
    });
    k.skeleton(bones);

    const thorax = sdf.ellipsoid([0.19, 0.16, 0.18]).at(0, 0.19, 0.085);
    const ABD: V3 = [0, 0.32, -0.25];
    const abdomenShape = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.225, 0.205, 0.24]).rotateX(-12).at(...ABD),
      sdf.sphere(0.075).at(0, 0.26, -0.05), // the waist
    );

    // The orange splat on the thorax front, as in the mockup: a round blob with five lobed arms.
    const splatPts: [number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const r = i % 2 === 0 ? 0.1 : 0.048;
      splatPts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    const splat = sdf
      .union(
        sdf.extrude(profile.polygon(splatPts, { smooth: true, samples: 6 }), 0.5),
        ...splatPts.filter((_, i) => i % 2 === 0).map(([x, y]) => sdf.extrude(profile.circle(0.026), 0.5).at(x * 0.92, y * 0.92, 0)),
      )
      .rotateX(-12)
      .at(0, 0.145, 0.24);

    // The orange skull on the abdomen's back (seen from behind and above).
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
    const axis: V3 = [0, 0.8, -0.6];
    const skullStencil = skullOutline
      .subtract(skullHoles)
      .rotateZ(180)
      .rotateX(-126.87)
      .at(...ABD)
      .intersect(sdf.halfSpace([0, -axis[1], -axis[2]], -(axis[1] * ABD[1] + axis[2] * ABD[2])));

    const carapace = sdf
      .smoothUnion(0.05, headPose(headUp).bone('head'), thorax.bone('body'))
      .smoothUnion(0.04, abdomenShape.bone('abdomen'))
      // Darker underneath.
      .paintFn((_x, y, _z, base) => {
        const t = Math.min(1, Math.max(0, (0.2 - y) / 0.14));
        return [base[0] * (1 - 0.35 * t), base[1] * (1 - 0.35 * t), base[2] * (1 - 0.35 * t)];
      })
      .paintWhere(splat, C.orange, 0.003)
      .paintWhere(skullStencil, C.orange, 0.003);
    k.body('carapace', carapace, {
      color: C.body,
      roughness: 0.8,
      textureDensity: 1.5,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 80, y * 80, z * 80, 2),
    });

    // ------------------------------------------------------------------ legs: chunky segments, orange bands, dark claws
    const legs = LEG_ANGLES.map((a, i) => {
      const root = legRoot(a);
      const knee = legKnee(a);
      const mid = legMid(a);
      const tip = legTip(a);
      const claw = lerp3(mid, tip, 0.62);
      const femur = sdf.smoothUnion(0.02, sdf.cone(root, knee, 0.052, 0.046), sdf.sphere(0.057).at(...knee)).bone(`leg${i}.L`);
      const shin = sdf
        .smoothUnion(
          0.012,
          sdf.cone(knee, mid, 0.046, 0.04),
          sdf.sphere(0.047).at(...mid),
          sdf.cone(mid, claw, 0.04, 0.032),
          sdf.cone(claw, tip, 0.03, 0.006),
        )
        .bone(`shin${i}.L`);
      return sdf.smoothUnion(0.014, femur, shin);
    });
    const bands = sdf.union(
      ...LEG_ANGLES.flatMap((a) => {
        const root = legRoot(a);
        const knee = legKnee(a);
        const mid = legMid(a);
        const tip = legTip(a);
        // Rings: the knee cap, a band on the femur, the mid joint, and a band on the lower leg.
        const ring = (p: V3, q: V3, t: number, half: number) => {
          const c = lerp3(p, q, t);
          const d = norm(sub(q, p));
          return sdf.halfSpace(d, dotv(d, c) + half).intersect(sdf.halfSpace(scl(d, -1), -dotv(d, c) + half)).intersect(sdf.sphere(0.09).at(...c));
        };
        return [
          sdf.sphere(0.059).at(...knee).intersect(sdf.sphere(0.2).at(...knee)),
          ring(root, knee, 0.5, 0.022),
          ring(knee, mid, 1.0, 0.024),
          ring(mid, tip, 0.4, 0.02),
        ];
      }),
    );
    const clawTips = sdf.union(...LEG_ANGLES.map((a) => sdf.sphere(0.09).at(...legTip(a)).intersect(sdf.halfSpace(norm(sub(legMid(a), legTip(a))), dotv(norm(sub(legMid(a), legTip(a))), lerp3(legMid(a), legTip(a), 0.64))))));
    k.body('legs', pair(sdf.union(...legs).paintWhere(bands, C.orange, 0.004).paintWhere(clawTips, C.claw, 0.006)), {
      color: C.body,
      roughness: 0.75,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ brows: a heavy, wrinkled shelf in an angry V
    const EYE_X = 0.09;
    const EYE_Y = 0.365;
    const browAt = (x: number, y: number, lift: number): V3 => {
      const h = faceHit(x, y);
      return [h[0], h[1], h[2] + lift];
    };
    const brows = pair(
      sdf.chain(
        [
          [...browAt(0.176, EYE_Y + 0.066, -0.026), 0.032],
          [...browAt(EYE_X + 0.05, EYE_Y + 0.094, -0.012), 0.038],
          [...browAt(EYE_X - 0.01, EYE_Y + 0.086, -0.006), 0.038],
          [...browAt(0.012, EYE_Y + 0.045, -0.01), 0.03],
        ],
        0.012,
      ),
    );
    k.body('brows', headPose(brows), {
      color: C.brow,
      roughness: 0.75,
      bone: 'head',
      // Wrinkles along the brow, like the clay folds in the mockup.
      bump: (x, y, z) => 0.0022 * Math.sin(y * 260 + Math.abs(x) * 60) + 0.0006 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ eyes: two huge glaring eyes, six small eyeballs on top
    const eyeHit = faceHit(EYE_X, EYE_Y);
    const EYE_R = 0.08;
    const eyeC: V3 = [eyeHit[0], eyeHit[1], eyeHit[2] - 0.03];
    const look = norm([-0.12, -0.08, 1]); // the irises look a little inward and down
    const cap = (c: V3, dir: V3, r: number, cr: number) => sdf.sphere(cr).at(...add(c, scl(dir, r)));
    const bigEye = sdf
      .sphere(EYE_R)
      .at(...eyeC)
      // A red iris about half the eye wide, as in the mockup, so a wide white ring shows around it.
      .paintWhere(cap(eyeC, look, EYE_R, 0.04), C.irisRim, 0.002)
      .paintWhere(cap(eyeC, look, EYE_R, 0.035), C.iris, 0.003)
      .paintWhere(cap(eyeC, look, EYE_R, 0.011), C.pupil, 0.003)
      .paintWhere(sdf.sphere(0.0085).at(eyeC[0] - 0.003, eyeC[1] + 0.0115, eyeC[2] + EYE_R - 0.003), C.eyeWhite, 0.0015)
      // An angry lid in body purple across the top of the eye, lower toward the middle.
      .paintWhere(
        sdf
          .halfSpace([0.45 / Math.hypot(0.45, 1), -1 / Math.hypot(0.45, 1), 0], (0.45 * eyeC[0] - (eyeC[1] + 0.036)) / Math.hypot(0.45, 1))
          .intersect(sdf.sphere(EYE_R + 0.01).at(...eyeC)),
        C.body,
        0.002,
      );
    k.body('eyes', headPose(pair(bigEye)), { color: C.eyeWhite, roughness: 0.1, textureDensity: 2, bone: 'head' });
    // Six small eyeballs on top of the head, as in the mockup: white with red irises.
    const smallEye = (x: number, z: number, r: number) => {
      const h = topHit(x, z);
      const c: V3 = [h[0], h[1] + r * 0.45, h[2]];
      const d = norm([x * 0.8, 0.35, 1]);
      return sdf
        .sphere(r)
        .at(...c)
        .paintWhere(cap(c, d, r, r * 0.8), C.iris, 0.002)
        .paintWhere(sdf.sphere(r * 0.24).at(c[0] + r * 0.2, c[1] + r * 0.72, c[2] + r * 0.62), C.eyeWhite, 0.001);
    };
    const smallEyes = pair(sdf.union(smallEye(0.048, 0.21, 0.034), smallEye(0.135, 0.17, 0.027), smallEye(0.062, 0.11, 0.03)));
    k.body('small-eyes', headPose(smallEyes), { color: C.eyeWhite, roughness: 0.12, textureDensity: 2, bone: 'head' });

    // ------------------------------------------------------------------ fangs: curved pale tusks on their own bones
    const fang = sdf.smoothUnion(
      0.01,
      sdf.sphere(0.03).at(FANG_ROOT[0], FANG_ROOT[1], FANG_ROOT[2] - 0.004).paint(C.bodyDark), // the chelicera bulb
      sdf.chain(
        [
          [FANG_ROOT[0], FANG_ROOT[1] - 0.01, FANG_ROOT[2] + 0.006, 0.024],
          [FANG_ROOT[0] + 0.006, FANG_ROOT[1] - 0.055, FANG_ROOT[2] + 0.024, 0.019],
          [FANG_ROOT[0] - 0.008, FANG_ROOT[1] - 0.1, FANG_ROOT[2] + 0.014, 0.005],
        ],
        0.006,
      ),
    );
    k.body('fangs', pair(headPose(fang).bone('fang.L')), { color: C.fang, roughness: 0.35, detail: 0.004 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys, reach } = motion;
    type P = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;
    // Lifting a leg that points along angle a (deg): rotate about the horizontal axis d x up.
    const lift = (a: number, side: 1 | -1, deg: number) => {
      const th = side > 0 ? a * rad : Math.PI - a * rad;
      return [-Math.sin(th) * deg, 0, Math.cos(th) * deg] as const;
    };
    const legPose = (i: number, side: 1 | -1, swing: number, up: number, fold: number): P => {
      const a = LEG_ANGLES[i]!;
      const l = lift(a, side, up);
      const f = lift(a, side, -fold);
      const name = side > 0 ? 'L' : 'R';
      return {
        [`leg${i}.${name}`]: { rotate: [l[0], -side * swing, l[2]] },
        [`shin${i}.${name}`]: { rotate: [f[0], 0, f[2]] },
      };
    };
    // A planted leg: solve femur and shin so the tip stays at `world` while the body bone moves.
    const ex = (deg: number, v: V3): V3 => {
      const c = Math.cos(deg * rad);
      const s = Math.sin(deg * rad);
      return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
    };
    const ez = (deg: number, v: V3): V3 => {
      const c = Math.cos(deg * rad);
      const s = Math.sin(deg * rad);
      return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
    };
    const plant = (i: number, side: 1 | -1, body: { move: V3; rx: number; rz?: number }, world?: V3): P => {
      const a = LEG_ANGLES[i]!;
      const f = (p: V3): V3 => (side > 0 ? p : mxp(p));
      const tip = world ?? f(legTip(a));
      // Into the body bone's rest frame: undo the move, then the X rotation about THORAX.
      const local = add(THORAX, ex(-body.rx, ez(-(body.rz ?? 0), sub(sub(tip, THORAX), body.move))));
      const knee = f(legKnee(a));
      const r = reach({ root: f(legRoot(a)), mid: knee, end: f(legTip(a)) }, local, add(knee, [0, 0.3, 0]));
      const name = side > 0 ? 'L' : 'R';
      return { [`leg${i}.${name}`]: { rotate: r.upper }, [`shin${i}.${name}`]: { rotate: r.lower } };
    };

    // An alternating four-leg gait: L0, R1, L2, R3 step together, then R0, L1, R2, L3.
    const gait = (duration: number, swing: number, up: number, bob: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const upA = up * Math.max(0, wave(p, 1, 0.25));
        const upB = up * Math.max(0, -wave(p, 1, 0.25));
        const pose: P = {
          body: { move: [0, -bob * bump(p, 2), 0], rotate: [0, 3 * s, 0] },
          abdomen: { rotate: [3 * wave(p, 2, 0.2), 4 * s, 0] },
          head: { rotate: [0, -3 * s, 0] },
          'fang.L': { rotate: [4 * wave(p, 2), 0, 3 * wave(p, 2)] },
          'fang.R': { rotate: [4 * wave(p, 2), 0, -3 * wave(p, 2)] },
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
        const pose: P = {
          body: { move: [0, -0.004 * bump(p, 2), 0] },
          abdomen: { scale: [1 + 0.025 * bump(p, 2), 1 + 0.025 * bump(p, 2), 1 + 0.025 * bump(p, 2)], rotate: [2 * wave(p, 1, 0.2), 0, 0] },
          head: { rotate: [0, 6 * wave(p, 1, 0.3), 0] },
          // The fangs work a little, as if it is tasting the air.
          'fang.L': { rotate: [0, 0, 6 * bump(p, 3, 0.2)] },
          'fang.R': { rotate: [0, 0, -6 * bump(p, 3, 0.2)] },
        };
        // The two front legs twitch and tap, one after the other.
        Object.assign(pose, legPose(0, 1, 0, 10 * bump(p, 3, 0.1), 0));
        Object.assign(pose, legPose(0, -1, 0, 10 * bump(p, 3, 0.45), 0));
        return pose;
      },
    });

    // The strike. Rear up (anticipation, 0.3 s): the body tips back on the planted back legs, the
    // front legs rise high and wide, and the fangs spread wide (hold, 0.1 s). Lunge (0.08 s): the
    // body pitches down 25 degrees and drives forward, the front legs slam down ahead to pin the
    // prey, and the fangs snap shut. Bite (0.15 s): it presses down with the fangs in. Then it
    // backs off, and the front feet step back to their rest spots.
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const rx = keys(p, [[0, 0], [0.3, -30], [0.4, -32], [0.48, 25], [0.55, 27], [0.63, 26], [1, 0]] as const);
        // The forward drive stops at 0.16 m: more and the back legs cannot reach their planted tips.
        const move: V3 = [
          0,
          keys(p, [[0, 0], [0.3, 0.06], [0.4, 0.065], [0.48, -0.01], [0.55, -0.013], [0.63, -0.01], [1, 0]] as const),
          keys(p, [[0, 0], [0.3, -0.05], [0.4, -0.05], [0.48, 0.16], [0.55, 0.155], [0.63, 0.15], [1, 0]] as const),
        ];
        const rear = keys(p, [[0, 0], [0.3, 1], [0.4, 1], [0.46, 0], [1, 0]] as const);
        const strike = keys(p, [[0.4, 0], [0.48, 1], [0.63, 1], [1, 0]] as const);
        const open = keys(p, [[0, 0], [0.3, 1.2], [0.42, 1.4], [0.48, -0.8], [0.55, -0.85], [0.63, -0.8], [0.8, 0], [1, 0]] as const);
        const body = { move, rx };
        const pose: P = {
          body: { move, rotate: [rx, 0, 0] },
          head: { rotate: [keys(p, [[0, 0], [0.3, -8], [0.4, -9], [0.48, 12], [0.55, 15], [0.63, 14], [1, 0]] as const), 0, 0] },
          abdomen: { rotate: [14 * rear - 12 * strike, 0, 0] },
          'fang.L': { rotate: [-20 * open, 0, 26 * open] },
          'fang.R': { rotate: [-20 * open, 0, -26 * open] },
        };
        // From the top of the rear-up, legs 0 and 1 blend into planted legs: the front feet slam
        // down ahead of their rest spots and hold the prey through the bite. In the recovery they
        // lift and step back, legs 1 a little after legs 0.
        const land = keys(p, [[0.4, 0], [0.47, 1]] as const);
        const blend = (a: P, b: P): P => {
          const r: P = {};
          for (const n of Object.keys(a)) {
            const ra = a[n]!.rotate ?? [0, 0, 0];
            const rb = b[n]!.rotate ?? [0, 0, 0];
            r[n] = { rotate: [ra[0] + (rb[0] - ra[0]) * land, ra[1] + (rb[1] - ra[1]) * land, ra[2] + (rb[2] - ra[2]) * land] };
          }
          return r;
        };
        const pinned = (i: number, side: 1 | -1, dz: number, back: number): V3 => {
          const t = legTip(LEG_ANGLES[i]!);
          const w = side > 0 ? t : mxp(t);
          const pin = keys(p, [[0.4, 0], [0.47, 1], [0.63 + back, 1], [0.9 + back, 0]] as const);
          const step = keys(p, [[0.63 + back, 0], [0.76 + back, 1], [0.9 + back, 0]] as const);
          return [w[0], w[1] + 0.05 * step, w[2] + dz * pin];
        };
        for (const side of [1, -1] as const) {
          // Front legs: raised high and spread wide, then slammed down in front.
          Object.assign(pose, blend(legPose(0, side, -24 * rear, 62 * rear, -30 * rear), plant(0, side, body, pinned(0, side, 0.14, 0))));
          // Second legs: lifted a little in the rear-up, then planted.
          Object.assign(pose, blend(legPose(1, side, -8 * rear, 26 * rear, 12 * rear), plant(1, side, body, pinned(1, side, 0.08, 0.06))));
          // Back legs: planted; they hold the weight.
          Object.assign(pose, plant(2, side, body));
          Object.assign(pose, plant(3, side, body));
        }
        return pose;
      },
    });

    // Hit: it jerks back and up, the legs flinch in, then it settles.
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.18, 1], [1, 0]] as const);
        const move: V3 = [0, 0.02 * h, -0.04 * h];
        const rx = -12 * h;
        const rz = 6 * h * wave(p, 2);
        const pose: P = {
          body: { move, rotate: [rx, 0, rz] },
          head: { rotate: [-10 * h, 0, 0] },
          abdomen: { rotate: [8 * h, 0, 0] },
          'fang.L': { rotate: [0, 0, 20 * h] },
          'fang.R': { rotate: [0, 0, -20 * h] },
        };
        for (const side of [1, -1] as const) {
          Object.assign(pose, legPose(0, side, 0, 30 * h, 30 * h));
          for (const i of [1, 2, 3]) Object.assign(pose, plant(i, side, { move, rx, rz }));
        }
        return pose;
      },
    });

    // Death: a last recoil, the legs curl in tight, then it rolls over onto its back and lies there
    // with the curled legs in the air, a final twitch, and stillness.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const recoil = keys(p, [[0, 0], [0.1, 1], [0.22, 0]] as const);
        const curl = keys(p, [[0.12, 0], [0.42, 1]] as const);
        const roll = keys(p, [[0.4, 0], [0.78, 1]] as const, 'smooth');
        const twitch = Math.max(0, Math.sin((p - 0.82) * Math.PI * 8)) * Math.max(0, Math.min(1, (p - 0.82) / 0.04)) * Math.max(0, (1 - p) / 0.18);
        const ang = 180 * roll;
        // At the end, pitch the body so the abdomen rests on the ground next to the small eyes. The X
        // rotation acts after the roll (world axes), so a negative pitch lowers the upturned abdomen.
        const settle = keys(p, [[0.62, 0], [0.84, 1]] as const);
        // The pivot height that keeps the curled body on the ground as it rolls: it drops onto its
        // belly as the legs curl, rolls over the curled knees on its side, and lies on its back on
        // the small eyes and the abdomen. The keys stay 1 to 2 cm low on purpose: the build's
        // ground pass raises every frame to exact contact, so the body never floats.
        const settleY = keys(roll, [[0, -0.045], [0.17, -0.045], [0.33, -0.005], [0.5, 0.055], [0.62, 0.07], [0.75, 0.06], [0.85, 0.068], [1, 0.078]] as const, 'linear');
        const y = -0.02 * recoil + curl * settleY;
        const pose: P = {
          body: { move: [0.02 * Math.sin(roll * Math.PI), y, -0.03 * recoil], rotate: [-10 * recoil - 3.5 * settle, 0, -ang] },
          head: { rotate: [-12 * recoil + 10 * curl, 0, 0] },
          abdomen: { rotate: [8 * curl, 0, 0] },
          'fang.L': { rotate: [0, 0, 18 * recoil - 8 * curl] },
          'fang.R': { rotate: [0, 0, -18 * recoil + 8 * curl] },
        };
        for (const side of [1, -1] as const)
          for (let i = 0; i < 4; i++) Object.assign(pose, legPose(i, side, 0, 10 * recoil + 22 * curl, 78 * curl + 18 * twitch * (i % 2 ? 1 : -1)));
        return pose;
      },
    });
  },
});

function dotv(a: V3, b: V3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
