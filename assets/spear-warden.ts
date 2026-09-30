import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Spear warden — Chibi Quest hero (catalog `heroes/martial/spear-warden`), about 1.12 m to the top
 * of the helmet crest, the spear above that (1.5 m), faces +Z. Target:
 * docs/hero-mockups/spear-warden_001.jpg (the mockup's beard is skipped: every hero on this set is
 * beardless). Built on the samurai (the paladin's body, face, and skeleton with knee bones).
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the red crest, the bronze helmet, the
 * green cloth, and the tall spear must read.
 * One idea: a bronze-helmed temple warden under a tall red horsehair crest of stacked flat locks,
 *   a long leaf-bladed spear upright in the right hand, a short javelin low in the left.
 * Shape language: round and friendly (face, cheeks, fists), with a secondary hard language in the
 *   flat crest locks, the leaf blade, and the stepped pauldron.
 * Palette (60/30/10): bronze #b08a3a with #7a5a20 shadow (helmet, pauldron, rows, buckle, blades);
 *   leather #8a5a35 with #6b4226 rows (cuirass, tassets, sandals); green cloth #4a8a4a with #2e6a34
 *   folds (collar, skirt panel, cape); crest red #b83a3a with #8a2424 grooves (the accent).
 *   Skin #f2c7a4, hair #2e1e14, spear shaft #4a2e1c, belt #4e2d1c.
 * Value plan: the red crest and the bronze helmet frame the pale face; the dark leather and green
 *   cloth hold the body; bronze lights the edges.
 * Bodies: skin, hair, helmet, helmet-dark, crest, torso-skin, skirt, cuirass, rows, belt, buckle,
 *   buckle-dark, collar, collar-edge, panel, panel-trim, tassets, cape, pauldron, pauldron-trim,
 *   limbs, rings, hands, sandals, straps, greaves, spear, spear-bronze, spear-tassel, javelin,
 *   javelin-blade.
 * Rig: the samurai skeleton; the `plume` bone sways the crest. The spear is rigid on hand.R (upright
 *   beside the right shoulder, the butt on the ground), the javelin rigid on hand.L. Clips: idle,
 *   walk, run, attack (a spear thrust along the right side), attack2 (a sweeping spear spin), hit,
 *   death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#10202c',
  iris: '#5a3720',
  irisLow: '#8a5a3a',
  pupil: '#0d1114',
  lid: '#16100c',
  brow: '#2a1c12',
  mouth: '#a4503f',
  hair: '#2e1e14',
  hairDark: '#3e2a1c',
  bronze: '#c99a30',
  bronzeDark: '#86601f',
  red: '#b83a3a',
  redDark: '#8a2424',
  green: '#4a8a4a',
  greenDark: '#2e6a34',
  gold: '#e0bb50',
  leather: '#8a5a35',
  leatherDark: '#6b4226',
  belt: '#4e2d1c',
  shaft: '#4a2e1c',
  sole: '#3a2a24',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. The right forearm brings the fist out to the spear, the left forearm carries the javelin.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.335, -0.005];
const WRIST_R: V3 = [-0.255, 0.305, 0.07];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.2, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const HEEL: V3 = [0.096, 0, -0.008];
const TOE: V3 = [0.117, 0, 0.09];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const rad = Math.PI / 180;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => scl(a, 1 / Math.hypot(a[0], a[1], a[2]));

/** The shaft direction of a local +Y axis, turned to `d`: the rotateX and rotateZ that do it. */
const aim = (d: V3) => ({ a: Math.asin(d[2]) / rad, b: Math.atan2(-d[0], d[1]) / rad });

/** A fist around a pole: the pole runs along local Y, the knuckles face +Z. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.04, 0.036, 0.042]),
    sdf.capsule([-0.006 * s, -0.022, 0.034], [-0.006 * s, 0.022, 0.034], 0.017),
    sdf.cone([0.026 * s, 0.022, 0.012], [0.004 * s, 0.03, 0.04], 0.016, 0.012),
  );

// The spear at rest: leaning out 5 degrees, its axis through the right fist, the butt on the floor.
const TILT = 5;
const SD0: V3 = [-Math.sin(TILT * rad), Math.cos(TILT * rad), 0];
const UP0: V3 = [0, 0, 1];
const fistDir = norm(sub(WRIST_R, ELBOW_R));
const GRIP_R: V3 = add(WRIST_R, scl(fistDir, 0.037));
const SPEAR_GRIP = GRIP_R[1] / SD0[1]; // the grip's distance from the butt along the shaft
const BUTT: V3 = [GRIP_R[0] + SPEAR_GRIP * Math.sin(TILT * rad), 0.001, GRIP_R[2]];
// The javelin: held low, pointing forward and out, a third of its length behind the fist.
const DL = norm([0.25, 0.707, 0.66]); // the javelin: up and forward at about 45 degrees
const GRIP_L: V3 = add(WRIST_L, scl(norm(sub(WRIST_L, ELBOW_L)), 0.037));
const JAV_BUTT = sub(GRIP_L, scl(DL, 0.12));

/** Leather lamellar rows (normal map only). */
const scales = (x: number, y: number, z: number) => {
  const s = 0.024;
  const row = Math.floor(y / s);
  const arcLen = Math.atan2(x, z) * 0.13;
  const u = (arcLen + (row & 1) * (s / 2)) / s;
  const fx = u - Math.floor(u) - 0.5;
  const fy = y / s - row;
  const d = Math.hypot(fx * 1.1, (fy - 0.25) * 0.9);
  return 0.0016 * Math.max(0, 1 - d * 1.5);
};

export default defineAsset({
  name: 'spear-warden',
  description: 'Chibi spear warden hero with a bronze helmet and tall red crest, a leather lamellar cuirass, a long leaf-bladed spear, and a javelin.',
  detail: 0.006,
  reference: 'docs/hero-mockups/spear-warden_001.jpg',
  variants: {
    eyes: { brown: C.iris, green: '#3d7a45', blue: '#2f6aa8' },
    hair: { black: C.hair, brown: '#4a2e1c', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    cloth: { green: C.green, red: '#a83a32', blue: '#3f5f8a' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'black', skin: 'fair', cloth: 'green' },
    red: { eyes: 'green', hair: 'auburn', skin: 'tan', cloth: 'red' },
    blue: { eyes: 'blue', hair: 'brown', skin: 'fair', cloth: 'blue' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('cloth'),
      clothFold: k.tint('cloth', { color: C.greenDark, follow: 1 }),
      clothUnder: k.tint('cloth', { color: '#3d7a35', follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const PLUME_AT: V3 = [0.0, 0.87, -0.02];
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: PLUME_AT, tail: [0, 0.95, -0.02] },
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
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.027, 0.042, 0.034])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.012)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.022));
    const pupil = pair(at(sdf.ellipsoid([0.028, 0.032, 0.07]), EYE[0], EYE[1] + 0.001));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Level, calm brows a little lower at the inner ends.
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.024, 70, 106), 0.3).at(0.1, 0.705 - 0.16, 0.1).rotateZ(-5));
    const smile = sdf.extrude(profile.arc(0.07, 0.011, 250, 290), 0.3).at(0, 0.528 + 0.07, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: fringe, temples, nape (locks)
    const hp = (x: number, y: number, z: number, r: number, lift = 0.2): [number, number, number, number] => {
      const s = sdf.surfacePoint(head, [x * 3, HEAD_Y + (y - HEAD_Y) * 3, z * 3], r * lift);
      return [s[0], s[1], s[2], r];
    };
    const fringe = (x: number, lean: number, len: number, r: number) =>
      sdf.chain(
        [
          hp(x, 0.76, 0.19, r * 1.2),
          hp(x + lean * 0.5, 0.74, 0.19, r),
          hp(x + lean, 0.74 - len, 0.19, r * 0.45),
        ],
        0.008,
      );
    const fringeLocks = pair(
      sdf.union(fringe(0.055, 0.008, 0.02, 0.017), fringe(0.095, 0.012, 0.024, 0.018), fringe(0.135, 0.016, 0.02, 0.017), fringe(0.168, 0.012, 0.014, 0.015)),
    );
    const temples = pair(
      sdf.union(
        sdf.chain([hp(0.196, 0.75, 0.02, 0.026), hp(0.205, 0.69, 0.022, 0.022), hp(0.212, 0.63, 0.03, 0.01)], 0.015),
        sdf.chain([hp(0.17, 0.75, 0.1, 0.018), hp(0.18, 0.7, 0.08, 0.014), hp(0.19, 0.665, 0.07, 0.007)], 0.012),
      ),
    );
    const nape = (x: number, len: number) =>
      sdf.chain([hp(x, 0.64, -0.17, 0.024, 0.15), hp(x * 1.05, 0.58, -0.19, 0.022, 0.15), hp(x * 1.1, 0.58 - len, -0.2, 0.008, 0.15)], 0.012);
    const napeLocks = sdf.union(nape(0, 0.09), ...[0.05, 0.1, 0.15].flatMap((x) => [nape(x, 0.075), nape(-x, 0.075)]));
    k.body('hair', sdf.union(fringeLocks, temples, napeLocks).bone('head'), { color: T.hair, roughness: 0.6, detail: 0.006 });

    // ------------------------------------------------------------------ bronze helmet
    const dome = sdf
      .ellipsoid([HEAD[0] + 0.022, HEAD[1] + 0.024, HEAD[2] + 0.022])
      .at(0, HEAD_Y + 0.012, -0.008)
      .intersect(sdf.halfSpace([0, -1, 0], -0.738))
      // Angular crown: the vertical corners are chamfered, so the dome reads as a faceted bronze cap.
      .smoothIntersect(0.008, sdf.box([0.42, 1, 0.41], 0.01).rotateY(45).at(0, 0.7, -0.008))
      .smoothIntersect(0.006, sdf.box([0.47, 1.0, 0.46], 0.012).at(0, 0.5, -0.008));
    const rimBand = dome.round(0.016).intersect(sdf.box([1, 0.05, 1]).at(0, 0.77, 0));
    // The neck guard flares out behind; the ears and the face stay open.
    const guardShape = sdf
      .revolve(
        profile.polygon(
          [
            [0.205, 0.75],
            [0.226, 0.7],
            [0.238, 0.66],
            [0.242, 0.625],
            [0.224, 0.618],
            [0.216, 0.66],
            [0.208, 0.7],
            [0.19, 0.735],
          ],
          { smooth: true, samples: 4 },
        ),
      )
      .scale([1, 1, 0.95])
      .at(0, 0, -0.012)
      .intersect(sdf.halfSpace([0, 0, 1], -0.05));
    // Brow plate: a flat pentagon 0.08 wide on the forehead, tipped back so its point meets the skin.
    const domeFront = sdf.raycast(dome, [0, 0.78, 1], [0, 0, -1])![2];
    const pent = profile.polygon([
      [-0.045, 0.045],
      [0.045, 0.045],
      [0.05, -0.005],
      [0, -0.058],
      [-0.05, -0.005],
    ]);
    const plateAt = (s: sdf.Shape) => s.rotateX(14).at(0, 0.742, domeFront - 0.008);
    const plate = plateAt(sdf.extrude(pent, 0.06, 0.004));
    const plateRim = plateAt(
      sdf
        .extrude(profile.offsetProfile(pent, 0.0035), 0.068, 0.003)
        .subtract(sdf.extrude(profile.offsetProfile(pent, -0.009), 0.3)),
    );
    // Nose ridge: a thin bar from the brow plate down the bridge of the nose.
    const nb0 = faceZ(0, 0.695);
    const nb1 = faceZ(0, 0.6);
    const ridge = sdf.capsule([0, 0.7, nb0 + 0.012], [0, 0.6, nb1 + 0.022], 0.0095).scale([1, 1, 0.8]).at(0, 0, 0);
    // Cheek guards: flat pentagon plates 0.05 x 0.065 x 0.012 hanging from the rim beside the eyes.
    const chx = 0.176;
    const chy = 0.703;
    const chz = faceZ(chx, chy);
    const chPhi = Math.atan2(chx / (HEAD[0] * HEAD[0]), chz / (HEAD[2] * HEAD[2])) / rad;
    const cheekP = profile.polygon([
      [-0.025, 0.032],
      [0.025, 0.032],
      [0.025, -0.008],
      [0, -0.033],
      [-0.025, -0.008],
    ]);
    const cheekAt = (sh: sdf.Shape) => sh.rotateY(chPhi).at(chx + 0.004 * Math.sin(chPhi * rad), chy, chz + 0.004 * Math.cos(chPhi * rad));
    const cheek = pair(cheekAt(sdf.extrude(cheekP, 0.012, 0.003)));
    const cheekRim = pair(
      cheekAt(
        sdf
          .extrude(profile.offsetProfile(cheekP, 0.003), 0.017, 0.002)
          .subtract(sdf.extrude(profile.offsetProfile(cheekP, -0.006), 0.3)),
      ),
    );
    const helmet = sdf
      .smoothUnion(0.01, dome, rimBand, guardShape, plate, ridge, cheek)
      .paintWhere(sdf.box([1, 0.05, 1]).at(0, 0.77, 0), C.bronzeDark, 0.004)
      .paintWhere(sdf.box([0.04, 1, 1]).at(0, 0.9, 0), C.bronzeDark, 0.004);
    k.body('helmet', helmet.bone('head'), { color: C.bronze, roughness: 0.35, metalness: 0.9, detail: 0.006 });
    // Rims and trim: raised plate edge, cheek edge, the lower edge of the neck guard, studs on the band.
    const guardEdge = guardShape.round(0.005).intersect(sdf.box([1, 0.022, 1]).at(0, 0.626, 0));
    const studs = sdf.union(
      ...[-80, -58, -36, -14, 14, 36, 58, 80].map((a) => {
        const s = sdf.surfacePoint(rimBand, [0.4 * Math.sin(a * rad), 0.77, 0.4 * Math.cos(a * rad) - 0.008], 0.004);
        return sdf.sphere(0.0065).at(s[0], s[1], s[2]);
      }),
    );
    k.body('helmet-dark', sdf.union(plateRim, cheekRim, guardEdge, studs).bone('head'), {
      color: C.bronzeDark,
      roughness: 0.35,
      metalness: 0.9,
      detail: 0.006,
    });

    // The crest: one broad swept fin from the brow to the nape, 0.03 thick, fanned with 6 grooves
    // (paint and bump) so it reads as horsehair feathers.
    const finSide: [number, number][] = [
      [0.14, 0.83],
      [0.155, 0.9],
      [0.13, 0.97],
      [0.08, 1.05],
      [0.02, 1.105],
      [-0.05, 1.125],
      [-0.12, 1.09],
      [-0.18, 1.02],
      [-0.235, 0.94],
      [-0.215, 0.89],
      [-0.15, 0.85],
      [-0.08, 0.82],
      [0.0, 0.84],
      [0.08, 0.82],
    ];
    const fin = sdf
      .extrude(profile.polygon(finSide.map(([z, y]) => [-z, y] as [number, number]), { smooth: true, samples: 6 }), 0.03, 0.01)
      .rotateY(90);
    const PZ = -0.06;
    const PY = 0.8;
    const grooveAt = [-50, -31, -12, 7, 26, 44];
    const grooveD = (y: number, z: number) => {
      const t = Math.atan2(PZ - z, y - PY) / rad;
      return Math.min(...grooveAt.map((g) => Math.abs(t - g)));
    };
    const crest = fin.paintFn((x, y, z, base) => {
      const d = grooveD(y, z);
      const shade = y < 0.93 ? mixRgb(base, rgb(C.redDark), 0.55) : base;
      return d < 2.6 && y > 0.88 ? mixRgb(shade, rgb(C.redDark), 0.9) : shade;
    });
    k.body('crest', crest, {
      color: C.red,
      roughness: 0.7,
      bone: 'plume',
      detail: 0.005,
      bump: (x, y, z) => -0.0022 * Math.max(0, 1 - grooveD(y, z) / 3.4) + 0.0008 * noise.noise3(x * 120, y * 40, z * 120),
    });

    // ------------------------------------------------------------------ torso: skin, skirt, cuirass, belt
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
            [0.138, 0.2],
            [0.14, 0.165],
            [0.132, 0.152],
            [0, 0.152],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    k.body('torso-skin', torso.round(0.003).intersect(sdf.halfSpace([0, -1, 0], -0.33)), { color: T.skin, roughness: 0.55, bone: 'chest', detail: 0.008 });
    // The cloth skirt under the belt, in the darker fold green, over a pelvis that hides in it.
    const skirt = torso.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.262));
    const skirtFolds = sdf.union(...[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map((a) => sdf.box([0.012, 1, 0.7]).rotateY(a)));
    k.body('skirt', skirt.paintWhere(skirtFolds, T.clothFold, 0.004), {
      color: T.clothUnder,
      roughness: 0.85,
      bone: 'hips',
      detail: 0.008,
      bump: (x, y, z) => 0.0015 * Math.sin(Math.atan2(z, x) * 14),
    });

    const cuirass = torso
      .round(0.012)
      .intersect(sdf.halfSpace([0, -1, 0], -0.262))
      .intersect(sdf.halfSpace([0, 1, 0], 0.412))
      .paintFn((x, y, z, base) => (scales(x, y, z) > 0.0003 ? base : mixRgb(base, rgb(C.leatherDark), 0.9)));
    k.body('cuirass', cuirass, { color: C.leather, roughness: 0.65, bone: 'chest', bump: scales });
    // Four bronze rows, each a thin band over the lamellar.
    const rowY = [0.286, 0.322, 0.358, 0.394];
    const rows = sdf.union(...rowY.map((y) => torso.round(0.0165).smoothIntersect(0.003, sdf.box([0.6, 0.008, 0.6], 0.003).at(0, y, 0))));
    k.body('rows', rows, { color: C.bronze, roughness: 0.45, metalness: 0.7, bone: 'chest', bump: scales, detail: 0.008 });
    // The gold chest plate over the leather: two pectoral bulges, a sternum ridge, an abdomen band, and rims.
    const torsoZ = (x: number, y: number) => sdf.raycast(torso, [x, y, 1], [0, 0, -1])![2];
    const pecX = 0.052;
    const pecY = 0.362;
    const pecZ = torsoZ(pecX, pecY) - 0.004;
    const pec = (sx: number) => sdf.ellipsoid([0.058, 0.043, 0.032]).at(sx * pecX, pecY, pecZ);
    const sternum = sdf.capsule([0, 0.41, torsoZ(0, 0.41) + 0.006], [0, 0.318, torsoZ(0, 0.318) + 0.008], 0.011);
    const abdomen = torso.round(0.021).smoothIntersect(0.004, sdf.box([0.6, 0.03, 0.6], 0.005).at(0, 0.3, 0));
    k.body('chest-plate', sdf.smoothUnion(0.012, pec(1), pec(-1), sternum, abdomen), {
      color: C.bronze,
      roughness: 0.35,
      metalness: 0.9,
      bone: 'chest',
      detail: 0.0065,
    });
    const pecRim = (sx: number) => sdf.torus(0.056, 0.0055).scale([1, 1, 0.76]).rotateX(90).at(sx * pecX, pecY, pecZ + 0.008);
    const abdomenRim = torso.round(0.0235).smoothIntersect(0.002, sdf.box([0.6, 0.006, 0.6], 0.002).at(0, 0.3 - 0.0185, 0));
    k.body('chest-rims', sdf.union(pecRim(1), pecRim(-1), abdomenRim), {
      color: C.bronzeDark,
      roughness: 0.35,
      metalness: 0.9,
      bone: 'chest',
      detail: 0.0075,
    });

    // The belt with a sun disc buckle.
    const beltY = 0.252;
    const belt = torso.round(0.024).smoothIntersect(0.005, sdf.box([0.5, 0.042, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt, { color: C.belt, roughness: 0.7, bone: 'spine' });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const discAt = (s: sdf.Shape) => s.at(0, beltY, beltZ + 0.004);
    const disc = discAt(
      sdf.smoothUnion(
        0.004,
        sdf.cylinder(0.033, 0.011, 0.004).rotateX(90),
        sdf.torus(0.033, 0.005).rotateX(90).at(0, 0, 0.004),
      ),
    );
    k.body('buckle', disc, { color: C.bronze, roughness: 0.4, metalness: 0.75, bone: 'spine', detail: 0.003 });
    const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((a) =>
      sdf.box([0.0075, 0.02, 0.006], 0.0025).at(0, 0.0215, 0.008).rotateZ(a),
    );
    k.body('buckle-dark', discAt(sdf.union(sdf.sphere(0.0115).at(0, 0, 0.009), ...rays)), {
      color: C.bronzeDark,
      roughness: 0.5,
      metalness: 0.7,
      bone: 'spine',
      detail: 0.003,
    });

    // Six leather pteruges strips (0.035 wide, 0.012 thick, gold tips) hang over the green underskirt.
    const strip = sdf
      .box([0.035, 0.09, 0.012], 0.004)
      .paintWhere(sdf.box([1, 0.018, 1]).at(0, -0.043, 0), C.gold, 0.002)
      .paintWhere(sdf.box([1, 0.006, 1]).at(0, 0.03, 0), C.leatherDark, 0.002);
    const pteruge = (x: number) => {
      const zz = 0.108 * Math.sqrt(Math.max(0, 1 - (x / 0.14) ** 2)) + 0.02;
      return strip.rotateX(-8).rotateY(Math.asin(x / 0.14) / rad).at(x, beltY - 0.012 - 0.045, zz);
    };
    k.body('pteruges', hard(sdf.union(pteruge(0.016), pteruge(0.048), pteruge(0.08))), {
      color: C.leather,
      roughness: 0.65,
      bone: 'hips',
      bump: scales,
      detail: 0.005,
    });
    const tassetPlate = sdf
      .box([0.056, 0.09, 0.012], 0.004)
      .paintWhere(sdf.box([1, 0.012, 1]).at(0, -0.042, 0), C.bronze, 0.002)
      .paintWhere(sdf.box([1, 0.006, 1]).at(0, 0.0, 0), C.leatherDark, 0.002);
    const tasset = (a: number) =>
      tassetPlate
        .rotateX(-9)
        .rotateY(a)
        .at(0.154 * Math.sin(a * rad), 0.205, 0.124 * Math.cos(a * rad));
    k.body('tassets', hard(sdf.union(tasset(48), tasset(82), tasset(122))), {
      color: C.leather,
      roughness: 0.65,
      bone: 'hips',
      bump: scales,
      detail: 0.006,
    });

    // ------------------------------------------------------------------ collar, cape
    const collarAt = (s: sdf.Shape) => s.at(0, 0.442, -0.004);
    const collar = collarAt(sdf.torus(0.083, 0.024).scale([1, 0.85, 0.88]));
    k.body('collar', collar, { color: T.cloth, roughness: 0.85, bone: 'chest', bump: (x, y, z) => 0.0015 * Math.sin(Math.atan2(z, x) * 16) });
    k.body('collar-edge', collarAt(sdf.torus(0.1, 0.0065).scale([1, 1, 0.88]).at(0, -0.014, 0)), {
      color: C.bronze,
      roughness: 0.4,
      metalness: 0.75,
      bone: 'chest',
      detail: 0.007,
    });
    // The cape: a fuller cloth shell, 0.2 m wide, from the shoulders down the back to the skirt hem,
    // flaring toward the hem, with a gold clasp at each shoulder.
    const capeBase = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.475],
            [0.1, 0.468],
            [0.135, 0.42],
            [0.15, 0.34],
            [0.162, 0.25],
            [0.176, 0.16],
            [0, 0.16],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.92]);
    const capeRegion = sdf.box([0.2, 0.33, 0.4], 0.01).at(0, 0.315, -0.2);
    const folds = sdf.union(...[166, 175, 185, 194].map((a) => sdf.box([0.012, 1, 0.7]).rotateY(a)));
    const cape = capeBase
      .round(0.008)
      .subtract(capeBase.round(-0.006))
      .intersect(capeRegion)
      .paintWhere(folds, T.clothFold, 0.004);
    k.body('cape', cape, { color: T.cloth, roughness: 0.85, bone: 'chest', detail: 0.008, bump: (x, y, z) => 0.0014 * Math.sin(x * 160) });
    const clasp = (sx: number) => sdf.smoothUnion(0.004, sdf.sphere(0.017).at(sx * 0.082, 0.456, -0.03), sdf.torus(0.018, 0.0045).rotateX(90).at(sx * 0.082, 0.456, -0.016));
    k.body('clasps', hard(clasp(1)), { color: C.bronze, roughness: 0.35, metalness: 0.9, bone: 'chest', detail: 0.004 });

    // ------------------------------------------------------------------ left pauldron, arms, rings, fists
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.1 * s, 0.066 * s, 0.096 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.003);
    const lamePlace = (s: number, dy: number) => lame(s).at(0, dy, 0);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-26).at(0.158, 0.436, 0).bone('upperarm.L');
    k.body('pauldron', pair(pauldronPose(sdf.union(lamePlace(0.74, 0.008), lamePlace(0.88, -0.026), lamePlace(1.0, -0.06)))), {
      color: C.bronze,
      roughness: 0.45,
      metalness: 0.7, detail: 0.008 });
    const edge = (s: number, dy: number) =>
      lame(s)
        .round(0.003)
        .smoothIntersect(0.004, sdf.box([0.4, 0.013, 0.4]).at(0, -0.009 * s, 0))
        .at(0, dy, 0);
    k.body('pauldron-trim', pair(pauldronPose(sdf.union(edge(0.74, 0.008), edge(0.88, -0.026), edge(1.0, -0.06)))), {
      color: C.bronzeDark,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.009,
    });
    const upper = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 1.1), 0.055, 0.048).bone(tag);
    const fore = (e: V3, w: V3, tag: string) => sdf.cone(e, lerp(e, w, 1.02), 0.045, 0.036).bone(tag);
    const arm = (s: V3, e: V3, w: V3, sd: string) =>
      sdf.smoothUnion(0.015, upper(s, e, `upperarm.${sd}`), fore(e, w, `forearm.${sd}`));
    const legs = pair(
      sdf.smoothUnion(
        0.012,
        sdf.cone(HIP, KNEE, 0.058, 0.05).bone('leg.L'),
        sdf.cone(KNEE, lerp(KNEE, ANKLE, 1.4), 0.05, 0.039).bone('shin.L'),
      ),
    );
    const pelvis = sdf.ellipsoid([0.125, 0.06, 0.09]).at(0, 0.2, 0).bone('hips');
    k.body('limbs', sdf.union(arm(SHOULDER, ELBOW_L, WRIST_L, 'L'), arm(mx(SHOULDER), ELBOW_R, WRIST_R, 'R'), legs, pelvis), {
      color: T.skin,
      roughness: 0.55, detail: 0.008 });
    const ring = (s: V3, e: V3, t: number, tag: string) => {
      const d = norm(sub(e, s));
      const a = Math.asin(d[2]) / rad;
      const b = Math.atan2(-d[0], d[1]) / rad;
      const c = lerp(s, e, t);
      return sdf.torus(0.056, 0.0115).rotateX(a).rotateZ(b).at(c[0], c[1], c[2]).bone(tag);
    };
    k.body('rings', sdf.union(ring(SHOULDER, ELBOW_L, 0.78, 'upperarm.L'), ring(mx(SHOULDER), ELBOW_R, 0.78, 'upperarm.R')), {
      color: C.bronze,
      roughness: 0.4,
      metalness: 0.75,
      detail: 0.007,
    });
    const fistAt = (g: V3, d: V3, s: 1 | -1) => {
      const { a, b } = aim(d);
      return fistLocal(s).rotateX(a).rotateZ(b).at(...g);
    };
    k.body('hands', sdf.union(fistAt(GRIP_L, DL, 1).bone('hand.L'), fistAt(GRIP_R, SD0, -1).bone('hand.R')), {
      color: T.skin,
      roughness: 0.55,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ greaves and sandals
    const greave = pair(
      sdf
        .cone(lerp(KNEE, ANKLE, 0.05), lerp(KNEE, ANKLE, 0.95), 0.056, 0.047)
        .round(0.002)
        .subtract(sdf.cone(lerp(KNEE, ANKLE, -0.1), lerp(KNEE, ANKLE, 1.0), 0.05, 0.04))
        .bone('shin.L'),
    );
    const greaveRims = pair(
      sdf
        .union(
          sdf.torus(0.055, 0.0065).at(...lerp(KNEE, ANKLE, 0.06)),
          sdf.torus(0.048, 0.0065).at(...lerp(KNEE, ANKLE, 0.92)),
          sdf.cone([KNEE[0], KNEE[1] + 0.012, KNEE[2] + 0.05], [KNEE[0], KNEE[1] + 0.005, KNEE[2] + 0.085], 0.019, 0.004),
        )
        .bone('shin.L'),
    );
    k.body('greaves', greave, { color: C.bronze, roughness: 0.45, metalness: 0.7, detail: 0.009 });
    k.body('greave-rims', greaveRims, { color: C.bronzeDark, roughness: 0.5, metalness: 0.7, detail: 0.009 });
    const sandalFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.052, 0.06, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.058, 0.05, 0.102]).at(0, 0.045, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const footPose = (s: sdf.Shape) => s.rotateY(12).at(ANKLE[0], 0, 0);
    const sandal = sandalFoot.paintWhere(sdf.halfSpace([0, 1, 0], 0.02), C.sole, 0.004);
    k.body('sandals', pair(footPose(sandal).bone('foot.L')), { color: C.leatherDark, roughness: 0.7, detail: 0.007 });
    const sp = (x: number, y: number, z: number, r: number): [number, number, number, number] => {
      const s = sdf.surfacePoint(sandalFoot, [x, y, z], 0.002);
      return [s[0], s[1], s[2], r];
    };
    const straps = sdf.union(
      sdf.chain([sp(-0.06, 0.06, 0.03, 0.008), sp(0, 0.13, 0.03, 0.008), sp(0.06, 0.06, 0.03, 0.008)], 0.006),
      sdf.chain([sp(0, 0.1, 0.12, 0.007), sp(0.02, 0.11, 0.07, 0.008), sp(0.05, 0.07, 0.04, 0.008)], 0.006),
      sdf.chain([sp(0, 0.1, 0.12, 0.007), sp(-0.02, 0.11, 0.07, 0.008), sp(-0.05, 0.07, 0.04, 0.008)], 0.006),
    );
    k.body('straps', pair(footPose(straps).bone('foot.L')), { color: C.leather, roughness: 0.7, detail: 0.007 });

    // ------------------------------------------------------------------ the spear (right hand) and the javelin (left hand)
    const SP_TOP = 1.5;
    const spearPose = (s: sdf.Shape) => s.rotateZ(TILT).at(...BUTT);
    const shaftLen = 1.3;
    const shaft = sdf.capsule([0, 0, 0], [0, shaftLen, 0], 0.014).paintFn((x, y, z, base) => (y > 0.22 && y < 0.36 ? mixRgb(base, rgb('#2e1c10'), 0.6) : base));
    k.body('spear', spearPose(shaft), {
      color: C.shaft,
      roughness: 0.75,
      bone: 'hand.R',
      detail: 0.004,
      bump: (x, y, z) => 0.0007 * noise.noise3(x * 80, y * 10, z * 80),
    });
    // A bigger leaf head: 0.27 long, 0.1 wide, with a midrib and dark rims, on a gold collar.
    const HEAD_LEN = 0.27;
    const leaf = profile.polygon(
      (
        [
          [-0.014, 0.0],
          [0.014, 0.0],
          [0.032, 0.035],
          [0.05, 0.09],
          [0.037, 0.16],
          [0.015, 0.23],
          [0, 0.27],
          [-0.015, 0.23],
          [-0.037, 0.16],
          [-0.05, 0.09],
          [-0.032, 0.035],
        ] as [number, number][]
      ).map(([x, y]) => [x, y] as [number, number]),
      { smooth: true, samples: 4 },
    );
    const bladeAt = (s: sdf.Shape) => s.at(0, SP_TOP - HEAD_LEN, 0);
    const blade = bladeAt(
      sdf.smoothUnion(
        0.006,
        sdf.extrude(leaf, 0.01, 0.004),
        sdf.capsule([0, 0.0, 0], [0, HEAD_LEN - 0.02, 0], 0.0085), // midrib
      ),
    ).paintWhere(
      bladeAt(sdf.extrude(leaf, 0.3).subtract(sdf.extrude(profile.offsetProfile(leaf, -0.008), 0.3))),
      C.bronzeDark,
      0.0015,
    );
    const socket = sdf.union(
      sdf.cone([0, SP_TOP - HEAD_LEN - 0.03, 0], [0, SP_TOP - HEAD_LEN + 0.02, 0], 0.016, 0.024),
      sdf.cylinder(0.0245, 0.022, 0.006).at(0, SP_TOP - HEAD_LEN - 0.04, 0),
      sdf.torus(0.02, 0.006).at(0, SP_TOP - HEAD_LEN - 0.065, 0),
    );
    const buttCap = sdf.cone([0, -0.004, 0], [0, 0.05, 0], 0.012, 0.0205).smoothUnion(0.006, sdf.torus(0.019, 0.0055).at(0, 0.05, 0));
    k.body('spear-bronze', spearPose(sdf.union(blade, socket, buttCap)), {
      color: C.bronze,
      roughness: 0.45,
      metalness: 0.7,
      bone: 'hand.R',
      detail: 0.003,
    });
    const tassel = sdf.union(
      ...[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * 60 + 15) * rad;
        const top: V3 = [0.013 * Math.cos(a), SP_TOP - HEAD_LEN - 0.05, 0.013 * Math.sin(a)];
        const tip: V3 = [0.03 * Math.cos(a), SP_TOP - HEAD_LEN - 0.125, 0.03 * Math.sin(a)];
        return sdf.cone(top, tip, 0.0105, 0.0035);
      }),
    );
    k.body('spear-tassel', spearPose(tassel), { color: C.red, roughness: 0.75, bone: 'hand.R', detail: 0.003 });

    // The javelin: a bronze shaft 0.38 long with a leaf blade 0.14 long and 0.05 wide, held in the fist
    // and pointing up and forward at about 45 degrees.
    const jav = aim(DL);
    const javPose = (s: sdf.Shape) => s.rotateX(jav.a).rotateZ(jav.b).at(...JAV_BUTT);
    k.body('javelin', javPose(sdf.capsule([0, 0, 0], [0, 0.4, 0], 0.0115)), {
      color: C.bronze,
      roughness: 0.4,
      metalness: 0.8,
      bone: 'hand.L',
      detail: 0.004,
    });
    const jleaf = profile.polygon(
      [
        [-0.01, 0],
        [0.01, 0],
        [0.021, 0.02],
        [0.025, 0.055],
        [0.017, 0.1],
        [0, 0.14],
        [-0.017, 0.1],
        [-0.025, 0.055],
        [-0.021, 0.02],
      ],
      { smooth: true, samples: 4 },
    );
    const jleafAt = (sh: sdf.Shape) => sh.at(0, 0.38, 0);
    k.body(
      'javelin-blade',
      javPose(
        sdf.union(
          jleafAt(sdf.extrude(jleaf, 0.008, 0.003)),
          sdf.cone([0, 0.35, 0], [0, 0.385, 0], 0.012, 0.0175),
        ),
      ).paintWhere(javPose(jleafAt(sdf.extrude(jleaf, 0.3).subtract(sdf.extrude(profile.offsetProfile(jleaf, -0.006), 0.3)))), C.bronzeDark, 0.0012),
      {
        color: C.bronze,
        roughness: 0.4,
        metalness: 0.8,
        bone: 'hand.L',
        detail: 0.003,
      },
    );

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const { keys, reach, orient } = motion;
    const LEG = 0.19;
    const curl = (x: number, y: number, z: number) => [0.35 * x, 0.35 * y, 0.35 * z] as const;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    // The spear solver: the spear's axis goes `dir`, its grip point goes to `grip` (both in the
    // chest's rest frame). The right arm reaches, the hand turns. `flat` keeps the blade's flat.
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
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const poleOf = (root: V3, mid: V3, end: V3) => {
      const t = norm(sub(end, root));
      const e = sub(mid, root);
      const d = dot(e, t);
      const side = norm(sub(e, scl(t, d)));
      return add(root, scl(side, 0.6));
    };
    const POLE_REST = poleOf(mx(SHOULDER), ELBOW_R, WRIST_R);
    const POLE_REST_L = poleOf(SHOULDER, ELBOW_L, WRIST_L);
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
        plume: { rotate: curl(3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)) },
        'hand.R': keep(-2.5 * wave(p)),
        'upperarm.L': { rotate: [-2 * wave(p, 1, 0.1), 0, 1.5 * bump(p)] },
      }),
    });

    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, flow: number) => ({
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
          heel: HEEL,
          toe: TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          plume: { rotate: curl(flow * 0.5 + 5 * wave(p, 2, 0.2), 0, 4 * wave(p, 2, 0.1)) },
          'upperarm.L': { rotate: [armSwing * 0.2 * s, 0, 3] as const },
          'upperarm.R': { move: [0, 0.02 + bob * 1.4, 0] as const },
          'hand.R': keep(-1.5 * lean),
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 28, 3, 6));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 50, 12, 22));

    // attack: a spear thrust along the right side. The spear comes from upright to level, the body
    // winds to the right, then the hips, the chest, and the arm drive it forward; the right foot steps
    // forward. The left arm swings back as a counterweight.
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
      [0.2, [-0.23, 0.35, 0.05]],
      [0.34, [-0.21, 0.335, -0.02]],
      [0.42, [-0.21, 0.335, -0.02]],
      [0.5, [-0.2, 0.34, 0.135]],
      [0.62, [-0.2, 0.34, 0.145]],
      [0.8, [-0.24, 0.33, 0.07]],
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
          plume: { rotate: curl(8 * wind - 18 * cut, 0, -4 * wind + 6 * cut) },
          'upperarm.R': { rotate: a.upper },
          'forearm.R': { rotate: a.lower },
          'hand.R': { rotate: a.hand },
          'upperarm.L': { rotate: [10 * wind + 14 * cut, 0, 3 * wind] },
          'leg.L': { rotate: [step, 0, 0] },
          'leg.R': { rotate: [-step, 0, 0] },
          'foot.L': { rotate: [-step, 0, 0] },
          'foot.R': { rotate: [step, 0, 0] },
        };
      },
    });

    // attack2: a sweeping spear spin. The spear swings out level to the right and back, then sweeps
    // across the front to the far left while the body turns with it, and returns.
    const sweepDir = [
      [0, SD0],
      [0.12, dirOf(-62, 70)],
      [0.17, dirOf(-62, 36)],
      [0.22, dirOf(-62, 6)],
      [0.36, dirOf(-62, 3)],
      [0.46, dirOf(-38, 1)],
      [0.56, dirOf(-5, 0)],
      [0.66, dirOf(34, 0)],
      [0.76, dirOf(48, 0)],
      [0.9, dirOf(18, 28)],
      [1, SD0],
    ] as const;
    const sweepGrip = [
      [0, GRIP_R],
      [0.12, [-0.27, 0.36, -0.03]],
      [0.17, [-0.275, 0.355, -0.05]],
      [0.22, [-0.27, 0.345, -0.055]],
      [0.36, [-0.27, 0.345, -0.055]],
      [0.46, [-0.24, 0.345, 0.03]],
      [0.56, [-0.2, 0.345, 0.11]],
      [0.66, [-0.15, 0.345, 0.16]],
      [0.76, [-0.12, 0.345, 0.165]],
      [0.9, [-0.2, 0.335, 0.08]],
      [1, GRIP_R],
    ] as const;
    k.animation('attack2', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const a = spearArm(keys(p, sweepGrip, 'spline'), keys(p, sweepDir, 'spline'));
        const wind = ease(0.08, 0.36, p) * (1 - ease(0.38, 0.48, p));
        const cut = ease(0.4, 0.72, p) * (1 - ease(0.78, 0.98, p));
        const step = 14 * cut;
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.004 * wind, 0.01 * cut], rotate: [0, -8 * wind + 10 * cut, 0] },
          spine: { rotate: [-2 * wind + 4 * cut, 0, 0] },
          chest: { rotate: [-2 * wind + 3 * cut, -26 * wind + 28 * cut, 0] },
          head: { rotate: [-2 * cut, 12 * wind - 18 * cut, 0] },
          plume: { rotate: curl(10 * wind - 18 * cut, 0, 4 * wind - 4 * cut) },
          'upperarm.R': { rotate: a.upper },
          'forearm.R': { rotate: a.lower },
          'hand.R': { rotate: a.hand },
          'upperarm.L': { rotate: [12 * wind - 10 * cut, 0, 4 * wind] },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
        };
      },
    });

    // hit: a blow from the front. The head and chest snap back, the right foot steps back and
    // returns, the crest lags; the spear stays planted.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(Math.min(1, Math.max(0, (p - 0.04) / 0.2))) + bump(Math.min(1, Math.max(0, (p - 0.58) / 0.32)));
        const jolt = keys(p, [[0, 0], [0.1, 1], [0.3, 0.15], [0.5, -0.2], [0.78, 0]] as const, 'spline');
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.26, 1], [0.48, -0.45], [0.72, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const plant = Math.asin(back / LEG) / rad;
        return {
          hips: { move: [0, -legDrop(LEG, plant), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-12 * h, -6 * h, 3 * h] },
          plume: { rotate: curl(16 * lag, 0, 5 * lag) },
          'hand.R': keep(16 * h, 3 * h),
          'upperarm.L': { rotate: [6 * jolt, 0, 6 * jolt] },
          'forearm.L': { rotate: [10 * jolt, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
        };
      },
    });

    // death: the blow snaps him back, he staggers a step, then topples onto his back. The spear
    // slips from upright and lies out to the right, clear of the head.
    const D = {
      tilt: 86,
      drop: 0.045,
      back: 0.15,
      neck: 9,
      head: 12,
      leg: 34,
      gripR: [-0.29, 0.3, 0.1] as V3,
      dirR: norm([-0.3, 0.94, 0.0]),
      wristL: [0.19, 0.235, 0.05] as V3,
      poleL: [0.5, 0.3, -0.3] as V3,
    };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.2, 0.4], [0.3, 0]] as const);
        const stag = keys(p, [[0.04, 0], [0.22, 1]] as const);
        const f = keys(p, [[0.26, 0], [0.68, 1]] as const);
        const g = f * f;
        const stand = 1 - g;
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.14)));
        const lag = keys(p, [[0, 0], [0.1, 0.8], [0.3, -0.3], [0.5, 0.6], [0.7, -1], [0.82, -0.6], [1, -0.7]] as const, 'spline');

        const gripR = keys(p, [[0, GRIP_R], [0.2, [-0.27, 0.32, 0.08]], [0.74, D.gripR]] as const);
        const dirR = keys(p, [[0, SD0], [0.74, D.dirR]] as const);
        const poleR = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const a = spearArm(gripR, dirR, poleR);

        const wristL = keys(p, [[0, WRIST_L], [0.1, [0.28, 0.3, 0.06]], [0.36, [0.27, 0.31, 0.03]], [0.76, D.wristL]] as const);
        const poleL = keys(p, [[0, POLE_REST_L], [0.2, [0.6, 0.3, -0.1]], [0.76, D.poleL]] as const);
        const armL = reach(ARM_L, wristL, poleL);

        const plant = Math.asin((0.03 * stag * stand) / LEG) / rad;
        const legL = -plant + D.leg * g * g;
        const sole = D.tilt * g - D.leg * g * g;
        const toes = keys(p, [[0.56, 0], [0.76, 1]] as const);
        return {
          hips: {
            move: [0, -legDrop(LEG, plant) * stand - D.drop * g + 0.014 * Math.sin(Math.PI * f) + 0.012 * land, -0.03 * stag - D.back * g],
            rotate: [-4 * hitB - 4 * stag * stand - D.tilt * g, 0, 0],
          },
          spine: { rotate: [-6 * hitB + 5 * stag * stand, 0, 0] },
          chest: { rotate: [-8 * hitB + 4 * stag * stand, 5 * hitB, 3 * stag * stand] },
          neck: { rotate: [-5 * hitB + D.neck * g, 0, 0] },
          head: { rotate: [-12 * hitB + D.head * g, 22 * g, 0] },
          plume: { rotate: curl(18 * lag - 22 * toes, 0, 6 * lag) },
          'upperarm.R': { rotate: a.upper },
          'forearm.R': { rotate: a.lower },
          'hand.R': { rotate: a.hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [legL, 0, 6 * g] },
          'leg.R': { rotate: [plant + 10 * stag * stand + (D.leg + 2) * g * g, 0, -6 * g] },
          'foot.L': { rotate: [plant + sole * (1 - toes) + 16 * toes, 0, 0] },
          'foot.R': { rotate: [-plant - 10 * stag * stand + sole * (1 - toes) + 16 * toes, 0, 0] },
        };
      },
    });

    // victory: the spear is lifted off the floor and held upright beside the head (leaning out,
    // clear of the helmet); a proud nod, then he holds the pose with the chin up.
    const WIN = { grip: [-0.285, 0.45, 0.06] as V3, dir: norm([-0.16, 0.98, 0.04]) };
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const r = ease(0, 0.3, p);
        const nod = keys(p, [[0.42, 0], [0.54, 1], [0.68, -0.4], [0.8, 0]] as const);
        const pride = ease(0.6, 0.8, p);
        const look = r * (1 - ease(0.42, 0.6, p));
        const lag = keys(p, [[0, 0], [0.14, -0.6], [0.3, 0.7], [0.42, -0.3], [0.56, -0.8], [0.7, 0.9], [0.84, -0.35], [1, 0.1]] as const, 'spline');
        const sway = keys(p, [[0, 0], [0.18, -0.5], [0.34, 0.6], [0.5, -0.3], [0.66, 0.45], [0.82, -0.15], [1, 0.05]] as const, 'spline');
        const grip = keys(p, [[0, GRIP_R], [0.14, [-0.285, 0.41, 0.09]], [0.3, WIN.grip]] as const, 'spline');
        const dir = norm(keys(p, [[0, SD0], [0.3, WIN.dir]] as const));
        const a = spearArm(grip, dir, keys(p, [[0, POLE_REST], [0.3, [-0.6, 0.15, -0.25]]] as const));
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, -3 * r] },
          chest: { rotate: [-2 * r, 0, -6 * r] },
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [-6 * look + 10 * nod - 5 * pride, -10 * look, 0] },
          plume: { rotate: curl(12 * lag, 0, 6 * sway) },
          'upperarm.R': { rotate: a.upper, move: [0, 0.012 * r, 0] },
          'forearm.R': { rotate: a.lower },
          'hand.R': { rotate: a.hand },
          'upperarm.L': { rotate: [-10 * r, 0, 5 * r] },
          'leg.L': { rotate: [0, 0, stance] },
          'leg.R': { rotate: [0, 0, -stance] },
          'foot.L': { rotate: [0, 0, -stance] },
          'foot.R': { rotate: [0, 0, stance] },
        };
      },
    });
  },
});
