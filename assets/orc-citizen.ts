import { defineAsset, motion, profile, rgb, sdf } from '../src/index.js';

/**
 * Orc citizen — Chibi Quest NPC (catalog `npcs/fantasy-peoples/orc-citizen`), about 1.1 m to the
 * top of the topknot, faces +Z, stands on y = 0. Target: docs/npc-mockups/orc-citizen_001.jpg.
 *
 * Role: a big, gentle orc farmer of the farm town who grows giant vegetables and gives farm
 *   errands; seen at the farm and the market in 3D and as a 128 px sprite. The straw hat with
 *   its topknot, the big smile, and the basket of giant vegetables read first.
 * One idea: a gentle green giant in overalls waving hello with a basket of huge vegetables.
 * Shape language: round and soft (a kind farmer), on the orc warrior's stocky body; the tusks
 *   shrink to small round nubs.
 * Palette (60/30/10): green skin #6a7a2a; denim overalls #3a5a8a with gold buttons #c8a040; a
 *   red checked shirt #b03a30 / #f0e6cc; straw hat #d8b860 with a red band; brown boots #6b4226;
 *   a basket #a8784a; carrots #e07a2a, a cabbage, and a pumpkin #e0902a as the accent.
 * Bodies: skin, hair (cap and locks), hat, hatband, shirt, overalls, buttons, boots, tusks, basket,
 *   carrots, cabbage, pumpkin.
 * Rig: the orc warrior's skeleton and clip names. The left arm is built raised in a wave, the
 *   basket is rigid on `hand.R`, the hat on `head`.
 */

const C = {
  skin: '#6a7a2a',
  skinDark: '#4a5a1c',
  eye: '#6e4020',
  pupil: '#141010',
  mouth: '#2a1a14',
  teeth: '#f4efe0',
  hair: '#231a17',
  tusk: '#f1e6c8',
  straw: '#d8b860',
  band: '#b03a30',
  denim: '#3a5a8a',
  cuff: '#7f8fa3',
  thread: '#d9b86a',
  shirt: '#b03a30',
  check: '#f0e6cc',
  boot: '#6b4226',
  sole: '#3a2412',
  gold: '#c8a040',
  basket: '#a8784a',
  basketDark: '#7a5230',
  carrot: '#e07a2a',
  carrotTop: '#3f6a30',
  cabbage: '#74a03c',
  pumpkin: '#e0902a',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints. The right arm hangs (it carries the basket); the left arm is raised in a wave.
const SHOULDER: V3 = [0.22, 0.52, 0];
const ELBOW: V3 = [0.31, 0.4, 0.02];
const WRIST: V3 = [0.345, 0.3, 0.05];
const L_ELBOW: V3 = [0.335, 0.465, 0.03];
const L_WRIST: V3 = [0.375, 0.57, 0.06];
const HIP: V3 = [0.1, 0.25, 0];
const ANKLE: V3 = [0.155, 0.075, 0];
const KNEE: V3 = [0.1275, 0.1625, 0];
const SOLE_HEEL: V3 = [0.155, 0, -0.022];
const SOLE_TOE: V3 = [0.169, 0, 0.09];
const HEAD_Y = 0.72;
const KNOT: V3 = [0, 0.962, -0.01];
const BASKET: V3 = [-0.4, 0, 0.056]; // the axis of the basket (x, -, z)
const BASKET_RIM = 0.2;

/** A big fist at the wrist `w`; `s` mirrors it for the right hand; `up` puts it above the wrist. */
const fistAt = (w: V3, s: 1 | -1, up = false) => {
  const d = up ? -1 : 1;
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy * d, w[2] + dz];
  return sdf.smoothUnion(
    0.022,
    sdf.ellipsoid([0.066, 0.068, 0.07]).at(...o(0.006, -0.06, 0.006)),
    sdf.capsule(o(-0.016, -0.092, 0.05), o(-0.01, -0.058, 0.07), 0.028),
    sdf.cone(o(0.036, -0.036, 0.042), o(0.004, -0.05, 0.08), 0.027, 0.021),
  );
};

export default defineAsset({
  name: 'orc-citizen',
  description:
    'Chibi orc citizen: a big, gentle farmer in a straw hat with a black topknot, blue overalls over a red checked shirt, brown boots, a big smile, one hand waving and the other carrying a basket of giant vegetables.',
  detail: 0.005,
  reference: 'docs/npc-mockups/orc-citizen_001.jpg',
  variants: {
    eyes: { brown: C.eye, yellow: '#f2c230', red: '#d8321e', orange: '#f0861c' },
    hair: { black: C.hair, brown: '#2c1c12', red: '#40140f' },
    skin: { green: C.skin, olive: '#4a5220', grey: '#6e7868' },
    // Farm dyes: indigo denim, charcoal, brown canvas, plum. No bright primary.
    cloth: { denim: C.denim, charcoal: '#4a4a52', canvas: '#7a5a3a', plum: '#5a3a5a' },
  },
  presets: {
    farm: { eyes: 'brown', hair: 'black', skin: 'green', cloth: 'denim' },
    market: { eyes: 'yellow', hair: 'brown', skin: 'olive', cloth: 'canvas' },
  },

  build(k) {
    const T = {
      eye: k.tint('eyes'),
      hair: k.tint('hair'),
      skin: k.tint('skin'),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('cloth'),
      cuff: k.tint('cloth', { color: C.cuff, follow: 1 }),
    };

    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.26, 0] },
      spine: { parent: 'hips', at: [0, 0.34, 0] },
      chest: { parent: 'spine', at: [0, 0.44, 0] },
      neck: { parent: 'chest', at: [0, 0.54, -0.01] },
      head: { parent: 'neck', at: [0, 0.58, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [-0.1, 1.07, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: L_ELBOW },
      'hand.L': { parent: 'forearm.L', at: L_WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head
    const head = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([0.19, 0.2, 0.18]).at(0, HEAD_Y, -0.01),
        sdf.ellipsoid([0.178, 0.09, 0.14]).at(0, 0.58, 0.05), // the wide jaw
        pair(sdf.sphere(0.078).at(0.108, 0.645, 0.078)), // cheeks
        sdf.ellipsoid([0.15, 0.028, 0.05]).at(0, 0.752, 0.125), // a soft brow ridge
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.05, 0.04, 0.042]).at(0, 0.64, faceZ(0, 0.64) - 0.01).bone('head');
    const ears = pair(
      sdf
        .cone([0.15, 0.7, -0.01], [0.245, 0.765, -0.045], 0.05, 0.008)
        .smoothSubtract(0.006, sdf.cone([0.16, 0.705, 0.012], [0.235, 0.76, -0.02], 0.028, 0.004))
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.5, -0.01], [0, 0.62, -0.01], 0.095).bone('neck');

    // ------------------------------------------------------------------ torso, arms, legs
    // The trunk parts, shared by the skin and the clothes (the clothes reuse them without tags).
    const trunkParts: readonly (readonly [sdf.Shape, string])[] = [
      [sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0), 'chest'],
      [sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02), 'spine'],
      [pair(sdf.sphere(0.1).at(0.155, 0.545, -0.02)), 'chest'],
      [pair(sdf.ellipsoid([0.088, 0.062, 0.05]).at(0.076, 0.48, 0.1)), 'chest'],
    ];
    const trunk = sdf.smoothUnion(0.06, ...trunkParts.map(([s, b]) => s.bone(b)));
    const trunkU = sdf.smoothUnion(0.06, ...trunkParts.map(([s]) => s));
    const armPts = (s: 1 | -1) => {
      const sh: V3 = s > 0 ? SHOULDER : mx(SHOULDER);
      const el: V3 = s > 0 ? L_ELBOW : mx(ELBOW);
      const wr: V3 = s > 0 ? L_WRIST : mx(WRIST);
      return { sh, el, wr, side: s > 0 ? 'L' : 'R' };
    };
    const armAt = (s: 1 | -1) => {
      const { sh, el, wr, side } = armPts(s);
      return sdf.smoothUnion(
        0.03,
        sdf.cone(sh, el, 0.09, 0.075).bone(`upperarm.${side}`),
        sdf.ellipsoid([0.07, 0.08, 0.068]).at(...lerp(sh, el, 0.5)).bone(`upperarm.${side}`),
        sdf.cone(el, wr, 0.075, 0.068).bone(`forearm.${side}`),
        fistAt(wr, s, s > 0).bone(`hand.${side}`),
      );
    };
    const legTop: V3 = [HIP[0], 0.26, 0];
    const legBottom: V3 = [ANKLE[0], 0.1, 0.01];
    const legPt = (t: number) => lerp(legTop, legBottom, t);
    const legs = pair(sdf.capsule(legTop, legBottom, 0.078).bone('leg.L'));
    const footLocal = sdf.ellipsoid([0.078, 0.052, 0.11]).at(0, 0.045, 0.035).intersect(sdf.halfSpace([0, -1, 0], 0));
    const feet = pair(footLocal.rotateY(14).at(ANKLE[0], 0, 0).bone('foot.L'));

    // ------------------------------------------------------------------ face paint
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const EYE: V3 = [0.078, 0.705, 0];
    const eyeBall = pair(at(sdf.ellipsoid([0.055, 0.05, 0.07]), EYE[0], EYE[1]));
    const iris = pair(at(sdf.ellipsoid([0.034, 0.037, 0.07]), EYE[0] - 0.004, EYE[1] - 0.002));
    const pupil = pair(at(sdf.ellipsoid([0.019, 0.022, 0.07]), EYE[0] - 0.006, EYE[1] - 0.003));
    const shine = sdf.union(...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.009), x - 0.004, EYE[1] + 0.012)));
    // A big smile: the lower part of a circle, with round corners and one white tooth band.
    const MOUTH_Y = 0.604;
    const SMILE_Y = MOUTH_Y + 0.026;
    const SMILE_R = 0.06;
    const cornerX = SMILE_R * Math.cos((222 * Math.PI) / 180);
    const cornerY = SMILE_Y + SMILE_R * Math.sin((222 * Math.PI) / 180);
    const mouth = sdf.extrude(profile.arc(SMILE_R, 0.026, 222, 318), 0.4).at(0, SMILE_Y, 0.2);
    const teeth = sdf.extrude(profile.arc(SMILE_R, 0.014, 236, 304), 0.4).at(0, SMILE_Y, 0.2);
    const corners = sdf.union(...[cornerX, -cornerX].map((x) => at(sdf.sphere(0.013), x, cornerY)));
    const nostrils = pair(sdf.sphere(0.008).at(0.02, 0.625, faceZ(0, 0.625) + 0.02));
    const skin = sdf
      .smoothUnion(0.04, head, neck)
      .smoothUnion(0.015, nose, ears)
      .smoothUnion(0.05, trunk)
      .union(armAt(1), armAt(-1))
      .smoothUnion(0.03, legs)
      .union(feet)
      .paintWhere(eyeBall, '#f6f2e6', 0.002)
      .paintWhere(iris, T.eye, 0.002)
      .paintWhere(pupil, C.pupil, 0.002)
      .paintWhere(shine, '#ffffff', 0.002)
      .paintWhere(mouth, T.mouth, 0.003)
      .paintWhere(corners, T.mouth, 0.003)
      .paintWhere(teeth, C.teeth, 0.002)
      .paintWhere(nostrils, T.mouth, 0.004);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: a cap, locks, brows, a topknot
    const hairlineY = 0.79;
    const hairRegion = sdf.smoothUnion(
      0.03,
      sdf.halfSpace([0, -1, 0.35], -hairlineY / Math.hypot(1, 0.35)),
      sdf.halfSpace([0, -1, 0.85], -hairlineY / Math.hypot(1, 0.85)),
    );
    const hairCap = head
      .round(0.014)
      .smoothIntersect(0.012, hairRegion)
      .smoothSubtract(0.01, sdf.ellipsoid([0.2, 0.1, 0.2]).at(0, 0.66, 0.1));
    // A lock hangs down the skull at the angle `a` (degrees from the front, + to the left).
    const lock = (a: number, yTop: number, yEnd: number, r: number) => {
      const dx = Math.sin((a * Math.PI) / 180);
      const dz = Math.cos((a * Math.PI) / 180);
      const pts = [0, 1, 2, 3].map((i) => {
        const y = yTop + ((yEnd - yTop) * i) / 3;
        const p = sdf.raycast(head, [dx, y, -0.01 + dz], [-dx, 0, -dz])!;
        return [p[0] + dx * 0.008, y, p[2] + dz * 0.008, r * (1 - 0.35 * (i / 3))] as [number, number, number, number];
      });
      return sdf.chain(pts, 0.01);
    };
    const locks = sdf.union(
      ...[
        [-48, 0.818], [-32, 0.808], [-16, 0.82], [0, 0.812], [16, 0.82], [32, 0.808], [48, 0.818],
        [-64, 0.67], [64, 0.67],
        [-112, 0.68], [112, 0.68], [-135, 0.65], [135, 0.65], [-158, 0.64], [158, 0.64], [180, 0.63],
      ].map(([a, yEnd]) => lock(a!, 0.9, yEnd!, 0.019)),
    );
    const browAt = (x: number, y: number): [number, number, number] => [x, y, faceZ(Math.abs(x), y) - 0.006];
    // Level, gently arched brows: kind, never stern.
    const brows = pair(
      sdf.chain(
        [
          [...browAt(EYE[0] + 0.058, EYE[1] + 0.066), 0.017],
          [...browAt(EYE[0] + 0.004, EYE[1] + 0.078), 0.02],
          [...browAt(EYE[0] - 0.05, EYE[1] + 0.07), 0.016],
        ],
        0.008,
      ),
    );
    // The topknot rises through the crown of the hat and curls over toward the right.
    const topknot = sdf.chain(
      [
        [KNOT[0], 0.94, KNOT[2], 0.04],
        [KNOT[0], 0.99, KNOT[2], 0.036],
        [KNOT[0] - 0.035, 1.05, KNOT[2], 0.03],
        [KNOT[0] - 0.09, 1.085, KNOT[2], 0.022],
        [KNOT[0] - 0.135, 1.07, KNOT[2], 0.011],
      ],
      0.01,
    );
    const hair = sdf.union(hairCap.bone('head'), locks.bone('head'), brows.bone('head'), topknot.bone('knot'));
    k.body('hair', hair, { color: T.hair, roughness: 0.45, detail: 0.005 });

    // ------------------------------------------------------------------ the straw hat
    const hatY = (r: number) => (r <= 0.17 ? 0.955 - 2.2 * r * r : 0.8914 - 0.5 * (r - 0.17));
    const HAT_R = [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.17, 0.21, 0.25, 0.29, 0.33];
    const hatProfile = profile.polygon([
      ...HAT_R.map((r) => [r, hatY(r)] as [number, number]),
      [0.33, hatY(0.33) - 0.012],
      ...[...HAT_R].reverse().map((r) => [r, hatY(r) - 0.014] as [number, number]),
    ]);
    const hat = sdf.revolve(hatProfile).at(0, 0, -0.01);
    const hatAng = (x: number, z: number) => Math.atan2(x, z + 0.01);
    k.body('hat', hat, {
      color: C.straw,
      roughness: 0.9,
      bone: 'head',
      detail: 0.005,
      bump: (x, _y, z) => 0.0016 * (0.5 * Math.sin(hatAng(x, z) * 36) + 0.5 * Math.sin(Math.hypot(x, z + 0.01) * 190)),
    });
    // The red hat band at the foot of the crown, and a small tie where the topknot comes out.
    const bandR = [0.15, 0.16, 0.17, 0.18];
    const hatBand = sdf
      .revolve(
        profile.polygon([
          ...bandR.map((r) => [r, hatY(r) + 0.008] as [number, number]),
          ...[...bandR].reverse().map((r) => [r, hatY(r) - 0.006] as [number, number]),
        ]),
      )
      .at(0, 0, -0.01)
      .union(sdf.torus(0.04, 0.012).at(KNOT[0], 0.96, KNOT[2]));
    k.body('hatband', hatBand, { color: C.band, roughness: 0.7, bone: 'head', detail: 0.005 });

    // ------------------------------------------------------------------ tusks: small and round
    const tuskTop = MOUTH_Y - 0.002;
    const tuskPath = [
      [0.062, tuskTop, 0.012, 0.0],
      [0.064, tuskTop - 0.014, 0.013, 0.006],
      [0.066, tuskTop - 0.026, 0.009, 0.01],
    ].map(([x, y, r, lift]) => [x!, y!, faceZ(x!, y!) + lift!, r!] as [number, number, number, number]);
    const tusks = pair(sdf.chain(tuskPath, 0.01).intersect(sdf.halfSpace([0, 1, 0], tuskTop)));
    k.body('tusks', tusks.bone('head'), { color: C.tusk, roughness: 0.4 });

    // ------------------------------------------------------------------ the red checked shirt
    const shirtTorso = trunkU
      .round(0.006)
      .smoothSubtract(0.01, sdf.capsule([0, 0.45, -0.01], [0, 0.75, -0.01], 0.101))
      .intersect(sdf.box([0.8, 0.32, 0.8]).at(0, 0.585, 0));
    const collar = sdf.torus(0.106, 0.017).at(0, 0.585, -0.01);
    const sleeve = (s: 1 | -1) => {
      const { sh, el, wr, side } = armPts(s);
      const fe = lerp(el, wr, 0.82);
      return sdf.union(
        sdf.cone(sh, el, 0.099, 0.086).bone(`upperarm.${side}`),
        sdf.ellipsoid([0.075, 0.085, 0.073]).at(...lerp(sh, el, 0.5)).bone(`upperarm.${side}`),
        sdf.cone(el, fe, 0.085, 0.08).bone(`forearm.${side}`),
        sdf.cone(lerp(el, wr, 0.7), fe, 0.091, 0.091).round(0.004).bone(`forearm.${side}`), // the rolled cuff
      );
    };
    const red = rgb(C.shirt);
    const cream = rgb(C.check);
    const frac = (v: number) => v - Math.floor(v);
    const shirt = sdf.union(shirtTorso.bone('chest'), collar.bone('chest'), sleeve(1), sleeve(-1)).paintFn((x, y, z) => {
      const h = Math.abs(x) > 0.2 ? frac(Math.abs(x) * 30) < 0.13 : frac(y * 30) < 0.13;
      const arm = Math.abs(x) > 0.2;
      const v = arm ? frac(Math.atan2(y - 0.5, z) * 3.3) < 0.13 : frac(x * 30) < 0.13;
      const t = (h ? 0.55 : 0) + (v ? 0.55 : 0);
      return [red[0] + (cream[0] - red[0]) * t, red[1] + (cream[1] - red[1]) * t, red[2] + (cream[2] - red[2]) * t];
    });
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.88, detail: 0.007 });

    // ------------------------------------------------------------------ blue denim overalls
    const pantsTrunk = trunkU.round(0.014).smoothIntersect(0.008, sdf.box([0.7, 0.26, 0.7]).at(0, 0.32, 0)).intersect(sdf.halfSpace([0, 1, 0], 0.45));
    const bib = trunkU.round(0.016).intersect(sdf.box([0.25, 0.15, 0.5], 0.01).at(0, 0.49, 0.25));
    const strapPts = (x: number) => {
      const top = [0.115, 0.06, 0.0, -0.07, -0.12].map((z) => {
        const p = sdf.raycast(trunkU, [x, 1, z], [0, -1, 0])!;
        return [x, p[1] + 0.003, z, 0.016] as [number, number, number, number];
      });
      const back = [0.5, 0.45].map((y) => {
        const p = sdf.raycast(trunkU, [x, y, -1], [0, 0, 1])!;
        return [x, y, p[2] - 0.003, 0.016] as [number, number, number, number];
      });
      return sdf.chain([[x, 0.55, 0.14, 0.016], ...top, ...back], 0.008);
    };
    const straps = sdf.union(strapPts(0.09), strapPts(-0.09));
    const tubes = pair(sdf.capsule(legPt(0), legPt(0.8), 0.094).bone('leg.L'));
    const cuffs = pair(sdf.cone(legPt(0.76), legPt(0.92), 0.102, 0.102).round(0.004).bone('leg.L').paint(T.cuff));
    const overalls = sdf.union(pantsTrunk.bone('spine'), bib.bone('chest'), straps.bone('chest'), tubes, cuffs);
    k.body('overalls', overalls, {
      color: T.cloth,
      roughness: 0.9,
      bump: (x, y, z) => 0.0007 * Math.sin(x * 420 + y * 90) * Math.sin(y * 420 - z * 90),
    });
    const buttonAt = (x: number) => {
      const p = sdf.surfacePoint(bib, [x, 0.535, 0.5], 0.003);
      return sdf.sphere(0.0125).at(...p);
    };
    k.body('buttons', sdf.union(buttonAt(0.09), buttonAt(-0.09)).bone('chest'), { color: C.gold, roughness: 0.4, metalness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ big brown boots
    const bootLocal = sdf
      .smoothUnion(0.02, sdf.ellipsoid([0.09, 0.068, 0.125]).at(0, 0.06, 0.03), sdf.cylinder(0.09, 0.11, 0.02).at(0, 0.055, 0))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boots = pair(bootLocal.rotateY(14).at(ANKLE[0], 0, 0).bone('foot.L'));
    const soleCol = rgb(C.sole);
    k.body('boots', boots.paintFn((_x, y, _z, base) => (y < 0.014 ? soleCol : base)), { color: C.boot, roughness: 0.7 });

    // ------------------------------------------------------------------ the basket and its giant vegetables
    const bx = BASKET[0];
    const bz = BASKET[2];
    const bowl = sdf.revolve(
      profile.polygon([
        [0, 0.085],
        [0.078, 0.085],
        [0.103, 0.13],
        [0.12, BASKET_RIM],
        [0.104, BASKET_RIM],
        [0.09, 0.135],
        [0.068, 0.103],
        [0, 0.103],
      ]),
    ).at(bx, 0, bz);
    const rim = sdf.torus(0.115, 0.013).at(bx, BASKET_RIM, bz);
    const handle = sdf
      .torus(0.105, 0.0145)
      .rotateZ(90)
      .scale([1, 0.8, 1])
      .at(bx, BASKET_RIM, bz)
      .intersect(sdf.box([0.2, 0.2, 0.3]).at(bx, BASKET_RIM + 0.1, bz));
    const wDark = rgb(C.basketDark);
    const wLight = rgb(C.basket);
    const basket = sdf.union(bowl, rim, handle).paintFn((x, y, z) => {
      const a = Math.atan2(x - bx, z - bz);
      const w = Math.sin(a * 16 + y * 90) * Math.sin(a * 16 - y * 90);
      return w > 0.25 ? wDark : wLight;
    });
    k.body('basket', basket, {
      color: C.basket,
      roughness: 0.85,
      bone: 'hand.R',
      detail: 0.005,
      bump: (x, y, z) => {
        const a = Math.atan2(x - bx, z - bz);
        return 0.0016 * Math.sin(a * 16 + y * 90) * Math.sin(a * 16 - y * 90);
      },
    });
    const carrot = (tip: V3, top: V3, leaves: readonly V3[]) =>
      sdf
        .union(
          sdf.cone(tip, top, 0.006, 0.033),
          ...leaves.map((e) => sdf.cone(top, e, 0.012, 0.004)),
        )
        .paintFn((_x, y) => (y > Math.max(tip[1], top[1]) + 0.012 ? rgb(C.carrotTop) : rgb(C.carrot)));
    const carrots = sdf.union(
      carrot([-0.42, 0.14, 0.09], [-0.49, 0.315, 0.075], [[-0.53, 0.4, 0.05], [-0.49, 0.41, 0.09], [-0.46, 0.39, 0.06]]),
      carrot([-0.41, 0.14, -0.005], [-0.455, 0.35, -0.02], [[-0.49, 0.44, -0.05], [-0.45, 0.45, -0.01], [-0.42, 0.43, -0.04]]),
    );
    k.body('carrots', carrots, { color: C.carrot, roughness: 0.6, bone: 'hand.R', detail: 0.005 });
    const cabbageC: V3 = [-0.41, 0.232, 0.0];
    const cabbage = sdf.sphere(0.056).at(...cabbageC);
    k.body('cabbage', cabbage, {
      color: C.cabbage,
      roughness: 0.7,
      bone: 'hand.R',
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(x - cabbageC[0], z - cabbageC[2]) * 7 + (y - cabbageC[1]) * 40),
    });
    const pumpkinC: V3 = [-0.36, 0.218, 0.125];
    const pumpkin = sdf
      .union(
        sdf.ellipsoid([0.052, 0.044, 0.052]).at(...pumpkinC).displace(0.003, (x, _y, z) => Math.sin(Math.atan2(x - pumpkinC[0], z - pumpkinC[2]) * 10)),
        sdf.cylinder(0.007, 0.03, 0.002).at(pumpkinC[0], pumpkinC[1] + 0.05, pumpkinC[2]),
      )
      .paintFn((_x, y) => (y > pumpkinC[1] + 0.04 ? rgb('#5a7a30') : rgb(C.pumpkin)));
    k.body('pumpkin', pumpkin, { color: C.pumpkin, roughness: 0.6, bone: 'hand.R', detail: 0.005 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys } = motion;
    const LEG = 0.19;
    // The left hand always waves a little.
    const waveL = (p: number, cycles: number, amp: number) => ({ rotate: [0, 0, amp * wave(p, cycles)] as const });

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [3 * wave(p), 0, 0], scale: [1 + 0.015 * bump(p), 1, 1 + 0.015 * bump(p)] },
        neck: { rotate: [-2 * wave(p), 0, 0] },
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        'upperarm.L': { rotate: [0, 0, 3 * bump(p)] },
        'forearm.L': waveL(p, 3, 14),
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
      }),
    });

    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, sway: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, sway * s] as const;
        const legsPose = motion.gait(
          p - 0.25,
          { hip: HIP, knee: KNEE, ankle: ANKLE },
          { stride: step, lift: footLift, duty, bob, roll: 8, heel: SOLE_HEEL, toe: SOLE_TOE, hips: { at: [0, 0.26, 0], rotate: hipsTurn } },
        );
        return {
          ...legsPose.pose,
          hips: { move: [0, legsPose.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          knot: { rotate: [lean + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'upperarm.L': { rotate: [0.15 * armSwing * s, 0, 3] as const },
          'forearm.L': waveL(p, 2, 12),
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -4] as const },
        };
      },
    });
    k.animation('walk', stride(1.0, 0.11, 0.025, 0.62, 0.008, 20, 4, 4));
    k.animation('run', stride(0.6, 0.16, 0.045, 0.42, 0.03, 36, 12, 3));

    // attack: a basket swing, forward and up in front of the body, then back.
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const arm = keys(p, [[0, 0], [0.3, 28], [0.52, -62], [0.68, -58], [1, 0]] as const, 'smooth');
        const step = keys(p, [[0, 0], [0.35, -4], [0.55, -18], [0.75, -16], [1, 0]] as const, 'smooth');
        const turn = keys(p, [[0, 0], [0.3, 12], [0.52, -14], [0.7, -10], [1, 0]] as const, 'smooth');
        const lean = keys(p, [[0, 0], [0.3, -4], [0.52, 8], [0.7, 6], [1, 0]] as const, 'smooth');
        return {
          hips: { move: [0, -legDrop(LEG, Math.abs(step)), 0], rotate: [0, -turn * 0.6, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean * 0.5, turn, 0] },
          head: { rotate: [-lean, -turn * 0.5, 0] },
          knot: { rotate: [-lean * 1.5, 0, 0] },
          'upperarm.R': { rotate: [arm, 0, -6] },
          'forearm.R': { rotate: [-keys(p, [[0, 0], [0.52, 14], [1, 0]] as const, 'smooth'), 0, 0] },
          'upperarm.L': { rotate: [0, 0, 6 * Math.sin(p * Math.PI)] },
          'leg.L': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [-step, 0, 0] },
        };
      },
    });

    // attack2: a happy spin with the basket swinging out to the side.
    k.animation('attack2', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        const spin = keys(p, [[0, 0], [0.25, -20], [0.55, 40], [0.8, 10], [1, 0]] as const, 'smooth');
        const out = keys(p, [[0, 0], [0.25, 6], [0.55, 36], [0.8, 14], [1, 0]] as const, 'smooth');
        const hop = keys(p, [[0, 0], [0.45, 0], [0.55, 0.035], [0.7, 0], [1, 0]] as const, 'smooth');
        return {
          hips: { move: [0, hop, 0], rotate: [0, spin, 0] },
          spine: { rotate: [3, spin * 0.3, 0] },
          chest: { rotate: [0, spin * 0.3, -out * 0.15] },
          head: { rotate: [0, -spin * 0.4, 0] },
          knot: { rotate: [0, 0, -spin * 0.3] },
          'upperarm.R': { rotate: [0, 0, -out] },
          'upperarm.L': { rotate: [0, 0, 4] },
          'forearm.L': waveL(p, 3, 14),
        };
      },
    });

    // roar: a joyful cheer, the head up, the left hand waving high.
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const lift = keys(p, [[0, 0], [0.2, -0.4], [0.35, 1], [0.8, 1], [1, 0]] as const, 'smooth');
        const up = Math.max(0, lift);
        const crouch = Math.max(0, -lift);
        return {
          hips: { move: [0, -0.02 * crouch, 0] },
          spine: { rotate: [8 * crouch - 5 * up, 0, 0] },
          chest: { rotate: [6 * crouch - 8 * up, 0, 0], scale: [1 + 0.04 * up, 1, 1 + 0.03 * up] },
          neck: { rotate: [-6 * up, 0, 0] },
          head: { rotate: [6 * crouch - 12 * up, 3 * wave(p, 4) * up, 0] },
          knot: { rotate: [-10 * crouch + 14 * up, 0, 5 * wave(p, 4) * up] },
          'upperarm.L': { rotate: [0, 0, 12 * up] },
          'forearm.L': { rotate: [0, 0, 16 * wave(p, 5) * up] },
          'upperarm.R': { rotate: [-8 * up, 0, -4 * up] },
        };
      },
    });

    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.16, 1], [0.38, 0.8], [1, 0]] as const);
        const back = -0.025 * r;
        const legL = (Math.atan2(back, 0.19) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
          spine: { rotate: [-8 * r, 0, 3 * r] },
          chest: { rotate: [-9 * r, 7 * r, 0] },
          neck: { rotate: [-5 * r, 0, 0] },
          head: { rotate: [-14 * r, -9 * r, 6 * r] },
          knot: { rotate: [18 * r, 0, -10 * r] },
          'upperarm.L': { rotate: [12 * r, 0, 8 * r] },
          'forearm.L': { rotate: [-22 * r, 0, 0] },
          'upperarm.R': { rotate: [10 * r, 0, -14 * r] },
          'forearm.R': { rotate: [-12 * r, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] },
          'foot.R': { rotate: [-12 * r, 0, 0] },
        };
      },
    });

    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const fall = keys(p, [[0, 0], [0.2, -8], [0.4, 3], [0.54, -40], [0.66, -88], [0.72, -84], [0.8, -88], [1, -88]] as const);
        const hipsY = keys(p, [[0, 0], [0.4, 0], [0.54, -0.006], [0.66, -0.05], [0.72, -0.038], [0.8, -0.05], [1, -0.05]] as const);
        const hipsZ = keys(p, [[0, 0], [0.2, -0.035], [0.4, -0.02], [0.66, -0.13], [1, -0.13]] as const);
        const legs = keys(p, [[0, 0], [0.2, 4], [0.4, -3], [0.54, 36], [0.66, 50], [1, 50]] as const);
        const stepR = keys(p, [[0, 0], [0.2, 14], [0.4, 4], [0.54, 0], [1, 0]] as const);
        const spill = keys(p, [[0, 0], [0.54, 0], [0.62, 1], [1, 1]] as const);
        return {
          hips: { move: [0, hipsY, hipsZ], rotate: [fall, keys(p, [[0, 0], [0.2, 8], [0.66, -6], [1, -6]] as const), 0] },
          spine: { rotate: [keys(p, [[0, 0], [0.2, -10], [0.4, 8], [0.56, 6], [0.66, -4], [1, 0]] as const), 0, 0] },
          chest: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 6], [0.66, -2], [1, 0]] as const), keys(p, [[0, 0], [0.2, 10], [0.5, -6], [1, 0]] as const), 0] },
          neck: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 8], [0.6, 16], [0.7, -6], [0.8, 0], [1, 0]] as const), 0, 0] },
          head: { rotate: [keys(p, [[0, 0], [0.2, -14], [0.4, 10], [0.6, 14], [0.7, -10], [0.8, 0], [1, 0]] as const), keys(p, [[0, 0], [0.7, 0], [0.9, 28], [1, 28]] as const), 0] },
          knot: { rotate: [keys(p, [[0, 0], [0.2, 16], [0.4, -10], [0.66, 30], [0.76, -10], [1, 0]] as const), 0, 12 * spill] },
          'upperarm.L': { rotate: [keys(p, [[0, 0], [0.2, 12], [0.4, -8], [0.58, -30], [0.7, 20], [1, 24]] as const), 0, keys(p, [[0, 0], [0.2, 10], [0.4, 8], [0.58, 20], [0.7, 24], [1, 26]] as const)] },
          'forearm.L': { rotate: [keys(p, [[0, 0], [0.2, -30], [0.58, -20], [0.7, -6], [1, -8]] as const), 0, 0] },
          'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -45], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, -22], [0.4, -10], [0.58, -35], [0.7, -58], [1, -60]] as const)] },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
          'hand.R': { rotate: [keys(p, [[0, 0], [0.62, 0], [0.8, 40], [1, 40]] as const), 0, 0] },
          'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
          'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
          'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
          'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
        };
      },
    });
  },
});
