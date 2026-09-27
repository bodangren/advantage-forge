import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Villager — Chibi Quest settlement NPC (catalog `npcs/settlement/villager`), about 0.93 m to the top
 * of her headscarf, faces +Z. Target: docs/npc-mockups/villager_001.jpg (made with mmx; one front
 * view). Built on the farmer (the rogue's head and skeleton, with the adventurer's face).
 *
 * Role: an ordinary villager who fills the streets, seen in 3D and as a 128 px sprite; many copies
 *   stand in one scene, so the dress color (the clothing slot) carries most of the variety.
 * One idea: a sweet village girl in a moss headscarf, with twisted pigtails, a rose dress with puffed
 *   sleeves, a cream ruffled apron, carrying a wicker basket of bread on her left arm.
 * Proportions: the rogue's (head center 0.675, eyes 0.628, shoulders 0.385, waist 0.29); the scarf to
 *   0.93; the skirt hem at 0.15; the basket at her left hip, its bottom at 0.31.
 * Shape language: round and soft (face, scarf, puffed sleeves, bell skirt, loaves), with the wavy
 *   edges of the scalloped hem and the apron ruffle.
 * Palette (60/30/10): rose #cf857b (dress); cream #efe4c8 (apron, socks); moss #809a64 (scarf);
 *   dark brown hair and shoes; wicker #a8763e and bread #c47a3c.
 * Value plan: the light face framed by the dark hair and the green scarf is the focal point; the
 *   rose dress and the cream apron are the two big masses; the basket is the accent.
 * Bodies: skin, hair, scarf, dress, apron, socks, shoes, basket, bread.
 * Rig: the rogue's skeleton; the basket and the bread are rigid on `hand.L`. Clips: idle, walk, run,
 *   work (hefting the basket and smoothing the apron), talk, wave (the free right hand).
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f08a7c',
  eyeWhite: '#f6f1ea',
  irisRim: '#1e120a',
  iris: '#4a2c1a',
  irisLow: '#7a4a26',
  pupil: '#110d0b',
  lid: '#1c130f',
  brow: '#3e2418',
  mouth: '#8a3a30',
  hair: '#5a3522',
  hairDark: '#3a2014',
  scarf: '#809a64',
  scarfDark: '#728c58',
  dress: '#cf857b',
  dressDark: '#a8645c',
  cream: '#efe4c8',
  creamDark: '#d8caa6',
  shoe: '#7a4a2c',
  strap: '#553220',
  sole: '#3e2618',
  wicker: '#a8763e',
  wickerLight: '#c8985a',
  wickerDark: '#7a5028',
  bread: '#b06a34',
  breadLight: '#cf8a4c',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V3): V3 => {
  const n = Math.hypot(...a);
  return [a[0] / n, a[1] / n, a[2] / n];
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Joints: the left forearm points forward with the basket on the palm; the right arm hangs a little
// out from the side, the hand open.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.185, 0.312, -0.015];
const WRIST_L: V3 = [0.252, 0.29, 0.06];
const ELBOW_R: V3 = [-0.19, 0.334, 0.014];
const WRIST_R: V3 = [-0.24, 0.27, 0.045];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The basket's bottom center (it rests on the left palm).
const BASKET: V3 = [0.262, 0.312, 0.106];
const HIPS_P: V3 = [0, 0.2, 0];

/** A relaxed open hand hanging from the right wrist `w`: the palm turned in, the thumb forward. */
const openHandR = (w: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.021, 0.044, 0.036]).rotateZ(-16).at(w[0] - 0.012, w[1] - 0.036, w[2] + 0.006),
    sdf.cone([w[0] + 0.004, w[1] - 0.018, w[2] + 0.028], [w[0] - 0.0, w[1] - 0.042, w[2] + 0.05], 0.013, 0.01), // thumb
  );
/** A flat left hand, palm up, under the basket: the fingers point along the forearm. */
const basketHand = (w: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.034, 0.014, 0.046]).rotateY(38).at(w[0] + 0.017, w[1] + 0.005, w[2] + 0.034),
    sdf.cone([w[0] - 0.008, w[1] + 0.0, w[2] + 0.02], [w[0] - 0.02, w[1] + 0.008, w[2] + 0.05], 0.013, 0.01), // thumb
  );

export default defineAsset({
  name: 'villager',
  description: 'Chibi villager NPC: a moss headscarf, twisted pigtails, a rose dress with puffed sleeves, a cream ruffled apron, and a wicker basket of bread.',
  detail: 0.005,
  reference: 'docs/npc-mockups/villager_001.jpg',
  // Color slots for individual villagers (the first option is the default look). The clothing slot is
  // the dress; the apron, the socks, the scarf, the shoes, and the basket keep their colors. The
  // options are plain village dyes in the rose's saturation family. Oatmeal is left out: it melts
  // into the cream apron.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, auburn: '#8a4a2a', black: '#231a17', blond: '#c4974a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { rose: C.dress, indigo: '#6d80a8', moss: '#8e9860', rust: '#a8725a' },
  },
  presets: {
    weaver: { eyes: 'blue', hair: 'blond', skin: 'fair', clothing: 'indigo' },
    gardener: { eyes: 'green', hair: 'auburn', skin: 'tan', clothing: 'moss' },
    miller: { eyes: 'brown', hair: 'black', skin: 'brown', clothing: 'rust' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      nose: k.tint('skin', { color: '#f0a090', follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      dress: k.tint('clothing'),
      dressDark: k.tint('clothing', { color: C.dressDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
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
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head, face, arms, and legs (skin)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.022, 0.019, 0.017]).at(0, 0.57, faceZ(0, 0.57) - 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.048, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.61, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.038, 0.034).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.034, 0.03).bone('forearm.L'),
      basketHand(WRIST_L).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.038, 0.034).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.034, 0.03).bone('forearm.R'),
      openHandR(WRIST_R).bone('hand.R'),
    );
    // Bare legs below the skirt, down into the socks.
    const legs = pair(sdf.capsule([HIP[0], 0.21, 0], [0.096, 0.075, 0.004], 0.033).bone('leg.L'));

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    // Two small lashes flick up at the outer corner of each eye.
    const lashes = pair(
      sdf.union(
        sdf.extrude(profile.rect([0.022, 0.008], 0.003), 0.3).rotateZ(35).at(EYE[0] + 0.05, EYE[1] + 0.038, 0.1),
        sdf.extrude(profile.rect([0.018, 0.007], 0.003), 0.3).rotateZ(15).at(EYE[0] + 0.056, EYE[1] + 0.022, 0.1),
      ),
    );
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019), at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022)]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.016, 62, 116), 0.3).at(0.1, 0.728 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.06, 0.01, 244, 296), 0.3).at(0, 0.532 + 0.06, 0.1);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR, legs)
      .paintWhere(pair(at(sdf.sphere(0.042), 0.14, 0.565)), T.blush, 0.032)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lashes, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth)
      .paintWhere(sdf.sphere(0.02).at(0, 0.57, faceZ(0, 0.57) + 0.03), T.nose, 0.015); // a rosy nose tip
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: a cap, a curly fringe, twisted pigtails
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, sdf.ellipsoid([0.25, 0.155, 0.23]).at(0, 0.61, 0.14));
    /** A chain point that sits on the forehead: `r` is the lock's radius, `lift` how far it stands out. */
    const onHead = (x: number, y: number, r: number, lift = 0.55): [number, number, number, number] => [x, y, faceZ(Math.abs(x), y) + r * lift, r];
    // Locks swept from under the scarf out to both sides, and two curls that fall onto the forehead.
    const wing = sdf.chain([onHead(0.01, 0.835, 0.034), onHead(0.075, 0.8, 0.036), onHead(0.135, 0.755, 0.03), onHead(0.178, 0.705, 0.02), onHead(0.194, 0.668, 0.011)], 0.02);
    const curlR = sdf.chain([onHead(-0.02, 0.835, 0.03), onHead(-0.07, 0.79, 0.028), onHead(-0.098, 0.748, 0.019), onHead(-0.088, 0.727, 0.01, 0.9)], 0.012);
    const curlC = sdf.chain([onHead(0.02, 0.835, 0.026), onHead(0.035, 0.785, 0.02), onHead(0.022, 0.758, 0.01, 0.9)], 0.01);
    // Pigtails: low, behind the ears, twisted into coils that stick out to the sides.
    const twist = (x: number, y: number, z: number) => Math.sin(Math.hypot(Math.abs(x) - 0.15, y - 0.585) * 260 + Math.atan2(y - 0.53, z + 0.035) * (x > 0 ? 1 : -1));
    const pigtails = pair(
      sdf.chain(
        [
          [0.15, 0.585, -0.08, 0.038],
          [0.2, 0.552, -0.066, 0.042],
          [0.238, 0.52, -0.045, 0.036],
          [0.255, 0.494, -0.022, 0.027],
          [0.25, 0.478, 0.0, 0.015],
        ],
        0.015,
      ),
    )
      .displace(0.005, twist)
      .paintFn((x, y, z, base) => (twist(x, y, z) < -0.55 ? rgb(T.hairDark) : base));
    const hair = sdf
      .smoothUnion(0.02, cap, pair(wing), curlR, curlC)
      .paintFn((x, y, z, base) => (Math.sin(x * 70 + z * 30 - y * 40) > 0.93 ? rgb(T.hairDark) : base))
      .smoothUnion(0.012, pigtails);
    k.body('hair', hair.bone('head'), { color: T.hair, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ headscarf: over the crown, a rolled front edge, a knot at the nape
    const SCARF_N = unit([0, -0.5, 0.866]);
    const SCARF_OFF = dot(SCARF_N, [0, 0.8, 0.13]);
    const scarfBall = sdf.ellipsoid([HEAD[0] + 0.028, HEAD[1] + 0.03, HEAD[2] + 0.028]).at(0, HEAD_Y + 0.012, -0.014);
    const scarfLow = sdf.halfSpace([0, -1, 0], -0.665);
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z + 0.05) * 6 + y * 20);
    const cloth = scarfBall.intersect(sdf.halfSpace(SCARF_N, SCARF_OFF)).intersect(scarfLow).displace(0.002, folds);
    const roll = scarfBall
      .round(0.008)
      .smoothIntersect(0.005, sdf.halfSpace(SCARF_N, SCARF_OFF).intersect(sdf.halfSpace([-SCARF_N[0], -SCARF_N[1], -SCARF_N[2]], -(SCARF_OFF - 0.026))))
      .intersect(sdf.halfSpace([0, -1, 0], -0.662));
    const knot = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.036, 0.03, 0.028]).at(0, 0.668, -0.236),
      pair(sdf.cone([0.012, 0.66, -0.238], [0.04, 0.585, -0.226], 0.02, 0.011)),
    );
    const scarf = sdf
      .smoothUnion(0.01, cloth, roll, knot)
      .paintFn((x, y, z, base) => (folds(x, y, z) > 0.9 && y > 0.7 ? rgb(C.scarfDark) : base));
    k.body('scarf', scarf.bone('head'), { color: C.scarf, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ dress: a bodice, puffed sleeves, a scalloped bell skirt
    const bodice = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.107, 0.44],
            [0.128, 0.4],
            [0.134, 0.35],
            [0.128, 0.3],
            [0.123, 0.27],
            [0.118, 0.25],
            [0, 0.25],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const skirtBase = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.295],
            [0.127, 0.295],
            [0.133, 0.27],
            [0.147, 0.235],
            [0.161, 0.195],
            [0.17, 0.168],
            [0.171, 0.155],
            [0.162, 0.148],
            [0, 0.148],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.86]);
    const pleats = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(x, z) * 11) * clamp01((0.27 - y) / 0.1) * (y < 0.172 ? 1 : 1 - ease(0.02, 0.07, z) * (1 - ease(0.125, 0.15, Math.abs(x))));
    // Scallops: the hem dips between the pleats (11 round tongues).
    const scallop = (x: number, y: number, z: number) => Math.cos(Math.atan2(x, z) * 11) * clamp01((0.172 - y) / 0.024);
    const skirt = skirtBase.displace(0.003, (x, y, z) => pleats(x, y, z) + 1.5 * scallop(x, y, z));
    const puff = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(
          0.02,
          sdf.ellipsoid([0.056, 0.05, 0.054]).at(...lerp([s[0] * 0.95, 0.395, 0], e, 0.3)),
          sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 0.62), 0.05, 0.046),
          sdf.torus(0.041, 0.008).rotateX(90).rotateZ(s[0] > 0 ? 35 : -35).at(...lerp(s, e, 0.62)), // the gathered hem
        )
        .bone(tag);
    const dress = sdf
      .union(
        bodice.intersect(sdf.halfSpace([0, -1, 0], -0.33)).bone('chest'),
        bodice.intersect(sdf.halfSpace([0, 1, 0], 0.33)).bone('spine'),
        skirt.bone('hips'),
        puff(SHOULDER, ELBOW_L, 'upperarm.L'),
        puff(mx(SHOULDER), ELBOW_R, 'upperarm.R'),
      )
      .paintFn((x, y, z, base) => (y < 0.25 && pleats(x, y, z) < -0.75 ? rgb(T.dressDark) : base));
    k.body('dress', dress, { color: T.dress, roughness: 0.85 });

    // ------------------------------------------------------------------ apron: a bib on straps, a skirt panel with a ruffle, a bow at the back
    const shellOf = (s: sdf.Shape, outer: number, inner: number) => s.round(outer).subtract(s.round(inner));
    const front = sdf.halfSpace([0, 0, -1], 0);
    const bibOutline = profile.polygon(
      [
        [-0.082, 0.432],
        [0.082, 0.432],
        [0.094, 0.28],
        [-0.094, 0.28],
      ],
      { smooth: false },
    );
    const bib = shellOf(bodice, 0.011, 0.001).smoothIntersect(0.004, sdf.extrude(bibOutline, 0.6, 0.01).at(0, 0, 0.3)).intersect(front);
    const strapCols = pair(sdf.box([0.032, 1, 1], 0.005).at(0.068, 0, 0));
    const straps = shellOf(bodice, 0.013, 0.001)
      .smoothIntersect(0.004, strapCols)
      .intersect(sdf.union(sdf.halfSpace([0, -1, 0], -0.41), sdf.halfSpace([0, 0, 1], 0).intersect(sdf.halfSpace([0, -1, 0], -0.27))));
    const waistband = shellOf(bodice, 0.009, 0.001).smoothIntersect(0.004, sdf.box([0.5, 0.024, 0.5], 0.006).at(0, 0.29, 0));
    const panelOutline = profile.polygon(
      [
        [-0.1, 0.3],
        [0.1, 0.3],
        [0.14, 0.205],
        [-0.14, 0.205],
      ],
      { smooth: false },
    );
    const panel = shellOf(skirtBase, 0.015, 0.008).smoothIntersect(0.004, sdf.extrude(panelOutline, 0.6, 0.008).at(0, 0, 0.3)).intersect(front);
    const frill = (x: number, z: number) => Math.sin(Math.atan2(x, z) * 30);
    const ruffle = shellOf(skirtBase, 0.019, 0.008)
      .smoothIntersect(0.005, sdf.box([0.3, 0.03, 0.6], 0.008).at(0, 0.194, 0.3))
      .displace(0.003, (x, _y, z) => frill(x, z));
    const bow = sdf.smoothUnion(
      0.006,
      pair(sdf.ellipsoid([0.036, 0.022, 0.014]).rotateZ(14).at(0.036, 0.296, -0.118)),
      sdf.sphere(0.014).at(0, 0.292, -0.116),
      pair(sdf.cone([0.008, 0.285, -0.114], [0.03, 0.232, -0.126], 0.012, 0.009)),
    );
    const apron = sdf
      .union(bib.bone('chest'), straps.bone('chest'), waistband.bone('spine'), panel.bone('hips'), ruffle.bone('hips'), bow.bone('spine'))
      .paintFn((x, y, z, base) => (y < 0.2 && z > 0 && frill(x, z) < -0.93 ? rgb(C.creamDark) : base));
    k.body('apron', apron, { color: C.cream, roughness: 0.9 });

    // ------------------------------------------------------------------ slouchy cream socks
    const sock = sdf
      .smoothUnion(0.006, sdf.cylinder(0.04, 0.026, 0.01).at(0.096, 0.083, 0.004), sdf.torus(0.036, 0.009).at(0.096, 0.096, 0.004))
      .bone('shin.L');
    k.body('socks', pair(sock), { color: C.cream, roughness: 0.9 });

    // ------------------------------------------------------------------ shoes: low, round, with a strap
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.05, 0.064, 0.018).at(0, 0.034, 0), sdf.ellipsoid([0.056, 0.045, 0.098]).at(0, 0.04, 0.042))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shoeStrap = sdf.box([0.2, 0.2, 0.02], 0.004).rotateX(-28).at(0, 0.07, 0.036).intersect(sdf.halfSpace([0, -1, 0], -0.03));
    const shoe = shoeFoot
      .paintWhere(shoeStrap, C.strap, 0.002)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.014), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.55 });

    // ------------------------------------------------------------------ the wicker basket and the bread (rigid on the left hand)
    // Local frame: the basket's bottom center at the origin; an oval bowl, wider at the rim.
    const basketPose = (s: sdf.Shape) => s.scale([1, 1, 0.8]).at(...BASKET);
    const bowl = sdf.revolve(
      profile.polygon(
        [
          [0, 0],
          [0.058, 0],
          [0.074, 0.025],
          [0.084, 0.07],
          [0, 0.07],
        ],
        { smooth: false },
      ),
    );
    const basket = sdf
      .smoothUnion(0.006, bowl.shell(0.006).intersect(sdf.halfSpace([0, 1, 0], 0.066)), sdf.torus(0.083, 0.008).at(0, 0.067, 0))
      .paintFn((x, y, z, base) => {
        if (y > 0.06) return rgb(C.wickerDark);
        const w = Math.sin(Math.atan2(x, z) * 16 + (Math.floor(y * 110) % 2) * Math.PI);
        return w > 0.35 ? rgb(C.wickerLight) : w < -0.7 ? rgb(C.wickerDark) : base;
      });
    const weave = (x: number, y: number, z: number) => 0.0008 * Math.sin(Math.atan2(x, z) * 16 + (Math.floor(y * 110) % 2) * Math.PI);
    k.body('basket', basketPose(basket), { color: C.wicker, roughness: 0.85, detail: 0.004, bone: 'hand.L', bump: weave });
    // Three plump loaves stand up in the basket, leaning out.
    const bread = sdf
      .smoothUnion(
        0.004,
        sdf.ellipsoid([0.034, 0.052, 0.03]).rotateZ(32).at(-0.036, 0.085, 0.004),
        sdf.ellipsoid([0.032, 0.056, 0.03]).rotateZ(4).at(0.008, 0.098, -0.012),
        sdf.ellipsoid([0.034, 0.05, 0.031]).rotateZ(-26).at(0.048, 0.088, 0.006),
      )
      .paintFn((x, y, z, base) => (y > 0.1 + 0.012 * noise.fbm(x * 60, y * 60, z * 60, 2) ? rgb(C.breadLight) : base));
    k.body('bread', basketPose(bread), { color: C.bread, roughness: 0.75, detail: 0.004, bone: 'hand.L' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, reach } = motion;
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // A slow, easy look around.
        head: { rotate: [1.5 * wave(p, 3), 7 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
        'upperarm.L': { rotate: [1 * wave(p, 1, 0.1), 0, 1 * bump(p)] },
        'hand.L': { rotate: [-1 * wave(p, 1, 0.1), 0, 0] },
      }),
    });

    // An easy village walk. The legs come from motion.gait: planted stance feet, a knee lift in the
    // swing, heel strike and toe-off. `step` is the foot travel, `lift` the swing height, `duty` the
    // share of the cycle a foot is down, `hop` the hips bob. The gait phase runs a quarter cycle behind
    // the clip, so the left heel strikes at p = 0.25. The sole points are the shoe's heel and toe on the
    // floor (turned 12 degrees out). The free right arm swings; the basket arm swings little and the
    // hand keeps the basket level.
    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.092, 0, -0.022],
          toe: [0.112, 0, 0.078],
          hips: { at: HIPS_P, rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.2 * s, 0, 3] as const },
          'hand.L': { rotate: [-armSwing * 0.2 * s - lean * 1.5, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 26, 3));
    k.animation('run', stride(0.58, 0.14, 0.04, 0.42, 0.025, 40, 9));

    // Work: an everyday chore with the basket, a 2.4 s loop.
    //   0.08-0.24 heft: the left forearm lifts the basket (the hand keeps it level)
    //   0.24-0.50 the basket drops back a little below rest and settles on the arm
    //   0.20-0.94 she looks down at the bread, her head turned to her left
    //   0.42-0.94 the free right hand comes to the apron front and smooths it in two strokes
    k.animation('work', {
      duration: 2.4,
      pose: (_t, p) => {
        const heft = ease(0.08, 0.24, p) - 1.25 * ease(0.24, 0.38, p) + 0.25 * ease(0.38, 0.5, p);
        const look = ease(0.2, 0.36, p) * (1 - ease(0.78, 0.94, p));
        const smooth = ease(0.42, 0.56, p) * (1 - ease(0.8, 0.94, p));
        const stroke = smooth * Math.sin(((p - 0.5) / 0.3) * Math.PI * 4);
        const target: V3 = [-0.1 + 0.022 * stroke, 0.3 - 0.008 * Math.abs(stroke), 0.105];
        const wrist = lerp(WRIST_R, target, smooth);
        const arm = reach(ARM_R, wrist, [-0.45, 0.3, -0.12]);
        return {
          hips: { move: [0, -0.002 * bump(p), 0] },
          spine: { rotate: [1.5 * look, 0, 1 * heft] },
          chest: { rotate: [1.5 * look, 4 * look, 2 * heft] },
          neck: { rotate: [3 * look, 4 * look, 0] },
          head: { rotate: [7 * look, 12 * look, -4 * look] },
          'upperarm.L': { rotate: [-6 * heft, 0, 2 * heft] },
          'forearm.L': { rotate: [-26 * heft, 0, 0] },
          'hand.L': { rotate: [32 * heft - 3 * look, 0, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: [-12 * smooth, -40 * smooth, 8 * stroke] },
        };
      },
    });

    // ------------------------------------------------------------------ villager clips: talk and wave (the free right arm)
    // The right arm is posed by wrist targets (chest rest frame). Her arms are short and her head is
    // wide, so the hand stays in front of the chest or out beside the cheek.

    // Talk: a friendly chat with someone in front. She nods and turns her head, and the right hand makes
    // two palm-up points in front of the chest. The basket stays on her left arm.
    k.animation('talk', {
      duration: 2.2,
      pose: (_t, p) => {
        const beat = bump(p, 2, 0.1);
        const sweep = wave(p, 1, 0.1);
        const wrist: V3 = [-(0.13 + 0.04 * sweep), 0.315 + 0.035 * beat, 0.14 + 0.01 * wave(p, 2)];
        const arm = reach(ARM_R, wrist, [-0.35, 0.2, -0.12]);
        return {
          hips: { move: [0, -0.002 * bump(p, 2), 0] },
          spine: { rotate: [1.5, 0, 1.5 + 0.7 * wave(p, 1, 0.3)] },
          chest: { rotate: [1.2 * beat, 0, 0] },
          neck: { rotate: [-1.5, 0, 0] },
          head: { rotate: [4 * bump(p, 2, 0.2) - 1.5, 8 * wave(p, 1, 0.35), -2.5 - 1.5 * bump(p, 1, 0.1)] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: [-8 - 8 * beat, -14 * sweep, 0] },
        };
      },
    });

    // Wave: a greeting. The right hand comes up out to the side, beside the cheek, waves two and a half
    // times, and comes down. The basket arm stays still.
    const RAISED: V3 = [-0.245, 0.46, 0.09];
    const POLE_REST: V3 = [-0.43, 0.535, 0];
    const POLE_UP: V3 = [-0.45, 0.22, -0.1];
    k.animation('wave', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const up = ease(0.02, 0.24, p) * (1 - ease(0.8, 1, p));
        const waving = ease(0.18, 0.28, p) * (1 - ease(0.72, 0.82, p));
        const side = waving * Math.sin(((p - 0.2) / 0.6) * Math.PI * 5);
        const bulge = Math.sin(Math.PI * up);
        const wrist: V3 = [
          WRIST_R[0] + (RAISED[0] - WRIST_R[0]) * up - 0.05 * bulge - 0.022 * side,
          WRIST_R[1] + (RAISED[1] - WRIST_R[1]) * up - 0.02 * bulge - 0.006 * Math.abs(side),
          WRIST_R[2] + (RAISED[2] - WRIST_R[2]) * up + 0.02 * bulge,
        ];
        const arm = reach(ARM_R, wrist, lerp(POLE_REST, POLE_UP, up));
        return {
          chest: { rotate: [0, 0, 0] },
          neck: { rotate: [-2 * up, 0, 0] },
          head: { rotate: [-3 * up + 3 * bump(p, 1), -6 * up, 5 * up] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: [-10 * up, 0, -28 * side] },
        };
      },
    });
  },
});
