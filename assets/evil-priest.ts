import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Evil priest — Chibi Quest enemy (catalog `enemies/humanoid/evil-priest`), about 1.05 m tall to the
 * top of the hat, faces +Z. Target: docs/enemy-mockups/evil-priest_001.jpg (the ears are small round
 * human ears, not pointed). Built on assets/priest.ts: the chibi skeleton with knee bones, the robe
 * and sleeves, the staff in `hand.R`; the book and the holy items are gone, the left hand is open.
 *
 * Role: enemy in 3D and as a 128 px sprite: the tall black hat, the grey hair, the grin, the purple
 *   stole, the chain, and the purple flame must read.
 * One idea: a grinning old priest in black with a tall flat-topped hat and a long purple stole,
 *   leaning on a gnarled black crozier whose knob burns with purple flame.
 * Shape language: round head and cassock, a hard flat hat, a hooked nose, thorny staff head.
 * Palette (60/30/10): black #1c1a1e (hat, cassock, shoes, staff); grey hair #8a8a88 and pale skin
 *   #f0d8c0; purple stole #5a3a6a; the purple flame #c060ff and the hat symbol #9a3ab0 are the accent;
 *   gold #c9a24a symbols; iron chain and medallion #3a3a40.
 * Value plan: the pale grinning face and the grey hair are the focal point between the black hat and
 *   the black collar; the purple stole and the flame are the second contrast.
 * Rig: the priest's skeleton without the book bone; `ember` on the staff head scales the flame.
 *   Clips: idle, walk, run, attack (staff raise, flame flare), hit, death, taunt.
 */

const C = {
  skin: '#f0d8c0',
  wrinkle: '#d8b8a0',
  blush: '#e8a898',
  eyeDark: '#161116',
  eyeRing: '#33283a',
  pupil: '#060406',
  brow: '#3a3a3a',
  teeth: '#fffaf0',
  mouth: '#3a0e16',
  hair: '#8a8a88',
  hairLit: '#a8a8a4',
  hat: '#1c1a1e',
  hatLit: '#2e2a30',
  symbol: '#9a3ab0',
  robe: '#1c1a1e',
  collar: '#2e2a30',
  rope: '#3a3634',
  stole: '#5a3a6a',
  gold: '#c9a24a',
  iron: '#3a3a40',
  staff: '#16141a',
  knob: '#1c1a1e',
  flame: '#c060ff',
  flameBase: '#3a1050',
  shoe: '#16141a',
  sole: '#0c0b0e',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.62] as const;
const pair = (s: sdf.Shape) => s.mirror('x');

// Joints: the priest's, except the left arm: it hangs, with the open hand at the end.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.322, -0.01];
const WRIST_R: V3 = [-0.225, 0.248, 0.068];
const ELBOW_L: V3 = [0.2, 0.31, -0.004];
const WRIST_L: V3 = [0.235, 0.235, 0.055];
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
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const rad = Math.PI / 180;
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

/** A small fist hanging from the wrist at the origin; its grip hole runs along Z. */
const FIST = 0.86;
const fistLocal = (s: 1 | -1) =>
  sdf
    .smoothUnion(
      0.018,
      sdf.ellipsoid([0.043, 0.048, 0.05]).at(0.008 * s, -0.042, 0.004),
      sdf.capsule([-0.01 * s, -0.064, 0.034], [-0.006 * s, -0.042, 0.048], 0.019),
      sdf.cone([0.023 * s, -0.026, 0.028], [0.001 * s, -0.037, 0.054], 0.018, 0.014),
    )
    .scale(FIST);
/** The open left hand hanging from the wrist: the palm faces +Z, the fingers curl a little toward it. */
const openHand = () =>
  sdf.smoothUnion(
    0.01,
    sdf.ellipsoid([0.03, 0.037, 0.016]).at(0, -0.04, 0),
    ...[-0.021, -0.007, 0.007, 0.021].map((x, i) => {
      const len = i === 1 || i === 2 ? 0.118 : 0.108;
      return sdf.cone([x, -0.058, 0.002], [x * 1.25, -len, 0.02 + (i % 2) * 0.004], 0.0095, 0.0075);
    }),
    sdf.cone([0.024, -0.03, 0.008], [0.046, -0.066, 0.03], 0.0105, 0.0082),
  );
const HAND_R = { pitch: -86, roll: 15 };
const HAND_L = { yaw: -40 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);
const GRIP = handPoint(HAND_R, WRIST_R, [-0.008 * FIST, -0.044 * FIST, 0.004 * FIST]);
const STAFF_AXIS = norm(rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll));
const STAFF_FACE = norm(rotZ(rotX([0, 0, 1], 90 + HAND_R.pitch), HAND_R.roll));

// The crozier: the butt orb near the ground, the grip in the fist, the knob 1.0 m above the floor.
const STAFF_DOWN = (GRIP[1] - 0.06) / STAFF_AXIS[1];
const STAFF_TOP = (0.8 - GRIP[1]) / STAFF_AXIS[1]; // the knob's center, along the staff from the grip
const staffAt = (t: number): V3 => add(GRIP, [STAFF_AXIS[0] * t, STAFF_AXIS[1] * t, STAFF_AXIS[2] * t]);
const KNOB_AT = staffAt(STAFF_TOP);

export default defineAsset({
  name: 'evil-priest',
  description: 'Chibi evil priest enemy: a tall black hat, grey slicked hair, a cruel grin, a purple stole, and a crozier with a purple flame.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/evil-priest_001.jpg',
  variants: {
    stole: { purple: C.stole, red: '#7a2a2a', green: '#2a5a3a' },
    flame: { purple: C.flame, green: '#40e080', blue: '#4080ff' },
    hair: { grey: C.hair, black: '#24201c', white: '#d8d4c8' },
  },
  presets: {
    inquisitor: { stole: 'purple', flame: 'purple', hair: 'grey' },
    bloodpriest: { stole: 'red', flame: 'green', hair: 'black' },
    plaguepriest: { stole: 'green', flame: 'blue', hair: 'white' },
  },

  build(k) {
    const T = {
      hair: k.tint('hair'),
      hairLit: k.tint('hair', 0.22),
      stole: k.tint('stole'),
      stoleLit: k.tint('stole', 0.25),
      stoleDark: k.tint('stole', -0.3),
      flame: k.tint('flame'),
      flameBase: k.tint('flame', { color: C.flameBase, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      skirt: { parent: 'hips', at: [0, 0.24, 0], tail: [0, 0.08, 0] },
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
      ember: { parent: 'hand.R', at: KNOB_AT },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face
    // The grin, defined first: the lips are cut into the face and the teeth stand proud inside the cut.
    const GR = 0.1;
    const GY = 0.612; // the arc's center: the grin bottoms out at 0.512
    const mouthBand = sdf.extrude(profile.arc(GR, 0.044, 228, 312), 0.3).at(0, GY, 0.1);
    const teeth = sdf.extrude(profile.arc(GR - 0.005, 0.03, 233, 307), 0.3).at(0, GY, 0.1);
    // A gaunt face: the jaw is 8 percent narrower, two shallow hollows under the cheekbones.
    const skull = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
      pair(sdf.sphere(0.1).at(0.088, 0.575, 0.072)), // round cheeks
      sdf.ellipsoid([0.101, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
    );
    const boneZ = sdf.raycast(skull, [0.112, 0.6, 1], [0, 0, -1])![2];
    const carved = skull
      .smoothSubtract(0.025, pair(sdf.sphere(0.05).at(0.135, 0.535, 0.178)))
      .smoothUnion(0.018, pair(sdf.ellipsoid([0.034, 0.02, 0.032]).at(0.112, 0.6, boneZ - 0.008)));
    const head = carved
      .smoothSubtract(0.003, mouthBand.subtract(carved.round(-0.005)))
      .union(teeth.intersect(carved.round(0.003)))
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(carved, [x, y, 1], [0, 0, -1])![2];
    // A hooked nose: a high bridge, a tip that pushes forward, and a hook that turns down and back.
    const nosePt = (y: number, lift: number, r: number): [number, number, number, number] => [0, y, faceZ(0, y) + lift, r];
    const nose = sdf
      .smoothUnion(
        0.012,
        sdf.chain([nosePt(0.64, -0.004, 0.013), nosePt(0.605, 0.012, 0.016), nosePt(0.572, 0.033, 0.02), nosePt(0.552, 0.03, 0.017)], 0.02),
        pair(sdf.sphere(0.0125).at(0.017, 0.556, faceZ(0.017, 0.556) + 0.014)),
      )
      .bone('head');
    // Small round human ears that stand out from the head.
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.066, 0.05])
        .subtract(sdf.sphere(0.026).at(0.02, 0, 0.012))
        .rotateY(-40)
        .at(0.214, 0.6, -0.012)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    // The heavy brow: one thick bar each, tilted 20 degrees down toward the nose.
    const browChain = (s: 1 | -1, lift: number, r: number) => {
      const pt = (x: number, y: number, k: number): [number, number, number, number] => [s * x, y, faceZ(x, y) + lift, r * k];
      return sdf.chain([pt(0.034, 0.688, 1.0), pt(0.092, 0.709, 1.0), pt(0.15, 0.73, 0.82)], 0.01);
    };

    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(lerp(mx(SHOULDER), ELBOW_R, 0.35), ELBOW_R, 0.034, 0.032).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.034, 0.03).bone('forearm.R'),
      handPose(HAND_R, WRIST_R)(fistLocal(-1)).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(lerp(SHOULDER, ELBOW_L, 0.35), ELBOW_L, 0.034, 0.032).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.034, 0.03).bone('forearm.L'),
      openHand().rotateY(HAND_L.yaw).at(...WRIST_L).bone('hand.L'),
    );

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    // Angry lids: the eye is cut by a line that runs low at the inner end (15 degrees).
    const LID = Math.tan(15 * rad);
    const lidCut = (yCut: number) => {
      const l = Math.hypot(LID, 1);
      return sdf.halfSpace([-LID / l, 1 / l, 0], (yCut - LID * EYE[0]) / l);
    };
    const eyeBall = pair(at(sdf.ellipsoid([0.053, 0.058, 0.07]), EYE[0], EYE[1]).intersect(lidCut(EYE[1] + 0.03)));
    const eyeRing = pair(at(sdf.ellipsoid([0.043, 0.049, 0.07]), EYE[0], EYE[1] - 0.004).intersect(lidCut(EYE[1] + 0.026)));
    const pupil = pair(at(sdf.ellipsoid([0.032, 0.037, 0.07]), EYE[0], EYE[1] - 0.006).intersect(lidCut(EYE[1] + 0.022)));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.0125), x + 0.017, EYE[1] + 0.012),
        at(sdf.sphere(0.006), x - 0.015, EYE[1] - 0.026),
      ]),
    );
    // Tooth gaps: thin dark lines across the teeth strip.
    const gaps = sdf.union(
      ...[246, 258, 270, 282, 294].map((a) =>
        sdf.box([0.0024, 0.034, 0.3]).rotateZ(a - 270).at((GR - 0.005) * Math.cos(a * rad), GY + (GR - 0.005) * Math.sin(a * rad), 0.1),
      ),
    );
    // Wrinkles: three forehead strokes and one grin crease on each cheek, painted darker; the
    // forehead strokes also get a shallow bump groove.
    const FORE: readonly (readonly [number, number])[] = [[0.745, 24], [0.758, 20], [0.771, 16]];
    const foreheadLine = (y: number, w: number) => sdf.extrude(profile.arc(0.16, 0.0048, 90 - w, 90 + w), 0.3).at(0, y - 0.16, 0.1);
    const crease = pair(sdf.extrude(profile.arc(GR + 0.02, 0.0048, 312, 327), 0.3).at(0, GY, 0.1));
    const wrinkles = sdf.union(...FORE.map(([y, w]) => foreheadLine(y, w)), crease);
    const foreheadGroove = (x: number, y: number, z: number) => {
      if (z < 0.05 || y < 0.72 || y > 0.8) return 0;
      let g = 0;
      for (const [yl, w] of FORE) {
        const half = 0.16 * Math.sin(w * rad);
        if (Math.abs(x) > half) continue;
        const yc = yl - 0.16 + Math.sqrt(0.0256 - x * x);
        g += Math.exp(-(((y - yc) / 0.0028) ** 2));
      }
      return -0.0014 * g;
    };

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .smoothUnion(0.02, browChain(1, -0.006, 0.019).bone('head'), browChain(-1, -0.006, 0.019).bone('head'))
      .union(armR, armL)
      .paintWhere(pair(at(sdf.sphere(0.03), 0.135, 0.56)), C.blush, 0.03)
      .paintWhere(eyeBall, C.eyeDark)
      .paintWhere(eyeRing, C.eyeRing)
      .paintWhere(pupil, C.pupil)
      .paintWhere(shine, '#ffffff')
      .paintWhere(wrinkles, '#c8a890', 0.002)
      .paintWhere(mouthBand, C.mouth)
      .paintWhere(teeth, C.teeth)
      .paintWhere(gaps, '#8a7a6a', 0.0008);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004, bump: foreheadGroove });
    k.body('brows', sdf.union(browChain(1, 0.003, 0.0135), browChain(-1, 0.003, 0.0135)), { color: C.brow, roughness: 0.7, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ hair
    // A thin cap (1.04x the skull) cut at the brow with a widow's peak; swept strands lie on it.
    const faceMask = sdf.ellipsoid([0.235, 0.17, 0.23]).rotateZ(4).at(0, 0.638, 0.17);
    const peakWedge = sdf.extrude(profile.polygon([[-0.05, 0.83], [0.05, 0.83], [0, 0.788]]), 0.4).at(0, 0, 0.2);
    const cap = sdf
      .ellipsoid([HEAD[0] * 1.045, HEAD[1] * 1.04, HEAD[2] * 1.045])
      .at(0, HEAD_Y + 0.006, -0.004)
      .smoothSubtract(0.014, faceMask.subtract(peakWedge))
      .smoothSubtract(0.015, pair(sdf.ellipsoid([0.075, 0.07, 0.085]).at(0.225, 0.598, -0.005)))
      .intersect(sdf.halfSpace(norm([0, -1, -0.35]), -0.53));
    const headPt = (az: number, el: number, lift: number): V3 => {
      const d: V3 = [Math.sin(az * rad) * Math.cos(el * rad), Math.sin(el * rad), Math.cos(az * rad) * Math.cos(el * rad)];
      const o: V3 = [0, HEAD_Y, -0.004];
      const hit = sdf.raycast(cap, [o[0] + d[0] * 0.6, o[1] + d[1] * 0.6, o[2] + d[2] * 0.6], [-d[0], -d[1], -d[2]]);
      const p = hit ?? [o[0] + d[0] * 0.2, o[1] + d[1] * 0.2, o[2] + d[2] * 0.2];
      return [p[0] + d[0] * lift, p[1] + d[1] * lift, p[2] + d[2] * lift];
    };
    const lock = (az0: number, el0: number, az1: number, el1: number, r: number) => {
      const n = 5;
      const pts = Array.from({ length: n }, (_, i) => {
        const u = i / (n - 1);
        const p = headPt(az0 + (az1 - az0) * u, el0 + (el1 - el0) * u + 5 * Math.sin(u * Math.PI), 0.002);
        return [p[0], p[1], p[2], r * (1 - 0.58 * u)] as [number, number, number, number];
      });
      return sdf.chain(pts, 0.01);
    };
    const lockSet = (s: 1 | -1) => [
      lock(s * 8, 36, s * 46, 31, 0.012),
      lock(s * 20, 36, s * 64, 27, 0.012),
      lock(s * 34, 35, s * 82, 21, 0.012),
      lock(s * 48, 32, s * 100, 13, 0.012),
      lock(s * 62, 27, s * 114, 4, 0.012),
      lock(s * 106, 28, s * 148, -2, 0.012),
    ];
    const lockShape = sdf.smoothUnion(0.008, ...lockSet(1), ...lockSet(-1));
    const hairBase = cap.smoothUnion(0.008, lockShape);
    const strands = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z + 0.32) * 60 + noise.fbm(x * 10, y * 10, z * 10, 2) * 2.5);
    const hairShape = hairBase.paintWhere(lockShape, T.hairLit, 0.006);
    k.body('hair', hairShape, {
      color: T.hair,
      roughness: 0.6,
      detail: 0.004,
      bone: 'head',
      bump: (x, y, z) => 0.0014 * strands(x, y, z),
    });

    // ------------------------------------------------------------------ the tall hat
    // A flat-topped hat that widens toward the top, tipped back a little, with a purple symbol.
        const hatR = (y: number) => 0.19 + (0.04 * (y - 0.008)) / 0.132;
    const HAT_Z = 1.04;
    const hatPose = (s: sdf.Shape) => s.rotateX(-7).at(0, 0.835, -0.012);
    const hatLocal = sdf
      .revolve(
        profile.polygon([
          [0, 0],
          [0.184, 0],
          [0.191, 0.008],
          [0.23, 0.14],
          [0.222, 0.155],
          [0, 0.155],
        ]),
      )
      .round(0.004)
      .scale([1, 1, HAT_Z])
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.138), C.hatLit, 0.006);
    k.body('hat', hatPose(hatLocal), {
      color: C.hat,
      roughness: 0.9,
      detail: 0.005,
      bone: 'head',
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
    // The symbol: an inverted cross with forked tips, lying on the hat's front wall.
    const SY = 0.078;
    const alpha = Math.atan(0.04 / 0.132) / rad;
    const bar = (a: [number, number], b: [number, number], r: number) => sdf.capsule([a[0], a[1], 0], [b[0], b[1], 0], r);
    const symbolLocal = sdf
      .smoothUnion(
        0.004,
        bar([0, -0.05], [0, 0.04], 0.0058),
        bar([-0.028, -0.01], [0.028, -0.01], 0.0058),
        bar([0, 0.04], [-0.014, 0.056], 0.0045),
        bar([0, 0.04], [0.014, 0.056], 0.0045),
        bar([-0.028, -0.01], [-0.034, 0.006], 0.0045),
        bar([0.028, -0.01], [0.034, 0.006], 0.0045),
        sdf.sphere(0.0085).at(0, -0.052, 0),
        sdf.sphere(0.0072).at(-0.031, -0.01, 0),
        sdf.sphere(0.0072).at(0.031, -0.01, 0),
      )
      .scale([0.95, 0.95, 1.1])
      .rotateX(alpha)
      .at(0, SY, hatR(SY) * HAT_Z);
    k.body('hat-symbol', hatPose(symbolLocal), { color: C.symbol, roughness: 0.5, detail: 0.003, bone: 'head', emissive: C.symbol, emissiveIntensity: 0.25 });

    // ------------------------------------------------------------------ the cassock
    const robeShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.06, 0.466],
            [0.1, 0.45],
            [0.128, 0.415],
            [0.138, 0.37],
            [0.14, 0.31],
            [0.148, 0.24],
            [0.16, 0.16],
            [0.172, 0.1],
            [0.176, 0.078],
            [0.168, 0.068],
            [0, 0.068],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.86]);
    const SKIRT_Y = 0.23;
    const CHEST_Y = 0.33;
    const banded = (s: sdf.Shape) =>
      sdf.union(
        s.intersect(sdf.halfSpace([0, -1, 0], -CHEST_Y)).bone('chest'),
        s.intersect(sdf.halfSpace([0, 1, 0], CHEST_Y)).intersect(sdf.halfSpace([0, -1, 0], -SKIRT_Y)).bone('spine'),
        s.intersect(sdf.halfSpace([0, 1, 0], SKIRT_Y)).bone('skirt'),
      );
    const foldAmp = (y: number) => 0.0008 + 0.0022 * clamp01((0.34 - y) / 0.22);
    k.body('robe', banded(robeShape), {
      color: C.robe,
      roughness: 0.9,
      detail: 0.006,
      bump: (x, y, z) => foldAmp(y) * Math.sin(Math.atan2(x, z) * 14 + noise.fbm(x * 8, y * 4, z * 8, 2) * 2) + 0.0006 * noise.fbm(x * 70, y * 30, z * 70, 2),
    });
    // The large rolled collar: a wide torus standing above the cassock, open at the front.
    const collar = sdf
      .torus(0.12, 0.035)
      .scale([1, 1, 0.9])
      .at(0, 0.444, -0.02)
      .subtract(sdf.box([0.07, 0.2, 0.16], 0.02).at(0, 0.444, 0.115))
      .bone('chest');
    k.body('collar', collar, { color: C.collar, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.001 * noise.fbm(x * 60, y * 60, z * 60, 2) });

    // The rope belt with a twist groove, and a hanging rope end.
    const robeX = sdf.raycast(robeShape, [1, 0.245, 0], [-1, 0, 0])![0];
    const belt = sdf.torus(robeX + 0.002, 0.0125).scale([1, 1, 0.86]).at(0, 0.245, 0).bone('spine');
    const tailZ = sdf.raycast(robeShape, [0.065, 0.24, 1], [0, 0, -1])![2];
    const ropeEnd = sdf
      .smoothUnion(
        0.01,
        sdf.chain(
          [
            [0.055, 0.243, tailZ + 0.01, 0.011],
            [0.068, 0.21, tailZ + 0.014, 0.0105],
            [0.066, 0.17, tailZ + 0.016, 0.0105],
            [0.068, 0.14, tailZ + 0.016, 0.012],
          ],
          0.012,
        ),
        sdf.sphere(0.014).at(0.068, 0.128, tailZ + 0.016),
      )
      .bone('skirt');
    k.body('belt', sdf.union(belt, ropeEnd), {
      color: C.rope,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y, z) => 0.0014 * Math.sin(Math.atan2(x, z) * 80 + y * 260) + 0.0006 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // A grey belt panel hangs at the center of the rope belt.
    const panelZ = sdf.raycast(robeShape, [0, 0.225, 1], [0, 0, -1])![2];
    k.body('belt-panel', banded(sdf.box([0.08, 0.05, 0.01], 0.003).at(0, 0.222, panelZ + 0.006)), { color: '#5a5a60', roughness: 0.8, detail: 0.004 });

    // The stole: two bands over the shoulders, front and back, wider toward the hem.
    const SX = 0.095;
    const stolePanel = (cx: number, z: number) =>
      sdf
        .extrude(
          profile.polygon([
            [cx - 0.027, 0.43],
            [cx + 0.027, 0.43],
            [cx + 0.044, 0.09],
            [cx - 0.044, 0.09],
          ]),
          0.4,
          0.006,
        )
        .at(0, 0, z);
    const stolePanels = sdf.union(stolePanel(SX, 0.2), stolePanel(-SX, 0.2), stolePanel(SX, -0.2), stolePanel(-SX, -0.2));
    // The border: the panel minus a narrower inner panel, painted lighter.
    const stoleInner = (cx: number, z: number) =>
      sdf
        .extrude(
          profile.polygon([
            [cx - 0.02, 0.44],
            [cx + 0.02, 0.44],
            [cx + 0.036, 0.098],
            [cx - 0.036, 0.098],
          ]),
          0.5,
          0.005,
        )
        .at(0, 0, z);
    const stoleBorder = sdf.union(
      ...[SX, -SX].flatMap((cx) => [stolePanel(cx, 0.2).subtract(stoleInner(cx, 0.2)), stolePanel(cx, -0.2).subtract(stoleInner(cx, -0.2))]),
    );
    // Purple runes down the middle of each band: small crosses and ticks, painted darker.
    const rune = (cx: number, y: number) =>
      sdf.union(
        sdf.box([0.006, 0.026, 0.9], 0.002).at(cx, y, 0),
        sdf.box([0.02, 0.006, 0.9], 0.002).at(cx, y + 0.004, 0),
      );
    const runes = sdf.union(...[SX, -SX].flatMap((cx) => [0.37, 0.3, 0.23, 0.16, 0.115].map((y) => rune(cx * (1 + (0.4 - y) * 0.2), y))));
    const stole = robeShape
      .round(0.01)
      .smoothIntersect(0.003, stolePanels)
      .paintWhere(stoleBorder, T.stoleLit, 0.002)
      .paintWhere(runes, T.stoleDark, 0.0015);
    k.body('stole', banded(stole), { color: T.stole, roughness: 0.75, detail: 0.005, bump: (x, y, z) => 0.0008 * noise.fbm(x * 80, y * 40, z * 80, 2) });

    // Four small gold symbols on each front band: a ring in a diamond.
    const robeZ = (x: number, y: number) => sdf.raycast(robeShape, [x, y, 1], [0, 0, -1])![2];
    const goldSymbol = (x: number, y: number) =>
      sdf
        .union(
          sdf.box([0.022, 0.022, 0.012], 0.004).rotateZ(45).subtract(sdf.box([0.011, 0.011, 0.02]).rotateZ(45).at(0, 0, 0.004)),
          sdf.sphere(0.0042).at(0, 0, 0.004),
        )
        .at(x, y, robeZ(x, y) + 0.011);
    const goldShape = sdf.union(
      ...[SX, -SX].flatMap((cx) => [0.385, 0.315, 0.245, 0.175].map((y) => goldSymbol(cx * (1 + (0.4 - y) * 0.2), y))),
    );
    k.body('gold', banded(goldShape), { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003 });

    // The iron chain: rings hung in a curve from the collar down to the medallion.
    const chainLinks: sdf.Shape[] = [];
    const nLinks = 11;
    for (let i = 0; i < nLinks; i++) {
      const u = i / (nLinks - 1);
      const w = 2 * u - 1;
      const x = 0.066 * w;
      const y = 0.427 - 0.072 * (1 - w * w);
      const slope = (0.072 * 2 * w * 2) / 0.132; // dy/dx of the curve
      const ang = Math.atan(slope) / rad;
      const z = robeZ(x, y) + 0.016;
      const ring = sdf.torus(0.0072, 0.003).scale([1.55, 1, 1]);
      chainLinks.push((i % 2 === 0 ? ring.rotateX(90) : ring).rotateZ(ang).at(x, y, z));
    }
    const MED_Y = 0.326;
    const medZ = robeZ(0, MED_Y) + 0.016;
    const medallion = sdf
      .union(
        sdf.cylinder(0.03, 0.008, 0.003).rotateX(90).at(0, 0, 0),
        sdf.torus(0.026, 0.0036).rotateX(90).at(0, 0, 0.004),
        sdf.capsule([0, -0.017, 0.006], [0, 0.015, 0.006], 0.0032),
        sdf.capsule([-0.011, -0.006, 0.006], [0.011, -0.006, 0.006], 0.0032),
        sdf.sphere(0.0055).at(0, 0.02, 0.005),
      )
      .at(0, MED_Y, medZ);
    k.body('chain', banded(sdf.union(...chainLinks, medallion)), { color: C.iron, roughness: 0.5, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ sleeves
    const sleeve = (sh: V3, el: V3, wr: V3, up: string, fore: string) => {
      const inner = lerp(sh, [0, sh[1], 0], 0.25);
      const cuffIn = sdf.cone(lerp(el, wr, 0.72), lerp(el, wr, 1.25), 0.04, 0.062);
      return sdf.smoothUnion(
        0.024,
        sdf.cone(inner, el, 0.05, 0.056).bone(up),
        sdf.cone(el, wr, 0.056, 0.066).smoothSubtract(0.006, cuffIn).bone(fore),
      );
    };
    k.body('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R')), {
      color: C.robe,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 60, y * 40, z * 60, 2),
    });

    // ------------------------------------------------------------------ legs (hidden) and shoes
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.08]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0], 0.085, 0.004], 0.044).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.shoe, roughness: 0.85, detail: 0.007 });
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.05, 0.08, 0.02).at(0, 0.055, 0), sdf.ellipsoid([0.058, 0.05, 0.095]).at(0, 0.04, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shoe = shoeFoot
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.sole)
      .rotateY(8)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.4 });

    // ------------------------------------------------------------------ the crozier (right hand)
    const wob = (t: number): V3 => {
      const f = Math.min(1, Math.abs(t) / 0.14);
      return [0.006 * Math.sin(t * 10) * f, 0, 0.005 * Math.cos(t * 8) * f];
    };
    const spt = (t: number, r: number): [number, number, number, number] => {
      const c = add(staffAt(t), wob(t));
      return [c[0], c[1], c[2], r];
    };
    const shaft = sdf.chain(
      [spt(-STAFF_DOWN, 0.015), spt(-0.1, 0.0155), spt(0, 0.016), spt(0.15, 0.0155), spt(0.3, 0.0145), spt(0.45, 0.0165), spt(0.6, 0.0155), spt(STAFF_TOP - 0.04, 0.0175)],
      0.02,
    );
    const knot = (t: number, r: number, s = 1.25) => sdf.ellipsoid([r, r * s, r]).at(...add(staffAt(t), wob(t)));
    const KN = KNOB_AT;
    const skullShape = sdf.smoothUnion(
      0.01,
      sdf.sphere(0.033).at(...KN),
      sdf.ellipsoid([0.022, 0.017, 0.022]).at(KN[0], KN[1] - 0.026, KN[2] + 0.009),
    );
    const sockets = sdf.union(
      sdf.sphere(0.0088).at(KN[0] + 0.0125, KN[1] + 0.004, KN[2] + 0.029),
      sdf.sphere(0.0088).at(KN[0] - 0.0125, KN[1] + 0.004, KN[2] + 0.029),
      sdf.sphere(0.0045).at(KN[0], KN[1] - 0.008, KN[2] + 0.034),
      sdf.box([0.034, 0.0018, 0.03]).at(KN[0], KN[1] - 0.022, KN[2] + 0.032),
    );
    // Thorny claws curl up around the flame at the top of the knob.
    const claw = (a: number) => {
      const c = Math.cos(a * rad);
      const s = Math.sin(a * rad);
      return sdf.chain(
        [
          [KNOB_AT[0] + c * 0.026, KNOB_AT[1] + 0.02, KNOB_AT[2] + s * 0.026, 0.0075],
          [KNOB_AT[0] + c * 0.044, KNOB_AT[1] + 0.045, KNOB_AT[2] + s * 0.044, 0.0058],
          [KNOB_AT[0] + c * 0.036, KNOB_AT[1] + 0.075, KNOB_AT[2] + s * 0.036, 0.0022],
        ],
        0.008,
      );
    };
    const staff = sdf
      .smoothUnion(
        0.014,
        shaft,
        knot(0.24, 0.024),
        knot(0.42, 0.02),
        knot(0.62, 0.022),
        knot(-STAFF_DOWN, 0.03, 1),
        skullShape,
        claw(45),
        claw(135),
        claw(225),
        claw(315),
      )
      .displace(0.0035, (x, y, z) => noise.fbm(x * 40, y * 25, z * 40, 2))
      .subtract(sockets)
      .paintWhere(skullShape.round(0.006), '#2a2830', 0.008);
    k.body('staff', staff, {
      color: C.staff,
      roughness: 0.55,
      detail: 0.004,
      bone: 'hand.R',
      bump: (x, y, z) => 0.001 * noise.fbm(x * 90, y * 20, z * 90, 2),
    });

    // The purple flame on the knob: a tall tongue and curling side tongues, emissive, see-through.
    const flameLocal = sdf.smoothUnion(
      0.02,
      sdf.chain([[0, 0, 0, 0.033], [0.005, 0.05, 0.008, 0.027], [-0.005, 0.11, 0, 0.016], [0.014, 0.16, 0.006, 0.005]], 0.02),
      sdf.chain([[0.014, 0.02, 0, 0.02], [0.04, 0.05, 0.004, 0.014], [0.06, 0.085, 0, 0.008], [0.07, 0.12, -0.004, 0.004]], 0.015),
      sdf.chain([[-0.014, 0.02, 0, 0.02], [-0.05, 0.05, -0.01, 0.014], [-0.075, 0.08, -0.01, 0.008], [-0.085, 0.115, -0.012, 0.004]], 0.015),
      sdf.chain([[0, 0.02, 0.016, 0.018], [0.012, 0.05, 0.05, 0.012], [0.02, 0.08, 0.075, 0.007], [0.012, 0.11, 0.09, 0.004]], 0.012),
    );
    k.body('flame', flameLocal.displace(0.01, (x, y, z) => noise.fbm(x * 10, y * 10, z * 10, 2)).at(KNOB_AT[0], KNOB_AT[1] + 0.03, KNOB_AT[2]), {
      color: T.flameBase,
      emissive: T.flame,
      emissiveIntensity: 1.5,
      opacity: 0.8,
      roughness: 0.4,
      detail: 0.0035,
      bone: 'ember',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys, reach, orient } = motion;
    const ease = (a: number, b: number, x: number) => {
      const t = clamp01((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
    const flicker = (p: number) => ({ ember: { scale: [1 + 0.06 * wave(p, 7), 1 + 0.12 * wave(p, 5, 0.2), 1 + 0.06 * wave(p, 7, 0.4)] as const } });

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        ...flicker(p),
        hips: { move: [0, -0.003 * bump(p), 0] },
        skirt: { rotate: [1.2 * wave(p, 1, 0.2), 0, 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        'forearm.R': { rotate: [-3 * bump(p), 0, 0] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * wave(p, 1, 0.3)] },
        'hand.L': { rotate: [5 * wave(p, 1, 0.5), 0, 0] },
      }),
    });

    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, 4 * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          sit: 0.005,
          roll: 10,
          heel: [0.094, 0, -0.035],
          toe: [0.115, 0, 0.12],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...flicker(p),
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          skirt: { rotate: [lean * 0.4 + 2 * wave(p, 2, 0.1), -4 * wave(p, 1, 0.12), 2 * wave(p, 1, 0.3)] as const },
          spine: { rotate: [lean, 0, -2 * s] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, -2 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.5 * s, 0, 2] as const },
          'forearm.L': { rotate: [-armSwing * 0.15 * (1 + s), 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.35 * s, 0, -6] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.022, 0.6, 22, 2, 0.006));
    k.animation('run', stride(0.58, 0.13, 0.04, 0.4, 38, 9, 0.025));

    // The wrist follows keys in the chest's rest frame (reach); the hand turns so the staff points
    // along its own keys (orient).
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const STAFF = { dir: STAFF_AXIS, up: STAFF_FACE };
    const staffPose = (wrist: V3, dir: V3, up: V3, pole: V3 = [-0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], STAFF, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    const RAISED: V3 = [-0.262, 0.47, 0.07];

    // attack: the staff rises high beside him (out on the right, never over the head), thrusts up
    // once, and the flame flares; then he lowers the staff. He leans away and looks up at it.
    k.animation('attack', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const raise = ease(0.03, 0.3, p) * (1 - ease(0.72, 0.98, p));
        const thrust = ease(0.26, 0.34, p) * (1 - ease(0.46, 0.7, p));
        const flare = ease(0.32, 0.38, p) * (1 - ease(0.5, 0.72, p));
        const pulse = 0.35 * bump(clamp01((p - 0.36) / 0.22), 2);
        const wrist = add(lerp(WRIST_R, RAISED, raise), [-0.008 * thrust, 0.022 * thrust, 0.008 * thrust]);
        const dir = lerp(STAFF_AXIS, norm([-0.42, 1, 0.12]), raise);
        const up = lerp(STAFF_FACE, norm([0.05, 0.12, 1]), raise);
        const s = 1 + (1.1 + pulse) * flare;
        return {
          ...staffPose(wrist, dir, up),
          ember: { scale: [s, 1 + (1.8 + pulse) * flare, s] as const },
          'upperarm.L': { rotate: [8 * raise, 0, 14 * raise] },
          'forearm.L': { rotate: [-22 * raise, 0, 0] },
          hips: { move: [0, 0.006 * thrust - 0.004 * raise, 0] },
          skirt: { rotate: [2 * raise - 2 * thrust, 0, 0] },
          spine: { rotate: [-3 * raise, 0, -2 * raise] },
          chest: { rotate: [-4 * raise - 3 * thrust, -8 * raise, -4 * raise] },
          head: { rotate: [-9 * raise, -10 * raise, -4 * raise] },
        };
      },
    });

    // hit: the head and chest snap back from a blow, a small step back, a quick return. The staff
    // swings out to the side, away from the head.
    k.animation('hit', {
      duration: 0.42,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        const f = 1 - 0.35 * h;
        return {
          hips: { move: [0, -0.006 * h, -0.025 * h], rotate: [0, 6 * h, 0] },
          skirt: { rotate: [6 * h, 0, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, -3 * h] },
          head: { rotate: [-14 * h, -8 * h, 4 * h] },
          ...staffPose(lerp(WRIST_R, [-0.265, 0.29, 0.04], h), lerp(STAFF_AXIS, norm([-0.5, 0.85, -0.1]), h), STAFF_FACE),
          ember: { scale: [f, f, f] as const },
          'upperarm.L': { rotate: [-6 * h, 0, 16 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger back, the knees give, and he falls flat on his back; the flame goes out. The
    // staff ends on the ground beside his right side, pointing to his feet; the left arm flings out.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(clamp01((p - 0.66) / 0.16));
        const fling = ease(0.2, 0.62, p);
        const out = 1 - 0.95 * ease(0.3, 0.6, p);
        // The keys are in the chest's rest frame; lying down, that frame is turned 84 degrees back,
        // so chest +Z is world up.
        const staffArm = staffPose(
          keys(p, [[0, WRIST_R], [0.3, [-0.27, 0.32, 0.09]], [0.66, [-0.285, 0.33, -0.09]]] as const),
          keys(
            p,
            [
              [0, STAFF_AXIS],
              [0.3, norm([-0.3, 0.75, 0.6])],
              [0.5, norm([-0.2, -0.2, 0.96])],
              [0.66, norm([-0.05, -0.997, 0.06])],
            ] as const,
          ),
          keys(p, [[0, STAFF_FACE], [0.3, [-1, 0, 0]], [0.5, [-1, 0, 0]], [0.66, [0, 0.1045, 0.9945]]] as const),
          [-0.3, 0.2, -0.4],
        );
        const legL = 6 * stagger + 16 * bump(fall) + 22 * fall;
        const legR = -6 * stagger + 18 * bump(fall) + 24 * fall;
        return {
          ...staffArm,
          ember: { scale: [out, out, out] as const },
          'upperarm.L': { rotate: [0, 0, 62 * fling] },
          'forearm.L': { rotate: [-10 * fling, 0, 0] },
          hips: {
            move: [0, -0.034 * fall * fall + 0.02 * bump(fall) + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall],
            rotate: [-86 * fall - 4 * stagger, 0, 0],
          },
          skirt: { rotate: [0.8 * (legL + legR) * 0.5, 0, 0] },
          spine: { rotate: [-6 * stagger + 2 * fall, 0, 0] },
          chest: { rotate: [-4 * stagger, 0, 0] },
          neck: { rotate: [4 * fall, 0, 0] },
          head: { rotate: [-16 * stagger + 6 * fall, 18 * fall, 0] },
          'leg.L': { rotate: [legL, 0, 5 * fall] },
          'leg.R': { rotate: [legR, 0, -6 * fall] },
          'foot.L': { rotate: [-12 * fall, 0, 0] },
          'foot.R': { rotate: [-16 * fall, 0, 0] },
        };
      },
    });

    // taunt: he raises the crozier out to the right and shakes it twice while the flame flares,
    // and beckons with the open left hand. The staff stays out to the side, clear of the hat.
    k.animation('taunt', {
      duration: 1.7,
      loop: false,
      pose: (_t, p) => {
        const on = ease(0.05, 0.25, p) * (1 - ease(0.85, 1, p));
        const shake = wave(p * 2, 1.5, 0.75);
        const beckon = 0.5 + 0.5 * wave(p * 2, 1.5, 0.25);
        const wrist = add(lerp(WRIST_R, RAISED, on), [-0.01 * on * shake, 0.015 * on * Math.abs(shake), 0]);
        const dir = lerp(STAFF_AXIS, norm([-0.42 - 0.12 * shake, 1, 0.12]), on);
        const flare = 1 + 0.6 * bump(clamp01((p - 0.25) / 0.5), 2) * on + 0.2 * on;
        return {
          ...staffPose(wrist, dir, lerp(STAFF_FACE, norm([0.05, 0.12, 1]), on)),
          ember: { scale: [flare, 1 + 1.6 * (flare - 1) + 0.1 * on, flare] as const },
          'upperarm.L': { rotate: [-28 * on, 0, 12 * on] },
          'forearm.L': { rotate: [-70 * on - 10 * beckon * on, 0, 0] },
          'hand.L': { rotate: [20 * beckon * on, 0, 0] },
          spine: { rotate: [-5 * on, 0, 0] },
          chest: { rotate: [-3 * on + 2 * wave(p * 2), 5 * on, 0] },
          head: { rotate: [-7 * on, 8 * on, 4 * on] },
          skirt: { rotate: [3 * on, 0, 0] },
        };
      },
    });
  },
});
