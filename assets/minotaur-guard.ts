import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Minotaur guard — Chibi Quest enemy and mini-boss of the Sunken Vault (catalog
 * `enemies/humanoid/minotaur-guard`), about 1.2 m to the tips of its horns, faces +Z.
 * Target: docs/enemy-mockups/minotaur-guard_001.jpg (one front view; it shows two hammers, this
 * model carries ONE big two-handed iron maul instead).
 *
 * Base: assets/orc-warrior.ts (the same skeleton, knee bones, clip set, and weapon hand).
 * Role: a heavy dungeon brute, bigger than the heroes, seen in 3D and as a 128 px sprite; the
 *   horns, the wide muzzle with the brass ring, and the maul must read.
 * One idea: a stocky bull-headed brute that is all horns, mane, and shoulders, on short furry legs
 *   and hooves, with a slab-headed maul held ready at its side.
 * Proportions: horn tips 1.18 (the crescent spans 0.78 m), mane top 0.99, eyes 0.77, nose 0.67,
 *   chin 0.54, beard point 0.4, shoulders 0.55, belt 0.33, fur hem 0.12, hooves 0.09.
 * Palette: tan skin #d6a276; brown fur #6e4526 / #4a2c18; ivory horns with dark tips; dark iron
 *   #50555c (chest plate, pauldrons, maul); brass #d0a040 (nose ring, buckle, studs) as accent;
 *   red eyes.
 * Bodies: skin (head, muzzle, body, arms), mane (mane, beard, brows, forelock), horns, fur (the
 *   loincloth, the leg fur), hooves, iron (chest plate, pauldrons), brass, leather (bracers, belt),
 *   maul-head, haft.
 * Rig: the orc's chibi humanoid; `knot` carries the forelock tuft; the maul is rigid on `hand.R`.
 *   Clips: idle, walk, run, attack (an overhead maul smash), attack2 (a shoulder charge and a
 *   backhand swipe), roar, hit, death (topples onto its back).
 */

const C = {
  skin: '#d6a276',
  skinDark: '#b07a52',
  nose: '#e2b494',
  earIn: '#c9867a',
  sclera: '#efe4d2',
  eye: '#c8281c',
  pupil: '#141010',
  lid: '#5a3020',
  mouth: '#4a2418',
  nostril: '#2e1610',
  fur: '#6e4526',
  furDark: '#4a2c18',
  horn: '#d9ccb0',
  hornTip: '#605a55',
  iron: '#50555c',
  ironLight: '#7c828a',
  brass: '#d0a040',
  leather: '#5a3420',
  leatherDark: '#3a2014',
  hoof: '#58504a',
  wood: '#6a4228',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Joints (the orc's): wide shoulders, arms hanging out from the body, a wide stance.
const SHOULDER: V3 = [0.22, 0.52, 0];
const ELBOW: V3 = [0.31, 0.4, 0.02];
const WRIST: V3 = [0.345, 0.3, 0.05];
const HIP: V3 = [0.1, 0.25, 0];
const ANKLE: V3 = [0.155, 0.075, 0];
const KNEE: V3 = [0.1275, 0.1625, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left hoof (y = 0): heel and toe. The hoof turns out 8 degrees.
const SOLE_HEEL: V3 = [0.146, 0, -0.062];
const SOLE_TOE: V3 = [0.169, 0, 0.097];
const HEAD_Y = 0.775;

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
  name: 'minotaur-guard',
  description: 'Chibi minotaur guard mini-boss: big crescent horns, a shaggy mane and beard, a brass nose ring, an iron chest plate, a fur loincloth, hooves, and a big iron maul.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/minotaur-guard_001.jpg',
  // Color slots for individual minotaurs (the first option is the default look).
  variants: {
    fur: { brown: C.fur, black: '#2a2220', tan: '#9a7248', grey: '#66625c' },
    horns: { ivory: C.horn, dark: '#5a5048' },
    eyes: { red: C.eye, yellow: '#e8b020', black: '#1c1614' },
  },
  presets: {
    blackhide: { fur: 'black', horns: 'ivory', eyes: 'red' },
    sandhorn: { fur: 'tan', horns: 'dark', eyes: 'yellow' },
    greybeard: { fur: 'grey', horns: 'ivory', eyes: 'black' },
  },

  build(k) {
    // The slot colors (see variants). Darker fur and horn tips are offsets from the slot color,
    // so they follow the slot when a game recolors it.
    const T = {
      eye: k.tint('eyes'),
      fur: k.tint('fur'),
      horn: k.tint('horns'),
    };
    const shadeOf = (body: string, shade: string) => {
      const a = rgb(body);
      const b = rgb(shade);
      return [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
    };
    const KNOT: V3 = [0, 0.955, 0.0];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.26, 0] },
      spine: { parent: 'hips', at: [0, 0.34, 0] },
      chest: { parent: 'spine', at: [0, 0.44, 0] },
      neck: { parent: 'chest', at: [0, 0.54, -0.01] },
      head: { parent: 'neck', at: [0, 0.58, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [0, 0.99, 0.1] },
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

    // ------------------------------------------------------------------ head: a bull's head
    const cranium = sdf.ellipsoid([0.175, 0.17, 0.165]).at(0, HEAD_Y, -0.02);
    const headBase = sdf.smoothUnion(
      0.045,
      cranium,
      sdf.ellipsoid([0.162, 0.1, 0.11]).at(0, 0.645, 0.095), // the wide muzzle
      sdf.ellipsoid([0.105, 0.045, 0.075]).at(0, 0.578, 0.085), // the chin
      sdf.ellipsoid([0.15, 0.034, 0.06]).at(0, 0.812, 0.105), // a heavy brow ridge
    );
    const faceZ0 = (x: number, y: number) => sdf.raycast(headBase, [x, y, 1], [0, 0, -1])![2];
    // A broad, flat nose pad on the front of the muzzle, with two slanted nostrils.
    const NOSE_Y = 0.672;
    const nosePad = sdf.ellipsoid([0.108, 0.05, 0.035]).at(0, NOSE_Y, faceZ0(0, NOSE_Y) - 0.014);
    const noseFront = faceZ0(0, NOSE_Y) + 0.021;
    const nostrilCut = pair(sdf.ellipsoid([0.015, 0.009, 0.012]).rotateZ(22).at(0.036, NOSE_Y - 0.004, noseFront - 0.002));
    const head = sdf.smoothUnion(0.045, headBase, nosePad).smoothSubtract(0.004, nostrilCut).bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    // Small cupped ears that stick out sideways under the horns.
    const earShape = sdf.ellipsoid([0.062, 0.032, 0.024]).rotateZ(-18).at(0.25, 0.785, -0.01);
    const earCup = sdf.ellipsoid([0.046, 0.02, 0.02]).rotateZ(-18).at(0.258, 0.782, 0.01);
    const ears = pair(earShape.smoothSubtract(0.006, earCup)).bone('head');
    const neck = sdf.capsule([0, 0.5, -0.01], [0, 0.62, -0.01], 0.1).bone('neck');

    // ------------------------------------------------------------------ torso, arms, legs
    const torsoParts = () => [
      sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0),
      sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02),
      pair(sdf.sphere(0.1).at(0.155, 0.545, -0.02)), // traps
      pair(sdf.ellipsoid([0.088, 0.062, 0.05]).at(0.076, 0.48, 0.1)), // pecs
    ];
    const [chestE, bellyE, traps, pecs] = torsoParts();
    const trunk = sdf.smoothUnion(0.06, chestE!.bone('chest'), bellyE!.bone('spine'), traps!.bone('chest'), pecs!.bone('chest'));
    const torsoShape = sdf.smoothUnion(0.06, ...torsoParts());
    // Blocky abdominal muscles on the belly, set on its surface.
    const belly = sdf.smoothUnion(0.06, sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0), sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02));
    const abs = pair(
      sdf.union(
        ...[0.405, 0.365].map((y, i) => {
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
        sdf.cone(sh, el, 0.09, 0.075).bone(`upperarm.${side}`),
        sdf.ellipsoid([0.07, 0.08, 0.068]).at(...lerp(sh, el, 0.5)).bone(`upperarm.${side}`), // biceps
        sdf.cone(el, wr, 0.075, 0.068).bone(`forearm.${side}`),
        fistAt(wr, s).bone(`hand.${side}`),
      );
    };
    const legs = pair(sdf.capsule([HIP[0], 0.26, 0], [ANKLE[0], 0.1, 0.01], 0.078).bone('leg.L'));

    // ------------------------------------------------------------------ face paint
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const EYE: V3 = [0.074, 0.768, 0];
    const eyeBall = pair(at(sdf.ellipsoid([0.04, 0.034, 0.07]), EYE[0], EYE[1]));
    const iris = pair(at(sdf.ellipsoid([0.024, 0.027, 0.07]), EYE[0] - 0.008, EYE[1] - 0.003));
    const pupil = pair(at(sdf.ellipsoid([0.011, 0.015, 0.07]), EYE[0] - 0.009, EYE[1] - 0.004));
    // The upper lid cuts across each eye on a slant, low at the inner end: a scowl.
    const lidL = sdf
      .extrude(
        profile.polygon([
          [EYE[0] - 0.05, EYE[1] + 0.008],
          [EYE[0] + 0.05, EYE[1] + 0.03],
          [EYE[0] + 0.05, EYE[1] + 0.07],
          [EYE[0] - 0.05, EYE[1] + 0.07],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const lids = pair(lidL);
    const shine = sdf.union(...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.007), x - 0.004, EYE[1] + 0.006)));
    const MOUTH_Y = 0.598;
    const mouth = sdf.extrude(profile.arc(0.05, 0.009, 52, 128), 0.4).at(0, MOUTH_Y - 0.05, 0.2);
    const nostrils = pair(sdf.ellipsoid([0.017, 0.01, 0.05]).rotateZ(22).at(0.036, NOSE_Y - 0.004, noseFront));
    const skin = sdf
      .smoothUnion(0.04, head, neck)
      .smoothUnion(0.012, ears)
      .smoothUnion(0.05, trunk)
      .smoothUnion(0.012, abs)
      .union(armAt(1), armAt(-1))
      .smoothUnion(0.03, legs)
      .paintWhere(nosePad.round(0.003), C.nose, 0.006)
      .paintWhere(nostrils, C.nostril, 0.003)
      .paintWhere(pair(earCup.round(0.004)), C.earIn, 0.004)
      .paintWhere(eyeBall, C.sclera, 0.002)
      .paintWhere(iris, T.eye, 0.002)
      .paintWhere(pupil, C.pupil, 0.002)
      .paintWhere(shine, '#ffffff', 0.002)
      .paintWhere(lids.intersect(eyeBall.round(0.006)), C.lid, 0.002)
      .paintWhere(mouth, C.mouth, 0.003)
      .paintWhere(pair(sdf.extrude(profile.rect([0.006, 0.07], 0.003), 0.4).rotateZ(-8).at(0.055, 0.36, 0.2)), C.skinDark, 0.01); // belly lines
    k.body('skin', skin, { color: C.skin, roughness: 0.6, textureDensity: 2, detail: 0.0056 });

    // ------------------------------------------------------------------ mane, beard, brows, forelock (fur)
    // Soft puffy break-up for the mane.
    const puffy = (x: number, y: number, z: number) => noise.fbm(x * 26, y * 26, z * 26, 2);
    // Shaggy locks: vertical tufts around the head with a noisy break-up.
    const locks = (x: number, y: number, z: number) =>
      0.6 * Math.sin(Math.atan2(x, z) * 15 + Math.sin(y * 45) * 0.9 + noise.fbm(x * 14, y * 10, z * 14, 2) * 2) + 0.4 * noise.fbm(x * 28, y * 22, z * 28, 2);
    // The mane: a round fluffy mass. Twelve overlapping puffs ring the face and neck (open over
    // the face), joined with the skull cap, then broken up with soft noise.
    const faceMask = sdf.ellipsoid([0.19, 0.2, 0.2]).at(0, 0.66, 0.17);
    const puffR = [0.095, 0.09, 0.1, 0.085, 0.11, 0.09, 0.1, 0.085, 0.105, 0.09, 0.095, 0.1];
    const puffs = puffR.map((r, i) => {
      const a = (i / puffR.length) * Math.PI * 2 + 0.26;
      const bottom = Math.max(0, -Math.sin(a));
      return sdf.sphere(r).at(0.175 * Math.cos(a), 0.745 + 0.145 * Math.sin(a) - 0.05 * bottom, -0.015 - 0.03 * bottom);
    });
    const mane = sdf
      .smoothUnion(
        0.03,
        cranium.round(0.03).bone('head'),
        sdf.sphere(0.15).at(0, 0.74, -0.07).bone('head'),
        ...puffs.map((s) => s.bone('head')),
        sdf.ellipsoid([0.215, 0.13, 0.17]).at(0, 0.6, -0.055).bone('neck'),
      )
      .smoothSubtract(0.02, faceMask)
      .displace(0.01, puffy, 2);
    // A wide, pointed beard that hangs from the chin over the chest plate.
    const jawZ = faceZ(0, 0.56);
    const beardStrands = (x: number, y: number, _z: number) => Math.sin(x * 90 + Math.sin(y * 30) * 1.5);
    const beard = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.115, 0.042, 0.06]).at(0, 0.56, jawZ - 0.045),
        sdf.cone([0, 0.545, jawZ - 0.03], [0, 0.42, jawZ + 0.022], 0.07, 0.014),
      )
      .displace(0.005, beardStrands)
      .bone('head');
    // Thick brows over the eyes; the inner ends dip toward the nose.
    const browAt = (x: number, y: number): V3 => [x, y, faceZ(Math.abs(x), y) - 0.006];
    const brows = pair(
      sdf.chain(
        [
          [...browAt(EYE[0] + 0.056, EYE[1] + 0.056), 0.016],
          [...browAt(EYE[0] + 0.006, EYE[1] + 0.042), 0.02],
          [...browAt(EYE[0] - 0.046, EYE[1] + 0.02), 0.017],
        ],
        0.008,
      ),
    ).bone('head');
    // A shaggy forelock tuft on top of the head that curls forward (on the `knot` bone).
    const forelock = sdf
      .chain(
        [
          [0, 0.93, -0.04, 0.05],
          [0.01, 0.99, 0.01, 0.042],
          [0, 1.005, 0.07, 0.03],
          [-0.008, 0.975, 0.115, 0.013],
        ],
        0.02,
      )
      .displace(0.008, locks)
      .bone('knot');
    const furDark = shadeOf(C.fur, C.furDark);
    const plus = (c: readonly [number, number, number], d: readonly [number, number, number], t = 1) =>
      [c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t] as const;
    // The grooves between the locks go darker, so the shag reads.
    const furPaint = (x: number, y: number, z: number, base: readonly [number, number, number]) =>
      locks(x, y, z) < -0.2 ? plus(base, furDark) : locks(x, y, z) < 0.05 ? plus(base, furDark, 0.45) : base;
    const furBump = (x: number, y: number, z: number) => 0.0012 * noise.fbm(x * 90, y * 25, z * 90, 2);
    const manePaint = (x: number, y: number, z: number, base: readonly [number, number, number]) =>
      puffy(x, y, z) < -0.25 ? plus(base, furDark) : puffy(x, y, z) < 0 ? plus(base, furDark, 0.4) : base;
    k.body('mane', sdf.union(sdf.smoothUnion(0.015, mane, forelock), beard, brows).paintFn((x, y, z, base) => (y > 0.66 && Math.abs(x) < 0.05 && z > -0.1 ? furPaint(x, y, z, base) : manePaint(x, y, z, base))), {
      color: T.fur,
      roughness: 0.92,
      detail: 0.0076,
      bump: furBump,
    });

    // ------------------------------------------------------------------ horns
    // Thick, low crescents: out sideways from the temples, then curling up and a little forward.
    // Ivory, with dark bases where they leave the mane and a dark tip.
    const horns = pair(
      sdf.chain(
        [
          [0.13, 0.875, 0.0, 0.08],
          [0.235, 0.875, 0.02, 0.078],
          [0.33, 0.9, 0.045, 0.07],
          [0.4, 0.97, 0.07, 0.058],
          [0.405, 1.06, 0.09, 0.04],
          [0.365, 1.12, 0.1, 0.024],
        ],
        0.03,
      ),
    ).bone('head');
    const hornTip = shadeOf(C.horn, C.hornTip);
    const hornBase = shadeOf(C.horn, '#8a7a68');
    k.body(
      'horns',
      horns.paintFn((x, y, z, base) => {
        const ax = Math.abs(x);
        const tipT = smooth01(1.0, 1.08, y + 0.02 * noise.fbm(x * 30, y * 30, z * 30, 2));
        const baseT = 1 - smooth01(0.2, 0.28, ax);
        return plus(plus(base, hornTip, tipT * 0.8), hornBase, baseT);
      }),
      { color: T.horn, roughness: 0.4, detail: 0.005 },
    );

    // ------------------------------------------------------------------ iron: chest plate, pauldrons
    const ironBump = (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2);
    // A heavy plate over the chest and the shoulders, with a worn light rim along its lower edge.
    const plate = torsoShape
      .round(0.018)
      .smoothIntersect(0.006, sdf.box([0.8, 0.26, 0.8], 0.01).at(0, 0.575, 0))
      .paintWhere(sdf.box([0.8, 0.018, 0.8]).at(0, 0.452, 0), C.ironLight, 0.004);
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.12 * s, 0.075 * s, 0.11 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.004);
    const pauldronLocal = sdf.union(lame(1), lame(1.12).at(0, -0.04, 0));
    const pauldronL = pauldronLocal.scale(1.08).rotateZ(-28).at(0.258, 0.585, -0.005).bone('upperarm.L');
    const pauldronR = pauldronLocal.scale(1.08).rotateZ(28).at(-0.258, 0.585, -0.005).bone('upperarm.R');
    k.body('iron', sdf.union(plate.bone('chest'), pauldronL, pauldronR), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.75,
      bump: ironBump,
      detail: 0.006,
    });

    // ------------------------------------------------------------------ leather: bracers, belt
    const bracer = (e: V3, w: V3) => {
      const d = norm(sub(w, e));
      const along = (x: number, y: number, z: number) => (x - e[0]) * d[0] + (y - e[1]) * d[1] + (z - e[2]) * d[2];
      const creases = (x: number, y: number, z: number) => Math.sin(along(x, y, z) * 70 + noise.fbm(x * 12, y * 12, z * 12, 2) * 1.2);
      const cuff = sdf
        .smoothUnion(
          0.01,
          sdf.cone(lerp(e, w, 0.06), lerp(e, w, 1.0), 0.1, 0.086),
          sdf.cone(lerp(e, w, 0.0), lerp(e, w, 0.14), 0.108, 0.102), // the rolled top edge
        )
        .displace(0.003, creases, 1.3)
        .round(0.002);
      const band = (t: number) => sdf.cone(lerp(e, w, t - 0.03), lerp(e, w, t + 0.03), 0.2, 0.2);
      return cuff.paintWhere(band(0.18), C.leatherDark, 0.004).paintWhere(band(0.86), C.leatherDark, 0.004);
    };
    const bracers = sdf.union(bracer(ELBOW, WRIST).bone('forearm.L'), bracer(mx(ELBOW), mx(WRIST)).bone('forearm.R'));
    const trunkShape = sdf.smoothUnion(0.06, sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0), sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02));
    const beltY = 0.33;
    const belt = trunkShape.round(0.016).smoothIntersect(0.006, sdf.box([0.6, 0.06, 0.6], 0.008).at(0, beltY, 0));
    // Three leather flaps hang from the belt over the fur, each with a brass stud.
    const flapAt = (deg: number, w: number, h: number, y: number) => {
      const ang = (deg * Math.PI) / 180;
      const R = 0.245;
      return sdf
        .box([w, h, 0.022], 0.009)
        .rotateX(-4)
        .rotateY(deg)
        .at(R * Math.sin(ang), y, 0.018 + R * 0.84 * Math.cos(ang));
    };
    const FLAPS: readonly [number, number, number, number][] = [
      [0, 0.1, 0.17, 0.2],
      [-38, 0.085, 0.14, 0.21],
      [38, 0.085, 0.14, 0.21],
    ];
    const flaps = sdf.union(...FLAPS.map(([d, w, h, y]) => flapAt(d, w, h, y))).bone('hips');
    k.body('leather', sdf.union(bracers, belt.bone('spine'), flaps), { color: C.leather, roughness: 0.6, detail: 0.006 });

    // ------------------------------------------------------------------ brass: nose ring, buckle, belt studs, plate rivets
    const ringZ = faceZ(0, NOSE_Y - 0.03) - 0.004;
    const noseRing = sdf.torus(0.03, 0.0065).rotateX(90).at(0, NOSE_Y - 0.058, ringZ).bone('head');
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.cylinder(0.05, 0.016, 0.006).rotateX(90), sdf.sphere(0.03).scale([1, 1, 0.55]).at(0, 0, 0.01))
      .at(0, beltY, beltZ + 0.006)
      .bone('spine');
    const studs = sdf
      .union(
        ...[-150, -115, -80, -50, 50, 80, 115, 150, 180].map((a) => {
          const r = (a * Math.PI) / 180;
          return sdf.sphere(0.012).at(...sdf.surfacePoint(belt, [0.4 * Math.sin(r), beltY, 0.4 * Math.cos(r)], 0.002));
        }),
      )
      .bone('spine');
    const rivets = sdf
      .union(
        ...[-0.19, -0.12, 0.12, 0.19].map((x) => sdf.sphere(0.011).at(...sdf.surfacePoint(plate, [x, 0.468, 0.3], 0.002))),
      )
      .bone('chest');
    const flapStuds = sdf
      .union(
        ...FLAPS.map(([d, , h, y]) => {
          const ang = (d * Math.PI) / 180;
          const R = 0.245 + 0.014;
          return sdf.sphere(0.012).at(R * Math.sin(ang), y + h * 0.22, 0.018 + R * 0.84 * Math.cos(ang));
        }),
      )
      .bone('hips');
    k.body('brass', sdf.union(noseRing, buckle, studs, rivets, flapStuds), { color: C.brass, roughness: 0.3, metalness: 1, detail: 0.005 });

    // ------------------------------------------------------------------ the maul
    // Local frame: the grip at the origin, the haft down (-Y), the slab head across the haft along
    // local X (its striking faces lead in a swing), flared faces, iron bands on the haft.
    const MAUL_Y = -0.37;
    const maulHead = sdf
      .union(
        sdf.box([0.26, 0.15, 0.12], 0.014).at(0, MAUL_Y, 0),
        ...[-1, 1].map((s) => sdf.box([0.034, 0.17, 0.14], 0.01).at(s * 0.128, MAUL_Y, 0)), // the flared faces
        sdf.cylinder(0.034, 0.03, 0.006).at(0, MAUL_Y + 0.085, 0), // the socket collar
        sdf.cylinder(0.026, 0.018, 0.004).at(0, -0.17, 0), // a band on the haft
        sdf.sphere(0.028).at(0, 0.05, 0), // the pommel
      )
      .paintWhere(sdf.box([0.4, 0.2, 0.3]).at(0, MAUL_Y, 0).subtract(sdf.box([0.22, 0.3, 0.4]).at(0, MAUL_Y, 0)), C.ironLight, 0.004);
    const haft = sdf
      .cylinder(0.024, 0.44, 0.006)
      .at(0, -0.18, 0)
      .paintWhere(sdf.box([0.1, 0.13, 0.1]).at(0, -0.005, 0), C.leatherDark, 0.004); // the leather grip wrap
    const GRIP: V3 = [-WRIST[0] - 0.006, WRIST[1] - 0.064, WRIST[2] + 0.02];
    // Held ready at the side: the haft out and forward, the slab head upright like the mockup's hammers.
    const maulPose = (s: sdf.Shape) => s.rotateY(90).rotateZ(-40).rotateX(-85).at(...GRIP);
    k.body('maul-head', maulPose(maulHead), { color: C.iron, roughness: 0.45, metalness: 0.8, bump: ironBump, bone: 'hand.R', detail: 0.005 });
    k.body('haft', maulPose(haft), {
      color: C.wood,
      roughness: 0.75,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 30, y * 200, z * 30, 2),
    });

    // ------------------------------------------------------------------ fur: loincloth and leg fur
    // A chunky fur wrap around the hips: a plain shell under the belt, with two staggered rows of
    // fat teardrop tufts hanging over it (ten in the upper row, nine in the hem row).
    const skirtCone = (grow: number, top: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, top],
            [0.176 + grow, top],
            [0.176 + grow, 0.33],
            [0.2 + grow, 0.25],
            [0.222 + grow, 0.17],
            [0.226 + grow, 0.14],
            [0, 0.14],
          ]),
        )
        .scale([1, 1, 0.84])
        .at(0, 0, 0.018);
    const tuft = (a: number, y: number, R: number, rx: number, ry: number, i: number) => {
      const ang = (a * Math.PI) / 180;
      const r = R + (noise.random(i, 3, 1) - 0.5) * 0.012;
      return sdf
        .ellipsoid([rx, ry, rx * 0.95])
        .rotateZ((noise.random(i, 3, 2) - 0.5) * 8)
        .at(r * Math.sin(ang), y, 0.018 + r * 0.84 * Math.cos(ang));
    };
    const tufts1 = Array.from({ length: 10 }, (_, i) => tuft(i * 36 + 18, 0.2, 0.19, 0.06 + noise.random(i, 4, 1) * 0.01, 0.09, i));
    const tufts2 = Array.from({ length: 9 }, (_, i) => tuft(i * 40, 0.15, 0.205, 0.056 + noise.random(i, 4, 2) * 0.012, 0.085, i + 20));
    const clumpy = (x: number, y: number, z: number) => noise.fbm(x * 30, y * 30, z * 30, 2);
    const skirt = sdf
      .smoothUnion(0.02, skirtCone(0, 0.33).subtract(skirtCone(-0.014, 0.45)), ...tufts1, ...tufts2)
      .intersect(sdf.halfSpace([0, 1, 0], 0.34))
      .displace(0.008, clumpy, 1.5);
    const loincloth = sdf.union(
      skirt.intersect(sdf.halfSpace([0, -1, 0], -0.25)).bone('hips'),
      skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([-1, 0, 0], 0)).bone('leg.L'),
      skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([1, 0, 0], 0)).bone('leg.R'),
    );
    // Shaggy fur on the shins, with a ragged fetlock over the hoof.
    const tufts = (x: number, y: number, z: number) => {
      const a = Math.atan2(x - ANKLE[0], z);
      return 0.55 * Math.sin(a * 14 + noise.fbm(x * 40, y * 20, z * 40, 2) * 3) + 0.45 * noise.fbm(x * 70, y * 30, z * 70, 2);
    };
    const legFur = pair(
      sdf
        .smoothUnion(0.025, sdf.cone([0.132, 0.215, 0.004], [0.152, 0.11, 0.008], 0.088, 0.096), sdf.torus(0.086, 0.024).at(0.153, 0.098, 0.01))
        .displace(0.012, tufts, 2)
        .bone('leg.L'),
    );
    // Shaggy fur hanging from under the pauldrons over the upper arms.
    const shoulderFur = sdf
      .union(
        sdf.ellipsoid([0.095, 0.07, 0.1]).at(0.27, 0.495, -0.01).bone('upperarm.L'),
        sdf.ellipsoid([0.095, 0.07, 0.1]).at(-0.27, 0.495, -0.01).bone('upperarm.R'),
      )
      .displace(0.012, locks, 2)
      .paintFn(furPaint);
    const skirtPaint = (x: number, y: number, z: number, base: readonly [number, number, number]) => {
      const g = clumpy(x, y, z);
      const hem = Math.min(1, Math.max(0, (0.24 - y) / 0.1));
      return plus(base, furDark, Math.min(1, (g < -0.25 ? 0.6 : g < 0 ? 0.25 : 0) + hem * 0.3));
    };
    k.body(
      'fur',
      sdf.union(shoulderFur, loincloth.paintFn(skirtPaint), legFur.paintFn((x, y, z, base) => (tufts(x < 0 ? -x : x, y, z) > 0.25 ? plus(base, furDark) : base))),
      { color: T.fur, roughness: 0.95, bump: furBump, detail: 0.0088 },
    );

    // ------------------------------------------------------------------ hooves
    const hoofLocal = sdf
      .cone([0, 0, 0.018], [0, 0.082, 0.0], 0.074, 0.058)
      .round(0.006)
      .smoothSubtract(0.004, sdf.box([0.01, 0.2, 0.1]).at(0, 0.05, 0.088)) // the cloven split at the front
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const hooves = pair(hoofLocal.rotateY(8).at(ANKLE[0], 0, 0).bone('foot.L'));
    k.body('hooves', hooves, { color: C.hoof, roughness: 0.55 });

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
    // `carry` bends the maul arm (degrees) on its back swing, so the maul head stays above the floor.
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
          'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -4] as const },
          'forearm.L': { rotate: [-armSwing * 0.4 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          ...(carry > 0 && {
            'forearm.R': { rotate: [-carry * (1 - s), 0, 0] as const },
            'hand.R': { rotate: [-carry * 0.5 * (1 - s), 0, 0] as const },
          }),
        };
      },
    });
    // A heavy brute: long, planted steps with a low swing; the run has a short flight.
    k.animation('walk', stride(1.0, 0.11, 0.025, 0.62, 0.008, 20, 4, 4, 14));
    k.animation('run', stride(0.6, 0.16, 0.045, 0.42, 0.03, 36, 12, 3, 20));

    // ------------------------------------------------------------------ attack: a heavy overhead chop, solved by targets
    // Plan (in the chest's rest frame): the maul swings back and up behind the right shoulder, the
    // minotaur coils back onto the rear foot and holds; then the hips and the chest drive forward, the
    // front foot steps in, and the maul comes over the top in the plane beside the head and chops
    // into a target's body in front of the minotaur (the head about 0.4 m high and 0.45 m forward). The
    // edge leads the whole way (the head side faces sideways). An impact shake, a follow-through down and
    // across the body that slows to a stop above the floor, and a slow recovery.
    const { keys, reach, orient } = motion;
    const DEG = Math.PI / 180;
    const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
    const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];
    const rotYv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) + v[2] * Math.sin(d * DEG), v[1], -v[0] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
    // The maul as built by maulPose: the haft from the grip to the head (local -Y) and the normal
    // of the head's side (local +Z, turned by the first 90 degrees).
    const pose3 = (v: V3) => rotXv(rotZv(rotYv(v, 90), -40), -85);
    const AXE = { dir: pose3([0, -1, 0]), up: pose3([0, 0, 1]) };
    const SIDE: V3 = [-1, 0, 0];
    const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const deg = (r: number) => r / DEG;
    // A damped shake after `at`, with `n` swings in `len` of the clip.
    const shake = (p: number, at: number, len: number, n: number) =>
      p < at ? 0 : Math.exp((-(p - at) / len) * 3) * Math.sin(((p - at) / len) * Math.PI * n);

    k.animation('attack', {
      duration: 1.25,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, mx(WRIST)],
            [0.07, [-0.39, 0.45, 0.02]], // lifts and swings out, so the head clears the floor
            [0.13, [-0.37, 0.5, -0.08]],
            [0.25, [-0.37, 0.6, -0.12]],
            [0.34, [-0.385, 0.7, -0.09]],
            [0.43, [-0.39, 0.7, -0.1]], // the hold: coiled at the top, out beside the head
            [0.48, [-0.4, 0.62, 0.1]],
            [0.52, [-0.34, 0.63, 0.13]],
            [0.56, [-0.24, 0.55, 0.14]], // impact at body height
            [0.62, [-0.12, 0.46, 0.24]], // the follow-through: down and across the body
            [0.7, [-0.04, 0.4, 0.3]],
            [0.78, [-0.04, 0.4, 0.3]], // stopped in front of the left knee, the head above the floor
            [0.9, [-0.28, 0.44, 0.15]],
            [1, mx(WRIST)],
          ] as const,
          'spline',
        );
        const axeAt = (q: number) =>
          keys(
            q,
            [
              [0, AXE.dir],
              [0.07, [-0.8, -0.3, 0.15]], // out to the side
              [0.13, [-0.35, -0.35, -0.85]], // swings back past the leg
              [0.25, [-0.25, 0.1, -1]], // straight back
              [0.34, [-0.3, 0.75, -0.6]], // up and back behind the shoulder
              [0.43, [-0.3, 0.62, -0.72]], // the head sags back in the hold
              [0.48, [-0.5, 0.85, 0.2]], // over the top, out past the horn
              [0.52, [-0.15, 0.75, 0.64]], // forward and up
              [0.56, [0.05, 0.28, 1]], // level in front: impact (the chest leans it down a little)
              [0.62, [0.45, -0.2, 0.87]], // down and across
              [0.7, [0.62, -0.4, 0.68]],
              [0.78, [0.62, -0.41, 0.68]],
              [0.9, [0, -0.3, 0.95]],
              [1, AXE.dir],
            ] as const,
            'spline',
          );
        const up = norm(keys(p, [[0, AXE.up], [0.14, SIDE], [0.8, SIDE], [1, AXE.up]] as const, 'smooth'));
        const arm = reach(ARM_R, wrist, keys(p, [[0, [-0.8, 0.3, 0]], [0.34, [-0.7, 0.55, 0.3]], [0.56, [-0.7, 0.3, -0.2]], [1, [-0.8, 0.3, 0]]] as const, 'smooth'));
        const hand = orient([arm.upper, arm.lower], AXE, { dir: norm(axeAt(p)), up });
        // The off hand points at the target in the wind-up, then pulls back hard as the maul falls.
        const offWrist = keys(p, [[0, WRIST], [0.36, [0.31, 0.42, 0.19]], [0.45, [0.32, 0.42, 0.2]], [0.56, [0.34, 0.36, -0.12]], [0.7, [0.34, 0.34, -0.08]], [1, WRIST]] as const, 'smooth');
        const off = reach(ARM_L, offWrist, [0.8, 0.2, -0.3]);
        const sh = shake(p, 0.56, 0.16, 5);
        const hipsY = keys(p, [[0, 0], [0.36, -9], [0.44, -10], [0.52, 7], [0.58, 9], [0.72, 6], [1, 0]] as const);
        const spineX = keys(p, [[0, 0], [0.36, -8], [0.44, -9], [0.52, 6], [0.58, 7], [0.72, 6], [1, 0]] as const);
        const chestX = keys(p, [[0, 0], [0.36, -6], [0.44, -7], [0.52, 4], [0.58, 5], [0.72, 5], [1, 0]] as const) + 3 * sh;
        const chestY = keys(p, [[0, 0], [0.36, -18], [0.44, -20], [0.52, 9], [0.58, 12], [0.72, 9], [1, 0]] as const);
        // The weight goes back onto the rear foot, then forward: the front (left) foot steps in.
        const hipsZ = keys(p, [[0, 0], [0.36, -0.018], [0.44, -0.02], [0.54, 0.035], [0.72, 0.035], [1, 0]] as const);
        const stepL = keys(p, [[0, 0], [0.34, -6], [0.44, -8], [0.53, -24], [0.74, -22], [1, 0]] as const);
        const legR = deg(Math.atan2(hipsZ, 0.19));
        const legL = stepL + legR;
        const drop = keys(p, [[0, 0], [0.4, 0.005], [0.56, 0.02], [0.62, 0.024], [0.74, 0.018], [1, 0]] as const);
        return {
          hips: { move: [0, -Math.max(legDrop(LEG, legL), legDrop(LEG, legR)) - drop - 0.004 * sh, hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [spineX, 0, 0] },
          chest: { rotate: [chestX, chestY, 0] },
          // The head keeps its eyes on the target.
          head: { rotate: [-(spineX + chestX) * 0.55 - 3 * sh, -(chestY + hipsY) * 0.7, 0] },
          knot: { rotate: [-spineX - chestX * 1.2 + 10 * sh, 0, -chestY * 0.4] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: off.upper },
          'forearm.L': { rotate: off.lower },
          'leg.L': { rotate: [legL, -hipsY, 0] },
          'leg.R': { rotate: [legR, -hipsY, 0] },
          'foot.L': { rotate: [-legL - spineX * 0, 0, 0] },
          'foot.R': { rotate: [-legR, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a shoulder charge with the pauldron, then a backhand swipe
    // Plan: the minotaur sinks into a wide stance (the left foot steps back), turns the pauldron
    // shoulder at the target, and tucks the head down behind it; the maul is held across the belly.
    // Two heavy steps (left, then right) carry the hips about 0.3 m forward, and the spiked
    // pauldron rams into the target's chest; a short hold with a shake. Then the body unwinds and
    // the maul swings backhand across the front at the target's waist, a face leading, out to the
    // right. Two steps back to rest. The feet are solved: a planted foot keeps its world position,
    // the swing foot lifts, and the hips drop so the lowest sole stays on the floor.
    const { edgeUp } = motion;
    const UP: V3 = [0, 1, 0];
    const LEG_Y = HIP[1] - ANKLE[1]; // hip joint to ankle (the ankle is straight below the hip in z)
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    type Step = readonly [number, number, number, number]; // phase start, phase end, from z, to z
    const footAt = (steps: readonly Step[], p: number) => {
      let z = 0;
      let lift = 0;
      for (const [a, b, from, to] of steps) {
        if (p >= a) z = from + (to - from) * ease(a, b, p);
        if (p > a && p < b) lift = 0.03 * Math.sin(((p - a) / (b - a)) * Math.PI);
      }
      return { z, lift };
    };
    // The leg angle (degrees, +X swings back) that puts the ankle at world z `footZ`, and the hips
    // drop that keeps that ankle at its rest height. `side` is 1 for the left leg, -1 for the right.
    const legTo = (footZ: number, hipsZ: number, hipsY: number, side: 1 | -1) => {
      const hipZ = hipsZ - side * HIP[0] * Math.sin(hipsY * DEG);
      const a = Math.asin(Math.max(-0.95, Math.min(0.95, (hipZ - footZ) / LEG_Y)));
      return { rot: deg(a), drop: LEG_Y * (1 - Math.cos(a)) };
    };
    const STEPS_L: readonly Step[] = [[0.02, 0.13, 0, -0.2], [0.16, 0.26, -0.2, 0.12], [0.85, 0.95, 0.12, 0]];
    const STEPS_R: readonly Step[] = [[0.26, 0.36, 0, 0.28], [0.72, 0.83, 0.28, 0]];
    // The maul (in the chest's rest frame): across the belly with the head to the left in the
    // charge, cocked further left, then level and forward at contact, out to the right after.
    const swipeAt = (q: number) =>
      keys(
        q,
        [
          [0, AXE.dir],
          [0.15, [0.85, 0.05, 0.5]],
          [0.36, [0.85, 0.05, 0.5]],
          [0.45, [0.85, 0.05, 0.5]],
          [0.49, [0.7, 0.05, 0.65]], // cocked: the head to the left
          [0.54, [0.35, -0.12, 0.93]],
          [0.58, [-0.3, -0.12, 0.95]], // contact: level and forward
          [0.62, [-0.8, -0.1, 0.55]],
          [0.66, [-0.95, -0.1, 0]], // the follow-through, out to the right
          [0.72, [-0.92, -0.2, 0]],
          [0.86, [-0.7, -0.15, 0.7]],
          [1, AXE.dir],
        ] as const,
        'spline',
      );

    k.animation('attack2', {
      duration: 1.15,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.36, 0.1, 5);
        const hipsY = keys(p, [[0, 0], [0.15, 14], [0.45, 14], [0.48, 15], [0.66, -10], [0.72, -10], [0.9, 0]] as const);
        const spineY = keys(p, [[0, 0], [0.15, 14], [0.45, 14], [0.48, 15], [0.66, -10], [0.72, -10], [0.92, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.15, 22], [0.36, 24], [0.45, 24], [0.48, 27], [0.66, -18], [0.72, -18], [0.95, 0]] as const);
        const turn = hipsY + spineY + chestY;
        // The lean toward the target (world +Z); the spine splits it over its X and Z axes because
        // the hips are turned.
        const lean = keys(p, [[0, 0], [0.15, 14], [0.26, 15], [0.36, 20], [0.45, 18], [0.48, 14], [0.66, 6], [0.72, 6], [0.95, 0]] as const);
        const dip = keys(p, [[0, 0], [0.15, 4], [0.36, 8], [0.45, 7], [0.6, 0]] as const); // the pauldron shoulder drops into the ram
        const headX = keys(p, [[0, 0], [0.15, 2], [0.36, -4], [0.45, -4], [0.6, -6], [0.72, -4], [1, 0]] as const);
        const fL = footAt(STEPS_L, p);
        const fR = footAt(STEPS_R, p);
        const hipsZ = (fL.z + fR.z) / 2 + keys(p, [[0, 0], [0.3, 0], [0.36, 0.02], [0.45, 0.015], [0.6, 0.02], [0.72, 0]] as const);
        const legL = legTo(fL.z, hipsZ, hipsY, 1);
        const legR = legTo(fR.z, hipsZ, hipsY, -1);
        const wrist = keys(
          p,
          [
            [0, mx(WRIST)],
            [0.15, [-0.27, 0.36, 0.27]], // tucked: the fist in front of the right side of the belly
            [0.36, [-0.27, 0.36, 0.27]],
            [0.45, [-0.26, 0.36, 0.27]],
            [0.49, [-0.26, 0.37, 0.3]], // cocked across the belly
            [0.54, [-0.28, 0.35, 0.28]],
            [0.58, [-0.27, 0.41, 0.18]], // contact in front
            [0.62, [-0.33, 0.41, 0.1]],
            [0.66, [-0.36, 0.4, 0]],
            [0.72, [-0.36, 0.39, 0]],
            [0.86, [-0.36, 0.33, 0.04]],
            [1, mx(WRIST)],
          ] as const,
          'spline',
        );
        const pole = keys(p, [[0, [-0.8, 0.2, -0.3]], [0.45, [-0.8, 0.2, -0.3]], [0.54, [-0.7, 0.4, 0.3]], [0.66, [-0.6, 0.3, -0.2]], [1, [-0.8, 0.3, 0]]] as const);
        const arm = reach(ARM_R, wrist, pole);
        const flat = norm(keys(p, [[0, AXE.up], [0.15, UP], [0.72, UP], [0.98, AXE.up]] as const));
        const up = p > 0.45 && p < 0.72 ? edgeUp(swipeAt, p, UP) : flat;
        const hand = orient([arm.upper, arm.lower], AXE, { dir: norm(swipeAt(p)), up });
        // The off arm braces forward, pulls back to drive the charge, and swings out in the swipe.
        const offWrist = keys(p, [[0, WRIST], [0.15, [0.3, 0.38, 0.14]], [0.3, [0.32, 0.37, -0.12]], [0.45, [0.32, 0.37, -0.12]], [0.6, [0.36, 0.4, 0.1]], [0.72, [0.36, 0.4, 0.1]], [1, WRIST]] as const);
        const off = reach(ARM_L, offWrist, [0.8, 0.2, -0.3]);
        const h = hipsY * DEG;
        return {
          hips: { move: [0, -Math.min(legL.drop + fL.lift, legR.drop + fR.lift), hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean * Math.cos(h), spineY, lean * Math.sin(h)] },
          chest: { rotate: [3 * sh, chestY, dip + 2 * sh] },
          // The head stays down behind the pauldron, but the eyes turn toward the target.
          head: { rotate: [headX - 3 * sh, -turn * 0.5, 0] },
          knot: { rotate: [-lean * 0.8 + 12 * sh, 0, -chestY * 0.4] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: off.upper },
          'forearm.L': { rotate: off.lower },
          'leg.L': { rotate: [legL.rot, -hipsY, 0], move: [0, fL.lift, 0] },
          'leg.R': { rotate: [legR.rot, -hipsY, 0], move: [0, fR.lift, 0] },
          'foot.L': { rotate: [-legL.rot, 0, 0] },
          'foot.R': { rotate: [-legR.rot, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ roar: a war cry with the maul raised
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
        const lift = Math.max(0, rise);
        const crouch = Math.max(0, -rise);
        // Seven quick trembles while it roars (odd, so the strip does not freeze on them).
        const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
        const axeWrist = keys(p, [[0, mx(WRIST)], [0.16, [-0.3, 0.33, 0.08]], [0.3, [-0.38, 0.66, 0.06]], [0.8, [-0.38, 0.66, 0.06]], [1, mx(WRIST)]] as const, 'smooth');
        const arm = reach(ARM_R, axeWrist, [-0.8, 0.2, -0.2]);
        const axeDir = norm(keys(p, [[0, AXE.dir], [0.16, AXE.dir], [0.3, [-0.5, 0.86, 0.1]], [0.8, [-0.5, 0.86, 0.1]], [1, AXE.dir]] as const, 'smooth'));
        const axeUp = norm(keys(p, [[0, AXE.up], [0.3, [-0.86, -0.5, 0]], [0.8, [-0.86, -0.5, 0]], [1, AXE.up]] as const, 'smooth'));
        const hand = orient([arm.upper, arm.lower], AXE, { dir: axeDir, up: axeUp });
        const fist = reach(ARM_L, keys(p, [[0, WRIST], [0.16, [0.28, 0.33, 0.1]], [0.3, [0.38, 0.64, 0.06]], [0.8, [0.38, 0.64, 0.06]], [1, WRIST]] as const, 'smooth'), [0.8, 0.2, -0.2]);
        return {
          hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
          spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
          chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0], scale: [1 + 0.04 * lift, 1, 1 + 0.03 * lift] },
          neck: { rotate: [6 * crouch - 8 * lift, 0, 0] },
          head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
          knot: { rotate: [-12 * crouch + 18 * lift + 8 * tremble, 0, 6 * tremble] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: fist.upper },
          'forearm.L': { rotate: fist.lower },
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
