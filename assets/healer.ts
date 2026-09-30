import { defineAsset, motion, noise, profile, rgb, mixRgb, sdf } from '../src/index.js';

/**
 * Healer — Chibi Quest P1 hero, about 1.0 m to the top of the hood, faces +Z. Base: assets/priest.ts
 * (skeleton, knee bones, `skirt`, clip set, the rogue's young round face). Target:
 * docs/hero-mockups/healer_001.jpg (one front view; the side and the back are designed here).
 *
 * Role: player hero, seen in 3D and as a 128 px sprite: the white hood-veil with its gold rim, the
 *   blonde fringe, the big eyes, the blue stole, and the glowing crescent and orb must read.
 * One idea: a gentle young healer in a soft white hood-veil and robe, a gold winged staff with a
 *   glowing yellow crescent in the right hand and a golden orb of light on the open left palm.
 * Shape language: round and soft (friendly); the wings and the crescent are the pointed accents.
 * Palette (60/30/10): white veil and robe #f4efe4 (folds #d8d0bc); sky-blue collar and stole
 *   #6ab8d8 with gold trim #e0b040 (the accent); blonde hair #e8c870; peach skin #f2c7a4; brown
 *   leather belt, pouch, and sandals #8a5a35; glows yellow-gold, never white.
 * Value plan: the white hood frames the warm face (focal point); the blue stole is the second
 *   contrast on the white robe; the two glows sit on the sides.
 * Bodies: skin (face, arms, legs, bare feet), hair (with the brows), veil, veil-rim, robe, sleeves,
 *   trim (sash collar and stole), gold (clasp, buckle), leather (belt, pouch, sandals), staff,
 *   staff-gold, crescent, holy-flash, orb, orb-flash.
 * Rig: the priest's skeleton without the book, plus `sun` (the holy flash at the staff ring, scaled
 *   up in the attack) and `relic` (the flash inside the orb, scaled up in the blessing). The staff is
 *   rigid on the right hand, the orb on the left hand. Clips: idle, walk, run, attack (the staff
 *   raised with a flash of healing light), attack2 (a blessing with the orb), hit, death, victory.
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
  hair: '#e8c870',
  hairDark: '#c0a050',
  robe: '#f4efe4',
  fold: '#d8d0bc',
  trim: '#6ab8d8',
  gold: '#e0b040',
  staffGold: '#d4a93a',
  leather: '#8a5a35',
  wood: '#7a4a2a',
  crescent: '#f0e040',
  crescentBase: '#5a4a10',
  orb: '#ffd060',
  orbBase: '#5a3a10',
  flashBase: '#5a3a10',
  holy: '#ffd45a',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const cloth = (x: number, y: number, z: number) => 0.0015 * noise.fbm(x * 40, y * 40, z * 40, 2); // woven cloth, in the normal map
const pair = (s: sdf.Shape) => s.mirror('x');

// Joints: human shoulders like the priest's. The right fist holds the staff upright beside the hip;
// the left forearm points forward with the palm up under the orb.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.322, -0.01];
const WRIST_R: V3 = [-0.225, 0.248, 0.068];
const ELBOW_L: V3 = [0.19, 0.322, -0.01];
const WRIST_L: V3 = [0.2, 0.285, 0.105];
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
const HAND_R = { pitch: -78, roll: 15 }; // the staff leans forward and out a little, clear of the hood
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);
const GRIP = handPoint(HAND_R, WRIST_R, [-0.008 * FIST, -0.044 * FIST, 0.004 * FIST]);
const STAFF_AXIS = norm(rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll));

// The staff: the butt just above the floor, a wooden shaft through the fist, the winged ring, and
// the crescent above it (the ring's face toward +Z).
const STAFF_DOWN = (GRIP[1] - 0.055) / STAFF_AXIS[1];
const RING_T = 0.46; // the ring's center, along the staff from the grip
const staffAt = (t: number): V3 => add(GRIP, [STAFF_AXIS[0] * t, STAFF_AXIS[1] * t, STAFF_AXIS[2] * t]);
const SUN_AT = staffAt(RING_T);
const SUN_TILT = { x: 90 + HAND_R.pitch, z: HAND_R.roll };
const SUN_FACE = norm(rotZ(rotX([0, 0, 1], SUN_TILT.x), SUN_TILT.z));

// The left hand: open, palm up, fingers forward, tilted up a little under the orb.
const HAND_L_PITCH = -8;
const handL = (p: V3) => add(rotX(p, HAND_L_PITCH), WRIST_L);
const ORB_R = 0.045;
const ORB_AT = handL([0, 0.05, 0.062]);
const ORB_FRAME = { dir: norm(rotX([0, 0, 1], HAND_L_PITCH)), up: norm(rotX([0, 1, 0], HAND_L_PITCH)) };


/** A star outline with n points (one points up): R the tips, r the notches. */
const starPts = (n: number, R: number, r: number, turn = 0): [number, number][] =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = ((i * 180) / n + 90 + turn) * rad;
    const d = i % 2 ? r : R;
    return [Math.cos(a) * d, Math.sin(a) * d] as [number, number];
  });

export default defineAsset({
  name: 'healer',
  description: 'Chibi young healer hero in a white hood-veil and robe with a blue stole, a gold winged staff with a glowing crescent, and a golden orb of light.',
  detail: 0.006,
  reference: 'docs/hero-mockups/healer_001.jpg',
  // Color slots for individual healers (the first option is the default look). Trim is the sky-blue
  // cloth: the sash collar and the stole.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { blonde: C.hair, brown: '#6b3a20', black: '#231a17' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    trim: { sky: C.trim, rose: '#d87a8a', mint: '#7ac8a0' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'blonde', skin: 'fair', trim: 'sky' },
    rose: { eyes: 'blue', hair: 'brown', skin: 'fair', trim: 'rose' },
    mint: { eyes: 'green', hair: 'black', skin: 'tan', trim: 'mint' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', -0.2),
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
      relic: { parent: 'hand.L', at: ORB_AT },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      sun: { parent: 'hand.R', at: SUN_AT },
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
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const faceZSafe = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])?.[2] ?? 0.05;
    const noseZ = faceZ(0, 0.568);
    const nose = sdf.ellipsoid([0.026, 0.022, 0.02]).at(0, 0.568, noseZ - 0.002).bone('head');
    // Round ears: they sit under the veil.
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.066, 0.05])
        .subtract(sdf.sphere(0.026).at(0.02, 0, 0.012))
        .rotateY(-40)
        .at(0.2, 0.6, -0.012)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(lerp(mx(SHOULDER), ELBOW_R, 0.35), ELBOW_R, 0.034, 0.032).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.034, 0.03).bone('forearm.R'),
      handPose(HAND_R, WRIST_R)(fistLocal(-1)).bone('hand.R'),
    );
    // The open left hand at its own origin (the wrist): a flat palm, four fingers curling up a little
    // around the orb, a thumb toward the body.
    const palmLocal = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.036, 0.013, 0.043]).at(0, 0, 0.042),
      ...[-0.024, -0.008, 0.008, 0.024].map((x) =>
        sdf.capsule([x, 0.0, 0.07], [x * 0.85, 0.014 - Math.abs(x) * 0.2, 0.108 - Math.abs(x) * 0.45], 0.0105 - Math.abs(x) * 0.06),
      ),
      sdf.capsule([-0.03, 0.0, 0.03], [-0.05, 0.012, 0.07], 0.0115),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(lerp(SHOULDER, ELBOW_L, 0.35), ELBOW_L, 0.034, 0.032).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.034, 0.03).bone('forearm.L'),
      palmLocal.rotateX(HAND_L_PITCH).at(...WRIST_L).bone('hand.L'),
    );
    // Legs and bare feet (the sandal straps and soles are leather).
    const legSkin = pair(
      sdf.smoothUnion(
        0.02,
        sdf.cone([HIP[0], 0.2, 0], [ANKLE[0], 0.075, 0.002], 0.044, 0.03).bone('leg.L'),
        sdf.ellipsoid([0.038, 0.029, 0.085]).at(ANKLE[0], 0.04, 0.042).bone('foot.L'),
      ),
    );

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.056, 0.061, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.047, 0.053, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.022));
    const pupil = pair(at(sdf.ellipsoid([0.031, 0.034, 0.07]), EYE[0], EYE[1] + 0.003));
    const lid = pair(sdf.extrude(profile.arc(0.054, 0.012, 20, 162), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.014), x + 0.018, EYE[1] + 0.022),
        at(sdf.sphere(0.007), x - 0.016, EYE[1] - 0.025),
      ]),
    );
    const smile = sdf.extrude(profile.arc(0.05, 0.009, 248, 292), 0.3).at(0, 0.522 + 0.05, 0.1);
    const blush = pair(at(sdf.sphere(0.036), 0.14, 0.545));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armR, armL, legSkin)
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
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ the hood-veil
    // A soft round hood 0.03 larger than the skull, centered 0.01 behind it, blended (0.03) into a
    // shoulder cowl 0.36 wide that runs down to y 0.36: no ring at the neck. A rounded box cuts the
    // face opening (top edge y 0.78, sides just outside the cheeks). A thick rolled rim (a tube
    // r 0.022, 0.015 proud of the hood) follows the opening, with a gold stroke on its inner front.
    // The sky-blue collar is paint: a band on the cowl with a small V at the front.
    const veilOuter = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([HEAD[0] + 0.03, HEAD[1] + 0.03, HEAD[2] + 0.03]).at(0, HEAD_Y, -0.01),
      sdf.ellipsoid([0.18, 0.075, 0.16]).at(0, 0.435, -0.005), // the cowl over the shoulders
    );
    const WIN = { hw: 0.207, top: 0.78, bottom: 0.45, corner: 0.11 };
    const windowCut = sdf.box([WIN.hw * 2, WIN.top - WIN.bottom, 0.6], WIN.corner).at(0, (WIN.top + WIN.bottom) / 2, 0.32);
    const cowlBand = sdf.cylinder(0.3, 0.055).at(0, 0.418, 0);
    const cowlV = sdf.extrude(profile.polygon([[-0.055, 0.44], [0.055, 0.44], [0, 0.362]]), 0.4, 0.004).at(0, 0, 0.2);
    const veil = veilOuter
      .subtract(windowCut)
      .paintFn((x, y, z, base) => {
        const fold = Math.sin(Math.atan2(x, z + 0.05) * 5 + y * 6);
        return fold < -0.35 ? mixRgb(base, rgb(C.fold), 0.55) : base;
      })
      .paintWhere(cowlBand, T.trim, 0.004)
      .paintWhere(cowlV, T.trim, 0.004)
      .bone('head');
    k.body('veil', veil, { color: C.robe, roughness: 0.85, detail: 0.006, bump: cloth });
    const rimPath: [number, number][] = [];
    {
      const hw = WIN.hw;
      const top = WIN.top;
      const c = WIN.corner;
      for (let y = 0.58; y < top - c; y += 0.03) rimPath.push([-hw, y]);
      for (let a = 180; a >= 90; a -= 15) rimPath.push([-hw + c + Math.cos(a * rad) * c, top - c + Math.sin(a * rad) * c]);
      for (let x = -hw + c + 0.04; x < hw - c - 0.03; x += 0.05) rimPath.push([x, top]);
      for (let a = 90; a >= 0; a -= 15) rimPath.push([hw - c + Math.cos(a * rad) * c, top - c + Math.sin(a * rad) * c]);
      for (let y = top - c - 0.03; y >= 0.58; y -= 0.03) rimPath.push([hw, y]);
    }
    const RIM_R = 0.022;
    const rimZ = (x: number, y: number) => (sdf.raycast(veilOuter, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1) + 0.0;
    const rimShape = sdf
      .chain(rimPath.map(([x, y]) => [x, y, rimZ(x, y), RIM_R] as [number, number, number, number]), 0.015)
      .paintFn((x, y, z, base) => {
        const fold = Math.sin(x * 40 + y * 30);
        return fold < -0.5 ? mixRgb(base, rgb(C.fold), 0.4) : base;
      });
    // The gold stroke: a thin chain on the inner front of the tube, crossing its surface.
    const trimStroke = sdf.chain(
      rimPath.map(([x, y]) => {
        const d = norm([x, y - 0.6, 0]);
        return [x + d[0] * 0.006, y + d[1] * 0.006, rimZ(x, y) + 0.018, 0.009] as [number, number, number, number];
      }),
      0.004,
    );
    k.body('veil-rim', rimShape.paintWhere(trimStroke, C.gold, 0.002).bone('head'), { color: C.robe, roughness: 0.8, detail: 0.004, bump: cloth });

    // ------------------------------------------------------------------ hair and brows
    // A thin cap over the skull (the veil covers it), a hairline that dips at the temples, and wavy
    // locks under the veil edge: two big sweeps from the part, four short waves, and two curls.
    const hairCap = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.014, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.004, -0.004)
      .smoothSubtract(0.02, sdf.ellipsoid([0.185, 0.16, 0.3]).at(0, 0.595, 0.2));
    const lock = (pts: [number, number, number][], kk = 0.02) =>
      sdf.chain(
        pts.map(([x, y, r]) => [x, y, faceZSafe(Math.min(Math.abs(x), 0.19), y) * 1.0 - r * 0.5, r] as [number, number, number, number]),
        kk,
      );
    // Six thick wavy locks across the forehead under the rim, alternating up and down so the hairline
    // waves, two temple locks framing the cheeks, and two curls.
    const fringe = [-0.125, -0.075, -0.025, 0.025, 0.075, 0.125].map((x, i) => {
      const y = 0.772 + (i % 2 ? 0.008 : -0.008);
      return sdf.ellipsoid([0.075, 0.04, 0.03]).rotateZ(i % 2 ? 14 : -14).at(x, y, faceZSafe(Math.abs(x), y) - 0.006);
    });
    const locksList = [
      sdf.smoothUnion(0.015, ...fringe),
      lock([[0.15, 0.735, 0.026], [0.165, 0.7, 0.024], [0.172, 0.66, 0.02], [0.17, 0.625, 0.014]], 0.02),
      lock([[-0.15, 0.735, 0.026], [-0.165, 0.7, 0.024], [-0.172, 0.66, 0.02], [-0.17, 0.64, 0.014]], 0.02),
      sdf.sphere(0.024).at(0.174, 0.608, faceZSafe(0.174, 0.608) + 0.002),
      sdf.sphere(0.021).at(-0.176, 0.63, faceZSafe(0.176, 0.63) + 0.0),
    ];
    const strands = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z + 0.06) * 9 + y * 14);
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
      .smoothUnion(0.02, hairCap.intersect(veilOuter.round(-0.002)), sdf.union(...locksList).intersect(sdf.box([0.37, 0.25, 0.6], 0.03).at(0, 0.782 - 0.125, 0.2)))
      .displace(0.0038, strands)
      .union(brow(1), brow(-1));
    k.body('hair', hairShape, { color: T.hair, roughness: 0.55, detail: 0.004, bone: 'head', bump: (x, y, z) => 0.0012 * strands(x * 1.3, y, z * 1.3) });

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
            [0.156, 0.17],
            [0.164, 0.115],
            [0.166, 0.09],
            [0.158, 0.08],
            [0, 0.08],
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
    const robePainted = robeShape.paintFn((x, y, z, base) => {
      const fold = Math.sin(Math.atan2(x, z) * 7 + y * 3);
      return fold < -0.4 ? mixRgb(base, rgb(C.fold), 0.6) : base;
    });
    k.body('robe', banded(robePainted), { color: C.robe, roughness: 0.85, detail: 0.006, bump: cloth });

    // The stole: one panel down the front
    // and the back, the pointed end above the hem, with gold trim along both edges.
    const stoleShape = profile.polygon([[-0.046, 0.16], [0.046, 0.16], [0.046, -0.11], [0, -0.158], [-0.046, -0.11]]);
    const stolePanel = (z: number) => sdf.extrude(stoleShape, 0.4, 0.01).at(0, 0.27, z);
    const stoleEdge = (z: number) => stolePanel(z).subtract(sdf.extrude(profile.offsetProfile(stoleShape, -0.008), 0.5, 0.006).at(0, 0.27, z));
    const stole = robeShape
      .round(0.01)
      .smoothIntersect(0.003, sdf.union(stolePanel(0.2), stolePanel(-0.2)))
      .paintWhere(sdf.union(stoleEdge(0.2), stoleEdge(-0.2)), C.gold, 0.002);
    k.body('trim', banded(stole), { color: T.trim, roughness: 0.8, detail: 0.005, bump: cloth });

    // Gold: the heart clasp on the stole at the chest, a bead at the throat, a small belt buckle.
    const robeFront = (y: number) => sdf.raycast(robeShape, [0, y, 1], [0, 0, -1])![2];
    const heartPts = Array.from({ length: 28 }, (_, i) => {
      const t = (i / 28) * Math.PI * 2;
      const hx = 16 * Math.sin(t) ** 3;
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return [hx * 0.00105, hy * 0.00105] as [number, number];
    });
    const heart = sdf.extrude(profile.polygon(heartPts, { smooth: true }), 0.016, 0.004).at(0, 0.3, robeFront(0.3) + 0.011);
    const throat = sdf.sphere(0.012).at(0, 0.385, (sdf.raycast(veilOuter, [0, 0.385, 1], [0, 0, -1])?.[2] ?? 0.13) + 0.002);
    const buckle = sdf.box([0.03, 0.026, 0.012], 0.004).at(0, 0.207, robeFront(0.207) + 0.019);
    k.body('gold', sdf.union(banded(heart), throat.bone('head'), buckle.bone('skirt')), { color: C.gold, roughness: 0.4, metalness: 0.6 });

    // Belt and the small pouch on the left hip (the mockup's side; the right hand holds the staff).
    const belt = robeShape
      .round(0.017)
      .smoothIntersect(0.004, sdf.box([0.6, 0.028, 0.6], 0.004).at(0, 0.207, 0));
    const PA = 68;
    const pouchAim = (d: number): V3 => [Math.sin(PA * rad) * d, 0.148, Math.cos(PA * rad) * d];
    const pouchHit = sdf.raycast(robeShape, pouchAim(0.5), norm([-pouchAim(1)[0], 0, -pouchAim(1)[2]]))!;
    const pouchAt = add(pouchHit as V3, [Math.sin(PA * rad) * 0.014, 0, Math.cos(PA * rad) * 0.014]);
    const pouch = sdf
      .union(
        sdf.box([0.05, 0.062, 0.03], 0.011),
        sdf.box([0.054, 0.028, 0.034], 0.01).at(0, 0.024, 0.001).paint('#6d4426'),
      )
      .rotateY(PA)
      .at(...pouchAt)
      .bone('skirt');
    const sandal = pair(
      sdf
        .union(
          sdf.ellipsoid([0.05, 0.013, 0.1]).at(ANKLE[0], 0.012, 0.04).intersect(sdf.halfSpace([0, -1, 0], 0)),
          ...[0.018, 0.078].map((z) => sdf.torus(0.043, 0.0065).rotateX(90).scale([1, 0.72, 1]).at(ANKLE[0], 0.03, z).intersect(sdf.halfSpace([0, -1, 0], -0.014))),
        )
        .bone('foot.L'),
    );
    k.body('leather', sdf.union(banded(belt), pouch, sandal), { color: C.leather, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ sleeves
    const sleeve = (sh: V3, el: V3, wr: V3, up: string, fore: string) => {
      const inner = lerp(sh, [0, sh[1], 0], 0.25);
      const cuffIn = sdf.cone(lerp(el, wr, 0.72), lerp(el, wr, 1.25), 0.04, 0.064);
      return sdf.smoothUnion(
        0.024,
        sdf.cone(inner, el, 0.05, 0.056).bone(up),
        sdf.cone(el, wr, 0.056, 0.07).smoothSubtract(0.006, cuffIn).bone(fore),
      );
    };
    k.body('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R')), {
      color: C.robe,
      roughness: 0.85,
      detail: 0.005,
      bump: cloth,
    });

    // ------------------------------------------------------------------ the staff (right hand)
    // Built at its own origin, the ring's center: Y up the staff, the ring's face toward +Z.
    const staffAtRing = (s: sdf.Shape) => s.rotateX(SUN_TILT.x).rotateZ(SUN_TILT.z).at(...SUN_AT);
    const BUTT = -(RING_T + STAFF_DOWN);
    k.body('staff', staffAtRing(sdf.capsule([0, BUTT + 0.01, 0], [0, 0.05, 0], 0.014)), { color: C.staffGold, roughness: 0.4, metalness: 0.7, bone: 'hand.R', detail: 0.004 });
    const wing = sdf
      .extrude(
        profile.polygon([[0.05, -0.016], [0.085, -0.024], [0.115, -0.008], [0.098, 0.002], [0.122, 0.022], [0.09, 0.024], [0.106, 0.046], [0.048, 0.03]]),
        0.014,
        0.004,
      )
      .at(0, 0.012, 0);
    const bead = (y: number, rx: number, ry: number) => sdf.ellipsoid([rx, ry, rx]).at(0, y, 0);
    const staffGoldLocal = sdf.union(
      sdf.cylinder(0.034, 0.03, 0.012).rotateX(90), // the hub
      sdf.torus(0.046, 0.01).rotateX(90), // the ring, 0.11 wide
      sdf.torus(0.026, 0.006).rotateX(90).at(0, 0, 0.014),
      ...[-0.17, -0.23, -0.29].map((y) => sdf.torus(0.0165, 0.0065).at(0, y, 0)), // three ring bands
      wing.mirror('x', 0),
      bead(-0.055, 0.026, 0.013),
      bead(-0.087, 0.022, 0.011),
      bead(-0.116, 0.019, 0.01),
      sdf.capsule([0, 0.04, 0], [0, 0.13, 0], 0.013), // the neck to the crescent
      sdf.sphere(0.027).at(0, BUTT + 0.024, 0), // the butt ball
    );
    k.body('staff-gold', staffAtRing(staffGoldLocal), { color: C.staffGold, roughness: 0.3, metalness: 0.85, bone: 'hand.R', detail: 0.004 });
    const crescentLocal = sdf
      .extrude(profile.circle(0.062), 0.032, 0.01)
      .subtract(sdf.extrude(profile.circle(0.05), 0.08).at(0.014, 0.033, 0))
      .rotateZ(14)
      .at(0, 0.192, 0);
    k.body('crescent', staffAtRing(crescentLocal), {
      color: C.crescentBase,
      roughness: 0.5,
      emissive: C.crescent,
      emissiveIntensity: 1.4,
      bone: 'hand.R',
      detail: 0.004,
    });
    // The healing flash: a small glowing star hidden inside the hub at rest; the attack scales its
    // bone up, so it bursts out over the ring and the wings and fades back in.
    const flashLocal = sdf.union(sdf.extrude(profile.polygon(starPts(8, 0.022, 0.008, 22.5)), 0.01, 0.002), sdf.sphere(0.012));
    k.body('holy-flash', staffAtRing(flashLocal), {
      color: C.flashBase,
      roughness: 0.5,
      emissive: C.holy,
      emissiveIntensity: 2.2,
      bone: 'sun',
    });

    // ------------------------------------------------------------------ the orb (left hand)
    k.body('orb', sdf.sphere(ORB_R).at(...ORB_AT), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.9,
      emissive: C.orb,
      emissiveIntensity: 0.6,
      bone: 'hand.L',
      detail: 0.004,
    });
    // A small glow inside the orb; the blessing scales it up out of the orb.
    k.body('orb-flash', sdf.sphere(0.03).at(...ORB_AT), {
      color: C.flashBase,
      roughness: 0.5,
      emissive: C.holy,
      emissiveIntensity: 2.0,
      bone: 'relic',
      detail: 0.004,
    });

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
          'upperarm.R': { rotate: [-armSwing * 0.35 * s, 0, -3] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.022, 0.6, 22, 2, 0.006));
    k.animation('run', stride(0.58, 0.13, 0.04, 0.4, 38, 9, 0.025));

    // Posing by targets: the wrist follows keys in the chest's rest frame (reach), and the hand
    // turns so the staff points along its own keys (orient). STAFF.up is the ring's face normal.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const STAFF = { dir: STAFF_AXIS, up: SUN_FACE };
    const BOOK = ORB_FRAME;
    const staffPose = (wrist: V3, dir: V3, up: V3, pole: V3 = [-0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], STAFF, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    const bookPoseAt = (wrist: V3, dir: V3, up: V3, pole: V3 = [0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      const hand = orient([arm.upper, arm.lower], BOOK, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };

    // attack: the healer raises the staff high beside him (out on the right, never over the
    // head), thrusts it up once, and the ring flashes with healing light: a glowing star bursts out
    // of the core, pulses, and fades; then he lowers the staff. He leans away from the staff and
    // looks up at it; the orb arm draws in.
    const RAISED: V3 = [-0.262, 0.47, 0.07];
    k.animation('attack', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const raise = ease(0.03, 0.3, p) * (1 - ease(0.72, 0.98, p));
        const thrust = ease(0.26, 0.34, p) * (1 - ease(0.46, 0.7, p));
        const flash = ease(0.32, 0.38, p) * (1 - ease(0.5, 0.72, p));
        const pulse = 0.35 * bump(clamp01((p - 0.36) / 0.22), 2);
        const wrist = add(lerp(WRIST_R, RAISED, raise), [-0.008 * thrust, 0.022 * thrust, 0.008 * thrust]);
        const dir = lerp(STAFF_AXIS, norm([-0.42, 1, 0.12]), raise);
        const up = lerp(SUN_FACE, norm([0.05, 0.12, 1]), raise);
        const s = 1 + (2.2 + pulse) * flash;
        return {
          ...staffPose(wrist, dir, up),
          sun: { scale: [s, s, s] },
          ...bookPoseAt(lerp(WRIST_L, [0.19, 0.3, 0.09], raise), BOOK.dir, BOOK.up),
          hips: { move: [0, 0.006 * thrust - 0.004 * raise, 0] },
          skirt: { rotate: [2 * raise - 2 * thrust, 0, 0] },
          spine: { rotate: [-3 * raise, 0, -2 * raise] },
          chest: { rotate: [-4 * raise - 3 * thrust, -8 * raise, -4 * raise] },
          head: { rotate: [-9 * raise, -10 * raise, -4 * raise] },
        };
      },
    });

    // attack2: a blessing. The healer plants the staff, turns his left side forward, and lifts the
    // orb forward to shoulder height on the open palm; the glow flares out of the orb, big and
    // bright, pulses, and settles.
    k.animation('attack2', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const lift = ease(0.04, 0.32, p) * (1 - ease(0.8, 1, p));
        const flare = ease(0.36, 0.46, p) * (1 - ease(0.64, 0.82, p));
        const pulse = 0.2 * bump(clamp01((p - 0.44) / 0.2), 2);
        const wrist = keys(p, [[0, WRIST_L], [0.32, [0.21, 0.42, 0.14]], [0.8, [0.21, 0.43, 0.14]], [1, WRIST_L]] as const);
        // The palm turns up and a little forward: the orb rises toward the target.
        const want = {
          dir: norm(lerp(BOOK.dir, norm([0, 0.3, 1]), lift)),
          up: norm(lerp(BOOK.up, norm([0, 1, -0.3]), lift)),
        };
        const s = 1 + 1.2 * flare + pulse;
        return {
          ...bookPoseAt(wrist, want.dir, want.up, [0.6, 0.1, -0.3]),
          relic: { scale: [s, s, s] },
          ...staffPose(
            keys(p, [[0, WRIST_R], [0.3, [-0.245, 0.27, 0.09]], [0.8, [-0.245, 0.27, 0.09]], [1, WRIST_R]] as const),
            lerp(STAFF_AXIS, norm([-0.25, 0.96, 0.05]), lift),
            SUN_FACE,
          ),
          hips: { move: [0, -0.008 * lift, -0.006 * lift], rotate: [0, -6 * lift, 0] },
          skirt: { rotate: [-2 * lift, 3 * lift, 0] },
          spine: { rotate: [-4 * lift, 0, 0] },
          chest: { rotate: [-3 * lift - 3 * flare, -12 * lift, 2 * lift] },
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
          ...staffPose(lerp(WRIST_R, [-0.265, 0.29, 0.04], h), lerp(STAFF_AXIS, norm([-0.5, 0.85, -0.1]), h), SUN_FACE),
          'upperarm.L': { rotate: [-6 * h, 0, 16 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger back, the knees give, and he falls flat on his back. Both arms fling out to
    // the sides as he lands; the staff ends on the ground beside his right side, pointing to his
    // feet, the orb beside his left. The robe skirt follows the legs.
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
          keys(p, [[0, SUN_FACE], [0.3, [-1, 0, 0]], [0.5, [-1, 0, 0]], [0.66, [0, 0.1045, 0.9945]]] as const),
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
    // jump thrusts the staff up beside his head (out on the right, never over it); the orb stays
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
        // The right arm reaches up and out to the side, so the crescent stays clear of the hair.
        const wrist: V3 = [-0.285 - 0.01 * pump, 0.47 + 0.02 * pump, 0.07 + 0.015 * pump];
        // In the crouch he pulls the fist up a little (the staff's butt stays off the floor).
        const load = p < OFF ? crouch : 0;
        return {
          ...staffPose(add(lerp(WRIST_R, wrist, up), [0, 0.05 * load, -0.01 * load]), lerp(STAFF_AXIS, norm([-0.36, 1, 0.16 - 0.1 * pump]), up), SUN_FACE),
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
