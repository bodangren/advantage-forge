import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Druid — Chibi Quest hero (catalog `heroes/magic/druid`), a mushroom forager, about 1.0 m to the
 * top of her cap, faces +Z. Target: docs/hero-mockups/druid_001.png (cropped from
 * docs/character-mockups/chibi-quest-heroes.png). Built on the rogue's head and skeleton.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the cap, the face, and the props read.
 * One idea: a girl under a huge spotted mushroom cap, a basket of mushrooms on her back, a glowing
 *   potion held up in one hand and a lantern swinging from a mossy staff in the other.
 * Proportions: cap top 1.0 (radius 0.34, rim at 0.73), eyes 0.63, chin 0.48, shoulders 0.385,
 *   belt 0.26, dress hem 0.12, boots 0.1. Staff top 0.78 on the left (+X), basket to 0.62 behind.
 * Shape language: round and soft everywhere (cap, cheeks, basket, flask, boots), with small
 *   leaf points and a gnarled staff as the only irregular forms.
 * Palette (60/30/10): moss green #5d8a3a dress and cream #efe6cf apron; red #d23a32 cap with cream
 *   spots; brown leather and wicker; accents: glowing green potion and warm lantern light.
 * Value plan: the cream gills and the auburn hair frame the light face (focal point); the red cap
 *   is the biggest mass; the potion and the lantern are the two glowing accents.
 * Bodies: skin, hair, cap, gills, dress, sleeves, apron, hip-potion, leather, gold, basket,
 *   mushrooms, leaves, cap-growth, cap-leaves, legs, boots, staff, staff-mushroom, lantern-frame,
 *   lantern-light, flask, potion.
 * Rig: the rogue's chibi skeleton plus `lantern` (hangs from the staff), `caproot` (the cap, on the
 *   head) and `flaskroot` (the flask, on the right hand); the basket is rigid on the chest, the staff
 *   on the left hand. Clips: idle, walk, run, attack (a staff thrust; the lantern flares), attack2
 *   (a flask throw; the flask flies off and grows back in the hand), hit, death (she topples onto
 *   her left side; the cap props her head, the staff lies in front of her), victory (the staff up
 *   and out past the cap, a hop, the lantern swings).
 */

const C = {
  skin: '#f3c8a6',
  blush: '#f09a86',
  freckle: '#cf8a66',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#b07a34',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#8a3a1c',
  mouth: '#a4503f',
  hair: '#b8502a',
  hairDark: '#8c3a1c',
  cap: '#d23a32',
  spot: '#f4ead6',
  gills: '#eadcc0',
  gillsDark: '#cdb892',
  dress: '#5d8a3a',
  dressDark: '#4a7030',
  cream: '#efe6cf',
  leafPrint: '#6f9a44',
  mushPrint: '#c85a3a',
  leather: '#7a4a2c',
  leatherDark: '#503020',
  gold: '#d9a93a',
  basket: '#8a5a30',
  basketDark: '#6a4222',
  stem: '#efe2c8',
  leaf: '#4f8a34',
  legs: '#6a4a36',
  boot: '#704224',
  sole: '#42281a',
  wood: '#6a4424',
  woodDark: '#4a2e18',
  moss: '#6a9a3a',
  potion: '#7ad04a',
  hipPotion: '#4a8ed0',
  glass: '#dff5e6',
  cork: '#a0764a',
  lanternGlow: '#ffcc55',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. The right forearm points forward and up, the hand open under the flask; the left hand
// grips the staff with the forearm forward.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.185, 0.335, 0.02];
const WRIST_R: V3 = [-0.2, 0.35, 0.115];
const ELBOW_L: V3 = [0.205, 0.36, -0.004];
const WRIST_L: V3 = [0.275, 0.35, 0.085];
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
// The staff hand swings forward and tips out (+X), so the staff leans away from the body.
const HAND_L = { pitch: -80, roll: -21 };
const handL = (s: sdf.Shape) => s.rotateX(HAND_L.pitch).rotateZ(HAND_L.roll).at(...WRIST_L);
const STAFF_AXIS = rotZ(rotX([0, 0, 1], HAND_L.pitch), HAND_L.roll);
const GRIP = add(rotZ(rotX([0.007, -0.04, 0.004], HAND_L.pitch), HAND_L.roll), WRIST_L);

/** An open hand, palm up, pointing along +X from the wrist at the origin; fingers curl up a little. */
const openHand = sdf.smoothUnion(
  0.012,
  sdf.ellipsoid([0.044, 0.02, 0.04]).at(0.038, 0, 0.004),
  ...[-0.024, -0.008, 0.008, 0.024].map((z, i) =>
    sdf.capsule([0.066, 0.002, z], [0.09 - Math.abs(i - 1.5) * 0.006, 0.02, z * 1.1], 0.0105),
  ),
  sdf.capsule([0.03, 0.006, -0.036], [0.056, 0.024, -0.05], 0.012),
);
// The right hand points forward (+Z) and slightly in, palm up under the flask.
const HAND_R_YAW = -100;
const handR = (s: sdf.Shape) => s.rotateY(HAND_R_YAW).at(...WRIST_R);
const FLASK: V3 = add(WRIST_R, rotY([0.042, 0.02, 0.0], HAND_R_YAW)); // bottom of the flask, on the palm
/** The cap's pivot: the center of its underside (and the `caproot` bone). */
const CAP_AT: V3 = [0, 0.755, -0.01];
/** The cap is wider and taller than the skull cavity under it. */
const CAP_SCALE: V3 = [1.24, 1.16, 1.24];

export default defineAsset({
  name: 'druid',
  description: 'Chibi druid hero under a spotted mushroom cap, with a mushroom basket, a potion, and a lantern staff.',
  detail: 0.005,
  reference: 'docs/hero-mockups/druid_001.png',

  build(k) {
    // ------------------------------------------------------------------ the staff line (needed for the skeleton)
    const L_DOWN = (GRIP[1] - 0.03) / STAFF_AXIS[1];
    const L_UP = (0.8 - GRIP[1]) / STAFF_AXIS[1];
    const along = (t: number): V3 => add(GRIP, scale(STAFF_AXIS, t));
    const HOOK: V3 = add(along(L_UP * 0.72), [0.07, 0.02, 0.0]);

    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      caproot: { parent: 'head', at: CAP_AT },
      flaskroot: { parent: 'hand.R', at: FLASK },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      lantern: { parent: 'hand.L', at: HOOK, tail: [HOOK[0], HOOK[1] - 0.12, HOOK[2]] },
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
    const nose = sdf.ellipsoid([0.018, 0.014, 0.014]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
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
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.038, 0.034).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.034, 0.03).bone('forearm.R'),
      handR(openHand).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.038, 0.034).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.034, 0.03).bone('forearm.L'),
      handL(fistLocal(1)).bone('hand.L'),
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
    const brows = pair(sdf.extrude(profile.arc(0.09, 0.016, 58, 122), 0.3).at(0.1, 0.724 - 0.09, 0.1));
    const smile = sdf.extrude(profile.arc(0.07, 0.011, 238, 302), 0.3).at(0, 0.53 + 0.07, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.138, 0.562));
    const freckles = pair(
      sdf.union(
        ...(
          [
            [0.075, 0.585],
            [0.095, 0.58],
            [0.085, 0.566],
            [0.12, 0.574],
            [0.142, 0.582],
            [0.132, 0.562],
          ] as const
        ).map(([x, y]) => at(sdf.sphere(0.005), x, y)),
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
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ the mushroom cap
    // Local frame: the underside's center at the origin. A soft dome with a thick rolled rim, cream
    // gills underneath in radial ridges, and cream spots on top.
    // Tipped well back so the wide cream underside shows and the rim clears the eyes in side view,
    // and a little down toward her left, like the mockup.
    const capPose = (s: sdf.Shape) => s.rotateX(-19).rotateZ(-3).at(...CAP_AT);
    const dome = sdf
      .revolve(
        profile.polygon(
          [
            [0.0, 0.25],
            [0.12, 0.235],
            [0.23, 0.18],
            [0.31, 0.1],
            [0.345, 0.03],
            [0.338, -0.004],
            [0.31, -0.012],
            [0.26, 0.004],
            [0.0, 0.03],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .displace(0.004, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2))
      .scale(CAP_SCALE);
    const capInner = sdf.ellipsoid([0.21, 0.2, 0.2]).at(0, -0.07, 0.01);
    // Spots: flat patches where small spheres cross the dome.
    const spots = sdf.union(
      ...(
        [
          [0.0, 0.25, 0.02, 0.05],
          [0.15, 0.21, 0.1, 0.045],
          [-0.17, 0.2, 0.07, 0.04],
          [0.24, 0.13, -0.09, 0.038],
          [-0.12, 0.2, -0.15, 0.042],
          [0.08, 0.2, -0.19, 0.036],
          [-0.27, 0.1, -0.06, 0.034],
          [0.28, 0.1, 0.1, 0.034],
          [-0.05, 0.17, 0.25, 0.04],
          [0.2, 0.12, 0.22, 0.032],
          [-0.23, 0.12, 0.19, 0.03],
        ] as const
      ).map(([x, y, z, r]) => sdf.sphere(r).at(x, y, z)),
    ).scale(CAP_SCALE);
    const capTop = dome
      .subtract(capInner)
      .intersect(sdf.halfSpace([0, -1, 0], -0.012))
      .paintWhere(spots, C.spot, 0.004);
    k.body('cap', capPose(capTop), { color: C.cap, roughness: 0.6, bone: 'caproot' });
    // The gills: the underside between the rim and the stem, in radial folds.
    const gillShell = dome.round(0.002).intersect(sdf.halfSpace([0, 1, 0], 0.016)).subtract(capInner.round(0.004));
    const gills = gillShell.paintFn((x, _y, z, base) => (Math.sin(Math.atan2(z, x) * 36) > 0.8 ? rgb(C.gillsDark) : base));
    // The radial folds live in the normal map (fine, regular detail), not in the mesh.
    const gillFolds = (x: number, y: number, z: number) => {
      const p = [x, y - CAP_AT[1], z - CAP_AT[2]] as const;
      return 0.0035 * Math.abs(Math.sin(Math.atan2(p[2], p[0]) * 36));
    };
    k.body('gills', capPose(gills), { color: C.gills, roughness: 0.8, bone: 'caproot', bump: gillFolds });

    // ------------------------------------------------------------------ hair: an auburn bob with bangs
    const underCap = capPose(capInner.round(-0.004).union(sdf.halfSpace([0, 1, 0], -0.004)));
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.016, HEAD[1] + 0.012, HEAD[2] + 0.016])
      .at(0, HEAD_Y + 0.004, -0.014)
      .smoothSubtract(0.015, sdf.ellipsoid([0.235, 0.15, 0.22]).at(0, 0.615, 0.15));
    // Short, messy hair: a rounded shell cut above the jaw, with pointed locks flicking out
    // around the lower edge and fuller at the back.
    const bob = sdf
      .smoothUnion(
        0.04,
        sdf.ellipsoid([0.235, 0.2, 0.225]).at(0, 0.645, -0.03),
        pair(sdf.ellipsoid([0.06, 0.09, 0.07]).at(0.19, 0.57, 0.02)),
      )
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.51))
      .smoothSubtract(0.02, sdf.ellipsoid([0.2, 0.2, 0.24]).at(0, 0.58, 0.19));
    const flick = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.012);
    const flicks = pair(
      sdf.union(
        // At the cheek, flaring out.
        flick([
          [0.185, 0.6, 0.05, 0.036],
          [0.215, 0.53, 0.06, 0.024],
          [0.262, 0.492, 0.068, 0.005],
        ]),
        flick([
          [0.2, 0.6, -0.03, 0.04],
          [0.235, 0.525, -0.03, 0.026],
          [0.28, 0.5, -0.02, 0.005],
        ]),
        // Around the back, curling out and up a little.
        flick([
          [0.15, 0.58, -0.13, 0.042],
          [0.19, 0.5, -0.14, 0.028],
          [0.235, 0.468, -0.13, 0.005],
        ]),
        flick([
          [0.06, 0.58, -0.19, 0.042],
          [0.08, 0.5, -0.21, 0.028],
          [0.1, 0.46, -0.225, 0.005],
        ]),
      ),
    );
    // Bangs: uneven pointed locks swept out from a part, the longest between the eyes.
    const bangs = sdf.union(
      ...(
        [
          [0.0, -0.03, -0.045, 0.672],
          [0.045, 0.06, 0.08, 0.7],
          [-0.075, -0.1, -0.125, 0.7],
          [0.11, 0.14, 0.168, 0.688],
          [-0.14, -0.165, -0.19, 0.672],
          [0.02, 0.028, 0.032, 0.716],
        ] as const
      ).map(([x0, x1, x2, y2]) => {
        const z0 = faceZ(Math.abs(x0), 0.78) - 0.03;
        const z1 = faceZ(Math.abs(x1), 0.745) + 0.012;
        const z2 = faceZ(Math.abs(x2), y2) + 0.008;
        return sdf.chain(
          [
            [x0, 0.8, z0, 0.042],
            [x1, 0.745, z1, 0.026],
            [x2, y2, z2, 0.005],
          ],
          0.012,
        );
      }),
    );
    const strands = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 24 + y * 12);
    const hair = sdf
      .smoothUnion(0.02, cap, bob, flicks, bangs)
      .intersect(underCap)
      .paintFn((x, y, z, base) => (strands(x, y, z) > 0.8 ? rgb(C.hairDark) : base));
    k.body('hair', hair, {
      color: C.hair,
      roughness: 0.6,
      detail: 0.004,
      bone: 'head',
      bump: (x, y, z) => 0.0025 * strands(x, y, z),
    });

    // ------------------------------------------------------------------ dress, collar, sleeves, apron
    const dressShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.128, 0.34],
            [0.12, 0.29],
            [0.13, 0.26],
            [0.16, 0.2],
            [0.19, 0.14],
            [0.196, 0.118],
            [0.182, 0.11],
            [0, 0.11],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8])
      // Soft folds in the skirt.
      .displace(0.006, (x, y, z) => Math.sin(Math.atan2(z, x) * 9) * Math.min(1, Math.max(0, (0.25 - y) / 0.1)));
    const dress = dressShape.paintWhere(sdf.halfSpace([0, 1, 0], 0.126), C.dressDark);
    k.body('dress', dress.bone('spine'), { color: C.dress, roughness: 0.85 });
    // Cream collar with two rounded points in front.
    const collar = sdf
      .revolve(
        profile.polygon(
          [
            [0.06, 0.49],
            [0.1, 0.475],
            [0.13, 0.448],
            [0.138, 0.428],
            [0.118, 0.425],
            [0.09, 0.45],
            [0.055, 0.47],
          ],
          { smooth: true, samples: 5 },
        ),
      )
      .scale([1, 1, 0.84])
      .smoothUnion(0.01, hard(sdf.ellipsoid([0.045, 0.03, 0.012]).rotateZ(-25).at(0.035, 0.435, 0.112)));
    // Short puffed sleeves in cream.
    const puff = (s: V3, e: V3, tag: string) => sdf.ellipsoid([0.058, 0.05, 0.056]).at(...lerp(s, e, 0.45)).bone(tag);
    k.body('sleeves', sdf.union(collar.bone('chest'), puff(SHOULDER, ELBOW_L, 'upperarm.L'), puff(mx(SHOULDER), ELBOW_R, 'upperarm.R')), {
      color: C.cream,
      roughness: 0.85,
    });
    // The apron: a cream panel down the front of the skirt, printed with a leaf sprig and a small
    // mushroom. A thin shell of a smooth cone, so it drapes over the skirt.
    const drape = sdf.cone([0, 0.3, -0.03], [0, 0.112, -0.03], 0.155, 0.2);
    const apronPanel = sdf.extrude(profile.rect([0.16, 0.2], 0.03), 0.4).at(0, 0.2, 0.2);
    // A clover emblem: three heart-shaped leaflets on a curved stem.
    const CLOVER = [0, 0.212] as const;
    const disc = (r: number, x: number, y: number) => sdf.extrude(profile.circle(r), 0.4).at(x, y, 0.2);
    const sprig = sdf.union(
      sdf.extrude(profile.arc(0.06, 0.006, 180, 222), 0.4).at(CLOVER[0] + 0.06, CLOVER[1], 0.2),
      ...[90, 210, 330].map((a) => {
        const r = (a * Math.PI) / 180;
        const [cx, cy, px, py] = [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r)];
        const at = (d: number, side: number): [number, number] => [CLOVER[0] + cx * d + px * side, CLOVER[1] + cy * d + py * side];
        return sdf.union(disc(0.011, ...at(0.02, 0.008)), disc(0.011, ...at(0.02, -0.008)), disc(0.008, ...at(0.009, 0)));
      }),
    );
    const printMush = sdf.union(
      sdf.extrude(profile.arc(0.016, 0.014, 0, 180), 0.4).at(0.05, 0.14, 0.2),
      sdf.extrude(profile.rect([0.008, 0.014], 0.002), 0.4).at(0.05, 0.133, 0.2),
    );
    const apron = drape
      .round(0.007)
      .subtract(drape.round(-0.007))
      .smoothIntersect(0.004, apronPanel)
      .paintWhere(sprig, C.leafPrint, 0.001)
      .paintWhere(printMush, C.mushPrint, 0.001);
    k.body('apron', apron.bone('spine'), { color: C.cream, roughness: 0.85 });

    // ------------------------------------------------------------------ leather: belt, harness straps, pouches, boots trim
    const beltY = 0.262;
    const belt = dressShape.round(0.008).smoothIntersect(0.006, sdf.box([0.5, 0.036, 0.5], 0.006).at(0, beltY, 0));
    // Two basket straps come over the shoulders and meet at a brass ring on the chest.
    const RING: V3 = [0, 0.38, 0.118];
    const strap = (s: 1 | -1) =>
      dressShape
        .round(0.009)
        .smoothIntersect(
          0.005,
          sdf
            .box([0.03, 0.3, 0.6], 0.006)
            .rotateZ(s * 28)
            .at(s * 0.06, 0.43, 0),
        )
        .intersect(sdf.halfSpace([0, -1, 0], -RING[1]));
    // Pouches hang from the belt at both hips: two on her right, one on her left.
    const yawAt = (p: V3) => (Math.atan2(p[0], p[2]) * 180) / Math.PI;
    const pouch = (x: number, w = 0.046, h = 0.05) => {
      const p = sdf.surfacePoint(belt, [x, beltY - 0.02, 0.3], 0);
      return sdf
        .union(sdf.box([w, h, 0.03], 0.01), sdf.box([w + 0.006, 0.022, 0.036], 0.008).at(0, h / 2 - 0.007, 0.002).paint(C.leatherDark))
        .rotateY(yawAt(p))
        .at(p[0], p[1] - h / 2 + 0.001, p[2] + 0.006);
    };
    // A small blue potion hangs from the belt on her right hip, beside the pouches.
    const VIAL = sdf.surfacePoint(dressShape, [-0.155, 0.212, 0.3], 0.024);
    const vial = sdf
      .union(
        sdf.sphere(0.021),
        sdf.cylinder(0.008, 0.03, 0.002).at(0, 0.026, 0),
        sdf.cylinder(0.01, 0.014, 0.003).at(0, 0.044, 0).paint(C.cork),
      )
      .rotateZ(-8)
      .rotateY(yawAt(VIAL))
      .at(...VIAL);
    k.body('hip-potion', vial.bone('spine'), { color: C.hipPotion, roughness: 0.15, emissive: C.hipPotion, emissiveIntensity: 0.25 });
    const pouches = sdf.union(pouch(-0.1, 0.05, 0.056), pouch(-0.205, 0.04, 0.046), pouch(0.14, 0.05, 0.056));
    k.body('leather', sdf.union(belt, strap(1), strap(-1), pouches).bone('spine'), {
      color: C.leather,
      roughness: 0.6,
    });

    // ------------------------------------------------------------------ gold: buckle, ring, bracelet, boot buckles
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.05, 0.04, 0.012], 0.005).subtract(sdf.box([0.03, 0.022, 0.03], 0.003)), sdf.box([0.008, 0.026, 0.01], 0.003).at(0.004, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    const ring = sdf.torus(0.018, 0.006).rotateX(90).at(...RING);
    const bracelet = sdf.cone(lerp(ELBOW_L, WRIST_L, 0.78), lerp(ELBOW_L, WRIST_L, 0.94), 0.034, 0.034).round(0.004);
    const bootBuckles = pair(
      sdf.box([0.03, 0.022, 0.01], 0.003).subtract(sdf.box([0.016, 0.01, 0.03])).rotateY(12).at(0.098 + 0.012, 0.075, 0.052).bone('foot.L'),
    );
    k.body('gold', sdf.union(buckle.bone('spine'), ring.bone('chest'), bracelet.bone('forearm.L'), bootBuckles), {
      color: C.gold,
      roughness: 0.32,
      metalness: 0.9,
    });

    // ------------------------------------------------------------------ the basket on her back, full of mushrooms and leaves
    // Local frame: the bottom center of the basket at the origin, the mouth up.
    const basketPose = (s: sdf.Shape) => s.rotateX(-10).rotateZ(30).at(-0.1, 0.27, -0.19);
    const basketBody = sdf
      .cone([0, 0, 0], [0, 0.2, 0], 0.11, 0.145)
      .round(0.008)
      .subtract(sdf.cylinder(0.13, 0.2).at(0, 0.26, 0));
    const weave = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x) * 14;
      const b = y * 90;
      return 0.0025 * Math.sign(Math.sin(a) * Math.sin(b)) * Math.min(Math.abs(Math.sin(a)), Math.abs(Math.sin(b)));
    };
    const bands = sdf.union(
      sdf.torus(0.145, 0.014).at(0, 0.196, 0),
      sdf.torus(0.12, 0.01).at(0, 0.03, 0),
    );
    k.body('basket', basketPose(sdf.union(basketBody, bands.paint(C.basketDark))).bone('chest'), {
      color: C.basket,
      roughness: 0.8,
      bump: weave,
    });
    // Mushrooms and leaves heaped in the mouth of the basket.
    const shroom = (x: number, z: number, h: number, r: number, tilt: number) =>
      sdf
        .union(
          sdf.cone([0, 0, 0], [0, h, 0], r * 0.32, r * 0.28).paint(C.stem),
          sdf
            .revolve(
              profile.polygon(
                [
                  [0, h + r * 0.75],
                  [r * 0.6, h + r * 0.62],
                  [r, h + r * 0.1],
                  [r * 0.9, h - r * 0.05],
                  [0, h + r * 0.15],
                ],
                { smooth: true, samples: 4 },
              ),
            )
            .paintWhere(sdf.union(sdf.sphere(r * 0.22).at(r * 0.4, h + r * 0.62, 0), sdf.sphere(r * 0.18).at(-r * 0.3, h + r * 0.6, r * 0.3)), C.spot),
        )
        .rotateZ(tilt)
        .at(x, 0.17, z);
    const pile = sdf.union(
      shroom(0.0, 0.0, 0.15, 0.085, 6),
      shroom(-0.08, 0.03, 0.11, 0.065, 24),
      shroom(0.08, -0.02, 0.12, 0.06, -20),
      shroom(0.04, 0.08, 0.08, 0.05, -12),
      shroom(-0.04, -0.08, 0.09, 0.05, 14),
    );
    k.body('mushrooms', basketPose(pile).bone('chest'), { color: C.cap, roughness: 0.6, detail: 0.004 });
    const leafShape = (len: number) =>
      sdf.extrude(profile.polygon([[0, 0], [len * 0.35, len * 0.35], [0, len], [-len * 0.35, len * 0.35]], { smooth: true, samples: 4 }), 0.008, 0.003);
    const leaves = sdf.union(
      leafShape(0.13).rotateZ(45).rotateY(20).at(-0.1, 0.18, 0.05),
      leafShape(0.12).rotateZ(-40).rotateY(-30).at(0.1, 0.18, 0.06),
      leafShape(0.11).rotateZ(15).rotateY(80).at(-0.03, 0.18, -0.09),
      leafShape(0.12).rotateZ(-65).rotateY(60).at(0.11, 0.17, -0.06),
      leafShape(0.1).rotateZ(70).rotateY(-60).at(-0.12, 0.17, -0.04),
    );
    k.body('leaves', basketPose(leaves).bone('chest'), { color: C.leaf, roughness: 0.7, detail: 0.0035 });

    // Two small mushrooms and a sprig of leaves grow from the cap on her right, as in the mockup.
    const onCap = (x: number, z: number) => sdf.surfacePoint(dome, [x, 0.4, z], 0);
    const capShroom = (x: number, z: number, h: number, r: number, tilt: number, yaw: number) => {
      const p = onCap(x, z);
      return shroom(0, 0, h, r, tilt).rotateY(yaw).at(p[0], p[1] - 0.17 - 0.01, p[2]);
    };
    const capGrowth = sdf.union(capShroom(-0.4, 0.02, 0.1, 0.075, 38, 0), capShroom(-0.34, -0.14, 0.075, 0.056, 26, 40));
    const capLeaves = sdf.union(
      ...(
        [
          [-0.36, 0.12, 55, 20, 0.11],
          [-0.28, 0.06, 20, -30, 0.1],
          [-0.4, -0.08, 75, 60, 0.1],
        ] as const
      ).map(([x, z, rz, ry, len]) => {
        const p = onCap(x, z);
        return leafShape(len).rotateZ(rz).rotateY(ry).at(p[0], p[1] - 0.006, p[2]);
      }),
    );
    k.body('cap-growth', capPose(capGrowth), { color: C.cap, roughness: 0.6, detail: 0.004, bone: 'caproot' });
    k.body('cap-leaves', capPose(capLeaves), { color: C.leaf, roughness: 0.7, detail: 0.0035, bone: 'caproot' });

    // ------------------------------------------------------------------ legs and boots
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.1, 0.004], 0.044).bone('leg.L')),
    );
    k.body('legs', legs, { color: C.legs, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.05, 0.085, 0.02).at(0, 0.065, 0), sdf.ellipsoid([0.058, 0.052, 0.1]).at(0, 0.05, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const cuff = sdf.cone([0, 0.08, 0], [0, 0.112, 0], 0.056, 0.064).round(0.005);
    const boot = sdf
      .union(bootFoot, cuff.paint(C.leatherDark))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the mossy staff with a mushroom and a lantern
    const wobble = (t: number, a: number): V3 => [Math.sin(t * 23) * a, 0, Math.cos(t * 17) * a];
    const polePts = [-L_DOWN, -L_DOWN * 0.55, -L_DOWN * 0.2, 0, L_UP * 0.35, L_UP * 0.7, L_UP].map((t, i) => {
      const p = add(along(t), wobble(t, i === 3 ? 0 : 0.006));
      return [p[0], p[1], p[2], 0.016 - i * 0.0007] as [number, number, number, number];
    });
    const top = along(L_UP);
    // A side branch carries the lantern hook; the crook at the top curls back.
    const branch = sdf.chain(
      [
        [...along(L_UP * 0.62), 0.011] as [number, number, number, number],
        [HOOK[0] - 0.03, HOOK[1] + 0.012, HOOK[2], 0.009],
        [HOOK[0], HOOK[1] + 0.004, HOOK[2], 0.007],
      ],
      0.01,
    );
    const crook = sdf.chain(
      [
        [top[0], top[1], top[2], 0.013],
        [top[0] + 0.03, top[1] + 0.04, top[2], 0.011],
        [top[0] + 0.07, top[1] + 0.035, top[2], 0.009],
      ],
      0.01,
    );
    const mossAt = (t: number) => sdf.sphere(0.02).scale([1.3, 0.8, 1.3]).at(...along(t));
    const staff = sdf
      .smoothUnion(0.012, sdf.chain(polePts, 0.02), branch, crook)
      .union(mossAt(L_UP * 0.5).paint(C.moss), mossAt(-L_DOWN * 0.4).paint(C.moss))
      // Dark grain on the wood only; the moss (a greener base) keeps its color.
      .paintFn((x, y, z, base) => (noise.fbm(x * 90, y * 12, z * 90, 2) > 0.3 && base[1] < 0.2 ? rgb(C.woodDark) : base));
    k.body('staff', staff, {
      color: C.wood,
      roughness: 0.8,
      bone: 'hand.L',
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 160, y * 25, z * 160, 2),
    });
    // A little mushroom sprouting from the crook, which curls outward, away from the cap.
    const crookTip: V3 = [top[0] + 0.07, top[1] + 0.035, top[2]];
    const topShroom = sdf
      .union(
        sdf.cone([0, 0, 0], [0, 0.05, 0], 0.012, 0.01).paint(C.stem),
        sdf
          .revolve(profile.polygon([[0, 0.078], [0.03, 0.07], [0.048, 0.048], [0.044, 0.04], [0, 0.052]], { smooth: true, samples: 4 }))
          .paintWhere(sdf.sphere(0.012).at(0.018, 0.074, 0.01), C.spot),
      )
      .rotateZ(-15)
      .at(...crookTip);
    k.body('staff-mushroom', topShroom, { color: C.cap, roughness: 0.6, detail: 0.004, bone: 'hand.L' });

    // The lantern hangs from the hook on a short bail and swings on its own bone.
    const LANTERN: V3 = [HOOK[0], HOOK[1] - 0.09, HOOK[2]];
    const lanternFrame = sdf
      .union(
        sdf.cylinder(0.034, 0.014, 0.004).at(0, 0.03, 0), // cap
        sdf.cone([0, 0.036, 0], [0, 0.052, 0], 0.026, 0.01), // roof
        sdf.cylinder(0.036, 0.014, 0.004).at(0, -0.036, 0), // base
        ...[0, 90, 180, 270].map((a) => sdf.capsule([0.03, -0.03, 0], [0.03, 0.026, 0], 0.004).rotateY(a + 45)), // bars
        sdf.torus(0.022, 0.004).rotateX(90).at(0, 0.074, 0), // bail
      )
      .at(...LANTERN);
    k.body('lantern-frame', lanternFrame.bone('lantern'), { color: C.leatherDark, roughness: 0.4, metalness: 0.6 });
    const glow = sdf.cylinder(0.027, 0.06, 0.012).at(...LANTERN);
    k.body('lantern-light', glow.bone('lantern'), {
      color: C.lanternGlow,
      roughness: 0.3,
      emissive: C.lanternGlow,
      emissiveIntensity: 0.8,
    });

    // ------------------------------------------------------------------ the potion flask in the right hand
    // A round flask with a neck, a cork, and a sprout; the glass is see-through, the potion glows.
    const flaskGlass = sdf.smoothUnion(
      0.01,
      sdf.sphere(0.05).at(FLASK[0], FLASK[1] + 0.048, FLASK[2]),
      sdf.cylinder(0.017, 0.05, 0.004).at(FLASK[0], FLASK[1] + 0.108, FLASK[2]),
    );
    k.body('flask', flaskGlass.subtract(flaskGlass.round(-0.004)).bone('flaskroot'), {
      color: C.glass,
      roughness: 0.1,
      opacity: 0.4,
    });
    const liquid = sdf.sphere(0.044).at(FLASK[0], FLASK[1] + 0.05, FLASK[2]).intersect(sdf.halfSpace([0, 1, 0], FLASK[1] + 0.07));
    const cork = sdf.cylinder(0.015, 0.022, 0.004).at(FLASK[0], FLASK[1] + 0.14, FLASK[2]).paint(C.cork);
    const sprout = sdf.union(
      sdf.capsule([FLASK[0], FLASK[1] + 0.15, FLASK[2]], [FLASK[0] + 0.004, FLASK[1] + 0.18, FLASK[2]], 0.004),
      leafShape(0.04).rotateZ(50).at(FLASK[0], FLASK[1] + 0.178, FLASK[2]),
      leafShape(0.036).rotateZ(-45).at(FLASK[0], FLASK[1] + 0.172, FLASK[2]),
    );
    k.body('potion', sdf.union(liquid, cork, sprout.paint(C.leaf)).bone('flaskroot'), {
      color: C.potion,
      roughness: 0.3,
      emissive: C.potion,
      emissiveIntensity: 0.35,
      detail: 0.0035,
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
        lantern: { rotate: [4 * wave(p, 1, 0.4), 0, 5 * wave(p, 1, 0.2)] },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number) => ({
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
          // The lantern lags and swings twice per cycle.
          lantern: { rotate: [lean * 2 + 12 * wave(p, 2, 0.2), 0, 8 * wave(p, 1, 0.3)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          // Both hands carry something, so the arms barely swing; the lantern does the moving.
          'upperarm.L': { rotate: [armSwing * 0.1 * s, 0, 2] as const },
          'upperarm.R': { rotate: [-armSwing * 0.12 * s, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 28, 3, 0));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03));

    // ------------------------------------------------------------------ attacks
    // Both arms are posed by targets in the chest's rest frame (reach for the arm, orient for the
    // hand). The rest pole of each arm keeps the elbow where the model has it at phase 0 and 1.
    const { keys, reach, orient, follow, quat, euler } = motion;
    const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const norm = (v: V3): V3 => scale(v, 1 / Math.hypot(v[0], v[1], v[2]));
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    type Arm = { root: V3; mid: V3; end: V3 };
    const restPole = (a: Arm): V3 => {
      const u = norm(sub(a.end, a.root));
      const se = sub(a.mid, a.root);
      const d = se[0] * u[0] + se[1] * u[1] + se[2] * u[2];
      return add(a.root, scale(norm(sub(se, scale(u, d))), 0.5));
    };
    const chainQ = (rots: readonly V3[]) => rots.reduce((q, r) => q.multiply(quat(r)), new THREE.Quaternion());
    const ARM_L: Arm = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R: Arm = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const POLE_L = restPole(ARM_L);
    const POLE_R = restPole(ARM_R);
    const FIST_L = rotZ(rotX([0, -1, 0], HAND_L.pitch), HAND_L.roll); // wrist to fist, at rest
    const FINGERS_R = rotY([1, 0, 0], HAND_R_YAW); // the open right hand's fingers, at rest
    const HIPS_AT: V3 = [0, 0.2, 0];
    const SPINE_AT: V3 = [0, 0.26, 0];
    const CHEST_AT: V3 = [0, 0.33, 0];

    // Attack: a staff cast. She turns away and draws the staff back along its own line, tipped
    // forward, then thrusts the lantern end at the target with her body behind it. The lantern
    // hangs plumb from the hook (it swings on its own), whips forward at the strike, and flares.
    // The staff's lower end must pass outside the skirt: the hand stays out and forward while the
    // staff turns, and the recovery stands the staff up in front of the hip, not beside it.
    const castWrist = [
      [0, WRIST_L],
      [0.15, [0.285, 0.35, 0.03]],
      [0.35, [0.25, 0.35, -0.06]],
      [0.42, [0.245, 0.352, -0.075]],
      [0.52, [0.2, 0.37, 0.175]],
      [0.62, [0.205, 0.368, 0.168]],
      [0.74, [0.27, 0.37, 0.16]],
      [0.86, [0.285, 0.355, 0.12]],
      [1, WRIST_L],
    ] as const;
    const castDir = [
      [0, STAFF_AXIS],
      [0.15, norm([0.2, 0.85, 0.48])],
      [0.35, norm([0.34, 0.66, 0.67])],
      [0.42, norm([0.34, 0.64, 0.69])],
      [0.52, norm([0.12, 0.4, 0.91])],
      [0.62, norm([0.13, 0.41, 0.9])],
      [0.74, norm([0.06, 0.62, 0.78])],
      [0.86, norm([0.2, 0.9, 0.38])],
      [1, STAFF_AXIS],
    ] as const;
    const castPole = [
      [0, POLE_L],
      [0.35, [0.55, 0.15, -0.1]],
      [0.52, [0.5, 0.2, -0.2]],
      [0.74, [0.55, 0.15, -0.2]],
      [1, POLE_L],
    ] as const;
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const g = ease(0, 0.35, p) * (1 - ease(0.42, 0.5, p));
        const s = ease(0.43, 0.52, p) * (1 - ease(0.64, 1, p));
        const hipsR: V3 = [0, 10 * g - 12 * s, 0];
        const spineR: V3 = [-3 * g + 7 * s, 6 * g - 6 * s, 0];
        const chestR: V3 = [-3 * g + 5 * s, 10 * g - 12 * s, 0];
        const wrist = keys(p, castWrist);
        const arm = reach(ARM_L, wrist, keys(p, castPole));
        // The fist lines up with the forearm while the staff is out of its rest grip.
        const elbow = follow([SHOULDER], [arm.upper], ELBOW_L);
        const w = keys(p, [[0, 0], [0.25, 1], [0.75, 1], [1, 0]] as const);
        const up = norm(lerp(FIST_L, norm(sub(wrist, elbow)), w));
        const hand = orient([arm.upper, arm.lower], { dir: STAFF_AXIS, up: FIST_L }, { dir: keys(p, castDir), up });
        // The lantern: plumb, plus a lag swing (+X swings it back, -X forward to the target).
        const swing = keys(p, [[0, 0], [0.18, -10], [0.35, 6], [0.44, 4], [0.48, 20], [0.54, -40], [0.6, -46], [0.7, -8], [0.8, 8], [0.9, -3], [1, 0]] as const);
        const lanternR = euler(chainQ([hipsR, spineR, chestR, arm.upper, arm.lower, hand]).invert().multiply(quat([swing, 0, 0])));
        const flare = keys(p, [[0, 1], [0.47, 1], [0.49, 1.4], [0.56, 1.4], [0.59, 1], [1, 1]] as const, 'linear');
        return {
          hips: { move: [0, -legDrop(LEG, 14 * s) - 0.004 * g, -0.012 * g + 0.025 * s], rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          head: { rotate: [2 * g - 6 * s, -4 * g + 14 * s, 0] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          lantern: { rotate: lanternR, scale: [flare, flare, flare] },
          // The flask arm swings in for balance on the draw, then back on the thrust.
          'upperarm.R': { rotate: [-5 * g + 10 * s, 0, -4 * s] },
          'leg.L': { rotate: [-14 * s, 0, 0] },
          'leg.R': { rotate: [14 * s, 0, 0] },
          'foot.L': { rotate: [14 * s, 0, 0] },
          'foot.R': { rotate: [-14 * s, 0, 0] },
        };
      },
    });

    // Attack 2: a flask throw. The right hand winds up back and up, out beside the head (clear of
    // the hair locks and the basket), then throws forward and up. At the release the flask leaves
    // the hand on a world-space arc toward the target, tumbling, and shrinks away; at the end a new
    // flask grows back on the palm.
    const THROW_S = 0.9;
    const RELEASE = 0.47;
    const throwWrist = [
      [0, WRIST_R],
      [0.18, [-0.3, 0.41, 0.04]],
      [0.34, [-0.3, 0.46, -0.07]],
      [0.4, [-0.3, 0.465, -0.075]],
      [0.44, [-0.31, 0.44, 0.06]],
      [RELEASE, [-0.26, 0.46, 0.13]],
      [0.55, [-0.19, 0.37, 0.17]],
      [0.62, [-0.19, 0.36, 0.15]],
      [0.85, WRIST_R],
      [1, WRIST_R],
    ] as const;
    // The flask's axis (the palm's normal): tipped out, away from the head, on the wind-up.
    const flaskAxis = [
      [0, [0, 1, 0]],
      [0.18, norm([-0.4, 0.9, 0.05])],
      [0.34, norm([-0.45, 0.87, 0.02])],
      [0.4, norm([-0.45, 0.87, 0])],
      [0.44, norm([-0.5, 0.85, 0])],
      [RELEASE, norm([-0.15, 0.8, -0.5])],
      [0.55, norm([0, 0.9, 0.4])],
      [0.85, [0, 1, 0]],
    ] as const;
    const throwPole = [
      [0, POLE_R],
      [0.18, [-0.6, 0.2, 0.0]],
      [0.4, [-0.6, 0.2, -0.05]],
      [RELEASE, [-0.6, 0.1, 0.1]],
      [0.62, [-0.5, 0.1, 0.0]],
      [0.85, POLE_R],
    ] as const;
    const throwRig = (p: number) => {
      const w = ease(0, 0.34, p) * (1 - ease(0.4, 0.48, p));
      const t = ease(0.41, 0.5, p) * (1 - ease(0.62, 0.95, p));
      const hipsR: V3 = [0, -8 * w + 12 * t, 0];
      const hipsMove: V3 = [0, -legDrop(LEG, 12 * t) - 0.004 * w, -0.012 * w + 0.022 * t];
      // On the wind-up she leans away from the raised arm (-Z tilts toward her left).
      const spineR: V3 = [-4 * w + 7 * t, -6 * w + 8 * t, -3 * w];
      const chestR: V3 = [-3 * w + 5 * t, -12 * w + 14 * t, -7 * w];
      const wrist = keys(p, throwWrist, 'spline');
      const arm = reach(ARM_R, wrist, keys(p, throwPole));
      const elbow = follow([mx(SHOULDER)], [arm.upper], ELBOW_R);
      const wt = keys(p, [[0, 0], [0.2, 1], [0.7, 1], [0.85, 0]] as const);
      const fingers = norm(lerp(FINGERS_R, norm(sub(wrist, elbow)), wt));
      const hand = orient([arm.upper, arm.lower], { dir: [0, 1, 0], up: FINGERS_R }, { dir: keys(p, flaskAxis), up: fingers });
      const rots: V3[] = [hipsR, spineR, chestR, arm.upper, arm.lower, hand];
      // Where the flask's pivot is when it sits in the hand, and how the hand is turned.
      const flaskAt = add(follow([HIPS_AT, SPINE_AT, CHEST_AT, mx(SHOULDER), ELBOW_R, WRIST_R], rots, FLASK), hipsMove);
      return { w, t, hipsR, hipsMove, spineR, chestR, arm, hand, flaskAt, handQ: chainQ(rots) };
    };
    const atRelease = throwRig(RELEASE);
    const FLIGHT_V: V3 = [0.15, 1.3, 2.0]; // m/s: forward and up, a little toward the center line
    k.animation('attack2', {
      duration: THROW_S,
      loop: false,
      pose: (_t, p) => {
        const r = throwRig(p);
        const size = keys(p, [[0, 1], [0.58, 1], [0.72, 0.001], [0.86, 0.001], [1, 1]] as const);
        let flask: { move?: V3; rotate?: V3; scale: V3 } = { scale: [size, size, size] };
        if (p > RELEASE && p < 0.73) {
          const dt = (p - RELEASE) * THROW_S;
          const want = add(atRelease.flaskAt, [FLIGHT_V[0] * dt, FLIGHT_V[1] * dt - 4.9 * dt * dt, FLIGHT_V[2] * dt]);
          const inv = r.handQ.clone().invert();
          const d = new THREE.Vector3(...sub(want, r.flaskAt)).applyQuaternion(inv);
          const tumble = quat([540 * dt, 0, 0]).multiply(atRelease.handQ.clone());
          flask = { move: [d.x, d.y, d.z], rotate: euler(inv.multiply(tumble)), scale: flask.scale };
        }
        const { w, t } = r;
        return {
          hips: { move: r.hipsMove, rotate: r.hipsR },
          spine: { rotate: r.spineR },
          chest: { rotate: r.chestR },
          // The head keeps looking at the target while the body winds up and throws.
          head: { rotate: [3 * w - 5 * t, 12 * w - 14 * t, 0] },
          'upperarm.R': { rotate: r.arm.upper },
          'forearm.R': { rotate: r.arm.lower },
          'hand.R': { rotate: r.hand },
          flaskroot: flask,
          // The staff arm barely moves; the lantern swings with the turn.
          'upperarm.L': { rotate: [4 * w - 3 * t, 0, 0] },
          lantern: { rotate: [-8 * w + 14 * t, 0, 5 * w] },
          'leg.L': { rotate: [-12 * t, 0, 0] },
          'leg.R': { rotate: [12 * t, 0, 0] },
          'foot.L': { rotate: [12 * t, 0, 0] },
          'foot.R': { rotate: [-12 * t, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit, death, victory
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    /** The lantern's rotate value that gives it the world rotation `world` under the posed staff hand. */
    const lanternWorld = (chain: readonly V3[], world: THREE.Quaternion) => euler(chainQ(chain).invert().multiply(world));
    /** World points and directions into the chest's rest frame, for a posed torso (the arm targets). */
    const chestFrame = (rots: readonly V3[], hipsMove: V3) => {
      const inv = chainQ(rots).invert();
      const at = add(follow([HIPS_AT, SPINE_AT], rots.slice(0, 2), CHEST_AT), hipsMove);
      const turn = (v: V3): V3 => {
        const r = new THREE.Vector3(...v).applyQuaternion(inv);
        return [r.x, r.y, r.z];
      };
      return { point: (w: V3) => add(CHEST_AT, turn(sub(w, at))), dir: turn };
    };

    // Hit: a blow from the front. The chest and the head snap back, the right foot steps back to
    // catch her, and she comes back quickly. The cap and the lantern lag, then overshoot.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.32, 0.8], [0.72, 0.1], [1, 0]] as const);
        const lag = keys(p, [[0, 0], [0.12, 1], [0.32, -0.7], [0.56, 0.35], [0.8, -0.1], [1, 0]] as const);
        return {
          hips: { move: [0, -legDrop(LEG, 12 * h), -0.03 * h], rotate: [-3 * h, 4 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-9 * h, -4 * h, -2 * h] },
          neck: { rotate: [-3 * h, 0, 0] },
          head: { rotate: [-8 * h, 5 * h, -4 * h] },
          caproot: { rotate: [6 * lag, 0, 2 * lag] },
          lantern: { rotate: [-16 * lag, 0, 6 * lag] },
          'upperarm.L': { rotate: [-8 * h, 0, 5 * h] },
          'upperarm.R': { rotate: [3 * h, 0, -12 * h] },
          'forearm.R': { rotate: [4 * h, 0, 0] },
          'leg.L': { rotate: [-9 * h, 0, 0] },
          'leg.R': { rotate: [14 * h, 0, 0] },
          'foot.L': { rotate: [9 * h, 0, 0] },
          'foot.R': { rotate: [-8 * h, 0, 0] },
        };
      },
    });

    // Death: she reels back from the blow, sways, and topples onto her left side, pivoting on her
    // left foot. The cap is too wide to lie flat, so the neck and the head bend up and the cap's
    // rim props them; the basket stays on top. The staff arm reaches forward on the way down, and
    // the staff lands in front of her, pointing past her head, resting on its branch and crook;
    // the lantern tips over on its side next to it.
    const DEATH_S = 1.4;
    const FOOT_PIVOT: V3 = [ANKLE[0] + 0.02, 0, 0];
    const DEATH_LIFT: V3 = [-0.02, 0.086, 0.02];
    const deathBody = (p: number) => {
      const st = keys(p, [[0, 0], [0.1, 1], [0.24, 0.75], [0.42, 0]] as const);
      const tt = clamp01((p - 0.24) / 0.44);
      const f = tt * tt; // the fall speeds up until she hits the ground
      const land = bump(clamp01((p - 0.68) / 0.14));
      const lift = ease(0.42, 0.68, p);
      const tree = add(FOOT_PIVOT, rotZ(sub(HIPS_AT, FOOT_PIVOT), -88 * f));
      const hipsMove: V3 = add(sub(tree, HIPS_AT), [DEATH_LIFT[0] * lift, DEATH_LIFT[1] * lift + 0.012 * land, -0.03 * st + DEATH_LIFT[2] * lift]);
      const hipsR: V3 = [-4 * st, 0, -88 * f];
      const spineR: V3 = [-5 * st, 0, 0];
      const chestR: V3 = [-8 * st, -3 * st, 0];
      return { st, f, land, hipsMove, hipsR, spineR, chestR };
    };
    // The end pose of the staff arm, set in world space and turned into the chest's rest frame.
    const deathEnd = (() => {
      const b = deathBody(1);
      const rots = [b.hipsR, b.spineR, b.chestR];
      const cf = chestFrame(rots, b.hipsMove);
      const shoulder = add(follow([HIPS_AT, SPINE_AT, CHEST_AT], rots, SHOULDER), b.hipsMove);
      // Low and forward, so the staff lies flat in front of the skirt; its lower end reaches past
      // the hem toward her feet, and its top passes in front of the cap's rim.
      const wrist: V3 = [shoulder[0] + 0.03, 0.058, shoulder[2] + 0.18];
      return {
        wrist: cf.point(wrist),
        dir: norm(cf.dir(norm([0.95, 0.06, 0.25]))),
        up: norm(cf.dir(norm([0.3, 0, 1]))),
        pole: cf.point(add(shoulder, [0.1, 0.05, 0.08])),
      };
    })();
    // While she falls, the staff stays upright and forward, so its lower end stays under the hem
    // and in front of it (never in the skirt); it swings down to the ground only as she lands.
    const deathWrist = [
      [0, WRIST_L],
      [0.2, [0.285, 0.37, 0.13]],
      [0.46, [0.28, 0.4, 0.19]],
      [0.7, deathEnd.wrist],
    ] as const;
    const deathDir = [
      [0, STAFF_AXIS],
      [0.2, norm([0.35, 0.92, 0.1])],
      [0.46, norm([0.35, 0.9, 0.18])],
      [0.7, deathEnd.dir],
    ] as const;
    const deathUp = [
      [0, FIST_L],
      [0.46, norm([0.1, -0.3, 1])],
      [0.7, deathEnd.up],
    ] as const;
    const deathPole = [
      [0, POLE_L],
      [0.46, [0.5, 0.2, 0.1]],
      [0.7, deathEnd.pole],
    ] as const;
    const LANTERN_DOWN = quat([-88, 0, 0]); // on its side, the bottom toward the viewer
    k.animation('death', {
      duration: DEATH_S,
      loop: false,
      pose: (_t, p) => {
        const b = deathBody(p);
        const { st, f, land } = b;
        const hb = ease(0.5, 0.72, p); // the head bends up as the cap meets the ground
        const lag = keys(p, [[0, 0], [0.1, 1], [0.3, -0.5], [0.5, 0], [0.7, 0], [0.76, 1], [0.9, -0.3], [1, 0]] as const);
        const arm = reach(ARM_L, keys(p, deathWrist), keys(p, deathPole));
        const hand = orient([arm.upper, arm.lower], { dir: STAFF_AXIS, up: FIST_L }, { dir: norm(keys(p, deathDir)), up: norm(keys(p, deathUp)) });
        const chain: V3[] = [b.hipsR, b.spineR, b.chestR, arm.upper, arm.lower, hand];
        // The lantern hangs plumb and swings while she falls, then tips onto its side.
        const lie = ease(0.64, 0.74, p);
        const swing = quat([keys(p, [[0, 0], [0.12, -18], [0.3, 10], [0.5, -14], [0.64, 6]] as const), 0, 12 * f]);
        const lanternR = lanternWorld(chain, swing.slerp(LANTERN_DOWN, lie));
        const liftW = new THREE.Vector3(0, 0.04 * lie, 0).applyQuaternion(chainQ(chain).invert());
        return {
          hips: { move: b.hipsMove, rotate: b.hipsR },
          spine: { rotate: b.spineR },
          chest: { rotate: b.chestR },
          neck: { rotate: [-3 * st, 0, 16 * hb] },
          head: { rotate: [-9 * st + 6 * hb, 4 * hb, 26 * hb + 4 * land] },
          caproot: { rotate: [6 * lag * (1 - hb), 0, 8 * hb + 5 * land] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          lantern: { rotate: lanternR, move: [liftW.x, liftW.y, liftW.z] },
          // The flask arm flings out on the blow, then rests along her side; the flask tips over.
          'upperarm.R': { rotate: [4 * st - 12 * f, 0, -12 * st + 12 * f] },
          'forearm.R': { rotate: [10 * f, 0, 0] },
          'hand.R': { rotate: [75 * ease(0.3, 0.7, p), 0, 0] },
          'leg.L': { rotate: [-6 * st - 15 * f, 0, 0] },
          'leg.R': { rotate: [14 * st * (1 - f) - 30 * f, 0, 0] },
          'foot.L': { rotate: [6 * st + 15 * f, 0, 0] },
          'foot.R': { rotate: [-8 * st + 12 * f, 0, 0] },
        };
      },
    });

    // Victory: she lifts the staff high, out and forward beside the cap (the cap is wider than her
    // reach, so the staff leans out past the rim), raises the flask, and hops once; the lantern
    // swings plumb from the hook, and after the landing she holds the pose with a small bounce.
    const vicWrist = [
      [0, WRIST_L],
      [0.2, [0.28, 0.47, 0.1]],
      [1, [0.28, 0.475, 0.1]],
    ] as const;
    // The staff stands almost upright out at her left side: a steeper lean would swing its lower
    // end into the skirt.
    const vicDir = [
      [0, STAFF_AXIS],
      [0.2, norm([0.18, 0.95, 0.3])],
      [1, norm([0.18, 0.95, 0.29])],
    ] as const;
    const vicPole = [
      [0, POLE_L],
      [0.2, [0.55, 0.3, -0.1]],
    ] as const;
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const up = ease(0.02, 0.2, p);
        const hopT = clamp01((p - 0.2) / 0.26);
        const hop = Math.sin(Math.PI * hopT);
        const squash = keys(p, [[0, 0], [0.13, 1], [0.2, 0], [0.46, 0], [0.52, 1], [0.64, 0]] as const);
        const bob = bump(clamp01((p - 0.64) / 0.36), 2);
        const wrist = keys(p, vicWrist);
        const arm = reach(ARM_L, wrist, keys(p, vicPole));
        const elbow = follow([SHOULDER], [arm.upper], ELBOW_L);
        // The fist bends halfway to the forearm, so the lantern branch points out, clear of the cap.
        const fist = norm(lerp(FIST_L, norm(sub(wrist, elbow)), 0.5 * up));
        const hand = orient([arm.upper, arm.lower], { dir: STAFF_AXIS, up: FIST_L }, { dir: norm(keys(p, vicDir)), up: fist });
        const hipsR: V3 = [0, 0, 0];
        const spineR: V3 = [-4 * up, 0, 2 * up];
        const chestR: V3 = [-4 * up + 3 * squash, 5 * up, 0];
        const swing = keys(p, [[0, 0], [0.2, 16], [0.34, -20], [0.5, 22], [0.62, -14], [0.76, 9], [0.9, -4], [1, 2]] as const);
        const lanternR = lanternWorld([hipsR, spineR, chestR, arm.upper, arm.lower, hand], quat([swing, 0, 0.4 * swing]));
        const upR: V3 = [-10 * up, -45 * up, -35 * up];
        // The forearm lifts only a little, so the flask stays about 2 cm clear of the hair locks.
        const foreR: V3 = [-10 * up + 6 * bob, 0, 0];
        return {
          hips: { move: [0, 0.05 * hop - 0.003 * squash - 0.002 * bob, 0], rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-3 * up, 0, 0] },
          head: { rotate: [-7 * up + 4 * squash, 6 * up, -3 * up] },
          caproot: { rotate: [-5 * hop + 4 * squash, 0, 0] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          lantern: { rotate: lanternR },
          // The flask arm turns out to her right and lifts the flask like a toast, clear of the hair.
          'upperarm.R': { rotate: upR },
          'forearm.R': { rotate: foreR },
          // The palm stays level, so the flask stands upright (tipped a little outward) on the raised hand.
          'hand.R': { rotate: euler(chainQ([hipsR, spineR, chestR, upR, foreR]).invert().multiply(quat([0, 0, 22 * up]))) },
          'leg.L': { rotate: [-8 * hop, 0, 0] },
          'leg.R': { rotate: [-4 * hop, 0, 0] },
          'foot.L': { rotate: [18 * hop, 0, 0] },
          'foot.R': { rotate: [14 * hop, 0, 0] },
        };
      },
    });
  },
});
