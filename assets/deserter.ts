import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Deserter — Chibi Quest human enemy (catalog `enemies/humanoid/deserter`), about 0.93 m to the
 * hair tuft and 0.98 m to the spear tip, faces +Z. Target: docs/enemy-mockups/deserter_001.jpg.
 * Built on the guard's rig (the rogue's head and skeleton, knee bones), with the helmet, the
 * pauldrons, the gauntlets, and the pennant taken away.
 *
 * Role: a wounded army deserter, a road enemy; seen in 3D and as a 128 px sprite. The bandage over
 *   one eye, the big brown beard, the faded blue tabard with its gold fleur, and the spear must read.
 * One idea: a tired, bare-headed soldier with a dirty bandage wrapped over one eye and a huge beard,
 *   still in a rusty mail shirt and a chipped blue tabard, leaning on a plain spear, a bread sack
 *   in the other hand.
 * Proportions: the rogue's (head center 0.675, eyes 0.63, shoulders 0.385, belt 0.25); the hair
 *   tuft at 0.93, the beard hem at 0.43, the tabard hem at 0.135; the spear tip at 0.98.
 * Shape language: round and slumped (head, beard, sack, bread) against the straight spear.
 * Palette (60/30/10): tabard blue #4a86b8, beige bandage #c8c0ac, brown beard #5a3a26 and boots;
 *   rusty grey mail #6a6660; gold fleur #d4a83a as the accent, with a red ribbon tab.
 * Value plan: the light bandage and skin over the dark beard are the focal point; the blue tabard
 *   with the gold fleur is the second.
 * Bodies: skin, band, hair, mail, tabard, gold, belt, iron, ribbon, trousers, boots, wraps, sack,
 *   bread, spear-haft, spear-head.
 * Rig: the rogue's skeleton; the spear is rigid on `hand.R`, the sack and bread on `hand.L`.
 * Clips: idle, walk, run, attack (a one-hand spear thrust), hit, death, taunt.
 * Note: the mockup covers the eye on the image left, the character's right (-X); the open eye is
 *   the character's left (+X), where the sack hangs.
 */

const C = {
  skin: '#f0c8a0',
  skinShade: '#d8a888',
  blush: '#ee9c84',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#4a2c1a',
  irisLow: '#7a4a26',
  pupil: '#110d0b',
  lid: '#16100c',
  noseTip: '#eea090',
  hair: '#5a3a26',
  hairLit: '#7a5236',
  brow: '#3a2a1e',
  band: '#c8c0ac',
  bandShade: '#a89e88',
  bandStain: '#8a4a3a',
  mail: '#5c5a56',
  rust: '#8a5a3a',
  blue: '#4a86b8',
  blueLit: '#6aa0cc',
  blueEdge: '#3a6a94',
  chip: '#c8c0ac',
  gold: '#d4a83a',
  belt: '#4a3222',
  iron: '#6a6c70',
  ribbon: '#a83a30',
  trousers: '#6a6258',
  boot: '#4a3a2c',
  bootCuff: '#5c4a38',
  sole: '#2e241a',
  haft: '#3a2a1e',
  head: '#7a7c84',
  headDark: '#585a60',
  sack: '#b8ae98',
  bread: '#c89a5a',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.1, 0.63] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: the right hand holds the spear upright out in front of the right shoulder; the left
// arm hangs at the side, holding the sack.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.185, 0.33, 0.012];
const WRIST_L: V3 = [0.21, 0.24, 0.035];
const ELBOW_R: V3 = [-0.195, 0.335, 0.03];
const WRIST_R: V3 = [-0.225, 0.3, 0.09];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left boot (y = 0), measured on the SDF: heel and toe.
const SOLE_HEEL: V3 = [0.093, 0, -0.024];
const SOLE_TOE: V3 = [0.118, 0, 0.085];
const GRIP: V3 = [WRIST_R[0] - 0.012, WRIST_R[1] - 0.038, WRIST_R[2] + 0.014];

/** A relaxed fist hanging from the wrist `w`. */
const fistAt = (w: V3) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.041, 0.046, 0.047]).at(w[0] + 0.007, w[1] - 0.04, w[2] + 0.004),
    sdf.capsule([w[0] - 0.009, w[1] - 0.061, w[2] + 0.032], [w[0] - 0.005, w[1] - 0.04, w[2] + 0.045], 0.018),
    sdf.cone([w[0] + 0.021, w[1] - 0.024, w[2] + 0.026], [w[0] + 0.001, w[1] - 0.035, w[2] + 0.05], 0.017, 0.0135),
  );
/** A fist wrapped around a vertical haft at `g`: the fingers curl around the front. */
const gripFist = (g: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.039, 0.047, 0.039]).at(g[0] - 0.012, g[1], g[2] - 0.004),
    sdf.capsule([g[0] - 0.02, g[1] - 0.02, g[2] + 0.024], [g[0] + 0.019, g[1] - 0.02, g[2] + 0.024], 0.017),
    sdf.capsule([g[0] - 0.02, g[1] + 0.007, g[2] + 0.026], [g[0] + 0.019, g[1] + 0.007, g[2] + 0.026], 0.017),
    sdf.cone([g[0] - 0.028, g[1] + 0.022, g[2] + 0.01], [g[0] + 0.012, g[1] + 0.032, g[2] + 0.02], 0.015, 0.012), // thumb on top
  );

export default defineAsset({
  name: 'deserter',
  description: 'Chibi army deserter: a bare head with a brown tuft, a dirty bandage over one eye, a big brown beard, a rusty mail shirt, a chipped blue tabard with a gold fleur, a bread sack, and a plain spear.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/deserter_001.jpg',
  // Color slots for individual deserters (the first option is the default look): the tabard, the
  // beard (and the hair tuft and brows), and the head bandage. The mail, the gold, the leather,
  // the skin, and the wood keep their colors.
  variants: {
    tabard: { blue: C.blue, red: '#8a3a30', green: '#4a6a3a' },
    beard: { brown: C.hair, black: '#24201c', grey: '#8a8a84' },
    bandage: { beige: C.band, white: '#e0dcd0', grey: '#8a8880' },
  },
  presets: {
    'royal-runaway': { tabard: 'blue', beard: 'brown', bandage: 'beige' },
    'red-company': { tabard: 'red', beard: 'black', bandage: 'white' },
    'forest-flight': { tabard: 'green', beard: 'grey', bandage: 'grey' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      cloth: k.tint('tabard'),
      clothLit: k.tint('tabard', { color: C.blueLit, follow: 1 }),
      clothEdge: k.tint('tabard', { color: C.blueEdge, follow: 1 }),
      hair: k.tint('beard'),
      hairLit: k.tint('beard', { color: C.hairLit, follow: 1 }),
      band: k.tint('bandage'),
      bandShade: k.tint('bandage', { color: C.bandShade, follow: 1 }),
    };
    const SPEAR_TOP = 0.48; // the socket top, above the grip; the leaf blade rises 0.24 more
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
    // A big round nose, just above the moustache.
    const NOSE_Y = 0.59;
    const NOSE_R = [0.05, 0.045, 0.041] as const;
    const noseZ = faceZ(0, NOSE_Y) + 0.013;
    const nose = sdf.ellipsoid(NOSE_R).at(0, NOSE_Y, noseZ).bone('head');
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
    // One open, tired eye (the character's left, +X); the other one is shut under the bandage.
    const eyeWhite = at(sdf.ellipsoid([0.055, 0.059, 0.07]), EYE[0], EYE[1]);
    const irisRim = at(sdf.ellipsoid([0.047, 0.053, 0.07]), EYE[0], EYE[1] - 0.004);
    const iris = at(sdf.ellipsoid([0.04, 0.046, 0.07]), EYE[0], EYE[1] - 0.005);
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = at(sdf.ellipsoid([0.03, 0.033, 0.07]), EYE[0], EYE[1] + 0.001);
    // The heavy upper lid: skin over the top of the eye, with a dark lid line under it.
    const lidSkin = eyeWhite.round(0.004).intersect(sdf.halfSpace([0, -1, 0], -(EYE[1] + 0.027)));
    const lid = sdf.extrude(profile.arc(0.05, 0.011, 20, 160), 0.3).at(EYE[0], EYE[1] - 0.023, 0.1);
    const bag = sdf.extrude(profile.arc(0.05, 0.008, 240, 300), 0.3).at(EYE[0], EYE[1] + 0.041, 0.1);
    const shine = sdf.union(at(sdf.sphere(0.0115), EYE[0] + 0.016, EYE[1] + 0.013), at(sdf.sphere(0.006), EYE[0] - 0.014, EYE[1] - 0.02));
    // The shut eye: a curved line under the bandage.
    const wink = sdf.extrude(profile.arc(0.042, 0.01, 238, 302), 0.3).at(-EYE[0], EYE[1] + 0.02, 0.1);
    const armL = sdf.smoothUnion(0.02, sdf.cone(SHOULDER, ELBOW_L, 0.042, 0.038).bone('upperarm.L'), sdf.cone(ELBOW_L, WRIST_L, 0.038, 0.034).bone('forearm.L'));
    const armR = sdf.smoothUnion(0.02, sdf.cone(mx(SHOULDER), ELBOW_R, 0.042, 0.038).bone('upperarm.R'), sdf.cone(ELBOW_R, WRIST_R, 0.038, 0.034).bone('forearm.R'));
    const skinTone = rgb(C.skinShade);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.007, nose)
      .smoothUnion(0.014, ears)
      .union(sdf.smoothUnion(0.012, armL, fistAt(WRIST_L).bone('hand.L')), sdf.smoothUnion(0.012, armR, gripFist(GRIP).bone('hand.R')))
      .paintWhere(pair(at(sdf.sphere(0.03), 0.14, 0.575)), C.blush, 0.028)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.01)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lidSkin, C.skinShade, 0.004)
      .paintWhere(bag, C.skinShade, 0.006)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(wink, C.lid)
      .paintWhere(sdf.sphere(0.03).at(0, NOSE_Y + 0.006, noseZ + NOSE_R[2] + 0.008), C.noseTip, 0.018)
      .paintFn((x, y, z, base) => (y < 0.4 || noise.fbm(x * 30, y * 30, z * 30, 2) < 0.5 ? base : skinTone));
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ the bandage
    // Turns of cloth around the head: shells of the skull, cut to a tilted band. The top turns run
    // across the brow, low on the right (-X); the third turn drops over the right eye.
    const skull = sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0);
    const bandTurn = (out: number, cy: number, tilt: number, hw: number) =>
      skull
        .round(out)
        .subtract(skull.round(-0.006))
        .smoothIntersect(0.006, sdf.box([0.7, 2 * hw, 0.7], 0.008).rotateZ(tilt).at(0, cy, 0));
    const turnA = bandTurn(0.011, 0.752, 10, 0.03);
    const turnB = bandTurn(0.017, 0.72, 15, 0.028);
    const turnC = bandTurn(0.023, 0.7, 21, 0.026).smoothIntersect(0.012, sdf.ellipsoid([0.2, 0.12, 0.3]).at(-0.12, 0.68, 0.0));
    // The loose end hangs by the right ear.
    const flap = sdf
      .box([0.009, 0.09, 0.05], 0.004)
      .displace(0.002, (x, y, z) => Math.sin(y * 90 + z * 40))
      .rotateZ(-6)
      .rotateY(-8)
      .at(-0.197, 0.565, -0.06);
    const stain = sdf.sphere(0.03).at(-0.1, 0.665, faceZ(0.1, 0.665) + 0.012);
    const shadeTone = rgb(T.bandShade);
    const bandage = sdf
      .smoothUnion(0.008, turnA, turnB, turnC, flap)
      .paintWhere(stain, C.bandStain, 0.03)
      .paintFn((x, y, z, base) => (noise.fbm(x * 16, y * 16, z * 16, 2) > 0.25 ? shadeTone : base));
    k.body('band', bandage.bone('head'), {
      color: T.band,
      roughness: 0.92,
      detail: 0.004,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 90, y * 60, z * 90, 2),
    });

    // ------------------------------------------------------------------ hair tuft, brows, beard
    const crown = (x: number, z: number): V3 => [x, HEAD_Y + HEAD[1] * Math.sqrt(Math.max(0, 1 - (x / HEAD[0]) ** 2 - (z / HEAD[2]) ** 2)) - 0.012, z];
    const spike = (x: number, z: number, dx: number, dz: number, h: number) => {
      const b = crown(x, z);
      return sdf.cone(b, [b[0] + dx, b[1] + h, b[2] + dz], 0.02, 0.006);
    };
    const tuft = sdf.smoothUnion(
      0.012,
      spike(0, 0, 0, -0.004, 0.07),
      spike(0.03, 0.0, 0.022, 0, 0.056),
      spike(-0.03, 0.0, -0.022, 0, 0.056),
      spike(0, 0.024, 0, 0.022, 0.05),
      spike(0, -0.026, 0, -0.022, 0.052),
      spike(0.016, 0.014, 0.012, 0.012, 0.062),
    );
    const brow = (s: number, lift: number) =>
      sdf.chain(
        [
          [s * 0.038, 0.694 + lift - 0.006, faceZ(0.038, 0.694) + 0.006, 0.012],
          [s * 0.095, 0.702 + lift, faceZ(0.095, 0.702) + 0.008, 0.014],
          [s * 0.148, 0.688 + lift, faceZ(0.148, 0.688) + 0.003, 0.009],
        ],
        0.008,
      );
    const brows = sdf.union(brow(1, 0), brow(-1, 0.012));
    // A full beard: a rounded bib from ear to ear over the chest, cut flat under the cheeks, with a
    // thick moustache lobe under the nose and sideburns up to the ears.
    const bib = sdf
      .ellipsoid([0.172, 0.112, 0.105])
      .at(0, 0.515, 0.075)
      .smoothIntersect(0.016, sdf.halfSpace([0, 1, 0], 0.568))
      .smoothSubtract(0.02, sdf.ellipsoid([0.07, 0.05, 0.08]).at(0, 0.6, 0.19));
    const sideburns = pair(sdf.chain([[0.165, 0.575, 0.03, 0.026], [0.187, 0.62, -0.005, 0.02], [0.19, 0.66, -0.02, 0.012]], 0.01));
    const mZ = faceZ(0, 0.55);
    const moustache = pair(
      sdf.chain(
        [
          [0.0, 0.556, mZ + 0.03, 0.026],
          [0.045, 0.552, mZ + 0.028, 0.03],
          [0.09, 0.542, mZ + 0.012, 0.028],
          [0.125, 0.53, faceZ(0.125, 0.53) + 0.014, 0.024],
        ],
        0.014,
      ),
    );
    const litTone = rgb(T.hairLit);
    const browTone = rgb(C.brow);
    const beard = sdf
      .smoothUnion(0.014, bib, moustache, sideburns)
      .paintFn((x, y, z, base) => (Math.sin(x * 130 + Math.sin(y * 34) * 1.6) > 0.88 ? litTone : base));
    const hair = sdf
      .smoothUnion(0.01, beard, tuft, brows)
      .paintWhere(brows, C.brow, 0.004)
      .paintFn((x, y, z, base) => (y > 0.86 && Math.sin(x * 260 + z * 90) > 0.55 ? litTone : base));
    k.body('hair', hair.bone('head'), {
      color: T.hair,
      roughness: 0.65,
      detail: 0.004,
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(x * 240 + Math.sin(y * 40 + z * 25) * 1.4)),
    });
    void browTone;

    // ------------------------------------------------------------------ mail, tabard, belt
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.126, 0.29],
            [0.132, 0.25],
            [0.14, 0.2],
            [0.142, 0.17],
            [0.134, 0.158],
            [0, 0.158],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const dimples = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 30;
      const v = y * 190 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.0014 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    // Short mail sleeves that stop above the elbow, with a worn cloth cuff.
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 0.86), 0.048, 0.045).round(0.002).bone(tag);
    const rustTone = rgb(C.rust);
    const mail = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'))
      .paintFn((x, y, z, base) => (noise.fbm(x * 22, y * 22, z * 22, 3) > 0.5 ? rustTone : base));
    k.body('mail', mail, { color: C.mail, roughness: 0.7, metalness: 0.5, bump: dimples });
    // The tabard: a blue shell over the mail, split at the sides below the belt into a front and a
    // back panel, with a torn hem, worn edges, and chipped paint.
    const tabardBase = torso.smoothUnion(0.04, sdf.cone([0, 0.24, 0], [0, 0.13, 0.0], 0.14, 0.155).scale([1, 1, 0.82]));
    const sideSlits = pair(sdf.box([0.06, 0.14, 0.5], 0.01).at(0.15, 0.15, 0));
    const HEM = 0.135;
    const wedge = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      return sdf
        .box([0.034, 0.034, 0.08], 0.002)
        .rotateZ(45)
        .rotateY(deg)
        .at(0.16 * Math.sin(a), HEM - 0.004, 0.13 * Math.cos(a));
    };
    const ragged = sdf.union(...[-38, -8, 30, 150, 186, 214].map(wedge));
    const clothLit = rgb(T.clothLit);
    const chipTone = rgb(C.chip);
    const tabard = tabardBase
      .round(0.01)
      .subtract(tabardBase.round(0.001))
      .intersect(sdf.halfSpace([0, -1, 0], -HEM))
      .subtract(pair(sdf.ellipsoid([0.05, 0.06, 0.06]).at(0.13, 0.4, 0))) // arm holes
      .smoothSubtract(0.006, sideSlits.intersect(sdf.halfSpace([0, 1, 0], 0.235)))
      .subtract(ragged)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.155), T.clothEdge, 0.004)
      .paintWhere(
        sdf
          .extrude(
            profile.polygon([
              [-0.085, 0.485],
              [0.085, 0.485],
              [0, 0.41],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
        T.clothEdge,
        0.004,
      )
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 40, y * 40, z * 40, 3);
        if (n > 0.52) return chipTone;
        if (noise.fbm(x * 14 + 9, y * 14, z * 14, 2) > 0.35) return clothLit;
        return base;
      });
    k.body('tabard', tabard.bone('spine'), { color: T.cloth, roughness: 0.85, bump: (x, y, z) => 0.0012 * noise.fbm(x * 70, y * 70, z * 70, 2) });
    // The gold fleur on the chest: a raised emblem that follows the tabard's surface.
    const petal = (s: number) =>
      profile.polygon(
        [
          [0.01, 0.012],
          [0.022, 0.02],
          [0.034, 0.034],
          [0.046, 0.04],
          [0.053, 0.03],
          [0.05, 0.016],
          [0.04, 0.004],
          [0.026, -0.003],
          [0.012, -0.002],
        ].map(([x, y]) => [s * x!, y!] as [number, number]),
        { smooth: false },
      );
    const fleurTop = profile.polygon(
      [
        [0, 0.062],
        [0.008, 0.048],
        [0.014, 0.03],
        [0.012, 0.012],
        [0.01, 0.0],
        [-0.01, 0.0],
        [-0.012, 0.012],
        [-0.014, 0.03],
        [-0.008, 0.048],
      ],
      { smooth: false },
    );
    const fleurTail = profile.polygon(
      [
        [0.012, -0.002],
        [0.014, -0.016],
        [0.02, -0.034],
        [0.006, -0.03],
        [0, -0.05],
        [-0.006, -0.03],
        [-0.02, -0.034],
        [-0.014, -0.016],
        [-0.012, -0.002],
      ],
      { smooth: false },
    );
    const fleur = sdf.union(
      sdf.extrude(fleurTop, 0.5, 0.003),
      sdf.extrude(petal(1), 0.5, 0.003),
      sdf.extrude(petal(-1), 0.5, 0.003),
      sdf.extrude(fleurTail, 0.5, 0.003),
      sdf.extrude(profile.rect([0.06, 0.014], 0.004), 0.5, 0.003).at(0, 0.005, 0),
    );
    const emblem = tabardBase
      .round(0.016)
      .subtract(tabardBase.round(0.006))
      .smoothIntersect(0.003, fleur.at(0, 0.32, 0.25));
    const beltY = 0.25;
    const belt = tabardBase.round(0.018).smoothIntersect(0.006, sdf.box([0.5, 0.03, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.belt, roughness: 0.7 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.05, 0.042, 0.011], 0.005).subtract(sdf.box([0.028, 0.022, 0.03], 0.004)), sdf.box([0.006, 0.026, 0.01], 0.003).at(0.002, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    k.body('iron', buckle.bone('spine'), { color: C.iron, roughness: 0.5, metalness: 0.8 });
    k.body('gold', emblem.bone('spine'), { color: C.gold, roughness: 0.4, metalness: 0.75 });
    // A red-and-yellow ribbon tab hangs from the belt over the right hip.
    const RIB_X = -0.085;
    const ribZ = sdf.raycast(tabardBase.round(0.012), [RIB_X, 0.2, 1], [0, 0, -1])![2];
    const ribbon = sdf
      .box([0.026, 0.085, 0.009], 0.003)
      .rotateZ(-12)
      .at(RIB_X - 0.006, 0.2, ribZ + 0.005)
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.222), C.gold, 0.002);
    k.body('ribbon', ribbon.bone('spine'), { color: C.ribbon, roughness: 0.75 });

    // ------------------------------------------------------------------ wraps, trousers, boots
    const wrap = (e: V3, w: V3, tag: string) => sdf.cone(lerp(e, w, 0.36), lerp(e, w, 0.96), 0.046, 0.048).round(0.003).bone(tag);
    const elbowBand = (s: V3, e: V3, tag: string) => sdf.cone(lerp(s, e, 0.82), lerp(s, e, 1.0), 0.05, 0.048).round(0.004).bone(tag);
    k.body(
      'wraps',
      sdf.union(wrap(ELBOW_L, WRIST_L, 'forearm.L'), wrap(ELBOW_R, WRIST_R, 'forearm.R'), elbowBand(SHOULDER, ELBOW_L, 'upperarm.L'), elbowBand(mx(SHOULDER), ELBOW_R, 'upperarm.R')),
      { color: '#6a6052', roughness: 0.9, bump: (x, y, z) => 0.0012 * noise.fbm(x * 80, y * 80, z * 80, 2) },
    );
    const trouserTone = rgb('#5a5248');
    const trousers = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
        pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.11, 0.004], 0.049).bone('leg.L')),
      )
      .paintFn((x, y, z, base) => (noise.fbm(x * 26, y * 26, z * 26, 2) > 0.25 ? trouserTone : base));
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.9, bump: (x, y, z) => 0.0013 * noise.fbm(x * 70, y * 70, z * 70, 2) });
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.05, 0.08, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const scuffTone = rgb('#6e5a46');
    const boot = bootFoot
      .union(sdf.cylinder(0.062, 0.036, 0.014).at(0, 0.106, 0).paint(C.bootCuff)) // the folded top
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .paintFn((x, y, z, base) => (y > 0.02 && y < 0.09 && z > 0.02 && noise.fbm(x * 40, y * 40, z * 40, 2) > 0.3 ? scuffTone : base))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.75, bump: (x, y, z) => 0.0012 * noise.fbm(x * 70, y * 70, z * 70, 2) });

    // ------------------------------------------------------------------ the sack and the bread
    const SACK: V3 = [0.205, 0.135, -0.012];
    const sack = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.07, 0.085, 0.06]).at(...SACK),
        sdf.cone([SACK[0], SACK[1] + 0.05, SACK[2] + 0.005], [0.212, 0.212, 0.02], 0.05, 0.028), // the gathered neck
      )
      .union(sdf.torus(0.03, 0.007).rotateX(10).at(0.213, 0.19, 0.01))
      .displace(0.004, (x, y, z) => Math.sin(x * 80 + y * 30) * Math.sin(z * 70 + y * 20));
    k.body('sack', sack.bone('hand.L'), { color: C.sack, roughness: 0.92, bump: (x, y, z) => 0.0016 * noise.fbm(x * 80, y * 80, z * 80, 2) });
    const breadTone = rgb('#a4763c');
    const bread = sdf
      .ellipsoid([0.062, 0.046, 0.046])
      .rotateZ(18)
      .at(0.243, 0.2, 0.055)
      .paintFn((x, y, z, base) => (y > 0.21 && noise.fbm(x * 40, y * 40, z * 40, 2) > -0.1 ? breadTone : base));
    k.body('bread', bread.bone('hand.L'), { color: C.bread, roughness: 0.85, bump: (x, y, z) => 0.0018 * noise.fbm(x * 60, y * 60, z * 60, 3) });

    // ------------------------------------------------------------------ the spear
    // Local frame: the grip at the origin, the haft along +Y, the leaf head at the top.
    const spearPose = (s: sdf.Shape) => s.rotateZ(3).at(...GRIP);
    const haft = sdf.capsule([0, -GRIP[1] + 0.015, 0], [0, SPEAR_TOP - 0.04, 0], 0.0115);
    const socketTone = rgb(C.headDark);
    const leaf = sdf
      .revolve(
        profile.polygon(
          [
            [0, SPEAR_TOP - 0.008],
            [0.02, SPEAR_TOP + 0.002],
            [0.054, SPEAR_TOP + 0.035],
            [0.052, SPEAR_TOP + 0.07],
            [0.03, SPEAR_TOP + 0.145],
            [0.008, SPEAR_TOP + 0.21],
            [0, SPEAR_TOP + 0.24],
          ],
          { smooth: true, samples: 5 },
        ),
      )
      .scale([1, 1, 0.24]);
    const blade = sdf
      .union(
        leaf,
        sdf.cylinder(0.0155, 0.07, 0.004).at(0, SPEAR_TOP - 0.03, 0), // the socket
        sdf.torus(0.0165, 0.0055).at(0, SPEAR_TOP - 0.066, 0),
        sdf.torus(0.0165, 0.0045).at(0, SPEAR_TOP - 0.0, 0),
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], SPEAR_TOP - 0.004), socketTone, 0.003);
    k.body('spear-haft', spearPose(haft), { color: C.haft, roughness: 0.8, detail: 0.004, bone: 'hand.R', bump: (x, y, z) => 0.0014 * noise.fbm(x * 90, y * 20, z * 90, 2) });
    k.body('spear-head', spearPose(blade), { color: C.head, roughness: 0.4, metalness: 0.8, detail: 0.0035, bone: 'hand.R' });

    // ------------------------------------------------------------------ animation
    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [3 * bump(p), 5 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] }, // tired, glancing back
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    // The legs come from motion.gait: planted stance feet, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `bob` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the left arm
    // is back. The hips' turn goes to gait, so the planted feet do not slide.
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      bob: number,
      armSwing: number,
      lean: number,
      flap: number,
      carry = 0,
    ) => ({
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
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          // The spear arm swings little; the hand keeps the spear upright. `carry` bends the forearm
          // up and lifts the spear with its tilt unchanged, so in the run the butt clears the ground.
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, -3] as const },
          'forearm.R': { rotate: [-carry, 0, 0] as const },
          'hand.R': { rotate: [armSwing * 0.25 * s + carry, 0, 0] as const },
        };
      },
    });
    // A watchman's steady march: short, planted steps with a low swing; the run has a short flight.
    // Both carry the spear a little higher: the hips sit lower than at rest, and the butt stays off the floor.
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.62, 0.006, 26, 3, 24, 28));
    k.animation('run', stride(0.56, 0.14, 0.04, 0.42, 0.025, 44, 12, 48, 36));

    // A one-hand spear thrust, solved by targets in the world frame. The deserter turns side-on to
    // the right, the spear level at the belly: the right hand in front of the right hip. The hand
    // draws the spear back 10 cm and the chest turns further. Then the front (left) foot steps in,
    // the hips drop, the body unwinds a little, and the hand drives the wrist straight along the
    // spear's own line toward a target in front at chest height. The spear pulls back to the guard
    // and returns to rest. The left hand keeps the sack and swings for balance.
    const { keys, reach, orient, follow, quat, euler } = motion;
    const DEG = Math.PI / 180;
    const O: V3 = [0, 0, 0];
    const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
    const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const unit = (a: V3): V3 => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
    const turn = (r: readonly V3[], v: V3): V3 => follow(r.map(() => O), r, v);
    const HIPS: V3 = [0, 0.2, 0];
    const SPINE: V3 = [0, 0.26, 0];
    const CHEST: V3 = [0, 0.33, 0];
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const FIST_L: V3 = [WRIST_L[0] + 0.007, WRIST_L[1] - 0.04, WRIST_L[2] + 0.004]; // the left fist's center
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: FIST_L };
    const ARM_CHAIN_R = [HIPS, SPINE, CHEST, mx(SHOULDER), ELBOW_R, WRIST_R] as const;
    const SPEAR_DIR: V3 = [-Math.sin(3 * DEG), Math.cos(3 * DEG), 0];
    const FINGERS: V3 = [0, 0, 1]; // the fingers and the blade's flat face forward at rest
    const AIM = unit([0.12, 0.05, 1]); // toward a target in front at chest height
    const PALM = unit([0.5, -0.85, 0]); // the rear hand holds the level spear palm up
    const GUARD: V3 = [-0.22, 0.34, -0.1]; // the rear wrist in front of the right hip, side-on
    const DRAW = 0.13; // the target; the arm's reach limit makes the draw back about 0.10
    const POLE_R: V3 = [-0.54, 0.28, -0.12]; // the right elbow out, so the gauntlet clears the tabard
    const HOLD = 0.22; // the guard is set
    const COIL = 0.34; // the draw back ...
    const COIL2 = 0.39; // ... held long enough to read
    const DRIVE = 0.48; // full extension, 0.1 s after the draw back
    const STAY = 0.575; // full extension held 0.1 s
    const BACK = 0.78; // back in the guard
    const EXT = 0.33; // the drive target, this far ahead of the guard along AIM
    // The lunge, in the hips' own forward line (u) and height (y): the legs are rigid (no knee),
    // SHIN from the hip joint to the ankle, the ankle 0.07 above the sole. The front foot steps
    // STEP forward; the rear foot stays on its ball and its heel rises as the rear leg straightens.
    const SHIN = 0.125;
    const BALL = [0.083, -0.07] as const; // the front edge of the sole from the ankle
    const BALL_LEN = Math.hypot(...BALL);
    const BALL_ANG = Math.atan2(BALL[1], BALL[0]) / DEG; // the flat foot
    const STEP = 0.19;
    k.animation('attack', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        // The body: a side-on right turn in the guard, more in the coil, unwinding in the drive;
        // the chest leans in with the lunge. The hips keep their turn from the guard to the pull
        // back, so the feet stay planted while the hips travel along their own forward line.
        const yaw = keys(p, [[0, 0], [HOLD, -70], [COIL, -78], [COIL2, -80], [DRIVE, -34], [STAY, -36], [BACK, -66], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [HOLD, -3], [COIL, -5], [COIL2, -6], [DRIVE, 18], [STAY, 16], [BACK, -2], [1, 0]] as const);
        const hipYaw = keys(p, [[0, 0], [HOLD, -14], [BACK, -14], [1, 0]] as const);
        // The hips travel u and drop; the front foot lands as they arrive. In the recovery the hips
        // push back first and rise a little on the rear foot's ball, so the front foot swings back in the air.
        const u = keys(p, [[0, 0], [HOLD, -0.012], [COIL, -0.02], [COIL2, -0.022], [DRIVE, 0.1], [STAY, 0.1], [0.72, -0.004], [BACK, -0.012], [1, 0]] as const);
        const front = keys(p, [[0, 0], [COIL2, 0], [0.455, STEP], [0.6, STEP], [0.76, 0], [1, 0]] as const);
        const rear = keys(p, [[0, 0], [HOLD, -0.04], [BACK, -0.04], [1, 0]] as const);
        // The rear foot lifts a little as it steps back into the guard and forward out of it.
        const rearUp = 0.018 * (Math.sin(Math.PI * Math.min(1, p / HOLD)) + (p > BACK ? Math.sin((Math.PI * (p - BACK)) / (1 - BACK)) : 0));
        const cap = keys(p, [[0, 0], [COIL2, 0.004], [0.41, -0.004], [DRIVE, 0.05], [STAY, 0.05], [0.64, 0.035], [0.7, -0.012], [0.74, -0.012], [BACK, 0.003], [1, 0]] as const);
        const aF = Math.asin(Math.max(-1, Math.min(1, (front - u) / SHIN)));
        const drop = Math.min(SHIN * (1 - Math.cos(aF)), cap); // the front sole on the ground, or in the air in the step
        const legL = -aF / DEG;
        // The rear leg: two links (the leg, then the ankle to the ball) from the hip to the ball.
        const bu = rear + BALL[0] - u;
        const by = -SHIN + BALL[1] + rearUp + drop; // the ball from the hip joint
        const D = Math.min(Math.hypot(bu, by), SHIN + BALL_LEN - 1e-4);
        const vu = bu / Math.hypot(bu, by);
        const vy = by / Math.hypot(bu, by);
        const along = (SHIN * SHIN - BALL_LEN * BALL_LEN + D * D) / (2 * D);
        const side = Math.sqrt(Math.max(0, SHIN * SHIN - along * along));
        let ankle: [number, number] = [along * vu + side * vy, along * vy - side * vu];
        let footAng = Math.atan2(by - ankle[1], bu - ankle[0]) / DEG;
        if (footAng > BALL_ANG) {
          ankle = [bu - BALL[0], by - BALL[1]]; // the heel stays down
          footAng = BALL_ANG;
        }
        const legR = -(Math.atan2(ankle[1], ankle[0]) / DEG + 90);
        const footR = -(footAng - BALL_ANG) - legR;
        const lift: V3 = [u * Math.sin(hipYaw * DEG), -drop, u * Math.cos(hipYaw * DEG)];
        const rh: V3 = [0, hipYaw, 0];
        const rs: V3 = [0.5 * lean, 0.4375 * (yaw - hipYaw), 0];
        const rc: V3 = [0.5 * lean, 0.5625 * (yaw - hipYaw), 0];
        // World targets to the chest's rest frame (where reach works).
        const chestAt = add(lift, follow([HIPS, SPINE, CHEST], [rh, rs, rc], CHEST));
        const undo = euler(quat(rh).multiply(quat(rs)).multiply(quat(rc)).invert());
        const toChest = (w: V3): V3 => add(CHEST, turn([undo], sub(w, chestAt)));

        // The rear wrist: rest, the guard, the draw back, the drive along AIM, back.
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [HOLD, GUARD],
            [COIL, add(GUARD, mul(AIM, -DRAW))],
            [COIL2, add(GUARD, mul(AIM, -DRAW))],
            [DRIVE, add(GUARD, mul(AIM, EXT))],
            [STAY, add(GUARD, mul(AIM, EXT - 0.01))],
            [BACK, GUARD],
            [1, WRIST_R],
          ] as const,
        );
        const dir = unit(keys(p, [[0, SPEAR_DIR], [HOLD, AIM], [BACK, AIM], [1, SPEAR_DIR]] as const));
        const up = unit(keys(p, [[0, FINGERS], [HOLD, PALM], [BACK, PALM], [1, FINGERS]] as const));
        const pole = keys(p, [[0, ELBOW_R], [HOLD, POLE_R], [BACK, POLE_R], [1, ELBOW_R]] as const);
        // In the pull back, the rear wrist passes a little out to the right of the chest.
        const wide = mul([-0.035, 0, 0.01], keys(p, [[STAY, 0], [(STAY + BACK) / 2, 1], [BACK, 0]] as const));
        const arm = reach(ARM_R, add(toChest(wrist), wide), pole);
        const chain = [rh, rs, rc, arm.upper, arm.lower];
        const hand = orient(chain, { dir: SPEAR_DIR, up: FINGERS }, { dir, up });

        // The left arm keeps the sack: it swings forward in the guard and back in the drive.
        const swingL = keys(p, [[0, 0], [HOLD, -12], [COIL2, -16], [DRIVE, 22], [STAY, 22], [BACK, -6], [1, 0]] as const);
        return {
          hips: { move: lift, rotate: rh },
          spine: { rotate: rs },
          chest: { rotate: rc },
          head: { rotate: [-0.6 * lean, -0.75 * yaw, 0] }, // the eyes stay on the target
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: [swingL, 0, 8 + 0.3 * swingL] },
          'forearm.L': { rotate: [-14 - 0.3 * Math.abs(swingL), 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'leg.R': { rotate: [legR, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'foot.R': { rotate: [footR, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit, death, salute
    // Shared by the one-shot clips: joints, the chest's rest frame for a body pose (where `reach`
    // works) and world points on a bone chain.
    const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
    const toChestOf = (lift: V3, rh: V3, rs: V3, rc: V3) => {
      const at = add(lift, follow([HIPS, SPINE, CHEST], [rh, rs, rc], CHEST));
      const undo = euler(quat(rh).multiply(quat(rs)).multiply(quat(rc)).invert());
      return (w: V3): V3 => add(CHEST, turn([undo], sub(w, at)));
    };
    const worldOf = (lift: V3, joints: readonly V3[], rotations: readonly V3[], point: V3): V3 => add(lift, follow(joints, rotations, point));

    // Hit: a blow from the front snaps the head and the chest back; the right foot takes a small
    // step back, and all returns quickly. The hand keeps the spear near upright, tipped out to the
    // right, away from the head.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.8], [1, 0]] as const);
        const step = keys(p, [[0, 0], [0.1, 0], [0.3, 1], [0.6, 1], [1, 0]] as const);
        const hipZ = -0.022 * h - 0.012 * step;
        const footR = -0.05 * step;
        const legL = -Math.asin(clamp1(-hipZ / LEG)) / DEG;
        const legR = -Math.asin(clamp1((footR - hipZ) / LEG)) / DEG;
        const lift: V3 = [0, -Math.min(legDrop(LEG, legL), legDrop(LEG, legR)), hipZ];
        const rh: V3 = [0, 5 * h, 0];
        const rs: V3 = [-7 * h, 0, 0];
        const rc: V3 = [-9 * h, 6 * h, 3 * h];
        const upper: V3 = [-6 * h, 0, -10 * h];
        const lower: V3 = [-8 * h, 0, 0];
        const chain = [rh, rs, rc, upper, lower];
        const hand = orient(chain, { dir: SPEAR_DIR, up: FINGERS }, { dir: unit(add(SPEAR_DIR, [-0.12 * h, 0, 0.04 * h])), up: FINGERS });
        return {
          hips: { move: lift, rotate: rh },
          spine: { rotate: rs },
          chest: { rotate: rc },
          neck: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-13 * h, -6 * h, -5 * h] },
          'upperarm.R': { rotate: upper },
          'forearm.R': { rotate: lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: [-16 * h, 0, 22 * h] },
          'forearm.L': { rotate: [-22 * h, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'leg.R': { rotate: [legR, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'foot.R': { rotate: [-legR, 0, 0] },
        };
      },
    });

    // Death: the blow snaps the head and the chest back, the guard staggers a step back and sags,
    // then falls on his back with a small bounce. The body ends
    // tilted 80 degrees with the head and the tabard on the ground. The spear falls back with him
    // and lies beside his right side, its head past the head.
    const TILT = 80;
    const DROP = 0.048; // the hips joint ends 0.152 above the ground
    const BACK_Z = -0.17;
    const endLift: V3 = [0, -DROP, BACK_Z];
    const shEndR = worldOf(endLift, [HIPS, SPINE, CHEST], [[-TILT, 0, 0], O, O], mx(SHOULDER));
    const shEndL = worldOf(endLift, [HIPS, SPINE, CHEST], [[-TILT, 0, 0], O, O], SHOULDER);
    const WRIST_END_R: V3 = [shEndR[0] - 0.1, 0.058, shEndR[2] + 0.02];
    const FIST_END_L: V3 = [shEndL[0] + 0.1, 0.16, shEndL[2] + 0.06];
    const SPEAR_LIE = unit([-0.12, (0.029 - (WRIST_END_R[1] + 0.014)) / 0.76, -1]); // the rings touch the ground
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.2, 0.35], [0.3, 0]] as const);
        const sag = keys(p, [[0.08, 0], [0.32, 1]] as const);
        const stepR = keys(p, [[0.1, 0], [0.26, 1]] as const);
        const fall = keys(p, [[0.3, 0], [0.64, 1], [0.7, 0.955], [0.78, 1]] as const);
        const f2 = fall * fall;
        const stand = 1 - f2;
        const armFall = keys(p, [[0.4, 0], [0.72, 1]] as const); // the arm lowers
        const tip = keys(p, [[0.3, 0], [0.64, 1]] as const); // the spear tips back first, so its butt rises
        // Standing, the feet stay down (the right one steps back); lying, the end pose.
        const hipZ = -0.025 * hitB - 0.03 * sag;
        const stL = -Math.asin(clamp1(-hipZ / LEG)) / DEG;
        const stR = -Math.asin(clamp1((-0.06 * stepR - hipZ) / LEG)) / DEG;
        const drop = Math.min(legDrop(LEG, stL), legDrop(LEG, stR)) + 0.012 * sag;
        const lift: V3 = [0, -drop * stand - DROP * f2, hipZ * stand + BACK_Z * f2];
        const tilt = 4 * sag * stand - TILT * f2;
        const rh: V3 = [tilt, 6 * sag * stand, 0];
        const rs: V3 = [-8 * hitB + 6 * sag * stand, 0, 0];
        const rc: V3 = [-10 * hitB + 8 * sag * stand, 0, 3 * sag * stand];
        const toChest = toChestOf(lift, rh, rs, rc);

        // The spear arm lowers in the stagger and lies out on the ground at the end.
        const wristR = lerp(lerp(WRIST_R, [-0.25, 0.325, 0.06], sag), toChest(WRIST_END_R), armFall);
        const armR = reach(ARM_R, wristR, lerp(lerp(ELBOW_R, [-0.27, 0.345, 0.0], sag), [-0.45, 0.33, -0.05], armFall)); // the elbow out, clear of the tabard
        const chainR = [rh, rs, rc, armR.upper, armR.lower];
        const carry = turn([rh, rs, rc], unit(lerp(SPEAR_DIR, [-0.45, 0.85, 0.2], sag)));
        const dir = unit(lerp(carry, SPEAR_LIE, tip));
        const up = unit(lerp(turn([rh, rs, rc], FINGERS), [0, 1, 0], tip));
        const hand = orient(chainR, { dir: SPEAR_DIR, up: FINGERS }, { dir, up });
        // The free arm flies up in the blow, out in the stagger, and lies on the ground.
        const fistL = lerp(add(lerp(FIST_L, [0.27, 0.3, 0.1], sag), [0, 0.04 * hitB, 0.03 * hitB]), toChest(FIST_END_L), armFall);
        const armL = reach(ARM_L, fistL, lerp(ELBOW_L, [0.45, 0.33, -0.05], armFall));
        // A leg swings forward until its boot (heel or toe) clears the ground at the current hip height.
        const legWorld = (st: number, end: number) => {
          const foot = -st * stand + 10 * f2;
          let a = st * stand + end * f2;
          for (let i = 0; i < 90; i++) {
            const b = (a + foot) * DEG;
            const low = 0.195 + lift[1] - 0.125 * Math.cos(a * DEG) - 0.07 * Math.cos(b) - Math.max(-0.05 * Math.sin(b), 0.1 * Math.sin(b));
            if (low >= 0.004) break;
            a -= 1;
          }
          return a;
        };
        const legL = legWorld(stL, -62);
        const legR = legWorld(stR, -57);
        return {
          hips: { move: lift, rotate: rh },
          spine: { rotate: rs },
          chest: { rotate: rc },
          neck: { rotate: [-6 * hitB + 6 * sag * stand, 0, 0] },
          head: { rotate: [-14 * hitB + 10 * sag * stand - 16 * fall * stand, -26 * fall, 0] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          // The legs lie forward along the ground, a little apart; the toes turn up.
          'leg.L': { rotate: [legL - tilt, 0, 7 * f2] },
          'leg.R': { rotate: [legR - tilt, 0, -7 * f2] },
          'foot.L': { rotate: [-stL * stand + 10 * f2, 0, 0] },
          'foot.R': { rotate: [-stR * stand + 10 * f2, 0, 0] },
        };
      },
    });

    // Taunt: the deserter thumps the spear butt on the ground twice, shakes his head with a tired
    // scoff, and lifts the sack and bread in the left hand as if to say he has had enough. The right
    // arm solves by `reach` to a wrist target above the rest wrist; the left arm rotates.
    k.animation('taunt', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const up = keys(p, [[0, 0], [0.14, 1], [0.84, 1], [1, 0]] as const);
        const thump = keys(p, [[0.2, 0], [0.28, 1], [0.36, 0], [0.5, 0], [0.58, 1], [0.66, 0]] as const);
        const shake = keys(p, [[0.36, 0], [0.44, 1], [0.54, -1], [0.64, 1], [0.74, -1], [0.82, 0]] as const);
        const raise = keys(p, [[0.1, 0], [0.4, 1], [0.78, 1], [0.95, 0]] as const);
        const lift: V3 = [0, 0.004 * up - 0.006 * thump, 0];
        const rs: V3 = [-3 * up + 2 * thump, 0, 0];
        const rc: V3 = [-4 * up + 2 * thump, 0, 0];
        const toChest = toChestOf(lift, O, rs, rc);
        const armR = reach(ARM_R, toChest(add(WRIST_R, [0, 0.04 * (1 - thump) * up, 0])), ELBOW_R);
        const chainR = [O, rs, rc, armR.upper, armR.lower];
        const hand = orient(chainR, { dir: SPEAR_DIR, up: FINGERS }, { dir: unit(lerp(SPEAR_DIR, [0, 1, 0], up)), up: FINGERS });
        return {
          hips: { move: lift },
          spine: { rotate: rs },
          chest: { rotate: rc },
          neck: { rotate: [-4 * up, 0, 0] },
          head: { rotate: [-8 * up + 5 * thump, 14 * shake, 5 * shake] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: [-35 * raise - 6 * thump, 0, 20 * raise] },
          'forearm.L': { rotate: [-55 * raise, 0, 0] },
        };
      },
    });
  },
});
