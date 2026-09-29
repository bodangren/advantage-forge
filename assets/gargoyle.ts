import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Gargoyle — Chibi Quest dungeon construct (catalog `enemies/construct/gargoyle`), a crouching
 * winged stone demon about 0.95 m to the horn tips and 1.2 m across the raised wings, faces +Z, on
 * the imp's rig (bat wings, a three-bone tail, shins and feet). Target:
 * docs/enemy-mockups/gargoyle_001.jpg (the stone base in the mockup is not part of the asset).
 *
 * Role: a wall-guardian enemy, seen in 3D and as a 128 px sprite; the horns, the raised wings, the
 *   yellow eyes, and the toothy grin must read.
 * One idea: a hunched little stone demon, all head and claws: wide horned head, a huge fanged grin,
 *   long arms hanging to the floor, and big wings held up like a cloak of slabs.
 * Shape language: heavy round masses (head, thighs, shoulders) with many carved points (horns, ears,
 *   crest, teeth, claws, wing ribs, tail spade).
 * Palette (60/30/10): stone #6f7378 with lit #8b8f94 and shade #4e5257; moss #5a6a48 stains in the
 *   crevices; yellow #ffd23a eyes in dark sockets as the accent; white teeth on a dark mouth.
 * Value plan: the glowing eyes and the white teeth on the dark mouth are the focal point; the
 *   lighter horns and wing ribs frame the head.
 * Bodies: head, body (both stone), horns, wings (membranes, ribs), claws, eyes, teeth, tongue.
 * Rig: the imp's hips, spine, chest, neck, head, wings, arms, legs with shins and feet, and a
 *   three-bone tail. Clips: idle (breathes, wings fold a little), fly, attack (a lunge with both
 *   claws), hit, death (it crumbles and shrinks).
 */

const C = {
  stone: '#5a5e64',
  lit: '#767a80',
  shade: '#3e4248',
  membrane: '#4a4e54',
  moss: '#4a5a3c',
  eye: '#ffd23a',
  socket: '#1c1d21',
  tooth: '#e8e2d0',
  mouth: '#2a1a1a',
  tongue: '#5a2626',
  claw: '#2e3136',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const mixc = (a: readonly number[], b: readonly number[], t: number) => [a[0]! + (b[0]! - a[0]!) * t, a[1]! + (b[1]! - a[1]!) * t, a[2]! + (b[2]! - a[2]!) * t] as const;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const HEAD_C: V3 = [0, 0.63, 0.09];
const HEAD = [0.14, 0.115, 0.115] as const;
// Joints: hunched chest, long arms hanging to the floor, short bent legs.
const SHOULDER: V3 = [0.17, 0.5, 0.0];
const ELBOW: V3 = [0.22, 0.33, 0.05];
const WRIST: V3 = [0.22, 0.12, 0.1];
const HIP: V3 = [0.11, 0.28, -0.02];
const KNEE: V3 = [0.15, 0.18, 0.09];
const ANKLE: V3 = [0.13, 0.06, 0.04];
const WING_ROOT: V3 = [0.09, 0.5, -0.1];
const HIPS_AT: V3 = [0, 0.28, -0.02];
const TAIL: V3[] = [
  [0, 0.27, -0.1],
  [-0.09, 0.15, -0.19],
  [-0.27, 0.17, -0.15],
  [-0.4, 0.36, -0.07],
];
const WING_RZ = 0; // the wing is modeled raised, like the mockup
const WING_RY = 14; // swept back a little

/** A stone claw hand at the wrist `w`: the fingers hang down and forward; `s` mirrors it. */
const clawHand = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  const finger = (dx: number) =>
    sdf.chain(
      [
        [...o(dx * 0.6, -0.03, 0.02), 0.014],
        [...o(dx, -0.065, 0.04), 0.012],
        [...o(dx * 1.1, -0.085, 0.06), 0.01],
      ],
      0.005,
    );
  return {
    hand: sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.045, 0.04, 0.038]).at(...o(0, -0.02, 0.01)),
      finger(-0.03),
      finger(0),
      finger(0.03),
      sdf.cone(o(0.04, -0.01, 0.0), o(0.06, -0.05, 0.035), 0.014, 0.009), // thumb
    ),
    claws: sdf.union(
      ...[-0.03, 0, 0.03].map((dx) => sdf.cone(o(dx * 1.1, -0.085, 0.06), o(dx * 1.15, -0.115, 0.085), 0.011, 0.002)),
      sdf.cone(o(0.06, -0.05, 0.035), o(0.075, -0.075, 0.06), 0.009, 0.002),
    ),
  };
};

/** A three-toed clawed foot at the ankle `a`, the toes flat on the floor; `s` mirrors it. */
const clawFoot = (a: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [a[0] + dx * s, a[1] + dy, a[2] + dz];
  return {
    foot: sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.05, 0.035, 0.06]).at(...o(0, -0.02, 0.02)),
      ...[-0.03, 0, 0.03].map((dx) => sdf.capsule(o(dx, -0.038, 0.05), o(dx * 1.25, -0.04, 0.115), 0.017)),
    ),
    claws: sdf.union(...[-0.03, 0, 0.03].map((dx) => sdf.cone(o(dx * 1.25, -0.04, 0.115), o(dx * 1.3, -0.036, 0.15), 0.014, 0.002))),
  };
};

export default defineAsset({
  name: 'gargoyle',
  description: 'Chibi gargoyle construct: a crouching winged stone demon with long ridged horns, big ears, yellow eyes, a wide fanged grin, long clawed arms, and a spade-tipped tail.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/gargoyle_001.jpg',
  variants: {
    stone: { grey: C.stone, sandstone: '#a08a6a', obsidian: '#2c2c32' },
    eyes: { yellow: C.eye, red: '#ff3a3a', cyan: '#4fe8ff' },
    moss: { green: C.moss, none: C.stone, rust: '#8a4a22' },
  },
  presets: {
    sandstone: { stone: 'sandstone', eyes: 'red', moss: 'none' },
    obsidian: { stone: 'obsidian', eyes: 'cyan', moss: 'rust' },
    ancient: { stone: 'grey', eyes: 'red', moss: 'green' },
  },

  build(k) {
    const T = {
      stone: k.tint('stone'),
      lit: k.tint('stone', { color: C.lit, follow: 1 }),
      shade: k.tint('stone', { color: C.shade, follow: 1 }),
      claw: k.tint('stone', { color: C.claw, follow: 1 }),
      membrane: k.tint('stone', { color: C.membrane, follow: 1 }),
      moss: k.tint('moss'),
      eye: k.tint('eyes'),
    };
    k.skeleton({
      hips: { at: HIPS_AT },
      spine: { parent: 'hips', at: [0, 0.35, 0] },
      chest: { parent: 'spine', at: [0, 0.44, 0.0] },
      neck: { parent: 'chest', at: [0, 0.52, 0.03] },
      head: { parent: 'neck', at: [0, 0.58, 0.06] },
      'wing.L': { parent: 'chest', at: WING_ROOT, tail: [0.5, 0.75, -0.25] },
      'wing.R': { parent: 'chest', at: mx(WING_ROOT), tail: [-0.5, 0.75, -0.25] },
      tail1: { parent: 'hips', at: TAIL[0]! },
      tail2: { parent: 'tail1', at: TAIL[1]! },
      tail3: { parent: 'tail2', at: TAIL[2]!, tail: TAIL[3]! },
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
    const head = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid(HEAD).at(...HEAD_C),
      pair(sdf.sphere(0.075).at(0.09, 0.56, 0.1)), // heavy cheeks
      sdf.ellipsoid([0.115, 0.06, 0.09]).at(0, 0.525, 0.115), // jaw
      pair(sdf.capsule([0.108, 0.718, 0.14], [0.022, 0.676, 0.195], 0.03)), // angry brow ridges
    );
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.smoothUnion(0.01, sdf.ellipsoid([0.03, 0.024, 0.035]).at(0, 0.62, faceZ(0, 0.62) - 0.008), sdf.cone([0, 0.628, faceZ(0, 0.628) - 0.01], [0, 0.606, faceZ(0, 0.606) + 0.022], 0.02, 0.008));
    // The brow crest: a ridged spine of five cones from the brow to the crown, rising toward the back.
    const crest = sdf.union(
      ...[
        [0.185, 0.026],
        [0.145, 0.034],
        [0.105, 0.044],
        [0.065, 0.054],
        [0.025, 0.066],
      ].map(([z, h]) => {
        const top = sdf.raycast(head, [0, 2, z!], [0, -1, 0])!;
        return sdf.cone([0, top[1] - 0.02, z!], [0, top[1] + h!, z! - 0.02], 0.024, 0.004);
      }),
    );
    // Big pointed ears, flat, swept out and up.
    const ear = sdf
      .cone([0, 0, 0], [0.24, 0, 0], 0.078, 0.004)
      .smoothSubtract(0.005, sdf.cone([0.005, 0, 0.03], [0.2, 0.004, 0.03], 0.05, 0.002))
      .scale([1, 1, 0.4])
      .rotateZ(38)
      .rotateY(15)
      .at(0.115, 0.63, 0.02);
    const ears = pair(ear);
    const mouthPocket = (() => {
      const MY = 0.565;
      return sdf
        .extrude(
          profile.polygon(
            [
              [-0.115, 0.022],
              [-0.06, 0.005],
              [0, 0.0],
              [0.06, 0.005],
              [0.115, 0.022],
              [0.098, -0.03],
              [0.05, -0.058],
              [0, -0.066],
              [-0.05, -0.058],
              [-0.098, -0.03],
            ],
            { smooth: true, samples: 3 },
          ),
          0.14,
          0.004,
        )
        .at(0, MY, 0.2);
    })();
    const MY = 0.565;
    const browBox = pair(sdf.box([0.085, 0.024, 0.05], 0.009).rotateZ(24).at(0.07, 0.695, faceZ(0.07, 0.69) - 0.012)); // a tilted, heavy brow over each eye
    const headGeo = sdf.smoothSubtract(0.004, sdf.union(head, nose, ears.bone('head')).smoothUnion(0.012, crest, browBox), mouthPocket);
    const headCut = headGeo;
    // Dark eye sockets, and the paint for the mouth.
    const EYE: V3 = [0.066, 0.655, 0];
    const eyeZ = faceZ(EYE[0], EYE[1]);
    const socket = pair(sdf.ellipsoid([0.043, 0.034, 0.06]).at(EYE[0], EYE[1], eyeZ));

    // ------------------------------------------------------------------ paint and bump
    const moss = (x: number, y: number, z: number) => clamp01((noise.fbm(x * 13 + 3, y * 13, z * 13, 3) - 0.12) * 4.5) * (y < 0.75 ? 0.9 : 0.5);
    const crack = (x: number, y: number, z: number) => Math.max(0, 1 - Math.abs(noise.fbm(x * 9 + 7, y * 9, z * 9 + 2, 2)) / 0.045);
    // The lit tops are found from the geometry: the normal's up component from the distance field.
    const stonePaint = (geo: { dist: (x: number, y: number, z: number) => number }) => (x: number, y: number, z: number, base: readonly number[]) => {
      const e = 0.004;
      const ny = (geo.dist(x, y + e, z) - geo.dist(x, y - e, z)) / (2 * e);
      let c: readonly number[] = mixc(base, rgb(T.lit), clamp01((ny - 0.25) * 1.5) * 0.85); // upward-facing surfaces catch light
      c = mixc(c, rgb(T.shade), clamp01(-ny * 1.3) * 0.7 * clamp01(1.4 - y * 1.2)); // undersides
      c = mixc(c, rgb(T.shade), clamp01(crack(x, y, z)) * 0.75); // crevices
      c = mixc(c, rgb(T.moss), moss(x, y, z) * 0.85 * clamp01(0.5 + (0.45 - y)));
      return [c[0]!, c[1]!, c[2]!] as const;
    };
    const stoneBump = (x: number, y: number, z: number) => 0.0015 * noise.fbm(x * 45, y * 45, z * 45, 3) - 0.0022 * crack(x, y, z);

    // ------------------------------------------------------------------ body, arms, legs, tail
    const torso = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.15, 0.1, 0.12]).rotateX(-18).at(0, 0.46, 0.02).bone('chest'), // hunched chest, leaning forward
      sdf.ellipsoid([0.12, 0.09, 0.1]).at(0, 0.36, 0.0).bone('spine'), // belly
      sdf.ellipsoid([0.13, 0.08, 0.1]).at(0, 0.27, -0.02).bone('hips'), // pelvis
      sdf.capsule([0, 0.5, 0.03], [0, 0.58, 0.06], 0.065).bone('neck'),
      pair(sdf.sphere(0.06).at(0.15, 0.5, 0.0)).bone('chest'), // shoulder humps
    );
    const frontZ = (y: number) => sdf.raycast(torso, [0, y, 1], [0, 0, -1])![2];
    const backZ = (y: number) => sdf.raycast(torso, [0, y, -1], [0, 0, 1])![2];
    // Carved plates: three chest bands, four smaller belly bands, and a row of spine cones.
    const chestBands = sdf.smoothUnion(0.008, ...[0.53, 0.48, 0.43].map((y) => sdf.box([0.16, 0.025, 0.03], 0.01).at(0, y, frontZ(y) - 0.012))).bone('chest');
    const bellyBands = sdf.smoothUnion(0.008, ...[0.395, 0.365, 0.335, 0.305].map((y) => sdf.box([0.12, 0.018, 0.026], 0.008).at(0, y, frontZ(y) - 0.011))).bone('spine');
    const spineCones = sdf.union(
      ...[0.54, 0.49, 0.44, 0.39, 0.34, 0.29].map((y, i) => sdf.cone([0, y, backZ(y) + 0.012], [0, y + 0.03, backZ(y) - 0.032 - 0.004 * (5 - i) * 0.3], 0.02, 0.003).bone(y > 0.42 ? 'chest' : 'spine')),
    );
    const plates = sdf.union(chestBands, bellyBands, spineCones);
    const armAt = (s: 1 | -1) => {
      const side = s > 0 ? 'L' : 'R';
      const sh = s > 0 ? SHOULDER : mx(SHOULDER);
      const el = s > 0 ? ELBOW : mx(ELBOW);
      const wr = s > 0 ? WRIST : mx(WRIST);
      const { hand } = clawHand(wr, s);
      return sdf.smoothUnion(
        0.02,
        sdf.smoothUnion(0.02, sdf.cone(sh, el, 0.058, 0.048), sdf.sphere(0.05).at(...el), sdf.ellipsoid([0.078, 0.055, 0.075]).at(sh[0] + 0.02 * s, sh[1] + 0.03, sh[2])).bone(`upperarm.${side}`), // with a raised shoulder cap
        sdf.cone(el, wr, 0.048, 0.037).bone(`forearm.${side}`),
        hand.bone(`hand.${side}`),
      );
    };
    const legAt = (s: 1 | -1) => {
      const side = s > 0 ? 'L' : 'R';
      const h = s > 0 ? HIP : mx(HIP);
      const kn = s > 0 ? KNEE : mx(KNEE);
      const an = s > 0 ? ANKLE : mx(ANKLE);
      const { foot } = clawFoot(an, s);
      return sdf.smoothUnion(
        0.02,
        sdf.smoothUnion(0.012, sdf.cone(h, kn, 0.075, 0.056), sdf.ellipsoid([0.038, 0.07, 0.045]).rotateZ(-10 * s).at(h[0] + 0.07 * s, 0.245, 0.055)).bone(`leg.${side}`), // with a thigh plate
        sdf.cone(kn, an, 0.056, 0.036).bone(`shin.${side}`),
        foot.bone(`foot.${side}`),
      );
    };
    const tailShape = sdf.smoothUnion(
      0.014,
      sdf.chain([[...TAIL[0]!, 0.035], [...TAIL[1]!, 0.026]], 0.012).bone('tail1'),
      sdf.chain([[...TAIL[1]!, 0.026], [...TAIL[2]!, 0.02]], 0.012).bone('tail2'),
      sdf.chain([[...TAIL[2]!, 0.02], [...TAIL[3]!, 0.016]], 0.012).bone('tail3'),
    );
    const tip = TAIL[3]!;
    const spade = sdf
      .extrude(
        profile.polygon(
          [
            [0, 0.07],
            [0.036, 0.018],
            [0.02, 0.0],
            [0.006, 0.01],
            [0, -0.006],
            [-0.006, 0.01],
            [-0.02, 0.0],
            [-0.036, 0.018],
          ],
          { smooth: true, samples: 3 },
        ),
        0.02,
        0.007,
      )
      .scale(1.35)
      .rotateZ(32)
      .rotateY(25)
      .at(tip[0] - 0.005, tip[1] - 0.005, tip[2])
      .bone('tail3');

    // The head keeps its own paint order: the sockets and the mouth must stay dark over the stone.
    const headBase = sdf.smoothUnion(0.02, headCut.bone('head'), torso.intersect(sdf.sphere(0.13).at(0, 0.5, 0.03)));
    const headPainted = headBase
      .paintFn(stonePaint(headBase))
      .paintWhere(socket, C.socket, 0.004)
      .paintWhere(mouthPocket.round(0.005), C.mouth, 0.004);
    k.body('head-stone', headPainted, { color: T.stone, roughness: 0.9, textureDensity: 2, detail: 0.004, bump: stoneBump });

    const bodyBase = sdf
      .smoothUnion(0.03, torso, armAt(1), armAt(-1), legAt(1), legAt(-1))
      .smoothUnion(0.014, tailShape)
      .smoothUnion(0.008, plates)
      .union(spade);
    const bodyShape = bodyBase.paintFn(stonePaint(bodyBase));
    k.body('body-stone', bodyShape, { color: T.stone, roughness: 0.9, detail: 0.006, bump: stoneBump });

    // ------------------------------------------------------------------ tongue and teeth
    const tongue = sdf.ellipsoid([0.05, 0.015, 0.04]).at(0, MY - 0.052, 0.165).bone('head');
    k.body('tongue', tongue, { color: C.tongue, roughness: 0.5, detail: 0.003 });
    const upperY = (x: number) => MY + 0.004 + 0.02 * (Math.abs(x) / 0.11) ** 2;
    const lowerY = (x: number) => MY - 0.064 + 0.04 * (Math.abs(x) / 0.1) ** 2;
    const toothZ = (x: number, y: number) => Math.max(0.145, faceZ(Math.abs(x), y) - 0.014);
    const teeth = sdf.union(
      ...[-0.078, -0.052, -0.026, 0, 0.026, 0.052, 0.078].map((x, i) => {
        const y = upperY(x);
        const z = toothZ(x, y);
        const long = Math.abs(i - 3) === 2 || Math.abs(i - 3) === 3;
        return sdf.cone([x, y + 0.006, z], [x * 0.97, y - (long ? 0.036 : 0.026), z + 0.006], long ? 0.013 : 0.011, 0.002);
      }),
      ...[-0.065, -0.039, -0.013, 0.013, 0.039, 0.065].map((x) => {
        const y = lowerY(x);
        const z = Math.max(0.145, faceZ(Math.abs(x), y - 0.012) - 0.022);
        return sdf.cone([x, y + 0.002, z], [x * 0.97, y + 0.026, z + 0.008], 0.011, 0.002);
      }),
    );
    k.body('teeth', teeth.bone('head'), { color: C.tooth, roughness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ eyes: yellow, glowing, angry
    const slant = 1.2; // the top of each eye is cut on a slant, lower toward the nose
    const eyeOne = sdf
      .ellipsoid([0.032, 0.024, 0.022])
      .at(EYE[0], EYE[1] - 0.004, eyeZ - 0.009)
      .intersect(sdf.halfSpace([-slant, 1, 0], -slant * EYE[0] + EYE[1] + 0.008));
    k.body('eyes', pair(eyeOne).bone('head'), { color: T.eye, roughness: 0.2, emissive: T.eye, emissiveIntensity: 1.0, textureDensity: 2, detail: 0.0035 });

    // ------------------------------------------------------------------ horns: long, ridged, curving out and up
    const horn = sdf.chain(
      [
        [0.08, 0.705, 0.03, 0.044],
        [0.15, 0.75, 0.02, 0.038],
        [0.205, 0.82, 0.0, 0.028],
        [0.205, 0.895, 0.0, 0.018],
        [0.175, 0.955, 0.02, 0.006],
      ],
      0.014,
    );
    const hornBump = (_x: number, y: number, _z: number) => (y < 0.93 ? 0.0028 * Math.sin(y * 170) : 0);
    k.body('horns', pair(horn.paintFn((_x, y, _z, base) => mixc(base, rgb(T.shade), Math.sin(y * 170) < -0.6 ? 0.35 : 0))).bone('head'), { color: T.lit, roughness: 0.85, bump: hornBump });

    const claws = sdf.union(
      clawHand(WRIST, 1).claws.bone('hand.L'),
      clawHand(mx(WRIST), -1).claws.bone('hand.R'),
      clawFoot(ANKLE, 1).claws.bone('foot.L'),
      clawFoot(mx(ANKLE), -1).claws.bone('foot.R'),
    );
    k.body('claws', claws, { color: T.claw, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ bat wings, stone slabs
    // Local frame: the root at the origin, the wing arm rising up and out to the top knuckle, the
    // membrane hanging below it inside the rim; three ribs run from the knuckle to the tips.
    const KNUCKLE: V3 = [0.34, 0.62, 0];
    const tipA: V3 = [0.5, -0.02, 0];
    const tipB: V3 = [0.33, -0.2, 0];
    const tipC: V3 = [0.17, -0.1, 0];
    const wingOutline = profile.polygon(
      [
        [0.03, 0.1],
        [0.17, 0.36],
        [KNUCKLE[0], KNUCKLE[1]],
        [0.44, 0.36],
        [tipA[0], tipA[1]],
        [0.42, 0.06],
        [tipB[0], tipB[1]],
        [0.25, -0.01],
        [tipC[0], tipC[1]],
        [0.1, -0.02],
      ],
      { smooth: false },
    );
    const membrane = sdf.extrude(wingOutline, 0.02, 0.006).paintFn((x, y, z, base) => {
      const c = mixc(base, rgb(T.shade), 0.12);
      const t = moss(x * 0.7, y * 0.7 - 0.2, z) * 0.8;
      return mixc(c, rgb(T.moss), t * 0.6);
    });
    // The carved rim: a thick chain along the leading edge (shoulder, arm, knuckle, outer tip) and
    // along each finger bone.
    const rib = (t: V3, r0: number, r1: number) => sdf.chain([[KNUCKLE[0], KNUCKLE[1], 0, r0], [t[0], t[1], 0, r1]], 0.006);
    const K3: V3 = KNUCKLE;
    const hook = (dx: number, dy: number, r: number) =>
      sdf.chain(
        [
          [K3[0], K3[1], 0, r],
          [K3[0] + dx * 0.55, K3[1] + dy * 0.25, 0.004, r * 0.75],
          [K3[0] + dx, K3[1] + dy * 0.7, 0.012, r * 0.45],
          [K3[0] + dx * 0.55, K3[1] + dy * 1.2, 0.018, r * 0.15],
        ],
        0.006,
      );
    const wingBones = sdf.union(
      sdf.chain([[0.02, 0.08, 0, 0.04], [0.17, 0.36, 0, 0.033], [KNUCKLE[0], KNUCKLE[1], 0, 0.028]], 0.012),
      sdf.sphere(0.042).at(...KNUCKLE),
      rib(tipA, 0.028, 0.022), // the thick outer rim
      rib(tipB, 0.022, 0.022),
      rib(tipC, 0.022, 0.022),
      hook(0.11, 0.07, 0.026), // a hooked claw at the elbow
      hook(-0.09, 0.06, 0.022), // its twin, pointing in
    );
    const wingPose = (s: sdf.Shape) => s.rotateY(WING_RY).at(...WING_ROOT);
    const wingBump = (x: number, y: number, z: number) => 0.0015 * noise.fbm(x * 40, y * 40, z * 40, 3) - 0.002 * crack(x, y, z);
    k.body('wing-membranes', pair(wingPose(membrane).bone('wing.L')), { color: T.membrane, roughness: 0.9, detail: 0.006, bump: wingBump });
    k.body('wing-bones', pair(wingPose(wingBones).bone('wing.L')), { color: T.stone, roughness: 0.85, detail: 0.006, bump: wingBump });

    // ------------------------------------------------------------------ animation
    const { wave, keys, reach, quat, euler } = motion;
    const ease = (a: number, b: number, x: number) => {
      const t = clamp01((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
    // A wing pose is three angles relative to the raised rest pose: `raise` (Z, tip up), `fwd`
    // (Y, tip forward), and `twist` about the wing's span. The right wing mirrors the left.
    type WingAngles = { raise: number; fwd: number; twist: number };
    const restWing = quat([0, 0, WING_RZ]).multiply(quat([0, WING_RY, 0]));
    const restWingInv = restWing.clone().invert();
    const wings = ({ raise, fwd, twist }: WingAngles) => {
      const q = quat([0, 0, raise]).multiply(quat([0, -fwd, 0])).multiply(restWing).multiply(quat([twist, 0, 0])).multiply(restWingInv);
      const r = euler(q);
      return { 'wing.L': { rotate: r }, 'wing.R': { rotate: [r[0], -r[1], -r[2]] as typeof r } };
    };
    const flap = (u: number, amp: number, lift: number): WingAngles => {
      const w = Math.sin(2 * Math.PI * u);
      const c = Math.cos(2 * Math.PI * u);
      return { raise: lift + amp * w, fwd: -15 - 20 * (0.966 * w + 0.259 * c), twist: -15 - 15 * (-0.766 * w + 0.643 * c) };
    };
    const mixWing = (a: WingAngles, b: WingAngles, t: number): WingAngles => ({
      raise: a.raise + (b.raise - a.raise) * t,
      fwd: a.fwd + (b.fwd - a.fwd) * t,
      twist: a.twist + (b.twist - a.twist) * t,
    });
    // Idle: the wings fold in a little and open again as the chest breathes.
    const idleWing = (p: number): WingAngles => ({ raise: 12 - 6 * wave(p, 1, 0.25), fwd: 4 + 3 * wave(p, 1, 0.25), twist: 0 });

    k.animation('idle', {
      duration: 1.8,
      pose: (_t, p) => ({
        hips: { move: [0, 0.006 * wave(p, 1, 0.25), 0], rotate: [2 * wave(p, 1, 0.25), 0, 0] },
        chest: { rotate: [-3 * wave(p, 1, 0.25), 0, 0] },
        head: { rotate: [2 * wave(p, 1, 0.35), 8 * wave(p, 1, 0.1), 0] },
        ...wings(idleWing(p)),
        tail1: { rotate: [4 * wave(p, 1, 0.2), 8 * wave(p, 1, 0.1), 0] },
        tail2: { rotate: [5 * wave(p, 1, 0.35), 10 * wave(p, 1, 0.25), 0] },
        tail3: { rotate: [6 * wave(p, 1, 0.5), 12 * wave(p, 1, 0.4), 0] },
        'upperarm.L': { rotate: [-2 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.R': { rotate: [-2 * wave(p, 1, 0.35), 0, 0] },
      }),
    });

    // Fly: a hover, the body pitched forward, big wing beats, the legs and the tail trailing.
    k.animation('fly', {
      duration: 0.6,
      pose: (_t, p) => ({
        hips: { move: [0, 0.3 + 0.03 * wave(p, 1, 0.25), 0], rotate: [22, 0, 3 * wave(p, 1, 0.1)] },
        head: { rotate: [-18, 0, 0] },
        ...wings(flap(p, 40, -14)),
        tail1: { rotate: [18 + 6 * wave(p, 1, 0.3), 0, 0] },
        tail2: { rotate: [8 + 10 * wave(p, 1, 0.45), 8 * wave(p, 1, 0.4), 0] },
        tail3: { rotate: [10 * wave(p, 1, 0.6), 12 * wave(p, 1, 0.55), 0] },
        'leg.L': { rotate: [34, 0, 0] },
        'leg.R': { rotate: [30, 0, 0] },
        'shin.L': { rotate: [24, 0, 0] },
        'shin.R': { rotate: [28, 0, 0] },
        'upperarm.L': { rotate: [-12, 0, 0] },
        'upperarm.R': { rotate: [-12, 0, 0] },
      }),
    });

    // Attack (0.9 s): it rears up, lunges forward with both claws, rakes down, and settles.
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(p, [
          [0, WRIST],
          [0.3, [0.26, 0.74, 0.0]], // up and back beside the head
          [0.36, [0.26, 0.76, 0.01]],
          [0.44, [0.15, 0.56, 0.3]], // reach forward at the target
          [0.59, [0.15, 0.55, 0.31]],
          [0.65, [0.16, 0.4, 0.28]], // rake down across it
          [0.71, [0.2, 0.26, 0.2]],
          [0.9, WRIST],
          [1, WRIST],
        ]);
        const armL = reach(ARM_L, wrist, [0.45, 0.15, -0.2]);
        const armR = reach(ARM_R, mx(wrist), [-0.45, 0.15, -0.2]);
        const hand = keys(p, [[0, 0], [0.3, -25], [0.4, -20], [0.44, 10], [0.59, 12], [0.66, 35], [0.74, 20], [0.92, 0]]);
        const keyed: WingAngles = {
          raise: keys(p, [[0, idleWing(0).raise], [0.3, 28], [0.36, 30], [0.46, -55], [0.6, -20]]),
          fwd: keys(p, [[0, idleWing(0).fwd], [0.3, 5], [0.36, 5], [0.46, 20], [0.6, 0]]),
          twist: keys(p, [[0, 0], [0.3, 20], [0.36, 22], [0.46, -32], [0.6, -20]]),
        };
        const wing = mixWing(keyed, idleWing(p), ease(0.6, 0.95, p));
        const back = (a: number) => keys(p, [[0, a], [0.3, 0], [0.8, 0], [1, a]]);
        return {
          hips: {
            move: keys(p, [
              [0, [0, 0, 0]],
              [0.3, [0, 0.1, -0.06]],
              [0.36, [0, 0.11, -0.065]],
              [0.44, [0, 0.15, 0.17]],
              [0.59, [0, 0.12, 0.24]],
              [0.66, [0, 0.08, 0.25]],
              [0.82, [0, 0.02, 0.1]],
              [1, [0, 0, 0]],
            ]),
            rotate: [keys(p, [[0, 0], [0.3, -16], [0.36, -18], [0.44, 24], [0.59, 28], [0.66, 30], [0.82, 10], [1, 0]]), 0, 0],
          },
          chest: { rotate: [keys(p, [[0, 0], [0.3, -10], [0.36, -11], [0.44, 10], [0.59, 12], [0.66, 14], [0.86, 0]]), 0, 0] },
          head: { rotate: [keys(p, [[0, 0], [0.3, 12], [0.44, -22], [0.59, -24], [0.66, -26], [0.86, -4], [1, 0]]), back(3.5), 0] },
          ...wings(wing),
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.L': { rotate: [hand, 0, 0] },
          'hand.R': { rotate: [hand, 0, 0] },
          tail1: { rotate: [keys(p, [[0, 0], [0.3, -10], [0.46, 25], [0.66, 20], [1, 0]]), 0, 0] },
          tail2: { rotate: [keys(p, [[0, 0], [0.3, -5], [0.46, 15], [0.68, 5], [1, 0]]), 0, 0] },
          tail3: { rotate: [keys(p, [[0, 0], [0.3, -20], [0.46, 30], [0.68, -10], [0.86, 5], [1, 0]]), 0, 0] },
          'leg.L': { rotate: [keys(p, [[0, 0], [0.3, -10], [0.46, 30], [0.66, 34], [0.86, 12], [1, 0]]), 0, 0] },
          'leg.R': { rotate: [keys(p, [[0, 0], [0.3, -12], [0.46, 28], [0.66, 32], [0.86, 10], [1, 0]]), 0, 0] },
          'shin.L': { rotate: [keys(p, [[0, 0], [0.3, 30], [0.46, 25], [0.66, 20], [1, 0]]), 0, 0] },
          'shin.R': { rotate: [keys(p, [[0, 0], [0.3, 34], [0.46, 22], [0.66, 18], [1, 0]]), 0, 0] },
        };
      },
    });

    // Hit: a jolt back; the head snaps back, the wings snap up, the arms fly out, and the tail whips.
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.16, 1], [0.4, 0.75], [1, 0]]);
        const whip = (d: number, a: number) => a * keys(p, [[0, 0], [0.1 + d, 1], [0.3 + d, -0.6], [0.56 + d, 0.2], [1, 0]]);
        return {
          hips: { move: [0, 0.02 * h, -0.07 * h], rotate: [-16 * h, 0, 6 * h] },
          chest: { rotate: [-10 * h, 0, 0] },
          head: { rotate: [-24 * h, 0, -8 * h] },
          ...wings(mixWing(idleWing(0), { raise: -30, fwd: -20, twist: 0 }, h)),
          tail1: { rotate: [20 * h, whip(0, 30), 0] },
          tail2: { rotate: [10 * h, whip(0.06, -40), 0] },
          tail3: { rotate: [0, whip(0.12, 50), 0] },
          'leg.L': { rotate: [-12 * h, 0, 6 * h] },
          'leg.R': { rotate: [-10 * h, 0, -6 * h] },
          'shin.L': { rotate: [20 * h, 0, 0] },
          'shin.R': { rotate: [18 * h, 0, 0] },
          'upperarm.L': { rotate: [15 * h, 0, 50 * h] },
          'upperarm.R': { rotate: [15 * h, 0, -50 * h] },
          'forearm.L': { rotate: [25 * h, 0, 20 * h] },
          'forearm.R': { rotate: [25 * h, 0, -20 * h] },
        };
      },
    });

    // Death: a jolt, then the stone slumps, the wings fall and it crumbles down to a low heap.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const jolt = keys(p, [[0, 0], [0.08, 1], [0.2, 0.3], [0.3, 0]]);
        const slump = ease(0.2, 0.6, p);
        const s = 1 - 0.45 * ease(0.55, 1, p); // the crumble: the whole body shrinks
        const drop = -0.28 * (1 - s) - 0.09 * slump; // keeps the feet near the floor as it shrinks
        return {
          hips: { move: [0, drop + 0.02 * jolt, -0.03 * jolt], rotate: [-8 * jolt + 10 * slump, 0, 4 * jolt], scale: [s, s, s] },
          chest: { rotate: [-6 * jolt + 26 * slump, 0, 0] },
          head: { rotate: [-16 * jolt + 34 * slump, 12 * slump, 6 * slump] },
          ...wings(mixWing(idleWing(0), { raise: -62, fwd: 10, twist: 0 }, ease(0.08, 0.5, p))),
          tail1: { rotate: [-10 * slump, 10 * slump, 0] },
          tail2: { rotate: [-16 * slump, 0, 0] },
          tail3: { rotate: [-20 * slump, 0, 0] },
          'leg.L': { rotate: [-40 * slump, 0, 8 * slump] },
          'leg.R': { rotate: [-36 * slump, 0, -8 * slump] },
          'shin.L': { rotate: [70 * slump, 0, 0] },
          'shin.R': { rotate: [66 * slump, 0, 0] },
          'upperarm.L': { rotate: [20 * slump, 0, 24 * slump] },
          'upperarm.R': { rotate: [20 * slump, 0, -24 * slump] },
          'forearm.L': { rotate: [30 * slump, 0, 0] },
          'forearm.R': { rotate: [30 * slump, 0, 0] },
        };
      },
    });
  },
});
