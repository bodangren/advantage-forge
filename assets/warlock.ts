import { defineAsset, motion, noise, profile, rgb, mixRgb, sdf } from '../src/index.js';

/**
 * Warlock — Chibi Quest enemy (catalog `enemies/humanoid/warlock`), about 1.0 m tall, faces +Z.
 * Target: docs/enemy-mockups/warlock_001.jpg (one front view). Built on the mage's skeleton and clip
 * set; the mage's book hand holds the grimoire, the other hand wears the claw gauntlet.
 *
 * One idea: a bald, scowling head with a tattoo stripe, huge glowing green eyes and a long black
 *   pointed beard, over a dark green open coat; a grimoire wreathed in green flame and a claw.
 * Shape language: round head and beard, triangular claws, spikes, and coat points.
 * Palette (60/30/10): coat green #3a4a3a and black tunic/trousers #1c1a20; pale skin #f0e0d0;
 *   the green glow (eyes, pendant, flame) is the accent; gold #c9a24a clasps; bone-grey gauntlet.
 * Value plan: the pale head and its dark beard and brows are the focal point; the emissive green
 *   eyes hold the strongest contrast; the dark coat and tunic frame the gold.
 * Rig: the mage's skeleton without the hat and cape (`skirt` for the coat below the belt, knee
 *   `shin` bones), `orb` on the book hand for the flame. The grimoire is rigid on `hand.L`, the
 *   gauntlet on `hand.R` (the right arm hangs at rest).
 *   Clips: idle, walk, run, attack (book raise, flame flare, claw swipe), hit, death, taunt.
 */

const C = {
  skin: '#f0e0d0',
  blush: '#e8a898',
  tattoo: '#3a3a40',
  black: '#1c1a18',
  eyeWhite: '#f4efe6',
  eyeBase: '#104020',
  eyeGlow: '#40e080',
  pupil: '#031208',
  teeth: '#f0ece0',
  mouth: '#48141a',
  coat: '#3a4a3a',
  coatLit: '#4a5e4a',
  coatDark: '#2a362a',
  tunic: '#1c1a20',
  gold: '#c9a24a',
  gaunt: '#b8b0a0',
  gauntDark: '#8a8478',
  cover: '#3a2a22',
  emblem: '#5a4a3a',
  page: '#b8a888',
  flame: '#40ff80',
  flameBase: '#106030',
  boot: '#16141a',
  sole: '#0c0b0e',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.648] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints (the mage's), except the right arm: it hangs, with the claw at the end.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.2, 0.31, -0.004];
const WRIST_R: V3 = [-0.235, 0.235, 0.055];
const ELBOW_L: V3 = [0.198, 0.355, 0.012];
const WRIST_L: V3 = [0.258, 0.35, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

const rad = Math.PI / 180;
const rotY = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

/** The claw gauntlet hangs from the wrist at the origin: a big fist, knuckle spikes, claw tips. */
const handR = (s: sdf.Shape) => s.at(...WRIST_R);
const clawLocal = () => {
  const xs = [-0.026, -0.009, 0.009, 0.026];
  // Four claws curve down and forward from the knuckles.
  const claws = xs.map((x, i) => {
    const t = 1 - Math.abs(i - 1.5) * 0.08;
    return sdf.chain(
      [
        [x, -0.094, 0.022, 0.0105],
        [x, -0.094 - 0.034 * t, 0.032, 0.007],
        [x * 1.05, -0.094 - 0.058 * t, 0.058, 0.002],
      ],
      0.004,
    );
  });
  // Two spikes on the back of the hand (its outer side).
  const spikes = [-0.038, -0.066].map((y) => sdf.cone([-0.026, y, 0.004], [-0.066, y - 0.006, 0.004], 0.012, 0.002));
  return sdf.union(
    sdf.box([0.074, 0.084, 0.06], 0.004).at(0, -0.056, 0),
    sdf.box([0.056, 0.016, 0.022], 0.003).at(0, -0.094, 0.032),
    ...claws,
    ...spikes,
  );
};
const CLAW = { dir: [0, -1, 0] as V3, up: [0, 0, 1] as V3 };

/** The book stands on the open palm, out on the fingers, its cover turned to the front. */
const openHand = sdf.smoothUnion(
  0.012,
  sdf.ellipsoid([0.046, 0.02, 0.04]).at(0.04, 0, 0.004),
  ...[-0.024, -0.008, 0.008, 0.024].map((z, i) =>
    sdf.capsule([0.07, 0.002, z], [0.098 - Math.abs(i - 1.5) * 0.006, 0.016, z * 1.1], 0.0105),
  ),
  sdf.capsule([0.03, 0.006, 0.036], [0.058, 0.022, 0.052], 0.012),
);
const HAND_L_YAW = -40;
const handL = (s: sdf.Shape) => s.rotateY(HAND_L_YAW).at(...WRIST_L);
const BOOK_AT: V3 = add(WRIST_L, rotY([0.085, 0.077, 0.012], HAND_L_YAW));
const bookPose = (s: sdf.Shape) => s.rotateZ(-8).rotateY(-22).at(...BOOK_AT);
const bookPoint = (p: V3): V3 => add(rotY(rotZ(p, -8), -22), BOOK_AT);
const FLAME_AT = bookPoint([0, 0.058, 0.0]);

/** A curling flame at the origin: a tall center tongue and three side tongues that curl out and up. */
const flame = () =>
  sdf.smoothUnion(
    0.02,
    sdf.chain(
      [
        [0, 0, 0, 0.034],
        [0.006, 0.05, 0, 0.022],
        [0.024, 0.1, 0, 0.009],
        [0.05, 0.135, 0, 0.003],
      ],
      0.02,
    ),
    sdf.chain(
      [
        [-0.034, 0.0, 0, 0.02],
        [-0.06, 0.03, 0.004, 0.012],
        [-0.072, 0.07, 0.006, 0.006],
        [-0.062, 0.1, 0.006, 0.0035],
      ],
      0.012,
    ),
    sdf.chain(
      [
        [0.036, 0.0, 0, 0.02],
        [0.062, 0.028, 0, 0.012],
        [0.078, 0.062, 0.004, 0.006],
        [0.092, 0.09, 0.004, 0.0035],
      ],
      0.012,
    ),
    sdf.chain(
      [
        [0.0, 0.004, 0.022, 0.02],
        [0.006, 0.036, 0.046, 0.012],
        [-0.014, 0.072, 0.056, 0.006],
        [-0.03, 0.1, 0.05, 0.0035],
      ],
      0.012,
    ),
  );

export default defineAsset({
  name: 'warlock',
  description: 'Chibi bald warlock enemy with a tattoo stripe, glowing green eyes, a long black beard, an open green coat, a flaming grimoire, and a claw gauntlet.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/warlock_001.jpg',
  variants: {
    coat: { green: C.coat, purple: '#3a2a4a', black: '#1e1c22' },
    flame: { green: C.flame, purple: '#c060ff', orange: '#ff8030' },
    beard: { black: C.black, grey: '#8a8a84', red: '#7a3a22' },
  },
  presets: {
    hexer: { coat: 'purple', flame: 'purple', beard: 'grey' },
    cinder: { coat: 'black', flame: 'orange', beard: 'red' },
    bogwitch: { coat: 'green', flame: 'green', beard: 'black' },
  },

  build(k) {
    const T = {
      coat: k.tint('coat'),
      coatLit: k.tint('coat', { color: C.coatLit, follow: 1 }),
      coatDark: k.tint('coat', { color: C.coatDark, follow: 1 }),
      flame: k.tint('flame'),
      flameBase: k.tint('flame', { color: C.flameBase, follow: 1 }),
      beard: k.tint('beard'),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      skirt: { parent: 'hips', at: [0, 0.25, 0], tail: [0, 0.1, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      orb: { parent: 'hand.L', at: FLAME_AT },
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
    const nose = sdf.sphere(0.016).at(0, 0.564, faceZ(0, 0.564) + 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.044, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      handL(openHand).bone('hand.L'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.042, 0.045, 0.07]), EYE[0], EYE[1]));
    const eyeRim = pair(at(sdf.ellipsoid([0.0455, 0.049, 0.07]), EYE[0], EYE[1]));
    // The tattoo: a jagged tapered stripe from the crown to the brow, through the skull top.
    const stripe = sdf
      .extrude(
        profile.polygon([
          [-0.0405, 0.9],
          [-0.0324, 0.87],
          [-0.0419, 0.848],
          [-0.0243, 0.826],
          [-0.0324, 0.804],
          [-0.0108, 0.782],
          [0, 0.752],
          [0.0108, 0.782],
          [0.0324, 0.804],
          [0.0243, 0.826],
          [0.0419, 0.848],
          [0.0324, 0.87],
          [0.0405, 0.9],
        ]),
        0.3,
      )
      .at(0, 0, 0.1);
    // A sneer with a strip of teeth, below the moustache.
    const MOUTH_Y = 0.493;
    const mouth = sdf.ellipsoid([0.031, 0.0135, 0.12]).rotateZ(11).at(0, MOUTH_Y, 0.16);
    const teeth = sdf.ellipsoid([0.019, 0.0065, 0.12]).rotateZ(11).at(0.002, MOUTH_Y + 0.006, 0.16);
    const blush = pair(at(sdf.sphere(0.03), 0.15, 0.585));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armR, armL)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(sdf.sphere(0.02).at(0, 0.562, faceZ(0, 0.562) + 0.004), '#eab8a4', 0.008)
      .paintWhere(eyeRim, C.black)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(stripe, C.tattoo)
      .paintWhere(mouth, C.mouth)
      .paintWhere(teeth, C.teeth);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // Big glowing eyes: a green lens on the eye white, a dark pupil, a white shine.
    const lens = (rx: number, ry: number, lift: number) =>
      pair(at(sdf.ellipsoid([rx, ry, 0.07]), EYE[0], EYE[1] - 0.003)).intersect(head.round(lift));
    k.body('eyes', lens(0.035, 0.039, 0.008), {
      color: C.eyeBase,
      emissive: C.eyeGlow,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      detail: 0.003,
      bone: 'head',
    });
    k.body('pupils', lens(0.016, 0.021, 0.011), { color: C.pupil, roughness: 0.3, detail: 0.003, bone: 'head' });
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].map((x) => sdf.sphere(0.008).at(x + 0.015, EYE[1] + 0.014, faceZ(Math.abs(x) + (x > 0 ? 0.015 : -0.015), EYE[1] + 0.014) + 0.005)),
    );
    k.body('shine', shine, { color: '#ffffff', roughness: 0.2, detail: 0.003, bone: 'head' });
    // Heavy upper lids: skin over the top third of each eye, sloped down toward the nose (a glare).
    const lids = pair(at(sdf.ellipsoid([0.047, 0.022, 0.07]).rotateZ(17), EYE[0] + 0.002, EYE[1] + 0.031)).intersect(head.round(0.0115));
    k.body('lids', lids, { color: C.skin, roughness: 0.55, detail: 0.003, bone: 'head' });

    // ------------------------------------------------------------------ brows, beard, moustache
    const browPts = (s: 1 | -1): [number, number, number, number][] =>
      (
        [
          [0.018, 0.708, 0.015],
          [0.064, 0.723, 0.017],
          [0.11, 0.74, 0.015],
          [0.152, 0.742, 0.01],
        ] as const
      ).map(([x, y, r]) => [x * s, y, faceZ(x, y) + 0.005, r]);
    const brows = sdf.union(sdf.chain(browPts(1), 0.012), sdf.chain(browPts(-1), 0.012));
    const mPts = (s: 1 | -1): [number, number, number, number][] =>
      (
        [
          [0.004, 0.538, 0.016],
          [0.03, 0.528, 0.015],
          [0.064, 0.538, 0.012],
          [0.09, 0.562, 0.008],
          [0.097, 0.59, 0.0045],
        ] as const
      ).map(([x, y, r]) => [x * s, y, faceZ(x, y) + 0.016, r]);
    const moustache = sdf.union(sdf.chain(mPts(1), 0.008), sdf.chain(mPts(-1), 0.008));
    const strands = (x: number, y: number, z: number) => 0.0016 * Math.sin(x * 300 + noise.fbm(x * 25, y * 18, z * 25, 2) * 2.5) + 0.0006 * noise.fbm(x * 120, y * 120, z * 120, 2);
    k.body('moustache', moustache, { color: T.beard, roughness: 0.75, detail: 0.003, bone: 'head', bump: strands });
    // The beard follows the jaw from ear to ear (a shell of the head inside a bowl), with a long
    // point that curves forward from the chin.
    const bowl = sdf.ellipsoid([0.3, 0.16, 0.3]).at(0, 0.485, 0);
    const faceCut = sdf.ellipsoid([0.158, 0.105, 0.12]).at(0, 0.652, 0.17);
    const jaw = head
      .round(0.013)
      .intersect(bowl)
      .intersect(sdf.halfSpace([0, 0, -1], 0.02))
      .subtract(faceCut);
    const point = sdf.chain(
      [
        [0, 0.455, 0.112, 0.05],
        [0, 0.41, 0.124, 0.036],
        [0, 0.36, 0.14, 0.022],
        [0, 0.315, 0.16, 0.01],
      ],
      0.03,
    );
    const mouthCut = sdf.ellipsoid([0.034, 0.017, 0.06]).rotateZ(11).at(0, MOUTH_Y, 0.15);
    const beard = sdf.smoothUnion(0.02, jaw, point).subtract(mouthCut).smoothUnion(0.008, brows);
    k.body('beard', beard, { color: T.beard, roughness: 0.75, detail: 0.004, bone: 'head', bump: strands });

    // ------------------------------------------------------------------ coat, tunic, collar
    const robeShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.126, 0.29],
            [0.134, 0.25],
            [0.158, 0.2],
            [0.186, 0.15],
            [0.21, 0.118],
            [0.2, 0.106],
            [0, 0.106],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const above = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, -1, 0], -y));
    const below = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, 1, 0], y));
    // The coat is a thin shell, open at the front (a wedge that widens to the hem), with a slit up the back.
    const gapHalf = (y: number) => 0.03 + Math.max(0, 0.47 - y) * 0.055;
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.03, 0.62],
          [0.03, 0.62],
          [0.0505, 0.1],
          [-0.0505, 0.1],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const backSlit = sdf.box([0.05, 0.16, 0.24], 0.01).at(0, 0.17, -0.14);
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 7) * Math.min(1, Math.max(0, (0.3 - y) / 0.18));
    const coatShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.128, 0.29],
            [0.142, 0.25],
            [0.172, 0.2],
            [0.212, 0.15],
            [0.245, 0.118],
            [0.235, 0.106],
            [0, 0.106],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const coatRaw = coatShape
      .subtract(coatShape.round(-0.016))
      .subtract(sdf.box([0.6, 0.06, 0.6]).at(0, 0.06, 0))
      .subtract(opening, backSlit)
      .displace(0.006, folds);
    const lit = rgb(T.coatLit);
    const dark = rgb(T.coatDark);
    const coat = coatRaw.paintFn((x, y, z, base) => {
      const f = Math.sin(Math.atan2(z, x) * 7 + y * 4) * 0.5 + noise.fbm(x * 9, y * 9, z * 9, 2) * 0.35;
      const edge = Math.abs(Math.abs(x) - gapHalf(y)) < 0.014 && z > 0 ? 0.4 : 0;
      if (f > 0.35) return mixRgb(base, lit, Math.min(1, (f - 0.35) * 2.5));
      if (f < -0.3 && y < 0.33) return mixRgb(base, dark, Math.min(1, (-0.3 - f) * 2.5 + edge));
      return edge > 0 ? mixRgb(base, dark, 0.5) : base;
    });
    k.body('coat', sdf.union(above(coat, 0.25).bone('spine'), below(coat, 0.25).bone('skirt')), { color: T.coat, roughness: 0.7, bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 30, z * 70, 2) });

    const tunicShape = robeShape.round(-0.012);
    const tunic = sdf.union(above(tunicShape, 0.25).bone('spine'), above(below(tunicShape, 0.25), 0.15).bone('skirt'));
    const sleeve = (s: V3, e: V3, w: V3, tagU: string, tagF: string) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.048, 0.046).bone(tagU),
        sdf.cone(e, lerp(e, w, 0.78), 0.046, 0.054).bone(tagF),
      );
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], KNEE, 0.045).bone('leg.L')),
      pair(sdf.capsule(KNEE, [0.097, 0.08, 0.002], 0.043).bone('shin.L')),
    );
    k.body('tunic', sdf.union(tunic, sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'), legs), {
      color: C.tunic,
      roughness: 0.8,
    });

    // The standing collar: a flared ring around the neck, open at the front, dark inside.
    const collarProfile = (top: number, rTop: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0.098, 0.422],
            [0.124, 0.422],
            [rTop, top],
            [rTop - 0.028, top],
          ]),
        )
        .scale([1, 1, 0.9])
        .round(0.004);
    // Low all around, and taller and flared behind the head.
    const collarRing = sdf
      .union(collarProfile(0.48, 0.146), collarProfile(0.53, 0.168).intersect(sdf.halfSpace([0, 0, 1], -0.005)))
      .subtract(sdf.box([0.13, 0.2, 0.2]).at(0, 0.45, 0.16));
    const collarDark = rgb(T.coatDark);
    const collar = collarRing.paintFn((x, y, z, base) => {
      const r = Math.hypot(x, z / 0.9);
      const rMid = 0.108 + ((y - 0.422) / 0.058) * 0.03;
      return r < rMid - 0.001 ? collarDark : base;
    });
    k.body('collar', collar.bone('chest'), { color: T.coat, roughness: 0.7, detail: 0.004 });
    // Shoulder flaps of coat cloth, each with a gold clasp.
    const flapPose = (s: sdf.Shape) => s.rotateZ(-22).at(0.116, 0.442, 0);
    const flapShape = flapPose(sdf.box([0.08, 0.03, 0.06], 0.008));
    k.body('flaps', hard(flapShape).bone('chest'), { color: T.coat, roughness: 0.7, detail: 0.004 });
    const flapClasp = flapPose(sdf.box([0.018, 0.012, 0.016], 0.003).at(0.012, 0.016, 0.0));

    // ------------------------------------------------------------------ belt, buckle, chain, clasps, pendant
    const beltY = 0.255;
    const belt = robeShape.round(-0.006).smoothIntersect(0.006, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.tunic, roughness: 0.5 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf.box([0.04, 0.036, 0.013], 0.004).subtract(sdf.box([0.022, 0.02, 0.06])).at(0, beltY, beltZ + 0.003);
    const bar = sdf.box([0.006, 0.02, 0.012], 0.002).at(0, beltY, beltZ + 0.004);
    const clasp = (x: number, y: number) => {
      const z = sdf.raycast(coatRaw, [x, y, 1], [0, 0, -1]);
      const zz = z ? z[2] : 0.1;
      return sdf.box([0.021, 0.018, 0.013], 0.003).rotateY((Math.atan2(x, zz) * 180) / Math.PI).at(x, y, zz + 0.002);
    };
    const clasps = [0.425, 0.37, 0.315, 0.2, 0.15, 0.125].flatMap((y) => [clasp(gapHalf(y) + 0.014, y), clasp(-gapHalf(y) - 0.014, y)]);
    k.body('gold', sdf.union(sdf.union(buckle, bar, ...clasps).bone('spine'), hard(flapClasp).bone('chest')), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.004 });
    const tunicZ = (y: number) => sdf.raycast(tunicShape, [0, y, 1], [0, 0, -1])![2];
    const links = [0.222, 0.21, 0.198, 0.186, 0.174, 0.162].map((y, i) => {
      const link = sdf.torus(0.0068, 0.003).rotateX(90).scale([1, 1.35, 1]);
      return (i % 2 ? link.rotateY(90) : link).at(0, y, tunicZ(y) + 0.008);
    });
    const ring = sdf.torus(0.014, 0.0045).rotateX(90).at(0, 0.138, tunicZ(0.138) + 0.008);
    k.body('chain', sdf.union(...links, ring).bone('skirt'), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.0025 });
    const pendantY = 0.29;
    const pendantZ = tunicZ(pendantY) + 0.006;
    const pendant = sdf.chain(
      [
        [0, pendantY + 0.016, pendantZ, 0.011],
        [0, pendantY, pendantZ, 0.012],
        [0, pendantY - 0.02, pendantZ, 0.003],
      ],
      0.01,
    );
    k.body('pendant', pendant.bone('chest'), {
      color: C.eyeBase,
      emissive: C.eyeGlow,
      emissiveIntensity: 1.4,
      roughness: 0.3,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ boots
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.085, 0.02).at(0, 0.065, 0),
        sdf.ellipsoid([0.058, 0.052, 0.1]).at(0, 0.05, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf
      .union(bootFoot, sdf.cylinder(0.058, 0.03, 0.01).at(0, 0.102, 0))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.35 });

    // ------------------------------------------------------------------ claw gauntlet (right hand)
    const claw = handR(clawLocal()).bone('hand.R');
    const cuff = sdf
      .union(
        sdf.cone(lerp(ELBOW_R, WRIST_R, 0.84), lerp(ELBOW_R, WRIST_R, 1.02), 0.06, 0.062).round(0.003),
      )
      .bone('forearm.R');
    const grooves = handR(
      sdf.union(
        ...[-0.03, -0.045, -0.06, -0.072].map((y) => sdf.box([0.2, 0.003, 0.3], 0).at(0, y, 0)),
        ...[-0.016, 0, 0.016].map((x) => sdf.box([0.0025, 0.03, 0.3]).at(x, -0.04, 0)),
      ),
    );
    const gauntlet = sdf.union(claw, cuff).paintWhere(grooves, C.gauntDark, 0.002);
    k.body('gauntlet', gauntlet, {
      color: C.gaunt,
      roughness: 0.6,
      metalness: 0.15,
      detail: 0.004,
      bump: (x, y, z) => -0.0014 * Math.max(0, Math.sin(y * 240) - 0.6) + 0.0008 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ the grimoire and its flame
    const cover = sdf.box([0.1, 0.13, 0.04], 0.005);
    const bookShape = cover.paintWhere(sdf.box([0.1, 0.16, 0.028]).at(0.01, 0, 0), C.page);
    k.body('book', bookPose(bookShape), { color: C.cover, roughness: 0.65, detail: 0.003, bone: 'hand.L' });
    const emblem = sdf
      .smoothUnion(
        0.004,
        sdf.ellipsoid([0.026, 0.034, 0.008]).at(0, -0.006, 0.02),
        sdf.chain(
          [
            [0, 0.03, 0.02, 0.006],
            [0, 0.02, 0.022, 0.008],
          ],
          0.004,
        ),
      )
      .subtract(hard(sdf.ellipsoid([0.006, 0.004, 0.01]).at(0.011, 0.002, 0.03)))
      .subtract(sdf.box([0.024, 0.005, 0.02]).at(0, -0.02, 0.03));
    k.body('book-emblem', bookPose(emblem), { color: C.emblem, roughness: 0.6, detail: 0.003, bone: 'hand.L' });
    const corners = sdf.union(sdf.box([0.032, 0.032, 0.06]).at(0.05, 0.065, 0), sdf.box([0.032, 0.032, 0.06]).at(0.05, -0.065, 0)).mirror('x', 0);
    const bookGold = sdf.union(cover.round(0.0025).intersect(corners), sdf.box([0.024, 0.018, 0.048], 0.003).at(0.05, 0, 0));
    k.body('book-gold', bookPose(bookGold), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'hand.L' });
    const flameShape = flame()
      .rotateZ(-10)
      .displace(0.008, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2))
      .at(...FLAME_AT);
    k.body('flame', flameShape, {
      color: T.flameBase,
      emissive: T.flame,
      emissiveIntensity: 1.6,
      opacity: 0.8,
      roughness: 0.4,
      detail: 0.0035,
      bone: 'orb',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, quat } = motion;
    void quat;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const flicker = (p: number) => ({
      orb: { scale: [1 + 0.07 * wave(p, 7), 1 + 0.12 * wave(p, 5, 0.2), 1 + 0.07 * wave(p, 7, 0.4)] as const },
    });

    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const PALM = { dir: rotY([1, 0, 0], HAND_L_YAW), up: [0, 1, 0] as V3 };
    const clawPose = (wrist: V3, dir: V3 = CLAW.dir, up: V3 = CLAW.up, pole: V3 = [-0.5, 0.1, -0.4]) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], CLAW, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    const palmPose = (wrist: V3, dir: V3, up: V3, pole: V3 = [0.5, 0.1, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      const hand = orient([arm.upper, arm.lower], PALM, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        ...flicker(p),
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        skirt: { rotate: [1.5 * wave(p, 1, 0.2), 0, 0] },
        'forearm.L': { rotate: [-3 * bump(p), 0, 0] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * wave(p, 1, 0.3)] },
        'hand.R': { rotate: [4 * wave(p, 1, 0.5), 0, 0] },
      }),
    });

    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, armSwing: number, lean: number, flow: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          heel: [0.094, 0, -0.015],
          toe: [0.111, 0, 0.093],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...flicker(p),
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          skirt: { rotate: [flow * 0.25 + 3 * wave(p, 2, 0.1), -9 * wave(p, 1, 0.12), 4 * wave(p, 1, 0.3)] as const },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.3 * s, 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.2 * (1 + s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.6, 0.006, 28, 3, 6));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.4, 0.025, 50, 12, 22));

    // attack: the book comes up in front and the flame flares; the claw draws back, then swipes across.
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const gather = ease(0.02, 0.3, p) * (1 - ease(0.42, 0.5, p));
        const cast = ease(0.42, 0.52, p) * (1 - ease(0.72, 1, p));
        const raise = ease(0.02, 0.32, p) * (1 - ease(0.78, 1, p));
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.3, [-0.3, 0.37, -0.03]],
            [0.4, [-0.31, 0.38, -0.04]],
            [0.47, [-0.2, 0.36, 0.13]],
            [0.53, [-0.13, 0.27, 0.24]],
            [0.66, [-0.14, 0.27, 0.24]],
            [0.85, [-0.18, 0.28, 0.12]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, CLAW.dir],
            [0.3, norm([-0.2, -0.5, -0.8])],
            [0.4, norm([-0.2, -0.5, -0.8])],
            [0.47, norm([0.2, -0.5, 0.8])],
            [0.53, norm([0.45, -0.45, 0.75])],
            [0.66, norm([0.4, -0.5, 0.75])],
            [0.85, norm([0, -0.9, 0.3])],
            [1, CLAW.dir],
          ] as const,
          'spline',
        );
        const flare = keys(p, [[0, 1], [0.3, 1.25], [0.44, 1.3], [0.5, 2.2], [0.58, 2.4], [0.72, 1.6], [0.92, 1]] as const);
        return {
          ...clawPose(wrist, dir),
          ...palmPose(lerp(WRIST_L, [0.26, 0.4, 0.14], raise), lerp(PALM.dir, norm([0.97, 0.1, 0.22]), raise), PALM.up),
          orb: { scale: [flare, flare, flare] },
          hips: {
            move: [0, -legDrop(LEG, 12 * cast) - 0.004 * cast, 0.02 * cast - 0.008 * gather],
            rotate: [0, -10 * gather + 8 * cast, 0],
          },
          skirt: { rotate: [-3 * gather + 6 * cast, 6 * gather - 6 * cast, 0] },
          spine: { rotate: [-4 * gather + 8 * cast, 0, 0] },
          chest: { rotate: [-3 * gather + 5 * cast, -12 * gather + 12 * cast, 0] },
          head: { rotate: [3 * gather - 6 * cast, 10 * gather - 10 * cast, 0] },
          'leg.L': { rotate: [2 * gather - 14 * cast, 0, 0] },
          'leg.R': { rotate: [-2 * gather + 9 * cast, 0, 0] },
          'foot.L': { rotate: [9 * cast, 0, 0] },
          'foot.R': { rotate: [-4 * cast, 0, 0] },
        };
      },
    });

    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        const f = 1 - 0.4 * h;
        return {
          ...clawPose(lerp(WRIST_R, [-0.28, 0.27, 0.0], h), norm([-0.3, -0.8, -0.2])),
          orb: { scale: [f, f, f] },
          hips: { move: [0, -0.005 * h, -0.025 * h], rotate: [0, -6 * h, 0] },
          skirt: { rotate: [6 * h, 0, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, -6 * h, 3 * h] },
          head: { rotate: [-14 * h, 8 * h, -5 * h] },
          'upperarm.L': { rotate: [-8 * h, 0, 10 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger, then he falls flat on his back; the flame goes out. The hips drop below the
    // floor on purpose: the build lifts the body until it rests on the floor.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.16)));
        const out = 1 - 0.95 * ease(0.3, 0.6, p);
        const drop = ease(0.45, 0.72, p);
        const leg = 30 * bump(fall) + 6 * fall;
        const hipsMove: V3 = [0, -0.14 * drop + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall];
        const bend = [-76 * fall - 4 * stagger, -6 * stagger, -4 * stagger, -5 * fall, -16 * stagger - 14 * fall];
        return {
          ...clawPose(
            keys(p, [[0, WRIST_R], [0.3, [-0.28, 0.3, 0.06]], [0.66, [-0.3, 0.3, 0.0]]] as const),
            keys(p, [[0, CLAW.dir], [0.3, norm([-0.5, -0.4, 0.5])], [0.66, norm([-1, -0.15, 0.1])]] as const),
            CLAW.up,
            [-0.3, 0.2, -0.4],
          ),
          ...palmPose(lerp(WRIST_L, [0.26, 0.34, -0.09], ease(0.2, 0.66, p)), PALM.dir, lerp(PALM.up, [0, 0.3, 1], ease(0.2, 0.62, p)), [0.3, 0.2, -0.4]),
          orb: { scale: [out, out, out] },
          hips: { move: hipsMove, rotate: [bend[0]!, 0, 0] },
          skirt: { rotate: [8 * stagger + leg - 20 * fall, 0, 0] },
          spine: { rotate: [bend[1]!, 0, 0] },
          chest: { rotate: [bend[2]!, 0, 0] },
          neck: { rotate: [bend[3]!, 0, 0] },
          head: { rotate: [bend[4]!, 0, 0] },
          'leg.L': { rotate: [6 * stagger + leg, 0, 4 * fall] },
          'leg.R': { rotate: [-6 * stagger + leg + 2 * fall, 0, -5 * fall] },
          'foot.L': { rotate: [-14 * fall, 0, 0] },
          'foot.R': { rotate: [-18 * fall, 0, 0] },
        };
      },
    });

    // taunt: he leans back and beckons twice with the claw while the book lifts and the flame flares.
    k.animation('taunt', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const on = ease(0.05, 0.25, p) * (1 - ease(0.85, 1, p));
        const beckon = 0.5 + 0.5 * wave(p * 2, 1.5, 0.75);
        const wrist = lerp(WRIST_R, add([-0.17, 0.33, 0.2], [0, 0.03 * beckon, 0.03 * beckon]), on);
        const dir = lerp(CLAW.dir, norm([0.2, -0.3 - 0.4 * beckon, 0.85]), on);
        const flare = 1 + 0.9 * bump(Math.min(1, Math.max(0, (p - 0.3) / 0.4))) * on + 0.25 * on;
        return {
          ...clawPose(wrist, norm(dir)),
          ...palmPose(lerp(WRIST_L, [0.24, 0.42, 0.16], on), lerp(PALM.dir, norm([0.92, 0.15, 0.36]), on), PALM.up),
          orb: { scale: [flare, flare, flare] },
          spine: { rotate: [-6 * on, 0, 0] },
          chest: { rotate: [-4 * on + 2 * wave(p * 2), 6 * on, 0] },
          head: { rotate: [-8 * on + 3 * beckon * on, -8 * on, 5 * on] },
          skirt: { rotate: [3 * on, 0, 0] },
        };
      },
    });
  },
});
