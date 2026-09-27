import { defineAsset, motion, profile, rgb, sdf } from '../src/index.js';

/**
 * Shopkeeper — Chibi Quest settlement NPC (catalog `npcs/settlement/shopkeeper`), about 1.0 m to the
 * top of his beret bow, faces +Z. Target: docs/npc-mockups/shopkeeper_001.jpg (made with mmx; one
 * front view). Built on the farmer (the rogue's head and skeleton, with the adventurer's face).
 *
 * Role: a town NPC (the market stall), seen in 3D and as a 128 px sprite; the beret, the spectacles,
 *   the mustache, the vest over the mustard shirt, the leather apron, and the coin pouch must read.
 * One idea: a jolly, bespectacled merchant under a floppy plum beret, with a big round nose and a
 *   bushy mustache, weighing a fat coin pouch in his right hand.
 * Proportions: the rogue's (head center 0.675, eyes 0.628, shoulders 0.385, waist 0.25); the beret
 *   rim at about 0.77 and 0.27 wide, cocked down to his right; the pouch hangs out to his right side.
 * Shape language: round and soft everywhere (beret, nose, pouch, boots), with the thin circles of the
 *   spectacles and the flat panel of the apron.
 * Palette (60/30/10): mustard shirt #dcb43e and teal vest #4e9a8a; plum beret #9a70b0 and brown
 *   leather (apron, pouch, boots); black hair, mustache, and spectacles; brass buttons.
 * Value plan: the light face framed by the black spectacles and mustache under the plum beret is the
 *   focal point; the teal vest and the brown apron are the two big masses.
 * Bodies: skin, hair, beret, spectacles, shirt, vest, brass, apron, trousers, boots, pouch.
 * Rig: the rogue's skeleton; the pouch is rigid on `hand.R`. Clips: idle, walk, run, work (weighing
 *   the coin pouch), talk, wave.
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
  brow: '#241a16',
  mouth: '#8a3a30',
  hair: '#2e2420',
  hairDark: '#1a1412',
  beret: '#9a70b0',
  beretDark: '#74528a',
  ribbon: '#262024',
  shirt: '#dcb43e',
  vest: '#4e9a8a',
  vestDark: '#3a7a6c',
  brass: '#d6a640',
  apron: '#7a4a2e',
  apronDark: '#5c3520',
  trousers: '#3c5056',
  boot: '#5a3424',
  sole: '#34200f',
  pouch: '#8a4a2a',
  pouchDark: '#6a3620',
  cord: '#c8a060',
  glasses: '#1c1818',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: the right arm holds the pouch out to his side; the left arm hangs relaxed.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.18, 0.332, 0.012];
const WRIST_L: V3 = [0.205, 0.238, 0.03];
const ELBOW_R: V3 = [-0.195, 0.33, 0.025];
const WRIST_R: V3 = [-0.262, 0.29, 0.06];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The pouch's knot: under the right fist, where the drawstrings come out between the fingers.
const KNOT: V3 = [WRIST_R[0] - 0.007, WRIST_R[1] - 0.075, WRIST_R[2] + 0.008];

/** A relaxed fist hanging from the wrist `w` (`s` = 1 for the left hand, -1 for the right). */
const fistAt = (w: V3, s = 1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(w[0] + 0.007 * s, w[1] - 0.038, w[2] + 0.004),
    sdf.capsule([w[0] - 0.009 * s, w[1] - 0.058, w[2] + 0.03], [w[0] - 0.005 * s, w[1] - 0.038, w[2] + 0.042], 0.017),
    sdf.cone([w[0] + 0.02 * s, w[1] - 0.023, w[2] + 0.025], [w[0] + 0.001 * s, w[1] - 0.033, w[2] + 0.048], 0.016, 0.013),
  );

export default defineAsset({
  name: 'shopkeeper',
  description: 'Chibi shopkeeper NPC: a plum beret with a bow, round spectacles, a bushy mustache, a teal vest over a mustard shirt, a leather apron, and a coin pouch.',
  detail: 0.005,
  reference: 'docs/npc-mockups/shopkeeper_001.jpg',
  // Color slots for individual shopkeepers (the first option is the default look). The clothing slot
  // is the beret; the shirt, the vest, the apron, and the boots keep their colors.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { black: C.hair, brown: '#6b3f24', grey: '#8a8580' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    // Merchant dyes in the plum's family: faded indigo, mustard ochre, olive.
    clothing: { plum: C.beret, indigo: '#5a6c9e', ochre: '#b8964a', olive: '#8a8a50' },
  },
  presets: {
    jeweler: { eyes: 'blue', hair: 'grey', skin: 'fair', clothing: 'indigo' },
    grocer: { eyes: 'green', hair: 'brown', skin: 'tan', clothing: 'olive' },
    spicer: { eyes: 'brown', hair: 'black', skin: 'brown', clothing: 'ochre' },
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
      beret: k.tint('clothing'),
      beretDark: k.tint('clothing', { color: C.beretDark, follow: 1 }),
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
    // A big round nose, the merchant's trademark.
    const NOSE_Y = 0.566;
    const nose = sdf.ellipsoid([0.058, 0.05, 0.05]).at(0, NOSE_Y, faceZ(0, NOSE_Y) + 0.03).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.034, 0.054, 0.036])
        .subtract(sdf.sphere(0.021).at(0.02, 0, 0.009))
        .rotateY(-15)
        .at(0.2, 0.61, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST_L).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAt(WRIST_R, -1).bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019), at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022)]),
    );
    // Thick, bushy brows above the spectacle rims.
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.026, 62, 116), 0.3).at(0.1, 0.728 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.05, 0.011, 240, 300), 0.3).at(0, 0.513 + 0.05, 0.1);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.014, nose, ears)
      .union(armL, armR)
      .paintWhere(pair(at(sdf.sphere(0.03), 0.15, 0.545)), T.blush, 0.025)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth)
      .paintWhere(sdf.sphere(0.03).at(0, NOSE_Y + 0.004, faceZ(0, NOSE_Y) + 0.075), T.nose, 0.025); // a rosy nose tip
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ the beret: a floppy puff cocked down to his right
    // Local frame: the rim's center at the origin; the beret tips back a little and down to his right.
    const beretPose = (s: sdf.Shape) => s.rotateX(-4).rotateZ(12).at(-0.015, 0.738, 0.005);
    const headFit = sdf
      .ellipsoid([HEAD[0] + 0.03, HEAD[1] + 0.03, HEAD[2] + 0.03])
      .at(0, HEAD_Y, 0)
      .intersect(beretPose(sdf.halfSpace([0, -1, 0], 0)));
    const puff = beretPose(sdf.ellipsoid([0.255, 0.115, 0.24]).at(-0.02, 0.1, 0.005));
    // A black bow on top, over his right.
    const bow = beretPose(
      sdf.smoothUnion(
        0.012,
        sdf.sphere(0.021).at(-0.15, 0.19, 0.02),
        sdf.ellipsoid([0.028, 0.064, 0.014]).rotateZ(42).at(-0.195, 0.235, 0.02),
        sdf.ellipsoid([0.024, 0.052, 0.014]).rotateZ(12).at(-0.155, 0.245, 0.012),
      ),
    );
    const beret = sdf
      .smoothUnion(0.035, headFit, puff)
      .paintWhere(beretPose(sdf.halfSpace([0, 1, 0], 0.035)), T.beretDark, 0.02) // the shaded rim band
      .union(bow.paint(C.ribbon));
    k.body('beret', beret.bone('head'), { color: T.beret, roughness: 0.9 });

    // ------------------------------------------------------------------ hair under the beret, mustache
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, sdf.ellipsoid([0.25, 0.155, 0.23]).at(0, 0.61, 0.14));
    // A curly lock swept out from under the beret on his left, and puffs above the ears.
    const lock = sdf.chain(
      [
        [0.01, 0.765, 0.172, 0.026],
        [0.07, 0.772, 0.17, 0.036],
        [0.135, 0.76, 0.142, 0.036],
        [0.185, 0.728, 0.088, 0.026],
      ],
      0.02,
    );
    const puffs = pair(sdf.ellipsoid([0.036, 0.05, 0.05]).at(0.198, 0.705, 0.03));
    const hair = sdf
      .smoothUnion(0.02, cap, lock, puffs)
      .paintFn((x, y, z, base) => (Math.sin(x * 60 + z * 25 - y * 30) > 0.85 ? rgb(T.hairDark) : base));
    // The mustache: two fat lobes under the nose that curl out and down.
    const mz = (x: number, y: number) => faceZ(x, y) + 0.004;
    const mustache = pair(
      sdf.chain(
        [
          [0, 0.536, mz(0, 0.536) + 0.006, 0.022],
          [0.038, 0.533, mz(0.038, 0.533) + 0.002, 0.025],
          [0.07, 0.52, mz(0.07, 0.52), 0.02],
          [0.092, 0.5, mz(0.092, 0.5) - 0.004, 0.012],
        ],
        0.012,
      ),
    );
    k.body('hair', sdf.union(hair, mustache).bone('head'), { color: T.hair, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ spectacles: round wire rims
    const rimZ = faceZ(EYE[0], EYE[1]) + 0.017;
    const rim = sdf.torus(0.07, 0.0062).rotateX(82).rotateY(16).at(EYE[0], EYE[1], rimZ);
    const bridge = sdf.chain(
      [
        [0.036, 0.638, faceZ(0.036, 0.638) + 0.016, 0.0055],
        [0, 0.646, faceZ(0, 0.646) + 0.014, 0.0055],
        [-0.036, 0.638, faceZ(0.036, 0.638) + 0.016, 0.0055],
      ],
      0.004,
    );
    const outer: V3 = [EYE[0] + 0.07 * Math.cos(16 * (Math.PI / 180)), EYE[1] + 0.012, rimZ - 0.07 * Math.sin(16 * (Math.PI / 180))];
    const temple = sdf.capsule(outer, [0.215, 0.655, -0.01], 0.0045);
    k.body('spectacles', sdf.union(pair(rim), bridge, pair(temple)), { color: C.glasses, roughness: 0.3, metalness: 0.6, detail: 0.003, bone: 'head' });

    // ------------------------------------------------------------------ mustard shirt: torso, long sleeves, collar
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.124, 0.29],
            [0.13, 0.25],
            [0.136, 0.21],
            [0.13, 0.196],
            [0, 0.196],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const sleeve = (s: V3, e: V3, w: V3, side: 'L' | 'R') =>
      sdf.smoothUnion(
        0.012,
        sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.049, 0.046).bone(`upperarm.${side}`),
        sdf.cone(e, lerp(e, w, 0.92), 0.046, 0.043).bone(`forearm.${side}`),
        sdf.cone(lerp(e, w, 0.72), lerp(e, w, 0.97), 0.049, 0.049).round(0.003).bone(`forearm.${side}`), // the cuff
      );
    const collar = hard(
      torso
        .round(0.018)
        .intersect(sdf.extrude(profile.polygon([[0.004, 0.462], [0.062, 0.462], [0.03, 0.398]], { smooth: false }), 0.4).at(0, 0, 0.2)),
    );
    const shirt = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW_L, WRIST_L, 'L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'R'), collar.bone('chest'));
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85 });

    // ------------------------------------------------------------------ teal vest: a V-neck, a placket, brass buttons
    const vNeck = sdf.extrude(profile.polygon([[-0.058, 0.52], [0.058, 0.52], [0, 0.37]], { smooth: false }), 0.4).at(0, 0, 0.2);
    const vest = torso
      .round(0.011)
      .intersect(sdf.halfSpace([0, -1, 0], -0.205))
      .smoothSubtract(0.004, vNeck)
      .paintWhere(sdf.box([0.006, 0.18, 0.4]).at(0, 0.28, 0.2), C.vestDark, 0.002);
    k.body('vest', vest.bone('chest'), { color: C.vest, roughness: 0.8 });
    const buttons = sdf.union(...[-0.042, 0, 0.042].map((x) => sdf.sphere(0.011).at(...sdf.surfacePoint(vest, [x, 0.322, 0.3], 0.004))));
    k.body('brass', buttons.bone('chest'), { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ leather apron: a flared front panel, a belt, two pockets
    const skirtOuter = sdf.revolve(profile.polygon([[0, 0.3], [0.142, 0.3], [0.172, 0.125], [0, 0.125]], { smooth: false }));
    const skirtInner = sdf.revolve(
      profile.polygon([[0, 0.6], [0.131, 0.6], [0.131, 0.3], [0.161, 0.125], [0.161, -0.1], [0, -0.1]], { smooth: false }),
    );
    const front = sdf.halfSpace([0, 0, -1], 0.02);
    const panel = skirtOuter.subtract(skirtInner).scale([1, 1, 0.85]).smoothIntersect(0.01, front);
    const pocketAt = (x: number) => sdf.extrude(profile.rect([0.07, 0.058], 0.012), 0.4).at(x, 0.192, 0.2);
    const flapAt = (x: number) => sdf.extrude(profile.rect([0.076, 0.02], 0.006), 0.4).at(x, 0.219, 0.2);
    const skirtShape = skirtOuter.scale([1, 1, 0.85]);
    const pockets = hard(skirtShape.round(0.005).intersect(pocketAt(0.078)).union(skirtShape.round(0.008).intersect(flapAt(0.078))));
    const belt = torso.round(0.02).smoothIntersect(0.004, sdf.box([0.5, 0.028, 0.5], 0.006).at(0, 0.292, 0));
    const knot = sdf.smoothUnion(
      0.008,
      sdf.sphere(0.015).at(0, 0.29, -0.125),
      pair(sdf.ellipsoid([0.024, 0.012, 0.01]).rotateZ(-20).at(0.024, 0.296, -0.122)),
      pair(sdf.capsule([0.006, 0.285, -0.126], [0.018, 0.225, -0.125], 0.007)),
    );
    const apron = sdf
      .union(panel.bone('hips'), pockets.paint(C.apronDark).bone('hips'), belt.bone('spine'), knot.bone('spine'))
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.28).intersect(sdf.halfSpace([0, 1, 0], 0.306)), C.apronDark, 0.004);
    k.body('apron', apron, { color: C.apron, roughness: 0.65 });

    // ------------------------------------------------------------------ trousers and boots
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.13, 0.07, 0.1]).at(0, 0.21, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.097, 0.1, 0.004], 0.05).bone('leg.L')),
    );
    k.body('trousers', legs, { color: C.trousers, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.052, 0.085, 0.02).at(0, 0.052, 0), sdf.ellipsoid([0.062, 0.054, 0.106]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = bootFoot
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the coin pouch, hanging from the right fist by its drawstrings
    const K = (dx: number, dy: number, dz: number): V3 => [KNOT[0] + dx, KNOT[1] + dy, KNOT[2] + dz];
    const bag = sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([0.05, 0.056, 0.047]).at(...K(0, -0.1, 0)),
      sdf.cone(K(0, -0.045, 0), K(0, -0.08, 0), 0.016, 0.038),
    );
    const frill = sdf.smoothUnion(0.006, sdf.ellipsoid([0.02, 0.012, 0.019]).at(...K(0, -0.04, 0)), sdf.torus(0.016, 0.006).at(...K(0, -0.044, 0)));
    const cords = sdf.union(
      sdf.capsule(K(0.004, 0.03, 0), K(0.005, -0.036, 0.002), 0.0035),
      sdf.capsule(K(-0.004, 0.03, 0), K(-0.006, -0.036, -0.002), 0.0035),
      sdf.capsule(K(-0.004, -0.004, 0.006), K(-0.034, -0.068, 0.018), 0.003),
      sdf.capsule(K(-0.002, -0.004, 0.008), K(-0.018, -0.084, 0.032), 0.003),
    );
    const beads = sdf.union(sdf.sphere(0.0095).at(...K(-0.035, -0.074, 0.018)), sdf.sphere(0.0095).at(...K(-0.019, -0.09, 0.033)));
    const pouch = sdf
      .union(bag.smoothUnion(0.006, frill), cords.paint(C.cord), beads.paint(C.brass))
      .paintWhere(sdf.sphere(0.03).at(...K(0, -0.04, 0)), C.pouchDark, 0.015);
    k.body('pouch', pouch, { color: C.pouch, roughness: 0.6, detail: 0.003, bone: 'hand.R' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, reach, orient } = motion;
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // A slow, contented look around the market.
        head: { rotate: [1.5 * wave(p, 3), 7 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [1 * wave(p, 1, 0.1), 0, -1 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        'hand.R': { rotate: [3 * wave(p, 1, 0.3), 0, 0] }, // the pouch sways a little
      }),
    });

    // An easy market walk. The legs come from motion.gait: planted stance feet, a knee lift in the
    // swing, heel strike and toe-off. `step` is the foot travel, `lift` the swing height, `duty` the
    // share of the cycle a foot is down, `hop` the hips bob. The gait phase runs a quarter cycle behind
    // the clip, so the left heel strikes at p = 0.25, when the left arm is back. The sole points are the
    // boot's heel and toe on the floor (turned 12 degrees out). The pouch arm swings little.
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
          heel: [0.092, 0, -0.025],
          toe: [0.113, 0, 0.086],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.3 * s, 0, -4] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'hand.R': { rotate: [armSwing * 0.3 * s, 0, 0] as const }, // the pouch swings on its strings
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 26, 3));
    k.animation('run', stride(0.58, 0.14, 0.04, 0.42, 0.025, 44, 10));

    // Work: weighing the coin pouch, a 2.4 s loop. The right hand lifts the pouch up in front of his
    // right hip and hefts it three times (the coins jingle); the left hand comes up in front of the
    // chest and ticks off a count with each heft; he looks down at the pouch through his spectacles,
    // then nods twice, pleased, and lowers the pouch.
    //   0.00-0.20 lift   0.22-0.70 three hefts   0.68-0.90 two nods   0.80-0.98 lower.
    // The wrist targets are in the chest's rest frame; the right hand keeps the pouch hanging down.
    const HELD_R: V3 = [-0.19, 0.35, 0.14];
    const TALLY_L: V3 = [0.14, 0.33, 0.13];
    const POLE_R: V3 = [-0.5, 0.35, -0.1];
    const POLE_L: V3 = [0.5, 0.3, -0.1];
    k.animation('work', {
      duration: 2.4,
      pose: (_t, p) => {
        const up = ease(0.02, 0.2, p) * (1 - ease(0.8, 0.98, p));
        const q = (p - 0.22) / 0.48;
        const heft = q > 0 && q < 1 ? Math.abs(Math.sin(3 * Math.PI * q)) : 0;
        const tick = q > 0.05 && q < 1.05 ? Math.abs(Math.sin(3 * Math.PI * (q - 0.05))) : 0;
        const look = ease(0.08, 0.28, p) * (1 - ease(0.66, 0.78, p));
        const nodQ = (p - 0.68) / 0.22;
        const nod = nodQ > 0 && nodQ < 1 ? Math.sin(nodQ * Math.PI * 2) ** 2 : 0;
        const wristR = lerp(WRIST_R, HELD_R, up);
        const armR = reach(ARM_R, [wristR[0], wristR[1] + 0.04 * heft, wristR[2]], POLE_R);
        const handR = orient([armR.upper, armR.lower], { dir: [0, -1, 0], up: [0, 0, 1] }, { dir: [0.12 * heft, -1, 0], up: [0, 0, 1] });
        const wristL = lerp(WRIST_L, TALLY_L, up);
        const armL = reach(ARM_L, [wristL[0], wristL[1] + 0.012 * tick * up, wristL[2]], POLE_L);
        return {
          hips: { move: [0, -0.004 * up, 0] },
          spine: { rotate: [3 * up, -4 * look, 0] },
          chest: { rotate: [2 * up, -6 * look, 0] },
          neck: { rotate: [4 * look, 0, 0] },
          head: { rotate: [8 * look + 9 * nod, -14 * look, -4 * look + 3 * nod] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: [(-30 - 12 * tick) * up, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ villager clips: talk and wave
    // The free left arm is posed by wrist targets (chest rest frame). His arms are short and his head
    // is wide, so the hand stays in front of the chest or out beside the cheek, under the beret.

    // Talk: a friendly sales pitch to a customer in front. He nods and turns his head, and the left
    // hand makes two palm-up offers in front of the chest; the pouch hangs at his side.
    k.animation('talk', {
      duration: 2.2,
      pose: (_t, p) => {
        const beat = bump(p, 2, 0.1);
        const sweep = wave(p, 1, 0.1);
        const wrist: V3 = [0.13 + 0.04 * sweep, 0.315 + 0.035 * beat, 0.14 + 0.01 * wave(p, 2)];
        const arm = reach(ARM_L, wrist, [0.35, 0.2, -0.12]);
        return {
          hips: { move: [0, -0.002 * bump(p, 2), 0] },
          spine: { rotate: [1.5, 0, 1.5 + 0.7 * wave(p, 1, 0.3)] },
          chest: { rotate: [1.2 * beat, 0, 0] },
          neck: { rotate: [-1.5, 0, 0] },
          head: { rotate: [4 * bump(p, 2, 0.2) - 1.5, 8 * wave(p, 1, 0.35), -2.5 - 1.5 * bump(p, 1, 0.1)] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: [-8 - 8 * beat, 14 * sweep, 0] },
          'hand.R': { rotate: [3 * wave(p, 1, 0.2), 0, 0] },
        };
      },
    });

    // Wave: a greeting. The left hand comes up out to the side, beside the cheek and under the beret,
    // waves two and a half times, and comes down. The right arm and the pouch stay at his side.
    const RAISED: V3 = [0.245, 0.46, 0.09];
    const POLE_REST: V3 = [0.43, 0.535, 0];
    const POLE_UP: V3 = [0.45, 0.22, -0.1];
    k.animation('wave', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const up = ease(0.02, 0.24, p) * (1 - ease(0.8, 1, p));
        const waving = ease(0.18, 0.28, p) * (1 - ease(0.72, 0.82, p));
        const side = waving * Math.sin(((p - 0.2) / 0.6) * Math.PI * 5);
        const bulge = Math.sin(Math.PI * up);
        const wrist: V3 = [
          WRIST_L[0] + (RAISED[0] - WRIST_L[0]) * up + 0.05 * bulge + 0.022 * side,
          WRIST_L[1] + (RAISED[1] - WRIST_L[1]) * up - 0.02 * bulge - 0.006 * Math.abs(side),
          WRIST_L[2] + (RAISED[2] - WRIST_L[2]) * up + 0.02 * bulge,
        ];
        const arm = reach(ARM_L, wrist, lerp(POLE_REST, POLE_UP, up));
        return {
          chest: { rotate: [0, 0, 0] },
          neck: { rotate: [-2 * up, 0, 0] },
          head: { rotate: [-3 * up + 3 * bump(p, 1), 6 * up, -5 * up] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: [-10 * up, 0, 28 * side] },
        };
      },
    });
  },
});
