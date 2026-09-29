import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Orc archer — Chibi Quest enemy (catalog `enemies/humanoid/orc-archer`), about 1.0 m to the top
 * of its topknot, faces +Z, on the orc warrior's skeleton and face. Target:
 * docs/enemy-mockups/orc-archer_001.jpg (made with mmx; one front view).
 *
 * Role: a ranged orc enemy seen in 3D and as a 128 px sprite; the big wooden bow, the tusks, the
 *   heavy brow, and the quiver of arrows must read.
 * One idea: a leaner orc, bald under a small dark topknot, glaring over a huge curved longbow
 *   that is nearly as tall as it is.
 * Proportions: topknot 1.0, eyes 0.69, tusk tips 0.55, shoulders 0.52, belt 0.33, loincloth hem
 *   0.16; the torso and the arms are 10 percent narrower than the warrior's, the tusks 0.7x.
 * Shape language: round and stocky body (as the warrior), long sweeping curves for the bow, sharp
 *   accents (tusks, ear tips, arrow heads, ragged loincloth).
 * Palette (60/30/10): green skin #7aa23e; dark leather jerkin #3f3a35 and loincloth; brown belt
 *   and strap #6e3f24, bracers #5a3a22; wooden bow #8a5a35 with darker ends; cream tusks; yellow eyes.
 * Value plan: the yellow eyes under the dark brow and the cream tusks are the focal point; the
 *   dark jerkin frames them; the bow is the second mass.
 * Bodies: skin (with brows), hair (topknot), topknot band, tusks, jerkin, leather (strap, belt),
 *   bracers, buckle, quiver, arrows, arrow heads, fletching, bow, bowstring, loincloth.
 * Rig: the warrior's rig (knee bones, `knot`); the bow is rigid on `hand.L`, the quiver on `chest`.
 *   Clips: idle, walk, run, attack (raise the bow, draw to the cheek, hold 0.3 s, release, snap
 *   the hand forward), attack2 (a quick front kick, then a bow bash), roar, hit, death.
 */

const C = {
  skin: '#5f7d2e',
  skinDark: '#43601f',
  skinLight: '#7f9c48',
  eye: '#f2c230',
  pupil: '#141010',
  lid: '#2c4418',
  mouth: '#2a1a14',
  hair: '#2a2624',
  tusk: '#efe4cc',
  iron: '#5a6068',
  leather: '#6e3f24',
  bracer: '#5a3a22',
  bracerDark: '#3a2414',
  jerkin: '#3f3a35',
  jerkinDark: '#26221f',
  wood: '#8a5a35',
  woodEnd: '#6b4226',
  grip: '#4a2a18',
  string: '#a08a5a',
  fletch: '#a8a8a2',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const DEG = Math.PI / 180;
// Vector rotations that match the shape methods .rotateX / .rotateY / .rotateZ.
const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotYv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) + v[2] * Math.sin(d * DEG), v[1], -v[0] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];

// Joints: wide shoulders, arms hanging out from the body, a wide stance.
const SHOULDER: V3 = [0.22, 0.52, 0];
const ELBOW: V3 = [0.31, 0.4, 0.02];
const WRIST: V3 = [0.345, 0.3, 0.05];
const HIP: V3 = [0.1, 0.25, 0];
const ANKLE: V3 = [0.155, 0.075, 0];
const KNEE: V3 = [0.1275, 0.1625, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left bare foot (y = 0), measured on the SDF: heel and toe.
// The foot turns out 14 degrees, so the toe point sits outboard of the heel.
const SOLE_HEEL: V3 = [0.155, 0, -0.022];
const SOLE_TOE: V3 = [0.169, 0, 0.09];
const HEAD_Y = 0.72;


// The bow in the left fist. Local frame: grip at the origin, the limbs along Y, the back of the
// bow toward +Z, the string behind it at -Z. At rest it is carried tilted across the front of the
// body (pitched up 60 degrees, turned 22 degrees inward), so the lower tip stays off the floor.
const FIST_L: V3 = [WRIST[0] + 0.006, WRIST[1] - 0.06, WRIST[2] + 0.006];
const BOW_PITCH = 60;
const BOW_YAW = -22;
const bowPose = (s: sdf.Shape) => s.rotateX(BOW_PITCH).rotateY(BOW_YAW).at(...FIST_L);
const bowPoint = (p: V3): V3 => add(rotYv(rotXv(p, BOW_PITCH), BOW_YAW), FIST_L);
const BOW_HALF = 0.45; // half the bow's height
const BOW_TIP_Z = -0.2; // the tips curve back toward the string
// The bow's axis (lower tip to upper tip) and its back, in the rest pose (for the animation).
const BOW = { dir: rotYv(rotXv([0, 1, 0], BOW_PITCH), BOW_YAW), up: rotYv(rotXv([0, 0, 1], BOW_PITCH), BOW_YAW) };

/** A big fist hanging from the wrist `w`; `s` mirrors it for the right hand. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.062, 0.064, 0.066]).at(...o(0.006, -0.06, 0.006)),
    sdf.capsule(o(-0.016, -0.092, 0.05), o(-0.01, -0.058, 0.07), 0.026), // curled fingers
    sdf.cone(o(0.036, -0.036, 0.042), o(0.004, -0.05, 0.08), 0.025, 0.02), // thumb
  );
};

export default defineAsset({
  name: 'orc-archer',
  description: 'Chibi orc archer enemy: a lean, bald orc with a small dark topknot, tusks, a dark leather jerkin with a quiver strap, and a big wooden longbow.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/orc-archer_001.jpg',
  // Color slots for individual orcs (the first option is the default look).
  variants: {
    eyes: { yellow: C.eye, red: '#d8321e', orange: '#f0861c' },
    skin: { green: C.skin, olive: '#45532a', grey: '#5c6654' },
    leather: { brown: C.leather, black: '#3a2a20', tan: '#8a6a40' },
    // Tribal dyes: charcoal, blood red, undyed hide. No bright blue on an orc.
    clothing: { charcoal: C.jerkin, blood: '#5a2a24', hide: '#6a5238' },
  },
  presets: {
    bloodfang: { eyes: 'red', skin: 'green', leather: 'black', clothing: 'blood' },
    bog: { eyes: 'yellow', skin: 'olive', leather: 'brown', clothing: 'hide' },
    ashen: { eyes: 'orange', skin: 'grey', leather: 'black', clothing: 'charcoal' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot keep their exact default color and follow
    // the slot when a game recolors it; the mouth follows the skin halfway.
    const T = {
      eye: k.tint('eyes'),
      skin: k.tint('skin'),
      skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
      skinLight: k.tint('skin', { color: C.skinLight, follow: 1 }),
      lid: k.tint('skin', { color: C.lid, follow: 1 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      leather: k.tint('leather'),
      bracer: k.tint('leather', { color: C.bracer, follow: 1 }),
      band: k.tint('leather', { color: C.bracerDark, follow: 1 }),
      cloth: k.tint('clothing'),
    };
    // A paintFn shade that follows its slot: the old color as an offset from the body color.
    const shadeOf = (body: string, shade: string) => {
      const a = rgb(body);
      const b = rgb(shade);
      return [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
    };
    const KNOT: V3 = [0, 0.978, -0.04];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.26, 0] },
      spine: { parent: 'hips', at: [0, 0.34, 0] },
      chest: { parent: 'spine', at: [0, 0.44, 0] },
      neck: { parent: 'chest', at: [0, 0.54, -0.01] },
      head: { parent: 'neck', at: [0, 0.58, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [0.06, 0.97, -0.1] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
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
        sdf.ellipsoid([0.178, 0.09, 0.14]).at(0, 0.58, 0.05), // the wide underbite jaw
        pair(sdf.sphere(0.078).at(0.108, 0.645, 0.078)), // cheeks
        sdf.ellipsoid([0.16, 0.038, 0.065]).at(0, 0.748, 0.12), // a heavy brow shelf
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.046, 0.032, 0.032]).at(0, 0.655, faceZ(0, 0.655) - 0.008).bone('head');
    // Pointed ears, swept out and up.
    const ears = pair(
      sdf
        .cone([0.15, 0.7, -0.01], [0.245, 0.765, -0.045], 0.05, 0.008)
        .smoothSubtract(0.006, sdf.cone([0.16, 0.705, 0.012], [0.235, 0.76, -0.02], 0.028, 0.004))
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.5, -0.01], [0, 0.62, -0.01], 0.095).bone('neck');

    // ------------------------------------------------------------------ torso, arms, legs
    const trunk = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.18, 0.16, 0.15]).at(0, 0.47, 0).bone('chest'),
      sdf.ellipsoid([0.153, 0.13, 0.14]).at(0, 0.35, 0.02).bone('spine'),
      pair(sdf.sphere(0.092).at(0.14, 0.545, -0.02).bone('chest')), // traps
      pair(sdf.ellipsoid([0.08, 0.062, 0.05]).at(0.068, 0.48, 0.1).bone('chest')), // pecs
    );
    // Six blocky abdominal muscles on the belly, set on its surface.
    const belly = sdf.smoothUnion(0.06, sdf.ellipsoid([0.18, 0.16, 0.15]).at(0, 0.47, 0), sdf.ellipsoid([0.153, 0.13, 0.14]).at(0, 0.35, 0.02));
    const abs = pair(
      sdf.union(
        ...[0.405, 0.365, 0.325].map((y, i) => {
          const p = sdf.raycast(belly, [0.036, y, 1], [0, 0, -1])!;
          return sdf.ellipsoid([0.03 - i * 0.002, 0.018, 0.016]).at(p[0], p[1], p[2] - 0.006);
        }),
      ),
    ).bone('spine');
    const armAt = (s: 1 | -1) => {
      const sh: V3 = s > 0 ? SHOULDER : mx(SHOULDER);
      const el: V3 = s > 0 ? ELBOW : mx(ELBOW);
      const wr: V3 = s > 0 ? WRIST : mx(WRIST);
      const side = s > 0 ? 'L' : 'R';
      return sdf.smoothUnion(
        0.03,
        sdf.cone(sh, el, 0.081, 0.0675).bone(`upperarm.${side}`),
        sdf.ellipsoid([0.063, 0.072, 0.061]).at(...lerp(sh, el, 0.5)).bone(`upperarm.${side}`), // biceps
        sdf.cone(el, wr, 0.0675, 0.061).bone(`forearm.${side}`),
        fistAt(wr, s).bone(`hand.${side}`),
      );
    };
    const legs = pair(sdf.capsule([HIP[0], 0.26, 0], [ANKLE[0], 0.1, 0.01], 0.078).bone('leg.L'));
    // Big bare feet with four round toes.
    const footLocal = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.078, 0.052, 0.11]).at(0, 0.045, 0.035),
        ...[-0.045, -0.015, 0.015, 0.045].map((x, i) => sdf.sphere(0.024 - i * 0.001).at(x, 0.03, 0.135 - Math.abs(x) * 0.3)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const feet = pair(footLocal.rotateY(14).at(ANKLE[0], 0, 0).bone('foot.L'));

    // ------------------------------------------------------------------ face paint
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const EYE: V3 = [0.074, 0.69, 0];
    const eyeBall = pair(at(sdf.ellipsoid([0.049, 0.041, 0.07]), EYE[0], EYE[1]));
    const pupil = pair(at(sdf.ellipsoid([0.02, 0.025, 0.07]), EYE[0] - 0.008, EYE[1] - 0.004));
    // The upper lid cuts across each eye on a slant, low at the inner end: a scowl.
    const lidL = sdf
      .extrude(
        profile.polygon([
          [EYE[0] - 0.06, EYE[1] + 0.014],
          [EYE[0] + 0.06, EYE[1] + 0.04],
          [EYE[0] + 0.06, EYE[1] + 0.08],
          [EYE[0] - 0.06, EYE[1] + 0.08],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const lids = pair(lidL);
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.008), x - 0.002, EYE[1] + 0.004)),
    );
    // A heavy green brow ridge over the eyes; the inner ends dip toward the nose.
    const browAt = (x: number, y: number): V3 => [x, y, faceZ(Math.abs(x), y) - 0.006];
    const brows = pair(
      sdf
        .chain(
          [
            [...browAt(EYE[0] + 0.062, EYE[1] + 0.064), 0.02],
            [...browAt(EYE[0] + 0.008, EYE[1] + 0.047), 0.026],
            [...browAt(EYE[0] - 0.05, EYE[1] + 0.022), 0.021],
          ],
          0.008,
        )
        .bone('head'),
    );
    const MOUTH_Y = 0.604;
    // A scowling upper lip over the underbite: a downturned line whose corners run under the tusk roots.
    const mouth = sdf.extrude(profile.arc(0.06, 0.013, 45, 135), 0.4).at(0, MOUTH_Y - 0.06, 0.2);
    const nostrils = pair(sdf.sphere(0.009).at(0.02, 0.64, faceZ(0, 0.64) + 0.012));
    const skin = sdf
      .smoothUnion(0.04, head, neck)
      .smoothUnion(0.015, nose, ears)
      .smoothUnion(0.012, brows)
      .smoothUnion(0.05, trunk)
      .smoothUnion(0.012, abs)
      .union(armAt(1), armAt(-1))
      .smoothUnion(0.03, legs)
      .union(feet)
      .paintWhere(brows, T.skinDark, 0.006)
      .paintWhere(pair(sdf.sphere(0.05).at(0.11, 0.66, 0.1)), T.skinLight, 0.03) // muted cheek highlight
      .paintWhere(sdf.sphere(0.05).at(0, 0.87, 0.04), T.skinLight, 0.04) // and the skull crown
      .paintWhere(eyeBall, T.eye, 0.002)
      .paintWhere(pupil, C.pupil, 0.002)
      .paintWhere(shine, '#ffffff', 0.002)
      .paintWhere(lids.intersect(eyeBall.round(0.006)), T.lid, 0.002)
      .paintWhere(mouth, T.mouth, 0.003)
      .paintWhere(nostrils, T.mouth, 0.004)
      .paintWhere(pair(sdf.extrude(profile.rect([0.006, 0.08], 0.003), 0.4).rotateZ(-8).at(0.055, 0.35, 0.2)), T.skinDark, 0.01); // belly lines
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.005 });
    // ------------------------------------------------------------------ topknot (the head is bald)
    const bun = sdf.smoothUnion(
      0.02,
      sdf.sphere(0.042).at(KNOT[0], 0.952, KNOT[2]),
      sdf.cone([0, 0.895, -0.03], [0, 0.945, -0.04], 0.052, 0.036),
    );
    const tail = sdf.chain(
      [
        [KNOT[0] + 0.02, 0.965, KNOT[2] - 0.028, 0.028],
        [KNOT[0] + 0.06, 0.975, KNOT[2] - 0.062, 0.021],
        [KNOT[0] + 0.098, 0.955, KNOT[2] - 0.088, 0.01],
      ],
      0.01,
    );
    k.body('hair', sdf.union(bun.bone('head'), tail.bone('knot')), { color: C.hair, roughness: 0.5, detail: 0.004 });
    // The leather band that ties the topknot.
    k.body('band', sdf.torus(0.043, 0.012).at(0, 0.925, -0.034).bone('head'), { color: T.band, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ tusks
    const smooth01 = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    // Small tusks (0.7x the warrior's) are teeth of the upper jaw: each comes out of the mouth from under the upper lip
    // (its root is sunk behind the lip and cut at the lip line) and hangs down over the lower
    // jaw, a little out and forward at the tip.
    const tuskPath = [
      [0.046, MOUTH_Y - 0.002, 0.0147, -0.008],
      [0.052, MOUTH_Y - 0.028, 0.0154, 0.01],
      [0.06, MOUTH_Y - 0.056, 0.0119, 0.021],
      [0.066, MOUTH_Y - 0.08, 0.007, 0.03],
    ].map(([x, y, r, lift]) => [x!, y!, faceZ(x!, y!) + lift!, r!] as [number, number, number, number]);
    const tusks = pair(sdf.chain(tuskPath, 0.012).intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y - 0.002)));
    // Ivory, warmer and darker at the root, pale at the blunt tip.
    const tuskRoot = rgb('#b9a57a');
    const tuskTip = rgb(C.tusk);
    k.body(
      'tusks',
      tusks.bone('head').paintFn((x, y) => {
        const t = 1 - smooth01(MOUTH_Y - 0.078, MOUTH_Y, y);
        return [tuskRoot[0] + (tuskTip[0] - tuskRoot[0]) * t, tuskRoot[1] + (tuskTip[1] - tuskRoot[1]) * t, tuskRoot[2] + (tuskTip[2] - tuskRoot[2]) * t];
      }),
      { color: C.tusk, roughness: 0.4 },
    );

    // ------------------------------------------------------------------ jerkin, strap, belt, bracers
    // A dark leather jerkin: a shell over the chest with a V opening at the front and a raised collar.
    const vOpen = sdf.extrude(profile.polygon([[-0.075, 0.68], [0.075, 0.68], [0, 0.49]]), 0.3, 0.004).at(0, 0, 0.23);
    // Torn edges: five nicks around each arm hole (the hem has hanging tatters, see below).
    const armTears = sdf.union(
      ...[1, -1].flatMap((sg) =>
        [0, 1, 2, 3, 4].map((i) => {
          const a = (i * 72 + 25 * sg) * DEG;
          return sdf.cone([sg * 0.2, 0.49 + 0.13 * Math.cos(a), 0.13 * Math.sin(a)], [sg * 0.27, 0.49 + 0.08 * Math.cos(a), 0.08 * Math.sin(a)], 0.004, 0.02);
        }),
      ),
    );
    const jerkinShell = trunk
      .round(0.013)
      .intersect(sdf.box([0.7, 0.29, 0.7], 0.01).at(0, 0.485, 0))
      .subtract(vOpen)
      .subtract(armTears);
    // A raised band (0.045 tall) around the neck with five deep V notches (0.03 deep).
    const COLLAR_TOP = 0.0225;
    const collar = sdf
      .cylinder(0.13, 0.045, 0.008)
      .subtract(sdf.cylinder(0.097, 0.2))
      .subtract(
        sdf.union(
          ...[0, 1, 2, 3, 4].map((i) =>
            sdf
              .extrude(profile.polygon([[-0.024, COLLAR_TOP + 0.006], [0.024, COLLAR_TOP + 0.006], [0, COLLAR_TOP - 0.03]]), 0.08)
              .at(0, 0, 0.13)
              .rotateY(i * 72 + 20),
          ),
        ),
      )
      .scale([1, 1, 0.92])
      .rotateX(14)
      .at(0, 0.585, -0.03);
    const jerkinDark = shadeOf(C.jerkin, C.jerkinDark);
    const jerkin = sdf
      .smoothUnion(0.012, jerkinShell, collar)
      .displace(0.004, (x, y, z) => noise.fbm(x * 22, y * 22, z * 22, 2), 1.2)
      .paintFn((x, y, z, base) => {
        // Darker seams at the sides and a worn, darker lower hem.
        const seam = Math.abs(Math.abs(x) - 0.15) < 0.006 ? 0.8 : 0;
        const hem = Math.min(1, Math.max(0, (0.4 - y) / 0.06)) * 0.6;
        const t = Math.max(seam, hem);
        return [base[0] + jerkinDark[0] * t, base[1] + jerkinDark[1] * t, base[2] + jerkinDark[2] * t];
      });
    k.body('jerkin', jerkin.bone('chest'), { color: T.cloth, roughness: 0.85, bump: (x, y, z) => 0.0012 * noise.fbm(x * 45, y * 45, z * 45, 2) });

    // Flared leather cuffs: wide at the elbow with a rolled top edge, soft creases, a dark seam.
    const bracer = (e: V3, w: V3) => {
      const d = norm(sub(w, e));
      const along = (x: number, y: number, z: number) => (x - e[0]) * d[0] + (y - e[1]) * d[1] + (z - e[2]) * d[2];
      const creases = (x: number, y: number, z: number) => Math.sin(along(x, y, z) * 70 + noise.fbm(x * 12, y * 12, z * 12, 2) * 1.2);
      const cuff = sdf
        .smoothUnion(
          0.01,
          sdf.cone(lerp(e, w, 0.06), lerp(e, w, 0.8), 0.085, 0.075),
          sdf.cone(lerp(e, w, 0.0), lerp(e, w, 0.14), 0.093, 0.088), // the rolled top edge
        )
        .displace(0.003, creases, 1.3)
        .round(0.002);
      const band = (t: number) => sdf.cone(lerp(e, w, t - 0.03), lerp(e, w, t + 0.03), 0.2, 0.2);
      return cuff.paintWhere(band(0.18), T.band, 0.004).paintWhere(band(0.76), T.band, 0.004);
    };
    const bracers = sdf.union(bracer(ELBOW, WRIST).bone('forearm.L'), bracer(mx(ELBOW), mx(WRIST)).bone('forearm.R'));
    k.body('bracers', bracers, { color: T.bracer, roughness: 0.65 });

    // The quiver strap runs from the right shoulder over the chest to the left hip.
    const strap = trunk.round(0.02).smoothIntersect(0.006, sdf.box([0.8, 0.055, 0.8], 0.006).rotateZ(-32).at(0, 0.44, 0)).intersect(sdf.box([0.7, 0.29, 0.7]).at(0, 0.485, 0));
    const beltY = 0.33;
    const belt = belly.round(0.016).smoothIntersect(0.006, sdf.box([0.6, 0.06, 0.6], 0.008).at(0, beltY, 0));
    // Six hanging triangular tatters (0.06 long) at the jerkin hem, flaring out over the belts.
    const tatters = sdf.union(
      ...[-95, -62, -32, 32, 62, 95].map((a, i) => {
        const dir: V3 = [Math.sin(a * DEG), 0, Math.cos(a * DEG)];
        const hit = sdf.raycast(belt, [dir[0], beltY + 0.012, dir[2]], [-dir[0], 0, -dir[2]])!;
        const w = 0.026 + 0.006 * noise.random(i, 5, 1);
        return sdf
          .extrude(profile.polygon([[-w, 0.006], [w, 0.006], [0.004 * (i % 3 - 1), -0.054]]), 0.014, 0.003)
          .rotateX(-32)
          .rotateY(a)
          .at(hit[0] - dir[0] * 0.004, beltY + 0.012, hit[2] - dir[2] * 0.004);
      }),
    );
    k.body('jerkin-tatters', tatters.bone('spine'), { color: T.cloth, roughness: 0.85, detail: 0.004 });
    k.body('leather', sdf.union(strap.bone('chest'), belt.bone('spine')), {
      color: T.leather,
      roughness: 0.6,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });

    // ------------------------------------------------------------------ iron: a square belt buckle
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.09, 0.09, 0.018], 0.007).subtract(sdf.box([0.05, 0.05, 0.06])),
        sdf.box([0.008, 0.046, 0.012], 0.003).at(0, 0, 0.002), // the prong
      )
      .at(0, beltY, beltZ + 0.006);
    const ironBump = (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2);
    k.body('iron', buckle.bone('spine'), { color: C.iron, roughness: 0.5, metalness: 0.75, bump: ironBump, detail: 0.004 });

    // A dark leather shoulder cap on the right shoulder (two overlapping plates).
    const plate = (sc: number) =>
      sdf.ellipsoid([0.115 * sc, 0.07 * sc, 0.105 * sc]).intersect(sdf.halfSpace([0, -1, 0], 0.014 * sc)).round(0.004);
    const capPose = (sh: sdf.Shape) => sh.scale(1.1).rotateZ(26).at(-0.245, 0.575, -0.005);
    k.body('shoulder-cap', capPose(sdf.union(plate(1), plate(1.14).at(0, -0.04, 0))), {
      color: T.band,
      roughness: 0.7,
      bone: 'upperarm.R',
      detail: 0.005,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 45, y * 45, z * 45, 2),
    });

    // ------------------------------------------------------------------ quiver with three arrows on the back
    // Local frame: the quiver's axis along Y; it leans 30 degrees, the top toward the right shoulder.
    const quiverPose = (s: sdf.Shape) => s.rotateX(-6).rotateZ(30).at(-0.02, 0.5, -0.2);
    const quiverLocal = sdf
      .cylinder(0.06, 0.4, 0.012)
      .subtract(sdf.cylinder(0.046, 0.1).at(0, 0.2, 0))
      .union(sdf.torus(0.054, 0.012).at(0, 0.196, 0)) // the rim
      .union(sdf.torus(0.06, 0.008).at(0, -0.1, 0)) // a band lower down
      .paintWhere(sdf.torus(0.06, 0.012).at(0, 0.14, 0), C.grip, 0.004);
    k.body('quiver', quiverPose(quiverLocal), { color: T.bracer, roughness: 0.7, detail: 0.005, bone: 'chest', bump: (x, y, z) => 0.001 * noise.fbm(x * 50, y * 50, z * 50, 2) });
    // Three arrows in a fan: two head-up (iron heads), one nock-up with grey fletching.
    const ARROWS: { at: [number, number]; tilt: [number, number]; up: number; kind: 'head' | 'fletch' }[] = [
      { at: [-0.018, 0.012], tilt: [0, -12], up: 0.38, kind: 'head' },
      { at: [0.02, -0.006], tilt: [6, 10], up: 0.44, kind: 'head' },
      { at: [0.0, -0.028], tilt: [-11, -2], up: 0.33, kind: 'fletch' },
    ];
    const arrowShape = (a: (typeof ARROWS)[number], part: 'shaft' | 'head' | 'fletch') => {
      const shaft = sdf.cylinder(0.0105, a.up + 0.14, 0.003).at(0, (a.up - 0.14) / 2 + 0.0, 0);
      const top = a.up + 0.02;
      const head = sdf
        .extrude(
          profile.polygon([[-0.026, 0], [0, 0.075], [0.026, 0], [0, -0.014]]),
          0.01,
          0.004,
        )
        .at(0, top - 0.005, 0);
      const vane = (r: number) =>
        sdf
          .extrude(profile.polygon([[-0.004, 0], [0.032, 0.03], [0.032, 0.115], [-0.004, 0.09]]), 0.008, 0.003)
          .rotateY(r)
          .at(0, a.up - 0.11, 0);
      const fletch = sdf.union(vane(0), vane(120), vane(240));
      const s = part === 'shaft' ? shaft : part === 'head' ? head : fletch;
      return s
        .at(0, 0, 0)
        .rotateX(a.tilt[0])
        .rotateZ(a.tilt[1])
        .at(a.at[0], 0.0, a.at[1]);
    };
    const arrowsShaft = sdf.union(...ARROWS.map((a) => arrowShape(a, 'shaft')));
    const arrowsHead = sdf.union(...ARROWS.filter((a) => a.kind === 'head').map((a) => arrowShape(a, 'head')));
    const arrowsFletch = sdf.union(...ARROWS.filter((a) => a.kind === 'fletch').map((a) => arrowShape(a, 'fletch')));
    k.body('arrows', quiverPose(arrowsShaft), { color: C.wood, roughness: 0.75, detail: 0.004, bone: 'chest' });
    k.body('arrow-heads', quiverPose(arrowsHead), { color: C.iron, roughness: 0.45, metalness: 0.8, detail: 0.004, bone: 'chest' });
    k.body('fletching', quiverPose(arrowsFletch), { color: C.fletch, roughness: 0.9, detail: 0.004, bone: 'chest' });

    // ------------------------------------------------------------------ the longbow, in the left fist
    // A thick, curved stave, tapering to the tips, that curls forward at the very ends.
    const BOW_S = [0, 0.33, 0.66, 0.9, 1.0];
    const BOW_Z = [0, -0.035, -0.115, -0.18, BOW_TIP_Z];
    const BOW_R = [0.035, 0.03, 0.025, 0.021, 0.018];
    const limb = (sign: 1 | -1) =>
      sdf.chain(
        BOW_S.map((s, i) => [0, s * BOW_HALF * sign, BOW_Z[i]! / 0.6, BOW_R[i]!] as [number, number, number, number]),
        0.012,
      );
    const bowLocal = sdf
      .union(limb(1), limb(-1))
      .displace(0.0025, (x, y, z) => noise.fbm(x * 30, y * 10, z * 30, 2))
      .scale([1, 1, 0.6]) // a flat stave
      .paintWhere(sdf.box([0.2, 0.09, 0.2]), C.grip, 0.006)
      .paintWhere(sdf.box([0.2, 0.09, 0.2]).at(0, BOW_HALF - 0.03, 0), C.woodEnd, 0.02)
      .paintWhere(sdf.box([0.2, 0.09, 0.2]).at(0, -BOW_HALF + 0.03, 0), C.woodEnd, 0.02)
      .paintWhere(sdf.box([0.2, 0.1, 0.2]).at(0, BOW_HALF + 0.03, 0), C.woodEnd, 0.02)
      .paintWhere(sdf.box([0.2, 0.1, 0.2]).at(0, -BOW_HALF - 0.03, 0), C.woodEnd, 0.02);
    k.body('bow', bowPose(bowLocal), {
      color: C.wood,
      roughness: 0.7,
      detail: 0.004,
      bone: 'hand.L',
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 25, y * 90, z * 25, 2),
    });
    const tipA = bowPoint([0, BOW_HALF, BOW_TIP_Z]);
    const tipB = bowPoint([0, -BOW_HALF, BOW_TIP_Z]);
    k.body('bowstring', sdf.capsule(tipA, tipB, 0.004), { color: C.string, roughness: 0.8, detail: 0.004, bone: 'hand.L' });

    // ------------------------------------------------------------------ loincloth
    // A torn dark wrap around the hips: a flared shell under the belt, with soft vertical folds, a
    // ragged hem of V tears and slits, and darker, frayed streaks toward the hem.
    const skirtCone = (grow: number, top: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, top],
            [0.182 + grow, top],
            [0.182 + grow, 0.33],
            [0.21 + grow, 0.26],
            [0.238 + grow, 0.165],
            [0, 0.165],
          ]),
        )
        .scale([1, 1, 0.84])
        .scale([0.92, 1, 1])
        .at(0, 0, 0.018);
    const clothFolds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(x, z) * 11 + noise.fbm(x * 12, y * 4, z * 12, 2) * 2) * Math.min(1, Math.max(0, (0.31 - y) / 0.12));
    const tearCut = (i: number, w: number, top: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-w, 0.08],
            [w, 0.08],
            [0, top],
          ]),
          0.3,
        )
        .at(0, 0, 0.25)
        .rotateY(i);
    const tears = sdf.union(
      ...Array.from({ length: 11 }, (_, i) =>
        tearCut(i * 32.7 + (noise.random(i, 7, 1) - 0.5) * 14, 0.026 + noise.random(i, 7, 2) * 0.018, 0.21 + noise.random(i, 7, 3) * 0.06),
      ),
      ...Array.from({ length: 7 }, (_, i) => tearCut(i * 51.4 + 17, 0.007, 0.2 + noise.random(i, 8, 3) * 0.04)),
    );
    const skirt = skirtCone(0, 0.33)
      .subtract(skirtCone(-0.013, 0.45))
      .displace(0.009, clothFolds, 1.5)
      .subtract(tears);
    // The darker streaks and hem follow the clothing slot (an offset from the body color).
    const redDark = shadeOf(C.jerkin, C.jerkinDark);
    const loincloth = sdf
      .union(
        skirt.intersect(sdf.halfSpace([0, -1, 0], -0.25)).bone('hips'),
        skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([-1, 0, 0], 0)).bone('leg.L'),
        skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([1, 0, 0], 0)).bone('leg.R'),
      )
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(x, z);
        const streak = noise.fbm(a * 7, y * 5, 0.3, 2);
        const hem = Math.min(1, Math.max(0, (0.27 - y) / 0.08));
        const t = Math.min(1, Math.max(0, hem * 0.75 + (streak > 0.15 ? 0.45 : streak < -0.3 ? -0.25 : 0)));
        return [base[0] + redDark[0] * t, base[1] + redDark[1] * t, base[2] + redDark[2] * t];
      });
    k.body('loincloth', loincloth, { color: T.cloth, roughness: 0.88 });
    // A second belt 0.04 below the first, over the wrap, with a strap end hanging from the left hip.
    const belt2 = skirtCone(0.02, 0.33).intersect(sdf.box([0.6, 0.049, 0.6], 0.006).at(0, beltY - 0.045, 0));
    const strapZ = sdf.raycast(skirtCone(0, 0.33), [0.11, 0.23, 1], [0, 0, -1])![2];
    const strapEnd = sdf.box([0.034, 0.12, 0.012], 0.004).rotateX(-4).at(0.11, 0.235, strapZ + 0.008);
    k.body('belt2', sdf.union(belt2, strapEnd).bone('hips'), { color: T.leather, roughness: 0.6, detail: 0.004 });
    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [3 * wave(p), 0, 0], scale: [1 + 0.015 * bump(p), 1, 1 + 0.015 * bump(p)] },
        neck: { rotate: [-2 * wave(p), 0, 0] },
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 4 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -4 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    // A heavy, rolling walk: the weight shifts from side to side at each step.
    // The legs come from motion.gait: planted stance feet, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `bob` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the left arm
    // is back. The hips' turn and sway go to gait, so the planted feet do not slide.
    // The bow arm swings less than the free arm, so the bow stays clear of the leg.
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      bob: number,
      armSwing: number,
      lean: number,
      sway: number,
      carry = 0,
    ) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, sway * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 8,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.26, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          knot: { rotate: [lean + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'upperarm.L': { rotate: [armSwing * 0.45 * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -4] as const },
          'forearm.L': { rotate: [(-armSwing * 0.4 - armSwing * 0.3 * Math.max(0, -s)) * 0.5, 0, 0] as const },
          ...(carry > 0 && {
            'forearm.R': { rotate: [-carry * (1 - s), 0, 0] as const },
            'hand.R': { rotate: [-carry * 0.5 * (1 - s), 0, 0] as const },
          }),
        };
      },
    });
    // A heavy brute: long, planted steps with a low swing; the run has a short flight.
    k.animation('walk', stride(1.0, 0.11, 0.025, 0.62, 0.008, 20, 4, 4));
    k.animation('run', stride(0.6, 0.16, 0.045, 0.42, 0.03, 36, 12, 3));


    // ------------------------------------------------------------------ attack: raise the bow, draw to the cheek, hold, release
    // Targets are in the chest's rest frame. The orc turns its left shoulder to the target (hips,
    // spine and chest turn 70 degrees in all, the head turns back), so the target lies along
    // AIM = (0.94, 0, 0.34) in that frame. The left arm holds the bow up and out along AIM; the
    // right hand goes to the string, is drawn to the cheek (0.3 s hold), then snaps forward.
    const { keys, reach, orient } = motion;
    const deg = (r: number) => r / DEG;
    const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const shake = (p: number, at: number, len: number, n: number) =>
      p < at ? 0 : Math.exp((-(p - at) / len) * 3) * Math.sin(((p - at) / len) * Math.PI * n);
    const bowHand = (arm: { upper: V3; lower: V3 }, dir: V3, up: V3) => orient([arm.upper, arm.lower], BOW, { dir: norm(dir), up: norm(up) });
    const AIM: V3 = [0.94, 0, 0.34];
    const BOW_AIM_DIR: V3 = [0.02, 1, 0.02];

    k.animation('attack', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.7, 0.16, 4);
        const turn = keys(p, [[0, 0], [0.17, 1], [0.86, 1], [1, 0]] as const);
        const hipsY = -30 * turn;
        const spineY = -20 * turn;
        const chestY = -20 * turn;
        const total = hipsY + spineY + chestY;
        // Left arm: raise the bow along AIM, kick it back a little at the release.
        const lw = keys(p, [[0, WRIST], [0.17, [0.43, 0.53, 0.075]], [0.66, [0.43, 0.53, 0.075]], [0.71, [0.4, 0.52, 0.05]], [0.86, [0.43, 0.53, 0.075]], [1, WRIST]] as const);
        const left = reach(ARM_L, lw, [0.5, 0.2, -0.4]);
        const bowDir = keys(p, [[0, BOW.dir], [0.17, BOW_AIM_DIR], [0.66, BOW_AIM_DIR], [0.71, [-0.12, 1, 0.02]], [0.86, BOW_AIM_DIR], [1, BOW.dir]] as const);
        const bowUp = keys(p, [[0, BOW.up], [0.17, AIM], [0.86, AIM], [1, BOW.up]] as const);
        const lhand = bowHand(left, bowDir, bowUp);
        // Right hand: to the string near the chest, drawn to the cheek, held, then snapped forward.
        const rw = keys(
          p,
          [
            [0, mx(WRIST)],
            [0.17, [-0.18, 0.44, 0.29]],
            [0.24, [-0.18, 0.44, 0.29]], // on the string
            [0.44, [-0.19, 0.53, 0.29]], // drawn to the cheek
            [0.66, [-0.19, 0.53, 0.29]], // held for 0.3 s
            [0.71, [-0.06, 0.38, 0.3]], // released: the hand snaps forward
            [0.8, [-0.1, 0.4, 0.27]],
            [1, mx(WRIST)],
          ] as const,
          'spline',
        );
        const pole = keys(p, [[0, [-0.8, 0.3, 0]], [0.17, [-0.7, 0.3, 0.1]], [0.44, [-0.7, 0.3, 0.1]], [0.66, [-0.7, 0.3, 0.1]], [0.75, [-0.7, 0.3, 0.1]], [1, [-0.8, 0.3, 0]]] as const);
        const right = reach(ARM_R, rw, pole);
        const trem = p > 0.46 && p < 0.66 ? 0.6 * Math.sin((p - 0.46) * 90) : 0; // strain in the hold
        return {
          hips: { rotate: [0, hipsY, 0] },
          spine: { rotate: [-2 * turn, spineY, 0] },
          chest: { rotate: [-3 * turn + 3 * sh + trem * 0.4, chestY, 0] },
          neck: { rotate: [0, -total * 0.25, 0] },
          // The head turns back to the target and tips toward the string hand.
          head: { rotate: [-2 * turn - 2 * sh, -total * 0.65, 4 * turn] },
          knot: { rotate: [-4 * turn + 10 * sh, 0, -total * 0.1] },
          'upperarm.L': { rotate: left.upper },
          'forearm.L': { rotate: left.lower },
          'hand.L': { rotate: lhand },
          'upperarm.R': { rotate: right.upper },
          'forearm.R': { rotate: right.lower },
          // The feet stay planted: the legs turn back against the hips.
          'leg.L': { rotate: [0, -hipsY * 0.6, 3 * turn] },
          'leg.R': { rotate: [0, -hipsY * 0.6, -3 * turn] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a quick front kick, then a bow bash
    // The weight goes onto the left leg, the right knee comes up and the foot snaps out (the sole
    // leads), the leg comes back; then the chest turns and the left arm swings the bow across the
    // front like a club.
    k.animation('attack2', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.62, 0.14, 4);
        // The kick: chamber, snap, hold, retract.
        const thighR = keys(p, [[0, 0], [0.1, -30], [0.24, -80], [0.3, -82], [0.36, -80], [0.44, -70], [0.56, -10], [0.66, 0]] as const);
        const shinR = keys(p, [[0, 0], [0.1, 20], [0.24, 92], [0.29, 88], [0.34, 2], [0.4, 0], [0.5, 20], [0.58, 6], [0.66, 0]] as const);
        const leanBack = keys(p, [[0, 0], [0.22, -8], [0.36, -12], [0.5, -6], [0.62, 0]] as const);
        const hipsY0 = keys(p, [[0, 0], [0.12, 8], [0.36, 8], [0.5, 0], [0.6, 0]] as const);
        // The bash: cock the bow up behind, then sweep it forward across the front.
        const chestY = keys(p, [[0, 0], [0.5, 0], [0.62, 26], [0.7, 26], [0.8, -34], [0.88, -36], [1, 0]] as const);
        const hipsY = hipsY0 + keys(p, [[0, 0], [0.62, 0], [0.7, 12], [0.8, -14], [0.88, -14], [1, 0]] as const);
        const lw = keys(
          p,
          [
            [0, WRIST],
            [0.5, WRIST], // the bow stays in its carrying pose during the kick
            [0.66, [0.4, 0.72, -0.1]], // cocked up behind the shoulder
            [0.7, [0.4, 0.72, -0.1]],
            [0.8, [0.4, 0.5, 0.1]], // the smash
            [0.88, [0.4, 0.48, 0.1]],
            [1, WRIST],
          ] as const,
          'spline',
        );
        const left = reach(ARM_L, lw, [0.6, 0.2, -0.5]);
        const bowDir = keys(
          p,
          [[0, BOW.dir], [0.5, BOW.dir], [0.66, [0.15, 1, -0.3]], [0.7, [0.15, 1, -0.3]], [0.8, [0.9, 0.1, 0.4]], [0.88, [0.9, 0.1, 0.4]], [1, BOW.dir]] as const,
          'spline',
        );
        const lhand = bowHand(left, bowDir, keys(p, [[0, BOW.up], [0.5, BOW.up], [0.66, [-1, 0, 0]], [0.8, [0, 0.4, 1]], [1, BOW.up]] as const));
        const rw = keys(p, [[0, mx(WRIST)], [0.12, [-0.32, 0.36, 0.06]], [0.5, [-0.32, 0.38, 0.05]], [0.66, [-0.3, 0.5, -0.04]], [0.8, [-0.14, 0.42, 0.14]], [1, mx(WRIST)]] as const, 'smooth');
        const right = reach(ARM_R, rw, [-0.8, 0.2, -0.3]);
        // The right foot leaves the floor, so the hips ride on the left leg: it stays straight.
        return {
          hips: { rotate: [0, hipsY, 0] },
          spine: { rotate: [leanBack, 0, 0] },
          chest: { rotate: [3 * sh, chestY, 0] },
          head: { rotate: [-leanBack * 0.6 - 3 * sh, -(chestY + hipsY) * 0.6, 0] },
          knot: { rotate: [-leanBack * 0.8 + 10 * sh, 0, -chestY * 0.2] },
          'upperarm.L': { rotate: left.upper },
          'forearm.L': { rotate: left.lower },
          'hand.L': { rotate: lhand },
          'upperarm.R': { rotate: right.upper },
          'forearm.R': { rotate: right.lower },
          'leg.L': { rotate: [0, -hipsY, 0] },
          'leg.R': { rotate: [thighR, -hipsY, 0] },
          'shin.R': { rotate: [shinR, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ roar: a war cry with the bow raised
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
        const lift = Math.max(0, rise);
        const crouch = Math.max(0, -rise);
        // Seven quick trembles while it roars (odd, so the strip does not freeze on them).
        const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
        const bowWrist = keys(p, [[0, WRIST], [0.16, [0.3, 0.33, 0.08]], [0.3, [0.4, 0.68, 0.06]], [0.8, [0.4, 0.68, 0.06]], [1, WRIST]] as const, 'smooth');
        const arm = reach(ARM_L, bowWrist, [0.8, 0.2, -0.2]);
        const bowDir = keys(p, [[0, BOW.dir], [0.16, BOW.dir], [0.3, [0.2, 1, 0.1]], [0.8, [0.2, 1, 0.1]], [1, BOW.dir]] as const, 'smooth');
        const bowUp = keys(p, [[0, BOW.up], [0.3, [1, 0, 0.2]], [0.8, [1, 0, 0.2]], [1, BOW.up]] as const, 'smooth');
        const hand = bowHand(arm, bowDir, bowUp);
        const fist = reach(ARM_R, keys(p, [[0, mx(WRIST)], [0.16, [-0.28, 0.33, 0.1]], [0.3, [-0.38, 0.64, 0.06]], [0.8, [-0.38, 0.64, 0.06]], [1, mx(WRIST)]] as const, 'smooth'), [-0.8, 0.2, -0.2]);
        return {
          hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
          spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
          chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0], scale: [1 + 0.04 * lift, 1, 1 + 0.03 * lift] },
          neck: { rotate: [6 * crouch - 8 * lift, 0, 0] },
          head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
          knot: { rotate: [-12 * crouch + 18 * lift + 8 * tremble, 0, 6 * tremble] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          'upperarm.R': { rotate: fist.upper },
          'forearm.R': { rotate: fist.lower },
          'leg.L': { rotate: [0, 0, 4 * lift] },
          'leg.R': { rotate: [0, 0, -4 * lift] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: snap back from a blow, a step back, recover
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.16, 1], [0.38, 0.8], [1, 0]] as const);
        const back = -0.025 * r;
        const legL = deg(Math.atan2(back, 0.19));
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
          spine: { rotate: [-8 * r, 0, 3 * r] },
          chest: { rotate: [-9 * r, 7 * r, 0] },
          neck: { rotate: [-5 * r, 0, 0] },
          head: { rotate: [-14 * r, -9 * r, 6 * r] },
          knot: { rotate: [18 * r, 0, -10 * r] },
          'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
          'forearm.L': { rotate: [-22 * r, 0, 0] },
          'upperarm.R': { rotate: [10 * r, 0, -18 * r] },
          'forearm.R': { rotate: [-12 * r, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] }, // a small step back
          'foot.R': { rotate: [-12 * r, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: stagger back, topple, lie on the back
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
          'upperarm.L': { rotate: [keys(p, [[0, 0], [0.2, 12], [0.4, -8], [0.58, -55], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, 28], [0.4, 12], [0.58, 40], [0.7, 60], [1, 62]] as const)] },
          'forearm.L': { rotate: [keys(p, [[0, 0], [0.2, -30], [0.58, -20], [0.7, -6], [1, -8]] as const), 0, 0] },
          'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -45], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, -22], [0.4, -10], [0.58, -35], [0.7, -58], [1, -60]] as const)] },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
          'hand.L': { rotate: [keys(p, [[0, 0], [0.4, 0], [0.55, 55], [1, 55]] as const), 0, 0] },
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
