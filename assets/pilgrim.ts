import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Pilgrim — Chibi Quest P1 hero, about 1.05 m to the top of the straw hat, faces +Z. Base:
 * assets/priest.ts (skeleton, knee bones, clip set, the rogue's young round beardless face).
 * Target: docs/hero-mockups/pilgrim_001.jpg (one front view; the side and the back are designed here).
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the wide straw hat, the brown hood and
 *   cloak, the gourd, and the belled staff must read; the face shows under the hat brim.
 * One idea: a humble young traveler under a huge shallow cone of straw, in a brown hood and cloak,
 *   a gourd flask at the belly and a gnarled staff with a brass bell in the right hand.
 * Silhouette: the hat brim is more than twice as wide as the head; under it a small round body in a
 *   knee-long tunic, a cloak hanging behind the arms, the staff beside the right shoulder.
 * Proportions: hat rim r 0.36 at y 0.85, crown r 0.22, tip 1.06; eyes 0.628; chin 0.48; shoulders
 *   0.385; tunic hem 0.15; cloak hem 0.2; staff 0.0 to 0.78 with the bell near the top.
 * Palette (60/30/10): brown hood, cloak, and tunic (#7a5a40, #8a6a4a); straw hat #c8a868 with a
 *   #a08848 underside; accents gold badge #e0b040, olive gourd #b8b060, green shoe straps #6a8a3a.
 * Bodies: skin, hair (with the brows), hood (with the cowl), hat, tunic, tunic-trim, cloak, belt, badge,
 *   sleeves, pants, shoes, straps, staff, brass, bell, chime, gourd, gourd-trim.
 * Rig: the priest's skeleton without the relic bone; `sun` becomes `bell` (scaled up in the attack)
 *   and `hat` (a rigid pivot on the head that lets the hat roll off in the death). The staff is
 *   rigid on the right hand, the gourd on the left hand. Clips: idle, walk, run, attack (a staff
 *   tap with a bell chime), attack2 (a gourd toss), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#a8702f',
  pupil: '#141a18',
  lid: '#1c130f',
  mouth: '#a4503f',
  nose: '#f0a890',
  hair: '#2e1e14',
  straw: '#c8a868',
  strawDark: '#a08848',
  cloak: '#6b4a30',
  tunic: '#b08a5c',
  tunicDark: '#8e6c44',
  rope: '#d2ba8a',
  ropeDark: '#8a6c3c',
  gold: '#e0b040',
  pants: '#6a5034',
  shoe: '#8a6a4a',
  sole: '#4a3422',
  strap: '#6a8a3a',
  staff: '#3a2418',
  brass: '#c9a24a',
  gourd: '#9a8a3a',
  gourdLow: '#7a6c2c',
  cord: '#6b4226',
  cork: '#c8a878',
  chime: '#fff0b8',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const shade = (base: Parameters<typeof mixRgb>[0], t = 0.3) => mixRgb(base, rgb('#1c120a'), t);

// Joints: the priest's. The right fist holds the staff upright beside the hip, the left fist the gourd.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.322, -0.01];
const WRIST_R: V3 = [-0.245, 0.248, 0.068];
const ELBOW_L: V3 = [0.19, 0.322, -0.01];
const WRIST_L: V3 = [0.225, 0.248, 0.068];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
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
const HAND_R = { pitch: -70, roll: 14 };
const HAND_L = { pitch: -70, roll: 20 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);
const GRIP = handPoint(HAND_R, WRIST_R, [-0.008 * FIST, -0.044 * FIST, 0.004 * FIST]);
const STAFF_AXIS = norm(rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll));
const STAFF_FACE = norm(rotZ(rotX([0, 0, 1], 90 + HAND_R.pitch), HAND_R.roll)); // the side the bell hangs on

// The staff: the butt just above the floor, the top above the grip; the bell hangs from a ring near the top.
const STAFF_DOWN = (GRIP[1] - 0.022) / STAFF_AXIS[1];
const STAFF_UP = 0.81;
const staffAt = (t: number): V3 => add(GRIP, scl(STAFF_AXIS, t));
const BELL_AT = add(staffAt(STAFF_UP - 0.105), scl(STAFF_FACE, 0.036));

// The gourd: held at the belly by the left fist, the neck up and turned in toward the chest.
const GOURD_TURN = { y: 0, z: -12 };
const GOURD_AT: V3 = [0.225, 0.135, 0.1];
const gourdDir = (p: V3) => rotZ(rotY(p, GOURD_TURN.y), GOURD_TURN.z);
const gourdPoint = (p: V3): V3 => add(gourdDir(p), GOURD_AT);

export default defineAsset({
  name: 'pilgrim',
  description: 'Chibi young pilgrim hero under a wide straw hat, in a brown hood and cloak, with a gourd flask and a belled walking staff.',
  detail: 0.005,
  reference: 'docs/hero-mockups/pilgrim_001.jpg',
  variants: {
    eyes: { brown: C.iris, green: '#3d7a35', blue: '#2f6aa8' },
    hair: { black: C.hair, brown: '#4a2e1c', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    cloak: { brown: C.cloak, grey: '#6a6a60', olive: '#6a6a3a' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'black', skin: 'fair', cloak: 'brown' },
    grey: { eyes: 'blue', hair: 'brown', skin: 'tan', cloak: 'grey' },
    olive: { eyes: 'green', hair: 'auburn', skin: 'brown', cloak: 'olive' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      hair: k.tint('hair'),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      nose: k.tint('skin', { color: C.nose, follow: 0.5 }),
      cloak: k.tint('cloak'),
      cloakDark: k.tint('cloak', -0.28),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      skirt: { parent: 'hips', at: [0, 0.24, 0], tail: [0, 0.08, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      hat: { parent: 'head', at: [0, 0.85, 0] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      bell: { parent: 'hand.R', at: BELL_AT },
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
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const zAt = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
    const noseZ = faceZ(0, 0.568);
    const nose = sdf.ellipsoid([0.026, 0.022, 0.02]).at(0, 0.568, noseZ - 0.002).bone('head');
    // Small round human ears.
    const ears = pair(
      sdf
        .ellipsoid([0.025, 0.053, 0.042])
        .subtract(sdf.sphere(0.02).at(0.016, 0, 0.01))
        .rotateY(-40)
        .at(0.208, 0.6, -0.012)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

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
      handPose(HAND_L, WRIST_L)(fistLocal(1)).bone('hand.L'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.05, 0.051, 0.07]), EYE[0], EYE[1] + 0.003));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] + 0.004));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019)),
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
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(smile, T.mouth)
      .paintWhere(sdf.sphere(0.024).at(0, 0.57, noseZ + 0.03), T.nose, 0.016);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: a mass of tight curls
    // Fifteen short chain loops hug the skull inside the hood's opening, over a thin dark cap.
    const curl = (cx: number, cy: number, turn: number) => {
      const pts = Array.from({ length: 5 }, (_, i): [number, number, number, number] => {
        const a = (turn + i * 80) * rad;
        const rr = 0.016 * (1 - i * 0.14);
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        return [px, py, zAt(px, py) + 0.006, 0.0145 - i * 0.0008];
      });
      return sdf.chain(pts, 0.006);
    };
    const curlSpots: [number, number][] = [
      [-0.07, 0.845], [-0.024, 0.85], [0.024, 0.85], [0.07, 0.845],
      [-0.1, 0.805], [-0.05, 0.81], [0, 0.812], [0.05, 0.81], [0.1, 0.805],
      [-0.13, 0.772], [-0.085, 0.778], [0.085, 0.778], [0.13, 0.772],
      [-0.135, 0.707], [0.135, 0.707],
    ];
    const curls = sdf.union(...curlSpots.map(([cx, cy], i) => curl(cx, cy, (i * 137) % 360)));
    const hairCap = sdf
      .ellipsoid([HEAD[0] + 0.009, HEAD[1] + 0.009, HEAD[2] + 0.009])
      .at(0, HEAD_Y, 0)
      .intersect(sdf.ellipsoid([0.16, 0.27, 0.26]).at(0, 0.61, 0.22).round(0.004))
      .intersect(sdf.halfSpace([0, -1, 0], -0.715));
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
    const hairShape = sdf.union(curls, hairCap).union(brow(1), brow(-1));
    k.body('hair', hairShape, { color: T.hair, roughness: 0.55, detail: 0.004, bone: 'head', bump: (x, y, z) => 0.002 * Math.sin(Math.atan2(x, z + 0.06) * 14 + y * 30) });

    // ------------------------------------------------------------------ hood and shoulder cape
    // The hood: a cloth cap 0.028 over the skull, open from the brow down at the face, framed by a raised
    // rim 0.02 thick; a gathered crown under the hat; a tail that flows into a short shoulder cape
    // hanging to the elbow line, with two fold lines.
    const opening = sdf.ellipsoid([0.16, 0.27, 0.26]).at(0, 0.61, 0.22);
    const hoodCap = sdf.ellipsoid([HEAD[0] + 0.028, HEAD[1] + 0.028, HEAD[2] + 0.03]).at(0, HEAD_Y + 0.005, -0.006);
    const hoodBase = sdf
      .smoothUnion(
        0.04,
        hoodCap,
        sdf.ellipsoid([0.17, 0.1, 0.16]).at(0, 0.91, -0.01),
        sdf.chain(
          [
            [0, 0.66, -0.17, 0.06],
            [0, 0.56, -0.2, 0.06],
            [0, 0.47, -0.17, 0.065],
          ],
          0.03,
        ),
        sdf.ellipsoid([0.19, 0.1, 0.15]).at(0, 0.5, -0.05),
      )
      .smoothSubtract(0.018, opening)
      .smoothSubtract(0.012, pair(sdf.ellipsoid([0.06, 0.075, 0.075]).at(0.215, 0.6, -0.012)));
    const hoodRim = hoodCap.round(0.02).intersect(opening.round(0.026).subtract(opening.round(0.002)));
    const liningBand = opening.round(0.022).subtract(opening.round(-0.012));
    const hoodShape = hoodBase
      .smoothUnion(0.008, hoodRim)
      .paintWhere(liningBand, T.cloakDark, 0.008)
      .bone('head');
    const CAPE_TOP = 0.47;
    const CAPE_HEM = 0.325;
    const capeSolid = (inset: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, CAPE_TOP - inset],
              [0.07 - inset, CAPE_TOP - inset - 0.002],
              [0.12 - inset, CAPE_TOP - inset - 0.02],
              [0.17 - inset, CAPE_TOP - inset - 0.05],
              [0.206 - inset, CAPE_TOP - inset - 0.09],
              [0.232 - inset, CAPE_TOP - inset - 0.13],
              [0.238 - inset, CAPE_HEM],
              [0.238 - inset, CAPE_HEM - 0.1],
              [0, CAPE_HEM - 0.1],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.9]);
    // Two fold lines run down the back and sides of the cape (at about 130 degrees from the front).
    const capeFold = (x: number, z: number) => Math.exp(-(((Math.abs(Math.atan2(x, z)) - 2.3) / 0.07) ** 2));
    const capeShape = capeSolid(0)
      .intersect(sdf.halfSpace([0, -1, 0], -CAPE_HEM))
      .subtract(capeSolid(0.014))
      .smoothSubtract(0.02, sdf.box([0.11, 0.4, 0.3], 0.02).at(0, 0.36, 0.15))
      .paintFn((x, y, z, base) => (y < CAPE_HEM + 0.016 || capeFold(x, z) > 0.45 ? shade(base, 0.35) : base))
      .bone('chest');
    k.body('hood', sdf.union(hoodShape, capeShape), {
      color: T.cloak,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 40, y * 40, z * 40, 2) + (y < CAPE_TOP && y > CAPE_HEM ? 0.004 * capeFold(x, z) : 0),
    });

    // ------------------------------------------------------------------ the straw hat
    // A wide shallow cone with a soft rounded point and a wavy rim, 0.03 thick vertically, tilted up
    // 8 degrees at the front. The rim r 0.36, the crown (where it sits on the hood) r about 0.22.
    const hatExt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 1.058],
            [0.05, 1.054],
            [0.1, 1.036],
            [0.16, 1.0],
            [0.2, 0.97],
            [0.27, 0.925],
            [0.33, 0.885],
            [0.36, 0.858],
            [0.44, 0.8],
            [0.5, 0.75],
            [0.5, 0.7],
            [0, 0.7],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .displace(0.01, (x, y, z) => {
        const r = Math.hypot(x, z);
        const w = Math.min(1, Math.max(0, (r - 0.2) / 0.16));
        const a = Math.atan2(x, z);
        return w * (0.7 * Math.sin(a * 4 + 0.6) + 0.35 * Math.sin(a * 7 + 2));
      });
    // The rim: a cylinder wall with a low wave in its radius.
    const hatRim = sdf.cylinder(0.36, 0.6).at(0, 0.9, 0).displace(0.012, (x, _y, z) => {
      const a = Math.atan2(x, z);
      return 0.7 * Math.sin(a * 5 + 1) + 0.4 * Math.sin(a * 9 + 0.3);
    });
    const hatBody = hatExt.intersect(hatRim);
    const strawTop = hatBody.subtract(hatExt.at(0, -0.012, 0)).paint(C.straw);
    const strawUnder = hatBody.intersect(hatExt.at(0, -0.012, 0)).subtract(hatExt.at(0, -0.03, 0)).paint(C.strawDark);
    const hatPose = (s: sdf.Shape) => s.at(0, -0.9, 0).rotateX(-8).at(0, 0.92, 0);
    k.body('hat-straw', hatPose(sdf.union(strawTop, strawUnder)), {
      color: C.straw,
      roughness: 0.95,
      detail: 0.005,
      bone: 'hat',
      bump: (x, y, z) => {
        const r = Math.hypot(x, z);
        const a = Math.atan2(x, z);
        return 0.0035 * Math.sin(a * 13 + r * 6) + 0.0018 * Math.sin(r * 140) + 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 2);
      },
    });

    // ------------------------------------------------------------------ the tunic, belt, and badge
    const tunicShape = sdf
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
            [0.158, 0.19],
            [0.166, 0.158],
            [0.164, 0.15],
            [0, 0.15],
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
    const tunicPainted = tunicShape.paintFn((x, y, z, base) => (Math.sin(Math.atan2(x, z) * 7 + y * 3) > 0.9 ? rgb(C.tunicDark) : base));
    k.body('tunic', banded(tunicPainted), {
      color: C.tunic,
      roughness: 0.88,
      detail: 0.006,
      bump: (x, y, z) => 0.002 * Math.sin(Math.atan2(x, z) * 7 + y * 3) + 0.0015 * noise.fbm(x * 30, y * 30, z * 30, 2),
    });
    // A rolled hem and a neck band: darker rims so the tunic reads as its own piece.
    const hemBand = tunicShape
      .round(0.007)
      .smoothIntersect(0.004, sdf.box([0.6, 0.032, 0.6], 0.004).at(0, 0.168, 0))
      .bone('skirt');
    k.body('tunic-trim', hemBand, { color: C.tunicDark, roughness: 0.9, detail: 0.005 });

    // The rope belt with a twist and a hanging knot (the knot a little right of the front).
    const BELT_Y = 0.258;
    const BELT_R = 0.148;
    const beltZ = sdf.raycast(tunicShape, [0.05, BELT_Y, 1], [0, 0, -1])![2];
    const belt = sdf
      .union(
        sdf.torus(BELT_R, 0.012).scale([1, 1, 0.86]).at(0, BELT_Y, 0).bone('spine'),
        sdf.sphere(0.019).scale([1, 0.85, 0.9]).at(0.05, BELT_Y - 0.004, beltZ + 0.012).bone('spine'),
        sdf.chain(
          [
            [0.046, BELT_Y - 0.01, beltZ + 0.014, 0.0095],
            [0.04, BELT_Y - 0.036, beltZ + 0.016, 0.009],
            [0.042, BELT_Y - 0.062, beltZ + 0.014, 0.0075],
          ],
          0.008,
        ).bone('skirt'),
        sdf.chain(
          [
            [0.056, BELT_Y - 0.01, beltZ + 0.014, 0.0095],
            [0.064, BELT_Y - 0.03, beltZ + 0.016, 0.009],
            [0.06, BELT_Y - 0.052, beltZ + 0.014, 0.0075],
          ],
          0.008,
        ).bone('skirt'),
      )
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(x, z) * 48 + Math.atan2(y - BELT_Y, Math.hypot(x, z) - BELT_R) * 2) > 0.3 ? rgb(C.ropeDark) : base));
    k.body('belt', belt, {
      color: C.rope,
      roughness: 0.95,
      detail: 0.004,
      bump: (x, y, z) => 0.0022 * Math.sin(Math.atan2(x, z) * 48 + Math.atan2(y - BELT_Y, Math.hypot(x, z) - BELT_R) * 2),
    });

    // The gold scallop-shell badge: a fan with a scalloped edge and ribs, on the chest under the staff arm.
    const BADGE: [number, number] = [-0.088, 0.225];
    const badgeZ = sdf.raycast(tunicShape, [BADGE[0], BADGE[1], 1], [0, 0, -1])![2];
    const fanPts: [number, number][] = [[-0.008, -0.03], [0.008, -0.03]];
    for (let i = 0; i <= 20; i++) {
      const a = (18 + (i * 144) / 20) * rad;
      const lobe = 0.0345 + 0.005 * Math.abs(Math.cos((i / 20) * Math.PI * 5));
      fanPts.push([Math.cos(a) * lobe, Math.sin(a) * lobe - 0.018]);
    }
    const fan = sdf.extrude(profile.polygon(fanPts), 0.012, 0.002);
    const ribs = sdf.union(
      ...[-56, -28, 0, 28, 56].map((d) => {
        const a = (90 + d) * rad;
        return sdf.capsule([0, -0.02, 0.008], [Math.cos(a) * 0.045, Math.sin(a) * 0.045 - 0.02, 0.008], 0.0016);
      }),
    );
    const badge = fan.subtract(ribs).smoothUnion(0.004, sdf.sphere(0.006).at(0, -0.03, 0.004)).rotateZ(180);
    k.body('badge', badge.at(BADGE[0], BADGE[1], badgeZ + 0.001).bone('spine'), { color: C.gold, roughness: 0.3, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the cloak
    // A hooded travel cloak: a shell from the shoulders to y 0.2 behind and at the sides, open at the front.
    const cloakSolid = (inset: number, top: number, bottom: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, top],
              [0.1 - inset, top - 0.004],
              [0.15 - inset, top - 0.02],
              [0.174 - inset, top - 0.05],
              [0.19 - inset, top - 0.1],
              [0.208 - inset, top - 0.16],
              [0.222 - inset, top - 0.22],
              [0.232 - inset, bottom],
              [0.232 - inset, bottom - 0.12],
              [0, bottom - 0.12],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.88]);
    const frontCut = sdf.box([0.2, 0.5, 0.3], 0.03).at(0, 0.3, 0.15);
    const cloakShape = cloakSolid(0, 0.44, 0.2)
      .intersect(sdf.halfSpace([0, -1, 0], -0.2))
      .subtract(cloakSolid(0.015, 0.428, 0.2))
      .smoothSubtract(0.02, frontCut)
      .paintFn((x, y, z, base) => (y < 0.225 || Math.sin(Math.atan2(x, z) * 8 + y * 5) > 0.72 ? shade(base) : base));
    k.body('cloak', banded(cloakShape), {
      color: T.cloak,
      roughness: 0.92,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(x, z) * 8 + y * 5) + 0.0015 * noise.fbm(x * 30, y * 30, z * 30, 2),
    });

    // ------------------------------------------------------------------ sleeves
    const sleeve = (sh: V3, el: V3, wr: V3, up: string, fore: string) => {
      const inner = lerp(sh, [0, sh[1], 0], 0.25);
      return sdf.smoothUnion(
        0.02,
        sdf.cone(inner, el, 0.05, 0.054).bone(up),
        sdf.cone(el, wr, 0.054, 0.05).bone(fore),
        sdf.cone(lerp(el, wr, 0.68), lerp(el, wr, 1.12), 0.058, 0.056).paint(C.tunicDark).bone(fore),
      );
    };
    k.body('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R')), {
      color: C.tunic,
      roughness: 0.88,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ legs, cuffs, shoes
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.08]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0], 0.085, 0.004], 0.05).bone('leg.L')),
    );
    const cuffs = pair(sdf.torus(0.052, 0.015).at(0.094, 0.113, 0.003).bone('shin.L'));
    k.body('pants', sdf.union(pants, cuffs.paint(C.tunicDark)), { color: C.pants, roughness: 0.88, detail: 0.005 });
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.05, 0.08, 0.02).at(0, 0.055, 0), sdf.ellipsoid([0.058, 0.05, 0.095]).at(0, 0.04, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shoePlace = (s: sdf.Shape) => s.rotateY(8).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('shoes', pair(shoePlace(shoeFoot.paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.sole))), { color: C.shoe, roughness: 0.6 });
    // Green straps: a band over the instep and a band at the ankle.
    const strapBand = (z: number, h: number, yMin: number) =>
      shoeFoot
        .round(0.006)
        .smoothIntersect(0.003, sdf.box([0.3, 0.3, h], 0.003).at(0, 0.1, z))
        .intersect(sdf.halfSpace([0, -1, 0], -yMin));
    const straps = sdf.union(strapBand(0.05, 0.022, 0.04), strapBand(-0.012, 0.018, 0.05));
    k.body('straps', pair(shoePlace(straps)), { color: C.strap, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ the gnarled staff (right hand)
    const e1 = norm(cross([0, 0, 1], STAFF_AXIS));
    const e2 = cross(STAFF_AXIS, e1);
    const shaftPts: [number, number, number, number][] = Array.from({ length: 18 }, (_, i) => {
      const t = -STAFF_DOWN + ((STAFF_DOWN + STAFF_UP) * i) / 17;
      const w = add(scl(e1, 0.0055 * Math.sin(t * 17)), scl(e2, 0.005 * Math.cos(t * 12 + 1)));
      const p = add(staffAt(t), w);
      return [p[0], p[1], p[2], 0.0145 + 0.0025 * Math.sin(t * 23)];
    });
    const knot = (t: number, r: number) => sdf.ellipsoid([r, r * 1.25, r]).at(...staffAt(t));
    const ringAt = staffAt(STAFF_UP - 0.075);
    const staff = sdf
      .smoothUnion(
        0.012,
        sdf.chain(shaftPts, 0.02),
        knot(0.14, 0.022),
        knot(0.42, 0.021),
        knot(0.66, 0.019),
        sdf.sphere(0.027).at(...staffAt(STAFF_UP - 0.008)), // the round knob at the top
      )
      .paintFn((x, y, z, base) => (Math.sin(y * 70 + Math.atan2(x + 0.23, z - 0.1) * 3) > 0.7 ? rgb('#2a1810') : base));
    k.body('staff', staff, {
      color: C.staff,
      roughness: 0.7,
      detail: 0.004,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0025 * noise.fbm(x * 60, y * 20, z * 60, 2),
    });
    // Brass: a small cap on the knob, a ferrule at the foot, a ring with a short link for the bell.
    const brass = sdf.union(
      sdf.cone(staffAt(STAFF_UP + 0.008), staffAt(STAFF_UP + 0.05), 0.0205, 0.004),
      sdf.torus(0.0195, 0.0055).at(...ringAt),
      sdf.capsule(add(ringAt, scl(STAFF_FACE, 0.019)), add(BELL_AT, [0, 0.022, 0]), 0.0042),
      sdf.capsule(staffAt(-STAFF_DOWN + 0.014), staffAt(-STAFF_DOWN + 0.07), 0.0185),
    );
    k.body('brass', brass, { color: C.brass, roughness: 0.32, metalness: 0.85, detail: 0.003, bone: 'hand.R' });
    // The bell: a flared cup with a clapper; it scales up in the attack with a small ring puff.
    const bellLocal = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.026],
            [0.008, 0.025],
            [0.016, 0.017],
            [0.02, 0.004],
            [0.026, -0.012],
            [0.027, -0.018],
            [0.012, -0.016],
            [0, -0.014],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .union(sdf.sphere(0.008).at(0, -0.022, 0));
    k.body('bell-brass', bellLocal.at(...BELL_AT), { color: C.brass, roughness: 0.3, metalness: 0.9, detail: 0.003, bone: 'bell' });
    k.body('chime', sdf.torus(0.011, 0.0042).at(...BELL_AT), {
      color: '#6a5020',
      roughness: 0.5,
      emissive: C.chime,
      emissiveIntensity: 1.6,
      detail: 0.003,
      bone: 'bell',
    });

    // ------------------------------------------------------------------ the gourd flask (left hand)
    const gourdPose = (s: sdf.Shape) => s.rotateY(GOURD_TURN.y).rotateZ(GOURD_TURN.z).at(...GOURD_AT);
    const gourdLocal = sdf
      .smoothUnion(0.02, sdf.sphere(0.045), sdf.sphere(0.03).at(0, 0.058, 0), sdf.cylinder(0.014, 0.03, 0.004).at(0, 0.088, 0))
      .paintWhere(sdf.sphere(0.06).at(0, -0.066, 0), C.gourdLow, 0.012)
      .scale(1.45);
    k.body('gourd', gourdPose(gourdLocal), {
      color: C.gourd,
      roughness: 0.7,
      detail: 0.004,
      bone: 'hand.L',
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });
    const gourdTrimLocal = sdf
      .union(
        sdf.cylinder(0.0165, 0.024, 0.005).at(0, 0.11, 0).paint(C.cork),
        sdf.torus(0.0175, 0.0065).at(0, 0.082, 0).paint(C.cord), // the brown neck band
        sdf.torus(0.011, 0.0028).rotateX(90).at(0, 0.09, 0.02).paint(C.cord),
      )
      .scale(1.45);
    // A cord from the neck band to the belt.
    const cordA = gourdPoint([0.03, 0.12, 0.0]);
    const cordC: V3 = [0.125, 0.258, 0.072];
    const cordB = add(lerp(cordA, cordC, 0.5), [0.005, -0.028, 0.012]);
    const cord = sdf.chain(
      [
        [...cordA, 0.0055],
        [...cordB, 0.0048],
        [...cordC, 0.0048],
      ],
      0.01,
    ).paint(C.cord);
    k.body('gourd-trim', sdf.union(gourdPose(gourdTrimLocal), cord), { color: C.cord, roughness: 0.85, detail: 0.003, bone: 'hand.L' });

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
        hat: { rotate: [1 * wave(p, 1, 0.4), 0, 0.6 * wave(p, 1, 0.1)] },
        'forearm.R': { rotate: [-3 * bump(p), 0, 0] },
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
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          skirt: { rotate: [lean * 0.4 + 2 * wave(p, 2, 0.1), -4 * wave(p, 1, 0.12), 2 * wave(p, 1, 0.3)] as const },
          spine: { rotate: [lean, 0, -2 * s] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, -2 * s] as const },
          hat: { rotate: [1.2 * wave(p, 2, 0.3), 0, 1 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.2 * s, 0, 2] as const },
          'upperarm.R': { rotate: [-armSwing * 0.35 * s, 0, armSwing > 30 ? 0 : 2] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.022, 0.6, 22, 2, 0.006));
    k.animation('run', stride(0.58, 0.13, 0.04, 0.4, 38, 9, 0.025));

    // Posing by targets: the wrist follows keys in the chest's rest frame (reach), and the hand turns
    // so the staff (or the gourd) points along its own keys (orient).
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const STAFF = { dir: STAFF_AXIS, up: STAFF_FACE };
    const GOURD = { dir: norm(gourdDir([0, 1, 0])), up: norm(gourdDir([0, 0, 1])) };
    const staffPose = (wrist: V3, dir: V3, up: V3, pole: V3 = [-0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], STAFF, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    const gourdPoseAt = (wrist: V3, dir: V3, up: V3, pole: V3 = [0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      const hand = orient([arm.upper, arm.lower], GOURD, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };

    // attack: a staff tap. He lifts the staff a little and forward, plants it in front of him with a
    // thump, and the bell chimes: it swells and a small ring puffs out of it. Then he draws it back.
    const TILTED = norm([-0.12, 0.75, 0.65]);
    k.animation('attack', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const lift = ease(0.06, 0.3, p) * (1 - ease(0.34, 0.4, p));
        const tap = ease(0.34, 0.4, p) * (1 - ease(0.66, 0.92, p));
        const chime = ease(0.38, 0.44, p) * (1 - ease(0.52, 0.86, p));
        const pulse = 0.4 * bump(clamp01((p - 0.4) / 0.4), 2);
        const wrist = add(add(WRIST_R, scl([-0.012, 0.05, 0.03], lift)), scl([-0.012, 0.0, 0.05], tap));
        const dir = lerp(STAFF_AXIS, TILTED, clamp01(0.6 * lift + 0.95 * tap));
        const s = 1 + (1.6 + pulse) * chime;
        return {
          ...staffPose(wrist, dir, STAFF_FACE),
          bell: { scale: [s, s, s] },
          ...gourdPoseAt(lerp(WRIST_L, [0.232, 0.27, 0.08], tap), GOURD.dir, GOURD.up),
          hips: { move: [0, -0.006 * tap, 0] },
          skirt: { rotate: [1 * lift - 2 * tap, 0, 0] },
          spine: { rotate: [3 * tap - 1 * lift, 0, -2 * tap] },
          chest: { rotate: [3 * tap, -6 * tap, -2 * tap] },
          head: { rotate: [-2 * lift + 4 * tap, -6 * tap, -2 * tap] },
          hat: { rotate: [-2 * tap, 0, 0] },
        };
      },
    });

    // attack2: a gourd toss. He plants the staff, flicks the gourd up in front of the shoulder with
    // the left hand, and catches it again at the belly.
    k.animation('attack2', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const lift = ease(0.04, 0.3, p) * (1 - ease(0.8, 1, p));
        const wrist = keys(p, [
          [0, WRIST_L],
          [0.3, [0.3, 0.36, 0.1]],
          [0.42, [0.3, 0.41, 0.09]],
          [0.58, [0.3, 0.36, 0.1]],
          [0.7, [0.26, 0.3, 0.1]],
          [0.85, WRIST_L],
          [1, WRIST_L],
        ] as const);
        const turn = ease(0.0, 0.12, p) * (1 - ease(0.56, 0.82, p));
        const want = {
          dir: norm(lerp(GOURD.dir, norm([0.7, 0.7, 0.2]), turn)),
          up: norm(lerp(GOURD.up, norm([0.2, 0.2, 1]), turn)),
        };
        return {
          ...gourdPoseAt(wrist, want.dir, want.up, [0.6, 0.1, -0.3]),
          ...staffPose(
            keys(p, [[0, WRIST_R], [0.3, [-0.245, 0.27, 0.09]], [0.8, [-0.245, 0.27, 0.09]], [1, WRIST_R]] as const),
            lerp(STAFF_AXIS, norm([-0.22, 0.88, 0.42]), lift),
            STAFF_FACE,
          ),
          hips: { move: [0, -0.008 * lift, -0.006 * lift], rotate: [0, -6 * lift, 0] },
          skirt: { rotate: [-2 * lift, 3 * lift, 0] },
          spine: { rotate: [-3 * lift, 0, 0] },
          chest: { rotate: [-3 * lift, -10 * lift, 2 * lift] },
          head: { rotate: [-5 * lift, 8 * lift, 2 * lift] },
          'leg.L': { rotate: [-8 * lift, 0, 0] },
          'leg.R': { rotate: [5 * lift, 0, 0] },
          'foot.L': { rotate: [6 * lift, 0, 0] },
        };
      },
    });

    // hit: the head and chest snap back from a blow, a small step back, a quick return. The staff
    // swings out to the side, away from the head, and the hat jolts.
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
          hat: { rotate: [-6 * h, 0, 5 * h] },
          ...staffPose(lerp(WRIST_R, [-0.265, 0.29, 0.04], h), lerp(STAFF_AXIS, norm([-0.5, 0.85, -0.1]), h), STAFF_FACE),
          'upperarm.L': { rotate: [-6 * h, 0, 16 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger back, the knees give, and he falls flat on his back. Both arms fling out; the
    // staff ends on the ground beside his right side, the gourd beside his left. The hat rolls off
    // past his head and lies flat on the ground.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(clamp01((p - 0.66) / 0.16));
        const fling = ease(0.1, 0.5, p);
        const hatOff = ease(0.3, 0.72, p);
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
        const gourdArm = gourdPoseAt(
          lerp(WRIST_L, [0.3, 0.3, -0.04], fling),
          norm(lerp(GOURD.dir, norm([1, 0.3, 0]), fling)),
          norm(lerp(GOURD.up, [0, 0, 1], fling)),
          [0.3, 0.2, -0.4],
        );
        const legL = 6 * stagger + 16 * bump(fall) + 22 * fall;
        const legR = -6 * stagger + 18 * bump(fall) + 24 * fall;
        return {
          ...staffArm,
          ...gourdArm,
          hips: {
            move: [0, -0.034 * fall * fall + 0.02 * bump(fall) + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall],
            rotate: [-86 * fall - 4 * stagger, 0, 0],
          },
          skirt: { rotate: [0.8 * (legL + legR) * 0.5, 0, 0] },
          spine: { rotate: [-6 * stagger + 2 * fall, 0, 0] },
          chest: { rotate: [-4 * stagger, 0, 0] },
          neck: { rotate: [4 * fall, 0, 0] },
          head: { rotate: [-16 * stagger + 6 * fall, 18 * fall, 0] },
          hat: { rotate: [90 * hatOff, 0, 0], move: [0, 0.32 * hatOff, -0.19 * hatOff] },
          'leg.L': { rotate: [legL, 0, 5 * fall] },
          'leg.R': { rotate: [legR, 0, -6 * fall] },
          'foot.L': { rotate: [-12 * fall, 0, 0] },
          'foot.R': { rotate: [-16 * fall, 0, 0] },
        };
      },
    });

    // victory: a jump on both knees. He crouches, pushes off, and at the top of the jump thrusts the
    // staff up and out to the right (clear of the hat rim); the gourd stays at his belly. He lands
    // on both feet, the knees absorb it, he stands up, and pumps the staff twice.
    const JUMP = 0.095;
    const FLY = 0.17;
    const OFF = 0.2;
    const TOP = OFF + FLY / 2;
    const LAND = OFF + FLY;
    const V = (4 * JUMP) / FLY;
    const VICTORY_Y: readonly (readonly [number, number, number])[] = [
      [0, 0, 0],
      [0.13, -0.04, 0],
      [OFF, 0, V],
      [TOP, JUMP, 0],
      [LAND, 0, -V],
      [LAND + 0.07, -0.035, 0],
      [LAND + 0.21, 0, 0],
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
        const up = ease(0.08, TOP, p);
        const pump = bump(clamp01((p - 0.5) / 0.46), 2);
        const hipsY = victoryY(p) - 0.006 * pump;
        const crouch = Math.max(0, -hipsY) / 0.04;
        const tuck = p > OFF && p < LAND ? Math.sin((Math.PI * (p - OFF)) / FLY) : 0;
        const lift = Math.max(0, -hipsY) + 0.016 * tuck;
        const legsL = legTo(false, lift, 0.01 * tuck, 16 * tuck);
        const legsR = legTo(true, lift, 0.01 * tuck, 14 * tuck);
        const wrist: V3 = [-0.285 - 0.005 * pump, 0.43 + 0.02 * pump, 0.07 + 0.015 * pump];
        const load = p < OFF ? crouch : 0;
        return {
          ...staffPose(add(lerp(WRIST_R, wrist, up), [0, 0.05 * load, -0.01 * load]), lerp(STAFF_AXIS, norm([-0.75, 1, 0.12 - 0.08 * pump]), Math.min(1, up * 1.8)), STAFF_FACE),
          ...gourdPoseAt(lerp(WRIST_L, [0.235, 0.27, 0.09], up), GOURD.dir, GOURD.up),
          hips: { move: [0, hipsY, 0] },
          skirt: { rotate: [0.5 * (legsL.leg[0] + legsR.leg[0]) * 0.5 + 6 * tuck, 0, 0] },
          spine: { rotate: [5 * crouch - 5 * up, 0, 0] },
          chest: { rotate: [-4 * up - 3 * pump, -6 * up, -3 * up] },
          head: { rotate: [-8 * up - 4 * crouch, -4 * up, -2 * up] },
          hat: { rotate: [-3 * tuck, 0, 0] },
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
