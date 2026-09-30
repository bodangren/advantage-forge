import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Oracle — Chibi Quest P1 hero, about 1.02 m to the top of the hair, faces +Z. Base: assets/priest.ts
 * (the cleric's skeleton with knee bones and `skirt`, the rogue's young round beardless face and
 * small round human ears, the robe with a banded skirt, the clip set).
 * Target: docs/hero-mockups/oracle_001.jpg, with round human ears and the eyes left visible under
 * a wide white headband.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite: the lavender hair pile, the white headband,
 *   the white and gold robe, and the pale blue crystal ball must read.
 * One idea: a serene young oracle in a white robe with wide bell sleeves; one hand offers a floating
 *   crystal ball with tiny stars, the other is open and offered forward.
 * Silhouette: a pile of thick soft lavender locks over a wide white headband, long locks to the
 *   shoulders, bell sleeves spread wide like wings with gold hems, a robe flaring to the ankles.
 * Proportions: hair top 1.02, headband 0.708 to 0.785, eyes 0.628, chin 0.48, shoulders 0.385,
 *   belt 0.29, robe hem 0.068, orb center about 0.09 above the left palm (radius 0.05).
 * Palette (60/30/10): white robe #f4efe4 (folds #d8d0bc); lavender hair #c8b8e0 (grooves darker);
 *   gold trims #e0b040; accents pale blue under-skirt #b8d8e8 and the crystal ball #a0d8ff.
 * Value plan: the white robe and headband are the light mass, the lavender hair frames the face
 *   (focal point), gold gives the second contrast, the brown belt and sandals ground it.
 * Bodies: skin (with the hands and bare feet), hair, headband, robe, underskirt, belt, sleeves,
 *   trim (gold), sandals, crystal, stars.
 * Rig: the priest's skeleton without `sun` and `relic`, plus `orb` (child of hand.L, above the palm).
 *   Clips: idle, walk, run, attack (a vision cast: the ball rises and flares), attack2 (a two-hand
 *   blessing wave), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c1622',
  iris: '#3a2a5a',
  irisLow: '#5a4a82',
  pupil: '#0e0c12',
  lid: '#1c1622',
  mouth: '#b45a4a',
  nose: '#f0a890',
  hair: '#c8b8e0',
  band: '#f4f0e8',
  bandFold: '#e2dccb',
  robe: '#f4efe4',
  fold: '#d8d0bc',
  gold: '#e0b040',
  under: '#b8d8e8',
  belt: '#6b4226',
  sandal: '#8a5a35',
  pants: '#6a7f8c',
  ballBase: '#205070',
  ball: '#a0d8ff',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const BAND = [0.708, 0.785] as const;
const pair = (s: sdf.Shape) => s.mirror('x');

// Joints. The left arm is raised out to the side with the palm up under the crystal ball; the
// right arm is bent forward with the open hand offered.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.22, 0.335, 0.03];
const WRIST_L: V3 = [0.285, 0.375, 0.09];
const ELBOW_R: V3 = [-0.215, 0.335, 0.03];
const WRIST_R: V3 = [-0.245, 0.31, 0.125];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
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

/** Turn a shape built along +Y at the origin so its axis points along `d`, then move it to `p`. */
const alongAxis = (s: sdf.Shape, d: V3, p: V3) => {
  const n = norm(d);
  const theta = -Math.asin(n[0]) / rad;
  const phi = Math.atan2(n[2], n[1]) / rad;
  return s.rotateZ(theta).rotateX(phi).at(...p);
};

// Open hands, built with the fingers along +Z and the palm normal +Y (pitch lifts the fingers).
const HAND_L = { pitch: 8, yaw: 35 };
const HAND_R = { pitch: 0, yaw: -10 };
const handAt = (h: { pitch: number; yaw: number }, w: V3) => (s: sdf.Shape) => s.rotateX(-h.pitch).rotateY(h.yaw).at(...w);
const handPoint = (h: { pitch: number; yaw: number }, w: V3, p: V3) => add(rotY(rotX(p, -h.pitch), h.yaw), w);
const handDir = (h: { pitch: number; yaw: number }) => norm(rotY(rotX([0, 0, 1], -h.pitch), h.yaw));
const handUp = (h: { pitch: number; yaw: number }) => norm(rotY(rotX([0, 1, 0], -h.pitch), h.yaw));
const openHand = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.008,
    sdf.ellipsoid([0.031, 0.0115, 0.031]).at(0, 0, 0.026),
    ...[
      [-0.021, 0.034],
      [-0.007, 0.041],
      [0.007, 0.039],
      [0.021, 0.03],
    ].map(([x, len]) => sdf.cone([x! * s, 0, 0.045], [x! * s * 1.05, 0.007, 0.045 + len!], 0.0088, 0.0068)),
    sdf.cone([s * 0.024, -0.001, 0.012], [s * 0.048, 0.005, 0.046], 0.011, 0.0085), // the thumb
  );
const PALM_L = handPoint(HAND_L, WRIST_L, [0, 0.004, 0.028]);
const ORB_AT: V3 = add(PALM_L, [0, 0.1, 0]); // 0.04 m clear of the palm

export default defineAsset({
  name: 'oracle',
  description: 'Chibi young oracle hero: lavender hair rolls, white headband, white and gold robe with bell sleeves, a floating crystal ball.',
  detail: 0.006,
  reference: 'docs/hero-mockups/oracle_001.jpg',
  variants: {
    eyes: { dark: C.iris, blue: '#2f6aa8', violet: '#6a4a9e' },
    hair: { lavender: C.hair, silver: '#d8d4d0', black: '#231a17' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    trim: { gold: C.gold, silver: '#a7b6c8', rose: '#d87a8a' },
  },
  presets: {
    default: { eyes: 'dark', hair: 'lavender', skin: 'fair', trim: 'gold' },
    silver: { eyes: 'blue', hair: 'silver', skin: 'tan', trim: 'silver' },
    rose: { eyes: 'violet', hair: 'black', skin: 'brown', trim: 'rose' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', -0.25),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      nose: k.tint('skin', { color: C.nose, follow: 0.5 }),
      trim: k.tint('trim'),
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
      orb: { parent: 'hand.L', at: ORB_AT },
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
        .ellipsoid([0.028, 0.06, 0.046])
        .subtract(sdf.sphere(0.023).at(0.019, 0, 0.012))
        .rotateY(-38)
        .at(0.212, 0.598, -0.012)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const armSkin = (s: 1 | -1) => {
      const sh = s > 0 ? SHOULDER : mx(SHOULDER);
      const el = s > 0 ? ELBOW_L : ELBOW_R;
      const wr = s > 0 ? WRIST_L : WRIST_R;
      const side = s > 0 ? 'L' : 'R';
      const h = s > 0 ? HAND_L : HAND_R;
      return sdf.smoothUnion(
        0.018,
        sdf.cone(lerp(sh, el, 0.35), el, 0.034, 0.032).bone(`upperarm.${side}`),
        sdf.cone(el, wr, 0.033, 0.029).bone(`forearm.${side}`),
        handAt(h, wr)(openHand(s)).bone(`hand.${side}`),
      );
    };
    // Bare feet with a heel, an ankle, and five toes (the sandal is a separate body).
    const toe = (x: number, r: number, z: number) => sdf.sphere(r).at(x, 0.026, z);
    const footSkin = sdf
      .smoothUnion(
        0.014,
        sdf.ellipsoid([0.037, 0.026, 0.078]).at(0, 0.04, 0.03),
        sdf.capsule([0, 0.11, -0.004], [0, 0.055, 0.0], 0.025),
        toe(-0.02, 0.0115, 0.105),
        toe(-0.006, 0.009, 0.112),
        toe(0.006, 0.0085, 0.108),
        toe(0.017, 0.008, 0.1),
        toe(0.027, 0.0075, 0.088),
      )
      .rotateY(8)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');

    // Face paint: stencils cross the face along Z.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.039, 0.045, 0.07]), EYE[0], EYE[1] - 0.003));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.041, 0.07]), EYE[0], EYE[1] - 0.004));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.022));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.031, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.052, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.012), x + 0.014, EYE[1] + 0.018)),
    );
    const smile = sdf.extrude(profile.arc(0.055, 0.009, 248, 292), 0.3).at(0, 0.522 + 0.055, 0.1);
    const blush = pair(at(sdf.sphere(0.036), 0.135, 0.556));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armSkin(1), armSkin(-1), pair(footSkin))
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

    // ------------------------------------------------------------------ the headband
    // A wide white silk band across the forehead, above the eyes; it wraps the whole head.
    const bandMid = (BAND[0] + BAND[1]) / 2;
    const bandH = BAND[1] - BAND[0];
    const headBig = (grow: number) => sdf.ellipsoid([HEAD[0] + grow, HEAD[1] + grow, HEAD[2] + grow]).at(0, HEAD_Y, 0);
    const band = headBig(0.03).smoothIntersect(0.008, sdf.box([1, bandH, 1], 0.012).at(0, bandMid, 0));
    const bandFold = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z) * 5 + y * 30);
    k.body(
      'headband',
      band
        .paintFn((x, y, z, base) => mixRgb(base, rgb(C.bandFold), 0.55 * clamp01(0.5 + 0.7 * bandFold(x, y, z))))
        .bone('head'),
      {
        color: C.band,
        roughness: 0.85,
        detail: 0.004,
        bump: (x, y, z) => 0.0025 * bandFold(x, y, z) + 0.0012 * noise.fbm(x * 40, y * 40, z * 40, 2),
      },
    );

    // ------------------------------------------------------------------ hair
    // Thick rolled locks piled over the band, a thin cap under them, and six locks that fall to the
    // shoulders. The band's slab is cut out of the hair, so the silk always lies on top.
    const bandCut = headBig(0.07).intersect(sdf.box([1, bandH + 0.004, 1]).at(0, bandMid, 0));
    const faceMask = sdf.ellipsoid([0.235, 0.235, 0.23]).rotateZ(6).at(0, 0.615, 0.17);
    const cap = sdf
      .smoothUnion(
        0.03,
        headBig(0.028).at(0, 0.0, -0.006),
        sdf.ellipsoid([0.1, 0.03, 0.09]).at(0, 0.84, -0.006), // a low base under the rolls; the rolls make the pile
      )
      .smoothSubtract(0.02, faceMask.at(0, 0, 0))
      .smoothSubtract(0.015, pair(sdf.ellipsoid([0.07, 0.07, 0.08]).at(0.228, 0.598, -0.005)))
      .intersect(sdf.halfSpace(norm([0, -1, -0.35]), -0.53));
    // Four thick twisted rolls loop from the band up over the crown and back down: two cross front to
    // back, two run side to side. Each is a chain of six points with a sideways wobble (the twist).
    const roll = (a: readonly [number, number], b: readonly [number, number], h: number, r: number, wob: number) => {
      const pts = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t, j) => {
        const x = a[0] + (b[0] - a[0]) * t;
        const z = a[1] + (b[1] - a[1]) * t;
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const l = Math.hypot(dx, dz);
        const w = wob * Math.sin(j * 2.1 + h * 20) * Math.sin(Math.PI * t);
        const y = 0.797 + h * Math.pow(Math.sin(Math.PI * t), 0.7);
        return [x - (dz / l) * w, y, z + (dx / l) * w, r * (1 + 0.1 * Math.sin(j * 1.7 + 1))] as [number, number, number, number];
      });
      return sdf.chain(pts, 0.02);
    };
    // A thin shell over the whole top of the skull keeps the forehead above the band covered.
    const crownShell = headBig(0.024).intersect(sdf.halfSpace([0, -1, 0], -0.775));
    const pile = sdf.union(
      crownShell,
      roll([-0.105, 0.135], [0.105, -0.135], 0.19, 0.042, 0.02),
      roll([0.105, 0.135], [-0.105, -0.135], 0.15, 0.04, 0.02),
      roll([-0.165, 0.045], [0.165, 0.03], 0.172, 0.043, 0.018),
      roll([0.165, -0.05], [-0.165, -0.065], 0.13, 0.041, 0.018),
      roll([-0.03, 0.16], [0.16, -0.12], 0.115, 0.036, 0.014),
      roll([0.03, -0.16], [-0.16, 0.1], 0.11, 0.036, 0.014),
    );
    // Six long locks (three a side): behind the ear, at the back, and the center of the back.
    const falling = pair(
      sdf.smoothUnion(
        0.03,
        sdf.chain(
          [
            [0.2, 0.715, -0.02, 0.034],
            [0.222, 0.6, -0.088, 0.037],
            [0.212, 0.5, -0.09, 0.035],
            [0.185, 0.425, -0.04, 0.03],
            [0.17, 0.385, 0.01, 0.02],
          ],
          0.02,
        ),
        sdf.chain(
          [
            [0.12, 0.715, -0.14, 0.036],
            [0.15, 0.6, -0.16, 0.039],
            [0.148, 0.49, -0.15, 0.036],
            [0.13, 0.415, -0.115, 0.028],
          ],
          0.02,
        ),
        sdf.chain(
          [
            [0.04, 0.715, -0.17, 0.036],
            [0.05, 0.6, -0.195, 0.039],
            [0.06, 0.49, -0.175, 0.035],
            [0.06, 0.415, -0.135, 0.026],
          ],
          0.02,
        ),
      ),
    );
    const locksFn = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z + 0.05) * 9 + y * 22 + Math.sin(y * 30) * 0.6);
    // The pile is painted light over a darker base: the gaps between locks read as grooves.
    // Above the band the shade follows height: the valleys between the rolls sit low and go dark, the
    // roll tops stay light, so each roll reads as its own loop. Below the band the stripes shade the locks.
    const pileShade = (x: number, y: number, z: number) => {
      const stripe = 0.9 * clamp01(0.5 - 1.2 * locksFn(x, y, z));
      const valley = 0.85 * clamp01((0.9 - y) / 0.09);
      const w = clamp01((y - 0.79) / 0.02);
      return stripe * (1 - w) + valley * w;
    };
    const hairShape = sdf
      .smoothUnion(0.016, cap, falling, sdf.ellipsoid([0.17, 0.15, 0.085]).at(0, 0.57, -0.125)) // the last is the back curtain
      .smoothUnion(0.006, pile)
      .subtract(bandCut)
      .paintFn((x, y, z, base) => mixRgb(rgb(T.hair), rgb(T.hairDark), pileShade(x, y, z)));
    const brow = (s: 1 | -1) => {
      const pt = (x: number, y: number, lift: number): V3 => [s * x, y, faceZ(x, y) + lift];
      const a = pt(0.056, 0.699, 0.004);
      const m = pt(0.1, 0.706, 0.006);
      const b = pt(0.143, 0.699, 0.004);
      return sdf.chain(
        [
          [a[0], a[1], a[2], 0.0075],
          [m[0], m[1], m[2], 0.0105],
          [b[0], b[1], b[2], 0.0065],
        ],
        0.008,
      );
    };
    k.body('hair', hairShape, { color: T.hair, roughness: 0.55, detail: 0.005, bone: 'head', bump: (x, y, z) => (y > 0.79 ? 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 2) : 0.004 * locksFn(x, y, z)), maxTriangles: 18000 });
    k.body('brows', sdf.union(brow(1), brow(-1)).paint(T.hairDark), { color: T.hairDark, roughness: 0.6, detail: 0.003, bone: 'head' });

    // ------------------------------------------------------------------ the robe
    const robeAt = (sc: number) =>
      sdf
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
              [0.156, 0.16],
              [0.164, 0.1],
              [0.166, 0.078],
              [0.158, 0.068],
              [0, 0.068],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([sc, 1, 0.86 * sc]);
    const robeShape = robeAt(1);
    const SKIRT_Y = 0.23;
    const CHEST_Y = 0.33;
    const banded = (s: sdf.Shape) =>
      sdf.union(
        s.intersect(sdf.halfSpace([0, -1, 0], -CHEST_Y)).bone('chest'),
        s.intersect(sdf.halfSpace([0, 1, 0], CHEST_Y)).intersect(sdf.halfSpace([0, -1, 0], -SKIRT_Y)).bone('spine'),
        s.intersect(sdf.halfSpace([0, 1, 0], SKIRT_Y)).bone('skirt'),
      );
    // The robe opens below the belt over the pale blue under-skirt.
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.028, 0.272],
          [0.028, 0.272],
          [0.064, 0.05],
          [-0.064, 0.05],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const robeCut = robeShape.smoothSubtract(0.008, opening);
    const collarBand = sdf.cylinder(0.058, 0.034, 0.008).at(0, 0.472, -0.008).bone('chest');
    const foldFn = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z) * 8 + y * 5) * (0.6 + 0.4 * Math.sin(y * 17 + x * 9));
    const foldPaint = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) =>
      mixRgb(base, rgb(C.fold), 0.85 * clamp01(0.35 - 0.9 * foldFn(x, y, z)));
    k.body('robe', sdf.union(banded(robeCut), collarBand).paintFn(foldPaint), {
      color: C.robe,
      roughness: 0.8,
      detail: 0.006,
      bump: (x, y, z) => 0.002 * foldFn(x, y, z),
    });
    k.body('underskirt', banded(robeAt(0.95).intersect(sdf.halfSpace([0, 1, 0], 0.34))), {
      color: C.under,
      roughness: 0.85,
      detail: 0.006,
    });
    const beltShape = robeShape
      .round(0.008)
      .smoothIntersect(0.004, sdf.box([0.6, 0.032, 0.6], 0.006).at(0, 0.29, 0));
    k.body('belt', banded(beltShape), { color: C.belt, roughness: 0.65, detail: 0.005 });

    // ------------------------------------------------------------------ bell sleeves
    const sleeveParts = (s: 1 | -1) => {
      const sh = s > 0 ? SHOULDER : mx(SHOULDER);
      const el = s > 0 ? ELBOW_L : ELBOW_R;
      const wr = s > 0 ? WRIST_L : WRIST_R;
      const up = `upperarm.${s > 0 ? 'L' : 'R'}`;
      const fore = `forearm.${s > 0 ? 'L' : 'R'}`;
      const f = norm(sub(wr, el));
      const H = lerp(el, wr, 0.7); // the bell's open end
      const inner = lerp(sh, [0, sh[1], 0], 0.25);
      const bell = sdf
        .cone(el, H, 0.056, 0.075)
        .smoothSubtract(0.006, sdf.cone(lerp(el, H, 0.55), add(H, [f[0] * 0.03, f[1] * 0.03, f[2] * 0.03]), 0.042, 0.069));
      // A drape of cloth hangs from the bell's underside, wide like a wing.
      const drapeC = add(H, [s * 0.02, -0.098, -0.005]);
      const drape = sdf.ellipsoid([0.072, 0.105, 0.032]).rotateZ(-s * 14).at(...drapeC);
      const cloth = sdf.smoothUnion(0.03, sdf.cone(inner, el, 0.05, 0.056).bone(up), bell.bone(fore), drape.bone(fore));
      const bottom = drapeC[1] - 0.105;
      // The gold hem: a torus on the bell's end and a band along the drape's lower edge.
      const hemRing = alongAxis(sdf.torus(0.075, 0.008), f, add(H, [f[0] * 0.006, f[1] * 0.006, f[2] * 0.006])).bone(fore);
      const drapeHem = drape
        .round(0.006)
        .smoothIntersect(0.004, sdf.box([0.4, 0.034, 0.4], 0.004).at(0, bottom + 0.014, 0))
        .bone(fore);
      // A bangle pair on the bare wrist, past the bell.
      const bangle = (t: number) => alongAxis(sdf.torus(0.0345, 0.0078), f, lerp(el, wr, t)).bone(fore);
      // A small gold triangle tab at the cuff's outer bottom corner, on both faces of the drape.
      const tab = drape
        .round(0.008)
        .smoothIntersect(
          0.003,
          sdf.extrude(profile.polygon([[-0.026, 0.0], [0.026, 0.0], [0, -0.05]]), 0.3, 0.002).at(drapeC[0] + s * 0.036, bottom + 0.05, drapeC[2]),
        )
        .bone(fore);
      return { cloth, gold: sdf.union(hemRing, drapeHem, tab, bangle(0.86), bangle(0.96)) };
    };
    const sl = sleeveParts(1);
    const sr = sleeveParts(-1);
    k.body('sleeves', sdf.union(sl.cloth, sr.cloth).paintFn(foldPaint), {
      color: C.robe,
      roughness: 0.8,
      detail: 0.005,
      bump: (x, y, z) => 0.002 * foldFn(x, y, z),
    });

    // ------------------------------------------------------------------ gold trim
    const surfZ = (x: number, y: number) => sdf.raycast(robeShape, [x, y, 1], [0, 0, -1])![2];
    const collarRing = sdf.torus(0.07, 0.0125).scale([1, 1, 0.92]).at(0, 0.458, -0.008).bone('chest');
    const lapel = (s: 1 | -1) => {
      const p0: V3 = [s * 0.066, 0.446, surfZ(0.066, 0.446) + 0.003];
      const p1: V3 = [s * 0.036, 0.41, surfZ(0.036, 0.41) + 0.004];
      const p2: V3 = [0, 0.375, surfZ(0, 0.375) + 0.004];
      return sdf.chain(
        [
          [...p0, 0.0085],
          [...p1, 0.0085],
          [...p2, 0.0085],
        ],
        0.006,
      );
    };
    // A gold chevron across the chest under the collar.
    const chevron = sdf.chain(
      [-0.108, -0.054, 0, 0.054, 0.108].map((x) => {
        const y = 0.372 + Math.abs(x) * 0.36;
        return [x, y, surfZ(x, y) + 0.003, 0.0065] as [number, number, number, number];
      }),
      0.005,
    ).bone('chest');
    const dropProfile = profile.polygon(
      [
        [0, -0.024],
        [0.009, -0.012],
        [0.0145, 0.002],
        [0.012, 0.014],
        [0, 0.02],
        [-0.012, 0.014],
        [-0.0145, 0.002],
        [-0.009, -0.012],
      ],
      { smooth: true },
    );
    const clasp = sdf.extrude(dropProfile, 0.02, 0.004).at(0, 0.347, surfZ(0, 0.347) + 0.002).bone('chest');
    const buckle = sdf
      .extrude(profile.rect([0.038, 0.032], 0.006), 0.014, 0.003)
      .at(0, 0.29, surfZ(0, 0.29) + 0.006)
      .bone('spine');
    const flameProfile = profile.polygon(
      [
        [-0.022, 0],
        [-0.024, 0.014],
        [-0.013, 0.03],
        [-0.016, 0.044],
        [-0.002, 0.062],
        [0.004, 0.044],
        [0.014, 0.032],
        [0.023, 0.016],
        [0.022, 0],
      ],
      { smooth: true },
    );
    const flame = (angle: number) =>
      robeShape
        .round(0.009)
        .smoothIntersect(0.003, sdf.extrude(flameProfile, 0.5, 0.002).at(0, 0.103, 0.22).rotateY(angle));
    const flames = banded(sdf.union(...[32, -32, 148, -148].map(flame)));
    // Gold hem corners: small triangles at the front split.
    const corner = (x: number) =>
      robeShape
        .round(0.009)
        .smoothIntersect(0.003, sdf.extrude(profile.polygon([[-0.02, 0], [0.02, 0], [x > 0 ? 0.016 : -0.016, 0.052]]), 0.5, 0.002).at(x, 0.078, 0.22));
    const hemCorners = banded(sdf.union(corner(0.084), corner(-0.084)));
    const hemRingBody = banded(
      robeShape
        .round(0.006)
        .smoothIntersect(0.004, sdf.box([0.6, 0.024, 0.6], 0.004).at(0, 0.085, 0))
        .smoothSubtract(0.004, opening),
    );
    k.body('trim', sdf.union(collarRing, lapel(1), lapel(-1), clasp, buckle, flames, hemCorners, chevron, hemRingBody, sl.gold, sr.gold), {
      color: T.trim,
      roughness: 0.4,
      metalness: 0.7,
      detail: 0.004,
      maxTriangles: 9500,
    });

    // ------------------------------------------------------------------ hidden legs and sandals
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.08]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0], 0.1, 0.004], 0.042).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85, detail: 0.007 });
    const sole = sdf.box([0.088, 0.016, 0.172], 0.007).at(0, 0.008, 0.03);
    const instep = sdf
      .ellipsoid([0.037, 0.026, 0.078])
      .at(0, 0.04, 0.03)
      .round(0.007)
      .smoothIntersect(0.003, sdf.box([0.2, 0.2, 0.016]).at(0, 0.05, 0.04));
    const ankleStrap = sdf
      .capsule([0, 0.11, -0.004], [0, 0.055, 0.0], 0.025)
      .round(0.007)
      .smoothIntersect(0.003, sdf.box([0.2, 0.014, 0.2]).at(0, 0.064, 0));
    const heelStrap = sdf.capsule([0, 0.012, -0.04], [0, 0.058, -0.012], 0.01);
    const sandal = sdf
      .smoothUnion(0.008, sole, instep, ankleStrap, heelStrap)
      .rotateY(8)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('sandals', pair(sandal), { color: C.sandal, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ the crystal ball
    const orbAt = (p: V3) => p;
    k.body('crystal', sdf.sphere(0.05).at(...orbAt(ORB_AT)), {
      color: C.ballBase,
      roughness: 0.1,
      opacity: 0.7,
      emissive: C.ball,
      emissiveIntensity: 0.9,
      detail: 0.004,
      bone: 'orb',
    });
    const stars = sdf.union(
      ...[0, 1, 2, 3].map((i) => {
        const a = (i * 90 + 30) * rad;
        return sdf.sphere(0.0078).at(ORB_AT[0] + 0.066 * Math.cos(a), ORB_AT[1] + 0.024 * Math.sin(2 * a + 1), ORB_AT[2] + 0.066 * Math.sin(a));
      }),
    );
    k.body('stars', stars, { color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.4, roughness: 0.4, detail: 0.003, bone: 'orb' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys, reach, orient } = motion;
    const ease = (a: number, b: number, x: number) => {
      const t = clamp01((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const REST_L = { dir: handDir(HAND_L), up: handUp(HAND_L) };
    const REST_R = { dir: handDir(HAND_R), up: handUp(HAND_R) };
    // Wrist target in the chest's rest frame; the hand turns to `dir` (fingers) and `up` (palm).
    const armL = (wrist: V3, dir: V3 = REST_L.dir, up: V3 = REST_L.up, pole: V3 = ELBOW_L) => {
      const arm = reach(ARM_L, wrist, pole);
      const hand = orient([arm.upper, arm.lower], REST_L, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };
    const armR = (wrist: V3, dir: V3 = REST_R.dir, up: V3 = REST_R.up, pole: V3 = ELBOW_R) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], REST_R, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    // The stars circle the ball: the orb bone turns once per clip.
    const spin = (p: number) => ({ rotate: [0, 360 * p, 0] as const });

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        skirt: { rotate: [1.2 * wave(p, 1, 0.2), 0, 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        'forearm.R': { rotate: [-3 * bump(p), 0, 0] },
        'forearm.L': { rotate: [0, 0, 2 * wave(p, 1, 0.15)] },
        orb: { move: [0, 0.008 * wave(p, 1, 0.1), 0], rotate: [0, 360 * p, 0] },
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
          sit: 0,
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
          // The arms are out to the side: they swing about Y (left back while the right is forward).
          'upperarm.L': { rotate: [0, armSwing * 0.28 * s, 3 * wave(p, 2, 0.1)] as const },
          'upperarm.R': { rotate: [0, armSwing * 0.28 * s, -3 * wave(p, 2, 0.1)] as const },
          'forearm.L': { rotate: [0, 0, 3 * wave(p, 2, 0.35)] as const },
          orb: { move: [0, 0.006 * wave(p, 2, 0.2), 0] as const, ...spin(p) },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.022, 0.6, 22, 2, 0.006));
    k.animation('run', stride(0.58, 0.13, 0.04, 0.4, 38, 9, 0.025));

    // attack: a vision cast. The left arm brings the ball out in front, the ball rises and flares
    // bright, and the right hand pushes forward, palm out; then both settle back.
    k.animation('attack', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const raise = ease(0.03, 0.3, p) * (1 - ease(0.74, 0.98, p));
        const flare = ease(0.32, 0.42, p) * (1 - ease(0.56, 0.74, p));
        const pulse = 0.25 * bump(clamp01((p - 0.4) / 0.2), 2);
        const s = 1 + (0.7 + pulse) * flare;
        const push = ease(0.3, 0.44, p) * (1 - ease(0.6, 0.85, p));
        return {
          ...armL(lerp(WRIST_L, [0.25, 0.38, 0.2], raise), lerp(REST_L.dir, [0.1, 0.05, 1], raise), lerp(REST_L.up, [0, 1, 0], raise)),
          ...armR(
            lerp(WRIST_R, [-0.2, 0.4, 0.19], Math.max(raise * 0.5, push)),
            lerp(REST_R.dir, [-0.05, 0.75, 0.65], push),
            lerp(REST_R.up, [0, 0.4, 1], push),
          ),
          orb: { move: [0.02 * flare, 0.015 * flare, 0.1 * flare], scale: [s, s, s], rotate: [0, 720 * p, 0] },
          hips: { move: [0, -0.004 * raise, 0] },
          skirt: { rotate: [2 * raise - 2 * push, 0, 0] },
          spine: { rotate: [-2 * raise, 0, 0] },
          chest: { rotate: [-3 * raise - 3 * push, 4 * raise, 0] },
          head: { rotate: [-3 * raise + 4 * flare, 4 * raise, 0] },
        };
      },
    });

    // attack2: a two-hand blessing wave. Both arms rise, then sweep together in front and back out,
    // the right hand palm-forward; the left palm stays up under the ball, which flares once.
    k.animation('attack2', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const lift = ease(0.04, 0.3, p) * (1 - ease(0.82, 1, p));
        const sweep = 0.5 - 0.5 * Math.cos(2 * Math.PI * clamp01((p - 0.3) / 0.5)); // 0 to 1 to 0
        const flare = ease(0.4, 0.5, p) * (1 - ease(0.62, 0.8, p));
        const s = 1 + 0.35 * flare;
        const wL = add(lerp(WRIST_L, [0.34, 0.43, 0.06], lift), [-0.05 * sweep, 0.0, 0.15 * sweep]);
        const wR = add(lerp(WRIST_R, [-0.31, 0.48, 0.05], lift), [0.15 * sweep, 0.0, 0.14 * sweep]);
        return {
          ...armL(wL, lerp(REST_L.dir, [0.4, 0.1, 1], lift), lerp(REST_L.up, [0, 1, 0], lift)),
          ...armR(wR, lerp(REST_R.dir, [-0.5, 0.35, 1], lift), lerp(REST_R.up, [0, 0.55, 1], lift)),
          orb: { scale: [s, s, s], move: [0.02 * flare, 0, 0.04 * flare], rotate: [0, 720 * p, 0] },
          hips: { move: [0, -0.004 * lift, 0] },
          skirt: { rotate: [-1.5 * lift, 3 * sweep, 0] },
          spine: { rotate: [-2 * lift, 0, 0] },
          chest: { rotate: [-2 * lift, -6 * sweep + 3 * lift, 0] },
          head: { rotate: [-4 * lift, 6 * sweep, 0] },
        };
      },
    });

    // hit: the head and chest snap back from a blow, a small step back, a quick return.
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
          ...armL(lerp(WRIST_L, [0.3, 0.33, 0.05], h)),
          ...armR(lerp(WRIST_R, [-0.28, 0.34, 0.06], h)),
          orb: { move: [0, 0.02 * h, -0.02 * h], scale: [1 + 0.3 * h, 1 + 0.3 * h, 1 + 0.3 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger back, the knees give, and she falls flat on her back with both arms flung out.
    // The crystal ball shrinks away as she falls.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(clamp01((p - 0.66) / 0.16));
        const fling = ease(0.2, 0.62, p);
        const legL = 6 * stagger + 16 * bump(fall) + 22 * fall;
        const legR = -6 * stagger + 18 * bump(fall) + 24 * fall;
        const gone = 1 - 0.97 * ease(0.2, 0.5, p);
        return {
          ...armL(lerp(WRIST_L, [0.33, 0.34, -0.03], fling), lerp(REST_L.dir, [1, 0, 0.3], fling), lerp(REST_L.up, [0, 0, 1], fling), [0.3, 0.2, -0.4]),
          ...armR(lerp(WRIST_R, [-0.33, 0.34, -0.03], fling), lerp(REST_R.dir, [-1, 0, 0.3], fling), lerp(REST_R.up, [0, 0, 1], fling), [-0.3, 0.2, -0.4]),
          orb: { scale: [gone, gone, gone] },
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

    // victory: a jump on both knees with both arms up; the ball flares at the top and she lands.
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
        const s = 1 + 0.5 * pump;
        return {
          ...armL(lerp(WRIST_L, [0.34 + 0.01 * pump, 0.44 + 0.03 * pump, 0.05], up), lerp(REST_L.dir, [0.5, 0.3, 0.8], up), lerp(REST_L.up, [0, 1, 0], up)),
          ...armR(lerp(WRIST_R, [-0.3 - 0.01 * pump, 0.49 + 0.03 * pump, 0.05], up), lerp(REST_R.dir, [-0.35, 0.8, 0.4], up), lerp(REST_R.up, [0, 0.3, 1], up)),
          orb: { scale: [s, s, s], rotate: [0, 720 * p, 0] },
          hips: { move: [0, hipsY, 0] },
          skirt: { rotate: [0.5 * (legsL.leg[0] + legsR.leg[0]) * 0.5 + 6 * tuck, 0, 0] },
          spine: { rotate: [5 * crouch - 5 * up, 0, 0] },
          chest: { rotate: [-4 * up - 3 * pump, -4 * up, 0] },
          head: { rotate: [-8 * up - 4 * crouch, -3 * up, 0] },
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
