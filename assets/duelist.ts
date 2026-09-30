import { defineAsset, motion, noise, profile, rgb, Sdf, sdf, THREE } from '../src/index.js';

/**
 * Duelist — Chibi Quest hero (catalog `heroes/martial/duelist`), about 1.0 m to the top of the hat
 * (the plume rises to about 1.16 m), faces +Z, stands on y = 0. Built on the bard: the same young
 * round face, chibi skeleton with knee bones, and clip set (the lute gone, a rapier in its place).
 * Target: docs/hero-mockups/duelist_001.jpg (one front view).
 *
 * Role: a hero seen at about 128 px; the hat, the plume, the ruffle, and the rapier carry the read.
 * One idea: a wide grey-taupe hat with a long white plume over a purple doublet, a white ruffle,
 *   and a slim gold-hilted rapier held out low. Shape language: round (soft body), with two sharp
 *   accents (the rapier and the pointed hem panels).
 * Palette: hat #8a8078 / #6a6058, gold edge #e0b040, plume #f4f0e8, hair #4a2e1c, doublet #7a4a8a
 *   with #5a3068 folds, cape #6a3a7a, belt #6b4226, breeches #ece0c4, boots #3a2a20, blade #c3c8cf.
 * Materials: skin, hat felt, plume, hair, doublet, sleeves, linen (ruffle, shirt), cape, leather,
 *   gold, breeches, boots, blade steel, hilt gold. Focal point: the face under the brim and the ruffle.
 * Rig: the rogue's skeleton (the cloak bone for the cape); the rapier is rigid on `hand.R`.
 *   Clips idle, walk, run, attack (a lunge thrust), attack2 (a flourish and a slash), hit, death
 *   (the rapier falls flat beside her), victory (the blade raised in a hop).
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
  brow: '#4a2a1a',
  mouth: '#a4503f',
  hair: '#4a2e1c',
  doublet: '#7a4a8a',
  clothDark: '#5a3068',
  cape: '#6a3a7a',
  hat: '#8a8078',
  hatShadow: '#6a6058',
  hatGold: '#e0b040',
  plume: '#f4f0e8',
  plumeShade: '#d8d0c2',
  linen: '#f4f0e8',
  linenShade: '#d9d1c2',
  gold: '#e0b040',
  leather: '#6b4226',
  pants: '#ece0c4',
  boot: '#3a2a20',
  sole: '#241812',
  blade: '#c3c8cf',
  hilt: '#c9a24a',
};

type V3 = readonly [number, number, number];
type Chain = { root: V3; mid: V3; end: V3 };
const rad = Math.PI / 180;
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const lerp = (a: V3, b: V3, t: number): V3 => add(a, sub(b, a), t);
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** A pole point in the arm's rest bend plane, on the elbow's side: IK to the rest wrist gives no turn. */
const restPole = (c: Chain): V3 => add(c.mid, sub(c.mid, lerp(c.root, c.end, 0.5)), 4);

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');

// Arms in the rest pose. The right (-X) hand holds the rapier low and out; the left hand hangs open.
const RH: V3 = [-0.245, 0.245, 0.1];
const LH: V3 = [0.245, 0.22, 0.055];
const CHAIN_R: Chain = { root: [-0.13, 0.385, 0], mid: [-0.207, 0.305, 0.035], end: RH };
const CHAIN_L: Chain = { root: [0.13, 0.385, 0], mid: [0.205, 0.3, 0.02], end: LH };
// The rapier points forward, a little outward and down; built along +Z at its own origin (the grip).
const D0 = norm([-0.5, 0.85, 0.15]);
const BLADE_UP: V3 = [0, 0, 1];
/** A roll reference for a blade direction: forward when the blade is up, up when it is level. */
const upFor = (d: V3): V3 => {
  const t = clamp01((Math.abs(d[1]) - 0.5) / 0.3);
  return norm([0, 1 - t, t]);
};
const bladePose = (s: sdf.Shape, d: V3 = D0, at: V3 = RH) =>
  s.rotateX(Math.asin(-d[1]) / rad).rotateY(Math.atan2(d[0], d[2]) / rad).at(...at);

export default defineAsset({
  name: 'duelist',
  description: 'Chibi duelist hero with a wide grey hat and a white plume, a white ruffle, a purple doublet and cape, and a gold-hilted rapier.',
  detail: 0.006,
  reference: 'docs/hero-mockups/duelist_001.jpg',
  // Color slots for individual duelists (the first option is the default look).
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#231a17', blond: '#c4974a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { purple: C.doublet, crimson: '#8a2a3a', teal: '#2f6068' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', clothing: 'purple' },
    crimson: { eyes: 'blue', hair: 'black', skin: 'tan', clothing: 'crimson' },
    teal: { eyes: 'green', hair: 'blond', skin: 'fair', clothing: 'teal' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', -0.3),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      dark: k.tint('clothing', { color: C.clothDark, follow: 1 }),
      cape: k.tint('clothing', { color: C.cape, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const HIP = [0.068, 0.195, 0] as const;
    const ANKLE = [0.098, 0.07, 0] as const;
    const KNEE = [0.083, 0.1325, 0] as const; // the knee: splits the leg (shin.L takes the weight below it)
    const mx = (p: V3) => [-p[0], p[1], p[2]] as const;
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      cloak: { parent: 'chest', at: [0, 0.43, -0.12] },
      'upperarm.L': { parent: 'chest', at: CHAIN_L.root },
      'forearm.L': { parent: 'upperarm.L', at: CHAIN_L.mid },
      'hand.L': { parent: 'forearm.L', at: CHAIN_L.end },
      'upperarm.R': { parent: 'chest', at: CHAIN_R.root },
      'forearm.R': { parent: 'upperarm.R', at: CHAIN_R.mid },
      'hand.R': { parent: 'forearm.R', at: CHAIN_R.end },
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
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    // Small round human ears: a rounded lobe with a shallow cup.
    const ears = pair(
      sdf
        .ellipsoid([0.024, 0.04, 0.03])
        .subtract(sdf.sphere(0.015).at(0.016, 0.002, 0.006))
        .rotateY(-12)
        .at(0.2, 0.615, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    // Arms: from the rest chains. The rapier hand is a fist round the grip; the left hand is open.
    const armShape = (c: Chain, tag: 'L' | 'R', hand: sdf.Shape) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(c.root, c.mid, 0.04, 0.036).bone(`upperarm.${tag}`),
        sdf.cone(c.mid, c.end, 0.036, 0.031).bone(`forearm.${tag}`),
        hand.bone(`hand.${tag}`),
      );
    const fistR = sdf.smoothUnion(
      0.012,
      sdf.capsule(add(RH, D0, -0.034), add(RH, D0, 0.022), 0.03),
      sdf.ellipsoid([0.014, 0.012, 0.03]).at(...add(RH, [0.022, 0.026, 0.008])), // the thumb over the grip
    );
    // The open left hand: a flat palm, four fingers fanned down, and a thumb.
    const fd = norm(sub(LH, CHAIN_L.mid));
    const fn0: V3 = norm(sub([0.2, 0, 1], [0, 0, 0]));
    const fn = norm(sub(fn0, [fd[0] * dot(fn0, fd), fd[1] * dot(fn0, fd), fd[2] * dot(fn0, fd)]));
    const fs = norm(cross(fd, fn));
    const palmC = add(LH, fd, 0.028);
    const finger = (off: number, len: number, curl: number, r: number) => {
      const a = add(add(palmC, fs, off), fd, 0.014);
      const b = add(add(a, fd, len), fn, curl);
      return sdf.capsule(a, b, r);
    };
    const handL = sdf.smoothUnion(
      0.01,
      sdf.ellipsoid([0.032, 0.038, 0.016]).rotateZ(25).at(...palmC),
      finger(-0.022, 0.05, 0.008, 0.0085),
      finger(-0.008, 0.06, 0.012, 0.0085),
      finger(0.007, 0.058, 0.012, 0.0085),
      finger(0.021, 0.046, 0.008, 0.008),
      sdf.capsule(add(add(palmC, fs, -0.03), fd, -0.008), add(add(add(palmC, fs, -0.052), fd, 0.028), fn, 0.012), 0.0095),
    );
    const arms = sdf.union(armShape(CHAIN_L, 'L', handL), armShape(CHAIN_R, 'R', fistR));

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.055, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] + 0.004));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const lash = pair(
      sdf
        .extrude(
          profile.polygon([
            [0, 0],
            [0.022, 0.016],
            [0.026, 0.01],
            [0.004, -0.008],
          ]),
          0.3,
        )
        .at(EYE[0] + 0.043, EYE[1] + 0.012, 0.1),
    );
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Calm, slightly arched brows and a small confident smile.
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.02, 58, 122), 0.3).at(0.1, 0.722 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.055, 0.012, 240, 300), 0.3).at(0, 0.53 + 0.05, 0.1);
    const blush = pair(at(sdf.sphere(0.032), 0.135, 0.56));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(arms)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lash, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hat: a shallow crown, a wide brim turned up at the sides
    // Built at its own origin (the brim plane), then tipped back so the face shows under the brim.
    const hatPose = (s: sdf.Shape) => s.rotateX(-8).at(0, 0.772, -0.005);
    const HAT = rgb(C.hat);
    const SHADE = rgb(C.hatShadow);
    const GOLDEDGE = rgb(C.hatGold);
    // The crown: a dome raised 0.02 m with a soft dent along the top.
    const crownDome = sdf
      .ellipsoid([0.208, 0.17, 0.198])
      .at(0, 0.02, -0.005)
      .intersect(sdf.halfSpace([0, -1, 0], 0.02))
      .paintFn((x, y, z, base) => (y < 0.034 ? SHADE : base));
    const crown = sdf.smoothSubtract(0.03, crownDome, sdf.ellipsoid([0.075, 0.06, 0.15]).at(0, 0.235, -0.01));
    // The brim: a 0.012 m plate reaching 0.09 m past the crown, gold edge band 0.008 m, then warped in height.
    const brimFlat = sdf
      .revolve(
        profile.polygon(
          [
            [0, -0.006],
            [0.2, -0.006],
            [0.27, -0.006],
            [0.278, 0],
            [0.27, 0.006],
            [0.2, 0.006],
            [0, 0.006],
          ],
          { smooth: false },
        ),
      )
      .scale([1.08, 1, 1.04])
      .paintFn((x, y, z, base) => (Math.hypot(x / 1.08, z / 1.04) > 0.2695 ? GOLDEDGE : y < -0.002 ? SHADE : HAT));
    // Droop 15 degrees at the front and back, curl up 20 degrees on the +X side only.
    const DROOP = Math.tan(15 * rad);
    const CURL = Math.tan(20 * rad);
    const lift = (x: number, z: number) =>
      -DROOP * Math.max(0, Math.abs(z) - 0.15) + CURL * Math.max(0, x - 0.15);
    const brim = new Sdf(
      (x, y, z) => brimFlat.dist(x, y - lift(x, z), z) * 0.85,
      {
        min: [brimFlat.bounds.min[0], brimFlat.bounds.min[1] - 0.06, brimFlat.bounds.min[2]],
        max: [brimFlat.bounds.max[0], brimFlat.bounds.max[1] + 0.08, brimFlat.bounds.max[2]],
      },
      (x, y, z, f) => brimFlat.color(x, y - lift(x, z), z, f),
    );
    const hat = hatPose(sdf.smoothUnion(0.014, crown, brim));
    k.body('hat', hat, { color: C.hat, roughness: 0.85, bone: 'head', detail: 0.005 });

    // The plume: a white feather sweeping up from the right side of the crown and back, curling at the tip.
    const plumeMain = sdf.chain(
      [
        [-0.14, 0.09, -0.02, 0.0232],
        [-0.2, 0.15, -0.04, 0.0377],
        [-0.243, 0.23, -0.08, 0.0493],
        [-0.25, 0.29, -0.14, 0.0522],
        [-0.225, 0.33, -0.21, 0.0435],
        [-0.195, 0.3, -0.27, 0.0319],
        [-0.175, 0.23, -0.3, 0.0174],
      ],
      0.03,
    );
    const plumeTuft = sdf.chain(
      [
        [-0.17, 0.11, 0.0, 0.0203],
        [-0.25, 0.17, 0.0, 0.0319],
        [-0.305, 0.2, -0.05, 0.0290],
        [-0.315, 0.16, -0.11, 0.0174],
      ],
      0.03,
    );
    const PL = rgb(C.plume);
    const PS = rgb(C.plumeShade);
    const plume = sdf
      .smoothUnion(0.03, plumeMain, plumeTuft)
      .displace(0.005, (x, y, z) => Math.sin(x * 95 + y * 70) * Math.cos(z * 80 + y * 40))
      .paintFn((x, y, z, base) => (y < 0.2 ? PS : PL));
    k.body('plume', hatPose(plume), { color: C.plume, roughness: 0.9, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ hair: 16 locks over the whole skull
    const SKULL_Z = -0.008;
    const skullPt = (phi: number, theta: number, s: number): V3 => [
      HEAD[0] * s * Math.sin(phi * rad) * Math.cos(theta * rad),
      HEAD_Y + 0.006 + HEAD[1] * s * Math.sin(theta * rad),
      SKULL_Z + HEAD[2] * s * Math.cos(phi * rad) * Math.cos(theta * rad),
    ];
    const lock = (i: number, phi: number, th0: number, th1: number, dphi: number, r: number) => {
      const j = (n: number) => noise.random(i, n, 7) - 0.5;
      const p0 = phi + 12 * j(1);
      const t0 = th0 + 6 * j(2);
      const t1 = th1 + 5 * j(3);
      const dp = dphi + 14 * j(4);
      return sdf.chain(
        [
          [...skullPt(p0, t0, 1.02), r] as [number, number, number, number],
          [...skullPt(p0 + dp * 0.5, (t0 + t1) / 2, 1.055), r * 1.05] as [number, number, number, number],
          [...skullPt(p0 + dp, t1, 1.055), r * 0.75] as [number, number, number, number],
        ],
        0.02,
      );
    };
    const specs: [number, number, number, number, number][] = [
      // phi, theta start, theta end, sweep, radius
      [-50, 58, 22, 14, 0.03],
      [-25, 62, 20, 12, 0.03],
      [0, 64, 22, 10, 0.03],
      [25, 62, 20, 8, 0.03],
      [50, 58, 22, 6, 0.03],
      [-72, 40, -2, -6, 0.028],
      [72, 40, -2, 6, 0.028],
      [-98, 46, 2, 0, 0.03],
      [98, 46, 2, 0, 0.03],
      [-124, 42, -10, -6, 0.03],
      [124, 42, -10, 6, 0.03],
      [-150, 40, -18, 8, 0.032],
      [150, 40, -18, -8, 0.032],
      [180, 46, -12, 10, 0.034],
      [-172, 28, -20, -12, 0.03],
      [168, 26, -22, 10, 0.03],
    ];
    const locks = specs.map(([phi, a, b, d, r], i) => lock(i, phi, a, b, d, r).paint(T.hair));
    const faceMask = sdf.ellipsoid([0.23, 0.16, 0.22]).at(0, 0.6, 0.15);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.006, SKULL_Z)
      .smoothSubtract(0.015, faceMask)
      .paint(T.hairDark);
    const hair = sdf
      .smoothUnion(0.012, cap, ...locks)
      .displace(0.003, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2))
      .intersect(hatPose(sdf.halfSpace([0, 1, 0], -0.02)));
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ doublet: a torso, a hem of four pointed panels
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.122, 0.29],
            [0.13, 0.25],
            [0.142, 0.2],
            [0.14, 0.19],
            [0.132, 0.184],
            [0, 0.184],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const skirtSolid = sdf.revolve(
      profile.polygon([
        [0.115, 0.24],
        [0.132, 0.24],
        [0.15, 0.215],
        [0.168, 0.192],
        [0.164, 0.184],
        [0.11, 0.184],
      ]),
    );
    // Four V notches between the points, at 45, 135, 225, and 315 degrees.
    const notch = (deg: number) =>
      sdf.box([0.05, 0.05, 0.07], 0.004).rotateZ(45).at(0, 0.188, 0.168).rotateY(deg);
    const notches = sdf.union(notch(45), notch(135), notch(225), notch(315));
    const skirtRaw = sdf.subtract(skirtSolid, notches);
    const skirt = skirtRaw
      .paintWhere(notches.round(0.008), C.gold, 0.002)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.198), C.gold, 0.002)
      .scale([1, 1, 0.78]);
    // A raised gold band along the hem, following the points.
    const hemBand = skirtRaw
      .round(0.004)
      .intersect(sdf.union(sdf.halfSpace([0, 1, 0], 0.196), notches.round(0.008)))
      .scale([1, 1, 0.78]);
    // A darker seam down the front, and darker folds under the arms.
    const seam = sdf.box([0.008, 0.3, 0.3]).at(0, 0.33, 0.15);
    const doublet = sdf
      .smoothUnion(0.012, torso, skirt)
      .paintWhere(seam, T.dark, 0.002)
      .paintWhere(sdf.box([0.06, 0.08, 0.3]).at(0.15, 0.32, 0), T.dark, 0.03)
      .paintWhere(sdf.box([0.06, 0.08, 0.3]).at(-0.15, 0.32, 0), T.dark, 0.03);
    k.body('doublet', doublet.bone('spine'), { color: T.cloth, roughness: 0.8 });

    // Shoulder caps of the doublet (purple), down to the middle of the upper arm.
    const capShape = (c: Chain, tag: 'L' | 'R') => {
      const side = Math.sign(c.root[0]);
      return sdf
        .smoothUnion(
          0.02,
          sdf.ellipsoid([0.055, 0.052, 0.054]).at(c.root[0] + side * 0.01, c.root[1] - 0.008, 0),
          sdf.cone(c.root, lerp(c.root, c.mid, 0.66), 0.048, 0.044),
        )
        .bone(`upperarm.${tag}`);
    };
    k.body('sleeves', sdf.union(capShape(CHAIN_L, 'L'), capShape(CHAIN_R, 'R')), { color: T.cloth, roughness: 0.82 });

    // ------------------------------------------------------------------ linen: ruffle collar, shirt sleeves, cuffs
    const pleat = (phase: number) => (x: number, _y: number, z: number) => Math.cos(Math.atan2(z, x) * 8 + phase);
    const ring = (R: number, y: number, r: number, phase: number) =>
      sdf.torus(R, r).scale([1, 1, 0.92]).displace(0.011, pleat(phase), 1.15).at(0, y, -0.004);
    const ruffle = sdf.smoothUnion(
      0.006,
      ring(0.082, 0.482, 0.02, 0),
      ring(0.1, 0.458, 0.021, Math.PI),
      ring(0.118, 0.434, 0.022, 0),
    );
    const paintLinen = (s: sdf.Shape) => s.paintFn((x, y, z, base) => (Math.cos(Math.atan2(z, x) * 8) < -0.55 ? rgb(C.linenShade) : base));
    const shirt = (c: Chain, tag: 'L' | 'R') => {
      const a = lerp(c.root, c.mid, 0.55);
      const b = lerp(c.mid, c.end, 0.6);
      const cuffA = lerp(c.mid, c.end, 0.58);
      const cuffB = lerp(c.mid, c.end, 0.82);
      return sdf.smoothUnion(
        0.012,
        sdf.smoothUnion(0.03, sdf.cone(a, c.mid, 0.043, 0.042).bone(`upperarm.${tag}`), sdf.cone(c.mid, b, 0.042, 0.04).bone(`forearm.${tag}`)),
        sdf.cone(cuffA, cuffB, 0.043, 0.045).round(0.004).bone(`forearm.${tag}`),
      );
    };
    k.body('linen', paintLinen(sdf.union(ruffle.bone('chest'), shirt(CHAIN_L, 'L'), shirt(CHAIN_R, 'R'))), {
      color: C.linen,
      roughness: 0.9,
      detail: 0.006,
    });

    // ------------------------------------------------------------------ short cape (behind)
    const folds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.38 - y) / 0.26));
    const capeCone = (r0: number, r1: number, y0: number, y1: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, y0],
            [r0, y0],
            [r1, y1],
            [0, y1],
          ]),
        )
        .scale([1, 1, 0.85])
        .displace(0.012, folds);
    const capeInner = capeCone(0.128, 0.285, 0.47, 0.2).at(0, 0, -0.03);
    const capeShell = capeCone(0.15, 0.305, 0.45, 0.2)
      .at(0, 0, -0.03)
      .subtract(capeInner)
      .intersect(sdf.halfSpace([0, 0, 1], -0.03));
    const cape = capeShell.paintWhere(capeInner.round(0.006), T.dark, 0.008);
    k.body('cape', cape.bone('cloak'), { color: T.cape, roughness: 0.85 });

    // ------------------------------------------------------------------ leather belt
    const beltY = 0.252;
    const belt = torso.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0));
    k.body('leather', belt.bone('spine'), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ gold: buttons, belt studs, shoulder buttons
    const torsoZ = (y: number) => sdf.raycast(torso, [0, y, 1], [0, 0, -1])![2];
    const buttons = sdf.union(...[0.388, 0.352, 0.316, 0.28].map((y) => sdf.sphere(0.0095).at(0, y, torsoZ(y) + 0.002)));
    const belowBelt = sdf.sphere(0.0095).at(0, 0.215, sdf.raycast(skirt, [0, 0.215, 1], [0, 0, -1])![2] + 0.002);
    const studs = sdf.union(
      ...[-0.05, 0, 0.05].map((x) => sdf.sphere(0.012).at(x, beltY, sdf.raycast(belt, [x, beltY, 1], [0, 0, -1])![2] + 0.003)),
    );
    const shoulderBtn = (c: Chain, tag: 'L' | 'R') => {
      const side = Math.sign(c.root[0]);
      const ctr: V3 = [c.root[0] + side * 0.012, c.root[1] - 0.008, 0];
      const d = norm([side * 0.35, 0.9, 0.25]);
      const cap = capShape(c, tag);
      const p = sdf.raycast(cap, add(ctr, d, 0.3), [-d[0], -d[1], -d[2]])!;
      return sdf.sphere(0.0115).at(p[0], p[1], p[2]).bone(`upperarm.${tag}`);
    };
    k.body('gold', sdf.union(buttons.bone('chest'), hemBand.bone('spine'), belowBelt.bone('spine'), studs.bone('spine'), shoulderBtn(CHAIN_L, 'L'), shoulderBtn(CHAIN_R, 'R')), {
      color: C.gold,
      roughness: 0.32,
      metalness: 0.9,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ breeches and tall boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.11, 0.004], 0.052).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.09, 0.02).at(0, 0.07, 0),
        sdf.ellipsoid([0.058, 0.055, 0.1]).at(0, 0.052, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const shaft = sdf.cylinder(0.054, 0.05, 0.014).at(0, 0.078, 0);
    const bootCuff = sdf.cone([0, 0.09, 0], [0, 0.106, 0], 0.056, 0.064).round(0.005);
    const boot = sdf
      .union(bootFoot, sole.paint(C.sole), shaft, bootCuff)
      .intersect(sdf.halfSpace([0, 1, 0], 0.108))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the rapier (rigid on hand.R)
    // Built along +Z with the grip centered at the origin, then aimed along D0 at the fist.
    // Blade: 0.30 m long, 0.012 m wide, a diamond section that tapers to the point.
    const blade = sdf
      .box([0.0113, 0.0113, 0.3], 0.0008)
      .rotateZ(45)
      .at(0, 0, 0.21)
      .intersect(sdf.cone([0, 0, 0.06], [0, 0, 0.362], 0.0105, 0.0006))
      .scale([1, 0.8, 1])
      .paint(C.blade);
    // Wrapped grip: dark leather bands round the gold core.
    const wrap = rgb('#4a2a18');
    const grip = sdf
      .capsule([0, 0, -0.04], [0, 0, 0.04], 0.0115)
      .displace(0.0012, (x, y, z) => Math.sin(z * 260 + Math.atan2(y, x) * 2))
      .paintFn((x, y, z, base) => (Math.sin(z * 260 + Math.atan2(y, x) * 2) > 0 ? wrap : base));
    // Swept cup guard r 0.035, hollow toward the hand, with a knuckle bow curving back to the pommel.
    const guard = sdf
      .sphere(0.037)
      .subtract(sdf.sphere(0.031))
      .intersect(sdf.halfSpace([0, 0, -1], 0))
      .at(0, 0, 0.04);
    const guardRim = sdf.torus(0.0345, 0.0055).rotateX(90).at(0, 0, 0.04);
    const bow = sdf.chain(
      [
        [-0.03, 0, 0.04, 0.0045],
        [-0.042, 0, 0.012, 0.0045],
        [-0.04, 0, -0.026, 0.0045],
        [-0.012, 0, -0.056, 0.0055],
      ],
      0.01,
    );
    const pommel = sdf.sphere(0.017).at(0, 0, -0.058);
    const hilt = sdf.smoothUnion(0.006, grip, guard, guardRim, pommel, bow);
    k.body('rapierBlade', bladePose(blade), { color: C.blade, roughness: 0.28, metalness: 0.9, detail: 0.002, bone: 'hand.R' });
    k.body('rapierHilt', bladePose(hilt), { color: C.hilt, roughness: 0.4, metalness: 0.7, detail: 0.003, bone: 'hand.R' });

    // ------------------------------------------------------------------ animation helpers
    const { wave, bump, legDrop, keys, reach, orient, quat } = motion;
    const LEG = 0.19;
    const LEG_PART = 0.127; // hip to ankle through the knee
    type BonePoses = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;
    /** Bent knees that lower the hips by `drop` with the feet flat on the ground. */
    const knees = (drop: number): BonePoses => {
      const a = Math.acos(Math.max(-1, Math.min(1, 1 - drop / LEG_PART))) / rad;
      const out: BonePoses = {};
      for (const s of ['L', 'R']) {
        out[`leg.${s}`] = { rotate: [-a, 0, 0] };
        out[`shin.${s}`] = { rotate: [2 * a, 0, 0] };
        out[`foot.${s}`] = { rotate: [-a, 0, 0] };
      }
      return out;
    };
    /** One leg in the side plane: hips moved by (dy, dz), the ankle at height ay and depth az, the foot flat. */
    const LL = 0.0625;
    const legTo = (tag: 'L' | 'R', dy: number, dz: number, ay: number, az: number): BonePoses => {
      const vy = ay - (HIP[1] + dy);
      const vz = az - dz;
      const d = Math.min(Math.hypot(vy, vz), 2 * LL * 0.999);
      const phi = Math.atan2(vz, -vy);
      const alpha = Math.acos(d / (2 * LL));
      return {
        [`leg.${tag}`]: { rotate: [-(phi + alpha) / rad, 0, 0] },
        [`shin.${tag}`]: { rotate: [(2 * alpha) / rad, 0, 0] },
        [`foot.${tag}`]: { rotate: [(phi - alpha) / rad, 0, 0] },
      };
    };
    const POLE_R = restPole(CHAIN_R);
    /** The sword arm: the wrist at `wrist` (chest frame), the blade along `dir`. */
    const swordArm = (wrist: V3, dir: V3, up?: V3): BonePoses => {
      const r = reach(CHAIN_R, wrist, POLE_R);
      return {
        'upperarm.R': { rotate: r.upper },
        'forearm.R': { rotate: r.lower },
        'hand.R': { rotate: orient([r.upper, r.lower], { dir: D0, up: BLADE_UP }, { dir: norm(dir), up: up ?? upFor(norm(dir)) }) },
      };
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p, 2), 0] },
        chest: { rotate: [1.5 * wave(p), 2 * wave(p, 1, 0.1), 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [2 * wave(p, 2, 0.1), 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.L': { rotate: [0, 0, 2 * wave(p, 1, 0.2)] },
        'hand.L': { rotate: [4 * wave(p, 2, 0.1), 0, 0] },
        'hand.R': { rotate: [3 * wave(p, 2, 0.2), 0, 2 * wave(p, 1, 0.3)] },
      }),
    });

    // The legs come from motion.gait (as the rogue's); the arms bob and the rapier rides the fist.
    const stride = (duration: number, step: number, lift: number, duty: number, lean: number, hop: number, flow: number, bob: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 5 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [ANKLE[0], 0, -0.045],
          toe: [ANKLE[0], 0, 0.11],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        const b = bob * wave(p, 2, 0.1);
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [b, 0, 0] as const },
          'upperarm.R': { rotate: [b, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 3, 0.006, 6, 2));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 10, 0.03, 22, 4));

    // ------------------------------------------------------------------ attack: a lunge thrust
    // The blade draws back, the right foot steps forward, the hips drop and the arm drives the blade
    // out level; then a hold and a recovery. The left foot stays planted.
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const fwd = keys(p, [[0, 0], [0.18, 0], [0.34, 1], [0.6, 1], [0.88, 0], [1, 0]] as const);
        const prep = keys(p, [[0, 0], [0.16, 1], [0.3, 0], [1, 0]] as const);
        const lift = keys(p, [[0.16, 0], [0.26, 1], [0.36, 0], [0.62, 0], [0.74, 1], [0.86, 0]] as const);
        const dy = -0.02 * fwd - 0.008 * prep;
        const dz = 0.05 * fwd - 0.012 * prep;
        const wrist = keys(
          p,
          [
            [0, RH],
            [0.16, [-0.2, 0.3, -0.005]],
            [0.32, [-0.2, 0.31, 0.155]],
            [0.6, [-0.2, 0.31, 0.155]],
            [0.86, RH],
            [1, RH],
          ] as [number, V3][],
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, D0],
            [0.16, norm([-0.12, 0.22, 0.95])],
            [0.32, norm([-0.1, 0.0, 1])],
            [0.6, norm([-0.1, 0.0, 1])],
            [0.86, D0],
            [1, D0],
          ] as [number, V3][],
        );
        const lean = 9 * fwd - 3 * prep;
        return {
          hips: { move: [0, dy, dz], rotate: [0, 6 * fwd, 0] },
          ...legTo('L', dy, dz, 0.07, 0),
          ...legTo('R', dy, dz, 0.07 + 0.035 * lift, 0.1 * fwd),
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean * 0.4, 8 * fwd - 6 * prep, 0] },
          head: { rotate: [-lean * 1.2, -10 * fwd + 4 * prep, 0] },
          cloak: { rotate: [8 * fwd + 4 * prep, 0, 0] },
          'upperarm.L': { rotate: [10 * fwd, 0, 22 * fwd] },
          'forearm.L': { rotate: [-8 * fwd, 0, 0] },
          ...swordArm(wrist, dir),
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a flourish, then a slash
    const CC: V3 = [-0.22, 0.32, 0.11];
    const circ = (u: number): { w: V3; d: V3 } => {
      const a = -Math.PI / 2 + 2 * Math.PI * u;
      return {
        w: [CC[0] + 0.03 * Math.cos(a), CC[1] + 0.03 * Math.sin(a), CC[2]],
        d: norm([-0.3 + 0.5 * Math.cos(a), 0.12 + 0.5 * Math.sin(a), 0.8]),
      };
    };
    k.animation('attack2', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const c0 = circ(0);
        const inCircle = p >= 0.14 && p <= 0.48;
        const u = keys(p, [[0.14, 0], [0.48, 1]] as const, 'linear');
        const cc = circ(u);
        const W: V3 = [-0.25, 0.33, 0.06];
        const S: V3 = [-0.05, 0.31, 0.15];
        const wristK = keys(
          p,
          [
            [0, RH],
            [0.14, c0.w],
            [0.48, c0.w],
            [0.6, W],
            [0.72, S],
            [0.8, S],
            [0.96, RH],
          ] as [number, V3][],
        );
        const dirK = keys(
          p,
          [
            [0, D0],
            [0.14, c0.d],
            [0.48, c0.d],
            [0.6, norm([-1, 0.25, 0.35])],
            [0.72, norm([0.75, -0.1, 0.65])],
            [0.8, norm([0.75, -0.1, 0.65])],
            [0.96, D0],
          ] as [number, V3][],
        );
        const wrist = inCircle ? cc.w : wristK;
        const dir = inCircle ? cc.d : dirK;
        const yaw = keys(p, [[0, 0], [0.14, -6], [0.5, -6], [0.6, -24], [0.74, 20], [0.85, 14], [1, 0]] as const);
        const crouch = keys(p, [[0, 0], [0.14, 0.4], [0.5, 0.4], [0.62, 1], [0.76, 0.6], [1, 0]] as const);
        const side = keys(p, [[0, 0], [0.5, 0.4], [0.74, 1], [1, 0]] as const);
        return {
          hips: { move: [0, -0.016 * crouch, 0], rotate: [0, 0.4 * yaw, 0] },
          ...knees(0.016 * crouch),
          spine: { rotate: [3 * crouch, 0, 0] },
          chest: { rotate: [0, 0.6 * yaw, 0] },
          head: { rotate: [-2 * crouch, -0.5 * yaw, 0] },
          cloak: { rotate: [4 + 6 * crouch, -0.4 * yaw, 0] },
          'upperarm.L': { rotate: [4 * side, 0, 18 * side] },
          ...swordArm(wrist, dir),
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const whip = keys(p, [[0, 0], [0.2, 1], [0.4, 0.5], [0.6, -0.2], [0.82, 0]] as const, 'spline');
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(clamp01((p - 0.04) / 0.2)) + bump(clamp01((p - 0.58) / 0.32));
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.28, 1], [0.5, -0.45], [0.74, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const lean = Math.asin(back / LEG) / rad;
        return {
          hips: { move: [0, -legDrop(LEG, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-4 * whip, 0, 0] },
          head: { rotate: [-10 * whip, -6 * whip, 4 * whip] },
          cloak: { rotate: [12 * lag, 0, 4 * lag] },
          'upperarm.L': { rotate: [-8 * h, 0, 6 * h] },
          'forearm.L': { rotate: [-6 * h, 0, 0] },
          'upperarm.R': { rotate: [-8 * h, 0, -6 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'leg.R': { rotate: [lean + 8 * lift, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [-lean - 8 * lift, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The arms fly out and fall to the ground at her sides; the rapier lies flat beside the right hand.
    const LIE = 78;
    const LIE_Y = 0.178;
    const HEEL = 0.05;
    const TURN = 22;
    const BEND_NECK = 10;
    const BEND_HEAD = 12;
    const HIPS0: V3 = [0, 0.2, 0];
    const turnX = (v: V3, deg: number): V3 => {
      const c = Math.cos(deg * rad);
      const s = Math.sin(deg * rad);
      return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
    };
    const END: V3 = [0, LIE_Y - 0.2, -HEEL - 0.2 * Math.sin(LIE * rad) + HEEL * Math.cos(LIE * rad)];
    const toWorld = (v: V3): V3 => add(add(HIPS0, END), turnX(sub(v, HIPS0), -LIE));
    const toBody = (w: V3): V3 => add(HIPS0, turnX(sub(w, add(HIPS0, END)), LIE));
    const LEG_DOWN = Math.asin(clamp01((LIE_Y - 0.035) / 0.165)) / rad - (90 - LIE);
    type Weights = { hitB: number; sag: number; fly: number; land: number };
    const deathArm = (side: 1 | -1) => {
      const f = (v: V3): V3 => [v[0] * side, v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const c = side === 1 ? CHAIN_L : CHAIN_R;
      const pole0 = restPole(c);
      const shoulderW = toWorld(c.root);
      const fistY = side === 1 ? 0.03 : 0.056;
      const span = Math.sqrt(Math.max(0, 0.2 ** 2 - (shoulderW[1] - fistY) ** 2));
      const out = norm([0.93 * side, 0, 0.37]);
      const fistW: V3 = [shoulderW[0] + out[0] * span, fistY, shoulderW[2] + out[2] * span];
      const fistEnd = toBody(fistW);
      const flat = norm([-0.12, 0, 1]);
      return (trunk: readonly V3[], w: Weights): BonePoses => {
        const stand = add(add(add(c.end, f([0.04, 0.04, 0.05]), w.hitB), [0, -0.03, 0.02], w.sag), f([0.08, 0.06, 0.02]), w.fly);
        const arm = reach(c, lerp(stand, fistEnd, w.land), lerp(pole0, f([0.6, 0.45, 0.1]), w.land));
        const bones: BonePoses = {
          [`upperarm.${tag}`]: { rotate: arm.upper },
          [`forearm.${tag}`]: { rotate: arm.lower },
        };
        if (side === 1) return bones;
        bones['hand.R'] = {
          rotate: orient([...trunk, arm.upper, arm.lower], { dir: D0, up: BLADE_UP }, { dir: norm(lerp(D0, flat, w.land)), up: upFor(norm(lerp(D0, flat, w.land))) }),
        };
        return bones;
      };
    };
    const deathL = deathArm(1);
    const deathR = deathArm(-1);
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24);
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 4 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const settle = keys(p, [[0.56, 0], [0.8, 1]] as const);
        const flat = keys(p, [[0.4, 0], [0.62, 1]] as const);
        const crumple = keys(p, [[0.42, 0], [0.56, 1], [0.72, 1], [0.9, 0]] as const);
        const back = 0.022 * hitB;
        const lean = Math.asin(back / LEG) / rad;
        const a = tilt * rad;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(LEG, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const legs = LEG_DOWN * clamp01((tilt - LIE + 18) / 18);
        const w = { hitB, sag, fly, land };
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + BEND_NECK * land, 0, 0] },
          head: { rotate: [-14 * hitB + 8 * sag + BEND_HEAD * land, -8 * hitB + TURN * settle, 8 * wob] },
          cloak: {
            rotate: [10 * hitB - 8 * flat - 12 * crumple, 0, 5 * wob],
            scale: [1 + 0.12 * flat, 1 - 0.15 * crumple, 1 - 0.6 * flat],
          },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean + 10 * settle, 18 * settle, 0] },
          'foot.R': { rotate: [lean + 10 * settle, -18 * settle, 0] },
          ...deathL([hipsR, spineR, chestR], w),
          ...deathR([hipsR, spineR, chestR], w),
        };
      },
    });

    // ------------------------------------------------------------------ victory: a hop with the rapier raised
    k.animation('victory', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const crouch = keys(p, [[0, 0], [0.14, 1], [0.26, 0.2], [0.34, 0], [0.5, 0.6], [0.62, 0], [1, 0]] as const);
        const air = keys(p, [[0.24, 0], [0.36, 1], [0.48, 0]] as const);
        const c = keys(p, [[0.3, 0], [0.62, 1]] as const);
        const wrist = keys(p, [[0, RH], [0.14, [-0.22, 0.24, 0.06]], [0.4, [-0.22, 0.3, 0.08]], [0.62, [-0.27, 0.45, 0.05]], [1, [-0.27, 0.45, 0.05]]] as [number, V3][], 'spline');
        const dir = keys(p, [[0, D0], [0.14, norm([-0.3, 0.1, 0.94])], [0.4, norm([-0.3, 0.6, 0.7])], [0.62, norm([-0.5, 1, 0.3])], [1, norm([-0.5, 1, 0.3])]] as [number, V3][]);
        return {
          hips: { move: [0, 0.05 * air - 0.026 * crouch, 0] },
          ...knees(0.026 * crouch),
          spine: { rotate: [-3 * c, 0, 0] },
          chest: { rotate: [-3 * c, 8 * c, 0] },
          neck: { rotate: [-4 * c, 0, 0] },
          head: { rotate: [-8 * c, -10 * c, 6 * c] },
          cloak: { rotate: [8 * air + 3 * c, 0, 0] },
          'upperarm.L': { rotate: [-25 * c, 0, 45 * c] },
          'forearm.L': { rotate: [-20 * c, 0, 0] },
          'hand.L': { rotate: [0, 0, 10 * wave(p, 3) * c] },
          ...swordArm(wrist, dir),
        };
      },
    });
  },
});
