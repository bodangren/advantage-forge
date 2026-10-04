import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Satyr — Chibi Quest monster (catalog `monsters/fey-and-spirit/satyr`), a young faun about 0.95 m
 * to the top of his horns, faces +Z. Target: docs/monster-mockups/satyr_001.jpg (made with mmx from
 * the fairy sprite mockup). Built on the dryad (`assets/dryad.ts`: the villager's head, face, and
 * skeleton, the stride, the topple), re-dressed as a satyr boy.
 *
 * Role: a playful trickster of the meadows and the woods (friend or foe); the big curled horns, the
 *   goat ears, and the furry legs with hooves read at 128 px.
 * One idea: a cheerful faun boy with messy brown curls, two big olive horns that curl out and down,
 *   long goat ears that stick out sideways, a white shirt with rolled sleeves under a green vest, a
 *   brown belt with a cream pouch, furry tan goat legs with dark cloven hooves, a little tail, and
 *   wooden pan pipes in his right hand. He attacks with a running butt of his horns.
 * Proportions: the villager's (head center 0.675, eyes 0.628, shoulders 0.385, waist 0.29); the
 *   horns to 0.95 and out to 0.3 at each side; the fur legs from the hips to the hooves.
 * Shape language: round and soft (face, curls, shirt), with the curl of the horns and the points of
 *   the ears as the accents.
 * Palette (60/30/10): white shirt #f4efe4 and green vest #5a9a48; brown curls #6a3e24 and tan fur
 *   #b89870; olive horns #7a7656; pale skin #f2c7a4; dark hooves #3a2a20; wooden pipes #b07a42.
 * Bodies: skin, hair, horns, shirt, vest, belt (with the pouch), fur, hooves, pan-pipes.
 * Rig: the villager's skeleton, `tail` (on `hips`), and `pipes` (on `hand.R`). Clips: idle, walk,
 *   run, attack (a horn butt), hit, death.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#1e120a',
  iris: '#5a3218',
  irisLow: '#8a5228',
  pupil: '#110d0b',
  lid: '#1c130f',
  brow: '#4a2a18',
  mouth: '#a04a40',
  hair: '#6a3e24',
  fur: '#b89870',
  furDark: '#8a6a48',
  horn: '#7a7656',
  hornDark: '#5a5640',
  shirt: '#f4efe4',
  shirtDark: '#ddd4c2',
  vest: '#5a9a48',
  vestDark: '#3e7a34',
  belt: '#7a5236',
  buckle: '#d8b048',
  pouch: '#e8d8b4',
  hoof: '#3a2a20',
  wood: '#b07a42',
  woodDark: '#7a5028',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.19, 0.334, 0.014];
const WRIST: V3 = [0.24, 0.27, 0.045];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const HIPS_AT: V3 = [0, 0.2, 0];
const TAIL_AT: V3 = [0, 0.23, -0.12];
// The right fist and the pan pipes held upright in it.
const FIST_R: V3 = [-0.252, 0.236, 0.06];

/** A relaxed open hand hanging from the left wrist `w`: the palm turned in, the thumb forward. */
const openHandL = (w: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.021, 0.044, 0.036]).rotateZ(16).at(w[0] + 0.012, w[1] - 0.036, w[2] + 0.006),
    sdf.cone([w[0] - 0.004, w[1] - 0.018, w[2] + 0.028], [w[0], w[1] - 0.042, w[2] + 0.05], 0.013, 0.01),
  );
/** The right fist around the pipes: a round fist, the thumb over the front. */
const fistR = sdf.smoothUnion(
  0.012,
  sdf.ellipsoid([0.032, 0.036, 0.034]).at(...FIST_R),
  sdf.cone([FIST_R[0] + 0.014, FIST_R[1] + 0.02, FIST_R[2] + 0.018], [FIST_R[0] + 0.022, FIST_R[1] + 0.004, FIST_R[2] + 0.032], 0.012, 0.01),
);

export default defineAsset({
  name: 'satyr',
  description: 'Chibi satyr monster: a cheerful faun boy with messy brown curls, two big olive horns that curl out and down, long goat ears, big brown eyes, a white shirt with rolled sleeves under a green vest, a brown belt with a cream pouch, furry tan goat legs with dark cloven hooves, a little tail, and wooden pan pipes.',
  detail: 0.005,
  reference: 'docs/monster-mockups/satyr_001.jpg',
  variants: {
    clothing: { green: C.vest, red: '#b0503a', blue: '#4a6aa0' },
    hair: { brown: C.hair, black: '#2a1e1a', auburn: '#8a3e20' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    eyes: { brown: C.iris, green: '#3d7a35', amber: '#b07020' },
  },
  presets: {
    hearth: { clothing: 'red', hair: 'auburn', skin: 'tan', eyes: 'amber' },
    brook: { clothing: 'blue', hair: 'black', skin: 'brown', eyes: 'green' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      fur: k.tint('hair', { color: C.fur, follow: 0.6 }),
      furDark: k.tint('hair', { color: C.furDark, follow: 0.6 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      earInner: k.tint('skin', { color: '#f0a49a', follow: 0.5 }),
      vest: k.tint('clothing'),
      vestDark: k.tint('clothing', { color: C.vestDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: HIPS_AT },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      pipes: { parent: 'hand.R', at: FIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
      tail: { parent: 'hips', at: TAIL_AT, tail: [0, 0.3, -0.17] },
    });

    // ------------------------------------------------------------------ head, face, goat ears, and arms (skin)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.017, 0.016]).at(0, 0.568, faceZ(0, 0.568) - 0.003).bone('head');
    // Long goat ears that stick out sideways and droop a little, cupped in front.
    const earLocal = sdf
      .ellipsoid([0.075, 0.036, 0.022])
      .smoothSubtract(0.006, sdf.ellipsoid([0.055, 0.022, 0.016]).at(0.012, 0, 0.014));
    const earCup = sdf.ellipsoid([0.06, 0.026, 0.02]).at(0.012, 0, 0.012);
    const ears = pair(earLocal.paintWhere(earCup, T.earInner, 0.006).rotateZ(-14).rotateY(-12).at(0.255, 0.6, -0.01).bone('head'));
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.038, 0.034).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.034, 0.03).bone('forearm.L'),
      openHandL(WRIST).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), mx(ELBOW), 0.038, 0.034).bone('upperarm.R'),
      sdf.cone(mx(ELBOW), mx(WRIST), 0.034, 0.03).bone('forearm.R'),
      fistR.bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.043, 0.05, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.037, 0.044, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const lash = pair(sdf.extrude(profile.rect([0.02, 0.008], 0.003), 0.3).rotateZ(30).at(EYE[0] + 0.05, EYE[1] + 0.032, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019), at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022)]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.022, 60, 118), 0.3).at(0.1, 0.725 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.055, 0.011, 242, 298), 0.3).at(0, 0.532 + 0.055, 0.1);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(pair(at(sdf.sphere(0.042), 0.14, 0.565)), T.blush, 0.032)
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
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: a cap and messy curls, a few locks over the forehead
    const faceMask = sdf.ellipsoid([0.23, 0.16, 0.22]).at(0, 0.6, 0.15);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.016, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, faceMask);
    const curl = (x: number, y: number, z: number, r: number) => sdf.sphere(r).at(x, y, z);
    const curls = sdf.smoothUnion(
      0.012,
      curl(0, 0.855, 0.06, 0.05),
      pair(curl(0.08, 0.84, 0.08, 0.045)),
      pair(curl(0.14, 0.79, 0.1, 0.042)),
      pair(curl(0.19, 0.735, 0.06, 0.042)),
      pair(curl(0.205, 0.69, -0.005, 0.04)),
      pair(curl(0.195, 0.7, -0.07, 0.045)),
      pair(curl(0.16, 0.68, -0.135, 0.046)),
      pair(curl(0.09, 0.655, -0.18, 0.048)),
      curl(0, 0.65, -0.195, 0.05),
      pair(curl(0.12, 0.79, -0.13, 0.05)),
      curl(0, 0.83, -0.1, 0.055),
    );
    const onHead = (x: number, y: number, r: number, lift = 0.55): [number, number, number, number] => [x, y, faceZ(Math.abs(x), y) + r * lift, r];
    const locks = sdf.union(
      sdf.chain([onHead(-0.02, 0.83, 0.032), onHead(-0.05, 0.78, 0.028), onHead(-0.06, 0.735, 0.012, 0.9)], 0.012),
      sdf.chain([onHead(0.05, 0.825, 0.03), onHead(0.1, 0.785, 0.026), onHead(0.13, 0.74, 0.012, 0.9)], 0.012),
      sdf.chain([onHead(-0.1, 0.81, 0.03), onHead(-0.15, 0.76, 0.024), onHead(-0.17, 0.71, 0.01, 0.9)], 0.012),
    );
    const hair = sdf
      .smoothUnion(0.02, cap, curls, locks)
      .displace(0.0045, (x, y, z) => noise.fbm(x * 32, y * 32, z * 32, 2));
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ horns: big olive ram horns that curl out and down, ringed
    const hornL = sdf.chain(
      [
        [0.085, 0.82, 0.0, 0.04],
        [0.15, 0.91, -0.02, 0.036],
        [0.235, 0.915, -0.035, 0.03],
        [0.295, 0.845, -0.03, 0.024],
        [0.3, 0.75, -0.01, 0.017],
        [0.27, 0.69, 0.015, 0.012],
        [0.24, 0.68, 0.03, 0.007],
      ],
      0.01,
    );
    const rings = (x: number, y: number, z: number) => Math.sin(Math.hypot(Math.abs(x) - 0.2, y - 0.8, z) * 240);
    const horns = pair(hornL)
      .displace(0.0008, rings)
      .paintFn((x, y, z, base) => (rings(x, y, z) > 0.6 ? rgb(C.hornDark) : base));
    k.body('horns', horns, { color: C.horn, roughness: 0.5, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ shirt: a white tunic with rolled sleeves, its hem below the vest
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.107, 0.44],
            [0.128, 0.4],
            [0.134, 0.35],
            [0.128, 0.3],
            [0.13, 0.25],
            [0.14, 0.2],
            [0.145, 0.176],
            [0.136, 0.166],
            [0, 0.166],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(
          0.016,
          sdf.ellipsoid([0.054, 0.05, 0.052]).at(...lerp([s[0] * 0.95, 0.395, 0], e, 0.25)),
          sdf.cone([s[0] * 0.85, 0.4, 0], lerp(s, e, 0.75), 0.048, 0.044),
          sdf.torus(0.044, 0.011).rotateX(90).rotateZ(s[0] > 0 ? 40 : -40).at(...lerp(s, e, 0.78)), // the rolled cuff
        )
        .bone(tag);
    const shirtFolds = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z) * 9 + y * 30);
    const shirt = sdf
      .union(
        torso.intersect(sdf.halfSpace([0, -1, 0], -0.33)).bone('chest'),
        torso.intersect(sdf.halfSpace([0, 1, 0], 0.33)).intersect(sdf.halfSpace([0, -1, 0], -0.24)).bone('spine'),
        torso.intersect(sdf.halfSpace([0, 1, 0], 0.24)).displace(0.002, shirtFolds).bone('hips'),
        sleeve(SHOULDER, ELBOW, 'upperarm.L'),
        sleeve(mx(SHOULDER), mx(ELBOW), 'upperarm.R'),
      )
      .paintFn((x, y, z, base) => (y < 0.24 && shirtFolds(x, y, z) < -0.8 ? rgb(C.shirtDark) : base));
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85 });

    // ------------------------------------------------------------------ vest: a green vest open in a V at the front, down to the belt
    const shellOf = (s: sdf.Shape, outer: number, inner: number) => s.round(outer).subtract(s.round(inner));
    const vOpen = sdf.extrude(
      profile.polygon(
        [
          [0, 0.3],
          [0.045, 0.47],
          [-0.045, 0.47],
        ],
        { smooth: false },
      ),
      0.4,
      0.006,
    ).at(0, 0, 0.2);
    const vest = shellOf(torso, 0.012, 0.001)
      .intersect(sdf.halfSpace([0, -1, 0], -0.255))
      .intersect(sdf.halfSpace([0, 1, 0], 0.46))
      .subtract(vOpen);
    const vestTrim = shellOf(torso, 0.014, 0.011).intersect(sdf.halfSpace([0, -1, 0], -0.255)).intersect(sdf.halfSpace([0, 1, 0], 0.46)).intersect(vOpen.round(0.008)).subtract(vOpen);
    const button = sdf.sphere(0.011).at(0.035, 0.29, (sdf.raycast(torso, [0.035, 0.29, 1], [0, 0, -1])![2]) + 0.012);
    k.body('vest', sdf.union(vest, vestTrim.paint(T.vestDark), button.paint(C.buckle)).bone('chest'), { color: T.vest, roughness: 0.8 });

    // ------------------------------------------------------------------ belt with a buckle, and a cream pouch at the left hip
    const beltY = 0.25;
    const belt = shellOf(torso, 0.012, 0.001).smoothIntersect(0.004, sdf.box([0.5, 0.032, 0.5], 0.006).at(0, beltY, 0));
    const beltZ = sdf.raycast(torso, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf.box([0.042, 0.036, 0.012], 0.005).subtract(sdf.box([0.024, 0.018, 0.03], 0.002)).at(0, beltY, beltZ + 0.012);
    const pouch = sdf
      .smoothUnion(0.012, sdf.ellipsoid([0.04, 0.048, 0.034]).at(0, -0.02, 0), sdf.cylinder(0.022, 0.03, 0.008).at(0, 0.03, 0))
      .rotateZ(10)
      .at(0.15, 0.2, 0.06);
    k.body(
      'belt',
      sdf.union(belt, buckle.paint(C.buckle), pouch.paint(C.pouch)).bone('spine'),
      { color: C.belt, roughness: 0.6, detail: 0.004 },
    );

    // ------------------------------------------------------------------ fur: shaggy goat legs from the hips to the hooves, and a little tail
    const shag = (x: number, y: number, z: number) => noise.fbm(x * 40, y * 18, z * 40, 2) + 0.5 * Math.sin(Math.atan2(Math.abs(x) - 0.09, z) * 7 + y * 60);
    const legL = sdf.smoothUnion(
      0.02,
      sdf.capsule([HIP[0], 0.2, 0], [0.09, 0.13, 0.004], 0.052).bone('leg.L'),
      sdf.cone([0.09, 0.13, 0.004], [ANKLE[0], 0.055, 0.004], 0.05, 0.04).bone('shin.L'),
    );
    const hipsFur = sdf.ellipsoid([0.12, 0.05, 0.088]).at(0, 0.2, 0).bone('hips');
    const tail = sdf.chain([[0, 0.23, -0.1, 0.022], [0, 0.265, -0.135, 0.025], [0, 0.3, -0.15, 0.012]], 0.015).bone('tail');
    const fur = sdf
      .smoothUnion(0.03, hipsFur, pair(legL), tail)
      .displace(0.006, shag)
      .paintFn((x, y, z, base) => (shag(x, y, z) > 0.9 ? rgb(T.furDark) : base));
    k.body('fur', fur, { color: T.fur, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ cloven hooves
    const hoof = sdf
      .cone([0, 0.0, 0.012], [0, 0.06, 0.004], 0.046, 0.04)
      .round(0.008)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .subtract(sdf.box([0.008, 0.08, 0.05]).at(0, 0.02, 0.05))
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('hooves', pair(hoof), { color: C.hoof, roughness: 0.4, detail: 0.004 });

    // ------------------------------------------------------------------ pan pipes (rigid on `pipes`)
    // Five wooden tubes in a row, longest at the outside, bound by two cords; held upright in the fist.
    const tubes = sdf.union(
      ...[0.1, 0.088, 0.076, 0.064, 0.052].map((h, i) =>
        sdf
          .cylinder(0.009, h, 0.002)
          .subtract(sdf.cylinder(0.005, 0.02).at(0, h / 2, 0))
          .at(0.0, h / 2 - 0.03, (i - 2) * 0.019),
      ),
    );
    const cords = sdf.union(sdf.box([0.024, 0.008, 0.1], 0.003).at(0, 0.0, 0), sdf.box([0.024, 0.008, 0.1], 0.003).at(0, 0.03, 0));
    const pipesShape = sdf
      .union(tubes, cords.paint(C.woodDark))
      .paintFn((x, y, z, base) => (y > 0.0 && Math.sin(z * 330) > 0.85 ? rgb(C.woodDark) : base))
      .scale(1.3)
      .rotateY(-20)
      .at(FIST_R[0], FIST_R[1] + 0.035, FIST_R[2] + 0.01);
    k.body('pan-pipes', pipesShape, { color: C.wood, roughness: 0.6, detail: 0.003, bone: 'pipes' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys, legDrop } = motion;

    k.animation('idle', {
      duration: 2.2,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p, 2), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [2 * wave(p, 2), 8 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        'upperarm.R': { rotate: [3 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.R': { rotate: [-6 * bump(p), 0, 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.6), 0, 3 * bump(p, 1, 0.5)] },
        tail: { rotate: [6 * wave(p, 2), 0, 14 * wave(p, 2, 0.3)] },
      }),
    });

    // The villager's stride with a springy hop (a goat's step), both arms swinging, the tail flicking.
    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 8,
          heel: [ANKLE[0], 0, -0.03],
          toe: [ANKLE[0], 0, 0.05],
          hips: { at: HIPS_AT, rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          tail: { rotate: [10 + 8 * wave(p, 2), 0, 12 * s] as const },
        };
      },
    });
    k.animation('walk', stride(0.8, 0.1, 0.035, 0.58, 0.012, 22, 3));
    k.animation('run', stride(0.52, 0.15, 0.055, 0.4, 0.035, 36, 10));

    // Attack: a running butt. Wind-up (0 to 0.3): he rears back, the head up, the arms back, the
    // right foot back. Charge (0.3 to 0.46): he lunges forward 9 cm, bends at the waist and drops the
    // head, so the horns point at the target, the arms swing back. Recover (0.5 to 1).
    const LEG = KNEE[1] - ANKLE[1] + (HIP[1] - KNEE[1]);
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wind = keys(p, [[0, 0], [0.26, 1], [0.32, 0.6], [0.4, 0], [1, 0]] as const);
        const lunge = keys(p, [[0.26, 0], [0.42, 1], [0.56, 1], [0.86, 0]] as const);
        const hitK = keys(p, [[0.4, 0], [0.44, 1], [0.52, 0]] as const);
        const lean = -10 * wind + 26 * lunge;
        const step = 14 * lunge - 10 * wind;
        return {
          hips: { move: [0, -legDrop(LEG, Math.abs(step)) - 0.012 * lunge, 0.09 * lunge - 0.02 * wind], rotate: [lean * 0.3, 0, 0] },
          spine: { rotate: [lean * 0.4, 0, 0] },
          chest: { rotate: [lean * 0.4 + 3 * hitK, 0, 0] },
          neck: { rotate: [-8 * wind + 10 * lunge, 0, 0] },
          head: { rotate: [-12 * wind + 16 * lunge + 6 * hitK, 0, 0] },
          'upperarm.L': { rotate: [30 * lunge + 14 * wind, 0, 10 * lunge] },
          'forearm.L': { rotate: [-20 * lunge, 0, 0] },
          'upperarm.R': { rotate: [30 * lunge + 14 * wind, 0, -10 * lunge] },
          'forearm.R': { rotate: [-20 * lunge, 0, 0] },
          'leg.L': { rotate: [-step - lean * 0.3, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'leg.R': { rotate: [step * 0.6 - lean * 0.3 + 12 * wind, 0, 0] },
          'shin.R': { rotate: [10 * wind, 0, 0] },
          'foot.R': { rotate: [-step * 0.6 - 10 * wind, 0, 0] },
          tail: { rotate: [20 * lunge, 0, 15 * wave(p, 2)] },
        };
      },
    });

    // Hit: a blow from the front. The chest and the head snap back, the right foot steps back, the
    // arms fling out, and he comes back quickly; the tail tucks.
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.32, 0.8], [0.72, 0.1], [1, 0]] as const);
        return {
          hips: { move: [0, -legDrop(LEG, 12 * h), -0.03 * h], rotate: [-3 * h, 4 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-9 * h, -4 * h, -2 * h] },
          neck: { rotate: [-3 * h, 0, 0] },
          head: { rotate: [-8 * h, 5 * h, -4 * h] },
          'upperarm.L': { rotate: [-8 * h, 0, 18 * h] },
          'forearm.L': { rotate: [-12 * h, 0, 0] },
          'upperarm.R': { rotate: [-8 * h, 0, -18 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'leg.L': { rotate: [-9 * h, 0, 0] },
          'leg.R': { rotate: [14 * h, 0, 0] },
          'foot.L': { rotate: [9 * h, 0, 0] },
          'foot.R': { rotate: [-8 * h, 0, 0] },
          tail: { rotate: [-25 * h, 0, 0] },
        };
      },
    });

    // Death: the dryad's topple onto his left side, pivoting on the left hoof; the body lifts a
    // little as he lands, and the neck and the head bend up, so the horns prop his head.
    const FOOT_PIVOT: V3 = [ANKLE[0] + 0.02, 0, 0];
    const LIFT: V3 = [-0.02, 0.1, 0.02];
    const rotZ = (v: V3, deg: number): V3 => {
      const a = (deg * Math.PI) / 180;
      return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
    };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const st = keys(p, [[0, 0], [0.1, 1], [0.24, 0.75], [0.42, 0]] as const);
        const tt = clamp01((p - 0.24) / 0.44);
        const f = tt * tt;
        const land = bump(clamp01((p - 0.68) / 0.14));
        const lift = ease(0.42, 0.68, p);
        const rel: V3 = [HIPS_AT[0] - FOOT_PIVOT[0], HIPS_AT[1] - FOOT_PIVOT[1], 0];
        const r = rotZ(rel, -88 * f);
        const hb = ease(0.5, 0.72, p);
        return {
          hips: {
            move: [r[0] - rel[0] + LIFT[0] * lift, r[1] - rel[1] + LIFT[1] * lift + 0.012 * land, -0.03 * st + LIFT[2] * lift],
            rotate: [-4 * st, 0, -88 * f],
          },
          spine: { rotate: [-5 * st, 0, 0] },
          chest: { rotate: [-8 * st, -3 * st, 0] },
          neck: { rotate: [-3 * st, 0, 16 * hb] },
          head: { rotate: [-9 * st + 6 * hb, 4 * hb, 26 * hb + 4 * land] },
          'upperarm.L': { rotate: [-6 * st - 20 * f, 0, 14 * st - 10 * f] },
          'forearm.L': { rotate: [-20 * f, 0, 0] },
          'upperarm.R': { rotate: [4 * st - 12 * f, 0, -12 * st + 12 * f] },
          'forearm.R': { rotate: [10 * f, 0, 0] },
          'leg.L': { rotate: [-6 * st - 15 * f, 0, 0] },
          'leg.R': { rotate: [14 * st * (1 - f) - 30 * f, 0, 0] },
          'foot.L': { rotate: [6 * st + 15 * f, 0, 0] },
          'foot.R': { rotate: [-8 * st + 12 * f, 0, 0] },
          tail: { rotate: [-10 * f, 0, 20 * f] },
        };
      },
    });
  },
});
