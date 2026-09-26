import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Skeleton warrior — Chibi Quest enemy (catalog `enemies/undead/skeleton`), about 0.97 m to the
 * top of its helmet, faces +Z. Target: docs/enemy-mockups/skeleton_001.png (cropped from the
 * Chibi Quest enemy sheet; one front view). Built on the knight's body and skeleton, so the
 * armored characters share a build.
 *
 * Role: a common undead enemy, seen in 3D and as a 128 px sprite; the skull face must read.
 * One idea: a big grinning skull with angry, glowing eyes under a dented iron helmet, behind a
 *   round red shield, with a sword raised to strike.
 * Proportions: the knight's (head center 0.675, shoulders 0.44 with pauldrons, belt 0.25,
 *   knees 0.12); the helmet crown at 0.97, the skull's brow at 0.72, the teeth at 0.53.
 * Shape language: round and chunky (helmet, skull, shield, pauldrons), with sharp accents for
 *   menace (slanted eye sockets, sword, torn tabard hems).
 * Palette (60/30/10): cream bone #efe2c4 and dark iron #5d646d; faded red cloth and shield
 *   #b8342c; brass #c89a40 and glowing amber eyes #ffb03a as the accents.
 * Value plan: the black eye sockets in the light skull are the strongest contrast (focal point),
 *   framed by the dark helmet; the red shield and scarf are the second masses.
 * Bodies: bone, eyes (emissive), pupils, helmet, rivets, scarf, mail, pauldrons, bracers, belt,
 *   tabard, leggings, greaves, sword, hilt, shield-wood, shield-iron, brass.
 * Rig: the knight's chibi skeleton plus `weapon` (a child of `hand.R`, carries the sword) and
 *   `shield` (a child of `forearm.L`, carries the shield); only the death clip moves those two.
 *   Clips: idle, walk, run, attack (an overhead chop), hit, death (a collapse into a heap).
 */

const C = {
  bone: '#efe2c4',
  boneShade: '#c9b58e',
  socket: '#1a1614',
  eye: '#ffb03a',
  pupil: '#1a1010',
  iron: '#5d646d',
  ironDark: '#3e434a',
  rivet: '#8e959e',
  brass: '#c89a40',
  red: '#b8342c',
  redDark: '#7e221c',
  mail: '#9aa0a8',
  leather: '#6a432c',
  leatherDark: '#4a2e1e',
  leggings: '#3a3a40',
  steel: '#a9b0b9',
  sole: '#2e2e34',
  wood: '#b83a2e',
  plank: '#8a2a22',
  grip: '#4a2e1e',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints. The right hand holds the sword up in front; the left forearm carries the shield.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.335, 0.03];
const WRIST_R: V3 = [-0.222, 0.3, 0.1];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.2, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];

// The sword: the grip axis points up, out, and forward; the guard sits just above the fist.
const FIST_R = add(WRIST_R, norm([WRIST_R[0] - ELBOW_R[0], WRIST_R[1] - ELBOW_R[1], WRIST_R[2] - ELBOW_R[2]]), 0.04);
const GRIP_DIR = norm([-0.42, 0.87, 0.26]);
const GUARD = add(FIST_R, GRIP_DIR, 0.045);
// rotateZ then rotateX turn local +Y into GRIP_DIR.
const SWORD_Z = (Math.asin(-GRIP_DIR[0]) * 180) / Math.PI;
const SWORD_X = (Math.atan2(GRIP_DIR[2], GRIP_DIR[1]) * 180) / Math.PI;
const swordPose = (s: sdf.Shape) => s.rotateZ(SWORD_Z).rotateX(SWORD_X).at(...GUARD);
// The shield's center on the left forearm (the pivot of the `shield` bone).
const SHIELD_C: V3 = [0.24, 0.3, 0.122];

/** A bony fist in the sword's local frame: a small palm and four curled finger bones. */
const boneFistLocal = () =>
  sdf.smoothUnion(
    0.006,
    sdf.ellipsoid([0.03, 0.04, 0.032]).at(-0.012, -0.045, -0.004),
    ...[0, 1, 2, 3].map((i) => {
      const y = -0.022 - i * 0.019;
      return sdf.chain(
        [
          [-0.02, y, 0.02, 0.0105],
          [0.012, y - 0.002, 0.026, 0.0095],
          [0.022, y - 0.004, 0.0, 0.0085],
        ],
        0.004,
      );
    }),
    sdf.chain(
      [
        [-0.028, -0.03, 0.012, 0.011],
        [-0.01, -0.012, 0.024, 0.0095],
        [0.012, -0.012, 0.024, 0.008],
      ],
      0.004,
    ),
  );

/** A bony fist hanging from the wrist `w`, fingers curled toward +Z. */
const boneFistAt = (w: V3) =>
  sdf.smoothUnion(
    0.006,
    sdf.ellipsoid([0.034, 0.036, 0.03]).at(w[0] + 0.006, w[1] - 0.036, w[2]),
    ...[0, 1, 2, 3].map((i) => {
      const x = w[0] - 0.018 + i * 0.013;
      return sdf.chain(
        [
          [x, w[1] - 0.05, w[2] + 0.018, 0.0095],
          [x, w[1] - 0.07, w[2] + 0.028, 0.0088],
          [x, w[1] - 0.064, w[2] + 0.044, 0.008],
        ],
        0.004,
      );
    }),
    sdf.chain(
      [
        [w[0] + 0.03, w[1] - 0.026, w[2] + 0.014, 0.01],
        [w[0] + 0.024, w[1] - 0.046, w[2] + 0.036, 0.0085],
      ],
      0.004,
    ),
  );

const shieldRound = profile.circle(0.15);

export default defineAsset({
  name: 'skeleton',
  description: 'Chibi skeleton warrior enemy: a grinning skull with glowing eyes under an iron helmet, a red scarf, mail, a sword, and a round shield.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/skeleton_001.png',

  build(k) {
    // ------------------------------------------------------------------ skeleton (rig)
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
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
      weapon: { parent: 'hand.R', at: GUARD },
      shield: { parent: 'forearm.L', at: SHIELD_C },
    });

    // ------------------------------------------------------------------ skull
    // A big round cranium, wide cheekbones, and a narrower block of teeth below.
    const cranium = sdf.ellipsoid([0.205, 0.2, 0.19]).at(0, HEAD_Y, -0.005);
    const skullSolid = sdf.smoothUnion(
      0.04,
      cranium,
      pair(sdf.sphere(0.08).at(0.112, 0.59, 0.08)), // cheekbones
      sdf.box([0.15, 0.085, 0.13], 0.035).at(0, 0.53, 0.075), // the teeth block, narrower than the cheeks
    );
    const faceZ = (x: number, y: number) => sdf.raycast(skullSolid, [x, y, 1], [0, 0, -1])![2];
    // Eye sockets, tilted so the inner ends dip: an angry glare.
    const EYE: V3 = [0.094, 0.628, 0];
    // Each socket's top edge is a straight slant that dips toward the nose: an angry glare.
    const slant = norm([-0.42, 1, 0]);
    const socketTop = sdf.halfSpace(slant, slant[0] * (EYE[0] - 0.05) + slant[1] * (EYE[1] + 0.012));
    const socketL = sdf
      .ellipsoid([0.06, 0.054, 0.07])
      .at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) + 0.004)
      .smoothIntersect(0.008, socketTop);
    const sockets = pair(socketL);
    // The nose hole: an upside-down heart.
    const noseZ = faceZ(0, 0.568);
    const noseHole = pair(sdf.ellipsoid([0.013, 0.022, 0.03]).rotateZ(-24).at(0.011, 0.566, noseZ + 0.01));
    const browRidge = pair(
      sdf.capsule(
        [EYE[0] + 0.05, EYE[1] + 0.052, faceZ(EYE[0] + 0.05, EYE[1] + 0.052) - 0.012],
        [EYE[0] - 0.045, EYE[1] + 0.02, faceZ(EYE[0] - 0.045, EYE[1] + 0.02) - 0.01],
        0.016,
      ),
    );
    const skull = skullSolid.smoothUnion(0.02, browRidge).smoothSubtract(0.01, sockets).smoothSubtract(0.004, noseHole);
    // The grin: a dark line between upper and lower teeth, and dark gaps between the teeth.
    const TEETH_Y = 0.535;
    const mouthLine = sdf.extrude(profile.rect([0.15, 0.009], 0.004), 0.4).at(0, TEETH_Y, 0.2);
    // Short gaps: an upper row of big square teeth, and a lower row offset by half a tooth.
    const gap = (x: number, y: number) => sdf.extrude(profile.rect([0.007, 0.03], 0.002), 0.4).at(x, y, 0.2);
    const gaps = sdf.union(
      ...[-0.054, -0.018, 0.018, 0.054].map((x) => gap(x, TEETH_Y + 0.018)),
      ...[-0.036, 0, 0.036].map((x) => gap(x, TEETH_Y - 0.017)),
    );
    const neckBones = sdf.union(
      ...[0.44, 0.47, 0.5].map((y) => sdf.cylinder(0.036, 0.022, 0.008).at(0, y, -0.015)),
      sdf.cylinder(0.026, 0.1, 0.006).at(0, 0.47, -0.015),
    );

    // Arms: only the bony hands show (mail sleeves and leather bracers cover the rest).
    const fistR = swordPose(boneFistLocal());
    const fistL = boneFistAt(WRIST_L);
    const bone = sdf
      .union(skull.bone('head'), neckBones.bone('neck'), fistR.bone('hand.R'), fistL.bone('hand.L'))
      .paintWhere(sockets.round(0.012), C.boneShade, 0.012)
      .paintWhere(sockets.round(0.002), C.socket, 0.004)
      .paintWhere(noseHole.round(0.003), C.socket, 0.003)
      .paintWhere(mouthLine, C.socket, 0.002)
      .paintWhere(gaps.intersect(sdf.box([0.15, 0.07, 0.4]).at(0, TEETH_Y, 0.2)), C.socket, 0.002)
      .paintFn((x, y, z, base) => {
        // Faint age stains on the cranium.
        const n = noise.fbm(x * 22, y * 22, z * 22, 2);
        return n > 0.35 ? [base[0] * 0.93, base[1] * 0.9, base[2] * 0.84] : base;
      });
    k.body('bone', bone, { color: C.bone, roughness: 0.6, textureDensity: 2 });

    // Glowing eyes deep in the sockets, with dark pupils and one highlight each.
    const eyeAt = (x: number): V3 => [x - Math.sign(x) * 0.004, EYE[1] - 0.01, faceZ(Math.abs(x), EYE[1]) - 0.04];
    const eyes = sdf.union(sdf.sphere(0.026).at(...eyeAt(EYE[0])), sdf.sphere(0.026).at(...eyeAt(-EYE[0])));
    k.body('eyes', eyes.bone('head'), { color: C.eye, roughness: 0.2, emissive: C.eye, emissiveIntensity: 1.4 });
    const pupils = sdf.union(
      ...[EYE[0], -EYE[0]].map((x) => {
        const e = eyeAt(x);
        // The pupils look in a little, toward the nose.
        const px = e[0] - Math.sign(x) * 0.006;
        return sdf
          .ellipsoid([0.011, 0.016, 0.008])
          .at(px, e[1] - 0.002, e[2] + 0.022)
          .paintWhere(sdf.sphere(0.0045).at(px + 0.005, e[1] + 0.007, e[2] + 0.029), '#ffffff', 0.002);
      }),
    );
    k.body('pupils', pupils.bone('head'), { color: C.pupil, roughness: 0.2, detail: 0.003 });

    // ------------------------------------------------------------------ iron helmet
    // A round cap down to the brow at the front and lower at the back; a crest band over the
    // crown, a rim band, and ear bosses.
    const helmOuter = sdf.ellipsoid([0.228, 0.236, 0.214]).at(0, 0.705, -0.006);
    const helmInner = sdf.ellipsoid([0.211, 0.219, 0.197]).at(0, 0.705, -0.006);
    // The lower edge is a tilted plane: y = RIM + 0.34 z (at the brow in front, lower behind).
    const RIM = 0.6675;
    const tilt = Math.hypot(1, 0.34);
    const above = (y0: number) => sdf.halfSpace([0, -1 / tilt, 0.34 / tilt], -y0 / tilt); // y - 0.34 z >= y0
    const below = (y0: number) => sdf.halfSpace([0, 1 / tilt, -0.34 / tilt], y0 / tilt); // y - 0.34 z <= y0
    const helmCut = above(RIM);
    const helmShell = helmOuter.subtract(helmInner).intersect(helmCut);
    const shellOf = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
    const rimBand = shellOf(helmOuter, 0.012, 0.02).intersect(helmCut).intersect(below(RIM + 0.036));
    const crestBand = shellOf(helmOuter, 0.012, 0.02)
      .smoothIntersect(0.006, sdf.box([0.05, 0.6, 0.8], 0.01).at(0, 0.9, 0))
      .intersect(helmCut);
    const helm = sdf
      .smoothUnion(0.006, helmShell, crestBand)
      .union(rimBand)
      .paintWhere(helmInner.round(0.004), C.ironDark, 0.008)
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 30, y * 30, z * 30, 3);
        return n > 0.3 ? [base[0] * 0.82, base[1] * 0.82, base[2] * 0.85] : base; // patina
      });
    k.body('helmet', helm, {
      color: C.iron,
      roughness: 0.55,
      metalness: 0.7,
      bone: 'head',
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });
    // Rivets along the rim and the crest band, and an ear boss on each side.
    // Each rivet is found by a ray toward the helmet's axis at the height of the rim band.
    const rivetsRim = Array.from({ length: 11 }, (_, i) => {
      const a = ((i - 5) / 5) * 150 * (Math.PI / 180);
      const y = RIM + 0.018 + 0.34 * Math.cos(a) * 0.21;
      const hit = sdf.raycast(helmOuter.round(0.012), [Math.sin(a), y, Math.cos(a) - 0.01], [-Math.sin(a), 0, -Math.cos(a)])!;
      return sdf.sphere(0.01).at(...hit);
    });
    const rivetsCrest = [0.8, 0.87, 0.93].map((y) => sdf.sphere(0.01).at(...sdf.raycast(helmOuter.round(0.012), [0, y, 1], [0, 0, -1])!));
    const earAt = sdf.surfacePoint(helmOuter, [0.3, 0.665, 0.0], 0.004);
    const earBoss = hard(
      sdf
        .cylinder(0.042, 0.018, 0.007)
        .union(sdf.sphere(0.014).at(0, 0.012, 0))
        .rotateZ(-90)
        .at(...earAt),
    );
    k.body('rivets', sdf.union(...rivetsRim, ...rivetsCrest, earBoss), {
      color: C.rivet,
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.0035,
      bone: 'head',
    });

    // ------------------------------------------------------------------ torso: mail shirt
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
    const rings = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 30;
      const v = y * 190 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.0012 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 1.12), 0.046, 0.043).bone(tag);
    k.body(
      'mail',
      sdf.union(torso.bone('spine'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')),
      { color: C.mail, roughness: 0.55, metalness: 0.7, bump: rings },
    );

    // ------------------------------------------------------------------ pauldrons (two lames each)
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.1 * s, 0.066 * s, 0.096 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.003);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-26).at(0.158, 0.432, 0);
    const pauldrons = pair(pauldronPose(sdf.union(lame(1), lame(1.14).at(0, -0.034, 0))).bone('upperarm.L'));
    k.body('pauldrons', pauldrons, {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.7,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });

    // ------------------------------------------------------------------ bracers
    const bracer = (e: V3, w: V3) =>
      sdf
        .cone(lerp(e, w, 0.15), lerp(e, w, 1.0), 0.044, 0.05)
        .round(0.003)
        .paintWhere(sdf.sphere(0.03).at(...lerp(e, w, 0.55)), C.leatherDark, 0.004);
    const bracers = sdf.union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(ELBOW_R, WRIST_R).bone('forearm.R'));
    k.body('bracers', bracers, { color: C.leather, roughness: 0.65 });

    // ------------------------------------------------------------------ belt and torn tabard flaps
    const beltY = 0.252;
    const belt = torso.round(0.012).smoothIntersect(0.005, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.leather, roughness: 0.65 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.06, 0.05, 0.014], 0.006).subtract(sdf.box([0.034, 0.026, 0.03], 0.005)), sdf.box([0.008, 0.03, 0.01], 0.003).at(0.002, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    // Two flaps at the front and two at the back, each with a torn hem; each follows its leg.
    const flap = (front: boolean) =>
      sdf
        .extrude(
          profile.polygon([
            [0.004, 0.262],
            [0.07, 0.262],
            [0.078, 0.1],
            [0.058, 0.122],
            [0.04, 0.078],
            [0.02, 0.112],
            [0.004, 0.09],
          ]),
          0.014,
          0.005,
        )
        .rotateX(front ? -8 : 8)
        .at(0, 0, front ? 0.126 : -0.124);
    const tabard = pair(sdf.union(flap(true), flap(false)).bone('leg.L')).paintWhere(sdf.halfSpace([0, 1, 0], 0.125), C.redDark, 0.02);
    k.body('tabard', tabard, { color: C.red, roughness: 0.85 });

    // ------------------------------------------------------------------ scarf (the knight's)
    const scarfRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.05, 0.502],
            [0.095, 0.496],
            [0.132, 0.472],
            [0.142, 0.446],
            [0.12, 0.432],
            [0.085, 0.452],
            [0.05, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    const drape = torso
      .round(0.014)
      .subtract(torso.round(-0.002))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.105, 0.47],
              [0.105, 0.47],
              [0.03, 0.38],
              [0.012, 0.36],
              [-0.02, 0.385],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    const scarf = sdf
      .smoothUnion(0.012, scarfRing, drape)
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 9 + y * 60) > 0.75 ? [base[0] * 0.85, base[1] * 0.85, base[2] * 0.85] : base));
    k.body('scarf', scarf, { color: C.red, roughness: 0.8, bone: 'chest' });

    // ------------------------------------------------------------------ legs: leggings, knee cops, greaves, sabatons (the knight's)
    const leggings = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
    );
    k.body('leggings', leggings, { color: C.leggings, roughness: 0.85 });
    const knee = sdf.ellipsoid([0.055, 0.032, 0.05]).at(0.095, 0.11, 0.022).bone('leg.L');
    const greave = sdf.cone([0.096, 0.098, 0.006], [0.098, 0.06, 0.004], 0.049, 0.052).bone('leg.L');
    const sabatonFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.052, 0.06, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.058, 0.05, 0.102]).at(0, 0.045, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeLines = sdf.union(
      sdf.box([0.2, 0.006, 0.2]).rotateX(-30).at(0, 0.075, 0.06),
      sdf.box([0.2, 0.006, 0.2]).rotateX(-40).at(0, 0.058, 0.1),
    );
    const sabaton = sabatonFoot
      .smoothSubtract(0.003, toeLines.intersect(sdf.halfSpace([0, 0, -1], -0.04)))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('greaves', pair(sdf.union(sdf.smoothUnion(0.01, greave, knee), sabaton)), { color: C.steel, roughness: 0.45, metalness: 0.75 });

    // ------------------------------------------------------------------ sword in the right hand
    // Local frame: the guard at the origin, the blade up (+Y), the flat facing +Z. A broad,
    // chunky blade with a lighter bevel down one side.
    const bladeOutline = profile.polygon(
      [
        [-0.034, 0.01],
        [0.034, 0.01],
        [0.038, 0.22],
        [0.0, 0.29],
        [-0.038, 0.22],
      ],
      { smooth: false },
    );
    const T = 0.008;
    const W = 0.038;
    const bevel = (sx: number, sz: number) => sdf.halfSpace(norm([sx * T, 0, sz * W]), (T * W) / Math.hypot(T, W));
    const bladeLocal = sdf
      .extrude(bladeOutline, 0.03)
      .intersect(bevel(1, 1))
      .intersect(bevel(-1, 1))
      .intersect(bevel(1, -1))
      .intersect(bevel(-1, -1))
      .round(0.0015)
      .paintWhere(sdf.halfSpace([1, 0, 0], 0), '#c6ccd4');
    k.body('sword', swordPose(bladeLocal), { color: '#9aa1aa', roughness: 0.4, metalness: 0.8, detail: 0.003, bone: 'weapon' });
    const guardLocal = sdf.box([0.11, 0.02, 0.026], 0.008).bend(-4).at(0, 0.0, 0);
    const pommelLocal = sdf.sphere(0.02).at(0, -0.128, 0);
    k.body('hilt', swordPose(sdf.union(guardLocal, pommelLocal)), { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.004, bone: 'weapon' });
    k.body('grip', swordPose(sdf.capsule([0, -0.118, 0], [0, -0.005, 0], 0.013)), { color: C.grip, roughness: 0.75, detail: 0.004, bone: 'weapon' });

    // ------------------------------------------------------------------ round shield on the left forearm
    // Local frame: the face toward +Z. Red planks in a steel rim, a steel bar across, a domed boss.
    const shieldPose = (s: sdf.Shape) => s.rotateY(34).rotateX(-4).at(...SHIELD_C);
    const plankLines = rgb(C.plank);
    const wood = sdf
      .extrude(shieldRound, 0.026, 0.006)
      .paintFn((x, _y, z, base) => (Math.abs(Math.sin(x * 105)) < 0.12 && z > 0 ? plankLines : base));
    k.body('shield-wood', shieldPose(wood), {
      color: C.wood,
      roughness: 0.8,
      bone: 'shield',
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 12, y * 90, z * 12, 2),
    });
    const rim = sdf.torus(0.15, 0.014).rotateX(90).scale([1, 1, 1.3]);
    const bar = sdf.box([0.29, 0.042, 0.034], 0.008).at(0, 0, 0.004);
    const boss = sdf.sphere(0.05).scale([1, 1, 0.75]).at(0, 0, 0.012);
    const handle = sdf.capsule([-0.03, 0.02, -0.024], [0.03, -0.01, -0.024], 0.012);
    const shieldIron = sdf.union(rim, bar, boss, handle).paintWhere(boss.round(0.002).intersect(sdf.halfSpace([0, 0, -1], -0.04)), C.steel, 0.01);
    k.body('shield-iron', shieldPose(shieldIron), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.75,
      bone: 'shield',
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });
    // Rivets around the rim and on the bar ends: brass, with the belt buckle.
    const shieldRivets = sdf.union(
      ...Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        return sdf.sphere(0.011).at(Math.cos(a) * 0.132, Math.sin(a) * 0.132, 0.018);
      }),
      sdf.sphere(0.011).at(0.1, 0, 0.026),
      sdf.sphere(0.011).at(-0.1, 0, 0.026),
    );
    k.body('brass', sdf.union(buckle.bone('spine'), shieldPose(shieldRivets).bone('shield')), {
      color: C.brass,
      roughness: 0.35,
      metalness: 0.85,
      detail: 0.0035,
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // A slow, creaky head tilt.
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 4 * wave(p, 1, 0.1)] },
        'upperarm.R': { rotate: [3 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    // The shield arm stays in front of the body; the sword arm swings a little.
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
          // The head bobs a beat late, loose on its neck bones.
          head: { rotate: [-lean + 3 * wave(p, 2, 0.3), 5 * s, 2 * wave(p, 1, 0.2)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.15 * s, 0, 3] as const },
          'upperarm.R': { rotate: [-armSwing * 0.5 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.2 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 28, 3, 0));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03));

    // An overhead chop, solved by targets (see the armor's slash). The wrist follows keys in the
    // chest's rest frame (reach); the blade follows its own keys (orient), and edgeUp turns the
    // flat so the edge leads. The chibi arm is short and the helmet is huge, so the wind-up leans
    // the whole upper body to the left, away from the sword: that lifts the right shoulder and
    // drops the helmet, and the blade stands up out on the right with its tip above the crown.
    // It holds, comes over beside the helmet, and cuts down and across in 0.12 s as the front
    // (shield-side) foot steps in. The cut follows through past the waist to knee height on the
    // left, slows there, and recovers. The keys are in the chest's frame, which turns and leans
    // under them, so they read differently from the look in the world.
    const { keys, reach, orient, edgeUp } = motion;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const FLAT = norm([0, -GRIP_DIR[2], GRIP_DIR[1]]); // the blade's flat normal at rest (local +Z, from swordPose)
    const bladeKeys = [
      [0, GRIP_DIR],
      [0.14, norm([-0.45, 0.88, 0.1])],
      [0.26, norm([-0.6, 0.8, 0.0])],
      [0.34, norm([-0.59, 0.785, -0.05])], // the top: up and out on the right, the tip above the crown
      [0.44, norm([-0.58, 0.77, -0.15])], // the hold, sinking back a little
      [0.48, norm([-0.38, 0.84, 0.35])], // over the top, upright, out beside the helmet
      [0.51, norm([-0.29, 0.56, 0.78])], // falling forward on the right of the face
      [0.545, norm([-0.1, 0.1, 0.99])], // the impact: forward, beside the ribs
      [0.58, norm([0.55, -0.15, 0.82])], // down and across, past the waist
      [0.64, norm([0.8, -0.4, 0.45])], // the follow-through: across to the low left, at knee height
      [0.74, norm([0.8, -0.36, 0.48])], // it slows there
      [0.87, norm([-0.1, 0.5, 0.86])],
      [1, GRIP_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.32, p) * (1 - ease(0.44, 0.52, p));
        const cut = ease(0.46, 0.58, p) * (1 - ease(0.76, 1, p));
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.25, 0.41, 0.07]],
            [0.26, [-0.24, 0.505, 0.02]],
            [0.34, [-0.245, 0.53, -0.01]],
            [0.44, [-0.245, 0.53, -0.03]],
            [0.48, [-0.24, 0.51, 0.05]],
            [0.51, [-0.2, 0.44, 0.13]],
            [0.545, [-0.165, 0.36, 0.15]],
            [0.58, [-0.12, 0.33, 0.15]],
            [0.64, [-0.12, 0.33, 0.15]],
            [0.74, [-0.12, 0.335, 0.15]],
            [0.87, [-0.2, 0.32, 0.13]], // out to the right, so the pommel clears the belt
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        // The elbow points out to the right in the wind-up, then out and down through the chop.
        const pole = keys(p, [[0, ELBOW_R], [0.3, [-0.42, 0.36, 0.02]], [0.48, [-0.42, 0.36, 0.06]], [0.56, [-0.36, 0.26, 0.1]], [0.76, [-0.36, 0.26, 0.1]], [1, ELBOW_R]] as const);
        // The shoulder shrugs up in the wind-up; reach solves from the raised shoulder.
        const shrug: V3 = [0, 0.03 * wind, 0];
        const arm = reach(ARM_R, add(wrist, shrug, -1), add(pole, shrug, -1));
        // Fallback flat: at rest it faces forward; through the swing it faces the left side.
        const side = norm(keys(p, [[0, FLAT], [0.2, [1, 0, 0.2]], [0.8, [1, 0, 0.2]], [1, FLAT]] as const));
        const hand = orient([arm.upper, arm.lower], { dir: GRIP_DIR, up: FLAT }, { dir: norm(bladeAt(p)), up: edgeUp(bladeAt, p, side) });
        // The loose skull lags: it nods on the impact and rattles back.
        const bob = keys(p, [[0, 0], [0.55, 0], [0.62, 1], [0.72, -0.45], [0.82, 0.15], [0.92, 0]] as const);
        return {
          hips: { move: [0, -legDrop(LEG, 20 * cut) - 0.004 * wind, 0.03 * cut - 0.01 * wind], rotate: [0, -6 * wind + 14 * cut, 0] },
          // The upper body leans far to the left, away from the raised sword, which lifts it higher.
          spine: { rotate: [-4 * wind + 14 * cut, 0, -12 * wind] },
          chest: { rotate: [-3 * wind + 8 * cut, -8 * wind + 10 * cut, -13 * wind] },
          // The skull ducks under the blade in the wind-up, then looks at the target through the cut.
          head: { rotate: [8 * wind - 10 * cut + 7 * bob, 10 * wind - 18 * cut, -10 * wind + 2 * bob] },
          'upperarm.R': { move: shrug, rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          // The shield arm tucks up against the left side, out of the blade's path.
          'upperarm.L': { rotate: [-4 * wind + 8 * cut, 0, 6 * cut] },
          'forearm.L': { rotate: [-6 * wind - 30 * cut, 0, 0] },
          // The front (shield-side) foot steps in; the back leg pushes.
          'leg.L': { rotate: [3 * wind - 20 * cut, 0, 0] },
          'foot.L': { rotate: [-3 * wind + 20 * cut, 0, 0] },
          'leg.R': { rotate: [-3 * wind + 14 * cut, 0, 0] },
          'foot.R': { rotate: [3 * wind - 14 * cut, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The chest snaps back and the loose skull rattles on its neck bones. The hips give way over the
    // planted left foot and the right foot steps back, then all returns quickly.
    const { quat, euler, follow } = motion;
    const DEG = Math.PI / 180;
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.3, 0.8], [0.8, 0]] as const);
        const rattle = keys(p, [[0.06, 0], [0.14, 1], [0.22, -0.8], [0.3, 0.55], [0.38, -0.35], [0.46, 0.18], [0.56, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const back = 0.03 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-12 * h, 6 * h, 2 * h] },
          neck: { rotate: [-8 * h + 3 * rattle, 0, 0] },
          head: { rotate: [-16 * h + 6 * rattle, 8 * rattle, 7 * rattle - 3 * h] },
          'upperarm.L': { rotate: [-10 * h, 0, 14 * h] },
          'forearm.L': { rotate: [-10 * h, 0, 0] },
          'upperarm.R': { rotate: [-4 * h, 0, -12 * h] },
          'forearm.R': { rotate: [8 * h, 0, 0] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a collapse into a heap
    // The blow snaps the chest back and rattles the skull; the skeleton sways, and its sword hand
    // sags and lets go. Then the knees buckle: the legs splay out in a V, the hips drop onto them,
    // and the spine folds forward into a heap. The shield slides off the limp arm, and at last the
    // skull (with its helmet) topples off the neck and rolls onto its side beside the heap. The
    // `weapon`, `shield`, and `head` bones are placed in world space under their posed parents.
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    /** 0 to 1 from `a` to `b`, speeding up like a drop. */
    const fall = (a: number, b: number, x: number) => clamp01((x - a) / (b - a)) ** 2;
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0]]; // hips, spine, chest pivots
    const NECK_CHAIN: readonly V3[] = [...TRUNK, [0, 0.43, -0.01]];
    const HEAD_AT: V3 = [0, 0.48, -0.01];
    const SWORD_CHAIN: readonly V3[] = [...TRUNK, mx(SHOULDER), ELBOW_R, WRIST_R];
    const SHIELD_CHAIN: readonly V3[] = [...TRUNK, SHOULDER, ELBOW_L];
    const vec = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
    const arr = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
    const chainQ = (rots: readonly V3[]) => rots.reduce((q, r) => q.multiply(quat(r)), new THREE.Quaternion());
    /** The move and rotate that put a bone's pivot (now at `now`) at `at` with the world turn `turn`. */
    const place = (parentQ: THREE.Quaternion, now: V3, at: V3, turn: THREE.Quaternion) => {
      const inv = parentQ.clone().invert();
      return { move: arr(vec(add(at, now, -1)).applyQuaternion(inv)), rotate: euler(inv.multiply(turn)) };
    };
    // Where the items and the skull come to rest.
    const SWORD_DOWN: V3 = [-0.32, 0.024, 0.32]; // the guard; the blade lies flat, out to the right front
    const SWORD_TURN = quat(orient([], { dir: GRIP_DIR, up: FLAT }, { dir: norm([-0.7, 0, 0.7]), up: [0, 1, 0] }));
    const SHIELD_REST = quat([-4, 34, 0]); // shieldPose: rotateY(34), then rotateX(-4)
    const SHIELD_DOWN: V3 = [0.36, 0.042, -0.27]; // face up, behind the left leg
    const SHIELD_TURN = quat(
      orient([], { dir: arr(vec([0, 0, 1]).applyQuaternion(SHIELD_REST)), up: arr(vec([0, 1, 0]).applyQuaternion(SHIELD_REST)) }, { dir: [0, 1, 0], up: norm([0.4, 0, -1]) }),
    );
    const SKULL_OFF: V3 = [0, HEAD_Y - HEAD_AT[1], 0.005]; // the skull's center from the head pivot
    const SKULL_DOWN: V3 = [0.38, 0.26, 0.44]; // on its left side (on the ear boss), in front of the left leg
    const SKULL_TURN = quat([-12, -25, -78]);
    const SPLAY = 70; // the legs' final splay, degrees
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.06, 1], [0.16, 0.5], [0.3, 0.15], [0.36, 0]] as const);
        const rattle = keys(p, [[0.03, 0], [0.08, 1], [0.13, -0.8], [0.18, 0.6], [0.23, -0.35], [0.28, 0.15], [0.33, 0]] as const);
        const wob = keys(p, [[0.1, 0], [0.2, 1], [0.3, -0.4], [0.36, 0]] as const);
        const sag = keys(p, [[0.16, 0], [0.32, 1]] as const);
        // The collapse: the legs splay and the hips drop, faster and faster, to the impact at 0.52.
        const c = fall(0.3, 0.52, p);
        const bounce = keys(p, [[0.52, 0], [0.57, 1], [0.63, 0]] as const);
        const slump = keys(p, [[0.3, 0], [0.46, 0.6], [0.56, 1.12], [0.64, 1]] as const);
        const phi = SPLAY * c;
        const back = 0.03 * hitB;
        const lean = plant(back) * (1 - c);
        // The hips stay as high as the splayed feet need (the inner edge of each sole on the ground).
        const hipsY = 0.2 + 0.028 * Math.sin(phi * DEG) + 0.195 * (Math.cos(phi * DEG) - 1) + 0.005 * c;
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean) + 0.012 * bounce, -back * (1 - c) - 0.015 * c];
        const hipsR: V3 = [0, 10 * c, 0];
        const spineR: V3 = [-6 * hitB + 4 * sag + 24 * slump, 0, 5 * wob + 4 * slump];
        const chestR: V3 = [-12 * hitB + 3 * sag + 22 * slump, 6 * hitB + 6 * slump, 3 * wob + 6 * slump];
        const neckR: V3 = [-8 * hitB + 3 * rattle + 12 * slump, 0, 0];
        const headR: V3 = [-18 * hitB + 6 * rattle + 6 * sag + 14 * slump, 8 * rattle, 7 * rattle + 8 * wob - 8 * slump];
        // Limp arms: they fling in the blow, sag, then hang from the folded chest.
        const uaL: V3 = [-10 * hitB - 34 * slump, 0, 14 * hitB + 10 * slump];
        const faL: V3 = [-10 * hitB + 14 * slump, 0, 0];
        const uaR: V3 = [-4 * hitB - 34 * slump, 0, -12 * hitB - 10 * slump];
        const faR: V3 = [8 * hitB + 30 * sag, 0, 0];
        // The sword: the hand opens at 0.34 and the sword drops and lands flat at 0.48.
        const handRots = [hipsR, spineR, chestR, uaR, faR, [0, 0, 0] as V3];
        const handQ = chainQ(handRots);
        const guardNow = add(follow(SWORD_CHAIN, handRots, GUARD), hipsMove);
        const sw = fall(0.34, 0.48, p);
        const swT = keys(p, [[0.34, 0], [0.45, 1]] as const);
        const swB = keys(p, [[0.48, 0], [0.52, 1], [0.56, 0]] as const);
        const weapon = place(handQ, guardNow, add(lerp(guardNow, SWORD_DOWN, sw), [0, 0.015 * swB, 0]), handQ.clone().slerp(SWORD_TURN, swT));
        // The shield slides off the limp arm at 0.42 and lands face up at 0.58.
        const armRots = [hipsR, spineR, chestR, uaL, faL];
        const armQ = chainQ(armRots);
        const shieldNow = add(follow(SHIELD_CHAIN, armRots, SHIELD_C), hipsMove);
        const sh = fall(0.42, 0.58, p);
        const shT = keys(p, [[0.42, 0], [0.54, 1]] as const);
        const shB = keys(p, [[0.58, 0], [0.62, 1], [0.66, 0]] as const);
        const shield = place(armQ, shieldNow, add(lerp(shieldNow, SHIELD_DOWN, sh), [0, 0.012 * shB, 0]), armQ.clone().slerp(SHIELD_TURN, shT));
        // The skull topples off the neck at 0.6, lands on its side at 0.76, and rocks to a stop.
        const neckRots = [hipsR, spineR, chestR, neckR];
        const neckQ = chainQ(neckRots);
        const headNow = add(follow(NECK_CHAIN, neckRots, HEAD_AT), hipsMove);
        const heldQ = neckQ.clone().multiply(quat(headR));
        const off = fall(0.6, 0.76, p);
        const offT = keys(p, [[0.6, 0], [0.76, 1]] as const);
        const rock = keys(p, [[0.76, 0], [0.81, 1], [0.87, -0.45], [0.93, 0.15], [0.98, 0]] as const);
        const turnH = heldQ.clone().slerp(quat([6 * rock, 0, 0]).multiply(SKULL_TURN), offT);
        const skullNow = add(headNow, arr(vec(SKULL_OFF).applyQuaternion(heldQ)));
        const skullAt = add(lerp(skullNow, SKULL_DOWN, off), [0, 0.07 * Math.sin(Math.PI * clamp01((p - 0.6) / 0.16)), 0]);
        const head = place(neckQ, headNow, add(skullAt, arr(vec(SKULL_OFF).applyQuaternion(turnH)), -1), turnH);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: neckR },
          head,
          'upperarm.L': { rotate: uaL },
          'forearm.L': { rotate: faL },
          'upperarm.R': { rotate: uaR },
          'forearm.R': { rotate: faR },
          weapon,
          shield,
          // The legs splay out and forward in a V; the feet stay flat through the stagger.
          'leg.L': { rotate: [-lean, -28 * c, phi] },
          'leg.R': { rotate: [-lean, 28 * c, -phi] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [lean, 0, 0] },
        };
      },
    });
  },
});
