import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Deer — Chibi Quest wildlife (catalog `wildlife/land/deer`), about 0.88 m to the top of the head
 * (1.0 m to the antler tips), faces +Z. Target: docs/wildlife-mockups/deer_001.jpg (made with
 * mmx; one three-quarter view). Base: the dire wolf (four-leg rig, trot machinery).
 *
 * Role: gentle ambient wildlife, seen in 3D and as a 128 px sprite; the big eyes must read.
 * One idea: a huge round head with big glossy eyes in cream eye patches, wide leaf ears, and
 *   small dark antlers, on a slim spotted body with long thin legs and small dark hooves.
 * Shape language: soft round masses (head, eyes, body) with thin verticals (legs, antlers).
 * Palette (60/30/10): warm fawn #c47a46; cream #f3e2b8 (eye patches, muzzle, belly) and a whiter
 *   bib #faf2e2 (chest, spots, tail); dark brown antlers #5c3b28 and hooves; black eyes and nose.
 * Value plan: the dark eyes and nose in the cream mask are the focal point; the dark antlers and
 *   hooves close the silhouette at the top and the bottom.
 * Bodies: fur, eyes, shine, nose, antlers, hooves, spots.
 * Rig: the wolf's quadruped (hips, spine, neck, head, jaw, tail, front and back legs with shins)
 *   plus ear bones. Clips: idle, walk, run (bouncy), graze (the head goes down, nibbles, comes
 *   up), alert (the head high, the ears turn, a front hoof stamps), hit, death.
 */

const C = {
  fur: '#bc703f',
  cream: '#f3e2b8',
  bib: '#faf2e2',
  earInner: '#e8a39c',
  antler: '#5c3b28',
  hoof: '#2e221c',
  nose: '#161212',
  mouth: '#6a3a26',
  eye: '#2a1a12',
  pupil: '#0a0706',
  spot: '#fbf6ea',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const DEG = 180 / Math.PI;
const rad = (d: number) => d / DEG;
const rotZ = (p: V3, d: number): V3 => [p[0] * Math.cos(rad(d)) - p[1] * Math.sin(rad(d)), p[0] * Math.sin(rad(d)) + p[1] * Math.cos(rad(d)), p[2]];
const rotY = (p: V3, d: number): V3 => [p[0] * Math.cos(rad(d)) + p[2] * Math.sin(rad(d)), p[1], -p[0] * Math.sin(rad(d)) + p[2] * Math.cos(rad(d))];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mx = (v: V3): V3 => [-v[0], v[1], v[2]];

// Joint positions (rest pose). Long thin legs under a slim body; the big head sits high.
const HIPS_AT: V3 = [0, 0.36, -0.17];
const SPINE_AT: V3 = [0, 0.37, 0.0];
const NECK_AT: V3 = [0, 0.45, 0.11];
const HEAD_AT: V3 = [0, 0.57, 0.15];
const JAW_AT: V3 = [0, 0.6, 0.22];
const TAIL_AT: V3 = [0, 0.43, -0.265];
const EAR_AT: V3 = [0.135, 0.79, 0.11];
const SHOULDER: V3 = [0.075, 0.34, 0.08];
const FKNEE: V3 = [0.075, 0.165, 0.085];
const HIP: V3 = [0.075, 0.35, -0.19];
const BKNEE: V3 = [0.075, 0.175, -0.213];
const HOOF_DZ = 0.003; // the hoof center sits a little in front of the shin line
const HEAD_C: V3 = [0, 0.705, 0.15];
const HEAD_R: V3 = [0.185, 0.17, 0.16];
const MUZZLE_C: V3 = [0, 0.615, 0.29];
const MUZZLE_R: V3 = [0.078, 0.06, 0.066];
// The ear: built along +Y at its base, then turned out and up (and a little back).
const EAR_TILT = -48;
const EAR_TURN = 15;
const earPt = (p: V3) => add(rotY(rotZ(p, EAR_TILT), EAR_TURN), EAR_AT);

export default defineAsset({
  name: 'deer',
  description: 'Chibi deer: a big round head with glossy eyes in cream patches, wide leaf ears, small dark antlers, a slim spotted fawn body, long thin legs, and a white tail; quadruped rig.',
  detail: 0.005,
  reference: 'docs/wildlife-mockups/deer_001.jpg',
  // Color slots for individual deer (the first option is the default look): real coat and eye
  // colors, all in the earthy family of the default.
  variants: {
    fur: { fawn: C.fur, red: '#a8532f', grey: '#8c7a66', pale: '#d6a877' },
    eyes: { dark: C.eye, brown: '#5a3418', hazel: '#6e5a2c' },
  },
  presets: {
    roe: { fur: 'red', eyes: 'brown' },
    winter: { fur: 'grey', eyes: 'dark' },
    pale: { fur: 'pale', eyes: 'hazel' },
  },

  build(k) {
    const T = {
      fur: k.tint('fur'),
      eye: k.tint('eyes'),
    };
    k.skeleton({
      hips: { at: HIPS_AT },
      spine: { parent: 'hips', at: SPINE_AT },
      neck: { parent: 'spine', at: NECK_AT },
      head: { parent: 'neck', at: HEAD_AT },
      jaw: { parent: 'head', at: JAW_AT, tail: [0, 0.575, 0.3] },
      'ear.L': { parent: 'head', at: EAR_AT, tail: earPt([0, 0.21, 0]) },
      'ear.R': { parent: 'head', at: mx(EAR_AT), tail: mx(earPt([0, 0.21, 0])) },
      tail: { parent: 'hips', at: TAIL_AT, tail: [0, 0.54, -0.315] },
      'fleg.L': { parent: 'spine', at: SHOULDER },
      'fshin.L': { parent: 'fleg.L', at: FKNEE },
      'fleg.R': { parent: 'spine', at: mx(SHOULDER) },
      'fshin.R': { parent: 'fleg.R', at: mx(FKNEE) },
      'bleg.L': { parent: 'hips', at: HIP },
      'bshin.L': { parent: 'bleg.L', at: BKNEE },
      'bleg.R': { parent: 'hips', at: mx(HIP) },
      'bshin.R': { parent: 'bleg.R', at: mx(BKNEE) },
    });

    // ------------------------------------------------------------------ body
    const CHEST_C: V3 = [0, 0.37, 0.03];
    const CHEST_R: V3 = [0.11, 0.12, 0.135];
    const RUMP_C: V3 = [0, 0.38, -0.17];
    const RUMP_R: V3 = [0.11, 0.125, 0.125];
    const chest = sdf.ellipsoid([...CHEST_R]).at(...CHEST_C);
    const rump = sdf.ellipsoid([...RUMP_R]).at(...RUMP_C);
    const neck = sdf.capsule([0, 0.41, 0.09], [0, 0.6, 0.15], 0.06);

    // ------------------------------------------------------------------ head
    const skull = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid([...HEAD_R]).at(...HEAD_C),
      pair(sdf.sphere(0.085).at(0.085, 0.64, 0.2)), // full cheeks
    );
    const muzzle = sdf.ellipsoid([...MUZZLE_R]).at(...MUZZLE_C);
    const headBase = sdf.smoothUnion(0.03, skull, muzzle);
    const chin = sdf.ellipsoid([0.05, 0.032, 0.05]).at(0, 0.575, 0.275);
    const faceHit = (x: number, y: number) => sdf.raycast(headBase, [x, y, 2], [0, 0, -1])!;

    // Big leaf ears, cupped toward the front, with pink insides.
    const earLocal = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.064, 0.11, 0.024]).at(0, 0.1, 0),
        sdf.cone([0, -0.02, 0], [0, 0.04, 0], 0.033, 0.038), // the stem into the head
      )
      .smoothSubtract(0.006, sdf.ellipsoid([0.047, 0.086, 0.022]).at(0, 0.107, 0.019))
      .paintWhere(sdf.ellipsoid([0.051, 0.091, 0.033]).at(0, 0.107, 0.013), C.earInner, 0.006);
    const ears = pair(earLocal.rotateZ(EAR_TILT).rotateY(EAR_TURN).at(...EAR_AT).bone('ear.L'));

    // ------------------------------------------------------------------ legs, tail
    const leg = (hip: V3, knee: V3, upper: string, lower: string, rTop: number) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(hip, knee, rTop, 0.031).bone(upper),
        sdf.cone(knee, [knee[0], 0.04, knee[2] + HOOF_DZ], 0.029, 0.022).bone(lower),
      );
    const thigh = sdf.ellipsoid([0.065, 0.11, 0.09]).at(0.07, 0.32, -0.18).bone('bleg.L'); // the haunch
    const legs = sdf.union(
      pair(leg(SHOULDER, FKNEE, 'fleg.L', 'fshin.L', 0.055)),
      pair(sdf.smoothUnion(0.03, thigh, leg(HIP, BKNEE, 'bleg.L', 'bshin.L', 0.055))),
    );
    const tailShape = sdf.chain(
      [
        [0, 0.43, -0.265, 0.032],
        [0, 0.49, -0.305, 0.038],
        [0, 0.54, -0.315, 0.026],
      ],
      0.02,
    );

    // ------------------------------------------------------------------ fur body
    const trunk = sdf
      .smoothUnion(0.06, chest.bone('spine'), rump.bone('hips'), neck.bone('neck'), headBase.bone('head'))
      .smoothUnion(0.015, chin.bone('jaw'));
    const EYE_X = 0.086;
    const EYE_Y = 0.7;
    const eL = faceHit(EYE_X, EYE_Y);
    // The cream mask: a patch around each eye and the lower face; a fawn stripe runs down the
    // bridge of the nose between the patches.
    const eyePatch = pair(sdf.ellipsoid([0.064, 0.078, 0.1]).at(eL[0] + 0.011, eL[1] - 0.013, eL[2]));
    const lowerFace = sdf.ellipsoid([0.135, 0.07, 0.15]).at(0, 0.592, 0.255);
    const bridge = sdf.extrude(
      profile.polygon(
        [
          [-0.038, 0.88],
          [0.038, 0.88],
          [0.026, 0.69],
          [0.017, 0.65],
          [-0.017, 0.65],
          [-0.026, 0.69],
        ],
        { smooth: true },
      ),
      0.6,
    ).at(0, 0, 0.3);
    const smile = sdf.extrude(profile.arc(0.032, 0.006, 222, 318), 0.3).at(0, 0.626, 0.3);
    // The white chest bib with a jagged edge (points that run back along the sides).
    const bib = sdf.union(
      sdf.ellipsoid([0.08, 0.115, 0.09]).at(0, 0.41, 0.155),
      pair(sdf.cone([0.05, 0.42, 0.13], [0.115, 0.35, 0.06], 0.03, 0.004)),
      pair(sdf.cone([0.05, 0.35, 0.14], [0.105, 0.28, 0.07], 0.026, 0.004)),
      pair(sdf.cone([0.05, 0.48, 0.14], [0.09, 0.44, 0.07], 0.022, 0.004)),
    );
    const belly = sdf.ellipsoid([0.08, 0.05, 0.2]).at(0, 0.25, -0.06);
    const tailWhite = sdf.sphere(0.075).at(0, 0.51, -0.325).intersect(sdf.halfSpace([0, 0.41, 0.91], -0.072));
    const fur = trunk
      .smoothUnion(0.03, legs)
      .smoothUnion(0.02, tailShape.bone('tail'))
      .smoothUnion(0.012, ears)
      .paintWhere(belly, C.cream, 0.03)
      .paintWhere(bib, C.bib, 0.01)
      .paintWhere(sdf.union(eyePatch, lowerFace), C.cream, 0.008)
      .paintWhere(bridge, T.fur, 0.01)
      .paintWhere(smile, C.mouth, 0.002)
      .paintWhere(tailWhite, C.bib, 0.01);
    k.body('fur', fur, {
      color: T.fur,
      roughness: 0.85,
      textureDensity: 1.5,
      bump: (x: number, y: number, z: number) => 0.0006 * noise.fbm(x * 60, y * 25, z * 60, 2),
    });

    // ------------------------------------------------------------------ eyes, nose
    // Big glossy eyes: a dark iris (the eye slot) with a black pupil, and two white shines.
    const eyeLocal = sdf
      .ellipsoid([0.039, 0.049, 0.027])
      .paintWhere(sdf.sphere(0.029).at(0, 0, 0.027), C.pupil, 0.004);
    const EYE_IN = 0.01;
    const eyeAt = (s: sdf.Shape) => s.rotateY(14).at(eL[0], eL[1], eL[2] - EYE_IN);
    k.body('eyes', pair(eyeAt(eyeLocal)).bone('head'), { color: T.eye, roughness: 0.1, detail: 0.003, textureDensity: 2 });
    const shine = pair(
      sdf.union(sdf.sphere(0.011).at(0.012, 0.017, 0.022), sdf.sphere(0.0055).at(-0.013, -0.018, 0.022)).rotateY(14).at(eL[0], eL[1], eL[2] - EYE_IN),
    );
    k.body('shine', shine.bone('head'), { color: '#ffffff', roughness: 0.2, detail: 0.002 });
    const noseAt = faceHit(0, 0.635);
    k.body('nose', sdf.ellipsoid([0.035, 0.026, 0.024]).at(noseAt[0], noseAt[1], noseAt[2] - 0.004).bone('head'), {
      color: C.nose,
      roughness: 0.2,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ antlers
    // Small antlers: a beam that rises and leans out, and two round-tipped tines that point up
    // and in.
    const antler = sdf.smoothUnion(
      0.008,
      sdf.chain(
        [
          [0.048, 0.84, 0.13, 0.024],
          [0.072, 0.92, 0.12, 0.021],
          [0.1, 0.99, 0.11, 0.019],
        ],
        0.01,
      ),
      sdf.cone([0.062, 0.89, 0.125], [0.032, 0.95, 0.13], 0.017, 0.016),
      sdf.cone([0.087, 0.95, 0.115], [0.068, 1.005, 0.115], 0.016, 0.015),
    );
    k.body('antlers', pair(antler), { color: C.antler, roughness: 0.7, bone: 'head', detail: 0.004 });

    // ------------------------------------------------------------------ hooves, spots
    const hoofLocal = sdf
      .cone([0, 0.012, 0.004], [0, 0.05, -0.002], 0.03, 0.024)
      .subtract(sdf.box([0.004, 0.06, 0.03], 0.001).at(0, 0.02, 0.03)) // the cleft at the front
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const hoof = (kn: V3, bone: string) => hoofLocal.at(kn[0], 0, kn[2] + HOOF_DZ).bone(bone);
    k.body('hooves', sdf.union(pair(hoof(FKNEE, 'fshin.L')), pair(hoof(BKNEE, 'bshin.L'))), {
      color: C.hoof,
      roughness: 0.45,
      detail: 0.004,
    });
    // White spots in two rows along each side of the back.
    const back = sdf.smoothUnion(0.06, chest, rump);
    const spotAt = (x: number, z: number) => {
      const h = sdf.raycast(back, [x, 2, z], [0, -1, 0])!;
      return sdf.sphere(0.016).scale([1, 0.7, 1]).at(h[0], h[1] - 0.003, h[2]).bone(z > -0.07 ? 'spine' : 'hips');
    };
    const spots = pair(
      sdf.union(
        ...[0.06, -0.03, -0.12, -0.21].map((z) => spotAt(0.042, z)),
        ...[0.015, -0.075, -0.165].map((z) => spotAt(0.078, z)),
      ),
    );
    k.body('spots', spots, { color: C.spot, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys } = motion;
    type Rot = readonly [number, number, number];
    type Pose = Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }>;
    type Track = readonly (readonly [number, number])[];
    type Chain = { bones: readonly string[]; joints: readonly V3[]; sole: readonly V3[] };

    // Ground contact: the flat bottom of each hoof (rigid on its shin). motion.plant sets the hips
    // height from these chains, so the lowest point of the hooves rests on the ground.
    const hoofSole = (kn: V3): V3[] => {
      const c: V3 = [kn[0], 0, kn[2] + HOOF_DZ];
      const pts: V3[] = [c];
      for (let a = 0; a < 360; a += 30) {
        pts.push([c[0] + 0.027 * Math.cos(rad(a)), 0, c[2] + 0.027 * Math.sin(rad(a))]);
        pts.push([c[0] + 0.03 * Math.cos(rad(a)), 0.012, c[2] + 0.03 * Math.sin(rad(a))]);
      }
      return pts;
    };
    const LEGS: Chain[] = [
      { bones: ['hips', 'spine', 'fleg.L', 'fshin.L'], joints: [HIPS_AT, SPINE_AT, SHOULDER, FKNEE], sole: hoofSole(FKNEE) },
      { bones: ['hips', 'spine', 'fleg.R', 'fshin.R'], joints: [HIPS_AT, SPINE_AT, mx(SHOULDER), mx(FKNEE)], sole: hoofSole(mx(FKNEE)) },
      { bones: ['hips', 'bleg.L', 'bshin.L'], joints: [HIPS_AT, HIP, BKNEE], sole: hoofSole(BKNEE) },
      { bones: ['hips', 'bleg.R', 'bshin.R'], joints: [HIPS_AT, mx(HIP), mx(BKNEE)], sole: hoofSole(mx(BKNEE)) },
    ];
    const chains = (pose: Pose, list: readonly Chain[] = LEGS) =>
      list.map((l) => ({ joints: l.joints, rotations: l.bones.map((b) => pose[b]?.rotate ?? ([0, 0, 0] as const)), sole: l.sole }));
    const needY = (pose: Pose, list: readonly Chain[] = LEGS) => motion.plant(chains(pose, list));
    // A planted hoof that floats tips its toes down until its rim touches the ground (push-off).
    const planted = (pose: Pose, settle: readonly (readonly [leg: number, weight: number])[] = []) => {
      const y = needY(pose);
      for (const [i, weight] of settle) {
        const l = LEGS[i]!;
        const shin = l.bones[l.bones.length - 1]!;
        const r = pose[shin]?.rotate ?? ([0, 0, 0] as const);
        const floats = (w: number) => {
          pose[shin] = { rotate: [r[0] + w, r[1], r[2]] };
          return y - needY(pose, [l]) > 0.001;
        };
        let lo = 0;
        if (floats(0)) {
          let hi = 30;
          for (let n = 0; n < 12; n++) {
            const mid = (lo + hi) / 2;
            if (floats(mid)) lo = mid;
            else hi = mid;
          }
        }
        pose[shin] = { rotate: [r[0] + lo * weight, r[1], r[2]] };
      }
      return y;
    };

    // Trot: diagonal pairs move together (front-left with back-right). While a leg swings
    // forward, the upper leg lifts the knee (`fold`) and the shin folds (`toe`): the front shin
    // folds back under the knee (a prancing deer step, negative toe), the hind hoof tips up. The
    // bias sets each knee straight under its shoulder or hip. `hop` adds a bounce between steps.
    const FBIAS = Math.atan2(FKNEE[2] - SHOULDER[2], SHOULDER[1] - FKNEE[1]) * DEG;
    const HBIAS = Math.atan2(BKNEE[2] - HIP[2], HIP[1] - BKNEE[1]) * DEG;
    type Swing = readonly [fold: number, toe: number];
    const gait = (duration: number, swing: number, front: Swing, hind: Swing, hop: number, headDip: number, tailUp: number, earsBack: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const a = wave(p);
        const pitch = 2 * wave(p, 2);
        const leg = (s: 1 | -1, isFront: boolean) => {
          const lift = Math.max(0, s * wave(p, 1, 0.25)); // 0 while planted, 1 at mid-swing
          const [fold, toe] = isFront ? front : hind;
          const upper = (isFront ? FBIAS : HBIAS) - s * swing * a - fold * lift;
          const lower = -upper - (isFront ? pitch : 0) - toe * lift;
          return { upper: { rotate: [upper, 0, 0] as Rot }, lower: { rotate: [lower, 0, 0] as Rot }, lift };
        };
        const legs = [leg(1, true), leg(-1, true), leg(-1, false), leg(1, false)]; // LEGS order
        const bob = 5 * wave(p, 2, 0.1);
        const pose: Pose = {
          hips: { rotate: [0, 0, 2.5 * a] },
          spine: { rotate: [pitch, 0, -2.5 * a] },
          neck: { rotate: [headDip - 2 * wave(p, 2, 0.2), 0, 0] },
          head: { rotate: [-3 * wave(p, 2, 0.25), 3 * a, 0] },
          'ear.L': { rotate: [0, earsBack, bob] },
          'ear.R': { rotate: [0, -earsBack, -bob] },
          tail: { rotate: [tailUp + 8 * wave(p, 2, 0.1), 12 * wave(p, 1, 0.2), 0] },
        };
        legs.forEach((l, i) => {
          pose[LEGS[i]!.bones.at(-2)!] = l.upper;
          pose[LEGS[i]!.bones.at(-1)!] = l.lower;
        });
        const settle = legs.map((l, i) => [i, Math.max(0, 1 - l.lift / 0.4)] as const).filter(([, w]) => w > 0);
        pose.hips = { ...pose.hips, move: [0, planted(pose, settle) + hop * bump(p, 2) ** 2, 0] };
        return pose;
      },
    });
    k.animation('walk', gait(0.72, 18, [28, -36], [30, 18], 0.006, 0, 0, 0));
    k.animation('run', gait(0.4, 28, [44, -60], [48, 24], 0.035, 8, 22, 22));
    k.animation('idle', {
      duration: 3.0,
      pose: (_t, p) => {
        const flickL = keys(p, [[0.3, 0], [0.33, 1], [0.38, 0], [0.41, 0.7], [0.45, 0]] as const);
        const flickR = keys(p, [[0.72, 0], [0.75, 1], [0.8, 0]] as const);
        return {
          spine: { move: [0, 0.003 * bump(p, 2), 0] },
          neck: { rotate: [2 * bump(p), 6 * wave(p, 1, 0.2), 0] },
          head: { rotate: [-3 * wave(p, 2, 0.1), 0, 4 * wave(p)] },
          'ear.L': { rotate: [0, 8 * wave(p, 1, 0.1), 16 * flickL] },
          'ear.R': { rotate: [0, -8 * wave(p, 1, 0.6), -16 * flickR] },
          tail: { rotate: [4 * wave(p, 1, 0.3), 16 * wave(p, 4), 0] },
        };
      },
    });

    // Graze: the front legs bow (the knees go forward, the shins fold back), the chest dips, the
    // neck bends far down and the head turns nose-down to the grass, nibbles with small nods and
    // jaw bites, and comes back up. The legs are keyed as world angles (the local turns cancel the
    // parent turns). The body pitch is solved so the front and the hind hooves both touch, and the
    // hips slide so the front hooves stay in place.
    const GRAZE: Record<string, Track> = {
      fu: [[0, 0], [0.2, -30], [0.8, -30], [0.97, 0], [1, 0]],
      fs: [[0, 0], [0.2, 30], [0.8, 30], [0.97, 0], [1, 0]],
      s: [[0, 0], [0.2, 8], [0.8, 8], [0.97, 0], [1, 0]],
      neck: [[0, 0], [0.24, 66], [0.78, 66], [0.95, 0], [1, 0]],
      head: [[0, 0], [0.24, 76], [0.78, 76], [0.95, 0], [1, 0]], // world pitch, + = nose down
      nib: [[0.27, 0], [0.31, 1], [0.72, 1], [0.76, 0]],
      calm: [[0, 0], [0.2, 1], [0.8, 1], [1, 0]],
    };
    const FRONT = LEGS.slice(0, 2);
    const HIND = LEGS.slice(2);
    const FHOOF: V3 = [FKNEE[0], 0, FKNEE[2] + HOOF_DZ];
    k.animation('graze', {
      duration: 3.2,
      loop: false,
      pose: (_t, p) => {
        const v = (name: string) => keys(p, GRAZE[name]!);
        const [fu, fs, s, neck, nib, calm] = [v('fu'), v('fs'), v('s'), v('neck'), v('nib'), v('calm')];
        const make = (h: number): Pose => {
          const pose: Pose = {
            hips: { rotate: [h, 0, 0] },
            spine: { rotate: [s, 0, 0] },
            neck: { rotate: [neck, 0, 0] },
            head: { rotate: [v('head') - h - s - neck + 5 * nib * wave(p, 8), 0, 0] },
            jaw: { rotate: [12 * nib * bump(p, 16), 0, 0] },
            'ear.L': { rotate: [0, -10 * calm, -12 * calm + 10 * nib * bump(p, 3, 0.2)] },
            'ear.R': { rotate: [0, 10 * calm, 12 * calm] },
            tail: { rotate: [-h + 10 * calm, 14 * wave(p, 5), 0] },
          };
          for (const side of ['L', 'R']) {
            pose[`fleg.${side}`] = { rotate: [fu - h - s, 0, 0] };
            pose[`fshin.${side}`] = { rotate: [fs - fu, 0, 0] };
            pose[`bleg.${side}`] = { rotate: [-h, 0, 0] };
          }
          return pose;
        };
        let lo = -30;
        let hi = 30;
        for (let n = 0; n < 14; n++) {
          const mid = (lo + hi) / 2;
          if (needY(make(mid), FRONT) > needY(make(mid), HIND)) hi = mid;
          else lo = mid;
        }
        const pose = make((lo + hi) / 2);
        const rots = LEGS[0]!.bones.map((b) => pose[b]?.rotate ?? ([0, 0, 0] as const));
        const hoofZ = motion.follow(LEGS[0]!.joints, rots, FHOOF)[2];
        pose.hips = { ...pose.hips, move: [0, needY(pose), FHOOF[2] - hoofZ] };
        return pose;
      },
    });

    // Alert: the head comes up high, the ears turn (forward, back to listen, forward again, one
    // after the other), the white tail flags up, and the left front hoof stamps twice.
    k.animation('alert', {
      duration: 2.4,
      loop: false,
      pose: (_t, p) => {
        const up = keys(p, [[0, 0], [0.1, 1], [0.82, 1], [0.96, 0], [1, 0]] as const);
        const look = keys(p, [[0.14, 0], [0.24, 1], [0.4, 1], [0.5, -1], [0.66, -1], [0.76, 0]] as const);
        const earL = keys(p, [[0, 0], [0.1, -1], [0.3, -1], [0.38, 1], [0.55, 1], [0.62, -1], [0.85, -1], [1, 0]] as const); // -1 forward, +1 back
        const earR = keys(p, [[0, 0], [0.1, -1], [0.45, -1], [0.52, 1], [0.7, 1], [0.78, -1], [0.9, -1], [1, 0]] as const);
        const stamp = keys(p, [[0.3, 0], [0.38, 1], [0.42, 1], [0.45, 0], [0.52, 0], [0.57, 0.7], [0.6, 0.7], [0.63, 0]] as const);
        return {
          neck: { rotate: [-24 * up, 5 * look, 0] },
          head: { rotate: [14 * up, 14 * look, 0] },
          'ear.L': { rotate: [0, 32 * earL, 8 * up] },
          'ear.R': { rotate: [0, -32 * earR, -8 * up] },
          tail: { rotate: [30 * up, 4 * wave(p, 6), 0] },
          'fleg.L': { rotate: [-30 * stamp, 0, 0] },
          'fshin.L': { rotate: [75 * stamp, 0, 0] },
        };
      },
    });

    // Hit, struck from the front: the head jerks up and back, the ears pin back, the body flinches
    // back and a little to its right, and the tail flags up; then a quick return. Each upper leg
    // leans by the angle that cancels the body's shift and each shin turns back by the same angle,
    // so the hooves stay flat and planted; the hips sink by the height the upper legs lose.
    const UPPER = 0.175; // shoulder or hip joint to knee
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.34, 0.85], [1, 0]] as const);
        const flag = keys(p, [[0, 0], [0.14, 1], [0.55, 0.75], [1, 0]] as const);
        const back = 0.03 * h;
        const side = 0.01 * h;
        const a = Math.asin(back / UPPER) * DEG;
        const c = Math.asin(side / UPPER) * DEG;
        const sink = UPPER - Math.sqrt(UPPER * UPPER - back * back - side * side);
        const upper = { rotate: [-a, 0, c] as const };
        const lower = { rotate: [a, 0, -c] as const };
        return {
          hips: { move: [-side, 0.004 * h - sink, -back] },
          neck: { rotate: [-14 * h, -4 * h, 0] },
          head: { rotate: [-22 * h, -5 * h, 8 * h] },
          'ear.L': { rotate: [0, 40 * h, -15 * h] },
          'ear.R': { rotate: [0, -40 * h, 15 * h] },
          tail: { rotate: [30 * flag, 10 * flag, 0] },
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

    // Death: a recoil and a stagger, then the front legs buckle (the shins fold back under), the
    // hind legs bend, and the deer rolls onto its right side and lies still, the legs out and the
    // ears laid back. The hips height comes from ground probes: points on every part (the body,
    // the head, the antlers, the ears, the tail, the knees, the hooves) carried by their bones.
    // motion.plant then rests the lowest of them on the ground in every frame.
    const shell = (c: V3, r: V3, step = 36): V3[] => {
      const pts: V3[] = [
        [c[0], c[1] - r[1], c[2]],
        [c[0], c[1] + r[1], c[2]],
      ];
      for (let th = 18; th < 180; th += step)
        for (let ph = 0; ph < 360; ph += step)
          pts.push([
            c[0] + r[0] * Math.sin(rad(th)) * Math.cos(rad(ph)),
            c[1] + r[1] * Math.cos(rad(th)),
            c[2] + r[2] * Math.sin(rad(th)) * Math.sin(rad(ph)),
          ]);
      return pts;
    };
    const HEAD_CHAIN = { bones: ['hips', 'spine', 'neck', 'head'], joints: [HIPS_AT, SPINE_AT, NECK_AT, HEAD_AT] };
    const earPts = [[0, 0.21, 0], [0.064, 0.1, 0], [-0.064, 0.1, 0], [0.045, 0.165, 0], [-0.045, 0.165, 0]].map((q) => earPt(q as unknown as V3));
    const kneeRing = (kn: V3): V3[] => [add(kn, [0.03, 0, 0]), add(kn, [-0.03, 0, 0]), add(kn, [0, 0, 0.03]), add(kn, [0, 0, -0.03])];
    const PROBES: Chain[] = [
      { bones: ['hips'], joints: [HIPS_AT], sole: [...shell(RUMP_C, RUMP_R), ...shell([0.07, 0.32, -0.18], [0.065, 0.11, 0.09]), ...shell([-0.07, 0.32, -0.18], [0.065, 0.11, 0.09])] },
      { bones: ['hips', 'spine'], joints: [HIPS_AT, SPINE_AT], sole: shell(CHEST_C, CHEST_R) },
      { bones: ['hips', 'spine', 'neck'], joints: [HIPS_AT, SPINE_AT, NECK_AT], sole: shell([0, 0.51, 0.12], [0.06, 0.1, 0.06]) },
      {
        ...HEAD_CHAIN,
        sole: [
          ...shell(HEAD_C, [HEAD_R[0] + 0.01, HEAD_R[1], HEAD_R[2]], 30),
          ...shell(MUZZLE_C, MUZZLE_R),
          [0, 0.635, 0.375],
          [0.1, 1.008, 0.11], [-0.1, 1.008, 0.11], [0.032, 0.966, 0.13], [-0.032, 0.966, 0.13], [0.068, 1.02, 0.115], [-0.068, 1.02, 0.115],
        ],
      },
      { bones: [...HEAD_CHAIN.bones, 'ear.L'], joints: [...HEAD_CHAIN.joints, EAR_AT], sole: earPts },
      { bones: [...HEAD_CHAIN.bones, 'ear.R'], joints: [...HEAD_CHAIN.joints, mx(EAR_AT)], sole: earPts.map(mx) },
      { bones: ['hips', 'tail'], joints: [HIPS_AT, TAIL_AT], sole: [[0, 0.566, -0.32], [0, 0.51, -0.345]] },
      ...LEGS.map((l) => ({ ...l, sole: [...l.sole, ...kneeRing(l.joints.at(-1)!)] })),
    ];
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const recoil = keys(p, [[0, 0], [0.06, 1], [0.16, 0.3], [0.26, 0]] as const);
        const sway = keys(p, [[0.05, 0], [0.14, 1], [0.24, -0.5], [0.34, 0]] as const);
        const fold = keys(p, [[0.2, 0], [0.36, 1]] as const); // the front legs buckle
        const crouch = keys(p, [[0.24, 0], [0.4, 1]] as const);
        const drop = keys(p, [[0.24, 0], [0.4, 1], [0.7, 0]] as const);
        const roll = keys(p, [[0.38, 0], [0.7, 1]] as const); // over onto the right side
        const out = keys(p, [[0.5, 0], [0.76, 1]] as const); // the legs stretch out
        const bounce = keys(p, [[0.68, 0], [0.74, 1], [0.82, 0]] as const);
        const twitch = Math.max(0, Math.sin((p - 0.84) * Math.PI * 12)) * Math.max(0, Math.min(1, (p - 0.84) / 0.03, (1 - p) / 0.06));
        const legZ = -5 * sway;
        const front = (f: number, o: number, z: number, tw: number) => ({
          upper: [-12 * f - 30 * o - tw, 0, legZ + z] as const,
          lower: [100 * f * (1 - o) + 20 * o, 0, 0] as const,
        });
        const hind = (c: number, o: number, z: number, tw: number) => ({
          upper: [-40 * c * (1 - o) + 26 * o + tw, 0, legZ + z] as const,
          lower: [90 * c * (1 - o) + 8 * o - 10 * drop, 0, 0] as const,
        });
        const fL = front(fold, out, 14 * out, 6 * twitch);
        const fR = front(fold, out, 4 * out, 0);
        const bL = hind(crouch, out, 14 * out, 5 * twitch);
        const bR = hind(crouch, out, 4 * out, 0);
        const pose: Pose = {
          hips: { rotate: [10 * drop, 0, 5 * sway + 90 * roll] },
          spine: { rotate: [0, -6 * sway, 0] },
          neck: { rotate: [-16 * recoil + 14 * drop + 10 * roll, 0, -14 * roll] },
          head: { rotate: [-22 * recoil + 8 * drop + 6 * roll, 0, -3 * roll] },
          'ear.L': { rotate: [0, 50 * roll + 40 * recoil, -20 * roll] },
          'ear.R': { rotate: [0, -70 * roll - 40 * recoil, -30 * roll] },
          tail: { rotate: [30 * recoil - 40 * roll, 20 * sway, 0] },
          'fleg.L': { rotate: fL.upper },
          'fshin.L': { rotate: fL.lower },
          'fleg.R': { rotate: fR.upper },
          'fshin.R': { rotate: fR.lower },
          'bleg.L': { rotate: bL.upper },
          'bshin.L': { rotate: bL.lower },
          'bleg.R': { rotate: bR.upper },
          'bshin.R': { rotate: bR.lower },
        };
        const y = needY(pose, PROBES) + 0.012 * bounce;
        pose.hips = { ...pose.hips, move: [-0.02 * sway - 0.06 * roll, y, -0.03 * recoil] };
        return pose;
      },
    });
  },
});
