import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Poltergeist — Chibi Quest dungeon denizen (catalog `enemies/undead/poltergeist`), a small
 * grinning ghost about 0.85 m tall with four household objects orbiting it, faces +Z.
 * Target: docs/enemy-mockups/poltergeist_001.jpg. Built on the ghost rig (assets/ghost.ts).
 *
 * Role: a mischievous dungeon enemy, seen in 3D and as a 128 px sprite; the huge square-toothed
 *   grin, the big glossy eyes, and the four floating objects must read.
 * One idea: an oversized round violet head with a huge toothy grin on a short scalloped sheet,
 *   juggling a stool, a plate, a candlestick, and a book in a ring.
 * Proportions: head 0.30 to 0.855 (ellipsoid 0.3 x 0.28 x 0.28), eyes 0.63, grin 0.47, sheet 0.10
 *   to 0.42, two tiny feet reach y = 0; the ring is r 0.42 at y 0.58 to 0.80.
 * Shape language: round and soft (head, sheet, mitten hands); the squared teeth and the boxy
 *   stool and book are the hard secondary forms.
 * Palette (60/30/10): pale violet #cfc4f0 with shade #a898d8 low on the sheet; near-black eyes;
 *   cream teeth #f2ecd8; the objects carry the accents (red-brown stool, blue book, brass candle).
 * Value plan: the dark eyes and the dark grin with light teeth on the pale head are the focal point.
 * Bodies: poltergeist (head, sheet, arms, feet), eyes, glints, mouth, teeth, and per object:
 *   stool, plate, holder, candle, flame, book, pages.
 * Rig: root, body, head, arm.L/arm.R, orbit1 to orbit4 (on the root, at the ring axis; each spins
 *   about Y). Clips: idle, walk, attack, hit, death, taunt.
 */

const C = {
  body: '#cfc4f0',
  shade: '#a898d8',
  eye: '#14121a',
  mouth: '#2a2438',
  teeth: '#f2ecd8',
  wood: '#7a3a2a',
  plate: '#b8bcc4',
  wax: '#efe4c0',
  brass: '#b08a3a',
  book: '#3a4f8a',
  page: '#d8c8a0',
};

type V3 = readonly [number, number, number];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const RAD = Math.PI / 180;
const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Joints.
const ROOT_AT: V3 = [0, 0.15, 0];
const BODY_AT: V3 = [0, 0.25, 0];
const HEAD_AT: V3 = [0, 0.34, 0];
const SHOULDER: V3 = [0.17, 0.31, 0.02];
const HAND: V3 = [0.37, 0.475, 0.08];

// The ring of objects: rest angle (degrees from +Z toward +X), height, radius.
const RING_R = 0.46;
const ORBIT = [
  { ang: -55, y: 0.76 },
  { ang: 55, y: 0.66 },
  { ang: 175, y: 0.76 },
  { ang: -108, y: 0.5 },
];
const ringPoint = (i: number): V3 => {
  const o = ORBIT[i]!;
  return [RING_R * Math.sin(o.ang * RAD), o.y, RING_R * Math.cos(o.ang * RAD)];
};

export default defineAsset({
  name: 'poltergeist',
  description: 'Chibi poltergeist dungeon enemy: a big pale violet head with glossy black eyes and a huge grin of square teeth on a short scalloped sheet, with a stool, a plate, a candlestick, and a book orbiting it.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/poltergeist_001.jpg',
  variants: {
    body: { violet: C.body, mint: '#bfe8d0', peach: '#f0d0c0' },
    eyes: { black: C.eye, cyan: '#4fe8ff', red: '#ff4a4a' },
  },
  presets: {
    wisp: { body: 'mint', eyes: 'cyan' },
    imp: { body: 'peach', eyes: 'red' },
  },

  build(k) {
    const T = {
      body: k.tint('body'),
      shade: k.tint('body', { color: C.shade, follow: 1 }),
      eye: k.tint('eyes'),
    };
    k.skeleton({
      root: { at: ROOT_AT },
      body: { parent: 'root', at: BODY_AT },
      head: { parent: 'body', at: HEAD_AT, tail: [0, 0.86, 0] },
      'arm.L': { parent: 'body', at: SHOULDER, tail: HAND },
      'arm.R': { parent: 'body', at: mx(SHOULDER), tail: mx(HAND) },
      orbit1: { parent: 'root', at: [0, ORBIT[0]!.y, 0] },
      orbit2: { parent: 'root', at: [0, ORBIT[1]!.y, 0] },
      orbit3: { parent: 'root', at: [0, ORBIT[2]!.y, 0] },
      orbit4: { parent: 'root', at: [0, ORBIT[3]!.y, 0] },
    });

    // ------------------------------------------------------------------ head
    // A wide egg with a slightly flattened top and heavy cheeks.
    const HEAD_Y = 0.56;
    const headBase = sdf
      .smoothUnion(0.06, sdf.ellipsoid([0.32, 0.3, 0.28]).at(0, HEAD_Y, 0), sdf.ellipsoid([0.3, 0.2, 0.26]).at(0, 0.48, 0))
      .smoothIntersect(0.05, sdf.box([1, 0.6, 1]).at(0, 0.835 - 0.3, 0));
    const surf = (x: number, y: number): V3 => sdf.raycast(headBase, [x, y, 1], [0, 0, -1])!;
    const sunk = (p: V3, n: V3, d: number): V3 => [p[0] - n[0] * d, p[1] - n[1] * d, p[2] - n[2] * d];

    // Nose: a small smile bump.
    const noseP = surf(0, 0.53);
    const nose = sdf.ellipsoid([0.022, 0.012, 0.017]).at(noseP[0], noseP[1], noseP[2] - 0.003);

    // Eyes: big glossy ellipsoids 0.14 apart, sunk 0.02 into the head.
    const EX = 0.07;
    const EY = 0.635;
    const ER: V3 = [0.06, 0.065, 0.05];
    const eyeP = surf(EX, EY);
    const eyeC = sunk(eyeP, sdf.normalAt(headBase, eyeP), 0.02);
    const eyes = sdf.ellipsoid(ER).at(...eyeC).mirror('x', 0).bone('head');
    // A glint on the ellipsoid surface in direction d (unit-ish), sunk a little.
    const glintAt = (d: V3, r: number, inset: number, sx: number): sdf.Shape => {
      const t = 1 / Math.hypot(d[0] / ER[0], d[1] / ER[1], d[2] / ER[2]);
      const c: V3 = [eyeC[0] + d[0] * t * (1 - inset), eyeC[1] + d[1] * t * (1 - inset), eyeC[2] + d[2] * t * (1 - inset)];
      return sdf.sphere(r).at(sx * c[0], c[1], c[2]);
    };
    // Same viewer-side offset for both eyes: viewer's left is -X.
    const bigGlint = (sx: number) => glintAt([-0.45, 0.5, 0.8], 0.018, 0.02, sx);
    const smallGlint = (sx: number) => glintAt([0.5, -0.45, 0.8], 0.009, 0.02, sx);
    const mirrorOf = (mk: (sx: number) => sdf.Shape) => sdf.union(mk(1), mk(1).at(-2 * eyeC[0], 0, 0));
    const glintsW = mirrorOf(bigGlint).bone('head');
    const glintsV = mirrorOf(smallGlint).bone('head');

    // Brow ridges: shallow bumps above the eyes, the inner ends low.
    const browP = surf(EX + 0.005, EY + 0.075);
    const browC = sunk(browP, sdf.normalAt(headBase, browP), 0.004);
    const brows = sdf.ellipsoid([0.062, 0.014, 0.03]).rotateZ(16).at(...browC).mirror('x', 0);

    // The grin: wide, corners high, a rounded opening. Local y around MOUTH_Y.
    const MOUTH_Y = 0.425;
    const HW = 0.15;
    const yUp = (x: number) => 0.04 + 0.035 * (x / HW) ** 2;
    const yLo = (x: number) => -0.075 + 0.08 * (x / HW) ** 2;
    const N = 12;
    const xs = Array.from({ length: N + 1 }, (_, i) => -HW + (2 * HW * i) / N);
    const grin = profile.polygon(
      [...xs.map((x) => [x, yUp(x)] as [number, number]), ...[...xs].reverse().map((x) => [x, yLo(x)] as [number, number])],
      { smooth: false },
    );
    const z0 = surf(0, MOUTH_Y)[2];
    const mouthCut = sdf.extrude(grin, 0.16, 0.006).at(0, MOUTH_Y, z0);
    // A raised lip rim: a band around the opening, proud of the head by 8 mm.
    const lip = mouthCut.round(0.014).subtract(mouthCut).intersect(headBase.round(0.008));
    const headCarved = sdf
      .smoothUnion(0.02, headBase, nose, brows, lip)
      .smoothSubtract(0.006, mouthCut)
      .bone('head');
    const mouth = headBase.round(-0.03).intersect(mouthCut).bone('head');

    // Teeth: two rows of 8 square teeth filling the opening, following the head's curve.
    const teeth: sdf.Shape[] = [];
    const NT = 8;
    const pitch = 0.033;
    for (let i = 0; i < NT; i++) {
      const x = (i - (NT - 1) / 2) * pitch;
      const top = MOUTH_Y + yUp(x);
      const bot = MOUTH_Y + yLo(x);
      const h = Math.min(0.05, (top - bot) / 2 + 0.004);
      const z = surf(x, MOUTH_Y)[2] - 0.022;
      const size: [number, number, number] = [0.03, h, 0.024];
      teeth.push(sdf.box(size, 0.004).at(x, top + 0.004 - h / 2, z));
      teeth.push(sdf.box(size, 0.004).at(x, bot - 0.004 + h / 2, z));
    }
    const teethAll = sdf.union(...teeth).bone('head');

    // ------------------------------------------------------------------ sheet
    const bellHalf: [number, number][] = [
      [0.16, 0.42],
      [0.19, 0.34],
      [0.215, 0.26],
      [0.235, 0.19],
      [0.25, 0.13],
      [0.255, 0.09],
    ];
    const bell = [[0, 0.44], ...bellHalf, [0, 0.085], ...bellHalf.map(([u, v]) => [-u, v]).reverse()] as [number, number][];
    const rim = (x: number, z: number) => Math.min(1, Math.hypot(x, z) / 0.12);
    // The scalloped hem: a floor that rises and falls six times around (y 0.10 to 0.16).
    const hemCut = sdf
      .halfSpace([0, -1, 0], -0.13)
      .displace(0.03, (x, _y, z) => Math.cos(Math.atan2(z, x) * 6) * rim(x, z), 2.6);
    const sheet = sdf
      .revolve(profile.polygon(bell, { smooth: true }))
      .smoothIntersect(0.008, hemCut)
      .smoothSubtract(0.02, sdf.ellipsoid([0.2, 0.1, 0.2]).at(0, 0.11, 0));
    const SPLIT = 0.2;
    const sheetUpper = sheet.intersect(sdf.box([0.7, 0.4, 0.7]).at(0, SPLIT + 0.2, 0)).bone('body');
    const sheetLower = sheet.intersect(sdf.box([0.7, 0.3, 0.7]).at(0, SPLIT - 0.15, 0)).bone('root');
    const sheetAll = sdf.union(sheetUpper, sheetLower);

    // ------------------------------------------------------------------ arms
    // Stubby arms raised 40 degrees out, each ending in a fist with a thumb pointing up.
    const arm = sdf
      .smoothUnion(
        0.016,
        sdf.cone(SHOULDER, [HAND[0] - 0.03, HAND[1] - 0.025, HAND[2] - 0.005], 0.056, 0.042),
        sdf.sphere(0.045).at(...HAND),
        sdf.cone([HAND[0] - 0.006, HAND[1] + 0.03, HAND[2]], [HAND[0] - 0.006, HAND[1] + 0.085, HAND[2]], 0.022, 0.014),
      )
      .bone('arm.L');

    // ------------------------------------------------------------------ feet
    const foot = sdf
      .smoothUnion(
        0.015,
        sdf.ellipsoid([0.05, 0.04, 0.065]).at(0.078, 0.04, 0.04),
        sdf.capsule([0.078, 0.24, 0.03], [0.078, 0.06, 0.035], 0.035),
      )
      .bone('root');

    // ------------------------------------------------------------------ body
    const ghost = sdf
      .smoothUnion(0.03, headCarved, sheetAll)
      .smoothUnion(0.02, arm.mirror('x'))
      .smoothUnion(0.018, foot.mirror('x'))
      .paintWhere(sdf.box([1, 0.22, 1]).at(0, 0.07, 0), T.shade, 0.1);
    k.body('poltergeist', ghost, { color: T.body, roughness: 0.6, emissive: T.body, emissiveIntensity: 0.3, detail: 0.004, textureDensity: 1.5 });
    k.body('mouth', mouth, { color: C.mouth, roughness: 0.5, detail: 0.004 });
    k.body('teeth', teethAll, { color: C.teeth, roughness: 0.35, detail: 0.004 });
    k.body('eyes', eyes, { color: T.eye, roughness: 0.1, emissive: T.eye, emissiveIntensity: 0.9, detail: 0.004 });
    k.body('glints', glintsW, { color: '#ffffff', roughness: 0.2, emissive: '#ffffff', emissiveIntensity: 0.6, detail: 0.003 });
    k.body('glintsViolet', glintsV, { color: '#b8a0ff', roughness: 0.2, emissive: '#b8a0ff', emissiveIntensity: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ orbiting objects
    // Each is built at the origin, tilted, turned to face outward, and moved onto the ring.
    const place = (s: sdf.Shape, i: number, tilt: V3) => s.scale(1.25).rotate(...tilt).rotateY(ORBIT[i]!.ang).at(...ringPoint(i));

    // 1: a wooden stool.
    const seat = sdf.cylinder(0.062, 0.026, 0.009).at(0, 0.048, 0);
    const legs = [
      [0.048, 0.04],
      [-0.048, 0.04],
      [0.048, -0.04],
      [-0.048, -0.04],
    ].map(([x, z]) => sdf.cone([x!, 0.045, z!], [x! * 1.35, -0.062, z! * 1.35], 0.014, 0.01));
    k.body('stool', place(sdf.smoothUnion(0.008, seat, ...legs), 0, [-14, 0, 22]).bone('orbit1'), { color: C.wood, roughness: 0.8, detail: 0.004, bump: (x, y, z) => -0.001 * (0.5 + 0.5 * noise.fbm(x * 60, z * 60, y * 60, 2)) });

    // 2: a tin plate, dished, with a raised rim.
    const plateHalf: [number, number][] = [
      [0.0, 0.01],
      [0.05, 0.01],
      [0.072, 0.026],
      [0.08, 0.026],
      [0.08, 0.018],
      [0.058, 0.0],
    ];
    const plateProfile = [[0, 0.01], ...plateHalf.slice(1), [0, 0], ...plateHalf.slice(1).map(([u, v]) => [-u!, v!]).reverse()] as [number, number][];
    k.body('plate', place(sdf.revolve(profile.polygon(plateProfile)).at(0, -0.013, 0), 2, [40, 0, -14]).bone('orbit3'), { color: C.plate, roughness: 0.35, metalness: 0.6, detail: 0.004 });

    // 3: a candlestick: brass base, stem, and drip tray, a wax candle, and a small flame.
    const holder = sdf.smoothUnion(
      0.01,
      sdf.cylinder(0.046, 0.012, 0.005).at(0, -0.09, 0),
      sdf.cylinder(0.01, 0.1, 0.004).at(0, -0.04, 0),
      sdf.cylinder(0.032, 0.01, 0.004).at(0, 0.012, 0),
    );
    const candle = sdf.cylinder(0.02, 0.07, 0.006).at(0, 0.052, 0);
    const flame = sdf.ellipsoid([0.012, 0.02, 0.012]).at(0, 0.108, 0);
    const candlePose = (s: sdf.Shape) => place(s, 3, [16, 0, -28]);
    k.body('holder', candlePose(holder).bone('orbit4'), { color: C.brass, roughness: 0.4, metalness: 0.8, detail: 0.004 });
    k.body('candle', candlePose(candle).bone('orbit4'), { color: C.wax, roughness: 0.7, detail: 0.004 });
    k.body('flame', candlePose(flame).bone('orbit4'), { color: '#ff9a2a', roughness: 0.5, emissive: '#ff8a1a', emissiveIntensity: 1.6, detail: 0.003 });

    // 4: a blue book with a lighter page edge along the spine's opposite side.
    const cover = sdf.box([0.1, 0.12, 0.032], 0.006);
    const pages = sdf.box([0.104, 0.114, 0.022], 0.003).at(0.006, 0, 0);
    const bookPose = (s: sdf.Shape) => place(s, 1, [-25, 0, 30]);
    k.body('book', bookPose(cover).bone('orbit2'), { color: C.book, roughness: 0.75, detail: 0.004 });
    const spine = sdf.box([0.016, 0.124, 0.036], 0.004).at(-0.05, 0, 0);
    k.body('spine', bookPose(spine).bone('orbit2'), { color: '#d8c8a0', roughness: 0.8, detail: 0.004 });
    k.body('pages', bookPose(pages).bone('orbit2'), { color: C.page, roughness: 0.85, detail: 0.004 });

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
    /**
     * The ring: every orbit bone turns `spin` degrees about Y and bobs; `out` pushes each object
     * away from the axis (along its current direction), `drop` lowers it.
     */
    const ring = (p: number, spin: number, out = 0, drop = 0, bob = 0.02): Pose => {
      const pose: Pose = {};
      ORBIT.forEach((o, i) => {
        const a = (o.ang + spin) * RAD;
        pose[`orbit${i + 1}`] = {
          rotate: [0, spin, 0],
          move: [out * Math.sin(a), bob * wave(p, 1, i * 0.25) - drop, out * Math.cos(a)],
        };
      });
      return pose;
    };
    const idle = (p: number): Pose =>
      add(
        {
          root: { move: [0, 0.045 + 0.018 * wave(p, 1, 0.25), 0], rotate: [2 * wave(p, 1, 0.5), 0, 3 * wave(p, 1)] },
          body: { rotate: [1.5 * wave(p, 1, 0.7), 0, -2 * wave(p, 1, 0.1)] },
          head: { rotate: [2 * wave(p, 1, 0.8), 5 * wave(p, 1, 0.15), 2 * wave(p, 1, 0.2)] },
          'arm.L': { rotate: [0, 0, 8 * wave(p, 1, 0.3)] },
          'arm.R': { rotate: [0, 0, -8 * wave(p, 1, 0.35)] },
        },
        ring(p, 360 * p),
      );
    k.animation('idle', { duration: 1.6, pose: (_t, p) => idle(p) });

    k.animation('walk', {
      duration: 1.2,
      pose: (_t, p) =>
        add(
          {
            root: { move: [0, 0.07 + 0.014 * wave(p, 2, 0.25), 0], rotate: [10 + 2 * wave(p, 2), 3 * wave(p, 1, 0.1), 4 * wave(p, 1)] },
            body: { rotate: [5 + 2 * wave(p, 2, 0.2), 0, -3 * wave(p, 1, 0.2)] },
            head: { rotate: [-10 + 2 * wave(p, 2, 0.4), -3 * wave(p, 1, 0.1), 2 * wave(p, 1, 0.3)] },
            'arm.L': { rotate: [0, 20 + 6 * wave(p, 2, 0.1), -10 + 6 * wave(p, 2, 0.3)] },
            'arm.R': { rotate: [0, -20 - 6 * wave(p, 2, 0.1), 10 - 6 * wave(p, 2, 0.35)] },
          },
          ring(p, 360 * p, 0, 0, 0.025),
        ),
    });

    // Attack (0.9 s): rears back, lunges with a "boo" while the ring is flung outward and reels back.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const k1 = (list: [number, number][]) => keys(p, list);
        const boo = k1([[0, 0], [0.3, 0], [0.4, 1], [0.6, 1], [0.8, 0], [1, 0]]);
        const armUp = k1([[0, 0], [0.22, 26], [0.3, 27], [0.4, 15], [0.62, 14], [0.88, 0]]);
        const armFwd = k1([[0, 0], [0.22, 30], [0.3, 32], [0.4, 60], [0.62, 58], [0.88, 0]]);
        const out = k1([[0, 0], [0.28, -0.03], [0.45, 0.15], [0.62, 0.15], [0.9, 0], [1, 0]]);
        return add(idle(p), {
          root: {
            move: keys(p, [[0, [0, 0, 0]], [0.28, [0, 0.05, -0.06]], [0.42, [0, -0.01, 0.16]], [0.62, [0, 0, 0.17]], [0.9, [0, 0.01, 0.02]], [1, [0, 0, 0]]]),
            rotate: [k1([[0, 0], [0.28, -12], [0.42, 9], [0.62, 7], [0.9, 0]]), 0, 0],
          },
          body: { rotate: [k1([[0, 0], [0.28, -6], [0.42, 5], [0.62, 4], [0.9, 0]]), 0, 0] },
          head: { rotate: [k1([[0, 0], [0.28, 2], [0.42, -12], [0.62, -10], [0.9, 0]]), 0, 0], scale: [1 + 0.05 * boo, 1 + 0.05 * boo, 1 + 0.05 * boo] },
          'arm.L': { rotate: [0, -armFwd, armUp] },
          'arm.R': { rotate: [0, armFwd, -armUp] },
          ...ringDelta(ring(p, 360 * p, out, 0, 0.02), ring(p, 360 * p, 0, 0, 0.02)),
        });
      },
    });

    // Hit (0.45 s): knocked back and squashed, the ring jolted.
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.16, 1], [0.4, 0.7], [1, 0]]);
        const sq = keys(p, [[0, 0], [0.14, 1], [0.3, -0.5], [0.5, 0.2], [0.7, 0], [1, 0]]);
        return add(idle(p), {
          root: { move: [0, 0.02 * h, -0.1 * h], rotate: [-11 * h, 0, 7 * h], scale: [1 + 0.09 * sq, 1 - 0.12 * sq, 1 + 0.09 * sq] },
          body: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-8 * h, 0, -8 * h] },
          'arm.L': { rotate: [0, -15 * h, 20 * h] },
          'arm.R': { rotate: [0, 15 * h, -20 * h] },
          ...ringDelta(ring(p, 360 * p, 0.06 * h, 0, 0.02), ring(p, 360 * p, 0, 0, 0.02)),
        });
      },
    });

    // Death (1.6 s): a jolt, then it spins and shrinks flat while the ring drops. The lowest point
    // stays at the floor: the root scales by `sy` about its joint, so it drops by 0.15 * (1 - sy).
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
        const drop = 0.4 * smooth01(0.12, 0.7, p);
        return add(idle(0), {
          root: {
            move: [0, hover - 0.063 + 0.03 * jolt - ROOT_AT[1] * (1 - sy), -0.04 * jolt],
            rotate: [-12 * jolt, spin, 0],
            scale: [s, sy, s],
          },
          head: { rotate: [-18 * jolt, 0, 0] },
          'arm.L': { rotate: [0, -15 * jolt, 18 * jolt + 12 * f] },
          'arm.R': { rotate: [0, 15 * jolt, -18 * jolt - 12 * f] },
          ...ringDelta(ring(p, 360 * p + 540 * f, 0.08 * f, drop, 0), ring(p, 0, 0, 0, 0)),
        });
      },
    });

    // Taunt (1.4 s): arms flap in turns, the whole ghost wobbles, the ring swings faster.
    k.animation('taunt', {
      duration: 1.4,
      pose: (_t, p) =>
        add(
          {
            root: { move: [0, 0.06 + 0.02 * wave(p, 2, 0.25), 0], rotate: [0, 8 * wave(p, 1, 0.25), 9 * wave(p, 1)] },
            body: { rotate: [0, 0, -6 * wave(p, 1, 0.1)], scale: [1 + 0.03 * wave(p, 2, 0.5), 1 + 0.04 * wave(p, 2), 1 + 0.03 * wave(p, 2, 0.5)] },
            head: { rotate: [4 * wave(p, 2, 0.1), 0, -12 * wave(p, 1, 0.15)] },
            'arm.L': { rotate: [0, -25 + 15 * wave(p, 2, 0.25), 5 + 20 * wave(p, 2)] },
            'arm.R': { rotate: [0, 25 - 15 * wave(p, 2, 0.75), -5 - 20 * wave(p, 2, 0.5)] },
          },
          ring(p, 720 * p, 0.03 * wave(p, 2), 0, 0.03),
        ),
    });

    /** The orbit bones' pose `a` (already complete); `_base` is unused, kept for readable call sites. */
    function ringDelta(a: Pose, _base: Pose): Pose {
      return a;
    }
  },
});
