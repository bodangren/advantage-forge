import * as THREE from 'three';
import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Farmer — Chibi Quest settlement NPC (catalog `npcs/settlement/farmer`), about 1.02 m to the top
 * of his hat, faces +Z. Target: docs/npc-mockups/farmer_001.jpg (made with mmx; one front view).
 * Built on the rogue's head and skeleton, with the adventurer's face.
 *
 * Role: a town NPC (the fields), seen in 3D and as a 128 px sprite; the hat, the plaid, the
 *   overalls, and the pitchfork must read.
 * One idea: a cheerful, rosy-cheeked farmer under a wide straw hat, chewing a stalk of straw, in
 *   red plaid and patched blue overalls, with a tall pitchfork at his side.
 * Proportions: the rogue's (head center 0.675, eyes 0.628, shoulders 0.385, waist 0.25); the hat
 *   brim at 0.8 and 0.29 wide; the pitchfork from the ground to 0.9.
 * Shape language: round and soft (face, hat crown, boots) with the long straight lines of the
 *   pitchfork and the flat hat brim.
 * Palette (60/30/10): red plaid #c2362e and denim #5a7ea8; straw #e0c080 (hat, stalk); brown
 *   boots and hair; brass buttons #d8a840.
 * Value plan: the light face under the hat's shadow, with rosy cheeks, is the focal point; the red
 *   shirt and blue overalls are the two big masses.
 * Bodies: skin, hair, hat, straw, shirt, overalls, brass, boots, fork-haft, fork-tines, hay-clump.
 * Rig: the rogue's skeleton; the pitchfork is rigid on `hand.R`, and a hay clump for the work clip
 *   rides on `hay` under it. Clips: idle, walk, run, work (pitching hay), talk, wave.
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
  brow: '#5a3422',
  mouth: '#8a3a30',
  hair: '#6b3f24',
  hairDark: '#4e2c18',
  straw: '#e0c080',
  strawDark: '#b8964e',
  hatBand: '#8a5a30',
  plaid: '#c2362e',
  plaidDark: '#7e1e1a',
  plaidLight: '#e8a898',
  denim: '#5a7ea8',
  denimDark: '#46668c',
  patch: '#c8b48a',
  brass: '#d8a840',
  boot: '#6e4228',
  sole: '#3e2618',
  wood: '#9a6a3a',
  iron: '#7a8088',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: the right hand holds the pitchfork upright at his side; the left arm hangs relaxed.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.18, 0.332, 0.012];
const WRIST_L: V3 = [0.205, 0.238, 0.03];
const ELBOW_R: V3 = [-0.19, 0.33, 0.03];
const WRIST_R: V3 = [-0.215, 0.27, 0.08];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const GRIP: V3 = [WRIST_R[0] - 0.012, WRIST_R[1] - 0.038, WRIST_R[2] + 0.014];

// ------------------------------------------------------------------ work clip: pose constants
const DEG = Math.PI / 180;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V3): V3 => scl(a, 1 / Math.hypot(...a));
const turnBy = (r: V3, p: V3): V3 => {
  const v = new THREE.Vector3(...p).applyQuaternion(motion.quat(r));
  return [v.x, v.y, v.z];
};
// The fork's rest frame (as `forkPose` below): the haft along +Y, the tines' hollow side along +Z.
const forkRot = (p: V3): V3 => {
  const [cx, sx, cz, sz] = [Math.cos(6 * DEG), Math.sin(6 * DEG), Math.cos(14 * DEG), Math.sin(14 * DEG)];
  const y = p[1] * cx - p[2] * sx;
  const z = p[1] * sx + p[2] * cx;
  return [p[0] * cz - y * sz, p[0] * sz + y * cz, z];
};
const FORK_DIR = forkRot([0, 1, 0]);
const FORK_UP = forkRot([0, 0, 1]);
const forkPoint = (p: V3) => add(forkRot(p), GRIP);
const FORK_TIP = 0.79; // from the right-hand grip to the tine tips, along the haft
const FIST_C: V3 = [0.007, -0.038, 0.004]; // the left fist's center from its wrist (`fistAt`)
const GRIP_OFF = sub(GRIP, WRIST_R);
const HIPS_P: V3 = [0, 0.2, 0];
const SPINE_P: V3 = [0, 0.26, 0];
const CHEST_P: V3 = [0, 0.33, 0];
// The hay clump: its place on the rest fork's tines, and its bind place hidden inside the chest.
const HAY_ON_FORK = forkPoint([0, 0.71, 0.03]);
const HAY_HIDE: V3 = [0, 0.31, 0.0];
const HAY_MOVE = sub(HAY_ON_FORK, HAY_HIDE);
/** The hay clump off: shrunk to a point on the tines (all clips but the work lift). */
const HAY_OFF = { move: HAY_MOVE, scale: [0.001, 0.001, 0.001] as V3 };
// The stance: the planted ankles (the left foot forward, the right foot back).
const STANCE_L: V3 = [ANKLE[0] + 0.012, ANKLE[1], 0.045];
const STANCE_R: V3 = [-ANKLE[0] - 0.012, ANKLE[1], -0.045];

/** A relaxed fist hanging from the wrist `w`. */
const fistAt = (w: V3) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(w[0] + 0.007, w[1] - 0.038, w[2] + 0.004),
    sdf.capsule([w[0] - 0.009, w[1] - 0.058, w[2] + 0.03], [w[0] - 0.005, w[1] - 0.038, w[2] + 0.042], 0.017),
    sdf.cone([w[0] + 0.02, w[1] - 0.023, w[2] + 0.025], [w[0] + 0.001, w[1] - 0.033, w[2] + 0.048], 0.016, 0.013),
  );
/** A fist wrapped around a vertical haft at `g`: the fingers curl around the front. */
const gripFist = (g: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.036, 0.044, 0.036]).at(g[0] - 0.012, g[1], g[2] - 0.004),
    sdf.capsule([g[0] - 0.02, g[1] - 0.02, g[2] + 0.022], [g[0] + 0.018, g[1] - 0.02, g[2] + 0.022], 0.016),
    sdf.capsule([g[0] - 0.02, g[1] + 0.006, g[2] + 0.024], [g[0] + 0.018, g[1] + 0.006, g[2] + 0.024], 0.016),
    sdf.cone([g[0] - 0.026, g[1] + 0.02, g[2] + 0.01], [g[0] + 0.012, g[1] + 0.03, g[2] + 0.02], 0.014, 0.011), // thumb on top
  );

export default defineAsset({
  name: 'farmer',
  description: 'Chibi farmer NPC: a wide straw hat, a straw stalk in his mouth, a red plaid shirt, patched blue overalls, boots, and a pitchfork.',
  detail: 0.005,
  reference: 'docs/npc-mockups/farmer_001.jpg',
  // Color slots for individual farmers (the first option is the default look). The clothing slot
  // is the plaid shirt; the denim overalls, the straw hat, the patch, and the boots keep their colors.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, blond: '#c4974a', black: '#231a17' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    // Earthy flannel dyes: no blue (it would match the denim), no yellow (the light lines clip to lime).
    clothing: { red: C.plaid, moss: '#587038', brown: '#8a4a2a' },
  },
  presets: {
    shepherd: { eyes: 'blue', hair: 'blond', skin: 'fair', clothing: 'brown' },
    harvester: { eyes: 'green', hair: 'brown', skin: 'tan', clothing: 'moss' },
    plowman: { eyes: 'brown', hair: 'black', skin: 'brown', clothing: 'red' },
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
      plaid: k.tint('clothing'),
      plaidDark: k.tint('clothing', { color: C.plaidDark, follow: 1 }),
      plaidBand: k.tint('clothing', { color: '#b02e27', follow: 1 }), // the red x [0.8, 0.75, 0.75] in linear light
      // The red has almost no blue or green, so a full follow turns the light lines cyan or mint.
      plaidLight: k.tint('clothing', { color: C.plaidLight, follow: 0.4 }),
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
      hay: { parent: 'hand.R', at: HAY_HIDE },
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
    const nose = sdf.ellipsoid([0.024, 0.02, 0.018]).at(0, 0.57, faceZ(0, 0.57) - 0.002).bone('head');
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
      fistAt(WRIST_L).bone('hand.L'),
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
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.02, 60, 118), 0.3).at(0.1, 0.725 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.06, 0.01, 245, 295), 0.3).at(0, 0.53 + 0.06, 0.1);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(pair(at(sdf.sphere(0.04), 0.14, 0.565)), T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth)
      .paintWhere(sdf.sphere(0.022).at(0, 0.57, faceZ(0, 0.57) + 0.03), T.nose, 0.015); // a rosy nose tip
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ straw stalks in the mouth
    const mouthZ = faceZ(0, 0.54);
    const stalk = (dy: number, tilt: number, len: number) =>
      sdf.capsule([-len * 0.5, dy - tilt, 0], [len * 0.5, dy + tilt, 0], 0.0055).at(0.01, 0.542, mouthZ + 0.012);
    const straw = sdf.union(stalk(0, 0.012, 0.19), stalk(0.007, -0.004, 0.17), stalk(-0.007, 0.02, 0.16), stalk(0.003, 0.03, 0.15), stalk(-0.004, -0.012, 0.18));
    k.body('straw', straw.bone('head'), { color: C.straw, roughness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ hair under the hat
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, sdf.ellipsoid([0.25, 0.155, 0.23]).at(0, 0.61, 0.14));
    // A thick swept fringe from under the brim, and sideburns.
    const fringe = sdf.chain(
      [
        [0.12, 0.8, 0.12, 0.045],
        [0.03, 0.79, 0.18, 0.05],
        [-0.07, 0.765, 0.19, 0.042],
        [-0.13, 0.72, 0.17, 0.026],
      ],
      0.02,
    );
    const sideburns = pair(sdf.cone([0.185, 0.73, 0.06], [0.195, 0.64, 0.08], 0.03, 0.012));
    const hair = sdf
      .smoothUnion(0.02, cap, fringe, sideburns)
      .paintFn((x, y, z, base) => (Math.sin(x * 60 + z * 25 - y * 30) > 0.85 ? rgb(T.hairDark) : base));
    k.body('hair', hair.bone('head'), { color: T.hair, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ straw hat: a round crown and a wide, soft brim
    // Local frame: the brim's center at the origin; the hat sits tilted back a little.
    const hatPose = (s: sdf.Shape) => s.rotateX(-8).at(0, 0.79, -0.015);
    const crown = sdf.ellipsoid([0.2, 0.13, 0.19]).at(0, 0.06, 0).intersect(sdf.halfSpace([0, -1, 0], -0.01));
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.12, 0.028],
            [0.24, 0.022],
            [0.33, 0.012],
            [0.355, -0.002],
            [0.34, -0.014],
            [0.24, -0.004],
            [0.12, 0.0],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.95]);
    const band = crown.round(0.006).smoothIntersect(0.004, sdf.box([0.6, 0.03, 0.6], 0.004).at(0, 0.032, 0));
    const weave = (x: number, y: number, z: number) => 0.0008 * Math.sin(Math.atan2(z, x) * 90) * Math.sin(Math.hypot(x, z) * 300 + y * 300);
    const hat = sdf
      .smoothUnion(0.02, crown, brim)
      .union(band.paint(C.hatBand))
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 40 + Math.hypot(x, z) * 60) > 0.85 && y < 0.02 ? rgb(C.strawDark) : base));
    k.body('hat', hatPose(hat).bone('head'), { color: C.straw, roughness: 0.85, bump: weave });

    // ------------------------------------------------------------------ plaid shirt
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
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(
          0.012,
          sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 1.02), 0.048, 0.045),
          sdf.cone(lerp(s, e, 0.9), lerp(s, e, 1.12), 0.05, 0.05).round(0.004), // rolled cuff
        )
        .bone(tag);
    const dark = rgb(T.plaidDark);
    const bandColor = rgb(T.plaidBand);
    const light = rgb(T.plaidLight);
    const plaid = (x: number, y: number, z: number) => {
      const u = Math.atan2(x, z) * 0.16 + x * 0.3;
      const a = Math.abs(Math.sin(y * 110)) < 0.25;
      const b = Math.abs(Math.sin(u * 110 + z * 20)) < 0.25;
      const thin = Math.abs(Math.sin(y * 110 + 1.4)) < 0.06 || Math.abs(Math.sin(u * 110 + z * 20 + 1.4)) < 0.06;
      return { a, b, thin };
    };
    const shirt = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'))
      .paintFn((x, y, z, base) => {
        const { a, b, thin } = plaid(x, y, z);
        if (a && b) return dark;
        if (a || b) return bandColor;
        return thin ? light : base;
      });
    k.body('shirt', shirt, { color: T.plaid, roughness: 0.85 });

    // ------------------------------------------------------------------ overalls: bib, straps, legs with patches and cuffs
    const bibOutline = profile.polygon(
      [
        [-0.075, 0.405],
        [0.075, 0.405],
        [0.1, 0.25],
        [-0.1, 0.25],
      ],
      { smooth: false },
    );
    const shell = (r: number) => torso.round(r).subtract(torso.round(0.001));
    const bib = shell(0.011).smoothIntersect(0.004, sdf.extrude(bibOutline, 0.6, 0.01).at(0, 0, 0.3)).intersect(sdf.halfSpace([0, 0, -1], 0));
    // The straps: from the bib's top corners over the shoulders, crossing to the back waist.
    const strapCols = sdf.union(sdf.box([0.03, 1, 1], 0.005).at(0.065, 0, 0), sdf.box([0.03, 1, 1], 0.005).at(-0.065, 0, 0));
    const straps = shell(0.013)
      .smoothIntersect(0.004, strapCols)
      .intersect(sdf.union(sdf.halfSpace([0, -1, 0], -0.39), sdf.halfSpace([0, 0, 1], 0).intersect(sdf.halfSpace([0, -1, 0], -0.24))));
    const waist = shell(0.011).smoothIntersect(0.006, sdf.box([0.5, 0.06, 0.5], 0.008).at(0, 0.225, 0));
    const pocket = sdf.extrude(profile.rect([0.07, 0.05], 0.01), 0.4).at(0, 0.34, 0.2);
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.12, 0.06, 0.09]).at(0, 0.2, 0).bone('hips'),
      pair(
        sdf
          .smoothUnion(
            0.01,
            sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.115, 0.004], 0.052),
            sdf.cylinder(0.058, 0.03, 0.012).at(0.096, 0.108, 0.004).paint(C.denimDark), // rolled cuff
          )
          .bone('leg.L'),
      ),
    );
    const patches = sdf.union(
      sdf.extrude(profile.rect([0.04, 0.034], 0.004), 0.4).rotateZ(8).at(0.09, 0.14, 0.2),
      sdf.extrude(profile.rect([0.036, 0.03], 0.004), 0.4).rotateZ(-6).at(-0.1, 0.16, 0.2),
    );
    const overalls = sdf
      .union(bib.bone('chest'), straps.bone('chest'), waist.bone('spine'), legs)
      .paintWhere(pocket.subtract(pocket.round(-0.005)), C.denimDark, 0.002)
      .paintWhere(patches, C.patch, 0.002)
      .paintFn((x, y, z, base) => (Math.sin((x + y) * 400) > 0.9 ? [base[0] * 0.92, base[1] * 0.92, base[2] * 0.95] : base)); // denim twill
    k.body('overalls', overalls, { color: C.denim, roughness: 0.85 });
    const buttons = hard(sdf.sphere(0.012).at(...sdf.surfacePoint(bib, [0.062, 0.392, 0.3], 0.004)));
    k.body('brass', buttons.bone('chest'), { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ boots
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.052, 0.085, 0.02).at(0, 0.052, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = bootFoot
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the pitchfork
    // Local frame: the grip at the origin, the haft along +Y, the tines at the top.
    const TOP = 0.62;
    const haft = sdf.capsule([0, -GRIP[1] + 0.02, 0], [0, TOP, 0], 0.016);
    const tine = (x: number) =>
      sdf.chain(
        [
          [x, TOP + 0.02, 0, 0.01],
          [x * 1.25, TOP + 0.1, 0.004, 0.009],
          [x * 1.25, TOP + 0.17, 0.012, 0.004],
        ],
        0.004,
      );
    const tines = sdf.union(
      sdf.capsule([-0.048, TOP + 0.02, 0], [0.048, TOP + 0.02, 0], 0.012),
      sdf.cone([0, TOP - 0.03, 0], [0, TOP + 0.03, 0], 0.016, 0.012), // the socket
      tine(-0.04),
      tine(0),
      tine(0.04),
    );
    // The fork leans forward and out to his right, so the haft and the tines keep 3.5 cm from the hat brim.
    const forkPose = (s: sdf.Shape) => s.rotateX(6).rotateZ(14).at(...GRIP);
    k.body('fork-haft', forkPose(haft), { color: C.wood, roughness: 0.7, detail: 0.004, bone: 'hand.R' });
    k.body('fork-tines', forkPose(tines), { color: C.iron, roughness: 0.4, metalness: 0.75, detail: 0.003, bone: 'hand.R' });

    // The hay clump for the work clip, built on the rest fork's tines (hollow side) and then moved into
    // the chest, where the bind pose hides it. The work clip moves it back onto the tines (`HAY_MOVE`).
    const clump = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.058, 0.05, 0.03]).at(0, 0.71, 0.034),
        sdf.ellipsoid([0.036, 0.034, 0.026]).at(0.03, 0.67, 0.05),
        sdf.ellipsoid([0.032, 0.036, 0.024]).at(-0.028, 0.745, 0.05),
      )
      .displace(0.006, (x, y, z) => noise.fbm(x * 60, y * 22, z * 60, 3))
      .paintFn((x, y, z, base) => (noise.fbm(x * 90, y * 30, z * 90, 2) > 0.15 ? rgb(C.strawDark) : base));
    k.body('hay-clump', forkPose(clump).at(...HAY_HIDE.map((v, i) => v - HAY_ON_FORK[i]!) as unknown as V3), {
      color: C.straw,
      roughness: 0.9,
      detail: 0.004,
      bone: 'hay',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, reach, orient, keys } = motion;
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // A slow, easy look around, chewing on the straw.
        head: { rotate: [1.5 * wave(p, 3), 7 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [1 * wave(p, 1, 0.1), 0, -1 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        hay: HAY_OFF,
      }),
    });

    // An easy farm walk. The legs come from motion.gait: planted stance feet, a knee lift in the swing,
    // heel strike and toe-off. `step` is the foot travel, `lift` the swing height, `duty` the share of
    // the cycle a foot is down (a run has a flight between steps), `hop` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the left arm is
    // back. The sole points are the boot's heel and toe on the floor (measured from bootFoot, turned
    // 12 degrees out). The hips' sway goes to gait, so the planted feet do not slide.
    // `forkOut` tilts the fork's top out to his right (degrees at the wrist): extra room from the hat brim
    // while the head bobs and leans in the run. The rest pose already keeps the fork clear.
    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, armSwing: number, lean: number, forkOut = 0) => ({
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
          hips: { at: HIPS_P, rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          // The fork arm swings little, so the fork stays clear of the ground and the legs.
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, -4] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'hand.R': { rotate: [armSwing * 0.2 * s, 0, forkOut] as const },
          hay: HAY_OFF,
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 26, 3));
    k.animation('run', stride(0.58, 0.14, 0.04, 0.42, 0.025, 44, 10, 5));

    // Work: pitching hay, a 2.4 s loop solved by targets. One fork path in world space drives both
    // arms: the left hand's point on the haft (`L`), the fork's pitch below level, and its yaw to his
    // left. The right hand holds the haft near its top end, the left hand `W.gap` lower. The targets
    // go into the chest's rest frame, so the lean and the turn of the body carry the arms.
    //   0.00 ready, fork drawn back   0.12 draw: the left hand slides down the haft
    //   0.20 stab: the fork 47 degrees down, the tines 10 cm into the soil, the hips 6 cm down on bent
    //   knees, a small lean and a side bend to his left, the head up and turned to the tines
    //   0.30-0.44 lever: the top hand pushes down and back about the left hand, the tines lift the load
    //   0.44-0.62 slow lift: the knees straighten, the load comes up to hip height, the left hand slides
    //   up the haft   0.62-0.76 toss: the chest turns to his left, the tines flick up
    //   0.76-1.00 return to the ready pose.
    // The feet stay planted flat in a wide stance: each leg is solved through its knee to a fixed ankle.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    // Keys that wrap around the loop, so the path keeps its speed through p = 0.
    const wrap = <T,>(list: readonly (readonly [number, T])[]) => {
      const n = list.length;
      return [[list[n - 1]![0] - 1, list[n - 1]![1]], ...list, [1 + list[0]![0], list[0]![1]], [1 + list[1]![0], list[1]![1]]] as const;
    };
    const loopN = (p: number, list: readonly (readonly [number, number])[]): number => keys(p, wrap(list), 'spline');
    const loopV = (p: number, list: readonly (readonly [number, V3])[]): V3 => keys(p, wrap(list), 'spline');
    const W = {
      L: [
        [0, [-0.06, 0.35, 0.14]],
        [0.12, [-0.12, 0.358, 0.119]],
        [0.2, [-0.087, 0.285, 0.16]],
        [0.3, [-0.087, 0.29, 0.16]],
        [0.44, [-0.05, 0.31, 0.16]],
        [0.62, [0.02, 0.3, 0.17]],
        [0.72, [0.11, 0.32, 0.14]],
        [0.84, [0, 0.28, 0.17]],
      ] as const,
      pitch: [[0, 25], [0.12, 34], [0.2, 47], [0.3, 46], [0.44, 12], [0.62, -4], [0.72, -22], [0.84, 24]] as const,
      yaw: [[0, 32], [0.12, 44], [0.2, 45], [0.3, 45], [0.44, 38], [0.62, 55], [0.72, 100], [0.84, 50]] as const,
      turn: [[0, -26], [0.12, -30], [0.2, -30.4], [0.3, -31], [0.44, -32], [0.62, -14], [0.72, 20], [0.84, 0]] as const,
      lean: [[0, 8], [0.12, 13], [0.2, 15.3], [0.3, 15.5], [0.44, 13], [0.62, 6], [0.72, 3], [0.84, 4]] as const,
      // A side bend to his left (spine and chest): the head leans away from the haft in the stab.
      roll: [[0, 0], [0.12, -2], [0.2, -4.4], [0.3, -4.4], [0.44, -2], [0.62, 0], [0.72, 0], [0.84, 0]] as const,
      // The left hand holds the haft far down for the stab and the lever, and slides up for the lift
      // and the toss: the short arms reach the fork across the chest.
      gap: [[0, 0.12], [0.12, 0.2], [0.2, 0.27], [0.3, 0.27], [0.44, 0.2], [0.62, 0.13], [0.72, 0.15], [0.84, 0.12]] as const,
      // The hips drop on bent knees for the stab and the lever; the knees straighten for the lift and the toss.
      drop: [[0, 0.025], [0.12, 0.045], [0.2, 0.06], [0.3, 0.065], [0.44, 0.05], [0.62, 0.022], [0.72, 0.02], [0.84, 0.022]] as const,
      // The head turns to the tines and stays up (the brim clears the face); it tilts to his left, away from the haft.
      headYaw: [[0, 17.7], [0.12, 30], [0.2, 42.5], [0.3, 42], [0.44, 30], [0.62, 12.3], [0.72, -3], [0.84, 6]] as const,
      headRoll: [[0, -9.2], [0.12, -6], [0.2, -3], [0.3, -3], [0.44, -8], [0.62, -6.8], [0.72, -4], [0.84, -4]] as const,
    };
    // The knees bend forward and a little out; the toes turn out 8 degrees.
    const KNEE_POLE: V3 = [0.16, KNEE[1], 0.3];
    const TOE_L: V3 = [Math.sin(8 * DEG), 0, Math.cos(8 * DEG)];
    const POLE_R: V3 = [-0.5, 0.15, -0.15];
    const POLE_L: V3 = [0.5, 0.15, -0.1];
    k.animation('work', {
      duration: 2.4,
      dig: 0.12, // the fork's tines go into the ground
      pose: (_t, p) => {
        const turn = loopN(p, W.turn);
        const lean = loopN(p, W.lean);
        const drop = loopN(p, W.drop);
        const roll = loopN(p, W.roll);
        const hipsMove: V3 = [0, -drop, (-0.012 * lean) / 16];
        const hipsRot: V3 = [0, 0.35 * turn, 0];
        const spineRot: V3 = [0.6 * lean, 0.3 * turn, 0.5 * roll];
        const chestRot: V3 = [0.4 * lean, 0.35 * turn, 0.5 * roll];
        // World to the chest's rest frame (where the arm targets and directions live).
        const qHS = motion.quat(hipsRot).multiply(motion.quat(spineRot));
        const inv = qHS.clone().multiply(motion.quat(chestRot)).invert();
        const pivot = add(add(add(HIPS_P, hipsMove), turnBy(hipsRot, sub(SPINE_P, HIPS_P))), turnBy(motion.euler(qHS), sub(CHEST_P, SPINE_P)));
        const toDir = (d: V3): V3 => {
          const v = new THREE.Vector3(...d).applyQuaternion(inv);
          return [v.x, v.y, v.z];
        };
        const toPoint = (x: V3) => add(CHEST_P, toDir(sub(x, pivot)));

        // The fork: its direction (grip to tines), the hollow side of the tines up, and the two hands.
        const pitch = loopN(p, W.pitch) * DEG;
        const yaw = loopN(p, W.yaw) * DEG;
        const dirW: V3 = [Math.cos(pitch) * Math.sin(yaw), -Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)];
        const dir = toDir(dirW);
        const up = toDir(unit(sub([0, 1, 0], scl(dirW, dirW[1]))));
        const left = toPoint(loopV(p, W.L));
        const grip = sub(left, scl(dir, loopN(p, W.gap)));
        const forkTurn = motion.quat(orient([], { dir: FORK_DIR, up: FORK_UP }, { dir, up }));
        const wristR = sub(grip, [...new THREE.Vector3(...GRIP_OFF).applyQuaternion(forkTurn).toArray()] as V3);
        const armR = reach(ARM_R, wristR, POLE_R);
        const handR = orient([armR.upper, armR.lower], { dir: FORK_DIR, up: FORK_UP }, { dir, up });
        // The left fist closes on the haft from the shoulder's side.
        const side = sub(left, SHOULDER);
        const toHaft = unit(sub(side, scl(dir, dot(side, dir))));
        const armL = reach(ARM_L, sub(left, scl(toHaft, Math.hypot(...FIST_C))), POLE_L);
        const handL = orient([armL.upper, armL.lower], { dir: unit(FIST_C), up: [1, 0, 0] }, { dir: toHaft, up: dir });

        // Legs: each ankle stays on its planted target (world), solved through the knee in the hips' rest
        // frame; the boot takes the opposite turn, so its sole stays flat on the ground.
        const hipsInv = motion.quat(hipsRot).invert();
        const leg = (hip: V3, knee: V3, ankle: V3, planted: V3, pole: V3, toe: V3) => {
          const target = add(HIPS_P, new THREE.Vector3(...sub(planted, add(HIPS_P, hipsMove))).applyQuaternion(hipsInv).toArray() as V3);
          const r = reach({ root: hip, mid: knee, end: ankle }, target, pole);
          const foot = orient([hipsRot, r.upper, r.lower], { dir: [0, 1, 0], up: [0, 0, 1] }, { dir: [0, 1, 0], up: toe });
          return { leg: { rotate: r.upper }, shin: { rotate: r.lower }, foot: { rotate: foot } };
        };
        const legL = leg(HIP, KNEE, ANKLE, STANCE_L, KNEE_POLE, TOE_L);
        const legR = leg(mx(HIP), mx(KNEE), mx(ANKLE), STANCE_R, mx(KNEE_POLE), mx(TOE_L));

        // The hay: grows on the tines as they come out of the soil, rides through the lift, and flies
        // off the tines (along them and up off the hollow side) in the toss.
        const load = ease(0.3, 0.42, p) * (1 - ease(0.7, 0.8, p));
        const fly = ease(0.68, 0.8, p) * (1 - ease(0.86, 0.96, p)); // back on the tines while hidden
        const hay = Math.max(0.001, load);
        return {
          hips: { move: hipsMove, rotate: hipsRot },
          spine: { rotate: spineRot },
          chest: { rotate: chestRot },
          // He watches the tines: the head turns toward the fork and tilts to his left, away from the haft.
          neck: { rotate: [-0.2 * lean, 0, 0] },
          head: { rotate: [4 - 0.2 * lean, loopN(p, W.headYaw), loopN(p, W.headRoll)] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: handL },
          'leg.L': legL.leg,
          'shin.L': legL.shin,
          'foot.L': legL.foot,
          'leg.R': legR.leg,
          'shin.R': legR.shin,
          'foot.R': legR.foot,
          hay: { move: add(HAY_MOVE, add(scl(FORK_DIR, 0.14 * fly), scl(FORK_UP, 0.12 * fly))), scale: [hay, hay, hay] as V3 },
        };
      },
    });

    // ------------------------------------------------------------------ villager clips: talk and wave
    // The free left arm is posed by wrist targets (chest rest frame). His arms are short and his head
    // is wide, so the hand stays in front of the chest or out beside the cheek: far below the brim (0.78).

    // Talk: a friendly chat with someone in front. He leans a little on the fork (to his right), nods
    // and turns his head under the hat, and the left hand makes two palm-up points in front of the chest.
    // The head tilts only to his left, so the brim never dips toward the fork.
    k.animation('talk', {
      duration: 2.2,
      pose: (_t, p) => {
        const beat = bump(p, 2, 0.1);
        const sweep = wave(p, 1, 0.1);
        const wrist: V3 = [0.13 + 0.04 * sweep, 0.315 + 0.035 * beat, 0.14 + 0.01 * wave(p, 2)];
        const arm = reach(ARM_L, wrist, [0.35, 0.2, -0.12]);
        return {
          hips: { move: [0, -0.002 * bump(p, 2), 0] },
          spine: { rotate: [1.5, 0, 2.5 + 0.7 * wave(p, 1, 0.3)] },
          chest: { rotate: [1.2 * beat, 0, 0] },
          neck: { rotate: [-1.5, 0, 0] },
          head: { rotate: [4 * bump(p, 2, 0.2) - 1.5, 8 * wave(p, 1, 0.35), -2.5 - 1.5 * bump(p, 1, 0.1)] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: [-8 - 8 * beat, 14 * sweep, 0] },
          hay: HAY_OFF,
        };
      },
    });

    // Wave: a greeting. The left hand comes up out to the side, beside the cheek and far under the brim,
    // waves two and a half times, and comes down. The right arm and the fork stay planted.
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
          hay: HAY_OFF,
        };
      },
    });
  },
});
