import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Goblin shaman — Chibi Quest enemy (catalog `enemies/humanoid/goblin-shaman`), a P1 caster for the
 * forest and dungeon scenes, about 1.04 m to the feather tips, faces +Z. Target:
 * docs/enemy-mockups/goblin-shaman_001.jpg. Built on the goblin archer (the goblin warrior's head,
 * face, body, knees, and clip set), so the goblins read as one tribe.
 *
 * Role: a ranged caster enemy, seen in 3D and as a 128 px sprite; the ears, the feathers, and the
 *   green flame on the skull staff read.
 * One idea: a small, sullen goblin witch doctor in a patched hide cloak, a band of bones and grey
 *   feathers on its head, lifting a crooked staff with a skull that burns with a green flame.
 * Proportions: the goblin warrior's (head center 0.7, eyes 0.655, chin 0.51, belt 0.28); the
 *   headband at 0.8, the feathers to 1.04, the mantle hem at 0.32, the kilt hem at 0.14.
 * Shape language: round (head, cheeks, fists, feet, skull) with points for menace (ear tips,
 *   feathers, ragged hems, teeth, flame).
 * Palette (60/30/10): green skin #7e9e3e; hide browns (cloak #8a6a44, kilt #8c7658, wood #6a4630);
 *   bone #e2d2a4 and face paint #e8e0c0; the green flame #6aff4a as the one bright accent.
 * Value plan: the light face paint and headband frame the face (focal point); the glowing flame
 *   is the second focus; the darker cloak and the staff wood ground the figure.
 * Bodies: skin, belly, legs, feet, cloak, kilt, leather, wraps, brass, necklace, headdress,
 *   feathers, staff-wood, skull, green-fire.
 * Rig: the archer's skeleton without the bow bones; the staff is rigid on `staff`, a child of
 *   `hand.R`, and the flame is on `flame` (a child of `staff`), so a clip can flare it (scale).
 *   Clips: idle, walk, run, attack (a cast: raise the staff, swing it forward, the flame flares),
 *   hit, death (a fall on the back; the staff drops and the flame gutters), taunt (shake the staff
 *   high, hop from foot to foot, then cackle).
 */

const C = {
  skin: '#7e9e3e',
  earInner: '#b0643a',
  paint: '#e8e0c0',
  eyeWhite: '#f7f1e6',
  iris: '#4e8a1c',
  irisLow: '#9cc83a',
  pupil: '#1a1416',
  lid: '#1d1a22',
  brow: '#3e4a22',
  mouth: '#3a2418',
  cloak: '#8a6a44',
  patchLight: '#a8875a',
  patchDark: '#6a4e30',
  kilt: '#8c7658',
  stitch: '#3a2616',
  leather: '#5a3a22',
  wrap: '#6e4a2c',
  wrapDark: '#4a2e1c',
  brass: '#b89a58',
  bone: '#e2d2a4',
  boneDark: '#a88a5a',
  bead: '#8a5a32',
  tooth: '#f0e8d0',
  feather: '#cfc8b8',
  featherTip: '#7e776a',
  quill: '#f2eee2',
  leaf: '#5f8f32',
  wood: '#6a4630',
  skull: '#cdb088',
  socket: '#2a1c14',
  magic: '#6aff4a',
  flameBase: '#1f5c12',
  flameCore: '#2f7a1e',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.7;
const HEAD = [0.205, 0.168, 0.205] as const;
const EYE = [0.108, 0.655] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const DEG = Math.PI / 180;
const scl3 = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];

// Joints. The left arm hangs relaxed; the right (staff) arm is held out, so the staff clears the
// cloak and the foot (the archer's arms, swapped).
const SHOULDER: V3 = [0.14, 0.405, 0];
const ELBOW_L: V3 = [0.2, 0.335, 0.01];
const WRIST_L: V3 = [0.222, 0.262, 0.03];
const ELBOW_R: V3 = [-0.215, 0.35, 0.01];
const WRIST_R: V3 = [-0.284, 0.318, 0.05];
const HIP: V3 = [0.075, 0.2, 0];
const ANKLE: V3 = [0.108, 0.075, 0];
const KNEE: V3 = [0.0915, 0.1375, 0]; // the knee: splits the leg (shin.L takes the weight below it)
/** The staff's grip in the right fist: the pivot of the `staff` bone. */
const GRIP_R: V3 = [WRIST_R[0] - 0.008, WRIST_R[1] - 0.044, WRIST_R[2] + 0.004];
// The staff's frame: local +Y along the shaft, the skull faces local +Z. It leans its top out
// (to the goblin's right) and a little forward, as in the mockup.
const STAFF_X = 6;
const STAFF_Z = 16;
const staffDir = (v: V3) => rotZv(rotXv(v, STAFF_X), STAFF_Z);
const staffPoint = (v: V3) => add(staffDir(v), GRIP_R);
const staffPose = (s: sdf.Shape) => s.rotateX(STAFF_X).rotateZ(STAFF_Z).at(...GRIP_R);
const SKULL_Y = 0.45; // the skull's center on the shaft (local)
const FLAME_Y = 0.54; // the flame's base on the skull's crown (local)
const FLAME_H = 0.2;
const FLAME_AT = staffPoint([0, FLAME_Y, -0.004]);

/** A fist hanging from the wrist `w`; `s` mirrors it for the right hand. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.046, 0.05, 0.05]).at(...o(0.008, -0.044, 0.004)),
    sdf.capsule(o(-0.01, -0.068, 0.034), o(-0.006, -0.044, 0.05), 0.02),
    sdf.cone(o(0.024, -0.026, 0.029), o(0.001, -0.038, 0.056), 0.019, 0.015),
  );
};

/** A flame of height `h`, base at the origin, up +Y (the skeleton mage's). */
const flame = (h: number) =>
  sdf.smoothUnion(
    h * 0.08,
    sdf.sphere(h * 0.3).at(0, h * 0.3, 0),
    sdf.chain(
      [
        [0, h * 0.35, 0, h * 0.28],
        [h * 0.05, h * 0.7, 0, h * 0.16],
        [-h * 0.04, h, 0, h * 0.03],
      ],
      h * 0.1,
    ),
    sdf.chain(
      [
        [h * 0.14, h * 0.4, 0.0, h * 0.13],
        [h * 0.3, h * 0.66, 0, h * 0.07],
        [h * 0.26, h * 0.86, 0, h * 0.018],
      ],
      h * 0.06,
    ),
    sdf.chain(
      [
        [-h * 0.15, h * 0.36, 0, h * 0.12],
        [-h * 0.3, h * 0.58, 0.02 * h, h * 0.06],
        [-h * 0.3, h * 0.76, 0, h * 0.016],
      ],
      h * 0.06,
    ),
  );

export default defineAsset({
  name: 'goblin-shaman',
  description: 'Chibi goblin shaman enemy with a bone and feather headdress, face paint, a patched hide cloak, bead and tooth necklaces, and a crooked skull staff with a green flame.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/goblin-shaman_001.jpg',
  // Color slots for individual shamans (the first option is the default look). The eyes follow
  // the magic: a shaman's eyes take the color of its flame.
  variants: {
    skin: { green: C.skin, olive: '#a0a446', greygreen: '#86957a' },
    cloak: { hide: C.cloak, ash: '#58544c', rust: '#8a4a2c' },
    magic: { green: C.magic, purple: '#b46aff', orange: '#ffa040' },
  },
  presets: {
    hexer: { skin: 'greygreen', cloak: 'ash', magic: 'purple' },
    firecaller: { skin: 'olive', cloak: 'rust', magic: 'orange' },
    bogseer: { skin: 'green', cloak: 'ash', magic: 'green' },
  },

  build(k) {
    const TS = {
      skin: k.tint('skin'),
      earInner: k.tint('skin', { color: C.earInner, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloak: k.tint('cloak'),
      patchLight: k.tint('cloak', { color: C.patchLight, follow: 1 }),
      patchDark: k.tint('cloak', { color: C.patchDark, follow: 1 }),
      kilt: k.tint('cloak', { color: C.kilt, follow: 1 }),
      magic: k.tint('magic'),
      flameBase: k.tint('magic', { color: C.flameBase, follow: 1 }),
      flameCore: k.tint('magic', { color: C.flameCore, follow: 1 }),
      iris: k.tint('magic', { color: C.iris, follow: 1 }),
      irisLow: k.tint('magic', { color: C.irisLow, follow: 1 }),
    };
    const EAR: V3 = [0.165, 0.7, -0.01];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.27, 0] },
      chest: { parent: 'spine', at: [0, 0.35, 0] },
      neck: { parent: 'chest', at: [0, 0.46, -0.01] },
      head: { parent: 'neck', at: [0, 0.51, -0.01] },
      'ear.L': { parent: 'head', at: EAR, tail: [0.37, 0.82, -0.15] },
      'ear.R': { parent: 'head', at: mx(EAR), tail: [-0.37, 0.82, -0.15] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      staff: { parent: 'hand.R', at: GRIP_R },
      flame: { parent: 'staff', at: FLAME_AT },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and ears (the goblin warrior's)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, -0.005),
        pair(sdf.sphere(0.1).at(0.108, 0.605, 0.062)), // full cheeks
        sdf.ellipsoid([0.15, 0.06, 0.1]).at(0, 0.56, 0.05), // broad jaw
        sdf.ellipsoid([0.07, 0.042, 0.05]).at(0, 0.58, 0.12), // a small muzzle under the nose
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.042, 0.029, 0.03]).at(0, 0.6, faceZ(0, 0.6) - 0.007).bone('head');
    // A green topknot on the crown, in front of the feathers.
    const topknot = sdf
      .smoothUnion(0.02, sdf.ellipsoid([0.045, 0.03, 0.042]).at(0.01, 0.86, -0.02), sdf.cone([0.01, 0.87, -0.02], [0.03, 0.93, -0.03], 0.024, 0.008))
      .bone('head');

    // A flat leaf, drawn outward along +X with the base at the origin; the cup faces +Z.
    const earOutline = profile.polygon(
      [
        [-0.05, 0.105],
        [0.05, 0.11],
        [0.15, 0.113],
        [0.225, 0.112],
        [0.258, 0.1],
        [0.225, 0.07],
        [0.17, 0.015],
        [0.105, -0.05],
        [0.04, -0.1],
        [-0.05, -0.125],
      ],
      { smooth: true, samples: 5 },
    );
    const earCup = sdf.extrude(profile.offsetProfile(earOutline, -0.028), 0.03, 0.01).at(0.012, 0.004, 0.02);
    const earLocal = sdf.extrude(earOutline, 0.028, 0.012).smoothSubtract(0.01, earCup);
    const earPose = (s: sdf.Shape) => s.scale(1.1).rotateY(38).at(...EAR);
    const ears = pair(earPose(earLocal.paintWhere(earCup.round(0.004), TS.earInner, 0.008)).bone('ear.L'));
    const neck = sdf.capsule([0, 0.44, -0.01], [0, 0.55, -0.01], 0.056).bone('neck');

    // Arms: bare green arms and big fists.
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.046, 0.04).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.04, 0.036).bone('forearm.L'),
      fistAt(WRIST_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.046, 0.04).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.04, 0.036).bone('forearm.R'),
      fistAt(WRIST_R, -1).bone('hand.R'),
    );

    // Face: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.06, 0.064, 0.07]), EYE[0], EYE[1]));
    const IRIS_X = EYE[0] - 0.008;
    const iris = pair(at(sdf.ellipsoid([0.042, 0.05, 0.07]), IRIS_X, EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.021, 0.03, 0.07]), IRIS_X, EYE[1] - 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.064, 0.012, 12, 168), 0.3).at(EYE[0], EYE[1] - 0.002, 0.1));
    const lowLid = pair(sdf.extrude(profile.arc(0.063, 0.005, 200, 340), 0.3).at(EYE[0], EYE[1] + 0.001, 0.1));
    const shine = sdf.union(
      ...[IRIS_X, -IRIS_X].flatMap((x) => [
        at(sdf.sphere(0.013), x + 0.013, EYE[1] + 0.014),
        at(sdf.sphere(0.006), x - 0.012, EYE[1] - 0.026),
      ]),
    );
    // Worried brows that rise toward the middle: a sullen, brooding look.
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.16, 0.73],
              [0.125, 0.742],
              [0.09, 0.748],
              [0.058, 0.752],
              [0.058, 0.738],
              [0.09, 0.734],
              [0.125, 0.728],
              [0.158, 0.716],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // A small, downturned mouth: a pout.
    const MOUTH_R = 0.2;
    const mouth = sdf.extrude(profile.arc(MOUTH_R, 0.008, 76, 104), 0.3).at(0, 0.548 - MOUTH_R, 0.1);
    // Face paint: a stripe down the forehead, a dash over each brow, and two stripes on each cheek.
    const streak = (y: number) =>
      sdf
        .extrude(
          profile.polygon(
            [
              [-0.03, 0.006],
              [0.02, 0.008],
              [0.032, 0.0],
              [0.02, -0.007],
              [-0.03, -0.005],
            ],
            { smooth: true, samples: 3 },
          ),
          0.3,
        )
        .rotateZ(-10)
        .at(0.15, y, 0.1);
    const facePaint = sdf.union(
      pair(sdf.union(streak(0.598), streak(0.572))),
      sdf.extrude(profile.rect([0.022, 0.056], 0.009), 0.3).at(0, 0.742, 0.1),
      pair(sdf.extrude(profile.rect([0.03, 0.01], 0.005), 0.3).rotateZ(-20).at(0.1, 0.775, 0.1)),
    );
    const noseFront = sdf.raycast(nose, [0, 0.588, 1], [0, 0, -1])![2];
    const nostrils = pair(sdf.ellipsoid([0.009, 0.007, 0.01]).at(0.018, 0.584, noseFront - 0.012));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .smoothUnion(0.02, topknot)
      .smoothUnion(0.02, ears)
      .union(armL, armR)
      .paintWhere(facePaint, C.paint, 0.003)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(iris, TS.iris)
      .paintWhere(irisLow, TS.irisLow, 0.014)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lowLid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(mouth, TS.mouth)
      .paintWhere(nostrils, TS.mouth, 0.003);
    k.body('skin', skin, { color: TS.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ headdress: a band of bones, a bone disc, feathers
    const BAND_Y = 0.8;
    const bandCord = head
      .round(0.006)
      .subtract(head.round(-0.01))
      .intersect(sdf.box([0.6, 0.012, 0.6]).at(0, BAND_Y, 0));
    const segments = sdf.union(
      ...[-104, -87, -70, -53, -36, -19, 19, 36, 53, 70, 87, 104].map((a) => {
        const p = sdf.surfacePoint(head, [Math.sin(a * DEG) * 0.3, BAND_Y, Math.cos(a * DEG) * 0.3], 0.004);
        return sdf.ellipsoid([0.0175, 0.022, 0.014]).rotateY(a).at(...p);
      }),
    );
    const discAt = sdf.surfacePoint(head, [0, BAND_Y + 0.004, 0.3], 0.01);
    const disc = sdf
      .cylinder(0.037, 0.018, 0.008)
      .rotateX(62)
      .at(...discAt)
      .paintWhere(sdf.sphere(0.012).at(discAt[0], discAt[1] + 0.008, discAt[2] + 0.015), C.boneDark, 0.003);
    const headdress = sdf
      .union(bandCord.paint(C.leather), segments, disc)
      .paintWhere(sdf.union(...[-75, -30, 45, 90].map((a) => sdf.sphere(0.02).at(Math.sin(a * DEG) * 0.2, BAND_Y, Math.cos(a * DEG) * 0.2))), C.boneDark, 0.004);
    k.body('headdress', headdress, { color: C.bone, roughness: 0.6, detail: 0.004, bone: 'head' });

    // Feathers: flat blades rising up and back from the crown, to the goblin's left.
    const feather = (len: number, w: number) => {
      const blade = sdf.extrude(
        profile.polygon(
          [
            [0, 0],
            [w * 0.7, len * 0.12],
            [w, len * 0.5],
            [w * 0.7, len * 0.85],
            [0, len],
            [-w * 0.6, len * 0.85],
            [-w * 0.9, len * 0.5],
            [-w * 0.5, len * 0.12],
          ],
          { smooth: true, samples: 4 },
        ),
        0.009,
        0.004,
      );
      return blade
        .paintWhere(sdf.halfSpace([0, -1, 0], -len * 0.72), C.featherTip, 0.02)
        .paintWhere(sdf.box([0.004, len * 2, 0.1]), C.quill, 0.001);
    };
    const featherAt = (s: sdf.Shape, twist: number, back: number, out: number, base: V3) => s.rotateY(twist).rotateX(-back).rotateZ(-out).at(...base);
    const feathers = sdf.union(
      featherAt(feather(0.23, 0.044), 12, 16, 26, [0.05, 0.84, -0.05]),
      featherAt(feather(0.2, 0.042), 20, 20, 50, [0.07, 0.83, -0.04]),
      featherAt(feather(0.21, 0.04), 4, 28, 6, [0.03, 0.845, -0.07]),
      featherAt(feather(0.12, 0.03), -10, 4, 20, [0.03, 0.855, -0.01]).paint(C.leaf),
      featherAt(feather(0.1, 0.028), -20, 8, 42, [0.05, 0.85, 0.0]).paint(C.leaf),
    );
    k.body('feathers', feathers, { color: C.feather, roughness: 0.8, detail: 0.003, bone: 'head' });

    // ------------------------------------------------------------------ cloak: a ragged mantle and a back cape, patched
    const mantleSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.505],
            [0.135, 0.488],
            [0.196, 0.448],
            [0.226, 0.39],
            [0.238, 0.322],
            [0.22, 0.316],
            [0.208, 0.382],
            [0.18, 0.434],
            [0.126, 0.468],
            [0.066, 0.482],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86]);
    /** A torn notch from below at `a` degrees (from +Z toward +X): base `y`, width `w`, height `h`. */
    const tear = (a: number, y: number, w: number, h: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-w, y],
            [w, y],
            [w * 0.2, y + h],
          ]),
          0.3,
        )
        .at(0, 0, 0.2)
        .rotateY(a);
    const mantle = mantleSolid.subtract(
      sdf.union(
        ...(
          [
            [8, 0.035, 0.06],
            [46, 0.04, 0.075],
            [88, 0.03, 0.05],
            [128, 0.045, 0.07],
            [172, 0.035, 0.06],
            [214, 0.04, 0.075],
            [256, 0.03, 0.055],
            [298, 0.045, 0.072],
            [336, 0.03, 0.05],
          ] as const
        ).map(([a, w, h]) => tear(a, 0.29, w, h)),
      ),
    );
    // The cape hangs from under the mantle down the back, flaring, and shows at the sides.
    const capeSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.15, 0.47],
            [0.2, 0.42],
            [0.226, 0.33],
            [0.242, 0.22],
            [0.252, 0.14],
            [0.24, 0.14],
            [0.229, 0.22],
            [0.213, 0.33],
            [0.188, 0.42],
            [0.14, 0.46],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9])
      .intersect(sdf.halfSpace([0, 0, 1], -0.08));
    const cape = capeSolid.subtract(
      sdf.union(
        ...(
          [
            [118, 0.03, 0.06],
            [150, 0.04, 0.09],
            [178, 0.035, 0.05],
            [205, 0.045, 0.085],
            [236, 0.03, 0.06],
          ] as const
        ).map(([a, w, h]) => tear(a, 0.12, w, h)),
      ),
    );
    /** A sewn-on patch on `shape` at `a` degrees around, height `y`: the patch and its stitches. */
    const patchOn = (shape: sdf.Shape, a: number, y: number, w: number, h: number, rot: number) => {
      const p = sdf.surfacePoint(shape, [Math.sin(a * DEG) * 0.4, y, Math.cos(a * DEG) * 0.4], 0);
      const pose = (s: sdf.Shape) => s.rotateZ(rot).rotateY(a).at(...p);
      const dashes: sdf.Shape[] = [];
      const n = Math.max(2, Math.round(w / 0.016));
      const m = Math.max(2, Math.round(h / 0.016));
      for (let i = 0; i < n; i++) {
        const u = -w / 2 + ((i + 0.5) * w) / n;
        dashes.push(sdf.box([0.0035, 0.012, 0.1]).at(u, h / 2, 0), sdf.box([0.0035, 0.012, 0.1]).at(u, -h / 2, 0));
      }
      for (let j = 0; j < m; j++) {
        const v = -h / 2 + ((j + 0.5) * h) / m;
        dashes.push(sdf.box([0.012, 0.0035, 0.1]).at(w / 2, v, 0), sdf.box([0.012, 0.0035, 0.1]).at(-w / 2, v, 0));
      }
      return { patch: pose(sdf.box([w, h, 0.1], 0.006)), stitches: pose(sdf.union(...dashes)) };
    };
    const patched = (shape: sdf.Shape, list: readonly (readonly [number, number, number, number, number, 'light' | 'dark'])[]) => {
      let s = shape;
      for (const [a, y, w, h, rot, tone] of list) {
        const { patch, stitches } = patchOn(shape, a, y, w, h, rot);
        s = s.paintWhere(patch, tone === 'light' ? TS.patchLight : TS.patchDark, 0.002).paintWhere(stitches, C.stitch, 0.001);
      }
      return s;
    };
    const mantlePatched = patched(mantle, [
      [34, 0.405, 0.05, 0.042, 10, 'light'],
      [-52, 0.375, 0.046, 0.04, -8, 'dark'],
      [168, 0.4, 0.06, 0.05, 5, 'dark'],
      [-120, 0.43, 0.045, 0.04, 12, 'light'],
    ]);
    const capePatched = patched(cape, [
      [198, 0.26, 0.06, 0.06, -6, 'light'],
      [150, 0.2, 0.05, 0.045, 12, 'dark'],
    ]);
    k.body('cloak', sdf.union(mantlePatched.bone('chest'), capePatched.bone('spine')), {
      color: TS.cloak,
      roughness: 0.9,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ belly, kilt, and straps
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.5],
            [0.06, 0.498],
            [0.1, 0.482],
            [0.128, 0.452],
            [0.138, 0.4],
            [0.136, 0.34],
            [0.133, 0.3],
            [0.142, 0.26],
            [0.152, 0.236],
            [0.156, 0.222],
            [0.148, 0.212],
            [0, 0.212],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    k.body('belly', torso.bone('spine'), { color: TS.skin, roughness: 0.55 });
    const kiltSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.14, 0.302],
            [0.156, 0.26],
            [0.17, 0.2],
            [0.184, 0.14],
            [0.172, 0.138],
            [0.158, 0.2],
            [0.144, 0.26],
            [0.128, 0.302],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.82]);
    const kilt = kiltSolid.subtract(
      sdf.union(
        ...(
          [
            [-14, 0.03, 0.05],
            [30, 0.035, 0.06],
            [80, 0.03, 0.045],
            [130, 0.035, 0.055],
            [185, 0.03, 0.05],
            [240, 0.035, 0.06],
            [290, 0.03, 0.045],
          ] as const
        ).map(([a, w, h]) => tear(a, 0.12, w, h)),
      ),
    );
    k.body('kilt', patched(kilt, [[-24, 0.21, 0.045, 0.04, 6, 'dark']]).bone('hips'), { color: TS.kilt, roughness: 0.9 });

    const beltY = 0.285;
    const belt = torso.round(0.017).smoothIntersect(0.006, sdf.box([0.5, 0.036, 0.5], 0.006).at(0, beltY, 0));
    // A strap from the right shoulder, under the mantle, down to the left hip.
    const strap = torso.round(0.009).smoothIntersect(0.005, sdf.box([0.7, 0.03, 0.7], 0.005).rotateZ(-34).at(0, 0.36, 0));
    k.body('leather', sdf.union(belt, strap).bone('spine'), { color: C.leather, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.06, 0.048, 0.014], 0.007).subtract(sdf.box([0.032, 0.024, 0.03], 0.005)),
        sdf.box([0.008, 0.028, 0.01], 0.003).at(0.002, 0, 0.004),
      )
      .at(0, beltY, beltZ + 0.004);
    const strapBuckleAt = sdf.surfacePoint(strap, [0.085, 0.302, 0.2], 0.002);
    const strapBuckle = sdf
      .box([0.03, 0.034, 0.01], 0.004)
      .subtract(sdf.box([0.015, 0.018, 0.03], 0.002))
      .rotateZ(-34)
      .at(...strapBuckleAt);
    k.body('brass', sdf.union(buckle, strapBuckle).bone('spine'), { color: C.brass, roughness: 0.5, metalness: 0.6 });

    // ------------------------------------------------------------------ necklaces: beads under the chin, teeth below
    const beads = sdf.union(
      ...Array.from({ length: 13 }, (_, i) => {
        const a = -84 + i * 14;
        const p = sdf.surfacePoint(mantle, [Math.sin(a * DEG) * 0.14, 0.5, Math.cos(a * DEG) * 0.14 * 0.86], 0.008);
        const b = sdf.ellipsoid([0.0125, 0.012, 0.0125]).at(...p);
        return i % 3 === 1 ? b.paint(C.bead) : b;
      }),
    );
    const teeth = sdf.union(
      ...Array.from({ length: 11 }, (_, i) => {
        const a = -60 + i * 12;
        const out: V3 = [Math.sin(a * DEG), 0, Math.cos(a * DEG) * 0.86];
        const p = sdf.surfacePoint(mantle, [out[0] * 0.2, 0.44, out[2] * 0.2], 0.005);
        const long = i === 5 ? 0.05 : 0.034;
        const tip = add(add(p, norm([out[0] * 0.45, -1, out[2] * 0.45]), long), out, 0.004);
        return sdf.union(sdf.sphere(0.0065).at(...p).paint(C.bead), sdf.cone(p, tip, i === 5 ? 0.011 : 0.008, 0.0015));
      }),
    );
    k.body('necklace', sdf.union(beads, teeth.paint(C.tooth)).bone('chest'), { color: C.bone, roughness: 0.5, detail: 0.0035 });

    // ------------------------------------------------------------------ wraps: forearm wraps and ankle wraps
    const wrapOn = (e: V3, w: V3) =>
      sdf
        .cone(lerp(e, w, 0.4), lerp(e, w, 1.02), 0.043, 0.05)
        .round(0.003)
        .paintWhere(sdf.sphere(0.045).at(...lerp(e, w, 0.7)), C.wrapDark, 0.004);
    const ankleWrap = sdf.cylinder(0.064, 0.03, 0.01).at(0, 0.105, -0.01);
    const wraps = sdf.union(
      wrapOn(ELBOW_L, WRIST_L).bone('forearm.L'),
      wrapOn(ELBOW_R, WRIST_R).bone('forearm.R'),
      ankleWrap.rotateY(16).at(ANKLE[0], 0, 0).bone('foot.L'),
      ankleWrap.rotateY(-16).at(-ANKLE[0], 0, 0).bone('foot.R'),
    );
    k.body('wraps', wraps, { color: C.wrap, roughness: 0.7 });

    // ------------------------------------------------------------------ legs and bare feet
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.12, 0.055, 0.09]).at(0, 0.21, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0], 0.11, 0.004], 0.048).bone('leg.L')),
    );
    k.body('legs', legs, { color: TS.skin, roughness: 0.55 });
    // The archer's boot shape as a broad bare foot with three round toes.
    const footLocal = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.056, 0.1, 0.02).at(0, 0.06, -0.01),
        sdf.ellipsoid([0.074, 0.056, 0.125]).at(0, 0.05, 0.035),
        sdf.sphere(0.024).at(-0.036, 0.024, 0.14),
        sdf.sphere(0.026).at(0.0, 0.026, 0.152),
        sdf.sphere(0.024).at(0.036, 0.024, 0.14),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const foot = footLocal.rotateY(16).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('feet', pair(foot), { color: TS.skin, roughness: 0.55 });

    // ------------------------------------------------------------------ the crooked staff, the skull, the flame
    const wood = sdf
      .smoothUnion(
        0.012,
        sdf.chain(
          [
            [0.004, -0.23, 0.002, 0.016],
            [-0.006, -0.13, 0.006, 0.02],
            [0.002, -0.03, 0.0, 0.022],
            [0.006, 0.07, -0.004, 0.022],
            [-0.012, 0.16, 0.006, 0.021],
            [0.01, 0.25, -0.004, 0.022],
            [0.0, 0.33, -0.008, 0.024],
            [0.0, 0.375, -0.01, 0.03],
          ],
          0.02,
        ),
        sdf.sphere(0.027).at(-0.012, 0.16, 0.006), // knots at the crooks
        sdf.sphere(0.026).at(0.011, 0.25, -0.004),
      )
      .paintFn((x, y, z, base) => mixRgb(base, rgb('#3e2618'), 0.35 + 0.35 * noise.fbm(x * 60, y * 12, z * 60, 2)));
    const wrap = sdf
      .union(sdf.cylinder(0.03, 0.05, 0.006).at(0, 0.315, -0.006), ...[0.296, 0.315, 0.334].map((y) => sdf.torus(0.03, 0.0045).at(0, y, -0.006)))
      .paint(C.leather);
    k.body('staff-wood', staffPose(sdf.union(wood, wrap)), {
      color: C.wood,
      roughness: 0.8,
      detail: 0.004,
      bone: 'staff',
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 160, y * 25, z * 160, 2),
    });
    const socket = hard(sdf.sphere(0.017).at(0.023, -0.006, 0.056));
    const skullLocal = sdf
      .smoothUnion(
        0.018,
        sdf.ellipsoid([0.058, 0.054, 0.06]).at(0, 0.012, -0.006),
        sdf.ellipsoid([0.046, 0.036, 0.042]).at(0, -0.018, 0.016), // cheekbones and the upper jaw
        sdf.box([0.056, 0.026, 0.044], 0.01).at(0, -0.044, 0.016), // the lower jaw
      )
      .smoothSubtract(0.006, socket)
      .paintWhere(socket.round(0.006), C.socket, 0.004)
      .paintWhere(sdf.ellipsoid([0.008, 0.011, 0.03]).at(0, -0.03, 0.05), C.socket, 0.002) // the nose hole
      .paintWhere(
        sdf.union(sdf.box([0.046, 0.003, 0.1]).at(0, -0.043, 0.04), ...[-0.015, -0.005, 0.005, 0.015].map((x) => sdf.box([0.0025, 0.018, 0.1]).at(x, -0.043, 0.04))),
        C.socket,
        0.001,
      );
    k.body('skull', staffPose(skullLocal.scale(1.6).at(0, SKULL_Y, 0.006)), { color: C.skull, roughness: 0.6, detail: 0.0035, bone: 'staff' });
    const flameLocal = flame(FLAME_H).at(0, FLAME_Y, -0.004);
    const core = rgb(TS.flameCore);
    const outer = rgb(TS.flameBase);
    k.body(
      'green-fire',
      staffPose(flameLocal).paintFn((x, y, z) => {
        const t = Math.min(1, Math.max(0, (y - FLAME_AT[1]) / FLAME_H));
        const r = Math.hypot(x - FLAME_AT[0], z - FLAME_AT[2]) / (FLAME_H * 0.3);
        return mixRgb(core, outer, Math.min(1, Math.max(0, t * 0.9 + r * 0.5 - 0.15)));
      }),
      { color: TS.flameBase, roughness: 0.3, emissive: TS.magic, emissiveIntensity: 1.0, detail: 0.0035, bone: 'flame' },
    );

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, follow, quat, euler } = motion;
    const Z3: V3 = [0, 0, 0];
    /** The flame's flicker: a small, uneven pulse (integer cycles, so loops stay seamless). */
    const flicker = (p: number, n: number) => 1 + 0.05 * wave(p, n) + 0.03 * wave(p, n * 2 + 1, 0.3);

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => {
        const f = flicker(p, 6);
        return {
          hips: { move: [0, -0.003 * bump(p), 0] },
          chest: { rotate: [2.5 * wave(p), 0, 0] },
          neck: { rotate: [-1.5 * wave(p), 0, 0] },
          head: { rotate: [0, 6 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
          'ear.L': { rotate: [0, 0, 4 * wave(p, 1, 0.35)] },
          'ear.R': { rotate: [0, 0, -4 * wave(p, 1, 0.35)] },
          'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
          'hand.R': { rotate: [-1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
          'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
          'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
          flame: { rotate: [0, 0, 4 * wave(p, 3, 0.2)], scale: [f, f * (1 + 0.04 * wave(p, 5)), f] },
        };
      },
    });

    // The staff arm swings less than the free arm and lifts out from the body (`lift`, degrees);
    // the hand turns back by the lift and against the swing, so the staff stays near upright.
    // The legs come from motion.gait (the archer's): planted stance feet, a knee lift in the swing,
    // heel strike and toe-off. The left foot strikes at p = 0.25, when the left arm is back.
    const stride = (duration: number, step: number, footLift: number, duty: number, armSwing: number, lean: number, hop: number, lift: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.097, 0, -0.068],
          toe: [0.128, 0, 0.107],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        const f = flicker(p, 4) * (1 + 0.04 * Math.abs(s));
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'ear.L': { rotate: [0, lean * 0.8 + 3 * wave(p, 2, 0.2), 7 * wave(p, 2, 0.15)] as const },
          'ear.R': { rotate: [0, -lean * 0.8 - 3 * wave(p, 2, 0.2), -7 * wave(p, 2, 0.15)] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.35 * s, 0, -lift] as const },
          'forearm.R': { rotate: [-armSwing * 0.2, 0, 0] as const },
          'hand.R': { rotate: [armSwing * (0.3 * s + 0.2) - lean * 0.8, 0, lift] as const },
          flame: { rotate: [-lean - 6 * s, 0, 3 * wave(p, 2, 0.1)] as const, scale: [f, f, f] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.03, 0.58, 26, 3, 0.008, 8));
    k.animation('run', stride(0.56, 0.15, 0.05, 0.38, 46, 12, 0.035, 14));

    // ------------------------------------------------------------------ attack: a cast, solved by targets
    // Plan (in the chest's rest frame): the goblin lifts the staff high and out to its right, the
    // flame gathers; then it swings the staff forward and down until the skull points at the
    // target, and the flame flares to twice its size; a short hold, then back to rest. The staff
    // always leans out or forward, so the skull and the flame pass outside the head and the ears.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const CHAIN_R = [mx(SHOULDER), ELBOW_R, WRIST_R] as const;
    const STAFF_REST = { dir: staffDir([0, 1, 0]), up: staffDir([0, 0, 1]) };
    type Want = { dir: V3; up: V3 };
    const blendWant = (a: Want, b: Want, t: number): Want => ({ dir: norm(lerp(a.dir, b.dir, t)), up: norm(lerp(a.up, b.up, t)) });
    const POLE_R_REST: V3 = [-0.212, 0.248, -0.162];
    const POLE_R_CAST: V3 = [-0.37, 0.24, -0.12];
    const POLE_L_REST: V3 = [0.37, 0.417, -0.058];
    /** The staff arm: solve the wrist so the grip lands at `grip`, with the staff turned to `want`. */
    const staffArm = (grip: V3, want: Want, sh: V3, pole: V3) => {
      let wrist = sub(grip, sub(GRIP_R, WRIST_R));
      let arm = reach(ARM_R, sub(wrist, sh), pole);
      let hand: V3 = Z3;
      for (let i = 0; i < 3; i++) {
        arm = reach(ARM_R, sub(wrist, sh), pole);
        hand = orient([arm.upper, arm.lower], STAFF_REST, want);
        const g = add(follow(CHAIN_R, [arm.upper, arm.lower, hand], GRIP_R), sh);
        wrist = add(wrist, sub(grip, g));
      }
      return { arm, hand };
    };
    const HIGH_AT: V3 = [-0.29, 0.44, 0.05];
    const HIGH: Want = { dir: norm([-0.4, 1, -0.02]), up: [0, 0, 1] };
    const CAST_AT: V3 = [-0.21, 0.34, 0.15];
    const CAST: Want = { dir: norm([-0.2, 0.95, 1]), up: norm([0, 1, -0.95]) };
    const SH_UP: V3 = [0, 0.015, 0];
    const SH_CAST: V3 = [0.01, 0.01, 0.04];
    k.animation('attack', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        const lift = keys(p, [[0, 0], [0.3, 1], [0.4, 1], [0.5, 0]] as const);
        const strike = keys(p, [[0.36, 0], [0.5, 1], [0.7, 1], [0.95, 0]] as const);
        const toHigh = keys(p, [[0, 0], [0.3, 1]] as const);
        const toCast = keys(p, [[0.4, 0], [0.52, 1]] as const);
        const toRest = keys(p, [[0.7, 0], [1, 1]] as const);
        const gripAt = keys(p, [[0, GRIP_R], [0.3, HIGH_AT], [0.4, add(HIGH_AT, [0, 0.01, -0.01])], [0.52, CAST_AT], [0.7, CAST_AT], [1, GRIP_R]] as const);
        const want = blendWant(blendWant(blendWant(STAFF_REST, HIGH, toHigh), CAST, toCast), STAFF_REST, toRest);
        const sh = keys(p, [[0, Z3], [0.3, SH_UP], [0.4, SH_UP], [0.52, SH_CAST], [0.7, SH_CAST], [1, Z3]] as const);
        const pole = keys(p, [[0, POLE_R_REST], [0.25, POLE_R_CAST], [0.75, POLE_R_CAST], [1, POLE_R_REST]] as const);
        const staff = staffArm(gripAt, want, sh, pole);
        // The flame gathers in the lift, flares at the end of the swing, and settles.
        const flare = keys(p, [[0, 1], [0.3, 1.25], [0.4, 1.35], [0.46, 1.1], [0.53, 2.1], [0.62, 1.85], [0.74, 1.2], [1, 1]] as const);
        const f = flare * flicker(p, 9);
        return {
          spine: { rotate: [-4 * lift + 8 * strike, -10 * lift + 14 * strike, 0] },
          chest: { rotate: [-3 * lift + 6 * strike, -6 * lift + 8 * strike, 0] },
          neck: { rotate: [2 * strike, 6 * lift - 8 * strike, 0] },
          head: { rotate: [-6 * lift + 4 * strike, 4 * lift - 6 * strike, 0] },
          'ear.L': { rotate: [0, 6 * lift - 12 * strike, 6 * lift] },
          'ear.R': { rotate: [0, -6 * lift + 12 * strike, -6 * lift] },
          'upperarm.R': { move: sh, rotate: staff.arm.upper },
          'forearm.R': { rotate: staff.arm.lower },
          'hand.R': { rotate: staff.hand },
          // The free arm balances: out in the lift, back in the swing.
          'upperarm.L': { rotate: [-6 * lift + 16 * strike, 0, 12 * lift + 8 * strike] },
          'forearm.L': { rotate: [-16 * lift - 12 * strike, 0, 0] },
          flame: { scale: [f, f * 1.1, f] },
          // A braced stance: the left foot turns out a little, the knees give in the swing.
          'leg.L': { rotate: [-6 * strike, 6 * strike, 0] },
          'foot.L': { rotate: [6 * strike, 0, 0] },
          'leg.R': { rotate: [5 * strike, 0, 0] },
          'foot.R': { rotate: [-5 * strike, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The goblin warrior's hit. The head and the chest snap back and the hips give way: the left
    // foot stays planted and the right foot steps back, then all returns quickly. The staff arm
    // swings a little out and the hand tilts the staff out, clear of the head. The ears flop late.
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.077; // the back of the foot, behind the ankle's ground point
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const flop = keys(p, [[0.08, 0], [0.3, 1], [0.5, -0.4], [0.68, 0.15], [0.85, 0]] as const);
        const gutter = keys(p, [[0, 1], [0.12, 0.6], [0.3, 1.2], [0.6, 1]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, -5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, -6 * h, -3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, 6 * h, -4 * h] },
          'ear.L': { rotate: [4 * flop, -10 * flop, 6 * flop] },
          'ear.R': { rotate: [4 * flop, 10 * flop, -6 * flop] },
          'leg.R': { rotate: [-lean, 0, 0] },
          'foot.R': { rotate: [lean, 0, 0] },
          'leg.L': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.L': { rotate: [-lean - 16 * lift, 0, 0] },
          'upperarm.R': { rotate: [-10 * h, 0, -12 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'hand.R': { rotate: [18 * h, 0, 22 * h] },
          'upperarm.L': { rotate: [-6 * h, 0, 8 * h] },
          'forearm.L': { rotate: [-6 * h, 0, 0] },
          flame: { scale: [gutter, gutter, gutter] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The goblin warrior's death. The blow snaps the chest back, the goblin slumps forward and
    // wobbles, then tips back over its heels as one piece and lands on its back. The arms are
    // solved by targets in the chest's rest frame and lie out on the ground. The right hand opens
    // in the fall and the `staff` bone carries the staff to lie on the floor out to the right, the
    // skull up; the flame gutters down to an ember. The ears flop down last.
    const LIE = 84; // the hips' final tilt back, degrees
    const LIE_Y = 0.17; // the hips' height when the goblin lies on its back
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.27, 0], [0, 0.35, 0]]; // hips, spine, chest pivots
    const STAFF_CHAIN: readonly V3[] = [...TRUNK, mx(SHOULDER), ELBOW_R, WRIST_R];
    const DROP_AT: V3 = [-0.5, 0.036, -0.12]; // the grip on the floor
    const DROP_TURN = quat(orient([], STAFF_REST, { dir: norm([-0.35, 0.066, -1]), up: [0, 1, 0] }));
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = Math.min(1, Math.max(0, (p - 0.36) / 0.24)); // the fall speeds up to the impact
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const earUp = keys(p, [[0.36, 0], [0.54, 1], [0.62, 1], [0.7, 0]] as const);
        const earDown = keys(p, [[0.62, 0], [0.72, 1.15], [0.8, 0.92], [0.88, 1]] as const);
        const ember = keys(p, [[0, 1], [0.08, 1.4], [0.3, 0.9], [0.62, 0.5], [0.9, 0.18], [1, 0.15]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * Math.min(1, Math.max(0, (tilt - 66) / 18)); // the legs come down once the hips hold
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, -4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, -6 * hitB, -5 * wob];
        // The wrists: flung back by the blow, slumped, flung out in the fall, then out on the ground.
        const standL = add(add(add(WRIST_L, [0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [0.07, 0, 0.04], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.07], land), lerp(ELBOW_L, [0.25, 0.3, -0.2], land));
        const standR = add(add(add(WRIST_R, [-0.03, 0.02, 0.04], hitB), [0, -0.03, 0.02], sag), [-0.06, 0.03, 0.06], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.29, 0.34, -0.07], land), lerp(ELBOW_R, [-0.26, 0.3, -0.2], land));
        // The staff: in the posed hand until the hand opens, then it drops to the floor.
        const handQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).multiply(quat(armR.upper)).multiply(quat(armR.lower));
        const held = add(follow(STAFF_CHAIN, [hipsR, spineR, chestR, armR.upper, armR.lower, Z3], GRIP_R), hipsMove);
        const drop = keys(p, [[0.44, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = new THREE.Vector3(...add(lerp(held, drop, loose), held, -1)).applyQuaternion(inv);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 6 * land, 8 * hitB, 6 * wob - 6 * land] },
          'ear.L': { rotate: [0, -6 * hitB - 14 * earUp + 3 * earDown, 5 * wob + 8 * earUp - 8 * earDown] },
          'ear.R': { rotate: [0, 6 * hitB + 14 * earUp - 3 * earDown, -5 * wob - 8 * earUp + 8 * earDown] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          staff: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          flame: { scale: [ember, ember, ember] },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: shake the staff high, hop, cackle
    // Played when the goblin first sees the player. It lifts the staff high out to its right and
    // shakes it, the flame flaring with each shake, the head cocked away from it, and hops from
    // foot to foot twice with the ears flicking. Then it brings the staff back to rest and cackles:
    // the chin up, the chest bobbing, the free fist on the belly. `plant` keeps the soles down.
    const HIPS_AT: V3 = TRUNK[0]!;
    const c16 = Math.cos(16 * DEG);
    const s16 = Math.sin(16 * DEG);
    const SOLE_L: V3[] = ([[0, 0, -0.068], [0, 0, 0.128], [0.055, 0, 0.02], [-0.05, 0, 0.02]] as const).map(
      ([x, y, z]): V3 => [ANKLE[0] + x * c16 + z * s16, y, -x * s16 + z * c16],
    );
    const SOLE_R: V3[] = SOLE_L.map(mx);
    const hopArc = (p: number, a: number, b: number) => {
      const u = (p - a) / (b - a);
      return u <= 0 || u >= 1 ? 0 : 4 * u * (1 - u);
    };
    const SHAKE_AT: V3 = [-0.3, 0.45, 0.08];
    k.animation('taunt', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.12, 1], [0.5, 1], [0.62, 0]] as const);
        const cock = keys(p, [[0.04, 0], [0.16, 1], [0.5, 1], [0.6, 0]] as const);
        const env = keys(p, [[0.1, 0], [0.16, 1], [0.48, 1], [0.54, 0]] as const);
        const shake = env * Math.sin((2 * Math.PI * (p - 0.1)) / 0.11);
        const side = keys(p, [[0.14, 0], [0.22, 1], [0.3, 1], [0.38, -1], [0.46, -1], [0.54, 0]] as const);
        const air = 0.05 * (hopArc(p, 0.14, 0.26) + hopArc(p, 0.3, 0.42));
        const land = keys(p, [[0.25, 0], [0.28, 1], [0.32, 0], [0.41, 0], [0.44, 1], [0.48, 0]] as const);
        const flick = env * Math.sin((2 * Math.PI * (p - 0.14)) / 0.16);
        const cackleEnv = keys(p, [[0.58, 0], [0.66, 1], [0.88, 1], [0.98, 0]] as const);
        const laugh = cackleEnv * Math.abs(Math.sin((2 * Math.PI * (p - 0.62)) / 0.16));

        const liftL = Math.max(0, -side);
        const liftR = Math.max(0, side);
        const hipsR: V3 = [0, 0, -5 * side];
        const legL: V3 = [38 * liftL, 0, 5 * side + 18 * liftL];
        const legR: V3 = [38 * liftR, 0, 5 * side - 18 * liftR];
        const footL: V3 = [-34 * liftL, 0, 0];
        const footR: V3 = [-34 * liftR, 0, 0];
        const ground = motion.plant([
          { joints: [HIPS_AT, HIP, ANKLE], rotations: [hipsR, legL, footL], sole: SOLE_L },
          { joints: [HIPS_AT, mx(HIP), mx(ANKLE)], rotations: [hipsR, legR, footR], sole: SOLE_R },
        ]);

        // ---- the staff arm: high out to the side, shaken (a tilt out and a rock back and forth).
        const high = add(SHAKE_AT, [0, 0.012 * shake, 0.01 * shake]);
        const gripAt = lerp(GRIP_R, high, raise);
        const wantHigh: Want = { dir: norm([-0.4 - 0.1 * shake, 1, 0.08 + 0.12 * shake]), up: [0, 0, 1] };
        const want = blendWant(STAFF_REST, wantHigh, raise);
        const sh = scl3(SH_UP, raise);
        const pole = lerp(POLE_R_REST, POLE_R_CAST, raise);
        const staff = staffArm(gripAt, want, sh, pole);
        const f = (1 + 0.35 * env + 0.18 * Math.abs(shake) + 0.3 * laugh) * flicker(p, 12);
        // ---- the free arm: out in the dance, the fist on the belly in the cackle.
        const belly = reach(ARM_L, [0.1, 0.3, 0.19], POLE_L_REST);
        const freeUp: V3 = [-12 * env, 0, 16 * env];
        const upper = lerp(freeUp, belly.upper, cackleEnv);
        const lower = lerp([-20 * env, 0, 0], belly.lower, cackleEnv);
        return {
          hips: { move: [0, ground + air, 0], rotate: hipsR },
          spine: { rotate: [3 * land - 4 * cackleEnv + 3 * laugh, 0, 3 * side - 2 * cock] },
          chest: { rotate: [2 * cock - 3 * cackleEnv + 3 * laugh, 0, -2 * cock] },
          neck: { rotate: [4 * land - 4 * cackleEnv, 0, 0] },
          head: { rotate: [3 * cock - 10 * cackleEnv + 3 * laugh, -6 * cock, -9 * cock - 3 * side + 5 * cackleEnv] },
          'ear.L': { rotate: [0, 22 * flick, -8 * cock + 6 * land + 8 * flick - 10 * laugh] },
          'ear.R': { rotate: [0, -22 * flick, 8 * cock - 6 * land - 8 * flick + 10 * laugh] },
          'upperarm.R': { move: sh, rotate: staff.arm.upper },
          'forearm.R': { rotate: staff.arm.lower },
          'hand.R': { rotate: staff.hand },
          'upperarm.L': { rotate: upper },
          'forearm.L': { rotate: lower },
          flame: { rotate: [0, 0, 8 * shake], scale: [f, f * 1.1, f] },
          'leg.L': { rotate: legL },
          'leg.R': { rotate: legR },
          'foot.L': { rotate: footL },
          'foot.R': { rotate: footR },
        };
      },
    });
  },
});


