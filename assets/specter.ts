import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Specter — Chibi Quest dungeon denizen (catalog `enemies/undead/specter`, P1), a tall floating
 * hooded phantom about 1.1 m tall, faces +Z. Target: docs/enemy-mockups/specter_001.jpg. Base:
 * wraith.ts (the floating rig: root, body, head, arms, hands; the hover clips).
 *
 * Role: a creeping dungeon enemy, seen in 3D and as a 128 px sprite; the deep hood with its black
 *   void and two round green eyes, the long thin grey arms, and the mist at the hem must read.
 * One idea: a deep hood holds a black void with two big round glowing eyes; the robe ends in a
 *   bank of pale green mist instead of feet, and two skeletal arms hang with chains from the wrists.
 * Proportions: hood 0.65 to 1.1 (0.4 wide), eyes at y 0.88 x +-0.065 r 0.03, cowl 0.47 to 0.68,
 *   robe hem (torn, layered) 0.14 to 0.27, mist 0 to 0.15 with wisps to 0.33, hands at 0.27,
 *   chains hang to 0.13. The mist touches y = 0 in the rest pose.
 * Shape language: soft rounded cloth (dome hood, lumpy cowl) against thin sharp bones and the
 *   little chain links; ragged pointed hem tatters.
 * Palette (60/30/10): blue-grey robe #4f6470 (shade #3a4a54, lit #6a8090); dark bone arms #4a5058;
 *   black void #050608; pale green #9dffb8 eyes and #a8e8b8 mist as the accent; chains #2a3a30.
 * Value plan: the black void in the mid-grey hood is the strongest contrast; the two glowing eyes
 *   are the focal point; the pale mist at the base is the second accent.
 * Bodies: cloth (hood, cowl, robe), void, eyes, arms (bones and hands), chains, mist.
 * Rig: root, body, head, arm.L/arm.R, hand.L/hand.R. The lower robe and the mist ride the root.
 *   Clips: idle (hover bob), walk (drift forward), attack (both claws reach forward), hit,
 *   death (sinks flat into the mist), taunt.
 */

const C = {
  robe: '#4f6470',
  robeLit: '#6a8090',
  robeShade: '#3a4a54',
  bone: '#4a5058',
  void: '#050608',
  glow: '#9dffb8',
  mist: '#a8e8b8',
  chain: '#2a3a30',
};

type V3 = readonly [number, number, number];
type V4 = [number, number, number, number];
const DEG = 180 / Math.PI;
const TAU = Math.PI * 2;
const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const bendDir = (a: V3, d: V3, deg: number): V3 => norm3(add3(mul3(a, Math.cos(deg / DEG)), mul3(d, Math.sin(deg / DEG))));
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

// Joints (left side; the right side mirrors).
const ROOT_AT: V3 = [0, 0.2, 0];
const BODY_AT: V3 = [0, 0.4, 0];
const HEAD_AT: V3 = [0, 0.66, 0];
const SHOULDER: V3 = [0.225, 0.565, 0];
const ELBOW: V3 = [0.25, 0.45, 0.02];
const WRIST: V3 = [0.268, 0.35, 0.036];
const FINGERTIP: V3 = [0.272, 0.27, 0.06];

/** Point `s` (built facing +Z at the origin) along the normal `n` and move it to `p`. */
const facing = (s: sdf.Shape, n: V3, p: V3) => s.rotateX(-Math.asin(n[1]) * DEG).rotateY(Math.atan2(n[0], n[2]) * DEG).at(...p);

/** A bony finger: knuckle spheres at the joints and thinner bones between them. */
const bonyFinger = (base: V3, dirs: V3[], lens: number[], radii: number[]) => {
  const pts: V3[] = [base];
  dirs.forEach((dv, i) => pts.push(add3(pts[i]!, mul3(dv, lens[i]!))));
  const parts: sdf.Shape[] = [];
  for (let i = 0; i < dirs.length; i++) {
    parts.push(sdf.cone(pts[i]!, pts[i + 1]!, radii[i]! * 0.72, radii[i + 1]! * 0.72));
    parts.push(sdf.sphere(radii[i]!).at(...pts[i]!));
  }
  return sdf.smoothUnion(0.003, ...parts);
};

export default defineAsset({
  name: 'specter',
  description:
    'Chibi specter dungeon enemy: a tall floating phantom in a grey-blue hooded robe with a wrapped ragged cowl, a black void face with two round glowing green eyes, thin skeletal arms with chains at the wrists, and a torn hem that ends in pale green mist.',
  detail: 0.007,
  reference: 'docs/enemy-mockups/specter_001.jpg',
  variants: {
    glow: { green: C.glow, blue: '#7fd0ff', red: '#ff6a5a' },
    robe: { grey: C.robe, black: '#202226', bone: '#cfc4b0' },
  },
  presets: {
    frost: { glow: 'blue', robe: 'grey' },
    ember: { glow: 'red', robe: 'black' },
    ossuary: { glow: 'green', robe: 'bone' },
  },

  build(k) {
    const T = {
      robe: k.tint('robe'),
      shade: k.tint('robe', -0.25),
      dark: k.tint('robe', -0.6),
      lit: k.tint('robe', 0.08),
      glow: k.tint('glow'),
      mist: k.tint('glow', { color: C.mist, follow: 1 }),
    };
    k.skeleton({
      root: { at: ROOT_AT },
      body: { parent: 'root', at: BODY_AT },
      head: { parent: 'body', at: HEAD_AT, tail: [0, 1.1, 0] },
      'arm.L': { parent: 'body', at: SHOULDER, tail: WRIST },
      'hand.L': { parent: 'arm.L', at: WRIST, tail: FINGERTIP },
      'arm.R': { parent: 'body', at: mx(SHOULDER), tail: mx(WRIST) },
      'hand.R': { parent: 'arm.R', at: mx(WRIST), tail: mx(FINGERTIP) },
    });

    // ------------------------------------------------------------------ hood and void
    const HOOD_Y = 0.88;
    const hoodOuter = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.2, 0.235, 0.195]).at(0, HOOD_Y, -0.02),
      sdf.cone([0, 0.95, -0.05], [0, 1.07, -0.17], 0.11, 0.045),
      sdf.ellipsoid([0.15, 0.09, 0.12]).at(0, 1.0, 0.07),
    );
    const opening = sdf.ellipsoid([0.138, 0.172, 0.32]).at(0, HOOD_Y - 0.005, 0.26);
    const rimBand = hoodOuter.round(0.016).smoothIntersect(0.012, opening.round(0.034));
    const hood = hoodOuter
      .displace(0.002, (x, y, z) => noise.fbm(x * 8, y * 8, z * 8, 2))
      .smoothUnion(0.012, rimBand)
      .smoothSubtract(0.01, opening)
      .bone('head');
    const voidShape = sdf.ellipsoid([0.165, 0.195, 0.15]).at(0, HOOD_Y - 0.005, -0.03);
    const onVoid = (x: number, y: number): V3 => sdf.raycast(voidShape, [x, y, 1], [0, 0, -1])!;
    const EYE: [number, number] = [0.066, HOOD_Y + 0.005];
    const eyeP = onVoid(EYE[0], EYE[1]);
    const eyeN = sdf.normalAt(voidShape, eyeP);
    const eyeAt: V3 = [eyeP[0] + eyeN[0] * 0.003, eyeP[1] + eyeN[1] * 0.003, eyeP[2] + eyeN[2] * 0.003];
    const eyes = facing(sdf.ellipsoid([0.03, 0.03, 0.014]), eyeN, eyeAt).mirror('x');

    // ------------------------------------------------------------------ wrapped cowl
    // Three flat scarf bands stacked with small offsets and different tilts; plain union keeps a
    // crisp crease between layers. No noise: smooth cloth like the mockup.
    const wrap = (R: number, y: number, tilt: number, roll: number) =>
      sdf.torus(R, 0.045).scale([1, 0.45, 1]).rotateZ(roll).rotateX(tilt).at(0, y, 0.005);
    // Two draped front tab flaps with pointed, torn ends.
    const tab = (x: number, y: number, tilt: number, roll: number, pts: [number, number][]) =>
      sdf.extrude(profile.polygon(pts), 0.02, 0.004).rotateZ(roll).rotateX(tilt).at(x, y, 0.232);
    const tabA = tab(0.05, 0.53, -6, 5, [[-0.034, 0], [0.034, 0], [0.032, -0.07], [0.012, -0.1], [0.002, -0.128], [-0.014, -0.085], [-0.03, -0.095]]);
    const tabB = tab(-0.055, 0.525, -4, -7, [[-0.032, 0], [0.032, 0], [0.03, -0.08], [0.018, -0.088], [-0.006, -0.112], [-0.026, -0.072]]);
    const cowl = sdf
      .smoothUnion(0.03, sdf.ellipsoid([0.17, 0.06, 0.14]).at(0, 0.585, -0.02))
      .smoothUnion(0.02, sdf.union(wrap(0.14, 0.672, 12, 0), wrap(0.155, 0.65, 18, 3), wrap(0.17, 0.628, 6, -3)))
      .smoothUnion(0.012, tabA, tabB)
      .bone('body');

    // ------------------------------------------------------------------ robe
    const shell = (grow: number): [number, number][] => [
      [0.13 + grow, 0.7],
      [0.18 + grow, 0.62],
      [0.195 + grow, 0.5],
      [0.19 + grow, 0.38],
      [0.215 + grow, 0.26],
      [0.235 + grow, 0.16],
      [0.245 + grow, 0.09],
    ];
    const closed = (half: [number, number][]) =>
      [[0, half[0]![1]], ...half, [0, 0.07], ...half.map(([u, v]) => [-u, v]).reverse()] as [number, number][];
    const N1 = 7;
    const angU = (N: number, ph: number) => (x: number, z: number) => {
      const a = Math.atan2(x, z);
      return (N * a) / TAU + 0.5 + ph + 0.16 * Math.sin(3 * a + ph * 5) + 0.08 * Math.sin(5 * a + 1);
    };
    const rimR = (x: number, z: number) => Math.min(1, Math.hypot(x, z) / 0.1);
    const lobe = (N: number, seed: number) => (i: number) => 0.25 + 0.75 * noise.random(((i % N) + N) % N, seed, 7);
    const hemFn = (N: number, ph: number, seed: number) => (x: number, _y: number, z: number) => {
      const u = angU(N, ph)(x, z);
      const i = Math.floor(u);
      const s = Math.abs(2 * (u - i) - 1);
      return (1 - 2 * lobe(N, seed)(i) * (1 - s ** 1.3)) * rimR(x, z);
    };
    const folds = (x: number, y: number, z: number) => smooth01(0.55, 0.2, y) * Math.cos(TAU * angU(6, 0.2)(x, z)) * rimR(x, z);
    const under = sdf
      .revolve(profile.polygon(closed(shell(0)), { smooth: true }))
      .displace(0.008, folds, 2)
      .smoothIntersect(0.006, sdf.halfSpace([0, -1, 0], -0.18).displace(0.09, hemFn(N1, 0, 3), 3.5))
      .smoothSubtract(0.02, sdf.ellipsoid([0.15, 0.1, 0.15]).at(0, 0.09, 0));
    // The front flap: a second layer 0.02 in front of the robe, from the chest to a torn, pointed hem.
    const flapEdge = (x: number, y: number, z: number) => {
      const v = -1 + 2 * Math.min(1, Math.abs(x - 0.03) / 0.17);
      return Math.max(-1, Math.min(1, v + 0.35 * noise.fbm(x * 30, 0.5, z * 30, 2) + (x > 0.03 ? 0.15 : -0.1) * Math.sin(x * 90)));
    };
    const panel = sdf
      .revolve(profile.polygon(closed(shell(0.03)), { smooth: true }))
      .displace(0.006, folds, 2)
      .smoothIntersect(0.012, sdf.box([0.36, 0.5, 0.4], 0.04).at(0, 0.36, 0.26).displace(0.012, (x, y, z) => noise.fbm(x * 25, y * 25, z * 25, 2), 1.5))
      .smoothIntersect(0.006, sdf.halfSpace([0, -1, 0], -0.27).displace(0.11, flapEdge, 3.5));
    const robeAll = sdf.union(under, panel);
    const panelPaint = panel.round(0.004);
    const SPLIT = 0.32;
    const robeUpper = robeAll.intersect(sdf.box([0.8, 0.5, 0.8]).at(0, SPLIT + 0.25, 0)).bone('body');
    const robeLower = robeAll.intersect(sdf.box([0.8, 0.4, 0.8]).at(0, SPLIT - 0.2, 0)).bone('root');
    const robe = sdf.union(robeUpper, robeLower);

    const cloth = sdf
      .smoothUnion(0.04, hood, cowl)
      .smoothUnion(0.02, robe)
      .paintWhere(sdf.box([1.2, 0.22, 1.2]).at(0, 0.11, 0), T.shade, 0.1)
      .paintWhere(sdf.box([1.2, 0.14, 1.2]).at(0, 0.6, 0), T.lit, 0.03)
      .paintWhere(panelPaint, T.lit, 0.01)
      .paintWhere(opening.round(0.006).intersect(sdf.box([0.6, 0.4, 0.7]).at(0, 0.9, 0.1)), T.dark, 0.006);
    k.body('cloth', cloth, {
      color: T.robe,
      roughness: 0.85,
      detail: 0.005,
      textureDensity: 1.3,
      bump: (x, y, z) => {
        // A few long vertical fold grooves (9 folds around the body), fading out at the hood top.
        const a = Math.atan2(x, z);
        const fold = Math.cos(9 * a + 0.5 * Math.sin(3 * a));
        return 0.003 * fold * smooth01(1.0, 0.85, y) * smooth01(0.05, 0.2, Math.hypot(x, z));
      },
    });
    k.body('void', voidShape.bone('head'), { color: C.void, roughness: 0.3, detail: 0.006, bone: 'head' });
    k.body('eyes', eyes.bone('head'), { color: T.glow, roughness: 0.3, emissive: T.glow, emissiveIntensity: 2, detail: 0.003, bone: 'head' });

    // ------------------------------------------------------------------ skeletal arms and hands
    const armL = sdf.smoothUnion(
      0.008,
      sdf.cone(SHOULDER, ELBOW, 0.024, 0.02),
      sdf.sphere(0.028).at(...ELBOW),
      sdf.cone(ELBOW, WRIST, 0.02, 0.017),
      sdf.torus(0.021, 0.007).rotateZ(-4).at(WRIST[0] - 0.002, WRIST[1] + 0.012, WRIST[2] - 0.001),
    );
    // Wrapped bands on the arm, the way the mockup binds the bones.
    const at = (t: number, from: V3, to: V3): V3 => [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t];
    const band = (p: V3, R: number) => sdf.torus(R, 0.0055).rotateZ(-4).at(...p);
    const bands = sdf.union(
      band(at(0.3, ELBOW, WRIST), 0.021),
      band(at(0.7, ELBOW, WRIST), 0.019),
      band(at(0.4, SHOULDER, ELBOW), 0.022),
    );
    // The hand: a bony palm and five clawed fingers hanging and curling forward.
    const W = WRIST;
    const D: V3 = [0.03, -1, 0.05];
    const S: V3 = [1, 0, 0];
    const handParts: sdf.Shape[] = [sdf.ellipsoid([0.021, 0.024, 0.011]).at(W[0], W[1] - 0.026, W[2] + 0.003), sdf.sphere(0.017).at(...W)];
    for (let i = 0; i < 4; i++) {
      const o = i - 1.5;
      const knuckle: V3 = [W[0] + o * 0.0135, W[1] - 0.05, W[2] + 0.006 - Math.abs(o) * 0.002];
      handParts.push(sdf.cone([W[0] + o * 0.008, W[1] - 0.01, W[2]], knuckle, 0.009, 0.0075));
      const len = [0.85, 1, 0.96, 0.75][i]!;
      const curl = [4, 0, 6, 10][i]!;
      const fa = norm3(add3(D, mul3(S, o * 0.1)));
      const fwd: V3 = [0, 0, 1];
      handParts.push(
        bonyFinger(
          knuckle,
          [bendDir(fa, fwd, 12 + curl), bendDir(fa, fwd, 38 + curl), bendDir(fa, fwd, 68 + curl)],
          [0.037 * len, 0.031 * len, 0.026 * len],
          [0.0078, 0.0068, 0.0058, 0.002],
        ),
      );
    }
    handParts.push(
      bonyFinger(
        [W[0] - 0.02, W[1] - 0.026, W[2] + 0.006],
        [bendDir(norm3([-0.5, -0.8, 0.3]), [0, 0, 1], 10), bendDir(norm3([-0.2, -1, 0.5]), [0, 0, 1], 35)],
        [0.028, 0.024],
        [0.0078, 0.0066, 0.0022],
      ),
    );
    const handL = sdf.smoothUnion(0.005, ...handParts).at(-W[0], -W[1], -W[2]).scale(1.3).at(...W);
    const arms = sdf
      .union(sdf.smoothUnion(0.004, armL, bands).bone('arm.L'), handL.bone('hand.L'))
      .mirror('x', 0);
    k.body('arms', arms, { color: C.bone, roughness: 0.6, detail: 0.003, textureDensity: 1.5 });

    // ------------------------------------------------------------------ chains
    // A short chain hangs from each wrist in front of the hand: links alternate in plane.
    const CH0: V3 = [W[0] + 0.004, W[1] - 0.045, W[2] + 0.05];
    const links: sdf.Shape[] = [];
    for (let i = 0; i < 6; i++) {
      const link = sdf.torus(0.02, 0.006).scale([1, 1.2, 1]).rotateX(90);
      const turned = i % 2 === 0 ? link : link.rotateY(90);
      links.push(turned.at(CH0[0] + 0.002 * i, CH0[1] - 0.034 * i, CH0[2] + 0.003 * i));
    }
    k.body('chains', sdf.union(...links).bone('hand.L').mirror('x', 0), { color: C.chain, roughness: 0.45, metalness: 0.6, detail: 0.0035 });

    // ------------------------------------------------------------------ mist
    // Curling smoke: tapered chains rise from the ground around the hem and curl outward and up,
    // with four flattened blobs at the base. Two bodies split at y 0.17: a strong glow at the base
    // and a fading glow at the tips.
    const puff = (x: number, z: number, rx: number, ry: number, rz: number) => sdf.ellipsoid([rx, ry, rz]).at(x, ry, z);
    const blobs = [puff(0, 0.02, 0.24, 0.07, 0.22), puff(0.13, 0.12, 0.13, 0.055, 0.12), puff(-0.14, 0.1, 0.12, 0.05, 0.12), puff(0, -0.16, 0.16, 0.055, 0.11)];
    // Catmull-Rom through control points, sampled `n` times per segment.
    const catmull = (P: V4[], n: number): V4[] => {
      const out: V4[] = [];
      for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[Math.max(0, i - 1)]!, p1 = P[i]!, p2 = P[i + 1]!, p3 = P[Math.min(P.length - 1, i + 2)]!;
        for (let j = 0; j < n; j++) {
          const t = j / n, t2 = t * t, t3 = t2 * t;
          out.push([0, 1, 2, 3].map((c) => 0.5 * (2 * p1[c]! + (-p0[c]! + p2[c]!) * t + (2 * p0[c]! - 5 * p1[c]! + 4 * p2[c]! - p3[c]!) * t2 + (-p0[c]! + 3 * p1[c]! - 3 * p2[c]! + p3[c]!) * t3)) as V4);
        }
      }
      out.push(P[P.length - 1]!);
      return out;
    };
    // Ten wisps at the sides and back (angle from +Z); the front ones stay low.
    const wispAngles = [50, 120, 140, 160, 180, 200, 220, 240, 310, 350];
    const wisps = wispAngles.map((deg, i) => {
      const a0 = deg / DEG;
      const frontness = Math.max(0, Math.cos(a0));
      const r0 = 0.27 + 0.03 * noise.random(i, 3, 1);
      const top = (0.34 + 0.04 * noise.random(i, 5, 2)) * (1 - 0.45 * frontness);
      const dir = i % 2 === 0 ? 1 : -1;
      const ph = 6 * noise.random(i, 7, 4);
      const NS = 8;
      const ctrl: V4[] = [];
      for (let m = 0; m <= NS; m++) {
        const f = m / NS;
        // Two gentle curls: sideways and outward sways, each completing two cycles.
        const sway = 0.03 * Math.sin(TAU * 1.1 * f + ph) * Math.min(1, f * 3);
        const aa = a0 + dir * 0.35 * f + sway / r0;
        const rr = r0 + 0.07 * f + 0.03 * Math.sin(TAU * 1.1 * f + ph + 1.6) * Math.min(1, f * 3);
        const y = 0.05 + top * Math.pow(f, 0.85);
        const rad = 0.048 - 0.038 * f;
        ctrl.push([rr * Math.sin(aa), y, rr * Math.cos(aa), rad]);
      }
      return sdf.chain(catmull(ctrl, 2), 0.02);
    });
    const mist = sdf
      .smoothUnion(0.06, ...blobs, ...wisps)
      .displace(0.01, (x, y, z) => noise.fbm(x * 4 + 3, y * 4, z * 4, 2), 2)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const mistOpts = { color: T.mist, roughness: 0.9, opacity: 0.5, emissive: T.mist, detail: 0.006, bone: 'root' } as const;
    k.body('mist-base', mist.intersect(sdf.box([1.2, 0.17, 1.2]).at(0, 0.085, 0)).bone('root'), { ...mistOpts, emissiveIntensity: 0.6 });
    k.body('mist-tips', mist.intersect(sdf.box([1.2, 0.5, 1.2]).at(0, 0.42, 0)).bone('root'), { ...mistOpts, emissiveIntensity: 0.15 });

    // ------------------------------------------------------------------ animation
    const { wave, keys } = motion;
    type BP = { rotate?: V3; move?: V3; scale?: V3 };
    type Pose = Record<string, BP>;
    const addV = (a: V3 | undefined, b: V3 | undefined): V3 | undefined =>
      a && b ? [a[0] + b[0], a[1] + b[1], a[2] + b[2]] : (a ?? b);
    const mulV = (a: V3 | undefined, b: V3 | undefined): V3 | undefined =>
      a && b ? [a[0] * b[0], a[1] * b[1], a[2] * b[2]] : (a ?? b);
    const add = (a: Pose, b: Pose): Pose => {
      const out: Pose = { ...a };
      for (const [bone, p] of Object.entries(b)) {
        const q = out[bone] ?? {};
        const rotate = addV(q.rotate, p.rotate);
        const move = addV(q.move, p.move);
        const scale = mulV(q.scale, p.scale);
        out[bone] = { ...(rotate && { rotate }), ...(move && { move }), ...(scale && { scale }) };
      }
      return out;
    };
    const HOVER0 = 0.028;
    const idle = (p: number): Pose => ({
      root: { move: [0, 0.02 + 0.008 * wave(p, 1, 0.25), 0], rotate: [1.5 * wave(p, 1, 0.5), 0, 2.5 * wave(p, 1)] },
      body: { rotate: [1.5 * wave(p, 1, 0.7), 0, -2 * wave(p, 1, 0.1)] },
      head: { rotate: [2 * wave(p, 1, 0.8), 5 * wave(p, 1, 0.15), 2 * wave(p, 1, 0.2)] },
      'arm.L': { rotate: [3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
      'hand.L': { rotate: [5 * wave(p, 1, 0.6), 0, -3 * wave(p, 1, 0.3)] },
      'arm.R': { rotate: [3 * wave(p, 1, 0.9), 0, -4 * wave(p, 1, 0.8)] },
      'hand.R': { rotate: [5 * wave(p, 1, 0.1), 0, 3 * wave(p, 1, 0.8)] },
    });
    k.animation('idle', { duration: 1.8, pose: (_t, p) => idle(p) });

    k.animation('walk', {
      duration: 1.2,
      pose: (_t, p) => ({
        root: { move: [0, 0.04 + 0.01 * wave(p, 2, 0.25), 0], rotate: [10 + 2 * wave(p, 2), 3 * wave(p, 1, 0.1), 3 * wave(p, 1)] },
        body: { rotate: [5 + 2 * wave(p, 2, 0.2), 0, -3 * wave(p, 1, 0.2)] },
        head: { rotate: [-10 + 2 * wave(p, 2, 0.4), -3 * wave(p, 1, 0.1), 2 * wave(p, 1, 0.3)] },
        'arm.L': { rotate: [10 + 6 * wave(p, 1, 0.1), 0, 6 + 3 * wave(p, 2, 0.3)] },
        'hand.L': { rotate: [8 * wave(p, 2, 0.5), 0, 0] },
        'arm.R': { rotate: [10 - 6 * wave(p, 1, 0.1), 0, -6 - 3 * wave(p, 2, 0.8)] },
        'hand.R': { rotate: [8 * wave(p, 2, 0.1), 0, 0] },
      }),
    });

    // Attack (0.9 s): rears back with the arms drawn behind, lunges with both claws reaching
    // forward, holds, then floats back. First and last frames are idle frames.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const k1 = (list: [number, number][]) => keys(p, list);
        const wind = k1([[0, 0], [0.26, 1], [0.38, 0], [1, 0]]);
        const reach = k1([[0, 0], [0.28, 0], [0.42, 1], [0.62, 1], [0.88, 0], [1, 0]]);
        const rootX = k1([[0, 0], [0.28, -10], [0.42, 8], [0.62, 6], [0.9, 0]]);
        const bodyX = k1([[0, 0], [0.28, -5], [0.42, 5], [0.62, 4], [0.9, 0]]);
        return add(idle(p), {
          root: {
            move: keys(p, [
              [0, [0, 0, 0]], [0.28, [0, 0.04, -0.06]], [0.42, [0, -0.01, 0.14]], [0.62, [0, 0, 0.15]], [0.9, [0, 0.01, 0.02]], [1, [0, 0, 0]],
            ] as [number, V3][]),
            rotate: [rootX, 0, 0],
          },
          body: { rotate: [bodyX, 0, 0] },
          head: { rotate: [k1([[0, 0], [0.28, 2], [0.42, -12], [0.62, -10], [0.9, 0]]), 0, 0] },
          'arm.L': { rotate: [30 * wind - 82 * reach, 8 * reach, 10 * reach] },
          'hand.L': { rotate: [-10 * reach, 0, 0] },
          'arm.R': { rotate: [30 * wind - 82 * reach, -8 * reach, -10 * reach] },
          'hand.R': { rotate: [-10 * reach, 0, 0] },
        });
      },
    });

    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.16, 1], [0.4, 0.7], [1, 0]]);
        const sq = keys(p, [[0, 0], [0.14, 1], [0.3, -0.5], [0.5, 0.2], [0.7, 0], [1, 0]]);
        return add(idle(p), {
          root: { move: [0, 0.02 * h, -0.1 * h], rotate: [-11 * h, 0, 7 * h], scale: [1 + 0.07 * sq, 1 - 0.1 * sq, 1 + 0.07 * sq] },
          body: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-8 * h, 0, -8 * h] },
          'arm.L': { rotate: [-14 * h, 0, 22 * h] },
          'hand.L': { rotate: [12 * h, 0, 0] },
          'arm.R': { rotate: [-14 * h, 0, -22 * h] },
          'hand.R': { rotate: [12 * h, 0, 0] },
        });
      },
    });

    // Death (1.6 s): a jolt, then it turns and shrinks, sinking flat into the mist. The lowest
    // point stays at the floor: the root scales about itself (0.2 above the floor).
    k.animation('death', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const f = smooth01(0.15, 0.9, p);
        const s = 1 - 0.6 * f;
        const sy = s * (1 - 0.8 * smooth01(0.4, 1, p));
        const jolt = keys(p, [[0, 0], [0.08, 1], [0.2, 0.3], [0.35, 0]]);
        const hover = HOVER0 * (1 - smooth01(0.1, 0.5, p));
        const base = idle(0);
        return add(base, {
          root: {
            move: [0, hover - HOVER0 + 0.03 * jolt - ROOT_AT[1] * (1 - sy), -0.04 * jolt],
            rotate: [-12 * jolt, 300 * f * f, 0],
            scale: [s, sy, s],
          },
          head: { rotate: [-18 * jolt, 0, 0] },
          'arm.L': { rotate: [-15 * jolt, 0, 18 * jolt + 20 * f] },
          'arm.R': { rotate: [-15 * jolt, 0, -18 * jolt - 20 * f] },
        });
      },
    });

    k.animation('taunt', {
      duration: 1.4,
      pose: (_t, p) => ({
        root: { move: [0, 0.03 + 0.012 * wave(p, 2, 0.25), 0], rotate: [0, 8 * wave(p, 1, 0.25), 8 * wave(p, 1)] },
        body: { rotate: [0, 0, -5 * wave(p, 1, 0.1)], scale: [1 + 0.03 * wave(p, 2, 0.5), 1 + 0.04 * wave(p, 2), 1 + 0.03 * wave(p, 2, 0.5)] },
        head: { rotate: [4 * wave(p, 2, 0.1), 0, -12 * wave(p, 1, 0.15)] },
        'arm.L': { rotate: [-30 + 20 * wave(p, 2, 0.25), 0, 25 + 10 * wave(p, 2)] },
        'hand.L': { rotate: [-20 + 20 * wave(p, 4), 0, 0] },
        'arm.R': { rotate: [-30 - 20 * wave(p, 2, 0.75), 0, -25 - 10 * wave(p, 2, 0.5)] },
        'hand.R': { rotate: [-20 + 20 * wave(p, 4, 0.5), 0, 0] },
      }),
    });
  },
});
