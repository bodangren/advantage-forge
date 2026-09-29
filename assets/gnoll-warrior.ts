import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Gnoll warrior — Chibi Quest enemy (catalog `enemies/humanoid/gnoll-warrior`), about 1.05 m to
 * the ear tips, faces +Z. Target: docs/enemy-mockups/gnoll-warrior_001.jpg (one front view).
 * Built on the orc warrior's body, rig, and clip structure; the weapon is a spear in `hand.L`.
 *
 * Role: a fast melee enemy seen in 3D and as a 128 px sprite; the tall ears, the long dark
 *   muzzle with the snarl, the spiky mane, and the spear must read.
 * One idea: a hyena head on a chibi brute: huge pointed ears, a long dark snout, and a ruff of
 *   black spikes, over a tan body with a leather X harness and a big jagged spear.
 * Proportions (from the mockup): ear tips 1.05, skull top 0.9, eyes 0.69, nose 0.62, mouth 0.55,
 *   chin 0.47, shoulders 0.52, belt 0.33, loincloth hem 0.17, spear butt 0.02 and tip 1.1.
 * Shape language: round body (shoulders, belly, fists) with triangles for menace (ears, mane,
 *   teeth, forehead marks, spear blade, torn loincloth).
 * Palette (60/30/10): tan fur #c8934f with shade #a8743a; near-black muzzle, ears, and mane
 *   #2e2a28; dark leather #3a2e2a; steel #8a8a92 as the accent with white teeth #efe8d8.
 * Value plan: the dark muzzle and mane ring the bright tan face; the round black eyes with white
 *   glints and the white teeth are the focal point; the grey spear blade is the second accent.
 * Bodies: pelt (torso, limbs, paws), skull (head with forehead marks), muzzle, ears, mane, crest,
 *   nose, maw, fangs, eyes, harness (X strap, belt), studs, loincloth, wraps, necklace, cord,
 *   spear-shaft, spear-blade, spear-collar.
 * Rig: the orc warrior rig (knee bones); `knot` carries the crest on the head. Clips: idle, walk,
 *   run, attack (a spear thrust), attack2 (a wide sweep), roar, hit, death.
 */

const C = {
  fur: '#b8834a',
  furShade: '#96683a',
  belly: '#c89a62',
  mane: '#2e2a28',
  paw: '#3a3430',
  handFur: '#6a4530',
  tooth: '#efe8d8',
  eye: '#1c1c20',
  mouth: '#1a1212',
  leather: '#3a2e2a',
  leatherLit: '#5a4a40',
  buckle: '#6a6a70',
  blade: '#8a8a92',
  edge: '#b8b8c0',
  shaft: '#4a3a2c',
  wrap: '#8a7a66',
  wrapDark: '#6a5a48',
  maneTip: '#4a4440',
};

type V3 = readonly [number, number, number];
const DEG = Math.PI / 180;

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints (the orc warrior's): wide shoulders, arms hanging out from the body, a wide stance.
const SHOULDER: V3 = [0.22, 0.52, 0];
const ELBOW: V3 = [0.31, 0.4, 0.02];
const WRIST: V3 = [0.345, 0.3, 0.05];
const HIP: V3 = [0.1, 0.25, 0];
const ANKLE: V3 = [0.155, 0.075, 0];
const KNEE: V3 = [0.1275, 0.1625, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left bare foot (y = 0), measured on the SDF (orc warrior feet).
const SOLE_HEEL: V3 = [0.155, 0, -0.022];
const SOLE_TOE: V3 = [0.169, 0, 0.09];
const HEAD_Y = 0.73;
const BELT_Y = 0.33;
// The spear stands in the left fist: the shaft axis passes through the fist ball.
const GRIP_X = WRIST[0] + 0.03;
const GRIP_Z = WRIST[2] + 0.008;

/** A big fist hanging from the wrist `w`; `s` mirrors it for the right hand. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.022,
    sdf.ellipsoid([0.066, 0.068, 0.07]).at(...o(0.006, -0.06, 0.006)),
    sdf.capsule(o(-0.016, -0.092, 0.05), o(-0.01, -0.058, 0.07), 0.028), // curled fingers
    sdf.cone(o(0.036, -0.036, 0.042), o(0.004, -0.05, 0.08), 0.027, 0.021), // thumb
  );
};

export default defineAsset({
  name: 'gnoll-warrior',
  description: 'Chibi gnoll warrior enemy: a hyena head with tall ears, a long dark muzzle, and a spiky mane, tan fur, a leather X harness, bone necklace, and a jagged spear.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/gnoll-warrior_001.jpg',
  variants: {
    fur: { tan: C.fur, grey: '#9a9490', russet: '#9a5a34' },
    mane: { dark: C.mane, grey: '#6a6660', red: '#7a3a22' },
    harness: { dark: C.leather, brown: '#6a4a2a', red: '#7a2a22' },
  },
  presets: {
    ashen: { fur: 'grey', mane: 'grey', harness: 'dark' },
    rustmane: { fur: 'russet', mane: 'red', harness: 'brown' },
    bloodpack: { fur: 'tan', mane: 'dark', harness: 'red' },
  },

  build(k) {
    const T = {
      fur: k.tint('fur'),
      furShade: k.tint('fur', { color: C.furShade, follow: 1 }),
      hand: k.tint('fur', { color: C.handFur, follow: 0.5 }),
      belly: k.tint('fur', { color: C.belly, follow: 1 }),
      mane: k.tint('mane'),
      harness: k.tint('harness'),
      lit: k.tint('harness', { color: C.leatherLit, follow: 1 }),
    };
    const shadeOf = (body: string, shade: string) => {
      const a = rgb(body);
      const b = rgb(shade);
      return [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
    };
    const KNOT: V3 = [0, 0.9, -0.03];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.26, 0] },
      spine: { parent: 'hips', at: [0, 0.34, 0] },
      chest: { parent: 'spine', at: [0, 0.44, 0] },
      neck: { parent: 'chest', at: [0, 0.54, -0.01] },
      head: { parent: 'neck', at: [0, 0.58, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [0, 0.98, -0.04] },
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

    // ------------------------------------------------------------------ head: a broad hyena skull
    const skull = sdf
      .smoothUnion(
        0.04,
        sdf.ellipsoid([0.19, 0.165, 0.17]).at(0, HEAD_Y, -0.01),
        pair(sdf.sphere(0.085).at(0.105, 0.665, 0.045)), // cheeks
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(skull, [x, y, 1], [0, 0, -1])![2];

    // Tan fur tufts on the cheeks and the temples, pointing out and back.
    const tufts = pair(
      sdf.union(
        sdf.cone([0.15, 0.8, 0.03], [0.225, 0.835, -0.005], 0.024, 0.004),
        sdf.cone([0.17, 0.725, 0.05], [0.25, 0.745, 0.02], 0.024, 0.004),
        sdf.cone([0.165, 0.655, 0.07], [0.235, 0.625, 0.045], 0.022, 0.004),
      ),
    ).bone('head');

    // Eyes: big, round, and dark, half sunk in the face, set beside the muzzle bridge.
    const EX = 0.085;
    const EYY = 0.69;
    const eyeAt = (x: number): V3 => [x, EYY, faceZ(Math.abs(x), EYY) - 0.004];
    const eyeShape = pair(sdf.sphere(0.03).at(...eyeAt(EX)));
    const glintDir = norm([-0.35, 0.45, 0.82]);
    const glints = sdf.union(
      ...[EX, -EX].flatMap((x) => {
        const c = eyeAt(x);
        return [
          sdf.sphere(0.0085).at(c[0] + glintDir[0] * 0.03, c[1] + glintDir[1] * 0.03, c[2] + glintDir[2] * 0.03),
          sdf.sphere(0.0045).at(c[0] + 0.011, c[1] - 0.012, c[2] + 0.026),
        ];
      }),
    );
    k.body('eyes', eyeShape.paintWhere(glints, '#ffffff', 0.002).bone('head'), { color: C.eye, roughness: 0.2, detail: 0.004 });

    // Three dark triangles on each side of the forehead (the mockup shows two on each side).
    const tri = profile.polygon([
      [-0.02, 0.013],
      [0.02, 0.013],
      [0, -0.02],
    ]);
    const marks = pair(
      sdf.union(
        sdf.extrude(tri, 0.4).rotateZ(-14).at(0.098, 0.812, 0.2),
        sdf.extrude(tri, 0.4).rotateZ(-6).at(0.064, 0.77, 0.2),
      ),
    );
    const skullBody = skull
      .paintWhere(marks, T.mane, 0.003)
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 16, y * 16, z * 16, 2);
        const d = shadeOf(C.fur, C.furShade);
        return n > 0.42 ? ([base[0] + d[0], base[1] + d[1], base[2] + d[2]] as const) : base;
      });
    k.body('skull', sdf.union(skullBody, tufts), {
      color: T.fur,
      roughness: 0.9,
      textureDensity: 2,
      detail: 0.004,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });

    // ------------------------------------------------------------------ muzzle, jaw, nose, mouth, teeth
    const MZ = 0.145; // muzzle center z
    const upperY = 0.612;
    const bridge = sdf.chain(
      [
        [0, 0.782, faceZ(0, 0.782) - 0.006, 0.02],
        [0, 0.725, faceZ(0, 0.725) + 0.006, 0.034],
        [0, 0.655, 0.16, 0.052],
      ],
      0.02,
    );
    const upperMuzzle = sdf.box([0.15, 0.1, 0.17], 0.035).at(0, upperY, MZ);
    const lips = pair(sdf.ellipsoid([0.08, 0.045, 0.09]).at(0.078, 0.588, 0.105));
    // The lower jaw is wide, and both jaws carry a raised lip rim, so the open mouth reads as a snarl.
    const jaw = sdf.smoothUnion(
      0.02,
      sdf.box([0.11, 0.05, 0.1], 0.02).at(0, 0.487, 0.14),
      sdf.sphere(0.028).at(0, 0.487, 0.19),
      pair(sdf.ellipsoid([0.05, 0.028, 0.06]).at(0.065, 0.495, 0.09)),
    );
    const rimUpper = sdf.box([0.16, 0.02, 0.17], 0.009).at(0, 0.562, 0.15);
    const rimLower = sdf.box([0.118, 0.018, 0.104], 0.008).at(0, 0.516, 0.142);
    const muzzle = sdf.smoothUnion(0.03, upperMuzzle, bridge, lips, rimUpper).union(sdf.smoothUnion(0.012, jaw, rimLower)).bone('head');
    k.body('muzzle', muzzle, { color: T.mane, roughness: 0.75, detail: 0.004, bump: (x, y, z) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2) });
    k.body('nose', sdf.ellipsoid([0.052, 0.036, 0.038]).at(0, 0.628, 0.225).bone('head'), { color: '#0c0a0a', roughness: 0.3, detail: 0.005 });
    k.body('maw', sdf.ellipsoid([0.07, 0.03, 0.095]).at(0, 0.538, 0.115).bone('head'), { color: C.mouth, roughness: 0.6, detail: 0.005 });
    const fang = (x: number, z: number, y0: number, y1: number, r: number) => sdf.cone([x, y0, z], [x, y1, z + 0.004], r, 0.003);
    const fangs = sdf.union(
      pair(fang(0.055, 0.2, 0.566, 0.525, 0.013)), // upper fangs, set in the rim
      pair(fang(0.03, 0.222, 0.566, 0.54, 0.009)),
      pair(fang(0.012, 0.226, 0.566, 0.543, 0.008)),
      pair(fang(0.045, 0.19, 0.514, 0.552, 0.012)), // lower fangs
      pair(fang(0.02, 0.185, 0.514, 0.543, 0.008)),
    );
    k.body('fangs', fangs.bone('head'), { color: C.tooth, roughness: 0.4, detail: 0.004 });

    // ------------------------------------------------------------------ ears: tall, pointed, dark
    const earLocal = sdf
      .cone([0, 0, 0], [0, 0.27, 0], 0.104, 0.006)
      .scale([1, 1, 0.5])
      .smoothSubtract(0.006, sdf.ellipsoid([0.05, 0.13, 0.03]).at(0, 0.11, 0.03)); // a shallow cup in the front
    const ears = pair(earLocal.rotateX(-6).rotateZ(-7).at(0.115, 0.82, -0.03)).bone('head');
    k.body('ears', ears, { color: T.mane, roughness: 0.75, detail: 0.005 });

    // ------------------------------------------------------------------ mane: spikes around the cheeks and down the neck
    const trunkShape = sdf.smoothUnion(0.06, sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0), sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02));
    const spike = (root: V3, dir: V3, len: number, r: number) => {
      const d = norm(dir);
      return sdf.cone([root[0] - d[0] * 0.025, root[1] - d[1] * 0.025, root[2] - d[2] * 0.025], [root[0] + d[0] * len, root[1] + d[1] * len, root[2] + d[2] * len], r, 0.005);
    };
    // A dense ruff: a collar behind the face and under the jaw, with short packed cones blended
    // into it, so no gaps show between the spikes.
    const MC = 0.655;
    const maneCollar = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.25, 0.235, 0.13]).at(0, MC - 0.01, -0.01),
      sdf.ellipsoid([0.2, 0.085, 0.15]).at(0, 0.49, 0.05),
    );
    const outerLen = [0.09, 0.08, 0.09, 0.06, 0.06, 0.06, 0.06, 0.09, 0.09, 0.08];
    const outer = [85, 69, 53, 37, 21, 5, -11, -27, -43, -59].map((a, i) => {
      const c = Math.cos(a * DEG);
      const s = Math.sin(a * DEG);
      return spike([0.245 * c, MC - 0.01 + 0.23 * s, 0.03], [c, s + (a < -20 ? -0.3 : 0), 0.35], outerLen[i]!, 0.03);
    });
    const inner = [70, 30, -12].map((a) => {
      const c = Math.cos(a * DEG);
      const s = Math.sin(a * DEG);
      return spike([0.2 * c, MC + 0.19 * s, 0.05], [c, s, 0.6], 0.06, 0.027);
    });
    const neckSpikes = [0.03, 0.08, 0.13, 0.18].map((x) => {
      const z = sdf.raycast(trunkShape, [x, 0.5, 1], [0, 0, -1])![2];
      return spike([x, 0.5, z + 0.03], [x * 3, -0.45, 0.8], 0.085, 0.03);
    });
    const maneHalf = sdf.smoothUnion(0.015, sdf.smoothUnion(0.03, maneCollar), ...outer, ...inner, ...neckSpikes);
    const maneShape = sdf.smoothUnion(0.015, maneCollar, pair(sdf.union(...outer, ...inner, ...neckSpikes)));
    void maneHalf;
    const tipD = shadeOf(C.mane, C.maneTip);
    const maneTip = (x: number, y: number) => {
      const rh = Math.hypot(x / 0.245, (y - MC + 0.01) / 0.235);
      const rn = Math.hypot(x / 0.17, (y - 0.5) / 0.09);
      const r = y > 0.57 ? rh : Math.min(rh, rn * 0.9);
      return Math.min(1, Math.max(0, (r - 1.08) / 0.25));
    };
    k.body(
      'mane',
      maneShape
        .paintFn((x, y, z, base) => {
          const t = maneTip(x, y);
          return [base[0] + tipD[0] * t, base[1] + tipD[1] * t, base[2] + tipD[2] * t] as const;
        })
        .bone('head'),
      { color: T.mane, roughness: 0.8, detail: 0.007 },
    );
    // Three or four longer tufts on the crown.
    const crest = sdf.union(
      spike([0, 0.895, -0.03], [0, 1, -0.1], 0.1, 0.02),
      ...[30, 150, 270].map((a) => {
        const c = Math.cos(a * DEG);
        const s = Math.sin(a * DEG);
        return spike([c * 0.04, 0.895, -0.03 + s * 0.04], [c * 0.5, 1, s * 0.5 - 0.1], 0.075, 0.018);
      }),
    );
    k.body('crest', crest.bone('knot'), { color: T.mane, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ torso, arms, legs
    const neck = sdf.capsule([0, 0.5, -0.01], [0, 0.62, -0.01], 0.095).bone('neck');
    const trunk = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0).bone('chest'),
      sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02).bone('spine'),
      pair(sdf.sphere(0.1).at(0.155, 0.545, -0.02).bone('chest')), // traps
      pair(sdf.ellipsoid([0.088, 0.062, 0.05]).at(0.076, 0.48, 0.1).bone('chest')), // pecs
    );
    const abs = pair(
      sdf.union(
        ...[0.405, 0.365, 0.325].map((y, i) => {
          const p = sdf.raycast(trunkShape, [0.036, y, 1], [0, 0, -1])!;
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
        sdf.cone(sh, el, 0.09, 0.075).bone(`upperarm.${side}`),
        sdf.ellipsoid([0.07, 0.08, 0.068]).at(...lerp(sh, el, 0.5)).bone(`upperarm.${side}`),
        sdf.cone(el, wr, 0.075, 0.068).bone(`forearm.${side}`),
        fistAt(wr, s).bone(`hand.${side}`),
      );
    };
    const legs = pair(sdf.capsule([HIP[0], 0.26, 0], [ANKLE[0], 0.1, 0.01], 0.078).bone('leg.L'));
    // Bare clawed feet with four round toes, each ending in a short dark claw.
    const toeX = [-0.045, -0.015, 0.015, 0.045];
    const footLocal = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.078, 0.052, 0.11]).at(0, 0.045, 0.035),
        ...toeX.map((x, i) => sdf.sphere(0.024 - i * 0.001).at(x, 0.03, 0.135 - Math.abs(x) * 0.3)),
        ...toeX.map((x) => sdf.cone([x, 0.034, 0.135 - Math.abs(x) * 0.3 + 0.006], [x, 0.026, 0.135 - Math.abs(x) * 0.3 + 0.048], 0.013, 0.003)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const feetShape = pair(footLocal.rotateY(14).at(ANKLE[0], 0, 0));
    const feet = feetShape.bone('foot.L');
    const fingerCurl = (y: number, r: number) =>
      sdf.chain(
        [215, 170, 125, 80, 35, -10].map((a, i) => [GRIP_X + 0.055 * Math.cos(a * DEG), y, GRIP_Z + 0.055 * Math.sin(a * DEG), r - i * 0.0012] as [number, number, number, number]),
        0.008,
      );
    const fingers = sdf.union(fingerCurl(0.205, 0.016), fingerCurl(0.238, 0.016), fingerCurl(0.271, 0.015)).bone('hand.L');
    const bellyRegion = sdf.ellipsoid([0.15, 0.22, 0.16]).at(0, 0.4, 0.08);
    const handsRegion = sdf.union(sdf.sphere(0.085).at(WRIST[0] + 0.006, WRIST[1] - 0.06, WRIST[2] + 0.01), sdf.sphere(0.085).at(-WRIST[0] - 0.006, WRIST[1] - 0.06, WRIST[2] + 0.01));
    const furShadeD = shadeOf(C.fur, C.furShade);
    const pelt = sdf
      .smoothUnion(0.04, neck)
      .smoothUnion(0.05, trunk)
      .smoothUnion(0.012, abs)
      .union(armAt(1), armAt(-1), fingers)
      .smoothUnion(0.03, legs)
      .union(feet)
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 14, y * 14, z * 14, 2);
        return n > 0.4 ? ([base[0] + furShadeD[0], base[1] + furShadeD[1], base[2] + furShadeD[2]] as const) : base;
      })
      .paintWhere(bellyRegion, T.belly, 0.03)
      .paintWhere(handsRegion, T.hand, 0.012)
      .paintWhere(feetShape.round(0.002), C.paw, 0.004);
    k.body('pelt', pelt, {
      color: T.fur,
      detail: 0.007,
      roughness: 0.9,
      textureDensity: 1.5,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });

    // ------------------------------------------------------------------ harness, belt, studs, buckles
    const strapAt = (ang: number) => trunkShape.round(0.012).smoothIntersect(0.006, sdf.box([0.8, 0.045, 0.8], 0.006).rotateZ(ang).at(0, 0.41, 0));
    const strapA = strapAt(-33);
    const strapB = strapAt(33);
    const belt = trunkShape.round(0.016).smoothIntersect(0.006, sdf.box([0.6, 0.06, 0.6], 0.008).at(0, BELT_Y, 0));
    k.body('harness', sdf.union(strapA.bone('chest'), strapB.bone('chest'), belt.bone('spine')), {
      color: T.harness,
      roughness: 0.6,
      detail: 0.005,
    });
    // Studs on the belt and the straps, and square iron buckles.
    const studs = sdf.union(
      ...[-80, -60, -40, -20, 20, 40, 60, 80].map((a) => {
        const p = sdf.surfacePoint(belt, [Math.sin(a * DEG) * 0.3, BELT_Y, Math.cos(a * DEG) * 0.3], 0.0);
        return sdf.sphere(0.0085).at(...p);
      }),
      ...[-0.13, -0.085, 0.085, 0.13].flatMap((x) => [
        sdf.sphere(0.008).at(...sdf.surfacePoint(strapA, [x, 0.41 - Math.tan(33 * DEG) * x, 0.3], 0.0)),
        sdf.sphere(0.008).at(...sdf.surfacePoint(strapB, [x, 0.41 + Math.tan(33 * DEG) * x, 0.3], 0.0)),
      ]),
    );
    const beltZ = sdf.raycast(belt, [0, BELT_Y, 1], [0, 0, -1])![2];
    const buckleFrame = sdf
      .box([0.07, 0.056, 0.018], 0.006)
      .subtract(sdf.box([0.04, 0.03, 0.1]))
      .union(sdf.box([0.008, 0.05, 0.014], 0.003))
      .at(0, BELT_Y, beltZ + 0.004);
    const xz = sdf.raycast(trunkShape, [0, 0.41, 1], [0, 0, -1])![2];
    const xPlate = sdf.box([0.056, 0.056, 0.02], 0.008).at(0, 0.41, xz + 0.002);
    const xRivets = sdf.union(...[-1, 1].flatMap((sx) => [-1, 1].map((sy) => sdf.sphere(0.006).at(sx * 0.018, 0.41 + sy * 0.018, xz + 0.014))));
    k.body('studs', studs.bone('spine'), { color: C.buckle, roughness: 0.45, metalness: 0.7, detail: 0.005 });
    k.body('buckles', sdf.union(buckleFrame.bone('spine'), xPlate.union(xRivets).bone('chest')), {
      color: C.buckle,
      roughness: 0.45,
      metalness: 0.7,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ bone-tooth necklace
    const cordY = (x: number) => 0.505 - 0.07 * (1 - (x / 0.13) ** 2);
    const cordPts = [-0.13, -0.09, -0.045, 0, 0.045, 0.09, 0.13].map((x) => {
      const p = sdf.raycast(trunkShape, [x, cordY(x), 1], [0, 0, -1])!;
      return [x, cordY(x), p[2] + 0.008, 0.0085] as [number, number, number, number];
    });
    k.body('cord', sdf.chain(cordPts, 0.01).bone('chest'), { color: C.leather, roughness: 0.7, detail: 0.005 });
    const necklaceTeeth = sdf.union(
      ...[
        [0.0, 0.065],
        [0.05, 0.058],
        [-0.05, 0.058],
        [0.1, 0.04],
        [-0.1, 0.04],
        [0.025, 0.05],
      ].map(([x, len]) => {
        const y = cordY(x!);
        const p = sdf.raycast(trunkShape, [x!, y, 1], [0, 0, -1])!;
        const q = sdf.raycast(trunkShape, [x!, y - len!, 1], [0, 0, -1])!;
        return sdf.cone([x!, y + 0.004, p[2] + 0.01], [x!, y - len!, q[2] + 0.02], 0.0145, 0.003);
      }),
    );
    k.body('necklace', necklaceTeeth.bone('chest'), { color: C.tooth, roughness: 0.45, detail: 0.005 });

    // ------------------------------------------------------------------ cloth wraps: right forearm, left elbow, both shins
    // Stacked tori (r 0.012), each tilted a little differently; the grooves between them are the
    // gaps of the stack. Odd rings take the darker shade.
    const alignY = (sh: sdf.Shape, d: V3, extra: number) => {
      const n = norm(d);
      return sh.rotateX(Math.asin(n[2]) / DEG).rotateZ(Math.atan2(-n[0], n[1]) / DEG + extra);
    };
    const wrapArm = (e: V3, w: V3, ts: readonly number[]) =>
      sdf.union(
        ...ts.map((t, i) => {
          const c = lerp(e, w, t);
          const ring = sdf.torus(0.075 - 0.007 * t + 0.006, 0.012);
          const tilted = alignY(ring, [e[0] - w[0], e[1] - w[1], e[2] - w[2]], (i - 2) * 3.5).at(...c);
          return tilted.paint(i % 2 === 0 ? C.wrap : C.wrapDark);
        }),
      );
    const wrapsArm = sdf.union(
      wrapArm(mx(ELBOW), mx(WRIST), [0.12, 0.31, 0.5, 0.69, 0.88]).bone('forearm.R'),
      wrapArm(ELBOW, WRIST, [0.12, 0.31, 0.5]).bone('forearm.L'),
    );
    const shinX = (y: number) => HIP[0] + ((0.26 - y) / 0.16) * (ANKLE[0] - HIP[0] + 0.0);
    const shinWrap = pair(
      sdf
        .union(
          ...[0.078, 0.1, 0.122, 0.144, 0.166].map((y, i) =>
            sdf.torus(0.08 - 0.0015 * i, 0.012).rotateZ(19 + (i - 2) * 3.5).at(shinX(y), y, 0.005).paint(i % 2 === 0 ? C.wrap : C.wrapDark),
          ),
        )
        .bone('shin.L'),
    );
    const wrapsAll = sdf.union(wrapsArm, shinWrap);
    k.body('wraps', wrapsAll, {
      color: C.wrap,
      roughness: 0.95,
      detail: 0.007,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 80, y * 80, z * 80, 2),
    });

    // ------------------------------------------------------------------ loincloth: dark leather with a torn hem, front and back
    const skirtCone = (grow: number, top: number) => {
      const r0 = 0.176 + grow;
      const head: [number, number][] = top > 0.3 ? [[0, top], [r0, top], [r0, 0.3]] : [[0, 0.3], [r0, 0.3]];
      return sdf
        .revolve(
          profile.polygon([
            ...head,
            [0.2 + grow, 0.255],
            [0.238 + grow, 0.165],
            [0, 0.165],
          ]),
        )
        .scale([1, 1, 0.84])
        .at(0, 0, 0.018);
    };
    const clothFolds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(x, z) * 11 + noise.fbm(x * 12, y * 4, z * 12, 2) * 2) * Math.min(1, Math.max(0, (0.3 - y) / 0.12));
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
    const skirt = skirtCone(0, 0.3).subtract(skirtCone(-0.013, 0.45)).displace(0.008, clothFolds, 1.5).subtract(tears);
    const loincloth = sdf
      .union(
        skirt.intersect(sdf.halfSpace([0, -1, 0], -0.25)).bone('hips'),
        skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([-1, 0, 0], 0)).bone('leg.L'),
        skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([1, 0, 0], 0)).bone('leg.R'),
      )
      ;
    k.body('loincloth', loincloth, { color: T.harness, roughness: 0.85, detail: 0.007, bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 30, z * 60, 2) });

    // ------------------------------------------------------------------ spear (rigid on hand.L, upright at rest)
    const SPEAR_BASE = 0.76; // where the blade starts
    k.body('spear-shaft', sdf.cylinder(0.02, 0.8, 0.006).at(GRIP_X, 0.42, GRIP_Z).bone('hand.L'), {
      color: C.shaft,
      roughness: 0.75,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 30, y * 200, z * 30, 2),
      detail: 0.004,
    });
    // Butt cap, grip rings, and the stacked collar under the blade.
    const collar = sdf
      .revolve(
        profile.polygon([
          [0, 0.6],
          [0.024, 0.6],
          [0.032, 0.625],
          [0.032, 0.645],
          [0.025, 0.655],
          [0.03, 0.675],
          [0.038, 0.695],
          [0.039, 0.725],
          [0.046, 0.73],
          [0.046, 0.755],
          [0.03, 0.765],
          [0, 0.765],
        ]),
      )
      .at(GRIP_X, 0, GRIP_Z);
    const fittings = sdf.union(
      sdf.cylinder(0.027, 0.05, 0.01).at(GRIP_X, 0.035, GRIP_Z),
      sdf.cylinder(0.025, 0.014, 0.005).at(GRIP_X, 0.11, GRIP_Z),
      sdf.cylinder(0.025, 0.014, 0.005).at(GRIP_X, 0.4, GRIP_Z),
      sdf.cylinder(0.025, 0.014, 0.005).at(GRIP_X, 0.425, GRIP_Z),
      collar,
    );
    k.body('spear-collar', fittings.bone('hand.L'), { color: C.buckle, roughness: 0.5, metalness: 0.6, detail: 0.004 });
    // The blade: an elongated faceted diamond (flat shading) with a center ridge, two side spikes,
    // and a wrapped grip band under the collar.
    const outline = profile.polygon([
      [-0.032, 0],
      [0.032, 0],
      [0.064, 0.09],
      [0, 0.345],
      [-0.064, 0.09],
    ]);
    const inside = profile.offsetProfile(outline, -0.013);
    const HL = Math.hypot(1, 0.13);
    // Four planes leave two mirrored wedges on each face: a ridge along the center line.
    const facets = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => sdf.halfSpace([(sx * 0.13) / HL, 0, sz / HL], 0.014 / HL)));
    const blade = sdf
      .extrude(outline, 0.06)
      .intersect(sdf.intersect(sdf.intersect(facets[0]!, facets[1]!), sdf.intersect(facets[2]!, facets[3]!)))
      .paintWhere(sdf.extrude(outline, 0.4).subtract(sdf.extrude(inside, 0.5)), C.edge, 0.004);
    const gripBand = sdf.union(
      ...[0.5, 0.514, 0.528, 0.542, 0.556].map((y, i) => sdf.torus(0.024, 0.0075).at(GRIP_X, y, GRIP_Z).paint(i % 2 === 0 ? C.wrap : C.wrapDark)),
    );
    k.body('spear-grip', gripBand.bone('hand.L'), { color: C.wrap, roughness: 0.95, detail: 0.005 });
    const spikes = sdf.union(
      sdf.cone([0.03, 0.105, 0], [0.115, 0.125, 0.0], 0.024, 0.005),
      sdf.cone([-0.03, 0.15, 0], [-0.095, 0.17, 0.0], 0.02, 0.005),
    );
    const bladePose = (s: sdf.Shape) => s.at(GRIP_X, SPEAR_BASE, GRIP_Z);
    k.body('spear-blade', bladePose(blade.union(spikes)).bone('hand.L'), {
      color: C.blade,
      roughness: 0.4,
      metalness: 0.75,
      detail: 0.004,
      flat: true,
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const dg = (r: number) => r / DEG;
    // The spear at rest: the tip along +Y, the blade's flat facing +Z.
    const SPEAR = { dir: [0, 1, 0] as V3, up: [0, 0, 1] as V3 };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
    const POLE_L: V3 = [0.8, 0.2, -0.3];
    const POLE_R: V3 = [-0.8, 0.2, -0.3];
    // The rotate values of the spear arm: the fist goes to `wrist`, the spear points along `dir`.
    // `roll` is the blade's flat normal; by default it turns with a pitch of the spear about X.
    const spearArm = (wrist: V3, dir: V3, up?: V3) => {
      const arm = reach(ARM_L, wrist, POLE_L);
      const d = norm(dir);
      const u = up ?? ([0, -d[2], d[1]] as V3);
      return { arm, hand: orient([arm.upper, arm.lower], SPEAR, { dir: d, up: u }) };
    };

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => {
        const w: V3 = [WRIST[0], WRIST[1] + 0.006 * bump(p), WRIST[2]];
        const sp = spearArm(w, [0.02 * wave(p, 1, 0.1), 1, 0.03 * wave(p, 1, 0.3)], [0, 0, 1]);
        return {
          hips: { move: [0, -0.004 * bump(p), 0] },
          chest: { rotate: [3 * wave(p), 0, 0], scale: [1 + 0.015 * bump(p), 1, 1 + 0.015 * bump(p)] },
          neck: { rotate: [-2 * wave(p), 0, 0] },
          head: { rotate: [0, 6 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
          knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
          'upperarm.L': { rotate: sp.arm.upper },
          'forearm.L': { rotate: sp.arm.lower },
          'hand.L': { rotate: sp.hand },
          'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -4 * bump(p)] },
          'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
        };
      },
    });

    // A loping, heavy walk: the legs come from motion.gait (planted feet, knee lift, heel strike).
    // The spear arm holds the spear upright and tips it a little with the lean.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, sway: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, sway * s] as const;
        const legs = motion.gait(
          p - 0.25,
          { hip: HIP, knee: KNEE, ankle: ANKLE },
          { stride: step, lift: footLift, duty, bob, roll: 8, heel: SOLE_HEEL, toe: SOLE_TOE, hips: { at: [0, 0.26, 0], rotate: hipsTurn } },
        );
        const wr: V3 = [WRIST[0], WRIST[1] + 0.012 * Math.abs(s), WRIST[2] - armSwing * 0.0022 * s];
        const tilt = -lean * 1.5 + 6;
        const sp = spearArm(wr, [0.02, Math.cos(tilt * DEG), Math.sin(tilt * DEG)], [0, 0, 1]);
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          knot: { rotate: [lean + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'upperarm.L': { rotate: sp.arm.upper },
          'forearm.L': { rotate: sp.arm.lower },
          'hand.L': { rotate: sp.hand },
          'upperarm.R': { rotate: [-armSwing * s, 0, -4] as const },
          'forearm.R': { rotate: [-armSwing * 0.4 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.95, 0.11, 0.025, 0.62, 0.008, 20, 4, 4));
    k.animation('run', stride(0.55, 0.16, 0.045, 0.42, 0.03, 36, 12, 3));

    // ------------------------------------------------------------------ legs of the lunges
    const lunge = (hipsZ: number, stepL: number, drop: number) => {
      const legR = dg(Math.atan2(hipsZ, 0.19));
      const legL = stepL + legR;
      return { legR, legL, y: -Math.max(legDrop(LEG, legL), legDrop(LEG, legR)) - drop };
    };
    const shake = (p: number, at: number, len: number, n: number) =>
      p < at ? 0 : Math.exp((-(p - at) / len) * 3) * Math.sin(((p - at) / len) * Math.PI * n);

    // ------------------------------------------------------------------ attack: a spear thrust
    // The gnoll coils back with the left shoulder, the spear level and the butt behind it; then it
    // steps in and drives the spear straight at the target's chest, holds with a shake, and recovers.
    k.animation('attack', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST],
            [0.16, [0.3, 0.38, 0.0]],
            [0.36, [0.27, 0.42, -0.05]],
            [0.45, [0.27, 0.42, -0.05]],
            [0.5, [0.25, 0.44, 0.1]],
            [0.55, [0.23, 0.45, 0.22]],
            [0.7, [0.23, 0.45, 0.22]],
            [0.9, [0.3, 0.36, 0.08]],
            [1, WRIST],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, [0, 1, 0]],
            [0.16, [0.12, 0.5, 0.85]],
            [0.36, [0.04, 0.26, 0.96]],
            [0.45, [0.04, 0.26, 0.96]],
            [0.5, [-0.1, 0.17, 0.98]],
            [0.55, [-0.19, 0.12, 0.97]],
            [0.7, [-0.19, 0.12, 0.97]],
            [0.9, [0.02, 0.6, 0.8]],
            [1, [0, 1, 0]],
          ] as const,
          'spline',
        );
        const sp = spearArm(wrist, dir);
        const sh = shake(p, 0.55, 0.16, 5);
        const hipsY = keys(p, [[0, 0], [0.36, 9], [0.45, 10], [0.52, -7], [0.58, -9], [0.72, -6], [1, 0]] as const);
        const spineX = keys(p, [[0, 0], [0.36, -6], [0.45, -7], [0.52, 6], [0.58, 7], [0.72, 6], [1, 0]] as const);
        const chestX = keys(p, [[0, 0], [0.36, -4], [0.45, -5], [0.52, 4], [0.58, 5], [0.72, 5], [1, 0]] as const) + 3 * sh;
        const chestY = keys(p, [[0, 0], [0.36, 18], [0.45, 20], [0.52, -9], [0.58, -12], [0.72, -9], [1, 0]] as const);
        const hipsZ = keys(p, [[0, 0], [0.36, -0.018], [0.45, -0.02], [0.54, 0.04], [0.72, 0.04], [1, 0]] as const);
        const stepL = keys(p, [[0, 0], [0.34, -6], [0.45, -8], [0.53, -26], [0.74, -24], [1, 0]] as const);
        const drop = keys(p, [[0, 0], [0.4, 0.005], [0.56, 0.02], [0.74, 0.018], [1, 0]] as const);
        const lg = lunge(hipsZ, stepL, drop);
        const offWrist = keys(p, [[0, mx(WRIST)], [0.36, [-0.3, 0.4, 0.14]], [0.45, [-0.3, 0.4, 0.15]], [0.56, [-0.34, 0.36, -0.12]], [0.7, [-0.34, 0.34, -0.08]], [1, mx(WRIST)]] as const, 'smooth');
        const off = reach(ARM_R, offWrist, POLE_R);
        return {
          hips: { move: [0, lg.y - 0.004 * sh, hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [spineX, 0, 0] },
          chest: { rotate: [chestX, chestY, 0] },
          head: { rotate: [-(spineX + chestX) * 0.55 - 3 * sh, -(chestY + hipsY) * 0.7, 0] },
          knot: { rotate: [-spineX - chestX * 1.2 + 10 * sh, 0, -chestY * 0.4] },
          'upperarm.L': { rotate: sp.arm.upper },
          'forearm.L': { rotate: sp.arm.lower },
          'hand.L': { rotate: sp.hand },
          'upperarm.R': { rotate: off.upper },
          'forearm.R': { rotate: off.lower },
          'leg.L': { rotate: [lg.legL, -hipsY, 0] },
          'leg.R': { rotate: [lg.legR, -hipsY, 0] },
          'foot.L': { rotate: [-lg.legL, 0, 0] },
          'foot.R': { rotate: [-lg.legR, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a wide sweep
    // The spear goes across the belly to the right, the body coils; then the whole body turns
    // left and the blade sweeps flat across the front at chest height (the edge leads).
    k.animation('attack2', {
      duration: 1.3,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST],
            [0.18, [0.2, 0.42, 0.14]],
            [0.44, [0.17, 0.44, 0.16]],
            [0.5, [0.2, 0.44, 0.17]],
            [0.58, [0.3, 0.44, 0.16]],
            [0.68, [0.35, 0.42, 0.07]],
            [0.78, [0.35, 0.42, 0.07]],
            [0.92, [0.3, 0.36, 0.06]],
            [1, WRIST],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, [0, 1, 0]],
            [0.18, [-0.5, 0.2, 0.84]],
            [0.44, [-0.55, 0.15, 0.82]],
            [0.5, [-0.25, 0.15, 0.96]],
            [0.58, [0.35, 0.12, 0.93]],
            [0.68, [0.7, 0.1, 0.7]],
            [0.78, [0.7, 0.1, 0.7]],
            [0.92, [0.3, 0.7, 0.6]],
            [1, [0, 1, 0]],
          ] as const,
          'spline',
        );
        // The blade flat is horizontal (normal down) while the spear is level; upright at the ends.
        const flat = keys(p, [[0, [0, 0, 1]], [0.18, [0, -0.9, 0.3]], [0.78, [0, -1, 0]], [0.95, [0, -0.6, 0.6]], [1, [0, 0, 1]]] as const);
        const sp = spearArm(wrist, dir, norm(flat));
        const sh = shake(p, 0.7, 0.12, 4);
        const hipsY = keys(p, [[0, 0], [0.18, -8], [0.44, -10], [0.6, 10], [0.78, 12], [0.95, 0], [1, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.18, -12], [0.44, -20], [0.6, 18], [0.78, 22], [0.95, 0], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.18, 6], [0.44, 8], [0.6, 8], [0.78, 5], [1, 0]] as const);
        const hipsZ = keys(p, [[0, 0], [0.3, -0.008], [0.44, -0.012], [0.58, 0.025], [0.8, 0.025], [1, 0]] as const);
        const stepL = keys(p, [[0, 0], [0.3, -4], [0.44, -6], [0.56, -18], [0.8, -16], [1, 0]] as const);
        const drop = keys(p, [[0, 0], [0.4, 0.008], [0.6, 0.018], [0.8, 0.016], [1, 0]] as const);
        const lg = lunge(hipsZ, stepL, drop);
        const offWrist = keys(p, [[0, mx(WRIST)], [0.18, [-0.3, 0.38, 0.1]], [0.44, [-0.32, 0.38, -0.1]], [0.6, [-0.36, 0.42, 0.06]], [0.78, [-0.4, 0.44, 0.1]], [1, mx(WRIST)]] as const);
        const off = reach(ARM_R, offWrist, POLE_R);
        return {
          hips: { move: [0, lg.y, hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [3 * sh, chestY, 0] },
          head: { rotate: [-lean * 0.6, -(chestY + hipsY) * 0.7, 0] },
          knot: { rotate: [-lean * 0.8 + 10 * sh, 0, -chestY * 0.3] },
          'upperarm.L': { rotate: sp.arm.upper },
          'forearm.L': { rotate: sp.arm.lower },
          'hand.L': { rotate: sp.hand },
          'upperarm.R': { rotate: off.upper },
          'forearm.R': { rotate: off.lower },
          'leg.L': { rotate: [lg.legL, -hipsY, 0] },
          'leg.R': { rotate: [lg.legR, -hipsY, 0] },
          'foot.L': { rotate: [-lg.legL, 0, 0] },
          'foot.R': { rotate: [-lg.legR, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ roar: a howling snarl with the spear raised
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
        const lift = Math.max(0, rise);
        const crouch = Math.max(0, -rise);
        const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
        const wrist = keys(p, [[0, WRIST], [0.16, [0.36, 0.33, 0.1]], [0.3, [0.4, 0.66, 0.06]], [0.8, [0.4, 0.66, 0.06]], [1, WRIST]] as const, 'smooth');
        const dir = norm(keys(p, [[0, [0, 1, 0]], [0.16, [0, 1, 0]], [0.3, [0.12, 1, 0.08]], [0.8, [0.12, 1, 0.08]], [1, [0, 1, 0]]] as const, 'smooth'));
        const sp = spearArm(wrist, dir, [0, 0, 1]);
        const fist = reach(ARM_R, keys(p, [[0, mx(WRIST)], [0.16, [-0.28, 0.33, 0.1]], [0.3, [-0.38, 0.64, 0.06]], [0.8, [-0.38, 0.64, 0.06]], [1, mx(WRIST)]] as const, 'smooth'), POLE_R);
        return {
          hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
          spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
          chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0], scale: [1 + 0.04 * lift, 1, 1 + 0.03 * lift] },
          neck: { rotate: [6 * crouch - 8 * lift, 0, 0] },
          head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
          knot: { rotate: [-12 * crouch + 18 * lift + 8 * tremble, 0, 6 * tremble] },
          'upperarm.L': { rotate: sp.arm.upper },
          'forearm.L': { rotate: sp.arm.lower },
          'hand.L': { rotate: sp.hand },
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
        const legL = dg(Math.atan2(back, 0.19));
        const upper: V3 = [12 * r, 0, 24 * r];
        const lower: V3 = [-22 * r, 0, 0];
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
          spine: { rotate: [-8 * r, 0, 3 * r] },
          chest: { rotate: [-9 * r, 7 * r, 0] },
          neck: { rotate: [-5 * r, 0, 0] },
          head: { rotate: [-14 * r, -9 * r, 6 * r] },
          knot: { rotate: [18 * r, 0, -10 * r] },
          'upperarm.L': { rotate: upper },
          'forearm.L': { rotate: lower },
          'hand.L': { rotate: orient([upper, lower], SPEAR, { dir: norm([0.1 * r, 1, -0.2 * r]), up: [0, 0, 1] }) },
          'upperarm.R': { rotate: [10 * r, 0, -18 * r] },
          'forearm.R': { rotate: [-12 * r, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] },
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
          'hand.L': { rotate: [0, 0, keys(p, [[0, 0], [0.08, -22], [0.4, -22], [0.55, -70], [1, -70]] as const)] },
          'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -45], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, -22], [0.4, -10], [0.58, -35], [0.7, -58], [1, -60]] as const)] },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
          'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
          'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
          'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
          'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
        };
      },
    });
  },
});
