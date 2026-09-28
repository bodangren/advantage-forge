import { defineAsset, motion, profile, sdf } from '../src/index.js';

/**
 * Priest — Chibi Quest P1 hero, about 1.0 m tall, faces +Z. Base: assets/cleric.ts (skeleton,
 * knee bones, clip set), with the rogue's young, round, beardless human face and proportions.
 * Target: docs/hero-mockups/priest_001.jpg (one front view; the side and the back are designed here).
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the face, the gold stole, and the
 *   sun staff must read.
 * One idea: a kind young priest in a long white vestment with a broad gold stole, a short staff
 *   crowned with a gold sunburst in the right hand and a small holy book in the left.
 * Silhouette: a big head with a tall wave of dark hair and big ears, a straight white robe to the
 *   ankles with wide bell sleeves, round brown shoes under the hem, the sunburst beside the hip.
 * Proportions: hair top 1.0, eyes 0.628, chin 0.48, shoulders 0.385, gold yoke to 0.37, hem band
 *   0.1 to 0.135, robe hem 0.068, sunburst center 0.43 (radius 0.08).
 * Palette (60/30/10): warm white robe #f2ede3; gold stole, yoke, and hem band #e2b23a; dark brown
 *   hair #2e211a; peach skin #f2c7a4; brown wood, book cover, and shoes #5a3822.
 * Value plan: the dark hair frames the light face (focal point); the gold stole and cross are the
 *   second contrast on the white robe; the dark sunburst core and book cover frame the sides.
 * Bodies: skin, hair (with the brows), robe (with the white collar), trim (yoke, stole, hem band,
 *   fringe), sleeves, gold (the cross on the stole), pants (hidden legs), shoes, staff,
 *   staff-gold (the sunburst), holy-flash, book, holy-cross.
 * Rig: the cleric's chibi skeleton with knees, without the beard bone, plus `skirt` (the robe below
 *   the waist sways), `sun` (the holy flash at the staff head, scaled up in the attack), and `relic`
 *   (the cross on the book, scaled up in the blessing). The staff is rigid on the right hand, the
 *   book on the left hand. Clips: idle, walk, run, attack (the sun staff raised with a flash of holy
 *   light), attack2 (a blessing with the book), hit, death, victory.
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
  hair: '#2e211a',
  robe: '#f2ede3',
  trim: '#e2b23a',
  gold: '#e3b440',
  pants: '#4a3c34',
  shoe: '#5a3822',
  sole: '#3a2416',
  wood: '#6a4226',
  core: '#4a2a16',
  cover: '#5a3622',
  pages: '#efe4c6',
  panel: '#efe2bc',
  goldPaint: '#d9a93a',
  holy: '#ffd45a',
  flashBase: '#3a2410',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');

// Joints: human shoulders like the rogue's. The forearms point forward and a little down; the
// right fist holds the staff upright beside the hip, the left fist holds the book.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.322, -0.01];
const WRIST_R: V3 = [-0.225, 0.248, 0.068];
const ELBOW_L: V3 = [0.19, 0.322, -0.01];
const WRIST_L: V3 = [0.225, 0.248, 0.068];
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
const HAND_R = { pitch: -84, roll: 8 };
const HAND_L = { pitch: -70, roll: 20 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);
const GRIP = handPoint(HAND_R, WRIST_R, [-0.008 * FIST, -0.044 * FIST, 0.004 * FIST]);
const STAFF_AXIS = norm(rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll));

// The staff: grip in the fist, a short wooden shaft, the sunburst on top (its face toward +Z).
const STAFF_DOWN = (GRIP[1] - 0.078) / STAFF_AXIS[1];
const SUN_T = 0.19; // the sunburst's center, along the staff from the grip
const staffAt = (t: number): V3 => add(GRIP, [STAFF_AXIS[0] * t, STAFF_AXIS[1] * t, STAFF_AXIS[2] * t]);
const SUN_AT = staffAt(SUN_T);
const SUN_TILT = { x: 90 + HAND_R.pitch, z: HAND_R.roll };
const SUN_FACE = norm(rotZ(rotX([0, 0, 1], SUN_TILT.x), SUN_TILT.z));

// The book: small, upright, cover toward +Z, spine on the -X edge (in the fist), turned out a little.
const BOOK_TURN = { y: 25, z: -6 };
const BOOK_AT: V3 = [0.272, 0.252, 0.128];
const bookDir = (p: V3) => rotZ(rotY(p, BOOK_TURN.y), BOOK_TURN.z);
const RELIC_AT = add(BOOK_AT, bookDir([0.004, 0, 0.018]));

/** A star outline with n points (one points up): R the tips, r the notches. */
const star = (n: number, R: number, r: number, turn = 0) =>
  profile.polygon(
    Array.from({ length: n * 2 }, (_, i) => {
      const a = ((i * 180) / n + 90 + turn) * rad;
      const d = i % 2 ? r : R;
      return [Math.cos(a) * d, Math.sin(a) * d] as [number, number];
    }),
  );

export default defineAsset({
  name: 'priest',
  description: 'Chibi young priest hero in a white vestment with a gold stole, a gold sunburst staff, and a small holy book.',
  detail: 0.005,
  reference: 'docs/hero-mockups/priest_001.jpg',
  // Color slots for individual priests (the first option is the default look). Hair covers the
  // hair and the brows; trim is the vestment's gold cloth (yoke, stole, hem band, fringe).
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#1e1916', blond: '#c9a05a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    trim: { gold: C.trim, silver: '#a7b6c8', crimson: '#9a2c34' },
  },
  presets: {
    moon: { eyes: 'blue', hair: 'blond', skin: 'fair', trim: 'silver' },
    martyr: { eyes: 'brown', hair: 'black', skin: 'tan', trim: 'crimson' },
    pilgrim: { eyes: 'green', hair: 'brown', skin: 'brown', trim: 'gold' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    // The blush, the mouth, and the nose tip keep their pink but take half of the skin's recoloring.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', -0.3),
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
      relic: { parent: 'hand.L', at: RELIC_AT },
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

    // ------------------------------------------------------------------ head and face (the rogue's)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    // A round button nose, a little bigger than the rogue's.
    const noseZ = faceZ(0, 0.568);
    const nose = sdf.ellipsoid([0.026, 0.022, 0.02]).at(0, 0.568, noseZ - 0.002).bone('head');
    // Big round ears that stand out from the head.
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.066, 0.05])
        .subtract(sdf.sphere(0.026).at(0.02, 0, 0.012))
        .rotateY(-40)
        .at(0.214, 0.6, -0.012)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(lerp(mx(SHOULDER), ELBOW_R, 0.35), ELBOW_R, 0.034, 0.032).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.034, 0.03).bone('forearm.R'),
      handPose(HAND_R, WRIST_R)(fistLocal(-1)).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(lerp(SHOULDER, ELBOW_L, 0.35), ELBOW_L, 0.034, 0.032).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.034, 0.03).bone('forearm.L'),
      handPose(HAND_L, WRIST_L)(fistLocal(1)).bone('hand.L'),
    );

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.055, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] + 0.004));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    // Both highlights sit up and to the +X side: one light for the whole face.
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    const smile = sdf.extrude(profile.arc(0.06, 0.009, 245, 295), 0.3).at(0, 0.522 + 0.06, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.558));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armR, armL)
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
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair and brows
    // A thick cap over the skull with a tall wave on top; the face and the ears stay clear, and the
    // hair ends at the nape.
    const faceMask = sdf.ellipsoid([0.235, 0.235, 0.23]).rotateZ(6).at(0, 0.615, 0.17);
    const cap = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([HEAD[0] + 0.035, HEAD[1] + 0.035, HEAD[2] + 0.024]).at(0, HEAD_Y + 0.025, -0.004),
        pair(sdf.ellipsoid([0.075, 0.085, 0.12]).at(0.2, 0.79, -0.005)), // full sides over the temples
        sdf.ellipsoid([0.2, 0.055, 0.16]).at(0, 0.9, -0.01),
      )
      .smoothSubtract(0.02, faceMask)
      .smoothSubtract(0.015, pair(sdf.ellipsoid([0.075, 0.07, 0.085]).at(0.225, 0.598, -0.005)))
      .intersect(sdf.halfSpace(norm([0, -1, -0.35]), -0.53));
    // The big swoop: from the part on +X over the forehead, down to the right temple (-X).
    const swoop = sdf.chain(
      [
        [0.13, 0.905, 0.06, 0.045],
        [0.03, 0.93, 0.125, 0.05],
        [-0.08, 0.905, 0.155, 0.048],
        [-0.17, 0.85, 0.13, 0.04],
        [-0.225, 0.78, 0.08, 0.03],
        [-0.235, 0.71, 0.05, 0.016],
      ],
      0.03,
    );
    // A second wave rolls down on the +X side to the left temple.
    const wave2 = sdf.chain(
      [
        [0.04, 0.945, 0.0, 0.045],
        [0.15, 0.922, 0.04, 0.05],
        [0.23, 0.85, 0.04, 0.04],
        [0.245, 0.77, 0.02, 0.026],
        [0.235, 0.705, 0.01, 0.014],
      ],
      0.03,
    );
    // A forelock falls from the swoop over the right side of the forehead (the mockup's fringe).
    const forelock = sdf.chain(
      [
        [-0.02, 0.868, 0.1, 0.032],
        [-0.08, 0.838, 0.114, 0.03],
        [-0.13, 0.8, 0.118, 0.023],
        [-0.156, 0.772, 0.112, 0.011],
      ],
      0.02,
    );
    // Soft ridges fan out from the crown: thick clay locks.
    const locks = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z + 0.06) * 6 + y * 8);
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
      .smoothUnion(0.03, cap, swoop, wave2, forelock)
      .displace(0.003, locks)
      .union(brow(1), brow(-1));
    k.body('hair', hairShape, { color: T.hair, roughness: 0.55, detail: 0.004, bone: 'head' });

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
            [0.156, 0.16],
            [0.164, 0.1],
            [0.166, 0.078],
            [0.158, 0.068],
            [0, 0.068],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.86]);
    // Three bands follow three bones: the chest, the waist (spine), and the skirt below 0.23.
    const SKIRT_Y = 0.23;
    const CHEST_Y = 0.33;
    const banded = (s: sdf.Shape) =>
      sdf.union(
        s.intersect(sdf.halfSpace([0, -1, 0], -CHEST_Y)).bone('chest'),
        s.intersect(sdf.halfSpace([0, 1, 0], CHEST_Y)).intersect(sdf.halfSpace([0, -1, 0], -SKIRT_Y)).bone('spine'),
        s.intersect(sdf.halfSpace([0, 1, 0], SKIRT_Y)).bone('skirt'),
      );
    // The white clerical collar stands up around the neck.
    const collarBand = sdf.cylinder(0.058, 0.034, 0.008).at(0, 0.472, -0.008).bone('chest');
    k.body('robe', sdf.union(banded(robeShape), collarBand), { color: C.robe, roughness: 0.8, detail: 0.006 });

    // Gold vestment trim: a round yoke over the shoulders with a rolled rim at the neck, a broad
    // stole down the front and the back, a band above the hem, and a fringe under the stole.
    const yoke = robeShape
      .round(0.012)
      .smoothIntersect(0.006, sdf.halfSpace([0, -1, 0], -0.376))
      .smoothIntersect(0.006, sdf.cylinder(0.118, 0.4, 0.01).at(0, 0.5, 0))
      .bone('chest');
    const yokeRim = sdf.torus(0.07, 0.013).scale([1, 1, 0.92]).at(0, 0.458, -0.008).bone('chest');
    const stolePanel = (z: number) => sdf.extrude(profile.rect([0.15, 0.34], 0.012), 0.4).at(0, 0.24, z);
    const stoleEdge = (z: number) => stolePanel(z).subtract(sdf.extrude(profile.rect([0.128, 0.4], 0.01), 0.5).at(0, 0.24, z));
    const stole = robeShape
      .round(0.01)
      .smoothIntersect(0.003, sdf.union(stolePanel(0.2), stolePanel(-0.2)))
      .paintWhere(sdf.union(stoleEdge(0.2), stoleEdge(-0.2)), T.trimDark, 0.002);
    const hemBand = robeShape
      .round(0.006)
      .smoothIntersect(0.004, sdf.box([0.6, 0.034, 0.6], 0.004).at(0, 0.118, 0))
      .bone('skirt');
    const hemZ = sdf.raycast(robeShape, [0, 0.09, 1], [0, 0, -1])![2];
    const fringe = sdf
      .union(
        ...Array.from({ length: 9 }, (_, i) => {
          const x = -0.06 + i * 0.015;
          const z = hemZ + 0.004 - x * x * 1.5;
          return sdf.capsule([x, 0.085, z], [x, 0.052, z + 0.002], 0.0055);
        }),
      )
      .bone('skirt');
    k.body('trim', sdf.union(yoke, yokeRim, banded(stole), hemBand, fringe.paint(T.trimDark)), {
      color: T.trim,
      roughness: 0.42,
      metalness: 0.2,
      detail: 0.005,
    });

    // The gold cross on the stole: a long upright with round knobs at the ends.
    const crossZ = sdf.raycast(robeShape, [0, 0.3, 1], [0, 0, -1])![2] + 0.012;
    const knob = (x: number, y: number) => sdf.sphere(0.016).at(x, y, 0);
    const stoleCross = sdf
      .smoothUnion(
        0.008,
        sdf.capsule([0, 0.228, 0], [0, 0.382, 0], 0.011),
        sdf.capsule([-0.046, 0.292, 0], [0.046, 0.292, 0], 0.011),
        knob(0, 0.226),
        knob(0, 0.384),
        knob(-0.05, 0.292),
        knob(0.05, 0.292),
      )
      .scale([1, 1, 0.55])
      .at(0, 0, crossZ);
    k.body('gold', banded(stoleCross), { color: C.gold, roughness: 0.28, metalness: 0.9 });

    // ------------------------------------------------------------------ bell sleeves
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
      roughness: 0.8,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ legs (hidden) and shoes
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.08]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0], 0.085, 0.004], 0.044).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85, detail: 0.007 });
    // Round brown shoes: a soft toe, a short heel, a dark sole.
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.05, 0.08, 0.02).at(0, 0.055, 0), sdf.ellipsoid([0.058, 0.05, 0.095]).at(0, 0.04, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shoe = shoeFoot
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.sole)
      .rotateY(8)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.4 });

    // ------------------------------------------------------------------ the sun staff (right hand)
    const sunPose = (s: sdf.Shape) => s.rotateX(SUN_TILT.x).rotateZ(SUN_TILT.z).at(...SUN_AT);
    // The sunburst, built at its own origin: Y up the staff, its face toward +Z.
    const dome = sdf.sphere(0.04).scale([1, 1, 0.55]);
    const staff = sdf.union(sdf.capsule(staffAt(-STAFF_DOWN), staffAt(SUN_T - 0.06), 0.016), sunPose(dome).paint(C.core));
    k.body('staff', staff, { color: C.wood, roughness: 0.45, bone: 'hand.R' });
    const sunLocal = sdf.union(
      sdf.extrude(star(12, 0.082, 0.05), 0.014, 0.003),
      sdf.torus(0.045, 0.008).rotateX(90),
      sdf.smoothUnion(0.006, sdf.cylinder(0.021, 0.022, 0.005).at(0, -0.072, 0), sdf.sphere(0.02).at(0, -0.054, 0)),
    );
    k.body('staff-gold', sunPose(sunLocal), { color: C.gold, roughness: 0.28, metalness: 0.9, bone: 'hand.R' });
    // The holy flash: a small glowing star hidden inside the dark core at rest; the attack scales
    // its bone up, so it bursts out over the sunburst and fades back in.
    const flashLocal = sdf.union(sdf.extrude(star(8, 0.034, 0.011, 22.5), 0.01, 0.002), sdf.sphere(0.017));
    k.body('holy-flash', sunPose(flashLocal), {
      color: C.flashBase,
      roughness: 0.5,
      emissive: C.holy,
      emissiveIntensity: 2.2,
      bone: 'sun',
    });

    // ------------------------------------------------------------------ the holy book (left hand)
    const bookPose = (s: sdf.Shape) => s.rotateY(BOOK_TURN.y).rotateZ(BOOK_TURN.z).at(...BOOK_AT);
    const coverShape = sdf.box([0.105, 0.15, 0.036], 0.008);
    const pagesCut = sdf.box([0.11, 0.136, 0.024]).at(0.008, 0, 0);
    const frame = (w: number, h: number) => sdf.extrude(profile.rect([w, h], 0.008), 0.02).at(0.005, 0, 0.018);
    const bookLocal = sdf
      .union(coverShape.subtract(pagesCut), sdf.box([0.1, 0.136, 0.024], 0.003).at(0.004, 0, 0).paint(C.pages))
      .paintWhere(frame(0.078, 0.118), C.goldPaint, 0.002)
      .paintWhere(frame(0.064, 0.104), C.panel, 0.002);
    k.body('book', bookPose(bookLocal), { color: C.cover, roughness: 0.6, bone: 'hand.L', textureDensity: 1.5 });
    // A small gold cross on the cover glows a little; the blessing scales it up out of the book.
    const bookCross = sdf.union(
      sdf.extrude(profile.rect([0.009, 0.05], 0.003), 0.008),
      sdf.extrude(profile.rect([0.034, 0.009], 0.003), 0.008).at(0, 0.009, 0),
    );
    k.body('holy-cross', bookPose(bookCross.at(0.005, 0, 0.019)).bone('relic'), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.6,
      emissive: C.holy,
      emissiveIntensity: 0.45,
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
    // turns so the staff points along its own keys (orient). STAFF.up is the sunburst's face normal.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const STAFF = { dir: STAFF_AXIS, up: SUN_FACE };
    const BOOK = { dir: norm(bookDir([0, 1, 0])), up: norm(bookDir([0, 0, 1])) };
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

    // attack: the priest raises the sun staff high beside him (out on the right, never over the
    // head), thrusts it up once, and the sunburst flashes with holy light: a glowing star bursts out
    // of the core, pulses, and fades; then he lowers the staff. He leans away from the staff and
    // looks up at it; the book arm draws in.
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
          ...bookPoseAt(lerp(WRIST_L, [0.24, 0.275, 0.1], raise), BOOK.dir, BOOK.up),
          hips: { move: [0, 0.006 * thrust - 0.004 * raise, 0] },
          skirt: { rotate: [2 * raise - 2 * thrust, 0, 0] },
          spine: { rotate: [-3 * raise, 0, -2 * raise] },
          chest: { rotate: [-4 * raise - 3 * thrust, -8 * raise, -4 * raise] },
          head: { rotate: [-9 * raise, -10 * raise, -4 * raise] },
        };
      },
    });

    // attack2: a blessing. The priest plants the staff, turns his left side forward, and holds the
    // holy book out at shoulder height beside him, the cover toward the target; the cross on the
    // cover flares out of the book, big and bright, pulses, and settles.
    k.animation('attack2', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const lift = ease(0.04, 0.32, p) * (1 - ease(0.8, 1, p));
        const flare = ease(0.36, 0.46, p) * (1 - ease(0.64, 0.82, p));
        const pulse = 0.2 * bump(clamp01((p - 0.44) / 0.2), 2);
        const wrist = keys(p, [[0, WRIST_L], [0.32, [0.28, 0.42, 0.1]], [0.8, [0.28, 0.43, 0.1]], [1, WRIST_L]] as const);
        // The cover turns to face forward, a little up and out; the book stands upright.
        const want = {
          dir: norm(lerp(BOOK.dir, norm([0.05, 1, -0.2]), lift)),
          up: norm(lerp(BOOK.up, norm([0.3, 0.25, 1]), lift)),
        };
        const s = 1 + 2.4 * flare + pulse;
        return {
          ...bookPoseAt(wrist, want.dir, want.up, [0.6, 0.1, -0.3]),
          relic: { scale: [s, s, s], move: [0.015 * flare, 0.015 * flare, 0.06 * flare] },
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
    // feet, the book beside his left. The robe skirt follows the legs.
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
    // jump thrusts the sun staff up beside his head (out on the right, never over it); the book stays
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
        // The right arm reaches up and out to the side, so the sunburst stays clear of the hair.
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
