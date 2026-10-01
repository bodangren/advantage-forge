import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Wraith — Chibi Quest dungeon denizen (catalog `enemies/undead/wraith`, P1), a floating hooded
 * spectre about 1 m tall, faces +Z. Target: docs/enemy-mockups/wraith_001.jpg. Base: ghost.ts
 * (the floating rig, the skeleton, and the clip set).
 *
 * Role: a creeping dungeon enemy, seen in 3D and as a 128 px sprite; the big hood with its black
 *   void and two glowing eyes, the reaching bony claw, and the blue lantern must read.
 * One idea: a big soft hood on a tattered cloak that frays into ragged strips instead of legs;
 *   one thin skeletal hand reaches out, the other holds up a small rusty lantern.
 * Proportions: hood 0.49 to 1.0 (0.49 wide), void center 0.745, eyes 0.75, capelet 0.43 to 0.62,
 *   hands at 0.45, the claw reaches out to x -0.45, the lantern hangs from 0.43 to 0.22 at x 0.35;
 *   the strips touch y = 0 in the rest pose.
 * Shape language: soft and saggy cloth (round hood, lumpy cowl, drooping sleeves) against thin,
 *   sharp bones (long knuckled fingers with pointed tips) and the hard little lantern cage.
 * Palette (60/30/10): dark blue-grey felt #5c6c73, darker at the hem; matte black void #050608 (roughness 1, no highlight); pale
 *   bone #d3cbae; rusty iron #6a3a22; glowing pale blue #8fe6ff eyes, blue flame #4ab0ff (rising 0.12 m above the lantern, cyan glass glow) as the accent.
 * Value plan: the black void inside the grey hood is the strongest contrast; the two glowing eyes
 *   in it are the focal point; the lantern glow is the second accent.
 * Bodies: cloak (round hood with a soft back peak, draped cowl with vertical folds, cloth-tie knot with two 0.1 m ends, cloak, strips, sleeves), eyes (the black void),
 *   pupils (the glowing eyes), hands, lantern-frame, lantern-glass, flame (inside), flame-top (three curled tongues).
 * Rig: the ghost's root, body, head, arm.L/arm.R, tail1 to tail3 (the long trailing strip), plus
 *   hand.L, hand.R, and lantern (hanging from hand.L). The lower cloak and the strips ride the
 *   root, so the rags lag when the body leans. Clips: idle (hover bob, lantern sway), walk (float
 *   forward, leaning), attack (a reaching claw with the lantern swung forward), hit (knocked back),
 *   death (spins down and shrinks into the floor), taunt (beckoning claw, lantern swing).
 */

const C = {
  cloak: '#5c6c73',
  inner: '#121016',
  void: '#050608',
  glow: '#8fe6ff',
  glowBase: '#0d3444',
  glass: '#3aa6c4',
  bone: '#d3cbae',
  rust: '#6a3a22',
  flame: '#4ab0ff',
};

type V3 = readonly [number, number, number];
type V4 = [number, number, number, number];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
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
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** The direction `a` bent by `deg` toward `d`. */
const bendDir = (a: V3, d: V3, deg: number): V3 => norm3(add3(mul3(a, Math.cos(deg / DEG)), mul3(d, Math.sin(deg / DEG))));

// Joints.
const ROOT_AT: V3 = [0, 0.2, 0];
const BODY_AT: V3 = [0, 0.36, 0];
const HEAD_AT: V3 = [0, 0.56, 0];
const SHOULDER: V3 = [0.17, 0.5, 0.02];
const WRIST_L: V3 = [0.302, 0.45, 0.078];
// The lantern hand grips the top of the handle ring; the ring's wire runs along Z here.
const GRIP: V3 = [0.35, 0.43, 0.085];
const WRIST_R: V3 = [-0.33, 0.468, 0.105];
// The claw: pointing out to the right (-X), a little forward and down.
const A_R = norm3([-1, -0.15, 0.3]);
const CLAW: V3 = add3(WRIST_R, mul3(A_R, 0.17));
// The long trailing strip: [x, y, z, radius] from inside the back of the cloak, down to the floor,
// and curling up at its tip.
const TAIL: V4[] = [
  [0.06, 0.22, -0.14, 0.022],
  [0.1, 0.13, -0.17, 0.018],
  [0.14, 0.06, -0.22, 0.014],
  [0.18, 0.02, -0.27, 0.012],
  [0.23, 0.012, -0.3, 0.01],
  [0.27, 0.03, -0.31, 0.009],
  [0.28, 0.06, -0.3, 0.008],
];

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
  name: 'wraith',
  description:
    'Chibi wraith dungeon enemy: a floating hooded spectre in a tattered dark blue-grey cloak that frays into ragged strips, a black void face with two glowing pale-blue eyes, thin skeletal hands, and a small rusty lantern with a blue flame.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/wraith_001.jpg',
  // Color slots (the first option is the default look): the cloak, and the glow of the eyes and the
  // lantern flame. The void, the bones, and the rusty lantern stay fixed.
  variants: {
    cloak: { slate: C.cloak, dusk: '#6a6178', moss: '#5f6d5a' },
    eyes: { pale: C.glow, sickly: '#b4f06a', violet: '#b894ff' },
  },
  presets: {
    dusk: { cloak: 'dusk', eyes: 'violet' },
    bog: { cloak: 'moss', eyes: 'sickly' },
    grave: { cloak: 'slate', eyes: 'sickly' },
  },

  build(k) {
    const T = {
      cloak: k.tint('cloak'),
      hem: k.tint('cloak', -0.3),
      glow: k.tint('eyes'),
      pupil: k.tint('eyes', { color: C.glowBase, follow: 1 }),
      glass: k.tint('eyes', { color: C.glass, follow: 1 }),
      flame: k.tint('eyes', { color: C.flame, follow: 1 }),
      tie: k.tint('cloak', -0.35),
    };
    k.skeleton({
      root: { at: ROOT_AT },
      body: { parent: 'root', at: BODY_AT },
      head: { parent: 'body', at: HEAD_AT, tail: [0, 1.0, 0] },
      'arm.L': { parent: 'body', at: SHOULDER, tail: WRIST_L },
      'hand.L': { parent: 'arm.L', at: WRIST_L, tail: GRIP },
      lantern: { parent: 'hand.L', at: GRIP, tail: [GRIP[0], GRIP[1] - 0.2, GRIP[2]] },
      'arm.R': { parent: 'body', at: mx(SHOULDER), tail: WRIST_R },
      'hand.R': { parent: 'arm.R', at: WRIST_R, tail: CLAW },
      tail1: { parent: 'root', at: [TAIL[0]![0], TAIL[0]![1], TAIL[0]![2]] },
      tail2: { parent: 'tail1', at: [TAIL[2]![0], TAIL[2]![1], TAIL[2]![2]] },
      tail3: { parent: 'tail2', at: [TAIL[4]![0], TAIL[4]![1], TAIL[4]![2]], tail: [TAIL[6]![0], TAIL[6]![1], TAIL[6]![2]] },
    });

    // ------------------------------------------------------------------ hood and void
    // A big round hood with a soft peak at the back, a thick rolled rim around a tall oval opening.
    const HOOD_Y = 0.745;
    const hoodOuter = sdf.smoothUnion(
      0.09,
      // The crown: a round dome, narrower toward the neck so the back and front curve in.
      sdf.ellipsoid([0.245, 0.2, 0.22]).at(0, 0.79, -0.015),
      sdf.ellipsoid([0.2, 0.17, 0.19]).at(0, 0.67, 0.0),
      // The brim: the hood's top reaches forward over the void.
      sdf.ellipsoid([0.16, 0.07, 0.12]).at(0, 0.835, 0.095),
    );
    const opening = sdf.ellipsoid([0.15, 0.178, 0.3]).at(0, HOOD_Y + 0.005, 0.25);
    const rimBand = hoodOuter.round(0.016).smoothIntersect(0.012, opening.round(0.034));
    // A clear point at the back of the hood that hangs back and down.
    const peak = sdf.chain([[0, 0.9, -0.12, 0.08], [0, 0.85, -0.2, 0.06], [0, 0.77, -0.27, 0.042], [0, 0.69, -0.3, 0.026], [0, 0.63, -0.3, 0.012]], 0.02);
    const hood = hoodOuter.smoothUnion(0.012, rimBand).smoothSubtract(0.01, opening).smoothUnion(0.03, peak).bone('head');
    // The void: a matte black ball deep in the hood (no highlight).
    const voidShape = sdf.ellipsoid([0.165, 0.185, 0.15]).at(0, HOOD_Y, 0.005);
    const onVoid = (x: number, y: number): V3 => sdf.raycast(voidShape, [x, y, 1], [0, 0, -1])!;
    // The eyes: two tall glowing ovals a little proud of the void.
    const EYE: [number, number] = [0.037, HOOD_Y + 0.005];
    const eyeP = onVoid(EYE[0], EYE[1]);
    const eyeN = sdf.normalAt(voidShape, eyeP);
    const eyeAt: V3 = [eyeP[0] - eyeN[0] * 0.004, eyeP[1] - eyeN[1] * 0.004, eyeP[2] - eyeN[2] * 0.004];
    const pupils = facing(sdf.ellipsoid([0.0115, 0.027, 0.009]), eyeN, eyeAt).mirror('x');

    // ------------------------------------------------------------------ capelet
    // A draped cowl: it falls from the hood over the shoulders and hugs the cloak, with soft vertical
    // folds and an uneven lower edge (no flared rim).
    const capHalf: [number, number][] = [
      [0.14, 0.64],
      [0.185, 0.61],
      [0.21, 0.56],
      [0.215, 0.5],
      [0.2, 0.44],
      [0.188, 0.39],
      [0.18, 0.35],
      [0.15, 0.35],
    ];
    const capOutline = [[0, 0.66], ...capHalf, [0, 0.53], ...capHalf.map(([u, v]) => [-u, v]).reverse()] as [number, number][];
    const capRim = (x: number, z: number) => Math.min(1, Math.hypot(x, z) / 0.1);
    const capFolds = (x: number, y: number, z: number) => {
      const a = Math.atan2(x, z);
      // Six long thin ridges: sharpened cosine peaks, so the drape has ridges and shallow valleys.
      const ridge = Math.max(0, Math.cos(6 * a + 0.5 * Math.sin(2 * a)));
      return smooth01(0.67, 0.6, y) * (2 * ridge * ridge - 0.6) * capRim(x, z);
    };
    const capEdge = (x: number, _y: number, z: number) => {
      const a = Math.atan2(x, z);
      return (0.6 * Math.cos(5 * a + 1) + 0.4 * Math.cos(9 * a) - 0.9 * Math.exp(-((a / 0.45) ** 2))) * capRim(x, z);
    };
    const capelet = sdf
      .revolve(profile.polygon(capOutline, { smooth: true }))
      .displace(0.012, capFolds, 2.2)
      .smoothIntersect(0.022, sdf.halfSpace([0, -1, 0], -0.36).displace(0.01, capEdge, 2))
      .bone('body');

    // ------------------------------------------------------------------ cloak
    // A bell under the capelet, narrowing to the hem; the hem frays into pointed tatters of uneven
    // length, and the underside is hollow.
    const bellHalf: [number, number][] = [
      [0.12, 0.62],
      [0.165, 0.57],
      [0.165, 0.49],
      [0.155, 0.41],
      [0.145, 0.32],
      [0.135, 0.23],
      [0.13, 0.14],
      [0.128, 0.08],
    ];
    const bell = [[0, 0.64], ...bellHalf, [0, 0.06], ...bellHalf.map(([u, v]) => [-u, v]).reverse()] as [number, number][];
    const N = 9;
    const angU = (x: number, z: number) => {
      const a = Math.atan2(x, z);
      return (N * a) / TAU + 0.5 + 0.12 * Math.sin(3 * a);
    };
    const rim = (x: number, z: number) => Math.min(1, Math.hypot(x, z) / 0.1);
    const lobeLen = (i: number) => 0.6 + 0.4 * noise.random(((i % N) + N) % N, 3, 7);
    // -1 at the tip of a tatter (low), +1 at the notch between two tatters (high).
    const hemFn = (x: number, _y: number, z: number) => {
      const u = angU(x, z);
      const i = Math.floor(u);
      const s = Math.abs(2 * (u - i) - 1);
      return (1 - 2 * lobeLen(i) * (1 - s)) * rim(x, z);
    };
    const folds = (x: number, y: number, z: number) => smooth01(0.45, 0.15, y) * Math.cos(TAU * angU(x, z)) * rim(x, z);
    const cloakShape = sdf
      .revolve(profile.polygon(bell, { smooth: true }))
      .displace(0.012, folds, 2)
      .smoothIntersect(0.006, sdf.halfSpace([0, -1, 0], -0.19).displace(0.08, hemFn, 3.5))
      .smoothSubtract(0.02, sdf.ellipsoid([0.1, 0.12, 0.1]).at(0, 0.1, 0));
    const SPLIT = 0.3;
    const cloakUpper = cloakShape.intersect(sdf.box([0.8, 0.5, 0.8]).at(0, SPLIT + 0.25, 0)).bone('body');
    const cloakLower = cloakShape.intersect(sdf.box([0.8, 0.4, 0.8]).at(0, SPLIT - 0.2, 0)).bone('root');
    // A hard union: a smooth one would swell a ridge along the split.
    const cloak = sdf.union(cloakUpper, cloakLower);

    // Ragged strips hanging from the tatters: [radius, y, angle offset, thickness] in polar terms.
    const polar = (a0: number, pts: [number, number, number, number][]): V4[] =>
      pts.map(([r0, y, da, rad]) => {
        const r = r0 - 0.03 * smooth01(0.02, 0.2, y);
        return [r * Math.sin(a0 + da), y, r * Math.cos(a0 + da), rad];
      });
    // The long strips hang nearly straight and end on the floor; a strip that ran out along the
    // floor and curled up read as a tentacle.
    const long = (tw: number): [number, number, number, number][] => [
      [0.15, 0.24, 0, 0.013],
      [0.16, 0.15, 0.08 * tw, 0.011],
      [0.168, 0.08, 0.15 * tw, 0.009],
      [0.175, 0.03, 0.2 * tw, 0.008],
      [0.18, 0.008, 0.22 * tw, 0.007],
    ];
    const short = (tw: number): [number, number, number, number][] => [
      [0.15, 0.24, 0, 0.013],
      [0.165, 0.15, 0.12 * tw, 0.0105],
      [0.178, 0.09, 0.3 * tw, 0.0085],
      [0.186, 0.05, 0.2 * tw, 0.007],
    ];
    // Flat ribbons: wide around the cloak, thin outward.
    const ribbon = (a0: number, pts: [number, number, number, number][]) =>
      sdf.chain(polar(0, pts), 0.012).scale([2.4, 1, 0.8]).rotateY(a0 * DEG);
    const strips = sdf
      .union(
        ribbon(0.02, long(0.3)),
        ribbon(-0.8, long(-0.35)),
        ribbon(0.75, short(0.1)),
        ribbon(-1.7, short(-0.1)),
        ribbon(1.85, long(0.3)),
        ribbon(-2.55, short(-0.08)),
      )
      .bone('root');
    const P = (i: number) => TAIL[i]!;
    const tail = sdf.smoothUnion(
      0.012,
      sdf.chain([P(0), P(1), P(2)], 0.015).bone('tail1'),
      sdf.chain([P(2), P(3), P(4)], 0.01).bone('tail2'),
      sdf.chain([P(4), P(5), P(6)], 0.008).bone('tail3'),
    );

    // The tie knot under the hood and its two hanging cords, on the front of the capelet and cloak.
    const front = sdf.union(capelet, cloakShape);
    const surfZ = (x: number, y: number) => sdf.raycast(front, [x, y, 1], [0, 0, -1])![2];
    const KNOT_Y = 0.525;
    const kz = surfZ(0, KNOT_Y);
    // The knot: a ball at the throat with two round cords that hang 0.15 m down the chest.
    const cord = (side: 1 | -1, xs: number[]) =>
      sdf.chain(
        xs.map((x, i): V4 => {
          const y = KNOT_Y - 0.01 - i * 0.03;
          return [side * x, y, surfZ(side * x, y) + 0.013, 0.0105 - 0.0003 * i];
        }),
        0.01,
      );
    const knot = sdf
      .smoothUnion(0.008, sdf.sphere(0.0195).at(0, KNOT_Y, kz + 0.012), cord(1, [0.008, 0.014, 0.012, 0.02, 0.016, 0.022]), cord(-1, [0.008, 0.01, 0.018, 0.013, 0.02, 0.014]))
      .bone('body');

    // ------------------------------------------------------------------ sleeves
    // Wide drooping sleeves with hollow cuffs and a rag hanging from each.
    const sleeve = (end: V3, droop: V3, tat: V4[], side: 1 | -1, bone: string) =>
      sdf
        .smoothUnion(
          0.03,
          sdf.cone(side === 1 ? SHOULDER : mx(SHOULDER), end, 0.075, 0.058),
          sdf.ellipsoid([0.055, 0.06, 0.05]).at(...droop),
          sdf.chain(tat, 0.012),
        )
        .smoothSubtract(0.01, sdf.sphere(0.04).at(end[0] + side * 0.03, end[1], end[2] + 0.012))
        .bone(bone);
    const sleeveL = sleeve(
      [0.272, 0.455, 0.065],
      [0.232, 0.428, 0.045],
      [
        [0.232, 0.41, 0.05, 0.016],
        [0.238, 0.35, 0.055, 0.012],
        [0.23, 0.3, 0.05, 0.009],
      ],
      1,
      'arm.L',
    );
    const sleeveR = sleeve(
      [-0.3, 0.472, 0.094],
      [-0.24, 0.445, 0.062],
      [
        [-0.25, 0.42, 0.07, 0.016],
        [-0.268, 0.34, 0.08, 0.012],
        [-0.285, 0.26, 0.075, 0.01],
        [-0.295, 0.2, 0.06, 0.008],
      ],
      -1,
      'arm.R',
    );

    // ------------------------------------------------------------------ cloak body
    const cloth = sdf
      .smoothUnion(0.035, hood, capelet)
      .smoothUnion(0.025, cloak)
      .smoothUnion(0.025, sleeveL, sleeveR)
      .smoothUnion(0.014, strips)
      .smoothUnion(0.014, tail)
      .paintWhere(opening.round(0.006).intersect(sdf.box([0.6, 0.4, 0.7]).at(0, 0.8, 0.1)), C.inner, 0.006)
      .paintWhere(sdf.box([1.2, 0.3, 1.2]).at(0, 0, 0), T.hem, 0.12);
    k.body('cloak', cloth, {
      color: T.cloak,
      roughness: 0.92,
      detail: 0.0045,
      textureDensity: 1.2,
      // Felted wool: a fine fuzzy grain in the normal map.
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 80, y * 80, z * 80, 2),
    });
    k.body('tie', knot, { color: T.tie, roughness: 0.92, detail: 0.003, bone: 'body' });
    k.body('eyes', voidShape.bone('head'), { color: C.void, roughness: 1, metalness: 0, bone: 'head' });
    k.body('pupils', pupils.bone('head'), { color: T.pupil, roughness: 0.3, emissive: T.glow, emissiveIntensity: 1.6, detail: 0.003, bone: 'head' });

    // ------------------------------------------------------------------ hands
    // The claw: a bony palm and four long knuckled fingers curling down to sharp tips, a thumb in
    // front.
    // The palm faces down and forward; the fingers fan from the index (top) to the little finger
    // and curl down and forward like a claw.
    const D0: V3 = norm3([0.1, -0.75, 0.65]);
    const D_R = norm3(add3(D0, mul3(A_R, -(D0[0] * A_R[0] + D0[1] * A_R[1] + D0[2] * A_R[2]))));
    const S_R = norm3(cross3(D_R, A_R));
    const clawParts: sdf.Shape[] = [sdf.sphere(0.022).at(...add3(WRIST_R, mul3(A_R, 0.006)))];
    for (let i = 0; i < 4; i++) {
      const o = i - 1.5;
      const knuckle = add3(add3(WRIST_R, mul3(A_R, 0.066)), add3(mul3(S_R, o * 0.026), mul3(D_R, 0.003)));
      clawParts.push(sdf.cone(add3(WRIST_R, mul3(S_R, o * 0.008)), knuckle, 0.011, 0.0105));
      const fa = norm3(add3(A_R, mul3(S_R, o * 0.22)));
      const len = [0.85, 1, 0.97, 0.78][i]!;
      const curl = [0, 4, 8, 14][i]!;
      clawParts.push(
        bonyFinger(
          knuckle,
          [bendDir(fa, D_R, 10 + curl), bendDir(fa, D_R, 38 + curl), bendDir(fa, D_R, 70 + curl)],
          [0.06 * len, 0.05 * len, 0.04 * len],
          [0.015, 0.013, 0.011, 0.005],
        ),
      );
    }
    const thumbBase = add3(add3(WRIST_R, mul3(A_R, 0.022)), mul3(S_R, -0.03));
    const thumbDir = norm3(add3(add3(mul3(A_R, 0.55), mul3(S_R, -0.65)), mul3(D_R, 0.25)));
    clawParts.push(bonyFinger(thumbBase, [bendDir(thumbDir, D_R, 10), bendDir(thumbDir, D_R, 45)], [0.042, 0.036], [0.014, 0.012, 0.005]));
    const claw = sdf.smoothUnion(0.006, ...clawParts).bone('hand.R');

    // The lantern hand: four bony fingers wrapped over and around the handle wire, a thumb in front.
    const G = GRIP;
    const fistParts: sdf.Shape[] = [sdf.sphere(0.017).at(...WRIST_L)];
    for (let i = 0; i < 4; i++) {
      const z = G[2] + (i - 1.5) * 0.0165;
      const ring = (deg: number, r: number, rad: number): V4 => [G[0] + r * Math.cos(deg / DEG), G[1] + r * Math.sin(deg / DEG), z, rad];
      const k0 = ring(150, 0.03, 0.0095);
      fistParts.push(sdf.cone([WRIST_L[0], WRIST_L[1], WRIST_L[2] + (i - 1.5) * 0.006], [k0[0], k0[1], k0[2]], 0.0085, 0.008));
      fistParts.push(sdf.chain([k0, ring(95, 0.021, 0.0095), ring(35, 0.019, 0.009), ring(-25, 0.018, 0.0085), ring(-60, 0.016, 0.0075)], 0.004));
    }
    fistParts.push(
      sdf.chain(
        [
          [WRIST_L[0] + 0.004, WRIST_L[1] - 0.008, WRIST_L[2] + 0.02, 0.0095],
          [G[0] - 0.012, G[1] - 0.012, G[2] + 0.038, 0.0085],
          [G[0] + 0.004, G[1] - 0.016, G[2] + 0.04, 0.007],
        ],
        0.004,
      ),
    );
    const fist = sdf.smoothUnion(0.006, ...fistParts).bone('hand.L');
    k.body('hands', sdf.union(claw, fist), { color: C.bone, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ lantern
    // A small rusty cage lantern hanging from its ring handle: a cone roof, a top band, four bowed
    // bars around a glowing glass, a bottom band and a foot; a blue flame burns inside.
    const [gx, gy, gz] = GRIP;
    const L = (d: number): V3 => [gx, gy - d, gz];
    const bars = [0, 1, 2, 3].map((j) => {
      const a = ((j + 0.5) * Math.PI) / 2;
      const at = (r: number, d: number, rad: number): V4 => [gx + r * Math.sin(a), gy - d, gz + r * Math.cos(a), rad];
      return sdf.chain([at(0.044, 0.08, 0.006), at(0.053, 0.13, 0.006), at(0.046, 0.18, 0.006)], 0.004);
    });
    const lanternFrame = sdf.smoothUnion(
      0.003,
      sdf.torus(0.03, 0.005).rotateZ(90).at(gx, gy - 0.03, gz),
      sdf.revolve(profile.polygon([[-0.047, 0], [0.047, 0], [0.013, 0.032], [-0.013, 0.032]])).at(...L(0.072)),
      sdf.cylinder(0.05, 0.014, 0.003).at(...L(0.077)),
      ...bars,
      sdf.cylinder(0.052, 0.016, 0.003).at(...L(0.186)),
      sdf.cylinder(0.042, 0.014, 0.003).at(...L(0.2)),
    );
    k.body('lantern-frame', lanternFrame, { color: C.rust, roughness: 0.75, metalness: 0.35, detail: 0.003, bone: 'lantern' });
    k.body('lantern-glass', sdf.cylinder(0.035, 0.1, 0.012).at(...L(0.13)), {
      color: T.glass,
      roughness: 0.1,
      opacity: 0.55,
      emissive: T.glass,
      emissiveIntensity: 0.9,
      detail: 0.003,
      bone: 'lantern',
    });
    const flame = sdf.chain(
      [
        [gx, gy - 0.168, gz, 0.017],
        [gx, gy - 0.146, gz, 0.019],
        [gx + 0.004, gy - 0.118, gz, 0.012],
        [gx - 0.003, gy - 0.096, gz, 0.005],
      ],
      0.01,
    );
    k.body('flame', flame, { color: T.flame, roughness: 0.3, emissive: T.flame, emissiveIntensity: 1.2, detail: 0.003, bone: 'lantern' });
    // The blue flame rises about 0.08 m above the lantern roof, outboard of the gripping fingers:
    // a tall curled tongue and two short ones.
    const fx = gx;
    const fy = gy - 0.045;
    const tongue = (pts: V4[]) => sdf.chain(pts.map(([x, y, z, r]): V4 => [fx + x, fy + y, gz + z, r]), 0.008);
    const flameTop = sdf.smoothUnion(
      0.012,
      tongue([[0, 0, 0, 0.02], [0.002, 0.04, 0, 0.018], [-0.006, 0.08, 0, 0.013], [-0.016, 0.108, 0.002, 0.008], [-0.012, 0.128, 0.002, 0.004]]),
      tongue([[0, 0, 0, 0.016], [0.014, 0.03, 0.004, 0.013], [0.026, 0.06, 0.004, 0.009], [0.026, 0.085, 0.004, 0.004]]),
      tongue([[0, 0, 0, 0.015], [-0.014, 0.025, -0.004, 0.012], [-0.028, 0.05, -0.004, 0.008], [-0.034, 0.07, -0.004, 0.004]]),
    );
    k.body('flame-top', flameTop, { color: T.flame, roughness: 0.3, emissive: T.flame, emissiveIntensity: 1.2, detail: 0.003, bone: 'lantern' });

    // ------------------------------------------------------------------ animation
    const { wave, keys } = motion;
    type BP = { rotate?: V3; move?: V3; scale?: V3 };
    type Pose = Record<string, BP>;
    const addV = (a: V3 | undefined, b: V3 | undefined): V3 | undefined =>
      a && b ? [a[0] + b[0], a[1] + b[1], a[2] + b[2]] : (a ?? b);
    const mulV = (a: V3 | undefined, b: V3 | undefined): V3 | undefined =>
      a && b ? [a[0] * b[0], a[1] * b[1], a[2] * b[2]] : (a ?? b);
    /** The sum of two poses: rotations and moves add, scales multiply. */
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
    /** Idle: a slow hover bob, a gentle sway, the claw flexing, the lantern swaying, the rag swishing. */
    const idle = (p: number): Pose => ({
      root: { move: [0, 0.045 + 0.018 * wave(p, 1, 0.25), 0], rotate: [2 * wave(p, 1, 0.5), 0, 3 * wave(p, 1)] },
      body: { rotate: [1.5 * wave(p, 1, 0.7), 0, -2 * wave(p, 1, 0.1)] },
      head: { rotate: [2 * wave(p, 1, 0.8), 5 * wave(p, 1, 0.15), 2 * wave(p, 1, 0.2)] },
      'arm.L': { rotate: [0, 0, 6 * wave(p, 1, 0.3)] },
      'hand.L': { rotate: [0, 0, -3 * wave(p, 1, 0.3)] },
      lantern: { rotate: [-2 * wave(p, 1, 0.6), 0, -3 * wave(p, 1, 0.3) - wave(p, 1) + 3 * wave(p, 1, 0.55)] },
      'arm.R': { rotate: [0, 4 * wave(p, 1, 0.1), -7 * wave(p, 1, 0.35)] },
      'hand.R': { rotate: [0, 0, 8 * wave(p, 1, 0.55)] },
      tail1: { rotate: [4 * wave(p, 1, 0.2), 10 * wave(p, 1, 0.1), 0] },
      tail2: { rotate: [6 * wave(p, 1, 0.35), 14 * wave(p, 1, 0.25), 0] },
      tail3: { rotate: [8 * wave(p, 1, 0.5), 18 * wave(p, 1, 0.4), 0] },
    });
    k.animation('idle', { duration: 1.6, pose: (_t, p) => idle(p) });

    // Walk: floating forward, leaning into it, the rags lagging, the claw swept back, the lantern
    // trailing a little behind, the long rag streaming.
    k.animation('walk', {
      duration: 1.2,
      pose: (_t, p) => ({
        root: { move: [0, 0.07 + 0.014 * wave(p, 2, 0.25), 0], rotate: [12 + 2 * wave(p, 2), 3 * wave(p, 1, 0.1), 4 * wave(p, 1)] },
        body: { rotate: [6 + 2 * wave(p, 2, 0.2), 0, -3 * wave(p, 1, 0.2)] },
        head: { rotate: [-12 + 2 * wave(p, 2, 0.4), -3 * wave(p, 1, 0.1), 2 * wave(p, 1, 0.3)] },
        'arm.L': { rotate: [0, 10 + 4 * wave(p, 2, 0.1), -8 + 4 * wave(p, 2, 0.3)] },
        lantern: { rotate: [-8 + 8 * wave(p, 2, 0.35), 0, 6 + 4 * wave(p, 1, 0.3)] },
        'arm.R': { rotate: [0, -28 - 6 * wave(p, 2, 0.1), 12 - 6 * wave(p, 2, 0.35)] },
        'hand.R': { rotate: [0, 0, 12 + 5 * wave(p, 2, 0.5)] },
        tail1: { rotate: [-14 + 4 * wave(p, 1, 0.2), 14 * wave(p, 1, 0.1), 0] },
        tail2: { rotate: [-8 + 6 * wave(p, 1, 0.35), 18 * wave(p, 1, 0.25), 0] },
        tail3: { rotate: [8 * wave(p, 1, 0.5), 24 * wave(p, 1, 0.4), 0] },
      }),
    });

    // Attack (0.9 s): it rears back with the claw pulled back and open and the lantern swung back
    // (0 to 0.28), lunges with the claw reaching forward and closing and the lantern swung forward
    // (0.3 to 0.45), holds it (to 0.62), and floats back to the hover. The first and last frames
    // are idle frames.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const T3 = (list: [number, V3][]) => keys(p, list);
        const k1 = (list: [number, number][]) => keys(p, list);
        const wind = k1([[0, 0], [0.26, 1], [0.38, 0], [1, 0]]);
        const reach = k1([[0, 0], [0.28, 0], [0.42, 1], [0.62, 1], [0.88, 0], [1, 0]]);
        const swing = k1([[0, 0], [0.3, 0], [0.47, 1], [0.64, 0.85], [0.92, 0], [1, 0]]);
        const rootX = k1([[0, 0], [0.28, -12], [0.42, 9], [0.62, 7], [0.9, 0]]);
        const bodyX = k1([[0, 0], [0.28, -6], [0.42, 5], [0.62, 4], [0.9, 0]]);
        return add(idle(p), {
          root: {
            move: T3([[0, [0, 0, 0]], [0.28, [0, 0.05, -0.06]], [0.42, [0, -0.01, 0.16]], [0.62, [0, 0, 0.17]], [0.9, [0, 0.01, 0.02]], [1, [0, 0, 0]]]),
            rotate: [rootX, 0, 0],
          },
          body: { rotate: [bodyX, 0, 0] },
          // The hood stays level at the lunge, so the eyes stay on the target.
          head: { rotate: [k1([[0, 0], [0.28, 2], [0.42, -12], [0.62, -10], [0.9, 0]]), 0, 0] },
          'arm.R': { rotate: [0, -25 * wind + 55 * reach, -18 * wind - 8 * reach] },
          'hand.R': { rotate: [0, 0, -25 * wind + 35 * reach] },
          'arm.L': { rotate: [0, 18 * wind - 30 * reach, 4 * wind + 8 * reach] },
          lantern: { rotate: [-0.7 * (rootX + bodyX) + 30 * wind - 60 * swing, 0, 8 * reach] },
          tail1: { rotate: [-20 * reach, 0, 0] },
          tail2: { rotate: [-10 * reach, 20 * wind, 0] },
          tail3: { rotate: [10 * wind, 30 * reach, 0] },
        });
      },
    });

    // Hit (0.45 s): knocked back and up, squashed for a moment, the claw flung open, the lantern and
    // the rag whipping; then it bobs back into the hover.
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.16, 1], [0.4, 0.7], [1, 0]]);
        const sq = keys(p, [[0, 0], [0.14, 1], [0.3, -0.5], [0.5, 0.2], [0.7, 0], [1, 0]]);
        const whip = (d: number, a: number) => a * keys(p, [[0, 0], [0.12 + d, 1], [0.32 + d, -0.6], [0.6 + d, 0.2], [1, 0]]);
        return add(idle(p), {
          root: { move: [0, 0.02 * h, -0.1 * h], rotate: [-11 * h, 0, 7 * h], scale: [1 + 0.07 * sq, 1 - 0.1 * sq, 1 + 0.07 * sq] },
          body: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-8 * h, 0, -8 * h] },
          'arm.L': { rotate: [0, -12 * h, 14 * h] },
          'hand.L': { rotate: [0, 0, -8 * h] },
          lantern: { rotate: [whip(0.04, 28), 0, whip(0.08, -14)] },
          'arm.R': { rotate: [0, 15 * h, -20 * h] },
          'hand.R': { rotate: [0, 0, -22 * h] },
          tail1: { rotate: [0, whip(0, 25), 0] },
          tail2: { rotate: [0, whip(0.06, -35), 0] },
          tail3: { rotate: [0, whip(0.12, 45), 0] },
        });
      },
    });

    // Death (1.6 s): a jolt, then it spins faster and faster while it shrinks to a quarter of its
    // size and melts flat into the floor. It stops at a quarter (and about 2 cm high): the sprite
    // framer treats a mesh that some clip shrinks below 5 mm as a hidden effect part. The lowest
    // point stays at the floor: the wraith scales by `sy` about the root (0.2 above its lowest
    // point), so the root drops by 0.2 * (1 - sy).
    k.animation('death', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const f = smooth01(0.15, 0.9, p);
        const s = 1 - 0.75 * f;
        const sy = s * (1 - 0.92 * smooth01(0.55, 1, p));
        const jolt = keys(p, [[0, 0], [0.08, 1], [0.2, 0.3], [0.35, 0]]);
        const hover = 0.063 * (1 - smooth01(0.1, 0.5, p));
        const spin = 900 * f * f;
        const base = idle(0);
        return add(base, {
          root: {
            move: [0, hover - 0.063 + 0.03 * jolt - ROOT_AT[1] * (1 - sy), -0.04 * jolt],
            rotate: [-12 * jolt, spin, 0],
            scale: [s, sy, s],
          },
          head: { rotate: [-18 * jolt, 0, 0] },
          'arm.L': { rotate: [0, -15 * jolt, 18 * jolt - 10 * f] },
          lantern: { rotate: [20 * jolt, 0, -18 * jolt + 25 * f] },
          'arm.R': { rotate: [0, 15 * jolt, -18 * jolt + 10 * f] },
          'hand.R': { rotate: [0, 0, -15 * jolt + 30 * f] },
          tail1: { rotate: [0, 30 * f, 0] },
          tail2: { rotate: [0, 30 * f, 0] },
          tail3: { rotate: [0, 30 * f, 0] },
        });
      },
    });

    // Taunt (1.4 s): the claw beckons "come here", the lantern swings up and out in turns, and the
    // whole wraith wobbles side to side with the hood rolling the other way.
    k.animation('taunt', {
      duration: 1.4,
      pose: (_t, p) => ({
        root: { move: [0, 0.06 + 0.02 * wave(p, 2, 0.25), 0], rotate: [0, 8 * wave(p, 1, 0.25), 9 * wave(p, 1)] },
        body: { rotate: [0, 0, -6 * wave(p, 1, 0.1)], scale: [1 + 0.03 * wave(p, 2, 0.5), 1 + 0.04 * wave(p, 2), 1 + 0.03 * wave(p, 2, 0.5)] },
        head: { rotate: [4 * wave(p, 2, 0.1), 0, -12 * wave(p, 1, 0.15)] },
        'arm.L': { rotate: [0, -15 + 10 * wave(p, 2, 0.25), 8 + 12 * wave(p, 2)] },
        lantern: { rotate: [4 * wave(p, 2, 0.4), 0, -8 - 12 * wave(p, 2) + 10 * wave(p, 2, 0.2)] },
        'arm.R': { rotate: [0, 25 - 12 * wave(p, 2, 0.75), -5 - 10 * wave(p, 2, 0.5)] },
        'hand.R': { rotate: [0, 0, 15 + 22 * wave(p, 4)] },
        tail1: { rotate: [6 * wave(p, 1, 0.2), 16 * wave(p, 1, 0.1), 0] },
        tail2: { rotate: [8 * wave(p, 1, 0.35), 22 * wave(p, 1, 0.25), 0] },
        tail3: { rotate: [10 * wave(p, 1, 0.5), 28 * wave(p, 1, 0.4), 0] },
      }),
    });
  },
});
