import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Wizard — Chibi Quest hero (catalog `heroes/magic/wizard`), about 1.05 m to the hat point,
 * faces +Z. Target: docs/hero-mockups/wizard_001.png (cropped from
 * docs/character-mockups/chibi-quest-heroes.png; one front view, the rest is designed here).
 * Built on the rogue's head, face, and skeleton, so the heroes read as one set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the hat, the face, and the fire read.
 * One idea: a huge floppy red witch hat over a beaming face; fire in both hands — an orb held
 *   up in a gnarled staff, a small flame on the open palm.
 * Proportions: hat point 1.05, brim 0.74 (radius 0.33), eyes 0.63, chin 0.48, shoulders 0.385,
 *   belt 0.25, robe hem 0.1, boots 0.09. Staff top 0.74 on the right (-X), orb above it.
 * Shape language: round and soft (brim, cheeks, robe, boots), with flame and hat-point curls.
 * Palette (60/30/10): red cloth #b8322b (robe, hat, cape); dark tunic #3a3034 and brown leather
 *   #74462a; gold #e2b04a trim and warm fire as the accent. Skin #f2c7a4, hair #6b3a22.
 * Value plan: the dark hat underside and brown hair frame the light face (focal point); the
 *   glowing fire is the brightest accent on both sides; gold trims echo it on the robe.
 * Bodies: skin, hair, hat, hat-band, robe, tunic, cape, sleeves, leather, gold, legs, boots,
 *   staff, fire.
 * Rig: the rogue's chibi skeleton plus `cloak` (cape) and `hattip`; the staff and the orb are
 *   rigid on the right hand, the palm flame on the left hand. Clips: idle, walk, run.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  freckle: '#cf8a66',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#b07a34',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#5a3422',
  mouth: '#7a2a2a',
  teeth: '#fbf5ee',
  tongue: '#e0706a',
  hair: '#6b3a22',
  red: '#b8322b',
  redDark: '#7e1f1c',
  hatInside: '#5a1a17',
  tunic: '#3a3034',
  ember: '#e0762a',
  leather: '#74462a',
  leatherDark: '#4e2d1b',
  gold: '#e2b04a',
  gem: '#c0222a',
  legs: '#3a3034',
  boot: '#6e3f22',
  sole: '#42281a',
  wood: '#6a3d22',
  woodDark: '#4a2a17',
  fire: '#e8401a',
  fireCore: '#ffc629',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. Both arms are held out from the body: the right hand grips the staff, the left hand
// is open, palm up, with a flame above it.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.198, 0.36, -0.004];
const WRIST_R: V3 = [-0.24, 0.35, 0.085];
const ELBOW_L: V3 = [0.198, 0.355, 0.012];
const WRIST_L: V3 = [0.258, 0.35, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];

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

/** A fist hanging from the wrist at the origin; its grip hole runs along Z. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(0.007 * s, -0.038, 0.004),
    sdf.capsule([-0.009 * s, -0.058, 0.03], [-0.005 * s, -0.038, 0.042], 0.017),
    sdf.cone([0.02 * s, -0.023, 0.025], [0.001 * s, -0.033, 0.048], 0.016, 0.013),
  );
// The staff hand swings forward and tips out, so the grip hole (and the staff) leans outward.
const HAND_R = { pitch: -80, roll: 12 };
const handR = (s: sdf.Shape) => s.rotateX(HAND_R.pitch).rotateZ(HAND_R.roll).at(...WRIST_R);
const handRPoint = (p: V3) => add(rotZ(rotX(p, HAND_R.pitch), HAND_R.roll), WRIST_R);
const STAFF_AXIS = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);
const GRIP = handRPoint([-0.007, -0.04, 0.004]);

/** An open hand, palm up, pointing along +X from the wrist at the origin. */
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
const PALM_FLAME: V3 = add(WRIST_L, rotY([0.05, 0.05, 0.004], HAND_L_YAW));

/** A flame: a round base that rises into two or three curling tongues. `h` is its height. */
const flame = (h: number) =>
  sdf.smoothUnion(
    h * 0.08,
    sdf.sphere(h * 0.3).at(0, h * 0.3, 0),
    sdf.chain(
      [
        [0, h * 0.35, 0, h * 0.28],
        [h * 0.05, h * 0.7, 0, h * 0.16],
        [-h * 0.04, h, 0, h * 0.03],
      ],
      h * 0.1,
    ),
    sdf.chain(
      [
        [h * 0.14, h * 0.4, 0.0, h * 0.13],
        [h * 0.3, h * 0.66, 0, h * 0.07],
        [h * 0.26, h * 0.86, 0, h * 0.018],
      ],
      h * 0.06,
    ),
    sdf.chain(
      [
        [-h * 0.15, h * 0.36, 0, h * 0.12],
        [-h * 0.3, h * 0.58, 0.02 * h, h * 0.06],
        [-h * 0.3, h * 0.76, 0, h * 0.016],
      ],
      h * 0.06,
    ),
  );
const fireCore = rgb(C.fireCore);
const fireOuter = rgb(C.fire);
/** Fire color: a light core low in the flame, orange toward the tips. */
const firePaint = (base: V3, h: number) => (x: number, y: number, z: number) => {
  const t = Math.min(1, Math.max(0, (y - base[1]) / h));
  const r = Math.hypot(x - base[0], z - base[2]) / (h * 0.3);
  const k = Math.min(1, Math.max(0, t * 0.9 + r * 0.5 - 0.15));
  return [
    fireCore[0] + (fireOuter[0] - fireCore[0]) * k,
    fireCore[1] + (fireOuter[1] - fireCore[1]) * k,
    fireCore[2] + (fireOuter[2] - fireCore[2]) * k,
  ] as const;
};

export default defineAsset({
  name: 'wizard',
  description: 'Chibi wizard hero with a huge red witch hat, a fire-orb staff, and a flame in her palm.',
  detail: 0.005,
  reference: 'docs/hero-mockups/wizard_001.png',

  build(k) {
    // ------------------------------------------------------------------ skeleton
    const HAT_TIP_AT: V3 = [0.03, 0.93, -0.03];
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      hattip: { parent: 'head', at: HAT_TIP_AT, tail: [0.26, 0.9, -0.08] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
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
    const nose = sdf.ellipsoid([0.018, 0.014, 0.014]).at(0, 0.568, faceZ(0, 0.568) - 0.004).bone('head');
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
      handR(fistLocal(-1)).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      handL(openHand).bone('hand.L'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const lash = pair(
      sdf
        .extrude(
          profile.polygon([
            [0, 0],
            [0.022, 0.016],
            [0.026, 0.01],
            [0.004, -0.008],
          ]),
          0.3,
        )
        .at(EYE[0] + 0.043, EYE[1] + 0.012, 0.1),
    );
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Raised, gently arched brows: delighted.
    const brows = pair(sdf.extrude(profile.arc(0.09, 0.018, 55, 125), 0.3).at(0.1, 0.728 - 0.09, 0.1));
    // A big open smile: a half-moon mouth with the upper teeth and a bit of tongue.
    const mouthShape = sdf.extrude(
      profile.polygon(
        [
          [-0.044, 0.0],
          [0.044, 0.0],
          [0.034, -0.02],
          [0.016, -0.032],
          [0, -0.035],
          [-0.016, -0.032],
          [-0.034, -0.02],
        ],
        { smooth: true, samples: 5 },
      ),
      0.3,
    );
    const MOUTH: V3 = [0, 0.548, 0.1];
    const mouth = mouthShape.at(...MOUTH);
    // Teeth and tongue sit inside a dark rim, so the smile reads as a mouth, not a white bar.
    const inner = mouth.round(-0.005);
    const teeth = inner.intersect(sdf.halfSpace([0, -1, 0], -(MOUTH[1] - 0.012)));
    const tongue = inner.intersect(sdf.sphere(0.024).at(0, MOUTH[1] - 0.038, 0.2).elongate(0.01, 0, 0.3));
    const blush = pair(at(sdf.sphere(0.034), 0.138, 0.562));
    const freckles = pair(
      sdf.union(
        ...(
          [
            [0.12, 0.58],
            [0.142, 0.586],
            [0.158, 0.572],
            [0.134, 0.566],
          ] as const
        ).map(([x, y]) => at(sdf.sphere(0.0055), x, y)),
      ),
    );
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armR, armL)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(freckles, C.freckle, 0.003)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lash, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue, C.tongue, 0.004)
      .paintWhere(teeth, C.teeth);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ the hat
    // Local frame: the crown's base center at the origin. A wide, soft brim that curls up at
    // the edge, a cone crown, and a point that bends over toward the left (+X) and back.
    const hatPose = (s: sdf.Shape) => s.rotateX(-7).rotateZ(-6).at(0, 0.735, -0.012);
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.0, 0.012],
            [0.22, 0.01],
            [0.3, 0.004],
            [0.334, 0.012],
            [0.345, 0.026],
            [0.336, 0.03],
            [0.305, 0.018],
            [0.23, 0.026],
            [0.0, 0.03],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      // A gentle wave along the edge so the brim reads as soft felt.
      .displace(0.006, (x, _y, z) => Math.sin(Math.atan2(z, x) * 5 + 0.6) * Math.min(1, Math.hypot(x, z) / 0.3));
    const crownCone = sdf.cone([0, 0.0, 0], [0, 0.17, -0.006], 0.212, 0.1);
    const point = sdf.chain(
      [
        [0.0, 0.16, -0.008, 0.1],
        [0.02, 0.23, -0.02, 0.072],
        [0.08, 0.285, -0.04, 0.05],
        [0.16, 0.3, -0.06, 0.034],
        [0.225, 0.265, -0.07, 0.022],
        [0.25, 0.215, -0.07, 0.012],
      ],
      0.03,
    );
    const hatInner = sdf.ellipsoid([0.212, 0.2, 0.2]).at(0, -0.06, 0.01);
    const hatLocal = sdf
      .smoothUnion(0.03, brim.bone('head'), crownCone.bone('head'), point.bone('hattip'))
      .subtract(hatInner)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012).intersect(sdf.cylinder(0.29, 0.2).at(0, -0.1, 0)), C.hatInside, 0.01);
    k.body('hat', hatPose(hatLocal), { color: C.red, roughness: 0.85 });
    // Band around the crown with a gold flame emblem and a red gem on the front left.
    const band = crownCone
      .round(0.008)
      .smoothIntersect(0.004, sdf.box([0.6, 0.036, 0.6], 0.008).at(0, 0.062, 0))
      .subtract(hatInner);
    const emblemAt: V3 = [0.088, 0.064, 0.188];
    const emblem = sdf
      .extrude(
        profile.polygon(
          [
            [0, -0.026],
            [0.024, -0.006],
            [0.022, 0.018],
            [0.006, 0.042],
            [0.004, 0.016],
            [-0.012, 0.03],
            [-0.022, 0.004],
          ],
          { smooth: true, samples: 4 },
        ),
        0.016,
        0.004,
      )
      .rotateY(25)
      .at(...emblemAt);
    const emblemGem = sdf.sphere(0.012).scale([1, 1.2, 0.7]).rotateY(25).at(emblemAt[0] + 0.004, emblemAt[1] - 0.002, emblemAt[2] + 0.008);
    k.body('hat-band', hatPose(band.union(emblem.paint(C.gold), emblemGem.paint(C.gem))), {
      color: C.leather,
      roughness: 0.6,
      bone: 'head',
    });

    // ------------------------------------------------------------------ hair
    // Wavy locks fall from under the hat to the shoulders; side-swept bangs over the brow.
    // Hair may fill the crown's cavity and hang anywhere below the brim, never through it.
    const underHat = hatPose(hatInner.round(-0.004).union(sdf.halfSpace([0, 1, 0], -0.002)));
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.012, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.006, -0.012)
      .smoothSubtract(0.015, sdf.ellipsoid([0.23, 0.15, 0.22]).rotateZ(-10).at(-0.015, 0.625, 0.15));
    const waves = (x: number, y: number, z: number) => Math.sin(y * 70 + Math.atan2(z, x) * 3);
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.02);
    const sideLocks = pair(
      sdf.union(
        lock([
          [0.17, 0.72, 0.06, 0.05],
          [0.2, 0.62, 0.05, 0.048],
          [0.2, 0.53, 0.04, 0.042],
          [0.215, 0.47, 0.02, 0.03],
          [0.24, 0.44, 0.0, 0.016],
        ]),
        lock([
          [0.12, 0.74, -0.14, 0.07],
          [0.17, 0.62, -0.12, 0.06],
          [0.18, 0.52, -0.1, 0.05],
          [0.2, 0.45, -0.08, 0.03],
        ]),
      ),
    );
    const backLocks = sdf.union(
      lock([
        [0, 0.72, -0.16, 0.09],
        [0, 0.6, -0.17, 0.08],
        [0.01, 0.5, -0.14, 0.06],
        [0.0, 0.45, -0.12, 0.03],
      ]),
    );
    const bangs = sdf.union(
      lock([
        [-0.04, 0.8, 0.17, 0.05],
        [0.03, 0.772, 0.19, 0.045],
        [0.09, 0.735, 0.19, 0.034],
        [0.12, 0.7, 0.178, 0.016],
      ]),
      lock([
        [-0.1, 0.79, 0.15, 0.045],
        [-0.13, 0.74, 0.16, 0.034],
        [-0.15, 0.7, 0.15, 0.014],
      ]),
    );
    const hair = sdf
      .smoothUnion(0.025, cap, sideLocks, backLocks, bangs)
      .displace(0.004, waves)
      .intersect(underHat);
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ robe, tunic, cape
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
            [0.155, 0.19],
            [0.18, 0.135],
            [0.196, 0.104],
            [0.186, 0.094],
            [0, 0.094],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    // The robe opens in front below the belt to show the dark tunic, edged in gold.
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.012, 0.26],
          [0.012, 0.26],
          [0.07, 0.08],
          [-0.07, 0.08],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const gold = rgb(C.gold);
    // Gold lapel edges run in a V from the shoulders down to the belt.
    const lapel = hard(
      sdf
        .extrude(
          profile.polygon([
            [0.088, 0.462],
            [0.104, 0.456],
            [0.022, 0.27],
            [0.008, 0.272],
          ]),
          0.4,
        )
        .at(0, 0, 0.2),
    );
    const robe = robeShape
      .smoothSubtract(0.006, opening)
      .paintWhere(lapel, C.gold)
      .paintWhere(opening.round(0.02), C.gold)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.122), C.gold)
      .paintFn((x, y, z, base) => (Math.abs(y - 0.134) < 0.003 && Math.sin(Math.atan2(z, x) * 60) > 0.2 ? gold : base));
    k.body('robe', robe.bone('spine'), { color: C.red, roughness: 0.8 });
    // Ember patterns lick up from the hem of the tunic.
    const tunic = robeShape
      .round(-0.012)
      .paintFn((x, y, z, base) => {
        const f = noise.fbm(x * 30, y * 12, z * 30, 2);
        return y < 0.2 - (0.08 * (f + 1)) / 2 && Math.abs(Math.sin(x * 60 + y * 20)) > 0.8 ? rgb(C.ember) : base;
      });
    k.body('tunic', tunic.bone('spine'), { color: C.tunic, roughness: 0.85 });

    // Hood lying on the shoulders at the back, with the cape falling from it.
    const hood = sdf
      .smoothUnion(
        0.03,
        sdf.torus(0.1, 0.035).scale([1.15, 1, 1]).rotateX(-20).at(0, 0.46, -0.05),
        sdf.ellipsoid([0.11, 0.07, 0.05]).rotateX(-25).at(0, 0.44, -0.14),
      )
      .subtract(sdf.cylinder(0.06, 0.2).at(0, 0.48, -0.01));
    const folds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.4 - y) / 0.26));
    const capeCone = (r0: number, r1: number, y0: number, y1: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, y0],
            [r0, y0],
            [r1, y1],
            [0, y1],
          ]),
        )
        .scale([1, 1, 0.85])
        .displace(0.012, folds);
    const cape = capeCone(0.18, 0.31, 0.44, 0.08)
      .subtract(capeCone(0.158, 0.288, 0.46, 0.06))
      .at(0, 0, -0.03)
      .intersect(sdf.halfSpace([0, 0, 1], -0.02))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.11), C.gold);
    k.body('cape', sdf.union(cape.bone('cloak'), hood.bone('chest')), { color: C.red, roughness: 0.8 });

    // ------------------------------------------------------------------ sleeves with dark cuffs
    const sleeve = (s: V3, e: V3, w: V3, tagU: string, tagF: string) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.048, 0.046).bone(tagU),
        sdf.cone(e, lerp(e, w, 0.78), 0.046, 0.054).bone(tagF),
      );
    const cuff = (e: V3, w: V3, tag: string) => sdf.cone(lerp(e, w, 0.7), lerp(e, w, 0.92), 0.056, 0.058).round(0.003).bone(tag);
    k.body('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R')), {
      color: C.red,
      roughness: 0.8,
    });

    // ------------------------------------------------------------------ belt, pouches, cuffs (leather)
    const beltY = 0.255;
    const belt = robeShape.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.042, 0.5], 0.006).at(0, beltY, 0));
    const pouch = (x: number) => {
      const p = sdf.surfacePoint(belt, [x, beltY - 0.02, 0.3], 0);
      return sdf
        .union(
          sdf.box([0.05, 0.056, 0.03], 0.01),
          sdf.box([0.056, 0.024, 0.036], 0.008).at(0, 0.02, 0.002).paint(C.leatherDark),
        )
        .rotateY((Math.atan2(p[0], p[2]) * 180) / Math.PI)
        .at(p[0], p[1] - 0.022, p[2] + 0.006);
    };
    k.body(
      'leather',
      sdf.union(belt.bone('spine'), pouch(0.09).bone('spine'), pouch(-0.09).bone('spine'), cuff(ELBOW_L, WRIST_L, 'forearm.L'), cuff(ELBOW_R, WRIST_R, 'forearm.R')),
      { color: C.leather, roughness: 0.6 },
    );

    // ------------------------------------------------------------------ gold: buckle, collar clasp, boot buckles
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf.cylinder(0.028, 0.012, 0.004).rotateX(90).at(0, beltY, beltZ + 0.003);
    const buckleGem = sdf.sphere(0.017).scale([1, 1, 0.6]).at(0, beltY, beltZ + 0.011);
    const chestZ = sdf.raycast(robeShape, [0, 0.43, 1], [0, 0, -1])![2];
    const clasp = sdf
      .extrude(
        profile.polygon([
          [0, -0.028],
          [0.022, 0.0],
          [0.012, 0.016],
          [0, 0.008],
          [-0.012, 0.016],
          [-0.022, 0.0],
        ]),
        0.014,
        0.004,
      )
      .at(0, 0.43, chestZ + 0.004);
    const bootBuckles = pair(
      sdf.box([0.03, 0.022, 0.01], 0.003).subtract(sdf.box([0.016, 0.01, 0.03])).rotateY(12).at(0.098 + 0.012, 0.075, 0.052).bone('foot.L'),
    );
    k.body(
      'gold',
      sdf.union(buckle.bone('spine'), buckleGem.paint(C.gem).bone('spine'), clasp.paint(C.gold).bone('chest'), bootBuckles),
      { color: C.gold, roughness: 0.32, metalness: 0.9 },
    );

    // ------------------------------------------------------------------ legs and boots
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.1, 0.004], 0.045).bone('leg.L')),
    );
    k.body('legs', legs, { color: C.legs, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.085, 0.02).at(0, 0.065, 0),
        sdf.ellipsoid([0.058, 0.052, 0.1]).at(0, 0.05, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf
      .union(bootFoot, sdf.cylinder(0.058, 0.026, 0.01).at(0, 0.1, 0).paint(C.leatherDark))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the staff and its fire orb
    // A gnarled pole along the staff axis through the fist, with a forked head cradling the orb.
    const L_DOWN = (GRIP[1] - 0.03) / STAFF_AXIS[1];
    const L_UP = (0.71 - GRIP[1]) / STAFF_AXIS[1];
    const along = (t: number): V3 => add(GRIP, scale(STAFF_AXIS, t));
    const wobble = (t: number, a: number): V3 => [Math.sin(t * 23) * a, 0, Math.cos(t * 17) * a];
    const polePts = [-L_DOWN, -L_DOWN * 0.6, -L_DOWN * 0.25, 0, L_UP * 0.35, L_UP * 0.7, L_UP].map((t, i) => {
      const p = add(along(t), wobble(t, i === 3 ? 0 : 0.006));
      return [p[0], p[1], p[2], 0.016 - i * 0.0006] as [number, number, number, number];
    });
    const top = along(L_UP);
    const ORB: V3 = add(top, [-0.012, 0.075, 0.004]);
    const prong = (side: 1 | -1) =>
      sdf.chain(
        [
          [top[0], top[1], top[2], 0.014],
          [top[0] + side * 0.04, top[1] + 0.035, top[2], 0.012],
          [ORB[0] + side * 0.058, ORB[1] + 0.005, ORB[2], 0.01],
          [ORB[0] + side * 0.036, ORB[1] + 0.05, ORB[2], 0.007],
        ],
        0.008,
      );
    const knots = sdf.union(sdf.sphere(0.02).at(...along(L_UP * 0.45)), sdf.sphere(0.018).at(...along(-L_DOWN * 0.5)));
    const staff = sdf
      .smoothUnion(0.012, sdf.chain(polePts, 0.02), prong(1), prong(-1), knots)
      .paintFn((x, y, z, base) => (noise.fbm(x * 90, y * 12, z * 90, 2) > 0.25 ? rgb(C.woodDark) : base));
    k.body('staff', staff, {
      color: C.wood,
      roughness: 0.8,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 160, y * 25, z * 160, 2),
    });

    // Fire: the orb in the staff head and the small flame over the open palm.
    const orbFlame = flame(0.19).at(ORB[0], ORB[1] - 0.06, ORB[2]);
    const palmFlame = flame(0.1).at(...PALM_FLAME);
    k.body('fire', orbFlame.paintFn(firePaint([ORB[0], ORB[1] - 0.06, ORB[2]], 0.19)), {
      color: C.fire,
      roughness: 0.4,
      emissive: '#ff5a14',
      emissiveIntensity: 0.45,
      detail: 0.004,
      bone: 'hand.R',
    });
    k.body('palm-fire', palmFlame.paintFn(firePaint(PALM_FLAME, 0.1)), {
      color: C.fire,
      roughness: 0.4,
      emissive: '#ff5a14',
      emissiveIntensity: 0.45,
      detail: 0.0035,
      bone: 'hand.L',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        hattip: { rotate: [4 * wave(p, 1, 0.4), 0, 6 * wave(p, 1, 0.35)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        // The palm lifts the flame a little, as if weighing it.
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, 0] },
      }),
    });

    // Both arms are busy, so they swing little; the hat point and the cape carry the motion.
    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number, flow: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: {
            move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0] as const,
            rotate: [0, 7 * s, 0] as const,
          },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          hattip: { rotate: [flow * 0.4 + 6 * wave(p, 2, 0.2), 0, 8 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.3 * s, 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 28, 3, 0, 6));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03, 22));
  },
});
