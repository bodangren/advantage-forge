import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Caravan guard — Chibi Quest hero (catalog `heroes/support/caravan-guard`), about 1.02 m to the
 * top of the hat, the spear above that (1.4 m), faces +Z. Target:
 * docs/hero-mockups/caravan-guard_001.jpg (the mockup's beard is skipped: every hero on this set
 * has the young, round, beardless face). Built on the adventurer's head and skeleton.
 *
 * Role: support hero, seen in 3D and as a 128 px sprite; the wide hat, the padded gambeson with its
 *   leather yoke, the shield on the back, and the hooked spear must read at that size.
 * One idea: a sturdy young guard under a huge tan travel hat, padded tan gambeson, tall hooked spear
 *   upright in the right hand, a round shield slung on the back.
 * Proportions: hat top 1.02, brim 0.80 (r 0.24), eyes 0.63, chin 0.48, shoulders 0.385, belt 0.245,
 *   skirt hem 0.14, boot cuffs 0.11.
 * Shape language: round and soft (face, hat, padding), with square leather plates and the hooked
 *   steel blade as the hard accents.
 * Palette (60/30/10): tan hat #b08a50 and gambeson #c8a868 (60), brown leather #6b4226 / #4e2d1c
 *   (30), steel #a8acb1 (10) at the buckle and the spear blade. Skin #f2c7a4, hair #3a2418.
 * Value plan: the dark hair and the brown yoke frame the light face (focal point); the steel blade
 *   and the big buckle are the small bright accents.
 * Bodies: skin, hair, hat, hat-band, hat-rim, gambeson, skirt, trousers, yoke, patches, cuffs, trim,
 *   belt, belt-trim, steel, flask, shield, boots, boot-cuffs, spear, spear-steel.
 * Rig: the adventurer's chibi skeleton with knees, without the bandana and lantern bones; the spear
 *   is rigid on the right hand, the shield on the spine. Clips: idle, walk, run, attack (a spear
 *   thrust), attack2 (a hooked pull-and-jab), hit, death (a face-down fall, shield up), victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#b07a34',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#2a170e',
  mouth: '#8a3a32',
  hair: '#3a2418',
  hairLight: '#5a3a26',
  hairDark: '#22130a',
  hat: '#b08a50',
  hatShade: '#8a6a35',
  cloth: '#c8a868',
  stitch: '#a08848',
  fold: '#8a7040',
  leather: '#6b4226',
  leatherDark: '#4e2d1c',
  beltDark: '#34200f',
  steel: '#a8acb1',
  steelDark: '#7a7f86',
  trousers: '#6e7560',
  wood: '#6b4226',
  flask: '#5a4030',
  cork: '#b89a6a',
  shaft: '#5a3a24',
  boots: '#5a3a24',
  bootDark: '#3e2616',
  sole: '#3a2418',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const rad = Math.PI / 180;

const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => scl(a, 1 / Math.hypot(a[0], a[1], a[2]));
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The rotateX and rotateZ that turn a local +Y axis to the unit vector `d`. */
const aim = (d: V3) => ({ a: Math.asin(d[2]) / rad, b: Math.atan2(-d[0], d[1]) / rad });
const fract = (v: number) => v - Math.floor(v);

// Joints: the adventurer's shoulders and legs. The right forearm brings the fist out to the spear,
// the left fist hangs relaxed.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW_R: V3 = [-0.2, 0.335, -0.005];
const WRIST_R: V3 = [-0.285, 0.305, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)

/** A fist around a pole: the pole runs along local Y, the knuckles face +Z. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.04, 0.036, 0.042]),
    sdf.capsule([-0.006 * s, -0.022, 0.034], [-0.006 * s, 0.022, 0.034], 0.017),
    sdf.cone([0.026 * s, 0.022, 0.012], [0.004 * s, 0.03, 0.04], 0.016, 0.012),
  );

// The spear at rest: leaning out 6 degrees, its axis through the right fist, the butt on the floor.
const TILT = 9;
const SD0: V3 = [-Math.sin(TILT * rad), Math.cos(TILT * rad), 0];
const UP0: V3 = [0, 0, 1];
const GRIP_R: V3 = add(WRIST_R, scl(norm(sub(WRIST_R, ELBOW_R)), 0.037));
const SPEAR_GRIP = GRIP_R[1] / SD0[1]; // the grip's distance from the butt along the shaft
const BUTT: V3 = [GRIP_R[0] + SPEAR_GRIP * Math.sin(TILT * rad), 0.001, GRIP_R[2]];
// The left fist hangs at the hip, the fingers around a vertical axis.
const GRIP_L: V3 = add(WRIST, scl(norm(sub(WRIST, ELBOW)), 0.037));
const DL = norm([0.04, 1, 0.14]);

export default defineAsset({
  name: 'caravan-guard',
  description:
    'Chibi caravan guard hero with a wide tan travel hat, a padded tan gambeson under a leather yoke, a round shield on the back, a water flask, and a tall hooked spear.',
  detail: 0.006,
  reference: 'docs/hero-mockups/caravan-guard_001.jpg',
  variants: {
    eyes: { brown: C.iris, green: '#3d7a35', blue: '#2f6aa8' },
    hair: { brown: C.hair, black: '#231a17', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { tan: C.cloth, olive: '#7a7a48', rust: '#a0522d' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', clothing: 'tan' },
    olive: { eyes: 'green', hair: 'black', skin: 'tan', clothing: 'olive' },
    rust: { eyes: 'blue', hair: 'auburn', skin: 'brown', clothing: 'rust' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairLight: k.tint('hair', { color: C.hairLight, follow: 1 }),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      stitch: k.tint('clothing', { color: C.stitch, follow: 1 }),
      fold: k.tint('clothing', { color: C.fold, follow: 1 }),
    };

    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
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
    const nose = sdf.ellipsoid([0.024, 0.02, 0.018]).at(0, 0.572, faceZ(0, 0.572) - 0.002).bone('head');
    // Small round human ears.
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.044, 0.031])
        .subtract(sdf.sphere(0.018).at(0.016, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.612, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
    );
    const fistAt = (g: V3, d: V3, s: 1 | -1) => {
      const { a, b } = aim(d);
      return fistLocal(s).rotateX(a).rotateZ(b).at(...g);
    };
    const hands = sdf.union(fistAt(GRIP_L, DL, 1).bone('hand.L'), fistAt(GRIP_R, SD0, -1).bone('hand.R'));

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.054, 0.058, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.044, 0.05, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.038, 0.044, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.025, 0.028, 0.07]), EYE[0], EYE[1] - 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.052, 0.009, 20, 160), 0.3).at(EYE[0], EYE[1] - 0.006, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.013), x + 0.016, EYE[1] + 0.018),
        at(sdf.sphere(0.0065), x - 0.015, EYE[1] - 0.022),
      ]),
    );
    // Heavy, level brows a little lower at the inner ends: calm and steady.
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.03, 63, 115), 0.3).at(0.104, 0.618, 0.1));
    // A calm, small smile.
    const mouth = sdf.extrude(profile.arc(0.075, 0.011, 242, 298), 0.3).at(0, 0.623, 0.1);
    const blush = pair(at(sdf.sphere(0.038), 0.142, 0.562));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR, hands)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: tousled separate locks
    // A cap hidden under the crown, three short fringe locks over the brow, and ten tousled locks
    // (chains, r 0.024) under the brim that sweep out at the sides, over the ears, and at the nape,
    // their tips flicking up and out. The locks differ in length and lean, so no curtain forms.
    const skullAt = (phi: number, y: number, lift = 0): V3 => {
      const s = Math.sqrt(Math.max(0, 1 - ((y - HEAD_Y) / HEAD[1]) ** 2));
      return [Math.sin(phi * rad) * (HEAD[0] + lift) * s, y, Math.cos(phi * rad) * (HEAD[2] + lift) * s];
    };
    const skull = sdf.ellipsoid([HEAD[0], HEAD[1], HEAD[2]]).at(0, HEAD_Y, 0);
    const cap = skull.round(0.014).intersect(sdf.halfSpace([0, -1, 0], -0.74));
    // A low under-layer at the back so the gaps between the locks show hair, not scalp.
    const under = skull
      .round(0.008)
      .intersect(sdf.halfSpace([0, -1, 0], -0.7))
      .intersect(sdf.halfSpace([0, 0, 1], -0.0));
    const R = 0.024;
    // [azimuth from the front toward his left, tip height, lean (azimuth shift to the tip), flick height]
    const lockSpec: [number, number, number, number][] = [
      [84, 0.69, -6, 0.022],
      [108, 0.655, 10, 0.03],
      [134, 0.61, 14, 0.026],
      [158, 0.675, 8, 0.03],
      [180, 0.6, -12, 0.024],
      [202, 0.68, -8, 0.03],
      [226, 0.615, -14, 0.026],
      [252, 0.66, -10, 0.03],
      [276, 0.69, 6, 0.022],
      [296, 0.72, 6, 0.02],
    ];
    const lock = ([phi, tipY, lean, flick]: [number, number, number, number]) =>
      sdf.chain(
        [
          [...skullAt(phi, 0.81, 0), R * 1.2],
          [...skullAt(phi + lean * 0.25, (0.81 + tipY) / 2 + 0.03, 0.014), R * 1.15],
          [...skullAt(phi + lean * 0.7, tipY + 0.012, 0.024), R * 0.7],
          [...skullAt(phi + lean, tipY, 0.034), R * 0.4],
          [...skullAt(phi + lean * 1.3, tipY + flick, 0.058), R * 0.14],
        ],
        0.008,
      );
    const locks = sdf.union(...lockSpec.map(lock));
    // The fringe: three short locks over the brow, tips just under the brim.
    const fringe = sdf.union(
      ...[
        [-0.085, 0.75, -0.012],
        [0.005, 0.738, 0.01],
        [0.09, 0.748, 0.012],
      ].map(([x, tipY, dx]) =>
        sdf.chain(
          [
            [x! * 0.8, 0.835, 0.11, 0.036],
            [x! * 0.95, 0.785, faceZ(Math.abs(x!), 0.785) + 0.004, 0.03],
            [x! + dx! * 0.5, tipY! + 0.014, faceZ(Math.abs(x! + dx! * 0.5), tipY! + 0.014) + 0.012, 0.02],
            [x! + dx!, tipY!, faceZ(Math.abs(x! + dx!), tipY!) + 0.014, 0.008],
          ],
          0.008,
        ),
      ),
    );
    const hair = sdf
      .smoothUnion(0.006, cap, under, locks, fringe)
      .paintFn((x, y, z, base) => {
        if (base[0] + base[1] + base[2] === 0) return base;
        const top = Math.min(1, Math.max(0, (y - 0.78) / 0.12)) * 0.6;
        const l = rgb(T.hairLight);
        return [base[0] + (l[0] - base[0]) * top, base[1] + (l[1] - base[1]) * top, base[2] + (l[2] - base[2]) * top];
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ the hat
    // Built in its own frame (origin at the brim's center, Y up), then tilted 10 degrees up at the
    // front and set on the head. The brim is r 0.24, 0.02 thick, with a slight upturn at the edge;
    // the crown has a front-to-back crease along the top and two dents at the front.
    const hatPose = (s: sdf.Shape) => s.rotateX(-10).at(0, 0.795, -0.012);
    const BRIM_R = 0.3; // wide like the mockup: the crown is narrower than the head
    const brimBottom = (r: number) => (r < 0.13 ? -0.008 : r < 0.2 ? -0.008 + ((r - 0.13) / 0.07) * 0.002 : -0.006 + ((r - 0.2) / 0.1) * 0.012);
    const brim = sdf.revolve(
      profile.polygon([
        [0, -0.008],
        [0.13, -0.008],
        [0.2, -0.006],
        [BRIM_R, 0.006],
        [BRIM_R + 0.003, 0.02],
        [0.2, 0.014],
        [0.13, 0.012],
        [0, 0.012],
      ]),
    );
    const crownBase = sdf.smoothUnion(
      0.035,
      sdf.revolve(
        profile.polygon(
          [
            [0, -0.006],
            [0.168, -0.006],
            [0.17, 0.03],
            [0.16, 0.09],
            [0.14, 0.14],
            [0.11, 0.19],
            [0.07, 0.225],
            [0, 0.235],
          ],
          { smooth: true, samples: 6 },
        ),
      ),
      sdf.cone([0, 0.19, 0], [0, 0.255, 0], 0.06, 0.016),
    );
    const crease = sdf.box([0.02, 0.07, 0.6], 0.008).at(0, 0.277, 0);
    const dents = pair(sdf.sphere(0.03).at(0.115, 0.11, 0.115));
    const crown = crownBase.smoothSubtract(0.015, crease).smoothSubtract(0.03, dents).scale([1, 1, 1.03]);
    const hatShape = sdf.smoothUnion(0.012, brim, crown).paintFn((x, y, z, base) => {
      const r = Math.hypot(x, z);
      return y < 0.02 && r > 0.03 && r < 0.32 && y < brimBottom(r) + 0.008 ? rgb(C.hatShade) : base;
    });
    k.body('hat', hatPose(hatShape), {
      color: C.hat,
      roughness: 0.85,
      bone: 'head',
      detail: 0.004,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
    // The darker leather band (0.02 tall) at the crown's base and the raised rim at the brim's edge.
    const hatBand = crown.round(0.007).intersect(sdf.box([1, 0.02, 1]).at(0, 0.022, 0));
    const brimRim = brim.round(0.004).subtract(sdf.cylinder(BRIM_R - 0.014, 0.3).at(0, 0, 0));
    k.body('hat-band', hatPose(hatBand), { color: '#5a3a24', roughness: 0.6, bone: 'head', detail: 0.004 });
    k.body('hat-rim', hatPose(brimRim), { color: C.hatShade, roughness: 0.8, bone: 'head', detail: 0.005 });

    // ------------------------------------------------------------------ gambeson, skirt, trousers
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.072, 0.466],
            [0.108, 0.445],
            [0.131, 0.405],
            [0.138, 0.34],
            [0.133, 0.29],
            [0.136, 0.25],
            [0.142, 0.21],
            [0.144, 0.196],
            [0.13, 0.186],
            [0, 0.186],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    // Quilting: a grid of puffy square panels about 0.035 m per cell. The torso uses the angle
    // round the body and the height; the sleeves the angle round their own axis and the height.
    const CELL = 0.035;
    const cellOf = (x: number, y: number, z: number): [number, number] => {
      const side = Math.abs(x) > 0.15 ? Math.sign(x) : 0;
      const u = side ? Math.atan2(z, x - side * 0.16) * 0.05 : Math.atan2(x, z) * 0.135;
      return [fract(u / CELL), fract((y - 0.2) / CELL)];
    };
    const sleeve = (s: V3, e: V3, w: V3, tagU: string, tagF: string) =>
      sdf.smoothUnion(
        0.012,
        sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 1.02), 0.052, 0.047).bone(tagU),
        sdf.cone(lerp(s, e, 0.92), lerp(e, w, 0.78), 0.048, 0.043).bone(tagF),
      );
    const gambeson = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW, WRIST, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'))
      .paintFn((x, y, z, base) => {
        const [fx, fy] = cellOf(x, y, z);
        const quilted = y > 0.212 && Math.hypot(x, z) > 0.09;
        // Darker seams between the panels, in both directions.
        if (quilted && (fx < 0.09 || fx > 0.91 || fy < 0.09 || fy > 0.91)) return rgb(T.stitch);
        if (y < 0.225 && y > 0.205) return mixRgb(base, rgb(T.fold), 0.5);
        return base;
      });
    const gambesonBump = (x: number, y: number, z: number) => {
      if (y < 0.212 || Math.hypot(x, z) < 0.09) return 0.0004 * noise.fbm(x * 120, y * 120, z * 120, 2);
      const [fx, fy] = cellOf(x, y, z);
      return 0.004 * Math.sqrt(Math.sin(Math.PI * fx) * Math.sin(Math.PI * fy));
    };
    k.body('gambeson', gambeson, { color: T.cloth, roughness: 0.88, bump: gambesonBump });

    // The padded skirt: a flared shell from the belt to y 0.14 with one front slit.
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.27],
            [0.138, 0.27],
            [0.152, 0.22],
            [0.178, 0.155],
            [0, 0.155],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.85]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.122, 0.3],
            [0.138, 0.22],
            [0.163, 0.12],
            [0, 0.12],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.85]);
    const slit = sdf.box([0.024, 0.085, 0.3], 0.004).at(0, 0.155, 0.17);
    const skirtShell = skirtOuter.subtract(skirtInner).subtract(slit);
    const skirt = skirtShell.paintFn((x, y, z, base) => {
      const a = Math.atan2(x, z);
      if (y < 0.165) return rgb(T.fold);
      if (Math.abs(Math.sin(a * 7)) > 0.965) return rgb(T.fold);
      const seam = fract((y - 0.15) / 0.045);
      return seam < 0.08 || seam > 0.92 ? rgb(T.stitch) : base;
    });
    k.body('skirt', skirt.bone('hips'), {
      color: T.cloth,
      roughness: 0.88,
      bump: (x, y, z) => 0.0018 * Math.sqrt(Math.sin(Math.PI * fract((y - 0.15) / 0.045))) * (1 - 0.5 * Math.abs(Math.sin(Math.atan2(x, z) * 3.5))),
    });

    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.085, 0.004], 0.047).bone('leg.L')),
    );
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });

    // ------------------------------------------------------------------ leather: yoke, patches, cuffs, belt, trims
    // The yoke: a shell over the shoulders with a V at the chest, two patches with rivets.
    // Two shoulder capes (left built, right mirrored) that also cover the top of each sleeve,
    // with a raised dark rim at their lower edge, and a strap down the center of the chest.
    const capePoly = profile.polygon([
      [0.035, 0.52],
      [0.34, 0.52],
      [0.34, 0.395],
      [0.23, 0.368],
      [0.13, 0.376],
      [0.06, 0.4],
      [0.035, 0.43],
    ]);
    const capeMass = sdf
      .union(
        torso.bone('spine'),
        sdf.cone([SHOULDER[0] * 0.85, 0.405, 0], lerp(SHOULDER, ELBOW, 1.02), 0.052, 0.047).bone('upperarm.L'),
      )
      .round(0.012);
    const capeBase = capeMass.intersect(sdf.extrude(capePoly, 0.7));
    const capeEdge = capeBase.subtract(sdf.extrude(profile.offsetProfile(capePoly, -0.012), 0.8));
    const yokeBase = hard(capeBase);
    const yokeRim = hard(capeEdge.round(0.004));
    const chestStrap = torso
      .round(0.011)
      .intersect(sdf.box([0.034, 0.22, 0.7], 0.004).at(0, 0.365, 0))
      .intersect(sdf.halfSpace([0, 0, -1], 0));
    const strapRim = chestStrap.subtract(sdf.box([0.02, 1, 1])).round(0.004);
    const PATCH_AT: V3 = [0.12, 0.432, 0.0];
    const patchShape = (w: number, d: number) => sdf.box([w, 0.024, d], 0.008).rotateZ(-26).at(...PATCH_AT);
    const patchL = patchShape(0.1, 0.11);
    const patchFrame = patchShape(0.104, 0.114).round(0.004).subtract(patchShape(0.072, 0.082).round(0.004).at(0, 0.02, 0));
    const patches = hard(patchL);
    k.body('yoke', sdf.union(yokeBase, chestStrap.bone('spine'), patches.bone('spine')), { color: C.leather, roughness: 0.55, bump: (x, y, z) => 0.0008 * noise.fbm(x * 160, y * 160, z * 160, 2) });
    const rivets = hard(
      sdf.union(
        ...[-0.032, 0, 0.032].map((dz) => {
          const p = sdf.raycast(patchL, [PATCH_AT[0] + 0.005, 0.7, dz], [0, -1, 0])!;
          return sdf.sphere(0.0065).at(p[0], p[1] + 0.001, p[2]);
        }),
      ),
    );

    // The belt: wide, with a big round steel buckle.
    const beltY = 0.245;
    const beltH = 0.06;
    const belt = torso.round(0.013).smoothIntersect(0.006, sdf.box([0.6, beltH, 0.6], 0.008).at(0, beltY, 0));
    const beltRim = sdf.union(
      ...[-1, 1].map((s) => torso.round(0.013).intersect(sdf.box([0.6, 0.006, 0.6]).at(0, beltY + s * (beltH / 2 - 0.003), 0)).round(0.004)),
    );
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.torus(0.037, 0.0105).rotateX(90).at(0, beltY, beltZ + 0.006),
        sdf.box([0.01, 0.074, 0.012], 0.003).at(0.0, beltY, beltZ + 0.008),
        sdf.box([0.066, 0.01, 0.012], 0.003).at(0.014, beltY + 0.002, beltZ + 0.008),
      )
      .bone('spine');
    const keeperPlaced = sdf.box([0.014, beltH + 0.012, 0.02], 0.005).at(0.09, beltY, sdf.raycast(belt, [0.09, beltY, 1], [0, 0, -1])![2]);
    k.body('belt', sdf.union(belt.bone('spine'), keeperPlaced.bone('spine')), { color: C.leatherDark, roughness: 0.55 });
    k.body('belt-trim', beltRim.bone('spine'), { color: C.beltDark, roughness: 0.55, detail: 0.007 });

    // Leather cuffs (raised dark rims at both ends).
    const ringAt = (s: V3, e: V3, t: number, R: number, r: number, tag: string) => {
      const d = norm(sub(e, s));
      const { a, b } = aim(d);
      const c = lerp(s, e, t);
      return sdf.torus(R, r).rotateX(a).rotateZ(b).at(c[0], c[1], c[2]).bone(tag);
    };
    const cuff = (e: V3, w: V3, tag: string) => sdf.cone(lerp(e, w, 0.6), lerp(e, w, 1.0), 0.046, 0.042).round(0.002).bone(tag);
    k.body('cuffs', sdf.union(cuff(ELBOW, WRIST, 'forearm.L'), cuff(ELBOW_R, WRIST_R, 'forearm.R')), { color: C.leather, roughness: 0.55, detail: 0.005 });
    const cuffRims = sdf.union(
      ringAt(ELBOW, WRIST, 0.6, 0.0465, 0.0058, 'forearm.L'),
      ringAt(ELBOW, WRIST, 0.99, 0.0435, 0.0058, 'forearm.L'),
      ringAt(ELBOW_R, WRIST_R, 0.6, 0.0465, 0.0058, 'forearm.R'),
      ringAt(ELBOW_R, WRIST_R, 0.99, 0.0435, 0.0058, 'forearm.R'),
    );

    // The shield on the back over the left shoulder: a round wooden disc with a boss and a rim.
    const shieldPose = (s: sdf.Shape) => s.rotateX(-90).rotateY(-32).rotateZ(8).at(0.125, 0.315, -0.14);
    const shieldDisc = sdf
      .revolve(
        profile.polygon(
          [
            [0, -0.006],
            [0.12, -0.006],
            [0.134, 0.002],
            [0.134, 0.016],
            [0.12, 0.022],
            [0.055, 0.022],
            [0.03, 0.03],
            [0, 0.034],
          ],
          { smooth: false },
        ),
      )
      .round(0.002)
      .paintFn((x, y, z, base) => {
        const r = Math.hypot(x, z);
        if (y > 0.019 && r < 0.04) return rgb(C.leatherDark);
        const a = Math.atan2(z, x);
        return Math.abs(Math.sin(a * 6)) > 0.985 && r > 0.045 ? mixRgb(base, rgb(C.leatherDark), 0.55) : base;
      });
    const shieldRim = sdf.torus(0.126, 0.0105).at(0, 0.008, 0).union(sdf.torus(0.126, 0.0105).at(0, 0.014, 0));
    k.body('shield', shieldPose(shieldDisc).bone('spine'), { color: C.wood, roughness: 0.78, bump: (x, y, z) => 0.0009 * noise.fbm(x * 40, y * 120, z * 40, 2) });
    const shieldBoss = sdf.sphere(0.022).scale([1, 0.6, 1]).at(0, 0.03, 0);

    k.body('trim', sdf.union(yokeRim, strapRim.bone('spine'), hard(patchFrame).bone('spine'), cuffRims, shieldPose(shieldRim).bone('spine')), {
      color: C.leatherDark,
      roughness: 0.55,
      detail: 0.005,
    });
    k.body('steel', sdf.union(buckle, rivets.bone('spine'), shieldPose(shieldBoss).bone('spine')), {
      color: C.steel,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
    });

    // The water flask at the right hip, on a strap from the belt.
    const FLASK: V3 = [-0.176, 0.172, 0.022];
    const flaskPose = (s: sdf.Shape) => s.rotateZ(9).at(...FLASK);
    const flaskBody = sdf.smoothUnion(
      0.008,
      sdf.ellipsoid([0.036, 0.055, 0.028]),
      sdf.cylinder(0.014, 0.03, 0.004).at(0, 0.055, 0),
    );
    const flaskStrap = sdf.union(
      sdf.torus(0.017, 0.006).at(0, 0.056, 0),
      sdf.box([0.012, 0.05, 0.007], 0.002).rotateZ(6).at(0.0, 0.09, 0.014),
    );
    const cork = sdf.cylinder(0.012, 0.014, 0.004).at(0, 0.08, 0);
    k.body('flask', flaskPose(flaskBody.paintWhere(flaskStrap.union(sdf.box([0.1, 0.012, 0.1]).at(0, -0.008, 0)), C.bootDark, 0.002)).bone('spine'), {
      color: C.flask,
      roughness: 0.6,
      detail: 0.004,
    });
    k.body('flask-top', flaskPose(sdf.union(flaskStrap, cork)).bone('spine'), { color: C.cork, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ boots: a tall shaft and a folded cuff
    const shoeFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.05, 0.075, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.062, 0.054, 0.106]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shaft = sdf.cylinder(0.056, 0.05, 0.012).at(0, 0.085, -0.002);
    const cuffFold = sdf.cylinder(0.063, 0.028, 0.012).at(0, 0.098, -0.002);
    const boot = sdf
      .smoothUnion(0.012, shoeFoot, shaft)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boots, roughness: 0.6, bump: (x, y, z) => 0.0008 * noise.fbm(x * 100, y * 100, z * 100, 2) });
    const bootCuff = cuffFold.rotateY(10).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boot-cuffs', pair(bootCuff), { color: C.bootDark, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ the spear: shaft, hooked steel blade
    const SP_TOP = 1.15;
    const spearPose = (s: sdf.Shape) => s.rotateZ(TILT).at(...BUTT);
    const shaftBody = sdf
      .capsule([0, 0, 0], [0, SP_TOP - 0.2, 0], 0.016)
      .paintFn((x, y, z, base) => (y > 0.3 && y < 0.42 ? mixRgb(base, rgb('#2e1c10'), 0.55) : base));
    k.body('spear', spearPose(shaftBody), {
      color: C.shaft,
      roughness: 0.75,
      bone: 'hand.R',
      detail: 0.004,
      bump: (x, y, z) => 0.0007 * noise.noise3(x * 80, y * 10, z * 80),
    });
    // The blade: 0.2 tall, a spike on the point, one hook curving out and down on his right (-X).
    const BLADE_Y = SP_TOP - 0.25;
    const bladeProfile = profile.polygon(
      ([
        [-0.012, 0.0],
        [0.012, 0.0],
        [0.016, 0.04],
        [0.03, 0.085],
        [0.022, 0.145],
        [0.0, 0.2],
        [-0.022, 0.15],
        [-0.03, 0.12],
        [-0.06, 0.128],
        [-0.088, 0.105],
        [-0.096, 0.062],
        [-0.076, 0.082],
        [-0.055, 0.096],
        [-0.03, 0.082],
        [-0.016, 0.04],
      ] as [number, number][]).map(([x, y]) => [x * 1.3, y * 1.25] as [number, number]),
      { smooth: true, samples: 3 },
    );
    const bladeAt = (s: sdf.Shape) => s.at(0, BLADE_Y, 0);
    const blade = bladeAt(
      sdf.smoothUnion(0.006, sdf.extrude(bladeProfile, 0.012, 0.004), sdf.capsule([0, 0, 0], [0, 0.21, 0], 0.0095)),
    ).paintWhere(
      bladeAt(sdf.extrude(bladeProfile, 0.3).subtract(sdf.extrude(profile.offsetProfile(bladeProfile, -0.007), 0.3))),
      C.steelDark,
      0.0015,
    );
    const socket = sdf.union(
      sdf.cone([0, BLADE_Y - 0.03, 0], [0, BLADE_Y + 0.012, 0], 0.017, 0.022),
      sdf.torus(0.019, 0.0065).at(0, BLADE_Y - 0.035, 0),
      sdf.cone([0, -0.004, 0], [0, 0.05, 0], 0.012, 0.0205).smoothUnion(0.006, sdf.torus(0.019, 0.0055).at(0, 0.05, 0)),
    );
    k.body('spear-steel', spearPose(sdf.union(blade, socket)), {
      color: C.steel,
      roughness: 0.4,
      metalness: 0.75,
      bone: 'hand.R',
      detail: 0.004,
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    type P = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;

    // The spear solver: the spear's axis goes `dir`, its grip point goes to `grip` (both in the
    // chest's rest frame). The right arm reaches, the hand turns. The blade's flat follows.
    const basis = (dir: V3, up: V3) => {
      const d = norm(dir);
      const s = norm(cross(up, d));
      return [s, cross(d, s), d] as const;
    };
    const flatFor = (dir: V3): V3 => {
      const a = norm(dir);
      const axis = cross(SD0, a);
      const s = Math.hypot(axis[0], axis[1], axis[2]);
      const c = dot(SD0, a);
      if (s < 1e-6) return c > 0 ? UP0 : [0, 0, -1];
      const kk = scl(axis, 1 / s);
      const v = UP0;
      return add(add(scl(v, c), scl(cross(kk, v), s)), scl(kk, dot(kk, v) * (1 - c)));
    };
    const G = sub(GRIP_R, WRIST_R);
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const poleOf = (root: V3, mid: V3, end: V3) => {
      const t = norm(sub(end, root));
      const e = sub(mid, root);
      const d = dot(e, t);
      const side = norm(sub(e, scl(t, d)));
      return add(root, scl(side, 0.6));
    };
    const POLE_REST = poleOf(mx(SHOULDER), ELBOW_R, WRIST_R);
    const POLE_REST_L = poleOf(SHOULDER, ELBOW, WRIST);
    const spearArm = (grip: V3, dir: V3, pole: V3 = POLE_REST) => {
      const d = norm(dir);
      const up = flatFor(d);
      const A = basis(SD0, UP0);
      const B = basis(d, up);
      const c = [dot(A[0], G), dot(A[1], G), dot(A[2], G)];
      const gv = add(add(scl(B[0], c[0]), scl(B[1], c[1])), scl(B[2], c[2]));
      const wrist = sub(grip, gv);
      const a = reach(ARM_R, wrist, pole);
      const hand = orient([a.upper, a.lower], { dir: SD0, up: UP0 }, { dir: d, up });
      return { upper: a.upper, lower: a.lower, hand };
    };
    const dirOf = (yaw: number, pitch: number): V3 => [
      Math.sin(yaw * rad) * Math.cos(pitch * rad),
      Math.sin(pitch * rad),
      Math.cos(yaw * rad) * Math.cos(pitch * rad),
    ];
    // Keep the spear upright against torso pitch: a counter turn on the hand.
    const keep = (x: number, z = 0) => ({ rotate: [x, 0, z] as const });

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        'hand.R': keep(-2.5 * wave(p)),
        'upperarm.L': { rotate: [-2 * wave(p, 1, 0.1), 0, 1.5 * bump(p)] },
      }),
    });

    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
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
          heel: [0.093, 0, -0.021],
          toe: [0.108, 0, 0.087],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.5 * s, 0, 4] as const },
          'forearm.L': { rotate: [-armSwing * 0.3 - armSwing * 0.2 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { move: [0, 0.02 + bob * 1.4, 0] as const },
          'hand.R': keep(-1.5 * lean),
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 28, 3));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 0.03, 50, 12));

    // attack: a spear thrust along the right side. The spear comes from upright to level, the body
    // winds to the right, then the hips, the chest, and the arm drive it forward; the right foot
    // steps forward. The left arm swings back as a counterweight.
    const thrustDir = [
      [0, SD0],
      [0.2, dirOf(14, 16)],
      [0.34, dirOf(13, 8)],
      [0.42, dirOf(13, 8)],
      [0.5, dirOf(-14, 3)],
      [0.62, dirOf(-14, 3)],
      [0.8, dirOf(6, 30)],
      [1, SD0],
    ] as const;
    const thrustGrip = [
      [0, GRIP_R],
      [0.2, [-0.27, 0.35, 0.05]],
      [0.34, [-0.25, 0.335, -0.02]],
      [0.42, [-0.25, 0.335, -0.02]],
      [0.5, [-0.24, 0.34, 0.135]],
      [0.62, [-0.24, 0.34, 0.145]],
      [0.8, [-0.27, 0.33, 0.07]],
      [1, GRIP_R],
    ] as const;
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const a = spearArm(keys(p, thrustGrip, 'spline'), keys(p, thrustDir, 'spline'));
        const wind = ease(0, 0.34, p) * (1 - ease(0.42, 0.5, p));
        const cut = ease(0.42, 0.56, p) * (1 - ease(0.66, 0.96, p));
        const step = 22 * cut;
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.004 * wind, 0.03 * cut - 0.01 * wind], rotate: [0, -6 * wind + 6 * cut, 0] },
          spine: { rotate: [-2 * wind + 6 * cut, 0, 0] },
          chest: { rotate: [-2 * wind + 4 * cut, -18 * wind + 14 * cut, 0] },
          head: { rotate: [-2 * cut, 6 * wind - 12 * cut, 0] },
          'upperarm.R': { rotate: a.upper },
          'forearm.R': { rotate: a.lower },
          'hand.R': { rotate: a.hand },
          'upperarm.L': { rotate: [10 * wind + 6 * cut, 0, 3 * wind] },
          'leg.L': { rotate: [step, 0, 0] },
          'leg.R': { rotate: [-step, 0, 0] },
          'foot.L': { rotate: [-step, 0, 0] },
          'foot.R': { rotate: [step, 0, 0] },
        } as P;
      },
    });

    // attack2: a hooked pull-and-jab. The spear drops level beside the right hip and is drawn back
    // (coil), jabs straight ahead, then is yanked back with the hook turning out, and recovers.
    const jabDir = [
      [0, SD0],
      [0.2, dirOf(-4, 12)],
      [0.3, dirOf(-2, 6)],
      [0.36, dirOf(-2, 6)],
      [0.46, dirOf(-6, 5)],
      [0.56, dirOf(-6, 5)],
      [0.68, dirOf(-16, 14)],
      [0.82, dirOf(-8, 40)],
      [1, SD0],
    ] as const;
    const jabGrip = [
      [0, GRIP_R],
      [0.2, [-0.26, 0.31, -0.04]],
      [0.3, [-0.265, 0.3, -0.07]],
      [0.36, [-0.265, 0.3, -0.07]],
      [0.46, [-0.25, 0.32, 0.15]],
      [0.56, [-0.25, 0.32, 0.155]],
      [0.68, [-0.265, 0.305, -0.05]],
      [0.82, [-0.27, 0.315, 0.04]],
      [1, GRIP_R],
    ] as const;
    k.animation('attack2', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const a = spearArm(keys(p, jabGrip, 'spline'), keys(p, jabDir, 'spline'));
        const wind = ease(0.08, 0.32, p) * (1 - ease(0.36, 0.46, p));
        const cut = ease(0.36, 0.5, p) * (1 - ease(0.56, 0.72, p));
        const pull = ease(0.56, 0.7, p) * (1 - ease(0.8, 0.98, p));
        const step = 16 * cut;
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.004 * wind, 0.02 * cut - 0.008 * wind - 0.006 * pull], rotate: [0, -6 * wind + 8 * cut - 6 * pull, 0] },
          spine: { rotate: [-2 * wind + 5 * cut - 2 * pull, 0, 0] },
          chest: { rotate: [-2 * wind + 3 * cut, -14 * wind + 12 * cut - 10 * pull, 0] },
          head: { rotate: [-2 * cut, 8 * wind - 12 * cut + 6 * pull, 0] },
          'upperarm.R': { rotate: a.upper },
          'forearm.R': { rotate: a.lower },
          'hand.R': { rotate: a.hand },
          'upperarm.L': { rotate: [10 * wind + 6 * cut - 4 * pull, 0, 3 * wind] },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
        } as P;
      },
    });

    // hit: a blow from the front. The head and chest snap back, the right foot steps back and
    // returns; the spear stays planted.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(Math.min(1, Math.max(0, (p - 0.04) / 0.2))) + bump(Math.min(1, Math.max(0, (p - 0.58) / 0.32)));
        const jolt = keys(p, [[0, 0], [0.1, 1], [0.3, 0.15], [0.5, -0.2], [0.78, 0]] as const, 'spline');
        const back = 0.03 * step;
        const plant = Math.asin(back / LEG) / rad;
        return {
          hips: { move: [0, -legDrop(LEG, plant), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-12 * h, -6 * h, 3 * h] },
          'hand.R': keep(16 * h, 3 * h),
          'upperarm.L': { rotate: [6 * jolt, 0, 6 * jolt] },
          'forearm.L': { rotate: [10 * jolt, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
        } as P;
      },
    });

    // death: the blow snaps him back, he staggers a step, then falls face down with the shield up.
    // The spear slips out of upright and lies along the ground to his right, clear of the head.
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.1, 1], [0.24, 0.3], [0.34, 0]] as const);
        const sag = keys(p, [[0.14, 0], [0.36, 1]] as const);
        const fall = keys(p, [[0.3, 0], [0.62, 1.03], [0.7, 0.97], [0.78, 1]] as const, 'smooth');
        const f2 = fall * fall;
        const stand = 1 - Math.min(1, fall);
        const gripR = keys(p, [[0, GRIP_R], [0.2, [-0.32, 0.32, 0.08]], [0.74, [-0.36, 0.3, -0.06]]] as const);
        const dirR = keys(p, [[0, SD0], [0.74, norm([-0.5, 0.86, -0.12])]] as const);
        const poleR = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const a = spearArm(gripR, dirR, poleR);
        const wristL = keys(p, [[0, WRIST], [0.1, [0.28, 0.3, 0.06]], [0.36, [0.27, 0.31, 0.03]], [0.76, [0.2, 0.25, -0.03]]] as const);
        const poleL = keys(p, [[0, POLE_REST_L], [0.2, [0.6, 0.3, -0.1]], [0.76, [0.5, 0.3, -0.3]]] as const);
        const armL = reach(ARM_L, wristL, poleL);
        return {
          hips: {
            move: [0, -0.016 * sag - 0.042 * fall, -0.02 * hitB + 0.13 * f2],
            rotate: [86 * f2, 8 * sag * stand, 6 * fall],
          },
          spine: { rotate: [-10 * hitB + 8 * sag - 4 * fall, 0, 0] },
          chest: { rotate: [-10 * hitB + 6 * sag - 6 * fall, 0, 0] },
          neck: { rotate: [-14 * hitB - 30 * fall, 0, 0] },
          head: { rotate: [-16 * hitB + 10 * sag - 40 * fall, 28 * fall, 10 * sag - 4 * fall] },
          'leg.L': { rotate: [-6 * sag - 44 * fall, 0, 10 * fall] },
          'leg.R': { rotate: [4 * sag - 40 * fall, 0, -12 * fall] },
          'foot.L': { rotate: [30 * fall, 0, 0] },
          'foot.R': { rotate: [30 * fall, 0, 0] },
          'upperarm.R': { rotate: a.upper },
          'forearm.R': { rotate: a.lower },
          'hand.R': { rotate: a.hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
        } as P;
      },
    });

    // victory: the spear is lifted off the floor and held upright beside the head (leaning out,
    // clear of the hat); a proud nod, then he holds the pose with the chin up.
    const WIN = { grip: [-0.34, 0.45, 0.06] as V3, dir: norm([-0.22, 0.97, 0.04]) };
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const r = ease(0, 0.3, p);
        const nod = keys(p, [[0.42, 0], [0.54, 1], [0.68, -0.4], [0.8, 0]] as const);
        const pride = ease(0.6, 0.8, p);
        const look = r * (1 - ease(0.42, 0.6, p));
        const grip = keys(p, [[0, GRIP_R], [0.14, [-0.32, 0.41, 0.09]], [0.3, WIN.grip]] as const, 'spline');
        const dir = norm(keys(p, [[0, SD0], [0.3, WIN.dir]] as const));
        const a = spearArm(grip, dir, keys(p, [[0, POLE_REST], [0.3, [-0.6, 0.15, -0.25]]] as const));
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, -3 * r] },
          chest: { rotate: [-2 * r, 0, -6 * r] },
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [-6 * look + 10 * nod - 5 * pride, -10 * look, 0] },
          'upperarm.R': { rotate: a.upper, move: [0, 0.012 * r, 0] },
          'forearm.R': { rotate: a.lower },
          'hand.R': { rotate: a.hand },
          'upperarm.L': { rotate: [-10 * r, 0, 5 * r] },
          'leg.L': { rotate: [0, 0, stance] },
          'leg.R': { rotate: [0, 0, -stance] },
          'foot.L': { rotate: [0, 0, -stance] },
          'foot.R': { rotate: [0, 0, stance] },
        } as P;
      },
    });
  },
});
