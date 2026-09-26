import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

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
 * Bodies: skin, hair, cap, gills, dress, sleeves, apron, leather, gold, basket, mushrooms, leaves,
 *   legs, boots, staff, staff-mushroom, lantern-frame, lantern-light, flask, potion.
 * Rig: the rogue's chibi skeleton plus `lantern` (hangs from the staff); the basket is rigid on the
 *   chest, the flask on the right hand, the staff on the left hand. Clips: idle, walk, run.
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
const WRIST_L: V3 = [0.27, 0.35, 0.085];
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
const HAND_L = { pitch: -80, roll: -14 };
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
    const capPose = (s: sdf.Shape) => s.rotateX(-6).rotateZ(-7).at(0, 0.745, -0.01);
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
      .displace(0.004, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2));
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
    );
    const capTop = dome
      .subtract(capInner)
      .intersect(sdf.halfSpace([0, -1, 0], -0.012))
      .paintWhere(spots, C.spot, 0.004);
    k.body('cap', capPose(capTop), { color: C.cap, roughness: 0.6, bone: 'head' });
    // The gills: the underside between the rim and the stem, in radial folds.
    const gillShell = dome.round(0.002).intersect(sdf.halfSpace([0, 1, 0], 0.016)).subtract(capInner.round(0.004));
    const gills = gillShell.paintFn((x, _y, z, base) => (Math.sin(Math.atan2(z, x) * 36) > 0.8 ? rgb(C.gillsDark) : base));
    // The radial folds live in the normal map (fine, regular detail), not in the mesh.
    const gillFolds = (x: number, y: number, z: number) => {
      const p = [x, y - 0.745, z + 0.01] as const;
      return 0.0035 * Math.abs(Math.sin(Math.atan2(p[2], p[0]) * 36));
    };
    k.body('gills', capPose(gills), { color: C.gills, roughness: 0.8, bone: 'head', bump: gillFolds });

    // ------------------------------------------------------------------ hair: an auburn bob with bangs
    const underCap = capPose(capInner.round(-0.004).union(sdf.halfSpace([0, 1, 0], -0.004)));
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.016, HEAD[1] + 0.012, HEAD[2] + 0.016])
      .at(0, HEAD_Y + 0.004, -0.014)
      .smoothSubtract(0.015, sdf.ellipsoid([0.235, 0.15, 0.22]).at(0, 0.615, 0.15));
    // The bob: a rounded shell around the head down to the jaw, fuller at the back.
    const bob = sdf
      .smoothUnion(
        0.04,
        sdf.ellipsoid([0.235, 0.2, 0.225]).at(0, 0.64, -0.03),
        pair(sdf.ellipsoid([0.06, 0.1, 0.07]).at(0.19, 0.55, 0.02)),
      )
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.48))
      .smoothSubtract(0.02, sdf.ellipsoid([0.2, 0.2, 0.24]).at(0, 0.58, 0.19));
    // Bangs: blunt, rounded locks over the brow.
    const bangs = sdf.union(
      ...[-0.13, -0.07, -0.01, 0.05, 0.11, 0.16].map((x, i) => {
        const top = [x * 0.9, 0.8, faceZ(Math.abs(x) * 0.9, 0.74) - 0.02] as const;
        const tip = [x, 0.705 + (i % 2) * 0.012, faceZ(Math.abs(x), 0.705) + 0.012] as const;
        return sdf.cone(top, tip, 0.044, 0.02);
      }),
    );
    const strands = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 24 + y * 12);
    const hair = sdf
      .smoothUnion(0.02, cap, bob, bangs)
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
    const sprig = sdf.union(
      sdf.extrude(profile.rect([0.006, 0.07], 0.003), 0.4).at(0, 0.2, 0.2),
      ...(
        [
          [-0.018, 0.215, 30],
          [0.018, 0.215, -30],
          [-0.016, 0.185, 40],
          [0.016, 0.185, -40],
          [0, 0.238, 0],
        ] as const
      ).map(([x, y, r]) => sdf.extrude(profile.polygon([[0, -0.012], [0.01, 0], [0, 0.014], [-0.01, 0]], { smooth: true, samples: 3 }), 0.4).rotateZ(r).at(x, y, 0.2)),
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
    const pouch = (x: number) => {
      const p = sdf.surfacePoint(belt, [x, beltY - 0.02, 0.3], 0);
      return sdf
        .union(sdf.box([0.046, 0.05, 0.03], 0.01), sdf.box([0.052, 0.022, 0.036], 0.008).at(0, 0.018, 0.002).paint(C.leatherDark))
        .rotateY((Math.atan2(p[0], p[2]) * 180) / Math.PI)
        .at(p[0], p[1] - 0.024, p[2] + 0.006);
    };
    k.body('leather', sdf.union(belt, strap(1), strap(-1), pouch(0.12), pouch(-0.12)).bone('spine'), {
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
        [top[0] - 0.03, top[1] + 0.04, top[2], 0.011],
        [top[0] - 0.07, top[1] + 0.035, top[2], 0.009],
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
    // A little mushroom sprouting from the crook.
    const crookTip: V3 = [top[0] - 0.07, top[1] + 0.035, top[2]];
    const topShroom = sdf
      .union(
        sdf.cone([0, 0, 0], [0, 0.05, 0], 0.012, 0.01).paint(C.stem),
        sdf
          .revolve(profile.polygon([[0, 0.078], [0.03, 0.07], [0.048, 0.048], [0.044, 0.04], [0, 0.052]], { smooth: true, samples: 4 }))
          .paintWhere(sdf.sphere(0.012).at(0.018, 0.074, 0.01), C.spot),
      )
      .rotateZ(15)
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
    k.body('flask', flaskGlass.subtract(flaskGlass.round(-0.004)).bone('hand.R'), {
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
    k.body('potion', sdf.union(liquid, cork, sprout.paint(C.leaf)).bone('hand.R'), {
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
  },
});
