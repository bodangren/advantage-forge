import { addPart, defineAsset, mapTint, motion, noise, profile, rgb, mixRgb, sdf } from '../src/index.js';
import { shamanCap, MOUNT as CAP_MOUNT } from './parts/shaman-cap.js';
import { shamanStaff, MOUNT as STAFF_MOUNT } from './parts/shaman-staff.js';
import { shamanFeather } from './parts/shaman-feather.js';

/**
 * Shaman — Chibi Quest P1 hero (catalog `heroes/magic/shaman`), about 1.15 m to the antler tips,
 * faces +Z. Base: assets/priest.ts (the cleric's skeleton with knee bones, a tunic body with bell
 * sleeves, a staff rigid on `hand.R`, the rogue's young, round, beardless face), with the book
 * turned into a held feather. Target: docs/hero-mockups/shaman_001.jpg, with no beard.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the antlers, the three feathers, the
 *   cream fur mantle, the dark tunic with the red sash, and the rattle staff must read.
 * One idea: a friendly young tribal shaman under a fur cap with branching antlers and a fan of
 *   feathers, a shaggy cream mantle, and a rattle staff that puffs teal spirit smoke.
 * Silhouette: two wide antlers and a feather fan above a round head, a cream mantle that widens
 *   the shoulders, a short dark tunic over a fringed skirt, bare feet, a tall staff on the right
 *   with a round rattle head, a tall feather on the left.
 * Proportions: antler tips 1.15, cap top 0.905, band 0.79, eyes 0.628, chin 0.48, shoulders 0.385,
 *   sash 0.262, tunic hem 0.195, skirt hem 0.128, ankles 0.07, rattle center 0.9, feather top 0.5.
 * Palette (60/30/10): dark hide #4a3428 tunic and cap, cream fur #e8dcc0, skin #f2c7a4; accents
 *   teal band and feather #4ab8b0 (the cloth slot), red sash #a83a32, yellow and red feathers.
 * Value plan: the dark cap and hair frame the light face (focal point); the cream mantle is the
 *   lightest mass under it; the red sash and the teal band are the two color accents.
 * Bodies: skin, hair, cap, band, antlers, feathers, mantle, tunic, sleeves, sash, bone-charm,
 *   beads, pendant, skirt-hide, legs, feet, anklets, staff, rattle, rattle-wrap, rattle-feathers, puff,
 *   feather.
 * Rig: the cleric's chibi skeleton with knees plus `skirt` (the tunic below the waist and the
 *   skirt sway) and `puff` (the spirit puff (body spirit-puff), hidden inside the rattle head, scaled up in the
 *   attack). The staff is rigid on the right hand, the feather on the left. Clips: idle, walk, run,
 *   attack (a rattle shake: two shakes and a teal puff at the rattle), attack2 (a feather sweep),
 *   hit, death, victory.
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
  hide: '#4a3428',
  hideDark: '#2e1e14',
  teal: '#4ab8b0',
  antler: '#5a4030',
  antlerTip: '#7a5a44',
  red: '#d83a3a',
  yellow: '#e8c840',
  quill: '#3a2618',
  fur: '#e8dcc0',
  furShadow: '#b8a888',
  bead: '#ece4d0',
  pendant: '#d8d0b8',
  thread: '#8a7a5a',
  sash: '#a83a32',
  skirt: '#6b4a30',
  fringe: '#c9a06a',
  ankletBead: '#d8503a',
  staff: '#4a3020',
  rattle: '#7a5a44',
  wrap: '#c8a870',
  anklet: '#e8c840',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');

// Joints: human shoulders like the rogue's. The right fist holds the staff upright beside the
// hip; the left fist holds the feather up at the side.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.322, -0.01];
const WRIST_R: V3 = [-0.225, 0.248, 0.068];
const ELBOW_L: V3 = [0.19, 0.322, -0.01];
const WRIST_L: V3 = [0.24, 0.248, 0.068];
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
const HAND_R = { pitch: -84, roll: 8 };
const HAND_L = { pitch: -84, roll: -10 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);
const GRIP = handPoint(HAND_R, WRIST_R, [-0.008 * FIST, -0.044 * FIST, 0.004 * FIST]);
const STAFF_AXIS = norm(rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll));

// The rattle staff: the butt just above the floor, the grip in the fist, the rattle head on top.
const RATTLE_T = 0.665; // the rattle head's center, along the staff from the grip
const staffAt = (t: number): V3 => add(GRIP, [STAFF_AXIS[0] * t, STAFF_AXIS[1] * t, STAFF_AXIS[2] * t]);
const RATTLE_AT = staffAt(RATTLE_T);
const STAFF_TILT = { x: 90 + HAND_R.pitch, z: HAND_R.roll };
const STAFF_FACE = norm(rotZ(rotX([0, 0, 1], STAFF_TILT.x), STAFF_TILT.z));

// The feather: its quill runs through the left fist, the vane stands up and forward.
const GRIP_L = handPoint(HAND_L, WRIST_L, [0.008 * FIST, -0.044 * FIST, 0.004 * FIST]);
const FEATHER_AXIS = norm(rotZ(rotX([0, 0, 1], HAND_L.pitch), HAND_L.roll));
const FEATHER_TILT = { x: 90 + HAND_L.pitch, z: HAND_L.roll };
const FEATHER_FACE = norm(rotZ(rotX([0, 0, 1], FEATHER_TILT.x), FEATHER_TILT.z));
const featherPose = (s: sdf.Shape) => s.rotateX(FEATHER_TILT.x).rotateZ(FEATHER_TILT.z).at(...GRIP_L);

export default defineAsset({
  name: 'shaman',
  description: 'Chibi young tribal shaman hero with an antler fur cap, a feather fan, a cream fur mantle, a rattle staff, and a held feather.',
  detail: 0.006,
  reference: 'docs/hero-mockups/shaman_001.jpg',
  // Color slots for individual shamans (the first option is the default look). Cloth is the teal
  // of the cap band, the feathers, and the spirit puff.
  variants: {
    eyes: { brown: C.iris, green: '#3d7a35', amber: '#b8742a' },
    hair: { black: C.hair, brown: '#4a2e1c', grey: '#a8a8a0' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    cloth: { teal: C.teal, red: '#a83a32', violet: '#6a4a9e' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'black', skin: 'fair', cloth: 'teal' },
    red: { eyes: 'amber', hair: 'brown', skin: 'tan', cloth: 'red' },
    violet: { eyes: 'green', hair: 'grey', skin: 'brown', cloth: 'violet' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    // The blush, the mouth, and the nose tip keep their pink but take half of the skin's recoloring.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', -0.4),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      nose: k.tint('skin', { color: C.nose, follow: 0.5 }),
      cloth: k.tint('cloth'),
      clothDark: k.tint('cloth', -0.3),
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
      puff: { parent: 'hand.R', at: RATTLE_AT },
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
    const noseZ = faceZ(0, 0.568);
    const nose = sdf.ellipsoid([0.026, 0.022, 0.02]).at(0, 0.568, noseZ - 0.002).bone('head');
    // Small round human ears.
    const ears = pair(
      sdf
        .ellipsoid([0.022, 0.046, 0.038])
        .subtract(sdf.sphere(0.018).at(0.014, 0, 0.01))
        .rotateY(-40)
        .at(0.206, 0.6, -0.012)
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

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.055, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] + 0.004));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
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
      .paintWhere(sdf.sphere(0.024).at(0, 0.57, noseZ + 0.03), T.nose, 0.016);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair and brows
    // A dark bowl of hair under the fur cap: a skull shell cut clear of the face and the ears, a
    // row of short bangs under the band, side locks past the ears, and locks down the back.
    const faceMask = sdf.ellipsoid([0.2, 0.215, 0.2]).at(0, 0.615, 0.17);
    const bowl = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.014, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.006, -0.004)
      .smoothSubtract(0.02, faceMask)
      .smoothSubtract(0.015, pair(sdf.ellipsoid([0.06, 0.06, 0.07]).at(0.215, 0.6, -0.004)))
      .intersect(sdf.halfSpace(norm([0, -1, -0.3]), -0.56))
      .intersect(sdf.halfSpace([0, Math.cos(6 * rad), Math.sin(6 * rad)], 0.805 * Math.cos(6 * rad)));
    const bang = (x: number, sway: number, len: number) => {
      const z = (y: number) => faceZ(Math.abs(x), y) + 0.006;
      return sdf.chain(
        [
          [x, 0.81, z(0.81) - 0.004, 0.016],
          [x + sway * 0.4, 0.79, z(0.79), 0.0165],
          [x + sway, 0.805 - len, z(0.755) + 0.002, 0.007],
        ],
        0.014,
      );
    };
    const bangs = sdf.union(
      ...[-0.135, -0.09, -0.045, 0, 0.045, 0.09, 0.135].map((x, i) => bang(x, (i % 2 ? 1 : -1) * 0.012, 0.038 + (i % 3) * 0.004)),
    );
    // Side locks: from under the band, in front of the ear, to a point at the jaw.
    const sideLock = pair(
      sdf.chain(
        [
          [0.17, 0.79, 0.05, 0.02],
          [0.198, 0.725, 0.05, 0.019],
          [0.201, 0.665, 0.046, 0.016],
          [0.196, 0.615, 0.038, 0.01],
          [0.192, 0.585, 0.032, 0.006],
        ],
        0.02,
      ),
    );
    // Shaggy locks fall down the back and the nape.
    const backLocks = sdf.union(
      ...[-0.15, -0.075, 0, 0.075, 0.15].map((x, i) => {
        const tip = 0.575 + (i % 2) * 0.02;
        return sdf.chain(
          [
            [x, 0.78, -0.15 + Math.abs(x) * 0.15, 0.034],
            [x * 1.12, 0.69, -0.196 + Math.abs(x) * 0.22, 0.03],
            [x * 1.16, 0.62, -0.18 + Math.abs(x) * 0.25, 0.022],
            [x * 1.08, tip, -0.15 + Math.abs(x) * 0.25, 0.01],
          ],
          0.03,
        );
      }),
    );
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
    const strands = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z + 0.05) * 20 + y * 22);
    const hairShape = sdf
      .smoothUnion(0.02, bowl, bangs, sideLock, backLocks)
      .union(brow(1), brow(-1))
      .paintFn((x, y, z, base) => {
        const s = strands(x, y, z);
        return s > 0.55 ? mixRgb(base, rgb(T.hairDark), Math.min(1, (s - 0.55) * 4)) : base;
      });
    k.body('hair', hairShape, { color: T.hair, roughness: 0.55, detail: 0.006, bone: 'head' });

    // ------------------------------------------------------------------ fur cap, band, antlers, feathers
const capPart = shamanCap(mapTint(k));
addPart(k, capPart, { pose: (s) => s.at(...CAP_MOUNT) });

    // ------------------------------------------------------------------ the tunic
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
            [0.146, 0.255],
            [0.155, 0.218],
            [0.16, 0.2],
            [0.155, 0.194],
            [0, 0.194],
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
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z) * 9 + Math.sin(y * 16) * 0.7);
    const foldPaint = (s: sdf.Shape) =>
      s.paintFn((x, y, z, base) => {
        const f = folds(x, y, z);
        return f > 0.72 ? mixRgb(base, rgb(C.hideDark), Math.min(1, (f - 0.72) * 5)) : base;
      });
    k.body('tunic', foldPaint(banded(tunicShape)), { color: C.hide, roughness: 0.9, detail: 0.007, bump: (x, y, z) => 0.002 * noise.fbm(x * 50, y * 50, z * 50, 2) });

    // Wide hide sleeves.
    const sleeve = (sh: V3, el: V3, wr: V3, up: string, fore: string) => {
      const inner = lerp(sh, [0, sh[1], 0], 0.25);
      const cuffIn = sdf.cone(lerp(el, wr, 0.72), lerp(el, wr, 1.25), 0.04, 0.064);
      return sdf.smoothUnion(
        0.024,
        sdf.cone(inner, el, 0.05, 0.056).bone(up),
        sdf.cone(el, wr, 0.056, 0.07).smoothSubtract(0.006, cuffIn).bone(fore),
      );
    };
    k.body(
      'sleeves',
      foldPaint(sdf.union(sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'))),
      { color: C.hide, roughness: 0.9, detail: 0.006, bump: (x, y, z) => 0.002 * noise.fbm(x * 50, y * 50, z * 50, 2) },
    );

    // The red sash: a band at the waist, a knot at the left hip, a hanging tail, and a bone charm.
    const sashBand = tunicShape.round(0.01).smoothIntersect(0.005, sdf.box([0.7, 0.05, 0.7], 0.006).at(0, 0.262, 0));
    const sashZ = (y: number) => sdf.raycast(tunicShape, [0, y, 1], [0, 0, -1])![2];
    const tailZ = sashZ(0.2) + 0.012;
    const knot = sdf.ellipsoid([0.034, 0.03, 0.018]).at(0.07, 0.262, sashZ(0.262) + 0.02);
    const tail = sdf.extrude(profile.rect([0.034, 0.13], 0.008), 0.014, 0.004).rotateZ(3).at(0.072, 0.2, tailZ);
    const tail2 = sdf.extrude(profile.rect([0.03, 0.1], 0.008), 0.014, 0.004).rotateZ(-8).at(0.098, 0.218, tailZ - 0.004);
    k.body('sash', sdf.union(banded(sashBand), sdf.union(knot, tail, tail2).bone('skirt')).paintFn((x, y, _z, base) => (y < 0.25 && Math.abs(Math.sin(x * 240)) > 0.97 ? mixRgb(base, [0.2, 0.02, 0.02], 0.4) : base)), {
      color: C.sash,
      roughness: 0.85,
      detail: 0.005,
    });
    const charmZ = sashZ(0.25) + 0.016;
    const charm = sdf
      .smoothUnion(
        0.006,
        sdf.capsule([-0.052, 0.25, charmZ], [-0.052, 0.197, charmZ + 0.004], 0.0085),
        sdf.sphere(0.0125).at(-0.059, 0.192, charmZ + 0.004),
        sdf.sphere(0.0125).at(-0.045, 0.192, charmZ + 0.004),
        sdf.sphere(0.011).at(-0.052, 0.254, charmZ),
      )
      .bone('skirt');
    k.body('bone-charm', charm, { color: C.bead, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ fur mantle
    const furHalf = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.1, 0.052, 0.13]).rotateZ(-16).at(0.12, 0.405, 0.0), // over the shoulder
      sdf.ellipsoid([0.05, 0.085, 0.036]).rotateZ(-10).at(0.105, 0.365, 0.104), // the flap over the chest
    );
    // Eight hanging jagged fur points (0.05 m long), four on each side, over the chest and shoulders.
    const point = (x: number, y: number, z: number, dx: number, dz: number) => sdf.cone([x, y, z], [x + dx, y - 0.05, z + dz], 0.022, 0.003);
    const furPoints = sdf.union(
      point(0.205, 0.385, 0.04, 0.016, 0.006),
      point(0.185, 0.39, -0.06, 0.015, -0.008),
      point(0.128, 0.322, 0.122, 0.006, 0.006),
      point(0.085, 0.31, 0.125, -0.004, 0.008),
    );
    const mantleShape = sdf
      .smoothUnion(0.04, furHalf.mirror('x', 0), sdf.ellipsoid([0.17, 0.052, 0.075]).at(0, 0.41, -0.085))
      .smoothUnion(0.006, furPoints.mirror('x', 0))
      .displace(0.008, (x, y, z) => noise.fbm(x * 22, y * 22, z * 22, 3))
      .paintFn((x, y, z, base) => {
        const low = clamp01((0.43 - y) / 0.14);
        const s = Math.sin(Math.atan2(x, z + 0.02) * 26 + y * 34);
        const t = clamp01(low * 0.6 + (s > 0.55 ? 0.45 : 0));
        return mixRgb(base, rgb(C.furShadow), t);
      });
    k.body('mantle', mantleShape.bone('chest'), { color: C.fur, roughness: 1.0, detail: 0.007, bump: (x, y, z) => 0.004 * noise.fbm(x * 60, y * 60, z * 60, 3) });

    // Bone bead necklace: 12 beads on a U-shaped string, a carved pendant at the lowest point.
    const beadAt = (i: number): V3 => {
      const u = (i - 5.5) / 5.5;
      const x = u * 0.062;
      const y = 0.372 + 0.048 * u * u;
      return [x, y, sdf.raycast(tunicShape, [x, y, 1], [0, 0, -1])![2] + 0.006];
    };
    const beadPts = Array.from({ length: 12 }, (_, i) => beadAt(i));
    const beads = sdf.union(...beadPts.map((p) => sdf.ellipsoid([0.0125, 0.0105, 0.0105]).at(...p)));
    const threadShape = sdf.chain(beadPts.map((p) => [p[0], p[1], p[2], 0.0045] as [number, number, number, number]), 0.004);
    k.body('beads', sdf.union(beads, threadShape.paint(C.thread)).bone('chest'), { color: C.bead, roughness: 0.6, detail: 0.004 });
    const pendZ = sdf.raycast(tunicShape, [0, 0.335, 1], [0, 0, -1])![2] + 0.008;
    const pendant = sdf
      .union(
        sdf.box([0.034, 0.044, 0.014], 0.006).at(0, 0.335, pendZ),
        sdf.capsule([0, 0.36, pendZ - 0.002], [0, 0.375, pendZ - 0.004], 0.004).paint(C.thread),
      )
      .paintWhere(sdf.torus(0.009, 0.0035).rotateX(90).at(0, 0.336, pendZ + 0.008), C.thread, 0.001)
      .paintWhere(sdf.box([0.004, 0.022, 0.05]).at(0, 0.336, pendZ), C.thread, 0.001);
    k.body('pendant', pendant.bone('chest'), { color: C.pendant, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ fringed hide skirt
    const skirtOuter = sdf.revolve(
      profile.polygon(
        [
          [0, 0.3],
          [0.12, 0.3],
          [0.135, 0.24],
          [0.146, 0.19],
          [0.15, 0.15],
          [0.152, 0.128],
          [0, 0.128],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const skirtInner = sdf.revolve(
      profile.polygon(
        [
          [0, 0.31],
          [0.1, 0.31],
          [0.117, 0.24],
          [0.128, 0.19],
          [0.132, 0.15],
          [0.134, 0.12],
          [0, 0.12],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const slots = Array.from({ length: 10 }, (_, i) => sdf.box([0.02, 0.05, 0.08]).at(0, 0.14, 0.145).rotateY(i * 36 + 18));
    const skirtShape = skirtOuter
      .subtract(skirtInner)
      .subtract(...slots)
      .scale([1, 1, 0.86])
      .paintFn((x, y, z, base) => {
        const grain = noise.fbm(x * 60, y * 30, z * 60, 2) > 0.3 ? 0.3 : 0;
        return y < 0.168 ? rgb(C.fringe) : mixRgb(base, rgb(C.fringe), grain);
      });
    k.body('skirt-hide', skirtShape.bone('skirt'), { color: C.skirt, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.002 * noise.fbm(x * 50, y * 50, z * 50, 2) });

    // ------------------------------------------------------------------ bare legs, feet, anklets
    const leg = sdf.smoothUnion(
      0.012,
      sdf.capsule([HIP[0], 0.21, 0], [KNEE[0], KNEE[1], 0], 0.042).bone('leg.L'),
      sdf.capsule([KNEE[0], KNEE[1], 0], [ANKLE[0], 0.09, 0.002], 0.036).bone('shin.L'),
    );
    const toeZ = (x: number) => 0.045 + 0.095 * Math.sqrt(Math.max(0, 1 - (x / 0.058) ** 2)) - 0.006;
    const toes = sdf.union(...[-0.034, -0.012, 0.011, 0.033].map((x) => sdf.sphere(0.0135).at(x, 0.024, toeZ(x))));
    const foot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.04, 0.08, 0.02).at(0, 0.055, 0),
        sdf.ellipsoid([0.058, 0.05, 0.095]).at(0, 0.04, 0.045),
      )
      .smoothUnion(0.008, toes)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(8)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('legs', pair(sdf.smoothUnion(0.012, leg, foot)), { color: T.skin, roughness: 0.55, detail: 0.005 });
    const anklets = pair(
      sdf
        .union(
          sdf.torus(0.042, 0.0085).at(ANKLE[0], 0.108, 0.002).paint(C.anklet),
          sdf.union(...Array.from({ length: 10 }, (_, i) => sdf.sphere(0.0105).at(ANKLE[0] + Math.cos(i * 36 * rad) * 0.04, 0.088, 0.002 + Math.sin(i * 36 * rad) * 0.04))).paint(C.ankletBead),
        )
        .bone('shin.L'),
    );
    k.body('anklets', anklets, { color: C.anklet, roughness: 0.6, detail: 0.006 });

    // ------------------------------------------------------------------ the rattle staff (right hand)
addPart(k, shamanStaff(mapTint(k)), { pose: (s) => s.at(...STAFF_MOUNT) });
    // The spirit puff: a small teal glow hidden inside the rattle head; the attack scales it up.
    k.body('spirit-puff', sdf.sphere(0.034).displace(0.004, (x, y, z) => noise.fbm(x * 70, y * 70, z * 70, 2)).at(...RATTLE_AT), {
      color: T.cloth,
      roughness: 0.6,
      emissive: T.cloth,
      emissiveIntensity: 0.9,
      opacity: 0.8,
      bone: 'puff',
      detail: 0.005,
    });

addPart(k, shamanFeather(), { pose: featherPose });

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
          sit: 0.005, // the staff's butt hangs low: a shallow sit keeps it off the floor
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
          ...staffPose(add(WRIST_R, [0, armSwing > 30 ? 0.06 : 0.035, 0.012 * s]), STAFF_AXIS, STAFF_FACE),
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.022, 0.6, 22, 2, 0.006));
    k.animation('run', stride(0.58, 0.13, 0.04, 0.4, 38, 9, 0.025));

    // Posing by targets: the wrist follows keys in the chest's rest frame (reach), and the hand
    // turns so the staff points along its own keys (orient). STAFF.up is the rattle's face normal.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const STAFF = { dir: STAFF_AXIS, up: STAFF_FACE };
    const FEATHER = { dir: FEATHER_AXIS, up: FEATHER_FACE }; // the feather's quill axis and face normal
    const staffPose = (wrist: V3, dir: V3, up: V3, pole: V3 = [-0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], STAFF, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    const featherPoseAt = (wrist: V3, dir: V3, up: V3, pole: V3 = [0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      const hand = orient([arm.upper, arm.lower], FEATHER, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };

    // attack: a rattle shake. The shaman brings the rattle up and forward on his right (the staff
    // leans out, never over the head), shakes it twice side to side, and a teal spirit puff swells
    // out of the rattle head, holds, and fades. He leans away and looks at the rattle; the feather
    // arm draws in.
    const RAISED: V3 = [-0.25, 0.33, 0.12];
    k.animation('attack', {
      duration: 1.3,
      loop: false,
      pose: (_t, p) => {
        const raise = ease(0.03, 0.22, p) * (1 - ease(0.8, 0.98, p));
        const win = ease(0.22, 0.27, p) * (1 - ease(0.66, 0.72, p));
        const shake = Math.sin((2 * Math.PI * 2 * (p - 0.24)) / 0.46) * win;
        const puff = ease(0.3, 0.42, p) * (1 - ease(0.62, 0.82, p));
        const wrist = add(lerp(WRIST_R, RAISED, raise), [0.014 * shake, 0.006 * Math.abs(shake), 0]);
        const dir = norm(add(lerp(STAFF_AXIS, norm([-0.28, 1, 0.25]), raise), [0.2 * shake, 0, 0.05 * shake]));
        const s = 1 + (1.5 + 0.25 * shake) * puff;
        return {
          ...staffPose(wrist, dir, STAFF_FACE),
          puff: { scale: [s, s, s] },
          ...featherPoseAt(lerp(WRIST_L, [0.24, 0.275, 0.1], raise), FEATHER.dir, FEATHER.up),
          hips: { move: [0, -0.004 * raise, 0] },
          skirt: { rotate: [2 * raise, 0, 0] },
          spine: { rotate: [-3 * raise, 0, -2 * raise] },
          chest: { rotate: [-3 * raise, -8 * raise + 2 * shake, -3 * raise] },
          head: { rotate: [-6 * raise, -10 * raise, -3 * raise] },
        };
      },
    });

    // attack2: a feather sweep. The shaman plants the staff, turns his left side forward, and
    // sweeps the large feather across the front twice, out to the left and back, the vane leaning
    // forward so it stays well clear of the face.
    k.animation('attack2', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const lift = ease(0.04, 0.26, p) * (1 - ease(0.84, 1, p));
        const win = ease(0.22, 0.3, p) * (1 - ease(0.74, 0.82, p));
        const u = Math.cos((2 * Math.PI * 1.5 * (p - 0.26)) / 0.56); // out-left, across, out-left
        const sweepX = 0.2 + 0.1 * u * win - 0.02 * (1 - win);
        const wrist = add(lerp(WRIST_L, [0.26, 0.4, 0.2], lift), [(sweepX - 0.26) * win, 0, 0]);
        const want = {
          dir: norm(lerp(FEATHER.dir, norm([0.1 + 0.45 * u * win, 1, 0.55]), lift)),
          up: norm(lerp(FEATHER.up, norm([-0.3 * u * win, -0.3, 1]), lift)),
        };
        return {
          ...featherPoseAt(wrist, want.dir, want.up, [0.6, 0.1, -0.3]),
          ...staffPose(
            keys(p, [[0, WRIST_R], [0.3, [-0.245, 0.27, 0.09]], [0.8, [-0.245, 0.27, 0.09]], [1, WRIST_R]] as const),
            lerp(STAFF_AXIS, norm([-0.25, 0.96, 0.05]), lift),
            STAFF_FACE,
          ),
          hips: { move: [0, -0.008 * lift, -0.006 * lift], rotate: [0, -6 * lift, 0] },
          skirt: { rotate: [-2 * lift, 3 * lift, 0] },
          spine: { rotate: [-4 * lift, 0, 0] },
          chest: { rotate: [-3 * lift, -12 * lift + 5 * u * win, 2 * lift] },
          head: { rotate: [-5 * lift, 10 * lift, 2 * lift] },
          'leg.L': { rotate: [-8 * lift, 0, 0] },
          'leg.R': { rotate: [5 * lift, 0, 0] },
          'foot.L': { rotate: [6 * lift, 0, 0] },
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
        return {
          hips: { move: [0, -0.006 * h, -0.025 * h], rotate: [0, 6 * h, 0] },
          skirt: { rotate: [6 * h, 0, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, -3 * h] },
          head: { rotate: [-14 * h, -8 * h, 4 * h] },
          ...staffPose(lerp(WRIST_R, [-0.265, 0.29, 0.04], h), lerp(STAFF_AXIS, norm([-0.5, 0.85, -0.1]), h), STAFF_FACE),
          'upperarm.L': { rotate: [14 * h, 0, 40 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger back, the knees give, and he falls flat on his back. Both arms fling out to
    // the sides as he lands; the staff ends on the ground beside his right side, pointing to his
    // feet, the feather beside his left. The robe skirt follows the legs.
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
        const staffArm = staffPose(
          keys(p, [[0, WRIST_R], [0.3, [-0.27, 0.32, 0.09]], [0.66, [-0.32, 0.33, -0.1]]] as const),
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
        const bookArm = featherPoseAt(
          lerp(WRIST_L, [0.31, 0.36, 0.0], fling),
          norm(lerp(FEATHER.dir, norm([0.78, 0.62, 0]), fling)),
          norm(lerp(FEATHER.up, [0, 0, 1], fling)),
          [0.3, 0.2, -0.4],
        );
        const legL = 6 * stagger + 16 * bump(fall) + 22 * fall;
        const legR = -6 * stagger + 18 * bump(fall) + 24 * fall;
        return {
          ...staffArm,
          ...bookArm,
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
    // jump thrusts the rattle staff up beside his head (out on the right, never over it); the feather stays
    // at his side. He lands on both feet, the knees absorb it, he stands up, and pumps the staff twice.
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
        const up = ease(0.08, TOP, p); // the thrust: the staff is highest at the top of the jump
        const pump = bump(clamp01((p - 0.5) / 0.46), 2);
        const hipsY = victoryY(p) - 0.006 * pump;
        const crouch = Math.max(0, -hipsY) / 0.04; // 1 in the deep crouch
        // In the air the knees tuck a little (the ankles up and back) and the toes point down.
        const tuck = p > OFF && p < LAND ? Math.sin((Math.PI * (p - OFF)) / FLY) : 0;
        const lift = Math.max(0, -hipsY) + 0.016 * tuck;
        const legsL = legTo(false, lift, 0.01 * tuck, 16 * tuck);
        const legsR = legTo(true, lift, 0.01 * tuck, 14 * tuck);
        // The right arm reaches up and out to the side, so the rattle stays clear of the hair.
        const wrist: V3 = [-0.285 - 0.01 * pump, 0.47 + 0.02 * pump, 0.07 + 0.015 * pump];
        // In the crouch he pulls the fist up a little (the staff's butt stays off the floor).
        const load = p < OFF ? crouch : 0;
        return {
          ...staffPose(add(lerp(WRIST_R, wrist, up), [0, 0.05 * load, -0.01 * load]), lerp(STAFF_AXIS, norm([-0.36, 1, 0.16 - 0.1 * pump]), up), STAFF_FACE),
          ...featherPoseAt(lerp(WRIST_L, [0.245, 0.29, 0.1], up), FEATHER.dir, FEATHER.up),
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
