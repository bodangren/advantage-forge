import { defineAsset, motion, profile, rgb, sdf } from '../src/index.js';

/**
 * Quest giver — Chibi Quest settlement NPC (catalog `npcs/settlement/quest-giver`), about 1.0 m to
 * the point of his hood, faces +Z. Target: docs/npc-mockups/quest-giver_001.jpg (made with mmx; one
 * front view). Built on the farmer (the rogue's head and skeleton, the adventurer's face).
 *
 * Role: the village elder who gives quests to the heroes, seen in 3D and as a 128 px sprite; the
 *   hood, the white beard, the staff, and the sealed scroll must read.
 * One idea: a kindly old man in a deep blue hood, a big white beard and bushy brows, leaning on a
 *   twisted staff and holding out a scroll with a red wax seal.
 * Proportions: the farmer's (head center 0.675, eyes 0.628, shoulders 0.385, waist 0.26); the hood
 *   point at 1.0; the beard tip at 0.39; the coat hem at 0.14; the staff from the ground to 0.61.
 * Shape language: round and soft (hood, beard, nose, boots), with the long line of the staff and
 *   the upright cylinder of the scroll.
 * Palette (60/30/10): faded indigo #5a8fb0 (hood and coat); white beard #ece6da and tan trim
 *   #d6b878; plum tunic, khaki trousers, brown staff, belt, and boots; a red wax seal #a8322c.
 * Value plan: the light face and white beard in the dark hood opening are the focal point; the blue
 *   coat is the big mass; the parchment and its red seal are the accent.
 * Bodies: skin, hair (cap, brows, beard, mustache), hood, coat, tunic, belt, rope, trousers, boots,
 *   staff, scroll, seal.
 * Rig: the farmer's skeleton; the staff is rigid on `hand.R`, the scroll and the seal on `hand.L`.
 *   Clips: idle, walk, run, give (the scroll handed out toward the viewer), talk, wave.
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
  mouth: '#a8403a',
  hair: '#ece6da',
  hairShade: '#c6beb0',
  cloth: '#5a8fb0',
  clothInside: '#2c465a',
  trim: '#d6b878',
  tunic: '#5e4552',
  belt: '#6a4228',
  rope: '#d4b47a',
  trousers: '#b8966a',
  boot: '#5e3a24',
  sole: '#3a2418',
  wood: '#6e4428',
  woodDark: '#4a2c18',
  parchment: '#ecdcb0',
  parchmentDark: '#c4a878',
  seal: '#a8322c',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const unit = (a: V3): V3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const DEG = Math.PI / 180;

// Joints: the right hand holds the staff at his side; the left forearm points forward and the fist
// holds the scroll upright in front of the hip.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.18, 0.31, -0.005];
const WRIST_L: V3 = [0.205, 0.29, 0.072];
const ELBOW_R: V3 = [-0.19, 0.33, 0.03];
const WRIST_R: V3 = [-0.215, 0.27, 0.08];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const GRIP: V3 = [WRIST_R[0] - 0.012, WRIST_R[1] - 0.038, WRIST_R[2] + 0.014];
// The scroll's axis passes through the left fist, in front of and inside the wrist.
const SCROLL_R = 0.028;
const GRIP_L: V3 = [WRIST_L[0] - 0.018, WRIST_L[1] - 0.006, WRIST_L[2] + 0.045];

/** A fist wrapped around a vertical haft at `g`: the fingers curl around the front. */
const gripFist = (g: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.036, 0.044, 0.036]).at(g[0] - 0.012, g[1], g[2] - 0.004),
    sdf.capsule([g[0] - 0.02, g[1] - 0.02, g[2] + 0.022], [g[0] + 0.018, g[1] - 0.02, g[2] + 0.022], 0.016),
    sdf.capsule([g[0] - 0.02, g[1] + 0.006, g[2] + 0.024], [g[0] + 0.018, g[1] + 0.006, g[2] + 0.024], 0.016),
    sdf.cone([g[0] - 0.026, g[1] + 0.02, g[2] + 0.01], [g[0] + 0.012, g[1] + 0.03, g[2] + 0.02], 0.014, 0.011), // thumb on top
  );
/** The left fist around the scroll (axis through `g`): the back of the hand outside, the fingers around the front. */
const scrollFist = (g: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.032, 0.044, 0.04]).at(g[0] + 0.03, g[1], g[2] - 0.02),
    sdf.capsule([g[0] + 0.034, g[1] - 0.018, g[2] + 0.014], [g[0] - 0.012, g[1] - 0.018, g[2] + 0.033], 0.016),
    sdf.capsule([g[0] + 0.034, g[1] + 0.009, g[2] + 0.016], [g[0] - 0.012, g[1] + 0.009, g[2] + 0.035], 0.016),
    sdf.cone([g[0] + 0.012, g[1] + 0.018, g[2] - 0.032], [g[0] - 0.022, g[1] + 0.03, g[2] - 0.012], 0.014, 0.011), // thumb behind
  );

export default defineAsset({
  name: 'quest-giver',
  description: 'Chibi quest giver NPC: a village elder in a deep blue hood and trimmed coat, with a big white beard, a twisted staff, and a sealed scroll.',
  detail: 0.005,
  reference: 'docs/npc-mockups/quest-giver_001.jpg',
  // Color slots for individual elders (the first option is the default look). The clothing slot is
  // the hood and the coat; the tan trim, the plum tunic, the trousers, and the props keep their colors.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { white: C.hair, grey: '#a39e96', ash: '#7c7064' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    // Plain village dyes in the faded family of the default blue.
    clothing: { indigo: C.cloth, moss: '#6f8452', rust: '#a0603e', oatmeal: '#b3a78c' },
  },
  presets: {
    hermit: { eyes: 'green', hair: 'grey', skin: 'tan', clothing: 'moss' },
    reeve: { eyes: 'brown', hair: 'ash', skin: 'brown', clothing: 'rust' },
    scribe: { eyes: 'blue', hair: 'white', skin: 'fair', clothing: 'oatmeal' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairShade: k.tint('hair', { color: C.hairShade, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      nose: k.tint('skin', { color: '#f0a090', follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      clothInside: k.tint('clothing', { color: C.clothInside, follow: 1 }),
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
    // A big round nose between the lower halves of the eyes.
    const nose = sdf.ellipsoid([0.044, 0.038, 0.034]).at(0, 0.585, faceZ(0, 0.585) - 0.002).bone('head');
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
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      scrollFist(GRIP_L).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      gripFist(GRIP).bone('hand.R'),
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
    const MOUTH_Y = 0.522;
    const mouth = sdf.ellipsoid([0.022, 0.012, 0.08]).at(0, MOUTH_Y, faceZ(0, MOUTH_Y));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(pair(at(sdf.sphere(0.04), 0.14, 0.57)), T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(mouth, T.mouth, 0.004)
      .paintWhere(sdf.sphere(0.03).at(0, 0.592, faceZ(0, 0.588) + 0.03), T.nose, 0.02); // a rosy nose tip
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hood (the rogue's, without the seam)
    const hoodOuter = sdf.smoothUnion(
      0.07,
      sdf.ellipsoid([0.285, 0.275, 0.272]).at(0, 0.685, -0.025),
      sdf.cone([0, 0.9, -0.05], [0, 0.99, -0.085], 0.12, 0.022), // the soft point on top
    );
    const cavity = sdf.ellipsoid([0.247, 0.235, 0.235]).at(0, 0.68, -0.015);
    const opening = sdf.ellipsoid([0.25, 0.23, 0.42]).at(0, 0.68, 0.3);
    // A thick rolled rim around the face opening, in the tan trim.
    const rim = hoodOuter.round(0.018).subtract(cavity.round(-0.004)).intersect(opening.round(0.04)).subtract(opening);
    const hood = sdf
      .smoothUnion(0.012, hoodOuter.subtract(cavity).smoothSubtract(0.02, opening), rim.paint(C.trim))
      .intersect(sdf.halfSpace([0, -1, 0], -0.43))
      .paintWhere(cavity.round(0.006), T.clothInside, 0.012);
    k.body('hood', hood, { color: T.cloth, roughness: 0.85, bone: 'head' });

    // ------------------------------------------------------------------ hair: a cap inside the hood, bushy brows, the beard
    const insideHood = cavity.round(-0.003);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, sdf.ellipsoid([0.25, 0.25, 0.23]).at(0, 0.7, 0.14))
      .intersect(insideHood);
    const brow = (s: 1 | -1) => {
      const pt = (x: number, y: number, lift: number, r: number): [number, number, number, number] => [s * x, y, faceZ(x, y) + lift, r];
      return sdf.chain([pt(0.035, 0.702, 0.004, 0.019), pt(0.09, 0.72, 0.008, 0.026), pt(0.145, 0.712, 0.004, 0.022), pt(0.182, 0.69, -0.004, 0.012)], 0.012);
    };
    // A full beard from the sideburns over the jaw, down to a soft point on the chest; open at the mouth.
    const mouthZ = faceZ(0, MOUTH_Y);
    const beardMass = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([0.168, 0.1, 0.11]).at(0, 0.52, 0.07),
        sdf.ellipsoid([0.125, 0.08, 0.085]).at(0, 0.46, 0.105),
        sdf.cone([0, 0.45, 0.125], [0, 0.37, 0.135], 0.075, 0.014), // the point
        pair(sdf.capsule([0.19, 0.66, 0.0], [0.165, 0.52, 0.06], 0.045)),
      )
      .smoothSubtract(0.03, sdf.ellipsoid([0.16, 0.075, 0.2]).at(0, 0.628, 0.12)) // keep the cheeks and eyes clear
      .smoothSubtract(0.01, sdf.ellipsoid([0.032, 0.02, 0.1]).at(0, MOUTH_Y - 0.002, mouthZ + 0.055)); // the mouth
    // A big mustache under the nose, sweeping out and curling up at the ends.
    const must = (x: number, y: number, lift: number, r: number): [number, number, number, number] => [x, y, faceZ(x, y) + lift, r];
    const mustache = pair(
      sdf.chain([must(0, 0.552, 0.022, 0.022), must(0.05, 0.55, 0.02, 0.027), must(0.105, 0.54, 0.012, 0.023), must(0.15, 0.546, 0.006, 0.016), must(0.175, 0.566, 0.004, 0.009)], 0.014),
    );
    const strands = (x: number, y: number, z: number) => Math.sin(x * 80 + Math.sin(y * 25) * 2) * 0.6 + Math.sin(Math.atan2(z, x) * 30 + y * 40) * 0.4;
    const beard = sdf.smoothUnion(0.02, beardMass, mustache).displace(0.004, strands);
    const hair = sdf
      .smoothUnion(0.015, cap, brow(1), brow(-1), beard)
      .paintFn((x, y, z, base) => (y < 0.56 && strands(x, y, z) < -0.75 ? rgb(T.hairShade) : base));
    k.body('hair', hair.bone('head'), { color: T.hair, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ tunic (plum), belt, and rope knot
    const bands = (s: sdf.Shape) =>
      sdf.union(
        s.intersect(sdf.halfSpace([0, -1, 0], -0.33)).bone('chest'),
        s.intersect(sdf.halfSpace([0, 1, 0], 0.33)).intersect(sdf.halfSpace([0, -1, 0], -0.25)).bone('spine'),
        s.intersect(sdf.halfSpace([0, 1, 0], 0.25)).bone('hips'),
      );
    const tunicSolid = sdf
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
            [0.142, 0.21],
            [0.152, 0.17],
            [0.154, 0.165],
            [0.148, 0.158],
            [0, 0.148],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    k.body('tunic', bands(tunicSolid), { color: C.tunic, roughness: 0.85 });
    const BELT_Y = 0.262;
    // Only the front of the belt: it shows in the coat opening, and it never pokes through the coat at the sides.
    const belt = tunicSolid
      .round(0.007)
      .smoothIntersect(0.004, sdf.box([0.5, 0.028, 0.5], 0.004).at(0, BELT_Y, 0))
      .intersect(sdf.halfSpace([0, 0, -1], -0.05));
    k.body('belt', belt.bone('spine'), { color: C.belt, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, BELT_Y, 1], [0, 0, -1])![2];
    // A figure-eight knot of rope on the belt buckle, with two short ends hanging down.
    const knot = sdf.union(
      pair(sdf.torus(0.026, 0.0075).rotateX(90).rotateZ(12).at(0.03, BELT_Y, beltZ + 0.005)),
      sdf.sphere(0.014).at(0, BELT_Y, beltZ + 0.009),
      sdf.capsule([0.004, BELT_Y - 0.008, beltZ + 0.008], [0.016, BELT_Y - 0.06, beltZ + 0.012], 0.006),
      sdf.capsule([-0.004, BELT_Y - 0.008, beltZ + 0.008], [-0.012, BELT_Y - 0.052, beltZ + 0.014], 0.006),
    );
    k.body('rope', knot.bone('spine'), { color: C.rope, roughness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ coat: open in front, tan trim, a cowl, wide sleeves
    const coatSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.48],
            [0.08, 0.475],
            [0.118, 0.448],
            [0.138, 0.4],
            [0.143, 0.34],
            [0.146, 0.29],
            [0.152, 0.25],
            [0.158, 0.2],
            [0.17, 0.172],
            [0.174, 0.158],
            [0.168, 0.148],
            [0, 0.148],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    // The front opening: narrow under the beard, wider to the hem.
    const opening2 = sdf
      .extrude(
        profile.polygon(
          [
            [-0.03, 0.52],
            [0.03, 0.52],
            [0.078, 0.12],
            [-0.078, 0.12],
          ],
          { smooth: false },
        ),
        0.4,
      )
      .at(0, 0, 0.2);
    // A cowl where the hood drapes onto the shoulders.
    const cowl = sdf.ellipsoid([0.15, 0.05, 0.13]).at(0, 0.44, -0.02);
    const coatCut = sdf.smoothUnion(0.03, coatSolid, cowl).subtract(opening2);
    const trimEdge = coatCut.round(0.004).intersect(opening2.round(0.016));
    const trimHem = coatCut.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.17));
    const coat = sdf.union(coatCut, trimEdge.paint(C.trim), trimHem.paint(C.trim));
    const sleeve = (s: V3, e: V3, w: V3, up: string, low: string) =>
      sdf.union(
        sdf.cone([s[0] * 0.88, 0.402, s[2]], e, 0.056, 0.048).bone(up),
        sdf.smoothUnion(0.01, sdf.cone(e, lerp(e, w, 0.55), 0.047, 0.056), sdf.cone(lerp(e, w, 0.48), lerp(e, w, 0.66), 0.058, 0.061).round(0.003).paint(C.trim)).bone(low),
      );
    const sleeves = sdf.union(sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'));
    k.body('coat', sdf.union(bands(coat), sleeves), { color: T.cloth, roughness: 0.85 });

    // ------------------------------------------------------------------ trousers and boots
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.12, 0.06, 0.09]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.smoothUnion(0.01, sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.115, 0.004], 0.054), sdf.cylinder(0.058, 0.03, 0.012).at(0.096, 0.108, 0.004)).bone('leg.L')),
    );
    k.body('trousers', legs, { color: C.trousers, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.052, 0.085, 0.02).at(0, 0.052, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = bootFoot
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the staff: twisted wood with a knobbed, hollow top
    // Local frame: the grip at the origin, the staff along +Y.
    const TOP = 0.37;
    const twist = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 2 - y * 55);
    const staff = sdf
      .smoothUnion(
        0.02,
        sdf.cone([0, -0.2, 0], [0, TOP - 0.04, 0], 0.016, 0.02),
        sdf.cone([0, TOP - 0.06, 0], [0, TOP + 0.03, 0], 0.021, 0.03),
        sdf.sphere(0.02).at(0.012, 0.12, 0.004),
        sdf.sphere(0.018).at(-0.01, -0.08, 0.004),
      )
      .smoothSubtract(0.008, sdf.sphere(0.02).at(0, TOP + 0.045, 0))
      .displace(0.004, twist)
      .paintFn((x, y, z, base) => (twist(x, y, z) < -0.55 ? rgb(C.woodDark) : base));
    // The staff leans forward and out to his right, so its top keeps clear of the hood.
    const staffPose = (s: sdf.Shape) => s.rotateX(6).rotateZ(15).at(...GRIP);
    k.body('staff', staffPose(staff), { color: C.wood, roughness: 0.75, detail: 0.004, bone: 'hand.R' });

    // ------------------------------------------------------------------ the scroll and its wax seal
    // Local frame: the scroll's axis along +Y through the left fist, the seal on the front (+Z).
    const SCROLL_LO = -0.08;
    const SCROLL_HI = 0.14;
    const scroll = sdf
      .cylinder(SCROLL_R, SCROLL_HI - SCROLL_LO, 0.006)
      .at(0, (SCROLL_HI + SCROLL_LO) / 2, 0)
      .smoothSubtract(0.003, sdf.cylinder(0.016, 0.03, 0.004).at(0, SCROLL_HI, 0))
      .paintWhere(sdf.cylinder(0.019, 0.05, 0).at(0, SCROLL_HI, 0), C.parchmentDark, 0.004)
      // The paper's last turn: a thin darker line up the side.
      .paintWhere(sdf.box([0.004, 0.4, 0.04]).at(-0.018, 0, 0.02), C.parchmentDark, 0.002);
    const seal = sdf
      .ellipsoid([0.02, 0.019, 0.008])
      .displace(0.002, (x, y) => Math.sin(Math.atan2(y, x) * 7))
      .at(0.004, 0.065, SCROLL_R + 0.002);
    const scrollPose = (s: sdf.Shape) => s.at(...GRIP_L);
    k.body('scroll', scrollPose(scroll), { color: C.parchment, roughness: 0.8, detail: 0.004, bone: 'hand.L' });
    k.body('seal', scrollPose(seal), { color: C.seal, roughness: 0.45, detail: 0.003, bone: 'hand.L' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, reach, orient } = motion;
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    // The scroll's rest frame: the axis up, the seal to the front.
    const SCROLL_REST = { dir: [0, 1, 0] as V3, up: [0, 0, 1] as V3 };
    // A pole that keeps the rest elbow (out, down, and back), and poles for the raised arm.
    const POLE_REST: V3 = [0.24, 0.17, -0.21];
    const POLE_OUT: V3 = [0.45, 0.12, -0.08];

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // A slow, kindly look around.
        head: { rotate: [1.5 * wave(p, 3), 7 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [1 * wave(p, 1, 0.1), 0, -1 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
        'hand.L': { rotate: [4 * bump(p) - 2 * wave(p, 1, 0.1), 0, 0] },
      }),
    });

    // An easy old man's walk. The legs come from motion.gait: planted stance feet, a knee lift in the
    // swing, heel strike and toe-off. The gait phase runs a quarter cycle behind the clip, so the left
    // heel strikes at p = 0.25, when the left arm is back. The staff arm swings little; the scroll arm
    // swings a little and the hand keeps the scroll upright. `staffOut` tilts the staff's top out to
    // his right (degrees at the wrist) for more room from the hood in the run.
    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, armSwing: number, lean: number, staffOut = 0) => ({
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
        const upperL = armSwing * (s > 0 ? 0.6 : 0.3) * s; // a small swing forward keeps the scroll off the beard
        const lowerL = -armSwing * 0.15 * (1 + Math.max(0, -s));
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [upperL, 0, 6] as const },
          'forearm.L': { rotate: [lowerL, 0, 0] as const },
          'hand.L': { rotate: [-(upperL + lowerL) - lean * 1.5, 0, -lean] as const }, // the scroll's top tips out in the run
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, -4] as const },
          'hand.R': { rotate: [armSwing * 0.2 * s, 0, staffOut] as const },
        };
      },
    });
    k.animation('walk', stride(1.0, 0.09, 0.022, 0.62, 0.005, 22, 4));
    k.animation('run', stride(0.62, 0.13, 0.036, 0.42, 0.022, 38, 10, 5));

    // Give: the hand-over of a quest. The scroll comes up and out toward the viewer, the top tipped
    // forward so the seal shows; he holds it out with a small nod ("take this"), then draws it back.
    // The left shoulder turns forward. The wrist target lives in the chest's rest frame.
    //   0.04-0.34 raise and reach out   0.34-0.70 hold it out, a nod and a small push
    //   0.70-0.96 draw it back to the rest pose.
    const GIVE_WRIST: V3 = [0.15, 0.37, 0.15];
    k.animation('give', {
      duration: 2.6,
      loop: false,
      pose: (_t, p) => {
        const out = ease(0.04, 0.34, p) * (1 - ease(0.7, 0.96, p));
        const hold = ease(0.3, 0.42, p) * (1 - ease(0.6, 0.72, p));
        const nod = Math.sin(Math.PI * Math.min(1, Math.max(0, (p - 0.38) / 0.26)));
        const arc = Math.sin(Math.PI * out);
        const wrist = add(lerp(WRIST_L, GIVE_WRIST, out), [0, 0.025 * arc, 0.012 * hold * nod]);
        const arm = reach(ARM_L, wrist, lerp(POLE_REST, POLE_OUT, out));
        const tilt = (44 + 6 * hold * nod) * out * DEG;
        const dir: V3 = [0, Math.cos(tilt), Math.sin(tilt)];
        const up: V3 = [0, -Math.sin(tilt), Math.cos(tilt)];
        const hand = orient([arm.upper, arm.lower], SCROLL_REST, { dir, up });
        return {
          hips: { move: [0, -0.004 * out, 0] },
          spine: { rotate: [3 * out, 0, 0] },
          chest: { rotate: [3 * out, -8 * out, 0] },
          neck: { rotate: [-2 * out, 0, 0] },
          head: { rotate: [-3 * out + 7 * nod * hold, 8 * out, 3 * out] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          'upperarm.R': { rotate: [-2 * out, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ villager clips: talk and wave
    // The scroll arm is posed by wrist targets (chest rest frame); the hand keeps the scroll clear of
    // the beard: upright or tipped out to his left.

    // Talk: a friendly chat with someone in front. He leans a little on the staff (to his right),
    // nods and turns his head, and the scroll hand makes two small points in front of the hip.
    k.animation('talk', {
      duration: 2.2,
      pose: (_t, p) => {
        const beat = bump(p, 2, 0.1);
        const sweep = wave(p, 1, 0.1);
        const wrist: V3 = [0.2 + 0.025 * sweep, 0.325 + 0.03 * beat, 0.125 + 0.01 * wave(p, 2)];
        const arm = reach(ARM_L, wrist, [0.4, 0.15, -0.15]);
        const dir = unit([0.28 + 0.1 * sweep, 0.9, 0.25 + 0.15 * beat]);
        const hand = orient([arm.upper, arm.lower], SCROLL_REST, { dir, up: [0, 0, 1] });
        return {
          hips: { move: [0, -0.002 * bump(p, 2), 0] },
          spine: { rotate: [1.5, 0, 2.5 + 0.7 * wave(p, 1, 0.3)] },
          chest: { rotate: [1.2 * beat, 0, 0] },
          neck: { rotate: [-1.5, 0, 0] },
          head: { rotate: [4 * bump(p, 2, 0.2) - 1.5, 8 * wave(p, 1, 0.35), -2.5 - 1.5 * bump(p, 1, 0.1)] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
        };
      },
    });

    // Wave: a greeting with the scroll hand. The hand comes up out to the side, below the hood, the
    // scroll tipped out to his left; it waves two and a half times and comes down. The staff stays.
    const RAISED: V3 = [0.255, 0.425, 0.1];
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
          WRIST_L[0] + (RAISED[0] - WRIST_L[0]) * up + 0.04 * bulge + 0.02 * side,
          WRIST_L[1] + (RAISED[1] - WRIST_L[1]) * up - 0.01 * bulge - 0.006 * Math.abs(side),
          WRIST_L[2] + (RAISED[2] - WRIST_L[2]) * up + 0.01 * bulge,
        ];
        const arm = reach(ARM_L, wrist, lerp(POLE_REST, POLE_UP, up));
        const a = (42 * up + 12 * side) * DEG;
        const hand = orient([arm.upper, arm.lower], SCROLL_REST, { dir: [Math.sin(a), Math.cos(a), 0.08 * up], up: [0, 0, 1] });
        return {
          neck: { rotate: [-2 * up, 0, 0] },
          head: { rotate: [-3 * up + 3 * bump(p, 1), 6 * up, -4 * up] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
        };
      },
    });
  },
});
