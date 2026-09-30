import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Pirate — Chibi Quest enemy (catalog `enemies/humanoid/pirate`), about 0.93 m to the top of the
 * bandana, faces +Z. Target: docs/enemy-mockups/pirate_001.jpg (one front view).
 * Built on the bandit's rig (the rogue's skeleton with knee bones); the cutlass is in hand.R (the
 * right hand, x < 0, on the left in the picture). The clips are the bandit's, written for a
 * weapon arm on the left and mirrored with motion.mirrorPose (as in the bandit captain).
 *
 * Role: a common human deckhand enemy, seen in 3D and as a 128 px sprite; the red bandana, the
 *   striped shirt, the big moustache and the cutlass read at that size.
 * One idea: a cheerful, grinning deckhand: a red bandana, a huge curled moustache with a toothy
 *   grin, gold hoop earrings, a blue and cream striped shirt, bare feet, and a hooked cutlass.
 * Shape language: round and friendly (head, cheeks, nose, fists, feet) with curled accents (the
 *   moustache tips, the cutlass hook, the bandana tail).
 * Palette (60/30/10): shirt stripes blue #2a6aa8 and cream #ece4d0, leather brown #6a4a30 and
 *   #4a3222, dark trousers #2a2a2e, skin #f0c8a0; a red bandana #c83a30 is the accent; brass and
 *   gold (#c9a24a, #d8b040) are the small bright points.
 * Value plan: the light face sits between the red bandana and the black moustache; the striped
 *   chest is the second light mass; the dark trousers and the grey cuffs ground it.
 * Bodies: skin (head), limbs (arms, legs, feet), hair (temples, moustache, beard), bandana,
 *   shirt, collar, vest, trousers, leather (belt, strap), brass (buttons, buckle), gold (earrings),
 *   cutlass, hilt, guard.
 * Rig: the rogue's skeleton with knee bones plus `knot` (the bandana tail); the cutlass is rigid
 *   on `cutlassbone`, a child of hand.R that the death clip moves and the taunt tosses.
 *   Clips: idle, walk, run, attack (a high diagonal slash), hit, death, taunt.
 */

const C = {
  skin: '#f0c8a0',
  blush: '#e8a090',
  nose: '#eaa688',
  eyeDark: '#17110e',
  hair: '#24201c',
  teeth: '#f0ece0',
  mouth: '#4a1e18',
  bandana: '#c83a30',
  bandanaDark: '#9a2a22',
  blue: '#2a6aa8',
  cream: '#ece4d0',
  vest: '#6a4a30',
  vestLit: '#8a6a48',
  vestDark: '#4e3622',
  belt: '#4a3222',
  brass: '#c9a24a',
  gold: '#d8b040',
  trousers: '#2a2a2e',
  cuff: '#6a6a64',
  blade: '#a0a4aa',
  bladeEdge: '#d0d4d8',
  grip: '#2a2a2e',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints of the bandit rig in the frame where the weapon arm is on the left (+X); the build mirrors them.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.18, 0.332, 0.012];
const WRIST_R: V3 = [-0.205, 0.238, 0.03];
const ELBOW_L: V3 = [0.19, 0.335, 0.02];
const WRIST_L: V3 = [0.218, 0.262, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left foot (y = 0), measured on the SDF: heel and toe.
// The toe turns out 12 degrees, so the toe point sits outboard of the heel.
const SOLE_HEEL: V3 = [0.093, 0, -0.024];
const SOLE_TOE: V3 = [0.108, 0, 0.085];

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
  name: 'pirate',
  description: 'Chibi pirate deckhand enemy: a red bandana, a huge curled moustache and a toothy grin, gold hoop earrings, a blue and cream striped shirt under an open leather vest, bare feet, and a hooked cutlass.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/pirate_001.jpg',
  variants: {
    bandana: { red: C.bandana, blue: '#2a4a7a', black: '#24201c' },
    stripe: { blue: C.blue, red: '#a83a30', green: '#3a6a3a' },
    vest: { brown: C.vest, black: '#2a2622', tan: '#a08060' },
  },
  presets: {
    deckhand: { bandana: 'red', stripe: 'blue', vest: 'brown' },
    buccaneer: { bandana: 'blue', stripe: 'red', vest: 'black' },
    corsair: { bandana: 'black', stripe: 'green', vest: 'tan' },
  },

  build(k) {
    const T = {
      bandana: k.tint('bandana'),
      bandanaDark: k.tint('bandana', { color: C.bandanaDark, follow: 1 }),
      stripe: k.tint('stripe'),
      vest: k.tint('vest'),
      vestLit: k.tint('vest', { color: C.vestLit, follow: 1 }),
      vestDark: k.tint('vest', { color: C.vestDark, follow: 1 }),
    };
    const CUT_TILT = 30; // the blade points down and forward; the grip and the fist turn with it
    const CUT_YAW = -4;
    const GRIP: V3 = [WRIST_L[0] + 0.007, WRIST_L[1] - 0.045, WRIST_L[2] + 0.02];
    const KNOT: V3 = [-0.15, 0.652, -0.125];
    // The final joints: the cutlass arm is the right arm (x < 0), the free arm the left arm.
    const EL_L = mx(ELBOW_R);
    const WR_L = mx(WRIST_R);
    const EL_R = mx(ELBOW_L);
    const WR_R = mx(WRIST_L);
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [-0.2, 0.5, -0.14] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: EL_L },
      'hand.L': { parent: 'forearm.L', at: WR_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: EL_R },
      'hand.R': { parent: 'forearm.R', at: WR_R },
      cutlassbone: { parent: 'hand.R', at: mx(GRIP) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const NOSE_Y = 0.585;
    const nose = sdf.ellipsoid([0.037, 0.033, 0.034]).at(0, NOSE_Y, faceZ(0, NOSE_Y) - 0.006).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.048, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.61, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    // Big dark eyes with two shines, raised arched brows, blushing cheeks, a pink round nose.
    const eyes = pair(at(sdf.ellipsoid([0.03, 0.043, 0.07]), EYE[0], EYE[1]));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.0105), x + 0.009, EYE[1] + 0.017), at(sdf.sphere(0.005), x - 0.008, EYE[1] - 0.02)]),
    );
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.158, 0.682],
              [0.122, 0.702],
              [0.082, 0.707],
              [0.046, 0.692],
              [0.05, 0.678],
              [0.082, 0.692],
              [0.122, 0.69],
              [0.154, 0.669],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    const cheeks = pair(at(sdf.sphere(0.03), 0.125, 0.552));
    // The grin: a shallow smile stroke, with a strip of teeth in its upper part.
    const MOUTH_Y = 0.508;
    const smile = (width: number, from: number, to: number, dy: number) =>
      sdf.extrude(profile.arc(0.15, width, from, to), 0.3).at(0, MOUTH_Y + 0.15 + dy, 0.1);
    const mouth = smile(0.028, 245, 295, 0);
    const teeth = smile(0.02, 249, 291, 0.0022);
    const toothGaps = sdf.union(
      ...[-0.026, 0, 0.026].map((x) => sdf.extrude(profile.rect([0.0028, 0.05], 0.001), 0.3).at(x, MOUTH_Y + 0.006, 0.1)),
    );
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .paintWhere(cheeks, C.blush, 0.022)
      .paintWhere(nose.round(0.003), C.nose, 0.006)
      .paintWhere(eyes, C.eyeDark)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.hair)
      .paintWhere(mouth, C.mouth, 0.002)
      .paintWhere(teeth, C.teeth, 0.0015)
      .paintWhere(toothGaps.intersect(teeth), C.mouth, 0.001);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ limbs: bare arms, bare legs and feet
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, EL_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(EL_L, WR_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WR_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), EL_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(EL_R, WR_R, 0.036, 0.032).bone('forearm.R'),
      fistAt(WR_R, -1).at(...mx(GRIP).map((v) => -v) as unknown as V3).rotateX(CUT_TILT).rotateY(-CUT_YAW).at(...mx(GRIP)).bone('hand.R'),
    );
    // A bare foot: a flat sole, a slight arch, and a row of toe bumps (a big toe on the inside).
    const foot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.034, 0.08, 0.01).at(0, 0.09, 0),
        sdf.ellipsoid([0.05, 0.045, 0.085]).at(0, 0.03, 0.03),
        sdf.ellipsoid([0.034, 0.03, 0.05]).at(0, 0.055, 0.0), // the arch: a raised instep
      )
      .smoothUnion(
        0.004,
        sdf.sphere(0.0125).at(-0.02, 0.022, 0.104),
        ...[-0.008, 0.005, 0.017, 0.027].map((x, i) => sdf.sphere(0.0092 - 0.0006 * i).at(x, 0.019, 0.108 - 0.004 * i * i * 0.35 - 0.001 * i)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const shin = sdf.cone([0.096, 0.15, 0.004], [ANKLE[0], 0.07, 0], 0.036, 0.031).bone('shin.L');
    const legs = pair(sdf.smoothUnion(0.02, shin, foot));
    k.body('limbs', sdf.union(armL, armR), { color: C.skin, roughness: 0.55, detail: 0.006, textureDensity: 1 });
    k.body('feet', legs, { color: C.skin, roughness: 0.55, detail: 0.0045, textureDensity: 1 });

    // ------------------------------------------------------------------ hair: temples, nape, moustache, beard
    const shellOf = (r: number) => head.round(r).subtract(head.round(0.0015));
    const tuft = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.012);
    const temples = pair(
      sdf.smoothUnion(
        0.01,
        tuft([[0.184, 0.712, 0.07, 0.02], [0.19, 0.668, 0.072, 0.019], [0.195, 0.62, 0.058, 0.011]]),
        tuft([[0.175, 0.715, 0.11, 0.016], [0.18, 0.68, 0.115, 0.012]]),
      ),
    );
    const mPts: [number, number, number][] = [
      [0.006, 0.556, 0.017],
      [0.04, 0.55, 0.0165],
      [0.078, 0.555, 0.015],
      [0.107, 0.572, 0.012],
      [0.118, 0.593, 0.008],
    ];
    const moustache = pair(sdf.chain(mPts.map(([x, y, r]) => [x, y, faceZ(x, y) + 0.004, r] as [number, number, number, number]), 0.012));
    const beardPts: [number, number][] = [[0.038, 0.494], [0.017, 0.482]];
    const beard = sdf.chain(
      [...beardPts.map(([x, y]) => [-x, y, faceZ(x, y) + 0.003, x > 0.03 ? 0.011 : 0.014] as [number, number, number, number]),
        ...[...beardPts].reverse().map(([x, y]) => [x, y, faceZ(x, y) + 0.003, x > 0.03 ? 0.011 : 0.014] as [number, number, number, number])],
      0.012,
    );
    const hair = sdf.smoothUnion(0.008, temples, moustache, beard);
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // Gold hoops through the ear lobes.
    const hoop = sdf.torus(0.019, 0.0045).rotateX(90).at(0.2, 0.566, 0.0);
    k.body('gold', pair(hoop.bone('head')), { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.003 });

    // ------------------------------------------------------------------ bandana: cap, folded band, knot, tail
    const ABOVE = sdf.halfSpace([0, -0.9701, 0.2425], -0.705 * 0.9701); // y >= 0.705 + 0.25 z
    const BELOW = sdf.halfSpace([0, 0.9701, -0.2425], 0.738 * 0.9701); // y <= 0.738 + 0.25 z
    const capBase = sdf.ellipsoid([0.222, 0.228, 0.208]).at(0, 0.684, -0.01);
    // The cloth also drops at the back, over the nape, where the knot is tied.
    const backDrop = capBase.intersect(sdf.halfSpace([0, -1, 0], -0.6)).intersect(sdf.halfSpace([0, 0, 1], -0.06));
    const cap = sdf.smoothUnion(0.02, capBase.intersect(ABOVE), backDrop).displace(0.006, (x, y, z) => noise.fbm(x * 8, y * 8, z * 8, 2));
    const band = sdf.ellipsoid([0.225, 0.219, 0.208]).at(0, 0.68, -0.008).intersect(ABOVE).intersect(BELOW);
    const knotShape = sdf.ellipsoid([0.034, 0.03, 0.028]).at(...KNOT);
    const tail = (dx: number, dz: number, len: number) =>
      sdf.chain(
        [
          [KNOT[0], KNOT[1], KNOT[2], 0.02],
          [KNOT[0] + dx * 0.45, KNOT[1] - len * 0.4, KNOT[2] - 0.012 + dz * 0.45, 0.026],
          [KNOT[0] + dx, KNOT[1] - len, KNOT[2] - 0.006 + dz, 0.022],
        ],
        0.01,
      );
    const bandana = sdf
      .smoothUnion(
        0.008,
        sdf.smoothUnion(0.01, cap, band).bone('head'),
        knotShape.bone('head'),
        sdf.union(tail(-0.032, -0.012, 0.14), tail(0.02, 0.008, 0.1)).bone('knot'),
      )
      .paintFn((x, y, z, base) => ((z > -0.06 && y - 0.25 * z < 0.734) || (z <= -0.06 && y < 0.622) ? rgb(T.bandanaDark) : base));
    k.body('bandana', bandana, {
      color: T.bandana,
      roughness: 0.9,
      bump: (x, y, z) => {
        // Two shallow fold grooves run from the knot forward over the crown (seen from above).
        const groove = (ax: number, az: number, bx: number, bz: number) => {
          const dx = bx - ax;
          const dz = bz - az;
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
          const d = Math.hypot(x - ax - t * dx, z - az - t * dz);
          return -0.0035 * Math.exp(-((d / 0.011) ** 2));
        };
        return (
          groove(-0.14, -0.12, 0.04, 0.17) + groove(-0.16, -0.1, -0.07, 0.16) + 0.0012 * Math.sin(x * 55 + z * 32 + y * 18) + 0.0006 * Math.sin(x * 120 - y * 90)
        );
      },
    });

    // ------------------------------------------------------------------ shirt (striped), collar, vest
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.124, 0.29],
            [0.13, 0.25],
            [0.138, 0.21],
            [0.14, 0.196],
            [0.13, 0.186],
            [0, 0.186],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const cream = rgb(C.cream);
    // A sleeve is a capsule cut flat near the elbow, with a rolled cuff ring (a cylinder along the arm).
    const armDir = (s: V3, e: V3): V3 => {
      const d: V3 = [e[0] - s[0], e[1] - s[1], e[2] - s[2]];
      const l = Math.hypot(d[0], d[1], d[2]);
      return [d[0] / l, d[1] / l, d[2] / l];
    };
    const cuffOf = (s: V3, e: V3) => {
      const v = armDir(s, e);
      const phi = (Math.asin(v[2]) * 180) / Math.PI;
      const a = (Math.atan2(-v[0], v[1]) * 180) / Math.PI;
      return sdf.cylinder(0.054, 0.04, 0.013).rotateX(phi).rotateZ(a).at(...lerp(s, e, 0.9));
    };
    const sleeve = (s: V3, e: V3, tag: string) => {
      const v = armDir(s, e);
      const c = lerp(s, e, 0.94);
      const cone = sdf.cone([s[0] * 0.85, 0.415, 0], lerp(s, e, 0.9), 0.048, 0.047).intersect(sdf.halfSpace(v, v[0] * c[0] + v[1] * c[1] + v[2] * c[2]));
      return sdf.smoothUnion(0.008, cone, cuffOf(s, e)).bone(tag);
    };
    const cuffs = sdf.union(cuffOf(SHOULDER, EL_L), cuffOf(mx(SHOULDER), EL_R)).round(0.002);
    const shirt = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, EL_L, 'upperarm.L'), sleeve(mx(SHOULDER), EL_R, 'upperarm.R'))
      .paintFn((x, y, z, base) => (y < 0.47 && y > 0.25 && Math.sin((y * 2 * Math.PI) / 0.03) > 0 ? cream : base))
      .paintWhere(cuffs, cream, 0.002);
    k.body('shirt', shirt, { color: T.stripe, roughness: 0.85, paintWeight: 3 });
    // The collar: a blue ring around the neck, open in a V at the front.
    const collar = sdf
      .torus(0.068, 0.021)
      .scale([1, 1.15, 0.92])
      .at(0, 0.458, -0.012)
      .subtract(sdf.extrude(profile.polygon([[-0.035, 0.52], [0.035, 0.52], [0.004, 0.43], [-0.004, 0.43]]), 0.4).at(0, 0, 0.2));
    k.body('collar', collar.bone('chest'), { color: T.stripe, roughness: 0.8, detail: 0.005 });
    // The vest: a leather shell over the torso, open in a wide V at the front, to the waist.
    const vest = torso
      .round(0.012)
      .subtract(torso.round(0.001))
      .intersect(sdf.halfSpace([0, 1, 0], 0.44))
      .intersect(sdf.halfSpace([0, -1, 0], -0.2))
      .smoothSubtract(
        0.006,
        sdf
          .extrude(
            profile.polygon([
              [-0.04, 0.46],
              [0.04, 0.46],
              [0.09, 0.19],
              [-0.09, 0.19],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      )
      .subtract(pair(sdf.ellipsoid([0.06, 0.07, 0.07]).at(0.13, 0.38, 0)))
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.4), T.vestLit, 0.05)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.24), T.vestDark, 0.006);
    k.body('vest', vest.bone('chest'), { color: T.vest, roughness: 0.6 });

    // ------------------------------------------------------------------ trousers: dark, rolled to the knee
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(
        sdf
          .smoothUnion(
            0.01,
            sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.15, 0.004], 0.05).intersect(sdf.halfSpace([0, -1, 0], -0.121)),
            sdf.union(sdf.cylinder(0.056, 0.032, 0.012).at(0.096, 0.135, 0.004), sdf.torus(0.05, 0.015).at(0.096, 0.122, 0.004)).paint(C.cuff), // rolled cuff
          )
          .bone('leg.L'),
      ),
    );
    k.body('trousers', trousers, {
      color: C.trousers,
      roughness: 0.85,
      bump: (x, y, z) => 0.0008 * Math.sin((x + z) * 300) * Math.sin(y * 300),
    });

    // ------------------------------------------------------------------ leather: belt, diagonal strap; brass buckle, buttons
    const beltY = 0.235;
    const belt = torso.round(0.02).smoothIntersect(0.006, sdf.box([0.5, 0.048, 0.5], 0.006).at(0, beltY, 0));
    const strap = torso
      .round(0.017)
      .smoothIntersect(0.004, sdf.box([0.8, 0.034, 0.8], 0.006).rotateZ(-57).at(-0.005, 0.335, 0))
      .intersect(sdf.halfSpace([0, 1, 0], 0.47));
    const strapTail = sdf.box([0.03, 0.1, 0.016], 0.007).rotateZ(-6).at(0.088, 0.19, 0.098);
    k.body('leather', sdf.union(belt.bone('spine'), strap.bone('chest'), strapTail.bone('spine')), { color: C.belt, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.078, 0.056, 0.014], 0.006).subtract(sdf.box([0.046, 0.032, 0.03], 0.004)), sdf.box([0.009, 0.036, 0.011], 0.003).at(0.004, 0, 0.003))
      .at(0, beltY, beltZ + 0.003);
    const buttonAt = (x: number, y: number) => {
      const z = sdf.raycast(vest, [x, y, 1], [0, 0, -1])![2];
      return sdf.sphere(0.0125).at(x, y, z + 0.001);
    };
    const buttons = sdf.union(buttonAt(0.082, 0.33), buttonAt(-0.082, 0.33));
    k.body('brass', sdf.union(buckle, buttons).bone('spine'), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ the cutlass (right hand)
    // Local frame: the grip at the origin, the blade forward along +X with a curved edge below;
    // built for the left hand of the bandit, then mirrored to the right hand.
    // A sabre: it curves gently up toward the spine, and the last 0.04 m hooks back by 25 degrees.
    const bladeTop: [number, number][] = [];
    const bladeBottom: [number, number][] = [];
    {
      const n = 24;
      let cx = 0.03;
      let cy = 0;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const hook = Math.max(0, (t - 0.87) / 0.13);
        const ang = ((4 + 10 * t + 25 * hook) * Math.PI) / 180;
        if (i > 0) {
          cx += (0.28 / n) * Math.cos(ang);
          cy += (0.28 / n) * Math.sin(ang);
        }
        const w = (0.02 + 0.036 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.85))) * (t > 0.85 ? Math.max(0.12, (1 - t) / 0.15) : 1);
        bladeTop.push([cx - Math.sin(ang) * w * 0.55, cy + Math.cos(ang) * w * 0.55]);
        bladeBottom.push([cx + Math.sin(ang) * w * 0.45, cy - Math.cos(ang) * w * 0.45]);
      }
    }
    const bottomAt = (x: number) => {
      for (let i = 1; i < bladeBottom.length; i++) {
        const [x0, y0] = bladeBottom[i - 1]!;
        const [x1, y1] = bladeBottom[i]!;
        if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
      }
      return bladeBottom[bladeBottom.length - 1]![1];
    };
    const bladeLocal = sdf
      .extrude(profile.polygon([...bladeTop, ...[...bladeBottom].reverse()]), 0.014, 0.004)
      .paintFn((x, y, z, base) => (y > bottomAt(x) + 0.011 ? rgb(C.blade) : base))
      .rotateX(-90); // rolled about the grip axis: the flat faces forward, the hook curls outward
    const gripLocal = sdf.capsule([-0.06, 0, 0], [0.04, 0, 0], 0.014);
    const guardLocal = sdf.union(
      sdf.sphere(0.052).shell(0.012).intersect(sdf.halfSpace([-1, 0, 0], -0.02)).at(0.025, 0, 0), // brass cup guard
      sdf.sphere(0.018).at(-0.066, 0, 0), // pommel
    );
    const cutlassPose = (s: sdf.Shape) => {
      const posed = s.rotateY(-90).rotateX(CUT_TILT).rotateY(CUT_YAW).at(...GRIP);
      return posed.mirror('x', 0).intersect(sdf.halfSpace([1, 0, 0], 0));
    };
    k.body('cutlass', cutlassPose(bladeLocal), { color: C.bladeEdge, roughness: 0.4, metalness: 0.75, detail: 0.003, bone: 'cutlassbone' });
    k.body('hilt', cutlassPose(gripLocal), { color: C.grip, roughness: 0.7, detail: 0.004, bone: 'cutlassbone' });
    k.body('guard', cutlassPose(guardLocal), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.004, bone: 'cutlassbone' });

    // ------------------------------------------------------------------ animation
    // The clips are the bandit's, written for a cutlass arm on the left; mirrorPose moves them to
    // the right arm, so `upperarm.L` below drives the right arm, and `.R` the left arm.
    type AnimSpec = Parameters<typeof k.animation>[1];
    const anim = (name: string, spec: AnimSpec) => k.animation(name, { ...spec, pose: (t, p) => motion.mirrorPose(spec.pose(t, p)) });
    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    anim('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // Shifty: the head glances from side to side.
        head: { rotate: [0, 12 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    // The legs come from motion.gait: planted stance boots, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `bob` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the left arm
    // (the cutlass arm) is back. The hips' sway goes to gait, so the planted feet do not slide.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
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
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The bandana tail swing a little after the steps.
          knot: { rotate: [lean * 1.5 + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'upperarm.L': { rotate: [armSwing * 0.6 * s, 0, 6] as const },
          // The hand turns against the arm and the lean, so the blade keeps pointing down (it stays off the ground).
          'hand.L': { rotate: [-0.85 * (1.5 * lean + 0.6 * armSwing * s), 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.4 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.3, 0, 0] as const },
        };
      },
    });
    // A sneaky thief: short, light steps with a low swing; the run is quick with a flight phase.
    anim('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 26, 3));
    anim('run', stride(0.56, 0.15, 0.045, 0.4, 0.03, 46, 12));

    // Attack: a strong left-handed diagonal slash with the cutlass, solved by targets (the mirror of
    // the animated armor's cut). The wrist follows its keys (reach); the blade follows its own keys
    // (orient). The keys are in the chest's frame: the hips and the chest turn the whole arm.
    // Wind-up: the chest turns to the left, the weight goes back onto the left foot, and the cutlass
    // rises high over the left shoulder with the tip back behind the head, for a short hold.
    // Cut (about 0.12 s): the blade comes up over the shoulder and down across the front, from high
    // left to low right (high right to low left in the front view), as the right foot steps in and
    // the chest unwinds. Follow-through: the blade runs on past the right hip and slows, then
    // recovers to rest. edgeUp turns the flat so the curved edge leads the cut; the back of the
    // blade leads the lift and the recovery.
    const { keys, reach, orient, edgeUp } = motion;
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    // The cutlass's rest frame, from the turns in cutlassPose: the blade runs along local +X, and
    // the flat's normal is the extrude axis, local +Z.
    const cutlassTurn = (v: V3): V3 => {
      const w = new THREE.Vector3(...v)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-90))
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(CUT_TILT))
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(CUT_YAW));
      return [w.x, w.y, w.z];
    };
    const BLADE_DIR = cutlassTurn([1, 0, 0]); // out to the left, forward, a little down
    const FLAT = cutlassTurn([0, 1, 0]); // forward and to the right
    // The flat's normal through the cut (up and to the right). edgeUp keeps its sign on this side,
    // so the edge leads the whole cut and never flips when the blade points straight forward.
    const CUT_FLAT = norm([-0.6, 0.75, 0]);
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const bladeKeys = [
      [0, BLADE_DIR],
      [0.12, norm([0.75, 0.62, 0.22])], // out to the left and rising
      [0.24, norm([0.3, 0.75, -0.6])], // up and back over the left shoulder
      [0.3, norm([0.28, 0.72, -0.64])], // the top: the tip back behind the head
      [0.39, norm([0.24, 0.7, -0.67])], // the hold, cocked a little further
      [0.44, norm([0.45, 0.88, 0.1])], // up over the shoulder
      [0.48, norm([0.58, 0.52, 0.62])], // high on the left, pointing forward and up
      [0.51, norm([-0.08, -0.1, 0.99])], // forward, below the chin, cutting down and across
      [0.54, norm([-0.58, -0.52, 0.62])], // low right, the end of the fast cut
      [0.62, norm([-0.68, -0.56, 0.47])], // on past the right hip, slowing
      [0.72, norm([-0.68, -0.58, 0.45])],
      [0.86, norm([0.35, 0.02, 0.94])], // the recovery lifts the tip forward, clear of the ground
      [1, BLADE_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    anim('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_L],
            [0.12, [0.25, 0.36, 0.04]], // out to the left, rising
            [0.24, [0.245, 0.47, -0.045]],
            [0.3, [0.25, 0.48, -0.06]], // the top, high over the left shoulder
            [0.39, [0.25, 0.485, -0.065]], // the hold
            [0.44, [0.255, 0.475, 0.02]], // up over the shoulder
            [0.48, [0.2, 0.44, 0.11]], // high on the left, in front
            [0.51, [0.15, 0.385, 0.16]],
            [0.54, [0.12, 0.335, 0.165]], // low right, the end of the fast cut
            [0.62, [0.11, 0.32, 0.16]], // the follow-through slows
            [0.72, [0.115, 0.32, 0.16]],
            [0.86, [0.2, 0.3, 0.13]], // out and forward, so the pommel stays off the vest
            [1, WRIST_L],
          ] as const,
          'spline',
        );
        const dir = norm(bladeAt(p));
        // The flat turns from its rest side to the cut side in the lift, and back to rest at the
        // end, so the first and the last frame are the rest pose.
        const lead = ease(0.14, 0.3, p) * (1 - ease(0.74, 0.94, p));
        const cutUp = edgeUp(bladeAt, p, CUT_FLAT);
        const up = norm([FLAT[0] + (cutUp[0] - FLAT[0]) * lead, FLAT[1] + (cutUp[1] - FLAT[1]) * lead, FLAT[2] + (cutUp[2] - FLAT[2]) * lead]);
        // The elbow points out and down (its rest side), out, up, and back in the wind-up, then out
        // and forward through the cut, so the forearm stays clear of the head and the vest.
        const POLE_REST: V3 = [SHOULDER[0] + 4 * (ELBOW_L[0] - SHOULDER[0]), SHOULDER[1] + 4 * (ELBOW_L[1] - SHOULDER[1]), SHOULDER[2] + 4 * (ELBOW_L[2] - SHOULDER[2])];
        const pole = keys(p, [[0, POLE_REST], [0.24, [0.6, 0.35, -0.2]], [0.42, [0.6, 0.35, -0.15]], [0.5, [0.5, 0.05, 0.5]], [0.74, [0.45, -0.05, 0.5]], [1, POLE_REST]] as const);
        const arm = reach(ARM_L, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: BLADE_DIR, up: FLAT }, { dir, up });
        const wind = ease(0, 0.28, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.41, 0.54, p) * (1 - ease(0.72, 1, p));
        // The bandana tail lag behind the turn of the body.
        const swing = ease(0.46, 0.64, p) * (1 - ease(0.74, 1, p));
        return {
          // Wind-up: the hips shift back and onto the left (back) foot. Cut: they drive forward.
          hips: { move: [0.012 * wind - 0.01 * cut, -legDrop(LEG, 16 * cut) - 0.006 * wind, 0.035 * cut - 0.012 * wind], rotate: [0, 8 * wind - 18 * cut, 0] },
          spine: { rotate: [-5 * wind + 10 * cut, -6 * cut, 0] },
          chest: { rotate: [-5 * wind + 5 * cut, 14 * wind - 16 * cut, 0] },
          head: { rotate: [-2 * wind + 4 * cut, -8 * wind + 16 * cut, 0] },
          knot: { rotate: [-6 * wind + 14 * swing, 0, 6 * wind - 10 * swing] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          // The empty right arm reaches forward and out for balance, then pulls back.
          'upperarm.R': { rotate: [-18 * wind + 8 * cut, 0, -12 * wind] },
          'forearm.R': { rotate: [-14 * wind, 0, 0] },
          // The right (front) foot is light in the wind-up and steps in on the cut; the left leg
          // takes the weight, then pushes back.
          'leg.R': { rotate: [-6 * wind - 22 * cut, 0, 0] },
          'leg.L': { rotate: [-3 * wind + 12 * cut, 0, 0] },
          'foot.R': { rotate: [6 * wind + 16 * cut, 0, 0] },
          'foot.L': { rotate: [3 * wind - 8 * cut, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The head and the chest snap back and the hips give way: the left foot stays planted and the
    // right foot steps back, then all returns quickly. The cutlass stays in the hand. The
    // the mask tails swing late.
    const { quat, follow, euler } = motion;
    const DEG = Math.PI / 180;
    const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.06; // the back of the boot, behind the ankle's ground point
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    anim('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const flop = keys(p, [[0.08, 0], [0.3, 1], [0.5, -0.45], [0.68, 0.15], [0.85, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, -5 * h] },
          knot: { rotate: [-16 * flop, 0, 8 * flop] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          // The cutlass arm is flung out and up a little; the empty arm follows.
          'upperarm.L': { rotate: [-8 * h, 0, 14 * h] },
          'forearm.L': { rotate: [-10 * h, 0, 0] },
          'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps the chest back, the bandit slumps forward and wobbles, then tips back over his
    // heels as one piece and lands on his back. The chin tucks and the head rolls toward the
    // cutlass, so the back of the skull and the vest rest on the ground. The arms are solved by
    // targets in the chest's rest frame and lie out on the ground. The hand opens in the fall and
    // the cutlass bone carries the cutlass to lie flat beside the left hand. The sack slides off
    // the right shoulder and lands beside him, a moment after the body.
    const LIE = 86; // the hips' final tilt back, degrees
    const LIE_Y = 0.13; // the hips' height when the bandit lies on his back
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0]]; // hips, spine, chest pivots
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const HAND_CHAIN: readonly V3[] = [...TRUNK, SHOULDER, ELBOW_L, WRIST_L];
    const DROP_AT: V3 = [0.4, 0.058, -0.36]; // the grip on the ground, the point toward the feet
    const DROP_TURN = quat(orient([], { dir: BLADE_DIR, up: FLAT }, { dir: norm([0.35, -0.05, 1]), up: [0, 1, 0] }));
    anim('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24); // the fall speeds up to the impact
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const slide = keys(p, [[0.4, 0], [0.64, 1.08], [0.72, 0.97], [0.8, 1]] as const);
        // The stagger: the hips give way backward over planted feet.
        const back = 0.022 * hitB;
        const lean = plant(back);
        // The fall: a rigid tip over the back of the heels, until the hips reach their lying height.
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * clamp01((tilt - 70) / 16); // the legs come down once the hips hold
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        // The wrists: flung back by the blow, slumped, flung out in the fall, then out on the ground.
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.215, 0.26, -0.07], land), lerp(ELBOW_R, [-0.3, 0.3, -0.05], land));
        const standL = add(add(add(WRIST_L, [0.05, 0.04, 0.02], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.04], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.07], land), lerp(ELBOW_L, [0.35, 0.36, -0.1], land));
        // The cutlass: attached to the posed hand until the hand opens, then it drops to the ground.
        const handQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).multiply(quat(armL.upper)).multiply(quat(armL.lower));
        const held = add(follow(HAND_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, [0, 0, 0]], GRIP), hipsMove);
        const drop = keys(p, [[0.44, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = new THREE.Vector3(...add(lerp(held, drop, loose), held, -1)).applyQuaternion(inv);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB + 30 * land, 8 * wob] },
          // The mask tails swing out and lie on the ground beside the head.
          knot: { rotate: [-12 * hitB + 10 * fly, 0, 10 * wob - 90 * land] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          cutlassbone: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: beckon, toss, point
    // Played when the bandit first sees the player. He leans back with the head cocked and beckons
    // twice with the free right hand, the palm up: "come here". Then he tosses the cutlass up out
    // to his left; it turns one full flip (about 0.3 m up, 0.35 s) and drops back into his hand,
    // while his head tilts away from it and watches it. He points the blade straight at the player
    // at chest height for a beat (a short thrust: "you!"), and returns to rest.
    // The hand targets are in world space. Each frame converts them into the chest's rest frame
    // and blends them from the arm's rest; reach solves the arm, and orient turns the hand. In the
    // air the cutlass bone undoes the posed hand and carries the cutlass on its own path: up and a
    // little out, the tip up and back first. The flip turns fast after the throw and slows into
    // the catch, so the blade points down only near the top, above the hand that drops out of its
    // way.
    const chestFrame = (rots: readonly V3[], move: V3) => {
      const q = quat(rots[0]!).multiply(quat(rots[1]!)).multiply(quat(rots[2]!));
      const inv = q.clone().invert();
      const at = follow(TRUNK, rots, TRUNK[2]!);
      const c = TRUNK[2]!;
      return {
        q,
        inv,
        point: (w: V3): V3 => {
          const v = new THREE.Vector3(w[0] - at[0] - move[0], w[1] - at[1] - move[1], w[2] - at[2] - move[2]).applyQuaternion(inv);
          return [v.x + c[0], v.y + c[1], v.z + c[2]];
        },
      };
    };
    const turnV = (q: THREE.Quaternion, v: V3): V3 => {
      const w = new THREE.Vector3(...v).applyQuaternion(q);
      return [w.x, w.y, w.z];
    };
    const mix2 = (a: V3, ca: number, b: V3, cb: number): V3 => [a[0] * ca + b[0] * cb, a[1] * ca + b[1] * cb, a[2] * ca + b[2] * cb];
    const Q_ID = new THREE.Quaternion();
    // The right hand's rest frame: the wrist to the fist center, and the palm (the curled fingers)
    // forward.
    const AXIS_R = norm([-0.007, -0.038, 0.004]);
    const PALM_R: V3 = [0, 0, 1];
    const BECKON_AT: V3 = [-0.215, 0.35, 0.1]; // the right wrist out and forward, the forearm level
    const BECKON_F = norm([-0.5, 0.2, 1]); // the hand points forward and out, a little up
    const BECKON_U = norm(add([0, 1, 0], BECKON_F, -BECKON_F[1])); // the palm up
    const POLE_REST_R: V3 = add(mx(SHOULDER), add(ELBOW_R, mx(SHOULDER), -1), 4);
    const POLE_BECKON: V3 = [-0.4, 0.2, -0.06]; // the elbow down and out
    // The left hand: the cutlass straight ahead, the flat upright, the curved edge down.
    const Q_FWD = quat(orient([], { dir: BLADE_DIR, up: FLAT }, { dir: [0, 0, 1], up: [-1, 0, 0] }));
    const GRIP_OFF: V3 = add(GRIP, WRIST_L, -1);
    const TOSS_AT: V3 = [0.265, 0.325, 0.075]; // the grip out to the left and a little forward
    const RELEASE: V3 = add(TOSS_AT, [0, 0.02, 0.005]); // the flick lets go a little higher
    const POINT_AT: V3 = [0.15, 0.345, 0.17]; // the grip before the chest, the blade at the player
    const POLE_REST_L: V3 = add(SHOULDER, add(ELBOW_L, SHOULDER, -1), 4);
    const POLE_TOSS: V3 = [0.45, 0.2, -0.05];
    const POLE_AIM: V3 = [0.42, 0.15, 0.02];
    const FLY0 = 0.455; // the throw
    const FLY1 = FLY0 + 0.35 / 1.5; // the catch, 0.35 s later
    const FLIP_AXIS = new THREE.Vector3(-1, 0, 0); // the tip goes up and back first
    anim('taunt', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const beck = keys(p, [[0, 0], [0.08, 1], [0.35, 1], [0.44, 0]] as const);
        const curl = keys(p, [[0.08, 0], [0.15, 1], [0.22, 0], [0.29, 1], [0.36, 0]] as const);
        const cock = keys(p, [[0, 0], [0.08, 1], [0.36, 1], [0.45, 0]] as const);
        const ready = keys(p, [[0.33, 0], [0.41, 1], [0.9, 1], [1, 0]] as const);
        const look = keys(p, [[0.38, 0], [0.45, 1], [0.66, 1], [0.74, 0]] as const);
        const aim = keys(p, [[0.7, 0], [0.79, 1], [0.9, 1], [1, 0]] as const);
        // He leans back for the beckon; the chest turns the left shoulder forward for the point.
        const hipsR: V3 = [0, 0, 0];
        const spineR: V3 = [-4 * cock + 2 * aim, 0, 0];
        const chestR: V3 = [-4 * cock, 6 * cock - 12 * aim, 0];
        const frame = chestFrame([hipsR, spineR, chestR], [0, 0, 0]);
        // The right hand: forward with the palm up; it curls up toward him twice.
        const c = (10 + 75 * curl) * DEG;
        const beckonQ = quat(
          orient([], { dir: AXIS_R, up: PALM_R }, { dir: mix2(BECKON_F, Math.cos(c), BECKON_U, Math.sin(c)), up: mix2(BECKON_F, -Math.sin(c), BECKON_U, Math.cos(c)) }),
        );
        const turnR = Q_ID.clone().slerp(frame.inv.clone().multiply(beckonQ), beck);
        const wristR = lerp(WRIST_R, frame.point(add(BECKON_AT, [0, 0.012, -0.015], curl)), beck);
        const armR = reach(ARM_R, wristR, lerp(POLE_REST_R, frame.point(POLE_BECKON), beck));
        const handR = orient([armR.upper, armR.lower], { dir: AXIS_R, up: PALM_R }, { dir: turnV(turnR, AXIS_R), up: turnV(turnR, PALM_R) });
        // The left hand: the cutlass forward out to the left, the wind-up dip and the flick, the
        // drop out of the way, the catch and its give, then the point with a short thrust.
        const gripW = keys(p, [
          [0.41, TOSS_AT],
          [0.435, add(TOSS_AT, [0, -0.04, -0.01])],
          [FLY0, RELEASE],
          [0.565, add(TOSS_AT, [-0.03, -0.08, -0.01])],
          [FLY1, TOSS_AT],
          [FLY1 + 0.022, add(TOSS_AT, [0, -0.03, 0])],
          [0.74, TOSS_AT],
          [0.8, add(POINT_AT, [0, 0, 0.025])],
          [0.84, POINT_AT],
        ] as const);
        const turnL = Q_ID.clone().slerp(frame.inv.clone().multiply(Q_FWD), ready);
        const wristL = add(lerp(GRIP, frame.point(gripW), ready), turnV(turnL, GRIP_OFF), -1);
        const poleL = lerp(POLE_REST_L, frame.point(keys(p, [[0.74, POLE_TOSS], [0.8, POLE_AIM]] as const)), ready);
        const armL = reach(ARM_L, wristL, poleL);
        const handL = orient([armL.upper, armL.lower], { dir: BLADE_DIR, up: FLAT }, { dir: turnV(turnL, BLADE_DIR), up: turnV(turnL, FLAT) });
        // The flight: the grip rises about 0.3 m and a little out, and comes back into the hand.
        let cutMove: V3 = [0, 0, 0];
        let cutRot: V3 = [0, 0, 0];
        if (p > FLY0 && p < FLY1) {
          const u = (p - FLY0) / (FLY1 - FLY0);
          const at = add(lerp(RELEASE, TOSS_AT, u), [0.05, 0.3, 0], 4 * u * (1 - u));
          const flip = 2 * Math.PI * (0.25 * u + 0.75 * (1 - (1 - u) * (1 - u)));
          const handQ = frame.q.clone().multiply(quat(armL.upper)).multiply(quat(armL.lower)).multiply(quat(handL));
          const held = follow(HAND_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, handL], GRIP);
          const inv = handQ.clone().invert();
          const d = new THREE.Vector3(...add(at, held, -1)).applyQuaternion(inv);
          cutMove = [d.x, d.y, d.z];
          cutRot = euler(inv.multiply(new THREE.Quaternion().setFromAxisAngle(FLIP_AXIS, flip)).multiply(Q_FWD));
        }
        return {
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-3 * cock + 3 * aim, 0, 3 * cock + 4 * look] },
          // Cocky: the chin up and the head cocked to his right; then it tilts further away from
          // the flying cutlass and turns to watch it; for the point it faces the player.
          head: { rotate: [-6 * cock - 4 * look + 5 * aim, 8 * look + 10 * aim, 9 * cock + 12 * look] },
          knot: { rotate: [6 * cock + 6 * look, 0, -6 * look] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: handL },
          cutlassbone: { move: cutMove, rotate: cutRot },
        };
      },
    });

  },
});
