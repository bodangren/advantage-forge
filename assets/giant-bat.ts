import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Giant bat — Chibi Quest dungeon monster, a flyer: a fur ball about 0.44 m across with ears to
 * 0.72 m and a 1.0 m wingspan, faces +Z. Target: docs/monster-mockups/giant-bat_001.jpg (made
 * with mmx; one front view).
 *
 * Role: a fast cave pest that swoops in groups, seen in 3D and as a 128 px sprite; the ears, the
 *   yellow eyes, the pink nose, the fangs, and the wings must read.
 * One idea: a round, shaggy purple fur ball with huge pointed ears, glaring yellow eyes under
 *   heavy brows, a pink pig snout over two long fangs, and pink-membraned wings spread wide.
 * Proportions: the ball center 0.3 (radius 0.22), eyes 0.35, ear tips 0.72, wing tips out to
 *   x 0.49; tiny feet touch the ground in the rest pose; the clips lift it into a hover.
 * Shape language: one big round mass (friendly) with sharp accents (fur spikes, ear tips, fangs,
 *   wing claws, scalloped membranes) for menace.
 * Palette (60/30/10): purple fur #5c4670 (lighter tips, darker below); dark purple wing bones and ear rims
 *   #43324f; pink membranes, ear insides, snout, and feet #e08a8e; yellow eyes #f2c21c as the accent.
 * Value plan: the yellow eyes under the dark brows and the white fangs are the strongest contrast
 *   (focal point); the pink snout and ear insides are the second.
 * Bodies: fur, ears, eyes, brows, snout, mouth, teeth, wing-membranes, wing-bones, feet, claws.
 * Rig: body (root), ear.L/R, wing.L/R with wingtip.L/R at the knuckle, foot.L/R. Clips: idle
 *   (hover), fly (forward flight), attack (a swooping bite).
 */

const C = {
  fur: '#5c4670',
  furDark: '#382a44',
  furTip: '#7d6594',
  earRim: '#43324f',
  earInner: '#e8989e',
  eye: '#f2c21c',
  eyeRim: '#1c1418',
  pupil: '#120c10',
  brow: '#2a2032',
  snout: '#e8a0a0',
  nostril: '#5a2a30',
  mouth: '#2a1418',
  tooth: '#f6f0e2',
  membrane: '#e08a8e',
  membraneDark: '#b86a72',
  wingBone: '#43324f',
  feet: '#e0949a',
  claw: '#221a22',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

const BODY_C: V3 = [0, 0.3, 0];
const R = 0.22;
const WING_ROOT: V3 = [0.19, 0.34, -0.03];
const EAR_ROOT: V3 = [0.115, 0.47, -0.01];
const FOOT: V3 = [0.075, 0.05, 0.0];

// Fur tufts: directions spread evenly over the ball (a Fibonacci lattice), each with its own length.
// The lattice is jittered, so the tufts do not form a regular pattern.
const N_TUFTS = 240;
const TUFTS = Array.from({ length: N_TUFTS }, (_, i) => {
  const y = Math.max(-1, Math.min(1, 1 - (2 * (i + 0.5)) / N_TUFTS + (noise.random(i, 1, 4) - 0.5) * 0.02));
  const r = Math.sqrt(1 - y * y);
  const a = i * Math.PI * (3 - Math.sqrt(5)) + (noise.random(i, 2, 5) - 0.5) * 0.35;
  return { d: [Math.cos(a) * r, y, Math.sin(a) * r] as V3, len: 0.55 + 0.45 * noise.random(i, 3, 9) };
});
const TUFT_ANGLE = 0.21; // radians: the half width of one tuft

/** The fur spike height in [0, 1] at a point, from the tuft whose direction is nearest. */
const spikes = (x: number, y: number, z: number) => {
  const px = x - BODY_C[0];
  const pz = z - BODY_C[2];
  // Combed down: further out from the ball, the tuft is looked up higher, so each tip droops.
  const out = Math.max(0, Math.hypot(px, y - BODY_C[1], pz) - R);
  const py = y - BODY_C[1] + out * 1.4;
  const l = Math.hypot(px, py, pz) || 1;
  let best = -1;
  let len = 1;
  for (const t of TUFTS) {
    const d = (px * t.d[0] + py * t.d[1] + pz * t.d[2]) / l;
    if (d > best) {
      best = d;
      len = t.len;
    }
  }
  const k = Math.max(0, 1 - Math.acos(Math.min(1, best)) / TUFT_ANGLE);
  // The face is calmer, so the eyes, the snout, and the grin read.
  const face = Math.max(0, (pz / l - 0.55) / 0.45) * Math.max(0, 1 - Math.abs(py / l - 0.1) / 0.6);
  return k * k * k * len * (1 - 0.8 * face);
};

export default defineAsset({
  name: 'giant-bat',
  description: 'Chibi giant bat dungeon monster: a shaggy purple fur ball with huge pointed ears, glaring yellow eyes, a pink pig snout, two long fangs, and pink-membraned wings.',
  detail: 0.005,
  reference: 'docs/monster-mockups/giant-bat_001.jpg',

  build(k) {
    const KNUCKLE: V3 = [0.12, 0.2, 0];
    k.skeleton({
      body: { at: BODY_C },
      'ear.L': { parent: 'body', at: EAR_ROOT, tail: [0.22, 0.72, -0.02] },
      'ear.R': { parent: 'body', at: mx(EAR_ROOT), tail: [-0.22, 0.72, -0.02] },
      'wing.L': { parent: 'body', at: WING_ROOT },
      'wingtip.L': { parent: 'wing.L', at: [WING_ROOT[0] + KNUCKLE[0], WING_ROOT[1] + KNUCKLE[1], WING_ROOT[2]], tail: [WING_ROOT[0] + 0.3, WING_ROOT[1] + 0.1, WING_ROOT[2]] },
      'wing.R': { parent: 'body', at: mx(WING_ROOT) },
      'wingtip.R': { parent: 'wing.R', at: [-WING_ROOT[0] - KNUCKLE[0], WING_ROOT[1] + KNUCKLE[1], WING_ROOT[2]], tail: [-WING_ROOT[0] - 0.3, WING_ROOT[1] + 0.1, WING_ROOT[2]] },
      'foot.L': { parent: 'body', at: [FOOT[0], 0.13, FOOT[2]] },
      'foot.R': { parent: 'body', at: [-FOOT[0], 0.13, FOOT[2]] },
    });

    // ------------------------------------------------------------------ the fur ball
    const ballSmooth = sdf.sphere(R).scale([1.02, 1, 0.96]).at(...BODY_C);
    const faceHit = (x: number, y: number) => sdf.raycast(ballSmooth, [x, y, 1], [0, 0, -1])!;
    // The spikes are steep (a slope of about 1.5 on top of the comb), so the field is divided back
    // to true distances; see displace().
    const ball = ballSmooth.displace(0.05, (x, y, z) => -spikes(x, y, z), 2.5);
    const tip = rgb(C.furTip);
    const fur = ball
      .paintFn((x, y, z, base) => {
        // Lighter tips on the spikes, a darker underside.
        const s = spikes(x, y, z);
        const t = Math.min(1, s * 1.4);
        const under = Math.max(0, Math.min(1, (0.24 - y) / 0.16));
        const r = base[0] + (tip[0] - base[0]) * t * 0.6;
        const g = base[1] + (tip[1] - base[1]) * t * 0.6;
        const b = base[2] + (tip[2] - base[2]) * t * 0.6;
        return [r * (1 - 0.25 * under), g * (1 - 0.25 * under), b * (1 - 0.2 * under)];
      });
    k.body('fur', fur.bone('body'), {
      color: C.fur,
      roughness: 0.9,
      textureDensity: 1.5,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 90, y * 40, z * 90, 2),
    });

    // ------------------------------------------------------------------ ears: tall, pointed, cupped, pink inside
    const earOutline = profile.polygon(
      [
        [-0.05, -0.02],
        [0.058, -0.02],
        [0.064, 0.07],
        [0.05, 0.12],
        [0.056, 0.14], // a small notch on the outer edge
        [0.036, 0.17],
        [0.012, 0.215],
        [-0.016, 0.18],
        [-0.04, 0.11],
      ],
      { smooth: true, samples: 5 },
    );
    const earCup = sdf.extrude(profile.offsetProfile(earOutline, -0.02), 0.03, 0.01).at(0.002, 0.006, 0.018);
    const earLocal = sdf.extrude(earOutline, 0.03, 0.012).smoothSubtract(0.008, earCup);
    const earPose = (s: sdf.Shape) => s.scale(1.25).rotateY(22).rotateZ(-24).at(...EAR_ROOT);
    k.body('ears', pair(earPose(earLocal.paintWhere(earCup.round(0.004), C.earInner, 0.006)).bone('ear.L')), { color: C.earRim, roughness: 0.6 });

    // ------------------------------------------------------------------ face
    const EYE_X = 0.078;
    const EYE_Y = 0.35;
    const eyeHit = faceHit(EYE_X, EYE_Y);
    const EYE_R = 0.036;
    const eyeC: V3 = [eyeHit[0], eyeHit[1], eyeHit[2] - 0.012];
    const eyeFront = (x: number, r: number, dx = 0, dy = 0): V3 => {
      const c = x > 0 ? eyeC : mx(eyeC);
      return [c[0] - Math.sign(x) * 0.006 + dx, c[1] - 0.002 + dy, c[2] + EYE_R - r * 0.4];
    };
    const eyes = sdf.union(sdf.sphere(EYE_R).at(...eyeC), sdf.sphere(EYE_R).at(...mx(eyeC)));
    k.body('eyes', eyes.bone('body'), { color: C.eye, roughness: 0.2, emissive: C.eye, emissiveIntensity: 0.3, detail: 0.0035 });
    // The pupils are their own body: the eye glow would wash out painted pupils.
    const pupils = sdf
      .union(...[1, -1].map((x) => sdf.ellipsoid([0.016, 0.02, 0.008]).at(...eyeFront(x, 0.004))))
      .paintWhere(sdf.union(...[1, -1].map((x) => sdf.sphere(0.0065).at(...eyeFront(x, -0.012, 0.008, 0.009)))), '#ffffff', 0.002);
    k.body('pupils', pupils.bone('body'), { color: C.pupil, roughness: 0.2, detail: 0.003 });
    // A dark rim around each eye: a thin ring in the fur.
    const eyeRims = pair(sdf.torus(EYE_R - 0.002, 0.007).rotateX(90).at(eyeC[0], eyeC[1], eyeC[2] + 0.012));
    // Heavy brows, low at the inside: an angry glare.
    const brows = pair(
      sdf.chain(
        [
          [eyeC[0] + 0.05, eyeC[1] + 0.05, eyeC[2] - 0.02, 0.018],
          [eyeC[0] + 0.01, eyeC[1] + 0.04, eyeC[2] + 0.018, 0.02],
          [eyeC[0] - 0.04, eyeC[1] + 0.012, eyeC[2] + 0.028, 0.017],
        ],
        0.01,
      ),
    );
    k.body('brows', sdf.union(brows, eyeRims).bone('body'), { color: C.brow, roughness: 0.8 });

    // A pink pig snout with two nostrils.
    const snoutHit = faceHit(0, 0.295);
    const snoutC: V3 = [0, 0.295, snoutHit[2] + 0.006];
    const snout = sdf
      .smoothUnion(0.015, sdf.ellipsoid([0.052, 0.034, 0.03]).at(...snoutC), sdf.ellipsoid([0.03, 0.02, 0.02]).at(0, 0.322, snoutC[2] - 0.016))
      .paintWhere(pair(sdf.ellipsoid([0.011, 0.014, 0.03]).rotateZ(-20).at(0.018, 0.297, snoutC[2] + 0.028)), C.nostril, 0.003);
    k.body('snout', snout.bone('body'), { color: C.snout, roughness: 0.4 });

    // The grin: a dark curved mouth under the snout, with a row of small teeth and two long fangs.
    const MOUTH_Y = 0.24;
    const mouthShape = sdf
      .extrude(
        profile.polygon(
          [
            [-0.082, 0.02],
            [0.082, 0.02],
            [0.064, -0.012],
            [0.03, -0.03],
            [-0.03, -0.03],
            [-0.064, -0.012],
          ],
          { smooth: true, samples: 4 },
        ),
        0.5,
      )
      .at(0, MOUTH_Y, 0.2);
    const mouth = ball.round(0.004).subtract(ball.round(-0.008)).intersect(mouthShape).intersect(sdf.halfSpace([0, 0, -1], -0.1));
    k.body('mouth', mouth.bone('body'), { color: C.mouth, roughness: 0.6 });
    const mouthZ = (x: number) => sdf.raycast(ball, [x, MOUTH_Y + 0.016, 1], [0, 0, -1])![2];
    const teeth = sdf.union(
      ...[-0.03, -0.01, 0.01, 0.03].map((x) => sdf.box([0.018, 0.022, 0.012], 0.004).at(x, MOUTH_Y + 0.008, mouthZ(Math.abs(x)) + 0.008)),
      ...[-0.058, 0.058].map((x) => {
        const z = mouthZ(Math.abs(x));
        return sdf.cone([x, MOUTH_Y + 0.018, z - 0.002], [x * 1.03, MOUTH_Y - 0.036, z + 0.008], 0.013, 0.002);
      }),
    );
    k.body('teeth', teeth.bone('body'), { color: C.tooth, roughness: 0.3, detail: 0.003 });

    // ------------------------------------------------------------------ wings
    // Local frame: the root at the origin, the wing spread along +X, the membrane in the XY plane.
    // The arm arches up and out to a high knuckle; three fingers fan out and down from it; the
    // membrane scallops between the finger tips.
    const tips: V3[] = [
      [0.3, 0.1, 0],
      [0.28, -0.06, 0],
      [0.16, -0.11, 0],
    ];
    const outline = profile.polygon(
      [
        [0.0, 0.06],
        [0.06, 0.16],
        [KNUCKLE[0], KNUCKLE[1]],
        [0.22, 0.18],
        [tips[0]![0], tips[0]![1]],
        [0.235, 0.04],
        [tips[1]![0], tips[1]![1]],
        [0.19, -0.03],
        [tips[2]![0], tips[2]![1]],
        [0.1, -0.05],
        [0.0, -0.08],
      ],
      { smooth: false },
    );
    const membraneLocal = sdf
      .extrude(outline, 0.012, 0.004)
      .paintFn((x, y, _z, base) => {
        // Darker veins fanning from the knuckle.
        const a = Math.atan2(y - KNUCKLE[1], x - KNUCKLE[0]);
        return Math.abs(Math.sin(a * 5)) < 0.1 ? [base[0] * 0.85, base[1] * 0.78, base[2] * 0.8] : base;
      });
    // The inner membrane follows the arm; the outer part follows the knuckle.
    const split = sdf.halfSpace([1, 0, 0], KNUCKLE[0] - 0.01);
    const outer = sdf.halfSpace([-1, 0, 0], -(KNUCKLE[0] - 0.01));
    const bonesArm = sdf.smoothUnion(0.008, sdf.chain([[0, 0.03, 0, 0.022], [0.05, 0.14, 0, 0.018], [KNUCKLE[0], KNUCKLE[1], 0, 0.016]], 0.008), sdf.sphere(0.02).at(...KNUCKLE));
    const bonesFingers = sdf.union(
      ...tips.map((t) => sdf.chain([[KNUCKLE[0], KNUCKLE[1], 0, 0.012], [t[0], t[1], 0, 0.005]], 0.004)),
      sdf.cone([KNUCKLE[0], KNUCKLE[1], 0], [KNUCKLE[0] - 0.012, KNUCKLE[1] + 0.05, 0.004], 0.013, 0.003), // the thumb claw
    );
    const wingPose = (s: sdf.Shape) => s.rotateY(14).rotateZ(4).at(...WING_ROOT);
    const membrane = sdf.union(wingPose(membraneLocal.intersect(split)).bone('wing.L'), wingPose(membraneLocal.intersect(outer)).bone('wingtip.L'));
    k.body('wing-membranes', pair(membrane), { color: C.membrane, roughness: 0.55 });
    k.body('wing-bones', pair(sdf.union(wingPose(bonesArm).bone('wing.L'), wingPose(bonesFingers).bone('wingtip.L'))), { color: C.wingBone, roughness: 0.5 });

    // ------------------------------------------------------------------ feet: tiny pink feet with dark claws
    const footLocal = sdf.smoothUnion(
      0.012,
      sdf.capsule([0, 0.14, -0.01], [0, 0.04, 0.0], 0.018),
      sdf.ellipsoid([0.03, 0.02, 0.032]).at(0, 0.03, 0.014),
    );
    const clawsLocal = sdf.union(...[-0.016, 0, 0.016].map((dx) => sdf.cone([dx, 0.024, 0.036], [dx * 1.2, 0.002, 0.05], 0.008, 0.002)));
    k.body('feet', pair(footLocal.at(FOOT[0], 0, FOOT[2]).bone('foot.L')), { color: C.feet, roughness: 0.5 });
    k.body('claws', pair(clawsLocal.at(FOOT[0], 0, FOOT[2]).bone('foot.L')), { color: C.claw, roughness: 0.35, detail: 0.003 });

    // ------------------------------------------------------------------ animation
    const { wave } = motion;
    const HOVER = 0.24;

    // Idle: hovering in place; the wings beat, the tips lag, the ball squashes on the down beat.
    k.animation('idle', {
      duration: 0.6,
      pose: (_t, p) => {
        const beat = wave(p);
        const lag = wave(p, 1, 0.12);
        return {
          body: { move: [0, HOVER + 0.03 * wave(p, 1, 0.25), 0], rotate: [4, 6 * wave(p, 0.5), 0], scale: [1 - 0.03 * beat, 1 + 0.03 * beat, 1 - 0.03 * beat] },
          'wing.L': { rotate: [0, 6 * wave(p, 1, 0.25), 10 + 45 * beat] },
          'wing.R': { rotate: [0, -6 * wave(p, 1, 0.25), -10 - 45 * beat] },
          'wingtip.L': { rotate: [0, 0, 20 * lag] },
          'wingtip.R': { rotate: [0, 0, -20 * lag] },
          'ear.L': { rotate: [0, 0, -6 * wave(p, 1, 0.35)] },
          'ear.R': { rotate: [0, 0, 6 * wave(p, 1, 0.35)] },
          'foot.L': { rotate: [10 + 8 * wave(p, 1, 0.4), 0, 0] },
          'foot.R': { rotate: [10 + 8 * wave(p, 1, 0.45), 0, 0] },
        };
      },
    });

    // Fly: tilted into forward flight, bigger and faster beats, the ears and feet swept back.
    k.animation('fly', {
      duration: 0.45,
      pose: (_t, p) => {
        const beat = wave(p);
        const lag = wave(p, 1, 0.12);
        return {
          body: { move: [0, HOVER + 0.04 * wave(p, 1, 0.25), 0], rotate: [18, 0, 4 * wave(p, 1, 0.1)] },
          'wing.L': { rotate: [0, 12 * wave(p, 1, 0.25), 6 + 55 * beat] },
          'wing.R': { rotate: [0, -12 * wave(p, 1, 0.25), -6 - 55 * beat] },
          'wingtip.L': { rotate: [0, 0, 26 * lag] },
          'wingtip.R': { rotate: [0, 0, -26 * lag] },
          'ear.L': { rotate: [-22, 0, -4] },
          'ear.R': { rotate: [-22, 0, 4] },
          'foot.L': { rotate: [40, 0, 0] },
          'foot.R': { rotate: [36, 0, 0] },
        };
      },
    });

    // Attack: rise with the wings high, dive forward with the mouth open wide... the fangs lead,
    // the wings sweep back, then recover to the hover.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const rise = ease(0, 0.35, p) * (1 - ease(0.35, 0.45, p));
        const dive = ease(0.35, 0.47, p) * (1 - ease(0.62, 1, p));
        const beat = wave(p, 3);
        return {
          body: {
            move: [0, HOVER + 0.08 * rise - 0.08 * dive, -0.04 * rise + 0.16 * dive],
            rotate: [-12 * rise + 32 * dive, 0, 0],
            scale: [1 - 0.06 * dive, 1 + 0.08 * dive, 1 - 0.06 * dive],
          },
          'wing.L': { rotate: [0, -30 * dive, 10 + 25 * beat * (1 - dive) + 40 * rise] },
          'wing.R': { rotate: [0, 30 * dive, -10 - 25 * beat * (1 - dive) - 40 * rise] },
          'wingtip.L': { rotate: [0, 0, -20 * dive] },
          'wingtip.R': { rotate: [0, 0, 20 * dive] },
          'ear.L': { rotate: [-30 * dive, 0, 8 * rise] },
          'ear.R': { rotate: [-30 * dive, 0, -8 * rise] },
          'foot.L': { rotate: [10 + 30 * dive, 0, 0] },
          'foot.R': { rotate: [10 + 30 * dive, 0, 0] },
        };
      },
    });

    const { keys } = motion;
    /** Left-side rotations spread to both sides: Y and Z flip sign on the right. */
    const both = (name: string, r: [number, number, number]) => ({
      [`${name}.L`]: { rotate: r },
      [`${name}.R`]: { rotate: [r[0], -r[1], -r[2]] as [number, number, number] },
    });

    // Hit: the ball jolts back and squashes, the wings fold in against the body, the ears flatten;
    // then the hover and the wing beat return (the last frame is the first idle frame).
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.38, 0.75], [1, 0]]);
        const free = 1 - h;
        const beat = wave(p) * free;
        const lag = wave(p, 1, 0.12) * free;
        return {
          body: {
            move: [0, HOVER + 0.03 * wave(p, 1, 0.25) + 0.02 * h, -0.08 * h],
            rotate: [4 - 26 * h, 0, 7 * h],
            scale: [1 - 0.03 * beat + 0.12 * h, 1 + 0.03 * beat - 0.15 * h, 1 - 0.03 * beat + 0.1 * h],
          },
          ...both('wing', [0, 6 * wave(p, 1, 0.25) * free + 30 * h, (10 + 45 * beat) * free - 28 * h]),
          ...both('wingtip', [0, 0, 20 * lag - 55 * h]),
          ...both('ear', [-45 * h, 0, -6 * wave(p, 1, 0.35) * free - 22 * h]),
          'foot.L': { rotate: [(10 + 8 * wave(p, 1, 0.4)) * free - 22 * h, 0, 6 * h] },
          'foot.R': { rotate: [(10 + 8 * wave(p, 1, 0.45)) * free - 18 * h, 0, -6 * h] },
        };
      },
    });

    // Death: a jolt in the hover, the wings stop and crumple, the ball tumbles back and drops, lands
    // with a squash and a small bounce, and lies on its back with the feet up and the ears limp on the
    // floor; the wing arms hang down its sides and the fingers lie spread flat on the floor.
    const LIE = -0.07; // body move y when it lies on its back (the build lifts it if it sinks)
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const jolt = keys(p, [[0, 0], [0.08, 1], [0.2, 0.4], [0.4, 0]]);
        const f = Math.min(1, Math.max(0, (p - 0.12) / 0.34));
        const y =
          p < 0.12
            ? keys(p, [[0, HOVER + 0.03], [0.09, HOVER + 0.06], [0.12, HOVER + 0.06]])
            : p < 0.46
              ? HOVER + 0.06 + (LIE - HOVER - 0.06) * f * f // accelerates like a drop
              : keys(p, [[0.46, LIE], [0.57, LIE + 0.06], [0.68, LIE], [0.76, LIE + 0.012], [0.84, LIE]]);
        // The landing squash is along the body's own Z, the vertical when it lies on its back.
        const land = keys(p, [[0.42, 0], [0.47, 1], [0.56, -0.35], [0.66, 0.4], [0.76, -0.1], [0.84, 0]]);
        return {
          body: {
            move: [0, y, -0.06 * jolt],
            rotate: [
              keys(p, [[0, 4], [0.08, -20], [0.16, -8], [0.46, -102], [0.57, -84], [0.68, -93], [1, -90]]),
              0,
              keys(p, [[0, 0], [0.1, 10], [0.3, -26], [0.46, 7], [0.6, -3], [0.75, 0]]),
            ],
            scale: [1 + 0.1 * jolt + 0.12 * land, 1 - 0.12 * jolt + 0.12 * land, 1 + 0.1 * jolt - 0.2 * land],
          },
          ...both('wing', [
            0,
            keys(p, [[0, 6], [0.08, 24], [0.3, -8], [0.44, 6], [0.54, 66], [0.64, 54], [0.76, 64], [1, 62]]),
            keys(p, [[0, 10], [0.08, -24], [0.3, 52], [0.44, 40], [0.54, -2], [1, 4]]),
          ]),
          ...both('wingtip', [
            0,
            keys(p, [[0, 0], [0.44, 0], [0.54, -34], [0.66, -46], [1, -40]]),
            keys(p, [[0, 14], [0.08, -40], [0.3, -78], [0.44, -62], [0.56, -8], [1, -16]]),
          ]),
          ...both('ear', [
            keys(p, [[0, 0], [0.08, -42], [0.3, -8], [0.46, -12], [0.56, -36], [0.68, -22], [1, -28]]),
            0,
            keys(p, [[0, -5], [0.08, -22], [0.3, 10], [0.56, -14], [1, -10]]),
          ]),
          'foot.L': { rotate: [keys(p, [[0, 15], [0.1, -12], [0.46, -30], [0.6, -72], [0.74, -52], [1, -60]]), 0, keys(p, [[0, 0], [0.5, 12]])] },
          'foot.R': { rotate: [keys(p, [[0, 12], [0.1, -8], [0.46, -24], [0.62, -66], [0.76, -46], [1, -54]]), 0, keys(p, [[0, 0], [0.5, -8]])] },
        };
      },
    });
  },
});
