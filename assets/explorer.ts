import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Explorer — Chibi Quest hero (catalog `heroes/support/explorer`), about 0.96 m to the top of the
 * pith helmet, faces +Z. Target: docs/hero-mockups/explorer_001.jpg, with one change: no beard
 * (every hero of this set has the young, round, beardless face). Built on the adventurer's
 * skeleton and the rogue's head, so the heroes read as one set.
 *
 * Role: support hero, seen in 3D and as a 128 px sprite; the helmet, the pack, and the glowing
 *   lantern read at that size.
 * One idea: a curious boy under a huge khaki pith helmet, a brown backpack behind him, a glowing
 *   brass lantern in his left hand and a rolled map held out in his right.
 * Proportions: helmet top 0.96, brim 0.72 to 0.77 (front tilted up 10 degrees so the eyes show),
 *   eyes 0.63, chin 0.48, shoulders 0.385, belt 0.245, shorts hem 0.135, boot tops 0.12.
 * Shape language: round and soft (helmet, pack, boots, pouches), a few hard accents (brass,
 *   lantern bars, rope twist).
 * Palette (60/30/10): khaki #c8b890 (helmet, shirt) with #a89870 folds, brown leather #6b4226 and
 *   pack #7a4a2c; the orange lantern glow #ff9a3c is the accent at the left hand.
 * Value plan: the dark hair under the brim frames the light face; the glowing lantern is the
 *   strongest contrast; the dark pack is the largest dark mass behind him.
 * Bodies: skin, hair, hat, hat-band, shirt, shirt-trim, collar, shorts, leather, straps, brass,
 *   rope, boots, laces, pack, pack-trim, lantern-frame, lantern-glass, lantern-flame, map.
 * Rig: the adventurer's chibi skeleton with knee bones; `lantern` hangs from `hand.L`; the helmet
 *   is rigid on the head, the map rigid on the right hand, the pack on the chest. Clips: idle,
 *   walk, run, attack (a lantern swing), attack2 (a map point and a dash step), hit, death,
 *   victory (a jump with the map held up).
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#b8742a',
  irisLow: '#e0a050',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#2a170e',
  mouth: '#7a2a2a',
  teeth: '#fbf5ee',
  tongue: '#e0706a',
  hair: '#3a2418',
  hairLight: '#5a3a26',
  hairDark: '#24140c',
  khaki: '#c8b890',
  khakiShade: '#a89870',
  band: '#8a7a58',
  leather: '#6b4226',
  leatherDark: '#4a2a16',
  pack: '#7a4a2c',
  packDark: '#5a3418',
  brass: '#b8893a',
  lanternFrame: '#6a5a30',
  glass: '#f4bc78',
  flame: '#ff9a3c',
  flameBase: '#5a2a05',
  rope: '#c9a878',
  ropeDark: '#a08a62',
  map: '#ece0c4',
  mapEdge: '#d8c08a',
  mapRed: '#b8342c',
  boot: '#5a3a24',
  bootTop: '#7a4c30',
  lace: '#3a2418',
  sole: '#3a2418',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => scl(a, 1 / Math.hypot(a[0], a[1], a[2]));
const along = (p: V3, d: V3, s: number): V3 => add(p, scl(d, s));
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** `b` without its component along the unit vector `a`, normalized. */
const perp = (b: V3, a: V3): V3 => norm(sub(b, scl(a, dot(a, b))));
/** Places a shape built in a local frame: local X, Y, Z go to `ex`, `ey`, `ez`; the origin to `p`. */
const frame = (s: sdf.Shape, ex: V3, ey: V3, ez: V3, p: V3) => s.transform([...ex, 0, ...ey, 0, ...ez, 0, ...p, 1]);

// Joints: the rogue's shoulders and legs. The right forearm hangs a little forward with the map,
// the left hangs relaxed with the lantern.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW_R: V3 = [-0.18, 0.332, 0.0];
const WRIST_R: V3 = [-0.2, 0.236, 0.025];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)

// The rolled map: held in the right fist, pointing forward and a little down, its open end facing
// the viewer. Local frame: the roll along +Z, centered on the fist.
const FIST_R = along(WRIST_R, norm(sub(WRIST_R, ELBOW_R)), 0.04);
const ROLL_DIR = norm([-0.36, -0.3, 0.88]);
const ROLL_UP = perp([0, 1, 0], ROLL_DIR);
const ROLL_SIDE = cross(ROLL_UP, ROLL_DIR);
const rollPose = (s: sdf.Shape) => frame(s, ROLL_SIDE, ROLL_UP, ROLL_DIR, FIST_R);

// The lantern: hangs from a ring on the left fist's grip (a bar front to back).
const FIST_L = along(WRIST, norm(sub(WRIST, ELBOW)), 0.04);
const GRIP_L = norm([0.12, 0, 1]);

/** A fist closed around a grip through `g` along the unit axis `a`, entered from the wrist `w`. */
const fistAround = (g: V3, a: V3, w: V3) => {
  const toW = perp(sub(w, g), a);
  const side = cross(a, toW);
  const o = (u: number, v: number, s: number): V3 => add(add(add(g, scl(a, u)), scl(toW, v)), scl(side, s));
  return sdf.smoothUnion(
    0.012,
    sdf.capsule(o(0.012, 0.006, 0), o(-0.01, 0.006, 0), 0.034), // the palm around the grip
    sdf.capsule(o(0.016, -0.018, 0.004), o(-0.016, -0.018, 0.004), 0.02), // the finger roll
    sdf.cone(o(0.004, 0.012, 0.026), o(0.02, -0.004, 0.024), 0.015, 0.012), // the thumb over the grip
  );
};

export default defineAsset({
  name: 'explorer',
  description:
    'Chibi explorer hero in a khaki pith helmet with a brown backpack, a rope coil on the shoulder, a glowing brass lantern in the left hand and a rolled map in the right.',
  detail: 0.006,
  reference: 'docs/hero-mockups/explorer_001.jpg',
  // Color slots for individual explorers (the first option is the default look).
  variants: {
    eyes: { amber: C.iris, brown: '#6e4020', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#231a17', blond: '#c4974a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { khaki: C.khaki, olive: '#7a7a48', slate: '#6a7a8a' },
  },
  presets: {
    default: { eyes: 'amber', hair: 'brown', skin: 'fair', clothing: 'khaki' },
    olive: { eyes: 'green', hair: 'black', skin: 'tan', clothing: 'olive' },
    slate: { eyes: 'brown', hair: 'blond', skin: 'brown', clothing: 'slate' },
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
      shirt: k.tint('clothing'),
      shade: k.tint('clothing', { color: C.khakiShade, follow: 1 }),
      band: k.tint('clothing', { color: C.band, follow: 1 }),
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
      lantern: { parent: 'hand.L', at: FIST_L, tail: [FIST_L[0], FIST_L[1] - 0.12, FIST_L[2]] },
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
    // Small round human ears, a little cupped.
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.044, 0.034])
        .subtract(sdf.sphere(0.018).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.612, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
      fistAround(FIST_L, GRIP_L, WRIST).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAround(FIST_R, ROLL_DIR, WRIST_R).bone('hand.R'),
    );
    // The bare leg between the shorts and the boot top.
    const legs = pair(
      sdf.smoothUnion(
        0.01,
        sdf.capsule([0.09, 0.17, 0], [0.092, 0.1325, 0], 0.034).bone('leg.L'),
        sdf.capsule([0.092, 0.1325, 0], [0.098, 0.08, 0], 0.034).bone('shin.L'),
      ),
    );

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
    // Arched, curious brows: a little raised, well under the brim.
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.02, 62, 116), 0.3).at(0.102, 0.615, 0.1));
    // A small round open mouth of surprise and wonder, with the upper teeth and a bit of tongue.
    const MOUTH: V3 = [0, 0.548, 0.1];
    const mouth = sdf
      .extrude(
        profile.polygon(
          [
            [-0.024, 0.004],
            [0, 0.008],
            [0.024, 0.004],
            [0.028, -0.014],
            [0.018, -0.034],
            [0, -0.04],
            [-0.018, -0.034],
            [-0.028, -0.014],
          ],
          { smooth: true, samples: 5 },
        ),
        0.3,
      )
      .at(...MOUTH);
    const inner = mouth.round(-0.005);
    const teeth = inner.intersect(sdf.halfSpace([0, -1, 0], -(MOUTH[1] - 0.008)));
    const tongue = inner.intersect(sdf.sphere(0.024).at(0, MOUTH[1] - 0.044, 0.2).elongate(0.01, 0, 0.3));
    const blush = pair(at(sdf.sphere(0.038), 0.142, 0.562));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR, legs)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, T.mouth)
      .paintWhere(tongue, C.tongue, 0.004)
      .paintWhere(teeth, C.teeth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ the soft bucket hat
    // Local frame: the brim's plane at y = 0 on the head's axis; tilted up 10 degrees at the front
    // and set on the head, so the brow and the eyes show below it.
    const hatPose = (s: sdf.Shape) => s.rotateX(-10).at(0, 0.765, 0);
    // A low rounded crown (0.08 m above the brim) with a shallow dent on top and one soft crease
    // down the front.
    const crown = sdf.ellipsoid([0.218, 0.13, 0.212]).intersect(sdf.halfSpace([0, -1, 0], 0.004));
    const dent = sdf.ellipsoid([0.1, 0.025, 0.1]).at(0, 0.148, -0.005);
    const crease = sdf.box([0.014, 0.07, 0.022], 0.006).rotateX(-8).at(0, 0.06, 0.168);
    // The brim: wide (r 0.23), 0.018 thick, drooping 0.02 at the edge, rounded rim.
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.11, 0.01],
            [0.17, 0.009],
            [0.235, 0.0],
            [0.262, -0.012],
            [0.262, -0.03],
            [0.235, -0.018],
            [0.17, -0.009],
            [0.11, -0.008],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 1.02]);
    const hatShape = crown.smoothSubtract(0.02, dent, crease).smoothUnion(0.015, brim);
    k.body('hat', hatPose(hatShape), {
      color: T.shirt,
      roughness: 0.85,
      bone: 'head',
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
    const hatBand = sdf.torus(0.2145, 0.012).scale([1, 1, 0.975]).at(0, 0.026, 0);
    k.body('hat-band', hatPose(hatBand), { color: T.band, roughness: 0.75, bone: 'head', detail: 0.006 });

    // ------------------------------------------------------------------ hair: thick dark locks under the brim
    const DEG = Math.PI / 180;
    const faceMask = sdf.ellipsoid([0.235, 0.16, 0.22]).at(0, 0.61, 0.15);
    const volume0 = sdf.ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.018, HEAD[2] + 0.018]).at(0, HEAD_Y + 0.008, -0.01);
    // The cap stops above the ears and dips lower at the back, under the drooping brim.
    const volume = volume0
      .smoothSubtract(0.015, faceMask)
      .intersect(sdf.halfSpace([0, -1, 0.3], -0.63))
      .intersect(sdf.halfSpace([0, 1, -0.174], 0.73));
    const HC: V3 = [0, 0.7, -0.01];
    /** The point on the hair volume in direction (polar `th` from the top, azimuth `ph` from the front toward his left), lifted along the ray. */
    const hs = (th: number, ph: number, lift = 0): V3 => {
      const d: V3 = [Math.sin(th * DEG) * Math.sin(ph * DEG), Math.cos(th * DEG), Math.sin(th * DEG) * Math.cos(ph * DEG)];
      const hit = sdf.raycast(volume0, along(HC, d, 0.6), scl(d, -1))!;
      return along(hit, d, lift);
    };
    const up = (p: V3, dy: number): V3 => [p[0], p[1] + dy, p[2]];
    // Thick locks with curled, flicked ends at the sides and the back.
    const locks0 = sdf.union(
      ...[62, 92, 122, 152, 182, 212, 242, 272, 302].map((ph, i) =>
        sdf.chain(
          [
            [...hs(72, ph - 6, -0.022), 0.038],
            [...hs(90, ph, 0.006), 0.032],
            [...up(hs(106, ph + 8, 0.03 + (i % 2) * 0.012), -0.004), 0.022],
            [...up(hs(120, ph + 14, 0.042 + (i % 2) * 0.01), -0.01), 0.008],
          ],
          0.012,
        ),
      ),
    );
    // Keep the locks below the brim: a plane that follows the brim's tilt.
    const locks = locks0.intersect(sdf.halfSpace([0, 1, -0.174], 0.735));
    // Curly bangs over the forehead, under the brim.
    const fh = (x: number, y: number, lift: number): V3 => [x, y, faceZ(Math.abs(x), y) + lift];
    const bang = (pts: [number, number, number, number][]) => sdf.chain(pts.map(([x, y, l, r]) => [...fh(x, y, l), r] as [number, number, number, number]), 0.012);
    const bangs = sdf.union(
      bang([[0.0, 0.8, 0.0, 0.042], [0.03, 0.775, 0.022, 0.034], [0.055, 0.738, 0.018, 0.02], [0.078, 0.712, 0.01, 0.008]]),
      bang([[0.1, 0.8, 0.0, 0.04], [0.118, 0.775, 0.018, 0.032], [0.14, 0.735, 0.016, 0.02], [0.17, 0.706, 0.008, 0.008]]),
      bang([[-0.06, 0.8, 0.0, 0.04], [-0.07, 0.775, 0.02, 0.032], [-0.095, 0.738, 0.016, 0.02], [-0.12, 0.71, 0.008, 0.008]]),
      bang([[-0.14, 0.8, 0.0, 0.036], [-0.16, 0.77, 0.012, 0.028], [-0.178, 0.73, 0.01, 0.016], [-0.186, 0.7, 0.008, 0.007]]),
    );
    const sideburns = pair(sdf.cone([0.192, 0.705, 0.04], [0.196, 0.62, 0.064], 0.028, 0.012));
    const grooveStarts = [-60, -20, 20, 60, 100, 140, 180, 220, 260];
    const grooves = sdf.union(
      ...grooveStarts.map((g) =>
        sdf.chain(
          [
            [...hs(58, g, 0), 0.007],
            [...hs(76, g + 8, 0), 0.01],
            [...hs(96, g + 14, 0), 0.008],
          ],
          0.004,
        ),
      ),
    );
    const hair = volume
      .smoothUnion(0.02, sideburns)
      .smoothUnion(0.012, locks, bangs)
      .smoothSubtract(0.004, grooves)
      .paintWhere(grooves.round(0.003), T.hairDark, 0.006);
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ shirt, collar, pockets
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
            [0.138, 0.21],
            [0.14, 0.196],
            [0.13, 0.186],
            [0, 0.186],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    // Long sleeves to the wrist, each with a turned cuff.
    const sleeve = (s: V3, e: V3, w: V3, tagU: string, tagF: string) =>
      sdf.union(
        sdf.smoothUnion(0.012, sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 1.02), 0.048, 0.045)).bone(tagU),
        sdf
          .smoothUnion(
            0.01,
            sdf.cone(lerp(s, e, 0.98), lerp(e, w, 0.84), 0.045, 0.041),
            sdf.cone(lerp(e, w, 0.76), lerp(e, w, 0.9), 0.0445, 0.0445).round(0.005).paint(T.shade),
          )
          .bone(tagF),
      );
    const shirt = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW, WRIST, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'))
      // Fold lines: two soft creases fanning up from the belt and a shade at the shirt tail.
      .paintFn((x, y, z, base) => {
        if (z > 0 && y > 0.19 && y < 0.245) {
          if (Math.abs(Math.sin(x * 70 + y * 20)) < 0.05 && Math.abs(x) > 0.04) return rgb(T.shade);
        }
        if (y < 0.205 && y > 0.186) return rgb(T.shade);
        return base;
      });
    k.body('shirt', shirt, { color: T.shirt, roughness: 0.85 });

    // Raised patches that follow the torso: a shell of the torso cut by a box.
    const shellPatch = (x: number, y: number, w: number, h: number, lift: number) =>
      torso
        .round(lift)
        .subtract(torso.round(-0.002))
        .smoothIntersect(0.003, sdf.box([w, h, 0.3], Math.min(w, h) * 0.3).at(x, y, 0.15));
    const torsoZ = (x: number, y: number) => sdf.raycast(torso, [x, y, 1], [0, 0, -1])![2];
    const POCKET_Y = 0.345;
    const POCKET_X = 0.06;
    const pocket = (s: 1 | -1) =>
      sdf.union(
        shellPatch(s * POCKET_X, POCKET_Y, 0.056, 0.05, 0.007),
        shellPatch(s * POCKET_X, POCKET_Y + 0.03, 0.06, 0.02, 0.0095).paint(T.band),
      );
    const placket = shellPatch(0, 0.33, 0.028, 0.27, 0.0055);
    k.body('shirt-trim', sdf.union(pocket(1), pocket(-1), placket).bone('spine'), { color: T.shade, roughness: 0.85 });
    // The collar: a flat shell ring with a V opening in front.
    const collarRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.052, 0.496],
            [0.084, 0.49],
            [0.118, 0.466],
            [0.134, 0.446],
            [0.112, 0.434],
            [0.08, 0.454],
            [0.052, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    const vOpen = sdf
      .extrude(
        profile.polygon([
          [-0.04, 0.52],
          [0.04, 0.52],
          [0.0, 0.405],
        ]),
        0.3,
      )
      .at(0, 0, 0.15);
    k.body('collar', collarRing.subtract(vOpen).bone('chest'), { color: T.shade, roughness: 0.85, detail: 0.005 });

    // ------------------------------------------------------------------ shorts to the knee
    const shorts = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(
        sdf
          .smoothUnion(
            0.01,
            sdf.capsule([HIP[0], 0.2, 0], [0.093, 0.165, 0.003], 0.054),
            sdf.cylinder(0.059, 0.022, 0.009).at(0.093, 0.152, 0.003).paint(T.shade), // the turned hem
          )
          .bone('leg.L'),
      ),
    );
    k.body('shorts', shorts, { color: T.shade, roughness: 0.85 });
    // Knee-high socks between the boot tops and the bare knees, each with a banded top.
    const sock = sdf
      .union(
        sdf.cylinder(0.0385, 0.044, 0.012).at(0.0955, 0.106, 0),
        sdf.cylinder(0.04, 0.012, 0.004).at(0.0955, 0.122, 0).paint(T.band),
      )
      .bone('shin.L');
    k.body('socks', pair(sock), { color: '#ddd2b4', roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ leather: belt, pouches, straps
    const beltY = 0.245;
    const belt = torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.044, 0.5], 0.006).at(0, beltY, 0));
    const beltRims = sdf.union(
      ...[-0.0245, 0.0245].map((dy) => torso.round(0.0135).smoothIntersect(0.002, sdf.box([0.5, 0.007, 0.5], 0.002).at(0, beltY + dy, 0)).paint(C.leatherDark)),
    );
    const pouchAt = (s: 1 | -1) => sdf.surfacePoint(belt, [s * 0.11, beltY - 0.02, 0.2], 0);
    const pouchPose = (s: 1 | -1, shape: sdf.Shape) => {
      const p = pouchAt(s);
      return shape.rotateY(s * 40).at(p[0], p[1] - 0.03, p[2] + 0.006);
    };
    const pouchBody = sdf.union(
      sdf.box([0.06, 0.068, 0.038], 0.014),
      sdf.box([0.066, 0.03, 0.044], 0.01).at(0, 0.024, 0.002).paint(C.leatherDark),
    );
    const pouchButton = sdf.ellipsoid([0.007, 0.007, 0.005]).at(0, 0.008, 0.023);
    k.body('leather', sdf.union(belt, beltRims, pouchPose(1, pouchBody), pouchPose(-1, pouchBody)).bone('spine'), {
      color: C.leather,
      roughness: 0.6,
    });
    const strap = (s: 1 | -1) =>
      torso
        .round(0.01)
        .smoothIntersect(0.005, sdf.box([0.036, 0.5, 0.7], 0.006).rotateZ(s * 8).at(s * 0.072, 0.35, 0))
        .intersect(sdf.halfSpace([0, -1, 0], -0.27));
    k.body('straps', sdf.union(strap(1), strap(-1)).bone('spine'), { color: C.packDark, roughness: 0.6 });

    // ------------------------------------------------------------------ brass: buttons, buckles
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.062, 0.05, 0.014], 0.007).subtract(sdf.box([0.038, 0.028, 0.03], 0.006)), sdf.box([0.008, 0.032, 0.01], 0.003).at(0.004, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    const strapBuckles = hard(sdf.box([0.036, 0.03, 0.01], 0.004).subtract(sdf.box([0.022, 0.015, 0.03])).at(0.078, 0.36, 0.106));
    const button = (x: number, y: number, lift: number) =>
      sdf.ellipsoid([0.0085, 0.0085, 0.006]).at(x, y, torsoZ(Math.abs(x), y) + lift);
    const buttons = sdf.union(
      ...[0.435, 0.395, 0.355, 0.315, 0.275].map((y) => button(0, y, 0.0075)),
      button(POCKET_X, POCKET_Y + 0.03, 0.0125),
      button(-POCKET_X, POCKET_Y + 0.03, 0.0125),
      pouchPose(1, pouchButton),
      pouchPose(-1, pouchButton),
    );
    // The pack's brass (see the pack below).
    const packPose = (s: sdf.Shape) => s.rotateX(-4).at(0, 0.37, -0.118);
    const sack = sdf.smoothUnion(
      0.06,
      sdf.box([0.23, 0.29, 0.1], 0.05).at(0, 0.0, -0.06),
      sdf.ellipsoid([0.115, 0.15, 0.09]).at(0, -0.03, -0.088),
      sdf.ellipsoid([0.1, 0.1, 0.08]).at(0, 0.1, -0.08),
    );
    const packHit = (x: number, y: number) => sdf.raycast(sack, [x, y, -1], [0, 0, 1])!;
    const flapBuckleAt = packHit(0, -0.06);
    const flapBuckle = sdf
      .box([0.046, 0.04, 0.014], 0.006)
      .subtract(sdf.box([0.028, 0.022, 0.04], 0.004))
      .at(flapBuckleAt[0], flapBuckleAt[1], flapBuckleAt[2] - 0.016);
    const POCKET_PX = 0.135;
    const POCKET_PY = -0.075;
    const pocketButtons = hard(sdf.ellipsoid([0.008, 0.008, 0.006]).at(POCKET_PX, POCKET_PY + 0.03, -0.075 - 0.05));
    k.body(
      'brass',
      sdf.union(
        buckle.bone('spine'),
        strapBuckles.bone('spine'),
        buttons.bone('spine'),
        packPose(sdf.union(flapBuckle, pocketButtons)).bone('chest'),
      ),
      { color: C.brass, roughness: 0.4, metalness: 0.7, detail: 0.004 },
    );

    // ------------------------------------------------------------------ rope: three loops around the neck, over the collar
    const ropeLoop = (R: number, y: number, tilt: number, turn: number) =>
      sdf
        .torus(R, 0.012)
        .paintFn((x, z0, z, base) => {
          const u = Math.atan2(z, x);
          const v = Math.atan2(z0, Math.hypot(x, z) - R);
          return Math.sin(u * 30 + v * 2) > 0.25 ? rgb(C.ropeDark) : base;
        })
        .rotateY(turn)
        .rotateX(tilt)
        .scale([1, 1, 0.92])
        .at(0, y, -0.004);
    const neckRope = sdf.union(ropeLoop(0.115, 0.466, -4, 0), ropeLoop(0.106, 0.477, 3, 40), ropeLoop(0.097, 0.488, -2, 80));
    k.body('rope', neckRope.bone('chest'), {
      color: C.rope,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y, z) => 0.0016 * Math.sin(Math.atan2(z, x) * 34 + y * 320),
    });

    // ------------------------------------------------------------------ tall laced boots
    const shoeFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.05, 0.075, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shaft = sdf.cylinder(0.05, 0.034, 0.012).at(0, 0.082, 0);
    const cuff = sdf.cylinder(0.056, 0.014, 0.006).at(0, 0.097, 0).paint(C.bootTop);
    const welt = shoeFoot.round(0.004).smoothIntersect(0.003, sdf.box([0.2, 0.014, 0.25], 0.004).at(0, 0.024, 0.02)).paint(C.sole);
    const bootLocal = sdf
      .smoothUnion(0.012, shoeFoot.bone('foot.L'), shaft.bone('shin.L'))
      .union(cuff.bone('shin.L'), welt.bone('foot.L'))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.014), C.sole);
    const bootPose = (s: sdf.Shape) => s.rotateY(12).at(ANKLE[0], 0, 0);
    k.body('boots', pair(bootPose(bootLocal)), { color: C.boot, roughness: 0.6 });
    const bootSolid = sdf.union(shoeFoot, shaft);
    const lacesLocal = sdf.union(
      ...[0.1, 0.082, 0.064].flatMap((z) => {
        const h = sdf.raycast(bootSolid, [0, 0.3, z], [0, -1, 0])!;
        return [22, -22].map((a) => sdf.box([0.056, 0.007, 0.009], 0.003).rotateY(a).at(0, h[1] + 0.001, z));
      }),
      sdf.ellipsoid([0.01, 0.007, 0.007]).at(0.011, sdf.raycast(bootSolid, [0, 0.3, 0.064], [0, -1, 0])![1] + 0.007, 0.064),
      sdf.ellipsoid([0.01, 0.007, 0.007]).at(-0.011, sdf.raycast(bootSolid, [0, 0.3, 0.064], [0, -1, 0])![1] + 0.007, 0.064),
    );
    k.body('laces', pair(bootPose(lacesLocal.bone('foot.L'))), { color: C.lace, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ the backpack: a rounded box with side pockets
    const pack = sack;
    // The top lid: a shell over the top that hangs down the back with rounded corners, and a strap.
    const flapRegion = sdf.box([0.26, 0.2, 0.28], 0.06).at(0, 0.12, -0.08);
    const flap = sack.round(0.012).subtract(sack.round(-0.004)).smoothIntersect(0.006, flapRegion);
    const flapStrap = sack
      .round(0.02)
      .subtract(sack.round(-0.004))
      .smoothIntersect(0.004, sdf.box([0.034, 0.34, 0.5], 0.008).at(0, 0.05, -0.1))
      .intersect(sdf.halfSpace([0, 0, 1], -0.03));
    const pocketBox = hard(sdf.box([0.05, 0.13, 0.085], 0.022).at(POCKET_PX, POCKET_PY, -0.075));
    const pocketLid = hard(sdf.box([0.058, 0.04, 0.094], 0.014).at(POCKET_PX, POCKET_PY + 0.04, -0.075));
    k.body('pack', packPose(pack.smoothUnion(0.015, pocketBox)).bone('chest'), {
      color: C.pack,
      roughness: 0.65,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 120, y * 120, z * 120, 2),
    });
    k.body('pack-trim', packPose(sdf.union(flap, flapStrap, pocketLid)).bone('chest'), {
      color: C.packDark,
      roughness: 0.65,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 140, y * 140, z * 140, 2),
    });

    // The bedroll across the top of the pack, tied with two straps.
    const ROLL_Y = 0.21;
    const ROLL_Z = -0.125;
    const bedroll = sdf
      .cylinder(0.035, 0.16, 0.01)
      .rotateZ(90)
      .at(0, ROLL_Y, ROLL_Z)
      .paintFn((x, y, z, base) =>
        Math.abs(x) > 0.078 && Math.sin(Math.hypot(y - ROLL_Y, z - ROLL_Z) * 260) > 0.3 ? rgb('#3e5f54') : base,
      );
    k.body('bedroll', packPose(bedroll).bone('chest'), { color: '#5a8274', roughness: 0.85, detail: 0.004 });
    const rollStraps = sdf.union(...[-0.045, 0.045].map((x) => sdf.torus(0.037, 0.0055).rotateZ(90).at(x, ROLL_Y, ROLL_Z)));
    k.body('bedroll-straps', packPose(rollStraps).bone('chest'), { color: C.packDark, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ the lantern, hanging from the left fist
    // A dark iron cage (four bars, a top cap, a base, a ring handle) around orange glass and a
    // bright flame core. The fist holds the ring. The body is about 0.1 m tall.
    const LANTERN: V3 = [FIST_L[0], FIST_L[1] - 0.1, FIST_L[2]];
    const lanternFrame = sdf
      .smoothUnion(
        0.004,
        sdf.cylinder(0.04, 0.014, 0.005).at(0, -0.052, 0),
        sdf.cylinder(0.038, 0.012, 0.005).at(0, 0.052, 0),
        sdf.cone([0, 0.056, 0], [0, 0.078, 0], 0.036, 0.012),
        ...[0, 90, 180, 270].map((a) => sdf.capsule([0.036, -0.05, 0], [0.036, 0.05, 0], 0.0055).rotateY(a + 45)),
        sdf.torus(0.025, 0.0055).rotateX(90).at(0, 0.098, 0),
      )
      .at(...LANTERN);
    k.body('lantern-frame', lanternFrame.bone('lantern'), { color: '#3a3a40', roughness: 0.5, metalness: 0.6, detail: 0.005, maxTriangles: 3000 });
    k.body('lantern-glass', sdf.cylinder(0.035, 0.092, 0.012).at(...LANTERN).bone('lantern'), {
      color: '#d97a2a',
      roughness: 0.15,
      opacity: 0.85,
      emissive: '#ff9a3a',
      emissiveIntensity: 0.6,
    });
    const flameShape = sdf
      .smoothUnion(0.008, sdf.ellipsoid([0.015, 0.02, 0.015]).at(0, -0.012, 0), sdf.cone([0, -0.008, 0], [0, 0.03, 0], 0.011, 0.002))
      .at(...LANTERN);
    k.body('lantern-flame', flameShape.bone('lantern'), {
      color: '#ffe070',
      roughness: 0.4,
      emissive: '#ffd040',
      emissiveIntensity: 1.2,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ the rolled map in the right fist
    const R_MAP = 0.037;
    const mapRoll = sdf
      .cylinder(R_MAP, 0.19, 0.008)
      .rotateX(90)
      .at(0, 0, 0.045)
      .subtract(sdf.cylinder(0.016, 0.07, 0.002).rotateX(90).at(0, 0, 0.12))
      .union(sdf.torus(R_MAP + 0.002, 0.0055).rotateX(90).at(0, 0, 0.075).paint(C.mapRed));
    const mapPainted = mapRoll
      .paintWhere(sdf.cylinder(0.0165, 0.07).rotateX(90).at(0, 0, 0.12), '#4a3a24')
      // The spiral of the rolled sheet shows on the open end.
      .paintFn((x, y, z, base) => (z > 0.11 && Math.sin(Math.hypot(x, y) * 330) > 0.3 ? rgb(C.mapEdge) : base));
    k.body('map', rollPose(mapPainted), {
      bone: 'hand.R',
      color: C.map,
      roughness: 0.85,
      detail: 0.004,
      textureDensity: 2,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 200, y * 200, z * 200, 2),
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const ROLLF = { dir: ROLL_DIR, up: ROLL_UP };
    type P = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // He looks about with curiosity.
        head: { rotate: [0, 7 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        lantern: { rotate: [3 * wave(p, 1, 0.35), 0, 4 * wave(p, 1, 0.2)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        // The map points here and there.
        'hand.R': { rotate: [-5 * bump(p, 1, 0.2), 3 * wave(p, 1, 0.3), 0] },
      }),
    });

    // The legs come from motion.gait: planted stance feet, a knee lift in the swing, heel strike
    // and toe-off. The heel and the toe are the ends of the boot's sole at y = 0.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, { // left heel strike at 0.25, with the left arm back
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.093, 0, -0.021],
          toe: [0.108, 0, 0.087],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        // The lantern hangs plumb: it cancels the pitch of the spine, chest, and left arm, and
        // keeps a swing of its own a little after the steps.
        const armPitch = armSwing * s - armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s);
        const plumb = -0.85 * (lean * 1.5 + armPitch);
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          lantern: { rotate: [plumb + 8 * wave(p, 2, 0.2), 0, -6 + 8 * wave(p, 1, 0.3)] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          // The map arm swings less and holds the roll up a little, clear of the ground.
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -8] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03));

    // ---------------------------------------------------------------- attack: a lantern swing
    // Wind-up: the chest turns away and the lantern hand draws out and back; the lantern swings
    // back. Strike: the chest turns in, the right foot steps forward, and the lantern sweeps
    // forward and up in front of him while the map arm stays out.
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.42, 0.54, p) * (1 - ease(0.66, 1, p));
        const handL = keys(p, [
          [0, WRIST],
          [0.3, [0.255, 0.33, -0.085]],
          [0.42, [0.255, 0.33, -0.085]],
          [0.54, [0.17, 0.3, 0.13]],
          [0.7, [0.15, 0.29, 0.14]],
          [1, WRIST],
        ] as const);
        const armL = reach(ARM_L, handL, [0.5, 0.3, -0.3]);
        // The map hand holds the roll out forward, lifting it a little in the strike.
        const wristR = keys(p, [
          [0, WRIST_R],
          [0.3, [-0.21, 0.27, 0.04]],
          [0.54, [-0.14, 0.31, 0.12]],
          [0.8, [-0.16, 0.29, 0.1]],
          [1, WRIST_R],
        ] as const);
        const armR = reach(ARM_R, wristR, [-0.5, 0.25, -0.35]);
        const handR = orient([armR.upper, armR.lower], ROLLF, { dir: ROLL_DIR, up: ROLL_UP });
        // The right foot steps forward in the strike; the left foot stays planted.
        const step = ease(0.4, 0.52, p) * (1 - ease(0.7, 0.98, p));
        const hipsZ = -0.012 * wind + 0.03 * cut;
        const plant = (Math.asin(Math.max(-0.9, Math.min(0.9, hipsZ / 0.13))) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, Math.max(Math.abs(plant), 20 * step)) - 0.008 * wind, hipsZ], rotate: [0, -10 * wind + 10 * cut, 0] },
          spine: { rotate: [-3 * wind + 5 * cut, -6 * wind + 4 * cut, 0] },
          chest: { rotate: [-4 * wind + 3 * cut, -22 * wind + 18 * cut, 0] },
          head: { rotate: [-3 * wind + 3 * cut, 30 * wind - 26 * cut, 0] },
          lantern: { rotate: [50 * wind - 90 * cut, 0, -12 * wind + 6 * cut] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [plant, 12 * wind - 14 * cut, 0] },
          'leg.R': { rotate: [plant - 26 * step, 12 * wind - 14 * cut, 0] },
          'foot.L': { rotate: [-plant * 0.5, 0, 0] },
          'foot.R': { rotate: [20 * step - 20 * bump(Math.min(1, Math.max(0, (p - 0.4) / 0.14)) * 0.5), 0, 0] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- legs on the knees
    // A planted leg reaches from the hip through the knee to an ankle target in the hips' rest
    // frame (so it moves against the hips), and the foot takes the opposite turn: `pitch` > 0
    // points the toes down, < 0 lifts them. `yaw` is the hips' turn about Y; the foot then turns
    // back by it, so it keeps pointing to world +Z.
    const FLAT_FOOT = { dir: [0, 0, 1] as V3, up: [0, 1, 0] as V3 };
    const legTo = (side: 1 | -1, ankle: V3, pitch: number, yaw = 0) => {
      const m = (v: V3): V3 => (side > 0 ? v : mx(v));
      const a = (pitch * Math.PI) / 180;
      const c = Math.cos(-yaw * DEG), s = Math.sin(-yaw * DEG);
      const want = { dir: [Math.cos(a) * s, -Math.sin(a), Math.cos(a) * c] as V3, up: [Math.sin(a) * s, Math.cos(a), Math.sin(a) * c] as V3 };
      if (Math.hypot(ankle[0] - ANKLE[0], ankle[1] - ANKLE[1], ankle[2] - ANKLE[2]) < 1e-6) {
        return { leg: [0, 0, 0] as V3, shin: [0, 0, 0] as V3, foot: orient([], FLAT_FOOT, want) };
      }
      const { upper, lower } = reach({ root: m(HIP), mid: m(KNEE), end: m(ANKLE) }, m(ankle), m([KNEE[0], KNEE[1], 0.3]));
      return { leg: upper, shin: lower, foot: orient([upper, lower], FLAT_FOOT, want) };
    };
    // A world point into the hips' rest frame, for hips that move by `move` and turn by `yaw`
    // degrees about their vertical axis (x = z = 0).
    const intoHips = (w: V3, move: V3, yaw: number): V3 => {
      const c = Math.cos(-yaw * DEG), s = Math.sin(-yaw * DEG);
      const x = w[0] - move[0], z = w[2] - move[2];
      return [x * c + z * s, w[1] - move[1], -x * s + z * c];
    };

    // ---------------------------------------------------------------- attack2: a lunging thrust
    // Draw the sword back to the right hip with the point forward (hold, coiled), then drive the
    // point straight ahead along one line as the right foot lunges forward and the chest turns in.
    // The flat stays level, the point leads. Then pull back and recover.
    // The point must fly straight at the foe in the world, so undo the lunge's chest turn (32 deg
    // about Y) and lean (16 deg about X) to get the direction in the chest's rest frame.
    const toChest = (v: V3, yaw: number, pitch: number): V3 => {
      const cy = Math.cos(-yaw * DEG), sy = Math.sin(-yaw * DEG);
      const a: V3 = [v[0] * cy + v[2] * sy, v[1], -v[0] * sy + v[2] * cy];
      const cp = Math.cos(-pitch * DEG), sp = Math.sin(-pitch * DEG);
      return [a[0], a[1] * cp - a[2] * sp, a[1] * sp + a[2] * cp];
    };
    const THRUST_DIR = norm(toChest([0.05, 0.02, 1], 32, 16));
    const LEVEL = perp([0, 1, 0], THRUST_DIR);
    // The legs: the right foot lifts, swings forward toes up, lands heel first 16.6 cm ahead, and
    // rolls flat around the planted heel. The hips drop 4 cm and move 11.3 cm forward, so the front
    // knee bends over the foot (the shin about vertical) and the rear leg straightens back while
    // its heel lifts around the planted toe. In the recovery the front foot steps back to its spot.
    // The sole's heel is 2.1 cm behind the ankle and its toe 8.7 cm ahead, both 7 cm below it.
    const STEP = 0.166;
    const SINK = 0.04;
    const HIPS_FWD = 0.113; // with the step and the sink, the rear leg is straight (99 percent of its length)
    const TOES_UP = -20; // the front foot's pitch at the heel strike
    const HEEL_LIFT = 7; // the rear foot's pitch around its toe at full extension
    const onHeel = (heelZ: number, pitch: number): [number, number] => {
      const a = pitch * DEG;
      return [ANKLE[1] * Math.cos(a) - 0.021 * Math.sin(a), heelZ + 0.021 * Math.cos(a) + ANKLE[1] * Math.sin(a)];
    };
    const onToe = (pitch: number): V3 => {
      const a = pitch * DEG;
      return [ANKLE[0], 0.087 * Math.sin(a) + ANKLE[1] * Math.cos(a), 0.087 * (1 - Math.cos(a)) + ANKLE[1] * Math.sin(a)];
    };
    const HEEL_AT = STEP - 0.021;
    const STRIKE = onHeel(HEEL_AT, TOES_UP);
    const frontFoot = (p: number): { at: V3; pitch: number } => {
      if (p < 0.47) {
        // Lift, carry forward with the toes coming up, and put the heel down.
        const s = Math.min(1, Math.max(0, (p - 0.36) / 0.11));
        const e = s * s * (3 - 2 * s);
        return { at: [-ANKLE[0], ANKLE[1] + (STRIKE[0] - ANKLE[1]) * e + 0.025 * Math.sin(Math.PI * s), STRIKE[1] * e], pitch: TOES_UP * e };
      }
      if (p < 0.68) {
        // Roll down onto the sole around the planted heel.
        const pitch = TOES_UP * (1 - ease(0.47, 0.53, p));
        const [y, z] = onHeel(HEEL_AT, pitch);
        return { at: [-ANKLE[0], y, z], pitch };
      }
      // Push off and step back to the rest spot.
      const s = Math.min(1, (p - 0.68) / 0.24);
      const e = s * s * (3 - 2 * s);
      return { at: [-ANKLE[0], ANKLE[1] + 0.02 * Math.sin(Math.PI * s), STEP * (1 - e)], pitch: 6 * Math.sin(Math.PI * s) };
    };
    k.animation('attack2', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(p, [
          [0, WRIST_R],
          [0.3, [-0.22, 0.29, -0.07]],
          [0.4, [-0.22, 0.295, -0.075]],
          [0.5, [-0.11, 0.33, 0.155]],
          [0.62, [-0.11, 0.33, 0.16]],
          [1, WRIST_R],
        ] as const, 'smooth');
        const dir = norm(
          keys(p, [
            [0, ROLL_DIR],
            [0.3, THRUST_DIR],
            [0.62, THRUST_DIR],
            [1, ROLL_DIR],
          ] as const),
        );
        const up = norm(keys(p, [[0, ROLL_UP], [0.3, LEVEL], [0.62, LEVEL], [1, ROLL_UP]] as const));
        const arm = reach(ARM_R, wrist, [-0.6, -0.1, -0.3]);
        const hand = orient([arm.upper, arm.lower], ROLLF, { dir, up });
        const coil = ease(0.02, 0.32, p) * (1 - ease(0.4, 0.5, p));
        const lunge = ease(0.4, 0.5, p) * (1 - ease(0.64, 1, p));
        const handL = keys(p, [
          [0, WRIST],
          [0.3, [0.24, 0.3, -0.05]],
          [0.42, [0.24, 0.3, -0.05]],
          [0.52, [0.25, 0.27, -0.06]],
          [0.64, [0.25, 0.27, -0.06]],
          [1, WRIST],
        ] as const);
        const armL = reach(ARM_L, handL, [0.5, 0.3, -0.3]);
        // The body drive: the hips follow the step down and forward, then rise back in the recovery.
        const drive = ease(0.37, 0.53, p) * (1 - ease(0.66, 0.98, p));
        const move: V3 = [0, -0.012 * coil - SINK * drive, -0.015 * coil + HIPS_FWD * drive];
        // The hips turn only 4 deg into the lunge (the feet stay square); the spine takes the rest
        // of the old 10 deg, so the chest and the sword turn as before.
        const yaw = -14 * coil + 4 * drive;
        const front = frontFoot(p);
        const legR = legTo(-1, mx(intoHips(front.at, move, yaw)), front.pitch, yaw);
        const legL = legTo(1, intoHips(onToe(HEEL_LIFT * drive), move, yaw), HEEL_LIFT * drive, yaw);
        return {
          hips: { move, rotate: [0, yaw, 0] },
          spine: { rotate: [2 * coil + 12 * lunge, -6 * coil + 16 * lunge - 4 * drive, 0] },
          chest: { rotate: [-2 * coil + 4 * lunge, -18 * coil + 16 * lunge, 0] },
          head: { rotate: [-2 * coil - 10 * lunge, 28 * coil - 20 * lunge, 0] },
          lantern: { rotate: [40 * lunge - 10 * coil, 0, -6 * coil] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
        } as P;
      },
    });

    // ---------------------------------------------------------------- hit: snap back from a blow
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.18, 1], [0.35, 0.85], [1, 0]] as const);
        const back = -0.022 * h;
        const lean = (Math.asin(back / 0.13) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, lean), back], rotate: [0, 6 * h, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, 8 * h, 4 * h] },
          head: { rotate: [-16 * h, -8 * h, -6 * h] },
          lantern: { rotate: [-14 * h, 0, 8 * h] },
          'leg.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean, 0, 0] },
          'foot.L': { rotate: [-lean, 0, 0] },
          'foot.R': { rotate: [-lean, 0, 0] },
          'upperarm.L': { rotate: [-20 * h, 0, 28 * h] },
          'upperarm.R': { rotate: [-24 * h, 0, -30 * h] },
          'forearm.L': { rotate: [-20 * h, 0, 0] },
          'forearm.R': { rotate: [-26 * h, 0, 0] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- death: stagger back, then fall face down under the pack
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.1, 1], [0.24, 0.3], [0.34, 0]] as const);
        const sag = keys(p, [[0.14, 0], [0.36, 1]] as const);
        // The fall: 0 standing, 1 on the ground; a small bounce at the impact.
        const fall = keys(p, [[0.3, 0], [0.62, 1.03], [0.7, 0.97], [0.78, 1]] as const, 'smooth');
        const f2 = fall * fall;
        // On the ground the chest frame is turned about 86 deg forward: the blade then points
        // along his body toward the feet (chest -Y) with its flat facing the sky (chest -Z).
        const upperR: V3 = [-24 * hitB - 20 * sag * (1 - fall) - 30 * fall, 0, -30 * sag - 8 * fall];
        const lowerR: V3 = [-20 * sag * (1 - fall) - 10 * fall, 0, 0];
        // Mid-fall the blade points almost straight down; tip it out to his right for a moment
        // so the point touches the floor and does not go into it.
        const tipOut = keys(p, [[0.36, 0], [0.48, 1], [0.6, 0]] as const, 'smooth');
        const handR = orient([upperR, lowerR], ROLLF, {
          dir: norm(lerp(lerp(lerp(ROLL_DIR, [0, -0.2, 1], 0.6 * sag), [-0.25, -1, 0.1], fall), [-1, -0.2, 0.1], 0.3 * tipOut)),
          up: norm(lerp(ROLL_UP, [0, 0.1, -1], fall)),
        });
        return {
          hips: {
            move: [0, -0.016 * sag - 0.042 * fall, -0.02 * hitB + 0.13 * f2],
            rotate: [86 * f2, 8 * sag, 6 * fall],
          },
          spine: { rotate: [-10 * hitB + 8 * sag - 4 * fall, 0, 0] },
          chest: { rotate: [-10 * hitB + 6 * sag - 6 * fall, 0, 0] },
          neck: { rotate: [-12 * fall, 0, 0] },
          head: { rotate: [-16 * hitB + 10 * sag - 12 * fall, 20 * fall, 10 * sag - 4 * fall] },
          lantern: { rotate: [-10 * hitB - 20 * fall, 0, 15 * fall] },
          // The legs straighten back along the ground, the feet turned out.
          'leg.L': { rotate: [-6 * sag - 44 * fall, 0, 10 * fall] },
          'leg.R': { rotate: [4 * sag - 40 * fall, 0, -12 * fall] },
          'foot.L': { rotate: [30 * fall, 0, 0] },
          'foot.R': { rotate: [30 * fall, 0, 0] },
          // The arms flail out in the stagger, then lie out beside his body, well clear of the
          // head; the sword stays in the hand and lies flat beside his hip.
          'upperarm.L': { rotate: [-24 * hitB - 20 * sag * (1 - fall) - 30 * fall, 0, 30 * sag + 8 * fall] },
          'upperarm.R': { rotate: upperR },
          'forearm.L': { rotate: [-20 * sag * (1 - fall) - 10 * fall, 0, 0] },
          'forearm.R': { rotate: lowerR },
          'hand.R': { rotate: handR },
        } as P;
      },
    });

    // ---------------------------------------------------------------- victory: a jump with the sword thrust up
    // An anticipation crouch on bent knees with the arms pulled down, a push-off that straightens
    // the legs, a jump of about 9 cm with the knees tucked and the toes pointing down, the sword
    // thrust up at the top, and a landing on both feet that the knees absorb with a small bounce.
    // The legs use legTo (above attack2): the soles stay flat on the floor.
    const JUMP = 0.09; // the hips' rise at the top of the jump
    const DROP = 0.045; // the depth of the anticipation crouch
    const [T_OFF, T_TOP, T_LAND] = [0.3, 0.41, 0.52];
    const FIST_BACK: V3 = [0.215, 0.222, -0.035];
    const FIST_LIST: readonly (readonly [number, V3])[] = [[0, WRIST], [0.2, FIST_BACK], [0.25, FIST_BACK], [0.34, [0.21, 0.37, 0.1]], [0.46, [0.19, 0.33, 0.075]]];
    k.animation('victory', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        // The hips' height: the crouch, a push-off that speeds up, a parabola in the air, then the
        // landing dip and a smaller second dip.
        let h: number;
        if (p < 0.24) h = -DROP * ease(0, 0.2, p);
        else if (p < T_OFF) h = -DROP * (1 - ((p - 0.24) / (T_OFF - 0.24)) ** 2);
        else if (p < T_LAND) h = (4 * JUMP * (p - T_OFF) * (T_LAND - p)) / (T_LAND - T_OFF) ** 2;
        else if (p < 0.6) h = -0.034 * Math.sin(((Math.PI / 2) * (p - T_LAND)) / (0.6 - T_LAND));
        else h = -0.034 * keys(p, [[0.6, 1], [0.7, 0.12], [0.77, 0.28], [0.9, 0]] as const);
        const bend = Math.max(0, -h) / DROP; // 1 at the bottom of the crouch
        const air = Math.max(0, h) / JUMP; // 1 at the top of the jump
        const flight = p > T_OFF && p < T_LAND ? Math.sin((Math.PI * (p - T_OFF)) / (T_LAND - T_OFF)) : 0;
        // In the air the knees tuck (the ankles come up under the hips) and the toes point down,
        // but never lower than the floor.
        const tuck = 0.025 * flight;
        const pitch = Math.min(26, (Math.max(0, h) + tuck) / 0.0025);
        // The hips sit back a little over the heels when they drop.
        const back = -0.25 * Math.max(0, -h);
        const ankle: V3 = [ANKLE[0], ANKLE[1] - Math.min(0, h) + tuck, -back];
        const legL = legTo(1, ankle, pitch);
        const legR = legTo(-1, ankle, pitch);
        // The arms pull down and back in the crouch and swing up in the push-off; the sword gets
        // to its full height at the top of the jump. The fist rises out to his right side (never
        // in front of the face), the blade up and out.
        const pull = keys(p, [[0, 0], [0.2, 1], [0.25, 1], [0.31, 0]] as const);
        const raise = ease(0.26, T_TOP, p);
        const wrist = lerp(lerp(WRIST_R, [-0.21, 0.222, -0.012], pull), [-0.285, 0.47, 0.07], raise);
        const dir = norm(lerp(lerp(ROLL_DIR, [-0.12, -0.1, 1], pull), [-0.8, 0.55, 0.15], raise));
        const arm = reach(ARM_R, wrist, [-0.6, 0.1, -0.3]);
        // The flat faces out to his right, so the guard runs front to back, not toward his cheek.
        const hand = orient([arm.upper, arm.lower], ROLLF, { dir, up: norm(lerp(ROLL_UP, [-1, 0.4, 0], raise)) });
        // The left fist (with the map) swings back in the crouch, up in the push-off, and pumps
        // down to his hip in triumph.
        const armL = reach(ARM_L, keys(p, FIST_LIST), [0.3, 0.1, -0.25]);
        // The lantern lags behind the jump and swing after the landing.
        const swing = keys(p, [[T_LAND, 0], [0.6, 1], [1, 0]] as const);
        return {
          hips: { move: [0, h, back] },
          spine: { rotate: [10 * bend - 4 * air - 6 * raise, 0, 0] },
          chest: { rotate: [6 * bend - 6 * raise, 8 * raise, 0] },
          head: { rotate: [-3 * bend - 12 * raise, 8 * raise, -6 * raise] },
          lantern: { rotate: [-18 * air + 10 * bend + 8 * swing * wave(p, 2), 0, 6 * swing * wave(p, 2, 0.25)] },
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
        } as P;
      },
    });
  },
});
