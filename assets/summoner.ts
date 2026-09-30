import { defineAsset, motion, profile, rgb, sdf } from '../src/index.js';

/**
 * Summoner — Chibi Quest hero, about 1.0 m tall to the top of the hair, faces +Z. Base: assets/priest.ts
 * (skeleton, knee bones, `skirt`, clip set, the young round beardless face). Target:
 * docs/hero-mockups/summoner_001.jpg.
 *
 * Role: player hero, 3D and 128 px sprite; the violet braid, the green-and-gold robe, the book,
 *   and the glowing spirit must read.
 * One idea: a young mystic in a green robe with a long violet braid; a small green leaf-winged
 *   spirit floats above his open right palm, a spellbook hangs by a chain in his left hand.
 * Silhouette: a tall wave of violet hair, a thick braid over the left shoulder to the waist, wide
 *   gold-edged sleeves, a robe to the ankles, the spirit and its leaf wings beside the head.
 * Palette (60/30/10): green robe #3f7a4a; gold trim, collar, circlet, sleeve edges #d4a93a; cream
 *   front panel #ece4cc; violet hair #8a78c8; skin #f2c7a4; brown belt, book, sandals; the green
 *   spirit #c8e860 is the glowing accent.
 * Bodies: skin (with the open hands and the feet), hair, braid, circlet, robe, trim, panel, belt,
 *   clasp, gem, chain, sleeves, pants, sandals, book, spirit, spirit-eyes, spirit-wings, flare.
 * Rig: the priest's skeleton plus `braid` (sways), `spirit` (above the right palm), and `flare`
 *   (a green flash inside the spirit). Clips: idle, walk, run, attack (summon: the right arm rises,
 *   the spirit flares and orbits once), attack2 (the spirit dashes forward and back), hit, death,
 *   victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a30',
  iris: '#6a4a9e',
  irisLow: '#9a7ac8',
  pupil: '#141a18',
  lid: '#1c130f',
  mouth: '#a4503f',
  nose: '#f0a890',
  hair: '#8a78c8',
  robe: '#3f7a4a',
  robeFold: '#2a5a34',
  trim: '#d4a93a',
  gold: '#e0b040',
  panel: '#ece4cc',
  pants: '#2a4a3a',
  belt: '#6b4226',
  gem: '#40c060',
  gemBase: '#104020',
  sandal: '#6b4226',
  sole: '#3a2416',
  cover: '#5a3a24',
  pages: '#efe4c6',
  spirit: '#c8e860',
  spiritBase: '#405018',
  spiritEye: '#204010',
  wing: '#a8d050',
  flash: '#c8f060',
  flashBase: '#405018',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');

// Joints: human shoulders like the rogue's. The forearms point forward and a little down; the
// right hand is open, palm up, under the spirit; the left fist holds the book.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.322, -0.01];
const WRIST_R: V3 = [-0.235, 0.285, 0.1];
const ELBOW_L: V3 = [0.19, 0.322, -0.01];
const WRIST_L: V3 = [0.225, 0.248, 0.068];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
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
const HAND_L = { pitch: -70, roll: 20 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);

// The open right hand, palm up: built at the wrist with the fingers along +Z, then tipped to follow
// the forearm and lifted a little.
const FOREARM_R = norm([WRIST_R[0] - ELBOW_R[0], WRIST_R[1] - ELBOW_R[1], WRIST_R[2] - ELBOW_R[2]]);
const HAND_PITCH = Math.asin(-FOREARM_R[1]) / rad - 12;
const openHandLocal = () => {
  const finger = (x: number, len: number, curl: number) =>
    sdf.capsule([x, 0.004, 0.06], [x * 1.08, 0.004 + curl, 0.06 + len], 0.0125);
  return sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.038, 0.014, 0.046]).at(0, 0, 0.042),
    finger(-0.024, 0.052, 0.008),
    finger(-0.008, 0.062, 0.01),
    finger(0.008, 0.06, 0.01),
    finger(0.024, 0.047, 0.008),
    sdf.capsule([-0.03, 0.0, 0.03], [-0.062, 0.008, 0.062], 0.0135), // the thumb, out to the right
  );
};
const HAND_R_AT = (s: sdf.Shape) => s.rotateX(HAND_PITCH).at(...WRIST_R);

// The spirit hovers at shoulder height off the +X shoulder.
const SPIRIT_AT: V3 = [0.3, 0.44, 0.04]; // hovers off the +X shoulder

// The book: small, upright, cover toward +Z, spine on the -X edge (in the fist), turned out a little.
const BOOK_TURN = { y: 25, z: -6 };
const BOOK_AT: V3 = [0.272, 0.252, 0.128];
const bookDir = (p: V3) => rotZ(rotY(p, BOOK_TURN.y), BOOK_TURN.z);

/** A star outline with n points (one points up): R the tips, r the notches. */
const star = (n: number, R: number, r: number, turn = 0) =>
  profile.polygon(
    Array.from({ length: n * 2 }, (_, i) => {
      const a = ((i * 180) / n + 90 + turn) * rad;
      const d = i % 2 ? r : R;
      return [Math.cos(a) * d, Math.sin(a) * d] as [number, number];
    }),
  );

export default defineAsset({
  name: 'summoner',
  description: 'Chibi young summoner hero with a violet braid, a green and gold robe, a spellbook on a chain, and a green spirit companion.',
  detail: 0.005,
  reference: 'docs/hero-mockups/summoner_001.jpg',
  // Color slots for individual summoners (the first option is the default look). Hair covers the
  // hair and the brows; trim is the vestment's gold cloth (yoke, stole, hem band, fringe).
  variants: {
    eyes: { violet: C.iris, brown: '#6e4020', green: '#3d7a35' },
    hair: { violet: C.hair, black: '#231a17', silver: '#c4c0b8' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    trim: { gold: C.trim, silver: '#a7b6c8', rose: '#c87a8a' },
  },
  presets: {
    default: { eyes: 'violet', hair: 'violet', skin: 'fair', trim: 'gold' },
    silver: { eyes: 'green', hair: 'silver', skin: 'tan', trim: 'silver' },
    rose: { eyes: 'brown', hair: 'black', skin: 'brown', trim: 'rose' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    // The blush, the mouth, and the nose tip keep their pink but take half of the skin's recoloring.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', -0.3),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      nose: k.tint('skin', { color: C.nose, follow: 0.5 }),
      trim: k.tint('trim'),
      trimDark: k.tint('trim', -0.22),
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
      spirit: { parent: 'chest', at: SPIRIT_AT },
      flare: { parent: 'spirit', at: SPIRIT_AT },
      braid: { parent: 'chest', at: [0.12, 0.44, 0.0] },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face (the rogue's)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    // A round button nose, a little bigger than the rogue's.
    const noseZ = faceZ(0, 0.568);
    const nose = sdf.ellipsoid([0.026, 0.022, 0.02]).at(0, 0.568, noseZ - 0.002).bone('head');
    // Small round human ears.
    const ears = pair(
      sdf
        .ellipsoid([0.024, 0.048, 0.038])
        .subtract(sdf.sphere(0.019).at(0.016, 0, 0.01))
        .rotateY(-40)
        .at(0.206, 0.6, -0.012)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(lerp(mx(SHOULDER), ELBOW_R, 0.35), ELBOW_R, 0.034, 0.032).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.034, 0.03).bone('forearm.R'),
      HAND_R_AT(openHandLocal()).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(lerp(SHOULDER, ELBOW_L, 0.35), ELBOW_L, 0.034, 0.032).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.034, 0.03).bone('forearm.L'),
      handPose(HAND_L, WRIST_L)(fistLocal(1)).bone('hand.L'),
    );

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.055, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] + 0.004));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    // Both highlights sit up and to the +X side: one light for the whole face.
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    const smile = sdf.extrude(profile.arc(0.06, 0.009, 245, 295), 0.3).at(0, 0.522 + 0.06, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.558));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armR, armL)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(smile, T.mouth)
      .paintWhere(sdf.sphere(0.024).at(0, 0.57, noseZ + 0.03), T.nose, 0.016); // a rosy nose tip
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair and brows
    // A thin cap 0.012 over the skull, 16 swept locks laid over it (five top locks with a tall front wave
    // that rises 0.05 m and curls back, four per side, three at the nape). The face and the ears stay clear.
    const faceMask = sdf.ellipsoid([0.235, 0.205, 0.23]).rotateZ(6).at(0, 0.578, 0.17);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.012, HEAD[2] + 0.012])
      .at(0, HEAD_Y, 0)
      .smoothSubtract(0.02, faceMask)
      .smoothSubtract(0.015, pair(sdf.ellipsoid([0.075, 0.07, 0.085]).at(0.225, 0.598, -0.005)))
      .intersect(sdf.halfSpace(norm([0, -1, -0.35]), -0.46));
    // A point on the skull ellipsoid: th = 0 is the front, +th toward +X; ph = 0 is the equator.
    const skull = (thDeg: number, phDeg: number, r: number) => {
      const th = thDeg * rad;
      const ph = phDeg * rad;
      return [HEAD[0] * Math.cos(ph) * Math.sin(th), HEAD_Y + HEAD[1] * Math.sin(ph) - 0.005, HEAD[2] * Math.cos(ph) * Math.cos(th) - 0.005, r] as [number, number, number, number];
    };
    // A point on the skull along a direction: yaw toward +X, pitch 0 = brow level front, 90 = crown,
    // 180 = back; `lift` pushes it out along the skull normal.
    const A2 = HEAD[0] * HEAD[0];
    const B2 = HEAD[1] * HEAD[1];
    const C2 = HEAD[2] * HEAD[2];
    const skullDir = (yaw: number, pitch: number, lift: number, r: number): [number, number, number, number] => {
      const d = rotY([0, Math.sin(pitch * rad), Math.cos(pitch * rad)], yaw);
      const t = 1 / Math.sqrt(d[0] * d[0] / A2 + d[1] * d[1] / B2 + d[2] * d[2] / C2);
      const q: V3 = [d[0] * t, d[1] * t, d[2] * t];
      const n = norm([q[0] / A2, q[1] / B2, q[2] / C2]);
      return [q[0] + n[0] * lift, HEAD_Y - 0.005 + q[1] + n[1] * lift, q[2] - 0.005 + n[2] * lift, r];
    };
    const skullTh = (th: number, ph: number, lift: number, r: number) => {
      const q = skull(th, ph, r);
      const n = norm([(q[0]) / A2, (q[1] - HEAD_Y + 0.005) / B2, (q[2] + 0.005) / C2]);
      return [q[0] + n[0] * lift, q[1] + n[1] * lift, q[2] + n[2] * lift, r] as [number, number, number, number];
    };
    // Top locks: from the hairline they rise, sweep over the crown and curl back. Each row is
    // [pitch, lift, radius]; the first lock is the tall front wave (0.05 m above the cap).
    const MANE_TOP: { yaw: number; wob: number; pts: number[][] }[] = [
      { yaw: 8, wob: 7, pts: [[30, 0.016, 0.028], [46, 0.04, 0.031], [62, 0.05, 0.031], [88, 0.047, 0.027], [114, 0.034, 0.021], [136, 0.018, 0.014]] },
      { yaw: -15, wob: 9, pts: [[31, 0.014, 0.027], [48, 0.032, 0.03], [66, 0.036, 0.029], [92, 0.032, 0.025], [116, 0.022, 0.019], [134, 0.012, 0.013]] },
      { yaw: 31, wob: 8, pts: [[32, 0.01, 0.026], [50, 0.02, 0.029], [68, 0.028, 0.028], [92, 0.024, 0.023], [114, 0.016, 0.017]] },
      { yaw: -38, wob: 8, pts: [[33, 0.008, 0.025], [52, 0.016, 0.028], [70, 0.02, 0.026], [90, 0.017, 0.02], [106, 0.011, 0.015]] },
      { yaw: 54, wob: 6, pts: [[34, 0.008, 0.025], [52, 0.012, 0.027], [68, 0.014, 0.024], [84, 0.012, 0.018]] },
    ];
    const topLocks = MANE_TOP.map((l, i) =>
      sdf.chain(
        l.pts.map((q, j) => {
          const yaw = l.yaw + l.wob * 0.5 * Math.sin(q[0]! * 0.055 + i * 1.9) + j * (l.yaw > 0 ? 1.2 : -1.2);
          const P = skullDir(yaw, q[0]!, q[1]!, q[2]!);
          // fan the locks out across the crown so they do not all meet at one point
          P[0] += Math.sin(l.yaw * rad) * 0.07 * Math.pow(Math.sin(q[0]! * rad), 2);
          return P;
        }),
        0.012,
      ),
    );
    // Side locks (four each side) sweep back over the temples and past the ear tops; nape locks
    // (three) run down behind the head and feed the braid root.
    const SIDE: number[][][] = [
      [[60, 44, 0.008, 0.026], [80, 38, 0.012, 0.027], [102, 30, 0.012, 0.022], [120, 22, 0.008, 0.015]],
      [[56, 58, 0.008, 0.026], [76, 52, 0.014, 0.027], [100, 44, 0.014, 0.023], [124, 36, 0.009, 0.016]],
      [[72, 30, 0.007, 0.024], [92, 22, 0.011, 0.025], [112, 14, 0.011, 0.02], [130, 4, 0.007, 0.014]],
      [[50, 70, 0.008, 0.025], [72, 66, 0.013, 0.026], [98, 60, 0.013, 0.022], [124, 52, 0.009, 0.015]],
    ];
    const sideLocks = ([1, -1] as const).flatMap((sg) =>
      SIDE.map((l, i) =>
        sdf.chain(l.map((q, j) => skullTh(sg * (q[0]! + 3 * Math.sin(i * 2.3 + j * 1.7 + (sg > 0 ? 0 : 2))), q[1]! + 2.5 * Math.sin(i * 1.3 + j * 2.1 + sg), q[2]!, q[3]!)), 0.012),
      ),
    );
    const NAPE: number[][][] = [
      [[128, 70, 0.008, 0.026], [140, 42, 0.012, 0.027], [146, 16, 0.012, 0.024], [142, -6, 0.008, 0.018]],
      [[180, 68, 0.008, 0.026], [176, 42, 0.012, 0.027], [170, 16, 0.012, 0.022], [172, -2, 0.008, 0.016]],
      [[-128, 70, 0.008, 0.026], [-140, 42, 0.012, 0.026], [-148, 16, 0.012, 0.022], [-152, 0, 0.008, 0.016]],
    ];
    const napeLocks = NAPE.map((l) => sdf.chain(l.map((q) => skullTh(q[0]!, q[1]!, q[2]!, q[3]!)), 0.012));
    // A forelock falls from the second wave over the right side of the forehead (the mockup's fringe).
    const f0 = skullDir(-15, 50, 0.016, 0.026);
    const forelock = sdf.chain(
      [f0, [-0.09, 0.845, 0.125, 0.023], [-0.14, 0.82, 0.113, 0.016], [-0.165, 0.79, 0.097, 0.008]],
      0.012,
    );
    // The lock creases are a normal-map bump; the cap and the lock undersides are one tint darker.
    const locksFn = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z + 0.06) * 9 + y * 11);
    const skullE = (x: number, y: number, z: number) =>
      Math.sqrt(x * x / A2 + ((y - HEAD_Y + 0.005) * (y - HEAD_Y + 0.005)) / B2 + ((z + 0.005) * (z + 0.005)) / C2);
    const brow = (s: 1 | -1) => {
      const pt = (x: number, y: number, lift: number): V3 => [s * x, y, faceZ(x, y) + lift];
      const a = pt(0.046, 0.728, 0.005);
      const m = pt(0.096, 0.742, 0.008);
      const b = pt(0.142, 0.734, 0.006);
      const c = pt(0.168, 0.714, 0.002);
      return sdf.chain(
        [
          [a[0], a[1], a[2], 0.01],
          [m[0], m[1], m[2], 0.0145],
          [b[0], b[1], b[2], 0.0125],
          [c[0], c[1], c[2], 0.007],
        ],
        0.01,
      );
    };
    const hairShape = sdf
      .smoothUnion(0.012, cap, forelock, ...topLocks, ...sideLocks, ...napeLocks)
      .paintFn((x, y, z, base) => (y < 0.735 || skullE(x, y, z) < 1.12 ? rgb(T.hairDark) : base))
      .union(brow(1), brow(-1));
    k.body('hair', hairShape, { color: T.hair, roughness: 0.55, detail: 0.005, bone: 'head', bump: (x, y, z) => 0.0025 * locksFn(x, y, z) });

    // The braid: 9 segments from behind the left ear over the shoulder and down to the waist.
    const BRAID: V3[] = [
      [0.13, 0.63, -0.095],
      [0.15, 0.55, -0.075],
      [0.15, 0.48, -0.03],
      [0.14, 0.44, 0.03],
      [0.125, 0.4, 0.085],
      [0.115, 0.355, 0.115],
      [0.11, 0.335, 0.125],
      [0.111, 0.31, 0.128],
      [0.112, 0.285, 0.131],
    ];
    const braidShape = sdf.chain(
      BRAID.map((q, i) => [q[0], q[1], q[2], 0.04 - i * 0.0015 + (i % 2 ? 0.004 : -0.002)] as [number, number, number, number]),
      0.006,
    );
    const braid = braidShape.paintFn((x, y, z, base) => (Math.sin(y * 150 + (x + z) * 60) < -0.55 ? rgb(T.hairDark) : base));
    // Twist groove: a diagonal ridge along the braid's height.
    const braidBump = (x: number, y: number, z: number) => 0.004 * Math.sin(y * 150 + (x + z) * 60);
    k.body('braid-hair', braid, {
      color: T.hair,
      roughness: 0.55,
      detail: 0.005,
      bone: 'braid',
      bump: braidBump,
    });
    // The braid ends in a curled tail (an arc curling inward over the panel) with a gold band.
    const TAIL_AT = BRAID[8]!;
    const tail = sdf
      .extrude(profile.arc(0.026, 0.022, 190, 362), 0.024, 0.008)
      .at(TAIL_AT[0] - 0.026, TAIL_AT[1], TAIL_AT[2]);
    k.body('braid-tail', tail, { color: T.hair, roughness: 0.55, detail: 0.004, bone: 'braid' });
    const braidBand = sdf.torus(0.03, 0.0075).at(BRAID[7]![0], BRAID[7]![1] - 0.004, BRAID[7]![2]);
    k.body('braid-band', braidBand, { color: T.trim, roughness: 0.4, metalness: 0.7, detail: 0.003, bone: 'braid' });

    // The thin gold circlet across the forehead, hugging the head at the hairline.
    const circY = 0.756;
    const circlet = sdf
      .torus(0.222, 0.0075)
      .scale([1, 1, 0.96])
      .rotateX(-6)
      .at(0, circY, -0.012)
      .bone('head');
    k.body('circlet', circlet, { color: T.trim, roughness: 0.4, metalness: 0.7, detail: 0.003, bone: 'head' });

    // ------------------------------------------------------------------ the robe
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
            [0.146, 0.24],
            [0.166, 0.16],
            [0.182, 0.1],
            [0.186, 0.078],
            [0.178, 0.068],
            [0, 0.068],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.86]);
    // Three bands follow three bones: the chest, the waist (spine), and the skirt below 0.23.
    const SKIRT_Y = 0.23;
    const CHEST_Y = 0.33;
    const banded = (s: sdf.Shape) =>
      sdf.union(
        s.intersect(sdf.halfSpace([0, -1, 0], -CHEST_Y)).bone('chest'),
        s.intersect(sdf.halfSpace([0, 1, 0], CHEST_Y)).intersect(sdf.halfSpace([0, -1, 0], -SKIRT_Y)).bone('spine'),
        s.intersect(sdf.halfSpace([0, 1, 0], SKIRT_Y)).bone('skirt'),
      );
    // Soft folds hang from the waist.
    const folds = (x: number, y: number, z: number) => 0.0022 * Math.sin(Math.atan2(x, z) * 13 + y * 5) * (y < 0.3 ? 1 : 0.4);
    k.body('robe', banded(robeShape), { color: C.robe, roughness: 0.8, detail: 0.006, bump: folds });

    // The gold collar: a flared, rolled ring that stands up around the neck.
    const collar = sdf
      .revolve(
        profile.polygon(
          [
            [0.062, 0.43],
            [0.09, 0.438],
            [0.106, 0.478],
            [0.098, 0.506],
            [0.082, 0.5],
            [0.07, 0.474],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9])
      .at(0, 0, -0.012)
      .bone('chest');
    // A gold band above the hem, and a small fringe under the front panel.
    const hemBand = robeShape
      .round(0.006)
      .smoothIntersect(0.004, sdf.box([0.6, 0.026, 0.6], 0.004).at(0, 0.09, 0))
      .bone('skirt');
    // A gold band 0.02 m tall at the foot of the hooded collar.
    const collarBand = sdf
      .cylinder(0.074, 0.02, 0.006)
      .subtract(sdf.cylinder(0.056, 0.06))
      .scale([1, 1, 0.92])
      .at(0, 0.44, -0.012)
      .bone('chest');
    k.body('trim', sdf.union(collar, collarBand, hemBand), { color: T.trim, roughness: 0.42, metalness: 0.2, detail: 0.005 });

    // The open front: the cream lining shows as two lapels flaring from the collar to the hem, with
    // gold trim painted along their edges and a seam between them.
    const flare = (top: number, bottom: number) =>
      sdf.extrude(
        profile.polygon([
          [-top, 0.52],
          [top, 0.52],
          [bottom, 0.04],
          [-bottom, 0.04],
        ]),
        0.4,
      ).at(0, 0, 0.2);
    const panelEdge = flare(0.058, 0.108).subtract(flare(0.036, 0.086));
    const panel = robeShape
      .round(0.01)
      .smoothIntersect(0.003, flare(0.058, 0.108))
      .paintWhere(panelEdge, T.trim, 0.002)
      .paintWhere(sdf.box([0.008, 0.5, 0.5]).at(0, 0.27, 0.2), '#c9bd98', 0.002)
      .paintWhere(sdf.sphere(0.03).at(0, 0.09, 0.2), T.trim, 0.004);
    k.body('panel', banded(panel), { color: C.panel, roughness: 0.75, detail: 0.005 });

    // The wide brown belt, a gold clasp with a green gem, and a short gold chain toward the book.
    const BELT_Y = 0.245;
    const belt = robeShape
      .round(0.013)
      .smoothIntersect(0.005, sdf.box([0.6, 0.05, 0.6], 0.004).at(0, BELT_Y, 0));
    k.body('belt', banded(belt), { color: C.belt, roughness: 0.6, detail: 0.005 });
    const beltZ = sdf.raycast(robeShape.round(0.013), [0, BELT_Y, 1], [0, 0, -1])![2];
    // A gold scrollwork buckle: a 0.05 m plate with curled scrolls at both sides and the gem.
    const scroll = (sx: 1 | -1) =>
      sdf
        .union(
          sdf.torus(0.011, 0.0042).rotateX(90).at(sx * 0.036, BELT_Y + 0.008, beltZ + 0.01),
          sdf.torus(0.008, 0.0038).rotateX(90).at(sx * 0.034, BELT_Y - 0.012, beltZ + 0.01),
        );
    const clasp = sdf
      .union(sdf.box([0.05, 0.05, 0.016], 0.007).at(0, BELT_Y, beltZ + 0.003), scroll(1), scroll(-1))
      .bone('spine');
    k.body('clasp', clasp, { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.003 });
    k.body('gem', sdf.sphere(0.0175).at(0, BELT_Y + 0.001, beltZ + 0.014).bone('spine'), {
      color: C.gemBase,
      roughness: 0.15,
      emissive: C.gem,
      emissiveIntensity: 0.8,
      flat: true,
      detail: 0.003,
    });
    // Three large links hang from the +X side of the buckle.
    const link = (i: number) => {
      const x = 0.058 + i * 0.03;
      const y = BELT_Y - 0.004 - i * 0.012;
      const z = sdf.raycast(robeShape.round(0.013), [x, y, 1], [0, 0, -1])![2] + 0.01;
      const ring = sdf.torus(0.0145, 0.0048).scale([1.3, 1, 1]);
      return (i % 2 ? ring : ring.rotateX(90)).at(x, y, z);
    };
    k.body('chain', banded(sdf.union(...[0, 1, 2].map(link))), {
      color: C.gold,
      roughness: 0.35,
      metalness: 0.85,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ wide gold-edged sleeves
    const sleeve = (sh: V3, el: V3, wr: V3, up: string, fore: string) => {
      const inner = lerp(sh, [0, sh[1], 0], 0.25);
      const cuffIn = sdf.cone(lerp(el, wr, 0.6), lerp(el, wr, 1.05), 0.04, 0.084);
      return sdf.smoothUnion(
        0.024,
        sdf.cone(inner, el, 0.05, 0.06).bone(up),
        sdf
          .cone(el, lerp(el, wr, 0.98), 0.06, 0.086)
          .smoothSubtract(0.006, cuffIn)
          .paintWhere(sdf.cone(lerp(el, wr, 0.86), lerp(el, wr, 1.4), 0.1, 0.12), T.trim, 0.003)
          .bone(fore),
      );
    };
    k.body('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R')), {
      color: C.robe,
      roughness: 0.8,
      detail: 0.004,
      bump: folds,
    });

    // ------------------------------------------------------------------ legs (hidden), feet, sandals
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.08]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0], 0.085, 0.004], 0.044).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85, detail: 0.007 });
    // Bare feet with round toes on flat brown soles held by a strap over the instep.
    const foot = sdf
      .smoothUnion(
        0.016,
        sdf.ellipsoid([0.043, 0.032, 0.08]).at(0, 0.044, 0.04),
        ...[-0.026, -0.009, 0.009, 0.026].map((x, i) => sdf.sphere(0.0125 - Math.abs(i - 1.5) * 0.0015).at(x, 0.03, 0.115 - Math.abs(i - 1.5) * 0.008)),
      )
      .rotateY(6)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('feet', pair(foot), { color: T.skin, roughness: 0.55, detail: 0.004 });
    const sole = sdf
      .ellipsoid([0.058, 0.02, 0.118])
      .at(0, 0.008, 0.05)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .smoothUnion(
        0.006,
        sdf.torus(0.045, 0.006).rotateX(90).scale([1, 0.85, 1]).at(0, 0.03, 0.05),
        sdf.box([0.09, 0.03, 0.03], 0.008).at(0, 0.03, -0.045),
      )
      .rotateY(6)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('sandals', pair(sole), { color: C.sandal, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the spirit companion
    // Built at its own origin, face toward +Z, 1.6x the sketch: a round body, a smaller head, two
    // bead eyes, a smile, two leaf wings, and three tiny leaf feet.
    const SP = 1.6;
    const spiritPose = (s: sdf.Shape) => s.scale(SP).at(...SPIRIT_AT);
    const spiritBody = sdf.smoothUnion(0.02, sdf.sphere(0.045), sdf.sphere(0.034).at(0, 0.055, 0.012));
    k.body('spirit-body', spiritPose(spiritBody), {
      color: C.spiritBase,
      roughness: 0.3,
      emissive: C.spirit,
      emissiveIntensity: 1.2,
      detail: 0.004,
      bone: 'spirit',
    });
    const spiritSmile = sdf.chain(
      [
        [-0.0095, 0.042, 0.043, 0.0026],
        [0, 0.0385, 0.0455, 0.0026],
        [0.0095, 0.042, 0.043, 0.0026],
      ],
      0.002,
    );
    const eyes = sdf.union(...[-1, 1].map((sx) => sdf.sphere(0.0072).at(sx * 0.0145, 0.064, 0.0375)));
    k.body('spirit-eyes', spiritPose(sdf.union(eyes, spiritSmile)), { color: C.spiritEye, roughness: 0.4, detail: 0.0025, bone: 'spirit' });
    const wing = (sx: 1 | -1) => sdf.ellipsoid([0.032, 0.0075, 0.015]).rotateZ(sx * 28).at(sx * 0.058, 0.02, -0.022).rotateY(sx * -18);
    const spiritFoot = (x: number, z: number) => sdf.ellipsoid([0.0075, 0.0045, 0.016]).at(x, -0.042, z);
    k.body('spirit-wings', spiritPose(sdf.union(wing(1), wing(-1), spiritFoot(0, 0.026), spiritFoot(-0.024, 0.006), spiritFoot(0.024, 0.006))), {
      color: C.wing,
      roughness: 0.5,
      detail: 0.003,
      bone: 'spirit',
    });
    // The green flash: a small star inside the spirit at rest; the summon scales it out.
    k.body('flare-glow', spiritPose(sdf.union(sdf.extrude(star(8, 0.03, 0.01, 22.5), 0.008, 0.002).at(0, 0, 0.02), sdf.sphere(0.02))), {
      color: C.flashBase,
      roughness: 0.5,
      emissive: C.flash,
      emissiveIntensity: 2.0,
      detail: 0.003,
      bone: 'flare',
    });

    // ------------------------------------------------------------------ the spellbook (left hand)
    const bookPose = (s: sdf.Shape) => s.rotateY(BOOK_TURN.y).rotateZ(BOOK_TURN.z).at(...BOOK_AT);
    const coverShape = sdf.box([0.105, 0.15, 0.036], 0.008);
    const pagesCut = sdf.box([0.11, 0.136, 0.024]).at(0.008, 0, 0);
    const frame = (w: number, h: number) => sdf.extrude(profile.rect([w, h], 0.008), 0.02).at(0.005, 0, 0.018);
    const bookLocal = sdf
      .union(coverShape.subtract(pagesCut), sdf.box([0.1, 0.136, 0.024], 0.003).at(0.004, 0, 0).paint(C.pages))
      .paintWhere(frame(0.078, 0.118), C.gold, 0.002)
      .paintWhere(frame(0.07, 0.11), C.cover, 0.002)
      .paintWhere(sdf.box([0.02, 0.2, 0.1]).at(-0.0525, 0, 0), C.gold, 0.002);
    k.body('book', bookPose(bookLocal), { color: C.cover, roughness: 0.6, bone: 'hand.L', textureDensity: 1.5 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys, reach, orient } = motion;
    const ease = (a: number, b: number, x: number) => {
      const t = clamp01((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        skirt: { rotate: [1.2 * wave(p, 1, 0.2), 0, 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        'forearm.R': { rotate: [-3 * bump(p), 0, 0] },
        braid: { rotate: [1.5 * wave(p, 1, 0.3), 0, 1 * wave(p)] },
        spirit: { move: [0.004 * wave(p, 1, 0.3), 0.014 * wave(p, 1, 0.1), 0.006 * wave(p, 2)] },
      }),
    });

    // A calm, short stride under the long robe: the skirt lags the hips' turn. The legs come from
    // motion.gait: planted stance feet, a knee lift in the swing, heel strike and toe-off. `step` is
    // the foot travel, `lift` the swing height, `duty` the share of the cycle a foot is down (a run
    // has a flight between steps), `hop` the hips bob. The sole points are the shoe's heel and toe.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, 4 * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, { // left heel strike at 0.25, with the left arm back
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.094, 0, -0.035],
          toe: [0.115, 0, 0.12],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          skirt: { rotate: [lean * 0.4 + 2 * wave(p, 2, 0.1), -4 * wave(p, 1, 0.12), 2 * wave(p, 1, 0.3)] as const },
          spine: { rotate: [lean, 0, -2 * s] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, -2 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.2 * s, 0, 2] as const },
          'upperarm.R': { rotate: [-armSwing * 0.1 * s, 0, -3] as const },
          braid: { rotate: [3 * wave(p, 2, 0.2) + lean * 0.5, 0, 2 * wave(p, 1, 0.1)] as const },
          spirit: { move: [0, 0.01 * wave(p, 2, 0.1), 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.022, 0.6, 22, 2, 0.006));
    k.animation('run', stride(0.58, 0.13, 0.04, 0.4, 38, 9, 0.025));

    // Posing by targets: the wrist follows keys in the chest's rest frame (reach). The open right
    // hand keeps its rest turn against the forearm, so the palm stays up while the arm moves.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const BOOK = { dir: norm(bookDir([0, 1, 0])), up: norm(bookDir([0, 0, 1])) };
    const armPose = (wrist: V3, pole: V3 = [-0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_R, wrist, pole);
      // The wrist turns back against the arm's tilt, so the palm stays level under the spirit.
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: [-(arm.upper[0] + arm.lower[0]), 0, 0] as const } };
    };
    const bookPoseAt = (wrist: V3, dir: V3, up: V3, pole: V3 = [0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      const hand = orient([arm.upper, arm.lower], BOOK, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };

    // attack (the summon): the right arm rises beside him, palm up, the spirit orbits once around
    // above the hand, and a green flash flares out of it, pulses, and fades. He leans back and looks
    // up at it; the book arm draws in.
    const RAISED: V3 = [-0.29, 0.5, 0.15];
    k.animation('attack', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const raise = ease(0.03, 0.3, p) * (1 - ease(0.72, 0.98, p));
        const flash = ease(0.34, 0.42, p) * (1 - ease(0.52, 0.74, p));
        const pulse = 0.3 * bump(clamp01((p - 0.38) / 0.22), 2);
        const orbit = ease(0.3, 0.78, p) * 2 * Math.PI;
        const r = 0.075 * ease(0.3, 0.4, p) * (1 - ease(0.7, 0.78, p));
        const fs = 1 + (0.9 + pulse) * flash;
        const ss = 1 + 0.1 * flash;
        return {
          ...armPose(lerp(WRIST_R, RAISED, raise)),
          spirit: { move: [r * (1 - Math.cos(orbit)) + 0.01 * flash, 0.02 * flash, r * Math.sin(orbit)], scale: [ss, ss, ss] },
          flare: { scale: [fs, fs, fs] },
          ...bookPoseAt(lerp(WRIST_L, [0.24, 0.275, 0.1], raise), BOOK.dir, BOOK.up),
          hips: { move: [0, -0.004 * raise, 0] },
          skirt: { rotate: [2 * raise, 0, 0] },
          spine: { rotate: [-3 * raise, 0, -2 * raise] },
          chest: { rotate: [-3 * raise, 5 * raise, -3 * raise] },
          head: { rotate: [-4 * raise, 10 * raise, 0] },
          braid: { rotate: [4 * bump(clamp01(p * 1.4)), 0, 3 * raise] },
        };
      },
    });

    // attack2 (the spirit dash): the arm lifts a little, the spirit darts forward, flashing, and
    // returns to the open palm. He leans into the throw; the book stays at his side.
    k.animation('attack2', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const lift = ease(0.04, 0.24, p) * (1 - ease(0.82, 1, p));
        const dash = ease(0.26, 0.42, p) * (1 - ease(0.5, 0.78, p));
        const glow = bump(clamp01((p - 0.28) / 0.34), 2);
        const ss = 1 + 0.25 * glow;
        const fs = 1 + 0.9 * glow;
        return {
          ...armPose(lerp(WRIST_R, [-0.25, 0.3, 0.12], lift)),
          spirit: { move: [0.02 * dash, 0.02 * dash, 0.3 * dash], scale: [ss, ss, ss] },
          flare: { scale: [fs, fs, fs] },
          hips: { move: [0, -0.006 * lift, 0], rotate: [0, -4 * lift, 0] },
          skirt: { rotate: [-2 * lift, 0, 0] },
          spine: { rotate: [3 * dash, 0, 0] },
          chest: { rotate: [4 * dash, 6 * lift, 0] },
          head: { rotate: [-3 * lift, 4 * lift, 0] },
          braid: { rotate: [-4 * dash, 0, 2 * lift] },
        };
      },
    });

    // hit: the head and chest snap back from a blow, a small step back, a quick return. The right arm
    // swings back.
    k.animation('hit', {
      duration: 0.42,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        return {
          hips: { move: [0, -0.006 * h, -0.025 * h], rotate: [0, 6 * h, 0] },
          skirt: { rotate: [6 * h, 0, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, -3 * h] },
          head: { rotate: [-14 * h, -8 * h, 4 * h] },
          ...armPose(lerp(WRIST_R, [-0.24, 0.29, 0.04], h)),
          braid: { rotate: [8 * h, 0, 5 * h] },
          'upperarm.L': { rotate: [-6 * h, 0, 16 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger back, the knees give, and he falls flat on his back. Both arms fling out to
    // the sides as he lands; the right arm lies out beside him
    // feet, the book beside his left. The robe skirt follows the legs.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(clamp01((p - 0.66) / 0.16));
        const fling = ease(0.2, 0.62, p);
        // The keys are in the chest's rest frame; lying down, that frame is turned 84 degrees back,
        // so chest +Z is world up.
        const staffArm = armPose(
          keys(p, [[0, WRIST_R], [0.3, [-0.27, 0.32, 0.09]], [0.66, [-0.285, 0.33, -0.09]]] as const),
          [-0.3, 0.2, -0.4],
        );
        const bookArm = bookPoseAt(
          lerp(WRIST_L, [0.31, 0.36, 0.0], fling),
          norm(lerp(BOOK.dir, norm([0.78, 0.62, 0]), fling)),
          norm(lerp(BOOK.up, [0, 0, 1], fling)),
          [0.3, 0.2, -0.4],
        );
        const legL = 6 * stagger + 16 * bump(fall) + 22 * fall;
        const legR = -6 * stagger + 18 * bump(fall) + 24 * fall;
        return {
          ...staffArm,
          ...bookArm,
          // The spirit fades out as he falls.
          spirit: { scale: [1 - 0.96 * ease(0.25, 0.6, p), 1 - 0.96 * ease(0.25, 0.6, p), 1 - 0.96 * ease(0.25, 0.6, p)] as const },
          hips: {
            move: [0, -0.034 * fall * fall + 0.02 * bump(fall) + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall],
            rotate: [-86 * fall - 4 * stagger, 0, 0],
          },
          skirt: { rotate: [0.8 * (legL + legR) * 0.5, 0, 0] },
          spine: { rotate: [-6 * stagger + 2 * fall, 0, 0] },
          chest: { rotate: [-4 * stagger, 0, 0] },
          neck: { rotate: [4 * fall, 0, 0] },
          head: { rotate: [-16 * stagger + 6 * fall, 18 * fall, 0] },
          // The legs lag the fall (they stay under him), then lie out along the ground.
          'leg.L': { rotate: [legL, 0, 5 * fall] },
          'leg.R': { rotate: [legR, 0, -6 * fall] },
          'foot.L': { rotate: [-12 * fall, 0, 0] },
          'foot.R': { rotate: [-16 * fall, 0, 0] },
        };
      },
    });

    // victory: a jump on both knees. He crouches (both feet flat), pushes off, and at the top of the
    // jump thrusts the open hand up beside his head (out on the right, never over it); the book stays
    // at his side. He lands on both feet, the knees absorb it, he stands up, and lifts the spirit twice.
    // The hips' height is a cubic Hermite curve through knots [phase, meters, slope per phase]: the
    // flight is an exact parabola (peak JUMP, FLY phases long), and the ground parts build the
    // take-off speed out of the crouch and carry the landing speed into the absorb.
    const JUMP = 0.095;
    const FLY = 0.17;
    const OFF = 0.2; // the take-off
    const TOP = OFF + FLY / 2;
    const LAND = OFF + FLY;
    const V = (4 * JUMP) / FLY;
    const VICTORY_Y: readonly (readonly [number, number, number])[] = [
      [0, 0, 0],
      [0.13, -0.04, 0], // the crouch: the hips down 4 cm, the knees bent, both feet flat
      [OFF, 0, V], // the push-off: the legs straight, the feet leave the ground
      [TOP, JUMP, 0], // the top of the jump
      [LAND, 0, -V], // both feet land
      [LAND + 0.07, -0.035, 0], // the knees absorb it
      [LAND + 0.21, 0, 0], // he stands up
    ];
    const victoryY = (p: number) => {
      const last = VICTORY_Y[VICTORY_Y.length - 1]!;
      if (p <= 0 || p >= last[0]) return 0;
      let i = 0;
      while (p > VICTORY_Y[i + 1]![0]) i++;
      const [t0, y0, m0] = VICTORY_Y[i]!;
      const [t1, y1, m1] = VICTORY_Y[i + 1]!;
      const s = t1 - t0;
      const u = (p - t0) / s;
      const u2 = u * u;
      const u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * m0 * s + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * m1 * s;
    };
    /**
     * One leg, solved by its ankle's target in the hips' rest frame (`lift` above the rest ankle,
     * `back` behind it). reach bends the knee forward, and the foot gets the opposite turn (plus
     * `pitch`, toe down) so the sole stays level.
     */
    const legTo = (right: boolean, lift: number, back: number, pitch: number) => {
      const f = (v: V3) => (right ? mx(v) : v);
      const leg = reach({ root: f(HIP), mid: f(KNEE), end: f(ANKLE) }, f(add(ANKLE, [0, lift, -back])), f([HIP[0] + 0.02, KNEE[1], 0.3]));
      const foot = motion.euler(motion.quat(leg.upper).multiply(motion.quat(leg.lower)).invert().multiply(motion.quat([pitch, 0, 0])));
      return { leg: leg.upper, shin: leg.lower, foot };
    };
    k.animation('victory', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const up = ease(0.08, TOP, p); // the thrust: the hand is highest at the top of the jump
        const pump = bump(clamp01((p - 0.5) / 0.46), 2);
        const hipsY = victoryY(p) - 0.006 * pump;
        const crouch = Math.max(0, -hipsY) / 0.04; // 1 in the deep crouch
        // In the air the knees tuck a little (the ankles up and back) and the toes point down.
        const tuck = p > OFF && p < LAND ? Math.sin((Math.PI * (p - OFF)) / FLY) : 0;
        const lift = Math.max(0, -hipsY) + 0.016 * tuck;
        const legsL = legTo(false, lift, 0.01 * tuck, 16 * tuck);
        const legsR = legTo(true, lift, 0.01 * tuck, 14 * tuck);
        // The right arm reaches up and out to the side, so the sunburst stays clear of the hair.
        const wrist: V3 = [-0.3 - 0.01 * pump, 0.5 + 0.01 * pump, 0.12 + 0.01 * pump];
        // In the crouch he pulls the hand up a little.
        const load = p < OFF ? crouch : 0;
        return {
          ...armPose(add(lerp(WRIST_R, wrist, up), [0, 0.03 * load, -0.01 * load])),
          spirit: { move: [0, 0.02 * pump, 0] },
          braid: { rotate: [-6 * up + 5 * pump, 0, 0] },
          ...bookPoseAt(lerp(WRIST_L, [0.245, 0.29, 0.1], up), BOOK.dir, BOOK.up),
          hips: { move: [0, hipsY, 0] },
          skirt: { rotate: [0.5 * (legsL.leg[0] + legsR.leg[0]) * 0.5 + 6 * tuck, 0, 0] },
          spine: { rotate: [5 * crouch - 5 * up, 0, 0] },
          chest: { rotate: [-4 * up - 3 * pump, -6 * up, -3 * up] },
          head: { rotate: [-10 * up - 4 * crouch, -4 * up, -2 * up] },
          'leg.L': { rotate: legsL.leg },
          'shin.L': { rotate: legsL.shin },
          'foot.L': { rotate: legsL.foot },
          'leg.R': { rotate: legsR.leg },
          'shin.R': { rotate: legsR.shin },
          'foot.R': { rotate: legsR.foot },
        };
      },
    });
  },
});
